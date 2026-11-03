import { expect, it } from "vitest";

it("does not await its async assertion", async () => {
  expect(Promise.resolve(1)).resolves.toBe(1);
});
