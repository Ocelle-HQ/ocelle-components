// Plant for the unit tests: the file throws before any test is collected.
import { expect, it } from "vitest";

throw new Error("planted: this file fails while loading");

it("is never collected", () => {
  expect(1).toBe(1);
});
