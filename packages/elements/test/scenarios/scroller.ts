// The shared bodies of User Story 1's browser scenarios for `ocelle-scroller` and the overflow-region module (009 spec
// US1 scenarios 1 to 16, FR-001 to FR-011, SC-001, SC-002; contracts/overflow-region.md; research.md R-01 to R-07,
// R-13, R-17; T013). Each scenario observes the page through the driver, with real input only, and returns one
// observation; each harness asserts it equals the scenario's `expected`, written by hand from the spec and research:
// the 5 px ring room (`--ocelle-focus-offset` 2 px + `--ocelle-focus-width` 3 px), the 32 px fade
// (`--ocelle-scroller-fade-size`, 2rem at a 16 px root), the 40 px arrow step, the token colours of
// packages/tokens/test/expected.ts and the forced-colours system colours Chromium's emulated palettes give. The
// accessibility trees are Chromium's for the contract's structure (research.md R-01): the host (it carries an `id`),
// `.region-frame` (positioned, with positioned children) and `.region-track` are unignored `generic` nodes; the box
// is ignored at rest, a `generic` tab stop while it overflows unnamed, and a `group` while it overflows named.
//
// The strips are 300 px boxes of fixed-size items (80 px wide, 24 px high, 4 px after each) with no whitespace between
// them, so their figures do not depend on the font: three items fit (5 + 3 × 84 + 5 = 262 px) and twelve overflow
// (1018 px, a scroll range of 718 px); a 1000 px opaque block overflows by 710 px.
//
// Every "does not" outcome is observed in the same scenario as the positive outcome it guards (spec § "Does not"
// outcomes, paired), and the plant that makes it fail is named beside it; each plant is run once and recorded in
// specs/009-workflow-layouts/reviews/phase-2/plants.md (T030).
import type { Pixels } from "../pixels.ts";
import type { Box, Driver, Palette, Part, ElementTarget } from "./driver.ts";
import { systemColours, tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";

/** The element a region scenario runs on: its tag and how `deepActive()` names its box and its frame. */
export interface Region {
  readonly tag: string;
  readonly box: string;
  readonly frame: string;
}

export const scrollerRegion: Region = { tag: "ocelle-scroller", box: "div.region-box", frame: "div.region-frame" };

/** The ring room, the fade depth and the step at a 16 px root (spec FR-001, FR-006, FR-007). */
const room = 5;
const fade = 32;

/** The test page's rules: strip widths, items, an opaque block, the two main grounds and a clipping container. */
const rules = [
  '[data-test="strip"] { inline-size: 300px; }',
  '[data-test="wide-strip"] { inline-size: 600px; }',
  ".item { display: inline-block; box-sizing: border-box; inline-size: 80px; block-size: 24px; margin: 0; margin-inline-end: 4px; padding: 0; border: 0; vertical-align: top; font: inherit; color: inherit; background: none; }",
  ".solid { display: inline-block; inline-size: 1000px; block-size: 24px; vertical-align: top; background-color: rgb(0, 0, 255); }",
  ".tall { display: inline-block; inline-size: 40px; block-size: 60px; vertical-align: top; }",
  ".wide { display: inline-block; box-sizing: border-box; inline-size: 240px; block-size: 24px; margin: 0; margin-inline-end: 4px; padding: 0; border: 0; vertical-align: top; background-color: rgb(0, 0, 255); }",
  ".invisible { visibility: hidden; }",
  '[data-ground="canvas"] { background-color: var(--ocelle-color-canvas); }',
  '[data-ground="pane"] { background-color: var(--ocelle-color-pane); }',
  ".clip { overflow: hidden; }",
  ".twin { inline-size: 300px; overflow-x: auto; overflow-y: hidden; padding-block: 5px; }",
  ".twin-track { inline-size: max-content; min-inline-size: 100%; box-sizing: border-box; padding-inline: 5px; }",
].join("\n");

/** Mounts `markup` at a 1280 × 800 viewport with the test rules. */
async function page(driver: Driver, markup: string, extra = ""): Promise<void> {
  await driver.viewport(1280, 800);
  await driver.mount(markup);
  await driver.rules(rules + extra);
}

const link = (id: string): string => `<a id="${id}" class="item" href="#${id}">${id}</a>`;
const button = (id: string): string => `<button id="${id}" class="item" type="button">${id}</button>`;
const links = (prefix: string, count: number): string => Array.from({ length: count }, (_, index) => link(`${prefix}${String(index)}`)).join("");
const ids = (prefix: string, count: number): string[] => Array.from({ length: count }, (_, index) => `${prefix}${String(index)}`);

const boxOf = (id: string): ElementTarget => ({ id, inner: ".region-box" });

/** The box's tab stop, role and name, from the shadow root's elements (null when absent). */
export async function boxAttributes(driver: Driver, id: string): Promise<Record<string, string | null>> {
  const box = (await driver.elements(id)).find((part: Part) => part.attributes.class?.split(" ").includes("region-box"));
  const of = (name: string): string | null => box?.attributes[name] ?? null;
  return { tabindex: of("tabindex"), role: of("role"), "aria-label": of("aria-label") };
}

/** An attribute of the first shadow element with `className` (null when absent or when there is no such element). */
export async function shadowAttribute(driver: Driver, id: string, className: string, name: string): Promise<string | null> {
  const part = (await driver.elements(id)).find((each: Part) => each.attributes.class?.split(" ").includes(className));
  return part?.attributes[name] ?? null;
}

/** One reading of a target, through a frame record that is stopped at once. */
export async function readOnce(driver: Driver, target: ElementTarget, property: string): Promise<string> {
  const record = await (await driver.frameRecord(target, { property })).stop();
  return record[0] ?? "";
}

const generic = { role: "generic", name: "" };
const group = (name: string): unknown => ({ role: "group", name });

/** The roles of the accessibility subtree of `id` that are a group or a landmark region. */
async function groupsAndRegions(driver: Driver, id: string): Promise<string[]> {
  return (await driver.axSubtree(id)).map((node) => node.role).filter((role) => role === "group" || role === "region");
}

/** The number of link nodes in the accessibility subtree of `id`. */
async function linkCount(driver: Driver, id: string): Promise<number> {
  return (await driver.axSubtree(id)).filter((node) => node.role === "link").length;
}

// ---------------------------------------------------------------------------------------------------------------
// Pixels (research.md R-05: fades are asserted on pixels, never on `data-fade`).

export type Rgb = readonly [number, number, number];

export function at(image: Pixels, x: number, y: number): Rgb {
  const index = (Math.round(y) * image.width + Math.round(x)) * 4;
  return [image.data[index] ?? 0, image.data[index + 1] ?? 0, image.data[index + 2] ?? 0];
}

export function rgb(text: string): Rgb {
  const [r = 0, g = 0, b = 0] = (text.match(/\d+(\.\d+)?/g) ?? []).map(Number);
  return [r, g, b];
}

const content: Rgb = [0, 0, 255];

/** Whether two colours are within `tolerance` in every channel. */
export function near(a: Rgb, b: Rgb, tolerance = 8): boolean {
  return a.every((channel, index) => Math.abs(channel - (b[index] ?? 0)) <= tolerance);
}

/** How far a pixel is from the ground toward the content colour: 0 at the ground, 1 at the content (a projection). */
function toward(pixel: Rgb, ground: Rgb, to: Rgb): number {
  const span = to.map((channel, index) => channel - (ground[index] ?? 0));
  const length = span.reduce((sum, each) => sum + each * each, 0);
  return pixel.reduce((sum, channel, index) => sum + (channel - (ground[index] ?? 0)) * (span[index] ?? 0), 0) / length;
}

/**
 * What one inline edge of a strip of opaque content shows, `d` px in from that edge on row `y`:
 * - `fade`: the composited colour rises monotonically from the ground at the edge (under 0.2 of the way) to the
 *   content colour at the fade depth (over 0.9 at 32 px, over 0.97 at 34 px), half way near 16 px;
 * - `solid`: past the ring room, the content colour all the way to the fade depth;
 * - `other`: anything else.
 */
function edge(image: Pixels, y: number, side: "left" | "right", ground: Rgb): string {
  const x = (d: number): number => (side === "left" ? d : image.width - 1 - d);
  const t = Array.from({ length: 36 }, (_, d) => toward(at(image, x(d), y), ground, content));
  const rising = t.every((value, d) => d === 0 || value >= (t[d - 1] ?? 0) - 0.06);
  if ((t[0] ?? 1) < 0.2 && (t[32] ?? 0) > 0.9 && (t[34] ?? 0) > 0.97 && (t[16] ?? 0) > 0.3 && (t[16] ?? 1) < 0.75 && rising) return "fade";
  if (t.slice(room + 1, fade + 3).every((value) => value > 0.9)) return "solid";
  return "other";
}

/** The two inline edges of the strip `id` on its middle row. */
export async function edges(driver: Driver, id: string, ground: Rgb): Promise<{ left: string; right: string }> {
  const image = await driver.pixels(id);
  const y = Math.floor(image.height / 2);
  return { left: edge(image, y, "left", ground), right: edge(image, y, "right", ground) };
}

/**
 * Whether the token focus ring is drawn inset on each side of the host `id`'s box, in `colour`: a pixel inside the
 * 3 px ring band at the middle of the left, right, top and bottom sides.
 */
export async function ringSides(driver: Driver, id: string, colour: Rgb): Promise<boolean[]> {
  const image = await driver.pixels(id);
  const [w, h] = [image.width, image.height];
  return [at(image, 1, h / 2), at(image, w - 2, h / 2), at(image, w / 2, 1), at(image, w / 2, h - 2)].map((pixel) => near(pixel, colour));
}

export const focusColour = (theme: Palette): Rgb => rgb(tokenColour("color-focus", theme));

/**
 * The colour a forced-colours ring in `Highlight` paints over `Canvas`: Chromium's emulated light palette gives
 * `Highlight` as a translucent colour (`rgba(5, 0, 73, 0.8)`), and everything under the ring is `Canvas` in forced
 * colours, so the painted pixel is the one composited over `Canvas`.
 */
export async function highlightOnCanvas(driver: Driver): Promise<Rgb> {
  const parts = (await driver.resolveColour("Highlight")).match(/[\d.]+/g)?.map(Number) ?? [];
  const [r = 0, g = 0, b = 0, alpha = 1] = parts;
  const canvas = rgb(await driver.resolveColour("Canvas"));
  return [r, g, b].map((channel, index) => Math.round(channel * alpha + (canvas[index] ?? 0) * (1 - alpha))) as unknown as Rgb;
}

// ---------------------------------------------------------------------------------------------------------------
// Geometry.

/** A ring box: a border box grown by the ring room on each side. */
export function ringOf(box: Box): { left: number; right: number; top: number; bottom: number } {
  return { left: box.x - room, right: box.x + box.width + room, top: box.y - room, bottom: box.y + box.height + room };
}

/** Whether a ring box lies inside the scroll box (half a px of tolerance for layout rounding). */
export function inside(ring: ReturnType<typeof ringOf>, box: Box): boolean {
  return ring.left >= box.x - 0.5 && ring.right <= box.x + box.width + 0.5 && ring.top >= box.y - 0.5 && ring.bottom <= box.y + box.height + 0.5;
}

/** The `data-fade` value the box should carry for its scroll state (the module's output, checked here for SC-001). */
export function fadeFor(scrollLeft: number, track: Box, box: Box): string | null {
  const start = Math.abs(scrollLeft) > 1;
  const end = track.width - box.width - Math.abs(scrollLeft) > 1;
  if (start && end) return "both";
  if (start) return "start";
  return end ? "end" : null;
}

/**
 * One step of a tab walk inside a strip: the focused link's ring box lies inside the box and at least the fade depth
 * from each inline edge that fades (by the box's `data-fade`), and the box fades exactly the sides with content
 * off-screen (no fade hidden to clear the link).
 */
async function step(driver: Driver, id: string, focused: string, direction: "ltr" | "rtl"): Promise<{ inside: boolean; clear: boolean; fades: boolean }> {
  const box = await driver.box(id, ".region-box");
  const track = await driver.box(id, ".region-track");
  const ring = ringOf(await driver.box(focused));
  const fadeAttribute = await shadowAttribute(driver, id, "region-box", "data-fade");
  const left = direction === "ltr" ? ["start", "both"] : ["end", "both"];
  const right = direction === "ltr" ? ["end", "both"] : ["start", "both"];
  const clearLeft = !left.includes(fadeAttribute ?? "") || ring.left >= box.x + fade - 0.5;
  const clearRight = !right.includes(fadeAttribute ?? "") || ring.right <= box.x + box.width - fade + 0.5;
  return { inside: inside(ring, box), clear: clearLeft && clearRight, fades: fadeAttribute === fadeFor(await driver.scrollLeft(boxOf(id)), track, box) };
}

// ---------------------------------------------------------------------------------------------------------------
// Region scenarios: US1 scenarios 1, 3, 4 and 12, which also run against the test host (US1-16, SC-008).

export function regionScenarios(region: Region): Scenario[] {
  const { tag } = region;
  const strip = (id: string, inner: string, attributes = ' label="Filters"'): string => `<div data-test="strip"><${tag} id="${id}"${attributes}>${inner}</${tag}></div>`;
  return [
    {
      // Plant: `tabindex` and the role set whatever the overflow (the fitting box joins the tab walk and the tree).
      name: `US1-1 (${tag}): a fitting strip adds no tab stop, no group and no name, beside an overflowing twin that is one tab stop and one group named "Filters" holding its content, not a landmark (FR-002, FR-003)`,
      run: async (driver) => {
        await page(driver, `<button id="before" type="button">before</button>${strip("fit", links("f", 3))}${strip("over", links("o", 12))}<button id="after" type="button">after</button>`);
        return {
          walk: await driver.tabWalk("before", "after"),
          fit: { ax: await driver.ax("fit"), box: await boxAttributes(driver, "fit"), links: await linkCount(driver, "fit"), groups: await groupsAndRegions(driver, "fit") },
          over: { ax: await driver.ax("over"), box: await boxAttributes(driver, "over"), links: await linkCount(driver, "over"), groups: await groupsAndRegions(driver, "over") },
        };
      },
      expected: {
        walk: [...ids("f", 3), `over >> ${region.box}`, ...ids("o", 12), "after"],
        fit: { ax: [generic, generic, generic], box: { tabindex: null, role: null, "aria-label": null }, links: 3, groups: [] },
        over: { ax: [generic, generic, group("Filters"), generic], box: { tabindex: "0", role: "group", "aria-label": "Filters" }, links: 12, groups: ["group"] },
      },
    },
    {
      // Asserted inside a ResizeObserver the frame record registers after the element's (its "resize:" entries), in
      // the same delivery as the element's own observer, not in a later frame. Plant: the module's state write moved
      // into a requestAnimationFrame (R-03, PLAN-TESTABILITY-1-004 (a)).
      name: `US1-3 (${tag}): the tab stop and the group follow a resize of the box and a change of the content, both ways, in the observer callback that sees the change (FR-002)`,
      run: async (driver) => {
        await page(driver, `<div id="frame" data-test="strip"><${tag} id="s" label="Filters">${links("f", 3)}<a id="f3" class="item" href="#f3" slot="none">f3</a></${tag}></div>`);
        const tabindex = await driver.frameRecord(boxOf("s"), { attribute: "tabindex" });
        const role = await driver.frameRecord(boxOf("s"), { attribute: "role" });
        await driver.style("frame", "inline-size", "200px");
        await driver.style("frame", "inline-size", "300px");
        const resized = { tabindex: await tabindex.stop(), role: await role.stop() };
        const track: ElementTarget = { id: "s", inner: ".region-track" };
        const tabindex2 = await driver.frameRecord(track, { attribute: "tabindex", of: boxOf("s") });
        const role2 = await driver.frameRecord(track, { attribute: "role", of: boxOf("s") });
        await driver.style("f2", "inline-size", "200px");
        await driver.style("f2", "inline-size", "80px");
        await driver.setAttribute("f3", "slot", null);
        await driver.setAttribute("f3", "slot", "none");
        const changed = { tabindex: await tabindex2.stop(), role: await role2.stop() };
        const observed = (record: string[]): string[] => record.filter((each) => each.startsWith("resize: "));
        return {
          box: { tabindex: observed(resized.tabindex), role: observed(resized.role) },
          content: { tabindex: observed(changed.tabindex), role: observed(changed.role) },
        };
      },
      expected: {
        // At rest, narrowed to 200 px (262 px of content overflows), widened back to 300 px.
        box: { tabindex: ["resize: null", "resize: 0", "resize: null"], role: ["resize: null", "resize: group", "resize: null"] },
        // At rest, f2 widened to 200 px (382 px), back to 80 px, f3 assigned to the slot (346 px), unassigned again.
        content: {
          tabindex: ["resize: null", "resize: 0", "resize: null", "resize: 0", "resize: null"],
          role: ["resize: null", "resize: group", "resize: null", "resize: group", "resize: null"],
        },
      },
    },
    {
      // Plants: the light-DOM-only walk (the shadow and delegating cases then focus the frame); the frame's ring rule
      // removed, and the ring as an outline of the frame (painted under the masked box once the content overflows
      // again; R-07, PLAN-A11Y-SECURITY-1-007 (a), PLAN-FRESH-2-004).
      name: `US1-4 (${tag}): when overflow ends on the focused box, focus moves to the first focusable slotted element in the flat tree, else to the frame, whose inset ring shows on all four sides, also after the content overflows again and in Highlight in forced colours (FR-004)`,
      run: async (driver) => {
        const handover = async (inner: string): Promise<Record<string, unknown>> => {
          await page(driver, `<button id="before" type="button">before</button><div class="clip" data-test="wide-strip"><${tag} id="s" label="Filters"><span id="w" class="solid"></span>${inner}</${tag}></div>`);
          await driver.tabWalk("before", `s >> ${region.box}`);
          await driver.style("w", "inline-size", "100px");
          return { active: await driver.deepActive(), box: (await boxAttributes(driver, "s")).tabindex, frame: await shadowAttribute(driver, "s", "region-frame", "tabindex") };
        };
        // The hidden link carries no `.item` class: that rule's `display` would beat the user-agent `[hidden]` rule.
        const skipped = '<button id="disabled" class="item" type="button" disabled>d</button><span inert><a id="inert" class="item" href="#inert">i</a></span><a id="gone" href="#gone" hidden>g</a><a id="unseen" class="item invisible" href="#unseen">u</a>';
        const observed: Record<string, unknown> = {
          link: await handover(`${skipped}${link("k")}`),
          shadow: await handover('<test-shadow-button id="sb"></test-shadow-button>'),
          delegating: await handover('<test-delegating id="dg"></test-delegating>'),
          none: await handover(""),
        };
        const rest = await ringSides(driver, "s", focusColour("light"));
        await driver.style("w", "inline-size", "1000px");
        const again = { active: await driver.deepActive(), box: (await boxAttributes(driver, "s")).tabindex, ring: await ringSides(driver, "s", focusColour("light")) };
        await driver.forcedColors("active", "light");
        const forced = await ringSides(driver, "s", await highlightOnCanvas(driver));
        await driver.forcedColors("none");
        await driver.chord("Tab");
        return { ...observed, rest, again, forced, left: { active: await driver.deepActive(), frame: await shadowAttribute(driver, "s", "region-frame", "tabindex") } };
      },
      expected: {
        link: { active: "k", box: null, frame: null },
        shadow: { active: "sb >> button.inner", box: null, frame: null },
        delegating: { active: "dg >> button.inner", box: null, frame: null },
        none: { active: `s >> ${region.frame}`, box: null, frame: "-1" },
        rest: [true, true, true, true],
        again: { active: `s >> ${region.frame}`, box: "0", ring: [true, true, true, true] },
        forced: [true, true, true, true],
        left: { active: `s >> ${region.box}`, frame: null },
      },
    },
    {
      name: `US1-12 (${tag}): an overflowing strip with no label, a blank label or a blank host aria-label alone is one tab stop with no role and no name; a host aria-label names one group by itself, and a blank one counts as absent (FR-010, SPEC-1-10)`,
      run: async (driver) => {
        const over = links("x", 12);
        await page(
          driver,
          `<button id="before" type="button">before</button>${strip("u", over, "")}${strip("blank", over, ' label=" "')}${strip("named", over, ' aria-label="Ready strip"')}${strip("blankHost", over, ' aria-label=" " label="Filters"')}${strip("blankAlone", over, ' aria-label=" "')}`,
        );
        const trees: Record<string, unknown> = {};
        for (const id of ["u", "blank", "named", "blankHost", "blankAlone"]) trees[id] = { ax: await driver.ax(id), box: await boxAttributes(driver, id) };
        await driver.setAttribute("u", "aria-label", "Late name");
        const late = await driver.ax("u");
        await driver.setAttribute("u", "aria-label", null);
        return { trees, late, removed: await driver.ax("u") };
      },
      expected: {
        trees: {
          u: { ax: [generic, generic, generic, generic], box: { tabindex: "0", role: null, "aria-label": null } },
          blank: { ax: [generic, generic, generic, generic], box: { tabindex: "0", role: null, "aria-label": null } },
          named: { ax: [{ role: "generic", name: "Ready strip" }, generic, group("Ready strip"), generic], box: { tabindex: "0", role: "group", "aria-label": "Ready strip" } },
          blankHost: { ax: [generic, generic, group("Filters"), generic], box: { tabindex: "0", role: "group", "aria-label": "Filters" } },
          blankAlone: { ax: [generic, generic, generic, generic], box: { tabindex: "0", role: null, "aria-label": null } },
        },
        late: [{ role: "generic", name: "Late name" }, generic, group("Late name"), generic],
        removed: [generic, generic, generic, generic],
      },
    },
  ];
}

// ---------------------------------------------------------------------------------------------------------------
// The scroller's own scenarios.

const strip = (id: string, inner: string, attributes = ' label="Filters"', container = ""): string => `<div data-test="strip"${container}><ocelle-scroller id="${id}"${attributes}>${inner}</ocelle-scroller></div>`;
const before = '<button id="before" type="button">before</button>';
const after = '<button id="after" type="button">after</button>';
const focusBox = (driver: Driver, id: string): Promise<string[]> => driver.tabWalk("before", `${id} >> div.region-box`);

/** US1-5's keys on the focused box in one direction under one motion setting. */
async function arrowKeys(driver: Driver, direction: "ltr" | "rtl", reduced: boolean): Promise<unknown> {
  await page(driver, `${before}${strip("s", links("k", 12), ' label="Filters"', ` dir="${direction}"`)}`);
  await driver.reducedMotion(reduced ? "reduce" : "no-preference");
  await focusBox(driver, "s");
  const sign = direction === "ltr" ? 1 : -1;
  const toward = direction === "ltr" ? "ArrowRight" : "ArrowLeft";
  const back = direction === "ltr" ? "ArrowLeft" : "ArrowRight";
  const record = await driver.frameRecord(boxOf("s"), { property: "scrollLeft" });
  await driver.chord(toward);
  const frames = (await record.stop()).filter((each) => !each.startsWith("resize: "));
  const first = { after: [...new Set(frames.slice(frames.indexOf("keydown") + 1))], prevented: await driver.lastKeyPrevented() };
  await driver.chord(back);
  const returned = [await driver.scrollLeft(boxOf("s")), await driver.lastKeyPrevented()];
  await driver.chord(back);
  const atStart = [await driver.scrollLeft(boxOf("s")), await driver.lastKeyPrevented()];
  await driver.setScrollLeft(boxOf("s"), sign * 10_000);
  await driver.chord(toward);
  const atEnd = [await driver.scrollLeft(boxOf("s")), await driver.lastKeyPrevented()];
  const homeEnd: boolean[] = [];
  for (const key of ["Home", "End"]) {
    await driver.setScrollLeft(boxOf("s"), sign * 300);
    await driver.chord(key);
    homeEnd.push(await driver.lastKeyPrevented());
  }
  const modified: unknown[] = [];
  for (const key of ["Alt+ArrowLeft", "Ctrl+ArrowRight", "Meta+ArrowRight", "Shift+ArrowRight"]) {
    await driver.setScrollLeft(boxOf("s"), sign * 300);
    const held = await driver.frameRecord(boxOf("s"), { property: "scrollLeft" });
    await driver.chord(key);
    await driver.settle();
    await driver.settle();
    modified.push({ key, scrollLeft: [...new Set((await held.stop()).filter((each) => each !== "keydown").map((each) => each.replace("resize: ", "")))], prevented: await driver.lastKeyPrevented() });
  }
  await driver.reducedMotion("no-preference");
  return { first, returned, atStart, atEnd, homeEnd, modified };
}

function arrowExpected(direction: "ltr" | "rtl"): unknown {
  const sign = direction === "ltr" ? 1 : -1;
  const value = (n: number): string => String(sign * n === 0 ? 0 : sign * n);
  return {
    first: { after: [value(40)], prevented: true },
    returned: [0, true],
    atStart: [0, true],
    atEnd: [sign * 718, true],
    homeEnd: [false, false],
    modified: ["Alt+ArrowLeft", "Ctrl+ArrowRight", "Meta+ArrowRight", "Shift+ArrowRight"].map((key) => ({ key, scrollLeft: [value(300)], prevented: false })),
  };
}

/** US1-6 and US1-7 on one ground in one theme: the edges at start, middle and end in ltr and rtl, and the box's ring. */
async function fades(driver: Driver, ground: "canvas" | "pane", theme: Palette): Promise<unknown> {
  const on = ` data-ground="${ground}"`;
  await page(
    driver,
    `${before}${strip("l", '<span class="solid"></span>', ' label="Strip"', on)}${strip("r", '<span class="solid"></span>', ' label="Strip"', `${on} dir="rtl"`)}${strip("fit", '<span class="item">a</span>', ' label="Strip"', on)}`,
  );
  await driver.theme(theme);
  const groundColour = rgb(tokenColour(`color-${ground}`, theme));
  const positions: Record<string, unknown> = {};
  for (const [id, sign] of [
    ["l", 1],
    ["r", -1],
  ] as const) {
    for (const [position, value] of [
      ["start", 0],
      ["middle", 300],
      ["end", 10_000],
    ] as const) {
      await driver.setScrollLeft(boxOf(id), sign * value);
      positions[`${id} ${position}`] = await edges(driver, id, groundColour);
    }
  }
  await driver.setScrollLeft(boxOf("l"), 0);
  await focusBox(driver, "l");
  const ringAtStart = await driver.pixels("l");
  await driver.setScrollLeft(boxOf("l"), 300);
  const ringInMiddle = await driver.pixels("l");
  const mid = (image: Pixels): number => Math.floor(image.height / 2);
  return {
    positions,
    ring: {
      start: near(at(ringAtStart, ringAtStart.width - 2, mid(ringAtStart)), focusColour(theme)),
      middle: [near(at(ringInMiddle, 1, mid(ringInMiddle)), focusColour(theme)), near(at(ringInMiddle, ringInMiddle.width - 2, mid(ringInMiddle)), focusColour(theme))],
    },
    fit: { fade: await shadowAttribute(driver, "fit", "region-box", "data-fade"), mask: await driver.computedOf(boxOf("fit"), "mask-image") },
    overMasked: (await driver.computedOf(boxOf("l"), "mask-image")) !== "none",
  };
}

const fadesExpected = {
  positions: {
    "l start": { left: "solid", right: "fade" },
    "l middle": { left: "fade", right: "fade" },
    "l end": { left: "fade", right: "solid" },
    "r start": { left: "fade", right: "solid" },
    "r middle": { left: "fade", right: "fade" },
    "r end": { left: "solid", right: "fade" },
  },
  ring: { start: true, middle: [true, true] },
  fit: { fade: null, mask: "none" },
  overMasked: true,
};

/** Each edge element's drawn sides and colour, and its box against the scroll box (US1-8). */
export async function edgeLines(driver: Driver, id: string): Promise<unknown> {
  const box = await driver.box(id, ".region-box");
  const out: Record<string, unknown> = {};
  for (const name of ["start", "end"] as const) {
    const target: ElementTarget = { id, inner: `.region-edge.${name}` };
    const side = async (which: "left" | "right"): Promise<string> => {
      const width = await driver.computedOf(target, `border-${which}-width`);
      const style = await driver.computedOf(target, `border-${which}-style`);
      return width === "0px" ? "none" : `${width} ${style} ${await driver.computedOf(target, `border-${which}-color`)}`;
    };
    const edgeBox = await driver.box(id, `.region-edge.${name}`);
    out[name] = {
      left: await side("left"),
      right: await side("right"),
      atLeft: Math.abs(edgeBox.x - box.x) < 0.5,
      atRight: Math.abs(edgeBox.x + edgeBox.width - (box.x + box.width)) < 0.5,
      width: Math.round(edgeBox.width),
      fullHeight: Math.abs(edgeBox.height - box.height) < 0.5 && Math.abs(edgeBox.y - box.y) < 0.5,
    };
  }
  return { ...out, mask: await driver.computedOf(boxOf(id), "mask-image") };
}

/** A focused wide button's fallback state: the box's fade attribute over the frames of a record, and its left edge. */
async function fallbackState(driver: Driver): Promise<{ fades: string[]; left: string }> {
  const record = await driver.frameRecord(boxOf("s"), { attribute: "data-fade" });
  await driver.settle();
  const fades = [...new Set((await record.stop()).map((each) => each.replace("resize: ", "")))];
  const image = await driver.pixels("s");
  return { fades, left: edge(image, Math.floor(image.height / 2), "left", rgb(tokenColour("color-canvas", "light"))) };
}

export const scrollerScenarios: readonly Scenario[] = [
  ...regionScenarios(scrollerRegion),
  {
    name: "US1-2: Tab from before an overflowing scroller lands on its box first and then on each link, and a scroller holding no focusable element is a tab stop too (FR-003)",
    run: async (driver) => {
      await page(driver, `${before}${strip("a", links("a", 12))}${strip("b", '<span class="solid"></span>')}${after}`);
      return driver.tabWalk("before", "after");
    },
    expected: ["a >> div.region-box", ...ids("a", 12), "b >> div.region-box", "after"],
  },
  {
    // Plant: no modifier check (R-02): the modified arrows are then prevented and scroll.
    name: "US1-5: with the box focused, the arrow key toward the hidden content scrolls 40 px within one frame, with and without reduced motion, in ltr and rtl; at the extent it is prevented and changes nothing; Home and End and the modified arrows are not prevented and do not scroll (FR-006, FR-009, SC-002)",
    run: async (driver) => ({
      ltr: await arrowKeys(driver, "ltr", false),
      "ltr, reduced motion": await arrowKeys(driver, "ltr", true),
      rtl: await arrowKeys(driver, "rtl", false),
      "rtl, reduced motion": await arrowKeys(driver, "rtl", true),
    }),
    expected: { ltr: arrowExpected("ltr"), "ltr, reduced motion": arrowExpected("ltr"), rtl: arrowExpected("rtl"), "rtl, reduced motion": arrowExpected("rtl") },
  },
  ...(["canvas", "pane"] as const).flatMap((ground) =>
    (["light", "dark"] as const).map(
      (theme): Scenario => ({
        // Plants: both fades always (the start and end positions then fade on their solid side); the rtl mirror
        // removed (the rtl strip then fades on the wrong side); the ring overlay inside the masked box (its pixels
        // at a fading edge are then faded); data-fade="" bound with the mask on attribute presence (the fitting box
        // is then masked; PLAN-FRESH-2-006).
        name: `US1-6 and US1-7 on color-${ground} in ${theme}: each inline edge with content off-screen fades the content toward the ground over 32 px, and only those, mirrored in rtl; the box's ring is not faded; a fitting box has no data-fade and no mask (FR-005, FR-007)`,
        run: (driver) => fades(driver, ground, theme),
        expected: fadesExpected,
      }),
    ),
  ),
  {
    // Plant: both lines always.
    name: "US1-8: in forced colours each edge with content off-screen draws a 1 px CanvasText line on its outer side, at the box's edge and over its block size, and an edge with nothing off-screen none; the content is not faded (FR-008)",
    run: async (driver) => {
      await page(driver, `${strip("l", '<span class="solid"></span>')}${strip("r", '<span class="solid"></span>', ' label="Filters"', ' dir="rtl"')}`);
      await driver.forcedColors("active", "light");
      await driver.setScrollLeft(boxOf("l"), 300);
      await driver.setScrollLeft(boxOf("r"), -300);
      const middle = { l: await edgeLines(driver, "l"), r: await edgeLines(driver, "r") };
      await driver.setScrollLeft(boxOf("l"), 0);
      await driver.setScrollLeft(boxOf("r"), 0);
      const start = { l: await edgeLines(driver, "l"), r: await edgeLines(driver, "r") };
      await driver.forcedColors("none");
      return { middle, start };
    },
    expected: ((): unknown => {
      const line = `1px solid ${systemColours.light.CanvasText ?? ""}`;
      const at = (left: string, right: string, atLeft: boolean): unknown => ({ left, right, atLeft, atRight: !atLeft, width: fade, fullHeight: true });
      return {
        middle: {
          l: { start: at(line, "none", true), end: at("none", line, false), mask: "none" },
          r: { start: at("none", line, false), end: at(line, "none", true), mask: "none" },
        },
        start: {
          l: { start: at("none", "none", true), end: at("none", line, false), mask: "none" },
          r: { start: at("none", "none", false), end: at(line, "none", true), mask: "none" },
        },
      };
    })(),
  },
  {
    name: "US1-9: the focused box shows the token ring inset on all four sides on keyboard focus, none after a pointer click, and the ring in Highlight in forced colours (FR-005)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", '<span class="solid"></span>', ' label="Filters"', ' data-ground="canvas"')}`);
      await focusBox(driver, "s");
      const keyboard = await ringSides(driver, "s", focusColour("light"));
      await driver.clickAt("before", { x: 2, y: 2 });
      await driver.clickAt("s", { x: 150, y: 17 });
      const clicked = { active: await driver.deepActive(), ring: await ringSides(driver, "s", focusColour("light")) };
      await driver.forcedColors("active", "light");
      await driver.clickAt("before", { x: 2, y: 2 });
      await focusBox(driver, "s");
      const forced = await ringSides(driver, "s", await highlightOnCanvas(driver));
      await driver.forcedColors("none");
      return { keyboard, clicked, forced };
    },
    expected: { keyboard: [true, true, true, true], clicked: { active: "s >> div.region-box", ring: [false, false, false, false] }, forced: [true, true, true, true] },
  },
  {
    // Plant: preventDefault (and a scroll) on every arrow key, whatever its target.
    name: "US1-10: an arrow key on a focused link inside an overflowing scroller is not prevented, while the same key on the focused box is prevented and scrolls it (FR-006)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", links("k", 12))}`);
      await focusBox(driver, "s");
      await driver.chord("ArrowRight");
      const box = [await driver.lastKeyPrevented(), await driver.scrollLeft(boxOf("s"))];
      await driver.setScrollLeft(boxOf("s"), 0);
      await driver.chord("Tab");
      const focused = await driver.deepActive();
      await driver.chord("ArrowRight");
      const right = await driver.lastKeyPrevented();
      await driver.chord("ArrowLeft");
      return { box, focused, link: [right, await driver.lastKeyPrevented()] };
    },
    expected: { box: [true, 40], focused: "k0", link: [false, false] },
  },
  {
    name: "US1-11: the box-focused key and the fades do not animate, with and without reduced motion: no transition, and the new fade in the first frame after the key (FR-009)",
    run: async (driver) => {
      const observe = async (reduced: boolean): Promise<unknown> => {
        await page(driver, `${before}${strip("s", '<span class="solid"></span>')}`);
        await driver.reducedMotion(reduced ? "reduce" : "no-preference");
        await focusBox(driver, "s");
        const record = await driver.frameRecord(boxOf("s"), { computed: "mask-image" });
        await driver.chord("ArrowRight");
        const frames = (await record.stop()).filter((each) => !each.startsWith("resize: "));
        const key = frames.indexOf("keydown");
        const [was, now] = [new Set(frames.slice(0, key)), new Set(frames.slice(key + 1))];
        await driver.reducedMotion("no-preference");
        return {
          transition: [await driver.computedOf(boxOf("s"), "transition-duration"), await driver.computedOf(boxOf("s"), "animation-name")],
          before: was.size,
          after: now.size,
          changed: [...was][0] !== [...now][0],
          gradient: [...now][0]?.includes("linear-gradient") ?? false,
        };
      };
      return { motion: await observe(false), reduced: await observe(true) };
    },
    expected: ((): unknown => {
      const instant = { transition: ["0s", "none"], before: 1, after: 1, changed: true, gradient: true };
      return { motion: instant, reduced: instant };
    })(),
  },
  {
    // Plant: no ring room (a ring is then cut at the box's edges).
    name: "US1-13: the box scrolls in the inline direction only, its block size is its content's plus the ring room on each side, and every keyboard-focused control's ring box lies inside it, in a fitting and an overflowing strip (FR-001)",
    run: async (driver) => {
      const tall = '<span class="tall"></span>';
      const controls = (prefix: string, count: number): string => Array.from({ length: count }, (_, index) => (index % 2 === 0 ? link : button)(`${prefix}${String(index)}`)).join("");
      await page(driver, `${before}${strip("fit", `${controls("f", 3)}${tall}`)}${strip("over", `${controls("o", 12)}${tall}`)}${after}`);
      const observe = async (id: string, prefix: string, count: number, last: string): Promise<unknown> => {
        const rings: boolean[] = [];
        await driver.tabWalk("before", `${prefix}0`);
        for (let index = 0; index < count; index++) {
          if (index > 0) await driver.chord("Tab");
          rings.push(inside(ringOf(await driver.box(`${prefix}${String(index)}`)), await driver.box(id, ".region-box")));
        }
        const box = await driver.box(id, ".region-box");
        const track = await driver.box(id, ".region-track");
        return {
          last: await driver.deepActive() === last,
          rings,
          height: Math.abs(box.height - (track.height + 2 * room)) < 0.5,
          blockScroll: Number(await readOnce(driver, boxOf(id), "scrollHeight")) - Number(await readOnce(driver, boxOf(id), "clientHeight")),
          overflowY: await driver.computedOf(boxOf(id), "overflow-y"),
        };
      };
      return { fit: await observe("fit", "f", 3, "f2"), over: await observe("over", "o", 12, "o11") };
    },
    expected: {
      fit: { last: true, rings: [true, true, true], height: true, blockScroll: 0, overflowY: "hidden" },
      over: { last: true, rings: Array.from({ length: 12 }, () => true), height: true, blockScroll: 0, overflowY: "hidden" },
    },
  },
  {
    // Plants: no fade clearance (a link is left under a fade); no ring room; clearance by hiding a fade (fades then
    // differ from the off-screen sides).
    name: "US1-13: tabbing through twelve links and back, in ltr and rtl, every ring box lies inside the box and at least the fade depth from each fading edge, while each edge with content off-screen still fades (FR-001, FR-007, SC-001)",
    run: async (driver) => {
      const walk = async (direction: "ltr" | "rtl"): Promise<unknown> => {
        await page(driver, `${before}${strip("s", links("k", 12), ' label="Filters"', ` dir="${direction}"`)}${after}`);
        const steps: unknown[] = [];
        await driver.tabWalk("before", "s >> div.region-box");
        for (let index = 0; index < 12; index++) {
          await driver.chord("Tab");
          steps.push({ focused: await driver.deepActive(), ...(await step(driver, "s", `k${String(index)}`, direction)) });
        }
        for (let index = 10; index >= 0; index--) {
          await driver.chord("Shift+Tab");
          steps.push({ focused: await driver.deepActive(), ...(await step(driver, "s", `k${String(index)}`, direction)) });
        }
        return steps;
      };
      return { ltr: await walk("ltr"), rtl: await walk("rtl") };
    },
    expected: ((): unknown => {
      const order = [...ids("k", 12), ...ids("k", 11).reverse()];
      const steps = order.map((focused) => ({ focused, inside: true, clear: true, fades: true }));
      return { ltr: steps, rtl: steps };
    })(),
  },
  {
    // Plant: the synchronous flag around the module's own scroll write (its scroll event comes a frame later, so the
    // suppression is dropped at once; R-06, PLAN-A11Y-SECURITY-1-001).
    name: "US1-13: a focused button wider than the box less two fades suppresses the covering fade over the following frames, and the fade returns on a wheel scroll, when focus leaves it and after an arrow key on the box; the forced-colours line follows it (FR-001, SC-001)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", `${links("k", 6)}<button id="wide" class="wide" type="button">wide</button>${links("m", 6)}`, ' label="Filters"', ' data-ground="canvas"')}`);
      await driver.tabWalk("before", "k5");
      await driver.chord("Tab");
      const focused = { active: await driver.deepActive(), ...(await fallbackState(driver)) };
      const ringStart = (await driver.box("wide")).x - room - (await driver.box("s", ".region-box")).x;
      await driver.wheel("s", 30);
      const wheeled = await fallbackState(driver);
      await driver.chord("Shift+Tab");
      await driver.chord("Tab");
      const again = await fallbackState(driver);
      await driver.chord("Tab");
      const left = { active: await driver.deepActive(), fades: (await fallbackState(driver)).fades };
      await driver.tabWalk("before", "wide");
      const before7 = (await fallbackState(driver)).fades;
      await driver.tabWalk("wide", "s >> div.region-box", true);
      await driver.chord("ArrowRight");
      const arrowed = (await fallbackState(driver)).fades;
      await driver.forcedColors("active", "light");
      await driver.tabWalk("before", "wide");
      const forcedSuppressed = [await driver.computedOf({ id: "s", inner: ".region-edge.start" }, "border-left-width"), await driver.computedOf({ id: "s", inner: ".region-edge.end" }, "border-right-width")];
      await driver.chord("Tab");
      const forcedBack = [await driver.computedOf({ id: "s", inner: ".region-edge.start" }, "border-left-width"), await driver.computedOf({ id: "s", inner: ".region-edge.end" }, "border-right-width")];
      await driver.forcedColors("none");
      return { focused, ringStart: Math.round(ringStart), wheeled: wheeled.fades, again, left, before7, arrowed, forced: { suppressed: forcedSuppressed, back: forcedBack } };
    },
    expected: {
      focused: { active: "wide", fades: ["end"], left: "solid" },
      ringStart: 0,
      wheeled: ["both"],
      again: { fades: ["end"], left: "solid" },
      left: { active: "m0", fades: ["both"] },
      before7: ["end"],
      arrowed: ["both"],
      forced: { suppressed: ["0px", "1px"], back: ["1px", "1px"] },
    },
  },
  {
    // Plant: clearance on every focusin (the clicked button is then moved).
    name: "US1-13: a button clicked half under the end fade is not moved beyond what a plain scroll box does and keeps the fade, while the same button focused by Tab is moved clear of it; a text input clicked there is moved clear (FR-001)",
    run: async (driver) => {
      const row = (prefix: string, last: string): string => `${links(prefix, 3)}${last}${links(`${prefix}x`, 8)}`;
      await page(
        driver,
        `${before}${strip("s", row("k", button("pb")))}<div id="twin" class="twin"><div class="twin-track">${row("t", button("tb"))}</div></div>${strip("s2", row("i", '<input id="ti" class="item" type="text" aria-label="Text">'))}`,
      );
      await driver.clickAt("pb", { x: 3, y: 12 });
      await driver.clickAt("tb", { x: 3, y: 12 });
      const clicked = { active: await driver.deepActive(), scroller: await driver.scrollLeft(boxOf("s")), twin: await driver.scrollLeft("twin"), fade: await shadowAttribute(driver, "s", "region-box", "data-fade") };
      await driver.tabWalk("before", "pb");
      const box = await driver.box("s", ".region-box");
      const tabbed = Math.round(box.x + box.width - ringOf(await driver.box("pb")).right);
      await driver.clickAt("ti", { x: 3, y: 12 });
      const box2 = await driver.box("s2", ".region-box");
      return { clicked, tabbed, input: { active: await driver.deepActive(), clearance: Math.round(box2.x + box2.width - ringOf(await driver.box("ti")).right) } };
    },
    expected: { clicked: { active: "tb", scroller: 0, twin: 0, fade: "end" }, tabbed: fade, input: { active: "ti", clearance: fade } },
  },
  {
    name: "US1-13 at a 20 px root font size: the clearance is the fade token's 40 px, and 24 px with --ocelle-scroller-fade-size: calc(1rem + 4px) on the element (R-17)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", links("k", 12))}${strip("c", links("c", 12))}`, "\n:root { font-size: 20px; }\n#c { --ocelle-scroller-fade-size: calc(1rem + 4px); }");
      const clearance = async (id: string, focused: string): Promise<number> => {
        await driver.tabWalk("before", focused);
        const box = await driver.box(id, ".region-box");
        return Math.round(box.x + box.width - ringOf(await driver.box(focused)).right);
      };
      return { root: await clearance("s", "k3"), calc: await clearance("c", "c3") };
    },
    expected: { root: 40, calc: 24 },
  },
  {
    // Plant: `:host([hidden])` removed.
    name: "US1-14: a hidden scroller has no box, no node and no tab stop, overflowing or fitting, beside a visible twin that is a tab stop (FR-002)",
    run: async (driver) => {
      await page(driver, `${before}${strip("hidden", '<span class="solid"></span>', ' label="Filters" hidden')}${strip("hiddenFit", '<span class="item">a</span>', ' label="Filters" hidden')}${strip("shown", '<span class="solid"></span>')}${after}`);
      const shown = (box: Box): unknown => ({ display: box.display, width: box.width });
      return {
        hidden: [shown(await driver.box("hidden")), await driver.ax("hidden")],
        hiddenFit: [shown(await driver.box("hiddenFit")), await driver.ax("hiddenFit")],
        shown: shown(await driver.box("shown")),
        walk: await driver.tabWalk("before", "after"),
      };
    },
    expected: {
      hidden: [{ display: "none", width: 0 }, []],
      hiddenFit: [{ display: "none", width: 0 }, []],
      shown: { display: "block", width: 300 },
      walk: ["shown >> div.region-box", "after"],
    },
  },
  {
    name: "US1-15: every kind of scroller of these scenarios, used with keys, scroll and focus, reports no console message (the fixture also records no CSP violation and no request outside its list) (FR-031)",
    run: async (driver) => {
      await page(
        driver,
        `${before}${strip("a", links("a", 3))}${strip("b", links("b", 12))}${strip("c", '<span class="solid"></span>', "", ' dir="rtl"')}${strip("d", links("d", 12), ' aria-label="Ready strip"')}`,
      );
      await focusBox(driver, "b");
      await driver.chord("ArrowRight");
      await driver.chord("Tab");
      await driver.setScrollLeft(boxOf("c"), -300);
      await driver.style("a", "inline-size", "100px");
      return { defined: await driver.box("a", ".region-box").then((box) => box.display), messages: await driver.messages() };
    },
    expected: { defined: "block", messages: [] },
  },
  {
    name: "US1 sheets: two scrollers adopt the shared sheets plus exactly one per-instance sheet each, hold no <style> element, and no shadow element has a style attribute after scrolling (FR-030, constitution IV)",
    run: async (driver) => {
      await page(driver, `${strip("a", '<span class="solid"></span>')}${strip("b", links("b", 3))}`);
      await driver.setScrollLeft(boxOf("a"), 300);
      const styled = [...(await driver.elements("a")), ...(await driver.elements("b"))].filter((part) => "style" in part.attributes).length;
      return { sheets: await driver.sheets("ocelle-scroller"), styled };
    },
    // `static styles` is the element's own sheet and `overflowRegionStyles`: two shared, one per instance (R-05, R-13).
    expected: { sheets: { elements: 2, perRoot: [3], distinct: 4, styleElements: 0 }, styled: 0 },
  },
];

// ---------------------------------------------------------------------------------------------------------------
// Guards added after the green implementation, on paths no red scenario reached (the mutants of the module's
// lifecycle and focus code that survived the first mutation run; reviews/phase-2/plants.md § Guards). The surviving
// mutants are their proof that they can fail.

const wideRow = `${links("k", 6)}<button id="wide" class="wide" type="button">wide</button>${links("m", 6)}`;

export const scrollerGuards: readonly Scenario[] = [
  {
    name: "US1 guard: a label set by property on an overflowing scroller renames its group at once, and a blank one leaves a tab stop with no role (FR-010)",
    run: async (driver) => {
      await page(driver, strip("s", links("k", 12)));
      await driver.setProperty("s", "label", "Tags of WP-12");
      const renamed = await boxAttributes(driver, "s");
      await driver.setProperty("s", "label", " ");
      return { renamed, blank: await boxAttributes(driver, "s") };
    },
    expected: { renamed: { tabindex: "0", role: "group", "aria-label": "Tags of WP-12" }, blank: { tabindex: "0", role: null, "aria-label": null } },
  },
  {
    name: "US1 guard: overflow that ends while focus is outside the strip moves no focus, beside a twin whose focused box hands focus over (FR-004)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", '<span id="w" class="solid"></span><a id="k" class="item" href="#k">k</a>')}`);
      await driver.clickAt("before", { x: 2, y: 2 });
      await driver.style("w", "inline-size", "100px");
      const outside = await driver.deepActive();
      await driver.style("w", "inline-size", "1000px");
      await focusBox(driver, "s");
      await driver.style("w", "inline-size", "100px");
      return { outside, inside: await driver.deepActive() };
    },
    expected: { outside: "before", inside: "k" },
  },
  {
    name: "US1 guard: focusing the box by keyboard does not scroll it, while a link focused by keyboard is cleared (FR-001)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", links("k", 12))}`);
      await driver.setScrollLeft(boxOf("s"), 300);
      await focusBox(driver, "s");
      const box = await driver.scrollLeft(boxOf("s"));
      await driver.chord("Tab");
      return { box, link: await driver.scrollLeft(boxOf("s")) };
    },
    // Link 0's ring box ends at 90 px: clearing it from 300 px scrolls to the start.
    expected: { box: 300, link: 0 },
  },
  {
    name: "US1 guard: the fallback's suppression ends when focus leaves the strip, holds over a scroll of 1 px and ends on one of 2 px, and a wide button focused by script where it already sits is suppressed at once (FR-001, R-06)",
    run: async (driver) => {
      await page(driver, `${before}${strip("s", wideRow, ' label="Filters"', ' data-ground="canvas"')}`);
      const fade = (): Promise<string | null> => shadowAttribute(driver, "s", "region-box", "data-fade");
      await driver.tabWalk("before", "wide");
      const focused = await fade();
      await driver.clickAt("before", { x: 2, y: 2 });
      const left = await fade();
      await driver.tabWalk("before", "wide");
      await driver.wheel("s", 1);
      const oneDifferent = [await driver.scrollLeft(boxOf("s")), await fade()];
      await driver.wheel("s", 1);
      const twoDifferent = [await driver.scrollLeft(boxOf("s")), await fade()];
      await driver.tabWalk("before", "s >> div.region-box");
      await driver.setScrollLeft(boxOf("s"), 504);
      await driver.focusTarget("wide");
      return { focused, left, oneDifferent, twoDifferent, script: [await driver.scrollLeft(boxOf("s")), await fade()] };
    },
    // The wide button's ring box starts at 504 px of the content (six links of 84 px); aligned there it is suppressed
    // at the start ("end" only); a wheel of 1 px leaves the box within 1 px of where the module wrote it.
    expected: { focused: "end", left: "both", oneDifferent: [505, "end"], twoDifferent: [506, "both"], script: [504, "end"] },
  },
];
