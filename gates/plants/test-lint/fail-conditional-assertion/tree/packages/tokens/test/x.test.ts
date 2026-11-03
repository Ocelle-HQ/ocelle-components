// Plant for the test lint.
import { describe, expect, it } from "vitest";

describe("planted", () => {
  it("asserts only sometimes", () => {
    const value = Math.random();
    if (value > 0.5) {
      expect(value).toBeGreaterThan(0.5);
    }
  });
});
