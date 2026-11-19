// The tested frames of 009 (spec § Frames; research.md R-17, PLAN-TESTABILITY-1-008): the boxes the layout scenarios
// mount their elements in, one `[data-frame]` rule each in test/fixtures/frames.css, the one frame source. The frames
// are test oracles with margins as small as 18 px, so each is measured here at its viewport in both harnesses: Frame W
// (the 1280 px window beside a context sidebar) and Frame R (the same window with the rail only) at 1280 px, Frame N
// at 720 px and Frame S at 320 px. Each harness asserts the page's `innerWidth` beside the frame's inline size, so a
// frame measured at the wrong viewport fails: a fixed px box measures the same at any viewport wider than it.
import type { Driver } from "./driver.ts";

/** A frame, the viewport it is used at and its inline size in px, written from the spec. */
export interface FrameCase {
  readonly frame: "W" | "R" | "N" | "S";
  readonly viewport: { readonly width: number; readonly height: number };
  readonly inlineSize: number;
}

export const frameCases: readonly FrameCase[] = [
  { frame: "W", viewport: { width: 1280, height: 800 }, inlineSize: 876 },
  { frame: "R", viewport: { width: 1280, height: 800 }, inlineSize: 1196 },
  { frame: "N", viewport: { width: 720, height: 800 }, inlineSize: 636 },
  { frame: "S", viewport: { width: 320, height: 800 }, inlineSize: 288 },
];

/** Sets the frame's viewport, mounts an empty `[data-frame]` box and returns its measured inline size. */
export async function measureFrame(driver: Driver, { frame, viewport }: FrameCase): Promise<number> {
  await driver.viewport(viewport.width, viewport.height);
  await driver.mount(`<div id="frame" data-frame="${frame}"></div>`);
  return (await driver.box("frame")).width;
}
