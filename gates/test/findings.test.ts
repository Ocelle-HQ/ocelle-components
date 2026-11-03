import { describe, expect, it } from "vitest";
import { emit, formatFinding, formatLocation } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";

const sha = "0123456789abcdef0123456789abcdef01234567";

function capture(): { readonly out: string[]; readonly err: string[] } {
  return { out: [], err: [] };
}

describe("formatLocation", () => {
  it("writes a file location at a line as path:line", () => {
    expect(formatLocation({ path: "packages/tokens/src/x.ts", line: 12 })).toBe("packages/tokens/src/x.ts:12");
  });

  it("writes a whole-file location as the path alone", () => {
    expect(formatLocation({ path: "pnpm-lock.yaml" })).toBe("pnpm-lock.yaml");
  });

  it("writes a commit location as the full hash", () => {
    expect(formatLocation({ commit: sha })).toBe(sha);
  });
});

describe("formatFinding", () => {
  it("writes <location>: <gate-id>: <rule>: <message> for a path:line location", () => {
    const line = formatFinding({
      location: { path: "gates/lib/x.ts", line: 3 },
      gate: "lint",
      rule: "no-floating-promises",
      message: "Promises must be awaited",
    });
    expect(line).toBe("gates/lib/x.ts:3: lint: no-floating-promises: Promises must be awaited");
  });

  it("writes <location>: <gate-id>: <rule>: <message> for a path location", () => {
    const line = formatFinding({
      location: { path: "pnpm-lock.yaml" },
      gate: "pins",
      rule: "lockfile",
      message: "the lockfile does not match the manifests",
    });
    expect(line).toBe("pnpm-lock.yaml: pins: lockfile: the lockfile does not match the manifests");
  });

  it("writes <location>: <gate-id>: <rule>: <message> for a commit location", () => {
    const line = formatFinding({
      location: { commit: sha },
      gate: "signoff",
      rule: "no-signoff",
      message: "no Signed-off-by line",
    });
    expect(line).toBe(`${sha}: signoff: no-signoff: no Signed-off-by line`);
  });

  it("keeps a finding on one line when its message has line breaks", () => {
    const line = formatFinding({
      location: { path: "a.ts", line: 1 },
      gate: "unit-tests",
      rule: "sum adds",
      message: "AssertionError: expected 3 to be 4\n    at a.ts:1:1\r\n  more",
    });
    expect(line).toBe("a.ts:1: unit-tests: sum adds: AssertionError: expected 3 to be 4 at a.ts:1:1 more");
  });
});

describe("emit", () => {
  it("prints the one-line summary of a pass on stdout and returns 0", () => {
    const io = capture();
    const code = emit({ exit: 0, summary: "unit-tests: 3 tests passed" }, (l) => io.out.push(l), (l) => io.err.push(l));
    expect({ code, out: io.out, err: io.err }).toEqual({ code: 0, out: ["unit-tests: 3 tests passed"], err: [] });
  });

  it("prints each finding and then the summary on stdout and returns 1", () => {
    const io = capture();
    const result: GateResult = {
      exit: 1,
      findings: [
        { location: { path: "a.ts", line: 1 }, gate: "unit-tests", rule: "t one", message: "m one" },
        { location: { path: "b.ts" }, gate: "unit-tests", rule: "t two", message: "m two" },
      ],
      summary: "unit-tests: 2 of 5 tests failed",
    };
    const code = emit(result, (l) => io.out.push(l), (l) => io.err.push(l));
    expect({ code, out: io.out, err: io.err }).toEqual({
      code: 1,
      out: ["a.ts:1: unit-tests: t one: m one", "b.ts: unit-tests: t two: m two", "unit-tests: 2 of 5 tests failed"],
      err: [],
    });
  });

  it("prints the cause of a run that could not run as one line on stderr and returns 2", () => {
    const io = capture();
    const code = emit(
      { exit: 2, cause: "unit-tests: could not run: no test file found\nsecond line" },
      (l) => io.out.push(l),
      (l) => io.err.push(l),
    );
    expect({ code, out: io.out, err: io.err }).toEqual({
      code: 2,
      out: [],
      err: ["unit-tests: could not run: no test file found second line"],
    });
  });
});
