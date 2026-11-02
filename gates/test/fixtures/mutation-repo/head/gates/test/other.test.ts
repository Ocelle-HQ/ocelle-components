import { expect, it } from "vitest";
import { decrement, increment } from "../lib/other.ts";

it("increments", () => {
  expect(increment(1)).toBe(2);
});

it("decrements", () => {
  expect(decrement(5)).toBe(4);
});
