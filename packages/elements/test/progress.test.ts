import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-progress.ts";
import { inProcessDriver } from "./in-process.ts";
import { progressScenarios } from "./scenarios/progress.ts";

// User Story 3's browser scenarios, `ocelle-progress`, in process on the element source (013 contracts/checks.md
// § Scenario bodies; tasks.md T040): the shared bodies of scenarios/progress.ts on the in-process driver, which Stryker
// mutates. Every body starts at a 1280 × 800 viewport, without forced colours or reduced motion (both reset after each
// body, contracts/checks.md § Driver additions), and its mount starts a fresh loading episode. The bodies that wait for
// the 4.2 s sweep window take up to about 6 s. The same bodies run on the built browser build on the strict-CSP fixture
// in test/browser/progress.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("ocelle-progress, in process (US3)", { timeout: 30_000 }, () => {
  it.each(progressScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
