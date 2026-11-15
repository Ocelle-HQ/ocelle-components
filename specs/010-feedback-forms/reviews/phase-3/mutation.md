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
