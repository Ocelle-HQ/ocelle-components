// Plant for mutation testing: the sample's test.
import { expect, it } from "vitest";
import { label, name } from "../src/x.ts";

it("names the base", () => {
  expect(name).toBe("base");
});

it("has a label it does not have", () => {
  expect(label).toBe("other");
});
