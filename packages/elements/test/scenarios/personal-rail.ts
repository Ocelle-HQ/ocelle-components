// The shared bodies of 011 User Story 4's personal-rail scenarios (spec US4-1 to US4-11; FR-001 to FR-006, FR-024 to
// FR-028; research.md R-03, R-10, R-11, R-13; T041). Each body observes the page through the driver and returns one
// observation; each harness asserts it equals `expected`, written by hand from the spec: lengths and colours as the
// token names the spec gives (scenarios/layout.ts reads each token on the same page), the landmark names the page sets,
// and "does not" outcomes always in the same body as the positive outcome they guard (spec § "Does not" outcomes are
// paired; contracts/checks.md § Pairing plants):
// - the divider is absent unless both groups are non-empty, and an empty group takes no space (US4-6) beside the rail
//   with both groups and its divider; plants: the divider shown when either group is filled, the wrapper of an empty
//   slot not hidden;
// - a vertical rail is not held at a shorter flex-row or grid container's size, its bottom group not outside its box
//   (US4-2) beside the rail filling 600 px block, flex-row and grid containers; plant: `align-self: start` dropped;
// - the rail keeps its orientation at every width (US4-4) beside each orientation drawing its layout; plants: a
//   `@media (max-width: 720px)` flip, and a `@container (max-width: 720px)` flip on a host of `container-type:
//   inline-size`;
// - an orientation change keeps focus, order and the landmark (US4-5) beside the layout changing; plant: the template
//   re-rendered with new nodes per orientation;
// - an empty or invalid `orientation` is not rewritten and draws the vertical rail (US4-8, FR-006) beside the
//   horizontal twin's row; plants: the row keyed on `:host(:not([orientation="vertical"]))`, the element rewriting the
//   value; no attribute written on upgrade beside the property reflecting; plant: an initializer on the property;
// - the horizontal rail keeps its row in forced colours (US4-9) beside the divider in a system colour; plant: the
//   layout rule moved inside `@media not (forced-colors: active)`;
// - the README's example uses an exclusive bound (US4-10): vertical at the bound beside horizontal 1 px below; plant:
//   the README's `matchMedia("(width < Npx)")` rewritten to `(max-width: Npx)`;
// - no horizontal scroll and no clipped text or link at 320 px (US4-7) beside the rows the spec lays out;
// - one navigation landmark per rail, no other node carrying its name, a blank host `aria-label` leaving it unnamed, the
//   host `aria-label` never written or removed (US4-1, US4-11, FR-028) beside the named landmarks; plants: an inner
//   `<nav>` with the name, the element replacing a blank host `aria-label`, the element writing `aria-label`;
// - no tab stop of the element's own (US4-5) beside focus reaching each slotted link in order;
// - no event (FR-002) across mount, slot, orientation and label changes, beside the change each step makes.
// Every item is a stand-in `<a>` sized by the linked same-origin stylesheet test/browser/fixtures/rail-items.css under
// `[data-story="rail-items"]` (research.md R-10): a `--ocelle-size-rail-item` square with `color: inherit`. Every
// mount wraps its markup in that root. A divider is read from the rendered pixels of the rail's border box: a run of
// rows (vertical) or columns (horizontal) of the content box every pixel of which is the divider's colour. Every
// scenario runs at 1280 × 800 px unless it sets the viewport itself.
/// <reference types="vite/client" />
import { expect } from "vitest";
import readmeText from "../../README.md?raw";
import type { Scenario } from "./icon.ts";
import { systemColours } from "./icon.ts";
import type { Box, Driver, Palette, Pixels } from "./driver.ts";
import { after, below, boxes, inOrder, lengthIs, pick, probe, tenth, tokenColour, tokenPx, tokensOf } from "./layout.ts";
import { sentinelRules } from "./section-header.ts";

/** A rail scenario and the page it runs on: the plain rail page, or the one that also links `base.css`. */
export interface RailScenario extends Scenario {
  readonly base: boolean;
}

/** A personal rail with `id`, its children and its attributes. */
export const rail = (id: string, inner: string, attributes = ""): string => `<ocelle-personal-rail id="${id}"${attributes}>${inner}</ocelle-personal-rail>`;

/** The stand-in items' root (research.md R-10): the rail-items stylesheet sizes the `<a>` items under it. */
export const stage = (inner: string): string => `<div data-story="rail-items">${inner}</div>`;

/** A container `<id>-box` around `inner`; the scenario sizes it. */
const box = (id: string, inner: string): string => `<div id="${id}-box">${inner}</div>`;

/** The `n`-th primary item `<id>-p<n>`, a stand-in link named by its number. */
const primary = (id: string, n: number): string => `<a id="${id}-p${String(n)}" href="#${id}-p${String(n)}">${String(n)}</a>`;

/** The `n`-th bottom item `<id>-b<n>`, a stand-in link in the `bottom` slot. */
const bottom = (id: string, n: number): string => `<a id="${id}-b${String(n)}" href="#${id}-b${String(n)}" slot="bottom">${n === 1 ? "Me" : `B${String(n)}`}</a>`;

/** Primary items 1 to `count` of rail `id`. */
const primaries = (id: string, count = 3): string => Array.from({ length: count }, (_, at) => primary(id, at + 1)).join("");

/** Bottom items 1 to `count` of rail `id`. */
const bottoms = (id: string, count = 1): string => Array.from({ length: count }, (_, at) => bottom(id, at + 1)).join("");

/** The ids of primary items 1 to `count` of rail `id`. */
const pids = (id: string, count = 3): string[] => Array.from({ length: count }, (_, at) => `${id}-p${String(at + 1)}`);

/** The ids of bottom items 1 to `count` of rail `id`. */
const bids = (id: string, count = 1): string[] => Array.from({ length: count }, (_, at) => `${id}-b${String(at + 1)}`);

/** Three primary items and one bottom item. */
const full = (id: string): string => primaries(id) + bottoms(id);

/** Mounts `markup` inside the stand-in root, with the probe after it. */
const mount = (driver: Driver, markup: string, base = false): Promise<void> => driver.mount(stage(markup) + probe, { base });

/** A CSS colour `rgb(r, g, b)` as its three channels. */
function channels(colour: string): number[] {
  const found = /rgba?\((\d+), (\d+), (\d+)/.exec(colour);
  if (found === null) throw new Error(`not an rgb() colour: ${colour}`);
  return [found[1], found[2], found[3]].map(Number);
}

/** The colour of the pixel at `x`, `y` of `image`, as `rgb(r, g, b)`. */
function pixelAt(image: Pixels, x: number, y: number): string {
  const at = (Math.floor(y) * image.width + Math.floor(x)) * 4;
  return `rgb(${String(image.data[at])}, ${String(image.data[at + 1])}, ${String(image.data[at + 2])})`;
}

/** A run of rows or columns of one colour: its offset from the rail's border-box edge and its thickness, in px. */
interface Run {
  readonly at: number;
  readonly thickness: number;
}

/**
 * The runs of `image` in which every pixel from `from` to `to` (exclusive) across the run's direction is `colour`:
 * rows when `across` is "rows" (a divider in the inline direction of a vertical rail), else columns.
 */
function runsIn(image: Pixels, colour: string, across: "rows" | "columns", from: number, to: number): Run[] {
  const [r, g, b] = channels(colour);
  const lines = across === "rows" ? image.height : image.width;
  const runs: { at: number; thickness: number }[] = [];
  for (let line = 0; line < lines; line++) {
    let ruled = to > from;
    for (let step = Math.max(0, Math.ceil(from)); step < Math.floor(to) && ruled; step++) {
      const at = across === "rows" ? (line * image.width + step) * 4 : (step * image.width + line) * 4;
      ruled = image.data[at] === r && image.data[at + 1] === g && image.data[at + 2] === b;
    }
    const last = runs.at(-1);
    if (ruled && last !== undefined && last.at + last.thickness === line) last.thickness += 1;
    else if (ruled) runs.push({ at: line, thickness: 1 });
  }
  return runs;
}

/** The used padding of the element with `id`, in px: block start, inline end, block end, inline start (LTR). */
async function paddingOf(driver: Driver, id: string): Promise<{ top: number; right: number; bottom: number; left: number }> {
  const [top, right, bottom, left] = await inOrder(["top", "right", "bottom", "left"], async (side) => Number.parseFloat(await driver.computed(id, `padding-${side}`)));
  return { top: top ?? 0, right: right ?? 0, bottom: bottom ?? 0, left: left ?? 0 };
}

/**
 * The dividers of rail `id` in `colour` (`--ocelle-color-chrome-muted` unless given): the runs across its content
 * box, rows for a vertical rail and columns for a horizontal one, each as its offset from the border-box edge and its
 * thickness as a token name when it is `--ocelle-border-width`.
 */
async function dividersOf(driver: Driver, id: string, across: "rows" | "columns", colour?: string): Promise<{ readonly at: number[]; readonly thickness: string[] }> {
  const pad = await paddingOf(driver, id);
  const image = await driver.pixels(id);
  const runs = across === "rows" ? runsIn(image, colour ?? (await tokenColour(driver, "color-chrome-muted")), "rows", pad.left, image.width - pad.right) : runsIn(image, colour ?? (await tokenColour(driver, "color-chrome-muted")), "columns", pad.top, image.height - pad.bottom);
  return { at: runs.map((run) => run.at), thickness: await inOrder(runs, (run) => lengthIs(driver, run.thickness, "border-width")) };
}

/**
 * How rail `id` lays out the items `ids` (primary then bottom, in document order): "column" when each lies under the
 * one before it at the same inline position, "row" when each lies after the one before it in the reading direction on
 * the same line, else "other"; and whether the rail is `--ocelle-shell-rail-width` wide (the vertical rail).
 */
async function shapeOf(driver: Driver, id: string, ids: readonly string[], rtl = false): Promise<{ readonly direction: string; readonly narrow: boolean }> {
  const host = await driver.box(id);
  const read = await boxes(driver, ids);
  const list = ids.map((each) => pick(read, each));
  const first = list[0];
  if (first === undefined) throw new Error("no item to lay out");
  const column = list.every((item, at) => at === 0 || (Math.abs(item.x - first.x) < 0.5 && item.y >= (list[at - 1]?.y ?? 0) + (list[at - 1]?.height ?? 0) - 0.5));
  const row = list.every((item, at) => at === 0 || (Math.abs(item.y - first.y) < 0.5 && after(list[at - 1] ?? item, item, rtl) >= -0.5));
  return { direction: column ? "column" : row ? "row" : "other", narrow: tenth(host.width) === tenth(await tokenPx(driver, "shell-rail-width")) };
}

const vertical = { direction: "column", narrow: true };
const horizontal = { direction: "row", narrow: false };

/** Whether `inner` lies inside `outer`, to a tenth of a pixel. */
const inside = (inner: Box, outer: Box): boolean => tenth(inner.x - outer.x) >= 0 && tenth(inner.y - outer.y) >= 0 && tenth(outer.x + outer.width - (inner.x + inner.width)) >= 0 && tenth(outer.y + outer.height - (inner.y + inner.height)) >= 0;

/**
 * The vertical layout of rail `id` (FR-024, FR-025, US4-2): its ground, ink and padding; its width and content box;
 * the primary items in a column from the content box's block start and the bottom items in a column ending at its
 * block end, `--ocelle-space-1` apart, each centred across the rail inside its content box in the chrome ink; the
 * divider `--ocelle-space-1` after the last primary item; and, with `free`, free space between the divider and the
 * bottom group, else `--ocelle-space-1`.
 */
async function verticalOf(driver: Driver, id: string, primary: readonly string[], bottom: readonly string[], free: boolean): Promise<unknown> {
  const host = await driver.box(id);
  const pad = await paddingOf(driver, id);
  const read = await boxes(driver, [...primary, ...bottom]);
  const items = [...primary, ...bottom].map((each) => pick(read, each));
  const content: Box = { x: host.x + pad.left, y: host.y + pad.top, width: host.width - pad.left - pad.right, height: host.height - pad.top - pad.bottom, display: host.display };
  const gaps = async (group: readonly string[]): Promise<string[]> => inOrder(group.slice(1), (each, at) => lengthIs(driver, below(pick(read, group[at] ?? each), pick(read, each)), "space-1"));
  const lastPrimary = primary.at(-1);
  const firstBottom = bottom[0];
  const lastBottom = bottom.at(-1);
  const dividers = await dividersOf(driver, id, "rows");
  const divider = dividers.at[0];
  const rule = await tokenPx(driver, "border-width");
  return {
    paint: await tokensOf(driver, id, { "background-color": "color-chrome", color: "color-chrome-ink" }),
    padding: await tokensOf(driver, id, { "padding-top": "space-2", "padding-bottom": "space-2", "padding-left": "space-1", "padding-right": "space-1" }),
    width: await lengthIs(driver, host.width, "shell-rail-width"),
    contentBox: await lengthIs(driver, content.width, "target-min"),
    primaryStart: primary[0] === undefined ? null : tenth(pick(read, primary[0]).y - content.y),
    primaryGaps: await gaps(primary),
    bottomEnd: lastBottom === undefined ? null : tenth(content.y + content.height - (pick(read, lastBottom).y + pick(read, lastBottom).height)),
    bottomGaps: await gaps(bottom),
    centred: items.map((item) => tenth(item.x - host.x - (host.x + host.width - (item.x + item.width)))),
    inside: items.map((item) => inside(item, content)),
    ink: await inOrder([...primary, ...bottom], async (each) => (await tokensOf(driver, each, { color: "color-chrome-ink" })).color),
    dividers: dividers.thickness,
    dividerAfterPrimary: lastPrimary === undefined || divider === undefined ? null : await lengthIs(driver, divider - (pick(read, lastPrimary).y + pick(read, lastPrimary).height - host.y), "space-1"),
    toBottom:
      firstBottom === undefined || divider === undefined
        ? null
        : free
          ? pick(read, firstBottom).y - host.y - (divider + rule) > (await tokenPx(driver, "space-1")) + 0.5
          : await lengthIs(driver, pick(read, firstBottom).y - host.y - (divider + rule), "space-1"),
  };
}

/** What `verticalOf` reads on a rail of `primary` and `bottom` item counts, as the spec states it. */
function verticalExpected(primary: number, bottom: number, free: boolean): unknown {
  const both = primary > 0 && bottom > 0;
  return {
    paint: { "background-color": "color-chrome", color: "color-chrome-ink" },
    padding: { "padding-top": "space-2", "padding-bottom": "space-2", "padding-left": "space-1", "padding-right": "space-1" },
    width: "shell-rail-width",
    contentBox: "target-min",
    primaryStart: primary > 0 ? 0 : null,
    primaryGaps: Array.from({ length: Math.max(0, primary - 1) }, () => "space-1"),
    bottomEnd: bottom > 0 ? 0 : null,
    bottomGaps: Array.from({ length: Math.max(0, bottom - 1) }, () => "space-1"),
    centred: Array.from({ length: primary + bottom }, () => 0),
    inside: Array.from({ length: primary + bottom }, () => true),
    ink: Array.from({ length: primary + bottom }, () => "color-chrome-ink"),
    dividers: both ? ["border-width"] : [],
    dividerAfterPrimary: both ? "space-1" : null,
    toBottom: both ? (free ? true : "space-1") : null,
  };
}

/**
 * The horizontal layout of rail `id` in a container `container` (FR-025, US4-3): its ground, ink and padding; its
 * border box the container's inline size; the primary items in a row from the content box's inline start and the
 * bottom items in a row ending at its inline end, `--ocelle-space-1` apart, each centred in the block direction and
 * in the chrome ink; the divider a column over the content box's block size, `--ocelle-space-1` before the bottom
 * group.
 */
async function horizontalOf(driver: Driver, id: string, container: string, primary: readonly string[], bottom: readonly string[], rtl: boolean): Promise<unknown> {
  const host = await driver.box(id);
  const outer = await driver.box(container);
  const read = await boxes(driver, [...primary, ...bottom]);
  const items = [...primary, ...bottom].map((each) => pick(read, each));
  const start = (item: Box): number => (rtl ? host.x + host.width - (item.x + item.width) : item.x - host.x);
  const end = (item: Box): number => (rtl ? item.x - host.x : host.x + host.width - (item.x + item.width));
  const gaps = async (group: readonly string[]): Promise<string[]> => inOrder(group.slice(1), (each, at) => lengthIs(driver, after(pick(read, group[at] ?? each), pick(read, each), rtl), "space-1"));
  const firstBottom = bottom[0];
  const lastBottom = bottom.at(-1);
  const dividers = await dividersOf(driver, id, "columns");
  const divider = dividers.at[0];
  const rule = await tokenPx(driver, "border-width");
  // The divider's offset from the inline start of the border box, in the reading direction.
  const dividerStart = divider === undefined ? undefined : rtl ? host.width - (divider + rule) : divider;
  return {
    paint: await tokensOf(driver, id, { "background-color": "color-chrome", color: "color-chrome-ink" }),
    padding: await tokensOf(driver, id, { "padding-top": "space-2", "padding-bottom": "space-2", "padding-left": "space-2", "padding-right": "space-2" }),
    fills: tenth(host.width - outer.width),
    primaryStart: primary[0] === undefined ? null : await lengthIs(driver, start(pick(read, primary[0])), "space-2"),
    primaryGaps: await gaps(primary),
    bottomEnd: lastBottom === undefined ? null : await lengthIs(driver, end(pick(read, lastBottom)), "space-2"),
    bottomGaps: await gaps(bottom),
    centred: items.map((item) => tenth(item.y - host.y - (host.y + host.height - (item.y + item.height)))),
    ink: await inOrder([...primary, ...bottom], async (each) => (await tokensOf(driver, each, { color: "color-chrome-ink" })).color),
    dividers: dividers.thickness,
    dividerBeforeBottom: firstBottom === undefined || dividerStart === undefined ? null : await lengthIs(driver, start(pick(read, firstBottom)) - (dividerStart + rule), "space-1"),
  };
}

/** What `horizontalOf` reads on a rail of `primary` and `bottom` item counts, as the spec states it. */
function horizontalExpected(primary: number, bottom: number): unknown {
  const both = primary > 0 && bottom > 0;
  return {
    paint: { "background-color": "color-chrome", color: "color-chrome-ink" },
    padding: { "padding-top": "space-2", "padding-bottom": "space-2", "padding-left": "space-2", "padding-right": "space-2" },
    fills: 0,
    primaryStart: primary > 0 ? "space-2" : null,
    primaryGaps: Array.from({ length: Math.max(0, primary - 1) }, () => "space-1"),
    bottomEnd: bottom > 0 ? "space-2" : null,
    bottomGaps: Array.from({ length: Math.max(0, bottom - 1) }, () => "space-1"),
    centred: Array.from({ length: primary + bottom }, () => 0),
    ink: Array.from({ length: primary + bottom }, () => "color-chrome-ink"),
    dividers: both ? ["border-width"] : [],
    dividerBeforeBottom: both ? "space-1" : null,
  };
}

/** The navigation nodes of the subtree of the element with `id`, and the other nodes that carry one of `names`. */
async function landmarksOf(driver: Driver, id: string, names: readonly string[]): Promise<{ readonly navigation: unknown[]; readonly others: unknown[] }> {
  const tree = await driver.axSubtree(id);
  return {
    navigation: tree.filter((node) => node.role === "navigation"),
    others: tree.filter((node) => node.role !== "navigation" && node.role !== "StaticText" && names.some((name) => node.name.includes(name))),
  };
}

/** The `aria-label` attribute of each element of `of`, or null. */
const ariaLabels = (driver: Driver, of: readonly string[]): Promise<(string | null)[]> => inOrder(of, (id) => driver.attribute(id, "aria-label"));

/**
 * The README's orientation example (FR-026, US4-10): the first `js` code block of its `ocelle-personal-rail` section
 * (located as the readme test locates sections) that calls `matchMedia`, or "" when there is none.
 */
export function orientationExample(readme: string): string {
  const section = /^## `ocelle-personal-rail`\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(readme)?.[1] ?? "";
  return [...section.matchAll(/^```js\n([\s\S]*?)^```$/gm)].map((block) => block[1] ?? "").find((code) => code.includes("matchMedia(")) ?? "";
}

/**
 * Where the keyboard focus ring of the focused item `item` of rail `id` is drawn (US4-2, US4-3): the pixel at the
 * middle of the ring's width on each side (inline start, inline end, block start, block end, LTR), as the token name
 * `color-focus` when it is that colour, and whether the ring's outer edge lies inside the rail's border box.
 */
async function ringOf(driver: Driver, id: string, item: string): Promise<{ readonly sides: string[]; readonly inside: boolean }> {
  const host = await driver.box(id);
  const at = await driver.box(item);
  const reach = (await tokenPx(driver, "focus-offset")) + (await tokenPx(driver, "focus-width"));
  const middle = (await tokenPx(driver, "focus-offset")) + (await tokenPx(driver, "focus-width")) / 2;
  const image = await driver.pixels(id);
  const focus = await tokenColour(driver, "color-focus");
  const x = at.x - host.x;
  const y = at.y - host.y;
  const samples = [
    pixelAt(image, x - middle, y + at.height / 2),
    pixelAt(image, x + at.width + middle - 1, y + at.height / 2),
    pixelAt(image, x + at.width / 2, y - middle),
    pixelAt(image, x + at.width / 2, y + at.height + middle - 1),
  ];
  const ring: Box = { x: at.x - reach, y: at.y - reach, width: at.width + 2 * reach, height: at.height + 2 * reach, display: at.display };
  return { sides: samples.map((colour) => (colour === focus ? "color-focus" : colour)), inside: inside(ring, host) };
}

const themes: readonly Palette[] = ["light", "dark"];

/** The sentinel values of the token-sentinel scenario (research.md R-13): each token a distinct value of its type. */
const sentinels: Readonly<Record<string, string>> = {
  "color-chrome": "rgb(201, 202, 203)",
  "color-chrome-ink": "rgb(21, 22, 23)",
  "color-chrome-muted": "rgb(10, 11, 12)",
  "border-width": "3px",
  "shell-rail-width": "61px",
  "space-1": "5px",
  "space-2": "11px",
};

/** The scenarios of the plain rail page. */
const plain: Scenario[] = [
  {
    name: "US4-1: a rail with label=\"Personal\", three links in the default slot and one in bottom is exactly one navigation landmark named \"Personal\" holding the four links in document order, with no aria-label written on the host (FR-024, FR-028)",
    run: async (driver) => {
      await mount(driver, `<div id="page">${rail("me", full("me"), ' label="Personal"')}</div>`);
      return {
        tree: (await driver.axSubtree("me")).filter((node) => node.role !== "StaticText"),
        page: await landmarksOf(driver, "page", ["Personal"]),
        written: await driver.attribute("me", "aria-label"),
      };
    },
    expected: {
      tree: [
        { role: "navigation", name: "Personal" },
        { role: "link", name: "1" },
        { role: "link", name: "2" },
        { role: "link", name: "3" },
        { role: "link", name: "Me" },
      ],
      page: { navigation: [{ role: "navigation", name: "Personal" }], others: [] },
      written: null,
    },
  },
  ...themes.flatMap((theme) =>
    ([null, "vertical"] as const).map((orientation) => ({
      name: `US4-2, ${theme}, ${orientation === null ? "no orientation" : 'orientation="vertical"'}: in a 600 px container the rail is 600 px tall and --ocelle-shell-rail-width wide with a --ocelle-target-min content box, on --ocelle-color-chrome in --ocelle-color-chrome-ink, padded --ocelle-space-2 in the block direction and --ocelle-space-1 inline; the primary items run in a column from the block start and the bottom item ends at the content box's block end, each centred inside the content box in the chrome ink; one --ocelle-border-width divider in --ocelle-color-chrome-muted lies --ocelle-space-1 after the last primary item, with the free space between it and the bottom group (FR-024, FR-025, FR-027)`,
      run: async (driver: Driver) => {
        await mount(driver, box("tall", rail("tall", full("tall"), orientation === null ? "" : ` orientation="${orientation}"`)));
        await driver.theme(theme);
        await driver.size("tall-box", 320, 600);
        const host = await driver.box("tall");
        return { height: tenth(host.height), layout: await verticalOf(driver, "tall", pids("tall"), bids("tall"), true) };
      },
      expected: { height: 600, layout: verticalExpected(3, 1, true) },
    })),
  ),
  ...(["flex", "grid"] as const).map((kind) => ({
    name: `US4-2, a 600 px ${kind === "flex" ? "flex-row" : "grid"} container: the rail is 600 px tall with its bottom item's block end at the content box's block end, laid out as in a block container (FR-025; operator decision at the phase-1 spike)`,
    run: async (driver: Driver) => {
      await mount(driver, box("fill", rail("fill", full("fill"))));
      await driver.size("fill-box", 320, 600);
      await driver.style("fill-box", "display", kind);
      const host = await driver.box("fill");
      return { height: tenth(host.height), layout: await verticalOf(driver, "fill", pids("fill"), bids("fill"), true) };
    },
    expected: { height: 600, layout: verticalExpected(3, 1, true) },
  })),
  {
    name: "US4-2, taller than its container: in a block, a flex-row and a grid container 100 px tall, a vertical rail of six primary items and one bottom item is as tall as its content, the same as in a container of no set height, its bottom group following the primary group inside its border box (FR-025; operator decision at the phase-1 spike)",
    run: async (driver) => {
      const kinds = ["block", "flex", "grid"] as const;
      const tall = (id: string): string => rail(id, primaries(id, 6) + bottoms(id));
      // Side by side, so every rail's border box is inside the viewport when its pixels are read.
      await mount(driver, `<div id="kinds">${box("natural", tall("natural")) + kinds.map((kind) => box(kind, tall(kind))).join("")}</div>`);
      await driver.style("kinds", "display", "flex");
      await driver.style("kinds", "align-items", "flex-start");
      await driver.style("kinds", "gap", "16px");
      await driver.size("natural-box", 200, null);
      for (const kind of kinds) {
        await driver.size(`${kind}-box`, 200, 100);
        if (kind !== "block") await driver.style(`${kind}-box`, "display", kind);
      }
      const natural = await driver.box("natural");
      const grown = await inOrder(kinds, async (kind) => {
        const host = await driver.box(kind);
        const last = await driver.box(`${kind}-b1`);
        return {
          height: tenth(host.height - natural.height),
          layout: await verticalOf(driver, kind, pids(kind, 6), bids(kind), false),
          bottomInside: inside(last, host),
        };
      });
      return { taller: natural.height > 100, grown };
    },
    expected: { taller: true, grown: [0, 1, 2].map(() => ({ height: 0, layout: verticalExpected(6, 1, false), bottomInside: true })) },
  },
  ...(["ltr", "rtl"] as const).map((direction) => ({
    name: `US4-3, ${direction}: a rail with orientation="horizontal" in a container 600 px wide and 200 px tall fills its inline size and is as tall as its one row, padded --ocelle-space-2, the primary items in a row from the inline start and the bottom item at the inline end, each centred in the block direction in the chrome ink, with one --ocelle-border-width divider in --ocelle-color-chrome-muted over the content block size, --ocelle-space-1 before the bottom group (FR-025)`,
    run: async (driver: Driver) => {
      await mount(driver, `<div dir="${direction}">${box("row", rail("row", full("row"), ' orientation="horizontal"'))}</div>`);
      await driver.size("row-box", 600, 200);
      const host = await driver.box("row");
      const row = 2 * (await tokenPx(driver, "space-2")) + (await tokenPx(driver, "size-rail-item"));
      return { blockSize: tenth(host.height - row), layout: await horizontalOf(driver, "row", "row-box", pids("row"), bids("row"), direction === "rtl") };
    },
    expected: { blockSize: 0, layout: horizontalExpected(3, 1) },
  })),
  {
    name: "US4-4: through viewport and container widths of 721, 720, 719 and 320 px, a vertical rail stays a --ocelle-shell-rail-width column and a horizontal rail stays a row filling its container: the element has no viewport or container threshold (FR-026)",
    run: async (driver) => {
      await mount(driver, box("col", rail("col", full("col"))) + box("row", rail("row", full("row"), ' orientation="horizontal"')));
      try {
        return await inOrder([721, 720, 719, 320], async (width) => {
          await driver.viewport(width, 800);
          await driver.size("col-box", width, null);
          await driver.size("row-box", width, null);
          return {
            width,
            column: await shapeOf(driver, "col", [...pids("col"), ...bids("col")]),
            row: await shapeOf(driver, "row", [...pids("row"), ...bids("row")]),
            rowFills: tenth((await driver.box("row")).width - (await driver.box("row-box")).width),
          };
        });
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: [721, 720, 719, 320].map((width) => ({ width, column: vertical, row: horizontal, rowFills: 0 })),
  },
  {
    name: "US4-5: with focus on the rail's second link, setting orientation to horizontal and back by script lays the rail out as a row and then a column again, while focus stays on that link, the links keep their document and tab order with no tab stop of the element's own, and the landmark and its name are unchanged (FR-026)",
    run: async (driver) => {
      await mount(driver, '<a id="before" href="#before">Before</a>' + `<div id="page">${rail("turn", full("turn"), ' label="Personal"')}</div>` + '<button id="after" type="button">After</button>');
      const all = [...pids("turn"), ...bids("turn")];
      const order = async (): Promise<string[]> => {
        const seen: string[] = [];
        for (let press = 0; press < 6; press += 1) {
          await driver.tab();
          seen.push((await driver.activeElement()).id);
        }
        return seen;
      };
      const tabbed = await order();
      for (let press = 0; press < 3; press += 1) await driver.tab(true);
      const focused = (await driver.activeElement()).id;
      // The shadow nodes, numbered before the change: an orientation change keeps the same template (research.md R-10).
      const nodes = await driver.identities("turn");
      const same = async (): Promise<boolean> => nodes.length > 0 && (await driver.identities("turn")).join() === nodes.join();
      const before = { shape: await shapeOf(driver, "turn", all), tree: await landmarksOf(driver, "page", ["Personal"]) };
      await driver.setProperty("turn", "orientation", "horizontal");
      const turned = { focus: (await driver.activeElement()).id, shape: await shapeOf(driver, "turn", all), tree: await landmarksOf(driver, "page", ["Personal"]), kept: await same() };
      await driver.setProperty("turn", "orientation", "vertical");
      const back = { focus: (await driver.activeElement()).id, shape: await shapeOf(driver, "turn", all), tree: await landmarksOf(driver, "page", ["Personal"]), kept: await same() };
      await driver.setAttribute("turn", "orientation", "horizontal");
      const onward: string[] = [];
      for (let press = 0; press < 3; press += 1) {
        await driver.tab();
        onward.push((await driver.activeElement()).id);
      }
      return { tabbed, focused, before, turned, back, onward };
    },
    expected: {
      tabbed: ["before", "turn-p1", "turn-p2", "turn-p3", "turn-b1", "after"],
      focused: "turn-p2",
      before: { shape: vertical, tree: { navigation: [{ role: "navigation", name: "Personal" }], others: [] } },
      turned: { focus: "turn-p2", shape: horizontal, tree: { navigation: [{ role: "navigation", name: "Personal" }], others: [] }, kept: true },
      back: { focus: "turn-p2", shape: vertical, tree: { navigation: [{ role: "navigation", name: "Personal" }], others: [] }, kept: true },
      onward: ["turn-p3", "turn-b1", "after"],
    },
  },
  ...([null, "horizontal"] as const).map((orientation) => ({
    name: `US4-6, ${orientation ?? "vertical"}: a rail with an empty bottom slot has no divider and no space for the bottom group, one with both groups has its divider, and one with bottom items and an empty default slot has no divider and no space for the primary group, its bottom group at the ${orientation === null ? "block" : "inline"} end (FR-005, FR-025)`,
    run: async (driver: Driver) => {
      const attributes = orientation === null ? "" : ` orientation="${orientation}"`;
      await mount(driver, box("top", rail("top", primaries("top", 7), attributes)) + box("both", rail("both", full("both"), attributes)) + box("end", rail("end", bottoms("end", 2), attributes)) + box("tall", rail("tall", bottoms("tall", 2), attributes)));
      // 320 px: seven items and their gaps fill a horizontal rail's content box exactly, with no room for an empty group's gap.
      for (const id of ["top", "both", "end"]) await driver.size(`${id}-box`, 320, null);
      await driver.size("tall-box", 320, 600);
      const across = orientation === null ? "rows" : "columns";
      const item = await tokenPx(driver, "size-rail-item");
      const s1 = await tokenPx(driver, "space-1");
      const s2 = await tokenPx(driver, "space-2");
      const extent = async (id: string): Promise<number> => tenth((await driver.box(id)).height);
      // The rail's block size: its padding and its items only (a vertical rail's items stacked, a horizontal rail's one row).
      const content = (count: number): number => tenth(2 * s2 + (orientation === null ? count * item + (count - 1) * s1 : item));
      const tall = await driver.box("tall");
      const lastTall = await driver.box("tall-b2");
      const end = await driver.box("end");
      const lastEnd = await driver.box("end-b2");
      return {
        top: { dividers: (await dividersOf(driver, "top", across)).at.length, size: (await extent("top")) === content(7), shape: (await shapeOf(driver, "top", pids("top", 7))).direction },
        both: { dividers: (await dividersOf(driver, "both", across)).thickness, shape: (await shapeOf(driver, "both", [...pids("both"), ...bids("both")])).direction },
        end: {
          dividers: (await dividersOf(driver, "end", across)).at.length,
          size: (await extent("end")) === content(orientation === null ? 2 : 1),
          atEnd: orientation === null ? tenth(tall.y + tall.height - s2 - (lastTall.y + lastTall.height)) : await lengthIs(driver, end.x + end.width - (lastEnd.x + lastEnd.width), "space-2"),
        },
      };
    },
    expected: {
      top: { dividers: 0, size: true, shape: orientation === null ? "column" : "row" },
      both: { dividers: ["border-width"], shape: orientation === null ? "column" : "row" },
      end: { dividers: 0, size: true, atEnd: orientation === null ? 0 : "space-2" },
    },
  })),
  ...(["ltr", "rtl"] as const).map((direction) => ({
    name: `US4-7, ${direction}: at 320 px a horizontal rail with eight links in the default slot and two in bottom has no horizontal scroll and no clipped link or text; the two bottom links sit on one row at the inline end of the first row, the primary links fill the rest from the inline start and wrap onto a second row below it, and the divider runs over the content block size of both rows (FR-004, FR-025)`,
    run: async (driver: Driver) => {
      await mount(driver, `<div dir="${direction}">${rail("wrap", primaries("wrap", 8) + bottoms("wrap", 2), ' orientation="horizontal"')}</div>`);
      await driver.viewport(320, 800);
      try {
        const rtl = direction === "rtl";
        const host = await driver.box("wrap");
        const read = await boxes(driver, [...pids("wrap", 8), ...bids("wrap", 2)]);
        const p = pids("wrap", 8).map((id) => pick(read, id));
        const b = bids("wrap", 2).map((id) => pick(read, id));
        const [p1, b1, b2] = [p[0], b[0], b[1]];
        if (p1 === undefined || b1 === undefined || b2 === undefined) throw new Error("the items were not read");
        const rows = [...new Set(p.map((item) => tenth(item.y)))];
        const end = (item: Box): number => (rtl ? item.x - host.x : host.x + host.width - (item.x + item.width));
        const start = (item: Box): number => (rtl ? host.x + host.width - (item.x + item.width) : item.x - host.x);
        const s2 = await tokenPx(driver, "space-2");
        const item = await tokenPx(driver, "size-rail-item");
        const s1 = await tokenPx(driver, "space-1");
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          clipped: (await driver.textBoxes("wrap")).filter((line) => line.clipped).map((line) => line.text),
          linksInside: [...p, ...b].map((each) => inside(each, host) && each.x >= 0 && each.x + each.width <= 320),
          bottomRow: [tenth(b1.y - p1.y), tenth(b2.y - p1.y), await lengthIs(driver, end(b2), "space-2"), await lengthIs(driver, after(b1, b2, rtl), "space-1")],
          rows: rows.length,
          firstRow: [await lengthIs(driver, start(p1), "space-2"), tenth(p1.y - host.y - s2)],
          secondRowBelow: await lengthIs(driver, (rows[1] ?? 0) - (rows[0] ?? 0) - item, "space-1"),
          divider: (await dividersOf(driver, "wrap", "columns")).thickness,
          contentBlock: tenth(host.height - 2 * s2 - (2 * item + s1)),
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: {
      scrollWidth: true,
      clipped: [],
      linksInside: Array.from({ length: 10 }, () => true),
      bottomRow: [0, 0, "space-2", "space-1"],
      rows: 2,
      firstRow: ["space-2", 0],
      secondRowBelow: "space-1",
      divider: ["border-width"],
      contentBlock: 0,
    },
  })),
  {
    name: "FR-025, a bottom group wider than half the content box: at 320 px a horizontal rail with two primary links and five bottom links keeps its bottom group within half its content inline size at the inline end, its links wrapping onto a second line whose links also end at the inline end, the first line on the first row (US4-7)",
    run: async (driver) => {
      await mount(driver, rail("half", primaries("half", 2) + bottoms("half", 5), ' orientation="horizontal"'));
      await driver.viewport(320, 800);
      try {
        const host = await driver.box("half");
        const read = await boxes(driver, [...pids("half", 2), ...bids("half", 5)]);
        const b = bids("half", 5).map((id) => pick(read, id));
        const p1 = pick(read, "half-p1");
        const s2 = await tokenPx(driver, "space-2");
        const half = (host.width - 2 * s2) / 2;
        const lines = [...new Set(b.map((item) => tenth(item.y)))];
        const ends = await inOrder([b[2], b[4]], async (item) => (item === undefined ? "missing" : lengthIs(driver, host.x + host.width - (item.x + item.width), "space-2")));
        return {
          lines: lines.length,
          firstLine: b.slice(0, 3).map((item) => tenth(item.y - p1.y)),
          ends,
          withinHalf: host.x + host.width - s2 - Math.min(...b.map((item) => item.x)) <= half + 0.5,
          scrollWidth: (await driver.scrollWidth()) <= 320,
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { lines: 2, firstLine: [0, 0, 0], ends: ["space-2", "space-2"], withinHalf: true, scrollWidth: true },
  },
  {
    name: "US4-8 and FR-006: rails with orientation=\"\" and orientation=\"sideways\" are laid out vertically as one with no orientation, each keeping the value the page wrote, beside an orientation=\"horizontal\" twin laid out as a row",
    run: async (driver) => {
      await mount(driver, ["none", "empty", "sideways", "row"].map((id) => box(id, rail(id, full(id), { none: "", empty: ' orientation=""', sideways: ' orientation="sideways"', row: ' orientation="horizontal"' }[id]))).join(""));
      for (const id of ["none", "empty", "sideways", "row"]) await driver.size(`${id}-box`, 600, null);
      const shape = (id: string): Promise<unknown> => shapeOf(driver, id, [...pids(id), ...bids(id)]);
      return {
        none: await shape("none"),
        empty: await shape("empty"),
        sideways: await shape("sideways"),
        row: await shape("row"),
        kept: await inOrder(["none", "empty", "sideways", "row"], (id) => driver.attribute(id, "orientation")),
      };
    },
    expected: { none: vertical, empty: vertical, sideways: vertical, row: horizontal, kept: [null, "", "sideways", "horizontal"] },
  },
  {
    name: "FR-006, upgrade: a rail written with no orientation carries no orientation attribute after upgrade and is laid out vertically, while orientation = \"horizontal\" set by property reflects to the attribute and lays it out as a row",
    run: async (driver) => {
      await mount(driver, box("plain", rail("plain", full("plain"))) + box("set", rail("set", full("set"))));
      for (const id of ["plain", "set"]) await driver.size(`${id}-box`, 600, null);
      const written = await driver.attribute("plain", "orientation");
      await driver.setProperty("set", "orientation", "horizontal");
      return {
        written,
        plain: await shapeOf(driver, "plain", [...pids("plain"), ...bids("plain")]),
        reflected: await driver.attribute("set", "orientation"),
        set: await shapeOf(driver, "set", [...pids("set"), ...bids("set")]),
      };
    },
    expected: { written: null, plain: vertical, reflected: "horizontal", set: horizontal },
  },
  ...themes.map((palette) => ({
    name: `US4-9, forced colours with the ${palette} palette: a vertical rail's divider is drawn in the system text colour, unlike the canvas, and a horizontal rail is still laid out as a row with its divider in that colour (FR-001, FR-003)`,
    run: async (driver: Driver) => {
      await mount(driver, box("col", rail("col", full("col"))) + box("row", rail("row", full("row"), ' orientation="horizontal"')));
      await driver.size("col-box", 320, null);
      await driver.size("row-box", 600, null);
      await driver.forcedColors("active", palette);
      try {
        const text = systemColours[palette].CanvasText;
        return {
          column: { dividers: (await dividersOf(driver, "col", "rows", text)).thickness, shape: await shapeOf(driver, "col", [...pids("col"), ...bids("col")]) },
          row: { dividers: (await dividersOf(driver, "row", "columns", text)).thickness, shape: await shapeOf(driver, "row", [...pids("row"), ...bids("row")]) },
          unlikeCanvas: text !== (await driver.resolveColour("Canvas")),
        };
      } finally {
        await driver.forcedColors("none");
      }
    },
    expected: { column: { dividers: ["border-width"], shape: vertical }, row: { dividers: ["border-width"], shape: horizontal }, unlikeCanvas: true },
  })),
  {
    name: "US4-10: the README's orientation example, run on the page as a same-origin module, keeps the rail vertical with the viewport exactly at its matchMedia(\"(width < Npx)\") bound and makes it horizontal 1 px below (FR-026)",
    run: async (driver) => {
      const example = orientationExample(readmeText);
      expect(example, "the README's ocelle-personal-rail section holds the orientation example's js code block").toContain("matchMedia(");
      const bound = Number(/(\d+)px/.exec(example)?.[1] ?? "0");
      await mount(driver, rail("shell", full("shell"), ' label="Personal"'));
      try {
        await driver.viewport(bound, 800);
        await driver.module(example);
        await driver.viewport(bound, 800);
        const atBound = { orientation: await driver.attribute("shell", "orientation"), shape: await shapeOf(driver, "shell", [...pids("shell"), ...bids("shell")]) };
        await driver.viewport(bound - 1, 800);
        await driver.viewport(bound - 1, 800);
        const belowBound = { orientation: await driver.attribute("shell", "orientation"), shape: await shapeOf(driver, "shell", [...pids("shell"), ...bids("shell")]) };
        return { bounded: bound > 320, atBound, belowBound };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { bounded: true, atBound: { orientation: "vertical", shape: vertical }, belowBound: { orientation: "horizontal", shape: horizontal } },
  },
  {
    name: "US4-11: with aria-label=\"Personal\" only, label=\"Me\" with aria-label=\"Other\" and label=\"Me\" with a blank aria-label, the landmarks are named Personal, Other and unnamed, one per rail, no other node carries a name, and each host keeps the aria-label the page wrote; removing aria-label from the second and third names both Me (FR-028)",
    run: async (driver) => {
      await mount(driver, `<div id="page">${rail("one", full("one"), ' aria-label="Personal"')}${rail("two", full("two"), ' label="Me" aria-label="Other"')}${rail("three", full("three"), ' label="Me" aria-label=""')}</div>`);
      const names = ["Personal", "Other", "Me"];
      const hosts = ["one", "two", "three"];
      // The bottom link is named "Me" too; it is a link, not a node carrying a landmark's name, so it is left out.
      const tree = async (): Promise<unknown> => {
        const read = await landmarksOf(driver, "page", names);
        return { navigation: read.navigation, others: read.others.filter((node) => (node as { role: string }).role !== "link") };
      };
      const before = { tree: await tree(), kept: await ariaLabels(driver, hosts) };
      await driver.setAttribute("two", "aria-label", null);
      await driver.setAttribute("three", "aria-label", null);
      return { before, after: { tree: await tree(), kept: await ariaLabels(driver, hosts) }, links: (await driver.axSubtree("page")).filter((node) => node.role === "link").length };
    },
    expected: {
      before: { tree: { navigation: ["Personal", "Other", ""].map((name) => ({ role: "navigation", name })), others: [] }, kept: ["Personal", "Other", ""] },
      after: { tree: { navigation: ["Personal", "Me", "Me"].map((name) => ({ role: "navigation", name })), others: [] }, kept: ["Personal", null, null] },
      links: 12,
    },
  },
  {
    name: "token sentinels (research.md R-13): with --ocelle-color-chrome, --ocelle-color-chrome-ink, --ocelle-color-chrome-muted, --ocelle-border-width, --ocelle-shell-rail-width, --ocelle-space-1 and --ocelle-space-2 set to sentinels on the root, the ground, the ink of the rail and its items, the divider's colour and thickness, the width, the padding and the gaps follow them, and with them removed the rail draws its default again",
    run: async (driver) => {
      const markup = box("s", rail("s", full("s")));
      await mount(driver, markup);
      await driver.size("s-box", 320, null);
      await driver.rules(sentinelRules(sentinels));
      const read = await boxes(driver, ["s", "s-p1", "s-p2", "s-p3", "s-b1"]);
      const host = pick(read, "s");
      const sentinel = {
        ground: await driver.computed("s", "background-color"),
        ink: [await driver.computed("s", "color"), await driver.computed("s-p1", "color"), await driver.computed("s-b1", "color")],
        divider: runsIn(await driver.pixels("s"), "rgb(10, 11, 12)", "rows", 5, 56).map((run) => run.thickness),
        width: tenth(host.width),
        padding: [await driver.computed("s", "padding-top"), await driver.computed("s", "padding-left")],
        gap: tenth(below(pick(read, "s-p1"), pick(read, "s-p2"))),
        start: tenth(pick(read, "s-p1").y - host.y),
      };
      await mount(driver, markup);
      await driver.size("s-box", 320, null);
      return { sentinel, restored: await verticalOf(driver, "s", pids("s"), bids("s"), false) };
    },
    expected: {
      sentinel: {
        ground: "rgb(201, 202, 203)",
        ink: ["rgb(21, 22, 23)", "rgb(21, 22, 23)", "rgb(21, 22, 23)"],
        divider: [3],
        width: 61,
        padding: ["11px", "5px"],
        gap: 5,
        start: 11,
      },
      restored: verticalExpected(3, 1, false),
    },
  },
  {
    name: "a hidden host and the border box (FR-001, R-01, Edge Cases): a rail with the hidden attribute has no box and no node, beside its visible twin with its box and its landmark; a rail the page gives a 2 px border is still --ocelle-shell-rail-width wide and 600 px tall in a 600 px container",
    run: async (driver) => {
      await mount(driver, `<div id="page">${rail("gone", full("gone"), ' label="Gone" hidden')}${rail("shown", full("shown"), ' label="Shown"')}</div>` + box("bordered", rail("bordered", full("bordered"))));
      await driver.size("bordered-box", 320, 600);
      await driver.rules("#bordered { border: 2px solid }");
      const gone = await driver.box("gone");
      const shown = await driver.box("shown");
      const bordered = await driver.box("bordered");
      return {
        gone: [gone.display, gone.height],
        shown: [shown.display, shown.height > 0],
        tree: (await landmarksOf(driver, "page", ["Gone", "Shown"])).navigation,
        bordered: [await lengthIs(driver, bordered.width, "shell-rail-width"), tenth(bordered.height)],
      };
    },
    expected: { gone: ["none", 0], shown: ["flex", true], tree: [{ role: "navigation", name: "Shown" }], bordered: ["shell-rail-width", 600] },
  },
  {
    name: "no event (FR-002): mounting, filling and emptying the slots and changing orientation and label dispatch no event from the rail or its shadow tree, while each slot and orientation step changes its layout and the label step its name",
    run: async (driver) => {
      await driver.listen(["quiet"]);
      await mount(driver, box("quiet", rail("quiet", primaries("quiet", 2), ' label="Personal"')));
      await driver.size("quiet-box", 320, null);
      const size = async (): Promise<string> => {
        const read = await driver.box("quiet");
        return `${String(tenth(read.width))}x${String(tenth(read.height))}`;
      };
      const steps = [await size()];
      await driver.append("quiet", bottoms("quiet"));
      steps.push(await size());
      await driver.append("quiet", primary("quiet", 3));
      steps.push(await size());
      await driver.remove("quiet-b1");
      steps.push(await size());
      await driver.setAttribute("quiet", "orientation", "horizontal");
      steps.push(await size());
      await driver.setProperty("quiet", "label", "Me");
      const named = (await landmarksOf(driver, "quiet", [])).navigation;
      const heard = await driver.heard();
      return { heard, changed: steps.slice(1).map((value, index) => value !== steps[index]), named };
    },
    expected: { heard: [], changed: [true, true, true, true], named: [{ role: "navigation", name: "Me" }] },
  },
];

/** The scenarios of the page that links `base.css` (research.md R-10: measured with and without it). */
const withBase: Scenario[] = [
  {
    name: "US4-2 and US4-3 with base.css: a vertical rail is --ocelle-shell-rail-width wide with a --ocelle-target-min content box and a horizontal rail fills its container, and the keyboard focus ring of an item, --ocelle-focus-width drawn --ocelle-focus-offset outside it, is drawn on every side, inside the rail's border box and not clipped, in both orientations (FR-025, FR-027)",
    run: async (driver) => {
      await mount(driver, '<a id="before" href="#before">Before</a>' + box("col", rail("col", full("col"))) + box("row", rail("row", full("row"), ' orientation="horizontal"')), true);
      await driver.size("col-box", 320, null);
      await driver.size("row-box", 600, null);
      const pad = await paddingOf(driver, "col");
      const col = await driver.box("col");
      const focus = async (presses: number, id: string, item: string): Promise<unknown> => {
        for (let press = 0; press < presses; press += 1) await driver.tab();
        return { focused: (await driver.activeElement()).id, ring: await ringOf(driver, id, item) };
      };
      return {
        width: await lengthIs(driver, col.width, "shell-rail-width"),
        contentBox: await lengthIs(driver, col.width - pad.left - pad.right, "target-min"),
        rowFills: tenth((await driver.box("row")).width - (await driver.box("row-box")).width),
        firstColumn: await focus(2, "col", "col-p1"),
        bottomColumn: await focus(3, "col", "col-b1"),
        firstRow: await focus(1, "row", "row-p1"),
        bottomRow: await focus(3, "row", "row-b1"),
      };
    },
    expected: {
      width: "shell-rail-width",
      contentBox: "target-min",
      rowFills: 0,
      firstColumn: { focused: "col-p1", ring: { sides: ["color-focus", "color-focus", "color-focus", "color-focus"], inside: true } },
      bottomColumn: { focused: "col-b1", ring: { sides: ["color-focus", "color-focus", "color-focus", "color-focus"], inside: true } },
      firstRow: { focused: "row-p1", ring: { sides: ["color-focus", "color-focus", "color-focus", "color-focus"], inside: true } },
      bottomRow: { focused: "row-b1", ring: { sides: ["color-focus", "color-focus", "color-focus", "color-focus"], inside: true } },
    },
  },
  {
    name: "US4-7 with base.css: at 320 px a horizontal rail of eight primary and two bottom links fills the page's inline size with no horizontal scroll, its bottom links on the first row at the inline end (FR-004, FR-025)",
    run: async (driver) => {
      await mount(driver, rail("wrap", primaries("wrap", 8) + bottoms("wrap", 2), ' orientation="horizontal"'), true);
      await driver.viewport(320, 800);
      try {
        const host = await driver.box("wrap");
        const p1 = await driver.box("wrap-p1");
        const b2 = await driver.box("wrap-b2");
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          fills: tenth(host.width),
          bottomRow: [tenth(b2.y - p1.y), await lengthIs(driver, host.x + host.width - (b2.x + b2.width), "space-2")],
          divider: (await dividersOf(driver, "wrap", "columns")).thickness,
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { scrollWidth: true, fills: 320, bottomRow: [0, "space-2"], divider: ["border-width"] },
  },
];

export const personalRailScenarios: RailScenario[] = [...plain.map((scenario) => ({ ...scenario, base: false })), ...withBase.map((scenario) => ({ ...scenario, base: true }))];
