// The live-region oracle of the capture (specs/010-feedback-forms research.md R-01, R-09; contracts/testing.md
// § Live-region capture): pure functions, no browser. `regionText` reads a live region's text from a
// `Accessibility.getFullAXTree` node list as the spec's "What 'announced' means here" defines it; `announcements`
// keeps, per region node, the region states that satisfy a keeping rule and counts the announcements among them;
// `expectAnnouncements` asserts one expected list under both rules. The unit tests are the cases of live-rules.ts,
// run by live.test.ts.
import { expect } from "vitest";

/** A value of the accessibility protocol (`AXValue`): only `value` is read. */
export interface AxValue {
  readonly type?: string;
  readonly value?: unknown;
  readonly [field: string]: unknown;
}

/** A property of an accessibility node (`AXProperty`). */
export interface AxProperty {
  readonly name: string;
  readonly value: AxValue;
  readonly [field: string]: unknown;
}

/** One node of `Accessibility.getFullAXTree`, as the protocol returns it; the fields the reading uses are typed. */
export interface AxRecord {
  readonly nodeId: string;
  readonly ignored: boolean;
  readonly role?: AxValue;
  readonly name?: AxValue;
  readonly properties?: readonly AxProperty[];
  readonly parentId?: string;
  readonly childIds?: readonly string[];
  readonly backendDOMNodeId?: number;
  readonly [field: string]: unknown;
}

/** A live politeness. */
export type Politeness = "polite" | "assertive";

/** One live region node in a snapshot. */
export interface Region {
  /** A stable key of the region's DOM node: its backend node id. */
  readonly node: string;
  /** The id of the nearest `ocelle-*` host at or above the region, or null. */
  readonly host: string | null;
  readonly politeness: Politeness;
  /** The region's text (`regionText`). */
  readonly text: string;
}

/** The role of an `ocelle-*` host's own accessibility node (`"none"` when the node is ignored). */
export interface HostRole {
  readonly host: string;
  readonly role: string;
}

/** One snapshot of the capture. */
export interface Snapshot {
  /** `performance.now()` in the page. */
  readonly at: number;
  /** The number of rendering updates seen so far. */
  readonly frame: number;
  /** Taken by the post-lifecycle frame hook rather than at a mutation pause. */
  readonly lifecycle: boolean;
  /** `document.readyState` was `"complete"`. */
  readonly loaded: boolean;
  readonly regions: readonly Region[];
  readonly hosts: readonly HostRole[];
}

/** The keeping rule: states current in a lifecycle snapshot (`"rendered"`), and for at least `D` (`"settled"`). */
export type Rule = "settled" | "rendered";

/** One announcement: the region's text and politeness in the later of the two states. */
export interface Announcement {
  readonly text: string;
  readonly politeness: Politeness;
  readonly node: string;
  readonly host: string | null;
}

/** What an announcement assertion states: text, politeness and host. */
export type Expected = Pick<Announcement, "text" | "politeness" | "host">;

/** The serialisation delay `D` by the page's load state when a state began, in milliseconds. */
export interface Delays {
  readonly loaded: number;
  readonly loading: number;
}

/**
 * Chromium's serialisation delay (`AXObjectCacheImpl::GetDeferredEventsDelay()`, ax_object_cache_impl.cc, read
 * 2026-11-13): 150 ms after page load, 350 ms before (research R-01).
 */
export const chromiumDelays: Delays = { loaded: 150, loading: 350 };

/** A protocol value as text: a string as it is, anything else as the empty string. */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * The text of the live region with accessibility node id `region` in `nodes`: its descendants in tree order, the name
 * of each non-ignored StaticText node and of each non-ignored `img` node (Chromium's role `image`) taken, an `img`'s
 * descendants not visited, every other name skipped (a link's name is not taken, its StaticText children are), inline
 * text boxes skipped, ignored nodes contributing nothing; each taken name counts as if surrounded by a space and the
 * result has whitespace collapsed and trimmed.
 */
export function regionText(nodes: readonly AxRecord[], region: string): string {
  const byId = new Map(nodes.map((node) => [node.nodeId, node]));
  const taken: string[] = [];
  const visit = (id: string): void => {
    const node = byId.get(id);
    if (node === undefined) return;
    const role = text(node.role?.value);
    if (role === "InlineTextBox") return;
    if (!node.ignored && (role === "StaticText" || role === "image" || role === "img")) {
      taken.push(text(node.name?.value));
      return;
    }
    for (const child of node.childIds ?? []) visit(child);
  };
  for (const child of byId.get(region)?.childIds ?? []) visit(child);
  return ` ${taken.join(" ")} `.replace(/\s+/g, " ").trim();
}

interface State {
  readonly region: Region | null;
  readonly start: number;
  readonly end: number;
}

const same = (a: Region | null, b: Region | null): boolean =>
  a === null || b === null ? a === b : a.text === b.text && a.politeness === b.politeness && a.host === b.host;

/** The states of region `node` over `snapshots`: maximal runs of snapshots in which it is equal, or absent. */
function statesOf(snapshots: readonly Snapshot[], node: string): State[] {
  const states: State[] = [];
  let start = 0;
  for (let index = 1; index <= snapshots.length; index += 1) {
    const before = snapshots[start]?.regions.find((each) => each.node === node) ?? null;
    const now = index < snapshots.length ? (snapshots[index]?.regions.find((each) => each.node === node) ?? null) : undefined;
    if (now === undefined || !same(before, now)) {
      states.push({ region: before, start, end: index });
      start = index;
    }
  }
  return states;
}

/** Whether `state` satisfies `rule`: current in a lifecycle snapshot, and for `"settled"` for at least `D`. */
function kept(snapshots: readonly Snapshot[], state: State, rule: Rule, delays: Delays): boolean {
  const run = snapshots.slice(state.start, state.end);
  const rendered = run.some((snapshot) => snapshot.lifecycle);
  if (rule === "rendered") return rendered;
  const first = snapshots[state.start];
  const last = snapshots[Math.min(state.end, snapshots.length - 1)];
  if (first === undefined || last === undefined) return false;
  const delay = first.loaded ? delays.loaded : delays.loading;
  return rendered && last.at - first.at >= delay;
}

/**
 * The announcements in `snapshots` under `rule`: per region node, the states that satisfy the rule are kept, and each
 * two consecutive kept states in which the region is present and whose text changed to a non-empty text are one
 * announcement, with the later state's text, politeness and host. In the order they happened.
 */
export function announcements(snapshots: readonly Snapshot[], rule: Rule, delays: Delays = chromiumDelays): Announcement[] {
  const nodes = [...new Set(snapshots.flatMap((snapshot) => snapshot.regions.map((region) => region.node)))];
  const found: { readonly at: number; readonly announcement: Announcement }[] = [];
  for (const node of nodes) {
    const states = statesOf(snapshots, node).filter((state) => kept(snapshots, state, rule, delays));
    for (let index = 1; index < states.length; index += 1) {
      const before = states[index - 1]?.region ?? null;
      const after = states[index];
      const region = after?.region ?? null;
      if (after === undefined || before === null || region === null || region.text === "" || region.text === before.text) continue;
      found.push({ at: after.start, announcement: { text: region.text, politeness: region.politeness, node, host: region.host } });
    }
  }
  return found.sort((a, b) => a.at - b.at).map((each) => each.announcement);
}

/** Asserts that `snapshots` hold exactly `expected` (text, politeness and host, in order) under both rules. */
export function expectAnnouncements(snapshots: readonly Snapshot[], expected: readonly Expected[], delays: Delays = chromiumDelays): void {
  const project = (rule: Rule): Expected[] => announcements(snapshots, rule, delays).map(({ text, politeness, host }) => ({ text, politeness, host }));
  expect({ settled: project("settled"), rendered: project("rendered") }).toEqual({ settled: expected, rendered: expected });
}
