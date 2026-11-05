---
phase: 5
round: 7
verdict: changes_requested
base: eeb95d43d7ffa147e14193e215859c2c4a41586d
head: 7fb1a86
tdd_check: pass
---

# Phase 5 review, round 7

Scope: the O6-01 fold (operator round 6). This covers the contract amendment 4aa2637, red fc27170 (`fix-6`), green
3d9d674 and the evidence commits 25e2cf3, 92cb9d3, 5a15fd0 and 7fb1a86. Since round 5 (5806342), outside `specs/`,
only `gates/README.md`, `gates/bin/mutation.ts` (a comment), `gates/lib/mutation/shards.ts` and
`gates/test/mutation-shards.test.ts` changed.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R7-01 | blocking | specs/001-repository-foundation/spec.md:278-283 (FR-013), :490-494 (SC-005); specs/001-repository-foundation/plan.md:50 (Performance Goals) | The amendment leaves the normative requirement at 120. FR-013 still defines "An entry is a changed file, or, for a file with more than 120 changed lines, one line range of it: such a file MUST be split ... into several entries of at most 120 changed lines", and "no shard holds more than 120 changed lines of one file". The gate now splits any file of 61 to 120 changed lines into `path:start-end` entries (shards.ts:32, :48). That is an entry FR-013 does not allow, and on the plan of eaf1689 it happens to four files: `gates/bin/contrast.ts` (117 lines), `gates/lib/plant-runner.ts` (76), `gates/stylelint/token-lists.ts` (106) and `packages/tokens/scripts/build.ts` (62). 001 research.md R-08 (amended, :372-387) now contradicts FR-013 in the same feature. SC-005 ("no entry over 120 changed lines", "the 120-line split") and 001 plan.md:50 ("a file over 120 changed lines split") are stale too. Both earlier bound changes amended FR-013 and SC-005 explicitly (phase 3 rounds 9 and 10, phase 4 round 3; 001 plan.md:160-180). Round 6's list of required changes did not name spec.md, but it did require amending "the contract", and FR-013 is that contract's source. | Planner, documentation only, no code or test change: amend 001 spec.md FR-013 and SC-005 to entries of at most 60 changed lines, with a file of more than 60 split, and cite the operator decision of 2026-11-05 (phase 5 round 6 of 002, O6-01). Amend 001 plan.md's Performance Goals the same way, and add a re-check note like those after phase 3 rounds 9 and 10. The 10-entry and 250-line bounds and the one-file-per-shard rule stay as they are. |
| R7-02 | note | specs/002-design-tokens/reviews/phase-5/mutation-shards.md (last paragraph) | It says the 3 mutants lost between the old shard and the two new ones are "most likely" mutants spanning the cut at 180/181, "not checked one by one". I checked: Stryker 10.1.1's instrumenter on `generate.ts` at 7fb1a86 gives 264 mutants for range 121-240, 157 for 121-180 and 104 for 181-240, the same counts as the timed runs. Exactly 3 mutants of the whole range are in neither part. All are `BlockStatement` (`{}`) mutants spanning the cut: the body of `cycleProblems` (lines 171-194), the body of its `for (const start of edges.keys())` loop (177-192), and the body of the `walk` arrow function (179-189). The statements inside each are still mutated. This is the accepted limit O10-02, so it is no finding against the code. | None required. The note could replace "most likely" with these three. |
| R7-03 | note | gates/README.md:134-139 (4aa2637) | The orchestrator directed the planner to make this edit, outside its role. The text is correct. Entries are at most 60 changed lines and a file of more than 60 is split. Shards stay at most 10 entries and 250 changed lines, and two entries of one file never share a shard. "No shard holds more than 60 changed lines of one file" follows from those rules. The cut paragraph is unchanged, and the cited figures (264 mutants, 670 s) match round-6.md O6-01. | None. |

## Test quality

- **Red evidence.** fc27170 changes only `gates/test/mutation-shards.test.ts`. `red-fix-6.log` shows 22 of 1798
  tests failing, every one with an `AssertionError` in that file and no load or setup error. In each, the old
  120-line split produced fewer entries than the 60-line expectation, which is the missing behaviour.
  `tdd-check.sh 5`, re-run here at 7fb1a86, gives `pass`: fix-6 exits 1, the head exits 0, and `problems` is empty.
- **No weakening.** `git diff fc27170..HEAD -- gates/test` is empty, so green changed no test. The red commit moves
  every expectation from 120 to 60 and keeps its strength. The boundary pair stays (exactly 60 is one entry, 61 is
  `:1-60` plus `:61-61`). So do: the cut inside a range (the comment's arithmetic checks out: 50+10, 60, 21); the
  multi-range and plant-judge.ts cases (60/60/60/36); exactly 250 lines in one shard (10 + 4 x 60); 251 lines in
  two shards; the 11th entry; one file never twice in a shard; and the `--plan` and stderr cut counts (6 shards,
  5 cuts: 1 + 1 + 0 + 2 + 1 = 5). One assertion is new and stricter: the mixed-files invariant also checks that
  the number of entries is the sum of `ceil(lines / 60)`. No skip, only, conditional or snapshot assertion is
  present.
- **Bounds unchanged.** In shards.ts, `maxEntries = 10` and `maxLines = 250` are untouched, and so is the
  same-file rule (the diff changes only `maxEntryLines` and comments).
- **Mutation.** `pnpm run gate:mutation -- --base eeb95d4 --files gates/lib/mutation/shards.ts` exited 0 in 39 s:
  "0 mutants on the changed lines of 1 file, none survived; 0 equivalent records". The only changed code line is
  the numeric literal `const maxEntryLines = 60;`, and Stryker has no numeric-literal mutator. The 60/61 boundary
  tests pin that value. This was the only mutation run, run alone, with no `gate:plants`. I did not re-run the
  full-diff run of `round-6-mutation.log` (1193 mutants, none survived, 671 s), as instructed.

## Checks run

On Node 22.23.4, at 7fb1a86, working tree clean apart from the tdd-check evidence:

- `pnpm test`: 1798 tests passed in 88 files.
- `gate:typecheck`: no type error. `gate:lint`: 156 files, no finding. `gate:test-lint`: 98 files, no finding.
- `pnpm run gate:mutation -- --base eaf16896ec10affdca24296fc9531fcffc46a8be --plan`: exit 0. Stderr reports
  "24 shards, 23 cuts within files". The JSON is byte-identical to the plan in `mutation-shards.md`. I counted the
  added lines of `git diff -U0 eaf1689..HEAD` in each entry independently. The largest entry is 60 changed lines,
  and no entry is over 60. Each shard's `lines` equals the sum of its entries. No shard is over 10 entries or 250
  lines, and no shard holds two entries of one file.
- The mutation run on shards.ts above, and `tdd-check.sh 5`: `pass`.
- The CI result on 7fb1a86 had not arrived when this review was written.

## Earlier findings

- **O6-01 (round 6, blocking): resolved in the code, not fully in the contract.** `maxEntryLines = 60`
  (shards.ts:32) came test-first with red `fix-6`. `--plan` on eaf1689 shows no entry over 60. The heaviest new
  `generate.ts` shard, 121-180 (157 mutants), took 207 s locally and the longest, shard 19, took 231 s. Both are
  well under 600 s, against 670 s for the old 121-240 shard (`mutation-shards.md`). T071 is ticked
  (tasks.md:212). The amendments to 001 research.md R-08, 001 contracts/gate-cli.md, gates/README.md and the 002
  texts are correct. The 002 texts keep 120 only as the historical bound of the US1 spike. The 001 spec FR-013 and
  SC-005 and the 001 plan are not amended (R7-01).
