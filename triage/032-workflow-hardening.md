---
triage: 032
issues: [96, 97]
decision: op
target: "ops/032-workflow-hardening"
in_scope: [96, 97]
out_of_scope: [7, 76, 87]
semver: none
spec_prompt: "Harden the Spec Kit workflow in one op against the failures recorded in #96, the diagnostics portion of #97, and the flow diary. Pin integrated main in phase replay, preserving historical assertion evidence and the branch's edits to shared tests. Report missing and unexpected shard identities and run errors, inspect CI artifacts first, and verify every required check by name on the exact tested candidate. Make the role scope guard reject an out-of-scope change by exit status. Make Planner Pim assign Storybook verification paths up front and require that no-action gesture tests establish their intended target. See triage/032-workflow-hardening.md."
status: approved
decided_by: "human:MOES-Media"
decided_at: 2026-11-26T01:23:23Z
---

# Triage 032 — Harden phase replay, CI diagnosis, role scope and story planning

## Issues read

- #96 reports that merging main into PR #80 added 128 inherited test files to the phase's 142 selected files. Some imported modules absent at the original phase base. It separately notes rejection of historical assertions under a newer changed-line rule. [Issue #96](https://github.com/Ocelle-HQ/ocelle-components/issues/96)
- #97 reports two intermittent Chromium shard failures. The saved artifact identified a pending `list-detail.test.ts` and seven missing test files after a generic inventory error had led to hours of local investigation. The issue asks for both useful diagnostics and a separate investigation of the intermittent failure. [Issue #97](https://github.com/Ocelle-HQ/ocelle-components/issues/97)
- The diary records a role violation passing through a command chained with `&&`, stale counts and incomplete pages in landing checks, Storybook inventory work repeated across phases, and a no-action gesture test that passed on the wrong target. [Workflow diary](../knowledge/speckit-flows/log.md)

Neither issue has a declared blocker, parent, or active pull request covering the change. The operator requested the four workflow improvements as one package.

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #96, PR #80, Op 023 | Replay defect and merged hygiene op | In scope for the replay defect | The approved pre-merge evidence was a case-specific workaround. The new replay must retain test assertions proven at their historical revisions. [Landing decision](decisions/023-landing-red-green.md) |
| #97, PR #80, CI run 45673036035 | Shard diagnostics and intermittent failure | In scope for diagnostics | The plan and shard artifact already supply the expected and actual project/file identities and the runner error. Use that evidence to improve failure reporting. [Shard decision](decisions/023-landing-shard4.md) |
| PR #78, Op 025 | Merged verification op | Existing input | Keep assertion-level red/green evidence, exact Unit shard verification, and the fail-closed aggregate. [Op 025](../ops/025-spec-kit-verification/op.md) |
| #73, PR #94, Mission 029 | Merged Workflow Studio mission | Regression input | Its review records an incorrect hit target, capture checks, and integration updates to shared generated inventories. [Workflow diary](../knowledge/speckit-flows/log.md) |
| PR #98, Op 030 | Merged CI and worktree op | Existing input | Established scoped handoffs, exact-revision review evidence, and changed-source verification. [PR #98](https://github.com/Ocelle-HQ/ocelle-components/pull/98) |
| #75, PR #99, Mission 031 | Merged Storybook pilot | Replay regression input | The integrated phase-base correction kept all six recorded red assertions while bringing the phase baseline up to date with main. [Mission 031 verification](../specs/031-change-list-discovery/verification.md) |
| #7, #76, #87 | Product work | Out of scope | Each has its own public behaviour and verification. #87 can use the improved workflow as a separate mission. |

## Decision

**One op, with no package semver change.** All four changes harden verification and handoffs in the same repository workflow. Their acceptance is bounded and independently testable in one phase. The existing gates, suite inventory, mutation policy and product contracts provide the baseline.

## Scope

- Pin the exact integrated main commit for final-test replay. Keep historical red entries and their assertion evidence. Exclude tests inherited unchanged from main, retain phase changes in a test both sides edited, and fail on an invalid pin or conflicting replay.
- Report missing and unexpected project/file identities and runner errors when shard verification fails. Diagnose the current candidate from its plan and result artifacts first. Read required names from the gate registry at the tested revision and include Plants. Verify every named result on the exact head, base and tested merge using the complete job listing.
- Keep structured role-scope diagnostics and return a failing status for an out-of-scope change or a check that could not run. Exercise both paths of a rename and exact path handling in a regression fixture.
- Make the planning preflight assign the story inventory, both themes' baselines, the repository and negative Axe expectations, and affected Plant fixtures. For no-action gesture tests, require evidence that the gesture hit its intended target and that native capture occurred when the behaviour depends on it.

## Risks and open questions

Subtracting all files touched by main would also remove test edits authored by the phase. Replaying the historical tests solely against integrated main would weaken the original red proof. Runner error details should stay bounded and tied to the tested shard, and a diagnostic change must retain the failed result. Check the separate case in which a scope check cannot inspect Git.

The cause of the intermittent Chromium worker failure in #97 remains open. Grandfathering red evidence created before the changed-line rule is a separate policy question.

## What would change this decision

Return to triage if the repair would require changing the accepted red-evidence standard, reducing CI coverage, altering branch protection, or changing product behaviour.
