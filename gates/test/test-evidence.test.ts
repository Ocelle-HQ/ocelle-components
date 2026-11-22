import { describe, expect, it } from "vitest";
import {
  classifyStoryEvidence,
  decodeCachedEvidence,
  planTestShards,
  storyEvidenceKey,
  verifyTestShards,
} from "../lib/test-evidence.ts";
import type { Failure, ShardResult, StoryEvidenceInput, TestCaseResult, TestFileResult, UnitTestPlan } from "../lib/test-evidence.ts";

const revision = "a".repeat(40);
const input = { project: "elements (chromium)", file: "packages/elements/test/textarea.test.ts" };
const other = { project: "elements", file: "packages/elements/test/other.test.ts" };
const assertion = { ...input, test: "keeps the submitted paragraphs" };
const assertionError = { name: "AssertionError", message: "expected empty string to equal the answer" };

function file(test: typeof input, errors: readonly Failure[] = [], state: TestCaseResult["state"] = "passed"): TestFileResult {
  return {
    ...test,
    state,
    errors: [],
    durationMs: 23,
    tests: [{ name: assertion.test, state, errors }],
  };
}

function story(files: readonly TestFileResult[], fields: Partial<StoryEvidenceInput> = {}): StoryEvidenceInput {
  return { run: { files, errors: [] }, selected: [input], changedTests: [input.file], ...fields };
}

describe("phase evidence", () => {
  it("names the actual changed test that failed an assertion", () => {
    expect(classifyStoryEvidence(story([file(input, [assertionError], "failed")]))).toEqual({
      status: "red", assertions: [assertion],
    });
  });

  it("only accepts completed passed tests as green", () => {
    expect(classifyStoryEvidence(story([file(input)]))).toEqual({ status: "green", assertions: [] });
  });

  it("rejects a failure in a different test file during a wider replay", () => {
    const outcome = classifyStoryEvidence(story([file(input), file(other, [assertionError], "failed")], { selected: [input, other] }));
    expect(outcome).toMatchObject({ status: "invalid", problem: /unrelated/i });
  });

  it("rejects a different assertion when replaying an identified red", () => {
    const outcome = classifyStoryEvidence(story([file(input, [assertionError], "failed")], {
      expected: [{ ...assertion, test: "would fail even with the issue fixed" }],
    }));
    expect(outcome).toMatchObject({ status: "invalid", problem: /expected assertion/i });
  });

  it("rejects runtime errors inside a test", () => {
    const outcome = classifyStoryEvidence(story([file(input, [{ name: "TypeError", message: "cannot read a value" }], "failed")]));
    expect(outcome).toMatchObject({ status: "invalid", problem: /non-assertion/i });
  });

  it("rejects setup errors even when a selected test fails an assertion", () => {
    const run = { files: [file(input, [assertionError], "failed")], errors: [{ name: "Error", message: "global setup failed" }] };
    expect(classifyStoryEvidence(story(run.files, { run }))).toMatchObject({ status: "invalid", problem: /run error/i });
  });

  it("rejects an absent result for a selected file", () => {
    expect(classifyStoryEvidence(story([]))).toMatchObject({ status: "invalid", problem: /inventory/i });
  });

  it("distinguishes an expected missing module on the base from assertion evidence", () => {
    const missing = {
      ...file(input, [], "failed"),
      errors: [{ name: "Error", message: "Cannot find module '../src/ocelle-form-textarea.ts' imported from test file" }],
      tests: [],
    };
    const run = story([missing], { allowMissingModule: true, missingModules: ["packages/elements/src/ocelle-form-textarea.ts"] });
    expect(classifyStoryEvidence(run)).toEqual({ status: "missing-module", assertions: [] });
    expect(classifyStoryEvidence({ ...run, allowMissingModule: false })).toMatchObject({ status: "invalid", problem: /file error/i });
    expect(classifyStoryEvidence({ ...run, missingModules: ["packages/elements/src/ocelle-button.ts"] }))
      .toMatchObject({ status: "invalid", problem: /file error/i });
  });

  it("reuses matching completed work and rejects stale or malformed records", () => {
    const original = storyEvidenceKey({ revision, mode: "red", tool: "26.13.0", selected: [input] });
    const changed = storyEvidenceKey({ revision, mode: "red", tool: "26.13.1", selected: [input] });
    const evidence = { status: "red", assertions: [assertion] };
    expect(changed).not.toBe(original);
    expect(decodeCachedEvidence({ key: original, evidence }, original)).toEqual(evidence);
    expect(decodeCachedEvidence({ key: original, evidence }, changed)).toBeUndefined();
    expect(decodeCachedEvidence({ key: original, evidence: { status: "red", assertions: [] } }, original)).toBeUndefined();
  });
});

const sameFileOtherProject = { ...input, project: "strict-csp" };
const plan = { revision, inventory: [input, sameFileOtherProject, other], shards: [[input, other], [sameFileOtherProject]] } satisfies UnitTestPlan;
const results = [
  { revision, index: 0, errors: [], files: [file(input), file(other)] },
  { revision, index: 1, errors: [], files: [file(sameFileOtherProject)] },
] satisfies readonly ShardResult[];

describe("full-suite shards", () => {
  it("partitions every project and file pair exactly once in deterministic order", () => {
    const inventory = [input, other, sameFileOtherProject];
    const planned = planTestShards(revision, inventory, 2);
    expect(planned.inventory).toHaveLength(3);
    expect(planned.shards).toHaveLength(2);
    expect(planned.shards.flat()).toEqual(expect.arrayContaining(inventory));
    expect(planned.shards.flat()).toHaveLength(3);
    expect(planTestShards(revision, [...inventory].reverse(), 2)).toEqual(planned);
  });

  it("accepts all successful results on the planned revision and counts tests", () => {
    expect(verifyTestShards(plan, results, revision)).toEqual({ files: 3, tests: 3 });
  });

  it.each([
    { label: "missing shard", reports: [results[0]], error: /received 1 of 2/i },
    { label: "duplicate shard", reports: [results[0], results[0]], error: /duplicate shard/i },
    { label: "wrong revision", reports: [results[0], { ...results[1], revision: "b".repeat(40) }], error: /revision/i },
    { label: "failed test", reports: [results[0], { ...results[1], files: [file(sameFileOtherProject, [assertionError], "failed")] }], error: /failed/i },
    { label: "skipped test", reports: [results[0], { ...results[1], files: [file(sameFileOtherProject, [], "skipped")] }], error: /skipped/i },
    { label: "wrong project", reports: [results[0], { ...results[1], files: [file(input)] }], error: /inventory/i },
    { label: "empty results", reports: [results[0], { ...results[1], files: [] }], error: /inventory/i },
    { label: "malformed result", reports: [results[0], { ...results[1], files: [null] }], error: /malformed/i },
  ])("rejects $label", ({ reports, error }) => {
    expect(() => verifyTestShards(plan, reports, revision)).toThrow(error);
  });

  it("rejects holes in the plan even when all recorded shard jobs pass", () => {
    const incomplete = { ...plan, shards: [[input], [sameFileOtherProject]] };
    const reports = [{ ...results[0], files: [file(input)] }, results[1]];
    expect(() => verifyTestShards(incomplete, reports, revision)).toThrow(/inventory/i);
  });
});

describe("assertion-site evidence", () => {
  const originalText = "expect(submitted.value).toEqual(answer);";
  const setupText = "expect(form).toBeDefined();";
  const source = ["test('keeps the submitted paragraphs', () => {", setupText, originalText, "});"];
  const intended = { ...assertion, source: { text: originalText, occurrence: 1, line: 3 } };
  const inputs = { sources: { [input.file]: source }, changedLines: { [input.file]: [{ start: 3, end: 3 }] } };

  function assertionAt(line: number): TestFileResult {
    const failed = file(input, [], "failed");
    return {
      ...failed,
      tests: [{ name: assertion.test, state: "failed", startLine: 1, errors: [{ ...assertionError, line }] }],
    };
  }

  it("does not take red evidence from a pre-existing assertion in an edited file", () => {
    expect(classifyStoryEvidence({ ...story([assertionAt(2)]), ...inputs }))
      .toMatchObject({ status: "invalid", problem: /unchanged assertion/i });
  });

  it("rejects a different failure within the same named test during replay", () => {
    const replay = { ...inputs, changedLines: { [input.file]: [{ start: 2, end: 3 }] }, expected: [intended] };
    expect(classifyStoryEvidence({ ...story([assertionAt(2)]), ...replay }))
      .toMatchObject({ status: "invalid", problem: /expected assertion/i });
  });

  it("retains assertion location and diagnostics when the intended site fails", () => {
    expect(classifyStoryEvidence({ ...story([assertionAt(3)]), ...inputs })).toMatchObject({
      status: "red",
      assertions: [{ ...intended, diagnostic: assertionError.message }],
    });
  });

  it("rejects a green test when its title survived but its recorded assertion was removed", () => {
    const passed = { ...file(input), tests: [{ name: assertion.test, state: "passed" as const, startLine: 1, errors: [] }] };
    const replay = { ...inputs, sources: { [input.file]: [source[0] ?? "", setupText, "});"] }, expected: [intended] };
    expect(classifyStoryEvidence({ ...story([passed]), ...replay }))
      .toMatchObject({ status: "invalid", problem: /expected assertion/i });
  });

  it("does not reuse cache records with missing, malformed, or mismatched diagnostic evidence", () => {
    const key = storyEvidenceKey({ sources: inputs.sources });
    const evidence = { status: "red", assertions: [intended] };
    const header = { input: key, mode: "red", selected: [input], evidence, seconds: 1, revision };
    const log = `${JSON.stringify(header)}\n`;
    const complete = { key, evidence, selected: [input], log };
    expect(decodeCachedEvidence(complete, key)).toEqual(evidence);
    expect(decodeCachedEvidence({ ...complete, selected: [null] }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...complete, selected: [other] }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...complete, selected: [input, input] }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...complete, log: "" }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...complete, log: `${JSON.stringify({ ...header, evidence: { status: "green", assertions: [] } })}\n` }, key))
      .toBeUndefined();
  });
});
