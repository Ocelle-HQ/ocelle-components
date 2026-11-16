import type { Page } from "playwright";
import { describe, expect, it } from "vitest";
import { close, computed, suite, themes } from "./pages.ts";
import { violations } from "./serve.ts";

// base.css for `ocelle-facts` (013 FR-008, FR-012; research.md R-03, R-07; contracts/checks.md § `@ocelle/styles`
// tests; tasks.md T009), in Chromium under the strict CSP, in both themes. facts.html holds a compact region with a
// regular region nested in it, a paragraph outside both, and an `ocelle-facts` with two facts and a hidden one, none
// of them defined (no element module is loaded), beside an `ocelle-fact` outside a sheet.
// - The density hook's rules also set the facts value hooks: `--ocelle-facts-value-size` and
//   `--ocelle-facts-value-line-height` are `--ocelle-font-size-sm` (0.875rem) and `--ocelle-line-height-compact`
//   (1.5) inside the compact region, `--ocelle-font-size-fact` (1.0625rem) and `--ocelle-line-height-normal` (1.45)
//   inside the nested regular region, and unset outside both.
// - Before upgrade each `ocelle-fact` child of the undefined sheet is a block, one per line, a hidden one keeps
//   `display: none` (no client rect, its text not in the sheet's `innerText`), and a fact outside a sheet stays inline;
//   once the elements are defined the rule no longer matches.
// Expected values are written by hand from the spec and 002's Appendix A.
const { open } = suite();

const hooks = ["--ocelle-facts-value-size", "--ocelle-facts-value-line-height"];

describe("the facts value hooks of the density rules (FR-008)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s: compact 0.875rem and 1.5, nested regular 1.0625rem and 1.45, unset outside", async (theme) => {
    const page = await open("facts.html", { colorScheme: theme });
    const read = async (id: string): Promise<Record<string, string>> => Object.fromEntries(Object.entries(await computed(page, id, hooks)).map(([name, value]) => [name, value.trim()]));
    const observed = { compact: await read("compact-p"), regular: await read("regular-p"), outside: await read("outside"), violations: await violations(page) };
    await close(page);
    expect(observed).toEqual({
      compact: { "--ocelle-facts-value-size": "0.875rem", "--ocelle-facts-value-line-height": "1.5" },
      regular: { "--ocelle-facts-value-size": "1.0625rem", "--ocelle-facts-value-line-height": "1.45" },
      outside: { "--ocelle-facts-value-size": "", "--ocelle-facts-value-line-height": "" },
      violations: [],
    });
  });
});

/** Each fact's display, client rect count and block start, and the sheet's innerText. */
function upgrade(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const read = (id: string): { display: string; rects: number; top: number } => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`no #${id}`);
      return { display: getComputedStyle(element).display, rects: element.getClientRects().length, top: Math.round(element.getBoundingClientRect().top) };
    };
    const first = read("first");
    const second = read("second");
    return {
      first: first.display,
      second: second.display,
      ownLines: second.top > first.top,
      hidden: [read("hidden").display, read("hidden").rects],
      text: (document.getElementById("sheet")?.innerText ?? "").includes("Hidden value"),
      loose: read("loose").display,
    };
  });
}

describe("ocelle-fact children of an undefined ocelle-facts before upgrade (FR-012, PLAN-FRESH-2-002)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s: each fact is a block on its own line and a hidden one keeps display none; a fact outside a sheet and every fact once defined are inline", async (theme) => {
    const page = await open("facts.html", { colorScheme: theme });
    const before = await upgrade(page);
    await page.evaluate(() => {
      customElements.define("ocelle-facts", class extends HTMLElement {});
      customElements.define("ocelle-fact", class extends HTMLElement {});
    });
    const defined = await page.evaluate(() => getComputedStyle(document.querySelector("#first") ?? document.body).display);
    const reported = await violations(page);
    await close(page);
    expect({ before, defined, reported }).toEqual({
      before: { first: "block", second: "block", ownLines: true, hidden: ["none", 0], text: false, loose: "inline" },
      defined: "inline",
      reported: [],
    });
  });
});
