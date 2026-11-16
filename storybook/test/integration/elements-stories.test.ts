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

// 008 (tasks.md T052; reviews/phase-4/notes.md § Operator decision: T052): the long-text story's bubble (288 × 91 px)
// lay over the paragraphs above its trigger and crossed their boxes, and axe could not determine its background
// (`color-contrast-incomplete`, `elmPartiallyObscuring`). The operator chose to re-lay the story's markup: the trigger
// sits later inside one long paragraph, so the painted box lies wholly inside that paragraph's box and crosses the box
// of no other element of the story (an element outside the tooltip whose box meets the painted box without holding it).
describe("the ocelle-tooltip long-text story's bubble inside one paragraph (008 T052, operator decision)", { timeout: 60_000 }, () => {
  for (const theme of ["light", "dark"] as const) {
    it(`elements-ocelle-tooltip--long-text in ${theme}: at 1280 × 800 with reduced motion, the mouse on the centre of #tooltip-trigger: the painted box lies wholly inside the box of the paragraph that holds the trigger and crosses the box of no other element of the story`, async () => {
      const selector = "#tooltip-trigger";
      const { page } = await openHovered("elements-ocelle-tooltip--long-text", theme, selector);
      const observed = await page.evaluate((selector) => {
        const trigger = document.querySelector(selector);
        const tooltip = trigger?.closest("ocelle-tooltip") ?? null;
        const paragraph = trigger?.closest("p") ?? null;
        const box = tooltip?.shadowRoot?.querySelector('[part="bubble"]')?.firstElementChild?.getBoundingClientRect();
        if (tooltip === null || paragraph === null || box === undefined) return { paragraph: paragraph !== null, box: box !== undefined };
        const holds = (outer: DOMRect, inner: DOMRect): boolean => outer.left <= inner.left && outer.top <= inner.top && outer.right >= inner.right && outer.bottom >= inner.bottom;
        const meets = (a: DOMRect, b: DOMRect): boolean => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const crossed = [...document.querySelectorAll("#storybook-root *")]
          .filter((each) => !tooltip.contains(each))
          .filter((each) => meets(each.getBoundingClientRect(), box) && !holds(each.getBoundingClientRect(), box))
          .map((each) => `${each.localName}${each.id === "" ? "" : `#${each.id}`}`);
        return { paragraph: true, box: true, insideParagraph: holds(paragraph.getBoundingClientRect(), box), crossed };
      }, selector);
      expect(observed).toEqual({ paragraph: true, box: true, insideParagraph: true, crossed: [] });
      await page.close();
    });
  }
});

// 013 phase 1 (I3; research.md R-08; contracts/checks.md § Story test; tasks.md T011): the `ocelle-facts` stories. Each
// renders its sheets in light and dark, defined, each `ocelle-facts` with the story's `layout`, `density` and `dir`,
// its `ocelle-fact` children and one rendered term per visible fact, with base.css applied and no request outside the
// origin. Each story at a 320 px viewport has a page scroll width of 320, beside a sheet whose inline size is above 0
// (SC-002). Each story under reduced motion, on a fresh load timed by the clock from its first render (within
// 1400 ms) and with `prefers-reduced-motion: reduce` matching, has no running animation or transition (SC-005); no
// facts story animates, so this read is paired with the `matchMedia` assertion only, until the indeterminate progress
// story of phase 3 brings the animation positive (contracts/checks.md § Story test).

/** What one story's sheet must show: its attributes, its fact children and the terms it renders. */
interface Sheet {
  readonly layout: string | null;
  readonly density: string | null;
  readonly dir: string | null;
  readonly facts: number;
  readonly terms: number;
}

const sheetOf = (facts: number, attributes: Partial<Sheet> = {}, terms = facts): Sheet => ({ layout: null, density: null, dir: null, facts, terms, ...attributes });

const factsStories: readonly { readonly id: string; readonly sheets: readonly Sheet[] }[] = [
  { id: "elements-ocelle-facts--default", sheets: [sheetOf(5)] },
  { id: "elements-ocelle-facts--compact", sheets: [sheetOf(3, { density: "compact" })] },
  { id: "elements-ocelle-facts--stacked", sheets: [sheetOf(3)] },
  { id: "elements-ocelle-facts--columns-shrink-to-fit", sheets: [sheetOf(2, { layout: "columns" })] },
  { id: "elements-ocelle-facts--stacked-wide", sheets: [sheetOf(3, { layout: "stacked" })] },
  { id: "elements-ocelle-facts--identifier-wrap", sheets: [sheetOf(2)] },
  { id: "elements-ocelle-facts--missing-label", sheets: [sheetOf(3)] },
  { id: "elements-ocelle-facts--missing-value", sheets: [sheetOf(3)] },
  { id: "elements-ocelle-facts--link-in-value", sheets: [sheetOf(2)] },
  { id: "elements-ocelle-facts--right-to-left", sheets: [sheetOf(3, { dir: "rtl" })] },
  { id: "elements-ocelle-facts--compact-region", sheets: [sheetOf(3)] },
  { id: "elements-ocelle-facts--grid-strip", sheets: [sheetOf(4, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-two-columns", sheets: [sheetOf(4, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-one-column", sheets: [sheetOf(4, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-one-fact", sheets: [sheetOf(1, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-three-facts", sheets: [sheetOf(3, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-eight-facts", sheets: [sheetOf(8, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-long-label-and-identifier", sheets: [sheetOf(4, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-link-and-status", sheets: [sheetOf(3, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-unavailable-value", sheets: [sheetOf(3, { layout: "grid" })] },
  { id: "elements-ocelle-facts--grid-compact", sheets: [sheetOf(4, { layout: "grid", density: "compact" })] },
  { id: "elements-ocelle-facts--grid-right-to-left", sheets: [sheetOf(4, { layout: "grid", dir: "rtl" })] },
];

/** What a facts story's page shows: its theme, the base stylesheet and its sheets. */
function observeFacts(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-facts") !== undefined && customElements.get("ocelle-fact") !== undefined,
    sheets: [...document.querySelectorAll("#storybook-root ocelle-facts")].map((sheet) => ({
      layout: sheet.getAttribute("layout"),
      density: sheet.getAttribute("density"),
      dir: sheet.getAttribute("dir"),
      facts: sheet.querySelectorAll(":scope > ocelle-fact").length,
      terms: sheet.shadowRoot?.querySelectorAll("dt").length ?? 0,
    })),
  }));
}

/** Opens a story on a fresh page with its own viewport width and reduced-motion setting. */
async function openWith(id: string, options: { readonly width: number; readonly reducedMotion: "reduce" | "no-preference" }, element = "ocelle-facts"): Promise<Page> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width: options.width, height: 800 }, reducedMotion: options.reducedMotion });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:light`, { waitUntil: "load" });
  await page.waitForSelector(`#storybook-root ${element}`, { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.evaluate(async (element) => {
    await Promise.all([...document.querySelectorAll(`#storybook-root ${element}`)].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    (window as unknown as { firstRender: number }).firstRender = performance.now();
  }, element);
  return page;
}

describe("the ocelle-facts stories in the built Storybook (013 US1, I3)", { timeout: 60_000 }, () => {
  for (const { id, sheets } of factsStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its sheets with the story's layout, density and dir, one term per fact, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-facts");
        expect({ ...((await observeFacts(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, sheets, outside: [] });
        await page.close();
      });
    }

    it(`${id} at a 320 px viewport: the page scroll width is 320, beside a sheet wider than 0 (SC-002)`, async () => {
      const page = await openWith(id, { width: 320, reducedMotion: "no-preference" });
      const observed = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        sized: [...document.querySelectorAll("#storybook-root ocelle-facts")].some((sheet) => sheet.getBoundingClientRect().width > 0 && (sheet.shadowRoot?.querySelector("dl")?.getBoundingClientRect().width ?? 0) > 0),
      }));
      await page.close();
      expect(observed).toEqual({ scrollWidth: 320, sized: true });
    });

    it(`${id} under reduced motion: within 1400 ms of its first render, with prefers-reduced-motion: reduce matching, no animation or transition runs (SC-005)`, async () => {
      const page = await openWith(id, { width: 1280, reducedMotion: "reduce" });
      const observed = await page.evaluate(() => {
        const elapsed = performance.now() - (window as unknown as { firstRender: number }).firstRender;
        return {
          timing: elapsed < 1400 ? "inside the first iteration" : "read outside the first iteration",
          reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
          running: document.getAnimations().filter((animation) => animation.playState === "running").length,
          rendered: [...document.querySelectorAll("#storybook-root ocelle-facts")].some((sheet) => (sheet.shadowRoot?.querySelectorAll("dt").length ?? 0) > 0),
        };
      });
      await page.close();
      expect(observed).toEqual({ timing: "inside the first iteration", reduce: true, running: 0, rendered: true });
    });
  }
});

// 013 phase 2 (I3; research.md R-08; contracts/checks.md § Story test; tasks.md T027): the `ocelle-empty-state`
// stories but the panel loading one, which phase 3 adds with `ocelle-progress`. Each renders its empty states in light
// and dark, defined, each with the story's `variant` and the elements the story slots in each of its slots, assigned
// there, with base.css applied and no request outside the origin. Each story under reduced motion, on a fresh load
// timed by the clock from its first render (within 1400 ms) and with `prefers-reduced-motion: reduce` matching, has no
// running animation or transition (SC-005); no empty-state story of this phase animates, so this read is paired with
// the `matchMedia` assertion only, until the indeterminate progress story of phase 3 brings the animation positive.

/** What one story's empty state must show: its variant and the number of elements assigned to each of its slots. */
interface State {
  readonly variant: string | null;
  readonly slots: { readonly visual: number; readonly eyebrow: number; readonly heading: number; readonly body: number; readonly actions: number };
}

const stateOf = (slots: Partial<State["slots"]>, variant: string | null = null): State => ({ variant, slots: { visual: 0, eyebrow: 0, heading: 0, body: 0, actions: 0, ...slots } });

const emptyStateStories: readonly { readonly id: string; readonly states: readonly State[] }[] = [
  { id: "elements-ocelle-empty-state--default", states: [stateOf({ visual: 1, heading: 1, body: 1, actions: 1 })] },
  { id: "elements-ocelle-empty-state--panel", states: [stateOf({ visual: 1, heading: 1, body: 1, actions: 1 }, "panel")] },
  { id: "elements-ocelle-empty-state--heading-only", states: [stateOf({ heading: 1 })] },
  { id: "elements-ocelle-empty-state--actions-only", states: [stateOf({ actions: 1 })] },
  { id: "elements-ocelle-empty-state--several-actions-narrow", states: [stateOf({ heading: 1, body: 1, actions: 4 })] },
  { id: "elements-ocelle-empty-state--refusal-with-eyebrow", states: [stateOf({ eyebrow: 1, heading: 1, body: 2, actions: 1 })] },
  { id: "elements-ocelle-empty-state--several-body-paragraphs", states: [stateOf({ heading: 1, body: 3, actions: 1 })] },
];

/** What an empty-state story's page shows: its theme, the base stylesheet and its empty states. */
function observeEmptyStates(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-empty-state") !== undefined,
    states: [...document.querySelectorAll("#storybook-root ocelle-empty-state")].map((state) => {
      const assigned = (selector: string): number => (state.shadowRoot?.querySelector<HTMLSlotElement>(selector)?.assignedElements().length ?? 0);
      return {
        variant: state.getAttribute("variant"),
        slots: {
          visual: assigned('slot[name="visual"]'),
          eyebrow: assigned('slot[name="eyebrow"]'),
          heading: assigned('slot[name="heading"]'),
          body: assigned("slot:not([name])"),
          actions: assigned('slot[name="actions"]'),
        },
      };
    }),
  }));
}

describe("the ocelle-empty-state stories in the built Storybook (013 US2, I3)", { timeout: 60_000 }, () => {
  for (const { id, states } of emptyStateStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its empty states with the story's variant and its slotted elements assigned, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-empty-state");
        expect({ ...((await observeEmptyStates(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, states, outside: [] });
        await page.close();
      });
    }

    it(`${id} under reduced motion: within 1400 ms of its first render, with prefers-reduced-motion: reduce matching, no animation or transition runs (SC-005)`, async () => {
      const page = await openWith(id, { width: 1280, reducedMotion: "reduce" }, "ocelle-empty-state");
      const observed = await page.evaluate(() => {
        const elapsed = performance.now() - (window as unknown as { firstRender: number }).firstRender;
        return {
          timing: elapsed < 1400 ? "inside the first iteration" : "read outside the first iteration",
          reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
          running: document.getAnimations().filter((animation) => animation.playState === "running").length,
          rendered: [...document.querySelectorAll("#storybook-root ocelle-empty-state")].some((state) => state.shadowRoot?.querySelector('[part="body"]') !== null && state.shadowRoot !== null),
        };
      });
      await page.close();
      expect(observed).toEqual({ timing: "inside the first iteration", reduce: true, running: 0, rendered: true });
    });
  }
});

// 013 phase 3 (I3; research.md R-05, R-08; contracts/checks.md § Story test; tasks.md T044): the `ocelle-progress`
// stories and the empty-state panel-loading story. Each renders its bars in light and dark, defined, each with the
// story's attributes and its track drawn, with base.css applied and no request outside the origin. Motion
// (PLAN-FRESH-2-009, PLAN-FRESH-3-005), each read on its own fresh load of the story within the first 1400 ms: without
// reduced motion the indeterminate story's mark runs, its `currentTime` under 1400 ms; under reduced motion, with
// `prefers-reduced-motion: reduce` matching and timed by the clock from the first render, no progress or panel-loading
// story runs an animation or transition (SC-005). Names (PLAN-A11Y-SECURITY-1-005): in every story of the four
// elements, each progressbar node of the accessibility tree has a non-empty name, beside at least one progressbar in
// each progress and panel-loading story; axe does not check this name (R-05).

/** What one story's bar must show: its attributes, and whether its track is drawn. */
interface Bar {
  readonly value: string | null;
  readonly max: string | null;
  readonly label: string | null;
  readonly valueText: string | null;
  readonly showLabel: boolean;
  readonly size: string | null;
  readonly ground: string | null;
  readonly dir: string | null;
  readonly drawn: boolean;
}

const barOf = (attributes: Partial<Bar>): Bar => ({ value: "7", max: "12", label: "Tasks done", valueText: null, showLabel: false, size: null, ground: null, dir: null, drawn: true, ...attributes });

const progressStories: readonly { readonly id: string; readonly bars: readonly Bar[] }[] = [
  { id: "elements-ocelle-progress--determinate", bars: [barOf({})] },
  { id: "elements-ocelle-progress--zero", bars: [barOf({ value: "0" })] },
  { id: "elements-ocelle-progress--full", bars: [barOf({ value: "12" })] },
  { id: "elements-ocelle-progress--indeterminate", bars: [barOf({ value: null, max: null, label: "Loading plan" })] },
  { id: "elements-ocelle-progress--compact", bars: [barOf({ size: "compact" })] },
  { id: "elements-ocelle-progress--labelled", bars: [barOf({ showLabel: true })] },
  { id: "elements-ocelle-progress--labelled-compact", bars: [barOf({ size: "compact", showLabel: true, valueText: "7 of 12" })] },
  { id: "elements-ocelle-progress--value-text", bars: [barOf({ showLabel: true, valueText: "7 of 12" })] },
  { id: "elements-ocelle-progress--right-to-left", bars: [barOf({ showLabel: true, valueText: "7 of 12", dir: "rtl" })] },
  { id: "elements-ocelle-progress--tinted-ground", bars: [barOf({ ground: "tinted" })] },
];

/** What a progress story's page shows: its theme, the base stylesheet and its bars. */
function observeBars(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-progress") !== undefined,
    bars: [...document.querySelectorAll("#storybook-root ocelle-progress")].map((bar) => ({
      value: bar.getAttribute("value"),
      max: bar.getAttribute("max"),
      label: bar.getAttribute("label"),
      valueText: bar.getAttribute("value-text"),
      showLabel: bar.hasAttribute("show-label"),
      size: bar.getAttribute("size"),
      ground: bar.getAttribute("ground"),
      dir: bar.getAttribute("dir"),
      drawn: (bar.shadowRoot?.querySelector('[part="track"]')?.getBoundingClientRect().width ?? 0) > 0,
    })),
  }));
}

describe("the ocelle-progress stories in the built Storybook (013 US3, I3)", { timeout: 60_000 }, () => {
  for (const { id, bars } of progressStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its bars with the story's attributes and their tracks drawn, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-progress");
        expect({ ...((await observeBars(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, bars, outside: [] });
        await page.close();
      });
    }
  }
});

describe("the empty-state panel-loading story in the built Storybook (013 US2-7, US3, I3)", { timeout: 60_000 }, () => {
  for (const theme of ["light", "dark"] as const) {
    it(`elements-ocelle-empty-state--panel-loading in ${theme}: renders a panel empty state with an ocelle-progress in visual and a heading, with base.css applied and no request outside the origin`, async () => {
      const { page, outside } = await open("elements-ocelle-empty-state--panel-loading", theme, "ocelle-empty-state");
      const visual = await page.evaluate(() => [...document.querySelectorAll("#storybook-root ocelle-empty-state")].map((state) => state.shadowRoot?.querySelector<HTMLSlotElement>('slot[name="visual"]')?.assignedElements().map((each) => each.localName)));
      expect({ ...((await observeEmptyStates(page)) as object), visual, outside }).toEqual({
        theme,
        base: { linked: true, scheme: theme },
        defined: true,
        states: [stateOf({ visual: 1, heading: 1 }, "panel")],
        visual: [["ocelle-progress"]],
        outside: [],
      });
      await page.close();
    });
  }
});

/** The ids of the stories that hold a bar: the progress stories and the panel-loading story. */
const barStories = [...progressStories.map(({ id }) => id), "elements-ocelle-empty-state--panel-loading"];

describe("motion in the progress and panel-loading stories (013 SC-005, PLAN-FRESH-2-009, PLAN-FRESH-3-005)", { timeout: 60_000 }, () => {
  it("elements-ocelle-progress--indeterminate without reduced motion: on a fresh load the mark's animation runs, read inside its first 1400 ms iteration", async () => {
    const page = await openWith("elements-ocelle-progress--indeterminate", { width: 1280, reducedMotion: "no-preference" }, "ocelle-progress");
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const observed = await page.evaluate(() => {
      const bar = document.querySelector("#storybook-root ocelle-progress");
      const animations = [bar, ...(bar?.shadowRoot?.querySelectorAll("*") ?? [])].flatMap((each) => each?.getAnimations() ?? []).filter((animation) => animation.playState === "running");
      const time = Number(animations[0]?.currentTime ?? Number.NaN);
      return {
        reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
        running: animations.length,
        timing: Number.isNaN(time) ? "no animation" : time < 1400 ? "inside the first iteration" : "read outside the first iteration",
      };
    });
    await page.close();
    expect(observed).toEqual({ reduce: false, running: 1, timing: "inside the first iteration" });
  });

  for (const id of barStories) {
    it(`${id} under reduced motion: within 1400 ms of its first render, with prefers-reduced-motion: reduce matching, no animation or transition runs, its bar drawn (SC-005)`, async () => {
      const page = await openWith(id, { width: 1280, reducedMotion: "reduce" }, "ocelle-progress");
      const observed = await page.evaluate(() => {
        const elapsed = performance.now() - (window as unknown as { firstRender: number }).firstRender;
        return {
          timing: elapsed < 1400 ? "inside the first iteration" : "read outside the first iteration",
          reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
          running: document.getAnimations().filter((animation) => animation.playState === "running").length,
          drawn: [...document.querySelectorAll("#storybook-root ocelle-progress")].some((bar) => (bar.shadowRoot?.querySelector('[part="track"]')?.getBoundingClientRect().width ?? 0) > 0),
        };
      });
      await page.close();
      expect(observed).toEqual({ timing: "inside the first iteration", reduce: true, running: 0, drawn: true });
    });
  }
});

/** The names of the progressbar nodes of a story page's accessibility tree, read over CDP. */
async function progressbarNames(page: Page): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = (await session.send("Accessibility.getFullAXTree")) as { nodes: { ignored: boolean; role?: { value?: unknown }; name?: { value?: unknown } }[] };
    return nodes.filter((node) => !node.ignored && node.role?.value === "progressbar").map((node) => (typeof node.name?.value === "string" ? node.name.value : ""));
  } finally {
    await session.detach();
  }
}

describe("every progressbar in the stories of the four elements is named (013 PLAN-A11Y-SECURITY-1-005, R-05)", { timeout: 60_000 }, () => {
  const all = [...factsStories.map(({ id }) => ({ id, element: "ocelle-facts" })), ...emptyStateStories.map(({ id }) => ({ id, element: "ocelle-empty-state" })), ...barStories.map((id) => ({ id, element: id.includes("empty-state") ? "ocelle-empty-state" : "ocelle-progress" }))];
  for (const { id, element } of all) {
    const holdsBar = barStories.includes(id);
    it(`${id}: every progressbar node has a non-empty name${holdsBar ? ", and there is at least one" : ""}`, async () => {
      const { page } = await open(id, "light", element);
      if (holdsBar) await page.waitForSelector("#storybook-root ocelle-progress", { state: "attached", timeout: 10_000 }).catch(() => undefined);
      const names = await progressbarNames(page);
      await page.close();
      expect({ unnamed: names.filter((name) => name.trim() === "").length, present: holdsBar ? names.length > 0 : "not required" }).toEqual({ unnamed: 0, present: holdsBar ? true : "not required" });
    });
  }
});
