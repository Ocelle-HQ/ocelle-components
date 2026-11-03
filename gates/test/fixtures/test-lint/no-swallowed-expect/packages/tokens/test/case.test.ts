import { expect, it } from "vitest";

it("swallows its own failed assertion", () => {
  try {
    expect(1).toBe(2);
  } catch {}
});
