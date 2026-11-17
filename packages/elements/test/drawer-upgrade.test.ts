import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { defineDrawerStandIns, drawerUpgrade } from "./scenarios/drawer.ts";

// The before-definition case of the open-at-first-render row, inherited by matrix § Drawer (008 contracts/checks.md
// § Dialog "Open at first render" (b), § Drawer; tasks.md T031), in process: this file's page mounts a page button
// and an open `ocelle-drawer` with two slotted buttons while the tag is undefined, with the page button focused, and
// imports src/ocelle-drawer.ts only after the mount. After the upgrade the drawer is shown modally with initial focus
// on the first slotted button and no event; `open = false` gives reason host and focus back on the page button.
defineDrawerStandIns();
const driver = inProcessDriver();

describe("ocelle-drawer, open before it is defined, in process (US2)", () => {
  it("is shown modally after the upgrade with focus on the first slotted button, no event on open, and returns focus to the page button on close", async () => {
    await driver.mount(drawerUpgrade.markup);
    const before = await drawerUpgrade.before(driver);
    await import("../src/ocelle-drawer.ts");
    // A bounded wait (R-15): the definition, or the observation without it after 1 000 ms.
    await Promise.race([customElements.whenDefined("ocelle-drawer"), new Promise((resolve) => setTimeout(resolve, 1000))]);
    await driver.setAttribute("act", "data-wait", "");
    expect({ before, after: await drawerUpgrade.after(driver) }).toEqual(drawerUpgrade.expected);
  });
});
