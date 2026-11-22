import { describe, expect, it } from "vitest";
import { exactStoryCases, plannedStoryResults, selectStoryTests } from "../lib/story-selection.ts";
import type { StoryScope } from "../lib/story-selection.ts";
import type { TestCaseResult, TestFile, TestFileResult, TestRun } from "../lib/test-evidence.ts";

const browser = { project: "elements (chromium)", file: "packages/elements/test/textarea.test.ts" };
const desktop = { ...browser, project: "elements-fixture" };
const related = { project: browser.project, file: "packages/elements/test/form.test.ts" };
const other = { project: "gates", file: "gates/test/styles.test.ts" };
const inventory = [browser, desktop, related, other];
const changed = [browser.file];
const omitted = "packages/elements/test/after.test.ts";
const support = "packages/elements/test/scenarios/form.ts";

function scope(overrides: Partial<StoryScope> = {}): StoryScope {
  return { mode: "head", changed, deleted: [], extra: [], expected: [], ...overrides };
}

const baseSelection = { changedTests: changed, files: [{ test: browser }, { test: desktop }] };
const fullSelection = { changedTests: changed, files: inventory.map((test) => ({ test })) };

describe("discovered phase scope", () => {
  it("keeps every configured project of the changed file in the ordinary focused run", () => {
    expect(selectStoryTests(inventory, scope())).toEqual(baseSelection);
    expect(selectStoryTests(inventory, scope({ mode: "red" }))).toEqual(baseSelection);
  });

  it("includes a phase's additional discovered scope alongside changed tests", () => {
    const result = selectStoryTests(inventory, scope({ changed: [...changed, support], extra: [related.file] }));
    expect(result).toEqual({ ...baseSelection, files: [...baseSelection.files, { test: related }] });
  });

  it("falls back to the full suite for unscoped changed or deleted support", () => {
    expect(selectStoryTests(inventory, scope({ changed: [...changed, support] }))).toEqual(fullSelection);
    expect(selectStoryTests(inventory, scope({ deleted: [support] }))).toEqual(fullSelection);
  });

  it("does not mistake an intentionally excluded plant fixture for a discovered suite", () => {
    const paths = [...changed, "gates/plants/unit-tests/example/tree/gates/test/broken.test.ts"];
    expect(selectStoryTests(inventory, scope({ changed: paths }))).toEqual(fullSelection);
  });

  it.each(["test.ts", "spec.cts", "test.mts", "spec.tsx", "spec.js"])("reports an undiscovered changed %s test", (extension) => {
    const file = `packages/elements/test/absent.${extension}`;
    expect(selectStoryTests(inventory, scope({ changed: [...changed, file] })))
      .toEqual({ problem: `changed test was not discovered: ${file}` });
  });

  it("fails a phase with no changed runnable suite even when another suite was requested", () => {
    expect(selectStoryTests(inventory, scope({ changed: [support], extra: [related.file] })))
      .toEqual({ problem: "the phase changed no runnable test file" });
  });

  it("rejects an unknown declared scope at head but allows future test files before head", () => {
    expect(selectStoryTests(inventory, scope({ extra: [omitted] })))
      .toEqual({ problem: "test-scope.txt names an absent test file" });
    expect(selectStoryTests(inventory, scope({ mode: "red", extra: [omitted] }))).toEqual(baseSelection);
  });
});

describe("exact proof scope", () => {
  const first = { ...browser, test: "[keyboard] accepts a paragraph (Tab+Enter)" };
  const second = { ...browser, test: "answer?" };
  const fixture = { ...desktop, test: "blocks submission via CSP" };
  const unrelatedProject = { ...related, project: desktop.project, test: "should stay outside the proof" };

  it.each(["base", "scaffold", "fix"] as const)("replays only the proven name, file and configured project on %s", (mode) => {
    const expected = [second, fixture, first, unrelatedProject];
    expect(selectStoryTests(inventory, scope({ mode, expected, extra: [other.file], deleted: [support] }))).toEqual({
      changedTests: changed,
      files: [{ test: browser, cases: [second.test, first.test] }, { test: desktop, cases: [fixture.test] }],
    });
  });

  it("names the missing proof when none of the red commits yielded assertions", () => {
    expect(selectStoryTests(inventory, scope({ mode: "base" })))
      .toEqual({ problem: "no independently proven red assertions are available for replay" });
  });

  it("matches full case names literally, even with regex syntax", () => {
    const names = [first.test, second.test, "^dollar$.\\slash{1}|anything*"];
    const match = exactStoryCases(names);
    const probes = [...names, `prefix ${first.test}`, `${second.test} suffix`, "answer", ""];
    expect(probes.map((probe) => match.test(probe))).toEqual([true, true, true, false, false, false, false]);
  });

  it("retains the selected cases and runner errors without agglomerating projects that share a file", () => {
    const row = { name: first.test, state: "failed", errors: [{ name: "AssertionError", message: "no answer" }] } satisfies TestCaseResult;
    const unrelated = { name: second.test, state: "skipped", errors: [] } satisfies TestCaseResult;
    function result(test: TestFile): TestFileResult {
      return { ...test, state: "failed", errors: [], durationMs: 1, tests: [row, unrelated] };
    }
    const reports: TestRun = {
      files: [result(browser), result(desktop), result(related)],
      errors: [{ name: "Warning", message: "outside test" }],
    };
    const only = [{ test: browser, cases: [row.name] }, { test: desktop }];
    expect(plannedStoryResults(reports, only)).toEqual({
      files: [{ ...result(browser), tests: [row] }, result(desktop), result(related)],
      errors: reports.errors,
    });
  });
});
