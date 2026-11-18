import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { overflowBlockGuards, overflowBlockScenarios } from "../scenarios/overflow-block.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// The overflow-region module's block-axis option on the strict-CSP fixture (019 FR-018; contracts/overflow-region-block-axis.md
// § Tests; tasks.md T079): every shared body of scenarios/overflow-block.ts on overflow-block.html, which loads the
// block host's bundled file (test/fixtures/overflow-host-block.ts, built by global-setup.ts with its own copy of Lit),
// with zero CSP violations, no request outside the allowed list, no failed request and no console message, asserted in
// the same test as the body's outcome.
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

describe("the block-axis option on the strict-CSP fixture (FR-018)", { timeout: 120_000 }, () => {
  it.each([...overflowBlockScenarios, ...overflowBlockGuards])("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "overflow-block.html", ["ocelle-test-overflow-block.js", "module.js"]);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
