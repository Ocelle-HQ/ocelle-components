import { expect, it } from "vitest";

it("asserts only in a branch", () => {
  const value = Number("1");
  if (value > 0) {
    expect(value).toBe(1);
  }
});
