// The progress bar's pairing check (013 FR-036, SC-004; research.md R-06 § Contrast; contracts/checks.md § Contrast,
// PLAN-CORRECTNESS-1-007 (b), PLAN-CORRECTNESS-1-015; tasks.md T041), one function over a stylesheet text, shared by
// test/node/progress-pairs.test.ts (the source template, in process) and test/build/build.test.ts (the `css` template
// of the built dist/ocelle-progress.js, the stylesheet as shipped). It reads the colour tokens the stylesheet paints
// outside forced colours: the fill's ground and its edge (the `box-shadow` of the fill, the mark of FR-036), the
// track's ground, and the track's boundary (its `box-shadow`) without `ground` and with `ground="tinted"`; and it lists
// the pairs the bar makes that are not a `checked` row of packages/tokens/contrast/pairs.json in both themes. The pairs
// and the grounds each `ground` value is for (the README's assignment) are transcribed by hand from R-06, never read
// from the element source or from pairs.json.
import postcss from "postcss";
import type { AtRule, Rule } from "postcss";

/** One entry of pairs.json, as far as this check reads it. */
export interface PairEntry {
  readonly theme: string;
  readonly fg: string;
  readonly bg: string;
  readonly status: string;
}

/** The colour tokens painted, each list sorted, without the `--ocelle-` prefix. */
export interface Painted {
  readonly fill: string[];
  readonly mark: string[];
  readonly track: string[];
  readonly boundary: { readonly default: string[]; readonly tinted: string[] };
}

/** The grounds the README assigns: unset `ground` for the main grounds, `ground="tinted"` for the tinted ones. */
export const defaultGrounds = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail"];
export const tintedGrounds = ["color-inset", "color-accent-low", "color-hover-bg", "color-danger-bg", "color-warning-bg", "color-success-bg", "color-info-bg", "color-neutral-bg"];

/**
 * R-06's pairs, each in both themes: the mark (`color-accent-strong`) against the track (`color-inset`); against the
 * main grounds through `color-focus`'s rows (its `ref` is `color-accent-strong`); against the tinted grounds through
 * `color-accent-strong`'s own rows; the default boundary `color-control-border` on the main grounds; the tinted
 * boundary `color-accent-strong` on the tinted grounds.
 */
export const progressPairs: readonly { readonly fg: string; readonly bg: string }[] = [
  { fg: "color-accent-strong", bg: "color-inset" },
  ...defaultGrounds.map((bg) => ({ fg: "color-focus", bg })),
  ...tintedGrounds.map((bg) => ({ fg: "color-accent-strong", bg })),
  ...defaultGrounds.map((bg) => ({ fg: "color-control-border", bg })),
  ...tintedGrounds.map((bg) => ({ fg: "color-accent-strong", bg })),
];

/** The text of the first `css` tagged template of a module's text, source or built; empty when it has none. */
export function styleTemplate(moduleText: string): string {
  return /\bcss\s*`([^`]*)`/.exec(moduleText)?.[1] ?? "";
}

/** Whether a rule sits inside `@media (forced-colors: active)` (not inside its negation). */
function inForcedColours(rule: Rule): boolean {
  for (let parent = rule.parent; parent !== undefined && parent.type !== "root"; parent = parent.parent) {
    if (parent.type === "atrule" && (parent as AtRule).name === "media") {
      const query = (parent as AtRule).params.replace(/\s+/g, " ").trim();
      if (/forced-colors:\s*active/.test(query) && !/^not\b/.test(query)) return true;
    }
  }
  return false;
}

/** The part a selector paints, by its last compound: `track` or `fill` (as a part or a class); else undefined. */
function partOf(selector: string): "track" | "fill" | undefined {
  const last = selector.trim().split(/\s+|>/).filter((each) => each !== "").at(-1) ?? "";
  if (/\[part=["']?track["']?\]|\.track\b/.test(last)) return "track";
  if (/\[part=["']?fill["']?\]|\.fill\b/.test(last)) return "fill";
  return undefined;
}

const tokensOf = (values: readonly string[]): string[] => [...new Set(values.flatMap((value) => [...value.matchAll(/var\(\s*--ocelle-(color-[a-z-]+)/g)].map((match) => String(match[1]))))].sort();

/** The colour tokens the stylesheet paints outside forced colours (above). */
export function paintedTokens(sheet: string): Painted {
  const found: { readonly part: "track" | "fill"; readonly property: string; readonly tinted: boolean; readonly value: string }[] = [];
  postcss.parse(sheet).walkRules((rule) => {
    if (inForcedColours(rule)) return;
    for (const selector of rule.selectors) {
      const part = partOf(selector);
      if (part === undefined) continue;
      rule.walkDecls((declaration) => {
        found.push({ part, property: declaration.prop, tinted: selector.includes(':host([ground="tinted"])'), value: declaration.value });
      });
    }
  });
  const of = (part: "track" | "fill", property: string, tinted?: boolean): string[] =>
    tokensOf(found.filter((each) => each.part === part && each.property === property && (tinted === undefined || each.tinted === tinted)).map((each) => each.value));
  return {
    fill: of("fill", "background-color"),
    mark: of("fill", "box-shadow"),
    track: of("track", "background-color"),
    boundary: { default: of("track", "box-shadow", false), tinted: of("track", "box-shadow", true) },
  };
}

/** Each pair of R-06 that is not a `checked` row of `pairs` in a theme, as "<fg> on <bg> in <theme>". */
export function missingPairs(pairs: readonly PairEntry[]): string[] {
  return (["light", "dark"] as const).flatMap((theme) =>
    progressPairs
      .filter((pair) => !pairs.some((entry) => entry.theme === theme && entry.fg === pair.fg && entry.bg === pair.bg && entry.status === "checked"))
      .map((pair) => `${pair.fg} on ${pair.bg} in ${theme}`),
  );
}

/** The check: the tokens painted, and R-06's pairs missing from `pairs`. */
export function progressPairsCheck(sheet: string, pairs: readonly PairEntry[]): { readonly painted: Painted; readonly missing: string[] } {
  return { painted: paintedTokens(sheet), missing: [...new Set(missingPairs(pairs))] };
}

/** What R-06 says the stylesheet paints. */
export const expectedPainted: Painted = {
  fill: ["color-accent"],
  mark: ["color-accent-strong"],
  track: ["color-inset"],
  boundary: { default: ["color-control-border"], tinted: ["color-accent-strong"] },
};
