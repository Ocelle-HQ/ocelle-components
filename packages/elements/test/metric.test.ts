import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-metric.ts";
import { inProcessDriver } from "./in-process.ts";
import { severe } from "./scenarios/button.ts";
import { metricScenarios } from "./scenarios/metric.ts";

// User Story 2's browser scenarios, `ocelle-metric`, in process on the element source (018 contracts/checks.md
// § Scenarios, § US2 bodies; tasks.md T025): the shared bodies of scenarios/metric.ts on the in-process driver, which
// Stryker mutates, light and dark, forced colours and right to left as each body sets them, and axe on each body's page
// (no serious or critical result), asserted in the same test as the body's outcome. Every body starts at a 1280 × 800
// viewport, without forced colours (reset after each body; in-process tests share one page). The same bodies run on
// the built browser build on the strict-CSP fixture in test/browser/metric.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-metric, in process (US2)", { timeout: 60_000 }, () => {
  it.each(metricScenarios)("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect({ observed, axe: await severe(driver) }).toEqual({ observed: expected, axe: [] });
  });
});
