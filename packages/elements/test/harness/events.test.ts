import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../fixtures/test-host.ts";
import { inProcessDriver } from "../in-process.ts";
import { eventScenarios } from "../scenarios/harness.ts";

// The event recorder of the driver (012 research.md R-11, tasks.md T002) in process: records at the element, its
// ancestors, document and window, a serial per dispatch and preventNext; the same bodies run on the strict-CSP fixture
// in test/browser/harness.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("the event recorder, in process", () => {
  it.each(eventScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
