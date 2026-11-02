import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chromiumCheck } from "../bin/test.ts";
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
