import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-code-block.ts";
import { inProcessDriver } from "./in-process.ts";
import { codeBlockLifecycle, codeBlockLifecycleExpected, codeBlockRuleScenarios, codeBlockScenarios } from "./scenarios/code-block.ts";

// User Story 2's browser scenarios for `ocelle-code-block`, in process on the element source (020 contracts/checks.md
// § Scenario bodies; tasks.md T026): every shared body of scenarios/code-block.ts, the US2 scenarios and the FR and
// edge-case bodies, on the in-process driver; the same bodies run on the built browser build on the strict-CSP
// fixture in test/browser/code-block.test.ts. Forced colours, reduced motion and the viewport are reset after each
// test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
  await driver.viewport(1280, 800);
});

describe("ocelle-code-block, in process (US2)", { timeout: 60_000 }, () => {
  it.each(codeBlockScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("ocelle-code-block's rules and edge cases, in process (FR-020 to FR-029)", { timeout: 60_000 }, () => {
  it.each(codeBlockRuleScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });

  it("FR-020 reconnect: refreshes the detached edit and resumes observing connected edits", async () => {
    await driver.mount("");
    expect(await codeBlockLifecycle()).toEqual(codeBlockLifecycleExpected);
  });

  it("FR-025: relabelling a focused wrap block does not repeat the focus handover", async () => {
    await driver.mount(`<button id="before">Before</button><div id="frame"><ocelle-code-block id="cb" overflow="scroll" label="Deploy">${"command ".repeat(30)}</ocelle-code-block></div>`);
    await driver.size("frame", 180, null);
    await driver.focus("before");
    await driver.chord("Tab");
    expect(await driver.deepActive()).toBe("cb >> div.region-box");

    await driver.setProperty("cb", "overflow", "wrap");
    expect(await driver.deepActive()).toBe("cb >> div.block");
    const wrap = document.getElementById("cb")?.shadowRoot?.querySelector(".block");
    if (wrap == null) throw new Error("the wrap block did not render");
    expect(wrap.getAttribute("tabindex")).toBe("-1");

    let tabStopWrites = 0;
    const observer = new MutationObserver((records) => { tabStopWrites += records.length; });
    try {
      observer.observe(wrap, { attributeFilter: ["tabindex"] });
      await driver.setProperty("cb", "label", "Release");
      expect(tabStopWrites).toBe(0);
      expect(await driver.deepActive()).toBe("cb >> div.block");
      expect(wrap.getAttribute("tabindex")).toBe("-1");
    } finally {
      observer.disconnect();
    }

    await driver.focus("before");
    expect(wrap.getAttribute("tabindex")).toBeNull();
  });
});
