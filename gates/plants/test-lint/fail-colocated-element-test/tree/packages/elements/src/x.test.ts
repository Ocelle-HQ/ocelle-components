// Plant for the test lint.
import { describe, expect, it } from "vitest";

describe("planted", () => {
  it("asserts nothing", () => {
    const sum = 1 + 1;
    void sum;
  });
});
