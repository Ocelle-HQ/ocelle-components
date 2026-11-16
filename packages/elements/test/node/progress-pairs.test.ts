import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { source as tokenSource } from "../../../tokens/src/source.ts";
import { expectedPainted, progressPairsCheck, styleTemplate } from "./progress-pairs-check.ts";
import type { PairEntry } from "./progress-pairs-check.ts";

// The progress bar's colour pairs (013 FR-036, SC-004; research.md R-06 § Contrast; contracts/checks.md § Contrast;
// tasks.md T041), on the element source: `ocelle-progress.ts`'s style template paints the fill in `color-accent` with
// its edge in `color-accent-strong`, the track in `color-inset`, and the track's boundary in `color-control-border`
// and, under `ground="tinted"`, in `color-accent-strong`; `color-focus`'s `ref` in packages/tokens/src/source.ts is
// `color-accent-strong` in both themes (so its rows check the mark on the main grounds); and every pair the bar makes,
// on the grounds the README assigns to each `ground` value, is a `checked` row of packages/tokens/contrast/pairs.json in
// both themes. In the same test the check runs on a copy of pairs.json without the light `color-accent-strong` on
// `color-inset` row and reports it. The built stylesheet is checked the same way in test/build/build.test.ts.
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");
const pairs = JSON.parse(read("../../../tokens/contrast/pairs.json")) as PairEntry[];
const withoutTrackRow = pairs.filter((entry) => !(entry.theme === "light" && entry.fg === "color-accent-strong" && entry.bg === "color-inset"));
const sheet = styleTemplate(read("../../src/ocelle-progress.ts"));

describe("the progress bar's colour pairs (FR-036, SC-004)", () => {
  it("paints the mark and edge in color-accent-strong, the track in color-inset and its boundary in color-control-border or, tinted, color-accent-strong, finds every pair checked, and reports the row removed from a copy", () => {
    expect(progressPairsCheck(sheet, pairs)).toEqual({ painted: expectedPainted, missing: [] });
    expect(progressPairsCheck(sheet, withoutTrackRow)).toEqual({ painted: expectedPainted, missing: ["color-accent-strong on color-inset in light"] });
  });

  it("finds color-focus's ref to be color-accent-strong in both themes in the token source", () => {
    const focus = tokenSource.find((each) => each.name === "color-focus");
    expect(focus?.ref).toEqual({ light: ["color-accent-strong"], dark: ["color-accent-strong"] });
  });
});
