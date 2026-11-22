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

export function planTestShards(revision: string, _inventory: readonly TestFile[], _count: number): UnitTestPlan {
  return { revision, inventory: [], shards: [] };
}

export function verifyTestShards(_plan: unknown, _results: unknown, _revision: string): { files: number; tests: number } {
  return { files: 0, tests: 0 };
}

export function classifyStoryEvidence(_input: StoryEvidenceInput): StoryEvidence {
  return { status: "invalid", assertions: [], problem: "not implemented" };
}

export function storyEvidenceKey(_input: object): string {
  return "";
}

export function decodeCachedEvidence(_record: unknown, _key: string): StoryEvidence | undefined {
  return undefined;
}
