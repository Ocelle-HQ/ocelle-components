import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { define } from "../src/define.ts";
import { OcelleSegment } from "../src/ocelle-segment.ts";
import { OcelleSegmentedChoice } from "../src/ocelle-segmented-choice.ts";
import { inProcessDriver } from "./in-process.ts";
import { segmentedChoiceScenarios } from "./scenarios/segmented-choice.ts";
import type { InPage } from "./scenarios/driver.ts";

// User Story 3's browser scenarios for `ocelle-segmented-choice` and `ocelle-segment`, in process on the element source
// (014 research.md R-11, T063): every shared body of scenarios/segmented-choice.ts on the in-process driver, each with no
// clipboard call by the page at its end (SC-006); the same bodies run on the built browser build on the strict-CSP
// fixture in test/browser/segmented-choice.test.ts. Importing src/ocelle-segmented-choice.ts defines both elements
// (R-16); the segment is imported here too for its class. Then the in-process case of two copies of the package (spec
// Edge Cases): a second class defined under each tag through the package's guarded `define` throws nothing and leaves
// the first, whose segmented choice still works. And axe-core, the version the axe gate pins, run in process on a
// segmented choice with a pressed and a disabled segment (research.md R-01): it finds the internals where they are
// kept, so it reports no violation and no incomplete of the rules that read the toggle buttons' states, while it reads
// the toolbar's and the segments' roles, and the rule that checks `aria-pressed` on a role it allows passes.
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-segmented-choice and ocelle-segment, in process (US3)", () => {
  for (const { name, run, expected } of segmentedChoiceScenarios) {
    it(name, async () => {
      const observed = await run(driver, inPage);
      expect({ observed, clipboard: await driver.clipboardCalls() }).toEqual({ observed: expected, clipboard: [] });
    });
  }

  it("R-01: axe-core reads the internals the segmented choice and its segments keep: no violation and no incomplete of the ARIA, name and contrast rules for a group with a pressed and a disabled segment, aria-allowed-attr passing, beside the roles it reads", async () => {
    await driver.mount('<ocelle-segmented-choice id="sc" label="Lane filter" value="mine"><ocelle-segment value="all">All</ocelle-segment><ocelle-segment value="mine">Mine</ocelle-segment><ocelle-segment value="done" disabled>Done</ocelle-segment></ocelle-segmented-choice>');
    const rules = ["aria-allowed-attr", "aria-allowed-role", "aria-valid-attr-value", "aria-required-parent", "aria-toggle-field-name", "button-name", "color-contrast"];
    const results = await axe.run(document.body, { runOnly: { type: "rule", values: rules } });
    const axeRole = (selector: string): unknown => {
      const element = document.querySelector(selector);
      const key = element === null ? undefined : Object.getOwnPropertySymbols(element).find((symbol) => symbol.description === "internals");
      return key === undefined ? "no internals" : ((element as unknown as Record<symbol, ElementInternals>)[key]?.role ?? null);
    };
    expect({
      violations: results.violations.map((violation) => violation.id),
      incomplete: results.incomplete.map((each) => each.id),
      allowedAttr: results.passes.some((pass) => pass.id === "aria-allowed-attr"),
      axeRoles: [axeRole("#sc"), axeRole("#sc > ocelle-segment")],
    }).toEqual({ violations: [], incomplete: [], allowedAttr: true, axeRoles: ["toolbar", "button"] });
  });

  it("Edge Cases, two copies of the package: a second definition of ocelle-segmented-choice and ocelle-segment throws nothing and the first classes stay, their segments exposed and pressing", async () => {
    const thrown: unknown[] = [];
    for (const tag of ["ocelle-segmented-choice", "ocelle-segment"]) {
      try {
        define(tag, class extends HTMLElement {});
      } catch (error) {
        thrown.push(error);
      }
    }
    await driver.mount('<ocelle-segmented-choice id="sc" label="Lane filter"><ocelle-segment value="all">All</ocelle-segment><ocelle-segment value="mine">Mine</ocelle-segment></ocelle-segmented-choice>');
    await driver.click({ parent: "sc", kind: "ocelle-segment", index: 1 });
    const states = await driver.axStates("sc", "subtree");
    expect({
      thrown,
      classes: [customElements.get("ocelle-segmented-choice"), customElements.get("ocelle-segment")],
      value: (document.getElementById("sc") as unknown as { value: unknown }).value,
      exposed: states.filter((node) => ["toolbar", "button"].includes(node.role)).map((node) => [node.role, node.name, node.pressed === true]),
    }).toEqual({
      thrown: [],
      classes: [OcelleSegmentedChoice, OcelleSegment],
      value: "mine",
      exposed: [
        ["toolbar", "Lane filter", false],
        ["button", "All", false],
        ["button", "Mine", true],
      ],
    });
  });
});
