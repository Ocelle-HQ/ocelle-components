// Select focused story runs from Vitest's discovered inventory. The caller supplies the inventory and runs the plan.
import type { Assertion, TestFile, TestRun } from "./test-evidence.ts";

export type StoryMode = "red" | "base" | "scaffold" | "fix" | "head";

export interface StoryScope {
  readonly mode: StoryMode;
  readonly changed: readonly string[];
  readonly deleted: readonly string[];
  readonly extra: readonly string[];
  readonly expected: readonly Assertion[];
  readonly ciOnly?: readonly string[];
}

interface SelectionEntry<T extends TestFile> {
  readonly test: T;
  readonly cases?: readonly string[];
}

export type StorySelection<T extends TestFile> =
  | { readonly problem: string }
  | { readonly changedTests: readonly string[]; readonly files: readonly SelectionEntry<T>[] };

const testName = /\.(?:test|spec)\.[cm]?[jt]sx?$/;
const collateralFiles = new Set([
  "gates/test/integration/visual.test.ts",
  "gates/test/integration/axe.test.ts",
]);

export function collateralTestIdentity(file: string): TestFile {
  return { project: "gates-integration", file };
}

function sameFile(first: TestFile, second: TestFile): boolean {
  return first.file === second.file && first.project === second.project;
}

export function selectStoryTests<T extends TestFile>(inventory: readonly T[], scope: StoryScope): StorySelection<T> {
  const deferred = new Set(scope.mode === "head" ? scope.ciOnly : []);
  for (const file of deferred) {
    if (!collateralFiles.has(file)) return { problem: `test is ineligible for ci-only scope: ${file}` };
    if (scope.extra.includes(file)) return { problem: `conflicting local and ci-only scope: ${file}` };
    if (!scope.changed.includes(file)) return { problem: `ci-only scope requires a changed test: ${file}` };
    if (scope.expected.some((assertion) => assertion.file === file || assertion.helper?.file === file)) {
      return { problem: `ci-only scope cannot defer a recorded red assertion or helper: ${file}` };
    }
    const matches = inventory.filter((test) => test.file === file);
    if (matches.length !== 1 || matches[0]?.project !== collateralTestIdentity(file).project) {
      return { problem: `ci-only test was not discovered in its registered project: ${file}` };
    }
  }
  const available = new Set(inventory.map(({ file }) => file));
  const changedTests = scope.changed.filter((file) => available.has(file));
  const absent = scope.changed.find((file) => testName.test(file) && !available.has(file) && !file.startsWith("gates/plants/"));
  if (absent !== undefined) return { problem: `changed test was not discovered: ${absent}` };
  if (changedTests.length === 0) return { problem: "the phase changed no runnable test file" };

  const extra = scope.extra.filter((file) => available.has(file));
  if (scope.mode === "head" && extra.length !== scope.extra.length) return { problem: "test-scope.txt names an absent test file" };

  if (scope.mode === "red" || scope.mode === "head") {
    const sharedSupport = scope.changed.length > changedTests.length || scope.deleted.length > 0;
    const localChanged = changedTests.filter((file) => !deferred.has(file));
    if (localChanged.length === 0) return { problem: "ci-only scope leaves no changed runnable local test" };
    const chosen = new Set([...localChanged, ...extra]);
    const selected = sharedSupport && extra.length === 0 ? inventory : inventory.filter((test) => chosen.has(test.file));
    return { changedTests: localChanged, files: selected.filter((test) => !deferred.has(test.file)).map((test) => ({ test })) };
  }

  if (scope.expected.length === 0) return { problem: "no independently proven red assertions are available for replay" };
  const files = inventory.flatMap((test) => {
    const cases = scope.expected.filter((assertion) => sameFile(test, assertion)).map((assertion) => assertion.test);
    return cases.length === 0 ? [] : [{ test, cases }];
  });
  return { changedTests, files };
}

export function exactStoryCases(cases: readonly string[]): RegExp {
  return new RegExp(`^(?:${cases.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`);
}

export function plannedStoryResults(run: TestRun, files: readonly SelectionEntry<TestFile>[]): TestRun {
  return {
    ...run,
    files: run.files.map((file) => {
      const cases = files.find(({ test }) => sameFile(test, file))?.cases;
      return cases === undefined ? file : { ...file, tests: file.tests.filter((test) => cases.includes(test.name)) };
    }),
  };
}
