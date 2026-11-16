import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../fixtures/test-host.ts";
import { inProcessDriver } from "../in-process.ts";
import { axScenarios } from "../scenarios/harness.ts";

// The accessibility states, aria-current and reduced motion of the driver (012 research.md R-11, tasks.md T004) in
// process: axState reads Chromium's accessibility node over CDP (the axState command), current reads the DOM (CDP never
// reports aria-current); the same bodies run on the strict-CSP fixture in test/browser/harness.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("axState, current and reducedMotion, in process", () => {
  it.each(axScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
