import { describe, expect, it } from "vitest";
import { applyOverrides } from "../src/generate.ts";
import type { TokenRecord } from "../src/generate.ts";
import { overrides } from "../src/overrides.ts";
import { records, source } from "../src/source.ts";
import { fixture } from "./fixture.ts";

// applyOverrides() (data-model.md § Token overrides; PLAN-FRESH-3-003 (a)): a plant changes the token source by key.
// By name, `light` and `dark` set the value of that theme and the other fields replace the record's; `add` appends
// a record; `remove` drops one. Unknown names and duplicates throw, naming them.
const byName = (list: readonly TokenRecord[], name: string): TokenRecord | undefined => list.find((record) => record.name === name);

describe("applyOverrides()", () => {
  it("returns the records unchanged, in order, for no override", () => {
    expect(applyOverrides(fixture, [])).toEqual(fixture);
  });

  it("sets the value of one theme by name and keeps the other", () => {
    const changed = applyOverrides(fixture, [{ token: "color-ink", light: "#222222" }]);
    expect(byName(changed, "color-ink")).toEqual({
      name: "color-ink",
      group: "colour",
      value: { light: "#222222", dark: "#EEEEEE" },
      contrast: { kind: "text", grounds: ["color-ground"] },
    });
    expect(applyOverrides(fixture, [{ token: "color-ink", dark: "#DDDDDD" }]).find((record) => record.name === "color-ink")?.value).toEqual({
      light: "#111111",
      dark: "#DDDDDD",
    });
    expect(changed.filter((record) => record.name !== "color-ink")).toEqual(fixture.filter((record) => record.name !== "color-ink"));
  });

  it("makes a one-value token per theme when a theme is set on it", () => {
    expect(byName(applyOverrides(fixture, [{ token: "space-4", dark: "2rem" }]), "space-4")?.value).toEqual({ light: "1rem", dark: "2rem" });
  });

  it("replaces value, ref and contrast by name", () => {
    const changed = applyOverrides(fixture, [
      { token: "gutter", value: "var(--ocelle-dialog-max)", ref: ["dialog-max"] },
      { token: "color-focus", contrast: { kind: "text", grounds: ["color-ink"] } },
    ]);
    expect([byName(changed, "gutter"), byName(changed, "color-focus")?.contrast]).toEqual([
      { name: "gutter", group: "space", value: "var(--ocelle-dialog-max)", ref: ["dialog-max"] },
      { kind: "text", grounds: ["color-ink"] },
    ]);
  });

  it("keeps the ref and the contrast of a record when an override sets only its value", () => {
    const changed = applyOverrides(fixture, [{ token: "gutter", value: "calc(2 * var(--ocelle-space-4))" }, { token: "color-focus", light: "var(--ocelle-color-ink)" }]);
    expect([byName(changed, "gutter"), byName(changed, "color-focus")]).toEqual([
      { name: "gutter", group: "space", value: "calc(2 * var(--ocelle-space-4))", ref: ["space-4"] },
      byName(fixture, "color-focus"),
    ]);
  });

  it("appends an added record and drops a removed one", () => {
    const added: TokenRecord = { name: "space-5", group: "space", value: "1.25rem" };
    const changed = applyOverrides(fixture, [{ add: added }, { remove: "color-same" }]);
    expect(changed.map((record) => record.name)).toEqual([...fixture.map((record) => record.name).filter((name) => name !== "color-same"), "space-5"]);
    expect(changed.at(-1)).toEqual(added);
  });

  it("applies the overrides in order", () => {
    const changed = applyOverrides(fixture, [{ token: "space-4", value: "2rem" }, { token: "space-4", value: "3rem" }, { add: { name: "x-1", group: "space", value: "1px" } }, { token: "x-1", value: "2px" }]);
    expect([byName(changed, "space-4")?.value, byName(changed, "x-1")?.value]).toEqual(["3rem", "2px"]);
  });

  it("does not change the records it is given", () => {
    const copy = structuredClone(fixture);
    applyOverrides(fixture, [{ token: "color-ink", light: "#222222" }, { remove: "space-4" }]);
    expect(fixture).toEqual(copy);
  });

  it.each([
    { change: { token: "color-zz", light: "#000000" }, error: "token override names an unknown token color-zz" },
    { change: { add: { name: "color-ink", group: "colour", value: { light: "#000000", dark: "#000000" } } }, error: "token override adds color-ink, which already exists" },
    { change: { remove: "color-zz" }, error: "token override removes an unknown token color-zz" },
  ] as const)("throws: $error", ({ change, error }) => {
    expect(() => applyOverrides(fixture, [change])).toThrow(new Error(error));
  });
});

describe("the committed overrides", () => {
  it("are empty, so the records of source.ts are exactly what ships", () => {
    expect(overrides).toEqual([]);
    expect(source).toEqual(records);
    expect(source.length).toBeGreaterThan(100);
  });
});
