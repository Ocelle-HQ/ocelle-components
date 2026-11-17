# Quickstart: validating 011

Prerequisites: #10 merged on `main` and merged into this branch at landing; `pnpm install --frozen-lockfile`;
`export OCELLE_CHROMIUM_PATH=…` in this container (CI uses Playwright's Chromium); a container engine (podman or
docker) for the visual gate. Run one heavy job at a time.

1. Build: `pnpm -r build` → `packages/elements/dist/ocelle-{card,section-header,page-header,context-sidebar,personal-rail}.js`
   and the browser build defining all seven elements; `packages/tokens/dist/tokens.css` defines the four eyebrow
   tokens.
2. Element tests: `pnpm exec vitest run --project elements --project elements-node --project elements-build
   --project elements-browser` → all pass (contracts/checks.md § Package tests); `pnpm exec vitest run --project
   storybook-integration` → the story test passes, including its 320 × 800 px pass over every new story (SC-002).
3. Manifest: `pnpm --filter @ocelle/elements run manifest && git diff --exit-code packages/elements/custom-elements.json`;
   `pnpm run gate:manifest` → exit 0.
4. Token gates: `pnpm run gate:contrast` → "169 pairs checked in light, 177 in dark (158 required per theme)";
   `gate:brand-rules`, `gate:style-lint`, `gate:prefix` → exit 0.
5. CSP: `pnpm run gate:csp` → exit 0.
6. Storybook (from #10): `pnpm run gate:storybook-build`, `pnpm run gate:visual`, `pnpm run gate:axe` → exit 0, with
   the new baselines under `storybook/baselines/`.
7. Mutation: `pnpm run gate:mutation -- --base <phase base>` → no survivor without a recorded reason.
8. Style plants: `reviews/phase-N/plants.md` records, for every declaration of the phase's new `css` templates, the
   scenario that failed when it was neutralised, or the reason it is equivalent (research.md R-17).
