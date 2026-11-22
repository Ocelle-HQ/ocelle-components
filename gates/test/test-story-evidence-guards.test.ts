import { describe, expect, it } from "vitest";
import { classifyStoryEvidence, decodeCachedEvidence, storyEvidenceKey } from "../lib/test-evidence.ts";
import type { Assertion, Failure, StoryEvidenceInput, TestCaseResult, TestFileResult } from "../lib/test-evidence.ts";

const file = { project: "elements (chromium)", file: "packages/elements/test/textarea.test.ts" };
const other = { ...file, project: "elements-browser" };
const name = "keeps the submitted paragraphs";
const line = "expect(submitted.value).toEqual(answer);";
const message = "expected the submitted value to equal the answer";
const failure = { name: "AssertionError", message, line: 3 };
const test = { name, state: "passed", startLine: 1, errors: [] } satisfies TestCaseResult;
const module = { ...file, state: "passed", durationMs: 1, errors: [], tests: [test] } satisfies TestFileResult;
const failed = { ...test, state: "failed", errors: [failure] } satisfies TestCaseResult;
const sources = { [file.file]: ['it("keeps the submitted paragraphs", () => {', "  populateForm();", `  ${line}`, "});"] };
const site = { ...file, test: name, source: { text: line, occurrence: 1, line: 3 }, diagnostic: message };

function proof(files: readonly TestFileResult[], overrides: Partial<StoryEvidenceInput> = {}): StoryEvidenceInput {
  return {
    run: { files, errors: [] },
    selected: [file],
    changedTests: [file.file],
    sources,
    changedLines: { [file.file]: [{ start: 2, end: 3 }] },
    ...overrides,
  };
}

function expectInvalid(input: StoryEvidenceInput, problem: string): void {
  expect(classifyStoryEvidence(input)).toEqual({ status: "invalid", assertions: [], problem });
}

describe("phase proof inventory", () => {
  it("rejects an empty selection even when no unexpected result exists", () => {
    expectInvalid(proof([], { selected: [] }), "test result inventory differs from the selection");
  });

  it("requires the selected file and project together", () => {
    expectInvalid(proof([{ ...module, ...other }]), "test result inventory differs from the selection");
  });

  it.each(["pending", "queued", "skipped"] as const)("rejects a %s file despite its reported test", (state) => {
    expectInvalid(proof([{ ...module, state }]), `no completed tests in ${file.file}`);
  });

  it("rejects an empty passed file and a failed file with a passed case", () => {
    expectInvalid(proof([{ ...module, tests: [] }]), `no completed tests in ${file.file}`);
    expectInvalid(proof([{ ...module, state: "failed" }]), `file error in ${file.file} without a failing assertion`);
  });

  it.each(["pending", "skipped"] as const)("rejects a %s case even when its file reports passed", (state) => {
    expectInvalid(proof([{ ...module, tests: [{ ...test, state }] }]), `${file.file}: ${state} test ${name}`);
  });

  it("rejects an ambiguous failed case and a cached expectation whose file did not run", () => {
    expectInvalid(proof([{ ...module, state: "failed", tests: [test, failed] }]), "failing assertion has an ambiguous test name in its file");
    expectInvalid(proof([module], { expected: [{ ...site, ...other }] }), "expected assertion test or source missing or ambiguous in the replay");
  });

  it("keeps the successful proof when a separate configured case has the same title", () => {
    const report = [module, { ...module, ...other }];
    expect(classifyStoryEvidence(proof(report, { selected: [file, other], expected: [site] }))).toEqual({ status: "green", assertions: [] });
  });
});

describe("changed source proof", () => {
  const sourceProblem = `unlocated source in ${file.file}:3: ${name}`;
  const locationProblem = `unlocated assertion in ${file.file}: ${name}: ${message}`;
  it.each([
    { label: "absent failure location", row: { name, state: "failed", errors: [{ name: "AssertionError", message }], startLine: 1 }, problem: locationProblem },
    { label: "absent case location", row: { name, state: "failed", errors: [failure] }, problem: locationProblem },
    { label: "failure before the case", row: { ...failed, startLine: 4 }, problem: sourceProblem },
    { label: "invalid case line", row: { ...failed, startLine: 0 }, problem: sourceProblem },
    { label: "no assertion error", row: { ...failed, errors: [] }, problem: `non-assertion error in ${file.file}: ${name}` },
    { label: "mixed assertion and setup errors", row: { ...failed, errors: [failure, { name: "TypeError", message }] }, problem: `non-assertion error in ${file.file}: ${name}` },
  ] satisfies readonly { label: string; row: TestCaseResult; problem: string }[])("rejects $label", ({ row, problem }) => {
    expectInvalid(proof([{ ...module, state: "failed", tests: [row] }]), problem);
  });

  it("rejects an untracked blank source line and a missing helper location", () => {
    const blank = { [file.file]: ["it", "helper();", "  "] };
    expectInvalid(proof([{ ...module, state: "failed", tests: [failed] }], { sources: blank }), sourceProblem);
    const helper = { helperFile: "test/scenarios/shared.ts", helperLine: 2 };
    const row = { ...failed, errors: [{ ...failure, ...helper }] };
    expectInvalid(proof([{ ...module, state: "failed", tests: [row] }]), "unlocated helper assertion in test/scenarios/shared.ts:2");
  });

  it("distinguishes repeated assertion text, including at either edge of a changed hunk", () => {
    const duplicate = { [file.file]: ["it", line, `  ${line}  `, "});"] };
    const duplicateCase = { ...module, state: "failed", tests: [failed] } satisfies TestFileResult;
    expect(classifyStoryEvidence(proof([duplicateCase], { sources: duplicate })))
      .toEqual({ status: "red", assertions: [{ ...site, source: { ...site.source, occurrence: 2 } }] });
    expectInvalid(proof([duplicateCase], { sources: duplicate, expected: [site] }), "expected assertion failures did not match replayed failures");
    const earlier = { ...duplicateCase, tests: [{ ...failed, errors: [{ ...failure, line: 2 }] }] };
    expect(classifyStoryEvidence(proof([earlier], { sources: duplicate })))
      .toEqual({ status: "red", assertions: [{ ...site, source: { ...site.source, line: 2 } }] });
    expectInvalid(proof([duplicateCase], { changedLines: { [file.file]: [{ start: 2, end: 2 }] } }),
      `unchanged assertion in ${file.file}:3: ${name}: ${message}`);
  });

  it("does not accept a green proof whose expected assertion exists only in a later case", () => {
    const later = { name: "later scenario", state: "passed", errors: [], startLine: 3 } satisfies TestCaseResult;
    expectInvalid(proof([{ ...module, tests: [test, later] }], { expected: [site] }),
      "expected assertion test or source missing or ambiguous in the replay");
  });
});

describe("scaffold missing-module proof", () => {
  const missing = "packages/elements/src/ocelle-form-textarea.ts";
  const collection = `Failed to load URL '${missing}' imported from test`;
  const error = { name: "Error", message: collection };
  const absent = { ...module, state: "failed", errors: [error], tests: [] } satisfies TestFileResult;
  const allowed = { allowMissingModule: true, missingModules: [missing] };

  it("recognizes a repository-relative missing scaffold module only with an empty affected module", () => {
    expect(classifyStoryEvidence(proof([absent], allowed))).toEqual({ status: "missing-module", assertions: [] });
    expectInvalid(proof([{ ...absent, tests: [test] }], allowed), `file error in ${file.file}: ${collection}`);
    expectInvalid(proof([absent], { ...allowed, changedTests: [] }), `file error in ${file.file}: ${collection}`);
  });

  it("rejects other collection errors even alongside an approved missing module", () => {
    const failures: Failure[] = [error, { name: "SyntaxError", message: "cannot parse control" }];
    expectInvalid(proof([{ ...absent, errors: failures }], allowed), `file error in ${file.file}: ${collection}`);
  });
});

describe("cached story evidence schema", () => {
  const key = storyEvidenceKey({ task: "submission", files: [file.file] });
  const revision = "a".repeat(40);
  const red = { status: "red", assertions: [site] };
  const head = { status: "green", assertions: [] };
  const base = { status: "missing-module", assertions: [] };

  function record(evidence: object, mode: string, fields: Record<string, unknown> = {}, selected: unknown = [file]) {
    const header = { input: key, mode, selected, evidence, seconds: 0, revision, ...fields };
    return { key, selected, evidence, log: `${JSON.stringify(header)}\nworker output\n` };
  }

  it.each(["red", "base", "scaffold", "fix"])("reuses red only from a proof mode named %s", (mode) => {
    expect(decodeCachedEvidence(record(red, mode), key)).toEqual(red);
  });

  it("reuses completed green and known missing-module evidence in the right mode", () => {
    expect(decodeCachedEvidence(record(head, "head"), key)).toEqual(head);
    expect(decodeCachedEvidence(record(base, "base"), key)).toEqual(base);
    expect(decodeCachedEvidence(record(red, "head"), key)).toBeUndefined();
    expect(decodeCachedEvidence(record(head, "red"), key)).toBeUndefined();
    expect(decodeCachedEvidence(record(base, "scaffold"), key)).toBeUndefined();
  });

  it.each([
    { label: "different key", fields: { input: "wrong" } },
    { label: "invalid revision", fields: { revision: "a" } },
    { label: "wrong revision type", fields: { revision: 15 } },
    { label: "negative time", fields: { seconds: -1 } },
    { label: "wrong time type", fields: { seconds: "0" } },
    { label: "nonfinite time", fields: { seconds: Infinity } },
    { label: "non-array inventory", fields: { selected: file } },
    { label: "different project", fields: { selected: [other] } },
    { label: "different evidence", fields: { evidence: head } },
  ])("rejects a log header with $label", ({ fields }) => {
    expect(decodeCachedEvidence(record(red, "red", fields), key)).toBeUndefined();
  });

  it("rejects malformed cache envelopes before reuse", () => {
    expect(decodeCachedEvidence(null, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...record(red, "red"), log: "not JSON" }, key)).toBeUndefined();
    expect(decodeCachedEvidence({ ...record(red, "red"), log: "null\n" }, key)).toBeUndefined();
    expect(decodeCachedEvidence(record(head, "head", {}, []), key)).toBeUndefined();
    expect(decodeCachedEvidence(record(red, "red", {}, [other]), key)).toBeUndefined();
    expect(decodeCachedEvidence(record({ status: "red", assertions: [site, site] }, "red"), key)).toBeUndefined();
    expect(decodeCachedEvidence(record({ status: "incomplete", assertions: [] }, "base"), key)).toBeUndefined();
  });

  it.each([
    { label: "absent title", row: { ...site, test: "" } },
    { label: "absent diagnostic", row: { ...site, diagnostic: "" } },
    { label: "absent assertion text", row: { ...site, source: { ...site.source, text: "" } } },
    { label: "wrong occurrence type", row: { ...site, source: { ...site.source, occurrence: "1" } } },
    { label: "fractional occurrence", row: { ...site, source: { ...site.source, occurrence: 1.5 } } },
    { label: "zero occurrence", row: { ...site, source: { ...site.source, occurrence: 0 } } },
    { label: "wrong line type", row: { ...site, source: { ...site.source, line: "3" } } },
    { label: "fractional line", row: { ...site, source: { ...site.source, line: 3.5 } } },
    { label: "zero line", row: { ...site, source: { ...site.source, line: 0 } } },
    { label: "helper path outside the workspace", row: { ...site, helper: { ...site.source, file: "../shared.ts" } } },
  ])("rejects cached assertions with $label", ({ row }) => {
    expect(decodeCachedEvidence(record({ status: "red", assertions: [row] }, "red"), key)).toBeUndefined();
  });

  it("preserves a valid helper assertion anchored through a selected file", () => {
    const withHelper: Assertion = { ...site, helper: { ...site.source, file: "test/scenarios/shared.ts" } };
    const evidence = { status: "red", assertions: [withHelper] };
    expect(decodeCachedEvidence(record(evidence, "red"), key)).toEqual(evidence);
  });
});
