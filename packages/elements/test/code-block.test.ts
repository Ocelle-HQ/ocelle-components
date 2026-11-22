import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-code-block.ts";
import { inProcessDriver } from "./in-process.ts";
import { codeBlockLifecycle, codeBlockLifecycleExpected, codeBlockRuleScenarios, codeBlockScenarios } from "./scenarios/code-block.ts";

// User Story 2's browser scenarios for `ocelle-code-block`, in process on the element source (020 contracts/checks.md
// § Scenario bodies; tasks.md T026): every shared body of scenarios/code-block.ts, the US2 scenarios and the FR and
// edge-case bodies, on the in-process driver; the same bodies run on the built browser build on the strict-CSP
// fixture in test/browser/code-block.test.ts. Forced colours, reduced motion and the viewport are reset after each
// test (in-process tests share one page).
const driver = inProcessDriver();

afterEach(async () => {
  await commands.emulateForcedColors("none");
  await commands.emulateReducedMotion("no-preference");
  await driver.viewport(1280, 800);
});

describe("ocelle-code-block, in process (US2)", { timeout: 60_000 }, () => {
  it.each(codeBlockScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("ocelle-code-block's rules and edge cases, in process (FR-020 to FR-029)", { timeout: 60_000 }, () => {
  it.each(codeBlockRuleScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });

  it("FR-020 reconnect: refreshes the detached edit and resumes observing connected edits", async () => {
    await driver.mount("");
    expect(await codeBlockLifecycle()).toEqual(codeBlockLifecycleExpected);
  });
});
