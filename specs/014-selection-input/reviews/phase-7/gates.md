# Phase 7 — full gate run (T113)

Run per `specs/014-selection-input/quickstart.md` on 2026-11-17 at `7a81113` (phase 7 green; base `dbc9322`), one
heavy job at a time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker`. `gate:plants` and `gate:mutation` ran detached; no container restart interrupted a run.

| Step | Command | Exit | Result |
|---|---|---|---|
| 1 | `pnpm -r build` | 0 | `dist/` holds one module per element; `dist/browser/ocelle-elements.js` built |
| 2 | `pnpm exec vitest run --project elements --project elements-node --project elements-build --project elements-browser --project elements-browser-file` | 0 | 51 files, 1249 tests passed |
| 3 | `pnpm --filter @ocelle/elements run manifest && git diff --exit-code packages/elements/custom-elements.json` | 0 | manifest regenerates unchanged |
| 3 | `pnpm run gate:manifest` | 0 | 11 elements checked, no finding |
| 4 | `pnpm run gate:storybook-build` | 0 | 55 stories built |
| 4 | `pnpm run gate:visual` (docker) | 0 | 110 captures match their baselines (docker only: no cross-engine comparison) |
| 4 | `pnpm run gate:axe` | 0 | 110 story-theme runs, 0 serious or critical; 22 notes, all the scrolling listbox story's excepted clipped options (FR-051), 0 incomplete |
| 5 | `pnpm run gate:typecheck` | 0 | no type error |
| 5 | `pnpm run gate:lint` | 0 | 320 files, no finding |
| 5 | `pnpm run gate:test-lint` | 0 | 217 files, no finding |
| 5 | `pnpm run gate:style-lint` | 0 | 25 files, no finding |
| 5 | `pnpm run gate:brand-rules` | 0 | 7 rules checked |
| 5 | `pnpm run gate:unit-tests` | 0 | 4098 tests passed in 168 files |
| 5 | `pnpm run gate:signoff -- --range dbc9322..HEAD` | 0 | 2 commits checked (red `fe1d413`, green `7a81113`), no finding |
| 5 | `pnpm run gate:pins` | 0 | 5 manifests, no finding |
| 5 | `pnpm run gate:config-copies` | 0 | the two `story-config.yml` copies are identical |
| 5 | `pnpm run gate:contrast` | 0 | 166 pairs in light, 174 in dark (155 required per theme) |
| 5 | `pnpm run gate:csp` | 0 | 30 files, no finding |
| 5 | `pnpm run gate:prefix` | 0 | 302 files, no finding |
| 5 | `pnpm run gate:plants` | 0 | 301 plants of 17 gates and the registry judged, every plant as expected |
| 5 | `pnpm exec vitest run --project gates` | 0 | 65 files, 2207 tests passed |
| 6 | `pnpm run gate:mutation -- --base dbc9322` | 0 | 0 mutants on the changed lines of 1 file (`ocelle-link.ts`, a comment change only: one zero-mutant entry), none survived |

`pnpm run visual:update` was not run: phase 7 changes no story, element style or token, so no baseline can change, and
`gate:visual` matched every existing baseline. The baselines in the tree were captured under docker in phases 2 to 6.

The red check of this phase (`red.sh 7 phase` on `fe1d413`): tests only, red, recorded. The 70 new documentation tests
fail on the missing README overview statements, examples and CHANGELOG lead; three `plant-repo.test.ts` integration
tests timed out at 5 s in that run under load (unrelated to the phase; they pass in the runs above).

## Known gaps

- **Visual baselines: docker only.** Every baseline was captured in the pinned container under docker; no podman
  cross-engine check was possible in this session. CI runs both engines and confirms the baselines at landing.
- **WebKit clipboard user activation (R-07): open.** Whether WebKit still counts the click's activation when the copy
  field's request arrives a frame later is not measured; the question stays with the console and kitty-mission-ui
  owners (`reviews/phase-5/notes.md`). The README tells page-copying hosts to check their engines' rules.
- **Upstream axe-core report: still to be filed.** The axe-core 4.14.0 `color-contrast` incomplete on slotted link
  text wrapped onto exactly two lines (phase 6 operator decision 4, `reviews/phase-6/notes.md`) is documented in the
  README but not yet reported upstream.
- **Composed dialog story: deferred to landing.** The `ocelle-dialog` + `ocelle-listbox` story (FR-054) and its docker
  baselines are added during `/ocelle-land` after its merge of `main` (#16 merged as `13af7a9`), as a test-first
  landing fold (operator decision 1, `reviews/phase-7/operator-decisions.md`; `reviews/phase-7/notes.md`).

## Review round 2 (operator round), fix-2: the composed dialog and listbox story (T114)

Run on 2026-11-18 at `e8c3cee` (the story, the listbox fix, the baselines and the union counts), one heavy job at a
time, with `OCELLE_CHROMIUM_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
`OCELLE_VISUAL_ENGINE=docker`. A full `gate:plants` run of the coordinator's shared the machine and docker throughout.

| Command | Exit | Result |
|---|---|---|
| `pnpm run visual:update` (docker) | 0 | wrote 2 files (2 added, 0 changed, 0 removed): the composed story in light and dark |
| `pnpm test` | 0 | 8007 tests passed in 247 files |
| `pnpm run gate:storybook-build` | 0 | built 178 stories |
| `pnpm run gate:visual` (docker) | 0 | 356 captures match their baselines (docker only: no cross-engine comparison) |
| `pnpm run gate:axe` | 0 | 356 story-theme runs, 0 serious or critical; 22 notes (0 incomplete, 22 excepted) |
| `pnpm run gate:csp` | 0 | 55 files checked, no finding |
| `pnpm run gate:typecheck` | 0 | no type error |
| `pnpm run gate:lint` | 0 | 475 files checked, no finding |
| `pnpm run gate:test-lint` | 0 | 347 files checked, no finding |
| `pnpm run gate:plants -- --affected ea7eca6^` | 0 | 21 of 314 plants judged, every plant as expected (`plants.md`); `visual/fail-token-changed` at 150 findings |
| `vitest run packages/elements/test/browser/drawer.test.ts packages/elements/test/driver.test.ts` | 0 | 456 tests passed: the two failures of `ea7eca6`'s red run were load flakes |

The composed story's baselines are docker only; no podman cross-engine check was possible here, and CI confirms them
at landing (FR-053). The known gap "Composed dialog story: deferred to landing" above is closed by this fold.
