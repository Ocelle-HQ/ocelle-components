// The shipped announcer figures (specs/010-feedback-forms research.md R-09, operator decision PLAN-FRESH-3-004 (a);
// contracts/testing.md § Plants, Seams; analysis U7): one check, run by test/live-timing.test.ts with the real values
// and by the shipped-timing plant row of test/plants.test.ts with planted ones. The figures are the spec's 150, 350
// and 5000 ms, written here as literals and never read from src/live.ts.
import { assert } from "vitest";
import type { AnnouncerTiming } from "../src/live.ts";

/**
 * Asserts that `defaults` (the internal constant `announcerDefaults`) and `firstReturn` (the timing the first
 * `setAnnouncerTimingForTests` call of the test file replaced, kept by test/in-process.ts) each equal
 * `{ delayLoaded: 150, delayLoading: 350, hold: 5000 }`.
 */
export function checkShippedTiming(defaults: AnnouncerTiming | undefined, firstReturn: AnnouncerTiming | undefined): void {
  assert.deepEqual({ defaults, firstReturn }, {
    defaults: { delayLoaded: 150, delayLoading: 350, hold: 5000 },
    firstReturn: { delayLoaded: 150, delayLoading: 350, hold: 5000 },
  }, "the shipped announcer timing");
}
