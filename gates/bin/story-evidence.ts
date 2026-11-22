// Focused red/green evidence for the repository's installed and source Spec Kit story extension.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { runTool } from "../lib/spawn.ts";
import { classifyStoryEvidence, decodeCachedEvidence, storyEvidenceKey } from "../lib/test-evidence.ts";
import type { Assertion, StoryEvidence } from "../lib/test-evidence.ts";
import { testFile, testRun, withVitest } from "../lib/vitest-run.ts";

interface Selection {
  readonly changed: readonly string[];
  readonly deleted: readonly string[];
  readonly extra: readonly string[];
  readonly changedLines: Readonly<Record<string, readonly { start: number; end: number }[]>>;
}

interface Check {
  readonly mode: "red" | "base" | "scaffold" | "fix" | "head";
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

const root = process.cwd();
const path = import.meta.filename;
const environment: NodeJS.ProcessEnv = { ...process.env, CI: "true" };
const trackedRunner = [
  "gates/bin/story-evidence.ts",
  "gates/lib/test-evidence.ts",
  "gates/lib/vitest-run.ts",
  "gates/lib/spawn.ts",
  ".specify/extensions/story/story-config.yml",
  ".specify/extensions/story/scripts/common.sh",
  ".specify/extensions/story/scripts/red.sh",
  ".specify/extensions/story/scripts/tdd-check.sh",
];

function git(args: readonly string[], cwd = root): string {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function trackedDiff(from: string, to: string, filter: string, patterns: readonly string[] = []): string[] {
  return git(["diff", "--no-renames", "--name-only", "-z", `--diff-filter=${filter}`, from, to, "--", ...patterns])
    .split("\0").filter(Boolean);
}

function revision(value: string): string {
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(value)) throw new Error("expected a full commit SHA");
  return git(["rev-parse", "--verify", `${value}^{commit}`]).trim();
}

function head(): string {
  return git(["rev-parse", "HEAD"]).trim();
}

function readJson(filename: string): unknown {
  return JSON.parse(readFileSync(filename, "utf8")) as unknown;
}

function writeJson(filename: string, value: object): void {
  writeFileSync(filename, `${JSON.stringify(value)}\n`);
}

function invalid(problem: string): StoryEvidence {
  return { status: "invalid", assertions: [], problem };
}

const testName = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

async function worker(inputPath: string, outputPath: string): Promise<void> {
  const input = readJson(inputPath) as WorkerInput;
  const result = await withVitest(root, async (context) => {
    const specs = await context.globTestSpecifications();
    const inventory = specs.map((spec) => testFile(root, spec));
    const available = new Set(inventory.map(({ file }) => file));
    const changedTests = input.changed.filter((file) => available.has(file));
    const absent = input.changed.find((file) => testName.test(file) && !available.has(file) && !file.startsWith("gates/plants/"));
    if (absent !== undefined) return { evidence: invalid(`changed test was not discovered: ${absent}`), selected: [] };
    if (changedTests.length === 0) return { evidence: invalid("the phase changed no runnable test file"), selected: [] };
    const changedSupport = input.changed.length > changedTests.length || input.deleted.length > 0;
    const extra = input.extra.filter((file) => available.has(file));
    if (input.mode === "head" && extra.length !== input.extra.length) {
      return { evidence: invalid("test-scope.txt names an absent test file"), selected: [] };
    }
    const chosen = new Set([...changedTests, ...extra]);
    const proof = input.mode === "base" || input.mode === "scaffold" || input.mode === "fix";
    const expectedNames = (project: string, file: string): string[] =>
      input.expected.filter((assertion) => assertion.file === file && assertion.project === project).map((assertion) => assertion.test);
    const selectedSpecs = specs.filter((spec) => {
      const { project, file } = testFile(root, spec);
      if (!proof) return changedSupport && extra.length === 0 || chosen.has(file);
      const names = expectedNames(project, file);
      if (names.length === 0) return false;
      spec.testNamePattern = new RegExp(`^(?:${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`);
      return true;
    });
    const selected = selectedSpecs.map((spec) => testFile(root, spec));
    const run = await context.runTestSpecifications(selectedSpecs);
    const reported = testRun(root, run.testModules, run.unhandledErrors, true);
    const tested = proof ? { ...reported, files: reported.files.map((file) => ({
      ...file,
      tests: file.tests.filter((test) => expectedNames(file.project, file.file).includes(test.name)),
    })) } : reported;
    const evidence = classifyStoryEvidence({
      run: tested,
      selected,
      changedTests,
      expected: input.expected,
      allowMissingModule: input.mode === "base" && input.missingModules.length > 0,
      missingModules: input.missingModules,
      changedLines: input.changedLines,
      sources: Object.fromEntries(changedTests.map((file) => [file, readFileSync(join(root, file), "utf8").split(/\r?\n/)])),
    });
    return { evidence, selected };
  }, true);
  writeJson(outputPath, result);
  process.exitCode = 0; // A red assertion is represented in the result, not as a crashed worker.
}

function scope(dir: string): string[] {
  const filename = join(dir, "test-scope.txt");
  if (!existsSync(filename)) return [];
  const paths = readFileSync(filename, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "" && !line.startsWith("#"));
  if (paths.some((entry) => isAbsolute(entry) || entry.startsWith("-") || entry.split("/").includes(".."))) {
    throw new Error("test-scope.txt must contain repository-relative test paths");
  }
  return [...new Set(paths)];
}

function selection(from: string, to: string, patterns: readonly string[], dir: string): Selection {
  const changed = trackedDiff(from, to, "AMT", patterns);
  const changedLines = Object.fromEntries(changed.map((file) => {
    const diff = git(["diff", "--no-renames", "--no-color", "--no-ext-diff", "--unified=0", from, to, "--", file]);
    const ranges = [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)].flatMap((match) => {
      const start = Number(match[1]);
      const count = Number(match[2] ?? 1);
      return count > 0 ? [{ start, end: start + count - 1 }] : [];
    });
    return [file, ranges];
  }));
  return { changed, changedLines, deleted: trackedDiff(from, to, "D", patterns), extra: scope(dir) };
}

function safeLog(value: string, tested: string): string {
  return value.replaceAll(tested, "<worktree>").replaceAll(root, "<repository>");
}

async function browserIdentity(): Promise<object | null> {
  try {
    const require = createRequire(join(root, "package.json"));
    const playwright = await import(require.resolve("playwright")) as typeof import("playwright");
    const chromium = realpathSync(process.env.OCELLE_CHROMIUM_PATH || playwright.chromium.executablePath());
    const version = execFileSync(chromium, ["--version"], { encoding: "utf8" }).trim();
    const stat = statSync(chromium);
    if (process.env.OCELLE_CHROMIUM_PATH) return { chromium, version, size: stat.size, modified: stat.mtimeMs };
    const linuxShell = playwright.chromium.executablePath().replace(
      /chromium-(\d+)\/chrome-linux64\/chrome$/,
      "chromium_headless_shell-$1/chrome-headless-shell-linux64/chrome-headless-shell",
    );
    if (linuxShell === chromium || !existsSync(linuxShell)) return null;
    const shell = statSync(linuxShell);
    return { chromium, version, size: stat.size, modified: stat.mtimeMs, shell: linuxShell, shellSize: shell.size, shellModified: shell.mtimeMs };
  } catch {
    return null; // A runnable checkout can still verify with per-worktree setup. It cannot reuse unpinned evidence.
  }
}

async function checkKey(check: Check, setup: string): Promise<{ key: string; reusable: boolean }> {
  const overlay = check.overlay === undefined ? [] : check.selection.changed.map((file) => [file, git(["rev-parse", `${check.overlay ?? ""}:${file}`]).trim()]);
  const runtime = ["OCELLE_CHROMIUM_PATH", "PLAYWRIGHT_BROWSERS_PATH", "NODE_OPTIONS", "TZ", "LANG", "LC_ALL"].map((name) => [name, process.env[name] ?? ""]);
  const chromium = await browserIdentity();
  const pnpm = execFileSync("pnpm", ["--version"], { encoding: "utf8" }).trim();
  const key = storyEvidenceKey({
    mode: check.mode,
    testedTree: git(["rev-parse", `${check.revision}^{tree}`]).trim(),
    overlay,
    selection: check.selection,
    expected: check.expected,
    missingModules: check.missingModules,
    setup,
    node: process.version,
    platform: `${process.platform}/${process.arch}`,
    pnpm,
    chromium,
    runtime,
    runner: trackedRunner.map((file) => readFileSync(join(root, file), "utf8")),
  });
  return { key, reusable: chromium !== null };
}

function canReuse(mode: Check["mode"], evidence: StoryEvidence): boolean {
  return mode === "head" ? evidence.status === "green"
    : evidence.status === "red" || (mode === "base" && evidence.status === "missing-module");
}

async function runCheck(check: Check, setup: string): Promise<CheckResult> {
  const started = Date.now();
  const { key: input, reusable } = await checkKey(check, setup);
  const cache = join(root, "reports/story-evidence", `${input}.json`);
  try {
    const record = (reusable ? readJson(cache) : null) as { key?: unknown; evidence?: unknown; log?: unknown; selected?: unknown };
    const evidence = decodeCachedEvidence(record, input);
    if (evidence !== undefined && canReuse(check.mode, evidence) && typeof record.log === "string" && Array.isArray(record.selected)) {
      const selected = record.selected as CheckResult["selected"];
      writeFileSync(check.log, `Reused completed evidence ${input}\n${record.log}`);
      return { evidence, input, seconds: (Date.now() - started) / 1000, resumed: true, selected };
    }
  } catch {
    // A missing or interrupted cache entry has no evidentiary value.
  }

  const temporary = mkdtempSync(join(tmpdir(), "ocelle-story-"));
  const tested = join(temporary, "checkout");
  let evidence: StoryEvidence;
  let selected: CheckResult["selected"] = [];
  let log = "";
  try {
    git(["worktree", "add", "--quiet", "--detach", tested, check.revision]);
    if (check.overlay !== undefined) {
      if (check.selection.changed.length > 0) git(["restore", `--source=${check.overlay}`, "--worktree", "--", ...check.selection.changed], tested);
      for (const deleted of check.selection.deleted) rmSync(join(tested, deleted), { force: true });
    }
    const setupRun = await runTool("bash", ["-c", setup], tested, environment);
    if (setupRun.exitCode !== 0) {
      evidence = invalid("worktree setup failed");
      log = setupRun.stdout + setupRun.stderr;
    } else {
      const pending = join(temporary, "selection.json");
      const report = join(temporary, "result.json");
      writeJson(pending, { ...check.selection, mode: check.mode, expected: check.expected, missingModules: check.missingModules });
      const ran = await runTool(process.execPath, [path, "worker", pending, report], tested, environment);
      log = ran.stdout + ran.stderr;
      if (ran.exitCode !== 0 || !existsSync(report)) {
        evidence = invalid(`focused Vitest worker failed (exit ${String(ran.exitCode)})`);
      } else {
        const result = readJson(report) as { evidence: StoryEvidence; selected: CheckResult["selected"] };
        ({ evidence, selected } = result);
      }
    }
  } catch (error) {
    evidence = invalid(`replay worktree failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (existsSync(tested)) {
      try {
        git(["worktree", "remove", "--force", tested]);
      } catch {
        // Git may need to prune this worktree after an interrupted install.
      }
    }
    rmSync(temporary, { force: true, recursive: true });
  }
  const seconds = (Date.now() - started) / 1000;
  evidence = JSON.parse(safeLog(JSON.stringify(evidence), tested)) as StoryEvidence;
  log = `${JSON.stringify({ mode: check.mode, revision: check.revision, overlay: check.overlay, input, selected, evidence, seconds })}\n${safeLog(log, tested)}`;
  writeFileSync(check.log, log);
  if (reusable && canReuse(check.mode, evidence)) {
    mkdirSync(dirname(cache), { recursive: true });
    const pending = `${cache}.${String(process.pid)}.tmp`;
    writeJson(pending, { key: input, evidence, log, selected });
    renameSync(pending, cache);
  }
  return { evidence, input, seconds, resumed: false, selected };
}

function expectedStatus(result: CheckResult): number {
  if (result.evidence.status === "green") return 0;
  if (result.evidence.status === "red") return 1;
  if (result.evidence.status === "missing-module") return 3;
  return 2;
}

function testsOnly(from: string, to: string, patterns: readonly string[], feature: string): boolean {
  return trackedDiff(from, to, "ACDMRTUXB", [...patterns.map((item) => item.replace(/^:\(glob\)/, ":(exclude,glob)")),
    `:(exclude)${feature}`]).length === 0;
}

function ancestor(older: string, newer: string): boolean {
  try {
    git(["merge-base", "--is-ancestor", older, newer]);
    return true;
  } catch {
    return false;
  }
}

function records(dir: string): string[][] {
  const file = join(dir, "red-commits");
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").trim().split("\n").filter(Boolean).map((line) => line.trim().split(/\s+/));
}

function emit(value: object, filename?: string): void {
  if (filename !== undefined) writeJson(filename, value);
  console.log(JSON.stringify(value));
}

async function checkPhase(mode: string, feature: string, phase: string, setup: string, patterns: string[], label?: string): Promise<void> {
  const dir = join(root, feature, "reviews", `phase-${phase}`);
  if (!/^\d+$/.test(phase) || !resolve(dir).startsWith(`${root}/`)) throw new Error("invalid phase path");
  mkdirSync(dir, { recursive: true });
  const current = head();
  if (mode === "red") {
    if (label === undefined || !/^(?:phase|fix-\d+)$/.test(label)) throw new Error("invalid red label");
    const old = `${current}^`;
    const tests = testsOnly(old, current, patterns, feature);
    const log = join(dir, `red-${label}.log`);
    const result = await runCheck({ mode, revision: current, selection: selection(old, current, patterns, dir), expected: [], missingModules: [], log }, setup);
    const code = expectedStatus(result);
    const recorded = tests && code === 1;
    if (recorded) {
      const lines = records(dir).filter(([existing]) => existing !== label).map((fields) => fields.join(" "));
      writeFileSync(join(dir, "red-commits"), `${[...lines, `${label} ${current}`].join("\n")}\n`);
    }
    emit({ phase, label, sha: current, tests_only: tests, red: code === 1, recorded, exit_code: code, log, ...result });
    return;
  }

  const out = join(dir, "tdd-check.json");
  const baseFile = join(dir, "base.sha");
  if (!existsSync(baseFile)) {
    emit({ phase, status: "fail", problems: ["no base.sha: the phase was not started by the story workflow"] }, out);
    return;
  }
  const base = revision(readFileSync(baseFile, "utf8").trim());
  const redRecords = records(dir);
  const exemption = join(dir, "tdd-exempt.md");
  if (existsSync(exemption) && redRecords.length === 0) {
    emit({ phase, status: "exempt", reason_file: exemption, head: current }, out);
    return;
  }
  const scaffoldFile = join(dir, "scaffold.sha");
  const scaffold = existsSync(scaffoldFile) ? revision(readFileSync(scaffoldFile, "utf8").trim()) : undefined;
  const problems: string[] = [];
  if (!ancestor(base, current)) problems.push("base is not in the history of HEAD");
  if (scaffold !== undefined && (!ancestor(base, scaffold) || !ancestor(scaffold, current))) problems.push("scaffold is not between base and HEAD");
  if (redRecords.length === 0) problems.push("no red commit recorded (red.sh) and no tdd-exempt.md");
  const reds = [];
  const fixProofs: { label: string; base: string; expected: readonly Assertion[] }[] = [];
  let phaseAssertions: readonly Assertion[] = [];
  const discovered = new Map<string, Assertion>();
  for (const [name, sha] of redRecords) {
    if (name === undefined || !/^(?:phase|fix-\d+)$/.test(name) || sha === undefined) throw new Error("invalid red-commits entry");
    const red = revision(sha);
    if (!ancestor(red, current) || !testsOnly(`${red}^`, red, patterns, feature)) {
      problems.push(`red commit ${name} is outside HEAD or changes non-test files`);
      continue;
    }
    const result = await runCheck({ mode: "red", revision: red, selection: selection(`${red}^`, red, patterns, dir),
      expected: [], missingModules: [], log: join(dir, `check-red-${name}.log`) }, setup);
    const code = expectedStatus(result);
    if (code !== 1) problems.push(`red commit ${name}: ${result.evidence.problem ?? "no failing assertion"}`);
    const assertions = result.evidence.assertions;
    if (name === "phase") phaseAssertions = assertions;
    else fixProofs.push({ label: name, base: git(["rev-parse", `${red}^`]).trim(), expected: assertions });
    for (const assertion of assertions) discovered.set(JSON.stringify([assertion.project, assertion.file, assertion.test, assertion.source?.text, assertion.source?.occurrence]), assertion);
    reds.push({ label: name, sha: red, exit_code: code, ...result });
  }

  const finalSelection = selection(base, current, patterns, dir);
  const expected = [...discovered.values()];
  const missingModules = scaffold === undefined ? [] : trackedDiff(base, scaffold, "A");
  const settled = async (kind: Check["mode"], tested: string, name: string, assertions: readonly Assertion[]): Promise<CheckResult> => runCheck({
    mode: kind, revision: tested, overlay: kind === "head" ? undefined : current, selection: finalSelection, expected: assertions,
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
    final_tests_on_base_exit: baseExit, final_tests_on_scaffold_exit: scaffoldExit, head_exit: headExit, problems,
    focused: { base: onBase, scaffold: onScaffold, head: atHead, fixes },
  }, out);
}

const [mode, arg, phase, setup, patterns, label] = process.argv.slice(2);
try {
  if (mode === "worker" && arg !== undefined && phase !== undefined) {
    await worker(arg, phase);
  } else if ((mode === "red" || mode === "check") && arg !== undefined && phase !== undefined && setup !== undefined && patterns !== undefined) {
    await checkPhase(mode, arg, phase, setup, patterns.split(/\s+/).filter(Boolean), label);
  } else {
    throw new Error("invalid focused story evidence arguments");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (mode === "check" && arg !== undefined && phase !== undefined) {
    emit({ phase, status: "fail", head: head(), problems: [message] }, join(root, arg, "reviews", `phase-${phase}`, "tdd-check.json"));
  } else if (mode === "red") {
    emit({ phase, status: "fail", red: false, recorded: false, problem: message });
  } else {
    console.error(message);
    process.exitCode = 2;
  }
}
