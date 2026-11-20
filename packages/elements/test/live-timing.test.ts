import { describe, expect, it } from "vitest";
import { announcerDefaults } from "../src/live.ts";
import { firstTimingReturn } from "./in-process.ts";
import { checkShippedTiming } from "./live-timing-check.ts";

// The shipped announcer figures in process (specs/010-feedback-forms T014; research.md R-09, operator decision
// PLAN-FRESH-3-004 (a)): every in-process scenario replaces `D` and `H` through the test-only setter first, so no
// scenario reads the shipped figures; this test asserts them instead, the internal constant `announcerDefaults` and
// the timing the first setter call of this file replaced (kept read-only by test/in-process.ts, which calls the setter
// when it is imported), against the spec's 150, 350 and 5000 ms. It does not call the setter itself.
describe("the shipped announcer timing", () => {
  it("announcerDefaults and the timing the first setter call replaced are { delayLoaded: 150, delayLoading: 350, hold: 5000 }", () => {
    expect(() => {
      checkShippedTiming(announcerDefaults, firstTimingReturn());
    }).not.toThrow();
  });
});
