import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { close, computed, suite, themes } from "./pages.ts";
import type { Theme } from "./pages.ts";
import { violations } from "./serve.ts";

// base.css for `ocelle-data-table` (019 FR-005 to FR-007, FR-012, FR-013, FR-017, FR-019, FR-060, FR-061;
// contracts/styles-data-table.md; research.md R-06, R-07, R-18 to R-20; tasks.md T011), in Chromium under the strict
// CSP. data-table.html holds the markup with `ocelle-data-table` undefined; data-table-defined.html the same markup with
// a stand-in definition that has no shadow root (define-data-table.js), so block 1 is read on an undefined and a defined
// element. The markup: a striped, sticky, wrap="anywhere" data table with a corner header (scope="row" in <thead>), row
// headers, a hidden second row (counted by the stripe), two <tbody> groups and a <tfoot>; a data table holding a nested
// table; inside a prose container a sticky data table, a plain data table and a plain prose table, each with
// data-ocelle-align cells. Every value is compared with the token's value on the same page (a probe set through the
// CSSOM), never a literal but for keywords; expected values are written by hand from the contract.
const { open } = suite();

const pages = ["data-table.html", "data-table-defined.html"] as const;

/**
 * For each `[id, property, token]`, the token's name when the element's computed value equals what the probe computes
 * for `var(--ocelle-<token>)` (a value starting with `=` is a keyword compared as written), else both values.
 */
function tokens(page: Page, checks: readonly (readonly [string, string, string])[]): Promise<string[]> {
  return page.evaluate((checks) => {
    const probe = document.getElementById("probe");
    if (probe === null) throw new Error("no #probe");
    return checks.map(([id, property, token]) => {
      const element = document.getElementById(id);
      if (element === null) return `no #${id}`;
      const actual = getComputedStyle(element).getPropertyValue(property);
      if (token.startsWith("=")) return actual === token.slice(1) ? token : `${actual}, not ${token}`;
      probe.style.setProperty("font-size", getComputedStyle(element).fontSize);
      // A border width computes to 0 without a border style, so the probe takes a solid one for it.
      const side = /^border-(\w+)-width$/.exec(property)?.[1];
      if (side !== undefined) probe.style.setProperty(`border-${side}-style`, "solid");
      probe.style.setProperty(property, `var(--ocelle-${token})`);
      const expected = getComputedStyle(probe).getPropertyValue(property);
      probe.style.removeProperty(property);
      if (side !== undefined) probe.style.removeProperty(`border-${side}-style`);
      return actual === expected ? token : `${actual}, not ${token} (${expected})`;
    });
  }, checks);
}

/** `[id, property, expected]` checks as the list of their expected tokens, for the expected side. */
const want = (checks: readonly (readonly [string, string, string])[]): string[] => checks.map(([, , token]) => token);

const block1: readonly (readonly [string, string, string])[] = [
  ["t", "font-family", "font-sans"],
  ["t", "font-variant-numeric", "=tabular-nums"],
  ["t", "margin-top", "=0px"],
  ["cap", "font-size", "font-size-sm"],
  ["cap", "font-weight", "font-weight-medium"],
  ["cap", "line-height", "line-height-normal"],
  ["cap", "color", "color-ink"],
  ["cap", "padding-bottom", "space-2"],
  ["cap", "position", "=static"],
  ["c1", "padding-top", "space-1"],
  ["c1", "padding-left", "space-2"],
  ["c1", "font-size", "font-size-sm"],
  ["c1", "line-height", "line-height-compact"],
  ["c1", "color", "color-ink-soft"],
  ["c1", "text-align", "=start"],
  ["c1", "vertical-align", "=top"],
  ["c1", "border-bottom-width", "border-width"],
  ["c1", "border-bottom-color", "color-rule"],
  ["h1", "font-size", "font-size-eyebrow"],
  ["h1", "font-weight", "font-weight-eyebrow"],
  ["h1", "text-transform", "=uppercase"],
  ["h1", "letter-spacing", "tracking-eyebrow"],
  ["h1", "color", "color-eyebrow"],
  ["h1", "border-bottom-color", "color-rule-strong"],
  ["corner", "font-weight", "font-weight-medium"],
  ["corner", "text-transform", "=none"],
  ["corner", "color", "color-ink"],
  ["rh1", "font-size", "font-size-sm"],
  ["rh1", "font-weight", "font-weight-medium"],
  ["rh1", "color", "color-ink"],
  ["g2", "border-bottom-style", "=solid"],
  ["f1", "border-bottom-style", "=none"],
  ["c1", "overflow-wrap", "=anywhere"],
  ["h1", "overflow-wrap", "=normal"],
  ["rh1", "overflow-wrap", "=normal"],
  ["p2", "padding-top", "space-1"],
  ["nested", "padding-top", "=1px"],
  ["nested", "border-bottom-style", "=none"],
];

const inventory: readonly (readonly [string, string, string])[] = [
  ["t", "border-collapse", "=separate"],
  ["t", "border-spacing", "=0px"],
  ["head", "position", "=sticky"],
  ["head", "top", "=-5px"],
  ["h1", "background-color", "color-sheet"],
  ["corner", "background-color", "color-sheet"],
  ["rh1", "background-color", "=rgba(0, 0, 0, 0)"],
  ["c3", "background-color", "=rgba(0, 0, 0, 0)"],
  ["c4", "background-color", "color-inset"],
  ["rh4", "background-color", "color-inset"],
  ["g1", "background-color", "=rgba(0, 0, 0, 0)"],
  ["g2", "background-color", "color-inset"],
  ["f1", "background-color", "=rgba(0, 0, 0, 0)"],
  ["pt0", "border-collapse", "=collapse"],
];

const prose: readonly (readonly [string, string, string])[] = [
  ["pt", "border-collapse", "=separate"],
  ["pt2", "border-collapse", "=collapse"],
  ["pt2", "display", "=table"],
  ["pt2", "overflow-x", "=visible"],
  ["pt2", "margin-top", "=0px"],
  ["pcap", "position", "=static"],
  ["pcap", "font-size", "font-size-sm"],
  ["pq", "padding-top", "space-1"],
  ["pq", "padding-left", "space-2"],
  ["pq", "border-bottom-style", "=none"],
  ["pc", "border-bottom-width", "border-width"],
  ["ph", "font-size", "font-size-eyebrow"],
  ["ph", "font-weight", "font-weight-eyebrow"],
  ["ph", "border-bottom-color", "color-rule-strong"],
];

const align: readonly (readonly [string, string, string])[] = [
  ["n1", "text-align", "=end"],
  ["n1", "font-variant-numeric", "=tabular-nums"],
  ["h2", "text-align", "=end"],
  ["h2", "text-transform", "=uppercase"],
  ["h2", "font-size", "font-size-eyebrow"],
  ["n3", "text-align", "=start"],
  ["n4", "text-align", "=start"],
  ["c1", "text-align", "=start"],
  ["pnum", "text-align", "=end"],
  ["pn", "text-align", "=end"],
  ["pc", "text-align", "=start"],
  ["pln", "text-align", "=end"],
  ["pln", "font-variant-numeric", "=tabular-nums"],
  ["plc", "text-align", "=start"],
];

describe("block 1 on an undefined and a defined ocelle-data-table, and block 2 inside prose (R-06)", { timeout: 60_000 }, () => {
  for (const path of pages) {
    it.each(themes)(`${path} in %s: compact cells, eyebrow column headers, row headers after them, the last-row rule, wrap on body cells only, the nested table unstyled`, async (theme: Theme) => {
      const page = await open(path, { colorScheme: theme });
      const observed = { block1: await tokens(page, block1), violations: await violations(page) };
      await close(page);
      expect(observed).toEqual({ block1: want(block1), violations: [] });
    });
  }

  it.each(themes)("in %s, inside [data-ocelle-prose=\"\"]: block 2 restates block 1 over the prose rules, the sticky table separated", async (theme: Theme) => {
    const page = await open("data-table.html", { colorScheme: theme });
    const observed = { prose: await tokens(page, prose), violations: await violations(page) };
    await close(page);
    expect(observed).toEqual({ prose: want(prose), violations: [] });
  });
});

describe("the inventory decisions' rules of block 1 and block 4 (R-18 to R-20)", { timeout: 60_000 }, () => {
  for (const path of pages) {
    it.each(themes)(`${path} in %s: the sticky table separated, the <thead> sticky at minus the ring room, its cells on sheet, the stripe on each <tbody>'s even rows with the hidden row counted, a non-sticky table collapsed`, async (theme: Theme) => {
      const page = await open(path, { colorScheme: theme });
      const observed = { inventory: await tokens(page, inventory), violations: await violations(page) };
      await close(page);
      expect(observed).toEqual({ inventory: want(inventory), violations: [] });
    });
  }

  it("in dark, the hover ground after the stripe: a hovered striped even row on hover-bg (which differs from inset in dark), an unhovered even row on inset, a hovered header and footer row nothing new", async () => {
    const page = await open("data-table-defined.html", { colorScheme: "dark" });
    await page.hover("#c4");
    const hovered = await tokens(page, [
      ["c4", "background-color", "color-hover-bg"],
      ["rh4", "background-color", "color-hover-bg"],
      ["g2", "background-color", "color-inset"],
    ]);
    await page.hover("#f1");
    const footer = await tokens(page, [["f1", "background-color", "=rgba(0, 0, 0, 0)"]]);
    await page.hover("#h1");
    const header = await tokens(page, [["h1", "background-color", "color-sheet"]]);
    const observed = { hovered, footer, header, violations: await violations(page) };
    await close(page);
    expect(observed).toEqual({ hovered: ["color-hover-bg", "color-hover-bg", "color-inset"], footer: ["=rgba(0, 0, 0, 0)"], header: ["color-sheet"], violations: [] });
  });

  it("in forced colours, the row band on the first body cell: Canvas, CanvasText on the striped even rows, Highlight on the hovered row, each --ocelle-bar-width wide; cell text and rules CanvasText", async () => {
    const page = await open("data-table.html", { colorScheme: "light", forced: true });
    await page.hover("#c3");
    const observed = await page.evaluate(() => {
      const probe = document.getElementById("probe");
      if (probe === null) throw new Error("no #probe");
      const system = (colour: string): string => {
        probe.style.setProperty("color", colour);
        const value = getComputedStyle(probe).color;
        probe.style.removeProperty("color");
        return value;
      };
      probe.style.setProperty("padding-left", "var(--ocelle-bar-width)");
      const bar = getComputedStyle(probe).paddingLeft;
      probe.style.removeProperty("padding-left");
      const names: Record<string, string> = { [system("Canvas")]: "Canvas", [system("CanvasText")]: "CanvasText", [system("Highlight")]: "Highlight" };
      const band = (id: string): unknown => {
        const element = document.getElementById(id);
        if (element === null) return `no #${id}`;
        const style = getComputedStyle(element);
        return { colour: names[style.borderLeftColor] ?? style.borderLeftColor, width: style.borderLeftWidth === bar };
      };
      const cell = document.getElementById("c1");
      return {
        band: [band("rh1"), band("rh3"), band("rh4"), band("g1"), band("g2")],
        text: cell === null ? "no #c1" : names[getComputedStyle(cell).color] ?? getComputedStyle(cell).color,
        rule: cell === null ? "no #c1" : names[getComputedStyle(cell).borderBottomColor] ?? getComputedStyle(cell).borderBottomColor,
      };
    });
    const recorded = await violations(page);
    await close(page);
    expect({ observed, recorded }).toEqual({
      observed: {
        band: [
          { colour: "Canvas", width: true },
          { colour: "Highlight", width: true },
          { colour: "CanvasText", width: true },
          { colour: "Canvas", width: true },
          { colour: "CanvasText", width: true },
        ],
        text: "CanvasText",
        rule: "CanvasText",
      },
      recorded: [],
    });
  });

  for (const path of pages) {
    it(`${path}: block 4, data-ocelle-align="end" end-aligns with tabular figures a data-table cell, a header keeping its eyebrow, a prose data table's cell and a plain prose table's cell, only for the value end, each beside a cell without the hook staying start-aligned`, async () => {
      const page = await open(path, { colorScheme: "light" });
      const observed = { align: await tokens(page, align), violations: await violations(page) };
      await close(page);
      expect(observed).toEqual({ align: want(align), violations: [] });
    });
  }
});

describe("the base-style hook on the caption (R-07, analysis I7 (a))", { timeout: 60_000 }, () => {
  it("before upgrade the caption's cap is --ocelle-measure-container less the ring room on both sides, with no end fade", async () => {
    const page = await open("data-table.html", { colorScheme: "light" });
    const cap = await computed(page, "cap", ["max-inline-size"]);
    const expected = await page.evaluate(() => {
      const probe = document.getElementById("probe");
      if (probe === null) throw new Error("no #probe");
      probe.style.setProperty("max-inline-size", "calc(var(--ocelle-measure-container) - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))");
      const value = getComputedStyle(probe).maxInlineSize;
      probe.style.removeProperty("max-inline-size");
      return value;
    });
    const recorded = await violations(page);
    await close(page);
    expect({ capped: cap["max-inline-size"] === expected && expected !== "none", recorded }).toEqual({ capped: true, recorded: [] });
  });
});
