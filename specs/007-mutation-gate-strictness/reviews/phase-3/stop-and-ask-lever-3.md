# Phase 3: stop-and-ask after lever 3 (T037)

Recorded by the implementer on 2026-11-11, as the operator's FR-014 decision requires ("If any entry still misses
176 s or keeps a Timeout, the question goes back to the operator"). This is a question for the operator, not a
verdict.

## The point reached

Lever 3 is in: 001 FR-013's entry bound is 30 changed lines for every file (red `4b3279a`, green `3222ec2`, records
amended). The plan against `B = eaf16896` makes eight `source.ts` entries (`1-30` … `211-230`), 71 shards and 70 cuts.
With lever 1 in place and the checker on as configured (`evidence/README.md` § Lever 3):

| Entry | Mutants | CompileError | Time | Within 176 s |
|---|---|---|---|---|
| `source.ts:1-30` | 19 | 3 | 73.96 s | yes |
| `source.ts:31-60` | 115 | 61 | 166.19 s | yes |
| `source.ts:61-90` | 79 | 36 | 131.38 s | yes |
| `source.ts:91-120` | 123 | 63 | **177.68 s** | **no** (checker off, diagnostic: 65.83 s) |
| `source.ts:121-150` | 110 | 54 | 171.98 s | yes |
| `source.ts:151-180` | 114 | 57 | **182.52 s** | **no** (checker off, diagnostic: 53.75 s) |
| `source.ts:181-210` | 79 | 31 | 128.99 s | yes |
| `source.ts:211-230` | 40 | 18 | 91.36 s | yes |

Every entry: 0 Timeout, 0 Survived, 0 NoCoverage, exit 0. FR-011 holds for all 122 former Timeouts (57 Killed by the
named `source-table.test.ts` tests, 65 CompileError as in the red run). The per-mutant comparison against the red runs
passes; the cut limit is two mutants, both CompileError in the red run (`30:151-32:2` BlockStatement, `206:3-211:4`
ObjectLiteral). Two entries miss 176 s, by 1.68 s and 6.52 s. Each was measured once and is recorded as measured; no
re-run was taken to look for a faster time.

## The question

Two of the eight 30-line entries miss FR-010's sandbox bound of 176 s by a few seconds, with the checker on. What does
the operator decide? For example (the operator's choice, none taken): accept these figures and let the CI measurement
of R-07 decide (FR-010 says the CI figures decide and both must hold); a smaller entry bound; a re-run of the two
entries to see the sandbox's variance; or another lever. Until then T029 (rerun at the final HEAD), T030, T031 and
T037 stay open, and no "Open for landing" section is written.

## Also for the operator

- `red.sh` accepts only the labels `phase` and `fix-<round>`, so `red.sh 3 lever-3` ended exit 2 before running.
  The same check was run with the script's own `story_run_tests_at` (log `red-lever-3.log`: the commit changes only
  `gates/test/mutation-shards.test.ts`; 23 of 2099 tests failed, all assertion mismatches against the 60-line plan),
  and the line `lever-3 4b3279a77492fafb6e78c8737ec6f6be940f3e9d` was added to `red-commits` by hand, so `tdd-check.sh 3`
  checks it like the other red commit. The script was not changed.
- The FR-013 reference entries were not re-run under lever 3: the lever changes only how `--plan` cuts entries, and
  `generate.ts:1-60` is no longer a plan entry (`generate.ts:1-30` and `31-60` now; `wcag.ts` is still whole).
- `evidence/compare.mjs` was extended (several green reports, `--cuts`) to compare a 60-line red entry with the two
  30-line entries covering it; without `--cuts` it fails loudly as before.
