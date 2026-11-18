import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { frameCases, measureFrame } from "./scenarios/frames.ts";

// The tested frames of 009, in process (research.md R-17, PLAN-TESTABILITY-1-008; T005): each frame's `[data-frame]`
// box, sized by test/fixtures/frames.css, measured at its viewport, with the iframe's `innerWidth` asserted beside it.
// The same bodies run on the strict-CSP fixture page in test/browser/frames.test.ts.
const driver = inProcessDriver();

describe("the frames, in process", () => {
  it.each(frameCases)("Frame $frame measures $inlineSize px at a $viewport.width px viewport", async (frame) => {
    const inlineSize = await measureFrame(driver, frame);
    expect({ innerWidth: window.innerWidth, inlineSize }).toEqual({ innerWidth: frame.viewport.width, inlineSize: frame.inlineSize });
  });
});
