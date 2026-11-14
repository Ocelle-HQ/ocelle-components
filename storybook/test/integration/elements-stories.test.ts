import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";
import type { Browser, Page } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";

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
// light and dark, with no request outside the origin. 008 (tasks.md T027; data-model.md § Stories) adds the dialog's
// stories: each renders one open, modal `ocelle-dialog` (its inner `<dialog>` open and `:modal`) with the story's
// `label` or host `aria-label`, in light and dark, with base.css applied and no request outside the origin. Phase 3
// (T038) adds the drawer's: each renders one open, modal `ocelle-drawer` with the story's label, side, ground,
// heading-hidden and direction, in light and dark, with base.css applied and no request outside the origin.
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

/** What a dialog story's page shows: its theme, the base stylesheet and its dialogs. */
function observeDialogs(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-dialog") !== undefined,
    dialogs: [...document.querySelectorAll("#storybook-root ocelle-dialog")].map((dialog) => {
      const panel = dialog.shadowRoot?.querySelector("dialog") ?? null;
      return { label: dialog.getAttribute("label"), ariaLabel: dialog.getAttribute("aria-label"), open: dialog.hasAttribute("open"), shown: panel?.open === true, modal: panel?.matches(":modal") === true };
    }),
  }));
}

/** An open, modal dialog with `label` (and a host `aria-label` when given). */
const shownDialog = (label: string | null, ariaLabel: string | null = null): unknown => ({ label, ariaLabel, open: true, shown: true, modal: true });

const dialogStories = [
  { id: "elements-ocelle-dialog--default", dialogs: [shownDialog("Open project")] },
  { id: "elements-ocelle-dialog--one-line-confirmation", dialogs: [shownDialog("Delete project")] },
  { id: "elements-ocelle-dialog--with-footer-actions", dialogs: [shownDialog("Rename project")] },
  { id: "elements-ocelle-dialog--long-scrolling-body", dialogs: [shownDialog("Licence")] },
  { id: "elements-ocelle-dialog--prose-with-a-table", dialogs: [shownDialog("Mission summary")] },
  { id: "elements-ocelle-dialog--open-project", dialogs: [shownDialog("Open project")] },
  { id: "elements-ocelle-dialog--long-label", dialogs: [shownDialog("Move the selected artifacts of this mission to another project of the workspace")] },
  { id: "elements-ocelle-dialog--host-aria-label", dialogs: [shownDialog(null, "Settings")] },
] as const;

describe("the ocelle-dialog stories in the built Storybook (008 FR-042)", { timeout: 60_000 }, () => {
  for (const { id, dialogs } of dialogStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders an open, modal ocelle-dialog with the story's label, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-dialog");
        expect({ ...((await observeDialogs(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          dialogs,
          outside: [],
        });
        await page.close();
      });
    }
  }
});

/** What a drawer story's page shows: its theme, the base stylesheet and its drawers. */
function observeDrawers(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-drawer") !== undefined,
    drawers: [...document.querySelectorAll("#storybook-root ocelle-drawer")].map((drawer) => {
      const panel = drawer.shadowRoot?.querySelector("dialog") ?? null;
      return {
        label: drawer.getAttribute("label"),
        side: drawer.getAttribute("side"),
        ground: drawer.getAttribute("ground"),
        headingHidden: drawer.hasAttribute("heading-hidden"),
        direction: drawer.matches(":dir(rtl)") ? "rtl" : "ltr",
        open: drawer.hasAttribute("open"),
        shown: panel?.open === true,
        modal: panel?.matches(":modal") === true,
      };
    }),
  }));
}

/** An open, modal drawer with `label` on `side` and `ground`, under `direction`. */
const shownDrawer = (label: string, side: "start" | "end", ground: "sheet" | "chrome", headingHidden = false, direction: "ltr" | "rtl" = "ltr"): unknown => ({ label, side, ground, headingHidden, direction, open: true, shown: true, modal: true });

// 008 (tasks.md T038; data-model.md § Stories): start; end; rtl start; chrome ground; chrome ground with heading-hidden;
// long scrolling body.
const drawerStories = [
  { id: "elements-ocelle-drawer--start", drawers: [shownDrawer("Filters", "start", "sheet")] },
  { id: "elements-ocelle-drawer--end", drawers: [shownDrawer("Details", "end", "sheet")] },
  { id: "elements-ocelle-drawer--rtl-start", drawers: [shownDrawer("Filters", "start", "sheet", false, "rtl")] },
  { id: "elements-ocelle-drawer--chrome-ground", drawers: [shownDrawer("Personal", "start", "chrome")] },
  { id: "elements-ocelle-drawer--chrome-ground-heading-hidden", drawers: [shownDrawer("Personal", "start", "chrome", true)] },
  { id: "elements-ocelle-drawer--long-scrolling-body", drawers: [shownDrawer("Licence", "end", "sheet")] },
] as const;

describe("the ocelle-drawer stories in the built Storybook (008 FR-042)", { timeout: 60_000 }, () => {
  for (const { id, drawers } of drawerStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders an open, modal ocelle-drawer with the story's label, side, ground, heading-hidden and direction, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-drawer");
        expect({ ...((await observeDrawers(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          drawers,
          outside: [],
        });
        await page.close();
      });
    }
  }
});
