import { rmSync } from "yafs";
import { basePrefix } from "../src";

try {
    rmSync(basePrefix);
} catch (e) {
}
