import { describe, expect, it } from "vitest";
import { laneName, parseCount, validCount } from "../src/lane-count.ts";

// The lane's count grammar and its name (009 spec FR-018, FR-019, US2 scenarios 5 and 6; research.md R-09;
// data-model.md § Lane; T031), in process and without layout. The figures are written by hand from the spec: an
// attribute counts exactly when, after trimming, it is decimal digits only (no sign, point or exponent) and at most
// `Number.MAX_SAFE_INTEGER` (9007199254740991); the property, when it is a safe integer of 0 or more. The name is the
// title, then ", " and the `count-label` (trimmed, when non-blank) or the count when a count is shown; without a title
// the count text alone; without a shown count the title alone; with neither, none. A non-blank host `aria-label`
// decides alone, trimmed, and a blank one counts as absent. No built-in word is added.
describe("parseCount(attribute value)", () => {
  it.each([
    { value: "3", count: 3 },
    { value: " 3 ", count: 3 },
    { value: "03", count: 3 },
    { value: "0", count: 0 },
    { value: "00", count: 0 },
    { value: "\t12\n", count: 12 },
    { value: "9007199254740991", count: 9_007_199_254_740_991 },
  ])("accepts $value as $count", ({ value, count }) => {
    expect(parseCount(value)).toBe(count);
  });

  it.each(["+3", "3e0", "3.0", "-1", "2.5", "abc", "", "   ", "3 4", "0x3", "٣", "9007199254740992", "99999999999999999999"])("rejects %j", (value) => {
    expect(parseCount(value)).toBeUndefined();
  });

  it("gives no count for an absent attribute", () => {
    expect(parseCount(null)).toBeUndefined();
  });
});

describe("validCount(property value)", () => {
  it.each([0, 3, 12, Number.MAX_SAFE_INTEGER])("accepts %d", (value) => {
    expect(validCount(value)).toBe(value);
  });

  it.each([-1, 2.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, -0.5, "3", null, undefined, true])("rejects %j", (value) => {
    expect(validCount(value)).toBeUndefined();
  });
});

type Args = Parameters<typeof laneName>;

describe("laneName(hostAriaLabel, label, count, countLabel)", () => {
  it.each<{ case: string; args: Args; name: string }>([
    { case: "title and count", args: [null, "Ready", 3, undefined], name: "Ready, 3" },
    { case: "title, count and count-label", args: [null, "Ready", 3, "3 work packages"], name: "Ready, 3 work packages" },
    { case: "a count of 0", args: [null, "Ready", 0, undefined], name: "Ready, 0" },
    { case: "a count without a title", args: [null, undefined, 3, undefined], name: "3" },
    { case: "a count and count-label without a title", args: [null, undefined, 3, "3 work packages"], name: "3 work packages" },
    { case: "a blank title with a count", args: [null, "  ", 3, undefined], name: "3" },
    { case: "an empty title with a count", args: [null, "", 3, undefined], name: "3" },
    { case: "a title without a count", args: [null, "Ready", undefined, undefined], name: "Ready" },
    { case: "a title and a count-label without a count", args: [null, "Ready", undefined, "3 work packages"], name: "Ready" },
    { case: "a title with surrounding spaces", args: [null, " Ready ", 3, undefined], name: "Ready, 3" },
    { case: "a count-label with surrounding spaces", args: [null, "Ready", 3, " 3 work packages "], name: "Ready, 3 work packages" },
    { case: "a blank count-label", args: [null, "Ready", 3, "  "], name: "Ready, 3" },
    { case: "a host aria-label over a title and count", args: ["Ready column", "Ready", 3, undefined], name: "Ready column" },
    { case: "a host aria-label on an untitled lane without a count", args: ["Ready column", undefined, undefined, undefined], name: "Ready column" },
    { case: "a host aria-label, trimmed", args: [" Ready column ", "Ready", 3, undefined], name: "Ready column" },
    { case: "a blank host aria-label over a title and count", args: [" ", "Ready", 3, undefined], name: "Ready, 3" },
    { case: "an empty host aria-label over a title and count", args: ["", "Ready", 3, "3 work packages"], name: "Ready, 3 work packages" },
  ])("$case: $args gives $name", ({ args, name }) => {
    expect(laneName(...args)).toBe(name);
  });

  it.each<{ case: string; args: Args }>([
    { case: "neither title nor count", args: [null, undefined, undefined, undefined] },
    { case: "a blank title and no count", args: [null, "  ", undefined, undefined] },
    { case: "a count-label alone, with no count shown", args: [null, undefined, undefined, "3 work packages"] },
    { case: "a blank host aria-label on an untitled lane without a count", args: [" ", undefined, undefined, undefined] },
  ])("$case: $args gives no name", ({ args }) => {
    expect(laneName(...args)).toBeUndefined();
  });
});
