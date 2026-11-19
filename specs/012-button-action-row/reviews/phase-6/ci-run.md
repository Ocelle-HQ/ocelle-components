# Phase 6: CI run at the full story count (T067, T069; phase 6 round 2 O2-01)

**Run**: CI run 44098238937 on 497b05f (the landing HEAD of PR #50), Plants job: 76 shards and the Plants verdict;
145 jobs in all. The repository's story count at this run is **171** (the merges of the landing; landing review
R1-01), against the split count of **76 stories** at shard size 1 (012 plan decision 15, research R-13), which is
exceeded by 95 stories.

**Source of the figures**: supplied by the orchestrator from the run's job and step records; nothing below is
measured or estimated here (tasks.md T069). Two measures per shard:

- **Gate step**: the time of the step that runs the shard's plants (`pnpm run gate:plants -- --shard <k>`), the
  measure T067 and the operator's decision judge.
- **Job wall**: the whole job, runner setup included. The two setup columns show where the rest of the wall time went
  that day: the disk-cleanup step and the pnpm setup step (about 20 s normally).

## Attempts

- **Attempt 1**: shard 23 failed in setup (job 134091277989): `pnpm store path` printed nothing, then
  `actions/cache/restore` failed with "Input required and not supplied: path"; no plant ran. The Plants verdict then
  exited 2, "plants: could not run: shard 23 of 76 reported no result" (job 134100248902): fail-closed, as it should
  be (landing review R1-05).
- **Attempt 2**: the operator authorised one re-run of the failed jobs (2026-11-17). Attempt 2 was green: shard 23
  (job 134127884542) and the Plants verdict (job 134135121142). The run is **145/145** green.
- The figures below are those of attempt 1 for the shards that passed in it and of attempt 2 for shard 23 (see the note under the table on the job ids).

## Per shard

| Shard | Attempt | Job wall (s) | Gate step (s) | Disk cleanup (s) | Setup (s) | Job id |
|---|---|---|---|---|---|---|
| 1 | 1 | 205 | 100 | 83 | 16 | 134091277916 |
| 2 | 1 | 259 | 116 | 113 | 21 | 134091277976 |
| 3 | 1 | 190 | 83 | 77 | 21 | 134091277832 |
| 4 | 1 | 117 | 34 | 65 | 13 | 134091277797 |
| 5 | 1 | 215 | 3 | 181 | 21 | 134091277873 |
| 6 | 1 | 147 | 0 | 110 | 27 | 134091277888 |
| 7 | 1 | 455 | 0 | 75 | 373 | 134091277882 |
| 8 | 1 | 92 | 0 | 60 | 22 | 134091277937 |
| 9 | 1 | 614 | 455 | 134 | 19 | 134091278049 |
| 10 | 1 | 586 | 415 | 142 | 21 | 134091277917 |
| 11 | 1 | 691 | 411 | 247 | 23 | 134091278024 |
| 12 | 1 | 540 | 417 | 89 | 27 | 134091277975 |
| 13 | 1 | 534 | 437 | 66 | 23 | 134091277952 |
| 14 | 1 | 476 | 379 | 75 | 16 | 134091277921 |
| 15 | 1 | 796 | 379 | 138 | 271 | 134091277875 |
| 16 | 1 | 527 | 406 | 98 | 15 | 134091278071 |
| 17 | 1 | 489 | 423 | 40 | 18 | 134091278036 |
| 18 | 1 | 544 | 405 | 108 | 23 | 134091278316 |
| 19 | 1 | 510 | 444 | 40 | 18 | 134091277958 |
| 20 | 1 | 632 | 479 | 117 | 22 | 134091277911 |
| 21 | 1 | 505 | 414 | 68 | 17 | 134091277959 |
| 22 | 1 | 510 | 445 | 38 | 19 | 134091277991 |
| 23 | 2 | 645 | 468 | 145 | 22 | 134127884542 |
| 24 | 1 | 550 | 458 | 67 | 18 | 134091277966 |
| 25 | 1 | 560 | 430 | 107 | 16 | 134091277903 |
| 26 | 1 | 595 | 456 | 107 | 24 | 134091277954 |
| 27 | 1 | 821 | 410 | 67 | 337 | 134091278021 |
| 28 | 1 | 752 | 420 | 101 | 224 | 134091278080 |
| 29 | 1 | 556 | 434 | 96 | 19 | 134091277995 |
| 30 | 1 | 573 | 439 | 108 | 21 | 134091278140 |
| 31 | 1 | 557 | 458 | 74 | 18 | 134091278105 |
| 32 | 1 | 571 | 444 | 97 | 21 | 134091278279 |
| 33 | 1 | 862 | 414 | 133 | 308 | 134091278333 |
| 34 | 1 | 508 | 442 | 41 | 18 | 134091278485 |
| 35 | 1 | 491 | 425 | 44 | 15 | 134091278345 |
| 36 | 1 | 590 | 451 | 107 | 23 | 134091278291 |
| 37 | 1 | 564 | 418 | 123 | 17 | 134091278406 |
| 38 | 1 | 511 | 413 | 69 | 20 | 134091278355 |
| 39 | 1 | 444 | 356 | 64 | 17 | 134091278463 |
| 40 | 1 | 669 | 516 | 122 | 23 | 134091278203 |
| 41 | 1 | 516 | 381 | 111 | 18 | 134091278381 |
| 42 | 1 | 778 | 456 | 278 | 36 | 134091278458 |
| 43 | 1 | 514 | 432 | 55 | 20 | 134091278377 |
| 44 | 1 | 549 | 453 | 72 | 17 | 134091278346 |
| 45 | 1 | 516 | 373 | 117 | 20 | 134091278401 |
| 46 | 1 | 596 | 418 | 144 | 26 | 134091278572 |
| 47 | 1 | 528 | 445 | 56 | 20 | 134127874874 |
| 48 | 1 | 826 | 461 | 324 | 33 | 134127875215 |
| 49 | 1 | 560 | 464 | 48 | 38 | 134127875155 |
| 50 | 1 | 545 | 419 | 101 | 19 | 134127874956 |
| 51 | 1 | 521 | 439 | 60 | 16 | 134127876596 |
| 52 | 1 | 98 | 1 | 66 | 22 | 134127875875 |
| 53 | 1 | 73 | 3 | 48 | 16 | 134127877312 |
| 54 | 1 | 130 | 1 | 97 | 23 | 134127878238 |
| 55 | 1 | 293 | 196 | 74 | 17 | 134127877823 |
| 56 | 1 | 341 | 201 | 110 | 21 | 134127878080 |
| 57 | 1 | 429 | 172 | 135 | 116 | 134127877591 |
| 58 | 1 | 307 | 209 | 63 | 25 | 134127877860 |
| 59 | 1 | 363 | 206 | 123 | 24 | 134127878521 |
| 60 | 1 | 546 | 207 | 292 | 37 | 134127879305 |
| 61 | 1 | 301 | 212 | 66 | 17 | 134127879836 |
| 62 | 1 | 361 | 175 | 156 | 20 | 134127881250 |
| 63 | 1 | 269 | 168 | 75 | 20 | 134127881239 |
| 64 | 1 | 376 | 202 | 150 | 18 | 134127881709 |
| 65 | 1 | 425 | 175 | 220 | 21 | 134127883155 |
| 66 | 1 | 321 | 207 | 85 | 21 | 134127882662 |
| 67 | 1 | 307 | 169 | 112 | 18 | 134127883725 |
| 68 | 1 | 400 | 172 | 193 | 26 | 134127883648 |
| 69 | 1 | 381 | 208 | 137 | 26 | 134127883932 |
| 70 | 1 | 323 | 195 | 105 | 17 | 134127883920 |
| 71 | 1 | 333 | 179 | 128 | 19 | 134127884308 |
| 72 | 1 | 399 | 174 | 196 | 21 | 134127885632 |
| 73 | 1 | 232 | 147 | 61 | 17 | 134127885056 |
| 74 | 1 | 341 | 210 | 100 | 23 | 134127886649 |
| 75 | 1 | 306 | 172 | 113 | 16 | 134127886354 |
| 76 | 1 | 253 | 154 | 74 | 17 | 134127887116 |

Note on the job ids: GitHub's re-run of the failed jobs carries every job that already succeeded into attempt 2 as a copy with a new job id and the same times, so the ids of some rows (shards 47 to 76) are those copies; their figures are attempt 1's.

## Totals

| Measure | Slowest shard | Over 570 s | Total |
|---|---|---|---|
| Gate step | **516 s** (shard 40) | **0** | 22953 s, **6.38 runner-hours** |
| Job wall | **862 s** (shard 33) | **17** (shards 9, 10, 11, 15, 20, 23, 26, 27, 28, 30, 32, 33, 36, 40, 42, 46, 48) | 34810 s, **9.67 runner-hours** |

- Every gate-step time is under 570 s ("near 10 minutes", 006 plan.md) and under 600 s: the peak is 516 s (shard 40,
  a `visual` plant), as round 2 states.
- 17 job wall times exceed 570 s (16 of attempt 1's 75 shards, as round 2 states, and shard 23's attempt 2 at
  645 s), up to 862 s (shard 33). The excess is runner setup that day, not the plants: the disk-cleanup step took up
  to 324 s (shard 48) and the pnpm setup step up to 373 s (shard 7), against about 20 s normally.
- Earlier run for comparison: CI run 44036606605 on 8cd1f45 (112 stories) was 145/145 green, with the plants gate
  step at most 340 s and 4.5 runner-hours in all.

## Operator decision (phase 6 round 2, O2-01)

Operator, 2026-11-17, "Accept, file plant triage (Recommended)": "Record both measures (gate step and job wall time,
per shard and total) in reviews/phase-6/ci-run.md once shard 23 is in, and tick T067 on the gate-step figure (all
under 570 s). Your plant-design triage record (decision 15, R1-09), with the visual test's 519/600 s (R1-06), is
offered as a follow-up issue."

T067 is ticked on the gate-step figure: every shard's gate step is under 570 s. Follow-up, offered as an issue and
pending: the plant-design triage record (a plant design whose shard time does not grow with the story count; 012
plan decision 15, landing review R1-09), together with the repository visual integration test's 519 s against its
600 s limit (landing review R1-06).

## Addendum, 2026-11-19 (phase 6 round 7, O7-01)

The follow-up paragraph above is a record at 171 stories and stays as it is. At **194 stories** (388 story-themes) the
repository visual integration test's whole-repository capture (`gates/test/integration/visual.test.ts:115`) timed out
at its **600 s** limit on CI run 44481594952 (571a8ed5, attempt 1; Unit tests failed, 1 of 7765 tests), and passed on
CI run 44298568583 (ac2d73a) at the same 194 stories. Phase 6 fix-4 raised that file's limit to **1200 s**
(`const timeout = 1_200_000;`, pinned by `gates/test/visual-timeout.test.ts`; operator 2026-11-19, "1200 s, visual
only"); `axe.test.ts` and `plants-robustness.test.ts` keep 600 s. The follow-up issue's text should give 194 stories,
with the 519 s as a 171-story figure (landing round 2 R2-03, landing round 3). specs/006-storybook-workbench/plan.md
(the Complexity Tracking row "Plant roots hold every repository story", planner commit 7802c723) gives the same
figures: 519 s against the then 600 s limit at 171 stories, the 600 s time-out at 194 stories on run 44481594952 and
the raise to 1200 s.
