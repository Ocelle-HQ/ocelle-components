import { expect, it } from "vitest";
import { increment } from "../lib/other.ts";

it("increments", () => {
  expect(increment(1)).toBe(2);
});
