import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanMarkup } from "../../../gates/bin/csp.ts";
import { externalise, externaliseDir } from "../../scripts/externalise.ts";

// The Storybook post-build step (FR-023, research.md R-10, reviews/phase-3/spike.md step 2; T033): every inline
// <script> moves to a same-origin file referenced by src, every <style> element to a file referenced by <link>, and
// every style attribute becomes a data-ocelle-style attribute whose declarations move to a linked stylesheet, so no
// inline script, style element or style attribute remains. File names are `inline-<first 16 hex digits of the
// SHA-256 of the text>.<js|css>`, beside the HTML entry, so that relative imports in a moved module keep working.
// An external script is left as it is.
const hash = (text: string): string => createHash("sha256").update(text).digest("hex").slice(0, 16);

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("externalise", () => {
  it("moves an inline classic script to a file referenced by src", () => {
    const code = "\n      window.CONFIG_TYPE = 'PRODUCTION';\n    ";
    const result = externalise(`<head>\n<script>${code}</script>\n</head>`);
    expect(result).toEqual({
      html: `<head>\n<script src="./inline-${hash(code)}.js"></script>\n</head>`,
      files: [{ name: `inline-${hash(code)}.js`, text: code }],
    });
  });

  it("moves an inline module script, keeping its type and its other attributes", () => {
    const code = "import './sb-manager/runtime.js';";
    const result = externalise(`<body><script type="module" data-x="1">${code}</script></body>`);
    expect(result).toEqual({
      html: `<body><script type="module" data-x="1" src="./inline-${hash(code)}.js"></script></body>`,
      files: [{ name: `inline-${hash(code)}.js`, text: code }],
    });
  });

  it("replaces a <style> element by a <link> to a file holding its text, keeping its attributes", () => {
    const rules = "#storybook-root[hidden] { display: none !important; }";
    const result = externalise(`<head><style media="screen">${rules}</style></head>`);
    expect(result).toEqual({
      html: `<head><link rel="stylesheet" href="./inline-${hash(rules)}.css" media="screen"></head>`,
      files: [{ name: `inline-${hash(rules)}.css`, text: rules }],
    });
  });

  it("replaces style attributes by data-ocelle-style and moves their declarations to one stylesheet linked in the head", () => {
    const red = "color: red; max-width: 70ch";
    const blue = 'font-family: "A b"';
    const sheet = `[data-ocelle-style="${hash(red)}"] { ${red} }\n[data-ocelle-style="${hash(blue)}"] { ${blue} }\n`;
    const result = externalise(`<html><head><title>t</title></head><body><p style="${red}">a</p><p class="x" style='${blue}'>b</p><i style="${red}"></i></body></html>`);
    expect(result).toEqual({
      html:
        `<html><head><title>t</title><link rel="stylesheet" href="./inline-${hash(sheet)}.css"></head><body>` +
        `<p data-ocelle-style="${hash(red)}">a</p><p class="x" data-ocelle-style="${hash(blue)}">b</p><i data-ocelle-style="${hash(red)}"></i></body></html>`,
      files: [{ name: `inline-${hash(sheet)}.css`, text: sheet }],
    });
  });

  it("leaves an external script and a <link> as they are while moving the inline script beside them", () => {
    const external = '<script type="module" crossorigin src="./assets/iframe.js"></script><link rel="stylesheet" href="./tokens.css">';
    const result = externalise(`<head>${external}<script>x();</script></head>`);
    expect(result).toEqual({
      html: `<head>${external}<script src="./inline-${hash("x();")}.js"></script></head>`,
      files: [{ name: `inline-${hash("x();")}.js`, text: "x();" }],
    });
  });

  it("reads markup inside a moved script as script text, not as tags", () => {
    const code = "el.innerHTML = `<p style=\"color: red\">x</p><style>a{}</style>`;";
    const result = externalise(`<script>${code}</script><p>after</p>`);
    expect(result).toEqual({
      html: `<script src="./inline-${hash(code)}.js"></script><p>after</p>`,
      files: [{ name: `inline-${hash(code)}.js`, text: code }],
    });
  });

  it("writes one file for two inline scripts with the same text, and keeps them in document order", () => {
    const one = "a();";
    const two = "b();";
    const result = externalise(`<script>${one}</script><script>${two}</script><script>${one}</script>`);
    expect(result).toEqual({
      html: `<script src="./inline-${hash(one)}.js"></script><script src="./inline-${hash(two)}.js"></script><script src="./inline-${hash(one)}.js"></script>`,
      files: [
        { name: `inline-${hash(one)}.js`, text: one },
        { name: `inline-${hash(two)}.js`, text: two },
      ],
    });
  });

  it("leaves output that the csp gate's markup rules find nothing in", () => {
    const html =
      "<!doctype html>\n<html>\n<head>\n<style>@font-face { font-family: X; }</style>\n<script>window.a = 1;</script>\n</head>\n" +
      '<body>\n<div style="display: none"></div>\n<script type="module">import "./x.js";</script>\n</body>\n</html>\n';
    expect(scanMarkup("storybook/dist/x.html", html, 1).map((finding) => finding.rule)).toEqual(["style-element", "inline-script", "style-attribute", "inline-script"]);
    expect(scanMarkup("storybook/dist/x.html", externalise(html).html, 1)).toEqual([]);
  });
});

describe("externaliseDir", () => {
  it("rewrites every .html directly inside the directory and writes the moved files beside it", () => {
    const dir = mkdtempSync(join(tmpdir(), "ocelle-storybook-externalise-"));
    dirs.push(dir);
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "iframe.html"), "<script>a();</script>");
    writeFileSync(join(dir, "index.html"), "<style>b{}</style>");
    writeFileSync(join(dir, "sub", "c.html"), "<script>c();</script>");
    writeFileSync(join(dir, "d.js"), "<script>d();</script>");
    externaliseDir(dir);
    expect(readFileSync(join(dir, "iframe.html"), "utf8")).toBe(`<script src="./inline-${hash("a();")}.js"></script>`);
    expect(readFileSync(join(dir, "index.html"), "utf8")).toBe(`<link rel="stylesheet" href="./inline-${hash("b{}")}.css">`);
    expect(readFileSync(join(dir, `inline-${hash("a();")}.js`), "utf8")).toBe("a();");
    expect(readFileSync(join(dir, `inline-${hash("b{}")}.css`), "utf8")).toBe("b{}");
    expect(readFileSync(join(dir, "sub", "c.html"), "utf8")).toBe("<script>c();</script>");
    expect(readFileSync(join(dir, "d.js"), "utf8")).toBe("<script>d();</script>");
    expect(readdirSync(dir).sort()).toEqual(["d.js", "iframe.html", `inline-${hash("a();")}.js`, `inline-${hash("b{}")}.css`, "index.html", "sub"].sort());
  });
});

describe("externalise: attributes, text states and the head (added: mutation run)", () => {
  it("escapes & and \" in the attributes a <link> keeps, and keeps them all in order", () => {
    const rules = "a{}";
    const result = externalise(`<style media='screen and (x: "a&b")' id="s">${rules}</style>`);
    expect(result.html).toBe(`<link rel="stylesheet" href="./inline-${hash(rules)}.css" media="screen and (x: &quot;a&amp;b&quot;)" id="s">`);
  });

  it("reads markup inside a <style> as its text, not as tags", () => {
    const rules = 'a::before { content: "<b style=\'x\'>"; }';
    expect(externalise(`<head><style>${rules}</style></head>`)).toEqual({
      html: `<head><link rel="stylesheet" href="./inline-${hash(rules)}.css"></head>`,
      files: [{ name: `inline-${hash(rules)}.css`, text: rules }],
    });
  });

  it("links the style-attribute stylesheet before a </head> written with whitespace, and at the start without one", () => {
    const sheet = `[data-ocelle-style="${hash("a: b")}"] { a: b }\n`;
    const link = `<link rel="stylesheet" href="./inline-${hash(sheet)}.css">`;
    expect(externalise('<head></head\n><p style="a: b"></p>').html).toBe(`<head>${link}</head\n><p data-ocelle-style="${hash("a: b")}"></p>`);
    expect(externalise('<p style="a: b"></p>').html).toBe(`${link}<p data-ocelle-style="${hash("a: b")}"></p>`);
  });
});
