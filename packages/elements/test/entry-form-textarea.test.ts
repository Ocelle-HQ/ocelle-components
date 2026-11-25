import { expect, it } from "vitest";

// The glob lets the same observable assertion run before the new module's scaffold exists.
const modules = import.meta.glob<{ OcelleFormTextarea: typeof HTMLElement }>(
  "../src/ocelle-form-textarea.ts",
  { eager: true },
);

it("registers the per-element entry as a form-associated control and registers no sibling", () => {
  const textarea = modules["../src/ocelle-form-textarea.ts"]?.OcelleFormTextarea;
  const associated = textarea !== undefined && Reflect.get(textarea, "formAssociated") === true;
  expect(associated && customElements.get("ocelle-form-textarea") === textarea, "the entry registers a form-associated textarea").toBe(true);
  expect([customElements.get("ocelle-form-input"), customElements.get("ocelle-dialog")]).toEqual([undefined, undefined]);
});
