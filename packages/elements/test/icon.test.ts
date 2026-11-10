import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { iconScenarios } from "./scenarios/icon.ts";

// User Story 1's browser scenarios for `ocelle-icon`, in process on the element source (005 research.md R-11, T014):
// the shared bodies of scenarios/icon.ts on the in-process driver; the same bodies run on the built browser build on
// the strict-CSP fixture in test/browser/icon.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-icon, in process (US1)", () => {
  it.each(iconScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
