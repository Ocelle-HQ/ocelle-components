import { expect, it } from "vitest";

it("asserts only through a snapshot", () => {
  expect({ value: 1 }).toMatchSnapshot();
});
