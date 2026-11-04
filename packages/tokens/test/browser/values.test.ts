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
// 1000px wide containing block: the dialog sizes are 1248px and 768px. Theme-dependent tokens per theme, the
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

  it("the dialog sizes are 1248px and 768px at 1280 × 800, the target size 44px", async () => {
    const page = await open("light");
    const values = await read(page, "light");
    await page.close();
    expect([values["dialog-max-inline"], values["dialog-max-block"], values["target-min"]]).toEqual([1248, 768, 44]);
  });
});

describe("reduced motion (FR-007, US1 scenario 7)", { timeout: 60_000 }, () => {
  it.each(["light", "dark"] as const)("motion-fast and motion-base are 0ms under prefers-reduced-motion: reduce in %s, easing unchanged", async (theme) => {
    const page = await open(theme, undefined, "reduce");
    const values = await read(page, theme);
    await page.close();
    expect(values).toEqual(expected(theme, { "motion-fast": "0s", "motion-base": "0s" }));
    expect(values["easing-standard"]).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
  });

  it("they are 120ms and 200ms without that request", async () => {
    const page = await open("light", undefined, "no-preference");
    const values = await read(page, "light");
    await page.close();
    expect([values["motion-fast"], values["motion-base"]]).toEqual(["0.12s", "0.2s"]);
  });
});
