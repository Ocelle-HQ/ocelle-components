import { describe, expect, it } from "vitest";
import { inProcessDriver } from "../in-process.ts";
import { defineStatusStandIns, overflowScenarios } from "../scenarios/harness-status.ts";

// The fractional overflow measure of 018 in process (research.md R-09, R-11; contracts/checks.md § Test harness row 8;
// tasks.md T004): the shared bodies of scenarios/harness-status.ts on the in-process driver, with the stand-in elements
// defined in this file's page. The same bodies run on the strict-CSP fixture in test/browser/harness.test.ts.
defineStatusStandIns();
const driver = inProcessDriver();

describe("overflows, in process (018 § Test harness row 8)", () => {
  it.each(overflowScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
