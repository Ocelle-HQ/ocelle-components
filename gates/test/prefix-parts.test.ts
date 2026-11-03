import { describe, expect, it } from "vitest";
import { checkPackages, scanText, selectCovered } from "../bin/prefix.ts";

// The prefix gate at the edges (FR-022, research.md R-12; phase 4 review round 1, R1-08 and R1-09): spaces before the
// colon of a font declaration, the monospace message with each family once, the summary's file count, and the
// selection of the package files the gate reads.
const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

describe("scanText: font declarations", () => {
  it.each(["font-family : monospace;", "font\t:\tmonospace;", "font-family  :  Menlo, monospace;"])("finds a monospace family with spaces before the colon: %s", (text) => {
    expect(scanText("packages/a/src/x.css", text).map((found) => found.rule)).toEqual(["monospace"]);
  });

  it("names each monospace family of a line once, in order, in the message", () => {
    expect(scanText("packages/a/src/x.css", "a { font-family: Menlo, monospace; } b { font: 12px Menlo; }")).toEqual([
      {
        location: { path: "packages/a/src/x.css", line: 1 },
        gate: "prefix",
        rule: "monospace",
        message: "monospace font family Menlo, monospace in a font declaration (FR-022)",
      },
    ]);
  });
});

describe("checkPackages: the summary", () => {
  it("counts the files with findings, not the findings or the files checked", () => {
    const files = [
      { path: "packages/a/src/x.ts", bytes: bytes("sk-a\nsk-b\n") },
      { path: "packages/a/src/y.ts", bytes: bytes("ok\n") },
      { path: "packages/a/src/z.css", bytes: bytes("a { font-family: monospace; }\n") },
    ];
    const result = checkPackages(files);
    expect({ exit: result.exit, summary: "summary" in result ? result.summary : undefined }).toEqual({ exit: 1, summary: "prefix: 3 findings in 2 files" });
  });
});

describe("selectCovered", () => {
  it("keeps the covered package files only, sorted", () => {
    const paths = ["packages/b/src/z.ts", "packages/a/README.md", "packages/a/dist/x.js", "packages/a/node_modules/x/y.js", "gates/x.ts", "packages/a/src/a.css"];
    expect(selectCovered(paths)).toEqual(["packages/a/dist/x.js", "packages/a/src/a.css", "packages/b/src/z.ts"]);
  });
});
