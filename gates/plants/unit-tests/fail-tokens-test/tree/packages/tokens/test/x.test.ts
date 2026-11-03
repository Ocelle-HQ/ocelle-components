// Plant for the unit tests: a test that fails.
import { describe, expect, it } from "vitest";

describe("planted tokens-test", () => {
  it("adds wrongly", () => {
    expect(1 + 1).toBe(3);
  });
});
