import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { slotScenarios } from "../scenarios/slot.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 3's browser scenarios, the slot convention, on the strict-CSP fixture (005 spec § The strict-CSP fixture;
// research.md R-11, T044): every shared body of scenarios/slot.ts on its own page, `slot.html` or, for the bodies
// with base.css, `slot-base.html`. Each page loads the built browser build, which defines every `ocelle-icon`, and the
// test host's file, the self-contained bundle of test/fixtures/test-host.ts with its own copy of Lit that the global
// setup built; the two are the page's only scripts. Every test asserts zero CSP violations, no request outside the
// allowed list, no failed request and no console message or uncaught error, beside the scenario's outcome.
const built = inject("elementsFixture");
const scripts = ["ocelle-elements.js", "ocelle-test-host.js"];
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

describe("the slot convention on the strict-CSP fixture with the browser build and the test host's file (US3)", { timeout: 60_000 }, () => {
  it.each(slotScenarios)("$name", async ({ run, expected, base }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, base ? "slot-base.html" : "slot.html", scripts);
    const observed = await run(fixtureDriver(page.page, page.log, base));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
