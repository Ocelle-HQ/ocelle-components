# App frame and navigation verification

[Issue #12](https://github.com/Ocelle-HQ/ocelle-components/issues/12) · [Pull request #65](https://github.com/Ocelle-HQ/ocelle-components/pull/65)

The mission delivers six custom elements and publishes the default shell threshold tokens. The approved [plan](plan.md), [public contracts](contracts/elements.md) and [validation guide](quickstart.md) cover the package entry points, layout tiers, focus, skip navigation, built CSP behavior and visual fixtures.

## Phase evidence

**Landing decision.** Proceed with the approved mission after the final integrated head passes all required GitHub checks.

- [Phase 1](reviews/phase-1/round-1.md) records approval of the contracts.
- [Phase 2](reviews/phase-2/round-1.md), [Phase 3](reviews/phase-3/round-1.md), [Phase 4](reviews/phase-4/round-1.md), [Phase 5](reviews/phase-5/round-1.md) and [Phase 6](reviews/phase-6/round-1.md) record independent approval. The [Phase 2 validation decision](reviews/phase-2/operator-validation-decision.md) and [Phase 3–7 validation decision](reviews/phase-3/operator-validation-decision.md) authorize the recorded tests-only red results, targeted red and green replays and full hosted gates. The generated run summary lists the absence of a canonical TDD output for those phases as `none`.
- [Phase 7](reviews/phase-7/round-1.md) records the docs-only TDD exemption and review. The final docs assertions passed 1,014 checks. The built-output CSP probe recorded zero policy violations, failed requests or outside requests.
- The published feature branch retains the red commits and evidence SHAs. The run summary links to the review records.

## GitHub checks

The [Phase 7 gate matrix](reviews/phase-7/branch-checks.md) names all 18 controlling checks and their commands. The [Phase 6 workflow](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/44990366919) passed all 140 jobs. The [first Phase 7 workflow](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45018910774) also passed all 140 jobs. The [final Phase 7 workflow](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45019091840) covers final docs and assertions. Its first attempt had one mutation shard fail during Stryker's initial test run before Stryker wrote a report. [Failure log](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45019091840/job/137197942138)

The [second attempt](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45019091840/attempts/2) retained the successful jobs and passed the retried shard and aggregate on the exact docs commit.

The [pull request checks](https://github.com/Ocelle-HQ/ocelle-components/pull/65/checks) are the source for the final integrated commit's gate results. GitHub applies branch rules and requires the status checks before merge.

## Main integration and landing fixes

The integration merged main at `8164293`, which updates the shared focus walker and button accessibility. Typecheck, code lint, style lint, test lint and story configuration copies passed locally. The targeted browser, touch and elements suites for the app frame, navigation, skip link, drawer and button passed 690 tests across 15 files after the first landing fix. The integrated follow-up replay passed 571 tests across 14 files. The final test-only change passed all 12 landmark regressions on the integrated tree and all 119 targeted tests on the source branch, including touch and built CSP.

The [initial landing review](reviews/landing/round-1.md) reproduced duplicate navigation landmarks, an empty drawer trigger and a whitespace-only menu label that left the trigger unnamed. The tests-only checkpoint `7be274a` failed seven assertions before `93fe5e8` fixed the behavior. The [follow-up review](reviews/landing/round-2.md) verified both fixes. Further tests checked fallback and reassigned slots, root replacement and the rail-only drawer path. The [final landing review](reviews/landing/round-3.md) records the supplemental tests and the exact survival replay. The final isolated Stryker diagnostic on `4bd7c01` scored 100% across the landing-fix lines. It killed 76 mutants and classified 39 as compile errors. It reported zero survivors, uncovered mutants or timeouts. The full hosted Mutation testing check controls the pull request.

The [first integrated CI run](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45027933468) found 11 uncovered or surviving mutations in the top-bar actions helper after navigation stopped using it. Tests-only commit `f97778a` caught all 11 exact variants and passed the 101-test browser replay. The isolated shard replay covered the full affected line range and scored 100%. It killed 31 mutants, rejected 30 at compilation, and reported zero survivors, uncovered mutants or timeouts. [Independent follow-up review](reviews/landing/round-4.md)

Two earlier hosted runs reached the 75-minute limit for the same static Lit property shard. The focused replay killed all 20 mutants. Commit `87b99cd` groups the intact property metadata with the public declarations. The existing shard planner now distributes the 20 static property-registration mutants evenly across two shards, and the instrumenter found the same 581 shell mutant identities. Typecheck, code lint, the 38-element manifest, and all 124 related browser, touch and built-CSP tests passed. [First timeout](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45027933468/job/137225039424) · [Second timeout](https://github.com/Ocelle-HQ/ocelle-components/actions/runs/45031290689/job/137235374404) · [Independent review](reviews/landing/round-5.md)
