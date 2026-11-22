// Focused red/green evidence for the repository's installed and source Spec Kit story extension.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { Vitest } from "vitest/node";
import { runTool } from "../lib/spawn.ts";
import type { ToolRun } from "../lib/spawn.ts";
import { browserIdentity, checkKey as phaseCacheKey } from "../lib/story-cache.ts";
import { collateralTestIdentity, exactStoryCases, plannedStoryResults, selectStoryTests } from "../lib/story-selection.ts";
import type { StoryMode } from "../lib/story-selection.ts";
import { assertionKey, classifyStoryEvidence, decodeCachedEvidence, decodeWorkerResult } from "../lib/test-evidence.ts";
import type { Assertion, StoryEvidence } from "../lib/test-evidence.ts";
import { testFile, testRun, withVitest } from "../lib/vitest-run.ts";

interface Selection {
  readonly changed: readonly string[];
  readonly deleted: readonly string[];
  readonly extra: readonly string[];
  readonly ciOnly?: readonly string[];
  readonly changedLines: Readonly<Record<string, readonly { start: number; end: number }[]>>;
}

interface Check {
  readonly mode: StoryMode;
  readonly revision: string;
  readonly overlay?: string | undefined;
  readonly expected: readonly Assertion[];
  readonly missingModules: readonly string[];
  readonly selection: Selection;
  readonly log: string;
}

interface WorkerInput extends Selection {
  readonly mode: Check["mode"];
  readonly expected: readonly Assertion[];
  readonly missingModules: readonly string[];
}

interface CheckResult {
  readonly evidence: StoryEvidence;
  readonly input: string;
  readonly seconds: number;
  readonly resumed: boolean;
  readonly selected: readonly { project: string; file: string }[];
}

type WorkerContext = Pick<Vitest, "globTestSpecifications" | "runTestSpecifications">;
type WorkerResult = Pick<CheckResult, "evidence" | "selected">;
type WorkerRunner = (root: string, operation: (context: WorkerContext) => Promise<WorkerResult>, includeTaskLocation: boolean) => Promise<WorkerResult>;

export interface PhaseRequest {
  readonly mode: "red" | "check";
  readonly feature: string;
  readonly phase: string;
  readonly setup: string;
  readonly patterns: readonly string[];
  readonly label?: string | undefined;
}

export interface PhaseTools {
  readonly root: string;
  readonly git: (args: readonly string[]) => string;
  readonly exists: (filename: string) => boolean;
  readonly read: (filename: string) => string;
  readonly write: (filename: string, content: string) => void;
  readonly mkdir: (directory: string) => void;
  readonly runCheck: (check: Check, setup: string) => Promise<CheckResult>;
  readonly emit: (value: object, filename?: string) => void;
}

export interface CheckTools {
  readonly root: string;
  readonly pid: number;
  readonly now: () => number;
  readonly key: (check: Check, setup: string) => { key: string; reusable: boolean };
  readonly git: (args: readonly string[], cwd?: string) => string;
  readonly tempDir: () => string;
  readonly exists: (filename: string) => boolean;
  readonly readJson: (filename: string) => unknown;
  readonly writeJson: (filename: string, value: object) => void;
  readonly writeLog: (filename: string, log: string) => void;
  readonly mkdir: (directory: string) => void;
  readonly remove: (target: string, recursive?: boolean) => void;
  readonly rename: (temporary: string, final: string) => void;
  readonly setup: (command: string, cwd: string) => Promise<ToolRun>;
  readonly worker: (cwd: string, input: string, output: string) => Promise<ToolRun>;
}

export interface StoryCommandTools extends Pick<PhaseTools, "root" | "git" | "emit"> {
  readonly phase: (request: PhaseRequest) => Promise<void>;
  readonly worker: (input: string, output: string) => Promise<void>;
  readonly failure: (message: string) => void;
}

export function storyEnvironment(inherited: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return { ...inherited, CI: "true" };
}

const root = process.cwd();
const path = import.meta.filename;
const environment = storyEnvironment(process.env);

export const storyFiles = {
  exists: existsSync,
  read: (filename: string) => readFileSync(filename, "utf8"),
  write: (filename: string, text: string): void => { writeFileSync(filename, text); },
  tempDir: () => mkdtempSync(join(tmpdir(), "ocelle-story-")),
  mkdir: (directory: string): void => { mkdirSync(directory, { recursive: true }); },
  remove: (target: string, recursive = false): void => { rmSync(target, { force: true, recursive }); },
};

function git(args: readonly string[], cwd = root): string {
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function trackedDiff(git: PhaseTools["git"], from: string, to: string, filter: string, patterns: readonly string[] = []): string[] {
  return git(["diff", "--no-renames", "--name-only", "-z", `--diff-filter=${filter}`, from, to, "--", ...patterns])
    .split("\0").filter(Boolean);
}

function revision(git: PhaseTools["git"], value: string): string {
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)) throw new Error("expected a full commit SHA");
  return git(["rev-parse", "--verify", `${value}^{commit}`]).trim();
}

function head(git: PhaseTools["git"]): string {
  return git(["rev-parse", "HEAD"]).trim();
}

function readJson(filename: string): unknown {
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
  return JSON.parse(readFileSync(filename, "utf8")) as unknown;
}

function writeJson(filename: string, value: object): void {
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
  writeFileSync(filename, `${JSON.stringify(value)}\n`);
}

function invalid(problem: string): StoryEvidence {
  return { status: "invalid", assertions: [], problem };
}

export async function replayStoryWorker(root: string, inputPath: string, outputPath: string, runVitest: WorkerRunner): Promise<void> {
  const input = readJson(inputPath) as WorkerInput;
  const result = await runVitest(root, async (context) => {
    const specs = await context.globTestSpecifications();
    const inventory = specs.map((spec) => ({ ...testFile(root, spec), spec }));
    const plan = selectStoryTests(inventory, input);
    if ("problem" in plan) return { evidence: invalid(plan.problem), selected: [] };
    const selectedSpecs = plan.files.map(({ test, cases }) => {
      if (cases !== undefined) test.spec.testNamePattern = exactStoryCases(cases);
      return test.spec;
    });
    const selected = selectedSpecs.map((spec) => testFile(root, spec));
    const run = await context.runTestSpecifications(selectedSpecs);
    const reported = testRun(root, run.testModules, run.unhandledErrors, true);
    const tested = plannedStoryResults(reported, plan.files);
    const { changedTests } = plan;
    const knownHelpers = [
      ...input.expected.map((assertion) => assertion.helper?.file),
      ...tested.files.flatMap((file) => file.tests.flatMap((test) => test.errors.map(({ helperFile }) => helperFile))),
    ].filter((file) => file !== undefined);
    const sources = [...new Set([...changedTests, ...knownHelpers])].flatMap((file) => {
      const path = resolve(root, file);
      return path.startsWith(`${root}/`) && storyFiles.exists(path) ? [[file, storyFiles.read(path).split(/\r?\n/)] as const] : [];
    });
    const evidence = classifyStoryEvidence({
      run: tested,
      selected,
      changedTests,
      expected: input.expected,
      allowMissingModule: input.mode === "base",
      missingModules: input.missingModules,
      changedLines: input.changedLines,
      sources: Object.fromEntries(sources),
    });
    return { evidence, selected };
  }, true);
  writeJson(outputPath, result);
}

function scope(dir: string, tools: PhaseTools): { extra: readonly string[]; ciOnly: readonly string[] } {
  const filename = join(dir, "test-scope.txt");
  if (!tools.exists(filename)) return { extra: [], ciOnly: [] };
  const paths = tools.read(filename).split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
  const extra = new Set<string>();
  const ciOnly = new Set<string>();
  const entries = paths.map((line) => {
    const directive = /^ci-only(?:\s|$)/.test(line);
    return { target: directive ? ciOnly : extra, path: directive ? line.slice("ci-only".length).trim() : line };
  });
  if (entries.some(({ path }) => path === "" || isAbsolute(path) || path.startsWith("-") || path.split("/").includes(".."))) {
    throw new Error("test-scope.txt must contain repository-relative test paths");
  }
  for (const { target, path } of entries) target.add(path);
  return { extra: [...extra], ciOnly: [...ciOnly] };
}

function selection(from: string, to: string, patterns: readonly string[], extra: readonly string[], tools: PhaseTools): Selection {
  const changed = trackedDiff(tools.git, from, to, "AMT", patterns);
  const changedLines = Object.fromEntries(changed.map((file) => {
    const diff = tools.git(["diff", "--no-renames", "--no-color", "--no-ext-diff", "--unified=0", from, to, "--", file]);
    const ranges = [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].flatMap((match) => {
      const start = Number(match[1]);
      const count = Number(match[2] ?? 1);
      return count > 0 ? [{ start, end: start + count - 1 }] : [];
    });
    return [file, ranges];
  }));
  return { changed, changedLines, deleted: trackedDiff(tools.git, from, to, "D", patterns), extra };
}

function safeLog(value: string, tested: string, root: string): string {
  return value.replaceAll(tested, "<worktree>").replaceAll(root, "<repository>");
}

function checkKey(check: Check, setup: string): { key: string; reusable: boolean } {
  const browser = browserIdentity(environment.OCELLE_CHROMIUM_PATH, {
    bundledChromium: () => {
      // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
      const require = createRequire(join(root, "package.json"));
      // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
      const playwright = require("playwright") as typeof import("playwright");
      return playwright.chromium.executablePath();
    },
    file: (filename) => {
      const path = realpathSync(filename);
      const stat = statSync(path);
      return { path, regular: stat.isFile(), size: stat.size, modified: stat.mtimeMs };
    },
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
    version: (filename) => execFileSync(filename, ["--version"], { encoding: "utf8" }),
  });
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
  const pnpm = execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim();
  return phaseCacheKey(check, setup, {
    browser,
    environment,
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    pnpm,
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
    tree: (revision) => git(["rev-parse", `${revision}^{tree}`]).trim(),
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
    blob: (revision, file) => git(["rev-parse", `${revision}:${file}`]).trim(),
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
    runnerFile: (file) => readFileSync(join(root, file), "utf8"),
  });
}

function canReuse(mode: Check["mode"], evidence: StoryEvidence): boolean {
  return mode === "head" ? evidence.status === "green"
    : evidence.status === "red" || (mode === "base" && evidence.status === "missing-module");
}

export async function runCheck(check: Check, setup: string, tools: CheckTools): Promise<CheckResult> {
  const { root, git, readJson, writeJson } = tools;
  const started = tools.now();
  const { key: input, reusable } = tools.key(check, setup);
  const cache = join(root, "reports/story-evidence", `${input}.json`);
  try {
    const record = reusable ? readJson(cache) : null;
    const evidence = decodeCachedEvidence(record, input);
    if (evidence !== undefined && canReuse(check.mode, evidence)) {
      // The decoder validates both fields before returning evidence.
      const { log, selected } = record as Pick<CheckResult, "selected"> & { log: string };
      tools.writeLog(check.log, `Reused completed evidence ${input}\n${log}`);
      return { evidence, input, seconds: (tools.now() - started) / 1000, resumed: true, selected };
    }
  } catch {
    // A missing or interrupted cache entry has no evidentiary value.
  }

  const temporary = tools.tempDir();
  const tested = join(temporary, "checkout");
  let evidence: StoryEvidence;
  let selected: CheckResult["selected"] = [];
  let log = "";
  try {
    git(["worktree", "add", "--quiet", "--detach", tested, check.revision]);
    if (check.overlay !== undefined) {
      if (check.selection.changed.length > 0) git(["restore", `--source=${check.overlay}`, "--worktree", "--", ...check.selection.changed], tested);
      for (const deleted of check.selection.deleted) tools.remove(join(tested, deleted));
    }
    const setupRun = await tools.setup(setup, tested);
    if (setupRun.exitCode !== 0) {
      evidence = invalid("worktree setup failed");
      log = setupRun.stdout + setupRun.stderr;
    } else {
      const pending = join(temporary, "selection.json");
      const report = join(temporary, "result.json");
      writeJson(pending, { ...check.selection, mode: check.mode, expected: check.expected, missingModules: check.missingModules });
      const ran = await tools.worker(tested, pending, report);
      log = ran.stdout + ran.stderr;
      if (ran.exitCode !== 0 || !tools.exists(report)) {
        evidence = invalid(`focused Vitest worker failed (exit ${String(ran.exitCode)})`);
      } else {
        const result = decodeWorkerResult(readJson(report));
        if (result === undefined) evidence = invalid("focused Vitest worker returned incomplete evidence");
        else ({ evidence, selected } = result);
      }
    }
  } catch (error) {
    evidence = invalid(`replay worktree failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (tools.exists(tested)) {
      try {
        git(["worktree", "remove", "--force", tested]);
      } catch {
        // Git may need to prune this worktree after an interrupted install.
      }
    }
    tools.remove(temporary, true);
  }
  const seconds = (tools.now() - started) / 1000;
  evidence = JSON.parse(safeLog(JSON.stringify(evidence), tested, root)) as StoryEvidence;
  log = `${JSON.stringify({ mode: check.mode, revision: check.revision, overlay: check.overlay, input, selected, evidence, seconds })}\n${safeLog(log, tested, root)}`;
  tools.writeLog(check.log, log);
  if (reusable && canReuse(check.mode, evidence)) {
    tools.mkdir(dirname(cache));
    const pending = `${cache}.${String(tools.pid)}.tmp`;
    writeJson(pending, { key: input, evidence, log, selected });
    tools.rename(pending, cache);
  }
  return { evidence, input, seconds, resumed: false, selected };
}

function expectedStatus(result: CheckResult): number {
  if (result.evidence.status === "green") return 0;
  if (result.evidence.status === "red") return 1;
  if (result.evidence.status === "missing-module") return 3;
  return 2;
}

function testsOnly(git: PhaseTools["git"], from: string, to: string, patterns: readonly string[], feature: string): boolean {
  return trackedDiff(git, from, to, "ACDMRTUXB", [...patterns.map((item) => item.replace(/^:\(glob\)/, ":(exclude,glob)")),
    `:(exclude)${feature}`]).length === 0;
}

function ancestor(git: PhaseTools["git"], older: string, newer: string): boolean {
  try {
    git(["merge-base", "--is-ancestor", older, newer]);
    return true;
  } catch {
    return false;
  }
}

function records(dir: string, tools: PhaseTools): { name: string; sha: string }[] {
  const file = join(dir, "red-commits");
  if (!tools.exists(file)) return [];
  const seen = new Set<string>();
  return tools.read(file).trim().split("\n").filter(Boolean).map((line) => {
    const [name, sha, surplus] = line.trim().split(/\s+/);
    if (name === undefined || !/^(?:phase|fix-\d+)$/.test(name) || sha === undefined || surplus !== undefined || seen.has(name)) {
      throw new Error("invalid red-commits entry");
    }
    seen.add(name);
    return { name, sha };
  });
}

export function emitStoryReport(value: object, filename: string | undefined, print: (message: string) => void): void {
  if (filename !== undefined) writeJson(filename, value);
  print(JSON.stringify(value));
}

export async function checkPhase(request: PhaseRequest, tools: PhaseTools): Promise<void> {
  const { mode, feature, phase, setup, patterns, label } = request;
  const { root, git, emit, runCheck } = tools;
  const dir = join(root, feature, "reviews", `phase-${phase}`);
  if (!/^\d+$/.test(phase) || !resolve(dir).startsWith(`${root}/`)) throw new Error("invalid phase path");
  tools.mkdir(dir);
  const current = head(git);
  const { extra, ciOnly } = scope(dir, tools);
  if (mode === "red") {
    if (label === undefined || !/^(?:phase|fix-\d+)$/.test(label)) throw new Error("invalid red label");
    const old = `${current}^`;
    const tests = testsOnly(git, old, current, patterns, feature);
    const log = join(dir, `red-${label}.log`);
    const result = await runCheck({ mode, revision: current, selection: selection(old, current, patterns, extra, tools), expected: [], missingModules: [], log }, setup);
    const code = expectedStatus(result);
    const recorded = tests && code === 1;
    if (recorded) {
      const lines = records(dir, tools).filter(({ name }) => name !== label).map(({ name, sha }) => `${name} ${sha}`);
      tools.write(join(dir, "red-commits"), `${[...lines, `${label} ${current}`].join("\n")}\n`);
    }
    emit({ phase, label, sha: current, tests_only: tests, red: code === 1, recorded, exit_code: code, log, ...result });
    return;
  }

  const out = join(dir, "tdd-check.json");
  const baseFile = join(dir, "base.sha");
  if (!tools.exists(baseFile)) {
    emit({ phase, status: "fail", problems: ["no base.sha: the phase was not started by the story workflow"] }, out);
    return;
  }
  const base = revision(git, tools.read(baseFile).trim());
  const redRecords = records(dir, tools);
  const exemption = join(dir, "tdd-exempt.md");
  if (tools.exists(exemption) && redRecords.length === 0) {
    if (ciOnly.length > 0) throw new Error("ci-only scope requires recorded local proof");
    emit({ phase, status: "exempt", reason_file: exemption, head: current }, out);
    return;
  }
  const scaffoldFile = join(dir, "scaffold.sha");
  const scaffold = tools.exists(scaffoldFile) ? revision(git, tools.read(scaffoldFile).trim()) : undefined;
  const problems: string[] = [];
  if (!ancestor(git, base, current)) problems.push("base is not in the history of HEAD");
  if (scaffold !== undefined && (!ancestor(git, base, scaffold) || !ancestor(git, scaffold, current))) problems.push("scaffold is not between base and HEAD");
  if (redRecords.length === 0) problems.push("no red commit recorded (red.sh) and no tdd-exempt.md");
  const reds = [];
  const fixProofs: { label: string; base: string; expected: readonly Assertion[] }[] = [];
  let phaseAssertions: readonly Assertion[] = [];
  const discovered = new Map<string, Assertion>();
  for (const { name, sha } of redRecords) {
    const red = revision(git, sha);
    if (!ancestor(git, red, current) || !testsOnly(git, `${red}^`, red, patterns, feature)) {
      problems.push(`red commit ${name} is outside HEAD or changes non-test files`);
      continue;
    }
    const result = await runCheck({ mode: "red", revision: red, selection: selection(`${red}^`, red, patterns, extra, tools),
      expected: [], missingModules: [], log: join(dir, `check-red-${name}.log`) }, setup);
    const code = expectedStatus(result);
    if (code !== 1) problems.push(`red commit ${name}: ${result.evidence.problem ?? "no failing assertion"}`);
    const assertions = result.evidence.assertions;
    if (name === "phase") phaseAssertions = assertions;
    else fixProofs.push({ label: name, base: git(["rev-parse", `${red}^`]).trim(), expected: assertions });
    for (const assertion of assertions) discovered.set(assertionKey(assertion), assertion);
    reds.push({ label: name, sha: red, exit_code: code, ...result });
  }

  const finalSelection = selection(base, current, patterns, extra, tools);
  const headSelection = ciOnly.length === 0 ? finalSelection : { ...finalSelection, ciOnly };
  const expected = [...discovered.values()];
  const missingModules = scaffold === undefined ? [] : trackedDiff(git, base, scaffold, "A");
  const settled = async (kind: Check["mode"], tested: string, name: string, assertions: readonly Assertion[]): Promise<CheckResult> => runCheck({
    mode: kind, revision: tested, overlay: kind === "head" ? undefined : current,
    selection: kind === "head" ? headSelection : finalSelection, expected: assertions,
    missingModules, log: join(dir, name),
  }, setup);
  const initialAssertions = phaseAssertions.length > 0 ? phaseAssertions : expected;
  const onBase = await settled("base", base, "check-final-tests-on-base.log", initialAssertions);
  const onScaffold = scaffold === undefined ? undefined : await settled("scaffold", scaffold, "check-final-tests-on-scaffold.log", initialAssertions);
  const fixes = [];
  for (const proof of fixProofs) {
    const result = await settled("fix", proof.base, `check-final-tests-on-${proof.label}-base.log`, proof.expected);
    if (expectedStatus(result) !== 1) problems.push(`final tests on ${proof.label} base: ${result.evidence.problem ?? "no failing assertion"}`);
    fixes.push({ label: proof.label, base: proof.base, ...result });
  }
  const atHead = await settled("head", current, "check-head.log", expected);
  const baseExit = expectedStatus(onBase);
  const scaffoldExit = onScaffold === undefined ? null : expectedStatus(onScaffold);
  const headExit = expectedStatus(atHead);
  if (baseExit !== 1 && !(baseExit === 3 && scaffoldExit === 1)) problems.push(`final tests on base: ${onBase.evidence.problem ?? "no failing assertion"}`);
  if (scaffoldExit !== null && scaffoldExit !== 1) problems.push(`final tests on scaffold: ${onScaffold?.evidence.problem ?? "no failing assertion"}`);
  if (headExit !== 0) problems.push(`final tests on HEAD: ${atHead.evidence.problem ?? "tests failed"}`);
  emit({
    phase, status: problems.length === 0 ? "pass" : "fail", base, head: current, red_commits: reds,
    ...(ciOnly.length === 0 ? {} : { deferred_ci: ciOnly.map(collateralTestIdentity) }),
    final_tests_on_base_exit: baseExit, final_tests_on_scaffold_exit: scaffoldExit, head_exit: headExit, problems,
    focused: { base: onBase, scaffold: onScaffold, head: atHead, fixes },
  }, out);
}

export async function runStoryCommand(args: readonly string[], tools: StoryCommandTools): Promise<void> {
  const [mode, arg, phase, setup, patterns, label] = args;
  const { root, git, emit } = tools;
  try {
    if (mode === "worker" && arg !== undefined && phase !== undefined) {
      await tools.worker(arg, phase);
    } else if ((mode === "red" || mode === "check") && arg !== undefined && phase !== undefined && setup !== undefined && patterns !== undefined) {
      await tools.phase({ mode, feature: arg, phase, setup, patterns: patterns.match(/\S+/g) ?? [], label });
    } else {
      throw new Error("invalid focused story evidence arguments");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (mode === "check" && arg !== undefined && phase !== undefined) {
      emit({ phase, status: "fail", head: head(git), problems: [message] }, join(root, arg, "reviews", `phase-${phase}`, "tdd-check.json"));
    } else if (mode === "red") {
      emit({ phase, status: "fail", red: false, recorded: false, problem: message });
    } else {
      tools.failure(message);
    }
  }
}

// Stryker disable next-line ConditionalExpression: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "prints invalid red labels and sends invalid worker commands to stderr with exit 2"
if (import.meta.main) {
  const checkTools: CheckTools = {
    ...storyFiles, root, pid: process.pid, now: Date.now, key: checkKey, git, readJson, writeJson, rename: renameSync, writeLog: storyFiles.write,
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
    setup: (command, cwd) => runTool("bash", ["-c", command], cwd, environment),
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
    worker: (cwd, input, output) => runTool(process.execPath, [path, "worker", input, output], cwd, environment),
  };
  // Stryker disable next-line BlockStatement,CallExpression: process stdout boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "prints invalid red labels and sends invalid worker commands to stderr with exit 2"
  const emit: PhaseTools["emit"] = (value, filename) => { emitStoryReport(value, filename, console.log); };
  const [, , ...args] = process.argv;
  await runStoryCommand(args, {
    root, git, emit,
    phase: (request) => checkPhase(request, {
      ...storyFiles, root, git, emit, runCheck: (check, command) => runCheck(check, command, checkTools),
    }),
    worker: async (input, output) => {
      await replayStoryWorker(root, input, output, withVitest);
      process.exitCode = 0; // A red assertion is represented in the result, not as a crashed worker.
    },
    // Stryker disable next-line BlockStatement: process exit boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "prints invalid red labels and sends invalid worker commands to stderr with exit 2"
    failure: (message) => {
      // Stryker disable next-line CallExpression: process stderr boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "prints invalid red labels and sends invalid worker commands to stderr with exit 2"
      console.error(message);
      process.exitCode = 2;
    },
  });
}
