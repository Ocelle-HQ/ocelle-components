// The shared bodies of `ocelle-data-table` (019 spec US1-1 to US1-28, the US1 edge cases, FR-001 to FR-019, FR-040,
// FR-052; contracts/ocelle-data-table.md, contracts/styles-data-table.md, contracts/checks.md § Oracles and § Bodies
// that the platform alone could pass; research.md R-01 to R-07, R-18 to R-20; tasks.md T006 to T009 and T080), run in
// process on the element source (test/data-table.test.ts, mutated) and on the strict-CSP fixture with the browser
// build and `base.css` (test/browser/data-table.test.ts). Every body mounts with `@ocelle/styles`' base.css. Expected
// values are written by hand from the contracts: the 5 px ring room (`--ocelle-focus-offset` 2 px +
// `--ocelle-focus-width` 3 px), the 32 px fade depth, the 40 px step, the 1 px tolerance, the room rule's factor two
// and the token names of research R-06; lengths and colours are compared with the token's value read from a probe on
// the same page, never a literal (scenarios/layout.ts). "Within 0.5 px" is inclusive everywhere.
//
// Shadow reads go through `region` (one in-page read of the box, its edges and its attributes; null while the element
// renders no box), so a body run against the scaffold fails on its assertion, not on a missing node. Every "does not"
// is paired with the positive outcome it guards in the same body (contracts/checks.md § Bodies that the platform alone
// could pass). The no-hover half of US1-24 is in `dataTableTouchScenarios`, run only by the touch files; the
// before-upgrade body is `beforeUpgrade`, run on a page where the element is not defined.
import type { Box, Driver, Palette, Target } from "./driver.ts";
import type { Scenario } from "./icon.ts";
import { probe, tokenColour, tokenPx, tokensOf } from "./layout.ts";
import { layers } from "./overflow-block.ts";
import { boxAttributes } from "./scroller.ts";

/** A data-table body; `loop` marks the bodies the in-process harness also wraps in its no-`ResizeObserver`-loop check. */
export interface DataTableScenario extends Scenario {
  readonly loop?: boolean;
}

const room = 5;
const depth = 32;
const step = 40;
/** The US1 table's unbroken 26-character identifier. */
export const identifier = "01JD8X2K7Q9M4N6P3R5T0V2W8Y";
const transparent = "rgba(0, 0, 0, 0)";

/** The test page's rules: host widths, block bounds, a wide cell and the wrappers of the sizing bodies. */
export const rules = [
  '[data-w="200"] { inline-size: 200px; }',
  '[data-w="320"] { inline-size: 320px; }',
  '[data-w="400"] { inline-size: 400px; }',
  '[data-bound="300"] { max-block-size: 300px; }',
  '[data-bound="200"] { max-block-size: 200px; }',
  '[data-bound="100"] { max-block-size: 100px; }',
  '[data-bound="80"] { max-block-size: 80px; }',
  '[data-bound="70"] { max-block-size: 70px; }',
  ".w800 { display: inline-block; inline-size: 800px; }",
  ".flex { display: flex; inline-size: 320px; }",
  ".grid { display: grid; grid-template-columns: 1fr; inline-size: 320px; }",
  ".ib { display: inline-block; }",
  ".col { display: flex; flex-direction: column; align-items: flex-start; inline-size: 1000px; }",
  ".scratch { position: absolute; white-space: nowrap; font-family: var(--ocelle-font-sans); font-size: var(--ocelle-font-size-sm); font-weight: var(--ocelle-font-weight-medium); }",
].join("\n");

const columns = ["Id", "Title", "Lane", "Owner", "Link"];

interface TableOptions {
  /** The caption's markup; "" for no caption. */
  readonly caption?: string;
  readonly rows?: number;
  /** The first row's id cell holds the unbroken identifier. */
  readonly ident?: boolean;
  readonly head?: boolean;
  /** Markup inside each header cell after its text (a link, say). */
  readonly headExtra?: (index: number) => string;
}

/** The US1 table: a caption, five columns (Id, Title, Lane, Owner, Link) and `rows` rows, every node with an id under `p`. */
export function usTable(p: string, options: TableOptions = {}): string {
  const { caption = "Work packages", rows = 4, ident = true, head = true, headExtra = () => "" } = options;
  const headRow = head ? `<thead id="${p}-head"><tr id="${p}-hr">${columns.map((name, index) => `<th scope="col" id="${p}-h${String(index)}">${name}${headExtra(index)}</th>`).join("")}</tr></thead>` : "";
  const body = Array.from({ length: rows }, (_, r) => {
    const id = ident && r === 0 ? identifier : `WP${String(r + 1).padStart(2, "0")}`;
    return `<tr id="${p}-r${String(r)}"><td id="${p}-c${String(r)}-0">${id}</td><td id="${p}-c${String(r)}-1">Spec review</td><td id="${p}-c${String(r)}-2">Doing</td><td id="${p}-c${String(r)}-3">Ivan</td><td id="${p}-c${String(r)}-4"><a id="${p}-a${String(r)}" href="#${p}-a${String(r)}">open</a></td></tr>`;
  }).join("");
  return `<table id="${p}">${caption === "" ? "" : `<caption id="${p}-cap">${caption}</caption>`}${headRow}<tbody id="${p}-body">${body}</tbody></table>`;
}

/** An `ocelle-data-table` with `id`, its attributes and its content. */
export const dt = (id: string, attributes: string, content: string): string => `<ocelle-data-table id="${id}" ${attributes}>${content}</ocelle-data-table>`;

/** Mounts `markup` and the token probe with base.css at `width` × 800, with the test rules and `extra`, and settles. */
export async function page(driver: Driver, markup: string, width = 1280, extra = ""): Promise<void> {
  await driver.viewport(width, 800);
  await driver.mount(`${markup}${probe}`, { base: true });
  await driver.rules(`${rules}\n${extra}`);
  await driver.settle();
}

/**
 * Runs `body` (the statements of a function returning a JSON value) in the page and returns its value; a thrown error
 * comes back as `"error: <message>"`, so a body fails on its assertion.
 */
export async function evaluate(driver: Driver, body: string): Promise<unknown> {
  await driver.module(`let value;
try { value = (() => { ${body} })(); } catch (error) { value = "error: " + (error instanceof Error ? error.message : String(error)); }
const out = document.getElementById("ocelle-out") ?? document.documentElement.appendChild(Object.assign(document.createElement("i"), { id: "ocelle-out", hidden: true }));
out.setAttribute("data-value", JSON.stringify(value === undefined ? null : value));`);
  return JSON.parse((await driver.attribute("ocelle-out", "data-value")) ?? "null") as unknown;
}

/** One reading of the region of host `id`: the box's geometry, scroll figures, attributes and the edges' sizes. */
export interface Region {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly clientWidth: number;
  readonly clientHeight: number;
  readonly offsetWidth: number;
  readonly offsetHeight: number;
  readonly scrollTop: number;
  readonly scrollLeft: number;
  readonly scrollWidth: number;
  readonly scrollHeight: number;
  readonly fade: string | null;
  readonly blockFade: string | null;
  readonly axis: string | null;
  readonly tabindex: string | null;
  readonly role: string | null;
  readonly name: string | null;
  readonly start: number;
  readonly end: number;
  readonly depth: number;
  readonly assigned: number;
  readonly assignedId: string | null;
}

/** The region of host `id`, or null while the element renders no `.region-box`. */
export async function region(driver: Driver, id: string): Promise<Region | null> {
  const read = await evaluate(
    driver,
    `const host = document.getElementById(${JSON.stringify(id)});
const root = host?.shadowRoot;
const box = root?.querySelector(".region-box");
if (box === null || box === undefined) return null;
const rect = box.getBoundingClientRect();
const edge = (selector) => root.querySelector(selector)?.getBoundingClientRect() ?? { width: 0, height: 0 };
const slot = root.querySelector("slot");
const assigned = slot === null ? [] : slot.assignedNodes();
return { x: rect.x, y: rect.y, width: rect.width, clientWidth: box.clientWidth, clientHeight: box.clientHeight, offsetWidth: box.offsetWidth, offsetHeight: box.offsetHeight,
  scrollTop: box.scrollTop, scrollLeft: box.scrollLeft, scrollWidth: box.scrollWidth, scrollHeight: box.scrollHeight,
  fade: box.getAttribute("data-fade"), blockFade: box.getAttribute("data-block-fade"), axis: box.getAttribute("data-axis"),
  tabindex: box.getAttribute("tabindex"), role: box.getAttribute("role"), name: box.getAttribute("aria-label"),
  start: edge(".region-edge.start").width, end: edge(".region-edge.end").width, depth: edge(".region-edge.block-end").height,
  assigned: assigned.length, assignedId: assigned[0]?.id ?? null };`,
  );
  return read as Region | null;
}

/** A field of a region reading, or "no region" while the element renders no box (a null field stays null). */
const field = (read: Region | null, key: keyof Region): unknown => (read === null ? "no region" : read[key]);

/** The region of host `id`; throws (failing the body on its own message) while there is none. */
async function must(driver: Driver, id: string): Promise<Region> {
  const read = await region(driver, id);
  if (read === null) throw new Error(`#${id} renders no .region-box`);
  return read;
}

/** Runs `read`, giving `"missing: <message>"` when it throws (a shadow node the scaffold does not render). */
export async function safe<T>(read: () => Promise<T>): Promise<T | string> {
  try {
    return await read();
  } catch (error) {
    return `missing: ${error instanceof Error ? error.message : String(error)}`;
  }
}

const boxOf = (id: string): Target => ({ id, inner: ".region-box" });

/** Whether `a` is within 0.5 px of `b`, inclusive. */
export const near = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;

/** The unmasked inline extent of the box in viewport coordinates (LTR): the client area less each fade that shows. */
export function unmasked(read: Region): { readonly left: number; readonly right: number } {
  const start = read.fade === "start" || read.fade === "both" ? read.start : 0;
  const end = read.fade === "end" || read.fade === "both" ? read.end : 0;
  return { left: read.x + start, right: read.x + read.clientWidth - end };
}

/** The line boxes of the element with `id` (its client rects with a width, one per distinct block position). */
export async function lineBoxes(driver: Driver, id: string): Promise<{ readonly left: number; readonly right: number; readonly top: number }[]> {
  const rects = (await driver.lines(id)).filter((each) => each.width > 0);
  const byLine = new Map<number, { left: number; right: number; top: number }>();
  for (const rect of rects) {
    const key = Math.round(rect.y);
    const line = byLine.get(key);
    if (line === undefined) byLine.set(key, { left: rect.x, right: rect.x + rect.width, top: rect.y });
    else byLine.set(key, { left: Math.min(line.left, rect.x), right: Math.max(line.right, rect.x + rect.width), top: line.top });
  }
  return [...byLine.values()].sort((a, b) => a.top - b.top);
}

/** Whether every line box of `id` lies inside the region's unmasked extent, within 0.5 px. */
async function linesInside(driver: Driver, id: string, hostId: string): Promise<boolean | string> {
  const read = await region(driver, hostId);
  if (read === null) return "no region";
  const { left, right } = unmasked(read);
  const lines = await lineBoxes(driver, id);
  return lines.length > 0 && lines.every((line) => line.left >= left - 0.5 && line.right <= right + 0.5);
}

/** A ring box: the border box of the element with `id` grown by the ring room on each side. */
async function ringOf(driver: Driver, id: string): Promise<{ readonly top: number; readonly bottom: number; readonly left: number; readonly right: number }> {
  const box = await driver.box(id);
  return { top: box.y - room, bottom: box.y + box.height + room, left: box.x - room, right: box.x + box.width + room };
}

const bottomOf = (box: Box): number => box.y + box.height;
const rightOf = (box: Box): number => box.x + box.width;

/** The block-end fade's block-start edge in the viewport: the box's client block end less the edge's block size. */
const fadeTop = (read: Region): number => read.y + read.clientHeight - read.depth;

/** The id (or local name) `elementFromPoint` returns at the centre of the element with `id`. */
async function hitAtCentre(driver: Driver, id: string): Promise<unknown> {
  return evaluate(
    driver,
    `const rect = document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();
const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
return hit === null ? null : hit.id || hit.localName;`,
  );
}

/** The document's scroll height. */
const pageHeight = (driver: Driver): Promise<unknown> => evaluate(driver, "return document.documentElement.scrollHeight;");

/** The computed custom property `name` on the host's `.region-track` ("" when unset; a "missing" note when absent). */
const trackProperty = (driver: Driver, id: string, name: string): Promise<string> => safe(async () => (await driver.shadowComputed(id, ".region-track", name)).trim());

/** The accessibility subtree of `id` without `generic` wrappers. */
async function semantic(driver: Driver, id: string): Promise<{ role: string; name: string }[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role !== "generic" && node.role !== "none").map(({ role, name }) => ({ role, name }));
}

/** The roles in the accessibility subtree of `id`. */
async function roles(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).map((node) => node.role);
}

/** Focuses the box of host `id` by keyboard: the button `before` it, then Tab. */
async function tabToBox(driver: Driver): Promise<void> {
  await driver.focus("before");
  await driver.pressTab();
}

const before = '<button id="before" type="button">before</button>';

/** A colour token in the current theme and a theme switch. */
async function grounds(driver: Driver, theme: Palette, ids: readonly string[]): Promise<string[]> {
  await driver.theme(theme);
  const out: string[] = [];
  for (const id of ids) out.push(await driver.computed(id, "background-color"));
  return out;
}

/** For each id, the token whose colour equals its computed background in the current theme, or the colour. */
async function groundTokens(driver: Driver, ids: readonly string[], tokens: readonly string[]): Promise<string[]> {
  const resolved: [string, string][] = [];
  for (const token of tokens) resolved.push([token, await tokenColour(driver, token)]);
  const out: string[] = [];
  for (const id of ids) {
    const colour = await driver.computed(id, "background-color");
    out.push(colour === transparent ? "none" : (resolved.find(([, value]) => value === colour)?.[0] ?? colour));
  }
  return out;
}

/**
 * Builds a caption text in the page's caption font whose width lies between `low` and `high` px (a scratch span with the
 * caption's font): the end-fade body's text, chosen per harness font (spike § 5).
 */
async function captionBetween(driver: Driver, low: number, high: number): Promise<unknown> {
  return evaluate(
    driver,
    `const span = document.body.appendChild(Object.assign(document.createElement("span"), { className: "scratch" }));
let text = "Deploy approvals";
for (let index = 0; index < 400; index++) {
  span.textContent = text;
  const width = span.getBoundingClientRect().width;
  if (width > ${String(low)} && width < ${String(high)}) { span.remove(); return text; }
  if (width >= ${String(high)}) { text = text.slice(0, -1); span.textContent = text; if (span.getBoundingClientRect().width > ${String(low)}) { span.remove(); return text; } break; }
  text += " Deploy approvals".charAt(index % 17);
}
span.remove();
return "error: no caption text between ${String(low)} and ${String(high)} px";`,
  );
}

// ---------------------------------------------------------------------------------------------------------------
// T006: US1-1 to US1-16.

const us1: DataTableScenario[] = [
  {
    name: "US1-1: the AX subtree equals the same table outside the element whose column headers a test-only rule upper-cases; no table, row, cell or header node added; the column headers named ID, TITLE, LANE, OWNER, LINK with the same static text",
    run: async (driver) => {
      await page(driver, `${dt("dt", 'label="Work packages"', usTable("t"))}<div id="outside">${usTable("o")}</div>`, 1280, "#outside thead th { text-transform: uppercase; }");
      const inside = await semantic(driver, "dt");
      const outside = await semantic(driver, "outside");
      return {
        same: JSON.stringify(inside) === JSON.stringify(outside),
        tables: inside.filter((node) => node.role === "table").length,
        headers: inside.filter((node) => node.role === "columnheader").map((node) => node.name),
        texts: ["ID", "TITLE", "LANE", "OWNER", "LINK"].map((name) => inside.some((node) => node.role === "StaticText" && node.name === name)),
      };
    },
    expected: { same: true, tables: 1, headers: ["ID", "TITLE", "LANE", "OWNER", "LINK"], texts: [true, true, true, true, true] },
  },
  {
    name: "US1-2: body cells in --ocelle-font-sans, --ocelle-color-ink-soft, tabular-nums and the compact padding (--ocelle-space-1 block, --ocelle-space-2 inline), each smaller than 003's prose cell; no monospace family in the table",
    run: async (driver) => {
      await page(driver, `${dt("dt", "", usTable("t"))}<div data-ocelle-prose=""><table><tbody><tr><td id="pc">Prose</td></tr></tbody></table></div>`);
      const cell = await tokensOf(driver, "t-c0-1", {
        "font-family": "font-sans",
        color: "color-ink-soft",
        "font-variant-numeric": "=tabular-nums",
        "padding-block-start": "space-1",
        "padding-block-end": "space-1",
        "padding-inline-start": "space-2",
        "padding-inline-end": "space-2",
        "font-size": "font-size-sm",
      });
      const px = async (id: string, property: string): Promise<number> => Number.parseFloat(await driver.computed(id, property));
      const smaller = {
        block: (await px("t-c0-1", "padding-block-start")) < (await px("pc", "padding-block-start")),
        inline: (await px("t-c0-1", "padding-inline-start")) < (await px("pc", "padding-inline-start")),
      };
      const families: string[] = [];
      for (const id of ["t", "t-cap", "t-h0", "t-c0-0", "t-c1-2", "t-a0"]) families.push(await driver.computed(id, "font-family"));
      return { cell, smaller, monospace: families.filter((family) => /mono/i.test(family)) };
    },
    expected: {
      cell: {
        "font-family": "font-sans",
        color: "color-ink-soft",
        "font-variant-numeric": "=tabular-nums",
        "padding-block-start": "space-1",
        "padding-block-end": "space-1",
        "padding-inline-start": "space-2",
        "padding-inline-end": "space-2",
        "font-size": "font-size-sm",
      },
      smaller: { block: true, inline: true },
      monospace: [],
    },
  },
  {
    name: "US1-3: column headers (thead th, th[scope=col], th[scope=colgroup]) in 011's eyebrow tokens; row headers (th[scope=row], th[scope=rowgroup], a th with no scope in tbody and tfoot) at the body size in --ocelle-color-ink, not upper case",
    run: async (driver) => {
      const table = `<table><thead><tr><th id="h1">Id</th><th scope="colgroup" id="h2">Group</th></tr></thead><tbody><tr><th scope="col" id="h3">Col</th><td>x</td></tr><tr><th scope="row" id="r1">Row</th><td>1</td></tr><tr><th scope="rowgroup" id="r2">Rows</th><td>2</td></tr><tr><th id="r3">Bare</th><td>3</td></tr></tbody><tfoot><tr><th id="r4">Total</th><td>6</td></tr></tfoot></table>`;
      await page(driver, dt("dt", "", table));
      const eyebrow = { "font-size": "font-size-eyebrow", "font-weight": "font-weight-eyebrow", "text-transform": "=uppercase", "letter-spacing": "tracking-eyebrow", color: "color-eyebrow" };
      const row = { "font-size": "font-size-sm", color: "color-ink", "text-transform": "=none", "letter-spacing": "=normal" };
      const out: Record<string, unknown> = {};
      for (const id of ["h1", "h2", "h3"]) out[id] = await tokensOf(driver, id, eyebrow);
      for (const id of ["r1", "r2", "r3", "r4"]) out[id] = await tokensOf(driver, id, row);
      return out;
    },
    expected: (() => {
      const eyebrow = { "font-size": "font-size-eyebrow", "font-weight": "font-weight-eyebrow", "text-transform": "=uppercase", "letter-spacing": "tracking-eyebrow", color: "color-eyebrow" };
      const row = { "font-size": "font-size-sm", color: "color-ink", "text-transform": "=none", "letter-spacing": "=normal" };
      return { h1: eyebrow, h2: eyebrow, h3: eyebrow, r1: row, r2: row, r3: row, r4: row };
    })(),
  },
  {
    name: "US1-4 and US1-5: at 320 px the unbroken identifier overflows the region, not the page (page scroll width = viewport width); the box is a tab stop, a group named Work packages; ArrowRight and ArrowLeft scroll it by the 40 px step with data-fade following",
    run: async (driver) => {
      await page(driver, `${before}${dt("dt", 'label="Work packages"', usTable("t"))}`, 320);
      const scrollWidth = await driver.scrollWidth();
      const rest = await region(driver, "dt");
      await tabToBox(driver);
      await driver.chord("ArrowRight");
      const right = await region(driver, "dt");
      await driver.chord("ArrowLeft");
      const left = await region(driver, "dt");
      return {
        scrollWidth,
        rest: rest && { tabindex: rest.tabindex, role: rest.role, name: rest.name, fade: rest.fade, overflows: rest.scrollWidth - rest.clientWidth > 1 },
        active: await driver.deepActive(),
        right: right && { scrollLeft: right.scrollLeft, fade: right.fade },
        left: left && { scrollLeft: left.scrollLeft, fade: left.fade },
      };
    },
    expected: {
      scrollWidth: 320,
      rest: { tabindex: "0", role: "group", name: "Work packages", fade: "end", overflows: true },
      active: "dt >> div.region-box",
      right: { scrollLeft: step, fade: "both" },
      left: { scrollLeft: 0, fade: "end" },
    },
  },
  {
    name: "US1-6: at 1280 px the table fits: no tabindex, role, aria-label or data-fade on the box, paired with the table assigned to the region's slot",
    run: async (driver) => {
      await page(driver, dt("dt", 'label="Work packages"', usTable("t")));
      const read = await region(driver, "dt");
      return read && { tabindex: read.tabindex, role: read.role, name: read.name, fade: read.fade, assigned: read.assignedId };
    },
    expected: { tabindex: null, role: null, name: null, fade: null, assigned: "t" },
  },
  {
    name: "US1-7: an overflowing table with no label is named by its caption; a blank caption (white space only) and no caption leave the box a tab stop with no role and no name",
    run: async (driver) => {
      await page(driver, `${dt("a", "", usTable("ta"))}${dt("b", "", usTable("tb", { caption: "   " }))}${dt("c", "", usTable("tc", { caption: "" }))}`, 320);
      return { caption: await boxAttributes(driver, "a"), blank: await boxAttributes(driver, "b"), none: await boxAttributes(driver, "c") };
    },
    expected: {
      caption: { tabindex: "0", role: "group", "aria-label": "Work packages" },
      blank: { tabindex: "0", role: null, "aria-label": null },
      none: { tabindex: "0", role: null, "aria-label": null },
    },
  },
  {
    name: "FR-010: a non-blank host aria-label (Deployments) names the overflowing region over label and caption; a blank one (\"\" and white space) counts as absent, label names it; with the host aria-label removed label still names it",
    run: async (driver) => {
      const table = (p: string): string => usTable(p, { caption: "Rollout" });
      await page(driver, `${dt("a", 'label="Work packages" aria-label="Deployments"', table("ta"))}${dt("b", 'label="Work packages" aria-label=""', table("tb"))}${dt("c", 'label="Work packages" aria-label="   "', table("tc"))}`, 320);
      const named = await boxAttributes(driver, "a");
      const empty = await boxAttributes(driver, "b");
      const blank = await boxAttributes(driver, "c");
      await driver.setAttribute("a", "aria-label", null);
      await driver.settle();
      return { named, empty, blank, removed: await boxAttributes(driver, "a") };
    },
    expected: {
      named: { tabindex: "0", role: "group", "aria-label": "Deployments" },
      empty: { tabindex: "0", role: "group", "aria-label": "Work packages" },
      blank: { tabindex: "0", role: "group", "aria-label": "Work packages" },
      removed: { tabindex: "0", role: "group", "aria-label": "Work packages" },
    },
  },
  {
    name: "US1-8: a link off-screen at the inline end, tabbed to from the box, keeps its own tab stop and its ring box is scrolled clear of every fading edge",
    run: async (driver) => {
      await page(driver, `${before}${dt("dt", 'label="Work packages"', usTable("t"))}`, 320);
      await tabToBox(driver);
      const boxFocused = await driver.deepActive();
      await safe(() => driver.setScrollLeft(boxOf("dt"), 0));
      await driver.pressTab();
      const read = await region(driver, "dt");
      const ring = await ringOf(driver, "t-a0");
      const extent = read === null ? null : unmasked(read);
      return {
        boxFocused,
        focused: await driver.focused(),
        scrolled: read !== null && read.scrollLeft > 0,
        clear: extent !== null && ring.left >= extent.left - 0.5 && ring.right <= extent.right + 0.5,
      };
    },
    expected: { boxFocused: "dt >> div.region-box", focused: "t-a0", scrolled: true, clear: true },
  },
  {
    name: "US1-9: the identifier in <span data-ocelle-wrap=anywhere> and in a wrap=anywhere data table breaks inside its cell before the table overflows (no tab stop, the cell more than one line tall); the copy oracle gives it unchanged",
    run: async (driver) => {
      const table = (p: string, span: boolean): string => `<table id="${p}"><tbody><tr><td id="${p}-id">${span ? `<span id="${p}-s" data-ocelle-wrap="anywhere">${identifier}</span>` : `<span id="${p}-s">${identifier}</span>`}</td><td id="${p}-ok">Ok</td></tr></tbody></table>`;
      await page(driver, `${dt("a", 'data-w="200"', table("ta", true))}${dt("b", 'data-w="200" wrap="anywhere"', table("tb", false))}${dt("n", 'data-w="200"', table("tn", false))}`);
      const read = async (id: string, p: string): Promise<unknown> => {
        const box = await region(driver, id);
        return {
          tabindex: field(box, "tabindex"),
          fits: box !== null && box.scrollWidth - box.clientWidth <= 1,
          lines: (await lineBoxes(driver, `${p}-s`)).length > 1,
        };
      };
      return {
        span: await read("a", "ta"),
        attribute: await read("b", "tb"),
        none: await read("n", "tn"),
        copied: [await driver.copy("ta-s"), await driver.copy("tb-s")],
      };
    },
    expected: {
      span: { tabindex: null, fits: true, lines: true },
      attribute: { tabindex: null, fits: true, lines: true },
      none: { tabindex: "0", fits: false, lines: false },
      copied: [identifier, identifier],
    },
  },
  {
    name: "US1-10: inside [data-ocelle-prose=\"\"] the table is one sideways scroll box (display: table, overflow-x visible, the region overflowing) and every property of R-06's restated list equals the same table outside prose on every target (SPEC-3-01)",
    run: async (driver) => {
      await page(driver, `<div data-ocelle-prose="">${dt("p", 'data-w="320" label="Work packages"', usTable("pt"))}</div>${dt("o", 'data-w="320" label="Work packages"', usTable("ot"))}`, 1280);
      const targets: [string, readonly string[]][] = [
        ["t", ["display", "overflow-x", "max-inline-size", "container-type", "border-collapse", "margin-block-start", "margin-block-end", "font-family"]],
        ["t-c0-1", ["min-inline-size", "padding-top", "padding-right", "padding-bottom", "padding-left", "border-bottom-width", "border-bottom-style", "border-bottom-color", "text-align", "font-size", "line-height", "font-weight", "font-variant-numeric"]],
        ["t-h0", ["min-inline-size", "padding-top", "padding-left", "border-bottom-width", "border-bottom-color", "text-align", "font-size", "font-weight", "font-variant-numeric", "text-transform", "letter-spacing", "color"]],
        ["t-cap", ["position", "inset-inline-start", "max-inline-size", "text-align", "font-size", "line-height", "font-weight", "color"]],
      ];
      const differ: string[] = [];
      for (const [target, properties] of targets) {
        for (const property of properties) {
          const inside = await driver.computed(`p${target}`, property);
          const outside = await driver.computed(`o${target}`, property);
          if (inside !== outside) differ.push(`${target} ${property}: ${inside} in prose, ${outside} outside`);
        }
      }
      const read = await region(driver, "p");
      return { differ, display: await driver.computed("pt", "display"), overflowX: await driver.computed("pt", "overflow-x"), overflows: read !== null && read.scrollWidth - read.clientWidth > 1, tabindex: read?.tabindex ?? null };
    },
    expected: { differ: [], display: "table", overflowX: "visible", overflows: true, tabindex: "0" },
  },
  {
    name: "US1-11: in light and dark the cell, header and rule colours equal their probe-resolved tokens; in forced colours cell and header text are CanvasText and each row rule and the header rule a CanvasText border side wider than 0",
    run: async (driver) => {
      await page(driver, dt("dt", "", usTable("t")));
      const themed = async (theme: Palette): Promise<unknown> => {
        await driver.theme(theme);
        return [
          (await driver.computed("t-c0-1", "color")) === (await tokenColour(driver, "color-ink-soft")),
          (await driver.computed("t-h0", "color")) === (await tokenColour(driver, "color-eyebrow")),
          (await driver.computed("t-c0-1", "border-bottom-color")) === (await tokenColour(driver, "color-rule")),
          (await driver.computed("t-h0", "border-bottom-color")) === (await tokenColour(driver, "color-rule-strong")),
          (await driver.computed("t-cap", "color")) === (await tokenColour(driver, "color-ink")),
        ];
      };
      const light = await themed("light");
      const dark = await themed("dark");
      await driver.theme(null);
      await driver.forcedColors("active", "light");
      const canvasText = await driver.resolveColour("CanvasText");
      const forced = {
        text: [await driver.computed("t-c0-1", "color"), await driver.computed("t-h0", "color")].map((colour) => colour === canvasText),
        rules: [] as unknown[],
      };
      for (const id of ["t-c0-1", "t-c2-3", "t-h0", "t-h4"]) {
        forced.rules.push({ colour: (await driver.computed(id, "border-bottom-color")) === canvasText, style: await driver.computed(id, "border-bottom-style"), wide: Number.parseFloat(await driver.computed(id, "border-bottom-width")) > 0 });
      }
      await driver.forcedColors("none");
      return { light, dark, forced };
    },
    expected: {
      light: [true, true, true, true, true],
      dark: [true, true, true, true, true],
      forced: { text: [true, true], rules: Array.from({ length: 4 }, () => ({ colour: true, style: "solid", wide: true })) },
    },
  },
  {
    name: "US1-12: under dir=rtl the first column is at the right, cells start-aligned, and an overflowing region's start edge is the right edge (scrollLeft 0, data-fade end at rest)",
    run: async (driver) => {
      await page(driver, `<div dir="rtl">${dt("dt", 'label="Work packages"', usTable("t"))}${dt("n", 'label="Work packages" data-w="320"', usTable("u"))}</div>`);
      const table = await driver.box("t");
      const first = await driver.box("t-h0");
      const last = await driver.box("t-h4");
      const read = await region(driver, "n");
      return {
        firstAtRight: near(rightOf(first), rightOf(table)) && first.x > last.x,
        align: await driver.computed("t-c0-1", "text-align"),
        textRight: await evaluate(driver, 'const cell = document.getElementById("t-c0-1"); const range = document.createRange(); range.selectNodeContents(cell); const text = range.getBoundingClientRect(); const box = cell.getBoundingClientRect(); return text.width > 0 && Math.abs(text.right - (box.right - Number.parseFloat(getComputedStyle(cell).paddingRight))) <= 0.5;'),
        region: read && { scrollLeft: read.scrollLeft, fade: read.fade, tabindex: read.tabindex },
      };
    },
    expected: { firstAtRight: true, align: "start", textRight: true, region: { scrollLeft: 0, fade: "end", tabindex: "0" } },
  },
  {
    name: "US1-13: a focused overflowing region whose <tbody>, then whole <table>, is swapped for one that fits has no tab stop after settle, and focus is handed to the first focusable slotted element",
    run: async (driver) => {
      const fitting = (p: string): string => `<tbody id="${p}"><tr><td>WP01</td><td><a id="${p}-a" href="#x">open</a></td></tr></tbody>`;
      await page(driver, `${before}${dt("a", 'label="Work packages"', usTable("ta"))}${dt("b", 'label="Work packages"', usTable("tb"))}`, 320);
      await tabToBox(driver);
      const focusedA = await driver.deepActive();
      await driver.replace("ta-body", fitting("na"));
      await driver.settle();
      const afterBody = { tabindex: (await boxAttributes(driver, "a")).tabindex, active: await driver.deepActive() };
      await safe(() => driver.focus(boxOf("b")));
      const focusedB = await driver.deepActive();
      await driver.replace("tb", `<table id="nt"><caption>Work packages</caption>${fitting("nb")}</table>`);
      await driver.settle();
      const read = await region(driver, "b");
      return { focusedA, afterBody, focusedB, afterTable: { tabindex: (await boxAttributes(driver, "b")).tabindex, active: await driver.deepActive(), assigned: read?.assignedId ?? null } };
    },
    expected: {
      focusedA: "a >> div.region-box",
      afterBody: { tabindex: null, active: "na-a" },
      focusedB: "b >> div.region-box",
      afterTable: { tabindex: null, active: "nb-a", assigned: "nt" },
    },
  },
  {
    name: "US1-14: a consumer rule on cells (tfoot td, two type selectors) wins over the data-table rules, paired with a body cell it does not match keeping the compact padding and a header keeping the eyebrow style",
    run: async (driver) => {
      const table = `${usTable("t").replace("</table>", "")}<tfoot><tr><td id="f0">Total</td><td>4</td><td></td><td></td><td></td></tr></tfoot></table>`;
      await page(driver, dt("dt", "", table), 1280, "tfoot td { padding: 10px 11px; color: rgb(1, 2, 3); }");
      return {
        consumer: [await driver.computed("f0", "padding-top"), await driver.computed("f0", "padding-left"), await driver.computed("f0", "color")],
        body: await tokensOf(driver, "t-c1-1", { "padding-block-start": "space-1", "padding-inline-start": "space-2", color: "color-ink-soft" }),
        header: await tokensOf(driver, "t-h1", { "text-transform": "=uppercase", color: "color-eyebrow" }),
      };
    },
    expected: {
      consumer: ["10px", "11px", "rgb(1, 2, 3)"],
      body: { "padding-block-start": "space-1", "padding-inline-start": "space-2", color: "color-ink-soft" },
      header: { "text-transform": "=uppercase", color: "color-eyebrow" },
    },
  },
  {
    name: "US1-15: a fitting table's <tbody> swapped for one that overflows: the tab stop and name follow after settle",
    run: async (driver) => {
      await page(driver, dt("dt", 'label="Work packages"', usTable("t", { ident: false })), 320);
      const fitsFirst = await boxAttributes(driver, "dt");
      await driver.replace("t-body", `<tbody><tr><td>${identifier}</td><td>${identifier}</td></tr></tbody>`);
      await driver.settle();
      const read = await region(driver, "dt");
      return { fitsFirst, after: await boxAttributes(driver, "dt"), overflows: read !== null && read.scrollWidth - read.clientWidth > 1 };
    },
    expected: { fitsFirst: { tabindex: null, role: null, "aria-label": null }, after: { tabindex: "0", role: "group", "aria-label": "Work packages" }, overflows: true },
  },
  {
    name: "US1-16 (characterData): the caption's text node edited with text renames the overflowing region",
    run: async (driver) => {
      await page(driver, dt("dt", "", usTable("t")), 320);
      const first = (await boxAttributes(driver, "dt"))["aria-label"];
      await driver.text("t-cap", "Deployments");
      await driver.settle();
      return { first, after: (await boxAttributes(driver, "dt"))["aria-label"] };
    },
    expected: { first: "Work packages", after: "Deployments" },
  },
  {
    name: "US1-16 (childList): the <caption> replaced renames the overflowing region",
    run: async (driver) => {
      await page(driver, dt("dt", "", usTable("t")), 320);
      const first = (await boxAttributes(driver, "dt"))["aria-label"];
      await driver.replace("t-cap", '<caption id="n-cap">Rollout plan</caption>');
      await driver.settle();
      return { first, after: (await boxAttributes(driver, "dt"))["aria-label"] };
    },
    expected: { first: "Work packages", after: "Rollout plan" },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// T007: the caption bodies of research R-04 and R-07.

const longCaption = "Work packages of mission nineteen across every lane, owner and review state, newest first";

const captions: DataTableScenario[] = [
  {
    name: "R-04 caption text: a hidden span and an aria-hidden span are skipped and an <img alt> is read in the region's name",
    run: async (driver) => {
      const caption = 'Work <span hidden>secret</span><span aria-hidden="true">quiet</span> packages <img alt="for lane"> now';
      await page(driver, dt("dt", "", usTable("t", { caption })), 320);
      return boxAttributes(driver, "dt");
    },
    expected: { tabindex: "0", role: "group", "aria-label": "Work packages for lane now" },
  },
  {
    name: "R-07 caption at 320 px at rest: every caption line box inside the box's unmasked extent and the caption's start equal to the table's start",
    loop: true,
    run: async (driver) => {
      await page(driver, dt("dt", 'label="Work packages"', usTable("t", { caption: `<span id="ct">${longCaption}</span>` })), 320);
      const read = await region(driver, "dt");
      return { fade: read?.fade ?? null, lines: (await lineBoxes(driver, "ct")).length > 1, inside: await linesInside(driver, "ct", "dt"), start: near((await driver.box("t-cap")).x, (await driver.box("t")).x) };
    },
    expected: { fade: "end", lines: true, inside: true, start: true },
  },
  {
    name: "R-07 caption scrolled to the middle and to the end: its start still equal to the table's (not sticky, Q-F (b))",
    run: async (driver) => {
      await page(driver, dt("dt", 'label="Work packages"', usTable("t", { caption: `<span id="ct">${longCaption}</span>` })), 320);
      const read = await region(driver, "dt");
      if (read === null) return { region: null };
      const range = read.scrollWidth - read.clientWidth;
      const at = async (left: number): Promise<unknown> => {
        await driver.setScrollLeft(boxOf("dt"), left);
        return { scrolled: (await driver.scrollLeft(boxOf("dt"))) > 0, start: near((await driver.box("t-cap")).x, (await driver.box("t")).x) };
      };
      return { overflows: range > 1, middle: await at(Math.round(range / 2)), end: await at(range) };
    },
    expected: { overflows: true, middle: { scrolled: true, start: true }, end: { scrolled: true, start: true } },
  },
  {
    name: "R-07 a fitting table: no data-fade, and a long caption wraps at the table's width",
    run: async (driver) => {
      // A caption longer than the box's width (the cap), so it wraps at the table's width there.
      const table = `<table id="t"><caption id="t-cap"><span id="ct">${[longCaption, longCaption, longCaption, longCaption].join(" ")}</span></caption><tbody><tr><td>WP01</td><td>Done</td></tr></tbody></table>`;
      await page(driver, dt("dt", "", table));
      const read = await region(driver, "dt");
      const cap = await driver.box("t-cap");
      const tableBox = await driver.box("t");
      return { region: read && { fade: read.fade, tabindex: read.tabindex }, lines: (await lineBoxes(driver, "ct")).length > 1, atTableWidth: cap.width <= tableBox.width + 0.5 && cap.width > 0 };
    },
    expected: { region: { fade: null, tabindex: null }, lines: true, atTableWidth: true },
  },
  {
    name: "R-07 the narrow-column body: a table overflowing at both 400 and 600 px with a caption longer than the box, data-fade end at rest first, then every caption line box inside the unmasked extent after a 400 → 600 px resize",
    loop: true,
    run: async (driver) => {
      const table = `<table id="t"><caption id="t-cap"><span id="ct">${longCaption} ${longCaption}</span></caption><tbody><tr><td><span class="w800">wide</span></td><td>x</td></tr></tbody></table>`;
      await page(driver, `<div id="w">${dt("dt", 'label="Work packages"', table)}</div>`);
      await driver.size("w", 400, null);
      await driver.settle();
      const rest = await region(driver, "dt");
      const at400 = { fade: rest?.fade ?? null, inside: await linesInside(driver, "ct", "dt") };
      await driver.size("w", 600, null);
      await driver.settle();
      await driver.frames(2);
      const read = await region(driver, "dt");
      return { at400, at600: { fade: read?.fade ?? null, width: read?.width ?? 0, inside: await linesInside(driver, "ct", "dt") } };
    },
    expected: { at400: { fade: "end", inside: true }, at600: { fade: "end", width: 600, inside: true } },
  },
  {
    name: "R-07 the end-fade body: a 400 px block-host table that fits with a one-line caption at the fitting cap; a cell edit makes it overflow (data-fade end, a two-line caption inside the unmasked extent, --data-table-end-fade the px width of .region-edge.end within 0.01 px); the edit undone (no data-fade, one line, --data-table-end-fade empty)",
    loop: true,
    run: async (driver) => {
      await page(driver, "");
      const text = await captionBetween(driver, 362, 386);
      const table = `<table id="t"><caption id="t-cap"><span id="ct">${String(text)}</span></caption><tbody><tr><td id="edit">WP01</td><td>Done</td></tr></tbody></table>`;
      await page(driver, dt("dt", 'data-w="400" label="Work packages"', table));
      const fitting = { fade: field(await region(driver, "dt"), "fade"), lines: (await lineBoxes(driver, "ct")).length };
      await driver.text("edit", "W".repeat(60));
      await driver.settle();
      await driver.frames(2);
      const read = await region(driver, "dt");
      const property = await trackProperty(driver, "dt", "--data-table-end-fade");
      const overflowing = {
        fade: read?.fade ?? null,
        lines: (await lineBoxes(driver, "ct")).length,
        inside: await linesInside(driver, "ct", "dt"),
        px: /^\d+(\.\d+)?px$/.test(property),
        endFade: read !== null && Math.abs(Number.parseFloat(property) - read.end) <= 0.01,
      };
      await driver.text("edit", "WP01");
      await driver.settle();
      await driver.frames(2);
      return { fitting, overflowing, undone: { fade: field(await region(driver, "dt"), "fade"), lines: (await lineBoxes(driver, "ct")).length, endFade: await trackProperty(driver, "dt", "--data-table-end-fade") } };
    },
    expected: {
      fitting: { fade: null, lines: 1 },
      overflowing: { fade: "end", lines: 2, inside: true, px: true, endFade: true },
      undone: { fade: null, lines: 1, endFade: "" },
    },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// T008: host sizing (research R-02).

const sizing: DataTableScenario[] = [
  {
    name: "R-02 a default flex item and the item of a 1fr grid track at 320 px: the page scroll width equals the viewport width and the region overflows",
    run: async (driver) => {
      await page(driver, `<div class="flex">${dt("f", 'label="Work packages"', usTable("tf"))}</div><div class="grid">${dt("g", 'label="Work packages"', usTable("tg"))}</div>`, 320);
      return { scrollWidth: await driver.scrollWidth(), flex: (await boxAttributes(driver, "f")).tabindex, grid: (await boxAttributes(driver, "g")).tabindex };
    },
    expected: { scrollWidth: 320, flex: "0", grid: "0" },
  },
  {
    name: "R-02 in an open <dialog>, an inline-block and a start-aligned column flex: the host as wide as the table plus the ring room on both sides (never 0 px), the caption not narrower than its longest word, a long caption wrapping at the narrow table's width",
    loop: true,
    run: async (driver) => {
      const table = (p: string): string => `<table id="${p}"><caption id="${p}-cap"><span id="${p}-ct">Supercalifragilistic ${longCaption}</span></caption><tbody><tr><td>WP01</td><td>Done</td></tr></tbody></table>`;
      await page(driver, `<dialog id="dlg">${dt("d", "", table("td"))}</dialog><div class="ib">${dt("i", "", table("ti"))}</div><div class="col">${dt("c", "", table("tc"))}</div>`);
      await driver.open("dlg");
      await driver.settle();
      const read = async (id: string, p: string): Promise<unknown> => {
        const host = await driver.box(id);
        const tableBox = await driver.box(p);
        const word = await evaluate(driver, `const node = document.getElementById("${p}-ct").firstChild; const range = document.createRange(); range.setStart(node, 0); range.setEnd(node, 20); return range.getBoundingClientRect().width;`);
        const cap = await driver.box(`${p}-cap`);
        return { wide: host.width > 0 && near(host.width, tableBox.width + 2 * room), word: typeof word === "number" && cap.width >= word - 0.5, wraps: (await lineBoxes(driver, `${p}-ct`)).length > 1 && cap.width <= tableBox.width + 0.5 };
      };
      return { dialog: await read("d", "td"), inlineBlock: await read("i", "ti"), column: await read("c", "tc") };
    },
    expected: (() => {
      const each = { wide: true, word: true, wraps: true };
      return { dialog: each, inlineBlock: each, column: each };
    })(),
  },
  {
    name: "R-02 the one-long-word body: a two-column narrow table in an inline-block whose caption words are wider than the grid, a box width with a fractional part between 0.1 and 0.4 px (precondition): the table widens to the longest word, no tabindex, no data-fade",
    loop: true,
    run: async (driver) => {
      const table = '<table id="t"><caption id="t-cap"><span id="ct">Deployment approvals pending</span></caption><tbody><tr><td>Ok</td><td>3</td></tr></tbody></table>';
      // The letter spacing is chosen per harness font (spike § 6): each candidate is a fresh mount with it from the
      // start, as the cap written by the first measure caps the caption's share of the table's width afterwards.
      let fraction = -1;
      for (let hundredths = 0; hundredths <= 12; hundredths++) {
        await page(driver, `<div class="ib">${dt("dt", "", table)}</div>`, 1280, `#t-cap { letter-spacing: ${String(hundredths / 100)}px; }`);
        await driver.frames(2);
        const read = await region(driver, "dt");
        if (read === null) break;
        fraction = read.width - Math.floor(read.width);
        if (fraction >= 0.1 && fraction <= 0.4) break;
      }
      const read = await region(driver, "dt");
      const word = await evaluate(driver, 'const node = document.getElementById("ct").firstChild; const range = document.createRange(); range.setStart(node, 0); range.setEnd(node, 10); return range.getBoundingClientRect().width;');
      return {
        precondition: fraction >= 0.1 && fraction <= 0.4,
        widened: typeof word === "number" && (await driver.box("t")).width >= word - 0.5,
        region: read && { tabindex: read.tabindex, fade: read.fade },
      };
    },
    expected: { precondition: true, widened: true, region: { tabindex: null, fade: null } },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// T009: the data-table edge cases (FR-052).

const edges: DataTableScenario[] = [
  {
    name: "edge: no <table> child: .region-box exists with no slotted node, never overflows even at 320 px, no error, the other child not shown; two tables: only the first shown and exposed",
    run: async (driver) => {
      await page(driver, `${dt("n", 'label="Empty"', `<p id="np">${identifier} ${identifier}</p>`)}${dt("two", "", `${usTable("t1")}${usTable("t2", { caption: "Second" })}`)}`, 320);
      const read = await region(driver, "n");
      const two = await region(driver, "two");
      return {
        none: read && { assigned: read.assigned, tabindex: read.tabindex, shown: (await driver.box("np")).height > 0 },
        messages: await driver.messages(),
        two: two && { assigned: two.assignedId, secondShown: (await driver.box("t2")).height > 0, tables: (await roles(driver, "two")).filter((role) => role === "table").length },
      };
    },
    expected: { none: { assigned: 0, tabindex: null, shown: false }, messages: [], two: { assigned: "t1", secondShown: false, tables: 1 } },
  },
  {
    name: "edge: a table nested in a cell is not styled (UA padding, no rule), paired with the outer cells' compact padding and row rule",
    run: async (driver) => {
      const table = '<table id="t"><tbody><tr><td id="outer">Outer<table><tbody><tr><td id="inner">Inner</td></tr></tbody></table></td><td id="o2">x</td></tr><tr><td>y</td><td>z</td></tr></tbody></table>';
      await page(driver, dt("dt", "", table));
      return {
        outer: await tokensOf(driver, "o2", { "padding-block-start": "space-1", "padding-inline-start": "space-2", "border-block-end-color": "color-rule" }),
        outerRule: await driver.computed("o2", "border-bottom-style"),
        inner: [await driver.computed("inner", "padding-top"), await driver.computed("inner", "border-bottom-style"), await driver.computed("inner", "text-transform")],
      };
    },
    expected: { outer: { "padding-block-start": "space-1", "padding-inline-start": "space-2", "border-block-end-color": "color-rule" }, outerRule: "solid", inner: ["1px", "none", "none"] },
  },
  {
    name: "edge: no <thead> renders the rows compact; a <thead> with an empty <tbody> renders unchanged: the header row eyebrows, the region exists, no added text node",
    run: async (driver) => {
      await page(driver, `${dt("a", "", usTable("ta", { head: false }))}${dt("b", "", '<table id="tb"><thead><tr><th id="bh">Id</th><th>Lane</th></tr></thead><tbody></tbody></table>')}`);
      const b = await region(driver, "b");
      const texts = (await driver.axSubtree("b")).filter((node) => node.role === "StaticText").map((node) => node.name);
      return {
        noHead: await tokensOf(driver, "ta-c0-1", { "padding-block-start": "space-1", color: "color-ink-soft" }),
        header: await tokensOf(driver, "bh", { "text-transform": "=uppercase", color: "color-eyebrow" }),
        region: b?.assignedId ?? null,
        texts,
      };
    },
    expected: { noHead: { "padding-block-start": "space-1", color: "color-ink-soft" }, header: { "text-transform": "=uppercase", color: "color-eyebrow" }, region: "tb", texts: ["ID", "LANE"] },
  },
  {
    name: "edge (R-06): two <tbody> groups and a <tfoot>: a row rule between every pair of consecutive rows, none below the table's last row",
    run: async (driver) => {
      const rows = (p: string, count: number): string => Array.from({ length: count }, (_, index) => `<tr><td id="${p}${String(index)}">${p}${String(index)}</td><td>x</td></tr>`).join("");
      await page(driver, dt("dt", "", `<table><tbody>${rows("a", 2)}</tbody><tbody>${rows("b", 2)}</tbody><tfoot>${rows("f", 2)}</tfoot></table>`));
      const out: string[] = [];
      for (const id of ["a0", "a1", "b0", "b1", "f0", "f1"]) out.push(`${await driver.computed(id, "border-bottom-style")} ${await driver.computed(id, "border-bottom-width")}`);
      const ruleWidth = await tokenPx(driver, "border-width");
      return out.map((each) => (each === `solid ${String(ruleWidth)}px` ? "rule" : each));
    },
    expected: ["rule", "rule", "rule", "rule", "rule", "none 0px"],
  },
  {
    name: "edge: row headers are row headers; a corner header with scope=row in <thead> takes the row-header style; a colspan header takes the eyebrow",
    run: async (driver) => {
      const table = '<table><thead><tr><th scope="row" id="corner">Item</th><th colspan="2" id="span">Lanes</th></tr></thead><tbody><tr><th scope="row" id="rh">WP01</th><td>a</td><td>b</td></tr></tbody></table>';
      await page(driver, dt("dt", "", table));
      const row = { "font-size": "font-size-sm", color: "color-ink", "text-transform": "=none" };
      return { corner: await tokensOf(driver, "corner", row), rowHeader: await tokensOf(driver, "rh", row), colspan: await tokensOf(driver, "span", { "text-transform": "=uppercase", color: "color-eyebrow" }) };
    },
    expected: {
      corner: { "font-size": "font-size-sm", color: "color-ink", "text-transform": "=none" },
      rowHeader: { "font-size": "font-size-sm", color: "color-ink", "text-transform": "=none" },
      colspan: { "text-transform": "=uppercase", color: "color-eyebrow" },
    },
  },
  {
    name: "edge (FR-007): under wrap=anywhere header cells have no overflow-wrap, paired with body cells having overflow-wrap: anywhere",
    run: async (driver) => {
      await page(driver, dt("dt", 'wrap="anywhere"', usTable("t")));
      return { header: await driver.computed("t-h0", "overflow-wrap"), body: await driver.computed("t-c0-0", "overflow-wrap") };
    },
    expected: { header: "normal", body: "anywhere" },
  },
  {
    name: "edge: the 640 px \"200% zoom\" case: the page does not scroll sideways and the region exists",
    run: async (driver) => {
      await page(driver, dt("dt", 'label="Work packages"', usTable("t", { caption: longCaption })), 640);
      return { scrollWidth: await driver.scrollWidth(), assigned: (await region(driver, "dt"))?.assignedId ?? null };
    },
    expected: { scrollWidth: 640, assigned: "t" },
  },
  {
    name: "edge: unset properties write no attribute (label, wrap, sticky-header, striped), paired with the element rendering its region",
    run: async (driver) => {
      await page(driver, dt("dt", "", usTable("t")));
      const attributes: unknown[] = [];
      for (const name of ["label", "wrap", "sticky-header", "striped"]) attributes.push(await driver.attribute("dt", name));
      return { attributes, assigned: (await region(driver, "dt"))?.assignedId ?? null };
    },
    expected: { attributes: [null, null, null, null], assigned: "t" },
  },
  {
    name: "edge (FR-001, FR-015): a hidden host has no box and nothing in the AX tree; an aria-hidden host shows its table with neither region nor table in the AX tree; each paired with a sibling that renders .region-box with its table assigned and exposed",
    run: async (driver) => {
      await page(driver, `${dt("h", "hidden", usTable("th"))}${dt("a", 'aria-hidden="true"', usTable("ta"))}${dt("s", "", usTable("ts"))}`, 320);
      const hostBox = await driver.box("h");
      const sibling = await region(driver, "s");
      return {
        hidden: { display: await driver.computed("h", "display"), size: [hostBox.width, hostBox.height], ax: (await driver.axSubtree("h")).length },
        ariaHidden: { shown: (await driver.box("ta")).height > 0, ax: (await roles(driver, "a")).filter((role) => role === "table" || role === "group" || role === "row").length },
        sibling: { assigned: sibling?.assignedId ?? null, table: (await roles(driver, "s")).includes("table") },
      };
    },
    expected: { hidden: { display: "none", size: [0, 0], ax: 0 }, ariaHidden: { shown: true, ax: 0 }, sibling: { assigned: "ts", table: true } },
  },
];

edges.push({
  name: "edge: a hidden host shown at run time renders its region with the table assigned and, at 320 px, overflowing with its tab stop and name (the no-loop check's hidden-host case)",
  loop: true,
  run: async (driver) => {
    await page(driver, dt("h", 'hidden label="Work packages"', usTable("t")), 320);
    const hidden = (await driver.box("h")).width;
    await driver.setAttribute("h", "hidden", null);
    await driver.settle();
    await driver.frames(2);
    const read = await region(driver, "h");
    return { hidden, shown: read && { assigned: read.assignedId, tabindex: read.tabindex, name: read.name } };
  },
  expected: { hidden: 0, shown: { assigned: "t", tabindex: "0", name: "Work packages" } },
});

// ---------------------------------------------------------------------------------------------------------------
// T080: US1-17 to US1-28 and the inventory decisions' edge cases.

/** A sticky data table host of `rows` rows. */
const sticky = (id: string, attributes: string, options: TableOptions = {}): string => dt(id, `sticky-header label="Work packages" ${attributes}`, usTable(`${id}t`, { rows: 20, ident: false, ...options }));

/** Where the `<thead>` of host `id` is: its block-start offset from the box's client block start. */
async function headOffset(driver: Driver, id: string): Promise<number | null> {
  const read = await region(driver, id);
  return read === null ? null : (await driver.box(`${id}t-head`)).y - read.y;
}

/** The ids of each header cell for which `elementFromPoint` at its centre returns that cell (or its text's parent). */
async function headersHit(driver: Driver, id: string): Promise<boolean[]> {
  const out: boolean[] = [];
  for (let index = 0; index < columns.length; index++) out.push((await hitAtCentre(driver, `${id}t-h${String(index)}`)) === `${id}t-h${String(index)}`);
  return out;
}

/** The keys the browser keeps, in order, each from where the previous left the box (re-analysis G1 (a)). */
async function browserKeys(driver: Driver, id: string, rest: number): Promise<unknown[]> {
  const keys: { readonly key: string; readonly shift?: boolean }[] = [{ key: "PageDown" }, { key: "PageUp" }, { key: "End" }, { key: "Home" }, { key: " " }, { key: " ", shift: true }];
  const out: unknown[] = [];
  for (const { key, shift } of keys) {
    const from = await driver.scrollTop(boxOf(id));
    await driver.press(key, { shift: shift === true });
    await driver.frames(30);
    await driver.settle();
    const read = await must(driver, id);
    const to = read.scrollTop;
    const range = read.scrollHeight - read.clientHeight;
    const offset = (await driver.box(`${id}t-head`)).y - read.y;
    out.push({
      key: shift === true ? `Shift+${key}` : key,
      prevented: await driver.lastKeyPrevented(),
      direction: to > from ? "down" : to < from ? "up" : "none",
      position: to === 0 ? "start" : Math.abs(range - to) <= 1 ? "end" : "middle",
      blockFade: read.blockFade,
      head: near(offset, 0) ? "client start" : near(offset, rest) ? "rest" : `at ${String(offset)}`,
    });
  }
  return out;
}

const stickyBodies: DataTableScenario[] = [
  {
    name: "US1-17: twenty rows, sticky-header and a bounded host: the <thead> at the box's client block start within 0.5 px scrolled to the middle and the end, elementFromPoint at each header cell's centre returning it, the header cells on --ocelle-color-sheet, the header rule below the row, the page's scroll height unchanged; also inside prose",
    run: async (driver) => {
      await page(driver, `${sticky("s", 'data-bound="300"')}<div data-ocelle-prose="">${sticky("p", 'data-bound="300"')}</div>`);
      const height = await pageHeight(driver);
      const at = async (id: string): Promise<unknown> => {
        const read = await region(driver, id);
        if (read === null) return "no region";
        const range = read.scrollHeight - read.clientHeight;
        const out: unknown[] = [];
        for (const top of [Math.round(range / 2), range]) {
          await driver.setScrollTop(boxOf(id), top);
          out.push({ scrolled: (await driver.scrollTop(boxOf(id))) > room, pinned: near((await headOffset(driver, id)) ?? -99, 0), hit: await headersHit(driver, id), rule: Number.parseFloat(await driver.computed(`${id}t-h0`, "border-bottom-width")) > 0 });
        }
        return out;
      };
      const sheet = await tokenColour(driver, "color-sheet");
      const result = {
        plain: await at("s"),
        prose: await at("p"),
        ground: [(await driver.computed("st-h0", "background-color")) === sheet, (await driver.computed("pt-h0", "background-color")) === sheet],
        pageHeight: (await pageHeight(driver)) === height,
      };
      return result;
    },
    expected: (() => {
      const each = { scrolled: true, pinned: true, hit: [true, true, true, true, true], rule: true };
      return { plain: [each, each], prose: [each, each], ground: [true, true], pageHeight: true };
    })(),
  },
  {
    name: "US1-18: the bounded sticky box is a named group tab stop with no inline overflow; ArrowDown and ArrowUp scroll it by the step; ArrowRight, ArrowLeft and Shift+ArrowDown do not; PageDown, PageUp, End, Home, Space and Shift+Space are left to the browser and scroll it in their direction with data-block-fade following and the <thead> pinned (G1 (a), Q-2 (a)), paired with ArrowDown prevented; the bound removed: no tab stop, role or name",
    run: async (driver) => {
      await page(driver, `${before}${sticky("s", 'data-bound="300"', { caption: "" })}`);
      const rest = await headOffset(driver, "s");
      const first = await region(driver, "s");
      if (first === null) return { region: null };
      await tabToBox(driver);
      const arrows: unknown[] = [];
      for (const key of ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Shift+ArrowDown"]) {
        await driver.chord(key);
        arrows.push({ key, scrollTop: await driver.scrollTop(boxOf("s")), scrollLeft: await driver.scrollLeft(boxOf("s")) });
      }
      await driver.setScrollTop(boxOf("s"), 0);
      await driver.focus(boxOf("s"));
      const keys = await browserKeys(driver, "s", rest ?? room);
      await driver.chord("ArrowDown");
      const arrowDown = { prevented: await driver.lastKeyPrevented(), scrollTop: await driver.scrollTop(boxOf("s")) };
      await driver.setAttribute("s", "data-bound", null);
      await driver.settle();
      return {
        rest: rest === null ? null : near(rest, room),
        first: { tabindex: first.tabindex, role: first.role, name: first.name, inline: first.scrollWidth - first.clientWidth > 1 },
        arrows,
        keys,
        arrowDown,
        unbounded: await boxAttributes(driver, "s"),
      };
    },
    expected: {
      rest: true,
      first: { tabindex: "0", role: "group", name: "Work packages", inline: false },
      arrows: [
        { key: "ArrowDown", scrollTop: step, scrollLeft: 0 },
        { key: "ArrowDown", scrollTop: 2 * step, scrollLeft: 0 },
        { key: "ArrowUp", scrollTop: step, scrollLeft: 0 },
        { key: "ArrowRight", scrollTop: step, scrollLeft: 0 },
        { key: "ArrowLeft", scrollTop: step, scrollLeft: 0 },
        { key: "Shift+ArrowDown", scrollTop: step, scrollLeft: 0 },
      ],
      keys: [
        { key: "PageDown", prevented: false, direction: "down", position: "middle", blockFade: "end", head: "client start" },
        { key: "PageUp", prevented: false, direction: "up", position: "start", blockFade: "end", head: "rest" },
        { key: "End", prevented: false, direction: "down", position: "end", blockFade: null, head: "client start" },
        { key: "Home", prevented: false, direction: "up", position: "start", blockFade: "end", head: "rest" },
        { key: " ", prevented: false, direction: "down", position: "middle", blockFade: "end", head: "client start" },
        { key: "Shift+ ", prevented: false, direction: "up", position: "start", blockFade: "end", head: "rest" },
      ],
      arrowDown: { prevented: true, scrollTop: step },
      unbounded: { tabindex: null, role: null, "aria-label": null },
    },
  },
  {
    name: "US1-19: a link in row 12 under the pinned header, tabbed to, has its ring box below the header row's block end and inside the box; a link in a header cell focused leaves scrollTop unchanged",
    run: async (driver) => {
      await page(driver, sticky("s", 'data-bound="300"', { rows: 30, headExtra: (index) => (index === 1 ? ' <a id="sort" href="#sort">sort</a>' : "") }));
      const read = await region(driver, "s");
      if (read === null) return { region: false };
      await driver.focus("st-a11");
      const row12 = await driver.box("st-r12");
      const head = await driver.box("st-head");
      // Row 12's top 10 px above the block end of the header pinned at the box's client block start.
      await driver.setScrollTop(boxOf("s"), (await driver.scrollTop(boxOf("s"))) + (row12.y - (read.y + head.height - 10)));
      const under = (await driver.box("st-a12")).y < bottomOf(await driver.box("st-head"));
      await driver.pressTab();
      const ring = await ringOf(driver, "st-a12");
      const headNow = await driver.box("st-head");
      const now = await region(driver, "s");
      const cleared = { under, focused: await driver.focused(), below: ring.top >= bottomOf(headNow) - 0.5, inside: now !== null && ring.bottom <= now.y + now.clientHeight + 0.5 };
      await driver.setScrollTop(boxOf("s"), 100);
      await driver.focus("sort");
      return { region: true, cleared, header: { focused: await driver.focused(), scrollTop: await driver.scrollTop(boxOf("s")) } };
    },
    expected: { region: true, cleared: { under: true, focused: "st-a12", below: true, inside: true }, header: { focused: "sort", scrollTop: 100 } },
  },
  {
    name: "US1-20: sticky-header with no bound: scroll height = client height, no tab stop while it fits, no data-axis and overflow-y hidden (Q-3 (c)), paired with border-collapse separate and the <thead> sticky; a test-only bound below the table's block size: data-axis both, block scroll, overflow-y auto and scrollbar-gutter auto (Q-A1 (a))",
    run: async (driver) => {
      await page(driver, sticky("s", ""));
      const read = await region(driver, "s");
      const unbounded = read && { scrolls: read.scrollHeight - read.clientHeight > 1, tabindex: read.tabindex, axis: read.axis, overflowY: await safe(() => driver.computed(boxOf("s"), "overflow-y")) };
      const model = { collapse: await driver.computed("st", "border-collapse"), spacing: await driver.computed("st", "border-spacing"), position: await driver.computed("st-head", "position") };
      await driver.setAttribute("s", "data-bound", "300");
      await driver.settle();
      const after = await region(driver, "s");
      return {
        unbounded,
        model,
        bounded: after && { axis: after.axis, scrolls: after.scrollHeight - after.clientHeight > 1, overflowY: await safe(() => driver.computed(boxOf("s"), "overflow-y")), gutter: await safe(() => driver.computed(boxOf("s"), "scrollbar-gutter")), tabindex: after.tabindex },
      };
    },
    expected: {
      unbounded: { scrolls: false, tabindex: null, axis: null, overflowY: "hidden" },
      model: { collapse: "separate", spacing: "0px", position: "sticky" },
      bounded: { axis: "both", scrolls: true, overflowY: "auto", gutter: "auto", tabindex: "0" },
    },
  },
  {
    name: "US1-20 under dir=rtl at 320 px: the unbounded sticky table overflowing inline only has no data-axis, scrollLeft 0, data-fade end and its first column header at the track's start; paired with the bounded one (data-axis both, scrollLeft 0, data-fade end), at the far end data-fade start with the last column inside, and scrollLeft 0 and data-fade end after the bound is lifted (Q-3 (c), Q-A1 (a))",
    run: async (driver) => {
      await page(driver, `<div dir="rtl">${sticky("u", "", { ident: true })}${sticky("b", 'data-bound="300"', { ident: true })}</div>`, 320);
      const read = await region(driver, "u");
      const track = await safe(() => driver.box("u", ".region-track"));
      const first = await driver.box("ut-h0");
      const inline = read && { axis: read.axis, scrollLeft: read.scrollLeft, fade: read.fade, atStart: typeof track !== "string" && near(rightOf(first), rightOf(track) - room) };
      const bounded = await region(driver, "b");
      const rest = bounded && { axis: bounded.axis, scrollLeft: bounded.scrollLeft, fade: bounded.fade };
      let far: unknown = "no region";
      if (bounded !== null) {
        const range = bounded.scrollWidth - bounded.clientWidth;
        await driver.setScrollLeft(boxOf("b"), -range);
        const now = await must(driver, "b");
        const last = await driver.box("bt-h4");
        far = { reached: Math.abs(now.scrollLeft), range, fade: now.fade, lastInside: last.x >= now.x + (now.width - now.clientWidth) - 0.5 };
        await driver.setScrollLeft(boxOf("b"), 0);
      }
      await driver.setAttribute("b", "data-bound", null);
      await driver.settle();
      const lifted = await region(driver, "b");
      return { inline, rest, far: typeof far === "object" && far !== null && "range" in far ? { ...far, range: true, reached: Math.abs((far as { reached: number; range: number }).reached - (far as { range: number }).range) <= 1 } : far, lifted: lifted && { axis: lifted.axis, scrollLeft: lifted.scrollLeft, fade: lifted.fade } };
    },
    expected: {
      inline: { axis: null, scrollLeft: 0, fade: "end", atStart: true },
      rest: { axis: "both", scrollLeft: 0, fade: "end" },
      far: { reached: true, range: true, fade: "start", lastInside: true },
      lifted: { axis: null, scrollLeft: 0, fade: "end" },
    },
  },
  {
    name: "US1-21: at 320 px with unbroken identifiers, the page does not scroll sideways; scrolled to the inline end and in the block axis, the header is pinned at the block start and each column header's inline start equals its column's cells'; data-fade start at the inline end",
    run: async (driver) => {
      await page(driver, sticky("s", 'data-bound="300"', { ident: true }), 320);
      const scrollWidth = await driver.scrollWidth();
      const read = await region(driver, "s");
      if (read === null) return { scrollWidth, region: null };
      await driver.setScrollLeft(boxOf("s"), read.scrollWidth - read.clientWidth);
      await driver.setScrollTop(boxOf("s"), 150);
      const aligned: boolean[] = [];
      for (let index = 0; index < columns.length; index++) aligned.push(near((await driver.box(`st-h${String(index)}`)).x, (await driver.box(`st-c10-${String(index)}`)).x));
      return { scrollWidth, region: { pinned: near((await headOffset(driver, "s")) ?? -99, 0), aligned, fade: (await must(driver, "s")).fade } };
    },
    expected: { scrollWidth: 320, region: { pinned: true, aligned: [true, true, true, true, true], fade: "start" } },
  },
  {
    name: "sticky-header set and removed after mount: the axis, the border model and the tab stop follow after settle",
    run: async (driver) => {
      await page(driver, dt("s", 'label="Work packages" data-bound="300"', usTable("st", { rows: 20, ident: false })));
      const read = async (): Promise<unknown> => {
        const box = await region(driver, "s");
        return box && { axis: box.axis, tabindex: box.tabindex, collapse: await driver.computed("st", "border-collapse") };
      };
      const off = await read();
      await driver.setAttribute("s", "sticky-header", "");
      await driver.settle();
      const on = await read();
      await driver.setAttribute("s", "sticky-header", null);
      await driver.settle();
      return { off, on, removed: await read() };
    },
    expected: {
      off: { axis: null, tabindex: null, collapse: "collapse" },
      on: { axis: "both", tabindex: "0", collapse: "separate" },
      removed: { axis: null, tabindex: null, collapse: "collapse" },
    },
  },
  {
    name: "sticky tables: with no <thead> nothing is pinned (the first row scrolls away); with two header rows both pin together; the caption scrolls away in the block axis",
    run: async (driver) => {
      const twoRows = usTable("dt2", { rows: 20, ident: false }).replace('<thead id="dt2-head">', '<thead id="dt2-head"><tr id="dt2-hr0"><th colspan="5">Group</th></tr>');
      await page(driver, `${sticky("n", 'data-bound="300"', { head: false })}${dt("d", 'sticky-header label="Work packages" data-bound="300"', twoRows.replace(/id="dt2/g, 'id="dt'))}${sticky("c", 'data-bound="300"')}`);
      if ((await region(driver, "n")) === null) return { region: null };
      await driver.setScrollTop(boxOf("n"), 100);
      await driver.setScrollTop(boxOf("d"), 100);
      await driver.setScrollTop(boxOf("c"), 150);
      const n = await region(driver, "n");
      const d = await region(driver, "d");
      const c = await region(driver, "c");
      const firstRow = await driver.box("nt-r0");
      const r0 = await driver.box("dt-hr0");
      const r1 = await driver.box("dt-hr");
      return {
        noHead: n && { axis: n.axis, scrolled: n.scrollTop > 0, gone: bottomOf(firstRow) <= n.y + 0.5 },
        twoRows: d && { first: near(r0.y, d.y), second: near(r1.y, bottomOf(r0)) },
        caption: c && { gone: bottomOf(await driver.box("ct-cap")) <= c.y + 0.5 },
      };
    },
    expected: { noHead: { axis: "both", scrolled: true, gone: true }, twoRows: { first: true, second: true }, caption: { gone: true } },
  },
  {
    name: "the sticky caption body: at 320 px a two-line caption's line boxes inside the unmasked extent with the block-axis scrollbar's room subtracted, again after a bound set and lifted at run time; --data-table-box-size the measured box size less offsetWidth − clientWidth (0 under hidden scrollbars, Q-A1 (a))",
    loop: true,
    run: async (driver) => {
      await page(driver, sticky("s", 'data-bound="300"', { ident: true, caption: '<span id="ct">Work packages<br>by <a id="cl" href="#c">owner</a></span>' }), 320);
      const read = async (): Promise<unknown> => {
        await driver.frames(2);
        const box = await region(driver, "s");
        const size = await safe(() => driver.box("s", ".box-size"));
        const written = await trackProperty(driver, "s", "--data-table-box-size");
        return box && {
          axis: box.axis,
          room: box.offsetWidth - box.clientWidth,
          lines: (await lineBoxes(driver, "ct")).length,
          inside: await linesInside(driver, "ct", "s"),
          size: typeof size !== "string" && Math.abs(Number.parseFloat(written) - (size.width - (box.offsetWidth - box.clientWidth))) <= 0.01,
        };
      };
      const bounded = await read();
      await driver.setAttribute("s", "data-bound", null);
      await driver.settle();
      const lifted = await read();
      await driver.setAttribute("s", "data-bound", "300");
      await driver.settle();
      return { bounded, lifted, again: await read() };
    },
    expected: {
      bounded: { axis: "both", room: 0, lines: 2, inside: true, size: true },
      lifted: { axis: null, room: 0, lines: 2, inside: true, size: true },
      again: { axis: "both", room: 0, lines: 2, inside: true, size: true },
    },
  },
  {
    name: "US1-22: data-ocelle-align=end on an estimate column's header and body cells, in the data table, inside prose, in a plain prose table and under dir=rtl: text-align end, tabular-nums, the text's line box end at the content box's end within 0.5 px; the header keeps its eyebrow type; other cells stay start-aligned",
    run: async (driver) => {
      const table = (p: string): string => `<table id="${p}"><thead><tr><th id="${p}-h">Item</th><th id="${p}-eh" data-ocelle-align="end">Estimate</th></tr></thead><tbody><tr><td id="${p}-i">WP01</td><td id="${p}-e" data-ocelle-align="end"><span id="${p}-es">3.5</span></td></tr></tbody></table>`;
      await page(driver, `${dt("a", "", table("ta"))}<div data-ocelle-prose="">${dt("b", "", table("tb"))}${table("tc")}</div><div dir="rtl">${dt("d", "", table("td"))}</div>`);
      const read = async (p: string, rtl: boolean): Promise<unknown> => {
        const cell = await driver.box(`${p}-e`);
        const line = (await lineBoxes(driver, `${p}-es`))[0];
        const pad = Number.parseFloat(await driver.computed(`${p}-e`, rtl ? "padding-left" : "padding-right"));
        return {
          align: await driver.computed(`${p}-e`, "text-align"),
          figures: await driver.computed(`${p}-e`, "font-variant-numeric"),
          atEnd: line !== undefined && (rtl ? near(line.left, cell.x + pad) : near(line.right, rightOf(cell) - pad)),
          header: [await driver.computed(`${p}-eh`, "text-align"), await driver.computed(`${p}-eh`, "text-transform")],
          other: [await driver.computed(`${p}-i`, "text-align"), await driver.computed(`${p}-h`, "text-align")],
        };
      };
      return { table: await read("ta", false), prose: await read("tb", false), plainProse: await read("tc", false), rtl: await read("td", true) };
    },
    expected: (() => {
      const each = { align: "end", figures: "tabular-nums", atEnd: true, header: ["end", "uppercase"], other: ["start", "start"] };
      return { table: each, prose: each, plainProse: { ...each, header: ["end", "none"] }, rtl: each };
    })(),
  },
  {
    name: "US1-23: striped, two <tbody> groups of five rows and a <tfoot>: the second and fourth rows of each group on --ocelle-color-inset, odd, header and footer rows none, text colours unchanged, row rules drawn; a hidden row counted; striped removed: no ground",
    run: async (driver) => {
      const group = (g: string, hidden: number | null): string => `<tbody>${Array.from({ length: 5 }, (_, index) => `<tr${hidden === index ? " hidden" : ""}><td id="${g}${String(index)}">${g}${String(index)}</td><td>x</td></tr>`).join("")}</tbody>`;
      await page(driver, dt("dt", "striped", `<table><thead><tr><th id="h">Id</th><th>x</th></tr></thead>${group("a", null)}${group("b", 0)}<tfoot><tr><td id="f">Total</td><td>x</td></tr></tfoot></table>`));
      const ids = ["h", "a0", "a1", "a2", "a3", "a4", "b1", "b2", "b3", "b4", "f"];
      const striped = await groundTokens(driver, ids, ["color-inset"]);
      const text = (await driver.computed("a1", "color")) === (await tokenColour(driver, "color-ink-soft"));
      const rule = await driver.computed("a1", "border-bottom-style");
      await driver.setAttribute("dt", "striped", null);
      await driver.settle();
      return { striped, text, rule, removed: await groundTokens(driver, ids, ["color-inset"]) };
    },
    expected: {
      striped: ["none", "none", "color-inset", "none", "color-inset", "none", "color-inset", "none", "color-inset", "none", "none"],
      text: true,
      rule: "solid",
      removed: Array.from({ length: 11 }, () => "none"),
    },
  },
  {
    name: "US1-24: hovering a body cell gives its row's cells --ocelle-color-hover-bg, over a stripe too (dark theme), paired with an unhovered row unchanged; a header and a footer row hovered paint nothing; no event, no tab stop added, cursor auto",
    run: async (driver) => {
      const table = (p: string): string => `<table><thead><tr><th id="${p}h">Id</th><th id="${p}h2">x</th></tr></thead><tbody>${Array.from({ length: 4 }, (_, index) => `<tr><td id="${p}${String(index)}">${p}${String(index)}</td><td id="${p}${String(index)}b">x</td></tr>`).join("")}</tbody><tfoot><tr><td id="${p}f">Total</td><td>x</td></tr></tfoot></table>`;
      await page(driver, `${dt("a", "", table("a"))}${dt("b", "striped", table("b"))}`);
      await driver.theme("dark");
      await driver.listen(["a", "b"]);
      await driver.hover("a0");
      const plain = { hovered: await groundTokens(driver, ["a0", "a0b"], ["color-hover-bg"]), other: await groundTokens(driver, ["a2", "a2b"], ["color-hover-bg"]), cursor: await driver.computed("a0", "cursor") };
      await driver.hover("b1");
      const stripe = { hovered: await groundTokens(driver, ["b1", "b1b"], ["color-hover-bg", "color-inset"]), other: await groundTokens(driver, ["b3"], ["color-hover-bg", "color-inset"]) };
      await driver.hover("ah");
      const header = await groundTokens(driver, ["ah", "ah2"], ["color-hover-bg"]);
      await driver.hover("af");
      const footer = await groundTokens(driver, ["af"], ["color-hover-bg"]);
      await driver.hover(null);
      const tabStops = await evaluate(driver, 'return [...document.querySelectorAll("ocelle-data-table td, ocelle-data-table tr, ocelle-data-table th")].filter((each) => each.hasAttribute("tabindex")).length;');
      return { plain, stripe, header, footer, heard: await driver.heard(), tabStops, assigned: (await region(driver, "a"))?.assigned ?? 0 };
    },
    expected: {
      plain: { hovered: ["color-hover-bg", "color-hover-bg"], other: ["none", "none"], cursor: "auto" },
      stripe: { hovered: ["color-hover-bg", "color-hover-bg"], other: ["color-inset"] },
      header: ["none", "none"],
      footer: ["none"],
      heard: [],
      tabStops: 0,
      assigned: 1,
    },
  },
  {
    name: "US1-25: in forced colours the first body cell's border-inline-start is --ocelle-bar-width, CanvasText on striped even rows, Highlight on the hovered row (a striped even row), Canvas otherwise; the pinned header's cells not transparent with a CanvasText rule; cell text a system text colour",
    run: async (driver) => {
      await page(driver, dt("dt", 'sticky-header striped label="Work packages" data-bound="300"', usTable("t", { rows: 6, ident: false })));
      const bar = await tokenPx(driver, "bar-width");
      await driver.forcedColors("active", "light");
      const colours: Record<string, string> = { [await driver.resolveColour("CanvasText")]: "CanvasText", [await driver.resolveColour("Highlight")]: "Highlight", [await driver.resolveColour("Canvas")]: "Canvas" };
      // The hovered row is a striped even row: its band is Highlight, after the stripe's CanvasText.
      await driver.hover("t-c3-1");
      const band: unknown[] = [];
      for (const r of [0, 1, 2, 3]) band.push({ width: Number.parseFloat(await driver.computed(`t-c${String(r)}-0`, "border-left-width")) === bar, colour: colours[await driver.computed(`t-c${String(r)}-0`, "border-left-color")] ?? "other" });
      const header = { ground: (await driver.computed("t-h0", "background-color")) !== transparent, rule: colours[await driver.computed("t-h0", "border-bottom-color")] ?? "other" };
      const text = colours[await driver.computed("t-c0-1", "color")] ?? "other";
      await driver.hover(null);
      await driver.forcedColors("none");
      return { band, header, text };
    },
    expected: {
      band: [
        { width: true, colour: "Canvas" },
        { width: true, colour: "CanvasText" },
        { width: true, colour: "Canvas" },
        { width: true, colour: "Highlight" },
      ],
      header: { ground: true, rule: "CanvasText" },
      text: "CanvasText",
    },
  },
  {
    name: "US1-26: data-block-fade end and four mask layers at the block start with its edge at or below the header row; none at the block end, back after ArrowUp; under the room rule (an 80 px bound, less than twice the depth below the header) no fade with rows below",
    run: async (driver) => {
      await page(driver, `${sticky("s", 'data-bound="300"')}${sticky("r", 'data-bound="80"', { caption: "" })}`);
      const read = await region(driver, "s");
      if (read === null) return { region: null };
      const head = await driver.box("st-head");
      const rest = { blockFade: read.blockFade, layers: (await driver.computed(boxOf("s"), "mask-image")).split("linear-gradient(").length - 1, belowHead: fadeTop(read) >= bottomOf(head) - 0.5 };
      await driver.setScrollTop(boxOf("s"), 5000);
      const end = field(await region(driver, "s"), "blockFade");
      await driver.focus(boxOf("s"));
      await driver.chord("ArrowUp");
      const back = field(await region(driver, "s"), "blockFade");
      const small = await region(driver, "r");
      const space = small === null ? null : small.y + small.clientHeight - bottomOf(await driver.box("rt-head"));
      return { rest, end, back, roomRule: small && { lessThanTwice: space !== null && space < 2 * depth, below: small.scrollHeight - small.clientHeight > 1, blockFade: small.blockFade } };
    },
    expected: { rest: { blockFade: "end", layers: 4, belowHead: true }, end: null, back: "end", roomRule: { lessThanTwice: true, below: true, blockFade: null } },
  },
  {
    name: "US1-26 with a two-line caption at 320 px (A1 (c) decided (a)): in a 100 px bound no fade at rest (less than twice the depth below the <thead>'s current edge), the fade once scrolled past the caption at or below the pinned header; in a 300 px bound the fade at rest; a row-1 link tabbed to at rest and past the caption has its ring box at or below the header's current edge and inside the box",
    run: async (driver) => {
      const caption = '<span id="SPAN">Work packages<br>by <a id="LINK" href="#c">owner</a></span>';
      await page(driver, `${before}${sticky("s", 'data-bound="100"', { caption: caption.replace("SPAN", "s-ct").replace("LINK", "s-cl") })}${sticky("t", 'data-bound="300"', { caption: caption.replace("SPAN", "t-ct").replace("LINK", "t-cl") })}`, 320);
      const lines = [(await lineBoxes(driver, "s-ct")).length, (await lineBoxes(driver, "t-ct")).length];
      const small = await region(driver, "s");
      if (small === null) return { lines, region: null };
      const headEnd = async (id: string): Promise<number> => bottomOf(await driver.box(`${id}t-head`));
      const atRest = { lessThanTwice: small.y + small.clientHeight - (await headEnd("s")) < 2 * depth, below: small.scrollHeight - small.clientHeight > 1, blockFade: small.blockFade };
      const large = await must(driver, "t");
      const largeRest = { blockFade: large.blockFade, belowHead: fadeTop(large) >= (await headEnd("t")) - 0.5 };
      const capHeight = (await driver.box("st-cap")).height;
      await driver.setScrollTop(boxOf("s"), capHeight + 2 * room);
      const past = await must(driver, "s");
      const pastCaption = { pinned: near((await headOffset(driver, "s")) ?? -99, 0), blockFade: past.blockFade, belowHead: fadeTop(past) >= (await headEnd("s")) - 0.5 };
      const linkClear = async (): Promise<boolean> => {
        const ring = await ringOf(driver, "st-a0");
        const box = await must(driver, "s");
        return ring.top >= (await headEnd("s")) - 0.5 && ring.bottom <= box.y + box.clientHeight + 0.5;
      };
      await driver.setScrollTop(boxOf("s"), 0);
      await driver.focus("s-cl");
      await driver.pressTab();
      // At rest the row-1 link's ring box (27 px) is taller than the 19.4 px between the header's current block-end edge
      // and the client block end (spike-2 § 11), so the contract's fallback applies: its block-start edge at or below the
      // header's edge, the block-end fade off; the block-end edge cannot be inside the box there.
      const restRing = await ringOf(driver, "st-a0");
      const restBox = await must(driver, "s");
      const restHead = await headEnd("s");
      const restLink = {
        focused: await driver.focused(),
        taller: restRing.bottom - restRing.top > restBox.y + restBox.clientHeight - restHead,
        top: restRing.top >= restHead - 0.5,
        blockFade: restBox.blockFade,
      };
      await driver.setScrollTop(boxOf("s"), capHeight + 2 * room);
      await driver.focus("s-cl");
      await driver.setScrollTop(boxOf("s"), capHeight + 2 * room);
      await driver.pressTab();
      return { lines, atRest, largeRest, pastCaption, restLink, pastLink: { focused: await driver.focused(), clear: await linkClear() } };
    },
    expected: {
      lines: [2, 2],
      atRest: { lessThanTwice: true, below: true, blockFade: null },
      largeRest: { blockFade: "end", belowHead: true },
      pastCaption: { pinned: true, blockFade: "end", belowHead: true },
      restLink: { focused: "st-a0", taller: true, top: true, blockFade: null },
      pastLink: { focused: "st-a0", clear: true },
    },
  },
  {
    name: "US1-26 the caption link (Q-S2-1 (a), Q-A2 (a)) in a 300 px bound: tabbed to at rest, scrollTop unchanged at 0 and data-block-fade kept; partly scrolled out (2 to 12 px above the client edge, asserted first) its ring box comes to the client block-start edge within 0.5 px above the <thead>, hit at its centre, with no jump back; fully past it is shown whole above the <thead> (a platform-alone pair); the row-1 link cleared to the header's edge",
    run: async (driver) => {
      await page(driver, `${before}${sticky("t", 'data-bound="300"', { caption: '<span id="ct">Work packages<br>by <a id="cl" href="#c">owner</a></span>' })}`, 320);
      const box = await region(driver, "t");
      if (box === null) return { region: null };
      await tabToBox(driver);
      await driver.pressTab();
      const rest = { focused: await driver.focused(), scrollTop: await driver.scrollTop(boxOf("t")), inside: (await ringOf(driver, "cl")).top >= box.y - 0.5, blockFade: (await must(driver, "t")).blockFade };
      const linkAtRest = (await driver.box("cl")).y - box.y;
      const partly = Math.round(linkAtRest + 7);
      await driver.setScrollTop(boxOf("t"), partly);
      const above = box.y - (await driver.box("cl")).y;
      await driver.focus(boxOf("t"));
      const recorder = await driver.frameRecord(boxOf("t"), { property: "scrollTop" });
      await driver.pressTab();
      await driver.frames(5);
      const values = (await recorder.stop()).map(Number).filter((value) => !Number.isNaN(value));
      const ring = await ringOf(driver, "cl");
      const head = await driver.box("tt-head");
      const partlyScrolled = {
        precondition: above >= 2 && above <= 12,
        focused: await driver.focused(),
        lower: (await driver.scrollTop(boxOf("t"))) < partly,
        atEdge: near(ring.top, box.y),
        aboveHead: ring.bottom <= head.y + 0.5,
        hit: await hitAtCentre(driver, "cl"),
        noJumpBack: values.every((value, index) => index === 0 || value <= (values[index - 1] ?? value)),
      };
      await driver.setScrollTop(boxOf("t"), (await driver.box("tt-cap")).height + 2 * room + 40);
      await driver.focus(boxOf("t"));
      await driver.pressTab();
      const whole = await driver.box("cl");
      const fullyPast = { focused: await driver.focused(), shown: whole.y >= box.y - 0.5 && bottomOf(whole) <= (await driver.box("tt-head")).y + 0.5, hit: await hitAtCentre(driver, "cl") };
      await driver.setScrollTop(boxOf("t"), 60);
      await driver.focus("cl");
      await driver.setScrollTop(boxOf("t"), 60);
      await driver.pressTab();
      const rowLink = { focused: await driver.focused(), below: (await ringOf(driver, "tt-a0")).top >= bottomOf(await driver.box("tt-head")) - 0.5 };
      return { rest, partlyScrolled, fullyPast, rowLink };
    },
    expected: {
      rest: { focused: "cl", scrollTop: 0, inside: true, blockFade: "end" },
      partlyScrolled: { precondition: true, focused: "cl", lower: true, atEdge: true, aboveHead: true, hit: "cl", noJumpBack: true },
      fullyPast: { focused: "cl", shown: true, hit: "cl" },
      rowLink: { focused: "tt-a0", below: true },
    },
  },
  {
    name: "US1-27: at 320 px in the inline middle and at the block start, data-fade both and data-block-fade end together with mask-composite add, add, intersect, add; a link in the faded rows after pressTab has its ring box above the fade's edge and below the header row",
    run: async (driver) => {
      await page(driver, sticky("s", 'data-bound="300"', { ident: true }), 320);
      const read = await region(driver, "s");
      if (read === null) return { region: null };
      await driver.setScrollLeft(boxOf("s"), Math.round((read.scrollWidth - read.clientWidth) / 2));
      const middle = await must(driver, "s");
      const both = { fade: middle.fade, blockFade: middle.blockFade, composite: layers(await driver.computed(boxOf("s"), "mask-composite")) };
      let faded = -1;
      for (let r = 0; r < 20; r++) {
        if (bottomOf(await driver.box(`st-a${String(r)}`)) + room > fadeTop(middle)) {
          faded = r;
          break;
        }
      }
      await driver.focus(`st-a${String(Math.max(faded - 1, 0))}`);
      await driver.setScrollTop(boxOf("s"), 0);
      await driver.pressTab();
      const now = await must(driver, "s");
      const ring = await ringOf(driver, `st-a${String(faded)}`);
      return { both, found: faded > 0, focused: (await driver.focused()) === `st-a${String(faded)}`, clear: ring.bottom <= fadeTop(now) + 0.5 && now.blockFade === "end", belowHead: ring.top >= bottomOf(await driver.box("st-head")) - 0.5 };
    },
    expected: { both: { fade: "both", blockFade: "end", composite: ["add", "add", "intersect", "add"] }, found: true, focused: true, clear: true, belowHead: true },
  },
  {
    name: "US1-28: in forced colours no mask; .region-edge.block-end's border-block-end CanvasText wider than 0 and as wide as the frame at the block start, none at the block end; outside forced colours its inline size 0",
    run: async (driver) => {
      await page(driver, sticky("s", 'data-bound="300"'));
      const outside = await safe(async () => (await driver.box("s", ".region-edge.block-end")).width);
      await driver.forcedColors("active", "light");
      const canvasText = await driver.resolveColour("CanvasText");
      const read = async (): Promise<unknown> =>
        safe(async () => ({
          mask: await driver.computed(boxOf("s"), "mask-image"),
          colour: (await driver.shadowComputed("s", ".region-edge.block-end", "border-bottom-color")) === canvasText,
          style: await driver.shadowComputed("s", ".region-edge.block-end", "border-bottom-style"),
          wide: Number.parseFloat(await driver.shadowComputed("s", ".region-edge.block-end", "border-bottom-width")) > 0,
          full: near((await driver.box("s", ".region-edge.block-end")).width, (await driver.box("s", ".region-frame")).width),
        }));
      const start = await read();
      await safe(() => driver.setScrollTop(boxOf("s"), 5000));
      const end = await safe(async () => driver.shadowComputed("s", ".region-edge.block-end", "border-bottom-style"));
      await driver.forcedColors("none");
      return { outside, start, end };
    },
    expected: { outside: 0, start: { mask: "none", colour: true, style: "solid", wide: true, full: true }, end: "none" },
  },
  {
    name: "block-end fade edge cases: sticky-header removed, no data-block-fade; with no <thead> the room is measured from the box's block start (a 70 px bound fades, the same bound with a header does not); no bound, no fade",
    run: async (driver) => {
      await page(driver, `${sticky("a", 'data-bound="300"')}${sticky("n", 'data-bound="70"', { head: false, caption: "" })}${sticky("h", 'data-bound="70"', { caption: "" })}${sticky("u", "")}`);
      const first = field(await region(driver, "a"), "blockFade");
      await driver.setAttribute("a", "sticky-header", null);
      await driver.settle();
      return { first, removed: field(await region(driver, "a"), "blockFade"), noHead: field(await region(driver, "n"), "blockFade"), withHead: field(await region(driver, "h"), "blockFade"), unbounded: field(await region(driver, "u"), "blockFade") };
    },
    expected: { first: "end", removed: null, noHead: "end", withHead: null, unbounded: null },
  },
  {
    name: "R-13 rendered grounds in light and dark: the pinned header cells on --ocelle-color-sheet, the stripe on --ocelle-color-inset and the hovered row on --ocelle-color-hover-bg, against their probe-resolved tokens",
    run: async (driver) => {
      await page(driver, dt("s", 'sticky-header striped label="Work packages" data-bound="300"', usTable("t", { rows: 6, ident: false })));
      const read = async (theme: Palette): Promise<unknown> => {
        await grounds(driver, theme, []);
        await driver.hover("t-c3-1");
        const out = { head: await groundTokens(driver, ["t-h0"], ["color-sheet"]), stripe: await groundTokens(driver, ["t-c1-1"], ["color-inset"]), hover: await groundTokens(driver, ["t-c3-1"], ["color-hover-bg"]) };
        await driver.hover(null);
        return out;
      };
      return { light: await read("light"), dark: await read("dark") };
    },
    expected: (() => {
      const each = { head: ["color-sheet"], stripe: ["color-inset"], hover: ["color-hover-bg"] };
      return { light: each, dark: each };
    })(),
  },
];

/** Every shared data-table body, run by both harnesses. */
export const dataTableScenarios: readonly DataTableScenario[] = [...us1, ...captions, ...sizing, ...edges, ...stickyBodies];

/**
 * US1-24's no-hover half (re-analysis A2 (a)), run only in the touch context (test/data-table.touch.test.ts and
 * test/browser/data-table.touch.test.ts): `device().hover` false first, then a tap on a striped table's even-row cell
 * and a hover on an odd row's: no cell of either row on --ocelle-color-hover-bg, the even row's cells on
 * --ocelle-color-inset; under forced colours the tapped row's band CanvasText (its stripe), not Highlight.
 */
export const dataTableTouchScenarios: readonly Scenario[] = [
  {
    name: "US1-24 no hover (A2 (a)): on a device that cannot hover, a tapped even row and a hovered odd row paint no hover ground, the even row keeps --ocelle-color-inset; in forced colours the tapped row's band is CanvasText, not Highlight",
    run: async (driver) => {
      await page(driver, dt("dt", "striped", usTable("t", { rows: 4, ident: false })));
      // In the dark theme, where hover-bg differs from inset (in light they are equal, Q-I2).
      await driver.theme("dark");
      const hover = (await driver.device()).hover;
      await driver.touchTap("t-c1-1");
      await driver.hover("t-c2-1");
      const even = await groundTokens(driver, ["t-c1-0", "t-c1-1"], ["color-hover-bg", "color-inset"]);
      const odd = await groundTokens(driver, ["t-c2-0", "t-c2-1"], ["color-hover-bg", "color-inset"]);
      await driver.theme(null);
      await driver.forcedColors("active", "light");
      const colours: Record<string, string> = { [await driver.resolveColour("CanvasText")]: "CanvasText", [await driver.resolveColour("Highlight")]: "Highlight", [await driver.resolveColour("Canvas")]: "Canvas" };
      await driver.touchTap("t-c1-1");
      const band = colours[await driver.computed("t-c1-0", "border-left-color")] ?? "other";
      const width = Number.parseFloat(await driver.computed("t-c1-0", "border-left-width")) > 0;
      await driver.forcedColors("none");
      return { hover, even, odd, band, width };
    },
    expected: { hover: false, even: ["color-inset", "color-inset"], odd: ["none", "none"], band: "CanvasText", width: true },
  },
];

/** The before-upgrade markup: the US1 table in an `ocelle-data-table` that is not defined. */
export const beforeUpgradeMarkup = `${dt("dt", 'label="Work packages"', usTable("t"))}${probe}`;

/**
 * Before upgrade (US1 edge case): the table is styled by block 1 with no region: compact cells and eyebrow headers,
 * the element not defined and no shadow root.
 */
export async function beforeUpgrade(driver: Driver): Promise<unknown> {
  await driver.settle();
  return {
    defined: await evaluate(driver, 'return customElements.get("ocelle-data-table") !== undefined || document.getElementById("dt").shadowRoot !== null;'),
    cell: await tokensOf(driver, "t-c0-1", { "padding-block-start": "space-1", "padding-inline-start": "space-2", color: "color-ink-soft" }),
    header: await tokensOf(driver, "t-h0", { "text-transform": "=uppercase", color: "color-eyebrow" }),
    shown: (await driver.box("t")).height > 0,
  };
}

export const beforeUpgradeExpected = {
  defined: false,
  cell: { "padding-block-start": "space-1", "padding-inline-start": "space-2", color: "color-ink-soft" },
  header: { "text-transform": "=uppercase", color: "color-eyebrow" },
  shown: true,
};
