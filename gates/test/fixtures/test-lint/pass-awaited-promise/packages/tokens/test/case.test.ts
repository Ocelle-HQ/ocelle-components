import { expect, it } from "vitest";

it("awaits the promise that asserts", async () => {
  await Promise.resolve(2).then((value) => expect(value).toBe(2));
});
