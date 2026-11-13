import type { Browser } from "playwright";
import { describe, expect, it } from "vitest";
import { auditStoryTheme } from "../bin/axe.ts";
import { contextOptions } from "../lib/capture-plan.ts";
import type { ContextOptions } from "../lib/capture-plan.ts";

// The axe gate's browser context (research.md R-08, PLAN-FRESH-3-003): each story-theme gets a fresh context made with
// the capture's options, contextOptions(theme) (viewport 1280 × 800, scale 1, the theme's colour scheme, reduced
// motion, no forced colours, en-GB, UTC), so the axe run sees the page the capture sees; Playwright's default 1280 ×
// 720 would leave a hover target at y = 740 to 780 unhovered. A browser that records the options and then refuses the
// context stands in for Chromium: the audit opens no page without it.
describe("auditStoryTheme: the browser context (research.md R-08)", () => {
  it.each(["light", "dark"] as const)("asks for exactly contextOptions(%s), once, for one story-theme", async (theme) => {
    const asked: unknown[] = [];
    const browser: Pick<Browser, "newContext"> = {
      newContext: (options?: unknown) => {
        asked.push(options);
        return Promise.reject(new Error("no context in this test"));
      },
    };
    const setup = { origin: "http://127.0.0.1:1", dist: "/nowhere/dist", axePath: "/nowhere/axe.min.js", rules: {} };
    await expect(auditStoryTheme(browser, setup, "s--a", theme)).rejects.toThrow("no context in this test");
    const expected: ContextOptions = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, colorScheme: theme, reducedMotion: "reduce", forcedColors: "none", locale: "en-GB", timezoneId: "UTC" };
    expect(asked).toEqual([contextOptions(theme)]);
    expect(asked).toEqual([expected]);
  });
});
