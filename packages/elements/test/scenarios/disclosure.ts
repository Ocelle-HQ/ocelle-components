// The shared bodies of User Story 1's browser scenarios, `ocelle-disclosure` (020 spec US1-1 to US1-23, FR-001 to
// FR-017 and the disclosure's edge cases; research.md R-01 to R-04, R-08; data-model.md § `ocelle-disclosure`;
// contracts/checks.md § Scenario bodies, § Bodies the platform alone could pass, § Oracles; tasks.md T004, T005). Each
// body is written once against the driver and run in process on the element source (test/disclosure.test.ts) and on
// the built browser build on the strict-CSP fixture (test/browser/disclosure.test.ts). Expected values are written by
// hand from the spec, the data model and research: colours by token name from the hand-written token table
// (packages/tokens/test/expected.ts, through `tokenColour`), forced colours as `resolveColour(<keyword>)`, sizes from
// the token values (`--ocelle-icon-size` 20 px, `--ocelle-space-2` 8 px, `--ocelle-space-1` 4 px, `--ocelle-focus-width`
// 3 px), the 24 × 24 target of FR-014 written by hand.
//
// Oracles (contracts/checks.md § Oracles): the summary's role, name, description and expanded state from the CDP tree
// (`axState`, `axSubtree`); a closed panel by `checkVisibility()` (`visible`), the tab order and the CDP tree, never by
// its client rects (R-08); event counts after the element's update and then the driver's `settle()`, never after a bare
// `setTimeout(0)`; each count of 0 followed in the same body by a positive control counted as exactly 1.
//
// Every "does not" outcome shares its body with the positive outcome it guards:
// - a repeated `open = true` fires nothing (US1-6) beside the first set's one event and a click's one;
// - two sets in one task that end where they started fire nothing (US1-7a, US1-7b) beside the summary's AX state, the
//   panel's visibility and a click counted as one;
// - a morph that keeps `open` fires nothing (US1-8) beside the morph that drops it, counted as one;
// - the upgrade fires nothing (US1-9, US1-23) beside a click counted as one;
// - a dispatched host click toggles nothing (US1-20) beside `element.click()`'s one event before and after it;
// - a panel click does not toggle and reaches the page (FR-004) beside a summary click counted as one;
// - a click on panel text moves no focus and keeps the scroll position, and Space after it does not close (US1-22),
//   beside `element.click()` counted as one;
// - a host `aria-expanded` of another value changes nothing (US1-23) beside "true" and "false", one event each;
// - the consumer icon replaces the chevron (US1-17) beside the consumer icon drawn at the icon size;
// - the native `toggle` does not leave the shadow root (FR-012) beside the element's own event heard.
import { severe } from "./button.ts";
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import type { Box, Driver, EventRecord, Palette, Pixels } from "./driver.ts";

export type { Scenario } from "./icon.ts";

/** The summary control, the panel wrapper, the label wrapper and the fallback chevron in the shadow root. */
const summary = '[part="summary"]';
const panel = '[part="panel"]';
const label = ".label";
const chevron = ".chevron";
const toggle = "ocelle-disclosure-toggle";
const transparent = "rgba(0, 0, 0, 0)";

/** `--ocelle-icon-size` (1.25rem), `--ocelle-space-2` (0.5rem) and `--ocelle-space-1` (0.25rem) at 16 px. */
const iconSize = 20;
const gap = 8;
const padding = 4;
/** WCAG 2.5.8's minimum target, FR-014, written by hand. */
const target = 24;

const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;

/**
 * A driver read that may find nothing in a shadow root that is not rendered yet (the scaffold's): its value, or
 * "absent" when the read throws or rejects, so the body's assertion reports the missing part.
 */
async function attempt<T>(read: () => Promise<T>): Promise<T | "absent"> {
  try {
    return await read();
  } catch {
    return "absent";
  }
}

/** The default summary: a light-DOM span with the id `<id>-s`. */
const summaryOf = (id: string, text = "Advanced settings"): string => `<span id="${id}-s" slot="summary">${text}</span>`;
/** The default panel: a paragraph `<id>-p` holding the word "retention" and a link `<id>-link`. */
const panelOf = (id: string): string => `<p id="${id}-p">The retention period is thirty days. <a id="${id}-link" href="#settings">Retention settings</a></p>`;

/** A disclosure with `id`, its attributes, and its summary and panel (the defaults when not given). */
function disclosure(id: string, options: { readonly attributes?: string; readonly summary?: string; readonly panel?: string } = {}): string {
  return `<ocelle-disclosure id="${id}"${options.attributes ?? ""}>${options.summary ?? summaryOf(id)}${options.panel ?? panelOf(id)}</ocelle-disclosure>`;
}

/**
 * A page with a button before and after `content`, so Tab has somewhere to come from and to go to, each in its own
 * paragraph (the paragraph margins keep their 21 px boxes clear of axe's 24 px target spacing).
 */
const page = (content: string): string => `<p><button id="before" type="button">Before</button></p>${content}<p><button id="after" type="button">After</button></p>`;

/** The `ocelle-disclosure-toggle` events that reached `document` since the last read: target and `detail.open`. */
async function fired(driver: Driver): Promise<{ readonly target: string | null; readonly open: unknown }[]> {
  await driver.settle();
  return (await driver.takeEvents()).filter((record) => record.type === toggle && record.at === "document").map((record) => ({ target: record.target, open: (record.detail as { open?: unknown } | null)?.open }));
}

/** The `detail.open` values of the `ocelle-disclosure-toggle` events that reached `document` since the last read. */
async function opens(driver: Driver): Promise<unknown[]> {
  return (await fired(driver)).map((each) => each.open);
}

/** The name of the fallback chevron the shadow root renders (`ocelle-icon.chevron`), or "none". */
async function chevronName(driver: Driver, id: string): Promise<string> {
  const icon = (await driver.elements(id)).find((part) => part.name === "ocelle-icon" && (part.attributes.class ?? "").split(" ").includes("chevron"));
  return icon?.attributes.name ?? "none";
}

/** The state of a disclosure: its property, its host attribute, its summary's AX state and its chevron. */
async function state(driver: Driver, id: string): Promise<unknown> {
  const ax = await attempt(() => driver.axState(id, summary));
  return {
    open: (await driver.property(id, "open")) === true,
    attribute: (await driver.attribute(id, "open")) !== null,
    role: ax === "absent" ? "absent" : ax.role,
    expanded: ax === "absent" ? "absent" : ax.expanded,
    chevron: await chevronName(driver, id),
  };
}

const closedState = { open: false, attribute: false, role: "DisclosureTriangle", expanded: false, chevron: "chevron-end" };
const openState = { open: true, attribute: true, role: "DisclosureTriangle", expanded: true, chevron: "chevron-down" };

/** The deep active element after focusing the disclosure and pressing Tab once. */
async function tabFromSummary(driver: Driver, id: string): Promise<string> {
  await driver.focus(id);
  await driver.press("Tab");
  await driver.settle();
  return await driver.deepActive();
}

/** The deep active element when the summary of the disclosure `id` is focused (the host is the document's). */
const onSummary = (id: string): string => `${id} >> summary.control`;

/**
 * Clicks the element `id` (or its shadow element `inner`) with the mouse, then settles; nothing when it has no box (the
 * scaffold renders no summary and slots no content, and a click on what has no box would wait for it).
 */
async function clickShown(driver: Driver, id: string, inner?: string): Promise<void> {
  const box = await driver.box(id, inner);
  if (box.width > 0 && box.height > 0) await driver.click(id, inner === undefined ? {} : { inner });
  await driver.settle();
}

/** Clicks the summary of the disclosure `id` with the mouse; nothing when it is not rendered. */
async function clickSummary(driver: Driver, id: string): Promise<void> {
  await clickShown(driver, id, summary);
}

/** Whether `inner` lies inside `outer`, to a tenth of a pixel. */
function inside(inner: Box, outer: Box): boolean {
  return inner.width > 0 && tenth(inner.x) >= tenth(outer.x) && tenth(inner.y) >= tenth(outer.y) && tenth(inner.x + inner.width) <= tenth(outer.x + outer.width) && tenth(inner.y + inner.height) <= tenth(outer.y + outer.height);
}

/** The red, green and blue of a computed `rgb(…)` colour. */
function channels(colour: string): readonly number[] {
  return (colour.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
}

/** The pixels of a capture inside `area` (a box relative to the capture's element) that are within 48 of `colour` on each channel. */
function inkPixels(pixels: Pixels, scale: number, area: { readonly x: number; readonly y: number; readonly width: number; readonly height: number }, colour: string): { readonly x: number; readonly y: number }[] {
  const [r = 0, g = 0, b = 0] = channels(colour);
  const found: { x: number; y: number }[] = [];
  const x0 = Math.max(0, Math.floor(area.x * scale));
  const y0 = Math.max(0, Math.floor(area.y * scale));
  const x1 = Math.min(pixels.width, Math.ceil((area.x + area.width) * scale));
  const y1 = Math.min(pixels.height, Math.ceil((area.y + area.height) * scale));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const at = (y * pixels.width + x) * 4;
      const near = [r, g, b].every((value, channel) => Math.abs((pixels.data[at + channel] ?? 0) - value) <= 48);
      if (near) found.push({ x: x / scale, y: y / scale });
    }
  }
  return found;
}

/**
 * Where the chevron's apex is (research.md R-01; contracts/checks.md § Oracles, "Right to left"): the mean inline
 * offset, from the icon box's centre, of the ink painted in the icon box's middle rows, in CSS px. `chevron-end` drawn
 * left to right has its apex at the right (a positive offset); mirrored, at the left.
 */
async function apex(driver: Driver, id: string): Promise<number | "absent"> {
  const host = await driver.box(id);
  const icon = await driver.box(id, chevron);
  if (icon.width === 0) return "absent";
  const pixels = await driver.pixels(id);
  const scale = pixels.width / host.width;
  const centre = { x: icon.x - host.x + icon.width / 2, y: icon.y - host.y + icon.height / 2 };
  const ink = inkPixels(pixels, scale, { x: icon.x - host.x, y: centre.y - 1.5, width: icon.width, height: 3 }, await driver.computed(id, "color", summary));
  if (ink.length === 0) return "absent";
  return ink.reduce((sum, each) => sum + each.x, 0) / ink.length + 0.5 / scale - centre.x;
}

/** The summary's look under the driver's current theme: background, cursor. */
async function surface(driver: Driver, id: string): Promise<{ readonly background: string; readonly cursor: string }> {
  return { background: await driver.computed(id, "background-color", summary), cursor: await driver.computed(id, "cursor", summary) };
}

/** The ids `reflected` names, or "none" for a null or empty list. */
async function references(driver: Driver, id: string, property: string): Promise<readonly string[] | "none" | "absent"> {
  const value = await attempt(() => driver.reflected(id, summary, property));
  if (value === "absent") return value;
  return value === null || value.length === 0 ? "none" : value;
}

/** The summary's CDP name, or "absent". */
async function nameOf(driver: Driver, id: string): Promise<string> {
  const ax = await attempt(() => driver.axState(id, summary));
  return ax === "absent" ? "absent" : ax.name;
}

/** Whether the unignored AX subtree of the disclosure has a node of `role` or one whose name contains `text`. */
async function subtreeHas(driver: Driver, id: string, role: string, text?: string): Promise<boolean> {
  const nodes = await driver.axSubtree(id);
  return nodes.some((node) => node.role === role || (text !== undefined && node.name.includes(text)));
}

/** The motion body of US1-14 under `mode` (contracts/checks.md § Oracles, "Motion"). */
function motion(mode: "reduce" | "no-preference"): Scenario {
  return {
    name: `US1-14: with prefers-reduced-motion ${mode}, a pointer toggle opens the disclosure with one event and no animation or transition runs on the element, its panel or its chevron one frame after it; their transition durations are 0s (FR-015)`,
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.reducedMotion(mode);
      await driver.events("d", [toggle]);
      await clickShown(driver, "d", summary);
      const running = (await driver.animations("d")).filter((each) => each.playState === "running").map((each) => `${each.part} ${each.property}`);
      const events = await opens(driver);
      const durations = await Promise.all([summary, panel, chevron].map((inner) => attempt(() => driver.computed("d", "transition-duration", inner))));
      const observed = { reduce: (await driver.device()).reducedMotion, open: (await driver.property("d", "open")) === true, events, running, durations };
      await driver.reducedMotion("no-preference");
      return observed;
    },
    expected: { reduce: mode === "reduce", open: true, events: [true], running: [], durations: ["0s", "0s", "0s"] },
  };
}

/** US1-21 and FR-014's hover in `theme`. */
function hover(theme: Palette): Scenario {
  return {
    name: `US1-21: in ${theme}, the hovered summary's background is --ocelle-color-hover-bg with a pointer cursor, and transparent when the pointer leaves it (FR-014)`,
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.theme(theme);
      if ((await driver.box("d", summary)).width > 0) await driver.hover("d", { inner: summary });
      const hovered = await attempt(() => surface(driver, "d"));
      await driver.inputHover(null);
      const away = await attempt(() => surface(driver, "d"));
      return { hovered, away };
    },
    expected: { hovered: { background: tokenColour("color-hover-bg", theme), cursor: "pointer" }, away: { background: transparent, cursor: "pointer" } },
  };
}

/** US1-19: an open disclosure with focus on `focusId` in its panel, closed by `open = false`. */
function rescue(kind: string, content: string, focusId: string, before: string): Scenario {
  return {
    name: `US1-19: with focus on ${kind} in an open panel, open = false moves focus to the summary, the host document.activeElement, beside the close and its one event (FR-013)`,
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open", panel: content })));
      await driver.events("d", [toggle]);
      await driver.focus(focusId);
      await driver.settle();
      const focused = await driver.deepActive();
      await driver.setProperty("d", "open", false);
      return { focused, open: (await driver.property("d", "open")) === true, events: await opens(driver), after: await driver.deepActive() };
    },
    expected: { focused: before, open: false, events: [false], after: onSummary("d") },
  };
}

const nestedPanel = `<p id="d-p">Outer panel text.</p>${disclosure("inner", { summary: summaryOf("inner", "Inner settings"), panel: '<p id="inner-p">Inner panel text.</p>' })}`;

export const disclosureScenarios: readonly Scenario[] = [
  {
    name: "US1-1: a closed disclosure shows its summary with chevron-end before the label; the panel is not shown, its link not in the tab order nor in the AX tree; one control named by the summary text, expanded false",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      const icon = await driver.box("d", chevron);
      const text = await driver.box("d", label);
      const ax = await attempt(() => driver.axState("d", summary));
      const nodes = await driver.axSubtree("d");
      return {
        state: await state(driver, "d"),
        iconBeforeLabel: icon.width > 0 && icon.x + icon.width <= text.x,
        name: ax === "absent" ? ax : ax.name,
        controls: nodes.filter((node) => node.role === "DisclosureTriangle").length,
        panelInTree: nodes.some((node) => node.role === "link" || node.name.includes("retention")),
        shown: { summary: await driver.visible("d-s"), panel: await driver.visible("d-p"), link: await driver.visible("d-link") },
        tab: await tabFromSummary(driver, "d"),
        axe: await severe(driver),
      };
    },
    expected: {
      state: closedState,
      iconBeforeLabel: true,
      name: "Advanced settings",
      controls: 1,
      panelInTree: false,
      shown: { summary: true, panel: false, link: false },
      tab: "after",
      axe: [],
    },
  },
  {
    name: "US1-2: a click on the summary opens the panel below it in the flow, chevron-down, open reflected, expanded true, and one composed, bubbling, not cancelable ocelle-disclosure-toggle { open: true } reaches document; the native toggle is not heard outside the shadow root",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.listen(["d"]);
      await clickSummary(driver, "d");
      const heard = (await driver.heard()).filter((record) => record.endsWith(": toggle") || record.endsWith(`: ${toggle}`));
      await driver.settle();
      const records = (await driver.takeEvents()).filter((record: EventRecord) => record.type === toggle && record.at === "document");
      const [host, control, content, after] = [await driver.box("d"), await driver.box("d", summary), await driver.box("d", panel), await driver.box("after")];
      return {
        state: await state(driver, "d"),
        events: records.map((record) => ({ target: record.target, detail: record.detail, bubbles: record.bubbles, composed: record.composed, cancelable: record.cancelable })),
        heard,
        below: content.height > 0 && tenth(content.y) >= tenth(control.y + control.height),
        inFlow: { position: await attempt(() => driver.computed("d", "position", panel)), insideHost: inside(content, host), afterPushedDown: tenth(after.y) >= tenth(content.y + content.height) },
        shown: { panel: await driver.visible("d-p"), link: await driver.visible("d-link") },
        axe: await severe(driver),
      };
    },
    expected: {
      state: openState,
      events: [{ target: "ocelle-disclosure#d", detail: { open: true }, bubbles: true, composed: true, cancelable: false }],
      heard: [`d: ${toggle}`],
      below: true,
      inFlow: { position: "static", insideHost: true, afterPushedDown: true },
      shown: { panel: true, link: true },
      axe: [],
    },
  },
  {
    name: "US1-3: a second click on the summary closes the panel: no open attribute, chevron-end, and one more ocelle-disclosure-toggle with open false",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await clickSummary(driver, "d");
      await clickSummary(driver, "d");
      return { state: await state(driver, "d"), events: await opens(driver), shown: await driver.visible("d-p") };
    },
    expected: { state: closedState, events: [true, false], shown: false },
  },
  {
    name: "US1-4: Tab focuses the summary (the host document.activeElement) with the token focus ring; Enter opens with one event and Space closes with one",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.focus("before");
      await driver.press("Tab");
      await driver.settle();
      const focus = {
        active: await driver.deepActive(),
        visible: await attempt(() => driver.focusVisible("d", summary)),
        ring: await attempt(() => Promise.all(["outline-style", "outline-width", "outline-color"].map((property) => driver.computed("d", property, summary)))),
      };
      await driver.press("Enter");
      await driver.settle();
      const enter = { attribute: (await driver.attribute("d", "open")) !== null, events: await opens(driver) };
      await driver.press(" ");
      await driver.settle();
      const space = { attribute: (await driver.attribute("d", "open")) !== null, events: await opens(driver) };
      return { focus, enter, space };
    },
    expected: {
      focus: { active: onSummary("d"), visible: true, ring: ["solid", "3px", tokenColour("color-focus", "light")] },
      enter: { attribute: true, events: [true] },
      space: { attribute: false, events: [false] },
    },
  },
  {
    name: "US1-5: in an open disclosure Tab from the summary reaches the panel's link, laid out below the summary inside the host, and Shift+Tab returns; closed, Tab from the summary leaves the host",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open" })));
      const forward = await tabFromSummary(driver, "d");
      await driver.press("Tab", ["Shift"]);
      await driver.settle();
      const back = await driver.deepActive();
      const [host, control, link] = [await driver.box("d"), await driver.box("d", summary), await driver.box("d-link")];
      await driver.setProperty("d", "open", false);
      return { forward, back, linkBelow: tenth(link.y) >= tenth(control.y + control.height) && inside(link, host), closed: await tabFromSummary(driver, "d") };
    },
    expected: { forward: "d-link", back: onSummary("d"), linkBelow: true, closed: "after" },
  },
  {
    name: "US1-6: open = true opens as a click does with one event; open = true again changes nothing and fires none; a summary click then closes with one",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.setProperty("d", "open", true);
      const set = { state: await state(driver, "d"), events: await opens(driver), shown: await driver.visible("d-p") };
      await driver.setProperty("d", "open", true);
      const again = { state: await state(driver, "d"), events: await opens(driver) };
      await clickSummary(driver, "d");
      return { set, again, control: await opens(driver) };
    },
    expected: { set: { state: openState, events: [true], shown: true }, again: { state: openState, events: [] }, control: [false] },
  },
  {
    name: "US1-6: setting the open attribute opens with one event, the property true; setting it again fires none; removing it closes with one",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.setAttribute("d", "open", "");
      const set = { state: await state(driver, "d"), events: await opens(driver) };
      await driver.setAttribute("d", "open", "");
      const again = await opens(driver);
      await driver.setAttribute("d", "open", null);
      return { set, again, removed: { state: await state(driver, "d"), events: await opens(driver) } };
    },
    expected: { set: { state: openState, events: [true] }, again: [], removed: { state: closedState, events: [false] } },
  },
  {
    name: "US1-7a: a closed disclosure set open true then false in one task is closed with 0 events, its summary in the AX tree expanded false; a click then counts exactly 1",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.setProperties("d", "open", [true, false]);
      await driver.settle();
      const after = { state: await state(driver, "d"), events: await opens(driver) };
      await clickSummary(driver, "d");
      return { after, control: await opens(driver) };
    },
    expected: { after: { state: closedState, events: [] }, control: [true] },
  },
  {
    name: "US1-7b: an open disclosure set open false then true in one task is open with 0 events, expanded true, its link visible and in the tab order; a click then counts exactly 1",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open" })));
      await driver.events("d", [toggle]);
      await driver.setProperties("d", "open", [false, true]);
      await driver.settle();
      const after = { state: await state(driver, "d"), events: await opens(driver), link: await driver.visible("d-link"), tab: await tabFromSummary(driver, "d") };
      await clickSummary(driver, "d");
      return { after, control: await opens(driver) };
    },
    expected: { after: { state: openState, events: [], link: true, tab: "d-link" }, control: [false] },
  },
  {
    name: "US1-7c: a closed disclosure set open true, false and true in one task is open with exactly 1 event, open true",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.setProperties("d", "open", [true, false, true]);
      await driver.settle();
      return { state: await state(driver, "d"), events: await opens(driver) };
    },
    expected: { state: openState, events: [true] },
  },
  {
    name: "US1-8: a disclosure opened by the user stays open through a morph whose markup has open, with no event; a morph whose markup lacks open closes it with one event",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await clickSummary(driver, "d");
      const opened = await opens(driver);
      await driver.morph("d", '<ocelle-disclosure id="d" open></ocelle-disclosure>');
      const kept = { state: await state(driver, "d"), events: await opens(driver) };
      await driver.morph("d", '<ocelle-disclosure id="d"></ocelle-disclosure>');
      return { opened, kept, dropped: { state: await state(driver, "d"), events: await opens(driver) } };
    },
    expected: { opened: [true], kept: { state: openState, events: [] }, dropped: { state: closedState, events: [false] } },
  },
  {
    name: "US1-9: server markup <ocelle-disclosure open> upgrades open, expanded true and its panel shown, with no event for the initial state; a click then counts exactly 1",
    run: async (driver) => {
      await driver.listen(["d"]);
      await driver.mount(page(disclosure("d", { attributes: " open" })));
      await driver.settle();
      const heard = (await driver.heard()).filter((record) => record.endsWith(`: ${toggle}`));
      const upgraded = { state: await state(driver, "d"), shown: await driver.visible("d-p"), heard };
      await driver.events("d", [toggle]);
      await clickSummary(driver, "d");
      return { upgraded, control: await opens(driver) };
    },
    expected: { upgraded: { state: openState, shown: true, heard: [] }, control: [false] },
  },
  {
    name: "US1-10: find in page (a #:~:text= navigation) on a word in a closed panel opens the disclosure, reflects open and fires one event with open true",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.findText("retention");
      return { state: await state(driver, "d"), events: await opens(driver), shown: await driver.visible("d-p") };
    },
    expected: { state: openState, events: [true], shown: true },
  },
  {
    name: "US1-11: under dir=rtl a closed disclosure's chevron-end is mirrored about its box (apex at the left) and sits at the summary's inline start, its right side",
    run: async (driver) => {
      await driver.mount(`<div id="ltr">${disclosure("dl")}</div><div id="rtl">${disclosure("dr")}</div>`);
      await driver.dir("rtl", "rtl");
      const [ltr, rtl] = [await apex(driver, "dl"), await apex(driver, "dr")];
      const [control, icon, text] = [await driver.box("dr", summary), await driver.box("dr", chevron), await driver.box("dr", label)];
      return {
        ltr: typeof ltr === "number" && ltr > 1 ? "apex right" : ltr,
        rtl: typeof rtl === "number" && rtl < -1 ? "apex left" : rtl,
        mirrored: typeof ltr === "number" && typeof rtl === "number" && Math.abs(ltr + rtl) <= 1,
        rightOfLabel: icon.width > 0 && icon.x >= text.x + text.width,
        toSummaryEnd: tenth(control.x + control.width - (icon.x + icon.width)),
        chevron: await chevronName(driver, "dr"),
      };
    },
    expected: { ltr: "apex right", rtl: "apex left", mirrored: true, rightOfLabel: true, toSummaryEnd: padding, chevron: "chevron-end" },
  },
  {
    name: "US1-12: a host aria-label names the summary, is removed from the host and mirrored; a cloneNode(true) copy's summary has the same name",
    run: async (driver) => {
      await driver.mount(`${page(disclosure("d", { attributes: ' aria-label="Show advanced settings"', summary: summaryOf("d", "Advanced") }))}<div id="into"></div>`);
      const moved = { name: await nameOf(driver, "d"), host: await driver.attribute("d", "aria-label"), mirror: await driver.attribute("d", "data-ocelle-moved-aria-label") };
      await driver.copy("d", "clone", "into");
      return { moved, copy: await nameOf(driver, "d-into") };
    },
    expected: { moved: { name: "Show advanced settings", host: null, mirror: "Show advanced settings" }, copy: "Show advanced settings" },
  },
  {
    name: "US1-13: a host aria-describedby gives the summary the hint's text as its description by element reference, with no id copied into the shadow root",
    run: async (driver) => {
      await driver.mount(`<p id="hint">Opens the retention options.</p>${page(disclosure("d", { attributes: ' aria-describedby="hint"' }))}`);
      const ax = await attempt(() => driver.axState("d", summary));
      const parts = await driver.elements("d");
      return {
        description: ax === "absent" ? ax : ax.description,
        references: await references(driver, "d", "ariaDescribedByElements"),
        // Element reflection leaves an empty `aria-describedby` on the summary; no attribute in the shadow root holds the id.
        copied: parts.filter((part) => Object.values(part.attributes).some((value) => value.split(/\s+/).includes("hint"))).length,
        host: await driver.attribute("d", "aria-describedby"),
        mirror: await driver.attribute("d", "data-ocelle-moved-aria-describedby"),
      };
    },
    expected: { description: "Opens the retention options.", references: ["hint"], copied: 0, host: null, mirror: "hint" },
  },
  motion("reduce"),
  motion("no-preference"),
  {
    name: "US1-15: in forced colours the summary is CanvasText on Canvas closed and open, the chevron painted in CanvasText, and the focused summary's ring is Highlight",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.forcedColors("active", "light");
      const [canvasText, canvas, highlight] = [await driver.resolveColour("CanvasText"), await driver.resolveColour("Canvas"), await driver.resolveColour("Highlight")];
      const read = async (): Promise<unknown> => {
        const host = await driver.box("d");
        const icon = await driver.box("d", chevron);
        const pixels = icon.width > 0 ? await driver.pixels("d") : undefined;
        const painted = pixels !== undefined && inkPixels(pixels, pixels.width / host.width, { x: icon.x - host.x, y: icon.y - host.y, width: icon.width, height: icon.height }, canvasText).length >= 10;
        const look = await attempt(() => Promise.all([driver.computed("d", "color", summary), driver.computed("d", "background-color", summary)]));
        return { colour: look !== "absent" && look[0] === canvasText, ground: look !== "absent" && look[1] === canvas, painted };
      };
      const closed = await read();
      await driver.setProperty("d", "open", true);
      const open = await read();
      await driver.focus("before");
      await driver.press("Tab");
      await driver.settle();
      const focused = { active: await driver.deepActive(), ring: (await attempt(() => driver.computed("d", "outline-color", summary))) === highlight, look: await read() };
      await driver.setProperty("d", "open", false);
      const focusedClosed = { ring: (await attempt(() => driver.computed("d", "outline-color", summary))) === highlight, look: await read() };
      await driver.forcedColors("none");
      return { closed, open, focused, focusedClosed };
    },
    expected: {
      closed: { colour: true, ground: true, painted: true },
      open: { colour: true, ground: true, painted: true },
      focused: { active: onSummary("d"), ring: true, look: { colour: true, ground: true, painted: true } },
      focusedClosed: { ring: true, look: { colour: true, ground: true, painted: true } },
    },
  },
  {
    name: "US1-16: at a 320 px viewport a long summary wraps inside the element, the chevron centred on its first line, and the page does not scroll sideways",
    run: async (driver) => {
      await driver.viewport(320, 800);
      await driver.mount(page(disclosure("d", { summary: summaryOf("d", "Retention, archival and deletion settings for every artifact of this mission") })));
      const lines = await driver.lines("d-s");
      const [host, control, icon, text] = [await driver.box("d"), await driver.box("d", summary), await driver.box("d", chevron), await driver.box("d", label)];
      const lineHeight = Number.parseFloat(await attempt(() => driver.computed("d", "line-height", label)).then((value) => (value === "absent" ? "NaN" : value)));
      const observed = {
        wrapped: lines.length > 1,
        insideElement: inside(control, host),
        centred: icon.width > 0 && Math.abs(icon.y + icon.height / 2 - (text.y + lineHeight / 2)) <= 0.5,
        scrollWidth: await driver.scrollWidth(),
      };
      await driver.viewport(1280, 800);
      return observed;
    },
    expected: { wrapped: true, insideElement: true, centred: true, scrollWidth: 320 },
  },
  {
    name: "US1-17: a slotted bare svg with a title replaces the chevron closed and open, has no AX node, and the summary is named by its text alone",
    run: async (driver) => {
      const svg = '<svg id="icon" slot="icon" viewBox="0 0 24 24"><title>Folder</title><rect x="4" y="6" width="16" height="12" fill="currentColor"></rect></svg>';
      await driver.mount(page(disclosure("d", { summary: `${svg}${summaryOf("d", "Advanced")}` })));
      const read = async (): Promise<unknown> => {
        const own = await driver.box("icon");
        return {
          icon: { width: tenth(own.width), height: tenth(own.height) },
          chevronShown: (await driver.box("d", chevron)).width > 0,
          name: await nameOf(driver, "d"),
          image: await subtreeHas(driver, "d", "image", "Folder"),
        };
      };
      const closed = await read();
      await driver.setProperty("d", "open", true);
      return { closed, open: await read() };
    },
    expected: {
      closed: { icon: { width: iconSize, height: iconSize }, chevronShown: false, name: "Advanced", image: false },
      open: { icon: { width: iconSize, height: iconSize }, chevronShown: false, name: "Advanced", image: false },
    },
  },
  {
    name: "US1-18: the host matches :state(open) while open and not while closed (FR-011)",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.rules("ocelle-disclosure:state(open) { --state-probe: open; }");
      const read = async (): Promise<string> => (await driver.computed("d", "--state-probe")).trim();
      const closed = await read();
      await driver.setProperty("d", "open", true);
      const open = await read();
      await clickSummary(driver, "d");
      return { closed, open, closedAgain: await read(), attribute: (await driver.attribute("d", "open")) !== null };
    },
    expected: { closed: "", open: "open", closedAgain: "", attribute: false },
  },
  rescue("a light-DOM link", panelOf("d"), "d-link", "d-link"),
  rescue("an ocelle-button whose focus is in its own shadow root", '<p id="d-p">Apply the settings. <ocelle-button id="btn">Apply</ocelle-button></p>', "btn", "btn >> button.control"),
  rescue("a nested disclosure's summary", nestedPanel, "inner", onSummary("inner")),
  {
    name: "US1-20: element.click() opens with one event; a click dispatched on the host changes nothing and fires none; element.click() then closes with one (FR-004)",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      await driver.callClick("d");
      const clicked = { state: await state(driver, "d"), events: await opens(driver) };
      await driver.module('document.getElementById("d").dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true, cancelable: true }));');
      const dispatched = { state: await state(driver, "d"), events: await opens(driver) };
      await driver.callClick("d");
      return { clicked, dispatched, control: { state: await state(driver, "d"), events: await opens(driver) } };
    },
    expected: { clicked: { state: openState, events: [true] }, dispatched: { state: openState, events: [] }, control: { state: closedState, events: [false] } },
  },
  hover("light"),
  hover("dark"),
  {
    name: "US1-22: a pointer click on plain text near the end of a tall, scrolled, open panel moves no focus and keeps the scroll position; Space after it leaves the disclosure open with no event; element.click() then counts exactly 1",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open", panel: '<p id="tall">The retention period is thirty days.</p><p id="near">Near the end of the panel.</p>' })));
      await driver.rules("#tall { block-size: 2400px; margin: 0; }");
      await driver.module('document.getElementById("near").scrollIntoView({ block: "center" });');
      await driver.events("d", [toggle]);
      const before = (await driver.box("near")).y;
      await clickShown(driver, "near");
      const clicked = { moved: tenth((await driver.box("near")).y - before), active: await driver.deepActive(), shadowActive: await driver.activeInner("d") };
      await driver.press(" ");
      await driver.settle();
      const space = { open: (await driver.property("d", "open")) === true, attribute: (await driver.attribute("d", "open")) !== null, events: await opens(driver), shown: await driver.visible("near") };
      await driver.callClick("d");
      return { clicked, space, control: await opens(driver) };
    },
    expected: { clicked: { moved: 0, active: "body", shadowActive: null }, space: { open: true, attribute: true, events: [], shown: true }, control: [false] },
  },
  {
    name: "US1-23: a host aria-expanded of \"true\" opens with one event and \"false\" closes with one, another value changes nothing and fires none, and the attribute is removed every time with no mirror; a click then counts exactly 1 (FR-007)",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      await driver.events("d", [toggle]);
      const read = async (): Promise<unknown> => ({ state: await state(driver, "d"), events: await opens(driver), host: await driver.attribute("d", "aria-expanded"), mirror: await driver.attribute("d", "data-ocelle-moved-aria-expanded") });
      await driver.setAttribute("d", "aria-expanded", "true");
      const opened = await read();
      await driver.setAttribute("d", "aria-expanded", "false");
      const closed = await read();
      await driver.setAttribute("d", "aria-expanded", "mixed");
      const other = await read();
      await clickSummary(driver, "d");
      return { opened, closed, other, control: await opens(driver) };
    },
    expected: {
      opened: { state: openState, events: [true], host: null, mirror: null },
      closed: { state: closedState, events: [false], host: null, mirror: null },
      other: { state: closedState, events: [], host: null, mirror: null },
      control: [true],
    },
  },
  {
    name: "US1-23: <ocelle-disclosure open aria-expanded=\"false\"> upgrades closed (the mapped attribute read after open wins) with no event and no aria-expanded left on the host; a click then counts exactly 1",
    run: async (driver) => {
      await driver.listen(["d"]);
      await driver.mount(page(disclosure("d", { attributes: ' open aria-expanded="false"' })));
      await driver.settle();
      const heard = (await driver.heard()).filter((record) => record.endsWith(`: ${toggle}`));
      const upgraded = { state: await state(driver, "d"), heard, host: await driver.attribute("d", "aria-expanded"), shown: await driver.visible("d-p") };
      await driver.events("d", [toggle]);
      await clickSummary(driver, "d");
      return { upgraded, control: await opens(driver) };
    },
    expected: { upgraded: { state: closedState, heard: [], host: null, shown: false }, control: [true] },
  },
];

/** The FR and edge-case bodies of contracts/checks.md for the disclosure (tasks.md T005). */
export const disclosureRuleScenarios: readonly Scenario[] = [
  {
    name: "FR-003: the host is a block box whose border box contains the summary and the open panel",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open" })));
      const [host, control, content] = [await driver.box("d"), await driver.box("d", summary), await driver.box("d", panel)];
      return { display: await driver.computed("d", "display"), summary: inside(control, host), panel: inside(content, host) };
    },
    expected: { display: "block", summary: true, panel: true },
  },
  {
    name: "FR-003: the native marker is not shown (the summary's list-style-type is none) closed and open, beside the element's chevron drawn at the icon size",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      const read = async (): Promise<unknown> => ({ marker: await attempt(() => driver.computed("d", "list-style-type", summary)), chevron: tenth((await driver.box("d", chevron)).width) });
      const closed = await read();
      await driver.setProperty("d", "open", true);
      return { closed, open: await read() };
    },
    expected: { closed: { marker: "none", chevron: iconSize }, open: { marker: "none", chevron: iconSize } },
  },
  {
    name: "FR-004: a click on the panel's text does not toggle and reaches a document listener; a summary click then counts exactly 1",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open", panel: '<p id="note">A plain note in the panel.</p>' })));
      await driver.events("note", ["click", toggle]);
      await clickShown(driver, "note");
      const records = await driver.takeEvents();
      const clicked = {
        reached: records.filter((record) => record.type === "click" && record.at === "document").map((record) => record.target),
        events: records.filter((record) => record.type === toggle).length,
        state: await state(driver, "d"),
      };
      await clickSummary(driver, "d");
      return { clicked, control: await opens(driver) };
    },
    expected: { clicked: { reached: ["p#note"], events: 0, state: openState }, control: [false] },
  },
  {
    name: "FR-014: the summary's border box is at least 24 × 24 CSS px",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { summary: summaryOf("d", "Go") })));
      const box = await driver.box("d", summary);
      return { wide: box.width >= target, tall: box.height >= target };
    },
    expected: { wide: true, tall: true },
  },
  {
    name: "FR-005: the fallback chevron's box is --ocelle-icon-size square with the slot convention's gap before the label, closed and open",
    run: async (driver) => {
      await driver.mount(page(disclosure("d")));
      const read = async (): Promise<unknown> => {
        const icon = await driver.box("d", chevron);
        return { width: tenth(icon.width), height: tenth(icon.height), gap: await attempt(() => driver.computed("d", "margin-inline-end", chevron)) };
      };
      const closed = await read();
      await driver.setProperty("d", "open", true);
      return { closed, open: await read() };
    },
    expected: { closed: { width: iconSize, height: iconSize, gap: `${String(gap)}px` }, open: { width: iconSize, height: iconSize, gap: `${String(gap)}px` } },
  },
  {
    name: "FR-013: element.click() while focus is on a link in the open panel closes the disclosure with one event and moves focus to the summary",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open" })));
      await driver.events("d", [toggle]);
      await driver.focus("d-link");
      await driver.callClick("d");
      return { events: await opens(driver), active: await driver.deepActive() };
    },
    expected: { events: [false], active: onSummary("d") },
  },
  {
    name: "FR-007: a host aria-labelledby names the summary by element reference, resolved in the host's tree, and is removed from the host and mirrored",
    run: async (driver) => {
      await driver.mount(`<span id="lab">Retention options</span>${page(disclosure("d", { attributes: ' aria-labelledby="lab"' }))}`);
      return { name: await nameOf(driver, "d"), references: await references(driver, "d", "ariaLabelledByElements"), host: await driver.attribute("d", "aria-labelledby"), mirror: await driver.attribute("d", "data-ocelle-moved-aria-labelledby") };
    },
    expected: { name: "Retention options", references: ["lab"], host: null, mirror: "lab" },
  },
  {
    name: "FR-007: a host title is moved onto the summary, removed from the host and mirrored",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: ' title="Retention options"' })));
      const control = (await driver.elements("d")).find((part) => part.name === "summary");
      return { summary: control?.attributes.title ?? "absent", host: await driver.attribute("d", "title"), mirror: await driver.attribute("d", "data-ocelle-moved-title") };
    },
    expected: { summary: "Retention options", host: null, mirror: "Retention options" },
  },
  {
    name: "FR-007: a morph that removes the aria-label mirror has it restored, and the summary keeps the moved name",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: ' aria-label="Show advanced settings"' })));
      await driver.morph("d", '<ocelle-disclosure id="d"></ocelle-disclosure>');
      return { mirror: await driver.attribute("d", "data-ocelle-moved-aria-label"), host: await driver.attribute("d", "aria-label"), name: await nameOf(driver, "d") };
    },
    expected: { mirror: "Show advanced settings", host: null, name: "Show advanced settings" },
  },
  {
    name: "FR-006: with no host label the summary is labelled by its .label wrapper and named by the summary text; a host aria-label clears the reference and names it; a host aria-labelledby wins; clearing each restores the next, ending at .label",
    run: async (driver) => {
      await driver.mount(`<span id="lab">Retention options</span>${page(disclosure("d", { summary: '<span id="d-s" slot="summary">Advanced <b>settings</b></span>' }))}`);
      const read = async (): Promise<unknown> => ({ references: await references(driver, "d", "ariaLabelledByElements"), name: await nameOf(driver, "d") });
      const plain = await read();
      await driver.setAttribute("d", "aria-label", "Show options");
      const labelled = await read();
      await driver.setAttribute("d", "aria-labelledby", "lab");
      const both = await read();
      await driver.setAttribute("d", "aria-labelledby", "");
      const labelAgain = await read();
      await driver.setAttribute("d", "aria-label", "");
      return { plain, labelled, both, labelAgain, restored: await read() };
    },
    expected: {
      plain: { references: ["span.label"], name: "Advanced settings" },
      labelled: { references: "none", name: "Show options" },
      both: { references: ["lab"], name: "Retention options" },
      labelAgain: { references: "none", name: "Show options" },
      restored: { references: ["span.label"], name: "Advanced settings" },
    },
  },
  {
    name: "FR-006: a host aria-label at upgrade names the summary, its .label reference cleared",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: ' aria-label="Show options"' })));
      return { references: await references(driver, "d", "ariaLabelledByElements"), name: await nameOf(driver, "d") };
    },
    expected: { references: "none", name: "Show options" },
  },
  {
    name: "Edge case: an empty summary with no host label gives a summary control with no name, its .label reference still set, beside the chevron shown (story-less, plan Complexity Tracking)",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { summary: "" })));
      const ax = await attempt(() => driver.axState("d", summary));
      return { role: ax === "absent" ? ax : ax.role, name: ax === "absent" ? ax : ax.name, references: await references(driver, "d", "ariaLabelledByElements"), chevron: tenth((await driver.box("d", chevron)).width) };
    },
    expected: { role: "DisclosureTriangle", name: "", references: ["span.label"], chevron: iconSize },
  },
  {
    name: "Edge case: a toggle of a nested disclosure fires one event that bubbles through the outer one, whose state does not change; a click on the outer summary then fires one event of its own",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { attributes: " open", panel: nestedPanel })));
      await driver.events("inner", [toggle]);
      await clickSummary(driver, "inner");
      await driver.settle();
      const records = (await driver.takeEvents()).filter((record) => record.type === toggle);
      const inner = { at: records.map((record) => record.at), targets: [...new Set(records.map((record) => record.target))], serials: new Set(records.map((record) => record.serial)).size, outer: await state(driver, "d"), inner: await state(driver, "inner") };
      await clickSummary(driver, "d");
      return { inner, control: await fired(driver) };
    },
    expected: {
      inner: { at: ["ocelle-disclosure#inner", "ocelle-disclosure#d", "body", "html", "document", "window"], targets: ["ocelle-disclosure#inner"], serials: 1, outer: openState, inner: openState },
      control: [{ target: "ocelle-disclosure#d", open: false }],
    },
  },
  {
    name: "Edge case: a disclosure with an empty panel opens on a summary click and still fires its event",
    run: async (driver) => {
      await driver.mount(page(disclosure("d", { panel: "" })));
      await driver.events("d", [toggle]);
      await clickSummary(driver, "d");
      return { state: await state(driver, "d"), events: await opens(driver) };
    },
    expected: { state: openState, events: [true] },
  },
];
