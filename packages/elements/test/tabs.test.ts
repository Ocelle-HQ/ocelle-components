import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { define } from "../src/define.ts";
import { OcelleTab } from "../src/ocelle-tab.ts";
import { OcelleTabPanel } from "../src/ocelle-tab-panel.ts";
import { OcelleTabs } from "../src/ocelle-tabs.ts";
import "../src/ocelle-link.ts";
import "../src/ocelle-segmented-choice.ts";
import { inProcessDriver } from "./in-process.ts";
import { tabsScenarios } from "./scenarios/tabs.ts";
import type { InPage } from "./scenarios/driver.ts";

// User Story 2's browser scenarios for `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel`, in process on the element
// source (014 research.md R-11, T043): every shared body of scenarios/tabs.ts on the in-process driver, each with no
// clipboard call by the page at its end (SC-006); the same bodies run on the built browser build on the strict-CSP
// fixture in test/browser/tabs.test.ts. Importing src/ocelle-tabs.ts defines the three elements (R-16); the tab and the
// panel are imported here too for their classes, and since phase 4 the segmented choice, which US2-21's body places in
// a panel (T062b), and since phase 6 the link, which US2-22's real body places in a panel (T093a). Then the in-process case of two copies of the package (spec Edge
// Cases): a second class defined under each tag through the package's guarded `define` throws nothing and leaves the
// first, whose tabs still work. And axe-core, the version the axe gate pins, run in process on a tabs with a selected
// and a disabled tab (research.md R-01, R-02): it finds the internals where they are kept, so it reports no
// aria-allowed-attr, aria-required-parent or aria-required-children violation, while it reads the tabs' and panel's
// roles, and no color-contrast incomplete (the association of R-02: `aria-labelledby` on the assigned panel only).
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-tabs, ocelle-tab and ocelle-tab-panel, in process (US2)", () => {
  for (const { name, run, expected } of tabsScenarios) {
    it(name, async () => {
      const observed = await run(driver, inPage);
      expect({ observed, clipboard: await driver.clipboardCalls() }).toEqual({ observed: expected, clipboard: [] });
    });
  }

  it("R-01, R-02: axe-core reads the internals the tabs' children keep: no aria-allowed-attr, aria-required-parent or aria-required-children violation and no incomplete for a tabs with a selected and a disabled tab, beside the roles it reads", async () => {
    await driver.mount('<ocelle-tabs id="tb" label="Mission views" value="plan"><ocelle-tab value="spec">Spec</ocelle-tab><ocelle-tab value="plan">Plan</ocelle-tab><ocelle-tab value="tasks" disabled>Tasks</ocelle-tab><ocelle-tab-panel><p>Spec content</p></ocelle-tab-panel><ocelle-tab-panel><p>Plan content</p></ocelle-tab-panel><ocelle-tab-panel><p>Tasks content</p></ocelle-tab-panel></ocelle-tabs>');
    const rules = ["aria-allowed-attr", "aria-required-parent", "aria-required-children", "aria-allowed-role", "aria-valid-attr-value", "color-contrast"];
    const results = await axe.run(document.body, { runOnly: { type: "rule", values: rules } });
    const axeRole = (selector: string): unknown => {
      const element = document.querySelector(selector);
      const key = element === null ? undefined : Object.getOwnPropertySymbols(element).find((symbol) => symbol.description === "internals");
      return key === undefined ? "no internals" : ((element as unknown as Record<symbol, ElementInternals>)[key]?.role ?? null);
    };
    expect({
      violations: results.violations.map((violation) => violation.id),
      incomplete: results.incomplete.map((each) => each.id),
      passed: results.passes.map((pass) => pass.id).sort(),
      axeRoles: [axeRole("#tb > ocelle-tab"), axeRole("#tb > ocelle-tab-panel")],
    }).toEqual({
      violations: [],
      incomplete: [],
      passed: ["aria-allowed-attr", "aria-allowed-role", "aria-required-children", "aria-valid-attr-value", "color-contrast"],
      axeRoles: ["tab", "tabpanel"],
    });
  });

  it("Edge Cases, two copies of the package: a second definition of ocelle-tabs, ocelle-tab and ocelle-tab-panel throws nothing and the first classes stay, their tabs exposed and selecting", async () => {
    const thrown: unknown[] = [];
    for (const tag of ["ocelle-tabs", "ocelle-tab", "ocelle-tab-panel"]) {
      try {
        define(tag, class extends HTMLElement {});
      } catch (error) {
        thrown.push(error);
      }
    }
    await driver.mount('<ocelle-tabs id="tb" label="Mission views"><ocelle-tab value="spec">Spec</ocelle-tab><ocelle-tab value="plan">Plan</ocelle-tab><ocelle-tab-panel><p>Spec content</p></ocelle-tab-panel><ocelle-tab-panel><p>Plan content</p></ocelle-tab-panel></ocelle-tabs>');
    await driver.clickTarget({ parent: "tb", kind: "ocelle-tab", index: 1 });
    const states = await driver.axStates("tb", "subtree");
    expect({
      thrown,
      classes: [customElements.get("ocelle-tabs"), customElements.get("ocelle-tab"), customElements.get("ocelle-tab-panel")],
      value: (document.getElementById("tb") as unknown as { value: unknown }).value,
      exposed: states.filter((node) => ["tablist", "tab", "tabpanel"].includes(node.role)).map((node) => [node.role, node.name, node.selected === true]),
    }).toEqual({
      thrown: [],
      classes: [OcelleTabs, OcelleTab, OcelleTabPanel],
      value: "plan",
      exposed: [
        ["tablist", "Mission views", false],
        ["tab", "Spec", false],
        ["tab", "Plan", true],
        ["tabpanel", "Plan", false],
      ],
    });
  });
});
