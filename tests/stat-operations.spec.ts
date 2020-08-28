import "expect-even-more-jest";
import * as faker from "faker";
import { create } from "./common";

describe(`filesystem-sandbox`, () => {
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
});
