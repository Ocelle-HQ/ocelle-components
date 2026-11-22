import { afterEach, assert, describe, expect, it } from "vitest";
import { commands, userEvent } from "vitest/browser";
import "../src/ocelle-dialog.ts";
import "../src/index.ts";
import { inProcessDriver } from "./in-process.ts";
import { announced, only, polite } from "./scenarios/notice.ts";
import { submitInConnectionTask } from "./scenarios/form-textarea.ts";
import type { Setup, TextareaHost } from "./scenarios/form-textarea.ts";

const scope = document.createElement("div");
document.body.append(scope);

afterEach(async () => {
  scope.replaceChildren();
  await commands.emulateForcedColors("none");
});

function element<Tag extends keyof HTMLElementTagNameMap>(root: ParentNode, selector: Tag): HTMLElementTagNameMap[Tag] {
  const found = root.querySelector(selector);
  if (found === null) throw new Error(`missing fixture element: ${selector}`);
  return found;
}

function fixture(readOnly = false): { field: TextareaHost; form: HTMLFormElement; submit: HTMLButtonElement } {
  scope.innerHTML = `<form><ocelle-form-textarea id="field" name="answer" label="Decision"
    description="Explain the rationale" value="first&#13;&#10;second&#13;third" ${readOnly ? "readonly" : ""}></ocelle-form-textarea>
    <button type="submit">Submit</button></form>`;
  return {
    field: element(scope, "ocelle-form-textarea"),
    form: element(scope, "form"),
    submit: element(scope, "button"),
  };
}

async function editor(field: TextareaHost): Promise<HTMLTextAreaElement | null> {
  await field.updateComplete;
  return field.shadowRoot?.querySelector("textarea") ?? null;
}

const setups: readonly Setup[] = ["markup", "properties", "required", "readonly", "disabled", "fieldset"];

describe("ocelle-form-textarea", () => {
  it.each(setups)("matches native submission before render with %s initialization", (setup) => {
    const native = submitInConnectionTask({ native: true, setup });
    expect(submitInConnectionTask({ native: false, setup })).toEqual(native);
  });

  it("keeps dirty values, defaults, reset and restored values in step without user events", async () => {
    const { field, form } = fixture();
    const control = await editor(field);
    assert.instanceOf(control, HTMLTextAreaElement, "the editing control is a native shadow textarea");
    const seen: string[] = [];
    for (const event of ["input", "ocelle-form-textarea-change"]) form.addEventListener(event, () => seen.push(event));
    expect([field.value, control.value, new FormData(form).get("answer")]).toEqual(Array(3).fill("first\nsecond\nthird"));
    field.value = "script\r\nchange";
    field.setAttribute("value", "new\rdefault");
    expect(new FormData(form).get("answer")).toBe("script\nchange");
    form.reset();
    expect(new FormData(form).get("answer")).toBe("new\ndefault");
    field.formStateRestoreCallback("saved\r\nresult\rnext");
    await field.updateComplete;
    expect([field.value, control.value, new FormData(form).get("answer"), seen]).toEqual([
      "saved\nresult\nnext", "saved\nresult\nnext", "saved\nresult\nnext", [],
    ]);
  });

  it("synchronizes constraint attributes and focus without waiting for another render", async () => {
    const { field, form } = fixture();
    const control = await editor(field);
    assert.instanceOf(control, HTMLTextAreaElement, "the editing control is a native shadow textarea");
    field.required = true;
    field.value = "";
    expect([form.checkValidity(), field.validity.valueMissing]).toEqual([false, true]);
    expect(field.reportValidity()).toBe(false);
    expect(field.shadowRoot?.activeElement).toBe(control);
    field.readOnly = true;
    expect([form.checkValidity(), field.willValidate, new FormData(form).get("answer")]).toEqual([true, false, ""]);
    field.readOnly = false;
    field.disabled = true;
    expect([form.checkValidity(), field.willValidate, new FormData(form).has("answer")]).toEqual([true, false, false]);
    field.removeAttribute("disabled");
    expect([form.checkValidity(), field.willValidate, new FormData(form).get("answer")]).toEqual([false, true, ""]);
  });

  it("inserts a newline and pasted paragraphs inside a dialog and commits once with the current form value", async () => {
    scope.innerHTML = `<ocelle-dialog open label="Decision"><form><ocelle-form-textarea id="field" name="answer" label="Decision"></ocelle-form-textarea>
      <button id="save" type="submit">Submit</button></form></ocelle-dialog>`;
    const field = element(scope, "ocelle-form-textarea");
    const control = await editor(field);
    assert.instanceOf(control, HTMLTextAreaElement, "the editing control is a native shadow textarea");
    const form = element(scope, "form");
    const submits: [string, FormDataEntryValue][][] = [];
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submits.push([...new FormData(form).entries()]);
    });
    const inputs: (string | FormDataEntryValue | null)[][] = [];
    const commits: unknown[] = [];
    form.addEventListener("input", () => inputs.push([field.value, new FormData(form).get("answer")]));
    form.addEventListener("ocelle-form-textarea-change", (event) => {
      commits.push((event as CustomEvent<unknown>).detail);
    });
    control.focus();
    await userEvent.keyboard("approve{Enter}subject");
    const clipboard = (event: ClipboardEvent): void => {
      event.clipboardData?.setData("text/plain", "\n\nsecond paragraph");
      event.preventDefault();
    };
    document.addEventListener("copy", clipboard, { once: true });
    await userEvent.keyboard("{Control>}c{/Control}{Control>}v{/Control}");
    expect([field.value, control.value, submits]).toEqual([
      "approve\nsubject\n\nsecond paragraph", "approve\nsubject\n\nsecond paragraph", [],
    ]);
    expect(inputs.at(-1)).toEqual([field.value, field.value]);
    await userEvent.tab();
    expect(document.activeElement?.id).toBe("save");
    expect(commits).toEqual([{ value: field.value }]);
    form.requestSubmit();
    expect(submits).toEqual([[["answer", field.value]]]);
  });

  it("keeps the answer and submit focus while a host failure is described and cleared", async () => {
    const { field, form, submit } = fixture();
    const control = await editor(field);
    assert.instanceOf(control, HTMLTextAreaElement, "the editing control is a native shadow textarea");
    control.focus();
    await userEvent.keyboard("{End}!");
    await userEvent.tab();
    const before = control.value;
    expect(document.activeElement).toBe(submit);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
    form.requestSubmit();
    field.error = "Save failed";
    await field.updateComplete;
    const node = await commands.axState("field", "textarea");
    expect([node.name, node.description, document.activeElement, control.value]).toEqual([
      "Decision", "Explain the rationale Save failed", submit, before,
    ]);
    field.error = "";
    await field.updateComplete;
    expect((await commands.axState("field", "textarea")).description).toBe("Explain the rationale");
  });

  it("announces the asynchronous host error once without moving submit focus", async () => {
    const driver = inProcessDriver();
    await driver.mount('<main id="decision"><form><ocelle-form-textarea id="field" name="answer" label="Decision" value="first"></ocelle-form-textarea><button>Submit</button></form></main>');
    const field = element(document, "ocelle-form-textarea");
    const control = await editor(field);
    assert.instanceOf(control, HTMLTextAreaElement, "the editing control is a native shadow textarea");
    const form = element(document, "form");
    const submit = element(form, "button");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
    });
    submit.focus();
    form.requestSubmit();
    await driver.liveCapture.start("decision");
    field.error = "Save failed";
    await driver.after(2 * driver.W.loaded);
    const snapshots = await driver.liveCapture.stop();
    announced(driver, only(snapshots, ["field"]), [polite("Save failed", "field")], "async error announcement");
    expect([document.activeElement, field.value]).toEqual([submit, "first"]);
    await driver.mount("");
    document.body.append(scope);
  });

  it("distinguishes read-only and invalid from disabled in forced colours", async () => {
    await inProcessDriver().mount("");
    document.body.append(scope);
    const { field } = fixture(true);
    const control = await editor(field);
    assert.instanceOf(control, HTMLTextAreaElement, "the editing control is a native shadow textarea");
    await commands.emulateForcedColors("active");
    await userEvent.tab();
    expect([control.readOnly, getComputedStyle(control).borderTopStyle, getComputedStyle(control).outlineStyle]).toEqual([
      true, "dashed", "solid",
    ]);
    field.error = "Save failed";
    await field.updateComplete;
    const invalidMark = getComputedStyle(control).borderTopWidth;
    field.disabled = true;
    await field.updateComplete;
    expect([control.disabled, getComputedStyle(control).borderTopStyle, getComputedStyle(control).borderTopWidth]).toEqual([
      true, "solid", invalidMark,
    ]);
    field.disabled = false;
    field.readOnly = false;
    field.error = "";
    await field.updateComplete;
    expect(getComputedStyle(control).borderTopWidth).not.toBe(invalidMark);
  });
});
