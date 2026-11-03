// Plant for the test lint.
import { describe, expect, it } from "vitest";

describe("planted", () => {
  it("does not await its assertion", async () => {
    expect(Promise.resolve(2)).resolves.toBe(2);
  });
});
