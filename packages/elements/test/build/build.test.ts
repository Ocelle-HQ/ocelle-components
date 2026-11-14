import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { brandPairs, fr026Foregrounds, styleTemplate } from "../node/brand-pairs-check.ts";
import type { PairEntry } from "../node/brand-pairs-check.ts";
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

// 013 (T007; contracts/elements.md § Modules and exports, PLAN-CORRECTNESS-1-012 (a)): the container import rule. A
// container module imports its item element and no other element: dist/ocelle-facts.js imports ./ocelle-fact.js and
// no other element module, and dist/ocelle-fact.js imports none; the sheet's shipped stylesheet holds its two-column
// tracks (R-03) and the threshold's default (R-02).
describe("the module build of ocelle-facts and ocelle-fact (013)", () => {
  const read = (name: string): string => (existsSync(join(dist, name)) ? readFileSync(join(dist, name), "utf8") : "");

  it("dist/ocelle-facts.js imports lit, the registration helper and ./ocelle-fact.js, and no other element module nor the root", () => {
    const imported = specifiers(read("ocelle-facts.js"));
    expect({
      lit: imported.includes("lit"),
      define: imported.includes("./define.js"),
      root: imported.includes("./index.js"),
      elements: imported.filter((specifier) => specifier.startsWith("./ocelle-")),
    }).toEqual({ lit: true, define: true, root: false, elements: ["./ocelle-fact.js"] });
  });

  it("dist/ocelle-fact.js imports lit and the registration helper, and no element module nor the root", () => {
    const imported = specifiers(read("ocelle-fact.js"));
    expect({
      lit: imported.includes("lit"),
      define: imported.includes("./define.js"),
      root: imported.includes("./index.js"),
      elements: imported.filter((specifier) => specifier.startsWith("./ocelle-")),
    }).toEqual({ lit: true, define: true, root: false, elements: [] });
  });

  it("dist/ocelle-facts.js ships the two-column tracks fit-content(50%) minmax(0, 1fr), the four grid tracks and the threshold's default calc(var(--ocelle-space-10) * 6)", () => {
    const code = read("ocelle-facts.js").replace(/\s+/g, " ");
    expect({
      columns: code.includes("grid-template-columns: fit-content(50%) minmax(0, 1fr)"),
      grid: code.includes("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)"),
      threshold: code.includes("calc(var(--ocelle-space-10) * 6)"),
    }).toEqual({ columns: true, grid: true, threshold: true });
  });
});

describe("the browser build (dist/browser/ocelle-elements.js)", () => {
  const text = (): string => (existsSync(browserBuild) ? readFileSync(browserBuild, "utf8") : "");

  it("is self-contained: it defines ocelle-icon, ocelle-brand-mark, ocelle-facts and ocelle-fact, with no import statement and no dynamic import", () => {
    const code = text();
    expect({
      exists: code !== "",
      definesIcon: code.includes('"ocelle-icon"'),
      definesMark: code.includes('"ocelle-brand-mark"'),
      definesFacts: code.includes('"ocelle-facts"') && code.includes('"ocelle-fact"'),
      specifiers: specifiers(code),
      dynamicImport: /\bimport\s*\(/.test(code),
    }).toEqual({ exists: true, definesIcon: true, definesMark: true, definesFacts: true, specifiers: [], dynamicImport: false });
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
