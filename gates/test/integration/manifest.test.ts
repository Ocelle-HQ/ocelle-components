import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildRepoTree } from "../../lib/plant-repo.ts";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";

// The manifest gate in a built plant tree (005 research.md R-06, PLAN-TESTABILITY-1-003; T018): the pass plant
// pass-repository is the configuration set alone, which holds the element source, the generator and the committed
// manifest (R-12). Run as the plant job runs it, `node gates/bin/manifest.ts --root <tmp>` from another directory, it
// exits 0, so a generator that cannot resolve the analyzer from a plant tree (exit 2) fails here.
afterEach(cleanUp);

describe("manifest gate in a plant tree", () => {
  it(
    "exits 0 on pass-repository's temporary repository",
    async () => {
      const into = tempDir("manifest-plant");
      await buildRepoTree(repo, join(repo, "gates/plants/manifest/pass-repository"), into);
      const ran = await runGate("gates/bin/manifest.ts", ["--root", into], { cwd: tempDir("cwd"), env: baseEnv() });
      expect(ran).toEqual({ code: 0, stdout: ["manifest: 18 elements checked, no finding"], stderr: [] });
    },
    120_000,
  );
});
