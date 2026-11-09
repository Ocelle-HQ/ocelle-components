# Phase 2 checks (T022)

Run by the implementer on 2026-11-09 in the container (Node 22, not the pinned 26.13.0; Chromium 153.0.8010.12 from
`PLAYWRIGHT_BROWSERS_PATH`), one heavy job at a time.

| Check | Result |
|---|---|
| `pnpm -r build` | exit 0; `packages/styles/dist/base.css` identical to `src/base.css` (`cmp`) |
| `pnpm test` | 1881 tests passed in 92 files at the green commit (`styles`, `styles-browser`, `storybook`, `storybook-integration` included) |
| `gate:typecheck`, `gate:lint`, `gate:test-lint` | no finding |
| `gate:style-lint`, `gate:prefix`, `gate:csp` | no finding |
| `gate:contrast`, `gate:brand-rules`, `gate:config-copies`, `gate:pins` | pass (pins: 5 manifests, the `@ocelle/tokens` peer dependency accepted) |
| `gate:plants` (alone) | 182 plants of 13 gates judged, every plant as expected (the four `fail-styles-*-line-height` plants, `pass-styles-line-height-token` and the moved `pass-line-height` included) |
| `gate:mutation -- --base d8dba60` | first run: 8 survivors (7 in the `lineHeight` option of `gates/stylelint/token-only.ts`, 1 in `storybook/scripts/swatches.ts`), killed by tests added in `test(003-base-styles): phase 2 — kill the mutation run's survivors`; second run: 146 mutants on the changed lines of 5 files, none survived, 8 equivalent records (the I/O and process boundary records of `packages/styles/scripts/build.ts` and `storybook/scripts/swatches.ts`). One shard, about 130 s |
| `tdd-check.sh 2` | `pass` (red commit red, final tests fail on the scaffold with 91 failures, tests pass at HEAD) |

**`styles-browser` suite time**: 5.9 s for the 22 tests of `base.test.ts` (Vitest duration), against the plan's 60 s
goal.
