// The shared bodies of 011 User Story 2's page-header scenarios (spec US2-1 to US2-8; FR-002 to FR-006, FR-008, FR-019,
// FR-031; research.md R-02 to R-04, R-06, R-07, R-13; T026). Each body observes the page through the driver and returns
// one observation; each harness asserts it equals `expected`, written by hand from the spec: lengths, colours and fonts
// as the token names the spec gives (scenarios/layout.ts reads each token on the same page), the heading levels and
// names the page slots, and "does not" outcomes always in the same body as the positive outcome they guard (spec
// § "Does not" outcomes are paired; contracts/checks.md § Pairing plants):
// - the element adds no heading, banner or other landmark (US2-1) beside the slotted heading as one node with its
//   level, drawn in the display style; plants: a `<header>` band, `role="heading"` on a wrapper, the heading wrapper
//   rendered as an `h1` (the `h2` case);
// - an empty part adds no padding, gap or margin (US2-4, US2-8) beside a filled twin with the gaps; plants: the empty
//   wrapper not hidden; the heading-to-description gap moved from the heading column's `gap` to a
//   `margin-block-start` on the description wrapper;
// - an empty heading slot leaves no heading (US2-8) beside the filled twin's heading;
// - no tab stop of the element's own (US2-6) beside focus reaching the action and the band drawn; plant: a wrapper
//   with `tabindex="0"`;
// - no `size` written on upgrade (FR-006) beside the property set by script reflecting and drawing compact; plant: an
//   initializer `size = "regular"`;
// - an empty or invalid `size` is not set and not rewritten (FR-006) beside a `size="compact"` twin drawn compact;
//   plant: styles keyed on `:host(:not([size="regular"]))`;
// - no horizontal scroll and no clipped text at 320 px (US2-5, FR-004) beside the actions stacked under the
//   description; plants: `flex-wrap: nowrap` on the row, `overflow: hidden` with `white-space: nowrap` on a wrapper;
// - no ground of its own (R-07) beside the rule drawn under the band;
// - no event (FR-002) across mount, slot and attribute changes, beside the layout change of each step; plant:
//   `dispatchEvent(new Event("change"))` on slot change.
// Narrow widths with actions but no heading (the section header's lesson, reviews/phase-2/round-1.md R1-02) are
// measured in 300 px containers. Every scenario runs at 1280 × 800 px unless it sets the viewport itself.
import type { Scenario } from "./icon.ts";
import { systemColours } from "./icon.ts";
import type { Box, Driver, Palette } from "./driver.ts";
import { after, below, boxes, inOrder, lengthIs, pick, probe, tenth, tokenPx, tokensOf, treeOf } from "./layout.ts";
import { eyebrowStyle, host, sentinelRules } from "./section-header.ts";

export type { Scenario } from "./icon.ts";

/** A page header with `id`, its children and its attributes. */
export const pageHeader = (id: string, inner: string, attributes = ""): string => `<ocelle-page-header id="${id}"${attributes}>${inner}</ocelle-page-header>`;

/** The slotted title `<id>-heading`, an `h1` unless `level` says otherwise. */
export const title = (id: string, text = "Missions", level = 1): string => `<h${String(level)} id="${id}-heading" slot="heading">${text}</h${String(level)}>`;

/** The slotted eyebrow `<id>-eyebrow`, a `span` unless `tag` says otherwise. */
export const eyebrow = (id: string, tag = "span"): string => `<${tag} id="${id}-eyebrow" slot="eyebrow">Workspace</${tag}>`;

/** The slotted description `<id>-description`, a `p` (its UA margins are trimmed, FR-008). */
export const description = (id: string): string => `<p id="${id}-description" slot="description">Every mission of the workspace, newest first.</p>`;

/** Two slotted actions, `<id>-edit` and `<id>-share`, buttons; a third, `<id>-run`, with `three`. */
export function actions(id: string, three = false): string {
  const one = (name: string, text: string): string => `<button id="${id}-${name}" slot="actions" type="button">${text}</button>`;
  return one("edit", "Edit") + one("share", "Share") + (three ? one("run", "Run") : "");
}

/** Every part filled: eyebrow, heading, description and two actions. */
export const filled = (id: string, eyebrowTag = "span"): string => eyebrow(id, eyebrowTag) + title(id) + description(id) + actions(id);

/** The title style of FR-019 at a size token, as `tokensOf` reads it. */
export const titleStyle = (size: "font-size-2xl" | "font-size-xl"): Readonly<Record<string, string>> => ({
  "font-family": "font-display",
  "font-size": size,
  "font-weight": "font-weight-display",
  "letter-spacing": "tracking-display",
  "line-height": "line-height-tight",
  color: "color-ink",
  "margin-block-start": "=0px",
  "margin-block-end": "=0px",
});

/** The description style of FR-019, as `tokensOf` reads it. */
export const descriptionStyle: Readonly<Record<string, string>> = {
  "font-size": "font-size-md",
  color: "color-ink-soft",
  "margin-block-start": "=0px",
  "margin-block-end": "=0px",
};

/** The heading nodes of a subtree: role, name and level. */
async function headings(driver: Driver, id: string): Promise<unknown[]> {
  return (await treeOf(driver, id)).filter((node) => (node as { role: string }).role === "heading");
}

/** The used length of the computed `property` of `id`, as the token it should equal (scenarios/layout.ts `lengthIs`). */
async function computedIs(driver: Driver, id: string, property: string, token: string): Promise<string> {
  return lengthIs(driver, Number.parseFloat(await driver.computed(id, property)), token);
}

/**
 * The band of header `id` (FR-019, R-07): its block padding `--ocelle-space-4` from the host's block start to `first`
 * and from `last` to the rule, its inline padding `--ocelle-space-6` from the host's inline start to `first`, a
 * `--ocelle-border-width` solid rule in `--ocelle-color-rule` along its block end and no other border, and no ground of
 * its own.
 */
export async function bandOf(driver: Driver, id: string, first: string, last: string, rtl = false): Promise<unknown> {
  const parts = await boxes(driver, [id, first, last]);
  const band = pick(parts, id);
  const start = pick(parts, first);
  const end = pick(parts, last);
  const rule = await tokenPx(driver, "border-width");
  return {
    blockStart: await lengthIs(driver, start.y - band.y, "space-4"),
    blockEnd: await lengthIs(driver, band.y + band.height - (end.y + end.height) - rule, "space-4"),
    inlineStart: await lengthIs(driver, rtl ? band.x + band.width - (start.x + start.width) : start.x - band.x, "space-6"),
    rule: {
      width: await computedIs(driver, id, "border-bottom-width", "border-width"),
      style: await driver.computed(id, "border-bottom-style"),
      colour: await tokensOf(driver, id, { "border-bottom-color": "color-rule" }),
      others: await Promise.all(["top", "left", "right"].map((side) => driver.computed(id, `border-${side}-width`))),
    },
    ground: await driver.computed(id, "background-color"),
  };
}

export const bandExpected = {
  blockStart: "space-4",
  blockEnd: "space-4",
  inlineStart: "space-6",
  rule: { width: "border-width", style: "solid", colour: { "border-bottom-color": "color-rule" }, others: ["0px", "0px", "0px"] },
  ground: "rgba(0, 0, 0, 0)",
};

/**
 * The gaps of FR-019 in a filled header `id` (eyebrow to heading, heading to description, heading column to the first
 * action, between actions) as token names, and where the actions sit: `--ocelle-space-6` from the host's inline end,
 * their block start at the heading's, each as tall as its own content.
 */
export async function partsOf(driver: Driver, id: string, rtl = false): Promise<unknown> {
  const parts = await boxes(driver, [id, `${id}-eyebrow`, `${id}-heading`, `${id}-description`, `${id}-edit`, `${id}-share`]);
  const band = pick(parts, id);
  const head = pick(parts, `${id}-heading`);
  const text = pick(parts, `${id}-description`);
  const edit = pick(parts, `${id}-edit`);
  const share = pick(parts, `${id}-share`);
  const end = rtl ? share.x - band.x : band.x + band.width - (share.x + share.width);
  return {
    eyebrowToHeading: await lengthIs(driver, below(pick(parts, `${id}-eyebrow`), head), "space-1"),
    headingToDescription: await lengthIs(driver, below(head, text), "space-1"),
    headingToActions: await lengthIs(driver, after(head, edit, rtl), "space-4"),
    betweenActions: await lengthIs(driver, after(edit, share, rtl), "space-2"),
    actionsAtInlineEnd: await lengthIs(driver, end, "space-6"),
    actionsAtHeadingStart: [tenth(edit.y - head.y), tenth(share.y - head.y)],
    actionsShorterThanColumn: [edit, share].map((action) => action.height < text.y + text.height - head.y),
  };
}

export const partsExpected = {
  eyebrowToHeading: "space-1",
  headingToDescription: "space-1",
  headingToActions: "space-4",
  betweenActions: "space-2",
  actionsAtInlineEnd: "space-6",
  actionsAtHeadingStart: [0, 0],
  actionsShorterThanColumn: [true, true],
};

const themes: readonly Palette[] = ["light", "dark"];

/** The sentinel values of the token-sentinel scenario (research.md R-13): each token a distinct value of its type. */
const sentinels: Readonly<Record<string, string>> = {
  "font-display": '"Sentinel Display", serif',
  "font-sans": '"Sentinel Sans", fantasy',
  "font-size-2xl": "33px",
  "font-size-xl": "29px",
  "font-size-md": "15px",
  "font-size-eyebrow": "9px",
  "font-weight-display": "700",
  "font-weight-eyebrow": "300",
  "tracking-display": "0.25em",
  "tracking-eyebrow": "0.5em",
  "line-height-tight": "1.5",
  "line-height-normal": "2",
  "color-ink": "rgb(1, 2, 3)",
  "color-ink-soft": "rgb(4, 5, 6)",
  "color-eyebrow": "rgb(7, 8, 9)",
  "color-rule": "rgb(10, 11, 12)",
  "border-width": "3px",
  figures: "slashed-zero",
  "space-1": "3px",
  "space-2": "5px",
  "space-4": "13px",
  "space-6": "21px",
};

/**
 * What the sentinel scenario reads on a filled header `id`, its compact twin `<id>-c`, its narrow twin `<id>-n` and a
 * twin `<id>-i` whose description is a `span`: drawn as a block, its border box starts the heading column's gap below
 * the heading even when its font size differs from the page's.
 */
async function sentinelRead(driver: Driver, id: string): Promise<unknown> {
  const read = async (of: string, properties: readonly string[]): Promise<Record<string, string>> =>
    Object.fromEntries(await Promise.all(properties.map(async (property) => [property, await driver.computed(of, property)] as const)));
  const parts = await boxes(driver, [id, `${id}-eyebrow`, `${id}-heading`, `${id}-description`, `${id}-edit`, `${id}-share`, `${id}-n-heading`, `${id}-n-edit`, `${id}-i-heading`, `${id}-i-description`]);
  const at = (key: string): Box => pick(parts, key);
  return {
    heading: await read(`${id}-heading`, ["font-family", "font-size", "font-weight", "letter-spacing", "line-height", "color"]),
    compact: await read(`${id}-c-heading`, ["font-size"]),
    eyebrow: await read(`${id}-eyebrow`, ["font-family", "font-size", "font-weight", "letter-spacing", "line-height", "color", "font-variant-numeric"]),
    description: await read(`${id}-description`, ["font-size", "color"]),
    band: await read(id, ["padding-top", "padding-bottom", "padding-left", "padding-right", "border-bottom-width", "border-bottom-color"]),
    gaps: {
      eyebrowToHeading: tenth(below(at(`${id}-eyebrow`), at(`${id}-heading`))),
      headingToDescription: tenth(below(at(`${id}-heading`), at(`${id}-description`))),
      headingToActions: tenth(after(at(`${id}-heading`), at(`${id}-edit`))),
      betweenActions: tenth(after(at(`${id}-edit`), at(`${id}-share`))),
      wrappedActions: tenth(below(at(`${id}-n-heading`), at(`${id}-n-edit`))),
      eyebrowAtPadding: tenth(at(`${id}-eyebrow`).y - at(id).y),
      spanDescription: tenth(below(at(`${id}-i-heading`), at(`${id}-i-description`))),
    },
  };
}

export const pageHeaderScenarios: Scenario[] = [
  {
    name: "US2-1: the tree holds exactly the slotted h1, level 1 and named \"Missions\", drawn in the display style, and no heading, banner or other landmark of the element's own; with an h2 the page holds one level-2 heading and no h1 anywhere (FR-002, FR-019)",
    run: async (driver) => {
      await driver.mount(pageHeader("one", title("one")) + `<div id="page">${pageHeader("two", title("two", "Missions", 2))}</div>` + probe);
      return {
        one: await treeOf(driver, "one"),
        slotted: await driver.ax("one-heading"),
        page: await treeOf(driver, "page"),
        drawn: [await tokensOf(driver, "one-heading", titleStyle("font-size-2xl")), await tokensOf(driver, "two-heading", titleStyle("font-size-2xl"))],
      };
    },
    expected: {
      one: [host, { role: "heading", name: "Missions", level: 1 }],
      slotted: [{ role: "heading", name: "Missions", level: 1 }],
      page: [host, host, { role: "heading", name: "Missions", level: 2 }],
      drawn: [titleStyle("font-size-2xl"), titleStyle("font-size-2xl")],
    },
  },
  ...themes.flatMap((theme) =>
    (["ltr", "rtl"] as const).map((direction) => ({
      name: `US2-2, ${theme}, ${direction}: the eyebrow above the heading with the eyebrow tokens, the heading in the display style at --ocelle-font-size-2xl, the p description's border box --ocelle-space-1 below the heading's (its UA margin trimmed), the actions at the inline end with their block start at the heading's, the band's --ocelle-space-4 block and --ocelle-space-6 inline padding, a --ocelle-border-width rule in --ocelle-color-rule along its block end and no ground of its own; a p eyebrow takes the same gaps (FR-008, FR-019, FR-031)`,
      run: async (driver: Driver) => {
        await driver.mount(pageHeader("full", filled("full")) + pageHeader("para", filled("para", "p")) + probe);
        await driver.theme(theme);
        const rtl = direction === "rtl";
        if (rtl) {
          await driver.dir("full", "rtl");
          await driver.dir("para", "rtl");
        }
        return {
          span: await partsOf(driver, "full", rtl),
          p: await partsOf(driver, "para", rtl),
          band: await bandOf(driver, "full", "full-eyebrow", "full-description", rtl),
          pBand: await bandOf(driver, "para", "para-eyebrow", "para-description", rtl),
          eyebrow: await tokensOf(driver, "full-eyebrow", eyebrowStyle),
          pEyebrow: await tokensOf(driver, "para-eyebrow", eyebrowStyle),
          description: await tokensOf(driver, "full-description", descriptionStyle),
          heading: await tokensOf(driver, "full-heading", titleStyle("font-size-2xl")),
        };
      },
      expected: {
        span: partsExpected,
        p: partsExpected,
        band: bandExpected,
        pBand: bandExpected,
        eyebrow: eyebrowStyle,
        pEyebrow: eyebrowStyle,
        description: descriptionStyle,
        heading: titleStyle("font-size-2xl"),
      },
    })),
  ),
  {
    name: "US2-3: size=\"compact\" draws the heading at --ocelle-font-size-xl (24 px) with the same face, weight, tracking and line height, and keeps the eyebrow style, the description style, the gaps and the band of US2-2 (FR-019)",
    run: async (driver) => {
      await driver.mount(pageHeader("small", filled("small"), ' size="compact"') + pageHeader("large", filled("large")) + probe);
      return {
        small: await tokensOf(driver, "small-heading", titleStyle("font-size-xl")),
        px: await driver.computed("small-heading", "font-size"),
        large: await tokensOf(driver, "large-heading", titleStyle("font-size-2xl")),
        eyebrow: await tokensOf(driver, "small-eyebrow", eyebrowStyle),
        description: await tokensOf(driver, "small-description", descriptionStyle),
        gaps: await partsOf(driver, "small"),
        band: await bandOf(driver, "small", "small-eyebrow", "small-description"),
      };
    },
    expected: { small: titleStyle("font-size-xl"), px: "24px", large: titleStyle("font-size-2xl"), eyebrow: eyebrowStyle, description: descriptionStyle, gaps: partsExpected, band: bandExpected },
  },
  {
    name: "US2-4: a header with only a heading is its heading inside the band's padding and rule, with no gap or space for its empty eyebrow, description and actions, while a filled header on the same page has the gaps of US2-2 (FR-005, FR-019)",
    run: async (driver) => {
      await driver.mount(pageHeader("bare", title("bare")) + pageHeader("full", filled("full")) + probe);
      const band = await driver.box("bare");
      const head = await driver.box("bare-heading");
      return {
        bare: {
          band: await bandOf(driver, "bare", "bare-heading", "bare-heading"),
          inlineEnd: await lengthIs(driver, band.x + band.width - (head.x + head.width), "space-6"),
        },
        full: await partsOf(driver, "full"),
      };
    },
    expected: { bare: { band: bandExpected, inlineEnd: "space-6" }, full: partsExpected },
  },
  {
    name: "US2-5: at 320 px a page header with a 60-character unbroken heading, a description and three actions has no horizontal scroll and no clipped text, the heading wraps inside the band, and the actions sit under the description, --ocelle-space-2 below it, at the inline start (FR-004, FR-019)",
    run: async (driver) => {
      const run = `Missions${"x".repeat(60)}end`;
      await driver.mount(pageHeader("long", eyebrow("long") + title("long", run) + description("long") + actions("long", true)) + probe);
      await driver.viewport(320, 800);
      try {
        const band = await driver.box("long");
        const head = await driver.box("long-heading");
        const text = await driver.box("long-description");
        const edit = await driver.box("long-edit");
        const last = await driver.box("long-run");
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          clipped: (await driver.textBoxes("long")).filter((line) => line.clipped).map((line) => line.text),
          headingInsideBand: head.x >= band.x && head.x + head.width <= band.x + band.width,
          headingWraps: head.height > edit.height * 2,
          actionsBelow: await lengthIs(driver, below(text, edit), "space-2"),
          actionsAtStart: [tenth(edit.x - text.x), tenth(edit.x - head.x)],
          oneRow: tenth(last.y - edit.y),
          band: await bandOf(driver, "long", "long-eyebrow", "long-edit"),
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { scrollWidth: true, clipped: [], headingInsideBand: true, headingWraps: true, actionsBelow: "space-2", actionsAtStart: [0, 0], oneRow: 0, band: bandExpected },
  },
  {
    name: "US2-6: tabbing past a page header whose actions hold a button moves focus from the link before it to the button and then to the button after it, in document order, while the header is drawn with its band; the element and its shadow root add no tab stop (FR-002)",
    run: async (driver) => {
      await driver.mount('<a id="before" href="#tabs">Before</a>' + pageHeader("tabs", title("tabs") + description("tabs") + '<button id="tabs-action" slot="actions" type="button">New mission</button>') + '<button id="after" type="button">After</button>' + probe);
      const order = [];
      for (let press = 0; press < 3; press += 1) {
        await driver.tab();
        order.push(await driver.activeElement());
      }
      return { drawn: await bandOf(driver, "tabs", "tabs-heading", "tabs-description"), order };
    },
    expected: {
      drawn: bandExpected,
      order: [
        { name: "a", id: "before", hosts: [] },
        { name: "button", id: "tabs-action", hosts: [] },
        { name: "button", id: "after", hosts: [] },
      ],
    },
  },
  ...themes.map((palette) => ({
    name: `US2-7, forced colours with the ${palette} palette: the rule under the band is a --ocelle-border-width solid border in the system text colour, unlike the canvas; the slotted heading, eyebrow and description are drawn in the system text colour; a compact header keeps its compact heading size and its band padding (FR-001, FR-003, FR-019)`,
    run: async (driver: Driver) => {
      await driver.mount(pageHeader("plain", filled("plain")) + pageHeader("small", filled("small"), ' size="compact"') + probe);
      await driver.forcedColors("active", palette);
      try {
        const text = systemColours[palette].CanvasText;
        const system = async (id: string): Promise<string> => {
          const colour = await driver.computed(id, "color");
          return colour === text ? "CanvasText" : colour;
        };
        const rule = await driver.computed("plain", "border-bottom-color");
        return {
          rule: { colour: rule === text ? "CanvasText" : rule, width: await computedIs(driver, "plain", "border-bottom-width", "border-width"), style: await driver.computed("plain", "border-bottom-style") },
          ruleUnlikeCanvas: text !== (await driver.resolveColour("Canvas")),
          words: await inOrder(["plain-heading", "plain-eyebrow", "plain-description"], system),
          compact: {
            heading: await tokensOf(driver, "small-heading", { "font-size": "font-size-xl" }),
            padding: [await computedIs(driver, "small", "padding-top", "space-4"), await computedIs(driver, "small", "padding-left", "space-6")],
          },
        };
      } finally {
        await driver.forcedColors("none");
      }
    },
    expected: {
      rule: { colour: "CanvasText", width: "border-width", style: "solid" },
      ruleUnlikeCanvas: true,
      words: ["CanvasText", "CanvasText", "CanvasText"],
      compact: { heading: { "font-size": "font-size-xl" }, padding: ["space-4", "space-6"] },
    },
  })),
  {
    name: "US2-8: a header with an eyebrow, a p description and actions but an empty heading slot has no heading box, gap, margin or node, its eyebrow's and description's border boxes --ocelle-space-1 apart; one with only a description and actions starts its description at the band's block-start padding edge with no heading node; a third with all four filled has both gaps and its level-1 heading (FR-005, FR-019)",
    run: async (driver) => {
      await driver.mount(
        pageHeader("empty", eyebrow("empty") + description("empty") + actions("empty")) + pageHeader("said", description("said") + actions("said")) + pageHeader("full", filled("full")) + probe,
      );
      const full = await boxes(driver, ["full-eyebrow", "full-heading", "full-description"]);
      const said = await boxes(driver, ["said", "said-description"]);
      return {
        empty: { eyebrowToDescription: await lengthIs(driver, below(await driver.box("empty-eyebrow"), await driver.box("empty-description")), "space-1"), headings: await headings(driver, "empty") },
        said: { descriptionAtPadding: await lengthIs(driver, pick(said, "said-description").y - pick(said, "said").y, "space-4"), headings: await headings(driver, "said") },
        full: {
          eyebrowToHeading: await lengthIs(driver, below(pick(full, "full-eyebrow"), pick(full, "full-heading")), "space-1"),
          headingToDescription: await lengthIs(driver, below(pick(full, "full-heading"), pick(full, "full-description")), "space-1"),
          headings: await headings(driver, "full"),
        },
      };
    },
    expected: {
      empty: { eyebrowToDescription: "space-1", headings: [] },
      said: { descriptionAtPadding: "space-4", headings: [] },
      full: { eyebrowToHeading: "space-1", headingToDescription: "space-1", headings: [{ role: "heading", name: "Missions", level: 1 }] },
    },
  },
  {
    name: "FR-005, FR-019: a header with an eyebrow and actions but no heading or description keeps its actions at the inline end, --ocelle-space-1 under the eyebrow; one with an eyebrow and a description only has the description --ocelle-space-1 under the eyebrow; one with only an eyebrow is the eyebrow inside the band, with no gap under it; beside a filled twin with its gaps",
    run: async (driver) => {
      await driver.mount(pageHeader("labelled", eyebrow("labelled") + actions("labelled")) + pageHeader("described", eyebrow("described") + description("described")) + pageHeader("alone", eyebrow("alone")) + pageHeader("full", filled("full")) + probe);
      const band = await driver.box("labelled");
      const share = await driver.box("labelled-share");
      return {
        labelled: {
          actionsAtInlineEnd: await lengthIs(driver, band.x + band.width - (share.x + share.width), "space-6"),
          eyebrowToActions: await lengthIs(driver, below(await driver.box("labelled-eyebrow"), await driver.box("labelled-edit")), "space-1"),
          band: await bandOf(driver, "labelled", "labelled-eyebrow", "labelled-edit"),
        },
        described: await lengthIs(driver, below(await driver.box("described-eyebrow"), await driver.box("described-description")), "space-1"),
        alone: await bandOf(driver, "alone", "alone-eyebrow", "alone-eyebrow"),
        full: await partsOf(driver, "full"),
      };
    },
    expected: { labelled: { actionsAtInlineEnd: "space-6", eyebrowToActions: "space-1", band: bandExpected }, described: "space-1", alone: bandExpected, full: partsExpected },
  },
  {
    name: "FR-005, FR-019, narrow (the section header's lesson R1-02): in 300 px containers, two 120 px actions that fit on one line but not beside an --ocelle-space-4 gap stay on one line at the inline end with no heading or description: with actions only they start at the band's block-start padding edge and the band ends --ocelle-space-4 under them; under an eyebrow they start --ocelle-space-1 below it; beside a twin with a heading, and one with a description only, whose actions wrap --ocelle-space-2 under it at its inline start",
    run: async (driver) => {
      const ids = ["only", "labelled", "full", "said"];
      const narrow = (id: string, inner: string): string => `<div id="${id}-box">${pageHeader(id, inner)}</div>`;
      await driver.mount(narrow("only", actions("only")) + narrow("labelled", eyebrow("labelled") + actions("labelled")) + narrow("full", title("full", "Release planning overview") + actions("full")) + narrow("said", description("said") + actions("said")) + probe);
      for (const id of ids) {
        await driver.size(`${id}-box`, 300, null);
        await driver.size(`${id}-edit`, 120, null);
        await driver.size(`${id}-share`, 120, null);
      }
      const parts = await boxes(driver, ids.flatMap((id) => [id, `${id}-edit`, `${id}-share`]).concat(["labelled-eyebrow", "full-heading", "said-description"]));
      const at = (key: string): Box => pick(parts, key);
      const end = (id: string): Promise<string> => lengthIs(driver, at(id).x + at(id).width - (at(`${id}-share`).x + at(`${id}-share`).width), "space-6");
      return {
        only: {
          blockStart: await lengthIs(driver, at("only-edit").y - at("only").y, "space-4"),
          blockEnd: await lengthIs(driver, at("only").y + at("only").height - (at("only-edit").y + at("only-edit").height) - (await tokenPx(driver, "border-width")), "space-4"),
          oneLine: tenth(at("only-share").y - at("only-edit").y),
          end: await end("only"),
        },
        labelled: {
          eyebrowToActions: await lengthIs(driver, below(at("labelled-eyebrow"), at("labelled-edit")), "space-1"),
          band: await bandOf(driver, "labelled", "labelled-eyebrow", "labelled-edit"),
          oneLine: tenth(at("labelled-share").y - at("labelled-edit").y),
          end: await end("labelled"),
        },
        full: { actionsBelow: await lengthIs(driver, below(at("full-heading"), at("full-edit")), "space-2"), actionsAtStart: tenth(at("full-edit").x - at("full-heading").x) },
        said: { actionsBelow: await lengthIs(driver, below(at("said-description"), at("said-edit")), "space-2"), actionsAtStart: tenth(at("said-edit").x - at("said-description").x) },
      };
    },
    expected: {
      only: { blockStart: "space-4", blockEnd: "space-4", oneLine: 0, end: "space-6" },
      labelled: { eyebrowToActions: "space-1", band: bandExpected, oneLine: 0, end: "space-6" },
      full: { actionsBelow: "space-2", actionsAtStart: 0 },
      said: { actionsBelow: "space-2", actionsAtStart: 0 },
    },
  },
  {
    name: "FR-006, empty or invalid size: size=\"\" and size=\"bogus\" draw the heading at the regular size of US2-2 and keep the value the page wrote, beside a size=\"compact\" twin drawn at US2-3's compact size (FR-019)",
    run: async (driver) => {
      await driver.mount(pageHeader("blank", title("blank"), ' size=""') + pageHeader("bogus", title("bogus"), ' size="bogus"') + pageHeader("compact", title("compact"), ' size="compact"') + probe);
      return {
        blank: await tokensOf(driver, "blank-heading", titleStyle("font-size-2xl")),
        bogus: await tokensOf(driver, "bogus-heading", titleStyle("font-size-2xl")),
        compact: await tokensOf(driver, "compact-heading", titleStyle("font-size-xl")),
        kept: [await driver.attribute("blank", "size"), await driver.attribute("bogus", "size")],
      };
    },
    expected: { blank: titleStyle("font-size-2xl"), bogus: titleStyle("font-size-2xl"), compact: titleStyle("font-size-xl"), kept: ["", "bogus"] },
  },
  {
    name: "FR-006, upgrade: a page header written with no size carries no size attribute after upgrade and draws regular, while header.size = \"compact\" set by property on its twin reflects as size=\"compact\" and draws it compact; regular set by property reflects and draws regular",
    run: async (driver) => {
      await driver.mount(pageHeader("plain", title("plain")) + pageHeader("set", title("set")) + pageHeader("back", title("back"), ' size="compact"') + probe);
      const upgraded = await driver.attribute("plain", "size");
      await driver.setProperty("set", "size", "compact");
      await driver.setProperty("back", "size", "regular");
      return {
        upgraded,
        plain: await tokensOf(driver, "plain-heading", { "font-size": "font-size-2xl" }),
        reflected: [await driver.attribute("set", "size"), await driver.attribute("back", "size")],
        drawn: [await tokensOf(driver, "set-heading", { "font-size": "font-size-xl" }), await tokensOf(driver, "back-heading", { "font-size": "font-size-2xl" })],
      };
    },
    expected: { upgraded: null, plain: { "font-size": "font-size-2xl" }, reflected: ["compact", "regular"], drawn: [{ "font-size": "font-size-xl" }, { "font-size": "font-size-2xl" }] },
  },
  {
    name: "token sentinels (research.md R-13): with every token the page header reads set to a distinct sentinel on the root, its heading, compact heading, eyebrow, description, band padding, rule and gaps follow each sentinel, a span description included, and with them removed it draws its default again",
    run: async (driver) => {
      const markup =
        pageHeader("s", filled("s")) + pageHeader("s-c", title("s-c"), ' size="compact"') + pageHeader("s-i", title("s-i") + '<span id="s-i-description" slot="description">Every mission</span>') + `<div id="narrow">${pageHeader("s-n", title("s-n", "Release planning overview") + actions("s-n"))}</div>` + probe;
      await driver.mount(markup);
      await driver.size("narrow", 200, null);
      await driver.rules(sentinelRules(sentinels));
      const sentinel = await sentinelRead(driver, "s");
      await driver.mount(markup);
      return {
        sentinel,
        restored: {
          heading: await tokensOf(driver, "s-heading", titleStyle("font-size-2xl")),
          eyebrow: await tokensOf(driver, "s-eyebrow", eyebrowStyle),
          description: await tokensOf(driver, "s-description", descriptionStyle),
          gaps: await partsOf(driver, "s"),
          band: await bandOf(driver, "s", "s-eyebrow", "s-description"),
        },
      };
    },
    expected: {
      sentinel: {
        heading: { "font-family": '"Sentinel Display", serif', "font-size": "33px", "font-weight": "700", "letter-spacing": "8.25px", "line-height": "49.5px", color: "rgb(1, 2, 3)" },
        compact: { "font-size": "29px" },
        eyebrow: {
          "font-family": '"Sentinel Sans", fantasy',
          "font-size": "9px",
          "font-weight": "300",
          "letter-spacing": "4.5px",
          "line-height": "18px",
          color: "rgb(7, 8, 9)",
          "font-variant-numeric": "slashed-zero",
        },
        description: { "font-size": "15px", color: "rgb(4, 5, 6)" },
        band: { "padding-top": "13px", "padding-bottom": "13px", "padding-left": "21px", "padding-right": "21px", "border-bottom-width": "3px", "border-bottom-color": "rgb(10, 11, 12)" },
        gaps: { eyebrowToHeading: 3, headingToDescription: 3, headingToActions: 13, betweenActions: 5, wrappedActions: 5, eyebrowAtPadding: 13, spanDescription: 3 },
      },
      restored: { heading: titleStyle("font-size-2xl"), eyebrow: eyebrowStyle, description: descriptionStyle, gaps: partsExpected, band: bandExpected },
    },
  },
  {
    name: "FR-004, many actions at 320 px: six actions that do not fit on one line wrap onto further lines inside the band's content box, --ocelle-space-2 apart, with no horizontal scroll and no clipped text, beside the heading above them",
    run: async (driver) => {
      const names = ["one", "two", "three", "four", "five", "six"];
      const many = names.map((name) => `<button id="many-${name}" slot="actions" type="button">Action ${name}</button>`).join("");
      await driver.mount(pageHeader("many", title("many") + many) + probe);
      await driver.viewport(320, 800);
      try {
        const band = await driver.box("many");
        const inset = await tokenPx(driver, "space-6");
        const found = await inOrder(names, (name) => driver.box(`many-${name}`));
        const rows = [...new Set(found.map((action) => tenth(action.y)))];
        const first = found[0];
        const wrapped = found.find((action) => tenth(action.y) === rows[1]);
        const above = found.filter((action) => tenth(action.y) === rows[0]);
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          clipped: (await driver.textBoxes("many")).filter((line) => line.clipped).map((line) => line.text),
          inside: found.every((action) => action.x >= band.x + inset - 0.5 && action.x + action.width <= band.x + band.width - inset + 0.5),
          rows: rows.length > 1,
          rowGap: first === undefined || wrapped === undefined ? "no second row" : await lengthIs(driver, Math.min(...above.map((action) => wrapped.y - (action.y + action.height))), "space-2"),
          headingAbove: (await driver.box("many-heading")).y < (first?.y ?? 0),
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { scrollWidth: true, clipped: [], inside: true, rows: true, rowGap: "space-2", headingAbove: true },
  },
  {
    name: "a hidden host and the border box (FR-001, R-01, Edge Cases): a page header with the hidden attribute has no box and no node, beside its visible twin with its box and its level-1 heading; a page header the page sizes to 600 px is 600 px wide, padding and rule included",
    run: async (driver) => {
      await driver.mount(pageHeader("gone", filled("gone"), " hidden") + pageHeader("shown", filled("shown")) + pageHeader("sized", filled("sized")) + probe);
      const gone = await driver.box("gone");
      const shown = await driver.box("shown");
      await driver.size("sized", 600, null);
      return {
        gone: { display: gone.display, height: gone.height, headings: await headings(driver, "gone") },
        shown: { display: shown.display, height: shown.height > 0, headings: await headings(driver, "shown") },
        sized: { width: tenth((await driver.box("sized")).width), band: await bandOf(driver, "sized", "sized-eyebrow", "sized-description") },
      };
    },
    expected: {
      gone: { display: "none", height: 0, headings: [] },
      shown: { display: "block", height: true, headings: [{ role: "heading", name: "Missions", level: 1 }] },
      sized: { width: 600, band: bandExpected },
    },
  },
  {
    name: "no event (FR-002): mounting, filling and emptying slots and changing size dispatch no event from the page header or its shadow tree, while each step changes its layout",
    run: async (driver) => {
      await driver.listen(["quiet"]);
      await driver.mount(pageHeader("quiet", title("quiet")) + probe);
      const steps: number[] = [];
      const height = async (): Promise<number> => tenth((await driver.box("quiet")).height);
      steps.push(await height());
      await driver.append("quiet", eyebrow("quiet"));
      steps.push(await height());
      await driver.append("quiet", description("quiet"));
      steps.push(await height());
      await driver.remove("quiet-eyebrow");
      steps.push(await height());
      await driver.setAttribute("quiet", "size", "compact");
      steps.push(await height());
      const heard = await driver.heard();
      const changed = steps.slice(1).map((value, index) => value !== steps[index]);
      return { heard, changed };
    },
    expected: { heard: [], changed: [true, true, true, true] },
  },
];
