// The shared bodies of User Story 3's browser scenarios for `ocelle-list-detail` (009 spec US3 scenarios 1 to 16, the
// Edge Cases "list-detail with an empty list slot", "Zoom and root font size" and "Container tiers and the viewport",
// FR-022 to FR-031; contracts/elements.md § `ocelle-list-detail`; research.md R-11 to R-14, R-17; data-model.md
// § list-detail; T047). Each scenario sets its frame's viewport, observes the page through the driver with real input
// only, and returns one observation; each harness asserts it equals the scenario's `expected`, written by hand from the
// spec and research:
// - the frames of the spec (Frame R 1196 px and Frame W 876 px at a 1280 px viewport, N 636 px at 720 px, S 288 px at
//   320 px);
// - the tracks: the list `--ocelle-list-track-width` (18rem, 288 px), the inspector `--ocelle-shell-inspector-width`
//   (19rem, 304 px, its 1 px border inside), the detail the rest: in Frame R 1196 − 288 − 304 = 604 px, in Frame W
//   876 − 288 = 588 px, in two columns without an inspector in Frame R 1196 − 288 = 908 px; the 1 px
//   `--ocelle-color-rule` borders on the logical side;
// - the thresholds: `--ocelle-list-detail-collapse` 40rem (640 px), `--ocelle-list-detail-inspector-collapse` 60rem
//   (960 px), exclusive, so Frame R (1196) has three columns, Frame W (876) two, Frame N (636) one;
// - the focus ring tokens (`--ocelle-focus-width` 3 px, `--ocelle-color-focus`) drawn inset;
// - US3-12's intrinsic figures of research.md R-13: with short list and inspector text and a 30rem (480 px) detail
//   block that does not wrap, the three-column max-content is 288 + 480 + 1 + 304 = 1073 px; with a 35rem block,
//   288 + 560 + 1 + 304 = 1153 px; with a 40rem block, 1233 px, shrunk to 1196 px in a 1196 px row.
// The pane wrappers are the shadow grid's `.pane.list`, `.pane.detail` and `.pane.inspector` (research.md R-11, R-14), and
// the tier is the grid's `data-tier` (R-11), read only by the frame records, which must never show the measurement
// grid. Every "does not" outcome is observed in the same scenario as the positive outcome it guards (spec § "Does not"
// outcomes, paired), and the plant that makes it fail is named beside it; each plant is run once and recorded in
// specs/009-workflow-layouts/reviews/phase-4/plants.md (T061).
import type { Driver, Target } from "./driver.ts";
import { systemColours, tokenColour } from "./icon.ts";
import { pageScrolls, roles } from "./board.ts";
import type { BoardScenario } from "./board.ts";
import { at, focusColour, near, readOnce } from "./scroller.ts";

/** A scenario of User Story 3 and whether its page links `base.css` (the fixture then opens `list-detail-base.html`). */
export type ListDetailScenario = BoardScenario;

/** The viewports of the frames (spec § Layout frames). */
const viewports = { W: [1280, 800], R: [1280, 800], N: [720, 800], S: [320, 800] } as const;
type Frame = keyof typeof viewports;

/** The test page's rules: the blocks of US3-12, the rows, the dialog, the table, the clipping frame and the probes. */
const rules = [
  ".w30 { display: block; inline-size: 30rem; block-size: 2rem; }",
  ".w35 { display: block; inline-size: 35rem; block-size: 2rem; }",
  ".w35-tall { display: block; inline-size: 35rem; block-size: 4rem; }",
  ".w40 { display: block; inline-size: 40rem; block-size: 2rem; }",
  ".wide > .w30 { inline-size: 40rem; }",
  ".row { display: flex; inline-size: 1196px; }",
  ".row-n { display: flex; inline-size: 636px; }",
  ".row-s { display: flex; inline-size: 200px; }",
  ".half { transform: scale(0.5); transform-origin: 0 0; }",
  ".dialog { max-inline-size: var(--ocelle-dialog-max-inline); }",
  ".table-n { inline-size: 636px; }",
  ".clip { overflow: hidden; }",
  ".f720 { inline-size: 720px; }",
  ".cq { container-type: inline-size; }",
  ".vw80 { display: block; inline-size: 80vw; block-size: 1px; }",
  "test-appender { display: block; }",
  "test-shadow-frame { display: block; }",
].join("\n");

/**
 * Sets the frame's viewport, mounts an empty `#page` block, adds the test rules (and `extra`), then puts `markup` in
 * `#page`, so every rule applies before the elements upgrade and first measure. `#page` holds everything, so the page
 * scrolls in the inline direction exactly when `#page` overflows (`pageScrolls`).
 */
export async function page(driver: Driver, frame: Frame, markup: string, options: { readonly extra?: string; readonly base?: boolean } = {}): Promise<void> {
  const [width, height] = viewports[frame];
  await driver.viewport(width, height);
  await driver.mount('<div id="page"></div>', { base: options.base ?? false });
  await driver.rules(rules + (options.extra ?? ""));
  await driver.setProperty("page", "innerHTML", markup);
  await driver.settle();
}

export const before = '<button id="before" type="button">before</button>';
export const after = '<button id="after" type="button">after</button>';

/** The list pane's content: a text and two buttons. */
export const listPane = (id: string): string =>
  `<div slot="list" id="${id}-list"><p id="${id}-lt">Records</p><button id="${id}-l0" type="button">Record WP-01</button> <button id="${id}-l1" type="button">Record WP-02</button></div>`;
/** The detail pane's content: a text and a button. */
export const detailPane = (id: string): string => `<div id="${id}-detail"><p id="${id}-dt">Detail of WP-01</p><button id="${id}-d0" type="button">Edit</button></div>`;
/** The inspector pane's content: a text and a button. */
export const inspectorPane = (id: string): string => `<div slot="inspector" id="${id}-insp"><p>Inspector of WP-01</p><button id="${id}-i0" type="button">Assign</button></div>`;

/** A list-detail with `id`, its attributes (each with a leading space) and its content (all three panes by default). */
export const listDetail = (id: string, attributes = "", inner = `${listPane(id)}${detailPane(id)}${inspectorPane(id)}`): string =>
  `<ocelle-list-detail id="${id}"${attributes}>${inner}</ocelle-list-detail>`;

/** A list-detail in a frame box (`<id>-frame`, with `container`'s attributes). */
export const framed = (id: string, frame: Frame, attributes = "", inner?: string, container = ""): string =>
  `<div id="${id}-frame" data-frame="${frame}"${container}>${listDetail(id, attributes, inner)}</div>`;

/** US3-12's content: short list and inspector text and a detail block 30rem wide that does not wrap. */
const sized = (id: string, detail = `<div id="${id}-detail"><div class="w30"></div></div>`): string =>
  `<div slot="list" id="${id}-list">One</div>${detail}<div slot="inspector" id="${id}-insp">Inspector</div>`;

const round = (value: number): number => Math.round(value * 100) / 100;

/** A shown pane's inline offset from the host's border box and its inline size; null for a pane with no box. */
interface PaneBox {
  readonly x: number;
  readonly width: number;
}

/** The three panes' boxes, null for a pane that is not shown, and whether the inspector sits under the detail. */
export async function panes(driver: Driver, id: string): Promise<{ list: PaneBox | null; detail: PaneBox | null; inspector: PaneBox | null; stacked: boolean }> {
  const host = await driver.box(id);
  const boxes = await Promise.all((["list", "detail", "inspector"] as const).map((pane) => driver.box(id, `.pane.${pane}`)));
  const [list, detail, inspector] = boxes.map((box) => (box.display === "none" || box.display === "absent" ? null : { x: round(box.x - host.x), width: round(box.width), y: box.y, height: box.height }));
  const stacked = inspector !== null && inspector !== undefined && detail !== null && detail !== undefined && inspector.y >= detail.y + detail.height - 0.5;
  const strip = (box: (PaneBox & { y: number; height: number }) | null | undefined): PaneBox | null => (box === null || box === undefined ? null : { x: box.x, width: box.width });
  return { list: strip(list), detail: strip(detail), inspector: strip(inspector), stacked };
}

/** The layout a list-detail shows, from its panes' boxes: `three`, `two`, `one: list` or `one: detail`. */
export async function layout(driver: Driver, id: string): Promise<string> {
  const { list, detail, inspector, stacked } = await panes(driver, id);
  if (list !== null && detail !== null) return inspector !== null && !stacked ? "three" : "two";
  if (list !== null) return "one: list";
  return detail !== null ? "one: detail" : "none";
}

/** A pane's physical left, right and top borders: `0px`, or the width and the colour. */
async function borders(driver: Driver, id: string, pane: string): Promise<{ left: string; right: string; top: string }> {
  const side = async (name: string): Promise<string> => {
    const width = await driver.computed({ id, inner: `.pane.${pane}` }, `border-${name}-width`);
    return width === "0px" ? width : `${width} ${await driver.computed({ id, inner: `.pane.${pane}` }, `border-${name}-color`)}`;
  };
  return { left: await side("left"), right: await side("right"), top: await side("top") };
}

/** The names of the text nodes of the element's accessibility subtree, slotted content included, in tree order. */
async function texts(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).filter((node) => node.role === "StaticText").map((node) => node.name);
}

/** The `tabindex` of each pane wrapper, in pane order (null when absent). */
async function wrapperTabindex(driver: Driver, id: string): Promise<(string | null)[]> {
  const parts = await driver.elements(id);
  return ["list", "detail", "inspector"].map((pane) => parts.find((part) => part.attributes.class?.split(" ").includes(pane) === true && part.attributes.class.split(" ").includes("pane"))?.attributes.tabindex ?? null);
}

/** The pane wrapper's focus ring: its computed outline style, width, offset and colour. */
async function ring(driver: Driver, id: string, pane: string): Promise<Record<string, string>> {
  const target: Target = { id, inner: `.pane.${pane}` };
  const out: Record<string, string> = {};
  for (const property of ["outline-style", "outline-width", "outline-offset", "outline-color"]) out[property] = await driver.computed(target, property);
  return out;
}

const rule = (theme: "light" | "dark" = "light"): string => `1px ${tokenColour("color-rule", theme)}`;
const none = { left: "0px", right: "0px", top: "0px" };

const pane = (x: number, width: number): PaneBox => ({ x, width });
/** Three columns in Frame R. */
const threeR = { list: pane(0, 288), detail: pane(288, 604), inspector: pane(892, 304), stacked: false };
/** Two columns in Frame W, the inspector stacked under the detail. */
const twoW = { list: pane(0, 288), detail: pane(288, 588), inspector: pane(288, 588), stacked: true };
/** One column at `width`, the list shown. */
const oneList = (width: number): unknown => ({ list: pane(0, width), detail: null, inspector: null, stacked: false });
/** One column at `width`, the detail shown with the inspector under it. */
const oneDetail = (width: number): unknown => ({ list: null, detail: pane(0, width), inspector: pane(0, width), stacked: true });

const listTexts = ["Records", "Record WP-01", "Record WP-02"];
const detailTexts = ["Detail of WP-01", "Edit"];
const inspectorTexts = ["Inspector of WP-01", "Assign"];

/** The frame-record values of a record, without the `keydown` entries, as a set in first-seen order. */
const distinct = (record: readonly string[]): string[] => [...new Set(record.filter((entry) => entry !== "keydown"))];
/** The tiers a tier record shows, in first-seen order, frame readings and `ResizeObserver` readings alike. */
const tierSet = (record: readonly string[]): string[] => distinct(record.map((entry) => entry.replace(/^resize: /, "")));
/**
 * The `resize:` entries of a record, in order. Each distinct size the `ResizeObserver` reported, in order, is what
 * "the first frame record after the change" checks: in process the driver's methods resume inside an animation-frame
 * callback, so a change made there also lets the observer report the old inline size once more in that frame, for a
 * block-size change, before the next frame's pass (research.md R-13: a change made in an animation-frame callback is
 * measured one frame later). No size between the old and the new one is reported.
 */
const resizes = (record: readonly string[]): string[] => record.filter((entry) => entry.startsWith("resize: "));
/** The readings of a record taken in animation frames (not the `resize:` or `keydown` entries), after the first. */
const frameReadings = (record: readonly string[]): string[] => record.slice(1).filter((entry) => !entry.startsWith("resize: ") && entry !== "keydown");

/** Waits `count` animation frames (two per settle). */
async function frames(driver: Driver, count: number): Promise<void> {
  for (let done = 0; done < count; done += 2) await driver.settle();
}

/** The tier the grid shows, read in every frame and every `ResizeObserver` delivery on the host. */
const tierReading = (id: string): { readonly attribute: string; readonly of: Target } => ({ attribute: "data-tier", of: { id, inner: ".grid" } });

/** A shrink-to-fit case of US3-12: the element's inline size, its layout and the tier over ten frames. */
async function shrinkToFit(driver: Driver, markup: string): Promise<unknown> {
  await page(driver, "R", markup);
  const record = await driver.frameRecord("s", tierReading("s"));
  await frames(driver, 10);
  const recorded = await record.stop();
  return { width: Math.round((await driver.box("s")).width), layout: await layout(driver, "s"), tiers: tierSet(recorded), frames: frameReadings(recorded).length >= 10, messages: await driver.messages() };
}

/** The wrappers of the not-rendered cases (O5-01): an inline-block, and `gone`, which takes the box away. */
const notRenderedRules = "\n.ib { display: inline-block; }\n.gone { display: none; }";

/** The `data-tier` of the element's grid, read from its shadow root. */
async function gridTier(driver: Driver, id: string): Promise<string | undefined> {
  return (await driver.elements(id)).find((part) => part.attributes.class === "grid")?.attributes["data-tier"];
}

/**
 * The element's inline size, its layout, its grid's `data-tier` and the per-instance sheet's two figures as the
 * element's shadow nodes compute them: the sizer's inline size and the grid's minimum (research.md R-13).
 */
async function measuredState(driver: Driver, id: string): Promise<unknown> {
  return {
    width: Math.round((await driver.box(id)).width),
    layout: await layout(driver, id),
    tier: await gridTier(driver, id),
    figures: { sizer: await driver.computed({ id, inner: ".sizer" }, "inline-size"), min: await driver.computed({ id, inner: ".grid" }, "min-inline-size") },
  };
}

/** US3-12's element with the 30rem detail block, rendered: 1073 px in three columns, its one-column minimum the 480 px block. */
const threeAt1073 = { width: 1073, layout: "three", tier: "three", figures: { sizer: "1073px", min: "480px" } };

export const listDetailScenarios: readonly ListDetailScenario[] = [
  ...(["light", "dark"] as const).map(
    (theme): ListDetailScenario => ({
      name: `US3-1 in ${theme}: in Frame R a list-detail with list, detail and inspector shows three columns in inline order, the list 288 px, the detail the rest (604 px), the inspector 304 px with its border inside, and a 1 px color-rule border on the inline-start side of the detail and of the inspector, none on the list (FR-022, FR-023, SC-005)`,
      base: false,
      run: async (driver) => {
        await page(driver, "R", framed("r", "R"));
        await driver.theme(theme);
        return { panes: await panes(driver, "r"), width: (await driver.box("r")).width, list: await borders(driver, "r", "list"), detail: await borders(driver, "r", "detail"), inspector: await borders(driver, "r", "inspector") };
      },
      expected: { panes: threeR, width: 1196, list: none, detail: { ...none, left: rule(theme) }, inspector: { ...none, left: rule(theme) } },
    }),
  ),
  {
    name: "US3-2: in Frame W the same element shows two columns, the list track and the detail, with the inspector stacked under the detail in the detail column at its full width; a 1 px color-rule border runs between the list and the detail column and between the detail and the inspector (FR-023, FR-026)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", framed("w", "W"));
      return { panes: await panes(driver, "w"), list: await borders(driver, "w", "list"), detail: await borders(driver, "w", "detail"), inspector: await borders(driver, "w", "inspector") };
    },
    expected: { panes: twoW, list: none, detail: { ...none, left: rule() }, inspector: { ...none, left: rule(), top: rule() } },
  },
  ...(["light", "dark"] as const).map(
    (palette): ListDetailScenario => ({
      // Plant: the border rule placed inside `@media not (forced-colors: active)` (no border at all in forced colours).
      name: `US3-1 and US3-2 in forced colours (${palette} palette): each border between adjacent panes is 1 px in CanvasText, side by side in Frame R and stacked between the detail and the inspector in Frame W (FR-023)`,
      base: false,
      run: async (driver) => {
        await page(driver, "W", `${framed("r", "R")}${framed("w", "W")}`);
        await driver.forcedColors("active", palette);
        return { r: { detail: await borders(driver, "r", "detail"), inspector: await borders(driver, "r", "inspector") }, w: { detail: await borders(driver, "w", "detail"), inspector: await borders(driver, "w", "inspector") } };
      },
      expected: (() => {
        const line = `1px ${systemColours[palette].CanvasText ?? ""}`;
        return { r: { detail: { ...none, left: line }, inspector: { ...none, left: line } }, w: { detail: { ...none, left: line }, inspector: { ...none, left: line, top: line } } };
      })(),
    }),
  ),
  {
    name: "US3-3: in Frame N only the list shows, at the frame's full width, and the detail and the inspector have no box and no node; with detail-open only the detail shows with the inspector stacked under it, and the list has no box and no node (FR-027, SC-005)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", framed("n", "N"));
      const closed = { panes: await panes(driver, "n"), texts: await texts(driver, "n") };
      await driver.setAttribute("n", "detail-open", "");
      return { closed, open: { panes: await panes(driver, "n"), texts: await texts(driver, "n"), detail: await borders(driver, "n", "detail"), inspector: await borders(driver, "n", "inspector") } };
    },
    expected: {
      closed: { panes: oneList(636), texts: listTexts },
      open: { panes: oneDetail(636), texts: [...detailTexts, ...inspectorTexts], detail: none, inspector: { ...none, top: rule() } },
    },
  },
  {
    // Plant: `detail-open` applied in every tier (in Frame W the list is then hidden and the detail takes the frame).
    name: "US3-4: in Frame W with detail-open the element shows the two columns of US3-2: in two or three columns detail-open hides nothing; a twin in Frame N with detail-open shows the detail and hides the list (FR-027)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `${framed("w", "W", " detail-open")}${framed("r", "R", " detail-open")}${framed("n", "N", " detail-open")}`);
      return { w: await panes(driver, "w"), r: await panes(driver, "r"), n: await panes(driver, "n") };
    },
    expected: { w: twoW, r: threeR, n: oneDetail(636) },
  },
  {
    name: "US3-5: in Frame W with narrow the element shows the one-column list of US3-3 at 876 px; removing narrow restores two columns; narrow and detail-open set as properties are reflected (FR-027, SC-005)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", framed("w", "W", " narrow"));
      const narrow = await panes(driver, "w");
      await driver.setAttribute("w", "narrow", null);
      const restored = await panes(driver, "w");
      await driver.setProperty("w", "narrow", true as unknown as string);
      await driver.setProperty("w", "detailOpen", true as unknown as string);
      const reflected = { narrow: await driver.attribute("w", "narrow"), detailOpen: await driver.attribute("w", "detail-open"), panes: await panes(driver, "w") };
      await driver.setProperty("w", "narrow", false as unknown as string);
      return { narrow, restored, reflected, cleared: await driver.attribute("w", "narrow") };
    },
    expected: { narrow: oneList(876), restored: twoW, reflected: { narrow: "", detailOpen: "", panes: oneDetail(876) }, cleared: null },
  },
  {
    // Plant: the pane wrappers focusable at all times (`tabindex="-1"` at rest: the wrappers then carry a tabindex and a
    // click on the list's text focuses the list wrapper).
    name: "US3-6 at rest: in Frame N no pane wrapper has a tabindex, the tree under the element is the slotted content in pane order, and a real click on text in the list pane does not focus a wrapper (FR-028, FR-029)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${framed("n", "N")}${after}`);
      const rest = { tabindex: await wrapperTabindex(driver, "n"), texts: await texts(driver, "n"), roles: await roles(driver, "n") };
      await driver.click("n-lt", { x: 4, y: 4 });
      return { rest, clicked: await driver.activeElement(), after: await wrapperTabindex(driver, "n") };
    },
    expected: { rest: { tabindex: [null, null, null], texts: listTexts, roles: [] }, clicked: "body", after: [null, null, null] },
  },
  ...(["light", "dark"] as const).map(
    (theme): ListDetailScenario => ({
      // Plant: the default outset ring (`outline-offset` of the base layer, outside the wrapper: the clipping frame then
      // cuts it, so the ring's pixels at the frame's inline edges are the ground).
      name: `US3-6 by keyboard in ${theme}: in one column inside an overflow: hidden frame, with keyboard focus on a list item, the host sets detail-open from a task and focus moves to the detail pane, which takes it by script with tabindex -1 and shows the token ring inset, whole inside the frame; the next Tab reaches the detail's first focusable element and the detail wrapper loses its tabindex; removing detail-open with focus in the detail moves focus to the list pane the same way (FR-028, SC-005)`,
      base: false,
      run: async (driver) => {
        await page(driver, "N", `${before}${framed("n", "N", "", undefined, ' class="clip"')}${after}`);
        await driver.theme(theme);
        await driver.tabWalk("before", "n-l0");
        await driver.setAttribute("n", "detail-open", "");
        const frame = await driver.box("n-frame");
        const detail = await driver.box("n", ".pane.detail");
        const image = await driver.pixels("n-frame");
        const y = Math.round(detail.y - frame.y + detail.height / 2);
        const colour = focusColour(theme);
        const moved = {
          active: await driver.activeElement(),
          tabindex: await wrapperTabindex(driver, "n"),
          ring: await ring(driver, "n", "detail"),
          inside: detail.x >= frame.x - 0.5 && detail.x + detail.width <= frame.x + frame.width + 0.5,
          pixels: [near(at(image, 1, y), colour), near(at(image, image.width - 2, y), colour), near(at(image, Math.round(frame.width / 2), Math.round(detail.y - frame.y + 1)), colour)],
        };
        await driver.press("Tab");
        const tabbed = { active: await driver.activeElement(), tabindex: await wrapperTabindex(driver, "n") };
        await driver.setAttribute("n", "detail-open", null);
        return { moved, tabbed, back: { active: await driver.activeElement(), tabindex: await wrapperTabindex(driver, "n"), ring: (await ring(driver, "n", "list"))["outline-style"] } };
      },
      expected: {
        moved: {
          active: "n >> div.pane.detail",
          tabindex: [null, "-1", null],
          ring: { "outline-style": "solid", "outline-width": "3px", "outline-offset": "-3px", "outline-color": tokenColour("color-focus", theme) },
          inside: true,
          pixels: [true, true, true],
        },
        tabbed: { active: "n-d0", tabindex: [null, null, null] },
        back: { active: "n >> div.pane.list", tabindex: ["-1", null, null], ring: "solid" },
      },
    }),
  ),
  {
    name: "US3-6 by pointer: after a click on a list item, the host sets detail-open and focus moves to the detail pane with no ring; the next Tab still reaches the detail's first focusable element (FR-028)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${framed("n", "N")}${after}`);
      await driver.click("n-l0", { x: 4, y: 4 });
      const clicked = await driver.activeElement();
      await driver.setAttribute("n", "detail-open", "");
      const moved = { active: await driver.activeElement(), ring: (await ring(driver, "n", "detail"))["outline-style"] };
      await driver.press("Tab");
      return { clicked, moved, tabbed: await driver.activeElement() };
    },
    expected: { clicked: "n-l0", moved: { active: "n >> div.pane.detail", ring: "none" }, tabbed: "n-d0" },
  },
  {
    // Plant: focus moved on every switch (focus outside the element, and focus in the pane that stays, are then moved).
    name: "US3-6, focus not moved: with focus outside the element, setting and removing detail-open moves no focus; in two columns (collapse-below 0) with focus in the list, detail-open changes and focus stays; a twin in one column with focus in its list moves it to the detail (FR-028)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${framed("n", "N")}${framed("s", "N", ' collapse-below="0"')}${after}`);
      await driver.tabWalk("n-l1", "before", true);
      await driver.setAttribute("n", "detail-open", "");
      const outsideSet = await driver.activeElement();
      await driver.setAttribute("n", "detail-open", null);
      const outsideRemoved = await driver.activeElement();
      await driver.tabWalk("before", "s-l0");
      await driver.setAttribute("s", "detail-open", "");
      const stays = { active: await driver.activeElement(), layout: await layout(driver, "s"), tabindex: await wrapperTabindex(driver, "s") };
      await driver.tabWalk("before", "n-l0");
      await driver.setAttribute("n", "detail-open", "");
      return { outsideSet, outsideRemoved, stays, moved: await driver.activeElement() };
    },
    expected: { outsideSet: "before", outsideRemoved: "before", stays: { active: "s-l0", layout: "two", tabindex: [null, null, null] }, moved: "n >> div.pane.detail" },
  },
  ...(["light", "dark"] as const).map(
    (palette): ListDetailScenario => ({
      name: `US3-6 in forced colours (${palette} palette): the detail pane's ring after a keyboard switch is drawn in Highlight, inset (FR-028)`,
      base: false,
      run: async (driver) => {
        await page(driver, "N", `${before}${framed("n", "N", "", undefined, ' class="clip"')}`);
        await driver.forcedColors("active", palette);
        await driver.tabWalk("before", "n-l0");
        await driver.setAttribute("n", "detail-open", "");
        const { "outline-color": colour, ...shape } = await ring(driver, "n", "detail");
        return { active: await driver.activeElement(), ring: shape, highlight: colour === (await driver.resolveColour("Highlight")) };
      },
      expected: { active: "n >> div.pane.detail", ring: { "outline-style": "solid", "outline-width": "3px", "outline-offset": "-3px" }, highlight: true },
    }),
  ),
  {
    name: "US3-7: in two columns with focus in the detail, setting narrow hides the detail and moves focus to the list pane; narrowing the frame below the threshold with focus in the detail does the same; focus never stays on a node with no box (FR-028, SC-005)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `${before}${framed("w", "W")}${framed("f", "W")}${after}`);
      await driver.tabWalk("before", "w-d0");
      await driver.setAttribute("w", "narrow", "");
      const narrowed = { active: await driver.activeElement(), layout: await layout(driver, "w"), tabindex: await wrapperTabindex(driver, "w") };
      await driver.tabWalk("before", "f-d0");
      await driver.style("f-frame", "inline-size", "600px");
      return { narrowed, resized: { active: await driver.activeElement(), layout: await layout(driver, "f"), tabindex: await wrapperTabindex(driver, "f") } };
    },
    expected: {
      narrowed: { active: "w >> div.pane.list", layout: "one: list", tabindex: ["-1", null, null] },
      resized: { active: "f >> div.pane.list", layout: "one: list", tabindex: ["-1", null, null] },
    },
  },
  {
    // Plants: the inspector always rendered (the empty pane then takes a 304 px track and the detail is 604 px); the
    // `inspector` slot rendered only when an inspector is present (an inspector slotted after the first render then
    // never shows).
    name: "US3-8: in Frame R with nothing in the inspector slot there are two columns, list and detail (908 px), and no inspector track, border or space; slotting an inspector after the first render adds the third column and its border, and removing it takes them away (FR-024)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", framed("x", "R", "", `${listPane("x")}${detailPane("x")}<div slot="spare" id="x-insp"><p>Inspector of WP-01</p></div>`));
      const empty = { panes: await panes(driver, "x"), texts: await texts(driver, "x") };
      await driver.setAttribute("x-insp", "slot", "inspector");
      const added = { panes: await panes(driver, "x"), inspector: await borders(driver, "x", "inspector") };
      await driver.setAttribute("x-insp", "slot", "spare");
      return { empty, added, removed: await panes(driver, "x") };
    },
    expected: {
      empty: { panes: { list: pane(0, 288), detail: pane(288, 908), inspector: null, stacked: false }, texts: [...listTexts, ...detailTexts] },
      added: { panes: threeR, inspector: { ...none, left: rule() } },
      removed: { list: pane(0, 288), detail: pane(288, 908), inspector: null, stacked: false },
    },
  },
  {
    // Plant: the page scrolls (the grid's minimum set to the three-column figure, so the element is wider than Frame S).
    name: "US3-9: in Frame S one pane at a time shows at the frame's full width (288 px), with and without detail-open, and the page has no horizontal scroll (SC-006)",
    base: false,
    run: async (driver) => {
      await page(driver, "S", framed("s", "S"));
      const closed = { panes: await panes(driver, "s"), scrolls: await pageScrolls(driver) };
      await driver.setAttribute("s", "detail-open", "");
      return { closed, open: { panes: await panes(driver, "s"), scrolls: await pageScrolls(driver) } };
    },
    expected: { closed: { panes: oneList(288), scrolls: false }, open: { panes: oneDetail(288), scrolls: false } },
  },
  (() => {
    // Plant: any length the browser can resolve accepted (each rejected value then moves the threshold and gives one
    // column, or three for inspector-below).
    const collapse: readonly (readonly [string, string, string])[] = [
      // accepted forms, one column in Frame W
      ["a1", ' collapse-below="56rem"', "one: list"],
      ["a2", ' collapse-below="56REM"', "one: list"],
      ["a3", ' collapse-below="55.5rem"', "one: list"],
      ["a4", ' collapse-below="880px"', "one: list"],
      ["a5", ' collapse-below="55em"', "one: list"],
      ["a6", ' collapse-below=" 56rem "', "one: list"],
      ["a7", ' collapse-below="45em"', "one: list"],
      // rejected values that would give one column if accepted: two columns, as without the attribute
      ["r1", ' collapse-below="120%"', "two"],
      ["r2", ' collapse-below="80vw"', "two"],
      ["r3", ' collapse-below="110cqi"', "two"],
      ["r4", ' collapse-below="700pt"', "two"],
      ["r5", ' collapse-below="900"', "two"],
      ["r6", ' collapse-below="calc(56rem)"', "two"],
      ["r7", ' collapse-below="var(--x)"', "two"],
      ["r8", ' collapse-below="+56rem"', "two"],
      ["r9", ' collapse-below="5.6e1rem"', "two"],
      // parsing cases that count as absent
      ["p1", ' collapse-below="-1rem"', "two"],
      ["p2", ' collapse-below="-0"', "two"],
      ["p3", ' collapse-below=".5rem"', "two"],
      ["p4", ' collapse-below="56.rem"', "two"],
      ["p5", ' collapse-below="wide"', "two"],
      ["p6", ' collapse-below=" "', "two"],
      ["p7", ' collapse-below=""', "two"],
      ["p8", "", "two"],
      // the exclusive bound: exactly as wide as the threshold gives the wider layout
      ["x1", ' collapse-below="876px"', "two"],
      // the token default, on the element and on an ancestor, and a token value that does not parse
      ["t1", "", "one: list"],
      ["t2", "", "one: list"],
      ["t3", "", "two"],
      // inspector-below
      ["i1", ' inspector-below="50rem"', "three"],
      ["i2", ' inspector-below="0"', "three"],
      ["i3", ' inspector-below="50%"', "two"],
      ["i4", ' inspector-below="40vw"', "two"],
      ["i5", ' inspector-below="50cqi"', "two"],
      ["i6", ' inspector-below="50pt"', "two"],
      ["i7", ' inspector-below="50"', "two"],
      ["i8", ' inspector-below="calc(50rem)"', "two"],
      ["i9", ' inspector-below="var(--y)"', "two"],
      ["it1", "", "three"],
      ["it2", "", "two"],
    ];
    const narrowCases: readonly (readonly [string, string, string])[] = [
      ["n1", ' collapse-below="0"', "two"],
      ["n2", ' collapse-below="39rem"', "two"],
      ["n3", "", "one: list"],
    ];
    const container = (id: string): string => (["r3", "i5"].includes(id) ? ' class="cq"' : "");
    const extra = [
      "#a7 { font-size: 20px; }",
      "#r7 { --x: 56rem; }",
      "#i9 { --y: 50rem; }",
      "#t1 { --ocelle-list-detail-collapse: 56rem; }",
      "#t2-frame { --ocelle-list-detail-collapse: 56rem; }",
      "#t3 { --ocelle-list-detail-collapse: 120%; }",
      "#it1 { --ocelle-list-detail-inspector-collapse: 50rem; }",
      "#it2 { --ocelle-list-detail-inspector-collapse: 50%; }",
    ].join("\n");
    return {
      name: "US3-10: in Frame W the accepted collapse-below forms (56rem, 56REM, 55.5rem, 880px, 55em, \" 56rem \", and 45em at the element's 20 px) give one column; each rejected value that would give one column if accepted (120%, 80vw at the 1280 px viewport, 110cqi of a container frame, 700pt, 900, calc(56rem), var(--x), +56rem, 5.6e1rem), each parsing case (-1rem, -0, .5rem, 56.rem, wide, blank, empty) and the exact threshold (876px) give two; the token on the element or an ancestor moves the default and a token of 120% does not; inspector-below 50rem and 0 give three columns and its rejected values keep the inspector stacked, as do the token at 50% and not at 50rem; in Frame N, 0 and 39rem give two columns and the default one (FR-025, FR-034)",
      base: false,
      run: async (driver: Driver): Promise<unknown> => {
        await page(driver, "W", `<span id="vw" class="vw80"></span>${collapse.map(([id, attributes]) => framed(id, "W", attributes, undefined, container(id))).join("")}`, { extra });
        const wide: Record<string, string> = {};
        for (const [id] of collapse) wide[id] = await layout(driver, id);
        const viewport = { vw80: (await driver.box("vw")).width, frame: (await driver.box("a1")).width };
        await page(driver, "N", narrowCases.map(([id, attributes]) => framed(id, "N", attributes)).join(""));
        const narrow: Record<string, string> = {};
        for (const [id] of narrowCases) narrow[id] = await layout(driver, id);
        return { viewport, wide, narrow };
      },
      expected: {
        viewport: { vw80: 1024, frame: 876 },
        wide: Object.fromEntries(collapse.map(([id, , shown]) => [id, shown])),
        narrow: Object.fromEntries(narrowCases.map(([id, , shown]) => [id, shown])),
      },
    } satisfies ListDetailScenario;
  })(),
  {
    name: "US3-11 (with base.css): in Frame W a detail holding an unbroken 120-character identifier and a twelve-column table keeps two columns, the list track keeps 288 px and the detail does not widen past 588 px; the identifier wraps inside the detail, the table scrolls inside it, and the page has no horizontal scroll (FR-023)",
    base: true,
    run: async (driver) => {
      const identifier = `wp${"0123456789".repeat(12)}`;
      const cells = Array.from({ length: 12 }, (_, index) => `<td>Column ${String(index + 1)} value</td>`).join("");
      const detail = `<div id="l-detail" data-ocelle-prose=""><p><code id="l-code">${identifier}</code></p><table id="l-table"><tbody><tr>${cells}</tr></tbody></table></div>`;
      await page(driver, "W", framed("l", "W", "", `${listPane("l")}${detail}${inspectorPane("l")}`), { base: true });
      const detailBox = await driver.box("l", ".pane.detail");
      const code = await driver.lines("l-code");
      const table = await driver.box("l-table");
      const right = detailBox.x + detailBox.width + 0.5;
      return {
        panes: await panes(driver, "l"),
        wraps: code.length > 1 && code.every((line) => line.x + line.width <= right),
        tableInside: table.x + table.width <= right,
        tableScrolls: Number(await readOnce(driver, "l-table", "scrollWidth")) > Number(await readOnce(driver, "l-table", "clientWidth")),
        scrolls: await pageScrolls(driver),
      };
    },
    expected: { panes: twoW, wraps: true, tableInside: true, tableScrolls: true, scrolls: false },
  },
  {
    // Plants: an intrinsic size that follows the tier shown (no sizer: the row's element then takes its shown panes'
    // size); the measurement pass split across a `requestAnimationFrame` (the frame record then shows `max` or `min`).
    name: "US3-12, 1196 px row: as a default flex item in a 1196 px row, the element is 1073 px wide (18rem + 30rem + 19rem plus the detail's 1 px border) and shows three columns, the same on each of ten frames, with no error (FR-025)",
    base: false,
    run: (driver) => shrinkToFit(driver, `<div class="row">${listDetail("s", "", sized("s"))}</div>`),
    expected: { width: 1073, layout: "three", tiers: ["three"], frames: true, messages: [] },
  },
  {
    // Plant: an intrinsic size that follows the tier shown (the sizer's figure also the min-content size: the element
    // then does not shrink below 1073 px).
    name: "US3-12, 636 px row: in a 636 px row the element shrinks to 636 px and shows one column, the same on each of ten frames, with no error (FR-025)",
    base: false,
    run: (driver) => shrinkToFit(driver, `<div class="row-n">${listDetail("s", "", sized("s"))}</div>`),
    expected: { width: 636, layout: "one: list", tiers: ["one"], frames: true, messages: [] },
  },
  {
    name: "US3-12, dialog: in an open <dialog> as wide as --ocelle-dialog-max-inline allows in a 1280 px viewport, the element is 1073 px wide and shows three columns, the same on each of ten frames (FR-025)",
    base: false,
    run: (driver) => shrinkToFit(driver, `<dialog open class="dialog">${listDetail("s", "", sized("s"))}</dialog>`),
    expected: { width: 1073, layout: "three", tiers: ["three"], frames: true, messages: [] },
  },
  {
    name: "US3-12, table cell: in a cell of a 636 px table the element shows one column, the same on each of ten frames (FR-025)",
    base: false,
    run: async (driver) => {
      const observed = (await shrinkToFit(driver, `<table class="table-n"><tbody><tr><td>${listDetail("s", "", sized("s"))}</td></tr></tbody></table>`)) as { width: number };
      return { ...observed, width: observed.width <= 636 };
    },
    expected: { width: true, layout: "one: list", tiers: ["one"], frames: true, messages: [] },
  },
  {
    name: "US3-12, stale content: in the 1196 px row with narrow, the host replaces the detail's inner content by a 40rem block; once narrow is removed the element is 1196 px wide (1233 px shrunk to the row) and shows three columns, and no frame shows the measurement grid (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div class="row">${listDetail("s", " narrow", sized("s"))}</div>`);
      const before = { width: Math.round((await driver.box("s")).width), layout: await layout(driver, "s") };
      await driver.setProperty("s-detail", "innerHTML", '<div class="w40"></div>');
      const record = await driver.frameRecord("s", tierReading("s"));
      await driver.setAttribute("s", "narrow", null);
      const recorded = await record.stop();
      return { before, after: { width: Math.round((await driver.box("s")).width), layout: await layout(driver, "s") }, tiers: tierSet(recorded), messages: await driver.messages() };
    },
    expected: { before: { width: 1073, layout: "one: list" }, after: { width: 1196, layout: "three" }, tiers: ["one", "three"], messages: [] },
  },
  ...(
    [
      ["twice as tall", "w35-tall"],
      ["of the same height", "w35"],
    ] as const
  ).map(
    ([kind, block]): ListDetailScenario => ({
      // Plants: the shown-pane `ResizeObserver` as the trigger (the same-height case then stays at 1073 px, and the taller
      // case reports the window's "ResizeObserver loop" error); the measurement pass split across a
      // `requestAnimationFrame` (the tier record shows `max` or `min`).
      name: `US3-12, content change: in the 1196 px row, the host replaces the detail's inner content inside the same slotted element by a 35rem block ${kind}; the first frame record after the change shows the element 1153 px wide (18rem + 35rem + 19rem plus 1 px), in three columns, no frame shows the measurement grid, and the page reports no error (FR-025)`,
      base: false,
      run: async (driver) => {
        await page(driver, "R", `<div class="row">${listDetail("s", "", sized("s"))}</div>`);
        const widthRecord = await driver.frameRecord("s", { property: "offsetWidth" });
        const tierRecord = await driver.frameRecord("s", tierReading("s"));
        await driver.setProperty("s-detail", "innerHTML", `<div class="${block}"></div>`);
        const widths = await widthRecord.stop();
        const tiers = await tierRecord.stop();
        return { resizes: distinct(resizes(widths)), widths: distinct(frameReadings(widths)), tiers: tierSet(tiers), layout: await layout(driver, "s"), messages: await driver.messages() };
      },
      expected: { resizes: ["resize: 1073", "resize: 1153"], widths: ["1073", "1153"], tiers: ["three"], layout: "three", messages: [] },
    }),
  ),
  ...(
    [
      ["a property of the detail's slotted element that renders a 40rem block in its shadow root", '<test-shadow-block id="s-detail"></test-shadow-block>', "property"],
      ["a class swapped on the detail's light-DOM block that a page rule makes 40rem wide", '<div id="s-detail"><div class="w30"></div></div>', "class"],
    ] as const
  ).map(
    ([change, detail, how]): ListDetailScenario => ({
      // Plants: `remeasure()` as a no-op (both cases stay at 1073 px after the call); `attributes` observed (the class
      // case reaches 1196 px before the call).
      name: `US3-12, unseen change: in the 1196 px row with narrow (one column, the list shown, 1073 px), ${change} is not seen, so the element stays 1073 px wide on each of ten frames; after the host calls remeasure() the first frame record shows it 1196 px wide (1233 px shrunk to the row), still in one column, with no error (FR-025)`,
      base: false,
      run: async (driver) => {
        await page(driver, "R", `<div class="row">${listDetail("s", " narrow", sized("s", detail))}</div>`);
        if (how === "property") await driver.setProperty("s-detail", "wide", "40");
        else await driver.setAttribute("s-detail", "class", "wide");
        const unseen = await driver.frameRecord("s", { property: "offsetWidth" });
        await frames(driver, 10);
        const ten = await unseen.stop();
        const seen = await driver.frameRecord("s", { property: "offsetWidth" });
        await driver.call("s", "remeasure");
        const after = await seen.stop();
        return { ten: { widths: distinct(ten), frames: frameReadings(ten).length >= 10 }, resizes: resizes(after), layout: await layout(driver, "s"), messages: await driver.messages() };
      },
      expected: { ten: { widths: ["1073", "resize: 1073"], frames: true }, resizes: ["resize: 1073", "resize: 1196"], layout: "one: list", messages: [] },
    }),
  ),
  {
    // Plant: the pass run in the `MutationObserver` callback (the window then reports the "ResizeObserver loop" error).
    name: "US3-12, a mutation inside a ResizeObserver callback: in the 1196 px row with narrow and the list shown, the detail's slotted element appends a 35rem block from its own ResizeObserver once it is observed with a non-zero inline size; when the host sets detail-open, after settle the element is 1153 px wide and shows the detail in one column, and the page reports no error (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div class="row">${listDetail("s", " narrow", sized("s", '<test-appender id="s-detail"><div class="w30"></div></test-appender>'))}</div>`);
      await driver.setAttribute("s", "detail-open", "");
      await frames(driver, 4);
      return { width: Math.round((await driver.box("s")).width), layout: await layout(driver, "s"), appended: (await driver.box("s-detail")).height, messages: await driver.messages() };
    },
    expected: { width: 1153, layout: "one: detail", appended: 64, messages: [] },
  },
  // Added at the landing pass (operator round phase 4 round 5, O5-01; landing review L1-01; T078), red before the fix:
  // a list-detail first rendered while not rendered (no box), then rendered, has the figures and the tier of its twin
  // rendered from the start on the same page; a pass or remeasure() while it is not rendered writes nothing. Plant
  // (the first four): no pass scheduled when the element becomes rendered (they stay at 0 px in one column, or keep
  // the sizer's default size, unmeasured).
  ...(
    [
      [
        "upgraded inside a closed <dialog>, opened with showModal()",
        `<dialog open class="dialog">${listDetail("t", "", sized("t"))}</dialog><dialog id="s-w" class="dialog">${listDetail("s", "", sized("s"))}</dialog>`,
        { call: "showModal" },
      ],
      [
        "upgraded inside a display: none inline-block wrapper, which is then shown",
        `<div><div class="ib">${listDetail("t", "", sized("t"))}</div></div><div><div id="s-w" class="ib gone">${listDetail("s", "", sized("s"))}</div></div>`,
        { attribute: "class", value: "ib" },
      ],
      [
        "upgraded inside a hidden flex item of the 1196 px row, which is then shown",
        `<div class="row"><div>${listDetail("t", "", sized("t"))}</div></div><div class="row"><div id="s-w" hidden>${listDetail("s", "", sized("s"))}</div></div>`,
        { attribute: "hidden", value: null },
      ],
      [
        "upgraded with the hidden attribute as a flex item of the 1196 px row, which is then removed",
        `<div class="row">${listDetail("t", "", sized("t"))}</div><div class="row">${listDetail("s", " hidden", sized("s"))}</div>`,
        { attribute: "hidden", value: null, on: "s" },
      ],
    ] as const
  ).map(
    ([how, markup, show]): ListDetailScenario => ({
      name: `US3-12, not rendered at first (O5-01): ${how}, the element has the width, data-tier and per-instance figures of its twin rendered from the start on the same page, 1073 px (18rem + 30rem + 19rem plus 1 px) in three columns, the same on each of ten frames, with no error (FR-025)`,
      base: false,
      run: async (driver) => {
        await page(driver, "R", markup, { extra: notRenderedRules });
        if ("call" in show) await driver.call("s-w", show.call);
        else await driver.setAttribute("on" in show ? show.on : "s-w", show.attribute, show.value);
        await driver.settle();
        const record = await driver.frameRecord("s", tierReading("s"));
        await frames(driver, 10);
        const recorded = await record.stop();
        return { s: await measuredState(driver, "s"), t: await measuredState(driver, "t"), tiers: tierSet(recorded), frames: frameReadings(recorded).length >= 10, messages: await driver.messages() };
      },
      expected: { s: threeAt1073, t: threeAt1073, tiers: ["three"], frames: true, messages: [] },
    }),
  ),
  {
    // Plants: a pass that writes the figures it reads with no box (0 px while hidden); remeasure() that sets the
    // measured size from a non-rendered probe (`NaN`: the two-column element `y` then shows three columns while hidden);
    // no pass scheduled when the element becomes rendered (the new list content's 560 px minimum is never measured).
    name: "US3-12, hidden then remeasured (O5-01): shown at 1073 px in three columns in the 1196 px row (and a twin in Frame W in two columns), then its wrapper hidden; while hidden the list's content changes and the host calls remeasure(); ten frames later the figures and data-tier are those before hiding, none NaN or 0 px; shown again, after settle, it has the figures of its new content (the 35rem list block: 560 px minimum), 1073 px in three columns, with no error (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div id="x-w"><div class="row">${listDetail("x", "", sized("x"))}</div>${framed("y", "W")}</div>`, { extra: notRenderedRules });
      const figures = async (id: string): Promise<{ tier: string | undefined; sizer: string; min: string }> => ({
        tier: await gridTier(driver, id),
        sizer: await driver.computed({ id, inner: ".sizer" }, "inline-size"),
        min: await driver.computed({ id, inner: ".grid" }, "min-inline-size"),
      });
      const shown = { x: await measuredState(driver, "x"), y: await figures("y") };
      await driver.setAttribute("x-w", "class", "gone");
      await driver.setProperty("x-list", "innerHTML", '<div class="w35"></div>');
      await driver.setProperty("y-lt", "textContent", "Records of the week");
      await driver.call("x", "remeasure");
      await driver.call("y", "remeasure");
      await frames(driver, 10);
      const hidden = { x: await figures("x"), y: await figures("y") };
      await driver.setAttribute("x-w", "class", null);
      await driver.settle();
      return { shown: shown.x, hidden: { x: hidden.x, y: { tier: hidden.y.tier, figures: hidden.y.sizer === shown.y.sizer && hidden.y.min === shown.y.min } }, yTier: shown.y.tier, again: await measuredState(driver, "x"), messages: await driver.messages() };
    },
    expected: {
      shown: threeAt1073,
      hidden: { x: { tier: "three", sizer: "1073px", min: "480px" }, y: { tier: "two", figures: true } },
      yTier: "two",
      again: { ...threeAt1073, figures: { sizer: "1073px", min: "560px" } },
      messages: [],
    },
  },
  {
    // Added at phase 4 review round 6 (R6-01), red before the fix: becoming rendered is a re-measure trigger whether or
    // not a pass was skipped while the element had no box (FR-025; data-model.md § list-detail "Not rendered"; R-13).
    // A class swap is a change the element cannot see (its `MutationObserver` has no `attributes`), so while hidden
    // nothing leaves a pass pending. Plant: becoming rendered requests a pass only when one is pending (the minimum
    // stays 480 px).
    name: "US3-12, hidden, changed unseen, then shown (R6-01): shown at 1073 px in three columns in the 1196 px row, then its wrapper hidden; while hidden the list's light-DOM element gets the class of a 35rem block, an attribute-only change the element cannot see; shown again with no remeasure(), after settle it has the figures of its new content (560 px minimum), 1073 px in three columns, with no error (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div id="x-w"><div class="row">${listDetail("x", "", sized("x"))}</div></div>`, { extra: notRenderedRules });
      const shown = await measuredState(driver, "x");
      await driver.setAttribute("x-w", "class", "gone");
      await frames(driver, 4);
      await driver.setAttribute("x-list", "class", "w35");
      await frames(driver, 4);
      await driver.setAttribute("x-w", "class", null);
      await driver.settle();
      return { shown, again: await measuredState(driver, "x"), messages: await driver.messages() };
    },
    expected: { shown: threeAt1073, again: { ...threeAt1073, figures: { sizer: "1073px", min: "560px" } }, messages: [] },
  },
  {
    name: "US3-13: under dir=rtl in Frame R the three columns run from the right: the list at the right, the inspector at the left, with the 1 px borders on the inline-start side (the right) of the detail and of the inspector (FR-023)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", framed("t", "R", "", undefined, ' dir="rtl"'));
      return { panes: await panes(driver, "t"), detail: await borders(driver, "t", "detail"), inspector: await borders(driver, "t", "inspector") };
    },
    expected: { panes: { list: pane(908, 288), detail: pane(304, 604), inspector: pane(0, 304), stacked: false }, detail: { ...none, right: rule() }, inspector: { ...none, right: rule() } },
  },
  {
    name: "US3-14: the element adds no role, landmark or name of its own, and each pane's slotted content is in the tree in pane order (list, detail, inspector) whatever the light-DOM order, also with a host aria-label (FR-029)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `${framed("o", "R", "", `${inspectorPane("o")}${detailPane("o")}${listPane("o")}`)}${framed("h", "R", ' aria-label="Records"')}`);
      return { o: { roles: await roles(driver, "o"), texts: await texts(driver, "o") }, h: await roles(driver, "h") };
    },
    expected: { o: { roles: [], texts: [...listTexts, ...detailTexts, ...inspectorTexts] }, h: [] },
  },
  {
    // Plant: `:host([hidden])` removed.
    name: "US3-15: a hidden list-detail has no box and no node, beside a visible twin in three columns (FR-030)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `${framed("h", "R", " hidden")}${framed("v", "R")}`);
      const hidden = await driver.box("h");
      return { hidden: { display: hidden.display, width: hidden.width }, tree: await driver.ax("h"), visible: await layout(driver, "v") };
    },
    expected: { hidden: { display: "none", width: 0 }, tree: [], visible: "three" },
  },
  {
    name: "US3-16: every kind of list-detail of these scenarios, switched by attribute, property, slot, resize and remeasure(), with keyboard focus moved, reports no console message (the fixture also records no CSP violation and no request outside its list) (FR-031)",
    base: false,
    run: async (driver) => {
      await page(
        driver,
        "R",
        `${before}${framed("a", "R")}${framed("b", "W", ' dir="rtl"')}${framed("c", "N", ' collapse-below="30rem" inspector-below="50rem"')}<div class="row">${listDetail("s", " narrow", sized("s"))}</div>${framed("e", "R", "", `${listPane("e")}${detailPane("e")}<div slot="spare" id="e-x">Inspector</div>`)}`,
      );
      await driver.tabWalk("before", "a-l0");
      await driver.setAttribute("a", "narrow", "");
      await driver.setProperty("a", "detailOpen", true as unknown as string);
      await driver.setAttribute("b", "detail-open", "");
      await driver.style("c-frame", "inline-size", "400px");
      await driver.setProperty("s-detail", "innerHTML", '<div class="w35"></div>');
      await driver.call("s", "remeasure");
      await driver.setAttribute("e-x", "slot", "inspector");
      return { active: await driver.activeElement(), a: await layout(driver, "a"), c: await layout(driver, "c"), e: await layout(driver, "e"), messages: await driver.messages() };
    },
    expected: { active: "a >> div.pane.detail", a: "one: detail", c: "one: list", e: "three", messages: [] },
  },
  {
    name: "US3 20 px root: at a 20 px root font size the 40rem threshold is 800 px, so in a 720 px frame the element shows one column; at 16 px the same frame shows two columns with the 288 px list (Edge Cases, FR-025)",
    base: false,
    run: async (driver) => {
      const markup = `<div id="z-frame" class="f720">${listDetail("z")}</div>`;
      await page(driver, "W", markup, { extra: "html { font-size: 20px; }" });
      const twenty = await layout(driver, "z");
      await page(driver, "W", markup);
      return { twenty, sixteen: await layout(driver, "z"), list: (await panes(driver, "z")).list };
    },
    expected: { twenty: "one: list", sixteen: "two", list: pane(0, 288) },
  },
  {
    name: "US3 style and sheets: no element of the shadow root carries a style attribute after the first render, after a tier change and after a measurement, and over two instances each shadow root adopts its shared sheet and exactly one per-instance sheet (FR-030)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `${framed("a", "R")}<div class="row">${listDetail("s", "", sized("s"))}</div>`);
      const styled = async (): Promise<number> => (await Promise.all(["a", "s"].map((id) => driver.elements(id)))).flat().filter((part) => "style" in part.attributes).length;
      const first = await styled();
      await driver.setAttribute("a", "narrow", "");
      const tier = await styled();
      await driver.setProperty("s-detail", "innerHTML", '<div class="w35"></div>');
      return { first, tier, measured: await styled(), width: Math.round((await driver.box("s")).width), sheets: await driver.sheets("ocelle-list-detail") };
    },
    expected: { first: 0, tier: 0, measured: 0, width: 1153, sheets: { elements: 2, perRoot: [2], distinct: 3, styleElements: 0 } },
  },
  {
    name: "US3 empty list slot: in Frame R with nothing in the list slot the list pane still takes 288 px and the detail the rest; with nothing in the default slot the detail column still shows, empty, at 604 px (Edge Cases)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `${framed("e1", "R", "", `${detailPane("e1")}${inspectorPane("e1")}`)}${framed("e2", "R", "", `${listPane("e2")}${inspectorPane("e2")}`)}`);
      return { noList: await panes(driver, "e1"), noDetail: await panes(driver, "e2") };
    },
    expected: { noList: threeR, noDetail: threeR },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// Guards added after the green implementation, on paths no red scenario reached (the mutants of the element's inline
// padding and borders, its first inspector state and the measured min-content figure that survived the first mutation
// run; reviews/phase-4/plants.md § Guards). The surviving mutants are their proof that they can fail.

export const listDetailGuards: readonly ListDetailScenario[] = [
  {
    name: "US3 guard: the tier follows the element's border-box inline size: with 20 px inline padding and 2 px inline borders on the host in Frame W (876 px border box, 832 px content box), collapse-below 876px gives two columns and 877px one (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `${framed("e", "W", ' collapse-below="876px"')}${framed("f", "W", ' collapse-below="877px"')}`, {
        extra: "#e, #f { padding-inline: 20px; border-inline: 2px solid; }",
      });
      return { e: await layout(driver, "e"), f: await layout(driver, "f"), width: (await driver.box("e")).width };
    },
    expected: { e: "two", f: "one: list", width: 876 },
  },
  {
    name: "US3 guard: an empty list-detail in Frame R, with nothing slotted, draws the list track (288 px) and the detail (908 px) and no inspector track (FR-024)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", framed("e", "R", "", ""));
      return panes(driver, "e");
    },
    expected: { list: pane(0, 288), detail: pane(288, 908), inspector: null, stacked: false },
  },
  {
    name: "US3 guard: in a 200 px row the element is as wide as its one-column min-content, the 30rem detail block (480 px), and shows one column (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div class="row-s">${listDetail("s", "", sized("s"))}</div>`);
      return { width: Math.round((await driver.box("s")).width), layout: await layout(driver, "s") };
    },
    expected: { width: 480, layout: "one: list" },
  },
  {
    name: "US3 guard: the tier follows the element's layout size, not its transformed box: in Frame R scaled by half, it shows three columns, also after the host sets detail-open (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", framed("t", "R", "", undefined, ' class="half"'));
      const first = await layout(driver, "t");
      await driver.setAttribute("t", "detail-open", "");
      return { first, open: await layout(driver, "t"), box: Math.round((await driver.box("t")).width) };
    },
    expected: { first: "three", open: "three", box: 598 },
  },
  {
    name: "US3 guard: a host-set tier change measures first: in the 1196 px row with narrow, after an unseen class swap makes the detail block 40rem, removing narrow shows three columns at 1196 px, the 40rem block measured before the new tier is applied (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div class="row">${listDetail("s", " narrow", sized("s", '<div id="s-detail"><div class="w30"></div></div>'))}</div>`);
      await driver.setAttribute("s-detail", "class", "wide");
      const unseen = Math.round((await driver.box("s")).width);
      await driver.setAttribute("s", "narrow", null);
      return { unseen, width: Math.round((await driver.box("s")).width), layout: await layout(driver, "s") };
    },
    expected: { unseen: 1073, width: 1196, layout: "three" },
  },
  {
    name: "US3 guard: with focus on a pane itself, which took it at a switch, the next switch moves it on: removing detail-open moves focus from the detail pane to the list pane, and setting it again from the list pane to the detail pane (FR-028)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${framed("n", "N")}`);
      await driver.tabWalk("before", "n-l0");
      await driver.setAttribute("n", "detail-open", "");
      const moved = await driver.activeElement();
      await driver.setAttribute("n", "detail-open", null);
      const back = { active: await driver.activeElement(), tabindex: await wrapperTabindex(driver, "n") };
      await driver.setAttribute("n", "detail-open", "");
      return { moved, back, again: { active: await driver.activeElement(), tabindex: await wrapperTabindex(driver, "n") } };
    },
    expected: { moved: "n >> div.pane.detail", back: { active: "n >> div.pane.list", tabindex: ["-1", null, null] }, again: { active: "n >> div.pane.detail", tabindex: [null, "-1", null] } },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// Added in phase 4's review round 1 (reviews/phase-4/round-1.md), red before the fix: R1-02, a list-detail inside
// another component's shadow root, where `document.activeElement` is that component's host; R1-03 (operator decision
// P3), a change of the host's inline padding or borders alone, which keeps the content box. Added in round 2
// (reviews/phase-4/round-2.md, operator decision P4), red before the fix: R2-02, the host's inline padding and borders
// as a floor of its intrinsic sizes; R2-01, a percentage inline padding that changes with the host's container, a
// recorded limitation whose remedy is `remeasure()`. Each plant is named beside its scenario and recorded in
// reviews/phase-4/plants.md.

export const listDetailFixes: readonly ListDetailScenario[] = [
  {
    // Plant (L21): the focused pane read from `document.activeElement` (focus then stays in the hidden list pane).
    name: "US3 review R1-02: a list-detail inside another component's open shadow root (test-shadow-frame) in Frame N, with focus on a list button, moves focus to the detail pane when detail-open is set, and back to the list pane when it is removed, so focus never stays in a hidden pane (FR-028, SC-005)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}<div id="z-frame" data-frame="N"><test-shadow-frame id="sh">${listDetail("z")}</test-shadow-frame></div>`);
      await driver.focus({ id: "sh", inner: "#z-l0" });
      const start = await driver.activeElement();
      await driver.setProperty("sh", "open", "open");
      const opened = await driver.activeElement();
      await driver.setProperty("sh", "open", "");
      return { start, opened, closed: await driver.activeElement() };
    },
    expected: { start: "sh >> z-l0", opened: "sh >> z >> div.pane.detail", closed: "sh >> z >> div.pane.list" },
  },
  {
    // Plants: the edge box not observed (L19: the tier stays one column with the padding and the borders); the host's
    // own border box observed in place of the edge box (L18: this case passes, and the "ResizeObserver loop" case of
    // US3-12 fails with the loop message, as do US3-16 and the percentage case of R2-01, which is then seen); the edge
    // box observed in its content box (L23: one column throughout).
    name: "US3 review R1-03: the tier follows a change of the host's inline padding or borders alone: in Frame W a host 630 px wide in its content box, with collapse-below 640px, shows one column; 10 px inline padding (a 650 px border box) gives two columns and removing it one again; 5 px inline borders (640 px, the exclusive bound) give two and removing them one again (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", framed("p", "W", ' collapse-below="640px"'), { extra: "#p { inline-size: 630px; border-inline: 0 solid; }" });
      const state = async (): Promise<{ layout: string; width: number }> => ({ layout: await layout(driver, "p"), width: Math.round((await driver.box("p")).width) });
      const first = await state();
      await driver.style("p", "padding-inline", "10px");
      const padded = await state();
      await driver.style("p", "padding-inline", "0px");
      const unpadded = await state();
      await driver.style("p", "border-inline-width", "5px");
      const bordered = await state();
      await driver.style("p", "border-inline-width", "0px");
      return { first, padded, unpadded, bordered, unbordered: await state() };
    },
    expected: {
      first: { layout: "one: list", width: 630 },
      padded: { layout: "two", width: 650 },
      unpadded: { layout: "one: list", width: 630 },
      bordered: { layout: "two", width: 640 },
      unbordered: { layout: "one: list", width: 630 },
    },
  },
  {
    // Plant (L20): the edge box in flow (its `position: absolute` removed): its padding and borders are then a floor of
    // the host's content size, so each element is 300 or 400 px wider.
    name: "US3 review R2-02: the host's inline padding and borders are no floor of its intrinsic sizes: in a min-content wrapper a list-detail with 150 px inline padding is 300 px wide when empty, and 300 px plus one letter with a letter in each pane; in a max-content wrapper an empty one with 200 px inline padding and 1 px inline borders is its two-column max-content (the 288 px list and the detail's 1 px border) plus 402 px (FR-025)",
    base: false,
    run: async (driver) => {
      const letters = '<div slot="list">x</div><div>x</div><div slot="inspector">x</div>';
      await page(driver, "R", `<div class="mn">${listDetail("a", "", "")}</div><div class="mn">${listDetail("b", "", letters)}</div><div class="mx">${listDetail("c", "", "")}</div><span id="m">x</span>`, {
        extra: ".mn { inline-size: min-content; } .mx { inline-size: max-content; } #a, #b { padding-inline: 150px; } #c { padding-inline: 200px; border-inline: 1px solid; }",
      });
      const width = async (id: string): Promise<number> => (await driver.box(id)).width;
      const letter = await width("m");
      return { empty: round(await width("a")), letters: round((await width("b")) - letter), letter: letter > 0, max: round(await width("c")) };
    },
    expected: { empty: 300, letters: 300, letter: true, max: 691 },
  },
  {
    // Plant (L22): the pass `remeasure()` requests does not re-choose the tier (the fresh measurement of the host's
    // border box removed): the tier stays stale after the call, both ways.
    name: "US3 review R2-01: a percentage inline padding that changes with the host's container is not seen, and remeasure() re-chooses the tier: in Frame W a content-box host 600 px wide with 2% inline padding and collapse-below 640px, in a 1000 px container, is 640 px wide and shows two columns; narrowing the container to 500 px makes it 620 px and the tier stays stale until the host calls remeasure(), which gives one column; widening the container back to 1000 px makes it 640 px, stale in one column until remeasure() gives two again, with no error (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `<div id="q-c" class="qc">${listDetail("q", ' collapse-below="640px"')}</div>`, {
        extra: ".qc { inline-size: 1000px; } #q { box-sizing: content-box; inline-size: 600px; padding-inline: 2%; }",
      });
      const state = async (): Promise<{ layout: string; width: number }> => ({ layout: await layout(driver, "q"), width: round((await driver.box("q")).width) });
      const first = await state();
      await driver.style("q-c", "inline-size", "500px");
      await frames(driver, 4);
      const narrowed = await state();
      await driver.call("q", "remeasure");
      const remeasured = await state();
      await driver.style("q-c", "inline-size", "1000px");
      await frames(driver, 4);
      const widened = await state();
      await driver.call("q", "remeasure");
      return { first, narrowed, remeasured, widened, again: await state(), messages: await driver.messages() };
    },
    expected: {
      first: { layout: "two", width: 640 },
      narrowed: { layout: "two", width: 620 },
      remeasured: { layout: "one: list", width: 620 },
      widened: { layout: "one: list", width: 640 },
      again: { layout: "two", width: 640 },
      messages: [],
    },
  },
  {
    // Plants: the edge box observed in its content box (L23: its content box is always 0 px wide, so the tier stays one
    // column); the edge box 1 px tall (L24: it then adds to the scroll container's overflow). The scroll
    // container is positioned, so it is the edge box's containing block and the edge box's overflow would reach it.
    name: "US3 review R2-01: a host whose content box is narrower than its own inline padding and borders: in Frame W a content-box host 30 px wide with 40 px inline padding and collapse-below 120px, in a positioned 100 px scroll container, is 110 px wide and shows one column; 50 px inline padding (130 px) gives two columns and 40 px one again; with narrow and 200 px inline-start padding (240 px) the scroll container scrolls to the host's border box only (240 px), with no error (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `<div id="k-c" class="kc">${listDetail("k", ' collapse-below="120px"', '<div slot="list">List</div><div>Detail</div>')}</div>`, {
        extra: ".kc { position: relative; inline-size: 100px; overflow: auto; } #k { box-sizing: content-box; inline-size: 30px; padding-inline: 40px; }",
      });
      const state = async (): Promise<{ layout: string; width: number }> => ({ layout: await layout(driver, "k"), width: round((await driver.box("k")).width) });
      const first = await state();
      await driver.style("k", "padding-inline", "50px");
      const padded = await state();
      await driver.style("k", "padding-inline", "40px");
      const unpadded = await state();
      await driver.setAttribute("k", "narrow", "");
      await driver.style("k", "padding-inline", "200px 10px");
      return { first, padded, unpadded, narrow: { ...(await state()), scrolls: Number(await readOnce(driver, "k-c", "scrollWidth")) }, messages: await driver.messages() };
    },
    expected: {
      first: { layout: "one: list", width: 110 },
      padded: { layout: "two", width: 130 },
      unpadded: { layout: "one: list", width: 110 },
      narrow: { layout: "one: list", width: 240, scrolls: 240 },
      messages: [],
    },
  },
  {
    // Guard added after the round 2 fix (reviews/phase-4/round-2-fixes.md): since the first render schedules the first
    // pass, the pass a slot change schedules was no longer told apart from it, and its mutant survived (the
    // `schedule()` call of the slot change removed: the element then stays 1073 px wide).
    name: "US3 guard: a slot change after the first render measures again: in the 1196 px row, a light-DOM child with a 40rem block in no slot is 1073 px wide; once its slot attribute is removed, so it joins the detail pane, the element is 1196 px wide (1233 px shrunk to the row) in three columns (FR-025)",
    base: false,
    run: async (driver) => {
      await page(driver, "R", `<div class="row">${listDetail("g", "", `${sized("g")}<div slot="spare" id="g-x"><div class="w40"></div></div>`)}</div>`);
      const before = Math.round((await driver.box("g")).width);
      await driver.setAttribute("g-x", "slot", null);
      return { before, after: Math.round((await driver.box("g")).width), layout: await layout(driver, "g") };
    },
    expected: { before: 1073, after: 1196, layout: "three" },
  },
];

