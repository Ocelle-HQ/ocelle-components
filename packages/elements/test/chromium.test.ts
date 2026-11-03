import { describe, expect, it } from "vitest";

// User-Agent Client Hints; TypeScript's lib.dom.d.ts does not declare them (research.md R-03).
interface NavigatorUAData {
  readonly brands: readonly { readonly brand: string; readonly version: string }[];
}

describe("@ocelle/elements test environment", () => {
  it("runs in real Chromium, not a simulated DOM (FR-005, US1 scenario 6)", () => {
    const uaData = (navigator as Navigator & { readonly userAgentData?: NavigatorUAData }).userAgentData;
    expect(uaData?.brands.map((b) => b.brand)).toContain("Chromium");
  });
});
