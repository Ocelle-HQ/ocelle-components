---
phase: 4
round: 2
verdict: approved
base: 5f497947ecefee96afcbba751ef3e61ae6b8e518
head: 80f6c81d967f2ff758fff2079a480491ebe0570c
tdd_check: pass
---

# Phase 4 review, round 2

Change under review: `git diff 5f49794..80f6c81`. The fix round is red `a0c2bcd` (label `fix-1`) and green `80f6c81`
on top of round 1's head `af8d538` and the round-1 review commit `8a4cf74`. The fix round touches
`gates/bin/axe.ts`, `gates/bin/plants.ts`, `gates/test/axe-gate.test.ts` (new), `gates/test/plants.test.ts`,
`gates/test/plants-job.test.ts`, and this directory's `red-commits`, `red-fix-1.log` and `round-1-fixes.md`. The
only uncommitted changes are the rerun tdd-check outputs in this directory.

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R2-01 | note | gates/bin/plants.ts:108-110 | The R-16 refusal is reported at `<plant>/plant.json`, though the fault is in (or is the absence of) `delta.json`. contracts/plants.md:154 only says such a plant "is invalid" and names no location. The test pins the location, so it is a choice, not an accident. | None. |
| R2-02 | note | gates/lib/a11y-exceptions.ts:20 | The mutation run now also reports one `timeout` (StringLiteral) here, besides the `axe-rules.ts:17, 20` literals of round 1. Timeouts are reports, not findings. | None. |

Round 1 notes R1-03 to R1-06 stand as recorded: R1-03 is still owed by T071 in phase 5.

## Test quality

- **Red evidence (fix-1).** `red-fix-1.log` and the rerun `check-red-fix-1.log` show exactly 5 of 3079 tests failing at
  `a0c2bcd`, each on an assertion:
  - `axe-gate.test.ts:59, :66, :72`: at red, `axe()` ignored the injected tools, so the gate used the real axe-core
    and build and returned a different exit-2 cause. That is the missing injection, not a setup error. The `AxeTools`
    import is type-only and is erased at run time.
  - `plants.test.ts:445, :464`: the job accepted the axe plants that have no delta or a bad one (code 0, or one
    line in place of five).
  - The third R-16 case ("does not refuse … on a plant of another gate") passed at red. That is correct: it guards
    against over-reach and is not the missing behaviour.
- **No weakening after red.** `git diff a0c2bcd..80f6c81 -- gates/test` does two things:
  - It adds an `axeCore` describe block (two strict `toEqual` cases), written once the function was exported.
  - It gives the three axe plants of `plants-job.test.ts`'s in-memory world a `delta.json` with
    `exceptions: "repository"`. Without it, the new rule would refuse them. This is a fixture brought in line with
    every real axe plant, and it changes no assertion of that file.
  No red test was edited, skipped or loosened.
- **Assertions.** Every new test uses exact `toEqual` on the whole result: the exit and cause, what was resolved,
  loaded and built, the job's full stdout, and which plants ran. None is conditional, skipped, snapshot-only or
  mock-only. The tools record what the unit asked for, which is the unit's observable output. The "before any build"
  part is asserted with `builds: []`, and the found case asserts the build got the root and its env.
- **Scenario coverage.** The two gaps of round 1 are closed: the exit-2 cause "axe-core not found" (R1-02) and the R-16
  plant rule (R1-01). Round 1's coverage of US3 scenarios 1 to 9 and the pointer states is unchanged.
- **Scaffold.** Unchanged since round 1 (`91e1395`, signatures only). `tdd-check.json` on `80f6c81` has
  `final_tests_on_scaffold_exit: 1`, `final_tests_on_base_exit: 2`, `head_exit: 0`, red `phase` exit 1, red `fix-1`
  exit 1, `status: pass`, `problems: []`.
- **Mutation.** `pnpm run gate:mutation -- --base 5f49794` (OCELLE_CHROMIUM_PATH unset): exit 0, `551 mutants on the
  changed lines of 10 files, none survived; 16 timeouts, 143 compile errors, 0 zero-mutant entries; 73 equivalent
  records` (5 min 32 s). I read the records:
  - 72 are `all: process boundary, covered by …` records, each naming the integration test or the axe plant that
    covers it.
  - One new record sits on `nodeTools()` (`gates/bin/axe.ts:102-106`). It builds the real `require` and
    `buildStories`, and names the integration test that runs the gate end to end. I accept it.
  - 1 is `OptionalChaining: equivalent` at `axe-verdict.ts:129`, accepted in round 1 for the reason it gives.
  - The three `process boundary, no test` records of round 1 are gone. `grep "no test"` on the run's output finds
    nothing.
  - The changed lines of `gates/bin/plants.ts` (`axeExceptionsProblem`, the `gate === "axe"` branch of `loadPlant`)
    and of `axeCore` produce mutants that are all killed.

## Checks run

All from HEAD `80f6c81`, one at a time, in this sandbox (docker 29.9.2 running, no podman):

| Check | Result |
|---|---|
| `pnpm test` (OCELLE_CHROMIUM_PATH set) | exit 0, `unit-tests: 3081 tests passed in 137 files` |
| `gate:typecheck` | exit 0 |
| `gate:lint` | exit 0, 262 files, no finding |
| `gate:test-lint` | exit 0, 172 files, no finding |
| `gate:style-lint`, `gate:config-copies`, `gate:prefix`, `gate:csp`, `gate:pins` | exit 0 each |
| `gate:mutation -- --base 5f49794` (OCELLE_CHROMIUM_PATH unset) | exit 0, see Test quality |
| `gate:axe` (OCELLE_CHROMIUM_PATH set) | exit 0, `axe: 42 story-theme runs, 0 serious or critical; 10 notes (0 incomplete, 10 excepted)` |
| `gate:plants -- --plan` (OCELLE_VISUAL_ENGINE=auto) | `[1,…,27]`, as in round 1 |
| `gate:plants -- --shard k`, k = 1 … 27 | every shard exit 0, "every plant as expected". Shards 1–3: 75–96 s each. Visual shards 4–19: 6–212 s each. Axe shards 20–27: 43–110 s each. |
| `gate:plants -- --verdict storybook/.visual/plant-shards` | exit 0, `plants: 304 plants of 17 gates and the registry judged, every plant as expected` |
| `gate:visual` (run after the plant verdict) | exit 0, `visual: 42 captures match their baselines (docker only: no cross-engine comparison)` |

I checked all 24 plants under `gates/plants/axe/` directly: each one's `delta.json` sets `exceptions: "repository"`.

Not run here: the CI form `gate:visual --engine both`, because this sandbox has no podman. CI runs it.

Tasks: T047 to T060 are ticked and their work is present, now including the R-16 rule and the tested exit-2 branch.
The fix round changed nothing outside the phase's own files. Constitution: III, IV and VIII are met, and VIII is no
longer qualified by R1-02. The plan is followed: decision 14's rule is now enforced where the plant job validates
plants (`loadPlant`), and the axe module boundaries are unchanged.

## Earlier findings

- **R1-01 (blocking): resolved.**
  - `gates/bin/plants.ts:83-97` adds `axeExceptionsProblem`, and `:108-111` refuses an axe plant whose `delta.json`
    is missing, lacks `exceptions: "repository"`, or fails `parseDelta`. The refusal is `invalid-plant`, with the
    R-16 message or the parse message, before the plant's files are read or its gate is run.
  - Red tests: `gates/test/plants.test.ts:445, :464`, both failing at `a0c2bcd`. The guard case at `:479` shows that
    the key on visual, storybook-build and lint plants is not refused.
  - The full plant run (304 plants, verdict exit 0) confirms that every real axe plant still passes.
- **R1-02 (blocking): resolved.**
  - `gates/bin/axe.ts:76-99` adds the injectable `AxeTools` (`resolve`, `load`, `build`) and the exported
    `axeCore(tools)`. `axe()` takes `tools` as an optional argument whose default is the real `nodeTools()`.
  - Red tests: `gates/test/axe-gate.test.ts:59, :66, :72`, all three failing at `a0c2bcd`. They cover two cases. In
    the first, the script does not resolve or axe-core does not load: the gate exits 2 with
    `axe: could not run: axe-core not found; run pnpm install`, and no build has started. In the second, axe-core is
    found and the root is built with its env.
  - The three `process boundary, no test` records are removed. The mutation run shows none surviving in the changed
    code.
