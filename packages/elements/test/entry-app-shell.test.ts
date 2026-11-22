import { expect, it } from "vitest";
import { OcelleAppShell } from "../src/ocelle-app-shell.ts";

it("registers the shell, top bar, and drawer from the standalone module", () => {
  expect(customElements.get("ocelle-app-shell")).toBe(OcelleAppShell);
  expect(customElements.get("ocelle-top-bar")).toBeTypeOf("function");
  expect(customElements.get("ocelle-drawer")).toBeTypeOf("function");
  expect(customElements.get("ocelle-nav-pill")).toBeUndefined();
});
