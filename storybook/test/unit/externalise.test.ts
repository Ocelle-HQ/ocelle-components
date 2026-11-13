import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { scanMarkup } from "../../../gates/bin/csp.ts";
import { externalise, externaliseDir } from "../../scripts/externalise.ts";

// The Storybook post-build step, cut down to <style> elements (006 research.md R-10, plan decision 5; operator decision
// on PLAN-FRESH-1-009, option (a)): every <style> element of a built HTML entry moves to a same-origin file referenced
// by a <link>, so Storybook's multi-line vendor monospace stack stays out of the HTML the prefix gate reads. The
// Storybook is not a CSP target any more (006 FR-020), so inline <script> elements and style attributes stay as they
// are, and no `inline-<hash>.js` file is written. File names are `inline-<first 16 hex digits of the SHA-256 of the
// text>.css`, beside the HTML entry.
const hash = (text: string): string => createHash("sha256").update(text).digest("hex").slice(0, 16);

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("externalise", () => {
  it("leaves an inline classic script and an inline module script in the HTML as they are, writing no file", () => {
    const html = "<head>\n<script>\n      window.CONFIG_TYPE = 'PRODUCTION';\n    </script>\n</head><body><script type=\"module\" data-x=\"1\">import './x.js';</script></body>";
    expect(externalise(html)).toEqual({ html, files: [] });
  });

  // The stylesheet has the shape of Storybook's vendor stack (a `font-family:` whose families follow on later lines);
  // its families are sans-serif ones, since this file is in the prefix gate's Storybook scope.
  it("moves the <style> after an inline script, a font stack over several lines, to a file referenced by a <link>, leaving the script inline", () => {
    const rules = "\n  code {\n    font-family:\n      ui-sans-serif, Arial,\n      sans-serif;\n  }\n";
    expect(externalise(`<head><script>a();</script><style>${rules}</style></head>`)).toEqual({
      html: `<head><script>a();</script><link rel="stylesheet" href="./inline-${hash(rules)}.css"></head>`,
      files: [{ name: `inline-${hash(rules)}.css`, text: rules }],
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

  it("leaves style attributes as they are, while moving a <style> beside them", () => {
    const html = '<html><head><title>t</title><style>a{}</style></head><body><p style="color: red">a</p></body></html>';
    expect(externalise(html)).toEqual({
      html: `<html><head><title>t</title><link rel="stylesheet" href="./inline-${hash("a{}")}.css"></head><body><p style="color: red">a</p></body></html>`,
      files: [{ name: `inline-${hash("a{}")}.css`, text: "a{}" }],
    });
  });

  it("reads markup inside an inline script as script text, not as a <style> to move", () => {
    const html = "<script>el.innerHTML = `<style>a{}</style>`;</script><style>b{}</style>";
    expect(externalise(html)).toEqual({
      html: `<script>el.innerHTML = \`<style>a{}</style>\`;</script><link rel="stylesheet" href="./inline-${hash("b{}")}.css">`,
      files: [{ name: `inline-${hash("b{}")}.css`, text: "b{}" }],
    });
  });

  it("writes one file for two <style> elements with the same text, and keeps the links in document order around an inline script", () => {
    const one = "a{}";
    const two = "b{}";
    const result = externalise(`<style>${one}</style><script>x();</script><style>${two}</style><style>${one}</style>`);
    expect(result).toEqual({
      html: `<link rel="stylesheet" href="./inline-${hash(one)}.css"><script>x();</script><link rel="stylesheet" href="./inline-${hash(two)}.css"><link rel="stylesheet" href="./inline-${hash(one)}.css">`,
      files: [
        { name: `inline-${hash(one)}.css`, text: one },
        { name: `inline-${hash(two)}.css`, text: two },
      ],
    });
  });

  it("leaves output in which the csp gate's markup rules find the inline scripts and the style attribute, and no <style> element", () => {
    const html =
      "<!doctype html>\n<html>\n<head>\n<style>@font-face { font-family: X; }</style>\n<script>window.a = 1;</script>\n</head>\n" +
      '<body>\n<div style="display: none"></div>\n<script type="module">import "./x.js";</script>\n</body>\n</html>\n';
    expect(scanMarkup("storybook/dist/x.html", html, 1).map((finding) => finding.rule)).toEqual(["style-element", "inline-script", "style-attribute", "inline-script"]);
    expect(scanMarkup("storybook/dist/x.html", externalise(html).html, 1).map((finding) => finding.rule)).toEqual(["inline-script", "style-attribute", "inline-script"]);
  });
});

describe("externaliseDir", () => {
  it("rewrites every .html directly inside the directory and writes the moved stylesheets beside it, scripts left inline", () => {
    const dir = mkdtempSync(join(tmpdir(), "ocelle-storybook-externalise-"));
    dirs.push(dir);
    mkdirSync(join(dir, "sub"));
    writeFileSync(join(dir, "iframe.html"), "<script>a();</script><style>a{}</style>");
    writeFileSync(join(dir, "index.html"), "<style>b{}</style>");
    writeFileSync(join(dir, "sub", "c.html"), "<style>c{}</style>");
    writeFileSync(join(dir, "d.js"), "<style>d{}</style>");
    externaliseDir(dir);
    expect(readFileSync(join(dir, "iframe.html"), "utf8")).toBe(`<script>a();</script><link rel="stylesheet" href="./inline-${hash("a{}")}.css">`);
    expect(readFileSync(join(dir, "index.html"), "utf8")).toBe(`<link rel="stylesheet" href="./inline-${hash("b{}")}.css">`);
    expect(readFileSync(join(dir, `inline-${hash("a{}")}.css`), "utf8")).toBe("a{}");
    expect(readFileSync(join(dir, `inline-${hash("b{}")}.css`), "utf8")).toBe("b{}");
    expect(readFileSync(join(dir, "sub", "c.html"), "utf8")).toBe("<style>c{}</style>");
    expect(readFileSync(join(dir, "d.js"), "utf8")).toBe("<style>d{}</style>");
    expect(readdirSync(dir).sort()).toEqual(["d.js", "iframe.html", `inline-${hash("a{}")}.css`, `inline-${hash("b{}")}.css`, "index.html", "sub"].sort());
  });
});

describe("externalise: attributes and text states (added: mutation run)", () => {
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
});
