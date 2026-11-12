import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// gates/README.md after 002 (FR-022, US3 scenario 8, SC-007; contracts/gates.md § Plants, "Registry"): the contrast
// and brand-rules gates in "The gates" with their plants, their checks in "Required checks on `main`" (fourteen), the
// delta.json plant form and keyed locations described, the widened csp and prefix scopes recorded, and no "Contrast
// check" row left in "Deferred gates".
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

/** The text of the section under the `## <title>` heading, up to the next `## ` heading. */
function section(title: string): string {
  const start = readme.indexOf(`\n## ${title}\n`);
  const end = readme.indexOf("\n## ", start + 1);
  return start === -1 ? "" : readme.slice(start, end === -1 ? undefined : end);
}

/** The rows of the first table of a section, as lists of cells. */
function rows(text: string): string[][] {
  return text
    .split("\n")
    .filter((line) => line.startsWith("| ") && !line.startsWith("|---"))
    .map((line) => line.slice(2, -2).split(" | "));
}

describe("gates/README.md (002 FR-022)", () => {
  it("lists contrast and brand-rules in The gates, with their checks, commands and plants, beside the widened csp and prefix scopes (FR-023)", () => {
    const gates = rows(section("The gates"));
    const row = (id: string): string[] | undefined => gates.find((cells) => cells[0] === `\`${id}\``);
    expect(row("contrast")?.slice(0, 3)).toEqual(["`contrast`", "Contrast", "`pnpm run gate:contrast`"]);
    expect(row("brand-rules")?.slice(0, 3)).toEqual(["`brand-rules`", "Brand rules", "`pnpm run gate:brand-rules`"]);
    for (const plant of ["text-below-threshold", "required-pair-excluded", "empty-list", "unparsable-list", "exempt-disabled-ink"]) expect(row("contrast")?.[4]).toContain(plant);
    expect(section("The Storybook scope of `csp` and `prefix` (002 FR-023)")).toContain("narrows SPEC-1-05");
    for (const plant of ["a-monospace", "b-ochre-pair-not-excluded", "g-forced-colours-override", "g-system-colour-mapping", "source-invalid"]) expect(row("brand-rules")?.[4]).toContain(plant);
  });

  it("lists manifest in The gates, with its check, command and plants (005 FR-009, research.md R-06)", () => {
    const gates = rows(section("The gates"));
    const row = gates.find((cells) => cells[0] === "`manifest`");
    expect(row?.slice(0, 3)).toEqual(["`manifest`", "Custom-elements manifest", "`pnpm run gate:manifest`"]);
    const plants = [
      "fail-stale-property",
      "fail-lost-attribute",
      "fail-undescribed-property",
      "fail-undescribed-attribute",
      "fail-undescribed-event",
      "fail-undescribed-slot",
      "fail-undescribed-css-part",
      "fail-undescribed-css-property",
      "pass-repository",
      "pass-reordered",
      "break-not-json",
      "break-missing",
    ];
    expect(plants.filter((plant) => !(row?.[4] ?? "").includes(plant))).toEqual([]);
  });

  it("requires fifteen checks on main, Contrast, Brand rules and Custom-elements manifest among them (005 research.md R-06)", () => {
    const required = section("Required checks on `main`");
    expect(required).toContain("requires exactly these fifteen checks");
    const listed = required.split("\n").filter((line) => /^\d+\. /.test(line)).map((line) => line.replace(/^\d+\. /, ""));
    expect(listed).toEqual([
      "Typecheck",
      "Code lint",
      "Style lint",
      "Unit tests",
      "Test lint",
      "Mutation testing",
      "Content security",
      "Prefix",
      "Story config copies",
      "Install and pins",
      "Sign-off",
      "Contrast",
      "Brand rules",
      "Custom-elements manifest",
      "Plants",
    ]);
  });

  it("has no Contrast check row and, since 005, no Custom-elements manifest check row in Deferred gates, and keeps the others", () => {
    const deferred = rows(section("Deferred gates (FR-026)")).map((cells) => cells[0]);
    expect(deferred).toEqual([
      "Gate",
      "Storybook build",
      "Visual regression",
      "Accessibility (axe)",
      "Remote loads in built output (constitution IV, beyond FR-021)",
    ]);
  });

  it("describes the delta.json plant form and keyed locations", () => {
    const text = readme.replace(/\s+/g, " ");
    expect(text).toContain("`delta.json`");
    expect(text).toContain("`generator: \"wrapped\"`");
    expect(text).toContain("`packages/tokens/contrast/pairs.json#<theme>/<fg>/<bg>`");
    expect(text).toContain("`packages/tokens/src/source.ts#<name>`");
    expect(text).toContain("`packages/tokens/src/overrides.ts#<name>`");
    expect(text).toContain("`packages/tokens/dist/tokens.css#<text>`");
  });
});
