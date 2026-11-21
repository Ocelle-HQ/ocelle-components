import { expect, it } from "vitest";
import { OcelleTopBar } from "../src/ocelle-top-bar.ts";

it("registers the top bar and its brand and icon dependencies from the standalone module", () => {
  expect(customElements.get("ocelle-top-bar")).toBe(OcelleTopBar);
  expect(customElements.get("ocelle-brand-mark")).toBeTypeOf("function");
  expect(customElements.get("ocelle-icon")).toBeTypeOf("function");
  expect(customElements.get("ocelle-nav-item")).toBeUndefined();
});
