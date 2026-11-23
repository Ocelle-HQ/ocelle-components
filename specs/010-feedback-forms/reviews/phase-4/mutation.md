# Phase 4 mutation runs (T057)

All runs in this container (4 CPUs, Chromium 153 build 1243, `OCELLE_CHROMIUM_PATH`), one job at a time, timed from
the command's start to its exit. The phase base is `835df81` (the operator's base for the whole phase diff; `base.sha`
holds `94af87b`, the commit that records it, whose source is the same). The changed source is
`packages/elements/src/ocelle-form-select.ts`, `src/icon-svg.ts` (new), `src/ocelle-icon.ts`, `src/form-control.ts`
and `src/index.ts`, all under `stryker.elements.config.json`. `scripts/manifest.ts` and the gate source have no
changed line in this phase.

## Whole-diff runs, as CI's gate reads the diff

`pnpm run gate:mutation -- --base 835df81`:

| Run | At | Wall-clock | Result |
|---|---|---|---|
| 1 | `5908fa7` | 525 s (8:45) | exit 1: 2 findings in 5 changed files (154 mutants on the changed lines; 0 timeouts, 32 compile errors, 3 zero-mutant entries) |
| 2 | `e0b1c77` | 520 s (8:40) | **exit 0**: 154 mutants on the changed lines of 5 files, none survived; 0 timeouts, 32 compile errors, 3 zero-mutant entries; 0 equivalent records |

The zero-mutant entries are `src/form-control.ts` (its changed lines are a type import, the `styles` type and the
`control()` return type), `src/index.ts` (export lines and comments) and `src/ocelle-icon.ts` (its changed lines are
the import of `icon-svg.ts` and the lines removed from it).

### Run 1's findings and what was done (`e0b1c77`)

Each new assertion was checked to fail with the mutant applied by hand, and to pass without it:

| Line | Mutant | Done |
|---|---|---|
| `ocelle-form-select.ts:103` | `optionsChanged()`'s `records.some(…)` to `records.every(…)` | no test gave the observer a host attribute record and an option record in one batch. Rule test: an option's text changed in the same task as the host's `label` attribute is mirrored |
| `ocelle-form-select.ts:196` | `aria-disabled` `"true"` to `""` | Chromium's tree does not tell a select's `aria-disabled=""` from `"true"`, so US2-23's tree reads could not see it. US2-23 now also reads `aria-disabled` on the inner control of `d` and `dt` (null and `"true"`), beside `required` and `aria-required`, for both kinds |

### Kills checked for an assertion (phase 2 R1-05, as phase 3 did)

Stryker stops each mutant's run at its first failing test (`bail: 1`). Of run 2's 121 kills, 113 came first from
a rule test of `test/form-select-rules.test.ts`, a US3 cell of `test/form-select.test.ts` (US3-1 to US3-8 and the
US3-7 cells that read no announcement), a US3 plant row of `test/plants.test.ts` (whose bodies are US3-4, US3-5 and
US3-8 and read no announcement), `test/icon-set.test.ts` (the `icon-svg.ts` mutants) or `test/exports.test.ts`. The
other 8 came first from a cell that depends on the in-process timing: a phase 1 to 3 plant row ("minimum hold",
"insertion announcement"), US2-10 or US2-20 template. Each of the 8 was applied by hand (its location and replacement
from run 2's report) and run against `test/form-select-rules.test.ts`, then against the cells of
`test/form-select.test.ts` that read no announcement (`-t` excluding US2-10, US2-18, US2-20, US2-22, FR-027, error
while focused and hidden ancestor) with `exports.test.ts` and `entry-form-select.test.ts`, which pass unmutated (39 of
39). Every one failed there (log: `mutation-recheck.log`):

| Line | Mutant | Rules | Scenarios without timing |
|---|---|---|---|
| `:30` | `mirrored()` to `() => undefined` | 7 of 10 fail | 17 fail |
| `:30` | `mirrored()`'s test to `true` | 7 of 10 fail | 17 fail |
| `:46` | the static `styles` to `[]` | pass | 10 fail |
| `:48` | the `css` of the select's styles to empty | pass | 2 fail |
| `:189` | the select's `classMap` to `{}` | pass | 2 fail |
| `:189` | `invalid:` to `false` | pass | 2 fail |
| `:189` | `invalid:`'s `!==` to `===` | pass | 2 fail |
| `:194` | `aria-invalid` `"true"` to `""` | pass | 1 fails |

## Compile errors, run-time errors and timeouts

The 32 compile errors on the changed lines are reported, not failing (007): 20 in `src/ocelle-form-select.ts` (for
example a method returning a value emptied, or `?.` dropped) and 12 in `src/icon-svg.ts`.

One mutant is a run-time error, not a survivor: `:102`, `if (!this.hasUpdated) return` to `if (false)`. The option
observer then mirrors before the first render, when the shadow root has no select, and its callback throws outside any
test (Stryker's "An error occurred outside of a test run").

Run 2 reports no timeout. The timed shards below report three, each a kill in run 2, each applied by hand:

- `:151`, `syncFormValue()`'s `this.hasUpdated && …` to `||` (shard 7). The base constructor's `syncFormValue()` then
  reads the select before the first render and throws, so no element is created; 9 of the 10 rule tests fail within
  seconds, and the scenarios wait on elements that never render.
- `:186`, the box's `classMap` to `{}` and `field:` to `false` (shard 8). Without the `field` class the indicator is
  positioned against the host, not the box. The scenarios without timing fail: 3 and 1 of them, in 39 s each.

## Shard timing (the known gap, plan decision 11)

`pnpm run gate:mutation -- --base 835df81 --plan` at `e0b1c77`, exit 0, about 1 s: "9 shards, 8 cuts within files".
Each shard was run alone as `pnpm run gate:mutation -- --base 835df81 --files <entries>` at `e0b1c77`, one at a time:

| Shard | Entries | Wall-clock | Result |
|---|---|---|---|
| 1 | `src/form-control.ts`, `src/icon-svg.ts:1-30` | 268 s (4:28) | exit 0: 17 mutants, none survived; 11 compile errors |
| 2 | `src/icon-svg.ts:31-40`, `src/index.ts`, `src/ocelle-form-select.ts:1-30` | 344 s (5:44) | exit 0: 14 mutants, none survived; 4 compile errors |
| 3 | `src/ocelle-form-select.ts:31-60` | 225 s (3:45) | exit 0: 0 mutants on the changed lines (one zero-mutant entry) |
| 4 | `src/ocelle-form-select.ts:61-90` | 247 s (4:07) | exit 0: 4 mutants, none survived; 1 compile error |
| 5 | `src/ocelle-form-select.ts:91-120` | 324 s (5:24) | exit 0: 48 mutants, none survived; 5 compile errors |
| 6 | `src/ocelle-form-select.ts:121-150` | 283 s (4:43) | exit 0: 22 mutants, none survived; 4 compile errors |
| 7 | `src/ocelle-form-select.ts:151-180` | 284 s (4:44) | exit 0: 25 mutants, none survived; 1 timeout (above), 4 compile errors |
| 8 | `src/ocelle-form-select.ts:181-210` | 379 s (6:19) | exit 0: 18 mutants, none survived; 2 timeouts (above), 2 compile errors |
| 9 | `src/ocelle-form-select.ts:211-213`, `src/ocelle-icon.ts` | 234 s (3:54) | exit 0: 0 mutants on the changed lines (two zero-mutant entries) |

Every shard is under 7:00 and far under CI's 45-minute limit for a shard holding element source (op 015), so no shard
of this phase is a stop (tasks.md, Stop-and-ask points).

Four mutants of the whole-diff run span a cut, so no shard mutates them (gates/README.md: a mutant spanning a cut is
mutated in no shard): `:46-69` the static `styles` to `[]` and `:48-68` its `css` emptied (cut 60/61, which is why
shard 3 has no mutant), `:90-93` the `value` setter's body emptied (cut 90/91) and `:150-153` `syncFormValue()`'s body emptied
(cut 150/151). The whole-diff runs mutate them, and run 2 kills all four (the first two checked by hand above). This is
the planner's known behaviour, left to op 017; `gates/lib/mutation/*` is not changed here.
