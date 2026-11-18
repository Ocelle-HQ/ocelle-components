import { afterEach, describe, expect, it } from "vitest";
import { blockClearanceScroll, blockEdgeState } from "../src/overflow-region.ts";
import "./fixtures/overflow-host-block.ts";
import { inProcessDriver } from "./in-process.ts";
import { overflowBlockGuards, overflowBlockScenarios } from "./scenarios/overflow-block.ts";

// The overflow-region module's block-axis option, in process on the module's source (019 FR-018;
// contracts/overflow-region-block-axis.md § Tests and § Pure functions; research.md R-18; tasks.md T079), so Stryker's
// mutants of src/overflow-region.ts are killed: the shared bodies of scenarios/overflow-block.ts on the block host
// (test/fixtures/overflow-host-block.ts), and the pure `blockEdgeState` and `blockClearanceScroll` cases, written by
// hand from the contract with spike-2's figures. The same shared bodies run on the strict-CSP fixture in
// test/browser/overflow-region-block.test.ts. 009's own tests (test/overflow-region.test.ts, test/overflow-host.test.ts
// and the rest) are not edited.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
});

describe("the block-axis option, in process (FR-018)", { timeout: 60_000 }, () => {
  it.each([...overflowBlockScenarios, ...overflowBlockGuards])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("blockEdgeState (contract § Pure functions)", () => {
  it.each([
    { name: "no block overflow: 1 px over the client height is not overflow", args: [0, 301, 300, 32, 32], expected: { overflowingBlock: false, offBlockEnd: false, room: true } },
    { name: "block overflow past the 1 px tolerance, content below", args: [0, 301.5, 300, 32, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: true } },
    { name: "content below in a 300 px box (space 268 px against twice the 32 px depth)", args: [0, 637, 300, 32, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: true } },
    { name: "at the block end within 1 px", args: [336, 637, 300, 32, 32], expected: { overflowingBlock: true, offBlockEnd: false, room: true } },
    { name: "just over 1 px from the end", args: [335.5, 637, 300, 32, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: true } },
    { name: "a 100 px box with the pinned box's edge at 32 px: space 68 px, met", args: [0, 637, 100, 32, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: true } },
    { name: "a 95 px box with the edge at 32 px: space 63 px, not met", args: [0, 637, 95, 32, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: false } },
    { name: "a 100 px box under a two-line caption, the edge at 80.6 px: space 19.4 px, not met", args: [0, 685, 100, 80.6, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: false } },
    { name: "a 140 px box with the edge at 56.6 px: space 83.4 px, met", args: [0, 685, 140, 56.6, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: true } },
    { name: "exactly twice the depth is met (96 − 32 = 64)", args: [0, 637, 96, 32, 32], expected: { overflowingBlock: true, offBlockEnd: true, room: true } },
  ] as const)("$name", ({ args: [scrollTop, scrollHeight, clientHeight, pinnedEnd, fade], expected }) => {
    expect(blockEdgeState(scrollTop, scrollHeight, clientHeight, pinnedEnd, fade)).toEqual(expected);
  });
});

// A box whose client area spans 100 to 400 px in the viewport, scrolled to 200 of a 700 px range, a pinned box whose
// current block-end edge is 32 px below the client start (132 px in the viewport) and a 32 px fade (its block-start
// edge at 368 px while it shows).
const box = { top: 100, bottom: 400, scrollTop: 200, scrollHeight: 1000, clientHeight: 300 };

describe("blockClearanceScroll (contract § Pure functions)", () => {
  it.each([
    { name: "already clear: unchanged", input: { ring: { top: 200, bottom: 230 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 200, suppressEnd: false } },
    { name: "under the pinned box: scrolled back until its top is at the pinned box's edge", input: { ring: { top: 110, bottom: 140 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 178, suppressEnd: false } },
    { name: "in the block-end fade: scrolled on until its end is at the fade's edge", input: { ring: { top: 350, bottom: 380 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 212, suppressEnd: false } },
    { name: "below the client end: scrolled until clear of the fade, which still shows there", input: { ring: { top: 420, bottom: 450 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 282, suppressEnd: false } },
    { name: "near the end where the fade goes: to the range's end", input: { ring: { top: 380, bottom: 395 }, box: { ...box, scrollTop: 690 }, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 700, suppressEnd: false } },
    { name: "taller than the space: its top aligned at the pinned box's edge and the fade suppressed", input: { ring: { top: 150, bottom: 450 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 218, suppressEnd: true } },
    { name: "clamped at the block start", input: { ring: { top: 50, bottom: 80 }, box: { ...box, scrollTop: 10 }, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 0, suppressEnd: false } },
    { name: "clamped at the block end", input: { ring: { top: 900, bottom: 930 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 700, suppressEnd: false } },
    { name: "before the pinned box, between the client start and the pinned box's edge: unchanged", input: { ring: { top: 115, bottom: 140 }, box, pinnedEnd: 32, fade: 32, before: true }, expected: { scrollTop: 200, suppressEnd: false } },
    { name: "the same ring box not before the pinned box: moved below it", input: { ring: { top: 115, bottom: 140 }, box, pinnedEnd: 32, fade: 32, before: false }, expected: { scrollTop: 183, suppressEnd: false } },
    { name: "before the pinned box, above the client start: scrolled back to the client start, not to the pinned box's edge", input: { ring: { top: 90, bottom: 115 }, box, pinnedEnd: 32, fade: 32, before: true }, expected: { scrollTop: 190, suppressEnd: false } },
  ] as const)("$name", ({ input, expected }) => {
    expect(blockClearanceScroll(input)).toEqual(expected);
  });
});
