import { describe, expect, it } from "vitest";
import { css, json } from "../src/generate.ts";
import { source } from "../src/source.ts";
import { fixture } from "./fixture.ts";
import { blocks } from "./stylesheet.ts";

// json() (FR-008, contracts/token-package.md, data-model.md § JSON export): version 1, one entry per token in source
// order, full names, the group, the resolved light and dark values (or the one value), and for a derived token `ref`
// in full-name form and in the shape of the value; no `use` or `contrast` field. Every stylesheet token is in the JSON
// and every JSON token in the stylesheet (SC-002).
describe("json() on the fixture source", () => {
  it("is the JSON export of contracts/token-package.md, exactly", () => {
    expect(json(fixture)).toStrictEqual({
      version: 1,
      tokens: [
        { name: "--ocelle-color-ground", group: "colour", light: "#FFFFFF", dark: "#000000" },
        { name: "--ocelle-color-ink", group: "colour", light: "#111111", dark: "#EEEEEE" },
        { name: "--ocelle-color-same", group: "colour", light: "#777777", dark: "#777777" },
        {
          name: "--ocelle-color-focus",
          group: "colour",
          light: "#111111",
          dark: "#EEEEEE",
          ref: { light: ["--ocelle-color-ink"], dark: ["--ocelle-color-ink"] },
        },
        { name: "--ocelle-color-scheme", group: "colour", light: "light", dark: "dark" },
        { name: "--ocelle-color-overlay", group: "colour", light: "rgb(0 0 0 / 0.5)", dark: "rgb(0 0 0 / 0.65)" },
        { name: "--ocelle-space-4", group: "space", value: "1rem" },
        { name: "--ocelle-gutter", group: "space", value: "1rem", ref: ["--ocelle-space-4"] },
        { name: "--ocelle-dialog-max", group: "shell", value: "calc(100vw - 2 * 1rem)", ref: ["--ocelle-gutter"] },
        {
          name: "--ocelle-elevation-raised",
          group: "elevation",
          light: "0 2px 4px rgb(0 0 0 / 0.1)",
          dark: "0 0 0 1px #EEEEEE",
          ref: { light: [], dark: ["--ocelle-color-ink"] },
        },
        { name: "--ocelle-motion-fast", group: "motion", value: "120ms" },
        { name: "--ocelle-motion-base", group: "motion", value: "200ms" },
      ],
    });
  });

  it("orders each entry's fields name, group, values, ref", () => {
    expect(json(fixture).tokens.map((token) => Object.keys(token).join(","))).toEqual([
      "name,group,light,dark",
      "name,group,light,dark",
      "name,group,light,dark",
      "name,group,light,dark,ref",
      "name,group,light,dark",
      "name,group,light,dark",
      "name,group,value",
      "name,group,value,ref",
      "name,group,value,ref",
      "name,group,light,dark,ref",
      "name,group,value",
      "name,group,value",
    ]);
  });

  it("has no use or contrast field", () => {
    expect(JSON.stringify(json(fixture))).not.toMatch(/"use"|"contrast"|"grounds"/);
    expect(JSON.stringify(json(fixture))).toContain("--ocelle-color-ink");
  });
});

describe("the stylesheet and the JSON export agree (SC-002)", () => {
  it.each([
    { name: "fixture", records: fixture },
    { name: "real source", records: source },
  ])("on the $name: every stylesheet token is in the JSON and every JSON token in the stylesheet", ({ records }) => {
    const stylesheet = [...blocks(css(records)).root.keys()];
    const exported = json(records).tokens.map((token) => token.name);
    expect(exported).toEqual(stylesheet);
    expect(exported.length).toBeGreaterThan(10);
  });
});
