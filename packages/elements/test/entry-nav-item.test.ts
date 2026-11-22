import { expect, it } from "vitest";
import { OcelleNavItem } from "../src/ocelle-nav-item.ts";

it("registers the nav item and its tooltip dependency from the standalone module", () => {
  expect(customElements.get("ocelle-nav-item")).toBe(OcelleNavItem);
  expect(customElements.get("ocelle-tooltip")).toBeTypeOf("function");
  expect(customElements.get("ocelle-top-bar")).toBeUndefined();
});
