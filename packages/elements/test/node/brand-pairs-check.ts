// The mark's pairing check (005 spec US4 scenario 4, FR-026, SC-005; research.md R-09; analysis L5; T054, T055), one
// function over a stylesheet text, shared by test/node/brand-pairs.test.ts (the source template, in process, mutated)
// and test/build/build.test.ts (the `css` template of the built dist/ocelle-brand-mark.js, the stylesheet as shipped).
// It reads the colour tokens the stylesheet paints for each variant outside forced colours, and lists the pairs of
// FR-026 that are not a `checked` row of packages/tokens/contrast/pairs.json in the theme FR-026 names. The pairs of
// FR-026 are transcribed by hand from the spec, never read from the element source or from pairs.json.
import postcss from "postcss";
import type { Rule } from "postcss";

/** One entry of pairs.json, as far as this check reads it. */
export interface PairEntry {
  readonly theme: string;
  readonly fg: string;
  readonly bg: string;
  readonly status: string;
}

/** A foreground token on a ground token in a theme, all without the `--ocelle-` prefix. */
export interface Pair {
  readonly theme: "light" | "dark";
  readonly fg: string;
  readonly bg: string;
}

/** The variants the stylesheet paints: the default for the main grounds, `ground="chrome"` and `tone="mono"`. */
export type Variant = "default" | "chrome" | "mono";

const mainGrounds = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail", "color-inset", "color-accent-low", "color-hover-bg"];
const chromeGrounds = ["color-chrome", "color-chrome-hover"];
const themes = ["light", "dark"] as const;

/**
 * FR-026's pairs: `color-ink` on each main ground and `color-chrome-ink` on each chrome ground in both themes,
 * `color-accent` on each chrome ground in both themes, and `color-accent` on each main ground in the dark theme.
 */
export const fr026Pairs: readonly Pair[] = [
  ...themes.flatMap((theme) => mainGrounds.map((bg) => ({ theme, fg: "color-ink", bg }))),
  ...themes.flatMap((theme) => chromeGrounds.map((bg) => ({ theme, fg: "color-chrome-ink", bg }))),
  ...themes.flatMap((theme) => chromeGrounds.map((bg) => ({ theme, fg: "color-accent", bg }))),
  ...mainGrounds.map((bg) => ({ theme: "dark" as const, fg: "color-accent", bg })),
];

/** The foregrounds FR-026 names for each variant; mono paints `currentColor` and no token. */
export const fr026Foregrounds: Readonly<Record<Variant, readonly string[]>> = {
  default: ["color-accent", "color-ink"],
  chrome: ["color-accent", "color-chrome-ink"],
  mono: [],
};

/** The text of the first `css` tagged template of a module's text, source or built; empty when it has none. */
export function styleTemplate(moduleText: string): string {
  return /\bcss`([^`]*)`/.exec(moduleText)?.[1] ?? "";
}

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

/** The variant a selector is limited to, or undefined when it applies to every variant. */
function limitedTo(selector: string): Variant | undefined {
  if (selector.includes(':host([tone="mono"])')) return "mono";
  if (selector.includes(':host([ground="chrome"])')) return "chrome";
  return undefined;
}

/** The part a selector paints: the ring (`.ring`) or the spot (`.spot`), by its last compound; else undefined. */
function partOf(selector: string): "ring" | "spot" | undefined {
  const last = selector.trim().split(/\s+/).at(-1) ?? "";
  if (last.endsWith(".ring")) return "ring";
  if (last.endsWith(".spot")) return "spot";
  return undefined;
}

/**
 * The colour tokens the stylesheet paints for each variant outside forced colours, each list sorted: for each part and
 * its paint property (the ring's `stroke`, the spot's `fill`), the declaration of the last rule that applies to the
 * variant, a rule limited to the variant winning over one for every variant, as the cascade gives it.
 */
export function paintedTokens(sheet: string): Record<Variant, string[]> {
  const declarations: { readonly part: "ring" | "spot"; readonly property: string; readonly variant: Variant | undefined; readonly value: string }[] = [];
  postcss.parse(sheet).walkRules((rule) => {
    if (inForcedColours(rule)) return;
    for (const selector of rule.selectors) {
      const part = partOf(selector);
      if (part === undefined) continue;
      rule.walkDecls((declaration) => {
        declarations.push({ part, property: declaration.prop, variant: limitedTo(selector), value: declaration.value });
      });
    }
  });
  const paints = { ring: "stroke", spot: "fill" } as const;
  const tokens = (variant: Variant): string[] => {
    const found = new Set<string>();
    for (const [part, property] of Object.entries(paints)) {
      const applying = declarations.filter((each) => each.part === part && each.property === property && (each.variant === undefined || each.variant === variant));
      const limited = applying.filter((each) => each.variant === variant);
      const winner = (limited.length > 0 ? limited : applying).at(-1);
      for (const match of winner?.value.matchAll(/var\(\s*--ocelle-(color-[a-z-]+)/g) ?? []) found.add(String(match[1]));
    }
    return [...found].sort();
  };
  return { default: tokens("default"), chrome: tokens("chrome"), mono: tokens("mono") };
}

/** Each pair of FR-026 that is not a `checked` row of `pairs`, as "<fg> on <bg> in <theme>". */
export function missingPairs(pairs: readonly PairEntry[]): string[] {
  return fr026Pairs
    .filter((pair) => !pairs.some((entry) => entry.theme === pair.theme && entry.fg === pair.fg && entry.bg === pair.bg && entry.status === "checked"))
    .map((pair) => `${pair.fg} on ${pair.bg} in ${pair.theme}`);
}

/** The check of US4 scenario 4: the tokens painted per variant, and the FR-026 pairs missing from `pairs`. */
export function brandPairs(sheet: string, pairs: readonly PairEntry[]): { readonly painted: Record<Variant, string[]>; readonly missing: string[] } {
  return { painted: paintedTokens(sheet), missing: missingPairs(pairs) };
}
