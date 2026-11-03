// Plant for the test lint.
import { describe, expect, it } from "vitest";

expect(1 + 1).toBe(2);

describe("planted", () => {
  it("asserts", () => {
    expect(2 + 2).toBe(4);
  });
});
