import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { coverageRecordModule, strykerEnv } from "../lib/mutation/coverage.ts";

// The coverage record of a Stryker run whose tests load no mutated file (FR-011; phase 4 review round 1, R1-10):
// the environment the mutation gate gives Stryker preloads a module that creates Stryker's empty per-test coverage
// record, so a mutant no test reaches is NoCoverage even when no test loads any mutated file. The module's code runs
// here in a fresh context, never in this test's own global (which Stryker itself uses while it mutation-tests).
const prefix = "data:text/javascript,";

function recordAfter(globals: Record<string, unknown>): string {
  runInNewContext(decodeURIComponent(coverageRecordModule.slice(prefix.length)), globals);
  return JSON.stringify(globals);
}

describe("coverageRecordModule", () => {
  it("is a JavaScript data URL", () => {
    expect(coverageRecordModule.startsWith(prefix)).toBe(true);
  });

  it("creates the empty record when there is none, with or without Stryker's namespace", () => {
    expect([recordAfter({}), recordAfter({ __stryker__: { activeMutant: "3" } })]).toEqual([
      JSON.stringify({ __stryker__: { mutantCoverage: { static: {}, perTest: {} } } }),
      JSON.stringify({ __stryker__: { activeMutant: "3", mutantCoverage: { static: {}, perTest: {} } } }),
    ]);
  });

  it("keeps a record instrumented code already made", () => {
    const made = { __stryker__: { mutantCoverage: { static: { 1: 2 }, perTest: { t: { 4: 1 } } } } };
    expect(recordAfter(made)).toBe(JSON.stringify({ __stryker__: { mutantCoverage: { static: { 1: 2 }, perTest: { t: { 4: 1 } } } } }));
  });
});

describe("strykerEnv", () => {
  const preload = `--import=${coverageRecordModule}`;

  it("keeps the environment and preloads the coverage record module", () => {
    expect(strykerEnv({ PATH: "/bin", HOME: "/home/a" })).toEqual({ PATH: "/bin", HOME: "/home/a", NODE_OPTIONS: preload });
  });

  it("adds the preload after the NODE_OPTIONS already set, and alone when they are empty", () => {
    expect([strykerEnv({ NODE_OPTIONS: "--max-old-space-size=4096" }), strykerEnv({ NODE_OPTIONS: "" })]).toEqual([
      { NODE_OPTIONS: `--max-old-space-size=4096 ${preload}` },
      { NODE_OPTIONS: preload },
    ]);
  });

  it("puts no space inside the preload argument, since NODE_OPTIONS splits at spaces", () => {
    expect(preload).not.toMatch(/\s/);
  });
});
