import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The repository's pair list packages/tokens/contrast/pairs.json (002 FR-016, FR-017, data-model.md § Contrast
// pair, spec Appendix A.7 to A.9), read as plain JSON: 166 entries in light and 174 in dark (since 014 research.md R-17:
// the six `color-accent-strong` non-text pairs on the main grounds in each theme, the selected bars); the figures #5 records
// (A.7) entered by hand with source "#5", and no other entry claims #5; the excluded pairs exactly those of A.9, each
// with a reason; the state colours on their own grounds recorded from first computation within #5's range 5.3 to 9.4
// (FR-017: [5.25, 9.45)). The gate's own check of every figure is gates/test/contrast.test.ts.
interface Entry {
  readonly theme: string;
  readonly fg: string;
  readonly bg: string;
  readonly kind: string;
  readonly figure: string;
  readonly status: string;
  readonly reason?: string;
  readonly source: string;
}

const text = readFileSync(new URL("../../packages/tokens/contrast/pairs.json", import.meta.url), "utf8");
const entries = JSON.parse(text) as Entry[];
const key = (entry: Pick<Entry, "theme" | "fg" | "bg">): string => `${entry.theme} ${entry.fg} on ${entry.bg}`;

/** A.7, transcribed: theme, foreground, ground, kind, #5 figure. "both (same values)" is one row per theme. */
const a7: readonly (readonly [string, string, string, string, string])[] = [
  ["light", "color-ink", "color-canvas", "text", "16.0"],
  ["light", "color-ink", "color-sheet", "text", "17.8"],
  ["light", "color-ink", "color-accent-low", "text", "14.4"],
  ["light", "color-ink-soft", "color-canvas", "text", "9.7"],
  ["dark", "color-ink-soft", "color-canvas", "text", "11.3"],
  ["light", "color-ink-muted", "color-canvas", "text", "6.1"],
  ["light", "color-ink-muted", "color-sheet", "text", "6.7"],
  ["light", "color-ink-muted", "color-rail", "text", "5.6"],
  ["light", "color-ink-muted", "color-inset", "text", "5.2"],
  ["light", "color-link", "color-canvas", "text", "5.5"],
  ["light", "color-link", "color-sheet", "text", "6.1"],
  ["light", "color-link", "color-rail", "text", "5.0"],
  ["light", "color-chrome-ink", "color-chrome", "text", "15.3"],
  ["light", "color-on-accent", "color-accent", "text", "6.2"],
  ["dark", "color-on-accent", "color-accent", "text", "6.2"],
  ["light", "color-focus", "color-sheet", "non-text", "5.3"],
  ["light", "color-focus", "color-chrome", "non-text", "3.3"],
  ["light", "color-control-border", "color-sheet", "non-text", "3.6"],
  ["light", "color-control-border", "color-rail", "non-text", "3.02"],
  ["light", "color-control-border", "color-accent-low", "non-text", "2.9"],
  ["light", "color-accent", "color-canvas", "text", "2.6"],
];

const stateGrounds = ["color-danger-bg", "color-warning-bg", "color-success-bg", "color-info-bg", "color-neutral-bg"];
/** A.9's excluded pairs. */
const excluded = [
  ...["light", "dark"].flatMap((theme) =>
    ["color-accent-low", "color-inset", "color-hover-bg", ...stateGrounds].map((bg) => `${theme} color-control-border on ${bg}`),
  ),
  "light color-accent on color-canvas",
].sort();

describe("packages/tokens/contrast/pairs.json", () => {
  it("has 166 entries in light and 174 in dark, one entry per line", () => {
    const counts = ["light", "dark"].map((theme) => entries.filter((entry) => entry.theme === theme).length);
    expect(counts).toEqual([166, 174]);
    const lines = text.split("\n");
    expect(lines.filter((line) => line.trimStart().startsWith("{"))).toHaveLength(340);
  });

  it("names each (theme, fg, bg) once", () => {
    expect([entries.length, new Set(entries.map(key)).size]).toEqual([340, 340]);
  });

  it("records every A.7 figure as written in #5, with source #5", () => {
    const found = a7.map(([theme, fg, bg]) => entries.find((entry) => key(entry) === key({ theme, fg, bg })));
    expect(found.map((entry) => (entry === undefined ? undefined : [entry.theme, entry.fg, entry.bg, entry.kind, entry.figure, entry.source]))).toEqual(
      a7.map((row) => [...row, "#5"]),
    );
  });

  it("claims source #5 only for the A.7 figures; every other entry is computed", () => {
    const fromFive = entries.filter((entry) => entry.source === "#5").map(key).sort();
    expect(fromFive).toEqual(a7.map(([theme, fg, bg]) => key({ theme, fg, bg })).sort());
    expect(entries.filter((entry) => entry.source !== "#5").every((entry) => entry.source === "computed")).toBe(true);
  });

  it("records the light color-chrome-muted on color-chrome-hover as computed, 6.22 (SPEC-2-01)", () => {
    const entry = entries.find((e) => key(e) === "light color-chrome-muted on color-chrome-hover");
    expect(entry).toMatchObject({ kind: "text", figure: "6.22", status: "checked", source: "computed" });
  });

  it("excludes exactly the pairs of A.9, each with a reason", () => {
    const listed = entries.filter((entry) => entry.status === "excluded");
    expect(listed.map(key).sort()).toEqual(excluded);
    expect(listed.every((entry) => typeof entry.reason === "string" && entry.reason.trim() !== "")).toBe(true);
    expect(entries.filter((entry) => entry.status !== "excluded").every((entry) => entry.status === "checked")).toBe(true);
  });

  it("records each state colour on its own ground from first computation, within [5.25, 9.45) in both themes (FR-017)", () => {
    const states = ["danger", "warning", "success", "info", "neutral"];
    const rows = ["light", "dark"].flatMap((theme) => states.map((state) => entries.find((e) => key(e) === `${theme} color-${state} on color-${state}-bg`)));
    expect(rows.map((entry) => entry?.source)).toEqual(Array.from({ length: 10 }, () => "computed"));
    expect(rows.every((entry) => entry !== undefined && Number(entry.figure) >= 5.25 && Number(entry.figure) < 9.45)).toBe(true);
  });
});
