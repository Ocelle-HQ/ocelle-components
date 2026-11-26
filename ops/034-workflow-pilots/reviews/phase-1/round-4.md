---
phase: 1
round: 4
verdict: changes_requested
base: c503984f091043952d5f97385e2f9188b9bbceca
head: b655b83b1d17694039f7b5c968e483384145a90a
tdd_check: pass
---

# Phase 1 review, round 4

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | blocking | `tooling/speckit/bin/evidence-reuse-observe.ts:460` | The collector treats the linked pull request's live head as the prior attempt's historical head. PR #104 run `45834538582`, attempt 1, consistently reports `77cb025da872be76e49190b51a9ed24a9e61be1b` in both `head_sha` and `head_commit.id`. Its linked PR head advanced from `4ac4aaa6` in the saved observation to `6fdbe28f` in this check. The exact Visual checkout `bd09017155b06f3cdac3d4166ae71877f69c051d` still has the historical head and pinned base as parents. The comparison at line 462 rejects that attempt before examining its Visual checkout, so a legitimate older candidate cannot reach the evidence-only and runtime checks after a push. [Attempt metadata](https://api.github.com/repos/Ocelle-HQ/ocelle-components/actions/runs/45834538582/attempts/1) · [Tested merge](https://api.github.com/repos/Ocelle-HQ/ocelle-components/git/commits/bd09017155b06f3cdac3d4166ae71877f69c051d) | Use the PR association for a unique same-PR and same-repository link. Establish the historical attempt head from immutable run evidence, bind it to the exact attempt's Visual job and checkout, and derive the tested base from the verified merge parents. Reject conflicting immutable identities, an unverifiable checkout, a changed tested base and wrong repository, workflow or PR provenance. Add a tests-only red fixture for the observed advancing PR association and negative cases for stale or inconsistent immutable evidence. Preserve the observation's evidence contract and all required CI and safeguards. |

## Test quality

The historical replay passed on tooling head `509915d1a7ce2413539587330cce9f7b6d776984` and retained 98 original and 12 review-fix red assertions. The observed failure occurs in hosted evidence collection before the classification policy receives the run. A new red integration fixture needs to exercise that collection boundary with the exact GitHub payload shape. [Historical replay](tdd-check.json)

## Checks run

- Read the previous approval, the accepted pilot scope and the collector's exact attempt and merge checks. The live #89 checkpoint surfaced this failure within FR-002 and T006. [Approved phase review](round-3.md) · [Approved triage](../../../../triage/034-workflow-pilots.md)
- Independently read the historical same-repository attempt and its tested merge from GitHub. Attempt 1 was completed and successful for PR #104 and `.github/workflows/ci.yml`. The tested merge retains first parent `b655b83b1d17694039f7b5c968e483384145a90a` and second parent `77cb025da872be76e49190b51a9ed24a9e61be1b`. The observed live link changes while the immutable identifiers agree. [Historical CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582) · [Visual job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45834538582/job/139959812466)
- Verified that this finding concerns the optional observer. The required runs and prior mutation, Plants and preflight proofs retain their recorded results. The exact #89 pair remains on its pinned workflow base.

## Earlier findings

The round 3 approval closed the required tooling verification. This blocker comes from subsequent live pilot evidence. Its resolution needs focused proof on the observer collector and verification under the existing required controls.
