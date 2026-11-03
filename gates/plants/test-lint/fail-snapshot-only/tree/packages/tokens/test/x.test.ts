// Plant for the test lint.
import { describe, expect, it } from "vitest";

describe("planted", () => {
  it("only snapshots", () => {
    expect({ sum: 1 + 1 }).toMatchSnapshot();
  });
});
