// The fake-clock rule case of the wait's floor from the empty state's start (specs/010-feedback-forms research.md R-02
// step 2, data-model.md *Announce*; phase 2 stop 2, operator decision (a); T025a). The in-process scenarios cannot show
// the floor, since the test constant gives both load states one `D`; this case drives announcers made by `make`
// through their public methods with the two `D` values of the shipped `announcerDefaults` (150 ms once the document is
// complete, 350 ms while it loads) and reads each region's copy at the bounds. test/announcer.test.ts compares the
// readings for `Announcer` with `emptyStartExpected`; the "empty-state start" plant row of test/plants.test.ts runs
// `emptyStartCase`, which asserts the same, with the plant that ignores the start, which must fail it. The caller installs fake timers (setTimeout, clearTimeout and performance) and the shipped timing; the
// case spies on `document.readyState` and restores it.
import { assert, vi } from "vitest";
import { announcerDefaults } from "../src/live.ts";
import type { Announcer, Politeness, Reading } from "../src/live.ts";

/** The message every assertion of the case starts with (the plant row matches it). */
export const emptyStartMessage = "empty-state start";

const W = 2 * announcerDefaults.delayLoaded;
const loadingW = 2 * announcerDefaults.delayLoading;
const H = announcerDefaults.hold;

export type MakeAnnouncer = new (read: () => Reading) => Announcer;

/** One announcer on the clock: its reading set by `say`, and its copy read by `copy`. */
interface Probe {
  readonly announcer: Announcer;
  say(text: string, politeness?: Politeness): void;
  copy(): string | null;
}

/** The copies the case reads when every rule holds. */
export const emptyStartExpected = {
  firstLoad: { before: "", at: "B" },
  afterLoad: { before: "", at: "B" },
  restart: { before: "", at: "C" },
  assertive: { before: "", at: "B" },
  cancel: { before: "", at: "B" },
  heldAfter: "B",
  emptiedAtH: "",
  afterEmptied: { before: "", at: "C" },
  emptiedWhileLoading: "",
  loadingEmptied: { before: "", at: "C" },
} as const;

/** Runs the case for announcers of class `make` and returns the copies it read, in the shape of `emptyStartExpected`. */
export function emptyStartReadings(make: MakeAnnouncer): unknown {
  const state = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
  const load = (value: DocumentReadyState): void => {
    state.mockReturnValue(value);
  };
  /** A new announcer reading `text`, made with the document `value`, whose region becomes live (rendered while live). */
  const rendered = (value: DocumentReadyState, text = "A"): Probe => {
    load(value);
    let reading: Reading = { text, politeness: "polite" };
    const announcer = new make(() => reading);
    announcer.live("polite");
    return {
      announcer,
      say: (next, politeness = "polite") => {
        reading = { text: next, politeness };
      },
      copy: () => announcer.region.textContent,
    };
  };
  /** The copy 1 ms before `at` ms from now and at it. */
  const around = (probe: Probe, at: number): { before: string | null; at: string | null } => {
    vi.advanceTimersByTime(at - 1);
    const before = probe.copy();
    vi.advanceTimersByTime(1);
    return { before, at: probe.copy() };
  };
  try {
    // Begun while loading, the trigger 20 ms after the load: written the pre-load W after the start, not W after the trigger.
    const first = rendered("loading");
    vi.advanceTimersByTime(20);
    load("complete");
    first.say("B");
    first.announcer.trigger(false);
    const firstLoad = around(first, loadingW - 20);

    // Begun after the load: written W after the trigger.
    const after = rendered("complete");
    vi.advanceTimersByTime(20);
    after.say("B");
    after.announcer.trigger(false);
    const afterLoad = around(after, W);

    // A restart 100 ms after the load keeps the start: written the pre-load W after it, not W after the restart.
    const restarted = rendered("loading");
    vi.advanceTimersByTime(20);
    load("complete");
    restarted.say("B");
    restarted.announcer.trigger(false);
    vi.advanceTimersByTime(80);
    restarted.say("C");
    restarted.announcer.trigger(false);
    const restart = around(restarted, loadingW - 100);

    // A change of the region's politeness from polite to assertive after the load does not start an empty state.
    const politeness = rendered("loading");
    vi.advanceTimersByTime(30);
    load("complete");
    politeness.say("B", "assertive");
    politeness.announcer.live("assertive");
    politeness.announcer.trigger(false);
    const assertive = around(politeness, loadingW - 30);

    // Cancelling an empty region is not a new empty state: the start before it stays.
    const cancelled = rendered("loading");
    vi.advanceTimersByTime(20);
    load("complete");
    cancelled.announcer.cancel();
    vi.advanceTimersByTime(10);
    cancelled.say("B");
    cancelled.announcer.trigger(false);
    const cancel = around(cancelled, loadingW - 30);

    // A copy written while loading and emptied by the hold after the load: a new empty state, the after-load W.
    const emptiedAfter = rendered("loading");
    emptiedAfter.say("B");
    emptiedAfter.announcer.trigger(false);
    vi.advanceTimersByTime(loadingW);
    const heldAfter = emptiedAfter.copy();
    vi.advanceTimersByTime(100);
    load("complete");
    vi.advanceTimersByTime(H - 100);
    const emptiedAtH = emptiedAfter.copy();
    vi.advanceTimersByTime(20);
    emptiedAfter.say("C");
    emptiedAfter.announcer.trigger(false);
    const afterEmptied = around(emptiedAfter, W);

    // A copy written and emptied by the hold while loading, the trigger 20 ms after the emptying and after the load: a
    // new empty state begun while loading, so written the pre-load W after the emptying.
    const emptiedLoading = rendered("loading");
    emptiedLoading.say("B");
    emptiedLoading.announcer.trigger(false);
    vi.advanceTimersByTime(loadingW + H);
    const emptiedWhileLoading = emptiedLoading.copy();
    load("complete");
    vi.advanceTimersByTime(20);
    emptiedLoading.say("C");
    emptiedLoading.announcer.trigger(false);
    const loadingEmptied = around(emptiedLoading, loadingW - 20);

    return { firstLoad, afterLoad, restart, assertive, cancel, heldAfter, emptiedAtH, afterEmptied, emptiedWhileLoading, loadingEmptied };
  } finally {
    state.mockRestore();
  }
}

/** Runs the case for announcers of class `make`; throws an assertion that starts with `emptyStartMessage` when a rule fails. */
export function emptyStartCase(make: MakeAnnouncer): void {
  assert.deepEqual(emptyStartReadings(make), emptyStartExpected, `${emptyStartMessage}: the copies at the wait's bounds (W ${String(W)} ms, pre-load W ${String(loadingW)} ms)`);
}
