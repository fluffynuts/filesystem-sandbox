import "expect-even-more-jest";
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
                result[i] = faker.random.number({ min: 0, max: 255 });
            }
            return result;
        }
    });

    describe(`file ops`, () => {
        it(`should be able to tell if a file exists`, async () => {
            // Arrange
            const
                sut = create(),
                existingFolder = faker.random.alphaNumeric(10),
                existingFile = faker.random.alphaNumeric(10),
                doesNotExist = faker.random.alphaNumeric(10);
            await sut.mkdir(existingFolder);
            await sut.writeFile(existingFile, faker.random.words());
            // Act
            const result1 = await sut.fileExists(existingFolder);
            const result2 = await sut.fileExists(existingFile);
            const result3 = await sut.fileExists(doesNotExist);

            // Assert
            expect(result1)
                .toBeFalse();
            expect(result2)
                .toBeTrue();
            expect(result3)
                .toBeFalse();
        });

        it(`should be able to tell if a folder exists`, async () => {
            // Arrange
            const
                sut = create(),
                existingFolder = faker.random.alphaNumeric(10),
                existingFile = faker.random.alphaNumeric(10),
                doesNotExist = faker.random.alphaNumeric(10);
            await sut.mkdir(existingFolder);
            await sut.writeFile(existingFile, faker.random.words());
            // Act
            const result1 = await sut.folderExists(existingFolder);
            const result2 = await sut.folderExists(existingFile);
            const result3 = await sut.folderExists(doesNotExist);

            // Assert
            expect(result1)
                .toBeTrue();
            expect(result2)
                .toBeFalse();
            expect(result3)
                .toBeFalse();
        });

        it(`should be able to provide a full stat to an existing item`, async () => {
            // Arrange
            const
                sut = create(),
                shouldExist = faker.random.alphaNumeric(15),
                shouldNotExist = faker.random.alphaNumeric(15),
                fileContents = faker.random.words();
            await sut.writeFile(shouldExist, fileContents);
            // Act
            const stat1 = await sut.stat(shouldExist);
            const stat2 = await sut.stat(shouldNotExist);
            // Assert
            expect(stat1)
                .toExist();
            if (stat1) {
                // appease the ts complainer
                expect(stat1.size)
                    .toEqual(fileContents.length);
            }
            expect(stat2)
                .toBeNull();
        });
    });

    beforeAll(() => {
        // in case there's something hanging about from a prior test run
        try {
            rimraf.sync(basePrefix);
        } catch (e) {
        }
    });

    let sandboxes: Sandbox[] = [];
    afterEach(async () => {
        const toDestroy = sandboxes.splice(0, sandboxes.length);
        for (let sandbox of toDestroy) {
            await sandbox.destroy();
        }
    });

    function create(at?: string) {
        const result = new Sandbox(at)
        sandboxes.push(result);
        return result;
    }
});
