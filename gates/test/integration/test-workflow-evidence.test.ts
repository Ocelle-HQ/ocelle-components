import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { expect, it } from "vitest";
import type { Assertion, ShardResult } from "../../lib/test-evidence.ts";

const repository = resolve(import.meta.dirname, "../../..");
const redactor = "tooling/speckit/bin/redact-sandbox-paths.sh";
const storyFiles = [
  "gates/bin/story-evidence.ts",
  "gates/lib/story-cache.ts",
  "gates/lib/test-evidence.ts",
  "gates/lib/story-selection.ts",
  "gates/lib/vitest-run.ts",
  "gates/lib/spawn.ts",
  ".specify/extensions/story/story-config.yml",
  ".specify/extensions/story/scripts/common.sh",
  ".specify/extensions/story/scripts/base.sh",
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

function json(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
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
  // The runner redacts every log and record through the repository's redaction script (op 023, O4-01).
  mkdirSync(join(root, dirname(redactor)), { recursive: true });
  copyFileSync(join(repository, redactor), join(root, redactor));
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

const storyFeature = "specs/006-story-implementation";
const storyReviews = storyFeature + "/reviews/phase-1";
const implementationStory = "storybook/stories/Workflow_Studio/plan.v2.stories.ts";
const retiredStory = "storybook/stories/Workflow_Studio/retired.stories.ts";
const supportStory = "storybook/stories/support.stories.ts";

function prepareStoryWrappers(root: string): string {
  for (const file of [...storyFiles, ".specify/scripts/bash/check-prerequisites.sh", ".specify/scripts/bash/common.sh"]) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    copyFileSync(join(repository, file), join(root, file));
  }
  const config = ".specify/extensions/story/story-config.yml";
  write(root, config, readFileSync(join(root, config), "utf8").replace(/^setup_command:.*$/m,
    'setup_command: "ln -s "$OCELLE_EVIDENCE_MODULES" node_modules"'));
  write(root, storyFeature + "/plan.md", "# Implementation story proof\n");
  write(root, storyFeature + "/tasks.md", "## Phase 1: Story behavior\n");
  write(root, implementationStory, 'export const answer = "old";\n');
  write(root, retiredStory, 'export const retired = "old";\n');
  write(root, supportStory, 'export const support = "old";\n');
  const base = commit(root, "story fixtures and default wrappers");
  write(root, storyReviews + "/base.sha", base + "\n");
  write(root, storyReviews + "/test-scope.txt",
    "implementation-story " + implementationStory + "\nimplementation-story " + retiredStory + "\n");
  return base;
}

function storyWrapper(root: string, script: "base" | "red" | "tdd-check", ...args: string[]) {
  return spawnSync("bash", [".specify/extensions/story/scripts/" + script + ".sh", "1", ...args], {
    cwd: root, encoding: "utf8", timeout: 60_000,
    env: {
      ...process.env,
      SPECIFY_FEATURE_DIRECTORY: storyFeature,
      SPECIFY_FEATURE_NO_PERSIST: "1",
      OCELLE_EVIDENCE_MODULES: join(repository, "node_modules"),
    },
  });
}

function addStoryAssertion(root: string): void {
  write(root, "test/story.test.ts", [
    'import { existsSync } from "node:fs";',
    'import { expect, it } from "vitest";',
    'import { answer } from "../' + implementationStory + '";',
    'import { support } from "../' + supportStory + '";',
    'it("shows the revised plan with current supporting data", () => {',
    '  expect(support).toBe("new");',
    '  expect(answer).toBe("new");',
    '});',
    'it("removes the retired plan story", () => {',
    '  expect(existsSync(new URL("../' + retiredStory + '", import.meta.url))).toBe(false);',
    '});',
  ].join("\n"));
  write(root, supportStory, 'export const support = "new";\n');
}

it("replays declared implementation stories from the tested revision and overlays ordinary support stories", () => {
  const root = fixture();
  try {
    const base = prepareStoryWrappers(root);
    addStoryAssertion(root);
    const red = commit(root, "record the failing assertion and ordinary test support");
    const recorded = storyWrapper(root, "red", "phase");
    expect({ status: recorded.status, stderr: recorded.stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(recorded.stdout) as unknown).toMatchObject({
      sha: red, tests_only: true, red: true, recorded: true,
      evidence: { status: "red", assertions: [
        { file: "test/story.test.ts", test: "shows the revised plan with current supporting data", source: { line: 7 } },
        { file: "test/story.test.ts", test: "removes the retired plan story", source: { line: 10 } },
      ] },
    });

    write(root, implementationStory, 'export const answer = "new";\n');
    rmSync(join(root, retiredStory));
    const head = commit(root, "implement the revised plan story");
    const checked = storyWrapper(root, "tdd-check");
    expect({ status: checked.status, stderr: checked.stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(checked.stdout) as unknown).toMatchObject({
      status: "pass", base, head, problems: [],
      final_tests_on_base_exit: 1, head_exit: 0,
      focused: {
        base: { evidence: { status: "red", assertions: [
          { file: "test/story.test.ts", source: { line: 7 } },
          { file: "test/story.test.ts", source: { line: 10 } },
        ] } },
        head: { evidence: { status: "green" }, selected: [{ project: "fixture", file: "test/story.test.ts" }] },
      },
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it("replays only phase changes after merging pinned main, including a test both sides changed", () => {
  const root = fixture();
  try {
    const file = "test/shared.test.ts";
    const original = [
      'import { expect, it } from "vitest";',
      'import { answer } from "../src/answer.ts";',
      'it("keeps existing behavior", () => expect(answer).toMatch(/old|new/));',
      '// The phase assertion is added below.',
      '',
      '',
      '',
      '// The upstream assertion is added below.',
      '',
    ].join("\n");
    write(root, "src/answer.ts", 'export const answer: string = "old";\n');
    write(root, file, original);
    const base = prepareStoryWrappers(root);
    git(root, "checkout", "-b", "feature");
    write(root, file, original.replace("// The phase assertion is added below.",
      'it("returns the phase answer", () => expect(answer).toBe("new"));'));
    const red = commit(root, "test phase behavior");
    const recorded = storyWrapper(root, "red", "phase");
    expect(JSON.parse(recorded.stdout) as unknown).toMatchObject({ sha: red, red: true, recorded: true });
    write(root, "src/answer.ts", 'export const answer: string = "new";\n');
    commit(root, "implement phase behavior");

    git(root, "checkout", "-b", "upstream", base);
    write(root, "src/tooling.ts", 'export const tooling = "ready";\n');
    write(root, "test/upstream.test.ts", [
      'import { expect, it } from "vitest";',
      'import { tooling } from "../src/tooling.ts";',
      'it("uses upstream tooling", () => expect(tooling).toBe("ready"));',
    ].join("\n"));
    write(root, file, original.replace("// The upstream assertion is added below.",
      'it("uses integrated tooling in the shared file", async () => expect((await import("../src/tooling.ts")).tooling).toBe("ready"));'));
    const upstream = commit(root, "add main tooling and change test inventory");
    write(root, "test/remote-only.test.ts", 'import { expect, it } from "vitest";\nit("remains on main", () => expect(true).toBe(true));\n');
    const remoteTip = commit(root, "advance main past the integrated test inventory");
    git(root, "update-ref", "refs/remotes/origin/main", remoteTip);
    git(root, "checkout", "feature");
    expect(storyWrapper(root, "base", "--with-main", upstream).status).toBe(2);
    git(root, "merge", "--signoff", "--no-edit", upstream);

    const pin = storyWrapper(root, "base", "--with-main", upstream);
    expect({ status: pin.status, stderr: pin.stderr }).toEqual({ status: 0, stderr: "" });
    expect(readFileSync(join(root, storyReviews, "base.sha"), "utf8").trim()).toBe(base);
    const checked = storyWrapper(root, "tdd-check");
    expect({ status: checked.status, stderr: checked.stderr }).toEqual({ status: 0, stderr: "" });
    const proof = JSON.parse(checked.stdout) as { replay_base: string };
    expect(proof).toMatchObject({
      status: "pass", base, replay_upstream: upstream, problems: [],
      red_commits: [{ sha: red, evidence: { status: "red", assertions: [{ file, test: "returns the phase answer" }] } }],
      final_tests_on_base_exit: 1, head_exit: 0,
      focused: {
        base: { evidence: { status: "red" }, selected: [{ project: "fixture", file }] },
        head: { evidence: { status: "green" }, selected: [{ project: "fixture", file }] },
      },
    });
    expect(git(root, "rev-list", "--parents", "-n1", proof.replay_base)).toBe([proof.replay_base, base, upstream].join(" "));
    const repeated = storyWrapper(root, "tdd-check");
    expect(JSON.parse(repeated.stdout) as unknown).toMatchObject({ status: "pass", replay_base: proof.replay_base });

    const featureHead = git(root, "rev-parse", "HEAD");
    write(root, storyReviews + "/replay-upstream.sha", featureHead);
    git(root, "update-ref", "refs/remotes/origin/main", featureHead);
    const refused = storyWrapper(root, "tdd-check");
    expect(JSON.parse(refused.stdout) as unknown).toMatchObject({
      status: "fail", problems: ["replay-upstream.sha must pin main integrated into HEAD without the phase's red commits"],
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it("refuses a stale main pin without creating or replacing the pin file", () => {
  const root = fixture();
  try {
    const base = prepareStoryWrappers(root);
    write(root, "main-only.txt", "integrated main\n");
    const upstream = commit(root, "advance the shared main history");
    git(root, "checkout", "-b", "future-main");
    write(root, "main-only.txt", "remote main\n");
    const remoteTip = commit(root, "advance remote main past the shared history");
    git(root, "update-ref", "refs/remotes/origin/main", remoteTip);
    git(root, "checkout", "--detach", upstream);

    const pin = join(root, storyReviews, "replay-upstream.sha");
    expect(storyWrapper(root, "base", "--with-main", base).status).toBe(2);
    expect(existsSync(pin)).toBe(false);
    expect(storyWrapper(root, "base", "--with-main", upstream).status).toBe(0);
    expect(storyWrapper(root, "base", "--with-main", base).status).toBe(2);
    expect(readFileSync(pin, "utf8")).toBe(upstream + "\n");
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

it("refuses to replace the pin if Git finds multiple merge bases or cannot inspect main", () => {
  const root = fixture();
  try {
    const base = prepareStoryWrappers(root);
    const tree = git(root, "rev-parse", `${base}^{tree}`);
    const left = git(root, "commit-tree", tree, "-p", base, "-m", "first shared commit");
    const right = git(root, "commit-tree", tree, "-p", base, "-m", "second shared commit");
    const local = git(root, "commit-tree", tree, "-p", left, "-p", right, "-m", "local criss-cross merge");
    const remote = git(root, "commit-tree", tree, "-p", right, "-p", left, "-m", "remote criss-cross merge");
    git(root, "checkout", "--detach", local);
    git(root, "update-ref", "refs/remotes/origin/main", remote);

    const pinFile = storyReviews + "/replay-upstream.sha";
    write(root, pinFile, base + "\n");
    expect(storyWrapper(root, "base", "--with-main", left).status).toBe(2);
    expect(readFileSync(join(root, pinFile), "utf8")).toBe(base + "\n");

    git(root, "update-ref", "-d", "refs/remotes/origin/main");
    expect(storyWrapper(root, "base", "--with-main", left).status).toBe(2);
    expect(readFileSync(join(root, pinFile), "utf8")).toBe(base + "\n");
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

it("rejects a declared implementation story in a mixed red commit and in red history", () => {
  const root = fixture();
  try {
    prepareStoryWrappers(root);
    addStoryAssertion(root);
    write(root, implementationStory, 'export const answer = "still old";\n');
    const red = commit(root, "change the test and its declared implementation story");

    const recorded = storyWrapper(root, "red", "phase");
    expect({ status: recorded.status, stderr: recorded.stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(recorded.stdout) as unknown).toMatchObject({
      sha: red, tests_only: false, red: false, recorded: false,
      problem: "red commit changes a declared implementation story: " + implementationStory,
    });
    expect(existsSync(join(root, storyReviews, "red-commits"))).toBe(false);

    write(root, storyReviews + "/red-commits", "phase " + red + "\n");
    const checked = storyWrapper(root, "tdd-check");
    expect({ status: checked.status, stderr: checked.stderr }).toEqual({ status: 0, stderr: "" });
    const verdict = JSON.parse(checked.stdout) as { readonly problems: readonly string[] };
    expect(verdict).toMatchObject({ status: "fail", red_commits: [] });
    expect(verdict.problems).toContain("red commit phase changes a declared implementation story: " + implementationStory);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it.each([
  { label: "an omitted path", path: "" },
  { label: "an absolute path", path: "/storybook/stories/plan.stories.ts" },
  { label: "an unrelated directory", path: "packages/storybook/stories/plan.stories.ts" },
  { label: "a parent directory", path: "storybook/stories/../plan.stories.ts" },
  { label: "a dot directory", path: "storybook/stories/./plan.stories.ts" },
  { label: "an empty component", path: "storybook/stories//plan.stories.ts" },
  { label: "a glob", path: "storybook/stories/*.stories.ts" },
  { label: "a Git pathspec", path: ":(glob)storybook/stories/plan.stories.ts" },
  { label: "a non-story extension", path: "storybook/stories/plan.test.ts" },
  { label: "a Windows separator", path: "storybook/stories/sub\\plan.stories.ts" },
])("rejects $label in an implementation-story declaration", ({ path }) => {
  const root = fixture();
  try {
    prepareStoryWrappers(root);
    write(root, storyReviews + "/test-scope.txt", "implementation-story " + path + "\n");
    write(root, storyReviews + "/tdd-exempt.md", "Scope validation precedes exemption.\n");
    const result = storyWrapper(root, "tdd-check");
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(result.stdout) as unknown).toMatchObject({
      status: "fail", problems: ["implementation-story requires an exact .stories.ts path under storybook/stories/"],
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

it.each([
  { label: "a local test", declaration: implementationStory },
  { label: "a CI-only test", declaration: "ci-only " + implementationStory },
])("rejects a declared implementation story also listed as $label", ({ declaration }) => {
  const root = fixture();
  try {
    prepareStoryWrappers(root);
    write(root, storyReviews + "/test-scope.txt", declaration + "\nimplementation-story " + implementationStory + "\n");
    write(root, storyReviews + "/tdd-exempt.md", "Scope validation precedes exemption.\n");
    const result = storyWrapper(root, "tdd-check");
    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(result.stdout) as unknown).toMatchObject({
      status: "fail", problems: ["conflicting test scope for implementation story: " + implementationStory],
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

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
    expect({ status: planned.status, stderr: planned.stderr }).toMatchObject({ status: 0 });
    expect(json(plan)).toMatchObject({
      revision,
      inventory: [{ project: "fixture", file: "test/first.test.ts" }, { project: "fixture", file: "test/second.test.ts" }],
    });

    const first = join(reports, "0", "result.json");
    const second = join(reports, "1", "result.json");
    mkdirSync(dirname(first), { recursive: true });
    const firstJob = node(root, command, "run", plan, "0", first);
    expect({ status: firstJob.status, stderr: firstJob.stderr }).toMatchObject({ status: 0 });
    expect(json(first)).toMatchObject({ revision, index: 0, files: [{ project: "fixture", state: "passed" }] });

    const missing = node(root, command, "verify", plan, reports);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("received 1 of 2 shard results");

    mkdirSync(dirname(second), { recursive: true });
    const secondJob = node(root, command, "run", plan, "1", second);
    expect({ status: secondJob.status, stderr: secondJob.stderr }).toMatchObject({ status: 0 });
    const full = join(output, "full-result.json");
    const vitest = join(repository, "node_modules/vitest/vitest.mjs");
    const reporter = join(repository, "gates/reporters/unit-test-inventory.ts");
    const stock = spawnSync(process.execPath, [vitest, "run", `--reporter=${reporter}`], {
      cwd: root, encoding: "utf8", env: { ...process.env, OCELLE_TEST_REPORT: full }, timeout: 60_000,
    });
    expect({ status: stock.status, stderr: stock.stderr }).toMatchObject({ status: 0 });
    const complete = node(root, command, "verify", plan, reports, full);
    expect({ status: complete.status, stderr: complete.stderr }).toMatchObject({ status: 0 });
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
      const source = join(repository, file);
      if (file === "gates/lib/story-cache.ts" && !existsSync(source)) continue;
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(source, join(root, file));
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
    expect({ status: red.status, stderr: red.stderr }).toMatchObject({ status: 0 });
    const result = JSON.parse(red.stdout) as RedResult;
    expect(result).toMatchObject({
      recorded: true,
      evidence: {
        status: "red",
        assertions: [
          { file: "test/answer.test.ts", test: "keeps the corrected answer", source: { line: 5 } },
          { file: "test/answer.test.ts", test: "runs an existing shared scenario for the corrected answer", source: { line: 8 },
            helper: { file: "test/scenario.ts", line: 3 } },
        ],
      },
    });
    expect(result.evidence.assertions[0]?.diagnostic).toContain("corrected");
    expect(result.evidence.assertions[1]?.diagnostic).toContain("corrected");
    write(root, "answer.ts", 'export const answer = "corrected";\n');
    commit(root, "green");
    const check = () => node(root, runner, "check", ...data);
    const first = check();
    expect({ status: first.status, stderr: first.stderr }).toMatchObject({ status: 0 });
    const measured = JSON.parse(first.stdout) as PhaseResult;
    expect(measured).toMatchObject({ status: "pass", problems: [], focused: { base: { resumed: false }, head: { resumed: false } } });
    const resumed = check();
    expect({ status: resumed.status, stderr: resumed.stderr }).toMatchObject({ status: 0 });
    const repeated = JSON.parse(resumed.stdout) as PhaseResult;
    expect(repeated).toMatchObject({ status: "pass", focused: { base: { resumed: true }, head: { resumed: true } } });

    const firstLine = readFileSync(join(root, reviews, "check-head.log"), "utf8").split("\n")[1] ?? "";
    const key = (JSON.parse(firstLine) as { input: string }).input;
    const record = join(root, "reports/story-evidence", `${key}.json`);
    const cached = json(record) as Record<string, unknown>;
    writeFileSync(record, JSON.stringify({ ...cached, selected: [null], log: "" }));
    const checked = check();
    expect({ status: checked.status, stderr: checked.stderr }).toMatchObject({ status: 0 });
    expect(JSON.parse(checked.stdout) as PhaseResult).toMatchObject({ status: "pass", focused: { base: { resumed: true }, head: { resumed: false } } });

    for (const [filename, content] of [
      ["pnpm-lock.yaml", "lockfileVersion: '9.0'\n"],
      ["vitest.config.mjs", 'export default { test: {name:"fixture", include:["test/**/*.test.ts"], testTimeout: 6000} };\n'],
    ] as const) {
      write(root, filename, content);
      commit(root, `update ${filename}`);
      const fresh = check();
      expect({ status: fresh.status, stderr: fresh.stderr }).toMatchObject({ status: 0 });
      expect(JSON.parse(fresh.stdout) as PhaseResult).toMatchObject({
        status: "pass",
        focused: { base: { resumed: true }, head: { resumed: false } },
      });
    }
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it.each([
  { label: "surplus fields", records: (sha: string) => `phase ${sha} unexpected\n` },
  { label: "a repeated label", records: (sha: string) => `phase ${sha}\nphase ${sha}\n` },
])("fails closed on red history with $label", ({ records }) => {
  const root = fixture();
  try {
    for (const file of storyFiles) {
      const source = join(repository, file);
      if (file === "gates/lib/story-cache.ts" && !existsSync(source)) continue;
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(source, join(root, file));
    }
    const feature = "specs/002-records";
    const reviews = `${feature}/reviews/phase-1`;
    write(root, "answer.ts", 'export const answer = "old";\n');
    write(root, `${reviews}/base.sha`, `${commit(root, "base")}\n`);
    write(root, "test/answer.test.ts", [
      'import { expect, it } from "vitest";',
      'import { answer } from "../answer.ts";',
      'it("keeps the corrected answer", () => {',
      '  expect(answer).toBe("corrected");',
      '});',
    ].join("\n"));
    write(root, `${reviews}/red-commits`, records(commit(root, "red")));
    write(root, "answer.ts", 'export const answer = "corrected";\n');
    const head = commit(root, "green");
    const result = node(root, join(root, "gates/bin/story-evidence.ts"), "check", feature, "1",
      `ln -s "${join(repository, "node_modules")}" node_modules`, ":(glob)**/*.test.ts");
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
    expect(JSON.parse(result.stdout) as PhaseResult).toMatchObject({
      status: "fail", head, problems: ["invalid red-commits entry"],
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it("rejects empty green evidence from a worker that exited successfully", () => {
  const root = fixture();
  try {
    for (const file of storyFiles) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(join(repository, file), join(root, file));
    }
    const runner = "gates/bin/story-evidence.ts";
    const source = readFileSync(join(root, runner), "utf8");
    const emptyHead = source.replace("  writeJson(outputPath, result);",
      '  writeJson(outputPath, input.mode === "head" ? { evidence: { status: "green", assertions: [] }, selected: [] } : result);');
    expect(emptyHead).not.toBe(source);
    write(root, runner, emptyHead);
    const feature = "specs/003-empty-report";
    const reviews = `${feature}/reviews/phase-1`;
    write(root, "answer.ts", 'export const answer = "old";\n');
    write(root, `${reviews}/base.sha`, `${commit(root, "base")}\n`);
    write(root, "test/answer.test.ts", [
      'import { expect, it } from "vitest";',
      'import { answer } from "../answer.ts";',
      'it("keeps the corrected answer", () => {',
      '  expect(answer).toBe("corrected");',
      '});',
    ].join("\n"));
    write(root, `${reviews}/red-commits`, `phase ${commit(root, "red")}\n`);
    write(root, "answer.ts", 'export const answer = "corrected";\n');
    commit(root, "green");
    const result = node(root, join(root, runner), "check", feature, "1",
      `ln -s "${join(repository, "node_modules")}" node_modules`, ":(glob)**/*.test.ts");
    expect({ status: result.status, stderr: result.stderr }).toMatchObject({ status: 0 });
    expect(JSON.parse(result.stdout) as PhaseResult).toMatchObject({
      status: "fail", problems: ["final tests on HEAD: focused Vitest worker returned incomplete evidence"],
      focused: { head: { evidence: { status: "invalid" } } },
    });
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it("keeps a changed collateral integration test in CI inventory and runs only the focused proof at head", () => {
  const root = fixture();
  try {
    for (const file of storyFiles) {
      mkdirSync(dirname(join(root, file)), { recursive: true });
      copyFileSync(join(repository, file), join(root, file));
    }
    const runner = join(root, "gates/bin/story-evidence.ts");
    const feature = "specs/004-ci-collateral";
    const reviews = feature + "/reviews/phase-1";
    const visual = "gates/test/integration/visual.test.ts";
    const suite = join(repository, "gates/bin/test-shards.ts");
    const ciInventory = join(root, "inventory.json");
    write(root, "vitest.config.mjs", "export default { test: { projects: [" +
      '{ test: { name: "fixture", include: ["test/**/*.test.ts"] } }, ' +
      '{ test: { name: "gates-integration", include: ["gates/test/integration/*.test.ts"] } }' +
      "] } };\n");
    write(root, "answer.ts", 'export const answer = "old";\n');
    write(root, visual, 'import { expect, it } from "vitest"; it("checks aggregate baseline count", () => expect(1).toBe(1));\n');
    write(root, reviews + "/base.sha", commit(root, "base") + "\n");
    write(root, "test/answer.test.ts", [
      'import { expect, it } from "vitest";',
      'import { answer } from "../answer.ts";',
      'it("keeps the corrected answer", () => {',
      '  expect(answer).toBe("corrected");',
      '});',
    ].join("\n"));
    write(root, reviews + "/red-commits", "phase " + commit(root, "red proof") + "\n");
    write(root, "answer.ts", 'export const answer = "corrected";\n');
    write(root, visual, 'import { expect, it } from "vitest"; it("checks aggregate baseline count", () => expect(1).toBe(2));\n');
    const head = commit(root, "green implementation and collateral maintenance");
    write(root, reviews + "/test-scope.txt", "ci-only " + visual + "\n");
    const result = node(root, runner, "check", feature, "1",
      'ln -s "' + join(repository, "node_modules") + '" node_modules', ":(glob)**/*.test.ts");
    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout) as unknown).toMatchObject({
      status: "pass", head, deferred_ci: [{ project: "gates-integration", file: visual }],
      focused: { head: { evidence: { status: "green" }, selected: [{ project: "fixture", file: "test/answer.test.ts" }] } },
    });
    const planned = node(root, suite, "plan", ciInventory, "1");
    expect({ status: planned.status, stderr: planned.stderr }).toMatchObject({ status: 0 });
    expect(json(ciInventory)).toMatchObject({
      revision: head, inventory: [
        { project: "fixture", file: "test/answer.test.ts" },
        { project: "gates-integration", file: visual },
      ],
    });
    const results = join(root, "results");
    const resultPath = join(results, "0", "result.json");
    mkdirSync(dirname(resultPath), { recursive: true });
    const ci = node(root, suite, "run", ciInventory, "0", resultPath);
    expect(ci.status).toBe(1);
    const ciReport = json(resultPath) as ShardResult;
    expect(ciReport.revision).toBe(head);
    expect(ciReport.files.find(({ file }) => file === visual)).toMatchObject({
      project: "gates-integration", file: visual, state: "failed", errors: [],
      tests: [{ name: "checks aggregate baseline count", state: "failed", errors: [{ name: "AssertionError" }] }],
    });
    const aggregate = node(root, suite, "verify", ciInventory, results);
    expect(aggregate.status).toBe(1);
    expect(aggregate.stderr).toContain(visual);
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
}, 80_000);

it("prints invalid red labels and sends invalid worker commands to stderr with exit 2", () => {
  const root = fixture();
  try {
    commit(root, "fixture");
    const script = join(repository, "gates/bin/story-evidence.ts");
    const captured = node(root, script, "red", "specs/005-cli", "7", "true", ":(glob)**/*.test.ts", "invalid");
    expect(captured.status).toBe(0);
    expect(captured.stderr).toBe("");
    expect(JSON.parse(captured.stdout) as unknown).toEqual({
      phase: "7", status: "fail", red: false, recorded: false, problem: "invalid red label",
    });
    const bad = node(root, script, "worker", "missing-selection.json");
    expect(bad.status).toBe(2);
    expect(bad.stderr).toBe("invalid focused story evidence arguments\n");
    expect(bad.stdout).toBe("");
  } finally {
    rmSync(root, { force: true, recursive: true });
  }
});

const returnCheck = join(repository, "tooling/speckit/bin/worktree-return-check.sh");

function returnedWorktree(verify: (root: string, base: string, worker: string) => void): void {
  expect(existsSync(returnCheck), "the worktree return checker is available").toBe(true);
  const root = fixture();
  const worker = mkdtempSync(join(tmpdir(), "ocelle-return-worker-"));
  try {
    write(root, "owned.ts", "base\n");
    write(root, "outside.ts", "base\n");
    const base = commit(root, "base");
    git(root, "worktree", "add", "--quiet", "--detach", worker, base);
    verify(root, base, worker);
  } finally {
    rmSync(worker, { force: true, recursive: true });
    rmSync(root, { force: true, recursive: true });
  }
}

function checkReturn(root: string, base: string, ...groups: string[]) {
  return spawnSync("bash", [returnCheck, root, base, ...groups], {
    cwd: root, encoding: "utf8", timeout: 10_000,
  });
}

it("reports a clean sign-off and exact owned paths for a worktree return", () => {
  returnedWorktree((root, base, worker) => {
    write(worker, "owned.ts", "worker change\n");
    const head = commit(worker, "finish owned change");
    const refs = git(root, "show-ref", "--head");
    const result = checkReturn(root, base, worker, "owned.ts");

    expect({ status: result.status, stderr: result.stderr }).toEqual({ status: 0, stderr: "" });
    expect(JSON.parse(result.stdout) as unknown).toMatchObject({ ok: true, head, paths: ["owned.ts"] });
    expect(git(root, "show-ref", "--head")).toBe(refs);
    expect(git(root, "status", "--porcelain")).toBe("");
    expect(git(worker, "rev-parse", "HEAD")).toBe(head);
    expect(git(worker, "status", "--porcelain")).toBe("");
  });
});

it.each([
  {
    label: "a dirty worker",
    change: (_root: string, base: string, worker: string): string => {
      write(worker, "owned.ts", "work to return\n");
      commit(worker, "return owned change");
      write(worker, "owned.ts", "uncommitted edit\n");
      return base;
    },
  },
  {
    label: "a different base",
    change: (root: string, _base: string, worker: string): string => {
      write(worker, "owned.ts", "work on the old base\n");
      commit(worker, "return work from the old base");
      write(root, "outside.ts", "canonical base changed\n");
      return commit(root, "advance canonical base");
    },
  },
  {
    label: "an unsigned commit",
    change: (_root: string, base: string, worker: string): string => {
      write(worker, "owned.ts", "unsigned worker change\n");
      git(worker, "add", "--", "owned.ts");
      git(worker, "commit", "--quiet", "--no-signoff", "-m", "return unsigned work");
      return base;
    },
  },
  {
    label: "a sign-off for someone other than the author",
    change: (_root: string, base: string, worker: string): string => {
      write(worker, "owned.ts", "worker change with mismatched sign-off\n");
      git(worker, "add", "--", "owned.ts");
      git(worker, "commit", "--quiet", "--signoff", "--author", "Another Worker <other@example.com>", "-m", "return someone else's work");
      return base;
    },
  },
  {
    label: "a merge commit",
    change: (root: string, base: string, worker: string): string => {
      write(worker, "owned.ts", "worker change\n");
      commit(worker, "return owned change");
      write(root, "second.ts", "another owned file\n");
      git(worker, "merge", "--quiet", "--signoff", "--no-ff", "--no-edit", commit(root, "another owned change"));
      return base;
    },
  },
  {
    label: "a rename out of the assigned paths",
    change: (_root: string, base: string, worker: string): string => {
      git(worker, "mv", "--", "owned.ts", "renamed.ts");
      commit(worker, "move the owned file outside the assignment");
      return base;
    },
  },
  {
    label: "an out-of-scope edit restored before return",
    change: (_root: string, base: string, worker: string): string => {
      write(worker, "outside.ts", "out-of-scope change\n");
      commit(worker, "touch an unowned path");
      write(worker, "outside.ts", "base\n");
      write(worker, "owned.ts", "worker change\n");
      commit(worker, "restore the unowned file and finish owned work");
      return base;
    },
  },
])("rejects a worktree return with $label", ({ change }) => {
  returnedWorktree((root, base, worker) => {
    const pinned = change(root, base, worker);
    const result = checkReturn(root, pinned, worker, "owned.ts", "second.ts");

    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout) as unknown).toMatchObject({ ok: false });
  });
});

it("rejects overlapping path ownership in a group of worktree returns", () => {
  returnedWorktree((root, base, worker) => {
    const other = mkdtempSync(join(tmpdir(), "ocelle-return-other-"));
    try {
      git(root, "worktree", "add", "--quiet", "--detach", other, base);
      write(worker, "owned.ts", "first worker change\n");
      commit(worker, "first return");
      write(other, "second.ts", "second worker change\n");
      commit(other, "second return");

      const result = checkReturn(root, base, worker, "owned.ts", "--worker", other, "owned.ts", "second.ts");

      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout) as unknown).toMatchObject({ ok: false });
    } finally {
      rmSync(other, { force: true, recursive: true });
    }
  });
});
