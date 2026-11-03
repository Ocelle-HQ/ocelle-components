// Fixture test: the only test of the fixture; it imports x.ts and nothing else.
import { expect, it } from "vitest";
import { name } from "../src/x.ts";

it("names the base", () => {
  expect(name).toBe("base");
});
