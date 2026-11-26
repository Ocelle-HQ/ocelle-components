import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { evidenceChainScenarios } from "../scenarios/evidence-chain.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// `ocelle-evidence-chain` and `ocelle-evidence-step` on the strict-CSP fixture with the browser build and
// `@ocelle/styles`' base.css (019 US3, the Independent Test; contracts/checks.md § Harnesses; tasks.md T057): every
// shared body of scenarios/evidence-chain.ts on evidence-chain.html, with zero CSP violations, no request outside the
// allowed list, no failed request and no console message or uncaught error (the bodies' in-page reads run as the
// same-origin `/module.js`, the one request beside the page's own), asserted in the same test as the body's outcome.
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

describe("ocelle-evidence-chain and ocelle-evidence-step on the strict-CSP fixture with the browser build (US3)", { timeout: 120_000 }, () => {
  it.each(evidenceChainScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "evidence-chain.html", ["ocelle-elements.js", "module.js"]);
    const observed = await run(fixtureDriver(page.page, page.log, true));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
