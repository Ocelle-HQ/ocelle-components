import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-card.ts";
import "../src/ocelle-section-header.ts";
import { inProcessDriver } from "./in-process.ts";
import { sectionHeaderScenarios } from "./scenarios/section-header.ts";

// 011 User Story 1's section-header scenarios, in process on the element source (research.md R-13, T013): the shared
// bodies of scenarios/section-header.ts on the in-process driver at the spec's 1280 × 800 px viewport; the same
// bodies run on the built browser build on the strict-CSP fixture in test/browser/section-header.test.ts. The card is
// imported too, for the eyebrow-variant header in a compact card's header slot (US1-5) and the 320 px card (US1-14).
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-section-header, in process (011 US1)", () => {
  it.each(sectionHeaderScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
