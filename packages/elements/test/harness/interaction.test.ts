import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../fixtures/test-host.ts";
import { inProcessDriver } from "../in-process.ts";
import { interactionScenarios } from "../scenarios/harness-scenarios.ts";

// The interaction methods of the driver (012 research.md R-11, tasks.md T001) in process: the shared bodies of
// scenarios/harness-scenarios.ts on plain pages, a native button and link, and on `ocelle-test-host` where a method takes `inner`.
// The same bodies run on the strict-CSP fixture in test/browser/harness-scenarios.test.ts. Forced colours and reduced motion are
// each ended after each test (operator decision A1, 2026-11-16), so no emulation leaks into the next test of this page.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
});

describe("focus, press, click, hover, pointer, tabOrder, activeInner and computed with inner, in process", () => {
  it.each(interactionScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
