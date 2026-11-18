import { existsSync, readFileSync } from "node:fs";
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
// light and dark, with no request outside the origin. Since 009 phase 2 (T020; research.md R-15, R-17): the six
// `ocelle-scroller` stories of contracts/elements.md § Stories, each in light and dark rendering its scrollers (defined,
// with the story's label, direction, tab stop and scroll position), with no `style` attribute and no class on the
// story's markup (the light DOM it renders, not the elements' shadow trees) and no request outside the origin; and the
// `[data-frame]` rules of storybook/.storybook/stories-layout.css, which are a copy of the one frame source,
// packages/elements/test/fixtures/frames.css. No CSP violation is counted: the Storybook is not a CSP target (006
// FR-020), strict CSP is proved in the elements-browser fixtures. Since 009 phase 3 (T037): the five
// `ocelle-workflow-board` and six `ocelle-workflow-lane` stories of contracts/elements.md § Stories, each in light and
// dark rendering its boards (defined, with the story's label, direction, lanes, tab stop, region and scroll position)
// or its lane (with the story's title, count and variant, and its group's name), with no `style` attribute and no class
// on the story's markup and no request outside the origin. Since 009 phase 4 (T053): the six `ocelle-list-detail` stories
// of contracts/elements.md § Stories, each in light and dark rendering its list-detail (defined, with the story's
// direction, `detail-open` and `narrow`, and the layout its panes show), with no `style` attribute and no class on the
// story's markup and no request outside the origin.
// 008 (tasks.md T027; data-model.md § Stories) adds the dialog's
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
// 011 phase 2 (T017; FR-033, SC-002; research.md R-14, operator decision PLAN-CORRECTNESS-1-009 (a)) adds the
// section-header and card stories: each renders its elements with their slotted content in light and dark, and, loaded
// at 320 × 800 px, the document does not scroll horizontally and no slotted text node is clipped
// (packages/elements/test/commands.ts `readTextBoxes`), beside the same content rendered. Phase 3 (T028) adds the
// page-header stories, with the same checks, phase 4 (T035) the context-sidebar stories and phase 5 (T043) the
// personal-rail stories.
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

/**
 * What a scroller story's page shows: its theme, its scrollers' state, and any style attribute or class on its markup.
 * It reads after `fonts.ready` and two animation frames, as `openHovered` does (O5-01, T084): a layout change before the
 * read, such as a late font, has had the frame in which the story's `ResizeObserver` writes the position again.
 */
function observeScrollers(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    for (let frame = 0; frame < 2; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
    const root = document.getElementById("storybook-root");
    const markup = [...(root?.querySelectorAll("*") ?? [])];
    return {
      theme: document.documentElement.dataset.theme,
      defined: customElements.get("ocelle-scroller") !== undefined,
      styled: markup.filter((element) => element.hasAttribute("style") || element.hasAttribute("class")).map((element) => element.localName),
      scrollers: [...(root?.querySelectorAll("ocelle-scroller") ?? [])].map((scroller) => {
        const box = scroller.shadowRoot?.querySelector<HTMLElement>(".region-box");
        const at = Math.abs(box?.scrollLeft ?? 0);
        const room = (box?.scrollWidth ?? 0) - (box?.clientWidth ?? 0);
        const position = room <= 1 ? "fits" : at <= 1 ? "start" : room - at <= 1 ? "end" : "middle";
        return { label: scroller.getAttribute("label"), direction: getComputedStyle(scroller).direction, tabStop: box?.getAttribute("tabindex") === "0", role: box?.getAttribute("role") ?? null, position };
      }),
    };
  });
}

const scroller = (position: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({ label: "Filters", direction: "ltr", tabStop: position !== "fits", role: position === "fits" ? null : "group", position, ...extra });

const scrollerStories = [
  { id: "elements-ocelle-scroller--fits", scrollers: [scroller("fits")] },
  { id: "elements-ocelle-scroller--overflowing-at-start", scrollers: [scroller("start")] },
  { id: "elements-ocelle-scroller--overflowing-in-the-middle", scrollers: [scroller("middle")] },
  { id: "elements-ocelle-scroller--overflowing-at-the-end", scrollers: [scroller("end")] },
  { id: "elements-ocelle-scroller--right-to-left", scrollers: [scroller("start", { direction: "rtl" })] },
  { id: "elements-ocelle-scroller--unlabelled", scrollers: [scroller("start", { label: null, role: null })] },
] as const;

describe("the ocelle-scroller stories in the built Storybook (009 FR-032, T020)", { timeout: 60_000 }, () => {
  for (const { id, scrollers } of scrollerStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-scroller with the story's label, direction and scroll position, with no style attribute or class on its markup and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-scroller");
        expect({ ...((await observeScrollers(page)) as object), outside }).toEqual({ theme, defined: true, styled: [], scrollers, outside: [] });
        await page.close();
      });
    }
  }
});

/**
 * The scroll figures of the story's one scroller's box: its scroll range and its distance from the start, read after
 * `fonts.ready` and two animation frames, as `openHovered` does (O5-01, T084), so that a layout change before the read
 * has had the frame in which the story's `ResizeObserver` writes the position again.
 */
function scrollFigures(page: Page): Promise<{ readonly range: number; readonly at: number }> {
  return page.evaluate(async () => {
    await document.fonts.ready;
    for (let frame = 0; frame < 2; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
    const box = document.querySelector("#storybook-root ocelle-scroller")?.shadowRoot?.querySelector<HTMLElement>(".region-box");
    return { range: (box?.scrollWidth ?? 0) - (box?.clientWidth ?? 0), at: Math.abs(box?.scrollLeft ?? 0) };
  });
}

// Since 009 phase 2's operator round 3 (O3-01, T067; research.md R-15): the strip can grow after the story's first
// scroll write (CI run 43791016532: a font loading late left "Overflowing at the end" short of its end). The case grows
// it deterministically: once the first position is observed, it appends sentence-length chips (no style attribute, no
// class) to the story's scroller, so that the scroll range grows by at least 200 px, and waits two animation frames. The
// end story is then at its end and the middle story within 1 px of half the new range, with nothing styled and no
// request outside the origin.
const growing = [
  { id: "elements-ocelle-scroller--overflowing-in-the-middle", share: 0.5 },
  { id: "elements-ocelle-scroller--overflowing-at-the-end", share: 1 },
] as const;

describe("the mid-scroll ocelle-scroller stories hold their share of the scroll range when the strip grows after the first write (009 R-15, O3-01, T067)", { timeout: 60_000 }, () => {
  for (const { id, share } of growing) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: after sentence-length chips are appended, the scroll position is ${String(share)} of the new scroll range within 1 px`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-scroller");
        const first = await scrollFigures(page);
        await page.evaluate(() => {
          const scroller = document.querySelector("#storybook-root ocelle-scroller");
          for (const text of ["Assigned to the release train", "Waiting for the design review", "Blocked by the accessibility audit"]) {
            const chip = document.createElement("button");
            chip.type = "button";
            chip.textContent = text;
            scroller?.append(" ", chip);
          }
        });
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const grown = await scrollFigures(page);
        const { styled } = (await observeScrollers(page)) as { styled: unknown };
        expect({
          first: Math.abs(first.at - first.range * share) <= 1,
          grewBy200: grown.range - first.range >= 200,
          held: Math.abs(grown.at - grown.range * share) <= 1,
          styled,
          outside,
        }).toEqual({ first: true, grewBy200: true, held: true, styled: [], outside: [] });
        await page.close();
      });
    }
  }
});

/** The chips a late layout change appends to the story's scroller (O5-01, T083), the same sentences as T067's. */
function changeLayoutLate(): void {
  const scroller = document.querySelector("#storybook-root ocelle-scroller");
  const box = scroller?.shadowRoot?.querySelector<HTMLElement>(".region-box");
  const before = (box?.scrollWidth ?? 0) - (box?.clientWidth ?? 0);
  for (const text of ["Assigned to the release train", "Waiting for the design review", "Blocked by the accessibility audit"]) {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.textContent = text;
    scroller?.append(" ", chip);
  }
  (window as unknown as { lateGrowth?: number }).lateGrowth = (box?.scrollWidth ?? 0) - (box?.clientWidth ?? 0) - before;
}

/**
 * Makes the strip's layout change late, deterministically (O5-01, T083): the next `page.evaluate` on `page` first
 * runs `changeLayoutAtNextRead`'s change, in the same task as what that evaluate reads, so the change lands after the
 * read starts and no frame (and so no `ResizeObserver` delivery) lies between the change and a read that does not
 * wait. This is the race of CI run 44087406429 (a layout change, such as a late font, just before the first read),
 * placed where it bites every time. Later evaluates are not changed.
 */
function changeLayoutAtNextRead(page: Page): void {
  const evaluate = page.evaluate.bind(page);
  Object.defineProperty(page, "evaluate", {
    configurable: true,
    value: (read: unknown): Promise<unknown> => {
      Reflect.deleteProperty(page, "evaluate");
      return evaluate(`(${changeLayoutLate.toString()})(), (${String(read)})()`);
    },
  });
}

// Since 009 phase 2's operator round 5 (O5-01, T083; research.md R-15): CI run 44087406429 failed T067's middle story
// in light on `first`, the first position read as soon as `open()` returned, before the story's `ResizeObserver` had
// written the position again after a late layout change. The case makes that change land as the first read starts
// (three sentence-length chips, growing the scroll range by at least 200 px) and reads the first position with T067's
// reads: the position read must be the story's share of the range as the layout settles.
describe("the mid-scroll ocelle-scroller stories' first position is read after a late layout change settles (009 R-15, O5-01, T083)", { timeout: 60_000 }, () => {
  for (const { id, share } of growing) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: when the strip grows as the first read starts, the first position read is ${String(share)} of the scroll range within 1 px`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-scroller");
        changeLayoutAtNextRead(page);
        const first = await scrollFigures(page);
        const lateGrowth = await page.evaluate(() => (window as unknown as { lateGrowth?: number }).lateGrowth ?? 0);
        expect({ first: Math.abs(first.at - first.range * share) <= 1, grewBy200: lateGrowth >= 200, outside }).toEqual({ first: true, grewBy200: true, outside: [] });
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

/** What a board or lane story's page shows: its theme, its boards' and lanes' state, and any style attribute or class on its markup. */
function observeWorkflow(page: Page, element: string): Promise<unknown> {
  return page.evaluate((element) => {
    const root = document.getElementById("storybook-root");
    const markup = [...(root?.querySelectorAll("*") ?? [])];
    return {
      theme: document.documentElement.dataset.theme,
      defined: customElements.get(element) !== undefined,
      styled: markup.filter((element) => element.hasAttribute("style") || element.hasAttribute("class")).map((element) => element.localName),
      boards: [...(root?.querySelectorAll("ocelle-workflow-board") ?? [])].map((board) => {
        const box = board.shadowRoot?.querySelector<HTMLElement>(".region-box");
        const at = Math.abs(box?.scrollLeft ?? 0);
        const room = (box?.scrollWidth ?? 0) - (box?.clientWidth ?? 0);
        const position = room <= 1 ? "fits" : at <= 1 ? "start" : room - at <= 1 ? "end" : "middle";
        return {
          label: board.getAttribute("label"),
          direction: getComputedStyle(board).direction,
          lanes: board.querySelectorAll(":scope > ocelle-workflow-lane").length,
          tabStop: box?.getAttribute("tabindex") === "0",
          role: box?.getAttribute("role") ?? null,
          position,
        };
      }),
      lanes: [...(root?.querySelectorAll("ocelle-workflow-lane") ?? [])]
        .filter((lane) => lane.parentElement?.localName !== "ocelle-workflow-board")
        .map((lane) => ({
          label: lane.getAttribute("label"),
          count: lane.getAttribute("count"),
          variant: lane.getAttribute("variant"),
          group: lane.shadowRoot?.querySelector('[role="group"]')?.getAttribute("aria-label") ?? null,
        })),
    };
  }, element);
}

const workflowBoard = (lanes: number, position: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({
  label: "Workflow",
  direction: "ltr",
  lanes,
  tabStop: position !== "fits",
  role: position === "fits" ? null : "region",
  position,
  ...extra,
});

const boardStories = [
  { id: "elements-ocelle-workflow-board--five-lanes", boards: [workflowBoard(5, "fits")] },
  { id: "elements-ocelle-workflow-board--five-lanes-narrow", boards: [workflowBoard(5, "start")] },
  { id: "elements-ocelle-workflow-board--one-lane", boards: [workflowBoard(1, "fits")] },
  { id: "elements-ocelle-workflow-board--no-lanes", boards: [workflowBoard(0, "fits")] },
  { id: "elements-ocelle-workflow-board--right-to-left", boards: [workflowBoard(5, "start", { direction: "rtl" })] },
] as const;

describe("the ocelle-workflow-board stories in the built Storybook (009 FR-032, T037)", { timeout: 60_000 }, () => {
  for (const { id, boards } of boardStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-workflow-board with the story's label, direction, lanes and scroll position, with no style attribute or class on its markup and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-workflow-board");
        expect({ ...((await observeWorkflow(page, "ocelle-workflow-board")) as object), outside }).toEqual({ theme, defined: true, styled: [], boards, lanes: [], outside: [] });
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

const workflowLane = (label: string | null, count: string | null, variant: string | null, group: string): Record<string, unknown> => ({ label, count, variant, group });

const laneStories = [
  { id: "elements-ocelle-workflow-lane--default-with-count", lanes: [workflowLane("Ready", "3", null, "Ready, 3")] },
  { id: "elements-ocelle-workflow-lane--default-without-count", lanes: [workflowLane("Ready", null, null, "Ready")] },
  { id: "elements-ocelle-workflow-lane--flat-with-count", lanes: [workflowLane("Ready", "3", "flat", "Ready, 3")] },
  { id: "elements-ocelle-workflow-lane--flat-without-count", lanes: [workflowLane("Ready", null, "flat", "Ready")] },
  {
    id: "elements-ocelle-workflow-lane--long-title",
    lanes: [workflowLane("Waiting for review by the operator and the squad", "12", null, "Waiting for review by the operator and the squad, 12")],
  },
  { id: "elements-ocelle-workflow-lane--untitled-with-count", lanes: [workflowLane(null, "3", null, "3")] },
] as const;

describe("the ocelle-workflow-lane stories in the built Storybook (009 FR-032, T037)", { timeout: 60_000 }, () => {
  for (const { id, lanes } of laneStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-workflow-lane with the story's title, count and variant and its group's name, with no style attribute or class on its markup and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-workflow-lane");
        expect({ ...((await observeWorkflow(page, "ocelle-workflow-lane")) as object), outside }).toEqual({ theme, defined: true, styled: [], boards: [], lanes, outside: [] });
        await page.close();
      });
    }
  }
});

/** What a list-detail story's page shows: its theme, each list-detail's direction, attributes and layout, and any style attribute or class on its markup. */
function observeListDetail(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    // Two animation frames first: the element's ResizeObserver and measurement pass run in the first.
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const root = document.getElementById("storybook-root");
    const markup = [...(root?.querySelectorAll("*") ?? [])];
    return {
      theme: document.documentElement.dataset.theme,
      defined: customElements.get("ocelle-list-detail") !== undefined,
      styled: markup.filter((element) => element.hasAttribute("style") || element.hasAttribute("class")).map((element) => element.localName),
      listDetails: [...(root?.querySelectorAll("ocelle-list-detail") ?? [])].map((element) => {
        const box = (pane: string): DOMRect | null => {
          const wrapper = element.shadowRoot?.querySelector(`.pane.${pane}`);
          return wrapper === null || wrapper === undefined || getComputedStyle(wrapper).display === "none" ? null : wrapper.getBoundingClientRect();
        };
        const [list, detail, inspector] = [box("list"), box("detail"), box("inspector")];
        const stacked = inspector !== null && detail !== null && inspector.y >= detail.y + detail.height - 0.5;
        const layout = list !== null && detail !== null ? (inspector !== null && !stacked ? "three" : "two") : list !== null ? "one: list" : detail !== null ? "one: detail" : "none";
        return {
          direction: getComputedStyle(element).direction,
          detailOpen: element.hasAttribute("detail-open"),
          narrow: element.hasAttribute("narrow"),
          inspector: element.querySelector(':scope > [slot="inspector"]') !== null,
          layout,
        };
      }),
    };
  });
}

const listDetail = (layout: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({ direction: "ltr", detailOpen: false, narrow: false, inspector: true, layout, ...extra });

const listDetailStories = [
  { id: "elements-ocelle-list-detail--three-columns", listDetails: [listDetail("three")] },
  { id: "elements-ocelle-list-detail--two-columns-inspector-stacked", listDetails: [listDetail("two")] },
  { id: "elements-ocelle-list-detail--one-column-list", listDetails: [listDetail("one: list")] },
  { id: "elements-ocelle-list-detail--one-column-detail", listDetails: [listDetail("one: detail", { detailOpen: true })] },
  { id: "elements-ocelle-list-detail--no-inspector", listDetails: [listDetail("two", { inspector: false })] },
  { id: "elements-ocelle-list-detail--right-to-left", listDetails: [listDetail("three", { direction: "rtl" })] },
] as const;

describe("the ocelle-list-detail stories in the built Storybook (009 FR-032, T053)", { timeout: 60_000 }, () => {
  for (const { id, listDetails } of listDetailStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-list-detail with the story's direction, detail-open and layout, with no style attribute or class on its markup and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-list-detail");
        expect({ ...((await observeListDetail(page)) as object), outside }).toEqual({ theme, defined: true, styled: [], listDetails, outside: [] });
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

/** A file of the repository, relative to storybook/, or "" when it does not exist. */
function repositoryFile(path: string): string {
  const url = new URL(`../../${path}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}

/** The `[data-frame="…"] { … }` rules of a stylesheet, each with its whitespace collapsed, in order. */
function frameRules(text: string): string[] {
  const withoutComments = text.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/\[data-frame="[^"]*"\]\s*\{[^}]*\}/g)].map((match) => match[0].replace(/\s+/g, " ").trim());
}

describe("the story frames (009 research.md R-15, R-17; T020)", () => {
  it("storybook/.storybook/stories-layout.css holds the [data-frame] rules of packages/elements/test/fixtures/frames.css, exactly, in order", () => {
    const source = frameRules(repositoryFile("../packages/elements/test/fixtures/frames.css"));
    expect(source).toEqual([
      '[data-frame="W"] { inline-size: 876px; }',
      '[data-frame="R"] { inline-size: 1196px; }',
      '[data-frame="N"] { inline-size: 636px; }',
      '[data-frame="S"] { inline-size: 288px; }',
    ]);
    expect(frameRules(repositoryFile(".storybook/stories-layout.css"))).toEqual(source);
  });
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

// The composed ocelle-dialog + ocelle-listbox story (014 FR-054; research.md R-12 "Amendment: the composed story";
// reviews/phase-7/round-2.md O2-01; T114), as 008's composed tooltip story ("Inside an open dialog") is: an open, modal
// `ocelle-dialog` labelled "Open project" whose body holds the five-folder `ocelle-listbox` with `gamma` selected. On
// open the dialog moves focus to the first focusable element of its body (008 FR-007), which is the listbox's single
// tab stop, the selected option (US1 roving tabindex), so `gamma` is focused. The listbox lies inside that dialog and
// the centre of the `gamma` option hits that option (inside the modal, not behind it). Axe with the axe gate's full
// rule set reports no violation and no serious or critical incomplete, with no new exception (R-12).
describe("the composed ocelle-dialog + ocelle-listbox story in the built Storybook (014 FR-054, O2-01)", { timeout: 60_000 }, () => {
  const id = "elements-ocelle-listbox--inside-an-open-dialog";
  for (const theme of ["light", "dark"] as const) {
    it(`${id} in ${theme}: renders an open, modal ocelle-dialog "Open project" holding the five-folder listbox with gamma selected and focused, the gamma option on top at its centre, and axe's full rule set reports no violation and no serious or critical incomplete`, async () => {
      const { page, outside } = await open(id, theme, "ocelle-option");
      await page.evaluate(async () => {
        await Promise.all([...document.querySelectorAll("#storybook-root ocelle-dialog, #storybook-root ocelle-listbox")].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const dialogs = await observeDialogs(page);
      const listboxes = await observeListboxes(page);
      const placed = await page.evaluate(() => {
        const dialog = document.querySelector("#storybook-root ocelle-dialog");
        const listbox = document.querySelector("#storybook-root ocelle-listbox");
        const option = listbox?.querySelector('ocelle-option[value="gamma"]') ?? null;
        const box = option?.getBoundingClientRect();
        return {
          inDialog: dialog !== null && listbox !== null && listbox.closest("ocelle-dialog") === dialog,
          onTop: box === undefined ? false : document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2) === option,
        };
      });
      const results = await axeResults(page);
      expect({
        dialogs,
        listboxes,
        placed,
        violations: results.violations,
        incomplete: results.incomplete.filter((each) => each.impact === "serious" || each.impact === "critical"),
        outside,
      }).toEqual({
        dialogs: { theme, base: { linked: true, scheme: theme }, defined: true, dialogs: [shownDialog("Open project")] },
        listboxes: { theme, defined: [true, true], listboxes: [{ value: "gamma", scrolls: false, options: folderOptions("gamma", "", "gamma") }] },
        placed: { inDialog: true, onTop: true },
        violations: [],
        incomplete: [],
        outside: [],
      });
      await page.close();
    });
  }
});

/**
 * Runs axe-core on a story page with the axe gate's full rule set and context, as `axeViolations` does, and returns each
 * violation's and each incomplete result's rule id and impact (014 FR-051, research.md R-02: the gate counts a serious or
 * critical incomplete as a finding).
 */
async function axeResults(page: Page): Promise<{ readonly violations: { readonly id: string; readonly impact: string | null }[]; readonly incomplete: { readonly id: string; readonly impact: string | null }[] }> {
  await page.addScriptTag({ content: axeScript });
  const rules = await page.evaluate(() => (window as unknown as { axe: { _audit: { rules: AxeRule[] } } }).axe._audit.rules.map((rule) => ({ id: rule.id, tags: [...rule.tags], enabled: rule.enabled, ...(rule.selector === undefined ? {} : { selector: rule.selector }) })));
  const options = { rules: ruleOptions(ruleMeta(rules)), context: axeContext() };
  return page.evaluate(async ({ rules, context }) => {
    interface Result {
      id: string;
      impact?: string | null;
    }
    const axe = (window as unknown as { axe: { run: (context: unknown, options: unknown) => Promise<{ violations: Result[]; incomplete: Result[] }> } }).axe;
    const results = await axe.run(context, { rules, resultTypes: ["violations", "incomplete"] });
    const project = (each: Result): { id: string; impact: string | null } => ({ id: each.id, impact: each.impact ?? null });
    return { violations: results.violations.map(project), incomplete: results.incomplete.map(project) };
  }, options);
}

/** What a tabs story's page shows: its theme, whether the three elements are defined, its tabs and their panels. */
function observeTabs(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {
      theme: document.documentElement.dataset.theme,
      defined: ["ocelle-tabs", "ocelle-tab", "ocelle-tab-panel"].map((tag) => customElements.get(tag) !== undefined),
      tabs: [...document.querySelectorAll("#storybook-root ocelle-tabs")].map((tabs) => {
        const children = [...tabs.children];
        return {
          value: (tabs as unknown as { value?: unknown }).value,
          rows: new Set(children.filter((child) => child.localName === "ocelle-tab").map((child) => Math.round(child.getBoundingClientRect().y))).size,
          tabs: children
            .filter((child) => child.localName === "ocelle-tab")
            .map((child) => ({ text: child.textContent.trim(), selected: child.getAttribute("aria-selected"), disabled: child.getAttribute("aria-disabled") === "true", focused: child === active })),
          panels: children.filter((child) => child.localName === "ocelle-tab-panel").map((child) => ({ shown: child.getClientRects().length > 0, focused: child === active })),
        };
      }),
    };
  });
}

/** The tabs of `names`: `selected` the selected one, `disabled` the disabled one, `focused` the focused one. */
function viewTabs(names: readonly string[], selected: string, disabled = "", focused = ""): unknown[] {
  return names.map((text) => ({ text, selected: text === selected ? "true" : "false", disabled: text === disabled, focused: text === focused }));
}

/** The panels of `count` tabs: the `shown`-th shown, the `focused`-th focused. */
function viewPanels(count: number, shown: number, focused = -1): unknown[] {
  return Array.from({ length: count }, (_, index) => ({ shown: index === shown, focused: index === focused }));
}

const missionViews = ["Spec", "Plan", "Tasks"];
const wrappedViews = ["Specification", "Planning", "Research", "Contracts", "Quickstart", "Tasks"];

// The tabs stories (014 FR-050, FR-051; research.md R-01, R-02, R-12; T045): each story renders its tabs with the
// states the tabs write and only the selected tab's panel shown, in light and dark, and axe with the axe gate's full
// rule set reports no violation and no serious or critical incomplete (plant: `aria-labelledby` on every panel, which
// makes axe-core 4.14.0's color-contrast throw on the tabs whose panel is unassigned, reviews/phase-3/spike.md). The
// wrapped story's tabs lie on more than one row; the focus stories' targets have focus after their `play`.
const tabsStories = [
  { id: "elements-ocelle-tabs--first-selected", tabs: [{ value: "spec", rows: 1, tabs: viewTabs(missionViews, "Spec"), panels: viewPanels(3, 0) }] },
  { id: "elements-ocelle-tabs--another-selected", tabs: [{ value: "plan", rows: 1, tabs: viewTabs(missionViews, "Plan"), panels: viewPanels(3, 1) }] },
  { id: "elements-ocelle-tabs--disabled-tab", tabs: [{ value: "spec", rows: 1, tabs: viewTabs(missionViews, "Spec", "Plan"), panels: viewPanels(3, 0) }] },
  { id: "elements-ocelle-tabs--wrapped-rows", tabs: [{ value: "research", rows: 2, tabs: viewTabs(wrappedViews, "Research"), panels: viewPanels(6, 2) }] },
  { id: "elements-ocelle-tabs--focused-tab", tabs: [{ value: "spec", rows: 1, tabs: viewTabs(missionViews, "Spec", "", "Plan"), panels: viewPanels(3, 0) }] },
  { id: "elements-ocelle-tabs--hovered-tab", tabs: [{ value: "spec", rows: 1, tabs: viewTabs(missionViews, "Spec"), panels: viewPanels(3, 0) }] },
  { id: "elements-ocelle-tabs--focused-tab-panel", tabs: [{ value: "plan", rows: 1, tabs: viewTabs(missionViews, "Plan"), panels: viewPanels(3, 1, 1) }] },
  { id: "elements-ocelle-tabs--tab-with-icon", tabs: [{ value: "files", rows: 1, tabs: viewTabs(["Files", "Search"], "Files"), panels: viewPanels(2, 0) }] },
] as const;

describe("the ocelle-tabs stories in the built Storybook (014 FR-050, FR-051)", { timeout: 60_000 }, () => {
  for (const { id, tabs } of tabsStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its tabs with the states the tabs write and the selected panel shown, and axe's full rule set reports no violation and no serious or critical incomplete`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-tab");
        const observed = await observeTabs(page);
        const results = await axeResults(page);
        expect({
          observed,
          violations: results.violations,
          incomplete: results.incomplete.filter((each) => each.impact === "serious" || each.impact === "critical"),
          outside,
        }).toEqual({ observed: { theme, defined: [true, true, true], tabs }, violations: [], incomplete: [], outside: [] });
        await page.close();
      });
    }
  }
});

/** What a segmented-choice story's page shows: its theme, whether both elements are defined, its groups and their segments. */
function observeSegments(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {
      theme: document.documentElement.dataset.theme,
      defined: ["ocelle-segmented-choice", "ocelle-segment"].map((tag) => customElements.get(tag) !== undefined),
      groups: [...document.querySelectorAll("#storybook-root ocelle-segmented-choice")].map((group) => {
        const segments = [...group.children].filter((child) => child.localName === "ocelle-segment");
        return {
          value: (group as unknown as { value?: unknown }).value,
          joined: group.hasAttribute("joined"),
          rows: new Set(segments.map((child) => Math.round(child.getBoundingClientRect().y))).size,
          segments: segments.map((child) => ({ text: child.textContent.trim(), pressed: child.getAttribute("aria-pressed"), disabled: child.getAttribute("aria-disabled") === "true", focused: child === active })),
        };
      }),
    };
  });
}

/** The segments of `names`: `pressed` the pressed one, `disabled` the disabled one, `focused` the focused one. */
function laneSegments(names: readonly string[], pressed: string, disabled = "", focused = ""): unknown[] {
  return names.map((text) => ({ text, pressed: text === pressed ? "true" : "false", disabled: text === disabled, focused: text === focused }));
}

const laneNames = ["All", "Mine", "Blocked", "Done"];

// The segmented-choice stories (014 FR-050, FR-051; research.md R-01, R-06, R-12; T064): each story renders its group
// with the states the group writes, in light and dark, and axe with the axe gate's full rule set reports no violation and
// no serious or critical incomplete (no new entry in a11y-exceptions.json, FR-051). The joined stories carry `joined`;
// the wrapped story's segments lie on two rows, the others on one; the focused story's target has focus after its
// `play`.
const segmentedStories = [
  { id: "elements-ocelle-segmented-choice--default", groups: [{ value: "all", joined: false, rows: 1, segments: laneSegments(laneNames, "All") }] },
  { id: "elements-ocelle-segmented-choice--joined-one-row", groups: [{ value: "all", joined: true, rows: 1, segments: laneSegments(laneNames, "All") }] },
  { id: "elements-ocelle-segmented-choice--joined-wrapped", groups: [{ value: "mine", joined: true, rows: 2, segments: laneSegments(laneNames, "Mine") }] },
  { id: "elements-ocelle-segmented-choice--pressed", groups: [{ value: "blocked", joined: false, rows: 1, segments: laneSegments(laneNames, "Blocked") }] },
  { id: "elements-ocelle-segmented-choice--disabled-segment", groups: [{ value: "all", joined: false, rows: 1, segments: laneSegments(laneNames, "All", "Mine") }] },
  { id: "elements-ocelle-segmented-choice--focused-segment", groups: [{ value: "all", joined: false, rows: 1, segments: laneSegments(laneNames, "All", "", "Mine") }] },
  { id: "elements-ocelle-segmented-choice--hovered-segment", groups: [{ value: "all", joined: false, rows: 1, segments: laneSegments(laneNames, "All") }] },
  { id: "elements-ocelle-segmented-choice--hovered-joined-segment", groups: [{ value: "all", joined: true, rows: 1, segments: laneSegments(laneNames, "All") }] },
  { id: "elements-ocelle-segmented-choice--segment-with-icon", groups: [{ value: "files", joined: false, rows: 1, segments: laneSegments(["Files", "Table"], "Files") }] },
] as const;

describe("the ocelle-segmented-choice stories in the built Storybook (014 FR-050, FR-051)", { timeout: 60_000 }, () => {
  for (const { id, groups } of segmentedStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its segments with the states the group writes, and axe's full rule set reports no violation and no serious or critical incomplete`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-segment");
        const observed = await observeSegments(page);
        const results = await axeResults(page);
        expect({
          observed,
          violations: results.violations,
          incomplete: results.incomplete.filter((each) => each.impact === "serious" || each.impact === "critical"),
          outside,
        }).toEqual({ observed: { theme, defined: [true, true], groups }, violations: [], incomplete: [], outside: [] });
        await page.close();
      });
    }
  }
});

/** What a copy-field story's page shows: its theme, whether the field and the icon are defined, and each field's state. */
function observeCopyFields(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {
      theme: document.documentElement.dataset.theme,
      defined: ["ocelle-copy-field", "ocelle-icon"].map((tag) => customElements.get(tag) !== undefined),
      fields: [...document.querySelectorAll("#storybook-root ocelle-copy-field")].map((field) => {
        const root = field.shadowRoot;
        const text = root?.querySelector<HTMLElement>('[part~="value"]');
        const control = root?.querySelector<HTMLButtonElement>('[part~="copy-control"]');
        const lineHeight = text === null || text === undefined ? 0 : Number.parseFloat(getComputedStyle(text).lineHeight);
        const height = text === null || text === undefined ? 0 : text.getBoundingClientRect().height - Number.parseFloat(getComputedStyle(text).paddingTop) - Number.parseFloat(getComputedStyle(text).paddingBottom);
        return {
          value: (field as unknown as { value?: unknown }).value,
          status: root?.querySelector('[role="status"]')?.textContent ?? null,
          wrapped: lineHeight > 0 && Math.round(height / lineHeight) > 1,
          disabled: control?.disabled ?? null,
          name: control?.getAttribute("aria-label") ?? null,
          focused: control !== null && control !== undefined && control === active,
          icon: control?.querySelector("ocelle-icon")?.getAttribute("name") ?? null,
        };
      }),
    };
  });
}

const manifestCommand = "pnpm --filter @ocelle/elements run manifest";
const implementCommand = "spec-kitty agent workflow implement --mission 014-selection-input --phase 5 --base main --worktree .worktrees/014-selection-input-phase-5 --no-push";

/** A field as `observeCopyFields` reads it. */
function copyField(value: string, options: { readonly status?: string; readonly wrapped?: boolean; readonly name?: string; readonly focused?: boolean } = {}): unknown {
  return { value, status: options.status ?? "", wrapped: options.wrapped === true, disabled: value === "", name: options.name ?? "Copy", focused: options.focused === true, icon: "copy" };
}

// The copy-field stories (014 FR-050, FR-051; research.md R-07, R-12; T079): each story renders its field with the
// state it states, in light and dark, and axe with the axe gate's full rule set reports no violation and no serious or
// critical incomplete (no new entry in a11y-exceptions.json, FR-051). The wrapped story's long command lies on more
// than one line at the story's 320 px, the others on one; the status story shows its status in the live region;
// the empty story's control is disabled; the focused story's control has focus after its `play`.
const copyFieldStories = [
  { id: "elements-ocelle-copy-field--short", fields: [copyField(manifestCommand)] },
  { id: "elements-ocelle-copy-field--wrapped-long-command", fields: [copyField(implementCommand, { wrapped: true })] },
  { id: "elements-ocelle-copy-field--with-status", fields: [copyField(manifestCommand, { status: "Copied to clipboard" })] },
  { id: "elements-ocelle-copy-field--empty-disabled", fields: [copyField("")] },
  { id: "elements-ocelle-copy-field--focused-copy-control", fields: [copyField(manifestCommand, { name: "Copy command", focused: true })] },
] as const;

describe("the ocelle-copy-field stories in the built Storybook (014 FR-050, FR-051)", { timeout: 60_000 }, () => {
  for (const { id, fields } of copyFieldStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its field with the state it states, and axe's full rule set reports no violation and no serious or critical incomplete`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-copy-field");
        const observed = await observeCopyFields(page);
        const results = await axeResults(page);
        expect({
          observed,
          violations: results.violations,
          incomplete: results.incomplete.filter((each) => each.impact === "serious" || each.impact === "critical"),
          outside,
        }).toEqual({ observed: { theme, defined: [true, true], fields }, violations: [], incomplete: [], outside: [] });
        await page.close();
      });
    }
  }
});

/** What a link story's page shows: its theme, whether the link is defined, and each link's state. */
function observeLinks(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    let active: Element | null = document.activeElement;
    while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
    return {
      theme: document.documentElement.dataset.theme,
      defined: customElements.get("ocelle-link") !== undefined,
      links: [...document.querySelectorAll("#storybook-root ocelle-link")].map((link) => {
        const anchor = link.shadowRoot?.querySelector<HTMLElement>('[part~="anchor"]');
        return {
          inParagraph: link.parentElement?.localName === "p",
          href: anchor?.getAttribute("href") ?? null,
          label: anchor?.getAttribute("aria-label") ?? null,
          lines: new Set([...link.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top))).size,
          underline: anchor === null || anchor === undefined ? null : getComputedStyle(anchor).textDecorationLine,
          focused: anchor !== null && anchor !== undefined && anchor === active,
        };
      }),
    };
  });
}

/** A link as `observeLinks` reads it. */
function storyLink(options: { readonly href?: string | null; readonly label?: string; readonly lines?: number; readonly focused?: boolean } = {}): unknown {
  return { inParagraph: true, href: options.href === undefined ? "#mission-log" : options.href, label: options.label ?? null, lines: options.lines ?? 1, underline: "underline", focused: options.focused === true };
}

// The link stories (014 FR-050, FR-051; research.md R-08, R-10, R-12; T095): each story renders its link inside a
// paragraph with the state it states, underlined, in light and dark, and axe with the axe gate's full rule set reports
// no violation and no serious or critical incomplete (no new entry in a11y-exceptions.json, FR-051). That rule set
// holds `label-content-name-mismatch` (WCAG 2.5.3, impact serious): the `label` story's label contains the visible
// text, so the rule finds nothing (plant: a story label without the visible text, R-08 "Label in name"). The wrapped
// story's link lies on three lines at the story's width, the others on one (on two lines, the union box of the anchor,
// whose text is slotted, has its centre between the lines, and axe-core 4.14.0 reports a serious color-contrast
// incomplete, bgOverlap; reviews/phase-6/notes.md); the focused story's link has focus
// after its `play`; the label story's link has no href and its anchor carries the label.
const linkStories = [
  { id: "elements-ocelle-link--in-a-paragraph", links: [storyLink()] },
  { id: "elements-ocelle-link--wrapped-across-lines", links: [storyLink({ lines: 3 })] },
  { id: "elements-ocelle-link--focused", links: [storyLink({ focused: true })] },
  { id: "elements-ocelle-link--hovered", links: [storyLink()] },
  { id: "elements-ocelle-link--with-label", links: [storyLink({ href: null, label: "the mission log, opens in the viewer" })] },
] as const;

describe("the ocelle-link stories in the built Storybook (014 FR-050, FR-051)", { timeout: 60_000 }, () => {
  for (const { id, links } of linkStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its link in a paragraph with the state it states, and axe's full rule set reports no violation (no label-content-name-mismatch included) and no serious or critical incomplete`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-link");
        const observed = await observeLinks(page);
        const results = await axeResults(page);
        expect({
          observed,
          violations: results.violations,
          mismatch: results.violations.filter((each) => each.id === "label-content-name-mismatch"),
          incomplete: results.incomplete.filter((each) => each.impact === "serious" || each.impact === "critical"),
          outside,
        }).toEqual({ observed: { theme, defined: true, links }, violations: [], mismatch: [], incomplete: [], outside: [] });
        await page.close();
      });
    }
  }
});
