import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-status-indicator.ts";
import { inProcessDriver } from "./in-process.ts";
import { severe } from "./scenarios/button.ts";
import { statusIndicatorScenarios } from "./scenarios/status-indicator.ts";

// User Story 1's browser scenarios, `ocelle-status-indicator`, in process on the element source (018 contracts/checks.md
// § Scenarios, § US1 bodies; tasks.md T013): the shared bodies of scenarios/status-indicator.ts on the in-process
// driver, which Stryker mutates, light and dark, forced colours, reduced motion and right to left as each body sets
// them, and axe on each body's page (no serious or critical result), asserted in the same test as the body's outcome.
// Every body starts at a 1280 × 800 viewport, without forced colours or reduced motion (both reset after each body;
// in-process tests share one page). The same bodies run on the built browser build on the strict-CSP fixture in
// test/browser/status-indicator.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-status-indicator, in process (US1)", { timeout: 60_000 }, () => {
  it.each(statusIndicatorScenarios)("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect({ observed, axe: await severe(driver) }).toEqual({ observed: expected, axe: [] });
  });
});
