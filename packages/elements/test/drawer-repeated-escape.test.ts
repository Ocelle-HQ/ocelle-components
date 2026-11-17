import { describe, expect, it } from "vitest";
import "../src/ocelle-drawer.ts";
import { inProcessDriver } from "./in-process.ts";
import { defineDrawerStandIns, drawerRepeatedEscape } from "./scenarios/drawer.ts";

// The veto-then-Escape-twice case of matrix § Dialog "Escape with slotted content", inherited by matrix § Drawer, in
// process on a page of its own (008 operator decision 2026-11-14, R-02; tasks.md T031): in Chromium whether the
// platform's second `cancel` is cancelable depends on the page's history of user activations and vetoed cancels, so
// the shared body, its warm-up included, runs alone in this file's fresh page, as test/dialog-repeated-escape.test.ts
// does for the dialog. The fixture runs it on a fresh page from test/browser/drawer.test.ts.
defineDrawerStandIns();
const driver = inProcessDriver();

describe("ocelle-drawer, in process, on a page of its own (US2)", () => {
  it(drawerRepeatedEscape.name, async () => {
    expect(await drawerRepeatedEscape.run(driver)).toEqual(drawerRepeatedEscape.expected);
  });
});
