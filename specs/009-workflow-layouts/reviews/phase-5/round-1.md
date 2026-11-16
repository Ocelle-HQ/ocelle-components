---
phase: 5
round: 1
verdict: approved
base: 61e86f5dfed815abd7185e283b173ca025ab4dd9
head: 8f2cf85
tdd_check: pass
---

# Phase 5 review, round 1

Change under review: `git diff 61e86f5..8f2cf85`. That is the red commit `fc64db2`, the green commit `48fec81` and the
tdd-check commit `8f2cf85`. The working tree had no uncommitted change. Phase 5 changes no source: it touches two
READMEs and changelogs, two test files, `tasks.md` and the evidence under `reviews/phase-5/`.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | note | packages/elements/test/node/changelog.test.ts:3-9, 23-36 | **T063 / FR-035 coverage holds.** I checked the implementer's claim that the earlier assertions cover the changelogs, not only the READMEs, and it is right. `packages/elements/test/node/readme.test.ts:314-350` reads `CHANGELOG.md`, cuts out Unreleased / `### Added` and asserts each item. These are the four elements, their five entry points (`@ocelle/elements/ocelle-scroller.js`, `-workflow-board.js`, `-workflow-lane.js`, `-list-detail.js`, plus the existing `browser.js`), `remeasure()`, "the overflow-region module convention" and "the container-tier convention" (lines 331-346). `packages/tokens/test/readme.test.ts:56-65` reads the tokens `CHANGELOG.md` and asserts that the set of `--ocelle-*` names under Unreleased / Added *equals* `expectedTokens`. `packages/tokens/test/expected.ts:136, 151, 205-208` holds all six (`tracking-caps`, `scroller-fade-size`, `lane-min-width`, `list-track-width`, `list-detail-collapse`, `list-detail-inspector-collapse`), so a missing name fails that test. The one missing item was FR-035's "The changes are additions (MINOR)", and the new file adds it. | None. |
| R1-02 | note | packages/elements/test/node/changelog.test.ts:24, 34 | Each new assertion matches one whole sentence. Rewording the changelog statement would break it even if the meaning stayed. The test is not vacuous (it failed red for the missing text) and gate:test-lint accepts it. | None required. |
| R1-03 | note | packages/elements/test/node/readme.test.ts:331-347 | FR-035 also names the elements' slots. T063 does not list slots, and no test asserts the slot names of the new elements in the changelog: the `inspector` slot and the default slots appear at `CHANGELOG.md:26, 28, 32, 37` but are not asserted. This is outside T063's text, so it is not blocking. | Optional, for a later feature or `/ocelle-land`. |
| R1-04 | note | reviews/phase-5/merge.md; operator-decisions.md (M1) | **T066 judged against M1.** M1 moves the merge of `main`, its conflict resolution and the R-16 reconciliation to `/ocelle-land`, and `merge.md` records that instead of merging. I verified its facts. `origin/main` is `ce1d9c7`, the merge base is `3828d2f`, and `git log HEAD..origin/main` lists only `ce1d9c7` (#35), so none of #8, #9 or #16 has landed. That makes T066's condition false today anyway. Ticking T066 with this record follows M1. | None. `/ocelle-land` must merge `main` (#35) and recheck R-16 if #8 lands first. |
| R1-05 | note | reviews/phase-5/quickstart.md (Mutation row and note) | **Mutation base `3828d2f`.** The quickstart's mutation step covers the feature's changes in `packages/elements/src/**` and `packages/tokens/src/source.ts`, and phase 5 changes no source. So the merge base with `main` is the right base for T065, and the phase base is not. The skill's own run on the phase base is reported under Test quality. I re-ran `--base 3828d2f` and got the same result, with the same counts. | None. |

No blocking finding.

## Test quality

- **Red evidence.** `red-phase.log` shows 10 of 3773 tests failing, all for missing text. Two are in `changelog.test.ts`
  (the Unreleased sections lack the MINOR statements). Eight are in `readme.test.ts:292`: the four frames, the frames
  lead-in, WebKit, print and the states that do not apply. No failure comes from setup. `tdd-check.json` reports
  `pass`: red commit exit 1, final tests on base exit 1, head exit 0, no problems. There is no scaffold, as expected.
- **No weakening.** `git diff fc64db2..HEAD` over the test files is empty, so the green commit changed no test.
- **Assertions.** Every new case is a `toContain` against the normalised README or the Unreleased section. None is
  conditional or snapshot-only, none is skipped, and each failed in red. The new fragments in `readme.test.ts:230-241`
  cover every T062 item. That means frames W, R, N and S with their widths, and the WebKit line naming the scroller's
  and board's tab stop, the arrow keys, the focus handover and list-detail's focus moves. It also means the print
  note and the R-15 not-applicable states.
- **Acceptance scenarios.** This phase has documentation checks only and no new behaviour, event or keyboard path.
- **Mutation.**
  - `pnpm run gate:mutation -- --base 61e86f5`: "nothing to mutate: no package or gate source line changed since
    61e86f5", exit 0.
  - Feature-wide re-run, `--base 3828d2f`: "860 mutants on the changed lines of 11 files, none survived; 2 timeouts,
    258 compile errors, 1 zero-mutant entry; 33 equivalent records", exit 0. This matches `quickstart.md`.
  - The equivalent records belong to code reviewed in phases 2-4. Phase 5 adds none.

## Checks run

On head `8f2cf85`, with `OCELLE_VISUAL_ENGINE=docker` for the Storybook gates:

| Check | Exit | Output |
|---|---|---|
| `pnpm test` | 0 | 3773 tests passed in 163 files |
| `gate:signoff -- --range 61e86f5..HEAD` | 0 | 3 commits checked, no finding (also `3828d2f..HEAD`: 68 commits, no finding) |
| `gate:typecheck` | 0 | no type error |
| `gate:lint` | 0 | 308 files, no finding |
| `gate:test-lint` | 0 | 210 files, no finding |
| `gate:prefix` | 0 | 266 files, no finding |
| `gate:csp` | 0 | 18 files, no finding |
| `gate:style-lint` | 0 | 20 files, no finding |
| `gate:manifest` | 0 | 6 elements, no finding |
| `gate:pins` | 0 | 5 manifests, no finding |
| `gate:brand-rules` | 0 | 7 rules checked |
| `gate:config-copies` | 0 | identical |
| `gate:contrast` | 0 | 160 pairs light, 168 dark |
| `gate:storybook-build` | 0 | 44 stories |
| `gate:visual` | 0 | 88 captures match their baselines |
| `gate:axe` | 0 | 88 runs, 0 serious or critical; 10 excepted notes |
| `gate:mutation` | 0 | see Test quality |

I did not re-run `gate:plants`, which takes about 95 minutes. Phase 5 changes no gate, plant or source, and
`quickstart.md` records it passing on the same tree.

**Constitution.** The new README and changelog text holds no planning ID, as `readme.test.ts:360` checks for both
files. The new names are all `ocelle-` names. No element, style, network or CSP surface changed.

**Tasks.** T062 to T066 are ticked and their work is present: T062 and T063 as above, and T064 in
`packages/elements/README.md:376-397`, `packages/elements/CHANGELOG.md:8-10` and `packages/tokens/CHANGELOG.md:13-15`.
T065 is recorded in `quickstart.md`, with each command and its output. Its "Look at it by hand" step is stated as not
done in a headless run. T066 is recorded in `merge.md`, per M1. Nothing outside the phase changed.

## Earlier findings

This is round 1, so there are no earlier findings.
