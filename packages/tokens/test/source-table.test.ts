import { describe, expect, it } from "vitest";
import { css, json } from "../src/generate.ts";
import { source } from "../src/source.ts";
import { excludedNames, expectedTokens, inTheme, themedGroups } from "./expected.ts";
import type { ExpectedToken } from "./expected.ts";
import { blocks, fontFaceOutline, fourBlocks } from "./stylesheet.ts";

// The generator run on the real token source, compared token by token with spec Appendix A as transcribed in
// expected.ts (data-model.md § Expected tables; PLAN-FRESH-2-002, R-03 *Mutation path*): the stylesheet's declaration
// per theme (for colours the token stream, hex compared case-insensitively; for the others the exact text, derived
// tokens in their reference form, FR-002) and the JSON export's resolved values (FR-008). This test, not the browser
// suites, is what kills the value mutants of source.ts.
const full = (name: string): string => `--ocelle-${name}`;
const sheet = blocks(css(source));
const exported = json(source);

/** An expected ref in the JSON's full-name form, in the same shape. */
function fullRef(ref: ExpectedToken["ref"]): readonly string[] | { light: string[]; dark: string[] } | undefined {
  if (ref === undefined) return undefined;
  if ("light" in ref) return { light: ref.light.map(full), dark: ref.dark.map(full) };
  return ref.map(full);
}

/** A value as compared: colours case-insensitively, everything else exactly. */
function comparable(token: ExpectedToken, value: string | undefined): string | undefined {
  return token.compare === "colour" ? value?.toLowerCase() : value;
}

describe("the stylesheet from the real source", () => {
  it("has the @font-face of research.md R-06, then the four blocks of R-02, in order", () => {
    expect(sheet.outline).toEqual([fontFaceOutline, ...fourBlocks]);
  });

  it("declares exactly the tokens of Appendix A on :root, and none of A.6", () => {
    expect([...sheet.root.keys()].sort()).toEqual(expectedTokens.map((token) => full(token.name)).sort());
    expect(excludedNames.map(full).filter((name) => sheet.root.has(name) || sheet.darkSystem.has(name))).toEqual([]);
  });

  it("declares each token's light value (or its one value) in the unconditioned :root block", () => {
    const declared = Object.fromEntries(expectedTokens.map((token) => [token.name, comparable(token, sheet.root.get(full(token.name)))]));
    const expected = Object.fromEntries(expectedTokens.map((token) => [token.name, comparable(token, inTheme(token.declared, "light"))]));
    expect(declared).toEqual(expected);
  });

  it("declares each theme-dependent token's dark value under both dark selectors, where it differs from light", () => {
    const themed = expectedTokens.filter((token) => themedGroups.includes(token.group));
    const dark = (map: ReadonlyMap<string, string>): Record<string, string | undefined> =>
      Object.fromEntries(themed.map((token) => [token.name, comparable(token, map.get(full(token.name)) ?? sheet.root.get(full(token.name)))]));
    const expected = Object.fromEntries(themed.map((token) => [token.name, comparable(token, inTheme(token.declared, "dark"))]));
    expect(dark(sheet.darkSystem)).toEqual(expected);
    expect(dark(sheet.darkAttribute)).toEqual(expected);
    expect([...sheet.darkSystem.entries()]).toEqual([...sheet.darkAttribute.entries()]);
  });

  it("declares no theme-independent token under the dark selectors", () => {
    const independent = expectedTokens.filter((token) => !themedGroups.includes(token.group)).map((token) => full(token.name));
    expect(independent.filter((name) => sheet.darkSystem.has(name) || sheet.darkAttribute.has(name))).toEqual([]);
    expect(independent.length).toBeGreaterThan(0);
  });

  // 012 (research.md R-07; tasks.md T042): exactly the motion durations, a stricter replacement of "exactly two".
  it("sets exactly the motion durations, motion-fast, motion-base and motion-spin, to 0ms under reduced motion, and not motion-turn or easing-standard (FR-007)", () => {
    expect([...sheet.reducedMotion.entries()]).toEqual([
      ["--ocelle-motion-fast", "0ms"],
      ["--ocelle-motion-base", "0ms"],
      ["--ocelle-motion-spin", "0ms"],
    ]);
  });
});

describe("the JSON export from the real source", () => {
  it("has version 1 and exactly the tokens of Appendix A, none of A.6", () => {
    expect(exported.version).toBe(1);
    expect(exported.tokens.map((token) => token.name).sort()).toEqual(expectedTokens.map((token) => full(token.name)).sort());
    expect(exported.tokens.filter((token) => excludedNames.map(full).includes(token.name))).toEqual([]);
  });

  it("gives each token its group, its resolved value per theme (or its one value) and its references", () => {
    const byName = new Map(exported.tokens.map((token) => [token.name, token]));
    const actual = Object.fromEntries(
      expectedTokens.map((token) => {
        const entry = byName.get(full(token.name));
        if (entry === undefined) return [token.name, undefined];
        const values = "value" in entry ? { value: entry.value } : { light: comparable(token, entry.light), dark: comparable(token, entry.dark) };
        return [token.name, { group: entry.group, ...values, ref: entry.ref }];
      }),
    );
    const expected = Object.fromEntries(
      expectedTokens.map((token) => {
        const values =
          typeof token.resolved === "string"
            ? { value: token.resolved }
            : { light: comparable(token, token.resolved.light), dark: comparable(token, token.resolved.dark) };
        return [token.name, { group: token.group, ...values, ref: fullRef(token.ref) }];
      }),
    );
    expect(actual).toEqual(expected);
  });
});

// 009 (research.md R-16, FR-033): the source's pinned count, 115 tokens of 002 and 003, 011's four eyebrow tokens,
// 008's three (drawer-inline, tooltip-max-inline and tooltip-delay), 009's five (since the merge of 011, 009 uses
// 011's tracking-eyebrow for its uppercase labels and adds no tracking-caps) and, since the merge of 009 into 012,
// 012's seven (color-chrome-active, color-accent-hover, color-hover-border, color-active-bg, focus-offset-inset,
// motion-spin and motion-turn), and the five by name in the generated stylesheet's :root block and the JSON export,
// with their group and value.
describe("009's five tokens (FR-033)", () => {
  const five = [
    { name: "lane-min-width", group: "shell", value: "10rem" },
    { name: "list-track-width", group: "shell", value: "18rem" },
    { name: "list-detail-collapse", group: "shell", value: "40rem" },
    { name: "list-detail-inspector-collapse", group: "shell", value: "60rem" },
    { name: "scroller-fade-size", group: "space", value: "var(--ocelle-space-7)", ref: ["space-7"] },
  ];

  it("pins the source at 134 tokens", () => {
    expect([source.length, exported.tokens.length, sheet.root.size]).toEqual([134, 134, 134]);
  });

  it("has each as a plain record with its group, value and references", () => {
    const records = five.map(({ name }) => source.find((record) => record.name === name));
    expect(records.map((record) => (record === undefined ? undefined : { name: record.name, group: record.group, value: record.value, ...(record.ref === undefined ? {} : { ref: record.ref }) }))).toEqual(five);
  });

  it("declares each on :root in tokens.css and exports it in tokens.json, scroller-fade-size resolved to 2rem", () => {
    expect(five.map(({ name }) => sheet.root.get(full(name)))).toEqual(five.map(({ value }) => value));
    const byName = new Map(exported.tokens.map((token) => [token.name, token]));
    expect(five.map(({ name }) => byName.get(full(name)))).toEqual(
      five.map(({ name, group, value, ref }) => ({ name: full(name), group, value: value === "var(--ocelle-space-7)" ? "2rem" : value, ...(ref === undefined ? {} : { ref: ref.map(full) }) })),
    );
  });
});

// 009 (research.md R-10, PLAN-CORRECTNESS-1-011 (b)): the default board lane is drawn on color-sheet, so color-sheet
// must differ from every ground a board sits on, in both themes. A guard on the existing values: it holds before 009
// and is proven able to fail by a plant (reviews/phase-1/plants.md).
describe("color-sheet as the default lane's ground (R-10)", () => {
  const grounds = ["color-canvas", "color-panel", "color-inspector", "color-pane"];

  it.each(["light", "dark"] as const)("differs from canvas, panel, inspector and pane in %s", (theme) => {
    const value = (name: string): string | undefined => (theme === "light" ? sheet.root : sheet.darkAttribute).get(full(name))?.toLowerCase();
    const lane = value("color-sheet");
    expect(lane).toMatch(/^#[0-9a-f]{6}$/);
    expect(grounds.filter((ground) => value(ground) === lane)).toEqual([]);
    expect(grounds.map((ground) => value(ground))).not.toContain(undefined);
  });
});
