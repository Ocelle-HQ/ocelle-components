// The shared bodies of User Story 2's browser scenarios, `ocelle-empty-state` (013 spec US2 scenarios 1 to 11; FR-020
// to FR-026; research.md R-04; data-model.md § `ocelle-empty-state`; contracts/checks.md § Bodies that the platform
// alone could pass, § Extra scenario bodies, § CSS-only behaviours; tasks.md T024, T024a). Each body observes the page
// through the driver and returns one observation; each harness asserts it equals `expected`, written by hand from the
// spec, the data model and research. Lengths come from packages/tokens/src/source.ts through the token names R-04
// names, at the default 16 px root size; colours from the token table of packages/tokens/test/expected.ts
// (`tokenColour`) and the forced-colours system colours of scenarios/icon.ts.
//
// The column is read from the boxes of the consumer's slotted elements, whose block margins the element sets to 0,
// against the host's border box: `start` is the block padding before the first present part, `gaps` the space between
// each two consecutive present parts, `end` the block padding after the last (R-04's table: the default variant's
// padding `--ocelle-space-6`, the panel's `--ocelle-space-10`). The default-slot area is the internal `.text` wrapper
// (FR-026, US2-11; analysis I2), never `part="body"`, which is the whole column.
//
// Every "does not" outcome shares its body with the positive outcome it guards (contracts/checks.md § Scenario
// bodies). Every page gets `pageRules` (body margin 0, so the two harnesses agree; container widths; the visual
// stand-ins; the probe of `--ocelle-measure-reading`) after its mount. Since phase 3 (tasks.md T039) US2-7's visual is a
// real `ocelle-progress`, whose inline size is read against the column and that probe, in the bar's own font context.
import { source } from "../../../tokens/src/source.ts";
import { systemColours, tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, Palette } from "./driver.ts";

/** An empty-state scenario, and whether its page links `base.css` (the fixture's `empty-state-base.html`). */
export interface EmptyStateScenario extends Scenario {
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

const space = (step: number): number => rem(`space-${String(step)}`);
const px = (value: number): string => `${String(value)}px`;

/** R-04's block padding: default `--ocelle-space-6`, panel `--ocelle-space-10`. */
const pad = { default: space(6), panel: space(10) };
/** R-04's table of gaps between adjacent present parts, default and panel. */
const gap = {
  default: { visual: space(3), eyebrowHeading: space(1), eyebrowNext: space(2), heading: space(2), text: space(4) },
  panel: { visual: space(5), eyebrowHeading: space(2), eyebrowNext: space(3), heading: space(3), text: space(6) },
};
/** FR-026's gap between the body's children, in both variants. */
const bodyGap = space(2);

/** The page rules every body adds after its mount. */
const pageRules = `
body { margin: 0; }
.w600 { inline-size: 600px; }
.mark { display: block; inline-size: 24px; block-size: 24px; }
.w400 { inline-size: 400px; }
.w1200 { inline-size: 1200px; }
.reading { display: block; inline-size: var(--ocelle-measure-reading); block-size: 1px; }
`;

async function mount(driver: Driver, markup: string, base = false): Promise<void> {
  await driver.mount(markup, base ? { base: true } : {});
  await driver.rules(pageRules);
}

const round = (value: number): number => Math.round(value * 100) / 100;
const centre = (box: Box): number => box.x + box.width / 2;
const bottom = (box: Box): number => box.y + box.height;

/** A slotted element by `id`, or an element in a host's shadow root as `[hostId, selector]`. */
type Target = string | readonly [string, string];

async function boxOf(driver: Driver, target: Target): Promise<Box> {
  return typeof target === "string" ? driver.box(target) : driver.box(target[0], target[1]);
}

/** The column of the empty state `host` through the present parts `parts`, in their expected order (above). */
async function column(driver: Driver, host: string, parts: readonly Target[]): Promise<{ start: number; gaps: number[]; end: number }> {
  const outer = await driver.box(host);
  const boxes = await Promise.all(parts.map((each) => boxOf(driver, each)));
  const first = boxes[0];
  const last = boxes[boxes.length - 1];
  if (first === undefined || last === undefined) throw new Error("column: no part");
  return {
    start: round(first.y - outer.y),
    gaps: boxes.slice(1).map((each, at) => round(each.y - bottom(boxes[at] ?? each))),
    end: round(bottom(outer) - bottom(last)),
  };
}

const spaced = (start: number, gaps: readonly number[], end = start): { start: number; gaps: readonly number[]; end: number } => ({ start, gaps, end });

/**
 * The accessibility subtree of `id` as a screen reader reads it, generic nodes left out: `<role>[ <level>][ <name>]`,
 * with static text as `text <name>`.
 */
async function reading(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id))
    .filter((node) => node.role !== "generic" && node.role !== "none")
    .map((node) => [node.role === "StaticText" ? "text" : node.role, node.level === undefined ? "" : String(node.level), node.name].filter((part) => part !== "").join(" "));
}

/** Whether `box` centres in the content box of the host's `part="body"` column, to half a pixel. */
async function centred(driver: Driver, host: string, box: Box): Promise<boolean> {
  const body = await driver.box(host, '[part="body"]');
  return body.width > 0 && Math.abs(centre(box) - centre(body)) <= 0.5;
}

const headingProperties = ["font-size", "font-weight", "color", "margin-block-start", "margin-block-end"] as const;
const eyebrowProperties = ["font-family", "font-size", "font-weight", "color", "text-transform", "margin-block-start", "margin-block-end"] as const;

async function computedOf(driver: Driver, id: string, properties: readonly string[]): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all(properties.map(async (property) => [property, await driver.computed(id, property)] as const)));
}

/** One empty state with a visual, a heading, a body paragraph and an action, each with an id from `prefix`. */
function full(id: string, prefix: string, attributes = ""): string {
  return (
    `<ocelle-empty-state id="${id}"${attributes}>` +
    `<span slot="visual" id="${prefix}v" class="mark"></span>` +
    `<h2 slot="heading" id="${prefix}h">No missions yet</h2>` +
    `<p id="${prefix}p">Missions you create appear here.</p>` +
    `<button slot="actions" id="${prefix}b" type="button">Create mission</button>` +
    `</ocelle-empty-state>`
  );
}

/** The heading, body and ground of an empty state of `full()`. */
async function look(driver: Driver, id: string, prefix: string): Promise<unknown> {
  const [part] = await driver.styles(id, '[part="body"]', ["background-color"]);
  return {
    column: await column(driver, id, [`${prefix}v`, `${prefix}h`, `${prefix}p`, `${prefix}b`]),
    heading: await computedOf(driver, `${prefix}h`, headingProperties),
    body: { color: await driver.computed(`${prefix}p`, "color"), "font-size": await driver.computed(`${prefix}p`, "font-size") },
    ground: { host: await driver.computed(id, "background-color"), part: part?.["background-color"] },
  };
}

const transparent = "rgba(0, 0, 0, 0)";

function lookExpected(variant: "default" | "panel"): unknown {
  const gaps = gap[variant];
  return {
    column: spaced(pad[variant], [gaps.visual, gaps.heading, gaps.text]),
    heading: {
      "font-size": px(rem("font-size-lg")),
      "font-weight": token(variant === "panel" ? "font-weight-medium" : "font-weight-strong"),
      color: tokenColour("color-ink", "light"),
      "margin-block-start": "0px",
      "margin-block-end": "0px",
    },
    body: { color: tokenColour("color-ink-muted", "light"), "font-size": px(rem("font-size-md")) },
    ground: { host: transparent, part: transparent },
  };
}

/** Forced colours in one palette: the heading's and the body's computed colour in each element. */
async function forcedText(driver: Driver, palette: Palette): Promise<unknown> {
  await driver.forcedColors("active", palette);
  const observed = {
    default: { heading: await driver.computed("dh", "color"), body: await driver.computed("dp", "color") },
    panel: { heading: await driver.computed("ph", "color"), body: await driver.computed("pp", "color") },
  };
  await driver.forcedColors("none");
  return observed;
}

const longHeading = "Nothing has been recorded for this mission yet, and the list will fill in as soon as the first run reports";
const longBody =
  "Runs appear here once an operator starts one from the mission page or the command line, and each run keeps its own record of what it did, what it read and what it wrote";

/** One eyebrow refusal block (US2-10): written in markup with the eyebrow after the heading. */
function refusal(id: string, prefix: string, attributes = ""): string {
  return (
    `<ocelle-empty-state id="${id}"${attributes}>` +
    `<h1 slot="heading" id="${prefix}h">Cannot open the mission</h1>` +
    `<p id="${prefix}p">The mission file is outside the workspace.</p>` +
    `<button slot="actions" id="${prefix}b" type="button">Back to missions</button>` +
    `<p slot="eyebrow" id="${prefix}y">Refused</p>` +
    `</ocelle-empty-state>`
  );
}

export const emptyStateScenarios: readonly EmptyStateScenario[] = [
  {
    name: "US2-1: with the consumer's markup written actions, body, heading, visual, the accessibility tree holds the level 3 heading, the paragraph and the button in slot order, and the element adds no heading, landmark or live region (FR-020, FR-024)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600"><ocelle-empty-state id="e">' +
          '<button slot="actions" id="b" type="button">Create mission</button>' +
          '<p id="p">Missions you create appear here.</p>' +
          '<h3 slot="heading" id="h">No missions yet</h3>' +
          '<span slot="visual" id="v" class="mark"></span>' +
          "</ocelle-empty-state></div>",
      );
      return reading(driver, "e");
    },
    expected: ["heading 3 No missions yet", "text No missions yet", "paragraph", "text Missions you create appear here.", "button Create mission", "text Create mission"],
  },
  {
    name: "US2-2: an <h2> stays a level 2 heading, laid out in the element's column: centred in part=body and below the visual written after it (FR-020)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600"><ocelle-empty-state id="e"><h2 slot="heading" id="h">No missions yet</h2><span slot="visual" id="v" class="mark"></span></ocelle-empty-state></div>',
      );
      const heading = await driver.box("h");
      const visual = await driver.box("v");
      return {
        heading: (await reading(driver, "e")).filter((each) => each.startsWith("heading")),
        centred: await centred(driver, "e", heading),
        belowVisual: visual.height > 0 && heading.y >= bottom(visual) - 0.5,
      };
    },
    expected: { heading: ["heading 2 No missions yet"], centred: true, belowVisual: true },
  },
  {
    name: "US2-3: the default variant has block padding space-6, gaps space-3 (visual to heading), space-2 (heading to body) and space-4 (body to actions), the heading at font-size-lg, weight strong (600), ink, no margin, the body ink-muted at font-size-md, and no ground (FR-021)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${full("e", "")}</div>`);
      return look(driver, "e", "");
    },
    expected: lookExpected("default"),
  },
  {
    name: "US2-4: variant=panel has block padding space-10 and gaps space-5, space-3 and space-6, each larger than the default's in the same page, and a heading at weight medium (500), lighter than the default's 600 (FR-022)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${full("d", "d")}${full("e", "", ' variant="panel"')}</div>`);
      const panel = await column(driver, "e", ["v", "h", "p", "b"]);
      const plain = await column(driver, "d", ["dv", "dh", "dp", "db"]);
      const weights = [Number(await driver.computed("h", "font-weight")), Number(await driver.computed("dh", "font-weight"))];
      return {
        panel: await look(driver, "e", ""),
        larger: [panel.start > plain.start, ...panel.gaps.map((each, at) => each > (plain.gaps[at] ?? Infinity)), panel.end > plain.end],
        lighter: (weights[0] ?? 0) < (weights[1] ?? 0),
      };
    },
    expected: { panel: lookExpected("panel"), larger: [true, true, true, true, true], lighter: true },
  },
  {
    name: "US2-5 and the present-parts bodies: without a body or actions, without a visual, with only actions, with only a heading, and with a visual and text, the first present part starts at the block padding, the last ends at it, and each gap is R-04's for its pair, in both variants (FR-023)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="a"><span slot="visual" id="av" class="mark"></span><h2 slot="heading" id="ah">No missions yet</h2></ocelle-empty-state>' +
          '<ocelle-empty-state id="b"><h2 slot="heading" id="bh">No missions yet</h2><p id="bp">Missions you create appear here.</p><button slot="actions" id="bb" type="button">Create mission</button></ocelle-empty-state>' +
          '<ocelle-empty-state id="c"><button slot="actions" id="cb" type="button">Create mission</button></ocelle-empty-state>' +
          '<ocelle-empty-state id="d"><h2 slot="heading" id="dh">No missions yet</h2></ocelle-empty-state>' +
          '<ocelle-empty-state id="e"><span slot="visual" id="ev" class="mark"></span><p id="ep">Missions you create appear here.</p></ocelle-empty-state>' +
          '<ocelle-empty-state id="pc" variant="panel"><button slot="actions" id="pcb" type="button">Create mission</button></ocelle-empty-state>' +
          '<ocelle-empty-state id="pe" variant="panel"><span slot="visual" id="pev" class="mark"></span><p id="pep">Missions you create appear here.</p></ocelle-empty-state>' +
          "</div>",
      );
      return {
        visualHeading: await column(driver, "a", ["av", "ah"]),
        noVisual: await column(driver, "b", ["bh", "bp", "bb"]),
        actionsOnly: await column(driver, "c", ["cb"]),
        headingOnly: await column(driver, "d", ["dh"]),
        visualText: await column(driver, "e", ["ev", "ep"]),
        panelActionsOnly: await column(driver, "pc", ["pcb"]),
        panelVisualText: await column(driver, "pe", ["pev", "pep"]),
      };
    },
    expected: {
      visualHeading: spaced(pad.default, [gap.default.visual]),
      noVisual: spaced(pad.default, [gap.default.heading, gap.default.text]),
      actionsOnly: spaced(pad.default, []),
      headingOnly: spaced(pad.default, []),
      visualText: spaced(pad.default, [gap.default.visual]),
      panelActionsOnly: spaced(pad.panel, []),
      panelVisualText: spaced(pad.panel, [gap.panel.visual]),
    },
  },
  {
    name: "US2-6: Tab reaches the slotted button with the token focus ring, from the button before the element to the one after it with no tab stop of the element's own; the button sits in the actions part, below the text, centred in the column (FR-024)",
    base: true,
    run: async (driver) => {
      await mount(
        driver,
        '<button id="before" type="button">Before</button>' +
          `<div class="w600"><ocelle-empty-state id="e"><h2 slot="heading" id="h">No missions yet</h2><p id="p">Missions you create appear here.</p><button slot="actions" id="b" type="button">Create mission</button></ocelle-empty-state></div>` +
          '<button id="after" type="button">After</button>',
        true,
      );
      const sequence: (string | null)[] = [];
      await driver.pressTab();
      sequence.push(await driver.focused());
      await driver.pressTab();
      sequence.push(await driver.focused());
      const ring = await computedOf(driver, "b", ["outline-style", "outline-width", "outline-color"]);
      await driver.pressTab();
      sequence.push(await driver.focused());
      const button = await driver.box("b");
      const text = await driver.box("p");
      return { sequence, ring, belowText: text.height > 0 && button.y >= bottom(text) - 0.5, centred: await centred(driver, "e", button) };
    },
    expected: {
      sequence: ["before", "b", "after"],
      ring: { "outline-style": "solid", "outline-width": token("focus-width"), "outline-color": tokenColour("color-focus", "light") },
      belowText: true,
      centred: true,
    },
  },
  {
    name: "US2-7: in variant=panel a slotted ocelle-progress sits above the heading at the panel's visual-to-heading gap, its inline size is the smaller of the column's and the reading measure (a 400 px column: the column; a 1200 px column: the measure), and the screen reader reaches the bar before the heading (FR-021, FR-022)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w400"><ocelle-empty-state id="e" variant="panel"><ocelle-progress slot="visual" id="v" label="Loading"></ocelle-progress><h2 slot="heading" id="h">Loading missions</h2></ocelle-empty-state></div>' +
          '<div class="w1200"><ocelle-empty-state id="w" variant="panel"><ocelle-progress slot="visual" id="wv" label="Loading"></ocelle-progress><h2 slot="heading" id="wh">Loading plans</h2></ocelle-empty-state><span id="measure" class="reading"></span></div>',
      );
      const measure = (await driver.box("measure")).width;
      const spans = async (host: string, bar: string): Promise<{ column: number; bar: number }> => {
        const body = await driver.box(host, '[part="body"]');
        const [padding] = await driver.styles(host, '[part="body"]', ["padding-inline-start", "padding-inline-end"]);
        const content = body.width - Number.parseFloat(padding?.["padding-inline-start"] ?? "0") - Number.parseFloat(padding?.["padding-inline-end"] ?? "0");
        return { column: content, bar: (await driver.box(bar)).width };
      };
      const narrow = await spans("e", "v");
      const wide = await spans("w", "wv");
      return {
        column: await column(driver, "e", ["v", "h"]),
        narrow: { columnNarrower: narrow.column > 0 && narrow.column < measure, bar: round(narrow.bar) === round(Math.min(narrow.column, measure)) },
        wide: { measureNarrower: measure > 0 && measure < wide.column, bar: round(wide.bar) === round(Math.min(wide.column, measure)) },
        reading: await reading(driver, "e"),
      };
    },
    expected: {
      column: spaced(pad.panel, [gap.panel.visual]),
      narrow: { columnNarrower: true, bar: true },
      wide: { measureNarrower: true, bar: true },
      reading: ["progressbar Loading", "heading 2 Loading missions", "text Loading missions"],
    },
  },
  {
    name: "US2-8: in both variants the heading is ink and the body ink-muted in light and dark, and under forced colours, in both palettes, both are CanvasText (FR-021)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${full("d", "d")}${full("p", "p", ' variant="panel"')}</div>`);
      const colours = async (): Promise<unknown> => ({
        default: { heading: await driver.computed("dh", "color"), body: await driver.computed("dp", "color") },
        panel: { heading: await driver.computed("ph", "color"), body: await driver.computed("pp", "color") },
      });
      const light = await colours();
      await driver.theme("dark");
      const dark = await colours();
      await driver.theme(null);
      return { light, dark, forcedLight: await forcedText(driver, "light"), forcedDark: await forcedText(driver, "dark") };
    },
    expected: {
      light: {
        default: { heading: tokenColour("color-ink", "light"), body: tokenColour("color-ink-muted", "light") },
        panel: { heading: tokenColour("color-ink", "light"), body: tokenColour("color-ink-muted", "light") },
      },
      dark: {
        default: { heading: tokenColour("color-ink", "dark"), body: tokenColour("color-ink-muted", "dark") },
        panel: { heading: tokenColour("color-ink", "dark"), body: tokenColour("color-ink-muted", "dark") },
      },
      forcedLight: {
        default: { heading: systemColours.light.CanvasText, body: systemColours.light.CanvasText },
        panel: { heading: systemColours.light.CanvasText, body: systemColours.light.CanvasText },
      },
      forcedDark: {
        default: { heading: systemColours.dark.CanvasText, body: systemColours.dark.CanvasText },
        panel: { heading: systemColours.dark.CanvasText, body: systemColours.dark.CanvasText },
      },
    },
  },
  {
    name: "US2-9 and the hidden-content bodies: an action slotted with hidden leaves the body last at the block padding, and removing hidden brings it below the body at the body-to-actions gap; a hidden only visual leaves the heading at the block padding; default-slot whitespace changed to words makes the text part present (FR-023)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="a"><h2 slot="heading" id="ah">No missions yet</h2><p id="ap">Missions you create appear here.</p><button slot="actions" id="ab" type="button" hidden>Create mission</button></ocelle-empty-state>' +
          '<ocelle-empty-state id="v"><div slot="visual" id="vv" class="mark" hidden></div><h2 slot="heading" id="vh">No missions yet</h2></ocelle-empty-state>' +
          '<ocelle-empty-state id="w"> <h2 slot="heading" id="wh">No missions yet</h2></ocelle-empty-state>' +
          "</div>",
      );
      const hidden = await column(driver, "a", ["ah", "ap"]);
      const hiddenVisual = await column(driver, "v", ["vh"]);
      const whitespace = await column(driver, "w", ["wh"]);
      await driver.setAttribute("ab", "hidden", null);
      await driver.text("w", "Missions you create appear here.");
      return {
        hidden,
        shown: await column(driver, "a", ["ah", "ap", "ab"]),
        hiddenVisual,
        whitespace,
        words: await column(driver, "w", ["wh", ["w", ".text"]]),
      };
    },
    expected: {
      hidden: spaced(pad.default, [gap.default.heading]),
      shown: spaced(pad.default, [gap.default.heading, gap.default.text]),
      hiddenVisual: spaced(pad.default, []),
      whitespace: spaced(pad.default, []),
      words: spaced(pad.default, [gap.default.heading]),
    },
  },
  {
    name: "No content and formatting whitespace: an element with no child is its block padding only (space-6 twice, panel space-10 twice), and runs of several whitespace characters (line breaks and indentation) around a heading make no text part (FR-023)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="none"></ocelle-empty-state>' +
          '<ocelle-empty-state id="panel" variant="panel"></ocelle-empty-state>' +
          '<ocelle-empty-state id="w">\n      <h2 slot="heading" id="wh">No missions yet</h2>\n    \t</ocelle-empty-state>' +
          "</div>",
      );
      return {
        none: round((await driver.box("none")).height),
        panel: round((await driver.box("panel")).height),
        formatted: await column(driver, "w", ["wh"]),
      };
    },
    expected: { none: 2 * pad.default, panel: 2 * pad.panel, formatted: spaced(pad.default, []) },
  },
  {
    name: "Moved after render: an empty state moved out of its container and back still observes its slotted content, so removing hidden from its action shows it at the body-to-actions gap (FR-023)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600" id="holder"><ocelle-empty-state id="e"><h2 slot="heading" id="h">No missions yet</h2><p id="p">Missions you create appear here.</p><button slot="actions" id="b" type="button" hidden>Create mission</button></ocelle-empty-state></div><div class="w600" id="other"></div>',
      );
      const before = await column(driver, "e", ["h", "p"]);
      await driver.move("e", "other");
      await driver.move("e", "holder");
      await driver.setAttribute("b", "hidden", null);
      return { before, shown: await column(driver, "e", ["h", "p", "b"]) };
    },
    expected: { before: spaced(pad.default, [gap.default.heading]), shown: spaced(pad.default, [gap.default.heading, gap.default.text]) },
  },
  {
    name: "Slots filled and emptied after first render: an action and a body paragraph assigned after render each take their gap, and each removed again leaves the heading at the block padding (FR-023)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600"><ocelle-empty-state id="e"><h2 slot="heading" id="h">No missions yet</h2><button slot="later" id="b" type="button">Create mission</button><p slot="later" id="p">Missions you create appear here.</p></ocelle-empty-state></div>',
      );
      const first = await column(driver, "e", ["h"]);
      await driver.setAttribute("b", "slot", "actions");
      const action = await column(driver, "e", ["h", "b"]);
      await driver.setAttribute("p", "slot", null);
      const text = await column(driver, "e", ["h", "p", "b"]);
      await driver.move("b", null);
      const noAction = await column(driver, "e", ["h", "p"]);
      await driver.move("p", null);
      return { first, action, text, noAction, emptied: await column(driver, "e", ["h"]) };
    },
    expected: {
      first: spaced(pad.default, []),
      action: spaced(pad.default, [gap.default.heading]),
      text: spaced(pad.default, [gap.default.heading, gap.default.text]),
      noAction: spaced(pad.default, [gap.default.heading]),
      emptied: spaced(pad.default, []),
    },
  },
  {
    name: "Several actions at a 320 px viewport, with a long heading and a long body: the page scroll width is 320, heading and body wrap onto several lines inside the element's content box, and the actions wrap onto more than one row inside it (FR-021, edge case)",
    run: async (driver) => {
      await driver.viewport(320, 800);
      await mount(
        driver,
        '<ocelle-empty-state id="e">' +
          `<h2 slot="heading" id="h"><span id="hs">${longHeading}</span></h2>` +
          `<p id="p"><span id="ps">${longBody}</span></p>` +
          ["Create mission", "Import missions", "Read the guide", "Open settings"].map((label, at) => `<button slot="actions" id="b${String(at)}" type="button">${label}</button>`).join("") +
          "</ocelle-empty-state>",
      );
      const host = await driver.box("e");
      const inside = (box: { x: number; width: number }): boolean => box.width > 0 && box.x >= host.x - 0.5 && box.x + box.width <= host.x + host.width + 0.5;
      const headingLines = await driver.lines("hs");
      const bodyLines = await driver.lines("ps");
      const buttons = await Promise.all([0, 1, 2, 3].map((at) => driver.box(`b${String(at)}`)));
      return {
        scrollWidth: await driver.scrollWidth(),
        host: host.width,
        heading: { several: headingLines.length > 1, inside: headingLines.every(inside) },
        body: { several: bodyLines.length > 1, inside: bodyLines.every(inside) },
        actions: { rows: new Set(buttons.map((each) => Math.round(each.y))).size > 1, inside: buttons.every(inside) },
      };
    },
    expected: { scrollWidth: 320, host: 320, heading: { several: true, inside: true }, body: { several: true, inside: true }, actions: { rows: true, inside: true } },
  },
  {
    name: "Unset variant writes no attribute; variant set to panel reflects, and unset again removes it (contracts/elements.md § Defaults)",
    run: async (driver) => {
      await mount(driver, '<ocelle-empty-state id="e"><h2 slot="heading" id="h">No missions yet</h2></ocelle-empty-state>');
      const unset = await driver.attribute("e", "variant");
      await driver.setProperty("e", "variant", "panel");
      const set = await driver.attribute("e", "variant");
      const panel = await column(driver, "e", ["h"]);
      await driver.setProperty("e", "variant", undefined);
      return { unset, set, panel, cleared: await driver.attribute("e", "variant") };
    },
    expected: { unset: null, set: "panel", panel: spaced(pad.panel, []), cleared: null },
  },
  {
    name: "US2-10: an eyebrow written after the heading is the first present part at the block padding, space-1 above the heading (panel: padding space-10, space-2), in font-sans at font-size-xs, weight medium, ink-muted, upper case, no margin; the tree reads eyebrow, level 1 heading, paragraph, button, with no role added (FR-025)",
    run: async (driver) => {
      await mount(driver, `<div class="w600">${refusal("e", "")}${refusal("f", "f", ' variant="panel"')}</div>`);
      return {
        default: await column(driver, "e", ["y", "h", "p", "b"]),
        panel: await column(driver, "f", ["fy", "fh", "fp", "fb"]),
        type: await computedOf(driver, "y", eyebrowProperties),
        reading: await reading(driver, "e"),
      };
    },
    expected: {
      default: spaced(pad.default, [gap.default.eyebrowHeading, gap.default.heading, gap.default.text]),
      panel: spaced(pad.panel, [gap.panel.eyebrowHeading, gap.panel.heading, gap.panel.text]),
      type: {
        "font-family": token("font-sans"),
        "font-size": px(rem("font-size-xs")),
        "font-weight": token("font-weight-medium"),
        color: tokenColour("color-ink-muted", "light"),
        "text-transform": "uppercase",
        "margin-block-start": "0px",
        "margin-block-end": "0px",
      },
      reading: [
        "paragraph",
        "text REFUSED",
        "heading 1 Cannot open the mission",
        "text Cannot open the mission",
        "paragraph",
        "text The mission file is outside the workspace.",
        "button Back to missions",
        "text Back to missions",
      ],
    },
  },
  {
    name: "US2-11: two body paragraphs have no user-agent margin, the first starts at the default-slot area's block start and the last ends at its block end, space-2 apart, with the heading-to-body and body-to-actions gaps unchanged; one paragraph meets both edges (FR-026)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="e"><h2 slot="heading" id="h">No missions yet</h2><p id="p1">Missions you create appear here.</p><p id="p2">Start one from the command line.</p><button slot="actions" id="b" type="button">Create mission</button></ocelle-empty-state>' +
          '<ocelle-empty-state id="o"><p id="op">Missions you create appear here.</p></ocelle-empty-state>' +
          "</div>",
      );
      const area = await driver.box("e", ".text");
      const first = await driver.box("p1");
      const second = await driver.box("p2");
      const one = await driver.box("o", ".text");
      const only = await driver.box("op");
      return {
        two: {
          areaStart: round(first.y - area.y),
          between: round(second.y - bottom(first)),
          areaEnd: round(bottom(area) - bottom(second)),
          margins: [await driver.computed("p1", "margin-block-start"), await driver.computed("p2", "margin-block-end")],
        },
        column: await column(driver, "e", ["h", ["e", ".text"], "b"]),
        one: { areaStart: round(only.y - one.y), areaEnd: round(bottom(one) - bottom(only)), height: only.height > 0 },
      };
    },
    expected: {
      two: { areaStart: 0, between: bodyGap, areaEnd: 0, margins: ["0px", "0px"] },
      column: spaced(pad.default, [gap.default.heading, gap.default.text]),
      one: { areaStart: 0, areaEnd: 0, height: true },
    },
  },
  {
    name: "Eyebrow present parts: an eyebrow alone meets both block paddings, and with actions and no heading it is space-2 above them (panel: space-10 padding, space-3) (FR-023, FR-025)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="a"><p slot="eyebrow" id="ay">Refused</p></ocelle-empty-state>' +
          '<ocelle-empty-state id="b"><button slot="actions" id="bb" type="button">Back to missions</button><p slot="eyebrow" id="by">Refused</p></ocelle-empty-state>' +
          '<ocelle-empty-state id="pa" variant="panel"><p slot="eyebrow" id="pay">Refused</p></ocelle-empty-state>' +
          '<ocelle-empty-state id="pb" variant="panel"><button slot="actions" id="pbb" type="button">Back to missions</button><p slot="eyebrow" id="pby">Refused</p></ocelle-empty-state>' +
          "</div>",
      );
      return {
        only: await column(driver, "a", ["ay"]),
        actions: await column(driver, "b", ["by", "bb"]),
        panelOnly: await column(driver, "pa", ["pay"]),
        panelActions: await column(driver, "pb", ["pby", "pbb"]),
      };
    },
    expected: {
      only: spaced(pad.default, []),
      actions: spaced(pad.default, [gap.default.eyebrowNext]),
      panelOnly: spaced(pad.panel, []),
      panelActions: spaced(pad.panel, [gap.panel.eyebrowNext]),
    },
  },
  {
    name: "Visual and eyebrow: written heading, body, eyebrow, visual, the column and the tree read visual, eyebrow, heading, body, with the visual-to-eyebrow gap space-3 (panel space-5) (FR-025)",
    run: async (driver) => {
      const block = (id: string, prefix: string, attributes = ""): string =>
        `<ocelle-empty-state id="${id}"${attributes}>` +
        `<h2 slot="heading" id="${prefix}h">Refused</h2>` +
        `<p id="${prefix}p">The mission file is outside the workspace.</p>` +
        `<p slot="eyebrow" id="${prefix}y">Policy</p>` +
        `<div slot="visual" id="${prefix}v" class="mark" role="img" aria-label="Mission mark"></div>` +
        "</ocelle-empty-state>";
      await mount(driver, `<div class="w600">${block("e", "")}${block("f", "f", ' variant="panel"')}</div>`);
      return {
        default: await column(driver, "e", ["v", "y", "h", "p"]),
        panel: await column(driver, "f", ["fv", "fy", "fh", "fp"]),
        reading: await reading(driver, "e"),
      };
    },
    expected: {
      default: spaced(pad.default, [gap.default.visual, gap.default.eyebrowHeading, gap.default.heading]),
      panel: spaced(pad.panel, [gap.panel.visual, gap.panel.eyebrowHeading, gap.panel.heading]),
      reading: ["image Mission mark", "paragraph", "text POLICY", "heading 2 Refused", "text Refused", "paragraph", "text The mission file is outside the workspace."],
    },
  },
  {
    name: "Eyebrow and text with no heading: the eyebrow at the block padding and space-2 above the body paragraph (panel: space-10 padding, space-3) (FR-025)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="e"><p id="p">Nothing to review today.</p><p slot="eyebrow" id="y">Notice</p></ocelle-empty-state>' +
          '<ocelle-empty-state id="f" variant="panel"><p id="fp">Nothing to review today.</p><p slot="eyebrow" id="fy">Notice</p></ocelle-empty-state>' +
          "</div>",
      );
      return { default: await column(driver, "e", ["y", "p"]), panel: await column(driver, "f", ["fy", "fp"]) };
    },
    expected: { default: spaced(pad.default, [gap.default.eyebrowNext]), panel: spaced(pad.panel, [gap.panel.eyebrowNext]) },
  },
  {
    name: "Inline content in the default slot: a text run, a link and a text run give three blocks one below the other, space-2 apart, while the same text and link in one <p> stay on one line (FR-026, edge case)",
    run: async (driver) => {
      await mount(
        driver,
        '<div class="w600">' +
          '<ocelle-empty-state id="e">Read <a id="a" href="#guide">the guide</a> first.</ocelle-empty-state>' +
          '<ocelle-empty-state id="o"><p id="op">Read <a id="oa" href="#guide">the guide</a> first.</p></ocelle-empty-state>' +
          "</div>",
      );
      const area = await driver.box("e", ".text");
      const link = await driver.box("a");
      const one = await driver.box("o", ".text");
      const paragraph = await driver.box("op");
      return {
        blocks: {
          above: round(link.y - area.y - link.height),
          below: round(bottom(area) - bottom(link) - link.height),
          linkLines: (await driver.lines("a")).length,
          height: link.height > 0,
        },
        paragraph: { linkLines: (await driver.lines("oa")).length, area: round(one.height) === round(paragraph.height) && one.height > 0 },
      };
    },
    expected: { blocks: { above: bodyGap, below: bodyGap, linkLines: 1, height: true }, paragraph: { linkLines: 1, area: true } },
  },
];
