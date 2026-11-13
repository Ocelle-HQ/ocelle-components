import { describe, expect, it } from "vitest";
import { checkOutput, isBuiltOutput, scanMarkup, scanScript, selectOutput } from "../bin/csp.ts";
import type { Finding } from "../lib/findings.ts";

// The content-security gate's decision (FR-021, research.md R-11): HTML markup through the parse5 tokenizer, built
// JavaScript through the TypeScript parser (dynamic code, and markup in string and template literals), on built
// output only. Identifiers that merely contain these names are not calls of them.
const html = "packages/elements/dist/index.html";
const js = "packages/elements/dist/index.js";

function at(path: string, line: number, rule: string, message: string): Finding {
  return { location: { path, line }, gate: "csp", rule, message };
}

const inlineScript = "inline <script> element without src (FR-021)";
const styleElement = "<style> element (FR-021)";
const styleAttribute = (tag: string): string => `style attribute on <${tag}> (FR-021)`;
const handler = (name: string, tag: string): string => `event handler attribute ${name} on <${tag}> (FR-021)`;
const evalCall = "eval() runs a string as code (FR-021)";
const newFunction = "new Function() builds code from a string (FR-021)";
const functionCall = "Function() builds code from a string (FR-021)";
const stringTimer = (name: string): string => `${name}() with a string argument runs it as code (FR-021)`;

function findings(text: string): readonly Finding[] {
  const scan = scanScript({ path: js, text });
  if ("cause" in scan) throw new Error(scan.cause);
  return scan.findings;
}

describe("scanMarkup", () => {
  it.each([
    { markup: "<script>alert(1)</script>", expected: [at(html, 1, "inline-script", inlineScript)] },
    { markup: '<script type="module">import "./x.js";</script>', expected: [at(html, 1, "inline-script", inlineScript)] },
    { markup: "<style>a { color: red }</style>", expected: [at(html, 1, "style-element", styleElement)] },
    { markup: '<div style="color: red"></div>', expected: [at(html, 1, "style-attribute", styleAttribute("div"))] },
    { markup: '<p>a</p>\n<div\nstyle="x"></div>', expected: [at(html, 3, "style-attribute", styleAttribute("div"))] },
    { markup: "<svg/onload=alert(1)>", expected: [at(html, 1, "event-handler", handler("onload", "svg"))] },
    { markup: '<img src="x.png" onerror="y()">', expected: [at(html, 1, "event-handler", handler("onerror", "img"))] },
    { markup: '<button ONCLICK="x()">', expected: [at(html, 1, "event-handler", handler("onclick", "button"))] },
    {
      markup: '<template><div style="x"></div></template>',
      expected: [at(html, 1, "style-attribute", styleAttribute("div"))],
    },
    {
      markup: '<script>const s = "<div style=x onclick=y>";</script>',
      expected: [at(html, 1, "inline-script", inlineScript)],
    },
    {
      markup: "<style>a > b { color: red }</style><b style=x>",
      expected: [at(html, 1, "style-element", styleElement), at(html, 1, "style-attribute", styleAttribute("b"))],
    },
  ])("finds $expected.0.rule in $markup", ({ markup, expected }) => {
    expect(scanMarkup(html, markup, 1)).toEqual(expected);
  });

  it.each([
    '<script src="./x.js"></script>',
    '<script type="module" src="./x.js"></script>',
    '<div class="a" data-style="b" title="onload"></div>',
    "<textarea><div style=x onload=y></textarea>",
    "<title><style></title>",
    "a < b and c > d",
    "<!-- <script>x</script> -->",
  ])("finds nothing in %s (only the control <style> on the next line)", (markup) => {
    expect(scanMarkup(html, `${markup}\n<style></style>`, 1)).toEqual([at(html, 2, "style-element", styleElement)]);
  });

  it("counts lines from the line it is given", () => {
    expect(scanMarkup(html, "\n\n<style></style>", 10)).toEqual([at(html, 12, "style-element", styleElement)]);
  });
});

describe("scanScript: dynamic code", () => {
  it.each([
    { text: 'eval("1");', rule: "eval", message: evalCall },
    { text: "window.eval(s);", rule: "eval", message: evalCall },
    { text: "globalThis.eval(s);", rule: "eval", message: evalCall },
    { text: "self.eval(s);", rule: "eval", message: evalCall },
    { text: 'window["eval"](s);', rule: "eval", message: evalCall },
    { text: "(0, eval)(s);", rule: "eval", message: evalCall },
    { text: "(eval)(s);", rule: "eval", message: evalCall },
    { text: 'new Function("a", "return a");', rule: "new-function", message: newFunction },
    { text: 'new window.Function("return 1");', rule: "new-function", message: newFunction },
    { text: "new Function;", rule: "new-function", message: newFunction },
    { text: 'Function("return 1")();', rule: "function-call", message: functionCall },
    { text: 'globalThis.Function("return 1");', rule: "function-call", message: functionCall },
    { text: 'setTimeout("x()", 0);', rule: "string-timer", message: stringTimer("setTimeout") },
    { text: "setInterval(`x()`, 10);", rule: "string-timer", message: stringTimer("setInterval") },
    { text: "setTimeout(`${a}()`, 0);", rule: "string-timer", message: stringTimer("setTimeout") },
    { text: 'setTimeout("a" + b, 0);', rule: "string-timer", message: stringTimer("setTimeout") },
    { text: 'setTimeout(b + "a", 0);', rule: "string-timer", message: stringTimer("setTimeout") },
    { text: 'window.setInterval("x()", 10);', rule: "string-timer", message: stringTimer("setInterval") },
    { text: 'self.setTimeout(("x()"), 0);', rule: "string-timer", message: stringTimer("setTimeout") },
  ])("finds $rule in $text", ({ text, rule, message }) => {
    expect(findings(`const s = "";\n${text}\n`)).toEqual([at(js, 2, rule, message)]);
  });

  it.each([
    "setTimeout(fn, 0);",
    "setTimeout(() => x(), 0);",
    "setTimeout(a + b, 0);",
    "setTimeout();",
    "retrieval(x);",
    "isFunction(x);",
    "createFunction(x);",
    "obj.eval(x);",
    "obj.Function(x);",
    'obj.setTimeout("x", 0);',
    "new Functional();",
    "new obj.Function();",
    "const evaluate = (x) => x; evaluate(1);",
    'const s = "eval(1) and new Function()";',
    "(0, evaluate)(s);",
    "(1 + eval);",
  ])("finds nothing in %s (only the control eval on the next line)", (text) => {
    expect(findings(`${text}\neval(1);\n`)).toEqual([at(js, 2, "eval", evalCall)]);
  });
});

describe("scanScript: markup in strings and templates", () => {
  it("scans a string literal that contains markup, at its line", () => {
    expect(findings('const a = 1;\nconst t = "<script>alert(1)</script>";\n')).toEqual([
      at(js, 2, "inline-script", inlineScript),
    ]);
  });

  it("scans a template with a newline before style, with a placeholder for each expression", () => {
    expect(findings("const t = html`<p>${a}</p>\n<div\nstyle=${x}></div>`;\n")).toEqual([
      at(js, 3, "style-attribute", styleAttribute("div")),
    ]);
  });

  it("scans a template with a /-separated event handler", () => {
    expect(findings("const t = `<img/onload=${f}>`;\n")).toEqual([at(js, 1, "event-handler", handler("onload", "img"))]);
  });

  it("scans the parts of a template after an expression that spans lines", () => {
    expect(findings("const t = `<p>${\n  a\n}</p><style></style>`;\n")).toEqual([at(js, 3, "style-element", styleElement)]);
  });

  it.each([
    'const t = "style=x onload=y";',
    "const t = `<div class=${a}></div>`;",
    'const t = "<script src=./x.js></script>";',
    "const t = `a < b`;",
  ])("finds nothing in %s (only the control eval on the next line)", (text) => {
    expect(findings(`${text}\neval(1);\n`)).toEqual([at(js, 2, "eval", evalCall)]);
  });
});

describe("scanScript: parse errors", () => {
  it("returns the cause when the file does not parse", () => {
    expect(scanScript({ path: js, text: "let x = (;\n" })).toEqual({
      cause: "packages/elements/dist/index.js:1 does not parse (Expression expected.)",
    });
  });
});

describe("isBuiltOutput", () => {
  it("selects the .js, .css and .html files below packages/<name>/dist/ only", () => {
    const paths = [
      "packages/elements/dist/index.js",
      "packages/tokens/dist/tokens.css",
      "packages/styles/dist/page.html",
      "packages/elements/dist/sub/x.js",
      "packages/elements/src/x.js",
      "packages/elements/src/x.ts",
      "packages/elements/dist/index.d.ts",
      "packages/elements/dist/index.js.map",
      "packages/a/b/dist/x.js",
      "dist/x.js",
      "gates/plants/csp/x/tree/packages/a/dist/x.js",
      "xpackages/a/dist/x.js",
    ];
    expect(paths.filter((path) => isBuiltOutput(path))).toEqual(paths.slice(0, 4));
  });
});

describe("checkOutput", () => {
  it("exits 0 naming the number of files checked", () => {
    const files = [
      { path: js, text: "export const a = 1;\n" },
      { path: "packages/elements/dist/x.css", text: "a { color: red }\n" },
    ];
    expect(checkOutput(files)).toEqual({ exit: 0, summary: "csp: 2 files checked, no finding" });
  });

  it("exits 0 on no built output", () => {
    expect(checkOutput([])).toEqual({ exit: 0, summary: "csp: 0 files checked, no finding" });
  });

  it("exits 1 with the findings of every HTML and JavaScript file, not reading CSS as markup", () => {
    const files = [
      { path: js, text: 'eval("1");\n' },
      { path: html, text: "<p>\n<style></style>\n" },
      { path: "packages/elements/dist/x.css", text: "/* <style> */\n" },
      { path: "packages/elements/dist/ok.js", text: "export {};\n" },
    ];
    expect(checkOutput(files)).toEqual({
      exit: 1,
      findings: [at(js, 1, "eval", evalCall), at(html, 2, "style-element", styleElement)],
      summary: "csp: 2 findings in 2 files",
    });
  });

  it("exits 2 when a JavaScript file does not parse", () => {
    const files = [
      { path: "packages/elements/dist/a.js", text: 'eval("1");\n' },
      { path: js, text: "let x = (;\n" },
    ];
    expect(checkOutput(files)).toEqual({
      exit: 2,
      cause: "csp: could not run: packages/elements/dist/index.js:1 does not parse (Expression expected.); fix the build output",
    });
  });
});

// The Storybook leaves the scope (006 FR-020, US4 scenario 1; research.md R-10; operator decision Q1 (a)): the gate
// covers the built output of the three packages only, so the Storybook inputs before bundling and the HTML entries of
// its build output, which 002 FR-023 had added, are no longer selected. A Storybook inline script and a story's style
// attribute report nothing; the same constructs in a package's dist/ still do.
describe("the Storybook is outside the scope (006 FR-020)", () => {
  const inlineMarkup = "<!doctype html>\n<script>window.CONFIG_TYPE = 'PRODUCTION';</script>\n";
  const styled = "export const a = '<p style=\"color: red\">x</p>';\n";

  it("selects no file below storybook/, and still the packages' built output", () => {
    const storybook = [
      "storybook/stories/tokens.stories.ts",
      "storybook/stories/render.ts",
      "storybook/.storybook/main.ts",
      "storybook/.storybook/preview.ts",
      "storybook/.storybook/preview-head.html",
      "storybook/.storybook/preview.css",
      "storybook/scripts/externalise.ts",
      "storybook/scripts/sub/x.js",
      "storybook/.generated/tokens.css",
      "storybook/.generated/swatches.css",
      "storybook/dist/index.html",
      "storybook/dist/iframe.html",
      "storybook/dist/inline-0123456789abcdef.js",
      "storybook/dist/assets/iframe-BZdWAMwh.js",
    ];
    const packages = ["packages/elements/dist/index.html", "packages/elements/dist/index.js", "packages/tokens/dist/tokens.css"];
    expect(storybook.filter((path) => isBuiltOutput(path))).toEqual([]);
    expect(selectOutput([...storybook, ...packages])).toEqual(packages);
  });

  it("reports nothing for an inline script in storybook/dist/index.html and a style attribute in a story, and both in a package's dist/", () => {
    const files = [
      { path: "storybook/dist/index.html", text: inlineMarkup },
      { path: "storybook/stories/x.stories.ts", text: styled },
      { path: "packages/elements/dist/index.html", text: inlineMarkup },
      { path: "packages/elements/dist/x.js", text: styled },
    ];
    const selected = selectOutput(files.map((file) => file.path));
    expect(checkOutput(files.filter((file) => selected.includes(file.path)))).toEqual({
      exit: 1,
      findings: [
        at("packages/elements/dist/index.html", 2, "inline-script", inlineScript),
        at("packages/elements/dist/x.js", 1, "style-attribute", styleAttribute("p")),
      ],
      summary: "csp: 2 findings in 2 files",
    });
  });
});

describe("checkOutput: built JavaScript stays JavaScript (added: mutation run)", () => {
  it("reads a .js `Function < a > (s)` as two comparisons, not as a TypeScript call with a type argument", () => {
    expect(checkOutput([{ path: js, text: 'export const r = Function < a > ("return 1");\n' }])).toEqual({ exit: 0, summary: "csp: 1 file checked, no finding" });
  });
});
