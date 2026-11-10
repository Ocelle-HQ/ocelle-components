// The shared bodies of User Story 1's browser scenarios for `ocelle-icon` (005 spec US1 scenarios 1 to 9, 14, 16, 18
// and 19; research.md R-11, T013). Each scenario observes the page through the driver and returns one observation;
// each harness asserts it equals the scenario's `expected`, written by hand from the spec, data-model.md § State and
// research.md (sizes from the 20 px `--ocelle-icon-size` at the default root font size; colours from the token values
// of packages/tokens/test/expected.ts; the forced-colours system colours Chromium's emulated palettes give, research
// R-09; the drawings of test/icons-expected.ts). Every "does not" outcome is observed in the same scenario as the
// positive outcome it guards (spec § "Does not" outcomes are paired):
// - no node and no name for an unlabelled icon (US1-5) beside a labelled twin with one image node;
// - unknown names draw nothing and add nothing, with a `label` or a host `aria-label` (US1-8), beside a known name that
//   draws, a labelled known name and a known-name twin with the same `aria-label`, each with one image node (plant:
//   `drawable` ignored when the host `aria-label` names the element);
// - `label` not reflected (US1-16) beside `name` reflected and the label set by property naming the icon;
// - a blank host `aria-label` adds no node (US1-18) beside a non-empty one with one image node;
// - a host `aria-hidden="true"` hides a labelled icon (US1-18) beside its shown twin;
// - a host `hidden` removes the box and the node (US1-19) beside its visible twin (plant: `:host([hidden])` removed).
// Host `aria-label` values are passed trimmed (operator decision PLAN-A11Y-SECURITY-1-003 (a)). Every element read
// carries an `id` (spec § Reading the accessibility tree). In phase 2 only `close` and `menu` are drawn, so US1-6 reads
// its label on `close` (the spec writes `search`, drawn from phase 3).
import { expectedTokens, inTheme } from "../../../tokens/test/expected.ts";
import { emptyDrawing, expectedDrawing } from "../icons-expected.ts";
import type { Box, Driver, Palette } from "./driver.ts";

export interface Scenario {
  /** The spec scenario and what it checks. */
  readonly name: string;
  readonly run: (driver: Driver) => Promise<unknown>;
  readonly expected: unknown;
}

/** A token's colour in a theme as `getComputedStyle` reports it, from the hand-written token table. */
export function tokenColour(token: string, theme: Palette): string {
  const entry = expectedTokens.find((each) => each.name === token);
  if (entry === undefined) throw new Error(`no expected token ${token}`);
  const hex = inTheme(entry.resolved, theme);
  const [r, g, b] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

/** The icon size at the default root font size: `--ocelle-icon-size` is 1.25rem (002 Appendix A). */
export const iconSize = 20;

function size(box: Box): { readonly width: number; readonly height: number; readonly display: string } {
  return { width: box.width, height: box.height, display: box.display };
}

/** The svg's box relative to the host's box. */
async function svgInHost(driver: Driver, id: string): Promise<{ readonly width: number; readonly height: number; readonly dx: number; readonly dy: number }> {
  const host = await driver.box(id);
  const svg = await driver.box(id, "svg");
  return { width: svg.width, height: svg.height, dx: svg.x - host.x, dy: svg.y - host.y };
}

const shown = { width: iconSize, height: iconSize, display: "inline-block" };
const image = (name: string): unknown => [{ role: "image", name }];

/** The forced-colours contexts of US1-7 and the system colour each must give the icon's strokes (research R-09). */
const contexts = [
  { context: "text", id: "in-text", system: "CanvasText" },
  { context: "link", id: "in-link", system: "LinkText" },
  { context: "button", id: "in-button", system: "ButtonText" },
  { context: "disabled button", id: "in-disabled", system: "GrayText" },
] as const;

/** The system colours of Chromium's emulated forced-colours palettes, as measured (research R-09). */
const systemColours: Readonly<Record<Palette, Readonly<Record<string, string>>>> = {
  light: { CanvasText: "rgb(0, 0, 0)", LinkText: "rgb(0, 0, 159)", ButtonText: "rgb(0, 0, 0)", GrayText: "rgb(96, 0, 0)" },
  dark: { CanvasText: "rgb(255, 255, 255)", LinkText: "rgb(255, 255, 0)", ButtonText: "rgb(255, 255, 255)", GrayText: "rgb(63, 242, 63)" },
};

const forcedMarkup =
  '<p id="ctx-text">Text <ocelle-icon id="in-text" name="close"></ocelle-icon></p>' +
  '<p><a id="ctx-link" href="#here">Link <ocelle-icon id="in-link" name="close"></ocelle-icon></a></p>' +
  '<p><button id="ctx-button" type="button">Button <ocelle-icon id="in-button" name="close"></ocelle-icon></button></p>' +
  '<p><button id="ctx-disabled" type="button" disabled>Disabled <ocelle-icon id="in-disabled" name="close"></ocelle-icon></button></p>';

async function forcedObservation(driver: Driver, palette: Palette): Promise<unknown> {
  await driver.forcedColors("active", palette);
  const canvas = await driver.resolveColour("Canvas");
  const buttonFace = await driver.resolveColour("ButtonFace");
  const observed = [];
  for (const { context, id, system } of contexts) {
    const paints = await driver.paints(id);
    const strokes = [...new Set(paints.map((paint) => paint.stroke))];
    const fills = [...new Set(paints.map((paint) => paint.fill))];
    observed.push({
      context,
      painted: paints.length,
      strokes,
      fills,
      system: await driver.resolveColour(system),
      visible: strokes.every((stroke) => stroke !== canvas && stroke !== buttonFace),
    });
  }
  await driver.forcedColors("none");
  return observed;
}

function forcedExpected(palette: Palette): unknown {
  return contexts.map(({ context, system }) => ({
    context,
    // The svg and the close glyph's two lines.
    painted: 3,
    strokes: [systemColours[palette][system]],
    fills: ["none"],
    system: systemColours[palette][system],
    visible: true,
  }));
}

export const iconScenarios: readonly Scenario[] = [
  {
    name: "US1-1: the shadow root holds one svg drawing of the close glyph and the box is the icon size (FR-004, FR-005, FR-010)",
    run: async (driver) => {
      await driver.mount('<p>Close <ocelle-icon id="icon" name="close"></ocelle-icon></p>');
      return { drawing: await driver.drawing("icon"), box: size(await driver.box("icon")) };
    },
    expected: { drawing: expectedDrawing("close"), box: shown },
  },
  {
    name: "US1-2: with no host size the box is the icon size and the drawing fills it (FR-011)",
    run: async (driver) => {
      await driver.mount('<p>Close <ocelle-icon id="icon" name="close"></ocelle-icon></p>');
      return { box: size(await driver.box("icon")), svg: await svgInHost(driver, "icon"), placement: await driver.placement("icon") };
    },
    expected: {
      box: shown,
      svg: { width: iconSize, height: iconSize, dx: 0, dy: 0 },
      placement: { scaleX: 0.833, scaleY: 0.833, offsetX: 0, offsetY: 0 },
    },
  },
  {
    name: "US1-3: a host size or an ancestor's --ocelle-icon-size resizes the box and the drawing; one host side keeps the other at the icon size, the drawing at the smaller side, centred (FR-011)",
    run: async (driver) => {
      await driver.mount(
        '<p><ocelle-icon id="both" name="close"></ocelle-icon></p>' +
          '<p id="ancestor"><span><ocelle-icon id="token" name="close"></ocelle-icon></span></p>' +
          '<p><ocelle-icon id="wide" name="close"></ocelle-icon></p>' +
          '<p><ocelle-icon id="plain" name="close"></ocelle-icon></p>',
      );
      await driver.style("both", "inline-size", "32px");
      await driver.style("both", "block-size", "32px");
      await driver.style("ancestor", "--ocelle-icon-size", "32px");
      await driver.style("wide", "inline-size", "32px");
      const observe = async (id: string): Promise<unknown> => ({ box: size(await driver.box(id)), svg: await svgInHost(driver, id), placement: await driver.placement(id) });
      return { both: await observe("both"), token: await observe("token"), wide: await observe("wide"), plain: size(await driver.box("plain")) };
    },
    expected: {
      both: { box: { width: 32, height: 32, display: "inline-block" }, svg: { width: 32, height: 32, dx: 0, dy: 0 }, placement: { scaleX: 1.333, scaleY: 1.333, offsetX: 0, offsetY: 0 } },
      token: { box: { width: 32, height: 32, display: "inline-block" }, svg: { width: 32, height: 32, dx: 0, dy: 0 }, placement: { scaleX: 1.333, scaleY: 1.333, offsetX: 0, offsetY: 0 } },
      wide: { box: { width: 32, height: iconSize, display: "inline-block" }, svg: { width: 32, height: iconSize, dx: 0, dy: 0 }, placement: { scaleX: 0.833, scaleY: 0.833, offsetX: 6, offsetY: 0 } },
      plain: shown,
    },
  },
  {
    name: "US1-4: every stroke takes the inherited text colour, ink and then chrome ink, and the drawing has no colour of its own (FR-012)",
    run: async (driver) => {
      await driver.mount('<p id="text">Close <ocelle-icon id="icon" name="close"></ocelle-icon></p>');
      await driver.style("text", "color", "var(--ocelle-color-ink)");
      const ink = await driver.paints("icon");
      await driver.style("text", "color", "var(--ocelle-color-chrome-ink)");
      const chromeInk = await driver.paints("icon");
      return { ink, chromeInk, drawing: await driver.drawing("icon") };
    },
    expected: {
      ink: ["svg", "line", "line"].map((name) => ({ name, stroke: tokenColour("color-ink", "light"), fill: "none" })),
      chromeInk: ["svg", "line", "line"].map((name) => ({ name, stroke: tokenColour("color-chrome-ink", "light"), fill: "none" })),
      drawing: expectedDrawing("close"),
    },
  },
  {
    name: "US1-5: an unlabelled icon contributes no node and no name to its button, while its labelled twin is one image node named Close (FR-013, FR-014)",
    run: async (driver) => {
      await driver.mount(
        '<p id="sentence">Press <ocelle-icon id="plain" name="close"></ocelle-icon> to close.</p>' +
          '<p><ocelle-icon id="named" name="close" label="Close"></ocelle-icon></p>' +
          '<button id="plain-button" type="button">Dismiss <ocelle-icon id="plain-in" name="close"></ocelle-icon> now</button>' +
          '<button id="named-button" type="button">Dismiss <ocelle-icon id="named-in" name="close" label="Close"></ocelle-icon> now</button>',
      );
      return {
        plain: await driver.ax("plain"),
        named: await driver.ax("named"),
        plainDrawn: (await driver.drawing("plain")).children,
        plainButton: await driver.ax("plain-button"),
        plainIn: await driver.ax("plain-in"),
        namedButton: await driver.ax("named-button"),
      };
    },
    expected: {
      plain: [],
      named: image("Close"),
      plainDrawn: ["svg"],
      plainButton: [{ role: "button", name: "Dismiss now" }],
      plainIn: [],
      namedButton: [{ role: "button", name: "Dismiss Close now" }],
    },
  },
  {
    name: "US1-6: a label names the icon as one image node, trimmed; removed, empty or whitespace-only it leaves the icon unlabelled (FR-014)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-icon id="search" name="close" label="Search"></ocelle-icon></p>');
      const steps: unknown[] = [await driver.ax("search")];
      await driver.setAttribute("search", "label", null);
      steps.push(await driver.ax("search"));
      await driver.setAttribute("search", "label", " Search ");
      steps.push(await driver.ax("search"));
      await driver.setAttribute("search", "label", "");
      steps.push(await driver.ax("search"));
      await driver.setProperty("search", "label", "Search");
      steps.push(await driver.ax("search"));
      await driver.setProperty("search", "label", "  ");
      steps.push(await driver.ax("search"));
      return steps;
    },
    expected: [image("Search"), [], image("Search"), [], image("Search"), []],
  },
  ...(["dark", "light"] as const).map(
    (palette): Scenario => ({
      name: `US1-7: in forced colours with the ${palette} palette the strokes take the system colour of text, link, button and disabled button, visible against Canvas and ButtonFace (FR-015)`,
      run: async (driver) => {
        await driver.mount(forcedMarkup);
        return forcedObservation(driver, palette);
      },
      expected: forcedExpected(palette),
    }),
  ),
  {
    name: "US1-8: unknown, empty, missing, differently cased and spaced names draw nothing, keep the box and add no node even with a label or a host aria-label, without a message, while known names draw and are named; a known name then draws (FR-016, FR-034)",
    run: async (driver) => {
      await driver.mount(
        '<p><ocelle-icon id="unknown" name="nonexistent" label="Close"></ocelle-icon>' +
          '<ocelle-icon id="empty" name="" label="Close"></ocelle-icon>' +
          '<ocelle-icon id="missing" label="Close"></ocelle-icon>' +
          '<ocelle-icon id="capital" name="Close" label="Close"></ocelle-icon>' +
          '<ocelle-icon id="spaced" name=" close" label="Close"></ocelle-icon>' +
          '<ocelle-icon id="aria-unknown" name="nonexistent" aria-label="Close"></ocelle-icon>' +
          '<ocelle-icon id="aria-known" name="close" aria-label="Close"></ocelle-icon>' +
          '<ocelle-icon id="label-known" name="close" label="Close"></ocelle-icon></p>',
      );
      const undrawn: Record<string, unknown> = {};
      for (const id of ["unknown", "empty", "missing", "capital", "spaced", "aria-unknown"]) {
        undrawn[id] = { drawing: await driver.drawing(id), box: size(await driver.box(id)), ax: await driver.ax(id) };
      }
      const known = { ariaKnown: await driver.ax("aria-known"), labelKnown: await driver.ax("label-known"), drawn: await driver.drawing("label-known") };
      await driver.setAttribute("unknown", "name", "close");
      const changed = { drawing: await driver.drawing("unknown"), ax: await driver.ax("unknown") };
      return { undrawn, known, changed, messages: await driver.messages() };
    },
    expected: {
      undrawn: Object.fromEntries(["unknown", "empty", "missing", "capital", "spaced", "aria-unknown"].map((id) => [id, { drawing: emptyDrawing, box: shown, ax: [] }])),
      known: { ariaKnown: image("Close"), labelKnown: image("Close"), drawn: expectedDrawing("close") },
      changed: { drawing: expectedDrawing("close"), ax: image("Close") },
      messages: [],
    },
  },
  {
    name: "US1-9: changing name from close to menu draws the menu glyph and nothing of the close glyph (FR-016)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-icon id="swap" name="close"></ocelle-icon></p>');
      const before = await driver.drawing("swap");
      await driver.setAttribute("swap", "name", "menu");
      return { before, after: await driver.drawing("swap") };
    },
    expected: { before: expectedDrawing("close"), after: expectedDrawing("menu") },
  },
  {
    name: "US1-14: 500 icons render and their shadow roots adopt one shared stylesheet object, with no <style> element (FR-003)",
    run: async (driver) => {
      await driver.mount(`<p>${Array.from({ length: 500 }, (_, i) => `<ocelle-icon id="many-${String(i)}" class="many" name="close"></ocelle-icon>`).join("")}</p>`);
      return { sheets: await driver.sheets("ocelle-icon.many"), first: await driver.drawing("many-0"), last: await driver.drawing("many-499") };
    },
    expected: { sheets: { elements: 500, perRoot: [1], distinct: 1, styleElements: 0 }, first: expectedDrawing("close"), last: expectedDrawing("close") },
  },
  {
    name: "US1-16: setting the name and label properties reflects name to its attribute, not label, and names the icon by the label (FR-014, FR-016)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-icon id="prop" name="close"></ocelle-icon></p>');
      const before = await driver.ax("prop");
      await driver.setProperty("prop", "name", "menu");
      await driver.setProperty("prop", "label", "Menu");
      return {
        before,
        name: await driver.attribute("prop", "name"),
        label: await driver.attribute("prop", "label"),
        ax: await driver.ax("prop"),
        drawing: await driver.drawing("prop"),
      };
    },
    expected: { before: [], name: "menu", label: null, ax: image("Menu"), drawing: expectedDrawing("menu") },
  },
  {
    name: "US1-18: a present host aria-label decides naming alone, a blank one leaves the icon unlabelled even with a label, it wins over label, and aria-hidden hides a labelled icon beside its shown twin (FR-034)",
    run: async (driver) => {
      await driver.mount(
        '<p><ocelle-icon id="aria-named" name="close" aria-label="Close"></ocelle-icon>' +
          '<ocelle-icon id="aria-empty" name="close" aria-label="  "></ocelle-icon>' +
          '<ocelle-icon id="blank-labelled" name="close" label="Shut" aria-label="  "></ocelle-icon>' +
          '<ocelle-icon id="both" name="close" label="Shut" aria-label="Close"></ocelle-icon>' +
          '<ocelle-icon id="hidden-labelled" name="close" label="Close" aria-hidden="true"></ocelle-icon>' +
          '<ocelle-icon id="shown-labelled" name="close" label="Close"></ocelle-icon></p>',
      );
      const first: Record<string, unknown> = {};
      for (const id of ["aria-named", "aria-empty", "blank-labelled", "both", "hidden-labelled", "shown-labelled"]) first[id] = await driver.ax(id);
      await driver.setAttribute("aria-named", "aria-label", null);
      await driver.setAttribute("blank-labelled", "aria-label", null);
      return {
        first,
        ariaNamedRemoved: await driver.ax("aria-named"),
        blankLabelledRemoved: await driver.ax("blank-labelled"),
        hostAttributes: [await driver.attribute("both", "aria-label"), await driver.attribute("hidden-labelled", "aria-hidden")],
      };
    },
    expected: {
      first: {
        "aria-named": image("Close"),
        "aria-empty": [],
        "blank-labelled": [],
        both: image("Close"),
        "hidden-labelled": [],
        "shown-labelled": image("Close"),
      },
      ariaNamedRemoved: [],
      blankLabelledRemoved: image("Shut"),
      hostAttributes: ["Close", "true"],
    },
  },
  {
    name: "US1-19: a hidden labelled icon has no box and no node beside its visible twin; without hidden it is the icon size and one image node (FR-034)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-icon id="hidden-icon" name="close" label="Close" hidden></ocelle-icon> <ocelle-icon id="visible-icon" name="close" label="Close"></ocelle-icon></p>');
      const hidden = { box: size(await driver.box("hidden-icon")), ax: await driver.ax("hidden-icon") };
      const visible = { box: size(await driver.box("visible-icon")), ax: await driver.ax("visible-icon") };
      await driver.setAttribute("hidden-icon", "hidden", null);
      return { hidden, visible, unhidden: { box: size(await driver.box("hidden-icon")), ax: await driver.ax("hidden-icon") } };
    },
    expected: {
      hidden: { box: { width: 0, height: 0, display: "none" }, ax: [] },
      visible: { box: shown, ax: image("Close") },
      unhidden: { box: shown, ax: image("Close") },
    },
  },
];
