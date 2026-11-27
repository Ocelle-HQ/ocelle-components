import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import "../src/ocelle-pill-tag.ts";
import { inProcessDriver } from "./in-process.ts";
import { severe } from "./scenarios/button.ts";
import { pillTruncationScenarios } from "./scenarios/pill-tag-truncation.ts";

// User Story 5's browser scenarios, truncation and the full-text tooltip of the interactive `ocelle-pill-tag`, in process
// on the element source (018 contracts/checks.md § Scenarios, § US5 bodies, the tooltip half of § US4-10; tasks.md
// T057): the shared bodies of scenarios/pill-tag-truncation.ts on the in-process driver, which Stryker mutates, with
// axe on each body's page (no serious or critical result), asserted in the same test as the body's outcome. Every mount
// adopts the 300 ms test delay of fixtures/tooltip-delay.css (test/in-process.ts). Every body starts at a 1280 × 800
// viewport, with no forced colours and no reduced motion (reset after each body; in-process tests share one page). The
// same shared bodies run on the built browser build on the strict-CSP fixture in
// test/browser/pill-tag-truncation.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-pill-tag, truncation and the full-text tooltip, in process (US5)", { timeout: 120_000 }, () => {
  it.each(pillTruncationScenarios)("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect({ observed, axe: await severe(driver) }).toEqual({ observed: expected, axe: [] });
  });
});
