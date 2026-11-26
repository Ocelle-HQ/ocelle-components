// The unit-test cases of the live-region reading (specs/010-feedback-forms T001; research.md R-09; contracts/testing.md
// § Live-region capture, § Plants "oracle reading"). Each case is written once, as a function that takes a reading
// (`{ regionText, announcements }`) and asserts; live.test.ts runs every case with the reading of live-reading.ts, and
// the oracle rows of plants.test.ts run a named case with a planted reading (test/fixtures/reading-plants.ts), which
// must make it fail. The reading rules run on the node lists of test/fixtures/ax/, recorded from Chromium; the keeping
// rules and the vacuous cases on hand-written snapshot sequences. Expected texts and counts are written by hand from
// the spec's "What 'announced' means here" and the planted markup in each node list's header.
import { expect } from "vitest";
import { ignored as ignoredNodes } from "./fixtures/ax/ignored.ts";
import { img } from "./fixtures/ax/img.ts";
import { inlineTextBoxes } from "./fixtures/ax/inline-text-boxes.ts";
import { link } from "./fixtures/ax/link.ts";
import { nested } from "./fixtures/ax/nested.ts";
import { staticText } from "./fixtures/ax/static-text.ts";
import { whitespace } from "./fixtures/ax/whitespace.ts";
import type { Announcement, AxRecord, Delays, Politeness, Rule, Snapshot } from "./live-reading.ts";

/** A reading: the two pure functions the capture's oracle is made of. */
export interface Reading {
  readonly regionText: (nodes: readonly AxRecord[], region: string) => string;
  readonly announcements: (snapshots: readonly Snapshot[], rule: Rule, delays?: Delays) => Announcement[];
}

/** One case: its name and its body, which throws an assertion error when the reading breaks the rule. */
export interface Case {
  readonly name: string;
  readonly run: (reading: Reading) => void;
}

/** The accessibility node id of the live region of `politeness` in a recorded list (the planted markup's region). */
function region(nodes: readonly AxRecord[], politeness: Politeness = "polite"): string {
  const found = nodes.find((node) => node.properties?.some((property) => property.name === "live" && property.value.value === politeness));
  if (found === undefined) throw new Error(`the node list holds no ${politeness} region`);
  return found.nodeId;
}

/** The nodes of the subtree under the node `id`, in tree order. */
function subtree(nodes: readonly AxRecord[], id: string): AxRecord[] {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const found: AxRecord[] = [];
  const walk = (at: string): void => {
    for (const child of byId.get(at)?.childIds ?? []) {
      const node = byId.get(child);
      if (node === undefined) continue;
      found.push(node);
      walk(child);
    }
  };
  walk(id);
  return found;
}

const role = (node: AxRecord): unknown => node.role?.value;

/** The names of the nodes under the first node of `role` named `name`. */
function namesUnder(nodes: readonly AxRecord[], ofRole: string, name: string): unknown[] {
  const found = nodes.find((node) => role(node) === ofRole && node.name?.value === name);
  return found === undefined ? [] : subtree(nodes, found.nodeId).map((node) => node.name?.value);
}

/** The name of the first node of `role`. */
function nameOf(nodes: readonly AxRecord[], ofRole: string): unknown {
  return nodes.find((node) => role(node) === ofRole)?.name?.value;
}

/** Each node's role and name. */
function rolesAndNames(nodes: readonly AxRecord[]): unknown[][] {
  return nodes.map((node) => [role(node), node.name?.value]);
}

/** The number of ignored nodes. */
function ignoredCount(nodes: readonly AxRecord[]): number {
  return nodes.filter((node) => node.ignored).length;
}

/** The announcements under `rule` as text, politeness and node. */
function projected(reading: Reading, snapshots: readonly Snapshot[], rule: Rule): unknown[] {
  return reading.announcements(snapshots, rule).map(({ text, politeness, node }) => ({ text, politeness, node }));
}

// The hand-written snapshot sequences. `D` is Chromium's (150 ms loaded, 350 ms loading) unless a case says otherwise.
type Entry = readonly [node: string, text: string, politeness?: Politeness];

/** A snapshot at `at` of the regions `entries` (host null); `lifecycle` and `loaded` as given. */
function snap(at: number, lifecycle: boolean, entries: readonly Entry[], loaded = true): Snapshot {
  return {
    at,
    frame: Math.floor(at / 16),
    lifecycle,
    loaded,
    regions: entries.map(([node, text, politeness = "polite"]) => ({ node, host: null, politeness, text })),
    hosts: [],
  };
}

/** Lifecycle snapshots every 16 ms from `from` to `to` (exclusive) of the regions `entries`. */
function frames(from: number, to: number, entries: readonly Entry[], loaded = true): Snapshot[] {
  const made: Snapshot[] = [];
  for (let at = from; at < to; at += 16) made.push(snap(at, true, entries, loaded));
  return made;
}

/** The texts the reading counts under `rule`. */
function counted(reading: Reading, snapshots: readonly Snapshot[], rule: Rule, delays?: Delays): string[] {
  return reading.announcements(snapshots, rule, delays).map((announcement) => announcement.text);
}

/** Under both rules. */
function both(reading: Reading, snapshots: readonly Snapshot[], delays?: Delays): { settled: string[]; rendered: string[] } {
  return { settled: counted(reading, snapshots, "settled", delays), rendered: counted(reading, snapshots, "rendered", delays) };
}

/** A region empty from 0 to 400, "Saved" written at 400 (a mutation pause) and kept to the end (1200). */
function savedKept(): Snapshot[] {
  return [snap(0, false, [["r", ""]]), ...frames(16, 400, [["r", ""]]), snap(400, false, [["r", "Saved"]]), ...frames(416, 1200, [["r", "Saved"]]), snap(1200, false, [["r", "Saved"]])];
}

export const cases: readonly Case[] = [
  {
    name: "StaticText taken",
    run: ({ regionText }) => {
      expect(regionText(staticText, region(staticText))).toBe("Saved all changes");
    },
  },
  {
    name: "an img's name taken and its descendants not visited",
    run: ({ regionText }) => {
      // The recorded list holds the role="img" span's StaticText child "inner", which the reading must not visit.
      expect(namesUnder(img, "image", "Star")).toContain("inner");
      expect(regionText(img, region(img))).toBe("Disk full Star now");
    },
  },
  {
    name: "a link's own name skipped and its StaticText children taken",
    run: ({ regionText }) => {
      expect(nameOf(link, "link")).toBe("Report link");
      expect(regionText(link, region(link))).toBe("Open the report");
    },
  },
  {
    name: "inline text boxes skipped",
    run: ({ regionText }) => {
      expect(rolesAndNames(subtree(inlineTextBoxes, region(inlineTextBoxes)))).toEqual([
        ["StaticText", "Saved"],
        ["InlineTextBox", "Saved"],
      ]);
      expect(regionText(inlineTextBoxes, region(inlineTextBoxes))).toBe("Saved");
    },
  },
  {
    name: "an ignored subtree contributes nothing",
    run: ({ regionText }) => {
      expect(ignoredCount(subtree(ignoredNodes, region(ignoredNodes)))).toBeGreaterThan(0);
      expect(regionText(ignoredNodes, region(ignoredNodes))).toBe("Kept");
    },
  },
  {
    name: "whitespace collapsed and trimmed, each taken name as if surrounded by a space",
    run: ({ regionText }) => {
      expect(regionText(whitespace, region(whitespace))).toBe("Saved all changes now !");
    },
  },
  {
    name: "a nested region's text is in its own and in the outer region's text",
    run: ({ regionText }) => {
      expect([regionText(nested, region(nested, "polite")), regionText(nested, region(nested, "assertive"))]).toEqual(["Outer Inner", "Inner"]);
    },
  },
  {
    name: "a state set and cleared in one task is kept by neither rule",
    run: (reading) => {
      // "Saved" at 400 and "" at 400.5 in the same task: seen by a mutation pause, current in no lifecycle snapshot.
      const flicker = [snap(0, false, [["r", ""]]), ...frames(16, 400, [["r", ""]]), snap(400, false, [["r", "Saved"]]), snap(400.5, false, [["r", ""]]), ...frames(416, 1200, [["r", ""]]), snap(1200, false, [["r", ""]])];
      expect({ flicker: both(reading, flicker), kept: both(reading, savedKept()) }).toEqual({
        flicker: { settled: [], rendered: [] },
        kept: { settled: ["Saved"], rendered: ["Saved"] },
      });
    },
  },
  {
    name: "a state cleared in the first animation frame is kept by neither rule",
    run: (reading) => {
      // "Saved" at 400, cleared at 410 in the next frame's animation callbacks, before that frame's lifecycle hook (416).
      const frame = [snap(0, false, [["r", ""]]), ...frames(16, 400, [["r", ""]]), snap(400, false, [["r", "Saved"]]), snap(410, false, [["r", ""]]), ...frames(416, 1200, [["r", ""]]), snap(1200, false, [["r", ""]])];
      expect({ frame: both(reading, frame), kept: both(reading, savedKept()) }).toEqual({
        frame: { settled: [], rendered: [] },
        kept: { settled: ["Saved"], rendered: ["Saved"] },
      });
    },
  },
  {
    name: "a state shorter than D is rendered but not settled; one of D is settled",
    run: (reading) => {
      // "Saved" from 400 to 500 (100 ms, in lifecycle snapshots), then "": shorter than 150 ms.
      const short = [snap(0, false, [["r", ""]]), ...frames(16, 400, [["r", ""]]), snap(400, false, [["r", "Saved"]]), ...frames(416, 500, [["r", "Saved"]]), snap(500, false, [["r", ""]]), ...frames(512, 1200, [["r", ""]]), snap(1200, false, [["r", ""]])];
      // "Saved" from 400 to 550 (150 ms).
      const long = [snap(0, false, [["r", ""]]), ...frames(16, 400, [["r", ""]]), snap(400, false, [["r", "Saved"]]), ...frames(416, 550, [["r", "Saved"]]), snap(550, false, [["r", ""]]), ...frames(560, 1200, [["r", ""]]), snap(1200, false, [["r", ""]])];
      expect({ short: both(reading, short), long: both(reading, long) }).toEqual({
        short: { settled: [], rendered: ["Saved"] },
        long: { settled: ["Saved"], rendered: ["Saved"] },
      });
    },
  },
  {
    name: "D is 350 ms while the page loads and the delays given replace Chromium's",
    run: (reading) => {
      // "Saved" for 200 ms after 400 ms of empty region, the page loading: under 350 ms; the same with the page
      // loaded: over 150 ms; and while loading with a given D of 50 ms.
      const sequence = (loaded: boolean): Snapshot[] => [
        snap(0, false, [["r", ""]], loaded),
        ...frames(16, 400, [["r", ""]], loaded),
        snap(400, false, [["r", "Saved"]], loaded),
        ...frames(416, 600, [["r", "Saved"]], loaded),
        snap(600, false, [["r", ""]], loaded),
        ...frames(608, 1600, [["r", ""]], loaded),
        snap(1600, false, [["r", ""]], loaded),
      ];
      expect({
        loading: counted(reading, sequence(false), "settled"),
        loaded: counted(reading, sequence(true), "settled"),
        given: counted(reading, sequence(false), "settled", { loaded: 50, loading: 50 }),
      }).toEqual({ loading: [], loaded: ["Saved"], given: ["Saved"] });
    },
  },
  {
    name: "a region whose text never changes counts zero",
    run: (reading) => {
      const still = [snap(0, false, [["r", "Ready"]]), ...frames(16, 1200, [["r", "Ready"]]), snap(1200, false, [["r", "Ready"]])];
      const changed = [snap(0, false, [["r", "Ready"]]), ...frames(16, 400, [["r", "Ready"]]), snap(400, false, [["r", "Done"]]), ...frames(416, 1200, [["r", "Done"]]), snap(1200, false, [["r", "Done"]])];
      expect({ still: both(reading, still), changed: both(reading, changed) }).toEqual({
        still: { settled: [], rendered: [] },
        changed: { settled: ["Done"], rendered: ["Done"] },
      });
    },
  },
  {
    name: "a region that appears holding text counts zero",
    run: (reading) => {
      const appears = [snap(0, false, []), ...frames(16, 400, []), snap(400, false, [["r", "Saved"]]), ...frames(416, 1200, [["r", "Saved"]]), snap(1200, false, [["r", "Saved"]])];
      const filled = [snap(0, false, []), ...frames(16, 20, []), snap(20, false, [["r", ""]]), ...frames(32, 400, [["r", ""]]), snap(400, false, [["r", "Saved"]]), ...frames(416, 1200, [["r", "Saved"]]), snap(1200, false, [["r", "Saved"]])];
      expect({ appears: both(reading, appears), filled: both(reading, filled) }).toEqual({
        appears: { settled: [], rendered: [] },
        filled: { settled: ["Saved"], rendered: ["Saved"] },
      });
    },
  },
  {
    name: "a nested region pair whose texts both change counts two",
    run: (reading) => {
      const empty: Entry[] = [["outer", "", "polite"], ["inner", "", "assertive"]];
      const full: Entry[] = [["outer", "Outer Inner", "polite"], ["inner", "Inner", "assertive"]];
      const pair = [snap(0, false, empty), ...frames(16, 400, empty), snap(400, false, full), ...frames(416, 1200, full), snap(1200, false, full)];
      const expected = [
        { text: "Outer Inner", politeness: "polite", node: "outer" },
        { text: "Inner", politeness: "assertive", node: "inner" },
      ];
      expect({ settled: projected(reading, pair, "settled"), rendered: projected(reading, pair, "rendered") }).toEqual({ settled: expected, rendered: expected });
    },
  },
];

/** The case named `name`. */
export function caseNamed(name: string): Case {
  const found = cases.find((each) => each.name === name);
  if (found === undefined) throw new Error(`no case named "${name}"`);
  return found;
}
