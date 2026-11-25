---
phase: landing
round: 2
verdict: approved
base: 183b20f9148e6fa0a402b23e367328f6a8683f97
head: 7a57fd4a7806d32191e3d613e66524b32fb26dc6
tree: f13e478795eeaf0b3bf25395c715955494b8d2c3
---

# Landing review, round 2

L1-01 is resolved on the published product and test tree. This round verifies the Step reveal fix and the shared Follow path covered by the first landing round. [Round 1](round-1.md)

## L1-01

The shared reveal path rechecks the live graph and layout after it focuses the initiating control. It waits for a synchronously supplied viewport to render before it measures the destination. If the host invalidates the target, owned focus returns to the Step picker. If the host claims focus, it keeps it. A scripted Reveal without initiating focus can still request a viewport and cannot hand off focus when that viewport arrives. [Shared reveal path](../../../../packages/elements/src/ocelle-workflow-canvas.ts#L1414)

The signed test-only commit reproduced seven assertion failures. The hosted strict-CSP tests verify native Step activation when the host removes the layout position or supplies an already revealing viewport. The in-process tests also cover synchronous graph removal, a partial viewport and external focus redirection. The positive control retains one request while the host withholds the viewport and hands off focus after acceptance. [Signed red](../phase-4/red-fix-2.log) · [Fix record](../phase-4/round-2-fixes.md)

I rebuilt the browser aggregate from the exact published source and ran 17 independent Chromium cases under the repository CSP. Revise removal and unpositioning each gave zero requests and restored Step focus. A partial translation of −400 produced one proposal at −808 from the current bounds, and an already sufficient translation of −900 focused Revise with zero requests. Redirected focus stayed outside the canvas after a later viewport update. The scripted inert and clipped cases retained one request with no unauthorized focus handoff or host scroll. Six trusted Follow controls retained the same graph, viewport and focus behavior. Three further cases intercepted the native blur before the control handled it or used an inert Reveal while Step held focus. Later acceptance or removal preserved the current focus and added zero requests. All 17 cases reported zero CSP, console and page errors.

## Verification

- All 364 focused tests passed on the identical source and test tree. The strict changed-source mutation score was 100 with 127 assertion kills, 80 compile errors, two detected timeout variants, one inherited equivalent update operator, and zero survivors or uncovered mutants. The latest tests exercise the exact three focus-ownership replacements. The recovery lookup resolves the actual navigator around the initiating control.
- Canonical Phase 4 replay on `7a57fd4a` passed all 13 stages, including 28 named assertions across the six signed reds. The unchanged repeat reused all 13 stages. The Phase 4 follow-up independently approved the remediation. [Canonical replay](../phase-4/tdd-check.json) · [Phase 4 follow-up](../phase-4/round-3.md)
- The exact hosted test merge `112093f4aad2235f80bf88af84b98f40b1107ab1` has the recorded candidate tree and contains the published fix and current main. Unit passed 12,009 tests in 355 files across six shards. All 11 Visual integration, four Axe integration and four native touch cases passed. Dedicated Visual matched 784 captures in pinned Docker and Podman. Accessibility ran 784 audits with zero serious, critical or incomplete findings. All 318 Plants returned the expected verdict. [Exact hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347) · [Unit](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347/job/139406210788) · [Visual](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347/job/139372155073) · [Accessibility](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347/job/139372154641) · [Plants](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347/job/139385204305)
- The hosted Mutation aggregate was unresolved when I checked the receipts. A shard covering unchanged lines 571–600 failed during Stryker's initial test run before it produced a mutant report, and two shards were still running. L1-01 has no unresolved review blocker. Merge still requires every required check to be green for the final published head. [Hosted run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347) · [Failed shard](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45661475347/job/139372477299)
