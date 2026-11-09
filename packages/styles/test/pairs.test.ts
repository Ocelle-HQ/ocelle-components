import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildPlan } from "../scripts/build.ts";
import { familyPairings, uncheckedPairings } from "./pairings.ts";
import type { PairEntry } from "./pairings.ts";
import { parse } from "./source-checks.ts";

// The contrast gate covers every colour pairing of the prose and value families (003 spec US3 scenario 6, FR-021,
// research.md R-08, R-10 § Other guards): each pairing of pairings.ts is a `checked` pair of
// packages/tokens/contrast/pairs.json in both themes, so no new contrast pair is needed. The list is tied to the
// stylesheet as shipped (buildPlan(text)[0].content): every colour token base.css sets as a text colour or a ground is
// in the list, and every token of the list is one base.css sets, so a family that adds a colour without its pairing
// fails here. Border colours (`--ocelle-color-rule`, `--ocelle-color-rule-strong`) are decorative and in no pairing
// (constitution II). The guard's plant is a fixture list with `color-link` on `color-chrome`, which is not a pair.
const pairs = JSON.parse(readFileSync(new URL("../../tokens/contrast/pairs.json", import.meta.url), "utf8")) as PairEntry[];
const shipped = parse(buildPlan(readFileSync(new URL("../src/base.css", import.meta.url), "utf8"))[0]?.content ?? "");

/** The colour tokens base.css declares for `property`, each once, without the `--ocelle-` prefix. */
function declared(properties: readonly string[]): string[] {
  const found = new Set<string>();
  shipped.walkDecls((declaration) => {
    if (!properties.includes(declaration.prop)) return;
    for (const match of declaration.value.matchAll(/var\(--ocelle-(color-[a-z-]+)\)/g)) found.add(String(match[1]));
  });
  return [...found].sort();
}

describe("the colour pairings of the prose and value families", () => {
  it("are the colours base.css sets as text, ring and ground, and each is a checked pair in both themes of pairs.json", () => {
    const listed = [...new Set(familyPairings.flatMap((pairing) => [pairing.fg, pairing.bg]))].sort();
    expect(declared(["color", "background-color", "outline-color"])).toEqual(listed);
    expect(uncheckedPairings(pairs, familyPairings)).toEqual([]);
    // R-10 plant: a pairing that is not in the file is reported in both themes.
    expect(uncheckedPairings(pairs, [...familyPairings, { fg: "color-link", bg: "color-chrome" }])).toEqual(["color-link on color-chrome in light", "color-link on color-chrome in dark"]);
  });
});
