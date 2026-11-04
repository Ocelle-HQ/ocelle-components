import { describe, expect, it } from "vitest";
import { resolve } from "../src/generate.ts";
import { source } from "../src/source.ts";
import { fixture, withAdded, withRecord } from "./fixture.ts";

// resolve(), the one resolver of derived values (data-model.md § Token, *Resolution*; PLAN-FRESH-2-005): the value in
// a theme with every var(--ocelle-…) reference replaced by the resolved value of that token in the same theme,
// recursively. json(), validateSource() and the contrast gate all use it.
describe("resolve() on fixture sources", () => {
  it("gives a token's own value in each theme, and a theme-independent token's one value in both", () => {
    expect([resolve(fixture, "color-ink", "light"), resolve(fixture, "color-ink", "dark"), resolve(fixture, "space-4", "light"), resolve(fixture, "space-4", "dark")]).toEqual([
      "#111111",
      "#EEEEEE",
      "1rem",
      "1rem",
    ]);
  });

  it("resolves a single var() colour reference per theme", () => {
    expect([resolve(fixture, "color-focus", "light"), resolve(fixture, "color-focus", "dark")]).toEqual(["#111111", "#EEEEEE"]);
  });

  it("resolves nested references, inside a larger value", () => {
    const chained = withAdded({
      name: "color-ring",
      group: "colour",
      value: { light: "var(--ocelle-color-focus)", dark: "var(--ocelle-color-focus)" },
      ref: { light: ["color-focus"], dark: ["color-focus"] },
    });
    expect([resolve(chained, "color-ring", "light"), resolve(chained, "color-ring", "dark"), resolve(fixture, "dialog-max", "dark")]).toEqual([
      "#111111",
      "#EEEEEE",
      "calc(100vw - 2 * 1rem)",
    ]);
  });

  it("resolves a reference in one theme only", () => {
    expect([resolve(fixture, "elevation-raised", "light"), resolve(fixture, "elevation-raised", "dark")]).toEqual([
      "0 2px 4px rgb(0 0 0 / 0.1)",
      "0 0 0 1px #EEEEEE",
    ]);
  });

  it("resolves every reference in a value with several", () => {
    const several = withAdded({
      name: "bar",
      group: "shell",
      value: "calc(2 * var(--ocelle-gutter) + 3 * var(--ocelle-space-4))",
      ref: ["gutter", "space-4"],
    });
    expect(resolve(several, "bar", "light")).toBe("calc(2 * 1rem + 3 * 1rem)");
  });

  it("follows a change of the referenced token", () => {
    const changed = withRecord("color-ink", { name: "color-ink", group: "colour", value: { light: "#222222", dark: "#DDDDDD" } });
    expect([resolve(changed, "color-focus", "light"), resolve(changed, "color-focus", "dark")]).toEqual(["#222222", "#DDDDDD"]);
  });

  it("throws naming an unknown token", () => {
    expect(() => resolve(fixture, "color-zz", "light")).toThrow(new Error("unknown token color-zz"));
  });
});

describe("resolve() on the real source", () => {
  it("resolves color-focus and color-current to color-accent-strong's value in each theme (A.1)", () => {
    expect([
      resolve(source, "color-focus", "light"),
      resolve(source, "color-focus", "dark"),
      resolve(source, "color-current", "light"),
      resolve(source, "color-current", "dark"),
    ]).toEqual(["#8F5E0F", "#E0A23A", "#8F5E0F", "#E0A23A"]);
  });
});
