import { expect, it } from "vitest";
import { double, triple } from "../../lib/sample.ts";

it("doubles and triples", () => {
  expect(double(2)).toBe(4);
  expect(triple(2)).toBe(6);
});
