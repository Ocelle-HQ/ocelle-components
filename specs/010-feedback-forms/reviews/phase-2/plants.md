# Phase 2 plant run (T023) — stopped: one plant does not bite

Run on 2026-11-14 in this container (Chromium 153.0.8010.12, build 1243, through `OCELLE_CHROMIUM_PATH`), on the
working tree of the first green pass (`e03100e` plus the `liveRole` rename and the nested-region scenario's settling
wait, committed with this record). tasks.md § Stop-and-ask, "A plant that does not bite": **the phase stops here for
the operator.**

## The plant that does not bite

| Family | Plant (test/fixtures/notice-plants.ts) | Cell | Result |
|---|---|---|---|
| alert pending tone | `AlertPendingTone`: `onTone()` takes the ordinary `tone` row while the alert baseline is pending (`if (this.isLive() && !this.hidden) this.announcer.trigger(false)`) | US1-15 "alert, tone changed in the same task after insertion" (count 0) | **does not bite**: the planted body resolves, count 0 under both rules |

Measured (an uncommitted probe, removed afterwards), the notice's own state after each step of the cell
(`role="alert" tone="info"` inserted, `tone` set to `danger` in the same task):

| Step | Real `ocelle-notice` | The plant |
|---|---|---|
| after the insertion | announcer `empty`, pending `insertion`, baseline none | the same |
| after the `tone` change, same task | `empty`, pending `insertion`, baseline none | **`waiting`** (the ordinary row started a wait of `W`), pending `insertion`, baseline none |
| next task (the end-of-task step has run) | `empty`, pending `none`, baseline `Run failed`/assertive | `waiting`, pending `none`, baseline `Run failed`/assertive |
| after `W` | `empty`, no write | `empty`: the wait's re-check found text and politeness equal to the baseline the end-of-task step took, and wrote nothing |
| announcements (settled, rendered) | `[]`, `[]` | `[]`, `[]` |

Why: data-model.md's end-of-task step sets the baseline to the text and politeness current at the next task, which
is always before the ordinary row's wait of `W` ends (`W` ≥ 2 × `D`; the step runs one `MessageChannel` task later).
For a `role="alert"` host the politeness is `assertive` whatever the tone, so the planted wait always ends on text and
politeness equal to that baseline, and the *Announce* re-check ("if both equal the baseline, write nothing") drops it.
Under data-model.md as written the "pending is not none" `tone` row is not observable on this cell (nor, as far as the
implementer can see, on any cell: the step always takes the baseline before a wait started in the same task can end),
so no plant of that row, through any seam, can turn the cell red.

The question for the operator (contracts/testing.md § Plants, "alert pending tone"; data-model.md `tone` rows):
(a) keep the row and record the family as having no observable effect (no plant; the review records the guard's
mutants as equivalent), (b) change the cell so that the guard is observable (for example a cell where the pending
`tone` row's absence would write a copy, if the operator sees one), or (c) another decision. The implementer has not
changed the plant, the cell or the design.

## The other rows: they bite

```text
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: takes a link's own name turns a link's own name skipped and its Stati… red 44ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: visits an img's descendants turns an img's name taken and its descendants… red 16ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: ignores the keeping rule turns a state set and cleared in one task is … red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the t… turns US1-8 innerHTML red 1067ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the t… turns US1-15 status insertion red 917ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the t… turns US1-15 status reveal red 950ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns US1-15 alert insertion red 917ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns US1-15 alert reveal red 983ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns US1-15 status to alert red 983ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns SC-002 alert danger red 2050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert baseline: the alert path takes the baseline at th… turns US1-15 alert, text set in the same task… red 983ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert baseline: the alert path takes the baseline at th… turns US1-15 alert, text set in the same task… red 983ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert baseline: the alert path takes the baseline at th… turns US1-15 alert, text set in the same task… red 1017ms
 × |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert pending tone: a tone change while pending takes the o… turns US1-15 alert, tone changed in the same … red 600ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert pending role: alert to status while pending leaves th… turns US1-15 inserted as alert, changed to st… red 1050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert pending role: alert to status while pending leaves th… turns US1-15 revealed as alert, changed to st… red 1033ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert step after reset: the end-of-task step sets the baseline … turns US1-15 inserted as alert, changed to st… red 1017ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert step after reset: the end-of-task step sets the baseline … turns US1-15 revealed as alert, changed to st… red 1050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > merge window: no restart: each trigger writes after i… turns US1-13 100 ms apart red 1317ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > minimum hold: a trigger during the hold empties the c… turns US1-13 10 ms after a write red 1500ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > baseline re-check: writes at the end of the wait without c… turns US1-13 A, B, A red 1117ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US1-8 innerHTML red 1050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US1-17 first loaded hidden red 1100ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US1-17 announced, hidden and revealed w… red 1950ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hold: empties the copy after W instead of H turns US1-13 hold red 2000ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load, late write: writes exactly the pre-load W after fir… turns US1-10 loading red 1050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > short-lived empty state: text written in a microtask after the a… turns US1-8 innerHTML red 1083ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > short-lived empty state: text written in the first animation fra… turns US1-8 innerHTML red 1150ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US1-8 innerHTML red 967ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US1-8 template red 917ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US1-8 domparser red 883ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: announces on first load turns US1-10 first load only red 867ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > nested region: the content wrapper also carries aria-l… turns US1-15 status text change red 1500ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > host-role region: internals.ariaLive left unset turns US1-15 status text change red 1467ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness: always polite turns US1-9 innerHTML red 1033ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness: always polite turns US1-12 red 1350ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness: always polite turns US1-15 runtime roles red 3317ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness baseline: announces on any tone change turns US1-12 red 1533ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > move: move flag never set turns US1-11 move red 967ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > later task: move flag never cleared turns Edge case, later task red 1033ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > text baseline: compares with the last written copy bef… turns US1-11 same text red 983ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > text baseline: compares with the last written copy bef… turns Edge case, whitespace red 967ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US1-17 inserted hidden red 1383ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US1-17 first loaded hidden red 1017ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US1-17 announced, hidden and revealed w… red 2017ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > heading gap: the heading part not hidden when absent turns US1-4, SC-004 red 850ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > shipped timing: announcerDefaults with delayLoaded: 0 turns checkShippedTiming (test/live-timing.te… red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > shipped timing: the timing in force not started from th… turns checkShippedTiming (test/live-timing.te… red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > capture bounds: an element that mutates its own attribu… turns a capture over the container (in proces… red 5550ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed (1)
      Tests  1 failed | 48 passed (49)
 ✓ |elements-browser| packages/elements/test/browser/plants.test.ts > plants (elements-browser project) > first load: announces on first load turns US1-10 first load only (startDocument) red 4861ms
 ✓ |elements-browser| packages/elements/test/browser/plants.test.ts > plants (elements-browser project) > capture bounds: an element that mutates its own attribu… turns a capture over the container (fixture p… red 7247ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

Each row asserts that its planted body rejects with the row's message and that the same body with `ocelle-notice`
passes, so a row passes only when its plant bites. Two corrections were needed before the run, both recorded in the
green commit's body:

- the nested-region row did not bite at first because its scenario ("US1-15 status text change") changed the text
  within `D` of the first load, so a second region holding the content had no kept state before the change; the
  scenario now settles first (a stricter test);
- the plant bundle of the fixture pages did not build because `OcelleNotice.role()` shadowed `HTMLElement.role` (the
  global setup's `tsc` failed); the method is now `liveRole()`.
