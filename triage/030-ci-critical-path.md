---
triage: 030
issues: []
decision: op
target: "ops/030-ci-critical-path"
in_scope: []
out_of_scope: [35, 42, 73, 75, 76]
semver: none
spec_prompt: "Op requested by the operator (triage/030-ci-critical-path.md): shorten the path to verified green through measured element mutation startup and grouped selectors, independent Visual integration files in the existing Unit planner, exact-revision review evidence before landing, and verified handoff of ready worktree tasks from Op 028. Compare the candidate process with standard CI on the recorded #94 mutation scope and the #75 discovery pilot. Preserve all tests, mutations, Plants, review and required checks. Require matching evidence on both paths before promoting the candidate process."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-25T20:04:29Z
---

# Triage 030 — Shorten the CI and review path

## Issues read

The operator asked to apply the proposed verification and worktree improvements and try them on #75. The #75 discovery issue asks for two runnable Storybook compositions and a recommendation about shared change-list presentation. PR #94 supplies the measured CI and worktree baseline. [Issue #75](https://github.com/Ocelle-HQ/ocelle-components/issues/75) · [PR #94](https://github.com/Ocelle-HQ/ocelle-components/pull/94)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #73, PR #94, mission 029 | Merged mission | Comparison input | The first final attempt took 63m 13s, planned 72 mutation shards and needed one startup retry. Unit shard 0 held 11 Visual integration cases in one file and ran for 45m 38s. Phase 1 measured 46.226s of implementation overlap followed by a 51.299s staging wait. [First CI attempt](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45672824182/attempts/1) · [Unit shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45672824182/job/139412648303) · [Worktree measurements](../specs/029-workflow-canvas/reviews/phase-1/worktree-pilot.md#observed-timing) |
| Op 025, PR #78 | Merged op | Existing verification | The complete Unit inventory and fail-closed shard aggregate, exact hosted evidence, and focused replay provide the comparison path. [Op 025](../ops/025-spec-kit-verification/op.md) |
| Op 028, `dce21bac` on `codex/028-within-phase-worktrees` | Reviewed worktree op | Prerequisite for handoff automation | The reviewed rules cover ready disjoint tasks, a common pin, one integration owner and serial fallback. Mission 029 used that pin. The branch is outside current main and has no current remote branch. Integrate or explicitly stack on its reviewed changes before extending its handoff. CI work can proceed from current main. [Mission 029 worktree plan](../specs/029-workflow-canvas/plan.md#worktree-pilot-and-shared-files) |
| #35, PR #37, Op 015 | Merged timeout op | Measurement precedent | The measured hosted limit applies to whole shards. The browser baseline has its own limit. Any change to these recorded values needs hosted startup and execution measurements. [Op 015](../ops/015-mutation-shard-timeout/op.md) |
| #42, triage 017 | Closed shard-planning issue | Prior experiment | The operator measured the proposed mutant-count repartition and closed it. This pilot tests reducing repeated baseline work with the same mutation inventory. [Prior decision](decisions/017-q0-outcome-no-work.md) |
| #75 | Open discovery | Pilot consumer | Its two compositions can exercise the Visual split, exact review evidence and worktree handoff where file ownership permits. A fixtures-only patch may yield no changed package-source mutants. Replay the #94 inputs for meaningful mutation measurements. [Issue #75](https://github.com/Ocelle-HQ/ocelle-components/issues/75) |
| #76 | Studio composition | Out of scope | The follow-on Studio composition has independent acceptance. Its product work stays with that mission. [Issue #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) |

## Decision

**Op, no package semver change.** The deliverable is a bounded trial of a faster route to the same verification verdict. It changes repository scheduling and evidence collection within one reviewed phase. A candidate can run beside the existing route while its coverage, failure handling and elapsed time are compared.

## Scope

- Capture hosted element mutation baseline time, mutation time, retries and runner minutes. Use an opt-in shadow run to compare a candidate that groups adjacent planned ranges within a Stryker invocation against the existing shard plan on pinned #94 inputs. Preserve exact changed-line and mutant coverage, the 100% threshold, the existing equivalent-mutant policy and a failing result for missing or incomplete reports. Base any proposed startup limit on measured hosted times.
- Split independent Visual integration scenarios into files the current Unit planner can place independently. Preserve every existing case and its assertion, including error and fault cases. Keep the required Unit aggregate and the full independent Docker and Podman Visual gate.
- Provide earlier review receipts tied to the tested candidate and collected cases. Keep accepted red, base, scaffold and green replay evidence and independent review. Batch evidence and fold changes before publishing the final candidate and run every required check against that candidate.
- After the Op 028 prerequisite is available, automate validation of a ready worker return against the phase pin, exact write paths and sign-off. Keep one integration owner, canonical test-only red, combined green, and serial fallback. Time worker return to staged green on an eligible #75 slice.
- Compare the standard and candidate paths before promotion. Record test inventory, changed-source mutant coverage, verdicts on deliberately planted failures, time to first failure, time to verified green, runner minutes and retry rate. The #75 pilot and the pinned #94 comparison cover different changed inputs. Product implementation belongs to its own record.

## Risks and open questions

Grouping can lower runner minutes while lengthening the slowest job. A meaningful comparison needs repeated hosted timings on the same source and test inputs. An isolated Visual scenario may depend on shared fixtures, so the split needs to preserve its cleanup and fault setup. Earlier receipts and worktree returns can become stale after a source, fixture, base, or fold change. Scope validation and final verification must reject stale or incomplete evidence.

## What would change this decision

Return for a scope decision if the candidate requires a change to gate semantics, branch protection, phase ordering, or public package behavior. Keep the current route in force while a trial has missing coverage, different verdicts on seeded faults, or an unresolved worktree dependency.
