// The browser build's entry (005 research.md R-05, FR-033): vite.browser.config.ts bundles it with Lit into one
// self-contained module, dist/browser/ocelle-elements.js, which defines every element when loaded (since 020 also
// `ocelle-disclosure`, through the root).
import "./index.ts";
