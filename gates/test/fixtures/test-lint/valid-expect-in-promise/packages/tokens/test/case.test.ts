import { expect, it } from "vitest";

it("neither returns nor awaits the promise that asserts", () => {
  Promise.resolve(1).then((value) => {
    expect(value).toBe(1);
  });
});
