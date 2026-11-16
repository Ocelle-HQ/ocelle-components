// The shared bodies of User Story 3's browser scenarios for `ocelle-form-select` (specs/010-feedback-forms spec US3
// scenarios 1 to 9, FR-020 to FR-028, FR-031, FR-032 and the select's Edge Cases; T050). Each body is written once
// against the driver, with the select's tag as a parameter (the plant rows of test/plants.test.ts run a body with a
// plant's tag), and asserts as it goes. It is run in process on the element source (test/form-select.test.ts) and on
// strict-CSP fixture pages with the browser build (test/browser/form-select.test.ts). US3 scenario 7 reuses User Story
// 2's bodies of scenarios/form-input.ts on a select (`selectKind`), each run with the select's tag; the native twins
// of the select, with the absolute table of contracts/testing.md § Twins, are in scenarios/form-twins.ts.
//
// Expected values are written by hand from the spec and the contracts (tasks.md, guard rules): roles, names, values,
// form data and option lists from the scenarios, with a native `<select>` holding the same options beside the element
// wherever the spec says "as a native select does", each side also asserted against the hand-written outcome; the
// indicator's drawing from the hand-written icon table of test/icons-expected.ts; colours from the token names
// (`tokenColour`); sizes from the token table's used values.
import { assert } from "vitest";
import { expectedIcons, svgAttributes } from "../icons-expected.ts";
import type { AxNode, Box, Driver, Part } from "./driver.ts";
import { field, form, formInputScenarios, inField, parts } from "./form-input.ts";
import type { ControlKind, FormScenario } from "./form-input.ts";
import { iconSize, tokenColour } from "./icon.ts";
import { el } from "./notice.ts";

/**
 * The select's kind for User Story 2's shared bodies (US3 scenario 7): a native `<select>`, a combobox (Chromium's role
 * for a single native select), its value the option marked `selected`. A host written without a value holds one
 * option with the empty value, so its value is `""` as an input's without one is; with a value it holds a second
 * option of that value, marked `selected`.
 */
export const selectKind: ControlKind = {
  inner: "select",
  roles: ["combobox"],
  markup: (tag, attributes, value) => el(tag, attributes, `<option value="">None</option>${value === undefined ? "" : `<option value="${value}" selected>${value}</option>`}`),
  native: (attributes, value) => `<select ${attributes}><option value="">None</option>${value === undefined ? "" : `<option value="${value}" selected>${value}</option>`}</select>`,
  requiredExposed: false,
};

/** The options of US3 scenario 1: "To do", and "Done" marked `selected`. */
const lanes = '<option value="todo">To do</option><option value="done" selected>Done</option>';

/** A select of tag `tag` with `attributes` (as written) and the option markup `options`. */
export const select = (tag: string, attributes: string, options: string): string => el(tag, attributes, options);

/** A native select with `attributes` and `options`, the twin of an element written with the same. */
export const nativeSelect = (attributes: string, options: string): string => `<select ${attributes}>${options}</select>`;

/** Whether a box is drawn: displayed and with a height. */
const drawn = (box: Box): boolean => box.display !== "none" && box.display !== "absent" && box.height > 0;

/** The option and group nodes of an accessibility subtree, in tree order, by role and name. */
function choices(nodes: readonly AxNode[]): AxNode[] {
  return nodes.filter((node) => node.role === "option" || node.role === "group").map((node) => ({ role: node.role, name: node.name }));
}

/** The `<option>` and `<optgroup>` elements of the shadow root of `id`, in tree order, by local name and attributes. */
async function mirrored(driver: Driver, id: string): Promise<Part[]> {
  return (await driver.elements(id)).filter((part) => part.name === "option" || part.name === "optgroup");
}

/** One option of a mirrored list as written: its local name and attributes. */
const option = (attributes: Readonly<Record<string, string>>): Part => ({ name: "option", attributes });

/** An `input` event heard at the select `s` with the select's value `value` already set (a native `Event`, no detail). */
const inputEvent = (value: string): unknown => ({ type: "input", at: "s", target: "s", value, detail: null, bubbles: true, composed: true });
/** The select's change event heard at `s` with `{ value }`. */
const changeEvent = (value: string): unknown => ({ type: "ocelle-form-select-change", at: "s", target: "s", value, detail: { value }, bubbles: true, composed: true });

/** The shapes of the shadow root of `id` that draw: the `svg` and its shape elements, in order. */
async function drawingOf(driver: Driver, id: string): Promise<Part[]> {
  return (await driver.elements(id)).filter((part) => ["svg", "line", "polyline", "path", "rect", "circle"].includes(part.name));
}

/** User Story 2's bodies that US3 scenario 7 reuses (US2 scenarios 9 to 23 as it lists them), and the styles, font, long text and right-to-left cells. */
const reused = [
  "US2-9:",
  "US2-10:",
  "US2-11 disabled",
  "US2-11 fieldset",
  "US2-13 external label",
  "US2-13 rename",
  "US2-13 names",
  "US2-13 host node",
  "US2-13 spaces",
  "US2-13 blank aria-label",
  "US2-14:",
  "US2-15:",
  "US2-18:",
  "US2-19:",
  "US2-20 innerHTML",
  "US2-20 template",
  "US2-20 domparser",
  "US2-20 createElement",
  "US2-20 move",
  "US2-22 inserted hidden",
  "US2-22 first loaded hidden",
  "US2-22 announced, hidden and revealed",
  "US2-22 no error",
  "US2-23:",
  "FR-027 merge, 100 ms apart",
  "FR-027 merge, A, B, A",
  "Edge case, error while focused",
  "Edge case, hidden ancestor",
  "FR-025, FR-028",
  "FR-002",
  "Edge case, long unbroken text",
  "Edge case, right to left",
];

/** Each reused body, run on a select: its name prefixed with US3-7, its control the select's kind. */
const scenario7: readonly FormScenario[] = reused.map((prefix) => {
  const body = formInputScenarios.find((each) => each.name.startsWith(prefix));
  if (body === undefined) throw new Error(`no form-input scenario ${prefix}`);
  return { name: `US3-7, ${body.name}`, run: (driver: Driver, tag: string) => body.run(driver, tag, selectKind) };
});

export const formSelectScenarios: readonly FormScenario[] = [
  {
    name: 'US3-1: a visible label "Lane" is drawn above a native select showing "Done"; the focused select is a combobox named "Lane"; value is "done" and the form data and a plain submit hold lane=done',
    run: async (driver, tag) => {
      await driver.mount(form(select(tag, 'id="s" name="lane" label="Lane"', lanes)));
      const label = await driver.box("s", parts.label);
      const control = await driver.box("s", parts.control);
      const shown = { index: await driver.propertyIn("s", parts.control, "selectedIndex"), value: await driver.propertyIn("s", parts.control, "value") };
      await driver.batch([{ op: "focus", id: "s" }]);
      const node = await field(driver, "s", selectKind);
      assert.deepEqual(
        {
          above: drawn(label) && drawn(control) && label.y + label.height <= control.y + 0.5,
          inner: await driver.propertyIn("s", parts.control, "localName"),
          shown,
          node: { role: node.role, name: node.name, focused: node.focused },
          value: await driver.property("s", "value"),
          data: await driver.formData("f"),
          submitted: await driver.submit("f"),
        },
        { above: true, inner: "select", shown: { index: 1, value: "done" }, node: { role: "combobox", name: "Lane", focused: true }, value: "done", data: [["lane", "done"]], submitted: [["lane", "done"]] },
        "US3-1",
      );
    },
  },
  {
    name: "US3-2: ArrowUp, ArrowDown and a typed letter change the choice as on a native select; each change sends one input event at the host with the new value and one ocelle-form-select-change with { value }, bubbling and composed; a key that changes nothing sends none",
    run: async (driver, tag) => {
      const options = '<option value="todo">To do</option><option value="doing">Doing</option><option value="done" selected>Done</option>';
      await driver.mount(select(tag, 'id="s" label="Lane"', options) + nativeSelect('id="n" aria-label="Lane"', options));
      await driver.listen(["s"], ["input", "ocelle-form-select-change"]);
      const steps: { key: string; type?: boolean }[] = [{ key: "ArrowUp" }, { key: "ArrowDown" }, { key: "t", type: true }, { key: "ArrowUp" }];
      const seen: unknown[] = [];
      for (const { key, type } of steps) {
        if (type === true) {
          await driver.type("s", key);
          await driver.type("n", key);
        } else {
          await driver.press("s", key);
          await driver.press("n", key);
        }
        seen.push({ element: await driver.property("s", "value"), native: await driver.property("n", "value"), heard: await driver.heard() });
      }
      const step = (value: string, heard: unknown[]): unknown => ({ element: value, native: value, heard });
      assert.deepEqual(
        seen,
        [step("doing", [inputEvent("doing"), changeEvent("doing")]), step("done", [inputEvent("done"), changeEvent("done")]), step("todo", [inputEvent("todo"), changeEvent("todo")]), step("todo", [])],
        "US3-2",
      );
    },
  },
  {
    name: "US3-3: option groups and disabled options are shown by the native select in the same order, with the same labels, values and disabled states, as a native select with the same children",
    run: async (driver, tag) => {
      const options =
        '<option value="none">None</option><optgroup label="Active"><option value="todo">To do</option><option value="doing" disabled>Doing</option></optgroup><optgroup label="Closed" disabled><option value="done">Done</option></optgroup>';
      await driver.mount(select(tag, 'id="s" label="Lane"', options) + nativeSelect('id="n" aria-label="Lane"', options));
      const tree = [
        { role: "option", name: "None" },
        { role: "group", name: "Active" },
        { role: "option", name: "To do" },
        { role: "option", name: "Doing" },
        { role: "group", name: "Closed" },
        { role: "option", name: "Done" },
      ];
      const disabled = (await driver.axDetails("s")).filter((node) => node.role === "option").map((node) => node.disabled);
      assert.deepEqual(
        { element: choices(await driver.axSubtree("s")), native: choices(await driver.axSubtree("n")), mirrored: await mirrored(driver, "s"), disabled },
        {
          element: tree,
          native: tree,
          mirrored: [
            option({ value: "none" }),
            { name: "optgroup", attributes: { label: "Active" } },
            option({ value: "todo" }),
            option({ value: "doing", disabled: "" }),
            { name: "optgroup", attributes: { label: "Closed", disabled: "" } },
            option({ value: "done" }),
          ],
          disabled: [false, false, true, true],
        },
        "US3-3",
      );
    },
  },
  {
    name: "US3-4: an option added, its text, label, value, selected and disabled changed, and the selected option removed after rendering: the native select follows each change as a native select with the same children does, the removed choice falling back to the first enabled option, with no event",
    run: async (driver, tag) => {
      const options = (prefix: string): string => `<option id="${prefix}1" value="todo">To do</option><option id="${prefix}2" value="done">Done</option>`;
      await driver.mount(form(select(tag, 'id="s" name="lane" label="Lane"', options("o"))) + form(nativeSelect('id="n" name="lane" aria-label="Lane"', options("n")), "g"));
      await driver.listen(["s"], ["input", "ocelle-form-select-change"]);
      const both = (operation: (prefix: string) => Parameters<Driver["batch"]>[0][number]): Promise<void> => driver.batch([operation("o"), operation("n")]);
      const seen: Record<string, unknown> = {};
      const observe = async (step: string): Promise<void> => {
        seen[step] = {
          element: { value: await driver.property("s", "value"), names: choices(await driver.axSubtree("s")).map((node) => node.name), data: await driver.formData("f") },
          native: { value: await driver.property("n", "value"), names: choices(await driver.axSubtree("n")).map((node) => node.name), data: await driver.formData("g") },
          mirrored: (await mirrored(driver, "s")).map((part) => part.attributes),
        };
      };
      await observe("rendered");
      await both((prefix) => ({ op: "insert", container: prefix === "o" ? "s" : "n", markup: `<option id="${prefix}3" value="later">Later</option>` }));
      await observe("added");
      await both((prefix) => ({ op: "data", id: `${prefix}2`, data: "Finished" }));
      await observe("text");
      await both((prefix) => ({ op: "attribute", id: `${prefix}3`, name: "label", value: "Afterwards" }));
      await observe("label");
      await both((prefix) => ({ op: "attribute", id: `${prefix}2`, name: "value", value: "finished" }));
      await observe("value");
      await both((prefix) => ({ op: "attribute", id: `${prefix}2`, name: "selected", value: "" }));
      await observe("selected");
      await both((prefix) => ({ op: "attribute", id: `${prefix}1`, name: "disabled", value: "" }));
      await observe("disabled");
      await both((prefix) => ({ op: "remove", id: `${prefix}2` }));
      await observe("removed");
      const state = (value: string, names: string[], mirroredList: Record<string, string>[]): unknown => {
        const side = { value, names, data: [["lane", value]] };
        return { element: side, native: side, mirrored: mirroredList };
      };
      // The mirrored options carry no id: an id of the light DOM could collide with the ids of the shadow root.
      const o1 = { value: "todo" };
      const o3 = { value: "later" };
      assert.deepEqual(
        { ...seen, heard: await driver.heard() },
        {
          rendered: state("todo", ["To do", "Done"], [o1, { value: "done" }]),
          added: state("todo", ["To do", "Done", "Later"], [o1, { value: "done" }, o3]),
          text: state("todo", ["To do", "Finished", "Later"], [o1, { value: "done" }, o3]),
          label: state("todo", ["To do", "Finished", "Afterwards"], [o1, { value: "done" }, { ...o3, label: "Afterwards" }]),
          value: state("todo", ["To do", "Finished", "Afterwards"], [o1, { value: "finished" }, { ...o3, label: "Afterwards" }]),
          selected: state("finished", ["To do", "Finished", "Afterwards"], [o1, { value: "finished", selected: "" }, { ...o3, label: "Afterwards" }]),
          disabled: state("finished", ["To do", "Finished", "Afterwards"], [{ ...o1, disabled: "" }, { value: "finished", selected: "" }, { ...o3, label: "Afterwards" }]),
          removed: state("later", ["To do", "Afterwards"], [{ ...o1, disabled: "" }, { ...o3, label: "Afterwards" }]),
          heard: [],
        },
        "US3-4",
      );
    },
  },
  {
    name: 'US3-5: required with a first option of empty value selected, the element reports valueMissing and the form does not submit, as a native select does, flag by flag; choosing another option makes both valid',
    run: async (driver, tag) => {
      const options = '<option value="">Choose a lane</option><option value="todo">To do</option>';
      await driver.mount(form(select(tag, 'id="s" name="lane" label="Lane" required', options)) + form(nativeSelect('id="n" name="lane" aria-label="Lane" required', options), "g"));
      const before = { element: await driver.validity("s"), native: await driver.validity("n") };
      const formValid = { element: await driver.call("f", "checkValidity"), native: await driver.call("g", "checkValidity") };
      const submitted = { element: await driver.submit("f"), native: await driver.submit("g") };
      await driver.press("s", "ArrowDown");
      await driver.press("n", "ArrowDown");
      const after = { element: await driver.validity("s"), native: await driver.validity("n") };
      const flags = (each: { valueMissing: boolean; valid: boolean }): unknown => ({ valueMissing: each.valueMissing, valid: each.valid });
      assert.deepEqual(
        {
          before: { element: flags(before.element), native: flags(before.native) },
          formValid,
          submitted,
          after: { element: flags(after.element), native: flags(after.native) },
          value: await driver.property("s", "value"),
        },
        {
          before: { element: { valueMissing: true, valid: false }, native: { valueMissing: true, valid: false } },
          formValid: { element: false, native: false },
          submitted: { element: null, native: null },
          after: { element: { valueMissing: false, valid: true }, native: { valueMissing: false, valid: true } },
          value: "todo",
        },
        "US3-5",
      );
      assert.deepEqual({ before: before.element, after: after.element }, { before: before.native, after: after.native }, "US3-5: validity flag by flag");
    },
  },
  {
    name: 'US3-6: a form reset brings back the option marked selected with no change event; element.value = "todo" selects that option with no event; a value no option has selects nothing and reads "", as on a native select',
    run: async (driver, tag) => {
      const options = '<option value="todo">To do</option><option value="done" selected>Done</option><option value="later">Later</option>';
      await driver.mount(form(select(tag, 'id="s" name="lane" label="Lane"', options)) + form(nativeSelect('id="n" name="lane" aria-label="Lane"', options), "g"));
      const side = async (id: string, formId: string): Promise<unknown> => ({ value: await driver.property(id, "value"), data: await driver.formData(formId) });
      const shown = async (): Promise<unknown> => ({ element: await driver.propertyIn("s", parts.control, "selectedIndex"), native: await driver.property("n", "selectedIndex") });
      await driver.press("s", "ArrowDown");
      await driver.press("n", "ArrowDown");
      const chosen = { element: await side("s", "f"), native: await side("n", "g") };
      await driver.listen(["s"], ["input", "ocelle-form-select-change"]);
      await driver.reset("f");
      await driver.reset("g");
      const reset = { element: await side("s", "f"), native: await side("n", "g"), shown: await shown() };
      await driver.setProperty("s", "value", "todo");
      await driver.setProperty("n", "value", "todo");
      const script = { element: await side("s", "f"), native: await side("n", "g"), shown: await shown() };
      await driver.setProperty("s", "value", "nope");
      await driver.setProperty("n", "value", "nope");
      const missing = { element: await side("s", "f"), native: await side("n", "g"), shown: await shown() };
      const both = (value: string, data: unknown): unknown => ({ value, data });
      assert.deepEqual(
        { chosen, reset, script, missing, heard: await driver.heard() },
        {
          chosen: { element: both("later", [["lane", "later"]]), native: both("later", [["lane", "later"]]) },
          reset: { element: both("done", [["lane", "done"]]), native: both("done", [["lane", "done"]]), shown: { element: 1, native: 1 } },
          script: { element: both("todo", [["lane", "todo"]]), native: both("todo", [["lane", "todo"]]), shown: { element: 0, native: 0 } },
          missing: { element: both("", []), native: both("", []), shown: { element: -1, native: -1 } },
          heard: [],
        },
        "US3-6",
      );
    },
  },
  {
    name: "US3-8: the open-list indicator is the set's chevron-down drawn in currentColor at the icon size, decorative, at the inline end of the select in both directions, visible in forced colours; it takes no pointer events, so a click at its centre focuses the native select; the select draws no indicator of its own",
    run: async (driver, tag) => {
      await driver.mount(select(tag, 'id="s" label="Lane"', lanes) + `<div id="w" dir="rtl">${select(tag, 'id="r" label="Lane"', lanes)}</div>`);
      const placed = async (id: string): Promise<unknown> => {
        const svg = await driver.box(id, "svg");
        const control = await driver.box(id, parts.control);
        const middle = Math.abs(svg.y + svg.height / 2 - (control.y + control.height / 2)) < 1;
        return {
          size: { width: svg.width, height: svg.height },
          middle,
          end: drawn(svg) && svg.x >= control.x && svg.x + svg.width <= control.x + control.width && svg.x > control.x + control.width / 2,
          start: drawn(svg) && svg.x >= control.x && svg.x + svg.width < control.x + control.width / 2,
        };
      };
      const ink = tokenColour("color-ink", "light");
      const observed = {
        drawing: await drawingOf(driver, "s"),
        paints: await driver.paints("s"),
        decorative: (await driver.ax("s")).filter((node) => ["image", "img", "graphics-document", "graphics-symbol", "SvgRoot"].includes(node.role)),
        ltr: await placed("s"),
        rtl: await placed("r"),
        appearance: await driver.computedIn("s", parts.control, "appearance"),
        pointer: await driver.computedIn("s", "svg", "pointer-events"),
      };
      await driver.forcedColors("active", "light");
      const canvasText = await driver.resolveColour("CanvasText");
      const canvas = await driver.resolveColour("Canvas");
      const forced = (await driver.paints("s")).map((paint) => paint.stroke);
      await driver.forcedColors("none");
      const host = await driver.box("s");
      const svg = await driver.box("s", "svg");
      await driver.click("s", { x: svg.x - host.x + svg.width / 2, y: svg.y - host.y + svg.height / 2 });
      const focus = await driver.focusPath();
      const chevron = expectedIcons["chevron-down"]?.shapes ?? [];
      assert.deepEqual(
        { ...observed, forced: { strokes: forced, visible: forced.length > 0 && forced.every((stroke) => stroke !== canvas) }, focus },
        {
          drawing: [{ name: "svg", attributes: svgAttributes }, ...chevron],
          paints: [{ name: "svg", stroke: ink, fill: "none" }, ...chevron.map((part) => ({ name: part.name, stroke: ink, fill: "none" }))],
          decorative: [],
          ltr: { size: { width: iconSize, height: iconSize }, middle: true, end: true, start: false },
          rtl: { size: { width: iconSize, height: iconSize }, middle: true, end: false, start: true },
          appearance: "none",
          pointer: "none",
          forced: { strokes: [canvasText, ...chevron.map(() => canvasText)], visible: true },
          focus: inField(tag, "s", selectKind),
        },
        "US3-8",
      );
    },
  },
  {
    name: "US3-9: the light-DOM options are neither drawn nor exposed: the accessibility subtree holds each option label once, as a native select's does",
    run: async (driver, tag) => {
      const options = '<option id="o1" value="todo">To do</option><option id="o2" value="done" selected>Done</option>';
      await driver.mount(select(tag, 'id="s" label="Lane"', options) + nativeSelect('id="n" aria-label="Lane"', lanes));
      const labelled = (nodes: readonly AxNode[]): AxNode[] => nodes.filter((node) => node.name === "To do" || node.name === "Done").map((node) => ({ role: node.role, name: node.name }));
      const light = [await driver.box("o1"), await driver.box("o2")].map((box) => ({ width: box.width, height: box.height }));
      const expected = [
        { role: "option", name: "To do" },
        { role: "option", name: "Done" },
      ];
      assert.deepEqual(
        { element: labelled(await driver.axSubtree("s")), native: labelled(await driver.axSubtree("n")), light },
        { element: expected, native: expected, light: [{ width: 0, height: 0 }, { width: 0, height: 0 }] },
        "US3-9",
      );
    },
  },
  {
    name: 'Edge case, no options: a select with no <option> children is an empty native select whose value is "" and which submits nothing; with required it is valueMissing, as a native select',
    run: async (driver, tag) => {
      await driver.mount(form(select(tag, 'id="s" name="lane" label="Lane"', "")) + form(nativeSelect('id="n" name="lane" aria-label="Lane"', ""), "g"));
      const side = async (id: string, formId: string): Promise<unknown> => ({ value: await driver.property(id, "value"), data: await driver.formData(formId), valid: (await driver.validity(id)).valid });
      const empty = { element: await side("s", "f"), native: await side("n", "g"), options: await driver.propertyIn("s", parts.control, "length") };
      await driver.mount(select(tag, 'id="s" label="Lane" required', "") + nativeSelect('id="n" aria-label="Lane" required', ""));
      const required = { element: (await driver.validity("s")).valueMissing, native: (await driver.validity("n")).valueMissing };
      const nothing = { value: "", data: [], valid: true };
      assert.deepEqual({ empty, required }, { empty: { element: nothing, native: nothing, options: 0 }, required: { element: true, native: true } }, "Edge case, no options");
    },
  },
  {
    name: 'FR-021, host value: a host value attribute is ignored, as written and when changed: the selection and value follow the option marked selected (or the first option); there is no defaultValue',
    run: async (driver, tag) => {
      const options = '<option value="todo">To do</option><option value="done">Done</option><option value="later" selected>Later</option>';
      await driver.mount(form(select(tag, 'id="s" name="lane" label="Lane" value="done"', options) + select(tag, 'id="u" name="other" label="Other" value="done"', '<option value="todo">To do</option><option value="done">Done</option>')));
      const written = { s: await driver.property("s", "value"), u: await driver.property("u", "value"), data: await driver.formData("f") };
      await driver.setAttribute("s", "value", "todo");
      await driver.setAttribute("u", "value", "done");
      assert.deepEqual(
        { written, changed: { s: await driver.property("s", "value"), u: await driver.property("u", "value") }, attribute: await driver.attribute("s", "value"), defaultValue: await driver.has("s", "defaultValue") },
        { written: { s: "later", u: "todo", data: [["lane", "later"], ["other", "todo"]] }, changed: { s: "later", u: "todo" }, attribute: "todo", defaultValue: false },
        "FR-021, host value",
      );
    },
  },
  ...scenario7,
];

/** A select scenario by the start of its name, for the plant rows. */
export function formSelectScenario(prefix: string): FormScenario {
  const found = formSelectScenarios.find((scenario) => scenario.name.startsWith(prefix));
  if (found === undefined) throw new Error(`no form-select scenario ${prefix}`);
  return found;
}
