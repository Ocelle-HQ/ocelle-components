// The shared bodies of User Story 4's browser scenarios for `ocelle-brand-mark` (005 spec US4 scenarios 1 to 3, 5 to 9
// and 13 to 15, the US4 Independent Test and SC-001 for the three variants; research.md R-09, R-11; data-model.md
// § `ocelle-brand-mark`; T051). Each scenario observes the page through the driver and returns one observation; each
// harness asserts it equals the scenario's `expected`, written by hand from the spec and data-model.md: colours from
// the token values of packages/tokens/test/expected.ts, the forced-colours system colours Chromium's emulated palettes
// give (research R-09), sizes from the 20 px `--ocelle-icon-size` at the default root font size and the drawing's
// `viewBox="4 4 92 92"`, and the rosette's geometry from the reference itself,
// specs/005-icons-brand-mark/sources/ocelle-docs-logo.reference.svg, never from the element source. Every "does not"
// outcome is observed in the same scenario as the positive outcome it guards (spec § "Does not" outcomes are paired):
// - an unlabelled mark contributes no node and no name (US4-6) beside its labelled twin with one image node;
// - unknown `ground` and `tone` values give the default (US4-8) beside a known chrome twin painted in chrome ink;
// - `label` not reflected (US4-13) beside `ground` and `tone` reflected and the label naming the mark;
// - a blank host `aria-label` and a host `aria-hidden="true"` add no node (US4-14) beside named twins;
// - a host `hidden` removes the box and the node (US4-15) beside its visible twin (plant: `:host([hidden])` removed);
// - the drawing holds none of the reference's literal colours, no rounded square and none of FR-010's forbidden
//   elements and attributes (US4-9) in the same test as its geometry matching the reference's rosette.
// The forced-colours plants of R-09 (the pre-round-1 sheet without the `@media not (forced-colors: active)` wrapper,
// and `fill: CanvasText` on the spot) fail US4-5; the sizing plant (`inline-size: auto`) fails US4-7's column case.
/// <reference types="vite/client" />
import reference from "../../../../specs/005-icons-brand-mark/sources/ocelle-docs-logo.reference.svg?raw";
import type { Driver, Palette, Part } from "./driver.ts";
import { iconSize, image, size, systemColours, tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";

/** The nine main grounds of the token source's `main` list (spec § Main grounds). */
export const mainGrounds = ["color-canvas", "color-sheet", "color-pane", "color-panel", "color-inspector", "color-rail", "color-inset", "color-accent-low", "color-hover-bg"] as const;
/** The chrome grounds: the chrome and the hover ground of a mark that is a home link. */
export const chromeGrounds = ["color-chrome", "color-chrome-hover"] as const;

const unique = (values: readonly string[]): string[] => [...new Set(values)];

/** How a mark is painted: the ring's strokes and fills (its four arcs) and the spot's fills and strokes (its ellipse). */
export interface MarkPaint {
  readonly ring: readonly string[];
  readonly ringFill: readonly string[];
  readonly spot: readonly string[];
  readonly spotStroke: readonly string[];
  /** The number of arcs and of spots painted. */
  readonly parts: readonly [number, number];
}

/** The computed paint of the mark with `id`: the arcs (`path`) are the ring, the ellipse is the spot. */
export async function markPaint(driver: Driver, id: string): Promise<MarkPaint> {
  const paints = await driver.paints(id);
  const ring = paints.filter((paint) => paint.name === "path");
  const spot = paints.filter((paint) => paint.name === "ellipse");
  return {
    ring: unique(ring.map((paint) => paint.stroke)),
    ringFill: unique(ring.map((paint) => paint.fill)),
    spot: unique(spot.map((paint) => paint.fill)),
    spotStroke: unique(spot.map((paint) => paint.stroke)),
    parts: [ring.length, spot.length],
  };
}

/** A mark painted with a ring colour and a spot colour: four stroked arcs without fill and one filled ellipse. */
export function painted(ring: string, spot: string): MarkPaint {
  return { ring: [ring], ringFill: ["none"], spot: [spot], spotStroke: ["none"], parts: [4, 1] };
}

/** The markup of one mark per ground, each in a container whose ground is set by `groundsOn()`. */
function groundMarkup(grounds: readonly string[], attributes: string): string {
  return grounds.map((ground) => `<div id="on-${ground}"><ocelle-brand-mark id="mark-${ground}"${attributes}></ocelle-brand-mark></div>`).join("");
}

/** Paints each container of groundMarkup() with its ground token. */
async function groundsOn(driver: Driver, grounds: readonly string[]): Promise<void> {
  for (const ground of grounds) await driver.style(`on-${ground}`, "background-color", `var(--ocelle-${ground})`);
}

/** Each ground's computed colour and its mark's paint. */
async function observeGrounds(driver: Driver, grounds: readonly string[]): Promise<Record<string, unknown>> {
  const observed: Record<string, unknown> = {};
  for (const ground of grounds) observed[ground] = { ground: await driver.computed(`on-${ground}`, "background-color"), mark: await markPaint(driver, `mark-${ground}`) };
  return observed;
}

function groundsExpected(grounds: readonly string[], theme: Palette, ring: string): Record<string, unknown> {
  return Object.fromEntries(grounds.map((ground) => [ground, { ground: tokenColour(ground, theme), mark: painted(tokenColour(ring, theme), tokenColour("color-accent", theme)) }]));
}

/** The three variants of FR-025, with the attributes that select each. */
const variants = [
  { variant: "default", attributes: "" },
  { variant: "chrome", attributes: ' ground="chrome"' },
  { variant: "mono", attributes: ' tone="mono"' },
] as const;

/** The forced-colours contexts of US4-5 and the system colour each must give ring and spot (research R-09). */
const contexts = [
  { context: "text", id: "in-text", system: "CanvasText" },
  { context: "link", id: "in-link", system: "LinkText" },
  { context: "button", id: "in-button", system: "ButtonText" },
  { context: "disabled button", id: "in-disabled", system: "GrayText" },
] as const;

/** US4-5's page: each variant in body text, a link, a button and a disabled button. */
function forcedMarkup(): string {
  return variants
    .map(
      ({ variant, attributes }) =>
        `<p>Text <ocelle-brand-mark id="${variant}-in-text"${attributes}></ocelle-brand-mark></p>` +
        `<p><a href="#here">Link <ocelle-brand-mark id="${variant}-in-link"${attributes}></ocelle-brand-mark></a></p>` +
        `<p><button type="button">Button <ocelle-brand-mark id="${variant}-in-button"${attributes}></ocelle-brand-mark></button></p>` +
        `<p><button type="button" disabled>Disabled <ocelle-brand-mark id="${variant}-in-disabled"${attributes}></ocelle-brand-mark></button></p>`,
    )
    .join("");
}

/** The spot's box inside the ring's: the ellipse's geometry box inside the union of the arcs' boxes, in user units. */
async function spotInsideRing(driver: Driver, id: string): Promise<boolean> {
  const shapes = await driver.geometry(id);
  const arcs = shapes.slice(0, 4);
  const spot = shapes[4];
  if (arcs.length !== 4 || spot === undefined || spot.width <= 0 || spot.height <= 0) return false;
  const left = Math.min(...arcs.map((arc) => arc.x));
  const top = Math.min(...arcs.map((arc) => arc.y));
  const right = Math.max(...arcs.map((arc) => arc.x + arc.width));
  const bottom = Math.max(...arcs.map((arc) => arc.y + arc.height));
  return spot.x > left && spot.y > top && spot.x + spot.width < right && spot.y + spot.height < bottom;
}

async function forcedObservation(driver: Driver, palette: Palette): Promise<unknown> {
  await driver.forcedColors("active", palette);
  const canvas = await driver.resolveColour("Canvas");
  const buttonFace = await driver.resolveColour("ButtonFace");
  const observed = [];
  for (const { variant } of variants) {
    for (const { context, id, system } of contexts) {
      const paint = await markPaint(driver, `${variant}-${id}`);
      observed.push({
        variant,
        context,
        paint,
        system: await driver.resolveColour(system),
        visible: [...paint.ring, ...paint.spot].every((colour) => colour !== canvas && colour !== buttonFace && colour !== "none"),
        spotInside: await spotInsideRing(driver, `${variant}-${id}`),
      });
    }
  }
  await driver.forcedColors("none");
  return observed;
}

function forcedExpected(palette: Palette): unknown {
  return variants.flatMap(({ variant }) =>
    contexts.map(({ context, system }) => ({
      variant,
      context,
      paint: painted(systemColours[palette][system] ?? "", systemColours[palette][system] ?? ""),
      system: systemColours[palette][system],
      visible: true,
      spotInside: true,
    })),
  );
}

/** One open arc of the rosette: its endpoints, radii, flags and stroke width, in the drawing's user units. */
interface Arc {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly radii: readonly [number, number];
  readonly flags: readonly [number, number, number];
  readonly width: number;
}

/** The rosette's spot: centre, radii and rotation in degrees about its centre. */
interface Spot {
  readonly centre: readonly [number, number];
  readonly radii: readonly [number, number];
  readonly rotation: number;
  readonly about: readonly [number, number];
}

const numbers = (text: string): number[] => [...text.matchAll(/-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/gi)].map((match) => Number(match[0]));

/** An arc from a `d` of the form `M x y A rx ry rotation large sweep x y`; undefined for any other path. */
function arcOf(d: string, width: string | undefined): Arc | undefined {
  if (!/^\s*M[^A-Za-z]*A[^A-Za-z]*$/.test(d)) return undefined;
  const [x1, y1, rx, ry, rotation, large, sweep, x2, y2, ...rest] = numbers(d);
  if (y2 === undefined || rest.length > 0 || x1 === undefined || y1 === undefined || rx === undefined || ry === undefined || rotation === undefined || large === undefined || sweep === undefined || x2 === undefined) return undefined;
  return { from: [x1, y1], to: [x2, y2], radii: [rx, ry], flags: [rotation, large, sweep], width: Number(width) };
}

/** A spot from an ellipse's attributes; its `transform` must be one `rotate(angle cx cy)`. */
function spotOf(attributes: Readonly<Record<string, string>>): Spot | undefined {
  const rotate = /^\s*rotate\(([^)]*)\)\s*$/.exec(attributes.transform ?? "");
  const [rotation, ax, ay] = numbers(rotate?.[1] ?? "");
  if (rotation === undefined || ax === undefined || ay === undefined) return undefined;
  return { centre: [Number(attributes.cx), Number(attributes.cy)], radii: [Number(attributes.rx), Number(attributes.ry)], rotation, about: [ax, ay] };
}

/** The attributes of each element of a markup text, by element name, in document order. */
function referenceParts(text: string): Part[] {
  return [...text.matchAll(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*\/?>/g)].map((match) => ({
    name: String(match[1]),
    attributes: Object.fromEntries([...String(match[2]).matchAll(/([\w:-]+)="([^"]*)"/g)].map((attribute) => [String(attribute[1]), String(attribute[2])])),
  }));
}

/** The rosette group of the reference (the group inside the rounded square): its four arcs and its spot. */
function referenceRosette(): { readonly arcs: Arc[]; readonly spot: Spot | undefined } {
  const parts = referenceParts(reference);
  const ringGroup = parts.find((part) => part.name === "g" && part.attributes["stroke-linecap"] === "round");
  const arcs = parts.filter((part) => part.name === "path").map((part) => arcOf(part.attributes.d ?? "", part.attributes["stroke-width"]));
  const spot = parts.find((part) => part.name === "ellipse");
  if (ringGroup === undefined || arcs.some((arc) => arc === undefined) || spot === undefined) throw new Error("the reference's rosette group did not parse");
  return { arcs: arcs as Arc[], spot: spotOf(spot.attributes) };
}

/** The literal colours of the reference file, upper case. */
const referenceColours = unique([...reference.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((match) => match[0].toUpperCase()));

const round = (value: number): number => Math.round(value * 1000) / 1000 + 0;

/**
 * Fits one uniform scale and one translation from the reference's spot centre and first arc's start to the drawing's,
 * then measures the largest deviation of every endpoint, radius, stroke width and the spot's centre, radii and rotation
 * (as a displacement at the spot's larger radius) from the fitted reference.
 */
function fit(drawn: { readonly arcs: readonly Arc[]; readonly spot: Spot }, rosette: { readonly arcs: readonly Arc[]; readonly spot: Spot }): { readonly scale: number; readonly translate: readonly [number, number]; readonly worst: number; readonly flags: boolean } {
  const [first] = rosette.arcs;
  const [drawnFirst] = drawn.arcs;
  if (first === undefined || drawnFirst === undefined) return { scale: 0, translate: [0, 0], worst: Number.POSITIVE_INFINITY, flags: false };
  const scale = Math.hypot(drawnFirst.from[0] - drawn.spot.centre[0], drawnFirst.from[1] - drawn.spot.centre[1]) / Math.hypot(first.from[0] - rosette.spot.centre[0], first.from[1] - rosette.spot.centre[1]);
  const tx = drawn.spot.centre[0] - scale * rosette.spot.centre[0];
  const ty = drawn.spot.centre[1] - scale * rosette.spot.centre[1];
  const point = (p: readonly [number, number], q: readonly [number, number]): number => Math.hypot(scale * p[0] + tx - q[0], scale * p[1] + ty - q[1]);
  const length = (a: number, b: number): number => Math.abs(scale * a - b);
  const deviations = rosette.arcs.flatMap((arc, index) => {
    const other = drawn.arcs[index];
    if (other === undefined) return [Number.POSITIVE_INFINITY];
    return [point(arc.from, other.from), point(arc.to, other.to), length(arc.radii[0], other.radii[0]), length(arc.radii[1], other.radii[1]), length(arc.width, other.width)];
  });
  const largest = Math.max(...drawn.spot.radii);
  deviations.push(
    point(rosette.spot.centre, drawn.spot.centre),
    point(rosette.spot.about, drawn.spot.about),
    length(rosette.spot.radii[0], drawn.spot.radii[0]),
    length(rosette.spot.radii[1], drawn.spot.radii[1]),
    (Math.abs(rosette.spot.rotation - drawn.spot.rotation) * Math.PI * largest) / 180,
  );
  const flags = rosette.arcs.every((arc, index) => drawn.arcs[index]?.flags.join() === arc.flags.join());
  return { scale: round(scale), translate: [round(tx), round(ty)], worst: Math.max(...deviations), flags };
}

/** FR-010's forbidden elements and attributes, and the reference's literal colours and rounded square, in a drawing. */
function forbidden(parts: readonly Part[]): { readonly elements: string[]; readonly attributes: string[]; readonly colours: string[] } {
  const banned = new Set(["rect", "use", "image", "foreignobject", "script"]);
  return {
    elements: parts.filter((part) => banned.has(part.name.toLowerCase())).map((part) => part.name),
    attributes: parts.flatMap((part) =>
      Object.keys(part.attributes)
        .filter((name) => ["style", "id", "href", "xlink:href"].includes(name.toLowerCase()) || /^on/i.test(name))
        .map((name) => `${part.name} ${name}`),
    ),
    colours: parts.flatMap((part) =>
      Object.entries(part.attributes)
        .filter(([, value]) => referenceColours.some((colour) => value.toUpperCase().includes(colour)))
        .map(([name, value]) => `${part.name} ${name}=${value}`),
    ),
  };
}

/** The mark's box with its drawing's placement. */
async function boxAndPlacement(driver: Driver, id: string): Promise<unknown> {
  const box = await driver.box(id);
  return { width: box.width, height: box.height, placement: await driver.placement(id) };
}

/** The drawing's scale in a box of side `side`: `viewBox="4 4 92 92"` fitted to it, offset by the 4-unit origin. */
function fitted(width: number, height: number): unknown {
  const side = Math.min(width, height);
  const scale = side / 92;
  return { width, height, placement: { scaleX: round(scale), scaleY: round(scale), offsetX: round((width - side) / 2 - 4 * scale), offsetY: round((height - side) / 2 - 4 * scale) } };
}

const markShown = { width: iconSize, height: iconSize, display: "inline-block" };

/** The shadow root of a drawn mark: one `svg` with four arcs and one ellipse. */
const drawnChildren = { children: ["svg"], parts: ["path", "path", "path", "path", "ellipse"] };

async function drawn(driver: Driver, id: string): Promise<unknown> {
  const drawing = await driver.drawing(id);
  return { children: drawing.children, parts: drawing.svg?.parts.map((part) => part.name) ?? [] };
}

export const brandMarkScenarios: readonly Scenario[] = [
  {
    name: "SC-001, US4 Independent Test: the three variants each draw the rosette, four arcs and a spot, in an icon-size box",
    run: async (driver) => {
      await driver.mount(variants.map(({ variant, attributes }) => `<p>Ocelle <ocelle-brand-mark id="sc-${variant}"${attributes}></ocelle-brand-mark></p>`).join(""));
      const observed: Record<string, unknown> = {};
      for (const { variant } of variants) observed[variant] = { drawing: await drawn(driver, `sc-${variant}`), box: size(await driver.box(`sc-${variant}`)) };
      return observed;
    },
    expected: Object.fromEntries(variants.map(({ variant }) => [variant, { drawing: drawnChildren, box: markShown }])),
  },
  ...(["light", "dark"] as const).map(
    (theme): Scenario => ({
      name: `US4-1: on each main ground in ${theme}, the ring is painted with --ocelle-color-ink and the spot with --ocelle-color-accent (FR-024, FR-025)`,
      run: async (driver) => {
        await driver.mount(groundMarkup(mainGrounds, ""));
        await driver.theme(theme);
        await groundsOn(driver, mainGrounds);
        return observeGrounds(driver, mainGrounds);
      },
      expected: groundsExpected(mainGrounds, theme, "color-ink"),
    }),
  ),
  ...(["light", "dark"] as const).map(
    (theme): Scenario => ({
      name: `US4-2: ground="chrome" on color-chrome and color-chrome-hover in ${theme}: the ring is painted with --ocelle-color-chrome-ink and the spot with --ocelle-color-accent (FR-025)`,
      run: async (driver) => {
        await driver.mount(groundMarkup(chromeGrounds, ' ground="chrome"'));
        await driver.theme(theme);
        await groundsOn(driver, chromeGrounds);
        return observeGrounds(driver, chromeGrounds);
      },
      expected: groundsExpected(chromeGrounds, theme, "color-chrome-ink"),
    }),
  ),
  {
    name: 'US4-3: tone="mono" paints ring and spot in the inherited text colour, on a main ground and on the chrome alike (FR-025)',
    run: async (driver) => {
      await driver.mount(
        '<p id="mono-main">Ocelle <ocelle-brand-mark id="mono-on-main" tone="mono"></ocelle-brand-mark></p>' +
          '<p id="mono-chrome">Ocelle <ocelle-brand-mark id="mono-on-chrome" tone="mono"></ocelle-brand-mark></p>',
      );
      await driver.style("mono-main", "background-color", "var(--ocelle-color-canvas)");
      await driver.style("mono-main", "color", "var(--ocelle-color-link)");
      await driver.style("mono-chrome", "background-color", "var(--ocelle-color-chrome)");
      await driver.style("mono-chrome", "color", "var(--ocelle-color-chrome-muted)");
      return { main: await markPaint(driver, "mono-on-main"), chrome: await markPaint(driver, "mono-on-chrome") };
    },
    expected: {
      main: painted(tokenColour("color-link", "light"), tokenColour("color-link", "light")),
      chrome: painted(tokenColour("color-chrome-muted", "light"), tokenColour("color-chrome-muted", "light")),
    },
  },
  ...(["dark", "light"] as const).map(
    (palette): Scenario => ({
      name: `US4-5: in forced colours with the ${palette} palette every variant paints ring and spot in the system colour of text, link, button and disabled button, the spot a visible filled shape inside the ring (FR-027)`,
      run: async (driver) => {
        await driver.mount(forcedMarkup());
        return forcedObservation(driver, palette);
      },
      expected: forcedExpected(palette),
    }),
  ),
  {
    name: "US4-6: an unlabelled mark contributes no node and no name to its home link while its labelled twin is one image named Ocelle; a label is trimmed, and an empty or whitespace-only label leaves it unlabelled (FR-028)",
    run: async (driver) => {
      await driver.mount(
        '<p><a id="home" href="#home"><ocelle-brand-mark id="plain"></ocelle-brand-mark>Ocelle</a></p>' +
          '<p><ocelle-brand-mark id="named" label="Ocelle"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="spaced" label=" Ocelle "></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="empty" label=""></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="blank" label="  "></ocelle-brand-mark></p>',
      );
      const observed: Record<string, unknown> = { home: await driver.ax("home"), plainDrawn: await drawn(driver, "plain") };
      for (const id of ["plain", "named", "spaced", "empty", "blank"]) observed[id] = await driver.ax(id);
      return observed;
    },
    expected: { home: [{ role: "link", name: "Ocelle" }], plainDrawn: drawnChildren, plain: [], named: image("Ocelle"), spaced: image("Ocelle"), empty: [], blank: [] },
  },
  {
    name: "US4-7: the box is --ocelle-icon-size high and as wide; a host height alone gives a square, a host width alone a non-square box with the drawing at the smaller side, centred; 20 × 20 px in a column and a row flex container; block-size: 100% in a 48 px flex bar gives 48 × 48 px (FR-024)",
    run: async (driver) => {
      await driver.mount(
        '<p>Ocelle <ocelle-brand-mark id="plain"></ocelle-brand-mark></p>' +
          '<p>Ocelle <ocelle-brand-mark id="tall"></ocelle-brand-mark></p>' +
          '<p>Ocelle <ocelle-brand-mark id="wide"></ocelle-brand-mark></p>' +
          '<div id="column"><ocelle-brand-mark id="in-column"></ocelle-brand-mark></div>' +
          '<div id="row"><ocelle-brand-mark id="in-row"></ocelle-brand-mark><span>Ocelle</span></div>' +
          '<div id="bar"><ocelle-brand-mark id="in-bar"></ocelle-brand-mark><span>Ocelle</span></div>',
      );
      await driver.style("tall", "block-size", "32px");
      await driver.style("wide", "inline-size", "32px");
      for (const id of ["column", "row", "bar"]) {
        await driver.style(id, "display", "flex");
        await driver.style(id, "inline-size", "300px");
      }
      await driver.style("column", "flex-direction", "column");
      await driver.style("bar", "align-items", "center");
      await driver.style("bar", "block-size", "48px");
      await driver.style("in-bar", "block-size", "100%");
      const observed: Record<string, unknown> = {};
      for (const id of ["plain", "tall", "wide", "in-column", "in-row", "in-bar"]) observed[id] = await boxAndPlacement(driver, id);
      return observed;
    },
    expected: {
      plain: fitted(iconSize, iconSize),
      tall: fitted(32, 32),
      wide: fitted(32, iconSize),
      "in-column": fitted(iconSize, iconSize),
      "in-row": fitted(iconSize, iconSize),
      "in-bar": fitted(48, 48),
    },
  },
  {
    name: "US4-8: unknown ground and tone values render the default main-ground variant, beside a chrome twin painted in chrome ink (FR-025)",
    run: async (driver) => {
      await driver.mount(
        '<p><ocelle-brand-mark id="ground-upper" ground="Chrome"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="ground-other" ground="dark"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="ground-empty" ground=""></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="ground-spaced" ground=" chrome"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="tone-upper" tone="Mono"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="tone-other" tone="duo"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="chrome-twin" ground="chrome"></ocelle-brand-mark></p>',
      );
      const observed: Record<string, unknown> = {};
      for (const id of ["ground-upper", "ground-other", "ground-empty", "ground-spaced", "tone-upper", "tone-other", "chrome-twin"]) observed[id] = await markPaint(driver, id);
      return observed;
    },
    expected: {
      ...Object.fromEntries(
        ["ground-upper", "ground-other", "ground-empty", "ground-spaced", "tone-upper", "tone-other"].map((id) => [id, painted(tokenColour("color-ink", "light"), tokenColour("color-accent", "light"))]),
      ),
      "chrome-twin": painted(tokenColour("color-chrome-ink", "light"), tokenColour("color-accent", "light")),
    },
  },
  {
    name: "US4-9: the drawing is the reference's rosette, four round-capped open arcs and one rotated ellipse, equal up to one scale and translation within 0.5 % of its width, with none of the reference's colours, no rounded square and none of FR-010's forbidden content (FR-010, FR-024)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-brand-mark id="mark"></ocelle-brand-mark></p>');
      const parts = await driver.elements("mark");
      const svg = parts.find((part) => part.name === "svg");
      const paths = parts.filter((part) => part.name === "path");
      const ellipses = parts.filter((part) => part.name === "ellipse");
      const arcs = paths.map((part) => arcOf(part.attributes.d ?? "", part.attributes["stroke-width"]));
      const spot = ellipses[0] === undefined ? undefined : spotOf(ellipses[0].attributes);
      const width = Number((svg?.attributes.viewBox ?? "").trim().split(/\s+/)[2]);
      const matched = spot === undefined || arcs.some((arc) => arc === undefined) ? undefined : fit({ arcs: arcs as Arc[], spot }, referenceRosette() as { arcs: Arc[]; spot: Spot });
      return {
        viewBox: svg?.attributes.viewBox,
        hidden: svg?.attributes["aria-hidden"],
        parts: parts.map((part) => part.name),
        arcs: paths.map((part) => ({ cap: part.attributes["stroke-linecap"], fill: part.attributes.fill, arc: arcOf(part.attributes.d ?? "", part.attributes["stroke-width"]) !== undefined })),
        rotated: spot !== undefined && spot.rotation !== 0,
        fit: matched === undefined ? undefined : { scale: matched.scale, translate: matched.translate, flags: matched.flags, within: matched.worst <= 0.005 * width },
        forbidden: forbidden(parts),
      };
    },
    expected: {
      viewBox: "4 4 92 92",
      hidden: "true",
      parts: ["svg", "path", "path", "path", "path", "ellipse"],
      arcs: Array.from({ length: 4 }, () => ({ cap: "round", fill: "none", arc: true })),
      rotated: true,
      fit: { scale: 1, translate: [0, 0], flags: true, within: true },
      forbidden: { elements: [], attributes: [], colours: [] },
    },
  },
  {
    name: "US4-13: setting ground, tone and label by property reflects ground and tone, not label, names the mark Ocelle, and mono wins over chrome on color-chrome in another text colour (FR-025, FR-028)",
    run: async (driver) => {
      await driver.mount('<p id="bar">Ocelle <ocelle-brand-mark id="prop-mark"></ocelle-brand-mark></p>');
      await driver.style("bar", "background-color", "var(--ocelle-color-chrome)");
      await driver.style("bar", "color", "var(--ocelle-color-chrome-muted)");
      const before = { ax: await driver.ax("prop-mark"), paint: await markPaint(driver, "prop-mark") };
      await driver.setProperty("prop-mark", "ground", "chrome");
      const chrome = await markPaint(driver, "prop-mark");
      await driver.setProperty("prop-mark", "tone", "mono");
      await driver.setProperty("prop-mark", "label", "Ocelle");
      return {
        before,
        chrome,
        ground: await driver.attribute("prop-mark", "ground"),
        tone: await driver.attribute("prop-mark", "tone"),
        label: await driver.attribute("prop-mark", "label"),
        ax: await driver.ax("prop-mark"),
        mono: await markPaint(driver, "prop-mark"),
      };
    },
    expected: {
      before: { ax: [], paint: painted(tokenColour("color-ink", "light"), tokenColour("color-accent", "light")) },
      chrome: painted(tokenColour("color-chrome-ink", "light"), tokenColour("color-accent", "light")),
      ground: "chrome",
      tone: "mono",
      label: null,
      ax: image("Ocelle"),
      mono: painted(tokenColour("color-chrome-muted", "light"), tokenColour("color-chrome-muted", "light")),
    },
  },
  {
    name: "US4-14: a host aria-label names the mark, an empty one or a blank one beside a label leaves it unlabelled, and aria-hidden hides a labelled mark beside its shown twin (FR-034)",
    run: async (driver) => {
      await driver.mount(
        '<p><ocelle-brand-mark id="aria-mark" aria-label="Ocelle"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="aria-empty-mark" aria-label=""></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="blank-labelled-mark" label="Ocelle" aria-label=" "></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="hidden-mark" label="Ocelle" aria-hidden="true"></ocelle-brand-mark>' +
          '<ocelle-brand-mark id="shown-mark" label="Ocelle"></ocelle-brand-mark></p>',
      );
      const observed: Record<string, unknown> = {};
      for (const id of ["aria-mark", "aria-empty-mark", "blank-labelled-mark", "hidden-mark", "shown-mark"]) observed[id] = await driver.ax(id);
      await driver.setAttribute("blank-labelled-mark", "aria-label", null);
      return { observed, blankRemoved: await driver.ax("blank-labelled-mark") };
    },
    expected: {
      observed: { "aria-mark": image("Ocelle"), "aria-empty-mark": [], "blank-labelled-mark": [], "hidden-mark": [], "shown-mark": image("Ocelle") },
      blankRemoved: image("Ocelle"),
    },
  },
  {
    name: "US4-15: a hidden labelled mark has no box and no node beside its visible twin, which is the icon size and one image node (FR-034)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-brand-mark id="hidden-attr-mark" label="Ocelle" hidden></ocelle-brand-mark> <ocelle-brand-mark id="visible-mark" label="Ocelle"></ocelle-brand-mark></p>');
      const hidden = { box: size(await driver.box("hidden-attr-mark")), ax: await driver.ax("hidden-attr-mark") };
      const visible = { box: size(await driver.box("visible-mark")), ax: await driver.ax("visible-mark") };
      await driver.setAttribute("hidden-attr-mark", "hidden", null);
      return { hidden, visible, unhidden: { box: size(await driver.box("hidden-attr-mark")), ax: await driver.ax("hidden-attr-mark") } };
    },
    expected: {
      hidden: { box: { width: 0, height: 0, display: "none" }, ax: [] },
      visible: { box: markShown, ax: image("Ocelle") },
      unhidden: { box: markShown, ax: image("Ocelle") },
    },
  },
];
