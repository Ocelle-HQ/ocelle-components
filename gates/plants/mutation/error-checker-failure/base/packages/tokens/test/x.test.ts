// Plant for mutation testing: the sample's test.
import { expect, it } from "vitest";
import { Sample } from "../src/x.ts";

it("has no first row", () => {
  expect(new Sample().first()).toBe(null);
});
