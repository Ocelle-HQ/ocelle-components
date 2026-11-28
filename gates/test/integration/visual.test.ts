import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { docker, files, gate, root, timeout } from "./visual-fixture.ts";
import { cleanUp } from "./workspace.ts";

afterEach(cleanUp);

describe("visual gate (gates/bin/visual.ts)", () => {
  it(
    "captures the repository's 854 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)",
    async () => {
      const at = await root();
      const ran = await gate(at);
      expect(ran).toEqual({ code: 0, stdout: [`visual: 854 captures match their baselines (docker ${docker}`], stderr: [] });
      expect([...files(join(at, "storybook/.visual")).keys()]).toEqual([]);
    },
    timeout,
  );
});
