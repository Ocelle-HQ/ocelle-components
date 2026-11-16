import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { inProcessDriver } from "../in-process.ts";
import type { NavigationRecord } from "../scenarios/driver.ts";

// The in-process navigation sink (012 research.md R-11, PLAN-TESTABILITY-1-001; tasks.md T003): the last bubble-phase
// listener on `window` for `click` and `auxclick` records each activation of a link, whether it was prevented, which
// button, which modifiers and which `href`, then prevents it, so the runner page never navigates. This is the
// in-process body of the link scenarios; the fixture body, on real navigation and new tabs, is in
// test/browser/harness.test.ts. The record of a click on something that is not a link is empty, beside the link's.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

/** The sink's record of an activation of `#link`, with nothing held and nothing prevented unless `changes` says so. */
function record(changes: Partial<NavigationRecord>): NavigationRecord {
  return { type: "click", defaultPrevented: false, button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, href: "link-target.html", ...changes };
}

describe("the navigation sink, in process", () => {
  it("records a plain click, a Ctrl-click, a prevented click, a middle click (auxclick, button 1) and Shift+Enter on a link, nothing for a button, and the page stays", async () => {
    await driver.mount('<a id="link" href="link-target.html">Target</a> <button id="plain" type="button">Plain</button>');
    await driver.click("link");
    await driver.click("link", { modifiers: ["Control"] });
    await driver.preventNext("click");
    await driver.click("link");
    await driver.click("link", { button: "middle" });
    await driver.click("plain");
    await driver.focus("link");
    await driver.press("Enter", ["Shift"]);
    expect({ navigations: await driver.navigations(), href: await driver.attribute("link", "href") }).toEqual({
      navigations: [
        record({}),
        record({ ctrlKey: true }),
        record({ defaultPrevented: true }),
        record({ type: "auxclick", button: 1 }),
        record({ shiftKey: true }),
      ],
      href: "link-target.html",
    });
  });

  it("records Alt- and Meta-clicks with their flags, and starts a new record at each mount", async () => {
    await driver.mount('<a id="link" href="link-target.html">Target</a>');
    await driver.click("link");
    await driver.mount('<a id="link" href="link-target.html">Target</a>');
    await driver.click("link", { modifiers: ["Alt"] });
    await driver.click("link", { modifiers: ["Meta", "Shift"] });
    expect(await driver.navigations()).toEqual([record({ altKey: true }), record({ metaKey: true, shiftKey: true })]);
  });
});
