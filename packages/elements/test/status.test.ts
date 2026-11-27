import { describe, expect, it } from "vitest";
import { statusOf, statuses } from "../src/status.ts";

// The status vocabulary (018 research.md R-02; data-model.md § Status vocabulary; FR-002; tasks.md T011), in process:
// `statusOf` returns a value of the five as itself and `"neutral"` for anything else, by an exact, case-sensitive
// match with no trimming (005's attribute conventions), and `statuses` lists the five in the vocabulary's order.
describe("statusOf", () => {
  it.each(["info", "success", "warning", "danger", "neutral"])("returns %s for itself", (value) => {
    expect(statusOf(value)).toBe(value);
  });

  it.each([["bogus"], [""], [null], [undefined], ["Success"], [" info"], ["info "], ["DANGER"]])("returns neutral for %j, beside info for info", (value) => {
    expect({ unknown: statusOf(value), known: statusOf("info") }).toEqual({ unknown: "neutral", known: "info" });
  });
});

describe("statuses", () => {
  it("lists info, success, warning, danger and neutral, in that order, and nothing else", () => {
    expect(statuses).toEqual(["info", "success", "warning", "danger", "neutral"]);
  });
});
