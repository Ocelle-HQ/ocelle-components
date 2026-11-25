import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sandboxPathRule } from "../../lib/sandbox-paths.ts";
import { checkout, ruleTable, store } from "../sandbox-paths-table.ts";
import { baseEnv, cleanUp, runGate, tempDir } from "./workspace.ts";

// `gates/bin/sandbox-paths.ts --root <tmp>` as a script, on temporary git repositories, run from another working
// directory (op 023, #60; plan.md *Test approach* 2, acceptance check 2). Every sandbox path is built at run time
// (gates/test/sandbox-paths-table.ts), so this file holds none. These cases also run the entry's `import.meta.main`
// line, which no in-process test reaches.
const timeout = 60_000;
const message = "holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place";
const allowed = [
  "gates/test/capture-plan.test.ts",
  "gates/test/fixtures/pins/pnpm/success.ndjson",
  "gates/test/fixtures/pins/pnpm/outdated-lockfile.ndjson",
  "specs/001-repository-foundation/reviews/phase-4/round-1.md",
];
const matching = `Content-addressable store is at: ${store}\n RUN  v5.0.5 ${checkout}\n`;

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" });
}

/** A new git repository holding the files (path to content); those not in `untracked` are added to the index. */
function repository(files: Readonly<Record<string, string | Buffer>>, untracked: readonly string[] = []): string {
  const dir = tempDir("sandbox-paths");
  git(dir, ["init", "-q", "-b", "main"]);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  const tracked = Object.keys(files).filter((path) => !untracked.includes(path));
  if (tracked.length > 0) git(dir, ["add", "--", ...tracked]);
  return dir;
}

function gate(root: string): ReturnType<typeof runGate> {
  return runGate("gates/bin/sandbox-paths.ts", ["--root", root], { cwd: tempDir("cwd"), env: baseEnv() });
}

function passed(tracked: string): string {
  return `sandbox-paths: ${tracked} checked, none holds a sandbox path (4 allowed files)`;
}

afterEach(cleanUp);

describe("sandbox-paths (gates/bin/sandbox-paths.ts)", () => {
  it(
    "exits 1 with exactly the two findings of a tracked file with a store path on line 2 and a checkout path on line 5, echoing neither line",
    async () => {
      const path = "specs/999-x/reviews/phase-1/check-head.log";
      const root = repository({ [path]: `one\nContent-addressable store is at: ${store}\nthree\nfour\n RUN  v5.0.5 ${checkout}\nsix\n`, "README.md": "plain\n" });
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 1,
        stdout: [`${path}:2: sandbox-paths: sandbox-path: ${message}`, `${path}:5: sandbox-paths: sandbox-path: ${message}`, "sandbox-paths: 2 sandbox paths in 1 tracked file"],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 0 when the matching lines are only in the four allowed files",
    async () => {
      const root = repository({ ...Object.fromEntries(allowed.map((path) => [path, matching])), "README.md": "plain\n" });
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({ code: 0, stdout: [passed("5 tracked files")], stderr: [] });
    },
    timeout,
  );

  it(
    "exits 0 when the matching lines are only in an untracked file and a git-ignored file",
    async () => {
      const root = repository({ ".gitignore": "ignored.log\n", "README.md": "plain\n", "ignored.log": matching, "notes/untracked.md": matching }, ["ignored.log", "notes/untracked.md"]);
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({ code: 0, stdout: [passed("2 tracked files")], stderr: [] });
    },
    timeout,
  );

  it(
    "exits 0 when the matching lines are only in a binary file (a NUL byte)",
    async () => {
      const root = repository({ "notes/blob.bin": Buffer.concat([Buffer.from([0]), Buffer.from(`\n${matching}`)]), "README.md": "plain\n" });
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({ code: 0, stdout: [passed("2 tracked files")], stderr: [] });
    },
    timeout,
  );

  // Operator round 4, O4-02 (plan.md *The gate*, "Binary by content"; spec.md FR-002): no .gitattributes can exempt a
  // file, so binary is decided by content alone.
  it.each([
    { name: "-diff", attributes: { ".gitattributes": "*.log -diff\n" } },
    { name: "binary", attributes: { ".gitattributes": "*.log binary\n" } },
    { name: "-diff in a subdirectory's .gitattributes", attributes: { "notes/.gitattributes": "*.log -diff\n" } },
  ])(
    "exits 1 with exactly the finding of a text file that a committed .gitattributes marks $name",
    async ({ attributes }) => {
      const root = repository({ ...attributes, "notes/hidden.log": `Content-addressable store is at: ${store}\nplain\n`, "README.md": "plain\n" });
      git(root, ["-c", "user.name=Plant Author", "-c", "user.email=plant@example.com", "commit", "-q", "-m", "base"]);
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 1,
        stdout: [`notes/hidden.log:1: sandbox-paths: sandbox-path: ${message}`, "sandbox-paths: 1 sandbox path in 1 tracked file"],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 0 when a sandbox path is only in a binary file (a NUL byte) that a committed .gitattributes marks text",
    async () => {
      const root = repository({ ".gitattributes": "*.bin text\n", "notes/blob.bin": Buffer.concat([Buffer.from([0]), Buffer.from(`\n${matching}`)]), "README.md": "plain\n" });
      git(root, ["-c", "user.name=Plant Author", "-c", "user.email=plant@example.com", "commit", "-q", "-m", "base"]);
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({ code: 0, stdout: [passed("3 tracked files")], stderr: [] });
    },
    timeout,
  );

  it(
    "exits 0 on the near misses of the rule table, and 1 naming each matching line of the whole table",
    async () => {
      const misses = ruleTable.filter(([, matches]) => !matches).map(([line]) => line);
      const clean = await gate(repository({ "notes/near-misses.md": `${misses.join("\n")}\n` }));
      const whole = await gate(repository({ "notes/table.md": `${ruleTable.map(([line]) => line).join("\n")}\n` }));
      const expected = ruleTable.flatMap(([, matches], index) => (matches ? [`notes/table.md:${String(index + 1)}: sandbox-paths: sandbox-path: ${message}`] : []));
      expect({ clean: { code: clean.code, stdout: clean.stdout }, whole: { code: whole.code, stdout: whole.stdout.slice(0, -1) } }).toEqual({
        clean: { code: 0, stdout: [passed("1 tracked file")] },
        whole: { code: 1, stdout: expected },
      });
    },
    timeout,
  );

  it(
    "exits 2 with the cause no tracked file in a repository that tracks nothing",
    async () => {
      const root = repository({ "notes/untracked.md": "plain\n" }, ["notes/untracked.md"]);
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: ["sandbox-paths: could not run: no tracked file; the root holds no file that git tracks"],
      });
    },
    timeout,
  );

  it(
    "exits 2 with git's first error line when git ls-files fails on a corrupt index, not with no tracked file",
    async () => {
      const root = repository({ "README.md": "plain\n" });
      writeFileSync(join(root, ".git/index"), "garbage\n");
      const ran = await gate(root);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: ["sandbox-paths: could not run: git ls-files failed (exit 128): fatal: .git/index: index file smaller than expected"],
      });
    },
    timeout,
  );

  it(
    "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git",
    async () => {
      const root = repository({ "sub/a.md": matching });
      const outside = tempDir("not-git");
      const [sub, plain] = [await gate(join(root, "sub")), await gate(outside)];
      expect([
        { code: sub.code, stdout: sub.stdout, stderr: sub.stderr },
        { code: plain.code, stdout: plain.stdout, stderr: plain.stderr },
      ]).toEqual([
        { code: 2, stdout: [], stderr: [`sandbox-paths: could not run: ${join(root, "sub")} is not the top of a git work tree`] },
        { code: 2, stdout: [], stderr: [`sandbox-paths: could not run: ${outside} is not the top of a git work tree`] },
      ]);
    },
    timeout,
  );
});

describe("the rule under git grep -E", () => {
  it("gives the answers of the rule table, so the gate's regular expression and git's agree", () => {
    const root = repository({ "table.md": `${ruleTable.map(([line]) => line).join("\n")}\n` });
    const ran = spawnSync("git", ["grep", "--no-color", "-n", "-E", "-e", sandboxPathRule, "--", "table.md"], { cwd: root, env: baseEnv(), encoding: "utf8" });
    const numbers = new Set(ran.stdout.split("\n").filter((line) => line !== "").map((line) => Number(line.split(":")[1])));
    expect(ruleTable.map(([line], index) => [line, numbers.has(index + 1)])).toEqual(ruleTable.map(([line, matches]) => [line, matches]));
  });
});
