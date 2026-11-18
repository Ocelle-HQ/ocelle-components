// The shared bodies of User Story 2's browser scenarios for `ocelle-form-input` (specs/010-feedback-forms spec US2
// scenarios 1 to 23, FR-020 to FR-030 and the input's Edge Cases; T031). Each body is written once against the driver,
// with the input's tag as a parameter (the plant rows of test/plants.test.ts run a body with a plant's tag), and
// asserts as it goes: it resolves when every assertion held and rejects with the first failed one. It is run in process
// on the element source (test/form-input.test.ts) and on strict-CSP fixture pages with the browser build
// (test/browser/form-input.test.ts). The native twins and the absolute table of contracts/testing.md § Twins are in
// scenarios/form-twins.ts.
//
// Expected values are written by hand from the spec and the contracts (tasks.md, guard rules): names, descriptions,
// states, form data and announcement texts from the scenarios; colours from the token names FR-025 and FR-028 name
// (the hand-written token table of packages/tokens/test/expected.ts, through `tokenColour`); sizes from that table's used
// values at a 16 px root font size; timing as fractions of the `W` in force (`driver.W`). Every announcement assertion
// states its expected list once and checks it under both rules (`announced`), and a zero count never stands alone: its
// scenario also asserts the positive outcome it guards (the control's live region present, its error visible and in the
// field's description). Each timed step goes through `drive.after` and its returned gap is asserted, unconditionally,
// to lie in its stated range (analysis A2).
import { assert } from "vitest";
import { expectedTokens } from "../../../tokens/test/expected.ts";
import type { AxDetail, Box, Driver, InsertHow, Snapshot } from "./driver.ts";
import { tokenColour } from "./icon.ts";
import { announced, el, expectGap, only, polite, px, regionPresent, used } from "./notice.ts";

/**
 * The kind of form control a shared body runs on (specs/010-feedback-forms US3 scenario 7 reuses User Story 2's bodies
 * with `ocelle-form-select`, T050): the local name of its inner control, the roles of that control's node, and how a
 * host of the kind is written with a value. The input's kind is the default, so a body run without one runs on the
 * input exactly as written for it.
 */
export interface ControlKind {
  /** The local name of the inner control, `part="control"` with the id `control`. */
  readonly inner: string;
  /** The roles of the inner control's node in the accessibility tree. */
  readonly roles: readonly string[];
  /** The markup of a host of tag `tag` with `attributes` (as written), holding `value` as its value when one is given. */
  readonly markup: (tag: string, attributes: string, value?: string) => string;
  /** The markup of the native control the inner one is, with `attributes` and holding `value`: the element's twin. */
  readonly native: (attributes: string, value?: string) => string;
  /**
   * Whether Chromium's accessibility tree gives a native control of this kind the `required` state, from `required` or
   * `aria-required="true"` (measured: an `<input>` has it, a `<select>`'s combobox has neither).
   */
  readonly requiredExposed: boolean;
}

export interface FormScenario {
  /** The spec scenario and what it checks. */
  readonly name: string;
  /**
   * Runs the scenario with the control's tag `tag` (`ocelle-form-input`, or a plant's tag) on a control of `kind` (the
   * input's when not given), asserting as it goes.
   */
  readonly run: (driver: Driver, tag: string, kind?: ControlKind) => Promise<void>;
}

/** The literal tag that `firstLoad` replaces by the input's tag. */
const firstTag = "ocelle-first-load";

/** The parts of the input's shadow root (FR-026). */
export const parts = {
  label: '[part="label"]',
  control: '[part="control"]',
  description: '[part="description"]',
  error: '[part="error"]',
} as const;

/** A form with `id` that posts to the fixture's submission recorder, holding `content`. */
export const form = (content: string, id = "f"): string => `<form id="${id}" action="/submit" method="post">${content}</form>`;

/** An input of tag `tag` with `attributes` (as written). */
export const input = (tag: string, attributes: string): string => el(tag, attributes, "");

/** The input's kind: an `<input>`, a textbox (a searchbox or a spinbutton for those types), its value the `value` attribute. */
export const inputKind: ControlKind = {
  inner: "input",
  roles: ["textbox", "searchbox", "spinbutton"],
  markup: (tag, attributes, value) => el(tag, value === undefined ? attributes : `${attributes} value="${value}"`, ""),
  native: (attributes, value) => `<input ${value === undefined ? attributes : `${attributes} value="${value}"`}>`,
  requiredExposed: true,
};

/** A first-load control of `kind`: the literal tag `firstLoad` replaces. */
const fl = (attributes: string, kind: ControlKind = inputKind): string => kind.markup(firstTag, attributes);

/** The focus path of the control `id` of tag `tag` and of `kind` when its inner control has focus. */
export const inField = (tag: string, id = "t", kind: ControlKind = inputKind): string[] => [`${tag}#${id}`, `${kind.inner}#control`];

const absentNode: AxDetail = { role: "none", name: "", host: false, description: "", invalid: "", required: false, disabled: false, readonly: false, focused: false, focusable: false };

/** The accessibility node of the inner control of the control `id` of `kind`: the first node of its shadow subtree with a role of the kind. */
export async function field(driver: Driver, id: string, kind: ControlKind = inputKind): Promise<AxDetail> {
  return (await driver.axDetails(id)).find((node) => !node.host && kind.roles.includes(node.role)) ?? absentNode;
}

/** The accessibility node of the host `id` itself, or an absent node when the host's node is ignored. */
async function hostNode(driver: Driver, id: string): Promise<AxDetail> {
  return (await driver.axDetails(id)).find((node) => node.host) ?? absentNode;
}

/** What the focused field reports to assistive technology: role, name, description and states. */
function reported(node: AxDetail): Record<string, unknown> {
  return { role: node.role, name: node.name, description: node.description, invalid: node.invalid, required: node.required, disabled: node.disabled };
}

/** Whether a box is drawn: displayed and with a height. */
const drawn = (box: Box): boolean => box.display !== "none" && box.display !== "absent" && box.height > 0;

/** The attributes of the inner `<input>` of `id`, or null when it has none. */
async function innerAttributes(driver: Driver, id: string): Promise<Readonly<Record<string, string>> | null> {
  return (await driver.elements(id)).find((part) => part.name === "input")?.attributes ?? null;
}

/** A unitless line-height token times a font size in pixels, as computed CSS text. */
function lineHeight(token: string, fontSize: string): string {
  const entry = expectedTokens.find((each) => each.name === token);
  if (entry === undefined || typeof entry.declared !== "string") throw new Error(`no line height ${token}`);
  return `${String(Math.round(Number(entry.declared) * Number.parseFloat(fontSize) * 1000) / 1000)}px`;
}

/** The WCAG contrast ratio of two `rgb(r, g, b)` colours. */
function contrast(a: string, b: string): number {
  const luminance = (colour: string): number => {
    const [r, g, bl] = (colour.match(/\d+/g) ?? []).map((part) => {
      const channel = Number(part) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (bl ?? 0);
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
}

/** Mounts the container, arms the capture on it, inserts `markup` the way `how` says and stops the capture. */
async function insertion(driver: Driver, markup: string, how: InsertHow = "innerHTML"): Promise<Snapshot[]> {
  await driver.mount('<main id="c"></main>');
  await driver.liveCapture.start("c");
  await driver.insert("c", markup, how);
  return driver.liveCapture.stop();
}

/**
 * Mounts the page as first loaded with `markup` (the capture armed from before), runs `steps` from the first task after
 * the load and stops the capture.
 */
async function loaded(driver: Driver, tag: string, markup: string, steps: () => Promise<void> = () => Promise.resolve()): Promise<Snapshot[]> {
  await driver.mount('<main id="c"></main>');
  await driver.firstLoad("c", markup, tag);
  await steps();
  return driver.liveCapture.stop();
}

/** Waits until the effects of the last trigger have settled: twice `W` after the previous step. */
async function settleAnnouncement(driver: Driver): Promise<void> {
  const gap = await driver.after(2 * driver.W.loaded);
  expectGap(gap, 2 * driver.W.loaded, 4 * driver.W.loaded, "settling wait");
}

const ways: readonly InsertHow[] = ["innerHTML", "template", "domparser", "createElement"];

/** The look of the error state of input `id`: the error text's colour and the field's boundary, colour and width. */
async function errorLook(driver: Driver, id: string): Promise<Record<string, string>> {
  return {
    text: await driver.computedIn(id, parts.error, "color"),
    boundary: await driver.computedIn(id, parts.control, "border-block-start-color"),
    width: await driver.computedIn(id, parts.control, "border-block-start-width"),
  };
}

/** The US2-20 fragment: two controls of `kind` with an error each. */
const swapped = (tag: string, kind: ControlKind = inputKind): string =>
  form(kind.markup(tag, 'id="t" name="title" label="Title" error="Title is taken"') + kind.markup(tag, 'id="l" name="lane" label="Lane" error="Lane is required"'));

export const formInputScenarios: readonly FormScenario[] = [
  {
    name: 'US2-1: a visible label "Title" is drawn above the field; the focused field is a textbox named "Title"; clicking the label focuses the field; the shadow tree holds the label text once',
    run: async (driver, tag) => {
      await driver.mount(form(input(tag, 'id="t" name="title" label="Title"')));
      const host = await driver.box("t");
      const label = await driver.box("t", parts.label);
      const control = await driver.box("t", parts.control);
      assert.deepEqual({ drawn: drawn(label), above: drawn(control) && label.y + label.height <= control.y + 0.5 }, { drawn: true, above: true }, "US2-1: the label above the field");
      await driver.clickPoint("t", { x: label.x - host.x + label.width / 2, y: label.y - host.y + label.height / 2 });
      const clicked = await driver.focusChain();
      await driver.blur();
      await driver.batch([{ op: "focus", id: "t" }]);
      const node = await field(driver, "t");
      const texts = (await driver.ax("t")).filter((each) => each.role === "StaticText" && each.name === "Title").length;
      assert.deepEqual(
        { field: { role: node.role, name: node.name, focused: node.focused }, clicked, texts },
        { field: { role: "textbox", name: "Title", focused: true }, clicked: inField(tag), texts: 1 },
        "US2-1",
      );
    },
  },
  {
    name: 'US2-2: typing "Fix lane" sets value, and both the form data and the request a plain submit sends hold title=Fix lane',
    run: async (driver, tag) => {
      await driver.mount(form(input(tag, 'id="t" name="title" label="Title"')));
      await driver.type("t", "Fix lane");
      assert.deepEqual(
        { value: await driver.property("t", "value"), data: await driver.formData("f"), submitted: await driver.submit("f") },
        { value: "Fix lane", data: [["title", "Fix lane"]], submitted: [["title", "Fix lane"]] },
        "US2-2",
      );
    },
  },
  {
    name: "US2-3: each typed character sends one input event at the host with the new value; leaving the field or Enter sends one ocelle-form-input-change with { value }, bubbling and composed, none without a change, and Enter then leaving the field sends one, before the submission",
    run: async (driver, tag) => {
      await driver.mount(form(input(tag, 'id="t" name="title" label="Title"') + '<button id="go">Go</button>'));
      await driver.listenFor(["t"], ["input", "ocelle-form-input-change"]);
      await driver.listenFor(["f"], ["submit"]);
      const typedEvent = (value: string): unknown => ({ type: "input", at: "t", target: "t", value, detail: 0, bubbles: true, composed: true });
      const change = (value: string): unknown => ({ type: "ocelle-form-input-change", at: "t", target: "t", value, detail: { value }, bubbles: true, composed: true });
      await driver.type("t", "ab");
      const typing = await driver.heardEvents();
      await driver.blur();
      const left = await driver.heardEvents();
      await driver.batch([{ op: "focus", id: "t" }]);
      await driver.blur();
      const unchanged = await driver.heardEvents();
      // A focus of the host selects the field's whole value (delegatesFocus), as Tab does: End puts the caret after it.
      await driver.pressOn("t", "End");
      await driver.type("t", "c");
      await driver.pressOn("t", "Enter");
      const submitted = await driver.submit("f");
      await driver.blur();
      const entered = await driver.heardEvents();
      assert.deepEqual(
        { typing, left, unchanged, entered, submitted },
        {
          typing: [typedEvent("a"), typedEvent("ab")],
          left: [change("ab")],
          unchanged: [],
          // Chromium dispatches the form's submit event composed (measured in both harnesses).
          entered: [typedEvent("abc"), change("abc"), { type: "submit", at: "f", target: "f", value: null, detail: null, bubbles: true, composed: true }],
          submitted: [["title", "abc"]],
        },
        "US2-3",
      );
    },
  },
  {
    name: 'US2-4: with value="draft", typing then a form reset brings back "draft" with no change event; a script value "x" is shown and in the form data, with no event',
    run: async (driver, tag) => {
      await driver.mount(form(input(tag, 'id="t" name="title" label="Title" value="draft"')));
      await driver.listenFor(["t"], ["ocelle-form-input-change"]);
      const initial = await driver.property("t", "value");
      // A focus of the host selects the field's whole value: End puts the caret after it, so the typed text is added.
      await driver.pressOn("t", "End");
      await driver.type("t", "x");
      const typed = await driver.property("t", "value");
      await driver.reset("f");
      const reset = { value: await driver.property("t", "value"), shown: await driver.propertyIn("t", parts.control, "value"), data: await driver.formData("f") };
      await driver.setProperty("t", "value", "x");
      const script = { value: await driver.property("t", "value"), shown: await driver.propertyIn("t", parts.control, "value"), data: await driver.formData("f") };
      assert.deepEqual(
        { initial, typed: typed !== "draft" && String(typed).length === 6, reset, script, heard: await driver.heardEvents() },
        { initial: "draft", typed: true, reset: { value: "draft", shown: "draft", data: [["title", "draft"]] }, script: { value: "x", shown: "x", data: [["title", "x"]] }, heard: [] },
        "US2-4",
      );
    },
  },
  {
    name: "US2-5: required and empty, the form reports invalid and does not submit, validity.valueMissing is true with the browser's message for the field, reportValidity() focuses the field, and typing makes it valid",
    run: async (driver, tag) => {
      await driver.mount(form(input(tag, 'id="t" name="title" label="Title" required')) + form('<input id="n" name="title" required>', "g"));
      const formValid = await driver.call("f", "checkValidity");
      const submitted = await driver.submit("f");
      await driver.blur();
      const validity = await driver.validity("t");
      const native = await driver.validity("n");
      const reportedValid = await driver.call("t", "reportValidity");
      const focus = await driver.focusChain();
      await driver.type("t", "Fix lane");
      const after = await driver.validity("t");
      assert.deepEqual(
        { formValid, submitted, valueMissing: validity.valueMissing, valid: validity.valid, message: validity.message, nonEmpty: validity.message !== "", reported: reportedValid, focus, after: { valid: after.valid, valueMissing: after.valueMissing } },
        { formValid: false, submitted: null, valueMissing: true, valid: false, message: native.message, nonEmpty: true, reported: false, focus: inField(tag), after: { valid: true, valueMissing: false } },
        "US2-5",
      );
    },
  },
  {
    name: "US2-6: type email, type url, minlength, maxlength and pattern broken by the value: the validity equals a native input's with the same attributes and value, flag by flag, and the form does not submit",
    run: async (driver, tag) => {
      const cases = [
        { kind: "email", attributes: 'type="email"', steps: (id: string) => driver.type(id, "not-an-email"), flag: "typeMismatch" },
        { kind: "url", attributes: 'type="url"', steps: (id: string) => driver.type(id, "x"), flag: "typeMismatch" },
        { kind: "minlength", attributes: 'minlength="5"', steps: (id: string) => driver.type(id, "abc"), flag: "tooShort" },
        {
          kind: "maxlength",
          attributes: 'maxlength="3" value="abcdef"',
          steps: async (id: string) => {
            await driver.pressOn(id, "End");
            await driver.pressOn(id, "Backspace");
          },
          flag: "tooLong",
        },
        { kind: "pattern", attributes: 'pattern="[a-z]+"', steps: (id: string) => driver.type(id, "ABC"), flag: "patternMismatch" },
      ] as const;
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      for (const { kind, attributes, steps, flag } of cases) {
        await driver.mount(form(input(tag, `id="t" name="title" ${attributes}`)) + form(`<input id="n" name="title" ${attributes}>`, "g"));
        await steps("t");
        await steps("n");
        const element = await driver.validity("t");
        const native = await driver.validity("n");
        seen[kind] = { element, flag: element[flag], valid: element.valid, submitted: await driver.submit("f") };
        expected[kind] = { element: native, flag: true, valid: false, submitted: null };
      }
      assert.deepEqual(seen, expected, "US2-6");
    },
  },
  {
    name: "US2-7: each type reaches the field and reads back; any other value or none gives text with the attribute kept; ArrowUp and ArrowDown step a number as a native number input with the same step, min and max",
    run: async (driver, tag) => {
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      for (const type of ["text", "email", "url", "tel", "search", "password", "number"]) {
        await driver.mount(input(tag, `id="t" type="${type}"`));
        seen[type] = { field: await driver.propertyIn("t", parts.control, "type"), property: await driver.property("t", "type") };
        expected[type] = { field: type, property: type };
      }
      for (const [kind, attributes, attribute] of [["bogus", 'type="bogus"', "bogus"], ["none", "", null]] as const) {
        await driver.mount(input(tag, `id="t" ${attributes}`));
        seen[kind] = { field: await driver.propertyIn("t", parts.control, "type"), property: await driver.property("t", "type"), attribute: await driver.attribute("t", "type") };
        expected[kind] = { field: "text", property: "text", attribute };
      }
      const stepping = 'type="number" step="2" min="0" max="6" value="2"';
      await driver.mount(input(tag, `id="t" ${stepping}`) + `<input id="n" ${stepping}>`);
      const steps: { element: unknown; native: unknown }[] = [];
      for (const key of ["ArrowUp", "ArrowUp", "ArrowUp", "ArrowDown"]) {
        await driver.pressOn("t", key);
        await driver.pressOn("n", key);
        steps.push({ element: await driver.property("t", "value"), native: await driver.property("n", "value") });
      }
      seen.number = steps;
      expected.number = ["4", "6", "6", "4"].map((value) => ({ element: value, native: value }));
      assert.deepEqual(seen, expected, "US2-7");
    },
  },
  {
    name: 'US2-8: placeholder "Filter lanes" is shown in --ocelle-color-ink-muted, at least 4.5:1 on --ocelle-color-sheet, and is not the field\'s name when a label is set',
    run: async (driver, tag) => {
      await driver.mount(input(tag, 'id="t" label="Title" placeholder="Filter lanes"'));
      const colour = await driver.pseudoIn("t", parts.control, "::placeholder", "color");
      assert.deepEqual(
        { colour, placeholder: await driver.propertyIn("t", parts.control, "placeholder"), name: (await field(driver, "t")).name, ratio: contrast(tokenColour("color-ink-muted", "light"), tokenColour("color-sheet", "light")) >= 4.5 },
        { colour: tokenColour("color-ink-muted", "light"), placeholder: "Filter lanes", name: "Title", ratio: true },
        "US2-8",
      );
    },
  },
  {
    name: 'US2-9: description="Shown on the lane card" is shown under the label, above the field, and is the focused field\'s description',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(kind.markup(tag, 'id="t" label="Title" description="Shown on the lane card"'));
      const label = await driver.box("t", parts.label);
      const description = await driver.box("t", parts.description);
      const control = await driver.box("t", parts.control);
      await driver.batch([{ op: "focus", id: "t" }]);
      const node = await field(driver, "t", kind);
      assert.deepEqual(
        { drawn: drawn(label) && drawn(description), under: description.y >= label.y + label.height - 0.5 && description.y + description.height <= control.y + 0.5, text: await driver.propertyIn("t", parts.description, "textContent"), description: node.description },
        { drawn: true, under: true, text: "Shown on the lane card", description: "Shown on the lane card" },
        "US2-9",
      );
    },
  },
  {
    name: 'US2-10: error="Title is taken" is shown under the field in --ocelle-color-danger with the danger boundary at the bar width, the focused field is invalid and described by the description then the error, it is announced politely once and the form still submits; cleared, it goes and announces nothing; set again, it is announced once more; with whitespace changes only, nothing',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<main id="c">${form(kind.markup(tag, 'id="t" name="title" label="Title" description="Shown on the lane card"'))}</main>`);
      await driver.liveCapture.start("c");
      await driver.setAttribute("t", "error", "Title is taken");
      await settleAnnouncement(driver);
      const control = await driver.box("t", parts.control);
      const error = await driver.box("t", parts.error);
      const look = await errorLook(driver, "t");
      await driver.batch([{ op: "focus", id: "t" }]);
      const set = reported(await field(driver, "t", kind));
      const submitted = await driver.submit("f");
      await driver.blur();
      await driver.setAttribute("t", "error", "");
      await settleAnnouncement(driver);
      const cleared = { error: drawn(await driver.box("t", parts.error)), field: reported(await field(driver, "t", kind)) };
      await driver.setAttribute("t", "error", "Title is taken");
      await settleAnnouncement(driver);
      await driver.setAttribute("t", "error", " Title  is taken ");
      const snapshots = await driver.liveCapture.stop();
      announced(driver, only(snapshots, ["t"]), [polite("Title is taken", "t"), polite("Title is taken", "t")], "US2-10: announcements");
      const unset = { role: kind.roles[0], name: "Title", description: "Shown on the lane card", required: false, disabled: false };
      assert.deepEqual(
        { under: drawn(error) && error.y >= control.y + control.height - 0.5, text: await driver.propertyIn("t", parts.error, "textContent"), look, set, submitted, cleared },
        {
          under: true,
          text: "Title is taken",
          look: { text: tokenColour("color-danger", "light"), boundary: tokenColour("color-danger", "light"), width: px("bar-width") },
          set: { ...unset, description: "Shown on the lane card Title is taken", invalid: "true" },
          submitted: [["title", ""]],
          cleared: { error: false, field: { ...unset, invalid: "false" } },
        },
        "US2-10",
      );
    },
  },
  ...(["disabled", "fieldset"] as const).map(
    (kind): FormScenario => ({
      name: `US2-11 ${kind}: ${kind === "disabled" ? "disabled" : "inside <fieldset disabled>"}, the field cannot be focused or edited, is drawn with the disabled tokens, reports disabled and is not in the form data; enabling it restores all of that`,
      run: async (driver, tag, control = inputKind) => {
        const markup = control.markup(tag, `id="t" name="title" label="Title"${kind === "disabled" ? " disabled" : ""}`, "draft");
        await driver.mount(form(kind === "disabled" ? markup : `<fieldset id="s" disabled>${markup}</fieldset>`));
        const observe = async (): Promise<unknown> => {
          await driver.batch([{ op: "focus", id: "t" }]);
          const focus = await driver.focusChain();
          const node = await field(driver, "t", control);
          await driver.blur();
          return { focus, disabled: node.disabled, data: await driver.formData("f") };
        };
        const before = await observe();
        await driver.type("t", "x");
        const value = await driver.property("t", "value");
        const look = { ground: await driver.computedIn("t", parts.control, "background-color"), text: await driver.computedIn("t", parts.control, "color") };
        await driver.setAttribute(kind === "disabled" ? "t" : "s", "disabled", null);
        const after = await observe();
        assert.deepEqual(
          { before, value, look, after },
          {
            before: { focus: [], disabled: true, data: [] },
            value: "draft",
            look: { ground: tokenColour("color-disabled-bg", "light"), text: tokenColour("color-disabled-ink", "light") },
            after: { focus: inField(tag, "t", control), disabled: false, data: [["title", "draft"]] },
          },
          `US2-11 ${kind}`,
        );
      },
    }),
  ),
  {
    name: "US2-12: readonly, the field can be focused and its value is submitted, but it cannot be edited",
    run: async (driver, tag) => {
      await driver.mount(form(input(tag, 'id="t" name="title" label="Title" value="draft" readonly')));
      await driver.type("t", "x");
      const node = await field(driver, "t");
      assert.deepEqual(
        { focus: await driver.focusChain(), value: await driver.property("t", "value"), readonly: node.readonly, data: await driver.formData("f") },
        { focus: inField(tag), value: "draft", readonly: true, data: [["title", "draft"]] },
        "US2-12",
      );
    },
  },
  {
    name: 'US2-13 external label: <label for="t">Title</label> names the field "Title", clicking it focuses the field, and labels holds it',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<label for="t" id="l">Title</label>${kind.markup(tag, 'id="t" name="title"')}`);
      const name = (await field(driver, "t", kind)).name;
      const label = await driver.box("l");
      await driver.clickPoint("l", { x: label.width / 2, y: label.height / 2 });
      assert.deepEqual({ name, focus: await driver.focusChain(), labels: await driver.ids("t", "labels") }, { name: "Title", focus: inField(tag, "t", kind), labels: ["l"] }, "US2-13 external label");
    },
  },
  {
    name: 'US2-13 rename: changing the external label\'s text to "Card title" renames the field without a focus',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<label for="t" id="l">Title</label>${kind.markup(tag, 'id="t" name="title"')}`);
      await driver.batch([{ op: "text", id: "l", text: "Card title" }]);
      const node = await field(driver, "t", kind);
      assert.deepEqual({ name: node.name, focused: node.focused, focus: await driver.focusChain() }, { name: "Card title", focused: false, focus: [] }, "US2-13 rename");
    },
  },
  {
    name: "US2-13 names: a host aria-label alone; an external label and label joined; an aria-label holding the visible label text; a host aria-labelledby with no other source names nothing",
    run: async (driver, tag, kind = inputKind) => {
      const cells = {
        "aria-label": kind.markup(tag, 'id="t" aria-label="Search lanes"'),
        both: `<label for="t">Title</label>${kind.markup(tag, 'id="t" label="Lane title"')}`,
        "aria-label with the visible text": `<label for="t">Title</label>${kind.markup(tag, 'id="t" label="Lane title" aria-label="Title Lane title, filter"')}`,
        "aria-labelledby": `<span id="x">Outside</span>${kind.markup(tag, 'id="t" aria-labelledby="x"')}`,
      };
      const seen: Record<string, string> = {};
      for (const [cell, markup] of Object.entries(cells)) {
        await driver.mount(markup);
        seen[cell] = (await field(driver, "t", kind)).name;
      }
      assert.deepEqual(seen, { "aria-label": "Search lanes", both: "Title Lane title", "aria-label with the visible text": "Title Lane title, filter", "aria-labelledby": "" }, "US2-13 names");
    },
  },
  {
    name: 'US2-13 host node: a host aria-label="Search lanes" and aria-description="Filters the board" name and describe the textbox, and the host\'s node is a generic with the same name and description',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(kind.markup(tag, 'id="t" aria-label="Search lanes" aria-description="Filters the board"'));
      const node = await field(driver, "t", kind);
      const host = await hostNode(driver, "t");
      assert.deepEqual(
        { field: { role: node.role, name: node.name, description: node.description }, host: { role: host.role, name: host.name, description: host.description } },
        { field: { role: kind.roles[0], name: "Search lanes", description: "Filters the board" }, host: { role: "generic", name: "Search lanes", description: "Filters the board" } },
        "US2-13 host node",
      );
    },
  },
  {
    name: 'US2-13 spaces: a host aria-label=" Title " without label names the field exactly "Title" while the host\'s node is named " Title ", as written',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(kind.markup(tag, 'id="t" aria-label=" Title "'));
      assert.deepEqual({ field: (await field(driver, "t", kind)).name, host: (await hostNode(driver, "t")).name }, { field: "Title", host: " Title " }, "US2-13 spaces");
    },
  },
  {
    name: 'US2-13 blank aria-label: a host aria-label="" or "   " with label="Title" is skipped, the field named "Title", and with an external label "Lane", "Lane Title"',
    run: async (driver, tag, control = inputKind) => {
      const seen: Record<string, string> = {};
      for (const [kind, blank] of [["empty", ""], ["spaces", "   "]] as const) {
        await driver.mount(control.markup(tag, `id="t" label="Title" aria-label="${blank}"`));
        seen[kind] = (await field(driver, "t", control)).name;
        await driver.mount(`<label for="t">Lane</label>${control.markup(tag, `id="t" label="Title" aria-label="${blank}"`)}`);
        seen[`${kind} with a label`] = (await field(driver, "t", control)).name;
      }
      assert.deepEqual(seen, { empty: "Title", "empty with a label": "Lane Title", spaces: "Title", "spaces with a label": "Lane Title" }, "US2-13 blank aria-label");
    },
  },
  {
    name: "US2-14: Tab focuses the field once (the host is no second tab stop) with the token focus ring, Shift+Tab leaves it, and element.focus() focuses the field",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<button id="before">Before</button>${kind.markup(tag, 'id="t" label="Title"')}<button id="after">After</button>`);
      await driver.pressOn("before", "Tab");
      const tabbed = await driver.focusChain();
      const ring = {
        style: await driver.computedIn("t", parts.control, "outline-style"),
        width: await driver.computedIn("t", parts.control, "outline-width"),
        colour: await driver.computedIn("t", parts.control, "outline-color"),
        offset: await driver.computedIn("t", parts.control, "outline-offset"),
      };
      await driver.pressOn("t", "Tab");
      const next = await driver.focusChain();
      await driver.pressOn("after", "Shift+Tab");
      const back = await driver.focusChain();
      await driver.pressOn("t", "Shift+Tab");
      const left = await driver.focusChain();
      await driver.blur();
      await driver.call("t", "focus");
      assert.deepEqual(
        { tabbed, ring, next, back, left, focused: await driver.focusChain() },
        {
          tabbed: inField(tag, "t", kind),
          ring: { style: "solid", width: px("focus-width"), colour: tokenColour("color-focus", "light"), offset: px("focus-offset") },
          next: ["button#after"],
          back: inField(tag, "t", kind),
          left: ["button#before"],
          focused: inField(tag, "t", kind),
        },
        "US2-14",
      );
    },
  },
  {
    name: "US2-15: in forced colours the field's boundary (ButtonBorder or CanvasText), the focus ring (Highlight) and the error mark (the boundary at the bar width) are visible",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<button id="before">Before</button>${kind.markup(tag, 'id="t" label="Title"')}${kind.markup(tag, 'id="e" label="Lane" error="Lane is required"')}`);
      await driver.forcedColors("active", "light");
      const system = [await driver.resolveColour("ButtonBorder"), await driver.resolveColour("CanvasText")];
      const boundary = await driver.computedIn("t", parts.control, "border-block-start-color");
      const width = await driver.computedIn("t", parts.control, "border-block-start-width");
      const mark = { width: await driver.computedIn("e", parts.control, "border-block-start-width"), visible: system.includes(await driver.computedIn("e", parts.control, "border-block-start-color")), text: await driver.computedIn("e", parts.error, "color") };
      await driver.pressOn("before", "Tab");
      const ring = { colour: await driver.computedIn("t", parts.control, "outline-color"), style: await driver.computedIn("t", parts.control, "outline-style") };
      const highlight = await driver.resolveColour("Highlight");
      const canvasText = await driver.resolveColour("CanvasText");
      await driver.forcedColors("none");
      assert.deepEqual(
        { boundary: system.includes(boundary), width, mark, ring },
        { boundary: true, width: px("border-width"), mark: { width: px("bar-width"), visible: true, text: canvasText }, ring: { colour: highlight, style: "solid" } },
        "US2-15",
      );
    },
  },
  {
    name: 'US2-17: autocomplete="email" on the host reaches the field',
    run: async (driver, tag) => {
      await driver.mount(input(tag, 'id="t" label="Email" autocomplete="email"'));
      assert.deepEqual({ field: (await innerAttributes(driver, "t"))?.autocomplete ?? null, property: await driver.property("t", "autocomplete") }, { field: "email", property: "email" }, "US2-17");
    },
  },
  {
    name: 'US2-18: an error in the page as first loaded is not announced and focus stays put; it is shown, and the focused field is invalid with a description ending in it; a later change to "Title is too long" is announced politely once',
    run: async (driver, tag, kind = inputKind) => {
      let state: unknown;
      const snapshots = await loaded(driver, tag, form(fl('id="t" name="title" label="Title" error="Title is taken"', kind)), async () => {
        const focus = await driver.focusChain();
        const shown = drawn(await driver.box("t", parts.error));
        await driver.batch([{ op: "focus", id: "t" }]);
        const node = await field(driver, "t", kind);
        await driver.blur();
        state = { focus, shown, invalid: node.invalid, ends: node.description.endsWith("Title is taken") };
        await settleAnnouncement(driver);
        await driver.setAttribute("t", "error", "Title is too long");
      });
      announced(driver, only(snapshots, ["t"]), [polite("Title is too long", "t")], "US2-18: announcements");
      assert.deepEqual(state, { focus: [], shown: true, invalid: "true", ends: true }, "US2-18");
    },
  },
  {
    name: "US2-19: in a container 30rem wide the host is display: block and the field as wide as the host's content box; as a flex item or with a width set by the page the field fills it",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<div id="w">${kind.markup(tag, 'id="t" label="Title"')}</div>`);
      await driver.style("w", "inline-size", "30rem");
      const host = await driver.box("t");
      const block = { display: await driver.computed("t", "display"), host: host.width, field: (await driver.box("t", parts.control)).width };
      await driver.style("t", "inline-size", "200px");
      const sized = { host: (await driver.box("t")).width, field: (await driver.box("t", parts.control)).width };
      await driver.mount(`<div id="w"><span id="s">Side</span>${kind.markup(tag, 'id="t" label="Title"')}</div>`);
      await driver.style("w", "inline-size", "30rem");
      await driver.style("w", "display", "flex");
      await driver.style("t", "flex", "1 1 0");
      const item = await driver.box("t");
      const flex = { host: item.width < 480 && item.width > 0, field: (await driver.box("t", parts.control)).width === item.width };
      assert.deepEqual({ block, sized, flex }, { block: { display: "block", host: 480, field: 480 }, sized: { host: 200, field: 200 }, flex: { host: true, field: true } }, "US2-19");
    },
  },
  ...ways.map(
    (how): FormScenario => ({
      name: `US2-20 ${how}: a form fragment inserted after parsing with two inputs holding an error announces each error politely once, at its own host, and focus does not move`,
      run: async (driver, tag, kind = inputKind) => {
        const snapshots = await insertion(driver, swapped(tag, kind), how);
        announced(driver, only(snapshots, ["t"]), [polite("Title is taken", "t")], `US2-20 ${how}: announcements`);
        announced(driver, only(snapshots, ["l"]), [polite("Lane is required", "l")], `US2-20 ${how}: announcements`);
        assert.deepEqual(await driver.focusChain(), [], `US2-20 ${how}: focus`);
      },
    }),
  ),
  {
    name: "US2-20 move: the same fragment moved within the page in one task announces nothing, the regions present and the errors visible",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount('<div id="page"><div id="d"></div><main id="c"></main></div>');
      await driver.insert("c", swapped(tag, kind), "innerHTML");
      await settleAnnouncement(driver);
      await driver.liveCapture.start("page");
      await driver.batch([
        { op: "move", id: "t", to: "d" },
        { op: "move", id: "l", to: "d" },
      ]);
      const snapshots = await driver.liveCapture.stop();
      announced(driver, only(snapshots, ["t", "l"]), [], "US2-20 move: announcements");
      assert.deepEqual(
        { regions: [regionPresent(snapshots, "t"), regionPresent(snapshots, "l")], errors: [drawn(await driver.box("t", parts.error)), drawn(await driver.box("l", parts.error))] },
        { regions: [true, true], errors: [true, true] },
        "US2-20 move",
      );
    },
  },
  {
    name: "US2-22 inserted hidden: an input inserted hidden with an error announces nothing, nor an error change while hidden; removing hidden announces the current error politely once",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount('<main id="c"></main>');
      await driver.liveCapture.start("c");
      await driver.insert("c", kind.markup(tag, 'id="t" label="Title" error="Title is taken" hidden'), "innerHTML");
      await settleAnnouncement(driver);
      await driver.setAttribute("t", "error", "Title is wrong");
      await settleAnnouncement(driver);
      await driver.setAttribute("t", "hidden", null);
      const snapshots = await driver.liveCapture.stop();
      announced(driver, only(snapshots, ["t"]), [polite("Title is wrong", "t")], "US2-22 inserted hidden: announcements");
    },
  },
  {
    name: "US2-22 first loaded hidden: an input first loaded hidden with an error, revealed, announces the error politely once",
    run: async (driver, tag, kind = inputKind) => {
      const snapshots = await loaded(driver, tag, fl('id="t" label="Title" error="Title is taken" hidden', kind), async () => {
        await driver.setAttribute("t", "hidden", null);
      });
      announced(driver, only(snapshots, ["t"]), [polite("Title is taken", "t")], "US2-22 first loaded hidden: announcements");
    },
  },
  {
    name: "US2-22 announced, hidden and revealed: an announced error, hidden and revealed with the same error, is announced once more",
    run: async (driver, tag, kind = inputKind) => {
      const snapshots = await loaded(driver, tag, fl('id="t" label="Title"', kind), async () => {
        // A change right after a first load is written no earlier than the pre-load W after the first render (R-02
        // step 2), so the error is set once that has passed, and is announced before the host hides it.
        await settleAnnouncement(driver);
        await driver.setAttribute("t", "error", "Title is taken");
        await settleAnnouncement(driver);
        await driver.setAttribute("t", "hidden", "");
        await settleAnnouncement(driver);
        await driver.setAttribute("t", "hidden", null);
      });
      announced(driver, only(snapshots, ["t"]), [polite("Title is taken", "t"), polite("Title is taken", "t")], "US2-22 announced, hidden and revealed: announcements");
    },
  },
  {
    name: "US2-22 no error: an input without an error, revealed, announces nothing, its region present and its field drawn",
    run: async (driver, tag, kind = inputKind) => {
      const snapshots = await loaded(driver, tag, fl('id="t" label="Title" hidden', kind), async () => {
        await driver.setAttribute("t", "hidden", null);
      });
      announced(driver, only(snapshots, ["t"]), [], "US2-22 no error: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "t"), field: drawn(await driver.box("t", parts.control)) }, { region: true, field: true }, "US2-22 no error");
    },
  },
  {
    name: 'US2-23: host aria-invalid, aria-required and aria-disabled "true" reach the field (aria-disabled leaving it focusable and aria-required adding no constraint); "false" changes nothing of the element\'s own error, required and disabled',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(
        kind.markup(tag, 'id="i" label="A" aria-invalid="false" error="Title is taken"') +
          kind.markup(tag, 'id="r" label="B" aria-required="false" required', "x") +
          kind.markup(tag, 'id="d" label="C" aria-disabled="false" disabled') +
          kind.markup(tag, 'id="it" label="D" aria-invalid="true"') +
          kind.markup(tag, 'id="rt" label="E" aria-required="true"') +
          kind.markup(tag, 'id="dt" label="F" aria-disabled="true"'),
      );
      const node = async (id: string): Promise<unknown> => {
        const each = await field(driver, id, kind);
        return { invalid: each.invalid, required: each.required, disabled: each.disabled, focusable: each.focusable };
      };
      // The required and aria-disabled states as the inner control carries them, and its native twins' nodes: a kind
      // whose native control Chromium's tree gives no required state (`requiredExposed`) is checked on the attributes
      // that reach it; and Chromium's tree does not tell a select's `aria-disabled=""` from `"true"` (measured), so the
      // value that reaches it is read here.
      const carried = async (id: string): Promise<unknown> => {
        const attributes = (await driver.elements(id)).find((part) => part.name === kind.inner)?.attributes ?? {};
        return { required: attributes.required ?? null, ariaRequired: attributes["aria-required"] ?? null, ariaDisabled: attributes["aria-disabled"] ?? null };
      };
      const hosts = { i: await node("i"), r: await node("r"), d: await node("d"), it: await node("it"), rt: await node("rt"), dt: await node("dt"), constraint: (await driver.validity("rt")).valid };
      const inner = { r: await carried("r"), rt: await carried("rt"), d: await carried("d"), dt: await carried("dt") };
      await driver.mount(kind.native('id="nr" aria-label="B" aria-required="false" required', "x") + kind.native('id="nrt" aria-label="E" aria-required="true"'));
      const twin = async (id: string): Promise<unknown> => {
        const each = (await driver.axDetails(id)).find((each) => each.host);
        return { required: each?.required ?? null, invalid: each?.invalid ?? null };
      };
      const required = kind.requiredExposed;
      assert.deepEqual(
        { ...hosts, inner, twins: { r: await twin("nr"), rt: await twin("nrt") } },
        {
          i: { invalid: "true", required: false, disabled: false, focusable: true },
          r: { invalid: "false", required, disabled: false, focusable: true },
          d: { invalid: "false", required: false, disabled: true, focusable: false },
          it: { invalid: "true", required: false, disabled: false, focusable: true },
          rt: { invalid: "false", required, disabled: false, focusable: true },
          dt: { invalid: "false", required: false, disabled: true, focusable: true },
          constraint: true,
          inner: {
            r: { required: "", ariaRequired: null, ariaDisabled: null },
            rt: { required: null, ariaRequired: "true", ariaDisabled: null },
            d: { required: null, ariaRequired: null, ariaDisabled: null },
            dt: { required: null, ariaRequired: null, ariaDisabled: "true" },
          },
          twins: { r: { required, invalid: "false" }, rt: { required, invalid: "false" } },
        },
        "US2-23",
      );
    },
  },
  {
    name: "FR-027 merge, 100 ms apart: two error changes W/3 apart announce only the final one, once",
    run: async (driver, tag, kind = inputKind) => {
      const snapshots = await loaded(driver, tag, fl('id="t" label="Title"', kind), async () => {
        await driver.batch([{ op: "attribute", id: "t", name: "error", value: "Title is taken" }]);
        expectGap(await driver.after(driver.W.loaded / 3), driver.W.loaded / 3, driver.W.loaded, "FR-027 merge, 100 ms apart");
        await driver.batch([{ op: "attribute", id: "t", name: "error", value: "Title is too long" }]);
      });
      announced(driver, only(snapshots, ["t"]), [polite("Title is too long", "t")], "FR-027 merge, 100 ms apart: announcements");
    },
  },
  {
    name: "FR-027 merge, A, B, A: an error that goes from A to B and back to A within the wait announces nothing, the region present and the error visible",
    run: async (driver, tag, kind = inputKind) => {
      const snapshots = await loaded(driver, tag, fl('id="t" label="Title" error="Title is taken"', kind), async () => {
        await driver.batch([{ op: "attribute", id: "t", name: "error", value: "Title is too long" }]);
        expectGap(await driver.after(driver.W.loaded / 3), driver.W.loaded / 3, driver.W.loaded, "FR-027 merge, A, B, A");
        await driver.batch([{ op: "attribute", id: "t", name: "error", value: "Title is taken" }]);
      });
      announced(driver, only(snapshots, ["t"]), [], "FR-027 merge, A, B, A: announcements");
      assert.deepEqual({ region: regionPresent(snapshots, "t"), error: drawn(await driver.box("t", parts.error)) }, { region: true, error: true }, "FR-027 merge, A, B, A");
    },
  },
  {
    name: "Edge case, error while focused: an error set while the field has focus is announced politely once; set again to the same text it is not, the error visible, in the field's description and focus still in the field",
    run: async (driver, tag, kind = inputKind) => {
      let state: unknown;
      const snapshots = await loaded(driver, tag, fl('id="t" label="Title"', kind), async () => {
        await driver.batch([{ op: "focus", id: "t" }]);
        await driver.setAttribute("t", "error", "Title is taken");
        await settleAnnouncement(driver);
        await driver.setAttribute("t", "error", "Title is taken");
        await settleAnnouncement(driver);
        // The host entry is the first-load host's: the scenario's tag on the fixture pages, a fresh
        // ocelle-first-load-N-T subclass tag in process (in-process.ts registerFirstLoad). Either form is accepted in
        // both harnesses, every other tag fails; the inner entry is exact, so focus is on the native input.
        const host = new RegExp(`^(?:${tag}|ocelle-first-load-\\d+-\\d+)#t$`, "u");
        const focus = (await driver.focusChain()).map((each, index) => (index === 0 && host.test(each) ? "<first-load host>#t" : each));
        state = { error: drawn(await driver.box("t", parts.error)), description: (await field(driver, "t", kind)).description, focus };
      });
      announced(driver, only(snapshots, ["t"]), [polite("Title is taken", "t")], "Edge case, error while focused: announcements");
      assert.deepEqual(state, { error: true, description: "Title is taken", focus: ["<first-load host>#t", `${kind.inner}#control`] }, "Edge case, error while focused");
    },
  },
  {
    name: "Edge case, hidden ancestor: an input with an error in a container with hidden, in a closed details and in a display: none panel, then shown, announces nothing, the error visible and in the field's description",
    run: async (driver, tag, kind = inputKind) => {
      const markup =
        `<div id="p1" hidden>${fl('id="t1" label="One" error="One is wrong"', kind)}</div>` +
        `<details id="p2"><summary>More</summary>${fl('id="t2" label="Two" error="Two is wrong"', kind)}</details>` +
        `<div id="p3">${fl('id="t3" label="Three" error="Three is wrong"', kind)}</div>`;
      const snapshots = await loaded(driver, tag, markup, async () => {
        await driver.style("p3", "display", "none");
        await settleAnnouncement(driver);
        await driver.batch([
          { op: "attribute", id: "p1", name: "hidden", value: null },
          { op: "attribute", id: "p2", name: "open", value: "" },
        ]);
        await driver.style("p3", "display", "block");
      });
      announced(driver, only(snapshots, ["t1", "t2", "t3"]), [], "Edge case, hidden ancestor: announcements");
      const hosts = ["t1", "t2", "t3"];
      const errors: boolean[] = [];
      const descriptions: string[] = [];
      for (const id of hosts) {
        errors.push(drawn(await driver.box(id, parts.error)));
        descriptions.push((await field(driver, id, kind)).description);
      }
      assert.deepEqual({ errors, descriptions }, { errors: [true, true, true], descriptions: ["One is wrong", "Two is wrong", "Three is wrong"] }, "Edge case, hidden ancestor");
    },
  },
  {
    name: "FR-025, FR-028: label, field, description and error in their token styles: the label text style; the field on the sheet with the control border, the radius and at least the target size; the description and the error in their colours at the small size; the error boundary in danger at the bar width",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(kind.markup(tag, 'id="t" label="Title" description="Shown on the lane card"') + kind.markup(tag, 'id="e" label="Lane" error="Lane is required"'));
      const small = px("font-size-sm");
      const leading = lineHeight("line-height-normal", small);
      const text = async (id: string, part: string): Promise<Record<string, string>> => ({
        colour: await driver.computedIn(id, part, "color"),
        size: await driver.computedIn(id, part, "font-size"),
        line: await driver.computedIn(id, part, "line-height"),
      });
      const control = await driver.box("t", parts.control);
      assert.deepEqual(
        {
          label: { ...(await text("t", parts.label)), weight: await driver.computedIn("t", parts.label, "font-weight") },
          field: {
            ground: await driver.computedIn("t", parts.control, "background-color"),
            boundary: await driver.computedIn("t", parts.control, "border-block-start-color"),
            width: await driver.computedIn("t", parts.control, "border-block-start-width"),
            radius: await driver.computedIn("t", parts.control, "border-start-start-radius"),
            target: control.height >= Number(used("target-min")),
          },
          description: await text("t", parts.description),
          error: await text("e", parts.error),
          mark: await errorLook(driver, "e"),
        },
        {
          label: { colour: tokenColour("color-ink", "light"), size: small, line: leading, weight: String(used("font-weight-strong")) },
          field: { ground: tokenColour("color-sheet", "light"), boundary: tokenColour("color-control-border", "light"), width: px("border-width"), radius: px("radius-2"), target: true },
          description: { colour: tokenColour("color-ink-muted", "light"), size: small, line: leading },
          error: { colour: tokenColour("color-danger", "light"), size: small, line: leading },
          mark: { text: tokenColour("color-danger", "light"), boundary: tokenColour("color-danger", "light"), width: px("bar-width") },
        },
        "FR-025, FR-028",
      );
    },
  },
  {
    name: "FR-002: the field inherits the host's font: a distinctive family, size, weight and line height set on the host are the field's computed values",
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(kind.markup(tag, 'id="t" label="Title"'));
      await driver.style("t", "font-family", "serif");
      await driver.style("t", "font-size", "19px");
      await driver.style("t", "font-weight", "700");
      await driver.style("t", "line-height", "31px");
      const seen: Record<string, string> = {};
      const expected: Record<string, string> = {};
      for (const property of ["font-family", "font-size", "font-weight", "line-height"]) {
        seen[property] = await driver.computedIn("t", parts.control, property);
        expected[property] = await driver.computed("t", property);
      }
      assert.deepEqual({ seen, sized: seen["font-size"] }, { seen: expected, sized: "19px" }, "FR-002");
    },
  },
  {
    name: "FR-029, FR-021: each pass-through attribute reflects to its property and back and reaches the field unchanged; readOnly is a boolean, minLength and maxLength numbers, the others strings; absent, each reads undefined (readOnly false) and the field has no such attribute, with no length limit; there is no defaultValue",
    run: async (driver, tag) => {
      const strings = [["placeholder", "placeholder", "Filter", "Lanes"], ["autocomplete", "autocomplete", "email", "off"], ["inputMode", "inputmode", "numeric", "text"], ["pattern", "pattern", "[a-z]+", "[0-9]+"], ["min", "min", "1", "2"], ["max", "max", "8", "9"], ["step", "step", "2", "3"]] as const;
      const numbers = [["minLength", "minlength", "2", 4], ["maxLength", "maxlength", "8", 9]] as const;
      await driver.mount(input(tag, 'id="t"'));
      const bare = await innerAttributes(driver, "t");
      const absent: Record<string, unknown> = {};
      for (const [property, attribute] of [...strings, ...numbers]) absent[property] = { type: await driver.typeOf("t", property), field: bare === null ? "no field" : (bare[attribute] ?? null) };
      absent.readOnly = { type: await driver.typeOf("t", "readOnly"), value: await driver.property("t", "readOnly"), field: bare === null ? "no field" : (bare.readonly ?? null) };
      const expectedAbsent: Record<string, unknown> = {};
      for (const [property] of [...strings, ...numbers]) expectedAbsent[property] = { type: "undefined", field: null };
      expectedAbsent.readOnly = { type: "boolean", value: false, field: null };
      const seen: Record<string, unknown> = {};
      const expected: Record<string, unknown> = {};
      for (const [property, attribute, written, set] of strings) {
        await driver.setAttribute("t", attribute, written);
        const fromAttribute = { property: await driver.property("t", property), field: (await innerAttributes(driver, "t"))?.[attribute] ?? null };
        await driver.batch([{ op: "property", id: "t", name: property, value: set }]);
        seen[property] = { fromAttribute, fromProperty: { attribute: await driver.attribute("t", attribute), field: (await innerAttributes(driver, "t"))?.[attribute] ?? null } };
        expected[property] = { fromAttribute: { property: written, field: written }, fromProperty: { attribute: set, field: set } };
      }
      for (const [property, attribute, written, set] of numbers) {
        await driver.setAttribute("t", attribute, written);
        const fromAttribute = { property: await driver.property("t", property), type: await driver.typeOf("t", property), field: (await innerAttributes(driver, "t"))?.[attribute] ?? null };
        await driver.batch([{ op: "property", id: "t", name: property, value: set }]);
        seen[property] = { fromAttribute, fromProperty: { attribute: await driver.attribute("t", attribute), field: (await innerAttributes(driver, "t"))?.[attribute] ?? null } };
        expected[property] = { fromAttribute: { property: Number(written), type: "number", field: written }, fromProperty: { attribute: String(set), field: String(set) } };
      }
      await driver.setAttribute("t", "readonly", "");
      const readOnly = { property: await driver.property("t", "readOnly"), field: (await innerAttributes(driver, "t"))?.readonly ?? null };
      await driver.batch([{ op: "property", id: "t", name: "readOnly", value: false }]);
      seen.readOnly = { fromAttribute: readOnly, fromProperty: { attribute: await driver.attribute("t", "readonly"), field: (await innerAttributes(driver, "t"))?.readonly ?? null } };
      expected.readOnly = { fromAttribute: { property: true, field: "" }, fromProperty: { attribute: null, field: null } };
      await driver.mount(input(tag, 'id="t"'));
      const long = "x".repeat(600);
      await driver.type("t", long);
      assert.deepEqual(
        { absent, seen, kept: await driver.property("t", "value"), defaultValue: await driver.has("t", "defaultValue") },
        { absent: expectedAbsent, seen: expected, kept: long, defaultValue: false },
        "FR-029, FR-021",
      );
    },
  },
  {
    name: 'Edge case, number: type="number" with typed "1e", which a native number input cannot parse, reads "" and badInput, as the native twin',
    run: async (driver, tag) => {
      await driver.mount(input(tag, 'id="t" type="number"') + '<input id="n" type="number">');
      await driver.type("t", "1e");
      await driver.type("n", "1e");
      const side = async (id: string): Promise<unknown> => ({ value: await driver.property(id, "value"), badInput: (await driver.validity(id)).badInput });
      assert.deepEqual({ element: await side("t"), native: await side("n") }, { element: { value: "", badInput: true }, native: { value: "", badInput: true } }, "Edge case, number");
    },
  },
  {
    name: "Edge case, long unbroken text: a long unbroken label, description and error wrap inside a narrower container, the host within it, each part growing in block size",
    run: async (driver, tag, kind = inputKind) => {
      const long = "x".repeat(120);
      await driver.mount(`<div id="w">${kind.markup(tag, `id="t" label="${long}" description="${long}" error="${long}"`)}</div>`);
      await driver.style("w", "inline-size", "160px");
      const container = await driver.box("w");
      const host = await driver.box("t");
      const within = (box: Box): boolean => box.x >= host.x - 0.5 && box.x + box.width <= host.x + host.width + 0.5;
      const seen: Record<string, unknown> = { host: host.x >= container.x - 0.5 && host.x + host.width <= container.x + container.width + 0.5 };
      for (const part of ["label", "description", "error"] as const) {
        const box = await driver.box("t", parts[part]);
        seen[part] = { within: drawn(box) && within(box), grown: box.height > 2 * Number.parseFloat(lineHeight("line-height-normal", px("font-size-sm"))) };
      }
      const wrapped = { within: true, grown: true };
      assert.deepEqual(seen, { host: true, label: wrapped, description: wrapped, error: wrapped }, "Edge case, long unbroken text");
    },
  },
  {
    name: 'Edge case, right to left: under dir="rtl" on an ancestor the label, field, description and error are rtl, the label and the error starting at the right edge of the host\'s content box',
    run: async (driver, tag, kind = inputKind) => {
      await driver.mount(`<div id="w" dir="rtl">${kind.markup(tag, 'id="t" label="Title" description="Shown on the lane card" error="Title is taken"')}</div>`);
      const host = await driver.box("t");
      const directions: Record<string, string> = {};
      for (const part of ["label", "control", "description", "error"] as const) directions[part] = await driver.computedIn("t", parts[part], "direction");
      const starts = async (part: string): Promise<boolean> => {
        const box = await driver.box("t", part);
        return drawn(box) && box.width < host.width && Math.abs(box.x + box.width - (host.x + host.width)) < 0.5;
      };
      assert.deepEqual(
        { directions, label: await starts(parts.label), error: await starts(parts.error) },
        { directions: { label: "rtl", control: "rtl", description: "rtl", error: "rtl" }, label: true, error: true },
        "Edge case, right to left",
      );
    },
  },
  {
    name: "Edge case, two copies: a second class defined for the tag through the guarded registration leaves the first, and an input created afterwards is in its form's data",
    run: async (driver, tag) => {
      await driver.mount('<main id="c"></main>');
      await driver.defineSecond(tag);
      await driver.insert("c", form(input(tag, 'id="t" name="title" value="draft"')), "innerHTML");
      assert.deepEqual({ data: await driver.formData("f"), value: await driver.property("t", "value") }, { data: [["title", "draft"]], value: "draft" }, "Edge case, two copies");
    },
  },
];

/** A scenario by the start of its name, for the plant rows. */
export function formInputScenario(prefix: string): FormScenario {
  const found = formInputScenarios.find((scenario) => scenario.name.startsWith(prefix));
  if (found === undefined) throw new Error(`no form-input scenario ${prefix}`);
  return found;
}
