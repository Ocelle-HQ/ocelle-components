import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Announcer, announcerDefaults } from "../src/live.ts";
import type { Politeness, Reading } from "../src/live.ts";

// The announcer's steps on their own (specs/010-feedback-forms research.md R-02, data-model.md § Announcement
// transitions; T025's phase-end mutation run): an `Announcer` driven through its public methods under fake timers, its
// region's copy read after each step. This file does not import test/in-process.ts, so the timing in force is the
// shipped `announcerDefaults` (each test file has its own src/live.ts module instance): `D` = 150 ms once the document
// is complete and 350 ms while it loads, `W` = 2 × `D`, `H` = 5000 ms. The fake clock moves only when a test advances
// it, so each bound is exact.
const D = announcerDefaults.delayLoaded;
const W = 2 * D;
const loadingW = 2 * announcerDefaults.delayLoading;
const H = announcerDefaults.hold;

let reading: Reading = { text: "", politeness: "polite" };

function read(text: string, politeness: Politeness = "polite"): void {
  reading = { text, politeness };
}

function make(): Announcer {
  return new Announcer(() => reading);
}

const copy = (announcer: Announcer): string | null => announcer.region.textContent;

/** An announcer whose region holds `text`, written just now after an insertion's wait. */
function holding(text: string): Announcer {
  read("");
  const announcer = make();
  read(text);
  announcer.trigger(true);
  vi.advanceTimersByTime(W);
  return announcer;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  read("");
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the announcer's region", () => {
  it("is an atomic, not yet live div with the announcer class, empty", () => {
    const region = make().region;
    expect({ name: region.localName, className: region.className, live: region.getAttribute("aria-live"), atomic: region.getAttribute("aria-atomic"), text: region.textContent }).toEqual({
      name: "div",
      className: "announcer",
      live: "off",
      atomic: "true",
      text: "",
    });
  });
});

describe("the baseline", () => {
  it("is the text and politeness at construction, normalised, and takeBaseline makes it the current ones", () => {
    read("  Saved   now ");
    const announcer = make();
    const first = { saved: announcer.sameText("Saved now"), other: announcer.sameText("Other"), polite: announcer.samePoliteness("polite"), assertive: announcer.samePoliteness("assertive") };
    read(" Other ", "assertive");
    announcer.takeBaseline();
    const taken = { saved: announcer.sameText("Saved now"), other: announcer.sameText("Other"), polite: announcer.samePoliteness("polite"), assertive: announcer.samePoliteness("assertive") };
    expect({ first, taken }).toEqual({
      first: { saved: true, other: false, polite: true, assertive: false },
      taken: { saved: false, other: true, polite: false, assertive: true },
    });
  });

  it("is none after an insertion's trigger: no text and no politeness is the baseline's", () => {
    read("Saved");
    const announcer = make();
    announcer.trigger(true);
    expect({ text: announcer.sameText("Saved"), empty: announcer.sameText(""), polite: announcer.samePoliteness("polite"), assertive: announcer.samePoliteness("assertive") }).toEqual({
      text: false,
      empty: false,
      polite: false,
      assertive: false,
    });
  });

  it("taken by takeBaseline keeps a change back to it from being written at the end of the wait", () => {
    read("A");
    const announcer = make();
    read("B");
    announcer.takeBaseline();
    announcer.trigger(false);
    vi.advanceTimersByTime(10 * W);
    expect(copy(announcer)).toBe("");
  });
});

describe("the wait", () => {
  it("writes the text W after an insertion, not earlier, once the document is complete", () => {
    read("");
    const announcer = make();
    read("Saved");
    announcer.trigger(true);
    vi.advanceTimersByTime(W - 1);
    const before = copy(announcer);
    vi.advanceTimersByTime(1);
    expect({ before, at: copy(announcer) }).toEqual({ before: "", at: "Saved" });
  });

  it("writes the text the loading W after an insertion while the document loads", () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    read("");
    const announcer = make();
    read("Saved");
    announcer.trigger(true);
    vi.advanceTimersByTime(loadingW - 1);
    const before = copy(announcer);
    vi.advanceTimersByTime(1);
    expect({ W: loadingW, before, at: copy(announcer) }).toEqual({ W: 700, before: "", at: "Saved" });
  });

  it("restarts on a trigger while waiting, so only the final text is written, W after the last trigger", () => {
    read("");
    const announcer = make();
    read("A");
    announcer.trigger(true);
    vi.advanceTimersByTime(W / 2);
    read("B");
    announcer.trigger(false);
    vi.advanceTimersByTime(W / 2);
    const atFirstW = copy(announcer);
    vi.advanceTimersByTime(W / 2);
    expect({ atFirstW, atLastW: copy(announcer) }).toEqual({ atFirstW: "", atLastW: "B" });
  });

  it("writes nothing for an empty text, so the next text is written W after its own trigger", () => {
    read("Saved");
    const announcer = make();
    read("");
    announcer.trigger(true);
    vi.advanceTimersByTime(W);
    const empty = copy(announcer);
    read("Next");
    announcer.trigger(false);
    vi.advanceTimersByTime(W);
    expect({ empty, next: copy(announcer) }).toEqual({ empty: "", next: "Next" });
  });
});

describe("the hold", () => {
  it("keeps the copy for H, then empties it", () => {
    const announcer = holding("Saved");
    vi.advanceTimersByTime(H - 1);
    const before = copy(announcer);
    vi.advanceTimersByTime(1);
    expect({ before, after: copy(announcer) }).toEqual({ before: "Saved", after: "" });
  });

  it("keeps the copy for the minimum hold W from its write when a trigger comes 10 ms after it, then empties it and waits W", () => {
    const announcer = holding("A");
    vi.advanceTimersByTime(10);
    read("B");
    announcer.trigger(false);
    const atTrigger = copy(announcer);
    vi.advanceTimersByTime(W - 11);
    const beforeMinimum = copy(announcer);
    vi.advanceTimersByTime(1);
    const atMinimum = copy(announcer);
    vi.advanceTimersByTime(W);
    expect({ atTrigger, beforeMinimum, atMinimum, written: copy(announcer) }).toEqual({ atTrigger: "A", beforeMinimum: "A", atMinimum: "", written: "B" });
  });

  it("holds a copy written after a trigger during the previous hold for its own H, the previous hold's end left out", () => {
    const announcer = holding("A");
    vi.advanceTimersByTime(10);
    read("B");
    announcer.trigger(false);
    vi.advanceTimersByTime(2 * W);
    const written = copy(announcer);
    vi.advanceTimersByTime(H - 2 * W);
    const atFirstH = copy(announcer);
    vi.advanceTimersByTime(2 * W);
    expect({ written, atFirstH, atOwnH: copy(announcer) }).toEqual({ written: "B", atFirstH: "B", atOwnH: "" });
  });

  it("empties the copy at the trigger once it has been current for exactly W", () => {
    const announcer = holding("A");
    vi.advanceTimersByTime(W);
    read("B");
    announcer.trigger(false);
    expect(copy(announcer)).toBe("");
  });
});

describe("alert()", () => {
  it("during the hold empties the copy once it has been current for W, and starts no wait", () => {
    const announcer = holding("A");
    vi.advanceTimersByTime(10);
    read("B");
    announcer.alert();
    const atAlert = copy(announcer);
    vi.advanceTimersByTime(W - 10);
    const atMinimum = copy(announcer);
    vi.advanceTimersByTime(10 * W);
    expect({ atAlert, atMinimum, later: copy(announcer) }).toEqual({ atAlert: "A", atMinimum: "", later: "" });
  });

  it("while waiting cancels the wait, so nothing is written, and a later trigger waits W from itself", () => {
    read("");
    const announcer = make();
    read("A");
    announcer.trigger(true);
    vi.advanceTimersByTime(W / 2);
    announcer.alert();
    vi.advanceTimersByTime(10 * W);
    const cancelled = copy(announcer);
    announcer.trigger(true);
    vi.advanceTimersByTime(W);
    expect({ cancelled, later: copy(announcer) }).toEqual({ cancelled: "", later: "A" });
  });

  it("while the held copy waits for its minimum hold keeps that release, and the copy is emptied at W from its write", () => {
    const announcer = holding("A");
    vi.advanceTimersByTime(10);
    read("B");
    announcer.trigger(false);
    vi.advanceTimersByTime(10);
    announcer.alert();
    vi.advanceTimersByTime(W - 20);
    const atMinimum = copy(announcer);
    vi.advanceTimersByTime(10 * W);
    expect({ atMinimum, later: copy(announcer) }).toEqual({ atMinimum: "", later: "" });
  });

  it("on a fresh announcer leaves it empty, so a trigger right after it waits W from the trigger", () => {
    read("");
    const announcer = make();
    announcer.alert();
    read("A");
    announcer.trigger(true);
    vi.advanceTimersByTime(W);
    expect(copy(announcer)).toBe("A");
  });
});

describe("cancel()", () => {
  it("empties a held copy at once", () => {
    const announcer = holding("A");
    vi.advanceTimersByTime(10);
    announcer.cancel();
    expect(copy(announcer)).toBe("");
  });

  it("cancels a pending wait, so nothing is written", () => {
    read("");
    const announcer = make();
    read("A");
    announcer.trigger(true);
    vi.advanceTimersByTime(W / 2);
    announcer.cancel();
    vi.advanceTimersByTime(10 * W);
    expect(copy(announcer)).toBe("");
  });
});
