import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, runGate, tempDir, workspace } from "./workspace.ts";

// `gates/bin/config-copies.ts --root <tmp>` as a script, on temporary repositories built from
// gates/test/fixtures/config-copies/<case>/, run from a different working directory (FR-006, research.md R-15). These
// cases run the entry's `import.meta.main` line, which the in-process tests (gates/test/config-copies.test.ts) cannot
// reach; its record names them (research.md R-08; phase 3 review round 5, O5-02).
const timeout = 60_000;
const specify = ".specify/extensions/story/story-config.yml";
const tooling = "tooling/speckit/extensions/story/story-config.yml";

function configCopies(fixture: string): ReturnType<typeof runGate> {
  const root = workspace(`config-copies/${fixture}`, [], false);
  return runGate("gates/bin/config-copies.ts", ["--root", root], { cwd: tempDir("cwd"), env: baseEnv() });
}

afterEach(cleanUp);

describe("config copies (gates/bin/config-copies.ts)", () => {
  it(
    "exits 0 with a one-line summary on two identical copies",
    async () => {
      const ran = await configCopies("equal");
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 0,
        stdout: [`config-copies: ${specify} and ${tooling} are identical`],
        stderr: [],
      });
    },
    timeout,
  );

  it(
    "exits 2 naming the missing tooling copy",
    async () => {
      const ran = await configCopies("missing");
      expect({ code: ran.code, stdout: ran.stdout, stderr: ran.stderr }).toEqual({
        code: 2,
        stdout: [],
        stderr: [`config-copies: could not run: cannot read ${tooling}; restore it from git (both copies must exist)`],
      });
    },
    timeout,
  );
});
