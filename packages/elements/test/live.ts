// The live-region capture shared by both harnesses (specs/010-feedback-forms research.md R-01; contracts/testing.md
// § Live-region capture): a paused-mutation recorder in the page, read over CDP at each pause and at each rendering
// update, so that `stop()` returns the snapshot list the reading of live-reading.ts counts. The in-process harness
// reaches it through browser commands registered in the repository root's vitest.config.ts beside `axTree`; the
// fixture pages through `fixtureCapture` over the page's own CDP session.
//
// Phase 1 red commit (T001d): signature-only stubs. Nothing is armed and no browser command is called; T004
// implements the capture and registers its commands.
import type { Page } from "playwright";
import type { BrowserCommandContext } from "vitest/node";
import type { Delays, Snapshot } from "./live-reading.ts";

export type { Delays, Snapshot } from "./live-reading.ts";

/** Options of `stop`: wait at least `atLeast` milliseconds of page time since the capture started first. */
export interface StopOptions {
  readonly atLeast?: number;
}

/** The capture as a step of the driver. */
export interface LiveCapture {
  /** Arms the recorder on the element with `containerId` and returns when armed. */
  start(containerId: string): Promise<void>;
  /** Waits for the quiet window (after `atLeast`), takes the final snapshot, disarms and returns the snapshots. */
  stop(options?: StopOptions): Promise<Snapshot[]>;
}

/** The capture on fixture pages, with the document mode. */
export interface DocumentCapture extends LiveCapture {
  /** Installs the recorder before navigation and navigates to `url`, so the recorder sees the document's first node. */
  startDocument(url: string): Promise<void>;
}

/** The capture of a fixture page over its own CDP session (stub: arms nothing, `stop` returns no snapshot). */
export const fixtureCapture: (page: Page, delays?: Delays) => DocumentCapture & { readonly dispose: () => Promise<void> } = () => ({
  start: () => Promise.resolve(),
  startDocument: () => Promise.resolve(),
  stop: () => Promise.resolve([]),
  dispose: () => Promise.resolve(),
});

/** The `liveStart(containerId, delays)` browser command (stub: arms nothing). */
export const liveStart: (context: BrowserCommandContext, containerId: string, delays: Delays) => Promise<void> = () => Promise.resolve();

/** The `liveStop(options)` browser command (stub: no snapshot). */
export const liveStop: (context: BrowserCommandContext, options?: StopOptions) => Promise<Snapshot[]> = () => Promise.resolve([]);
