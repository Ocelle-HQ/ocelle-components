import { describe, expect, it } from "vitest";
import { pairLines, parsePairs, tokenLines } from "../lib/token-source.ts";

// The pair list and token locations of gates/lib/token-source.ts at their edges (002 data-model.md § Contrast pair,
// § Token overrides): entries that are not objects, the JSON error kept as the cause, and key lookups in lists and
// sources the gates and the plant runner read.
const entry = { theme: "light", fg: "color-a", bg: "color-b", kind: "text", figure: "5.0", status: "checked", source: "computed" };

describe("parsePairs", () => {
  it.each([
    { text: "[\n  null\n]\n", cause: "entry 1 is not an object" },
    { text: "[\n  []\n]\n", cause: "entry 1 is not an object" },
    { text: `[\n  ${JSON.stringify(entry)}, ${JSON.stringify(entry)}\n]\n`, cause: "not one entry per line" },
    { text: `[\n  ${JSON.stringify(entry)},\n  "x"\n]\n`, cause: "entry 2 is not an object" },
  ])("rejects $text", ({ text, cause }) => {
    expect(() => parsePairs(text)).toThrow(cause);
  });

  it("reads each entry at the line it starts on, and keeps the JSON error as the cause", () => {
    expect(parsePairs(`[\n\n  ${JSON.stringify(entry)}\n]\n`)).toEqual({ entries: [entry], lines: [3] });
    const error = (() => {
      try {
        parsePairs("[");
        return undefined;
      } catch (thrown) {
        return thrown as Error;
      }
    })();
    expect(error?.cause).toBeInstanceOf(SyntaxError);
  });
});

describe("pairLines", () => {
  it("finds the lines of the entries with the key, past entries without it", () => {
    const text = `[\n  {},\n  ${JSON.stringify(entry)},\n  ${JSON.stringify({ ...entry, theme: "dark" })},\n  ${JSON.stringify(entry)}\n]\n`;
    expect([pairLines(text, "light", "color-a", "color-b"), pairLines(text, "dark", "color-a", "color-b"), pairLines(text, "light", "color-a", "color-c")]).toEqual([[3, 5], [4], []]);
  });

  it("throws on a text that is not a JSON list of one object per line", () => {
    expect(() => pairLines(`[\n  ${JSON.stringify(entry)}, null\n]\n`, "light", "color-a", "color-b")).toThrow("not one entry per line");
    expect(() => pairLines("{}", "light", "color-a", "color-b")).toThrow("not a list of pairs");
  });
});

describe("tokenLines", () => {
  it("finds a record by its name field as source.ts and overrides.ts write it, and not a longer name", () => {
    const text = ['  { name: "color-ink", group: "colour" },', '  {"add":{"name":"color-ink","group":"colour"}},', '  { name: "color-ink-soft" },', '  {"token":"color-ink"},'].join("\n");
    expect([tokenLines(text, "color-ink"), tokenLines(text, "color-ink-soft"), tokenLines(text, "color")]).toEqual([[1, 2], [3], []]);
  });
});
