// The shared bodies of User Story 3's browser scenarios, the static `ocelle-pill-tag` and the badge (018 spec US3-1 to
// US3-8, FR-025 to FR-029; research.md R-06; data-model.md § `ocelle-pill-tag`; plan decisions 5 and 15, 15 as amended
// at the phase-1 recheck, operator decision Q2 (a); contracts/checks.md § US3 bodies and § Edge cases; tasks.md T035).
// Each body observes the page through the driver and returns one observation; each harness asserts it equals
// `expected`, written by hand from the spec, the data model, research and the phase-1 spike:
// - colours, sizes and families from the token table of packages/tokens/test/expected.ts, never from the element
//   source: `color-<status>-bg` and `color-<status>` per status and theme, `border-width`, `radius-pill`, `figures`,
//   `font-sans`; the default density `font-size-sm` × `line-height-tight` and padding `space-1` / `space-3`, the compact
//   density `font-size-xs` × `line-height-snug` (1.2) and padding exactly `space-1` / `space-2` (plan decision 5); each
//   density's height is its line height plus twice `space-1` and twice `border-width` (the icon is one line tall, so
//   the height is the same with an icon);
// - the icon-only static pill's box (its row `bare`) as the phase-1 spike measured it on the slot convention as merged
//   (reviews/phase-1/spikes.md § R-06, R-07, written by hand): its top −7.09 px from the surrounding text's top and
//   29.19 × 50.09 px (compact −7.39 px, 27.78 × 40.39 px), in a paragraph and in a flex row. The spike's bottom offset
//   (+4.09 px, compact +5.39 px) is the top, the height and the surrounding text's box together, and that box is the
//   font's: the in-process page loads no font file (test/in-process.ts), where the text box of the fallback family is
//   1 px shorter at 14 px, so the body pins the top and the size, which both harnesses read as the spike did.
//
// Static only (analysis finding I2): phase 4 builds no interactive mode, so each positive is a static pill or a plain
// element twin; the interactive twins of the static click, static focus and seven names bodies are user story 4's.
// Every body mounts with base.css (the fixture's `pill-tag.html` links it), so the dark theme has its dark ground; SC-001's
// pill rows in scenarios/consumers.ts render without it. Geometry is compared with twins on the same page: "one line"
// is the text box of the same text with room to spare; "broken" is a box at least twice as tall.
//
// Every "does not" outcome shares its body with the positive it guards, and its plant is named (contracts/checks.md
// § US3 bodies):
// - a static click is not prevented or stopped, beside a plain `<span>` twin (plant: a click guard on the static host);
// - a click on a static pill focuses its focusable ancestor, beside a `<span>` twin, and the pill's shadow root holds no
//   focus (plant: `delegatesFocus`);
// - in a narrow flex row a one-word pill is not shrunk below its word, beside a host with `min-inline-size: 0` that is,
//   and long words that break inside the pill (plants: `overflow-wrap: anywhere`; `min-inline-size: 0` on the static
//   host or `.pill`; the static host `inline-grid`; the `.icon-row` cap removed; `box-sizing: border-box` removed);
// - a stretched host does not stretch the visible pill, beside its block twin (plant: `inline-size: fit-content`
//   removed);
// - a one-line pill is on the surrounding baseline and nothing in its row moves, beside an icon-only pill pinned where
//   the spike measured it (plants: the text wrapper without the `label` class; `bare` on every row; `bare` never set;
//   `.icon-row { align-items: baseline }` in the pill's own styles);
// - the seven passthrough names stay on a static host with no mirror, as set and as changed (plant: the names handed to
//   012's `MovedAttributes.handle()` while static);
// - a long text wraps and is never truncated, beside its one-line twin; no ellipsis;
// - an icon adds nothing to the accessibility tree, beside the same pill without one;
// - an unknown `status`, `variant` or `density` gives the default look, beside the default twin, and stays as written;
// - `label` and `disabled` change nothing on a static pill, beside the same pill without them;
// - an empty pill renders without error, its row `bare`, beside a pill whose text arrives later and drops it;
// - a host `hidden` removes the pill's box, beside a visible twin (plant: `:host([hidden])` removed).
import { expectedTokens } from "../../../tokens/test/expected.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, EventRecord, Palette, TextBox } from "./driver.ts";

/** A token's used value as the token table writes it for its probe. */
function used(name: string): string {
  const entry = expectedTokens.find((each) => each.name === name);
  if (entry === undefined || typeof entry.compare !== "object" || typeof entry.compare.used !== "string") throw new Error(`no used text for ${name}`);
  return entry.compare.used;
}

/** A token's declared value, single-valued, as a number (its unit dropped). */
function declared(name: string): number {
  const entry = expectedTokens.find((each) => each.name === name);
  if (entry === undefined || typeof entry.declared !== "string") throw new Error(`no single declared value for ${name}`);
  return Number.parseFloat(entry.declared);
}

/** A `rem` token in px at the 16 px root. */
const rem = (name: string): number => declared(name) * 16;

/** The five values of the status vocabulary, in its order (018 spec Terms). */
export const pillStatuses = ["info", "success", "warning", "danger", "neutral"] as const;
const variants = ["pill", "badge"] as const;
const densities = ["default", "compact"] as const;
type Density = (typeof densities)[number];

const borderWidth = declared("border-width");
const radius = `${String(declared("radius-pill"))}px`;
const space1 = rem("space-1");
const space2 = rem("space-2");
const space3 = rem("space-3");

/** Each density's type and padding, from the token table (plan decision 5). */
const sizes: Record<Density, { readonly fontSize: number; readonly lineHeight: number; readonly block: number; readonly inline: number }> = {
  default: { fontSize: rem("font-size-sm"), lineHeight: rem("font-size-sm") * declared("line-height-tight"), block: space1, inline: space3 },
  compact: { fontSize: rem("font-size-xs"), lineHeight: rem("font-size-xs") * declared("line-height-snug"), block: space1, inline: space2 },
};

const hundredth = (number: number): number => Math.round(number * 100) / 100 + 0;
const px = (number: number): string => `${String(hundredth(number))}px`;

/** A density's pill height: one line, twice the block padding and twice the border. */
const height = (density: Density): number => sizes[density].lineHeight + 2 * sizes[density].block + 2 * borderWidth;

/** The icon-only static pill's box against the surrounding text, as the phase-1 spike measured it (written by hand). */
const iconOnly: Record<Density, { readonly top: number; readonly height: number; readonly width: number }> = {
  default: { top: -7.09, height: 29.19, width: 50.09 },
  compact: { top: -7.39, height: 27.78, width: 40.39 },
};

const pillPart = '[part="pill"]';
const icon = '<ocelle-icon slot="icon" name="folder"></ocelle-icon>';

/** Mounts `markup` on a page with base.css, as a host page links it (the body's ground and colour scheme per theme). */
function mount(driver: Driver, markup: string): Promise<void> {
  return driver.mount(markup, { base: true });
}

/** The pill's attributes for a variant and a density (the defaults written as no attribute). */
function attributes(variant: string, density: string): string {
  return `${variant === "pill" ? "" : ` variant="${variant}"`}${density === "default" ? "" : ` density="${density}"`}`;
}

/** The computed record of the `.pill` box of `id`. */
async function pillStyle(driver: Driver, id: string, properties: readonly string[]): Promise<Record<string, string> | string> {
  const [style] = await driver.styles(id, pillPart, properties);
  return style ?? "no pill part";
}

/** The pill's accessibility subtree, each node as its role and name. */
async function tree(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).map((node) => `${node.role} ${node.name}`.trim());
}

/** The first text box under `id` whose text is not blank. */
async function textOf(driver: Driver, id: string): Promise<TextBox | undefined> {
  return (await driver.textBoxes(id))[0];
}

/** Whether `inner` lies inside `outer` in both axes, to the half pixel. */
function within(inner: { readonly x: number; readonly y: number; readonly width: number; readonly height: number } | undefined, outer: Box): boolean {
  return inner !== undefined && inner.x >= outer.x - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5 && inner.y >= outer.y - 0.5 && inner.y + inner.height <= outer.y + outer.height + 0.5;
}

/** Whether `inner` lies inside `outer` in the inline axis, to the half pixel. */
function inlineWithin(inner: { readonly x: number; readonly width: number } | undefined, outer: { readonly x: number; readonly width: number }): boolean {
  return inner !== undefined && inner.x >= outer.x - 0.5 && inner.x + inner.width <= outer.x + outer.width + 0.5;
}

/** Whether `text` has the box of `twin` (one line, unbroken): the same width and height to the half pixel. */
function sameLine(text: TextBox | undefined, twin: TextBox | undefined): boolean {
  return text !== undefined && twin !== undefined && Math.abs(text.box.width - twin.box.width) <= 0.5 && Math.abs(text.box.height - twin.box.height) <= 0.5;
}

/** Whether `text` is broken over two lines or more, against its one-line `twin`. */
function broken(text: TextBox | undefined, twin: TextBox | undefined): boolean {
  return text !== undefined && twin !== undefined && text.box.height >= 2 * twin.box.height - 0.5;
}

/** Whether two boxes have the same size, to the half pixel. */
function sameSize(box: Box, twin: Box): boolean {
  return Math.abs(box.width - twin.width) <= 0.5 && Math.abs(box.height - twin.height) <= 0.5;
}

/** A 34-letter word, with no break opportunity. */
const longWord = "Supercalifragilisticexpialidocious";
/** The long name beside the pill in US3-8's flex row. */
const longName = "Refactor the mission scheduler pipeline";
/** A text that wraps in a narrow container. */
const longText = "Blocked by the review of the scheduler";

/** The type of the text around a pill of `density`: its font size and family, so baselines compare text with text. */
function surrounding(density: Density): string {
  return `font-family: var(--ocelle-font-sans); font-size: var(${density === "default" ? "--ocelle-font-size-sm" : "--ocelle-font-size-xs"});`;
}

/** The static shadow root's elements, in tree order: the `.pill` box, the row, the icon wrapper and slot, the label wrapper and slot. */
const staticRoot = ["span", "span", "span", "slot", "span", "slot"];

/** The local names of the elements in the shadow root of `id`: an upgraded static pill's are `staticRoot`. */
async function rendered(driver: Driver, id: string): Promise<string[]> {
  return (await driver.elements(id)).map((part) => part.name);
}

/** The records of a click summarised: each listener's place and whether the click was prevented there. */
function clicks(records: readonly EventRecord[]): string[] {
  return records.filter((record) => record.type === "click").map((record) => `${record.at} ${record.defaultPrevented ? "prevented" : "not prevented"}`);
}

/** The seven passthrough names of FR-030, which a static pill leaves on its host. */
const passthrough = ["aria-label", "aria-labelledby", "aria-describedby", "aria-controls", "aria-current", "aria-pressed", "title"] as const;

/** A value for each passthrough name, first as set and then as changed. */
const passthroughValues: Record<(typeof passthrough)[number], readonly [string, string]> = {
  "aria-label": ["Blocked state", "Blocked since Monday"],
  "aria-labelledby": ["note", "other-note"],
  "aria-describedby": ["note", "other-note"],
  "aria-controls": ["panel", "other-panel"],
  "aria-current": ["page", "true"],
  "aria-pressed": ["true", "false"],
  title: ["Blocked since Monday", "Blocked since Tuesday"],
};

/** Host rules that mark the pill's custom states, read back through the host's computed style. */
const stateRules = "ocelle-pill-tag:state(pressed) { text-decoration-line: underline; } ocelle-pill-tag:state(current) { font-style: italic; }";

export const pillScenarios: readonly Scenario[] = [
  ...(["light", "dark"] as const).map(
    (theme: Palette): Scenario => ({
      name: `US3-1: in ${theme}, <ocelle-pill-tag>Draft</ocelle-pill-tag> shows "Draft" on --ocelle-color-neutral-bg in --ocelle-color-neutral with --ocelle-radius-pill corners, in Schibsted Grotesk; it is not focusable, has no role of its own and exposes its text as plain text; the property reads status neutral, variant pill, density default (FR-025, FR-027, FR-028)`,
      run: async (driver) => {
        await mount(driver, '<button id="before">Before</button><ocelle-pill-tag id="p">Draft</ocelle-pill-tag><button id="after">After</button>');
        await driver.theme(theme);
        const text = await textOf(driver, "p");
        return {
          look: await pillStyle(driver, "p", ["background-color", "color", "border-top-left-radius", "border-bottom-right-radius", "font-family"]),
          shown: { text: text?.text, drawn: text !== undefined && text.box.width > 0 && text.box.height > 0, inside: within(text?.box, await driver.box("p", pillPart)) },
          tree: await tree(driver, "p"),
          node: await driver.axState("p"),
          tabs: await driver.tabOrder(),
          properties: { status: await driver.property("p", "status"), variant: await driver.property("p", "variant"), density: await driver.property("p", "density") },
          messages: await driver.messages(),
        };
      },
      expected: {
        look: { "background-color": tokenColour("color-neutral-bg", theme), color: tokenColour("color-neutral", theme), "border-top-left-radius": radius, "border-bottom-right-radius": radius, "font-family": used("font-sans") },
        shown: { text: "Draft", drawn: true, inside: true },
        tree: ["generic", "StaticText Draft"],
        node: { role: "generic", name: "", description: "", disabled: false, expanded: null, pressed: null, hasPopup: null, busy: false, focusable: false, controls: [] },
        tabs: [["button#before"], ["button#after"]],
        properties: { status: "neutral", variant: "pill", density: "default" },
        messages: [],
      },
    }),
  ),
  {
    name: "US3-1: the static shadow root is the .pill box (part pill) holding the slot convention's row, the icon wrapper with the icon slot and the label wrapper with the default slot; no inner control (R-06, FR-026)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag>');
      return (await driver.elements("p")).map((part) => ({ name: part.name, part: part.attributes.part ?? null, class: part.attributes.class ?? null, slot: part.attributes.name ?? null }));
    },
    expected: [
      { name: "span", part: "pill", class: "pill status-warning variant-pill density-default", slot: null },
      { name: "span", part: null, class: "icon-row", slot: null },
      { name: "span", part: null, class: "icon-slot", slot: null },
      { name: "slot", part: null, class: null, slot: "icon" },
      { name: "span", part: null, class: "label", slot: null },
      { name: "slot", part: null, class: null, slot: null },
    ],
  },
  ...(["light", "dark"] as const).map(
    (theme: Palette): Scenario => ({
      name: `US3-2: in ${theme}, each status of the vocabulary fills the pill with --ocelle-color-<status>-bg and sets its text in --ocelle-color-<status> (FR-002, FR-028)`,
      run: async (driver) => {
        await mount(driver, pillStatuses.map((status) => `<ocelle-pill-tag id="s-${status}" status="${status}">${status}</ocelle-pill-tag>`).join(" "));
        await driver.theme(theme);
        const looks: Record<string, unknown> = {};
        for (const status of pillStatuses) looks[status] = await pillStyle(driver, `s-${status}`, ["background-color", "color"]);
        return looks;
      },
      expected: Object.fromEntries(pillStatuses.map((status) => [status, { "background-color": tokenColour(`color-${status}-bg`, theme), color: tokenColour(`color-${status}`, theme) }])),
    }),
  ),
  ...(["light", "dark"] as const).map(
    (theme: Palette): Scenario => ({
      name: `US3-3: in ${theme}, variant="badge" has a --ocelle-border-width border in --ocelle-color-<status>, no fill (the page ground shows through), --ocelle-radius-pill corners and its text in --ocelle-color-<status>, in Schibsted Grotesk with tabular figures and no monospace family, for each status (FR-028)`,
      run: async (driver) => {
        await mount(driver, pillStatuses.map((status) => `<ocelle-pill-tag id="b-${status}" variant="badge" status="${status}">12</ocelle-pill-tag>`).join(" "));
        await driver.theme(theme);
        const looks: Record<string, unknown> = {};
        for (const status of pillStatuses) {
          const look = await pillStyle(driver, `b-${status}`, ["border-top-width", "border-top-style", "border-top-color", "border-inline-end-color", "background-color", "color", "border-top-left-radius", "font-variant-numeric", "font-family"]);
          looks[status] = { look, monospace: typeof look === "string" || /mono/i.test(look["font-family"] ?? "") };
        }
        return { looks, variant: await driver.property("b-info", "variant") };
      },
      expected: {
        looks: Object.fromEntries(
          pillStatuses.map((status) => [
            status,
            {
              look: {
                "border-top-width": `${String(borderWidth)}px`,
                "border-top-style": "solid",
                "border-top-color": tokenColour(`color-${status}`, theme),
                "border-inline-end-color": tokenColour(`color-${status}`, theme),
                "background-color": "rgba(0, 0, 0, 0)",
                color: tokenColour(`color-${status}`, theme),
                "border-top-left-radius": radius,
                "font-variant-numeric": used("figures"),
                "font-family": used("font-sans"),
              },
              monospace: false,
            },
          ]),
        ),
        variant: "badge",
      },
    }),
  ),
  {
    name: "US3-3: a pill (not a badge) has a transparent border of --ocelle-border-width, so its box is the badge's size, and no tabular figures of its own (R-06)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" status="info">Draft</ocelle-pill-tag> <ocelle-pill-tag id="b" status="info" variant="badge">Draft</ocelle-pill-tag>');
      return { pill: await pillStyle(driver, "p", ["border-top-width", "border-top-color", "font-variant-numeric"]), sameBox: sameSize(await driver.box("p"), await driver.box("b")) };
    },
    expected: { pill: { "border-top-width": `${String(borderWidth)}px`, "border-top-color": "rgba(0, 0, 0, 0)", "font-variant-numeric": "normal" }, sameBox: true },
  },
  ...densities.map(
    (density): Scenario => ({
      name: `US3-4, ${density} density: a static pill's block padding is --ocelle-space-1, its inline padding ${density === "default" ? "--ocelle-space-3" : "--ocelle-space-2"}, its type ${density === "default" ? "--ocelle-font-size-sm at --ocelle-line-height-tight" : "--ocelle-font-size-xs at --ocelle-line-height-snug (1.2)"}; its height is one line plus the padding and the border, with and without an icon, in each variant (FR-029; plan decision 5)`,
      run: async (driver) => {
        const markup = variants.flatMap((variant) => [`<ocelle-pill-tag id="${variant}"${attributes(variant, density)}>Blocked</ocelle-pill-tag>`, `<ocelle-pill-tag id="${variant}-icon"${attributes(variant, density)}>${icon}Blocked</ocelle-pill-tag>`]).join(" ");
        await mount(driver, markup);
        const read = async (id: string): Promise<unknown> => ({
          style: await pillStyle(driver, id, ["padding-top", "padding-bottom", "padding-left", "padding-right", "padding-inline-start", "font-size", "line-height"]),
          height: Math.abs((await driver.box(id)).height - height(density)) <= 0.02,
        });
        const found: Record<string, unknown> = {};
        for (const id of ["pill", "pill-icon", "badge", "badge-icon"]) found[id] = await read(id);
        return { found, density: await driver.property("pill", "density") };
      },
      expected: {
        found: Object.fromEntries(
          ["pill", "pill-icon", "badge", "badge-icon"].map((id) => [
            id,
            {
              style: {
                "padding-top": px(sizes[density].block),
                "padding-bottom": px(sizes[density].block),
                "padding-left": px(sizes[density].inline),
                "padding-right": px(sizes[density].inline),
                "padding-inline-start": px(sizes[density].inline),
                "font-size": px(sizes[density].fontSize),
                "line-height": px(sizes[density].lineHeight),
              },
              height: true,
            },
          ]),
        ),
        density,
      },
    }),
  ),
  {
    name: "US3-5: a full text wider than its 120 px container wraps onto further lines inside the pill, every character visible and none clipped, with no ellipsis; its one-line twin with room is one line (FR-027)",
    run: async (driver) => {
      await mount(driver, `<div id="narrow"><ocelle-pill-tag id="w" status="warning">${longText}</ocelle-pill-tag></div><div id="wide"><ocelle-pill-tag id="t" status="warning">${longText}</ocelle-pill-tag></div>`);
      await driver.rules("#narrow { inline-size: 120px; } #wide { inline-size: 1000px; }");
      const text = await textOf(driver, "w");
      const twin = await textOf(driver, "t");
      const host = await driver.box("w");
      return {
        wrapped: broken(text, twin),
        twinOneLine: twin !== undefined && twin.box.height < 1.5 * sizes.default.lineHeight + 4,
        inside: within(text?.box, await driver.box("w", pillPart)),
        clipped: text?.clipped,
        hostWithin: host.width <= 120.5,
        label: (await driver.styles("w", ".label", ["text-overflow", "white-space", "overflow-x"]))[0],
      };
    },
    expected: { wrapped: true, twinOneLine: true, inside: true, clipped: false, hostWithin: true, label: { "text-overflow": "clip", "white-space": "normal", "overflow-x": "visible" } },
  },
  ...densities.map(
    (density): Scenario => ({
      name: `US3-6, ${density} density: an icon in the icon slot sits before the text, one line tall, and adds nothing to the accessibility tree, beside the same pill without an icon (FR-026)`,
      run: async (driver) => {
        await mount(driver, `<ocelle-pill-tag id="i"${attributes("pill", density)}>${icon}Blocked</ocelle-pill-tag> <ocelle-pill-tag id="n"${attributes("pill", density)}>Blocked</ocelle-pill-tag>`);
        const text = await textOf(driver, "i");
        const iconBox = await driver.box("i", ".icon-slot");
        return {
          before: text !== undefined && iconBox.x + iconBox.width <= text.box.x + 0.5,
          iconHeight: Math.abs(iconBox.height - sizes[density].lineHeight) <= 0.02,
          tree: await tree(driver, "i"),
          twinTree: await tree(driver, "n"),
          row: (await driver.elements("i")).find((part) => part.attributes.class?.startsWith("icon-row") === true)?.attributes.class,
        };
      },
      expected: { before: true, iconHeight: true, tree: ["generic", "StaticText Blocked"], twinTree: ["generic", "StaticText Blocked"], row: "icon-row" },
    }),
  ),
  {
    name: 'US3-7: title="Blocked since Monday" on a static pill stays on the host as written and is not moved or mirrored, and a later change stays there too (FR-027; the "has become static" half is US4-8)',
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" status="warning" title="Blocked since Monday">Blocked</ocelle-pill-tag>');
      const first = { title: await driver.attribute("p", "title"), mirror: await driver.attribute("p", "data-ocelle-moved-title") };
      await driver.setAttribute("p", "title", "Blocked since Tuesday");
      return { first, changed: { title: await driver.attribute("p", "title"), mirror: await driver.attribute("p", "data-ocelle-moved-title") }, inner: (await driver.elements("p")).map((part) => part.name) };
    },
    expected: {
      first: { title: "Blocked since Monday", mirror: null },
      changed: { title: "Blocked since Tuesday", mirror: null },
      inner: staticRoot,
    },
  },
  ...variants.flatMap((variant) =>
    densities.map(
      (density): Scenario => ({
        name: `US3-8, ${variant}, ${density}: in a 220 px flex row beside a long name "Blocked" stays on one line and the host is at least the word plus the padding and border; with min-inline-size: 0 the host is narrower than the word, which breaks inside the .pill box; a 34-letter word breaks inside the pill in a 100 px block and a 100 px grid track, the .pill box inside the host and the container; in a 150 px flex row after "Name" the long-word pill is capped at the row and overflows it by the sibling's width, and its min-inline-size: 0 twin fits (Edge Cases; PLAN-FRESH-2-002, -3-002, -3-005)`,
        run: async (driver) => {
          const at = attributes(variant, density);
          await mount(
            driver,
            `<div id="row" class="flex"><span>${longName}</span><ocelle-pill-tag id="p" status="warning"${at}>Blocked</ocelle-pill-tag></div>` +
              `<div id="row-zero" class="flex"><span>${longName}</span><ocelle-pill-tag id="zero" class="zero" status="warning"${at}>Blocked</ocelle-pill-tag></div>` +
              `<div id="wide"><ocelle-pill-tag id="ref" status="warning"${at}>Blocked</ocelle-pill-tag><ocelle-pill-tag id="long-ref" status="warning"${at}>${longWord}</ocelle-pill-tag></div>` +
              `<div id="block"><ocelle-pill-tag id="in-block" status="warning"${at}>${longWord}</ocelle-pill-tag></div>` +
              `<div id="grid"><ocelle-pill-tag id="in-grid" status="warning"${at}>${longWord}</ocelle-pill-tag></div>` +
              `<div id="capped" class="flex"><span id="name">Name</span><ocelle-pill-tag id="cap" status="warning"${at}>${longWord}</ocelle-pill-tag></div>` +
              `<div id="capped-zero" class="flex"><span>Name</span><ocelle-pill-tag id="cap-zero" class="zero" status="warning"${at}>${longWord}</ocelle-pill-tag></div>`,
          );
          await driver.rules(".flex { display: flex; } #row, #row-zero { inline-size: 220px; } #wide { inline-size: 1000px; } #block { inline-size: 100px; } #grid { display: grid; grid-template-columns: 100px; } #capped, #capped-zero { inline-size: 150px; } .zero { min-inline-size: 0; }");
          const reference = await textOf(driver, "ref");
          const longReference = await textOf(driver, "long-ref");
          const word = reference?.box.width ?? 0;
          const frame = 2 * sizes[density].inline + 2 * borderWidth;
          const host = await driver.box("p");
          const zero = await driver.box("zero");
          const zeroText = await textOf(driver, "zero");
          const container = async (id: string, inside: string): Promise<unknown> => {
            const outer = await driver.box(inside);
            const pillHost = await driver.box(id);
            const pill = await driver.box(id, pillPart);
            const text = await textOf(driver, id);
            return {
              broken: broken(text, longReference),
              textInPill: inlineWithin(text?.box, pill),
              hostInContainer: inlineWithin(pillHost, outer),
              pillInHost: inlineWithin(pill, pillHost) && pill.width <= pillHost.width + 0.5,
              pillInContainer: inlineWithin(pill, outer) && pill.width <= 100.5,
            };
          };
          const row = await driver.box("capped");
          const cap = await driver.box("cap");
          const capPill = await driver.box("cap", pillPart);
          const name = await driver.box("name");
          const capZero = await driver.box("cap-zero");
          const capZeroText = await textOf(driver, "cap-zero");
          return {
            flexRow: { oneLine: sameLine(await textOf(driver, "p"), reference), atLeastWord: host.width >= word + frame - 0.5 },
            minZero: { narrower: zero.width < word - 0.5, broken: broken(zeroText, reference), inside: inlineWithin(zeroText?.box, await driver.box("zero", pillPart)) },
            block: await container("in-block", "block"),
            grid: await container("in-grid", "grid"),
            beside: {
              capped: cap.width <= row.width + 0.5,
              pillInHost: inlineWithin(capPill, cap) && capPill.width <= cap.width + 0.5,
              overflowBySibling: Math.abs(cap.x + cap.width - (row.x + row.width) - name.width) <= 0.5,
            },
            besideZero: { fits: capZero.x + capZero.width <= row.x + row.width + 0.5, broken: broken(capZeroText, longReference), inside: inlineWithin(capZeroText?.box, await driver.box("cap-zero", pillPart)) },
          };
        },
        expected: {
          flexRow: { oneLine: true, atLeastWord: true },
          minZero: { narrower: true, broken: true, inside: true },
          block: { broken: true, textInPill: true, hostInContainer: true, pillInHost: true, pillInContainer: true },
          grid: { broken: true, textInPill: true, hostInContainer: true, pillInHost: true, pillInContainer: true },
          beside: { capped: true, pillInHost: true, overflowBySibling: true },
          besideZero: { fits: true, broken: true, inside: true },
        },
      }),
    ),
  ),
  ...variants.flatMap((variant) =>
    densities.map(
      (density): Scenario => ({
        name: `Stretched host, ${variant}, ${density}: "Blocked" in a 200 px grid track and in a 200 px flex column keeps the .pill box of the same pill in a block container, narrower than the track, on one line, while its host is stretched to 200 px (Edge Cases; PLAN-FRESH-3-002; plant: inline-size: fit-content removed)`,
        run: async (driver) => {
          const at = attributes(variant, density);
          await mount(
            driver,
            `<div id="block"><ocelle-pill-tag id="b" status="warning"${at}>Blocked</ocelle-pill-tag></div><div id="grid"><ocelle-pill-tag id="g" status="warning"${at}>Blocked</ocelle-pill-tag></div><div id="column"><ocelle-pill-tag id="c" status="warning"${at}>Blocked</ocelle-pill-tag></div>`,
          );
          await driver.rules("#grid { display: grid; grid-template-columns: 200px; } #column { display: flex; flex-direction: column; inline-size: 200px; }");
          const twin = await driver.box("b", pillPart);
          const twinText = await textOf(driver, "b");
          const read = async (id: string): Promise<unknown> => {
            const pill = await driver.box(id, pillPart);
            return {
              pillAsInBlock: sameSize(pill, twin),
              pillNarrower: pill.width > 0 && pill.width < 200 - 0.5,
              oneLine: sameLine(await textOf(driver, id), twinText),
              hostStretched: Math.abs((await driver.box(id)).width - 200) <= 0.5,
            };
          };
          return { grid: await read("g"), column: await read("c") };
        },
        expected: { grid: { pillAsInBlock: true, pillNarrower: true, oneLine: true, hostStretched: true }, column: { pillAsInBlock: true, pillNarrower: true, oneLine: true, hostStretched: true } },
      }),
    ),
  ),
  ...variants.flatMap((variant) =>
    densities.map(
      (density): Scenario => ({
        name: `Baseline, ${variant}, ${density}: a one-line static pill, with and without an icon and in two statuses, inline in a paragraph and in an align-items: baseline flex row, has its text's bottom on the surrounding text's (within 0.5 px), its icon wrapper's block-start at the label's and its density's height; a wrapping twin's first line is on the row's baseline; an icon-only pill (its row bare) sits where the phase-1 spike measured it (Edge Cases; plan decision 15 as amended, operator decision Q2 (a); plants: the text wrapper without the label class, bare on every row, bare never set, the dropped override)`,
        run: async (driver) => {
          const at = attributes(variant, density);
          const cases = [
            { id: "plain", status: "warning", content: "Blocked" },
            { id: "icon", status: "info", content: `${icon}Blocked` },
          ];
          const contexts = cases.flatMap(({ id, status, content }) => [
            `<p class="around" id="p-${id}"><span id="before-${id}">Before</span> <ocelle-pill-tag id="in-p-${id}" status="${status}"${at}>${content}</ocelle-pill-tag> after</p>`,
            `<div class="around row" id="r-${id}"><span id="name-${id}">Name</span><ocelle-pill-tag id="in-r-${id}" status="${status}"${at}>${content}</ocelle-pill-tag></div>`,
          ]);
          await mount(
            driver,
            contexts.join("") +
              `<div class="around row" id="r-wrap"><span id="name-wrap">Name</span><ocelle-pill-tag id="wrap" status="warning"${at}>${longText}</ocelle-pill-tag></div>` +
              `<p class="around narrow" id="p-wrap">Before <ocelle-pill-tag id="wrap-p" status="warning"${at}>${longText}</ocelle-pill-tag> after</p>` +
              `<p class="around" id="p-only"><span id="before-only">Before</span> <ocelle-pill-tag id="only-p"${at}>${icon}</ocelle-pill-tag> after</p>` +
              `<div class="around row" id="r-only"><span id="name-only">Name</span><ocelle-pill-tag id="only-r"${at}>${icon}</ocelle-pill-tag></div>`,
          );
          await driver.rules(`.around { margin: 0; ${surrounding(density)} } .row { display: flex; align-items: baseline; column-gap: 8px; } #r-wrap { inline-size: 150px; } .narrow { inline-size: 120px; }`);
          const bottom = (text: TextBox | undefined): number => (text === undefined ? Number.NaN : text.box.y + text.box.height);
          const found: Record<string, unknown> = {};
          for (const { id } of cases) {
            for (const [pill, aroundId] of [
              [`in-p-${id}`, `before-${id}`],
              [`in-r-${id}`, `name-${id}`],
            ] as const) {
              const text = await textOf(driver, pill);
              const aroundText = await textOf(driver, aroundId);
              found[pill] = {
                onBaseline: Math.abs(bottom(text) - bottom(aroundText)) <= 0.5,
                wrappersAligned: Math.abs((await driver.box(pill, ".icon-slot")).y - (await driver.box(pill, ".label")).y) <= 0.5,
                height: Math.abs((await driver.box(pill)).height - height(density)) <= 0.02,
              };
            }
          }
          const oneLine = await textOf(driver, "in-p-plain");
          const lineHeight = oneLine?.box.height ?? Number.NaN;
          const wrapText = await textOf(driver, "wrap");
          const wrapPText = await textOf(driver, "wrap-p");
          const offset = (text: TextBox | undefined, pill: Box): number => (text === undefined ? Number.NaN : text.box.y - pill.y);
          found.wrap = {
            wraps: wrapText !== undefined && wrapText.box.height >= 2 * lineHeight - 0.5,
            firstLineOnBaseline: wrapText !== undefined && Math.abs(wrapText.box.y + lineHeight - bottom(await textOf(driver, "name-wrap"))) <= 0.5,
          };
          found.wrapInParagraph = {
            wraps: wrapPText !== undefined && wrapPText.box.height >= 2 * lineHeight - 0.5,
            firstLineAsOneLine: Math.abs(offset(wrapPText, await driver.box("wrap-p")) - offset(oneLine, await driver.box("in-p-plain"))) <= 0.5,
          };
          for (const [pill, aroundId] of [
            ["only-p", "before-only"],
            ["only-r", "name-only"],
          ] as const) {
            const box = await driver.box(pill);
            const aroundText = await textOf(driver, aroundId);
            found[pill] = {
              row: (await driver.elements(pill)).find((part) => part.attributes.class?.startsWith("icon-row") === true)?.attributes.class,
              top: aroundText === undefined ? null : hundredth(box.y - aroundText.box.y),
              size: [hundredth(box.height), hundredth(box.width)],
            };
          }
          return found;
        },
        expected: {
          ...Object.fromEntries(["in-p-plain", "in-r-plain", "in-p-icon", "in-r-icon"].map((id) => [id, { onBaseline: true, wrappersAligned: true, height: true }])),
          wrap: { wraps: true, firstLineOnBaseline: true },
          wrapInParagraph: { wraps: true, firstLineAsOneLine: true },
          ...Object.fromEntries(["only-p", "only-r"].map((id) => [id, { row: "icon-row bare", top: iconOnly[density].top, size: [iconOnly[density].height, iconOnly[density].width] }])),
        },
      }),
    ),
  ),
  {
    name: "Seven names on a static pill: aria-label, aria-labelledby, aria-describedby, aria-controls, aria-current, aria-pressed and title set on an upgraded static pill, then changed, each stay on the host as set and as changed, with no data-ocelle-moved-* mirror, no inner control and no custom state; the host's removeAttribute clears each (FR-027; Edge Cases; plant: the names handed to MovedAttributes.handle() while static)",
    run: async (driver) => {
      await mount(driver, '<span id="note">Note</span><span id="other-note">Other</span><div id="panel"></div><div id="other-panel"></div><ocelle-pill-tag id="p" status="info">Mine</ocelle-pill-tag>');
      await driver.rules(stateRules);
      const found: Record<string, unknown> = {};
      for (const name of passthrough) {
        const [first, second] = passthroughValues[name];
        await driver.setAttribute("p", name, first);
        const set = { value: await driver.attribute("p", name), mirror: await driver.attribute("p", `data-ocelle-moved-${name}`) };
        await driver.setAttribute("p", name, second);
        const changed = { value: await driver.attribute("p", name), mirror: await driver.attribute("p", `data-ocelle-moved-${name}`) };
        found[name] = { set, changed };
      }
      const inner = (await driver.elements("p")).map((part) => part.name).filter((each) => each === "button" || each === "a");
      const states = { pressed: await driver.computed("p", "text-decoration-line"), current: await driver.computed("p", "font-style") };
      // The host clears them, as the README tells hosts to (axe flags ARIA states on an element with no role).
      for (const name of passthrough) await driver.setAttribute("p", name, null);
      const cleared = await Promise.all(passthrough.map((name) => driver.attribute("p", name)));
      return { found, inner, states, cleared, rendered: await rendered(driver, "p") };
    },
    expected: {
      found: Object.fromEntries(passthrough.map((name) => [name, { set: { value: passthroughValues[name][0], mirror: null }, changed: { value: passthroughValues[name][1], mirror: null } }])),
      inner: [],
      states: { pressed: "none", current: "normal" },
      cleared: passthrough.map(() => null),
      rendered: staticRoot,
    },
  },
  {
    name: "Static click: a click on a static pill, enabled and with disabled, under an ancestor click listener reaches the pill, the ancestor, the document and the window not prevented, as a click on a plain span twin there does; the pill's own click() reaches the host and the ancestor the same way (FR-027; Edge Cases; plant: a click guard on the static host)",
    run: async (driver) => {
      await mount(
        driver,
        '<div id="row-p"><ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag></div><div id="row-d"><ocelle-pill-tag id="d" status="warning" disabled>Blocked</ocelle-pill-tag></div><div id="row-s"><span id="s">Blocked</span></div>',
      );
      const clicked = async (id: string, act: () => Promise<void>): Promise<string[]> => {
        await driver.events(id, ["click"]);
        await act();
        return clicks(await driver.takeEvents());
      };
      return {
        rendered: { pill: await rendered(driver, "p"), disabled: await rendered(driver, "d") },
        pill: await clicked("p", () => driver.click("p")),
        disabled: await clicked("d", () => driver.click("d")),
        span: await clicked("s", () => driver.click("s")),
        method: await clicked("p", () => driver.callClick("p")),
        disabledMethod: await clicked("d", () => driver.callClick("d")),
      };
    },
    expected: {
      rendered: { pill: staticRoot, disabled: staticRoot },
      pill: ["ocelle-pill-tag#p not prevented", "div#row-p not prevented", "body not prevented", "html not prevented", "document not prevented", "window not prevented"],
      disabled: ["ocelle-pill-tag#d not prevented", "div#row-d not prevented", "body not prevented", "html not prevented", "document not prevented", "window not prevented"],
      span: ["span#s not prevented", "div#row-s not prevented", "body not prevented", "html not prevented", "document not prevented", "window not prevented"],
      method: ["ocelle-pill-tag#p not prevented", "div#row-p not prevented", "body not prevented", "html not prevented", "document not prevented", "window not prevented"],
      disabledMethod: ["ocelle-pill-tag#d not prevented", "div#row-d not prevented", "body not prevented", "html not prevented", "document not prevented", "window not prevented"],
    },
  },
  {
    name: 'Static focus: a click on a static pill inside a tabindex="0" ancestor focuses the ancestor, as a click on a plain span twin in the same ancestor does, and the pill\'s shadow root holds no focus (FR-027; plant: delegatesFocus set)',
    run: async (driver) => {
      await mount(driver, '<div id="holder" tabindex="0"><ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag></div><div id="span-holder" tabindex="0"><span id="s">Blocked</span></div><button id="elsewhere">Elsewhere</button>');
      await driver.click("p");
      const pill = { path: await driver.focusPath(), inner: await driver.activeInner("p") };
      await driver.focus("elsewhere");
      await driver.click("s");
      return { pill, span: { path: await driver.focusPath() }, rendered: await rendered(driver, "p") };
    },
    expected: { pill: { path: "holder", inner: null }, span: { path: "span-holder" }, rendered: staticRoot },
  },
  {
    name: "Edge cases: an unknown, miscased or empty status, variant and density each stay in the attribute as written, the properties read neutral, pill and default, and the pill has the default look, beside the default twin; setting a property writes the attribute as given (FR-025; Edge Cases)",
    run: async (driver) => {
      await mount(
        driver,
        '<ocelle-pill-tag id="twin">Draft</ocelle-pill-tag><ocelle-pill-tag id="bogus" status="bogus" variant="outline" density="dense">Draft</ocelle-pill-tag><ocelle-pill-tag id="cased" status="Warning" variant="Badge" density="Compact">Draft</ocelle-pill-tag><ocelle-pill-tag id="empty" status="" variant="" density="">Draft</ocelle-pill-tag>',
      );
      const look = ["background-color", "color", "border-top-color", "padding-left", "line-height", "font-size", "font-variant-numeric"];
      const twin = await pillStyle(driver, "twin", look);
      const read = async (id: string): Promise<unknown> => ({
        attributes: [await driver.attribute(id, "status"), await driver.attribute(id, "variant"), await driver.attribute(id, "density")],
        properties: [await driver.property(id, "status"), await driver.property(id, "variant"), await driver.property(id, "density")],
        defaultLook: JSON.stringify(await pillStyle(driver, id, look)) === JSON.stringify(twin),
      });
      const found = { bogus: await read("bogus"), cased: await read("cased"), empty: await read("empty") };
      await driver.setProperty("bogus", "status", "danger");
      await driver.setProperty("bogus", "variant", "badge");
      await driver.setProperty("bogus", "density", "compact");
      const set = { attributes: [await driver.attribute("bogus", "status"), await driver.attribute("bogus", "variant"), await driver.attribute("bogus", "density")], properties: [await driver.property("bogus", "status"), await driver.property("bogus", "variant"), await driver.property("bogus", "density")], defaultLook: JSON.stringify(await pillStyle(driver, "bogus", look)) === JSON.stringify(twin) };
      return { found, set, messages: await driver.messages() };
    },
    expected: {
      found: {
        bogus: { attributes: ["bogus", "outline", "dense"], properties: ["neutral", "pill", "default"], defaultLook: true },
        cased: { attributes: ["Warning", "Badge", "Compact"], properties: ["neutral", "pill", "default"], defaultLook: true },
        empty: { attributes: ["", "", ""], properties: ["neutral", "pill", "default"], defaultLook: true },
      },
      set: { attributes: ["danger", "badge", "compact"], properties: ["danger", "badge", "compact"], defaultLook: false },
      messages: [],
    },
  },
  {
    name: "Edge cases: label and disabled on a static pill change nothing: the tree, the look, the box and the focus order are those of the same pill without them; the label attribute stays as written and is not reflected from the property (FR-025, FR-027; Edge Cases)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="twin" status="warning">Blocked</ocelle-pill-tag><ocelle-pill-tag id="l" status="warning" label="Other name" disabled>Blocked</ocelle-pill-tag><ocelle-pill-tag id="q" status="warning">Blocked</ocelle-pill-tag>');
      await driver.setProperty("q", "label", "Set by property");
      const look = ["background-color", "color", "border-top-color", "padding-left", "line-height", "opacity", "cursor"];
      const twinLook = JSON.stringify(await pillStyle(driver, "twin", look));
      return {
        tree: await tree(driver, "l"),
        propertyTree: await tree(driver, "q"),
        sameLook: JSON.stringify(await pillStyle(driver, "l", look)) === twinLook,
        sameBox: sameSize(await driver.box("l"), await driver.box("twin")),
        tabs: await driver.tabOrder(),
        label: { attribute: await driver.attribute("l", "label"), property: await driver.property("l", "label"), disabled: await driver.property("l", "disabled") },
        propertyLabel: { attribute: await driver.attribute("q", "label"), property: await driver.property("q", "label") },
      };
    },
    expected: {
      tree: ["generic", "StaticText Blocked"],
      propertyTree: ["generic", "StaticText Blocked"],
      sameLook: true,
      sameBox: true,
      tabs: [],
      label: { attribute: "Other name", property: "Other name", disabled: true },
      propertyLabel: { attribute: null, property: "Set by property" },
    },
  },
  {
    name: "Edge cases: an href that is no link (empty, whitespace only, a javascript: URL) leaves the pill static: its .pill box renders and it is not focusable, as without an href (FR-002 of 012, FR-027)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="empty" href="">Draft</ocelle-pill-tag><ocelle-pill-tag id="blank" href="  ">Draft</ocelle-pill-tag><ocelle-pill-tag id="script" href="javascript:void 0">Draft</ocelle-pill-tag><ocelle-pill-tag id="none">Draft</ocelle-pill-tag>');
      const read = async (id: string): Promise<unknown> => ({ parts: (await driver.elements(id)).map((part) => part.name), tree: await tree(driver, id) });
      return { empty: await read("empty"), blank: await read("blank"), script: await read("script"), none: await read("none"), tabs: await driver.tabOrder(), href: await driver.property("script", "href") };
    },
    expected: {
      ...Object.fromEntries(["empty", "blank", "script", "none"].map((id) => [id, { parts: staticRoot, tree: ["generic", "StaticText Draft"] }])),
      tabs: [],
      href: "javascript:void 0",
    },
  },
  {
    name: "Mode read (FR-025, FR-035; data-model.md § mode): a pill with interactive, with a link-mode href or with both does not render the static shadow root, beside static twins with no href, an empty one and a javascript: URL; removing interactive makes the first static again (mutation finding at phase 4; what an interactive pill renders is user story 4's)",
    run: async (driver) => {
      await mount(
        driver,
        '<ocelle-pill-tag id="button" interactive>Mine</ocelle-pill-tag><ocelle-pill-tag id="link" href="/missions?state=blocked">Blocked</ocelle-pill-tag><ocelle-pill-tag id="absolute" href="https://example.com/missions">Blocked</ocelle-pill-tag><ocelle-pill-tag id="both" interactive href="javascript:void 0">Mine</ocelle-pill-tag>' +
          '<ocelle-pill-tag id="none">Draft</ocelle-pill-tag><ocelle-pill-tag id="empty" href="">Draft</ocelle-pill-tag><ocelle-pill-tag id="script" href="javascript:void 0">Draft</ocelle-pill-tag>',
      );
      const isStatic = async (id: string): Promise<boolean> => JSON.stringify(await rendered(driver, id)) === JSON.stringify(staticRoot);
      const found: Record<string, boolean> = {};
      for (const id of ["button", "link", "absolute", "both", "none", "empty", "script"]) found[id] = await isStatic(id);
      await driver.setAttribute("button", "interactive", null);
      return { found, madeStatic: await isStatic("button") };
    },
    expected: { found: { button: false, link: false, absolute: false, both: false, none: true, empty: true, script: true }, madeStatic: true },
  },
  {
    name: "Reflection (FR-025): interactive and disabled default to false and href is unset, with no attribute written; set as properties, interactive, href and disabled reflect, and the attributes read back as properties (mutation finding at phase 4)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag><ocelle-pill-tag id="a" interactive disabled href="javascript:void 0">Blocked</ocelle-pill-tag>');
      const attributesOf = async (id: string): Promise<unknown> => ({ interactive: await driver.attribute(id, "interactive"), href: await driver.attribute(id, "href"), disabled: await driver.attribute(id, "disabled") });
      const propertiesOf = async (id: string): Promise<unknown> => ({ interactive: await driver.property(id, "interactive"), href: await driver.property(id, "href"), disabled: await driver.property(id, "disabled") });
      const defaults = { attributes: await attributesOf("p"), properties: await propertiesOf("p") };
      const fromAttributes = await propertiesOf("a");
      await driver.setProperty("p", "disabled", true);
      await driver.setProperty("p", "href", "javascript:void 0");
      const setStatic = { attributes: await attributesOf("p"), rendered: await rendered(driver, "p") };
      await driver.setProperty("p", "interactive", true);
      const setInteractive = await driver.attribute("p", "interactive");
      await driver.setProperty("p", "interactive", false);
      await driver.setProperty("p", "disabled", false);
      return { defaults, fromAttributes, setStatic, setInteractive, cleared: await attributesOf("p") };
    },
    expected: {
      defaults: { attributes: { interactive: null, href: null, disabled: null }, properties: { interactive: false, href: undefined, disabled: false } },
      fromAttributes: { interactive: true, href: "javascript:void 0", disabled: true },
      setStatic: { attributes: { interactive: null, href: "javascript:void 0", disabled: "" }, rendered: staticRoot },
      setInteractive: "",
      cleared: { interactive: null, href: "javascript:void 0", disabled: null },
    },
  },
  {
    name: "Attribute changes (FR-025): status, variant and density, each changed alone after the first render, change the look at once: the ground to the new status's, the badge's transparent ground, the compact inline padding (mutation finding at phase 4)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="s">Draft</ocelle-pill-tag><ocelle-pill-tag id="v">Draft</ocelle-pill-tag><ocelle-pill-tag id="d">Draft</ocelle-pill-tag>');
      await driver.setAttribute("s", "status", "danger");
      await driver.setAttribute("v", "variant", "badge");
      await driver.setAttribute("d", "density", "compact");
      return {
        status: (await driver.styles("s", pillPart, ["background-color"]))[0],
        variant: (await driver.styles("v", pillPart, ["background-color"]))[0],
        density: (await driver.styles("d", pillPart, ["padding-left"]))[0],
      };
    },
    expected: { status: { "background-color": tokenColour("color-danger-bg", "light") }, variant: { "background-color": "rgba(0, 0, 0, 0)" }, density: { "padding-left": px(space2) } },
  },
  {
    name: "Edge cases: the text read follows a forwarded slot and ignores empty nodes: a pill whose default slot holds a slot forwarding text has a labelled pill's height and one forwarding only whitespace an empty pill's, beside direct twins; a pill holding two empty elements around whitespace is empty (its row bare) (FR-026; mutation finding at phase 4)",
    run: async (driver) => {
      await mount(driver, '<div id="fwd">Blocked</div><div id="fwd-empty"> </div><ocelle-pill-tag id="direct">Blocked</ocelle-pill-tag><ocelle-pill-tag id="direct-empty"></ocelle-pill-tag><ocelle-pill-tag id="two"><span></span> <span></span></ocelle-pill-tag>');
      await driver.shadow("fwd", "<ocelle-pill-tag><slot></slot></ocelle-pill-tag>");
      await driver.shadow("fwd-empty", "<ocelle-pill-tag><slot></slot></ocelle-pill-tag>");
      await driver.settle();
      const height = async (id: string, inner?: string): Promise<number> => (await driver.box(id, inner)).height;
      const labelled = await height("direct");
      const empty = await height("direct-empty");
      return {
        differ: Math.abs(labelled - empty) > 1,
        forwarded: Math.abs((await height("fwd", "ocelle-pill-tag")) - labelled) <= 0.02,
        forwardedEmpty: Math.abs((await height("fwd-empty", "ocelle-pill-tag")) - empty) <= 0.02,
        two: (await driver.elements("two")).find((part) => part.attributes.class?.startsWith("icon-row") === true)?.attributes.class,
      };
    },
    expected: { differ: true, forwarded: true, forwardedEmpty: true, two: "icon-row bare" },
  },
  {
    name: "Edge cases: an empty pill and a whitespace-only one render their box without error, their row bare and nothing but the host in the tree; text that arrives later, as a text node's data, as a nested element's text or as a new child, drops bare (FR-026; Edge Cases)",
    run: async (driver) => {
      await mount(driver, '<ocelle-pill-tag id="e"></ocelle-pill-tag><ocelle-pill-tag id="w"> </ocelle-pill-tag><ocelle-pill-tag id="n"><span id="nested"></span></ocelle-pill-tag><ocelle-pill-tag id="c"></ocelle-pill-tag>');
      const row = async (id: string): Promise<string | undefined> => (await driver.elements(id)).find((part) => part.attributes.class?.startsWith("icon-row") === true)?.attributes.class;
      const box = await driver.box("e");
      const before = { e: await row("e"), w: await row("w"), n: await row("n"), c: await row("c"), shown: box.width > 0 && box.height > 0, tree: await tree(driver, "e") };
      await driver.text("w", "Blocked");
      await driver.append("nested", "Queued");
      await driver.append("c", "<b>Draft</b>");
      return { before, after: { w: await row("w"), n: await row("n"), c: await row("c"), e: await row("e") }, messages: await driver.messages() };
    },
    expected: {
      before: { e: "icon-row bare", w: "icon-row bare", n: "icon-row bare", c: "icon-row bare", shown: true, tree: ["generic"] },
      after: { w: "icon-row", n: "icon-row", c: "icon-row", e: "icon-row bare" },
      messages: [],
    },
  },
  ...(["light", "dark"] as const).map(
    (palette): Scenario => ({
      name: `Forced colours (${palette} palette): the pill and the badge keep a visible ${String(borderWidth)} px border and their text, both in CanvasText, not the system background Canvas (FR-028; Edge Cases)`,
      run: async (driver) => {
        await mount(driver, '<ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag> <ocelle-pill-tag id="b" status="warning" variant="badge">3</ocelle-pill-tag>');
        await driver.forcedColors("active", palette);
        const canvasText = await driver.resolveColour("CanvasText");
        const canvas = await driver.resolveColour("Canvas");
        const read = async (id: string): Promise<unknown> => {
          const [style] = await driver.styles(id, pillPart, ["border-top-color", "border-top-width", "border-top-style", "color"]);
          const name = (value: string | undefined): string => (value === canvasText ? "CanvasText" : value === canvas ? "Canvas" : (value ?? "none"));
          return { border: name(style?.["border-top-color"]), width: style?.["border-top-width"], style: style?.["border-top-style"], text: name(style?.color) };
        };
        return { pill: await read("p"), badge: await read("b") };
      },
      expected: {
        pill: { border: "CanvasText", width: `${String(borderWidth)}px`, style: "solid", text: "CanvasText" },
        badge: { border: "CanvasText", width: `${String(borderWidth)}px`, style: "solid", text: "CanvasText" },
      },
    }),
  ),
  {
    name: 'Right to left: under dir="rtl" the icon sits on the text\'s right, at the inline start, and a long text wraps inside the pill as in left to right (Edge Cases)',
    run: async (driver) => {
      await mount(driver, `<div id="area"><ocelle-pill-tag id="i" status="info">${icon}Blocked</ocelle-pill-tag><div id="narrow"><ocelle-pill-tag id="w" status="info">${longText}</ocelle-pill-tag></div></div>`);
      await driver.rules("#narrow { inline-size: 120px; }");
      await driver.dir("area", "rtl");
      const text = await textOf(driver, "i");
      const iconBox = await driver.box("i", ".icon-slot");
      const wrapped = await textOf(driver, "w");
      return {
        iconRight: text !== undefined && iconBox.x >= text.box.x + text.box.width - 0.5,
        wraps: wrapped !== undefined && text !== undefined && wrapped.box.height >= 2 * text.box.height - 0.5,
        inside: within(wrapped?.box, await driver.box("w", pillPart)),
        tree: await tree(driver, "i"),
      };
    },
    expected: { iconRight: true, wraps: true, inside: true, tree: ["generic", "StaticText Blocked"] },
  },
  {
    name: "Edge cases: a host hidden attribute removes the pill's box, beside its visible twin; neither adds a tab stop (plant: :host([hidden]) removed)",
    run: async (driver) => {
      await mount(driver, '<button id="before">Before</button><ocelle-pill-tag id="gone" hidden>Blocked</ocelle-pill-tag><ocelle-pill-tag id="shown">Blocked</ocelle-pill-tag><button id="after">After</button>');
      const box = (each: Box): unknown => ({ width: each.width > 0, height: each.height > 0, display: each.display });
      return { gone: box(await driver.box("gone")), shown: box(await driver.box("shown")), tabs: await driver.tabOrder() };
    },
    expected: { gone: { width: false, height: false, display: "none" }, shown: { width: true, height: true, display: "inline-block" }, tabs: [["button#before"], ["button#after"]] },
  },
];

/**
 * The static click inside a link, in process only: the fixture has no navigation sink, and a link there navigates for
 * real (test/browser/driver.ts `navigations`). A click on a static pill, enabled and disabled, inside `<a href>` runs
 * the link's activation not prevented, as a click on a plain span twin in the same link does (contracts/checks.md § US3
 * static click; plant: a click guard on the static host).
 */
export const pillSinkScenarios: readonly Scenario[] = [
  {
    name: "Static click in a link (sink): a click on a static pill, enabled and with disabled, inside <a href> runs the link's activation not prevented, as a click on a plain span twin in the same kind of link does; the link records each click once (FR-027; plant: a click guard on the static host)",
    run: async (driver) => {
      await mount(
        driver,
        '<a id="a-p" href="/missions?state=blocked"><ocelle-pill-tag id="p" status="warning">Blocked</ocelle-pill-tag></a> <a id="a-d" href="/missions?state=disabled"><ocelle-pill-tag id="d" status="warning" disabled>Blocked</ocelle-pill-tag></a> <a id="a-s" href="/missions?state=span"><span id="s">Blocked</span></a>',
      );
      await driver.click("p");
      await driver.click("d");
      await driver.click("s");
      return {
        rendered: { pill: await rendered(driver, "p"), disabled: await rendered(driver, "d") },
        navigations: (await driver.navigations()).map((record) => ({ type: record.type, prevented: record.defaultPrevented, href: record.href })),
      };
    },
    expected: {
      rendered: { pill: staticRoot, disabled: staticRoot },
      navigations: [
        { type: "click", prevented: false, href: "/missions?state=blocked" },
        { type: "click", prevented: false, href: "/missions?state=disabled" },
        { type: "click", prevented: false, href: "/missions?state=span" },
      ],
    },
  },
];
