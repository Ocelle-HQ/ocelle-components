// The shared bodies of User Story 1's browser scenarios, `ocelle-facts` and `ocelle-fact` (013 spec US1 scenarios 1 to
// 19; FR-003 to FR-014; research.md R-01 to R-03; data-model.md § `ocelle-facts`; contracts/checks.md § Oracles,
// § Extra scenario bodies; tasks.md T004, T004a, T005). Each body observes the page through the driver and returns one
// observation; each harness asserts it equals `expected`, written by hand from the spec, the data model and research.
// Lengths come from packages/tokens/src/source.ts through the token names the spec names (`rem()`), at the default
// 16 px root size: the threshold `calc(var(--ocelle-space-10) * 6)` is 384 px, the gaps `--ocelle-space-1`, `-3` and
// `-4`. Colours come from the token table of packages/tokens/test/expected.ts (`tokenColour`) and the forced-colours
// system colours of scenarios/icon.ts.
//
// Layouts are read after the driver's layout-settle wait (`layout`, R-02: at least 2 frames, then two equal frames),
// since the measure pass runs one frame after a `ResizeObserver` callback (operator decision "(a) Defer + 2-frame
// wait"). A sheet's arrangement is read from its terms' and definitions' boxes: "columns" when each definition is
// beside its term on the term's row, "stacked" when each is below its term at the same inline start.
//
// The round 3 content is the one phase 1's spike fixed for the 16 px margin (reviews/phase-1/spike.md § 9, research
// R-02): "Created by op" / "Ada Lovelace and Charles Babbage FRS" (one column at a measure of 322 px in a dialog at a
// 360 px viewport, two columns at 421.3 px, 432.8 px in process, after the widen), "Id" relabelled "Created by
// operator" with the same value (342.5 → 461.6 px), and the label "Created by the operator on duty today" with the
// value text "Ada" changed in place to "Ada Lovelace and Babbage" (298 → 479.7 px).
//
// Every "does not" outcome shares its body with the positive outcome it guards (contracts/checks.md § Scenario
// bodies). Every page gets `pageRules` (body margin 0, so the two harnesses agree; container widths; the hook values;
// the shrink-to-fit hosts of FR-009) after its mount.
import { source } from "../../../tokens/src/source.ts";
import { systemColours, tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, Palette } from "./driver.ts";

/** A facts scenario, and whether its page links `base.css` (the fixture's `facts-base.html`). */
export interface FactsScenario extends Scenario {
  readonly base?: boolean;
}

/** A token's declared value in packages/tokens/src/source.ts. */
function token(name: string): string {
  const found = source.find((each) => each.name === name);
  if (found === undefined || typeof found.value !== "string") throw new Error(`no single-valued token ${name}`);
  return found.value;
}

/** A rem token in CSS px at the default 16 px root size. */
function rem(name: string): number {
  const value = token(name);
  if (!value.endsWith("rem")) throw new Error(`${name} is not a rem length: ${value}`);
  return Number.parseFloat(value) * 16;
}

const space1 = rem("space-1");
const space3 = rem("space-3");
const space4 = rem("space-4");
/** The default threshold, `calc(var(--ocelle-space-10) * 6)` (R-02): 384 px. */
const threshold = rem("space-10") * 6;
const px = (value: number): string => `${String(value)}px`;

/** The 64-character identifier of US1-3. */
export const identifier = "0123456789abcdef".repeat(4);
/** The round 3 value (spike § 9). */
const named = "Ada Lovelace and Charles Babbage FRS";
const longLabel =
  "The person who created this record on behalf of the operator on duty, written out in full so that it runs across several lines of the label column";

/** A fact; `label` null leaves the attribute out. */
function fact(label: string | null, value: string, attributes = ""): string {
  return `<ocelle-fact${label === null ? "" : ` label="${label}"`}${attributes}>${value}</ocelle-fact>`;
}

function sheet(id: string, facts: readonly string[], attributes = ""): string {
  return `<ocelle-facts id="${id}"${attributes}>${facts.join("")}</ocelle-facts>`;
}

const three = [fact("Owner", "Ada Lovelace"), fact("Created", "2026-11-14"), fact("Status", "Running")];
const gridFour = [fact("Owner", "Ada Lovelace"), fact("Created", "2026-11-14"), fact("Status", "Running"), fact("Identifier", "abc-123")];
/** US1-18's content: the round 3 pair and a short one. */
const wideGrid = [fact("Created by op", named), fact("Status", "Running")];

/** The page rules every body adds after its mount. */
const pageRules = `
body { margin: 0; }
.w290 { inline-size: 290px; } .w300 { inline-size: 300px; } .w320 { inline-size: 320px; } .w450 { inline-size: 450px; }
.w600 { inline-size: 600px; } .w800 { inline-size: 800px; } .w1280 { inline-size: 1280px; } .w200 { inline-size: 200px; }
.hook-15 { --ocelle-facts-stack-below: 15rem; } .hook-40 { --ocelle-facts-stack-below: 40rem; }
.hook-invalid { --ocelle-facts-stack-below: 24 rem; } .hook-percent { --ocelle-facts-stack-below: 50%; } .hook-0 { --ocelle-facts-stack-below: 0; }
.float { float: left; } .flex { display: flex; }
.row { display: flex; inline-size: 600px; } .row > .fixed { flex: none; inline-size: 400px; block-size: 10px; }
.auto-grid { display: grid; grid-template-columns: auto auto; justify-content: start; } .auto-grid > .neighbour { inline-size: 300px; }
.auto-grid.w600 { inline-size: 600px; }
.other { inline-size: 40px; }
.sized { inline-size: 420px; } .sized-grid { inline-size: 800px; }
.w383 { inline-size: 383px; } .w384 { inline-size: 384px; } .w767 { inline-size: 767px; } .w768 { inline-size: 768px; }
.padded { padding-inline: 30px; border-inline: 5px solid; }
.ref { display: inline-block; white-space: nowrap; font-family: var(--ocelle-font-sans); font-size: var(--ocelle-font-size-fact); font-variant-numeric: var(--ocelle-figures); }
.painted { background-color: rgb(1, 2, 3); border: 1px solid rgb(4, 5, 6); }
`;

async function mount(driver: Driver, markup: string, base = false): Promise<void> {
  await driver.mount(markup, base ? { base: true } : {});
  await driver.rules(pageRules);
}

const close = (a: number, b: number, within = 0.5): boolean => Math.abs(a - b) <= within;

/** "columns", "stacked", or what else the sheet's term and definition boxes show. */
async function arrangement(driver: Driver, id: string): Promise<string> {
  const terms = await driver.boxes(id, "dt");
  const definitions = await driver.boxes(id, "dd");
  if (terms.length === 0 || terms.length !== definitions.length) return `${String(terms.length)} terms, ${String(definitions.length)} definitions`;
  const none: Box = { x: 0, y: 0, width: 0, height: 0, display: "absent" };
  const pairs = terms.map((term, at) => [term, definitions[at] ?? none] as const);
  if (pairs.every(([term, value]) => close(term.y, value.y, 1) && (value.x >= term.x + term.width - 0.5 || value.x + value.width <= term.x + 0.5))) return "columns";
  if (pairs.every(([term, value]) => value.y >= term.y + term.height - 0.5 && (close(term.x, value.x) || close(term.x + term.width, value.x + value.width)))) return "stacked";
  return "mixed";
}

/** The arrangement after the layout wait. */
async function settled(driver: Driver, id: string): Promise<string> {
  await driver.layout(id);
  return arrangement(driver, id);
}

/** The number of tracks of the sheet's `<dl>` (its computed `grid-template-columns`), 0 with no `<dl>`. */
async function tracks(driver: Driver, id: string): Promise<number> {
  const [list] = await driver.styles(id, "dl", ["grid-template-columns"]);
  const value = list?.["grid-template-columns"] ?? "none";
  return value === "none" || value === "" ? 0 : value.trim().split(/\s+/).length;
}

/** The grid sheet's cells: the `<div>` groups of its `<dl>`, by row (block start) and column (inline start, left to right). */
async function cells(driver: Driver, id: string): Promise<{ rows: number; columns: number; boxes: Box[] }> {
  const boxes = await driver.boxes(id, "dl > div");
  const rows = new Set(boxes.map((each) => Math.round(each.y))).size;
  const columns = new Set(boxes.map((each) => Math.round(each.x))).size;
  return { rows, columns, boxes };
}

/** The column count after the layout wait: the `<dl>`'s tracks. */
async function gridColumns(driver: Driver, id: string): Promise<number> {
  await driver.layout(id);
  return tracks(driver, id);
}

/**
 * The sheet's accessibility subtree as a list: the description list, each term and definition with its name, each
 * text and link; generic nodes left out.
 */
async function list(driver: Driver, id: string): Promise<string[]> {
  const kept = ["DescriptionList", "term", "definition", "StaticText", "link"];
  return (await driver.axSubtree(id))
    .filter((node) => kept.includes(node.role))
    .map((node) => (node.role === "StaticText" ? `text ${node.name}` : node.name === "" ? node.role : `${node.role} ${node.name}`));
}

/** What list() gives for one description list of `pairs` (label, value): each term with its text, then its definition with its value's text. */
function listOf(pairs: readonly (readonly [string, string])[]): string[] {
  return ["DescriptionList", ...pairs.flatMap(([label, value]) => [...(label === "" ? ["term"] : [`term ${label}`, `text ${label}`]), "definition", ...(value === "" ? [] : [`text ${value}`])])];
}

/** The `<dl>`'s element children, by local name. */
async function listChildren(driver: Driver, id: string): Promise<string[]> {
  return (await driver.structure(id, "dl")).map((node) => (node.children.length === 0 || node.name !== "div" ? node.name : `${node.name}[${node.children.map((child) => child.name).join(" ")}]`));
}

const alternating = (pairs: number): string[] => Array.from({ length: pairs }, () => ["dt", "dd"]).flat();
const grouped = (pairs: number): string[] => Array.from({ length: pairs }, () => "div[dt dd]");

function intersect(a: Box, b: Box): boolean {
  return a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
}

function inside(inner: Box, outer: Box): boolean {
  return inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
}

/** The type read of US1-5: family, size, weight, colour and figures. */
const typeProperties = ["font-family", "font-size", "font-weight", "color", "font-variant-numeric"] as const;

/** One cell's geometry: the label above its value with the exact gap, aligned at the inline start. */
async function cellGeometry(driver: Driver, id: string): Promise<{ labelAbove: boolean[]; gaps: number[]; aligned: boolean[] }> {
  const groups = await driver.boxes(id, "dl > div");
  const terms = await driver.boxes(id, "dl > div > dt");
  const values = await driver.boxes(id, "dl > div > dd");
  return {
    labelAbove: groups.map((_, at) => (terms[at]?.y ?? 0) + (terms[at]?.height ?? 0) <= (values[at]?.y ?? -1) + 0.5),
    gaps: groups.map((_, at) => Math.round(((values[at]?.y ?? 0) - ((terms[at]?.y ?? 0) + (terms[at]?.height ?? 0))) * 100) / 100),
    aligned: groups.map((_, at) => close(terms[at]?.x ?? -1, values[at]?.x ?? -2)),
  };
}

/** The shrink-to-fit hosts of FR-009 and the space each offers at a 360 px viewport (body margin 0). */
const hosts = [
  { name: "a showModal() dialog", wrap: (inner: string) => `<dialog id="h">${inner}</dialog>`, open: true, offered: 322, wide: "columns" },
  { name: "a popover", wrap: (inner: string) => `<div id="h" popover="manual">${inner}</div>`, open: true, offered: 346, wide: "columns" },
  { name: "a float", wrap: (inner: string) => `<div id="h" class="float">${inner}</div>`, open: false, offered: 360, wide: "columns" },
  { name: "a default flex item", wrap: (inner: string) => `<div id="h" class="flex">${inner}</div>`, open: false, offered: 360, wide: "columns" },
  { name: "a flex row with a 400 px fixed sibling", wrap: (inner: string) => `<div id="h" class="row"><div class="fixed"></div>${inner}</div>`, open: false, offered: 200, wide: "stacked" },
  { name: "a grid auto track beside a 300 px neighbour", wrap: (inner: string) => `<div id="h" class="auto-grid">${inner}<div class="neighbour">Neighbour</div></div>`, open: false, offered: 60, wide: "columns" },
  { name: "a table cell", wrap: (inner: string) => `<table id="h"><tr><td>${inner}</td><td><div id="other" class="other">Other</div></td></tr></table>`, open: false, offered: undefined, wide: "columns" },
] as const;

/** Forced colours in one palette: the label's, the value's and a link's computed colour, each a system colour. */
async function forcedFacts(driver: Driver, palette: Palette): Promise<unknown> {
  await driver.forcedColors("active", palette);
  const [label] = await driver.styles("s", "dt", ["color"]);
  const [value] = await driver.styles("s", "dd", ["color"]);
  const link = await driver.computed("link", "color");
  await driver.forcedColors("none");
  return { label: label?.color, value: value?.color, link };
}

export const factsScenarios: readonly FactsScenario[] = [
  {
    name: "US1-1: three pairs in a 600 px block container are two columns, labels in the first and values in the second, rows in source order (FR-005)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", three)}</div>`);
      const layout = await settled(driver, "s");
      const terms = await driver.boxes("s", "dt");
      const values = await driver.boxes("s", "dd");
      return {
        layout,
        tracks: await tracks(driver, "s"),
        labelColumn: new Set(terms.map((each) => Math.round(each.x))).size,
        valueColumn: new Set(values.map((each) => Math.round(each.x))).size,
        labelsFirst: terms.every((term, at) => term.x + term.width <= (values[at]?.x ?? 0) + 0.5),
        sourceOrder: terms.every((term, at) => at === 0 || term.y > (terms[at - 1]?.y ?? 0)),
        list: await list(driver, "s"),
      };
    },
    expected: { layout: "columns", tracks: 2, labelColumn: 1, valueColumn: 1, labelsFirst: true, sourceOrder: true, list: listOf([["Owner", "Ada Lovelace"], ["Created", "2026-11-14"], ["Status", "Running"]]) },
  },
  {
    name: "US1-2: the same sheet in a 300 px block container is one column, each value below its label, with no overflow of the element or the page (FR-005, FR-009)",
    run: async (driver) => {
      await mount(driver, `<div class="w300">${sheet("s", three)}</div>`);
      const layout = await settled(driver, "s");
      const host = await driver.box("s");
      const values = await driver.boxes("s", "dd");
      return { layout, tracks: await tracks(driver, "s"), within: values.every((each) => inside(each, host)), scrollWidth: await driver.scrollWidth() };
    },
    expected: { layout: "stacked", tracks: 1, within: true, scrollWidth: 1280 },
  },
  {
    name: "US1-3: at 320 px the 64-character identifier with wrap=anywhere wraps inside its value box, which is the element's content-box width, one column, and the page scroll width is the viewport's (FR-005, FR-007, FR-009)",
    run: async (driver) => {
      await driver.viewport(320, 800);
      await mount(driver, sheet("s", [fact("Owner", "Ada Lovelace"), fact("Identifier", `<span id="value">${identifier}</span>`, ' id="id-fact" wrap="anywhere"')]));
      const layout = await settled(driver, "s");
      const [, value] = await driver.boxes("s", "dd");
      return { layout, hostWidth: (await driver.box("s")).width, valueWidth: value?.width, wrapped: (await driver.lines("value")).length > 1, scrollWidth: await driver.scrollWidth() };
    },
    expected: { layout: "stacked", hostWidth: 320, valueWidth: 320, wrapped: true, scrollWidth: 320 },
  },
  {
    name: "US1-4: a user copy of the wrapped identifier's value gives the identifier unchanged, with no inserted character, while it spans more than one line (FR-007)",
    run: async (driver) => {
      await driver.viewport(320, 800);
      await mount(driver, sheet("s", [fact("Identifier", `<span id="value">${identifier}</span>`, ' id="id-fact" wrap="anywhere"')]));
      await driver.layout("s");
      return { lines: (await driver.lines("value")).length > 1, copied: await driver.clipboardCopy("value"), layout: await arrangement(driver, "s") };
    },
    expected: { lines: true, copied: identifier, layout: "stacked" },
  },
  {
    name: "US1-5: values are font-sans at font-size-fact with tabular figures in ink, labels font-sans at font-size-sm, weight medium, in ink-muted, so size, weight and colour each differ; no monospace family (FR-006)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", [fact("Owner", '<span id="value">Ada 0123</span>')])}</div>`);
      await driver.layout("s");
      const [value] = await driver.styles("s", "dd", typeProperties);
      const [label] = await driver.styles("s", "dt", typeProperties);
      const families = (await driver.styles("s", "*", ["font-family"])).map((each) => each["font-family"] ?? "");
      return {
        value,
        slotted: await driver.computed("value", "font-size"),
        label: { family: label?.["font-family"], size: label?.["font-size"], weight: label?.["font-weight"], color: label?.color },
        differ: [label?.["font-size"] !== value?.["font-size"], label?.["font-weight"] !== value?.["font-weight"], label?.color !== value?.color],
        monospace: families.some((family) => /mono/i.test(family)),
        read: families.length > 0,
      };
    },
    expected: {
      value: { "font-family": token("font-sans"), "font-size": px(rem("font-size-fact")), "font-weight": token("font-weight-regular"), color: tokenColour("color-ink", "light"), "font-variant-numeric": token("figures") },
      slotted: px(rem("font-size-fact")),
      label: { family: token("font-sans"), size: px(rem("font-size-sm")), weight: token("font-weight-medium"), color: tokenColour("color-ink-muted", "light") },
      differ: [true, true, true],
      monospace: false,
      read: true,
    },
  },
  {
    name: "US1-6: three pairs are one description list of three terms and three definitions, each definition after its term with its own value; the shadow <dl>'s children are dt and dd alternating, one pair per fact (FR-004)",
    run: async (driver) => {
      await mount(driver, sheet("s", three));
      return { list: await list(driver, "s"), children: await listChildren(driver, "s") };
    },
    expected: { list: listOf([["Owner", "Ada Lovelace"], ["Created", "2026-11-14"], ["Status", "Running"]]), children: alternating(3) },
  },
  {
    name: "US1-7: a pair with an empty value keeps its label and an empty value box, and the list holds its term with an empty definition (FR-003)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", [fact("Owner", "Ada"), fact("Note", "")])}</div>`);
      const layout = await settled(driver, "s");
      const terms = await driver.boxes("s", "dt");
      const values = await driver.boxes("s", "dd");
      return { layout, boxes: [terms.length, values.length], labelShown: (terms[1]?.width ?? 0) > 0, list: await list(driver, "s") };
    },
    expected: { layout: "columns", boxes: [2, 2], labelShown: true, list: listOf([["Owner", "Ada"], ["Note", ""]]) },
  },
  {
    name: "US1-8: labels and values take the token colours, and under forced colours, in both palettes, CanvasText, with LinkText for a link in a value (FR-006)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", [fact("Owner", "Ada"), fact("Run", '<a id="link" href="#run">Run 42</a>')])}</div>`);
      await driver.layout("s");
      const [label] = await driver.styles("s", "dt", ["color"]);
      const [value] = await driver.styles("s", "dd", ["color"]);
      return { tokens: { label: label?.color, value: value?.color }, light: await forcedFacts(driver, "light"), dark: await forcedFacts(driver, "dark") };
    },
    expected: {
      tokens: { label: tokenColour("color-ink-muted", "light"), value: tokenColour("color-ink", "light") },
      light: { label: systemColours.light.CanvasText, value: systemColours.light.CanvasText, link: systemColours.light.LinkText },
      dark: { label: systemColours.dark.CanvasText, value: systemColours.dark.CanvasText, link: systemColours.dark.LinkText },
    },
  },
  {
    name: "US1-9 and the compact-region body: density=compact sets the row gap to space-1 (space-3 by default) and keeps 17 px values, still stacking below the threshold; in a compact region values are 14 px at 1.5, in a nested regular region 17 px at 1.45 (FR-008)",
    base: true,
    run: async (driver) => {
      await mount(
        driver,
        `<div class="w600">${sheet("plain", three)}${sheet("compact", three, ' density="compact"')}</div>` +
          `<div class="w300">${sheet("narrow", three, ' density="compact"')}</div>` +
          `<div data-ocelle-density="compact" class="w600">${sheet("region", three)}<div data-ocelle-density="regular">${sheet("nested", three)}</div></div>`,
        true,
      );
      const read = async (id: string): Promise<unknown> => {
        await driver.layout(id);
        const [list] = await driver.styles(id, "dl", ["row-gap"]);
        const [value] = await driver.styles(id, "dd", ["font-size", "line-height"]);
        return { layout: await arrangement(driver, id), rowGap: list?.["row-gap"], size: value?.["font-size"], lineHeight: value?.["line-height"] };
      };
      return { plain: await read("plain"), compact: await read("compact"), narrow: await read("narrow"), region: await read("region"), nested: await read("nested") };
    },
    expected: {
      plain: { layout: "columns", rowGap: px(space3), size: "17px", lineHeight: "24.65px" },
      compact: { layout: "columns", rowGap: px(space1), size: "17px", lineHeight: "24.65px" },
      narrow: { layout: "stacked", rowGap: px(space1), size: "17px", lineHeight: "24.65px" },
      region: { layout: "columns", rowGap: px(space3), size: "14px", lineHeight: "21px" },
      nested: { layout: "columns", rowGap: px(space3), size: "17px", lineHeight: "24.65px" },
    },
  },
  {
    name: "US1-10: pairs with no label and an empty label keep an empty label box in the label column and their values in the value column; the list holds empty terms each followed by its value (FR-003)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", [fact("Owner", "Ada"), fact(null, "No label"), fact("", "Empty label")])}</div>`);
      const layout = await settled(driver, "s");
      const terms = await driver.boxes("s", "dt");
      const values = await driver.boxes("s", "dd");
      return { layout, labelColumn: new Set(terms.map((each) => Math.round(each.x))).size, valueColumn: new Set(values.map((each) => Math.round(each.x))).size, list: await list(driver, "s") };
    },
    expected: { layout: "columns", labelColumn: 1, valueColumn: 1, list: listOf([["Owner", "Ada"], ["", "No label"], ["", "Empty label"]]) },
  },
  {
    name: "US1-11: layout (FR-013): a short sheet in a 1280 px dialog is one column unset and two columns with layout=columns, without page overflow; stacked in a 600 px block is one column; columns at 320 px is two columns with no page overflow; layout=table acts as unset; removing layout returns to automatic",
    run: async (driver) => {
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Owner", "Ada Lovelace")])}</dialog><div class="w600">${sheet("block", three, ' layout="stacked"')}</div>`);
      await driver.open("d");
      const unset = await settled(driver, "s");
      await driver.setAttribute("s", "layout", "columns");
      const columns = await settled(driver, "s");
      const scroll = await driver.scrollWidth();
      await driver.setAttribute("s", "layout", "table");
      const table = await settled(driver, "s");
      await driver.setAttribute("s", "layout", "columns");
      await settled(driver, "s");
      await driver.setAttribute("s", "layout", null);
      const removed = await settled(driver, "s");
      const stacked = await settled(driver, "block");
      await driver.setAttribute("block", "layout", "table");
      const blockTable = await settled(driver, "block");
      await driver.viewport(320, 800);
      await mount(driver, sheet("narrow", [fact("A very long label for a narrow page", identifier, ' wrap="anywhere"')], ' layout="columns"'));
      return { unset, columns, scroll, table, removed, stacked, blockTable, narrow: await settled(driver, "narrow"), narrowScroll: await driver.scrollWidth() };
    },
    expected: { unset: "stacked", columns: "columns", scroll: 1280, table: "stacked", removed: "stacked", stacked: "stacked", blockTable: "columns", narrow: "columns", narrowScroll: 320 },
  },
  {
    name: "US1-12, widen: the round 3 sheet in a dialog loaded at 360 px is one column, and widened to 1200 px two columns, as a fresh load at 1200 px (FR-005, FR-009)",
    run: async (driver) => {
      await driver.viewport(360, 800);
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Created by op", named)])}</dialog>`);
      await driver.open("d");
      const before = await settled(driver, "s");
      await driver.viewport(1200, 800);
      const after = await settled(driver, "s");
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Created by op", named)])}</dialog>`);
      await driver.open("d");
      return { before, after, fresh: await settled(driver, "s") };
    },
    expected: { before: "stacked", after: "columns", fresh: "columns" },
  },
  {
    name: "US1-12, relabel: the stacked sheet labelled Id in a 1280 px dialog, relabelled Created by operator, is two columns, as a fresh load (FR-005)",
    run: async (driver) => {
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Id", named, ' id="f"')])}</dialog>`);
      await driver.open("d");
      const before = await settled(driver, "s");
      await driver.setAttribute("f", "label", "Created by operator");
      const after = await settled(driver, "s");
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Created by operator", named)])}</dialog>`);
      await driver.open("d");
      return { before, after, fresh: await settled(driver, "s") };
    },
    expected: { before: "stacked", after: "columns", fresh: "columns" },
  },
  {
    name: "US1-12, value text: the stacked sheet in a 1280 px dialog, its value's text node changed in place to a longer text, is two columns, as a fresh load (FR-005)",
    run: async (driver) => {
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Created by the operator on duty today", "Ada", ' id="f"')])}</dialog>`);
      await driver.open("d");
      const before = await settled(driver, "s");
      await driver.text("f", "Ada Lovelace and Babbage");
      const after = await settled(driver, "s");
      await mount(driver, `<dialog id="d">${sheet("s", [fact("Created by the operator on duty today", "Ada Lovelace and Babbage")])}</dialog>`);
      await driver.open("d");
      return { before, after, fresh: await settled(driver, "s") };
    },
    expected: { before: "stacked", after: "columns", fresh: "columns" },
  },
  {
    name: "The measure pass owns the class: a 300 px stacked sheet resized to 290 px is still one column, one track with each value below its label (PLAN-FRESH-3-002)",
    run: async (driver) => {
      await mount(driver, `<div id="c" class="w300">${sheet("s", three)}</div>`);
      const before = await settled(driver, "s");
      await driver.style("c", "inline-size", "290px");
      return { before, after: await settled(driver, "s"), tracks: await tracks(driver, "s") };
    },
    expected: { before: "stacked", after: "stacked", tracks: 1 },
  },
  {
    name: "Unobserved change, two columns: in a 600 px consumer grid's auto track, the neighbour removed, a sheet with layout=columns and a sheet with an inline size are two columns after the change, and a fresh automatic load without the neighbour is two columns (FR-009, R-02)",
    run: async (driver) => {
      const observe = async (attributes: string): Promise<string> => {
        await mount(driver, `<div class="auto-grid w600">${sheet("s", [fact("Created by op", named)], attributes)}<div id="nb" class="neighbour">Neighbour</div></div>`);
        await driver.layout("s");
        await driver.setAttribute("nb", "hidden", "");
        return settled(driver, "s");
      };
      const columns = await observe(' layout="columns"');
      const sized = await observe(' class="sized"');
      await mount(driver, `<div class="auto-grid w600">${sheet("s", [fact("Created by op", named)])}</div>`);
      return { columns, sized, fresh: await settled(driver, "s") };
    },
    expected: { columns: "columns", sized: "columns", fresh: "columns" },
  },
  {
    name: "Unobserved change, grid: a layout=grid sheet with an 800 px inline size in a consumer grid's auto track at a 1000 px viewport, the neighbour removed, is four columns, and a fresh load without the neighbour is four columns (FR-009, FR-014, R-02)",
    run: async (driver) => {
      await driver.viewport(1000, 800);
      await mount(driver, `<div class="auto-grid">${sheet("s", wideGrid, ' layout="grid" class="sized-grid"')}<div id="nb" class="neighbour">Neighbour</div></div>`);
      await driver.layout("s");
      await driver.setAttribute("nb", "hidden", "");
      const after = await gridColumns(driver, "s");
      await mount(driver, `<div class="auto-grid">${sheet("s", wideGrid, ' layout="grid"')}</div>`);
      return { after, fresh: await gridColumns(driver, "s") };
    },
    expected: { after: 4, fresh: 4 },
  },
  {
    name: "US1-13: a grid sheet of four pairs in a 1280 px block is four equal cells in one row in source order, each label above its value at space-1, columns space-4 apart, no ground or border, one description list; the <dl> holds only div groups of one dt and one dd (FR-004, FR-014)",
    run: async (driver) => {
      await driver.viewport(1300, 800);
      await mount(driver, `<div class="w1280">${sheet("s", gridFour, ' layout="grid"')}<div id="painted" class="painted">Painted</div></div>`);
      const columns = await gridColumns(driver, "s");
      const { rows, boxes } = await cells(driver, "s");
      const widths = new Set(boxes.map((each) => Math.round(each.width * 100) / 100));
      const borders = ["background-color", "border-top-style", "border-right-style", "border-bottom-style", "border-left-style"];
      const painted = await driver.styles("s", "dl, dl > div, dt, dd", borders);
      const sibling = await driver.computed("painted", "background-color");
      return {
        columns,
        rows,
        equal: widths.size,
        sourceOrder: boxes.every((each, at) => at === 0 || each.x > (boxes[at - 1]?.x ?? 0)),
        columnGap: Math.round(((boxes[1]?.x ?? 0) - ((boxes[0]?.x ?? 0) + (boxes[0]?.width ?? 0))) * 100) / 100,
        ...(await cellGeometry(driver, "s")),
        unpainted: painted.length > 0 && painted.every((each) => each["background-color"] === "rgba(0, 0, 0, 0)" && borders.slice(1).every((side) => each[side] === "none")),
        sibling: [sibling, await driver.computed("painted", "border-top-style")],
        children: await listChildren(driver, "s"),
        list: await list(driver, "s"),
      };
    },
    expected: {
      columns: 4,
      rows: 1,
      equal: 1,
      sourceOrder: true,
      columnGap: space4,
      labelAbove: [true, true, true, true],
      gaps: [space1, space1, space1, space1],
      aligned: [true, true, true, true],
      unpainted: true,
      sibling: ["rgb(1, 2, 3)", "solid"],
      children: grouped(4),
      list: listOf([["Owner", "Ada Lovelace"], ["Created", "2026-11-14"], ["Status", "Running"], ["Identifier", "abc-123"]]),
    },
  },
  {
    name: "US1-14: the grid sheet in a 600 px block is two columns and two rows in source order, and at a 320 px viewport one column with no page overflow (FR-014)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", gridFour, ' layout="grid"')}</div>`);
      const two = await gridColumns(driver, "s");
      const at600 = await cells(driver, "s");
      const order = at600.boxes.map((each) => [Math.round(each.y), Math.round(each.x)]);
      await driver.viewport(320, 800);
      await mount(driver, sheet("s", gridFour, ' layout="grid"'));
      const one = await gridColumns(driver, "s");
      const at320 = await cells(driver, "s");
      return {
        two,
        rows600: at600.rows,
        rowByRow: order.length === 4 && order[0]?.[0] === order[1]?.[0] && order[2]?.[0] === order[3]?.[0] && (order[0]?.[1] ?? 0) < (order[1]?.[1] ?? 0) && (order[2]?.[0] ?? 0) > (order[0]?.[0] ?? 0),
        one,
        rows320: at320.rows,
        scrollWidth: await driver.scrollWidth(),
      };
    },
    expected: { two: 2, rows600: 2, rowByRow: true, one: 1, rows320: 4, scrollWidth: 320 },
  },
  {
    name: "US1-15: grid sheets of one, three and eight pairs at 1280 px keep four equal tracks: one cell in the first a quarter wide less the gaps, three in the first three, eight in two rows of four, no cell spanning (FR-014)",
    run: async (driver) => {
      await driver.viewport(1300, 800);
      const pairs = (count: number): string[] => Array.from({ length: count }, (_, at) => fact(`Label ${String(at + 1)}`, `Value ${String(at + 1)}`));
      await mount(driver, `<div class="w1280">${sheet("one", pairs(1), ' layout="grid"')}${sheet("three", pairs(3), ' layout="grid"')}${sheet("eight", pairs(8), ' layout="grid"')}</div>`);
      const track = (1280 - 3 * space4) / 4;
      const read = async (id: string): Promise<unknown> => {
        const columns = await gridColumns(driver, id);
        const { rows, boxes } = await cells(driver, id);
        return { columns, rows, cells: boxes.length, quarter: boxes.every((each) => close(each.width, track)) };
      };
      return { one: await read("one"), three: await read("three"), eight: await read("eight") };
    },
    expected: { one: { columns: 4, rows: 1, cells: 1, quarter: true }, three: { columns: 4, rows: 1, cells: 3, quarter: true }, eight: { columns: 4, rows: 2, cells: 8, quarter: true } },
  },
  {
    name: "US1-16: in a 600 px grid sheet, and at a 640 px viewport, a long label wraps between words in its cell and the wrap=anywhere identifier wraps in its cell; no cells intersect and the page does not scroll sideways (FR-007, FR-009, FR-014)",
    run: async (driver) => {
      const read = async (): Promise<unknown> => {
        await driver.layout("s");
        const { boxes } = await cells(driver, "s");
        const [, long] = await driver.boxes("s", "dl > div > dt");
        const [label] = await driver.styles("s", "dl > div:nth-child(2) > dt", ["overflow-wrap", "font-size"]);
        return {
          labelLines: (long?.height ?? 0) > Number.parseFloat(label?.["font-size"] ?? "1000") * 2,
          labelWraps: label?.["overflow-wrap"],
          labelInCell: long !== undefined && boxes[1] !== undefined && inside(long, boxes[1]),
          valueWrapped: (await driver.lines("value")).length > 1,
          valueInCell: boxes[2] !== undefined && inside(await driver.box("value"), boxes[2]),
          intersecting: boxes.some((a, at) => boxes.some((b, other) => other > at && intersect(a, b))),
          scrollWidth: await driver.scrollWidth(),
        };
      };
      const content = [fact("Owner", "Ada"), fact(longLabel, "Value"), fact("Identifier", `<span id="value">${identifier}</span>`, ' wrap="anywhere"'), fact("Status", "Running")];
      await mount(driver, `<div class="w600">${sheet("s", content, ' layout="grid"')}</div>`);
      const at600 = await read();
      await driver.viewport(640, 800);
      await mount(driver, sheet("s", content, ' layout="grid"'));
      return { at600, at640: await read() };
    },
    expected: {
      at600: { labelLines: true, labelWraps: "normal", labelInCell: true, valueWrapped: true, valueInCell: true, intersecting: false, scrollWidth: 1280 },
      at640: { labelLines: true, labelWraps: "normal", labelInCell: true, valueWrapped: true, valueInCell: true, intersecting: false, scrollWidth: 640 },
    },
  },
  {
    name: "US1-17: a grid sheet under dir=rtl in a 1280 px block puts the first cell at the right edge and the next ones towards the left, beside a left-to-right sheet whose first cell is at the left edge (FR-014)",
    run: async (driver) => {
      await driver.viewport(1300, 800);
      await mount(driver, `<div class="w1280">${sheet("ltr", gridFour, ' layout="grid"')}${sheet("rtl", gridFour, ' layout="grid" dir="rtl"')}</div>`);
      const read = async (id: string): Promise<unknown> => {
        const columns = await gridColumns(driver, id);
        const host = await driver.box(id);
        const { boxes } = await cells(driver, id);
        const first = boxes[0];
        return {
          columns,
          start: first === undefined ? "none" : close(first.x, host.x) ? "left" : close(first.x + first.width, host.x + host.width) ? "right" : "inside",
          towards: boxes.every((each, at) => at === 0 || (id === "rtl" ? each.x < (boxes[at - 1]?.x ?? 0) : each.x > (boxes[at - 1]?.x ?? 0))),
        };
      };
      return { ltr: await read("ltr"), rtl: await read("rtl") };
    },
    expected: { ltr: { columns: 4, start: "left", towards: true }, rtl: { columns: 4, start: "right", towards: true } },
  },
  {
    name: "US1-18: a grid sheet with the round 3 content in a dialog loaded at 360 px is one column, widened to 1280 px four columns, as a fresh load at 1280 px (FR-009, FR-014)",
    run: async (driver) => {
      await driver.viewport(360, 800);
      await mount(driver, `<dialog id="d">${sheet("s", wideGrid, ' layout="grid"')}</dialog>`);
      await driver.open("d");
      const before = await gridColumns(driver, "s");
      await driver.viewport(1280, 800);
      const after = await gridColumns(driver, "s");
      await mount(driver, `<dialog id="d">${sheet("s", wideGrid, ' layout="grid"')}</dialog>`);
      await driver.open("d");
      const fresh = await gridColumns(driver, "s");
      return { before, after, fresh, freshWidth: (await driver.box("s")).width >= 2 * threshold };
    },
    expected: { before: 1, after: 4, fresh: 4, freshWidth: true },
  },
  {
    name: "US1-19: grid values that are a link, a status text and Not recorded are shown as given, each inside its own cell below its label; the link stays a link; the sheet adds no text (FR-003, FR-011)",
    run: async (driver) => {
      await mount(
        driver,
        `<div class="w1280">${sheet("s", [fact("Run", '<a id="link" href="#run">Run 42</a>'), fact("Status", '<span id="status">Running</span>'), fact("Review", '<span id="unavailable">Not recorded</span>')], ' layout="grid"')}</div>`,
      );
      await driver.layout("s");
      const { boxes } = await cells(driver, "s");
      const terms = await driver.boxes("s", "dl > div > dt");
      const values = [await driver.box("link"), await driver.box("status"), await driver.box("unavailable")];
      return {
        inCells: values.map((each, at) => boxes[at] !== undefined && inside(each, boxes[at])),
        belowLabels: values.map((each, at) => each.y >= (terms[at]?.y ?? 0) + (terms[at]?.height ?? 0) - 0.5 && terms[at] !== undefined),
        list: await list(driver, "s"),
      };
    },
    expected: {
      inCells: [true, true, true],
      belowLabels: [true, true, true],
      list: ["DescriptionList", "term Run", "text Run", "definition", "link Run 42", "text Run 42", "term Status", "text Status", "definition", "text Running", "term Review", "text Review", "definition", "text Not recorded"],
    },
  },
  {
    name: "FR-011: a link in a value sits inside the value column, right of the label column, and stays a link in the list",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${sheet("s", [fact("Run", '<a id="link" href="#run">Run 42</a>')])}</div>`);
      await driver.layout("s");
      const [term] = await driver.boxes("s", "dt");
      const [value] = await driver.boxes("s", "dd");
      const link = await driver.box("link");
      return { inValue: value !== undefined && inside(link, value), rightOfLabel: term !== undefined && link.x >= term.x + term.width, list: await list(driver, "s") };
    },
    expected: { inValue: true, rightOfLabel: true, list: ["DescriptionList", "term Run", "text Run", "definition", "link Run 42", "text Run 42"] },
  },
  ...gridExtras(),
  ...factsExtras(),
];

/** The extra grid bodies of contracts/checks.md § Extra scenario bodies (T004a). */
function gridExtras(): FactsScenario[] {
  return [
    {
      name: "Grid extra: layout from grid to columns and back after render regroups the <dl> and re-assigns the slots, the list unchanged (FR-014)",
      run: async (driver) => {
        await mount(driver, `<div class="w1280">${sheet("s", gridFour, ' layout="grid"')}</div>`);
        await driver.layout("s");
        const grid = { children: await listChildren(driver, "s"), list: await list(driver, "s") };
        await driver.setAttribute("s", "layout", "columns");
        const columns = { children: await listChildren(driver, "s"), list: await list(driver, "s"), layout: await settled(driver, "s") };
        await driver.setAttribute("s", "layout", "grid");
        return { grid, columns, back: { children: await listChildren(driver, "s"), list: await list(driver, "s"), columns: await gridColumns(driver, "s") } };
      },
      expected: {
        grid: { children: grouped(4), list: listOf([["Owner", "Ada Lovelace"], ["Created", "2026-11-14"], ["Status", "Running"], ["Identifier", "abc-123"]]) },
        columns: { children: alternating(4), list: listOf([["Owner", "Ada Lovelace"], ["Created", "2026-11-14"], ["Status", "Running"], ["Identifier", "abc-123"]]), layout: "columns" },
        back: { children: grouped(4), list: listOf([["Owner", "Ada Lovelace"], ["Created", "2026-11-14"], ["Status", "Running"], ["Identifier", "abc-123"]]), columns: 4 },
      },
    },
    {
      name: "Grid extra: density=compact with layout=grid sets the row gap to space-1, the column gap unchanged at space-4, beside the default grid's space-3 (FR-008, FR-014)",
      run: async (driver) => {
        await mount(driver, `<div class="w600">${sheet("plain", gridFour, ' layout="grid"')}${sheet("compact", gridFour, ' layout="grid" density="compact"')}</div>`);
        const read = async (id: string): Promise<unknown> => {
          const columns = await gridColumns(driver, id);
          const { boxes } = await cells(driver, id);
          return {
            columns,
            rowGap: Math.round(((boxes[2]?.y ?? 0) - ((boxes[0]?.y ?? 0) + (boxes[0]?.height ?? 0))) * 100) / 100,
            columnGap: Math.round(((boxes[1]?.x ?? 0) - ((boxes[0]?.x ?? 0) + (boxes[0]?.width ?? 0))) * 100) / 100,
          };
        };
        return { plain: await read("plain"), compact: await read("compact") };
      },
      expected: { plain: { columns: 2, rowGap: space3, columnGap: space4 }, compact: { columns: 2, rowGap: space1, columnGap: space4 } },
    },
    {
      name: "Grid extra: a hidden fact in the grid gets no cell, the others keep source order (FR-003, FR-014)",
      run: async (driver) => {
        await mount(driver, `<div class="w1280">${sheet("s", [fact("Owner", "Ada"), fact("Hidden", "Gone", " hidden"), fact("Status", "Running")], ' layout="grid"')}</div>`);
        await driver.layout("s");
        return { children: await listChildren(driver, "s"), list: await list(driver, "s") };
      },
      expected: { children: grouped(2), list: listOf([["Owner", "Ada"], ["Status", "Running"]]) },
    },
    {
      name: "Grid extra: with the hook at 15rem a 600 px grid sheet is four columns (600 ≥ 2 × 240), beside the default hook's two (R-02)",
      run: async (driver) => {
        await mount(driver, `<div class="w600">${sheet("hooked", gridFour, ' layout="grid" class="hook-15"')}${sheet("plain", gridFour, ' layout="grid"')}</div>`);
        return { hooked: await gridColumns(driver, "hooked"), plain: await gridColumns(driver, "plain") };
      },
      expected: { hooked: 4, plain: 2 },
    },
  ];
}

/** The extra facts bodies of contracts/checks.md § Extra scenario bodies (T005). */
function factsExtras(): FactsScenario[] {
  return [
    {
      name: "No pairs (FR-010): an empty and a whitespace-only sheet render no sized box and expose no list, term or definition, with no error; one ocelle-fact added gives one list of one term and one definition",
      run: async (driver) => {
        await mount(driver, `${sheet("empty", [])}${sheet("blank", ["\n  \n"])}<ocelle-fact id="later" label="Owner">Ada</ocelle-fact>`);
        const sized = async (id: string): Promise<boolean> => (await driver.boxes(id, "*")).some((each) => each.width > 0 || each.height > 0) || (await driver.box(id)).height > 0;
        const before = { empty: [await sized("empty"), await list(driver, "empty")], blank: [await sized("blank"), await list(driver, "blank")] };
        await driver.move("later", "empty");
        return { before, after: await list(driver, "empty"), messages: await driver.messages() };
      },
      expected: { before: { empty: [false, []], blank: [false, []] }, after: listOf([["Owner", "Ada"]]), messages: [] },
    },
    {
      name: "A very long label in a 600 px two-column sheet: the label column is 50% of the content box, the label wraps between words, the value column takes the rest after the column gap, and a short pair shares the columns (FR-005)",
      run: async (driver) => {
        await mount(driver, `<div class="w600">${sheet("s", [fact(longLabel, "Long"), fact("Owner", "Ada")], ' layout="columns"')}</div>`);
        await driver.layout("s");
        const host = await driver.box("s");
        const terms = await driver.boxes("s", "dt");
        const values = await driver.boxes("s", "dd");
        const [label] = await driver.styles("s", "dt", ["overflow-wrap", "font-size"]);
        return {
          labelColumn: terms[0]?.width,
          lines: (terms[0]?.height ?? 0) > Number.parseFloat(label?.["font-size"] ?? "1000") * 2,
          wraps: label?.["overflow-wrap"],
          valueStart: Math.round(((values[0]?.x ?? 0) - host.x) * 100) / 100,
          valueWidth: values[0]?.width,
          shared: close(terms[1]?.x ?? -1, terms[0]?.x ?? -2) && close(values[1]?.x ?? -1, values[0]?.x ?? -2),
        };
      },
      expected: { labelColumn: 300, lines: true, wraps: "normal", valueStart: 300 + space4, valueWidth: 300 - space4, shared: true },
    },
    {
      name: "An unbroken 64-character value without wrap in a 600 px two-column sheet does not widen the value column: the column ends at the sheet's edge after the label column and the gap, a short pair shares it, and the value overflows its box (FR-005, FR-009 as qualified)",
      run: async (driver) => {
        await mount(driver, `<div class="w600">${sheet("s", [fact("Identifier", `<span id="value">${identifier}</span>`), fact("Owner", "Ada")], ' layout="columns"')}</div>`);
        const layout = await settled(driver, "s");
        const host = await driver.box("s");
        const terms = await driver.boxes("s", "dt");
        const values = await driver.boxes("s", "dd");
        const value = await driver.box("value");
        return {
          layout,
          valueEnd: Math.round(((values[0]?.x ?? 0) + (values[0]?.width ?? 0) - (host.x + host.width)) * 100) / 100,
          gap: Math.round(((values[0]?.x ?? 0) - ((terms[0]?.x ?? 0) + (terms[0]?.width ?? 0))) * 100) / 100,
          labelUnderHalf: (terms[0]?.width ?? 300) < 300,
          shared: close(values[1]?.x ?? -1, values[0]?.x ?? -2) && close(values[1]?.width ?? -1, values[0]?.width ?? -2),
          overflows: value.width > (values[0]?.width ?? Infinity),
        };
      },
      expected: { layout: "columns", valueEnd: 0, gap: space4, labelUnderHalf: true, shared: true, overflows: true },
    },
    {
      name: "Dynamic: a fact added, one removed, one moved to the end and a label changed each re-render the list in source order (FR-003, SPEC-2-06)",
      run: async (driver) => {
        await mount(driver, `${sheet("s", [fact("A", "1", ' id="a"'), fact("B", "2", ' id="b"')])}<div id="spare">${fact("C", "3", ' id="c"')}</div>`);
        const steps: unknown[] = [await list(driver, "s")];
        await driver.move("c", "s");
        steps.push(await list(driver, "s"));
        await driver.move("b", "spare");
        steps.push(await list(driver, "s"));
        await driver.move("a", "s");
        steps.push(await list(driver, "s"));
        await driver.setAttribute("a", "label", "Renamed");
        steps.push(await list(driver, "s"));
        return steps;
      },
      expected: [
        listOf([["A", "1"], ["B", "2"]]),
        listOf([["A", "1"], ["B", "2"], ["C", "3"]]),
        listOf([["A", "1"], ["C", "3"]]),
        listOf([["C", "3"], ["A", "1"]]),
        listOf([["C", "3"], ["Renamed", "1"]]),
      ],
    },
    {
      name: "Hidden facts: hidden at first render, hidden toggled on and off after render, and aria-hidden=true are no pairs; aria-hidden=false is one (FR-003)",
      run: async (driver) => {
        await mount(driver, sheet("s", [fact("A", "1"), fact("B", "2", ' id="b" hidden'), fact("C", "3", ' id="c"'), fact("D", "4", ' aria-hidden="true"'), fact("E", "5", ' aria-hidden="false"')]));
        const first = await list(driver, "s");
        await driver.setAttribute("c", "hidden", "");
        const toggled = await list(driver, "s");
        await driver.setAttribute("c", "hidden", null);
        await driver.setAttribute("b", "hidden", null);
        return { first, toggled, shown: await list(driver, "s"), children: await listChildren(driver, "s") };
      },
      expected: {
        first: listOf([["A", "1"], ["C", "3"], ["E", "5"]]),
        toggled: listOf([["A", "1"], ["E", "5"]]),
        shown: listOf([["A", "1"], ["B", "2"], ["C", "3"], ["E", "5"]]),
        children: alternating(4),
      },
    },
    {
      name: "lang and dir on a fact are carried to its term, and absent on a fact without them (FR-003, WCAG 3.1.2)",
      run: async (driver) => {
        await mount(driver, sheet("s", [fact("Référence", "Bonjour", ' lang="fr" dir="ltr"'), fact("Owner", "Ada")]));
        const terms = (await driver.elements("s")).filter((each) => each.name === "dt");
        return terms.map((each) => ({ lang: each.attributes.lang ?? null, dir: each.attributes.dir ?? null }));
      },
      expected: [{ lang: "fr", dir: "ltr" }, { lang: null, dir: null }],
    },
    {
      name: "Right-to-left columns: in a 600 px sheet under dir=rtl the labels are at the right edge and the values to their left, beside a left-to-right sheet with labels at the left edge (SPEC-2-08)",
      run: async (driver) => {
        await mount(driver, `<div class="w600">${sheet("ltr", three)}${sheet("rtl", three, ' dir="rtl"')}</div>`);
        const read = async (id: string): Promise<unknown> => {
          const layout = await settled(driver, id);
          const host = await driver.box(id);
          const [term] = await driver.boxes(id, "dt");
          const [value] = await driver.boxes(id, "dd");
          return {
            layout,
            label: term === undefined ? "none" : close(term.x, host.x) ? "left" : close(term.x + term.width, host.x + host.width) ? "right" : "inside",
            valueSide: term === undefined || value === undefined ? "none" : value.x < term.x ? "left" : "right",
          };
        };
        return { ltr: await read("ltr"), rtl: await read("rtl") };
      },
      expected: { ltr: { layout: "columns", label: "left", valueSide: "right" }, rtl: { layout: "columns", label: "right", valueSide: "left" } },
    },
    {
      name: "200% zoom: at a 640 px viewport the sheet with the wrap=anywhere identifier is two columns and the page does not scroll sideways (SPEC-2-05, FR-009)",
      run: async (driver) => {
        await driver.viewport(640, 800);
        await mount(driver, sheet("s", [...three, fact("Identifier", identifier, ' wrap="anywhere"')]));
        return { layout: await settled(driver, "s"), scrollWidth: await driver.scrollWidth() };
      },
      expected: { layout: "columns", scrollWidth: 640 },
    },
    {
      name: "A standalone ocelle-fact with wrap=anywhere shows its label above its value, the value breaking anywhere and the label between words, with no term or definition (edge case, FR-007)",
      run: async (driver) => {
        await mount(driver, `<div class="w200">${fact("A label of several words here", `<span id="value">${identifier}</span>`, ' id="f" wrap="anywhere"')}</div>`);
        const label = await driver.box("f", '[part="label"]');
        const value = await driver.box("value");
        const [labelStyle] = await driver.styles("f", '[part="label"]', ["overflow-wrap"]);
        return {
          labelAbove: label.height > 0 && label.y + label.height <= value.y + 0.5,
          valueWrapped: (await driver.lines("value")).length > 1,
          valueWithin: value.width <= 200.5,
          valueWraps: await driver.computed("value", "overflow-wrap"),
          labelWraps: labelStyle?.["overflow-wrap"],
          roles: (await driver.axSubtree("f")).filter((node) => node.role === "term" || node.role === "definition").length,
        };
      },
      expected: { labelAbove: true, valueWrapped: true, valueWithin: true, valueWraps: "anywhere", labelWraps: "normal", roles: 0 },
    },
    {
      name: "A standalone ocelle-fact without a label renders an empty label box above its value",
      run: async (driver) => {
        await mount(driver, `<div class="w200">${fact(null, '<span id="value">Ada</span>', ' id="f"')}</div>`);
        const label = await driver.box("f", '[part="label"]');
        return { label: [label.display, label.height], text: (await driver.axSubtree("f")).filter((node) => node.role === "StaticText").map((node) => node.name) };
      },
      expected: { label: ["block", 0], text: ["Ada"] },
    },
    {
      name: "aria-hidden, lang and dir changed on a fact after render: aria-hidden=true removes the pair and its removal brings it back; lang and dir reach the term (FR-003)",
      run: async (driver) => {
        await mount(driver, sheet("s", [fact("Owner", "Ada", ' id="a"'), fact("Status", "Running", ' id="b"')]));
        await driver.setAttribute("a", "aria-hidden", "true");
        const hidden = await list(driver, "s");
        await driver.setAttribute("a", "aria-hidden", null);
        const terms = async (): Promise<unknown> => (await driver.elements("s")).filter((each) => each.name === "dt").map((each) => ({ lang: each.attributes.lang ?? null, dir: each.attributes.dir ?? null }));
        await driver.setAttribute("b", "lang", "fr");
        const lang = await terms();
        await driver.setAttribute("b", "dir", "rtl");
        return { hidden, shown: await list(driver, "s"), lang, dir: await terms() };
      },
      expected: {
        hidden: listOf([["Status", "Running"]]),
        shown: listOf([["Owner", "Ada"], ["Status", "Running"]]),
        lang: [{ lang: null, dir: null }, { lang: "fr", dir: null }],
        dir: [{ lang: null, dir: null }, { lang: "fr", dir: "rtl" }],
      },
    },
    {
      name: "The measure is the content box: a sheet with 30 px inline padding and 5 px borders in a 450 px block (380 px content) is one column, beside one without them (two columns) (R-02)",
      run: async (driver) => {
        await mount(driver, `<div class="w450">${sheet("padded", three, ' class="padded"')}${sheet("plain", three)}</div>`);
        return { padded: await settled(driver, "padded"), plain: await settled(driver, "plain") };
      },
      expected: { padded: "stacked", plain: "columns" },
    },
    {
      name: "At the threshold: a sheet exactly 384 px wide is two columns and one 383 px wide one column; a grid sheet is two columns at 384 and 767 px, four at 768 px and one at 383 px (FR-005, FR-014)",
      run: async (driver) => {
        await mount(driver, ["w383", "w384", "w767", "w768"].map((width) => `<div class="${width}">${sheet(`two-${width}`, three)}${sheet(`grid-${width}`, gridFour, ' layout="grid"')}</div>`).join(""));
        const two: string[] = [];
        const grid: number[] = [];
        for (const width of ["w383", "w384", "w767", "w768"]) {
          two.push(await settled(driver, `two-${width}`));
          grid.push(await gridColumns(driver, `grid-${width}`));
        }
        return { two, grid };
      },
      expected: { two: ["stacked", "columns", "columns", "columns"], grid: [1, 2, 2, 4] },
    },
    {
      name: "A sheet moved to another container still follows its threshold hook: 15rem gives two columns at 450 px, 40rem then one column, with no resize (R-02)",
      run: async (driver) => {
        await mount(driver, `<div class="w450" id="first">${sheet("s", three, ' class="hook-15"')}</div><div class="w450" id="second"></div>`);
        await driver.layout("s");
        await driver.move("s", "second");
        const moved = await settled(driver, "s");
        await driver.setAttribute("s", "class", "hook-40");
        return { moved, changed: await settled(driver, "s") };
      },
      expected: { moved: "columns", changed: "stacked" },
    },
    {
      name: "A standalone fact moved into a sheet is one term with no label of its own, and moved out again shows its own label (PLAN-TESTABILITY-1-014)",
      run: async (driver) => {
        await mount(driver, `${sheet("s", [fact("First", "1")])}<div id="out">${fact("Owner", "Ada", ' id="f"')}</div>`);
        const outside = (await driver.box("f", '[part="label"]')).height > 0;
        await driver.move("f", "s");
        const inside = { list: await list(driver, "s"), label: (await driver.box("f", '[part="label"]')).display };
        await driver.move("f", "out");
        return { outside, inside, back: (await driver.box("f", '[part="label"]')).height > 0, list: await list(driver, "s") };
      },
      expected: { outside: true, inside: { list: listOf([["First", "1"], ["Owner", "Ada"]]), label: "absent" }, back: true, list: listOf([["First", "1"]]) },
    },
    {
      name: "A child that is not an ocelle-fact (a div, a raw dt, text) is neither shown nor exposed, beside the one fact that is (edge case)",
      run: async (driver) => {
        await mount(driver, sheet("s", ['<div id="stray">Stray</div>', '<dt id="raw">Raw</dt>', "Loose text", fact("Owner", "Ada")]));
        return { stray: (await driver.box("stray")).width, raw: (await driver.box("raw")).width, list: await list(driver, "s") };
      },
      expected: { stray: 0, raw: 0, list: listOf([["Owner", "Ada"]]) },
    },
    ...hosts.map((host) => ({
      name: `Shrink-to-fit host, ${host.name}: the round 3 sheet at a 360 px viewport is never 0 wide and at least the smaller of the offered space and its widest value; widened to 1200 px its layout is a fresh load's (FR-009)`,
      run: async (driver: Driver) => {
        const load = async (width: number): Promise<void> => {
          await driver.viewport(width, 800);
          await mount(driver, `${host.wrap(sheet("s", [fact("Created by op", named)]))}<span id="ref" class="ref">${named}</span>`);
          if (host.open) await driver.open("h");
        };
        await load(360);
        const at360 = await settled(driver, "s");
        const width = (await driver.box("s")).width;
        const offered = host.offered ?? 360 - (await driver.box("other")).width - 10;
        // Within 2 px: a shrink-to-fit grid track rounds the max-content to the layout unit (measured 321.5 against 322.6 px).
        const bound = width > 0 && width >= Math.min((await driver.box("ref")).width, offered) - 2;
        await driver.viewport(1200, 800);
        const widened = await settled(driver, "s");
        await load(1200);
        return { at360, bound, widened, fresh: await settled(driver, "s") };
      },
      expected: { at360: "stacked", bound: true, widened: host.wide, fresh: host.wide },
    })),
    {
      name: "Resize: a sheet resized 600 → 300 → 600 px is two columns, one column, two columns (R-02)",
      run: async (driver) => {
        await mount(driver, `<div id="c" class="w600">${sheet("s", three)}</div>`);
        const steps = [await settled(driver, "s")];
        await driver.style("c", "inline-size", "300px");
        steps.push(await settled(driver, "s"));
        await driver.style("c", "inline-size", "600px");
        steps.push(await settled(driver, "s"));
        return steps;
      },
      expected: ["columns", "stacked", "columns"],
    },
    {
      name: "Hook fallbacks: an invalid (24 rem), a percentage and a 0 hook at a 320 px viewport each give the default threshold, stacked, and the probes add no page overflow (R-02, PLAN-A11Y-SECURITY-1-004)",
      run: async (driver) => {
        await driver.viewport(320, 800);
        await mount(driver, `${sheet("invalid", three, ' class="hook-invalid"')}${sheet("percent", three, ' class="hook-percent"')}${sheet("zero", three, ' class="hook-0"')}${sheet("hooked", three, ' class="hook-15"')}`);
        return {
          invalid: await settled(driver, "invalid"),
          percent: await settled(driver, "percent"),
          zero: await settled(driver, "zero"),
          valid: await settled(driver, "hooked"),
          scrollWidth: await driver.scrollWidth(),
        };
      },
      expected: { invalid: "stacked", percent: "stacked", zero: "stacked", valid: "columns", scrollWidth: 320 },
    },
    {
      name: "Valid hooks: at 15rem a 300 px sheet is two columns and at 40rem a 600 px sheet one column, where the default gives the opposite (PLAN-FRESH-2-003)",
      run: async (driver) => {
        await mount(driver, `<div class="w300">${sheet("low", three, ' class="hook-15"')}${sheet("low-default", three)}</div><div class="w600">${sheet("high", three, ' class="hook-40"')}${sheet("high-default", three)}</div>`);
        return { low: await settled(driver, "low"), lowDefault: await settled(driver, "low-default"), high: await settled(driver, "high"), highDefault: await settled(driver, "high-default") };
      },
      expected: { low: "columns", lowDefault: "stacked", high: "stacked", highDefault: "columns" },
    },
    {
      name: "The hook changed at run time: a sheet held at 450 px is two columns at 15rem, one column at 40rem and two again at 15rem, with no resize of the sheet (PLAN-FRESH-2-004)",
      run: async (driver) => {
        await mount(driver, `<div class="w450">${sheet("s", three, ' class="hook-15"')}</div>`);
        const steps = [await settled(driver, "s")];
        const width = (await driver.box("s")).width;
        await driver.setAttribute("s", "class", "hook-40");
        steps.push(await settled(driver, "s"));
        await driver.setAttribute("s", "class", "hook-15");
        steps.push(await settled(driver, "s"));
        return { steps, width, same: (await driver.box("s")).width === width };
      },
      expected: { steps: ["columns", "stacked", "columns"], width: 450, same: true },
    },
    {
      name: "Unset properties write no attribute (density, layout; label, wrap), while set ones are reflected (PLAN-CORRECTNESS-1-011 (a))",
      run: async (driver) => {
        await mount(driver, sheet("s", [fact(null, "Ada", ' id="f"')]));
        const unset = { density: await driver.attribute("s", "density"), layout: await driver.attribute("s", "layout"), label: await driver.attribute("f", "label"), wrap: await driver.attribute("f", "wrap") };
        await driver.setProperty("s", "layout", "stacked");
        await driver.setProperty("s", "density", "compact");
        await driver.setProperty("f", "label", "Owner");
        await driver.setProperty("f", "wrap", "anywhere");
        return { unset, set: { density: await driver.attribute("s", "density"), layout: await driver.attribute("s", "layout"), label: await driver.attribute("f", "label"), wrap: await driver.attribute("f", "wrap") } };
      },
      expected: { unset: { density: null, layout: null, label: null, wrap: null }, set: { density: "compact", layout: "stacked", label: "Owner", wrap: "anywhere" } },
    },
  ];
}

/**
 * The flips of the no-loop-error test (T006a; contracts/checks.md § Oracles, "No ResizeObserver loop error"), each
 * step read with the layout wait: a block 600 → 300 → 600 px, the round 3 dialog widened 360 → 1200 px, the hook
 * 15rem → 40rem → 15rem at 450 px, a grid sheet 300 → 600 → 800 px. Returns what each step gave.
 */
export async function flips(driver: Driver): Promise<unknown> {
  await mount(driver, `<div id="c" class="w600">${sheet("s", three)}</div>`);
  const block = [await settled(driver, "s")];
  await driver.style("c", "inline-size", "300px");
  block.push(await settled(driver, "s"));
  await driver.style("c", "inline-size", "600px");
  block.push(await settled(driver, "s"));
  await driver.viewport(360, 800);
  await mount(driver, `<dialog id="d">${sheet("s", [fact("Created by op", named)])}</dialog>`);
  await driver.open("d");
  const dialog = [await settled(driver, "s")];
  await driver.viewport(1200, 800);
  dialog.push(await settled(driver, "s"));
  await driver.viewport(1280, 800);
  await mount(driver, `<div class="w450">${sheet("s", three, ' class="hook-15"')}</div>`);
  const hook = [await settled(driver, "s")];
  await driver.setAttribute("s", "class", "hook-40");
  hook.push(await settled(driver, "s"));
  await driver.setAttribute("s", "class", "hook-15");
  hook.push(await settled(driver, "s"));
  await mount(driver, `<div id="c" class="w300">${sheet("s", gridFour, ' layout="grid"')}</div>`);
  const grid = [await gridColumns(driver, "s")];
  await driver.style("c", "inline-size", "600px");
  grid.push(await gridColumns(driver, "s"));
  await driver.style("c", "inline-size", "800px");
  grid.push(await gridColumns(driver, "s"));
  return { block, dialog, hook, grid };
}

/** What flips() must give. */
export const flipsExpected = {
  block: ["columns", "stacked", "columns"],
  dialog: ["stacked", "columns"],
  hook: ["columns", "stacked", "columns"],
  grid: [1, 2, 4],
};
