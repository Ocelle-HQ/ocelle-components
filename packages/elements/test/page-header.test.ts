import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-page-header.ts";
import { inProcessDriver } from "./in-process.ts";
import { pageHeaderScenarios } from "./scenarios/page-header.ts";

// 011 User Story 2's page-header scenarios, in process on the element source (research.md R-13, T027): the shared
// bodies of scenarios/page-header.ts on the in-process driver at the spec's 1280 × 800 px viewport; the same bodies run
// on the built browser build on the strict-CSP fixture in test/browser/page-header.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-page-header, in process (011 US2)", () => {
  it.each(pageHeaderScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
