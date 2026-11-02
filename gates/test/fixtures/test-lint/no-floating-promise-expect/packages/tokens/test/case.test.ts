import { expect, it } from "vitest";

it("asserts in a promise that is neither awaited nor returned", () => {
  void Promise.resolve(2).then((value) => expect(value).toBe(2));
});
