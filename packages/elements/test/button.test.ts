import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-button.ts";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { buttonScenarios } from "./scenarios/button.ts";

// User Story 1's browser scenarios for `ocelle-button` in button mode, in process on the element source (012
// research.md R-11; tasks.md T018): the shared bodies of scenarios/button.ts on the in-process driver, light and dark,
// forced colours and right to left as each body sets them, with axe on each body's page; the same bodies run on the
// built browser build on the strict-CSP fixture in test/browser/button.test.ts. `ocelle-icon` is imported for the
// bodies that slot one. Forced colours and reduced motion are reset after each test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-button, in process (US1)", { timeout: 60_000 }, () => {
  it.each(buttonScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

// The reflected properties (data-model.md § `ocelle-button`; tasks.md T025): `variant`, `size`, `flush`, `ground`
// and `disabled` reflect a property set from script to the attribute, and the boolean ones read an attribute as a
// boolean; `label` is not reflected (test/control.test.ts). Added after the mutation run of T029, which found the
// reflection unasserted: the scenarios set attributes only.
describe("ocelle-button's reflected properties", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reflects variant, size, flush, ground and disabled set as properties, and removes flush and disabled when set false", async () => {
    const host = document.createElement("ocelle-button");
    host.textContent = "Save";
    document.body.append(host);
    host.variant = "quiet";
    host.size = "compact";
    host.flush = true;
    host.ground = "chrome";
    host.disabled = true;
    await host.updateComplete;
    const set = { variant: host.getAttribute("variant"), size: host.getAttribute("size"), flush: host.getAttribute("flush"), ground: host.getAttribute("ground"), disabled: host.getAttribute("disabled") };
    host.flush = false;
    host.disabled = false;
    await host.updateComplete;
    expect({ set, cleared: { flush: host.hasAttribute("flush"), disabled: host.hasAttribute("disabled") } }).toEqual({
      set: { variant: "quiet", size: "compact", flush: "", ground: "chrome", disabled: "" },
      cleared: { flush: false, disabled: false },
    });
  });

  it("reads the flush and disabled attributes as booleans, and variant, size and ground as strings", async () => {
    document.body.innerHTML = '<ocelle-button id="b" flush disabled variant="primary" size="compact" ground="state">Save</ocelle-button>';
    const host = document.querySelector("ocelle-button");
    await host?.updateComplete;
    expect({ flush: host?.flush, disabled: host?.disabled, variant: host?.variant, size: host?.size, ground: host?.ground }).toEqual({ flush: true, disabled: true, variant: "primary", size: "compact", ground: "state" });
  });
});
