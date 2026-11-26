---
phase: 1
round: 1
verdict: changes_requested
base: c503984f091043952d5f97385e2f9188b9bbceca
head: da730f5abddb3aa109d20b9b5ebabed1a4bc8247
tdd_check: pass
---

# Phase 1 review, round 1

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | `gates/bin/mutation-config-shadow.ts:96`, `gates/bin/mutation-config-shadow.ts:216` | The comparator accepts repeated mutant records when both arms repeat them. An independent probe passed a two-entry inventory containing the same mutant twice and got `matched: true` with a mutant count of two. Matching duplicate records cannot establish the complete set of mutant identities. | Reject duplicate identities within each receipt, including repeated identities with conflicting statuses, or record the additional stable identity needed to distinguish legitimately repeated tuples. Add a test with the same duplicate in both arms. |
| R1-02 | blocking | `.github/workflows/mutation-config-shadow.yml:191`, `gates/bin/mutation-config-shadow.ts:174` | The hosted receipt collects durations from prior attempts but the report's `runnerMinutes` sums only the terminal successful jobs. A retried split can appear cheaper while consuming more compute than the mixed control. Runtime pin and aggregation jobs also sit outside the displayed sample total. | Report successful-attempt timings and total timed compute across retries explicitly. Include or itemize shared runtime pin and aggregation costs so the recorded pilot total is reproducible. Prove the failed-attempt case. |
| R1-03 | blocking | `gates/test/mutation-config-shadow.test.ts:143`, `ops/034-workflow-pilots/plan.md:7` | The survivor test inserts synthetic `Survived` rows and sets both verdicts to failure. It exercises how the comparator reads a failure. The required actual failure experiment through the standard mutation gate still lacks evidence. | Run a separately pinned seeded case with both unchanged selector arrangements and record the completed standard gate failure, the shared surviving identity, and comparison output. Keep this evidence independent of successful timing. |
| R1-04 | blocking | `tooling/speckit/bin/evidence-reuse-observe.ts:217`, `tooling/speckit/bin/evidence-reuse-observe.ts:319` | The Visual runtime receipt records provisioned Docker and Podman versions from the official image inventory and Node and pnpm versions from repository pins. The exact job's setup record and artifact establish the image and container digest. Executed engine or tool drift can leave these inferred versions unchanged and receive an eligible verdict. | Require trusted observations from each exact Visual job attempt for the runtime identities the plan requires. Reject missing or mismatched observations and retain the official image and OCI artifact cross-checks. Keep the required Visual gate and other required checks in place. |
| R1-05 | blocking | `tooling/speckit/bin/component-preflight.ts:71`, `tooling/speckit/bin/component-preflight.ts:105` | Removing just the `fail-lost-attribute` snapshot while preserving its fail descriptor makes the manifest preflight exit zero with seven overlays. The command treats the missing required snapshot as an intentional non-overlay case. | Use the descriptor and Plant layout to distinguish required snapshots from standalone controls. Fail with the missing snapshot path, retain dynamic discovery of new full overlays, and add a regression test for the deletion. |
| R1-06 | blocking | `.claude/skills/speckit-story-review/SKILL.md:74`, `ops/034-workflow-pilots/tasks.md:15` | The phase's affected Plants record is missing, and the matching full required hosted CI and historical comparison are still pending. The phase-base listing selects all 326 Plants because the added workflow is unmapped. | Record the phase-base Plants selection and successful execution. Publish an exact candidate for verification and attach the required CI and complete matched comparison receipts before using the workflow on #89. |
| R1-07 | blocking | `ops/034-workflow-pilots/reviews/phase-1/pilot-readiness.md:5`, `.claude/skills/speckit-story-review/SKILL.md:61` | The signed readiness record documents a prior 12-finding mutation slice and twelve successful manual replay assertions. The final phase mutation plan contains 466 changed lines in 15 shards. Phase-wide standard mutation proof is still outstanding. | Verify the complete standard mutation plan on the reviewed source with no unexplained surviving or uncovered mutants. Attach the exact scope and results. |
| R1-08 | note | `.github/workflows/mutation-config-shadow.yml:14`, `ops/034-workflow-pilots/plan.md:7` | The fixture intentionally stays pinned to #87 for the initial historical experiment. The current opt-in always runs that fixture, so a later #86 invocation would still measure #87. | At the #89 checkpoint, verify readiness for #86. If its candidate has a genuinely mixed standard shard, add a verified exact-candidate selection for that trial and record the chosen unchanged selectors. |

## Test quality

The signed tests-only commit `c48ff74bbd329f83043ce3f5fdc524af101bbf44` records 98 failed assertions. The signed replay reports exit 1 for the final tests over the base and exit 0 for the integrated work at `b247f13a3edf86e36317a3ec1fcde6e5da875fe2`. The reviewed head adds evidence and task text over that revision. I checked the four test diffs and found preserved red assertions, stricter exact fixture paths and added negative cases. The initial absence guards report missing observations to the assertions and let actual import or execution errors propagate.

The preflight tests exercise the real manifest gate and Vitest discovery. The shared host regression includes the retained `storybook-browser (chromium)` project and the built-browser route excluded from default mutation discovery. #87 supplies a separate successful scoped standard mutation result for the same host and records the original 61 uncovered mutants. The current contributor and planning guidance require that scoped proof for each changed host. [Host mutation evidence](../../../../specs/033-pane-step-indicator/reviews/phase-2/mutation.md)

The synthetic eligibility tests cover the classification policy. The collector replay uses actual Visual artifact bytes and the official runner inventory with synthetic candidate metadata, and deleting the inventory's Podman identity changes the verdict to ineligible. A real successful evidence-only pair remains a live pilot deliverable.

## Checks run

- Independently ran the four focused gates test files with the pinned toolchain. All 150 tests passed. `git diff --check` passed.
- Verified prerequisites, the phase-base pin, Signed-off-by trailers, and the signed replay. Verified that the required CI workflow, shared setup action, and standard mutation runner are identical to the pinned `origin/main` versions.
- Verified historical GitHub run `45754797425`, attempt 1, and its mixed job `139690966745`, completed successfully in 41m27s. The tested merge `ddd496df8170d75d5e7a2060afaa60a41bbfca8d` has the pinned base and folded head as parents and tree `61c0168cae9bd8ff17a85ac8c11bff0fd9de1d66`. The standard planner regenerates the single 47-line mixed shard containing the pinned selectors. The new matched hosted run is pending. [Historical job](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45754797425/job/139690966745)
- Checked the live repository's public visibility and successful unauthenticated Git reachability. Checked actual attempt job metadata and pagination shape through the GitHub REST API, including the 109 jobs of the known successful #101 run. These results substantiate the read paths. The pilot still needs a matched eligible same-PR pair. [Historical CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45795675271)
- Ran affected Plants listing and the standard mutation planner at the phase base. The listing selected 326 Plants and the mutation plan covered 15 shards. Signed local readiness reports green Typecheck, Code lint, Test lint, Story config copies, Sign-off, and Sandbox paths. Full product gates, phase-wide mutation, and the historical benchmark are due on the published candidate. [Local readiness](pilot-readiness.md)

## Earlier findings

First review round.
