import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-button.ts";
import "../src/ocelle-dialog.ts";
import "../src/ocelle-disclosure.ts";
import { inProcessDriver } from "./in-process.ts";
import { disclosureRuleScenarios, disclosureScenarios } from "./scenarios/disclosure.ts";

// User Story 1's browser scenarios for `ocelle-disclosure`, in process on the element source (020 contracts/checks.md
// § Scenario bodies; tasks.md T006): every shared body of scenarios/disclosure.ts, the US1 scenarios and the FR and
// edge-case bodies, on the in-process driver; the same bodies run on the built browser build on the strict-CSP
// fixture in test/browser/disclosure.test.ts. `ocelle-button` is imported for US1-19's panel control; the disclosure
// module defines `ocelle-icon` for its chevron. Forced colours, reduced motion and the viewport are reset after each
// test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
  await driver.viewport(1280, 800);
});

describe("ocelle-disclosure, in process (US1)", { timeout: 60_000 }, () => {
  it.each(disclosureScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("ocelle-disclosure's rules and edge cases, in process (FR-003 to FR-014)", { timeout: 60_000 }, () => {
  it.each(disclosureRuleScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});
