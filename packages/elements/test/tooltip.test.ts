import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-dialog.ts";
import "../src/ocelle-drawer.ts";
import "../src/ocelle-tooltip.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDialogStandIns, defineTooltipStandIns, tooltipScenarios } from "./scenarios/tooltip.ts";

// User Story 3's browser scenarios for `ocelle-tooltip`, in process on the element source (008 tasks.md T042): every
// shared body of scenarios/tooltip.ts (contracts/checks.md § Tooltip) on the in-process driver, in the `elements`
// project at 1280 × 800 as a mouse device, with the stand-ins defined in this file's page; `ocelle-dialog` and
// `ocelle-drawer` are imported for the rows inside an open overlay. The same bodies run on the built browser build on
// the strict-CSP fixture in test/browser/tooltip.test.ts; the touch rows run in test/tooltip.touch.test.ts and
// "No Popover API" in test/tooltip-no-popover.test.ts.
defineDialogStandIns();
defineTooltipStandIns();
const driver = inProcessDriver();

// The reset helper ends forced colours and reduced motion together (test/commands.ts `emulate`), so no emulation
// leaks into the next body; a body that resizes the viewport restores it itself.
afterEach(async () => {
  await commands.emulateForcedColors("none");
});

// Each test is named by its row's full name (tasks.md Rules § Full test names), never by a `$name` interpolation,
// which Vitest shortens to 40 characters.
describe("ocelle-tooltip, in process (US3)", { timeout: 30_000 }, () => {
  for (const { name, run, expected } of tooltipScenarios) {
    it(name, async () => {
      expect(await run(driver)).toEqual(expected);
    });
  }
});
