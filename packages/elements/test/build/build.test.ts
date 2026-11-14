import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { brandPairs, fr026Foregrounds, styleTemplate } from "../node/brand-pairs-check.ts";
import type { PairEntry } from "../node/brand-pairs-check.ts";
import { listboxRows, optionRows, selectionPairs } from "../node/selection-pairs-check.ts";
import { buildPackage, elements } from "./package-build.ts";

// The two builds as the package ships them (005 FR-001, FR-002, FR-004, FR-016, FR-029, FR-033; US1 scenario 17's
// import half; research.md R-05, T016), after the package's own build script:
// - the module build (dist/*.js) imports only its own files and `lit` or `lit/…`, and an element's module imports
//   neither the package root nor another element;
// - the browser build (dist/browser/ocelle-elements.js) is self-contained (no import statement and no dynamic import),
//   holds Lit's production build at the versions the lockfile resolves (lit-html 3.3.3, lit-element 4.2.2,
//   @lit/reactive-element 2.1.2) and none of its development build, no `ssr-dom-shim` and no console call, defines
//   `ocelle-icon` and `ocelle-brand-mark`, and starts with the licence banner;
// - from phase 5 (T055; US4 scenario 4, the stylesheet as shipped; analysis L5): the pairing check of
//   test/node/brand-pairs-check.ts on the `css` template of the built dist/ocelle-brand-mark.js finds exactly FR-026's
//   tokens per variant and every FR-026 pair checked in pairs.json, and dist/ocelle-brand-mark.js imports neither the
//   package root nor ocelle-icon.js.
// - since 014 phase 2 (research.md R-16, R-17; T017, T018): dist/ocelle-listbox.js imports ./ocelle-option.js (a parent's
//   entry defines its children) and dist/ocelle-option.js imports no other element; the selection pairs check of
//   test/node/selection-pairs-check.ts on the `css` templates of the built option and listbox finds R-15's tokens and
//   every pair checked; the browser build defines ocelle-listbox and ocelle-option.
const dist = join(elements, "dist");
const browserBuild = join(dist, "browser", "ocelle-elements.js");

/** The module specifiers a module imports or re-exports, static and dynamic. */
function specifiers(text: string): string[] {
  const found = [...text.matchAll(/(?:^|[;\s])(?:import|export)\s*(?:[^'";]*?\sfrom\s*)?["']([^"']+)["']/g), ...text.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)];
  return [...new Set(found.map((match) => String(match[1])))].sort();
}

function moduleFiles(): string[] {
  return existsSync(dist) ? readdirSync(dist).filter((name) => name.endsWith(".js")).sort() : [];
}

beforeAll(async () => {
  await buildPackage();
}, 300_000);

describe("the module build (dist/*.js)", () => {
  it("imports only its own files and lit or lit/…: lit, and the root its element module", () => {
    const files = moduleFiles();
    const imported = files.flatMap((name) => specifiers(readFileSync(join(dist, name), "utf8")).map((specifier) => ({ name, specifier })));
    const own = (specifier: string): boolean => specifier.startsWith("./") && files.includes(specifier.slice(2));
    const lit = (specifier: string): boolean => specifier === "lit" || specifier.startsWith("lit/");
    expect({
      files: files.filter((name) => ["index.js", "ocelle-icon.js", "ocelle-brand-mark.js", "browser.js"].includes(name)),
      outside: imported.filter(({ specifier }) => !own(specifier) && !lit(specifier)),
      litImported: imported.some(({ specifier }) => lit(specifier)),
      rootImportsIcon: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-icon.js"),
      rootImportsMark: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-brand-mark.js"),
    }).toEqual({ files: ["browser.js", "index.js", "ocelle-brand-mark.js", "ocelle-icon.js"], outside: [], litImported: true, rootImportsIcon: true, rootImportsMark: true });
  });

  it("dist/ocelle-brand-mark.js imports lit and the registration helper, but neither the package root nor ocelle-icon.js (US1-17)", () => {
    const imported = specifiers(existsSync(join(dist, "ocelle-brand-mark.js")) ? readFileSync(join(dist, "ocelle-brand-mark.js"), "utf8") : "");
    expect({
      lit: imported.includes("lit"),
      define: imported.includes("./define.js"),
      root: imported.includes("./index.js"),
      icon: imported.includes("./ocelle-icon.js"),
      elements: imported.filter((specifier) => specifier.startsWith("./ocelle-")),
    }).toEqual({ lit: true, define: true, root: false, icon: false, elements: [] });
  });

  it("the css template of dist/ocelle-brand-mark.js paints exactly FR-026's tokens per variant, each FR-026 pair a checked row of pairs.json (US4-4, the stylesheet as shipped)", () => {
    const shipped = styleTemplate(existsSync(join(dist, "ocelle-brand-mark.js")) ? readFileSync(join(dist, "ocelle-brand-mark.js"), "utf8") : "");
    const pairs = JSON.parse(readFileSync(join(elements, "..", "tokens", "contrast", "pairs.json"), "utf8")) as PairEntry[];
    expect(brandPairs(shipped, pairs)).toEqual({ painted: fr026Foregrounds, missing: [] });
  });

  it("dist/ocelle-icon.js imports lit and the registration helper, but neither the package root nor another element", () => {
    const imported = specifiers(existsSync(join(dist, "ocelle-icon.js")) ? readFileSync(join(dist, "ocelle-icon.js"), "utf8") : "");
    expect({
      lit: imported.includes("lit"),
      define: imported.includes("./define.js"),
      root: imported.includes("./index.js"),
      elements: imported.filter((specifier) => specifier.startsWith("./ocelle-")),
    }).toEqual({ lit: true, define: true, root: false, elements: [] });
  });
});

describe("the module build of the listbox (dist/ocelle-listbox.js, dist/ocelle-option.js)", () => {
  const read = (name: string): string => (existsSync(join(dist, name)) ? readFileSync(join(dist, name), "utf8") : "");

  it("dist/ocelle-listbox.js imports lit, the registration helper and ./ocelle-option.js, and not the package root; dist/ocelle-option.js imports no other element", () => {
    const listbox = specifiers(read("ocelle-listbox.js"));
    const option = specifiers(read("ocelle-option.js"));
    expect({
      lit: listbox.includes("lit"),
      define: listbox.includes("./define.js"),
      root: listbox.includes("./index.js"),
      elements: listbox.filter((specifier) => specifier.startsWith("./ocelle-")),
      optionElements: option.filter((specifier) => specifier.startsWith("./ocelle-")),
      optionDefine: option.includes("./define.js"),
    }).toEqual({ lit: true, define: true, root: false, elements: ["./ocelle-option.js"], optionElements: [], optionDefine: true });
  });

  it("the css templates of the built option and listbox paint R-15's tokens, each R-15 pair a checked row of pairs.json (the stylesheets as shipped)", () => {
    const pairs = JSON.parse(readFileSync(join(elements, "..", "tokens", "contrast", "pairs.json"), "utf8")) as PairEntry[];
    expect({
      option: selectionPairs(styleTemplate(read("ocelle-option.js")), optionRows.pairs, pairs),
      listbox: selectionPairs(styleTemplate(read("ocelle-listbox.js")), listboxRows.pairs, pairs),
      listboxSheet: styleTemplate(read("ocelle-listbox.js")) !== "",
    }).toEqual({ option: { painted: optionRows.painted, missing: [] }, listbox: { painted: listboxRows.painted, missing: [] }, listboxSheet: true });
  });
});

describe("the browser build (dist/browser/ocelle-elements.js)", () => {
  const text = (): string => (existsSync(browserBuild) ? readFileSync(browserBuild, "utf8") : "");

  it("is self-contained: it defines ocelle-icon, ocelle-brand-mark, ocelle-listbox and ocelle-option, with no import statement and no dynamic import", () => {
    const code = text();
    expect({
      exists: code !== "",
      definesIcon: code.includes('"ocelle-icon"'),
      definesMark: code.includes('"ocelle-brand-mark"'),
      definesListbox: code.includes('"ocelle-listbox"') && code.includes('"ocelle-option"'),
      specifiers: specifiers(code),
      dynamicImport: /\bimport\s*\(/.test(code),
    }).toEqual({ exists: true, definesIcon: true, definesMark: true, definesListbox: true, specifiers: [], dynamicImport: false });
  });

  it("holds Lit's production build at the locked versions, not its development build, no ssr-dom-shim and no console call", () => {
    const code = text();
    expect({
      litHtml: code.includes("litHtmlVersions") && /["']3\.3\.3["']/.test(code),
      litElement: code.includes("litElementVersions") && /["']4\.2\.2["']/.test(code),
      reactiveElement: code.includes("reactiveElementVersions") && /["']2\.1\.2["']/.test(code),
      development: ["lit-html/development", "dev mode", "development/"].filter((marker) => code.includes(marker)),
      ssrDomShim: code.includes("ssr-dom-shim"),
      console: code.includes("console."),
    }).toEqual({ litHtml: true, litElement: true, reactiveElement: true, development: [], ssrDomShim: false, console: false });
  });

  it("starts with the licence banner naming @ocelle/elements under Apache-2.0, Lit's copyright and BSD-3-Clause, and THIRD_PARTY_NOTICES", () => {
    const first = text().split("\n")[0] ?? "";
    expect({
      opens: first.startsWith("/*!"),
      statements: [
        "@ocelle/elements, Apache-2.0",
        "Includes Lit (lit, lit-html, lit-element, @lit/reactive-element), Copyright Google LLC, BSD-3-Clause",
        "Full notices: THIRD_PARTY_NOTICES in the @ocelle/elements package",
      ].filter((statement) => !first.includes(statement)),
    }).toEqual({ opens: true, statements: [] });
  });
});
