// Plant for the unit tests: the Chromium assertion of research.md R-03 with a brand that does not exist.
import { describe, expect, it } from "vitest";

// User-Agent Client Hints; TypeScript's lib.dom.d.ts does not declare them (research.md R-03).
interface NavigatorUAData {
  readonly brands: readonly { readonly brand: string; readonly version: string }[];
}

describe("planted elements", () => {
  it("runs in a browser brand that does not exist", () => {
    const uaData = (navigator as Navigator & { readonly userAgentData?: NavigatorUAData }).userAgentData;
    const brands = uaData?.brands.map((b) => b.brand);
    expect(brands, `browser brands: ${String(brands?.join(", "))}`).toContain("Planted Browser");
  });
});
