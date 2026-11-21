---
phase: 2
round: 1
verdict: changes_requested
base: 6c9400cbaa1da7d2b1ce96d496e65101942524a0
head: fdc0eff
tdd_check: pass
---

# Phase 2 review, round 1

Change under review: `git diff 6c9400c..fdc0eff` (no uncommitted change). Red commit `62378c5`, scaffold `35ff09d`,
`tdd-check.json` `pass` (head `47c79c9`; `fdc0eff` adds only that file).

## Findings

| ID | Severity | Where | Finding | Required change |
|----|----------|-------|---------|-----------------|
| R1-01 | blocking | packages/elements/test/scenarios/notice.ts:115-129, :467-474; packages/elements/test/scenarios/notice-matrix.ts:140-141 (commit `0bdb997`) | The red tests changed after the red commit are not stricter. `pastFirstLoad` adds a gap assertion and a longer capture, but it also moves the trigger of every cell that starts from a first load (`loaded()`, the US1-13 hold cell and all 15 SC-002 matrix cells) out of the first `W(loading)` after the load. In both harnesses, no test now changes a first-loaded notice in the window right after the load. The commit's reason was a fixture-page measurement. It was applied to the in-process harness as well, where `D(loading)` = `D(loaded)` and the red-form cells pass: I restored the red form (`pastFirstLoad` a no-op, the hold cell's `atLeast` as at `62378c5`) in a scratch copy, and `notice.test.ts` gave 79/79 passed, twice, against the HEAD source. The change also hides a defect. A planted `onContent()` that ignores light-DOM changes for 100 ms after a first load passes every HEAD suite (`notice.test.ts`, `notice-rules.test.ts`, `announcer.test.ts`: 144/144). The red-form scenarios fail 22 cells on that plant (US1-11 text and heading, US1-13 one task, 100 ms apart, 10 ms after a write and hold, the two-notices Edge case, and all 15 SC-002 cells). The commit body says that on the fixture pages "no write there could count under `settled`, whatever the element does". That claim is not shown. The element could wait until the region's empty state has been current for `W` of the load state in which that state began. Read with the project's own oracle, the fixture failure is evidence that a text change made right after the load may not reach assistive technology. That is a behaviour or design question, not a wrong test (Principle VIII: a replacement must be stricter). | Restore the trigger-right-after-first-load cells in process, where they pass, and keep at least one cell per harness in which a first-loaded notice changes in the first task after the load and is announced once. For the fixture pages, either make the element meet the cells (red test first) or record a stop for the operator or planner with the measurement (empty state 344 ms against `D` = 350 ms). Do not narrow the window without that decision. |
| R1-02 | blocking | packages/elements/src/ocelle-notice.ts:29 | `pnpm run gate:mutation -- --base 6c9400c` at `fdc0eff` (whole diff, one run, 25:34 wall-clock) **exits 1**: "StringLiteral: Survived: replaced by "Stryker was here!"" on `(role ?? "")`. I judge this mutant equivalent: for a null role, `"Stryker was here!".trim().split(/\s/)[0]?.toLowerCase()` is `"stryker"`, which is neither `alert` nor `status`, so `liveRoleOf` returns null as it does for `""`. It is not a behaviour gap. But the gate fails, and CI will fail with it. mutation.md reports shard 9 (`ocelle-notice.ts:1-30` at `f5fdc92`) as "none survived". No test can kill an equivalent mutant, so that kill was not an assertion (see the note on timing kills). | Add a `Stryker disable next-line StringLiteral: equivalent, ...` record with this reason, or write the line without the literal. Then re-run the shard and record its result. |
| R1-03 | blocking | specs/010-feedback-forms/data-model.md:52, :55, :76-89; research.md:85 | The design no longer describes the code. The mutation fixes removed `onContent()`'s pending check (`1b5cb85`), so a light-DOM change while the alert baseline is pending now starts a wait whose re-check drops it. Data-model row 55 and the *Alert path* text (":86-89", "start no wait", "each mutation matches one row only") still say no wait starts. `leaveAlert()` for `role change` now always triggers (row 52 says "if the text or the politeness differs ... otherwise none"). The alert insertion no longer sets the baseline to none at once (:77, "For an insertion or a reveal the baseline is set to none at once"). research.md:85 says the region is hidden by "the clip pattern", but the `.announcer` rule (ocelle-notice.ts:120-131) uses a 1px box with `overflow: hidden` and no `clip`. Observable behaviour is unchanged (see Test quality, removals). Phases 3 and 4 build the form controls' announcer on these rows. | A design-change record for the planner, as design-change-1.md was, that amends data-model.md (rows 52 and 55, *Alert path*) and research.md R-02 to the code. This is not a code change. |
| R1-04 | note | packages/elements/src/ocelle-notice.ts:343 | The equivalence holds, but its reason is incomplete. `LitElement.disconnectedCallback()` also calls `this.__childPart?.setConnected(false)` (lit-element.js:174-176), not only the reactive controllers. That call only affects async directives, and `render()` uses none, so the mutant stays equivalent. | Optional: name the child part in the reason. |
| R1-05 | note | specs/010-feedback-forms/reviews/phase-2/mutation.md § Open; gate run above | Mutation kills under Stryker are partly timing kills. In my whole-diff run, 12 of 427 kills came from an in-process gap assertion ("the wait after the first load: gap 24x", "US1-13 100 ms apart: gap ...") or a 30 s test timeout. I checked each of the 12 mutants by reading its replacement: `live.ts:97-98` (throwing `setAttribute("")`, or a not-off or non-atomic region checked by announcer.test.ts), `:135` (`alert()` dropping the release timer), `:247` (`stop()` emptied), `ocelle-notice.ts:203` (observe options `{}` throws; `characterData: false` is killed by notice-rules.test.ts:512), `:257`, `:283`, `:337-338`. A deterministic test kills each of them too, so none hides a survivor. Item 5 is borne out: the `:29` kill in shard 9 was spurious (R1-02). | Consider running the elements Stryker configuration with lower concurrency, or the real-timing files outside it, so that a kill means an assertion. |
| R1-06 | note | specs/010-feedback-forms/reviews/phase-2/check-final-tests-on-base.log, check-final-tests-on-scaffold.log | Check 3 fails on a load error, not on assertions: "announcer.test.ts failed to load" (base) and "define.test.ts failed to load" (scaffold, the `registering` import added in `1b5cb85`). The runner stops at the first file, so these logs prove nothing about the other final tests. The red evidence itself is sound: red-phase.log has 286 of 3456 failed, 270 of them `AssertionError`, and the plant rows reject with their cells' messages. Against the scaffold the notice is undefined, so the scenario cells cannot pass there. | None for this phase; the tdd-check script could run each file on its own. |
| R1-07 | note | vitest.config.ts:96 (`56764b0`) | Decision (b) is applied as `fileParallelism: false` on the whole `elements` project. decision-stop-1.md allows "`fileParallelism: false` for them, or a separate project", and the setting covers "any later timing file of this mission". The re-measure in stop-1.md's Follow-up is recorded (largest 13.4 ms < 66.7 ms). My gate run took 8:07 wall-clock. This is within the decision. | None. |
| R1-08 | note | packages/elements/test/browser/notice.test.ts (US1-9 innerHTML) | A one-time failure on the fixture page is reported. It did not recur in my `gate:unit-tests` run (3521 passed). One run is no proof of stability. | Record it if it recurs. |

## Test quality

**Red evidence.** red-phase.log shows `62378c5` failing on assertions: 286 of 3456 failed, 270 `AssertionError`. The rest are plant rows rejecting with their cells' messages, or the manifest and README items T017 names. None is a setup or import error. tdd-check.json is `pass` (red exit 1, base exit 2, scaffold exit 2, head exit 0); see R1-06 for what the base and scaffold logs show.

**Tests changed after red** (`git diff 62378c5..HEAD`, test paths):
- `scenarios/notice.ts`, `scenarios/notice-matrix.ts` (`0bdb997`, item 1): **not stricter**, R1-01. Two parts of that commit are stricter: `px()` reading a text token value as written, and US1-15 "status text change" gaining `settleAnnouncement`, so that a second region holding the content would count.
- `plants.test.ts` and `fixtures/notice-plants.ts` (`3dbd6a2`, item 2): only the "alert pending tone" row and its `AlertPendingTone` fixture are removed, together with the guard (`onTone()`'s pending return). This was the operator's decision (design-change-1.md, `20cd667`): the guard had no observable effect, so the row could not bite. The US1-15 cell "alert, tone changed in the same task" is unchanged. I accept it as a decision, not a weakened test.
- `notice.test.ts`, `browser/notice.test.ts`: `assert.isUndefined(await ...)` became `await expect(...).resolves.toBeUndefined()`, which is equivalent. In `browser/driver.test.ts` and `in-process.ts`, `as` casts were replaced by checked reads (lint), with the same assertions.
- New, after green (mutation kills): `announcer.test.ts`, `notice-rules.test.ts` (fake clock, assertions on the region) and `registering()` in `define.test.ts`. Each has an unconditional `expect`, with no skip, only or snapshot.

**Coverage.** The scenario names cover US1-1 to US1-19 (8 and 9 for each way of inserting, 12 with the focused link, 13 in five cells, 15 in sixteen), the Edge cases and the SC-002 matrix in both harnesses, and the plants file holds every US1 row of contracts/testing.md § Plants except the removed one. The gap is R1-01.

**Removals in the mutation fixes** (item 4). I checked each against the code at `fdc0eff`; each keeps behaviour unchanged:
- `clearBaseline()` and the alert insertion's baseline reset: the end-of-task `alertStep()` replaces the baseline before any wait started in the task can end. A change away from `alert` in the same task goes through `leaveAlert()`'s `trigger(true)`, which forgets the baseline.
- `cancel()`'s and `wait()`'s `waitNext = false`: `waitNext` is read only in `released()`, which is reached only through `releaseHeld()`, and every call of that is preceded by `trigger()` (true) or `alert()` (false).
- `onContent()`'s pending check and `leaveAlert()`'s comparison: the wait they now start ends after the end-of-task baseline (or with the old baseline, for `role change`) and writes nothing unless the text or politeness differs. Any later change triggers on its own. A held copy is already being released by `alert()` in the same task.
- The two `syncLive()` calls: `attributeChangedCallback()` calls `requestUpdate()` unconditionally, and `updated()` syncs in the microtask. That update also runs while the notice is disconnected, before any accessibility serialisation.
- `onConnect()`'s `moving = false`: every connection that follows a disconnect finds the flag set again by `startMove()`, and `endMove()` clears it.
- `onRole()`'s `before === "alert"`: `pending` is set only while the role is `alert` and is reset on every way out of it.
- `onRole()`'s `after !== null`: the baseline of a silent notice is never read and is taken again when the notice becomes live.
- `split(/\s+/)` to `split(/\s/)` after `trim()`, and the heading `join(" ")` to `join("")` under `collapse(...) !== ""`: same results.

**Equivalent records** (13 new, plus `gates/bin/contrast.ts:116` from before). I read each one:
- `live.ts:87`, `:207`, `:232`: correct (`clearTimeout` of a timer that has fired, `waitNext` always set before it is read).
- `ocelle-notice.ts:62`, `:64`, `:69`, `:71`, `:78`, `:80`, `:82`: correct for Lit 3 (`noAccessor`: no Lit accessor, so no `requestUpdate(name)` and no reflection. With `{}` or with `noAccessor: false`, the wrapper's `hasChanged` sees the same getter value, and the converter fallback in reactive-element.js:668-672 applies only to null or undefined).
- `:343`: correct with R1-04's reason.
- `:352` (item 5): correct. `ReactiveElement.attributeChangedCallback` only calls `_$attributeToProperty` (reactive-element.js:610-612, :651-676). That sets the property from the attribute, and the notice's setters write nothing when the attribute already holds the value (ocelle-notice.ts:254-258). Its local survival is what an equivalent mutant does.
- `:489`: correct, `ReactiveElement.updated()` is empty.

**Mutation result.** 610 mutants on the changed lines: 162 compile errors, 13 ignored (the records), 427 killed, 1 survived (`ocelle-notice.ts:29`, equivalent, recorded here). Gate exit 1, so R1-02.

## Checks run

At `fdc0eff`, this container, Chromium 153 build 1243 (`OCELLE_CHROMIUM_PATH`), one heavy job at a time:

| Check | Result |
|---|---|
| `gate:typecheck` | exit 0, "no type error in the files of tsconfig.json" |
| `gate:lint` | exit 0, "302 files checked, no finding" |
| `gate:style-lint` | exit 0, "14 files checked, no finding" |
| `gate:test-lint` | exit 0, "210 files checked, no finding" |
| `gate:csp` | exit 0, "12 files checked, no finding" |
| `gate:prefix` | exit 0, "247 files checked, no finding" |
| `gate:contrast` | exit 0, "165 pairs checked in light, 173 in dark (154 required per theme)" |
| `gate:manifest` | exit 0, "3 elements checked, no finding" |
| `gate:brand-rules`, `gate:pins`, `gate:config-copies` | exit 0 |
| `gate:unit-tests` | exit 0, "3521 tests passed in 153 files", 8:07 wall-clock |
| `gate:mutation -- --base 6c9400c` (whole diff) | **exit 1**, 1 finding (R1-02), 25:34 wall-clock |
| scratch copy, red-form first-load cells (`pastFirstLoad` a no-op), `vitest run --project elements notice.test.ts` on the HEAD source | 79/79 passed, twice (R1-01) |
| scratch copy, the same red-form cells with `onContent()` ignoring changes for 100 ms after a first load | 22 failed (R1-01); HEAD's `notice.test.ts`, `notice-rules.test.ts` and `announcer.test.ts` with that plant: 144/144 passed |

Not run again: `gate:plants` (ran at `1ed4d04`, exit 0, 301 plants; the later commits touch no plant tree, and `custom-elements.json` regenerates unchanged). No visual or axe gate exists for this phase (stories and baselines are Phase 5). The scratch experiments ran in a copy under the session scratchpad, and no repository file was changed.

**Constitution.** The `ocelle-` names, no I/O and no network in the element (an internal `MessageChannel` only), tokens only in the styles (plus system colours under `forced-colors`), no IDs in the shadow root, `internals.ariaLive = "off"`, the strict-CSP fixture pages, and the engine floor (engine-floor.md: every feature at or below Chromium 120 and WebKit 16.4) are in order. Tasks T009a to T025 are ticked and their work is present. Item 7 is R1-03.

## Earlier findings

None. This is the first round.
