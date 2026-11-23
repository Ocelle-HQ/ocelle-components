import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { define } from "../src/define.ts";
import { OcelleCopyField } from "../src/ocelle-copy-field.ts";
import { OcelleIcon } from "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { copyFieldScenarios } from "./scenarios/copy-field.ts";
import type { InPage } from "./scenarios/driver.ts";

// User Story 4's browser scenarios for `ocelle-copy-field`, in process on the element source (014 research.md R-07,
// R-11, T078): every shared body of scenarios/copy-field.ts on the in-process driver, each with no clipboard call by the
// page at its end (SC-006); the same bodies run on the built browser build on the strict-CSP fixture in
// test/browser/copy-field.test.ts. Importing src/ocelle-copy-field.ts defines the field and `ocelle-icon` (R-16). Then
// the in-process case of two copies of the package (spec Edge Cases): a second class defined under the tag through the
// package's guarded `define` throws nothing and leaves the first, whose field still requests. And axe-core, the version
// the axe gate pins, run in process on a field with a status and on an empty one (research.md R-01): it reads the
// group role where the internals are kept and reports no violation and no incomplete of the ARIA, name and contrast
// rules.
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-copy-field, in process (US4)", () => {
  for (const { name, run, expected } of copyFieldScenarios) {
    it(name, async () => {
      const observed = await run(driver, inPage);
      expect({ observed, clipboard: await driver.clipboardCalls() }).toEqual({ observed: expected, clipboard: [] });
    });
  }

  it("R-01: axe-core reads the group role the field keeps in its internals: no violation and no incomplete of the ARIA, name and contrast rules for a field with a status and an empty one", async () => {
    await driver.mount('<ocelle-copy-field id="cf" value="pnpm run manifest" status="Copied to clipboard"></ocelle-copy-field><ocelle-copy-field id="empty" aria-label="Empty command"></ocelle-copy-field>');
    const rules = ["aria-allowed-attr", "aria-allowed-role", "aria-valid-attr-value", "aria-prohibited-attr", "button-name", "color-contrast"];
    const results = await axe.run(document.body, { runOnly: { type: "rule", values: rules } });
    const element = document.getElementById("cf");
    const key = element === null ? undefined : Object.getOwnPropertySymbols(element).find((symbol) => symbol.description === "internals");
    expect({
      violations: results.violations.map((violation) => violation.id),
      incomplete: results.incomplete.map((each) => each.id),
      buttonName: results.passes.some((pass) => pass.id === "button-name"),
      axeRole: key === undefined ? "no internals" : ((element as unknown as Record<symbol, ElementInternals>)[key]?.role ?? null),
    }).toEqual({ violations: [], incomplete: [], buttonName: true, axeRole: "group" });
  });

  it("Edge Cases, two copies of the package: a second definition of ocelle-copy-field and ocelle-icon throws nothing and the first classes stay, the field still exposed and requesting", async () => {
    const thrown: unknown[] = [];
    for (const tag of ["ocelle-copy-field", "ocelle-icon"]) {
      try {
        define(tag, class extends HTMLElement {});
      } catch (error) {
        thrown.push(error);
      }
    }
    await driver.mount('<ocelle-copy-field id="cf" value="pnpm run manifest"></ocelle-copy-field>');
    const requests: unknown[] = [];
    document.addEventListener("ocelle-copy-field-request", (event) => requests.push((event as CustomEvent<unknown>).detail), { once: true });
    document.getElementById("cf")?.shadowRoot?.querySelector<HTMLElement>('[part~="copy-control"]')?.click();
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(done, 0))));
    const states = await driver.axStates("cf", "subtree");
    expect({
      thrown,
      classes: [customElements.get("ocelle-copy-field"), customElements.get("ocelle-icon")],
      exposed: states.filter((node) => ["group", "button"].includes(node.role)).map((node) => [node.role, node.name]),
      requests,
    }).toEqual({
      thrown: [],
      classes: [OcelleCopyField, OcelleIcon],
      exposed: [
        ["group", ""],
        ["button", "Copy"],
      ],
      requests: [{ text: "pnpm run manifest" }],
    });
  });
});
