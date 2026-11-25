import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { segmentedChoiceScenarios } from "../scenarios/segmented-choice.ts";
import type { InPage } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 3's browser scenarios for `ocelle-segmented-choice` and `ocelle-segment` on the strict-CSP fixture with the
// built browser build (014 spec § The strict-CSP fixture; research.md R-11, T063): every shared body of
// scenarios/segmented-choice.ts marked `fixture`, each on its own segmented-choice.html page, which loads the browser
// build and nothing else; the bodies mount segments with no id or `aria-*` written by the host. Each runs with zero CSP
// violations, no request outside the allowed list, no failed request, no console message or uncaught error (a
// `ResizeObserver` loop error included) and no clipboard call, asserted in the same test as the scenario's outcome.
const built = inject("elementsFixture");
const scenarios = segmentedChoiceScenarios.filter((scenario) => scenario.fixture);
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

describe("ocelle-segmented-choice and ocelle-segment on the strict-CSP fixture with the browser build (US3)", { timeout: 60_000 }, () => {
  it("runs the fixture bodies of the segmented-choice scenarios", () => {
    expect(scenarios.length).toBeGreaterThan(40);
  });

  // One `it` per body under its full name (`it.each`'s "$name" shortens a long name to 40 characters).
  for (const { name, run, expected } of scenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "segmented-choice.html");
      const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
      const driver = fixtureDriver(page.page, page.log);
      const observed = await run(driver, inPage);
      const clipboard = await driver.clipboardCalls();
      expect({ observed, clipboard, recorded: await page.finish() }).toEqual({ observed: expected, clipboard: [], recorded: clean });
    });
  }
});
