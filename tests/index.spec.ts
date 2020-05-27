import "./test-helpers";
import * as path from "path";
import { Sandbox, basePrefix } from "../src";

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
    });

    function create(at?: string) {
        return new Sandbox(at)
    }
});
