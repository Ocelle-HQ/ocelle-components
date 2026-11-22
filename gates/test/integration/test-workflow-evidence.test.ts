import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { expect, it } from "vitest";
import type { Assertion, ShardResult, UnitTestPlan } from "../../lib/test-evidence.ts";

const repository = resolve(import.meta.dirname, "../../..");
const storyFiles = [
  "gates/bin/story-evidence.ts",
  "gates/lib/test-evidence.ts",
  "gates/lib/vitest-run.ts",
  "gates/lib/spawn.ts",
  ".specify/extensions/story/story-config.yml",
  ".specify/extensions/story/scripts/common.sh",
  ".specify/extensions/story/scripts/red.sh",
  ".specify/extensions/story/scripts/tdd-check.sh",
];

function git(root: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function write(root: string, file: string, text: string): void {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function json<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function fixture(): string {
  const root = mkdtempSync(join(tmpdir(), "ocelle-verification-fixture-"));
  git(root, "init", "--quiet");
  git(root, "config", "user.name", "Verification Fixture");
  git(root, "config", "user.email", "verification-fixture@example.com");
  git(root, "config", "commit.gpgsign", "false");
  symlinkSync(join(repository, "node_modules"), join(root, "node_modules"), "dir");
  write(root, ".gitignore", "node_modules\n/reports/\n/specs/\n");
  write(root, "package.json", '{"type":"module"}\n');
  write(root, "vitest.config.mjs", 'export default { test: {name:"fixture", include:["test/**/*.test.ts"]} };\n');
  return root;
}

function commit(root: string, message: string): string {
  git(root, "add", "--all");
  git(root, "commit", "-s", "--quiet", "-m", message);
  return git(root, "rev-parse", "HEAD");
}

function node(root: string, ...args: string[]) {
  return spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 60_000 });
}

it("executes a complete configured inventory and compares it with the full Vitest run", () => {
  const root = fixture();
  const output = mkdtempSync(join(tmpdir(), "ocelle-shards-output-"));
  try {
    write(root, "test/first.test.ts", 'import { expect, it } from "vitest"; it("first", () => expect(1).toBe(1));');
    write(root, "test/second.test.ts", 'import { expect, it } from "vitest"; it("second", () => expect(2).toBe(2));');
    const revision = commit(root, "fixture");
    const command = join(repository, "gates/bin/test-shards.ts");
    const plan = join(output, "plan.json");
    const reports = join(output, "reports");
    const planned = node(root, command, "plan", plan, "2");
    expect(planned.status, planned.stderr).toBe(0);
    expect(json<UnitTestPlan>(plan)).toMatchObject({
      revision,
      inventory: [{ project: "fixture", file: "test/first.test.ts" }, { project: "fixture", file: "test/second.test.ts" }],
    });

    const first = join(reports, "0", "result.json");
    const second = join(reports, "1", "result.json");
    mkdirSync(dirname(first), { recursive: true });
    const firstJob = node(root, command, "run", plan, "0", first);
    expect(firstJob.status, firstJob.stderr).toBe(0);
    expect(json<ShardResult>(first)).toMatchObject({ revision, index: 0, files: [{ project: "fixture", state: "passed" }] });

    const missing = node(root, command, "verify", plan, reports);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("received 1 of 2 shard results");

    mkdirSync(dirname(second), { recursive: true });
    const secondJob = node(root, command, "run", plan, "1", second);
    expect(secondJob.status, secondJob.stderr).toBe(0);
    const full = join(output, "full-result.json");
    const vitest = join(repository, "node_modules/vitest/vitest.mjs");
    const reporter = join(repository, "gates/reporters/unit-test-inventory.ts");
    const stock = spawnSync(process.execPath, [vitest, "run", `--reporter=${reporter}`], {
      cwd: root, encoding: "utf8", env: { ...process.env, OCELLE_TEST_REPORT: full }, timeout: 60_000,
    });
    expect(stock.status, stock.stderr).toBe(0);
    const complete = node(root, command, "verify", plan, reports, full);
    expect(complete.status, complete.stderr).toBe(0);
    expect(complete.stdout).toContain("Full and sharded project/file/test results match.");
    expect(complete.stdout).toContain("2 tests passed in 2 files across 2 shards");
  } finally {
    rmSync(root, { force: true, recursive: true });
    rmSync(output, { force: true, recursive: true });
  }
}, 80_000);

interface RedResult {
  recorded: boolean;
  evidence: { status: string; assertions: Assertion[]; problem?: string };
}

interface PhaseResult {
  status: string;
  problems: string[];
  focused: { base: { resumed: boolean }; head: { resumed: boolean } };
}

it("runs real clean-worktree red, base and green checks and refuses malformed cache reuse", () => {
  const root = fixture();
  try {
    for (const file of storyFiles) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(join(repository, file), join(root, file));
    }
    write(root, "answer.ts", 'export const answer = "old";\n');
    write(root, "test/scenario.ts", 'import { expect } from "vitest";\nexport function inspectAnswer(value: string): void {\n  expect(value).toBe("corrected");\n}\n');
    const base = commit(root, "base");
    const feature = "specs/001-answer";
    const reviews = `${feature}/reviews/phase-1`;
    write(root, `${reviews}/base.sha`, `${base}\n`);
    write(root, "test/answer.test.ts", [
      'import { expect, it } from "vitest";',
      'import { answer } from "../answer.ts";',
      'import { inspectAnswer } from "./scenario.ts";',
      'it("keeps the corrected answer", () => {',
      '  expect(answer).toBe("corrected");',
      '});',
      'it("runs an existing shared scenario for the corrected answer", () => {',
      '  inspectAnswer(answer);',
      '});',
    ].join("\n"));
    commit(root, "red");
    const runner = join(root, "gates/bin/story-evidence.ts");
    const data = [feature, "1", `ln -s "${join(repository, "node_modules")}" node_modules`, ":(glob)**/*.test.ts"];
    const red = node(root, runner, "red", ...data, "phase");
    expect(red.status, red.stderr).toBe(0);
    const result = JSON.parse(red.stdout) as RedResult;
    expect(result).toMatchObject({
      recorded: true,
      evidence: {
        status: "red",
        assertions: [
          { file: "test/answer.test.ts", test: "keeps the corrected answer", source: { line: 5 }, diagnostic: expect.stringContaining("corrected") },
          { file: "test/answer.test.ts", test: "runs an existing shared scenario for the corrected answer", source: { line: 8 },
            helper: { file: "test/scenario.ts", line: 3 }, diagnostic: expect.stringContaining("corrected") },
        ],
      },
    });
    write(root, "answer.ts", 'export const answer = "corrected";\n');
    commit(root, "green");
    const check = () => node(root, runner, "check", ...data);
    const first = check();
    expect(first.status, first.stderr).toBe(0);
    const measured = JSON.parse(first.stdout) as PhaseResult;
    expect(measured).toMatchObject({ status: "pass", problems: [], focused: { base: { resumed: false }, head: { resumed: false } } });
    const resumed = check();
    expect(resumed.status, resumed.stderr).toBe(0);
    const repeated = JSON.parse(resumed.stdout) as PhaseResult;
    expect(repeated).toMatchObject({ status: "pass", focused: { base: { resumed: true }, head: { resumed: true } } });

    const firstLine = readFileSync(join(root, reviews, "check-head.log"), "utf8").split("\n")[1] ?? "";
    const key = (JSON.parse(firstLine) as { input: string }).input;
    const record = join(root, "reports/story-evidence", `${key}.json`);
    const cached = json<Record<string, unknown>>(record);
    writeFileSync(record, JSON.stringify({ ...cached, selected: [null], log: "" }));
    const checked = check();
    expect(checked.status, checked.stderr).toBe(0);
    expect(JSON.parse(checked.stdout) as PhaseResult).toMatchObject({ status: "pass", focused: { base: { resumed: true }, head: { resumed: false } } });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);
