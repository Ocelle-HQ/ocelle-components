import { expect, it } from "vitest";

it("asserts the error in a catch", () => {
  try {
    expect(JSON.parse("{")).toEqual({});
  } catch (error) {
    expect(error).toBeInstanceOf(SyntaxError);
  }
});
