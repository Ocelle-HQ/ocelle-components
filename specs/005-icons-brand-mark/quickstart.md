# Quickstart: validating 005

Prerequisites: `pnpm install --frozen-lockfile`; `export OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
in this container (CI uses Playwright's own Chromium). Run one heavy job at a time.

1. Build: `pnpm -r build` → `packages/elements/dist/{index,ocelle-icon,ocelle-brand-mark}.js` and
   `dist/browser/ocelle-elements.js`.
2. Element tests: `pnpm exec vitest run --project elements --project elements-node --project elements-build
   --project elements-browser` — all pass (contracts/checks.md § Package tests).
3. Manifest: `pnpm --filter @ocelle/elements run manifest && git diff --exit-code packages/elements/custom-elements.json`,
   then `pnpm run gate:manifest` → exit 0.
4. Gates touched: `pnpm run gate:style-lint`, `gate:contrast`, `gate:csp`, `gate:prefix`, `gate:pins` → exit 0
   (`gate:pins` with the two approved install scripts, `rs-module-lexer@2.9.0` and `fsevents@2.3.3`, research.md R-16);
   `pnpm run gate:plants` → every plant judged as expected (manifest, style-lint, mutation and pins plants included).
   After `pnpm install`, `@xn-sakina/rml-wasm` is absent from `node_modules` (the approved script found its native
   binding and fetched nothing), and `fsevents` is absent (Linux; its approved script runs only on macOS).
5. Mutation of the phase's changes: `pnpm run gate:mutation -- --base <phase base>` → no survivor without a reason.
6. By hand (optional): serve `packages/elements/test/browser/fixtures/icon.html` with the strict CSP header and
   open it in Chromium; the thirteen icons and three mark variants render with no console message.
