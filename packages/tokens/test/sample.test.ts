import { describe, expect, it } from "vitest";

describe("@ocelle/tokens skeleton", () => {
  it("exports nothing yet", async () => {
    const module: Record<string, unknown> = await import("../src/index.ts");
    expect(Object.keys(module)).toEqual([]);
  });
});
