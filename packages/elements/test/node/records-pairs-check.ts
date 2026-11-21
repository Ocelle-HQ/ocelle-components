// The records elements' pairing check (019 FR-013; contracts/checks.md § Oracles, contrast source; research.md R-13;
// tasks.md T012), one function over a module's text, shared by test/node/records-pairs.test.ts. It reads the colour
// tokens an element's shadow template paints outside forced colours: its own `css` template and, when the element
// adopts it, the overflow-region module's `overflowRegionStyles` (read from src/overflow-region.ts), in the properties
// that paint (`color`, `background-color`, the border colours, `outline` and `outline-color`, `box-shadow`, `fill`,
// `stroke`; never `mask-image`, whose colours are alpha only), and lists the pairs on the nine main grounds that are not
// a `checked` row of packages/tokens/contrast/pairs.json in both themes. Phases 2 and 3 add the timeline and the chain.
// Since phase 2 (R-13: "each decorative line uses a rule token"): a painted rule token (`color-rule`,
// `color-rule-strong`) is a decorative line, listed among the painted tokens but held to no pair (FR-013).
// The pairs are transcribed by hand from R-13, never read from the element source or from pairs.json.
import postcss from "postcss";
import type { AtRule, Rule } from "postcss";

/** One entry of pairs.json, as far as this check reads it. */
export interface PairEntry {
  readonly theme: string;
  readonly fg: string;
  readonly bg: string;
  readonly status: string;
}

/** The nine main grounds. */
export const mainGrounds: readonly string[] = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail", "color-inset", "color-accent-low", "color-hover-bg"];

/**
 * R-13's pairs per element: the data table's template paints only the region's focus ring (`color-focus`, from the
 * overflow-region module); its cells' colours are `@ocelle/styles`' (packages/styles/test/data-table-pairs.test.ts).
 */
export const recordsPainted: Readonly<Record<string, readonly string[]>> = {
  "ocelle-data-table": ["color-focus"],
  // Phase 2 (R-10, R-13): the event paints its time (attribute and slotted) in ink-muted and its content in ink; the
  // timeline paints the dot in ink-muted (structural) and the connector in rule-strong (decorative).
  "ocelle-timeline-event": ["color-ink", "color-ink-muted"],
  "ocelle-event-timeline": ["color-ink-muted", "color-rule-strong"],
};

/** The rule tokens, which only decorative lines paint (R-13): held to no pair. */
export const decorativeTokens: readonly string[] = ["color-rule", "color-rule-strong"];

/** The text of the first `css` tagged template of a module's text; empty when it has none. */
export function styleTemplate(moduleText: string): string {
  return /\bcss\s*`([^`]*)`/.exec(moduleText)?.[1] ?? "";
}

/** The style sheets an element's template holds: its own template, and the module's when its source adopts it. */
export function templateSheets(elementSource: string, regionSource: string): string[] {
  const own = styleTemplate(elementSource);
  const adopted = /\boverflowRegionStyles\b/.test(elementSource) ? [/\boverflowRegionStyles\s*=\s*css\s*`([^`]*)`/.exec(regionSource)?.[1] ?? ""] : [];
  return [own, ...adopted].filter((sheet) => sheet !== "");
}

function inForcedColours(rule: Rule): boolean {
  for (let parent = rule.parent; parent !== undefined && parent.type !== "root"; parent = parent.parent) {
    if (parent.type === "atrule" && (parent as AtRule).name === "media") {
      const query = (parent as AtRule).params.replace(/\s+/g, " ").trim();
      if (/forced-colors:\s*active/.test(query) && !/^not\b/.test(query)) return true;
    }
  }
  return false;
}

const painting = /^(color|background-color|background|border(-[a-z-]+)?-color|border(-[a-z-]+)?|outline|outline-color|box-shadow|fill|stroke)$/;

/** The colour tokens the sheets paint outside forced colours, each once, sorted, without the `--ocelle-` prefix. */
export function paintedTokens(sheets: readonly string[]): string[] {
  const found = new Set<string>();
  for (const sheet of sheets) {
    postcss.parse(sheet).walkRules((rule) => {
      if (inForcedColours(rule)) return;
      rule.walkDecls((declaration) => {
        if (!painting.test(declaration.prop)) return;
        for (const match of declaration.value.matchAll(/var\(\s*--ocelle-(color-[a-z-]+)/g)) found.add(String(match[1]));
      });
    });
  }
  return [...found].sort();
}

/** The painted tokens and each pair on a main ground that is not checked in a theme, as "<fg> on <bg> in <theme>". */
export function recordsPairsCheck(sheets: readonly string[], pairs: readonly PairEntry[]): { readonly painted: string[]; readonly missing: string[] } {
  const painted = paintedTokens(sheets);
  const missing = painted.filter((fg) => !decorativeTokens.includes(fg)).flatMap((fg) =>
    mainGrounds.flatMap((bg) => ["light", "dark"].filter((theme) => !pairs.some((pair) => pair.theme === theme && pair.fg === fg && pair.bg === bg && pair.status === "checked")).map((theme) => `${fg} on ${bg} in ${theme}`)),
  );
  return { painted, missing };
}
