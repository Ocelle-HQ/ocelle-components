import type { CDPSession, Page } from "playwright";
import { describe, expect, it } from "vitest";
import { monospaceFamilies } from "../../../../gates/bin/prefix.ts";
import { close, computed, scales, suite, tabTo, themes } from "./pages.ts";
import type { Theme } from "./pages.ts";
import { violations } from "./serve.ts";

// The prose family in Chromium (003 spec User Story 3 scenarios 1 to 12; FR-014 to FR-019, FR-022, FR-025; research.md
// R-06, R-09, R-10, R-13; data-model.md § Prose; reviews/phase-2/spike.md). prose.html holds the US3 fixture inside a
// prose container (every element of FR-014 plus h5, h6 and a nested list, an <a id> target with no href, three wide
// 12-column tables: one with a caption of over 80 characters ending in a full stop, one with no caption, one with a
// link in a cell; a two-column table that fits, a code block with a 200-character line, a 120-character inline code
// path and bare URL link), then the scoped elements of US3-5 (h1, h2, p, table, th) again outside the container and
// inside a container with the undocumented value "true". Those copies are short, so that at 320 px nothing outside
// the prose container widens the page and the page-scroll assertions measure the prose family alone.
// prose-hosts.html puts the wide table in a prose container that is a grid's 1fr item, a flex: 1 item and nested in
// the grid item, each beside a 60 px rail, and, with the table that fits, in a modal dialog of definite width;
// prose-root.html carries the hook on <html>. Every page is served under the strict CSP by serve.ts, which links a
// plant stylesheet after base.css on request (`after=plants/<name>`). Every scenario runs in both themes, under
// emulateMedia({ colorScheme }) light and dark (FR-022). Each guard (a "does not") shares its test with the positive
// assertion it guards and runs once more with its plant, where its helper must report the problem (SC-002, R-10).
// Expected values are transcribed by hand from the spec, data-model.md § Rule table and 002's Appendix A, never read
// from the token source or base.css.

/** 002 Appendix A colours the prose family uses, as Chromium reports computed colours. */
const colours: Readonly<Record<Theme, Readonly<Record<"ink" | "inkSoft" | "inset" | "rule" | "ruleStrong" | "link" | "linkHover" | "focus", string>>>> = {
  light: {
    ink: "rgb(21, 19, 15)",
    inkSoft: "rgb(63, 58, 51)",
    inset: "rgb(226, 221, 211)",
    rule: "rgb(217, 211, 199)",
    ruleStrong: "rgb(185, 177, 162)",
    link: "rgb(132, 86, 13)",
    linkHover: "rgb(21, 19, 15)",
    focus: "rgb(143, 94, 15)",
  },
  dark: {
    ink: "rgb(237, 233, 225)",
    inkSoft: "rgb(207, 201, 190)",
    inset: "rgb(48, 43, 35)",
    rule: "rgb(58, 52, 43)",
    ruleStrong: "rgb(77, 70, 58)",
    link: "rgb(224, 162, 58)",
    linkHover: "rgb(247, 244, 238)",
    focus: "rgb(224, 162, 58)",
  },
};
/** The prose scale at the default 16px root: `--ocelle-font-size-md` with `--ocelle-line-height-prose` (1.65). */
const prose = { fontSize: "16px", lineHeight: "26.4px" };
const sans = '"Schibsted Grotesk"';
/** The caption of the wide table (prose.html), 104 characters ending in a full stop. */
const caption = "Quarterly figures for each of the twelve regions, in thousands, for the first two quarters of the year.";
const regions = ["North", "South", "East", "West", "Coast", "Hills", "Lakes", "Delta", "Plain", "Ridge", "Bay", "Isles"];

const { open } = suite();

/** Whether the page scrolls sideways: its scroll width beyond its viewport width. */
function pageScrolls(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

/** The client and scroll widths of each element with one of `ids`. */
function boxes(page: Page, ids: readonly string[]): Promise<Record<string, { readonly client: number; readonly scroll: number }>> {
  return page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => {
          const element = document.getElementById(id);
          if (element === null) throw new Error(`no #${id}`);
          return [id, { client: element.clientWidth, scroll: element.scrollWidth }];
        }),
      ),
    ids,
  );
}

/** The ids of the elements focused by `presses` presses of Tab from where focus is, in order. */
async function tabCycle(page: Page, presses: number): Promise<string[]> {
  const focused: string[] = [];
  for (let press = 0; press < presses; press += 1) {
    await page.keyboard.press("Tab");
    focused.push(await page.evaluate(() => document.activeElement?.id ?? ""));
  }
  return focused;
}

/**
 * Presses Tab until the element with `id` has focus, at most 40 times, and tells whether it got it. Unlike tabTo it
 * does not throw: whether a table is a tab stop is the behaviour under test (FR-017), so it is asserted.
 */
async function reaches(page: Page, id: string): Promise<boolean> {
  for (let presses = 0; presses < 40; presses += 1) {
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.id)) === id) return true;
  }
  return false;
}

/** The table's scrollLeft once a smooth scroll has settled: two equal readings 50 ms apart (spike, Notes for the tests). */
async function settledScroll(page: Page, id: string): Promise<number> {
  let last = Number.NaN;
  for (let reading = 0; reading < 40; reading += 1) {
    const now = await page.evaluate((id) => document.getElementById(id)?.scrollLeft ?? 0, id);
    if (now === last) return now;
    last = now;
    await page.waitForTimeout(50);
  }
  return last;
}

/** Presses ArrowRight twice where focus is and returns the settled scrollLeft of the table `id`. */
async function arrowRight(page: Page, id: string): Promise<number> {
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(50);
  return settledScroll(page, id);
}

interface AxNode {
  readonly nodeId: string;
  readonly role?: { readonly value?: string };
  readonly name?: { readonly value?: string };
  readonly childIds?: readonly string[];
  readonly backendDOMNodeId?: number;
  readonly properties?: readonly { readonly name: string; readonly value: { readonly value?: unknown } }[];
}

async function fullTree(session: CDPSession): Promise<{ readonly nodes: readonly AxNode[]; readonly byId: ReadonlyMap<string, AxNode> }> {
  const { nodes } = (await session.send("Accessibility.getFullAXTree")) as { nodes: AxNode[] };
  return { nodes, byId: new Map(nodes.map((node) => [node.nodeId, node])) };
}

/** The role and accessible name of the focused node of the accessibility tree (CDP Accessibility.getFullAXTree). */
async function focusedNode(page: Page): Promise<{ readonly role: string; readonly name: string }> {
  const session = await page.context().newCDPSession(page);
  const { nodes } = await fullTree(session);
  await session.detach();
  // The document's root node also carries `focused` while its frame has focus; the focused element is the other one.
  const node = nodes.find((each) => each.role?.value !== "RootWebArea" && each.properties?.some((property) => property.name === "focused" && property.value.value === true));
  return { role: node?.role?.value ?? "", name: node?.name?.value ?? "" };
}

interface TableTree {
  readonly name: string;
  /** The names of the header row's nodes, which must all be `columnheader`. */
  readonly header: readonly string[];
  readonly headerRoles: readonly string[];
  /** The roles of each body row's nodes, by child index. */
  readonly body: readonly (readonly string[])[];
}

/**
 * Each `table` node of the accessibility tree, keyed by its element's id: its name, its header row and the roles of
 * its body rows. A cell is associated with its column header by its child index in its row (R-06 step 1: the tree
 * gives no row or column index property), so a body row of the header row's length whose nodes are all `cell` has
 * each cell under the `columnheader` of the same index.
 */
async function tableTrees(page: Page): Promise<Record<string, TableTree>> {
  const session = await page.context().newCDPSession(page);
  const { nodes, byId } = await fullTree(session);
  const children = (node: AxNode): AxNode[] => (node.childIds ?? []).flatMap((id) => byId.get(id) ?? []);
  const rows = (node: AxNode): AxNode[] => children(node).flatMap((child) => (child.role?.value === "row" ? [child] : child.role?.value === "caption" ? [] : rows(child)));
  const trees: Record<string, TableTree> = {};
  for (const table of nodes.filter((node) => node.role?.value === "table")) {
    const { node } = (await session.send("DOM.describeNode", { backendNodeId: table.backendDOMNodeId ?? 0 })) as { node: { attributes?: string[] } };
    const attributes = node.attributes ?? [];
    const id = attributes[attributes.indexOf("id") + 1] ?? "";
    const [head, ...body] = rows(table);
    trees[id] = {
      name: table.name?.value ?? "",
      header: (head === undefined ? [] : children(head)).map((cell) => cell.name?.value ?? ""),
      headerRoles: (head === undefined ? [] : children(head)).map((cell) => cell.role?.value ?? ""),
      body: body.map((row) => children(row).map((cell) => cell.role?.value ?? "")),
    };
  }
  await session.detach();
  return trees;
}

const twelve = (role: string): string[] => regions.map(() => role);

describe("US3-1: the prose scale, headings, code, lists, block quotes and rules (FR-015, FR-016, FR-018, FR-019)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 1280 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme });
    const running = ["p", "li", "nested-li", "blockquote", "quote-p", "code", "pre", "pre-code", "wide-td"];
    const sizes = await scales(page, ["prose", ...running, "wide-th", "h1", "h2", "h3", "h4", "h5", "h6"]);
    const headings: Record<string, Record<string, string>> = {};
    for (const id of ["h1", "h2", "h3", "h4", "h5", "h6"]) headings[id] = await computed(page, id, ["font-weight", "margin-top", "margin-bottom"]);
    const code: Record<string, Record<string, string>> = {};
    for (const id of ["code", "pre", "pre-code"]) {
      code[id] = await computed(page, id, ["font-variant-numeric", "background-color", "padding-left", "padding-right", "padding-top", "padding-bottom", "border-top-left-radius", "overflow-wrap", "white-space"]);
    }
    const families = await page.evaluate(
      ({ ids, monospace }) =>
        ids.map((id) => {
          const family = getComputedStyle(document.getElementById(id) ?? document.body).fontFamily;
          const names = family.split(",").map((part) => part.trim().replace(/^["']|["']$/g, "").toLowerCase());
          return [family.split(",")[0] ?? "", names.some((name) => name === "monospace" || monospace.includes(name))];
        }),
      { ids: ["code", "pre", "pre-code"], monospace: monospaceFamilies.map((each) => each.toLowerCase()) },
    );
    const lists: Record<string, Record<string, string>> = {};
    for (const id of ["ul", "ol"]) lists[id] = await computed(page, id, ["padding-left", "margin-top", "margin-bottom"]);
    const quote = await computed(page, "blockquote", ["margin-left", "margin-right", "margin-top", "margin-bottom", "padding-left", "border-left-width", "border-left-style", "border-left-color", "color"]);
    const rule = await computed(page, "hr", ["border-top-width", "border-top-style", "border-top-color", "border-bottom-width", "border-left-width", "border-right-width", "margin-top", "margin-bottom"]);
    const paragraph = await computed(page, "p", ["margin-top", "margin-bottom"]);
    const reported = await violations(page);
    await close(page);

    const c = colours[theme];
    expect(sizes).toEqual({
      prose,
      ...Object.fromEntries(running.map((id) => [id, prose])),
      "wide-th": { fontSize: "12px", lineHeight: "19.8px" },
      h1: { fontSize: "30px", lineHeight: "34.5px" },
      h2: { fontSize: "18px", lineHeight: "20.7px" },
      h3: { fontSize: "17px", lineHeight: "19.55px" },
      h4: { fontSize: "16px", lineHeight: "18.4px" },
      h5: { fontSize: "16px", lineHeight: "18.4px" },
      h6: { fontSize: "16px", lineHeight: "18.4px" },
    });
    const px = (id: string): number => parseFloat(sizes[id]?.fontSize ?? "0");
    expect([px("h1") > px("h2"), px("h2") >= px("h3"), px("h3") >= px("h4"), px("h4") === px("h5"), px("h5") === px("h6"), px("h6") >= px("prose")]).toEqual([true, true, true, true, true, true]);
    const heading = (weight: string): Record<string, string> => ({ "font-weight": weight, "margin-top": "24px", "margin-bottom": "12px" });
    expect(headings).toEqual({ h1: heading("800"), h2: heading("600"), h3: heading("600"), h4: heading("600"), h5: heading("600"), h6: heading("600") });
    expect(families).toEqual([
      [sans, false],
      [sans, false],
      [sans, false],
    ]);
    const box = (padding: readonly [string, string, string, string], radius: string, background: string, whiteSpace: string): Record<string, string> => ({
      "font-variant-numeric": "tabular-nums",
      "background-color": background,
      "padding-left": padding[0],
      "padding-right": padding[1],
      "padding-top": padding[2],
      "padding-bottom": padding[3],
      "border-top-left-radius": radius,
      "overflow-wrap": "anywhere",
      "white-space": whiteSpace,
    });
    expect(code).toEqual({
      code: box(["4px", "4px", "0px", "0px"], "4px", c.inset, "normal"),
      pre: box(["12px", "12px", "12px", "12px"], "4px", c.inset, "pre-wrap"),
      "pre-code": box(["0px", "0px", "0px", "0px"], "4px", "rgba(0, 0, 0, 0)", "pre-wrap"),
    });
    expect(lists).toEqual({ ul: { "padding-left": "24px", "margin-top": "0px", "margin-bottom": "16px" }, ol: { "padding-left": "24px", "margin-top": "0px", "margin-bottom": "16px" } });
    expect(quote).toEqual({
      "margin-left": "0px",
      "margin-right": "0px",
      "margin-top": "0px",
      "margin-bottom": "16px",
      "padding-left": "16px",
      "border-left-width": "3px",
      "border-left-style": "solid",
      "border-left-color": c.ruleStrong,
      color: c.inkSoft,
    });
    expect(rule).toEqual({
      "border-top-width": "1px",
      "border-top-style": "solid",
      "border-top-color": c.rule,
      "border-bottom-width": "0px",
      "border-left-width": "0px",
      "border-right-width": "0px",
      "margin-top": "0px",
      "margin-bottom": "16px",
    });
    expect(paragraph).toEqual({ "margin-top": "0px", "margin-bottom": "16px" });
    expect(reported).toEqual([]);
  });
});

/** The width of "0" in each element's own font (R-13), and its box width. */
function zeroWidths(page: Page, ids: readonly string[]): Promise<Record<string, { readonly zero: number; readonly width: number }>> {
  return page.evaluate(
    (ids) =>
      Object.fromEntries(
        ids.map((id) => {
          const element = document.getElementById(id);
          if (element === null) throw new Error(`no #${id}`);
          const style = getComputedStyle(element);
          const context = document.createElement("canvas").getContext("2d");
          if (context === null) throw new Error("no canvas context");
          context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          return [id, { zero: context.measureText("0").width, width: element.getBoundingClientRect().width }];
        }),
      ),
    ids,
  );
}

describe("US3-2: running text keeps to the reading measure, a pre and a wide table use the container's width (FR-016)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 1280 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme });
    const measured = await zeroWidths(page, ["p", "li", "blockquote"]);
    const container = await page.evaluate(() => document.getElementById("prose")?.clientWidth ?? 0);
    const wide = await page.evaluate(() => ["pre", "wide"].map((id) => document.getElementById(id)?.getBoundingClientRect().width ?? 0));
    await close(page);
    const measure = 68 * (measured.p?.zero ?? 0);
    expect(measure).toBeGreaterThan(600);
    expect(container).toBe(1280);
    // The container is wider than the measure, so each of these is exactly at it (the measure is a maximum).
    expect(Object.entries(measured).filter(([, each]) => Math.abs(each.width - 68 * each.zero) > 1).map(([id, each]) => `${id}: ${String(each.width)}`)).toEqual([]);
    expect(wide).toEqual([container, container]);
    expect(Math.min(...wide)).toBeGreaterThan(measure);
  });
});

/** Every cell of the tables `ids` narrower than 12 times the width of "0" in its own font (FR-017, R-13). */
function cellFloorProblems(page: Page, ids: readonly string[]): Promise<{ readonly cells: number; readonly problems: string[] }> {
  return page.evaluate((ids) => {
    const context = document.createElement("canvas").getContext("2d");
    if (context === null) throw new Error("no canvas context");
    const problems: string[] = [];
    let cells = 0;
    for (const id of ids) {
      for (const cell of document.querySelectorAll(`#${id} th, #${id} td`)) {
        const style = getComputedStyle(cell);
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const floor = 12 * context.measureText("0").width;
        cells += 1;
        if (cell.getBoundingClientRect().width < floor - 0.5) problems.push(`${id}: a cell of ${String(cell.getBoundingClientRect().width)} px`);
      }
    }
    return { cells, problems };
  }, ids);
}

describe("US3-3: each wide table scrolls in its own box at 320 px, every cell keeps the 12ch floor, and the page does not scroll (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const sizes = await boxes(page, ["wide", "wide-plain", "wide-link", "fits"]);
    const floor = await cellFloorProblems(page, ["wide", "wide-plain", "wide-link", "fits"]);
    const scrolls = await pageScrolls(page);
    await close(page);
    expect(Object.entries(sizes).map(([id, size]) => [id, size.scroll > size.client])).toEqual([
      ["wide", true],
      ["wide-plain", true],
      ["wide-link", true],
      ["fits", false],
    ]);
    expect(sizes.wide?.client).toBe(320);
    expect(floor).toEqual({ cells: 3 * 36 + 6, problems: [] });
    expect(scrolls).toBe(false);
  });
});

/** The keyboard-focused table's ring must lie inside the viewport on all four sides (an inset ring, US3-3). */
async function tableRingProblems(page: Page, id: string): Promise<string[]> {
  if (!(await reaches(page, id))) return [`${id}: not a tab stop`];
  const outside = await page.evaluate((id) => {
    const element = document.getElementById(id);
    if (element === null) throw new Error(`no #${id}`);
    const style = getComputedStyle(element);
    const reach = parseFloat(style.outlineOffset) + parseFloat(style.outlineWidth);
    const box = element.getBoundingClientRect();
    return box.left - reach < 0 || box.top - reach < 0 || box.right + reach > window.innerWidth || box.bottom + reach > window.innerHeight;
  }, id);
  return outside ? [`${id}: ring outside the viewport`] : [];
}

describe("US3-3: Tab moves onto each wide table, which shows the inset ring, scrolls with ArrowRight and is named by its caption (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const found: Record<string, unknown> = {};
    for (const id of ["wide", "wide-plain"]) {
      const ring = await tableRingProblems(page, id);
      const outline = await computed(page, id, ["outline-style", "outline-width", "outline-color", "outline-offset"]);
      const node = await focusedNode(page);
      const scrolled = await arrowRight(page, id);
      found[id] = { ring, outline, node, scrolled: scrolled > 0, page: await pageScrolls(page) };
    }
    await close(page);
    const planted = await open("prose.html?after=plants/table-ring", { colorScheme: theme, width: 320 });
    const plantedRing = [...(await tableRingProblems(planted, "wide")), ...(await tableRingProblems(planted, "wide-plain"))];
    await close(planted);
    const outline = { "outline-style": "solid", "outline-width": "3px", "outline-color": colours[theme].focus, "outline-offset": "-3px" };
    expect(found).toEqual({
      wide: { ring: [], outline, node: { role: "table", name: caption }, scrolled: true, page: false },
      "wide-plain": { ring: [], outline, node: { role: "table", name: "" }, scrolled: true, page: false },
    });
    expect(plantedRing).toEqual(["wide: ring outside the viewport", "wide-plain: ring outside the viewport"]);
  });
});

interface Line {
  readonly left: number;
  readonly right: number;
}

/**
 * The caption's line boxes and the table's visible box (R-06): the caption text's `Range.getClientRects()`, merged
 * per line (rects whose top agrees within 1 px; the smallest left and the largest right), since the browser gives one
 * rect per text-direction run and a trailing full stop under rtl is a rect of its own.
 */
function captionLines(page: Page, id: string): Promise<{ readonly box: Line; readonly lines: readonly Line[] }> {
  return page.evaluate((id) => {
    const table = document.getElementById(id);
    const text = table?.querySelector("caption");
    if (table === null || text === null || text === undefined) throw new Error(`no caption in #${id}`);
    const range = document.createRange();
    range.selectNodeContents(text);
    const merged: { top: number; left: number; right: number }[] = [];
    for (const rect of range.getClientRects()) {
      if (rect.width === 0) continue;
      const line = merged.find((each) => Math.abs(each.top - rect.top) <= 1);
      if (line === undefined) merged.push({ top: rect.top, left: rect.left, right: rect.right });
      else {
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
      }
    }
    const box = table.getBoundingClientRect();
    return { box: { left: box.left, right: box.right }, lines: merged.map((line) => ({ left: line.left, right: line.right })) };
  }, id);
}

type Direction = "ltr" | "rtl";

/** What is wrong with the caption's line boxes: one outside the visible box, or (at scrollLeft 0) one off its start edge. */
function lineProblems(found: { readonly box: Line; readonly lines: readonly Line[] }, direction: Direction, when: string, atStart: boolean): string[] {
  const problems: string[] = [];
  if (found.lines.length === 0) problems.push(`${when}: no caption line`);
  if (found.lines.some((line) => line.left < found.box.left - 1 || line.right > found.box.right + 1)) problems.push(`${when}: a line outside the box`);
  const start = (line: Line): number => (direction === "ltr" ? Math.abs(line.left - found.box.left) : Math.abs(line.right - found.box.right));
  if (atStart && found.lines.some((line) => start(line) > 1)) problems.push(`${when}: a line not at the start edge`);
  return problems;
}

/**
 * The caption of the table `id` at 320 px (US3-3, US3-9): at scrollLeft 0 every line box lies inside the visible box
 * and starts at its start edge; then the table is scrolled (ltr: Tab onto it and two ArrowRight presses; rtl: its most
 * negative scrollLeft) and every line box still lies inside it.
 */
async function captionProblems(page: Page, id: string, direction: Direction): Promise<string[]> {
  if (direction === "rtl") {
    await page.evaluate(() => {
      document.documentElement.setAttribute("dir", "rtl");
    });
  }
  const problems = lineProblems(await captionLines(page, id), direction, "at 0", true);
  let scrolled: number;
  if (direction === "ltr") {
    if (!(await reaches(page, id))) problems.push("scrolled: the table is not a tab stop");
    scrolled = await arrowRight(page, id);
  } else {
    scrolled = await page.evaluate((id) => {
      const table = document.getElementById(id);
      if (table === null) throw new Error(`no #${id}`);
      table.scrollLeft = -(table.scrollWidth - table.clientWidth);
      return table.scrollLeft;
    }, id);
  }
  if (scrolled === 0) problems.push("scrolled: the table did not scroll");
  return [...problems, ...lineProblems(await captionLines(page, id), direction, "scrolled", false)];
}

/** Runs captionProblems on a fresh page with each caption plant of R-10 linked after base.css. */
async function plantedCaptions(theme: Theme, direction: Direction): Promise<Record<string, string[]>> {
  const found: Record<string, string[]> = {};
  for (const plant of ["caption-cap", "caption-static", "caption-center"]) {
    const page = await open(`prose.html?after=plants/${plant}`, { colorScheme: theme, width: 320 });
    found[plant] = await captionProblems(page, "wide", direction);
    await close(page);
  }
  return found;
}

describe("US3-3: the caption wraps inside the wide table's visible box at its start edge, and stays in it while the table scrolls (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px under ltr", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const lines = (await captionLines(page, "wide")).lines.length;
    const problems = await captionProblems(page, "wide", "ltr");
    await close(page);
    const planted = await plantedCaptions(theme, "ltr");
    expect(lines).toBeGreaterThan(1);
    expect(problems).toEqual([]);
    expect(planted).toEqual({
      "caption-cap": ["at 0: a line outside the box", "scrolled: a line outside the box"],
      "caption-static": ["scrolled: a line outside the box"],
      "caption-center": ["at 0: a line not at the start edge"],
    });
  });
});

/** The table that fits must neither overflow its box nor be a tab stop (FR-017). */
function fitsProblems(size: { readonly client: number; readonly scroll: number } | undefined, cycle: readonly string[], id: string): string[] {
  const problems: string[] = [];
  if (size === undefined || size.client !== size.scroll) problems.push(`${id}: overflows`);
  if (cycle.includes(id)) problems.push(`${id}: a tab stop`);
  return problems;
}

describe("US3-3: Tab never moves onto the table that fits (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const cycle = await tabCycle(page, 12);
    const problems = fitsProblems((await boxes(page, ["fits"])).fits, cycle, "fits");
    await close(page);
    const planted = await open("prose.html?after=plants/table-fits", { colorScheme: theme, width: 320 });
    const plantedProblems = fitsProblems((await boxes(planted, ["fits"])).fits, await tabCycle(planted, 12), "fits");
    await close(planted);
    expect(cycle.slice(0, 5)).toEqual(["link", "wide", "wide-plain", "cell-link", "long-url"]);
    expect(problems).toEqual([]);
    expect(plantedProblems).toEqual(["fits: overflows", "fits: a tab stop"]);
  });
});

const hosted = ["grid-wide", "flex-wide", "nested-wide"];

describe("US3-3: in a grid, a flex and a nested host beside a rail, the page does not scroll while the wide table scrolls in its own box (FR-017, SC-004)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px and at 200% zoom", async (theme) => {
    const found: Record<string, unknown> = {};
    for (const [label, width, scale] of [["320 px", 320, 1], ["200%", 640, 2]] as const) {
      const page = await open("prose-hosts.html", { colorScheme: theme, width, scale });
      const sizes = await boxes(page, hosted);
      found[label] = { page: await pageScrolls(page), overflowing: hosted.filter((id) => (sizes[id]?.scroll ?? 0) > (sizes[id]?.client ?? 0)) };
      await close(page);
    }
    const planted = await open("prose-hosts.html?after=plants/table-container", { colorScheme: theme, width: 320 });
    const plantedScroll = await pageScrolls(planted);
    await close(planted);
    expect(found).toEqual({ "320 px": { page: false, overflowing: hosted }, "200%": { page: false, overflowing: hosted } });
    expect(plantedScroll).toBe(true);
  });
});

/** Opens prose-hosts.html at 1280 px with its dialog opened by showModal() (the definite-width host, US3-3). */
async function openDialog(path: string, theme: Theme): Promise<Page> {
  const page = await open(path, { colorScheme: theme });
  await page.evaluate(() => {
    (document.getElementById("dialog") as HTMLDialogElement | null)?.showModal();
  });
  return page;
}

describe("US3-3: in a modal dialog of definite width, the table that fits keeps its width and is not a tab stop, and the wide table scrolls (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 1280 px", async (theme) => {
    const page = await openDialog("prose-hosts.html", theme);
    const opened = await page.evaluate(() => (document.getElementById("dialog") as HTMLDialogElement | null)?.open ?? false);
    const sizes = await boxes(page, ["dialog-wide", "fits-dialog"]);
    const cycle = await tabCycle(page, 6);
    const problems = fitsProblems(sizes["fits-dialog"], cycle, "fits-dialog");
    const reported = await violations(page);
    await close(page);
    const planted = await openDialog("prose-hosts.html?after=plants/table-fits", theme);
    const plantedProblems = fitsProblems((await boxes(planted, ["fits-dialog"]))["fits-dialog"], await tabCycle(planted, 6), "fits-dialog");
    await close(planted);
    expect(opened).toBe(true);
    expect((sizes["dialog-wide"]?.scroll ?? 0) > (sizes["dialog-wide"]?.client ?? 0)).toBe(true);
    expect(sizes["fits-dialog"]?.client).toBeGreaterThan(200);
    expect(cycle).toContain("dialog-wide");
    expect(problems).toEqual([]);
    expect(reported).toEqual([]);
    expect(plantedProblems).toEqual(["fits-dialog: overflows", "fits-dialog: a tab stop"]);
  });
});

describe("US3-4: header cells are 12 px Schibsted Grotesk with tabular figures, not monospace (FR-018)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme });
    const found = await page.evaluate(
      ({ monospace }) =>
        [...document.querySelectorAll("#prose th")].map((cell) => {
          const style = getComputedStyle(cell);
          const names = style.fontFamily.split(",").map((part) => part.trim().replace(/^["']|["']$/g, "").toLowerCase());
          return `${style.fontSize} ${style.fontFamily.split(",")[0] ?? ""} ${style.fontVariantNumeric} ${String(names.some((name) => name === "monospace" || monospace.includes(name)))}`;
        }),
      { monospace: monospaceFamilies.map((each) => each.toLowerCase()) },
    );
    await close(page);
    expect(found.length).toBe(3 * 12 + 2);
    expect([...new Set(found)]).toEqual([`12px ${sans} tabular-nums false`]);
  });
});

/** US3-5: the scoped elements of a copy (outside the container, or in an undocumented one) with a prose value. */
function scopeProblems(page: Page, prefixes: readonly string[]): Promise<string[]> {
  return page.evaluate((prefixes) => {
    const problems: string[] = [];
    for (const prefix of prefixes) {
      const style = (id: string): CSSStyleDeclaration => getComputedStyle(document.getElementById(`${prefix}-${id}`) ?? document.body);
      if (style("p").lineHeight === "26.4px") problems.push(`${prefix}-p: prose line height`);
      if (style("h1").fontSize === "30px") problems.push(`${prefix}-h1: prose size`);
      if (style("h2").fontSize === "18px") problems.push(`${prefix}-h2: prose size`);
      if (style("table").display === "block") problems.push(`${prefix}-table: prose scroll box`);
      if (style("th").fontSize === "12px") problems.push(`${prefix}-th: prose size`);
    }
    return problems;
  }, prefixes);
}

describe("US3-5: the prose values apply inside the container, and neither outside it nor in a container with an undocumented value (FR-014, FR-005)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme });
    const inside = await page.evaluate(() =>
      ["p", "h1", "h2", "wide", "wide-th"].map((id) => {
        const style = getComputedStyle(document.getElementById(id) ?? document.body);
        return [id, style.fontSize, style.lineHeight, style.display];
      }),
    );
    const outside = await scopeProblems(page, ["out", "true"]);
    await close(page);
    const leaked = await open("prose.html?after=plants/prose-page", { colorScheme: theme });
    const plantedPage = await scopeProblems(leaked, ["out", "true"]);
    await close(leaked);
    const presence = await open("prose.html?after=plants/prose-presence", { colorScheme: theme });
    const plantedPresence = await scopeProblems(presence, ["out", "true"]);
    await close(presence);
    expect(inside).toEqual([
      ["p", "16px", "26.4px", "block"],
      ["h1", "30px", "34.5px", "block"],
      ["h2", "18px", "20.7px", "block"],
      ["wide", "16px", "26.4px", "block"],
      ["wide-th", "12px", "19.8px", "table-cell"],
    ]);
    expect(outside).toEqual([]);
    expect(plantedPage).toEqual(["out-p: prose line height", "true-p: prose line height"]);
    expect(plantedPresence).toEqual(["true-p: prose line height"]);
  });
});

/** US3-5 on prose-root.html: the container rule must not set the root's font size or line height. */
function rootProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    const problems: string[] = [];
    if (style.fontSize !== "16px") problems.push(`root font size: ${style.fontSize}`);
    if (style.lineHeight !== "normal") problems.push(`root line height: ${style.lineHeight}`);
    return problems;
  });
}

describe("US3-5: on <html> the prose hook's container rule sets neither the root font size nor its line height (FR-015)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s, while the element rules still reach its h2", async (theme) => {
    const page = await open("prose-root.html", { colorScheme: theme });
    const hooked = await page.evaluate(() => document.documentElement.getAttribute("data-ocelle-prose"));
    const h2 = await computed(page, "h2", ["font-size", "font-weight"]);
    const root = await rootProblems(page);
    await close(page);
    const planted = await open("prose-root.html?after=plants/prose-root", { colorScheme: theme });
    const plantedRoot = await rootProblems(planted);
    await close(planted);
    expect(hooked).toBe("");
    expect(h2).toEqual({ "font-size": "18px", "font-weight": "600" });
    expect(root).toEqual([]);
    expect(plantedRoot).toEqual(["root line height: 26.4px"]);
  });
});

interface LinkState {
  readonly color: string;
  readonly underline: boolean;
}

/** The link's colour and underline at rest, on hover and on keyboard focus, and the <a id> target's, with its text's colour. */
async function linkStates(page: Page): Promise<{ readonly rest: LinkState; readonly hover: LinkState; readonly focus: LinkState; readonly anchor: LinkState; readonly text: string }> {
  const read = (id: string): Promise<LinkState> =>
    page.evaluate((id) => {
      const style = getComputedStyle(document.getElementById(id) ?? document.body);
      return { color: style.color, underline: style.textDecorationLine.split(" ").includes("underline") };
    }, id);
  const rest = await read("link");
  const anchor = await read("anchor");
  const text = await page.evaluate(() => getComputedStyle(document.getElementById("p") ?? document.body).color);
  await page.hover("#link");
  const hover = await read("link");
  await page.mouse.move(0, 0);
  await tabTo(page, "link");
  const focus = await read("link");
  return { rest, hover, focus, anchor, text };
}

/** US3-6 guards: the link is underlined in every state, and the <a id> target keeps the running text's colour. */
function linkProblems(states: Awaited<ReturnType<typeof linkStates>>): string[] {
  const problems: string[] = [];
  for (const state of ["rest", "hover", "focus"] as const) if (!states[state].underline) problems.push(`link: not underlined on ${state}`);
  if (states.anchor.color !== states.text) problems.push("anchor: not the running text's colour");
  if (states.anchor.underline) problems.push("anchor: underlined");
  return problems;
}

describe("US3-6: a prose link is link-coloured, link-hover on hover, underlined in every state; an <a id> target is not a link (FR-019)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme });
    const states = await linkStates(page);
    await close(page);
    const plain = await open("prose.html?after=plants/link-underline", { colorScheme: theme });
    const plantedUnderline = linkProblems(await linkStates(plain));
    await close(plain);
    const coloured = await open("prose.html?after=plants/link-anchor", { colorScheme: theme });
    const plantedAnchor = linkProblems(await linkStates(coloured));
    await close(coloured);
    const c = colours[theme];
    expect([states.rest.color, states.hover.color, states.focus.color]).toEqual([c.link, c.linkHover, c.link]);
    expect(states.text).toBe(c.ink);
    expect(linkProblems(states)).toEqual([]);
    expect(plantedUnderline).toEqual(["link: not underlined on hover", "link: not underlined on focus"]);
    expect(plantedAnchor).toEqual(["anchor: not the running text's colour"]);
  });
});

// The table-semantics guard of US3-7 has no plant: the spike measured that `display: grid` on the prose table, the
// R-10 candidate, keeps role `table`, the caption name, every row, column header and cell and their association, so
// no CSS plant drops the structure in Chromium (reviews/phase-2/spike.md, R-10). It shares its test with the positive
// that the wide tables are scroll boxes and the table that fits is not.
describe("US3-7: prose tables keep role table, their rows, column headers and cells, each cell under its column header, overflowing or not (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const trees = await tableTrees(page);
    const sizes = await boxes(page, ["wide", "wide-plain", "wide-link", "fits"]);
    const display = await page.evaluate(() => ["wide", "fits"].map((id) => getComputedStyle(document.getElementById(id) ?? document.body).display));
    await close(page);
    const wide = (name: string, first: string): TableTree => ({ name, header: [first, ...regions.slice(1)], headerRoles: twelve("columnheader"), body: [twelve("cell"), twelve("cell")] });
    expect({ wide: trees.wide, "wide-plain": trees["wide-plain"], "wide-link": trees["wide-link"], fits: trees.fits }).toEqual({
      wide: wide(caption, "North"),
      "wide-plain": wide("", "North"),
      "wide-link": wide("", "North"),
      fits: { name: "", header: ["Key", "Value"], headerRoles: ["columnheader", "columnheader"], body: [["cell", "cell"], ["cell", "cell"]] },
    });
    expect(display).toEqual(["block", "block"]);
    expect([sizes.wide, sizes.fits].map((size) => (size?.scroll ?? 0) > (size?.client ?? 0))).toEqual([true, false]);
  });
});

/** US3-8: the code block's selected text must equal its source text (what a copy gives). */
function copyProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const pre = document.getElementById("pre");
    const selection = window.getSelection();
    if (pre === null || selection === null) throw new Error("no #pre or no selection");
    selection.selectAllChildren(pre);
    const copied = selection.toString();
    selection.removeAllRanges();
    return copied === pre.textContent ? [] : ["pre: copied text differs from the source"];
  });
}

describe("US3-8: a code block wraps a 200-character line inside itself at 320 px, does not scroll, and copies exactly (FR-016)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const style = await computed(page, "pre", ["white-space", "overflow-wrap"]);
    const size = (await boxes(page, ["pre"])).pre;
    const source = await page.evaluate(() => document.getElementById("pre")?.textContent ?? "");
    const lines = await page.evaluate(() => {
      const range = document.createRange();
      range.selectNodeContents(document.getElementById("pre-code") ?? document.body);
      return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
    });
    const copy = await copyProblems(page);
    const scrolls = await pageScrolls(page);
    await close(page);
    const planted = await open("prose.html?after=plants/pre-copy", { colorScheme: theme, width: 320 });
    const plantedCopy = await copyProblems(planted);
    await close(planted);
    expect(style).toEqual({ "white-space": "pre-wrap", "overflow-wrap": "anywhere" });
    expect(size?.scroll).toBe(size?.client);
    expect(source.split("\n").map((line) => line.length)).toEqual([200, 33]);
    expect(lines).toBeGreaterThan(3);
    expect(copy).toEqual([]);
    expect(scrolls).toBe(false);
    expect(plantedCopy).toEqual(["pre: copied text differs from the source"]);
  });
});

/** The inline-start sides of the list and the block quote, as physical values. */
function startSides(page: Page): Promise<Record<string, Record<string, string>>> {
  return page.evaluate(() => {
    const read = (id: string, properties: readonly string[]): Record<string, string> => {
      const style = getComputedStyle(document.getElementById(id) ?? document.body);
      return Object.fromEntries(properties.map((property) => [property, style.getPropertyValue(property)]));
    };
    return {
      ul: read("ul", ["padding-left", "padding-right"]),
      blockquote: read("blockquote", ["padding-left", "padding-right", "border-left-width", "border-right-width"]),
    };
  });
}

describe("US3-9: under dir=\"rtl\" the inline-start indents are on the right, and the caption stays inside the box at its right edge (FR-025, FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const ltr = await startSides(page);
    const problems = await captionProblems(page, "wide", "rtl");
    const rtl = await startSides(page);
    await close(page);
    const planted = await plantedCaptions(theme, "rtl");
    expect(ltr).toEqual({
      ul: { "padding-left": "24px", "padding-right": "0px" },
      blockquote: { "padding-left": "16px", "padding-right": "0px", "border-left-width": "3px", "border-right-width": "0px" },
    });
    expect(rtl).toEqual({
      ul: { "padding-left": "0px", "padding-right": "24px" },
      blockquote: { "padding-left": "0px", "padding-right": "16px", "border-left-width": "0px", "border-right-width": "3px" },
    });
    expect(problems).toEqual([]);
    expect(planted).toEqual({
      "caption-cap": ["at 0: a line outside the box", "scrolled: a line outside the box"],
      "caption-static": ["scrolled: a line outside the box"],
      "caption-center": ["at 0: a line not at the start edge"],
    });
  });
});

describe("US3-10: in forced colours, table cell borders and hr stay visible in a system colour (FR-025)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, forced: true });
    const found = await page.evaluate(() => {
      const ground = getComputedStyle(document.body).backgroundColor;
      const side = (id: string, edge: "top" | "bottom"): string[] => {
        const style = getComputedStyle(document.getElementById(id) ?? document.body);
        const colour = style.getPropertyValue(`border-${edge}-color`);
        return [style.getPropertyValue(`border-${edge}-width`), style.getPropertyValue(`border-${edge}-style`), String(colour !== ground)];
      };
      return { "wide-td": side("wide-td", "bottom"), "wide-th": side("wide-th", "bottom"), hr: side("hr", "top") };
    });
    const forced = await page.evaluate(() => matchMedia("(forced-colors: active)").matches);
    await close(page);
    expect(forced).toBe(true);
    expect(found).toEqual({ "wide-td": ["1px", "solid", "true"], "wide-th": ["1px", "solid", "true"], hr: ["1px", "solid", "true"] });
  });
});

/** US3-11: a long inline code path and a bare URL link that wrap inside their paragraph, with the page not scrolling. */
function longProblems(page: Page): Promise<Record<string, unknown>> {
  return page.evaluate(() => {
    const paragraph = document.getElementById("long")?.getBoundingClientRect();
    if (paragraph === undefined) throw new Error("no #long");
    const read = (id: string): unknown => {
      const element = document.getElementById(id);
      if (element === null) throw new Error(`no #${id}`);
      const rects = [...element.getClientRects()];
      return {
        wrap: getComputedStyle(element).overflowWrap,
        lines: rects.length > 1,
        inside: rects.every((rect) => rect.left >= paragraph.left - 1 && rect.right <= paragraph.right + 1),
      };
    };
    return { code: read("long-code"), url: read("long-url"), page: document.documentElement.scrollWidth > window.innerWidth };
  });
}

describe("US3-11: a 120-character inline code path and bare URL link wrap inside their paragraph at 320 px and 200% zoom (FR-016, FR-019)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s", async (theme) => {
    const found: Record<string, unknown> = {};
    for (const [label, width, scale] of [["320 px", 320, 1], ["200%", 640, 2]] as const) {
      const page = await open("prose.html", { colorScheme: theme, width, scale });
      const lengths = await page.evaluate(() => ["long-code", "long-url"].map((id) => document.getElementById(id)?.textContent.length ?? 0));
      found[label] = { lengths, ...(await longProblems(page)) };
      await close(page);
    }
    const wrapped = { wrap: "anywhere", lines: true, inside: true };
    expect(found).toEqual({ "320 px": { lengths: [120, 120], code: wrapped, url: wrapped, page: false }, "200%": { lengths: [120, 120], code: wrapped, url: wrapped, page: false } });
  });
});

describe("US3-12: in the wide table with a link, Tab lands on the link, which shows the ring, and ArrowRight scrolls the table (FR-017)", { timeout: 60_000 }, () => {
  it.each(themes)("in %s at 320 px", async (theme) => {
    const page = await open("prose.html", { colorScheme: theme, width: 320 });
    const before = await reaches(page, "wide-plain");
    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.id);
    const ring = await computed(page, "cell-link", ["outline-style", "outline-width", "outline-color", "outline-offset"]);
    const scrolled = await arrowRight(page, "wide-link");
    const still = await page.evaluate(() => document.activeElement?.id);
    const scroll = await page.evaluate(() => ({ x: window.scrollX, wide: document.documentElement.scrollWidth > window.innerWidth }));
    await close(page);
    expect(before).toBe(true);
    expect(focused).toBe("cell-link");
    expect(ring).toEqual({ "outline-style": "solid", "outline-width": "3px", "outline-color": colours[theme].focus, "outline-offset": "2px" });
    expect(scrolled).toBeGreaterThan(0);
    expect(still).toBe("cell-link");
    expect(scroll).toEqual({ x: 0, wide: false });
  });
});
