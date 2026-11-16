import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-drawer.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDrawerStandIns, drawerScenarios } from "./scenarios/drawer.ts";

// User Story 2's browser scenarios for `ocelle-drawer`, in process on the element source (008 tasks.md T031): every
// shared body of scenarios/drawer.ts (contracts/checks.md § Drawer) on the in-process driver, in the `elements`
// project at 1280 × 800, with the stand-ins defined in this file's page. The same bodies run on the built browser
// build on the strict-CSP fixture in test/browser/drawer.test.ts; the repeated-Escape case runs on a page of its own
// in test/drawer-repeated-escape.test.ts and the before-definition case in test/drawer-upgrade.test.ts.
defineDrawerStandIns();
const driver = inProcessDriver();

// The reset helper ends forced colours and reduced motion (013's `emulateReducedMotion`, which forced colours leave
// alone), so no emulation leaks into the next body; a body that resizes the viewport restores it itself.
afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

// Each test is named by its row's full name (tasks.md Rules § Full test names): a `$name` interpolation is shortened
// to 40 characters, which would give rows of a shared prefix one test id for Stryker's coverage and filter.
describe("ocelle-drawer, in process (US2)", { timeout: 30_000 }, () => {
  for (const { name, run, expected } of drawerScenarios) {
    it(name, async () => {
      expect(await run(driver)).toEqual(expected);
    });
  }
});
