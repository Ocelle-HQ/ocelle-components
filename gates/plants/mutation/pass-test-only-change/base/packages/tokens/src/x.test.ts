// Plant for mutation testing: a colocated test.
import { expect, it } from "vitest";
import { name } from "./x.ts";

it("names the base", () => {
  expect(name).toBe("base");
});
