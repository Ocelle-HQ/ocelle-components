// The shared bodies of User Story 1's browser scenarios, `ocelle-button` in button mode (012 spec US1-1 to US1-19 and
// the edge cases of contracts/checks.md § Edge cases and plan decisions that belong to phase 2; FR-001, FR-003, FR-006,
// FR-009 to FR-014, FR-018 to FR-020, FR-022, FR-023; research.md R-01, R-05, R-06, R-08, R-09, R-12; plan decisions
// 6, 7, 18, 20, 23 and 26; tasks.md T016). Each body is written once against the driver and run in process on the
// element source (test/button.test.ts) and on the built browser build on the strict-CSP fixture
// (test/browser/button.test.ts). Expected values are written by hand: colours by token name from the hand-written token
// table (packages/tokens/test/expected.ts, through `tokenColour`), the state tables of research.md R-08 items 3, 4 and
// 4a transcribed below, forced colours from R-12's table read as `resolveColour(<keyword>)`, sizes from spec FR-011
// (44 px from `--ocelle-target-min`, the 24 px of the compact size written by hand, not read from `--ocelle-space-6`).
// Every body ends with axe on its page (006's rule selection): no serious or critical result, except the empty-name
// edge case, which expects `button-name` by name.
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named here (run once
// and recorded in reviews/phase-2/plants.md):
// - a disabled button delivers no `click` and no `ocelle-button-activate` (US1-3) beside its enabled twin's one each;
//   plant: the host guard limited to clicks outside the inner control (no `disabled` check);
// - a click outside the inner control of a restyled host delivers nothing (US1-17) beside the inner centre's one click
//   and one activate event; plant: no host listener;
// - a stretched host has no area outside the inner control (US1-15): the boxes are equal and a click 4 px inside the
//   bottom edge delivers one click; plant: the host restored to `display: inline-block`;
// - the activate event comes once per activation, before the click (US1-2); plant: no activate event;
// - a cancelled activate event leaves the click delivered once, `defaultPrevented` true (US1-18); plant: the cancel not
//   forwarded to the click;
// - the form receives no `submit` and no `reset` (US1-19) beside the click and the activate event of each activation;
//   plant: activation calls the enclosing form's `requestSubmit()`;
// - the quiet border on `ground="hover-bg"` is `accent-strong` on canvas and on `hover-bg` (US1-16); plant: the
//   `hover-bg` ground ignored;
// - `ground="chrome"` gives the chrome look (US1-4, US1-5, US1-13, US1-14); plant: `chrome` treated as unknown;
// - a flush hover shows no change only on the hand-written exception grounds (US1-14); plant: the flush hover token
//   changed;
// - a pointer focus shows no ring (US1-10) beside the keyboard focus's ring; plant: the ring on `:focus` instead;
// - the baseline fix moves nothing inside the control (plan decision 33, review round 5 O3-01): beside each one-line
//   button's label on the text's baseline, its icon wrapper (the spinner while busy) and its label start at the same
//   block position; plant: `.icon-row { align-items: baseline }` in place of the label's `align-self: baseline`;
// - the baseline fix leaves an icon-only button where it was (plan decision 33 as amended by review round 6, O6-01):
//   beside the labelled cases above, an icon-only button's icon (default, compact, busy) has the block-centre of a
//   native `<button>`'s svg in the same line; plant: the unscoped `.icon-row > .label { align-self: baseline }` in
//   place of the scoped `.icon-row:not(.bare) > .label` rule.
import { expectedDrawing } from "../icons-expected.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, EventRecord, Palette } from "./driver.ts";

export type { Scenario } from "./icon.ts";

/** The inner control of an `ocelle-button`, by its CSS part. */
const control = '[part="control"]';
const transparent = "rgba(0, 0, 0, 0)";
const activate = "ocelle-button-activate";
const themes: readonly Palette[] = ["light", "dark"];

/** `--ocelle-target-min` at the default root font size (002 Appendix A: 2.75rem). */
const targetMin = 44;
/** The compact minimum of FR-011 (WCAG 2.5.8), written by hand. */
const compactMin = 24;
/** The gap of the slot convention, `--ocelle-space-2`. */
const gap = 8;
/** The icon size, `--ocelle-icon-size`. */
const icon = 20;

const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;
const colour = (token: string, theme: Palette): string => tokenColour(`color-${token}`, theme);

/** The serious and critical axe results of the page (or of `scope`), by rule id. */
export async function severe(driver: Driver, scope?: string): Promise<string[]> {
  return (await driver.axe(scope)).filter((result) => result.impact === "serious" || result.impact === "critical").map((result) => `${result.kind} ${result.id}`);
}

/** The number of dispatches (distinct serials) of `type` whose target was the element `id`. */
export function dispatches(records: readonly EventRecord[], type: string, id: string): number {
  return new Set(records.filter((record) => record.type === type && record.target === `ocelle-button#${id}`).map((record) => record.serial)).size;
}

/** The click and activate dispatches at the element `id`. */
function counts(records: readonly EventRecord[], id: string): { readonly click: number; readonly activate: number } {
  return { click: dispatches(records, "click", id), activate: dispatches(records, activate, id) };
}

/** One type's records summarised: where each listener was, the targets, the serials and the flags seen. */
export function summary(records: readonly EventRecord[], type: string): unknown {
  const of = records.filter((record) => record.type === type);
  return {
    at: of.map((record) => record.at),
    targets: [...new Set(of.map((record) => record.target))],
    serials: new Set(of.map((record) => record.serial)).size,
    flags: [...new Set(of.map((record) => JSON.stringify({ isTrusted: record.isTrusted, bubbles: record.bubbles, composed: record.composed, cancelable: record.cancelable, defaultPrevented: record.defaultPrevented })))].map((text) => JSON.parse(text) as unknown),
    details: [...new Set(of.map((record) => JSON.stringify(record.detail)))],
  };
}

/** The listeners from the button out to `window` when it sits in `<div id="wrap">`. */
const path = ["ocelle-button#b", "div#wrap", "body", "html", "document", "window"];

/** The computed look of the inner control: its fill, its border colour and width (top side) and its text colour. */
async function look(driver: Driver, id: string): Promise<{ readonly fill: string; readonly border: string; readonly ink: string }> {
  return { fill: await driver.computed(id, "background-color", control), border: await driver.computed(id, "border-top-color", control), ink: await driver.computed(id, "color", control) };
}

/** The ground rules of the scenario pages: a class per ground token, its colour as the background. */
const groundTokens = ["canvas", "sheet", "pane", "panel", "inspector", "rail", "inset", "accent-low", "hover-bg", "danger-bg", "warning-bg", "success-bg", "info-bg", "neutral-bg", "chrome", "chrome-hover"] as const;
type Ground = (typeof groundTokens)[number];
const groundRules = groundTokens.map((ground) => `.on-${ground} { background-color: var(--ocelle-color-${ground}); color: var(--ocelle-color-${ground.startsWith("chrome") ? "chrome-ink" : "ink"}); padding: 8px; }`).join(" ");

/** The `ground` attribute a host sets for a ground (FR-018): none on the six other main grounds. */
function groundAttribute(ground: Ground): string | undefined {
  if (ground === "inset" || ground === "accent-low" || ground === "hover-bg") return ground;
  if (ground.endsWith("-bg")) return "state";
  if (ground === "chrome" || ground === "chrome-hover") return "chrome";
  return undefined;
}

export type Variant = "primary" | "secondary" | "quiet";
type Kind = Variant | "flush";

/** Markup of a button of a kind on a ground, with its id. */
function button(id: string, kind: Kind, ground: string | undefined, text = "Save", extra = ""): string {
  const variant = kind === "flush" ? "" : ` variant="${kind}"`;
  const flush = kind === "flush" ? " flush" : "";
  const groundAttr = ground === undefined ? "" : ` ground="${ground}"`;
  return `<ocelle-button id="${id}"${variant}${flush}${groundAttr}${extra}>${text}</ocelle-button>`;
}

/**
 * The idle look of research.md R-08's tables (items 3, 4, 4a, 5): `ground` the attribute (undefined, `accent-low`,
 * `inset`, `hover-bg`, `state` or `chrome`).
 */
export function idle(variant: Variant, ground: string | undefined, theme: Palette): { fill: string; border: string; ink: string } {
  const c = (token: string): string => colour(token, theme);
  if (variant === "primary") return { fill: c("accent"), border: c("accent-strong"), ink: c("on-accent") };
  if (ground === "chrome") return { fill: transparent, border: c("chrome-muted"), ink: c("chrome-ink") };
  const border = ground === undefined ? c("control-border") : c("accent-strong");
  return { fill: variant === "secondary" ? c("sheet") : transparent, border, ink: c("ink") };
}

/** The hover and active fills and borders of R-08's tables; a flush control has no border. */
function pointerLook(kind: Kind, chrome: boolean, state: "hover" | "active", theme: Palette): { fill: string; border: string | null } {
  const c = (token: string): string => colour(token, theme);
  const border = chrome ? c("chrome-ink") : c("hover-border");
  if (kind === "flush") return { fill: chrome ? c(state === "hover" ? "chrome-hover" : "chrome-active") : c(state === "hover" ? "hover-bg" : "active-bg"), border: null };
  if (kind === "primary") return { fill: c(state === "hover" ? "accent-hover" : "accent"), border };
  return { fill: chrome ? c(state === "hover" ? "chrome-hover" : "chrome-active") : c(state === "hover" ? "hover-bg" : "active-bg"), border };
}

/**
 * The grounds on which a flush control's hover fill equals the ground, so its hover shows no change (FR-019, plan
 * decision 6), written by hand per theme: `hover-bg` in both themes, `inset` in light (light `inset` and `hover-bg` are
 * both #E2DDD3), `neutral-bg` in dark (the operator's addition at phase 2) and `chrome-hover` (with `ground="chrome"`)
 * in both themes.
 */
const flushHoverUnchanged: Readonly<Record<Palette, readonly Ground[]>> = { light: ["inset", "hover-bg", "chrome-hover"], dark: ["hover-bg", "neutral-bg", "chrome-hover"] };

function inside(point: { x: number; y: number }, box: Box): boolean {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

function same(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs(a.width - b.width) <= 0.5 && Math.abs(a.height - b.height) <= 0.5;
}

/** The ways US1-2 activates a button, each from a fresh mount. */
const activations = [
  { name: "a pointer click", act: (driver: Driver, id: string) => driver.click(id), trusted: true },
  {
    name: "Enter on the focused button",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
    trusted: true,
  },
  {
    name: "Space on the focused button",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press(" ");
    },
    trusted: true,
  },
  { name: "the element's click() method", act: (driver: Driver, id: string) => driver.callClick(id), trusted: false },
] as const;

/** The three page rules of spec § "Restyled host", on the element. */
const restyles = ["display: block;", "display: flex; width: 100%;", "display: block; height: 90px;"];

/** The scenarios of one theme where colours depend on it. */
function themed(theme: Palette): Scenario[] {
  const c = (token: string): string => colour(token, theme);
  const variants: readonly Variant[] = ["primary", "secondary", "quiet"];
  const grounds = [undefined, "accent-low", "inset", "hover-bg", "state", "chrome"] as const;
  return [
    {
      name: `US1-4, US1-5 (${theme}): each variant's idle fill, border and label come from the tokens of research.md R-08 for each ground attribute: control-border on the main grounds, accent-strong on accent-low, inset, hover-bg and the state grounds, the chrome look with ground="chrome", the primary's accent fill and accent-strong border everywhere (FR-010, FR-018)`,
      run: async (driver) => {
        const surfaces: Readonly<Record<string, Ground>> = { "accent-low": "accent-low", inset: "inset", "hover-bg": "hover-bg", state: "danger-bg", chrome: "chrome" };
        const surface = (ground: string | undefined): Ground => (ground === undefined ? "canvas" : (surfaces[ground] ?? "canvas"));
        const markup = variants.flatMap((variant) => grounds.map((ground, at) => `<div class="on-${surface(ground)}">${button(`${variant}-${String(at)}`, variant, ground)}</div>`));
        await driver.mount(`${markup.join("")}<p id="away">Away</p>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.hover("away");
        const looks: Record<string, unknown> = {};
        for (const variant of variants) for (const [at] of grounds.entries()) looks[`${variant}-${String(at)}`] = await look(driver, `${variant}-${String(at)}`);
        return { looks, axe: await severe(driver) };
      },
      expected: {
        looks: Object.fromEntries(variants.flatMap((variant) => grounds.map((ground, at) => [`${variant}-${String(at)}`, idle(variant, ground, theme)]))),
        axe: [],
      },
    },
    ...(["primary", "secondary", "quiet", "flush"] as const).map(
      (kind): Scenario => ({
        name: `US1-13, US1-14 (${theme}), ${kind}: on each main, state and chrome ground (with its ground attribute) the hover and the active look have the fill and border of research.md R-08 and differ from the idle look and from each other, except a flush hover on the grounds where the hover fill equals the ground (hover-bg, inset in light, neutral-bg in dark, chrome-hover) (FR-012, FR-019)`,
        run: async (driver) => {
          const markup = groundTokens.map((ground) => `<div class="on-${ground}">${button(`g-${ground}`, kind, groundAttribute(ground))}</div>`);
          await driver.mount(`${markup.join("")}<p id="away">Away</p>`);
          await driver.rules(groundRules);
          await driver.theme(theme);
          const found: Record<string, unknown> = {};
          for (const ground of groundTokens) {
            const id = `g-${ground}`;
            const surface = colour(ground, theme);
            await driver.hover("away");
            const rest = await look(driver, id);
            await driver.hover(id);
            const hovered = await look(driver, id);
            await driver.pointerDown(id);
            const pressed = await look(driver, id);
            await driver.pointerUp(id);
            await driver.hover("away");
            const width = await driver.computed(id, "border-top-width", control);
            const visible = (state: { fill: string; border: string }): string => `${state.fill === transparent ? surface : state.fill} ${kind === "flush" ? "" : state.border}`;
            found[ground] = {
              hover: { fill: hovered.fill, border: kind === "flush" ? null : hovered.border },
              active: { fill: pressed.fill, border: kind === "flush" ? null : pressed.border },
              differs: { hoverFromIdle: visible(hovered) !== visible(rest), activeFromIdle: visible(pressed) !== visible(rest), hoverFromActive: visible(hovered) !== visible(pressed) },
              borderWidth: width,
            };
          }
          return { found, axe: await severe(driver) };
        },
        expected: {
          found: Object.fromEntries(
            groundTokens.map((ground) => {
              const chrome = groundAttribute(ground) === "chrome";
              const unchanged = kind === "flush" && flushHoverUnchanged[theme].includes(ground);
              return [
                ground,
                {
                  hover: pointerLook(kind, chrome, "hover", theme),
                  active: pointerLook(kind, chrome, "active", theme),
                  differs: { hoverFromIdle: !unchanged, activeFromIdle: true, hoverFromActive: true },
                  borderWidth: kind === "flush" ? "0px" : "1px",
                },
              ];
            }),
          ),
          axe: [],
        },
      }),
    ),
    {
      name: `US1-13 (${theme}): flush on each variant has no border and no fill, its label in color-ink (color-chrome-ink with ground="chrome"), and keyboard focus shows the token ring (FR-012, FR-020)`,
      run: async (driver) => {
        const markup = variants.flatMap((variant) => [
          `<ocelle-button id="${variant}-main" variant="${variant}" flush>Save</ocelle-button>`,
          `<span class="on-chrome"><ocelle-button id="${variant}-chrome" variant="${variant}" ground="chrome" flush>Save</ocelle-button></span>`,
        ]);
        await driver.mount(`<div class="on-canvas"><button id="start" type="button">Start</button> ${markup.join(" ")}<p id="away">Away</p></div>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.hover("away");
        const found: Record<string, unknown> = {};
        for (const variant of variants) {
          for (const ground of ["main", "chrome"]) {
            const id = `${variant}-${ground}`;
            found[id] = { borderWidth: await driver.computed(id, "border-top-width", control), fill: await driver.computed(id, "background-color", control), ink: await driver.computed(id, "color", control) };
          }
        }
        await driver.focus("start");
        await driver.press("Tab");
        const ring = { active: await driver.activeInner("primary-main"), style: await driver.computed("primary-main", "outline-style", control), color: await driver.computed("primary-main", "outline-color", control) };
        return { found, ring, axe: await severe(driver) };
      },
      expected: {
        found: Object.fromEntries(
          variants.flatMap((variant) => [
            [`${variant}-main`, { borderWidth: "0px", fill: transparent, ink: c("ink") }],
            [`${variant}-chrome`, { borderWidth: "0px", fill: transparent, ink: c("chrome-ink") }],
          ]),
        ),
        ring: { active: "button", style: "solid", color: c("focus") },
        axe: [],
      },
    },
    {
      name: `US1-10 (${theme}): keyboard focus draws the token ring on the inner control (focus colour, focus width, focus offset, solid), a pointer click does not; the host's focus() focuses the inner control (FR-020)`,
      run: async (driver) => {
        await driver.mount('<div class="on-canvas"><button id="before" type="button">Before</button> <ocelle-button id="b">Save</ocelle-button><p id="away">Away</p></div>');
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.click("b");
        const pointer = { active: await driver.activeInner("b"), style: await driver.computed("b", "outline-style", control) };
        await driver.focus("before");
        await driver.press("Tab");
        const keyboard = {
          active: await driver.activeInner("b"),
          style: await driver.computed("b", "outline-style", control),
          width: await driver.computed("b", "outline-width", control),
          color: await driver.computed("b", "outline-color", control),
          offset: await driver.computed("b", "outline-offset", control),
        };
        await driver.focus("before");
        const blurred = await driver.activeInner("b");
        await driver.focus("b");
        return { pointer, keyboard, blurred, programmatic: await driver.activeInner("b"), axe: await severe(driver) };
      },
      expected: {
        pointer: { active: "button", style: "none" },
        keyboard: { active: "button", style: "solid", width: "3px", color: c("focus"), offset: "2px" },
        blurred: null,
        programmatic: "button",
        axe: [],
      },
    },
    {
      name: `US1-16 (${theme}): a quiet button with ground="hover-bg" has an accent-strong border on canvas and on hover-bg, the changing surface's two states (FR-018)`,
      run: async (driver) => {
        await driver.mount(`<div class="on-canvas">${button("on-canvas", "quiet", "hover-bg", "Retry")}</div><div class="on-hover-bg">${button("on-hover", "quiet", "hover-bg", "Retry")}</div><p id="away">Away</p>`);
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.hover("away");
        return { canvas: await driver.computed("on-canvas", "border-top-color", control), hover: await driver.computed("on-hover", "border-top-color", control), axe: await severe(driver) };
      },
      expected: { canvas: c("accent-strong"), hover: c("accent-strong"), axe: [] },
    },
    {
      name: `Edge case, unknown values (${theme}): variant="danger", size="huge" and ground="lava" render as the default button (secondary, default size, main grounds): the same look, box and type as a button with no attribute, reflected as written, with no error`,
      run: async (driver) => {
        await driver.mount('<div class="on-canvas"><ocelle-button id="u" variant="danger" size="huge" ground="lava">Save</ocelle-button> <ocelle-button id="d">Save</ocelle-button><p id="away">Away</p></div>');
        await driver.rules(groundRules);
        await driver.theme(theme);
        await driver.hover("away");
        const read = async (id: string): Promise<unknown> => {
          const box = await driver.box(id);
          return { look: await look(driver, id), size: [tenth(box.width), tenth(box.height)], font: await driver.computed(id, "font-size", control), padding: await driver.computed(id, "padding-inline-start", control) };
        };
        const known = await read("d");
        return {
          look: await look(driver, "u"),
          sameAsDefault: JSON.stringify(await read("u")) === JSON.stringify(known),
          attributes: [await driver.attribute("u", "variant"), await driver.attribute("u", "size"), await driver.attribute("u", "ground")],
          messages: await driver.messages(),
          axe: await severe(driver),
        };
      },
      expected: { look: idle("secondary", undefined, theme), sameAsDefault: true, attributes: ["danger", "huge", "lava"], messages: [], axe: [] },
    },
  ];
}

/** The forced-colours scenario of one palette (US1-11, button mode; research.md R-12's table). */
function forced(palette: Palette): Scenario {
  const kinds: readonly Kind[] = ["primary", "secondary", "quiet", "flush"];
  const bordered = { rest: { ink: "ButtonText", border: "ButtonText", width: "1px" }, hovered: { border: "Highlight", outline: "none" }, pressed: { border: "Highlight", outline: "none" } };
  return {
    name: `US1-11, forced colours with the ${palette} palette: each variant's label and border are ButtonText, its hover and active border Highlight; a flush button has no border and its hover and active are a dashed Highlight outline; the focus ring is a solid Highlight outline; a disabled button is GrayText (FR-020; research.md R-12)`,
    run: async (driver) => {
      await driver.mount(`<button id="start" type="button">Start</button> ${kinds.map((kind) => button(kind, kind, undefined)).join(" ")} ${button("off", "secondary", undefined, "Save", " disabled")}<p id="away">Away</p>`);
      await driver.forcedColors("active", palette);
      const keywords = ["ButtonText", "Highlight", "GrayText"];
      const resolved = await Promise.all(keywords.map((keyword) => driver.resolveColour(keyword)));
      /** A computed colour by the system colour keyword it equals, or as computed. */
      const named = (value: string): string => keywords[resolved.indexOf(value)] ?? value;
      const read = async (id: string, property: string): Promise<string> => named(await driver.computed(id, property, control));
      const found: Record<string, unknown> = {};
      for (const kind of kinds) {
        await driver.hover("away");
        const rest = { ink: await read(kind, "color"), border: await read(kind, "border-top-color"), width: await driver.computed(kind, "border-top-width", control) };
        await driver.hover(kind);
        const hovered = kind === "flush" ? { width: await driver.computed(kind, "border-top-width", control), outline: await driver.computed(kind, "outline-style", control), colour: await read(kind, "outline-color") } : { border: await read(kind, "border-top-color"), outline: await driver.computed(kind, "outline-style", control) };
        await driver.pointerDown(kind);
        const pressed = kind === "flush" ? { width: await driver.computed(kind, "border-top-width", control), outline: await driver.computed(kind, "outline-style", control), colour: await read(kind, "outline-color") } : { border: await read(kind, "border-top-color"), outline: await driver.computed(kind, "outline-style", control) };
        await driver.pointerUp(kind);
        await driver.hover("away");
        found[kind] = { rest, hovered, pressed };
      }
      await driver.focus("start");
      await driver.press("Tab");
      const focus = { active: await driver.activeInner("primary"), style: await driver.computed("primary", "outline-style", control), colour: await read("primary", "outline-color") };
      const off = { ink: await read("off", "color"), border: await read("off", "border-top-color") };
      return { distinct: new Set(resolved).size, found, focus, off, axe: await severe(driver) };
    },
    expected: {
      distinct: 3,
      found: {
        primary: bordered,
        secondary: bordered,
        quiet: bordered,
        flush: {
          rest: { ink: "ButtonText", border: "ButtonText", width: "0px" },
          hovered: { width: "0px", outline: "dashed", colour: "Highlight" },
          pressed: { width: "0px", outline: "dashed", colour: "Highlight" },
        },
      },
      focus: { active: "button", style: "solid", colour: "Highlight" },
      off: { ink: "GrayText", border: "GrayText" },
      axe: [],
    },
  };
}

/** US1-12's flush cases: content and its first box, per size. */
const flushCases = [
  { name: "a label", content: (id: string) => `<span id="${id}-start">Projects</span>`, start: (id: string) => `${id}-start` },
  { name: "an icon and a label", content: (id: string) => `<ocelle-icon id="${id}-start" slot="icon" name="folder"></ocelle-icon><span>Projects</span>`, start: (id: string) => `${id}-start` },
  { name: "an icon only", content: (id: string) => `<ocelle-icon id="${id}-start" slot="icon" name="folder"></ocelle-icon>`, start: (id: string) => `${id}-start`, label: "Projects" },
  { name: "a one-character label", content: (id: string) => `<span id="${id}-start">P</span>`, start: (id: string) => `${id}-start` },
] as const;

/**
 * The accessibility nodes of the element `id` and its shadow tree that carry meaning: every node but an unnamed
 * `generic` one. Chromium 153 exposes the host of an `ocelle-button` as an unnamed `generic` node (as it does a host
 * with an `id`, mission 005's finding, src/naming.ts `expose`), which no screen reader announces (US1-1 below).
 */
export async function meaningful(driver: Driver, id: string): Promise<unknown[]> {
  return (await driver.ax(id)).filter((node) => node.role !== "generic" || node.name !== "");
}

const chromeActions = ["Inbox", "History", "Settings", "Notifications", "Appearance"] as const;

export const chromeActionScenarios: readonly Scenario[] = chromeActions.map((label) => ({
  name: `Chrome action ${label} has a decorative drawing, keyboard focus and one intent per gesture across palettes and at twice the root size`,
  async run(driver) {
    const name = label.toLowerCase();
    const original = await driver.viewportSize();
    const observations = [];
    try {
      await driver.viewport(320, 800);
      for (const mode of ["light", "dark", "forced"] as const) {
        await driver.mount(`<div class="on-chrome"><ocelle-icon id="known" name="close"></ocelle-icon><button id="start">Start</button>
          <ocelle-button id="action" flush ground="chrome" label="${label}"><ocelle-icon id="glyph" slot="icon" name="${name}"></ocelle-icon></ocelle-button></div>`);
        await driver.rules(groundRules + " html { font-size: 200%; }");
        await driver.theme(mode === "dark" ? "dark" : "light");
        await driver.forcedColors(mode === "forced" ? "active" : "none");
        await driver.events("action", [activate]);
        await driver.focus("start");
        await driver.press("Tab");
        const focused = await driver.focusVisible("action", control);
        const outline = await driver.computed("action", "outline-style", control);
        await driver.press("Enter");
        const enter = dispatches(await driver.takeEvents(), activate, "action");
        await driver.press(" ");
        const space = dispatches(await driver.takeEvents(), activate, "action");
        const box = await driver.box("action");
        const paints = await driver.paints("glyph");
        const ink = await driver.computed("action", "color", control);
        observations.push({
          positiveControl: await driver.drawing("known"), drawing: await driver.drawing("glyph"),
          nodes: await meaningful(driver, "action"), focused, ring: outline !== "none",
          fits: box.x >= 0 && box.x + box.width <= 320, targetHeight: box.height,
          visibleStroke: paints.length > 1 && paints.every((part) => part.stroke === ink),
          enter, space,
        });
      }
      return observations;
    } finally {
      await driver.forcedColors("none");
      await driver.theme(null);
      await driver.viewport(original.width, original.height);
    }
  },
  expected: ["light", "dark", "forced"].map(() => ({
    positiveControl: expectedDrawing("close"), drawing: expectedDrawing(label.toLowerCase()),
    nodes: [{ role: "button", name: label }], focused: true, ring: true, fits: true,
    targetHeight: 88, visibleStroke: true, enter: 1, space: 1,
  })),
}));

export const buttonScenarios: readonly Scenario[] = [
  {
    name: "US1-1: <ocelle-button>Save</ocelle-button> is exactly one accessibility node with a role other than generic or a name, role button named Save, enabled and focusable; the host may show as an unnamed generic node beside it and no generic node for the host has a name; and one tab stop in Tab and Shift+Tab order (FR-001, FR-006)",
    run: async (driver) => {
      await driver.mount('<button id="before" type="button">Before</button> <ocelle-button id="b">Save</ocelle-button> <button id="after" type="button">After</button>');
      const state = await driver.axState("b", control);
      return {
        nodes: await driver.ax("b"),
        meaningful: await meaningful(driver, "b"),
        state: { role: state.role, name: state.name, disabled: state.disabled, focusable: state.focusable },
        forward: await driver.tabOrder(),
        reverse: await driver.tabOrder({ reverse: true }),
        axe: await severe(driver),
      };
    },
    expected: {
      nodes: [
        { role: "generic", name: "" },
        { role: "button", name: "Save" },
      ],
      meaningful: [{ role: "button", name: "Save" }],
      state: { role: "button", name: "Save", disabled: false, focusable: true },
      forward: [["button#before"], ["ocelle-button#b", "button"], ["button#after"]],
      reverse: [["button#after"], ["ocelle-button#b", "button"], ["button#before"]],
      axe: [],
    },
  },
  ...activations.map(
    ({ name, act, trusted }): Scenario => ({
      name: `US1-2, ${name}: exactly one ocelle-button-activate (bubbles, composed, cancelable, detail {}, target the host at every listener) recorded at the host, its ancestors, document and window before exactly one click, target the host at every listener (FR-001, FR-023)`,
      run: async (driver) => {
        await driver.mount('<div id="wrap"><ocelle-button id="b">Save</ocelle-button></div>');
        await driver.events("b", ["click", activate]);
        await act(driver, "b");
        const records = await driver.takeEvents();
        const click = summary(records, "click") as Record<string, unknown>;
        return { types: records.map((record) => record.type), activate: summary(records, activate), click: { at: click.at, targets: click.targets, serials: click.serials, flags: click.flags }, axe: await severe(driver) };
      },
      expected: {
        types: [...path.map(() => activate), ...path.map(() => "click")],
        activate: {
          at: path,
          targets: ["ocelle-button#b"],
          serials: 1,
          flags: [{ isTrusted: false, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }],
          details: ["{}"],
        },
        click: {
          at: path,
          targets: ["ocelle-button#b"],
          serials: 1,
          flags: [{ isTrusted: trusted, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }],
        },
        axe: [],
      },
    }),
  ),
  ...activations.map(
    ({ name, act }): Scenario => ({
      name: `US1-3, ${name}: a disabled button is not activated (no click at a bubble-phase listener, no ocelle-button-activate), while its enabled twin is activated once; the disabled one is out of the Tab and Shift+Tab order and reported disabled (FR-003, FR-014)`,
      run: async (driver) => {
        await driver.mount('<div id="wrap"><ocelle-button id="off" disabled>Save</ocelle-button> <ocelle-button id="on">Save</ocelle-button></div>');
        await driver.events("off", ["click", activate]);
        await act(driver, "off");
        const off = counts(await driver.takeEvents(), "off");
        await act(driver, "on");
        const on = counts(await driver.takeEvents(), "on");
        const state = await driver.axState("off", control);
        return {
          off,
          on,
          forward: await driver.tabOrder(),
          reverse: await driver.tabOrder({ reverse: true }),
          state: { role: state.role, name: state.name, disabled: state.disabled, focusable: state.focusable },
          axe: await severe(driver),
        };
      },
      expected: {
        off: { click: 0, activate: 0 },
        on: { click: 1, activate: 1 },
        forward: [["ocelle-button#on", "button"]],
        reverse: [["ocelle-button#on", "button"]],
        state: { role: "button", name: "Save", disabled: true, focusable: false },
        axe: [],
      },
    }),
  ),
  ...themes.flatMap(themed),
  ...themes.map(forced),
  {
    name: "US1-6, US1-7: size default is at least --ocelle-target-min (44 px) in both dimensions with a one-character label and icon-only, in font-size-md; size compact at least 24 px in both, smaller than default with the same content, in the compact text scale (font-size-sm, line-height-compact) (FR-011)",
    run: async (driver) => {
      const icon = '<ocelle-icon slot="icon" name="close"></ocelle-icon>';
      await driver.mount(
        `<p><ocelle-button id="d-char">S</ocelle-button> <ocelle-button id="d-icon" label="Close">${icon}</ocelle-button> <ocelle-button id="c-char" size="compact">S</ocelle-button> <ocelle-button id="c-icon" size="compact" label="Close">${icon}</ocelle-button></p>`,
      );
      const [dChar, dIcon, cChar, cIcon] = [await driver.box("d-char"), await driver.box("d-icon"), await driver.box("c-char"), await driver.box("c-icon")];
      const atLeast = (box: Box, min: number): [boolean, boolean] => [box.width >= min, box.height >= min];
      const smaller = (compact: Box, normal: Box): [boolean, boolean] => [compact.width < normal.width, compact.height < normal.height];
      return {
        default: { char: atLeast(dChar, targetMin), icon: atLeast(dIcon, targetMin), font: await driver.computed("d-char", "font-size", control) },
        compact: {
          char: atLeast(cChar, compactMin),
          icon: atLeast(cIcon, compactMin),
          smaller: { char: smaller(cChar, dChar), icon: smaller(cIcon, dIcon) },
          font: await driver.computed("c-char", "font-size", control),
          lineHeight: await driver.computed("c-char", "line-height", control),
        },
        axe: await severe(driver),
      };
    },
    expected: {
      default: { char: [true, true], icon: [true, true], font: "16px" },
      compact: { char: [true, true], icon: [true, true], smaller: { char: [true, true], icon: [true, true] }, font: "14px", lineHeight: "21px" },
      axe: [],
    },
  },
  ...(["ltr", "rtl"] as const).map(
    (direction): Scenario => ({
      name: `US1-8 (${direction}): a slotted folder icon is the icon size, centred on the label's first line, ${String(gap)} px from the label, ${direction === "ltr" ? "before (left of)" : "after (right of)"} it, and the name is the label "Open project" (mission 005's slot convention)`,
      run: async (driver) => {
        await driver.mount(`<p dir="${direction}"><ocelle-button id="b"><ocelle-icon id="i" slot="icon" name="folder"></ocelle-icon><span id="b-label">Open project</span></ocelle-button></p>`);
        const box = await driver.box("i");
        const [text] = await driver.lines("b-label");
        const label = await driver.box("b", ".label");
        const start = text ?? { x: 0, y: 0, width: 0, height: 0 };
        const left = box.x < start.x;
        const firstLine = label.height / (await driver.lines("b-label")).length;
        return {
          size: [box.width, box.height],
          side: left ? "left" : "right",
          gap: tenth(left ? start.x - (box.x + box.width) : box.x - (start.x + start.width)),
          centred: Math.abs(box.y + box.height / 2 - (label.y + firstLine / 2)) <= 0.5,
          name: (await driver.axState("b", control)).name,
          nodes: await meaningful(driver, "b"),
          axe: await severe(driver),
        };
      },
      expected: { size: [icon, icon], side: direction === "ltr" ? "left" : "right", gap, centred: true, name: "Open project", nodes: [{ role: "button", name: "Open project" }], axe: [] },
    }),
  ),
  {
    name: 'US1-9: an icon-only button with label="Close" is one button node named Close, the icon contributing nothing; the label is trimmed, and a whitespace-only label counts as none (FR-006, FR-013)',
    run: async (driver) => {
      const close = '<ocelle-icon slot="icon" name="close"></ocelle-icon>';
      await driver.mount(`<ocelle-button id="b" label="Close">${close}</ocelle-button> <ocelle-button id="t" label="  Close  ">${close}</ocelle-button> <ocelle-button id="w" label="   ">Save</ocelle-button>`);
      return {
        nodes: await meaningful(driver, "b"),
        subtree: (await driver.axSubtree("b")).filter((node) => ["button", "image", "img", "StaticText"].includes(node.role)),
        trimmed: (await driver.axState("t", control)).name,
        whitespace: (await driver.axState("w", control)).name,
        axe: await severe(driver),
      };
    },
    expected: { nodes: [{ role: "button", name: "Close" }], subtree: [{ role: "button", name: "Close" }], trimmed: "Close", whitespace: "Save", axe: [] },
  },
  // Op 022 (#57; ops/022-focus-trap-details-icon-name spec.md scenarios 6 to 8): an icon slotted into ocelle-button is
  // decorative. A bare svg with a <title> gets no accessibility node and adds nothing to the name, in the button and
  // the link mode; an ocelle-icon keeps the name the label's.
  {
    name: "op 022 (#57) scenario 6: a titled bare <svg> in the icon slot beside the text Open, in the button and the link mode: the inner control is named Open, and the subtree has no image node and no node named Folder (FR-003)",
    run: async (driver) => {
      const svg = '<svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>';
      await driver.mount(`<ocelle-button id="b">${svg}Open</ocelle-button> <ocelle-button id="k" href="#x">${svg}Open</ocelle-button>`);
      const read = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        const subtree = await driver.axSubtree(id);
        return { state: { role: state.role, name: state.name }, images: subtree.filter((node) => node.role === "image" || node.role === "img"), folder: subtree.filter((node) => node.name.includes("Folder")) };
      };
      return { button: await read("b"), link: await read("k"), axe: await severe(driver) };
    },
    expected: {
      button: { state: { role: "button", name: "Open" }, images: [], folder: [] },
      link: { state: { role: "link", name: "Open" }, images: [], folder: [] },
      axe: [],
    },
  },
  {
    name: 'op 022 (#57) scenario 7: a titled bare <svg> as the only content of an ocelle-button with label="Open project": the inner control is named Open project, and the subtree has no image node and no node named Folder (FR-003, FR-013)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b" label="Open project"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg></ocelle-button>');
      const state = await driver.axState("b", control);
      const subtree = await driver.axSubtree("b");
      return {
        state: { role: state.role, name: state.name },
        images: subtree.filter((node) => node.role === "image" || node.role === "img"),
        folder: subtree.filter((node) => node.name.includes("Folder")),
        axe: await severe(driver),
      };
    },
    expected: { state: { role: "button", name: "Open project" }, images: [], folder: [], axe: [] },
  },
  {
    name: 'op 022 (#57) scenario 7, link mode: a titled bare <svg> as the only content of an ocelle-button with href="#x" and label="Open project": the inner link is named Open project, and the subtree has no image node and no node named Folder (FR-003, phase-1 decision 1)',
    run: async (driver) => {
      await driver.mount('<ocelle-button id="k" href="#x" label="Open project"><svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg></ocelle-button>');
      const state = await driver.axState("k", control);
      const subtree = await driver.axSubtree("k");
      return {
        state: { role: state.role, name: state.name },
        images: subtree.filter((node) => node.role === "image" || node.role === "img"),
        folder: subtree.filter((node) => node.name.includes("Folder")),
        axe: await severe(driver),
      };
    },
    expected: { state: { role: "link", name: "Open project" }, images: [], folder: [], axe: [] },
  },
  {
    name: "op 022 (#57) scenario 8: an ocelle-icon in the icon slot beside the text Open project: one button node named Open project, as before the fix (FR-003, FR-006)",
    run: async (driver) => {
      await driver.mount('<ocelle-button id="b"><ocelle-icon slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button>');
      const state = await driver.axState("b", control);
      return { state: { role: state.role, name: state.name }, nodes: await meaningful(driver, "b"), axe: await severe(driver) };
    },
    expected: { state: { role: "button", name: "Open project" }, nodes: [{ role: "button", name: "Open project" }], axe: [] },
  },
  // Op 022 (#57; spec.md scenarios 9 and 10, phase-1 decision 7): the name follows the icon slot after the first
  // render. An icon slotted later adds nothing to the name; an icon moved out leaves the content naming the control.
  {
    name: 'op 022 (#57) scenario 9: a titled bare <svg> beside the text Open, first in slot="aside" and then moved into the icon slot, in the button and the link mode: the inner control is named Open, and the subtree has no image node and no node named Folder (FR-003, phase-1 decision 7)',
    run: async (driver) => {
      const svg = (id: string): string => `<svg id="${id}" slot="aside" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>`;
      await driver.mount(`<ocelle-button id="b">${svg("b-svg")}Open</ocelle-button> <ocelle-button id="k" href="#x">${svg("k-svg")}Open</ocelle-button>`);
      await driver.setAttribute("b-svg", "slot", "icon");
      await driver.setAttribute("k-svg", "slot", "icon");
      const read = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        const subtree = await driver.axSubtree(id);
        return { state: { role: state.role, name: state.name }, images: subtree.filter((node) => node.role === "image" || node.role === "img"), folder: subtree.filter((node) => node.name.includes("Folder")) };
      };
      return { button: await read("b"), link: await read("k"), axe: await severe(driver) };
    },
    expected: {
      button: { state: { role: "button", name: "Open" }, images: [], folder: [] },
      link: { state: { role: "link", name: "Open" }, images: [], folder: [] },
      axe: [],
    },
  },
  {
    name: "op 022 (#57) scenario 10: a titled bare <svg> in the icon slot beside the one-character text S, then moved out of the icon slot (slot=\"aside\"), in the button and the link mode: the inner control is named S, and axe reports no serious or critical result (FR-003, phase-1 decision 7)",
    run: async (driver) => {
      const svg = (id: string): string => `<svg id="${id}" slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>`;
      await driver.mount(`<ocelle-button id="b">${svg("b-svg")}S</ocelle-button> <ocelle-button id="k" href="#x">${svg("k-svg")}S</ocelle-button>`);
      await driver.setAttribute("b-svg", "slot", "aside");
      await driver.setAttribute("k-svg", "slot", "aside");
      const read = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        return { role: state.role, name: state.name };
      };
      return { button: await read("b"), link: await read("k"), axe: await severe(driver) };
    },
    expected: { button: { role: "button", name: "S" }, link: { role: "link", name: "S" }, axe: [] },
  },
  // Op 022 (#57) pin from the phase-1 mutation run: the label wrapper names the control only when nothing on the host
  // names it (the forwarded icon slot's pin is in `forwardedIconScenarios`).
  {
    name: 'op 022 (#57) a titled bare <svg> in the icon slot beside the text Open, with label="Open project" or a host aria-label="Open project", in the button and the link mode: the inner control is named Open project, not by its label wrapper, and the subtree has no image node and no node named Folder (FR-003, name order)',
    run: async (driver) => {
      const svg = '<svg slot="icon" viewBox="0 0 16 16"><title>Folder</title><path d="M2 2h12v12H2z"/></svg>';
      await driver.mount(
        `<ocelle-button id="b" label="Open project">${svg}Open</ocelle-button> <ocelle-button id="k" href="#x" label="Open project">${svg}Open</ocelle-button>` +
          ` <ocelle-button id="a" aria-label="Open project">${svg}Open</ocelle-button> <ocelle-button id="l" href="#x" aria-label="Open project">${svg}Open</ocelle-button>`,
      );
      const read = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        const subtree = await driver.axSubtree(id);
        return { state: { role: state.role, name: state.name }, images: subtree.filter((node) => node.role === "image" || node.role === "img"), folder: subtree.filter((node) => node.name.includes("Folder")) };
      };
      return { label: { button: await read("b"), link: await read("k") }, ariaLabel: { button: await read("a"), link: await read("l") }, axe: await severe(driver) };
    },
    expected: {
      label: {
        button: { state: { role: "button", name: "Open project" }, images: [], folder: [] },
        link: { state: { role: "link", name: "Open project" }, images: [], folder: [] },
      },
      ariaLabel: {
        button: { state: { role: "button", name: "Open project" }, images: [], folder: [] },
        link: { state: { role: "link", name: "Open project" }, images: [], folder: [] },
      },
      axe: [],
    },
  },
  ...(["default", "compact"] as const).flatMap((size) =>
    (["ltr", "rtl"] as const).map(
      (direction): Scenario => ({
        name: `US1-7, US1-8, icon-only (${size}, ${direction}): with no label content (none, or only whitespace around the icon) the slotted icon is centred in the inner control within 0.5 px, adding no gap; a label moved into the default slot brings the ${String(gap)} px gap back and moving it out again centres the icon; a flush icon-only button still starts its icon at the control's inline start (review R1-01; research.md R-09; FR-011, FR-012)`,
        run: async (driver) => {
          const sized = ` size="${size}"`;
          await driver.mount(
            `<div dir="${direction}"><p><ocelle-button id="b"${sized} label="Close"><ocelle-icon id="b-icon" slot="icon" name="close"></ocelle-icon></ocelle-button></p>` +
              `<p><ocelle-button id="s"${sized} label="Close">\n  <ocelle-icon id="s-icon" slot="icon" name="close"></ocelle-icon>\n</ocelle-button></p>` +
              `<p><ocelle-button id="m"${sized} label="Close"><ocelle-icon id="m-icon" slot="icon" name="close"></ocelle-icon><span id="m-label" slot="aside">Close</span></ocelle-button></p>` +
              `<p><ocelle-button id="f"${sized} flush label="Close"><ocelle-icon id="f-icon" slot="icon" name="close"></ocelle-icon></ocelle-button></p></div>`,
          );
          const centred = async (id: string): Promise<boolean> => {
            const [glyph, inner] = [await driver.box(`${id}-icon`), await driver.box(id, control)];
            return Math.abs(glyph.x + glyph.width / 2 - (inner.x + inner.width / 2)) <= 0.5;
          };
          const iconOnly = { plain: await centred("b"), whitespace: await centred("s"), moved: await centred("m") };
          await driver.setAttribute("m-label", "slot", null);
          const glyph = await driver.box("m-icon");
          const [text] = await driver.lines("m-label");
          const start = text ?? { x: 0, y: 0, width: 0, height: 0 };
          const labelled = tenth(direction === "ltr" ? start.x - (glyph.x + glyph.width) : glyph.x - (start.x + start.width));
          await driver.setAttribute("m-label", "slot", "aside");
          const again = await centred("m");
          const [flushIcon, flushInner] = [await driver.box("f-icon"), await driver.box("f", control)];
          const edge = (box: Box): number => (direction === "ltr" ? box.x : box.x + box.width);
          return { iconOnly, labelled, again, flushStart: Math.abs(edge(flushIcon) - edge(flushInner)) <= 0.5, axe: await severe(driver) };
        },
        expected: { iconOnly: { plain: true, whitespace: true, moved: true }, labelled: gap, again: true, flushStart: true, axe: [] },
      }),
    ),
  ),
  ...(["default", "compact"] as const).flatMap((size) =>
    (["ltr", "rtl"] as const).map(
      (direction): Scenario => ({
        name: `US1-12 (${size}, ${direction}): a flush button with a label, an icon and a label, an icon only and a one-character label, at the start of a line under a heading, starts its label (or icon) within 0.5 px of the heading's text, keeping its size's minimum block and inline size (FR-012)`,
        run: async (driver) => {
          const found: Record<string, unknown> = {};
          for (const [at, each] of flushCases.entries()) {
            const id = `f${String(at)}`;
            const label = "label" in each ? ` label="${each.label}"` : "";
            await driver.mount(`<div dir="${direction}"><h2><span id="heading">Projects</span></h2><p><ocelle-button id="${id}" flush size="${size}"${label}>${each.content(id)}</ocelle-button> follow the heading</p></div>`);
            const heading = await driver.box("heading");
            const start = await driver.box(each.start(id));
            const host = await driver.box(id);
            const edge = (box: Box): number => (direction === "ltr" ? box.x : box.x + box.width);
            const min = size === "default" ? targetMin : compactMin;
            found[each.name] = { aligned: Math.abs(edge(start) - edge(heading)) <= 0.5, minimum: [host.width >= min, host.height >= min], axe: await severe(driver) };
          }
          return found;
        },
        expected: Object.fromEntries(flushCases.map((each) => [each.name, { aligned: true, minimum: [true, true], axe: [] }])),
      }),
    ),
  ),
  {
    name: "US1-15: in a flex row beside a taller sibling and in a two-column grid with a taller cell, the inner control's box equals the host's; a click 4 px inside the host's bottom edge activates the available button once and not the disabled one (FR-001, FR-003, FR-023)",
    run: async (driver) => {
      await driver.mount(
        '<div id="row"><div class="tall"></div><ocelle-button id="row-on">Save</ocelle-button><ocelle-button id="row-off" disabled>Save</ocelle-button></div>' +
          '<div id="grid"><div class="tall"></div><ocelle-button id="grid-on">Save</ocelle-button><div class="tall"></div><ocelle-button id="grid-off" disabled>Save</ocelle-button></div>',
      );
      await driver.rules("#row { display: flex; gap: 8px; } #grid { display: grid; grid-template-columns: 1fr 1fr; inline-size: 400px; gap: 8px; } .tall { block-size: 120px; inline-size: 20px; }");
      const found: Record<string, unknown> = {};
      for (const id of ["row-on", "row-off", "grid-on", "grid-off"]) {
        const host = await driver.box(id);
        const inner = await driver.box(id, control);
        await driver.events(id, ["click", activate]);
        await driver.click(id, { position: { x: host.width / 2, y: host.height - 4 } });
        found[id] = { filled: same(host, inner), tall: host.height >= 120, ...counts(await driver.takeEvents(), id) };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: {
        "row-on": { filled: true, tall: true, click: 1, activate: 1 },
        "row-off": { filled: true, tall: true, click: 0, activate: 0 },
        "grid-on": { filled: true, tall: true, click: 1, activate: 1 },
        "grid-off": { filled: true, tall: true, click: 0, activate: 0 },
      },
      axe: [],
    },
  },
  ...restyles.map(
    (rule): Scenario => ({
      name: `US1-17, page rule "${rule}" on the element in a 400 px container: both outside points (4 px inside the inline-end edge at the block centre, 4 px inside the bottom edge at the inline centre) lie outside the inner control and a click there activates neither the available nor the disabled button; a click on the inner control's centre activates the available one once and not the disabled one (FR-001, FR-003, FR-023)`,
      run: async (driver) => {
        await driver.mount('<div class="box"><ocelle-button id="on">Save</ocelle-button></div><div class="box"><ocelle-button id="off" disabled>Save</ocelle-button></div>');
        await driver.rules(`.box { inline-size: 400px; } #on, #off { ${rule} }`);
        const found: Record<string, unknown> = {};
        for (const id of ["on", "off"]) {
          const host = await driver.box(id);
          const inner = await driver.box(id, control);
          const points = [
            { x: host.width - 4, y: host.height / 2 },
            { x: host.width / 2, y: host.height - 4 },
          ];
          const outside = points.map((point) => !inside({ x: host.x + point.x, y: host.y + point.y }, inner));
          await driver.events(id, ["click", activate]);
          for (const position of points) await driver.click(id, { position });
          const atPoints = counts(await driver.takeEvents(), id);
          await driver.click(id, { inner: control });
          found[id] = { outside, atPoints, centre: counts(await driver.takeEvents(), id) };
        }
        return { found, axe: await severe(driver) };
      },
      expected: {
        found: {
          on: { outside: [true, true], atPoints: { click: 0, activate: 0 }, centre: { click: 1, activate: 1 } },
          off: { outside: [true, true], atPoints: { click: 0, activate: 0 }, centre: { click: 0, activate: 0 } },
        },
        axe: [],
      },
    }),
  ),
  ...activations
    .filter(({ name }) => name !== "the element's click() method")
    .map(
      ({ name, act }): Scenario => ({
        name: `US1-18, ${name}: a listener that cancels ocelle-button-activate sees it dispatched once with defaultPrevented true; the click is still delivered once, with defaultPrevented true, and focus stays on the button (FR-023)`,
        run: async (driver) => {
          await driver.mount('<div id="wrap"><ocelle-button id="b">Save</ocelle-button></div>');
          await driver.events("b", ["click", activate]);
          await driver.preventNext(activate);
          await act(driver, "b");
          const records = await driver.takeEvents();
          const flags = (type: string): unknown => [...new Set(records.filter((record) => record.type === type).map((record) => record.defaultPrevented))];
          return { ...counts(records, "b"), activatePrevented: flags(activate), clickPrevented: flags("click"), focus: await driver.activeInner("b"), axe: await severe(driver) };
        },
        expected: { click: 1, activate: 1, activatePrevented: [true], clickPrevented: [true], focus: "button", axe: [] },
      }),
    ),
  {
    name: "US1-19: inside a <form> with submit and reset listeners, a pointer click, Enter and Space each deliver one click and one ocelle-button-activate, and the form receives no submit and no reset (FR-022)",
    run: async (driver) => {
      await driver.mount('<form id="f" method="dialog"><ocelle-button id="b">Save</ocelle-button></form>');
      await driver.events("b", ["click", activate]);
      await driver.events("f", ["submit", "reset"]);
      const found: Record<string, unknown> = {};
      for (const { name, act } of activations.filter((each) => each.name !== "the element's click() method")) {
        await act(driver, "b");
        const records = await driver.takeEvents();
        found[name] = { ...counts(records, "b"), form: records.filter((record) => record.type === "submit" || record.type === "reset").map((record) => record.type) };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: Object.fromEntries(activations.filter((each) => each.name !== "the element's click() method").map(({ name }) => [name, { click: 1, activate: 1, form: [] }])),
      axe: [],
    },
  },
  {
    name: "Edge case, a long label in a 120 px container: the label wraps between words onto further lines, the button grows in block size, keeps its minimum inline size and never overflows the container; one long word breaks inside the word (FR-011)",
    run: async (driver) => {
      await driver.mount(
        '<div id="narrow"><ocelle-button id="b"><span id="b-label">Save the changes to every project in this workspace</span></ocelle-button></div>' +
          '<div id="narrow-word"><ocelle-button id="w"><span id="w-label">Supercalifragilisticexpialidocious</span></ocelle-button></div>',
      );
      await driver.rules("#narrow, #narrow-word { inline-size: 120px; }");
      const read = async (id: string, container: string): Promise<unknown> => {
        const [host, inner, box, lines] = [await driver.box(id), await driver.box(id, control), await driver.box(container), await driver.lines(`${id}-label`)];
        const label = lines.reduce((right, line) => Math.max(right, line.x + line.width), 0);
        return { lines: lines.length > 1, taller: host.height > targetMin, minimum: host.width >= targetMin, fits: inner.x + inner.width <= box.x + box.width + 0.5 && label <= inner.x + inner.width + 0.5 };
      };
      return { words: await read("b", "narrow"), word: await read("w", "narrow-word"), axe: await severe(driver) };
    },
    expected: { words: { lines: true, taller: true, minimum: true, fits: true }, word: { lines: true, taller: true, minimum: true, fits: true }, axe: [] },
  },
  {
    name: "Edge case, empty label and no icon: axe reports exactly button-name for the unnamed button, and nothing for its named twin (FR-006)",
    run: async (driver) => {
      await driver.mount('<p id="empty"><ocelle-button id="e"></ocelle-button></p><p id="named"><ocelle-button id="n">Save</ocelle-button></p>');
      return { empty: await severe(driver, "empty"), named: await severe(driver, "named"), name: (await driver.axState("e", control)).name };
    },
    expected: { empty: ["violation button-name"], named: [], name: "" },
  },
  {
    // Plan decision 33 (review round 5, O3-01; tasks.md T029a): round 5's method. Each paragraph, body text at 16 px,
    // holds "Text", a zero-size inline-block marker (on the paragraph's baseline), a button whose light-DOM label ends
    // with a second zero-size marker (on the label's baseline), and "after". The markers' block-starts are compared,
    // and inside the host the icon wrapper's (the spinner's while busy) and the label's block-starts.
    name: "Plan decision 33: a one-line button in a line of text sits on the text's baseline: its label's baseline is the paragraph's within 0.5 px for the default button, compact, with an icon, flush, quiet flush, link mode and busy, and its icon wrapper (the spinner while busy) and its label start at the same block position inside the control",
    run: async (driver) => {
      const cases = [
        { id: "plain", attributes: "", icon: false, wrapper: ".icon-slot" },
        { id: "compact", attributes: ' size="compact"', icon: false, wrapper: ".icon-slot" },
        { id: "icon", attributes: "", icon: true, wrapper: ".icon-slot" },
        { id: "flush", attributes: " flush", icon: false, wrapper: ".icon-slot" },
        { id: "quiet", attributes: ' variant="quiet" flush', icon: false, wrapper: ".icon-slot" },
        { id: "link", attributes: ' href="#look"', icon: false, wrapper: ".icon-slot" },
        { id: "busy", attributes: " busy", icon: false, wrapper: ".spinner" },
      ] as const;
      const mark = (id: string): string => `<span class="mark" id="${id}"></span>`;
      await driver.mount(
        cases
          .map((each) => {
            const icon = each.icon ? `<ocelle-icon slot="icon" name="folder"></ocelle-icon>` : "";
            return `<p class="line">Text${mark(`${each.id}-text`)} <ocelle-button id="${each.id}"${each.attributes}>${icon}Save${mark(`${each.id}-label`)}</ocelle-button> after</p>`;
          })
          .join(""),
      );
      await driver.rules(".line { font-size: 16px; } .mark { display: inline-block; inline-size: 0; block-size: 0; }");
      const found: Record<string, unknown> = {};
      for (const each of cases) {
        const [text, label] = [await driver.box(`${each.id}-text`), await driver.box(`${each.id}-label`)];
        const [wrapper, inner] = [await driver.box(each.id, each.wrapper), await driver.box(each.id, ".label")];
        found[each.id] = { baseline: Math.abs(label.y - text.y) <= 0.5, rowStart: Math.abs(wrapper.y - inner.y) <= 0.5 };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: Object.fromEntries(["plain", "compact", "icon", "flush", "quiet", "link", "busy"].map((id) => [id, { baseline: true, rowStart: true }])),
      axe: [],
    },
  },
  {
    // Plan decision 33 as amended by review round 6 (O6-01; tasks.md T029f): round 6's method. Each paragraph, body
    // text at 16 px, holds "Text", a zero-size inline-block marker (on the paragraph's baseline), an icon-only button
    // (an `ocelle-icon` in the `icon` slot, no label, named by `aria-label`), a native `<button>` holding an `<svg>` with
    // a `viewBox`, `--ocelle-icon-size` square, and "after". The expected value is the native button's own svg: the
    // block-centre of the button's icon (the slotted icon, or the spinner's svg while busy) relative to the marker equals
    // the native svg's relative to the same marker within 0.5 px. Each row also carries `bare`, the guard the scoped
    // rule depends on.
    name: "Plan decision 33 (round 6): an icon-only button in a line of text keeps its icon where a native button puts it: its icon's block-centre is the native button's svg's within 0.5 px for the default button, compact and busy, and its row carries `bare`",
    run: async (driver) => {
      const cases = [
        { id: "only", attributes: "", icon: "" },
        { id: "only-compact", attributes: ' size="compact"', icon: "" },
        { id: "only-busy", attributes: " busy", icon: ".spinner svg" },
      ] as const;
      await driver.mount(
        cases
          .map(
            (each) =>
              `<p class="line">Text<span class="mark" id="${each.id}-text"></span> <ocelle-button id="${each.id}" aria-label="Open project"${each.attributes}><ocelle-icon id="${each.id}-icon" slot="icon" name="folder"></ocelle-icon></ocelle-button> <button class="native" type="button" aria-label="Open project"><svg id="${each.id}-native" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor"></circle></svg></button> after</p>`,
          )
          .join(""),
      );
      await driver.rules(
        ".line { font-size: 16px; } .mark { display: inline-block; inline-size: 0; block-size: 0; } .native svg { inline-size: var(--ocelle-icon-size); block-size: var(--ocelle-icon-size); }",
      );
      const centre = (box: Box): number => box.y + box.height / 2;
      const found: Record<string, unknown> = {};
      for (const each of cases) {
        const text = await driver.box(`${each.id}-text`);
        const own = each.icon === "" ? await driver.box(`${each.id}-icon`) : await driver.box(each.id, each.icon);
        const native = await driver.box(`${each.id}-native`);
        found[each.id] = {
          centre: Math.abs(centre(own) - text.y - (centre(native) - text.y)) <= 0.5,
          square: native.height === icon,
          bare: (await driver.box(each.id, ".icon-row.bare")).display !== "absent",
        };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: Object.fromEntries(["only", "only-compact", "only-busy"].map((id) => [id, { centre: true, square: true, bare: true }])),
      axe: [],
    },
  },
];

/**
 * Op 022 (#57) pin from the phase-1 mutation run: the label wrapper names the control only when the icon slot's
 * flattened assignment holds an element. It needs the test-only `test-icon-forwarder` (test/fixtures/shadow-controls.ts),
 * which `button.html` on the strict-CSP fixture does not load, so it runs in process only (test/button.test.ts), the
 * run the mutation gate uses.
 */
export const forwardedIconScenarios: readonly Scenario[] = [
  {
    name: "op 022 (#57) an ocelle-button in another element's shadow root, its icon slot fed only by that element's empty icon slot, beside the one-character text S: the button is named S and axe reports no serious or critical result, as with no icon (FR-003, flattened assignment)",
    run: async (driver) => {
      await driver.mount('<test-icon-forwarder id="fw"></test-icon-forwarder>');
      const subtree = await driver.axSubtree("fw");
      return { controls: subtree.filter((node) => node.role === "button"), axe: await severe(driver) };
    },
    expected: { controls: [{ role: "button", name: "S" }], axe: [] },
  },
];
