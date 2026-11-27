import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { defineStandIns, harnessScenarios } from "../scenarios/harness.ts";
import { animationScenarios, defineStatusStandIns, layoutScenarios, overflowScenarios, seekScenarios } from "../scenarios/harness-status.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Recorded, Served } from "./serve.ts";

// The harness self-tests of 008 on the strict-CSP fixture (research.md R-14; tasks.md T002): every shared body of
// scenarios/harness.ts on its own page of the fixture's default context (a mouse device at 1280 × 800), with the
// stand-in elements defined in the page through the DevTools protocol, which the page's policy does not govern. Every
// test asserts the recorders beside the body's outcome: clean, except that each inline `<style>` a body adds
// (`inlineStyles`) is blocked by the policy and reported once as a `style-src-elem` violation and once on the console.
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

/** What the recorders see on a page where a body added `count` inline `<style>` elements. */
function blocked(count: number): Recorded {
  return {
    ...clean,
    violations: Array.from({ length: count }, () => ({ directive: "style-src-elem", blocked: "inline" })),
    console: Array.from({ length: count }, () => expect.stringContaining("violates the following Content Security Policy directive 'style-src 'self''") as unknown as string),
  };
}

describe("the harness self-tests on the strict-CSP fixture (R-14)", { timeout: 60_000 }, () => {
  it.each(harnessScenarios)("$name", async ({ run, expected, inlineStyles = 0 }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "icon.html");
    await page.page.evaluate(defineStandIns);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: blocked(inlineStyles) });
  });
});

// The harness self-tests of 018 on the strict-CSP fixture (research.md R-11; contracts/checks.md § Test harness rows 1,
// 2, 7 and 8; tasks.md T003, T004, T007): every shared body of scenarios/harness-status.ts on its own page, with its
// stand-in elements defined in the page through the DevTools protocol. Their styles are adopted sheets, so the
// recorders stay clean.
describe("the 018 harness self-tests on the strict-CSP fixture", { timeout: 60_000 }, () => {
  it.each([...animationScenarios, ...seekScenarios, ...overflowScenarios, ...layoutScenarios])("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "icon.html");
    await page.page.evaluate(defineStatusStandIns);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
