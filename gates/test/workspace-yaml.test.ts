import { describe, expect, it } from "vitest";
import { parseWorkspaceYaml } from "../lib/workspace-yaml.ts";

// The YAML subset of pnpm-workspace.yaml the pins gate reads (FR-027, research.md R-14; phase 4 review round 1,
// R1-03): every scalar form, flow and block collection, comment and line ending it accepts, and every input outside
// it, which throws naming the line or value so the gate reports the file as unreadable.
describe("parseWorkspaceYaml: scalars", () => {
  it.each([
    { text: "a: 'packages/*'", value: "packages/*" },
    { text: 'a: "packages/*"', value: "packages/*" },
    { text: "a: ''", value: "" },
    { text: 'a: "it\'s"', value: "it's" },
    { text: "a: 'x\"", value: "'x\"" },
    { text: "a: x'y'", value: "x'y'" },
    { text: "a: 'y'x", value: "'y'x" },
    { text: "a: true", value: true },
    { text: "a: false", value: false },
    { text: "a: True", value: "True" },
    { text: "a: null", value: null },
    { text: "a: ~", value: null },
    { text: "a: 10080", value: 10080 },
    { text: "a: -12", value: -12 },
    { text: "a: 12.25", value: 12.25 },
    { text: "a: 1.", value: "1." },
    { text: "a: 1.2.3", value: "1.2.3" },
    { text: "a: x10", value: "x10" },
    { text: "a: 10x", value: "10x" },
    { text: "a: -", value: "-" },
    { text: "a: isolated", value: "isolated" },
    { text: "a: link:vendor/x", value: "link:vendor/x" },
    { text: "a:   spaced out  ", value: "spaced out" },
  ])("reads $text", ({ text, value }) => {
    expect(parseWorkspaceYaml(text)).toEqual({ a: value });
  });

  it.each(["&anchor", "*alias", "!tag", "|", ">", "[open", "]", "{open", "}", ",x"])("rejects a value starting with a YAML indicator: %s", (value) => {
    expect(() => parseWorkspaceYaml(`a: ${value}`)).toThrow(`unsupported value ${value}`);
  });

  it("names the value of a block item it rejects", () => {
    expect(() => parseWorkspaceYaml("a:\n  - *x\n")).toThrow("unsupported value *x");
  });
});

describe("parseWorkspaceYaml: collections", () => {
  it.each([
    { text: "a: []", value: [] },
    { text: "a: [ ]", value: [] },
    { text: "a: ['packages/*', 'tools/*']", value: ["packages/*", "tools/*"] },
    { text: "a: [1, true, x]", value: [1, true, "x"] },
    { text: "a: {}", value: {} },
    { text: "a: { }", value: {} },
    { text: "a: { esbuild: true, sharp: false }", value: { esbuild: true, sharp: false } },
    { text: "a: {'@scope/x': 1}", value: { "@scope/x": 1 } },
    { text: "a: {x: link:vendor/x}", value: { x: "link:vendor/x" } },
  ])("reads the flow collection $text", ({ text, value }) => {
    expect(parseWorkspaceYaml(text)).toEqual({ a: value });
  });

  it("rejects a flow map entry without a colon", () => {
    expect(() => parseWorkspaceYaml("a: { esbuild }")).toThrow("unsupported line esbuild");
  });

  it("reads a block list and a block map, each at one indentation", () => {
    const text = 'packages:\n  - "packages/*"\n  - tools\nallowBuilds:\n    esbuild: true\n    "@scope/x": false\nlast: 1\n';
    expect(parseWorkspaceYaml(text)).toEqual({ packages: ["packages/*", "tools"], allowBuilds: { esbuild: true, "@scope/x": false }, last: 1 });
  });

  it("reads a key with no block below it as null", () => {
    expect(parseWorkspaceYaml("a:\nb: 1\nc:")).toEqual({ a: null, b: 1, c: null });
  });

  it("closes a block at the next top-level key, so a later indented line is rejected", () => {
    expect(() => parseWorkspaceYaml("a: 1\n  - x\n")).toThrow("unexpected indentation at - x");
    expect(() => parseWorkspaceYaml("a:\n  - x\nb: 2\n  - y\n")).toThrow("unexpected indentation at - y");
  });

  it("rejects an indentation other than the block's first line's", () => {
    expect(() => parseWorkspaceYaml("a:\n  - x\n   - y\n")).toThrow("unexpected indentation at - y");
    expect(() => parseWorkspaceYaml("a:\n    x: 1\n  y: 2\n")).toThrow("unexpected indentation at y: 2");
  });

  it("rejects an indented line before any key", () => {
    expect(() => parseWorkspaceYaml("  a: 1\n")).toThrow("unexpected indentation at a: 1");
  });

  it("rejects a list item in a map and a map entry in a list", () => {
    expect(() => parseWorkspaceYaml("a:\n  x: 1\n  - y\n")).toThrow("a list and a map in one block at - y");
    expect(() => parseWorkspaceYaml("a:\n  - y\n  x: 1\n")).toThrow("a list and a map in one block at x: 1");
  });

  it("rejects a line without a colon, at the top and in a block", () => {
    expect(() => parseWorkspaceYaml("no colon here\n")).toThrow("unsupported line no colon here");
    expect(() => parseWorkspaceYaml("a:\n  plain\n")).toThrow("unsupported line plain");
    expect(() => parseWorkspaceYaml("a:\n  -\n")).toThrow("unsupported line -");
  });
});

describe("parseWorkspaceYaml: comments, blank lines and line endings", () => {
  it("drops full-line and trailing comments and blank lines", () => {
    const text = "# policy\n\na: 10080 # 7 days\n   \nb:\n  # the packages\n  - x # first\nc: x#y\n";
    expect(parseWorkspaceYaml(text)).toEqual({ a: 10080, b: ["x"], c: "x#y" });
  });

  it("reads CRLF line endings", () => {
    expect(parseWorkspaceYaml("a: 1\r\nb:\r\n  - x\r\n")).toEqual({ a: 1, b: ["x"] });
  });

  it("reads an empty file as no setting", () => {
    expect(parseWorkspaceYaml("")).toEqual({});
  });

  it("lets a later key replace an earlier one", () => {
    expect(parseWorkspaceYaml("a: 1\na: 2\n")).toEqual({ a: 2 });
  });
});
