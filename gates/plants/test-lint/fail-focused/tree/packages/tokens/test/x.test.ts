// Plant for the test lint.
import { describe, expect, it } from "vitest";

describe("planted", () => {
  it.only("is focused", () => {
    expect(1 + 1).toBe(2);
  });
});
