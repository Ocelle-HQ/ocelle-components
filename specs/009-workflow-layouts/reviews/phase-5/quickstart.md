# Phase 5, T065: the quickstart run

Every command of `specs/009-workflow-layouts/quickstart.md` § Run, run once on 2026-11-15/16, one heavy job at a
time, on the branch at the phase's green working tree (the red commit `fc64db2` plus T064's README and changelog
statements; no source change in phase 5). `main` was not merged first (operator decision M1, `merge.md`).

Environment: `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1248/chrome-linux64/chrome` (from
`pnpm run setup:offline`), `OCELLE_VISUAL_ENGINE=docker` for the Storybook gates and the plants (podman is not
installed; docker was running).

| Step | Command | Exit | Output |
|---|---|---|---|
| Elements, in process | `pnpm vitest run --project elements` | 0 | 29 files, 435 tests passed |
| Elements, strict-CSP fixtures | `pnpm vitest run --project elements-browser` | 0 | 10 files, 231 tests passed |
| Tokens | `pnpm vitest run --project tokens` | 0 | 12 files, 142 tests passed |
| | `pnpm run gate:contrast` | 0 | `contrast: 160 pairs checked in light, 168 in dark (149 required per theme)` |
| Manifest | `pnpm --filter @ocelle/elements run manifest` | 0 | `custom-elements.json` unchanged (`git status` shows no diff) |
| | `pnpm run gate:manifest` | 0 | `manifest: 6 elements checked, no finding` |
| Lint and CSP | `pnpm run gate:style-lint` | 0 | `style-lint: 20 files checked, no finding` |
| | `pnpm run gate:csp` | 0 | `csp: 18 files checked, no finding` |
| Gate plants | `pnpm run gate:plants` | 0 | `plants: 306 plants of 17 gates and the registry judged, every plant as expected` (5679 s). The gradient plants: `style-lint/fail-gradient-angle`, `fail-gradient-hex`, `fail-gradient-length` and `fail-radial-gradient` caught, `pass-linear-gradient-tokens` accepted |
| Mutation | `pnpm run gate:mutation -- --base 3828d2f` | 0 | `mutation: 860 mutants on the changed lines of 11 files, none survived; 2 timeouts, 258 compile errors, 1 zero-mutant entry; 33 equivalent records` (1178 s) |
| Stories | `pnpm run gate:storybook-build` | 0 | `storybook-build: built 44 stories` |
| | `pnpm run gate:visual` | 0 | `visual: 88 captures match their baselines (docker only: no cross-engine comparison)` |
| | `pnpm run gate:axe` | 0 | `axe: 88 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` |

Notes:

- **Mutation base.** `gate:mutation` needs `--base`. The quickstart's scope is the feature's changes in
  `packages/elements/src/**` and `packages/tokens/src/source.ts`, so the base is the branch's merge base with
  `origin/main`, `3828d2f` (Mission 006, #10), not the phase's `base.sha` (phase 5 changes no source). The plan was
  45 shards over `gates/stylelint/token-only.ts`, `packages/elements/src/{index,lane-count,list-detail-measure,
  ocelle-list-detail,ocelle-scroller,ocelle-workflow-board,ocelle-workflow-lane,overflow-region,tiers}.ts` and
  `packages/tokens/src/source.ts`. The 2 timeouts are `ocelle-list-detail.ts:250` and `:251` (`connectedCallback`,
  as phase 4 recorded). Compile errors by file: `overflow-region.ts` 125, `ocelle-list-detail.ts` 53, `tiers.ts` 34,
  `lane-count.ts` 13, `source.ts` 12, `list-detail-measure.ts` 9, `ocelle-workflow-board.ts` 5, `ocelle-scroller.ts`
  4, `ocelle-workflow-lane.ts` 2, `token-only.ts` 1. The zero-mutant entry is `packages/elements/src/index.ts`.
- **Axe notes.** The 10 excepted notes are 003's `base-styles--prose-document` wide-table contrast exceptions, as
  before.
- **The other gates**, run after the quickstart on the same tree: `gate:typecheck`, `gate:lint` (308 files),
  `gate:test-lint` (210 files), `gate:prefix` (266 files), `gate:pins` (5 manifests), `gate:brand-rules` (7 rules) and
  `gate:config-copies` all exit 0 with no finding; `pnpm test` exits 0 with 3773 tests passed in 163 files.
- **Look at it by hand** (quickstart's second section) is not a command and was not done in this headless run; its
  stories are covered by the `visual` and `axe` gates above and its tree statements by the browser suites.
- **Rechecks.** #10 is on `main` and in the branch (merge base `3828d2f`). `main` holds no commit of #8 (011), so
  R-16's recheck finds no uppercase letter-spacing token or container-tier convention to reconcile (`merge.md`).
