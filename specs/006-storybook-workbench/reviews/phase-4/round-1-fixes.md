# Phase 4, review round 1: fixes

Red commit `a0c2bcd` (label `fix-1`, `red-fix-1.log`: 5 of 3079 tests failed, each on an assertion against the
missing behaviour).

| ID | Resolution | Red test | Where |
|----|------------|----------|-------|
| R1-01 | fixed: the plant job now refuses an axe plant whose `delta.json` is missing, does not set `exceptions: "repository"`, or is not a valid delta (`parseDelta`'s message). It reports `invalid-plant` with the R-16 message "an axe plant root holds the repository's stories and carries their exceptions", and the plant does not run. The key on a plant of another gate is not refused. The in-memory worlds of `plants.test.ts` and `plants-job.test.ts` now give their axe plants the key, as every real axe plant has. All 24 axe plants pass in shards 20 to 27. | `gates/test/plants.test.ts` "plants: an axe plant carries the repository's exceptions (006 research.md R-16)": the first two cases are red; the third ("does not refuse … on a plant of another gate") passed already, as expected | `gates/bin/plants.ts` (`axeExceptionsProblem`, `loadPlant`) |
| R1-02 | fixed: `axe()` takes injected `AxeTools` (`resolve`, `load`, `build`; by default the gate repository's `require` and `buildStories`). `axeCore(tools)` is exported and unit-tested. The three "process boundary, no test" records are gone, and so is the record on `const core = axeCore(tools)`. Mutation on the changed lines (`gate:mutation -- --base 8a4cf74`): 30 mutants, none survived. | `gates/test/axe-gate.test.ts` "axe: axe-core not found": exit 2 `axe: could not run: axe-core not found; run pnpm install` before any build, when the script does not resolve and when axe-core does not load; the build of the root with its env when axe-core is found. All three are red. The `axeCore` cases were added with the fix, after the function was exported. | `gates/bin/axe.ts` |
| R1-03 | deferred: note; T071 (phase 5) rewrites the deferred-gates table | none (docs) | `gates/README.md` |
| R1-04 | deferred: note; no change asked | none | `storybook/a11y-exceptions.json` |
| R1-05 | deferred: note; recorded for the run summary | none | git history |
| R1-06 | deferred: note; no change asked | none | `gates/bin/axe.ts` |

## Checks

- `pnpm test` (OCELLE_CHROMIUM_PATH set): exit 0, 3081 tests passed in 137 files.
- `gate:typecheck`, `gate:lint`, `gate:test-lint`: exit 0, no finding.
- `gate:mutation -- --base 8a4cf74`: exit 0, 30 mutants on the changed lines of 2 files, none survived, 13 compile
  errors, 4 equivalent records.
- `gate:axe`: exit 0, 42 story-theme runs, 0 serious or critical, 10 notes (10 excepted).
- `gate:plants -- --shard k`, k = 20 to 27 (the axe plants): every shard exit 0, every plant as expected.
