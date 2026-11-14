// The shared bodies of 011 User Story 1's section-header scenarios (spec US1-1 to US1-6, US1-14, US1-16, US1-17 outside
// a card; FR-002, FR-005, FR-006, FR-008, FR-010 to FR-013, FR-031; research.md R-02 to R-06, R-13; T011). Each body
// observes the page through the driver and returns one observation; each harness asserts it equals `expected`,
// written by hand from the spec: lengths, colours and fonts as the token names the spec gives (scenarios/layout.ts
// reads each token on the same page), the heading levels and names the page slots, and "does not" outcomes always in
// the same body as the positive outcome they guard (spec § "Does not" outcomes are paired; contracts/checks.md
// § Pairing plants):
// - the element adds no heading, landmark or group (US1-1) beside the slotted heading as one node with its level;
//   plant: the template renders `role="heading"`;
// - no `size` or `variant` written on upgrade (US1-1) beside the property set by script reflecting; plant: an
//   initializer `size = "regular"`;
// - an empty part adds no padding, gap or margin (US1-3, US1-16) beside a filled twin with the gaps; plant: the empty
//   wrapper not hidden;
// - the gap follows a content change and no other box moves (US1-4) beside the changed header gaining and losing
//   its gap; plants: slot state read once, a host margin keyed on the slot state;
// - the eyebrow and description are not rendered in the eyebrow variant (US1-5) beside the heading in the eyebrow
//   style and the actions rendered; plant: the two wrappers rendered in the eyebrow variant;
// - an empty heading slot leaves no heading (US1-16) beside the filled twin's heading; plant: the heading wrapper
//   rendered with `role="heading"`;
// - an empty or invalid `size` (US1-17) or `variant` (FR-006) is not set and not rewritten, beside a valid twin drawn
//   in its look; plants: styles keyed on `:host(:not([size="regular"]))`, `:host(:not([variant="default"]))`;
// - no horizontal scroll and no clipped text at 320 px (US1-14) beside the actions stacked under the heading; plants:
//   `flex-wrap: nowrap` on the row, `overflow: hidden` with `white-space: nowrap` on a wrapper;
// - no event (FR-002) across mount, slot and attribute changes, beside the layout change of each step; plant:
//   `dispatchEvent(new Event("change"))` on slot change.
// Every scenario runs at 1280 × 800 px (the in-process file sets the viewport; the fixture opens each page at it).
import type { Scenario } from "./icon.ts";
import type { Box, Driver, Palette } from "./driver.ts";
import { after, below, boxes, inOrder, lengthIs, pick, probe, tenth, tokensOf, treeOf } from "./layout.ts";

export type { Scenario } from "./icon.ts";

/** A section header with `id`, its children and its attributes. */
export const header = (id: string, inner: string, attributes = ""): string => `<ocelle-section-header id="${id}"${attributes}>${inner}</ocelle-section-header>`;

/** The slotted heading `<id>-heading`. */
export const heading = (id: string, text = "Runs", level = 2): string => `<h${String(level)} id="${id}-heading" slot="heading">${text}</h${String(level)}>`;

/** The slotted eyebrow `<id>-eyebrow`, a `span` unless `tag` says otherwise. */
export const eyebrow = (id: string, tag = "span"): string => `<${tag} id="${id}-eyebrow" slot="eyebrow">Mission</${tag}>`;

/** The slotted description `<id>-description`, a `p` (its UA margins are trimmed, FR-008). */
export const description = (id: string): string => `<p id="${id}-description" slot="description">Every run of the mission, newest first.</p>`;

/** Two slotted actions, `<id>-edit` and `<id>-share`, buttons unless `tag` is `a`. */
export function actions(id: string, tag: "button" | "a" = "button"): string {
  const one = (name: string, text: string): string =>
    tag === "a" ? `<a id="${id}-${name}" slot="actions" href="#${id}">${text}</a>` : `<button id="${id}-${name}" slot="actions" type="button">${text}</button>`;
  return one("edit", "Edit") + one("share", "Share");
}

/** Every part filled: eyebrow, heading, description and two actions. */
export const filled = (id: string, eyebrowTag = "span"): string => eyebrow(id, eyebrowTag) + heading(id) + description(id) + actions(id);

/** The heading style of FR-012 at a size token, as `tokensOf` reads it. */
export const headingStyle = (size: "font-size-lg" | "font-size-subhead"): Readonly<Record<string, string>> => ({
  "font-family": "font-display",
  "font-size": size,
  "font-weight": "font-weight-strong",
  "line-height": "line-height-tight",
  color: "color-ink",
  "margin-block-start": "=0px",
  "margin-block-end": "=0px",
});

/** The eyebrow style of FR-031, as `tokensOf` reads it. */
export const eyebrowStyle: Readonly<Record<string, string>> = {
  "font-family": "font-sans",
  "font-size": "font-size-eyebrow",
  "font-weight": "font-weight-eyebrow",
  "letter-spacing": "tracking-eyebrow",
  "line-height": "line-height-normal",
  color: "color-eyebrow",
  "font-variant-numeric": "figures",
  "text-transform": "=uppercase",
  "margin-block-start": "=0px",
  "margin-block-end": "=0px",
};

/** The description style of FR-012, as `tokensOf` reads it. */
export const descriptionStyle: Readonly<Record<string, string>> = {
  "font-size": "font-size-sm",
  color: "color-ink-muted",
  "margin-block-start": "=0px",
  "margin-block-end": "=0px",
};

/** The heading nodes of a subtree: role, name and level. */
async function headings(driver: Driver, id: string): Promise<unknown[]> {
  return (await treeOf(driver, id)).filter((node) => (node as { role: string }).role === "heading");
}

/**
 * The gaps of FR-011 in a filled header `id` (eyebrow to heading, heading to description, heading column to the first
 * action) as token names, and where the actions sit: at the inline end with their block start at the heading's, each as
 * tall as its own content, not stretched to the heading column's block size (R-04's `align-items: flex-start`).
 */
export async function partsOf(driver: Driver, id: string, rtl = false): Promise<unknown> {
  const parts = await boxes(driver, [id, `${id}-eyebrow`, `${id}-heading`, `${id}-description`, `${id}-edit`, `${id}-share`]);
  const host = pick(parts, id);
  const head = pick(parts, `${id}-heading`);
  const edit = pick(parts, `${id}-edit`);
  const share = pick(parts, `${id}-share`);
  const end = rtl ? share.x - host.x : host.x + host.width - (share.x + share.width);
  return {
    eyebrowToHeading: await lengthIs(driver, below(pick(parts, `${id}-eyebrow`), head), "space-1"),
    headingToDescription: await lengthIs(driver, below(head, pick(parts, `${id}-description`)), "space-1"),
    headingToActions: await lengthIs(driver, after(head, edit, rtl), "space-4"),
    betweenActions: await lengthIs(driver, after(edit, share, rtl), "space-2"),
    actionsAtInlineEnd: tenth(end),
    actionsAtHeadingStart: [tenth(edit.y - head.y), tenth(share.y - head.y)],
    actionsShorterThanColumn: [edit, share].map((action) => action.height < below(head, pick(parts, `${id}-description`)) + head.height + pick(parts, `${id}-description`).height),
  };
}

const partsExpected = {
  eyebrowToHeading: "space-1",
  headingToDescription: "space-1",
  headingToActions: "space-4",
  betweenActions: "space-2",
  actionsAtInlineEnd: 0,
  actionsAtHeadingStart: [0, 0],
  actionsShorterThanColumn: [true, true],
};

const themes: readonly Palette[] = ["light", "dark"];

/** The sentinel values of the token-sentinel scenario (research.md R-13): each token a distinct value of its type. */
const sentinels: Readonly<Record<string, string>> = {
  "font-display": '"Sentinel Display", serif',
  "font-sans": '"Sentinel Sans", fantasy',
  "font-size-lg": "27px",
  "font-size-subhead": "25px",
  "font-size-sm": "11px",
  "font-size-eyebrow": "9px",
  "font-weight-strong": "700",
  "font-weight-eyebrow": "300",
  "line-height-tight": "1.5",
  "line-height-normal": "2",
  "color-ink": "rgb(1, 2, 3)",
  "color-ink-muted": "rgb(4, 5, 6)",
  "color-eyebrow": "rgb(7, 8, 9)",
  "tracking-eyebrow": "0.5em",
  figures: "slashed-zero",
  "space-1": "3px",
  "space-2": "5px",
  "space-4": "13px",
};

/** The page rule setting every sentinel on the root. */
export function sentinelRules(values: Readonly<Record<string, string>>): string {
  return `:root { ${Object.entries(values)
    .map(([token, value]) => `--ocelle-${token}: ${value};`)
    .join(" ")} }`;
}

/** What the sentinel scenario reads on a filled header `id` and a compact twin `<id>-c`, and a narrow one `<id>-n`. */
async function sentinelRead(driver: Driver, id: string): Promise<unknown> {
  const read = async (of: string, properties: readonly string[]): Promise<Record<string, string>> =>
    Object.fromEntries(await Promise.all(properties.map(async (property) => [property, await driver.computed(of, property)] as const)));
  const parts = await boxes(driver, [`${id}-eyebrow`, `${id}-heading`, `${id}-description`, `${id}-edit`, `${id}-share`, `${id}-n-heading`, `${id}-n-edit`]);
  const at = (key: string): Box => pick(parts, key);
  return {
    heading: await read(`${id}-heading`, ["font-family", "font-size", "font-weight", "line-height", "color"]),
    compact: await read(`${id}-c-heading`, ["font-size"]),
    eyebrow: await read(`${id}-eyebrow`, ["font-family", "font-size", "font-weight", "letter-spacing", "line-height", "color", "font-variant-numeric"]),
    description: await read(`${id}-description`, ["font-size", "color"]),
    gaps: {
      eyebrowToHeading: tenth(below(at(`${id}-eyebrow`), at(`${id}-heading`))),
      headingToDescription: tenth(below(at(`${id}-heading`), at(`${id}-description`))),
      headingToActions: tenth(after(at(`${id}-heading`), at(`${id}-edit`))),
      betweenActions: tenth(after(at(`${id}-edit`), at(`${id}-share`))),
      wrappedActions: tenth(below(at(`${id}-n-heading`), at(`${id}-n-edit`))),
    },
  };
}

/** The host's own node in its subtree: an element with an `id` is a generic node (scenarios/layout.ts `treeOf`). */
export const host = { role: "generic", name: "" };

export const sectionHeaderScenarios: Scenario[] = [
  {
    name: "US1-1: the tree holds exactly the slotted heading, level 2 for an h2 and level 4 for an h4, the slotted element itself, and no heading, landmark or group of the element's own; upgrade writes no size or variant, and setting each by script reflects it (FR-002, FR-006)",
    run: async (driver) => {
      await driver.mount(header("two", heading("two")) + header("four", heading("four", "Runs", 4)) + probe);
      const tree = { two: await treeOf(driver, "two"), four: await treeOf(driver, "four"), slotted: await driver.ax("two-heading") };
      const upgraded = { size: await driver.attribute("two", "size"), variant: await driver.attribute("two", "variant") };
      await driver.setProperty("four", "size", "compact");
      await driver.setProperty("four", "variant", "eyebrow");
      return { tree, upgraded, reflected: { size: await driver.attribute("four", "size"), variant: await driver.attribute("four", "variant") } };
    },
    expected: {
      tree: {
        two: [host, { role: "heading", name: "Runs", level: 2 }],
        four: [host, { role: "heading", name: "Runs", level: 4 }],
        slotted: [{ role: "heading", name: "Runs", level: 2 }],
      },
      upgraded: { size: null, variant: null },
      reflected: { size: "compact", variant: "eyebrow" },
    },
  },
  ...themes.flatMap((theme) =>
    (["ltr", "rtl"] as const).map((direction) => ({
      name: `US1-2, ${theme}, ${direction}: the eyebrow above the heading, the p description's border box --ocelle-space-1 below the heading's (its UA margin trimmed), the actions at the inline end with their block start at the heading's, the eyebrow and description drawn with their tokens; a p eyebrow takes the same --ocelle-space-1 gap (FR-008, FR-010, FR-011, FR-031)`,
      run: async (driver: Driver) => {
        await driver.mount(header("full", filled("full")) + header("para", filled("para", "p")) + probe);
        await driver.theme(theme);
        if (direction === "rtl") {
          await driver.dir("full", "rtl");
          await driver.dir("para", "rtl");
        }
        const rtl = direction === "rtl";
        return {
          span: await partsOf(driver, "full", rtl),
          p: await partsOf(driver, "para", rtl),
          eyebrow: await tokensOf(driver, "full-eyebrow", eyebrowStyle),
          pEyebrow: await tokensOf(driver, "para-eyebrow", eyebrowStyle),
          description: await tokensOf(driver, "full-description", descriptionStyle),
          heading: await tokensOf(driver, "full-heading", headingStyle("font-size-lg")),
        };
      },
      expected: { span: partsExpected, p: partsExpected, eyebrow: eyebrowStyle, pEyebrow: eyebrowStyle, description: descriptionStyle, heading: headingStyle("font-size-lg") },
    })),
  ),
  {
    name: "US1-3: a header with only a heading is as tall as its heading, with no padding, gap or margin for its empty parts, while a filled header on the same page has the gaps of FR-011 (FR-005, FR-011)",
    run: async (driver) => {
      await driver.mount(header("bare", heading("bare")) + header("full", filled("full")) + probe);
      const bare = await driver.box("bare");
      const bareHeading = await driver.box("bare-heading");
      return { bare: { height: tenth(bare.height - bareHeading.height), top: tenth(bareHeading.y - bare.y), width: tenth(bare.width - bareHeading.width) }, full: await partsOf(driver, "full") };
    },
    expected: { bare: { height: 0, top: 0, width: 0 }, full: partsExpected },
  },
  {
    name: "US1-4: filling an empty actions slot by script adds the actions gap and emptying a filled eyebrow slot removes the eyebrow gap, and the border boxes of every other element on the page are the same before and after (FR-005)",
    run: async (driver) => {
      await driver.mount(`<p id="page-text">The page's own text.</p>` + header("grow", heading("grow")) + header("shrink", eyebrow("shrink") + heading("shrink")) + `<div id="page-after"></div>` + probe);
      const others = ["page-text", "shrink", "shrink-eyebrow", "shrink-heading", "grow", "grow-heading", "page-after"];
      const before = await boxes(driver, others);
      const grow0 = { host: await driver.box("grow"), heading: await driver.box("grow-heading") };
      await driver.append("grow", actions("grow", "a"));
      const afterGrow = await boxes(driver, ["page-text", "shrink", "shrink-eyebrow", "shrink-heading", "page-after"]);
      const grow1 = { heading: await driver.box("grow-heading"), edit: await driver.box("grow-edit") };
      const shrink0 = { host: await driver.box("shrink"), eyebrow: await driver.box("shrink-eyebrow"), heading: await driver.box("shrink-heading") };
      const growBefore = await boxes(driver, ["page-text", "grow", "grow-heading", "grow-edit", "grow-share"]);
      await driver.remove("shrink-eyebrow");
      const shrink1 = { host: await driver.box("shrink"), heading: await driver.box("shrink-heading") };
      const growAfter = await boxes(driver, ["page-text", "grow", "grow-heading", "grow-edit", "grow-share"]);
      const same = (one: Record<string, Box>, two: Record<string, Box>): string[] => Object.keys(two).filter((id) => JSON.stringify(one[id]) !== JSON.stringify(two[id]));
      return {
        grow: {
          before: tenth(grow0.host.width - grow0.heading.width),
          after: await lengthIs(driver, after(grow1.heading, grow1.edit), "space-4"),
          othersMoved: same(before, afterGrow),
        },
        shrink: {
          before: await lengthIs(driver, below(shrink0.eyebrow, shrink0.heading), "space-1"),
          after: tenth(shrink1.heading.y - shrink1.host.y),
          othersMoved: same(growBefore, growAfter),
        },
      };
    },
    expected: { grow: { before: 0, after: "space-4", othersMoved: [] }, shrink: { before: "space-1", after: 0, othersMoved: [] } },
  },
  ...themes.map((theme) => ({
    name: `US1-5, ${theme}: variant="eyebrow" draws the slotted h3 with the eyebrow tokens, keeps one level-3 heading named "Recent" ignoring case and its DOM text "Recent", renders the actions and neither a slotted eyebrow nor description; three eyebrow-variant headers, outside a card, with size="compact" and in a compact card's header slot, share heading style, gap to their actions and block size (FR-013, FR-031)`,
    run: async (driver: Driver) => {
      const recent = (id: string, attributes: string): string => header(id, `<h3 id="${id}-heading" slot="heading">Recent</h3>` + eyebrow(id) + description(id) + actions(id), ` variant="eyebrow"${attributes}`);
      await driver.mount(
        recent("plain", "") +
          '<ul id="list"><li>First run</li><li>Second run</li></ul>' +
          recent("small", ' size="compact"') +
          `<ocelle-card id="card" density="compact">${recent("carded", ' slot="header"')}<p>Body</p></ocelle-card>` +
          probe,
      );
      await driver.theme(theme);
      const tree = (await headings(driver, "plain")).map((node) => {
        const { name, ...rest } = node as { name: string };
        return { ...rest, name: name.toLowerCase() };
      });
      const three = await inOrder(
        ["plain", "small", "carded"], async (id) => {
          const host = await driver.box(id);
          const head = await driver.box(`${id}-heading`);
          return { style: await tokensOf(driver, `${id}-heading`, eyebrowStyle), toActions: await lengthIs(driver, after(head, await driver.box(`${id}-edit`)), "space-4"), height: tenth(host.height) };
        },
      );
      return {
        tree,
        text: (await driver.textBoxes("plain-heading")).map((box) => box.text),
        rendered: {
          eyebrow: (await driver.lines("plain-eyebrow")).length,
          description: (await driver.lines("plain-description")).length,
          actions: [(await driver.lines("plain-edit")).length, (await driver.lines("plain-share")).length],
        },
        styles: three.map((each) => each.style),
        toActions: three.map((each) => each.toActions),
        sameHeight: three.every((each) => each.height === three[0]?.height),
      };
    },
    expected: {
      tree: [{ role: "heading", name: "recent", level: 3 }],
      text: ["Recent"],
      rendered: { eyebrow: 0, description: 0, actions: [1, 1] },
      styles: [eyebrowStyle, eyebrowStyle, eyebrowStyle],
      toActions: ["space-4", "space-4", "space-4"],
      sameHeight: true,
    },
  })),
  {
    name: "US1-6: size=\"compact\" draws the heading at --ocelle-font-size-subhead and the default at --ocelle-font-size-lg, both strong in the display font, and the compact header keeps the gaps of FR-011 (FR-011, FR-012)",
    run: async (driver) => {
      await driver.mount(header("small", filled("small"), ' size="compact"') + header("large", filled("large")) + probe);
      return {
        small: await tokensOf(driver, "small-heading", headingStyle("font-size-subhead")),
        large: await tokensOf(driver, "large-heading", headingStyle("font-size-lg")),
        gaps: await partsOf(driver, "small"),
      };
    },
    expected: { small: headingStyle("font-size-subhead"), large: headingStyle("font-size-lg"), gaps: partsExpected },
  },
  {
    name: "US1-14: at 320 px a compact card's header with a 60-character unbroken heading and two actions has no horizontal scroll and no clipped text, the heading wraps inside the card and the actions sit under the heading column, --ocelle-space-2 below it, at its inline start (FR-004, FR-010)",
    run: async (driver) => {
      const run = `Mission${"x".repeat(60)}end`;
      await driver.mount(`<ocelle-card id="card" density="compact">${header("long", heading("long", run) + actions("long"), ' slot="header"')}<p id="body">Body</p></ocelle-card>` + probe);
      await driver.viewport(320, 800);
      try {
        const card = await driver.box("card");
        const head = await driver.box("long-heading");
        const edit = await driver.box("long-edit");
        const lines = await driver.textBoxes("card");
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          clipped: lines.filter((line) => line.clipped).map((line) => line.text),
          headingInsideCard: head.x >= card.x && head.x + head.width <= card.x + card.width,
          headingWraps: head.height > (await driver.box("long-share")).height * 2,
          actionsBelow: await lengthIs(driver, below(head, edit), "space-2"),
          actionsAtStart: tenth(edit.x - head.x),
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { scrollWidth: true, clipped: [], headingInsideCard: true, headingWraps: true, actionsBelow: "space-2", actionsAtStart: 0 },
  },
  {
    name: "US1-16: a header with an eyebrow, a description and actions but an empty heading slot has no heading box, gap or node, its eyebrow and description --ocelle-space-1 apart, beside a filled twin with both gaps and its level-2 heading (FR-005, FR-011)",
    run: async (driver) => {
      await driver.mount(header("empty", eyebrow("empty") + description("empty") + actions("empty")) + header("full", filled("full")) + probe);
      const full = await boxes(driver, ["full-eyebrow", "full-heading", "full-description"]);
      return {
        empty: { eyebrowToDescription: await lengthIs(driver, below(await driver.box("empty-eyebrow"), await driver.box("empty-description")), "space-1"), headings: await headings(driver, "empty") },
        full: {
          eyebrowToHeading: await lengthIs(driver, below(pick(full, "full-eyebrow"), pick(full, "full-heading")), "space-1"),
          headingToDescription: await lengthIs(driver, below(pick(full, "full-heading"), pick(full, "full-description")), "space-1"),
          headings: await headings(driver, "full"),
        },
      };
    },
    expected: {
      empty: { eyebrowToDescription: "space-1", headings: [] },
      full: { eyebrowToHeading: "space-1", headingToDescription: "space-1", headings: [{ role: "heading", name: "Runs", level: 2 }] },
    },
  },
  {
    name: "FR-005, FR-010: a header with an eyebrow and actions but no heading or description keeps its actions at the inline end, --ocelle-space-1 under the eyebrow; one with an eyebrow and a description only has the description --ocelle-space-1 under the eyebrow; a header with only an eyebrow is as tall as its eyebrow, with no gap under it; beside a filled twin with its gaps",
    run: async (driver) => {
      await driver.mount(header("labelled", eyebrow("labelled") + actions("labelled")) + header("described", eyebrow("described") + description("described")) + header("alone", eyebrow("alone")) + header("full", filled("full")) + probe);
      const host = await driver.box("labelled");
      const share = await driver.box("labelled-share");
      const alone = await driver.box("alone");
      const aloneEyebrow = await driver.box("alone-eyebrow");
      return {
        labelled: { actionsAtInlineEnd: tenth(host.x + host.width - (share.x + share.width)), eyebrowToActions: await lengthIs(driver, below(await driver.box("labelled-eyebrow"), await driver.box("labelled-edit")), "space-1") },
        described: await lengthIs(driver, below(await driver.box("described-eyebrow"), await driver.box("described-description")), "space-1"),
        alone: { height: tenth(alone.height - aloneEyebrow.height), top: tenth(aloneEyebrow.y - alone.y) },
        full: await partsOf(driver, "full"),
      };
    },
    expected: { labelled: { actionsAtInlineEnd: 0, eyebrowToActions: "space-1" }, described: "space-1", alone: { height: 0, top: 0 }, full: partsExpected },
  },
  {
    name: "US1-17, outside a card: size=\"\" and size=\"bogus\" draw the heading at the default size and keep the value the page wrote, beside a size=\"compact\" twin drawn compact (FR-006, FR-012)",
    run: async (driver) => {
      await driver.mount(header("blank", heading("blank"), ' size=""') + header("bogus", heading("bogus"), ' size="bogus"') + header("compact", heading("compact"), ' size="compact"') + probe);
      return {
        blank: await tokensOf(driver, "blank-heading", { "font-size": "font-size-lg" }),
        bogus: await tokensOf(driver, "bogus-heading", { "font-size": "font-size-lg" }),
        compact: await tokensOf(driver, "compact-heading", { "font-size": "font-size-subhead" }),
        kept: [await driver.attribute("blank", "size"), await driver.attribute("bogus", "size")],
      };
    },
    expected: { blank: { "font-size": "font-size-lg" }, bogus: { "font-size": "font-size-lg" }, compact: { "font-size": "font-size-subhead" }, kept: ["", "bogus"] },
  },
  {
    name: "FR-006, variant: variant=\"\" and variant=\"bogus\" draw the default heading style with the eyebrow and description rendered and keep the value the page wrote, beside a variant=\"eyebrow\" twin drawn in the eyebrow style without them",
    run: async (driver) => {
      await driver.mount(header("blank", filled("blank"), ' variant=""') + header("bogus", filled("bogus"), ' variant="bogus"') + header("eyebrowed", filled("eyebrowed"), ' variant="eyebrow"') + probe);
      const look = async (id: string, style: Readonly<Record<string, string>>): Promise<unknown> => ({
        heading: await tokensOf(driver, `${id}-heading`, style),
        rendered: [(await driver.lines(`${id}-eyebrow`)).length, (await driver.lines(`${id}-description`)).length],
      });
      return {
        blank: await look("blank", headingStyle("font-size-lg")),
        bogus: await look("bogus", headingStyle("font-size-lg")),
        eyebrowed: await look("eyebrowed", eyebrowStyle),
        kept: [await driver.attribute("blank", "variant"), await driver.attribute("bogus", "variant")],
      };
    },
    expected: {
      blank: { heading: headingStyle("font-size-lg"), rendered: [1, 1] },
      bogus: { heading: headingStyle("font-size-lg"), rendered: [1, 1] },
      eyebrowed: { heading: eyebrowStyle, rendered: [0, 0] },
      kept: ["", "bogus"],
    },
  },
  {
    name: "token sentinels (research.md R-13): with every token the section header reads set to a distinct sentinel on the root, its heading, compact heading, eyebrow, description and gaps follow each sentinel, and with them removed it draws its default again",
    run: async (driver) => {
      const markup =
        header("s", filled("s")) + header("s-c", heading("s-c"), ' size="compact"') + `<div id="narrow">${header("s-n", heading("s-n", "Release planning overview") + actions("s-n"))}</div>` + probe;
      await driver.mount(markup);
      await driver.size("narrow", 120, null);
      await driver.rules(sentinelRules(sentinels));
      const sentinel = await sentinelRead(driver, "s");
      await driver.mount(markup);
      return {
        sentinel,
        restored: { heading: await tokensOf(driver, "s-heading", headingStyle("font-size-lg")), eyebrow: await tokensOf(driver, "s-eyebrow", eyebrowStyle), gaps: await partsOf(driver, "s") },
      };
    },
    expected: {
      sentinel: {
        heading: { "font-family": '"Sentinel Display", serif', "font-size": "27px", "font-weight": "700", "line-height": "40.5px", color: "rgb(1, 2, 3)" },
        compact: { "font-size": "25px" },
        eyebrow: {
          "font-family": '"Sentinel Sans", fantasy',
          "font-size": "9px",
          "font-weight": "300",
          "letter-spacing": "4.5px",
          "line-height": "18px",
          color: "rgb(7, 8, 9)",
          "font-variant-numeric": "slashed-zero",
        },
        description: { "font-size": "11px", color: "rgb(4, 5, 6)" },
        gaps: { eyebrowToHeading: 3, headingToDescription: 3, headingToActions: 13, betweenActions: 5, wrappedActions: 5 },
      },
      restored: { heading: headingStyle("font-size-lg"), eyebrow: eyebrowStyle, gaps: partsExpected },
    },
  },
  {
    name: "FR-004, many actions at 320 px: six actions that do not fit on one line wrap onto further lines inside the header, --ocelle-space-2 apart, with no horizontal scroll and no clipped text, beside the heading above them",
    run: async (driver) => {
      const many = ["one", "two", "three", "four", "five", "six"].map((name) => `<button id="many-${name}" slot="actions" type="button">Action ${name}</button>`).join("");
      await driver.mount(header("many", heading("many") + many) + probe);
      await driver.viewport(320, 800);
      try {
        const host = await driver.box("many");
        const actions = await inOrder(["one", "two", "three", "four", "five", "six"], (name) => driver.box(`many-${name}`));
        const rows = [...new Set(actions.map((action) => tenth(action.y)))];
        const first = actions[0];
        const wrapped = actions.find((action) => tenth(action.y) === rows[1]);
        const above = actions.filter((action) => tenth(action.y) === rows[0]);
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          clipped: (await driver.textBoxes("many")).filter((line) => line.clipped).map((line) => line.text),
          inside: actions.every((action) => action.x >= host.x - 0.5 && action.x + action.width <= host.x + host.width + 0.5),
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
    name: "a hidden host (FR-001, Edge Cases): a section header with the hidden attribute has no box and no node, beside its visible twin with its box and its level-2 heading",
    run: async (driver) => {
      await driver.mount(header("gone", filled("gone"), " hidden") + header("shown", filled("shown")) + probe);
      const gone = await driver.box("gone");
      const shown = await driver.box("shown");
      return { gone: { display: gone.display, height: gone.height, headings: await headings(driver, "gone") }, shown: { display: shown.display, height: shown.height > 0, headings: await headings(driver, "shown") } };
    },
    expected: { gone: { display: "none", height: 0, headings: [] }, shown: { display: "block", height: true, headings: [{ role: "heading", name: "Runs", level: 2 }] } },
  },
  {
    name: "no event (FR-002): mounting, filling and emptying slots and changing size and variant dispatch no event from the header or its shadow tree, while each step changes its layout",
    run: async (driver) => {
      await driver.listen(["quiet"]);
      await driver.mount(header("quiet", heading("quiet")) + probe);
      const steps: number[] = [];
      const height = async (): Promise<number> => tenth((await driver.box("quiet")).height);
      steps.push(await height());
      await driver.append("quiet", eyebrow("quiet"));
      steps.push(await height());
      await driver.remove("quiet-eyebrow");
      steps.push(await height());
      await driver.setAttribute("quiet", "size", "compact");
      steps.push(await height());
      await driver.setAttribute("quiet", "variant", "eyebrow");
      steps.push(await height());
      const heard = await driver.heard();
      const changed = steps.slice(1).map((value, index) => value !== steps[index]);
      return { heard, changed };
    },
    expected: { heard: [], changed: [true, true, true, true] },
  },
];
