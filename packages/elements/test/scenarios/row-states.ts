// The shared bodies of User Story 5's browser scenarios, the row's states and the card layout (012 spec US5-1 to
// US5-12 and the edge cases of contracts/checks.md § Edge cases and plan decisions that belong to phase 6: `current`
// on a button-mode row, `unavailable` with `current`, `busy` with `unavailable`, the stretched and the restyled host;
// FR-001, FR-003, FR-033, FR-037 to FR-039, FR-041, FR-042, FR-052; research.md R-02, R-06, R-10, R-12; plan decisions
// 9, 13, 16, 21, 23, 30 and 31; tasks.md T061). Each shared body is written once against the driver and run in process
// on the element source (test/action-row.test.ts) and on the built browser build on the strict-CSP fixture
// (test/browser/action-row.test.ts). The link bodies come twice (research.md R-11): `rowStateSinkScenarios` on the
// in-process navigation sink's records, `rowStateNavigationScenarios` on the fixture's real navigation and new tabs.
//
// Expected values are written by hand: colours by token name from packages/tokens/test/expected.ts (`tokenColour`),
// the current mark from US5-4 and R-12 (an `accent-low` surface, `chrome-hover` with `ground="chrome"`, and a
// `color-current` bar of `--ocelle-bar-width`, 3 px, 7 to 10 px inside the border edge, after the ring's band at 2 to
// 5 px and a gap of `--ocelle-focus-offset`, 2 px, of the surface), the unavailable look from US5-7 and R-10 § Sibling
// ink (`color-disabled-ink`, no hover), forced colours from R-12's table read as `resolveColour(<keyword>)`, the card
// from FR-038 and R-10 (the title gap `--ocelle-space-1`, 4 px; the inline padding `--ocelle-space-3` plus the 1 px
// border), and the restyled hosts' outside points from the phase 6 spike (reviews/phase-6/spike.md check (1)).
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named here (run once
// and recorded in reviews/phase-6/plants.md):
// - the ring, the gap and the bar are read apart on a focused current row (US5-4); plants: the bar at
//   `inset-inline-start: 0`; the bar at the ring's inner edge;
// - an unavailable row is not activated by any click, key or `click()` (US5-6) beside its available twin's one event,
//   and its link has no `href` (decision 9); plant: no host listener (the restyled and stretched cases);
// - an unavailable row's title, description, tags and trailing icon take the disabled ink and `GrayText` (US5-7);
//   plant: sibling colours removed;
// - axe reports nothing on unavailable rows with description and tags, whose sibling wrappers are `aria-disabled`
//   (decision 31); plant: the wrappers without `aria-disabled`;
// - a current row's surface does not change on hover (US5-4, US5-11) beside the default row's hover border;
// - a modifier or middle click on a link row dispatches nothing and is not prevented (US5-2, decision 13) beside the
//   plain click's event and navigation.
import { meaningful, severe } from "./button.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Navigation, NavigationScenario, Outcome } from "./link.ts";
import type { Box, Driver, EventRecord, Modifier, NavigationRecord, Palette, Pixels } from "./driver.ts";

export type { Scenario } from "./icon.ts";

const control = '[part="control"]';
const titlePart = '[part="title"]';
const descriptionPart = '[part="description"]';
const tagsPart = '[part="tags"]';
const trailingWrapper = ".icon-slot.trailing";
/** Plan decision 30's hit layer, which draws the surface, the border, the ring and the bar, and the bar inside it. */
const hit = ".hit";
const bar = ".bar";
const activate = "ocelle-action-row-activate";
const transparent = "rgba(0, 0, 0, 0)";
const themes: readonly Palette[] = ["light", "dark"];
const target = "link-target.html";

const colour = (token: string, theme: Palette): string => tokenColour(`color-${token}`, theme);
const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;

/** The native buttons beside the rows take the minimum target, so axe's target-size has nothing to report. */
const nativeRules = "#before, #after, #start { min-block-size: 44px; min-inline-size: 44px; }";
/** The grounds of the pages: a class per ground token, its colour as the background and its ink as the text. */
const groundRules = ["canvas", "accent-low", "chrome"].map((ground) => `.on-${ground} { background-color: var(--ocelle-color-${ground}); color: var(--ocelle-color-${ground === "chrome" ? "chrome-ink" : "ink"}); padding: 8px; }`).join(" ");

/** A row's content with every slot; the ids of the description, the first tag and the trailing icon start with `id`. */
function slots(id: string, title = "Mission 42"): string {
  return `<ocelle-icon slot="icon" name="folder"></ocelle-icon>${title}<span id="${id}-description" slot="description">Due Friday</span><span id="${id}-tag" slot="tags">Blocked</span><span slot="tags">Design</span><ocelle-icon id="${id}-trailing" slot="trailing" name="arrow-end"></ocelle-icon>`;
}

/** The number of dispatches (distinct serials) of `type` at the row `id`. */
function dispatches(records: readonly EventRecord[], type: string, id: string): number {
  return new Set(records.filter((record) => record.type === type && record.target === `ocelle-action-row#${id}`).map((record) => record.serial)).size;
}

/** The click, auxclick and activate dispatches at the row `id`, and every record anywhere. */
function counts(records: readonly EventRecord[], id: string): { readonly click: number; readonly auxclick: number; readonly activate: number } {
  return { click: dispatches(records, "click", id), auxclick: dispatches(records, "auxclick", id), activate: dispatches(records, activate, id) };
}

const none = { click: 0, auxclick: 0, activate: 0 };
const once = { click: 1, auxclick: 0, activate: 1 };

/** One record of the navigation sink, with the changes given. */
function navigation(changes: Partial<NavigationRecord> = {}): NavigationRecord {
  return { type: "click", defaultPrevented: false, button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, href: target, ...changes };
}

/** The listeners from the row out to `window` when it sits in `<div id="wrap">`. */
const path = ["ocelle-action-row#r", "div#wrap", "body", "html", "document", "window"];

/** The ways a link row is activated, each from a fresh mount, with whether its click is trusted. */
const activations = [
  { name: "a pointer click", act: (driver: Driver, id: string) => driver.click(id), trusted: true },
  {
    name: "Enter on the focused row",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
    trusted: true,
  },
  { name: "the element's click() method", act: (driver: Driver, id: string) => driver.callClick(id), trusted: false },
] as const;

const modifierClicks: readonly { readonly modifier: Modifier; readonly flag: "ctrlKey" | "metaKey" | "shiftKey" | "altKey" }[] = [
  { modifier: "Control", flag: "ctrlKey" },
  { modifier: "Meta", flag: "metaKey" },
  { modifier: "Shift", flag: "shiftKey" },
  { modifier: "Alt", flag: "altKey" },
];

/** Every way to try an unavailable row: clicks (on the control, the description and a tag), modifier and middle clicks, keys and `click()`. */
async function tryAll(driver: Driver, id: string): Promise<void> {
  await driver.click(id);
  await driver.click(`${id}-description`);
  await driver.click(`${id}-tag`);
  for (const { modifier } of modifierClicks) await driver.click(id, { modifiers: [modifier] });
  await driver.click(id, { button: "middle" });
  await driver.focus(id);
  await driver.press("Enter");
  await driver.press(" ");
  await driver.callClick(id);
}

/** The colour of one pixel, as `getComputedStyle` writes an opaque colour. */
function pixel(pixels: Pixels, x: number, y: number): string {
  const at = (Math.floor(y) * pixels.width + Math.floor(x)) * 4;
  return `rgb(${String(pixels.data[at] ?? 0)}, ${String(pixels.data[at + 1] ?? 0)}, ${String(pixels.data[at + 2] ?? 0)})`;
}

function inside(point: { x: number; y: number }, box: Box): boolean {
  return point.x >= box.x && point.x < box.x + box.width && point.y >= box.y && point.y < box.y + box.height;
}

function same(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs(a.width - b.width) <= 0.5 && Math.abs(a.height - b.height) <= 0.5;
}

/** The host's size and its content boxes (title, description, tags, trailing) relative to the host, to the tenth of a pixel. */
async function geometry(driver: Driver, id: string): Promise<number[]> {
  const host = await driver.box(id);
  const parts = await Promise.all([titlePart, descriptionPart, tagsPart, trailingWrapper].map((part) => driver.box(id, part)));
  return [host.width, host.height, ...parts.flatMap((part) => [part.x - host.x, part.y - host.y, part.width, part.height])].map(tenth);
}

/**
 * The surface, border colour and border width of a row, read from its hit layer; a flush row's border colour is null,
 * since it draws no border (its width is read instead).
 */
async function look(driver: Driver, id: string): Promise<{ readonly fill: string; readonly border: string | null; readonly width: string }> {
  const flush = (await driver.attribute(id, "presentation")) === "flush";
  return { fill: await driver.computed(id, "background-color", hit), border: flush ? null : await driver.computed(id, "border-top-color", hit), width: await driver.computed(id, "border-top-width", hit) };
}

/** The inks of a row: its title and, on their own wrappers, its description, tags and trailing icon. */
async function inks(driver: Driver, id: string): Promise<Record<string, string>> {
  return { title: await driver.computed(id, "color", titlePart), description: await driver.computed(id, "color", descriptionPart), tags: await driver.computed(id, "color", tagsPart), trailing: await driver.computed(id, "color", trailingWrapper) };
}

/** The `aria-disabled` of the description, tags and trailing wrappers (decision 31), null when absent. */
async function wrappers(driver: Driver, id: string): Promise<(string | null)[]> {
  const parts = await driver.elements(id);
  const of = (test: (attributes: Readonly<Record<string, string>>) => boolean): string | null => parts.find((part) => test(part.attributes))?.attributes["aria-disabled"] ?? null;
  return [of((a) => a.part === "description"), of((a) => a.part === "tags"), of((a) => (a.class ?? "").split(" ").includes("trailing"))];
}

/** The inner control's local name and the attributes the state bodies read, absent ones left out. */
async function inner(driver: Driver, id: string): Promise<Record<string, string>> {
  const found = (await driver.elements(id)).find((part) => part.attributes.part === "control");
  if (found === undefined) return { tag: "none" };
  return Object.fromEntries([["tag", found.name], ...["href", "target", "rel", "role", "tabindex", "aria-disabled", "aria-busy", "aria-current"].flatMap((name) => (found.attributes[name] === undefined ? [] : [[name, found.attributes[name]] as const]))]);
}

/** The bar's box relative to the row's inline-start border edge: its start, its width and its block size, or absent. */
async function barPlace(driver: Driver, id: string, direction: "ltr" | "rtl"): Promise<unknown> {
  const [host, box] = [await driver.box(id), await driver.box(id, bar)];
  if (box.display === "absent" || box.display === "none") return "absent";
  const start = direction === "ltr" ? box.x - host.x : host.x + host.width - (box.x + box.width);
  return { start: tenth(start), width: tenth(box.width), height: tenth(box.height) };
}

/** US5-4's current mark in one theme: a default and a flush row, idle, hovered, and with `current` toggled. */
function currentMark(theme: Palette): Scenario {
  const c = (token: string): string => colour(token, theme);
  return {
    name: `US5-4, FR-037 (${theme}): a current row (current="page") with every slot shows the current mark in both presentations: the hit layer's surface accent-low and a bar in color-current, 3 px wide, its start 7 px from the border edge, the row's block size inside the border (a flush row: no border); hovered, the surface stays accent-low (a default row's border becomes hover-border, a flush row has none); setting and removing current moves and resizes no content box; axe reports nothing, no color-contrast incomplete result (US5-4, FR-036, FR-052)`,
    run: async (driver) => {
      await driver.mount(`<div class="on-canvas box"><ocelle-action-row id="d" current="page">${slots("d")}</ocelle-action-row><ocelle-action-row id="f" current="page" presentation="flush">${slots("f")}</ocelle-action-row><ocelle-action-row id="t">${slots("t")}</ocelle-action-row></div><p id="away">Away</p>`);
      await driver.rules(`${groundRules} .box { inline-size: 300px; }`);
      await driver.theme(theme);
      await driver.hover("away");
      const found: Record<string, unknown> = {};
      for (const id of ["d", "f"]) {
        const host = await driver.box(id);
        const idle = { ...(await look(driver, id)), bar: await driver.computed(id, "background-color", bar), place: await barPlace(driver, id, "ltr"), full: tenth(host.height) };
        await driver.hover(id);
        const hovered = await look(driver, id);
        await driver.hover("away");
        found[id] = { idle, hovered };
      }
      const before = await geometry(driver, "t");
      await driver.setAttribute("t", "current", "page");
      const set = { geometry: JSON.stringify(await geometry(driver, "t")) === JSON.stringify(before), fill: (await look(driver, "t")).fill };
      await driver.setAttribute("t", "current", null);
      const removed = { geometry: JSON.stringify(await geometry(driver, "t")) === JSON.stringify(before), fill: (await look(driver, "t")).fill, bar: await barPlace(driver, "t", "ltr") };
      return { found, set, removed, axe: await driver.axe() };
    },
    expected: {
      found: {
        d: { idle: { fill: c("accent-low"), border: c("control-border"), width: "1px", bar: c("current"), place: { start: 7, width: 3, height: 64.4 }, full: 66.4 }, hovered: { fill: c("accent-low"), border: c("hover-border"), width: "1px" } },
        f: { idle: { fill: c("accent-low"), border: null, width: "0px", bar: c("current"), place: { start: 7, width: 3, height: 54 }, full: 54 }, hovered: { fill: c("accent-low"), border: null, width: "0px" } },
      },
      set: { geometry: true, fill: c("accent-low") },
      removed: { geometry: true, fill: c("sheet"), bar: "absent" },
      axe: [],
    },
  };
}

/** US5-4's focused current row in one theme and direction: ring band, gap and bar read apart. */
function ringAndBar(theme: Palette, direction: "ltr" | "rtl"): Scenario {
  const c = (token: string): string => colour(token, theme);
  return {
    name: `US5-4, decision 21 (${theme}, ${direction}): on a focused current row, default and flush, at the block centre the pixel 3 px in from the inline-start border edge is the ring (color-focus), 6 px in the gap (the accent-low surface), 8 px in the bar (color-current) and 11 px in the surface again; the ring is on the other three sides too (FR-037, FR-041)`,
    run: async (driver) => {
      await driver.mount(`<div dir="${direction}" class="on-canvas box"><button id="before" type="button">Before</button><ocelle-action-row id="d" current="page">${slots("d")}</ocelle-action-row><ocelle-action-row id="f" current="page" presentation="flush">${slots("f")}</ocelle-action-row></div>`);
      await driver.rules(`${groundRules} ${nativeRules} .box { inline-size: 300px; }`);
      await driver.theme(theme);
      const read = async (id: string): Promise<unknown> => {
        const pixels = await driver.pixels(id);
        const [w, h] = [pixels.width, pixels.height];
        const at = (inset: number): string => pixel(pixels, direction === "ltr" ? inset : w - 1 - inset, h / 2);
        return { active: await driver.activeInner(id), ring: at(3), gap: at(6), bar: at(8), after: at(11), top: pixel(pixels, w / 2, 3), bottom: pixel(pixels, w / 2, h - 4), end: at(w - 4) };
      };
      await driver.focus("before");
      await driver.press("Tab");
      const d = await read("d");
      await driver.press("Tab");
      const f = await read("f");
      return { d, f, axe: await severe(driver) };
    },
    expected: {
      d: { active: "button", ring: c("focus"), gap: c("accent-low"), bar: c("current"), after: c("accent-low"), top: c("focus"), bottom: c("focus"), end: c("focus") },
      f: { active: "button", ring: c("focus"), gap: c("accent-low"), bar: c("current"), after: c("accent-low"), top: c("focus"), bottom: c("focus"), end: c("focus") },
      axe: [],
    },
  };
}

/** US5-11 and the unavailable look in one theme. */
function chromeAndUnavailable(theme: Palette): Scenario[] {
  const c = (token: string): string => colour(token, theme);
  const disabled = { title: c("disabled-ink"), description: c("disabled-ink"), tags: c("disabled-ink"), trailing: c("disabled-ink") };
  return [
    {
      name: `US5-11 (${theme}): a current row with ground="chrome" on color-chrome, default and flush, has the chrome-hover surface and the bar in color-current, and hovering changes neither; axe reports nothing (FR-037)`,
      run: async (driver) => {
        await driver.mount(`<div class="on-chrome"><ocelle-action-row id="d" current="page" ground="chrome">${slots("d")}</ocelle-action-row><ocelle-action-row id="f" current="true" ground="chrome" presentation="flush">${slots("f")}</ocelle-action-row></div><p id="away">Away</p>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        const found: Record<string, unknown> = {};
        for (const id of ["d", "f"]) {
          await driver.hover("away");
          const idle = { fill: (await look(driver, id)).fill, bar: await driver.computed(id, "background-color", bar) };
          await driver.hover(id);
          const hovered = { fill: (await look(driver, id)).fill, bar: await driver.computed(id, "background-color", bar) };
          found[id] = { idle, hovered };
        }
        await driver.hover("away");
        return { found, axe: await driver.axe() };
      },
      expected: {
        found: Object.fromEntries(["d", "f"].map((id) => [id, { idle: { fill: c("chrome-hover"), bar: c("current") }, hovered: { fill: c("chrome-hover"), bar: c("current") } }])),
        axe: [],
      },
    },
    {
      name: `US5-7, decisions 16 and 31 (${theme}): an unavailable row's title, description, tags and trailing icon are in color-disabled-ink (each read on its own wrapper), and its hover changes neither surface nor border (default: sheet and control-border; flush: no fill, no border); an unavailable current row keeps its current surface (accent-low, chrome-hover on chrome), unchanged on hover, with its bar in color-disabled-ink; its available twin's hover changes the surface (FR-036, FR-039)`,
      run: async (driver) => {
        const rows = [
          ["u", ""],
          ["uf", ' presentation="flush"'],
          ["uc", ' current="page"'],
          ["ucf", ' current="page" presentation="flush"'],
        ] as const;
        await driver.mount(`<div class="on-canvas">${rows.map(([id, extra]) => `<ocelle-action-row id="${id}" unavailable${extra}>${slots(id)}</ocelle-action-row>`).join("")}<ocelle-action-row id="a">${slots("a")}</ocelle-action-row></div><div class="on-chrome"><ocelle-action-row id="ch" unavailable current="page" ground="chrome">${slots("ch")}</ocelle-action-row></div><p id="away">Away</p>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        const found: Record<string, unknown> = {};
        for (const id of ["u", "uf", "uc", "ucf", "ch", "a"]) {
          await driver.hover("away");
          const idle = await look(driver, id);
          const ink = await inks(driver, id);
          const barColour = ["uc", "ucf", "ch"].includes(id) ? await driver.computed(id, "background-color", bar) : null;
          await driver.hover(id);
          const hovered = await look(driver, id);
          found[id] = { idle, hovered: JSON.stringify(hovered) === JSON.stringify(idle), ink, bar: barColour };
        }
        await driver.hover("away");
        return { found, axe: await driver.axe() };
      },
      expected: {
        found: {
          u: { idle: { fill: c("sheet"), border: c("control-border"), width: "1px" }, hovered: true, ink: disabled, bar: null },
          uf: { idle: { fill: transparent, border: null, width: "0px" }, hovered: true, ink: disabled, bar: null },
          uc: { idle: { fill: c("accent-low"), border: c("control-border"), width: "1px" }, hovered: true, ink: disabled, bar: c("disabled-ink") },
          ucf: { idle: { fill: c("accent-low"), border: null, width: "0px" }, hovered: true, ink: disabled, bar: c("disabled-ink") },
          ch: { idle: { fill: c("chrome-hover"), border: c("chrome-muted"), width: "1px" }, hovered: true, ink: disabled, bar: c("disabled-ink") },
          a: { idle: { fill: c("sheet"), border: c("control-border"), width: "1px" }, hovered: false, ink: { title: c("ink"), description: c("ink-soft"), tags: c("ink-soft"), trailing: c("ink") }, bar: null },
        },
        axe: [],
      },
    },
    {
      name: `Decision 31 (${theme}): unavailable rows with a description and tags, with and without current, default and flush, on canvas, with ground="accent-low" on accent-low and ground="chrome" on chrome, give 0 axe results of any impact (no color-contrast violation on the description and tags); their description, tags and trailing wrappers carry aria-disabled="true", and lose it once unavailable is removed, while the row keeps its accessibility tree (FR-042, FR-052)`,
      run: async (driver) => {
        const cases = (["canvas", "accent-low", "chrome"] as const).flatMap((ground) => (["default", "flush"] as const).flatMap((presentation) => [false, true].map((current) => ({ ground, presentation, current, id: `${ground}-${presentation}-${current ? "c" : "n"}` }))));
        const markup = (["canvas", "accent-low", "chrome"] as const).map(
          (ground) =>
            `<div class="on-${ground}">${cases
              .filter((each) => each.ground === ground)
              .map(({ id, presentation, current }) => `<ocelle-action-row id="${id}" unavailable${ground === "canvas" ? "" : ` ground="${ground}"`}${presentation === "flush" ? ' presentation="flush"' : ""}${current ? ' current="page"' : ""}>${slots(id)}</ocelle-action-row>`)
              .join("")}</div>`,
        );
        await driver.mount(markup.join(""));
        await driver.rules(groundRules);
        await driver.theme(theme);
        const axe = await driver.axe();
        const marked = Object.fromEntries(await Promise.all(cases.map(async ({ id }) => [id, await wrappers(driver, id)] as const)));
        const id = "accent-low-flush-c";
        const tree = async (): Promise<unknown> => {
          const state = await driver.axState(id, control);
          return { role: state.role, name: state.name, description: state.description, focusable: state.focusable, meaningful: await meaningful(driver, id) };
        };
        const unavailableTree = await tree();
        await driver.setAttribute(id, "unavailable", null);
        return { axe, marked, cleared: await wrappers(driver, id), sameTree: JSON.stringify(await tree()) === JSON.stringify(unavailableTree) };
      },
      expected: {
        axe: [],
        marked: Object.fromEntries(
          (["canvas", "accent-low", "chrome"] as const).flatMap((ground) => (["default", "flush"] as const).flatMap((presentation) => ["n", "c"].map((current) => [`${ground}-${presentation}-${current}`, ["true", "true", "true"]]))),
        ),
        cleared: [null, null, null],
        sameTree: true,
      },
    },
  ];
}

/** Forced colours with one palette: the current mark, a link row and the unavailable look (R-12's table). */
function forced(palette: Palette): Scenario {
  return {
    name: `US5-4, US5-7, FR-041, forced colours with the ${palette} palette: a current row's hit layer is Canvas and its bar Highlight, in button mode (title ButtonText) and link mode (title LinkText); an unavailable current row's title, description, tags and trailing icon are GrayText, its border GrayText and its bar GrayText, and its hover keeps the GrayText border; an unavailable flush row's hover draws no dashed outline, while its available twin's does (research.md R-12; plant: sibling colours removed)`,
    run: async (driver) => {
      await driver.mount(
        `<ocelle-action-row id="b" current="page">${slots("b")}</ocelle-action-row><ocelle-action-row id="l" current="page" href="#missions">${slots("l")}</ocelle-action-row>` +
          `<ocelle-action-row id="u" current="true" unavailable>${slots("u")}</ocelle-action-row><ocelle-action-row id="uf" presentation="flush" unavailable>Mission 9</ocelle-action-row><ocelle-action-row id="af" presentation="flush">Mission 10</ocelle-action-row><p id="away">Away</p>`,
      );
      await driver.forcedColors("active", palette);
      const keywords = ["ButtonText", "Highlight", "LinkText", "GrayText", "Canvas"];
      const resolved = await Promise.all(keywords.map((keyword) => driver.resolveColour(keyword)));
      const named = (value: string): string => keywords[resolved.indexOf(value)] ?? value;
      const read = async (id: string, property: string, part: string): Promise<string> => named(await driver.computed(id, property, part));
      await driver.hover("away");
      const mark = async (id: string): Promise<unknown> => ({ surface: await read(id, "background-color", hit), bar: await read(id, "background-color", bar), title: await read(id, "color", titlePart) });
      const unavailable = {
        surface: await read("u", "background-color", hit),
        bar: await read("u", "background-color", bar),
        border: await read("u", "border-top-color", hit),
        ...Object.fromEntries(await Promise.all(Object.entries({ title: titlePart, description: descriptionPart, tags: tagsPart, trailing: trailingWrapper }).map(async ([name, part]) => [name, await read("u", "color", part)] as const))),
      };
      await driver.hover("u");
      const unavailableHover = await read("u", "border-top-color", hit);
      await driver.hover("uf");
      const flushUnavailable = await driver.computed("uf", "outline-style", hit);
      await driver.hover("af");
      const flushAvailable = await driver.computed("af", "outline-style", hit);
      await driver.hover("away");
      return { distinct: new Set(resolved).size, button: await mark("b"), link: await mark("l"), unavailable, unavailableHover, flushUnavailable, flushAvailable, axe: await severe(driver) };
    },
    expected: {
      distinct: 5,
      button: { surface: "Canvas", bar: "Highlight", title: "ButtonText" },
      link: { surface: "Canvas", bar: "Highlight", title: "LinkText" },
      unavailable: { surface: "Canvas", bar: "GrayText", border: "GrayText", title: "GrayText", description: "GrayText", tags: "GrayText", trailing: "GrayText" },
      unavailableHover: "GrayText",
      flushUnavailable: "none",
      flushAvailable: "dashed",
      axe: [],
    },
  };
}

/** The page rules of a restyled host (spec "Restyled host"), each with the outside points the phase 6 spike lists for a title-only row in both modes (end, bottom). */
const restyles = [
  { rule: "display: block", outside: [false, false] },
  { rule: "display: flex; width: 100%", outside: [true, true] },
  { rule: "display: block; height: 90px", outside: [true, true] },
] as const;

/** One card's direction for US5-9 and US5-10. */
function card(direction: "ltr" | "rtl"): Scenario {
  return {
    name: `US5-9, US5-10, FR-038 (${direction}): in card layout the title line holds the icon and the title with the trailing arrow at its inline end (13 px inside the edge, on the title line, 20 px, mirrored under rtl), the description starts 4 px (--ocelle-space-1) below the title line at the content start and the tags 4 px below it; the title is the part title (a page rule on ::part(title) reaches it); a click on the description and on a tag each dispatch one ocelle-action-row-activate`,
    run: async (driver) => {
      await driver.mount(`<div dir="${direction}" class="box"><ocelle-action-row id="c" layout="card" row-id="c">${slots("c")}</ocelle-action-row></div>`);
      await driver.rules(".box { inline-size: 300px; } #c::part(title) { text-decoration-line: underline; }");
      const edge = (box: Box, side: "start" | "end"): number => ((direction === "ltr") === (side === "start") ? box.x : box.x + box.width);
      const host = await driver.box("c");
      const [title, description, tags, trailing, icon] = [await driver.box("c", titlePart), await driver.box("c", descriptionPart), await driver.box("c", tagsPart), await driver.box("c", trailingWrapper), await driver.box("c", ".icon-slot:not(.trailing)")];
      const arrow = await driver.box("c-trailing");
      const clicks: Record<string, unknown> = {};
      for (const part of ["description", "tag"]) {
        await driver.events("c", ["click", activate]);
        await driver.click(`c-${part}`);
        clicks[part] = counts(await driver.takeEvents(), "c");
      }
      return {
        titleGap: tenth(description.y - (title.y + title.height)),
        tagsGap: tenth(tags.y - (description.y + description.height)),
        trailingLine: Math.abs(trailing.y - title.y) <= 0.5,
        trailingEnd: tenth(Math.abs(edge(host, "end") - edge(trailing, "end"))),
        descriptionStart: tenth(Math.abs(edge(description, "start") - edge(icon, "start"))),
        tagsStart: tenth(Math.abs(edge(tags, "start") - edge(icon, "start"))),
        arrow: [tenth(arrow.width), tenth(arrow.height)],
        mirrored: await driver.computed("c-trailing", "scale", "svg"),
        part: await driver.computed("c", "text-decoration-line", titlePart),
        clicks,
        axe: await severe(driver),
      };
    },
    expected: {
      titleGap: 4,
      tagsGap: 4,
      trailingLine: true,
      trailingEnd: 13,
      descriptionStart: 0,
      tagsStart: 0,
      arrow: [20, 20],
      mirrored: direction === "rtl" ? "-1 1" : "none",
      part: "underline",
      clicks: { description: { click: 1, auxclick: 0, activate: 1 }, tag: { click: 1, auxclick: 0, activate: 1 } },
      axe: [],
    },
  };
}

export const rowStateScenarios: readonly Scenario[] = [
  {
    name: 'US5-1: <ocelle-action-row href="/missions/42" row-id="m-42">Mission 42</ocelle-action-row> is one node with a role other than generic or a name, of role link named Mission 42, focusable, its inner <a> with the href as written; Space on it dispatches no ocelle-action-row-activate and no click (FR-002, FR-033)',
    run: async (driver) => {
      await driver.mount('<div id="wrap"><ocelle-action-row id="r" href="/missions/42" row-id="m-42">Mission 42</ocelle-action-row></div>');
      const state = await driver.axState("r", control);
      await driver.events("r", ["click", activate]);
      await driver.focus("r");
      await driver.press(" ");
      return { meaningful: await meaningful(driver, "r"), state: { role: state.role, name: state.name, focusable: state.focusable }, inner: await inner(driver, "r"), space: counts(await driver.takeEvents(), "r"), axe: await severe(driver) };
    },
    expected: { meaningful: [{ role: "link", name: "Mission 42" }], state: { role: "link", name: "Mission 42", focusable: true }, inner: { tag: "a", href: "/missions/42" }, space: none, axe: [] },
  },
  {
    name: 'US5-3, the edge case of current on a button-mode row: current="page" and current="true" report aria-current with that value on the inner link, and on a button-mode row\'s inner button, and draw the bar; "step", "false", "" and no current report none and draw no bar; each value is reflected as written (FR-037)',
    run: async (driver) => {
      const values = [
        ["page", "page"],
        ["true", "true"],
        ["step", "step"],
        ["false", "false"],
        ["empty", ""],
      ] as const;
      await driver.mount(
        values.map(([id, value]) => `<ocelle-action-row id="${id}" href="#m" current="${value}">Mission</ocelle-action-row>`).join("") +
          '<ocelle-action-row id="absent" href="#m">Mission</ocelle-action-row><ocelle-action-row id="button" current="page">Mission</ocelle-action-row>',
      );
      const found: Record<string, unknown> = {};
      for (const id of [...values.map(([id]) => id), "absent", "button"]) found[id] = { current: await driver.current(id, control), bar: (await driver.box(id, bar)).display !== "absent", reflected: await driver.attribute(id, "current"), tag: (await inner(driver, id)).tag };
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: {
        page: { current: { attribute: "page", property: "page" }, bar: true, reflected: "page", tag: "a" },
        true: { current: { attribute: "true", property: "true" }, bar: true, reflected: "true", tag: "a" },
        step: { current: { attribute: null, property: null }, bar: false, reflected: "step", tag: "a" },
        false: { current: { attribute: null, property: null }, bar: false, reflected: "false", tag: "a" },
        empty: { current: { attribute: null, property: null }, bar: false, reflected: "", tag: "a" },
        absent: { current: { attribute: null, property: null }, bar: false, reflected: null, tag: "a" },
        button: { current: { attribute: "page", property: "page" }, bar: true, reflected: "page", tag: "button" },
      },
      axe: [],
    },
  },
  ...themes.map(currentMark),
  ...themes.flatMap((theme) => (["ltr", "rtl"] as const).map((direction) => ringAndBar(theme, direction))),
  ...themes.flatMap(chromeAndUnavailable),
  ...themes.map(forced),
  {
    name: "US5-5, decision 9: an unavailable button-mode row and an unavailable link row report aria-disabled true, stay focusable and in the Tab and Shift+Tab order, keep their name and description; the link has no href and is role link with tabindex 0; once unavailable is removed the link has its href back and neither reports aria-disabled (FR-003, FR-039)",
    run: async (driver) => {
      await driver.mount(`<button id="before" type="button">Before</button><ocelle-action-row id="b" unavailable>${slots("b")}</ocelle-action-row><ocelle-action-row id="l" unavailable href="#missions" target="_blank">${slots("l")}</ocelle-action-row><button id="after" type="button">After</button>`);
      await driver.rules(nativeRules);
      const tree = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        return { role: state.role, name: state.name, description: state.description, disabled: state.disabled, focusable: state.focusable };
      };
      const unavailable = { b: await tree("b"), l: await tree("l"), inner: { b: await inner(driver, "b"), l: await inner(driver, "l") }, reflected: [await driver.attribute("b", "unavailable"), await driver.attribute("l", "unavailable")] };
      const forward = await driver.tabOrder();
      const reverse = await driver.tabOrder({ reverse: true });
      await driver.setAttribute("b", "unavailable", null);
      await driver.setAttribute("l", "unavailable", null);
      return { unavailable, forward, reverse, available: { b: await inner(driver, "b"), l: await inner(driver, "l"), tree: await tree("l") }, axe: await severe(driver) };
    },
    expected: {
      unavailable: {
        b: { role: "button", name: "Mission 42", description: "Due Friday Blocked Design", disabled: true, focusable: true },
        l: { role: "link", name: "Mission 42", description: "Due Friday Blocked Design", disabled: true, focusable: true },
        inner: { b: { tag: "button", "aria-disabled": "true" }, l: { tag: "a", role: "link", tabindex: "0", "aria-disabled": "true" } },
        reflected: ["", ""],
      },
      forward: [["button#before"], ["ocelle-action-row#b", "button"], ["ocelle-action-row#l", "a"], ["button#after"]],
      reverse: [["button#after"], ["ocelle-action-row#l", "a"], ["ocelle-action-row#b", "button"], ["button#before"]],
      available: { b: { tag: "button" }, l: { tag: "a", href: "#missions", target: "_blank", rel: "noopener" }, tree: { role: "link", name: "Mission 42", description: "Due Friday Blocked Design", disabled: false, focusable: true } },
      axe: [],
    },
  },
  {
    name: "US5-6: an unavailable button-mode row and an unavailable link row are not activated by a click on the control, on the description or on a tag, a Ctrl, Meta, Shift or Alt click, a middle click, Enter, Space or the element's click(): no click, auxclick or ocelle-action-row-activate reaches the row or its ancestors, while the available twin's click gives one click and one event (FR-003, FR-039)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-action-row id="b" unavailable>${slots("b")}</ocelle-action-row><ocelle-action-row id="l" unavailable href="#missions">${slots("l")}</ocelle-action-row><ocelle-action-row id="a">${slots("a")}</ocelle-action-row></div>`);
      const found: Record<string, unknown> = {};
      for (const id of ["b", "l"]) {
        await driver.events(id, ["click", "auxclick", activate]);
        await tryAll(driver, id);
        found[id] = (await driver.takeEvents()).length;
      }
      await driver.events("a", ["click", "auxclick", activate]);
      await driver.click("a");
      return { found, available: counts(await driver.takeEvents(), "a"), axe: await severe(driver) };
    },
    expected: { found: { b: 0, l: 0 }, available: once, axe: [] },
  },
  {
    name: "The edge case of busy with unavailable: a busy unavailable row reports aria-busy and aria-disabled on its inner control, and a click and Enter dispatch nothing, while a busy available row's click dispatches one event (FR-035, FR-039)",
    run: async (driver) => {
      await driver.mount('<div id="wrap"><ocelle-action-row id="u" busy unavailable>Mission 1</ocelle-action-row><ocelle-action-row id="b" busy>Mission 2</ocelle-action-row></div>');
      const state = await driver.axState("u", control);
      await driver.events("u", ["click", activate]);
      await driver.click("u");
      await driver.focus("u");
      await driver.press("Enter");
      const unavailable = (await driver.takeEvents()).length;
      await driver.events("b", ["click", activate]);
      await driver.click("b");
      return { inner: await inner(driver, "u"), busy: state.busy, disabled: state.disabled, unavailable, available: counts(await driver.takeEvents(), "b"), axe: await severe(driver) };
    },
    expected: { inner: { tag: "button", "aria-disabled": "true", "aria-busy": "true" }, busy: true, disabled: true, unavailable: 0, available: once, axe: [] },
  },
  {
    name: "US5-6, stretched: an unavailable row stretched in a flex row beside a taller sibling has its hit layer fill the host, and a click 4 px inside its bottom edge delivers no click and no event, while its available twin's gives one each (FR-001, FR-003)",
    run: async (driver) => {
      await driver.mount('<div id="flex"><div class="tall"></div><ocelle-action-row id="u" unavailable>Mission 1</ocelle-action-row><ocelle-action-row id="a">Mission 2</ocelle-action-row></div>');
      await driver.rules("#flex { display: flex; gap: 8px; inline-size: 400px; } .tall { block-size: 120px; inline-size: 20px; } ocelle-action-row { flex: 1; }");
      const found: Record<string, unknown> = {};
      for (const id of ["u", "a"]) {
        const host = await driver.box(id);
        await driver.events(id, ["click", "auxclick", activate]);
        await driver.click(id, { position: { x: host.width / 2, y: host.height - 4 } });
        found[id] = { filled: same(host, await driver.box(id, hit)), tall: host.height >= 120, ...counts(await driver.takeEvents(), id) };
      }
      return { found, axe: await severe(driver) };
    },
    expected: { found: { u: { filled: true, tall: true, ...none }, a: { filled: true, tall: true, ...once } }, axe: [] },
  },
  ...restyles.flatMap(({ rule, outside }) =>
    (["button", "link"] as const).map(
      (mode): Scenario => ({
        name: `US5-6, US5-12, page rule "${rule}" on the element in a 400 px container, ${mode} mode: the end point (4 px inside the inline-end edge at the block centre) and the bottom point (4 px inside the bottom edge at the inline centre) lie ${outside[0] ? "outside" : "inside"} the hit layer's box as the phase 6 spike lists; a click on each listed outside point activates neither the available nor the unavailable row; a click on the inner control's centre activates the available row once and not the unavailable one (FR-001, FR-003)`,
        run: async (driver) => {
          const href = mode === "link" ? ' href="#missions"' : "";
          await driver.mount(`<div class="box"><ocelle-action-row id="on" row-id="on"${href}>Mission 42</ocelle-action-row></div><div class="box"><ocelle-action-row id="off" row-id="off" unavailable${href}>Mission 42</ocelle-action-row></div>`);
          await driver.rules(`.box { inline-size: 400px; } #on, #off { ${rule} }`);
          const found: Record<string, unknown> = {};
          for (const id of ["on", "off"]) {
            const host = await driver.box(id);
            const layer = await driver.box(id, hit);
            const points = [
              { x: host.width - 4, y: host.height / 2 },
              { x: host.width / 2, y: host.height - 4 },
            ];
            const measured = points.map((point) => !inside({ x: host.x + point.x, y: host.y + point.y }, layer));
            await driver.events(id, ["click", "auxclick", activate]);
            for (const [at, position] of points.entries()) if (outside[at] === true) await driver.click(id, { position });
            const atPoints = counts(await driver.takeEvents(), id);
            // The available row's centre click is cancelled, so a link-mode row stays on the page.
            if (id === "on") await driver.preventNext(activate);
            await driver.click(id, { inner: control });
            found[id] = { outside: measured, atPoints, centre: counts(await driver.takeEvents(), id) };
          }
          return { found, axe: await severe(driver) };
        },
        expected: {
          found: {
            on: { outside: [...outside], atPoints: none, centre: once },
            off: { outside: [...outside], atPoints: none, centre: none },
          },
          axe: [],
        },
      }),
    ),
  ),
  {
    name: "US5-8: in a 200 px card with several tags, the tags wrap onto more than one line only between tags: each tag keeps the width and the one-line height of the same text outside the row; a single tag longer than the card stays within the card and breaks inside its word onto several lines; the card is not wider than its container (FR-038)",
    run: async (driver) => {
      const tags = ["Blocked", "Design", "Needs review", "Backend", "Ops"];
      const long = "mission-7f3a9c2e8b1d4f6a0c5e7b9d2f4a6c8e";
      await driver.mount(
        `<p class="ref">${tags.map((tag, at) => `<span id="ref-${String(at)}" class="tag">${tag}</span>`).join(" ")}</p>` +
          `<div id="box"><ocelle-action-row id="c" layout="card">Mission 42<span slot="description">Due Friday</span>${tags.map((tag, at) => `<span id="t-${String(at)}" slot="tags">${tag}</span>`).join("")}<span id="t-long" slot="tags">${long}</span></ocelle-action-row></div>`,
      );
      await driver.rules(".ref { font-size: var(--ocelle-font-size-md); line-height: var(--ocelle-line-height-normal); } .tag { display: inline-block; } #box { inline-size: 200px; }");
      const boxes = await Promise.all(tags.map((_, at) => driver.box(`t-${String(at)}`)));
      const references = await Promise.all(tags.map((_, at) => driver.box(`ref-${String(at)}`)));
      const [host, container, wrapper, longBox] = [await driver.box("c"), await driver.box("box"), await driver.box("c", tagsPart), await driver.box("t-long")];
      return {
        lines: new Set(boxes.map((box) => tenth(box.y))).size > 1,
        whole: boxes.map((box, at) => Math.abs(box.width - (references[at]?.width ?? 0)) <= 0.5 && Math.abs(box.height - (references[at]?.height ?? 0)) <= 0.5),
        long: { within: longBox.x >= wrapper.x - 0.5 && longBox.x + longBox.width <= wrapper.x + wrapper.width + 0.5, broken: longBox.height > (references[0]?.height ?? 0) + 0.5 },
        card: host.width <= container.width + 0.5,
        axe: await severe(driver),
      };
    },
    expected: { lines: true, whole: [true, true, true, true, true], long: { within: true, broken: true }, card: true, axe: [] },
  },
  card("ltr"),
  card("rtl"),
];

/**
 * The in-process link bodies (research.md R-11): the navigation sink, the last bubble-phase listener on `window`,
 * records whether something prevented the link's activation before it, with which button and modifiers and to which
 * `href`.
 */
export const rowStateSinkScenarios: readonly Scenario[] = [
  ...activations.map(
    ({ name, act, trusted }): Scenario => ({
      name: `US5-1 (sink), ${name}: on <ocelle-action-row href row-id="m-42"> exactly one ocelle-action-row-activate (bubbles, composed, cancelable, detail { rowId: "m-42" }) is recorded at the row and every ancestor before the click, and the sink records the click not prevented, to the link's href (FR-033)`,
      run: async (driver) => {
        await driver.mount(`<div id="wrap"><ocelle-action-row id="r" href="${target}" row-id="m-42">Mission 42</ocelle-action-row></div>`);
        await driver.events("r", ["click", activate]);
        await act(driver, "r");
        const records = await driver.takeEvents();
        const of = (type: string): EventRecord[] => records.filter((record) => record.type === type);
        return {
          types: records.map((record) => record.type),
          details: [...new Set(of(activate).map((record) => JSON.stringify(record.detail)))],
          flags: [...new Set(of(activate).map((record) => JSON.stringify({ bubbles: record.bubbles, composed: record.composed, cancelable: record.cancelable, defaultPrevented: record.defaultPrevented })))],
          click: { serials: new Set(of("click").map((record) => record.serial)).size, trusted: [...new Set(of("click").map((record) => record.isTrusted))] },
          navigations: await driver.navigations(),
          axe: await severe(driver),
        };
      },
      expected: {
        types: [...path.map(() => activate), ...path.map(() => "click")],
        details: ['{"rowId":"m-42"}'],
        flags: [JSON.stringify({ bubbles: true, composed: true, cancelable: true, defaultPrevented: false })],
        click: { serials: 1, trusted: [trusted] },
        navigations: [navigation()],
        axe: [],
      },
    }),
  ),
  ...activations.slice(0, 2).map(
    ({ name, act }): Scenario => ({
      name: `US5-1 (sink), cancelled, ${name}: a listener's preventDefault() on ocelle-action-row-activate cancels the navigation: the click is delivered once with defaultPrevented true and the sink records it prevented (FR-033)`,
      run: async (driver) => {
        await driver.mount(`<div id="wrap"><ocelle-action-row id="r" href="${target}" row-id="m-42">Mission 42</ocelle-action-row></div>`);
        await driver.events("r", ["click", activate]);
        await driver.preventNext(activate);
        await act(driver, "r");
        const records = await driver.takeEvents();
        return { counts: counts(records, "r"), prevented: [...new Set(records.map((record) => `${record.type} ${String(record.defaultPrevented)}`))], navigations: await driver.navigations() };
      },
      expected: { counts: once, prevented: [`${activate} true`, "click true"], navigations: [navigation({ defaultPrevented: true })] },
    }),
  ),
  {
    name: "US5-2, decision 13 (sink): on a link row a Ctrl, Meta, Shift or Alt click delivers its click and no ocelle-action-row-activate, and the sink records it not prevented with its flag; a middle click delivers no click and no event, and the sink records its auxclick not prevented; Space delivers nothing; Enter on the same row gives one event, one click and one record (FR-033)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-action-row id="r" href="${target}" row-id="m-42">Mission 42</ocelle-action-row></div>`);
      await driver.events("r", ["click", "auxclick", activate]);
      const found: Record<string, unknown> = {};
      for (const { modifier } of modifierClicks) {
        await driver.click("r", { modifiers: [modifier] });
        found[modifier] = counts(await driver.takeEvents(), "r");
      }
      await driver.click("r", { button: "middle" });
      found.middle = counts(await driver.takeEvents(), "r");
      await driver.focus("r");
      await driver.press(" ");
      found.space = counts(await driver.takeEvents(), "r");
      await driver.press("Enter");
      found.enter = counts(await driver.takeEvents(), "r");
      return { found, navigations: await driver.navigations() };
    },
    expected: {
      found: {
        ...Object.fromEntries(modifierClicks.map(({ modifier }) => [modifier, { click: 1, auxclick: 0, activate: 0 }])),
        middle: { click: 0, auxclick: 1, activate: 0 },
        space: none,
        enter: once,
      },
      navigations: [...modifierClicks.map(({ flag }) => navigation({ [flag]: true })), navigation({ type: "auxclick", button: 1 }), navigation()],
    },
  },
  {
    name: "US5-6 (sink): a plain, Ctrl, Meta, Shift, Alt or middle click, Enter and click() on an unavailable link row deliver no click, auxclick or event and leave the sink nothing, while its available twin's click gives one click, one event and one record (FR-003, FR-033)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-action-row id="u" href="${target}" unavailable>${slots("u")}</ocelle-action-row> <ocelle-action-row id="e" href="${target}">Mission 7</ocelle-action-row></div>`);
      await driver.events("u", ["click", "auxclick", activate]);
      await driver.events("e", ["click", "auxclick", activate]);
      await tryAll(driver, "u");
      const unavailable = (await driver.takeEvents()).length;
      await driver.click("e");
      return { unavailable, available: counts(await driver.takeEvents(), "e"), navigations: await driver.navigations() };
    },
    expected: { unavailable: 0, available: once, navigations: [navigation()] },
  },
];

const home = "action-row.html";
const stayed: Outcome = { page: home, tabs: [], visits: 0 };
const navigated: Outcome = { page: target, tabs: [], visits: 1 };

/** The fixture link bodies (research.md R-11): real navigation, new tabs and the server's visits. */
export const rowStateNavigationScenarios: readonly NavigationScenario[] = [
  {
    name: "US5-1 (fixture): a pointer click, Enter on the focused row and the element's click() each navigate the page to the link row's href, once",
    run: async (driver: Driver, nav: Navigation) => {
      const found: Record<string, Outcome> = {};
      for (const { name, act } of activations) {
        await driver.mount(`<ocelle-action-row id="r" href="${target}" row-id="m-42">Mission 42</ocelle-action-row>`);
        await act(driver, "r");
        found[name] = await nav.outcome();
      }
      return found;
    },
    expected: Object.fromEntries(activations.map(({ name }) => [name, navigated])),
  },
  {
    name: "US5-1 (fixture), cancelled: with a listener calling preventDefault() on ocelle-action-row-activate, a pointer click and Enter leave the page where it is, while the same click without the listener navigates",
    run: async (driver: Driver, nav: Navigation) => {
      const found: Record<string, Outcome> = {};
      for (const { name, act } of activations.slice(0, 2)) {
        await driver.mount(`<ocelle-action-row id="r" href="${target}" row-id="m-42">Mission 42</ocelle-action-row>`);
        await driver.preventNext(activate);
        await act(driver, "r");
        found[name] = await nav.outcome();
      }
      await driver.mount(`<ocelle-action-row id="r" href="${target}" row-id="m-42">Mission 42</ocelle-action-row>`);
      await driver.click("r");
      found.uncancelled = await nav.outcome();
      return found;
    },
    expected: { ...Object.fromEntries(activations.slice(0, 2).map(({ name }) => [name, stayed])), uncancelled: navigated },
  },
  {
    name: "US5-2, decision 13 (fixture): on a link row the browser's default happens and no ocelle-action-row-activate is dispatched: Ctrl and Shift open the target in a new tab or window, Alt downloads it, the middle button opens a new tab, each leaving the page where it is; Meta, which Chromium on Linux does not treat as a link modifier, navigates the page; Space does nothing",
    run: async (driver: Driver, nav: Navigation) => {
      const found: Record<string, unknown> = {};
      for (const [key, options] of [["Control", { modifiers: ["Control"] as const }], ["Shift", { modifiers: ["Shift"] as const }], ["Alt", { modifiers: ["Alt"] as const }], ["middle", { button: "middle" as const }]] as const) {
        await driver.mount(`<div id="wrap"><ocelle-action-row id="r" href="${target}">Mission 42</ocelle-action-row></div>`);
        await driver.events("r", ["click", "auxclick", activate]);
        await driver.click("r", options);
        const outcome = await nav.outcome();
        found[key] = { outcome, counts: counts(await driver.takeEvents(), "r") };
      }
      await driver.mount(`<ocelle-action-row id="r" href="${target}">Mission 42</ocelle-action-row>`);
      await driver.click("r", { modifiers: ["Meta"] });
      found.Meta = await nav.outcome();
      await driver.mount(`<ocelle-action-row id="r" href="${target}">Mission 42</ocelle-action-row>`);
      await driver.focus("r");
      await driver.press(" ");
      found.Space = await nav.outcome();
      return found;
    },
    expected: {
      Control: { outcome: { page: home, tabs: [target], visits: 1 }, counts: { click: 1, auxclick: 0, activate: 0 } },
      Shift: { outcome: { page: home, tabs: [target], visits: 1 }, counts: { click: 1, auxclick: 0, activate: 0 } },
      Alt: { outcome: { page: home, tabs: [], visits: 1 }, counts: { click: 1, auxclick: 0, activate: 0 } },
      middle: { outcome: { page: home, tabs: [target], visits: 1 }, counts: { click: 0, auxclick: 1, activate: 0 } },
      Meta: navigated,
      Space: stayed,
    },
  },
  {
    name: "US5-6 (fixture): a plain, Ctrl, Shift, Alt or middle click, Enter and click() on an unavailable link row navigate nowhere, open no tab and download nothing, while its available twin's click navigates",
    run: async (driver: Driver, nav: Navigation) => {
      const found: Record<string, Outcome> = {};
      const tries: readonly (readonly [string, (id: string) => Promise<void>])[] = [
        ["plain", (id) => driver.click(id)],
        ["Control", (id) => driver.click(id, { modifiers: ["Control"] })],
        ["Shift", (id) => driver.click(id, { modifiers: ["Shift"] })],
        ["Alt", (id) => driver.click(id, { modifiers: ["Alt"] })],
        ["middle", (id) => driver.click(id, { button: "middle" })],
        [
          "Enter",
          async (id) => {
            await driver.focus(id);
            await driver.press("Enter");
          },
        ],
        ["click()", (id) => driver.callClick(id)],
      ];
      for (const [key, attempt] of tries) {
        await driver.mount(`<ocelle-action-row id="u" href="${target}" unavailable>Mission 42</ocelle-action-row>`);
        await attempt("u");
        found[key] = await nav.outcome();
      }
      await driver.mount(`<ocelle-action-row id="e" href="${target}">Mission 42</ocelle-action-row>`);
      await driver.click("e");
      found.available = await nav.outcome();
      return found;
    },
    expected: { plain: stayed, Control: stayed, Shift: stayed, Alt: stayed, middle: stayed, Enter: stayed, "click()": stayed, available: navigated },
  },
];
