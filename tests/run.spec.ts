import "expect-even-more-jest";
import * as path from "path";
import { Sandbox } from "../src";
import { faker } from "@faker-js/faker";
import { ls, readTextFile } from "yafs";

describe(`filesystem-sandbox`, () => {
    describe(`run`, () => {
        describe(`given function only`, () => {
            it(`should run the provided function in the context of the sandbox folder`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create();
                // Act
                const result = await sandbox.run(
                    () => process.cwd()
                );
                // Assert
                expect(result)
                    .toEqual(sandbox.path);
            });
            it(`should run the provided function in the context of the sandbox folder`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create();
                await sandbox.writeFile("__test__", faker.word.words());
                // Act
                const result = await sandbox.run(
                    () => ls(".")
                );
                // Assert
                expect(result)
                    .toEqual([ "__test__" ]);
            });
        });
        describe(`given relative path`, () => {
            it(`should run the provided function within that relative path`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create(),
                    folder = faker.string.alphanumeric(10),
                    contents = faker.string.alphanumeric(10);
                await sandbox.mkdir(folder);
                await sandbox.writeFile(path.join(folder, "README.md"), contents);
                // Act
                const result = await sandbox.run(
                    () => readTextFile("README.md"),
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
                    folder = faker.string.alphanumeric(10),
                    contents = faker.string.alphanumeric(10);
                await sandbox.mkdir(folder);
                await sandbox.writeFile(path.join(folder, "README.md"), contents);
                // Act
                await expect(sandbox.run(
                    () => readTextFile("README.md"),
                    "../otherFolder"
                )).rejects.toThrow(/not inside sandbox/);
                // Assert
            });
        });

        describe(`exec`, () => {
            it(`should be like run, but executes the given command`, async () => {
                // Arrange
                const
                    sandbox = await Sandbox.create();
                // Act
                const result = await sandbox.exec("pwd");
                // Assert
                expect(result)
                    .toExist();
                expect(result.stdout[0])
                    .toExist();
                expect(result.stdout[0].trim())
                    .toEqual(sandbox.fullPathFor("."));
            });
        });
    });
});
