// The shared bodies of User Story 3's browser scenarios, the slot convention for icons in controls (005 spec US3
// scenarios 1 to 6 and 8 to 11; FR-020 to FR-023; research.md R-10, R-11; data-model.md § Slot convention; T043). Each
// body mounts `ocelle-test-host` (test/fixtures/test-host.ts: an inner `<button class="icon-row">` with a 1 px border
// and no padding of its own, the icon wrapper, the label and the trailing wrapper, `iconSlotStyles` adopted) and
// observes it through the driver; each harness asserts the observation equals `expected`, written by hand from the
// spec and research: the 20 px `--ocelle-icon-size` (1.25rem) at the default root font size, 32 px for 2rem, the gap
// `--ocelle-space-2` (0.5rem, 8 px), the test host's 1 px border, centring within 0.5 px of the label's first line box,
// containment in the inner button's border box to one layout unit (1/64 px) and the forced-colours system colours
// of scenarios/icon.ts. Every scenario runs twice, without and with `base.css` (T043). The label text is a light-DOM
// `<span>`, whose client rects give the number of lines and where the text starts and ends; the first line box is read
// from the test host's label element (measure()).
//
// Every "does not" outcome is observed with the positive outcome it guards (spec § "Does not" outcomes are paired):
// - an empty slot adds no gap or box (US3-5, US3-10) beside a filled slot with the gap; plant: the gap applied whether
//   or not the slot holds an icon;
// - a host size rule does not change a slotted icon's box (US3-9) beside a standalone icon that follows it and the
//   token on the control that resizes the slotted icon; plant: a size rule that loses to a page rule;
// - the token set on a slotted icon itself does not change its box (US3-9) beside a standalone icon at 32 px and the
//   token on the control; plant: the `--ocelle-icon-size: inherit !important` pin removed;
// - an icon-only control's name is its own, and the slotted icon adds nothing (US3-6) beside the slotted icon's drawing
//   at the icon size and a labelled standalone twin with one image node; plant: an unlabelled icon exposing `role="img"`
//   named from its name;
// - the convention adds nothing to the name a control takes from its visible label (US3-11) beside both icons drawn
//   at the icon size and placed by the convention; plant: a zero-width-space `::before` strut without empty alt text.
// The centring plant of US3-1 and US3-10 is the strut; their containment plant the `.icon-row` padding rule removed.
import { expectedDrawing } from "../icons-expected.ts";
import { image, size, systemColours } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Bounds, Box, Driver, Palette } from "./driver.ts";

/** A scenario of the convention and whether its page links `base.css`. */
export interface SlotScenario extends Scenario {
  readonly base: boolean;
}

/** The icon size at the default root font size (`--ocelle-icon-size`, 1.25rem) and at the 2rem override. */
const icon = 20;
const big = 32;
/** The convention's gap, `--ocelle-space-2` (0.5rem). */
const gap = 8;
/** The test host's inner button's border width. */
const border = 1;
/** One layout unit. */
const unit = 1 / 64;

/** A value to a tenth of a pixel, without a negative zero. */
const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;

const noLine: Bounds = { x: 0, y: 0, width: 0, height: 0 };

/** One test host in its own block, with a light-DOM label `<span id="<id>-label">` and `content` after it. */
function host(id: string, content: string, label = "Open project", attributes = ""): string {
  const text = label === "" ? "" : `<span id="${id}-label">${label}</span>`;
  return `<div><ocelle-test-host id="${id}"${attributes}>${text}${content}</ocelle-test-host></div>`;
}

const folder = (id: string, slot = "icon"): string => `<ocelle-icon id="${id}" slot="${slot}" name="folder"></ocelle-icon>`;
const arrow = (id: string): string => `<ocelle-icon id="${id}" slot="trailing" name="arrow-end"></ocelle-icon>`;
/** A bare slotted SVG whose drawing uses `currentColor`; `extra` holds its other attributes. */
const bare = (id: string, slot: string, extra = ' viewBox="0 0 24 24"'): string =>
  `<svg id="${id}" slot="${slot}"${extra}><path id="${id}-path" d="M5 12h14" fill="none" stroke="currentColor"></path></svg>`;

function inside(box: Box, outer: Box): boolean {
  return box.x >= outer.x - unit && box.y >= outer.y - unit && box.x + box.width <= outer.x + outer.width + unit && box.y + box.height <= outer.y + outer.height + unit;
}

function centred(box: Box, line: Bounds): boolean {
  return Math.abs(box.y + box.height / 2 - (line.y + line.height / 2)) <= 0.5;
}

/**
 * The slotted icon `iconId` of the host `hostId` against its label's lines and its inner button. `lines` are the
 * label text's client rects, one per line, and `text` the first of them (where the text starts and ends inline);
 * `first` is the label's first line box, the top of the test host's label element and one line's share of its height.
 * The text rect is not the line box: Chromium rounds the half-leading above and below the text unevenly (measured: a
 * 14 px text box 1 px below the top of a 17.4 px line box), so the line box is read from the label element.
 */
async function measure(driver: Driver, hostId: string, iconId: string): Promise<{ box: Box; button: Box; lines: Bounds[]; text: Bounds; first: Bounds }> {
  const box = await driver.box(iconId);
  const button = await driver.box(hostId, "button");
  const label = await driver.box(hostId, ".label");
  const lines = await driver.lines(`${hostId}-label`);
  const first = { x: label.x, y: label.y, width: label.width, height: lines.length === 0 ? 0 : label.height / lines.length };
  return { box, button, lines, text: lines[0] ?? noLine, first };
}

/** On one line: size, the side of the label it is on, the gap to the label, centring and containment. */
async function oneLine(driver: Driver, hostId: string, iconId: string): Promise<unknown> {
  const { box, button, lines, text, first } = await measure(driver, hostId, iconId);
  const left = box.x < text.x;
  return {
    size: [box.width, box.height],
    side: left ? "left" : "right",
    gap: tenth(left ? text.x - (box.x + box.width) : box.x - (text.x + text.width)),
    lines: lines.length,
    centred: centred(box, first),
    inside: inside(box, button),
  };
}

/** With the label wrapped: size, the number of lines, centring on the first and containment. */
async function wrapped(driver: Driver, hostId: string, iconId: string): Promise<unknown> {
  const { box, button, lines, first } = await measure(driver, hostId, iconId);
  return { size: [box.width, box.height], lines: lines.length, centred: centred(box, first), inside: inside(box, button) };
}

/**
 * The two text colours US3-4 sets on the test host, as `getComputedStyle` reports them. Plain colours, not tokens: the
 * page with base.css follows the system colour scheme (its `color-scheme` comes from the tokens), which differs
 * between the two harnesses, and the scenario is about following the control's colour, whatever it is.
 */
const first = "rgb(21, 19, 15)";
const second = "rgb(0, 82, 204)";

/** The four type and size cases of US3-1 and US3-10 (research.md R-10), set on the test host. */
const typeCases = [
  { name: "body type (md, normal)", fontSize: "var(--ocelle-font-size-md)", lineHeight: "var(--ocelle-line-height-normal)", iconSize: undefined, side: icon },
  { name: "the smallest size (xs, normal)", fontSize: "var(--ocelle-font-size-xs)", lineHeight: "var(--ocelle-line-height-normal)", iconSize: undefined, side: icon },
  { name: "the tightest leading (sm, tight)", fontSize: "var(--ocelle-font-size-sm)", lineHeight: "var(--ocelle-line-height-tight)", iconSize: undefined, side: icon },
  { name: "--ocelle-icon-size: 2rem on the host (md, normal)", fontSize: "var(--ocelle-font-size-md)", lineHeight: "var(--ocelle-line-height-normal)", iconSize: "2rem", side: big },
] as const;

type TypeCase = (typeof typeCases)[number];

async function setType(driver: Driver, hostId: string, type: TypeCase): Promise<void> {
  await driver.style(hostId, "font-size", type.fontSize);
  await driver.style(hostId, "line-height", type.lineHeight);
  if (type.iconSize !== undefined) await driver.style(hostId, "--ocelle-icon-size", type.iconSize);
}

/** A host whose label wraps at every opportunity: its own inline size is zero, so the row takes its min-content. */
async function narrow(driver: Driver, hostId: string): Promise<void> {
  await driver.style(hostId, "inline-size", "0");
}

/** The unignored nodes of a control's accessibility subtree that carry a name or text: buttons, images, text. */
async function control(driver: Driver, id: string): Promise<unknown> {
  return (await driver.axSubtree(id)).filter((node) => ["button", "image", "img", "StaticText"].includes(node.role));
}

/** US3-8 in one palette: the label, the slotted `ocelle-icon` and the slotted bare SVG of an enabled and a disabled host. */
async function forced(driver: Driver, palette: Palette): Promise<unknown> {
  await driver.forcedColors("active", palette);
  const observed: Record<string, unknown> = {};
  for (const id of ["enabled", "disabled"]) {
    const paints = await driver.paints(`${id}-icon`);
    const svg = await driver.box(`${id}-svg`);
    observed[id] = {
      label: await driver.computed(`${id}-label`, "color"),
      icon: [...new Set(paints.map((paint) => paint.stroke))],
      svg: await driver.computed(`${id}-svg-path`, "stroke"),
      sizes: [size(await driver.box(`${id}-icon`)).width, svg.width, svg.height],
    };
  }
  await driver.forcedColors("none");
  return observed;
}

function forcedExpected(palette: Palette): unknown {
  const enabled = systemColours[palette].ButtonText;
  const disabled = systemColours[palette].GrayText;
  return {
    enabled: { label: enabled, icon: [enabled], svg: enabled, sizes: [icon, icon, icon] },
    disabled: { label: disabled, icon: [disabled], svg: disabled, sizes: [icon, icon, icon] },
  };
}

/** The scenarios of one page kind; `both()` runs them without and with `base.css`. */
function scenarios(base: boolean): SlotScenario[] {
  const page = base ? "with base.css" : "without base.css";
  const mount = (driver: Driver, markup: string): Promise<void> => driver.mount(markup, { base });
  const list: Omit<SlotScenario, "base">[] = [
    ...typeCases.map((type) => ({
      name: `US3-1, ${page}, ${type.name}: the icon slot's icon is the icon size, before the label with the gap, centred on the label's first line single and wrapped, inside the button's border box, not shrunk when the host is narrow (FR-020, FR-021)`,
      run: async (driver: Driver) => {
        await mount(driver, host("single", folder("single-icon")) + host("wrapped", folder("wrapped-icon")));
        await setType(driver, "single", type);
        await setType(driver, "wrapped", type);
        await narrow(driver, "wrapped");
        return { single: await oneLine(driver, "single", "single-icon"), wrapped: await wrapped(driver, "wrapped", "wrapped-icon") };
      },
      expected: {
        single: { size: [type.side, type.side], side: "left", gap, lines: 1, centred: true, inside: true },
        wrapped: { size: [type.side, type.side], lines: 2, centred: true, inside: true },
      },
    })),
    {
      name: `US3-1, ${page}, right to left: the icon slot's icon sits before the label in the inline direction, to its right, with the gap, centred (FR-020, FR-021)`,
      run: async (driver) => {
        await mount(driver, host("single", folder("single-icon")));
        await setType(driver, "single", typeCases[0]);
        await driver.dir("single", "rtl");
        return await oneLine(driver, "single", "single-icon");
      },
      expected: { size: [icon, icon], side: "right", gap, lines: 1, centred: true, inside: true },
    },
    {
      name: `US3-2, ${page}: a bare svg with a square viewBox, without and with width and height of 100, is the icon size and its drawing fills the box (FR-021, FR-022)`,
      run: async (driver) => {
        await mount(driver, host("plain", bare("plain-svg", "icon")) + host("sized", bare("sized-svg", "icon", ' viewBox="0 0 24 24" width="100" height="100"')));
        const observe = async (id: string): Promise<unknown> => {
          const box = await driver.box(id);
          return { size: [box.width, box.height], placement: await driver.ownPlacement(id) };
        };
        return { plain: await observe("plain-svg"), sized: await observe("sized-svg") };
      },
      expected: {
        plain: { size: [icon, icon], placement: { scaleX: 0.833, scaleY: 0.833, offsetX: 0, offsetY: 0 } },
        sized: { size: [icon, icon], placement: { scaleX: 0.833, scaleY: 0.833, offsetX: 0, offsetY: 0 } },
      },
    },
    {
      name: `US3-3, ${page}: a bare svg with a 24 × 16 viewBox is the icon size, its drawing scaled to the width and centred; one without viewBox or size gets the icon-size box (FR-022)`,
      run: async (driver) => {
        await mount(driver, host("wide", bare("wide-svg", "icon", ' viewBox="0 0 24 16"')) + host("none", bare("none-svg", "icon", "")));
        const wide = await driver.box("wide-svg");
        const none = await driver.box("none-svg");
        return { wide: { size: [wide.width, wide.height], placement: await driver.ownPlacement("wide-svg") }, none: [none.width, none.height] };
      },
      expected: { wide: { size: [icon, icon], placement: { scaleX: 0.833, scaleY: 0.833, offsetX: 0, offsetY: 3.333 } }, none: [icon, icon] },
    },
    {
      name: `US3-4, ${page}: a slotted ocelle-icon and a bare svg drawn in currentColor, both the icon size, take the control's text colour as it changes (FR-021)`,
      run: async (driver) => {
        await mount(driver, host("host", folder("host-icon") + bare("host-svg", "trailing")));
        const observe = async (): Promise<unknown> => ({
          icon: [...new Set((await driver.paints("host-icon")).map((paint) => paint.stroke))],
          svg: await driver.computed("host-svg-path", "stroke"),
        });
        await driver.style("host", "color", first);
        const before = await observe();
        await driver.style("host", "color", second);
        const after = await observe();
        const iconBox = await driver.box("host-icon");
        const svgBox = await driver.box("host-svg");
        return { before, after, sizes: [iconBox.width, iconBox.height, svgBox.width, svgBox.height] };
      },
      expected: {
        before: { icon: [first], svg: first },
        after: { icon: [second], svg: second },
        sizes: [icon, icon, icon, icon],
      },
    },
    {
      name: `US3-5, ${page}: with nothing in the icon slot the label starts at the button's content edge, with no gap or empty box, while a filled slot puts it one icon size plus the gap from that edge (FR-021)`,
      run: async (driver) => {
        await mount(driver, host("empty", "") + host("filled", folder("filled-icon")));
        const start = async (id: string): Promise<number> => {
          const button = await driver.box(id, "button");
          const [first] = await driver.lines(`${id}-label`);
          return tenth((first ?? noLine).x - (button.x + border));
        };
        return { empty: await start("empty"), filled: await start("filled") };
      },
      expected: { empty: 0, filled: icon + gap },
    },
    {
      name: `US3-6, ${page}: an icon-only control named Close by its inner button has exactly that name, and its slotted icon, drawn at the icon size, adds no node and no name, while a labelled standalone twin is one image node (FR-013, FR-023)`,
      run: async (driver) => {
        await mount(driver, host("host", '<ocelle-icon id="close-icon" slot="icon" name="close"></ocelle-icon>', "", ' label="Close"') + '<p><ocelle-icon id="twin" name="close" label="Close"></ocelle-icon></p>');
        const box = await driver.box("close-icon");
        return { control: await control(driver, "host"), icon: await driver.ax("close-icon"), twin: await driver.ax("twin"), drawing: await driver.drawing("close-icon"), size: [box.width, box.height] };
      },
      expected: { control: [{ role: "button", name: "Close" }], icon: [], twin: image("Close"), drawing: expectedDrawing("close"), size: [icon, icon] },
    },
    ...(["light", "dark"] as const).map((palette) => ({
      name: `US3-8, ${page}, forced colours with the ${palette} palette: a slotted ocelle-icon and a bare svg, both the icon size, are painted in the label's system colour, ButtonText enabled and GrayText disabled (FR-015, FR-021)`,
      run: async (driver: Driver) => {
        await mount(
          driver,
          host("enabled", folder("enabled-icon") + bare("enabled-svg", "trailing")) + host("disabled", folder("disabled-icon") + bare("disabled-svg", "trailing"), "Open project", " disabled"),
        );
        return await forced(driver, palette);
      },
      expected: forcedExpected(palette),
    })),
    {
      name: `US3-9, ${page}: under the page rules ocelle-icon and svg { inline-size: 32px } the slotted ocelle-icon and svg stay 20 × 20 while the standalone icon is 32 × 20 and the standalone svg 32 wide; --ocelle-icon-size: 2rem on the hosts makes both slotted boxes 32 × 32, inside the button (FR-011, FR-021, FR-022)`,
      run: async (driver) => {
        await mount(
          driver,
          host("a", folder("a-icon")) + host("b", bare("b-svg", "icon")) + '<p><ocelle-icon id="alone" name="folder"></ocelle-icon></p><p><svg id="alone-svg" viewBox="0 0 24 24"></svg></p>',
        );
        await driver.rules("ocelle-icon { inline-size: 32px; } svg { inline-size: 32px; }");
        const sizes = async (): Promise<unknown> => {
          const [a, b] = [await driver.box("a-icon"), await driver.box("b-svg")];
          return { slotted: [a.width, a.height, b.width, b.height], inside: inside(a, await driver.box("a", "button")) && inside(b, await driver.box("b", "button")) };
        };
        const hostRule = await sizes();
        const alone = await driver.box("alone");
        const aloneSvg = await driver.box("alone-svg");
        await driver.style("a", "--ocelle-icon-size", "2rem");
        await driver.style("b", "--ocelle-icon-size", "2rem");
        return { hostRule, alone: [alone.width, alone.height], aloneSvg: aloneSvg.width, token: await sizes() };
      },
      expected: {
        hostRule: { slotted: [icon, icon, icon, icon], inside: true },
        alone: [big, icon],
        aloneSvg: big,
        token: { slotted: [big, big, big, big], inside: true },
      },
    },
    {
      name: `US3-9, ${page}: --ocelle-icon-size: 2rem set by a page rule on a slotted ocelle-icon and on a slotted svg itself leaves both 20 × 20 inside the button, while the standalone icon under the same rule is 32 × 32 (FR-022)`,
      run: async (driver) => {
        await mount(driver, host("a", folder("a-icon")) + host("b", '<svg id="b-svg" slot="icon" class="big" viewBox="0 0 24 24"></svg>') + '<p><ocelle-icon id="alone" name="folder"></ocelle-icon></p>');
        await driver.rules("ocelle-icon { --ocelle-icon-size: 2rem; } .big { --ocelle-icon-size: 2rem; }");
        const [a, b, alone] = [await driver.box("a-icon"), await driver.box("b-svg"), await driver.box("alone")];
        return {
          slotted: [a.width, a.height, b.width, b.height],
          inside: inside(a, await driver.box("a", "button")) && inside(b, await driver.box("b", "button")),
          alone: [alone.width, alone.height],
        };
      },
      expected: { slotted: [icon, icon, icon, icon], inside: true, alone: [big, big] },
    },
    ...typeCases.map((type) => ({
      name: `US3-10, ${page}, ${type.name}: the trailing slot's icon is the icon size, after the label with the gap, centred on the label's first line single and wrapped, inside the button's border box (FR-020, FR-021)`,
      run: async (driver: Driver) => {
        await mount(driver, host("single", arrow("single-icon")) + host("wrapped", arrow("wrapped-icon")));
        await setType(driver, "single", type);
        await setType(driver, "wrapped", type);
        await narrow(driver, "wrapped");
        return { single: await oneLine(driver, "single", "single-icon"), wrapped: await wrapped(driver, "wrapped", "wrapped-icon") };
      },
      expected: {
        single: { size: [type.side, type.side], side: "right", gap, lines: 1, centred: true, inside: true },
        wrapped: { size: [type.side, type.side], lines: 2, centred: true, inside: true },
      },
    })),
    {
      name: `US3-10, ${page}: with nothing in the trailing slot the label ends at the button's content edge while a filled slot adds the gap and the icon after it; right to left the trailing icon sits to the label's left; a bare svg of 100 × 100 in the trailing slot is the icon size (FR-020, FR-021, FR-022)`,
      run: async (driver) => {
        await mount(driver, host("empty", "") + host("filled", arrow("filled-icon")) + host("rtl", arrow("rtl-icon"), "Open project", ' dir="rtl"') + host("svg", bare("svg-svg", "trailing", ' viewBox="0 0 24 24" width="100" height="100"')));
        await setType(driver, "rtl", typeCases[0]);
        const end = async (id: string): Promise<number> => {
          const button = await driver.box(id, "button");
          const [first] = await driver.lines(`${id}-label`);
          const line = first ?? noLine;
          return tenth(button.x + button.width - border - (line.x + line.width));
        };
        const svg = await driver.box("svg-svg");
        return { empty: await end("empty"), filled: await end("filled"), rtl: await oneLine(driver, "rtl", "rtl-icon"), svg: [svg.width, svg.height] };
      },
      expected: {
        empty: 0,
        filled: gap + icon,
        rtl: { size: [icon, icon], side: "left", gap, lines: 1, centred: true, inside: true },
        svg: [icon, icon],
      },
    },
    {
      name: `US3-11, ${page}: a control named by its visible label keeps exactly "Open project" as its name and holds no other text, while both slotted icons draw at the icon size, before and after the label with the gap (FR-021, FR-023)`,
      run: async (driver) => {
        await mount(driver, host("host", '<ocelle-icon id="lead" slot="icon" name="folder"></ocelle-icon><ocelle-icon id="trail" slot="trailing" name="arrow-end"></ocelle-icon>'));
        const [lead, trail] = [await driver.box("lead"), await driver.box("trail")];
        const [first] = await driver.lines("host-label");
        const line = first ?? noLine;
        return {
          control: await control(driver, "host"),
          drawings: [await driver.drawing("lead"), await driver.drawing("trail")],
          sizes: [lead.width, lead.height, trail.width, trail.height],
          gaps: [tenth(line.x - (lead.x + lead.width)), tenth(trail.x - (line.x + line.width))],
        };
      },
      expected: {
        control: [
          { role: "button", name: "Open project" },
          { role: "StaticText", name: "Open project" },
        ],
        drawings: [expectedDrawing("folder"), expectedDrawing("arrow-end")],
        sizes: [icon, icon, icon, icon],
        gaps: [gap, gap],
      },
    },
  ];
  return list.map((scenario) => ({ ...scenario, base }));
}

/** User Story 3's scenarios, each without and then with `base.css`. */
export const slotScenarios: readonly SlotScenario[] = [...scenarios(false), ...scenarios(true)];
