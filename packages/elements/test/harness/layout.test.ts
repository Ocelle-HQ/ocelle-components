import { describe, expect, it } from "vitest";
import { inProcessDriver } from "../in-process.ts";
import { defineStatusStandIns, layoutScenarios } from "../scenarios/harness-status.ts";

// `settleLayout()` of 018 in process (research.md R-11; contracts/checks.md § Test harness row 7; tasks.md T007): the
// shared bodies of scenarios/harness-status.ts on the in-process driver, with the stand-in elements defined in this
// file's page. The same bodies run on the strict-CSP fixture in test/browser/harness.test.ts.
defineStatusStandIns();
const driver = inProcessDriver();

describe("settleLayout, in process (018 § Test harness row 7)", () => {
  it.each(layoutScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
