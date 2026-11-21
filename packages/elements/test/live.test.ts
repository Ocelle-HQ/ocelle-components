import { describe, expect, it } from "vitest";
import { announcements, expectAnnouncements, regionText } from "./live-reading.ts";
import type { Snapshot } from "./live-reading.ts";
import { cases } from "./live-rules.ts";

// The unit tests of the live-region reading (specs/010-feedback-forms T001; research.md R-09): every case of
// live-rules.ts with the reading of live-reading.ts (the oracle rows of plants.test.ts run named cases with planted
// readings), and `expectAnnouncements`, which states a count once and checks it under both keeping rules.
const reading = { regionText, announcements };

describe("the live-region reading (regionText, announcements)", () => {
  it.each(cases)("$name", ({ run }) => {
    expect(() => {
      run(reading);
    }).not.toThrow();
  });
});

/** A region empty for 400 ms, "Saved" for 100 ms (rendered, shorter than D = 150 ms), then empty to 1200 ms. */
function shortSaved(): Snapshot[] {
  const snap = (at: number, lifecycle: boolean, text: string): Snapshot => ({
    at,
    frame: Math.floor(at / 16),
    lifecycle,
    loaded: true,
    regions: [{ node: "r", host: "n", politeness: "polite", text }],
    hosts: [],
  });
  const made: Snapshot[] = [snap(0, false, "")];
  for (let at = 16; at < 400; at += 16) made.push(snap(at, true, ""));
  made.push(snap(400, false, "Saved"));
  for (let at = 416; at < 500; at += 16) made.push(snap(at, true, "Saved"));
  made.push(snap(500, false, ""));
  for (let at = 512; at < 1200; at += 16) made.push(snap(at, true, ""));
  made.push(snap(1200, false, ""));
  return made;
}

/** The same region with "Saved" kept from 400 ms to the end. */
function keptSaved(): Snapshot[] {
  return shortSaved().map((snapshot) => (snapshot.at < 400 ? snapshot : { ...snapshot, regions: [{ node: "r", host: "n", politeness: "polite", text: "Saved" }] }));
}

describe("expectAnnouncements", () => {
  it("asserts the expected list under both rules: a list only one rule gives fails, either way", () => {
    // "Saved" is rendered but shorter than D: the rendered rule counts it, the settled rule does not.
    expect(() => {
      expectAnnouncements(shortSaved(), []);
    }).toThrow();
    expect(() => {
      expectAnnouncements(shortSaved(), [{ text: "Saved", politeness: "polite", host: "n" }]);
    }).toThrow();
  });

  it("passes when both rules give the expected list", () => {
    expect(() => {
      expectAnnouncements(keptSaved(), [{ text: "Saved", politeness: "polite", host: "n" }]);
    }).not.toThrow();
    expect(() => {
      expectAnnouncements(keptSaved(), []);
    }).toThrow();
  });

  it.each([
    ["twice", [{ text: "Saved", politeness: "polite", host: "n" }, { text: "Saved", politeness: "polite", host: "n" }]],
    ["another text", [{ text: "Done", politeness: "polite", host: "n" }]],
    ["another politeness", [{ text: "Saved", politeness: "assertive", host: "n" }]],
    ["another host", [{ text: "Saved", politeness: "polite", host: null }]],
  ] as const)("fails on %s", (_, expected) => {
    expect(() => {
      expectAnnouncements(keptSaved(), expected);
    }).toThrow();
    expect(announcements(keptSaved(), "settled").length).toBe(1);
  });

  it("uses the delays it is given for the settled rule", () => {
    expect(() => {
      expectAnnouncements(shortSaved(), [{ text: "Saved", politeness: "polite", host: "n" }], { loaded: 50, loading: 50 });
    }).not.toThrow();
    expect(() => {
      expectAnnouncements(shortSaved(), [{ text: "Saved", politeness: "polite", host: "n" }], { loaded: 150, loading: 350 });
    }).toThrow();
  });
});
