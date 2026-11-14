import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-facts.ts";
import { inProcessDriver } from "./in-process.ts";
import { factsScenarios, flips, flipsExpected } from "./scenarios/facts.ts";

// User Story 1's browser scenarios, `ocelle-facts` and `ocelle-fact`, in process on the element source (013
// contracts/checks.md § Scenario bodies; tasks.md T006, T006a): the shared bodies of scenarios/facts.ts on the
// in-process driver, which Stryker mutates; the bodies with `base` run with base.css adopted. Every body starts at a
// 1280 × 800 viewport. The same bodies run on the built browser build on the strict-CSP fixture in
// test/browser/facts.test.ts. Then the no-loop-error test, which only this harness can run: the loop error is a
// `window` `error` event with no error object, which Playwright's `console` and `pageerror` events do not record
// (reviews/phase-1/spike.md §§ 3 and 9).
const driver = inProcessDriver();

beforeEach(async () => {
  await driver.viewport(1280, 800);
});

afterEach(async () => {
  await commands.emulateForcedColors("none");
});

describe("ocelle-facts and ocelle-fact, in process (US1)", () => {
  it.each(factsScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

describe("no ResizeObserver loop error (013 R-02, operator decision \"(a) Defer + 2-frame wait\"; T006a)", () => {
  it("the flips (a block 600 → 300 → 600 px, the round 3 dialog widened 360 → 1200 px, the hook 15rem → 40rem → 15rem at 450 px, a grid sheet 300 → 600 → 800 px) each happen and raise no ResizeObserver loop error in a window error event or a console.error call, which the recorder sees when the test dispatches one", async () => {
    const recorded: string[] = [];
    const onError = (event: ErrorEvent): void => {
      recorded.push(`error: ${event.message}`);
    };
    const original = console.error;
    console.error = (...args: unknown[]): void => {
      recorded.push(`console.error: ${args.map(String).join(" ")}`);
      original(...args);
    };
    window.addEventListener("error", onError, true);
    try {
      window.dispatchEvent(new ErrorEvent("error", { message: "ResizeObserver loop (synthetic, dispatched by the test)" }));
      const observed = await flips(driver);
      await driver.layout("s");
      expect({
        observed,
        synthetic: recorded.some((each) => each.includes("ResizeObserver loop (synthetic")),
        loopErrors: recorded.filter((each) => each.includes("ResizeObserver loop") && !each.includes("synthetic")),
      }).toEqual({ observed: flipsExpected, synthetic: true, loopErrors: [] });
    } finally {
      window.removeEventListener("error", onError, true);
      console.error = original;
    }
  });
});
