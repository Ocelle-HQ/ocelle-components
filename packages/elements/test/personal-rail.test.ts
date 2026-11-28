/// <reference types="vite/client" />
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-personal-rail.ts";
import "../src/ocelle-button.ts";
import "../src/ocelle-icon.ts";
import railItems from "./browser/fixtures/rail-items.css?raw";
import { inProcessDriver } from "./in-process.ts";
import { personalRailScenarios, initialsRailScenarios } from "./scenarios/personal-rail.ts";

// 011 User Story 4's personal-rail scenarios, in process on the element source (research.md R-13, T042): the shared
// bodies of scenarios/personal-rail.ts on the in-process driver at the spec's 1280 × 800 px viewport, with the
// stand-in item stylesheet the fixture pages link (browser/fixtures/rail-items.css) in the document's head. The same
// bodies run on the built browser build on the strict-CSP fixture in test/browser/personal-rail.test.ts.
const driver = inProcessDriver();

beforeAll(() => {
  const sheet = document.createElement("style");
  sheet.textContent = railItems;
  document.head.append(sheet);
});

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-personal-rail, in process (011 US4)", () => {
  it.each(personalRailScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("Initials in the personal rail in process", { timeout: 60_000 }, () => {
  it.each(initialsRailScenarios)("$name", async ({ run, expected }) => {
    const observed = await run(driver);
    expect(observed, "rail geometry, keyboard focus and initials").toEqual(expected);
  });
});
