import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// gates/README.md after 002 (FR-022, US3 scenario 8, SC-007; contracts/gates.md § Plants, "Registry"): the contrast
// and brand-rules gates in "The gates" with their plants, their checks in "Required checks on `main`" (fourteen), the
// delta.json plant form and keyed locations described, and no "Contrast check" row left in "Deferred gates". Since 006
// (FR-023, US4 scenario 4; plan decisions 31 and 32): the storybook-build, visual and axe gates in "The gates" with
// every plant, csp on the packages only (its Storybook plants gone, `pass-storybook-out-of-scope` added) and prefix
// with `fail-storybook-html-multiline-monospace`; no Storybook CSP scope and no exception of 002 left, the prefix
// Storybook scope kept; eighteen required checks; "Deferred gates" without the three gates and with the row of the
// `@ocelle/elements` run-time strict-CSP browser test; and the manifest row naming the first element feature (#17).
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
  it("lists contrast and brand-rules in The gates, with their checks, commands and plants", () => {
    const gates = rows(section("The gates"));
    const row = (id: string): string[] | undefined => gates.find((cells) => cells[0] === `\`${id}\``);
    expect(row("contrast")?.slice(0, 3)).toEqual(["`contrast`", "Contrast", "`pnpm run gate:contrast`"]);
    expect(row("brand-rules")?.slice(0, 3)).toEqual(["`brand-rules`", "Brand rules", "`pnpm run gate:brand-rules`"]);
    for (const plant of ["text-below-threshold", "required-pair-excluded", "empty-list", "unparsable-list", "exempt-disabled-ink"]) expect(row("contrast")?.[4]).toContain(plant);
    for (const plant of ["a-monospace", "b-ochre-pair-not-excluded", "g-forced-colours-override", "g-system-colour-mapping", "source-invalid"]) expect(row("brand-rules")?.[4]).toContain(plant);
  });

  it("names, in the style-lint row, the classified linear-gradient() arguments and their plants (009 contracts/gates.md § `style-lint`, T022)", () => {
    const gates = rows(section("The gates"));
    const row = gates.find((cells) => cells[0] === "`style-lint`");
    expect(row?.slice(0, 3)).toEqual(["`style-lint`", "Style lint", "`pnpm run gate:style-lint`"]);
    expect(row?.[3] ?? "").toContain("since 009 the arguments of `linear-gradient()` are classified as at the top level of a value, and every other gradient function is raw whole");
    const plants = ["pass-linear-gradient-tokens", "fail-gradient-hex", "fail-gradient-angle", "fail-gradient-length", "fail-radial-gradient"];
    expect(plants.filter((plant) => !(row?.[4] ?? "").includes(plant))).toEqual([]);
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

  it("requires eighteen checks on main: main's fifteen and Storybook build, Visual regression and Accessibility (006 FR-023, plan decision 31)", () => {
    const required = section("Required checks on `main`");
    expect(required).toContain("requires exactly these eighteen checks");
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
      "Storybook build",
      "Visual regression",
      "Accessibility",
      "Plants",
    ]);
  });

  it("has no Contrast check, Custom-elements manifest check, Storybook gate or @ocelle/elements run-time strict-CSP row in Deferred gates, and says mission 005 (#17) delivered that test in packages/elements/test/browser/serve.ts (006 FR-023, plan decision 33)", () => {
    const text = section("Deferred gates (FR-026)");
    expect(rows(text)).toEqual([
      ["Gate", "Delivered by"],
      ["Remote loads in built output (constitution IV, beyond FR-021)", "the first element feature"],
    ]);
    const prose = text.replace(/\s+/g, " ");
    expect(prose).toContain("mission 005 (#17)");
    expect(prose).toContain("`packages/elements/test/browser/serve.ts`");
    expect(readme).not.toContain("(#17 or #7)");
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

describe("gates/README.md (006 FR-023)", () => {
  const gates = (): string[][] => rows(section("The gates"));
  const row = (id: string): string[] | undefined => gates().find((cells) => cells[0] === `\`${id}\``);
  const plants = (id: string): string[] => readdirSync(new URL(`../plants/${id}/`, import.meta.url)).sort();

  it.each([
    { id: "storybook-build", check: "Storybook build", command: "`pnpm run gate:storybook-build`" },
    { id: "visual", check: "Visual regression", command: "`pnpm run gate:visual -- --engine both --remove-docker-image`" },
    { id: "axe", check: "Accessibility", command: "`pnpm run gate:axe`" },
  ])("lists $id in The gates with its check, its command and every plant of gates/plants/$id/", ({ id, check, command }) => {
    expect(row(id)?.slice(0, 3)).toEqual([`\`${id}\``, check, command]);
    expect(plants(id).length).toBeGreaterThan(0);
    expect(plants(id).filter((plant) => !(row(id)?.[4] ?? "").includes(`\`${plant}\``))).toEqual([]);
  });

  it("gives csp the packages' built output only, with pass-storybook-out-of-scope and none of the removed Storybook plants", () => {
    const csp = row("csp");
    expect(csp?.slice(0, 4)).toEqual([
      "`csp`",
      "Content security",
      '`pnpm --filter "./packages/*" -r build && pnpm run gate:csp`',
      "built output of the three packages only (`packages/*/dist/`); since 006 (FR-020) no Storybook file",
    ]);
    expect(csp?.[4]).toContain("`pass-storybook-out-of-scope`");
    const removed = [
      "fail-storybook-inline-script",
      "fail-storybook-preview-new-function",
      "fail-storybook-scripts-eval",
      "fail-storybook-story-style-attribute",
      "pass-storybook-external-script",
      "pass-storybook-scripts-tag-names",
      "error-storybook-unparsable-ts",
    ];
    expect(removed.filter((plant) => readme.includes(plant))).toEqual([]);
  });

  it("gives prefix the multi-line monospace plant of a Storybook HTML entry", () => {
    expect(row("prefix")?.[4]).toContain("`fail-storybook-html-multiline-monospace`");
  });

  it("names the first element feature (#17) in the manifest row", () => {
    expect(row("manifest")?.[3]).toContain("since 005 (#17, the first element feature; FR-009)");
  });

  it("keeps the Storybook scope of prefix and drops the Storybook CSP scope and 002's two exceptions", () => {
    const prefixScope = section("The Storybook scope of `prefix` (002 FR-023, 006 FR-022)");
    expect(prefixScope).toContain("`storybook/dist/*.html`");
    expect(section("The Storybook scope of `csp` and `prefix` (002 FR-023)")).toBe("");
    expect(["narrows SPEC-1-05", "connect-src 'self'", "The Storybook page's header", "The narrowed static scope"].filter((text) => readme.includes(text))).toEqual([]);
  });
});

describe("gates/README.md (013 R-10)", () => {
  it("states the style-lint allowance of fit-content(<percentage>) and minmax(0, <flex>) in grid-template-columns only, with its plants pass-grid-fit-content, fail-fit-content-length and fail-minmax-auto", () => {
    const row = rows(section("The gates")).find((cells) => cells[0] === "`style-lint`") ?? [];
    const check = row[3] ?? "";
    const plants = row[4] ?? "";
    expect({
      allowance: ["`fit-content(<percentage>)`", "`minmax(0, <flex>)`", "`grid-template-columns`"].filter((text) => !check.includes(text)),
      plants: ["pass-grid-fit-content", "fail-fit-content-length", "fail-minmax-auto"].filter((plant) => !plants.includes(plant)),
      directories: ["pass-grid-fit-content", "fail-fit-content-length", "fail-minmax-auto"].filter((plant) => !readdirSync(new URL("../plants/style-lint/", import.meta.url)).includes(plant)),
    }).toEqual({ allowance: [], plants: [], directories: [] });
  });
});

describe("gates/README.md (013 R-10, phase 3)", () => {
  it("states the style-lint allowance of translateX(<percentage>) in transform and a bare positive integer in animation-iteration-count, with its plants pass-translate-percentage, fail-translate-length, pass-iteration-count and fail-iteration-count-fraction", () => {
    const row = rows(section("The gates")).find((cells) => cells[0] === "`style-lint`") ?? [];
    const check = row[3] ?? "";
    const plants = row[4] ?? "";
    const names = ["pass-translate-percentage", "fail-translate-length", "pass-iteration-count", "fail-iteration-count-fraction"];
    expect({
      allowance: ["`translateX(<percentage>)`", "`transform`", "`animation-iteration-count`", "a bare positive integer"].filter((text) => !check.includes(text)),
      plants: names.filter((plant) => !plants.includes(plant)),
      directories: names.filter((plant) => !readdirSync(new URL("../plants/style-lint/", import.meta.url)).includes(plant)),
    }).toEqual({ allowance: [], plants: [], directories: [] });
  });
});
