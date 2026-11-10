// The browser build (005 research.md R-05, FR-029, FR-033): Vite's library mode bundles src/browser.ts with Lit into
// one self-contained ES module, dist/browser/ocelle-elements.js, which imports nothing and defines every element, for
// hosts without a bundler that load it with one same-origin `<script type="module" src>` (the Ocelle console). It is
// public surface by its file path too: such a host copies the file out of the package (R-02). Nothing is external, and
// the export conditions are stated as production ones, so Lit's production build is bundled whatever NODE_ENV the build
// runs under (Vite picks `development` when NODE_ENV is set to anything but production, as a test runner sets it). The module build of
// `tsc` is in the same dist/, so the build keeps it (emptyOutDir false). The licence banner is an output banner,
// added after minification, so the minifier cannot drop it (operator decision, PLAN-A11Y-SECURITY-1-008 (a)).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** The banner the browser build's file starts with (FR-029). */
export const banner =
  "/*! @ocelle/elements, Apache-2.0. Includes Lit (lit, lit-html, lit-element, @lit/reactive-element), Copyright Google LLC, BSD-3-Clause. Full notices: THIRD_PARTY_NOTICES in the @ocelle/elements package. */";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)).replace(/\/$/, ""),
  logLevel: "warn",
  resolve: { conditions: ["module", "browser", "production"] },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: true,
    lib: { entry: "src/browser.ts", formats: ["es"], fileName: () => "browser/ocelle-elements.js" },
    rolldownOptions: { output: { banner } },
  },
});
