import "expect-even-more-jest";
import { promises as fs } from "fs";
import * as path from "path";
import { Sandbox } from "../src";
import * as faker from "faker";
import { promises as fsPromises } from "fs";
import { create } from "./common";

const { readdir, readFile } = fsPromises;

describe(`filesystem-sandbox`, () => {
    describe(`run`, () => {
        describe(`given function only`, () => {
            it(`should run the provided function in the context of the sandbox folder`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create();
                await sandbox.writeFile("__test__", "some data");
                // Act
                const result = await sandbox.run(
                    () => readdir(".")
                );
                // Assert
                expect(result)
                    .toEqual(["__test__"]);
            });
        });
        describe(`given relative path`, () => {
            it(`should run the provided function within that relative path`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create(),
                    folder = faker.random.alphaNumeric(10),
                    contents = faker.random.alphaNumeric(10);
                await sandbox.mkdir(folder);
                await sandbox.writeFile(path.join(folder, "README.md"), contents);
                // Act
                const result = await sandbox.run(
                    () => readFile("README.md", { encoding: "utf8" }),
                    folder
                );
                // Assert
                expect(result)
                    .toEqual(contents);
            });

            it(`should throw if the relative path steps outside the sandbox`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create(),
                    folder = faker.random.alphaNumeric(10),
                    contents = faker.random.alphaNumeric(10);
                await sandbox.mkdir(folder);
                await sandbox.writeFile(path.join(folder, "README.md"), contents);
                // Act
                await expect(sandbox.run(
                    () => readFile("README.md", { encoding: "utf8" }),
                    "../otherFolder"
                )).rejects.toThrow(/not inside sandbox/);
                // Assert
            });
        });
    });
});
