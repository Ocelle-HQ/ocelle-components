import { expect, it } from "vitest";
import { tested } from "../lib/split.ts";

it("adds one", () => {
  expect(tested(1)).toBe(2);
});
