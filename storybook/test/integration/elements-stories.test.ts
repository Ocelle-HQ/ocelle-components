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
// heading-hidden and direction, in light and dark, with base.css applied and no request outside the origin. Phase 4
// (T050) adds the tooltip's: each page is opened at 1280 × 800 with reduced motion, as the visual and axe gates capture
// it (research.md R-16), and the mouse moved to the centre of the story's trigger, the selector the story's
// `parameters.ocelle.pointer.hover` names; the trigger lies wholly inside the viewport and inside a
// `[data-story="tooltip"]` element whose delay override gives it a computed `--ocelle-tooltip-delay` of 0 ms (the
// Storybook build's minifier writes the override's `0ms` as `0s`, so the test reads the duration), and after
// `fonts.ready` and two frames its bubble is shown on the story's side of the trigger, on top at its centre.
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

/** Opens a tooltip story at 1280 × 800 with reduced motion and moves the mouse to the centre of `selector`. */
async function openHovered(id: string, theme: "light" | "dark", selector: string): Promise<{ readonly page: Page; readonly outside: readonly string[]; readonly inside: boolean }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" });
  // Waits for the story's tooltip, but not past 10 s: a story that never renders is reported by the assertions below.
  await page.waitForSelector("#storybook-root ocelle-tooltip", { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll("#storybook-root *")].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
  });
  const box = await (await page.$(selector))?.boundingBox();
  const inside = box !== null && box !== undefined && box.width > 0 && box.x >= 0 && box.y >= 0 && box.x + box.width <= 1280 && box.y + box.height <= 800;
  await page.mouse.move(box === null || box === undefined ? 0 : box.x + box.width / 2, box === null || box === undefined ? 0 : box.y + box.height / 2);
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let frame = 0; frame < 2; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  return { page, outside, inside };
}

/** What a tooltip story's page shows once hovered: its theme, the base stylesheet, its trigger, tooltips and dialogs. */
function observeTooltips(page: Page, selector: string): Promise<unknown> {
  return page.evaluate((selector) => {
    const trigger = document.querySelector(selector);
    const near = (a: number, b: number): boolean => Math.abs(a - b) < 0.5;
    /** A computed duration in milliseconds (the Storybook build writes the override's `0ms` as `0s`), NaN without a unit. */
    const milliseconds = (text: string): number => (text.endsWith("ms") ? Number.parseFloat(text) : text.endsWith("s") ? Number.parseFloat(text) * 1000 : Number.NaN);
    /** Where the painted box lies against the trigger: the side 8 px (space-2) away, centred on the other axis. */
    const side = (t: DOMRect, b: DOMRect): string => {
      const centredX = near(b.left + b.width / 2, t.left + t.width / 2);
      const centredY = near(b.top + b.height / 2, t.top + t.height / 2);
      if (near(t.top - b.bottom, 8) && centredX) return "above";
      if (near(b.top - t.bottom, 8) && centredX) return "below";
      if (near(t.left - b.right, 8) && centredY) return "left";
      if (near(b.left - t.right, 8) && centredY) return "right";
      return "none";
    };
    return {
      theme: document.documentElement.dataset.theme,
      base: {
        linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
        scheme: getComputedStyle(document.documentElement).colorScheme,
      },
      defined: customElements.get("ocelle-tooltip") !== undefined,
      trigger: trigger === null ? null : { count: document.querySelectorAll(selector).length, wrapped: trigger.closest('[data-story="tooltip"]') !== null, delayMs: milliseconds(getComputedStyle(trigger).getPropertyValue("--ocelle-tooltip-delay").trim()) },
      tooltips: [...document.querySelectorAll("#storybook-root ocelle-tooltip")].map((tooltip) => {
        const part = tooltip.shadowRoot?.querySelector('[part="bubble"]') ?? null;
        const box = part?.firstElementChild?.getBoundingClientRect();
        const own = tooltip.querySelector(":scope > :not([slot])");
        const centre = box === undefined ? null : document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        return {
          placement: tooltip.getAttribute("placement") ?? "top",
          direction: tooltip.matches(":dir(rtl)") ? "rtl" : "ltr",
          shown: part?.matches(":popover-open") === true,
          side: own === null || box === undefined ? "none" : side(own.getBoundingClientRect(), box),
          onTop: centre === tooltip,
        };
      }),
      dialogs: [...document.querySelectorAll("#storybook-root ocelle-dialog")].map((dialog) => ({ shown: dialog.shadowRoot?.querySelector("dialog")?.open === true, modal: dialog.shadowRoot?.querySelector("dialog")?.matches(":modal") === true })),
    };
  }, selector);
}

/** A tooltip shown on `side` of its trigger, on top at its centre. */
const shownTooltip = (placement: "top" | "bottom" | "start" | "end", side: "above" | "below" | "left" | "right", direction: "ltr" | "rtl" = "ltr"): unknown => ({ placement, direction, shown: true, side, onTop: true });

// 008 (tasks.md T050; data-model.md § Stories): hover top; hover bottom; hover start; hover end; flipped at the top
// edge; rtl hover start; rtl hover end; inside an open dialog; long text. Each story's pointer selector, written by
// hand, is the trigger's id `#tooltip-trigger` (an id, R-16), which matches exactly one element of its page.
const tooltipStories = [
  { id: "elements-ocelle-tooltip--hover-top", tooltips: [shownTooltip("top", "above")], dialogs: [] },
  { id: "elements-ocelle-tooltip--hover-bottom", tooltips: [shownTooltip("bottom", "below")], dialogs: [] },
  { id: "elements-ocelle-tooltip--hover-start", tooltips: [shownTooltip("start", "left")], dialogs: [] },
  { id: "elements-ocelle-tooltip--hover-end", tooltips: [shownTooltip("end", "right")], dialogs: [] },
  { id: "elements-ocelle-tooltip--flipped-at-the-top-edge", tooltips: [shownTooltip("top", "below")], dialogs: [] },
  { id: "elements-ocelle-tooltip--rtl-hover-start", tooltips: [shownTooltip("start", "right", "rtl")], dialogs: [] },
  { id: "elements-ocelle-tooltip--rtl-hover-end", tooltips: [shownTooltip("end", "left", "rtl")], dialogs: [] },
  { id: "elements-ocelle-tooltip--inside-an-open-dialog", tooltips: [shownTooltip("top", "above")], dialogs: [{ shown: true, modal: true }] },
  { id: "elements-ocelle-tooltip--long-text", tooltips: [shownTooltip("top", "above")], dialogs: [] },
] as const;

describe("the ocelle-tooltip stories in the built Storybook (008 FR-042)", { timeout: 60_000 }, () => {
  for (const { id, tooltips, dialogs } of tooltipStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: at 1280 × 800 with reduced motion, the mouse on the centre of #tooltip-trigger, which lies inside the viewport and a [data-story="tooltip"] element with a computed --ocelle-tooltip-delay of 0ms: after fonts.ready and two frames the bubble is shown on the story's side, on top, with base.css applied and no request outside the origin`, async () => {
        const selector = "#tooltip-trigger";
        const { page, outside, inside } = await openHovered(id, theme, selector);
        expect({ ...((await observeTooltips(page, selector)) as object), inside, outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          trigger: { count: 1, wrapped: true, delayMs: 0 },
          tooltips,
          dialogs,
          inside: true,
          outside: [],
        });
        await page.close();
      });
    }
  }
});
