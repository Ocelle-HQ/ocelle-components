import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { listDetailScenarios } from "../scenarios/list-detail.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 3's browser scenarios for `ocelle-list-detail` on the strict-CSP fixture with the built browser build
// (009 spec § The strict-CSP fixture, US3 scenario 16, FR-031; research.md R-17; T050): every shared body of
// scenarios/list-detail.ts on its own page, `list-detail.html` or, for the bodies with base.css,
// `list-detail-base.html`. Both pages link `tokens.css` and `frames.css` and load the browser build and the test-only
// slotted elements of US3-12 (test/fixtures/list-detail-controls.ts, bundled by global-setup.ts). Every test asserts
// zero CSP violations, no request outside the allowed list, no failed request and no console message or uncaught
// error, beside the scenario's outcome. Also the upgrade rule of R-14 on built output (T049): the server-rendered page
// `list-detail-upgrade.html` holds a one-column list-detail with `detail-open` in Frame N and no script; the test puts
// focus in a pane, then loads the browser build, so the element upgrades in place with focus inside it.
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

describe("ocelle-list-detail on the strict-CSP fixture with the browser build (US3)", { timeout: 120_000 }, () => {
  it.each(listDetailScenarios)("$name", async ({ run, expected, base }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, base ? "list-detail-base.html" : "list-detail.html", ["ocelle-elements.js", "ocelle-test-list-detail.js"]);
    const observed = await run(fixtureDriver(page.page, page.log, base));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});

/** The deep active element of the page, each level as its id or its local name and classes, joined by " >> ". */
function active(page: Page): Promise<string> {
  return page.evaluate(() => {
    const levels: string[] = [];
    let at: Element | null = document.activeElement;
    while (at !== null) {
      levels.push(at.id !== "" ? at.id : [at.localName, ...at.classList].join("."));
      at = at.shadowRoot?.activeElement ?? null;
    }
    return levels.join(" >> ");
  });
}

/** Loads the browser build into the server-rendered page and waits until the element has upgraded and rendered twice over two frames. */
async function upgrade(page: Page): Promise<void> {
  await page.addScriptTag({ url: "ocelle-elements.js", type: "module" });
  await page.waitForFunction(() => customElements.get("ocelle-list-detail") !== undefined);
  await page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await (document.getElementById("u") as unknown as { updateComplete: Promise<unknown> }).updateComplete;
  });
}

describe("ocelle-list-detail upgrading in server HTML on the strict-CSP fixture (US3, Edge Cases \"detail-open before the element upgrades\", R-14)", { timeout: 120_000 }, () => {
  it.each([
    // Focus inside the list, which the first layout (one column, detail-open) hides: it moves to the detail pane.
    { focus: "u-l0", expected: { before: "u-l0", after: "u >> div.pane.detail", list: "none", detail: "block" } },
    // Focus inside the detail, which stays shown: it is not moved.
    { focus: "u-d0", expected: { before: "u-d0", after: "u-d0", list: "none", detail: "block" } },
  ])("with focus on #$focus before the build loads, the upgraded element in Frame N shows the detail, and focus is moved only out of the hidden list", async ({ focus, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "list-detail-upgrade.html");
    await page.page.setViewportSize({ width: 720, height: 800 });
    await page.page.focus(`#${focus}`);
    const before = await active(page.page);
    await upgrade(page.page);
    const panes = await page.page.evaluate(() => {
      const root = document.getElementById("u")?.shadowRoot;
      const display = (pane: string): string => {
        const wrapper = root?.querySelector(`.pane.${pane}`);
        return wrapper === null || wrapper === undefined ? "absent" : getComputedStyle(wrapper).display;
      };
      return { list: display("list"), detail: display("detail") };
    });
    expect({ observed: { before, after: await active(page.page), ...panes }, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });
});
