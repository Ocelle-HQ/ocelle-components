import { createHash } from "node:crypto";
import { posix } from "node:path";

export interface TestFile {
  readonly project: string;
  readonly file: string;
}

export interface Failure {
  readonly name: string;
  readonly message: string;
}

export interface TestCaseResult {
  readonly name: string;
  readonly state: "passed" | "failed" | "skipped" | "pending";
  readonly errors: readonly Failure[];
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

export interface Assertion {
  readonly project: string;
  readonly file: string;
  readonly test: string;
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
}

const revisionPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonempty(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function fileShape(value: unknown): value is TestFile {
  return object(value) && nonempty(value.project) && nonempty(value.file)
    && !value.file.startsWith("/") && !value.file.startsWith("../") && posix.normalize(value.file) === value.file;
}

function fileKey(value: TestFile): string {
  return JSON.stringify([value.project, value.file]);
}

function assertionKey(value: Assertion): string {
  return JSON.stringify([value.project, value.file, value.test]);
}

function fileKeys(files: readonly TestFile[]): string[] {
  return files.map(fileKey).sort();
}

function sameInventory(expected: readonly TestFile[], actual: readonly TestFile[]): boolean {
  return JSON.stringify(fileKeys(expected)) === JSON.stringify(fileKeys(actual));
}

function weight(file: TestFile): number {
  // A starting estimate for projects with browser navigation or a build. The matrix records actual file timing.
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
  const ranked = [...sorted].sort((left, right) => weight(right) - weight(left));
  for (const entry of ranked) {
    const smallest = bins.reduce((left, right) => right.weight < left.weight ? right : left);
    smallest.files.push(entry);
    smallest.weight += weight(entry);
  }
  return { revision, inventory: sorted, shards: bins.map((bin) => bin.files) };
}

function filesShape(value: unknown): value is TestFile[] {
  return Array.isArray(value) && value.every(fileShape);
}

export function validTestPlan(value: unknown, revision: string): value is UnitTestPlan {
  return object(value) && revisionPattern.test(revision) && value.revision === revision
    && filesShape(value.inventory) && value.inventory.length > 0
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
  return object(value) && nonempty(value.revision) && typeof value.index === "number" && Number.isInteger(value.index)
    && failuresShape(value.errors) && Array.isArray(value.files) && value.files.every(fileResultShape);
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
    if (!sameInventory(expected, result.files)) throw new Error(`shard ${String(result.index)} inventory differs from the plan`);
    if (result.errors.length > 0) throw new Error(`shard ${String(result.index)} reported errors`);
    for (const entry of result.files) {
      const incomplete = entry.tests.find((test) => test.state !== "passed");
      if (entry.state !== "passed" || entry.errors.length > 0 || entry.tests.length === 0 || incomplete !== undefined) {
        const state = incomplete?.state ?? entry.state;
        throw new Error(`${entry.file} (${entry.project}) reported ${state}, errors, or no tests`);
      }
      tests += entry.tests.length;
    }
  }
  return { files: plan.inventory.length, tests };
}

function invalid(problem: string): StoryEvidence {
  return { status: "invalid", assertions: [], problem };
}

function knownMissingModule(entry: TestFileResult, missing: readonly string[]): boolean {
  // A collection failure is admissible on the pre-scaffold base only for a module added by that scaffold.
  return entry.errors.length > 0 && entry.tests.length === 0 && entry.errors.every(({ message }) => {
    const path = /(?:Cannot find module|Failed to load url) ['"]?([^\s'"]+)/i.exec(message)?.[1];
    if (path === undefined) return false;
    const normalized = path.startsWith(".") ? posix.join(posix.dirname(entry.file), path) : path;
    return missing.includes(normalized);
  });
}

export function classifyStoryEvidence(input: StoryEvidenceInput): StoryEvidence {
  const { run, selected, changedTests, expected, allowMissingModule, missingModules } = input;
  if (run.errors.length > 0) return invalid(`run error: ${run.errors[0]?.message ?? ""}`);
  if (selected.length === 0 || !sameInventory(selected, run.files)) return invalid("test result inventory differs from the selection");

  const assertions: Assertion[] = [];
  const testIdentities = new Map<string, number>();
  let moduleMissing = false;
  for (const entry of run.files) {
    const changed = changedTests.includes(entry.file);
    if (entry.errors.length > 0) {
      if (allowMissingModule === true && changed && knownMissingModule(entry, missingModules ?? [])) {
        moduleMissing = true;
        continue;
      }
      return invalid(`file error in ${entry.file}: ${entry.errors[0]?.message ?? ""}`);
    }
    if (entry.tests.length === 0 || entry.state === "pending" || entry.state === "queued" || entry.state === "skipped") {
      return invalid(`no completed tests in ${entry.file}`);
    }
    for (const test of entry.tests) {
      if (test.state === "pending" || test.state === "skipped") return invalid(`${entry.file}: ${test.state} test ${test.name}`);
      const assertion = { file: entry.file, project: entry.project, test: test.name };
      const identity = assertionKey(assertion);
      testIdentities.set(identity, (testIdentities.get(identity) ?? 0) + 1);
      if (test.state !== "failed") continue;
      if (!changed) return invalid(`unrelated failure in ${entry.file}: ${test.name}`);
      if (test.errors.length === 0 || test.errors.some(({ name }) => name !== "AssertionError")) {
        return invalid(`non-assertion error in ${entry.file}: ${test.name}`);
      }
      assertions.push(assertion);
    }
    if (entry.state === "failed" && !entry.tests.some((test) => test.state === "failed")) {
      return invalid(`file error in ${entry.file} without a failing assertion`);
    }
  }
  const actual = new Set(assertions.map(assertionKey));
  if (assertions.some((assertion) => testIdentities.get(assertionKey(assertion)) !== 1)) {
    return invalid("failing assertion has an ambiguous test name in its file");
  }
  const verification = expected?.map(assertionKey) ?? [];
  if (verification.length > 0) {
    if (moduleMissing) return { status: "missing-module", assertions };
    if (verification.some((assertion) => testIdentities.get(assertion) !== 1)) return invalid("expected assertion test missing or ambiguous in the replay");
    if (assertions.length > 0 && (verification.some((assertion) => !actual.has(assertion))
      || assertions.some((assertion) => !verification.includes(assertionKey(assertion))))) {
      return invalid("expected assertion failures did not match replayed failures");
    }
  }
  if (moduleMissing) return { status: "missing-module", assertions };
  return { status: assertions.length > 0 ? "red" : "green", assertions };
}

export function storyEvidenceKey(input: object): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function assertionShape(value: unknown): value is Assertion {
  return object(value) && fileShape(value) && nonempty(value.test);
}

export function decodeCachedEvidence(record: unknown, key: string): StoryEvidence | undefined {
  if (!object(record) || record.key !== key || !object(record.evidence)) return undefined;
  const { status, assertions } = record.evidence;
  if (!Array.isArray(assertions) || !assertions.every(assertionShape)) return undefined;
  if (new Set(assertions.map(assertionKey)).size !== assertions.length) return undefined;
  if (status === "green" && assertions.length === 0) return { status, assertions };
  if (status === "red" && assertions.length > 0) return { status, assertions };
  if (status === "missing-module") return { status, assertions };
  return undefined;
}
