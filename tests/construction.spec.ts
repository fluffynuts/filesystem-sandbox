import "expect-even-more-jest";
import path from "path";
import os from "os";
import { faker } from "@faker-js/faker";
import { create } from "./common";

describe(`filesystem-sandbox`, () => {
    const base = path.join(os.tmpdir(), "filesystem-sandbox-destruction-tests");
    describe(`construction`, () => {
        describe(`when given no at`, () => {
            it(`should create a sandbox dir under the system tempdir`, async () => {
                // Arrange
                expect(base)
                    .not.toBeFolder();
                // Act
                const sut = create(base);
                // Assert
                expect(base)
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
});
