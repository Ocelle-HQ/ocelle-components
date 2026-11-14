import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";

// The contrast and brand-rules gates as processes on the repository (002 US3 independent test, FR-021; contracts/gates.md
// § `contrast`, § `brand-rules`): `--root <repo>` from another working directory, each exits 0 with its one summary
// line, and the contrast gate's --print lists the 310 required pairs (298 before 014 research.md R-17) with four-decimal ratios.
const timeout = 60_000;

afterEach(cleanUp);

describe("contrast and brand-rules on the repository", () => {
  it(
    "contrast --root <repo> checks 166 pairs in light and 174 in dark, 155 required per theme (014 R-17)",
    async () => {
      const ran = await runGate("gates/bin/contrast.ts", ["--root", repo], { cwd: tempDir("cwd"), env: baseEnv() });
      expect(ran).toEqual({ code: 0, stdout: ["contrast: 166 pairs checked in light, 174 in dark (155 required per theme)"], stderr: [] });
    },
    timeout,
  );

  it(
    "contrast --print lists every required pair with its ratio",
    async () => {
      const ran = await runGate("gates/bin/contrast.ts", ["--root", repo, "--print"], { cwd: tempDir("cwd"), env: baseEnv() });
      expect({ code: ran.code, lines: ran.stdout.length, first: ran.stdout[0], stderr: ran.stderr }).toEqual({
        code: 0,
        lines: 310,
        first: "light color-ink on color-canvas (text): 16.0215",
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "brand-rules --root <repo> checks the seven rules",
    async () => {
      const ran = await runGate("gates/bin/brand-rules.ts", ["--root", repo], { cwd: tempDir("cwd"), env: baseEnv() });
      expect(ran).toEqual({ code: 0, stdout: ["brand-rules: 7 rules checked"], stderr: [] });
    },
    timeout,
  );
});
