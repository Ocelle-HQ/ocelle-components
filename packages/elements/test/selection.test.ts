import { describe, expect, it } from "vitest";
import { SelectionModel, batch, childValue, fallback, focusIn, focusOut, hostSet, noFocus, tabStop, takeBlurred, userSelect, valueOf } from "../src/selection.ts";
import type { Entry, FocusRecord, Selection } from "../src/selection.ts";

// The selection model's pure functions (014 research.md R-03, R-05; data-model.md § Child entry, § Selection state,
// § Batching, § Transitions; spec FR-009 to FR-011a, FR-016; T013), plain cases with no DOM, in the in-process
// `elements` project that the elements Stryker configuration runs (R-13). Children are plain data: a node (here a
// string), its value with FR-009's default applied, and whether it is disabled. Every expected outcome is written by
// hand from the data model's transition table and the spec's scenarios (US1-11, US1-14, US1-17 to US1-19, US2-17 to
// US2-20, US3-15 to US3-17).
const e = (node: string, value: string, disabled = false): Entry<string> => ({ node, value, disabled });
const none: Selection<string> = { selected: null, remembered: null };
const picked = (selected: string | null, remembered: string | null = null): Selection<string> => ({ selected, remembered });

const folders = [e("a", "alpha"), e("b", "beta"), e("g", "gamma"), e("d", "delta"), e("p", "epsilon")];

describe("childValue(attribute, index): FR-009's default", () => {
  it.each([
    { attribute: "alpha", index: 0, expected: "alpha" },
    { attribute: null, index: 2, expected: "2" },
    { attribute: "", index: 1, expected: "1" },
    { attribute: "   ", index: 3, expected: "3" },
    { attribute: "\t\n", index: 0, expected: "0" },
    { attribute: " beta ", index: 0, expected: " beta " },
    { attribute: "0", index: 4, expected: "0" },
  ])("value $attribute at index $index is $expected (never empty, not trimmed)", ({ attribute, index, expected }) => {
    expect(childValue(attribute, index)).toBe(expected);
  });
});

describe("valueOf(state, entries)", () => {
  it("is the selected child's current value, and empty with no selection or a selection no longer present", () => {
    expect([valueOf(picked("g"), folders), valueOf(none, folders), valueOf(picked("z"), folders), valueOf(picked("g"), [e("g", "2")])]).toEqual(["gamma", "", "", "2"]);
  });
});

describe("hostSet: the listbox (FR-010, FR-010a; US1-11, US1-17 to US1-19)", () => {
  it("selects the first enabled child with the value and forgets a remembered value", () => {
    const twins = [e("a", "alpha"), e("s1", "same"), e("s2", "same")];
    expect([hostSet("listbox", none, folders, "delta"), hostSet("listbox", picked(null, "zeta"), folders, "beta"), hostSet("listbox", none, twins, "same")]).toEqual([
      picked("d"),
      picked("b"),
      picked("s1"),
    ]);
  });

  it("clears the selection for an empty value, and forgets", () => {
    expect([hostSet("listbox", picked("g"), folders, ""), hostSet("listbox", picked(null, "zeta"), folders, "")]).toEqual([none, none]);
  });

  it("clears the selection and remembers a value no enabled child has, a disabled child's included", () => {
    const disabledDelta = [e("a", "alpha"), e("d", "delta", true)];
    expect([hostSet("listbox", picked("g"), folders, "zeta"), hostSet("listbox", none, disabledDelta, "delta")]).toEqual([picked(null, "zeta"), picked(null, "delta")]);
  });

  it("is a no-op on the selection for the current value, even a disabled selected child's or the second of two with the value, and forgets, beside a set of another value that selects", () => {
    const disabledGamma = [e("a", "alpha"), e("g", "gamma", true)];
    const twins = [e("s1", "same"), e("s2", "same")];
    expect([
      hostSet("listbox", picked("g", "zeta"), disabledGamma, "gamma"),
      hostSet("listbox", picked("s2"), twins, "same"),
      hostSet("listbox", picked(null, "zeta"), folders, ""),
      hostSet("listbox", picked("g"), disabledGamma, "alpha"),
    ]).toEqual([picked("g"), picked("s2"), none, picked("a")]);
  });

  it("a later set replaces a remembered value: a set of another missing value is remembered instead", () => {
    expect(hostSet("listbox", picked(null, "zeta"), folders, "omega")).toEqual(picked(null, "omega"));
  });
});

describe("hostSet: tabs and segments (FR-010, FR-010a)", () => {
  const tabs = [e("s", "spec"), e("p", "plan"), e("t", "tasks")];

  it.each(["tabs", "segments"] as const)("%s: selects the match, keeps the selection for an empty or missing value, remembering a missing one", (kind) => {
    expect([hostSet(kind, picked("s"), tabs, "tasks"), hostSet(kind, picked("p"), tabs, ""), hostSet(kind, picked("p"), tabs, "zeta"), hostSet(kind, picked("p"), tabs, "plan")]).toEqual([
      picked("t"),
      picked("p"),
      picked("p", "zeta"),
      picked("p"),
    ]);
  });

  it.each(["tabs", "segments"] as const)("%s: with no selection yet, an empty or missing value selects the first enabled child, and a missing one is remembered", (kind) => {
    const firstDisabled = [e("s", "spec", true), e("p", "plan"), e("t", "tasks")];
    expect([hostSet(kind, none, firstDisabled, ""), hostSet(kind, none, firstDisabled, "zeta"), hostSet(kind, none, [], "tasks")]).toEqual([picked("p"), picked("p", "zeta"), picked(null, "tasks")]);
  });
});

describe("userSelect: a user selection (FR-002, FR-014)", () => {
  it("selects the child, forgets the remembered value and changes; re-selecting the selected child does not change but forgets", () => {
    expect([userSelect(picked("g"), folders, "d"), userSelect(picked(null, "zeta"), folders, "a"), userSelect(picked("p", "zeta"), folders, "p")]).toEqual([
      { state: picked("d"), changed: true },
      { state: picked("a"), changed: true },
      { state: picked("p"), changed: false },
    ]);
  });

  it("selects the second of two children with the same value, as a change", () => {
    expect(userSelect(picked("s1"), [e("s1", "same"), e("s2", "same")], "s2")).toEqual({ state: picked("s2"), changed: true });
  });

  it("does nothing for a disabled child or a node that is not a child, beside the enabled child it selects", () => {
    const disabledBeta = [e("a", "alpha"), e("b", "beta", true), e("g", "gamma")];
    expect([userSelect(picked("a", "zeta"), disabledBeta, "b"), userSelect(picked("a"), disabledBeta, "x"), userSelect(picked("a"), disabledBeta, "g")]).toEqual([
      { state: picked("a", "zeta"), changed: false },
      { state: picked("a"), changed: false },
      { state: picked("g"), changed: true },
    ]);
  });
});

describe("fallback(before, after, node): FR-011's focus target and FR-011a's selection target", () => {
  it("is the next enabled child after a removed node in document order, else the nearest enabled before it (US1-14)", () => {
    const before = [e("a", "alpha"), e("b", "beta"), e("g", "gamma", true), e("d", "delta")];
    expect(fallback(before, [e("a", "alpha"), e("g", "gamma", true), e("d", "delta")], "b")).toBe("d");
    expect(fallback(before, [e("a", "alpha"), e("b", "beta"), e("g", "gamma", true)], "d")).toBe("b");
    expect(fallback(before, [e("a", "alpha"), e("g", "gamma", true)], "b")).toBe("a");
  });

  it("is the next enabled child after a disabled node still present, else the nearest before it", () => {
    expect(fallback(folders, [e("a", "alpha"), e("b", "beta"), e("g", "gamma", true), e("d", "delta"), e("p", "epsilon")], "g")).toBe("d");
    expect(fallback(folders, [e("a", "alpha"), e("b", "beta"), e("g", "gamma"), e("d", "delta", true), e("p", "epsilon", true)], "d")).toBe("g");
  });

  it("skips nodes removed in the same batch, and is null when no enabled child is left", () => {
    expect(fallback(folders, [e("a", "alpha"), e("p", "epsilon")], "g")).toBe("p");
    expect(fallback(folders, [e("a", "alpha", true)], "g")).toBeNull();
    expect(fallback(folders, [], "g")).toBeNull();
  });

  it("places a disabled node still present by the children after the batch: moved and disabled in one batch, the next enabled child is the one after it now (mutation run, phase 2)", () => {
    const after = [e("d", "delta"), e("g", "gamma", true), e("a", "alpha"), e("b", "beta"), e("p", "epsilon")];
    expect([fallback(folders, after, "g"), fallback(folders, [e("d", "delta"), e("a", "alpha"), e("g", "gamma", true)], "g")]).toEqual(["a", "a"]);
  });

  it("is null for a node that was never a child, beside a child's fallback", () => {
    expect([fallback(folders, folders, "x"), fallback(folders, folders, "b")]).toEqual([null, "g"]);
  });
});

describe("batch: the listbox (data-model.md § Transitions; US1-14, US1-18, US1-19, US1-21)", () => {
  it("clears the selection when the selected option is removed, with no focus move when nothing had focus", () => {
    expect(batch("listbox", picked("g"), folders, [e("a", "alpha"), e("b", "beta"), e("d", "delta")], null)).toEqual({ state: none, focus: null });
  });

  it("keeps a selected option that becomes disabled, and keeps focus on it", () => {
    const after = [e("a", "alpha"), e("b", "beta"), e("g", "gamma", true), e("d", "delta"), e("p", "epsilon")];
    expect(batch("listbox", picked("g"), folders, after, "g")).toEqual({ state: picked("g"), focus: "g" });
  });

  it("keeps the selection of a moved option and refocuses it (SPEC-3-03)", () => {
    const moved = [e("a", "alpha"), e("g", "gamma"), e("b", "beta")];
    expect(batch("listbox", picked("b"), [e("a", "alpha"), e("b", "beta"), e("g", "gamma")], moved, "b")).toEqual({ state: picked("b"), focus: "b" });
  });

  it("moves focus from a removed focused option to the next enabled option after it (US1-14's example)", () => {
    const before = [e("a", "alpha"), e("b", "beta"), e("g", "gamma", true), e("d", "delta")];
    expect(batch("listbox", none, before, [e("a", "alpha"), e("g", "gamma", true), e("d", "delta")], "b")).toEqual({ state: none, focus: "d" });
  });

  it("selects a remembered value's option when it is appended, or enabled, and forgets it (FR-010a)", () => {
    const two = [e("a", "alpha"), e("b", "beta")];
    expect(batch("listbox", picked(null, "delta"), two, [...two, e("d", "delta")], null)).toEqual({ state: picked("d"), focus: null });
    expect(batch("listbox", picked(null, "delta"), [...two, e("d", "delta", true)], [...two, e("d", "delta")], null)).toEqual({ state: picked("d"), focus: null });
  });

  it("selects a remembered value's option when a child's value changes to it, and keeps it remembered while no enabled child has it", () => {
    const two = [e("a", "alpha"), e("b", "beta")];
    expect(batch("listbox", picked(null, "delta"), two, [e("a", "alpha"), e("b", "delta")], null)).toEqual({ state: picked("b"), focus: null });
    expect(batch("listbox", picked(null, "delta"), two, [...two, e("d", "delta", true)], null)).toEqual({ state: picked(null, "delta"), focus: null });
  });

  it("leaves the selection and focus alone for a batch that adds an option, beside the batch that removes the selected one", () => {
    expect([batch("listbox", picked("a"), [e("a", "alpha")], [e("a", "alpha"), e("b", "beta")], null), batch("listbox", picked("a"), [e("a", "alpha"), e("b", "beta")], [e("b", "beta")], "a")]).toEqual([
      { state: picked("a"), focus: null },
      { state: none, focus: "b" },
    ]);
  });
});

describe("batch: tabs and segments (FR-011a and FR-010a's Precedence; US2-17 to US2-20, US3-15 to US3-17)", () => {
  const tabs = [e("s", "spec"), e("p", "plan"), e("t", "tasks")];

  it.each(["tabs", "segments"] as const)("%s: a removed selected child gives the next enabled child after it, else the nearest before; focus goes with it when it had focus", (kind) => {
    expect(batch(kind, picked("p"), tabs, [e("s", "spec"), e("t", "tasks")], "p")).toEqual({ state: picked("t"), focus: "t" });
    expect(batch(kind, picked("t"), tabs, [e("s", "spec"), e("p", "plan")], null)).toEqual({ state: picked("p"), focus: null });
  });

  it.each(["tabs", "segments"] as const)("%s: a disabled selected child gives the next enabled child, and focus moves with the selection", (kind) => {
    expect(batch(kind, picked("p"), tabs, [e("s", "spec"), e("p", "plan", true), e("t", "tasks")], "p")).toEqual({ state: picked("t"), focus: "t" });
  });

  it.each(["tabs", "segments"] as const)("%s: a remembered value takes precedence over the fallback, and focus goes to that child", (kind) => {
    const four = [...tabs, e("r", "review")];
    expect(batch(kind, picked("p", "review"), four, [e("s", "spec"), e("t", "tasks"), e("r", "review")], "p")).toEqual({ state: picked("r"), focus: "r" });
  });

  it.each(["tabs", "segments"] as const)("%s: children appended at once to an empty parent with a remembered value select that child (FR-010a's example)", (kind) => {
    expect(batch(kind, picked(null, "tasks"), [], tabs, null)).toEqual({ state: picked("t"), focus: null });
  });

  it.each(["tabs", "segments"] as const)("%s: children enabled at once while every child was disabled select the remembered one, else the first enabled", (kind) => {
    const allDisabled = [e("s", "spec", true), e("p", "plan", true), e("t", "tasks", true)];
    const someEnabled = [e("s", "spec"), e("p", "plan", true), e("t", "tasks")];
    expect([batch(kind, picked(null, "tasks"), allDisabled, someEnabled, null), batch(kind, none, allDisabled, someEnabled, null)]).toEqual([
      { state: picked("t"), focus: null },
      { state: picked("s"), focus: null },
    ]);
  });

  it.each(["tabs", "segments"] as const)("%s: the first children of an empty parent select the first enabled one; with none enabled nothing is selected", (kind) => {
    expect([batch(kind, none, [], [e("s", "spec", true), e("p", "plan")], null), batch(kind, picked("p"), tabs, [e("s", "spec", true), e("t", "tasks", true)], null)]).toEqual([
      { state: picked("p"), focus: null },
      { state: none, focus: null },
    ]);
  });

  it.each(["tabs", "segments"] as const)("%s: a focused selected child keeps focus when it and every other child become disabled, and focus is left alone when it is removed with none left (mutation run, phase 2)", (kind) => {
    expect([
      batch(kind, picked("p"), tabs, [e("s", "spec", true), e("p", "plan", true), e("t", "tasks", true)], "p"),
      batch(kind, picked("p"), tabs, [e("s", "spec", true), e("t", "tasks", true)], "p"),
      batch(kind, picked("p"), tabs, [e("s", "spec"), e("t", "tasks", true)], "p"),
    ]).toEqual([
      { state: none, focus: "p" },
      { state: none, focus: null },
      { state: picked("s"), focus: "s" },
    ]);
  });

  it.each(["tabs", "segments"] as const)("%s: a remembered value is kept while its child is absent, through fallbacks", (kind) => {
    expect(batch(kind, picked("p", "zeta"), tabs, [e("s", "spec"), e("t", "tasks")], null)).toEqual({ state: picked("t", "zeta"), focus: null });
  });

  it.each(["tabs", "segments"] as const)("%s: a moved selected child keeps the selection and its focus", (kind) => {
    expect(batch(kind, picked("s"), tabs, [e("p", "plan"), e("t", "tasks"), e("s", "spec")], "s")).toEqual({ state: picked("s"), focus: "s" });
  });

  it.each(["tabs", "segments"] as const)("%s: a focused child that is not selected and is removed moves focus by FR-011 and leaves the selection", (kind) => {
    expect(batch(kind, picked("s"), tabs, [e("s", "spec"), e("t", "tasks")], "p")).toEqual({ state: picked("s"), focus: "t" });
  });
});

describe("tabStop(state, entries, lastFocused): FR-016", () => {
  it("is the selected child when enabled, else the last focused enabled child, else the first enabled child, else none", () => {
    const disabledGamma = [e("a", "alpha", true), e("b", "beta"), e("g", "gamma", true), e("d", "delta")];
    expect([
      tabStop(picked("d"), disabledGamma, "b"),
      tabStop(picked("g"), disabledGamma, "d"),
      tabStop(picked("g"), disabledGamma, "g"),
      tabStop(none, disabledGamma, null),
      tabStop(none, disabledGamma, "x"),
      tabStop(none, [e("a", "alpha", true)], "a"),
      tabStop(none, [], null),
    ]).toEqual(["d", "d", "b", "b", "b", null, null]);
  });
});

describe("the focus record (research.md R-03; data-model.md § Selection state)", () => {
  const button = { id: "after" };

  it("focusIn records the focused and last focused child and clears blurred", () => {
    expect(focusIn({ focused: null, blurred: "b", lastFocused: "a" }, "g")).toEqual({ focused: "g", blurred: null, lastFocused: "g" });
  });

  it("focusOut sets blurred only for a null relatedTarget, and clears focused in both cases, keeping the last focused child", () => {
    const focused: FocusRecord<string> = { focused: "g", blurred: null, lastFocused: "g" };
    expect([focusOut(focused, "g", null), focusOut(focused, "g", button), focusOut({ focused: "g", blurred: "b", lastFocused: "g" }, "g", button)]).toEqual([
      { focused: null, blurred: "g", lastFocused: "g" },
      { focused: null, blurred: null, lastFocused: "g" },
      { focused: null, blurred: null, lastFocused: "g" },
    ]);
  });

  it("takeBlurred keeps the blurred child as having had focus only when the taken records removed it and focus left for the body", () => {
    const blurred: FocusRecord<string> = { focused: null, blurred: "b", lastFocused: "b" };
    const cleared: FocusRecord<string> = { focused: null, blurred: null, lastFocused: "b" };
    expect([takeBlurred(blurred, ["a", "b"], true), takeBlurred(blurred, ["a"], true), takeBlurred(blurred, [], true), takeBlurred(blurred, ["b"], false), takeBlurred(cleared, ["b"], true)]).toEqual([
      { record: cleared, hadFocus: "b" },
      { record: cleared, hadFocus: null },
      { record: cleared, hadFocus: null },
      { record: cleared, hadFocus: null },
      { record: cleared, hadFocus: null },
    ]);
  });

  it("starts empty, and the first focusIn fills it", () => {
    expect([noFocus, focusIn(noFocus, "a")]).toEqual([
      { focused: null, blurred: null, lastFocused: null },
      { focused: "a", blurred: null, lastFocused: "a" },
    ]);
  });
});

/** A source of children for the model: the live children and the pending records, set by the test. */
function source(initial: readonly Entry<string>[]): { live: Entry<string>[]; pending: string[][]; readonly read: () => readonly Entry<string>[]; readonly take: () => readonly (readonly string[])[] } {
  const made = {
    live: [...initial],
    pending: [] as string[][],
    read: () => made.live,
    take: () => made.pending.splice(0),
  };
  return made;
}

describe("SelectionModel: batching, the value setter and the focus record over a source", () => {
  it("reads the children at its first batch, and reports the value and the tab stop", () => {
    const children = source(folders);
    const model = new SelectionModel<string>("listbox", children);
    expect(model.batch()).toBeNull();
    model.set("gamma");
    expect({ entries: model.entries, selected: model.selected, value: model.value, stop: model.tabStop(), remembered: model.remembered }).toEqual({
      entries: folders,
      selected: "g",
      value: "gamma",
      stop: "g",
      remembered: null,
    });
  });

  it("the value setter first takes the pending records and decides on the live children: an option appended in the same task is selected (R-05)", () => {
    const children = source([e("a", "alpha"), e("b", "beta")]);
    const model = new SelectionModel<string>("listbox", children);
    model.batch();
    children.live = [e("a", "alpha"), e("b", "beta"), e("d", "delta")];
    children.pending = [[]];
    model.set("delta");
    expect({ selected: model.selected, value: model.value, remembered: model.remembered, entries: model.entries.length, pending: children.pending }).toEqual({ selected: "d", value: "delta", remembered: null, entries: 3, pending: [] });
  });

  it("remembers a missing value and selects it in the batch that brings its option, then forgets it (US1-19)", () => {
    const children = source([e("a", "alpha"), e("b", "beta")]);
    const model = new SelectionModel<string>("listbox", children);
    model.batch();
    model.set("delta");
    const remembered = { value: model.value, remembered: model.remembered };
    children.live = [...children.live, e("d", "delta")];
    model.batch();
    expect({ remembered, selected: model.selected, value: model.value, after: model.remembered }).toEqual({ remembered: { value: "", remembered: "delta" }, selected: "d", value: "delta", after: null });
  });

  it("one batch takes every change since the last: children appended together with a remembered value select it (tabs, FR-010a)", () => {
    const children = source([]);
    const model = new SelectionModel<string>("tabs", children);
    model.batch();
    model.set("tasks");
    children.live = [e("s", "spec"), e("p", "plan"), e("t", "tasks")];
    model.batch();
    expect({ selected: model.selected, value: model.value }).toEqual({ selected: "t", value: "tasks" });
  });

  it("select changes for another enabled child only, and forgets a remembered value", () => {
    const children = source([e("a", "alpha"), e("b", "beta", true), e("g", "gamma")]);
    const model = new SelectionModel<string>("listbox", children);
    model.batch();
    model.set("zeta");
    expect([model.select("a"), model.remembered, model.select("a"), model.select("b"), model.selected]).toEqual([true, null, false, false, "a"]);
  });

  it("the focus record: focusIn sets the tab stop fallback, focusOut reports whether it queued the microtask", () => {
    const children = source(folders);
    const model = new SelectionModel<string>("listbox", children);
    model.batch();
    model.focusIn("d");
    const stop = model.tabStop();
    expect([stop, model.focusOut("d", { id: "after" }), model.record, model.focusOut("d", null), model.record]).toEqual([
      "d",
      false,
      { focused: null, blurred: null, lastFocused: "d" },
      true,
      { focused: null, blurred: "d", lastFocused: "d" },
    ]);
  });

  it("afterBlur refocuses a moved child and moves focus from a removed one, when the taken records list it and focus left", () => {
    const three = [e("a", "alpha"), e("b", "beta"), e("g", "gamma")];
    const moved = source(three);
    const model = new SelectionModel<string>("listbox", moved);
    model.batch();
    model.set("beta");
    model.focusIn("b");
    model.focusOut("b", null);
    moved.live = [e("a", "alpha"), e("g", "gamma"), e("b", "beta")];
    moved.pending = [["b"], []];
    const refocus = model.afterBlur(true);
    expect({ refocus, selected: model.selected, entries: model.entries.map((entry) => entry.node), blurred: model.record.blurred }).toEqual({ refocus: "b", selected: "b", entries: ["a", "g", "b"], blurred: null });

    const removed = source(three);
    const other = new SelectionModel<string>("listbox", removed);
    other.batch();
    other.focusIn("b");
    other.focusOut("b", null);
    removed.live = [e("a", "alpha"), e("g", "gamma")];
    removed.pending = [["b"]];
    expect(other.afterBlur(true)).toBe("g");
  });

  it("afterBlur leaves focus alone when the records do not list the blurred child, when focus went to an element, or after a non-null relatedTarget, and clears the record", () => {
    const three = [e("a", "alpha"), e("b", "beta"), e("g", "gamma")];
    const outcomes: unknown[] = [];
    for (const [pending, focusLeft, related] of [[[], true, null], [[["b"]], false, null], [[["b"]], true, { id: "after" }]] as const) {
      const children = source(three);
      const model = new SelectionModel<string>("listbox", children);
      model.batch();
      model.focusIn("b");
      model.focusOut("b", related);
      children.live = [e("a", "alpha"), e("g", "gamma"), e("b", "beta")];
      children.pending = pending.map((list) => [...list]);
      outcomes.push([model.afterBlur(focusLeft), model.record.blurred, model.entries.map((entry) => entry.node)]);
    }
    expect(outcomes).toEqual([
      [null, null, ["a", "b", "g"]],
      [null, null, ["a", "g", "b"]],
      [null, null, ["a", "g", "b"]],
    ]);
  });

  it("R1-01: the value setter feeds the records it takes to the focus record: a removed or moved focused child gives the focus target when focus left, and the later afterBlur has nothing left", () => {
    const three = [e("a", "alpha"), e("b", "beta"), e("g", "gamma")];
    const outcomes: unknown[] = [];
    for (const [live, value, focusLeft] of [
      [[e("a", "alpha"), e("g", "gamma")], "gamma", true],
      [[e("a", "alpha"), e("g", "gamma")], "alpha", true],
      [[e("a", "alpha"), e("g", "gamma"), e("b", "beta")], "gamma", true],
      [[e("a", "alpha"), e("g", "gamma"), e("b", "beta")], "alpha", true],
      [[e("a", "alpha"), e("g", "gamma"), e("b", "beta")], "gamma", false],
    ] as const) {
      const children = source(three);
      const model = new SelectionModel<string>("listbox", children);
      model.batch();
      model.set("alpha");
      model.focusIn("b");
      model.focusOut("b", null);
      children.live = [...live];
      children.pending = [["b"]];
      const focus = model.set(value, focusLeft);
      outcomes.push({ focus, selected: model.selected, blurred: model.record.blurred, later: model.afterBlur(true) });
    }
    expect(outcomes).toEqual([
      { focus: "g", selected: "g", blurred: null, later: null },
      { focus: "g", selected: "a", blurred: null, later: null },
      { focus: "b", selected: "g", blurred: null, later: null },
      { focus: "b", selected: "a", blurred: null, later: null },
      { focus: null, selected: "g", blurred: null, later: null },
    ]);
  });

  it("batch keeps focus on a focused option that becomes disabled (PLAN-CORRECTNESS-1-004 (a)), and the tab stop leaves it", () => {
    const children = source(folders);
    const model = new SelectionModel<string>("listbox", children);
    model.batch();
    model.set("gamma");
    model.focusIn("g");
    children.live = [e("a", "alpha"), e("b", "beta"), e("g", "gamma", true), e("d", "delta"), e("p", "epsilon")];
    expect([model.batch(), model.selected, model.value, model.tabStop()]).toEqual(["g", "g", "gamma", "a"]);
  });
});
