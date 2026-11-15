# Phase 2 plant run (T023)

Re-run on 2026-11-14 in this container (Chromium 153.0.8010.12, build 1243, through `OCELLE_CHROMIUM_PATH`), at
`2070cc8`, each plants file alone (`vitest run --reporter verbose --project elements packages/elements/test/plants.test.ts`,
then `--project elements-browser packages/elements/test/browser/plants.test.ts`). All 48 in-process rows and both
fixture-page rows bite.

## The "alert pending tone" row: removed by the operator's decision

The first run (at `a72de58`) stopped at the "alert pending tone" row, which did not bite: the guard it planted (the
`tone` row "alert baseline pending is not none: none" of data-model.md) had no observable effect, since the end-of-task
step takes the baseline before any wait started in the same task can end, and a `role="alert"` host is `assertive`
whatever its tone (the measurement is in design-change-1.md). Operator decision, 2026-11-14 (human:jeroennouwsdev):
"Remove guard and plant" (design amended in `20cd667`, design-change-1.md). In `3dbd6a2` the guard (`onTone()`'s
`this.pending !== "none"` early return in `src/ocelle-notice.ts`), the plant row (`test/plants.test.ts`) and its
`AlertPendingTone` fixture (`test/fixtures/notice-plants.ts`) are removed. **The removal is the operator's decision, not
a weakened test**: the row could not turn any cell red. The US1-15 cell "alert, tone changed in the same task after
insertion" (count 0, host role `alert`) is unchanged and passes as a plain behaviour check.

## The rows

Each row asserts that its planted body rejects with the row's message and that the same body with `ocelle-notice`
passes, so a row passes only when its plant bites.

```text
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: takes a link's own name turns a link's own name skipped and its Stati… red 55ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: visits an img's descendants turns an img's name taken and its descendants… red 16ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > oracle reading: ignores the keeping rule turns a state set and cleared in one task is … red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the t… turns US1-8 innerHTML red 1067ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the t… turns US1-15 status insertion red 933ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > insertion announcement: announcer created already holding the t… turns US1-15 status reveal red 1183ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns US1-15 alert insertion red 967ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns US1-15 alert reveal red 1183ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns US1-15 status to alert red 1183ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert path: writes the copy for a role="alert" host turns SC-002 alert danger red 2300ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert baseline: the alert path takes the baseline at th… turns US1-15 alert, text set in the same task… red 967ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert baseline: the alert path takes the baseline at th… turns US1-15 alert, text set in the same task… red 1216ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert baseline: the alert path takes the baseline at th… turns US1-15 alert, text set in the same task… red 1233ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert pending role: alert to status while pending leaves th… turns US1-15 inserted as alert, changed to st… red 1017ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert pending role: alert to status while pending leaves th… turns US1-15 revealed as alert, changed to st… red 1217ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert step after reset: the end-of-task step sets the baseline … turns US1-15 inserted as alert, changed to st… red 1000ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > alert step after reset: the end-of-task step sets the baseline … turns US1-15 revealed as alert, changed to st… red 1250ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > merge window: no restart: each trigger writes after i… turns US1-13 100 ms apart red 1500ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > minimum hold: a trigger during the hold empties the c… turns US1-13 10 ms after a write red 1716ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > baseline re-check: writes at the end of the wait without c… turns US1-13 A, B, A red 1333ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US1-8 innerHTML red 1067ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US1-17 first loaded hidden red 1283ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > reveal baseline: the re-check also applies to insertion … turns US1-17 announced, hidden and revealed w… red 1950ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hold: empties the copy after W instead of H turns US1-13 hold red 2350ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load, late write: writes exactly the pre-load W after fir… turns US1-10 loading red 1083ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > short-lived empty state: text written in a microtask after the a… turns US1-8 innerHTML red 1050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > short-lived empty state: text written in the first animation fra… turns US1-8 innerHTML red 934ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US1-8 innerHTML red 917ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US1-8 template red 933ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: the constructor's isConnected rule turns US1-8 domparser red 933ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > first load: announces on first load turns US1-10 first load only red 933ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > nested region: the content wrapper also carries aria-l… turns US1-15 status text change red 1700ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > host-role region: internals.ariaLive left unset turns US1-15 status text change red 1733ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness: always polite turns US1-9 innerHTML red 1050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness: always polite turns US1-12 red 1650ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness: always polite turns US1-15 runtime roles red 3583ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > politeness baseline: announces on any tone change turns US1-12 red 1650ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > move: move flag never set turns US1-11 move red 1200ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > later task: move flag never cleared turns Edge case, later task red 1250ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > text baseline: compares with the last written copy bef… turns US1-11 same text red 1200ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > text baseline: compares with the last written copy bef… turns Edge case, whitespace red 1183ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US1-17 inserted hidden red 1417ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US1-17 first loaded hidden red 1217ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > hidden: announces while hidden (the hidden attr… turns US1-17 announced, hidden and revealed w… red 2050ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > heading gap: the heading part not hidden when absent turns US1-4, SC-004 red 850ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > shipped timing: announcerDefaults with delayLoaded: 0 turns checkShippedTiming (test/live-timing.te… red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > shipped timing: the timing in force not started from th… turns checkShippedTiming (test/live-timing.te… red 17ms
 ✓ |elements (chromium)| packages/elements/test/plants.test.ts > plants (elements project) > capture bounds: an element that mutates its own attribu… turns a capture over the container (in proces… red 5533ms
 Test Files  1 passed (1)
      Tests  48 passed (48)
 ✓ |elements-browser| packages/elements/test/browser/plants.test.ts > plants (elements-browser project) > first load: announces on first load turns US1-10 first load only (startDocument) red 4948ms
 ✓ |elements-browser| packages/elements/test/browser/plants.test.ts > plants (elements-browser project) > capture bounds: an element that mutates its own attribu… turns a capture over the container (fixture p… red 7253ms
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

## Corrections since the first run

- `3dbd6a2`: the "alert pending tone" row removed (above).
- `0bdb997`: the shared first-load bodies (`loaded()`, the US1-13 hold cell and the SC-002 matrix) wait the pre-load `W`
  after the first load (`pastFirstLoad`), a stricter test; the reason is in the commit body (on the fixture pages the
  region's empty state begins before the load ends, so a write `W` after a trigger right after the load could not count
  under `"settled"`). Every row that runs those bodies still bites (above).

## Under the full suite: rows fail on timing (stop)

Run inside the whole suite (`pnpm run gate:unit-tests`, or `vitest run` of every project; 4 CPUs), rows fail for
timing, not for their plant: for example "alert path ... US1-15 alert reveal" and "merge window ... US1-13 100 ms
apart" rejected with "the wait after the first load: gap 227.1 in [100, 200)" and "gap 207 in [100, 200)" instead of
their row's message, and "minimum hold ... US1-13 10 ms after a write" resolved once (in a run of the `elements`
project alone) because the copy stayed longer than the planted rule allows. That is the in-process `drive.after`
overshoot stop of tasks.md (see the question in this directory, `stop-1.md`).
