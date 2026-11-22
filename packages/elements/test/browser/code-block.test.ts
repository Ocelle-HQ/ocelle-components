import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { codeBlockLifecycle, codeBlockLifecycleExpected, codeBlockRuleScenarios, codeBlockScenarios } from "../scenarios/code-block.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 2's browser scenarios for `ocelle-code-block` on the strict-CSP fixture with the built browser build
// (020 contracts/checks.md § Scenario bodies; tasks.md T026): every shared body of scenarios/code-block.ts on its own
// `code-block.html` page, which loads the browser build (it defines every element, `ocelle-code-block` among them);
// each test asserts zero CSP violations, no request outside the allowed list, no failed request and no console message
// or uncaught error on the page, beside the scenario's outcome.
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

describe("ocelle-code-block on the strict-CSP fixture with the browser build (US2)", { timeout: 120_000 }, () => {
  it.each([...codeBlockScenarios, ...codeBlockRuleScenarios])("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "code-block.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });

  it("FR-020 reconnect: refreshes the detached edit and resumes observing connected edits under the strict CSP", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "code-block.html");
    const observed = await page.page.evaluate(codeBlockLifecycle);
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: codeBlockLifecycleExpected, recorded: clean });
  });
});
