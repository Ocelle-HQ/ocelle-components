import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { afterTask } from "../src/live.ts";
import { OcelleFormSelect } from "../src/ocelle-form-select.ts";

// The select's rules one at a time (specs/010-feedback-forms FR-021, FR-024, FR-031; research.md R-07; data-model.md
// § Select-only fields; T057's phase-end mutation run): each test drives one rule of src/ocelle-form-select.ts through
// the DOM and reads the result on the element itself and on its own shadow root (the native select's options, its
// selection and validity), synchronously where the rule is a synchronous one, and compares it with a native `<select>`
// given the same children and steps wherever the spec says "as a native select". The scenarios of
// scenarios/form-select.ts measure the same rules through the accessibility tree, the form data and the keyboard, after
// the elements have rendered; here a rule whose effect lasts only until the next render, or that only an order of
// events shows, is read directly.

/** The end of the current task: the `MutationObserver` records, Lit's update and the end-of-task steps posted before. */
const endOfTask = (): Promise<void> =>
  new Promise((resolve) => {
    afterTask(resolve);
  });

let container: HTMLElement;

function byId<T extends Element>(id: string, kind: abstract new () => T): T {
  const found = document.getElementById(id);
  if (!(found instanceof kind)) throw new Error(`no #${id} of the kind asked`);
  return found;
}

/** The native select in the shadow root of `of`. */
function inner(of: OcelleFormSelect): HTMLSelectElement {
  const found = of.shadowRoot?.querySelector("select");
  if (found === undefined || found === null) throw new Error("no inner select");
  return found;
}

/** The mirrored options and groups of `of`'s native select, each as its local name and its attributes. */
function mirrored(of: OcelleFormSelect): { name: string; attributes: Record<string, string> }[] {
  return [...inner(of).querySelectorAll("*")].map((each) => ({ name: each.localName, attributes: Object.fromEntries([...each.attributes].map((attribute) => [attribute.name, attribute.value])) }));
}

/** Inserts `markup` after load and ends the task. */
async function insert(markup: string): Promise<void> {
  container.innerHTML = markup;
  await endOfTask();
}

/** The user chooses `value` on `select` (the element's inner select or a native one): its value set, then `input` and `change`, as the browser fires them. */
function choose(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Records the select's change events. */
function changes(of: OcelleFormSelect): unknown[] {
  const heard: unknown[] = [];
  of.addEventListener("ocelle-form-select-change", (event) => {
    heard.push((event as CustomEvent<unknown>).detail);
  });
  return heard;
}

beforeEach(() => {
  container = document.createElement("main");
  document.body.append(container);
});

afterEach(() => {
  container.remove();
});

describe("ocelle-form-select's rules", () => {
  it("a select created by script, given a value and options before it is connected, shows that value once rendered", async () => {
    const made = document.createElement("ocelle-form-select");
    made.value = "done";
    made.innerHTML = '<option value="todo">To do</option><option value="done">Done</option>';
    container.append(made);
    await endOfTask();
    expect({ value: made.value, shown: inner(made).value }).toEqual({ value: "done", shown: "done" });
  });

  it("a value no option has reads \"\" at once, before the next render, and selects nothing, as on a native select", async () => {
    await insert('<ocelle-form-select id="s"><option value="todo">To do</option></ocelle-form-select><select id="n"><option value="todo">To do</option></select>');
    const element = byId("s", OcelleFormSelect);
    const native = byId("n", HTMLSelectElement);
    element.value = "nope";
    native.value = "nope";
    expect({ element: [element.value, inner(element).selectedIndex], native: [native.value, native.selectedIndex] }).toEqual({ element: ["", -1], native: ["", -1] });
  });

  it("a change of the host's own label or disabled attribute does not mirror the options again: after a value no option has, nothing stays selected, as on a native select", async () => {
    await insert('<ocelle-form-select id="s" label="Lane"><option value="todo">To do</option></ocelle-form-select>');
    const element = byId("s", OcelleFormSelect);
    element.value = "nope";
    await endOfTask();
    element.setAttribute("label", "Lanes");
    element.setAttribute("disabled", "");
    element.removeAttribute("disabled");
    await endOfTask();
    expect({ value: element.value, index: inner(element).selectedIndex }).toEqual({ value: "", index: -1 });
  });

  it("a change of an option's text in the same task as a change of the host's own label attribute is mirrored", async () => {
    await insert('<ocelle-form-select id="s" label="Lane"><option id="o" value="todo">To do</option></ocelle-form-select>');
    const element = byId("s", OcelleFormSelect);
    element.setAttribute("label", "Lanes");
    byId("o", HTMLOptionElement).textContent = "Doing";
    await endOfTask();
    expect([...inner(element).options].map((each) => each.text)).toEqual(["Doing"]);
  });

  it("once chosen, a choice is kept when an option is added before it, and when its option is removed falls back to the first enabled option, with no event; chosen again after it is put back, it dispatches a change", async () => {
    await insert(
      '<ocelle-form-select id="s"><option id="a" value="a" disabled>A</option><option value="b">B</option><option id="c" value="c">C</option></ocelle-form-select>' +
        '<select id="n"><option id="na" value="a" disabled>A</option><option value="b">B</option><option id="nc" value="c">C</option></select>',
    );
    const element = byId("s", OcelleFormSelect);
    const native = byId("n", HTMLSelectElement);
    const heard = changes(element);
    choose(inner(element), "c");
    choose(native, "c");
    element.insertAdjacentHTML("afterbegin", '<option value="first">First</option>');
    native.insertAdjacentHTML("afterbegin", '<option value="first">First</option>');
    await endOfTask();
    const kept = { element: element.value, native: native.value };
    byId("c", HTMLElement).remove();
    byId("nc", HTMLElement).remove();
    await endOfTask();
    const removed = { element: element.value, native: native.value, heard: [...heard] };
    element.insertAdjacentHTML("beforeend", '<option value="c">C</option>');
    await endOfTask();
    choose(inner(element), "c");
    expect({ kept, removed, heard }).toEqual({
      kept: { element: "c", native: "c" },
      removed: { element: "first", native: "first", heard: [{ value: "c" }] },
      heard: [{ value: "c" }, { value: "c" }],
    });
  });

  it("an update between the select's input and change events, when a host listener sets error on input, does not swallow the change event", async () => {
    await insert('<ocelle-form-select id="s"><option value="todo">To do</option><option value="done">Done</option></ocelle-form-select>');
    const element = byId("s", OcelleFormSelect);
    const heard = changes(element);
    element.addEventListener("input", () => {
      element.error = "Checked";
    });
    const select = inner(element);
    select.value = "done";
    select.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    await element.updateComplete;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect({ heard, value: element.value }).toEqual({ heard: [{ value: "done" }], value: "done" });
  });

  it("the options are mirrored without their ids, the options of a group included, and only option and optgroup children are mirrored", async () => {
    await insert('<ocelle-form-select id="s"><span id="x">Note</span><optgroup id="g" label="Active"><option id="o" value="todo">To do</option></optgroup>text</ocelle-form-select>');
    expect(mirrored(byId("s", OcelleFormSelect))).toEqual([
      { name: "optgroup", attributes: { label: "Active" } },
      { name: "option", attributes: { value: "todo" } },
    ]);
  });

  it("the default selection is the last option marked selected, and without one the first enabled option, a disabled group's options skipped, as on a native select", async () => {
    const marked = '<option value="a">A</option><option value="b" selected>B</option><option value="c" selected>C</option><option value="d">D</option>';
    const grouped = '<optgroup label="Closed" disabled><option value="a">A</option></optgroup><option value="b">B</option>';
    await insert(`<ocelle-form-select id="m">${marked}</ocelle-form-select><select id="nm">${marked}</select><ocelle-form-select id="g">${grouped}</ocelle-form-select><select id="ng">${grouped}</select>`);
    expect({
      marked: { element: byId("m", OcelleFormSelect).value, native: byId("nm", HTMLSelectElement).value },
      grouped: { element: byId("g", OcelleFormSelect).value, native: byId("ng", HTMLSelectElement).value },
    }).toEqual({ marked: { element: "c", native: "c" }, grouped: { element: "b", native: "b" } });
  });

  it("a form reset of a select without options gives the value \"\" at once", async () => {
    await insert('<form id="f"><ocelle-form-select id="s" name="lane"></ocelle-form-select></form>');
    const element = byId("s", OcelleFormSelect);
    byId("f", HTMLFormElement).reset();
    expect({ value: element.value, data: [...new FormData(byId("f", HTMLFormElement))] }).toEqual({ value: "", data: [] });
  });

  it("a form reset in the task of the select's insertion, before its first render, reports no error and gives at once the value of the default selection, as on a native select: the last option marked selected, a group's options included, else the first enabled option, a disabled group's options skipped, else \"\"", async () => {
    const cases: Record<string, string> = {
      marked: '<option value="a">A</option><optgroup label="G"><option value="b" selected>B</option></optgroup><option value="c">C</option>',
      enabled: '<optgroup label="Closed" disabled><option value="a">A</option></optgroup><option value="b" disabled>B</option><option value="c">C</option>',
      none: "",
    };
    const errors: string[] = [];
    const heard = (event: ErrorEvent): void => {
      errors.push(event.message);
    };
    const values: Record<string, unknown> = {};
    window.addEventListener("error", heard);
    try {
      for (const [name, options] of Object.entries(cases)) {
        container.innerHTML = `<form id="f"><ocelle-form-select id="s" name="lane">${options}</ocelle-form-select></form><form id="g"><select id="n" name="lane">${options}</select></form>`;
        byId("f", HTMLFormElement).reset();
        byId("g", HTMLFormElement).reset();
        values[name] = { element: byId("s", OcelleFormSelect).value, native: byId("n", HTMLSelectElement).value };
      }
    } finally {
      window.removeEventListener("error", heard);
    }
    await endOfTask();
    expect({ errors, values }).toEqual({ errors: [], values: { marked: { element: "b", native: "b" }, enabled: { element: "c", native: "c" }, none: { element: "", native: "" } } });
  });

  it("an option change updates the validity: a required select whose only option has an empty value becomes valid when a selected option of another value is added", async () => {
    await insert('<ocelle-form-select id="s" required><option value="">Choose a lane</option></ocelle-form-select>');
    const element = byId("s", OcelleFormSelect);
    const before = element.validity.valueMissing;
    element.insertAdjacentHTML("beforeend", '<option value="todo" selected>To do</option>');
    await endOfTask();
    expect({ before, after: element.validity.valueMissing, valid: element.checkValidity(), value: element.value }).toEqual({ before: true, after: false, valid: true, value: "todo" });
  });
});
