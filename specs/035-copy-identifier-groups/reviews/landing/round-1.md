---
scope: landing
phase: landing
round: 1
verdict: changes_requested
base: d45efd57402395999fcd7ab8fc29fba2c14a4e88
head: 784add6f3daf6cbe02b4be4dff0560727c81fea5
reviewer: reviewer-renata
---

# Landing review for PR #104

## Findings

| ID | Severity | Where | Finding | Required change |
| --- | --- | --- | --- | --- |
| L1-01 | blocking | `gates/bin/story-evidence.ts:410–420,530–550` and the Phase 1 and 2 base commits | Both canonical landing replays stop at `git merge-tree --write-tree`. The pinned `d45efd57` base conflicts with Phase 1 base `e340eefa` and Phase 2 base `d8793108`, so the job never establishes the final tests' expected failures on the integrated phase bases or success on the integrated head. | Resolve the historical replay integrations against the actual final main. Preserve the approved original red commits and assertion identities. Require a passing result for each phase and green required CI on the final candidate. |

## Source review

The Git object names original approved PR head `6fdbe28f` and main `d45efd57` as ordered parents, with tree `dec6c4b1`. Its 76 changed paths relative to main are scoped to #89, its governed records and the affected manifests, Plant and Storybook inventories. Exactly 19 blobs differ from both parents. The copy-field production source, source and built-browser tests, Storybook stories, Storybook interaction tests and six fictional-story baselines keep the original approved blob IDs. The default presentation, deferred raw Copy request and host outcome remain in the existing component. Grouping and compact preview retain their native buttons, accessible reading and focus coverage. No new gate, required check, executable entry point or permissions change is introduced. [Exact candidate](https://github.com/Ocelle-HQ/ocelle-components/commit/784add6f3daf6cbe02b4be4dff0560727c81fea5)

The canonical manifest and seven negative overlays add the same 40 lines for the two declared flags. The reordered overlay adds the same 40 lines in its alternate key order and its parsed copy-field module matches the canonical declaration. Existing main manifest assertions retain their shape unless the copy-field test opts into checking attribute types and defaults. The tree has 422 stories by baseline inventory and 844 theme captures. The Axe failure case still adds two findings, now at 846 theme runs. The visual token Plant retains its previous 349 findings and adds exactly the three #89 light states. The six new baseline blobs are the approved captures. [Main comparison](https://github.com/Ocelle-HQ/ocelle-components/compare/d45efd57402395999fcd7ab8fc29fba2c14a4e88...784add6f3daf6cbe02b4be4dff0560727c81fea5)

## Evidence checked

- Both original numbered reviews are approved. The retained Phase 1 evidence includes the original tests-only red and `fix-1`, with source Chromium, built strict CSP and the manifest assertion. The Phase 2 evidence records three missing Storybook IDs on the test-only commit and later three passing real built story tests. Their historical required checks include full Mutation, Plants, Visual and Axe. [Phase 1 review](https://github.com/Ocelle-HQ/ocelle-components/blob/784add6f3daf6cbe02b4be4dff0560727c81fea5/specs/035-copy-identifier-groups/reviews/phase-1/round-1.md) · [Phase 2 review](https://github.com/Ocelle-HQ/ocelle-components/blob/784add6f3daf6cbe02b4be4dff0560727c81fea5/specs/035-copy-identifier-groups/reviews/phase-2/round-1.md)
- The hosted landing job verified the exact head, tree and pin, reported zero unfinished units, both approved verdicts and 94 commits with sign-offs. It then recorded both replay conflicts and exited 1. This is a replay integration failure before the final base and head checks. Required full CI must still be collected on the final integrated head. [Landing replay job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/46082716299/job/140785162076)

I found no separate product or gate defect in the examined integration. Main advanced to `34c2fe11` when #107 landed, so replay and the final delta review must use that updated main (or any subsequent agreed exact latest main).
