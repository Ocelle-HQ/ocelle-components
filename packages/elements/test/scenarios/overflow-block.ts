// The shared bodies of the overflow-region module's block-axis option (019 FR-018; contracts/overflow-region-block-axis.md
// § Tests; research.md R-18; spike-2 and its addendum; tasks.md T079), run against the test-only block host
// (test/fixtures/overflow-host-block.ts) in process (test/overflow-region-block.test.ts, mutated) and on the strict-CSP
// fixture with its bundled file (test/browser/overflow-region-block.test.ts). Expected values are written by hand from
// the contract: the 5 px ring room (`--ocelle-focus-offset` 2 px + `--ocelle-focus-width` 3 px), the 32 px fade depth
// (`--ocelle-scroller-fade-size`, 2rem), the 40 px step, the 1 px tolerance and the room rule's factor of two.
//
// The host's content is font-independent but for the caption stand-in: a 27 px pinned box (`.pin`, holding one link),
// then rows of 30 px, each holding an 80 × 20 px link 5 px below the row's top, so a link's ring box is its row. Twenty
// rows in a 300 px bound overflow in the block axis by 5 + 27 + 600 + 5 − 300 = 337 px (content 637 px); rows 600 px wide overflow a
// 320 px host in the inline axis by 600 + 10 − 320 = 290 px. Every "does not" is paired with the positive outcome it
// guards in the same body.
import type { Driver, ElementTarget } from "./driver.ts";
import type { Scenario } from "./icon.ts";
import { readOnce } from "./scroller.ts";

/** The ring room and the fade depth at a 16 px root. */
const room = 5;
const depth = 32;

const rules = [
  "ocelle-test-overflow-block, ocelle-test-overflow-plain { font-family: sans-serif; font-size: 16px; line-height: 24px; }",
  '[data-width="320"] { inline-size: 320px; }',
  '[data-bound="300"] { max-block-size: 300px; }',
  '[data-bound="100"] { max-block-size: 100px; }',
  '[data-bound="90"] { max-block-size: 90px; }',
  ".pin { position: sticky; inset-block-start: calc(-1 * (var(--ocelle-focus-offset) + var(--ocelle-focus-width))); block-size: 27px; background-color: var(--ocelle-color-canvas); }",
  ".pin > a { display: inline-block; inline-size: 40px; block-size: 17px; }",
  ".row { block-size: 30px; }",
  ".row > a { display: inline-block; inline-size: 80px; block-size: 20px; margin-block-start: 5px; }",
  '[data-rows="wide"] .row, [data-rows="wide"] .pin { inline-size: 600px; }',
  // The caption stand-in keeps the data table caption's block-end padding (`--ocelle-space-2`), so a link on its last
  // line has its ring room above the pinned box.
  ".cap { inline-size: 250px; padding-block-end: var(--ocelle-space-2); }",
].join("\n");

interface HostOptions {
  readonly rows?: number;
  readonly wide?: boolean;
  readonly cap?: boolean;
  readonly bound?: number;
  readonly narrow?: boolean;
  readonly axis?: boolean;
  /** The host element: the block host, or the same host built without the option (T025). */
  readonly tag?: "ocelle-test-overflow-block" | "ocelle-test-overflow-plain";
}

/** A block host `id` labelled "Rows": an optional caption block, the pinned box, then `rows` rows of links. */
function host(id: string, options: HostOptions = {}): string {
  const { rows = 20, wide = false, cap = false, bound, narrow = false, axis = true, tag = "ocelle-test-overflow-block" } = options;
  const attributes = [`id="${id}"`, 'label="Rows"', axis ? "block-axis" : "", bound === undefined ? "" : `data-bound="${String(bound)}"`, narrow ? 'data-width="320"' : "", wide ? 'data-rows="wide"' : ""].filter((each) => each !== "").join(" ");
  const caption = cap ? `<div class="cap" id="${id}-cap"><span id="${id}-ct">Work packages<br>by <a id="${id}-cl" href="#c">owner</a></span></div>` : "";
  const body = Array.from({ length: rows }, (_, index) => `<div class="row"><a id="${id}-r${String(index)}" href="#r">r${String(index)}</a></div>`).join("");
  return `<${tag} ${attributes}>${caption}<div class="pin" id="${id}-pin"><a id="${id}-pl" href="#p">pin</a></div>${body}</${tag}>`;
}

async function page(driver: Driver, markup: string, width = 1280): Promise<void> {
  await driver.viewport(width, 800);
  await driver.mount(`<button id="before" type="button">before</button>${markup}<button id="after" type="button">after</button>`);
  await driver.rules(rules);
}

const boxOf = (id: string): ElementTarget => ({ id, inner: ".region-box" });

/** A DOM property of a target, as a number. */
async function prop(driver: Driver, target: ElementTarget, name: string): Promise<number> {
  return Number(await readOnce(driver, target, name));
}

/** An attribute of the host's `.region-box`, or null. */
async function boxAttribute(driver: Driver, id: string, name: string): Promise<string | null> {
  const part = (await driver.elements(id)).find((each) => each.attributes.class?.split(" ").includes("region-box"));
  return part?.attributes[name] ?? null;
}

/** The box's state: tab stop, role, name, the block axis and block-end fade attributes, `overflow-y`. */
async function state(driver: Driver, id: string): Promise<Record<string, string | null>> {
  return {
    tabindex: await boxAttribute(driver, id, "tabindex"),
    role: await boxAttribute(driver, id, "role"),
    name: await boxAttribute(driver, id, "aria-label"),
    axis: await boxAttribute(driver, id, "data-axis"),
    blockFade: await boxAttribute(driver, id, "data-block-fade"),
    overflowY: await driver.computed(id, "overflow-y", ".region-box"),
  };
}

/** The block-axis scrollbar's room: the box's `offsetWidth − clientWidth`. */
async function scrollbarRoom(driver: Driver, id: string): Promise<number> {
  return (await prop(driver, boxOf(id), "offsetWidth")) - (await prop(driver, boxOf(id), "clientWidth"));
}

/** The layers of a computed list value (`mask-size`, `mask-composite`), split at top-level commas. */
export function layers(value: string): string[] {
  return value.split(/,\s*(?![^(]*\))/).map((each) => each.trim());
}

/** A ring box: the border box of the element with `id` grown by the ring room on each side. */
async function ringOf(driver: Driver, id: string): Promise<{ top: number; bottom: number; left: number; right: number }> {
  const box = await driver.box(id);
  return { top: box.y - room, bottom: box.y + box.height + room, left: box.x - room, right: box.x + box.width + room };
}

/** The block-end fade's block-start edge in the viewport: the box's client block-end edge less the fade depth. */
async function fadeTop(driver: Driver, id: string): Promise<number> {
  const box = await driver.box(id, ".region-box");
  const clientHeight = await prop(driver, boxOf(id), "clientHeight");
  const edge = await driver.box(id, ".region-edge.block-end");
  return box.y + clientHeight - edge.height;
}

/** Whether `a` is within 0.5 px of `b` (inclusive). */
const near = (a: number, b: number): boolean => Math.abs(a - b) <= 0.5;

/** The id (or local name) of the element `document.elementFromPoint` returns at the centre of the element with `id`. */
export async function hitAtCentre(driver: Driver, id: string): Promise<string> {
  await driver.module(
    `const element = document.getElementById(${JSON.stringify(id)});
const rect = element.getBoundingClientRect();
const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
element.setAttribute("data-hit", hit === null ? "" : hit.id || hit.localName);`,
  );
  return (await driver.attribute(id, "data-hit")) ?? "";
}

/** A frame record of the box's `scrollTop` around `act`: whether it never moved back towards a value it left. */
async function noJumpBack(driver: Driver, id: string, act: () => Promise<void>): Promise<{ readonly monotone: boolean; readonly moved: boolean }> {
  const recorder = await driver.frameRecord(boxOf(id), { property: "scrollTop" });
  await act();
  const values = (await recorder.stop()).filter((each) => !each.startsWith("keydown")).map((each) => Number(each.replace(/^resize: /, "")));
  const first = values[0] ?? 0;
  const last = values.at(-1) ?? 0;
  const sign = Math.sign(last - first);
  const monotone = values.every((value, index) => index === 0 || Math.sign(value - (values[index - 1] ?? value)) * sign >= 0);
  return { monotone, moved: last !== first };
}

/** Where the pinned box is: at the box's client block-start edge, at its at-rest offset, or elsewhere (its offset). */
async function pinAt(driver: Driver, id: string, rest: number): Promise<string> {
  const offset = (await driver.box(`${id}-pin`)).y - (await driver.box(id, ".region-box")).y;
  if (near(offset, 0)) return "client start";
  return near(offset, rest) ? "rest" : `at ${String(offset)}`;
}

/** Where `scrollTop` is in its range: the start (0), the end (the range) or the middle. */
async function position(driver: Driver, id: string): Promise<string> {
  const top = await driver.scrollTop(boxOf(id));
  const range = (await prop(driver, boxOf(id), "scrollHeight")) - (await prop(driver, boxOf(id), "clientHeight"));
  if (top === 0) return "start";
  return Math.abs(range - top) <= 1 ? "end" : "middle";
}

/** Focuses the host's box by keyboard: the button before it, then Tab. */
async function tabToBox(driver: Driver): Promise<void> {
  await driver.focus("before");
  await driver.pressTab();
}

/**
 * Q-M1 (b), T083: focus entering a box handed back before the module's observer measures it. Tabs to the host's box
 * (keyboard modality), scrolls it to 122 so that row 3's link (content 127 to 147) lies wholly inside the client area
 * but under the pinned box (client 0 to 27), lets the module go of the box (`current="none"`), then in one module
 * script, so in one task and before the module's `ResizeObserver` measures the box again: hands the box back, awaits
 * the host's update, focuses row 3's link and records whether it matches `:focus-visible`. Read after `settle`.
 * Why row 3 at 122 and not row 0 at 200 (tasks.md T083): a link wholly outside the client area is centred by
 * Chromium's own focus scroll, which clears it of the pinned box with no block clearance at all (measured: the body
 * passed against the green source in both halves); a link wholly inside it is not scrolled by Chromium (the option-off
 * focus guard below, `change: 0` at the same position), so only the module's block clearance can move it.
 */
async function handedBack(driver: Driver, id: string, options: HostOptions): Promise<Record<string, unknown>> {
  await page(driver, host(id, options));
  await tabToBox(driver);
  await driver.setScrollTop(boxOf(id), 122);
  const link = `${id}-r3`;
  const pinEnd = async (): Promise<number> => {
    const pin = await driver.box(`${id}-pin`);
    return pin.y + pin.height;
  };
  const underPin = (await ringOf(driver, link)).top < (await pinEnd()) - 0.5;
  await driver.setAttribute(id, "current", "none");
  await driver.settle();
  const letGo = await boxAttribute(driver, id, "data-axis");
  await driver.module(
    `const host = document.getElementById(${JSON.stringify(id)});
host.removeAttribute("current");
await host.updateComplete;
const link = document.getElementById(${JSON.stringify(link)});
link.focus();
link.setAttribute("data-visible", String(link.matches(":focus-visible")));`,
  );
  await driver.settle();
  const ring = await ringOf(driver, link);
  const box = await driver.box(id, ".region-box");
  const fadeShows = (await boxAttribute(driver, id, "data-block-fade")) === "end";
  const bottom = fadeShows ? await fadeTop(driver, id) : box.y + (await prop(driver, boxOf(id), "clientHeight"));
  return {
    underPin,
    letGo,
    focusVisible: await driver.attribute(link, "data-visible"),
    focused: await driver.focused(),
    belowPin: ring.top >= (await pinEnd()) - 0.5,
    clearOfEnd: ring.bottom <= bottom + 0.5,
    scrolledBack: (await driver.scrollTop(boxOf(id))) < 122,
  };
}

export const overflowBlockScenarios: readonly Scenario[] = [
  {
    // Plants: `data-axis` never set; `overflowing` read over the inline axis only.
    name: "block axis: overflow in the block axis only, the inline axis only and both gives the tab stop, role and name; none when neither (FR-018; contract § Effects, Overflowing, Scrolling)",
    run: async (driver) => {
      await page(driver, `${host("n", { rows: 3 })}${host("b", { bound: 300 })}${host("i", { rows: 3, wide: true, narrow: true })}${host("w", { bound: 300, wide: true, narrow: true })}`);
      return {
        neither: await state(driver, "n"),
        block: { ...(await state(driver, "b")), gutter: await driver.computed("b", "scrollbar-gutter", ".region-box"), room: await scrollbarRoom(driver, "b") },
        inline: await state(driver, "i"),
        both: await state(driver, "w"),
      };
    },
    expected: {
      neither: { tabindex: null, role: null, name: null, axis: null, blockFade: null, overflowY: "hidden" },
      block: { tabindex: "0", role: "group", name: "Rows", axis: "both", blockFade: "end", overflowY: "auto", gutter: "auto", room: 0 },
      inline: { tabindex: "0", role: "group", name: "Rows", axis: null, blockFade: null, overflowY: "hidden" },
      both: { tabindex: "0", role: "group", name: "Rows", axis: "both", blockFade: "end", overflowY: "auto" },
    },
  },
  {
    // Plants: ArrowDown not handled; a modified ArrowDown handled; a descendant's ArrowDown handled.
    name: "block axis: ArrowDown and ArrowUp scroll the focused box by the 40 px step with the default prevented; a modified ArrowDown and an ArrowDown from a descendant are not handled (contract § Effects, Arrow keys)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 300 }));
      await tabToBox(driver);
      const steps: unknown[] = [{ active: await driver.deepActive() }];
      for (const key of ["ArrowDown", "ArrowDown", "ArrowUp"]) {
        await driver.chord(key);
        steps.push({ key, prevented: await driver.lastKeyPrevented() });
      }
      // Read before the modified keys: the module does not handle those, and the browser's own default may scroll the box.
      steps.push({ scrollTop: await driver.scrollTop(boxOf("b")) });
      for (const key of ["Shift+ArrowDown", "Alt+ArrowDown"]) {
        await driver.chord(key);
        steps.push({ key, prevented: await driver.lastKeyPrevented() });
      }
      await driver.focus("b-r3");
      await driver.chord("ArrowDown");
      steps.push({ descendant: await driver.lastKeyPrevented() });
      return steps;
    },
    expected: [
      { active: "b >> div.region-box" },
      { key: "ArrowDown", prevented: true },
      { key: "ArrowDown", prevented: true },
      { key: "ArrowUp", prevented: true },
      { scrollTop: 40 },
      { key: "Shift+ArrowDown", prevented: false },
      { key: "Alt+ArrowDown", prevented: false },
      { descendant: false },
    ],
  },
  {
    // Re-analysis G1 (a), spike-2 § 10, Q-2 (a). Plants: the module preventing a key the browser keeps; the box
    // without `overflow-y: auto`; the pinned box at `inset-block-start: 0`.
    name: "block axis: PageDown, PageUp, End, Home, Space and Shift+Space are left to the browser and scroll the focused box in the key's direction; the block-end fade follows and the pinned box stays pinned; ArrowDown is prevented (G1 (a))",
    run: async (driver) => {
      await page(driver, host("b", { bound: 300 }));
      const rest = (await driver.box("b-pin")).y - (await driver.box("b", ".region-box")).y;
      await tabToBox(driver);
      const keys: { readonly key: string; readonly shift?: boolean }[] = [{ key: "PageDown" }, { key: "PageUp" }, { key: "End" }, { key: "Home" }, { key: " " }, { key: " ", shift: true }];
      const steps: unknown[] = [];
      for (const { key, shift } of keys) {
        const from = await driver.scrollTop(boxOf("b"));
        await driver.inputPress(key, { shift: shift === true });
        await driver.frames(30);
        const to = await driver.scrollTop(boxOf("b"));
        steps.push({
          key: shift === true ? `Shift+${key}` : key,
          prevented: await driver.lastKeyPrevented(),
          direction: to > from ? "down" : to < from ? "up" : "none",
          position: await position(driver, "b"),
          blockFade: await boxAttribute(driver, "b", "data-block-fade"),
          pin: await pinAt(driver, "b", rest),
        });
      }
      await driver.chord("ArrowDown");
      steps.push({ key: "ArrowDown", prevented: await driver.lastKeyPrevented(), scrollTop: await driver.scrollTop(boxOf("b")), active: await driver.deepActive() });
      return { rest, steps };
    },
    expected: {
      rest: room,
      steps: [
        { key: "PageDown", prevented: false, direction: "down", position: "middle", blockFade: "end", pin: "client start" },
        { key: "PageUp", prevented: false, direction: "up", position: "start", blockFade: "end", pin: "rest" },
        { key: "End", prevented: false, direction: "down", position: "end", blockFade: null, pin: "client start" },
        { key: "Home", prevented: false, direction: "up", position: "start", blockFade: "end", pin: "rest" },
        { key: " ", prevented: false, direction: "down", position: "middle", blockFade: "end", pin: "client start" },
        { key: "Shift+ ", prevented: false, direction: "up", position: "start", blockFade: "end", pin: "rest" },
        { key: "ArrowDown", prevented: true, scrollTop: 40, active: "b >> div.region-box" },
      ],
    },
  },
  {
    // Plants: the block clearance skipped, or measured without the pinned box; a block scroll for focus inside it.
    name: "block axis: a link scrolled out above the pinned box is cleared below it after pressTab, inside the box and clear of the block-end fade; focus inside the pinned box does not scroll the box (contract § Effects, Focus clearance)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 300 }));
      await tabToBox(driver);
      await driver.setScrollTop(boxOf("b"), 200);
      await driver.pressTab();
      const pinned = { focused: await driver.focused(), scrollTop: await driver.scrollTop(boxOf("b")) };
      await driver.pressTab();
      const ring = await ringOf(driver, "b-r0");
      const pin = await driver.box("b-pin");
      const box = await driver.box("b", ".region-box");
      const fadeShows = (await boxAttribute(driver, "b", "data-block-fade")) === "end";
      const bottom = fadeShows ? await fadeTop(driver, "b") : box.y + (await prop(driver, boxOf("b"), "clientHeight"));
      return {
        pinned,
        focused: await driver.focused(),
        belowPin: ring.top >= pin.y + pin.height - 0.5,
        clearOfEnd: ring.bottom <= bottom + 0.5,
        scrolledBack: (await driver.scrollTop(boxOf("b"))) < 200,
      };
    },
    expected: { pinned: { focused: "b-pl", scrollTop: 200 }, focused: "b-r0", belowPin: true, clearOfEnd: true, scrolledBack: true },
  },
  {
    // Plant: the block clearance ignoring the fade (a link in the faded rows left under the fade).
    name: "block axis: a link in the faded rows tabbed to is scrolled clear of the block-end fade, the fade still showing (Q-I4)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 300 }));
      await tabToBox(driver);
      const walk: string[] = [];
      // The pin link, then r0 … r7: r7's row (content 242 to 272) lies under the fade at rest (268 to 300).
      for (let index = 0; index < 9; index++) {
        await driver.pressTab();
        walk.push((await driver.focused()) ?? "body");
      }
      const ring = await ringOf(driver, "b-r7");
      return {
        last: walk.at(-1),
        blockFade: await boxAttribute(driver, "b", "data-block-fade"),
        clear: ring.bottom <= (await fadeTop(driver, "b")) + 0.5,
        below: ring.top >= (await driver.box("b-pin")).y + 27 - 0.5,
      };
    },
    expected: { last: "b-r7", blockFade: "end", clear: true, below: true },
  },
  {
    // Plant: the handover skipped while the block axis still overflowed in the old state.
    name: "block axis: when the box stops overflowing in both axes while it has focus, focus moves to its first focusable slotted element (contract § Effects, Focus handover)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 300 }));
      await tabToBox(driver);
      const before = await driver.deepActive();
      await driver.setAttribute("b", "data-bound", null);
      return { before, after: await driver.deepActive(), state: await state(driver, "b") };
    },
    expected: {
      before: "b >> div.region-box",
      after: "b-pl",
      state: { tabindex: null, role: null, name: null, axis: null, blockFade: null, overflowY: "hidden" },
    },
  },
  {
    // Spike-2 Q-3 (c), Q-A1 (a). Plants: `data-axis` written whatever the block overflow; never removed when the option
    // turns off; `scrollbar-gutter: stable` added.
    name: "block axis: `data-axis` follows the block overflow and the option at run time: absent while the box overflows inline only, `both` with `overflow-y: auto`, no gutter and four mask layers once bounded, and gone when the bound is lifted or the option turned off (Q-3 (c), Q-A1 (a))",
    run: async (driver) => {
      await page(driver, host("i", { wide: true, narrow: true }));
      const read = async (): Promise<unknown> => ({
        axis: await boxAttribute(driver, "i", "data-axis"),
        overflowY: await driver.computed("i", "overflow-y", ".region-box"),
        gutter: await driver.computed("i", "scrollbar-gutter", ".region-box"),
        room: await scrollbarRoom(driver, "i"),
        layers: layers(await driver.computed("i", "mask-size", ".region-box")).length,
      });
      const steps = [await read()];
      await driver.setAttribute("i", "data-bound", "300");
      steps.push(await read());
      await driver.setAttribute("i", "data-bound", null);
      steps.push(await read());
      await driver.setAttribute("i", "data-bound", "300");
      await driver.setAttribute("i", "block-axis", null);
      steps.push(await read());
      await driver.setAttribute("i", "block-axis", "");
      steps.push(await read());
      return steps;
    },
    expected: [
      { axis: null, overflowY: "hidden", gutter: "auto", room: 0, layers: 2 },
      { axis: "both", overflowY: "auto", gutter: "auto", room: 0, layers: 4 },
      { axis: null, overflowY: "hidden", gutter: "auto", room: 0, layers: 2 },
      { axis: null, overflowY: "hidden", gutter: "auto", room: 0, layers: 2 },
      { axis: "both", overflowY: "auto", gutter: "auto", room: 0, layers: 4 },
    ],
  },
  {
    // Spike-2 § Addendum A1, A2; Q-A1 (a). Plants: `scrollbar-gutter: stable` (RTL left 14 px off its start).
    name: "block axis under dir=rtl: overflowing inline only, `scrollLeft` 0 and `data-fade=end` at rest with the first row at the track's start, paired with the block-bounded host carrying `data-axis=both` at `scrollLeft` 0; the bound set and lifted keeps `scrollLeft` 0 and `data-fade=end` (Q-3 (c))",
    run: async (driver) => {
      await page(driver, `<div dir="rtl">${host("i", { wide: true, narrow: true })}${host("w", { wide: true, narrow: true, bound: 300 })}</div>`);
      const read = async (id: string): Promise<Record<string, unknown>> => ({ axis: await boxAttribute(driver, id, "data-axis"), scrollLeft: await driver.scrollLeft(boxOf(id)), fade: await boxAttribute(driver, id, "data-fade") });
      const track = await driver.box("i", ".region-track");
      const row = await driver.box("i-r0");
      const inline = { ...(await read("i")), rowAtStart: near(row.x + row.width, track.x + track.width - room) };
      const bounded = await read("w");
      const changes: unknown[] = [];
      await driver.setAttribute("i", "data-bound", "300");
      changes.push(await read("i"));
      await driver.setAttribute("i", "data-bound", null);
      changes.push(await read("i"));
      return { inline, bounded, changes };
    },
    expected: {
      inline: { axis: null, scrollLeft: 0, fade: "end", rowAtStart: true },
      bounded: { axis: "both", scrollLeft: 0, fade: "end" },
      changes: [
        { axis: "both", scrollLeft: 0, fade: "end" },
        { axis: null, scrollLeft: 0, fade: "end" },
      ],
    },
  },
  {
    // Spike-2 § Addendum A1; Q-A1 (a). Plant: `scrollbar-gutter: stable` (the far end 15 px short under hidden scrollbars).
    name: "block axis overflowing both ways, in LTR and under dir=rtl: the inline range is `scrollWidth − clientWidth` (290 px), and at its far end `data-fade=start` with the last column's inline end inside the client area within 0.5 px (Q-A1 (a))",
    run: async (driver) => {
      await page(driver, `${host("l", { wide: true, narrow: true, bound: 300 })}<div dir="rtl">${host("r", { wide: true, narrow: true, bound: 300 })}</div>`);
      const far = async (id: string, rtl: boolean): Promise<unknown> => {
        const range = (await prop(driver, boxOf(id), "scrollWidth")) - (await prop(driver, boxOf(id), "clientWidth"));
        await driver.setScrollLeft(boxOf(id), rtl ? -range : range);
        const box = await driver.box(id, ".region-box");
        const clientWidth = await prop(driver, boxOf(id), "clientWidth");
        const row = await driver.box(`${id}-r0`);
        return {
          axis: await boxAttribute(driver, id, "data-axis"),
          range,
          reached: Math.abs(await driver.scrollLeft(boxOf(id))),
          fade: await boxAttribute(driver, id, "data-fade"),
          lastInside: rtl ? row.x >= box.x + (box.width - clientWidth) - 0.5 : row.x + row.width <= box.x + clientWidth + 0.5,
        };
      };
      return { ltr: await far("l", false), rtl: await far("r", true) };
    },
    expected: {
      ltr: { axis: "both", range: 290, reached: 290, fade: "start", lastInside: true },
      rtl: { axis: "both", range: 290, reached: 290, fade: "start", lastInside: true },
    },
  },
  {
    // Spike-2 § 3. Plants: the block-scrollbar layer dropped; the two fade layers composited by `add`.
    name: "block axis mask figures, with an inline fade and the block-end fade together: four `mask-size` layers top first the block scrollbar's (0px 100% under hidden scrollbars), the inline scrollbar's and the two fades' at the client size, `mask-composite` add, add, intersect, add, in LTR and RTL; 009's two layers once the bound is lifted",
    run: async (driver) => {
      await page(driver, `${host("l", { wide: true, narrow: true, bound: 300 })}<div dir="rtl">${host("r", { wide: true, narrow: true, bound: 300 })}</div>`);
      const read = async (id: string): Promise<unknown> => ({
        size: layers(await driver.computed(id, "mask-size", ".region-box")),
        composite: layers(await driver.computed(id, "mask-composite", ".region-box")),
        first: layers(await driver.computed(id, "mask-position", ".region-box"))[0],
        fades: [await boxAttribute(driver, id, "data-fade"), await boxAttribute(driver, id, "data-block-fade")],
      });
      const bounded = { ltr: await read("l"), rtl: await read("r") };
      await driver.setAttribute("l", "data-bound", null);
      const lifted = { size: layers(await driver.computed("l", "mask-size", ".region-box")), composite: layers(await driver.computed("l", "mask-composite", ".region-box")) };
      return { bounded, lifted };
    },
    expected: {
      bounded: {
        ltr: { size: ["0px 100%", "100% 0px", "320px 300px", "320px 300px"], composite: ["add", "add", "intersect", "add"], first: "100% 0%", fades: ["end", "end"] },
        rtl: { size: ["0px 100%", "100% 0px", "320px 300px", "320px 300px"], composite: ["add", "add", "intersect", "add"], first: "0% 0%", fades: ["end", "end"] },
      },
      lifted: { size: ["100% 637px", "100% 0px"], composite: ["add", "add"] },
    },
  },
  {
    // Q-I4, Q-I6 (a), Q-4 (a). Plants: the block-end fade never drawn; the room rule dropped; the edge laid out full
    // width outside forced colours.
    name: "block-end fade: `data-block-fade=end` at rest with content below and its block-start edge at or below the pinned box's block-end edge, absent at the block end and under the room rule (a 90 px bound: 58 px < 64 px below the pinned box) although content is below; `.region-edge.block-end` 0 px wide and 32 px deep (Q-I4, Q-4 (a))",
    run: async (driver) => {
      await page(driver, `${host("b", { bound: 300 })}${host("s", { bound: 90 })}`);
      const pin = await driver.box("b-pin");
      const edge = await driver.box("b", ".region-edge.block-end");
      const rest = { blockFade: await boxAttribute(driver, "b", "data-block-fade"), belowPin: (await fadeTop(driver, "b")) >= pin.y + pin.height - 0.5, edge: { width: edge.width, height: edge.height } };
      await driver.setScrollTop(boxOf("b"), 1000);
      const end = { blockFade: await boxAttribute(driver, "b", "data-block-fade"), position: await position(driver, "b") };
      await driver.focusTarget(boxOf("b"));
      await driver.chord("ArrowUp");
      const back = await boxAttribute(driver, "b", "data-block-fade");
      const below = (await prop(driver, boxOf("s"), "scrollHeight")) - (await prop(driver, boxOf("s"), "clientHeight"));
      const roomRule = { axis: await boxAttribute(driver, "s", "data-axis"), contentBelow: below > 1, blockFade: await boxAttribute(driver, "s", "data-block-fade") };
      return { rest, end, back, roomRule };
    },
    expected: {
      rest: { blockFade: "end", belowPin: true, edge: { width: 0, height: depth } },
      end: { blockFade: null, position: "end" },
      back: "end",
      roomRule: { axis: "both", contentBelow: true, blockFade: null },
    },
  },
  {
    // Q-I4, Q-4 (a). Plant: the forced-colours block-end line removed.
    name: "block-end fade in forced colours: no mask, `.region-edge.block-end` a `CanvasText` block-end border wider than 0 and as wide as the frame while the fade shows, none at the block end (Q-I4)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 300 }));
      await driver.forcedColors("active", "light");
      const canvasText = await driver.resolveColour("CanvasText");
      const read = async (): Promise<unknown> => {
        const edge = await driver.box("b", ".region-edge.block-end");
        const frame = await driver.box("b", ".region-frame");
        return {
          mask: await driver.computed("b", "mask-image", ".region-box"),
          style: await driver.shadowComputed("b", ".region-edge.block-end", "border-block-end-style"),
          colourIsCanvasText: (await driver.shadowComputed("b", ".region-edge.block-end", "border-block-end-color")) === canvasText,
          widthAboveZero: Number.parseFloat(await driver.shadowComputed("b", ".region-edge.block-end", "border-block-end-width")) > 0,
          fullWidth: near(edge.width, frame.width),
        };
      };
      const rest = await read();
      await driver.setScrollTop(boxOf("b"), 1000);
      const end = { style: await driver.shadowComputed("b", ".region-edge.block-end", "border-block-end-style"), blockFade: await boxAttribute(driver, "b", "data-block-fade") };
      await driver.forcedColors("none");
      return { rest, end };
    },
    expected: {
      rest: { mask: "none", style: "solid", colourIsCanvasText: true, widthAboveZero: true, fullWidth: true },
      end: { style: "none", blockFade: null },
    },
  },
  {
    // Re-analysis A1 (c), decided (a): `pinnedEnd` the current edge. Plant: `pinnedEnd` read as the box's client start
    // plus the pinned box's block size.
    name: "block-end fade with a two-line caption block above the pinned box at 320 px: in a 100 px bound no fade at rest (less than twice the depth below the pinned box's current edge), then the fade past the caption; in a 300 px bound the fade at rest; the fade's edge never above the pinned box (A1 (c))",
    run: async (driver) => {
      await page(driver, `${host("s", { cap: true, narrow: true, bound: 100 })}${host("t", { cap: true, narrow: true, bound: 300 })}`, 320);
      const lines = new Set((await driver.lines("s-ct")).filter((each) => each.width > 0).map((each) => Math.round(each.y))).size;
      const pinEnd = async (id: string): Promise<number> => {
        const pin = await driver.box(`${id}-pin`);
        return pin.y + pin.height;
      };
      const box = await driver.box("s", ".region-box");
      const space = box.y + (await prop(driver, boxOf("s"), "clientHeight")) - (await pinEnd("s"));
      const atRest = { lessThanTwice: space < 2 * depth, contentBelow: (await prop(driver, boxOf("s"), "scrollHeight")) > 101, blockFade: await boxAttribute(driver, "s", "data-block-fade") };
      const cap = await driver.box("s-cap");
      await driver.setScrollTop(boxOf("s"), cap.height + 2 * room);
      const past = { pinned: near((await driver.box("s-pin")).y, box.y), blockFade: await boxAttribute(driver, "s", "data-block-fade"), belowPin: (await fadeTop(driver, "s")) >= (await pinEnd("s")) - 0.5 };
      const large = { blockFade: await boxAttribute(driver, "t", "data-block-fade"), belowPin: (await fadeTop(driver, "t")) >= (await pinEnd("t")) - 0.5 };
      return { lines, atRest, past, large };
    },
    expected: {
      lines: 2,
      atRest: { lessThanTwice: true, contentBelow: true, blockFade: null },
      past: { pinned: true, blockFade: "end", belowPin: true },
      large: { blockFade: "end", belowPin: true },
    },
  },
  {
    // A1 (c) decided (a). Plant: the block clearance measured from the client start (the link left under the pinned box).
    name: "block clearance with a caption block: a link just below the pinned box, tabbed to at rest and past the caption in a 100 px bound, has its ring box at or below the pinned box's current block-end edge within 0.5 px (A1 (c))",
    run: async (driver) => {
      await page(driver, host("s", { cap: true, narrow: true, bound: 100 }), 320);
      const clear = async (): Promise<boolean> => {
        const pin = await driver.box("s-pin");
        return (await ringOf(driver, "s-r0")).top >= pin.y + pin.height - 0.5;
      };
      await tabToBox(driver);
      const walk: string[] = [];
      for (let index = 0; index < 3; index++) {
        await driver.pressTab();
        walk.push((await driver.focused()) ?? "body");
      }
      const rest = await clear();
      const cap = await driver.box("s-cap");
      await tabToBox(driver);
      await driver.setScrollTop(boxOf("s"), cap.height + 2 * room + 60);
      for (let index = 0; index < 3; index++) await driver.pressTab();
      return { walk, rest, past: { focused: await driver.focused(), clear: await clear() } };
    },
    expected: { walk: ["s-cl", "s-pl", "s-r0"], rest: true, past: { focused: "s-r0", clear: true } },
  },
  {
    // Q-S2-1 (a), Q-A2 (a), spike-2 § Addendum A4, A5. Plant: `before` always false (the link scrolled back past the
    // caption to `pinnedEnd`, 21.3 px below the edge), which fails at rest and at the partly scrolled position; the
    // fully-past half is met by Chromium's focus scroll alone and is no guard.
    name: "block clearance for an element before the pinned box (a caption link) in a 300 px bound: at rest nothing is written and the fade is kept; partly scrolled out (2 to 12 px above the client edge) its ring box comes to the client block-start edge within 0.5 px, above the pinned box, hit at its centre, with no jump back; fully past it is shown whole above the pinned box (Q-S2-1 (a), Q-A2 (a))",
    run: async (driver) => {
      await page(driver, host("t", { cap: true, narrow: true, bound: 300 }), 320);
      const box = await driver.box("t", ".region-box");
      await tabToBox(driver);
      await driver.pressTab();
      const rest = {
        focused: await driver.focused(),
        scrollTop: await driver.scrollTop(boxOf("t")),
        inside: (await ringOf(driver, "t-cl")).top >= box.y - 0.5,
        blockFade: await boxAttribute(driver, "t", "data-block-fade"),
      };
      const linkAtRest = (await driver.box("t-cl")).y - box.y;
      const partly = Math.round(linkAtRest + 7);
      await driver.setScrollTop(boxOf("t"), partly);
      const above = box.y - (await driver.box("t-cl")).y;
      await driver.focusTarget(boxOf("t"));
      const jump = await noJumpBack(driver, "t", () => driver.pressTab());
      const ring = await ringOf(driver, "t-cl");
      const pin = await driver.box("t-pin");
      const partlyScrolled = {
        precondition: above >= 2 && above <= 12,
        focused: await driver.focused(),
        lower: (await driver.scrollTop(boxOf("t"))) < partly,
        atEdge: near(ring.top, box.y),
        abovePin: ring.bottom <= pin.y + 0.5,
        hit: await hitAtCentre(driver, "t-cl"),
        monotone: jump.monotone,
      };
      const cap = await driver.box("t-cap");
      await driver.setScrollTop(boxOf("t"), cap.height + 2 * room + 40);
      await driver.focusTarget(boxOf("t"));
      await driver.pressTab();
      const whole = await driver.box("t-cl");
      const pinNow = await driver.box("t-pin");
      const fullyPast = { focused: await driver.focused(), shown: whole.y >= box.y - 0.5 && whole.y + whole.height <= pinNow.y + 0.5, hit: await hitAtCentre(driver, "t-cl") };
      return { rest, partlyScrolled, fullyPast };
    },
    expected: {
      rest: { focused: "t-cl", scrollTop: 0, inside: true, blockFade: "end" },
      partlyScrolled: { precondition: true, focused: "t-cl", lower: true, atEdge: true, abovePin: true, hit: "t-cl", monotone: true },
      fullyPast: { focused: "t-cl", shown: true, hit: "t-cl" },
    },
  },
  {
    // Plant: the block focus fallback never ending (the fade suppressed after focusout and after a user scroll).
    name: "block clearance fallback: a ring box taller than the space below the pinned box suppresses the block-end fade, which comes back after focusout and after a scroll of more than 1 px (contract § Effects, Focus clearance)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 100 }));
      await driver.rules(".row.tall { block-size: 90px; } .row.tall > a { block-size: 80px; }");
      await driver.module('document.getElementById("b-r1").parentElement.className = "row tall";');
      const steps: unknown[] = [];
      await driver.focus("b-r0");
      await driver.pressTab();
      steps.push({ focused: await driver.focused(), blockFade: await boxAttribute(driver, "b", "data-block-fade") });
      await driver.focus("before");
      steps.push({ blockFade: await boxAttribute(driver, "b", "data-block-fade") });
      await driver.focus("b-r0");
      await driver.pressTab();
      const top = await driver.scrollTop(boxOf("b"));
      await driver.setScrollTop(boxOf("b"), top + 3);
      steps.push({ blockFade: await boxAttribute(driver, "b", "data-block-fade") });
      return steps;
    },
    expected: [{ focused: "b-r1", blockFade: null }, { blockFade: "end" }, { blockFade: "end" }],
  },
  {
    // T025 (mutation): the block focus fallback's 1 px tolerance.
    name: "block clearance fallback, the tolerance: the suppression holds after a scroll of exactly 1 px from the position the module wrote, and ends after one of 3 px (contract § Effects, Focus clearance)",
    run: async (driver) => {
      await page(driver, host("b", { bound: 100 }));
      await driver.rules(".row.tall { block-size: 90px; } .row.tall > a { block-size: 80px; }");
      await driver.module('document.getElementById("b-r1").parentElement.className = "row tall";');
      await driver.focus("b-r0");
      await driver.pressTab();
      const top = await driver.scrollTop(boxOf("b"));
      const steps: unknown[] = [{ focused: await driver.focused(), blockFade: await boxAttribute(driver, "b", "data-block-fade") }];
      await driver.setScrollTop(boxOf("b"), top + 1);
      steps.push({ moved: (await driver.scrollTop(boxOf("b"))) - top, blockFade: await boxAttribute(driver, "b", "data-block-fade") });
      await driver.setScrollTop(boxOf("b"), top + 3);
      steps.push({ moved: (await driver.scrollTop(boxOf("b"))) - top, blockFade: await boxAttribute(driver, "b", "data-block-fade") });
      return steps;
    },
    expected: [{ focused: "b-r1", blockFade: null }, { moved: 1, blockFade: null }, { moved: 3, blockFade: "end" }],
  },
  {
    // T025 (mutation): the state before the first measure.
    name: "block axis on a host added already bounded: its first measure sees the block overflow, so after settle it carries `data-axis=both` and the block-end fade (`data-block-fade=end`), not suppressed before any focus",
    run: async (driver) => {
      await page(driver, '<div id="slot"></div>');
      await driver.append("slot", host("n", { bound: 300 }));
      await driver.settle();
      return { axis: await boxAttribute(driver, "n", "data-axis"), blockFade: await boxAttribute(driver, "n", "data-block-fade"), tabindex: await boxAttribute(driver, "n", "tabindex") };
    },
    expected: { axis: "both", blockFade: "end", tabindex: "0" },
  },
  {
    // T025 (mutation): letting go of a box (contracts/overflow-region.md § Lifecycle `hostUpdated`, 009 O3-03).
    name: "block axis, letting go: a box the host no longer hands the module loses `data-axis` and `data-block-fade` with its tab stop, and gets them back when handed back; a block suppression of the box let go does not outlive it",
    run: async (driver) => {
      await page(driver, host("r", { bound: 100 }));
      await driver.rules(".row.tall { block-size: 90px; } .row.tall > a { block-size: 80px; }");
      await driver.module('document.getElementById("r-r1").parentElement.className = "row tall";');
      const read = async (): Promise<Record<string, string | null>> => ({
        axis: await boxAttribute(driver, "r", "data-axis"),
        blockFade: await boxAttribute(driver, "r", "data-block-fade"),
        tabindex: await boxAttribute(driver, "r", "tabindex"),
      });
      const steps: unknown[] = [await read()];
      await driver.setAttribute("r", "current", "none");
      await driver.settle();
      steps.push(await read());
      await driver.setAttribute("r", "current", null);
      await driver.settle();
      steps.push(await read());
      await driver.focus("r-r0");
      await driver.pressTab();
      steps.push({ focused: await driver.focused(), blockFade: await boxAttribute(driver, "r", "data-block-fade") });
      await driver.setAttribute("r", "current", "none");
      await driver.settle();
      await driver.setAttribute("r", "current", null);
      await driver.settle();
      steps.push({ blockFade: await boxAttribute(driver, "r", "data-block-fade") });
      return steps;
    },
    expected: [
      { axis: "both", blockFade: "end", tabindex: "0" },
      { axis: null, blockFade: null, tabindex: null },
      { axis: "both", blockFade: "end", tabindex: "0" },
      { focused: "r-r1", blockFade: null },
      { blockFade: "end" },
    ],
  },
  {
    // Q-M1 (b), T083 (contract § Effects, Focus clearance, "When it runs"). Plant: the block clearance gated on the
    // state the last measurement left (`#axis`), which `#release` set false, instead of the overflow read at focus.
    name: "block clearance for focus entering a box handed back before the module's observer measures it: a link under the pinned box and focused with a ring in the same task as the hand-back is cleared below the pinned box and clear of the block-end fade (Q-M1 (b))",
    run: async (driver) => handedBack(driver, "h", { bound: 300 }),
    expected: { underPin: true, letGo: null, focusVisible: "true", focused: "h-r3", belowPin: true, clearOfEnd: true, scrolledBack: true },
  },
];

/** The option-off guard: the same host without `block-axis` keeps 009's contract exactly. */
export const overflowBlockGuards: readonly Scenario[] = [
  {
    // Plant: the module handling ArrowDown with the option off.
    name: "block axis off (guard): the same host without the option does not handle ArrowDown, has no `data-axis` and no `data-block-fade` although its content is taller than its bound, and keeps 009's two-layer `mask-size`; paired with the option on carrying `data-axis=both`",
    run: async (driver) => {
      await page(driver, `${host("o", { wide: true, narrow: true, bound: 300, axis: false })}${host("w", { wide: true, narrow: true, bound: 300 })}`);
      await driver.focusTarget(boxOf("o"));
      await driver.chord("ArrowDown");
      const arrowDown = { prevented: await driver.lastKeyPrevented(), scrollTop: await driver.scrollTop(boxOf("o")) };
      await driver.chord("ArrowRight");
      return {
        arrowDown,
        arrowRight: { prevented: await driver.lastKeyPrevented(), scrollLeft: await driver.scrollLeft(boxOf("o")) },
        off: {
          axis: await boxAttribute(driver, "o", "data-axis"),
          blockFade: await boxAttribute(driver, "o", "data-block-fade"),
          taller: (await prop(driver, boxOf("o"), "scrollHeight")) > (await prop(driver, boxOf("o"), "clientHeight")) + 1,
          size: layers(await driver.computed("o", "mask-size", ".region-box")),
        },
        on: await boxAttribute(driver, "w", "data-axis"),
      };
    },
    expected: {
      arrowDown: { prevented: false, scrollTop: 0 },
      arrowRight: { prevented: true, scrollLeft: 40 },
      off: { axis: null, blockFade: null, taller: true, size: ["100% 300px", "100% 0px"] },
      on: "both",
    },
  },
  {
    // T025 (mutation): the module's default for an absent option.
    name: "block axis absent (guard): a host built without the option, as 009's are, does not handle ArrowDown and has no `data-axis` or `data-block-fade` although its content is taller than its bound; paired with the block host carrying `data-axis=both`",
    run: async (driver) => {
      await page(driver, `${host("p", { wide: true, narrow: true, bound: 300, axis: false, tag: "ocelle-test-overflow-plain" })}${host("w", { wide: true, narrow: true, bound: 300 })}`);
      await driver.focusTarget(boxOf("p"));
      await driver.chord("ArrowDown");
      return {
        arrowDown: { prevented: await driver.lastKeyPrevented(), scrollTop: await driver.scrollTop(boxOf("p")) },
        absent: {
          axis: await boxAttribute(driver, "p", "data-axis"),
          blockFade: await boxAttribute(driver, "p", "data-block-fade"),
          taller: (await prop(driver, boxOf("p"), "scrollHeight")) > (await prop(driver, boxOf("p"), "clientHeight")) + 1,
        },
        on: await boxAttribute(driver, "w", "data-axis"),
      };
    },
    expected: { arrowDown: { prevented: false, scrollTop: 0 }, absent: { axis: null, blockFade: null, taller: true }, on: "both" },
  },
  {
    // T025 (mutation): the block clearance only while `data-axis=both`.
    name: "block axis off (guard), focus: with the option off, a link tabbed to under the pinned box stays where it is (no block clearance); paired with the option on, where the same link is scrolled below the pinned box",
    run: async (driver) => {
      await page(driver, `${host("o", { wide: true, narrow: true, bound: 300, axis: false })}${host("w", { wide: true, narrow: true, bound: 300 })}`);
      const moved: Record<string, unknown> = {};
      for (const id of ["o", "w"]) {
        await driver.setScrollTop(boxOf(id), 122);
        const at = await driver.scrollTop(boxOf(id));
        await driver.focus(`${id}-r4`);
        await driver.tab(true);
        moved[id] = { focused: await driver.focused(), at, change: Math.sign((await driver.scrollTop(boxOf(id))) - at) };
      }
      return moved;
    },
    expected: { o: { focused: "o-r3", at: 122, change: 0 }, w: { focused: "w-r3", at: 122, change: -1 } },
  },
  {
    // Q-M1 (b), T083, the option-off half: the overflow read at focus is the block clearance's condition only with the
    // option on. The host overflows in the inline axis (rows 600 px wide at 320 px), so the box is a tab stop and the
    // module's focus handler runs. Plant: the block clearance on block overflow alone, without the option.
    name: "block axis off (guard), focus entering a box handed back before the module's observer measures it: with the option off the same link stays above the pinned box's block-end edge (no block clearance); paired with the option-on body above",
    run: async (driver) => {
      const observed = await handedBack(driver, "o", { bound: 300, wide: true, narrow: true, axis: false });
      return { underPin: observed.underPin, letGo: observed.letGo, focusVisible: observed.focusVisible, focused: observed.focused, belowPin: observed.belowPin };
    },
    expected: { underPin: true, letGo: null, focusVisible: "true", focused: "o-r3", belowPin: false },
  },
];
