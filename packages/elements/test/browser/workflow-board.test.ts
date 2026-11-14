import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { boardScenarios } from "../scenarios/board.ts";
import { laneScenarios } from "../scenarios/lane.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 2's browser scenarios for `ocelle-workflow-board` and `ocelle-workflow-lane` on the strict-CSP fixture
// with the built browser build (009 spec § The strict-CSP fixture, US2 scenario 13, FR-031; research.md R-17; T033):
// every shared body of scenarios/board.ts and scenarios/lane.ts on its own page, `board.html` or, for the bodies with
// base.css, `board-base.html`. Both pages link `tokens.css` and `frames.css` and load only the browser build. Every test
// asserts zero CSP violations, no request outside the allowed list, no failed request and no console message or
// uncaught error, beside the scenario's outcome.
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

describe("ocelle-workflow-board and ocelle-workflow-lane on the strict-CSP fixture with the browser build (US2)", { timeout: 120_000 }, () => {
  it.each([...boardScenarios, ...laneScenarios])("$name", async ({ run, expected, base }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, base ? "board-base.html" : "board.html");
    const observed = await run(fixtureDriver(page.page, page.log, base));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
