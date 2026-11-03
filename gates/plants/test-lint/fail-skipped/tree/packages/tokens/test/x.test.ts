// Plant for the test lint.
import { describe, expect, it } from "vitest";

describe("planted", () => {
  it.skip("is skipped", () => {
    expect(1 + 1).toBe(2);
  });
});
