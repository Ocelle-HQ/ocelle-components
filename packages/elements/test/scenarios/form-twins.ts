// The native twins of `ocelle-form-input` (specs/010-feedback-forms contracts/testing.md § Twins; spec US2 scenarios
// 16 and 21, SC-003, FR-020, FR-030 and the Edge Cases "outside any form" and `form="other-form"`; T032), and of
// `ocelle-form-select` (US3 scenarios 5 to 7, SC-003; T050), written after the input's. Each row
// builds the element and a native `<input>` with the same attributes, each in a form of its own (or both outside any
// form), takes the same steps on both, and asserts that each side equals the table's absolute outcome, so that two
// empty or `null` sides cannot pass, and that the element's validity equals its twin's flag by flag. The field's typed
// value is `Fix lane` and its default value `draft`. The shared rows run in both harnesses; the history-restore row only
// on fixture pages (`navigateAwayAndBack`), and the in-process restore test, which calls `formStateRestoreCallback`
// directly so that Stryker covers the restore logic, only in process.
import { assert } from "vitest";
import type { Driver, Entries, FixtureDriver, InProcessDriver, Validity } from "./driver.ts";
import { form, inField, input, parts } from "./form-input.ts";
import type { FormScenario } from "./form-input.ts";
import { nativeSelect, select } from "./form-select.ts";

const typed = "Fix lane";

/** One side of a twin: its form data (of `formId`), its validity and its value. */
interface Side {
  readonly data: Entries;
  readonly validity: Validity;
  readonly value: unknown;
}

async function side(driver: Driver, id: string, formId: string): Promise<Side> {
  return { data: await driver.formData(formId), validity: await driver.validity(id), value: await driver.property(id, "value") };
}

/** The table's outcome fields of a side: the form data and the named validity fields. */
function outcome(of: Side, fields: readonly (keyof Validity)[], data: boolean): Record<string, unknown> {
  const picked: Record<string, unknown> = Object.fromEntries(fields.map((name) => [name, of.validity[name]]));
  if (data) picked.data = of.data;
  return picked;
}

interface Row {
  readonly name: string;
  /** The attributes both sides get, as written. */
  readonly attributes: string;
  /** Whether each side sits in a disabled fieldset. */
  readonly fieldset?: boolean;
  /** Whether `Fix lane` is typed into each side. */
  readonly type: boolean;
  /** Whether the form is reset after typing. */
  readonly reset?: boolean;
  /** Whether a submit of each side's form is taken (its result is part of the outcome). */
  readonly submit?: boolean;
  readonly fields: readonly (keyof Validity)[];
  readonly data: boolean;
  readonly expected: Record<string, unknown>;
}

const rows: readonly Row[] = [
  { name: 'SC-003 name: name="title", enabled, not required', attributes: 'name="title"', type: true, fields: ["valid"], data: true, expected: { valid: true, data: [["title", typed]] } },
  { name: "SC-003 no name: without name", attributes: "", type: true, fields: ["valid"], data: true, expected: { valid: true, data: [] } },
  { name: "SC-003 disabled: disabled", attributes: `name="title" value="${typed}" disabled`, type: false, fields: ["willValidate"], data: true, expected: { willValidate: false, data: [] } },
  { name: "SC-003 fieldset: inside <fieldset disabled>", attributes: `name="title" value="${typed}"`, fieldset: true, type: false, fields: ["willValidate"], data: true, expected: { willValidate: false, data: [] } },
  { name: "SC-003 required, empty: required with an empty value", attributes: 'name="title" required', type: false, submit: true, fields: ["valueMissing", "valid"], data: false, expected: { valueMissing: true, valid: false, submitted: null } },
  { name: "SC-003 required, filled: required with the value Fix lane", attributes: 'name="title" required', type: true, fields: ["valueMissing", "valid"], data: false, expected: { valueMissing: false, valid: true } },
  { name: "SC-003 reset: after a form reset", attributes: 'name="title" value="draft"', type: true, reset: true, fields: [], data: true, expected: { data: [["title", "draft"]] } },
];

function twinRow(row: Row): FormScenario {
  return {
    name: `${row.name}: the element and its native twin both give ${JSON.stringify(row.expected)}`,
    run: async (driver, tag) => {
      const wrap = (content: string): string => (row.fieldset === true ? `<fieldset disabled>${content}</fieldset>` : content);
      await driver.mount(form(wrap(input(tag, `id="t" ${row.attributes}`))) + form(wrap(`<input id="n" ${row.attributes}>`), "g"));
      if (row.type) {
        await driver.type("t", typed);
        await driver.type("n", typed);
      }
      if (row.reset === true) {
        await driver.reset("f");
        await driver.reset("g");
      }
      const element = await side(driver, "t", "f");
      const native = await side(driver, "n", "g");
      const seen = { element: outcome(element, row.fields, row.data), native: outcome(native, row.fields, row.data) };
      if (row.submit === true) {
        seen.element.submitted = await driver.submit("f");
        seen.native.submitted = await driver.submit("g");
      }
      const label = row.name.slice(0, row.name.indexOf(":"));
      assert.deepEqual(seen, { element: row.expected, native: row.expected }, label);
      assert.deepEqual(element.validity, native.validity, `${label}: validity flag by flag`);
    },
  };
}

/** An Enter row of US2-21: each side's form content, the fields filled, the field Enter is pressed in, and what the submission returns. */
interface EnterRow {
  readonly name: string;
  readonly element: (tag: string) => string;
  readonly native: string;
  readonly fill: readonly string[];
  readonly enter: readonly [string, string];
  readonly expected: Entries | null;
}

const enterRows: readonly EnterRow[] = [
  {
    name: "US2-21 button: a form with a submit button, Enter in the field submits",
    element: (t) => input(t, 'id="t" name="title"') + "<button>Go</button>",
    native: '<input id="n" name="title"><button>Go</button>',
    fill: ["t", "n"],
    enter: ["t", "n"],
    expected: [["title", typed]],
  },
  {
    name: "US2-21 button, required empty: a form with a submit button, required and empty, Enter does not submit and the field is focused",
    element: (t) => input(t, 'id="t" name="title" required') + "<button>Go</button>",
    native: '<input id="n" name="title" required><button>Go</button>',
    fill: [],
    enter: ["t", "n"],
    expected: null,
  },
  {
    name: "US2-21 one field: a form with no submit button and one field, Enter submits",
    element: (t) => input(t, 'id="t" name="title"'),
    native: '<input id="n" name="title">',
    fill: ["t", "n"],
    enter: ["t", "n"],
    expected: [["title", typed]],
  },
  {
    name: "US2-21 two fields: a form with no submit button and two fields, Enter in the first does not submit",
    element: (t) => input(t, 'id="t" name="title"') + input(t, 'id="t2" name="lane"'),
    native: '<input id="n" name="title"><input id="n2" name="lane">',
    fill: ["t", "n"],
    enter: ["t", "n"],
    expected: null,
  },
];

function enterRow(index: number): FormScenario {
  const name = enterRows[index]?.name ?? "";
  return {
    name: `${name}, as its native twin does`,
    run: async (driver, tag) => {
      const row = enterRows[index];
      if (row === undefined) throw new Error(`no Enter row ${String(index)}`);
      await driver.mount(form(row.element(tag)) + form(row.native, "g"));
      for (const id of row.fill) await driver.type(id, typed);
      await driver.pressOn(row.enter[0], "Enter");
      const element = { submitted: await driver.submit("f"), focus: await driver.focusChain() };
      await driver.pressOn(row.enter[1], "Enter");
      const native = { submitted: await driver.submit("g"), focus: await driver.focusChain() };
      const label = name.slice(0, name.indexOf(":"));
      assert.deepEqual({ element: element.submitted, native: native.submitted }, { element: row.expected, native: row.expected }, label);
      // Enter leaves focus in the field it was pressed in; with a failed constraint the validation focuses that field.
      assert.deepEqual({ element: element.focus, native: native.focus }, { element: inField(tag), native: ["input#n"] }, `${label}: focus`);
    },
  };
}

export const twinScenarios: readonly FormScenario[] = [
  ...rows.map(twinRow),
  ...enterRows.map((_, index) => enterRow(index)),
  {
    name: "US2-21 mixed: a form with no submit button, one native text input and the element: Enter in the element does not submit, as the two-field twin; Enter in the native input submits both entries, the browser's own rule",
    run: async (driver, tag) => {
      await driver.mount(form(`<input id="m" name="lane">${input(tag, 'id="t" name="title"')}`));
      await driver.type("m", "Todo");
      await driver.type("t", typed);
      await driver.pressOn("t", "Enter");
      const inElement = await driver.submit("f");
      await driver.pressOn("m", "Enter");
      const inNative = await driver.submit("f");
      assert.deepEqual({ inElement, inNative }, { inElement: null, inNative: [["lane", "Todo"], ["title", typed]] }, "US2-21 mixed");
    },
  },
  {
    name: 'SC-003 form="other": name="title" and form="other" inside form main, with form other elsewhere, belongs to other, as its native twin',
    run: async (driver, tag) => {
      await driver.mount(
        form(input(tag, 'id="t" name="title" form="other"'), "main") + form("", "other") + form('<input id="n" name="title" form="other2">', "main2") + form("", "other2"),
      );
      await driver.type("t", typed);
      await driver.type("n", typed);
      const seen = {
        element: { other: await driver.formData("other"), main: await driver.formData("main"), form: await driver.ids("t", "form") },
        native: { other: await driver.formData("other2"), main: await driver.formData("main2"), form: await driver.ids("n", "form") },
      };
      assert.deepEqual(seen, { element: { other: [["title", typed]], main: [], form: ["other"] }, native: { other: [["title", typed]], main: [], form: ["other2"] } }, 'SC-003 form="other"');
    },
  },
  {
    name: "SC-003 outside any form: with form main elsewhere, form is null and main has no entry, value, willValidate and validity work, and required and empty it is valueMissing, as its native twin",
    run: async (driver, tag) => {
      const observe = async (id: string): Promise<unknown> => {
        const validity = await driver.validity(id);
        return { form: await driver.ids(id, "form"), main: await driver.formData("main"), value: await driver.property(id, "value"), willValidate: validity.willValidate, valid: validity.valid };
      };
      await driver.mount(form("", "main") + input(tag, 'id="t" name="title"') + '<input id="n" name="title">');
      await driver.type("t", typed);
      await driver.type("n", typed);
      const filled = { element: await observe("t"), native: await observe("n") };
      await driver.mount(form("", "main") + input(tag, 'id="t" name="title" required') + '<input id="n" name="title" required>');
      const empty = { element: (await driver.validity("t")).valueMissing, native: (await driver.validity("n")).valueMissing };
      const expected = { form: [], main: [], value: typed, willValidate: true, valid: true };
      assert.deepEqual({ filled, empty }, { filled: { element: expected, native: expected }, empty: { element: true, native: true } }, "SC-003 outside any form");
    },
  },
];

/** A twin row by the start of its name, for the plant rows. */
export function twinScenario(prefix: string): FormScenario {
  const found = twinScenarios.find((scenario) => scenario.name.startsWith(prefix));
  if (found === undefined) throw new Error(`no twin scenario ${prefix}`);
  return found;
}

/** The fixture page of the history-restore row, served with `Cache-Control: no-store` (test/browser/serve.ts). */
export const restorePage = "no-store/form-restore.html";

/**
 * US2-16, SC-003 history restore (fixture pages only): on a no-store page holding the element `t` in form `f` and its
 * twin `n` in form `g` as first loaded, the value typed into each is restored when the user navigates away and back;
 * the page is a new document (`pageshow.persisted` false), and the element shows and submits the restored value.
 */
export const restoreScenario = {
  name: "US2-16, SC-003 history restore: a value typed on a no-store page is restored by back navigation into a new document, shown and submitted, as its native twin",
  run: async (driver: FixtureDriver): Promise<void> => {
    await driver.type("t", typed);
    await driver.type("n", typed);
    const persisted = await driver.navigateAwayAndBack();
    const element = { value: await driver.property("t", "value"), shown: await driver.propertyIn("t", parts.control, "value"), data: await driver.formData("f") };
    const native = { value: await driver.property("n", "value"), data: await driver.formData("g") };
    const submitted = await driver.submit("f");
    assert.deepEqual(
      { persisted, element, native, submitted },
      { persisted: false, element: { value: typed, shown: typed, data: [["title", typed]] }, native: { value: typed, data: [["title", typed]] }, submitted: [["title", typed]] },
      "US2-16, SC-003 history restore",
    );
  },
} as const;

/**
 * SC-003 restore in process: the host is first checked to be an instance of the module's `OcelleFormInput` (`base`),
 * so that before the element exists the test fails on that assertion and not on a missing method; then
 * `formStateRestoreCallback("Fix lane", "restore")` is called on it directly, as the browser does on history restore.
 * The value is restored, shown, in the form data, and no change event is dispatched.
 */
export const restoreInProcess = {
  name: "SC-003 restore in process: formStateRestoreCallback(state, \"restore\") restores the value, shown and in the form data, with no change event",
  run: async (driver: InProcessDriver, tag: string, base: abstract new (...args: never[]) => unknown): Promise<void> => {
    await driver.mount(form(input(tag, 'id="t" name="title" value="draft"')));
    assert.deepEqual(await driver.instanceOf("t", base), true, "SC-003 restore in process: the host is an OcelleFormInput");
    await driver.listenFor(["t"], ["ocelle-form-input-change", "input"]);
    await driver.call("t", "formStateRestoreCallback", typed, "restore");
    assert.deepEqual(
      { value: await driver.property("t", "value"), shown: await driver.propertyIn("t", parts.control, "value"), data: await driver.formData("f"), heard: await driver.heardEvents() },
      { value: typed, shown: typed, data: [["title", typed]], heard: [] },
      "SC-003 restore in process",
    );
  },
} as const;

// The select's twins (specs/010-feedback-forms T050; contracts/testing.md § Twins: "the select's rows follow the same
// pattern with its options"). Each row builds the element and a native `<select>` with the same attributes and options,
// each in a form of its own, takes the same steps on both (the choice made with ArrowDown on the focused select, as the
// user makes it), and asserts that each side equals the row's absolute outcome and that the element's validity equals
// its twin's flag by flag. The chosen value is `done` and the default `todo`.

/** The options of the select twins: "To do", the default, and "Done", the one ArrowDown chooses. */
const choices = '<option value="todo">To do</option><option value="done">Done</option>';
/** The options of the required twins: a first option of empty value, selected, then the choices. */
const placeholder = `<option value="">Choose a lane</option>${choices}`;

interface SelectRow {
  readonly name: string;
  readonly attributes: string;
  readonly options: string;
  readonly fieldset?: boolean;
  /** Whether ArrowDown is pressed on each side. */
  readonly choose: boolean;
  readonly reset?: boolean;
  readonly submit?: boolean;
  readonly fields: readonly (keyof Validity)[];
  readonly data: boolean;
  readonly expected: Record<string, unknown>;
}

const selectRows: readonly SelectRow[] = [
  { name: 'SC-003 select name: name="lane", enabled, not required', attributes: 'name="lane"', options: choices, choose: true, fields: ["valid"], data: true, expected: { valid: true, data: [["lane", "done"]] } },
  { name: "SC-003 select no name: without name", attributes: "", options: choices, choose: true, fields: ["valid"], data: true, expected: { valid: true, data: [] } },
  { name: "SC-003 select disabled: disabled", attributes: 'name="lane" disabled', options: choices, choose: false, fields: ["willValidate"], data: true, expected: { willValidate: false, data: [] } },
  { name: "SC-003 select fieldset: inside <fieldset disabled>", attributes: 'name="lane"', options: choices, fieldset: true, choose: false, fields: ["willValidate"], data: true, expected: { willValidate: false, data: [] } },
  { name: "SC-003 select required, empty: required with the empty first option selected", attributes: 'name="lane" required', options: placeholder, choose: false, submit: true, fields: ["valueMissing", "valid"], data: false, expected: { valueMissing: true, valid: false, submitted: null } },
  { name: "SC-003 select required, chosen: required with To do chosen", attributes: 'name="lane" required', options: placeholder, choose: true, fields: ["valueMissing", "valid"], data: true, expected: { valueMissing: false, valid: true, data: [["lane", "todo"]] } },
  { name: "SC-003 select reset: after a form reset", attributes: 'name="lane"', options: choices, choose: true, reset: true, fields: [], data: true, expected: { data: [["lane", "todo"]] } },
];

function selectTwinRow(row: SelectRow): FormScenario {
  return {
    name: `${row.name}: the element and its native twin both give ${JSON.stringify(row.expected)}`,
    run: async (driver, tag) => {
      const wrap = (content: string): string => (row.fieldset === true ? `<fieldset disabled>${content}</fieldset>` : content);
      await driver.mount(form(wrap(select(tag, `id="t" ${row.attributes}`, row.options))) + form(wrap(nativeSelect(`id="n" ${row.attributes}`, row.options)), "g"));
      if (row.choose) {
        await driver.pressOn("t", "ArrowDown");
        await driver.pressOn("n", "ArrowDown");
      }
      if (row.reset === true) {
        await driver.reset("f");
        await driver.reset("g");
      }
      const element = await side(driver, "t", "f");
      const native = await side(driver, "n", "g");
      const seen = { element: outcome(element, row.fields, row.data), native: outcome(native, row.fields, row.data) };
      if (row.submit === true) {
        seen.element.submitted = await driver.submit("f");
        seen.native.submitted = await driver.submit("g");
      }
      const label = row.name.slice(0, row.name.indexOf(":"));
      assert.deepEqual(seen, { element: row.expected, native: row.expected }, label);
      assert.deepEqual(element.validity, native.validity, `${label}: validity flag by flag`);
    },
  };
}

export const selectTwinScenarios: readonly FormScenario[] = [
  ...selectRows.map(selectTwinRow),
  {
    name: 'SC-003 select form="other": name="lane" and form="other" inside form main, with form other elsewhere, belongs to other, as its native twin',
    run: async (driver, tag) => {
      await driver.mount(
        form(select(tag, 'id="t" name="lane" form="other"', choices), "main") + form("", "other") + form(nativeSelect('id="n" name="lane" form="other2"', choices), "main2") + form("", "other2"),
      );
      await driver.pressOn("t", "ArrowDown");
      await driver.pressOn("n", "ArrowDown");
      const seen = {
        element: { other: await driver.formData("other"), main: await driver.formData("main"), form: await driver.ids("t", "form") },
        native: { other: await driver.formData("other2"), main: await driver.formData("main2"), form: await driver.ids("n", "form") },
      };
      assert.deepEqual(seen, { element: { other: [["lane", "done"]], main: [], form: ["other"] }, native: { other: [["lane", "done"]], main: [], form: ["other2"] } }, 'SC-003 select form="other"');
    },
  },
  {
    name: "SC-003 select outside any form: with form main elsewhere, form is null and main has no entry, value, willValidate and validity work, and required with the empty option selected it is valueMissing, as its native twin",
    run: async (driver, tag) => {
      const observe = async (id: string): Promise<unknown> => {
        const validity = await driver.validity(id);
        return { form: await driver.ids(id, "form"), main: await driver.formData("main"), value: await driver.property(id, "value"), willValidate: validity.willValidate, valid: validity.valid };
      };
      await driver.mount(form("", "main") + select(tag, 'id="t" name="lane"', choices) + nativeSelect('id="n" name="lane"', choices));
      await driver.pressOn("t", "ArrowDown");
      await driver.pressOn("n", "ArrowDown");
      const chosen = { element: await observe("t"), native: await observe("n") };
      await driver.mount(form("", "main") + select(tag, 'id="t" name="lane" required', placeholder) + nativeSelect('id="n" name="lane" required', placeholder));
      const empty = { element: (await driver.validity("t")).valueMissing, native: (await driver.validity("n")).valueMissing };
      const expected = { form: [], main: [], value: "done", willValidate: true, valid: true };
      assert.deepEqual({ chosen, empty }, { chosen: { element: expected, native: expected }, empty: { element: true, native: true } }, "SC-003 select outside any form");
    },
  },
];

/** The fixture page of the select's history-restore row, served with `Cache-Control: no-store` (test/browser/serve.ts). */
export const selectRestorePage = "no-store/form-select-restore.html";

/**
 * US3-7 (US2-16), SC-003 select history restore (fixture pages only): on a no-store page holding the element `t` in
 * form `f` and its twin `n` in form `g` as first loaded, each with the options To do and Done, the choice made with
 * ArrowDown is restored when the user navigates away and back; the page is a new document, and the element shows and
 * submits the restored choice.
 */
export const selectRestoreScenario = {
  name: "US3-7 (US2-16), SC-003 select history restore: a choice made on a no-store page is restored by back navigation into a new document, shown and submitted, as its native twin",
  run: async (driver: FixtureDriver): Promise<void> => {
    await driver.pressOn("t", "ArrowDown");
    await driver.pressOn("n", "ArrowDown");
    const persisted = await driver.navigateAwayAndBack();
    const element = { value: await driver.property("t", "value"), shown: await driver.propertyIn("t", parts.control, "value"), data: await driver.formData("f") };
    const native = { value: await driver.property("n", "value"), data: await driver.formData("g") };
    const submitted = await driver.submit("f");
    assert.deepEqual(
      { persisted, element, native, submitted },
      { persisted: false, element: { value: "done", shown: "done", data: [["lane", "done"]] }, native: { value: "done", data: [["lane", "done"]] }, submitted: [["lane", "done"]] },
      "US3-7 (US2-16), SC-003 select history restore",
    );
  },
} as const;

/**
 * SC-003 select restore in process: the host is first checked to be an instance of the module's `OcelleFormSelect`
 * (`base`), then `formStateRestoreCallback("done", "restore")` is called on it directly, as the browser does on history
 * restore. The choice is restored, shown, in the form data, and no event is dispatched.
 */
export const selectRestoreInProcess = {
  name: 'SC-003 select restore in process: formStateRestoreCallback(state, "restore") restores the choice, shown and in the form data, with no event',
  run: async (driver: InProcessDriver, tag: string, base: abstract new (...args: never[]) => unknown): Promise<void> => {
    await driver.mount(form(select(tag, 'id="t" name="lane"', choices)));
    assert.deepEqual(await driver.instanceOf("t", base), true, "SC-003 select restore in process: the host is an OcelleFormSelect");
    await driver.listenFor(["t"], ["ocelle-form-select-change", "input"]);
    await driver.call("t", "formStateRestoreCallback", "done", "restore");
    assert.deepEqual(
      { value: await driver.property("t", "value"), shown: await driver.propertyIn("t", parts.control, "value"), data: await driver.formData("f"), heard: await driver.heardEvents(), focus: await driver.focusChain() },
      { value: "done", shown: "done", data: [["lane", "done"]], heard: [], focus: [] },
      "SC-003 select restore in process",
    );
  },
} as const;
