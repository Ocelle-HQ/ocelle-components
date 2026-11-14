import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { cardScenarios } from "../scenarios/card.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// 011 User Story 1's card scenarios on the strict-CSP fixture with the built browser build (research.md R-05, R-13,
// SC-001, FR-035; T013): every shared body of scenarios/card.ts on its own fixture page (fixtures/card.html,
// 1280 × 800 px), with zero CSP violations, no request outside the allowed list, no failed request and no console
// message or uncaught error, asserted in the same test as the scenario's positive outcome; and the mixed-copy page
// (fixtures/card-mixed.html), where a test-only bundle of the module build's `ocelle-card.js`, with its own Lit,
// defines the card before the browser build loads and defines the section header: the two come from different copies
// of the package, and a header in a compact card's header slot is still compact (the pull model of R-05).
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

describe("ocelle-card on the strict-CSP fixture with the browser build (011 US1)", { timeout: 60_000 }, () => {
  it.each(cardScenarios)("$name", async ({ run, expected }) => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "card.html");
    const observed = await run(fixtureDriver(page.page, page.log));
    expect({ observed, recorded: await page.finish() }).toEqual({ observed: expected, recorded: clean });
  });

  it("R-05, two copies: with the card from a bundle of the module build's ocelle-card.js and the section header from the browser build, the bundle's card is the one defined, and a header in a compact card's header slot is drawn at the compact size, beside one outside the card at the default size", async () => {
    const { browser, origin } = started();
    const page = await visit(browser, origin, "card-mixed.html", ["card-bundle.js", "ocelle-elements.js"]);
    const driver = fixtureDriver(page.page, page.log);
    await driver.mount(
      '<ocelle-card id="card" density="compact"><ocelle-section-header slot="header"><h2 id="in-card" slot="heading">Runs</h2></ocelle-section-header><p>Body</p></ocelle-card>' +
        '<ocelle-section-header><h2 id="outside" slot="heading">Runs</h2></ocelle-section-header><div id="probe" hidden></div>',
    );
    const copies = await page.page.evaluate(() => {
      const cards = (globalThis as { ocelleCards?: unknown[] }).ocelleCards ?? [];
      return { bundled: cards.length, cardFromBundle: cards.length === 1 && customElements.get("ocelle-card") === cards[0], header: customElements.get("ocelle-section-header") !== undefined };
    });
    const size = async (token: string): Promise<string> => {
      await driver.style("probe", "font-size", `var(--ocelle-${token})`);
      return driver.computed("probe", "font-size");
    };
    const sizes = { inCard: await driver.computed("in-card", "font-size"), outside: await driver.computed("outside", "font-size") };
    const tokens = { inCard: await size("font-size-subhead"), outside: await size("font-size-lg") };
    expect({ copies, sizes, recorded: await page.finish() }).toEqual({ copies: { bundled: 1, cardFromBundle: true, header: true }, sizes: tokens, recorded: clean });
  });
});
