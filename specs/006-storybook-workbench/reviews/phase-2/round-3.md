---
phase: 2
round: 3
verdict: approved
base: 9ae430ccee2cf60beba6dab5a24f4b4a2a2a4908
head: bc926c3
tdd_check: pass
---

# Phase 2 review, round 3

Scope: the fix (label `fix-1`) of round 2, the operator round from the landing review (O2-01, O2-02, O2-03).
Red `1fa843d`, green `d2d2bda`, ticks `bc926c3`. Landing-pass stop rule: are round 2's blocking findings resolved,
and did the fix regress anything. The phase was not searched afresh.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R3-01 | note | gates/lib/storybook-build.ts:71, :77 | Whether the module-level regex mutants end as `Timeout` depends on load, and is not settled by the tests. Two runs of the landing's shard 92 command (`pnpm run gate:mutation -- --base 476602e --files gates/lib/storybook-build.ts:71-117`) on the same HEAD gave different results. Run 1 had 3 timeouts: `:71` `""`, `:77` `/[\|!xoT•—│┌└◇●■▲](?: {2}\|$)/` (the landing's `:75` no-`^` mutant) and `:77` `/^[^\|!xoT•—│┌└◇●■▲](?: {2}\|$)/`. Run 2 had 0 timeouts, with all 53 non-compile-error mutants Killed. These are static mutants, so `coveredBy` is empty and Stryker runs the whole suite for each one, with `concurrency: 8` on a 4-core host. A test that kills the mutant does exist (it is Killed in run 2 and in the implementer's run). So no survivor is hidden, and a timeout is a report, not a blocking line. CI may still show one of these as a timeout. | None required. If CI timeouts recur, consider fewer Stryker workers or a higher `timeoutMS` for this shard. |

## Test quality

- Red evidence: `red-fix-1.log` and `check-red-fix-1.log` show exactly 5 failures at `1fa843d`. All are assertion
  mismatches where exit 1 was expected to be exit 2, none a load or setup error:
  - `gates/test/storybook-build.test.ts:234` (×2, both fixtures), `:243` and `:379`;
  - `gates/test/integration/storybook-build.test.ts:93`.

  T075's and T076's cases pass at the red commit, as the tasks say. Their red evidence is the mutation run: each of
  the targeted mutants is Killed.
- No test was weakened after red: `git diff 1fa843d..HEAD -- gates/test` is empty.
- Replaced test: the `exitCode: null` half of "places a failed build that names no file … with its exit code or the
  signal" was replaced. Its replacement, "could not run when a signal ended the build, whether or not its output names
  a file" (`classifyBuild`, exit 2, exact cause, with and without a located file), is stricter. The reason (landing
  L1-03, FR-001, operator choice (a)) is given in the red commit body and in `round-2-fixes.md`. The exit-code half
  stays.
- The assertions are exact (`toEqual` on `formatFinding` strings or on `{exit, lines}`), with no conditionals and no
  skip or only. I checked by hand that each T076 input separates its mutant:
  - `…token |`: the no-`^` mutant strips the trailing mark;
  - `x is not …`: the one-space mutant strips `x `;
  - `Unable to index ./stories/a.stories.ts: NoMetaError`: the no-`$` mutant matches;
  - `see [docs] for details`: the no-`^` message mutant starts a message.
- The O2-02 classify case adds a located Vite error before the `MainFileEvaluationError` output, which shows the check
  runs before any finding.
- Mutation:
  - `pnpm run gate:mutation -- --base 1fa843d` (the green change): `21 mutants on the changed lines of 1 file, none
    survived; 0 timeouts, 3 compile errors, 0 zero-mutant entries; 0 equivalent records`.
  - The landing's shard 92 command: no survivor in either run. For the timeouts, see R3-01.

## Checks run

All at HEAD `bc926c3`, one at a time:

- `pnpm test`: `unit-tests: 3099 tests passed in 138 files` (this includes `gates/test/integration/storybook-build.test.ts`).
- `pnpm run gate:typecheck`: no type error. `gate:lint`: 263 files, no finding. `gate:test-lint`: 173 files, no finding.
- `pnpm run gate:storybook-build`: exit 0, `storybook-build: built 21 stories`.
- `OCELLE_VISUAL_ENGINE=docker pnpm run gate:plants -- --shard 1`: `76 plants judged, every plant as expected`. This
  shard holds the new breaking plant `storybook-build/error-config-unreadable`. Shards 2 to 27 were not rerun (stop
  rule; the implementer ran shards 2 and 3).
- Mutation: as listed under Test quality.
- `tdd-check.json` (run at `d2d2bda`): `pass`, `problems: []`, red commits `phase` and `fix-1` both exit 1.

## Earlier findings

- **O2-01, resolved.** `gates/test/storybook-build.test.ts` "reads a Vite error's location whose line and column have
  two or more digits" (`stories/b.ts:12:34`). The mutant `/╭─\[ (\S+?):\d:\d+ \]/`, now at `:83`, was Killed in both
  of my shard 92 runs, and so was `:\d+:\d`. No source change, as the finding required.
- **O2-02, resolved.** `gates/lib/storybook-build.ts:120-124` (`failedRunProblem`) is called at `:140-141`, before
  `buildFindings`:
  - a signal gives exit 2 with `could not run: the build was ended by a signal`;
  - a cleaned line holding `MainFileEvaluationError` gives exit 2 with `could not run: storybook/.storybook/main.ts
    cannot be evaluated (<line>)`.

  This matches FR-001 (`spec.md:319-322`, "configuration unreadable" exits 2) and `contracts/gates.md:31`. Supporting
  changes:
  - the unreachable signal wording is removed from `buildFindings` (`:116`);
  - the header comment is updated;
  - the breaking plant `gates/plants/storybook-build/error-config-unreadable/` matches `contracts/plants.md:32`, and
    shard 1 shows it as expected;
  - the `gates/README.md` `storybook-build` row lists it.

  No regression: the `visual` and `axe` gates still map any non-zero build exit to their own cause
  (`gates/lib/visual-host.ts:123`). No other caller depends on the removed signal wording.
- **O2-03, resolved.** There is one exact test per timed-out landing mutant (`:77` no-`^`, `:77` one space, `:79`
  no-`$`, `:81` no-`^`). Each was Killed in my second run and in the implementer's run. In my first run under load,
  the `:77` no-`^` mutant ended as a timeout again (R3-01, note). Its killing test exists, so no survivor is hidden.
- Each behavioural fix has its red test: `red-commits` holds `fix-1 1fa843d…`, and the five O2-02 tests are red there.
