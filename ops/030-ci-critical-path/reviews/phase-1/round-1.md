---
phase: 1
round: 1
verdict: changes_requested
base: fdbb22b0c1ec3b37b24107d89d0fce759b24526d
head: 702c6e5b2a10e9e8231f83507dff2ec9e64b54fe
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|---|---|---|---|---|
| R1-01 | blocking | `gates/lib/mutation/shards.ts:81–110` | Four mutants survived in the grouping path. The tests do not distinguish all changes to range construction, the contiguous changed-line guard, loop bounds, or the default standard plan. [Shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732/job/139490113882) | Scope the fix to `gates/lib/mutation/shards.ts` and `gates/test/mutation-shards.test.ts`. Verify exact grouped and default output across boundaries, and simplify any logic whose alternatives are provably equivalent. |
| R1-02 | blocking | `gates/lib/mutation/report.ts:175–216` | The required run found 31 surviving and six uncovered report mutants. Malformed positions, records and file collections, mixed valid and invalid mutants, receipt rejection messages, and subprocess exit handling lack sufficient proof. [First shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732/job/139490113882) · [Second shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732/job/139490113939) | Scope the fix to `gates/lib/mutation/report.ts` and `gates/test/mutation-report.test.ts`. Prove valid and invalid inputs through the receipt interface and keep standard report classification intact. |
| R1-03 | blocking | `gates/bin/mutation.ts:137–154,174–181,218–234` | The required run found 13 surviving and three uncovered CLI mutants across Stryker log parsing, baseline duration arithmetic, input validation, plan diagnostics and elapsed timing. [Shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732/job/139490113901) | Scope the fix to `gates/bin/mutation.ts` and `gates/test/mutation-split.test.ts`. Exercise timing and exit outcomes at the command boundary, including logs with realistic multi-digit values and incomplete timing lines. Preserve the explicit opt-in and standard command outputs. |

## Test quality

The combined test-only red commit `042e1187` recorded 23 named assertion failures. The final-suite replay reproduced all 23 failures on the phase base and passed on `3e9e4ed2ecfd3fb86b60addfcbc5628fdb6365ee`. That replay predates the proof documents and headless permission entry at the reviewed head. The suite and gate implementations are identical between those revisions. The scheduling proof was strengthened to check the relocated inventory against executable timing weights. All 11 Visual test bodies are byte-identical to their original bodies and each split suite registers cleanup. [Replay](tdd-check.json)

The required mutation aggregate for published PR head `b44317210a478a9a64780c1ba20b634a7cdc966e` failed. The three failed shard logs contain 57 findings across the groups above, 48 Survived and nine NoCoverage. The reviewed local head adds only the headless permission and plan and task corrections after that published head. Keep the three fixes test-first, replay combined red and green, and rerun required Mutation testing on the next exact candidate. Document any equivalent mutant with the reason before accepting it. [Required Mutation testing](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732/job/139492747804)

## Checks run

- Focused local evidence records 310 tests passed at initial integration and 94 tests passed after the scheduling test correction. Typecheck, Code lint and Test lint passed locally. The required CI workflow file matches the baseline. [Local evidence](pilot.md)
- Required Unit tests and Visual regression remain open for approval. Verify the exact PR head and its tested merge revision, the Unit inventory, each passing shard receipt for `gates-integration/visual.test.ts`, `visual-findings.test.ts`, `visual-cli.test.ts` and `visual-capture.test.ts` under `gates/test/integration/`, and the passing dedicated Visual regression gate. The relocated `visual-capture.test.ts` includes a Storybook build and host-browser animation control. Resolve eligibility under the review rule by supplying the build and browser proof in the local selection or identifying an explicitly approved relocation exception. [Required CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45694977732)
- Complete Plants evidence against the phase base and verify required checks on the final exact revision. The shadow run is a separate comparison. Verify the pinned source and tested runner identities, matching mutant inventories and verdicts, seeded fault outcomes, and measured timings before recommending promotion. Issue #75 evidence and the pilot comparison belong to the open T009 task. [Mutation shadow](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45693974516)

## Earlier findings

First review round.
