import { describe, expect, it } from "vitest";
import { ciJobs, fr020, parseRegistry } from "../lib/registry.ts";

// The registry and the workflow job list at the edges (research.md R-10; phase 4 review round 1, R1-07): entries that
// are not objects, helper job lists with one bad id, the cause of a JSON error, the FR-020 list itself, and workflow
// text with comments, blank lines, other top-level keys, quoted job ids and lines that only look like job keys.
const entry = { id: "x", check: "X", command: "c", plantCommand: "p", plantForm: "repo-tree", scope: "s" };

describe("parseRegistry: entries", () => {
  it.each([
    { value: [], problem: "gate 1 of gates.json is not an object" },
    { value: null, problem: "gate 1 of gates.json is not an object" },
    { value: "x", problem: "gate 1 of gates.json is not an object" },
    { value: { ...entry, helperJobs: ["a", ""] }, problem: "gate 1 of gates.json: helperJobs must be a list of job ids" },
    { value: { ...entry, helperJobs: ["a", 1] }, problem: "gate 1 of gates.json: helperJobs must be a list of job ids" },
    { value: { ...entry, helperJobs: "a" }, problem: "gate 1 of gates.json: helperJobs must be a list of job ids" },
  ])("rejects $value", ({ value, problem }) => {
    expect(() => parseRegistry(JSON.stringify([value]))).toThrow(problem);
  });

  it("reads an entry with a list of helper job ids, as written", () => {
    expect(parseRegistry(JSON.stringify([{ ...entry, helperJobs: ["a", "b"] }]))).toEqual([{ ...entry, helperJobs: ["a", "b"] }]);
  });

  it("keeps the JSON error as the cause", () => {
    const error = (() => {
      try {
        parseRegistry("{");
        return undefined;
      } catch (thrown) {
        return thrown as Error;
      }
    })();
    expect(error?.cause).toBeInstanceOf(SyntaxError);
  });
});

describe("fr020", () => {
  it("is the eleven gates of FR-020, in the order of the spec", () => {
    expect(fr020).toEqual(["typecheck", "lint", "style-lint", "unit-tests", "test-lint", "mutation", "csp", "prefix", "config-copies", "pins", "signoff"]);
  });
});

describe("ciJobs: workflow text", () => {
  it.each([
    { name: "keys of other top-level maps", text: "on:\n  pull_request:\n  push:\njobs:\n  a:\n    runs-on: x\n", jobs: ["a"] },
    { name: "comments and blank lines between jobs, at any indent", text: "jobs:\n  a:\n\n# top\n#\n    # deep\n  b:\n", jobs: ["a", "b"] },
    { name: "blank lines of spaces", text: "jobs:\n  a:\n   \n  b:\n", jobs: ["a", "b"] },
    { name: "quoted job ids", text: "jobs:\n  'a-1':\n  \"b_2\":\n", jobs: ["a-1", "b_2"] },
    { name: "a jobs key with trailing spaces", text: "jobs:   \n  a:\n", jobs: ["a"] },
    { name: "a key that only ends with jobs", text: "xjobs:\n  a:\n", jobs: [] },
    { name: "a jobs key with a value on its line", text: "jobs:x\n  a:\n", jobs: [] },
    { name: "a list item at the job indent", text: "jobs:\n  - a: 1\n  b:\n", jobs: ["b"] },
    { name: "a job key whose quotes do not match", text: "jobs:\n  'a\":\n  b:\n", jobs: ["b"] },
    { name: "CRLF line endings", text: "jobs:\r\n  a:\r\n    x: 1\r\n  b:\r\n", jobs: ["a", "b"] },
  ])("reads $name", ({ text, jobs }) => {
    expect(ciJobs(text)).toEqual(jobs);
  });
});
