import { create } from "./common";
import faker from "faker";
import path from "path";

describe(`fullPathFor`, () => {
    it(`should provide the path of a single-level relative within the sandbox`, async () => {
        // Arrange
        const
            sut = create(),
            relative = faker.random.alphaNumeric(10);
        // Act
        const result = sut.fullPathFor(relative);
        // Assert
        expect(path.dirname(result))
            .toEqual(sut.path);
        expect(path.basename(result))
            .toEqual(relative);
    });
    it(`should be able to accept multiple parts`, async () => {
        // Arrange
        const
            sut = create(),
            rel1 = faker.random.alphaNumeric(10),
            rel2 = faker.random.alphaNumeric(10);
        // Act
        const result = sut.fullPathFor(rel1, rel2);
        // Assert
        expect(path.dirname(result))
            .toEqual(path.join(sut.path, rel1));
        expect(path.basename(result))
            .toEqual(rel2);
    });
});

