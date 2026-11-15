// The shared bodies of 011 User Story 1's card scenarios (spec US1-7 to US1-13, US1-17 in a card, US1-18, US1-19;
// FR-001 to FR-008, FR-014 to FR-018; research.md R-02, R-03, R-05, R-06, R-08, R-13; T012). Each body observes the
// page through the driver and returns one observation; each harness asserts it equals `expected`, written by hand
// from the spec: lengths, colours and fonts as the token names the spec gives (scenarios/layout.ts reads each token on
// the same page), and "does not" outcomes always in the same body as the positive outcome they guard (spec § "Does
// not" outcomes are paired; contracts/checks.md § Pairing plants):
// - no UA margin at the body's edges, a hidden edge element skipped, and the page's margin between two body
//   paragraphs (US1-7, US1-11) beside the density's gap and padding measured to the slotted `p`; plants: each trim
//   dropped, `:not([hidden])` dropped, `margin-block: 0` on every body element;
// - no header gap without a header (US1-11) beside the header twin's gap; plant: the empty wrapper not hidden;
// - no tab stop of the card's or the header's own (US1-12) beside focus reaching the link and the button in order;
//   plant: a wrapper with `tabindex="0"`;
// - the compact layout holds in forced colours (US1-13) beside the borders drawn in a system colour; plant: the
//   layout rule moved inside `@media not (forced-colors: active)`;
// - an empty or invalid `density` or `size` is not set and not rewritten (US1-17, FR-006) beside a valid twin in its
//   look; plants: `:host(:not([density="regular"]))`, `:host(:not([size="regular"]))`;
// - a header in the body, nested in the header slot or in an inner card is not compacted (US1-18) beside a directly
//   assigned twin compacted; plant: the header resolving from `querySelectorAll` descendants;
// - no node of the card's own (US1-19) beside the slotted `h2` in its subtree; plant: a `role="region"` wrapper;
// - no attribute written on upgrade (FR-006) beside `density` and `inset` set by property reflecting; plant: an
//   initializer;
// - the R-05 transitions: density set then removed by script, a header moved out of the `header` slot by its `slot`
//   attribute and by a DOM move and back, each compact only while assigned to a compact card's `header` slot; plants:
//   no notice on a density change, `previous` dropped;
// - R-05 with a forwarded slot (phase 2 review R4-01): a wrapper's slot forwarded into the `header` slot, whose
//   content changes, does not make the card forget the headers assigned to its own `header` slot: one moved to the
//   body by its `slot` attribute is regular, beside it compact while assigned; plant: `event.target` restored;
// - no event (FR-002) across mount, slot and attribute changes beside the layout change of each step.
// Every scenario runs at 1280 × 800 px (the in-process file sets the viewport; the fixture opens each page at it).
import type { Scenario } from "./icon.ts";
import { systemColours } from "./icon.ts";
import type { Driver, Palette } from "./driver.ts";
import { below, inOrder, lengthIs, probe, sides, tenth, tokenColour, tokenPx, tokensOf, treeOf } from "./layout.ts";
import { header, heading, host, sentinelRules } from "./section-header.ts";

/** A card with `id`, its attributes and its children. */
export const card = (id: string, inner: string, attributes = ""): string => `<ocelle-card id="${id}"${attributes}>${inner}</ocelle-card>`;

/** A section header `<id>-header` in the `header` slot, with the heading `<id>-header-heading`. */
const slotted = (id: string, attributes = ""): string => header(`${id}-header`, heading(`${id}-header`), ` slot="header"${attributes}`);

/** A body paragraph `<id>-<name>`. */
const para = (id: string, name = "body", attributes = ""): string => `<p id="${id}-${name}"${attributes}>Body text of the card.</p>`;

type Density = "regular" | "compact";

const padding: Readonly<Record<Density, string>> = { regular: "space-7", compact: "space-5" };
const gap: Readonly<Record<Density, string>> = { regular: "space-2", compact: "space-4" };

/** The card's box as tokens: its border, radius and padding on every side and its ground. */
async function frame(driver: Driver, id: string, density: Density, ground: "color-sheet" | "color-inset"): Promise<unknown> {
  const pad = await tokenPx(driver, padding[density]);
  const width = await tokenPx(driver, "border-width");
  const colour = await tokenColour(driver, "color-rule");
  const radius = await tokenPx(driver, "radius-row");
  const px = (value: number): string => `${String(value)}px`;
  const all = (values: readonly string[], expected: string, token: string): string => (values.every((value) => value === expected) ? token : values.join(" "));
  return {
    padding: all(await sides(driver, id, (side) => `padding-${side}`), px(pad), padding[density]),
    borderWidth: all(await sides(driver, id, (side) => `border-${side}-width`), px(width), "border-width"),
    borderStyle: all(await sides(driver, id, (side) => `border-${side}-style`), "solid", "solid"),
    borderColour: all(await sides(driver, id, (side) => `border-${side}-color`), colour, "color-rule"),
    radius: all(
      await Promise.all(["top-left", "top-right", "bottom-right", "bottom-left"].map((corner) => driver.computed(id, `border-${corner}-radius`))),
      px(radius),
      "radius-row",
    ),
    ground: (await driver.computed(id, "background-color")) === (await tokenColour(driver, ground)) ? ground : await driver.computed(id, "background-color"),
  };
}

const frameExpected = (density: Density, ground: "color-sheet" | "color-inset"): unknown => ({
  padding: padding[density],
  borderWidth: "border-width",
  borderStyle: "solid",
  borderColour: "color-rule",
  radius: "radius-row",
  ground,
});

/** The padding edges of a card: its border box less its border and padding, as `{ top, bottom, start }`. */
async function contentEdges(driver: Driver, id: string): Promise<{ top: number; bottom: number; start: number }> {
  const box = await driver.box(id);
  const value = async (property: string): Promise<number> => Number.parseFloat(await driver.computed(id, property));
  return {
    top: box.y + (await value("border-top-width")) + (await value("padding-top")),
    bottom: box.y + box.height - (await value("border-bottom-width")) - (await value("padding-bottom")),
    start: box.x + (await value("border-left-width")) + (await value("padding-left")),
  };
}

/** Where a card's header and body paragraphs sit: the gap under the header, and each body edge to the padding edge. */
async function flow(driver: Driver, id: string, density: Density, first: string, last = first): Promise<unknown> {
  const edges = await contentEdges(driver, id);
  const top = await driver.box(first);
  const end = await driver.box(last);
  return {
    headerToBody: await lengthIs(driver, below(await driver.box(`${id}-header`), top), gap[density]),
    bodyEndAtPaddingEdge: tenth(edges.bottom - (end.y + end.height)),
  };
}

const flowExpected = (density: Density): unknown => ({ headerToBody: gap[density], bodyEndAtPaddingEdge: 0 });

/** The font size of a slotted header's heading, as the size token it equals. */
async function headingSize(driver: Driver, id: string, token: "font-size-lg" | "font-size-subhead"): Promise<string> {
  return (await tokensOf(driver, id, { "font-size": token }))["font-size"] ?? "";
}

/** The size a slotted header's heading is drawn at: `compact`, `regular`, or the font size when it is neither. */
async function drawnSize(driver: Driver, id: string): Promise<string> {
  const size = await driver.computed(id, "font-size");
  await driver.style("probe", "font-size", "var(--ocelle-font-size-subhead)");
  if (size === (await driver.computed("probe", "font-size"))) return "compact";
  await driver.style("probe", "font-size", "var(--ocelle-font-size-lg)");
  return size === (await driver.computed("probe", "font-size")) ? "regular" : size;
}

const themes: readonly Palette[] = ["light", "dark"];
const densities: readonly Density[] = ["regular", "compact"];

/** The sentinel values of the card's token-sentinel scenario (research.md R-13). */
const sentinels: Readonly<Record<string, string>> = {
  "border-width": "3px",
  "color-rule": "rgb(11, 12, 13)",
  "radius-row": "9px",
  "color-sheet": "rgb(21, 22, 23)",
  "color-inset": "rgb(31, 32, 33)",
  "space-2": "5px",
  "space-4": "13px",
  "space-5": "17px",
  "space-7": "29px",
};

export const cardScenarios: Scenario[] = [
  ...themes.map((theme) => ({
    name: `US1-7, ${theme}: the default card has a --ocelle-border-width border in --ocelle-color-rule, --ocelle-radius-row corners, the sheet ground, --ocelle-space-7 padding and --ocelle-space-2 from the header to the slotted p, which ends at the padding edge; two body p keep the page's margin between them; a hidden p at each body edge is skipped by the trim (FR-008, FR-014, FR-015)`,
    run: async (driver: Driver) => {
      await driver.mount(
        card("one", slotted("one") + para("one")) +
          card("two", slotted("two") + para("two", "first") + para("two", "second")) +
          card("hid", slotted("hid") + para("hid", "before", " hidden") + para("hid") + para("hid", "after", " hidden")) +
          '<p id="page-p">The page paragraph.</p>' +
          probe,
      );
      await driver.theme(theme);
      const first = await driver.box("two-first");
      const second = await driver.box("two-second");
      return {
        frame: await frame(driver, "one", "regular", "color-sheet"),
        one: await flow(driver, "one", "regular", "one-body"),
        two: { ...((await flow(driver, "two", "regular", "two-first", "two-second")) as object), between: tenth(below(first, second)) === Number.parseFloat(await driver.computed("page-p", "margin-block-end")) },
        hidden: await flow(driver, "hid", "regular", "hid-body"),
      };
    },
    expected: { frame: frameExpected("regular", "color-sheet"), one: flowExpected("regular"), two: { ...(flowExpected("regular") as object), between: true }, hidden: flowExpected("regular") },
  })),
  {
    name: "US1-8: density=\"compact\" gives --ocelle-space-5 padding and a --ocelle-space-4 header gap with the same border and radius, and its slotted section header is drawn compact without the page setting size (FR-015, FR-017)",
    run: async (driver) => {
      await driver.mount(card("small", slotted("small") + para("small"), ' density="compact"') + probe);
      return {
        frame: await frame(driver, "small", "compact", "color-sheet"),
        flow: await flow(driver, "small", "compact", "small-body"),
        header: await headingSize(driver, "small-header-heading", "font-size-subhead"),
        size: await driver.attribute("small-header", "size"),
      };
    },
    expected: { frame: frameExpected("compact", "color-sheet"), flow: flowExpected("compact"), header: "font-size-subhead", size: null },
  },
  {
    name: "US1-9: a header's own size wins over the card: size=\"regular\" in a compact card is drawn regular, size=\"compact\" in a regular card compact (FR-017)",
    run: async (driver) => {
      await driver.mount(card("small", slotted("small", ' size="regular"') + para("small"), ' density="compact"') + card("large", slotted("large", ' size="compact"') + para("large")) + probe);
      return { inCompact: await drawnSize(driver, "small-header-heading"), inRegular: await drawnSize(driver, "large-header-heading") };
    },
    expected: { inCompact: "regular", inRegular: "compact" },
  },
  ...themes.map((theme) => ({
    name: `US1-10, ${theme}: inset written empty, as "inset" and set by script, in each density, draws the inset ground with its density's padding, gap, border and radius; a card without inset is on the sheet; the scripted one reflects inset, and removing the attribute from each draws it on the sheet (FR-006, FR-016)`,
    run: async (driver: Driver) => {
      const cards = densities.flatMap((density) => {
        const attributes = density === "compact" ? ' density="compact"' : "";
        return [
          card(`${density}-empty`, slotted(`${density}-empty`) + para(`${density}-empty`), `${attributes} inset`),
          card(`${density}-named`, slotted(`${density}-named`) + para(`${density}-named`), `${attributes} inset="inset"`),
          card(`${density}-script`, slotted(`${density}-script`) + para(`${density}-script`), attributes),
        ];
      });
      await driver.mount(cards.join("") + card("plain", slotted("plain") + para("plain")) + probe);
      await driver.theme(theme);
      for (const density of densities) await driver.setProperty(`${density}-script`, "inset", true as unknown as string);
      const ids = densities.flatMap((density) => ["empty", "named", "script"].map((way) => ({ density, id: `${density}-${way}` })));
      const inset = await inOrder(ids, async ({ density, id }) => ({ frame: await frame(driver, id, density, "color-inset"), flow: await flow(driver, id, density, `${id}-body`) }));
      const reflected = await Promise.all(densities.map((density) => driver.attribute(`${density}-script`, "inset")));
      const plain = await frame(driver, "plain", "regular", "color-sheet");
      for (const { id } of ids) await driver.setAttribute(id, "inset", null);
      const removed = await inOrder(ids, async ({ id }) => ((await driver.computed(id, "background-color")) === (await tokenColour(driver, "color-sheet")) ? "color-sheet" : "not the sheet"));
      return { inset, reflected, plain, removed };
    },
    expected: {
      inset: densities.flatMap((density) => [0, 1, 2].map(() => ({ frame: frameExpected(density, "color-inset"), flow: flowExpected(density) }))),
      reflected: ["", ""],
      plain: frameExpected("regular", "color-sheet"),
      removed: ["color-sheet", "color-sheet", "color-sheet", "color-sheet", "color-sheet", "color-sheet"],
    },
  })),
  ...densities.map((density) => ({
    name: `US1-11, ${density}: a card with no header starts its body p at the padding edge with no header gap and no UA margin, while its twin with a header has the density's gap (FR-005, FR-008)`,
    run: async (driver: Driver) => {
      const attributes = density === "compact" ? ' density="compact"' : "";
      await driver.mount(card("bare", para("bare"), attributes) + card("full", slotted("full") + para("full"), attributes) + probe);
      const edges = await contentEdges(driver, "bare");
      const body = await driver.box("bare-body");
      return { bare: { top: tenth(body.y - edges.top), start: tenth(body.x - edges.start), end: tenth(edges.bottom - (body.y + body.height)) }, full: await flow(driver, "full", density, "full-body") };
    },
    expected: { bare: { top: 0, start: 0, end: 0 }, full: flowExpected(density) },
  })),
  ...densities.map((density) => ({
    name: `FR-005, ${density}: a card with a header and no body, or a body of whitespace only, ends its header at the padding edge with no gap under it, while its twin with a body has the density's gap (FR-014)`,
    run: async (driver: Driver) => {
      const attributes = density === "compact" ? ' density="compact"' : "";
      await driver.mount(card("headed", slotted("headed"), attributes) + card("blank", `${slotted("blank")}   \n  `, attributes) + card("full", slotted("full") + para("full"), attributes) + probe);
      const end = async (id: string): Promise<number> => tenth((await contentEdges(driver, id)).bottom - ((await driver.box(`${id}-header`)).y + (await driver.box(`${id}-header`)).height));
      return { headed: await end("headed"), blank: await end("blank"), full: await flow(driver, "full", density, "full-body") };
    },
    expected: { headed: 0, blank: 0, full: flowExpected(density) },
  })),
  {
    name: "US1-12: tabbing through a compact card holding a link and a button, drawn with its compact padding and compact header, moves focus to the header's action, the link and then the button in document order; the card, its section header and their shadow roots add no tab stop (FR-002)",
    run: async (driver) => {
      await driver.mount(
        card(
          "tabs",
          header("tabs-header", heading("tabs-header") + '<button id="action" slot="actions" type="button">Edit</button>', ' slot="header"') + '<p id="tabs-body">Body with <a id="link" href="#tabs">a link</a> and <button id="button" type="button">a button</button>.</p>',
          ' density="compact"',
        ) + probe,
      );
      const order = [];
      for (let press = 0; press < 3; press += 1) {
        await driver.tab();
        order.push(await driver.activeElement());
      }
      return { drawn: { frame: await frame(driver, "tabs", "compact", "color-sheet"), header: await drawnSize(driver, "tabs-header-heading") }, order };
    },
    expected: {
      drawn: { frame: frameExpected("compact", "color-sheet"), header: "compact" },
      order: [
        { name: "button", id: "action", hosts: [] },
        { name: "a", id: "link", hosts: [] },
        { name: "button", id: "button", hosts: [] },
      ],
    },
  },
  ...themes.map((palette) => ({
    name: `US1-13, forced colours with the ${palette} palette: a regular and an inset card draw their borders in the system text colour, unlike their ground, and alike; the slotted heading, eyebrow and description are drawn in the system text colour; a compact card keeps its padding, gap and compact header (FR-001, FR-003, FR-016)`,
    run: async (driver: Driver) => {
      await driver.mount(
        card("regular", slotted("regular") + para("regular")) +
          card("inset", slotted("inset") + para("inset"), " inset") +
          header("words", '<span id="words-eyebrow" slot="eyebrow">Mission</span>' + heading("words") + '<p id="words-description" slot="description">Runs.</p>') +
          card("small", slotted("small") + para("small"), ' density="compact"') +
          probe,
      );
      await driver.forcedColors("active", palette);
      try {
        const look = async (id: string): Promise<unknown> => ({ border: await sides(driver, id, (side) => `border-${side}-color`), ground: await driver.computed(id, "background-color") });
        const text = systemColours[palette].CanvasText;
        const canvas = await driver.resolveColour("Canvas");
        const regular = (await look("regular")) as { border: string[]; ground: string };
        return {
          border: regular.border.every((colour) => colour === text) ? "CanvasText" : regular.border,
          borderUnlikeCanvas: text !== canvas,
          insetLikeRegular: JSON.stringify(await look("inset")) === JSON.stringify(regular),
          words: await Promise.all(["words-heading", "words-eyebrow", "words-description"].map(async (id) => ((await driver.computed(id, "color")) === text ? "CanvasText" : await driver.computed(id, "color")))),
          compact: { frame: (await tokensOf(driver, "small", { "padding-top": padding.compact, "padding-left": padding.compact })), flow: await flow(driver, "small", "compact", "small-body"), header: await drawnSize(driver, "small-header-heading") },
        };
      } finally {
        await driver.forcedColors("none");
      }
    },
    expected: {
      border: "CanvasText",
      borderUnlikeCanvas: true,
      insetLikeRegular: true,
      words: ["CanvasText", "CanvasText", "CanvasText"],
      compact: { frame: { "padding-top": "space-5", "padding-left": "space-5" }, flow: flowExpected("compact"), header: "compact" },
    },
  })),
  {
    name: "US1-17, in a card: a compact card's slotted headers with size=\"\" and size=\"bogus\" are drawn compact, the card deciding, and keep the value the page wrote (FR-006, FR-017)",
    run: async (driver) => {
      await driver.mount(card("blank", slotted("blank", ' size=""') + para("blank"), ' density="compact"') + card("bogus", slotted("bogus", ' size="bogus"') + para("bogus"), ' density="compact"') + probe);
      return {
        drawn: [await drawnSize(driver, "blank-header-heading"), await drawnSize(driver, "bogus-header-heading")],
        kept: [await driver.attribute("blank-header", "size"), await driver.attribute("bogus-header", "size")],
      };
    },
    expected: { drawn: ["compact", "compact"], kept: ["", "bogus"] },
  },
  {
    name: "US1-18: only a section header assigned to a compact card's own header slot is compact: one in an inner card's header slot, one in the compact card's body and one inside a div in its header slot are drawn at the default size, and the inner card at its own regular density, beside a directly assigned twin drawn compact (FR-017)",
    run: async (driver) => {
      await driver.mount(
        card(
          "outer",
          slotted("outer") +
            `<div slot="header">${header("nested", heading("nested"))}</div>` +
            card("inner", slotted("inner") + para("inner")) +
            header("body", heading("body")),
          ' density="compact"',
        ) + probe,
      );
      return {
        direct: await drawnSize(driver, "outer-header-heading"),
        inner: await drawnSize(driver, "inner-header-heading"),
        body: await drawnSize(driver, "body-heading"),
        nested: await drawnSize(driver, "nested-heading"),
        innerCard: await tokensOf(driver, "inner", { "padding-top": "space-7" }),
      };
    },
    expected: { direct: "compact", inner: "regular", body: "regular", nested: "regular", innerCard: { "padding-top": "space-7" } },
  },
  {
    name: "US1-19: in each density, with and without inset, each card drawn in its variant, a card's subtree holds only its slotted content, the h2 heading where it has a header and the body paragraph, and no region, article, group or other node of the card's own (FR-018)",
    run: async (driver) => {
      const variants = densities.flatMap((density) => ["", " inset"].map((inset) => `${density === "compact" ? ' density="compact"' : ""}${inset}`));
      await driver.mount(variants.map((attributes, index) => card(`with-${String(index)}`, slotted(`with-${String(index)}`) + para(`with-${String(index)}`), attributes) + card(`without-${String(index)}`, para(`without-${String(index)}`), attributes)).join("") + probe);
      const looks: readonly [Density, "color-sheet" | "color-inset"][] = [
        ["regular", "color-sheet"],
        ["regular", "color-inset"],
        ["compact", "color-sheet"],
        ["compact", "color-inset"],
      ];
      return inOrder(variants, async (_, index) => {
        const [density, ground] = looks[index] ?? ["regular", "color-sheet"];
        return {
          drawn: [await frame(driver, `with-${String(index)}`, density, ground), await frame(driver, `without-${String(index)}`, density, ground)],
          with: await treeOf(driver, `with-${String(index)}`),
          without: await treeOf(driver, `without-${String(index)}`),
        };
      });
    },
    expected: ([
      ["regular", "color-sheet"],
      ["regular", "color-inset"],
      ["compact", "color-sheet"],
      ["compact", "color-inset"],
    ] as const).map(([density, ground]) => ({
      drawn: [frameExpected(density, ground), frameExpected(density, ground)],
      with: [host, host, { role: "heading", name: "Runs", level: 2 }, { role: "paragraph", name: "" }],
      without: [host, { role: "paragraph", name: "" }],
    })),
  },
  {
    name: "FR-006, density: density=\"\" and density=\"bogus\" draw the regular padding and gap with the header at the default size and keep the value the page wrote, beside a density=\"compact\" twin drawn compact; a card with no density or inset carries neither after upgrade, and density and inset set by property reflect",
    run: async (driver) => {
      await driver.mount(
        card("blank", slotted("blank") + para("blank"), ' density=""') +
          card("bogus", slotted("bogus") + para("bogus"), ' density="bogus"') +
          card("compact", slotted("compact") + para("compact"), ' density="compact"') +
          card("bare", slotted("bare") + para("bare")) +
          probe,
      );
      const look = async (id: string, density: Density): Promise<unknown> => ({
        padding: (await tokensOf(driver, id, { "padding-top": padding[density] }))["padding-top"],
        flow: await flow(driver, id, density, `${id}-body`),
        header: await drawnSize(driver, `${id}-header-heading`),
      });
      const observed = {
        blank: await look("blank", "regular"),
        bogus: await look("bogus", "regular"),
        compact: await look("compact", "compact"),
        kept: [await driver.attribute("blank", "density"), await driver.attribute("bogus", "density")],
        upgraded: [await driver.attribute("bare", "density"), await driver.attribute("bare", "inset")],
      };
      await driver.setProperty("bare", "density", "compact");
      await driver.setProperty("bare", "inset", true as unknown as string);
      return { ...observed, reflected: [await driver.attribute("bare", "density"), await driver.attribute("bare", "inset")] };
    },
    expected: {
      blank: { padding: "space-7", flow: flowExpected("regular"), header: "regular" },
      bogus: { padding: "space-7", flow: flowExpected("regular"), header: "regular" },
      compact: { padding: "space-5", flow: flowExpected("compact"), header: "compact" },
      kept: ["", "bogus"],
      upgraded: [null, null],
      reflected: ["compact", ""],
    },
  },
  {
    name: "R-05 transitions: a header is compact once the card's density is set to compact by script and regular once it is removed; moved to the body by its slot attribute it is regular, and compact again moved back; moved out of the card by a DOM move it is regular, and compact again moved back (FR-017)",
    run: async (driver) => {
      await driver.mount(card("moving", slotted("moving") + para("moving")) + '<div id="outside"></div>' + probe);
      const states: string[] = [await drawnSize(driver, "moving-header-heading")];
      await driver.setProperty("moving", "density", "compact");
      states.push(await drawnSize(driver, "moving-header-heading"));
      await driver.setAttribute("moving", "density", null);
      states.push(await drawnSize(driver, "moving-header-heading"));
      await driver.setAttribute("moving", "density", "compact");
      states.push(await drawnSize(driver, "moving-header-heading"));
      await driver.setAttribute("moving-header", "slot", null);
      states.push(await drawnSize(driver, "moving-header-heading"));
      await driver.setAttribute("moving-header", "slot", "header");
      states.push(await drawnSize(driver, "moving-header-heading"));
      await driver.move("moving-header", "outside");
      states.push(await drawnSize(driver, "moving-header-heading"));
      await driver.move("moving-header", "moving");
      states.push(await drawnSize(driver, "moving-header-heading"));
      return states;
    },
    expected: ["regular", "compact", "regular", "compact", "regular", "compact", "regular", "compact"],
  },
  {
    name: "R-05 forwarded slot (phase 2 review R4-01): in a wrapper's shadow root that forwards its own slot into a compact card's header slot, a section header assigned directly to that slot is compact; after the forwarded slot's content changes, the header moved to the body by its slot attribute is drawn at the default size, and compact again moved back (FR-017)",
    run: async (driver) => {
      await driver.mount('<div id="wrap"></div>' + probe);
      await driver.shadow("wrap", card("fw", '<slot name="extra" slot="header"></slot>', ' density="compact"'));
      const size = async (): Promise<string> => {
        const drawn = await driver.shadowComputed("wrap", "#fw-header-heading", "font-size");
        await driver.style("probe", "font-size", "var(--ocelle-font-size-subhead)");
        if (drawn === (await driver.computed("probe", "font-size"))) return "compact";
        await driver.style("probe", "font-size", "var(--ocelle-font-size-lg)");
        return drawn === (await driver.computed("probe", "font-size")) ? "regular" : drawn;
      };
      await driver.shadowAppend("wrap", "#fw", header("fw-header", heading("fw-header", "Runs", 3), ' slot="header"'));
      const states: string[] = [await size()];
      await driver.append("wrap", '<span id="extra" slot="extra">Extra</span>');
      states.push(await size());
      await driver.shadowAttribute("wrap", "#fw-header", "slot", null);
      states.push(await size());
      await driver.shadowAttribute("wrap", "#fw-header", "slot", "header");
      states.push(await size());
      return states;
    },
    expected: ["compact", "compact", "regular", "compact"],
  },
  {
    name: "token sentinels (research.md R-13): with every token the card reads set to a distinct sentinel on the root, its border, radius, grounds, padding and gaps follow each sentinel in both densities, and with them removed it draws its default again",
    run: async (driver) => {
      const markup = card("s", slotted("s") + para("s")) + card("s-c", slotted("s-c") + para("s-c"), ' density="compact" inset') + probe;
      await driver.mount(markup);
      await driver.rules(sentinelRules(sentinels));
      const read = async (id: string): Promise<unknown> => ({
        border: [await driver.computed(id, "border-top-width"), await driver.computed(id, "border-top-color"), await driver.computed(id, "border-top-left-radius")],
        ground: await driver.computed(id, "background-color"),
        padding: await driver.computed(id, "padding-top"),
        gap: tenth(below(await driver.box(`${id}-header`), await driver.box(`${id}-body`))),
      });
      const sentinel = { regular: await read("s"), compact: await read("s-c") };
      await driver.mount(markup);
      return { sentinel, restored: { regular: await frame(driver, "s", "regular", "color-sheet"), compact: await frame(driver, "s-c", "compact", "color-inset") } };
    },
    expected: {
      sentinel: {
        regular: { border: ["3px", "rgb(11, 12, 13)", "9px"], ground: "rgb(21, 22, 23)", padding: "29px", gap: 5 },
        compact: { border: ["3px", "rgb(11, 12, 13)", "9px"], ground: "rgb(31, 32, 33)", padding: "17px", gap: 13 },
      },
      restored: { regular: frameExpected("regular", "color-sheet"), compact: frameExpected("compact", "color-inset") },
    },
  },
  {
    name: "a hidden host and the border box (FR-001, R-01, Edge Cases): a card with the hidden attribute has no box and no node, beside its visible twin; a card the page sizes to 400 px is 400 px wide, border and padding included, in each density",
    run: async (driver) => {
      await driver.mount(card("gone", slotted("gone") + para("gone"), " hidden") + card("shown", slotted("shown") + para("shown")) + card("small", slotted("small") + para("small"), ' density="compact"') + probe);
      const gone = await driver.box("gone");
      await driver.size("shown", 400, null);
      await driver.size("small", 400, null);
      return {
        gone: { display: gone.display, height: gone.height, tree: await treeOf(driver, "gone") },
        sized: [tenth((await driver.box("shown")).width), tenth((await driver.box("small")).width)],
        shownTree: await treeOf(driver, "shown"),
      };
    },
    expected: { gone: { display: "none", height: 0, tree: [] }, sized: [400, 400], shownTree: [host, host, { role: "heading", name: "Runs", level: 2 }, { role: "paragraph", name: "" }] },
  },
  {
    name: "no event (FR-002): mounting, filling and emptying the header slot and changing density and inset dispatch no event from the card or its shadow tree, while each step changes its layout",
    run: async (driver) => {
      await driver.listen(["quiet"]);
      await driver.mount(card("quiet", para("quiet")) + probe);
      const steps: string[] = [];
      const layout = async (): Promise<string> => {
        const box = await driver.box("quiet");
        return `${String(tenth(box.height))} ${await driver.computed("quiet", "padding-top")} ${await driver.computed("quiet", "background-color")}`;
      };
      steps.push(await layout());
      await driver.append("quiet", slotted("quiet"));
      steps.push(await layout());
      await driver.remove("quiet-header");
      steps.push(await layout());
      await driver.setAttribute("quiet", "density", "compact");
      steps.push(await layout());
      await driver.setAttribute("quiet", "inset", "");
      steps.push(await layout());
      const heard = await driver.heard();
      return { heard, changed: steps.slice(1).map((value, index) => value !== steps[index]) };
    },
    expected: { heard: [], changed: [true, true, true, true] },
  },
];
