import { describe, expect, it } from "vitest";
import {
  classifyStoryEvidence,
  decodeCachedEvidence,
  decodeWorkerResult,
  planTestShards,
  storyEvidenceKey,
  validTestPlan,
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
    expect(classifyStoryEvidence(story(run.files, { run }))).toEqual({ status: "invalid", assertions: [], problem: "run error: global setup failed" });
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

  it("exempts an unquoted scaffold-only missing module while still checking other expected assertions", () => {
    const missingPath = "packages/elements/src/ocelle-form-textarea.ts";
    const missing = {
      ...file(input, [], "failed"),
      errors: [{ name: "Error", message: "Failed to load url ../src/ocelle-form-textarea.ts from the test file" }],
      tests: [],
    };
    const otherProof = { ...other, test: assertion.test };
    const replay = story([missing, file(other, [assertionError], "failed")], {
      selected: [input, other], changedTests: [input.file, other.file], expected: [assertion, otherProof],
      allowMissingModule: true,
    });
    expect(classifyStoryEvidence({ ...replay, missingModules: [missingPath] })).toEqual({ status: "missing-module", assertions: [otherProof] });
    expect(classifyStoryEvidence(replay)).toMatchObject({ status: "invalid", problem: /file error/i });
  });

  it("reuses matching completed work and rejects stale or malformed records", () => {
    const original = storyEvidenceKey({ revision, mode: "red", tool: "26.13.0", selected: [input] });
    const changed = storyEvidenceKey({ revision, mode: "red", tool: "26.13.1", selected: [input] });
    const evidence = { status: "red", assertions: [{ ...assertion,
      source: { text: "expect(submitted.value).toEqual(answer);", occurrence: 1, line: 3 },
      diagnostic: assertionError.message,
    }] };
    const header = { input: original, mode: "red", selected: [input], evidence, seconds: 1, revision };
    const record = { key: original, evidence, selected: [input], log: `${JSON.stringify(header)}\n` };
    expect(changed).not.toBe(original);
    expect(decodeCachedEvidence(record, original)).toEqual(evidence);
    expect(decodeCachedEvidence(record, changed)).toBeUndefined();
    expect(decodeCachedEvidence({ ...record, evidence: { status: "red", assertions: [] } }, original)).toBeUndefined();
  });
});

const sameFileOtherProject = { ...input, project: "strict-csp" };
const plan = { revision, inventory: [input, sameFileOtherProject, other], shards: [[input, other], [sameFileOtherProject]] } satisfies UnitTestPlan;
const results = [
  { revision, index: 0, errors: [], files: [file(input), file(other)] },
  { revision, index: 1, errors: [], files: [file(sameFileOtherProject)] },
] satisfies readonly ShardResult[];

describe("full-suite shards", () => {
  it.each([".", ".."])("rejects a test inventory naming repository directory %s", (path) => {
    const directory = { ...input, file: path };
    expect(validTestPlan({ revision, inventory: [directory], shards: [[directory]] }, revision)).toBe(false);
    expect(() => planTestShards(revision, [directory], 1)).toThrow(new Error("invalid revision, shard count, or test inventory"));
  });

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
    const evidence = { status: "red", assertions: [{ ...intended, diagnostic: assertionError.message }] };
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

it("records a shared scenario assertion only through the changed caller and replays the same helper site", () => {
  const helperFile = "packages/elements/test/scenarios/multiline.ts";
  const changedCall = "await checkSubmission(form);";
  const intended = "expect(actual.value).toBe(answer);";
  const otherSite = "expect(form).toBeDefined();";
  const shared = (helperLine: number) => ({
    ...file(input, [], "failed"),
    tests: [{
      name: assertion.test, state: "failed" as const, startLine: 1,
      errors: [{ ...assertionError, line: 2, helperFile, helperLine }],
    }],
  });
  const inputs = {
    changedLines: { [input.file]: [{ start: 2, end: 2 }] },
    sources: { [input.file]: ["test('keeps the submitted paragraphs', async () => {", changedCall, "});"], [helperFile]: [otherSite, intended] },
  };
  const evidence = { ...assertion, source: { text: changedCall, occurrence: 1, line: 2 },
    helper: { file: helperFile, text: intended, occurrence: 1, line: 2 },
    diagnostic: assertionError.message,
  };
  expect(classifyStoryEvidence({ ...story([shared(2)]), ...inputs })).toMatchObject({ status: "red", assertions: [evidence] });
  expect(classifyStoryEvidence({ ...story([shared(1)]), ...inputs, expected: [evidence] }))
    .toMatchObject({ status: "invalid", problem: /expected assertion/i });
});

describe("expected assertion replay", () => {
  const direct = "it('keeps the submitted paragraphs', () => expect(value).toBe(answer));";
  const recorded = { ...assertion, source: { text: direct, occurrence: 1, line: 1 } };
  const sources = { [input.file]: [direct] };
  const changedLines = { [input.file]: [{ start: 1, end: 1 }] };
  const expectedProblem = "expected assertion test or source missing or ambiguous in the replay";
  const completed = { name: assertion.test, state: "passed" as const, startLine: 1, errors: [] };

  it("accepts a changed assertion on the same line as the test declaration", () => {
    const replay = story([{
      ...file(input, [], "failed"),
      tests: [{ ...completed, state: "failed", errors: [{ ...assertionError, line: 1 }] }],
    }], { sources, changedLines, expected: [recorded] });
    expect(classifyStoryEvidence(replay)).toEqual({
      status: "red", assertions: [{ ...recorded, diagnostic: assertionError.message }],
    });
    expect(classifyStoryEvidence({ ...replay, sources: {} })).toMatchObject({ status: "invalid", problem: /unlocated source/i });
  });

  it("matches one test by name when a differently named test shares its file", () => {
    const replay = story([{ ...file(input), tests: [completed, { ...completed, startLine: 3, name: "other assertion" }] }], {
      sources, changedLines, expected: [recorded],
    });
    expect(classifyStoryEvidence(replay)).toEqual({ status: "green", assertions: [] });
  });

  it.each([
    { label: "absent file", expected: [{ ...recorded, ...other }], tests: [completed], sources },
    { label: "missing title", expected: [{ ...recorded, test: "never ran" }], tests: [completed], sources },
    { label: "duplicate titles", expected: [recorded], tests: [completed, { ...completed, startLine: 3 }], sources },
    { label: "missing start line", expected: [recorded], tests: file(input).tests, sources },
    { label: "missing source", expected: [recorded], tests: [completed], sources: {} },
  ])("rejects $label even when every executed test passed", ({ expected, tests, sources }) => {
    const replay = story([{ ...file(input), tests }], { expected, sources });
    expect(classifyStoryEvidence(replay)).toEqual({ status: "invalid", assertions: [], problem: expectedProblem });
  });

  it("accepts a known test without a source constraint when no source proof was requested", () => {
    const replay = story([file(input)], { expected: [assertion] });
    expect(classifyStoryEvidence(replay)).toEqual({ status: "green", assertions: [] });
  });

  it("requires each recorded helper occurrence and accepts indented matching source", () => {
    const helperFile = "packages/elements/test/scenarios/multiline.ts";
    const helperText = "expect(result).toBe(answer);";
    const expected = [{ ...recorded, helper: { file: helperFile, text: helperText, occurrence: 2, line: 2 } }];
    const replay = story([{ ...file(input), tests: [completed] }], { expected });
    expect(classifyStoryEvidence({ ...replay, sources })).toMatchObject({ status: "invalid", problem: expectedProblem });
    expect(classifyStoryEvidence({ ...replay, sources: { ...sources, [helperFile]: [helperText, "unrelated code"] } }))
      .toMatchObject({ status: "invalid", problem: expectedProblem });
    expect(classifyStoryEvidence({ ...replay, sources: { ...sources, [helperFile]: [`  ${helperText}`, `    ${helperText}`] } }))
      .toEqual({ status: "green", assertions: [] });
  });

  it("rejects partially reproduced red evidence and equal-length replay with one wrong assertion", () => {
    const expectedText = "expect(nextValue).toBe(answer);";
    const differentText = "expect(dialog.open).toBe(true);";
    const expected = [recorded, { ...assertion, test: "second test", source: { text: expectedText, occurrence: 1, line: 4 } }];
    const actualFirst = { ...completed, state: "failed" as const, errors: [{ ...assertionError, line: 1 }] };
    const actualSecond = { ...completed, name: "second test", startLine: 3 };
    const replay = {
      expected,
      sources: { [input.file]: [direct, "", "it('second test', () => {", expectedText, differentText, "});"] },
      changedLines: { [input.file]: [{ start: 1, end: 5 }] },
    };
    const partial = { ...file(input, [], "failed"), tests: [actualFirst, actualSecond] };
    const wrong = { ...partial, tests: [actualFirst, { ...actualSecond, state: "failed" as const, errors: [{ ...assertionError, line: 5 }] }] };
    const outcome = { status: "invalid", assertions: [], problem: "expected assertion failures did not match replayed failures" };
    expect(classifyStoryEvidence(story([partial], replay))).toEqual(outcome);
    expect(classifyStoryEvidence(story([wrong], replay))).toEqual(outcome);
  });
});

describe("worker and cache result decoding", () => {
  const proof = { ...assertion, source: { text: "expect(answer).toBe(value);", occurrence: 1, line: 1 }, diagnostic: assertionError.message };
  const red = { status: "red", assertions: [proof] };
  const green = { status: "green", assertions: [] };
  const missing = { status: "missing-module", assertions: [] };
  const invalid = { status: "invalid", assertions: [], problem: "worker could not discover the file" };
  const key = storyEvidenceKey({ revision });

  it.each([
    { label: "red on line one", evidence: red, selected: [input] },
    { label: "green", evidence: green, selected: [input] },
    { label: "missing module", evidence: missing, selected: [input] },
    { label: "invalid with a reason", evidence: invalid, selected: [] },
  ])("accepts well-formed $label evidence", ({ evidence, selected }) => {
    expect(decodeWorkerResult({ evidence, selected })).toEqual({ evidence, selected });
  });

  it.each([
    { label: "missing invalid reason", evidence: { status: "invalid", assertions: [] }, selected: [] },
    { label: "invalid evidence carrying assertions", evidence: { ...invalid, assertions: [proof] }, selected: [input] },
    { label: "empty green selection", evidence: green, selected: [] },
    { label: "green evidence carrying an invalid reason", evidence: { ...green, problem: invalid.problem }, selected: [input] },
    { label: "green evidence carrying assertions", evidence: { ...green, assertions: [proof] }, selected: [input] },
    { label: "unknown evidence status", evidence: { ...green, status: "ready" }, selected: [input] },
  ])("rejects $label", ({ evidence, selected }) => {
    expect(decodeWorkerResult({ evidence, selected })).toBeUndefined();
  });

  it.each([
    { evidence: missing, mode: "base", accepted: missing },
    { evidence: missing, mode: "scaffold", accepted: undefined },
    { evidence: green, mode: "red", accepted: undefined },
    { evidence: green, mode: "base", accepted: undefined },
    { evidence: red, mode: "head", accepted: undefined },
    { evidence: green, mode: "head", accepted: green },
  ])("only resumes $evidence.status evidence for an allowed mode ($mode)", ({ evidence, mode, accepted }) => {
    const selected = [input];
    const header = { input: key, mode, selected, evidence, seconds: 1, revision };
    const cache = { key, evidence, selected, log: JSON.stringify(header) };
    expect(decodeCachedEvidence(cache, key)).toEqual(accepted);
  });

  it("ignores malformed headers and reads valid headers before the first log newline", () => {
    const selected = [input];
    const header = { input: key, mode: "red", selected, evidence: red, seconds: 1, revision };
    const cache = { key, evidence: red, selected };
    expect(decodeCachedEvidence({ ...cache, log: "{" }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...cache, log: undefined }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...cache, log: `${JSON.stringify(header)}\nworker output` }, key)).toEqual(red);
  });

  it("requires an exact record key and plain text log even when the header matches", () => {
    const selected = [input];
    const header = { input: key, mode: "red", selected, evidence: red, seconds: 1, revision };
    const cache = { key, evidence: red, selected, log: JSON.stringify(header) };
    const wrapped = { indexOf: () => -1, toString: () => cache.log };
    expect(decodeCachedEvidence({ ...cache, key: "another record" }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...cache, log: wrapped }, key)).toBeUndefined();
  });
});
