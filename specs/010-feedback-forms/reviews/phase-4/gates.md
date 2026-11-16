# Phase 4 phase-end gates (T057)

Run in this container (4 CPUs, Chromium 153 build 1243 through `OCELLE_CHROMIUM_PATH`), one job at a time, on
2026-11-16. The source is the same at `5908fa7` and `e0b1c77`; `e0b1c77` changes only test files.

| Gate | At | Result |
|---|---|---|
| `gate:unit-tests` | `e0b1c77` | exit 0, "3914 tests passed in 161 files", 10:20 wall-clock (at `5908fa7`: 3913 tests, 10:13) |
| `gate:typecheck` | `e0b1c77` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | `e0b1c77` | exit 0, "320 files checked, no finding" |
| `gate:style-lint` | `e0b1c77` | exit 0, "18 files checked, no finding" |
| `gate:test-lint` | `e0b1c77` | exit 0, "224 files checked, no finding" |
| `gate:csp` (after `pnpm -r build`) | `e0b1c77` | exit 0, "23 files checked, no finding" |
| `gate:prefix` (after `pnpm -r build`) | `e0b1c77` | exit 0, "289 files checked, no finding" |
| `gate:config-copies` | `e0b1c77` | exit 0, the two `story-config.yml` copies identical |
| `gate:pins` | `e0b1c77` | exit 0, "5 manifests checked, no finding" |
| `gate:signoff -- --range 835df81..HEAD` | `e0b1c77` | exit 0, "7 commits checked, no finding" |
| `gate:contrast` | `e0b1c77` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:brand-rules` | `e0b1c77` | exit 0, "7 rules checked" |
| `gate:manifest` | `e0b1c77` | exit 0, "5 elements checked, no finding"; `pnpm --filter @ocelle/elements run manifest` regenerates `custom-elements.json` with no diff |
| `gate:plants` (`OCELLE_VISUAL_ENGINE=docker`) | `5908fa7` | exit 0, "301 plants of 17 gates and the registry judged, every plant as expected", 60:17 (`plants.md`) |
| `gate:mutation -- --base 835df81` (whole diff) | `e0b1c77` | exit 0, run 2: 154 mutants on the changed lines of 5 files, none survived; 0 timeouts, 32 compile errors, 3 zero-mutant entries; 0 equivalent records; 8:40 (`mutation.md`) |

`gate:storybook-build`, `gate:visual` and `gate:axe` belong to phase 5 (User Story 4) and were not run, as in phase 3.

## `gates/test/integration/setup-offline.test.ts`

The one failure of this test that `red-phase-direct.log` showed under stop 1 (an offline install against an empty
store that expects a "missing: is-number" message) did not recur: the test passed in every run of this session, in
`red.sh 4 phase` at `43bec71` (its failures list has no `gates/` test but the manifest ones) and in the three
`gate:unit-tests` runs above. So it was not run at the phase base `835df81`: there was no failure to compare. It is
recorded as a one-off of the earlier direct run, not a finding of this phase.
