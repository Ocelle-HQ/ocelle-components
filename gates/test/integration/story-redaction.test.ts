import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { sandboxPathRule } from "../../lib/sandbox-paths.ts";
import { checkout, rootDir, store } from "../sandbox-paths-table.ts";
import { baseEnv, cleanUp, repo, tempDir } from "./workspace.ts";

// red.sh and tdd-check.sh write redacted logs and records (op 023, #60, FR-007; plan.md *Story scripts*, *Test
// approach* 6), for each of the two identical copies of the story scripts. A temporary git repository holds Spec Kit's
// scripts, the copy's scripts and a story-config.yml whose test command prints a store path and a checkout path and
// exits 1 (no setup command), the redaction script, and a feature with its spec.md, plan.md and tasks.md. Every
// sandbox path is built at run time.
const timeout = 120_000;
const rule = new RegExp(sandboxPathRule);
const redactor = "tooling/speckit/bin/redact-sandbox-paths.sh";
const feature = "ops/999-redaction";
const reviews = `${feature}/reviews/phase-1`;
const config = ['test_command: "bash emit.sh"', 'setup_command: ""', 'test_pathspec: ":(glob)**/*.test.ts"', ""].join("\n");

function git(dir: string, args: readonly string[]): string {
  return execFileSync("git", ["-c", "commit.gpgsign=false", "-c", "user.name=Plant Author", "-c", "user.email=plant@example.com", ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" }).trim();
}

/** A temporary repository with the story scripts of `copy` and the base commit; returns it and its base commit. */
function storyRepo(copy: string): { readonly dir: string; readonly base: string } {
  const dir = tempDir("story");
  git(dir, ["init", "-q", "-b", "main"]);
  cpSync(join(repo, ".specify/scripts/bash"), join(dir, ".specify/scripts/bash"), { recursive: true });
  cpSync(join(repo, copy, "scripts"), join(dir, copy, "scripts"), { recursive: true });
  writeFileSync(join(dir, copy, "story-config.yml"), config);
  mkdirSync(join(dir, "tooling/speckit/bin"), { recursive: true });
  cpSync(join(repo, redactor), join(dir, redactor));
  writeFileSync(join(dir, ".specify/feature.json"), JSON.stringify({ feature_directory: feature }));
  mkdirSync(join(dir, feature), { recursive: true });
  for (const doc of ["spec.md", "plan.md"]) writeFileSync(join(dir, feature, doc), `# ${doc}\n`);
  writeFileSync(join(dir, feature, "tasks.md"), "# Tasks\n\n## Phase 1: Redaction\n\n- [ ] T001 A task\n");
  writeFileSync(join(dir, "emit.sh"), `printf '%s\\n' 'Content-addressable store is at: ${store}' ' RUN  v5.0.5 ${checkout}'\nexit 1\n`);
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "base"]);
  return { dir, base: git(dir, ["rev-parse", "HEAD"]) };
}

function script(dir: string, copy: string, name: string, args: readonly string[]): { code: number | null; stdout: string; stderr: string } {
  const ran = spawnSync("bash", [join(dir, copy, "scripts", name), ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" });
  return { code: ran.status, stdout: ran.stdout, stderr: ran.stderr };
}

/** The lines of a text that match the rule. */
function matching(text: string): string[] {
  return text.split("\n").filter((line) => rule.test(line));
}

/** Whether a log holds both placeholders. */
function placeholders(text: string): boolean {
  return text.includes("Content-addressable store is at: <pnpm store>") && text.includes(" RUN  v5.0.5 <repo>");
}

/** Commits a test-only red commit and records it with red.sh. */
function redCommit(dir: string, copy: string): ReturnType<typeof script> {
  writeFileSync(join(dir, "a.test.ts"), "// a test\n");
  git(dir, ["add", "a.test.ts"]);
  git(dir, ["commit", "-q", "-m", "red"]);
  return script(dir, copy, "red.sh", ["1", "phase"]);
}

afterEach(cleanUp);

describe.each([".specify/extensions/story", "tooling/speckit/extensions/story"])("the story scripts of %s", (copy) => {
  it(
    "red.sh writes red-phase.log with <pnpm store> and <repo>, and no line that matches the rule",
    () => {
      const { dir } = storyRepo(copy);
      const ran = redCommit(dir, copy);
      const log = readFileSync(join(dir, reviews, "red-phase.log"), "utf8");
      expect({ code: ran.code, recorded: ran.stdout.includes('"tests_only":true,"red":true,"recorded":true'), placeholders: placeholders(log), matching: matching(log) }).toEqual({
        code: 0,
        recorded: true,
        placeholders: true,
        matching: [],
      });
    },
    timeout,
  );

  it(
    "tdd-check.sh writes every check log with the placeholders and no line that matches the rule",
    () => {
      const { dir, base } = storyRepo(copy);
      mkdirSync(join(dir, reviews), { recursive: true });
      writeFileSync(join(dir, reviews, "base.sha"), `${base}\n`);
      redCommit(dir, copy);
      writeFileSync(join(dir, "src.txt"), "green\n");
      git(dir, ["add", "src.txt"]);
      git(dir, ["commit", "-q", "-m", "green"]);
      const ran = script(dir, copy, "tdd-check.sh", ["1"]);
      const logs = ["check-red-phase.log", "check-final-tests-on-base.log", "check-head.log"].map((name) => {
        const text = readFileSync(join(dir, reviews, name), "utf8");
        return { name, placeholders: placeholders(text), matching: matching(text) };
      });
      expect({ code: ran.code, logs }).toEqual({
        code: 0,
        logs: ["check-red-phase.log", "check-final-tests-on-base.log", "check-head.log"].map((name) => ({ name, placeholders: true, matching: [] })),
      });
    },
    timeout,
  );

  it(
    "tdd-check.sh writes tdd-check.json and prints it with <home>/ for a red-commits label that holds a sandbox path",
    () => {
      const { dir, base } = storyRepo(copy);
      mkdirSync(join(dir, reviews), { recursive: true });
      writeFileSync(join(dir, reviews, "base.sha"), `${base}\n`);
      redCommit(dir, copy);
      const red = git(dir, ["rev-parse", "HEAD"]);
      // tdd-check.sh reads labels as written, and names its log after the label: the label's directories exist.
      const label = `x:${rootDir}y`;
      mkdirSync(join(dir, reviews, `check-red-x:${rootDir}`), { recursive: true });
      writeFileSync(join(dir, reviews, "red-commits"), `${label} ${red}\n`);
      const ran = script(dir, copy, "tdd-check.sh", ["1"]);
      const record = readFileSync(join(dir, reviews, "tdd-check.json"), "utf8");
      expect({
        code: ran.code,
        record: { label: record.includes('"label":"x:<home>/y"'), matching: matching(record), parses: typeof JSON.parse(record) },
        stdout: { label: ran.stdout.includes('"label":"x:<home>/y"'), matching: matching(ran.stdout) },
      }).toEqual({
        code: 0,
        record: { label: true, matching: [], parses: "object" },
        stdout: { label: true, matching: [] },
      });
    },
    timeout,
  );

  it(
    "red.sh and tdd-check.sh exit 2 with a story: message and write no log when the redaction script is missing",
    () => {
      const { dir, base } = storyRepo(copy);
      writeFileSync(join(dir, "a.test.ts"), "// a test\n");
      git(dir, ["add", "a.test.ts"]);
      git(dir, ["commit", "-q", "-m", "red"]);
      rmSync(join(dir, redactor));
      const red = script(dir, copy, "red.sh", ["1", "phase"]);
      mkdirSync(join(dir, reviews), { recursive: true });
      writeFileSync(join(dir, reviews, "base.sha"), `${base}\n`);
      const check = script(dir, copy, "tdd-check.sh", ["1"]);
      const missing = `story: ${join(realpathSync(dir), redactor)} is missing; it redacts the logs this script writes\n`;
      expect({
        red: { code: red.code, stdout: red.stdout, stderr: red.stderr },
        check: { code: check.code, stdout: check.stdout, stderr: check.stderr },
        written: readdirSync(join(dir, reviews)).sort(),
        record: existsSync(join(dir, reviews, "tdd-check.json")),
      }).toEqual({
        red: { code: 2, stdout: "", stderr: missing },
        check: { code: 2, stdout: "", stderr: missing },
        written: ["base.sha"],
        record: false,
      });
    },
    timeout,
  );
});

// Operator round 4, O4-01 (plan.md *Focused runner*, *Test approach* 9; spec.md FR-007): the same scripts with
// `focused_runner: "gates/bin/story-evidence.ts"`, which red.sh and tdd-check.sh hand off to. The fixture is built as
// gates/test/integration/test-workflow-evidence.test.ts builds its own: the runner and the gates/lib/ files it imports,
// the copy's scripts and config, the redaction script, and node_modules linked from the repository. The setup command
// prints a store path and a checkout path, and the red test fails on an assertion whose message holds a store path and
// a checkout path, so both reach the logs and the JSON evidence. Every sandbox path is built at run time.
const focusedTimeout = 300_000;
const runner = "gates/bin/story-evidence.ts";
const runnerFiles = [runner, "gates/lib/story-cache.ts", "gates/lib/test-evidence.ts", "gates/lib/story-selection.ts", "gates/lib/vitest-run.ts", "gates/lib/spawn.ts"];
const setup = "bash setup.sh";
const pathspec = ":(glob)**/*.test.ts";
const focusedConfig = [`test_command: "pnpm test"`, `focused_runner: "${runner}"`, `setup_command: "${setup}"`, `test_pathspec: "${pathspec}"`, ""].join("\n");
const missingRunner = "story-evidence: tooling/speckit/bin/redact-sandbox-paths.sh is missing or failed; it redacts the logs and records this runner writes\n";

/** A temporary repository with the story scripts of `copy`, the focused runner configured, and the base commit. */
function focusedRepo(copy: string): { readonly dir: string; readonly base: string } {
  const dir = tempDir("story-focused");
  git(dir, ["init", "-q", "-b", "main"]);
  cpSync(join(repo, ".specify/scripts/bash"), join(dir, ".specify/scripts/bash"), { recursive: true });
  // The runner's cache key reads the installed copy's scripts and config (gates/lib/story-cache.ts), so the fixture
  // holds the installed copy too; both copies' scripts are byte-identical, and both configs set the focused runner.
  for (const each of new Set([".specify/extensions/story", copy])) {
    cpSync(join(repo, each, "scripts"), join(dir, each, "scripts"), { recursive: true });
    writeFileSync(join(dir, each, "story-config.yml"), focusedConfig);
  }
  for (const file of [...runnerFiles, redactor]) {
    mkdirSync(join(dir, file, ".."), { recursive: true });
    cpSync(join(repo, file), join(dir, file));
  }
  symlinkSync(join(repo, "node_modules"), join(dir, "node_modules"), "dir");
  writeFileSync(join(dir, ".gitignore"), "node_modules\n/reports/\n");
  writeFileSync(join(dir, "package.json"), '{"type":"module"}\n');
  writeFileSync(join(dir, "vitest.config.mjs"), 'export default { test: { name: "fixture", include: ["test/**/*.test.ts"] } };\n');
  writeFileSync(join(dir, ".specify/feature.json"), JSON.stringify({ feature_directory: feature }));
  mkdirSync(join(dir, feature), { recursive: true });
  for (const doc of ["spec.md", "plan.md"]) writeFileSync(join(dir, feature, doc), `# ${doc}\n`);
  writeFileSync(join(dir, feature, "tasks.md"), "# Tasks\n\n## Phase 1: Redaction\n\n- [ ] T001 A task\n");
  writeFileSync(join(dir, "setup.sh"), `printf '%s\\n' 'Content-addressable store is at: ${store}' ' RUN  v5.0.5 ${checkout}'\nln -s '${join(repo, "node_modules")}' node_modules\n`);
  writeFileSync(join(dir, "answer.ts"), 'export const answer = "old";\n');
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "base"]);
  return { dir, base: git(dir, ["rev-parse", "HEAD"]) };
}

/** Commits a test-only red commit whose failing assertion names a store path and a checkout path. */
function focusedRedCommit(dir: string): void {
  mkdirSync(join(dir, "test"), { recursive: true });
  writeFileSync(join(dir, "test/answer.test.ts"), [
    'import { expect, it } from "vitest";',
    'import { answer } from "../answer.ts";',
    'it("names the store and the checkout", () => {',
    `  expect(answer).toBe("${store}/answer in ${checkout}");`,
    "});",
    "",
  ].join("\n"));
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "red"]);
}

/** The placeholders a text holds and its lines that match the rule. */
function redacted(text: string): { store: boolean; repo: boolean; matching: string[] } {
  return { store: text.includes("<pnpm store>/answer in <repo>"), repo: text.includes("<repo>"), matching: matching(text) };
}

describe.each([".specify/extensions/story", "tooling/speckit/extensions/story"])("the story scripts of %s with the focused runner set", (copy) => {
  it(
    "red.sh 1 fix-4 writes red-fix-4.log and prints a JSON line, each with <pnpm store> and <repo> and no line that matches the rule",
    () => {
      const { dir } = focusedRepo(copy);
      focusedRedCommit(dir);
      const ran = script(dir, copy, "red.sh", ["1", "fix-4"]);
      const log = readFileSync(join(dir, reviews, "red-fix-4.log"), "utf8");
      expect({ code: ran.code, recorded: ran.stdout.includes('"tests_only":true,"red":true,"recorded":true'), log: redacted(log), stdout: redacted(ran.stdout) }).toEqual({
        code: 0,
        recorded: true,
        log: { store: true, repo: true, matching: [] },
        stdout: { store: true, repo: true, matching: [] },
      });
    },
    focusedTimeout,
  );

  it(
    "tdd-check.sh 1 after a green commit writes every check log and tdd-check.json, and prints it, with the placeholders and no line that matches the rule",
    () => {
      const { dir, base } = focusedRepo(copy);
      mkdirSync(join(dir, reviews), { recursive: true });
      writeFileSync(join(dir, reviews, "base.sha"), `${base}\n`);
      focusedRedCommit(dir);
      script(dir, copy, "red.sh", ["1", "fix-4"]);
      writeFileSync(join(dir, "answer.ts"), `export const answer = "${store}/answer in ${checkout}";\n`);
      git(dir, ["add", "answer.ts"]);
      git(dir, ["commit", "-q", "-m", "green"]);
      const ran = script(dir, copy, "tdd-check.sh", ["1"]);
      const failing = ["check-red-fix-4.log", "check-final-tests-on-base.log", "check-final-tests-on-fix-4-base.log"];
      const read = (name: string): string => readFileSync(join(dir, reviews, name), "utf8");
      const record = read("tdd-check.json");
      expect({
        code: ran.code,
        logs: failing.map((name) => ({ name, ...redacted(read(name)) })),
        head: matching(read("check-head.log")),
        record: { ...redacted(record), status: (JSON.parse(record) as { status: string }).status },
        stdout: redacted(ran.stdout),
      }).toEqual({
        code: 0,
        logs: failing.map((name) => ({ name, store: true, repo: true, matching: [] })),
        head: [],
        record: { store: true, repo: true, matching: [], status: "pass" },
        stdout: { store: true, repo: true, matching: [] },
      });
    },
    focusedTimeout,
  );

  it(
    "red.sh and tdd-check.sh exit 2 with the story: message and write no log when the redaction script is missing",
    () => {
      const { dir, base } = focusedRepo(copy);
      focusedRedCommit(dir);
      rmSync(join(dir, redactor));
      const red = script(dir, copy, "red.sh", ["1", "fix-4"]);
      mkdirSync(join(dir, reviews), { recursive: true });
      writeFileSync(join(dir, reviews, "base.sha"), `${base}\n`);
      const check = script(dir, copy, "tdd-check.sh", ["1"]);
      const missing = `story: ${join(realpathSync(dir), redactor)} is missing; it redacts the logs this script writes\n`;
      expect({
        red: { code: red.code, stdout: red.stdout, stderr: red.stderr },
        check: { code: check.code, stdout: check.stdout, stderr: check.stderr },
        written: readdirSync(join(dir, reviews)).sort(),
      }).toEqual({
        red: { code: 2, stdout: "", stderr: missing },
        check: { code: 2, stdout: "", stderr: missing },
        written: ["base.sha"],
      });
    },
    focusedTimeout,
  );
});

describe("the focused runner (gates/bin/story-evidence.ts) without the redaction script", () => {
  it(
    "exits 2 with a story-evidence: cause on stderr, and writes no log, red-commits or tdd-check.json, for red and check",
    () => {
      const { dir, base } = focusedRepo(".specify/extensions/story");
      mkdirSync(join(dir, reviews), { recursive: true });
      writeFileSync(join(dir, reviews, "base.sha"), `${base}\n`);
      focusedRedCommit(dir);
      rmSync(join(dir, redactor));
      const node = (args: readonly string[]) => {
        const ran = spawnSync(process.execPath, [join(dir, runner), ...args], { cwd: dir, env: baseEnv(), encoding: "utf8" });
        return { code: ran.status, stdout: ran.stdout, stderr: ran.stderr };
      };
      const red = node(["red", feature, "1", setup, pathspec, "fix-4"]);
      const check = node(["check", feature, "1", setup, pathspec]);
      expect({ red, check, written: readdirSync(join(dir, reviews)).sort() }).toEqual({
        red: { code: 2, stdout: "", stderr: missingRunner },
        check: { code: 2, stdout: "", stderr: missingRunner },
        written: ["base.sha"],
      });
    },
    focusedTimeout,
  );
});
