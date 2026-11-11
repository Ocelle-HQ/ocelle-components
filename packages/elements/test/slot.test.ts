import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import "./fixtures/test-host.ts";
import { inProcessDriver } from "./in-process.ts";
import { slotScenarios } from "./scenarios/slot.ts";

// User Story 3's browser scenarios, the slot convention, in process on the element source (005 research.md R-11,
// T044): the shared bodies of scenarios/slot.ts on the in-process driver, with `ocelle-test-host` imported from
// source (test/fixtures/test-host.ts), so `iconSlotStyles` is the source Stryker mutates; each body runs without and
// with base.css. The same bodies run on the built browser build and the test host's bundle on the strict-CSP fixture
// in test/browser/slot.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("the slot convention on ocelle-test-host, in process (US3)", () => {
  it.each(slotScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
