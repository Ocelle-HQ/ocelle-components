import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { PNG } from "pngjs";
import { chromium } from "playwright";
import { afterEach, describe, expect, it } from "vitest";
import { contextOptions, screenshotOptions, storyPath } from "../../lib/capture-plan.ts";
import { parsePin, pinReference, runArgs, runDir } from "../../lib/container.ts";
import { parsePlant } from "../../lib/plant-judge.ts";
import { buildRepoTree } from "../../lib/plant-repo.ts";
import { buildCommand, buildEnv } from "../../lib/storybook-build.ts";
import { parseIndex } from "../../lib/storybook-index.ts";
import { serve } from "../../lib/storybook-serve.ts";
import { parseResult } from "../../lib/visual-verdict.ts";
import type { Theme } from "../../lib/visual-verdict.ts";
import { baseEnv, cleanUp, repo, runGate, tempDir } from "./workspace.ts";
import type { Ran } from "./workspace.ts";

// The visual gate and the baseline command end to end (FR-003 to FR-012, FR-026 to FR-028; US2 scenarios 1, 2, 6, 7,
// 8, 10 and 15; contracts/gates.md § `visual`, § `visual:update`; contracts/container.md; research.md R-04, R-11), on
// plant roots built by gates/lib/plant-repo.ts. The container runs need docker (started in the sandbox, present on the
// CI runner) and the pinned image; with no engine they fail with the gate's exit 2, never skip. Every run of a gate
// here has CI and GITHUB_ACTIONS removed from its environment (the CI rule has its own test) and no
// OCELLE_VISUAL_ENGINE, so the engine is `auto`, docker here. The animation control drives the host browser
// (OCELLE_CHROMIUM_PATH locally) on the plant story pass-animation-and-caret.
// The time limit is shared by the file's tests. The whole-repository capture grows with every story: it took 519 s at
// 171 stories (landing round 1 R1-06), and at 194 stories (388 story-themes) it timed out at the 600 s limit on CI run
// 44481594952, where run 44298568583 had passed it. 1200 s is twice the limit that failed (012
// reviews/phase-6/round-7.md O7-01, operator 2026-11-19); gates/test/visual-timeout.test.ts pins it. The growth itself
// stays with the plant-design triage follow-up (012 plan decision 15, R1-06, R1-09).
const timeout = 1_200_000;
const empty = join(repo, "gates/test/fixtures/plant-repo/empty-plant");
const plantsDir = join(repo, "gates/plants/visual");
const docker = "only: no cross-engine comparison)";

afterEach(cleanUp);

/** This process's environment without Vitest's variables, CI, GITHUB_ACTIONS and OCELLE_VISUAL_ENGINE. */
function env(extra: Record<string, string> = {}): Record<string, string> {
  const removed = new Set(["CI", "GITHUB_ACTIONS", "OCELLE_VISUAL_ENGINE"]);
  return { ...Object.fromEntries(Object.entries(baseEnv()).filter(([key]) => !removed.has(key))), ...extra };
}

function gate(root: string, args: readonly string[] = [], extra: Record<string, string> = {}): Promise<Ran> {
  return runGate("gates/bin/visual.ts", ["--root", root, ...args], { cwd: tempDir("cwd"), env: env(extra) });
}

function update(root: string, args: readonly string[] = []): Promise<Ran> {
  return runGate("gates/bin/baselines.ts", ["--root", root, ...args], { cwd: tempDir("cwd"), env: env() });
}

/** A plant root of the repository's configuration set (its stories and baselines), with a plant's tree/ when named. */
async function root(plant?: string): Promise<string> {
  const into = tempDir("visual");
  if (plant === undefined) {
    await buildRepoTree(repo, empty, into);
    return into;
  }
  const parsed = parsePlant(readFileSync(join(plantsDir, plant, "plant.json"), "utf8"));
  await buildRepoTree(repo, join(plantsDir, plant), into, typeof parsed === "string" ? undefined : parsed);
  return into;
}

/** Every file below a directory, as sorted paths relative to it, with its bytes. */
function files(dir: string): Map<string, Buffer> {
  const found = new Map<string, Buffer>();
  if (!existsSync(dir)) return found;
  for (const entry of readdirSync(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) found.set(relative(dir, join(entry.parentPath, entry.name)), readFileSync(join(entry.parentPath, entry.name)));
  }
  return new Map([...found].sort(([a], [b]) => a.localeCompare(b)));
}

/** Runs a command and collects its exit code and output. */
function run(command: string, args: readonly string[], cwd: string, environment: Record<string, string | undefined>): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env: environment });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
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

/** A PNG file with the RGB channels of its pixel at (0, 0) inverted. */
function onePixel(file: Buffer): Buffer {
  const png = PNG.sync.read(file);
  for (let channel = 0; channel < 3; channel += 1) png.data[channel] = 255 - (png.data[channel] ?? 0);
  return PNG.sync.write(png, { colorType: 6, inputColorType: 6, bitDepth: 8, deflateLevel: 9, filterType: 4 });
}

describe("visual gate (gates/bin/visual.ts)", () => {
  it(
    "captures the repository's 404 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)",
    async () => {
      const at = await root();
      const ran = await gate(at);
      expect(ran).toEqual({ code: 0, stdout: [`visual: 404 captures match their baselines (docker ${docker}`], stderr: [] });
      expect([...files(join(at, "storybook/.visual")).keys()]).toEqual([]);
    },
    timeout,
  );

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
      expect(ran.stdout.at(-1)).toBe(`visual: 2 findings in 404 story-themes (docker ${docker}`);
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

  it(
    "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)",
    async () => {
      const ran = await gate(await root(), ["--engine", "host"]);
      expect({ code: ran.code, stdout: ran.stdout, lines: ran.stderr.length }).toEqual({ code: 2, stdout: [], lines: 1 });
      expect(ran.stderr[0]).toMatch(/^visual: could not run: not the pinned container: (?:node|pin): /);
    },
    timeout,
  );

  it(
    "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)",
    async () => {
      const at = await root();
      expect(await gate(at, ["--engine", "ocelle-no-such-engine"])).toEqual({ code: 2, stdout: [], stderr: ["visual: could not run: no container engine: ocelle-no-such-engine not found"] });
      expect(await gate(at, ["--engine", "docker"], { CI: "true" })).toEqual({ code: 2, stdout: [], stderr: ["visual: could not run: in CI the visual gate runs under both docker and podman"] });
    },
    timeout,
  );
});

// CI run 43056264356 (PR #24): the CI step runs `pnpm run gate:visual -- --engine both`, and pnpm passes the "--" on
// to the script. The gate and the baseline command run through pnpm take their options after it.
describe("visual gate and baseline command through pnpm run", () => {
  /** `pnpm run <script> -- <args>` in the repository. */
  function pnpmRun(script: string, args: readonly string[]): Promise<{ code: number | null; stdout: string; stderr: string }> {
    return run("pnpm", ["--silent", "run", script, "--", ...args], repo, env());
  }

  it(
    "reads the options after the -- that pnpm run passes on",
    async () => {
      const at = await root();
      const gateRun = await pnpmRun("gate:visual", ["--root", at, "--engine", "ocelle-no-such-engine"]);
      expect({ code: gateRun.code, stdout: gateRun.stdout, cause: gateRun.stderr.split("\n")[0] }).toEqual({
        code: 2,
        stdout: "",
        cause: "visual: could not run: no container engine: ocelle-no-such-engine not found",
      });
      const updateRun = await pnpmRun("visual:update", ["--root", at, "--engine", "ocelle-no-such-engine"]);
      expect({ code: updateRun.code, cause: updateRun.stderr.split("\n")[0] }).toEqual({ code: 2, cause: "baselines: could not run: no container engine: ocelle-no-such-engine not found" });
    },
    timeout,
  );
});

// Plan decision 21 (operator decision 2026-11-11, on CI run 43064614842): the pin check under podman reads the media
// type with skopeo, and a run under podman without skopeo exits 2 before any engine command runs. PATH holds only a
// stub podman that leaves a marker file when it is run.
describe("visual gate: skopeo for podman (plan decision 21)", () => {
  it(
    "exits 2 naming skopeo when PATH holds podman but no skopeo, and runs no podman command",
    async () => {
      const bin = tempDir("bin");
      const marker = join(tempDir("marker"), "podman-ran");
      writeFileSync(join(bin, "podman"), `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o755 });
      const ran = await runGate("gates/bin/visual.ts", ["--root", await root(), "--engine", "podman"], { cwd: tempDir("cwd"), env: { ...env(), PATH: bin } });
      expect({ ran, marker: existsSync(marker) }).toEqual({
        ran: { code: 2, stdout: [], stderr: ["visual: could not run: the pin check under podman needs skopeo: skopeo not found"] },
        marker: false,
      });
    },
    timeout,
  );
});

// Plan decision 25 (operator decision 2026-11-11, "Apply now"; contracts/gates.md § `visual`): `--remove-docker-image`
// needs docker for run 1 and podman for run 2, and is refused before any engine command. PATH holds only a stub docker
// that leaves a marker file when it is run.
describe("visual gate: --remove-docker-image (plan decision 25)", () => {
  it(
    "exits 2 naming both engines when --remove-docker-image comes with docker alone, and runs no docker command",
    async () => {
      const bin = tempDir("bin");
      const marker = join(tempDir("marker"), "docker-ran");
      writeFileSync(join(bin, "docker"), `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o755 });
      const ran = await runGate("gates/bin/visual.ts", ["--root", await root(), "--engine", "docker", "--remove-docker-image"], { cwd: tempDir("cwd"), env: { ...env(), PATH: bin } });
      expect({ ran, marker: existsSync(marker) }).toEqual({
        ran: { code: 2, stdout: [], stderr: ["visual: could not run: --remove-docker-image needs both engines (docker for run 1, podman for run 2)"] },
        marker: false,
      });
    },
    timeout,
  );
});

describe("baseline command (gates/bin/baselines.ts)", () => {
  it(
    "writes nothing on an unchanged tree and says so (FR-008, analysis G1)",
    async () => {
      const at = await root();
      const before = files(join(at, "storybook/baselines"));
      expect(before.size).toBe(404);
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

