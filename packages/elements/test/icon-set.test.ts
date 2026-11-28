import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { iconSetScenarios } from "./scenarios/icon-set.ts";

// User Story 2's browser scenarios, the icon set, in process on the element source (005 research.md R-11, T033): the
// shared bodies of scenarios/icon-set.ts on the in-process driver; the same bodies run on the built browser build on
// the strict-CSP fixture in test/browser/icon-set.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-icon's eighteen-name set, in process (US2)", () => {
  it.each(iconSetScenarios)("$name", { timeout: 60_000 }, async ({ run, expected }) => {
    const observed = await run(driver);
    expect(observed, "settled drawing and interaction").toEqual(expected);
  });
});
