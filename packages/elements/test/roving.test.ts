import { describe, expect, it } from "vitest";
import { owns, target } from "../src/roving.ts";
import type { Axis, Move } from "../src/roving.ts";

// The keyboard mechanism's pure functions (014 research.md R-04; data-model.md § Roving input; T012), plain cases with
// no DOM, in the in-process `elements` project that the elements Stryker configuration runs (R-13). `target(key, move)`
// gives the index a key moves focus to, or null for a key that is not a move of the axis (Enter, Space, Tab, Escape,
// letters and the other axis's arrows). Moves skip disabled children, which stay in the list (`enabled` false); a move
// with no enabled child to go to stays on the focused child, and every move is null when no child is enabled. The key
// maps: `block` (listbox) ArrowDown and ArrowUp, `inline` (tabs) ArrowRight and ArrowLeft swapped under rtl, `both`
// (segmented choice) Right and Down forward, Left and Up back, Left and Right swapped under rtl; Home and End in each.
// `owns(event, children)`: the keydown's target is one of the children itself and its default is not prevented yet.
// Every expected index is written by hand from R-04.
const five = [true, true, true, true, true];
const move = (index: number, axis: Axis, wrap: boolean, enabled: readonly boolean[] = five, rtl = false): Move => ({ index, enabled, wrap, rtl, axis });

describe("target(key, move): the block axis, no wrap (listbox)", () => {
  it.each([
    { key: "ArrowDown", index: 0, expected: 1 },
    { key: "ArrowDown", index: 3, expected: 4 },
    { key: "ArrowDown", index: 4, expected: 4 },
    { key: "ArrowUp", index: 3, expected: 2 },
    { key: "ArrowUp", index: 0, expected: 0 },
    { key: "Home", index: 3, expected: 0 },
    { key: "End", index: 1, expected: 4 },
    { key: "Home", index: 0, expected: 0 },
    { key: "End", index: 4, expected: 4 },
  ])("$key from $index moves to $expected", ({ key, index, expected }) => {
    expect(target(key, move(index, "block", false))).toBe(expected);
  });

  it.each(["ArrowLeft", "ArrowRight", "Enter", " ", "Tab", "Escape", "a", "g", "PageDown", "PageUp"])("%s is not a move: null, beside ArrowDown from the same child, a move", (key) => {
    expect([target(key, move(2, "block", false)), target("ArrowDown", move(2, "block", false))]).toEqual([null, 3]);
  });

  it("skips disabled children: ArrowDown from alpha over a disabled beta to gamma, ArrowUp back over it", () => {
    const enabled = [true, false, true, true, true];
    expect([target("ArrowDown", move(0, "block", false, enabled)), target("ArrowUp", move(2, "block", false, enabled))]).toEqual([2, 0]);
  });

  it("Home and End skip disabled children at the ends", () => {
    const enabled = [false, true, true, true, false];
    expect([target("Home", move(2, "block", false, enabled)), target("End", move(2, "block", false, enabled))]).toEqual([1, 3]);
  });

  it("stays on the focused child when no enabled child lies in the direction, the focused child disabled too", () => {
    const enabled = [true, true, false, false, false];
    expect([target("ArrowDown", move(1, "block", false, enabled)), target("ArrowDown", move(2, "block", false, enabled)), target("ArrowUp", move(4, "block", false, enabled))]).toEqual([1, 2, 1]);
  });

  it("moves off a disabled focused child to the next enabled one in each direction", () => {
    const enabled = [true, true, false, true, true];
    expect([target("ArrowDown", move(2, "block", false, enabled)), target("ArrowUp", move(2, "block", false, enabled))]).toEqual([3, 1]);
  });

  it("gives null for every move when no child is enabled, beside the same moves with one child enabled", () => {
    const none = [false, false, false];
    const one = [false, false, true];
    expect(["ArrowDown", "ArrowUp", "Home", "End"].map((key) => [target(key, move(1, "block", false, none)), target(key, move(1, "block", false, one))])).toEqual([
      [null, 2],
      [null, 1],
      [null, 2],
      [null, 2],
    ]);
  });

  it("keeps a single child where it is", () => {
    expect(["ArrowDown", "ArrowUp", "Home", "End"].map((key) => target(key, move(0, "block", false, [true])))).toEqual([0, 0, 0, 0]);
  });

  it("is the same under rtl: the block axis does not follow the inline direction", () => {
    expect(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].map((key) => target(key, move(2, "block", false, five, true)))).toEqual([3, 1, null, null]);
  });
});

describe("target(key, move): the inline axis, wrapping (tabs)", () => {
  it.each([
    { key: "ArrowRight", index: 0, rtl: false, expected: 1 },
    { key: "ArrowRight", index: 4, rtl: false, expected: 0 },
    { key: "ArrowLeft", index: 0, rtl: false, expected: 4 },
    { key: "ArrowLeft", index: 3, rtl: false, expected: 2 },
    { key: "ArrowRight", index: 0, rtl: true, expected: 4 },
    { key: "ArrowLeft", index: 4, rtl: true, expected: 0 },
    { key: "ArrowLeft", index: 1, rtl: true, expected: 2 },
    { key: "Home", index: 3, rtl: true, expected: 0 },
    { key: "End", index: 1, rtl: true, expected: 4 },
  ])("$key from $index (rtl $rtl) moves to $expected", ({ key, index, rtl, expected }) => {
    expect(target(key, move(index, "inline", true, five, rtl))).toBe(expected);
  });

  it.each(["ArrowDown", "ArrowUp", "Enter", " ", "Tab", "Escape", "x"])("%s is not a move: null, beside ArrowRight from the same child, a move", (key) => {
    expect([target(key, move(2, "inline", true)), target("ArrowRight", move(2, "inline", true))]).toEqual([null, 3]);
  });

  it("wraps over disabled children at either end", () => {
    const enabled = [false, true, true, true, false];
    expect([target("ArrowRight", move(3, "inline", true, enabled)), target("ArrowLeft", move(1, "inline", true, enabled))]).toEqual([1, 3]);
  });

  it("wraps back to the focused child when it is the only enabled one", () => {
    const enabled = [false, true, false];
    expect([target("ArrowRight", move(1, "inline", true, enabled)), target("ArrowLeft", move(1, "inline", true, enabled))]).toEqual([1, 1]);
  });

  it("gives null for every move when no child is enabled, beside the same moves with one child enabled", () => {
    expect(["ArrowRight", "ArrowLeft", "Home", "End"].map((key) => [target(key, move(0, "inline", true, [false, false])), target(key, move(0, "inline", true, [false, true]))])).toEqual([
      [null, 1],
      [null, 1],
      [null, 1],
      [null, 1],
    ]);
  });
});

describe("target(key, move): both axes, wrapping (segmented choice)", () => {
  it.each([
    { key: "ArrowRight", rtl: false, expected: 3 },
    { key: "ArrowDown", rtl: false, expected: 3 },
    { key: "ArrowLeft", rtl: false, expected: 1 },
    { key: "ArrowUp", rtl: false, expected: 1 },
    { key: "ArrowRight", rtl: true, expected: 1 },
    { key: "ArrowLeft", rtl: true, expected: 3 },
    { key: "ArrowDown", rtl: true, expected: 3 },
    { key: "ArrowUp", rtl: true, expected: 1 },
  ])("$key from 2 (rtl $rtl) moves to $expected", ({ key, rtl, expected }) => {
    expect(target(key, move(2, "both", true, five, rtl))).toBe(expected);
  });

  it("wraps forward from the last and back from the first", () => {
    expect([target("ArrowDown", move(4, "both", true)), target("ArrowUp", move(0, "both", true))]).toEqual([0, 4]);
  });

  it.each(["Enter", " ", "Tab", "Escape", "PageDown"])("%s is not a move: null, beside ArrowDown from the same child, a move", (key) => {
    expect([target(key, move(2, "both", true)), target("ArrowDown", move(2, "both", true))]).toEqual([null, 3]);
  });
});

describe("target(key, move): wrap is the parent's choice", () => {
  it("a block axis with wrap wraps, and an inline axis without wrap stays at the ends", () => {
    expect([target("ArrowDown", move(4, "block", true)), target("ArrowUp", move(0, "block", true)), target("ArrowRight", move(4, "inline", false)), target("ArrowLeft", move(0, "inline", false))]).toEqual([0, 4, 4, 0]);
  });
});

describe("owns(event, children): the origin filter", () => {
  const children = [{ id: "a" }, { id: "b" }];
  const [first, second] = children;

  it("is true for a keydown whose target is one of the children itself and whose default is not prevented", () => {
    expect([owns({ target: first as unknown as EventTarget, defaultPrevented: false }, children), owns({ target: second as unknown as EventTarget, defaultPrevented: false }, children)]).toEqual([true, true]);
  });

  it("is false for a keydown already handled, for a target that is not a child (a panel, a descendant of a child, a nested parent's child) and for no target, beside the same keydown unhandled on a child", () => {
    expect([
      owns({ target: first as unknown as EventTarget, defaultPrevented: false }, children),
      owns({ target: first as unknown as EventTarget, defaultPrevented: true }, children),
      owns({ target: { id: "a" } as unknown as EventTarget, defaultPrevented: false }, children),
      owns({ target: null, defaultPrevented: false }, children),
      owns({ target: first as unknown as EventTarget, defaultPrevented: false }, []),
    ]).toEqual([true, false, false, false, false]);
  });
});
