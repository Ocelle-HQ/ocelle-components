import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { expectedTokens, themeConditions } from "../expected.ts";
import type { ExpectedToken, Probe } from "../expected.ts";
import { launch, serve } from "./serve.ts";
import type { Served } from "./serve.ts";

// Non-colour tokens as used values in Chromium (research.md R-03; US1 scenarios 2, 6 and 7; FR-007; Assumptions
// "Dialog size unit"): each token is applied to a probe element through the property of its probe in expected.ts
// (width for sizes, box-shadow for elevations, transition-duration for motion, ...) and the probe's computed value is
// compared with the used value transcribed from Appendix A, at a 1280 × 800 viewport, a 16px root font size and a
// 1000px wide containing block that is also a query container (`container-type: inline-size`, 003 research.md R-08),
// so `--ocelle-measure-container` (100cqi) resolves against its 1000px and not the viewport: the dialog sizes are
// 1248px and 768px. Theme-dependent tokens per theme, the
// theme-independent ones equal in all six conditions; motion is 0ms under reduced motion, easing unchanged.
type Theme = "light" | "dark";

const probed = expectedTokens.filter((token): token is ExpectedToken & { compare: Probe } => typeof token.compare === "object");
let browser: Browser | undefined;
let served: Served | undefined;

beforeAll(async () => {
  served = await serve();
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

/** The used value a probe should report in a theme. */
function usedIn(probe: Probe, theme: Theme): number | string {
  return typeof probe.used === "object" ? probe.used[theme] : probe.used;
}

/** Each probed token's used value; a pixel length within 1/64 px (the layout unit) of the expected one counts as it. */
async function read(page: Page, theme: Theme): Promise<Record<string, number | string>> {
  const raw = await page.evaluate((probes) => {
    const block = document.createElement("div");
    block.style.position = "relative";
    block.style.width = "1000px";
    block.style.fontSize = "16px";
    block.style.containerType = "inline-size";
    document.body.append(block);
    const values: Record<string, string> = {};
    for (const { name, property } of probes) {
      const probe = document.createElement("div");
      probe.style.position = "absolute";
      probe.style.setProperty(property, `var(--ocelle-${name})`);
      block.append(probe);
      values[name] = getComputedStyle(probe).getPropertyValue(property);
    }
    block.remove();
    return values;
  }, probed.map((token) => ({ name: token.name, property: token.compare.property })));
  const values: Record<string, number | string> = {};
  for (const token of probed) {
    const actual = raw[token.name] ?? "";
    const wanted = usedIn(token.compare, theme);
    const pixels = /^(-?[\d.]+)px$/.exec(actual);
    values[token.name] = typeof wanted === "number" && pixels !== null && Math.abs(Number(pixels[1]) - wanted) < 1 / 64 ? wanted : actual;
  }
  return values;
}

function expected(theme: Theme, overrides: Record<string, string> = {}): Record<string, number | string> {
  return { ...Object.fromEntries(probed.map((token) => [token.name, usedIn(token.compare, theme)])), ...overrides };
}

async function open(colorScheme: "light" | "dark" | "no-preference", dataTheme?: string, reducedMotion: "reduce" | "no-preference" = "no-preference"): Promise<Page> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.emulateMedia({ colorScheme, reducedMotion });
  await page.goto(`${served.origin}/index.html`);
  if (dataTheme !== undefined) {
    await page.evaluate((value) => {
      document.documentElement.setAttribute("data-theme", value);
    }, dataTheme);
  }
  return page;
}

describe("used values under the six theme conditions", { timeout: 60_000 }, () => {
  it.each(themeConditions)("$id: every non-colour token has its $theme used value", async (condition) => {
    const page = await open(condition.colorScheme, condition.dataTheme);
    const values = await read(page, condition.theme);
    await page.close();
    expect(values).toEqual(expected(condition.theme));
  });

  it("the theme-independent tokens are the same in all six conditions (US1 scenario 6)", async () => {
    const independent = probed.filter((token) => token.group !== "elevation").map((token) => token.name);
    const readings: Record<string, number | string>[] = [];
    for (const condition of themeConditions) {
      const page = await open(condition.colorScheme, condition.dataTheme);
      const values = await read(page, condition.theme);
      await page.close();
      readings.push(Object.fromEntries(independent.map((name) => [name, values[name] ?? ""])));
    }
    const light = expected("light");
    const once = Object.fromEntries(independent.map((name) => [name, light[name] ?? ""]));
    expect(readings).toEqual(themeConditions.map(() => once));
  });

  // 012 (research.md R-12; tasks.md T052): the row's inside focus ring offset, -(focus-offset + focus-width).
  it("focus-offset-inset is -5px, the negative of focus-offset (2px) plus focus-width (3px)", async () => {
    const page = await open("light");
    const values = await read(page, "light");
    await page.close();
    expect([values["focus-offset-inset"], values["focus-offset"], values["focus-width"]]).toEqual([-5, 2, 3]);
  });

  it("the dialog sizes are 1248px and 768px at 1280 × 800, the target size 44px", async () => {
    const page = await open("light");
    const values = await read(page, "light");
    await page.close();
    expect([values["dialog-max-inline"], values["dialog-max-block"], values["target-min"]]).toEqual([1248, 768, 44]);
  });

  // 008 (tasks.md T045): the tooltip bubble's maximum inline size is 18rem, 288px at the 16px root.
  it("the tooltip's maximum inline size, --ocelle-tooltip-max-inline, is 288px (18rem) at 1280 × 800", async () => {
    const page = await open("light");
    const values = await read(page, "light");
    await page.close();
    expect(values["tooltip-max-inline"]).toBe(288);
  });

  // 008 (tasks.md T033): the drawer's inline size is the sidebar's, 20rem, at the 16px root.
  it("the drawer's inline size, --ocelle-drawer-inline, is 320px (20rem) at 1280 × 800", async () => {
    const page = await open("light");
    const values = await read(page, "light");
    await page.close();
    expect(values["drawer-inline"]).toBe(320);
  });
});

describe("reduced motion (FR-007, US1 scenario 7)", { timeout: 60_000 }, () => {
  // 012 (research.md R-07; tasks.md T042): every motion duration, motion-spin with them, is 0ms under reduced motion;
  // motion-turn, an angle, and the easing are unchanged. A stricter replacement of "motion-fast and motion-base".
  // 018 (research.md R-10; tasks.md T015): motion-pulse joins them, a stricter replacement of the three names.
  it.each(["light", "dark"] as const)("motion-fast, motion-base, motion-spin and motion-pulse are 0ms under prefers-reduced-motion: reduce in %s, motion-turn and easing unchanged", async (theme) => {
    const page = await open(theme, undefined, "reduce");
    const values = await read(page, theme);
    await page.close();
    expect(values).toEqual(expected(theme, { "motion-fast": "0s", "motion-base": "0s", "motion-spin": "0s", "motion-pulse": "0s" }));
    expect([values["easing-standard"], values["motion-turn"]]).toEqual(["cubic-bezier(0.22, 1, 0.36, 1)", "360deg"]);
  });

  // 008 (tasks.md T045; research.md R-09, brand rule (f)): the reduced-motion block sets only motion-fast and
  // motion-base, so the tooltip's hover delay keeps its 500ms.
  it.each(["light", "dark"] as const)("--ocelle-tooltip-delay stays 500ms (0.5s) under prefers-reduced-motion: reduce in %s", async (theme) => {
    const page = await open(theme, undefined, "reduce");
    const values = await read(page, theme);
    await page.close();
    expect({ delay: values["tooltip-delay"], fast: values["motion-fast"], base: values["motion-base"] }).toEqual({ delay: "0.5s", fast: "0s", base: "0s" });
  });

  it("they are 120ms, 200ms, 800ms and 1600ms without that request", async () => {
    const page = await open("light", undefined, "no-preference");
    const values = await read(page, "light");
    await page.close();
    expect([values["motion-fast"], values["motion-base"], values["motion-spin"], values["motion-pulse"]]).toEqual(["0.12s", "0.2s", "0.8s", "1.6s"]);
  });
});
