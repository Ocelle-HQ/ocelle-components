import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-button.ts";
import "../src/ocelle-icon.ts";
import { inProcessDriver } from "./in-process.ts";
import { buttonScenarios } from "./scenarios/button.ts";

// User Story 1's browser scenarios for `ocelle-button` in button mode, in process on the element source (012
// research.md R-11; tasks.md T018): the shared bodies of scenarios/button.ts on the in-process driver, light and dark,
// forced colours and right to left as each body sets them, with axe on each body's page; the same bodies run on the
// built browser build on the strict-CSP fixture in test/browser/button.test.ts. `ocelle-icon` is imported for the
// bodies that slot one. Forced colours and reduced motion are reset after each test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-button, in process (US1)", { timeout: 60_000 }, () => {
  it.each(buttonScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
