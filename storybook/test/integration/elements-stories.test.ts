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

// 012 phase 2 (tasks.md T021; research.md R-13; plan decision 27; spike reviews/phase-2/spike.md): the
// `ocelle-button` stories, one per variant, size and state of User Story 1 in button mode (variants, compact, flush,
// icon, icon only, disabled, hover and press by the pointer parameter, focus by a wrapper that calls the button's
// plain `focus()`, the `ground` values with chrome and the changing surface, right to left), each rendering its
// buttons with the story's attributes, each button's inner control rendered, in light and dark, with base.css applied
// and no request outside the origin; the focused story's one button holds focus in its inner control.

/** One button of a story: the attributes it carries and whether its inner control is rendered. */
interface ButtonSeen {
  readonly variant: string | null;
  readonly size: string | null;
  readonly flush: boolean;
  readonly ground: string | null;
  readonly disabled: boolean;
  readonly label: string | null;
  readonly rendered: boolean;
  // 012 phase 3 (tasks.md T034): the host's href, the inner control's tag and the moved states on it.
  readonly href: string | null;
  readonly tag: string | null;
  readonly expanded: string | null;
  readonly pressed: string | null;
  readonly current: string | null;
}

/** What a button story's page shows: its theme, the base stylesheet, its buttons and how many hold focus. */
function observeButtons(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-button") !== undefined,
    buttons: [...document.querySelectorAll("#storybook-root ocelle-button")].map((button) => ({
      variant: button.getAttribute("variant"),
      size: button.getAttribute("size"),
      flush: button.hasAttribute("flush"),
      ground: button.getAttribute("ground"),
      disabled: button.hasAttribute("disabled"),
      label: button.getAttribute("label"),
      rendered: button.shadowRoot?.querySelectorAll('[part="control"]').length === 1,
      href: button.getAttribute("href"),
      tag: button.shadowRoot?.querySelector('[part="control"]')?.localName ?? null,
      expanded: button.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-expanded") ?? null,
      pressed: button.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-pressed") ?? null,
      current: button.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-current") ?? null,
    })),
    focused: [...document.querySelectorAll("#storybook-root ocelle-button")].filter((button) => button.shadowRoot?.activeElement?.getAttribute("part") === "control").length,
  }));
}

/** A button of a story with the attributes given, the others absent. */
function seen(attributes: Partial<ButtonSeen> = {}): ButtonSeen {
  return { variant: null, size: null, flush: false, ground: null, disabled: false, label: null, rendered: true, href: null, tag: "button", expanded: null, pressed: null, current: null, ...attributes };
}

const variants = [seen({ variant: "primary" }), seen({ variant: "secondary" }), seen({ variant: "quiet" })];

const buttonStories: readonly { readonly id: string; readonly buttons: readonly ButtonSeen[]; readonly focused?: number }[] = [
  { id: "elements-ocelle-button--secondary", buttons: [seen()] },
  { id: "elements-ocelle-button--primary", buttons: [seen({ variant: "primary" })] },
  { id: "elements-ocelle-button--quiet", buttons: [seen({ variant: "quiet" })] },
  { id: "elements-ocelle-button--compact", buttons: variants.map((each) => ({ ...each, size: "compact" })) },
  { id: "elements-ocelle-button--flush", buttons: [seen({ flush: true }), seen({ flush: true, size: "compact" })] },
  { id: "elements-ocelle-button--icon", buttons: variants },
  { id: "elements-ocelle-button--icon-only", buttons: [seen({ variant: "quiet", label: "Close" }), seen({ variant: "quiet", size: "compact", label: "Close" })] },
  { id: "elements-ocelle-button--disabled", buttons: [...variants.map((each) => ({ ...each, disabled: true })), seen({ flush: true, disabled: true })] },
  { id: "elements-ocelle-button--primary-hovered", buttons: [seen({ variant: "primary" })] },
  { id: "elements-ocelle-button--secondary-hovered", buttons: [seen()] },
  { id: "elements-ocelle-button--flush-hovered", buttons: [seen({ flush: true })] },
  { id: "elements-ocelle-button--secondary-pressed", buttons: [seen()] },
  { id: "elements-ocelle-button--focused", buttons: [seen()], focused: 1 },
  {
    id: "elements-ocelle-button--grounds",
    buttons: ["accent-low", "inset", "hover-bg", "state"].flatMap((ground) => [seen({ ground }), seen({ variant: "quiet", ground })]),
  },
  {
    id: "elements-ocelle-button--chrome",
    buttons: [0, 1].flatMap(() => [seen({ variant: "primary", ground: "chrome" }), seen({ ground: "chrome" }), seen({ variant: "quiet", ground: "chrome" }), seen({ flush: true, ground: "chrome" })]),
  },
  { id: "elements-ocelle-button--changing-surface", buttons: [seen({ variant: "quiet", ground: "hover-bg" }), seen({ variant: "quiet", ground: "hover-bg" })] },
  { id: "elements-ocelle-button--right-to-left", buttons: [seen(), seen({ flush: true })] },
  // 012 phase 3 (tasks.md T034, T039): the link stories (link mode in each variant and flush, disabled, a new tab) and
  // the moved states (expanded, current, pressed), each state on the inner control.
  {
    id: "elements-ocelle-button--link",
    buttons: [seen({ href: "#projects", tag: "a" }), seen({ variant: "primary", href: "#new", tag: "a" }), seen({ variant: "quiet", href: "#docs", tag: "a" }), seen({ flush: true, href: "#projects", tag: "a" })],
  },
  {
    id: "elements-ocelle-button--link-disabled",
    buttons: [seen({ href: "#projects", tag: "a", disabled: true }), seen({ variant: "primary", href: "#new", tag: "a", disabled: true }), seen({ variant: "quiet", href: "#docs", tag: "a", disabled: true }), seen({ flush: true, href: "#projects", tag: "a", disabled: true })],
  },
  { id: "elements-ocelle-button--link-new-tab", buttons: [seen({ href: "#docs", tag: "a" }), seen({ variant: "quiet", href: "#docs", tag: "a" })] },
  { id: "elements-ocelle-button--expanded", buttons: [seen({ expanded: "true" }), seen({ variant: "quiet", expanded: "false" })] },
  {
    id: "elements-ocelle-button--current",
    buttons: [seen({ flush: true, size: "compact", href: "#home", tag: "a" }), seen({ flush: true, size: "compact", href: "#projects", tag: "a", current: "page" })],
  },
  { id: "elements-ocelle-button--pressed", buttons: [seen({ variant: "quiet", pressed: "true" }), seen({ variant: "quiet", pressed: "false" })] },
];

describe("the ocelle-button stories in the built Storybook (012 US1, FR-050)", { timeout: 60_000 }, () => {
  for (const { id, buttons, focused } of buttonStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-button elements with the story's attributes, each inner control rendered, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-button");
        expect({ ...((await observeButtons(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          buttons,
          focused: focused ?? 0,
          outside: [],
        });
        await page.close();
      });
    }
  }
});
