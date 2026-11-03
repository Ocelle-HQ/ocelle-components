import { expect, it } from "vitest";

it("returns the promise that asserts", () => {
  return Promise.resolve(2).then((value) => expect(value).toBe(2));
});
