import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { define } from "../src/define.ts";
import { afterTask } from "../src/live.ts";
import { OcelleFormInput } from "../src/ocelle-form-input.ts";

// The form control's rules one at a time (specs/010-feedback-forms FR-020 to FR-030, research.md R-05, R-06,
// data-model.md § Form control, § Error announcement transitions, § Input-only fields; T041's phase-end mutation run):
// each test drives one rule of src/form-control.ts or src/ocelle-form-input.ts through the DOM and reads the result on
// the element's own shadow root: the error copy of its live region, the inner field's attributes and value, the hidden
// span that names the field, and the events and submissions it causes. The scenarios of scenarios/form-input.ts
// measure the same rules through the accessibility tree and the capture, where a rule whose effect the tree does not
// show (a copy written while hidden, a wait restarted, a held copy emptied early) is not seen; here it is read directly,
// on a fake clock that moves only when a test advances it. This file does not import test/in-process.ts, so the timing
// in force is the shipped one (`W` = 300 ms once the document is complete, 700 ms while it loads, `H` = 5000 ms).
const W = 300;
const H = 5000;

/** The end of the current task: the `MutationObserver` records, Lit's update and the end-of-task steps posted before. */
const endOfTask = (): Promise<void> =>
  new Promise((resolve) => {
    afterTask(resolve);
  });

let container: HTMLElement;

function control(id = "t"): OcelleFormInput {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id}`);
  return found as OcelleFormInput;
}

/** An element of the input's shadow root. */
function inner(of: OcelleFormInput, selector: string): Element {
  const found = of.shadowRoot?.querySelector(selector);
  if (found === undefined || found === null) throw new Error(`no ${selector}`);
  return found;
}

const field = (of: OcelleFormInput = control()): HTMLInputElement => inner(of, "input") as HTMLInputElement;
const copy = (of: OcelleFormInput = control()): string | null => inner(of, '[aria-atomic="true"]').textContent;
/** The field's name as its `aria-labelledby` span holds it. */
const named = (of: OcelleFormInput = control()): string | null => inner(of, `#${field(of).getAttribute("aria-labelledby") ?? ""}`).textContent;

/** Inserts `markup` after load (not a first load) and ends the task. */
async function insert(markup: string): Promise<OcelleFormInput> {
  container.innerHTML = markup;
  await endOfTask();
  return control();
}

/** The user edits the field to `value`: the field's value set and its composed `input` dispatched, as typing does. */
function edit(of: OcelleFormInput, value: string): void {
  field(of).value = value;
  field(of).dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

/** The field's own `change`, as the browser fires it when the field is left after a change. */
function changed(of: OcelleFormInput): void {
  field(of).dispatchEvent(new Event("change", { bubbles: true }));
}

/** Records the input's change events. */
function changes(of: OcelleFormInput): unknown[] {
  const heard: unknown[] = [];
  of.addEventListener("ocelle-form-input-change", (event) => {
    heard.push((event as CustomEvent<unknown>).detail);
  });
  return heard;
}

let fresh = 0;

/** Defines a fresh subclass for `markup`'s tag `ocelle-rules-first`, so the element is upgraded by the registration. */
async function firstLoaded(markup: string): Promise<OcelleFormInput> {
  fresh += 1;
  const tag = `ocelle-rules-first-${String(fresh)}`;
  container.innerHTML = markup.replaceAll("ocelle-rules-first", tag);
  define(tag, class extends OcelleFormInput {});
  await endOfTask();
  return control();
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
  container = document.createElement("main");
  document.body.append(container);
});

afterEach(async () => {
  container.remove();
  await endOfTask();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("the shared properties (FR-021)", () => {
  it("read empty strings and false and write no attribute onto the host", async () => {
    const made = await insert('<ocelle-form-input id="t"></ocelle-form-input>');
    expect({
      values: [made.name, made.label, made.description, made.error, made.required, made.disabled, made.value, made.readOnly],
      attributes: made.getAttributeNames(),
    }).toEqual({ values: ["", "", "", "", false, false, "", false], attributes: ["id"] });
  });

  it("reflect to their attributes, and an attribute removed gives the default back", async () => {
    const made = await insert('<ocelle-form-input id="t"></ocelle-form-input>');
    const strings = ["name", "label", "description", "error"] as const;
    for (const name of strings) made[name] = "x";
    made.required = true;
    made.disabled = true;
    await endOfTask();
    const set = Object.fromEntries([...strings, "required", "disabled"].map((name) => [name, made.getAttribute(name)]));
    for (const name of [...strings, "required", "disabled"]) made.removeAttribute(name);
    await endOfTask();
    expect({ set, removed: [made.name, made.label, made.description, made.error, made.required, made.disabled] }).toEqual({
      set: { name: "x", label: "x", description: "x", error: "x", required: "", disabled: "" },
      removed: ["", "", "", "", false, false],
    });
  });

  it("with no label, description or error, their parts are hidden and the field is the host's box, with no gap above or under it", async () => {
    const made = await insert('<ocelle-form-input id="t"></ocelle-form-input>');
    const host = made.getBoundingClientRect();
    const box = field(made).getBoundingClientRect();
    expect({
      hidden: ['[part="label"]', '[part="description"]', '[part="error"]'].map((part) => inner(made, part).hasAttribute("hidden")),
      top: box.top - host.top,
      bottom: host.bottom - box.bottom,
    }).toEqual({ hidden: [true, true, true], top: 0, bottom: 0 });
  });

  it("checkValidity() of the host reports the field's constraints", async () => {
    const made = await insert('<ocelle-form-input id="t" required></ocelle-form-input>');
    const empty = made.checkValidity();
    made.value = "x";
    await endOfTask();
    expect({ empty, filled: made.checkValidity() }).toEqual({ empty: false, filled: true });
  });
});

describe("the input's own attributes (FR-029)", () => {
  it("type set by the property writes the attribute; the attribute removed, type reads text and the field is text", async () => {
    const made = await insert('<ocelle-form-input id="t"></ocelle-form-input>');
    made.type = "email";
    await endOfTask();
    const set = { attribute: made.getAttribute("type"), field: field(made).type };
    made.removeAttribute("type");
    await endOfTask();
    expect({ set, removed: { attribute: made.getAttribute("type"), type: made.type, field: field(made).type } }).toEqual({
      set: { attribute: "email", field: "email" },
      removed: { attribute: null, type: "text", field: "text" },
    });
  });

  it("type set by the property writes the attribute at once, text included on a host whose type is unknown", async () => {
    const made = await insert('<ocelle-form-input id="t" type="bogus"></ocelle-form-input>');
    made.type = "text";
    const text = made.getAttribute("type");
    made.removeAttribute("type");
    made.type = "email";
    expect({ text, email: made.getAttribute("type") }).toEqual({ text: "text", email: "email" });
  });

  it("a pass-through attribute removed from the host is removed from the field", async () => {
    const made = await insert('<ocelle-form-input id="t" placeholder="P" pattern="[a-z]+" minlength="2"></ocelle-form-input>');
    const set = ["placeholder", "pattern", "minlength"].map((name) => field(made).getAttribute(name));
    for (const name of ["placeholder", "pattern", "minlength"]) made.removeAttribute(name);
    await endOfTask();
    expect({ set, removed: ["placeholder", "pattern", "minlength"].map((name) => field(made).hasAttribute(name)) }).toEqual({ set: ["P", "[a-z]+", "2"], removed: [false, false, false] });
  });
});

describe("host ARIA after the first render (FR-022, R-05)", () => {
  it("a host aria-label set, changed and removed renames the field; a blank one is skipped", async () => {
    const made = await insert('<ocelle-form-input id="t" label="Title"></ocelle-form-input>');
    const names: (string | null)[] = [named(made)];
    for (const value of ["Search", "  ", null]) {
      if (value === null) made.removeAttribute("aria-label");
      else made.setAttribute("aria-label", value);
      await endOfTask();
      names.push(named(made));
    }
    expect(names).toEqual(["Title", "Search", "Title", "Title"]);
  });

  it.each(["aria-invalid", "aria-required", "aria-disabled"])("a host %s \"true\" set alone after the first render reaches the field, and another value leaves it", async (name) => {
    const made = await insert('<ocelle-form-input id="t"></ocelle-form-input>');
    const before = field(made).getAttribute(name);
    made.setAttribute(name, "true");
    await endOfTask();
    const set = field(made).getAttribute(name);
    made.setAttribute(name, "false");
    await endOfTask();
    expect({ before, set, other: field(made).getAttribute(name) }).toEqual({ before: null, set: "true", other: null });
  });

  it("a host aria-description set and changed is the field's description span, after the description", async () => {
    const made = await insert('<ocelle-form-input id="t" description="Help"></ocelle-form-input>');
    made.setAttribute("aria-description", " Filters  the board ");
    await endOfTask();
    const ids = field(made).getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids.map((id) => inner(made, `#${id}`).textContent)).toEqual(["Help", "Filters the board", ""]);
  });
});

describe("naming by external labels (FR-022, R-05)", () => {
  it("a label wrapping the host names the field by its own text, not the host's", async () => {
    container.innerHTML = '<label>Title <ocelle-form-input id="t">junk</ocelle-form-input></label>';
    await endOfTask();
    expect(named()).toBe("Title");
  });

  it("a change of a text node's data, and of a nested element's children, renames the field", async () => {
    container.innerHTML = '<label for="t"><span id="s">Card</span> title</label><ocelle-form-input id="t"></ocelle-form-input>';
    await endOfTask();
    const before = named();
    const span = document.getElementById("s");
    (span?.firstChild as Text).data = "Lane";
    await endOfTask();
    const data = named();
    if (span !== null) span.textContent = "Run";
    await endOfTask();
    expect({ before, data, children: named() }).toEqual({ before: "Card title", data: "Lane title", children: "Run title" });
  });

  it("a label associated after the first render names the field once it takes focus", async () => {
    const made = await insert('<ocelle-form-input id="t" label="Title"></ocelle-form-input>');
    container.insertAdjacentHTML("afterbegin", '<label for="t">Lane</label>');
    await endOfTask();
    made.focus();
    await endOfTask();
    expect(named(made)).toBe("Lane Title");
  });
});

describe("the value, its default and the change event (FR-021, FR-024, R-05)", () => {
  it("the value attribute sets the value while it is not dirty; an edit, a script value or a restore makes it dirty, a reset clears that", async () => {
    const made = await insert('<form id="f"><ocelle-form-input id="t" name="title" value="a"></ocelle-form-input></form>');
    const seen: string[] = [made.value];
    made.setAttribute("value", "b");
    seen.push(made.value);
    edit(made, "typed");
    made.setAttribute("value", "c");
    seen.push(made.value);
    (document.getElementById("f") as HTMLFormElement).reset();
    seen.push(made.value);
    made.setAttribute("value", "d");
    seen.push(made.value);
    made.value = "script";
    made.setAttribute("value", "e");
    seen.push(made.value);
    made.formResetCallback();
    made.formStateRestoreCallback("restored");
    made.setAttribute("value", "f");
    seen.push(made.value);
    await endOfTask();
    expect({ seen, shown: field(made).value, data: [...new FormData(document.getElementById("f") as HTMLFormElement)] }).toEqual({
      seen: ["a", "b", "typed", "c", "d", "script", "restored"],
      shown: "restored",
      data: [["title", "restored"]],
    });
  });

  it("without a value attribute the default value is empty: the attribute removed, and a reset after an edit, give an empty value", async () => {
    const made = await insert('<form id="f"><ocelle-form-input id="t" name="title" value="a"></ocelle-form-input></form>');
    made.removeAttribute("value");
    const removed = made.value;
    edit(made, "typed");
    made.formResetCallback();
    expect({ removed, reset: made.value }).toEqual({ removed: "", reset: "" });
  });

  it("a change of the value attribute while not dirty shows the value and puts it in the form data", async () => {
    const made = await insert('<form id="f"><ocelle-form-input id="t" name="title" value="a"></ocelle-form-input></form>');
    made.setAttribute("value", "b");
    await endOfTask();
    expect({ shown: field(made).value, data: [...new FormData(document.getElementById("f") as HTMLFormElement)] }).toEqual({ shown: "b", data: [["title", "b"]] });
  });

  it("the field's change after an edit dispatches one change event; after a script value, a reset, a restore or a default change, none", async () => {
    const made = await insert('<form id="f"><ocelle-form-input id="t" name="title" value="a"></ocelle-form-input></form>');
    const heard = changes(made);
    edit(made, "ab");
    changed(made);
    changed(made);
    const edited = heard.splice(0);
    made.value = "script";
    changed(made);
    edit(made, "x");
    made.formResetCallback();
    changed(made);
    edit(made, "y");
    made.formStateRestoreCallback("restored");
    changed(made);
    made.formResetCallback();
    made.setAttribute("value", "new");
    changed(made);
    expect({ edited, after: heard }).toEqual({ edited: [{ value: "ab" }], after: [] });
  });
});

describe("Enter and implicit submission (FR-030, R-05)", () => {
  /** A form holding `content` and the input `t`, its submissions recorded (and prevented). */
  async function enterIn(content: string): Promise<{ submitted: (string | null)[]; event: KeyboardEvent; heard: unknown[] }> {
    const made = await insert(`<form id="f">${content}<ocelle-form-input id="t" name="title" value="v"></ocelle-form-input></form>`);
    const submitted: (string | null)[] = [];
    document.getElementById("f")?.addEventListener("submit", (event) => {
      submitted.push(event.submitter?.id ?? null);
      event.preventDefault();
    });
    const heard = changes(made);
    edit(made, "w");
    const event = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, composed: true, cancelable: true });
    field(made).dispatchEvent(event);
    return { submitted, event, heard };
  }

  it("each native input type that blocks implicit submission makes a second field, so Enter does not submit; the others do not", async () => {
    const blocking = ["text", "search", "url", "tel", "email", "password", "date", "month", "week", "time", "datetime-local", "number"];
    const other = ["checkbox", "radio", "range", "color", "hidden", "file"];
    const seen: Record<string, number> = {};
    for (const type of [...blocking, ...other]) seen[type] = (await enterIn(`<input type="${type}" name="x">`)).submitted.length;
    expect(seen).toEqual(Object.fromEntries([...blocking.map((type) => [type, 0]), ...other.map((type) => [type, 1])]));
  });

  it("the default button is one of the input's own form, not of another form in the page", async () => {
    container.innerHTML = '<form id="o"><button id="x">Other</button></form><form id="f"><ocelle-form-input id="t" name="title"></ocelle-form-input></form>';
    await endOfTask();
    const submitted: string[] = [];
    for (const id of ["o", "f"]) {
      document.getElementById(id)?.addEventListener("submit", (event) => {
        submitted.push(`${id} ${event.submitter?.id ?? "none"}`);
        event.preventDefault();
      });
    }
    field().dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    expect(submitted).toEqual(["f none"]);
  });

  it("a second input blocks implicit submission too", async () => {
    await expect(enterIn('<ocelle-form-input id="o" name="lane"></ocelle-form-input>').then(({ submitted }) => submitted)).resolves.toEqual([]);
  });

  it("the default button is the form's first submit button, a button, a submit input or an image input; other buttons are not", async () => {
    const seen = {
      button: (await enterIn('<button type="button" id="b0">No</button><button id="b1">Go</button>')).submitted,
      submit: (await enterIn('<button type="reset" id="b0">No</button><input type="submit" id="b1">')).submitted,
      image: (await enterIn('<input type="button" id="b0"><input type="image" id="b1" alt="Go">')).submitted,
    };
    expect(seen).toEqual({ button: ["b1"], submit: ["b1"], image: ["b1"] });
  });

  it("Enter dispatches the change before the submission and prevents the key's default; another key or a composing Enter does nothing", async () => {
    const entered = await enterIn("");
    const made = control();
    const others = [new KeyboardEvent("keydown", { key: "a", cancelable: true }), new KeyboardEvent("keydown", { key: "Enter", isComposing: true, cancelable: true })];
    edit(made, "z");
    for (const event of others) field(made).dispatchEvent(event);
    expect({ submitted: entered.submitted, prevented: entered.event.defaultPrevented, heard: entered.heard, others: others.map((event) => event.defaultPrevented) }).toEqual({
      submitted: [null],
      prevented: true,
      heard: [{ value: "w" }],
      others: [false, false],
    });
  });

  it("outside a form, Enter dispatches the change and submits nothing", async () => {
    const made = await insert('<ocelle-form-input id="t" value="v"></ocelle-form-input>');
    const heard = changes(made);
    edit(made, "w");
    field(made).dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", cancelable: true }));
    expect(heard).toEqual([{ value: "w" }]);
  });
});

describe("the error announcement (FR-027, R-06)", () => {
  it("an input inserted with an error writes it, politely, W after the insertion, and holds it for H", async () => {
    const made = await insert('<ocelle-form-input id="t" error=" Title  is taken "></ocelle-form-input>');
    vi.advanceTimersByTime(W - 1);
    const before = copy(made);
    vi.advanceTimersByTime(1);
    const at = copy(made);
    vi.advanceTimersByTime(H);
    expect({ live: inner(made, '[aria-atomic="true"]').getAttribute("aria-live"), before, at, after: copy(made) }).toEqual({ live: "polite", before: "", at: "Title is taken", after: "" });
  });

  it("inserted hidden writes nothing while hidden; revealed, it writes the error W after the reveal", async () => {
    const made = await insert('<ocelle-form-input id="t" error="Title is taken" hidden></ocelle-form-input>');
    vi.advanceTimersByTime(2 * W);
    const hidden = copy(made);
    made.hidden = false;
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect({ hidden, revealed: copy(made) }).toEqual({ hidden: "", revealed: "Title is taken" });
  });

  it("hiding empties a held copy at once, and an error change while hidden writes nothing", async () => {
    const made = await insert('<ocelle-form-input id="t" error="Title is taken"></ocelle-form-input>');
    vi.advanceTimersByTime(W);
    const held = copy(made);
    made.hidden = true;
    await endOfTask();
    const hidden = copy(made);
    made.error = "Title is wrong";
    await endOfTask();
    vi.advanceTimersByTime(2 * W);
    expect({ held, hidden, changed: copy(made) }).toEqual({ held: "Title is taken", hidden: "", changed: "" });
  });

  it("the same error again, with other whitespace, keeps the held copy past the minimum hold", async () => {
    const made = await insert('<ocelle-form-input id="t" error="Title is taken"></ocelle-form-input>');
    vi.advanceTimersByTime(W);
    made.error = " Title  is taken";
    await endOfTask();
    vi.advanceTimersByTime(2 * W);
    expect(copy(made)).toBe("Title is taken");
  });

  it("the same value set again during the wait does not restart it", async () => {
    const made = await insert('<ocelle-form-input id="t"></ocelle-form-input>');
    made.setAttribute("error", "Title is taken");
    vi.advanceTimersByTime(W / 2);
    made.setAttribute("error", "Title is taken");
    vi.advanceTimersByTime(W / 2);
    expect(copy(made)).toBe("Title is taken");
  });

  it("clearing empties the copy at once and resets the baseline, so the same error set again is written again", async () => {
    const made = await insert('<ocelle-form-input id="t" error="Title is taken"></ocelle-form-input>');
    vi.advanceTimersByTime(W);
    made.error = "";
    await endOfTask();
    const cleared = copy(made);
    vi.advanceTimersByTime(2 * W);
    made.error = "Title is taken";
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect({ cleared, again: copy(made) }).toEqual({ cleared: "", again: "Title is taken" });
  });

  it("removed and not put back in the same task, the held copy is emptied in the next task; moved during the wait, it is written", async () => {
    container.innerHTML = '<div id="d"></div><ocelle-form-input id="m" error="Moved"></ocelle-form-input><ocelle-form-input id="r" error="Removed"></ocelle-form-input>';
    await endOfTask();
    const moved = control("m");
    const removed = control("r");
    vi.advanceTimersByTime(W);
    const held = copy(removed);
    removed.remove();
    await endOfTask();
    vi.advanceTimersByTime(H);
    moved.error = "Moved again";
    await endOfTask();
    document.getElementById("d")?.append(moved);
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect({ held, removed: copy(removed), moved: copy(moved) }).toEqual({ held: "Removed", removed: "", moved: "Moved again" });
  });

  it("removed and inserted again in a later task, the input is an insertion and writes its error again", async () => {
    const made = await insert('<ocelle-form-input id="t" error="Title is taken"></ocelle-form-input>');
    vi.advanceTimersByTime(W + H);
    made.remove();
    await endOfTask();
    container.append(made);
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(made)).toBe("Title is taken");
  });

  it("connected while the document loads is a first load: nothing is written, and the same error with other whitespace writes nothing", async () => {
    vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const made = await insert('<ocelle-form-input id="t" error="Title is taken"></ocelle-form-input>');
    vi.advanceTimersByTime(700);
    const loaded = copy(made);
    made.error = "Title  is taken ";
    await endOfTask();
    vi.advanceTimersByTime(700);
    expect({ loaded, whitespace: copy(made) }).toEqual({ loaded: "", whitespace: "" });
  });

  it("upgraded by the registration is a first load; removed and inserted again in a later task, it writes its error", async () => {
    const made = await firstLoaded('<ocelle-rules-first id="t" error="Title is taken"></ocelle-rules-first>');
    vi.advanceTimersByTime(W);
    const loaded = copy(made);
    made.remove();
    await endOfTask();
    container.append(made);
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect({ loaded, again: copy(made) }).toEqual({ loaded: "", again: "Title is taken" });
  });

  it("first loaded hidden while the document loads and revealed after the load, the error is written W after the reveal", async () => {
    const state = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const made = await insert('<ocelle-form-input id="t" error="Title is taken" hidden></ocelle-form-input>');
    vi.advanceTimersByTime(100);
    state.mockReturnValue("complete");
    made.hidden = false;
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(made)).toBe("Title is taken");
  });

  it("constructed while the document loads and inserted after the load, the error is written W after the insertion", async () => {
    const state = vi.spyOn(document, "readyState", "get").mockReturnValue("loading");
    const made = document.createElement("ocelle-form-input");
    made.id = "t";
    made.setAttribute("error", "Title is taken");
    vi.advanceTimersByTime(100);
    state.mockReturnValue("complete");
    container.append(made);
    await endOfTask();
    vi.advanceTimersByTime(W);
    expect(copy(made)).toBe("Title is taken");
  });
});
