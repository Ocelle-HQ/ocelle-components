import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-brand-mark.ts";
import { inProcessDriver } from "./in-process.ts";
import { brandMarkScenarios } from "./scenarios/brand-mark.ts";

// User Story 4's browser scenarios for `ocelle-brand-mark`, in process on the element source (005 research.md R-11,
// T052): the shared bodies of scenarios/brand-mark.ts on the in-process driver; the same bodies run on the built
// browser build on the strict-CSP fixture in test/browser/brand-mark.test.ts.
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-brand-mark, in process (US4)", () => {
  it.each(brandMarkScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
