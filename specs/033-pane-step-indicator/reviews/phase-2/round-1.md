---
phase: 2
round: 1
verdict: changes_requested
base: 7b16ae326e11aa837b4d0f8540881e69c8d622c3
head: d33e9db3d825f68352b8314f468098776d8eea9f
tdd_check: unavailable
---

# Phase 2 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `storybook/stories/pane-action-footer.ts:31–149`, `vitest.mutation.config.ts:29–39`, `vitest.config.ts:262–270` | The standard mutation run reported 61 uncovered mutants in the shared recipe host. Its existing positive probes run in `storybook-integration` and `elements-browser`, which the standard mutation configuration excludes. The gate includes shared Storybook render sources through `gates/lib/mutation/ranges.ts:35–40`. | Add observable in-process coverage that imports and exercises the real shared host in a project retained by normal mutation, such as `storybook/test/unit`. Keep both browser proofs. Rerun the normal changed-source mutation scope with the added tests and resolve its findings before approval. |
| R1-02 | blocking | `specs/033-pane-step-indicator/tasks.md:36–38`, `specs/033-pane-step-indicator/reviews/phase-2/` | The eight pinned baselines, the remaining token-change Plant update, final replay and exact hosted checks are pending. T011–T013 remain open. | Capture all eight story-theme baselines, verify the token-change Plant and affected selection, finish the canonical replay, and pass the required checks on the corrected exact candidate. |
| R1-03 | note | `storybook/stories/pane-action-footer.ts:136–140` | In the built Back-and-primary example, Back changes Choose to Review. Back remains enabled at Review, where activating it again leaves the pane unchanged. The required initial action order and primary transition still work as specified. | None for this phase. |

Four failed hosted shard logs reported respectively 12, 9, 5 and 35 `NoCoverage` findings for the recipe host. The capture run is 45743218289, attempt 1, at published head `01462a841ed6502381a041d8479aab5dc43fa621` and tested merge `ee78706df7a0b610e240d5ceb9dae27382ce0ec9`; its main parent is `25c53a915717fe464a67b53a7dd58ceaf4abc0c7`. Only evidence changed between the published source and the reviewed head. [Run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289) · [Shard 31–60](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289/job/139653173362) · [Shard 61–90](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289/job/139653173378) · [Shard 91–120](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289/job/139653173423) · [Shard 121–149](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289/job/139653173453)

## Test quality

Tests-only commit `c8911dea` joins the two signed, disjoint paths. The 11 recorded failures identify missing built story IDs or missing strict-CSP recipe assets. The proof files match the red commit. The positive tests verify real keyboard actions, native button identity and continued Tab order, the compact accessibility tree, text growth and wrap, and the same shared recipe under the strict-CSP fixture. With the stories still registered, the temporary no-op primary and clipped footer variants failed their intended navigation and height assertions. The final focused replay is pending.

## Checks run

- Reviewed the source, test scope, signed red history, raw red and negative-control evidence, and both browser verification lanes. Ran `git diff --check` for the phase.
- Reproduced the Back note in the existing built Storybook. A separate Chromium spot check found no horizontal overflow at 320, 767 and 768 px with doubled text and at 1200 px with default text. The 1200 px sample had aligned 72 px footers and both actions on one row.
- Verified the exact hosted run and merge parents. Read the four failed changed-source mutation logs and counted all 61 findings. Storybook build and Content security passed on the capture run. [Hosted capture run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45743218289)

## Earlier findings

First review round.
