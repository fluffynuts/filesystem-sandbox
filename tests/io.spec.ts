import { promises as fs } from "fs";
import * as path from "path";
import { Sandbox } from "../src";
import { fakerEN as faker } from "@faker-js/faker";
import { create } from "./common";
import { readTextFile, writeTextFile, stat, fileExists, folderExists, folderName } from "yafs";
import { sleep } from "expect-even-more-jest";

describe(`filesystem-sandbox`, () => {
    describe(`folders`, () => {
        it(`should be able to create a folder`, async () => {
            // Arrange
            const
                name = faker.string.alphanumeric(10),
                sut = create();
            // Act
            const folder = await sut.mkdir(name);
            // Assert
            expect(folder)
                .toBeFolder();
            expect(path.basename(folder))
                .toEqual(name);
        });
    });

    describe(`file io`, () => {
        it(`should be able to write a text file`, async () => {
            // Arrange
            const
                data = faker.word.words(50),
                filename = faker.string.alphanumeric(10),
                sut = create();
            // Act
            const fullpath = await sut.writeFile(filename, data);
            // Assert
            expect(fullpath)
                .toBeFile();
            const writtenData = await readTextFile(fullpath);
            expect(writtenData)
                .toEqual(data);
        });

        it(`should be able to write a text file given lines`, async () => {
            // Arrange
            const
                data = [faker.word.words(50), faker.word.words(50)],
                expected = data.join("\n"),
                filename = faker.string.alphanumeric(10),
                sut = create();
            // Act
            const fullpath = await sut.writeFile(filename, data);
            // Assert
            expect(fullpath)
                .toBeFile();
            const writtenData = await readTextFile(fullpath);
            expect(writtenData)
                .toEqual(expected);
        });

        it(`should be able to read a text file by relative path`, async () => {
            // Arrange
            const
                data = faker.word.words(50),
                filename = faker.string.alphanumeric(10),
                sut = create();
            // Act
            const
                fullpath = await sut.writeFile(filename, data),
                written = await readTextFile(fullpath),
                updated = written + faker.word.words(10);
            await writeTextFile(fullpath, updated);
            const result = await sut.readTextFile(filename);
            // Assert
            expect(result)
                .toEqual(updated);
        });

        it(`should be able to write a binary file`, async () => {
            // Arrange
            const
                data = randomBytes(),
                filename = faker.string.alphanumeric(10),
                buffer = Buffer.from(data),
                sut = create();
            // Act
            const
                fullPath = await sut.writeFile(filename, buffer),
                result = await fs.readFile(fullPath);
            // Assert
            expect(result)
                .toEqual(buffer);
        });

        it(`should be able to read a binary file`, async () => {
            // Arrange
            const
                filename = faker.string.alphanumeric(10),
                buffer = Buffer.from(randomBytes()),
                newData = Buffer.from(randomBytes()),
                sut = create();
            // Act
            const
                fullPath = await sut.writeFile(filename, buffer),
                written = await fs.readFile(fullPath),
                updated = Buffer.concat([written, newData]);
            await fs.writeFile(fullPath, updated);
            const result = await sut.readFile(filename);
            // Assert
            expect(result)
                .toEqual(updated);
        });

        it(`should create the supporting folders if necessary`, async () => {
            // Arrange
            const
                sut = create(),
                folder = faker.string.alphanumeric(10),
                file = faker.string.alphanumeric(10),
                fullPath = sut.fullPathFor(folder, file);
            // Act
            await sut.writeFile(path.join(folder, file), faker.word.words());
            // Assert
            expect(fullPath)
                .toBeFile();
        });

        it(`should resolve absolute paths within the sandbox appropriately`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                folder = "folder",
                file1 = "file1.json",
                file2 = "file2.js",
                otherFile = "file2.txt",
                fullFile1 = sandbox.fullPathFor(folder, file1),
                fullFile2 = sandbox.fullPathFor(folder, file2);
            await sandbox.writeFile(fullFile1, faker.word.words());
            await sandbox.writeFile(fullFile2, faker.word.words());
            await sandbox.writeFile(otherFile, faker.word.words());
            // Act
            // Assert
            expect(await sandbox.fileExists(fullFile1))
                .toBeTrue();
            expect(await sandbox.fileExists(fullFile2))
                .toBeTrue();
            expect(await sandbox.fileExists(otherFile))
                .toBeTrue();
        });

        it(`should be able to append a binary blob`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                fileName = faker.string.alphanumeric(10),
                initialData = Buffer.from("hello, "),
                moreData = Buffer.from("world!");
            // Act
            await sandbox.writeFile(fileName, initialData);
            await sandbox.appendFile(fileName, moreData);
            const result = await sandbox.readFile(fileName);
            // Assert
            expect(result)
                .toEqual(Buffer.from("hello, world!"));
        });

        it(`should be able to append a string`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                fileName = faker.string.alphanumeric(10),
                initialData = faker.word.words(),
                moreData = faker.word.words();
            // Act
            await sandbox.writeFile(fileName, initialData);
            await sandbox.appendFile(fileName, moreData);
            const result = await sandbox.readTextFile(fileName);
            // Assert
            expect(result)
                .toEqual(`${initialData}${moreData}`);
        });

        it(`should create the file if it doesn't exist`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                fileName = faker.string.alphanumeric(10),
                data = faker.word.words();
            // Act
            await sandbox.appendFile(fileName, data);
            const result = await sandbox.readTextFile(fileName);
            // Assert
            expect(result)
                .toEqual(data);
        });

        it(`should create supporting folders if they don't exist`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                folder1 = faker.string.alphanumeric(10),
                folder2 = faker.string.alphanumeric(10),
                fileName = faker.string.alphanumeric(10),
                relPath = path.join(folder1, folder2, fileName),
                data = faker.word.words();
            // Act
            await sandbox.appendFile(relPath, data);
            const result = await sandbox.readTextFile(relPath);
            // Assert
            expect(result)
                .toEqual(data);
        });

        it(`should be able to touch a file into existence`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                fileName = faker.string.alphanumeric(),
                fullPath = sandbox.fullPathFor(fileName);
            expect(fullPath)
                .not.toBeFile();
            // Act
            await sandbox.touch(fileName);
            // Assert
            expect(fullPath)
                .toBeFile();
            expect(fullPath)
                .toHaveContents("");
        });

        it(`should not trash an existing file when touching it`, async () => {
            // Arrange
            const
                sandbox = await Sandbox.create(),
                expected = faker.word.words(),
                fileName = faker.string.alphanumeric(),
                fullPath = await sandbox.writeFile(fileName, expected),
                st1 = await stat(fullPath);
            expect(st1)
                .toExist();
            // Act
            await sleep(1000);
            await sandbox.touch(fileName);
            // Assert
            expect(fullPath)
                .toHaveContents(expected);
            await sleep(1000);
            const st2 = await stat(fullPath);
            if (!st2) {
                console.error(`could not stat: ${fullPath}`)
            }
            expect(st2)
                .toExist();
            expect(st2!.mtimeMs)
                .toBeGreaterThan(st1!.mtimeMs);
            expect(st2!.mtimeMs)
                .toBeLessThan(Date.now());
        });

        function randomBytes() {
            const
                length = faker.number.int({ min: 500, max: 1024 }),
                result = new Array(length);

            for (let i = 0; i < length; i++) {
                result[i] = faker.number.int({ min: 0, max: 255 });
            }
            return result;
        }
    });
    afterAll(async () => {
        await Sandbox.destroyAll();
    });
});
