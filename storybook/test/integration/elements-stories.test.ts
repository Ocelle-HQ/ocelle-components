import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
import { readScrollWidth, readTextBoxes } from "../../../packages/elements/test/commands.ts";

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
// light and dark, with no request outside the origin. 011 phase 2 (T017; FR-033, SC-002; research.md R-14, operator
// decision PLAN-CORRECTNESS-1-009 (a)) adds the section-header and card stories: each renders its elements with their
// slotted content in light and dark, and, loaded at 320 × 800 px, the document does not scroll horizontally and no
// slotted text node is clipped (packages/elements/test/commands.ts `readTextBoxes`), beside the same content rendered.
// Phase 3 (T028) adds the page-header stories, with the same checks, phase 4 (T035) the context-sidebar stories and
// phase 5 (T043) the personal-rail stories.
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

/** The 011 layout stories (T017): each story's id, its element tag and how many it renders, and the text it shows. */
const layoutStories = [
  { id: "elements-ocelle-section-header--heading-only", tag: "ocelle-section-header", count: 1, texts: ["Runs"] },
  { id: "elements-ocelle-section-header--filled", tag: "ocelle-section-header", count: 1, texts: ["Mission", "Runs", "Every run of the mission, newest first.", "Edit", "New run"] },
  { id: "elements-ocelle-section-header--compact", tag: "ocelle-section-header", count: 1, texts: ["Mission", "Runs", "Every run of the mission, newest first.", "Edit", "New run"] },
  { id: "elements-ocelle-section-header--eyebrow-variant", tag: "ocelle-section-header", count: 1, texts: ["Recent", "Edit", "New run", "Run 12, passed", "Run 11, failed"] },
  { id: "elements-ocelle-section-header--empty-heading", tag: "ocelle-section-header", count: 1, texts: ["Mission", "A header whose heading slot is empty.", "Edit", "New run"] },
  { id: "elements-ocelle-section-header--long-heading", tag: "ocelle-section-header", count: 1, texts: [`Mission${"x".repeat(60)}end`, "An unbroken heading wraps inside the header.", "Edit", "New run"] },
  ...["regular", "compact", "inset", "inset-compact"].map((name) => ({
    id: `elements-ocelle-card--${name}`,
    tag: "ocelle-card",
    count: 1,
    texts: ["Mission", "Runs", "New run", "Twelve runs this week, ten passed.", "The last run finished an hour ago."],
  })),
  { id: "elements-ocelle-card--no-header", tag: "ocelle-card", count: 1, texts: ["Twelve runs this week, ten passed.", "The last run finished an hour ago."] },
  { id: "elements-ocelle-card--nested", tag: "ocelle-card", count: 2, texts: ["Mission", "Runs", "New run", "The outer card holds an inset compact card.", "Mission", "Runs", "New run", "The nested card."] },
  // 011 phase 3 (T028; US2, FR-033): the page-header stories.
  { id: "elements-ocelle-page-header--heading-only", tag: "ocelle-page-header", count: 1, texts: ["Missions"] },
  ...["filled", "compact"].map((name) => ({
    id: `elements-ocelle-page-header--${name}`,
    tag: "ocelle-page-header",
    count: 1,
    texts: ["Workspace", "Missions", "Every mission of the workspace, newest first.", "Import", "New mission"],
  })),
  { id: "elements-ocelle-page-header--empty-heading", tag: "ocelle-page-header", count: 1, texts: ["Workspace", "A page header whose heading slot is empty.", "Import", "New mission"] },
  { id: "elements-ocelle-page-header--long-heading", tag: "ocelle-page-header", count: 1, texts: ["Workspace", `Missions${"x".repeat(60)}end`, "An unbroken heading wraps inside the band.", "Import", "New mission", "Export"] },
  // 011 phase 4 (T035; US3, FR-033, FR-038): the context-sidebar stories, each rendering one sidebar, the four naming
  // cases of US3-12 included, each rendered alone.
  ...["full", "host-aria-label", "label-and-host-aria-label", "blank-host-aria-label", "unnamed"].map((name) => ({
    id: `elements-ocelle-context-sidebar--${name}`,
    tag: "ocelle-context-sidebar",
    count: 1,
    texts: ["Kitty team", "Missions", "Runs", "Projects", "Six members, two away this week.", "3 of 5 missions done"],
  })),
  { id: "elements-ocelle-context-sidebar--no-head", tag: "ocelle-context-sidebar", count: 1, texts: ["Missions", "Runs", "Projects", "Six members, two away this week.", "3 of 5 missions done"] },
  { id: "elements-ocelle-context-sidebar--no-footer", tag: "ocelle-context-sidebar", count: 1, texts: ["Kitty team", "Missions", "Runs", "Projects", "Six members, two away this week."] },
  { id: "elements-ocelle-context-sidebar--one-section", tag: "ocelle-context-sidebar", count: 1, texts: ["Kitty team", "Missions", "Runs", "3 of 5 missions done"] },
  { id: "elements-ocelle-context-sidebar--text-in-the-slot", tag: "ocelle-context-sidebar", count: 1, texts: ["Kitty team", "Missions", "Runs", "Loose text between two sections", "Six members, two away this week.", "3 of 5 missions done"] },
  { id: "elements-ocelle-context-sidebar--empty-sections", tag: "ocelle-context-sidebar", count: 1, texts: ["Kitty team", "3 of 5 missions done"] },
  { id: "elements-ocelle-context-sidebar--hidden-sections", tag: "ocelle-context-sidebar", count: 1, texts: ["Kitty team", "Missions", "Runs", "A hidden section.", "Six members, two away this week.", "3 of 5 missions done"] },
  // 011 phase 5 (T043; US4, FR-033, FR-038): the personal-rail stories, each rendering one rail of stand-in items, the
  // three naming cases of US4-11 included, each rendered alone.
  ...["vertical", "horizontal", "host-aria-label", "label-and-host-aria-label", "blank-host-aria-label"].map((name) => ({
    id: `elements-ocelle-personal-rail--${name}`,
    tag: "ocelle-personal-rail",
    count: 1,
    texts: ["In", "Ru", "Do", "Me"],
  })),
  { id: "elements-ocelle-personal-rail--no-bottom", tag: "ocelle-personal-rail", count: 1, texts: ["In", "Ru", "Do"] },
  { id: "elements-ocelle-personal-rail--no-primary", tag: "ocelle-personal-rail", count: 1, texts: ["Me"] },
  { id: "elements-ocelle-personal-rail--wrapped", tag: "ocelle-personal-rail", count: 1, texts: ["1", "2", "3", "4", "5", "6", "7", "8", "Me", "He"] },
] as const;

/** What a layout story's page shows: its theme, its elements, each defined and upgraded, and the slotted text it draws. */
async function observeLayout(page: Page, tag: string): Promise<unknown> {
  const shown = await page.evaluate((tag) => ({
    theme: document.documentElement.dataset.theme,
    defined: customElements.get(tag) !== undefined,
    elements: [...document.querySelectorAll(`#storybook-root ${tag}`)].filter((each) => each.shadowRoot !== null).length,
  }), tag);
  const texts = (await readTextBoxes(page.mainFrame(), "storybook-root")).map((box) => box.text.trim());
  return { ...shown, texts };
}

describe("the ocelle-section-header, ocelle-card, ocelle-page-header, ocelle-context-sidebar and ocelle-personal-rail stories in the built Storybook (011 US1, US2, US3, US4, FR-033)", { timeout: 60_000 }, () => {
  for (const { id, tag, count, texts } of layoutStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ${tag} elements with their slotted content, with no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, tag);
        expect({ ...((await observeLayout(page, tag)) as object), outside }).toEqual({ theme, defined: true, elements: count, texts: [...texts], outside: [] });
        await page.close();
      });
    }
    it(`${id} at 320 × 800 px: no horizontal scroll and no clipped text, its elements upgraded and its content rendered (SC-002, FR-004)`, async () => {
      const { page } = await open(id, "light", tag);
      await page.setViewportSize({ width: 320, height: 800 });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      const boxes = await readTextBoxes(page.mainFrame(), "storybook-root");
      const upgraded = await page.evaluate((tag) => [...document.querySelectorAll(`#storybook-root ${tag}`)].filter((each) => each.shadowRoot !== null).length, tag);
      expect({
        upgraded,
        scrollWidth: (await readScrollWidth(page.mainFrame())) <= 320,
        clipped: boxes.filter((box) => box.clipped).map((box) => box.text),
        insideViewport: boxes.filter((box) => box.box.x < -0.5 || box.box.x + box.box.width > 320.5).map((box) => box.text),
        texts: boxes.map((box) => box.text.trim()),
      }).toEqual({ upgraded: count, scrollWidth: true, clipped: [], insideViewport: [], texts: [...texts] });
      await page.close();
    });
  }
});
