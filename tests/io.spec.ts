import "expect-even-more-jest";
import { promises as fs } from "fs";
import * as path from "path";
import { Sandbox } from "../src";
import * as faker from "faker";
import { create } from "./common";

describe(`filesystem-sandbox`, () => {
    describe(`folders`, () => {
        it(`should be able to create a folder`, async () => {
            // Arrange
            const
                name = faker.random.alphaNumeric(10),
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
                data = faker.random.words(50),
                filename = faker.random.alphaNumeric(10),
                sut = create();
            // Act
            const fullpath = await sut.writeFile(filename, data);
            // Assert
            expect(fullpath)
                .toBeFile();
            const writtenData = await fs.readFile(fullpath, { encoding: "utf8" });
            expect(writtenData)
                .toEqual(data);
        });

        it(`should be able to write a text file given lines`, async () => {
            // Arrange
            const
                data = [faker.random.words(50), faker.random.words(50)],
                expected = data.join("\n"),
                filename = faker.random.alphaNumeric(10),
                sut = create();
            // Act
            const fullpath = await sut.writeFile(filename, data);
            // Assert
            expect(fullpath)
                .toBeFile();
            const writtenData = await fs.readFile(fullpath, { encoding: "utf8" });
            expect(writtenData)
                .toEqual(expected);
        });

        it(`should be able to read a text file by relative path`, async () => {
            // Arrange
            const
                data = faker.random.words(50),
                filename = faker.random.alphaNumeric(10),
                sut = create();
            // Act
            const
                fullpath = await sut.writeFile(filename, data),
                written = await fs.readFile(fullpath, { encoding: "utf8" }),
                updated = written + faker.random.words(10);
            await fs.writeFile(fullpath, updated, { encoding: "utf8" });
            const result = await sut.readTextFile(filename);
            // Assert
            expect(result)
                .toEqual(updated);
        });

        it(`should be able to write a binary file`, async () => {
            // Arrange
            const
                data = randomBytes(),
                filename = faker.random.alphaNumeric(10),
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
                filename = faker.random.alphaNumeric(10),
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
                folder = faker.random.alphaNumeric(10),
                file = faker.random.alphaNumeric(10),
                fullPath = sut.fullPathFor(folder, file);
            // Act
            await sut.writeFile(path.join(folder, file), faker.random.words());
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
            await sandbox.writeFile(fullFile1, faker.random.words());
            await sandbox.writeFile(fullFile2, faker.random.words());
            await sandbox.writeFile(otherFile, faker.random.words());
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
                fileName = faker.random.alphaNumeric(10),
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
                fileName = faker.random.alphaNumeric(10),
                initialData = faker.random.words(),
                moreData = faker.random.words();
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
                fileName = faker.random.alphaNumeric(10),
                data = faker.random.words();
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
                folder1 = faker.random.alphaNumeric(10),
                folder2 = faker.random.alphaNumeric(10),
                fileName = faker.random.alphaNumeric(10),
                relPath = path.join(folder1, folder2, fileName),
                data = faker.random.words();
            // Act
            await sandbox.appendFile(relPath, data);
            const result = await sandbox.readTextFile(relPath);
            // Assert
            expect(result)
                .toEqual(data);
        });

        function randomBytes() {
            const
                length = faker.random.number({ min: 500, max: 1024 }),
                result = new Array(length);

            for (let i = 0; i < length; i++) {
                result[i] = faker.random.number({ min: 0, max: 255 });
            }
            return result;
        }
    });

});
