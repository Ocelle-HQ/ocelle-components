import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import "../src/ocelle-pill-tag.ts";
import { inProcessDriver } from "./in-process.ts";
import { severe } from "./scenarios/button.ts";
import { pillInteractiveScenarios, pillInteractiveSinkScenarios } from "./scenarios/pill-tag-interactive.ts";

// User Story 4's browser scenarios, the interactive `ocelle-pill-tag`, in process on the element source (018
// contracts/checks.md § Scenarios, § US4 bodies; tasks.md T047): the shared bodies of scenarios/pill-tag-interactive.ts
// on the in-process driver, which Stryker mutates, light and dark, forced colours as each body sets them, and axe on
// each body's page (no serious or critical result), asserted in the same test as the body's outcome; and the link-mode
// activation bodies on the navigation sink (`pillInteractiveSinkScenarios`), which run here only. Every body starts at
// a 1280 × 800 viewport, with no forced colours and no reduced motion (reset after each body; in-process tests share
// one page). The same shared bodies run on the built browser build on the strict-CSP fixture in
// test/browser/pill-tag-interactive.test.ts, with the link bodies on real navigation there.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-pill-tag, interactive, in process (US4)", { timeout: 120_000 }, () => {
  it.each([...pillInteractiveScenarios, ...pillInteractiveSinkScenarios])("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect({ observed, axe: await severe(driver) }).toEqual({ observed: expected, axe: [] });
  });
});
