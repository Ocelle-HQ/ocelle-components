import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { afterUpgrade, beforeUpgrade, defineDialogStandIns, dialogScenarios, repeatedEscapeScenario, upgradeExpected, upgradeMarkup } from "../scenarios/dialog.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 1's browser scenarios for `ocelle-dialog` on the strict-CSP fixture with the built browser build (008
// tasks.md T016): every shared body of scenarios/dialog.ts (contracts/checks.md § Dialog), the repeated-Escape case
// included, on its own page
// `overlays.html`, with the stand-ins defined in the page through the DevTools protocol, which the page's policy does
// not govern. Every test asserts the recorders beside the body's outcome: zero CSP violations, only allowed requests,
// no failed request and no console message or uncaught error. Then the before-definition case of the
// open-at-first-render row on `overlays-upgrade.html`, which loads no element script until the test adds the browser
// build by URL as a module script, as `script-src 'self'` allows.
const built = inject("elementsFixture");
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

function started(): { readonly browser: Browser; readonly origin: string } {
  if (browser === undefined || served === undefined) throw new Error("the suite did not start");
  return { browser, origin: served.origin };
}

describe("ocelle-dialog on the strict-CSP fixture with the browser build (US1)", { timeout: 60_000 }, () => {
  it.each([...dialogScenarios, repeatedEscapeScenario])("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "overlays.html");
    await page.page.evaluate(defineDialogStandIns);
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });

  it("open before it is defined (overlays-upgrade.html): shown modally after the browser build loads, focus on the first slotted button, no event on open; open = false returns focus to the page button", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "overlays-upgrade.html");
    await page.page.evaluate(defineDialogStandIns);
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount(upgradeMarkup);
    const before = await beforeUpgrade(driver);
    await page.page.evaluate(async () => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = "ocelle-elements.js";
      document.head.append(script);
      // A bounded wait (R-15): the definition, or a failure after 1 000 ms.
      await Promise.race([customElements.whenDefined("ocelle-dialog"), new Promise((resolve) => setTimeout(resolve, 1000))]);
    });
    await driver.setAttribute("act", "data-wait", "");
    expect({ observed: { before, after: await afterUpgrade(driver) }, recorded: await page.finish() }).toEqual({ observed: upgradeExpected, recorded: clean });
  });
});
