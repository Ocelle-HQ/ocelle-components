import { describe, expect, it } from "vitest";
import { validateSource } from "../src/generate.ts";
import type { TokenRecord } from "../src/generate.ts";
import { source } from "../src/source.ts";
import { fixture, withAdded, withRecord } from "./fixture.ts";

// validateSource() (data-model.md § Token, *Validation*): each rule fails with one message naming the token and the
// rule, all of them in one error, "invalid token source: <problem>; <problem>". The build, the gates and this test use
// it; a gate exits 2 on it.
const ink = (value: TokenRecord["value"], rest: Partial<TokenRecord> = {}): TokenRecord => ({ name: "color-ink", group: "colour", value, ...rest });
const focus = (light: string, dark: string, ref: { light: string[]; dark: string[] }): TokenRecord => ({
  name: "color-focus",
  group: "colour",
  value: { light, dark },
  ref,
});

describe("validateSource() accepts", () => {
  it("the fixture source", () => {
    expect(() => {
      validateSource(fixture);
    }).not.toThrow();
  });

  it("the real source", () => {
    expect(() => {
      validateSource(source);
    }).not.toThrow();
  });
});

const cases: readonly { readonly rule: string; readonly records: readonly TokenRecord[]; readonly problems: readonly string[] }[] = [
  {
    rule: "for a name that is not lower-case words joined by hyphens",
    records: withAdded({ name: "Color_A", group: "colour", value: { light: "#000000", dark: "#000000" } }),
    problems: ["token Color_A: name is not lower-case words joined by hyphens"],
  },
  {
    rule: "for a duplicate name",
    records: withAdded(ink({ light: "#111111", dark: "#EEEEEE" })),
    problems: ["token color-ink: duplicate name"],
  },
  {
    rule: "for a ref naming an unknown token",
    records: withRecord("gutter", { name: "gutter", group: "space", value: "var(--ocelle-space-9)", ref: ["space-9"] }),
    problems: ["token gutter: ref names an unknown token space-9"],
  },
  {
    rule: "for a ground naming an unknown token",
    records: withRecord("color-ink", ink({ light: "#111111", dark: "#EEEEEE" }, { contrast: { kind: "text", grounds: ["color-zz"] } })),
    problems: ["token color-ink: ground names an unknown token color-zz"],
  },
  {
    rule: "for a ref that lacks a reference of the value",
    records: withRecord("gutter", { name: "gutter", group: "space", value: "var(--ocelle-space-4)", ref: [] }),
    problems: ["token gutter: ref [] is not the set of references in the value [space-4]"],
  },
  {
    rule: "for a derived token without ref",
    records: withRecord("gutter", { name: "gutter", group: "space", value: "var(--ocelle-space-4)" }),
    problems: ["token gutter: ref [] is not the set of references in the value [space-4]"],
  },
  {
    rule: "for a ref that names a token the value does not reference",
    records: withRecord("gutter", { name: "gutter", group: "space", value: "var(--ocelle-space-4)", ref: ["space-4", "dialog-max"] }),
    problems: ["token gutter: ref [space-4, dialog-max] is not the set of references in the value [space-4]"],
  },
  {
    rule: "for a ref that does not match the value of the same theme",
    records: withRecord("elevation-raised", {
        name: "elevation-raised",
        group: "elevation",
        value: { light: "0 2px 4px rgb(0 0 0 / 0.1)", dark: "0 0 0 1px var(--ocelle-color-ink)" },
        ref: { light: ["color-ink"], dark: [] },
      }),
    problems: ["token elevation-raised: light ref [color-ink] is not the set of references in the light value []", "token elevation-raised: dark ref [] is not the set of references in the dark value [color-ink]"],
  },
  {
    rule: "for a ref that names a reference twice",
    records: withRecord("gutter", { name: "gutter", group: "space", value: "var(--ocelle-space-4)", ref: ["space-4", "space-4"] }),
    problems: ["token gutter: ref [space-4, space-4] is not the set of references in the value [space-4]"],
  },
  {
    rule: "for a ref that lacks one of several references of the value, naming them all",
    records: withAdded({ name: "bar", group: "shell", value: "calc(var(--ocelle-gutter) + var(--ocelle-space-4))", ref: ["gutter"] }),
    problems: ["token bar: ref [gutter] is not the set of references in the value [gutter, space-4]"],
  },
  {
    rule: "for a per-theme ref naming an unknown token, in either theme",
    records: withRecord("elevation-raised", {
        name: "elevation-raised",
        group: "elevation",
        value: { light: "0 2px 4px var(--ocelle-color-yy)", dark: "0 0 0 1px var(--ocelle-color-zz)" },
        ref: { light: ["color-yy"], dark: ["color-zz"] },
      }),
    problems: ["token elevation-raised: ref names an unknown token color-yy", "token elevation-raised: ref names an unknown token color-zz"],
  },
  {
    rule: "for a ref per theme on a value that is not, and the reverse",
    records: withRecord("gutter", { name: "gutter", group: "space", value: "var(--ocelle-space-4)", ref: { light: ["space-4"], dark: ["space-4"] } }).map((record) =>
        record.name === "elevation-raised" ? { ...record, ref: ["color-ink"] } : record,
      ),
    problems: ["token gutter: ref is per theme but the value is not", "token elevation-raised: value is per theme but the ref is not"],
  },
  {
    rule: "for a reference cycle",
    records: withAdded(
        { name: "loop-a", group: "space", value: "var(--ocelle-loop-b)", ref: ["loop-b"] },
        { name: "loop-b", group: "space", value: "calc(2 * var(--ocelle-loop-a))", ref: ["loop-a"] },
        { name: "loop-c", group: "space", value: "var(--ocelle-loop-c)", ref: ["loop-c"] },
      ),
    problems: ["token loop-a: reference cycle loop-a -> loop-b -> loop-a", "token loop-b: reference cycle loop-b -> loop-a -> loop-b", "token loop-c: reference cycle loop-c -> loop-c"],
  },
  {
    rule: "for a cycle that does not pass through the token that reaches it, only on the tokens on it",
    records: withAdded(
        { name: "lead-1", group: "space", value: "var(--ocelle-loop-a)", ref: ["loop-a"] },
        { name: "loop-a", group: "space", value: "var(--ocelle-loop-b)", ref: ["loop-b"] },
        { name: "loop-b", group: "space", value: "var(--ocelle-loop-a)", ref: ["loop-a"] },
      ),
    problems: ["token loop-a: reference cycle loop-a -> loop-b -> loop-a", "token loop-b: reference cycle loop-b -> loop-a -> loop-b"],
  },
  {
    rule: "for a cycle reached through a later reference, after one that ends",
    records: withAdded(
        { name: "loop-a", group: "space", value: "calc(var(--ocelle-space-4) + var(--ocelle-loop-b))", ref: ["space-4", "loop-b"] },
        { name: "loop-b", group: "space", value: "var(--ocelle-loop-a)", ref: ["loop-a"] },
      ),
    problems: ["token loop-a: reference cycle loop-a -> loop-b -> loop-a", "token loop-b: reference cycle loop-b -> loop-a -> loop-b"],
  },
  {
    rule: "for a duplicate name, taking the references of the first record of the name (no cycle through the second)",
    records: withAdded({ name: "loop-a", group: "space", value: "1px" }, { name: "loop-a", group: "space", value: "var(--ocelle-loop-a)", ref: ["loop-a"] }),
    problems: ["token loop-a: duplicate name"],
  },
  {
    rule: "for a colour value that is not a 6-digit hex",
    records: withRecord("color-ink", ink({ light: "#FFF", dark: "red" })),
    problems: ["token color-ink: light value #FFF is not a 6-digit hex colour or one colour token reference", "token color-ink: dark value red is not a 6-digit hex colour or one colour token reference"],
  },
  {
    rule: "for rgb(… / α) on a colour other than color-overlay",
    records: withRecord("color-ground", { name: "color-ground", group: "colour", value: { light: "rgb(0 0 0 / 0.5)", dark: "#000000" } }),
    problems: ["token color-ground: light value rgb(0 0 0 / 0.5) is not a 6-digit hex colour or one colour token reference"],
  },
  {
    rule: "for a color-overlay value that is neither rgb(… / α) nor a hex nor a reference",
    records: withRecord("color-overlay", { name: "color-overlay", group: "colour", value: { light: "rgb(0 0 0 / 0.5)", dark: "black" } }),
    problems: ["token color-overlay: dark value black is not a 6-digit hex colour, rgb(… / α) or one colour token reference"],
  },
  {
    rule: "for a colour value with more than one reference",
    records: withRecord(
        "color-focus",
        focus("var(--ocelle-color-ink) var(--ocelle-color-ground)", "var(--ocelle-color-ink)", { light: ["color-ink", "color-ground"], dark: ["color-ink"] }),
      ),
    problems: ["token color-focus: light value var(--ocelle-color-ink) var(--ocelle-color-ground) is not a 6-digit hex colour or one colour token reference"],
  },
  {
    rule: "for a colour reference to color-scheme or to a token outside the colour group",
    records: withRecord("color-focus", focus("var(--ocelle-color-scheme)", "var(--ocelle-space-4)", { light: ["color-scheme"], dark: ["space-4"] })),
    problems: ["token color-focus: light value references color-scheme, which is not a colour", "token color-focus: dark value references space-4, which is not a colour"],
  },
  {
    rule: "for a color-scheme value other than light and dark",
    records: withRecord("color-scheme", { name: "color-scheme", group: "colour", value: { light: "dark", dark: "dark" } }),
    problems: ["token color-scheme: value must be light in light and dark in dark"],
  },
  {
    rule: "for a color-scheme value that is right in light and wrong in dark",
    records: withRecord("color-scheme", { name: "color-scheme", group: "colour", value: { light: "light", dark: "light" } }),
    problems: ["token color-scheme: value must be light in light and dark in dark"],
  },
  {
    rule: "for contrast on a colour, and a ground, that are opaque in one theme only",
    records: withAdded(
        {
          name: "color-veil",
          group: "colour",
          value: { light: "#123456", dark: "var(--ocelle-color-overlay)" },
          ref: { light: [], dark: ["color-overlay"] },
          contrast: { kind: "text", grounds: ["color-ground"] },
        },
        {
          name: "color-sheet",
          group: "colour",
          value: { light: "var(--ocelle-color-overlay)", dark: "#000000" },
          ref: { light: ["color-overlay"], dark: [] },
        },
        { name: "color-mark", group: "colour", value: { light: "#123456", dark: "#654321" }, contrast: { kind: "non-text", grounds: ["color-sheet"] } },
      ),
    problems: ["token color-veil: contrast on a colour that is not opaque in both themes", "token color-mark: ground color-sheet is not opaque in both themes"],
  },
  {
    rule: "for contrast on a colour whose resolved value is not opaque",
    records: withAdded({
        name: "color-veil",
        group: "colour",
        value: { light: "var(--ocelle-color-overlay)", dark: "var(--ocelle-color-overlay)" },
        ref: { light: ["color-overlay"], dark: ["color-overlay"] },
        contrast: { kind: "text", grounds: ["color-ground"] },
      }),
    problems: ["token color-veil: contrast on a colour that is not opaque in both themes"],
  },
  {
    rule: "for a ground that is not opaque, directly or through a reference",
    records: withAdded(
        {
          name: "color-veil",
          group: "colour",
          value: { light: "var(--ocelle-color-overlay)", dark: "var(--ocelle-color-overlay)" },
          ref: { light: ["color-overlay"], dark: ["color-overlay"] },
        },
        { name: "color-mark", group: "colour", value: { light: "#123456", dark: "#654321" }, contrast: { kind: "non-text", grounds: ["color-overlay", "color-veil"] } },
      ),
    problems: ["token color-mark: ground color-overlay is not opaque in both themes", "token color-mark: ground color-veil is not opaque in both themes"],
  },
  {
    rule: "for contrast on a token outside the colour group",
    records: withRecord("space-4", { name: "space-4", group: "space", value: "1rem", contrast: { kind: "text", grounds: ["color-ground"] } }),
    problems: ["token space-4: contrast on a token outside the colour group"],
  },
  {
    rule: "for a theme-independent token with a light and a dark value",
    records: withRecord("space-4", { name: "space-4", group: "space", value: { light: "1rem", dark: "2rem" } }),
    problems: ["token space-4: group space is theme-independent but the value is per theme"],
  },
  {
    rule: "for a theme-dependent token with one value",
    records: withRecord("color-ink", ink("#111111")),
    problems: ["token color-ink: group colour is theme-dependent but the value is not per theme"],
  },
  {
    rule: "for several rules at once, in source order",
    records: withAdded(ink({ light: "#111111", dark: "#EEEEEE" }), { name: "radius-3", group: "shape", value: "8px" }),
    problems: ["token color-ink: duplicate name", "token radius-3: excluded token (spec Appendix A.6)"],
  },
];

describe("validateSource() names the token and the rule", () => {
  it.each(cases)("$rule", ({ records, problems }) => {
    expect(() => {
      validateSource(records);
    }).toThrow(new Error(`invalid token source: ${problems.join("; ")}`));
  });

  it.each(["color-proto", "color-proto-bg", "font-size-ui", "font-size-body", "font-size-title", "radius-3"])("for the A.6 name %s", (name) => {
    expect(() => {
      validateSource(withAdded({ name, group: "type", value: "1rem" }));
    }).toThrow(new Error(`invalid token source: token ${name}: excluded token (spec Appendix A.6)`));
  });
});
