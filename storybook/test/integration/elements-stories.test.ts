import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { axeContext, ruleMeta, ruleOptions } from "../../../gates/lib/axe-rules.ts";
import type { AxeRule } from "../../../gates/lib/axe-rules.ts";

// The element stories in the built Storybook (005 US1 scenario 13, FR-019; research.md R-14; analysis G4 and L14;
// T020a). The global setup (setup.ts) built the Storybook; this test serves it, as render.test.ts does, and opens
// each `ocelle-icon` story of phase 2 (close, labelled and unknown name) in the preview in light and in dark. Since
// 006 (FR-020, FR-021; research.md R-10) the Storybook is not a CSP target: it is served with no CSP header and no
// violation is counted, its inline scripts staying in iframe.html; the elements prove run-time strict CSP in their own
// strict-CSP fixture. Each story renders its `ocelle-icon` with the story's `name` and `label`, the element
// is defined and draws for a known name and not for the unknown one, the page makes no
// request outside the origin, and the story renders with the base stylesheet as every story does: preview-head.html
// links base.css, and the root's `color-scheme` follows the theme global, which only base.css applies (US1-13's base
// stylesheet clause, analysis L14). Phase 3 adds the grid of the thirteen names, left to right and right to left
// (T035a; US1-13's "every icon in the set"), phase 5 the mark's stories (T056a; US4 scenario 11): main ground, chrome,
// mono and labelled, each rendering its `ocelle-brand-mark` with the story's `ground`, `tone` and `label`, drawn, in
// light and dark, with no request outside the origin.
const types: Readonly<Record<string, string>> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

const built = inject("storybook");
let server: Server | undefined;
let origin = "";
let browser: Browser | undefined;

beforeAll(async () => {
  server = createServer((request, response) => {
    const path = normalize(new URL(request.url ?? "/", "http://localhost").pathname).replace(/^[/\\]+/, "");
    let body: Buffer;
    try {
      if (path.startsWith("..")) throw new Error("outside the served directory");
      body = readFileSync(join(built.out, path));
    } catch {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream" }).end(body);
  });
  await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${String((server.address() as AddressInfo).port)}`;
  const executablePath = process.env.OCELLE_CHROMIUM_PATH;
  browser = await chromium.launch(executablePath === undefined || executablePath === "" ? {} : { executablePath });
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => {
    if (server === undefined) resolve();
    else server.close(() => {
      resolve();
    });
  });
});

/** Opens a story in the preview with the outside-request recorder installed. */
async function open(id: string, theme: "light" | "dark", element = "ocelle-icon"): Promise<{ readonly page: Page; readonly outside: readonly string[] }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage();
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" });
  // Waits for the story's element, but not past 10 s: a story that never renders is reported by the assertions below.
  await page.waitForSelector(`#storybook-root ${element}`, { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.evaluate(async (element) => {
    await Promise.all([...document.querySelectorAll(`#storybook-root ${element}`)].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
  }, element);
  return { page, outside };
}

/** What the story's page shows: its theme, the base stylesheet and its icons. */
function observe(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-icon") !== undefined,
    icons: [...document.querySelectorAll("#storybook-root ocelle-icon")].map((icon) => ({
      name: icon.getAttribute("name"),
      label: icon.getAttribute("label"),
      drawn: icon.shadowRoot?.querySelector("svg") !== null && icon.shadowRoot !== null,
    })),
  }));
}

/** The thirteen names of the set (spec US2 scenario 1), each drawn, unlabelled. */
const theSet = ["chevron-start", "chevron-end", "chevron-up", "chevron-down", "arrow-start", "arrow-end", "menu", "close", "folder", "file", "search", "table", "copy"].map((name) => ({ name, label: null, drawn: true }));

const stories = [
  { id: "elements-ocelle-icon--close", icons: [{ name: "close", label: null, drawn: true }] },
  { id: "elements-ocelle-icon--labelled", icons: [{ name: "close", label: "Close", drawn: true }] },
  { id: "elements-ocelle-icon--unknown-name", icons: [{ name: "nonexistent", label: null, drawn: false }] },
  // The grid of the set (T035a): one icon per name of the thirteen, each drawn, left to right and right to left.
  { id: "elements-ocelle-icon--set", icons: theSet },
  { id: "elements-ocelle-icon--set-right-to-left", icons: theSet },
] as const;

describe("the ocelle-icon stories in the built Storybook (US1-13, FR-019)", { timeout: 60_000 }, () => {
  for (const { id, icons } of stories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-icon with the story's name and label, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme);
        expect({ ...((await observe(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          icons,
          outside: [],
        });
        await page.close();
      });
    }
  }
});

/** What a mark story's page shows: its theme, the base stylesheet and its marks. */
function observeMarks(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-brand-mark") !== undefined,
    marks: [...document.querySelectorAll("#storybook-root ocelle-brand-mark")].map((mark) => ({
      ground: mark.getAttribute("ground"),
      tone: mark.getAttribute("tone"),
      label: mark.getAttribute("label"),
      drawn: [...(mark.shadowRoot?.querySelectorAll("svg path, svg ellipse") ?? [])].map((part) => part.localName),
    })),
  }));
}

/** The rosette's drawing: four arcs and the spot. */
const rosette = ["path", "path", "path", "path", "ellipse"];

const markStories = [
  { id: "elements-ocelle-brand-mark--main-ground", marks: [{ ground: null, tone: null, label: null, drawn: rosette }] },
  { id: "elements-ocelle-brand-mark--chrome", marks: [{ ground: "chrome", tone: null, label: null, drawn: rosette }] },
  { id: "elements-ocelle-brand-mark--mono", marks: [{ ground: null, tone: "mono", label: null, drawn: rosette }] },
  { id: "elements-ocelle-brand-mark--labelled", marks: [{ ground: null, tone: null, label: "Ocelle", drawn: rosette }] },
] as const;

describe("the ocelle-brand-mark stories in the built Storybook (US4-11, FR-019)", { timeout: 60_000 }, () => {
  for (const { id, marks } of markStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-brand-mark with the story's ground, tone and label, drawn, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-brand-mark");
        expect({ ...((await observeMarks(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          marks,
          outside: [],
        });
        await page.close();
      });
    }
  }
});

/** axe-core's script, injected into a story page as the axe gate injects it (gates/bin/axe.ts). */
const axeScript = readFileSync(fileURLToPath(new URL("../../../node_modules/axe-core/axe.js", import.meta.url)), "utf8");

/**
 * Runs axe-core on a story page with the axe gate's rule set and context (gates/lib/axe-rules.ts: the default rules and
 * the WCAG 2.x A and AA rules, less the experimental and the harness-document rules; Storybook's harness nodes
 * excluded), and returns each violation's rule id and impact.
 */
async function axeViolations(page: Page): Promise<{ readonly id: string; readonly impact: string | null }[]> {
  await page.addScriptTag({ content: axeScript });
  const rules = await page.evaluate(() => (window as unknown as { axe: { _audit: { rules: AxeRule[] } } }).axe._audit.rules.map((rule) => ({ id: rule.id, tags: [...rule.tags], enabled: rule.enabled, ...(rule.selector === undefined ? {} : { selector: rule.selector }) })));
  const options = { rules: ruleOptions(ruleMeta(rules)), context: axeContext() };
  return page.evaluate(async ({ rules, context }) => {
    const axe = (window as unknown as { axe: { run: (context: unknown, options: unknown) => Promise<{ violations: { id: string; impact?: string | null }[] }> } }).axe;
    const results = await axe.run(context, { rules, resultTypes: ["violations"] });
    return results.violations.map((violation) => ({ id: violation.id, impact: violation.impact ?? null }));
  }, options);
}

/** What a listbox story's page shows: its theme, whether both elements are defined, its listboxes and their options. */
function observeListboxes(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {
      theme: document.documentElement.dataset.theme,
      defined: [customElements.get("ocelle-listbox") !== undefined, customElements.get("ocelle-option") !== undefined],
      listboxes: [...document.querySelectorAll("#storybook-root ocelle-listbox")].map((listbox) => {
        const list = listbox.shadowRoot?.querySelector('[part="list"]');
        return {
          value: (listbox as unknown as { value?: unknown }).value,
          scrolls: list === null || list === undefined ? null : list.scrollHeight > list.clientHeight,
          options: [...listbox.querySelectorAll("ocelle-option")].map((option) => ({
            text: option.textContent.trim(),
            selected: option.getAttribute("aria-selected"),
            disabled: option.getAttribute("aria-disabled") === "true",
            focused: option === active,
          })),
        };
      }),
    };
  });
}

/** The options of a five-folder story: `selected` the selected one, `disabled` the disabled one, `focused` the focused one. */
function folderOptions(selected: string | null, disabled = "", focused = ""): unknown[] {
  return ["alpha", "beta", "gamma", "delta", "epsilon"].map((text) => ({ text, selected: text === selected ? "true" : "false", disabled: text === disabled, focused: text === focused }));
}

const tenFolders = ["alpha", "beta", "gamma", "delta", "epsilon", "zeta", "eta", "theta", "iota", "kappa"];

// The listbox stories (014 FR-050, FR-051; research.md R-01, R-12; T019): each story renders its options with the
// states the listbox writes, in light and dark, and axe with the axe gate's rule set reports no `aria-allowed-attr`
// violation (the internals kept where axe-core reads them; plant: the internals in a private field) and no serious or
// critical violation. The scrolling listbox scrolls; the focused story's option has focus after its `play`.
const listboxStories = [
  { id: "elements-ocelle-listbox--no-selection", listboxes: [{ value: "", scrolls: false, options: folderOptions(null) }] },
  { id: "elements-ocelle-listbox--selected", listboxes: [{ value: "gamma", scrolls: false, options: folderOptions("gamma") }] },
  { id: "elements-ocelle-listbox--disabled-option", listboxes: [{ value: "gamma", scrolls: false, options: folderOptions("gamma", "beta") }] },
  { id: "elements-ocelle-listbox--focused-option", listboxes: [{ value: "gamma", scrolls: false, options: folderOptions("gamma", "", "delta") }] },
  { id: "elements-ocelle-listbox--hovered-option", listboxes: [{ value: "gamma", scrolls: false, options: folderOptions("gamma") }] },
  {
    id: "elements-ocelle-listbox--scrolling-listbox",
    listboxes: [{ value: "delta", scrolls: true, options: tenFolders.map((text) => ({ text, selected: text === "delta" ? "true" : "false", disabled: false, focused: false })) }],
  },
  {
    id: "elements-ocelle-listbox--option-with-icon",
    listboxes: [
      {
        value: "projects",
        scrolls: false,
        options: [
          { text: "Projects", selected: "true", disabled: false, focused: false },
          { text: "Notes", selected: "false", disabled: false, focused: false },
        ],
      },
    ],
  },
] as const;

describe("the ocelle-listbox stories in the built Storybook (014 FR-050, FR-051)", { timeout: 60_000 }, () => {
  for (const { id, listboxes } of listboxStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its options with the states the listbox writes, and axe reports no aria-allowed-attr and no serious or critical violation`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-option");
        const observed = await observeListboxes(page);
        const violations = await axeViolations(page);
        expect({
          observed,
          allowedAttr: violations.filter((violation) => violation.id === "aria-allowed-attr"),
          serious: violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical"),
          outside,
        }).toEqual({ observed: { theme, defined: [true, true], listboxes }, allowedAttr: [], serious: [], outside: [] });
        await page.close();
      });
    }
  }
});
