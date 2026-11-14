import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { defineDriverHelpers, driverAdditionScenarios } from "./scenarios/driver-additions.ts";

// The driver additions of 013 phase 1 in process (contracts/checks.md § Driver additions; tasks.md T003): the shared
// bodies of scenarios/driver-additions.ts on the in-process driver, with their helper elements defined in this file's
// frame. The same bodies run on the strict-CSP fixture in test/browser/driver.test.ts.
const driver = inProcessDriver();
defineDriverHelpers();

describe("the driver additions, in process (013 T003)", () => {
  it.each(driverAdditionScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
