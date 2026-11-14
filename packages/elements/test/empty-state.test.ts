import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-empty-state.ts";
import { inProcessDriver } from "./in-process.ts";
import { emptyStateScenarios } from "./scenarios/empty-state.ts";

// User Story 2's browser scenarios, `ocelle-empty-state`, in process on the element source (013 contracts/checks.md
// § Scenario bodies; tasks.md T025): the shared bodies of scenarios/empty-state.ts on the in-process driver, which
// Stryker mutates; the bodies with `base` run with base.css adopted. Every body starts at a 1280 × 800 viewport. The
// same bodies run on the built browser build on the strict-CSP fixture in test/browser/empty-state.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-empty-state, in process (US2)", () => {
  it.each(emptyStateScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
