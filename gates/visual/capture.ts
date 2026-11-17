// The capture of the visual gate, run inside the pinned container (FR-006, FR-009, FR-012, FR-026 to FR-028, FR-030,
// FR-031; contracts/container.md § Capture request and result, § The capture's checks before any page, § Per
// story-theme): `node <repo>/gates/visual/capture.ts <request.json>`. It refuses outside the pinned container (exit 2,
// one stderr line), launches the pinned headless shell, serves the request's dist/ on 127.0.0.1, and for each
// story-theme opens a fresh context with contextOptions(theme), waits for the render, collects the conditions, takes
// the full-page screenshot at scroll (0, 0), normalises it and writes it; then result.json, one entry per story-theme
// in request order, and exit 0. It is wiring only: every decision is in gates/lib/ (capture-plan.ts, story-checks.ts,
// png.ts), and each line is a process boundary covered by gates/test/integration/visual.test.ts and the visual plants.
import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import { captureStatus, contextOptions, refusal, screenshotOptions } from "../lib/capture-plan.ts";
import type { Conditions } from "../lib/capture-plan.ts";
import { parsePin } from "../lib/container.ts";
import { normalise } from "../lib/png.ts";
import { conditionsAfterRender, openStory, scrollBack, waitForRender } from "../lib/story-page.ts";
import { serve } from "../lib/storybook-serve.ts";
import { baselineName, storyThemes } from "../lib/visual-verdict.ts";
import type { CaptureEntry, CaptureRequest, StoryTheme } from "../lib/visual-verdict.ts";

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/** The request.json the host writes: the build, the output directory and the story-themes. */
interface Request extends CaptureRequest {
  readonly dist: string;
  readonly out: string;
}

/** The revision of Playwright's chromium-headless-shell build, from the repository's playwright-core/browsers.json. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
function headlessShell(): string {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const fromPlaywright = createRequire(createRequire(join(repo, "package.json")).resolve("playwright/package.json"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const browsers = JSON.parse(readFileSync(join(dirname(fromPlaywright.resolve("playwright-core/package.json")), "browsers.json"), "utf8")) as { browsers: { name: string; revision: string }[] };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const revision = browsers.browsers.find((browser) => browser.name === "chromium-headless-shell")?.revision ?? "";
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH ?? join(homedir(), ".cache", "ms-playwright");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  return join(browsersPath, `chromium_headless_shell-${revision}`, "chrome-headless-shell-linux64", "chrome-headless-shell");
}

/** One story-theme in a fresh context: its result entry, and the PNG written when captured. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
async function captureOne(browser: Browser, origin: string, request: Request, at: StoryTheme): Promise<CaptureEntry> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const context = await browser.newContext(contextOptions(at.theme));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const work = async (): Promise<CaptureEntry> => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const { page, requests } = await openStory(context, origin, request.dist, at.story, at.theme);
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
    const ready = await waitForRender(page);
    // Stryker disable next-line all: process boundary, covered by the visual plants fail-throws-on-load and fail-render-throws
    const conditions: Conditions = ready.ready ? await conditionsAfterRender(page, context, at.theme, requests) : ready.status === "render-failed" ? { renderFailed: ready.message } : { renderTimeout: ready.message };
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const status = captureStatus(conditions);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    if (status.status !== "captured") return { ...at, ...status };
    // Stryker disable next-line all: process boundary, covered by the visual plant pass-focus-below-fold
    await scrollBack(page);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const file = baselineName(at.story, at.theme);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    await writeFile(join(request.out, file), normalise(await page.screenshot(screenshotOptions())));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    return { ...at, status: "captured", file };
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return work().finally(() => context.close());
}

/** The capture's process: exit 0 with result.json written, 2 with one stderr line naming the cause. */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
async function capture(requestPath: string): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const pin = parsePin(readFileSync(join(repo, "storybook/visual/container.json"), "utf8"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const executable = headlessShell();
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const refused = refusal({ platform: process.platform, arch: process.arch, version: process.version, env: process.env, exists: existsSync, executable }, pin);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  if (refused !== undefined) {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
    process.stderr.write(`${refused}\n`);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
    return 2;
  }
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const request = JSON.parse(readFileSync(requestPath, "utf8")) as Request;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await mkdir(request.out, { recursive: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const browser = await chromium.launch({ executablePath: executable });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const server = await serve(request.dist);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const work = async (): Promise<void> => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    const entries: CaptureEntry[] = [];
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    for (const at of storyThemes(request)) entries.push(await captureOne(browser, server.origin, request, at));
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    await writeFile(join(request.out, "result.json"), `${JSON.stringify(entries, null, 2)}\n`);
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  await work().finally(() => Promise.all([browser.close(), server.close()]));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return 0;
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
if (import.meta.main) {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  process.exitCode = await capture(String(process.argv[2])).catch((error: unknown) => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    process.stderr.write(`the capture could not run: ${(error instanceof Error ? error.message : String(error)).replace(/\s*\n\s*/g, " ")}\n`);
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 88 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    return 2;
  });
}
