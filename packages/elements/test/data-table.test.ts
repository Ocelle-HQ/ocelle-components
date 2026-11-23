import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-data-table.ts";
import { inProcessDriver } from "./in-process.ts";
import { dataTableScenarios } from "./scenarios/data-table.ts";

// `ocelle-data-table`, in process on the element source (019 US1; contracts/checks.md § Harnesses; tasks.md T010): the
// shared bodies of scenarios/data-table.ts (T006 to T009, T080) on the in-process driver, so Stryker's mutants of
// src/ocelle-data-table.ts and src/overflow-region.ts are killed by real keys, pointers and layout. The same bodies run
// on the strict-CSP fixture with the browser build in test/browser/data-table.test.ts.
//
// The no-`ResizeObserver`-loop check (research.md R-07, PLAN-FRESH-3-001, PLAN-FRESH-3-002): the bodies marked `loop`
// (a block host on first load whose caption rewraps between the fallback and the measured cap, the 400 → 600 px
// narrow-column resize, a `hidden` host shown, both edits of the end-fade body, the shrink-to-fit bodies, the one-long-
// word body with its rounding precondition first, the caption grown at run time (review R1-01) and the sticky caption
// body) also assert that neither a window `error` event (captured) nor a `console.error` call carried "ResizeObserver
// loop" while they ran, beside their own layout outcome; the recorder itself is shown to see a synthetic `ErrorEvent`
// with that message.
const driver = inProcessDriver();
const loopErrors: string[] = [];
const loop = "ResizeObserver loop";

window.addEventListener(
  "error",
  (event) => {
    if (event.message.includes(loop)) loopErrors.push(event.message);
  },
  true,
);
const consoleError = console.error.bind(console);
console.error = (...values: unknown[]): void => {
  const text = values.map(String).join(" ");
  if (text.includes(loop)) loopErrors.push(text);
  consoleError(...values);
};

afterEach(async () => {
  await driver.forcedColors("none");
  await driver.theme(null);
  await driver.inputHover(null);
});

describe("ocelle-data-table, in process (US1)", { timeout: 60_000 }, () => {
  it.each(dataTableScenarios)("$name", async ({ run, expected, loop: checked }) => {
    loopErrors.length = 0;
    const observed = await run(driver);
    // The `loop` bodies (the cases R-07 names) assert no loop error beside their outcome; the others assert their outcome.
    expect({ observed, loopErrors: checked === true ? loopErrors : [] }).toEqual({ observed: expected, loopErrors: [] });
  });

  it("the no-loop recorder sees a synthetic ErrorEvent carrying the ResizeObserver loop message", () => {
    loopErrors.length = 0;
    window.dispatchEvent(new ErrorEvent("error", { message: "ResizeObserver loop completed with undelivered notifications." }));
    expect(loopErrors.some((each) => each.includes("ResizeObserver loop completed with undelivered notifications."))).toBe(true);
  });
});
