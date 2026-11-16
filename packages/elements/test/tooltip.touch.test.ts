import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-tooltip.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDialogStandIns, defineTooltipStandIns, tooltipTouchScenarios } from "./scenarios/tooltip.ts";

// The touch rows of `ocelle-tooltip`, in process on the element source (008 tasks.md T042; contracts/checks.md
// § Tooltip "Touch"; research.md R-14): the `elements-touch` project, a context with `hasTouch` at 1280 × 800, runs
// this file only among the tooltip's; the same bodies run on the strict-CSP fixture in a touch context in
// test/browser/tooltip.touch.test.ts.
defineDialogStandIns();
defineTooltipStandIns();
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-tooltip, in process, touch context (US3-10)", { timeout: 30_000 }, () => {
  for (const { name, run, expected } of tooltipTouchScenarios) {
    it(name, async () => {
      expect(await run(driver)).toEqual(expected);
    });
  }
});
