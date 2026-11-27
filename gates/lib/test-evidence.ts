import { createHash } from "node:crypto";
import { posix } from "node:path";

export interface TestFile {
  readonly project: string;
  readonly file: string;
}

export interface Failure {
  readonly name: string;
  readonly message: string;
  readonly line?: number;
  readonly helperFile?: string;
  readonly helperLine?: number;
}

export interface TestCaseResult {
  readonly name: string;
  readonly state: "passed" | "failed" | "skipped" | "pending";
  readonly errors: readonly Failure[];
  readonly startLine?: number;
}

export interface TestFileResult extends TestFile {
  readonly state: TestCaseResult["state"] | "queued";
  readonly errors: readonly Failure[];
  readonly tests: readonly TestCaseResult[];
  readonly durationMs: number;
}

export interface TestRun {
  readonly files: readonly TestFileResult[];
  readonly errors: readonly Failure[];
}

export interface UnitTestPlan {
  readonly revision: string;
  readonly inventory: readonly TestFile[];
  readonly shards: readonly (readonly TestFile[])[];
}

export interface ShardResult extends TestRun {
  readonly revision: string;
  readonly index: number;
}

export interface AssertionSource {
  readonly text: string;
  readonly occurrence: number;
  readonly line: number;
}

export interface Assertion {
  readonly project: string;
  readonly file: string;
  readonly test: string;
  readonly source?: AssertionSource;
  readonly helper?: AssertionSource & { readonly file: string };
  readonly diagnostic?: string;
}

export interface StoryEvidence {
  readonly status: "red" | "green" | "missing-module" | "invalid";
  readonly assertions: readonly Assertion[];
  readonly problem?: string;
}

export interface StoryEvidenceInput {
  readonly run: TestRun;
  readonly selected: readonly TestFile[];
  readonly changedTests: readonly string[];
  readonly expected?: readonly Assertion[];
  readonly allowMissingModule?: boolean;
  readonly missingModules?: readonly string[];
  readonly sources?: Readonly<Record<string, readonly string[]>>;
  readonly changedLines?: Readonly<Record<string, readonly { start: number; end: number }[]>>;
}

const revisionPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function relativeFile(value: unknown): value is string {
  return nonempty(value) && !value.startsWith("/") && value !== "." && value !== ".."
    && !value.startsWith("../") && posix.normalize(value) === value;
}

function fileShape(value: unknown): value is TestFile {
  return object(value) && nonempty(value.project) && relativeFile(value.file);
}

function fileKey(value: TestFile): string {
  return JSON.stringify([value.project, value.file]);
}

export function assertionKey(value: Assertion): string {
  const { project, file, test, source, helper } = value;
  return JSON.stringify([project, file, test, source?.text, source?.occurrence, helper?.file, helper?.text, helper?.occurrence]);
}

function fileKeys(files: readonly TestFile[]): string[] {
  return files.map(fileKey).sort();
}

function sameInventory(expected: readonly TestFile[], actual: readonly TestFile[]): boolean {
  return JSON.stringify(fileKeys(expected)) === JSON.stringify(fileKeys(actual));
}

function unmatchedFiles(files: readonly TestFile[], other: readonly TestFile[]): string[] {
  const counts = new Map<string, number>();
  for (const key of fileKeys(other)) counts.set(key, (counts.get(key) ?? 0) + 1);
  return fileKeys(files).filter((key) => {
    const count = counts.get(key) ?? 0;
    if (count === 0) return true;
    counts.set(key, count - 1);
    return false;
  });
}

// Unit tests rollout run 45046420891 exposed a small group taking over two minutes per file.
// These whole-second estimates use its six shard reports. Other and newly discovered files use project estimates.
// The split Visual estimates apportion the unsplit 2709 s measured in run 45672824182. Each of the three
// capture-heavy files performs at least one whole-repository capture. The CLI cases fail before capture.
const measuredSeconds = new Map([
  [fileKey({ project: "gates-integration", file: "gates/test/integration/visual.test.ts" }), 900],
  [fileKey({ project: "gates-integration", file: "gates/test/integration/visual-findings.test.ts" }), 900],
  [fileKey({ project: "gates-integration", file: "gates/test/integration/visual-cli.test.ts" }), 30],
  [fileKey({ project: "gates-integration", file: "gates/test/integration/visual-capture.test.ts" }), 880],
  [fileKey({ project: "gates-integration", file: "gates/test/integration/axe.test.ts" }), 530],
  [fileKey({ project: "elements-browser", file: "packages/elements/test/browser/drawer.test.ts" }), 349],
  [fileKey({ project: "elements (chromium)", file: "packages/elements/test/drawer.test.ts" }), 332],
  [fileKey({ project: "elements-browser", file: "packages/elements/test/browser/dialog.test.ts" }), 309],
  [fileKey({ project: "elements (chromium)", file: "packages/elements/test/dialog.test.ts" }), 293],
  [fileKey({ project: "elements-browser", file: "packages/elements/test/browser/notice.test.ts" }), 193],
  [fileKey({ project: "storybook-integration", file: "storybook/test/integration/elements-stories.test.ts" }), 192],
  [fileKey({ project: "elements-browser", file: "packages/elements/test/browser/button.test.ts" }), 155],
]);

export function estimateTestSeconds(file: TestFile): number {
  const measured = measuredSeconds.get(fileKey(file));
  if (measured !== undefined) return measured;
  if (file.project === "elements-build" || file.project === "storybook-integration") return 15;
  if (file.project.startsWith("elements") && file.project !== "elements-node") return 10;
  if (file.project.endsWith("-browser") || file.project.endsWith("-integration")) return 5;
  return 1;
}

export function planTestShards(revision: string, inventory: readonly TestFile[], count: number): UnitTestPlan {
  const sorted = [...inventory].sort((left, right) => fileKey(left).localeCompare(fileKey(right)));
  if (!revisionPattern.test(revision) || !Number.isInteger(count) || count < 1 || count > sorted.length
    || sorted.some((entry) => !fileShape(entry)) || new Set(fileKeys(sorted)).size !== sorted.length) {
    throw new Error("invalid revision, shard count, or test inventory");
  }

  const bins = Array.from({ length: count }, () => ({ files: [] as TestFile[], weight: 0 }));
  const ranked = [...sorted].sort((left, right) => estimateTestSeconds(right) - estimateTestSeconds(left));
  for (const entry of ranked) {
    const smallest = bins.reduce((left, right) => right.weight < left.weight ? right : left);
    smallest.files.push(entry);
    smallest.weight += estimateTestSeconds(entry);
  }
  return { revision, inventory: sorted, shards: bins.map((bin) => bin.files) };
}

function filesShape(value: unknown): value is TestFile[] {
  return Array.isArray(value) && value.every(fileShape);
}

export function validTestPlan(value: unknown, revision: string): value is UnitTestPlan {
  return object(value) && revisionPattern.test(revision) && value.revision === revision
    && filesShape(value.inventory)
    && new Set(fileKeys(value.inventory)).size === value.inventory.length
    && Array.isArray(value.shards) && value.shards.length > 0
    && value.shards.every((shard): shard is TestFile[] => filesShape(shard) && shard.length > 0)
    && sameInventory(value.inventory, value.shards.flat());
}

function failuresShape(value: unknown): value is Failure[] {
  return Array.isArray(value) && value.every((error: unknown) =>
    object(error) && typeof error.name === "string" && typeof error.message === "string");
}

function testState(value: unknown): value is TestCaseResult["state"] {
  return value === "passed" || value === "failed" || value === "skipped" || value === "pending";
}

function fileResultShape(value: unknown): value is TestFileResult {
  if (!object(value)) return false;
  const { state, errors, tests, durationMs } = value;
  return fileShape(value) && (testState(state) || state === "queued")
    && failuresShape(errors) && typeof durationMs === "number" && Number.isFinite(durationMs) && durationMs >= 0
    && Array.isArray(tests) && tests.every((test: unknown) =>
      object(test) && nonempty(test.name) && testState(test.state) && failuresShape(test.errors));
}

function shardShape(value: unknown): value is ShardResult {
  return object(value) && nonempty(value.revision) && Number.isInteger(value.index)
    && failuresShape(value.errors) && Array.isArray(value.files) && value.files.every(fileResultShape);
}

function passingShardTests(expected: readonly TestFile[], result: ShardResult): number {
  const shownErrors = result.errors.slice(0, 8).map(({ name, message }) =>
    [name, message].filter(Boolean).join(": ").replace(/\s+/g, " ").trim().slice(0, 500));
  const omittedErrors = result.errors.length - shownErrors.length;
  if (omittedErrors > 0) shownErrors.push(`${String(omittedErrors)} runner errors omitted (see result.json)`);
  const errorSummary = shownErrors.join("; ");
  if (!sameInventory(expected, result.files)) {
    const missing = unmatchedFiles(expected, result.files);
    const unexpected = unmatchedFiles(result.files, expected);
    const details = [`shard ${String(result.index)} inventory differs from the plan`];
    if (missing.length > 0) details.push(`missing: ${missing.join(", ")}`);
    if (unexpected.length > 0) details.push(`unexpected: ${unexpected.join(", ")}`);
    if (result.errors.length > 0) details.push(`reported errors: ${errorSummary}`);
    throw new Error(details.join("; "));
  }
  if (result.errors.length > 0) throw new Error(`shard ${String(result.index)} reported errors: ${errorSummary}`);
  let tests = 0;
  for (const entry of result.files) {
    const incomplete = entry.tests.find((test) => test.state !== "passed" || test.errors.length > 0);
    if (entry.state !== "passed" || entry.errors.length > 0 || entry.tests.length === 0 || incomplete !== undefined) {
      const state = incomplete?.state ?? entry.state;
      throw new Error(`${entry.file} (${entry.project}) reported ${state}, errors, or no tests`);
    }
    tests += entry.tests.length;
  }
  return tests;
}

export function verifyTestShard(assigned: readonly TestFile[], result: unknown): { files: number; tests: number } {
  if (!shardShape(result)) throw new Error("malformed shard results");
  return { files: assigned.length, tests: passingShardTests(assigned, result) };
}

export function verifyTestShards(plan: unknown, results: unknown, revision: string): { files: number; tests: number } {
  if (!validTestPlan(plan, revision)) throw new Error("invalid plan inventory or revision");
  if (!Array.isArray(results) || !results.every(shardShape)) throw new Error("malformed shard results");
  if (results.length !== plan.shards.length) {
    throw new Error(`received ${String(results.length)} of ${String(plan.shards.length)} shard results`);
  }

  const seen = new Set<number>();
  let tests = 0;
  for (const result of results) {
    if (result.revision !== revision) throw new Error("shard revision does not match the plan");
    const expected = plan.shards[result.index];
    if (expected === undefined) throw new Error(`unknown shard index ${String(result.index)}`);
    if (seen.has(result.index)) throw new Error(`duplicate shard index ${String(result.index)}`);
    seen.add(result.index);
    tests += passingShardTests(expected, result);
  }
  return { files: plan.inventory.length, tests };
}

function invalid(problem: string): StoryEvidence {
  return { status: "invalid", assertions: [], problem };
}

function knownMissingModule(entry: TestFileResult, missing: readonly string[]): boolean {
  // A collection failure is admissible on the pre-scaffold base only for a module added by that scaffold.
  return entry.tests.length === 0 && entry.errors.every(({ message }) => {
    const path = /(?:Cannot find module|Failed to load url) ['"]?([^\s'"]+)/i.exec(message)?.[1];
    if (path === undefined) return false;
    const normalized = path.startsWith(".") ? posix.join(posix.dirname(entry.file), path) : path;
    return missing.includes(normalized);
  });
}

function assertionSource(lines: readonly string[], start: number, line: number): AssertionSource | undefined {
  const text = lines[line - 1]?.trim();
  if (!text || start > line || start < 1) return undefined;
  const occurrence = lines.slice(start - 1, line).filter((candidate) => candidate.trim() === text).length;
  return { text, occurrence, line };
}

function sourceExists(test: TestCaseResult, entry: TestFileResult, expectation: Assertion, sources: StoryEvidenceInput["sources"]): boolean {
  const { source, helper } = expectation;
  if (helper !== undefined) {
    const lines = sources?.[helper.file];
    if (lines === undefined || lines.filter((line) => line.trim() === helper.text).length < helper.occurrence) return false;
  }
  if (source === undefined) return true;
  const lines = sources?.[entry.file];
  const start = test.startLine;
  if (start === undefined || lines === undefined) return false;
  const end = entry.tests.reduce((next, { startLine }) => startLine !== undefined && startLine > start ? Math.min(next, startLine) : next,
    lines.length + 1);
  return lines.slice(start - 1, end - 1)
    .filter((line) => line.trim() === source.text).length >= source.occurrence;
}

function fileAssertions(
  entry: TestFileResult,
  input: StoryEvidenceInput,
  testIdentities: Map<string, number>,
): { assertions: readonly Assertion[]; problem?: string } {
  const assertions: Assertion[] = [];
  const problem = (message: string) => ({ assertions: [], problem: message });
  const changed = input.changedTests.includes(entry.file);
  const lines = input.sources?.[entry.file];
  const allowedLines = input.changedLines?.[entry.file] ?? [];
  for (const test of entry.tests) {
    if (test.state === "pending" || test.state === "skipped") return problem(`${entry.file}: ${test.state} test ${test.name}`);
    const assertion = { file: entry.file, project: entry.project, test: test.name };
    const identity = assertionKey(assertion);
    testIdentities.set(identity, (testIdentities.get(identity) ?? 0) + 1);
    if (test.state !== "failed") continue;
    if (!changed) return problem(`unrelated failure in ${entry.file}: ${test.name}`);
    if (test.errors.length === 0 || test.errors.some(({ name }) => name !== "AssertionError")) {
      return problem(`non-assertion error in ${entry.file}: ${test.name}`);
    }
    if (input.changedLines === undefined) {
      assertions.push(assertion);
      continue;
    }
    for (const { line, message, helperFile, helperLine } of test.errors) {
      if (line === undefined || test.startLine === undefined) {
        return problem(`unlocated assertion in ${entry.file}: ${test.name}: ${message}`);
      }
      if (!allowedLines.some(({ start, end }) => line >= start && line <= end)) {
        return problem(`unchanged assertion in ${entry.file}:${String(line)}: ${test.name}: ${message}`);
      }
      const source = lines === undefined ? undefined : assertionSource(lines, test.startLine, line);
      if (source === undefined) return problem(`unlocated source in ${entry.file}:${String(line)}: ${test.name}`);
      let helper: Assertion["helper"];
      if (helperFile !== undefined && helperLine !== undefined) {
        const helperSource = assertionSource(input.sources?.[helperFile] ?? [], 1, helperLine);
        if (helperSource === undefined) return problem(`unlocated helper assertion in ${helperFile}:${String(helperLine)}`);
        helper = { file: helperFile, ...helperSource };
      }
      assertions.push({ ...assertion, source, ...(helper === undefined ? {} : { helper }), diagnostic: message });
    }
  }
  if (entry.state === "failed" && assertions.length === 0) return problem(`file error in ${entry.file} without a failing assertion`);
  return { assertions };
}

export function classifyStoryEvidence(input: StoryEvidenceInput): StoryEvidence {
  const { run, selected, changedTests, expected, allowMissingModule, missingModules } = input;
  const [runError] = run.errors;
  if (runError !== undefined) return invalid(`run error: ${runError.message}`);
  if (selected.length === 0 || !sameInventory(selected, run.files)) return invalid("test result inventory differs from the selection");

  const assertions: Assertion[] = [];
  const testIdentities = new Map<string, number>();
  const absent = new Set<string>();
  for (const entry of run.files) {
    const [fileError] = entry.errors;
    if (fileError !== undefined) {
      if (allowMissingModule === true && missingModules !== undefined && changedTests.includes(entry.file) && knownMissingModule(entry, missingModules)) {
        absent.add(fileKey(entry));
        continue;
      }
      return invalid(`file error in ${entry.file}: ${fileError.message}`);
    }
    if (entry.tests.length === 0 || entry.state === "pending" || entry.state === "queued" || entry.state === "skipped") {
      return invalid(`no completed tests in ${entry.file}`);
    }
    const result = fileAssertions(entry, input, testIdentities);
    if (result.problem !== undefined) return invalid(result.problem);
    assertions.push(...result.assertions);
  }
  if (assertions.some(({ project, file, test }) => testIdentities.get(assertionKey({ project, file, test })) !== 1)) {
    return invalid("failing assertion has an ambiguous test name in its file");
  }
  const unique = new Map(assertions.map((assertion) => [assertionKey(assertion), assertion]));
  const actual = [...unique.values()];
  const verification = (expected ?? []).filter((assertion) => !absent.has(fileKey(assertion)));
  const mismatch = "expected assertion test or source missing or ambiguous in the replay";
  for (const assertion of verification) {
    const entry = run.files.find((file) => fileKey(file) === fileKey(assertion));
    if (entry === undefined) return invalid(mismatch);
    const [test, duplicate] = entry.tests.filter((test) => test.name === assertion.test);
    if (test === undefined || duplicate !== undefined || !sourceExists(test, entry, assertion, input.sources)) return invalid(mismatch);
  }
  const expectedKeys = new Set(verification.map(assertionKey));
  if ((expected?.length ?? 0) > 0 && actual.length > 0
    && (actual.length !== expectedKeys.size || actual.some((assertion) => !expectedKeys.has(assertionKey(assertion))))) {
    return invalid("expected assertion failures did not match replayed failures");
  }
  if (absent.size > 0) return { status: "missing-module", assertions: actual };
  return { status: actual.length > 0 ? "red" : "green", assertions: actual };
}

export function storyEvidenceKey(input: object): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function sourceShape(value: unknown): value is AssertionSource {
  return object(value) && nonempty(value.text) && typeof value.occurrence === "number" && Number.isInteger(value.occurrence) && value.occurrence >= 1
    && typeof value.line === "number" && Number.isInteger(value.line) && value.line >= 1;
}

function assertionShape(value: unknown): value is Assertion {
  return object(value) && fileShape(value) && nonempty(value.test) && sourceShape(value.source)
    && (value.helper === undefined || (object(value.helper) && sourceShape(value.helper) && relativeFile(value.helper.file)))
    && nonempty(value.diagnostic);
}

export function decodeWorkerResult(record: unknown): { evidence: StoryEvidence; selected: readonly TestFile[] } | undefined {
  if (!object(record) || !object(record.evidence) || !filesShape(record.selected)) return undefined;
  const { status, assertions, problem } = record.evidence;
  if (!Array.isArray(assertions) || !assertions.every(assertionShape)) return undefined;
  const selected = record.selected;
  const identities = new Set(fileKeys(selected));
  if (identities.size !== selected.length || new Set(assertions.map(assertionKey)).size !== assertions.length
    || assertions.some((assertion) => !identities.has(fileKey(assertion)))) return undefined;

  if (status === "invalid" && assertions.length === 0 && nonempty(problem)) {
    return { evidence: { status, assertions, problem }, selected };
  }
  if (selected.length === 0 || problem !== undefined) return undefined;
  if ((status === "green" && assertions.length === 0) || (status === "red" && assertions.length > 0) || status === "missing-module") {
    return { evidence: { status, assertions }, selected };
  }
  return undefined;
}

export function decodeCachedEvidence(record: unknown, key: string): StoryEvidence | undefined {
  if (!object(record) || record.key !== key || typeof record.log !== "string") return undefined;
  const decoded = decodeWorkerResult(record);
  if (decoded === undefined) return undefined;
  const { evidence, selected } = decoded;
  const { status } = evidence;
  let header: unknown;
  try {
    const end = record.log.indexOf("\n");
    header = JSON.parse(end === -1 ? record.log : record.log.slice(0, end));
  } catch {
    // Leave header undefined so malformed JSON fails the same object check as other invalid headers.
  }
  if (!object(header) || header.input !== key || typeof header.revision !== "string" || !revisionPattern.test(header.revision)
    || typeof header.seconds !== "number" || !Number.isFinite(header.seconds) || header.seconds < 0
    || !filesShape(header.selected) || !sameInventory(selected, header.selected)
    || JSON.stringify(record.evidence) !== JSON.stringify(header.evidence)) return undefined;
  if (status === "green" && header.mode === "head") return evidence;
  if (status === "red" && (header.mode === "red" || header.mode === "base" || header.mode === "scaffold" || header.mode === "fix")) {
    return evidence;
  }
  if (status === "missing-module" && header.mode === "base") return evidence;
  return undefined;
}
