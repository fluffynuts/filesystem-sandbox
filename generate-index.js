// this helper script was copied in from newts to automatically
// generate your index.ts in your src folder. Once that is transpiled,
// you'll get an index.js and index.d.ts in the dist folder and the
// initially-generated index.js and index.d.ts in the base of your
// package will defer to these, providing for a clean import of
// everything exported from base files in your src folder
const path = require("path");
const fs = require("fs");

function readdir(at) {
  return new Promise((resolve, reject) => {
    fs.readdir(at, (err, result) => err ? reject(err) : resolve(result));
  });
}

function writeFile(at, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(at, contents, { encoding: "utf-8" }, err =>
      err ? reject(err) : resolve()
    )
  });
}

(async () => {
  const cwdContents = await readdir(".");
  if (cwdContents.indexOf("src") === -1) {
    throw new Error("No local 'src' folder -- nothing to do");
  }
  const
    tsFiles = (await readdir("src"))
      .filter(f => f.match(/\.ts$/)),
    target = path.resolve(path.join("src", "index.ts")),
    output = tsFiles.sort()
      .map(f => `export * from "./${f.replace(/\.ts$/, "")}";`)
      .join("\n");
  await writeFile(
    target,
    `// this is a generated file: do not edit\n${output}\n`
  );
  console.log(`Updated index at: ${target}`);
})();
