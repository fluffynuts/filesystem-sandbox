import "./test-helpers";
import { promises as fs } from "fs";
import * as path from "path";
import { basePrefix, Sandbox } from "../src";
import * as faker from "faker";
import rimraf from "rimraf";

describe(`filesystem-sandbox`, () => {
    describe(`construction`, () => {
        describe(`when given no at`, () => {
            it(`should create a sandbox dir under the current working folder`, async () => {
                // Arrange
                const
                    expectedBase = path.join(process.cwd(), basePrefix);
                expect(expectedBase)
                    .not.toBeFolder();
                // Act
                const sut = create();
                // Assert
                expect(expectedBase)
                    .toBeFolder();
                const somePath = sut.fullPathFor("moo");
                expect(path.dirname(somePath))
                    .toBeFolder();
            });
        });
        describe(`when given at`, () => {
            it(`should create a sandbox dir under the given folder`, async () => {
                // Arrange
                const customBase = path.join(__dirname, faker.random.alphaNumeric(10));
                // Act
                const sut = create(customBase);
                // Assert
                expect(sut.path)
                    .toStartWith(customBase);
                expect(customBase)
                    .toBeFolder();
            });
        });
        describe(`destroy`, () => {
            it(`should destroy the sandbox entirely`, async () => {
                // Arrange
                const sut = create();
                expect(sut.path)
                    .toBeFolder();
                // Act
                await sut.destroy();
                // Assert
                expect(sut.path)
                    .not.toBeFolder();
            });
            it(`should remove the __sandboxes__ folder when none left`, async () => {
                // Arrange
                const
                    sut1 = create(),
                    sut2 = create();
                // Act
                await sut1.destroy();
                expect(sut1.path)
                    .not.toBeFolder();
                expect(sut2.path)
                    .toBeFolder();
                expect(path.dirname(sut1.path))
                    .toBeFolder();
                await sut2.destroy();
                // Assert
                expect(sut2.path)
                    .not.toBeFolder();
                expect(path.dirname(sut2.path))
                    .not.toBeFolder();
            });
        });

        describe(`destroyAll`, () => {
            it(`should destroy all sandboxes`, async () => {
                // Arrange
                const
                    sut1 = create(),
                    sut2 = create();
                expect(sut1.path)
                    .toBeFolder();
                expect(sut2.path)
                    .toBeFolder();
                // Act
                await Sandbox.destroyAll();
                // Assert
                expect(sut1.path)
                    .not.toBeFolder()
                expect(sut2.path)
                    .not.toBeFolder();
                expect(path.dirname(sut1.path))
                    .not.toBeFolder();
            });
        });

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

            function randomBytes() {
                const
                    length = faker.random.number({ min: 500, max: 1024 }),
                    result = new Array(length);

                for (let i = 0; i < length; i++) {
                    result[i] = faker.random.number({ min: 0, max: 255});
                }
                return result;
            }
        });
    });

    beforeAll(() => {
        // in case there's something hanging about from a prior test run
        rimraf.sync(basePrefix);
    });
    afterEach(async () => {
        await Sandbox.destroyAll();
    });

    function create(at?: string) {
        return new Sandbox(at)
    }
});
