import { describe, expect, it } from "vitest";
import { checkOutput, scanMarkup, scanScript, selectOutput, sourceOffset } from "../bin/csp.ts";
import type { Finding } from "../lib/findings.ts";

// The content-security gate at the edges (FR-021, research.md R-11; phase 4 review round 1, R1-04 and R1-09): the
// reported line of markup in each part of a template literal, raw text in <style>, calls that only look like the
// globals, string concatenation, the parse-error cause, the summary's file count and the selection of built output.
const js = "packages/elements/dist/index.js";
const handler = (name: string, tag: string): string => `event handler attribute ${name} on <${tag}> (FR-021)`;

function at(line: number, rule: string, message: string): Finding {
  return { location: { path: js, line }, gate: "csp", rule, message };
}

function lines(text: string): number[] {
  const scan = scanScript({ path: js, text });
  if ("cause" in scan) throw new Error(scan.cause);
  return scan.findings.map((found) => ("line" in found.location ? (found.location.line ?? 0) : 0));
}

describe("scanScript: the line of markup in a template", () => {
  it.each([
    { name: "a template without expressions, on its third line", text: "const t = `\n\n<b onclick=1>`;\n", line: 3 },
    { name: "escapes that are newlines only when cooked", text: "const t = `\\n\\n<b onclick=1>`;\n", line: 1 },
    { name: "the first part, with later parts on later lines", text: "const t = `<b onclick=1>${\nx\n}<p></p>`;\n", line: 1 },
    { name: "a tag at the very start of a later part", text: "const t = `<p>${\nx\n}<b onclick=1>`;\n", line: 3 },
    { name: "a later part that starts with a newline", text: "const t = `<p>${x}\n<b onclick=1>`;\n", line: 2 },
    { name: "the third part", text: "const t = `<p>${a}</p>${\nb\n}\n\n<b onclick=1>`;\n", line: 5 },
    { name: "an attribute on a later line of a later part", text: "const t = `<p>${a}</p><b\nonclick=1>`;\n", line: 2 },
    { name: "an attribute just before a newline in the third part", text: "const t = `${a}${b}<b on\n>`;\n", line: 1 },
  ])("reports $name at line $line", ({ text, line }) => {
    expect(lines(text)).toEqual([line]);
  });

  it("puts one character in place of each expression, so a tag after `<${tag}` is still a tag", () => {
    expect(scanScript({ path: js, text: "const t = `<${tag} onclick=1>`;\n" })).toEqual({ findings: [at(1, "event-handler", handler("onclick", "x"))] });
  });
});

describe("sourceOffset", () => {
  const starts = [
    { joined: 0, source: 10 },
    { joined: 5, source: 40 },
    { joined: 9, source: 70 },
  ];

  it("maps an offset into the part that starts at or before it", () => {
    expect([0, 4, 5, 6, 8, 9, 12].map((offset) => sourceOffset(starts, offset))).toEqual([10, 14, 40, 41, 43, 70, 73]);
  });
});

describe("scanMarkup: text elements", () => {
  it("reads the content of <style> as text, not markup", () => {
    expect(scanMarkup("a.html", '<style>a::after { content: "<b onclick=1>"; }</style><i onclick=2>', 1).map((found) => found.rule)).toEqual([
      "style-element",
      "event-handler",
    ]);
  });

  it("reads the content of <script>, <textarea> and <title> as text", () => {
    const markup = '<script src="a.js"><b onclick=1></script><textarea><b onclick=2></textarea><title><b onclick=3></title><i onclick=4>';
    expect(scanMarkup("a.html", markup, 1).map((found) => found.message)).toEqual([handler("onclick", "i")]);
  });
});

describe("scanScript: calls that are not the globals", () => {
  it.each([
    'obj["eval"](s);',
    "obj.eval(s);",
    'globalThis["setTimeout"](a - "1", 10);',
    'setTimeout(n - "1", 10);',
    'setInterval(f(a + "x"), 10);',
    "setTimeout(a + b, 10);",
    "new obj.Function(s);",
  ])("finds nothing in %s (only the control eval on the next line)", (text) => {
    expect(scanScript({ path: js, text: `${text}\neval(1);\n` })).toEqual({ findings: [at(2, "eval", "eval() runs a string as code (FR-021)")] });
  });

  it("finds a string timer by a string key on window, and a concatenation with a string on either side", () => {
    const text = 'window["setTimeout"]("a" + b, 1);\nsetInterval(a + ("b" + c), 1);\nself.setTimeout(`${x}`, 1);\n';
    expect(lines(text)).toEqual([1, 2, 3]);
  });
});

describe("scanScript: the parse-error cause", () => {
  it("names the line of the first syntax error and its message", () => {
    expect(scanScript({ path: js, text: "const a = 1;\n\nlet = ;\n" })).toEqual({ cause: `${js}:3 does not parse (Expression expected.)` });
  });
});

describe("checkOutput: the summary", () => {
  it("counts the files with findings, not the findings or the files checked", () => {
    const files = [
      { path: "packages/a/dist/a.js", text: "eval(1);\neval(2);\n" },
      { path: "packages/a/dist/b.js", text: "const x = 1;\n" },
      { path: "packages/a/dist/c.html", text: "<b onclick=1>" },
    ];
    const result = checkOutput(files);
    expect({ exit: result.exit, summary: "summary" in result ? result.summary : undefined }).toEqual({ exit: 1, summary: "csp: 3 findings in 2 files" });
  });
});

describe("selectOutput", () => {
  it("keeps the built output only, sorted", () => {
    const paths = [
      "packages/b/dist/z.js",
      "packages/a/src/x.ts",
      "packages/a/dist/index.html",
      "packages/a/dist/x.js.map",
      "packages/a/dist/x.css",
      "packages/a/node_modules/x/dist/y.js",
      "gates/dist/x.js",
    ];
    expect(selectOutput(paths)).toEqual(["packages/a/dist/index.html", "packages/a/dist/x.css", "packages/b/dist/z.js"]);
  });
});
