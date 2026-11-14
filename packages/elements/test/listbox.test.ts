import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { define } from "../src/define.ts";
import { OcelleListbox } from "../src/ocelle-listbox.ts";
import { OcelleOption } from "../src/ocelle-option.ts";
import { inProcessDriver } from "./in-process.ts";
import { listboxScenarios } from "./scenarios/listbox.ts";
import type { InPage } from "./scenarios/driver.ts";

// User Story 1's browser scenarios for `ocelle-listbox` and `ocelle-option`, in process on the element source (014
// research.md R-11, T015): every shared body of scenarios/listbox.ts on the in-process driver, each with no clipboard
// call by the page at its end (SC-006); the same bodies run on the built browser build on the strict-CSP fixture in
// test/browser/listbox.test.ts. Importing src/ocelle-listbox.ts alone defines both elements (R-16). Then the in-process
// case of two copies of the package (spec Edge Cases): a second class defined under each tag through the package's
// guarded `define` throws nothing and leaves the first, whose listbox still works. And axe-core, the version the axe
// gate pins, run in process on a listbox and on an option outside one (research.md R-01; added after the mutation run
// of phase 2): it finds the internals where they are kept, so it reports no aria-allowed-attr, aria-required-parent or
// aria-required-children violation, while it reads the listbox's and the options' roles.
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-listbox and ocelle-option, in process (US1)", () => {
  // One `it` per body under its full name (`it.each`'s "$name" shortens a long name to 40 characters, which made the
  // eight re-render bodies share one name and hid the scenario from `-t`).
  for (const { name, run, expected } of listboxScenarios) {
    it(name, async () => {
      const observed = await run(driver, inPage);
      expect({ observed, clipboard: await driver.clipboardCalls() }).toEqual({ observed: expected, clipboard: [] });
    });
  }

  it("R-01: axe-core reads the internals the listbox and its options keep: no aria-allowed-attr, aria-required-parent or aria-required-children violation for a listbox with a selected and a disabled option and an option outside a listbox, beside the roles it reads", async () => {
    await driver.mount('<ocelle-listbox id="lb" label="Folders" value="beta"><ocelle-option value="alpha">alpha</ocelle-option><ocelle-option value="beta">beta</ocelle-option><ocelle-option value="gamma" disabled>gamma</ocelle-option></ocelle-listbox><ocelle-option id="lone" value="lone">lone</ocelle-option>');
    const rules = ["aria-allowed-attr", "aria-required-parent", "aria-required-children", "aria-allowed-role"];
    const results = await axe.run(document.body, { runOnly: { type: "rule", values: rules } });
    const roles = (await driver.axStates("lb", "subtree")).filter((node) => node.role === "listbox" || node.role === "option").map((node) => node.role);
    // The role axe reads for each element, through the own symbol described `internals` it looks for: none on the option
    // outside a listbox (Chromium exposes no node for it either way, so only this read tells).
    const axeRole = (id: string): unknown => {
      const element = document.getElementById(id) ?? document.querySelector(id);
      const key = Object.getOwnPropertySymbols(element).find((symbol) => symbol.description === "internals");
      return key === undefined ? "no internals" : ((element as unknown as Record<symbol, ElementInternals>)[key]?.role ?? null);
    };
    expect({
      violations: results.violations.map((violation) => violation.id),
      incomplete: results.incomplete.map((each) => each.id),
      passed: results.passes.map((pass) => pass.id).sort(),
      roles,
      axeRoles: [axeRole("lb"), axeRole("#lb > ocelle-option"), axeRole("lone")],
    }).toEqual({
      violations: [],
      incomplete: [],
      passed: ["aria-allowed-attr"],
      axeRoles: ["listbox", "option", null],
      roles: ["listbox", "option", "option", "option"],
    });
  });

  it("Edge Cases, two copies of the package: a second definition of ocelle-listbox and ocelle-option throws nothing and the first classes stay, their listbox exposed and selecting", async () => {
    const thrown: unknown[] = [];
    for (const tag of ["ocelle-listbox", "ocelle-option"]) {
      try {
        define(tag, class extends HTMLElement {});
      } catch (error) {
        thrown.push(error);
      }
    }
    await driver.mount('<ocelle-listbox id="lb" label="Folders"><ocelle-option value="alpha">alpha</ocelle-option><ocelle-option value="beta">beta</ocelle-option></ocelle-listbox>');
    await driver.click({ parent: "lb", kind: "ocelle-option", index: 1 });
    const states = await driver.axStates("lb", "subtree");
    expect({
      thrown,
      classes: [customElements.get("ocelle-listbox"), customElements.get("ocelle-option")],
      value: (document.getElementById("lb") as unknown as { value: unknown }).value,
      exposed: states.filter((node) => node.role === "listbox" || node.role === "option").map((node) => [node.role, node.name, node.selected === true]),
    }).toEqual({
      thrown: [],
      classes: [OcelleListbox, OcelleOption],
      value: "beta",
      exposed: [
        ["listbox", "Folders", false],
        ["option", "alpha", false],
        ["option", "beta", true],
      ],
    });
  });
});
