// The shared bodies of User Story 2's browser scenarios, `ocelle-metric` (018 spec US2-1 to US2-7, FR-020 to FR-024,
// FR-042; research.md R-05; data-model.md § `ocelle-metric`; contracts/checks.md § US2 bodies and § Edge cases;
// tasks.md T024). Each body observes the page through the driver and returns one observation; each harness asserts it
// equals `expected`, written by hand from the spec, the data model and research:
// - the four eyebrow tokens of mission 011, used as merged (T001 (c); FR-042's second branch), and the figures and
//   family tokens, from the token table of packages/tokens/test/expected.ts, never from the element source: the
//   eyebrow's size and weight are their tokens' used values (12px, 600), its tracking `0.08em` of that size (0.96px),
//   its colour `color-eyebrow` per theme, the value's figures `tabular-nums` in `font-sans`, ink `color-ink`;
// - the gap of the row layout, `--ocelle-space-2`, 8 px (R-05);
// - Chromium's tree and find in page for the label's two copies as the phase-1 spike measured them on a stand-in
//   (reviews/phase-1/spikes.md § R-05): the term named by the written label, one text node under it, and two find
//   matches per label, the second in the zero-size written copy (the known limitation R-05 records).
//
// Every body mounts with base.css (the fixture's `metric.html` links it), so the body's ground follows the theme as on a
// host page; SC-001's metric row in scenarios/consumers.ts renders without it. Geometry is compared with twins on the
// same page rather than pinned in pixels: a text "on one line" has the box of the same text in a twin with room to
// spare; "broken" has a box at least twice as tall.
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named (contracts/
// checks.md § US2 bodies):
// - in a narrow flex row a one-word label and value are not broken, beside a 34-letter value in a narrow block that is
//   broken inside the metric and a host with `min-inline-size: 0` that is shrunk below its word (plants: `overflow-wrap:
//   anywhere` on `dt` and `dd`; the row's `min-inline-size: 0` on `dt` and `dd` removed);
// - markup in the strings is not parsed, beside the same strings' text shown;
// - an empty value adds no placeholder, beside a twin with a value, whose height it keeps;
// - an unknown `layout` is stacked, beside a `row` twin on one line;
// - a host `hidden` removes the metric's box, beside a visible twin (plant: `:host([hidden])` removed);
// - find in page matches a label twice, beside the same label written once outside the metric, which adds one match.
import { expectedTokens } from "../../../tokens/test/expected.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, Palette, TextBox } from "./driver.ts";

/** A token's used value as the token table writes it for its probe. */
function used(name: string): string {
  const entry = expectedTokens.find((each) => each.name === name);
  if (entry === undefined || typeof entry.compare !== "object" || typeof entry.compare.used !== "string") throw new Error(`no used text for ${name}`);
  return entry.compare.used;
}

/** A token's declared value, single-valued. */
function declared(name: string): string {
  const entry = expectedTokens.find((each) => each.name === name);
  if (entry === undefined || typeof entry.declared !== "string") throw new Error(`no single declared value for ${name}`);
  return entry.declared;
}

/** `--ocelle-font-size-eyebrow`'s used value: 12px. */
const eyebrowSize = used("font-size-eyebrow");
/** `--ocelle-tracking-eyebrow`, 0.08em, at the eyebrow's size: 0.96px. */
const eyebrowTracking = `${String(Math.round(Number.parseFloat(declared("tracking-eyebrow")) * Number.parseFloat(eyebrowSize) * 100) / 100)}px`;
/** `--ocelle-space-2`: 0.5rem at the 16 px root. */
const gap = Number.parseFloat(declared("space-2")) * 16;

const label = '[part="label"]';
const value = '[part="value"]';
const eyebrow = '[part="label"] .eyebrow';
const written = '[part="label"] .written';

const hundredth = (number: number): number => Math.round(number * 100) / 100 + 0;

/** The eyebrow's look in `theme`: the four eyebrow tokens, uppercase, in Schibsted Grotesk. */
function eyebrowLook(theme: Palette): Record<string, string> {
  return {
    "font-size": eyebrowSize,
    "font-weight": used("font-weight-eyebrow"),
    "letter-spacing": eyebrowTracking,
    color: tokenColour("color-eyebrow", theme),
    "text-transform": "uppercase",
    "font-family": used("font-sans"),
  };
}

/** The value's look in `theme`: tabular figures in Schibsted Grotesk, in ink. */
function valueLook(theme: Palette): Record<string, string> {
  return { "font-variant-numeric": used("figures"), "font-family": used("font-sans"), color: tokenColour("color-ink", theme) };
}

const eyebrowProperties = ["font-size", "font-weight", "letter-spacing", "color", "text-transform", "font-family"] as const;
const valueProperties = ["font-variant-numeric", "font-family", "color"] as const;

/** Mounts `markup` on a page with base.css, as a host page links it (the body's ground and colour scheme per theme). */
function mount(driver: Driver, markup: string): Promise<void> {
  return driver.mount(markup, { base: true });
}

/** The first computed record of `inner` in the shadow root of `id`. */
async function styleOf(driver: Driver, id: string, inner: string, properties: readonly string[]): Promise<Record<string, string> | string> {
  const [style] = await driver.styles(id, inner, properties);
  return style ?? `no ${inner}`;
}

/**
 * The metric's accessibility subtree as a list: the description list, each term and definition with its name, each
 * text; generic nodes left out (as scenarios/facts.ts reads a sheet).
 */
async function tree(driver: Driver, id: string): Promise<string[]> {
  const kept = ["DescriptionList", "term", "definition", "StaticText"];
  return (await driver.axSubtree(id))
    .filter((node) => kept.includes(node.role))
    .map((node) => (node.role === "StaticText" ? `text ${node.name}` : node.name === "" ? node.role : `${node.role} ${node.name}`));
}

/** What tree() gives for one metric of `name` and `shown`. */
function treeOf(name: string, shown: string): string[] {
  return ["DescriptionList", `term ${name}`, `text ${name}`, "definition", ...(shown === "" ? [] : [`text ${shown}`])];
}

/** How the label's and the value's boxes sit: stacked, label above and at the same inline start; in a row, on one line; else "other". */
function arrangement(term: Box, definition: Box, direction: "ltr" | "rtl" = "ltr"): string {
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;
  const start = (box: Box): number => (direction === "ltr" ? box.x : box.x + box.width);
  if (definition.y >= term.y + term.height - 0.5 && close(start(term), start(definition))) return "stacked";
  const overlap = definition.y < term.y + term.height && term.y < definition.y + definition.height;
  const first = direction === "ltr" ? term.x + term.width <= definition.x + 0.5 : definition.x + definition.width <= term.x + 0.5;
  if (overlap && first) return "row";
  return `other: label ${JSON.stringify(term)}, value ${JSON.stringify(definition)}`;
}

/** The label's and the value's arrangement in the metric `id`. */
async function arranged(driver: Driver, id: string, direction: "ltr" | "rtl" = "ltr"): Promise<string> {
  return arrangement(await driver.box(id, label), await driver.box(id, value), direction);
}

/** The text boxes of a metric: its visible label (the eyebrow), its written copy and its value, in that order. */
async function texts(driver: Driver, id: string): Promise<{ readonly eyebrow: TextBox | undefined; readonly value: TextBox | undefined }> {
  const boxes = await driver.textBoxes(id);
  return { eyebrow: boxes[0], value: boxes[2] };
}

/** Whether `box` is inside `outer`, to the half pixel. */
function inside(box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number } | undefined, outer: Box): boolean {
  return box !== undefined && box.x >= outer.x - 0.5 && box.x + box.width <= outer.x + outer.width + 0.5;
}

/** Whether `text` has the box of `twin` (one line, unbroken): the same width and height to the half pixel. */
function sameLine(text: TextBox | undefined, twin: TextBox | undefined): boolean {
  return text !== undefined && twin !== undefined && Math.abs(text.box.width - twin.box.width) <= 0.5 && Math.abs(text.box.height - twin.box.height) <= 0.5;
}

/** Whether `text` is broken over two lines or more, against its one-line `twin`. */
function broken(text: TextBox | undefined, twin: TextBox | undefined): boolean {
  return text !== undefined && twin !== undefined && text.box.height >= 2 * twin.box.height - 0.5;
}

/** A 34-letter word, with no break opportunity. */
const longWord = "Supercalifragilisticexpialidocious";
/** The long name beside the metric in US2-7's flex row. */
const longName = "Refactor the mission scheduler pipeline";
/**
 * US2-7's flex row, 220 px wide; the twin's flex row, 120 px, so that a host with `min-inline-size: 0` is shrunk below
 * its word in both layouts; the wide reference block; and the narrow block of the long-word twin.
 */
const flexRules = "#row, #row-shrink { display: flex; } #row { inline-size: 220px; } #row-shrink { inline-size: 120px; } #wide { inline-size: 1000px; } #narrow { inline-size: 100px; } #shrink { min-inline-size: 0; }";

export const metricScenarios: readonly Scenario[] = [
  ...(["light", "dark"] as const).map(
    (theme): Scenario => ({
      name: `US2-1: in ${theme}, with no layout the label is above the value at the same inline start, set in the four eyebrow tokens and shown uppercase, and the value in tabular figures in Schibsted Grotesk; the texts are shown as given (FR-021, FR-022, FR-023, FR-024)`,
      run: async (driver) => {
        await mount(driver, '<ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric>');
        await driver.theme(theme);
        return {
          arrangement: await arranged(driver, "m"),
          eyebrow: await styleOf(driver, "m", eyebrow, eyebrowProperties),
          writtenTransform: await styleOf(driver, "m", written, ["text-transform"]),
          value: await styleOf(driver, "m", value, valueProperties),
          shown: { eyebrow: await driver.textOf("m", eyebrow), written: await driver.textOf("m", written), value: await driver.textOf("m", value) },
          layout: await driver.property("m", "layout"),
        };
      },
      expected: {
        arrangement: "stacked",
        eyebrow: eyebrowLook(theme),
        writtenTransform: { "text-transform": "none" },
        value: valueLook(theme),
        shown: { eyebrow: "Open missions", written: "Open missions", value: "12" },
        layout: "stack",
      },
    }),
  ),
  {
    name: "US2-1: the shadow root is one description list holding one pair, a term with the aria-hidden eyebrow and the written copy, then a definition; the label's two copies take no room beside each other (R-05)",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric>');
      const parts = (await driver.elements("m")).map((part) => ({ name: part.name, part: part.attributes.part ?? null, class: part.attributes.class ?? null, hidden: part.attributes["aria-hidden"] ?? null }));
      const writtenBox = await driver.box("m", written);
      return { parts, writtenBox: [writtenBox.width, writtenBox.height] };
    },
    expected: {
      parts: [
        { name: "dl", part: null, class: "metric layout-stack", hidden: null },
        { name: "div", part: null, class: "pair", hidden: null },
        { name: "dt", part: "label", class: null, hidden: null },
        { name: "span", part: null, class: "eyebrow", hidden: "true" },
        { name: "span", part: null, class: "written", hidden: null },
        { name: "dd", part: "value", class: null, hidden: null },
      ],
      writtenBox: [0, 0],
    },
  },
  {
    name: "US2-2: Chromium's tree holds a term named \"Open missions\" as written, not uppercased, with one text node, followed by its definition \"12\", in the stacked and the row layout (FR-022, FR-024)",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="stack" label="Open missions" display-value="12"></ocelle-metric><ocelle-metric id="row" label="Open missions" display-value="12" layout="row"></ocelle-metric>');
      return { stack: await tree(driver, "stack"), row: await tree(driver, "row") };
    },
    expected: { stack: treeOf("Open missions", "12"), row: treeOf("Open missions", "12") },
  },
  {
    name: "US2-2: label and display-value set by property or attribute rename the term and change the definition at once, and reflect (FR-020)",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="m"></ocelle-metric>');
      await driver.setProperty("m", "label", "Queued");
      await driver.setProperty("m", "displayValue", "3");
      const set = { tree: await tree(driver, "m"), label: await driver.attribute("m", "label"), displayValue: await driver.attribute("m", "display-value") };
      await driver.setAttribute("m", "label", "Running");
      await driver.setAttribute("m", "display-value", "4 of 9");
      const changed = { tree: await tree(driver, "m"), label: await driver.property("m", "label"), displayValue: await driver.property("m", "displayValue"), shown: await driver.textOf("m", eyebrow) };
      return { set, changed };
    },
    expected: {
      set: { tree: treeOf("Queued", "3"), label: "Queued", displayValue: "3" },
      changed: { tree: treeOf("Running", "4 of 9"), label: "Running", displayValue: "4 of 9", shown: "Running" },
    },
  },
  {
    name: "US2-3: with layout=\"row\" the label and the value are on one line, the label first, 8 px apart (--ocelle-space-2); too narrow for both they wrap onto two lines inside the metric rather than overflow (FR-024)",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="m" label="Open missions" display-value="12" layout="row"></ocelle-metric><div id="tight"><ocelle-metric id="n" label="Open missions" display-value="1,234,567" layout="row"></ocelle-metric></div>');
      await driver.rules("#tight { inline-size: 120px; }");
      const term = await driver.box("m", label);
      const definition = await driver.box("m", value);
      const host = await driver.box("n");
      const narrowTerm = await driver.box("n", label);
      const narrowDefinition = await driver.box("n", value);
      return {
        row: arrangement(term, definition),
        gap: hundredth(definition.x - (term.x + term.width)),
        layout: await driver.property("m", "layout"),
        narrow: arrangement(narrowTerm, narrowDefinition),
        inside: inside(narrowTerm, host) && inside(narrowDefinition, host),
      };
    },
    expected: { row: "row", gap, layout: "row", narrow: "stacked", inside: true },
  },
  {
    name: "US2-4: display-value=\"<b>12</b>\" and label=\"<i>Open</i>\" are shown literally: no element is parsed in the term or the definition, and the tree reads the characters (FR-021)",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="m" label="&lt;i&gt;Open&lt;/i&gt;" display-value="&lt;b&gt;12&lt;/b&gt;"></ocelle-metric>');
      return {
        shown: { eyebrow: await driver.textOf("m", eyebrow), value: await driver.textOf("m", value) },
        valueChildren: await driver.structure("m", value),
        eyebrowChildren: await driver.structure("m", eyebrow),
        tree: await tree(driver, "m"),
      };
    },
    expected: { shown: { eyebrow: "<i>Open</i>", value: "<b>12</b>" }, valueChildren: [], eyebrowChildren: [], tree: treeOf("<i>Open</i>", "<b>12</b>") },
  },
  {
    name: "US2-5: with no display-value or an empty one the label is shown, the value is empty with no placeholder, and the metric keeps the height it has with a one-line value, beside that twin (FR-024)",
    run: async (driver) => {
      await mount(driver, 
        '<ocelle-metric id="none" label="Open missions"></ocelle-metric><ocelle-metric id="empty" label="Open missions" display-value=""></ocelle-metric>' +
          '<ocelle-metric id="twin" label="Open missions" display-value="12"></ocelle-metric><ocelle-metric id="row" label="Open missions" layout="row"></ocelle-metric>' +
          '<ocelle-metric id="row-twin" label="Open missions" display-value="12" layout="row"></ocelle-metric>',
      );
      const twin = await driver.box("twin");
      const twinValue = await driver.box("twin", value);
      const rowTwin = await driver.box("row-twin");
      const read = async (id: string, host: Box): Promise<unknown> => {
        const eyebrowBox = await driver.box(id, eyebrow);
        const box = await driver.box(id);
        const valueBox = await driver.box(id, value);
        return {
          value: await driver.textOf(id, value),
          valueChildren: await driver.structure(id, value),
          labelShown: eyebrowBox.width > 0 && eyebrowBox.height > 0,
          twinHeight: Math.abs(box.height - host.height) <= 0.01,
          valueHeight: Math.abs(valueBox.height - twinValue.height) <= 0.01,
        };
      };
      return {
        none: await read("none", twin),
        empty: await read("empty", twin),
        row: await read("row", rowTwin),
        trees: { none: await tree(driver, "none"), empty: await tree(driver, "empty") },
        twinValue: twinValue.height > 0,
      };
    },
    expected: {
      none: { value: "", valueChildren: [], labelShown: true, twinHeight: true, valueHeight: true },
      empty: { value: "", valueChildren: [], labelShown: true, twinHeight: true, valueHeight: true },
      row: { value: "", valueChildren: [], labelShown: true, twinHeight: true, valueHeight: true },
      trees: { none: treeOf("Open missions", ""), empty: treeOf("Open missions", "") },
      twinValue: true,
    },
  },
  {
    name: "US2-5, the label's twin: with no label or an empty one the term is empty and unnamed, no placeholder is added, and the value is still shown as its definition (FR-020, FR-021; mutation finding at phase 3)",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="none" display-value="12"></ocelle-metric><ocelle-metric id="empty" label="" display-value="12"></ocelle-metric>');
      const read = async (id: string): Promise<unknown> => ({ eyebrow: await driver.textOf(id, eyebrow), written: await driver.textOf(id, written), value: await driver.textOf(id, value), tree: await tree(driver, id) });
      return { none: await read("none"), empty: await read("empty") };
    },
    expected: {
      none: { eyebrow: "", written: "", value: "12", tree: ["DescriptionList", "term", "definition", "text 12"] },
      empty: { eyebrow: "", written: "", value: "12", tree: ["DescriptionList", "term", "definition", "text 12"] },
    },
  },
  {
    name: "US2-6: an unknown, miscased or empty layout stays in the attribute as written, the property reads stack and the metric is stacked, beside a row twin on one line; setting the property writes the attribute as given (FR-020; Edge Cases)",
    run: async (driver) => {
      await mount(driver, 
        '<ocelle-metric id="grid" label="Open" display-value="12" layout="grid"></ocelle-metric><ocelle-metric id="cased" label="Open" display-value="12" layout="Row"></ocelle-metric>' +
          '<ocelle-metric id="empty" label="Open" display-value="12" layout=""></ocelle-metric><ocelle-metric id="row" label="Open" display-value="12" layout="row"></ocelle-metric>',
      );
      const read = async (id: string): Promise<unknown> => ({ attribute: await driver.attribute(id, "layout"), property: await driver.property(id, "layout"), arrangement: await arranged(driver, id) });
      const attributes = { grid: await read("grid"), cased: await read("cased"), empty: await read("empty"), row: await read("row") };
      await driver.setProperty("grid", "layout", "row");
      const setRow = await read("grid");
      await driver.setProperty("grid", "layout", "columns");
      const setUnknown = await read("grid");
      return { attributes, setRow, setUnknown, messages: await driver.messages() };
    },
    expected: {
      attributes: {
        grid: { attribute: "grid", property: "stack", arrangement: "stacked" },
        cased: { attribute: "Row", property: "stack", arrangement: "stacked" },
        empty: { attribute: "", property: "stack", arrangement: "stacked" },
        row: { attribute: "row", property: "row", arrangement: "row" },
      },
      setRow: { attribute: "row", property: "row", arrangement: "row" },
      setUnknown: { attribute: "columns", property: "stack", arrangement: "stacked" },
      messages: [],
    },
  },
  ...(["stack", "row"] as const).map(
    (layout): Scenario => ({
      name: `US2-7, ${layout}: in a 220 px flex row beside a long name, a one-word label and value each stay on one line and the metric is at least its longest word wide; beside a 34-letter value in a 100 px block, broken inside the metric, and a host with min-inline-size: 0 in a 120 px flex row, narrower than its word with every character inside it (Edge Cases; PLAN-FRESH-2-002; plants: overflow-wrap: anywhere, the row's min-inline-size: 0 removed)`,
      run: async (driver) => {
        await mount(driver, 
          `<div id="row"><span>${longName}</span><ocelle-metric id="m" label="Open" display-value="12345" layout="${layout}"></ocelle-metric></div>` +
            `<div id="wide"><ocelle-metric id="w" label="Open" display-value="12345" layout="${layout}"></ocelle-metric><ocelle-metric id="lw" label="Open" display-value="${longWord}" layout="${layout}"></ocelle-metric></div>` +
            `<div id="narrow"><ocelle-metric id="long" label="Open" display-value="${longWord}" layout="${layout}"></ocelle-metric></div>` +
            `<div id="row-shrink"><span>${longName}</span><ocelle-metric id="shrink" label="Open" display-value="12345" layout="${layout}"></ocelle-metric></div>`,
        );
        await driver.rules(flexRules);
        const metric = await texts(driver, "m");
        const reference = await texts(driver, "w");
        const host = await driver.box("m");
        const longText = await texts(driver, "long");
        const longReference = await texts(driver, "lw");
        const longHost = await driver.box("long");
        const shrunk = await texts(driver, "shrink");
        const shrunkHost = await driver.box("shrink");
        const word = Math.max(reference.eyebrow?.box.width ?? 0, reference.value?.box.width ?? 0);
        return {
          flexRow: { labelOneLine: sameLine(metric.eyebrow, reference.eyebrow), valueOneLine: sameLine(metric.value, reference.value), atLeastWord: host.width >= word - 0.5 },
          longWord: { broken: broken(longText.value, longReference.value), valueInside: inside(longText.value?.box, longHost) && inside(await driver.box("long", value), longHost), hostWidth: hundredth(longHost.width) },
          minZero: { narrower: shrunkHost.width < word - 0.5, labelInside: inside(shrunk.eyebrow?.box, shrunkHost), valueInside: inside(shrunk.value?.box, shrunkHost) },
        };
      },
      expected: {
        flexRow: { labelOneLine: true, valueOneLine: true, atLeastWord: true },
        longWord: { broken: true, valueInside: true, hostWidth: 100 },
        minZero: { narrower: true, labelInside: true, valueInside: true },
      },
    }),
  ),
  {
    name: "US2-7, find in page: the browser's find matches a metric's label twice from the start of the page, the visible uppercase label and then the zero-size written copy (the known limitation, R-05), beside the same label written once outside the metric, which adds one match",
    run: async (driver) => {
      await mount(driver, '<ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric>');
      const alone = await driver.findInPage("Open missions");
      await mount(driver, '<ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric><p id="prose">Open missions are listed below.</p>');
      const withProse = await driver.findInPage("Open missions");
      const match = (each: { readonly holder: string; readonly text: string; readonly box: readonly [number, number] }): unknown => ({ holder: each.holder, text: each.text, zeroSize: each.box[0] === 0 && each.box[1] === 0 });
      return { alone: alone.map(match), withProse: withProse.map(match) };
    },
    expected: {
      alone: [
        { holder: ".eyebrow", text: "Open missions", zeroSize: false },
        { holder: ".written", text: "Open missions", zeroSize: true },
      ],
      withProse: [
        { holder: ".eyebrow", text: "Open missions", zeroSize: false },
        { holder: ".written", text: "Open missions", zeroSize: true },
        { holder: "#prose", text: "Open missions", zeroSize: false },
      ],
    },
  },
  ...(["light", "dark"] as const).map(
    (palette): Scenario => ({
      name: `Forced colours (${palette} palette): the label and the value are drawn in CanvasText, not the system background Canvas, in both layouts (Edge Cases)`,
      run: async (driver) => {
        await mount(driver, '<ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric><ocelle-metric id="r" label="Open missions" display-value="12" layout="row"></ocelle-metric>');
        await driver.forcedColors("active", palette);
        const canvasText = await driver.resolveColour("CanvasText");
        const canvas = await driver.resolveColour("Canvas");
        const colour = async (id: string, inner: string): Promise<unknown> => {
          const read = await driver.computed(id, "color", inner);
          return { colour: read === canvasText ? "CanvasText" : read, visible: read !== canvas };
        };
        return { label: await colour("m", eyebrow), value: await colour("m", value), rowLabel: await colour("r", eyebrow), rowValue: await colour("r", value) };
      },
      expected: {
        label: { colour: "CanvasText", visible: true },
        value: { colour: "CanvasText", visible: true },
        rowLabel: { colour: "CanvasText", visible: true },
        rowValue: { colour: "CanvasText", visible: true },
      },
    }),
  ),
  {
    name: "Right to left: under dir=\"rtl\" the stacked label and value share the inline start on the right, and in a row the label is first, on the right of the value (Edge Cases)",
    run: async (driver) => {
      await mount(driver, '<div id="area"><ocelle-metric id="m" label="Open missions" display-value="12"></ocelle-metric><ocelle-metric id="r" label="Open missions" display-value="12" layout="row"></ocelle-metric></div>');
      await driver.dir("area", "rtl");
      return { stack: await arranged(driver, "m", "rtl"), row: await arranged(driver, "r", "rtl"), rowTree: await tree(driver, "r") };
    },
    expected: { stack: "stacked", row: "row", rowTree: treeOf("Open missions", "12") },
  },
  {
    name: "Edge cases: a host hidden attribute removes the metric's box, beside its visible twin; the metric adds no tab stop (plant: :host([hidden]) removed)",
    run: async (driver) => {
      await mount(driver, '<button id="before">Before</button><ocelle-metric id="gone" hidden label="Open" display-value="12"></ocelle-metric><ocelle-metric id="shown" label="Open" display-value="12"></ocelle-metric><button id="after">After</button>');
      const box = (each: Box): unknown => ({ width: each.width > 0, height: each.height > 0, display: each.display });
      return { gone: box(await driver.box("gone")), shown: box(await driver.box("shown")), tabs: await driver.tabOrder() };
    },
    expected: { gone: { width: false, height: false, display: "none" }, shown: { width: true, height: true, display: "block" }, tabs: [["button#before"], ["button#after"]] },
  },
];
