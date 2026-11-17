import { describe, expect, it } from "vitest";
import { source } from "../../tokens/src/source.ts";
import { below, chooseTier, parseLength, publishedCollapse, publishedInspectorCollapse, resolveLength, shownPanes, threshold } from "../src/tiers.ts";

// The container-tier rules of `ocelle-list-detail` (009 spec FR-025, FR-027, FR-034, US3 scenario 10; research.md
// R-12; data-model.md § list-detail; T046), in process and without layout. The figures are written by hand from the
// spec and research: after trimming ASCII whitespace a `*-below` value is accepted exactly when it matches
// `^(?:0|[0-9]+(?:\.[0-9]+)?(?:px|rem|em))$`, units in any ASCII letter case; `rem` resolves at the root's font size and
// `em` at the host's; an absent or rejected attribute gives the token's computed value when that parses, else the
// published value (40rem, 60rem); the comparison is exclusive; and the tier is `one` with `narrow` or below the
// collapse threshold, else `two` below the inspector threshold or without an inspector, else `three`.
describe("parseLength(value)", () => {
  it.each([
    { value: "0", length: { value: 0, unit: "px" } },
    { value: "0px", length: { value: 0, unit: "px" } },
    { value: "0rem", length: { value: 0, unit: "rem" } },
    { value: "56rem", length: { value: 56, unit: "rem" } },
    { value: "55.5rem", length: { value: 55.5, unit: "rem" } },
    { value: "55.25rem", length: { value: 55.25, unit: "rem" } },
    { value: "880px", length: { value: 880, unit: "px" } },
    { value: "55em", length: { value: 55, unit: "em" } },
    { value: "56REM", length: { value: 56, unit: "rem" } },
    { value: "880Px", length: { value: 880, unit: "px" } },
    { value: "55EM", length: { value: 55, unit: "em" } },
    { value: " 56rem ", length: { value: 56, unit: "rem" } },
    { value: "\t\n\f\r56rem\r\n", length: { value: 56, unit: "rem" } },
    { value: "007rem", length: { value: 7, unit: "rem" } },
  ])("accepts $value as $length.value $length.unit", ({ value, length }) => {
    expect(parseLength(value)).toEqual(length);
  });

  it.each([
    "+56rem",
    ".5rem",
    "56.rem",
    "5.6e1rem",
    "-0",
    "-1rem",
    "120%",
    "80vw",
    "110cqi",
    "700pt",
    "900",
    "calc(56rem)",
    "var(--x)",
    "wide",
    " ",
    "",
    "56 rem",
    "56rem;",
    "56remx",
    "rem",
    "0.",
    "00",
    " 56rem",
  ])("rejects %j", (value) => {
    expect(parseLength(value)).toBeUndefined();
  });

  it("gives no length for an absent attribute", () => {
    expect([parseLength(null), parseLength(undefined)]).toEqual([undefined, undefined]);
  });
});

describe("resolveLength(length, rootFontSize, hostFontSize)", () => {
  it("keeps px, resolves rem at the root's font size and em at the host's", () => {
    expect([
      resolveLength({ value: 880, unit: "px" }, 16, 20),
      resolveLength({ value: 56, unit: "rem" }, 16, 20),
      resolveLength({ value: 56, unit: "rem" }, 20, 16),
      resolveLength({ value: 45, unit: "em" }, 16, 20),
      resolveLength({ value: 45, unit: "em" }, 20, 16),
    ]).toEqual([880, 896, 1120, 900, 720]);
  });
});

describe("threshold({ attribute, token, published, rootFontSize, hostFontSize })", () => {
  const at = { rootFontSize: 16, hostFontSize: 16 };

  it("takes the attribute when it is an accepted form, whatever the token", () => {
    expect([
      threshold({ attribute: "56rem", token: "40rem", published: "40rem", ...at }),
      threshold({ attribute: "0", token: "40rem", published: "40rem", ...at }),
      threshold({ attribute: "45em", token: "40rem", published: "40rem", rootFontSize: 16, hostFontSize: 20 }),
    ]).toEqual([896, 0, 900]);
  });

  it("takes the token's computed value, trimmed, when the attribute is absent or rejected", () => {
    expect([
      threshold({ attribute: undefined, token: "56rem", published: "40rem", ...at }),
      threshold({ attribute: null, token: " 56rem", published: "40rem", ...at }),
      threshold({ attribute: "120%", token: "56rem", published: "40rem", ...at }),
      threshold({ attribute: "", token: "50rem", published: "60rem", ...at }),
    ]).toEqual([896, 896, 896, 800]);
  });

  it("takes the published value when the token's value is not an accepted form or is empty", () => {
    expect([
      threshold({ attribute: undefined, token: "120%", published: "40rem", ...at }),
      threshold({ attribute: "wide", token: "", published: "40rem", ...at }),
      threshold({ attribute: undefined, token: "50%", published: "60rem", ...at }),
      threshold({ attribute: undefined, token: "calc(50rem)", published: "60rem", rootFontSize: 20, hostFontSize: 16 }),
    ]).toEqual([640, 640, 960, 1200]);
  });

  it("publishes the token source's values: 40rem for --ocelle-list-detail-collapse and 60rem for --ocelle-list-detail-inspector-collapse", () => {
    const value = (name: string): unknown => source.find((record) => record.name === name)?.value;
    expect({ collapse: publishedCollapse, inspector: publishedInspectorCollapse }).toEqual({ collapse: value("list-detail-collapse"), inspector: value("list-detail-inspector-collapse") });
    expect({ collapse: publishedCollapse, inspector: publishedInspectorCollapse }).toEqual({ collapse: "40rem", inspector: "60rem" });
  });
});

describe("below(measured, threshold)", () => {
  it("is exclusive: below by any fraction, not at the threshold or above", () => {
    expect([below(639.5, 640), below(640, 640), below(640.5, 640), below(0, 0)]).toEqual([true, false, false, false]);
  });
});

describe("chooseTier({ measured, collapseAt, inspectorAt, narrow, hasInspector })", () => {
  const thresholds = { collapseAt: 640, inspectorAt: 960 };

  it.each([
    // Frame R, W, N and S with an inspector, without narrow
    { measured: 1196, narrow: false, hasInspector: true, tier: "three" },
    { measured: 876, narrow: false, hasInspector: true, tier: "two" },
    { measured: 636, narrow: false, hasInspector: true, tier: "one" },
    { measured: 288, narrow: false, hasInspector: true, tier: "one" },
    // the exact thresholds give the wider layout
    { measured: 960, narrow: false, hasInspector: true, tier: "three" },
    { measured: 959.5, narrow: false, hasInspector: true, tier: "two" },
    { measured: 640, narrow: false, hasInspector: true, tier: "two" },
    { measured: 639.5, narrow: false, hasInspector: true, tier: "one" },
    // without an inspector, two columns at any width at or above the collapse threshold
    { measured: 1196, narrow: false, hasInspector: false, tier: "two" },
    { measured: 876, narrow: false, hasInspector: false, tier: "two" },
    { measured: 636, narrow: false, hasInspector: false, tier: "one" },
    // narrow forces one column at every width
    { measured: 1196, narrow: true, hasInspector: true, tier: "one" },
    { measured: 876, narrow: true, hasInspector: true, tier: "one" },
    { measured: 1196, narrow: true, hasInspector: false, tier: "one" },
    { measured: 636, narrow: true, hasInspector: false, tier: "one" },
  ])("measured $measured, narrow $narrow, inspector $hasInspector: $tier", ({ measured, narrow, hasInspector, tier }) => {
    expect(chooseTier({ measured, narrow, hasInspector, ...thresholds })).toBe(tier);
  });

  it("follows the thresholds it is given", () => {
    expect([
      chooseTier({ measured: 876, collapseAt: 896, inspectorAt: 960, narrow: false, hasInspector: true }),
      chooseTier({ measured: 876, collapseAt: 640, inspectorAt: 800, narrow: false, hasInspector: true }),
      chooseTier({ measured: 636, collapseAt: 0, inspectorAt: 960, narrow: false, hasInspector: true }),
      chooseTier({ measured: 636, collapseAt: 0, inspectorAt: 0, narrow: false, hasInspector: true }),
    ]).toEqual(["one", "three", "two", "three"]);
  });
});

describe("shownPanes(tier, detailOpen, hasInspector)", () => {
  it.each([
    { tier: "three", detailOpen: false, hasInspector: true, panes: ["list", "detail", "inspector"] },
    { tier: "three", detailOpen: true, hasInspector: true, panes: ["list", "detail", "inspector"] },
    { tier: "two", detailOpen: false, hasInspector: true, panes: ["list", "detail", "inspector"] },
    { tier: "two", detailOpen: true, hasInspector: true, panes: ["list", "detail", "inspector"] },
    { tier: "two", detailOpen: false, hasInspector: false, panes: ["list", "detail"] },
    { tier: "two", detailOpen: true, hasInspector: false, panes: ["list", "detail"] },
    { tier: "one", detailOpen: false, hasInspector: true, panes: ["list"] },
    { tier: "one", detailOpen: false, hasInspector: false, panes: ["list"] },
    { tier: "one", detailOpen: true, hasInspector: true, panes: ["detail", "inspector"] },
    { tier: "one", detailOpen: true, hasInspector: false, panes: ["detail"] },
  ] as const)("$tier, detail-open $detailOpen, inspector $hasInspector: $panes", ({ tier, detailOpen, hasInspector, panes }) => {
    expect(shownPanes(tier, detailOpen, hasInspector)).toEqual(panes);
  });
});
