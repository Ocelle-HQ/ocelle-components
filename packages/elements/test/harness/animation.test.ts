import { describe, expect, it } from "vitest";
import { inProcessDriver } from "../in-process.ts";
import { animationScenarios, defineStatusStandIns, seekScenarios } from "../scenarios/harness-status.ts";

// The animation record and `seek` of 018 in process (research.md R-11; contracts/checks.md § Test harness rows 1 and 2;
// tasks.md T003): the shared bodies of scenarios/harness-status.ts on the in-process driver, with the stand-in elements
// defined in this file's page. The same bodies run on the strict-CSP fixture in test/browser/harness.test.ts.
defineStatusStandIns();
const driver = inProcessDriver();

describe("animationStates and seek, in process (018 § Test harness rows 1 and 2)", () => {
  it.each([...animationScenarios, ...seekScenarios])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
