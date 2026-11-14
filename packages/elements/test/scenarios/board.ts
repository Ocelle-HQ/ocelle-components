// The shared bodies of User Story 2's browser scenarios for `ocelle-workflow-board` (009 spec US2 scenarios 1 to 3 and
// 9 to 15, the board's Edge Cases, FR-012 to FR-016, FR-030, FR-031, SC-002, SC-003, SC-006; contracts/elements.md
// § `ocelle-workflow-board`; contracts/overflow-region.md; research.md R-04, R-08, R-17; T032). Each scenario sets its
// frame's viewport, observes the page through the driver with real input only, and returns one observation; each
// harness asserts it equals the scenario's `expected`, written by hand from the spec and research:
// - the frames of the spec (Frame W 876 px at a 1280 px viewport, N 636 px at 720 px, S 288 px at 320 px);
// - a lane's minimum and flex basis `--ocelle-lane-min-width` (10rem, 160 px), the `--ocelle-space-3` gap (12 px) and
//   the 5 px ring room on each inline side of the track: five lanes need 5 × 160 + 4 × 12 + 10 = 858 px, so in Frame W
//   (876 px) they share 876 − 10 − 48 = 818 px, 163.6 px each (164 rounded), and in Frame N they keep 160 px and the
//   board's scroll range is 858 − 636 = 222 px; three lanes in Frame W are (876 − 10 − 24) / 3 = 280.67 px (281), two
//   are 427 px, one is 866 px; at a 20 px root five lanes need 5 × 200 + 4 × 15 + 10 = 1070 px;
// - the 32 px fade, the 40 px arrow step and the token colours of packages/tokens/test/expected.ts.
// Cards carry sentence-length text, wider on one line than a lane (US2-1, R-08), so a lane whose content fed the
// board's intrinsic size would widen it. Every "does not" outcome is observed in the same scenario as the positive
// outcome it guards (spec § "Does not" outcomes, paired), and the plant that makes it fail is named beside it; each
// plant is run once and recorded in specs/009-workflow-layouts/reviews/phase-3/plants.md (T044).
import type { Box, Driver, Target } from "./driver.ts";
import { systemColours, tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import { boxAttributes, edgeLines, edges, fadeFor, inside, readOnce, rgb, ringOf, shadowAttribute } from "./scroller.ts";

/** A scenario of User Story 2 and whether its page links `base.css` (the fixture then opens `board-base.html`). */
export interface BoardScenario extends Scenario {
  readonly base: boolean;
}

/** The ring room and the fade depth at a 16 px root (spec FR-001, FR-007). */
const room = 5;
const fade = 32;

/** A sentence wider on one line than a lane's share (spec US2-1). */
export const sentence = "Implement the overflow region module and its tests for the scroller";

export type Frame = "W" | "N" | "S";

/** Each frame's viewport (spec § Layout frames). */
const viewports: Readonly<Record<Frame, readonly [number, number]>> = { W: [1280, 800], N: [720, 800], S: [320, 800] };

/** The test page's rules: opaque blocks, fixed-size blocks, block links, a 400 px chip row and the canvas ground. */
const rules = [
  ".solid { display: block; block-size: 24px; background-color: rgb(0, 0, 255); }",
  ".fixed { display: block; inline-size: 400px; block-size: 20px; }",
  ".tall { block-size: 600px; }",
  ".thin { display: block; inline-size: 1000px; block-size: 4px; }",
  ".link { display: block; }",
  ".chip { display: inline-block; inline-size: 400px; block-size: 24px; vertical-align: top; }",
  '[data-ground="canvas"] { background-color: var(--ocelle-color-canvas); }',
].join("\n");

/**
 * Sets the frame's viewport and mounts `markup` inside a `#page` block with the test rules. `#page` holds everything,
 * so the page scrolls in the inline direction exactly when `#page` overflows (`pageScrolls`).
 */
export async function page(driver: Driver, frame: Frame, markup: string, options: { readonly extra?: string; readonly base?: boolean } = {}): Promise<void> {
  const [width, height] = viewports[frame];
  await driver.viewport(width, height);
  await driver.mount(`<div id="page">${markup}</div>`, { base: options.base ?? false });
  await driver.rules(rules + (options.extra ?? ""));
}

export const before = '<button id="before" type="button">before</button>';
export const after = '<button id="after" type="button">after</button>';

const titles = ["Backlog", "Ready", "In progress", "In review", "Done"];

/** A card: a paragraph holding the sentence. */
export const card = (id?: string): string => `<p class="card"${id === undefined ? "" : ` id="${id}"`}>${sentence}</p>`;

/** A lane with `id`, its attributes (each with a leading space) and its content. */
export const lane = (id: string, attributes: string, inner: string = card()): string => `<ocelle-workflow-lane id="${id}"${attributes}>${inner}</ocelle-workflow-lane>`;

/** `count` default lanes `<prefix>0` … titled from the list, counted 1 …, each holding one card. */
export const lanes = (prefix: string, count = 5): string =>
  Array.from({ length: count }, (_, index) => lane(`${prefix}${String(index)}`, ` label="${titles[index % titles.length] ?? ""}" count="${String(index + 1)}"`)).join("");

/** `count` untitled flat lanes, each holding one opaque 24 px block as wide as the lane (for the pixel fades). */
const solidLanes = (prefix: string, count = 5): string => Array.from({ length: count }, (_, index) => lane(`${prefix}${String(index)}`, ' variant="flat"', '<div class="solid"></div>')).join("");

/** A board with `id` in a frame box (`<id>-frame`, with `container`'s attributes). */
export const board = (id: string, inner: string, attributes = ' label="Workflow"', frame: Frame = "W", container = ""): string =>
  `<div id="${id}-frame" data-frame="${frame}"${container}><ocelle-workflow-board id="${id}"${attributes}>${inner}</ocelle-workflow-board></div>`;

export const ids = (prefix: string, count: number): string[] => Array.from({ length: count }, (_, index) => `${prefix}${String(index)}`);

const boxOf = (id: string): Target => ({ id, inner: ".region-box" });
const trackOf = (id: string): Target => ({ id, inner: ".region-track" });

/** `-0` as 0, so a scroll position reads the same in every harness. */
const zeroed = (value: number): number => value + 0;

/** The accessibility nodes of the element `id` and its shadow subtree that are not `generic`: its role nodes. */
export async function roles(driver: Driver, id: string): Promise<unknown[]> {
  return (await driver.ax(id)).filter((node) => node.role !== "generic");
}

/** Whether the board's box overflows (spec § Overflow: more than 1 px of content past its client width). */
async function overflows(driver: Driver, id: string): Promise<boolean> {
  return Number(await readOnce(driver, boxOf(id), "scrollWidth")) - Number(await readOnce(driver, boxOf(id), "clientWidth")) > 1;
}

/** The board's overflow, its box's tab stop, role and name, and its role nodes. */
export async function boardState(driver: Driver, id: string): Promise<unknown> {
  return { overflowing: await overflows(driver, id), box: await boxAttributes(driver, id), landmarks: await roles(driver, id) };
}

/** A board that fits: no overflow, no tab stop, no role, no name, no node of a role (FR-002, FR-015). */
const fits = { overflowing: false, box: { tabindex: null, role: null, "aria-label": null }, landmarks: [] };

/** An overflowing board named `name`: a tab stop and one `region` landmark with that name (FR-014). */
const region = (name = "Workflow"): unknown => ({ overflowing: true, box: { tabindex: "0", role: "region", "aria-label": name }, landmarks: [{ role: "region", name }] });

/** The lanes' inline sizes rounded to px, whether they are equal within 1 px, and whether each is at least 160 px. */
export async function widths(driver: Driver, laneIds: readonly string[]): Promise<{ widths: number[]; equal: boolean; atLeast: boolean }> {
  const measured: number[] = [];
  for (const id of laneIds) measured.push((await driver.box(id)).width);
  return { widths: measured.map((each) => Math.round(each)), equal: Math.max(...measured) - Math.min(...measured) <= 1, atLeast: measured.every((each) => each >= 159.5) };
}

const shares = (width: number, count: number): unknown => ({ widths: Array.from({ length: count }, () => width), equal: true, atLeast: true });

/** Whether the page scrolls in the inline direction: `#page` holds everything, so it overflows exactly then. */
export async function pageScrolls(driver: Driver): Promise<boolean> {
  return Number(await readOnce(driver, "page", "scrollWidth")) > Number(await readOnce(driver, "page", "clientWidth"));
}

/** The board's box focused, then each arrow key toward the hidden end seven times and back seven times, and two modified arrows. */
async function keys(driver: Driver, id: string, direction: "ltr" | "rtl"): Promise<unknown> {
  await driver.tabWalk("before", `${id} >> div.region-box`);
  const toward = direction === "ltr" ? "ArrowRight" : "ArrowLeft";
  const back = direction === "ltr" ? "ArrowLeft" : "ArrowRight";
  const press = async (key: string): Promise<unknown[]> => {
    await driver.press(key);
    return [zeroed(await driver.scrollLeft(boxOf(id))), await driver.lastKeyPrevented()];
  };
  const out: unknown[] = [];
  for (let step = 0; step < 7; step++) out.push(await press(toward));
  const returned: unknown[] = [];
  for (let step = 0; step < 7; step++) returned.push(await press(back));
  const modified: unknown[] = [];
  for (const key of ["Alt+ArrowLeft", "Shift+ArrowRight"]) {
    await driver.setScrollLeft(boxOf(id), direction === "ltr" ? 100 : -100);
    await driver.press(key);
    await driver.settle();
    modified.push({ key, scrollLeft: zeroed(await driver.scrollLeft(boxOf(id))), prevented: await driver.lastKeyPrevented() });
  }
  return { out, returned, modified };
}

function keysExpected(direction: "ltr" | "rtl"): unknown {
  const sign = direction === "ltr" ? 1 : -1;
  const at = (value: number): number => zeroed(sign * value);
  return {
    out: [40, 80, 120, 160, 200, 222, 222].map((value) => [at(value), true]),
    returned: [182, 142, 102, 62, 22, 0, 0].map((value) => [at(value), true]),
    modified: ["Alt+ArrowLeft", "Shift+ArrowRight"].map((key) => ({ key, scrollLeft: at(100), prevented: false })),
  };
}

/** The pixel edges of the board `id` of opaque flat lanes on the canvas ground, at its start, middle and end. */
async function boardFades(driver: Driver, id: string, direction: "ltr" | "rtl"): Promise<unknown> {
  const ground = rgb(tokenColour("color-canvas", "light"));
  const sign = direction === "ltr" ? 1 : -1;
  const out: Record<string, unknown> = {};
  for (const [position, value] of [
    ["start", 0],
    ["middle", 100],
    ["end", 10_000],
  ] as const) {
    await driver.setScrollLeft(boxOf(id), sign * value);
    out[position] = await edges(driver, id, ground);
  }
  return out;
}

const fadesExpected = {
  ltr: { start: { left: "solid", right: "fade" }, middle: { left: "fade", right: "fade" }, end: { left: "fade", right: "solid" } },
  rtl: { start: { left: "fade", right: "solid" }, middle: { left: "fade", right: "fade" }, end: { left: "solid", right: "fade" } },
};

/** One keyboard-focused card in a board: the focus, its ring box inside the box and clear of each fading edge, and the fades on exactly the off-screen sides. */
async function cardStep(driver: Driver, id: string, cardId: string): Promise<unknown> {
  const box = await driver.box(id, ".region-box");
  const track = await driver.box(id, ".region-track");
  const ring = ringOf(await driver.box(cardId));
  const fadeAttribute = await shadowAttribute(driver, id, "region-box", "data-fade");
  const clearLeft = !["start", "both"].includes(fadeAttribute ?? "") || ring.left >= box.x + fade - 0.5;
  const clearRight = !["end", "both"].includes(fadeAttribute ?? "") || ring.right <= box.x + box.width - fade + 0.5;
  return { active: await driver.activeElement(), inside: inside(ring, box), clear: clearLeft && clearRight, fades: fadeAttribute === fadeFor(await driver.scrollLeft(boxOf(id)), track, box) };
}

/** Each side of the element's computed border, as `<width> <style> <colour>`, or `none` when it is 0 px wide. */
export async function borders(driver: Driver, id: string): Promise<string[]> {
  const out: string[] = [];
  for (const side of ["top", "right", "bottom", "left"]) {
    const width = await driver.computed(id, `border-${side}-width`);
    out.push(width === "0px" ? "none" : `${width} ${await driver.computed(id, `border-${side}-style`)} ${await driver.computed(id, `border-${side}-color`)}`);
  }
  return out;
}

const shown = (box: Box): unknown => ({ display: box.display, width: box.width });

/** The resize entries of a frame record (`"resize: <reading>"`, in the observer callback that saw the change). */
const resized = (record: readonly string[]): string[] => record.filter((each) => each.startsWith("resize: "));

/** A 60-character identifier with no break opportunity (spec US2-14). */
const identifier = `WP-${"0123456789abcdef".repeat(4).slice(0, 57)}`;

/** US2-14's board: an identifier and a 400 px image in the first lane, a nested 400 px scroller in the second. */
const contentBoard = (frame: Frame): string =>
  board(
    "b",
    [
      lane("l0", ' label="Backlog" count="1"', `<p class="card"><span id="ident">${identifier}</span></p><img id="img" width="400" height="40" alt="">`),
      lane("l1", ' label="Ready" count="2"', '<ocelle-scroller id="tags" label="Tags"><span class="chip"></span></ocelle-scroller>'),
      lane("l2", ' label="In progress" count="3"'),
      lane("l3", ' label="In review" count="4"'),
      lane("l4", ' label="Done" count="5"'),
    ].join(""),
    ' label="Workflow"',
    frame,
  );

/** US2-15's five flat lanes, each holding three block links whose text is the sentence. */
const linkLanes = Array.from({ length: 5 }, (_, index) =>
  lane(
    `l${String(index)}`,
    ' variant="flat"',
    Array.from({ length: 3 }, (_, at) => `<a id="l${String(index)}c${String(at)}" class="link" href="#l${String(index)}c${String(at)}">${sentence}</a>`).join(""),
  ),
).join("");

/** US2-15 in one frame: each named card focused by Tab, then by Shift+Tab, and the board's block scroll and overflow. */
async function cardRings(driver: Driver, frame: Frame): Promise<unknown> {
  await page(driver, frame, `${before}${board("b", linkLanes, ' label="Workflow"', frame)}${after}`);
  const steps: unknown[] = [];
  for (const target of ["l0c0", "l2c0", "l2c2", "l4c2"]) {
    await driver.tabWalk("before", target);
    steps.push(await cardStep(driver, "b", target));
  }
  for (const target of ["l4c2", "l2c2", "l2c0", "l0c0"]) {
    await driver.tabWalk("after", target, true);
    steps.push(await cardStep(driver, "b", target));
  }
  return {
    steps,
    blockScroll: Number(await readOnce(driver, boxOf("b"), "scrollHeight")) - Number(await readOnce(driver, boxOf("b"), "clientHeight")),
    overflowY: await driver.computed(boxOf("b"), "overflow-y"),
    overflowing: await overflows(driver, "b"),
  };
}

const cardRingsExpected = (overflowing: boolean): unknown => ({
  steps: ["l0c0", "l2c0", "l2c2", "l4c2", "l4c2", "l2c2", "l2c0", "l0c0"].map((active) => ({ active, inside: true, clear: true, fades: true })),
  blockScroll: 0,
  overflowY: "hidden",
  overflowing,
});

export const boardScenarios: readonly BoardScenario[] = [
  {
    // Plants: the board always applies its region role and tab stop (the Frame W board then joins the tab walk and the
    // tree); the board's `::slotted(*)` `contain: inline-size` removed (the sentence cards then widen the lanes and
    // the Frame W board overflows; R-08).
    name: "US2-1: five lanes of sentence cards in Frame W are side by side, equal and at least 160 px, and the board does not overflow, is not a tab stop and has no region, while the same board in Frame N overflows, is one tab stop and one region named by its label (FR-013, FR-015, SC-003)",
    base: false,
    run: async (driver) => {
      const observe = async (frame: Frame): Promise<unknown> => {
        await page(driver, frame, `${before}${board("b", lanes("l"), ' label="Workflow"', frame)}${after}`);
        return { walk: await driver.tabWalk("before", "after"), state: await boardState(driver, "b"), lanes: await widths(driver, ids("l", 5)) };
      };
      return { W: await observe("W"), N: await observe("N") };
    },
    expected: {
      W: { walk: ["after"], state: fits, lanes: shares(164, 5) },
      N: { walk: ["b >> div.region-box", "after"], state: region(), lanes: shares(160, 5) },
    },
  },
  {
    // Plant: no modifier check (the modified arrows are then prevented and scroll; R-02, as US1-5).
    name: "US2-2: in Frame N the board is one tab stop and one region named by its label, the page has no horizontal scroll, ArrowRight on the focused board scrolls 40 px per press to the hidden end and ArrowLeft back, prevented also at the extent, the modified arrows are neither prevented nor scroll, and the fades show on pixels only on the sides with lanes off-screen (FR-014, SC-002, SC-003)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${board("b", lanes("l"))}${board("f", solidLanes("f"), ' label="Strips"', "N", ' data-ground="canvas"')}${after}`);
      return {
        walk: await driver.tabWalk("before", "after"),
        state: await boardState(driver, "b"),
        lanes: await widths(driver, ids("l", 5)),
        pageScrolls: await pageScrolls(driver),
        keys: await keys(driver, "b", "ltr"),
        fades: await boardFades(driver, "f", "ltr"),
      };
    },
    expected: {
      walk: ["b >> div.region-box", "f >> div.region-box", "after"],
      state: region(),
      lanes: shares(160, 5),
      pageScrolls: false,
      keys: keysExpected("ltr"),
      fades: fadesExpected.ltr,
    },
  },
  {
    name: "US2-3: three lanes in Frame W share the board's inline size less the 5 px ring room on each side equally, with 12 px gaps, and the board does not overflow (FR-013)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", board("b", lanes("l", 3)));
      const box = await driver.box("b", ".region-box");
      const [first, second, third] = [await driver.box("l0"), await driver.box("l1"), await driver.box("l2")];
      return {
        lanes: await widths(driver, ids("l", 3)),
        gaps: [Math.round(second.x - (first.x + first.width)), Math.round(third.x - (second.x + second.width))],
        room: [Math.round(first.x - box.x), Math.round(box.x + box.width - (third.x + third.width))],
        state: await boardState(driver, "b"),
      };
    },
    expected: { lanes: shares(281, 3), gaps: [12, 12], room: [room, room], state: fits },
  },
  {
    // Plant: a board without its own overflow (the lanes then overflow the frame and the page scrolls).
    name: "US2-9: in Frame S at 320 px the page has no horizontal scroll while the board overflows inside itself and each lane keeps 160 px (FR-014, SC-006)",
    base: false,
    run: async (driver) => {
      await page(driver, "S", board("b", lanes("l"), ' label="Workflow"', "S"));
      return { pageScrolls: await pageScrolls(driver), state: await boardState(driver, "b"), lanes: await widths(driver, ids("l", 5)) };
    },
    expected: { pageScrolls: false, state: region(), lanes: shares(160, 5) },
  },
  {
    name: "US2-10: right to left in Frame N, the first lane is at the right and each count follows its title inline; ArrowLeft on the focused board reaches the hidden end in 40 px steps and ArrowRight comes back, the modified arrows are not prevented, and the fades are mirrored on pixels (FR-014, SC-002)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${board("b", lanes("l"), ' label="Workflow"', "N", ' dir="rtl"')}${board("f", solidLanes("f"), ' label="Strips"', "N", ' dir="rtl" data-ground="canvas"')}`);
      const box = await driver.box("b", ".region-box");
      const first = await driver.box("l0");
      const title = await driver.box("l1", ".title");
      const count = await driver.box("l1", ".count");
      return {
        firstAtRight: Math.round(box.x + box.width - (first.x + first.width)),
        countFollows: count.x + count.width <= title.x + 0.5 && Math.abs(count.y - title.y) < 4,
        state: await boardState(driver, "b"),
        keys: await keys(driver, "b", "rtl"),
        fades: await boardFades(driver, "f", "rtl"),
      };
    },
    expected: { firstAtRight: room, countFollows: true, state: region(), keys: keysExpected("rtl"), fades: fadesExpected.rtl },
  },
  {
    name: "US2-11: in forced colours a default lane draws a 1 px CanvasText border on every side and a flat lane none, and the overflowing board at its start draws only the end edge's line, with no mask (FR-008, FR-017)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", board("b", `${lanes("l", 4)}${lane("fl", ' label="Done" count="5" variant="flat"')}`, ' label="Workflow"', "N"));
      await driver.forcedColors("active", "light");
      const observed = { default: await borders(driver, "l0"), flat: await borders(driver, "fl"), edges: await edgeLines(driver, "b") };
      await driver.forcedColors("none");
      const restored = { default: await borders(driver, "l0"), flat: await borders(driver, "fl") };
      return { ...observed, restored };
    },
    expected: ((): unknown => {
      const line = `1px solid ${systemColours.light.CanvasText ?? ""}`;
      return {
        default: [line, line, line, line],
        flat: ["none", "none", "none", "none"],
        edges: {
          start: { left: "none", right: "none", atLeft: true, atRight: false, width: fade, fullHeight: true },
          end: { left: "none", right: line, atLeft: false, atRight: true, width: fade, fullHeight: true },
          mask: "none",
        },
        restored: { default: ["none", "none", "none", "none"], flat: ["none", "none", "none", "none"] },
      };
    })(),
  },
  {
    // Plant: `:host([hidden])` removed from the board, and from the lane.
    name: "US2-12: a hidden board and a hidden lane have no box and no node, and the hidden board, which would overflow, is no tab stop, beside a visible board whose two other lanes share it (FR-030)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `${before}${board("hb", lanes("h", 12), ' label="Hidden" hidden')}${board("b", `${lane("v0", ' label="Ready"')}${lane("hl", ' label="Blocked" count="3" hidden')}${lane("v1", ' label="Done"')}`)}${after}`);
      return {
        board: [shown(await driver.box("hb")), await driver.ax("hb")],
        lane: [shown(await driver.box("hl")), await driver.ax("hl")],
        visible: await widths(driver, ["v0", "v1"]),
        walk: await driver.tabWalk("before", "after"),
      };
    },
    expected: { board: [{ display: "none", width: 0 }, []], lane: [{ display: "none", width: 0 }, []], visible: shares(427, 2), walk: ["after"] },
  },
  {
    name: "US2-13: every kind of board and lane of these scenarios, used with keys, scroll and focus, reports no console message (the fixture also records no CSP violation and no request outside its list) (FR-031)",
    base: false,
    run: async (driver) => {
      await page(
        driver,
        "N",
        `${before}${board("a", lanes("a"))}${board("r", lanes("r"), ' label="Workflow"', "N", ' dir="rtl"')}${board("f", linkLanes.replaceAll(' id="l', ' id="fl'))}${board("e", "")}${board("u", lanes("u"), "")}${lane("s", ' label="Ready" count="3" count-label="3 work packages"')}`,
      );
      await driver.tabWalk("before", "a >> div.region-box");
      await driver.press("ArrowRight");
      await driver.press("Tab");
      await driver.setScrollLeft(boxOf("r"), -100);
      await driver.setAttribute("s", "count", "4");
      await driver.style("a-frame", "inline-size", "900px");
      return { defined: (await driver.box("a", ".region-box")).display, lane: (await driver.box("s")).display, messages: await driver.messages() };
    },
    expected: { defined: "block", lane: "block", messages: [] },
  },
  {
    // Plants: a lane whose minimum inline size is its content's min-content (the flex default: in Frame N the lanes
    // then shrink under 160 px and the board fits); the board's `::slotted(*)` without inline-size containment (the
    // nested scroller and the image then widen their lanes, and the Frame W board overflows; R-08).
    name: "US2-14 (with base.css): in Frame W five lanes stay equal and the board does not overflow with a 60-character identifier, a 400 px image and a nested 400 px scroller in its lanes; the identifier breaks inside its lane, the image is capped at the lane's content box, and the nested scroller takes the lane's content width and is a tab stop and a group named Tags of its own, not a landmark; in Frame N the lanes keep 160 px and the board overflows (FR-013)",
    base: true,
    run: async (driver) => {
      await page(driver, "W", `${before}${contentBoard("W")}${after}`, { base: true });
      const first = await driver.box("l0");
      const second = await driver.box("l1");
      const content = { left: first.x + 12, right: first.x + first.width - 12 };
      const lines = await driver.lines("ident");
      const image = await driver.box("img");
      const tags = await driver.box("tags");
      const W = {
        lanes: await widths(driver, ids("l", 5)),
        state: await boardState(driver, "b"),
        identifier: { lines: lines.length > 1, inside: lines.every((line) => line.x >= content.left - 0.5 && line.x + line.width <= content.right + 0.5) },
        image: image.width > 0 && image.width <= content.right - content.left + 0.5,
        tags: { width: Math.abs(tags.width - (second.width - 24)) <= 0.5, box: await boxAttributes(driver, "tags"), roles: await roles(driver, "tags") },
        walk: await driver.tabWalk("before", "after"),
      };
      await page(driver, "N", contentBoard("N"), { base: true });
      return { W, N: { lanes: await widths(driver, ids("l", 5)), state: await boardState(driver, "b") } };
    },
    expected: {
      W: {
        lanes: shares(164, 5),
        state: fits,
        identifier: { lines: true, inside: true },
        image: true,
        tags: { width: true, box: { tabindex: "0", role: "group", "aria-label": "Tags" }, roles: [{ role: "group", name: "Tags" }] },
        walk: ["tags >> div.region-box", "after"],
      },
      N: { lanes: shares(160, 5), state: region() },
    },
  },
  {
    // Plant: no ring room (the module's block and inline ring room 0: the first and last cards' rings are then cut at
    // the board's edges).
    name: "US2-15: in Frame W five flat lanes of block-link cards keep every keyboard-focused card's ring whole inside the board, which neither scrolls in the block direction nor overflows (FR-014)",
    base: false,
    run: (driver) => cardRings(driver, "W"),
    expected: cardRingsExpected(false),
  },
  {
    // Plants: no ring room; no fade clearance (a card in a lane partly off-screen is then left under a fade).
    name: "US2-15: in Frame N each keyboard-focused card, by Tab and by Shift+Tab, is scrolled into view with its whole ring inside the board and clear of the fades, the fades stay on exactly the off-screen sides, and the board does not scroll in the block direction (FR-001, FR-014)",
    base: false,
    run: (driver) => cardRings(driver, "N"),
    expected: cardRingsExpected(true),
  },
  {
    name: "SPEC-2-06: a fixed 400 px block in the first lane overlaps the next lane without making the Frame W board overflow, and a card with one added to the last lane after the first render makes the board a tab stop and a region in the observer callback that sees the lane grow (FR-013, FR-014)",
    base: false,
    run: async (driver) => {
      await page(
        driver,
        "W",
        board(
          "b",
          [
            lane("l0", ' label="Backlog" count="1"', `${card()}<div id="fx" class="fixed"></div>`),
            lane("l1", ' label="Ready" count="2"'),
            lane("l2", ' label="In progress" count="3"'),
            lane("l3", ' label="In review" count="4"'),
            lane("l4", ' label="Done" count="5"', `${card()}<div id="late" class="fixed tall" slot="none"></div>`),
          ].join(""),
        ),
      );
      const fixed = await driver.box("fx");
      const [first, second] = [await driver.box("l0"), await driver.box("l1")];
      const overlap = { pastLane: fixed.x + fixed.width > first.x + first.width, intoNext: fixed.x + fixed.width > second.x, state: await boardState(driver, "b") };
      const record = await driver.frameRecord(trackOf("b"), { attribute: "tabindex", of: boxOf("b") });
      await driver.setAttribute("late", "slot", null);
      return { overlap, tabindex: resized(await record.stop()), state: await boardState(driver, "b") };
    },
    expected: { overlap: { pastLane: true, intoNext: true, state: fits }, tabindex: ["resize: null", "resize: 0"], state: region() },
  },
  {
    // The overflow-region module's `slotchange` listener (contracts/overflow-region.md § Lifecycle; phase 2 review
    // R1-03): four lanes of fixed 24 px blocks, whose block size does not follow their width, and a fifth child that
    // holds a 1000 px block 4 px high, assigned after the first render. It changes neither the box's nor the track's
    // size (the track keeps the frame's inline size, and the lanes' block size), so only the slot change shows the
    // board that it now overflows. Plant: the module's `slotchange` listener removed.
    name: "US2 slot change: a child assigned to the Frame W board after the first render whose fixed content reaches past the board's end makes it a tab stop and a region, though neither the box nor the track changes size (FR-002, FR-014)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", board("b", `${solidLanes("l", 4)}<div id="late" slot="none"><div class="thin"></div></div>`));
      const start = { state: await boardState(driver, "b"), box: await driver.box("b", ".region-box"), track: await driver.box("b", ".region-track") };
      await driver.setAttribute("late", "slot", null);
      const box = await driver.box("b", ".region-box");
      const track = await driver.box("b", ".region-track");
      return {
        before: start.state,
        unchanged: [box.width === start.box.width && box.height === start.box.height, track.width === start.track.width && track.height === start.track.height],
        after: await boardState(driver, "b"),
      };
    },
    expected: { before: fits, unchanged: [true, true], after: region() },
  },
  {
    name: "US2 at a 20 px root font size: the lanes are 200 px, so five need 1070 px and overflow Frame W (R-17)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", board("b", lanes("l")), { extra: "\n:root { font-size: 20px; }" });
      return { lanes: await widths(driver, ids("l", 5)), state: await boardState(driver, "b") };
    },
    expected: { lanes: shares(200, 5), state: region() },
  },
  {
    name: "US2 sheets: two boards adopt the shared sheets plus exactly one per-instance sheet each, the lanes their one shared sheet and no per-instance sheet, none holds a <style> element, and no shadow element has a style attribute after scrolling (FR-030, constitution IV)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `${board("a", lanes("a"))}${board("o", lanes("o", 12))}`);
      await driver.setScrollLeft(boxOf("o"), 300);
      const parts = [];
      for (const id of ["a", "o", ...ids("a", 5), ...ids("o", 12)]) parts.push(...(await driver.elements(id)));
      return { boards: await driver.sheets("ocelle-workflow-board"), lanes: await driver.sheets("ocelle-workflow-lane"), styled: parts.filter((part) => "style" in part.attributes).length };
    },
    // The board's `static styles` is its own sheet and `overflowRegionStyles`: two shared, one per instance (R-05). The
    // lane's is one shared sheet.
    expected: { boards: { elements: 2, perRoot: [3], distinct: 4, styleElements: 0 }, lanes: { elements: 17, perRoot: [1], distinct: 1, styleElements: 0 }, styled: 0 },
  },
  {
    name: "US2 many lanes: twelve lanes in Frame W are each 160 px, and the board overflows and is a tab stop and a region while the page has no horizontal scroll (Edge Cases)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", `${before}${board("b", lanes("l", 12))}${after}`);
      return { lanes: await widths(driver, ids("l", 12)), state: await boardState(driver, "b"), pageScrolls: await pageScrolls(driver), walk: await driver.tabWalk("before", "after") };
    },
    expected: { lanes: shares(160, 12), state: region(), pageScrolls: false, walk: ["b >> div.region-box", "after"] },
  },
  {
    name: "US2 one lane: one lane in Frame W is the board's inline size less the ring room on each side, 866 px, and the board does not overflow (Edge Cases)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", board("b", lanes("l", 1)));
      return { lanes: await widths(driver, ["l0"]), state: await boardState(driver, "b") };
    },
    expected: { lanes: shares(866, 1), state: fits },
  },
  {
    // Plant: the board always applies its region role and tab stop (the empty board then joins the walk and the tree).
    name: "US2 no lanes: an empty board in Frame N draws its box, does not overflow, is no tab stop and adds no node, beside a twin with five lanes that is one tab stop and a region (Edge Cases)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", `${before}${board("e", "", ' label="Empty"', "N")}${board("t", lanes("l"), ' label="Workflow"', "N")}${after}`);
      const empty = await driver.box("e");
      return {
        box: { display: empty.display, width: Math.round(empty.width), height: Math.round(empty.height) },
        empty: await boardState(driver, "e"),
        twin: await boardState(driver, "t"),
        walk: await driver.tabWalk("before", "after"),
      };
    },
    expected: { box: { display: "block", width: 636, height: 2 * room }, empty: fits, twin: region(), walk: ["t >> div.region-box", "after"] },
  },
  {
    // Plant: `contain: inline-size` on the lane's host only, not in the board's `::slotted(*)` (the `div` children
    // then widen the track, and the board overflows; R-08, analysis F1).
    name: "US2 non-lane children: three lanes and two divs of sentence text in Frame W are all equal and at least 160 px, and the board does not overflow (Edge Cases, FR-013)",
    base: false,
    run: async (driver) => {
      await page(driver, "W", board("b", `${lane("n0", ' label="Ready"')}<div id="d0">${sentence}</div>${lane("n1", ' label="Done"')}<div id="d1">${sentence}</div>${lane("n2", ' label="Blocked"')}`));
      return { children: await widths(driver, ["n0", "d0", "n1", "d1", "n2"]), state: await boardState(driver, "b") };
    },
    expected: { children: shares(164, 5), state: fits },
  },
  {
    // Plant: the fades and the tab stop computed from a cached `scrollLeft` (the value read before the removal)
    // instead of the clamped one: the fitting board then keeps the start fade in the callback that sees it fit
    // (analysis U1). The state not recomputed on `slotchange` or the track's resize is US1-3's plant.
    name: "US2 content changes while scrolled: five lanes in Frame N scrolled to the end; with one removed the board still overflows at the clamped end, the start fade on pixels and no end fade; with two more removed it fits, with no tab stop, no region and no fade, already in the observer callback that sees it fit (Edge Cases, FR-002, FR-007)",
    base: false,
    run: async (driver) => {
      await page(driver, "N", board("f", solidLanes("f"), ' label="Strips"', "N", ' data-ground="canvas"'));
      const ground = rgb(tokenColour("color-canvas", "light"));
      await driver.setScrollLeft(boxOf("f"), 10_000);
      const end = zeroed(await driver.scrollLeft(boxOf("f")));
      await driver.setAttribute("f0", "slot", "none");
      const clamped = { scrollLeft: zeroed(await driver.scrollLeft(boxOf("f"))), state: await boardState(driver, "f"), edges: await edges(driver, "f", ground) };
      const record = await driver.frameRecord(trackOf("f"), { attribute: "data-fade", of: boxOf("f") });
      const tabindex = await driver.frameRecord(trackOf("f"), { attribute: "tabindex", of: boxOf("f") });
      await driver.setAttribute("f1", "slot", "none");
      await driver.setAttribute("f2", "slot", "none");
      return {
        end,
        clamped,
        callbacks: { fade: resized(await record.stop()), tabindex: resized(await tabindex.stop()) },
        fitted: { state: await boardState(driver, "f"), edges: await edges(driver, "f", ground) },
      };
    },
    expected: {
      end: 222,
      // Four lanes need 686 px: a 50 px range, at whose end the box is clamped.
      clamped: { scrollLeft: 50, state: region("Strips"), edges: { left: "fade", right: "solid" } },
      // The track shrinks once, when three lanes fit (514 px < 636 px); two lanes then fill the frame again.
      callbacks: { fade: ["resize: start", "resize: null"], tabindex: ["resize: 0", "resize: null"] },
      fitted: { state: fits, edges: { left: "solid", right: "solid" } },
    },
  },
];
