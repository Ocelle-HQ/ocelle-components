---
triage: 034
issues: [92]
decision: op
target: "ops/034-workflow-pilots"
in_scope: []
out_of_scope: [7, 76, 86, 87, 88, 89, 90, 91, 92]
semver: none
spec_prompt: "Implement the operator-requested workflow improvements in triage/034-workflow-pilots.md for live validation on epic #92. Benchmark separate default and element mutation configurations alongside required mutation. Evaluate trusted hosted CI result reuse for evidence-only changes with exact candidate status, fresh DCO and Sandbox paths checks, and fail-closed input validation. Add actionable planning preflight for manifest overlays and active mutation projects for shared Storybook hosts. Validate against the existing required gates and known regressions, then trial on #89, #86 and other ready issues with a workflow checkpoint after each delivery."
status: proposed
---

# Triage 034 — Verification improvements and workflow pilots

## Issues read

The operator requested all three verification improvements and a live run on issues from #92, with a workflow review
and adjustments after each delivered ticket. The epic tracks shared workflow components and points to #76 for the
Studio composition delivery order. Its children are open #86, #88, #89, #90 and #91 and closed #87. The epic and
children have no comments, labels or milestones. GitHub lists no formal blockers for the open children. The issue
bodies separately describe dependencies, including #90's use of the action row from #7.
[Epic #92](https://github.com/Ocelle-HQ/ocelle-components/issues/92) · [Studio #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76)

## Related work found

| Ref | Kind | Relation | Reason |
| --- | --- | --- | --- |
| #92 | Open epic | Out of scope for product delivery | Supplies eligible pilot tickets. Each product change has its own triage, acceptance and review. [Epic #92](https://github.com/Ocelle-HQ/ocelle-components/issues/92) |
| #89, #14 | Open child and merged selection/input work | First live pilot | The existing `ocelle-copy-field` has element, browser and Storybook coverage. The opt-in grouped display, reveal and exact raw copy provide a focused change that exercises element mutation and public manifest planning. The issue has no listed blocker or linked PR. [Issue #89](https://github.com/Ocelle-HQ/ocelle-components/issues/89) · [Selection/input spec](../specs/014-selection-input/spec.md) |
| #86 | Open child | Second live pilot | The anchored surface has independent trigger, focus, dismissal and positioning acceptance. Its named icon trigger can use existing controls. Check readiness after #89. [Issue #86](https://github.com/Ocelle-HQ/ocelle-components/issues/86) |
| #88 | Open child | Later pilot candidate | Its settings recipe composes the existing dialog, disclosure, navigation and scroller. Its Storybook host can exercise default mutation routing. [Issue #88](https://github.com/Ocelle-HQ/ocelle-components/issues/88) |
| #91, PRs #83–#85 | Open child and related chrome changes | Later pilot candidate | A standalone glyph and initials trigger has independent acceptance. Recheck overlap with open rail and top-bar work and any composition that requires #86. [Issue #91](https://github.com/Ocelle-HQ/ocelle-components/issues/91) · [PR #83](https://github.com/Ocelle-HQ/ocelle-components/pull/83) · [PR #84](https://github.com/Ocelle-HQ/ocelle-components/pull/84) · [PR #85](https://github.com/Ocelle-HQ/ocelle-components/pull/85) |
| #90, #7, #76 | Open product issues | Resolve prerequisites before scheduling | #90 builds on the action row from #7. The existing action row shipped under mission 012 and #7 remains open. Confirm which part of #7 #90 needs before taking it up. #76's authoring phase explicitly calls for #7's status presentation. [Issue #90](https://github.com/Ocelle-HQ/ocelle-components/issues/90) · [Issue #7](https://github.com/Ocelle-HQ/ocelle-components/issues/7) · [Issue #76](https://github.com/Ocelle-HQ/ocelle-components/issues/76) |
| #87, PR #102, mission 033 | Merged child | Preflight regression input | The step-indicator export needed its declaration in eight valid manifest Plant overlays. The pane footer host initially had 61 uncovered mutants because its built-browser tests were outside the active default mutation project. [Manifest correction](../specs/033-pane-step-indicator/reviews/phase-1/round-1-fixes.md) · [Mutation correction](../specs/033-pane-step-indicator/reviews/phase-2/mutation.md) |
| PR #94, Op 030, PR #98, #75 | Merged mutation and verification work | Comparison input | Reuse the pinned #94 workload and existing opt-in grouping receipts. Use #75's discovery run as a Storybook verification reference. Grouping is a separate variable when comparing configurations. [Op 030](../ops/030-ci-critical-path/op.md) · [Mission 031 verification](../specs/031-change-list-discovery/verification.md) |
| Ops 023, 025 and 032, PR #101 | Merged governance and verification work | Existing controls | The pilot inherits sandbox-path verification, historical red/green evidence, complete shard inventory, artifact-first diagnosis and exact candidate check verification. [Op 023](../ops/023-public-repo-hygiene/op.md) · [Op 025](../ops/025-spec-kit-verification/op.md) · [Op 032](../ops/032-workflow-hardening/op.md) |

## Decision

**One tooling op with no package semver change.** The three changes share an observable acceptance outcome. A
contributor can identify verification work up front, see where the time goes and assess earlier evidence against the
required results. The comparison tools and preflight can be verified in one phase. Each pilot product follows its own
triage record. The proposed trial keeps CI result reuse observational.

## Scope

- Benchmark the default and element mutation configurations individually and together using matched inputs in the
  opt-in comparison. Keep the required Mutation job as the control. Use the pinned #94 element scope plus a
  representative default or mixed scope from the Storybook host and live pilots. Account separately for Op 030's
  grouping, runner setup, baseline, mutation execution, aggregation, retries, runner minutes and the slowest job.
  Compare changed-line coverage, mutant identities and verdicts, including the existing threshold, equivalent-mutant
  handling, and rejection of missing or incomplete reports. Use a seeded surviving mutant to verify failure parity.
- Prototype a reuse eligibility receipt for evidence-only updates. Accept prior results only from the trusted repository
  workflow and attempt with complete successful required results, immutable provenance and matching inputs for each
  eligible gate. Bind the observation to the current PR head, base and tested merge, and report an explicit status on
  that candidate. Obtain fresh DCO and Sandbox paths results. Reject reuse on a changed or unknown gate input,
  including source, tests, fixtures, inventories, configuration, workflows, dependencies, runtime or environment,
  or an unverifiable source result. Exercise matching evidence, changed inputs, moved base, stale or missing receipts,
  and failures in fresh checks. Keep every required gate running and compare the observation with the actual exact
  candidate results. A mismatch or an unknown input disqualifies the proposed reuse.
- Extend the Storybook and export planning preflight. List the affected custom-elements manifest overlays, their owning
  tasks and expected generation or update steps, including overlays that are supposed to pass with reordered entries.
  Check the exact expected findings for pass and fail fixtures. For each changed shared Storybook host, identify the
  mutation lane, active in-process Vitest project and focused test files, and flag missing routing before capture or
  landing. Use both mission 033 corrections as regressions and retain the existing built-browser, visual,
  accessibility, strict-CSP and Plant requirements.
- Run #89 first and #86 second when ready. After each delivered ticket, compare the pilot and control receipts and
  record coverage, verdict parity, preflight misses, rework, time to first failure, time to verified green, runner
  minutes and retries. Use each checkpoint to make and reverify scoped workflow adjustments, or record why the
  evidence supports continuing as configured. Check dependencies and overlap anew before selecting the next
  independently ready child. Carry the measured findings into the repository's normal retrospective.

## Risks and open questions

Configuration isolation can save setup time while increasing the longest lane. Compare pinned hosted runs before
crediting a speedup. Evidence-only eligibility depends on the full effective inputs, including any evidence files a
gate reads. A missing input definition can produce a false match, so treat uncertainty as a miss. Manifest Plant
overlays can pass their intended fault while accumulating a second finding, and working built-browser assertions can
still leave host mutants uncovered. Verify those cases before the first pilot and compare them again after delivery.

## What would change this decision

Any proposal to let reuse satisfy a required check or to change branch protection, gate semantics or the public
package surface requires a separate decision. If parity fails, use the required control results for the pilot and
recheck the affected experiment after correcting it. If a pilot has a new prerequisite, checkpoint it and select the
next independently ready issue.
