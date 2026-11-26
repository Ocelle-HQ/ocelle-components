import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { copyFieldScenarios } from "../scenarios/copy-field.ts";
import type { InPage } from "../scenarios/driver.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

// User Story 4's browser scenarios for `ocelle-copy-field` on the strict-CSP fixture with the built browser build (014
// spec § The strict-CSP fixture; research.md R-07, R-11, T078): every shared body of scenarios/copy-field.ts marked
// `fixture`, each on its own copy-field.html page, which loads the browser build and nothing else. Each runs with zero
// CSP violations, no request outside the allowed list, no failed request, no console message or uncaught error and no
// clipboard call (the clipboard observer is installed on every fixture page before any page script; SC-006), asserted
// in the same test as the scenario's outcome.
const built = inject("elementsFixture");
const scenarios = copyFieldScenarios.filter((scenario) => scenario.fixture);
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

function mountIdentifier(page: Page, value: string, compact: boolean) {
  return page.evaluateHandle(async ({ value, compact }) => {
    const field = document.createElement("ocelle-copy-field");
    field.id = "cf";
    field.setAttribute("grouped", "");
    field.toggleAttribute("compact", compact);
    field.setAttribute("value", value);
    const requests: unknown[] = [];
    const activations: { trusted: boolean; expanded: string | null }[] = [];
    document.addEventListener("ocelle-copy-field-request", (event) => requests.push((event as CustomEvent<unknown>).detail));
    document.addEventListener("click", (event) => {
      const button = event.composedPath().find((node): node is HTMLButtonElement => node instanceof HTMLButtonElement);
      if (button !== undefined) activations.push({ trusted: event.isTrusted, expanded: button.getAttribute("aria-expanded") });
    }, { capture: true });
    document.body.append(field);
    await field.updateComplete;
    await document.fonts.ready;
    return { requests, activations };
  }, { value, compact });
}

function readIdentifier(page: Page) {
  return page.locator("#cf").evaluate((field) => {
    const root = field.shadowRoot;
    const value = root?.querySelector('[part~="value"]');
    const displayed: string[] = [];
    if (root !== null && value !== null && value !== undefined) {
      const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT);
      const range = document.createRange();
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const text = node.textContent?.trim() ?? "";
        const parent = node.parentElement;
        if (text === "" || parent === null) continue;
        range.selectNodeContents(node);
        // The accessible-only value has no painted text at the range's centre.
        const painted = [...range.getClientRects()].some((rect) => {
          const hit = root.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
          return rect.width > 0 && hit !== null && parent.contains(hit);
        });
        if (painted) displayed.push(text);
      }
    }
    return { displayed, parsedMarkup: root !== null && root.querySelector("em") !== null };
  });
}

async function withBuiltCopyField(run: (page: Page, driver: ReturnType<typeof fixtureDriver>) => Promise<void>): Promise<void> {
  const { browser, origin } = started();
  if (!("dir" in built)) throw new Error(`The browser fixture failed to build: ${built.problem}`);
  const { page, log, finish } = await visit(browser, origin, "copy-field.html");
  const driver = fixtureDriver(page, log);
  try {
    const loaded = await page.evaluate(() => ({
      assets: (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
        .filter(({ name }) => ["/ocelle-elements.js", "/tokens.css"].includes(new URL(name).pathname))
        .map(({ name, responseStatus }) => [name, responseStatus])
        .sort(),
      defined: customElements.get("ocelle-copy-field") !== undefined,
    }));
    expect(loaded, "the fixture loaded the browser package and token stylesheet and registered the Copy field").toEqual({
      assets: [[`${origin}/ocelle-elements.js`, 200], [`${origin}/tokens.css`, 200]],
      defined: true,
    });
    await run(page, driver);
  } finally {
    const clipboard = await driver.clipboardCalls();
    expect({ clipboard, recorded: await finish() }).toEqual({ clipboard: [], recorded: clean });
  }
}

describe("ocelle-copy-field on the strict-CSP fixture with the browser build (US4)", { timeout: 60_000 }, () => {
  it("runs the fixture bodies of the copy-field scenarios", () => {
    expect(scenarios.length).toBeGreaterThan(20);
  });

  // One `it` per body under its full name (`it.each`'s "$name" shortens a long name to 40 characters).
  for (const { name, run, expected } of scenarios) {
    it(name, async () => {
      const { browser, origin } = started();
      const page = await visit(browser, origin, "copy-field.html");
      const inPage: InPage = (fn, arg) => page.page.evaluate(fn as (arg: unknown) => never, arg);
      const driver = fixtureDriver(page.page, page.log);
      const observed = await run(driver, inPage);
      const clipboard = await driver.clipboardCalls();
      const recorded = await page.finish();
      expect(recorded, "the strict-CSP fixture has clean policy, resource, and console records").toEqual(clean);
      expect(clipboard, "the component makes no programmatic clipboard calls").toEqual([]);
      expect(observed, "the built copy field meets the browser scenario").toEqual(expected);
    });
  }
});

describe("built copy-field identifier presentations under strict CSP (035)", { timeout: 60_000 }, () => {
  it("renders every group of a fictional record ID as literal text and requests the exact raw value", async () => {
    await withBuiltCopyField(async (page, driver) => {
      const groups = ["<em>record</em>:", "aB12", "Cd34", "Ef"];
      const value = `  ${groups.join("")} \t`;
      const events = await mountIdentifier(page, value, false);
      expect(await readIdentifier(page), "the loaded package renders separate record ID groups without parsing its prefix").toEqual({ displayed: groups, parsedMarkup: false });

      const tree = await driver.axSubtree("cf");
      const copyIndex = tree.findIndex(({ role, name }) => role === "button" && name === "Copy");
      expect(copyIndex).toBeGreaterThan(0);
      expect(tree.slice(0, copyIndex).filter(({ role }) => role === "StaticText").map(({ name }) => name).join("")).toBe(value.trim());
      await page.getByRole("button", { name: "Copy", exact: true }).click();
      await expect.poll(() => events.jsonValue()).toEqual({ requests: [{ text: value }], activations: [{ trusted: true, expanded: null }] });
    });
  });

  it("reveals and restores the literal compact preview and requests the exact raw value in either view", async () => {
    await withBuiltCopyField(async (page, driver) => {
      const prefix = "ni:<em>sha256</em>:";
      const groups = [prefix, "aB12", "Cd34", "Ef56", "Gh"];
      const preview = [prefix, "aB12", "…", "Gh"];
      const value = `\t${groups.join("")}  `;
      const events = await mountIdentifier(page, value, true);
      const disclosure = page.locator("#cf button[aria-expanded]");
      const copy = page.getByRole("button", { name: "Copy", exact: true });
      expect(await disclosure.count(), "the loaded package renders a native disclosure for compact identifiers").toBe(1);

      const checkView = async (displayed: string[], expanded: boolean): Promise<string> => {
        expect(await disclosure.getAttribute("aria-expanded")).toBe(String(expanded));
        expect(await readIdentifier(page)).toEqual({ displayed, parsedMarkup: false });
        const tree = await driver.axSubtree("cf");
        const disclosureIndex = tree.findIndex(({ role }) => role === "button");
        const name = tree[disclosureIndex]?.name ?? "";
        expect(name).toMatch(expanded ? /hide|collapse|compact|preview|show less/i : /show|reveal|expand/i);
        expect(tree.slice(0, disclosureIndex).filter(({ role }) => role === "StaticText").map(({ name }) => name).join("")).toBe(value.trim());
        return name;
      };

      const closedName = await checkView(preview, false);
      await copy.click();
      await expect.poll(async () => (await events.jsonValue()).requests).toEqual([{ text: value }]);
      await disclosure.click();
      expect(await checkView(groups, true)).not.toBe(closedName);
      await copy.click();
      await expect.poll(async () => (await events.jsonValue()).requests).toEqual([{ text: value }, { text: value }]);
      await disclosure.click();
      expect(await checkView(preview, false)).toBe(closedName);
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
      }));
      expect(await events.jsonValue()).toEqual({
        requests: [{ text: value }, { text: value }],
        activations: [
          { trusted: true, expanded: null }, { trusted: true, expanded: "false" },
          { trusted: true, expanded: null }, { trusted: true, expanded: "true" },
        ],
      });
    });
  });
});
