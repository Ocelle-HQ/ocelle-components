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
