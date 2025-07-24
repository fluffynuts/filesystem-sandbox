import "expect-even-more-jest";
import * as path from "path";
import { Sandbox } from "../src";
import { create } from "./common";
import { folderExists, rm, mkdir } from "yafs";
import * as os from "os";

describe(`filesystem-sandbox`, () => {
    // since this test can run in parallel with other tests
    // destruction could be interfered-with; so we'll make this
    // work in its own little area
    const base = path.join(os.tmpdir(), "filesystem-sandbox-destruction-tests");
    beforeAll(async () => {
        if (await folderExists(base)) {
            await rm(base);
        }
        await mkdir(base);
    });
    describe(`destroy`, () => {
        it(`should destroy the sandbox entirely`, async () => {
            // Arrange
            const sut = create(base);
            expect(sut.path)
                .toBeFolder();
            // Act
            await sut.destroy();
            // Assert
            expect(sut.path)
                .not.toBeFolder();
        });
        it(`should remove the base folder when none left`, async () => {
            // Arrange
            const
                sut1 = create(base),
                sut2 = create(base);
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
        beforeEach(async () => await Sandbox.destroyAny());
        it(`should destroy all sandboxes`, async () => {
            // Arrange
            const
                sut1 = create(base),
                sut2 = create(base);
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
});
