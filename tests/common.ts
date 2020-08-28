import { Sandbox } from "../src";

let sandboxes: Sandbox[] = [];
afterEach(async () => {
    const toDestroy = sandboxes.splice(0, sandboxes.length);
    for (let sandbox of toDestroy) {
        await sandbox.destroy();
    }
});

export function create(at?: string) {
    const result = new Sandbox(at)
    sandboxes.push(result);
    return result;
}
