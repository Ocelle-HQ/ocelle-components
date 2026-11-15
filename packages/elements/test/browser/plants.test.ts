import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import type { Driver } from "../scenarios/driver.ts";
import { noticeScenario } from "../scenarios/notice.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Recorded, Served } from "./serve.ts";

// The plant rows and cells that run on the strict-CSP fixture pages (specs/010-feedback-forms contracts/testing.md
// § Plants; analysis U9; T001c), in the row format of test/plants.test.ts: the family, the plant, the body it runs and
// the assertion message the body must fail with; each row runs the body with the plant, which must reject with that
// message, and without it, which must pass. Phase 1's row: the capture-bounds row's fixture-page cell, the looping
// element of fixtures/capture-loop.html with its plain script capture-loop.js. Phase 2's row (T016): the "first load,
// announces on first load" row's US1-10 cell under `startDocument`, on fixtures/first-load-plants.html, which loads
// only the plant bundle ocelle-plants.js (global-setup.ts, plants-entry.ts); unplanted, the same body on
// fixtures/first-load.html with the browser build. The "empty-state start" row (T025a, phase 2 stop 2): the cells that
// change a first-loaded notice in the first task after the load, US1-11 text and US1-13 one task, with the plant whose
// wait ignores the empty state's start, on the same two pages.
interface Row {
  readonly family: string;
  readonly plant: string;
  readonly body: string;
  readonly message: RegExp;
  readonly planted: () => Promise<unknown>;
  readonly unplanted: () => Promise<unknown>;
}

const built = inject("elementsFixture");
let served: Served | undefined;
let browser: Browser | undefined;
const recorded: Recorded[] = [];

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

/** Runs `body` on a fresh capture-loop.html page and keeps what its recorders saw. */
async function onPage(body: (driver: Driver) => Promise<unknown>): Promise<unknown> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await visit(browser, served.origin, "capture-loop.html", ["capture-loop.js"]);
  try {
    return await body(fixtureDriver(page.page, page.log, false, served));
  } finally {
    await page.page.evaluate(() => document.getElementById("loop")?.remove()).catch(() => undefined);
    recorded.push(await page.finish());
  }
}

/** Runs the notice body `name` with `tag` on a fresh page `file` (allowed `scripts`), and keeps what its recorders saw. */
async function onNoticePage(file: string, scripts: readonly string[], name: string, tag: string): Promise<unknown> {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  const page = await visit(browser, served.origin, file, [file, ...scripts]);
  try {
    await noticeScenario(name).run(fixtureDriver(page.page, page.log, false, served), tag);
    return "passed";
  } finally {
    recorded.push(await page.finish());
  }
}

/** The capture-bounds body: a capture over the container while `markup` is in it. */
async function bounds(driver: Driver, markup: string): Promise<unknown> {
  await driver.mount('<main id="c"></main>');
  await driver.liveCapture.start("c");
  await driver.insert("c", markup, "innerHTML");
  return driver.liveCapture.stop();
}

const rows: readonly Row[] = [
  {
    family: "first load",
    plant: "announces on first load",
    body: "US1-10 first load only (startDocument)",
    message: /^US1-10 first load only: announcements/,
    planted: () => onNoticePage("first-load-plants.html", ["first-load.js", "ocelle-plants.js"], "US1-10 first load only", "ocelle-plant-never-first-load"),
    unplanted: () => onNoticePage("first-load.html", ["first-load.js", "live-regions.js", "ocelle-elements.js"], "US1-10 first load only", "ocelle-notice"),
  },
  ...(["US1-11 text", "US1-13 one task"] as const).map(
    (cell): Row => ({
      family: "empty-state start",
      plant: "the wait ignores the empty state's start",
      body: `${cell} (startDocument)`,
      message: new RegExp(`^${cell}: (announcements|the write after the first render)`),
      planted: () => onNoticePage("first-load-plants.html", ["first-load.js", "ocelle-plants.js"], cell, "ocelle-plant-ignores-empty-start"),
      unplanted: () => onNoticePage("first-load.html", ["first-load.js", "live-regions.js", "ocelle-elements.js"], cell, "ocelle-notice"),
    }),
  ),
  {
    family: "capture bounds",
    plant: "an element that mutates its own attribute in a loop",
    body: "a capture over the container (fixture page)",
    message: /^capture exceeded /,
    planted: () => onPage((driver) => bounds(driver, '<ocelle-test-loop id="loop"></ocelle-test-loop>')),
    unplanted: () => onPage((driver) => bounds(driver, '<div id="plain" aria-live="polite"></div>')),
  },
];

describe("plants (elements-browser project)", { timeout: 60_000 }, () => {
  it.each(rows)("$family: $plant turns $body red", async ({ planted, unplanted, message }) => {
    recorded.length = 0;
    await expect(planted()).rejects.toThrow(message);
    await expect(unplanted()).resolves.not.toEqual([]);
    expect(recorded).toEqual([clean, clean]);
  });
});
