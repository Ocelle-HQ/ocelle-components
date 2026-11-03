---
phase: 4
round: 4
verdict: approved
base: 4df12b0823f1a777cf37c501271201fdf4daca64
head: e985ed3f0cc0d3e374fdb2a41610b2c2e4abc070
tdd_check: pass
---

# Phase 4 review, round 4

Scope: the round 3 operator addendum O3-01 (T093). This covers planner commit `4929b0a`, red `3c86680`, green
`7af6c7f` and the evidence commit `e985ed3`. Since `7494c61` (round 3 head), the change touches only
`gates/lib/mutation/shards.ts`, `gates/test/mutation-shards.test.ts`, `gates/README.md`, spec/plan/research/tasks
and files under `reviews/phase-4/`. Nothing outside T093 changed.

## Findings

No blocking finding. One note asks the operator for a decision.

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R4-01 | note (operator decision) | gates/lib/mutation/shards.ts:15-16; spec.md:262-269 (FR-013), :464-468 (SC-005); reviews/phase-4/mutation-shards.md § "Review round 3" | **FR-013/SC-005 is met on the evidence, but the margin is thin, and the line bound no longer controls the longest shards.** GitHub run 41613884529 (head `e985ed3`, verified with `gh run view`) is green: all 18 shards finished. The three longest jobs are `pins-rules.ts` alone (137 lines, 267 mutants) at 09:48:06 to 09:56:07 = 8:01, `plant-runner/registry/spawn` (242 lines) at 7:53, and `plant-judge.ts` alone (198 lines, 323 mutants) at 7:45. The longest shard went from 10:20 to 8:01 (-22%), not "about half" as the operator expected. The headroom is 1:59 (about 20%). The same code at 500 lines varied run to run by +2:49 (`plant-judge,plant-repo` 7:31 → 10:20) and +2:47 (`records…pins-rules` 6:51 → 9:38). A swing that size on an 8:01 shard passes 10 minutes. Two of the three longest shards are single files under the bound, so no lower line bound can shorten them. Shard time follows mutants per file (the TypeScript checker handles one file's mutants in sequence, as the implementer's note explains; CI took 1.7 to 2.0 times the local time for these shards), not changed lines. This does not block: every MUST in FR-013 holds in code (`timeout-minutes: 10`, ci.yml:89; a timeout fails, and the verdict job passes only when every shard passed). SC-005 was measured on the SC-001 runner and met. The operator's chosen remedy is in place. The remaining risk is a false red that needs a re-run, never a false pass. This pull request is also a worst case: all gate source is new, and a later change touches far fewer lines per file. | Operator, choose one: **(A) Accept and watch** (cheapest). Record run 41613884529 as the SC-005 measurement. A shard cancelled at the limit counts as a failure to investigate, not to re-run blindly. Revisit only if that happens. **(B) Split a file's changed ranges across shards.** `mutateSpecs` already emits `path:start-end` per range (gates/lib/mutation/ranges.ts:74-76), so `planShards` could cut a file's ranges at the bound instead of keeping the file whole. This needs a spec change, because FR-013 now says a file over the bound is a shard of its own and the limit is not raised for it. It is the only option that shortens the single-file shards. **(C) Bound by mutants (or lines and mutants)** instead of lines only. This fits the cost better but helps single files only together with (B). **(D) Change the budget:** a larger runner (more vCPU, `concurrency` per R2-05) or a longer per-shard limit. A longer limit reverses the plan squad round 2 decision ("the limit is not raised"). Not recommended: turning off the TypeScript checker in CI, which would change the "invalid mutant" rule of FR-011. |

## Test quality

- **Red evidence:** `red-fix-3.log` (red `3c86680`, test file only) exits 1 with 3 of 1111 failed. All three are
  `AssertionError`s at gates/test/mutation-shards.test.ts:33, :46 and :53, against the 500-line code: the
  250-included case, the 251-split case and the 251-alone case. There is no load or setup error.
  `tdd-check.json` (head `7af6c7f`): `pass`. Red commits `phase`, `fix-1` and `fix-3` all exit 1, head exits 0, and
  there are no problems. `e985ed3` adds only check logs, so this result still holds at HEAD.
- **No weakening:** `git diff 3c86680..HEAD -- gates/test` is empty. The red commit changes the old 500-line
  case to 250 at both boundaries (150+100 = 250 together, 1+249 = 250 together, then a new shard). It renames the
  700-line case to say "more than 250" with the same assertion, and it adds the three cases T093 step 2 asks for:
  125+125 in one shard (:42), 200+51 in two (:46), 251 alone (:53). Each asserts the exact `planShards` output with
  `toEqual`. None has a conditional, a skip or only, or a snapshot. The 250-together and 700-alone cases pass under
  both bounds, as they should. The 251 cases are what tie the code to 250. T093 asks for cases "on recorded diff
  output". These cases use synthetic `ChangedFile`s, like the rest of T039's `planShards` cases. The diff-to-
  `ChangedFile` path has its own tests (ranges), so this is acceptable.
- **Mutation:** I ran `pnpm run gate:mutation -- --base 4df12b0 --plan` against the phase base: 11 shards. Then I ran
  the shard that holds the changed file with `--files gates/bin/style-lint.ts,…,gates/lib/mutation/shards.ts`:
  exit 0, "66 mutants on the changed lines of 6 files, none survived; 16 equivalent records" (1 min 18 s). The
  records are the process-boundary records reviewed in rounds 1 and 2; none is new in `shards.ts`. The implementer's
  PR-base run (`round-3-mutation-pr-base.log`, 18 shards, none survived) and CI's 18 green shards agree.

## Checks run

At HEAD `e985ed3`, with `PATH=/opt/node26/bin:$PATH` and `OCELLE_CHROMIUM_PATH` set to the local headless shell
(R-03):

- `pnpm test`: exit 0, "1111 tests passed in 52 files" (1 min 18 s).
- `gate:config-copies`, `gate:test-lint`, `gate:typecheck`, `gate:lint`, `gate:style-lint`, `gate:csp`,
  `gate:prefix`, `gate:pins`: exit 0 each.
- `gate:signoff -- --range bdb9b70..HEAD`: exit 0, "126 commits checked, no finding".
- `gate:plants`: exit 0, "136 plants of 11 gates and the registry judged, every plant as expected" (2 min 39 s).
- `gate:mutation`: as above, exit 0.
- GitHub CI run 41613884529 (head `e985ed3`): `success`, every check and all 18 `Mutation shard` jobs green, and
  `Mutation testing` green (verified with `gh run view --json jobs`).

The bound in every artefact: `maxLines = 250` (shards.ts:16) and the header comment (:1-3), FR-013 (spec.md:263),
SC-005 (:464-466), plan.md:50 and :128-132, research.md R-08 (:329-332), tasks T039/T093, and gates/README.md:69-71.
The 10 files and `timeout-minutes: 10` are unchanged. A repository-wide search finds no other statement of a
500-line bound. Only the history notes ("500 until T093") mention it. contracts/ci-checks.md never stated the
bound.

## Earlier findings

- **O3-01 (blocking, round 3): resolved.** The bound is lowered to 250 in code and in every artefact that states
  it. The change was test-first under `red.sh 4 fix-3` (`red-commits` has `fix-3 3c86680`, exit 1). 10 files and
  the 10-minute limit stay. The shards were re-timed locally (mutation-shards.md, 18 shards, longest 272 s) and on
  CI (run 41613884529, longest 8:01). Whether this gives enough confidence for SC-005 goes back to the operator as
  R4-01.
- **R2-01 (note): resolved.** mutation-shards.md § "Review round 3" records the run 4/6/7 durations, withdraws the
  "more than half" claim and says the margin was unknown until a CI run. That run now exists. The measured margin
  is about 20% on the longest shard (R4-01). Adding those durations to mutation-shards.md is left to whoever next
  edits it. It is not required here.
- **R2-02 (note): still open.** `base` is still missing from data-model.md § Plant and contracts/plants.md. This
  is outside T093 and needs the operator or planner.
- **R2-03:** no change needed. **R2-04, R2-05:** still apply (Stryker internals pinned; `concurrency: 8` fixed).
  R2-05 is one of the levers in R4-01 (D).
