import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { recordsPainted, recordsPairsCheck, templateSheets } from "./records-pairs-check.ts";
import type { PairEntry } from "./records-pairs-check.ts";

// The records elements' colour pairs (019 FR-013; contracts/checks.md § Oracles, contrast source; research.md R-13;
// tasks.md T012), on the element source: every colour the data table's template paints (its own styles and the
// overflow-region module's stylesheet it adopts) is tied to a `checked` row of packages/tokens/contrast/pairs.json on
// the nine main grounds in both themes. In the same test the check runs on a copy of pairs.json without the light
// `color-focus` on `color-inset` row and reports it. Phases 2 and 3 add the timeline and the chain.
const read = (path: string): string => readFileSync(new URL(path, import.meta.url), "utf8");
const pairs = JSON.parse(read("../../../tokens/contrast/pairs.json")) as PairEntry[];
const withoutRow = pairs.filter((entry) => !(entry.theme === "light" && entry.fg === "color-focus" && entry.bg === "color-inset"));
const region = read("../../src/overflow-region.ts");

describe("the records elements' colour pairs (FR-013, R-13)", () => {
  it("ocelle-data-table: its template paints the region's focus ring in color-focus, checked on every main ground in both themes; a removed row is reported", () => {
    const sheets = templateSheets(read("../../src/ocelle-data-table.ts"), region);
    expect({ checked: recordsPairsCheck(sheets, pairs), removed: recordsPairsCheck(sheets, withoutRow).missing }).toEqual({
      checked: { painted: recordsPainted["ocelle-data-table"], missing: [] },
      removed: ["color-focus on color-inset in light"],
    });
  });
});
