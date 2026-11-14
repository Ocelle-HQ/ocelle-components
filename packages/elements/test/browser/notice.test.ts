import type { Browser } from "playwright";
import { afterAll, assert, beforeAll, describe, inject, it } from "vitest";
import { matrixScenarios } from "../scenarios/notice-matrix.ts";
import { noticeScenarios } from "../scenarios/notice.ts";
import type { NoticeScenario } from "../scenarios/notice.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Recorded, Served } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-notice` on the strict-CSP fixture with the built browser build
// (specs/010-feedback-forms T013; spec § Fixture pages): every shared body of scenarios/notice.ts and the SC-002 matrix
// of scenarios/notice-matrix.ts on its own page, fixtures/first-load.html (the browser build, the test-only elements of
// live-regions.js and the parser-blocking first-load.js, which writes nothing unless a body's `firstLoad` gives it
// markup), at Chromium's figures and the shipped hold. The first-load cells run under `startDocument` through
// `firstLoad`, the `"interactive"` cell of US1-8 through `insertInteractive` on fixtures/interactive.html. Every test
// also asserts zero CSP violations, only allowed requests, no failed request and no console message on the page.
const built = inject("elementsFixture");
const scripts = ["first-load.html", "first-load.js", "live-regions.js", "ocelle-elements.js", "interactive.html", "interactive.js"];
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

async function onPage({ run }: NoticeScenario): Promise<void> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await visit(browser, served.origin, "first-load.html", scripts);
  let recorded: Recorded | undefined;
  try {
    await run(fixtureDriver(page.page, page.log, false, served), "ocelle-notice");
  } finally {
    recorded = await page.finish();
  }
  assert.deepEqual(recorded, clean, "the page's recorders");
}

describe("ocelle-notice on the strict-CSP fixture with the browser build (US1)", { timeout: 60_000 }, () => {
  it.each(noticeScenarios)("$name", async (scenario) => {
    assert.isUndefined(await onPage(scenario));
  });
});

describe("ocelle-notice, the SC-002 matrix on the strict-CSP fixture", { timeout: 60_000 }, () => {
  it.each(matrixScenarios)("$name", async (scenario) => {
    assert.isUndefined(await onPage(scenario));
  });
});
