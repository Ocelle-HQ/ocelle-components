import { existsSync, readFileSync } from "node:fs";
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

/** What a scroller story's page shows: its theme, its scrollers' state, and any style attribute or class on its markup. */
function observeScrollers(page: Page): Promise<unknown> {
  return page.evaluate(() => {
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

/** The scroll figures of the story's one scroller's box: its scroll range and its distance from the start. */
function scrollFigures(page: Page): Promise<{ readonly range: number; readonly at: number }> {
  return page.evaluate(() => {
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
