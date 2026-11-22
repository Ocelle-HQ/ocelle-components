import { expect, it } from "vitest";
import { OcelleNavPill } from "../src/ocelle-nav-pill.ts";

it("registers ocelle-nav-pill from its standalone module", () => {
  expect(customElements.get("ocelle-nav-pill")).toBe(OcelleNavPill);
  expect(customElements.get("ocelle-app-shell")).toBeUndefined();
});
