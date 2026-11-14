import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { scrollerGuards, scrollerScenarios } from "../scenarios/scroller.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-scroller` on the strict-CSP fixture with the built browser build (009
// spec § The strict-CSP fixture, US1 Independent Test, US1-15, FR-031; research.md R-17; T014): every shared body of
// scenarios/scroller.ts on its own scroller.html page, which loads the browser build and the test-only slotted controls
// (test/fixtures/shadow-controls.ts, bundled by global-setup.ts), with zero CSP violations, no request outside the
// allowed list, no failed request and no console message or uncaught error, asserted in the same test as the
// scenario's positive outcome.
const built = inject("elementsFixture");
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

describe("ocelle-scroller on the strict-CSP fixture with the browser build (US1)", { timeout: 120_000 }, () => {
  it.each([...scrollerScenarios, ...scrollerGuards])("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "scroller.html", ["ocelle-elements.js", "ocelle-test-controls.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
