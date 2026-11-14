// The element pairs check of the selection elements (014 spec FR-058; research.md R-15, R-17; T018), one function over
// a stylesheet text, shared by test/node/selection-pairs.test.ts (the source templates, in process) and
// test/build/build.test.ts (the `css` templates of the built modules, the stylesheets as shipped). It reads, outside
// forced colours, the colour tokens a stylesheet paints in each role: `text` (`color`), `fill` (`background` on the
// host or a part), `bar` (`background` or, since 014 phase 3, a border of the `::before` bar), `ring` (the border of the `::after` focus ring) and
// `line` (a border or an outline of the host or a part), and lists every pair of the element's R-15 rows that is not a
// `checked` row of packages/tokens/contrast/pairs.json in both themes, `color-disabled-ink` exempt (WCAG 1.4.3). The
// rows below are transcribed by hand from R-15's table, never read from the element source or from pairs.json.
import postcss from "postcss";
import type { Rule } from "postcss";
import type { PairEntry } from "./brand-pairs-check.ts";

export type { PairEntry } from "./brand-pairs-check.ts";
export { styleTemplate } from "./brand-pairs-check.ts";

/** The roles a colour token is painted in. */
export type Role = "text" | "fill" | "bar" | "ring" | "line";

/** The tokens painted per role, each list sorted, without the `--ocelle-` prefix. */
export type Painted = Readonly<Record<Role, readonly string[]>>;

/** A foreground token on a ground token, without the `--ocelle-` prefix, checked in both themes. */
export interface Pair {
  readonly fg: string;
  readonly bg: string;
}

/** The six main grounds the selection elements sit on (R-15). */
export const mainGrounds = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail"];

const on = (fg: string, grounds: readonly string[]): Pair[] => grounds.map((bg) => ({ fg, bg }));

/** The tokens exempt from the check: disabled text (WCAG 1.4.3 inactive controls; R-15). */
export const exempt = ["color-disabled-ink"];

/**
 * R-15's rows for `ocelle-option`: text `ink` on the main grounds (rest) and on `hover-bg` (hover), `disabled-ink`
 * (exempt), the `hover-bg` fill, the selected bar `accent-strong` on the main grounds and on `hover-bg`, and the focus
 * ring `color-focus` on the main grounds and, beside a hovered neighbour, on `hover-bg`.
 */
export const optionRows: { readonly painted: Painted; readonly pairs: readonly Pair[] } = {
  painted: { text: ["color-disabled-ink", "color-ink"], fill: ["color-hover-bg"], bar: ["color-accent-strong"], ring: ["color-focus"], line: [] },
  pairs: [
    ...on("color-ink", [...mainGrounds, "color-hover-bg"]),
    ...on("color-accent-strong", [...mainGrounds, "color-hover-bg"]),
    ...on("color-focus", [...mainGrounds, "color-hover-bg"]),
  ],
};

/** R-15 for `ocelle-listbox`: the listbox paints no colour of its own (its options do); no pair. */
export const listboxRows: { readonly painted: Painted; readonly pairs: readonly Pair[] } = {
  painted: { text: [], fill: [], bar: [], ring: [], line: [] },
  pairs: [],
};

/**
 * R-15's rows for `ocelle-tab` (014 phase 3), as for the option: text `ink` on the main grounds and on `hover-bg`,
 * `disabled-ink` (exempt), the `hover-bg` fill, the selected bar `accent-strong` (on its block-end edge) on the main
 * grounds and on `hover-bg`, and the focus ring `color-focus` on the main grounds and, beside a hovered neighbour, on
 * `hover-bg`.
 */
export const tabRows: { readonly painted: Painted; readonly pairs: readonly Pair[] } = {
  painted: { text: ["color-disabled-ink", "color-ink"], fill: ["color-hover-bg"], bar: ["color-accent-strong"], ring: ["color-focus"], line: [] },
  pairs: [
    ...on("color-ink", [...mainGrounds, "color-hover-bg"]),
    ...on("color-accent-strong", [...mainGrounds, "color-hover-bg"]),
    ...on("color-focus", [...mainGrounds, "color-hover-bg"]),
  ],
};

/**
 * R-15 for `ocelle-tab-panel`: the focus ring of a panel that is its own tab stop (US2-6), an outline (a `line`) of
 * `color-focus` on the main grounds; no text, fill or bar of its own (its content is the page's).
 */
export const tabPanelRows: { readonly painted: Painted; readonly pairs: readonly Pair[] } = {
  painted: { text: [], fill: [], bar: [], ring: [], line: ["color-focus"] },
  pairs: on("color-focus", mainGrounds),
};

/** R-15 for `ocelle-tabs`: the tabs paint no colour of their own (their tabs and panels do); no pair. */
export const tabsRows: { readonly painted: Painted; readonly pairs: readonly Pair[] } = {
  painted: { text: [], fill: [], bar: [], ring: [], line: [] },
  pairs: [],
};

/** Whether a rule sits inside `@media (forced-colors: active)` (not inside its negation). */
function inForcedColours(rule: Rule): boolean {
  for (let parent = rule.parent; parent !== undefined && parent.type !== "root"; parent = parent.parent) {
    if (parent.type === "atrule" && (parent as postcss.AtRule).name === "media") {
      const query = (parent as postcss.AtRule).params.replace(/\s+/g, " ").trim();
      if (/forced-colors:\s*active/.test(query) && !/^not\b/.test(query)) return true;
    }
  }
  return false;
}

/** The role a declaration paints in, by its property and the pseudo-element its selector ends in; undefined for none. */
function roleOf(selector: string, property: string): Role | undefined {
  const pseudo = /::(before|after)\s*$/.exec(selector.trim())?.[1];
  if (property === "color") return pseudo === undefined ? "text" : undefined;
  if (property === "background" || property === "background-color") return pseudo === "before" ? "bar" : pseudo === "after" ? undefined : "fill";
  if (/^(border|outline)(-|$)/.test(property)) return pseudo === "after" ? "ring" : pseudo === "before" ? "bar" : "line";
  return undefined;
}

/** The colour tokens a stylesheet paints per role outside forced colours, each list sorted. */
export function paintedTokens(sheet: string): Painted {
  const found: Record<Role, Set<string>> = { text: new Set(), fill: new Set(), bar: new Set(), ring: new Set(), line: new Set() };
  postcss.parse(sheet).walkRules((rule) => {
    if (inForcedColours(rule)) return;
    for (const selector of rule.selectors) {
      rule.walkDecls((declaration) => {
        const role = roleOf(selector, declaration.prop);
        if (role === undefined) return;
        for (const match of declaration.value.matchAll(/var\(\s*--ocelle-(color-[a-z-]+)/g)) found[role].add(String(match[1]));
      });
    }
  });
  const sorted = (role: Role): string[] => [...found[role]].sort();
  return { text: sorted("text"), fill: sorted("fill"), bar: sorted("bar"), ring: sorted("ring"), line: sorted("line") };
}

/** Each pair of `rows` that is not a `checked` row of `pairs` in a theme, as "<fg> on <bg> in <theme>"; exempt tokens skipped. */
export function missingPairs(rows: readonly Pair[], pairs: readonly PairEntry[]): string[] {
  return (["light", "dark"] as const).flatMap((theme) =>
    rows
      .filter((row) => !exempt.includes(row.fg))
      .filter((row) => !pairs.some((entry) => entry.theme === theme && entry.fg === row.fg && entry.bg === row.bg && entry.status === "checked"))
      .map((row) => `${row.fg} on ${row.bg} in ${theme}`),
  );
}

/** The check: the tokens the stylesheet paints per role, and the element's R-15 pairs missing from `pairs`. */
export function selectionPairs(sheet: string, rows: readonly Pair[], pairs: readonly PairEntry[]): { readonly painted: Painted; readonly missing: string[] } {
  return { painted: paintedTokens(sheet), missing: missingPairs(rows, pairs) };
}
