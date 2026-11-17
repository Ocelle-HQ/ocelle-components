import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { define } from "../src/define.ts";
import { OcelleLink } from "../src/ocelle-link.ts";
import { inProcessDriver } from "./in-process.ts";
import { linkScenarios } from "./scenarios/link.ts";
import type { Navigation } from "./scenarios/link.ts";
import type { InPage } from "./scenarios/driver.ts";

// User Story 5's browser scenarios for `ocelle-link`, in process on the element source (014 research.md R-08, R-11,
// T094): every shared body of scenarios/link.ts that is not fixture-only on the in-process driver, each with no
// clipboard call by the page at its end (SC-006); the navigations here are same-document fragments and `javascript:`
// hrefs that would set a marker (R-11 "Navigation in process"), so the element's navigation decision, its
// `defaultPrevented` check and its `location.assign` are killed in process, where Stryker mutates the source. The
// cross-document bodies run on the strict-CSP fixture in test/browser/link.test.ts. Then the in-process case of two
// copies of the package (spec Edge Cases): a second class defined under the tag through the package's guarded `define`
// throws nothing and leaves the first, whose link still emits. And axe-core, the version the axe gate pins, run in
// process on links with and without href and with a `label`: no violation and no incomplete of the link, name and
// contrast rules.
const driver = inProcessDriver();
const inPage: InPage = async (fn, arg) => fn(arg);

/** In process no body navigates across documents: a fixture-only body never runs here. */
const notHere = (): Promise<never> => Promise.reject(new Error("a cross-document navigation runs on the fixture only"));
const navigation: Navigation = { host: location.host, click: notHere, press: notHere, back: notHere, opened: notHere, dialogs: notHere };

afterEach(async () => {
  await commands.emulateForcedColors("none");
  history.replaceState(history.state, "", location.pathname + location.search);
  document.getElementById("kitty-base")?.remove();
});

describe("ocelle-link, in process (US5)", () => {
  for (const { name, run, expected } of linkScenarios.filter((scenario) => !scenario.fixtureOnly)) {
    it(name, async () => {
      const observed = await run(driver, inPage, navigation);
      expect({ observed, clipboard: await driver.clipboardCalls() }).toEqual({ observed: expected, clipboard: [] });
    });
  }

  it("R-08: axe-core reports no violation and no incomplete of the link, name, label-in-name and contrast rules for links with and without href and with a label containing the visible text", async () => {
    await driver.mount('<main><p>See <ocelle-link id="a">the mission log</ocelle-link>, <ocelle-link id="b" href="#nav-1">the first section</ocelle-link> and <ocelle-link id="c" label="the task board, opens in the viewer">the task board</ocelle-link>.</p></main>');
    const rules = ["link-name", "label-content-name-mismatch", "aria-allowed-attr", "aria-allowed-role", "aria-roles", "aria-prohibited-attr", "color-contrast"];
    const results = await axe.run(document.body, { runOnly: { type: "rule", values: rules } });
    expect({
      violations: results.violations.map((violation) => violation.id),
      incomplete: results.incomplete.map((each) => each.id),
      passes: results.passes.map((pass) => pass.id).filter((id) => ["link-name", "label-content-name-mismatch"].includes(id)).sort(),
    }).toEqual({ violations: [], incomplete: [], passes: ["label-content-name-mismatch", "link-name"] });
  });

  it("Edge Cases, two copies of the package: a second definition of ocelle-link throws nothing and the first class stays, the link still exposed and emitting", async () => {
    const thrown: unknown[] = [];
    try {
      define("ocelle-link", class extends HTMLElement {});
    } catch (error) {
      thrown.push(error);
    }
    await driver.mount('<p id="para">See <ocelle-link id="link">the mission log</ocelle-link>.</p>');
    const events: unknown[] = [];
    document.addEventListener("ocelle-link-activate", (event) => events.push((event as CustomEvent<unknown>).detail), { once: true });
    await driver.clickTarget("link");
    const states = await driver.axStates("para", "subtree");
    expect({ thrown, defined: customElements.get("ocelle-link"), links: states.filter((node) => node.role === "link").map((node) => node.name), events }).toEqual({
      thrown: [],
      defined: OcelleLink,
      links: ["the mission log"],
      events: [{ href: null }],
    });
  });
});
