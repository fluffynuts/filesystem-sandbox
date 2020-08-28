import rimraf from "rimraf";
import { basePrefix } from "../src";

try {
    rimraf.sync(basePrefix);
} catch (e) {
}
