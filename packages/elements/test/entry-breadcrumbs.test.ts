import { expect, it } from "vitest";
import { OcelleBreadcrumbs } from "../src/ocelle-breadcrumbs.ts";

it("registers ocelle-breadcrumbs from its standalone module", () => {
  expect(customElements.get("ocelle-breadcrumbs")).toBe(OcelleBreadcrumbs);
  expect(customElements.get("ocelle-app-shell")).toBeUndefined();
});
