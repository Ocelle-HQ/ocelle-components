import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { afterUpgrade, beforeUpgrade, defineDialogStandIns, upgradeExpected, upgradeMarkup } from "./scenarios/dialog.ts";

// The before-definition case of the open-at-first-render row (008 contracts/checks.md § Dialog "Open at first render"
// (b); tasks.md T016), in process: this file's page mounts an open `ocelle-dialog` while the tag is undefined, with the
// page button focused, and imports src/ocelle-dialog.ts only after the mount. After the upgrade the dialog is shown
// modally with initial focus on the first slotted button and no event; `open = false` gives reason host and focus
// back on the page button.
defineDialogStandIns();
const driver = inProcessDriver();

describe("ocelle-dialog, open before it is defined, in process (US1)", () => {
  it("is shown modally after the upgrade with focus on the first slotted button, no event on open, and returns focus to the page button on close", async () => {
    await driver.mount(upgradeMarkup);
    const before = await beforeUpgrade(driver);
    await import("../src/ocelle-dialog.ts");
    // A bounded wait (R-15): the definition, or the observation without it after 1 000 ms.
    await Promise.race([customElements.whenDefined("ocelle-dialog"), new Promise((resolve) => setTimeout(resolve, 1000))]);
    await driver.setAttribute("act", "data-wait", "");
    expect({ before, after: await afterUpgrade(driver) }).toEqual(upgradeExpected);
  });
});
