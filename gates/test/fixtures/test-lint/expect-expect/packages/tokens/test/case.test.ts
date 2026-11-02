import { it } from "vitest";

it("has no assertion", () => {
  const value = 1 + 1;
  void value;
});
