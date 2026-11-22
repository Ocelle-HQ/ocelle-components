import { expect, it } from "vitest";
import { OcelleSkipLink } from "../src/ocelle-skip-link.ts";

it("registers the standalone skip link without installing the shell", () => {
  expect(customElements.get("ocelle-skip-link")).toBe(OcelleSkipLink);
  expect(customElements.get("ocelle-app-shell")).toBeUndefined();
});
