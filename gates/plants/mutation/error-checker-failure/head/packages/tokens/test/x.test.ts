// Plant for mutation testing: the sample's test.
import { expect, it } from "vitest";
import { Sample, label } from "../src/x.ts";

it("has no first row", () => {
  expect(new Sample().first()).toBe(null);
});

it("labels a sample without a first row", () => {
  expect(label(new Sample())).toBe("none");
});
