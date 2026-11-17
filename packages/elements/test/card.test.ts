import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-card.ts";
import "../src/ocelle-section-header.ts";
import { inProcessDriver } from "./in-process.ts";
import { cardScenarios } from "./scenarios/card.ts";

// 011 User Story 1's card scenarios, in process on the element source (research.md R-13, T013): the shared bodies of
// scenarios/card.ts on the in-process driver at the spec's 1280 × 800 px viewport; the same bodies run on the built
// browser build on the strict-CSP fixture in test/browser/card.test.ts. The section header is imported too: the card
// scenarios slot one in the header slot.
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-card, in process (011 US1)", () => {
  it.each(cardScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
