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
  // 012 phase 4 (tasks.md T044): the host's busy attribute and the inner control's aria-busy.
  readonly busy: boolean;
  readonly ariaBusy: string | null;
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
      busy: button.hasAttribute("busy"),
      ariaBusy: button.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-busy") ?? null,
    })),
    focused: [...document.querySelectorAll("#storybook-root ocelle-button")].filter((button) => button.shadowRoot?.activeElement?.getAttribute("part") === "control").length,
  }));
}

/** A button of a story with the attributes given, the others absent. */
function seen(attributes: Partial<ButtonSeen> = {}): ButtonSeen {
  return { variant: null, size: null, flush: false, ground: null, disabled: false, label: null, rendered: true, href: null, tag: "button", expanded: null, pressed: null, current: null, busy: false, ariaBusy: null, ...attributes };
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
  // 012 phase 4 (tasks.md T044, T048): the busy stories (each variant, with an icon and icon-only, a link, compact),
  // each busy button reporting aria-busy on its inner control.
  { id: "elements-ocelle-button--busy", buttons: variants.map((each) => ({ ...each, busy: true, ariaBusy: "true" })) },
  {
    id: "elements-ocelle-button--busy-with-icon",
    buttons: [seen({ variant: "primary", busy: true, ariaBusy: "true" }), seen({ variant: "quiet", label: "Close", busy: true, ariaBusy: "true" })],
  },
  { id: "elements-ocelle-button--busy-link", buttons: [seen({ href: "#projects", tag: "a", busy: true, ariaBusy: "true" }), seen({ flush: true, href: "#projects", tag: "a", busy: true, ariaBusy: "true" })] },
  { id: "elements-ocelle-button--busy-compact", buttons: variants.map((each) => ({ ...each, size: "compact", busy: true, ariaBusy: "true" })) },
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

// 012 phase 5 (tasks.md T054; research.md R-13; plan decisions 27 and 30): the `ocelle-action-row` stories of User
// Story 4 (default, flush, a row with every slot, busy, hover on a default and on a flush row by the pointer parameter,
// right to left, chrome, the grounds accent-low, inset, hover-bg and state on their grounds, and a non-current row
// focused by a wrapper that calls its plain `focus()`), each rendering its rows with the story's attributes, each row's
// inner control rendered, in light and dark, with base.css applied and no request outside the origin; the focused
// story's one row holds focus in its inner control.

/** One row of a story: the attributes it carries, whether its inner control is rendered and its aria-busy. */
interface RowSeen {
  readonly rowId: string | null;
  readonly presentation: string | null;
  readonly layout: string | null;
  readonly ground: string | null;
  readonly busy: boolean;
  readonly rendered: boolean;
  readonly tag: string | null;
  readonly ariaBusy: string | null;
}

/** What a row story's page shows: its theme, the base stylesheet, its rows and how many hold focus. */
function observeRows(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-action-row") !== undefined,
    rows: [...document.querySelectorAll("#storybook-root ocelle-action-row")].map((row) => ({
      rowId: row.getAttribute("row-id"),
      presentation: row.getAttribute("presentation"),
      layout: row.getAttribute("layout"),
      ground: row.getAttribute("ground"),
      busy: row.hasAttribute("busy"),
      rendered: row.shadowRoot?.querySelectorAll('[part="control"]').length === 1,
      tag: row.shadowRoot?.querySelector('[part="control"]')?.localName ?? null,
      ariaBusy: row.shadowRoot?.querySelector('[part="control"]')?.getAttribute("aria-busy") ?? null,
    })),
    focused: [...document.querySelectorAll("#storybook-root ocelle-action-row")].filter((row) => row.shadowRoot?.activeElement?.getAttribute("part") === "control").length,
  }));
}

/** A row of a story with its row id and the attributes given, the others absent. */
function rowSeen(rowId: string, attributes: Partial<RowSeen> = {}): RowSeen {
  return { rowId, presentation: null, layout: null, ground: null, busy: false, rendered: true, tag: "button", ariaBusy: null, ...attributes };
}

/** The three rows of a list story. */
const three = (attributes: Partial<RowSeen> = {}): RowSeen[] => ["m-41", "m-42", "m-43"].map((id) => rowSeen(id, attributes));

const rowStories: readonly { readonly id: string; readonly rows: readonly RowSeen[]; readonly focused?: number }[] = [
  { id: "elements-ocelle-action-row--default", rows: three() },
  { id: "elements-ocelle-action-row--flush", rows: three({ presentation: "flush" }) },
  { id: "elements-ocelle-action-row--all-slots", rows: [rowSeen("m-42"), rowSeen("m-43", { presentation: "flush" })] },
  { id: "elements-ocelle-action-row--busy", rows: [rowSeen("m-42", { busy: true, ariaBusy: "true" }), rowSeen("m-43", { presentation: "flush", busy: true, ariaBusy: "true" })] },
  { id: "elements-ocelle-action-row--hovered", rows: [rowSeen("m-42")] },
  { id: "elements-ocelle-action-row--flush-hovered", rows: [rowSeen("m-42", { presentation: "flush" })] },
  { id: "elements-ocelle-action-row--right-to-left", rows: [rowSeen("m-42"), rowSeen("m-43", { presentation: "flush" })] },
  { id: "elements-ocelle-action-row--chrome", rows: [rowSeen("m-42", { ground: "chrome" }), rowSeen("m-43", { presentation: "flush", ground: "chrome" })] },
  ...["accent-low", "inset", "hover-bg", "state"].map((ground) => ({ id: `elements-ocelle-action-row--ground-${ground}`, rows: [rowSeen("m-42", { ground }), rowSeen("m-43", { presentation: "flush", ground })] })),
  { id: "elements-ocelle-action-row--focused", rows: three(), focused: 1 },
];

describe("the ocelle-action-row stories in the built Storybook (012 US4, FR-050)", { timeout: 60_000 }, () => {
  for (const { id, rows, focused } of rowStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-action-row elements with the story's attributes, each inner control rendered, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-action-row");
        expect({ ...((await observeRows(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          rows,
          focused: focused ?? 0,
          outside: [],
        });
        await page.close();
      });
    }
  }
});

// 012 phase 6 (tasks.md T063; research.md R-13; plan decisions 27, 30 and 31): the `ocelle-action-row` stories of User
// Story 5 (current page and true, a hovered and a focused current row, unavailable, unavailable and current, link
// rows, cards, a card with many tags, cards right to left, and a current row on chrome), each rendering its rows with
// the story's attributes and its inner controls with the state they report (`aria-current`, `aria-disabled`, an `<a>`
// with or without `href`), in light and dark, with base.css applied and no request outside the origin; the focused
// story's one current row holds focus in its inner control.

/** One row of a state story: its attributes, its inner control and the states the inner control reports. */
interface StateRowSeen {
  readonly rowId: string | null;
  readonly presentation: string | null;
  readonly layout: string | null;
  readonly ground: string | null;
  readonly current: string | null;
  readonly unavailable: boolean;
  readonly rendered: boolean;
  readonly tag: string | null;
  readonly href: string | null;
  readonly ariaCurrent: string | null;
  readonly ariaDisabled: string | null;
}

/** What a state story's page shows: its theme, the base stylesheet, its rows and the current rows that hold focus. */
function observeStateRows(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-action-row") !== undefined,
    rows: [...document.querySelectorAll("#storybook-root ocelle-action-row")].map((row) => {
      const inner = row.shadowRoot?.querySelector('[part="control"]');
      return {
        rowId: row.getAttribute("row-id"),
        presentation: row.getAttribute("presentation"),
        layout: row.getAttribute("layout"),
        ground: row.getAttribute("ground"),
        current: row.getAttribute("current"),
        unavailable: row.hasAttribute("unavailable"),
        rendered: row.shadowRoot?.querySelectorAll('[part="control"]').length === 1,
        tag: inner?.localName ?? null,
        href: inner?.getAttribute("href") ?? null,
        ariaCurrent: inner?.getAttribute("aria-current") ?? null,
        ariaDisabled: inner?.getAttribute("aria-disabled") ?? null,
      };
    }),
    focused: [...document.querySelectorAll("#storybook-root ocelle-action-row")].filter((row) => row.shadowRoot?.activeElement?.getAttribute("part") === "control").map((row) => row.getAttribute("row-id")),
  }));
}

/** A row of a state story with its row id and the attributes given, the others absent. */
function stateRow(rowId: string, attributes: Partial<StateRowSeen> = {}): StateRowSeen {
  return { rowId, presentation: null, layout: null, ground: null, current: null, unavailable: false, rendered: true, tag: "button", href: null, ariaCurrent: null, ariaDisabled: null, ...attributes };
}

/** A default and a flush row of a state story, each with the attributes given. */
const statePair = (attributes: Partial<StateRowSeen> = {}): StateRowSeen[] => [stateRow("m-42", attributes), stateRow("m-43", { presentation: "flush", ...attributes })];
const currentPage = { current: "page", ariaCurrent: "page" };
const unavailable = { unavailable: true, ariaDisabled: "true" };
const card = { layout: "card" };

const stateStories: readonly { readonly id: string; readonly rows: readonly StateRowSeen[]; readonly focused?: readonly string[] }[] = [
  { id: "elements-ocelle-action-row--current-page", rows: statePair(currentPage) },
  { id: "elements-ocelle-action-row--current-true", rows: statePair({ current: "true", ariaCurrent: "true" }) },
  { id: "elements-ocelle-action-row--current-hovered", rows: [stateRow("m-42", currentPage)] },
  { id: "elements-ocelle-action-row--current-focused", rows: [stateRow("m-41"), stateRow("m-42", currentPage), stateRow("m-43")], focused: ["m-42"] },
  { id: "elements-ocelle-action-row--unavailable", rows: statePair(unavailable) },
  { id: "elements-ocelle-action-row--unavailable-current", rows: statePair({ ...unavailable, ...currentPage }) },
  { id: "elements-ocelle-action-row--link-row", rows: statePair({ tag: "a", href: "#missions" }) },
  { id: "elements-ocelle-action-row--card", rows: statePair(card) },
  { id: "elements-ocelle-action-row--card-with-many-tags", rows: [stateRow("m-42", card)] },
  { id: "elements-ocelle-action-row--card-right-to-left", rows: statePair(card) },
  { id: "elements-ocelle-action-row--chrome-current", rows: statePair({ ground: "chrome", ...currentPage }) },
];

describe("the ocelle-action-row state and card stories in the built Storybook (012 US5, FR-050)", { timeout: 60_000 }, () => {
  for (const { id, rows, focused } of stateStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-action-row elements with the story's attributes and states, each inner control rendered, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-action-row");
        expect({ ...((await observeStateRows(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          rows,
          focused: focused ?? [],
          outside: [],
        });
        await page.close();
      });
    }
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

// 018 phase 2 (I3; research.md R-12; tasks.md T017): the `ocelle-status-indicator` stories, `Tones` (every tone, a row
// without `pulse` and a row with it, each indicator beside text naming its state) and `Labelled` (every tone named by
// `label`, the success one pulsing). Each renders its indicators in light and dark, defined, each with the story's
// `tone`, `label` and `pulse` and its 8 px dot drawn, with base.css applied and no request outside the origin.

/** What one story's indicator must show: its attributes, and its dot's drawn size. */
interface Indicator {
  readonly tone: string;
  readonly label: string | null;
  readonly pulse: boolean;
  readonly dot: readonly [number, number];
}

const indicatorTones = ["info", "success", "warning", "danger", "neutral"] as const;
const indicatorOf = (tone: string, pulse: boolean, label: string | null = null): Indicator => ({ tone, label, pulse, dot: [8, 8] });
const indicatorLabels: Readonly<Record<string, string>> = { info: "Queued", success: "Running", warning: "Blocked", danger: "Failed", neutral: "Draft" };

const indicatorStories: readonly { readonly id: string; readonly indicators: readonly Indicator[] }[] = [
  { id: "elements-ocelle-status-indicator--tones", indicators: [...indicatorTones.map((tone) => indicatorOf(tone, false)), ...indicatorTones.map((tone) => indicatorOf(tone, true))] },
  { id: "elements-ocelle-status-indicator--labelled", indicators: indicatorTones.map((tone) => indicatorOf(tone, tone === "success", indicatorLabels[tone] ?? null)) },
];

/** What a status indicator story's page shows: its theme, the base stylesheet and its indicators. */
function observeIndicators(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-status-indicator") !== undefined,
    indicators: [...document.querySelectorAll("#storybook-root ocelle-status-indicator")].map((indicator) => {
      const dot = indicator.shadowRoot?.querySelector('[part="dot"]')?.getBoundingClientRect();
      return { tone: indicator.getAttribute("tone"), label: indicator.getAttribute("label"), pulse: indicator.hasAttribute("pulse"), dot: [dot?.width ?? 0, dot?.height ?? 0] };
    }),
  }));
}

describe("the ocelle-status-indicator stories in the built Storybook (018 US1, I3)", { timeout: 60_000 }, () => {
  for (const { id, indicators } of indicatorStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its indicators with the story's tone, label and pulse and their dots drawn, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-status-indicator");
        expect({ ...((await observeIndicators(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, indicators, outside: [] });
        await page.close();
      });
    }
  }
});

// 018 phase 3 (I3; research.md R-12; tasks.md T029): the `ocelle-metric` stories, `Stack` (three metrics, label above
// value), `Row` (the same three with `layout="row"`, label and value on one line) and `EmptyValue` (a metric with no
// `display-value` and one with an empty one, stacked and in a row). Each renders its metrics in light and dark,
// defined, each with the story's `label`, `display-value` and `layout`, its value shown as given and its label and
// value arranged as its layout says, with base.css applied and no request outside the origin.

/** What one story's metric must show: its attributes, its value's text and how its label and value sit. */
interface Metric {
  readonly label: string;
  readonly displayValue: string | null;
  readonly layout: string | null;
  readonly value: string;
  readonly arrangement: "stacked" | "row";
}

const metricFigures = [
  ["Open missions", "12"],
  ["Merged this week", "1,204"],
  ["Median review time", "3 h 20 min"],
] as const;

const metricStories: readonly { readonly id: string; readonly metrics: readonly Metric[] }[] = [
  { id: "elements-ocelle-metric--stack", metrics: metricFigures.map(([label, value]) => ({ label, displayValue: value, layout: null, value, arrangement: "stacked" })) },
  { id: "elements-ocelle-metric--row", metrics: metricFigures.map(([label, value]) => ({ label, displayValue: value, layout: "row", value, arrangement: "row" })) },
  {
    id: "elements-ocelle-metric--empty-value",
    metrics: [
      { label: "Open missions", displayValue: null, layout: null, value: "", arrangement: "stacked" },
      { label: "Open missions", displayValue: "", layout: "row", value: "", arrangement: "row" },
    ],
  },
];

/** What a metric story's page shows: its theme, the base stylesheet and its metrics. */
function observeMetrics(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-metric") !== undefined,
    metrics: [...document.querySelectorAll("#storybook-root ocelle-metric")].map((metric) => {
      const term = metric.shadowRoot?.querySelector('[part="label"]')?.getBoundingClientRect();
      const definition = metric.shadowRoot?.querySelector('[part="value"]');
      const box = definition?.getBoundingClientRect();
      const stacked = term !== undefined && box !== undefined && box.top >= term.bottom - 0.5 && Math.abs(box.left - term.left) <= 0.5;
      const row = term !== undefined && box !== undefined && box.top < term.bottom && term.top < box.bottom && term.right <= box.left + 0.5;
      return {
        label: metric.getAttribute("label"),
        displayValue: metric.getAttribute("display-value"),
        layout: metric.getAttribute("layout"),
        value: definition?.textContent ?? "missing",
        arrangement: stacked ? "stacked" : row ? "row" : "other",
      };
    }),
  }));
}

describe("the ocelle-metric stories in the built Storybook (018 US2, I3)", { timeout: 60_000 }, () => {
  for (const { id, metrics } of metricStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its metrics with the story's label, display-value and layout, the value as given and the label and value arranged by the layout, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-metric");
        expect({ ...((await observeMetrics(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, metrics, outside: [] });
        await page.close();
      });
    }
  }
});

// 018 phase 4 (I3; research.md R-12; tasks.md T039): the static `ocelle-pill-tag` stories, `Statuses` (one pill per
// status of the vocabulary), `Badge` (one count badge per status), `Compact` (the five pills and the five badges in the
// compact density), `WithIcon` (pills with a leading icon, a compact one and a badge among them) and `LongTextWraps`
// (a long pill and a long compact badge in a narrow block, each wrapping onto further lines). Each renders its pills
// in light and dark, defined, each with the story's `status`, `variant` and `density`, its text, its icon where the
// story gives one, its `pill` part, and its text on one line or wrapped as the story says, none focusable, with
// base.css applied and no request outside the origin.

/** What one story's pill must show: its attributes, its text, whether it has an icon and how its text is laid out. */
interface Pill {
  readonly status: string;
  readonly variant: string | null;
  readonly density: string | null;
  readonly text: string;
  readonly icon: boolean;
  readonly lines: "one" | "wrapped";
}

const pillLabels = [
  ["info", "Running"],
  ["success", "Done"],
  ["warning", "Blocked"],
  ["danger", "Failed"],
  ["neutral", "Draft"],
] as const;

const badgeCounts = [
  ["info", "3"],
  ["success", "12"],
  ["warning", "1"],
  ["danger", "7"],
  ["neutral", "128"],
] as const;

const pillOf = (status: string, text: string, rest: Partial<Pill> = {}): Pill => ({ status, variant: null, density: null, text, icon: false, lines: "one", ...rest });

const pillStories: readonly { readonly id: string; readonly pills: readonly Pill[] }[] = [
  { id: "elements-ocelle-pill-tag--statuses", pills: pillLabels.map(([status, text]) => pillOf(status, text)) },
  { id: "elements-ocelle-pill-tag--badge", pills: badgeCounts.map(([status, text]) => pillOf(status, text, { variant: "badge" })) },
  {
    id: "elements-ocelle-pill-tag--compact",
    pills: [...pillLabels.map(([status, text]) => pillOf(status, text, { density: "compact" })), ...badgeCounts.map(([status, text]) => pillOf(status, text, { variant: "badge", density: "compact" }))],
  },
  {
    id: "elements-ocelle-pill-tag--with-icon",
    pills: [...pillLabels.map(([status, text]) => pillOf(status, text, { icon: true })), pillOf("info", "Running", { density: "compact", icon: true }), pillOf("success", "12", { variant: "badge", icon: true })],
  },
  {
    id: "elements-ocelle-pill-tag--long-text-wraps",
    pills: [pillOf("warning", "Blocked by the review of the scheduler pipeline", { lines: "wrapped" }), pillOf("info", "Waiting for the nightly integration run", { variant: "badge", density: "compact", lines: "wrapped" })],
  },
];

/** What a pill story's page shows: its theme, the base stylesheet, its pills and whether any of them takes focus. */
function observePills(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-pill-tag") !== undefined,
    pills: [...document.querySelectorAll("#storybook-root ocelle-pill-tag")].map((pill) => {
      const texts = [...pill.childNodes].filter((node): node is Text => node.nodeType === Node.TEXT_NODE && (node as Text).data.trim() !== "");
      const range = document.createRange();
      if (texts[0] !== undefined) range.selectNodeContents(texts[0]);
      const lines = texts[0] === undefined ? 0 : new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
      return {
        status: pill.getAttribute("status"),
        variant: pill.getAttribute("variant"),
        density: pill.getAttribute("density"),
        text: texts.map((node) => node.data.trim()).join(" "),
        icon: pill.querySelector('[slot="icon"]') !== null,
        lines: lines === 1 ? "one" : lines > 1 ? "wrapped" : "none",
        part: pill.shadowRoot?.querySelector('[part="pill"]') !== null && pill.shadowRoot !== null,
      };
    }),
    focusable: [...document.querySelectorAll("#storybook-root ocelle-pill-tag")].some((pill) => {
      (pill as HTMLElement).focus();
      return document.activeElement === pill;
    }),
  }));
}

describe("the ocelle-pill-tag stories in the built Storybook (018 US3, I3)", { timeout: 60_000 }, () => {
  for (const { id, pills } of pillStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its pills with the story's status, variant, density, text and icon, each with its pill part and its text on one line or wrapped as the story says, none focusable, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-pill-tag");
        expect({ ...((await observePills(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          pills: pills.map((pill) => ({ ...pill, part: true })),
          focusable: false,
          outside: [],
        });
        await page.close();
      });
    }
  }
});

// 018 phase 5 (I3; research.md R-12; plan decision 9; tasks.md T049): the interactive `ocelle-pill-tag` stories, `Button`
// (one interactive pill per status and an interactive badge), `Pressed` (a pill and a badge with aria-pressed "true",
// beside their "false" twins), `Link` (a link-mode pill and badge), `Disabled` (a disabled button-mode pill, link-mode
// pill and badge), `Focus` (one pill focused by a wrapper that calls its plain `focus()` once it has rendered, as 012's
// `Focused` does), and `PillHovered`, `BadgeHovered`, `PillActive` and `BadgeActive` (one pill each, hovered or pressed
// by 006's pointer parameter). Each renders its pills in light and dark, defined, each with the story's attributes,
// its inner control (`button`, or `a` in link mode) with the moved `aria-pressed` on it, its `pill` and `control` part,
// with base.css applied and no request outside the origin; the focus story's one pill holds focus in its control.

/** What one interactive story's pill must show: its attributes, its text and its inner control. */
interface InteractivePill {
  readonly status: string | null;
  readonly variant: string | null;
  readonly interactive: boolean;
  readonly href: string | null;
  readonly disabled: boolean;
  readonly text: string;
  readonly tag: string;
  readonly pressed: string | null;
}

const interactivePill = (status: string, text: string, rest: Partial<InteractivePill> = {}): InteractivePill => ({ status, variant: null, interactive: true, href: null, disabled: false, text, tag: "button", pressed: null, ...rest });

const interactivePillStories: readonly { readonly id: string; readonly pills: readonly InteractivePill[]; readonly focused?: number }[] = [
  { id: "elements-ocelle-pill-tag--button", pills: [...pillLabels.map(([status, text]) => interactivePill(status, text)), interactivePill("info", "3", { variant: "badge" })] },
  {
    id: "elements-ocelle-pill-tag--pressed",
    pills: [interactivePill("info", "Mine", { pressed: "true" }), interactivePill("info", "Mine", { pressed: "false" }), interactivePill("info", "3", { variant: "badge", pressed: "true" }), interactivePill("info", "3", { variant: "badge", pressed: "false" })],
  },
  { id: "elements-ocelle-pill-tag--link", pills: [interactivePill("warning", "Blocked", { interactive: false, href: "#blocked", tag: "a" }), interactivePill("warning", "1", { variant: "badge", interactive: false, href: "#blocked", tag: "a" })] },
  {
    id: "elements-ocelle-pill-tag--disabled",
    pills: [interactivePill("info", "Mine", { disabled: true }), interactivePill("warning", "Blocked", { interactive: false, href: "#blocked", tag: "a", disabled: true }), interactivePill("info", "3", { variant: "badge", disabled: true })],
  },
  { id: "elements-ocelle-pill-tag--focus", pills: [interactivePill("info", "Mine")], focused: 1 },
  { id: "elements-ocelle-pill-tag--pill-hovered", pills: [interactivePill("info", "Mine")] },
  { id: "elements-ocelle-pill-tag--badge-hovered", pills: [interactivePill("info", "3", { variant: "badge" })] },
  { id: "elements-ocelle-pill-tag--pill-active", pills: [interactivePill("info", "Mine")] },
  { id: "elements-ocelle-pill-tag--badge-active", pills: [interactivePill("info", "3", { variant: "badge" })] },
];

/** What an interactive pill story's page shows: its theme, the base stylesheet, its pills and how many hold focus. */
function observeInteractivePills(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-pill-tag") !== undefined,
    pills: [...document.querySelectorAll("#storybook-root ocelle-pill-tag")].map((pill) => {
      const inner = pill.shadowRoot?.querySelectorAll('[part~="control"]') ?? [];
      return {
        status: pill.getAttribute("status"),
        variant: pill.getAttribute("variant"),
        interactive: pill.hasAttribute("interactive"),
        href: pill.getAttribute("href"),
        disabled: pill.hasAttribute("disabled"),
        text: pill.textContent.trim(),
        tag: inner.length === 1 && inner[0]?.getAttribute("part") === "pill control" ? inner[0].localName : `${String(inner.length)} controls`,
        pressed: inner[0]?.getAttribute("aria-pressed") ?? null,
      };
    }),
    focused: [...document.querySelectorAll("#storybook-root ocelle-pill-tag")].filter((pill) => pill.shadowRoot?.activeElement?.classList.contains("control") === true).length,
  }));
}

describe("the interactive ocelle-pill-tag stories in the built Storybook (018 US4, I3)", { timeout: 60_000 }, () => {
  for (const { id, pills, focused } of interactivePillStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its pills with the story's status, variant, mode, disabled state and text, each with one inner control carrying the parts pill and control and the moved aria-pressed, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-pill-tag");
        expect({ ...((await observeInteractivePills(page)) as object), outside }).toEqual({
          theme,
          base: { linked: true, scheme: theme },
          defined: true,
          pills,
          focused: focused ?? 0,
          outside: [],
        });
        await page.close();
      });
    }
  }
});

// 018 phase 6 (I3; research.md R-12; plan decision 16; tasks.md T058): the truncation stories of `ocelle-pill-tag`,
// `Truncated` (in a narrow block, enabled interactive pills in button and link mode, truncated and fitting, none
// focused, and below them one truncated pill alone in a container that clips, focused by a wrapper that calls its plain
// `focus()` once it has rendered) and `DisabledWraps` (a disabled button-mode pill and a disabled link-mode pill in the
// narrow block, each wrapping its long text). Each renders its pills in light and dark, defined, with the story's
// attributes and text, its inner control, its text truncated (passing its text span's inline end on one line) or not, on
// one line or wrapped as the story says, with base.css applied and no request outside the origin. In `Truncated` the
// focused pill's control matches `:focus-visible`, and neither theme shows an open `ocelle-tooltip` bubble once the
// page has settled as 006's capture settles it (fonts, two frames) and a further 700 ms past the tooltip's delay: the
// baseline shows the ring and no bubble (plan decision 16).

/** What one truncation story's pill must show. */
interface TruncationPill {
  readonly status: string;
  readonly href: string | null;
  readonly disabled: boolean;
  readonly text: string;
  readonly tag: string;
  readonly truncated: boolean;
  readonly lines: "one" | "wrapped";
}

const truncationPill = (status: string, text: string, rest: Partial<TruncationPill> = {}): TruncationPill => ({ status, href: null, disabled: false, text, tag: "button", truncated: false, lines: "one", ...rest });

const truncationStories: readonly { readonly id: string; readonly pills: readonly TruncationPill[]; readonly focused: number }[] = [
  {
    id: "elements-ocelle-pill-tag--truncated",
    pills: [
      truncationPill("warning", "Blocked by the review of the scheduler pipeline", { truncated: true }),
      truncationPill("info", "Waiting for the nightly integration run", { href: "#waiting", tag: "a", truncated: true }),
      truncationPill("success", "Done"),
      truncationPill("danger", "Failed in the nightly integration run", { truncated: true }),
    ],
    focused: 1,
  },
  {
    id: "elements-ocelle-pill-tag--disabled-wraps",
    pills: [
      truncationPill("info", "Waiting for the nightly integration run", { disabled: true, lines: "wrapped" }),
      truncationPill("warning", "Blocked by the review of the scheduler pipeline", { href: "#blocked", tag: "a", disabled: true, lines: "wrapped" }),
    ],
    focused: 0,
  },
];

/** What a truncation story's page shows once settled: its theme, the base stylesheet, its pills, focus and open bubbles. */
async function observeTruncation(page: Page): Promise<unknown> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let frame = 0; frame < 2; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => setTimeout(resolve, 700));
  });
  return page.evaluate(() => {
    const pills = [...document.querySelectorAll("#storybook-root ocelle-pill-tag")];
    return {
      theme: document.documentElement.dataset.theme,
      base: {
        linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
        scheme: getComputedStyle(document.documentElement).colorScheme,
      },
      defined: customElements.get("ocelle-pill-tag") !== undefined && customElements.get("ocelle-tooltip") !== undefined,
      pills: pills.map((pill) => {
        const inner = pill.shadowRoot?.querySelectorAll('[part~="control"]') ?? [];
        const span = pill.shadowRoot?.querySelector(".label");
        const texts = [...pill.childNodes].filter((node): node is Text => node.nodeType === Node.TEXT_NODE && (node as Text).data.trim() !== "");
        const range = document.createRange();
        if (texts[0] !== undefined) range.selectNodeContents(texts[0]);
        const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
        return {
          status: pill.getAttribute("status"),
          href: pill.getAttribute("href"),
          disabled: pill.hasAttribute("disabled"),
          text: texts.map((node) => node.data.trim()).join(" "),
          tag: inner.length === 1 ? (inner[0]?.localName ?? "none") : `${String(inner.length)} controls`,
          truncated: span !== null && span !== undefined && range.getBoundingClientRect().right - span.getBoundingClientRect().right > 0,
          lines: lines === 1 ? "one" : lines > 1 ? "wrapped" : "none",
        };
      }),
      focused: pills.filter((pill) => pill.shadowRoot?.activeElement?.matches(".control:focus-visible") === true).length,
      bubbles: pills.flatMap((pill) => [...(pill.shadowRoot?.querySelectorAll("ocelle-tooltip") ?? [])]).filter((tooltip) => tooltip.shadowRoot?.querySelector(":popover-open") !== null && tooltip.shadowRoot !== null).length,
    };
  });
}

describe("the ocelle-pill-tag truncation stories in the built Storybook (018 US5, I3)", { timeout: 60_000 }, () => {
  for (const { id, pills, focused } of truncationStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its pills with the story's attributes, text and inner control, each truncated or not and on one line or wrapped as the story says, ${String(focused)} focused with the focus ring, and no open tooltip bubble, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-pill-tag");
        expect({ ...((await observeTruncation(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, pills, focused, bubbles: 0, outside: [] });
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

// 020 phase 1 (I3; contracts/checks.md § Story tests; tasks.md T008): the `ocelle-disclosure` stories (closed, open,
// focused, hovered, a long summary, a consumer icon, right to left, nested). Each renders its disclosures in light and
// dark, defined, each with the story's `open`, its summary rendered and the chevron its state names (the fallback stays
// in the shadow root beside a consumer icon), with base.css applied and no request outside the origin; the focused
// story's one summary holds focus. Every story's summaries are named in the CDP tree. With no pointer event, Tab
// focuses the first summary (the focused story's has focus already), Enter toggles it and Space toggles it back
// (SC-005). On a fresh load, within 1400 ms of its first render, with and without reduced motion (`matchMedia`
// asserted beside it), no animation runs, nor one frame after a pointer click on the first summary, beside the
// toggled state (SC-006). The long summary at a 320 px viewport has a page scroll width of 320, beside a disclosure
// wider than 0 (SC-002). The unnamed disclosure has no story (plan Complexity Tracking).

/** One disclosure of a story: its `open`, its summary rendered, its chevron's name and whether it slots an icon. */
interface DisclosureSeen {
  readonly open: boolean;
  readonly rendered: boolean;
  readonly chevron: string | null;
  readonly consumerIcon: boolean;
}

const closedDisclosure: DisclosureSeen = { open: false, rendered: true, chevron: "chevron-end", consumerIcon: false };
const openDisclosure: DisclosureSeen = { open: true, rendered: true, chevron: "chevron-down", consumerIcon: false };

const disclosureStories: readonly { readonly id: string; readonly disclosures: readonly DisclosureSeen[]; readonly focused?: number }[] = [
  { id: "elements-ocelle-disclosure--closed", disclosures: [closedDisclosure] },
  { id: "elements-ocelle-disclosure--open", disclosures: [openDisclosure] },
  { id: "elements-ocelle-disclosure--focused", disclosures: [closedDisclosure], focused: 1 },
  { id: "elements-ocelle-disclosure--hovered", disclosures: [closedDisclosure] },
  { id: "elements-ocelle-disclosure--long-summary", disclosures: [openDisclosure] },
  { id: "elements-ocelle-disclosure--consumer-icon", disclosures: [{ ...closedDisclosure, consumerIcon: true }] },
  { id: "elements-ocelle-disclosure--right-to-left", disclosures: [closedDisclosure, openDisclosure] },
  { id: "elements-ocelle-disclosure--nested", disclosures: [openDisclosure, openDisclosure, closedDisclosure] },
];

/** What a disclosure story's page shows: its theme, the base stylesheet, its disclosures and how many hold focus. */
function observeDisclosures(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-disclosure") !== undefined,
    disclosures: [...document.querySelectorAll("#storybook-root ocelle-disclosure")].map((disclosure) => ({
      open: disclosure.hasAttribute("open"),
      rendered: disclosure.shadowRoot?.querySelectorAll('[part="summary"]').length === 1,
      chevron: disclosure.shadowRoot?.querySelector("ocelle-icon.chevron")?.getAttribute("name") ?? null,
      consumerIcon: disclosure.querySelector(':scope > [slot="icon"]') !== null,
    })),
    focused: [...document.querySelectorAll("#storybook-root ocelle-disclosure")].filter((disclosure) => disclosure.shadowRoot?.activeElement?.getAttribute("part") === "summary").length,
  }));
}

/** The names of the disclosure summaries (`DisclosureTriangle` nodes) of a story page's accessibility tree, over CDP. */
async function summaryNames(page: Page): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = (await session.send("Accessibility.getFullAXTree")) as { nodes: { ignored: boolean; role?: { value?: unknown }; name?: { value?: unknown } }[] };
    return nodes.filter((node) => !node.ignored && node.role?.value === "DisclosureTriangle").map((node) => (typeof node.name?.value === "string" ? node.name.value : ""));
  } finally {
    await session.detach();
  }
}

/** Whether the first disclosure of the story holds focus in its summary, and its `open`. */
function firstSummary(page: Page): Promise<{ readonly focused: boolean; readonly open: boolean }> {
  return page.evaluate(() => {
    const first = document.querySelector("#storybook-root ocelle-disclosure");
    return { focused: document.activeElement === first && first?.shadowRoot?.activeElement?.getAttribute("part") === "summary", open: first?.hasAttribute("open") ?? false };
  });
}

describe("the ocelle-disclosure stories in the built Storybook (020 US1, FR-050, I3)", { timeout: 60_000 }, () => {
  for (const { id, disclosures, focused } of disclosureStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-disclosure elements with the story's open state, each summary rendered with its chevron, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-disclosure");
        expect({ ...((await observeDisclosures(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, disclosures, focused: focused ?? 0, outside: [] });
        await page.close();
      });
    }

    it(`${id}: every disclosure summary in the CDP tree has a non-empty name, one per disclosure`, async () => {
      const { page } = await open(id, "light", "ocelle-disclosure");
      const names = await summaryNames(page);
      await page.close();
      expect({ summaries: names.length, unnamed: names.filter((name) => name.trim() === "").length }).toEqual({ summaries: disclosures.length, unnamed: 0 });
    });

    it(`${id}: with no pointer event, Tab focuses the first summary, Enter toggles it and Space toggles it back (SC-005)`, async () => {
      const page = await openWith(id, { width: 1280, reducedMotion: "reduce" }, "ocelle-disclosure");
      if (focused === undefined) await page.keyboard.press("Tab");
      const tabbed = await firstSummary(page);
      await page.keyboard.press("Enter");
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const enter = await firstSummary(page);
      await page.keyboard.press("Space");
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const space = await firstSummary(page);
      await page.close();
      expect({ focused: tabbed.focused, enter: enter.open !== tabbed.open, space: space.open === tabbed.open, stillFocused: space.focused }).toEqual({ focused: true, enter: true, space: true, stillFocused: true });
    });

    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      it(`${id} with prefers-reduced-motion ${reducedMotion}: within 1400 ms of its first render no animation runs, nor one frame after a pointer click on the first summary, which toggles it (SC-006)`, async () => {
        const page = await openWith(id, { width: 1280, reducedMotion }, "ocelle-disclosure");
        const loaded = await page.evaluate(() => ({
          timing: performance.now() - (window as unknown as { firstRender: number }).firstRender < 1400 ? "inside the first 1400 ms" : "read too late",
          reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
          running: document.getAnimations().filter((animation) => animation.playState === "running").length,
        }));
        const before = await firstSummary(page);
        const centre = await page.evaluate(() => {
          const rect = document.querySelector("#storybook-root ocelle-disclosure")?.shadowRoot?.querySelector('[part="summary"]')?.getBoundingClientRect();
          return rect === undefined ? { x: 0, y: 0 } : { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        });
        await page.mouse.click(centre.x, centre.y);
        // One frame after the click the inner `details` shows the new state (the host attribute follows the native
        // `toggle` task, read after two more frames).
        const clicked = await page.evaluate(
          () =>
            new Promise<{ readonly shown: boolean; readonly running: number }>((resolve) => {
              requestAnimationFrame(() => {
                resolve({
                  shown: document.querySelector("#storybook-root ocelle-disclosure")?.shadowRoot?.querySelector("details")?.open ?? false,
                  running: [document, ...[...document.querySelectorAll("#storybook-root ocelle-disclosure")].map((each) => each.shadowRoot)].flatMap((root) => root?.getAnimations() ?? []).filter((animation) => animation.playState === "running").length,
                });
              });
            }),
        );
        await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const after = await firstSummary(page);
        await page.close();
        expect({ loaded, toggled: { shown: clicked.shown !== before.open, attribute: after.open !== before.open }, running: clicked.running }).toEqual({
          loaded: { timing: "inside the first 1400 ms", reduce: reducedMotion === "reduce", running: 0 },
          toggled: { shown: true, attribute: true },
          running: 0,
        });
      });
    }
  }

  it("elements-ocelle-disclosure--long-summary at a 320 px viewport: the page scroll width is 320, beside a disclosure wider than 0 whose summary wraps (SC-002)", async () => {
    const page = await openWith("elements-ocelle-disclosure--long-summary", { width: 320, reducedMotion: "no-preference" }, "ocelle-disclosure");
    const observed = await page.evaluate(() => {
      const disclosure = document.querySelector("#storybook-root ocelle-disclosure");
      const label = disclosure?.querySelector('[slot="summary"]');
      return { scrollWidth: document.documentElement.scrollWidth, sized: (disclosure?.getBoundingClientRect().width ?? 0) > 0, wrapped: (label?.getClientRects().length ?? 0) > 1 };
    });
    await page.close();
    expect(observed).toEqual({ scrollWidth: 320, sized: true, wrapped: true });
  });
});

// 020 phase 2 (I3; contracts/checks.md § Story tests; tasks.md T028): the `ocelle-code-block` stories (short, a long
// line wrapping, scroll overflowing at its start, in the middle and at its end, a focused scroll block, scroll fitting,
// digest, digest wrapping, digest scroll, right to left in wrap and in scroll mode, empty, scroll unlabelled). Each
// renders its code block in light and dark, defined, with the story's policy, digest mode and label, its `pre` in the
// sans, with base.css applied and no request outside the origin; the focused story's scroll box holds focus. At a
// 320 px viewport every wrap-mode story has a page scroll width of 320, beside a block wider than 0 (SC-002). In every
// overflowing scroll story, with no pointer event, Tab reaches the scroll box (the focused story's box has focus
// already) and the arrow keys, each pressed until the position stops changing, scroll it from one end of its range to
// the other (SC-005). The unlabelled story's box is a tab stop with no role beyond `generic` and an empty name in the
// CDP tree (research.md R-09, T021a). On a fresh load, within 1400 ms of its first render, with and without reduced
// motion (`matchMedia` asserted beside it), no animation runs in any story (SC-006).

/** One code block of a story: its policy, digest mode, label, the scroll box it renders and whether that overflows. */
interface CodeBlockSeen {
  readonly overflow: string | null;
  readonly digest: boolean;
  readonly label: string | null;
  readonly scrollBox: boolean;
  readonly overflowing: boolean;
  readonly sans: boolean;
}

const wrapBlock: CodeBlockSeen = { overflow: null, digest: false, label: null, scrollBox: false, overflowing: false, sans: true };
const scrollBlock = (label: string | null): CodeBlockSeen => ({ overflow: "scroll", digest: false, label, scrollBox: true, overflowing: true, sans: true });

const codeBlockStories: readonly { readonly id: string; readonly block: CodeBlockSeen; readonly wrap?: true; readonly keyboard?: true; readonly focused?: true }[] = [
  { id: "elements-ocelle-code-block--short", block: wrapBlock, wrap: true },
  { id: "elements-ocelle-code-block--wrap-long-line", block: wrapBlock, wrap: true },
  { id: "elements-ocelle-code-block--scroll-overflowing", block: scrollBlock("Deploy command"), keyboard: true },
  { id: "elements-ocelle-code-block--scroll-middle", block: scrollBlock("Deploy command"), keyboard: true },
  { id: "elements-ocelle-code-block--scroll-end", block: scrollBlock("Deploy command"), keyboard: true },
  { id: "elements-ocelle-code-block--scroll-focused", block: scrollBlock("Deploy command"), keyboard: true, focused: true },
  { id: "elements-ocelle-code-block--scroll-fitting", block: { ...scrollBlock("Build command"), overflowing: false } },
  { id: "elements-ocelle-code-block--digest", block: { ...wrapBlock, digest: true }, wrap: true },
  { id: "elements-ocelle-code-block--digest-wrapping", block: { ...wrapBlock, digest: true }, wrap: true },
  { id: "elements-ocelle-code-block--digest-scroll", block: { ...scrollBlock("Commit digest"), digest: true }, keyboard: true },
  { id: "elements-ocelle-code-block--right-to-left", block: wrapBlock, wrap: true },
  { id: "elements-ocelle-code-block--right-to-left-scroll", block: scrollBlock("Deploy commands"), keyboard: true },
  { id: "elements-ocelle-code-block--empty", block: wrapBlock, wrap: true },
  { id: "elements-ocelle-code-block--scroll-unlabelled", block: scrollBlock(null), keyboard: true },
];

/** What a code-block story's page shows: its theme, the base stylesheet, its code blocks and whether a scroll box holds focus. */
function observeCodeBlocks(page: Page): Promise<unknown> {
  return page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    base: {
      linked: [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].some((link) => link.href.endsWith("/base.css") && link.sheet !== null),
      scheme: getComputedStyle(document.documentElement).colorScheme,
    },
    defined: customElements.get("ocelle-code-block") !== undefined,
    blocks: [...document.querySelectorAll("#storybook-root ocelle-code-block")].map((block) => {
      const box = block.shadowRoot?.querySelector(".region-box");
      const code = block.shadowRoot?.querySelector('[part="code"]');
      return {
        overflow: block.getAttribute("overflow"),
        digest: block.hasAttribute("digest"),
        label: block.getAttribute("label"),
        scrollBox: box !== null && box !== undefined,
        overflowing: box !== null && box !== undefined && box.scrollWidth - box.clientWidth > 1,
        sans: code !== null && code !== undefined && getComputedStyle(code).fontFamily.startsWith('"Schibsted Grotesk"'),
      };
    }),
    focused: [...document.querySelectorAll("#storybook-root ocelle-code-block")].some((block) => document.activeElement === block && block.shadowRoot?.activeElement?.classList.contains("region-box") === true),
  }));
}

/** The scroll box of the story's first code block: whether it has focus, its `scrollLeft` and its scroll range. */
function scrollBoxState(page: Page): Promise<{ readonly focused: boolean; readonly scrollLeft: number; readonly range: number }> {
  return page.evaluate(() => {
    const block = document.querySelector("#storybook-root ocelle-code-block");
    const box = block?.shadowRoot?.querySelector(".region-box");
    return {
      focused: document.activeElement === block && block?.shadowRoot?.activeElement === box,
      scrollLeft: box?.scrollLeft ?? 0,
      range: box === null || box === undefined ? 0 : box.scrollWidth - box.clientWidth,
    };
  });
}

/** Presses `key` until the scroll box's position stops changing (at most 80 presses); returns the last position. */
async function pressToEnd(page: Page, key: "ArrowRight" | "ArrowLeft"): Promise<number> {
  let last = (await scrollBoxState(page)).scrollLeft;
  for (let press = 0; press < 80; press += 1) {
    await page.keyboard.press(key);
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const now = (await scrollBoxState(page)).scrollLeft;
    if (now === last) break;
    last = now;
  }
  return last;
}

/** The role and name of the unignored focusable nodes of a story page's accessibility tree that are not the root, over CDP. */
async function focusableNodes(page: Page): Promise<{ readonly role: string; readonly name: string }[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = (await session.send("Accessibility.getFullAXTree")) as { nodes: { ignored: boolean; role?: { value?: unknown }; name?: { value?: unknown }; properties?: { name: string; value: { value?: unknown } }[] }[] };
    return nodes
      .filter((node) => !node.ignored && node.role?.value !== "RootWebArea" && node.properties?.some((property) => property.name === "focusable" && property.value.value === true) === true)
      .map((node) => ({ role: typeof node.role?.value === "string" ? node.role.value : "", name: typeof node.name?.value === "string" ? node.name.value : "" }));
  } finally {
    await session.detach();
  }
}

describe("the ocelle-code-block stories in the built Storybook (020 US2, FR-050, I3)", { timeout: 60_000 }, () => {
  for (const { id, block, wrap, keyboard, focused } of codeBlockStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-code-block with the story's policy, digest mode and label, its pre in the sans, with base.css applied and no request outside the origin`, async () => {
        const { page, outside } = await open(id, theme, "ocelle-code-block");
        expect({ ...((await observeCodeBlocks(page)) as object), outside }).toEqual({ theme, base: { linked: true, scheme: theme }, defined: true, blocks: [block], focused: focused === true, outside: [] });
        await page.close();
      });
    }

    if (wrap === true) {
      it(`${id} at a 320 px viewport: the page scroll width is 320, beside a code block wider than 0 (SC-002)`, async () => {
        const page = await openWith(id, { width: 320, reducedMotion: "no-preference" }, "ocelle-code-block");
        const observed = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          sized: [...document.querySelectorAll("#storybook-root ocelle-code-block")].some((block) => block.getBoundingClientRect().width > 0 && (block.shadowRoot?.querySelector('[part="block"]')?.getBoundingClientRect().width ?? 0) > 0),
        }));
        await page.close();
        expect(observed).toEqual({ scrollWidth: 320, sized: true });
      });
    }

    if (keyboard === true) {
      it(`${id}: with no pointer event, Tab reaches the scroll box and the arrow keys scroll it from one end of its range to the other (SC-005)`, async () => {
        const page = await openWith(id, { width: 1280, reducedMotion: "reduce" }, "ocelle-code-block");
        if (focused !== true) await page.keyboard.press("Tab");
        const tabbed = await scrollBoxState(page);
        const right = await pressToEnd(page, "ArrowRight");
        const left = await pressToEnd(page, "ArrowLeft");
        const after = await scrollBoxState(page);
        await page.close();
        expect({ focused: tabbed.focused, overflowing: tabbed.range > 1, endToEnd: Math.abs(right - left - tabbed.range) <= 1, oneEndAtZero: Math.min(Math.abs(right), Math.abs(left)) <= 1, stillFocused: after.focused }).toEqual({ focused: true, overflowing: true, endToEnd: true, oneEndAtZero: true, stillFocused: true });
      });
    }

    for (const reducedMotion of ["reduce", "no-preference"] as const) {
      it(`${id} with prefers-reduced-motion ${reducedMotion}: within 1400 ms of its first render no animation runs, beside its code block rendered (SC-006)`, async () => {
        const page = await openWith(id, { width: 1280, reducedMotion }, "ocelle-code-block");
        const observed = await page.evaluate(() => ({
          timing: performance.now() - (window as unknown as { firstRender: number }).firstRender < 1400 ? "inside the first 1400 ms" : "read too late",
          reduce: matchMedia("(prefers-reduced-motion: reduce)").matches,
          running: [document, ...[...document.querySelectorAll("#storybook-root ocelle-code-block")].map((each) => each.shadowRoot)].flatMap((root) => root?.getAnimations() ?? []).filter((animation) => animation.playState === "running").length,
          rendered: [...document.querySelectorAll("#storybook-root ocelle-code-block")].every((block) => block.shadowRoot?.querySelector('[part="code"]') !== null && block.shadowRoot?.querySelector('[part="code"]') !== undefined),
        }));
        await page.close();
        expect(observed).toEqual({ timing: "inside the first 1400 ms", reduce: reducedMotion === "reduce", running: 0, rendered: true });
      });
    }
  }

  it("elements-ocelle-code-block--scroll-unlabelled: the overflowing scroll box is a tab stop (tabindex 0, Tab reaches it) whose CDP node, read at rest, has no role beyond generic and an empty name", async () => {
    const page = await openWith("elements-ocelle-code-block--scroll-unlabelled", { width: 1280, reducedMotion: "reduce" }, "ocelle-code-block");
    const tabindex = await page.evaluate(() => document.querySelector("#storybook-root ocelle-code-block")?.shadowRoot?.querySelector(".region-box")?.getAttribute("tabindex") ?? null);
    // Read at rest, as T021a read it: once focused, Chromium names the generic tab stop from its content
    // (reviews/phase-2/notes.md).
    const nodes = await focusableNodes(page);
    await page.keyboard.press("Tab");
    const tabbed = await scrollBoxState(page);
    await page.close();
    expect({ tabindex, focused: tabbed.focused, nodes }).toEqual({ tabindex: "0", focused: true, nodes: [{ role: "generic", name: "" }] });
  });
});

// 019 phase 1 (tasks.md T014; contracts/checks.md § Stories; I3): the 21 data-table stories. Each is in the built index
// and renders its `ocelle-data-table` in light and dark with no request outside the origin; loaded at 320 × 800 the
// page does not scroll sideways and the host has a size; the overflowing named stories expose a named `group` (the host
// `aria-label` story "Deployments", the blank host `aria-label` story "Work packages", spike Q1 (b)); the bounded
// sticky-header story is a `group` named "Work packages" scrolling in the block axis only at 1280 px with
// `data-block-fade="end"` at rest (Q-I4); the unbounded one has no `data-axis`, `overflow-y: hidden`, no block scroll, no
// tab stop, no group and no fade, with its table separated (C1 (b), Q-3 (c)); the room-rule one is a block-scrolling
// `group` with no fade, the space below its `<thead>` above 0 and below twice the fade depth (fixes-2 Q-1 (b)); and the
// two hover stories declare `parameters.ocelle.pointer.hover` with one selector matching one body cell, the striped
// one's on an even row (IQ-2 to IQ-5).
const dataTableStories = [
  "fits",
  "overflows-named-by-label",
  "overflows-named-by-caption",
  "overflows-unnamed",
  "overflows-named-by-host-aria-label",
  "overflows-blank-host-aria-label",
  "row-headers",
  "corner-header",
  "wrap-anywhere",
  "inside-prose",
  "right-to-left",
  "empty-body",
  "width-320",
  "no-table",
  "sticky-header-bounded",
  "sticky-header-unbounded",
  "sticky-header-room-rule",
  "numeric-column",
  "striped",
  "row-hovered",
  "striped-even-row-hovered",
].map((name) => `elements-ocelle-data-table--${name}`);

/** Opens a data-table story at `width` × 800 and waits for its elements. */
async function openDataTable(id: string, theme: "light" | "dark", width = 1280): Promise<{ readonly page: Page; readonly outside: readonly string[] }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" });
  await page.waitForSelector("#storybook-root ocelle-data-table", { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll("#storybook-root ocelle-data-table")].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
    for (let frame = 0; frame < 3; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  return { page, outside };
}

/** The first data table's region: its box's attributes and figures, `overflow-y`, the fade depth and the <thead>'s end. */
function readRegion(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    const host = document.querySelector("#storybook-root ocelle-data-table");
    const box = host?.shadowRoot?.querySelector(".region-box");
    if (host === null || box === null || box === undefined) return null;
    const rect = box.getBoundingClientRect();
    const head = host.querySelector(":scope > table > thead")?.getBoundingClientRect();
    const edge = host.shadowRoot?.querySelector(".region-edge.block-end")?.getBoundingClientRect();
    return {
      tabindex: box.getAttribute("tabindex"),
      role: box.getAttribute("role"),
      name: box.getAttribute("aria-label"),
      axis: box.getAttribute("data-axis"),
      blockFade: box.getAttribute("data-block-fade"),
      overflowY: getComputedStyle(box).overflowY,
      blockScroll: box.scrollHeight - box.clientHeight,
      inlineScroll: box.scrollWidth - box.clientWidth,
      collapse: getComputedStyle(host.querySelector(":scope > table") ?? host).borderCollapse,
      space: head === undefined ? null : rect.top + box.clientHeight - head.bottom,
      depth: edge?.height ?? 0,
    };
  });
}

describe("the ocelle-data-table stories in the built Storybook (019 FR-050, T014)", { timeout: 60_000 }, () => {
  it("are all in the built index", () => {
    const index = JSON.parse(readFileSync(join(built.out, "index.json"), "utf8")) as { entries?: Record<string, unknown> };
    expect(dataTableStories.filter((id) => index.entries?.[id] === undefined)).toEqual([]);
  });

  for (const id of dataTableStories) {
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ocelle-data-table with no request outside the origin`, async () => {
        const { page, outside } = await openDataTable(id, theme);
        const observed = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme, defined: customElements.get("ocelle-data-table") !== undefined, region: document.querySelector("#storybook-root ocelle-data-table")?.shadowRoot?.querySelector(".region-box") !== null }));
        await page.close();
        expect({ observed, outside }).toEqual({ observed: { theme, defined: true, region: true }, outside: [] });
      });
    }

    it(`${id} at 320 px: the page does not scroll sideways and the host has a size`, async () => {
      const { page } = await openDataTable(id, "light", 320);
      const observed = await page.evaluate(() => {
        const host = document.querySelector("#storybook-root ocelle-data-table")?.getBoundingClientRect();
        return { scrollWidth: document.documentElement.scrollWidth, sized: host !== undefined && host.width > 0 && host.height > 0 };
      });
      const scrollWidth = await readScrollWidth(page.mainFrame());
      await page.close();
      expect({ ...observed, read: scrollWidth }).toEqual({ scrollWidth: 320, sized: true, read: 320 });
    });
  }

  it.each([
    ["overflows-named-by-label", "Work packages"],
    ["overflows-named-by-caption", "Work packages"],
    ["overflows-named-by-host-aria-label", "Deployments"],
    ["overflows-blank-host-aria-label", "Work packages"],
  ])("%s: the overflowing region is a group named %s", async (name, label) => {
    const { page } = await openDataTable(`elements-ocelle-data-table--${name}`, "light");
    const region = (await readRegion(page)) as { tabindex: string | null; role: string | null; name: string | null } | null;
    await page.close();
    expect(region === null ? null : { tabindex: region.tabindex, role: region.role, name: region.name }).toEqual({ tabindex: "0", role: "group", name: label });
  });

  it("sticky header, bounded / unbounded / under the room rule, at 1280 px: block scroll and the fade as Q-I4, Q-3 (c), C1 (b) and fixes-2 Q-1 (b) state", async () => {
    const read = async (name: string): Promise<Record<string, unknown> | null> => {
      const { page } = await openDataTable(`elements-ocelle-data-table--${name}`, "light");
      const region = (await readRegion(page)) as Record<string, unknown> | null;
      await page.close();
      return region;
    };
    const bounded = await read("sticky-header-bounded");
    const unbounded = await read("sticky-header-unbounded");
    const room = await read("sticky-header-room-rule");
    const pick = (region: Record<string, unknown> | null, keys: readonly string[]): unknown => (region === null ? null : Object.fromEntries(keys.map((key) => [key, region[key]])));
    expect({
      bounded: pick(bounded, ["tabindex", "role", "name", "axis", "blockFade"]),
      boundedScrolls: bounded !== null && Number(bounded.blockScroll) > 1 && Number(bounded.inlineScroll) <= 1,
      unbounded: pick(unbounded, ["tabindex", "role", "name", "axis", "blockFade", "overflowY", "blockScroll", "collapse"]),
      room: pick(room, ["tabindex", "role", "name", "blockFade"]),
      roomScrolls: room !== null && Number(room.blockScroll) > 1,
      roomSpace: room !== null && Number(room.space) > 0 && Number(room.space) < 2 * Number(room.depth),
    }).toEqual({
      bounded: { tabindex: "0", role: "group", name: "Work packages", axis: "both", blockFade: "end" },
      boundedScrolls: true,
      unbounded: { tabindex: null, role: null, name: null, axis: null, blockFade: null, overflowY: "hidden", blockScroll: 0, collapse: "separate" },
      room: { tabindex: "0", role: "group", name: "Work packages", blockFade: null },
      roomScrolls: true,
      roomSpace: true,
    });
  });

  it("the two hover stories declare parameters.ocelle.pointer.hover with one selector each, matching one body cell inside the viewport, the striped one's on an even row", async () => {
    const source = readStories("data-table.stories.ts");
    const selectors = [...source.matchAll(/pointer:\s*\{\s*hover:\s*"([^"]+)"\s*\}/g)].map((match) => match[1] ?? "");
    const check = async (name: string, selector: string): Promise<unknown> => {
      const { page } = await openDataTable(`elements-ocelle-data-table--${name}`, "light");
      const observed = await page.evaluate((selector) => {
        const matches = [...document.querySelectorAll(selector)];
        const cell = matches[0];
        const row = cell?.parentElement;
        const rect = cell?.getBoundingClientRect();
        return {
          matches: matches.length,
          bodyCell: cell !== undefined && /^(TD|TH)$/.test(cell.tagName) && row?.parentElement?.tagName === "TBODY",
          even: row === null || row === undefined ? null : ([...(row.parentElement?.children ?? [])].indexOf(row) + 1) % 2 === 0,
          inside: rect !== undefined && rect.width > 0 && rect.left >= 0 && rect.top >= 0 && rect.right <= 1280 && rect.bottom <= 800,
        };
      }, selector);
      await page.close();
      return observed;
    };
    const hovered = selectors.length === 2 ? await check("row-hovered", selectors[0] ?? "") : null;
    const striped = selectors.length === 2 ? await check("striped-even-row-hovered", selectors[1] ?? "") : null;
    expect({ declared: selectors.length, hovered, striped }).toEqual({
      declared: 2,
      hovered: { matches: 1, bodyCell: true, even: false, inside: true },
      striped: { matches: 1, bodyCell: true, even: true, inside: true },
    });
  });
});

// 019 phase 2 (tasks.md T038; contracts/checks.md § Stories; I3; phase 2 spike Q1 (b)): the 13 timeline stories. Each is
// in the built index and renders its timeline (or, in the standalone story, its events) in light and dark with no
// request outside the origin; loaded at 320 × 800 the page does not scroll sideways and the element has a size (the
// empty timeline an inline size only, as it renders nothing); every list is named, except in the empty and the
// standalone stories, which render no list node; the standalone events have a size; and the two host `aria-label`
// stories name the list "History" and "Mission history".
const timelineStoryNames = [
  "three-events",
  "without-time",
  "marked-up-times",
  "long-identifier-wrap",
  "link-in-event",
  "one-event",
  "hidden-event",
  "right-to-left",
  "width-320",
  "empty",
  "standalone-events",
  "named-by-host-aria-label",
  "blank-host-aria-label",
];
const timelineStories = timelineStoryNames.map((name) => `elements-ocelle-event-timeline--${name}`);
const unlisted = ["empty", "standalone-events"];

/** Opens a timeline story at `width` × 800 and waits for its elements. */
async function openTimeline(id: string, theme: "light" | "dark", width = 1280): Promise<{ readonly page: Page; readonly outside: readonly string[] }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" });
  await page.waitForSelector("#storybook-root ocelle-event-timeline, #storybook-root ocelle-timeline-event", { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll("#storybook-root ocelle-event-timeline, #storybook-root ocelle-timeline-event")].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
    for (let frame = 0; frame < 3; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  return { page, outside };
}

/** The names of the page's unignored `list` nodes. */
async function listNames(page: Page): Promise<string[]> {
  const session = await page.context().newCDPSession(page);
  try {
    const { nodes } = (await session.send("Accessibility.getFullAXTree")) as { nodes: { ignored: boolean; role?: { value?: unknown }; name?: { value?: unknown } }[] };
    return nodes.filter((node) => !node.ignored && node.role?.value === "list").map((node) => (typeof node.name?.value === "string" ? node.name.value : ""));
  } finally {
    await session.detach();
  }
}

describe("the ocelle-event-timeline stories in the built Storybook (019 FR-050, T038)", { timeout: 60_000 }, () => {
  it("are all in the built index", () => {
    const index = JSON.parse(readFileSync(join(built.out, "index.json"), "utf8")) as { entries?: Record<string, unknown> };
    expect(timelineStories.filter((id) => index.entries?.[id] === undefined)).toEqual([]);
  });

  for (const name of timelineStoryNames) {
    const id = `elements-ocelle-event-timeline--${name}`;
    const element = name === "standalone-events" ? "ocelle-timeline-event" : "ocelle-event-timeline";
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ${element} with no request outside the origin`, async () => {
        const { page, outside } = await openTimeline(id, theme);
        const observed = await page.evaluate((element) => ({ theme: document.documentElement.dataset.theme, defined: customElements.get(element) !== undefined, rendered: document.querySelector(`#storybook-root ${element}`)?.shadowRoot?.childElementCount !== undefined }), element);
        await page.close();
        expect({ observed, outside }).toEqual({ observed: { theme, defined: true, rendered: true }, outside: [] });
      });
    }

    it(`${id} at 320 px: the page does not scroll sideways and the ${element} has a size`, async () => {
      const { page } = await openTimeline(id, "light", 320);
      const observed = await page.evaluate((element) => {
        const host = document.querySelector(`#storybook-root ${element}`)?.getBoundingClientRect();
        return { scrollWidth: document.documentElement.scrollWidth, inline: host !== undefined && host.width > 0, block: host !== undefined && host.height > 0 };
      }, element);
      const scrollWidth = await readScrollWidth(page.mainFrame());
      await page.close();
      expect({ ...observed, read: scrollWidth }).toEqual({ scrollWidth: 320, inline: true, block: name !== "empty", read: 320 });
    });

    it(`${id}: ${unlisted.includes(name) ? "renders no list node" : "every list is named, and there is one"}`, async () => {
      const { page } = await openTimeline(id, "light");
      const names = await listNames(page);
      await page.close();
      expect(unlisted.includes(name) ? { lists: names.length } : { lists: names.length, unnamed: names.filter((each) => each.trim() === "").length }).toEqual(unlisted.includes(name) ? { lists: 0 } : { lists: 1, unnamed: 0 });
    });
  }

  it("standalone events: two ocelle-timeline-events with a size each, outside a timeline, each its time above its content", async () => {
    const { page } = await openTimeline("elements-ocelle-event-timeline--standalone-events", "light");
    const observed = await page.evaluate(() => {
      const events = [...document.querySelectorAll("#storybook-root ocelle-timeline-event")];
      return {
        count: events.length,
        timelines: document.querySelectorAll("#storybook-root ocelle-event-timeline").length,
        sized: events.every((event) => event.getBoundingClientRect().width > 0 && event.getBoundingClientRect().height > 0),
        above: events.every((event) => {
          const time = event.shadowRoot?.querySelector('[part="time"]')?.getBoundingClientRect();
          const content = event.shadowRoot?.querySelector('[part="content"]')?.getBoundingClientRect();
          return time !== undefined && content !== undefined && time.bottom <= content.top + 0.5;
        }),
      };
    });
    await page.close();
    expect(observed).toEqual({ count: 2, timelines: 0, sized: true, above: true });
  });

  it.each([
    ["named-by-host-aria-label", "History"],
    ["blank-host-aria-label", "Mission history"],
  ])("%s: the list is named %s", async (name, label) => {
    const { page } = await openTimeline(`elements-ocelle-event-timeline--${name}`, "light");
    const names = await listNames(page);
    await page.close();
    expect(names).toEqual([label]);
  });
});

// 019 phase 3 (tasks.md T061; contracts/checks.md § Stories; I3; phase 3 spike Q1 (b)): the 14 chain stories. Each is
// in the built index and renders its chain (or, in the standalone story, its steps) in light and dark with no request
// outside the origin; loaded at 320 × 800 the page does not scroll sideways and the element has a size (the empty
// chain an inline size only, as it renders nothing); every list is named, except in the unnamed story, whose one list
// has no name, and the empty and standalone stories, which render no list node; the standalone steps have a size; and
// the two host `aria-label` stories name the list "Proof" and "Evidence".
const chainStoryNames = [
  "six-steps",
  "wrapped-320",
  "mixed-chips",
  "all-chips",
  "twenty-steps",
  "long-step",
  "wrap-anywhere",
  "hidden-step",
  "right-to-left",
  "unnamed",
  "empty",
  "standalone-steps",
  "named-by-host-aria-label",
  "blank-host-aria-label",
];
const chainStories = chainStoryNames.map((name) => `elements-ocelle-evidence-chain--${name}`);
const chainUnlisted = ["empty", "standalone-steps"];

/** Opens a chain story at `width` × 800 and waits for its elements. */
async function openChain(id: string, theme: "light" | "dark", width = 1280): Promise<{ readonly page: Page; readonly outside: readonly string[] }> {
  if (browser === undefined) throw new Error("the suite did not start");
  const page = await browser.newPage({ viewport: { width, height: 800 }, reducedMotion: "reduce" });
  const outside: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(`${origin}/`)) outside.push(request.url());
  });
  await page.goto(`${origin}/iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`, { waitUntil: "load" });
  await page.waitForSelector("#storybook-root ocelle-evidence-chain, #storybook-root ocelle-evidence-step", { state: "attached", timeout: 10_000 }).catch(() => undefined);
  await page.evaluate(async () => {
    await Promise.all([...document.querySelectorAll("#storybook-root ocelle-evidence-chain, #storybook-root ocelle-evidence-step")].map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
    for (let frame = 0; frame < 3; frame += 1) await new Promise((resolve) => requestAnimationFrame(resolve));
  });
  return { page, outside };
}

describe("the ocelle-evidence-chain stories in the built Storybook (019 FR-050, T061)", { timeout: 60_000 }, () => {
  it("are all in the built index", () => {
    const index = JSON.parse(readFileSync(join(built.out, "index.json"), "utf8")) as { entries?: Record<string, unknown> };
    expect(chainStories.filter((id) => index.entries?.[id] === undefined)).toEqual([]);
  });

  for (const name of chainStoryNames) {
    const id = `elements-ocelle-evidence-chain--${name}`;
    const element = name === "standalone-steps" ? "ocelle-evidence-step" : "ocelle-evidence-chain";
    for (const theme of ["light", "dark"] as const) {
      it(`${id} in ${theme}: renders its ${element} with no request outside the origin`, async () => {
        const { page, outside } = await openChain(id, theme);
        const observed = await page.evaluate((element) => ({ theme: document.documentElement.dataset.theme, defined: customElements.get(element) !== undefined, rendered: document.querySelector(`#storybook-root ${element}`)?.shadowRoot?.childElementCount !== undefined }), element);
        await page.close();
        expect({ observed, outside }).toEqual({ observed: { theme, defined: true, rendered: true }, outside: [] });
      });
    }

    it(`${id} at 320 px: the page does not scroll sideways and the ${element} has a size`, async () => {
      const { page } = await openChain(id, "light", 320);
      const observed = await page.evaluate((element) => {
        const host = document.querySelector(`#storybook-root ${element}`)?.getBoundingClientRect();
        return { scrollWidth: document.documentElement.scrollWidth, inline: host !== undefined && host.width > 0, block: host !== undefined && host.height > 0 };
      }, element);
      const scrollWidth = await readScrollWidth(page.mainFrame());
      await page.close();
      expect({ ...observed, read: scrollWidth }).toEqual({ scrollWidth: 320, inline: true, block: name !== "empty", read: 320 });
    });

    it(`${id}: ${chainUnlisted.includes(name) ? "renders no list node" : name === "unnamed" ? "has one list, unnamed" : "every list is named, and there is one"}`, async () => {
      const { page } = await openChain(id, "light");
      const names = await listNames(page);
      await page.close();
      expect(chainUnlisted.includes(name) ? { lists: names.length } : { lists: names.length, unnamed: names.filter((each) => each.trim() === "").length }).toEqual(chainUnlisted.includes(name) ? { lists: 0 } : { lists: 1, unnamed: name === "unnamed" ? 1 : 0 });
    });
  }

  it("standalone steps: a default and a chip ocelle-evidence-step with a size each, outside a chain, each its content part with no list node", async () => {
    const { page } = await openChain("elements-ocelle-evidence-chain--standalone-steps", "light");
    const observed = await page.evaluate(() => {
      const steps = [...document.querySelectorAll("#storybook-root ocelle-evidence-step")];
      return {
        count: steps.length,
        chips: steps.filter((step) => step.getAttribute("variant") === "chip").length,
        chains: document.querySelectorAll("#storybook-root ocelle-evidence-chain").length,
        sized: steps.every((step) => step.getBoundingClientRect().width > 0 && step.getBoundingClientRect().height > 0),
        content: steps.every((step) => step.shadowRoot?.querySelector('[part="content"]') !== null && step.shadowRoot !== null),
      };
    });
    const names = await listNames(page);
    await page.close();
    expect({ ...observed, lists: names.length }).toEqual({ count: 2, chips: 1, chains: 0, sized: true, content: true, lists: 0 });
  });

  it.each([
    ["named-by-host-aria-label", "Proof"],
    ["blank-host-aria-label", "Evidence"],
  ])("%s: the list is named %s", async (name, label) => {
    const { page } = await openChain(`elements-ocelle-evidence-chain--${name}`, "light");
    const names = await listNames(page);
    await page.close();
    expect(names).toEqual([label]);
  });
});

/** A stories file's text, empty while it does not exist. */
function readStories(file: string): string {
  const url = new URL(`../../stories/${file}`, import.meta.url);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}
