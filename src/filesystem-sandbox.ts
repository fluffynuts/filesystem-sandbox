import { spawn as _spawn, SpawnOptions } from "child_process";
import { BaseEncodingOptions, Mode, OpenMode, PathLike, promises as fs, StatsBase } from "fs";
import * as os from "os";
// require for "path" produces the cleanest js output
import path from "path";
import { FileHandle } from "fs/promises";
import { uuid } from "./uuid";
import { rmSync, mkdir, rm, mkdirSync, writeTextFile } from "yafs";

if (!fs) {
    throw new Error("Yer node is olde! filesystem-sandboxes requires a Node with fs.promises");
}

const { writeFile, readFile, stat, appendFile } = fs;

export type Func<T> = () => T;
export type AsyncFunc<T> = () => Promise<T>;

async function isFolder(p: string): Promise<boolean> {
    try {
        const st = await stat(p);
        return st && st.isDirectory();
    } catch (e) {
        return false;
    }
}

async function readdir(p: string) {
    const exists = await isFolder(p);
    if (!exists) {
        return [];
    }
    return await fs.readdir(p);
}

export const basePrefix = "__sandboxes__";
let baseTarget = os.tmpdir();

const sandboxes: Sandbox[] = [];

type FileWriter = (path: PathLike | FileHandle, data: string | Uint8Array, options?: BaseEncodingOptions & { mode?: Mode, flag?: OpenMode } | BufferEncoding | null) => Promise<void>;

async function writeData(
    fullPath: string,
    contents: string | Buffer | string[],
    writeFunction: FileWriter
): Promise<string> {
    const
        options = contents instanceof Buffer
            ? undefined
            : { encoding: "utf8" } as BaseEncodingOptions;
    if (Array.isArray(contents)) {
        contents = contents.join("\n");
    }
    await writeFunction(
        fullPath,
        contents,
        options
    );
    return fullPath;
}

export class Sandbox {
    private readonly _path: string;
    private readonly _base: string;
    private readonly _at: string | undefined;

    public get path() {
        return this._path;
    }

    constructor(at?: string) {
        this._at = at;
        this._base = path.join(at || baseTarget, basePrefix);
        this._path = path.join(this._base, uuid());
        mkdirSync(this._path);
        sandboxes.push(this);
    }

    public async destroy() {
        await this.tryDestroySelf();
        await this.tryDestroyContainer();
        await this.tryDestroyAt();
    }

    private async tryDestroyAt() {
        if (!this._at) {
            return;
        }
        await this.destroyFolderIfEmpty(this._at);
    }

    private async tryDestroyContainer() {
        await this.destroyFolderIfEmpty(this._base);
    }

    private async destroyFolderIfEmpty(p: string) {
        const contents = await readdir(p);
        if (!contents.length) {
            await rm(p);
        }
    }

    private async tryDestroySelf() {
        const myIndex = sandboxes.indexOf(this);
        if (myIndex > -1) {
            sandboxes.splice(myIndex, 1);
        }
        await rm(this._path);
    }

    public async writeFile(at: string, contents: string | Buffer | string[]): Promise<string> {
        try {
            const fullPath = this.fullPathFor(at);
            await mkdir(path.dirname(fullPath));
            contents = contents || "";
            if (typeof contents === "string") {
                await writeFile(fullPath, contents);
            } else {
                await writeTextFile(fullPath, contents as string[] | string);
            }
            return fullPath;
        } catch (e: any) {
            throw new Error(`Unable to write file at ${ at }: ${ e.message || e }`);
        }
    }

    public async appendFile(at: string, contents: string | Buffer | string[]) {
        try {
            await this.mkdir(path.dirname(at));
            return await writeData(
                this.fullPathFor(at),
                contents,
                appendFile
            );
        } catch (e: any) {
            throw new Error(`Unable to append to file at ${ at }: ${ e.message || e }`);
        }
    }

    public async mkdir(name: string): Promise<string> {
        const fullPath = path.join(this._path, name);
        await mkdir(fullPath);
        return fullPath;
    }

    private resolveRelativePath(at: string): string {
        if (!path.isAbsolute(at)) {
            return at;
        }
        const result = path.relative(this._path, at);
        if (result.startsWith("..")) {
            throw new Error(`${ at } is outside the sandbox at ${ this._path }`);
        }
        return result;
    }

    public async readTextFile(at: string): Promise<string> {
        return readFile(
            this.fullPathFor(at),
            { encoding: "utf8" }
        );
    }

    public async readFile(at: string): Promise<Buffer> {
        return readFile(this.fullPathFor(at));
    }

    public fullPathFor(relativePath: string, ...parts: string[]) {
        relativePath = this.resolveRelativePath(relativePath);
        return path.join(this._path, relativePath, ...parts);
    }

    public async stat(at: string): Promise<StatsBase<any> | null> {
        at = this.resolveRelativePath(at);
        try {
            return await fs.stat(
                this.fullPathFor(at)
            );
        } catch (e) {
            return null;
        }
    }

    public async folderExists(at: string): Promise<boolean> {
        at = this.resolveRelativePath(at);
        return this.runOnStat(
            at,
            st => !!st && st.isDirectory()
        );
    }

    public async fileExists(at: string): Promise<boolean> {
        at = this.resolveRelativePath(at);
        return this.runOnStat(
            at,
            st => !!st && st.isFile()
        );
    }

    private async runOnStat<T>(relativePath: string, fn: ((st: StatsBase<any> | null) => T)): Promise<T> {
        const st = await this.stat(
            relativePath
        );
        return fn(st);
    }

    public async run<T>(
        fn: Func<T> | AsyncFunc<T>,
        relativePath?: string
    ): Promise<T> {
        const start = process.cwd();
        try {
            const target = relativePath
                ? path.resolve(path.join(this.path, relativePath))
                : this.path;
            this._validatePathInsideSandbox(target);
            process.chdir(target);
            return await fn();
        } finally {
            process.chdir(start);
        }
    }

    public async exec(
        command: string,
        args?: string[],
        options?: SpawnOptions
    ): Promise<ProcessData> {
        return await this.run(() => {
            const
                spawnArgs = args || [] as string[],
                spawnOptions = options || {} as SpawnOptions;
            return new Promise<ProcessData>((resolve, reject) => {
                const
                    child = _spawn(command, spawnArgs, spawnOptions),
                    result: ProcessData = {
                        stdout: [],
                        stderr: [],
                        code: -1
                    };
                child.stderr?.on("data", d => {
                    result.stderr.push(d.toString());
                })
                child.stdout?.on("data", d => {
                    result.stdout.push(d.toString());
                });
                child.on("close", code => {
                    result.code = code;
                    return code
                        ? reject(makeSpawnErrorFor(result, command, args, options))
                        : resolve(result);
                });
            });
        });
    }

    private _validatePathInsideSandbox(t: string) {
        if (t.startsWith(this.path)) {
            return;
        }
        throw new Error(`${ t } is not inside sandbox at ${ this.path }`);
    }

    /**
     * Destroys all sandboxes created in this process up until now
     */
    public static async destroyAll() {
        const toDestroy = sandboxes.splice(0, sandboxes.length);
        for (const sandbox of toDestroy) {
            await sandbox.destroy();
        }
    }

    /**
     * Destroys the default base folder for sandboxes -- useful as a once-off
     * run before all tests to ensure that there are no lingering sandboxes
     * - cannot destroy sandboxes in custom paths
     */
    public static async destroyAny() {
        const target = path.join(baseTarget, basePrefix);
        await rm(target);
    }

    public static async create(at?: string) {
        return new Sandbox(at);
    }

    public static async setBaseTargetToCurrentWorkingDirectory() {
        await this.setBaseTarget(process.cwd());
    }

    public static async setBaseTargetToSystemTempFolder() {
        await this.setBaseTarget(os.tmpdir())
    }

    public static async setBaseTarget(to: string) {
        if (!(await isFolder(to))) {
            await mkdir(to)
        }
        baseTarget = to;
    }
}

function makeSpawnErrorFor(
    result: ProcessData,
    command: string,
    args: string[] | undefined,
    options: SpawnOptions | undefined
): SpawnError {
    const e = new Error(`Error exit code ${ result.code } for: ${ command } ${ (args || []).join(" ") }`);
    return {
        ...e,
        result,
        command,
        args,
        options
    };
}

export interface ProcessData {
    stdout: string[];
    stderr: string[];
    code: number;
}

export interface SpawnError extends Error {
    command: string;
    args: string[] | undefined;
    options: SpawnOptions | undefined,
    result: ProcessData;
}
