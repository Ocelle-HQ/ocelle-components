import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import { inProcessDriver } from "./in-process.ts";
import { defineStandIns, harnessScenarios } from "./scenarios/harness.ts";

// The harness self-tests of 008 in process (research.md R-14; tasks.md T002): the shared bodies of
// scenarios/harness.ts on the in-process driver, in the `elements` project (a mouse device at 1280 × 800), with the
// stand-in elements defined in this file's page. The same bodies run on the strict-CSP fixture in
// test/browser/harness.test.ts; the touch rows run in test/harness.touch.test.ts.
defineStandIns();
const driver = inProcessDriver();

// The reset helper ends forced colours and reduced motion together (test/commands.ts `emulate`), so no emulation
// leaks into the next body.
afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("the harness self-tests, in process (R-14)", () => {
  it.each(harnessScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
