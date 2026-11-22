export type Setup = "markup" | "properties" | "required" | "readonly" | "disabled" | "fieldset";

export interface TextareaHost extends HTMLElement {
  name: string;
  value: string;
  required: boolean;
  disabled: boolean;
  readOnly: boolean;
  error: string;
  validity: ValidityState;
  willValidate: boolean;
  updateComplete: Promise<boolean>;
  formStateRestoreCallback(value: string): void;
  reportValidity(): boolean;
}

// Passed directly to Playwright's evaluate for the built fixture. Everything from creation through requestSubmit
// takes place in one browser task, and the submit listener constructs its own FormData.
export function submitInConnectionTask({ native, setup }: { native: boolean; setup: Setup }): {
  rendered: boolean;
  submissions: [string, FormDataEntryValue][][];
  valid: boolean;
  willValidate: boolean;
} {
  const tag = native ? "textarea" : "ocelle-form-textarea";
  const form = document.createElement("form");
  const submissions: [string, FormDataEntryValue][][] = [];
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submissions.push([...new FormData(form).entries()]);
  });
  const mixed = "first\r\nsecond\rthird\nfourth";
  let control: HTMLTextAreaElement | TextareaHost;
  if (setup === "markup") {
    form.innerHTML = native
      ? '<textarea name="answer">first&#13;&#10;second&#13;third&#10;fourth</textarea>'
      : '<ocelle-form-textarea name="answer" value="first&#13;&#10;second&#13;third&#10;fourth"></ocelle-form-textarea>';
    control = form.firstElementChild as HTMLTextAreaElement | TextareaHost;
  } else {
    control = document.createElement(tag);
    control.name = "answer";
    control.required = setup !== "properties";
    if (setup === "properties") control.value = mixed;
    if (setup === "readonly") control.readOnly = true;
    if (setup === "disabled") control.disabled = true;
    if (setup === "fieldset") {
      const fieldset = document.createElement("fieldset");
      fieldset.disabled = true;
      fieldset.append(control);
      form.append(fieldset);
    } else {
      form.append(control);
    }
  }
  document.body.append(form);
  try {
    const rendered = control.shadowRoot?.querySelector("textarea") != null;
    const state: Partial<Pick<TextareaHost, "validity" | "willValidate">> = control;
    const valid = state.validity?.valid ?? false;
    const willValidate = state.willValidate ?? false;
    form.requestSubmit();
    if (setup === "required") {
      control.value = "corrected";
      form.requestSubmit();
      form.reset();
      form.requestSubmit();
    }
    return { rendered, submissions, valid, willValidate };
  } finally {
    form.remove();
  }
}

export function focusInvalidInConnectionTask(native: boolean): {
  renderedBefore: boolean;
  submits: number;
  focused: boolean;
  editorFocused: boolean;
} {
  const form = document.createElement("form");
  const field = document.createElement(native ? "textarea" : "ocelle-form-textarea");
  field.setAttribute("name", "answer");
  field.setAttribute("label", "Decision");
  field.setAttribute("required", "");
  form.append(field);
  let submits = 0;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submits += 1;
  });
  document.body.append(form);
  try {
    const renderedBefore = field.shadowRoot?.querySelector("textarea") != null;
    form.requestSubmit();
    const focused = document.activeElement === field;
    const editorFocused = native ? focused : field.shadowRoot?.activeElement?.localName === "textarea";
    return { renderedBefore, submits, focused, editorFocused };
  } finally {
    form.remove();
  }
}
