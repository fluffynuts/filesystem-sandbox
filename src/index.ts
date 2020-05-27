import { promises as fs } from "fs";
if (!fs) {
  throw new Error("Yer node is olde! filesystem-sandboxes requires a Node with fs.promises");
}

import { v4 as uuid } from "uuid";
import * as path from "path";
import { sync as mkdir } from "mkdirp";
import { sync as _rimraf } from "rimraf";

const { writeFile, readFile } = fs;

function rimraf(p: string): Promise<void> {
  return new Promise((resolve, reject) => {
      try {
        _rimraf(p);
        resolve();
      } catch (e) {
        reject(e);
      }
  });
}

export const basePrefix = "__sandboxes__";
export class Sandbox {
  private readonly _path: string;

  get path() {
    return this._path;
  }

  constructor(at?: string) {
    this._path = path.join((at || process.cwd()), basePrefix, uuid());
    mkdir(this._path);
  }

  async destroy(dir: string) {
      await rimraf(dir);
  }

  async writeTextFile(at: string, contents: string) {
    const fullPath = this.fullPathFor(at);
    await writeFile(
      fullPath,
      contents, { encoding: "utf8" }
    );
    return fullPath;
  }

  async readTextFile(at: string) {
    return readFile(
      this.fullPathFor(at),
      { encoding: "utf8" }
    );
  }

  fullPathFor(relativePath: string) {
    return path.join(this._path, relativePath);
  }

  public static async destroyAll() {
    await rimraf(path.join(basePrefix));
  }

  public static async create(at: string) {
    return new Sandbox(at);
  }
}

