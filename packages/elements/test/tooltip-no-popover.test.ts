import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { inspect, pause } from "./scenarios/dialog.ts";
import { bubbleOpen, defineDialogStandIns, defineTooltipStandIns, frames, never, page, start, tabFrom, track } from "./scenarios/tooltip.ts";

// "No Popover API" (008 contracts/checks.md § Tooltip; research.md R-10; Edge Cases "Engine without the Popover API";
// tasks.md T042), in process only: this file's page removes `showPopover` from `HTMLElement.prototype` before the
// element is defined, then imports src/ocelle-tooltip.ts. The tooltip renders its bubble part, which has no box; hover
// past the delay and keyboard focus show nothing, and nothing throws or logs.
defineDialogStandIns();
defineTooltipStandIns();
const driver = inProcessDriver();

describe("ocelle-tooltip without the Popover API, in process (R-10)", () => {
  it("renders its bubble part with popover=manual and no box; hover past the delay and keyboard focus show no bubble; no message and no uncaught error", async () => {
    const prototype = HTMLElement.prototype as unknown as Record<string, unknown>;
    delete prototype.showPopover;
    const removed = !("showPopover" in HTMLElement.prototype);
    await import("../src/ocelle-tooltip.ts");
    // A bounded wait (R-15): the definition, or the observation without it after 1 000 ms.
    await Promise.race([customElements.whenDefined("ocelle-tooltip"), pause(1000)]);
    await start(driver, page());
    await track(driver);
    await driver.hover("trg");
    await pause(450);
    await tabFrom(driver);
    const f = await frames(driver);
    const part = await inspect(driver, "tip", '[part="bubble"]', ["display"]);
    expect({
      removed,
      defined: customElements.get("ocelle-tooltip") !== undefined,
      part: { exists: part.exists, popover: part.attributes.popover, display: part.styles.display, width: part.width, height: part.height },
      never: never(f, 400),
      open: await bubbleOpen(driver),
      focus: await driver.focusPath(),
      layer: await driver.topLayer(),
      messages: await driver.messages(),
    }).toEqual({
      removed: true,
      defined: true,
      part: { exists: true, popover: "manual", display: "none", width: 0, height: 0 },
      never: true,
      open: false,
      focus: "trg",
      layer: [],
      messages: [],
    });
  });
});
