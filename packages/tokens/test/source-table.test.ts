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

  it("sets exactly motion-fast and motion-base to 0ms under reduced motion (FR-007)", () => {
    expect([...sheet.reducedMotion.entries()]).toEqual([
      ["--ocelle-motion-fast", "0ms"],
      ["--ocelle-motion-base", "0ms"],
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
