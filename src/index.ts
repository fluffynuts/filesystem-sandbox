import { BaseEncodingOptions, promises as fs } from "fs";

if (!fs) {
    throw new Error("Yer node is olde! filesystem-sandboxes requires a Node with fs.promises");
}
// require for "path" produces the cleanest js output
const path = require("path");
import { v4 as uuid } from "uuid";
import { sync as mkdir } from "mkdirp";
import { sync as _rimraf } from "rimraf";

const { writeFile, readFile, stat } = fs;

async function isFolder(p: string): Promise<boolean> {
    try {
        const st = await stat(p);
        return st && st.isDirectory();
    } catch (e) {
        return false;
    }
}

async function rimraf(p: string): Promise<void> {
    if (!(await isFolder(p))) {
        return;
    }
    return new Promise((resolve, reject) => {
        try {
            _rimraf(p, { maxBusyTries: 5 });
            resolve();
        } catch (e) {
            reject(e);
        }
    });
}

export const basePrefix = "__sandboxes__";

const sandboxes: Sandbox[] = [];

export class Sandbox {
    private readonly _path: string;
    private readonly _base: string;

    get path() {
        return this._path;
    }

    constructor(at?: string) {
        this._base = path.join(at || process.cwd(), basePrefix);
        this._path = path.join(this._base, uuid());
        mkdir(this._path);
        sandboxes.push(this);
    }

    public async destroy() {
        const myIndex = sandboxes.indexOf(this);
        if (myIndex > -1) {
            sandboxes.splice(myIndex, 1);
        }
        await rimraf(this._path);
        const contents = await fs.readdir(this._base);
        if (!contents.length) {
            await rimraf(this._base);
        }
    }

    async writeFile(at: string, contents: string | Buffer) {
        const
            fullPath = this.fullPathFor(at),
            options = contents instanceof Buffer
                ? undefined
                : { encoding: "utf8" } as BaseEncodingOptions;
        await writeFile(
            fullPath,
            contents,
            options
        );
        return fullPath;
    }

    async readTextFile(at: string): Promise<string> {
        return readFile(
            this.fullPathFor(at),
            { encoding: "utf8" }
        );
    }

    async readFile(at: string): Promise<Buffer> {
        return readFile(this.fullPathFor(at));
    }

    fullPathFor(relativePath: string) {
        return path.join(this._path, relativePath);
    }

    /**
     * Destroys all sandboxes created in this process up until now
     */
    public static async destroyAll() {
        const toDestroy = sandboxes.splice(0, sandboxes.length);
        for (let sandbox of toDestroy) {
            await sandbox.destroy();
        }
    }

    /**
     * Destroys the default base folder for sandboxes -- useful as a once-off
     * run before all tests to ensure that there are no lingering sandboxes
     * - cannot destroy sandboxes in custom paths
     */
    public static async destroyAny() {
        const target = path.join(process.cwd(), basePrefix);
        await rimraf(target);
    }

    public static async create(at: string) {
        return new Sandbox(at);
    }
}

