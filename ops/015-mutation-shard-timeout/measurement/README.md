# Op 015 CI measurement: job time of the mutation shards with element source

This is the evidence behind N, the job limit of a `mutation-shard` job whose `files` value names
`packages/elements/src/` (op.md acceptance check 3, plan.md *CI measurement*, tasks T003 to T005). It is not a test.
The relay these figures come from is kept verbatim in [`t003-relay.txt`](t003-relay.txt). Where this file and the
relay differ, the relay is the source, and the difference is noted below.

## Provenance

- **Relayed by:** the operator's orchestrator session (session_01NUfZSc26YwQLeow31d6R6X), which built the scratch
  branch, opened and closed the draft PR and read the run (operator decision "T002 permission refusal",
  `../reviews/triage/operator-decisions.md`). The message was queued 2026-11-15T04:17:45Z and received by the op 015
  /ocelle-run session at 2026-11-15T04:17:52Z. The coordinator passed it to the implementer on 2026-11-15.
- **Draft PR:** #36, against `main`, marked not for merge, and closed unmerged after the relay.
- **CI run:** 43674498025 (<https://github.com/Ocelle-HQ/ocelle-components/actions/runs/43674498025>). It ran on
  2026-11-15 from 03:55 to 04:14 UTC, on `ubuntu-24.04` runners.
- **Scratch head SHA:** `860bdd2877dd7c554400f39269e1049ba95d20cf`, on branch `claude/015-measure-elements-shards`
  (deleted after the run).
- **008 base SHA:** `78fe47542f77137d4fb2d45642f89029993a8af3`, the head of `origin/claude/016-overlays` at the
  T001 fetch. plan.md names `ecb51e8`, because 008 has moved on since the plan was written. At `78fe475`,
  `stryker.elements.config.json` already has `"dryRunTimeoutMinutes": 30`. `git merge-tree --write-tree origin/main
  origin/claude/016-overlays` merged cleanly (tree `5ad3efb9`, `origin/main` at `3828d2f`).
- **What the scratch commit changed:** only `.github/workflows/ci.yml:89`, to the provisional
  `    timeout-minutes: ${{ contains(matrix.shard.files, 'packages/elements/src/') && 90 || 10 }}`.
- **Job logs:** none were relayed, so there is no `logs/` directory.

## Every mutation-shard job

Times are in seconds. Job time runs from started to completed, without queue time. "Step" is the `gate:mutation`
step. The files are copied as relayed, and GitHub truncates long values with "...". The elements rows are paths under
`packages/elements/src/`. Stryker's dry-run line was not relayed for any shard (see *Gaps*).

### Shards with element source only (37, all measurements)

| Job id | Files | Element source | Conclusion | Job s | Step s | Dry run | Gate's mutation line |
|---|---|---|---|---|---|---|---|
| 132691675787 | `focusable.ts:91-120` | yes | success | 574 | 543 | not relayed | 44 mutants, none survived; 0 timeouts, 28 compile errors |
| 132691675800 | `ocelle-drawer.ts:61-90` | yes | success | 455 | 419 | not relayed | 0 mutants, 1 zero-mutant entry |
| 132691675804 | `focusable.ts:61-90` | yes | success | 703 | 672 | not relayed | 83 mutants, none survived; 12 CE |
| 132691675816 | `ocelle-dialog.ts:31-52,ocelle-drawer....` | yes | success | 654 | 621 | not relayed | 3 mutants, none survived; 1 zero-mutant entry |
| 132691675832 | `focusable.ts:31-60` | yes | success | 678 | 647 | not relayed | 31, none survived; 4 CE |
| 132691675833 | `focusable.ts:151-180` | yes | success | 626 | 591 | not relayed | 39, none; 17 CE; 1 equivalent |
| 132691675846 | `focusable.ts:181-186,index.ts,package...` | yes | success | 489 | 457 | not relayed | 8, none; 5 CE; 2 zero-mutant |
| 132691675848 | `focusable.ts:121-150` | yes | success | 623 | 584 | not relayed | 53, none; 18 CE; 1 eq |
| 132691675852 | `ocelle-drawer.ts:91-120` | yes | success | 720 | 685 | not relayed | 14, none; 3 CE |
| 132691675896 | `ocelle-drawer.ts:121-150` | yes | success | 794 | 758 | not relayed | 48, none; 8 CE |
| 132691675926 | `overlay.ts:91-120` | yes | success | 622 | 590 | not relayed | 3, none; 1 CE |
| 132691675940 | `overlay.ts:571-600` | yes | success | 623 | 591 | not relayed | 40, none; 13 CE |
| 132691675946 | `overlay.ts:301-330` | yes | success | 775 | 737 | not relayed | 19, none; 3 CE; 2 eq |
| 132691675964 | `overlay.ts:361-390` | yes | success | 870 | 835 | not relayed | 56, none; 22 CE |
| 132691675965 | `overlay.ts:181-210` | yes | success | 430 | 399 | not relayed | 0, 1 zero-mutant |
| 132691675968 | `ocelle-drawer.ts:31-60` | yes | success | 885 | 856 | not relayed | 8, none |
| 132691675972 | `overlay.ts:391-420` | yes | success | 657 | 624 | not relayed | 36, none; 21 CE; 2 eq |
| 132691675975 | `overlay.ts:721-750` | yes | success | 707 | 666 | not relayed | 28, none; 3 CE |
| 132691675983 | `overlay.ts:331-360` | yes | success | 1082 | 1049 | not relayed | 25, none; 3 CE; 4 eq |
| 132691675987 | `overlay.ts:211-240` | yes | success | 447 | 414 | not relayed | 0, 1 zero-mutant |
| 132691675988 | `overlay.ts:121-150` | yes | success | 456 | 422 | not relayed | 0, 1 zero-mutant |
| 132691675997 | `overlay.ts:451-480` | yes | success | 612 | 580 | not relayed | 39, none; 15 CE |
| 132691676011 | `overlay.ts:631-660` | yes | success | 709 | 674 | not relayed | 35, none; 10 CE; 2 eq |
| 132691676014 | `overlay.ts:601-630` | yes | success | 648 | 617 | not relayed | 54, none; 27 CE |
| 132691676021 | `overlay.ts:421-450` | yes | success | 725 | 689 | not relayed | 24, none; 10 CE |
| 132691676027 | `overlay.ts:151-180` | yes | success | 439 | 407 | not relayed | 0, 1 zero-mutant |
| 132691676028 | `overlay.ts:691-720` | yes | success | 648 | 614 | not relayed | 49, none; 22 CE; 1 eq |
| 132691676032 | `overlay.ts:61-90` | yes | success | 916 | 883 | not relayed | 28, none; 5 CE; 2 eq |
| 132691676033 | `overlay.ts:31-60` | yes | success | 739 | 704 | not relayed | 27, none; 15 CE |
| 132691676041 | `overlay.ts:271-300` | yes | success | 641 | 608 | not relayed | 14, none; 4 CE; 1 eq |
| 132691676054 | `overlay.ts:541-570` | yes | success | 688 | 652 | not relayed | 17, none; 4 CE |
| 132691676070 | `overlay.ts:511-540` | yes | success | 737 | 702 | not relayed | 45, none; 27 CE |
| 132691676080 | `ocelle-drawer.ts:151-155,overlay.ts:1...` | yes | success | 478 | 447 | not relayed | 8, none; 4 CE; 1 zero-mutant |
| 132691676081 | `overlay.ts:481-510` | yes | success | 655 | 621 | not relayed | 17, none; 5 CE; 1 eq |
| 132691676084 | `overlay.ts:241-270` | yes | success | 473 | 435 | not relayed | 2, none; 2 CE; 1 eq |
| 132691676104 | `overlay.ts:661-690` | yes | success | 612 | 577 | not relayed | 24, none; 10 CE; 3 eq |
| 132691676119 | `overlay.ts:751-780` | yes | success | 835 | 786 | not relayed | 23, none; 10 CE; 1 eq |

All 37 had "0 timeouts". None was cancelled.

### Shards that failed in the default configuration's initial test run (8)

These shards ran `stryker.config.json`. Its initial test run includes `gates/test/ci-workflow.test.ts`, whose
008-branch pin `    timeout-minutes: 10` fails against the provisional line. So the gate reported
"mutation: could not run: Stryker wrote no report (There were failed tests in the initial test run.)". The failure is
caused by the measurement commit, not by 008.

| Job id | Files | Element source | Conclusion | Job s | Step s | Dry run | Measurement? |
|---|---|---|---|---|---|---|---|
| 132691675809 | `gates/lib/story-page.ts:112-176` | no | failure | 67 | 38 | failed (initial test run) | no elements run, nothing to measure |
| 132691675811 | `gates/bin/axe.ts:44-148` | no | failure | 81 | 46 | failed (initial test run) | no elements run, nothing to measure |
| 132691675814 | `gates/lib/visual-host.ts:180-207,gates/visual/capture.ts,packages/elements/script...` | no (`packages/elements/script...` is not `packages/elements/src/`) | failure | 85 | 51 | failed (initial test run) | no elements run, nothing to measure |
| 132691675815 | `gates/bin/axe.ts:150-164,gates/bin/visual.ts,gates/lib/story-page.ts:44-109` | no | failure | 88 | 52 | failed (initial test run) | no elements run, nothing to measure |
| 132691675827 | `story-page.ts:178-244` | no | failure | 76 | 44 | failed (initial test run) | no elements run, nothing to measure |
| 132691675869 | `story-page.ts:246-509` | no | failure | 82 | 48 | failed (initial test run) | no elements run, nothing to measure |
| 132691675947 | `story-page.ts:514-540,storybook-serve.ts,visual-hos...` | no | failure | 91 | 62 | failed (initial test run) | no elements run, nothing to measure |
| 132691676007 | `packages/elements/src/overlay.ts:781-798,packages/tokens/src/source.ts` | **yes** (mixed) | failure | 85 | 57 | default configuration failed; elements configuration never ran | **not a measurement** (see below) |

The rows marked `story-page.ts`, `storybook-serve.ts` and `visual-hos...` are paths under `gates/lib/`, as relayed.

**132691676007 is not a measurement.** `gates/bin/mutation.ts` runs `stryker.config.json` first and
`stryker.elements.config.json` second. This shard's default run failed, so its elements dry run never started, and
`overlay.ts:781-798` was not measured. A plain rerun of that job on run 43674498025 would fail the same way, because
the scratch commit keeps 008's `timeout-minutes: 10` pin. A real measurement needs a scratch commit that also updates
that pin, or a later run after this op lands. **A rerun is requested from the operator.** See *Derivation* for why N
does not wait on it.

## Worst elements shard

**W = 1082 s = 18 m 02 s** (job 132691675983, `packages/elements/src/overlay.ts:331-360`, `gate:mutation` step
1049 s). The next longest were 916 s (`overlay.ts:61-90`), 885 s (`ocelle-drawer.ts:31-60`) and 870 s
(`overlay.ts:361-390`).

28 of the 37 elements shards ran past 600 s and were not cancelled. That shows two things: the current 10-minute
limit would have cancelled them, and the job-level `matrix` expression took effect. The relay says 27 of 37; its
per-job figures give 28. The ones at or under 600 s are 574, 455, 489, 430, 447, 456, 439, 478 and 473.

## Derivation of N (Q3 A)

N = max(45, ⌈1.5 × W / 5⌉ × 5), with W in minutes:

- W = 1082 / 60 = 18.033 minutes
- 1.5 × W = 27.05 minutes
- ⌈27.05 / 5⌉ × 5 = 6 × 5 = 30
- N = max(45, 30) = **45**

N = 45 is greater than the elements dry-run limit of 30 minutes, so a dry run that reaches Stryker's limit fails
before the job is cancelled.

The unmeasured mixed shard (132691676007) runs a default-configuration run and an elements run in one job. Its
default run took under 1 minute on this run, and the tokens shards' `gate:mutation` step is bounded by 007's 480 s.
Even if its elements run took W, its job would be about 18 m + 1 m + 8 m ≈ 27 minutes, still under 30 minutes.
1.5 × 27 = 40.5 rounds to 45, so N would stay 45. This is an estimate, not a measurement, which is why the rerun is
requested.

## Stop conditions (plan.md *CI measurement*, step 5)

| Condition | Holds? | Evidence |
|---|---|---|
| An elements shard was cancelled at the provisional 90 minutes | no | All 37 measured elements shards succeeded. The longest took 18 m 02 s. |
| W exceeds 60 minutes | no | W = 18 m 02 s |
| A dry run hit Stryker's 30-minute limit | no | Each dry run is part of its `gate:mutation` step, and the longest step was 1049 s (17 m 29 s). No shard failed on a dry run. |
| A shard without element source got more than 10 minutes | no | All 7 such shards ended within 91 s. Their 10-minute branch of the expression was not exercised beyond that. |

The plan's job-level check also holds: the run accepted the expression at job level.

**Risk (dry run over 20 minutes):** no dry run can have gone over 20 minutes, because every step was under 17 m 30 s.
No risk entry is needed.

## Gaps

- **Dry-run time per elements shard was not relayed.** `gates/bin/mutation.ts` prints only its own `mutation:`
  lines, and leaves out Stryker's "Initial test run succeeded. Ran <n> tests in <time>". The relayer read the whole
  gate step on 7 jobs and the tails on the rest. The dry run is part of the step time, so the step time is an upper
  bound on it.
- **Job logs** were not relayed.
- **`overlay.ts:781-798`** (mixed shard 132691676007) was not measured. See above.
