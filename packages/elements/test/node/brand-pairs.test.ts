import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { brandPairs, fr026Foregrounds, styleTemplate } from "./brand-pairs-check.ts";
import type { PairEntry } from "./brand-pairs-check.ts";

// The mark's colour pairs (005 spec US4 scenario 4, FR-026, SC-005; research.md R-09; T054), on the element source:
// the colour tokens `ocelle-brand-mark.ts`'s style template paints for each variant are exactly the foregrounds FR-026
// names (`color-ink` and `color-accent` for the default, `color-chrome-ink` and `color-accent` for the chrome variant,
// none for mono), and every pair of FR-026 is a `checked` row of packages/tokens/contrast/pairs.json in each theme it
// names. In the same test the check runs on its planted defect, fixtures/pairs-missing-row.json, a copy of pairs.json
// with the dark `color-accent` on `color-chrome` row removed, and reports that pair and theme. The built stylesheet
// is checked the same way in test/build/build.test.ts.
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");
const pairs = JSON.parse(read("../../../tokens/contrast/pairs.json")) as PairEntry[];
const missingRow = JSON.parse(read("./fixtures/pairs-missing-row.json")) as PairEntry[];
const source = styleTemplate(read("../../src/ocelle-brand-mark.ts"));

describe("the mark's colour pairs (US4-4, FR-026)", () => {
  it("paints exactly FR-026's tokens per variant, finds every FR-026 pair checked in pairs.json, and reports the dark color-accent on color-chrome row missing from the planted copy", () => {
    expect(brandPairs(source, pairs)).toEqual({ painted: fr026Foregrounds, missing: [] });
    expect(brandPairs(source, missingRow)).toEqual({ painted: fr026Foregrounds, missing: ["color-accent on color-chrome in dark"] });
  });
});
