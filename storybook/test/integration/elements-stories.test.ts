import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
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

// Mission 010 phase 5 (T061; spec US4 scenarios 1 and 2, FR-033; research.md R-08): the stories of ocelle-notice,
// ocelle-form-input and ocelle-form-select. The index holds each story with its title and name; each renders its
// element in the state the story names, in light and dark, with base.css applied and no request outside the origin;
// the hover stories, and only they, declare #10's pointer parameter, its selector matching exactly one element; the
// focused stories have the inner control focused by script after render (no `autofocus`) and matching
// `:focus-visible`; and each story has its committed baselines, `storybook/baselines/<story-id>.<theme>.png` for light
// and dark, each a PNG file. Expected values are written by hand from the spec's scenario 1 and the stories' design.

const baselines = fileURLToPath(new URL("../../baselines/", import.meta.url));

/** The eight bytes every PNG file starts with. */
const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Opens a story and waits for its element or Storybook's error display, then for the element's render and two frames. */
async function openStory(id: string, theme: "light" | "dark", element: string): Promise<{ readonly page: Page; readonly outside: readonly string[] }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage();
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" });
  await page
    .waitForFunction((element) => document.querySelector(`#storybook-root ${element}`) !== null || document.body.classList.contains("sb-show-errordisplay"), element, { timeout: 10_000 })
    .catch(() => undefined);
  await page.evaluate(async (element) => {
    await Promise.all([...document.querySelectorAll(`#storybook-root ${element}`)].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, element);
  return { page, outside };
}

/** The story's pointer parameter as the preview holds it, and how many elements its selector matches (0 without one). */
async function pointerOf(page: Page): Promise<{ readonly pointer: unknown; readonly targets: number }> {
  const pointer = await page.evaluate(() => {
    const parameters = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { story?: { parameters?: { ocelle?: { pointer?: unknown } } } } } }).__STORYBOOK_PREVIEW__?.currentRender?.story?.parameters;
    return parameters?.ocelle?.pointer ?? null;
  });
  const selector = pointer === null ? undefined : Object.values(pointer as Record<string, string>)[0];
  return { pointer, targets: selector === undefined ? 0 : await page.locator(selector).count() };
}

/** What the page shows around the story: its theme, the base stylesheet and whether the element is defined. */
function observeFrame(page: Page, element: string): Promise<unknown> {
  return page.evaluate((element) => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get(element) !== undefined,
  }), element);
}

/** The notices of a story: their attributes, the box's tone and size classes, the heading and the body text. */
function observeNotices(page: Page): Promise<unknown> {
  return page.evaluate(() =>
    [...document.querySelectorAll("#storybook-root ocelle-notice")].map((notice) => {
      const collapse = (text: string | null | undefined): string => (text ?? "").replace(/\s+/g, " ").trim();
      const heading = notice.shadowRoot?.querySelector<HTMLElement>('[part="heading"]');
      return {
        tone: notice.getAttribute("tone"),
        size: notice.getAttribute("size"),
        announce: notice.hasAttribute("announce"),
        box: notice.shadowRoot?.querySelector(".box")?.className ?? null,
        heading: heading === null || heading === undefined ? null : { shown: !heading.hidden, text: collapse([...notice.querySelectorAll('[slot="heading"]')].map((each) => each.textContent).join(" ")) },
        body: collapse([...notice.childNodes].filter((node) => !(node instanceof Element && node.slot === "heading")).map((node) => node.textContent).join(" ")),
      };
    }),
  );
}

/** The form controls of a story: the inner control's state, label, description and error as drawn, and its focus. */
function observeControls(page: Page, element: string): Promise<unknown> {
  return page.evaluate((element) =>
    [...document.querySelectorAll<HTMLElement>(`#storybook-root ${element}`)].map((host) => {
      const root = host.shadowRoot;
      const control = root?.querySelector<HTMLInputElement & HTMLSelectElement>('[part="control"]') ?? null;
      const shown = (part: string): string | null => {
        const node = root?.querySelector<HTMLElement>(`[part="${part}"]`);
        return node === null || node === undefined || node.hidden ? null : node.textContent.trim();
      };
      return {
        control: control?.localName ?? null,
        label: shown("label"),
        description: shown("description"),
        error: shown("error"),
        value: control?.value ?? null,
        placeholder: control?.localName === "input" ? control.placeholder : null,
        options: control?.localName === "select" ? [...control.options].map((option) => [option.parentElement?.localName === "optgroup" ? (option.parentElement as HTMLOptGroupElement).label : null, option.value, option.text]) : null,
        required: control?.required ?? null,
        disabled: control?.disabled ?? null,
        readOnly: control?.localName === "input" ? control.readOnly : null,
        autofocus: host.hasAttribute("autofocus") || (control?.hasAttribute("autofocus") ?? false),
        focused: document.activeElement === host && root?.activeElement === control,
        focusVisible: control?.matches(":focus-visible") ?? null,
      };
    }),
  element);
}

/** A notice as a story draws it. */
function notice(tone: string | null, size: string | null, box: string, heading: string | null, body: string, announce = false): unknown {
  return { tone, size, announce, box, heading: heading === null ? { shown: false, text: "" } : { shown: true, text: heading }, body };
}

const noticeStories = [
  { id: "elements-ocelle-notice--info", name: "Info", notices: [notice("info", null, "box tone-info size-regular", null, "The lane is queued and starts when a runner is free.")] },
  { id: "elements-ocelle-notice--success", name: "Success", notices: [notice("success", null, "box tone-success size-regular", null, "Saved.")] },
  { id: "elements-ocelle-notice--warning", name: "Warning", notices: [notice("warning", null, "box tone-warning size-regular", null, "Disk almost full.")] },
  { id: "elements-ocelle-notice--danger", name: "Danger", notices: [notice("danger", null, "box tone-danger size-regular", null, "The lane stopped at step 3.")] },
  { id: "elements-ocelle-notice--neutral", name: "Neutral", notices: [notice("neutral", null, "box tone-neutral size-regular", null, "No runs yet.")] },
  { id: "elements-ocelle-notice--regular-size", name: "Regular size", notices: [notice("info", "regular", "box tone-info size-regular", "Regular size", "The regular size sets the text in the body scale.")] },
  { id: "elements-ocelle-notice--compact-size", name: "Compact size", notices: [notice("info", "compact", "box tone-info size-compact", "Compact size", "The compact size sets the text in the small scale.")] },
  { id: "elements-ocelle-notice--with-heading", name: "With heading", notices: [notice("danger", null, "box tone-danger size-regular", "Run failed", "The lane stopped at step 3.")] },
  { id: "elements-ocelle-notice--without-heading", name: "Without heading", notices: [notice("danger", null, "box tone-danger size-regular", null, "The lane stopped at step 3.")] },
  { id: "elements-ocelle-notice--announcing", name: "Announcing", notices: [notice("success", null, "box tone-success size-regular", "Lane saved", "The card is in To do.", true)] },
] as const;

/** A form control as a story draws it: the defaults of an empty, enabled, unfocused control, with `state` over them. */
function control(kind: "input" | "select", state: Readonly<Record<string, unknown>>): unknown {
  return {
    control: kind,
    label: kind === "input" ? "Title" : "Lane",
    description: null,
    error: null,
    value: "",
    placeholder: kind === "input" ? "" : null,
    options: kind === "input" ? null : [],
    required: false,
    disabled: false,
    readOnly: kind === "input" ? false : null,
    autofocus: false,
    focused: false,
    focusVisible: false,
    ...state,
  };
}

const lanes = [[null, "todo", "To do"], [null, "doing", "Doing"], [null, "done", "Done"]];
const chooseLane = [[null, "", "Choose a lane"], ...lanes];

/** The stories of a form element: id, name, the drawn control and the pointer parameter. */
const inputStories = [
  { id: "elements-ocelle-form-input--empty", name: "Empty", state: {} },
  { id: "elements-ocelle-form-input--placeholder", name: "Placeholder", state: { placeholder: "Fix the lane card" } },
  { id: "elements-ocelle-form-input--filled", name: "Filled", state: { value: "Fix the lane card" } },
  { id: "elements-ocelle-form-input--with-description", name: "With description", state: { description: "Shown on the lane card" } },
  { id: "elements-ocelle-form-input--with-error", name: "With error", state: { value: "Fix the lane card", error: "A card with this title exists" } },
  { id: "elements-ocelle-form-input--required", name: "Required", state: { required: true } },
  { id: "elements-ocelle-form-input--disabled", name: "Disabled", state: { value: "Fix the lane card", disabled: true } },
  { id: "elements-ocelle-form-input--read-only", name: "Read-only", state: { value: "LANE-7", readOnly: true } },
  { id: "elements-ocelle-form-input--focused", name: "Focused", state: { focused: true, focusVisible: true } },
  { id: "elements-ocelle-form-input--hover", name: "Hover", state: {}, pointer: { hover: "ocelle-form-input" } },
] as const;

const selectStories = [
  { id: "elements-ocelle-form-select--empty", name: "Empty", state: {} },
  { id: "elements-ocelle-form-select--placeholder", name: "Placeholder", state: { options: chooseLane } },
  { id: "elements-ocelle-form-select--filled", name: "Filled", state: { options: lanes, value: "doing" } },
  { id: "elements-ocelle-form-select--with-description", name: "With description", state: { options: lanes, value: "todo", description: "Only cards in this lane are shown" } },
  { id: "elements-ocelle-form-select--with-error", name: "With error", state: { options: chooseLane, error: "Choose a lane for the card" } },
  { id: "elements-ocelle-form-select--required", name: "Required", state: { options: chooseLane, required: true } },
  { id: "elements-ocelle-form-select--disabled", name: "Disabled", state: { options: lanes, value: "doing", disabled: true } },
  { id: "elements-ocelle-form-select--focused", name: "Focused", state: { options: lanes, value: "todo", focused: true, focusVisible: true } },
  { id: "elements-ocelle-form-select--hover", name: "Hover", state: { options: lanes, value: "todo" }, pointer: { hover: "ocelle-form-select" } },
  {
    id: "elements-ocelle-form-select--option-groups",
    name: "Option groups",
    state: { options: [[null, "", "All lanes"], ["Active", "todo", "To do"], ["Active", "doing", "Doing"], ["Closed", "done", "Done"], ["Closed", "dropped", "Dropped"]], value: "doing" },
  },
] as const;

const titles = { "ocelle-notice": "Elements/ocelle-notice", "ocelle-form-input": "Elements/ocelle-form-input", "ocelle-form-select": "Elements/ocelle-form-select" } as const;

const allStories = [
  ...noticeStories.map(({ id, name }) => ({ id, name, element: "ocelle-notice" as const })),
  ...inputStories.map(({ id, name }) => ({ id, name, element: "ocelle-form-input" as const })),
  ...selectStories.map(({ id, name }) => ({ id, name, element: "ocelle-form-select" as const })),
];

describe("the ocelle-notice, ocelle-form-input and ocelle-form-select stories in the built Storybook (010 US4-1, US4-2, FR-033)", { timeout: 60_000 }, () => {
  it("the index holds a story for each notice tone, size, with and without a heading and announcing, and each form element's states, under the element's title", () => {
    const entries = (JSON.parse(readFileSync(join(built.out, "index.json"), "utf8")) as { readonly entries: Readonly<Record<string, { readonly type: string; readonly title: string; readonly name: string }>> }).entries;
    expect(allStories.map(({ id }) => {
      const entry = entries[id];
      return entry === undefined ? { id, missing: true } : { id, type: entry.type, title: entry.title, name: entry.name };
    })).toEqual(allStories.map(({ id, name, element }) => ({ id, type: "story", title: titles[element], name })));
  });

  for (const { id, notices } of noticeStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-notice in the story's tone, size and heading, with base.css applied, no pointer and no request outside the origin`, async () => {
        const { page, outside } = await openStory(id, theme, "ocelle-notice");
        expect({ frame: await observeFrame(page, "ocelle-notice"), notices: await observeNotices(page), ...(await pointerOf(page)), outside }).toEqual({
          frame: { theme, base: { linked: true, scheme: theme }, defined: true },
          notices,
          pointer: null,
          targets: 0,
          outside: [],
        });
        await page.close();
      });
    }
  }

  for (const [element, kind, stories] of [["ocelle-form-input", "input", inputStories], ["ocelle-form-select", "select", selectStories]] as const) {
    for (const story of stories) {
      for (const theme of ["light", "dark"] as const) {
        it(`${story.id} in ${theme}: renders its ${element} in the story's state, focus by script only, the pointer parameter on hover alone, with base.css applied and no request outside the origin`, async () => {
          const { page, outside } = await openStory(story.id, theme, element);
          expect({ frame: await observeFrame(page, element), controls: await observeControls(page, element), ...(await pointerOf(page)), outside }).toEqual({
            frame: { theme, base: { linked: true, scheme: theme }, defined: true },
            controls: [control(kind, story.state)],
            pointer: "pointer" in story ? story.pointer : null,
            targets: "pointer" in story ? 1 : 0,
            outside: [],
          });
          await page.close();
        });
      }
    }
  }

  for (const { id } of allStories) {
    it(`${id} has its committed baselines in light and dark, each a PNG file`, () => {
      expect((["light", "dark"] as const).map((theme) => {
        const file = join(baselines, `${id}.${theme}.png`);
        return { file: `${id}.${theme}.png`, signature: existsSync(file) ? [...readFileSync(file).subarray(0, 8)] : null };
      })).toEqual((["light", "dark"] as const).map((theme) => ({ file: `${id}.${theme}.png`, signature: pngSignature })));
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
