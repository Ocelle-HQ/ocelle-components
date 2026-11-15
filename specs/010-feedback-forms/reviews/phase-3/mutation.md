# Phase 3 mutation runs (T041)

All runs in this container (4 CPUs, Chromium 153 build 1243, `OCELLE_CHROMIUM_PATH`), one job at a time, timed from
the command's start to its exit. The phase base is `2004e82` (`base.sha`). `pnpm run gate:mutation -- --base 2004e82
--plan` plans 29 shards, 28 cuts within files; the changed source is `packages/elements/scripts/manifest.ts` (mutated
under `stryker.config.json`), `src/form-control.ts`, `src/ocelle-form-input.ts` and `src/index.ts` (under
`stryker.elements.config.json`). `src/live.ts` and `src/define.ts` have no changed line in this phase.

The shard timing T041 asks for, and the stop it led to, are in `stop-1.md`.

## Whole-diff runs, as CI's gate reads the diff

`pnpm run gate:mutation -- --base 2004e82`:

| Run | At | Wall-clock | Result |
|---|---|---|---|
| 1 | `90cbb71` | 1926 s (32:06) | exit 1: 14 findings in 4 changed files (497 mutants on the changed lines; 2 timeouts, 110 compile errors, 1 zero-mutant entry) |
| 2 | `a999b72` | 1527 s (25:27) | exit 1: 4 findings in 4 changed files (496 mutants on the changed lines; 0 timeouts, 110 compile errors, 1 zero-mutant entry) |
| 3 | `eb8422b` | 1536 s (25:36) | exit 0: 496 mutants on the changed lines of 4 files, none survived; 0 timeouts, 110 compile errors, 1 zero-mutant entry (`src/index.ts`, export lines only); 4 equivalent records |
| 4 | `b76d4ee` | 1589 s (26:29) | **exit 0**: 496 mutants on the changed lines of 4 files, none survived; 2 timeouts, 110 compile errors, 1 zero-mutant entry (`src/index.ts`); 5 equivalent records |

(`eb8422b`'s commit body names a wrong commit for run 2; run 2 ran at `a999b72`.)

### Run 1's findings and what was done (`a9ec9da`)

Each survivor was read in Stryker's JSON report (the mutant and the tests that covered it), and each fix's test was
checked to fail on the mutant applied by hand:

| Line | Mutant | Done |
|---|---|---|
| `ocelle-form-input.ts:173-174` | the `type` setter's attribute read and its two conditions | rule tests: the attribute read at once after the property is set; `text` set on a host whose type is unknown |
| `ocelle-form-input.ts:221` | the default button's `form === form` filter removed or `true` | rule test: another form's button is not the input's |
| `ocelle-form-input.ts:188` | `?? ""` (no coverage) | rule test: the value attribute removed, and a reset after an edit without one, give `""` |
| `form-control.ts:538-540` | the parts' `?hidden` to `false`, and `""` to `"Stryker was here!"` | rule test: with no label, description or error, the parts are hidden and the field is the host's box, no gap |
| `form-control.ts:512` | the reveal's `shown()` removed | rule test: first loaded hidden while loading, revealed after the load, written `W` after the reveal |
| `ocelle-form-input.ts:22` | a string of `blockingTypes` to `""` (**timeout**) | a static (module-level) mutant runs the whole suite, which timed out; the list is now built in `blocks()`, so its mutants are covered per test, and each is killed by the rule test of the blocking types |
| `form-control.ts:431` | `defaultChanged()`'s `requestUpdate()` removed | removed as redundant: the attribute change that calls it has requested the update |
| `form-control.ts:478` | `super.disconnectedCallback()` removed | recorded as equivalent (LitElement's tells reactive controllers, which the control has none of, and disconnects async directives, which it uses none of) |
| `form-control.ts:472` | `connectedCallback()` emptied (**timeout**) | reviewed: a kill, not a survivor. Without `super.connectedCallback()` the element never renders, and every scenario waits on its `updateComplete`; no mutant was left to time out in runs 2 to 4 |

### Run 2's findings and what was done (`a999b72`, `eb8422b`)

Shard 2 of the timed shards (`stop-1.md`) found one more: `form-control.ts:20`, a name of `hostAria` to `""`. The rule
test set the three host ARIA attributes in one task, so the update one observed attribute requested re-rendered the
others; each is now set alone (`a999b72`). Run 2:

| Line | Mutant | Done |
|---|---|---|
| `form-control.ts:468` | `if (this.isConnected) return` to `if (true)` (a removed control never cancels) | the rule test read the removed control's copy after advancing `H`, which empties it anyway; it now reads it in the task after the removal |
| `ocelle-form-input.ts:173` | `value !== attribute` to `true` | rule test: the page's `type` attribute is written once, one attribute record per change |
| `form-control.ts:217` | `lastCommitted = ""` to `"Stryker was here!"` | rule test: without a value attribute, the field's change before any edit dispatches no change event |
| `ocelle-form-input.ts:178` | `name === "value"` to `true` | recorded as equivalent: while the value is not dirty it is the default value, so `defaultChanged()` for another attribute sets what the value and the last committed value already hold |

### Kills checked for an assertion (phase 2 R1-05)

Stryker stops each mutant's run at its first failing test (`bail: 1`), and in run 3, 255 of the 351 kills came first
from an in-process timing cell: a row of `test/plants.test.ts` (often a notice row, "minimum hold", that a form-control
mutant cannot touch), or an announcement cell of `test/form-input.test.ts` (US2-10, US2-18, US2-20, US2-22, FR-027, the
error while focused or in a hidden ancestor). Under Stryker's load those cells can fail by timing, which kills a mutant
without an assertion on it, so each of the 255 was applied by hand (its location and replacement from run 3's report)
and run against the tests that do not depend on the in-process timing: `test/form-input-rules.test.ts` (fake clock, or
plain DOM), then the cells of `test/form-input.test.ts` that read no announcement, with the entry and exports tests.
Log: `mutation-recheck.log`.

- 246 failed there (`KILLED rules` or `KILLED scenarios` in the log).
- 9 did not, and are now killed by rule tests (`b76d4ee`), each checked by hand against its mutant: the constructor's
  `syncFormValue()` (`form-control.ts:243`; a named input with no value is in its form's data with `""`); the move flag
  (`startMove()`, its call, `moving = true`, `isMove()` in `onConnect()`; moved after its error was written, the held
  copy stays past the minimum hold); `name === "error"` to `true` (another attribute changed during the wait does not
  restart it); `onError()`'s `trigger(false)` to `true` (an error back to the text last written within the wait writes
  nothing); `type`'s `noAccessor` to `false` (set by the property to an unknown value from a known one, the attribute
  keeps it as written); and `super.updated()` (`form-control.ts:530`), recorded as equivalent (LitElement's `updated()`
  does nothing).

The other 96 kills of run 3 came first from `test/form-input-rules.test.ts` (77), a cell of `test/form-input.test.ts`
that reads no announcement (18) or `test/exports.test.ts` (1).

## Equivalent records (5, run 4)

`ocelle-form-input.ts`: the `type` property's options `{}` (ObjectLiteral) and `reflect: true` (BooleanLiteral), as on
the notice's `tone`; `name === "value"` (ConditionalExpression). `form-control.ts`: `super.disconnectedCallback()` and
`super.updated(changed)` (CallExpression). Each reason is in the source beside its line. Run 3 counted four;
`b76d4ee` adds `super.updated()`.

## Compile errors and timeouts

The 110 compile errors on the changed lines are reported, not failing (007): 33 in `scripts/manifest.ts` (for example
a mutant that leaves a value of type `never` or drops a type guard) and 77 in the element source (for example a
mutant that empties a method returning a value).

Timeouts, each reviewed (research R-09: every Timeout in `src/form-control.ts` one by one). Runs 2 and 3 report none.
Run 4 reports two, both in `connectedCallback()` (`form-control.ts:472`, the body emptied, and `:473`,
`super.connectedCallback()` removed): run 1 reported the first as well. Without it the element never renders, and the
first covering test Stryker ran waits on its `updateComplete`. Applied by hand, each fails 40 of the 44 tests of
`test/form-input-rules.test.ts` within 6 s, on their reads of the shadow root, so neither is a survivor.

## T041a: element source sharded by mutant count (design change 1)

Operator decisions `decision-stop-1.md` (option (b), smaller shards) and `decision-design-change-1.md` (the rule of
plan decision 11 and the dependency `@stryker-mutator/instrumenter` 10.1.1, pinned exactly).

### Red (`971c431`, `red-commits` `design-1`)

`971c431` changes only `gates/test/mutation-shards.test.ts` (16 new cases) and `gates/test/mutation-fakes.ts` (the
double of the new tool, `MutationTools["place"]`, beside the file's other doubles; `fakeRepo` gives one that places
none). `red.sh` accepts only the labels `phase` and `fix-<n>`, so the run was made with red.sh's own steps and
helpers (`common.sh`: `story_non_test_changes`, `story_run_tests_at` in a detached worktree after
`pnpm run setup:offline`), the script itself unchanged: `{"label":"design-1","sha":"971c431…","tests_only":true,
"red":true,"recorded":true,"exit_code":1}`. `red-design-1.log`: "16 of 3787 tests failed", each of the 16 new cases
on an `AssertionError` against the 30-line planner (the plan it gives, exit 0 where 2 is expected, or the pin
`undefined` against core's `10.1.1`); no setup, import or type error, and every existing case passes.

### Plant reading

No plant is required. 006 `contracts/plants.md` (with 001's) gives every gate fail, pass and error plants, judged on
the gate's findings and exit code in a whole-diff run of a plant repository. The change is in `--plan` only: it gives
no verdict, adds no finding and no rule, and no plant under `gates/plants/mutation/` runs `--plan` (the 17 plants pass
no `--plan` or `--files`). The whole-diff and `--files` runs are unchanged, so no plant's expectation moves and no plant
tree under `gates/plants/` changes. A review that finds a rule asking for one adds it.

### Re-plan (`0d99aa5`)

`pnpm run gate:mutation -- --base 2004e82 --plan`, exit 0, about 1 s. Its stderr line:

```text
mutation: plan: 63 shards, 60 cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)
```

Its stdout (one line, wrapped here at the shards):

```text
[{"files":"gates/bin/mutation.ts:22-254","lines":30},
{"files":"gates/bin/mutation.ts:255-294,gates/lib/mutation/shards.ts:18-80","lines":56},
{"files":"gates/lib/mutation/shards.ts:81-140","lines":30},
{"files":"gates/lib/mutation/shards.ts:141-174,packages/elements/scripts/manifest.ts:7-135","lines":54},
{"files":"packages/elements/scripts/manifest.ts:136-166","lines":27},
{"files":"packages/elements/src/form-control.ts:1-25","lines":25},
{"files":"packages/elements/src/form-control.ts:26-37","lines":12},
{"files":"packages/elements/src/form-control.ts:38-42","lines":5},
{"files":"packages/elements/src/form-control.ts:43-46","lines":4},
{"files":"packages/elements/src/form-control.ts:47-56","lines":10},
{"files":"packages/elements/src/form-control.ts:57-235","lines":179},
{"files":"packages/elements/src/form-control.ts:236-243","lines":8},
{"files":"packages/elements/src/form-control.ts:244-276","lines":33},
{"files":"packages/elements/src/form-control.ts:277-328","lines":52},
{"files":"packages/elements/src/form-control.ts:329-347","lines":19},
{"files":"packages/elements/src/form-control.ts:348-350","lines":3},
{"files":"packages/elements/src/form-control.ts:351-362","lines":12},
{"files":"packages/elements/src/form-control.ts:363-367","lines":5},
{"files":"packages/elements/src/form-control.ts:368-369","lines":2},
{"files":"packages/elements/src/form-control.ts:370-377","lines":8},
{"files":"packages/elements/src/form-control.ts:378-387","lines":10},
{"files":"packages/elements/src/form-control.ts:388-399","lines":12},
{"files":"packages/elements/src/form-control.ts:400-416","lines":17},
{"files":"packages/elements/src/form-control.ts:417-439","lines":23},
{"files":"packages/elements/src/form-control.ts:440-450","lines":11},
{"files":"packages/elements/src/form-control.ts:451-465","lines":15},
{"files":"packages/elements/src/form-control.ts:466-476","lines":11},
{"files":"packages/elements/src/form-control.ts:477-485","lines":9},
{"files":"packages/elements/src/form-control.ts:486-489","lines":4},
{"files":"packages/elements/src/form-control.ts:490-490","lines":1},
{"files":"packages/elements/src/form-control.ts:491-494","lines":4},
{"files":"packages/elements/src/form-control.ts:495-503","lines":9},
{"files":"packages/elements/src/form-control.ts:504-507","lines":4},
{"files":"packages/elements/src/form-control.ts:508-517","lines":10},
{"files":"packages/elements/src/form-control.ts:518-519","lines":2},
{"files":"packages/elements/src/form-control.ts:520-528","lines":9},
{"files":"packages/elements/src/form-control.ts:529-535","lines":7},
{"files":"packages/elements/src/form-control.ts:536-539","lines":4},
{"files":"packages/elements/src/form-control.ts:540-541","lines":2},
{"files":"packages/elements/src/form-control.ts:542-546,packages/elements/src/index.ts","lines":9},
{"files":"packages/elements/src/ocelle-form-input.ts:1-26","lines":26},
{"files":"packages/elements/src/ocelle-form-input.ts:27-28","lines":2},
{"files":"packages/elements/src/ocelle-form-input.ts:29-29","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:30-32","lines":3},
{"files":"packages/elements/src/ocelle-form-input.ts:33-35","lines":3},
{"files":"packages/elements/src/ocelle-form-input.ts:36-36","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:37-53","lines":17},
{"files":"packages/elements/src/ocelle-form-input.ts:54-65","lines":12},
{"files":"packages/elements/src/ocelle-form-input.ts:66-69","lines":4},
{"files":"packages/elements/src/ocelle-form-input.ts:70-75","lines":6},
{"files":"packages/elements/src/ocelle-form-input.ts:76-162","lines":87},
{"files":"packages/elements/src/ocelle-form-input.ts:163-167","lines":5},
{"files":"packages/elements/src/ocelle-form-input.ts:168-172","lines":5},
{"files":"packages/elements/src/ocelle-form-input.ts:173-173","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:174-190","lines":17},
{"files":"packages/elements/src/ocelle-form-input.ts:191-205","lines":15},
{"files":"packages/elements/src/ocelle-form-input.ts:206-216","lines":11},
{"files":"packages/elements/src/ocelle-form-input.ts:217-222","lines":6},
{"files":"packages/elements/src/ocelle-form-input.ts:223-227","lines":5},
{"files":"packages/elements/src/ocelle-form-input.ts:228-231","lines":4},
{"files":"packages/elements/src/ocelle-form-input.ts:232-232","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:233-258","lines":26},
{"files":"packages/elements/src/ocelle-form-input.ts:259-275","lines":17}]
```

Shards 1 to 5 are gate source and `scripts/manifest.ts` under the 30-line rule (shards 1 to 4 hold the lines this change
adds to `gates/bin/mutation.ts` and `gates/lib/mutation/shards.ts`). Shards 6 to 63 are element source:
`src/form-control.ts` in 35 entries (shards 6 to 40, the last beside `src/index.ts`) and `src/ocelle-form-input.ts`
in 23 (shards 41 to 63), as the design counted. Each element shard's mutants, from run 4's whole-diff report
(`reports/mutation/mutation-elements.json` of `b76d4ee`; the element source is unchanged since), counted as the planner
counts them (ignored ones left out, a mutant inside the shard's entry lines), with the estimate of `stop-1.md`, 217 s
and 14 s a valid (not compile-error) mutant. "Static" counts the valid mutants the report marks `static` (code run
when the module loads, such as class fields), which Stryker runs against every test rather than the tests that cover
them:

| Shard | Entries (under `packages/elements/`) | Mutants | Valid | Of them static | Compile errors | Estimate |
|---|---|---|---|---|---|---|
| 6 | `src/form-control.ts:1-25` | 7 | 5 | 5 | 2 | 287 s |
| 7 | `src/form-control.ts:26-37` | 10 | 6 | 0 | 4 | 301 s |
| 8 | `src/form-control.ts:38-42` | 3 | 2 | 2 | 1 | 245 s |
| 9 | `src/form-control.ts:43-46` | 9 | 9 | 9 | 0 | 343 s |
| 10 | `src/form-control.ts:47-56` | 10 | 9 | 9 | 1 | 343 s |
| 11 | `src/form-control.ts:57-235` | 10 | 10 | 1 | 0 | 357 s |
| 12 | `src/form-control.ts:236-243` | 8 | 7 | 0 | 1 | 315 s |
| 13 | `src/form-control.ts:244-276` | 10 | 7 | 0 | 3 | 315 s |
| 14 | `src/form-control.ts:277-328` | 10 | 2 | 0 | 8 | 245 s |
| 15 | `src/form-control.ts:329-347` | 5 | 4 | 0 | 1 | 273 s |
| 16 | `src/form-control.ts:348-350` | 7 | 6 | 0 | 1 | 301 s |
| 17 | `src/form-control.ts:351-362` | 6 | 5 | 0 | 1 | 287 s |
| 18 | `src/form-control.ts:363-367` | 5 | 5 | 0 | 0 | 287 s |
| 19 | `src/form-control.ts:368-369` | 10 | 10 | 0 | 0 | 357 s |
| 20 | `src/form-control.ts:370-377` | 6 | 5 | 0 | 1 | 287 s |
| 21 | `src/form-control.ts:378-387` | 10 | 8 | 0 | 2 | 329 s |
| 22 | `src/form-control.ts:388-399` | 9 | 8 | 0 | 1 | 329 s |
| 23 | `src/form-control.ts:400-416` | 8 | 8 | 0 | 0 | 329 s |
| 24 | `src/form-control.ts:417-439` | 10 | 10 | 0 | 0 | 357 s |
| 25 | `src/form-control.ts:440-450` | 4 | 4 | 0 | 0 | 273 s |
| 26 | `src/form-control.ts:451-465` | 10 | 7 | 0 | 3 | 315 s |
| 27 | `src/form-control.ts:466-476` | 8 | 8 | 0 | 0 | 329 s |
| 28 | `src/form-control.ts:477-485` | 4 | 4 | 0 | 0 | 273 s |
| 29 | `src/form-control.ts:486-489` | 5 | 5 | 0 | 0 | 287 s |
| 30 | `src/form-control.ts:490-490` | 7 | 6 | 0 | 1 | 301 s |
| 31 | `src/form-control.ts:491-494` | 5 | 4 | 0 | 1 | 273 s |
| 32 | `src/form-control.ts:495-503` | 10 | 10 | 0 | 0 | 357 s |
| 33 | `src/form-control.ts:504-507` | 4 | 4 | 0 | 0 | 273 s |
| 34 | `src/form-control.ts:508-517` | 7 | 7 | 0 | 0 | 315 s |
| 35 | `src/form-control.ts:518-519` | 5 | 4 | 0 | 1 | 273 s |
| 36 | `src/form-control.ts:520-528` | 9 | 9 | 0 | 0 | 343 s |
| 37 | `src/form-control.ts:529-535` | 3 | 3 | 0 | 0 | 259 s |
| 38 | `src/form-control.ts:536-539` | 0 | 0 | 0 | 0 | 217 s |
| 39 | `src/form-control.ts:540-541` | 8 | 8 | 0 | 0 | 329 s |
| 40 | `src/form-control.ts:542-546,src/index.ts` | 7 | 6 | 0 | 1 | 301 s |
| 41 | `src/ocelle-form-input.ts:1-26` | 10 | 1 | 1 | 9 | 231 s |
| 42 | `src/ocelle-form-input.ts:27-28` | 6 | 3 | 0 | 3 | 259 s |
| 43 | `src/ocelle-form-input.ts:29-29` | 11 | 8 | 0 | 3 | 329 s |
| 44 | `src/ocelle-form-input.ts:30-32` | 0 | 0 | 0 | 0 | 217 s |
| 45 | `src/ocelle-form-input.ts:33-35` | 3 | 2 | 0 | 1 | 245 s |
| 46 | `src/ocelle-form-input.ts:36-36` | 13 | 12 | 0 | 1 | 385 s |
| 47 | `src/ocelle-form-input.ts:37-53` | 3 | 2 | 0 | 1 | 245 s |
| 48 | `src/ocelle-form-input.ts:54-65` | 9 | 9 | 9 | 0 | 343 s |
| 49 | `src/ocelle-form-input.ts:66-69` | 8 | 8 | 8 | 0 | 329 s |
| 50 | `src/ocelle-form-input.ts:70-75` | 9 | 9 | 9 | 0 | 343 s |
| 51 | `src/ocelle-form-input.ts:76-162` | 4 | 3 | 2 | 1 | 259 s |
| 52 | `src/ocelle-form-input.ts:163-167` | 8 | 5 | 0 | 3 | 287 s |
| 53 | `src/ocelle-form-input.ts:168-172` | 1 | 1 | 0 | 0 | 231 s |
| 54 | `src/ocelle-form-input.ts:173-173` | 12 | 12 | 0 | 0 | 385 s |
| 55 | `src/ocelle-form-input.ts:174-190` | 10 | 6 | 0 | 4 | 301 s |
| 56 | `src/ocelle-form-input.ts:191-205` | 10 | 10 | 0 | 0 | 357 s |
| 57 | `src/ocelle-form-input.ts:206-216` | 10 | 10 | 0 | 0 | 357 s |
| 58 | `src/ocelle-form-input.ts:217-222` | 10 | 6 | 0 | 4 | 301 s |
| 59 | `src/ocelle-form-input.ts:223-227` | 8 | 2 | 0 | 6 | 245 s |
| 60 | `src/ocelle-form-input.ts:228-231` | 3 | 2 | 0 | 1 | 245 s |
| 61 | `src/ocelle-form-input.ts:232-232` | 0 | 0 | 0 | 0 | 217 s |
| 62 | `src/ocelle-form-input.ts:233-258` | 10 | 10 | 0 | 0 | 357 s |
| 63 | `src/ocelle-form-input.ts:259-275` | 5 | 5 | 1 | 0 | 287 s |

In all: 412 mutants in the element shards, 341 valid, 56 of them static, and 71 compile errors. The largest estimates
are shards 46 and 54 (385 s; the one-line entries `src/ocelle-form-input.ts:36-36`, 13 mutants with 12 valid, and
`:173-173`, 12 valid), then 357 s for shards 11, 19, 24, 32, 56, 57 and 62 (10 valid each). None is estimated over
420 s, and only 46 and 54 over 360 s. **Mutants spanning a cut:** 15, 9 of them valid (`src/form-control.ts` 8 and
5, `src/ocelle-form-input.ts` 7 and 4): as many valid ones as the 30-line plan left, as the design counted.

### Shard times (`0d99aa5`)

Every shard holding `src/form-control.ts` (6 to 40; `src/live.ts` has no changed line), and the element shards
estimated over 360 s (46 and 54), queued from the highest estimate, each run alone as
`pnpm run gate:mutation -- --base 2004e82 --files <entries>` and timed from the command's start to its exit, one job
at a time on this container (4 CPUs, Chromium 153 build 1243), the queue stopping after the first shard over 420 s:

| Shard | Entries | Estimate | Wall-clock | Result |
|---|---|---|---|---|
| 46 | `src/ocelle-form-input.ts:36-36` | 385 s | 252.8 s (4:12.8) | exit 0: 13 mutants on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 0 equivalent records |
| 54 | `src/ocelle-form-input.ts:173-173` | 385 s | 251.1 s (4:11.1) | exit 0: 12 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 11 | `src/form-control.ts:57-235` | 357 s | 252.8 s (4:12.8) | exit 0: 10 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 19 | `src/form-control.ts:368-369` | 357 s | 267.4 s (4:27.4) | exit 0: 10 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 24 | `src/form-control.ts:417-439` | 357 s | 240.5 s (4:00.5) | exit 0: 10 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 32 | `src/form-control.ts:495-503` | 357 s | 277.5 s (4:37.5) | exit 0: 10 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 9 | `src/form-control.ts:43-46` | 343 s | **439.5 s (7:19.5)** | exit 0: 9 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 9 (again) | `src/form-control.ts:43-46` | 343 s | **448.4 s (7:28.4)** | exit 0: 9 mutants on the changed lines of 1 file, none survived; 0 timeouts, 0 compile errors, 0 zero-mutant entries; 0 equivalent records |
| 10 | `src/form-control.ts:47-56` | 343 s | **435.6 s (7:15.6)** | exit 0: 10 mutants on the changed lines of 1 file, none survived; 0 timeouts, 1 compile error, 0 zero-mutant entries; 0 equivalent records |

Shard 9 was over 420 s, so the queue stopped (`stop-2.md`). Shard 9 was then run once more, to tell the result from
noise, and shard 10, the other `src/form-control.ts` shard whose valid mutants are all static; both are over 420 s.
Shards 6 to 8, 12 to 18, 20 to 23, 25 to 31 and 33 to 40 were not run. Each shard's mutants were all killed or were
compile errors; none timed out.

## T041b: probably-static element mutants weighted (design change 2)

Operator decision `decision-stop-2.md` (option (a), weight the mutants that probably run when their module loads);
the rule and the weight are `design-change-2.md`'s (plan decision 11).

### Red (`5c2ef49`, `red-commits` `design-2`)

`5c2ef49` changes only `gates/test/mutation-shards.test.ts` (15 new cases) and `gates/test/mutation-fakes.ts` (the
`place` double's comment: each placed mutant carries the flag it is given). `red.sh` accepts only the labels `phase`
and `fix-<n>` and is unchanged, so its steps were run by hand with its own helpers from `common.sh`, as for
`design-1`: `story_non_test_changes 5c2ef49^ 5c2ef49 specs/010-feedback-forms` printed nothing (tests only);
`story_run_tests_at 5c2ef49 specs/010-feedback-forms/reviews/phase-3/red-design-2.log ""` ran `pnpm test` in a
detached worktree after `pnpm run setup:offline` and exited 1 (red); the earlier `design-2` line (none) was removed
from `red-commits` and `design-2 5c2ef495c594fdb43dbf4edf154042da91b87b90` appended. The line red.sh would print:

```json
{"phase":"3","label":"design-2","sha":"5c2ef495c594fdb43dbf4edf154042da91b87b90","tests_only":true,"red":true,"recorded":true,"exit_code":1,"log":"specs/010-feedback-forms/reviews/phase-3/red-design-2.log"}
```

`red-design-2.log`: "15 of 3802 tests failed", each of them one of the 15 new cases and each an `AssertionError`
against T041a's planner: the six syntax-rule cases on "expected undefined to be type of 'function'" (each case first
asserts that `shards.ts` exports the rule, so a missing export fails on an assertion, not on a call of
`undefined`), the seven weight cases and the `--plan` case on the unweighted plan they get, and the
real-instrumenter case on one entry where two are expected. No setup, import or type error, and every existing case
passes. One existing case changed its fixture, not its assertion: "counts the mutants on the changed lines, a compile
error included and an ignored one not" (the real instrumenter) had its changed lines at top level, which the new rule
flags; they are now inside a function whose first and last lines are unchanged, so each mutant stays ordinary, and
the case passes at red with its entries one line later (`x.ts:3-12`, `x.ts:13-13`, `y.ts`).

### Plant reading

No plant is required, as in T041a. 006 `contracts/plants.md` (with 001's) gives every gate fail, pass and error
plants, judged on the gate's findings and exit code in a whole-diff run of a plant repository. The change is in
`--plan` only: it weighs the planner's counts, gives no verdict, adds no finding and no rule, and no plant under
`gates/plants/mutation/` runs `--plan`. The whole-diff and `--files` runs are unchanged, so no plant's expectation
moves and no plant tree changes. A review that finds a rule asking for one adds it.

### Re-plan (`9a91a92`)

`pnpm run gate:mutation -- --base 2004e82 --plan`, exit 0, about 1 s. Its stderr line:

```text
mutation: plan: 90 shards, 88 cuts within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)
```

Its stdout (one line, wrapped here at the shards):

```text
[{"files":"gates/bin/mutation.ts:22-178","lines":30},
{"files":"gates/bin/mutation.ts:255-284","lines":30},
{"files":"gates/bin/mutation.ts:285-301,gates/lib/mutation/shards.ts:18-72","lines":33},
{"files":"gates/lib/mutation/shards.ts:73-110","lines":30},
{"files":"gates/lib/mutation/shards.ts:111-140","lines":30},
{"files":"gates/lib/mutation/shards.ts:141-200","lines":30},
{"files":"gates/lib/mutation/shards.ts:201-234","lines":30},
{"files":"gates/lib/mutation/shards.ts:235-245,packages/elements/scripts/manifest.ts:7-135","lines":35},
{"files":"packages/elements/scripts/manifest.ts:136-166","lines":27},
{"files":"packages/elements/src/form-control.ts:1-19","lines":19},
{"files":"packages/elements/src/form-control.ts:20-20","lines":1},
{"files":"packages/elements/src/form-control.ts:21-25","lines":5},
{"files":"packages/elements/src/form-control.ts:26-37","lines":12},
{"files":"packages/elements/src/form-control.ts:38-40","lines":3},
{"files":"packages/elements/src/form-control.ts:41-42","lines":2},
{"files":"packages/elements/src/form-control.ts:43-43","lines":1},
{"files":"packages/elements/src/form-control.ts:44-44","lines":1},
{"files":"packages/elements/src/form-control.ts:45-45","lines":1},
{"files":"packages/elements/src/form-control.ts:46-46","lines":1},
{"files":"packages/elements/src/form-control.ts:47-47","lines":1},
{"files":"packages/elements/src/form-control.ts:48-48","lines":1},
{"files":"packages/elements/src/form-control.ts:49-52","lines":4},
{"files":"packages/elements/src/form-control.ts:53-54","lines":2},
{"files":"packages/elements/src/form-control.ts:55-216","lines":162},
{"files":"packages/elements/src/form-control.ts:217-220","lines":4},
{"files":"packages/elements/src/form-control.ts:221-225","lines":5},
{"files":"packages/elements/src/form-control.ts:226-226","lines":1},
{"files":"packages/elements/src/form-control.ts:227-234","lines":8},
{"files":"packages/elements/src/form-control.ts:235-243","lines":9},
{"files":"packages/elements/src/form-control.ts:244-276","lines":33},
{"files":"packages/elements/src/form-control.ts:277-328","lines":52},
{"files":"packages/elements/src/form-control.ts:329-347","lines":19},
{"files":"packages/elements/src/form-control.ts:348-350","lines":3},
{"files":"packages/elements/src/form-control.ts:351-362","lines":12},
{"files":"packages/elements/src/form-control.ts:363-367","lines":5},
{"files":"packages/elements/src/form-control.ts:368-369","lines":2},
{"files":"packages/elements/src/form-control.ts:370-377","lines":8},
{"files":"packages/elements/src/form-control.ts:378-387","lines":10},
{"files":"packages/elements/src/form-control.ts:388-399","lines":12},
{"files":"packages/elements/src/form-control.ts:400-416","lines":17},
{"files":"packages/elements/src/form-control.ts:417-439","lines":23},
{"files":"packages/elements/src/form-control.ts:440-450","lines":11},
{"files":"packages/elements/src/form-control.ts:451-465","lines":15},
{"files":"packages/elements/src/form-control.ts:466-476","lines":11},
{"files":"packages/elements/src/form-control.ts:477-485","lines":9},
{"files":"packages/elements/src/form-control.ts:486-489","lines":4},
{"files":"packages/elements/src/form-control.ts:490-490","lines":1},
{"files":"packages/elements/src/form-control.ts:491-494","lines":4},
{"files":"packages/elements/src/form-control.ts:495-503","lines":9},
{"files":"packages/elements/src/form-control.ts:504-507","lines":4},
{"files":"packages/elements/src/form-control.ts:508-517","lines":10},
{"files":"packages/elements/src/form-control.ts:518-519","lines":2},
{"files":"packages/elements/src/form-control.ts:520-528","lines":9},
{"files":"packages/elements/src/form-control.ts:529-535","lines":7},
{"files":"packages/elements/src/form-control.ts:536-539","lines":4},
{"files":"packages/elements/src/form-control.ts:540-541","lines":2},
{"files":"packages/elements/src/form-control.ts:542-546,packages/elements/src/index.ts,packages/elements/src/ocelle-form-input.ts:1-18","lines":27},
{"files":"packages/elements/src/ocelle-form-input.ts:19-19","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:20-26","lines":7},
{"files":"packages/elements/src/ocelle-form-input.ts:27-28","lines":2},
{"files":"packages/elements/src/ocelle-form-input.ts:29-29","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:30-32","lines":3},
{"files":"packages/elements/src/ocelle-form-input.ts:33-35","lines":3},
{"files":"packages/elements/src/ocelle-form-input.ts:36-36","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:37-53","lines":17},
{"files":"packages/elements/src/ocelle-form-input.ts:54-62","lines":9},
{"files":"packages/elements/src/ocelle-form-input.ts:63-63","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:64-64","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:65-65","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:66-66","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:67-67","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:68-68","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:69-69","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:70-70","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:71-71","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:72-72","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:73-75","lines":3},
{"files":"packages/elements/src/ocelle-form-input.ts:76-77","lines":2},
{"files":"packages/elements/src/ocelle-form-input.ts:78-167","lines":90},
{"files":"packages/elements/src/ocelle-form-input.ts:168-172","lines":5},
{"files":"packages/elements/src/ocelle-form-input.ts:173-173","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:174-190","lines":17},
{"files":"packages/elements/src/ocelle-form-input.ts:191-205","lines":15},
{"files":"packages/elements/src/ocelle-form-input.ts:206-216","lines":11},
{"files":"packages/elements/src/ocelle-form-input.ts:217-222","lines":6},
{"files":"packages/elements/src/ocelle-form-input.ts:223-227","lines":5},
{"files":"packages/elements/src/ocelle-form-input.ts:228-231","lines":4},
{"files":"packages/elements/src/ocelle-form-input.ts:232-232","lines":1},
{"files":"packages/elements/src/ocelle-form-input.ts:233-258","lines":26},
{"files":"packages/elements/src/ocelle-form-input.ts:259-275","lines":17}]
```

Shards 1 to 9 are gate source and `scripts/manifest.ts` under the 30-line rule (shards 1 to 8 hold the lines T041a
and T041b add to `gates/bin/mutation.ts` and `gates/lib/mutation/shards.ts`; T041a's plan had 5 such shards). Shards
10 to 90 are element source, 81 shards as the design counted: `src/form-control.ts` in 48 entries (shards 10 to 57,
the last beside `src/index.ts`) and `src/ocelle-form-input.ts` in 34 (shards 58 to 90). Each element shard's
mutants are counted from run 4's whole-diff report (`reports/mutation/mutation-elements.json` of `b76d4ee`, the copy
kept outside the repository; the element source is unchanged since, `git diff b76d4ee HEAD -- packages/elements/src`
is empty), as the planner counts them (ignored ones left out, a mutant inside the shard's entry lines). "Static" counts
the valid mutants the report marks `static`; "probably static" counts the mutants the rule flags (`probablyStatic`
applied to the report's own source text and locations, every kind); "weight" is the planner's (5 a flagged mutant, 1
another). The estimate is the design's: 217 s, plus 25 s a valid mutant the report marks static, plus 6 s another
valid mutant, compile errors 0 s:

| Shard | Entries (under `packages/elements/`) | Mutants | Valid | Of them static | Probably static (rule) | Compile errors | Weight | Estimate |
|---|---|---|---|---|---|---|---|---|
| 10 | `src/form-control.ts:1-19` | 0 | 0 | 0 | 0 | 0 | 0 | 217 s |
| 11 | `src/form-control.ts:20-20` | 6 | 5 | 5 | 6 | 1 | 30 | 342 s |
| 12 | `src/form-control.ts:21-25` | 1 | 0 | 0 | 1 | 1 | 5 | 217 s |
| 13 | `src/form-control.ts:26-37` | 10 | 6 | 0 | 0 | 4 | 10 | 253 s |
| 14 | `src/form-control.ts:38-40` | 1 | 1 | 1 | 1 | 0 | 5 | 242 s |
| 15 | `src/form-control.ts:41-42` | 2 | 1 | 1 | 2 | 1 | 10 | 242 s |
| 16 | `src/form-control.ts:43-43` | 0 | 0 | 0 | 0 | 0 | 0 | 217 s |
| 17 | `src/form-control.ts:44-44` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 18 | `src/form-control.ts:45-45` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 19 | `src/form-control.ts:46-46` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 20 | `src/form-control.ts:47-47` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 21 | `src/form-control.ts:48-48` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 22 | `src/form-control.ts:49-52` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 23 | `src/form-control.ts:53-54` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 24 | `src/form-control.ts:55-216` | 2 | 2 | 1 | 2 | 0 | 10 | 248 s |
| 25 | `src/form-control.ts:217-220` | 2 | 2 | 0 | 2 | 0 | 10 | 229 s |
| 26 | `src/form-control.ts:221-225` | 2 | 2 | 0 | 2 | 0 | 10 | 229 s |
| 27 | `src/form-control.ts:226-226` | 1 | 1 | 0 | 1 | 0 | 5 | 223 s |
| 28 | `src/form-control.ts:227-234` | 2 | 2 | 0 | 2 | 0 | 10 | 229 s |
| 29 | `src/form-control.ts:235-243` | 9 | 8 | 0 | 0 | 1 | 9 | 265 s |
| 30 | `src/form-control.ts:244-276` | 10 | 7 | 0 | 0 | 3 | 10 | 259 s |
| 31 | `src/form-control.ts:277-328` | 10 | 2 | 0 | 0 | 8 | 10 | 229 s |
| 32 | `src/form-control.ts:329-347` | 5 | 4 | 0 | 0 | 1 | 5 | 241 s |
| 33 | `src/form-control.ts:348-350` | 7 | 6 | 0 | 0 | 1 | 7 | 253 s |
| 34 | `src/form-control.ts:351-362` | 6 | 5 | 0 | 0 | 1 | 6 | 247 s |
| 35 | `src/form-control.ts:363-367` | 5 | 5 | 0 | 0 | 0 | 5 | 247 s |
| 36 | `src/form-control.ts:368-369` | 10 | 10 | 0 | 0 | 0 | 10 | 277 s |
| 37 | `src/form-control.ts:370-377` | 6 | 5 | 0 | 0 | 1 | 6 | 247 s |
| 38 | `src/form-control.ts:378-387` | 10 | 8 | 0 | 0 | 2 | 10 | 265 s |
| 39 | `src/form-control.ts:388-399` | 9 | 8 | 0 | 0 | 1 | 9 | 265 s |
| 40 | `src/form-control.ts:400-416` | 8 | 8 | 0 | 0 | 0 | 8 | 265 s |
| 41 | `src/form-control.ts:417-439` | 10 | 10 | 0 | 0 | 0 | 10 | 277 s |
| 42 | `src/form-control.ts:440-450` | 4 | 4 | 0 | 0 | 0 | 4 | 241 s |
| 43 | `src/form-control.ts:451-465` | 10 | 7 | 0 | 0 | 3 | 10 | 259 s |
| 44 | `src/form-control.ts:466-476` | 8 | 8 | 0 | 0 | 0 | 8 | 265 s |
| 45 | `src/form-control.ts:477-485` | 4 | 4 | 0 | 0 | 0 | 4 | 241 s |
| 46 | `src/form-control.ts:486-489` | 5 | 5 | 0 | 0 | 0 | 5 | 247 s |
| 47 | `src/form-control.ts:490-490` | 7 | 6 | 0 | 0 | 1 | 7 | 253 s |
| 48 | `src/form-control.ts:491-494` | 5 | 4 | 0 | 0 | 1 | 5 | 241 s |
| 49 | `src/form-control.ts:495-503` | 10 | 10 | 0 | 0 | 0 | 10 | 277 s |
| 50 | `src/form-control.ts:504-507` | 4 | 4 | 0 | 0 | 0 | 4 | 241 s |
| 51 | `src/form-control.ts:508-517` | 7 | 7 | 0 | 0 | 0 | 7 | 259 s |
| 52 | `src/form-control.ts:518-519` | 5 | 4 | 0 | 0 | 1 | 5 | 241 s |
| 53 | `src/form-control.ts:520-528` | 9 | 9 | 0 | 0 | 0 | 9 | 271 s |
| 54 | `src/form-control.ts:529-535` | 3 | 3 | 0 | 0 | 0 | 3 | 235 s |
| 55 | `src/form-control.ts:536-539` | 0 | 0 | 0 | 0 | 0 | 0 | 217 s |
| 56 | `src/form-control.ts:540-541` | 8 | 8 | 0 | 0 | 0 | 8 | 265 s |
| 57 | `src/form-control.ts:542-546`, `src/index.ts`, `src/ocelle-form-input.ts:1-18` | 7 | 6 | 0 | 0 | 1 | 7 | 253 s |
| 58 | `src/ocelle-form-input.ts:19-19` | 8 | 1 | 1 | 8 | 7 | 40 | 242 s |
| 59 | `src/ocelle-form-input.ts:20-26` | 2 | 0 | 0 | 0 | 2 | 2 | 217 s |
| 60 | `src/ocelle-form-input.ts:27-28` | 6 | 3 | 0 | 0 | 3 | 6 | 235 s |
| 61 | `src/ocelle-form-input.ts:29-29` | 11 | 8 | 0 | 0 | 3 | 11 | 265 s |
| 62 | `src/ocelle-form-input.ts:30-32` | 0 | 0 | 0 | 0 | 0 | 0 | 217 s |
| 63 | `src/ocelle-form-input.ts:33-35` | 3 | 2 | 0 | 0 | 1 | 3 | 229 s |
| 64 | `src/ocelle-form-input.ts:36-36` | 13 | 12 | 0 | 0 | 1 | 13 | 289 s |
| 65 | `src/ocelle-form-input.ts:37-53` | 3 | 2 | 0 | 0 | 1 | 3 | 229 s |
| 66 | `src/ocelle-form-input.ts:54-62` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 67 | `src/ocelle-form-input.ts:63-63` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 68 | `src/ocelle-form-input.ts:64-64` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 69 | `src/ocelle-form-input.ts:65-65` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 70 | `src/ocelle-form-input.ts:66-66` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 71 | `src/ocelle-form-input.ts:67-67` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 72 | `src/ocelle-form-input.ts:68-68` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 73 | `src/ocelle-form-input.ts:69-69` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 74 | `src/ocelle-form-input.ts:70-70` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 75 | `src/ocelle-form-input.ts:71-71` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 76 | `src/ocelle-form-input.ts:72-72` | 3 | 3 | 3 | 3 | 0 | 15 | 292 s |
| 77 | `src/ocelle-form-input.ts:73-75` | 0 | 0 | 0 | 0 | 0 | 0 | 217 s |
| 78 | `src/ocelle-form-input.ts:76-77` | 2 | 2 | 2 | 2 | 0 | 10 | 267 s |
| 79 | `src/ocelle-form-input.ts:78-167` | 9 | 6 | 0 | 0 | 3 | 9 | 253 s |
| 80 | `src/ocelle-form-input.ts:168-172` | 1 | 1 | 0 | 0 | 0 | 1 | 223 s |
| 81 | `src/ocelle-form-input.ts:173-173` | 12 | 12 | 0 | 0 | 0 | 12 | 289 s |
| 82 | `src/ocelle-form-input.ts:174-190` | 10 | 6 | 0 | 0 | 4 | 10 | 253 s |
| 83 | `src/ocelle-form-input.ts:191-205` | 10 | 10 | 0 | 0 | 0 | 10 | 277 s |
| 84 | `src/ocelle-form-input.ts:206-216` | 10 | 10 | 0 | 0 | 0 | 10 | 277 s |
| 85 | `src/ocelle-form-input.ts:217-222` | 10 | 6 | 0 | 0 | 4 | 10 | 253 s |
| 86 | `src/ocelle-form-input.ts:223-227` | 8 | 2 | 0 | 0 | 6 | 8 | 229 s |
| 87 | `src/ocelle-form-input.ts:228-231` | 3 | 2 | 0 | 0 | 1 | 3 | 229 s |
| 88 | `src/ocelle-form-input.ts:232-232` | 0 | 0 | 0 | 0 | 0 | 0 | 217 s |
| 89 | `src/ocelle-form-input.ts:233-258` | 10 | 10 | 0 | 0 | 0 | 10 | 277 s |
| 90 | `src/ocelle-form-input.ts:259-275` | 5 | 5 | 1 | 1 | 0 | 9 | 266 s |

In all: 410 mutants in the element shards, 341 valid, 56 of them static, 74 flagged by the rule, and 69 compile
errors. **Every mutant the report marks static is flagged**: none is missed, in the element shards or among those
spanning a cut. The rule flags 8 valid mutants the report does not mark static, all instance property initialisers of
`src/form-control.ts:215-229`, as the design counted. 30 element shards hold a flagged mutant. 13 are a single line
weighing more than 10 (shards 11, 17 to 20, 58, 61, 64, 69, 74 to 76 and 81). The largest estimates are shard 11
(`src/form-control.ts:20-20`, `hostAria`, 5 static valid mutants, 342 s), then 292 s for shards 17 to 20, 69 and 74
to 76 (one line of 3 static valid mutants each), 289 s for shards 64 and 81 (`src/ocelle-form-input.ts:36-36` and
`:173-173`), and 277 s for shards 36, 41, 49, 83, 84 and 89 (10 valid other mutants each). The highest estimate
under the cap is 277 s, as the design gives; none is over 420 s.

**Mutants spanning a cut:** 17, 9 of them valid, the same 9 valid ones as T041a's plan: `src/form-control.ts:43-50`
(ObjectLiteral, static), `:486-492`, `:495-505` and `:518-521` (BlockStatement), `:540-544` (StringLiteral), and
`src/ocelle-form-input.ts:54-73` (ObjectLiteral, static), `:168-174` and `:217-225` (BlockStatement) and `:233-265`
(StringLiteral). The other 8 are compile errors (BlockStatement), 2 more than T041a's plan left
(`src/form-control.ts:53-55` and `src/ocelle-form-input.ts:76-78`).

## Split and revert

Operator decision `decision-split-shard-change.md` (2026-11-15): the element-shard planner change of T041a and T041b
(design changes 1 and 2) is split out of mission 010 into its own op, op 017 (issue #42, branch
`claude/042-mutation-shards-by-count`). `14538fa` reverts it on this branch: `gates/lib/mutation/shards.ts`,
`gates/bin/mutation.ts`, `gates/test/mutation-shards.test.ts`, `gates/test/mutation-fakes.ts`, the
`@stryker-mutator/instrumenter` development dependency and the `gates/README.md` amendment are as they were at
`666bb70`, before `971c431`. History is kept, so op 017 can start from `971c431`, `0d99aa5`, `5c2ef49`, `9a91a92` and
`253292f`. The sections § T041a and § T041b above, `stop-2.md`, the red logs and the `design-1` and `design-2` lines
of `red-commits` stay as history; they are not evidence for mission 010.

Mission 010 continues on the 30-line shard plan of 007 FR-014. Phase 3's element shards over 7:00 are a known gap
(plan decision 11; `design-change-3.md`): on the 30-line plan, 569.4 s and 534.6 s measured and eight of 19
`src/form-control.ts` shards estimated over 420 s (`stop-1.md`); on T041a's plan, 435.6 s to 448.4 s for shards of
static mutants (`stop-2.md`). CI covers the gap with op 015's 45-minute limit for a mutation shard holding element
source (`ce1d9c7` on `main`). T041 is finished without the 7:00 shard rule.

Whole-diff run after the revert, `pnpm run gate:mutation -- --base 2004e82`:

| Run | At | Wall-clock | Result |
|---|---|---|---|
| 5 | `14538fa` | 26:46 | **exit 0**: 496 mutants on the changed lines of 4 files, none survived; 2 timeouts, 110 compile errors; 5 equivalent records |

It matches run 4 (`b76d4ee`): with the gate change reverted, the diff against `2004e82` holds the same four changed
source files. The plants stand as recorded at `b76d4ee` (`plants.md`).
