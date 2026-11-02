import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, tempDir, workspace } from "./workspace.ts";

// `gates/bin/test-lint.ts --root <tmp>` on temporary workspaces built from gates/test/fixtures/test-lint/<case>/, with
// the repository's eslint.test.config.ts and gates/eslint/ copied in unchanged and node_modules linked, run from a
// different working directory (FR-010, SC-004, research.md R-06). Each test first asserts that the test-lint
// configuration exists: the green commit creates it, so at the red commit the test fails on that assertion.
const timeout = 60_000;
const config = "eslint.test.config.ts";

function testLint(fixture: string): ReturnType<typeof runGate> {
  const root = workspace(`test-lint/${fixture}`, [config, "gates/eslint"], true);
  return runGate("gates/bin/test-lint.ts", ["--root", root], { cwd: tempDir("cwd"), env: baseEnv() });
}

afterEach(cleanUp);

describe("test lint (gates/bin/test-lint.ts)", () => {
  it.each([
    {
      fixture: "expect-expect",
      finding: "packages/tokens/test/case.test.ts:3: test-lint: vitest/expect-expect: Test has no assertions",
    },
    {
      fixture: "no-disabled-tests",
      finding:
        "packages/tokens/test/case.test.ts:3: test-lint: vitest/no-disabled-tests: " +
        "Disabled test - if you want to skip a test temporarily, use .todo() instead",
    },
    {
      fixture: "no-focused-tests",
      finding: "packages/styles/test/case.test.ts:3: test-lint: vitest/no-focused-tests: Focused tests are not allowed",
    },
    {
      fixture: "no-conditional-expect",
      finding:
        "gates/test/case.test.ts:6: test-lint: vitest/no-conditional-expect: " +
        "Avoid calling `expect` inside conditional statements",
    },
    {
      fixture: "no-standalone-expect",
      finding:
        "packages/elements/test/case.test.ts:3: test-lint: vitest/no-standalone-expect: " +
        "Expect must be called inside a test block",
    },
    {
      fixture: "valid-expect",
      finding: "packages/tokens/test/case.test.ts:4: test-lint: vitest/valid-expect: Async assertions must be awaited",
    },
    {
      fixture: "valid-expect-in-promise",
      finding:
        "packages/tokens/test/case.test.ts:4: test-lint: vitest/valid-expect-in-promise: " +
        "This promise should either be returned or awaited to ensure the expects in its chain are called",
    },
    {
      fixture: "no-snapshot-only",
      finding:
        "packages/tokens/src/case.stories.ts:3: test-lint: ocelle/no-snapshot-only: " +
        "Test asserts only through snapshots; add an assertion of the behaviour (FR-010)",
    },
  ])(
    "exits 1 with exactly the one finding of $fixture",
    async ({ fixture, finding }) => {
      expect(existsSync(join(repo, config))).toBe(true);
      const ran = await testLint(fixture);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 1,
        stdout: [finding, "test-lint: 1 finding in 1 file"],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 0 on a test with one real assertion",
    async () => {
      expect(existsSync(join(repo, config))).toBe(true);
      const ran = await testLint("pass");
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 0,
        stdout: ["test-lint: 1 file checked, no finding"],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 2 naming the file when a test file does not parse",
    async () => {
      expect(existsSync(join(repo, config))).toBe(true);
      const ran = await testLint("does-not-parse");
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: ["test-lint: could not run: gates/test/case.test.ts:4 does not parse (Parsing error: ')' expected.)"],
      });
    },
    timeout,
  );
});

// Unchecked assertions (FR-010, research.md R-06 "Unchecked assertions", tasks.md T091): one fixture per rule
// (exit 1, exactly that rule's one finding), the look-alikes that stay allowed (exit 0), and an asserting catch,
// which the gate rejects on vitest/no-conditional-expect alone, not on ocelle/no-swallowed-expect.
describe("test lint, unchecked assertions (gates/bin/test-lint.ts)", () => {
  it.each([
    {
      fixture: "no-floating-promise-expect",
      finding:
        "packages/tokens/test/case.test.ts:4: test-lint: ocelle/no-floating-promise-expect: " +
        "Assertion in a promise callback that is neither awaited nor returned; await or return the promise (FR-010)",
    },
    {
      fixture: "no-timer-expect",
      finding:
        "packages/tokens/test/case.test.ts:4: test-lint: ocelle/no-timer-expect: " +
        "Assertion in a timer callback runs outside the test's control; await the condition, then assert (FR-010)",
    },
    {
      fixture: "no-swallowed-expect",
      finding:
        "packages/tokens/test/case.test.ts:4: test-lint: ocelle/no-swallowed-expect: " +
        "Assertion inside a try whose catch neither rethrows nor asserts; the failure is swallowed (FR-010)",
    },
    {
      fixture: "asserting-catch",
      finding:
        "packages/tokens/test/case.test.ts:7: test-lint: vitest/no-conditional-expect: " +
        "Avoid calling `expect` inside conditional statements",
    },
  ])(
    "exits 1 with exactly the one finding of $fixture",
    async ({ fixture, finding }) => {
      expect(existsSync(join(repo, config))).toBe(true);
      const ran = await testLint(fixture);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 1,
        stdout: [finding, "test-lint: 1 finding in 1 file"],
        stderr: [],
      });
    },
    timeout,
  );

  it.each(["pass-awaited-promise", "pass-returned-promise", "pass-rethrowing-catch"])(
    "exits 0 with no finding on %s",
    async (fixture) => {
      expect(existsSync(join(repo, config))).toBe(true);
      const ran = await testLint(fixture);
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 0,
        stdout: ["test-lint: 1 file checked, no finding"],
        stderr: [],
      });
    },
    timeout,
  );
});
