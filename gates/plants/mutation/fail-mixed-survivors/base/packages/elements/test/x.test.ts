// Plant for mutation testing: the sample's test, in the elements project (Chromium).
import { expect, it } from "vitest";
import { name } from "../src/x.ts";

it("names the base", () => {
  expect(name).toBe("base");
});
