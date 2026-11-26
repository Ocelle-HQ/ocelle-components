import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../scripts/build.ts";
import { dataTableGrounds, dataTablePairings, mainGrounds, uncheckedPairings } from "./pairings.ts";
import type { PairEntry } from "./pairings.ts";
import { parse } from "./source-checks.ts";

// The data table's colours in the contrast gate (019 FR-013; contracts/checks.md § Oracles, contrast source;
// research.md R-13, R-18, R-20; tasks.md T011): every colour token block 1 paints as text or ground (the rules whose
// selector names `ocelle-data-table`, in base.css as shipped) is a token of dataTablePairings or dataTableGrounds and
// back; each ground is one of the nine main grounds; and each text colour on each main ground is a `checked` row of
// packages/tokens/contrast/pairs.json in both themes. A fixture with the `ink-soft` on `inset` rows removed must fail
// the check. Border colours (`rule`, `rule-strong`) are decorative and in no pairing (constitution II).
const pairs = JSON.parse(readFileSync(new URL("../../tokens/contrast/pairs.json", import.meta.url), "utf8")) as PairEntry[];
const shipped = parse(buildPlan(readFileSync(new URL("../src/base.css", import.meta.url), "utf8"))[0]?.content ?? "");

/** The colour tokens the data-table rules declare for `color` and `background-color`, each once, sorted. */
function painted(): string[] {
  const found = new Set<string>();
  shipped.walkDecls((declaration) => {
    const parent = declaration.parent;
    if (parent?.type !== "rule" || !("selector" in parent) || !parent.selector.includes("ocelle-data-table")) return;
    if (!["color", "background-color"].includes(declaration.prop)) return;
    for (const match of declaration.value.matchAll(/var\(--ocelle-(color-[a-z-]+)\)/g)) found.add(String(match[1]));
  });
  return [...found].sort();
}

describe("the data table's colour pairings (R-13)", () => {
  it("are the colours block 1 paints, its grounds are main grounds, each text colour on each main ground is checked in both themes, and a fixture with the ink-soft on inset rows removed is reported", () => {
    const listed = [...new Set([...dataTablePairings.map((pairing) => pairing.fg), ...dataTableGrounds])].sort();
    const removed = pairs.filter((pair) => !(pair.fg === "color-ink-soft" && pair.bg === "color-inset"));
    expect({
      painted: painted(),
      groundsMain: dataTableGrounds.every((ground) => mainGrounds.includes(ground)),
      unchecked: uncheckedPairings(pairs, dataTablePairings),
      removed: uncheckedPairings(removed, dataTablePairings),
    }).toEqual({ painted: listed, groundsMain: true, unchecked: [], removed: ["color-ink-soft on color-inset in light", "color-ink-soft on color-inset in dark"] });
  });
});
