import type { Browser } from "playwright";
import { afterAll, assert, beforeAll, describe, expect, inject, it } from "vitest";
import type { FormScenario } from "../scenarios/form-input.ts";
import { formSelectScenarios } from "../scenarios/form-select.ts";
import { selectRestorePage, selectRestoreScenario, selectTwinScenarios } from "../scenarios/form-twins.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Recorded, Served } from "./serve.ts";

// User Story 3's browser scenarios for `ocelle-form-select` on the strict-CSP fixture with the built browser build
// (specs/010-feedback-forms T051; spec § Fixture pages): every shared body of scenarios/form-select.ts (with User Story
// 2's bodies that US3 scenario 7 reuses) and the select's native twins of scenarios/form-twins.ts on its own page,
// fixtures/first-load.html, at Chromium's figures; the first-load cells run under `startDocument` through `firstLoad`,
// and the submissions go to the fixture server's recorder. The history-restore row runs on
// fixtures/form-select-restore.html served with `Cache-Control: no-store`. Every test also asserts zero CSP
// violations, only allowed requests, no failed request and no console message on the page.
const built = inject("elementsFixture");
const scripts = ["first-load.html", "first-load.js", "live-regions.js", "ocelle-elements.js", "submit"];
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

async function onPage({ run }: FormScenario): Promise<void> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await visit(browser, served.origin, "first-load.html", scripts);
  let recorded: Recorded | undefined;
  try {
    await run(fixtureDriver(page.page, page.log, false, served), "ocelle-form-select");
  } finally {
    recorded = await page.finish();
  }
  assert.deepEqual(recorded, clean, "the page's recorders");
}

describe("ocelle-form-select on the strict-CSP fixture with the browser build (US3)", { timeout: 60_000 }, () => {
  it.each(formSelectScenarios)("$name", async (scenario) => {
    await expect(onPage(scenario)).resolves.toBeUndefined();
  });
});

describe("ocelle-form-select, the native twins on the strict-CSP fixture (SC-003, US3-5, US3-6)", { timeout: 60_000 }, () => {
  it.each(selectTwinScenarios)("$name", async (scenario) => {
    await expect(onPage(scenario)).resolves.toBeUndefined();
  });

  it(selectRestoreScenario.name, async () => {
    if (browser === undefined || served === undefined) throw new Error("the suite did not start");
    const page = await visit(browser, served.origin, selectRestorePage, ["ocelle-elements.js", "submit", "about:blank"]);
    let recorded: Recorded | undefined;
    try {
      await expect(selectRestoreScenario.run(fixtureDriver(page.page, page.log, false, served))).resolves.toBeUndefined();
    } finally {
      recorded = await page.finish();
    }
    assert.deepEqual(recorded, clean, "the page's recorders");
  });
});
