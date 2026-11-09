import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { excludedNames, expectedTokens, inTheme, themeConditions } from "../expected.ts";
import { launch, serve } from "./serve.ts";
import type { Served } from "./serve.ts";

// Theme selection in Chromium (FR-005, FR-006, research.md R-02, R-03; US1 scenarios 1 to 5, edge cases "Theme
// attribute with another value" and "changed at run time"): the generator's stylesheet, loaded by <link>, under each
// of the six theme conditions (page.emulateMedia; `no-preference` for no preference), the run-time removal of
// data-theme and a run-time switch. The --ocelle-* names on :root are read through CSSOM; each colour token is read
// as the computed background colour of a probe that uses it, parsed as RGBA; color-scheme is read as its trimmed
// computed keyword, never as a colour. Expected values come from expected.ts (Appendix A), not from the source.
type Theme = "light" | "dark";
type Rgba = readonly [number, number, number, number];

const colourTokens = expectedTokens.filter((token) => token.compare === "colour" || token.compare === "keyword");
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

/** An Appendix A colour (`#RRGGBB` or `rgb(r g b / a)`) as RGBA. */
function expectedRgba(text: string): Rgba {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(text);
  if (hex !== null) return [parseInt(String(hex[1]), 16), parseInt(String(hex[2]), 16), parseInt(String(hex[3]), 16), 1];
  const rgb = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(text);
  if (rgb === null) throw new Error(`not an Appendix A colour: ${text}`);
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), Number(rgb[4])];
}

/** A computed colour (`rgb(r, g, b)` or `rgba(r, g, b, a)`) as RGBA; any other text stays as it is. */
function computedRgba(text: string): Rgba | string {
  const match = /^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/.exec(text);
  return match === null ? text : [Number(match[1]), Number(match[2]), Number(match[3]), match[4] === undefined ? 1 : Number(match[4])];
}

/** The colour and keyword tokens of a theme as the browser should report them, and the A.6 names undefined. */
function expected(theme: Theme): Record<string, Rgba | string> {
  const values: Record<string, Rgba | string> = {};
  for (const token of colourTokens) {
    const value = inTheme(token.resolved, theme);
    values[token.name] = token.compare === "keyword" ? value : expectedRgba(value);
  }
  for (const name of excludedNames) values[name] = "";
  return values;
}

interface Reading {
  readonly names: readonly string[];
  readonly values: Record<string, Rgba | string>;
}

/** The --ocelle-* names declared on :root (CSSOM, nested rules included) and the values the page computes. */
async function read(page: Page): Promise<Reading> {
  const raw = await page.evaluate(
    ({ colours, keywords, excluded }) => {
      const names = new Set<string>();
      const walk = (rules: CSSRuleList): void => {
        for (const rule of Array.from(rules)) {
          if (rule instanceof CSSStyleRule && rule.selectorText.startsWith(":root")) {
            for (const property of Array.from(rule.style)) if (property.startsWith("--ocelle-")) names.add(property);
          }
          if (rule instanceof CSSGroupingRule) walk(rule.cssRules);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) walk(sheet.cssRules);
      const root = getComputedStyle(document.documentElement);
      const values: Record<string, string> = {};
      const probe = document.createElement("div");
      document.body.append(probe);
      for (const name of colours) {
        probe.style.backgroundColor = `var(--ocelle-${name})`;
        values[name] = getComputedStyle(probe).backgroundColor;
      }
      probe.remove();
      for (const name of [...keywords, ...excluded]) values[name] = root.getPropertyValue(`--ocelle-${name}`).trim();
      return { names: [...names].sort(), values };
    },
    {
      colours: colourTokens.filter((token) => token.compare === "colour").map((token) => token.name),
      keywords: colourTokens.filter((token) => token.compare === "keyword").map((token) => token.name),
      excluded: [...excludedNames],
    },
  );
  const values: Record<string, Rgba | string> = {};
  for (const [name, value] of Object.entries(raw.values)) values[name] = colourTokens.some((token) => token.name === name && token.compare === "colour") ? computedRgba(value) : value;
  return { names: raw.names, values };
}

async function open(colorScheme: "light" | "dark" | "no-preference", dataTheme?: string): Promise<Page> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.emulateMedia({ colorScheme });
  await page.goto(`${served.origin}/index.html`);
  if (dataTheme !== undefined) await setTheme(page, dataTheme);
  return page;
}

async function setTheme(page: Page, value: string | null, element: "html" | "body" = "html"): Promise<void> {
  await page.evaluate(
    ({ value, element }) => {
      const target = element === "html" ? document.documentElement : document.body;
      if (value === null) target.removeAttribute("data-theme");
      else target.setAttribute("data-theme", value);
    },
    { value, element },
  );
}

const tableNames = expectedTokens.map((token) => `--ocelle-${token.name}`).sort();

describe("the six theme conditions (FR-006)", { timeout: 60_000 }, () => {
  it.each(themeConditions)("$id: :root defines exactly the table's names, and every colour has its $theme value", async (condition) => {
    const page = await open(condition.colorScheme, condition.dataTheme);
    const reading = await read(page);
    await page.close();
    expect(reading.names).toEqual(tableNames);
    expect(reading.values).toEqual(expected(condition.theme));
  });
});

describe("data-theme at run time (edge case: theme attribute changed at run time)", { timeout: 60_000 }, () => {
  it("follows the system again when data-theme is removed (US1 scenario 5)", async () => {
    const page = await open("dark", "light");
    const before = await read(page);
    await setTheme(page, null);
    const after = await read(page);
    await page.close();
    expect([before.values, after.values]).toEqual([expected("light"), expected("dark")]);
  });

  it("follows the system light after data-theme=dark is removed", async () => {
    const page = await open("light", "dark");
    const before = await read(page);
    await setTheme(page, null);
    const after = await read(page);
    await page.close();
    expect([before.values, after.values]).toEqual([expected("dark"), expected("light")]);
  });

  it("follows a switch from light to dark and back to light without reload", async () => {
    const page = await open("light", "light");
    const readings = [(await read(page)).values];
    await setTheme(page, "dark");
    readings.push((await read(page)).values);
    await setTheme(page, "light");
    readings.push((await read(page)).values);
    await page.close();
    expect(readings).toEqual([expected("light"), expected("dark"), expected("light")]);
  });
});

describe("a data-theme the rule ignores follows the system (edge case: theme attribute with another value)", { timeout: 60_000 }, () => {
  const cases = [
    { id: 'data-theme="sepia" on <html>', value: "sepia", element: "html" },
    { id: 'data-theme="" on <html>', value: "", element: "html" },
    { id: 'data-theme="dark" on <body>', value: "dark", element: "body" },
  ] as const;

  it.each(cases)("$id, under system dark and system light", async ({ value, element }) => {
    const readings: Record<string, Rgba | string>[] = [];
    for (const colorScheme of ["dark", "light"] as const) {
      const page = await open(colorScheme);
      await setTheme(page, value, element);
      readings.push((await read(page)).values);
      await page.close();
    }
    expect(readings).toEqual([expected("dark"), expected("light")]);
  });
});
