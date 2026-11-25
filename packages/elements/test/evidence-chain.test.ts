import { afterEach, describe, expect, it } from "vitest";
import "../src/ocelle-evidence-chain.ts";
import { inProcessDriver } from "./in-process.ts";
import { evidenceChainScenarios } from "./scenarios/evidence-chain.ts";

// `ocelle-evidence-chain` and `ocelle-evidence-step`, in process on the element source (019 US3; contracts/checks.md
// § Harnesses; tasks.md T057): the shared bodies of scenarios/evidence-chain.ts (T055, T056) on the in-process driver,
// so Stryker's mutants of src/ocelle-evidence-chain.ts and src/ocelle-evidence-step.ts are killed by the real tree,
// layout and mutations. The same bodies run on the strict-CSP fixture with the browser build in
// test/browser/evidence-chain.test.ts. Then the no-loop-error test, which only this harness can run (research R-12,
// PLAN-TESTABILITY-1-007): the loop error is a `window` `error` event with no error object, which Playwright's
// `console` and `pageerror` events do not record.
const driver = inProcessDriver();

afterEach(async () => {
  await driver.forcedColors("none");
  await driver.theme(null);
  await driver.viewport(1280, 800);
});

describe("ocelle-evidence-chain and ocelle-evidence-step, in process (US3)", () => {
  it.each(evidenceChainScenarios)("$name", async ({ run, expected }) => {
    expect(await run(driver)).toEqual(expected);
  });
});

/** The indices of the chain's `<li>`s that carry `data-line-end`, joined with commas. */
function lineEnds(): string {
  const items = [...(document.getElementById("c")?.shadowRoot?.querySelectorAll("ol > li") ?? [])];
  return items.flatMap((li, at) => (li.hasAttribute("data-line-end") ? [at] : [])).join(",");
}

describe("no ResizeObserver loop error (019 R-12, PLAN-TESTABILITY-1-007; T057)", () => {
  it("around 1280 → 600 → 320 px and back, a step's text changed, a step added and then hidden, the line ends change at each step and no ResizeObserver loop error reaches a window error event or a console.error call, which the recorder sees when the test dispatches one", async () => {
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
      await driver.viewport(1280, 800);
      const steps = ["Spec", "Plan", "Tasks", "Red commit", "Green commit", "Review"].map((name, at) => `<ocelle-evidence-step id="s${String(at + 1)}"${at === 2 ? ' variant="chip"' : ""}>${name}</ocelle-evidence-step>`);
      await driver.mount(`<ocelle-evidence-chain id="c" label="Evidence">${steps.join("")}</ocelle-evidence-chain>`, { base: true });
      await driver.layout("c");
      const ends: Record<string, string> = { wide: lineEnds() };
      for (const width of [600, 320, 1280, 320]) {
        await driver.viewport(width, 800);
        await driver.layout("c");
        ends[`at ${String(width)}`] = lineEnds();
      }
      await driver.text("s1", "Specification approved by the operator");
      await driver.layout("c");
      ends.text = lineEnds();
      await driver.append("c", '<ocelle-evidence-step id="s7">Merged</ocelle-evidence-step>');
      await driver.layout("c");
      ends.added = lineEnds();
      await driver.setAttribute("s7", "hidden", "");
      await driver.layout("c");
      ends.hidden = lineEnds();
      expect({
        changed: { narrow: ends["at 320"] !== ends.wide, back: ends["at 1280"] === ends.wide, text: ends.text !== ends["at 320"], added: ends.added !== ends.text, hidden: ends.hidden === ends.text },
        wide: ends.wide,
        synthetic: recorded.some((each) => each.includes("ResizeObserver loop (synthetic")),
        loopErrors: recorded.filter((each) => each.includes("ResizeObserver loop") && !each.includes("synthetic")),
      }).toEqual({ changed: { narrow: true, back: true, text: true, added: true, hidden: true }, wide: "5", synthetic: true, loopErrors: [] });
    } finally {
      window.removeEventListener("error", onError, true);
      console.error = original;
    }
  });
});
