---
scope: landing
phase: landing
round: 2
verdict: approved
base: 476602ef67c2ce6c514f8ad22c9938112d69b032
head: df92786edba647340235297bcae5d6790ae86df7
tdd_check: pass
---

# Landing review, round 2 (PR #24, mission 006-storybook-workbench, issue #10)

This is a landing-pass round under the stop rule (operator decision 2026-11-03). It does not search afresh. It checks
two things:

1. The three blocking findings of round 1 (L1-01, L1-02, L1-03) are resolved.
2. The folds since round 1 (`212ce29..df92786`, 15 commits) regressed nothing.

It also checks the three notes the operator chose to fold: L1-04, L1-05 and L1-07. L1-08 goes in the PR body and is
not a code change. Under the stop rule, a new finding is blocking only if it breaks a requirement and comes with a
reproduction or a red check. Otherwise it is a follow-up note.

The operator's decisions are recorded as operator rounds: `reviews/phase-2/round-2.md` (L1-02, L1-03, L1-07),
`reviews/phase-4/round-3.md` (L1-04) and `reviews/phase-5/round-2.md` (the #17 wording, L1-01, L1-05). The planner
commit `ab57df2` holds tasks T075 to T092 and plan decision 33. The fixes are:

| Phase | Red | Green | Ticks | Phase review |
|---|---|---|---|---|
| 2 (`fix-1`) | `1fa843d` | `d2d2bda` | `bc926c3` | `b897d0b`, approved |
| 4 (`fix-2`) | `1971530` | `d9bf6d9` | `9e7da81` | `cb42a79`, approved |
| 5 (`fix-1`) | `24d50ef` | `ed4eb72` | `13bd3ec` | `df92786`, approved |

None of these commits has been pushed, so there is no CI run for them. The last CI run, 43445129460 on `cc5a4c1`, was
green and predates the folds. Every result below is local.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| L2-01 | note | specs/001-repository-foundation/contracts/ci-checks.md:20 (the Content security row) | The fold brought the first table in line for the three new checks and the Plants job (L1-01). The Content security row still gives `pnpm -r build && pnpm run gate:csp`, but since 006, `.github/workflows/ci.yml:132` runs `pnpm --filter "./packages/*" -r build && pnpm run gate:csp`. gates/README.md:30 gives the new command. Round 1 raised the same drift only for gate-cli.md (line 31, "(after `pnpm -r build`)") and only as an optional item; that line is also unchanged. This does not break a requirement. The older command builds a superset, and `csp` reads only `packages/*/dist/`, so the verdict is the same. | Follow-up: give the filtered build in both contract rows, and the `plants` modes (`--plan`, `--shard`, `--verdict`) in gate-cli.md:36. |
| L2-02 | note | gates/lib/storybook-build.ts:120-124; gates/test/fixtures/storybook-build/config-unreadable/stdout.txt:6-7 | The new exit-2 cause quotes the single cleaned line that holds `MainFileEvaluationError`. Storybook wraps that message at its terminal width, so the cause stops mid-sentence: `could not run: storybook/.storybook/main.ts cannot be evaluated (SB_CORE-SERVER_0007 (MainFileEvaluationError): Storybook couldn't)`. That is what I reproduced, and it is also what the integration test and the plant pin. The cause still names the file and the error class, which is what FR-001 asks for. The underlying error (`Original error: …`, a few lines further down) is not quoted. | Optional: quote the error up to its first blank line, or the `Original error` line, so the contributor sees the syntax error without rerunning the build. |

No blocking finding.

## Earlier findings

- **L1-01 (blocking): resolved.** The fix is in `ed4eb72`, phase 5 O2-02. I checked
  `specs/001-repository-foundation/contracts/ci-checks.md` myself:
  - **Checks table.** The first table has eighteen rows, adding `Storybook build`, `Visual regression` (with
    `--remove-docker-image`, the pin record step, the `pin-record` artifact and the `visual` artifact on failure)
    and `Accessibility`. Its check names match the gate job names of `.github/workflows/ci.yml` one for one.
  - **Plants row.** It is now the verdict job: `needs: [plants-plan, plants-shard]`, `if: always()`, the
    `plant-shard-*` download and `--verdict storybook/.visual/plant-shards`.
  - **Helper jobs.** The helper-job table adds `plants-plan` and `plants-shard`, as the registry's
    `plantHelperJobs` does.
  - **Counts.** "seventeen in all" at :58 matches the 17 gate ids of `gates/gates.json`. "eighteen" appears at :60
    and :62.
  - **Mission 006 paragraph.** It is at :75-79 and asks the operator to add the three check names to the ruleset on
    `main`.

  The fix has no red test, and the reason is valid: no test reads this contract (`round-2-fixes.md`, T092). The
  operator still has to update the ruleset on `main`. Until then, none of the three gates blocks a merge.
- **L1-02 (blocking): resolved.** `gates/test/storybook-build.test.ts` has the test "reads a Vite error's location
  whose line and column have two or more digits", with the location `stories/b.ts:12:34`. Its red commit is
  `1fa843d`. There is no source change. I reran round 1's shard 92 at its current lines (`pnpm run gate:mutation --
  --base 476602e --files gates/lib/storybook-build.ts:71-117`). It exited 0: 80 mutants, none survived, 0 timeouts,
  27 compile errors, 0 equivalent records. The round-1 survivor `/╭─\[ (\S+?):\d:\d+ \]/` (now at :83) is killed.
- **L1-03 (blocking): resolved, operator choice (a).** `failedRunProblem` (gates/lib/storybook-build.ts:120-124) runs
  in `classifyBuild` (:140-141) before any finding. It gives exit 2 when the build was ended by a signal, and exit 2
  when a cleaned output line holds `MainFileEvaluationError`. FR-001 is unchanged: the only spec.md edits in the range
  are the #17 wording. contracts/gates.md § `storybook-build` and contracts/plants.md carry the amendment.
  - **Reproduction.** I repeated round 1's reproduction exactly: a scratch root from `git archive HEAD`, with
    `node_modules` and `storybook/node_modules` linked, and `storybook/.storybook/main.ts` set to `const config = {;`.
    `node gates/bin/storybook-build.ts --root <tmp>` printed `storybook-build: could not run:
    storybook/.storybook/main.ts cannot be evaluated (…)` and exited **2**. In round 1 it exited 1, at
    `storybook/package.json`. The quoted cause is cut off mid-sentence (L2-02, note).
  - **Red tests.** Five tests failed at `1fa843d`, each on an assertion. One of them replaced half of an older test,
    and the replacement is stricter, with its reason given (`round-2-fixes.md`).
  - **Plant.** The breaking plant `storybook-build/error-config-unreadable` judges as expected in shard 1 (below).
  - **Callers.** `gates/lib/visual-host.ts:123` still maps any non-zero build exit, now including 2, to its own
    cause. `visual/error-build-fails` (shard 4) and `axe/error-build-fails` (shard 20) still judge as expected.
- **L1-04 (note, folded): resolved.** `gates/lib/a11y-exceptions.ts:60-61` checks each entry's `plan`. The text
  must match `^specs/([^/]+)/plan\.md$`, and the feature segment must be neither `.` nor `..`. This runs after the
  inside-the-repository check. I repeated round 1's in-process reproduction:
  - `plan: "storybook/notes.md"` now gives the problem `storybook/a11y-exceptions.json#0: plan must be a feature plan,
    specs/<feature>/plan.md`. In round 1 it was honoured.
  - `specs/x/../../storybook/plan.md` and `specs/a/plan.md/` give the same problem.
  - `specs/006-storybook-workbench/plan.md` is still accepted.

  The red commit is `1971530`, with 11 tests red on assertions. The new plant `axe/error-exception-plan-not-a-plan`
  is expected and passes in shard 20. Every repository entry names `specs/006-storybook-workbench/plan.md`, and
  `gate:axe` passes.
- **L1-05 (note, folded): resolved.** The `visual` command now includes `--remove-docker-image` in
  `gates/gates.json:126`, in `gates/README.md:39` and in the contract row above. This matches `ci.yml` and
  contracts/gates.md. Its red tests are in `24d50ef` (`registry.test.ts`, `gates-readme.test.ts`). The copies without
  the flag are in the registry plants and fixtures (`gates/plants/plants/*/gates.json`,
  `gates/test/fixtures/registry/`). T089 leaves them on purpose: the registry check does not compare commands, and
  each of these is its own planted registry. No contributor-facing document still gives the shorter command.
- **L1-07 (note, folded): resolved.** Four tests now target the four timed-out mutants at the old lines :75, :77
  and :79 (now :77, :79 and :81). Each test asserts the exact result. In my shard 92 run all were Killed, with
  0 timeouts. Phase 2 round 3's R3-01 records that one of these mutants can still time out under load. Its killing
  test exists, so a timeout cannot hide a survivor there.
- **L1-08 (note, PR body):** not a code change, and this review does not read GitHub. The operator still has to
  confirm that PR #24's description says why the 42 baselines are added (constitution V).
- **L1-06 and L1-09 (notes, not folded):** open, as the operator chose.

## Regression check of the folds

- **Code changes.** The source changes are `gates/lib/storybook-build.ts` (+13/−3) and `gates/lib/a11y-exceptions.ts`
  (+3/−1). The other changes are `gates/gates.json` (one command), `gates/README.md`, two new plants, tests and
  fixtures, and spec and contract text. Nothing changes under `.github/`, `storybook/` or `packages/`. No story,
  baseline or published surface moves.
- **Plant partition.** The partition changes only by the two new plants. The non-visual, non-axe plants grow from
  232 to 233, still dealt into shards 1 to 3. The axe plants grow to 25, now shards 20 to 28 (28 shards in all; 27 at
  `cc5a4c1`). The visual shards 4 to 19 keep their membership.
- **Tests.** The red commits change only files under `gates/test/`. Every test change after a red commit is a later
  fold's own red edit, and each is stricter: the Deferred gates case and the two `visual` command expectations. No
  `skip`, `only` or loosened assertion was added.
- **TDD check.** `tdd-check.json` is `pass`, with no problems, for phases 2 (head `d2d2bda`), 4 (`d9bf6d9`) and 5
  (`13bd3ec`). Its red-commit labels are `fix-1`, `fix-2` and `fix-1`.
- **Mutation.** `gate:mutation -- --base 212ce29` covers the whole fold range: 41 mutants on the changed lines of
  2 files, none survived. It had 0 timeouts, 7 compile errors (reports) and 0 equivalent records.
- **Specs.** The spec.md, plan.md and research.md edits are the #17 wording (plan decision 33) and nothing else. The
  remaining "(#17 or #7)" strings are quoted as amended (phase 5 round 3).

## Checks run

Environment: Node 22.23.4, pnpm from the repository, dockerd running, no podman. `OCELLE_CHROMIUM_PATH` was set for
`pnpm test` and `gate:axe`, and unset for `gate:mutation` and `gate:plants`. The plant runs used
`OCELLE_VISUAL_ENGINE=docker`. I ran one heavy job at a time, all at `df92786`.

| Check | Result |
|---|---|
| `pnpm test` | exit 0: 3112 tests passed in 138 files (3089 at round 1), 4 m 37 s |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0: 263 files |
| `gate:style-lint` | exit 0: 12 files |
| `gate:test-lint` | exit 0: 173 files |
| `gate:config-copies`, `gate:pins`, `gate:manifest`, `gate:contrast`, `gate:brand-rules` | exit 0 each |
| `gate:signoff -- --range 476602e..HEAD` | exit 0: 99 commits (84 + the 15 folds) |
| `gate:storybook-build` | exit 0: built 21 stories |
| `gate:axe` | exit 0: 42 story-theme runs, 0 serious or critical; 10 notes (10 excepted) |
| `gate:mutation -- --base 212ce29` | exit 0: 41 mutants, none survived, 0 timeouts |
| `gate:mutation -- --base 476602e --files gates/lib/storybook-build.ts:71-117` (round 1's shard 92) | exit 0: 80 mutants, none survived, 0 timeouts |
| L1-03 reproduction (scratch root, unparsable `main.ts`) | exit 2, `could not run: storybook/.storybook/main.ts cannot be evaluated (…)` |
| L1-04 reproduction (in process) | `storybook/notes.md` refused; the feature plan accepted |
| `gate:plants -- --plan` | exit 0: 28 shards |
| `gate:plants -- --shard k`, k = 1, 2, 3 (the 233 plants of the other gates and the registry; `storybook-build/error-config-unreadable` in shard 1, the seven registry plants, which read the changed `gates.json`, spread over 1 to 3) | exit 0 each: 76 plants judged, every plant as expected; 83 s, 77 s, 108 s |
| `gate:plants -- --shard 4` (`visual/error-build-fails`, which builds through the changed `storybookBuild`) | exit 0: 3 plants as expected; 6 s |
| `gate:plants -- --shard k`, k = 20 to 28 (all 25 `axe` plants; `axe/error-exception-plan-not-a-plan` and `axe/error-build-fails` in shard 20) | exit 0 each, every plant as expected; 3 s, 86 s, 85 s, 88 s, 85 s, 86 s, 90 s, 85 s, 30 s |
| Plant shard times | the slowest shard is 108 s (shard 3), far below the 570 s CI cap; none comes close |
| `gate:visual`, `gate:csp`, `gate:prefix`, visual shards 5 to 19 | not rerun: the folds change no story, baseline, package, CSS or CI file, and the visual shards keep their membership; the shared build path is covered by `gate:storybook-build`, `gate:axe` and shards 4 and 20 |

## Verdict

`approved`. L1-01, L1-02 and L1-03 are resolved, and so are the folded notes L1-04, L1-05 and L1-07. The checks I ran
found no regression. There are two new notes, L2-01 and L2-02, both follow-ups. Before merge, the operator must:

- confirm the baselines rationale in PR #24's description (L1-08);
- add `Storybook build`, `Visual regression` and `Accessibility` to the ruleset on `main` (L1-01);
- push the folds and let CI run over them. The last CI run predates the folds, so this round's evidence is local.
