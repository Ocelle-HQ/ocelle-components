import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import config from "../../vite.browser.config.ts";

// The browser build's configuration (005 research.md R-05, FR-029, FR-033, T016), imported in process so its mutants
// are killed here (the spawned build of test/build/ does not see Stryker's active mutant): library mode on
// src/browser.ts, ES format, one file dist/browser/ocelle-elements.js (the public file path a host copies), the
// module build's dist/ kept (emptyOutDir false), nothing external (Lit is bundled), no `development` condition (Lit's
// production build), and the licence banner, an output banner, so the minifier keeps it (PLAN-A11Y-SECURITY-1-008).
const elements = fileURLToPath(new URL("../..", import.meta.url));
const built = config;

const banner =
  "/*! @ocelle/elements, Apache-2.0. Includes Lit (lit, lit-html, lit-element, @lit/reactive-element), Copyright Google LLC, BSD-3-Clause. Full notices: THIRD_PARTY_NOTICES in the @ocelle/elements package. */";

describe("vite.browser.config.ts", () => {
  it("builds src/browser.ts in library mode as one ES module, dist/browser/ocelle-elements.js, keeping the module build's dist/", () => {
    const lib = built.build?.lib;
    const fileName = lib === false || lib === undefined ? undefined : lib.fileName;
    expect({
      root: built.root,
      entry: lib === false || lib === undefined || typeof lib.entry !== "string" ? lib : resolve(built.root ?? elements, lib.entry),
      formats: lib === false || lib === undefined ? undefined : lib.formats,
      file: typeof fileName === "function" ? fileName("es", "browser") : fileName,
      outDir: built.build?.outDir,
      emptyOutDir: built.build?.emptyOutDir,
    }).toEqual({
      root: elements.replace(/\/$/, ""),
      entry: resolve(elements, "src/browser.ts"),
      formats: ["es"],
      file: "browser/ocelle-elements.js",
      outDir: "dist",
      emptyOutDir: false,
    });
  });

  it("bundles everything, with no external and no development condition", () => {
    expect({
      external: built.build?.rolldownOptions?.external,
      conditions: built.resolve?.conditions ?? [],
    }).toEqual({ external: undefined, conditions: expect.not.arrayContaining(["development"]) as unknown });
    expect(built.build?.rolldownOptions).toBeDefined();
  });

  it("prepends the licence banner as an output banner, naming Apache-2.0, Lit's copyright and BSD-3-Clause, and THIRD_PARTY_NOTICES", () => {
    const output = built.build?.rolldownOptions?.output;
    expect(Array.isArray(output) ? undefined : output?.banner).toBe(banner);
  });
});
