import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-scroller.ts";
import "./fixtures/shadow-controls.ts";
import { inProcessDriver } from "./in-process.ts";
import { scrollerGuards, scrollerScenarios } from "./scenarios/scroller.ts";

// User Story 1's browser scenarios for `ocelle-scroller` and the overflow-region module, in process on the element
// source (009 research.md R-17, T014): the shared bodies of scenarios/scroller.ts on the in-process driver, so
// Stryker's mutants of src/overflow-region.ts and src/ocelle-scroller.ts are killed by real keys, clicks, wheels and
// layout. The same bodies run on the built browser build on the strict-CSP fixture in test/browser/scroller.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
  await driver.reducedMotion("no-preference");
});

describe("ocelle-scroller, in process (US1)", { timeout: 60_000 }, () => {
  it.each([...scrollerScenarios, ...scrollerGuards])("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
