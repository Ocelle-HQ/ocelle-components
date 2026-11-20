import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import type { InPage } from "../scenarios/driver.ts";
import { linkScenarios } from "../scenarios/ocelle-link.ts";
import type { Navigation } from "../scenarios/ocelle-link.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 5's browser scenarios for `ocelle-link` on the strict-CSP fixture with the built browser build (014 spec
// § The strict-CSP fixture; research.md R-08, R-11, T094): every shared body of scenarios/ocelle-link.ts, each on its own
// link.html page, which loads the browser build and nothing else. For User Story 5 the allowed list also holds the link
// target page, link-target.html, served beside it with the same policy (spec § The strict-CSP fixture), which the
// navigating bodies open. Each runs with zero CSP violations, no request outside the allowed list, no failed request,
// no console message or uncaught error and no clipboard call, asserted in the same test as the scenario's outcome; the
// violations and the console are those of every document the page showed (the console) and of its last document (the
// violations; the bodies read the earlier documents' violations themselves).
//
// The navigation of a fixture body (`Navigation`): an activation through `click` or `press` is real input on the page,
// then a wait of 300 ms (the end of the activation's task and a navigation it starts) and for the page's load; `back`
// opens link.html again; `opened` lists the other pages the context opened (Playwright's `page` event on the context,
// for US5-13's new tab or window) once each has loaded; `dialogs` lists every dialog the page opened, each dismissed.
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

/** The page's helpers (test/page-helpers.ts), which the fixture's init script installed; inside `page.evaluate` only. */
type Helpers = import("../page-helpers.ts").PageHelpers;

/** The navigation of a fixture body on `page` (see the header comment). */
function navigationOf(page: Page, origin: string): Navigation {
  const others: Page[] = [];
  const dialogs: string[] = [];
  page.context().on("page", (other) => others.push(other));
  page.on("dialog", (dialog) => {
    dialogs.push(`${dialog.type()}: ${dialog.message()}`);
    void dialog.dismiss();
  });
  const settle = async (): Promise<void> => {
    await page.waitForTimeout(300);
    await page.waitForLoadState("load");
  };
  return {
    host: new URL(origin).host,
    click: async (target, options = {}) => {
      const handle = await page.evaluateHandle((target) => (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target), target);
      try {
        await handle.click({ button: options.button ?? "left", modifiers: [...(options.modifiers ?? [])], clickCount: options.count ?? 1 });
      } finally {
        await handle.dispose().catch(() => undefined);
      }
      await settle();
    },
    press: async (key, modifiers = []) => {
      await page.keyboard.press([...modifiers, key].join("+"));
      await settle();
    },
    back: async () => {
      await page.goto(`${origin}/link.html`, { waitUntil: "load" });
    },
    opened: async () => {
      await Promise.all(others.map((other) => other.waitForLoadState("load")));
      return others.map((other) => new URL(other.url()).pathname.split("/").pop() ?? "");
    },
    dialogs: () => Promise.resolve([...dialogs]),
  };
}

describe("ocelle-link on the strict-CSP fixture with the browser build (US5)", { timeout: 90_000 }, () => {
  it("runs every body of the link scenarios, the fixture-only ones included", () => {
    expect({ all: linkScenarios.length > 20, fixtureOnly: linkScenarios.filter((scenario) => scenario.fixtureOnly).length }).toEqual({ all: true, fixtureOnly: 7 });
  });

  // One `it` per body under its full name (`it.each`'s "$name" shortens a long name to 40 characters).
  for (const { name, run, expected } of linkScenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "link.html", ["ocelle-elements.js", "link-target.html"]);
      const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
      const driver = fixtureDriver(page.page, page.log);
      const observed = await run(driver, inPage, navigationOf(page.page, origin));
      const clipboard = await driver.clipboardCalls();
      expect({ observed, clipboard, recorded: await page.finish() }).toEqual({ observed: expected, clipboard: [], recorded: clean });
    });
  }
});
