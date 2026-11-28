import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { afterEach, describe, expect, it } from "vitest";
import { docker, files, gate, root, timeout } from "./visual-fixture.ts";
import { cleanUp, repo } from "./workspace.ts";

afterEach(cleanUp);

/** A PNG file with the RGB channels of its pixel at (0, 0) inverted. */
function onePixel(file: Buffer): Buffer {
  const png = PNG.sync.read(file);
  for (let channel = 0; channel < 3; channel += 1) png.data[channel] = 255 - (png.data[channel] ?? 0);
  return PNG.sync.write(png, { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel: 9, filterType: 4 });
}

describe("visual gate (gates/bin/visual.ts)", () => {
  it(
    "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)",
    async () => {
      const at = await root();
      const baselines = join(at, "storybook/baselines");
      writeFileSync(join(baselines, "tokens--colour.light.png"), onePixel(readFileSync(join(baselines, "tokens--colour.light.png"))));
      rmSync(join(baselines, "tokens--colour.dark.png"));
      const ran = await gate(at);
      expect({ code: ran.code, findings: ran.stdout.slice(0, -1).map((line) => line.split(": ").slice(0, 3).join(": ")), stderr: ran.stderr }).toEqual({
        code: 1,
        findings: ["tokens--colour/light: visual: differs", "tokens--colour/dark: visual: missing-baseline"],
        stderr: [],
      });
      expect(ran.stdout.at(-1)).toBe(`visual: 2 findings in 854 story-themes (docker ${docker}`);
      const kept = files(join(at, "storybook/.visual"));
      expect([...kept.keys()]).toEqual(["baselines/tokens--colour.dark.png", "baselines/tokens--colour.light.png", "tokens--colour.light.actual.png", "tokens--colour.light.diff.png"]);
      expect(kept.get("baselines/tokens--colour.light.png")?.equals(kept.get("tokens--colour.light.actual.png") ?? Buffer.alloc(0))).toBe(true);
      expect(kept.get("baselines/tokens--colour.dark.png")?.equals(readFileSync(join(repo, "storybook/baselines/tokens--colour.dark.png")))).toBe(true);
      expect(kept.get("tokens--colour.light.actual.png")?.equals(readFileSync(join(repo, "storybook/baselines/tokens--colour.light.png")))).toBe(true);
      const diff = PNG.sync.read(kept.get("tokens--colour.light.diff.png") ?? Buffer.alloc(0));
      const magenta = [...Array(diff.width * diff.height).keys()].filter((pixel) => diff.data.readUInt32BE(pixel * 4) === 0xff00ffff);
      expect(magenta).toEqual([0]);
    },
    timeout,
  );
});
