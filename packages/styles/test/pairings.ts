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
