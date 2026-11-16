import { readFileSync } from "node:fs";
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
