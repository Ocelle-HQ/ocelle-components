// The shared bodies of User Story 4's browser scenarios, the interactive `ocelle-pill-tag` (018 spec US4-1 to US4-12,
// FR-029 to FR-032, FR-035, FR-043; research.md R-07, R-08; data-model.md § `ocelle-pill-tag`; plan decisions 6, 7, 10,
// 11, 12 and 15, 15 as amended at the phase-1 recheck; contracts/checks.md § US4 bodies and § Edge cases; tasks.md
// T046). Each body observes the page through the driver and returns one observation; each harness asserts it equals
// `expected`, written by hand from the spec, the data model, research and the phase-1 spikes:
// - colours, sizes and widths from the token table of packages/tokens/test/expected.ts by token name (`tokenColour`,
//   `declared`), never from the element source; forced colours read as `resolveColour(<keyword>)` against a probe in
//   the same mode;
// - the event recorder as 012's: `click` and `ocelle-pill-tag-activate` at the host, its ancestors, `document` and
//   `window`, with flags, targets, serials and details;
// - the target from `--ocelle-target-small` (24 px), measured on the control's box and by clicks.
//
// Four lists, as scenarios/link.ts has them for `ocelle-button`:
// - `pillInteractiveScenarios` run in both harnesses, in process on the element source (test/pill-tag-interactive.test.ts)
//   and on the built browser build on the strict-CSP fixture (test/browser/pill-tag-interactive.test.ts). No body of
//   this list navigates away: a link it clicks points at a fragment of the page or is disabled.
// - `pillInteractiveSinkScenarios` run in process only: the link-mode activation bodies on the navigation sink.
// - `pillInteractiveNavigationScenarios` run on the fixture only: the same link bodies on real navigation (a
//   `Navigation`, which test/browser/pill-tag-interactive.test.ts implements for `pill-tag.html`).
// There is no conditional expect.
//
// Not here, and why (reviews/phase-5/notes.md): the corner clicks of contracts/checks.md § US4-7 (a click at each
// corner inset 1 px of a one-character compact badge), which Chromium's hit test of the pill radius sends past the
// control (an open operator question); the tooltip half of § US4-10 and every truncation assertion, which are user
// story 5's (phase 6 wraps the control in `ocelle-tooltip`).
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named in the body's
// name (contracts/checks.md § US4 bodies), run once and recorded in reviews/phase-5/notes.md.
import { expectedTokens } from "../../../tokens/test/expected.ts";
import { meaningful, severe, summary } from "./button.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { NavigationScenario, Outcome } from "./link.ts";
import type { Box, Driver, EventRecord, Modifier, NavigationRecord, Palette, TextBox } from "./driver.ts";

/** A token's declared value, single-valued, as a number (its unit dropped). */
function declared(name: string): number {
  const entry = expectedTokens.find((each) => each.name === name);
  if (entry === undefined || typeof entry.declared !== "string") throw new Error(`no single declared value for ${name}`);
  return Number.parseFloat(entry.declared);
}

/** A `rem` token in px at the 16 px root. */
const rem = (name: string): number => declared(name) * 16;

const colour = (token: string, theme: Palette): string => tokenColour(`color-${token}`, theme);
const themes: readonly Palette[] = ["light", "dark"];
const statuses = ["info", "success", "warning", "danger", "neutral"] as const;
const variants = ["pill", "badge"] as const;
const densities = ["default", "compact"] as const;

/** The inner control: the `<button>` or `<a>` of an interactive pill, the only element with the `control` class. */
const control = ".control";
const pillPart = '[part~="pill"]';
const activate = "ocelle-pill-tag-activate";
const transparent = "rgba(0, 0, 0, 0)";
/** The page a link of the harness navigates to (the fixture server records each request for it). */
const target = "link-target.html";
const icon = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';

/** `--ocelle-target-small` in px at the 16 px root (FR-043). */
const targetSmall = rem("target-small");
const space1 = rem("space-1");
const borderWidth = declared("border-width");
const barWidth = declared("bar-width");
const focusWidth = declared("focus-width");
const focusOffset = declared("focus-offset");
/** One focus-ring extent: the offset plus the width (plan decision 11). */
const ringExtent = focusOffset + focusWidth;

/** The static shadow root's elements, in tree order (phase 4): the `.pill` box, the row, the icon and label wrappers. */
const staticRoot = ["span", "span", "span", "slot", "span", "slot"];

/** The seven passthrough names of FR-030. */
const passthrough = ["aria-label", "aria-labelledby", "aria-describedby", "aria-controls", "aria-current", "aria-pressed", "title"] as const;
type Passthrough = (typeof passthrough)[number];

/** A value for each passthrough name. */
const passthroughValue: Record<Passthrough, string> = {
  "aria-label": "Blocked state",
  "aria-labelledby": "note",
  "aria-describedby": "hint",
  "aria-controls": "panel",
  "aria-current": "page",
  "aria-pressed": "true",
  title: "Blocked since Monday",
};

/** The page elements the reference names point at. */
const referenced = '<span id="note">Mine</span><span id="hint">Hint text</span><div id="panel">Panel</div>';

/** Host rules that mark the pill's custom states, read back through the host's computed style. */
const stateRules = "ocelle-pill-tag:state(pressed) { text-decoration-line: underline; } ocelle-pill-tag:state(current) { font-style: italic; }";

/** Mounts `markup` on a page with base.css, as a host page links it. */
function mount(driver: Driver, markup: string): Promise<void> {
  return driver.mount(markup, { base: true });
}

/** The pill's attributes for a variant and a density (the defaults written as no attribute). */
function attributes(variant: string, density: string): string {
  return `${variant === "pill" ? "" : ` variant="${variant}"`}${density === "default" ? "" : ` density="${density}"`}`;
}

/** The custom states the pill `id` matches, read through `stateRules`. */
async function states(driver: Driver, id: string): Promise<string[]> {
  return [...((await driver.computed(id, "text-decoration-line")) === "underline" ? ["pressed"] : []), ...((await driver.computed(id, "font-style")) === "italic" ? ["current"] : [])];
}

/** The inner controls of the pill `id`: each as its local name and the attributes `names` it carries. */
async function controls(driver: Driver, id: string, names: readonly string[] = []): Promise<Record<string, string>[]> {
  return (await driver.elements(id))
    .filter((part) => part.attributes.class?.split(" ").includes("control") === true)
    .map((part) => Object.fromEntries([["tag", part.name], ...names.flatMap((name) => (part.attributes[name] === undefined ? [] : [[name, part.attributes[name]] as const]))]));
}

/** The local names of the elements in the shadow root of `id`. */
async function rendered(driver: Driver, id: string): Promise<string[]> {
  return (await driver.elements(id)).map((part) => part.name);
}

/** A host attribute of a passthrough name and its mirror. */
async function hostPair(driver: Driver, id: string, name: string): Promise<{ readonly host: string | null; readonly mirror: string | null }> {
  return { host: await driver.attribute(id, name), mirror: await driver.attribute(id, `data-ocelle-moved-${name}`) };
}

/** The number of dispatches (distinct serials) of `type` whose target was the pill `id`. */
function dispatches(records: readonly EventRecord[], type: string, id: string): number {
  return new Set(records.filter((record) => record.type === type && record.target === `ocelle-pill-tag#${id}`).map((record) => record.serial)).size;
}

/** The click and activate dispatches at the pill `id`. */
function counts(records: readonly EventRecord[], id: string): { readonly click: number; readonly auxclick: number; readonly activate: number } {
  return { click: dispatches(records, "click", id), auxclick: dispatches(records, "auxclick", id), activate: dispatches(records, activate, id) };
}

/** The listeners from the pill out to `window` when it sits in `<div id="wrap">`. */
const path = ["ocelle-pill-tag#p", "div#wrap", "body", "html", "document", "window"];

/** The computed look of the inner control: its fill, its border colour and width (top side), its text and its cue. */
async function look(driver: Driver, id: string): Promise<{ readonly fill: string; readonly border: string; readonly ink: string; readonly cue: string }> {
  const [style] = await driver.styles(id, control, ["background-color", "border-top-color", "color", "box-shadow"]);
  return { fill: style?.["background-color"] ?? "none", border: style?.["border-top-color"] ?? "none", ink: style?.color ?? "none", cue: style?.["box-shadow"] ?? "none" };
}

/** The inset bar-width cue in a colour, as Chromium serialises the computed `box-shadow`. */
const cue = (rgb: string): string => `${rgb} 0px 0px 0px ${String(barWidth)}px inset`;

/** Whether two boxes are the same, to the half pixel. */
function same(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs(a.width - b.width) <= 0.5 && Math.abs(a.height - b.height) <= 0.5;
}

/** The first text box under `id`. */
async function textOf(driver: Driver, id: string): Promise<TextBox | undefined> {
  return (await driver.textBoxes(id))[0];
}

/** The type of the text around a pill of `density`: its font size and family, so baselines compare text with text. */
function surrounding(density: string): string {
  return `font-family: var(--ocelle-font-sans); font-size: var(${density === "default" ? "--ocelle-font-size-sm" : "--ocelle-font-size-xs"});`;
}

/** The ways US4-3 activates a button-mode pill, each from a fresh mount. */
const buttonActivations = [
  { name: "a pointer click", act: (driver: Driver, id: string) => driver.click(id), trusted: true },
  {
    name: "Enter on the focused pill",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
    trusted: true,
  },
  {
    name: "Space on the focused pill",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press(" ");
    },
    trusted: true,
  },
  { name: "the element's click() method", act: (driver: Driver, id: string) => driver.callClick(id), trusted: false },
] as const;

/** The ways US4-3 activates a link-mode pill. */
const linkActivations = [buttonActivations[0], { ...buttonActivations[1], name: "Enter on the focused link" }, buttonActivations[3]] as const;

/** The modifier clicks of US4-3, with the flag each sets on the click. */
const modifierClicks: readonly { readonly modifier: Modifier; readonly flag: "ctrlKey" | "metaKey" | "shiftKey" | "altKey" }[] = [
  { modifier: "Control", flag: "ctrlKey" },
  { modifier: "Meta", flag: "metaKey" },
  { modifier: "Shift", flag: "shiftKey" },
  { modifier: "Alt", flag: "altKey" },
];

/** The sink's record of a plain activation of a link to `link-target.html`, with `changes`. */
function navigation(changes: Partial<NavigationRecord> = {}): NavigationRecord {
  return { type: "click", defaultPrevented: false, button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, href: target, ...changes };
}

/** The scenarios of one theme where colours depend on it. */
function themed(theme: Palette): Scenario[] {
  const c = (token: string): string => colour(token, theme);
  return [
    {
      name: `Looks, resting (${theme}): an interactive pill has a --ocelle-color-accent-strong border on its status ground and its text in the status colour, where its static twin's border is transparent; an interactive badge keeps its status-colour border on no fill; at rest neither has an inset cue (plan decision 6; plant: the resting border removed)`,
      run: async (driver) => {
        await mount(driver, `${statuses.map((status) => `<ocelle-pill-tag id="p-${status}" interactive status="${status}">Mine</ocelle-pill-tag> <ocelle-pill-tag id="b-${status}" interactive variant="badge" status="${status}">3</ocelle-pill-tag> `).join("")}<ocelle-pill-tag id="s" status="info">Mine</ocelle-pill-tag><p id="away">Away</p>`);
        await driver.theme(theme);
        await driver.hover("away");
        const found: Record<string, unknown> = {};
        for (const status of statuses) found[status] = { pill: await look(driver, `p-${status}`), badge: await look(driver, `b-${status}`) };
        const [still] = await driver.styles("s", pillPart, ["border-top-color"]);
        return { found, staticBorder: still?.["border-top-color"] };
      },
      expected: {
        found: Object.fromEntries(
          statuses.map((status) => [
            status,
            {
              pill: { fill: c(`${status}-bg`), border: c("accent-strong"), ink: c(status), cue: "none" },
              badge: { fill: transparent, border: c(status), ink: c(status), cue: "none" },
            },
          ]),
        ),
        staticBorder: transparent,
      },
    },
    {
      name: `Looks, hover and active (${theme}): hovering an interactive pill turns its border to the status colour and fills an interactive badge with the status ground; pressing the pointer adds the inset --ocelle-bar-width cue in the status colour to that look; a disabled twin keeps the disabled look on hover and press (plan decision 6; plants: the badge fill removed, the inset cue removed)`,
      run: async (driver) => {
        await mount(driver, `${statuses.map((status) => `<ocelle-pill-tag id="p-${status}" interactive status="${status}">Mine</ocelle-pill-tag> <ocelle-pill-tag id="b-${status}" interactive variant="badge" status="${status}">3</ocelle-pill-tag> `).join("")}<ocelle-pill-tag id="off" interactive disabled status="info">Mine</ocelle-pill-tag><p id="away">Away</p>`);
        await driver.theme(theme);
        const found: Record<string, unknown> = {};
        for (const id of [...statuses.flatMap((status) => [`p-${status}`, `b-${status}`]), "off"]) {
          await driver.hover(id);
          const hovered = await look(driver, id);
          await driver.pointerDown(id);
          const pressed = await look(driver, id);
          await driver.pointerUp(id);
          await driver.hover("away");
          found[id] = { hovered, pressed };
        }
        return found;
      },
      expected: {
        ...Object.fromEntries(
          statuses.flatMap((status) => [
            [
              `p-${status}`,
              {
                hovered: { fill: c(`${status}-bg`), border: c(status), ink: c(status), cue: "none" },
                pressed: { fill: c(`${status}-bg`), border: c(status), ink: c(status), cue: cue(c(status)) },
              },
            ],
            [
              `b-${status}`,
              {
                hovered: { fill: c(`${status}-bg`), border: c(status), ink: c(status), cue: "none" },
                pressed: { fill: c(`${status}-bg`), border: c(status), ink: c(status), cue: cue(c(status)) },
              },
            ],
          ]),
        ),
        off: {
          hovered: { fill: c("disabled-bg"), border: c("disabled-ink"), ink: c("disabled-ink"), cue: "none" },
          pressed: { fill: c("disabled-bg"), border: c("disabled-ink"), ink: c("disabled-ink"), cue: "none" },
        },
      },
    },
    {
      name: `US4-4, looks, pressed (${theme}): aria-pressed="true" on a button-mode pill gives the inset --ocelle-bar-width cue in the status colour at rest, and on a badge the status ground's fill too; "false" and "mixed" give the resting look; a disabled pressed pill has the disabled look with no cue (FR-031; plan decisions 6, 7; plant: the badge's pressed fill removed)`,
      run: async (driver) => {
        await mount(
          driver,
          statuses.map((status) => `<ocelle-pill-tag id="p-${status}" interactive status="${status}" aria-pressed="true">Mine</ocelle-pill-tag> <ocelle-pill-tag id="b-${status}" interactive variant="badge" status="${status}" aria-pressed="true">3</ocelle-pill-tag> `).join("") +
            '<ocelle-pill-tag id="f" interactive status="info" aria-pressed="false">Mine</ocelle-pill-tag> <ocelle-pill-tag id="m" interactive variant="badge" status="info" aria-pressed="mixed">3</ocelle-pill-tag> <ocelle-pill-tag id="off" interactive disabled status="info" aria-pressed="true">Mine</ocelle-pill-tag><p id="away">Away</p>',
        );
        await driver.theme(theme);
        await driver.hover("away");
        const found: Record<string, unknown> = {};
        for (const id of [...statuses.flatMap((status) => [`p-${status}`, `b-${status}`]), "f", "m", "off"]) found[id] = await look(driver, id);
        return found;
      },
      expected: {
        ...Object.fromEntries(
          statuses.flatMap((status) => [
            [`p-${status}`, { fill: c(`${status}-bg`), border: c("accent-strong"), ink: c(status), cue: cue(c(status)) }],
            [`b-${status}`, { fill: c(`${status}-bg`), border: c(status), ink: c(status), cue: cue(c(status)) }],
          ]),
        ),
        f: { fill: c("info-bg"), border: c("accent-strong"), ink: c("info"), cue: "none" },
        m: { fill: transparent, border: c("info"), ink: c("info"), cue: "none" },
        off: { fill: c("disabled-bg"), border: c("disabled-ink"), ink: c("disabled-ink"), cue: "none" },
      },
    },
    {
      name: `US4-5, disabled look (${theme}): an enabled neutral pill in button and in link mode has a --ocelle-color-accent-strong border on --ocelle-color-neutral-bg with --ocelle-color-neutral text and a pointer cursor; disabled, each is --ocelle-color-disabled-ink text and border on --ocelle-color-disabled-bg with the default cursor, and so is a disabled badge (FR-030, 012 FR-003; plan decision 7; plant: the disabled border rule removed)`,
      run: async (driver) => {
        await mount(
          driver,
          '<ocelle-pill-tag id="on-b" interactive>Draft</ocelle-pill-tag> <ocelle-pill-tag id="on-l" href="#draft">Draft</ocelle-pill-tag> <ocelle-pill-tag id="off-b" interactive disabled>Draft</ocelle-pill-tag> <ocelle-pill-tag id="off-l" href="#draft" disabled>Draft</ocelle-pill-tag> <ocelle-pill-tag id="off-badge" interactive disabled variant="badge" status="danger">7</ocelle-pill-tag><p id="away">Away</p>',
        );
        await driver.theme(theme);
        await driver.hover("away");
        const read = async (id: string): Promise<unknown> => {
          const { fill, border, ink, cue: shadow } = await look(driver, id);
          return { fill, border, ink, cue: shadow, cursor: await driver.computed(id, "cursor", control) };
        };
        return { onButton: await read("on-b"), onLink: await read("on-l"), offButton: await read("off-b"), offLink: await read("off-l"), offBadge: await read("off-badge") };
      },
      expected: {
        onButton: { fill: c("neutral-bg"), border: c("accent-strong"), ink: c("neutral"), cue: "none", cursor: "pointer" },
        onLink: { fill: c("neutral-bg"), border: c("accent-strong"), ink: c("neutral"), cue: "none", cursor: "pointer" },
        offButton: { fill: c("disabled-bg"), border: c("disabled-ink"), ink: c("disabled-ink"), cue: "none", cursor: "default" },
        offLink: { fill: c("disabled-bg"), border: c("disabled-ink"), ink: c("disabled-ink"), cue: "none", cursor: "default" },
        offBadge: { fill: c("disabled-bg"), border: c("disabled-ink"), ink: c("disabled-ink"), cue: "none", cursor: "default" },
      },
    },
    {
      name: `US4-6, the focus ring (${theme}): keyboard focus draws a solid outline of --ocelle-focus-width in --ocelle-color-focus at --ocelle-focus-offset on the inner button and on the inner link, in both variants; a pointer click focuses the button with no ring (FR-032; plant: the control class dropped)`,
      run: async (driver) => {
        await mount(driver, '<button id="before" type="button">Before</button> <ocelle-pill-tag id="b" interactive status="info">Mine</ocelle-pill-tag> <ocelle-pill-tag id="l" href="#blocked" status="warning">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="badge" interactive variant="badge">3</ocelle-pill-tag>');
        await driver.theme(theme);
        const ring = async (id: string): Promise<unknown> => {
          const [style] = await driver.styles(id, control, ["outline-style", "outline-width", "outline-color", "outline-offset"]);
          return { active: await driver.activeInner(id), visible: await driver.focusVisible(id, control), style };
        };
        await driver.focus("before");
        await driver.press("Tab");
        const button = await ring("b");
        await driver.press("Tab");
        const link = await ring("l");
        await driver.press("Tab");
        const badge = await ring("badge");
        await driver.click("b");
        return { button, link, badge, pointer: { active: await driver.activeInner("b"), visible: await driver.focusVisible("b", control), style: await driver.computed("b", "outline-style", control) } };
      },
      expected: {
        ...Object.fromEntries(
          [
            ["button", "button"],
            ["link", "a"],
            ["badge", "button"],
          ].map(([key, tag]) => [key, { active: tag, visible: true, style: { "outline-style": "solid", "outline-width": `${String(focusWidth)}px`, "outline-color": c("focus"), "outline-offset": `${String(focusOffset)}px` } }]),
        ),
        pointer: { active: "button", visible: false, style: "none" },
      },
    },
  ];
}

/** The forced-colours scenarios of one palette (US4-4, US4-5, US4-6; research.md R-07). */
function forced(palette: Palette): Scenario[] {
  /**
   * A reader of the control's computed colours against system colours: `is(id, property, keyword)` is whether the
   * property's value equals the keyword's, resolved on a probe in the same mode (two keywords may resolve alike in a
   * palette, so each assertion names the one it expects).
   */
  const reader = async (driver: Driver): Promise<(id: string, property: string, keyword: string) => Promise<boolean>> => {
    const keywords = ["ButtonText", "LinkText", "GrayText", "Highlight", "HighlightText"];
    const resolved = new Map(await Promise.all(keywords.map(async (keyword) => [keyword, await driver.resolveColour(keyword)] as const)));
    return async (id, property, keyword) => (await driver.computed(id, property, control)) === resolved.get(keyword);
  };
  return [
    {
      name: `Forced colours (${palette} palette): an enabled button-mode pill is ButtonText text and border, a link-mode one LinkText; a disabled pill in button and in link mode is GrayText text and border; keyboard focus draws the ring in Highlight on the button and on the link (FR-032; research.md R-07; plant: the :host([disabled]) .control forced-colours rule removed)`,
      run: async (driver) => {
        await mount(driver, '<button id="before" type="button">Before</button> <ocelle-pill-tag id="b" interactive status="warning">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="l" href="#blocked" status="warning">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="off-b" interactive disabled status="warning">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="off-l" href="#blocked" disabled status="warning">Blocked</ocelle-pill-tag><p id="away">Away</p>');
        await driver.forcedColors("active", palette);
        await driver.hover("away");
        const is = await reader(driver);
        const both = async (id: string, keyword: string): Promise<[boolean, boolean]> => [await is(id, "color", keyword), await is(id, "border-top-color", keyword)];
        const rest = { button: await both("b", "ButtonText"), link: await both("l", "LinkText"), offButton: await both("off-b", "GrayText"), offLink: await both("off-l", "GrayText") };
        await driver.focus("before");
        await driver.press("Tab");
        const buttonRing = await is("b", "outline-color", "Highlight");
        await driver.press("Tab");
        const linkRing = await is("l", "outline-color", "Highlight");
        return { rest, rings: { button: buttonRing, link: linkRing } };
      },
      expected: { rest: { button: [true, true], link: [true, true], offButton: [true, true], offLink: [true, true] }, rings: { button: true, link: true } },
    },
    {
      name: `Forced colours, pressed (${palette} palette): a pressed button-mode pill and badge fill with Highlight and set their text in HighlightText and their border in Highlight, with the box of their unpressed twins, whose fill is not Highlight and whose text is ButtonText; a pressed and disabled pill is GrayText text and border with no Highlight fill (US4-4; research.md R-07; plants: the forced-colours pressed rule removed, its :not([disabled]) dropped)`,
      run: async (driver) => {
        await mount(
          driver,
          '<ocelle-pill-tag id="p" interactive status="info" aria-pressed="true">Mine</ocelle-pill-tag> <ocelle-pill-tag id="pu" interactive status="info" aria-pressed="false">Mine</ocelle-pill-tag> <ocelle-pill-tag id="b" interactive variant="badge" status="info" aria-pressed="true">3</ocelle-pill-tag> <ocelle-pill-tag id="bu" interactive variant="badge" status="info">3</ocelle-pill-tag> <ocelle-pill-tag id="off" interactive disabled status="info" aria-pressed="true">Mine</ocelle-pill-tag><p id="away">Away</p>',
        );
        await driver.forcedColors("active", palette);
        await driver.hover("away");
        const is = await reader(driver);
        const pressed = async (id: string): Promise<unknown> => ({ fill: await is(id, "background-color", "Highlight"), text: await is(id, "color", "HighlightText"), border: await is(id, "border-top-color", "Highlight") });
        const unpressed = async (id: string): Promise<unknown> => ({ fillNotHighlight: !(await is(id, "background-color", "Highlight")), text: await is(id, "color", "ButtonText") });
        const sameSize = async (a: string, b: string): Promise<boolean> => {
          const [one, two] = [await driver.box(a, control), await driver.box(b, control)];
          return Math.abs(one.width - two.width) <= 0.5 && Math.abs(one.height - two.height) <= 0.5;
        };
        return {
          pill: await pressed("p"),
          pillUnpressed: await unpressed("pu"),
          badge: await pressed("b"),
          badgeUnpressed: await unpressed("bu"),
          off: { text: await is("off", "color", "GrayText"), border: await is("off", "border-top-color", "GrayText"), fillNotHighlight: !(await is("off", "background-color", "Highlight")) },
          sameSize: { pill: await sameSize("p", "pu"), badge: await sameSize("b", "bu") },
        };
      },
      expected: {
        pill: { fill: true, text: true, border: true },
        pillUnpressed: { fillNotHighlight: true, text: true },
        badge: { fill: true, text: true, border: true },
        badgeUnpressed: { fillNotHighlight: true, text: true },
        off: { text: true, border: true, fillNotHighlight: true },
        sameSize: { pill: true, badge: true },
      },
    },
  ];
}

export const pillInteractiveScenarios: readonly Scenario[] = [
  {
    name: 'US4-1: <ocelle-pill-tag interactive>Mine</ocelle-pill-tag> holds exactly one inner control, a native <button type="button"> with the parts pill and control; the host has no role and no tabindex; the tree has one node of role button named Mine, enabled and focusable; one tab stop in Tab and Shift+Tab order; the host\'s focus() focuses the inner button, while a static twin\'s focus() leaves focus where it was (FR-029, FR-030; 012 FR-001)',
    run: async (driver) => {
      await mount(driver, '<button id="before" type="button">Before</button> <ocelle-pill-tag id="p" interactive status="info">Mine</ocelle-pill-tag> <ocelle-pill-tag id="s" status="info">Draft</ocelle-pill-tag> <button id="after" type="button">After</button>');
      const mounted = await driver.focusPath();
      const state = await driver.axState("p", control);
      const found = {
        mounted,
        controls: await controls(driver, "p", ["type", "part", "class"]),
        host: { role: await driver.attribute("p", "role"), tabindex: await driver.attribute("p", "tabindex") },
        meaningful: await meaningful(driver, "p"),
        state: { role: state.role, name: state.name, disabled: state.disabled, focusable: state.focusable, pressed: state.pressed },
        forward: await driver.tabOrder(),
        reverse: await driver.tabOrder({ reverse: true }),
      };
      await driver.focus("before");
      await driver.focus("s");
      const staticFocus = await driver.focusPath();
      await driver.focus("p");
      return { ...found, staticFocus, focused: await driver.activeInner("p") };
    },
    expected: {
      mounted: "body",
      controls: [{ tag: "button", type: "button", part: "pill control", class: "control pill status-info variant-pill density-default" }],
      host: { role: null, tabindex: null },
      meaningful: [{ role: "button", name: "Mine" }],
      state: { role: "button", name: "Mine", disabled: false, focusable: true, pressed: null },
      forward: [["button#before"], ["ocelle-pill-tag#p", "button"], ["button#after"]],
      reverse: [["button#after"], ["ocelle-pill-tag#p", "button"], ["button#before"]],
      staticFocus: "before",
      focused: "button",
    },
  },
  {
    name: "US4-2: a link-mode href makes the inner control one native <a> with that href as written, of role link named by the text, with or without interactive, in both variants; it has no aria-pressed of its own and is one tab stop each (FR-030; 012 FR-002)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="l" href="/missions?state=blocked" status="warning">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="li" interactive variant="badge" href="https://example.com/missions">3</ocelle-pill-tag>');
      const read = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        return { controls: await controls(driver, id, ["href", "part", "aria-pressed", "role", "tabindex"]), meaningful: await meaningful(driver, id), role: state.role, focusable: state.focusable };
      };
      return { l: await read("l"), li: await read("li"), forward: await driver.tabOrder() };
    },
    expected: {
      l: { controls: [{ tag: "a", href: "/missions?state=blocked", part: "pill control" }], meaningful: [{ role: "link", name: "Blocked" }], role: "link", focusable: true },
      li: { controls: [{ tag: "a", href: "https://example.com/missions", part: "pill control" }], meaningful: [{ role: "link", name: "3" }], role: "link", focusable: true },
      forward: [
        ["ocelle-pill-tag#l", "a"],
        ["ocelle-pill-tag#li", "a"],
      ],
    },
  },
  ...buttonActivations.map(
    ({ name, act, trusted }): Scenario => ({
      name: `US4-3, button mode, ${name}: exactly one ocelle-pill-tag-activate (bubbles, composed, cancelable, detail {}, target the host at every listener) recorded at the host, its ancestors, document and window before exactly one click, target the host at every listener (FR-031)`,
      run: async (driver) => {
        await mount(driver, '<div id="wrap"><ocelle-pill-tag id="p" interactive status="info">Mine</ocelle-pill-tag></div>');
        await driver.events("p", ["click", activate]);
        await act(driver, "p");
        const records = await driver.takeEvents();
        const click = summary(records, "click") as Record<string, unknown>;
        return { types: records.map((record) => record.type), activate: summary(records, activate), click: { at: click.at, targets: click.targets, serials: click.serials, flags: click.flags } };
      },
      expected: {
        types: [...path.map(() => activate), ...path.map(() => "click")],
        activate: { at: path, targets: ["ocelle-pill-tag#p"], serials: 1, flags: [{ isTrusted: false, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }], details: ["{}"] },
        click: { at: path, targets: ["ocelle-pill-tag#p"], serials: 1, flags: [{ isTrusted: trusted, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }] },
      },
    }),
  ),
  ...buttonActivations.slice(0, 3).map(
    ({ name, act }): Scenario => ({
      name: `US4-3, button mode, cancelled, ${name}: a listener's preventDefault() on ocelle-pill-tag-activate leaves the click delivered once, with defaultPrevented true (FR-031)`,
      run: async (driver) => {
        await mount(driver, '<div id="wrap"><ocelle-pill-tag id="p" interactive status="info">Mine</ocelle-pill-tag></div>');
        await driver.events("p", ["click", activate]);
        await driver.preventNext(activate);
        await act(driver, "p");
        const records = await driver.takeEvents();
        return { counts: counts(records, "p"), prevented: [...new Set(records.map((record) => `${record.type} ${String(record.defaultPrevented)}`))] };
      },
      expected: { counts: { click: 1, auxclick: 0, activate: 1 }, prevented: [`${activate} true`, "click true"] },
    }),
  ),
  {
    name: "US4-3, button mode: a Ctrl, Meta, Shift or Alt click on a button-mode pill dispatches one ocelle-pill-tag-activate and one click (only a link drops the activate event for a modifier); a middle click dispatches no click and no activate event (FR-031)",
    run: async (driver) => {
      await mount(driver, '<div id="wrap"><ocelle-pill-tag id="p" interactive status="info">Mine</ocelle-pill-tag></div>');
      await driver.events("p", ["click", "auxclick", activate]);
      const found: Record<string, unknown> = {};
      for (const { modifier } of modifierClicks) {
        await driver.click("p", { modifiers: [modifier] });
        found[modifier] = counts(await driver.takeEvents(), "p");
      }
      await driver.click("p", { button: "middle" });
      found.middle = counts(await driver.takeEvents(), "p");
      return found;
    },
    expected: { ...Object.fromEntries(modifierClicks.map(({ modifier }) => [modifier, { click: 1, auxclick: 0, activate: 1 }])), middle: { click: 0, auxclick: 1, activate: 0 } },
  },
  ...[
    { mode: "button", markup: (id: string, extra: string) => `<ocelle-pill-tag id="${id}" interactive status="info"${extra}>Mine</ocelle-pill-tag>` },
    { mode: "link", markup: (id: string, extra: string) => `<ocelle-pill-tag id="${id}" href="#mine" status="info"${extra}>Mine</ocelle-pill-tag>` },
  ].map(
    ({ mode, markup }): Scenario => ({
      name: `US4-5, ${mode} mode: a disabled pill is out of the Tab and Shift+Tab order, reported disabled and not focusable${mode === "link" ? ", its inner link has no href and is role link with aria-disabled" : ""}; a pointer click, a Ctrl click, a middle click, Enter after its host's focus() and its click() dispatch neither a click nor ocelle-pill-tag-activate, while its enabled twin's click gives one of each (FR-030, FR-031; 012 FR-003)`,
      run: async (driver) => {
        await mount(driver, `<div id="wrap">${markup("off", " disabled")} ${markup("on", "")}</div>`);
        await driver.events("off", ["click", "auxclick", activate]);
        await driver.click("off");
        await driver.click("off", { modifiers: ["Control"] });
        await driver.click("off", { button: "middle" });
        await driver.focus("off");
        await driver.press("Enter");
        await driver.callClick("off");
        const off = counts(await driver.takeEvents(), "off");
        await driver.events("on", ["click", "auxclick", activate]);
        await driver.callClick("on");
        const on = counts(await driver.takeEvents(), "on");
        const state = await driver.axState("off", control);
        return {
          off,
          on,
          controls: await controls(driver, "off", ["href", "role", "aria-disabled", "disabled", "tabindex"]),
          state: { role: state.role, disabled: state.disabled, focusable: state.focusable },
          forward: await driver.tabOrder(),
          reverse: await driver.tabOrder({ reverse: true }),
        };
      },
      expected: {
        off: { click: 0, auxclick: 0, activate: 0 },
        on: { click: 1, auxclick: 0, activate: 1 },
        controls: [mode === "link" ? { tag: "a", role: "link", "aria-disabled": "true" } : { tag: "button", disabled: "" }],
        state: { role: mode === "link" ? "link" : "button", disabled: true, focusable: false },
        forward: [["ocelle-pill-tag#on", mode === "link" ? "a" : "button"]],
        reverse: [["ocelle-pill-tag#on", mode === "link" ? "a" : "button"]],
      },
    }),
  ),
  {
    name: "Static: a static pill's click and its click() reach a host listener and dispatch no ocelle-pill-tag-activate, while an interactive twin's give one activate event before its click (FR-031; plant: the activate dispatched while static)",
    run: async (driver) => {
      await mount(driver, '<div id="wrap"><ocelle-pill-tag id="s" status="info">Draft</ocelle-pill-tag> <ocelle-pill-tag id="i" interactive status="info">Mine</ocelle-pill-tag></div>');
      await driver.events("s", ["click", activate]);
      await driver.click("s");
      await driver.callClick("s");
      const still = counts(await driver.takeEvents(), "s");
      await driver.events("i", ["click", activate]);
      await driver.click("i");
      return { still, interactive: counts(await driver.takeEvents(), "i") };
    },
    expected: { still: { click: 2, auxclick: 0, activate: 0 }, interactive: { click: 1, auxclick: 0, activate: 1 } },
  },
  {
    name: 'US4-4: aria-pressed="true" on a button-mode host is moved to the inner button: the host keeps no aria-pressed and carries the mirror, the tree reports pressed and :state(pressed) matches; "false" reports not pressed, "mixed" reports mixed and "bogus" reaches the button as written, none with :state(pressed); "" clears it, mirror included (FR-031; 012 FR-004; plant: an aria-pressed value filter)',
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" interactive status="info" aria-pressed="true">Mine</ocelle-pill-tag>');
      await driver.rules(stateRules);
      const read = async (): Promise<unknown> => ({ ...(await hostPair(driver, "p", "aria-pressed")), controls: await controls(driver, "p", ["aria-pressed"]), pressed: (await driver.axState("p", control)).pressed, states: await states(driver, "p") });
      const found: Record<string, unknown> = { true: await read() };
      for (const value of ["false", "mixed", "bogus", ""]) {
        await driver.setAttribute("p", "aria-pressed", value);
        found[value === "" ? "cleared" : value] = await read();
      }
      // Chromium's report for a value outside the token list is its own; only the value as written is asserted.
      const bogus = found.bogus as Record<string, unknown>;
      found.bogus = { host: bogus.host, mirror: bogus.mirror, controls: bogus.controls, states: bogus.states };
      return found;
    },
    expected: {
      true: { host: null, mirror: "true", controls: [{ tag: "button", "aria-pressed": "true" }], pressed: "true", states: ["pressed"] },
      false: { host: null, mirror: "false", controls: [{ tag: "button", "aria-pressed": "false" }], pressed: "false", states: [] },
      mixed: { host: null, mirror: "mixed", controls: [{ tag: "button", "aria-pressed": "mixed" }], pressed: "mixed", states: [] },
      bogus: { host: null, mirror: "bogus", controls: [{ tag: "button", "aria-pressed": "bogus" }], states: [] },
      cleared: { host: null, mirror: null, controls: [{ tag: "button" }], pressed: null, states: [] },
    },
  },
  {
    name: 'Custom states (FR-031): aria-current "page" and "true" on a button-mode and on a link-mode pill give :state(current) and reach the inner control; "false" gives none and is not applied; aria-pressed="true" on a link-mode pill is moved and mirrored, not applied, and gives no :state(pressed), while the button twin\'s does; a static pill with both on its host matches neither state (plan decision 12)',
    run: async (driver) => {
      await mount(
        driver,
        '<ocelle-pill-tag id="b" interactive aria-current="page" aria-pressed="true">Mine</ocelle-pill-tag> <ocelle-pill-tag id="l" href="#mine" aria-current="true" aria-pressed="true">Mine</ocelle-pill-tag> <ocelle-pill-tag id="f" interactive aria-current="false">Mine</ocelle-pill-tag> <ocelle-pill-tag id="s" aria-current="page" aria-pressed="true">Mine</ocelle-pill-tag>',
      );
      await driver.rules(stateRules);
      const read = async (id: string): Promise<unknown> => ({ states: await states(driver, id), controls: await controls(driver, id, ["aria-current", "aria-pressed"]), current: await hostPair(driver, id, "aria-current"), pressed: await hostPair(driver, id, "aria-pressed") });
      const found = { b: await read("b"), l: await read("l"), f: await read("f"), s: await read("s") };
      await driver.setAttribute("s", "aria-current", null);
      await driver.setAttribute("s", "aria-pressed", null);
      return found;
    },
    expected: {
      b: { states: ["pressed", "current"], controls: [{ tag: "button", "aria-current": "page", "aria-pressed": "true" }], current: { host: null, mirror: "page" }, pressed: { host: null, mirror: "true" } },
      l: { states: ["current"], controls: [{ tag: "a", "aria-current": "true" }], current: { host: null, mirror: "true" }, pressed: { host: null, mirror: "true" } },
      f: { states: [], controls: [{ tag: "button" }], current: { host: null, mirror: "false" }, pressed: { host: null, mirror: null } },
      s: { states: [], controls: [], current: { host: "page", mirror: null }, pressed: { host: "true", mirror: null } },
    },
  },
  {
    name: "US4-1, the label attribute (FR-025): label=\"Mine filter\" as an attribute names the inner control and stays as written; a label set as a property names it with no attribute written; a whitespace-only label counts as none, so the text names it; aria-labelledby wins over aria-label, which wins over label, in both modes (012 FR-006; plant: label property-only)",
    run: async (driver) => {
      await mount(
        driver,
        '<span id="named">Mine, by reference</span><ocelle-pill-tag id="a" interactive label="Mine filter">Mine</ocelle-pill-tag> <ocelle-pill-tag id="q" interactive>Mine</ocelle-pill-tag> <ocelle-pill-tag id="w" interactive label="  ">Mine</ocelle-pill-tag> <ocelle-pill-tag id="o" href="#mine" aria-labelledby="named" aria-label="Mine, removed" label="Mine, deleted">Mine</ocelle-pill-tag> <ocelle-pill-tag id="al" interactive aria-label="Mine, removed" label="Mine, deleted">Mine</ocelle-pill-tag>',
      );
      await driver.setProperty("q", "label", "Mine, set by property");
      const name = async (id: string): Promise<string> => (await driver.axState(id, control)).name;
      return {
        attribute: { name: await name("a"), label: await driver.attribute("a", "label") },
        property: { name: await name("q"), label: await driver.attribute("q", "label") },
        blank: await name("w"),
        labelledby: await name("o"),
        ariaLabel: await name("al"),
        // The inner aria-label is the element's only when it names the control: none under aria-labelledby or for a blank label.
        inner: { labelledby: await controls(driver, "o", ["aria-label"]), blank: await controls(driver, "w", ["aria-label"]), attribute: await controls(driver, "a", ["aria-label"]) },
      };
    },
    expected: { attribute: { name: "Mine filter", label: "Mine filter" }, property: { name: "Mine, set by property", label: null }, blank: "Mine", labelledby: "Mine, by reference", ariaLabel: "Mine, removed", inner: { labelledby: [{ tag: "a" }], blank: [{ tag: "button" }], attribute: [{ tag: "button", "aria-label": "Mine filter" }] } },
  },
  {
    name: "References (FR-030; 012 FR-005): aria-describedby, aria-controls and aria-labelledby on an interactive pill relate the inner control to the elements with those ids in the host's tree, in button and in link mode: the description, the controlled element and the name follow them; a reference with no element sets no reflection (no content attribute); an id that appears later is resolved when the pill is connected again (012 FR-005)",
    run: async (driver) => {
      await mount(driver, `${referenced}<span id="blocked-name">Blocked, by reference</span><ocelle-pill-tag id="b" interactive aria-describedby="hint" aria-controls="panel" aria-labelledby="blocked-name">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="l" href="#mine" aria-describedby="hint" aria-controls="panel">Blocked</ocelle-pill-tag> <span id="later"></span><ocelle-pill-tag id="m" interactive aria-describedby="late-hint">Blocked</ocelle-pill-tag><div id="moved-to"></div>`);
      const read = async (id: string): Promise<unknown> => {
        const state = await driver.axState(id, control);
        return { name: state.name, description: state.description, controls: state.controls };
      };
      const found = { b: await read("b"), l: await read("l"), lAttributes: await controls(driver, "l", ["aria-labelledby", "aria-describedby", "aria-controls"]) };
      // A reference to an id that appears later is resolved when the element is connected again (moved).
      await driver.append("later", '<span id="late-hint">Late hint</span>');
      await driver.move("m", "moved-to");
      return { ...found, moved: (await driver.axState("m", control)).description };
    },
    expected: { lAttributes: [{ tag: "a", "aria-describedby": "", "aria-controls": "" }], moved: "Late hint", b: { name: "Blocked, by reference", description: "Hint text", controls: ["panel"] }, l: { name: "Blocked", description: "Hint text", controls: ["panel"] } },
  },
  ...[
    { mode: "button", mark: " interactive" },
    { mode: "link", mark: ' href="#mine"' },
  ].map(
    ({ mode, mark }): Scenario => ({
      name: `Seven names, interactive (${mode} mode; twin of § US3's seven names): each of aria-label, aria-labelledby, aria-describedby, aria-controls, aria-current, aria-pressed and title set on an upgraded interactive pill is moved: gone from the host, mirrored as data-ocelle-moved-<name>, aria-current and title on the inner control${mode === "button" ? " and aria-pressed too" : ", aria-pressed not applied to the link"}; on a static twin each stays on the host with no mirror (FR-027, FR-030; plant: the static guard in attributeChangedCallback removed)`,
      run: async (driver) => {
        await mount(driver, `${referenced}<ocelle-pill-tag id="p"${mark} status="info">Mine</ocelle-pill-tag> <ocelle-pill-tag id="s" status="info">Mine</ocelle-pill-tag>`);
        const found: Record<string, unknown> = {};
        for (const name of passthrough) {
          await driver.setAttribute("p", name, passthroughValue[name]);
          await driver.setAttribute("s", name, passthroughValue[name]);
          found[name] = { interactive: await hostPair(driver, "p", name), static: await hostPair(driver, "s", name) };
        }
        const inner = await controls(driver, "p", ["aria-current", "aria-pressed", "title"]);
        for (const name of passthrough) await driver.setAttribute("s", name, null);
        return { found, inner, staticRoot: await rendered(driver, "s") };
      },
      expected: {
        found: Object.fromEntries(passthrough.map((name) => [name, { interactive: { host: null, mirror: passthroughValue[name] }, static: { host: passthroughValue[name], mirror: null } }])),
        inner: [{ tag: mode === "button" ? "button" : "a", "aria-current": "page", ...(mode === "button" ? { "aria-pressed": "true" } : {}), title: "Blocked since Monday" }],
        staticRoot,
      },
    }),
  ),
  ...variants.flatMap((variant) =>
    densities.map(
      (density): Scenario => ({
        name: `US4-7, ${variant}, ${density}: an interactive pill with a one-character text and with a long one, and one whose font tokens a host makes small, has a control box at least --ocelle-target-small (24 px) in block and in inline size${density === "compact" ? ", and its block padding is at least --ocelle-space-1" : ""}, while its static twin with the small font is shorter (FR-029, FR-032, FR-043; plant: min-block-size removed)`,
        run: async (driver) => {
          const at = attributes(variant, density);
          await mount(driver, `<p><ocelle-pill-tag id="one" interactive${at}>3</ocelle-pill-tag> <ocelle-pill-tag id="long" interactive${at}>Blocked by the review</ocelle-pill-tag> <ocelle-pill-tag id="small" class="small" interactive${at}>3</ocelle-pill-tag> <ocelle-pill-tag id="small-static" class="small"${at}>3</ocelle-pill-tag></p>`);
          await driver.rules(".small { --ocelle-font-size-xs: 0.5rem; --ocelle-font-size-sm: 0.5rem; }");
          const found: Record<string, unknown> = {};
          for (const id of ["one", "long", "small"]) {
            const box = await driver.box(id, control);
            const row = await driver.box(id, ".icon-row");
            found[id] = { block: box.height >= targetSmall - 0.01, inline: box.width >= targetSmall - 0.01, padding: row.y - box.y - borderWidth >= space1 - 0.01 };
          }
          return { ...found, staticShorter: (await driver.box("small-static")).height < targetSmall - 1 };
        },
        expected: { one: { block: true, inline: true, padding: true }, long: { block: true, inline: true, padding: true }, small: { block: true, inline: true, padding: true }, staticShorter: true },
      }),
    ),
  ),
  {
    name: "US4-7, the target by clicks: on a one-character compact badge whose host makes its font small (its control 24 by 24 px), a click 1 px inside the midpoint of each edge delivers one click and one ocelle-pill-tag-activate, and a click 1 px outside its inline start delivers none to it (FR-032; WCAG 2.5.8; plant: min-inline-size removed)",
    run: async (driver) => {
      await mount(driver, '<p id="line">Count <ocelle-pill-tag id="p" class="small" interactive variant="badge" density="compact">3</ocelle-pill-tag> items</p>');
      await driver.rules(".small { --ocelle-font-size-xs: 0.5rem; }");
      const box = await driver.box("p");
      await driver.events("p", ["click", activate]);
      const found: Record<string, unknown> = { size: [Math.abs(box.width - targetSmall) <= 0.01, Math.abs(box.height - targetSmall) <= 0.01] };
      for (const [edge, position] of [
        ["top", { x: box.width / 2, y: 1 }],
        ["end", { x: box.width - 1, y: box.height / 2 }],
        ["bottom", { x: box.width / 2, y: box.height - 1 }],
        ["start", { x: 1, y: box.height / 2 }],
        ["outside", { x: -1, y: box.height / 2 }],
      ] as const) {
        await driver.click("p", { position });
        found[edge] = counts(await driver.takeEvents(), "p");
      }
      return found;
    },
    expected: {
      size: [true, true],
      top: { click: 1, auxclick: 0, activate: 1 },
      end: { click: 1, auxclick: 0, activate: 1 },
      bottom: { click: 1, auxclick: 0, activate: 1 },
      start: { click: 1, auxclick: 0, activate: 1 },
      outside: { click: 0, auxclick: 0, activate: 0 },
    },
  },
  {
    name: "012 FR-001, stretched host: an interactive pill host stretched by a flex row (flex: 1, the row 60 px tall) and by a 200 by 60 px grid cell has a control box equal to the host's, and a click 1 px inside the host's inline start delivers one click and one ocelle-pill-tag-activate (FR-030; plants: the host not inline-grid, the static .pill sizing selected as .pill)",
    run: async (driver) => {
      await mount(driver, '<div id="row"><ocelle-pill-tag id="f" interactive status="warning">Blocked</ocelle-pill-tag></div><div id="grid"><ocelle-pill-tag id="g" interactive status="warning">Blocked</ocelle-pill-tag></div>');
      await driver.rules("#row { display: flex; inline-size: 300px; block-size: 60px; } #row > ocelle-pill-tag { flex: 1; } #grid { display: grid; grid-template-columns: 200px; grid-template-rows: 60px; }");
      const found: Record<string, unknown> = {};
      for (const id of ["f", "g"]) {
        const host = await driver.box(id);
        await driver.events(id, ["click", activate]);
        await driver.click(id, { position: { x: 1, y: host.height / 2 } });
        found[id] = { filled: same(await driver.box(id, control), host), tall: Math.abs(host.height - 60) <= 0.5, counts: counts(await driver.takeEvents(), id) };
      }
      return found;
    },
    expected: {
      f: { filled: true, tall: true, counts: { click: 1, auxclick: 0, activate: 1 } },
      g: { filled: true, tall: true, counts: { click: 1, auxclick: 0, activate: 1 } },
    },
  },
  {
    name: "Equal boxes (US4-4; plan decision 6): an interactive pill and badge in each density have the same control box at rest, hovered, pressed by the pointer and with aria-pressed=\"true\", with --ocelle-border-width borders throughout (plant: border-width changed by a state)",
    run: async (driver) => {
      const markup = variants.flatMap((variant) => densities.map((density) => `<ocelle-pill-tag id="${variant}-${density}" interactive status="info"${attributes(variant, density)}>Mine</ocelle-pill-tag> `));
      await mount(driver, `<p>${markup.join("")}</p><p id="away">Away</p>`);
      const found: Record<string, unknown> = {};
      for (const variant of variants) {
        for (const density of densities) {
          const id = `${variant}-${density}`;
          await driver.hover("away");
          const rest = await driver.box(id, control);
          await driver.hover(id);
          const hovered = await driver.box(id, control);
          await driver.pointerDown(id);
          const pressed = await driver.box(id, control);
          const width = await driver.computed(id, "border-top-width", control);
          await driver.pointerUp(id);
          await driver.hover("away");
          await driver.setAttribute(id, "aria-pressed", "true");
          const toggled = await driver.box(id, control);
          found[id] = { hovered: same(hovered, rest), pressed: same(pressed, rest), toggled: same(toggled, rest), width, toggledWidth: await driver.computed(id, "border-top-width", control) };
        }
      }
      return found;
    },
    expected: Object.fromEntries(variants.flatMap((variant) => densities.map((density) => [`${variant}-${density}`, { hovered: true, pressed: true, toggled: true, width: `${String(borderWidth)}px`, toggledWidth: `${String(borderWidth)}px` }]))),
  },
  ...variants.flatMap((variant) =>
    densities.map(
      (density): Scenario => ({
        name: `Baseline, interactive, ${variant}, ${density}: a one-line interactive pill, in button and in link mode, enabled and disabled, with and without an icon, inline in a paragraph and in an align-items: baseline flex row, has its text's bottom on the surrounding text's, within 0.5 px (Edge Cases; plan decision 15 as amended, operator decision Q2 (a); plants: the interactive render's text wrapper without the label class, bare on every row)`,
        run: async (driver) => {
          const at = attributes(variant, density);
          const cases = [
            { id: "b", mark: " interactive", content: "Blocked" },
            { id: "bi", mark: " interactive", content: `${icon}Blocked` },
            { id: "l", mark: ' href="#blocked"', content: "Blocked" },
            { id: "li", mark: ' href="#blocked"', content: `${icon}Blocked` },
            { id: "d", mark: " interactive disabled", content: "Blocked" },
            { id: "dl", mark: ' href="#blocked" disabled', content: `${icon}Blocked` },
          ];
          await mount(
            driver,
            cases
              .map(
                ({ id, mark, content }) =>
                  `<p class="around"><span id="before-${id}">Before</span> <ocelle-pill-tag id="p-${id}" status="warning"${mark}${at}>${content}</ocelle-pill-tag> after</p><div class="around row"><span id="name-${id}">Name</span><ocelle-pill-tag id="r-${id}" status="warning"${mark}${at}>${content}</ocelle-pill-tag></div>`,
              )
              .join(""),
          );
          await driver.rules(`.around { margin: 0; ${surrounding(density)} } .row { display: flex; align-items: baseline; column-gap: 8px; }`);
          const bottom = (text: TextBox | undefined): number => (text === undefined ? Number.NaN : text.box.y + text.box.height);
          const found: Record<string, boolean> = {};
          for (const { id } of cases) {
            found[`p-${id}`] = Math.abs(bottom(await textOf(driver, `p-${id}`)) - bottom(await textOf(driver, `before-${id}`))) <= 0.5;
            found[`r-${id}`] = Math.abs(bottom(await textOf(driver, `r-${id}`)) - bottom(await textOf(driver, `name-${id}`))) <= 0.5;
          }
          return found;
        },
        expected: Object.fromEntries(["b", "bi", "l", "li", "d", "dl"].flatMap((id) => [[`p-${id}`, true], [`r-${id}`, true]])),
      }),
    ),
  ),
  {
    name: "Plan decision 11, the ring's clearance: an interactive pill with a long text in a 200 px container that clips (overflow: hidden) has one focus-ring extent of inline margin on each side and caps its host at the container less two extents, so its keyboard focus ring lies inside the container in the inline axis; a static twin has no margin (FR-032)",
    run: async (driver) => {
      await mount(driver, '<button id="before" type="button">Before</button><div id="clip"><ocelle-pill-tag id="p" interactive status="info">Blocked by the review of the nightly scheduler pipeline run</ocelle-pill-tag></div><div id="clip-s"><ocelle-pill-tag id="s" status="info">Blocked by the review of the nightly scheduler pipeline run</ocelle-pill-tag></div>');
      await driver.rules("#clip, #clip-s { inline-size: 200px; overflow: hidden; padding-block: 8px; }");
      await driver.focus("before");
      await driver.press("Tab");
      const clip = await driver.box("clip");
      const host = await driver.box("p");
      const box = await driver.box("p", control);
      const ring = { x: box.x - ringExtent, width: box.width + 2 * ringExtent };
      return {
        visible: await driver.focusVisible("p", control),
        margins: [await driver.computed("p", "margin-inline-start"), await driver.computed("p", "margin-inline-end")],
        capped: Math.abs(host.width - (clip.width - 2 * ringExtent)) <= 0.5,
        ringInside: ring.x >= clip.x - 0.5 && ring.x + ring.width <= clip.x + clip.width + 0.5,
        staticMargins: [await driver.computed("s", "margin-inline-start"), await driver.computed("s", "margin-inline-end")],
      };
    },
    expected: { visible: true, margins: [`${String(ringExtent)}px`, `${String(ringExtent)}px`], capped: true, ringInside: true, staticMargins: ["0px", "0px"] },
  },
  ...[
    { mode: "button", mark: " interactive", leave: [["interactive", null]] as const, pressed: true },
    { mode: "link", mark: ' href="#blocked"', leave: [["href", ""]] as const, pressed: false },
  ].map(
    ({ mode, mark, leave, pressed }): Scenario => ({
      name: `US4-8, ${mode} mode becomes static (${leave[0][0]} ${leave[0][1] === null ? "removed" : 'set to ""'}): title="Blocked since Monday", aria-describedby="hint" and aria-pressed="true" moved to the inner control are back on the host with the values they last had, the mirrors gone, no custom state, the static shadow root rendered; a title changed after that stays on the host with no mirror (US3-7's "has become static" half; FR-035 (a); plant: release() not called)`,
      run: async (driver) => {
        await mount(driver, `${referenced}<ocelle-pill-tag id="p"${mark} status="warning" title="Blocked since Monday" aria-describedby="hint" aria-pressed="false">Blocked</ocelle-pill-tag>`);
        await driver.rules(stateRules);
        await driver.setAttribute("p", "aria-pressed", "true");
        const moved = { title: await hostPair(driver, "p", "title"), describedby: await hostPair(driver, "p", "aria-describedby"), pressed: await hostPair(driver, "p", "aria-pressed") };
        const before = await states(driver, "p");
        for (const [name, value] of leave) await driver.setAttribute("p", name, value);
        const after = {
          title: await hostPair(driver, "p", "title"),
          describedby: await hostPair(driver, "p", "aria-describedby"),
          pressed: await hostPair(driver, "p", "aria-pressed"),
          states: await states(driver, "p"),
          root: await rendered(driver, "p"),
        };
        await driver.setAttribute("p", "title", "Blocked since Tuesday");
        const changed = await hostPair(driver, "p", "title");
        for (const name of ["title", "aria-describedby", "aria-pressed"]) await driver.setAttribute("p", name, null);
        return { moved, before, after, changed };
      },
      expected: {
        moved: { title: { host: null, mirror: "Blocked since Monday" }, describedby: { host: null, mirror: "hint" }, pressed: { host: null, mirror: "true" } },
        before: pressed ? ["pressed"] : [],
        after: { title: { host: "Blocked since Monday", mirror: null }, describedby: { host: "hint", mirror: null }, pressed: { host: "true", mirror: null }, states: [], root: staticRoot },
        changed: { host: "Blocked since Tuesday", mirror: null },
      },
    }),
  ),
  {
    name: 'US4-8, same task (FR-035): interactive removed and aria-label="New" set in one task, in either order, leaves aria-label="New" on the host with no mirror, where the pill held "Old" as moved (on the host only as its mirror); a later change of a written-back title stays on the host with no mirror (plant: release() deferred to the update)',
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="a" interactive aria-label="Old" title="Then">Mine</ocelle-pill-tag> <ocelle-pill-tag id="b" interactive aria-label="Old" title="Then">Mine</ocelle-pill-tag>');
      // Before the change both pills hold "Old" as moved: on the host only as its mirror.
      const before = { a: await hostPair(driver, "a", "aria-label"), b: await hostPair(driver, "b", "aria-label"), title: await hostPair(driver, "a", "title") };
      await driver.changeAttributes("a", [
        ["interactive", null],
        ["aria-label", "New"],
      ]);
      await driver.changeAttributes("b", [
        ["aria-label", "New"],
        ["interactive", null],
      ]);
      const found = { a: await hostPair(driver, "a", "aria-label"), b: await hostPair(driver, "b", "aria-label"), title: await hostPair(driver, "a", "title") };
      await driver.setAttribute("a", "title", "Later");
      const later = await hostPair(driver, "a", "title");
      for (const id of ["a", "b"]) for (const name of ["aria-label", "title"]) await driver.setAttribute(id, name, null);
      return { before, ...found, later };
    },
    expected: { before: { a: { host: null, mirror: "Old" }, b: { host: null, mirror: "Old" }, title: { host: null, mirror: "Then" } }, a: { host: "New", mirror: null }, b: { host: "New", mirror: null }, title: { host: "Then", mirror: null }, later: { host: "Later", mirror: null } },
  },
  {
    name: 'US4-9, attribute order: title and aria-current="page" written before interactive, or before a link-mode href, in the markup are moved and mirrored at upgrade and :state(current) matches; the same set one by one on a pill made by document.createElement, the passthrough attributes first, end the same (FR-035 (b); plants: the mode read from Lit properties, capture() not called)',
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="m" title="x" aria-current="page" interactive>Mine</ocelle-pill-tag> <ocelle-pill-tag id="h" title="x" aria-current="page" href="#mine">Mine</ocelle-pill-tag> <span id="holder"></span>');
      await driver.rules(stateRules);
      await driver.append("holder", '<ocelle-pill-tag id="c">Mine</ocelle-pill-tag><ocelle-pill-tag id="ch">Mine</ocelle-pill-tag>');
      for (const id of ["c", "ch"]) {
        await driver.setAttribute(id, "title", "x");
        await driver.setAttribute(id, "aria-current", "page");
      }
      await driver.setAttribute("c", "interactive", "");
      await driver.setAttribute("ch", "href", "#mine");
      const read = async (id: string): Promise<unknown> => ({ title: await hostPair(driver, id, "title"), current: await hostPair(driver, id, "aria-current"), states: await states(driver, id), controls: await controls(driver, id, ["title", "aria-current"]) });
      return { m: await read("m"), h: await read("h"), c: await read("c"), ch: await read("ch") };
    },
    expected: {
      m: { title: { host: null, mirror: "x" }, current: { host: null, mirror: "page" }, states: ["current"], controls: [{ tag: "button", title: "x", "aria-current": "page" }] },
      h: { title: { host: null, mirror: "x" }, current: { host: null, mirror: "page" }, states: ["current"], controls: [{ tag: "a", title: "x", "aria-current": "page" }] },
      c: { title: { host: null, mirror: "x" }, current: { host: null, mirror: "page" }, states: ["current"], controls: [{ tag: "button", title: "x", "aria-current": "page" }] },
      ch: { title: { host: null, mirror: "x" }, current: { host: null, mirror: "page" }, states: ["current"], controls: [{ tag: "a", title: "x", "aria-current": "page" }] },
    },
  },
  {
    name: 'US4-9: a static pill with title, aria-label and aria-current="page" on its host, made interactive by interactive and by a link-mode href, moves and mirrors them as at upgrade and :state(current) matches; it does not take focus (FR-035 (b), (d))',
    run: async (driver) => {
      await mount(driver, '<button id="before" type="button">Before</button> <ocelle-pill-tag id="b" title="Blocked since Monday" aria-label="Blocked state" aria-current="page">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="l" title="Blocked since Monday" aria-label="Blocked state" aria-current="page">Blocked</ocelle-pill-tag>');
      await driver.rules(stateRules);
      const before = { states: await states(driver, "b"), title: await hostPair(driver, "b", "title") };
      await driver.focus("before");
      await driver.setAttribute("b", "interactive", "");
      await driver.setAttribute("l", "href", "#blocked");
      const read = async (id: string): Promise<unknown> => ({
        pairs: [await hostPair(driver, id, "title"), await hostPair(driver, id, "aria-label"), await hostPair(driver, id, "aria-current")],
        states: await states(driver, id),
        controls: await controls(driver, id, ["title", "aria-label", "aria-current"]),
      });
      return { before, b: await read("b"), l: await read("l"), focus: await driver.focusPath() };
    },
    expected: {
      before: { states: [], title: { host: "Blocked since Monday", mirror: null } },
      b: {
        pairs: [
          { host: null, mirror: "Blocked since Monday" },
          { host: null, mirror: "Blocked state" },
          { host: null, mirror: "page" },
        ],
        states: ["current"],
        controls: [{ tag: "button", title: "Blocked since Monday", "aria-label": "Blocked state", "aria-current": "page" }],
      },
      l: {
        pairs: [
          { host: null, mirror: "Blocked since Monday" },
          { host: null, mirror: "Blocked state" },
          { host: null, mirror: "page" },
        ],
        states: ["current"],
        controls: [{ tag: "a", title: "Blocked since Monday", "aria-label": "Blocked state", "aria-current": "page" }],
      },
      focus: "before",
    },
  },
  {
    name: 'US4-10: a button-mode pill with aria-pressed="true" and aria-current="true" moved, given a link-mode href, has aria-current on the inner link and :state(current), while aria-pressed stays moved (not on the host, its mirror "true" kept), is not on the link and gives no :state(pressed); with the href removed the stored "true" is on the inner button again and :state(pressed) matches (FR-035 (c); plan decision 12)',
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" interactive aria-pressed="true" aria-current="true">Mine</ocelle-pill-tag>');
      await driver.rules(stateRules);
      const read = async (): Promise<unknown> => ({ pressed: await hostPair(driver, "p", "aria-pressed"), current: await hostPair(driver, "p", "aria-current"), states: await states(driver, "p"), controls: await controls(driver, "p", ["aria-pressed", "aria-current", "href"]) });
      const button = await read();
      await driver.setAttribute("p", "href", "#mine");
      const link = await read();
      await driver.setAttribute("p", "href", null);
      await driver.settle();
      // The pill had no focus at either switch, so it takes none (FR-035 (d)).
      return { button, link, back: await read(), focus: await driver.focusPath() };
    },
    expected: {
      button: { pressed: { host: null, mirror: "true" }, current: { host: null, mirror: "true" }, states: ["pressed", "current"], controls: [{ tag: "button", "aria-pressed": "true", "aria-current": "true" }] },
      link: { pressed: { host: null, mirror: "true" }, current: { host: null, mirror: "true" }, states: ["current"], controls: [{ tag: "a", "aria-current": "true", href: "#mine" }] },
      back: { pressed: { host: null, mirror: "true" }, current: { host: null, mirror: "true" }, states: ["pressed", "current"], controls: [{ tag: "button", "aria-pressed": "true", "aria-current": "true" }] },
      focus: "body",
    },
  },
  {
    name: "US4-10, focus: a keyboard-focused button-mode pill switched to link mode and back has focus on the new inner control each time, with the focus ring; a pointer-focused twin keeps focus on the new control with no ring (FR-035 (d); WCAG 2.4.3; plant: no refocus; the tooltip's half of this body is user story 5's)",
    run: async (driver) => {
      await mount(driver, '<button id="before" type="button">Before</button> <ocelle-pill-tag id="k" interactive status="info">Mine</ocelle-pill-tag> <ocelle-pill-tag id="m" interactive status="info">Mine</ocelle-pill-tag>');
      const read = async (id: string): Promise<unknown> => ({ path: await driver.focusPath(), active: await driver.activeInner(id), ring: await driver.focusVisible(id, control) });
      await driver.focus("before");
      await driver.press("Tab");
      const keyboardStart = await read("k");
      await driver.setAttribute("k", "href", "#mine");
      await driver.settle();
      const keyboardLink = await read("k");
      await driver.setAttribute("k", "href", null);
      await driver.settle();
      const keyboardBack = await read("k");
      await driver.focus("before");
      await driver.setAttribute("k", "status", "warning");
      await driver.settle();
      const later = await driver.focusPath();
      await driver.click("m");
      const pointerStart = await read("m");
      await driver.setAttribute("m", "href", "#mine");
      await driver.settle();
      const pointerLink = await read("m");
      return { keyboardStart, keyboardLink, keyboardBack, later, pointerStart, pointerLink };
    },
    expected: {
      keyboardStart: { path: "k[button]", active: "button", ring: true },
      keyboardLink: { path: "k[a]", active: "a", ring: true },
      keyboardBack: { path: "k[button]", active: "button", ring: true },
      later: "before",
      pointerStart: { path: "m[button]", active: "button", ring: false },
      pointerLink: { path: "m[a]", active: "a", ring: false },
    },
  },
  {
    name: "US4-11: an interactive pill whose inner control has focus, made static, loses focus as a removed element does (focus on the body, nothing focused in its shadow root), and the pill does not move it, while a twin switched from button to link mode keeps it (FR-035 (d))",
    run: async (driver) => {
      await mount(driver, '<button id="before" type="button">Before</button> <ocelle-pill-tag id="p" interactive status="info">Mine</ocelle-pill-tag> <ocelle-pill-tag id="t" interactive status="info">Mine</ocelle-pill-tag>');
      await driver.focus("p");
      const focused = await driver.focusPath();
      await driver.setAttribute("p", "interactive", null);
      await driver.settle();
      const madeStatic = { path: await driver.focusPath(), inner: await driver.activeInner("p"), root: await rendered(driver, "p") };
      await driver.focus("t");
      await driver.setAttribute("t", "href", "#mine");
      await driver.settle();
      return { focused, madeStatic, twin: await driver.focusPath() };
    },
    expected: { focused: "p[button]", madeStatic: { path: "body", inner: null, root: staticRoot }, twin: "t[a]" },
  },
  {
    name: 'US4-12: a pill static at upgrade with data-ocelle-moved-title="Blocked since Monday" and no title has that title on its host and no mirror; with its own title "Own" as well, the host keeps "Own" and the mirror is removed; an interactive twin with the mirror reads it back onto its inner control, the mirror kept, and its own title wins over the mirror; a mirror written on a static pill after its upgrade stays through a reconnection (FR-035 (e); 012 FR-004; plant: adoptMirrors() not called)',
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="a" status="warning" data-ocelle-moved-title="Blocked since Monday">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="o" status="warning" title="Own" data-ocelle-moved-title="Copied">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="i" interactive status="warning" data-ocelle-moved-title="Blocked since Monday">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="io" interactive status="warning" title="Own" data-ocelle-moved-title="Copied">Blocked</ocelle-pill-tag><div id="elsewhere"></div>');
      const found = {
        a: await hostPair(driver, "a", "title"),
        o: await hostPair(driver, "o", "title"),
        i: { ...(await hostPair(driver, "i", "title")), controls: await controls(driver, "i", ["title"]) },
        io: { ...(await hostPair(driver, "io", "title")), controls: await controls(driver, "io", ["title"]) },
      };
      // Only the upgrade gives mirrors back: a mirror written on the static pill later stays through a reconnection.
      await driver.setAttribute("a", "title", null);
      await driver.setAttribute("a", "data-ocelle-moved-title", "Later");
      await driver.move("a", "elsewhere");
      return { ...found, reconnected: await hostPair(driver, "a", "title") };
    },
    expected: {
      a: { host: "Blocked since Monday", mirror: null },
      o: { host: "Own", mirror: null },
      i: { host: null, mirror: "Blocked since Monday", controls: [{ tag: "button", title: "Blocked since Monday" }] },
      io: { host: null, mirror: "Own", controls: [{ tag: "button", title: "Own" }] },
      reconnected: { host: null, mirror: "Later" },
    },
  },
  {
    name: "Interactive click (twin of § US3's static click): a click on an interactive pill, in button and in link mode, under an ancestor click listener reaches the pill, the ancestor, the document and the window not prevented, with one ocelle-pill-tag-activate before it; a static twin's click there reaches the same listeners not prevented, with no activate event (FR-027, FR-031; plant: the guard active while static)",
    run: async (driver) => {
      await mount(driver, '<div id="row-b"><ocelle-pill-tag id="b" interactive status="warning">Blocked</ocelle-pill-tag></div><div id="row-l"><ocelle-pill-tag id="l" href="#blocked" status="warning">Blocked</ocelle-pill-tag></div><div id="row-s"><ocelle-pill-tag id="s" status="warning">Blocked</ocelle-pill-tag></div>');
      const clicked = async (id: string): Promise<{ readonly at: string[]; readonly activate: number }> => {
        await driver.events(id, ["click", activate]);
        await driver.click(id);
        const records = await driver.takeEvents();
        return { at: records.filter((record) => record.type === "click").map((record) => `${record.at} ${record.defaultPrevented ? "prevented" : "not prevented"}`), activate: dispatches(records, activate, id) };
      };
      return { button: await clicked("b"), link: await clicked("l"), static: await clicked("s") };
    },
    expected: Object.fromEntries(
      [
        ["button", "b", 1],
        ["link", "l", 1],
        ["static", "s", 0],
      ].map(([key, id, activations]) => [key, { at: [`ocelle-pill-tag#${String(id)} not prevented`, `div#row-${String(id)} not prevented`, "body not prevented", "html not prevented", "document not prevented", "window not prevented"], activate: activations }]),
    ),
  },
  {
    name: 'Interactive focus (twin of § US3\'s static focus): a click on an interactive pill inside a tabindex="0" ancestor focuses its inner control, while a click on a static twin in the same kind of ancestor focuses the ancestor (FR-027, FR-030; plant: delegatesFocus set)',
    run: async (driver) => {
      await mount(driver, '<div id="holder" tabindex="0"><ocelle-pill-tag id="p" interactive status="warning">Blocked</ocelle-pill-tag></div><div id="static-holder" tabindex="0"><ocelle-pill-tag id="s" status="warning">Blocked</ocelle-pill-tag></div><button id="elsewhere" type="button">Elsewhere</button>');
      await driver.click("p");
      const interactive = await driver.focusPath();
      await driver.focus("elsewhere");
      await driver.click("s");
      return { interactive, static: await driver.focusPath() };
    },
    expected: { interactive: "p[button]", static: "static-holder" },
  },
  {
    name: "Edge cases: an interactive pill with an icon only and no name is one unnamed button, which axe reports as a critical button-name violation, beside a twin named by label; once label is set the name is the label and axe reports nothing (FR-026; Edge Cases)",
    run: async (driver) => {
      await mount(driver, `<ocelle-pill-tag id="u" interactive status="info">${icon}</ocelle-pill-tag> <ocelle-pill-tag id="n" interactive status="info" label="Open folder">${icon}</ocelle-pill-tag>`);
      const unnamed = { name: (await driver.axState("u", control)).name, row: (await driver.elements("u")).find((part) => part.attributes.class?.startsWith("icon-row") === true)?.attributes.class, axe: await severe(driver) };
      await driver.setAttribute("u", "label", "Open folder");
      return { unnamed, named: (await driver.axState("n", control)).name, labelled: (await driver.axState("u", control)).name, axe: await severe(driver) };
    },
    expected: { unnamed: { name: "", row: "icon-row bare", axe: ["violation button-name"] }, named: "Open folder", labelled: "Open folder", axe: [] },
  },
  {
    name: "Edge cases: the interactive host sheet follows the mode: a static pill's host is inline-block with no inline margin, made interactive it is inline-grid with a 5 px inline margin, made static again inline-block with none; a hidden interactive pill is display: none and adds no tab stop (data-model.md § interactive host sheet; plant: the host sheet not removed on → static)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" status="info">Mine</ocelle-pill-tag> <ocelle-pill-tag id="h" interactive hidden status="info">Mine</ocelle-pill-tag>');
      const read = async (): Promise<unknown> => ({ display: await driver.computed("p", "display"), margin: await driver.computed("p", "margin-inline-start") });
      const still = await read();
      await driver.setAttribute("p", "interactive", "");
      const interactive = await read();
      await driver.setAttribute("p", "interactive", null);
      const again = await read();
      return { still, interactive, again, hidden: await driver.computed("h", "display"), tabs: await driver.tabOrder() };
    },
    expected: {
      still: { display: "inline-block", margin: "0px" },
      interactive: { display: "inline-grid", margin: `${String(ringExtent)}px` },
      again: { display: "inline-block", margin: "0px" },
      hidden: "none",
      tabs: [],
    },
  },
  ...themes.flatMap(themed),
  ...themes.flatMap(forced),
];

/**
 * The in-process link bodies (research.md R-11): link-mode activation on the navigation sink's records, which the
 * mutated `elements` project runs, so the modifier rule, the guard and the cancel path are covered in link mode too.
 */
export const pillInteractiveSinkScenarios: readonly Scenario[] = [
  ...linkActivations.map(
    ({ name, act, trusted }): Scenario => ({
      name: `US4-3 (sink), link mode, ${name}: exactly one ocelle-pill-tag-activate (bubbles, composed, cancelable, detail {}, target the host at every listener) recorded before exactly one click, and the sink records the click not prevented, to the link's href (FR-031)`,
      run: async (driver) => {
        await driver.mount(`<div id="wrap"><ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag></div>`, { base: true });
        await driver.events("p", ["click", activate]);
        await act(driver, "p");
        const records = await driver.takeEvents();
        const click = summary(records, "click") as Record<string, unknown>;
        return { types: records.map((record) => record.type), activate: summary(records, activate), click: { at: click.at, serials: click.serials, flags: click.flags }, navigations: await driver.navigations() };
      },
      expected: {
        types: [...path.map(() => activate), ...path.map(() => "click")],
        activate: { at: path, targets: ["ocelle-pill-tag#p"], serials: 1, flags: [{ isTrusted: false, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }], details: ["{}"] },
        click: { at: path, serials: 1, flags: [{ isTrusted: trusted, bubbles: true, composed: true, cancelable: true, defaultPrevented: false }] },
        navigations: [navigation()],
      },
    }),
  ),
  ...linkActivations.slice(0, 2).map(
    ({ name, act }): Scenario => ({
      name: `US4-3 (sink), link mode, cancelled, ${name}: a listener's preventDefault() on ocelle-pill-tag-activate cancels the navigation: the click is delivered once with defaultPrevented true and the sink records it prevented (FR-031)`,
      run: async (driver) => {
        await driver.mount(`<div id="wrap"><ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag></div>`, { base: true });
        await driver.events("p", ["click", activate]);
        await driver.preventNext(activate);
        await act(driver, "p");
        const records = await driver.takeEvents();
        return { counts: counts(records, "p"), prevented: [...new Set(records.map((record) => `${record.type} ${String(record.defaultPrevented)}`))], navigations: await driver.navigations() };
      },
      expected: { counts: { click: 1, auxclick: 0, activate: 1 }, prevented: [`${activate} true`, "click true"], navigations: [navigation({ defaultPrevented: true })] },
    }),
  ),
  {
    name: "US4-3 (sink), link mode, modifier and middle clicks and Space: a Ctrl, Meta, Shift or Alt click delivers its click and no ocelle-pill-tag-activate, and the sink records it not prevented with its flag; a middle click delivers no click and no activate event, and the sink records its auxclick not prevented; Space delivers nothing, while Enter on the same link gives one activate event, one click and one record (FR-031)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag></div>`, { base: true });
      await driver.events("p", ["click", "auxclick", activate]);
      const found: Record<string, unknown> = {};
      for (const { modifier } of modifierClicks) {
        await driver.click("p", { modifiers: [modifier] });
        found[modifier] = counts(await driver.takeEvents(), "p");
      }
      await driver.click("p", { button: "middle" });
      found.middle = counts(await driver.takeEvents(), "p");
      await driver.focus("p");
      await driver.press(" ");
      found.space = counts(await driver.takeEvents(), "p");
      await driver.press("Enter");
      found.enter = counts(await driver.takeEvents(), "p");
      return { found, navigations: await driver.navigations() };
    },
    expected: {
      found: {
        ...Object.fromEntries(modifierClicks.map(({ modifier }) => [modifier, { click: 1, auxclick: 0, activate: 0 }])),
        middle: { click: 0, auxclick: 1, activate: 0 },
        space: { click: 0, auxclick: 0, activate: 0 },
        enter: { click: 1, auxclick: 0, activate: 1 },
      },
      navigations: [...modifierClicks.map(({ flag }) => navigation({ [flag]: true })), navigation({ type: "auxclick", button: 1 }), navigation()],
    },
  },
  {
    name: "US4-5 (sink): a plain, Ctrl, Shift, Alt or middle click on a disabled link-mode pill delivers no click, auxclick or activate event and leaves the sink nothing, while its enabled twin's click gives one click, one activate event and one record (FR-030; 012 FR-003)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-pill-tag id="d" href="${target}" disabled>Blocked</ocelle-pill-tag> <ocelle-pill-tag id="e" href="${target}">Blocked</ocelle-pill-tag></div>`, { base: true });
      await driver.events("d", ["click", "auxclick", activate]);
      await driver.events("e", ["click", "auxclick", activate]);
      for (const options of [{}, { modifiers: ["Control"] as const }, { modifiers: ["Shift"] as const }, { modifiers: ["Alt"] as const }, { button: "middle" as const }]) await driver.click("d", options);
      const disabled = await driver.takeEvents();
      await driver.click("e");
      const enabled = counts(await driver.takeEvents(), "e");
      return { disabled: disabled.length, enabled, navigations: await driver.navigations() };
    },
    expected: { disabled: 0, enabled: { click: 1, auxclick: 0, activate: 1 }, navigations: [navigation()] },
  },
];

const home = "pill-tag.html";
const stayed: Outcome = { page: home, tabs: [], visits: 0 };
const navigated: Outcome = { page: target, tabs: [], visits: 1 };

/** The fixture link bodies (research.md R-11): real navigation, new tabs and the server's visits. */
export const pillInteractiveNavigationScenarios: readonly NavigationScenario[] = [
  {
    name: "US4-3 (fixture), link mode: a pointer click, Enter on the focused link and the element's click() each navigate the page to the link's href, once",
    run: async (driver, nav) => {
      const found: Record<string, Outcome> = {};
      for (const { name, act } of linkActivations) {
        await driver.mount(`<ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag>`, { base: true });
        await act(driver, "p");
        found[name] = await nav.outcome();
      }
      return found;
    },
    expected: Object.fromEntries(linkActivations.map(({ name }) => [name, navigated])),
  },
  {
    name: "US4-3 (fixture), link mode, cancelled: with a listener calling preventDefault() on ocelle-pill-tag-activate, a pointer click and Enter leave the page where it is, while the same click without the listener navigates",
    run: async (driver, nav) => {
      const found: Record<string, Outcome> = {};
      for (const { name, act } of linkActivations.slice(0, 2)) {
        await driver.mount(`<ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag>`, { base: true });
        await driver.preventNext(activate);
        await act(driver, "p");
        found[name] = await nav.outcome();
      }
      await driver.mount(`<ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag>`, { base: true });
      await driver.click("p");
      found.uncancelled = await nav.outcome();
      return found;
    },
    expected: { ...Object.fromEntries(linkActivations.slice(0, 2).map(({ name }) => [name, stayed])), uncancelled: navigated },
  },
  {
    name: "US4-3 (fixture), link mode, modifier and middle clicks and Space: the browser's default happens: Ctrl and Shift open the target in a new tab or window, Alt downloads it, the middle button opens a new tab, each with the page left where it is and its click delivered without ocelle-pill-tag-activate; Meta, which Chromium on Linux does not treat as a link modifier, navigates the page; Space does nothing",
    run: async (driver, nav) => {
      const found: Record<string, unknown> = {};
      for (const [key, options] of [
        ["Control", { modifiers: ["Control"] as const }],
        ["Shift", { modifiers: ["Shift"] as const }],
        ["Alt", { modifiers: ["Alt"] as const }],
        ["middle", { button: "middle" as const }],
      ] as const) {
        await driver.mount(`<div id="wrap"><ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag></div>`, { base: true });
        await driver.events("p", ["click", "auxclick", activate]);
        await driver.click("p", options);
        const outcome = await nav.outcome();
        found[key] = { outcome, counts: counts(await driver.takeEvents(), "p") };
      }
      await driver.mount(`<ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag>`, { base: true });
      await driver.click("p", { modifiers: ["Meta"] });
      found.Meta = await nav.outcome();
      await driver.mount(`<ocelle-pill-tag id="p" href="${target}" status="warning">Blocked</ocelle-pill-tag>`, { base: true });
      await driver.focus("p");
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
    name: "US4-5 (fixture): a plain, Ctrl, Shift, Alt or middle click on a disabled link-mode pill navigates nowhere, opens no tab and downloads nothing, while its enabled twin's click navigates",
    run: async (driver, nav) => {
      const found: Record<string, Outcome> = {};
      for (const [key, options] of [
        ["plain", {}],
        ["Control", { modifiers: ["Control"] as const }],
        ["Shift", { modifiers: ["Shift"] as const }],
        ["Alt", { modifiers: ["Alt"] as const }],
        ["middle", { button: "middle" as const }],
      ] as const) {
        await driver.mount(`<ocelle-pill-tag id="d" href="${target}" disabled status="warning">Blocked</ocelle-pill-tag>`, { base: true });
        await driver.click("d", options);
        found[key] = await nav.outcome();
      }
      await driver.mount(`<ocelle-pill-tag id="e" href="${target}" status="warning">Blocked</ocelle-pill-tag>`, { base: true });
      await driver.click("e");
      found.enabled = await nav.outcome();
      return found;
    },
    expected: { plain: stayed, Control: stayed, Shift: stayed, Alt: stayed, middle: stayed, enabled: navigated },
  },
];
