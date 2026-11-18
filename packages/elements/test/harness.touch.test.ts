import { describe, expect, it } from "vitest";
import { inProcessDriver } from "./in-process.ts";
import { defineStandIns, touchScenarios } from "./scenarios/harness.ts";

// The harness self-tests of 008's touch context in process (research.md R-14; tasks.md T002): the touch bodies of
// scenarios/harness.ts on the in-process driver, in the `elements-touch` project (browser mode with `hasTouch`), with
// the stand-in elements defined in this file's page. The same bodies run on the fixture's touch context in
// test/browser/harness.touch.test.ts.
defineStandIns();
const driver = inProcessDriver();

describe("the harness self-tests of the touch context, in process (R-14)", () => {
  it.each(touchScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
