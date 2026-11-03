// Plant for mutation testing: the sample's test.
import { expect, it } from "vitest";
import { label, name } from "../lib/x.ts";

it("names the base", () => {
  expect(name).toBe("base");
});

it("has a label", () => {
  expect(typeof label).toBe("string");
});
