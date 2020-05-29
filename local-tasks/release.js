const
  Git = require("simple-git/promise"),
  spawn = requireModule("spawn"),
  gulp = requireModule("gulp-with-help"),
  gitTag = requireModule("git-tag"),
  gitPushTags = requireModule("git-push-tags"),
  gitPush = requireModule("git-push"),
  env = requireModule("env"),
  readPackageVersion = requireModule("read-package-version"),
  alterPackageJsonVersion = requireModule("alter-package-json-version");

gulp.task("release", ["increment-package-json-version"], async () => {
  const
    dryRun = env.resolveFlag("DRY_RUN"),
    rootGit = new Git();

  const
    version = await readPackageVersion(),
    tag = `v${ version }`;
  if (dryRun) {
    return;
  }
  try {
    await spawn("npm", ["publish"]);
  } catch (e) {
    // roll back version & rethrow
    await alterPackageJsonVersion({ loadUnsetFromEnvironment: true, incrementBy: -1 });
    throw e;
  }

  await rootGit.add(":/");
  await rootGit.commit(":bookmark: bump package version");
  await gitPush(dryRun);
  await gitPushTags(dryRun);
});
