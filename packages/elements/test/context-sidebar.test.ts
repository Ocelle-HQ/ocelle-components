import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-context-sidebar.ts";
import "../src/ocelle-section-header.ts";
import { inProcessDriver } from "./in-process.ts";
import { contextSidebarScenarios } from "./scenarios/context-sidebar.ts";

// 011 User Story 3's context-sidebar scenarios, in process on the element source (research.md R-13, T034): the shared
// bodies of scenarios/context-sidebar.ts on the in-process driver at the spec's 1280 × 800 px viewport; the section
// header is defined too, for the sections that are `ocelle-section-header` elements. The same bodies run on the built
// browser build on the strict-CSP fixture in test/browser/context-sidebar.test.ts.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-context-sidebar, in process (011 US3)", () => {
  it.each(contextSidebarScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
