import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chromiumCheck, unitTests } from "../bin/test.ts";
import type { UnitTestTools } from "../bin/test.ts";
import type { Io } from "../lib/cli.ts";
import { classifyVitest } from "../lib/vitest-report.ts";

const root = "/work/repo";

function fixture(name: string): string {
  return readFileSync(new URL(`fixtures/vitest/${name}`, import.meta.url), "utf8");
}

describe("classifyVitest", () => {
  it("passes a run whose tests all passed, with a one-line summary of the count", () => {
    const result = classifyVitest({ report: fixture("passing.json"), exitCode: 0, output: "", root });
    expect(result).toEqual({ exit: 0, summary: "unit-tests: 3 tests passed in 2 files" });
  });

  it("reports each failed test as one finding at its file and line, rule = the full test name", () => {
    const result = classifyVitest({ report: fixture("failing.json"), exitCode: 1, output: "", root });
    expect(result).toEqual({
      exit: 1,
      findings: [
        {
          location: { path: "packages/tokens/test/sum.test.ts", line: 8 },
          gate: "unit-tests",
          rule: "sum adds three numbers",
          message: "AssertionError: expected 3 to be 4 // Object.is equality",
        },
        {
          location: { path: "packages/elements/test/title.test.ts", line: 3 },
          gate: "unit-tests",
          rule: "reads the document title",
          message: "AssertionError: expected 'Vitest Browser Tester' to be 'Ocelle' // Object.is equality",
        },
      ],
      summary: "unit-tests: 2 of 3 tests failed",
    });
  });

  it("reports a failed test without a recorded location at its file", () => {
    const report = JSON.parse(fixture("failing.json")) as {
      testResults: { assertionResults: { location?: unknown }[] }[];
    };
    for (const file of report.testResults) {
      for (const test of file.assertionResults) delete test.location;
    }
    const result = classifyVitest({ report: JSON.stringify(report), exitCode: 1, output: "", root });
    expect(result.exit).toBe(1);
    expect(result.exit === 1 ? result.findings.map((f) => f.location) : []).toEqual([
      { path: "packages/tokens/test/sum.test.ts" },
      { path: "packages/elements/test/title.test.ts" },
    ]);
  });

  it("cannot run when no test file is found (a broken file pattern does not pass)", () => {
    const result = classifyVitest({ report: fixture("no-test-file.json"), exitCode: 1, output: "", root });
    expect(result.exit).toBe(2);
    expect(result.exit === 2 ? result.cause : "").toContain("no test file found");
  });

  it("cannot run when a test file fails to load, naming the file and the error", () => {
    const result = classifyVitest({ report: fixture("load-failure.json"), exitCode: 1, output: "", root });
    expect(result).toEqual({
      exit: 2,
      cause:
        "unit-tests: could not run: packages/tokens/test/a.test.ts failed to load: " +
        "Cannot find module './missing.ts' imported from /work/repo/packages/tokens/test/a.test.ts",
    });
  });

  it("cannot run when a test file does not parse, naming the file without terminal colour codes", () => {
    const result = classifyVitest({ report: fixture("syntax-error.json"), exitCode: 1, output: "", root });
    expect(result.exit).toBe(2);
    const cause = result.exit === 2 ? result.cause : "";
    expect(cause).toContain("packages/tokens/test/a.test.ts failed to load: Transform failed with 1 error");
    expect(cause).not.toContain("\u001b[");
  });

  it("cannot run on errors outside tests even when every test passed, naming the error", () => {
    const result = classifyVitest({
      report: fixture("unhandled-error.json"),
      exitCode: 1,
      output: fixture("unhandled-error.output.txt"),
      root,
    });
    expect(result).toEqual({
      exit: 2,
      cause: "unit-tests: could not run: Vitest reported errors outside tests: Error: late boom",
    });
  });

  it("cannot run when a failed test comes with a file that failed to load", () => {
    const failing = JSON.parse(fixture("failing.json")) as { testResults: unknown[]; success: boolean };
    const load = JSON.parse(fixture("load-failure.json")) as { testResults: unknown[] };
    failing.testResults.push(...load.testResults);
    const result = classifyVitest({ report: JSON.stringify(failing), exitCode: 1, output: "", root });
    expect(result.exit).toBe(2);
    expect(result.exit === 2 ? result.cause : "").toContain("packages/tokens/test/a.test.ts failed to load");
  });

  it("cannot run without a report", () => {
    const result = classifyVitest({ report: undefined, exitCode: 1, output: "Error: Cannot find module 'vitest'", root });
    expect(result.exit).toBe(2);
    expect(result.exit === 2 ? result.cause : "").toContain("no Vitest report");
  });

  it("cannot run on a report that is not JSON", () => {
    const result = classifyVitest({ report: "{ not json", exitCode: 1, output: "", root });
    expect(result.exit).toBe(2);
    expect(result.exit === 2 ? result.cause : "").toContain("no Vitest report");
  });
});

describe("chromiumCheck", () => {
  const playwrightPath = "/home/u/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome";
  const override = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell";

  it("checks Playwright's own Chromium when no override is set and finds no problem when it exists", () => {
    const check = chromiumCheck({ override: undefined, playwrightPath, exists: (p) => p === playwrightPath });
    expect(check).toEqual({ executable: playwrightPath, problem: undefined });
  });

  it("names pnpm run setup:online when Playwright's Chromium is missing", () => {
    const check = chromiumCheck({ override: undefined, playwrightPath, exists: () => false });
    expect(check.executable).toBe(playwrightPath);
    expect(check.problem ?? "").toContain("Chromium");
    expect(check.problem ?? "").toContain(playwrightPath);
    expect(check.problem ?? "").toContain("pnpm run setup:online");
  });

  it("names pnpm run setup:online when Playwright cannot name a Chromium executable", () => {
    const check = chromiumCheck({ override: undefined, playwrightPath: undefined, exists: () => true });
    expect(check.executable).toBeUndefined();
    expect(check.problem ?? "").toContain("Chromium");
    expect(check.problem ?? "").toContain("pnpm run setup:online");
  });

  it("checks the OCELLE_CHROMIUM_PATH override instead of Playwright's Chromium when it is set (R1-03)", () => {
    const check = chromiumCheck({ override, playwrightPath, exists: (p) => p === override });
    expect(check).toEqual({ executable: override, problem: undefined });
  });

  it("names the override and pnpm run setup:online when the override does not exist", () => {
    const check = chromiumCheck({ override, playwrightPath, exists: (p) => p === playwrightPath });
    expect(check.executable).toBe(override);
    expect(check.problem ?? "").toContain(override);
    expect(check.problem ?? "").toContain("OCELLE_CHROMIUM_PATH");
    expect(check.problem ?? "").toContain("pnpm run setup:online");
  });

  it("treats an empty override as unset, like vitest.config.ts does", () => {
    const check = chromiumCheck({ override: "", playwrightPath, exists: (p) => p === playwrightPath });
    expect(check).toEqual({ executable: playwrightPath, problem: undefined });
  });
});

// Added in the phase 3 mutation catch-up of phase 2 (T049): mutants that survived the phase 2 tests.
interface VitestReport {
  success: boolean;
  testResults: {
    name: string;
    status: string;
    message: string;
    assertionResults: { fullName: string; status: string; failureMessages: string[] }[];
  }[];
}

function report(name: string): VitestReport {
  return JSON.parse(fixture(name)) as VitestReport;
}

function first<T>(items: readonly T[]): T {
  const [item] = items;
  if (item === undefined) throw new Error("fixture has no item");
  return item;
}

describe("classifyVitest (mutation catch-up)", () => {
  it("names the first non-blank line of a failure message, without colour codes or indentation", () => {
    const failing = report("failing.json");
    const failed = first(failing.testResults).assertionResults[1];
    if (failed === undefined) throw new Error("fixture has no failed test");
    failed.failureMessages = ["\n   \u001b[31mAssertionError\u001b[39m: expected 3 to be 4\n    at sum.test.ts:8"];
    const result = classifyVitest({ report: JSON.stringify(failing), exitCode: 1, output: "", root });
    expect(result).toMatchObject({ exit: 1, findings: [{ message: "AssertionError: expected 3 to be 4" }, {}] });
  });

  it("names a failed test without a failure message 'failed', and an empty message as empty", () => {
    const failing = report("failing.json");
    const [sum, title] = failing.testResults;
    if (sum === undefined || title === undefined) throw new Error("fixture has two files");
    const failed = sum.assertionResults[1];
    const other = title.assertionResults[0];
    if (failed === undefined || other === undefined) throw new Error("fixture has failed tests");
    failed.failureMessages = [];
    other.failureMessages = [""];
    const result = classifyVitest({ report: JSON.stringify(failing), exitCode: 1, output: "", root });
    expect(result).toMatchObject({ exit: 1, findings: [{ message: "failed" }, { message: "" }] });
  });

  it("keeps the path of a test file outside the repository root as it is", () => {
    const failing = report("failing.json");
    first(failing.testResults).name = "/elsewhere/sum.test.ts";
    const result = classifyVitest({ report: JSON.stringify(failing), exitCode: 1, output: "", root });
    expect(result).toMatchObject({
      exit: 1,
      findings: [{ location: { path: "/elsewhere/sum.test.ts" } }, { location: { path: "packages/elements/test/title.test.ts" } }],
    });
  });

  it("cannot run on an error outside the tests of a file whose tests all passed", () => {
    const passing = report("passing.json");
    passing.success = false;
    const file = first(passing.testResults);
    file.status = "failed";
    file.message = "Error: afterAll hook failed";
    expect(classifyVitest({ report: JSON.stringify(passing), exitCode: 1, output: "", root })).toEqual({
      exit: 2,
      cause: "unit-tests: could not run: packages/tokens/test/sum.test.ts: error outside tests: Error: afterAll hook failed",
    });
  });

  it("counts only passed tests in the summary, not skipped ones", () => {
    const passing = report("passing.json");
    const skipped = first(passing.testResults).assertionResults[1];
    if (skipped === undefined) throw new Error("fixture has two tests");
    skipped.status = "skipped";
    expect(classifyVitest({ report: JSON.stringify(passing), exitCode: 0, output: "", root })).toEqual({
      exit: 0,
      summary: "unit-tests: 2 tests passed in 2 files",
    });
  });

  it("cannot run without a report, naming Vitest's exit code when its output names no error", () => {
    expect(classifyVitest({ report: undefined, exitCode: 1, output: "", root })).toEqual({
      exit: 2,
      cause: "unit-tests: could not run: no Vitest report (Vitest exited 1); run pnpm run setup:offline and check vitest.config.ts",
    });
  });

  it("cannot run without a report, naming the error line of the output (colour codes and indentation removed)", () => {
    const output = "Vitest reports an Error: below\n  \u001b[31mTypeError\u001b[39m: late boom\n";
    expect(classifyVitest({ report: undefined, exitCode: 1, output, root })).toEqual({
      exit: 2,
      cause:
        "unit-tests: could not run: no Vitest report (TypeError: late boom); run pnpm run setup:offline and check vitest.config.ts",
    });
  });

  it("cannot run on a report that is null or has no list of test results", () => {
    const cause =
      "unit-tests: could not run: no Vitest report (Vitest exited 1); run pnpm run setup:offline and check vitest.config.ts";
    expect(classifyVitest({ report: "null", exitCode: 1, output: "", root })).toEqual({ exit: 2, cause });
    expect(classifyVitest({ report: "{}", exitCode: 1, output: "", root })).toEqual({ exit: 2, cause });
  });

  it("cannot run when Vitest fails with no failed test and no error in its output", () => {
    expect(classifyVitest({ report: fixture("passing.json"), exitCode: 1, output: "", root })).toEqual({
      exit: 2,
      cause: "unit-tests: could not run: Vitest reported errors outside tests: Vitest exited 1 with no failed test",
    });
  });
});

describe("unitTests (mutation catch-up)", () => {
  const vitestPath = `${root}/node_modules/vitest/vitest.mjs`;
  const args = ["run", "--reporter", "default", "--reporter", "json", "--includeTaskLocation"];

  function capture(): { io: Io; out: string[]; err: string[] } {
    const out: string[] = [];
    const err: string[] = [];
    return { io: { cwd: root, env: {}, out: (l) => out.push(l), err: (l) => err.push(l) }, out, err };
  }

  /** Vitest that writes the passing report only when run as the gate must run it. */
  function tools(chromiumProblem: string | undefined, installed: boolean, extra: readonly string[] = []): UnitTestTools {
    return {
      chromium: () => Promise.resolve({ executable: "/chrome", problem: chromiumProblem }),
      exists: (path) => installed && path === vitestPath,
      vitest: (vitest, given) => {
        const expected = [...args, ...extra];
        const right = vitest === vitestPath && given.join(" ") === expected.join(" ");
        return Promise.resolve(
          right
            ? { report: fixture("passing.json"), exitCode: 0, output: "" }
            : { report: undefined, exitCode: 1, output: `Error: unexpected vitest call ${given.join(" ")}` },
        );
      },
    };
  }

  const noVitest: UnitTestTools["vitest"] = () => Promise.reject(new Error("Vitest must not run"));

  it("runs no test when Chromium is missing, exit 2 naming the problem", async () => {
    const c = capture();
    const code = await unitTests({ root, toolCwd: root, args: [] }, { ...tools("Chromium not found", true), vitest: noVitest }, c.io);
    expect({ code, out: c.out, err: c.err }).toEqual({
      code: 2,
      out: [],
      err: ["unit-tests: could not run: Chromium not found"],
    });
  });

  it("exits 2 naming the setup when Vitest is not installed in the root", async () => {
    const c = capture();
    const code = await unitTests({ root, toolCwd: root, args: [] }, { ...tools(undefined, false), vitest: noVitest }, c.io);
    expect({ code, out: c.out, err: c.err }).toEqual({
      code: 2,
      out: [],
      err: [`unit-tests: could not run: Vitest is not installed in ${root}; run pnpm run setup:offline`],
    });
  });

  it("runs Vitest with the JSON report and test locations, passing extra arguments on, and classifies the report", async () => {
    const c = capture();
    const extra = ["--project", "tokens"];
    const code = await unitTests({ root, toolCwd: root, args: extra }, tools(undefined, true, extra), c.io);
    expect({ code, out: c.out, err: c.err }).toEqual({
      code: 0,
      out: ["unit-tests: 3 tests passed in 2 files"],
      err: [],
    });
  });
});
