import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, runGate, tempDir, workspace } from "./workspace.ts";

// `gates/bin/test.ts --root <tmp>` on temporary workspaces built from gates/test/fixtures/test-command/<case>/, with
// the repository's vitest.config.ts copied in unchanged and node_modules linked, run from a different working
// directory (research.md R-03 test seam).
const timeout = 120_000;

function testCommand(fixture: string, env: Record<string, string>): ReturnType<typeof runGate> {
  const root = workspace(`test-command/${fixture}`, ["vitest.config.ts"], true);
  return runGate("gates/bin/test.ts", ["--root", root], { cwd: tempDir("cwd"), env });
}

afterEach(cleanUp);

describe("test command (gates/bin/test.ts)", () => {
  it(
    "exits 2 naming pnpm run setup:online when Chromium is missing, and runs no test (US1 scenario 9)",
    async () => {
      const env: Record<string, string> = { ...baseEnv(), PLAYWRIGHT_BROWSERS_PATH: tempDir("browsers") };
      delete env["OCELLE_CHROMIUM_PATH"];
      const ran = await testCommand("passing", env);
      expect(ran.code).toBe(2);
      expect(ran.stderr).toHaveLength(1);
      expect(ran.stderr[0]).toContain("Chromium");
      expect(ran.stderr[0]).toContain("pnpm run setup:online");
      expect(ran.stdout.join("\n")).not.toMatch(/passed|skipped/);
    },
    timeout,
  );

  it(
    "exits 2 naming the override when OCELLE_CHROMIUM_PATH points at no executable",
    async () => {
      const missing = `${tempDir("browsers")}/chrome`;
      const ran = await testCommand("passing", { ...baseEnv(), OCELLE_CHROMIUM_PATH: missing });
      expect(ran.code).toBe(2);
      expect(ran.stderr).toHaveLength(1);
      expect(ran.stderr[0]).toContain(missing);
      expect(ran.stderr[0]).toContain("OCELLE_CHROMIUM_PATH");
    },
    timeout,
  );

  it(
    "exits 1 naming the failing test as a finding (US1 scenario 5)",
    async () => {
      const ran = await testCommand("failing", baseEnv());
      expect(ran.code).toBe(1);
      expect(ran.stdout).toEqual([
        "packages/tokens/test/sum.test.ts:8: unit-tests: sum adds three numbers: " +
          "AssertionError: expected 3 to be 4 // Object.is equality",
        "unit-tests: 1 of 2 tests failed",
      ]);
    },
    timeout,
  );

  it(
    "exits 2 when no test file is found (FR-004)",
    async () => {
      const ran = await testCommand("no-test-file", baseEnv());
      expect(ran.code).toBe(2);
      expect(ran.stderr).toHaveLength(1);
      expect(ran.stderr[0]).toContain("no test file found");
    },
    timeout,
  );

  it(
    "exits 0 with a one-line summary when every test passes",
    async () => {
      const ran = await testCommand("passing", baseEnv());
      expect({ code: ran.code, stdout: ran.stdout }).toEqual({
        code: 0,
        stdout: ["unit-tests: 2 tests passed in 1 file"],
      });
    },
    timeout,
  );
});
