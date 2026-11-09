import { describe, expect, it } from "vitest";
import { source } from "../../packages/tokens/src/source.ts";
import { requiredPairs } from "../lib/token-source.ts";
import type { RequiredPair } from "../lib/token-source.ts";

// The required pair set (002 FR-016, spec Appendix A.8, research.md R-07, PLAN-TESTABILITY-1-002): derived from the
// intended grounds of the real token source, it must equal A.8 as transcribed by hand below, 149 (fg, bg, kind)
// triples per theme. Removing a ground from source.ts, or a mutant doing so, fails this test even though the gate
// would still pass on a pair list that lacks the pair.
const main = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail", "color-inset", "color-accent-low", "color-hover-bg"];
const stateGrounds = ["color-danger-bg", "color-warning-bg", "color-success-bg", "color-info-bg", "color-neutral-bg"];

/** A.8, row by row: foregrounds, kind, intended grounds. */
const a8: readonly (readonly [readonly string[], "text" | "non-text", readonly string[]])[] = [
  [
    [
      "color-ink",
      "color-ink-soft",
      "color-ink-muted",
      "color-link",
      "color-link-hover",
      "color-disabled-ink",
      "color-danger",
      "color-warning",
      "color-success",
      "color-info",
      "color-neutral",
    ],
    "text",
    main,
  ],
  [["color-danger"], "text", ["color-danger-bg"]],
  [["color-warning"], "text", ["color-warning-bg"]],
  [["color-success"], "text", ["color-success-bg"]],
  [["color-info"], "text", ["color-info-bg"]],
  [["color-neutral"], "text", ["color-neutral-bg"]],
  [["color-disabled-ink"], "text", ["color-disabled-bg"]],
  [["color-chrome-ink", "color-chrome-muted"], "text", ["color-chrome", "color-chrome-hover"]],
  [["color-on-accent"], "text", ["color-accent"]],
  [["color-link"], "text", stateGrounds],
  [["color-focus"], "non-text", [...main, "color-chrome", "color-chrome-hover"]],
  [["color-focus"], "non-text", stateGrounds],
  [["color-current"], "non-text", ["color-chrome", "color-chrome-hover", "color-rail", "color-accent-low"]],
  [["color-control-border"], "non-text", ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail"]],
  [["color-accent-strong"], "non-text", ["color-accent-low", "color-inset", "color-hover-bg"]],
  [["color-accent-strong"], "non-text", stateGrounds],
];

function triples(pairs: readonly { fg: string; bg: string; kind: string }[]): string[] {
  return pairs.map((pair) => `${pair.fg} on ${pair.bg} (${pair.kind})`).sort();
}

const expected = triples(a8.flatMap(([fgs, kind, grounds]) => fgs.flatMap((fg) => grounds.map((bg) => ({ fg, bg, kind })))));

describe("requiredPairs on the real token source (spec A.8)", () => {
  const inTheme = (theme: string): RequiredPair[] => requiredPairs(source).filter((pair) => pair.theme === theme);

  it("is the 149 triples of A.8 in light", () => {
    expect(expected).toHaveLength(149);
    expect(triples(inTheme("light"))).toEqual(expected);
  });

  it("is the 149 triples of A.8 in dark", () => {
    expect(triples(inTheme("dark"))).toEqual(expected);
  });

  it("holds 298 pairs, each once", () => {
    const required = requiredPairs(source);
    expect(new Set(required.map((pair) => `${pair.theme} ${pair.fg} ${pair.bg} ${pair.kind}`)).size).toBe(298);
    expect(required).toHaveLength(298);
  });
});

describe("requiredPairs on fixture records", () => {
  it("lists each token with contrast, each ground, each theme, in source order, and ignores tokens without contrast", () => {
    const records = [
      { name: "color-a", group: "colour", value: { light: "#FFFFFF", dark: "#000000" } },
      { name: "color-b", group: "colour", value: { light: "#000000", dark: "#FFFFFF" }, contrast: { kind: "text", grounds: ["color-a", "color-c"] } },
      { name: "color-c", group: "colour", value: { light: "#EEEEEE", dark: "#111111" } },
      { name: "color-d", group: "colour", value: { light: "#777777", dark: "#888888" }, contrast: { kind: "non-text", grounds: ["color-c"], exempt: true } },
    ] as const;
    expect(requiredPairs(records)).toEqual([
      { theme: "light", fg: "color-b", bg: "color-a", kind: "text" },
      { theme: "dark", fg: "color-b", bg: "color-a", kind: "text" },
      { theme: "light", fg: "color-b", bg: "color-c", kind: "text" },
      { theme: "dark", fg: "color-b", bg: "color-c", kind: "text" },
      { theme: "light", fg: "color-d", bg: "color-c", kind: "non-text" },
      { theme: "dark", fg: "color-d", bg: "color-c", kind: "non-text" },
    ]);
  });
});
