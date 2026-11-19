// The shared bodies of User Story 4's browser scenarios, `ocelle-action-row` (012 spec US4-1 to US4-18 and the edge
// cases of contracts/checks.md § Edge cases and plan decisions that belong to phase 5: the row with an icon and an
// empty title (button and link mode), very long titles and unbreakable identifiers, unknown `layout`, `presentation`
// and `ground` values, `host.click()`, the stretched host, the mirrors of the moved values with the morph step, the
// empty description and tags elements, the moved `title`, `ground="chrome"`, the flush hover exception and the ring
// drawn inside the row; FR-001, FR-006, FR-030 to FR-036, FR-038 (row layout), FR-040 to FR-042; research.md R-01,
// R-03 to R-05, R-08, R-10, R-12; plan decisions 6, 18, 19, 21, 22, 24 and 25; tasks.md T050). Each body is written
// once against the driver and run in process on the element source (test/action-row.test.ts) and on the built browser
// build on the strict-CSP fixture (test/browser/action-row.test.ts).
//
// Expected values are written by hand: colours by token name from packages/tokens/test/expected.ts (`tokenColour`),
// the row's look from research.md R-08's tables (items 2, 3, 4, 4a, 7: a default row on `color-sheet` bordered by
// `color-control-border`, or `color-accent-strong` on accent-low, inset, hover-bg and the state grounds, the chrome
// look with `ground="chrome"`; hover `color-hover-bg` and `color-hover-border`; title `color-ink`, description and
// tags `color-ink-soft`), forced colours from R-12's table read as `resolveColour(<keyword>)`, sizes from FR-031 (the
// 44 px of `--ocelle-target-min`, the flush density's 4 px block padding and the compact text scale) and R-10 (the
// inline padding `--ocelle-space-3`, 12 px, in both presentations; the slot convention's 20 px icon and 8 px gap), and
// the ring's band 2 to 5 px inside the row's edge from R-12 (`--ocelle-focus-offset-inset`, -5 px, with the 3 px
// `--ocelle-focus-width`). Every body ends with axe on its page (006's rule selection): no serious or critical result,
// except the empty-title edge case, which expects `button-name` and `link-name` by name.
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named here (run once
// and recorded in reviews/phase-5/plants.md):
// - the name is exactly the title, from the inner control's content, the description and tags in no node of their own
//   and axe reporting nothing on a row with description or tag text (US4-3 and every body with such a row) beside the
//   description that holds them; plant: the description wrapper back inside the inner control (plan decision 30);
// - an empty or whitespace-only `description` element neither describes the row nor takes space (US4-6, US4-16) beside
//   the description and the gap that come once text is written into it; plants: the raw assigned elements referenced
//   as the description, no `MutationObserver`, the wrappers hidden from the raw assigned elements;
// - a flush row has no border, no fill and no hover border (US4-6, US4-8) beside its hover surface; plant: the flush
//   hover token changed (fails on every ground off the exception list);
// - a flush hover moves and resizes nothing (US4-8) beside the hover fill;
// - the ring is drawn inside the row on all four sides (US4-9); plant: no ring;
// - a stretched row has no area outside its hit layer (US4-15) beside the one activate event of a click 4 px inside
//   its bottom edge; plants: the host restored to `display: block`, the layer positioned against the inner control;
// - a click on the description, a tag or the trailing icon is not lost (US4-15) beside its one activate event; plant:
//   the siblings without `pointer-events: none`;
// - the description, tags and trailing wrappers keep their own ink (US4-8, US4-17, forced colours) beside the title's;
//   plant: sibling colours removed;
// - a moved `title` leaves no host `title` and no named host node (US4-16) beside its description; plant: `title` not
//   moved;
// - copies of the live DOM keep the moved name (decision 19) and a morph keeps the mirrors (decision 24); plants: no
//   mirror, mirror not restored;
// - `ground="chrome"` gives the chrome look (US4-17); plant: `chrome` treated as unknown.
//
// Plan decision 30: the row's surface, border, hover and ring are read from the inner control's hit layer (`.hit`),
// its padding and type from the layout wrapper (`.layout`), both internal boxes the plan names.
import { meaningful, severe } from "./button.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, EventRecord, Palette, Pixels } from "./driver.ts";

export type { Scenario } from "./icon.ts";

/** The inner control of an `ocelle-action-row`, by its CSS part, and its other parts. */
const control = '[part="control"]';
const titlePart = '[part="title"]';
const descriptionPart = '[part="description"]';
const tagsPart = '[part="tags"]';
/** The slot convention's wrappers (src/icon-slot.ts): the icon slot's and the trailing slot's. */
const iconWrapper = ".icon-slot:not(.trailing)";
const trailingWrapper = ".icon-slot.trailing";
/**
 * Plan decision 30's internal boxes: the layout wrapper (the host's single grid item, which holds the padding and the
 * type) and the inner control's hit layer (which fills the host and draws the surface, the border, the hover and the
 * ring).
 */
const layoutBox = ".layout";
const hit = ".hit";
const activate = "ocelle-action-row-activate";
const transparent = "rgba(0, 0, 0, 0)";
const themes: readonly Palette[] = ["light", "dark"];

/** `--ocelle-target-min` at the default root font size (002 Appendix A: 2.75rem). */
const targetMin = 44;
/** The row's inline padding, `--ocelle-space-3`, in both presentations (research.md R-10). */
const padding = 12;
/** The gap of the slot convention, `--ocelle-space-2`. */
const gap = 8;
/** The icon size, `--ocelle-icon-size`. */
const icon = 20;

const colour = (token: string, theme: Palette): string => tokenColour(`color-${token}`, theme);
const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;

/** The number of dispatches (distinct serials) of `type` whose target was the row `id`. */
function dispatches(records: readonly EventRecord[], type: string, id: string): number {
  return new Set(records.filter((record) => record.type === type && record.target === `ocelle-action-row#${id}`).map((record) => record.serial)).size;
}

/** The click and activate dispatches at the row `id`. */
function counts(records: readonly EventRecord[], id: string): { readonly click: number; readonly activate: number } {
  return { click: dispatches(records, "click", id), activate: dispatches(records, activate, id) };
}

/** The activate records summarised: where each listener was, the targets, the serials, the flags and the details. */
function summary(records: readonly EventRecord[]): unknown {
  const of = records.filter((record) => record.type === activate);
  return {
    at: of.map((record) => record.at),
    targets: [...new Set(of.map((record) => record.target))],
    serials: new Set(of.map((record) => record.serial)).size,
    flags: [...new Set(of.map((record) => JSON.stringify({ isTrusted: record.isTrusted, bubbles: record.bubbles, composed: record.composed, cancelable: record.cancelable, defaultPrevented: record.defaultPrevented })))].map((text) => JSON.parse(text) as unknown),
    details: [...new Set(of.map((record) => JSON.stringify(record.detail)))],
  };
}

/** The listeners from the row out to `window` when it sits in `<div id="wrap">`. */
const path = ["ocelle-action-row#r", "div#wrap", "body", "html", "document", "window"];

/** The ways US4-1 activates a row, each from a fresh mount. */
const activations = [
  { name: "a pointer click", act: (driver: Driver, id: string) => driver.click(id) },
  {
    name: "Enter on the focused row",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
  },
  {
    name: "Space on the focused row",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press(" ");
    },
  },
  { name: "the element's click() method", act: (driver: Driver, id: string) => driver.callClick(id) },
] as const;

/** The native buttons beside the rows (focus starts and ends) take the minimum target, so axe's target-size has nothing to report. */
const nativeRules = "#before, #after, #start { min-block-size: 44px; min-inline-size: 44px; }";

/** The ground rules of the scenario pages: a class per ground token, its colour as the background. */
const groundTokens = ["canvas", "sheet", "pane", "panel", "inspector", "rail", "inset", "accent-low", "hover-bg", "danger-bg", "warning-bg", "success-bg", "info-bg", "neutral-bg", "chrome", "chrome-hover"] as const;
type Ground = (typeof groundTokens)[number];
const groundRules = groundTokens.map((ground) => `.on-${ground} { background-color: var(--ocelle-color-${ground}); color: var(--ocelle-color-${ground.startsWith("chrome") ? "chrome-ink" : "ink"}); padding: 8px; }`).join(" ");

/** The `ground` attribute a host sets for a ground (FR-042): none on the six other main grounds. */
function groundAttribute(ground: Ground): string | undefined {
  if (ground === "inset" || ground === "accent-low" || ground === "hover-bg") return ground;
  if (ground.endsWith("-bg")) return "state";
  if (ground === "chrome" || ground === "chrome-hover") return "chrome";
  return undefined;
}

/**
 * The grounds on which a flush row's hover fill equals the ground, so its hover shows no change (FR-019, US4-8, plan
 * decision 6), written by hand per theme: `hover-bg` in both themes, `inset` in light (light `inset` and `hover-bg` are
 * both #E2DDD3), `neutral-bg` in dark (dark `neutral-bg` and `hover-bg` are both #2A261F; operator decision at phase 2)
 * and `chrome-hover` (with `ground="chrome"`) in both themes.
 */
const flushHoverUnchanged: Readonly<Record<Palette, readonly Ground[]>> = { light: ["inset", "hover-bg", "chrome-hover"], dark: ["hover-bg", "neutral-bg", "chrome-hover"] };

type Presentation = "default" | "flush";

/** Markup of a row of a presentation on a ground, with its id; `content` goes inside. */
function row(id: string, presentation: Presentation, ground: string | undefined, content = "Mission 42", extra = ""): string {
  const presented = presentation === "flush" ? ' presentation="flush"' : "";
  const grounded = ground === undefined ? "" : ` ground="${ground}"`;
  return `<ocelle-action-row id="${id}"${presented}${grounded}${extra}>${content}</ocelle-action-row>`;
}

/** The computed look of the row, read from its hit layer: its fill, its border colour and width (top side). */
async function look(driver: Driver, id: string): Promise<{ readonly fill: string; readonly border: string; readonly width: string }> {
  return { fill: await driver.computed(id, "background-color", hit), border: await driver.computed(id, "border-top-color", hit), width: await driver.computed(id, "border-top-width", hit) };
}

/**
 * The idle look of research.md R-08's tables (items 4, 4a, 7) for a row: a default row on `color-sheet` with a border by
 * its `ground` attribute (`control-border` with none, `accent-strong` on accent-low, inset, hover-bg and state, and
 * the chrome look with `chrome`: no fill, `chrome-muted` border); a flush row has neither fill nor border.
 */
function idleLook(presentation: Presentation, ground: string | undefined, theme: Palette): { readonly fill: string; readonly border: string | null; readonly width: string } {
  const c = (token: string): string => colour(token, theme);
  if (presentation === "flush") return { fill: transparent, border: null, width: "0px" };
  if (ground === "chrome") return { fill: transparent, border: c("chrome-muted"), width: "1px" };
  return { fill: c("sheet"), border: ground === undefined ? c("control-border") : c("accent-strong"), width: "1px" };
}

/** The hover look of R-08's tables: `hover-bg` and `hover-border`, or `chrome-hover` and `chrome-ink` on chrome; a flush row has no border. */
function hoverLook(presentation: Presentation, chrome: boolean, theme: Palette): { readonly fill: string; readonly border: string | null; readonly width: string } {
  const c = (token: string): string => colour(token, theme);
  const fill = chrome ? c("chrome-hover") : c("hover-bg");
  if (presentation === "flush") return { fill, border: null, width: "0px" };
  return { fill, border: chrome ? c("chrome-ink") : c("hover-border"), width: "1px" };
}

/** Two boxes equal within half a pixel. */
function same(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs(a.width - b.width) <= 0.5 && Math.abs(a.height - b.height) <= 0.5;
}

/**
 * The row's geometry that a hover must not change: the host's size and the title's and the description's boxes
 * relative to the host, to the tenth of a pixel (a hover may scroll the page, which moves every box alike).
 */
async function geometry(driver: Driver, id: string): Promise<number[]> {
  const host = await driver.box(id);
  const parts = [await driver.box(id, titlePart), await driver.box(id, descriptionPart)];
  return [host.width, host.height, ...parts.flatMap((part) => [part.x - host.x, part.y - host.y, part.width, part.height])].map(tenth);
}

/** The colour of one pixel, as `getComputedStyle` writes an opaque colour. */
function pixel(pixels: Pixels, x: number, y: number): string {
  const at = (Math.floor(y) * pixels.width + Math.floor(x)) * 4;
  return `rgb(${String(pixels.data[at] ?? 0)}, ${String(pixels.data[at + 1] ?? 0)}, ${String(pixels.data[at + 2] ?? 0)})`;
}

/** The box of a part in the shadow root, or of a light element, as its inline start, inline end, top and bottom. */
interface Extent {
  readonly start: number;
  readonly end: number;
  readonly top: number;
  readonly bottom: number;
}

function extent(box: Box, direction: "ltr" | "rtl"): Extent {
  return direction === "ltr" ? { start: box.x, end: box.x + box.width, top: box.y, bottom: box.y + box.height } : { start: box.x + box.width, end: box.x, top: box.y, bottom: box.y + box.height };
}

/** The look of one row on one ground in one theme, idle and hovered, with the title and description inks. */
function themed(theme: Palette): Scenario[] {
  const c = (token: string): string => colour(token, theme);
  return [
    ...(["default", "flush"] as const).map(
      (presentation): Scenario => ({
        name: `US4-8, FR-042 (${theme}), ${presentation}: on each main, state and chrome ground (with its ground attribute) the idle row has the fill and border of research.md R-08 (a default row on color-sheet, bordered by control-border, accent-strong on accent-low, inset, hover-bg and the state grounds, chrome-muted with no fill on chrome; a flush row with neither), its title and trailing icon in color-ink (chrome-ink) and its description and tags in color-ink-soft (chrome-muted), each read on its own wrapper; on hover the surface becomes hover-bg (chrome-hover) and a default row's border hover-border (chrome-ink), a flush row gets no border, and nothing moves or changes size; the hover differs from idle except a flush hover on the grounds where the hover fill equals the ground (hover-bg, inset in light, neutral-bg in dark, chrome-hover) (FR-031, FR-036)`,
        run: async (driver) => {
          const content = 'Mission 42<span slot="description">Due Friday</span><span slot="tags">Blocked</span><ocelle-icon slot="trailing" name="arrow-end"></ocelle-icon>';
          const markup = groundTokens.map((ground) => `<div class="on-${ground}">${row(`g-${ground}`, presentation, groundAttribute(ground), content)}</div>`);
          await driver.mount(`${markup.join("")}<p id="away">Away</p>`);
          await driver.rules(groundRules);
          await driver.theme(theme);
          const found: Record<string, unknown> = {};
          for (const ground of groundTokens) {
            const id = `g-${ground}`;
            const surface = colour(ground, theme);
            await driver.hover("away");
            const rest = await look(driver, id);
            const before = await geometry(driver, id);
            const inks = { title: await driver.computed(id, "color", titlePart), description: await driver.computed(id, "color", descriptionPart), tags: await driver.computed(id, "color", tagsPart), trailing: await driver.computed(id, "color", trailingWrapper) };
            await driver.hover(id);
            const hovered = await look(driver, id);
            const during = await geometry(driver, id);
            await driver.hover("away");
            const visible = (state: { fill: string; border: string }): string => `${state.fill === transparent ? surface : state.fill} ${presentation === "flush" ? "" : state.border}`;
            found[ground] = {
              idle: { fill: rest.fill, border: presentation === "flush" ? null : rest.border, width: rest.width },
              hover: { fill: hovered.fill, border: presentation === "flush" ? null : hovered.border, width: hovered.width },
              inks,
              differs: visible(hovered) !== visible(rest),
              still: JSON.stringify(before) === JSON.stringify(during),
            };
          }
          return { found, axe: await severe(driver) };
        },
        expected: {
          found: Object.fromEntries(
            groundTokens.map((ground) => {
              const attribute = groundAttribute(ground);
              const chrome = attribute === "chrome";
              return [
                ground,
                {
                  idle: idleLook(presentation, attribute, theme),
                  hover: hoverLook(presentation, chrome, theme),
                  inks: { title: chrome ? c("chrome-ink") : c("ink"), description: chrome ? c("chrome-muted") : c("ink-soft"), tags: chrome ? c("chrome-muted") : c("ink-soft"), trailing: chrome ? c("chrome-ink") : c("ink") },
                  differs: !(presentation === "flush" && flushHoverUnchanged[theme].includes(ground)),
                  still: true,
                },
              ];
            }),
          ),
          axe: [],
        },
      }),
    ),
    {
      name: `US4-17 (${theme}): a default row with ground="chrome" on color-chrome has its title and trailing icon in chrome-ink, its description and tags in chrome-muted (read on their own wrappers), no fill and a chrome-muted border; hovered, its surface is chrome-hover and its border chrome-ink (FR-036, FR-042)`,
      run: async (driver) => {
        await driver.mount(`<div class="on-chrome">${row("r", "default", "chrome", 'Mission 42<span slot="description">Due Friday</span><span slot="tags">Blocked</span><ocelle-icon slot="trailing" name="arrow-end"></ocelle-icon>')}</div><p id="away">Away</p>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.hover("away");
        const idle = { ...(await look(driver, "r")), title: await driver.computed("r", "color", titlePart), description: await driver.computed("r", "color", descriptionPart), tags: await driver.computed("r", "color", tagsPart), trailing: await driver.computed("r", "color", trailingWrapper) };
        await driver.hover("r");
        const hovered = await look(driver, "r");
        await driver.hover("away");
        return { idle, hovered, axe: await severe(driver) };
      },
      expected: {
        idle: { fill: transparent, border: c("chrome-muted"), width: "1px", title: c("chrome-ink"), description: c("chrome-muted"), tags: c("chrome-muted"), trailing: c("chrome-ink") },
        hovered: { fill: c("chrome-hover"), border: c("chrome-ink"), width: "1px" },
        axe: [],
      },
    },
    {
      name: `US4-9 (${theme}): keyboard focus on a row without current draws the token ring inside the row's edge (its band 2 to 5 px in), on all four sides, when the rows sit edge to edge in an overflow: auto list, static and positioned; the host's focus() focuses the inner control (FR-041)`,
      run: async (driver) => {
        const list = (name: string): string => `<div id="${name}" class="list">${["1", "2", "3"].map((at) => row(`${name}-${at}`, "default", undefined, `Mission ${at}`)).join("")}</div>`;
        await driver.mount(`<div class="on-canvas"><button id="before" type="button">Before</button>${list("static")}${list("positioned")}</div>`);
        await driver.rules(`${groundRules} ${nativeRules} .list { inline-size: 300px; block-size: 132px; overflow: auto; } #positioned ocelle-action-row { position: relative; }`);
        await driver.theme(theme);
        const ring = async (id: string): Promise<unknown> => {
          const pixels = await driver.pixels(id);
          const [w, h] = [pixels.width, pixels.height];
          return {
            start: pixel(pixels, 3, h / 2),
            end: pixel(pixels, w - 4, h / 2),
            top: pixel(pixels, w / 2, 3),
            bottom: pixel(pixels, w / 2, h - 4),
            offset: await driver.computed(id, "outline-offset", hit),
            style: await driver.computed(id, "outline-style", hit),
          };
        };
        await driver.focus("before");
        await driver.press("Tab");
        await driver.press("Tab");
        const staticRing = { active: await driver.activeInner("static-2"), ...((await ring("static-2")) as object) };
        await driver.focus("before");
        await driver.press("Tab");
        await driver.press("Tab");
        await driver.press("Tab");
        await driver.press("Tab");
        await driver.press("Tab");
        const positionedRing = { active: await driver.activeInner("positioned-2"), ...((await ring("positioned-2")) as object) };
        return { staticRing, positionedRing, axe: await severe(driver) };
      },
      expected: {
        staticRing: { active: "button", start: c("focus"), end: c("focus"), top: c("focus"), bottom: c("focus"), offset: "-5px", style: "solid" },
        positionedRing: { active: "button", start: c("focus"), end: c("focus"), top: c("focus"), bottom: c("focus"), offset: "-5px", style: "solid" },
        axe: [],
      },
    },
    {
      name: `Edge case, unknown values (${theme}): layout="grid", presentation="boxed" and ground="lava" render as the default row (row layout, default presentation, main grounds): the same look, box and type as a row with no attribute, reflected as written, with no error`,
      run: async (driver) => {
        await driver.mount(`<div class="on-canvas">${row("u", "default", undefined, "Mission 42", ' layout="grid" presentation="boxed" ground="lava"')}${row("d", "default", undefined)}<p id="away">Away</p></div>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.hover("away");
        const read = async (id: string): Promise<unknown> => {
          const box = await driver.box(id);
          return {
            look: await look(driver, id),
            size: [tenth(box.width), tenth(box.height)],
            font: await driver.computed(id, "font-size", layoutBox),
            padding: [await driver.computed(id, "padding-block-start", layoutBox), await driver.computed(id, "padding-inline-start", layoutBox)],
            radius: await driver.computed(id, "border-top-left-radius", hit),
          };
        };
        const known = await read("d");
        return {
          look: await look(driver, "u"),
          sameAsDefault: JSON.stringify(await read("u")) === JSON.stringify(known),
          attributes: [await driver.attribute("u", "layout"), await driver.attribute("u", "presentation"), await driver.attribute("u", "ground")],
          messages: await driver.messages(),
          axe: await severe(driver),
        };
      },
      expected: { look: idleLook("default", undefined, theme), sameAsDefault: true, attributes: ["grid", "boxed", "lava"], messages: [], axe: [] },
    },
  ];
}

/** The forced-colours scenario of one palette (US4-8's forced half, FR-041; research.md R-12's table). */
function forced(palette: Palette): Scenario {
  return {
    name: `US4-8, FR-041, forced colours with the ${palette} palette: a default row's text (its title and, on their own wrappers, its description, tags and trailing icon) and its border are ButtonText and its hover border Highlight; a flush row has no border, and its hover is a dashed Highlight outline that moves and resizes nothing; the focus ring is a solid Highlight outline; a link row's text (title and description) and border are LinkText (research.md R-12, R-10 § Sibling ink; plant: sibling colours removed)`,
    run: async (driver) => {
      const slotted = '<span slot="description">Due Friday</span><span slot="tags">Blocked</span><ocelle-icon slot="trailing" name="arrow-end"></ocelle-icon>';
      await driver.mount(`<button id="start" type="button">Start</button>${row("d", "default", undefined, `Mission 42${slotted}`)}${row("f", "flush", undefined)}${row("l", "default", undefined, `Mission 7${slotted}`, ' href="#missions"')}<p id="away">Away</p>`);
      await driver.rules(nativeRules);
      await driver.forcedColors("active", palette);
      const keywords = ["ButtonText", "Highlight", "LinkText"];
      const resolved = await Promise.all(keywords.map((keyword) => driver.resolveColour(keyword)));
      /** A computed colour by the system colour keyword it equals, or as computed. */
      const named = (value: string): string => keywords[resolved.indexOf(value)] ?? value;
      const read = async (id: string, property: string, inner = control): Promise<string> => named(await driver.computed(id, property, inner));
      await driver.hover("away");
      const idle = {
        ink: await read("d", "color"),
        title: await read("d", "color", titlePart),
        description: await read("d", "color", descriptionPart),
        tags: await read("d", "color", tagsPart),
        trailing: await read("d", "color", trailingWrapper),
        border: await read("d", "border-top-color", hit),
        width: await driver.computed("d", "border-top-width", hit),
      };
      await driver.hover("d");
      const hovered = { border: await read("d", "border-top-color", hit), outline: await driver.computed("d", "outline-style", hit) };
      await driver.hover("away");
      const before = await geometry(driver, "f");
      const flushIdle = { width: await driver.computed("f", "border-top-width", hit), outline: await driver.computed("f", "outline-style", hit) };
      await driver.hover("f");
      const flushHovered = { width: await driver.computed("f", "border-top-width", hit), outline: await driver.computed("f", "outline-style", hit), colour: await read("f", "outline-color", hit), still: JSON.stringify(before) === JSON.stringify(await geometry(driver, "f")) };
      await driver.hover("away");
      await driver.focus("start");
      await driver.press("Tab");
      const focus = { active: await driver.activeInner("d"), style: await driver.computed("d", "outline-style", hit), colour: await read("d", "outline-color", hit) };
      const link = { ink: await read("l", "color"), description: await read("l", "color", descriptionPart), border: await read("l", "border-top-color", hit), tag: (await driver.elements("l")).find((part) => part.attributes.part === "control")?.name ?? null };
      return { distinct: new Set(resolved).size, idle, hovered, flushIdle, flushHovered, focus, link, axe: await severe(driver) };
    },
    expected: {
      distinct: 3,
      idle: { ink: "ButtonText", title: "ButtonText", description: "ButtonText", tags: "ButtonText", trailing: "ButtonText", border: "ButtonText", width: "1px" },
      hovered: { border: "Highlight", outline: "none" },
      flushIdle: { width: "0px", outline: "none" },
      flushHovered: { width: "0px", outline: "dashed", colour: "Highlight", still: true },
      focus: { active: "button", style: "solid", colour: "Highlight" },
      link: { ink: "LinkText", description: "LinkText", border: "LinkText", tag: "a" },
      axe: [],
    },
  };
}

/** US4-18's row: an icon, a title, a description, two tags and a trailing icon, each reachable by id. */
const fullRow =
  '<ocelle-action-row id="r" row-id="m-42"><ocelle-icon id="r-icon" slot="icon" name="folder"></ocelle-icon><span id="r-title">Mission 42</span>' +
  '<span id="r-description" slot="description">Due Friday</span><span id="r-tag-1" slot="tags">Blocked</span><span id="r-tag-2" slot="tags">Design</span>' +
  '<ocelle-icon id="r-trailing" slot="trailing" name="arrow-end"></ocelle-icon></ocelle-action-row>';

export const actionRowScenarios: readonly Scenario[] = [
  ...activations.map(
    ({ name, act }): Scenario => ({
      name: `US4-1, ${name}: <ocelle-action-row row-id="m-42">Mission 42</ocelle-action-row> dispatches exactly one ocelle-action-row-activate (bubbles, composed, cancelable, detail { rowId: "m-42" }, target the row at every listener) recorded at the row, its ancestors, document and window, and the click reaches the row once (FR-001, FR-033)`,
      run: async (driver) => {
        await driver.mount('<div id="wrap"><ocelle-action-row id="r" row-id="m-42">Mission 42</ocelle-action-row></div>');
        await driver.events("r", ["click", activate]);
        await act(driver, "r");
        const records = await driver.takeEvents();
        return { activate: summary(records), click: dispatches(records, "click", "r"), axe: await severe(driver) };
      },
      expected: {
        activate: {
          at: path,
          targets: ["ocelle-action-row#r"],
          serials: 1,
          flags: [{ isTrusted: false, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }],
          details: ['{"rowId":"m-42"}'],
        },
        click: 1,
        axe: [],
      },
    }),
  ),
  {
    name: 'US4-2: a row without row-id dispatches detail { rowId: "" }; once row-id is set to "m-7" the next activation carries { rowId: "m-7" }, the row id at the time of the activation (FR-033)',
    run: async (driver) => {
      await driver.mount('<div id="wrap"><ocelle-action-row id="r">Mission 7</ocelle-action-row></div>');
      await driver.events("r", [activate]);
      await driver.click("r");
      const absent = (summary(await driver.takeEvents()) as { details: unknown }).details;
      await driver.setAttribute("r", "row-id", "m-7");
      await driver.focus("r");
      await driver.press("Enter");
      const set = (summary(await driver.takeEvents()) as { details: unknown }).details;
      return { absent, set, axe: await severe(driver) };
    },
    expected: { absent: ['{"rowId":""}'], set: ['{"rowId":"m-7"}'], axe: [] },
  },
  {
    name: "US4-3, US4-16's node count: a row with a title, a slotted description and slotted tags is exactly one accessibility node with a role other than generic or a name, role button named exactly its title (Mission 42) from its content, described by the description then the tags; the description, tags and trailing content in no accessibility node of their own (only the title's text), and axe reports nothing, so no label-content-name-mismatch (plan decision 30); no named generic node for the host; one tab stop in Tab and Shift+Tab order (FR-001, FR-034)",
    run: async (driver) => {
      await driver.mount(
        '<button id="before" type="button">Before</button> <ocelle-action-row id="r" row-id="m-42"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Mission 42<span slot="description">Due Friday</span><span slot="tags">Blocked</span><span slot="tags">Design</span><ocelle-icon slot="trailing" name="arrow-end"></ocelle-icon></ocelle-action-row> <button id="after" type="button">After</button>',
      );
      await driver.rules(nativeRules);
      const state = await driver.axState("r", control);
      return {
        meaningful: await meaningful(driver, "r"),
        texts: (await driver.axSubtree("r")).filter((node) => node.role === "StaticText"),
        state: { role: state.role, name: state.name, description: state.description, focusable: state.focusable, disabled: state.disabled },
        forward: await driver.tabOrder(),
        reverse: await driver.tabOrder({ reverse: true }),
        axe: await severe(driver),
      };
    },
    expected: {
      meaningful: [{ role: "button", name: "Mission 42", description: "Due Friday Blocked Design" }],
      texts: [{ role: "StaticText", name: "Mission 42" }],
      state: { role: "button", name: "Mission 42", description: "Due Friday Blocked Design", focusable: true, disabled: false },
      forward: [["button#before"], ["ocelle-action-row#r", "button"], ["button#after"]],
      reverse: [["button#after"], ["ocelle-action-row#r", "button"], ["button#before"]],
      axe: [],
    },
  },
  {
    name: 'US4-4: label="Open mission 42" names the row; label is trimmed and a whitespace-only label counts as none (the title names it); a host aria-label wins over label; a host aria-labelledby names the row with the referenced element\'s text and wins over aria-label; each moved attribute leaves the host (FR-005, FR-006, FR-030, FR-034)',
    run: async (driver) => {
      await driver.mount(
        '<p id="owner">Mission 42 by Ana</p>' +
          '<ocelle-action-row id="l" label="Open mission 42">Mission 42</ocelle-action-row>' +
          '<ocelle-action-row id="t" label="  Open mission 42  ">Mission 42</ocelle-action-row>' +
          '<ocelle-action-row id="w" label="   ">Mission 42</ocelle-action-row>' +
          '<ocelle-action-row id="a" label="Open mission 42" aria-label="Mission 42, open it">Mission 42</ocelle-action-row>' +
          '<ocelle-action-row id="b" aria-labelledby="owner" aria-label="Mission 42, open it">Mission 42</ocelle-action-row>',
      );
      const name = async (id: string): Promise<string> => (await driver.axState(id, control)).name;
      return {
        names: [await name("l"), await name("t"), await name("w"), await name("a"), await name("b")],
        host: [await driver.attribute("a", "aria-label"), await driver.attribute("b", "aria-labelledby"), await driver.attribute("b", "aria-label"), await driver.attribute("l", "label")],
        axe: await severe(driver),
      };
    },
    expected: { names: ["Open mission 42", "Open mission 42", "Mission 42", "Mission 42, open it", "Mission 42 by Ana"], host: [null, null, null, "Open mission 42"], axe: [] },
  },
  {
    name: "US4-5: a busy row reports aria-busy on its inner control, stays focusable and in the tab order, and a click and Enter each still dispatch one ocelle-action-row-activate (FR-035)",
    run: async (driver) => {
      await driver.mount('<div id="wrap"><ocelle-action-row id="r" row-id="m-1" busy>Mission 1</ocelle-action-row></div>');
      const state = await driver.axState("r", control);
      await driver.events("r", ["click", activate]);
      await driver.click("r");
      const clicked = counts(await driver.takeEvents(), "r");
      await driver.focus("r");
      await driver.press("Enter");
      const entered = counts(await driver.takeEvents(), "r");
      return { busy: state.busy, focusable: state.focusable, disabled: state.disabled, order: await driver.tabOrder(), clicked, entered, axe: await severe(driver) };
    },
    expected: { busy: true, focusable: true, disabled: false, order: [["ocelle-action-row#r", "button"]], clicked: { click: 1, activate: 1 }, entered: { click: 1, activate: 1 }, axe: [] },
  },
  ...(["ltr", "rtl"] as const).map(
    (direction): Scenario => ({
      name: `US4-6 (${direction}): a flush row with no current and no hover has no border, no fill, the compact navigation density (block padding 4 px, font-size-sm, line-height-compact) and the inline padding 12 px; with only a title every empty slot (icon, description, tags, trailing) takes no space: the title starts at the inline padding; an empty and a whitespace-only description element and a whitespace-only tags element take no space and add no gap, the row as tall as its title-only twin, until text is written into the description element (its region then takes space ${String(gap)} px after the title) and again none once the text is removed (FR-031)`,
      run: async (driver) => {
        await driver.mount(
          `<div dir="${direction}" class="box">` +
            row("a", "flush", undefined) +
            row("e", "flush", undefined, 'Mission 42<span id="e-description" slot="description"></span><span slot="tags"> </span>') +
            row("s", "flush", undefined, 'Mission 42<span slot="description">  </span>') +
            '</div><p id="away">Away</p>',
        );
        await driver.rules(".box { inline-size: 400px; }");
        await driver.hover("away");
        const titleStart = async (id: string): Promise<number> => {
          const [host, title] = [extent(await driver.box(id), direction), extent(await driver.box(id, titlePart), direction)];
          return tenth(Math.abs(title.start - host.start));
        };
        const regions = async (id: string): Promise<unknown> => ({
          icon: (await driver.box(id, iconWrapper)).display,
          description: (await driver.box(id, descriptionPart)).display,
          tags: (await driver.box(id, tagsPart)).display,
          trailing: (await driver.box(id, trailingWrapper)).display,
        });
        const height = async (id: string): Promise<number> => tenth((await driver.box(id)).height);
        const flush = {
          border: await driver.computed("a", "border-top-width", hit),
          fill: await driver.computed("a", "background-color", hit),
          paddingBlock: [await driver.computed("a", "padding-block-start", layoutBox), await driver.computed("a", "padding-block-end", layoutBox)],
          paddingInline: [await driver.computed("a", "padding-inline-start", layoutBox), await driver.computed("a", "padding-inline-end", layoutBox)],
          font: [await driver.computed("a", "font-size", layoutBox), await driver.computed("a", "line-height", layoutBox)],
        };
        const titleOnly = { start: await titleStart("a"), regions: await regions("a") };
        const empty = { start: await titleStart("e"), regions: await regions("e"), sameHeight: (await height("e")) === (await height("a")) };
        const whitespace = { start: await titleStart("s"), description: (await driver.box("s", descriptionPart)).display, sameHeight: (await height("s")) === (await height("a")) };
        await driver.setProperty("e-description", "textContent", "Due Friday");
        const [title, description] = [extent(await driver.box("e", titlePart), direction), extent(await driver.box("e", descriptionPart), direction)];
        const written = { description: (await driver.box("e", descriptionPart)).display !== "none", gap: tenth(Math.abs(description.start - title.end)) };
        await driver.setProperty("e-description", "textContent", "");
        const removed = { description: (await driver.box("e", descriptionPart)).display, sameHeight: (await height("e")) === (await height("a")) };
        return { flush, titleOnly, empty, whitespace, written, removed, axe: await severe(driver) };
      },
      expected: {
        flush: { border: "0px", fill: transparent, paddingBlock: ["4px", "4px"], paddingInline: [`${String(padding)}px`, `${String(padding)}px`], font: ["14px", "21px"] },
        titleOnly: { start: padding, regions: { icon: "none", description: "none", tags: "none", trailing: "none" } },
        empty: { start: padding, regions: { icon: "none", description: "none", tags: "none", trailing: "none" }, sameHeight: true },
        whitespace: { start: padding, description: "none", sameHeight: true },
        written: { description: true, gap },
        removed: { description: "none", sameHeight: true },
        axe: [],
      },
    }),
  ),
  {
    name: "US4-7, FR-040: in each shrink-wrapping container (an inline-block, an inline-flex, a float and a max-content grid track) the row is not 0 wide: its inline size holds its content's min-content (the title's text inside the row with the inline padding on both sides)",
    run: async (driver) => {
      const containers = ["inline-block", "inline-flex", "float", "grid"] as const;
      await driver.mount(containers.map((kind) => `<div class="c-${kind}"><ocelle-action-row id="${kind}"><span id="${kind}-title">Mission</span></ocelle-action-row></div>`).join(""));
      await driver.rules(".c-inline-block { display: inline-block; } .c-inline-flex { display: inline-flex; } .c-float { float: left; } .c-grid { display: grid; grid-template-columns: max-content; }");
      const found: Record<string, unknown> = {};
      for (const kind of containers) {
        const [host, title] = [await driver.box(kind), await driver.box(`${kind}-title`)];
        found[kind] = { wide: host.width > 0, holds: title.x >= host.x + padding - 0.5 && title.x + title.width <= host.x + host.width - padding + 0.5, atLeast: host.width >= title.width + 2 * padding - 0.5 };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: Object.fromEntries(["inline-block", "inline-flex", "float", "grid"].map((kind) => [kind, { wide: true, holds: true, atLeast: true }])),
      axe: [],
    },
  },
  ...themes.flatMap(themed),
  ...themes.map(forced),
  ...activations
    .filter(({ name }) => name !== "the element's click() method")
    .map(
      ({ name, act }): Scenario => ({
        name: `US4-10, ${name}: a host listener that cancels ocelle-action-row-activate sees it dispatched once with defaultPrevented true, no other ocelle-* event is dispatched, and focus stays on the row (FR-033)`,
        run: async (driver) => {
          await driver.mount('<div id="wrap"><ocelle-action-row id="r" row-id="m-42">Mission 42</ocelle-action-row></div>');
          await driver.events("r", [activate, "ocelle-button-activate"]);
          await driver.preventNext(activate);
          await act(driver, "r");
          const records = await driver.takeEvents();
          return {
            activate: dispatches(records, activate, "r"),
            prevented: [...new Set(records.filter((record) => record.type === activate).map((record) => record.defaultPrevented))],
            others: records.filter((record) => record.type !== activate).map((record) => record.type),
            focus: await driver.activeInner("r"),
            axe: await severe(driver),
          };
        },
        expected: { activate: 1, prevented: [true], others: [], focus: "button", axe: [] },
      }),
    ),
  {
    name: "US4-11: a row with a one-line title and no other content is at least --ocelle-target-min (44 px) tall in each presentation (default, flush) and each layout (row, card) (FR-031)",
    run: async (driver) => {
      const cases = (["default", "flush"] as const).flatMap((presentation) => (["row", "card"] as const).map((layout) => ({ id: `${presentation}-${layout}`, presentation, layout })));
      await driver.mount(cases.map(({ id, presentation, layout }) => row(id, presentation, undefined, "Mission 42", ` layout="${layout}"`)).join(""));
      const found: Record<string, boolean> = {};
      for (const { id } of cases) found[id] = (await driver.box(id)).height >= targetMin;
      return { found, axe: await severe(driver) };
    },
    expected: { found: { "default-row": true, "default-card": true, "flush-row": true, "flush-card": true }, axe: [] },
  },
  {
    name: 'US4-12: the accessible description is the slotted description then the tags in slot order ("Due Friday Blocked Design"), "Blocked Design" with tags and no description; a host aria-describedby naming "Owner: Ana" replaces both, and aria-describedby="" restores "Due Friday Blocked Design" (FR-005, FR-034)',
    run: async (driver) => {
      await driver.mount(
        '<p id="owner">Owner: Ana</p>' +
          '<ocelle-action-row id="d">Mission 42<span slot="description">Due Friday</span><span slot="tags">Blocked</span><span slot="tags">Design</span></ocelle-action-row>' +
          '<ocelle-action-row id="t">Mission 43<span slot="tags">Blocked</span><span slot="tags">Design</span></ocelle-action-row>',
      );
      const description = async (id: string): Promise<string> => (await driver.axState(id, control)).description;
      const slots = { both: await description("d"), tags: await description("t") };
      await driver.setAttribute("d", "aria-describedby", "owner");
      const host = { description: await description("d"), name: (await driver.axState("d", control)).name, attribute: await driver.attribute("d", "aria-describedby") };
      await driver.setAttribute("d", "aria-describedby", "");
      return { slots, host, restored: await description("d"), axe: await severe(driver) };
    },
    expected: { slots: { both: "Due Friday Blocked Design", tags: "Blocked Design" }, host: { description: "Owner: Ana", name: "Mission 42", attribute: null }, restored: "Due Friday Blocked Design", axe: [] },
  },
  {
    name: "US4-13, edge case of very long titles and unbreakable identifiers: a 60-character identifier with no break opportunity as the title, and another as the description, wrap inside the row in a 200 px container, in each layout, and the row is never wider than the container (FR-040)",
    run: async (driver) => {
      const identifier = "mission-7f3a9c2e8b1d4f6a0c5e7b9d2f4a6c8e0b1d3f5a7c9e1b3d5f7a";
      await driver.mount(
        (["row", "card"] as const)
          .map((layout) => `<div id="${layout}-box" class="box"><ocelle-action-row id="${layout}" layout="${layout}"><span id="${layout}-title">${identifier}</span><span id="${layout}-description" slot="description">${identifier.replace("mission", "digest-")}</span></ocelle-action-row></div>`)
          .join(""),
      );
      await driver.rules(".box { inline-size: 200px; }");
      const found: Record<string, unknown> = {};
      for (const layout of ["row", "card"]) {
        const [host, box] = [await driver.box(layout), await driver.box(`${layout}-box`)];
        const [title, description] = [await driver.box(`${layout}-title`), await driver.box(`${layout}-description`)];
        found[layout] = {
          length: identifier.length,
          titleWraps: (await driver.lines(`${layout}-title`)).length > 1,
          descriptionWraps: (await driver.lines(`${layout}-description`)).length > 1,
          withinContainer: host.width <= box.width + 0.5 && host.x >= box.x - 0.5,
          withinRow: title.x + title.width <= host.x + host.width + 0.5 && description.x + description.width <= host.x + host.width + 0.5,
        };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: Object.fromEntries(["row", "card"].map((layout) => [layout, { length: 60, titleWraps: true, descriptionWraps: true, withinContainer: true, withinRow: true }])),
      axe: [],
    },
  },
  {
    name: "US4-14: slotted description and tag elements keep their own box, as wide as the same text outside the row (not sized as icons); only the icon and trailing slots size their elements as icons, at 20 px (FR-038)",
    run: async (driver) => {
      await driver.mount(
        `<p class="ref"><span id="ref-description">Due Friday</span> <span id="ref-tag">Blocked</span></p>` +
          '<ocelle-action-row id="r"><ocelle-icon id="r-icon" slot="icon" name="folder"></ocelle-icon>Mission 42<span id="r-description" slot="description">Due Friday</span><span id="r-tag" slot="tags">Blocked</span><ocelle-icon id="r-trailing" slot="trailing" name="arrow-end"></ocelle-icon></ocelle-action-row>',
      );
      await driver.rules(".ref { font-size: var(--ocelle-font-size-md); line-height: var(--ocelle-line-height-normal); }");
      const size = (box: Box): [number, number] => [tenth(box.width), tenth(box.height)];
      const [description, tag, refDescription, refTag] = [await driver.box("r-description"), await driver.box("r-tag"), await driver.box("ref-description"), await driver.box("ref-tag")];
      return {
        description: Math.abs(description.width - refDescription.width) <= 0.5,
        tag: Math.abs(tag.width - refTag.width) <= 0.5,
        notIcons: [size(description)[0] !== icon, size(tag)[0] !== icon],
        icons: [size(await driver.box("r-icon")), size(await driver.box("r-trailing"))],
        axe: await severe(driver),
      };
    },
    expected: { description: true, tag: true, notIcons: [true, true], icons: [[icon, icon], [icon, icon]], axe: [] },
  },
  {
    name: "US4-15: two card rows in a two-column grid, the second with a title that wraps, and a row stretched in a flex row beside a taller sibling: each row's hit layer fills its host (its box, read from the layer, equals the host's), both cards as tall as their grid row; a click 4 px inside the shorter card's bottom edge, and inside the stretched row's, dispatches exactly one ocelle-action-row-activate (FR-001; plan decision 30)",
    run: async (driver) => {
      await driver.mount(
        '<div id="grid"><ocelle-action-row id="short" layout="card" row-id="a">Mission 1</ocelle-action-row><ocelle-action-row id="tall" layout="card" row-id="b">Mission 2 with a title long enough to wrap onto several lines in its narrow cell</ocelle-action-row></div>' +
          '<div id="flex"><div class="tall"></div><ocelle-action-row id="stretched" row-id="c">Mission 3</ocelle-action-row></div>',
      );
      await driver.rules("#grid { display: grid; grid-template-columns: 1fr 1fr; inline-size: 400px; gap: 8px; } #flex { display: flex; gap: 8px; inline-size: 400px; } .tall { block-size: 120px; inline-size: 20px; } #stretched { flex: 1; }");
      const filled: Record<string, boolean> = {};
      for (const id of ["short", "tall", "stretched"]) filled[id] = same(await driver.box(id), await driver.box(id, hit));
      const [short, tall] = [await driver.box("short"), await driver.box("tall")];
      const clicked: Record<string, unknown> = {};
      for (const id of ["short", "stretched"]) {
        const host = await driver.box(id);
        await driver.events(id, [activate]);
        await driver.click(id, { position: { x: host.width / 2, y: host.height - 4 } });
        clicked[id] = dispatches(await driver.takeEvents(), activate, id);
      }
      const stretched = await driver.box("stretched");
      return { filled, equalCards: Math.abs(short.height - tall.height) <= 0.5, wrapped: tall.height > targetMin, stretchedTall: stretched.height >= 120, clicked, axe: await severe(driver) };
    },
    expected: { filled: { short: true, tall: true, stretched: true }, equalCards: true, wrapped: true, stretchedTall: true, clicked: { short: 1, stretched: 1 }, axe: [] },
  },
  {
    name: "US4-15, the content beside the control: in each layout, a pointer click at the centre of a row's slotted description, of a tag and of the trailing icon passes through the inner control and dispatches exactly one ocelle-action-row-activate each, and the click reaches the row once each (FR-001; plan decision 30)",
    run: async (driver) => {
      const content = (id: string): string =>
        `Mission 42<span id="${id}-description" slot="description">Due Friday</span><span id="${id}-tag" slot="tags">Blocked</span><span slot="tags">Design</span><ocelle-icon id="${id}-trailing" slot="trailing" name="arrow-end"></ocelle-icon>`;
      await driver.mount(`<div class="box">${row("row", "default", undefined, content("row"), ' layout="row" row-id="r"')}${row("card", "default", undefined, content("card"), ' layout="card" row-id="c"')}</div>`);
      await driver.rules(".box { inline-size: 400px; }");
      const found: Record<string, unknown> = {};
      for (const layout of ["row", "card"]) {
        for (const part of ["description", "tag", "trailing"]) {
          await driver.events(layout, ["click", activate]);
          await driver.click(`${layout}-${part}`);
          found[`${layout} ${part}`] = counts(await driver.takeEvents(), layout);
        }
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: Object.fromEntries(["row", "card"].flatMap((layout) => ["description", "tag", "trailing"].map((part) => [`${layout} ${part}`, { click: 1, activate: 1 }]))),
      axe: [],
    },
  },
  {
    name: 'US4-16: title="Open the mission" on a row\'s host is moved: one node with a role other than generic or a name, no host title, no named generic node; described "Open the mission" with no slotted description or tags; with a slotted description the slots describe it ("Due Friday"); with an empty or a whitespace-only description element and no tags it is still "Open the mission", "Due Friday" after that text is written into the empty element and "Open the mission" again once it is removed (FR-030, FR-034)',
    run: async (driver) => {
      await driver.mount(
        '<ocelle-action-row id="t" title="Open the mission">Mission 42</ocelle-action-row>' +
          '<ocelle-action-row id="d" title="Open the mission">Mission 42<span slot="description">Due Friday</span></ocelle-action-row>' +
          '<ocelle-action-row id="e" title="Open the mission">Mission 42<span id="e-description" slot="description"></span></ocelle-action-row>' +
          '<ocelle-action-row id="w" title="Open the mission">Mission 42<span slot="description">   </span></ocelle-action-row>',
      );
      const description = async (id: string): Promise<string> => (await driver.axState(id, control)).description;
      const first = { meaningful: await meaningful(driver, "t"), host: await driver.attribute("t", "title"), mirror: await driver.attribute("t", "data-ocelle-moved-title"), name: (await driver.axState("t", control)).name, description: await description("t") };
      const slotted = await description("d");
      const empty = await description("e");
      const whitespace = await description("w");
      await driver.setProperty("e-description", "textContent", "Due Friday");
      const written = await description("e");
      await driver.setProperty("e-description", "textContent", "");
      return { first, slotted, empty, whitespace, written, removed: await description("e"), axe: await severe(driver) };
    },
    expected: {
      first: { meaningful: [{ role: "button", name: "Mission 42", description: "Open the mission" }], host: null, mirror: "Open the mission", name: "Mission 42", description: "Open the mission" },
      slotted: "Due Friday",
      empty: "Open the mission",
      whitespace: "Open the mission",
      written: "Due Friday",
      removed: "Open the mission",
      axe: [],
    },
  },
  ...(["ltr", "rtl"] as const).map(
    (direction): Scenario => ({
      name: `US4-18 (${direction}): a row-layout row with an icon, a title, a description, two tags and a trailing icon shares one line when its container is wide enough; in a container narrower than that line but wider than the icon, title and description, the tags and the trailing icon move together to a second line (both start below the first line's boxes and share one line) and the icon, title and description stay on the first line, unwrapped (FR-032)`,
      run: async (driver) => {
        await driver.mount(`<div id="box" dir="${direction}">${fullRow}</div>`);
        await driver.rules("#box { inline-size: 800px; }");
        const parts = ["r-icon", "r-title", "r-description", "r-tag-1", "r-tag-2", "r-trailing"];
        const read = async (): Promise<Record<string, Extent>> => Object.fromEntries(await Promise.all(parts.map(async (id) => [id, extent(await driver.box(id), direction)] as const)));
        const wide = await read();
        const inner = extent(await driver.box("r", control), direction);
        const first = ["r-icon", "r-title", "r-description"];
        const end = ["r-tag-1", "r-tag-2", "r-trailing"];
        const of = (boxes: Record<string, Extent>, ids: readonly string[]): Extent[] => ids.map((id) => boxes[id] ?? { start: 0, end: 0, top: 0, bottom: 0 });
        const overlapping = (a: Extent, b: Extent): boolean => a.top < b.bottom && b.top < a.bottom;
        const oneLine = (boxes: Record<string, Extent>, ids: readonly string[]): boolean => of(boxes, ids).every((box) => of(boxes, ids).every((other) => overlapping(box, other)));
        const leadWidth = Math.max(...of(wide, first).map((box) => Math.abs(box.end - inner.start))) + padding + 30;
        const allWidth = Math.max(...of(wide, [...first, ...end]).map((box) => Math.abs(box.end - inner.start))) + padding;
        await driver.rules(`#box { inline-size: ${String(Math.round(leadWidth))}px; }`);
        const narrow = await read();
        const firstBottom = Math.max(...of(narrow, first).map((box) => box.bottom));
        return {
          wide: oneLine(wide, [...first, ...end]),
          narrower: leadWidth < allWidth,
          firstLine: oneLine(narrow, first),
          belowFirst: of(narrow, end).every((box) => box.top >= firstBottom - 0.5),
          endTogether: oneLine(narrow, end),
          unwrapped: [(await driver.lines("r-title")).length, (await driver.lines("r-description")).length],
          axe: await severe(driver),
        };
      },
      expected: { wide: true, narrower: true, firstLine: true, belowFirst: true, endTogether: true, unwrapped: [1, 1], axe: [] },
    }),
  ),
  {
    name: 'Decision 19, mirrors on the row: after aria-label="Open mission 42" and title="Mission details" are moved, the host carries data-ocelle-moved-aria-label and data-ocelle-moved-title; a copy parsed from its outerHTML and a cloneNode(true) copy are each named "Open mission 42" and described "Mission details", with neither host attribute; after aria-label="" its mirror is gone and the name is the title again (FR-004, FR-030)',
    run: async (driver) => {
      await driver.mount('<div id="live"><ocelle-action-row id="r" aria-label="Open mission 42" title="Mission details">Mission 42</ocelle-action-row></div><div id="parsed"></div><div id="cloned"></div>');
      const pair = async (id: string, name: string): Promise<unknown> => ({ host: await driver.attribute(id, name), mirror: await driver.attribute(id, `data-ocelle-moved-${name}`) });
      const mirrors = { label: await pair("r", "aria-label"), title: await pair("r", "title") };
      await driver.copy("r", "outerHTML", "parsed");
      await driver.copy("r", "clone", "cloned");
      const copy = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        return { name: state.name, description: state.description, host: [await driver.attribute(id, "aria-label"), await driver.attribute(id, "title")] };
      };
      const copies = { parsed: await copy("r-parsed"), cloned: await copy("r-cloned") };
      await driver.setAttribute("r", "aria-label", "");
      return { mirrors, copies, after: { label: await pair("r", "aria-label"), name: (await driver.axState("r", control)).name }, axe: await severe(driver) };
    },
    expected: {
      mirrors: { label: { host: null, mirror: "Open mission 42" }, title: { host: null, mirror: "Mission details" } },
      copies: {
        parsed: { name: "Open mission 42", description: "Mission details", host: [null, null] },
        cloned: { name: "Open mission 42", description: "Mission details", host: [null, null] },
      },
      after: { label: { host: null, mirror: null }, name: "Mission 42" },
      axe: [],
    },
  },
  {
    name: 'Decision 24, the row\'s morph: a morph that applies the unchanged server markup <ocelle-action-row aria-label="Open mission 42">Mission 42</ocelle-action-row> to the live row leaves the mirror with its value and the row named "Open mission 42"; a copy through the container\'s innerHTML afterwards is named "Open mission 42"; a mirror the host removes, and one it overwrites, read their stored value again (FR-004)',
    run: async (driver) => {
      const server = '<ocelle-action-row id="m" aria-label="Open mission 42">Mission 42</ocelle-action-row>';
      await driver.mount(`<div id="live">${server}</div><div id="copied"></div>`);
      await driver.morph("m", server);
      const morphed = { host: await driver.attribute("m", "aria-label"), mirror: await driver.attribute("m", "data-ocelle-moved-aria-label"), name: (await driver.axState("m", control)).name };
      await driver.copy("live", "innerHTML", "copied");
      const copied = (await driver.axState("m-copied", control)).name;
      await driver.setAttribute("m", "data-ocelle-moved-aria-label", null);
      const removed = await driver.attribute("m", "data-ocelle-moved-aria-label");
      await driver.setAttribute("m", "data-ocelle-moved-aria-label", "Something else");
      return { morphed, copied, removed, overwritten: await driver.attribute("m", "data-ocelle-moved-aria-label"), name: (await driver.axState("m", control)).name, axe: await severe(driver) };
    },
    expected: { morphed: { host: null, mirror: "Open mission 42", name: "Open mission 42" }, copied: "Open mission 42", removed: "Open mission 42", overwritten: "Open mission 42", name: "Open mission 42", axe: [] },
  },
  {
    name: "Edge case, a row with an icon and an empty title: with no label and no host name, axe reports exactly button-name for the button-mode row and link-name for the link-mode row, and nothing for its named twin; each keeps the minimum block size of 44 px (FR-006, FR-031, FR-034)",
    run: async (driver) => {
      const folder = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';
      await driver.mount(`<p id="empty"><ocelle-action-row id="e">${folder}</ocelle-action-row></p><p id="link"><ocelle-action-row id="l" href="#missions">${folder}</ocelle-action-row></p><p id="named"><ocelle-action-row id="n">${folder}Mission 42</ocelle-action-row></p>`);
      return {
        empty: await severe(driver, "empty"),
        link: await severe(driver, "link"),
        named: await severe(driver, "named"),
        names: [(await driver.axState("e", control)).name, (await driver.axState("l", control)).name],
        heights: [(await driver.box("e")).height >= targetMin, (await driver.box("l")).height >= targetMin],
      };
    },
    expected: { empty: ["violation button-name"], link: ["violation link-name"], named: [], names: ["", ""], heights: [true, true] },
  },
];

