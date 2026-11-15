// The shared bodies of 011 User Story 3's context-sidebar scenarios (spec US3-1 to US3-13; FR-001 to FR-008, FR-020 to
// FR-023, FR-028; research.md R-02, R-03, R-09, R-11, R-13; T033). Each body observes the page through the driver and
// returns one observation; each harness asserts it equals `expected`, written by hand from the spec: lengths and
// colours as the token names the spec gives (scenarios/layout.ts reads each token on the same page), the landmark
// names the page sets, and "does not" outcomes always in the same body as the positive outcome they guard (spec
// § "Does not" outcomes are paired; contracts/checks.md § Pairing plants):
// - an empty part has no padding, gap or divider (US3-5, US3-13) beside a filled twin with them; plant: the wrapper of
//   an empty slot not hidden;
// - the divider and padding follow a content change (US3-6) beside the change that adds them; plant: slot state read
//   once at first render;
// - no divider between sections in a one-section sidebar, none before the first section (US3-7, US3-3) beside the
//   four dividers of US3-3; plant: the first-section rule dropped;
// - hidden sections draw no box, padding or divider (US3-3) beside the one divider between the two visible ones;
//   plants: `:not([hidden])` dropped from the section rules, and from the first-section rule only;
// - a `template` or `script` in the default slot draws no box, padding or divider (US3-3's template variant) beside
//   the one divider between the two visible sections, and a slot of only a `template` keeps the head and footer
//   dividers, meeting; plants: `:not(template, script)` dropped from the section rules, and from the first-section
//   rule only;
// - a page reset does not change a section's padding, inline margins, divider or display (US3-3) beside the same four
//   dividers and padding as with no page rule; plant: each `!important` dropped in turn;
// - no UA margin on slotted `p` and `ul` content, a hidden edge element taking no trim (FR-008) beside each border box
//   `--ocelle-space-4` inside its part; plants: each reset dropped, `:not([hidden])` dropped from the edge rules;
// - the footer does not overlap the last section and the sidebar is not held at a shorter container's size (US3-4)
//   beside the sidebar filling 600 px flex-row and grid containers; plants: `max-block-size: 100%` on the layout
//   container, `align-self: start` dropped;
// - no divider for text in the default slot (US3-11) beside the one divider at the second section;
// - no tab stop of the element's own (US3-8) beside focus reaching each slotted link in order;
// - no horizontal scroll and no clipped text at 320 px (US3-10) beside the parts stacked in order;
// - one navigation landmark per sidebar, no other node carrying its name, a blank host `aria-label` leaving it
//   unnamed, the host `aria-label` never written or removed (US3-1, US3-12, FR-028) beside the named landmarks;
//   plants: an inner `<nav>` with the name, the element replacing a blank host `aria-label`, the element writing
//   `aria-label` from `label`;
// - no event (FR-002) across mount, slot and property changes, beside the change each step makes.
// A divider is read from the rendered pixels of the sidebar's border box: a run of pixel rows every pixel of which is
// the divider's colour, so a run spans the sidebar's whole inline size by construction. Every scenario runs at
// 1280 × 800 px unless it sets the viewport itself.
import type { Scenario } from "./icon.ts";
import { systemColours } from "./icon.ts";
import type { Box, Driver, Palette } from "./driver.ts";
import { boxes, inOrder, lengthIs, pick, probe, sides, tenth, tokenColour, tokenPx, tokensOf } from "./layout.ts";
import { sentinelRules } from "./section-header.ts";

export type { Scenario } from "./icon.ts";

/** A context sidebar with `id`, its children and its attributes. */
export const sidebar = (id: string, inner: string, attributes = ""): string => `<ocelle-context-sidebar id="${id}"${attributes}>${inner}</ocelle-context-sidebar>`;

/** A container `<id>-box` around `inner`; the scenario sizes it. */
const box = (id: string, inner: string): string => `<div id="${id}-box">${inner}</div>`;

/** The slotted head `<id>-head`, a `p`. */
export const head = (id: string): string => `<p id="${id}-head" slot="head">Kitty team</p>`;

/** The slotted footer `<id>-footer`, a `p`. */
export const footer = (id: string): string => `<p id="${id}-footer" slot="footer">3 of 5 missions done</p>`;

/** The section `<id>-s<n>` in the default slot, a `div` unless `tag` says otherwise. */
export function section(id: string, n: number, tag = "div"): string {
  const sid = `${id}-s${String(n)}`;
  switch (tag) {
    case "ul":
      return `<ul id="${sid}"><li><a href="#${sid}">Overview</a></li><li><a href="#${sid}">Members</a></li></ul>`;
    case "ocelle-section-header":
      return `<ocelle-section-header id="${sid}"><h3 slot="heading">Section ${String(n)}</h3></ocelle-section-header>`;
    default:
      return `<${tag} id="${sid}">Section ${String(n)}</${tag}>`;
  }
}

/** The ids of sections 1 to `count` of sidebar `id`. */
const ids = (id: string, count = 3): string[] => Array.from({ length: count }, (_, at) => `${id}-s${String(at + 1)}`);

/** A head, three sections of `tag` and a footer. */
export const full = (id: string, tag = "div"): string => head(id) + section(id, 1, tag) + section(id, 2, tag) + section(id, 3, tag) + footer(id);

/** A CSS colour `rgb(r, g, b)` as its three channels. */
function channels(colour: string): number[] {
  const found = /rgba?\((\d+), (\d+), (\d+)/.exec(colour);
  if (found === null) throw new Error(`not an rgb() colour: ${colour}`);
  return [found[1], found[2], found[3]].map(Number);
}

/**
 * The dividers drawn across sidebar `id`: each run of pixel rows of its border box every pixel of which is `colour`,
 * as the run's block offset from the host's block start and its thickness, in px. A column the border box covers
 * only in part is not read.
 */
export async function runsOf(driver: Driver, id: string, colour: string): Promise<{ readonly at: number; readonly thickness: number }[]> {
  const image = await driver.pixels(id);
  const host = await driver.box(id);
  const [r, g, b] = channels(colour);
  // A column the box covers only in part (a fractional edge) shows the page behind it too, so it is left out.
  const from = Number.isInteger(host.x) ? 0 : 1;
  const to = Number.isInteger(host.x + host.width) ? image.width : image.width - 1;
  const runs: { at: number; thickness: number }[] = [];
  for (let y = 0; y < image.height; y++) {
    let ruled = to > from;
    for (let x = from; x < to && ruled; x++) {
      const at = (y * image.width + x) * 4;
      ruled = image.data[at] === r && image.data[at + 1] === g && image.data[at + 2] === b;
    }
    const last = runs.at(-1);
    if (ruled && last !== undefined && last.at + last.thickness === y) last.thickness += 1;
    else if (ruled) runs.push({ at: y, thickness: 1 });
  }
  return runs;
}

/**
 * Where the dividers of sidebar `id` lie, as the names of `places` (block positions on the page, a divider's block
 * start) they lie at, in order, to within a pixel; a divider at no place is named by its offset. With the thickness of
 * each, as a token name when it is `--ocelle-border-width`.
 */
export async function dividersOf(driver: Driver, id: string, places: Readonly<Record<string, number>>, colour?: string): Promise<{ readonly at: string[]; readonly thickness: string[] }> {
  const host = await driver.box(id);
  const runs = await runsOf(driver, id, colour ?? (await tokenColour(driver, "color-rule")));
  const named = runs.map((run) => Object.entries(places).find(([, y]) => Math.abs(y - host.y - run.at) < 1)?.[0] ?? `at ${String(run.at)}px`);
  return { at: named, thickness: await inOrder(runs, (run) => lengthIs(driver, run.thickness, "border-width")) };
}

/** The parts of a sidebar a layout read measures: the head and footer `p` ids, and the visible sections' ids. */
interface Parts {
  readonly head?: string;
  readonly sections: readonly string[];
  readonly footer?: string;
}

/** The divider places of a sidebar of `parts` (FR-022): after the head's padding, at each later section, after the last. */
async function placesOf(driver: Driver, parts: Parts, read: Readonly<Record<string, Box>>): Promise<Record<string, number>> {
  const space = await tokenPx(driver, "space-4");
  const places: Record<string, number> = {};
  if (parts.head !== undefined) places.head = pick(read, parts.head).y + pick(read, parts.head).height + space;
  for (const sid of parts.sections.slice(1)) places[sid] = pick(read, sid).y;
  const last = parts.sections.at(-1);
  if (last !== undefined) places.sections = pick(read, last).y + pick(read, last).height;
  return places;
}

/**
 * The layout of sidebar `id` (FR-020 to FR-023, FR-008): its ground; its dividers; the head's and footer's `p` each
 * `--ocelle-space-4` inside its part (from the host's edges and the dividers); each section padded `--ocelle-space-4`
 * on every side, its border box the sidebar's whole inline size, with no margin and no gap to the next; the footer at
 * the host's block end; with `free`, free space between the last divider and the footer's padding, else none.
 */
export async function layoutOf(driver: Driver, id: string, parts: Parts, free = false): Promise<unknown> {
  const all = [id, ...(parts.head === undefined ? [] : [parts.head]), ...parts.sections, ...(parts.footer === undefined ? [] : [parts.footer])];
  const read = await boxes(driver, all);
  const host = pick(read, id);
  const rule = await tokenPx(driver, "border-width");
  const inline = (part: Box): Promise<string[]> => Promise.all([lengthIs(driver, part.x - host.x, "space-4"), lengthIs(driver, host.x + host.width - (part.x + part.width), "space-4")]);
  const first = parts.sections[0];
  const last = parts.sections.at(-1);
  const headPart = parts.head === undefined ? undefined : pick(read, parts.head);
  const footerPart = parts.footer === undefined ? undefined : pick(read, parts.footer);
  return {
    ground: await tokensOf(driver, id, { "background-color": "color-rail" }),
    dividers: await dividersOf(driver, id, await placesOf(driver, parts, read)),
    head:
      headPart === undefined
        ? null
        : {
            start: await lengthIs(driver, headPart.y - host.y, "space-4"),
            inline: await inline(headPart),
            toSections: first === undefined ? null : await lengthIs(driver, pick(read, first).y - rule - (headPart.y + headPart.height), "space-4"),
          },
    sections: await inOrder(parts.sections, async (sid, at) => {
      const part = pick(read, sid);
      const next = parts.sections[at + 1];
      return {
        display: part.display,
        padding: await inOrder(await sides(driver, sid, (side) => `padding-${side}`), (value) => lengthIs(driver, Number.parseFloat(value), "space-4")),
        span: [tenth(part.x - host.x), tenth(host.x + host.width - (part.x + part.width))],
        margins: {
          block: [await driver.computed(sid, "margin-top"), await driver.computed(sid, "margin-bottom")],
          inline: await inOrder(["margin-left", "margin-right"], async (property) => lengthIs(driver, -Number.parseFloat(await driver.computed(sid, property)), "space-4")),
        },
        toNext: next === undefined ? null : tenth(pick(read, next).y - (part.y + part.height)),
      };
    }),
    firstAtStart: first === undefined || parts.head !== undefined ? null : tenth(pick(read, first).y - host.y),
    lastAtEnd: last === undefined || parts.footer !== undefined ? null : tenth(host.y + host.height - (pick(read, last).y + pick(read, last).height)),
    footer:
      footerPart === undefined
        ? null
        : {
            end: await lengthIs(driver, host.y + host.height - (footerPart.y + footerPart.height), "space-4"),
            inline: await inline(footerPart),
            fromSections:
              last === undefined
                ? null
                : free
                  ? footerPart.y - (await tokenPx(driver, "space-4")) - (pick(read, last).y + pick(read, last).height + rule) > 0
                  : await lengthIs(driver, footerPart.y - (pick(read, last).y + pick(read, last).height + rule), "space-4"),
          },
  };
}

/** What `layoutOf` reads on a sidebar of `parts` (`head` and `footer` filled or not) as the spec states it. */
export function layoutExpected(parts: { readonly head: boolean; readonly sections: readonly string[]; readonly footer: boolean }, free = false): unknown {
  const at = [...(parts.head ? ["head"] : []), ...parts.sections.slice(1), ...(parts.footer && parts.sections.length > 0 ? ["sections"] : [])];
  return {
    ground: { "background-color": "color-rail" },
    dividers: { at, thickness: at.map(() => "border-width") },
    head: parts.head ? { start: "space-4", inline: ["space-4", "space-4"], toSections: parts.sections.length > 0 ? "space-4" : null } : null,
    sections: parts.sections.map((_, index) => ({
      display: "block",
      padding: ["space-4", "space-4", "space-4", "space-4"],
      span: [0, 0],
      margins: { block: ["0px", "0px"], inline: ["space-4", "space-4"] },
      toNext: index < parts.sections.length - 1 ? 0 : null,
    })),
    firstAtStart: parts.sections.length > 0 && !parts.head ? 0 : null,
    lastAtEnd: parts.sections.length > 0 && !parts.footer ? 0 : null,
    footer: parts.footer ? { end: "space-4", inline: ["space-4", "space-4"], fromSections: parts.sections.length > 0 ? (free ? true : "space-4") : null } : null,
  };
}

/** The layout of a filled sidebar `id` with three sections (`<id>-s1` to `<id>-s3`). */
const fullParts = (id: string): Parts => ({ head: `${id}-head`, sections: ids(id), footer: `${id}-footer` });

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

const themes: readonly Palette[] = ["light", "dark"];

/** The sentinel values of the token-sentinel scenario (research.md R-13): each token a distinct value of its type. */
const sentinels: Readonly<Record<string, string>> = {
  "color-rail": "rgb(201, 202, 203)",
  "color-rule": "rgb(10, 11, 12)",
  "border-width": "3px",
  "space-4": "13px",
};

export const contextSidebarScenarios: Scenario[] = [
  {
    name: "US3-1: a sidebar with label=\"Team navigation\" is exactly one navigation landmark named \"Team navigation\" holding its head, sections and footer, with no aria-label written on the host; two sidebars with different labels on one page are two navigation landmarks with those names, and no other node carries a landmark's name (FR-020, FR-028)",
    run: async (driver) => {
      await driver.mount(sidebar("team", full("team"), ' label="Team navigation"') + `<div id="page">${sidebar("a", full("a"), ' label="Squad"')}${sidebar("b", full("b"), ' label="Projects"')}</div>` + probe);
      const tree = (await driver.axSubtree("team")).filter((node) => node.role !== "StaticText");
      return {
        team: tree,
        page: await landmarksOf(driver, "page", ["Squad", "Projects"]),
        written: await ariaLabels(driver, ["team", "a", "b"]),
      };
    },
    expected: {
      team: [
        { role: "navigation", name: "Team navigation" },
        { role: "paragraph", name: "" },
        { role: "generic", name: "" },
        { role: "generic", name: "" },
        { role: "generic", name: "" },
        { role: "paragraph", name: "" },
      ],
      page: { navigation: [{ role: "navigation", name: "Squad" }, { role: "navigation", name: "Projects" }], others: [] },
      written: [null, null, null],
    },
  },
  {
    name: "US3-2: setting label by script renames the landmark, and a whitespace label leaves it unnamed, with no aria-label written on the host (FR-020, FR-028)",
    run: async (driver) => {
      await driver.mount(sidebar("nav", full("nav"), ' label="Team"') + probe);
      const before = await landmarksOf(driver, "nav", []);
      await driver.setProperty("nav", "label", "Projects");
      const renamed = await landmarksOf(driver, "nav", []);
      await driver.setProperty("nav", "label", "  ");
      const blank = await landmarksOf(driver, "nav", []);
      return { before: before.navigation, renamed: renamed.navigation, blank: blank.navigation, written: await driver.attribute("nav", "aria-label") };
    },
    expected: {
      before: [{ role: "navigation", name: "Team" }],
      renamed: [{ role: "navigation", name: "Projects" }],
      blank: [{ role: "navigation", name: "" }],
      written: null,
    },
  },
  ...themes.map((theme) => ({
    name: `US3-3, ${theme}: a sidebar with a head, three div sections and a footer in a 600 px container is 600 px tall on --ocelle-color-rail, with four --ocelle-border-width dividers in --ocelle-color-rule across its whole inline size (after the head's padding, at the second and third sections, at the last section's padding edge), --ocelle-space-4 padding on every side of each part and no other gap, the free space between the last divider and the footer, and the footer's block end at the container's (FR-021 to FR-023)`,
    run: async (driver: Driver) => {
      await driver.mount(box("tall", sidebar("tall", full("tall"))) + probe);
      await driver.theme(theme);
      await driver.size("tall-box", 320, 600);
      const host = await driver.box("tall");
      const container = await driver.box("tall-box");
      return {
        height: tenth(host.height),
        atContainerEnd: tenth(container.y + container.height - (host.y + host.height)),
        layout: await layoutOf(driver, "tall", fullParts("tall"), true),
      };
    },
    expected: { height: 600, atContainerEnd: 0, layout: layoutExpected({ head: true, sections: ids("tall"), footer: true }, true) },
  })),
  {
    name: "US3-3, ocelle-section-header and span sections: each section is a block padded --ocelle-space-4 on every side across the sidebar's whole inline size, with the four dividers of a div sidebar beside it (FR-021, FR-022)",
    run: async (driver) => {
      await driver.mount(["divs", "headers", "spans"].map((id, at) => box(id, sidebar(id, full(id, ["div", "ocelle-section-header", "span"][at])))).join("") + probe);
      for (const id of ["divs", "headers", "spans"]) await driver.size(`${id}-box`, 320, null);
      return { divs: await layoutOf(driver, "divs", fullParts("divs")), headers: await layoutOf(driver, "headers", fullParts("headers")), spans: await layoutOf(driver, "spans", fullParts("spans")) };
    },
    expected: {
      divs: layoutExpected({ head: true, sections: ids("divs"), footer: true }),
      headers: layoutExpected({ head: true, sections: ids("headers"), footer: true }),
      spans: layoutExpected({ head: true, sections: ids("spans"), footer: true }),
    },
  },
  {
    name: "US3-3, FR-008: with a ul and a p as sections and a p as head and footer, each border box lies exactly --ocelle-space-4 inside its part with no UA margin; with a hidden p before and after the visible head p and footer p, the visible ones still do, and the hidden ones have no box",
    run: async (driver) => {
      const mixed = (id: string): string => head(id) + section(id, 1, "ul") + section(id, 2, "p") + footer(id);
      const hidden = (id: string, slot: string, where: string): string => `<p id="${id}-${slot}-${where}" slot="${slot}" hidden>Draft</p>`;
      const edged = (id: string): string =>
        hidden(id, "head", "before") + head(id) + hidden(id, "head", "after") + section(id, 1, "ul") + section(id, 2, "p") + hidden(id, "footer", "before") + footer(id) + hidden(id, "footer", "after");
      await driver.mount(box("mixed", sidebar("mixed", mixed("mixed"))) + box("edged", sidebar("edged", edged("edged"))) + probe);
      for (const id of ["mixed", "edged"]) await driver.size(`${id}-box`, 320, null);
      const parts = (id: string): Parts => ({ head: `${id}-head`, sections: ids(id, 2), footer: `${id}-footer` });
      const gone = await inOrder(["edged-head-before", "edged-head-after", "edged-footer-before", "edged-footer-after"], async (id) => (await driver.box(id)).display);
      return { mixed: await layoutOf(driver, "mixed", parts("mixed")), edged: await layoutOf(driver, "edged", parts("edged")), gone };
    },
    expected: {
      mixed: layoutExpected({ head: true, sections: ids("mixed", 2), footer: true }),
      edged: layoutExpected({ head: true, sections: ids("edged", 2), footer: true }),
      gone: ["none", "none", "none", "none"],
    },
  },
  ...[
    { page: "ul { margin: 0; padding: 0; list-style: none }", label: "a ul reset" },
    { page: "* { margin: 0; padding: 0; border: 0 solid }", label: "a reset of every element" },
  ].map(({ page, label }) => ({
    name: `US3-3, ${label} (${page}): a sidebar of three ul sections keeps its four dividers across its whole inline size and each section its --ocelle-space-4 padding on every side and its block display, as with no page rule; a page rule on the sections' block margins sets them, while one on their padding and display changes neither (FR-008, FR-021, FR-022)`,
    run: async (driver: Driver) => {
      await driver.mount(box("reset", sidebar("reset", full("reset", "ul"))) + box("spaced", sidebar("spaced", full("spaced", "ul"))) + probe);
      for (const id of ["reset", "spaced"]) await driver.size(`${id}-box`, 320, null);
      const before = await layoutOf(driver, "reset", fullParts("reset"));
      await driver.rules(page);
      await driver.rules("#spaced ul { margin-block: 8px; padding: 2px; display: flex }");
      return {
        before,
        after: await layoutOf(driver, "reset", fullParts("reset")),
        margins: await inOrder(ids("spaced"), async (sid) => [await driver.computed(sid, "margin-top"), await driver.computed(sid, "margin-bottom")]),
        padding: await inOrder(ids("spaced"), async (sid) => lengthIs(driver, Number.parseFloat(await driver.computed(sid, "padding-left")), "space-4")),
        display: await inOrder(ids("spaced"), (sid) => driver.computed(sid, "display")),
      };
    },
    expected: {
      before: layoutExpected({ head: true, sections: ids("reset"), footer: true }),
      after: layoutExpected({ head: true, sections: ids("reset"), footer: true }),
      margins: [0, 1, 2].map(() => ["8px", "8px"]),
      padding: ["space-4", "space-4", "space-4"],
      display: ["block", "block", "block"],
    },
  })),
  {
    name: "US3-3, hidden sections: a hidden div and a hidden ocelle-section-header between two visible sections have no box, padding or divider, and one divider lies between the visible two with --ocelle-space-4 padding on both sides; with the first section hidden, the first visible one has no divider of its own and one divider lies between it and the head (FR-022)",
    run: async (driver) => {
      const between = head("mid") + section("mid", 1) + '<div id="mid-h1" hidden>Hidden</div><ocelle-section-header id="mid-h2" hidden><h3 slot="heading">Hidden</h3></ocelle-section-header>' + section("mid", 2) + footer("mid");
      const first = head("first") + '<div id="first-h1" hidden>Hidden</div>' + section("first", 1) + section("first", 2) + footer("first");
      await driver.mount(box("mid", sidebar("mid", between)) + box("first", sidebar("first", first)) + probe);
      for (const id of ["mid", "first"]) await driver.size(`${id}-box`, 320, null);
      return {
        mid: await layoutOf(driver, "mid", { head: "mid-head", sections: ids("mid", 2), footer: "mid-footer" }),
        first: await layoutOf(driver, "first", { head: "first-head", sections: ids("first", 2), footer: "first-footer" }),
        hidden: await inOrder(["mid-h1", "mid-h2", "first-h1"], async (id) => {
          const found = await driver.box(id);
          return [found.display, found.height];
        }),
      };
    },
    expected: {
      mid: layoutExpected({ head: true, sections: ids("mid", 2), footer: true }),
      first: layoutExpected({ head: true, sections: ids("first", 2), footer: true }),
      hidden: [
        ["none", 0],
        ["none", 0],
        ["none", 0],
      ],
    },
  },
  {
    name: "US3-3, template and script (phase 4 review R2-01): a <template> and a <script type=\"application/json\"> before the first section, between the two visible sections and after the last have no box and display none, one divider lies between the visible two with --ocelle-space-4 padding on both sides and the first visible one has no divider of its own; with only a <template> in the default slot, the head and footer dividers stay and meet with no padding between them, as with every section hidden (FR-021, FR-022)",
    run: async (driver) => {
      const never = (id: string, where: string): string => `<template id="${id}-t-${where}"><li>Later</li></template><script id="${id}-j-${where}" type="application/json">{"later":true}</script>`;
      const mixed = head("tpl") + never("tpl", "before") + section("tpl", 1) + never("tpl", "between") + section("tpl", 2) + never("tpl", "after") + footer("tpl");
      const only = head("only") + '<template id="only-t"><li>Later</li></template>' + footer("only");
      await driver.mount(box("tpl", sidebar("tpl", mixed)) + box("only", sidebar("only", only)) + probe);
      for (const id of ["tpl", "only"]) await driver.size(`${id}-box`, 320, null);
      const nevers = ["before", "between", "after"].flatMap((where) => [`tpl-t-${where}`, `tpl-j-${where}`]).concat(["only-t"]);
      const read = await boxes(driver, ["only", "only-head", "only-footer"]);
      const rule = await tokenPx(driver, "border-width");
      const space = await tokenPx(driver, "space-4");
      const headEnd = pick(read, "only-head").y + pick(read, "only-head").height;
      const runs = await runsOf(driver, "only", await tokenColour(driver, "color-rule"));
      return {
        mixed: await layoutOf(driver, "tpl", { head: "tpl-head", sections: ids("tpl", 2), footer: "tpl-footer" }),
        never: await inOrder(nevers, async (id) => {
          const found = await driver.box(id);
          return [found.display, found.width, found.height];
        }),
        only: {
          dividers: runs.map((run) => ({
            atHeadPadding: tenth(pick(read, "only").y + run.at - (headEnd + space)),
            thickness: tenth(run.thickness) === tenth(2 * rule) ? "two border-widths" : `${String(run.thickness)}px`,
          })),
          meet: await lengthIs(driver, pick(read, "only-footer").y - (headEnd + space + 2 * rule), "space-4"),
        },
      };
    },
    expected: {
      mixed: layoutExpected({ head: true, sections: ids("tpl", 2), footer: true }),
      never: Array.from({ length: 7 }, () => ["none", 0, 0]),
      only: { dividers: [{ atHeadPadding: 0, thickness: "two border-widths" }], meet: "space-4" },
    },
  },
  {
    name: "US3-4: in a block, a flex-row and a grid container 100 px tall, a sidebar of twelve sections is as tall as its content, the same as in a block container of no set height, and its footer follows the last section with its padding, not overlapping it (FR-023)",
    run: async (driver) => {
      const tall = (id: string): string => head(id) + Array.from({ length: 12 }, (_, at) => section(id, at + 1)).join("") + footer(id);
      const kinds = ["block", "flex", "grid"] as const;
      await driver.mount(box("natural", sidebar("natural", tall("natural"))) + kinds.map((kind) => box(kind, sidebar(kind, tall(kind)))).join("") + probe);
      await driver.size("natural-box", 320, null);
      for (const kind of kinds) {
        await driver.size(`${kind}-box`, 320, 100);
        if (kind !== "block") await driver.style(`${kind}-box`, "display", kind);
      }
      const natural = await driver.box("natural");
      const rule = await tokenPx(driver, "border-width");
      const grown = await inOrder(kinds, async (kind) => {
        const host = await driver.box(kind);
        const last = await driver.box(`${kind}-s12`);
        const end = await driver.box(`${kind}-footer`);
        return {
          height: tenth(host.height - natural.height),
          footerFollows: await lengthIs(driver, end.y - (last.y + last.height + rule), "space-4"),
          footerInside: await lengthIs(driver, host.y + host.height - (end.y + end.height), "space-4"),
        };
      });
      return { taller: natural.height > 100, grown };
    },
    expected: { taller: true, grown: [0, 1, 2].map(() => ({ height: 0, footerFollows: "space-4", footerInside: "space-4" })) },
  },
  ...(["flex", "grid"] as const).map((kind) => ({
    name: `US3-4, a 600 px ${kind === "flex" ? "flex-row" : "grid"} container: a sidebar with a head, three sections and a footer is 600 px tall with the footer's block end at the container's, its dividers, padding and free space as in US3-3 (FR-023; operator decision at the phase-1 spike)`,
    run: async (driver: Driver) => {
      await driver.mount(box("fill", sidebar("fill", full("fill"))) + probe);
      await driver.size("fill-box", 320, 600);
      await driver.style("fill-box", "display", kind);
      const host = await driver.box("fill");
      const container = await driver.box("fill-box");
      return { height: tenth(host.height), atContainerEnd: tenth(container.y + container.height - (host.y + host.height)), layout: await layoutOf(driver, "fill", fullParts("fill"), true) };
    },
    expected: { height: 600, atContainerEnd: 0, layout: layoutExpected({ head: true, sections: ids("fill"), footer: true }, true) },
  })),
  {
    name: "US3-5: a sidebar with no footer has no footer padding or divider after its last section, one with no head none before its first section, beside a full sidebar with all of them (FR-005, FR-022)",
    run: async (driver) => {
      await driver.mount(
        box("nofoot", sidebar("nofoot", head("nofoot") + section("nofoot", 1) + section("nofoot", 2))) + box("nohead", sidebar("nohead", section("nohead", 1) + section("nohead", 2) + footer("nohead"))) + box("both", sidebar("both", full("both"))) + probe,
      );
      for (const id of ["nofoot", "nohead", "both"]) await driver.size(`${id}-box`, 320, null);
      return {
        nofoot: await layoutOf(driver, "nofoot", { head: "nofoot-head", sections: ids("nofoot", 2) }),
        nohead: await layoutOf(driver, "nohead", { sections: ids("nohead", 2), footer: "nohead-footer" }),
        both: await layoutOf(driver, "both", fullParts("both")),
      };
    },
    expected: {
      nofoot: layoutExpected({ head: true, sections: ids("nofoot", 2), footer: false }),
      nohead: layoutExpected({ head: false, sections: ids("nohead", 2), footer: true }),
      both: layoutExpected({ head: true, sections: ids("both"), footer: true }),
    },
  },
  {
    name: "US3-6: a footer filled by script after render brings its divider and padding, and a head emptied by script takes its divider and padding away, each measured before and after (FR-005, FR-022)",
    run: async (driver) => {
      await driver.mount(box("grow", sidebar("grow", head("grow") + section("grow", 1) + section("grow", 2))) + box("shrink", sidebar("shrink", head("shrink") + section("shrink", 1) + section("shrink", 2) + footer("shrink"))) + probe);
      for (const id of ["grow", "shrink"]) await driver.size(`${id}-box`, 320, null);
      const before = { grow: await layoutOf(driver, "grow", { head: "grow-head", sections: ids("grow", 2) }), shrink: await layoutOf(driver, "shrink", { head: "shrink-head", sections: ids("shrink", 2), footer: "shrink-footer" }) };
      await driver.append("grow", footer("grow"));
      await driver.remove("shrink-head");
      const after = { grow: await layoutOf(driver, "grow", { head: "grow-head", sections: ids("grow", 2), footer: "grow-footer" }), shrink: await layoutOf(driver, "shrink", { sections: ids("shrink", 2), footer: "shrink-footer" }) };
      return { before, after };
    },
    expected: {
      before: { grow: layoutExpected({ head: true, sections: ids("grow", 2), footer: false }), shrink: layoutExpected({ head: true, sections: ids("shrink", 2), footer: true }) },
      after: { grow: layoutExpected({ head: true, sections: ids("grow", 2), footer: true }), shrink: layoutExpected({ head: false, sections: ids("shrink", 2), footer: true }) },
    },
  },
  {
    name: "US3-7: a sidebar with one section has no divider between sections, only those after the head and before the footer, beside a three-section sidebar with four (FR-022)",
    run: async (driver) => {
      await driver.mount(box("one", sidebar("one", head("one") + section("one", 1) + footer("one"))) + box("three", sidebar("three", full("three"))) + probe);
      for (const id of ["one", "three"]) await driver.size(`${id}-box`, 320, null);
      return { one: await layoutOf(driver, "one", { head: "one-head", sections: ids("one", 1), footer: "one-footer" }), three: await layoutOf(driver, "three", fullParts("three")) };
    },
    expected: { one: layoutExpected({ head: true, sections: ids("one", 1), footer: true }), three: layoutExpected({ head: true, sections: ids("three"), footer: true }) },
  },
  {
    name: "US3-8: tabbing through a sidebar with links in its head, sections and footer moves focus in document order from the link before it through each slotted link to the button after it; the element adds no tab stop, while it is drawn with its dividers (FR-002)",
    run: async (driver) => {
      const link = (id: string, slot: string): string => `<a id="${id}" href="#${id}"${slot === "" ? "" : ` slot="${slot}"`}>${id}</a>`;
      await driver.mount(
        '<a id="before" href="#before">Before</a>' +
          box("tabs", sidebar("tabs", link("tabs-head", "head") + `<div id="tabs-s1">${link("tabs-one", "")}</div><div id="tabs-s2">${link("tabs-two", "")}</div>` + link("tabs-footer", "footer"))) +
          '<button id="after" type="button">After</button>' +
          probe,
      );
      await driver.size("tabs-box", 320, null);
      const order = [];
      for (let press = 0; press < 6; press += 1) {
        await driver.tab();
        order.push(await driver.activeElement());
      }
      const read = await boxes(driver, ["tabs-head", "tabs-s1", "tabs-s2"]);
      return { dividers: (await dividersOf(driver, "tabs", await placesOf(driver, { head: "tabs-head", sections: ["tabs-s1", "tabs-s2"] }, read))).at.length, order };
    },
    expected: {
      dividers: 3,
      order: ["before", "tabs-head", "tabs-one", "tabs-two", "tabs-footer"].map((id) => ({ name: "a", id, hosts: [] })).concat([{ name: "button", id: "after", hosts: [] }]),
    },
  },
  ...themes.map((palette) => ({
    name: `US3-9, forced colours with the ${palette} palette: the four dividers of a full sidebar are drawn in the system text colour, unlike the canvas, at the places of US3-3 (FR-001, FR-003)`,
    run: async (driver: Driver) => {
      await driver.mount(box("forced", sidebar("forced", full("forced"))) + probe);
      await driver.size("forced-box", 320, null);
      await driver.forcedColors("active", palette);
      try {
        const text = systemColours[palette].CanvasText;
        const read = await boxes(driver, ["forced-head", ...ids("forced")]);
        return {
          dividers: await dividersOf(driver, "forced", await placesOf(driver, fullParts("forced"), read), text),
          unlikeCanvas: text !== (await driver.resolveColour("Canvas")),
        };
      } finally {
        await driver.forcedColors("none");
      }
    },
    expected: { dividers: { at: ["head", "forced-s2", "forced-s3", "sections"], thickness: ["border-width", "border-width", "border-width", "border-width"] }, unlikeCanvas: true },
  })),
  {
    name: "US3-10: at 320 px a sidebar in the page's body with long section text has no horizontal scroll and no clipped text, and its head, sections and footer stack in that order (FR-004)",
    run: async (driver) => {
      const long = "Every mission the team has run this quarter, with its owner, its status and the date it last changed";
      await driver.mount(sidebar("narrow", head("narrow") + `<div id="narrow-s1">${long}</div><ul id="narrow-s2"><li><a href="#narrow">${long}</a></li></ul>` + footer("narrow")) + probe);
      await driver.viewport(320, 800);
      try {
        const read = await boxes(driver, ["narrow-head", "narrow-s1", "narrow-s2", "narrow-footer"]);
        const order = ["narrow-head", "narrow-s1", "narrow-s2", "narrow-footer"].map((id) => pick(read, id));
        return {
          scrollWidth: (await driver.scrollWidth()) <= 320,
          clipped: (await driver.textBoxes("narrow")).filter((line) => line.clipped).map((line) => line.text),
          stacked: order.slice(1).map((part, at) => part.y >= (order[at]?.y ?? 0) + (order[at]?.height ?? 0) - 0.5),
          wraps: pick(read, "narrow-s1").height > 3 * (await tokenPx(driver, "space-4")),
        };
      } finally {
        await driver.viewport(1280, 800);
      }
    },
    expected: { scrollWidth: true, clipped: [], stacked: [true, true, true], wraps: true },
  },
  {
    name: "US3-11: text in the default slot between two sections is drawn between them in document order, --ocelle-space-4 from the sidebar's inline start, with no block padding and no divider of its own: one divider, at the second section's block start; a sidebar whose default slot holds only text has the two dividers head to text and text to footer (FR-021, FR-022)",
    run: async (driver) => {
      await driver.mount(box("loose", sidebar("loose", head("loose") + section("loose", 1) + "Loose text" + section("loose", 2))) + box("only", sidebar("only", head("only") + "Only text" + footer("only"))) + probe);
      for (const id of ["loose", "only"]) await driver.size(`${id}-box`, 320, null);
      const read = await boxes(driver, ["loose", "loose-head", "loose-s1", "loose-s2", "only", "only-head", "only-footer"]);
      const [loose] = (await driver.textBoxes("loose")).filter((line) => line.text === "Loose text");
      const [only] = (await driver.textBoxes("only")).filter((line) => line.text === "Only text");
      if (loose === undefined || only === undefined) throw new Error("the slotted text was not read");
      const s1 = pick(read, "loose-s1");
      const s2 = pick(read, "loose-s2");
      const rule = await tokenPx(driver, "border-width");
      const space = await tokenPx(driver, "space-4");
      const headOf = (id: string): number => pick(read, `${id}-head`).y + pick(read, `${id}-head`).height + space;
      return {
        loose: {
          dividers: (await dividersOf(driver, "loose", { head: headOf("loose"), s1: s1.y, text: loose.box.y, s2: s2.y })).at,
          between: [loose.box.y >= s1.y + s1.height - 0.5, loose.box.y + loose.box.height <= s2.y + 0.5],
          noBlockPadding: [loose.box.y - (s1.y + s1.height), s2.y - (loose.box.y + loose.box.height)].map((gap) => Math.abs(gap) < 2),
          inline: await lengthIs(driver, loose.box.x - pick(read, "loose").x, "space-4"),
        },
        only: {
          dividers: (await dividersOf(driver, "only", { head: headOf("only"), footer: pick(read, "only-footer").y - space - rule })).at,
          headToText: tenth(only.box.y - (headOf("only") + rule)),
          textToFooter: Math.abs(pick(read, "only-footer").y - space - rule - (only.box.y + only.box.height)) < 2,
        },
      };
    },
    expected: {
      loose: { dividers: ["head", "s2"], between: [true, true], noBlockPadding: [true, true], inline: "space-4" },
      only: { dividers: ["head", "footer"], headToText: 0, textToFooter: true },
    },
  },
  {
    name: "US3-12: with aria-label=\"Team\" only, label=\"Projects\" with aria-label=\"Other\", label=\"Projects\" with a blank aria-label and neither, the landmarks are named Team, Other, unnamed and unnamed, one per sidebar, no other node carries a name, and each host keeps the aria-label the page wrote; removing aria-label from the second and third names both Projects (FR-028)",
    run: async (driver) => {
      await driver.mount(
        `<div id="page">${sidebar("one", full("one"), ' aria-label="Team"')}${sidebar("two", full("two"), ' label="Projects" aria-label="Other"')}${sidebar("three", full("three"), ' label="Projects" aria-label=""')}${sidebar("four", full("four"))}</div>` + probe,
      );
      const names = ["Team", "Other", "Projects"];
      const hosts = ["one", "two", "three", "four"];
      const before = { tree: await landmarksOf(driver, "page", names), kept: await ariaLabels(driver, hosts) };
      await driver.setAttribute("two", "aria-label", null);
      await driver.setAttribute("three", "aria-label", null);
      return { before, after: { tree: await landmarksOf(driver, "page", names), kept: await ariaLabels(driver, hosts) } };
    },
    expected: {
      before: {
        tree: { navigation: ["Team", "Other", "", ""].map((name) => ({ role: "navigation", name })), others: [] },
        kept: ["Team", "Other", "", null],
      },
      after: {
        tree: { navigation: ["Team", "Projects", "Projects", ""].map((name) => ({ role: "navigation", name })), others: [] },
        kept: ["Team", null, null, null],
      },
    },
  },
  {
    name: "US3-13: a sidebar with a head and a footer and an empty default slot has exactly one divider, at the head's padding edge, the head's and footer's padding meeting at it; beside it a sidebar with one section has two and the section its --ocelle-space-4 padding on every side (FR-005, FR-022)",
    run: async (driver) => {
      await driver.mount(box("bare", sidebar("bare", head("bare") + footer("bare"))) + box("one", sidebar("one", head("one") + section("one", 1) + footer("one"))) + probe);
      for (const id of ["bare", "one"]) await driver.size(`${id}-box`, 320, null);
      const read = await boxes(driver, ["bare-head", "bare-footer"]);
      const rule = await tokenPx(driver, "border-width");
      const headEnd = pick(read, "bare-head").y + pick(read, "bare-head").height;
      return {
        bare: {
          dividers: await dividersOf(driver, "bare", { head: headEnd + (await tokenPx(driver, "space-4")) }),
          meet: await lengthIs(driver, pick(read, "bare-footer").y - (headEnd + rule) - (await tokenPx(driver, "space-4")), "space-4"),
          layout: await layoutOf(driver, "bare", { head: "bare-head", sections: [], footer: "bare-footer" }),
        },
        one: await layoutOf(driver, "one", { head: "one-head", sections: ids("one", 1), footer: "one-footer" }),
      };
    },
    expected: {
      bare: { dividers: { at: ["head"], thickness: ["border-width"] }, meet: "space-4", layout: layoutExpected({ head: true, sections: [], footer: true }) },
      one: layoutExpected({ head: true, sections: ids("one", 1), footer: true }),
    },
  },
  {
    name: "token sentinels (research.md R-13): with --ocelle-color-rail, --ocelle-color-rule, --ocelle-border-width and --ocelle-space-4 set to sentinels on the root, the ground, the dividers' colour and thickness and every part's padding follow them, and with them removed the sidebar draws its default again",
    run: async (driver) => {
      const markup = box("s", sidebar("s", full("s"))) + probe;
      await driver.mount(markup);
      await driver.size("s-box", 320, null);
      await driver.rules(sentinelRules(sentinels));
      const read = await boxes(driver, ["s", "s-head", "s-s1", "s-s2", "s-footer"]);
      const host = pick(read, "s");
      const sentinel = {
        ground: await driver.computed("s", "background-color"),
        dividers: (await runsOf(driver, "s", "rgb(10, 11, 12)")).map((run) => run.thickness),
        head: [tenth(pick(read, "s-head").y - host.y), tenth(pick(read, "s-head").x - host.x), tenth(pick(read, "s-s1").y - (pick(read, "s-head").y + pick(read, "s-head").height))],
        section: [...(await sides(driver, "s-s1", (side) => `padding-${side}`)), await driver.computed("s-s1", "margin-left"), tenth(pick(read, "s-s1").width - host.width)],
        footer: [tenth(host.y + host.height - (pick(read, "s-footer").y + pick(read, "s-footer").height)), tenth(pick(read, "s-footer").x - host.x)],
      };
      await driver.mount(markup);
      await driver.size("s-box", 320, null);
      return { sentinel, restored: await layoutOf(driver, "s", fullParts("s")) };
    },
    expected: {
      sentinel: {
        ground: "rgb(201, 202, 203)",
        dividers: [3, 3, 3, 3],
        head: [13, 13, 16],
        section: ["13px", "13px", "13px", "13px", "-13px", 0],
        footer: [13, 13],
      },
      restored: layoutExpected({ head: true, sections: ids("s"), footer: true }),
    },
  },
  {
    name: "a hidden host and the border box (FR-001, R-01, Edge Cases): a sidebar with the hidden attribute has no box and no node, beside its visible twin with its box and its landmark; a sidebar the page sizes to 240 px is 240 px wide, its sections across it; one the page gives padding and a border fills a 600 px container with its border box, 600 px tall",
    run: async (driver) => {
      await driver.mount(`<div id="page">${sidebar("gone", full("gone"), ' label="Gone" hidden')}${sidebar("shown", full("shown"), ' label="Shown"')}</div>` + box("sized", sidebar("sized", full("sized"))) + box("padded", sidebar("padded", full("padded"))) + probe);
      await driver.size("sized", 240, null);
      await driver.size("padded-box", 320, 600);
      await driver.rules("#padded { padding: 8px; border: 2px solid }");
      const padded = await driver.box("padded");
      const gone = await driver.box("gone");
      const shown = await driver.box("shown");
      const sized = await driver.box("sized");
      const s1 = await driver.box("sized-s1");
      return {
        gone: [gone.display, gone.height],
        shown: [shown.display, shown.height > 0],
        tree: (await landmarksOf(driver, "page", ["Gone", "Shown"])).navigation,
        sized: [tenth(sized.width), tenth(s1.width)],
        padded: tenth(padded.height),
      };
    },
    expected: { gone: ["none", 0], shown: ["flex", true], tree: [{ role: "navigation", name: "Shown" }], sized: [240, 240], padded: 600 },
  },
  {
    name: "no event (FR-002): mounting, filling and emptying slots and changing label dispatch no event from the sidebar or its shadow tree, while each slot step changes its layout and the label step its name",
    run: async (driver) => {
      await driver.listen(["quiet"]);
      await driver.mount(box("quiet", sidebar("quiet", head("quiet") + section("quiet", 1), ' label="Team"')) + probe);
      await driver.size("quiet-box", 320, null);
      const height = async (): Promise<number> => tenth((await driver.box("quiet")).height);
      const steps = [await height()];
      await driver.append("quiet", footer("quiet"));
      steps.push(await height());
      await driver.append("quiet", section("quiet", 2));
      steps.push(await height());
      await driver.remove("quiet-head");
      steps.push(await height());
      await driver.setProperty("quiet", "label", "Projects");
      const named = (await landmarksOf(driver, "quiet", [])).navigation;
      const heard = await driver.heard();
      return { heard, changed: steps.slice(1).map((value, index) => value !== steps[index]), named };
    },
    expected: { heard: [], changed: [true, true, true], named: [{ role: "navigation", name: "Projects" }] },
  },
];
