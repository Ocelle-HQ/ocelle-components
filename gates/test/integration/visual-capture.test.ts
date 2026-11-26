import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { chromium } from "playwright";
import { afterEach, describe, expect, it } from "vitest";
import { contextOptions, screenshotOptions, storyPath } from "../../lib/capture-plan.ts";
import { parsePin, pinReference, runArgs, runDir } from "../../lib/container.ts";
import { buildCommand, buildEnv } from "../../lib/storybook-build.ts";
import { parseIndex } from "../../lib/storybook-index.ts";
import { serve } from "../../lib/storybook-serve.ts";
import { parseResult } from "../../lib/visual-verdict.ts";
import type { Theme } from "../../lib/visual-verdict.ts";
import { env, files, plantsDir, root, run, timeout } from "./visual-fixture.ts";
import { cleanUp, repo, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

afterEach(cleanUp);

function update(root: string, args: readonly string[] = []): Promise<Ran> {
  return runGate("gates/bin/baselines.ts", ["--root", root, ...args], { cwd: tempDir("cwd"), env: env() });
}

/** Builds the Storybook of a root with the gates' build command and returns its story ids. */
async function build(at: string): Promise<string[]> {
  const { command, args } = buildCommand();
  const built = await run(command, args, at, buildEnv(at, env()));
  expect({ code: built.code, stderr: built.code === 0 ? "" : built.stderr }).toEqual({ code: 0, stderr: "" });
  return parseIndex(readFileSync(join(at, "storybook/dist/index.json"), "utf8")).map((story) => story.id);
}

/** One capture run in the pinned container under docker, as the gate starts it, on a request of its own. */
async function capture(at: string, n: number, stories: readonly string[], themes: readonly Theme[]): Promise<Map<string, Buffer>> {
  const pin = parsePin(readFileSync(join(repo, "storybook/visual/container.json"), "utf8"));
  const out = runDir(at, n);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "home"), { recursive: true });
  writeFileSync(join(out, "request.json"), JSON.stringify({ dist: join(at, "storybook/dist"), out, stories, themes }));
  const ran = await run("docker", runArgs({ engine: "docker", repo, root: at, run: n, uid: process.getuid?.() ?? 0, gid: process.getgid?.() ?? 0, pin }), repo, env());
  expect({ code: ran.code, stderr: ran.stderr }).toEqual({ code: 0, stderr: "" });
  expect(pinReference(pin)).toContain("@sha256:");
  const entries = parseResult(readFileSync(join(out, "result.json"), "utf8"));
  expect(entries.filter((entry) => entry.status !== "captured")).toEqual([]);
  return new Map(entries.map((entry) => [`${entry.story}.${entry.theme}`, readFileSync(join(out, entry.file ?? ""))]));
}

describe("baseline command (gates/bin/baselines.ts)", () => {
  it(
    "writes nothing on an unchanged tree and says so (FR-008, analysis G1)",
    async () => {
      const at = await root();
      const before = files(join(at, "storybook/baselines"));
      expect(before.size).toBe(796);
      expect(await update(at)).toEqual({ code: 0, stdout: ["baselines: wrote 0 files (0 added, 0 changed, 0 removed), 0 bytes in total"], stderr: [] });
      expect(files(join(at, "storybook/baselines"))).toEqual(before);
    },
    timeout,
  );

  it(
    "the plant mode writes a deleted baseline of a plant back with the bytes it had, and touches no other file (research.md R-11)",
    async () => {
      // A repository of its own holding the plant, so the plant's tree/ can change: the configuration set and the plant.
      const fake = await root();
      cpSync(join(plantsDir, "pass-unused-face"), join(fake, "gates/plants/visual/pass-unused-face"), { recursive: true });
      const plant = join(fake, "gates/plants/visual/pass-unused-face");
      const before = files(plant);
      const [deleted, bytes] = [...before].find(([path]) => path.startsWith("tree/storybook/baselines/")) ?? ["", Buffer.alloc(0)];
      expect(deleted).toMatch(/^tree\/storybook\/baselines\/[a-z0-9-]+--[a-z0-9-]+\.(?:light|dark)\.png$/);
      rmSync(join(plant, deleted));
      const ran = await update(fake, ["--plant", "visual/pass-unused-face"]);
      expect(ran).toEqual({ code: 0, stdout: [`baselines: wrote 1 files (1 added, 0 changed, 0 removed), ${String(bytes.length)} bytes in total`], stderr: [] });
      expect(files(plant)).toEqual(before);
    },
    timeout,
  );
});

describe("capture (gates/visual/capture.ts in the pinned container)", () => {
  it(
    "captures a story alone byte for byte as in a full run after other stories (freshness, FR-028), and a 2000 px story 2000 px tall (FR-012)",
    async () => {
      const at = await root("pass-second-render");
      cpSync(join(plantsDir, "pass-below-fold/tree/storybook/stories"), join(at, "storybook/stories"), { recursive: true });
      const stories = await build(at);
      const second = stories.find((id) => id.startsWith("second-render--"));
      const tall = stories.find((id) => id.startsWith("below-fold--"));
      expect([second, tall].every((id) => id !== undefined)).toBe(true);
      const ordered = [...stories.filter((id) => id !== second), String(second)];
      const full = await capture(at, 1, ordered, ["light", "dark"]);
      const light = await capture(at, 2, [String(second)], ["light"]);
      const dark = await capture(at, 3, [String(second)], ["dark"]);
      expect(full.size).toBe(2 * ordered.length);
      expect(full.get(`${String(second)}.light`)?.equals(light.get(`${String(second)}.light`) ?? Buffer.alloc(0))).toBe(true);
      expect(full.get(`${String(second)}.dark`)?.equals(dark.get(`${String(second)}.dark`) ?? Buffer.alloc(0))).toBe(true);
      const heights = ["light", "dark"].map((theme) => PNG.sync.read(full.get(`${String(tall)}.${theme}`) ?? Buffer.alloc(0)).height);
      expect(heights).toEqual([2000, 2000]);
    },
    timeout,
  );
});

// research.md R-04, the control of the animation fix: the pass-animation-and-caret story, opened twice in one page
// 400 ms apart, gives two different screenshots with Playwright's defaults for motion and animations, and the same
// screenshot with the capture's context and screenshot options. Host browser; no container.
describe("animation control (research.md R-04)", () => {
  it(
    "differs between two screenshots with reduced motion and animations left at Playwright's defaults, and agrees with the capture's options",
    async () => {
      const at = await root("pass-animation-and-caret");
      const [story] = (await build(at)).filter((id) => id.startsWith("animation-and-caret--"));
      expect(story).toBeDefined();
      const server = await serve(join(at, "storybook/dist"));
      const executablePath = process.env.OCELLE_CHROMIUM_PATH;
      const browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
      try {
        const twice = async (fixed: boolean): Promise<boolean> => {
          const context = await browser.newContext(fixed ? contextOptions("light") : { ...contextOptions("light"), reducedMotion: "no-preference" });
          const page = await context.newPage();
          await page.goto(`${server.origin}${storyPath(String(story), "light")}`);
          await page.waitForSelector(".plant-spinner");
          const options = fixed ? screenshotOptions() : { fullPage: true };
          const first = await page.screenshot(options);
          await page.waitForTimeout(400);
          const second = await page.screenshot(options);
          await context.close();
          return first.equals(second);
        };
        expect([await twice(false), await twice(true)]).toEqual([false, true]);
      } finally {
        await browser.close();
        await server.close();
      }
    },
    timeout,
  );
});
