// Plant for mutation testing: the sample's test.
import { expect, it } from "vitest";
import { label, name } from "../src/x.ts";

it("names the base", () => {
  expect(name).toBe("base");
});

it("has the label", () => {
  expect(label).toBe("planted");
});
