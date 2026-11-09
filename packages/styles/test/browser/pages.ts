// Page helpers of the styles-browser suites after base.test.ts (003 research.md R-09): one Chromium and one served
// directory per suite, a fixture page opened in a fresh context with the violation collector installed and the
// colour scheme emulated, keyboard focus by Tab, and computed styles read by id.
import type { Browser, Page } from "playwright";
import { afterAll, beforeAll } from "vitest";
import { collectViolations, launch, serve } from "./serve.ts";
import type { Served } from "./serve.ts";

export type Theme = "light" | "dark";
export const themes: readonly Theme[] = ["light", "dark"];

export interface Options {
  readonly colorScheme: Theme;
  readonly width?: number;
}

/** The suite's server and browser, started before its tests and closed after them. */
export interface Suite {
  readonly open: (path: string, options: Options) => Promise<Page>;
}

/** Starts the server and Chromium for the calling suite (beforeAll / afterAll) and returns its page opener. */
export function suite(): Suite {
  let browser: Browser | undefined;
  let served: Served | undefined;
  beforeAll(async () => {
    served = await serve();
    browser = await launch();
  }, 120_000);
  afterAll(async () => {
    await browser?.close();
    await served?.close();
  });
  return {
    open: async (path, options) => {
      if (browser === undefined || served === undefined) throw new Error("the suite did not start");
      const context = await browser.newContext({ viewport: { width: options.width ?? 1280, height: 800 } });
      const page = await context.newPage();
      await collectViolations(page);
      await page.emulateMedia({ colorScheme: options.colorScheme });
      await page.goto(`${served.origin}/${path}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      return page;
    },
  };
}

export async function close(page: Page): Promise<void> {
  await page.context().close();
}

/** Presses Tab until the element with `id` has focus (keyboard focus); throws if it never gets it. */
export async function tabTo(page: Page, id: string): Promise<void> {
  for (let presses = 0; presses < 40; presses += 1) {
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.id)) === id) return;
  }
  throw new Error(`Tab never reached #${id}`);
}

/** The computed values of `properties` on the element with `id`. */
export function computed(page: Page, id: string, properties: readonly string[]): Promise<Record<string, string>> {
  return page.evaluate(
    ({ id, properties }) => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`no #${id}`);
      const style = getComputedStyle(element);
      return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
    },
    { id, properties },
  );
}

/** The computed font size and line height of each element with one of `ids`, keyed by id. */
export function scales(page: Page, ids: readonly string[]): Promise<Record<string, { readonly fontSize: string; readonly lineHeight: string }>> {
  return page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => {
          const element = id === "html" ? document.documentElement : id === "body" ? document.body : document.getElementById(id);
          if (element === null) throw new Error(`no #${id}`);
          const style = getComputedStyle(element);
          return [id, { fontSize: style.fontSize, lineHeight: style.lineHeight }];
        }),
      ),
    ids,
  );
}
