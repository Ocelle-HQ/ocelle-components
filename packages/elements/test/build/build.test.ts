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
      files: files.filter((name) => ["index.js", "ocelle-icon.js", "ocelle-brand-mark.js", "ocelle-card.js", "ocelle-section-header.js", "ocelle-page-header.js", "ocelle-context-sidebar.js", "ocelle-personal-rail.js", "browser.js"].includes(name)),
      outside: imported.filter(({ specifier }) => !own(specifier) && !lit(specifier)),
      litImported: imported.some(({ specifier }) => lit(specifier)),
      rootImportsIcon: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-icon.js"),
      rootImportsMark: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-brand-mark.js"),
      rootImportsCard: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-card.js"),
      rootImportsHeader: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-section-header.js"),
      rootImportsPageHeader: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-page-header.js"),
      rootImportsSidebar: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-context-sidebar.js"),
      rootImportsRail: imported.some(({ name, specifier }) => name === "index.js" && specifier === "./ocelle-personal-rail.js"),
    }).toEqual({
      files: ["browser.js", "index.js", "ocelle-brand-mark.js", "ocelle-card.js", "ocelle-context-sidebar.js", "ocelle-icon.js", "ocelle-page-header.js", "ocelle-personal-rail.js", "ocelle-section-header.js"],
      outside: [],
      litImported: true,
      rootImportsIcon: true,
      rootImportsMark: true,
      rootImportsCard: true,
      rootImportsHeader: true,
      rootImportsPageHeader: true,
      rootImportsSidebar: true,
      rootImportsRail: true,
    });
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

// 011 (FR-001, contracts/elements-package.md § Entry points; T015): each new element module imports lit, the
// registration helper and its own internal modules, and neither the package root nor another element's module.
describe("the module build's 011 element modules", () => {
  const imports = (file: string): string[] => specifiers(existsSync(join(dist, file)) ? readFileSync(join(dist, file), "utf8") : "");

  it("dist/ocelle-section-header.js imports lit, the registration helper, the slot state and the card context, and neither the package root nor another element", () => {
    const imported = imports("ocelle-section-header.js");
    expect({
      lit: imported.includes("lit"),
      own: imported.filter((specifier) => specifier.startsWith("./")),
      outside: imported.filter((specifier) => !specifier.startsWith("./") && specifier !== "lit" && !specifier.startsWith("lit/")),
    }).toEqual({ lit: true, own: ["./card-context.js", "./define.js", "./slot-state.js"], outside: [] });
  });

  it("dist/ocelle-card.js imports lit, the registration helper, the slot state and the card context, and neither the package root nor ocelle-section-header.js", () => {
    const imported = imports("ocelle-card.js");
    expect({
      lit: imported.includes("lit"),
      own: imported.filter((specifier) => specifier.startsWith("./")),
      outside: imported.filter((specifier) => !specifier.startsWith("./") && specifier !== "lit" && !specifier.startsWith("lit/")),
    }).toEqual({ lit: true, own: ["./card-context.js", "./define.js", "./slot-state.js"], outside: [] });
  });
});

// 011 phase 3 (FR-001, contracts/elements-package.md § Entry points; T027): the page header's module imports lit, the
// registration helper and the slot state, and neither the package root, the card context nor another element's module.
describe("the module build's page-header module", () => {
  it("dist/ocelle-page-header.js imports lit, the registration helper and the slot state, and neither the package root, the card context nor another element", () => {
    const imported = specifiers(existsSync(join(dist, "ocelle-page-header.js")) ? readFileSync(join(dist, "ocelle-page-header.js"), "utf8") : "");
    expect({
      lit: imported.includes("lit"),
      own: imported.filter((specifier) => specifier.startsWith("./")),
      outside: imported.filter((specifier) => !specifier.startsWith("./") && specifier !== "lit" && !specifier.startsWith("lit/")),
    }).toEqual({ lit: true, own: ["./define.js", "./slot-state.js"], outside: [] });
  });
});

// 011 phase 4 (FR-001, contracts/elements-package.md § Entry points; T034): the context sidebar's module imports lit,
// the registration helper, the naming module (its internals key and accessible name) and the slot state, and neither
// the package root, the card context nor another element's module.
describe("the module build's context-sidebar module", () => {
  it("dist/ocelle-context-sidebar.js imports lit, the registration helper, the naming module and the slot state, and neither the package root, the card context nor another element", () => {
    const imported = specifiers(existsSync(join(dist, "ocelle-context-sidebar.js")) ? readFileSync(join(dist, "ocelle-context-sidebar.js"), "utf8") : "");
    expect({
      lit: imported.includes("lit"),
      own: imported.filter((specifier) => specifier.startsWith("./")),
      outside: imported.filter((specifier) => !specifier.startsWith("./") && specifier !== "lit" && !specifier.startsWith("lit/")),
    }).toEqual({ lit: true, own: ["./define.js", "./naming.js", "./slot-state.js"], outside: [] });
  });
});

// 011 phase 5 (FR-001, contracts/elements-package.md § Entry points; T042): the personal rail's module imports lit,
// the registration helper, the naming module (its internals key and accessible name) and the slot state, and neither
// the package root, the card context nor another element's module.
describe("the module build's personal-rail module", () => {
  it("dist/ocelle-personal-rail.js imports lit, the registration helper, the naming module and the slot state, and neither the package root, the card context nor another element", () => {
    const imported = specifiers(existsSync(join(dist, "ocelle-personal-rail.js")) ? readFileSync(join(dist, "ocelle-personal-rail.js"), "utf8") : "");
    expect({
      lit: imported.includes("lit"),
      own: imported.filter((specifier) => specifier.startsWith("./")),
      outside: imported.filter((specifier) => !specifier.startsWith("./") && specifier !== "lit" && !specifier.startsWith("lit/")),
    }).toEqual({ lit: true, own: ["./define.js", "./naming.js", "./slot-state.js"], outside: [] });
  });
});

// 011 phase 4 review R2-02 (landing L1-02; FR-034, research.md R-11 § Type declarations; T051): the published type
// declarations, like the manifest, do not declare the internals key: the landmark classes' declarations declare
// `label` and no `internalsKey` (neither the `[internalsKey]` member nor its import), and the naming module's declare
// `accessibleName` and no `internalsKey` export. Each "no" sits beside its positive in the same assertion.
describe("the module build's type declarations", () => {
  const declarations = (file: string): string => (existsSync(join(dist, file)) ? readFileSync(join(dist, file), "utf8") : "");

  it("dist/ocelle-context-sidebar.d.ts and dist/ocelle-personal-rail.d.ts declare label and no internalsKey, and dist/naming.d.ts declares accessibleName and no internalsKey", () => {
    const read = (file: string, positive: string): { readonly declares: boolean; readonly internalsKey: boolean } => {
      const text = declarations(file);
      return { declares: text.includes(positive), internalsKey: text.includes("internalsKey") };
    };
    expect({
      sidebar: read("ocelle-context-sidebar.d.ts", "label: string | undefined;"),
      rail: read("ocelle-personal-rail.d.ts", "label: string | undefined;"),
      naming: read("naming.d.ts", "export declare function accessibleName("),
    }).toEqual({
      sidebar: { declares: true, internalsKey: false },
      rail: { declares: true, internalsKey: false },
      naming: { declares: true, internalsKey: false },
    });
  });
});

describe("the browser build (dist/browser/ocelle-elements.js)", () => {
  const text = (): string => (existsSync(browserBuild) ? readFileSync(browserBuild, "utf8") : "");

  it("is self-contained: it defines ocelle-icon, ocelle-brand-mark, ocelle-card, ocelle-section-header, ocelle-page-header, ocelle-context-sidebar and ocelle-personal-rail, with no import statement and no dynamic import", () => {
    const code = text();
    expect({
      exists: code !== "",
      definesIcon: code.includes('"ocelle-icon"'),
      definesMark: code.includes('"ocelle-brand-mark"'),
      definesCard: code.includes('"ocelle-card"'),
      definesHeader: code.includes('"ocelle-section-header"'),
      definesPageHeader: code.includes('"ocelle-page-header"'),
      definesSidebar: code.includes('"ocelle-context-sidebar"'),
      definesRail: code.includes('"ocelle-personal-rail"'),
      specifiers: specifiers(code),
      dynamicImport: /\bimport\s*\(/.test(code),
    }).toEqual({ exists: true, definesIcon: true, definesMark: true, definesCard: true, definesHeader: true, definesPageHeader: true, definesSidebar: true, definesRail: true, specifiers: [], dynamicImport: false });
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
