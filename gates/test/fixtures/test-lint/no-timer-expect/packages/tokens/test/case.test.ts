import { expect, it } from "vitest";

it("asserts in a timer callback", () => {
  setTimeout(() => {
    expect(1).toBe(2);
  }, 0);
});
