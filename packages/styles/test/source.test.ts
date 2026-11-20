import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../scripts/build.ts";
import { classProblems, forcedColorAdjustProblems, importUrlProblems, motionProblems, outlineProblems, parse, rules, selectors, specificity, specificityProblems, wrapProblems } from "./source-checks.ts";
import type { RuleEntry } from "./source-checks.ts";

// The source-level checks of the shipped stylesheet (003 research.md R-11; spec US1 scenarios 3, 5 and 8, FR-001,
// FR-005, FR-009, FR-010, FR-011, FR-025): src/base.css is read once and buildPlan(text)[0].content, the text the
// build writes to dist/base.css (build.test.ts), is parsed with PostCSS. Each guard shares its test with a positive
// assertion over the same parse, so none passes on an empty file (SC-002), and each check is also run on the plant
// strings of R-10 § Source-level guards (it must report each) and on its boundary strings (it must not). The
// expected rules are transcribed by hand from data-model.md § Rule table (base layer, compact scale, prose,
// identifier wrap), never read from the source.
const text = readFileSync(new URL("../src/base.css", import.meta.url), "utf8");
// An absent plan entry parses as the empty sheet, so the assertions below report what is missing.
const root = parse(buildPlan(text)[0]?.content ?? "");

const focus: RuleEntry = {
  media: [],
  selectors: [":where(:focus-visible)"],
  declarations: [
    ["outline-style", "solid"],
    ["outline-width", "var(--ocelle-focus-width)"],
    ["outline-color", "var(--ocelle-color-focus)"],
    ["outline-offset", "var(--ocelle-focus-offset)"],
  ],
};
const forcedFocus: RuleEntry = { media: ["@media (forced-colors: active)"], selectors: [":where(:focus-visible)"], declarations: [["outline-color", "Highlight"]] };

/** data-model.md § Rule table, base layer, in its order (R-03). */
const baseLayer: readonly RuleEntry[] = [
  { media: [], selectors: [":where(*)", ":where(*)::before", ":where(*)::after"], declarations: [["box-sizing", "border-box"]] },
  { media: [], selectors: [":where(:root)"], declarations: [["color-scheme", "var(--ocelle-color-scheme)"]] },
  {
    media: [],
    selectors: [":where(body)"],
    declarations: [
      ["margin", "0"],
      ["font-family", "var(--ocelle-font-sans)"],
      ["font-size", "var(--ocelle-font-size-md)"],
      ["line-height", "var(--ocelle-line-height-normal)"],
      ["color", "var(--ocelle-color-ink)"],
      ["background-color", "var(--ocelle-color-canvas)"],
    ],
  },
  { media: [], selectors: [":where(img, picture, video, canvas, svg)"], declarations: [["max-inline-size", "100%"], ["block-size", "auto"]] },
  { media: [], selectors: [":where(button, input, select, textarea)"], declarations: [["font", "inherit"]] },
  { media: [], selectors: [":where(code, pre, kbd, samp)"], declarations: [["font-family", "var(--ocelle-font-sans)"], ["font-variant-numeric", "var(--ocelle-figures)"]] },
  // 013 (research.md R-01, R-07): ocelle-facts before upgrade, each fact not hidden a block, (0,0,0).
  { media: [], selectors: [":where(ocelle-facts:not(:defined) > ocelle-fact:not([hidden]))"], declarations: [["display", "block"]] },
  focus,
  forcedFocus,
];
const baseSelectors = [...new Set(baseLayer.flatMap((rule) => rule.selectors))];

/** data-model.md § Rule table, compact scale, in its order after the base layer (R-03, R-04). */
const compactScale: readonly RuleEntry[] = [
  {
    media: [],
    selectors: ['[data-ocelle-density="compact"]:where(:not(html))', '[data-ocelle-density="compact"] > :where(body)'],
    declarations: [
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["line-height", "var(--ocelle-line-height-compact)"],
      // 013 (research.md R-03): the facts value hooks in a compact region.
      ["--ocelle-facts-value-size", "var(--ocelle-font-size-sm)"],
      ["--ocelle-facts-value-line-height", "var(--ocelle-line-height-compact)"],
    ],
  },
  {
    media: [],
    selectors: ['[data-ocelle-density="regular"]:where(:not(html))', '[data-ocelle-density="regular"] > :where(body)'],
    declarations: [
      ["font-size", "var(--ocelle-font-size-md)"],
      ["line-height", "var(--ocelle-line-height-normal)"],
      // 013 (research.md R-03): the facts value hooks back to the regular scale.
      ["--ocelle-facts-value-size", "var(--ocelle-font-size-fact)"],
      ["--ocelle-facts-value-line-height", "var(--ocelle-line-height-normal)"],
    ],
  },
  {
    media: [],
    selectors: ['[data-ocelle-value=""]', '[data-ocelle-value="ink"]'],
    declarations: [
      ["font-family", "var(--ocelle-font-sans)"],
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["font-variant-numeric", "var(--ocelle-figures)"],
      ["color", "var(--ocelle-color-ink-muted)"],
    ],
  },
  { media: [], selectors: ['[data-ocelle-value="ink"]'], declarations: [["color", "var(--ocelle-color-ink)"]] },
];
const compactSelectors = [...new Set(compactScale.flatMap((rule) => rule.selectors))];

/** data-model.md § Rule table, prose, in its order after the compact scale (R-03, R-06); every selector starts with the hook. */
const hook = '[data-ocelle-prose=""]';
const proseRule = (rest: string, declarations: RuleEntry["declarations"]): RuleEntry => ({ media: [], selectors: [`${hook}${rest}`], declarations });
const prose: readonly RuleEntry[] = [
  proseRule(":where(:not(html))", [
    ["font-size", "var(--ocelle-font-size-md)"],
    ["line-height", "var(--ocelle-line-height-prose)"],
  ]),
  proseRule(" :where(h1, h2, h3, h4, h5, h6)", [
    ["line-height", "var(--ocelle-line-height-tight)"],
    ["margin-block", "var(--ocelle-space-6) var(--ocelle-space-3)"],
  ]),
  proseRule(" :where(h1)", [
    ["font-size", "var(--ocelle-font-size-2xl)"],
    ["font-weight", "var(--ocelle-font-weight-display)"],
  ]),
  proseRule(" :where(h2)", [
    ["font-size", "var(--ocelle-font-size-subhead)"],
    ["font-weight", "var(--ocelle-font-weight-strong)"],
  ]),
  proseRule(" :where(h3)", [
    ["font-size", "var(--ocelle-font-size-fact)"],
    ["font-weight", "var(--ocelle-font-weight-strong)"],
  ]),
  proseRule(" :where(h4, h5, h6)", [
    ["font-size", "var(--ocelle-font-size-md)"],
    ["font-weight", "var(--ocelle-font-weight-strong)"],
  ]),
  proseRule(" :where(p, ul, ol, blockquote, pre, table, hr)", [["margin-block", "0 var(--ocelle-space-4)"]]),
  proseRule(" :where(p, li, blockquote)", [["max-inline-size", "var(--ocelle-measure-reading)"]]),
  proseRule(" :where(ul, ol)", [["padding-inline-start", "var(--ocelle-space-6)"]]),
  proseRule(" :where(blockquote)", [
    ["margin-inline", "0"],
    ["padding-inline-start", "var(--ocelle-space-4)"],
    ["border-inline-start", "var(--ocelle-bar-width) solid var(--ocelle-color-rule-strong)"],
    ["color", "var(--ocelle-color-ink-soft)"],
  ]),
  proseRule(" :where(hr)", [
    ["border", "0"],
    ["border-block-start", "var(--ocelle-border-width) solid var(--ocelle-color-rule)"],
  ]),
  proseRule(" :where(a:any-link)", [
    ["color", "var(--ocelle-color-link)"],
    ["text-decoration-line", "underline"],
    ["overflow-wrap", "anywhere"],
  ]),
  proseRule(" :where(a:any-link:hover)", [["color", "var(--ocelle-color-link-hover)"]]),
  proseRule(" :where(code)", [
    ["background-color", "var(--ocelle-color-inset)"],
    ["padding-inline", "var(--ocelle-space-1)"],
    ["border-radius", "var(--ocelle-radius-2)"],
    ["overflow-wrap", "anywhere"],
  ]),
  proseRule(" :where(pre)", [
    ["background-color", "var(--ocelle-color-inset)"],
    ["padding", "var(--ocelle-space-3)"],
    ["border-radius", "var(--ocelle-radius-2)"],
    ["white-space", "pre-wrap"],
    ["overflow-wrap", "anywhere"],
  ]),
  proseRule(" :where(pre code)", [
    ["padding-inline", "0"],
    ["background-color", "transparent"],
  ]),
  proseRule(" :where(table)", [
    ["display", "block"],
    ["overflow-x", "auto"],
    ["max-inline-size", "100%"],
    ["container-type", "inline-size"],
    ["border-collapse", "collapse"],
  ]),
  proseRule(" :where(table:focus-visible)", [["outline-offset", "calc(var(--ocelle-focus-width) * -1)"]]),
  proseRule(" :where(caption)", [
    ["position", "sticky"],
    ["inset-inline-start", "0"],
    ["max-inline-size", "var(--ocelle-measure-container)"],
    ["text-align", "start"],
  ]),
  proseRule(" :where(th, td)", [
    ["min-inline-size", "var(--ocelle-measure-cell)"],
    ["padding", "var(--ocelle-space-2) var(--ocelle-space-3)"],
    ["border-block-end", "var(--ocelle-border-width) solid var(--ocelle-color-rule)"],
    ["text-align", "start"],
  ]),
  proseRule(" :where(th)", [
    ["font-size", "var(--ocelle-font-size-xs)"],
    ["font-variant-numeric", "var(--ocelle-figures)"],
    ["font-weight", "var(--ocelle-font-weight-strong)"],
    ["border-block-end-color", "var(--ocelle-color-rule-strong)"],
  ]),
];
const proseSelectors = prose.flatMap((rule) => rule.selectors);

/** data-model.md § Rule table, identifier wrap: one rule, last in the file (R-03). */
const wrap: RuleEntry = { media: [], selectors: ['[data-ocelle-wrap="anywhere"]'], declarations: [["overflow-wrap", "anywhere"]] };

/** 019 contracts/styles-data-table.md § Block 1 (research R-06, R-07, R-18, R-20): the data-table rules at (0,0,0), after the wrap rule, in order. */
const dataTableBlock1: readonly RuleEntry[] = [
  {
    media: [],
    selectors: [":where(ocelle-data-table > table)"],
    declarations: [
      ["border-collapse", "collapse"],
      ["inline-size", "100%"],
      ["margin", "0"],
      ["font-family", "var(--ocelle-font-sans)"],
      ["font-variant-numeric", "var(--ocelle-figures)"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table > table > caption)"],
    declarations: [
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["font-weight", "var(--ocelle-font-weight-medium)"],
      ["line-height", "var(--ocelle-line-height-normal)"],
      ["color", "var(--ocelle-color-ink)"],
      ["text-align", "start"],
      ["padding-block-end", "var(--ocelle-space-2)"],
      ["position", "static"],
      ["min-inline-size", "min-content"],
      ["max-inline-size", "calc(var(--data-table-box-size, var(--ocelle-measure-container)) - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)) - var(--data-table-end-fade, 0 * var(--ocelle-scroller-fade-size)))"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th))"],
    declarations: [
      ["padding", "var(--ocelle-space-1) var(--ocelle-space-2)"],
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["line-height", "var(--ocelle-line-height-compact)"],
      ["color", "var(--ocelle-color-ink-soft)"],
      ["text-align", "start"],
      ["vertical-align", "top"],
      ["border-block-end", "var(--ocelle-border-width) solid var(--ocelle-color-rule)"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table > table > thead > tr > th, ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"col\"], ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"colgroup\"])"],
    declarations: [
      ["font-size", "var(--ocelle-font-size-eyebrow)"],
      ["font-weight", "var(--ocelle-font-weight-eyebrow)"],
      ["text-transform", "uppercase"],
      ["letter-spacing", "var(--ocelle-tracking-eyebrow)"],
      ["color", "var(--ocelle-color-eyebrow)"],
      ["border-block-end-color", "var(--ocelle-color-rule-strong)"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"row\"], ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"rowgroup\"], ocelle-data-table > table > :is(tbody, tfoot) > tr > th:not([scope]))"],
    declarations: [
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["font-weight", "var(--ocelle-font-weight-medium)"],
      ["text-transform", "none"],
      ["letter-spacing", "normal"],
      ["color", "var(--ocelle-color-ink)"],
      ["border-block-end-color", "var(--ocelle-color-rule)"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table > table > :is(tbody, tfoot):last-child > tr:last-child > :is(td, th))"],
    declarations: [
      ["border-block-end", "0"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table[wrap=\"anywhere\"] > table > :is(tbody, tfoot) > tr > td)"],
    declarations: [
      ["overflow-wrap", "anywhere"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table[sticky-header] > table)"],
    declarations: [
      ["border-collapse", "separate"],
      ["border-spacing", "0"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table[sticky-header] > table > thead)"],
    declarations: [
      ["position", "sticky"],
      ["inset-block-start", "calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)))"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table[sticky-header] > table > thead > tr > :is(td, th))"],
    declarations: [
      ["background-color", "var(--ocelle-color-sheet)"],
    ],
  },
  {
    media: [],
    selectors: [":where(ocelle-data-table[striped] > table > tbody > tr:nth-child(even) > :is(td, th))"],
    declarations: [
      ["background-color", "var(--ocelle-color-inset)"],
    ],
  },
  {
    media: ["@media (hover: hover)"],
    selectors: [":where(ocelle-data-table > table > tbody > tr:hover > :is(td, th))"],
    declarations: [
      ["background-color", "var(--ocelle-color-hover-bg)"],
    ],
  },
  {
    media: ["@media (forced-colors: active)"],
    selectors: [":where(ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th))"],
    declarations: [
      ["color", "CanvasText"],
      ["border-block-end-color", "CanvasText"],
    ],
  },
  {
    media: ["@media (forced-colors: active)"],
    selectors: [":where(ocelle-data-table > table > tbody > tr > :first-child)"],
    declarations: [
      ["border-inline-start", "var(--ocelle-bar-width) solid Canvas"],
    ],
  },
  {
    media: ["@media (forced-colors: active)"],
    selectors: [":where(ocelle-data-table[striped] > table > tbody > tr:nth-child(even) > :first-child)"],
    declarations: [
      ["border-inline-start-color", "CanvasText"],
    ],
  },
  {
    media: ["@media (forced-colors: active)", "@media (hover: hover)"],
    selectors: [":where(ocelle-data-table > table > tbody > tr:hover > :first-child)"],
    declarations: [
      ["border-inline-start-color", "Highlight"],
    ],
  },
];

/** 019 contracts/styles-data-table.md § Block 2 (R-06, R-18): the prose override at (0,1,0), after block 1. */
const dataTableBlock2: readonly RuleEntry[] = [
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table > table)"],
    declarations: [
      ["display", "table"],
      ["overflow-x", "visible"],
      ["max-inline-size", "none"],
      ["container-type", "normal"],
      ["margin-block", "0"],
      ["border-collapse", "collapse"],
    ],
  },
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table[sticky-header] > table)"],
    declarations: [
      ["border-collapse", "separate"],
    ],
  },
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table > table > caption)"],
    declarations: [
      ["position", "static"],
      ["inset-inline-start", "auto"],
      ["max-inline-size", "calc(var(--data-table-box-size, var(--ocelle-measure-container)) - 2 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width)) - var(--data-table-end-fade, 0 * var(--ocelle-scroller-fade-size)))"],
      ["text-align", "start"],
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["line-height", "var(--ocelle-line-height-normal)"],
    ],
  },
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > :is(td, th))"],
    declarations: [
      ["min-inline-size", "auto"],
      ["padding", "var(--ocelle-space-1) var(--ocelle-space-2)"],
      ["border-block-end", "var(--ocelle-border-width) solid var(--ocelle-color-rule)"],
      ["text-align", "start"],
    ],
  },
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table > table > thead > tr > th, ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"col\"], ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"colgroup\"])"],
    declarations: [
      ["font-size", "var(--ocelle-font-size-eyebrow)"],
      ["font-variant-numeric", "var(--ocelle-figures)"],
      ["font-weight", "var(--ocelle-font-weight-eyebrow)"],
      ["border-block-end-color", "var(--ocelle-color-rule-strong)"],
    ],
  },
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"row\"], ocelle-data-table > table > :is(thead, tbody, tfoot) > tr > th[scope=\"rowgroup\"], ocelle-data-table > table > :is(tbody, tfoot) > tr > th:not([scope]))"],
    declarations: [
      ["font-size", "var(--ocelle-font-size-sm)"],
      ["font-variant-numeric", "var(--ocelle-figures)"],
      ["font-weight", "var(--ocelle-font-weight-medium)"],
      ["border-block-end-color", "var(--ocelle-color-rule)"],
    ],
  },
  {
    media: [],
    selectors: ["[data-ocelle-prose=\"\"] :where(ocelle-data-table > table > :is(tbody, tfoot):last-child > tr:last-child > :is(td, th))"],
    declarations: [
      ["border-block-end", "0"],
    ],
  },
];

/** 019 contracts/styles-data-table.md § Block 4 (R-19): the numeric-cell hook, after block 2, last in the file. */
const dataTableBlock4: readonly RuleEntry[] = [
  {
    media: [],
    selectors: ["[data-ocelle-align=\"end\"]"],
    declarations: [
      ["text-align", "end"],
      ["font-variant-numeric", "var(--ocelle-figures)"],
    ],
  },
];

/** How many problems a check reports on each plant string. */
function reports(check: (sheet: ReturnType<typeof parse>) => string[], plants: readonly string[]): number[] {
  return plants.map((plant) => check(parse(plant)).length);
}

describe("src/base.css as shipped (buildPlan(text)[0].content)", () => {
  it("opens with the base layer of data-model § Rule table, in its order, with exactly its declarations (R-03)", () => {
    expect(rules(root).slice(0, baseLayer.length)).toEqual(baseLayer);
  });

  it("follows the base layer with the compact scale of data-model § Rule table, in its order, with exactly its declarations (R-03, R-04)", () => {
    expect(rules(root).slice(baseLayer.length, baseLayer.length + compactScale.length)).toEqual(compactScale);
  });

  it("follows the compact scale with the prose rules of data-model § Rule table, in its order, with exactly their declarations (R-03, R-06)", () => {
    const start = baseLayer.length + compactScale.length;
    expect(rules(root).slice(start, start + prose.length)).toEqual(prose);
  });

  // 019 phase 1 (research R-06, R-19; PLAN-CORRECTNESS-1-005): the file now ends with the wrap rule, then the data
  // table's block 1, then its prose override (block 2), then the numeric-cell hook (block 4), in that order.
  it("ends with the identifier-wrap rule right after the prose rules, then the data-table block 1, block 2 and block 4, in that order, with exactly their declarations (R-03; 019 R-06, R-19)", () => {
    const start = baseLayer.length + compactScale.length + prose.length;
    expect(rules(root).slice(start)).toEqual([wrap, ...dataTableBlock1, ...dataTableBlock2, ...dataTableBlock4]);
  });

  it("019 R-06, R-18, R-20: block 1's selectors are each wrapped whole in :where() at (0,0,0), the hover rule and the forced-colours Highlight band rule inside @media (hover: hover); block 2's and block 4's at (0,1,0)", () => {
    expect({
      block1: dataTableBlock1.flatMap((rule) => rule.selectors).map(specificity),
      hover: dataTableBlock1.filter((rule) => rule.selectors.some((selector) => selector.includes("tr:hover"))).map((rule) => rule.media),
      block2: dataTableBlock2.flatMap((rule) => rule.selectors).map(specificity),
      block4: dataTableBlock4.flatMap((rule) => rule.selectors).map(specificity),
      shipped: selectors(root).filter((selector) => selector.includes("ocelle-data-table") || selector.includes("data-ocelle-align")).length,
    }).toEqual({
      block1: dataTableBlock1.flatMap((rule) => rule.selectors).map(() => [0, 0, 0]),
      hover: [["@media (hover: hover)"], ["@media (forced-colors: active)", "@media (hover: hover)"]],
      block2: dataTableBlock2.flatMap((rule) => rule.selectors).map(() => [0, 1, 0]),
      block4: [[0, 1, 0]],
      shipped: 23,
    });
  });

  it("US1-3: has the focus rule's four longhands and the forced-colours rule, and declares no motion and no forced-color-adjust: none", () => {
    const all = rules(root);
    expect(all.filter((rule) => rule.selectors.includes(":where(:focus-visible)"))).toEqual([focus, forcedFocus]);
    expect(motionProblems(root)).toEqual([]);
    expect(forcedColorAdjustProblems(root)).toEqual([]);
    // R-10 plants: each must be reported.
    expect(
      reports(motionProblems, [
        ":where(a) { transition: color 1s; }",
        ":where(a) { animation-name: x; }",
        ":where(html) { scroll-behavior: smooth; }",
        "@media (prefers-reduced-motion: no-preference) { :where(a) { transition-duration: 1s; } }",
      ]),
    ).toEqual([1, 1, 1, 1]);
    expect(reports(forcedColorAdjustProblems, [":where(a) { forced-color-adjust: none; }"])).toEqual([1]);
  });

  it("FR-009: the focus rule declares outline-style: solid, and no rule sets outline: none, outline: 0 or outline-style: none", () => {
    const declarations = rules(root).find((rule) => rule.media.length === 0 && rule.selectors.includes(":where(:focus-visible)"))?.declarations ?? [];
    expect(declarations).toContainEqual(["outline-style", "solid"]);
    expect(outlineProblems(root)).toEqual([]);
    expect(
      reports(outlineProblems, [
        ":where(a) { outline: none; }",
        ":where(a) { outline: 0; }",
        ":where(a) { outline-style: none; }",
        "@media (forced-colors: active) { :where(a) { outline: none; } }",
        "@media (forced-colors: active) { :where(a) { outline: 0; } }",
        "@media (forced-colors: active) { :where(a) { outline-style: none; } }",
      ]),
    ).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("US1-5: holds the base layer's body rule, and has no @import and no url()", () => {
    expect(rules(root).some((rule) => rule.selectors.includes(":where(body)"))).toBe(true);
    expect(importUrlProblems(root)).toEqual([]);
    expect(reports(importUrlProblems, ['@import "x.css";', ":where(body) { background-image: url(x.png); }"])).toEqual([1, 1]);
  });

  it("US1-8: holds every base-layer selector, and no selector has a class or exceeds its specificity bound", () => {
    expect(baseSelectors.filter((selector) => !selectors(root).includes(selector))).toEqual([]);
    expect(selectors(root).length).toBeGreaterThanOrEqual(baseSelectors.length);
    expect(classProblems(root)).toEqual([]);
    expect(specificityProblems(root)).toEqual([]);
    // R-10 plants: each must be reported; the boundaries must not.
    expect(reports(classProblems, [".x {}", "[data-ocelle-prose] p:not(.x) {}"])).toEqual([1, 1]);
    expect(
      reports(specificityProblems, ["#x p {}", ":root {}", ":focus-visible {}", "[data-ocelle-prose] :where(a):hover {}", "[data-ocelle-prose] p:not(.x) {}"]),
    ).toEqual([1, 1, 1, 1, 1]);
    expect(reports(specificityProblems, ["[data-ocelle-prose] p {}", ":where(:root) {}", ":where(*)::before {}"])).toEqual([0, 0, 0]);
    expect(
      ["#x p", ":root", ":focus-visible", "[data-ocelle-prose] :where(a):hover", "[data-ocelle-prose] p:not(.x)", "[data-ocelle-prose] p", ":where(:root)", ":where(*)::before", "a:before", ":is(#x, p) a"].map(specificity),
    ).toEqual([
      [1, 0, 1],
      [0, 1, 0],
      [0, 1, 0],
      [0, 2, 0],
      [0, 2, 1],
      [0, 1, 1],
      [0, 0, 0],
      [0, 0, 1],
      [0, 0, 2],
      [1, 0, 1],
    ]);
  });

  it("US2 (FR-005, FR-025): holds every compact-scale selector, each one hook attribute at (0,1,0), and no selector has a class or exceeds its bound", () => {
    expect(compactSelectors.filter((selector) => !selectors(root).includes(selector))).toEqual([]);
    expect(compactSelectors.map(specificity)).toEqual(compactSelectors.map(() => [0, 1, 0]));
    expect(classProblems(root)).toEqual([]);
    expect(specificityProblems(root)).toEqual([]);
  });

  it("US3 (FR-005, FR-014, FR-025): holds every prose selector, each one hook attribute at (0,1,0), and no selector has a class or exceeds its bound", () => {
    expect(proseSelectors.filter((selector) => !selectors(root).includes(selector))).toEqual([]);
    expect(proseSelectors.map(specificity)).toEqual(proseSelectors.map(() => [0, 1, 0]));
    expect(classProblems(root)).toEqual([]);
    expect(specificityProblems(root)).toEqual([]);
  });

  it("FR-020: the wrap rule declares overflow-wrap: anywhere at (0,1,0), and no data-ocelle-wrap rule sets word-break, hyphens: auto, text-overflow: ellipsis or white-space: nowrap", () => {
    expect(rules(root).filter((rule) => rule.selectors.some((selector) => selector.includes("data-ocelle-wrap")))).toEqual([wrap]);
    expect(wrap.selectors.map(specificity)).toEqual([[0, 1, 0]]);
    expect(wrapProblems(root)).toEqual([]);
    // R-10 plants: each must be reported; the boundaries (the wrap rule itself, the list on a rule without the hook) must not.
    expect(
      reports(wrapProblems, [
        '[data-ocelle-wrap="anywhere"] { word-break: break-all; }',
        '[data-ocelle-wrap="anywhere"] { hyphens: auto; }',
        '[data-ocelle-wrap="anywhere"] { text-overflow: ellipsis; }',
        '[data-ocelle-wrap="anywhere"] { white-space: nowrap; }',
      ]),
    ).toEqual([1, 1, 1, 1]);
    expect(reports(wrapProblems, ['[data-ocelle-wrap="anywhere"] { overflow-wrap: anywhere; }', ":where(td) { white-space: nowrap; text-overflow: ellipsis; }"])).toEqual([0, 0]);
  });
});
