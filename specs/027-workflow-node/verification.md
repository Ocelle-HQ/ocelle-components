# Spec Kit verification timing for #72

Issue #72 used the improved workflow for three approved phases covering selection and stable IDs,
accessible focus and states, and read-only run inspection. Each phase kept its test-only red,
verified the selected browser assertions against the pre-phase code and implementation, and ran the
complete required suite in GitHub Actions. Phase 1 also verified the same red assertions against
the inert scaffold. Phase 3 replayed the independent review fix against its own pre-fix revision.

## Focused local replay

Times are wall-clock measurements for the revisions listed. The first replay can reuse already
recorded red evidence. The unchanged repeat reused every listed stage with identical test identities.

| Candidate | First replay | Unchanged repeat | Stages reused on repeat | Evidence |
| --- | ---: | ---: | ---: | --- |
| #74 textarea pilot | 87.337 s | 1.745 s | 6 | [Op 025 timing](../../ops/025-spec-kit-verification/reviews/phase-1/timing.md) |
| #72 Phase 1 `c9ebf6ec` | 77.539 s | 0.847 s | 4 | [Phase 1 evidence](reviews/phase-1/implementation.md#focused-replay) |
| #72 Phase 2 `32df0b5d` | 31.818 s | 0.707 s | 3 | [Phase 2 evidence](reviews/phase-2/implementation.md#focused-replay-for-t009) |
| #72 Phase 3 `948c01fa` after review fix | 44.738 s | 1.536 s | 5 | [Phase 3 evidence](reviews/phase-3/implementation.md#final-focused-replay-for-t013) |

The independent replay on the final synthetic merge took 61.701 seconds and reused all five
stages in 1.790 seconds on repeat. The original phase's four assertion failures and the review fix's
two named assertion failures each reproduced on their respective bases. [Phase 3 evidence](reviews/phase-3/implementation.md#final-focused-replay-for-t013)

## Complete required GitHub Actions checks

Hosted elapsed times run from GitHub Actions creation through the complete required verdict. The
Unit tests inventory and elapsed time come from the six-shard Unit tests aggregate for each run.

| Candidate | All required checks | Unit tests | Unit files | Unit verdict elapsed | CI run |
| --- | ---: | ---: | ---: | ---: | --- |
| #74 textarea pilot | 55m 20s | 10,287 | 298 | | [Pilot CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45063522257) |
| #74 main-target candidate | 56m 36s | 10,831 | 324 | 40m 14s | [Main-target CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45165742931) · [Unit tests](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45165742931/job/137682434468) |
| #72 Phase 1 `c9ebf6ec` | 56m 52s | 10,852 | 326 | 35m 14s | [Phase 1 CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45190728055) |
| #72 Phase 2 `32df0b5d` | 59m 00s | 10,870 | 326 | 45m 18s | [Phase 2 CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45206635291) |
| #72 Phase 3 `948c01fa` after review fix | 57m 06s | 10,876 | 326 | 45m 20s | [Phase 3 CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705) |

The final #72 run took 30 seconds longer than the #74 main-target run and included 45 more tests in
two more files. Changed-source mutation finished last on both runs. The final #72 run passed all 18
required checks, including all six Unit tests shards, strict mutation, full Plants, visual regression,
accessibility and content security. The required Unit tests ran all 11 visual integration cases and
all four axe integration cases deferred by local replay.
[#74 mutation verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45165742931/job/137691303455) · [#72 mutation verdict](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45223305705/job/137899200942) · [#72 final gate evidence](reviews/phase-3/implementation.md#full-hosted-verification-for-t013)

The initial Phase 3 draft CI started at 16:52:55 UTC, 10m 30s after the 16:42:25 UTC decision to
keep Phase 2 history and continue. The initial draft passed the hosted gates. Independent review
identified the hidden-status defect, which was fixed test-first and checked again on the final
candidate. These are phase and run milestones. Issue pickup through merge was outside those clocks.
[Phase 2 decision](reviews/phase-2/operator-history-decision.md) · [Initial Phase 3 CI](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45221456769) · [Review and fix](reviews/phase-3/round-1-fixes.md)
