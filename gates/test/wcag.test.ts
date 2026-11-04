import { describe, expect, it } from "vitest";
import { contrastRatio, relativeLuminance } from "../lib/wcag.ts";

// WCAG 2.x relative luminance and contrast ratio (002 FR-017, research.md R-07). Expected values: spec Appendix A,
// A.7 and A.9, research.md R-04, and the WCAG 2.x definition (sRGB channel c/12.92 at or below 0.04045, else
// ((c + 0.055) / 1.055) ^ 2.4; L = 0.2126 R + 0.7152 G + 0.0722 B; ratio (L1 + 0.05) / (L2 + 0.05)).
describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white, in either case of hex digit", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 12);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 12);
  });

  it("weighs red, green and blue by 0.2126, 0.7152 and 0.0722", () => {
    expect(relativeLuminance("#FF0000")).toBeCloseTo(0.2126, 12);
    expect(relativeLuminance("#00FF00")).toBeCloseTo(0.7152, 12);
    expect(relativeLuminance("#0000FF")).toBeCloseTo(0.0722, 12);
  });

  it("uses c / 12.92 at or below the 0.04045 threshold and the power curve above it", () => {
    // 10/255 = 0.0392 (linear part), 11/255 = 0.0431 (power part): 0.0392 / 12.92 and ((0.0431 + 0.055) / 1.055) ^ 2.4
    expect(relativeLuminance("#0A0A0A")).toBeCloseTo(10 / 255 / 12.92, 12);
    expect(relativeLuminance("#0B0B0B")).toBeCloseTo(((11 / 255 + 0.055) / 1.055) ** 2.4, 12);
    expect(relativeLuminance("#808080")).toBeCloseTo(((128 / 255 + 0.055) / 1.055) ** 2.4, 12);
  });

  it("reads each channel from its own two digits", () => {
    expect(relativeLuminance("#0A0000")).toBeCloseTo((0.2126 * 10) / 255 / 12.92, 12);
    expect(relativeLuminance("#000A00")).toBeCloseTo((0.7152 * 10) / 255 / 12.92, 12);
    expect(relativeLuminance("#00000A")).toBeCloseTo((0.0722 * 10) / 255 / 12.92, 12);
  });

  it("is 0.0127 for the light color-chrome-hover #211D18 (research.md R-04)", () => {
    expect(relativeLuminance("#211D18").toFixed(4)).toBe("0.0127");
  });

  it.each(["#FFF", "FFFFFF", "#GGGGGG", "#FFFFFF0", " #FFFFFF", "rgb(0 0 0)", ""])("throws on %j, which is not a 6-digit hex colour", (text) => {
    expect(() => relativeLuminance(text)).toThrow(`not a 6-digit hex colour: ${text}`);
  });
});

describe("contrastRatio", () => {
  it("is 21 for white on black and black on white, and 1 for a colour on itself", () => {
    expect(contrastRatio("#FFFFFF", "#000000")).toBeCloseTo(21, 12);
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 12);
    expect(contrastRatio("#8A8276", "#8A8276")).toBe(1);
  });

  it("gives the recorded figures of spec A.7 at their precision", () => {
    expect(contrastRatio("#15130F", "#F1EEE8").toFixed(1)).toBe("16.0");
    expect(contrastRatio("#F1EEE8", "#15130F").toFixed(1)).toBe("16.0");
    expect(contrastRatio("#8A8276", "#E9E5DD").toFixed(2)).toBe("3.02");
    expect(contrastRatio("#C68A1E", "#F1EEE8").toFixed(1)).toBe("2.6");
  });

  it("gives #8F5E0F on #211D18 at or above 3 unrounded, 3.012 at three decimals (research.md R-04)", () => {
    const ratio = contrastRatio("#8F5E0F", "#211D18");
    expect(ratio).toBeGreaterThanOrEqual(3);
    expect(ratio.toFixed(3)).toBe("3.012");
  });

  it("gives the A.9 ratios below threshold", () => {
    expect([contrastRatio("#8A8276", "#F1E1C0").toFixed(2), contrastRatio("#7A7264", "#3A2B10").toFixed(2), contrastRatio("#C68A1E", "#F1EEE8").toFixed(2)]).toEqual([
      "2.94",
      "2.88",
      "2.57",
    ]);
  });

  it("throws naming a colour that is not a 6-digit hex", () => {
    expect(() => contrastRatio("#FFFFFF", "rgb(0 0 0 / 0.5)")).toThrow("not a 6-digit hex colour: rgb(0 0 0 / 0.5)");
  });
});
