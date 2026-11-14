// The live-region oracle of the capture (specs/010-feedback-forms research.md R-01, R-09; contracts/testing.md
// § Live-region capture): pure functions, no browser. `regionText` reads a live region's text from a
// `Accessibility.getFullAXTree` node list as the spec's "What 'announced' means here" defines it; `announcements`
// keeps, per region node, the region states that satisfy a keeping rule and counts the announcements among them;
// `expectAnnouncements` asserts one expected list under both rules. The unit tests are the cases of live-rules.ts,
// run by live.test.ts.
//
// Phase 1 red commit (T001d): signature-only stubs; T003 implements them.

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

/** The text of the live region with accessibility node id `region` in `nodes` (stub: the empty text). */
export const regionText: (nodes: readonly AxRecord[], region: string) => string = () => "";

/** The announcements in `snapshots` under `rule`, with `D` from `delays` (stub: none). */
export const announcements: (snapshots: readonly Snapshot[], rule: Rule, delays?: Delays) => Announcement[] = () => [];

/** Asserts that `snapshots` hold exactly `expected` under both rules, with `D` from `delays` (stub: asserts nothing). */
export const expectAnnouncements: (snapshots: readonly Snapshot[], expected: readonly Expected[], delays?: Delays) => void = () => undefined;
