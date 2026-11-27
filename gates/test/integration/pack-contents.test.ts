import { spawn } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildPackTree } from "../../lib/plant-repo.ts";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

// 030 T007 (spec.md Story 1 scenario 1, FR-004; contracts/pack-contents-gate.md): the pack-contents gate as a process.
// Without --tarballs it builds the three packages and packs each with pnpm pack: on the real workspace it exits 0 with
// one line per package at the version of packages/tokens/package.json (read here, never written as a literal, so the
// version-bump pull request of research R-15 needs no test edit); a workspace whose tokens build fails is exit 2
// naming the build. With --tarballs it reads the tarballs as given, against --version; a missing or invalid
// pack-manifest.json, and a flag without its value, are exit 2.
const timeout = 300_000;

/** The release version: packages/tokens/package.json's. */
const version = (JSON.parse(readFileSync(join(repo, "packages/tokens/package.json"), "utf8")) as { version: string }).version;

/** Runs a command in a directory as a child process. */
function command(file: string, args: readonly string[], cwd: string): Promise<Ran> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, env: baseEnv() });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      const lines = (text: string): string[] => text.split("\n").filter((line) => line !== "");
      resolve({ code, stdout: lines(stdout), stderr: lines(stderr) });
    });
  });
}

function gate(args: readonly string[]): Promise<Ran> {
  return runGate("gates/bin/pack-contents.ts", args, { cwd: tempDir("cwd"), env: baseEnv() });
}

/** Writes the files (path to content) below a new temporary directory. */
function root(files: Readonly<Record<string, string>>): string {
  const dir = tempDir("pack-root");
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

afterEach(cleanUp);

describe("pack-contents (gates/bin/pack-contents.ts)", () => {
  it(
    "exits 0 on the real workspace, building and packing the three packages, with one line per package at the version of packages/tokens/package.json",
    async () => {
      const ran = await command("pnpm", ["run", "gate:pack-contents"], repo);
      const own = ran.stdout.filter((line) => line.startsWith("pack-contents: "));
      expect({ code: ran.code, own: own.map((line) => line.replace(/: \d+ files, \d+ entry points$/, ": <n> files, <m> entry points")) }).toEqual({
        code: 0,
        own: [
          `pack-contents: @ocelle/tokens@${version}: <n> files, <m> entry points`,
          `pack-contents: @ocelle/styles@${version}: <n> files, <m> entry points`,
          `pack-contents: @ocelle/elements@${version}: <n> files, <m> entry points`,
          `pack-contents: 3 packages at ${version}, each tarball exactly as declared`,
        ],
      });
    },
    timeout,
  );

  it(
    "exits 2 naming the build on a copy of the workspace whose tokens build script exits non-zero",
    async () => {
      const manifest = join(repo, "gates/release/pack-manifest.json");
      const dir = root({
        "package.json": readFileSync(join(repo, "package.json"), "utf8"),
        "pnpm-workspace.yaml": 'packages:\n  - "packages/*"\n',
        "gates/release/pack-manifest.json": existsSync(manifest) ? readFileSync(manifest, "utf8") : "[]",
        "packages/tokens/package.json": JSON.stringify({ name: "@ocelle/tokens", version, scripts: { build: "node -e process.exit(3)" } }),
        "packages/styles/package.json": JSON.stringify({ name: "@ocelle/styles", version }),
        "packages/elements/package.json": JSON.stringify({ name: "@ocelle/elements", version }),
      });
      const ran = await gate(["--root", dir]);
      expect({ code: ran.code, stdout: ran.stdout }).toEqual({ code: 2, stdout: [] });
      expect(ran.stderr.at(-1)).toMatch(/^pack-contents: could not run: the build failed \(pnpm --filter \.\/packages\/\* -r build, exit [1-9]\d*\)$/);
    },
    timeout,
  );

  it(
    "with --tarballs reads the *.tgz files of the directory as given, against packages/tokens/package.json's version or --version",
    async () => {
      const into = tempDir("pack-tree");
      expect(await buildPackTree(repo, join(repo, "gates/plants/pack-contents/pass-minimal"), into).then(() => "built", (error: unknown) => String(error))).toBe("built");
      writeFileSync(join(into, "tarballs/notes.txt"), "not a tarball, not read\n");
      const planted = (JSON.parse(readFileSync(join(into, "packages/tokens/package.json"), "utf8")) as { version: string }).version;
      const as = await gate(["--root", into, "--tarballs", join(into, "tarballs")]);
      const other = await gate(["--root", into, "--tarballs", join(into, "tarballs"), "--version", "9.8.7"]);
      expect({ as: [as.code, as.stdout.at(-1)], other: [other.code, other.stdout.filter((line) => line.includes(": version-mismatch: ")).length, other.stdout.at(-1)] }).toEqual({
        as: [0, `pack-contents: 3 packages at ${planted}, each tarball exactly as declared`],
        other: [1, 3, "pack-contents: 5 findings in 3 packages"],
      });
    },
    timeout,
  );

  it(
    "exits 2 for a missing or invalid gates/release/pack-manifest.json, before reading any tarball",
    async () => {
      const missing = root({ "packages/tokens/package.json": '{"version":"1.0.0"}', "tarballs/x.tgz": "x" });
      const invalid = root({ "gates/release/pack-manifest.json": "{", "packages/tokens/package.json": '{"version":"1.0.0"}', "tarballs/x.tgz": "x" });
      const [a, b] = await Promise.all([gate(["--root", missing, "--tarballs", join(missing, "tarballs")]), gate(["--root", invalid, "--tarballs", join(invalid, "tarballs")])]);
      expect({ missing: [a.code, a.stderr], invalid: [b.code, b.stderr] }).toEqual({
        missing: [2, ["pack-contents: could not run: gates/release/pack-manifest.json is missing"]],
        invalid: [2, [expect.stringMatching(/^pack-contents: could not run: gates\/release\/pack-manifest\.json is invalid: not valid JSON \(.+\)$/)]],
      });
    },
    timeout,
  );

  it(
    "exits 2 for --tarballs or --version without a value, for a tarballs directory that does not exist, and for a root without a tokens version",
    async () => {
      const manifest = join(repo, "gates/release/pack-manifest.json");
      const dir = root({ "packages/tokens/package.json": '{"name":"@ocelle/tokens"}' });
      if (existsSync(manifest)) {
        mkdirSync(join(dir, "gates/release"), { recursive: true });
        copyFileSync(manifest, join(dir, "gates/release/pack-manifest.json"));
      }
      const runs = await Promise.all([
        gate(["--root", dir, "--tarballs"]),
        gate(["--root", dir, "--tarballs", join(dir, "tarballs"), "--version"]),
        gate(["--root", dir, "--tarballs", "--version", "1.0.0"]),
        gate(["--root", dir, "--tarballs", join(dir, "none"), "--version", "1.0.0"]),
        gate(["--root", dir, "--tarballs", join(dir, "none")]),
      ]);
      expect(runs.map((ran) => [ran.code, ran.stderr.at(-1)])).toEqual([
        [2, "pack-contents: could not run: --tarballs needs a directory"],
        [2, "pack-contents: could not run: --version needs a version"],
        [2, "pack-contents: could not run: --tarballs needs a directory"],
        [2, expect.stringMatching(/^pack-contents: could not run: cannot read the tarballs directory .+none \(.+\)$/)],
        [2, "pack-contents: could not run: packages/tokens/package.json has no version; pass --version"],
      ]);
    },
    timeout,
  );
});
