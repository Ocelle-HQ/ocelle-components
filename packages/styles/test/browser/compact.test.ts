import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { monospaceFamilies } from "../../../../gates/bin/prefix.ts";
import { close, computed, scales, suite, tabTo, themes } from "./pages.ts";
import type { Theme } from "./pages.ts";
import { violations } from "./serve.ts";

// The compact scale in Chromium (003 spec User Story 2 scenarios 1 to 3, scenario 4 without its h1 half, and the
// nested `regular` value of FR-004; FR-005, FR-012, FR-013; research.md R-02, R-04, R-09, R-10; data-model.md §
// Compact scale). compact.html holds nested compact and regular regions, a region with the undocumented density value
// "true" and the value hook in both variants and with the undocumented value "true"; compact-root.html carries the
// compact hook on <html>. Both are served under the strict CSP by serve.ts, which links a plant stylesheet after
// base.css on request (`after=plants/<name>`). Every scenario runs in both themes, under emulateMedia({ colorScheme })
// light and dark (FR-022). Each guard (a "does not") shares its test with the positive assertion it guards and runs
// once more with its plant, where its helper must report the problem (SC-002, R-10). Scenario 5 and the h1 half of
// scenario 4 need the prose rules and are phase 4's (tasks T035). Expected values are transcribed by hand from the
// spec and 002's Appendix A, never read from the token source or base.css.

/** `--ocelle-font-size-sm` (0.875rem) with `--ocelle-line-height-compact` (1.5) at the default 16px root. */
const compactScale = { fontSize: "14px", lineHeight: "21px" };
/** `--ocelle-font-size-md` (1rem) with `--ocelle-line-height-normal` (1.45). */
const regularScale = { fontSize: "16px", lineHeight: "23.2px" };
/** `--ocelle-color-ink` and `--ocelle-color-ink-muted` (Appendix A), as Chromium reports computed colours. */
const inks: Readonly<Record<Theme, { readonly ink: string; readonly muted: string; readonly focus: string }>> = {
  light: { ink: "rgb(21, 19, 15)", muted: "rgb(94, 88, 79)", focus: "rgb(143, 94, 15)" },
  dark: { ink: "rgb(237, 233, 225)", muted: "rgb(163, 157, 146)", focus: "rgb(224, 162, 58)" },
};
const sans = '"Schibsted Grotesk"';

const { open } = suite();

/** The ids among `ids` whose font size and line height are not `expected`, each with what it has. */
async function scaleProblems(page: Page, ids: readonly string[], expected: { readonly fontSize: string; readonly lineHeight: string }): Promise<string[]> {
  const found = await scales(page, ids);
  return Object.entries(found)
    .filter(([, scale]) => scale.fontSize !== expected.fontSize || scale.lineHeight !== expected.lineHeight)
    .map(([id, scale]) => `${id}: ${scale.fontSize} / ${scale.lineHeight}`);
}

/** FR-005: the region with data-ocelle-density="true", and its paragraph, keep the regular scale. */
function undocumentedDensityProblems(page: Page): Promise<string[]> {
  return scaleProblems(page, ["density-true", "density-true-p"], regularScale);
}

describe("US2-1: the compact hook sets 14 px / 1.5 on the element, and its descendants inherit both (FR-012)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s, and data-ocelle-density=\"true\" sets no compact scale (FR-005)", async (theme) => {
    const page = await open("compact.html", { colorScheme: theme });
    const compact = await scales(page, ["compact", "compact-p", "compact-span"]);
    const undocumented = await undocumentedDensityProblems(page);
    const reported = await violations(page);
    await close(page);
    const planted = await open("compact.html?after=plants/density-presence", { colorScheme: theme });
    const plantedUndocumented = await undocumentedDensityProblems(planted);
    await close(planted);
    expect(compact).toEqual({ compact: compactScale, "compact-p": compactScale, "compact-span": compactScale });
    expect(undocumented).toEqual([]);
    expect(reported).toEqual([]);
    expect(plantedUndocumented).toEqual(["density-true: 14px / 21px", "density-true-p: 14px / 21px"]);
  });
});

/** US2-2: what lies outside every region keeps the regular scale. */
function outsideProblems(page: Page): Promise<string[]> {
  return scaleProblems(page, ["body", "main", "outside", "outside-span", "values"], regularScale);
}

describe("US2-2: only the compact region and its descendants use the compact scale (FR-012)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("compact.html", { colorScheme: theme });
    const region = await scaleProblems(page, ["compact", "compact-p", "compact-span"], compactScale);
    const outside = await outsideProblems(page);
    await close(page);
    const planted = await open("compact.html?after=plants/compact-body", { colorScheme: theme });
    const plantedOutside = await outsideProblems(planted);
    await close(planted);
    expect(region).toEqual([]);
    expect(outside).toEqual([]);
    expect(plantedOutside).toEqual(["body: 14px / 20.3px", "main: 14px / 20.3px", "outside: 14px / 20.3px", "outside-span: 14px / 20.3px", "values: 14px / 20.3px"]);
  });
});

interface ValueReading {
  readonly family: boolean;
  readonly monospace: boolean;
  readonly figures: string;
  readonly color: string;
  readonly fontSize: string;
}

/** The value style of each element with one of `ids`: family start, any monospace family, figures, colour and size. */
function valueReadings(page: Page, ids: readonly string[]): Promise<Record<string, ValueReading>> {
  return page.evaluate(
    ({ ids, family, monospace }) =>
      Object.fromEntries(
        ids.map((id) => {
          const element = document.getElementById(id);
          if (element === null) throw new Error(`no #${id}`);
          const style = getComputedStyle(element);
          const families = style.fontFamily.split(",").map((part) => part.trim().replace(/^["']|["']$/g, "").toLowerCase());
          return [
            id,
            {
              family: style.fontFamily.startsWith(family),
              monospace: families.some((each) => each === "monospace" || monospace.includes(each)),
              figures: style.fontVariantNumeric,
              color: style.color,
              fontSize: style.fontSize,
            },
          ];
        }),
      ),
    { ids, family: sans, monospace: monospaceFamilies.map((each) => each.toLowerCase()) },
  );
}

/** US2-3, FR-005: the element with data-ocelle-value="true" gets none of the value style; it reads as its parent. */
async function undocumentedValueProblems(page: Page): Promise<string[]> {
  const found = await page.evaluate(() => {
    const element = document.getElementById("value-true");
    const parent = element?.parentElement;
    if (element === null || parent === null || parent === undefined) throw new Error("no #value-true in a parent");
    const own = getComputedStyle(element);
    const inherited = getComputedStyle(parent);
    return {
      size: own.fontSize === inherited.fontSize,
      figures: own.fontVariantNumeric === inherited.fontVariantNumeric,
      colour: own.color === inherited.color,
    };
  });
  return (["size", "figures", "colour"] as const).filter((key) => !found[key]).map((key) => `value-true: ${key}`);
}

describe("US2-3: the value hook sets the value text style, and data-ocelle-value=\"true\" sets none of it (FR-013, FR-005)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s, inside and outside a compact region, in both variants", async (theme) => {
    const page = await open("compact.html", { colorScheme: theme });
    const values = await valueReadings(page, ["value", "value-ink", "compact-value", "compact-value-ink"]);
    const parent = await computed(page, "values", ["font-size", "font-variant-numeric", "color"]);
    const undocumented = await undocumentedValueProblems(page);
    await close(page);
    const planted = await open("compact.html?after=plants/value-presence", { colorScheme: theme });
    const plantedUndocumented = await undocumentedValueProblems(planted);
    await close(planted);
    const style = (color: string): ValueReading => ({ family: true, monospace: false, figures: "tabular-nums", color, fontSize: "14px" });
    expect(values).toEqual({
      value: style(inks[theme].muted),
      "value-ink": style(inks[theme].ink),
      "compact-value": style(inks[theme].muted),
      "compact-value-ink": style(inks[theme].ink),
    });
    expect(parent).toEqual({ "font-size": "16px", "font-variant-numeric": "normal", color: inks[theme].ink });
    expect(undocumented).toEqual([]);
    expect(plantedUndocumented).toEqual(["value-true: colour"]);
  });
});

/** US2-4: with the hook on <html>, the root's font size and --ocelle-target-min keep their regular values. */
async function rootProblems(page: Page): Promise<string[]> {
  const found = await page.evaluate(() => ({
    root: getComputedStyle(document.documentElement).fontSize,
    target: document.getElementById("target-min")?.getBoundingClientRect().width ?? 0,
  }));
  const problems: string[] = [];
  if (found.root !== "16px") problems.push(`root font size: ${found.root}`);
  if (Math.abs(found.target - 44) > 1 / 64) problems.push(`target-min: ${String(found.target)}px`);
  return problems;
}

/** US2-4: the keyboard focus ring under the compact root is User Story 1's token ring. */
async function ringProblems(page: Page, theme: Theme): Promise<string[]> {
  await tabTo(page, "button");
  const ring = await computed(page, "button", ["outline-style", "outline-width", "outline-color", "outline-offset"]);
  const expected: Record<string, string> = { "outline-style": "solid", "outline-width": "3px", "outline-color": inks[theme].focus, "outline-offset": "2px" };
  return Object.keys(expected).filter((property) => ring[property] !== expected[property]).map((property) => `button: ${property} ${ring[property] ?? ""}`);
}

describe("US2-4: the compact hook on <html> makes the body compact and keeps the root size, the rem tokens and the ring (FR-012, R-04)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("compact-root.html", { colorScheme: theme });
    const hooked = await page.evaluate(() => document.documentElement.getAttribute("data-ocelle-density"));
    const body = await scaleProblems(page, ["body", "main", "text", "span"], compactScale);
    const root = await rootProblems(page);
    const ring = await ringProblems(page, theme);
    const reported = await violations(page);
    await close(page);
    const resized = await open("compact-root.html?after=plants/compact-root-size", { colorScheme: theme });
    const plantedRoot = await rootProblems(resized);
    await close(resized);
    const thinned = await open("compact-root.html?after=plants/compact-ring", { colorScheme: theme });
    const plantedRing = await ringProblems(thinned, theme);
    await close(thinned);
    expect(hooked).toBe("compact");
    expect(body).toEqual([]);
    expect(root).toEqual([]);
    expect(ring).toEqual([]);
    expect(reported).toEqual([]);
    expect(plantedRoot).toEqual(["root font size: 14px", "target-min: 38.5px"]);
    expect(plantedRing).toEqual(["button: outline-width 1px"]);
  });
});

describe("FR-004: data-ocelle-density=\"regular\" returns a region nested in a compact one to the regular scale (R-02)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("compact.html", { colorScheme: theme });
    const found = await scales(page, ["compact-p", "regular", "regular-p", "regular-span"]);
    await close(page);
    expect(found).toEqual({ "compact-p": compactScale, regular: regularScale, "regular-p": regularScale, "regular-span": regularScale });
  });
});
