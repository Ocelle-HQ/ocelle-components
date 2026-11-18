// The colour pairings of the prose and value families (003 research.md R-08, spec US3 scenario 6, FR-021): each
// foreground token on each ground token that the families create, nesting included. FR-021 forbids a pairing that is
// not a `checked` pair of packages/tokens/contrast/pairs.json in both themes; pairs.test.ts checks this list against
// that file and against the colours base.css declares. Transcribed by hand from R-08, never read from base.css.

/** A foreground colour token on a ground colour token, both without the `--ocelle-` prefix. */
export interface Pairing {
  readonly fg: string;
  readonly bg: string;
}

/** R-08's pairings: what the prose and value families put on which ground. */
export const familyPairings: readonly Pairing[] = [
  // a link at rest and on hover, in running text and around or inside code
  { fg: "color-link", bg: "color-canvas" },
  { fg: "color-link-hover", bg: "color-canvas" },
  { fg: "color-link", bg: "color-inset" },
  { fg: "color-link-hover", bg: "color-inset" },
  // code, a block quote, and code in a block quote
  { fg: "color-ink", bg: "color-inset" },
  { fg: "color-ink-soft", bg: "color-canvas" },
  { fg: "color-ink-soft", bg: "color-inset" },
  // the value style (the value hook is for the main grounds only)
  { fg: "color-ink-muted", bg: "color-canvas" },
  // the focus ring on a prose link, table or code
  { fg: "color-focus", bg: "color-canvas" },
  { fg: "color-focus", bg: "color-inset" },
];

/** One entry of pairs.json, as far as this check reads it. */
export interface PairEntry {
  readonly theme: string;
  readonly fg: string;
  readonly bg: string;
  readonly status: string;
}

/** Each pairing that is not a `checked` pair of `pairs` in light and in dark, as "<fg> on <bg> in <theme>". */
export function uncheckedPairings(pairs: readonly PairEntry[], pairings: readonly Pairing[]): string[] {
  return pairings.flatMap((pairing) =>
    ["light", "dark"]
      .filter((theme) => !pairs.some((pair) => pair.theme === theme && pair.fg === pairing.fg && pair.bg === pairing.bg && pair.status === "checked"))
      .map((theme) => `${pairing.fg} on ${pairing.bg} in ${theme}`),
  );
}

/** The nine main grounds (002's contrast table; the value hook's and the data table's grounds). */
export const mainGrounds: readonly string[] = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail", "color-inset", "color-accent-low", "color-hover-bg"];

/**
 * 019 (contracts/styles-data-table.md § Block 1; research.md R-06, R-13, R-18, R-20): the data table's text colours
 * (body cells `ink-soft`, column headers `eyebrow`, row headers and the caption `ink`) on each of the nine main grounds,
 * the three grounds block 1 paints (`sheet` for the pinned header, `inset` for the stripe, `hover-bg` for the hover)
 * among them. Transcribed by hand from R-06, never read from base.css.
 */
export const dataTablePairings: readonly Pairing[] = ["color-ink-soft", "color-eyebrow", "color-ink"].flatMap((fg) => mainGrounds.map((bg) => ({ fg, bg })));

/** The grounds block 1 paints. */
export const dataTableGrounds: readonly string[] = ["color-hover-bg", "color-inset", "color-sheet"];
