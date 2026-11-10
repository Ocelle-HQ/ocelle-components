import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

// The four entry stubs of specs/006-storybook-workbench tasks.md T003 (phase 1 review round 1, R1-01), run as
// `pnpm run gate:<name>` runs them: `node gates/bin/<name>.ts`. Each exits 2 with exactly one stderr line naming
// what is not implemented and the phase that implements it, and writes nothing to stdout; none may exit 0.
const timeout = 60_000;

afterEach(() => {
  cleanUp();
});

function runStub(script: string): Promise<Ran> {
  return runGate(script, [], { cwd: tempDir("cwd"), env: baseEnv() });
}

/** Exit 2, exactly the one stderr line, nothing on stdout. */
function notImplemented(line: string): Ran {
  return { code: 2, stdout: [], stderr: [line] };
}

describe("entry stubs (gates/bin/storybook-build.ts, visual.ts, baselines.ts, axe.ts)", () => {
  it(
    "storybook-build exits 2 with exactly could not run: not implemented (storybook-build, phase 2)",
    async () => {
      expect(await runStub("gates/bin/storybook-build.ts")).toEqual(notImplemented("could not run: not implemented (storybook-build, phase 2)"));
    },
    timeout,
  );

  it(
    "visual exits 2 with exactly could not run: not implemented (visual, phase 3)",
    async () => {
      expect(await runStub("gates/bin/visual.ts")).toEqual(notImplemented("could not run: not implemented (visual, phase 3)"));
    },
    timeout,
  );

  it(
    "visual:update exits 2 with exactly could not run: not implemented (visual:update, phase 3)",
    async () => {
      expect(await runStub("gates/bin/baselines.ts")).toEqual(notImplemented("could not run: not implemented (visual:update, phase 3)"));
    },
    timeout,
  );

  it(
    "axe exits 2 with exactly could not run: not implemented (axe, phase 4)",
    async () => {
      expect(await runStub("gates/bin/axe.ts")).toEqual(notImplemented("could not run: not implemented (axe, phase 4)"));
    },
    timeout,
  );
});
