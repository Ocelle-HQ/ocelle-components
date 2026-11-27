import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import "../src/ocelle-pill-tag.ts";
import { inProcessDriver } from "./in-process.ts";
import { severe } from "./scenarios/button.ts";
import { pillScenarios, pillSinkScenarios } from "./scenarios/pill-tag.ts";

// User Story 3's browser scenarios, the static `ocelle-pill-tag` and the badge, in process on the element source (018
// contracts/checks.md § Scenarios, § US3 bodies; tasks.md T036): the shared bodies of scenarios/pill-tag.ts on the
// in-process driver, which Stryker mutates, light and dark, forced colours and right to left as each body sets them,
// and axe on each body's page (no serious or critical result), asserted in the same test as the body's outcome. The
// static click inside a link runs here only, on the navigation sink (scenarios/pill-tag.ts `pillSinkScenarios`). Every
// body starts at a 1280 × 800 viewport, without forced colours (reset after each body; in-process tests share one
// page). The same shared bodies run on the built browser build on the strict-CSP fixture in
// test/browser/pill-tag.test.ts. The in-process page loads no font file (test/in-process.ts), so the runner passes
// `fontLoaded: false`: the Baseline bodies assert the icon-only pill's font-independent facts, not its pixel pin
// (operator decisions on phase-4 rounds 2 and 3, O2-01 and O3-01; tasks.md T044a).
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-pill-tag, static, in process (US3)", { timeout: 60_000 }, () => {
  it.each([...pillScenarios({ fontLoaded: false }), ...pillSinkScenarios])("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect({ observed, axe: await severe(driver) }).toEqual({ observed: expected, axe: [] });
  });
});
