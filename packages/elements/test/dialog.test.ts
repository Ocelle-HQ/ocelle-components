import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-dialog.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDialogStandIns, dialogScenarios } from "./scenarios/dialog.ts";

// User Story 1's browser scenarios for `ocelle-dialog`, in process on the element source (008 tasks.md T016): every
// shared body of scenarios/dialog.ts (contracts/checks.md § Dialog) on the in-process driver, in the `elements`
// project at 1280 × 800, with the stand-ins defined in this file's page. The same bodies run on the built browser
// build on the strict-CSP fixture in test/browser/dialog.test.ts; the before-definition case of the
// open-at-first-render row runs in test/dialog-upgrade.test.ts.
defineDialogStandIns();
const driver = inProcessDriver();

// The reset helper ends forced colours and reduced motion together (test/commands.ts `emulate`), so no emulation
// leaks into the next body; a body that resizes the viewport restores it itself.
afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-dialog, in process (US1)", { timeout: 30_000 }, () => {
  it.each(dialogScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
