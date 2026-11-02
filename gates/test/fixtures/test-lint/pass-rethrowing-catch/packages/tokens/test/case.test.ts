import { expect, it } from "vitest";

it("cleans up and rethrows a failed assertion", () => {
  const log: string[] = [];
  try {
    expect(log).toEqual([]);
  } catch (error) {
    log.push("cleanup");
    throw error;
  }
});
