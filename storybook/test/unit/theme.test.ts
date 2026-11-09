import { addons } from "storybook/manager-api";
import { describe, expect, it } from "vitest";
import { theme } from "../../.storybook/manager.ts";

// The Storybook UI theme has no monospace (FR-023, US1 scenario 13; contracts/gates.md § Monospace in Storybook,
// PLAN-FRESH-3-002; T034): fontBase and fontCode are the family list of --ocelle-font-sans, transcribed from
// Appendix A (not imported), and manager.ts passes that theme to the manager.
const fontSans = '"Schibsted Grotesk", "Helvetica Neue", Arial, system-ui, sans-serif';

describe("the Storybook UI theme", () => {
  it("sets fontBase and fontCode to the family list of --ocelle-font-sans", () => {
    expect(theme.fontBase).toBe(fontSans);
    expect(theme.fontCode).toBe(fontSans);
  });

  it("is the theme manager.ts passes to the manager", () => {
    expect(addons.getConfig().theme).toBe(theme);
  });
});
