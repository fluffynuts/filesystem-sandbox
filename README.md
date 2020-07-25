filesystem-sandbox
---

![Test](https://github.com/fluffynuts/filesystem-sandbox/workflows/Tests/badge.svg)

![npm](https://img.shields.io/npm/v/filesystem-sandbox)

JavaScript module to provide (insecure) filesystem sandboxes for testing

## Why?
Because I've needed to write tests which do file I/O and I want an easy
way to do that and clean up afterwards.

## Usage
### Creation
```typescript
// create a sandbox in a folder under your repo dir:
const sandbox1 = await Sandbox.create();

// create a sandbox somehere specific
const sandbox2 = await Sandbox.create("/tmp");
```

### Cleanup
```typescript
const sandbox1 = await Sandbox.create();
const sandbox2 = await Sandbox.create();
const sandbox3 = await Sandbox.create();

// clean up an individual sandbox
await sandbox1.destroy();

// clean up all sandboxes seen in this session, eg in `afterEach`
await Sandbox.destroyAll();

// precautionary: destroy any sandboxes in the default location
// -> useful as a beforeAll in single test (beware using in jest
//    with concurrent testing!) or in your jest setup to clean
//    out remnants from prior interrupted sessions. Will not destroy
//    sandboxes in custom locations
await Sandbox.destroyAny();
```

### Path resolution
```typescript
// get the full path to a file for operations not catered for
// by the sandbox:
const sandbox = await Sandbox.create();
const fullpath = sandbox.fullPathFor("some-file.txt");
```

### File I/O
```typescript
const sandbox = Sandbox.create();
// write a binary file
const buf1 = Buffer.from([1,2,3]);
await sandbox.writeFile("binary.blob", buf1);
// write a text file
await sandbox.writeFile("hello.txt", "hello world");
// read a text file
const text = await sandbox.readTextFile("hello.txt");
// read a binary file
const data = await sandbox.readFile("binary.blob");
```

## File operations
```typescript
const sandbox = Sandbox.create();
sandbox.writeFile("hello.txt", "hello world");
const exists = await sandbox.fileExists("hello.txt"); // true
const missing = await sandbox.folderExists("hello.txt"); // false: hello.txt is a file
const stat = await sandbox.stat("hello.txt"); // get fulll stat info
const noStats = await sandbox.stat("missing"); // you'll get null
```
