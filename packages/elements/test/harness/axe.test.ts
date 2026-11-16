import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../fixtures/test-host.ts";
import { inProcessDriver } from "../in-process.ts";
import { axeScenarios } from "../scenarios/harness.ts";

// The driver's axe run (012 research.md R-11, tasks.md T005) in process: 006's rule selection, ruleMeta and
// ruleOptions of gates/lib/axe-rules.ts over axe-core's own rules, as gates/bin/axe.ts runs it; the same bodies run on
// the strict-CSP fixture, axe.min.js served same-origin, in test/browser/harness.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("axe, in process", () => {
  it.each(axeScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
