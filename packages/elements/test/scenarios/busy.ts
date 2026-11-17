// The shared bodies of User Story 3's browser scenarios, a busy `ocelle-button` (012 spec US3-1 to US3-11 and the edge
// cases of contracts/checks.md § Edge cases and plan decisions that belong to phase 4: both `disabled` and `busy`,
// `busy` removed while the pointer is down, decision 9's unavailable link, decision 26's activate event, `host.click()`,
// the stretched and the restyled host; FR-001, FR-003, FR-015 to FR-017; research.md R-06, R-07, R-12; plan decisions
// 9, 11, 18, 23 and 26; tasks.md T041).
//
// Three lists, each written against the driver:
// - `busyScenarios` run in both harnesses, in process on the element source (test/button.test.ts) and on the built
//   browser build on the strict-CSP fixture (test/browser/button.test.ts). The links they click are busy and have no
//   `href`, so no body of this list navigates even when a guard fails.
// - `busySinkScenarios` run in process only: the busy link on the navigation sink's records (research.md R-11).
// - `busyNavigationScenarios` run on the fixture only: the busy link on real navigation, new tabs and the server's
//   visits of `link-target.html` (scenarios/link.ts `Navigation`, which test/browser/button.test.ts implements).
// There is no conditional expect: each list's bodies assert what their harness observes.
//
// Expected values are written by hand: colours by token name from packages/tokens/test/expected.ts (`tokenColour`),
// forced colours from research.md R-12's table read as `resolveColour(<keyword>)` (a busy button `ButtonText`, a busy
// link `LinkText`), the spinner's timing from research.md R-07 (six turns of `--ocelle-motion-spin`, 800 ms, so one run
// of 4.8 s, linear, once, no fill mode), sizes from the slot convention (the 20 px icon size, the 8 px gap). The
// spinner is read in the shadow root by its wrapper `.spinner` and its drawing `.spinner svg`. A turning drawing's
// border box is the box of its rotated drawing, so a body that measures the spinner's layout box measures it still,
// under reduced motion (operator decision at phase 4, 2026-11-15, reviews/phase-4/notes.md). Every body ends with axe
// on its page (006's rule selection): no serious or critical result.
//
// Every "does not" outcome shares its body with the positive outcome it guards, and its plant is named here (run once
// and recorded in reviews/phase-4/plants.md):
// - a busy button delivers no `click` and no `ocelle-button-activate` (US3-1) beside the one of each after `busy` is
//   removed; plants: the guard limited to unavailable (no `disabled` check), no host listener;
// - the spinner and the label do not intersect (US3-5) beside the slot convention's gap between them; plant: the
//   spinner over the label (positioned on the label's box);
// - under reduced motion the spinner does not move (US3-6) beside its painted arc; plant: the `animation: none` rule
//   removed;
// - the icon is not shown while busy (US3-4) beside the spinner in its place; plant: the `.icon-slot[hidden]` rule
//   removed;
// - a busy link has no `href` and is not activated (US3-8) beside its focusable `role="link"` node and the `href` back
//   once `busy` is removed;
// - a stretched busy host has no area outside the inner control and is not activated (US3-10) beside its available
//   twin's one click; plant: the host restored to `display: inline-block`;
// - a click outside the inner control of a restyled busy host, or on its centre, delivers nothing (US3-11) beside its
//   available twin's one click at the centre; plant: no host listener.
import { tokenColour } from "./icon.ts";
import type { Scenario } from "./icon.ts";
import { dispatches, meaningful, severe } from "./button.ts";
import type { NavigationScenario } from "./link.ts";
import type { Box, Driver, EventRecord, Modifier, MouseButton, NavigationRecord, Palette, Pixels } from "./driver.ts";

export type { Scenario } from "./icon.ts";

/** The inner control of an `ocelle-button`, by its CSS part. */
const control = '[part="control"]';
/** The spinner's drawing in the shadow root, inside its wrapper `.spinner`. */
const spinner = ".spinner svg";
const activate = "ocelle-button-activate";
/** The page a link of the harness points to (the fixture server records each request for it). */
const target = "link-target.html";

/** The icon size, `--ocelle-icon-size` (1.25rem). */
const icon = 20;
/** The gap of the slot convention, `--ocelle-space-2`. */
const gap = 8;

const tenth = (value: number): number => Math.round(value * 10) / 10 + 0;
const wait = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

function inside(point: { x: number; y: number }, box: Box): boolean {
  return point.x >= box.x && point.x <= box.x + box.width && point.y >= box.y && point.y <= box.y + box.height;
}

/** Two boxes equal within half a pixel. */
function same(a: Box, b: Box): boolean {
  return Math.abs(a.x - b.x) <= 0.5 && Math.abs(a.y - b.y) <= 0.5 && Math.abs(a.width - b.width) <= 0.5 && Math.abs(a.height - b.height) <= 0.5;
}

/** Two boxes of the same size within half a pixel. */
function sameSize(a: Box, b: Box): boolean {
  return Math.abs(a.width - b.width) <= 0.5 && Math.abs(a.height - b.height) <= 0.5;
}

/** Whether two boxes share any area. */
function intersect(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

/** A box's size, rounded to a tenth of a pixel. */
function dimensions(box: Box): [number, number] {
  return [tenth(box.width), tenth(box.height)];
}

/** The click and activate dispatches at the element `id`. */
function counts(records: readonly EventRecord[], id: string): { readonly click: number; readonly auxclick: number; readonly activate: number } {
  return { click: dispatches(records, "click", id), auxclick: dispatches(records, "auxclick", id), activate: dispatches(records, activate, id) };
}

/** Two renderings with the same size and the same bytes. */
function samePixels(a: Pixels, b: Pixels): boolean {
  if (a.width !== b.width || a.height !== b.height || a.data.length !== b.data.length) return false;
  for (let at = 0; at < a.data.length; at += 1) if (a.data[at] !== b.data[at]) return false;
  return true;
}

/** The number of pixels within 48 of a colour (`rgb(r, g, b)`) on each channel: the painted ink of a drawing. */
function painted(pixels: Pixels, colour: string): number {
  const [r, g, b] = (colour.match(/\d+/g) ?? []).map(Number) as [number, number, number];
  let found = 0;
  for (let at = 0; at < pixels.data.length; at += 4) {
    const near = Math.abs((pixels.data[at] ?? 0) - r) <= 48 && Math.abs((pixels.data[at + 1] ?? 0) - g) <= 48 && Math.abs((pixels.data[at + 2] ?? 0) - b) <= 48;
    if (near) found += 1;
  }
  return found;
}

/** The attributes of the inner control that the busy scenarios read; absent ones are left out. */
const innerAttributes = ["href", "target", "rel", "download", "role", "tabindex", "disabled", "aria-disabled", "aria-busy"];

/** The inner control of the element `id`: its local name and the attributes of `innerAttributes` it carries. */
async function inner(driver: Driver, id: string): Promise<Record<string, string>> {
  const found = (await driver.elements(id)).filter((part) => part.attributes.part === "control");
  return Object.fromEntries([["tag", found.map((part) => part.name).join(",")], ...innerAttributes.flatMap((name) => found.flatMap((part) => (part.attributes[name] === undefined ? [] : [[name, part.attributes[name]] as const])))]);
}

/** The attributes of the spinner's drawing (its `svg`) in the shadow root of the element `id`, or null without one. */
async function drawing(driver: Driver, id: string): Promise<Readonly<Record<string, string>> | null> {
  const parts = await driver.elements(id);
  return parts.find((part) => part.name === "svg")?.attributes ?? null;
}

/** The AX state of the inner control that the busy scenarios compare. */
async function state(driver: Driver, id: string): Promise<Record<string, unknown>> {
  const found = await driver.axState(id, control);
  return { role: found.role, name: found.name, description: found.description, disabled: found.disabled, busy: found.busy, focusable: found.focusable };
}

/** The spinner's animation, as computed on its drawing. */
async function animation(driver: Driver, id: string): Promise<Record<string, string>> {
  const properties = ["animation-name", "animation-duration", "animation-iteration-count", "animation-timing-function", "animation-fill-mode"];
  return Object.fromEntries(await Promise.all(properties.map(async (property) => [property, await driver.computed(id, property, spinner)] as const)));
}

/** The ways US3-1 activates a button, each from a fresh mount. */
const activations = [
  { name: "a pointer click", act: (driver: Driver, id: string) => driver.click(id) },
  {
    name: "Enter on the focused button",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
  },
  {
    name: "Space on the focused button",
    act: async (driver: Driver, id: string) => {
      await driver.focus(id);
      await driver.press(" ");
    },
  },
  { name: "the element's click() method", act: (driver: Driver, id: string) => driver.callClick(id) },
] as const;

/** The clicks and the key of US3-8 on a busy link. */
const linkActions: readonly { readonly name: string; readonly act: (driver: Driver, id: string) => Promise<void> }[] = [
  { name: "plain", act: (driver, id) => driver.click(id) },
  ...(["Control", "Meta", "Shift", "Alt"] as const).map((modifier: Modifier) => ({ name: modifier, act: (driver: Driver, id: string) => driver.click(id, { modifiers: [modifier] }) })),
  { name: "middle", act: (driver, id) => driver.click(id, { button: "middle" as MouseButton }) },
  {
    name: "Enter",
    act: async (driver, id) => {
      await driver.focus(id);
      await driver.press("Enter");
    },
  },
];

/** The three page rules of spec § "Restyled host", on the element. */
const restyles = ["display: block;", "display: flex; width: 100%;", "display: block; height: 90px;"];

/** The forced-colours body of US3-7 for one palette. */
function forced(palette: Palette): Scenario {
  return {
    name: `US3-7, forced colours with the ${palette} palette: the spinner of a busy button is drawn in ButtonText and that of a busy link in LinkText, the control's own text colour, and stays visible at the icon size (FR-017; research.md R-12)`,
    run: async (driver) => {
      await driver.mount(`<p><ocelle-button id="b" busy>Saving</ocelle-button> <ocelle-button id="l" href="${target}" busy>Projects</ocelle-button></p>`);
      await driver.forcedColors("active", palette);
      await driver.reducedMotion("reduce");
      const keywords = ["ButtonText", "LinkText", "GrayText"];
      const resolved = await Promise.all(keywords.map((keyword) => driver.resolveColour(keyword)));
      const named = (value: string): string => keywords[resolved.indexOf(value)] ?? value;
      const read = async (id: string): Promise<unknown> => ({
        stroke: named(await driver.computed(id, "stroke", `${spinner} circle`)),
        ink: named(await driver.computed(id, "color", control)),
        size: dimensions(await driver.box(id, spinner)),
      });
      return { distinct: new Set(resolved).size, button: await read("b"), link: await read("l"), axe: await severe(driver) };
    },
    expected: {
      distinct: 3,
      button: { stroke: "ButtonText", ink: "ButtonText", size: [icon, icon] },
      link: { stroke: "LinkText", ink: "LinkText", size: [icon, icon] },
      axe: [],
    },
  };
}

/** The busy bodies both harnesses run. */
export const busyScenarios: readonly Scenario[] = [
  ...activations.map(
    ({ name, act }): Scenario => ({
      name: `US3-1, ${name}: a busy button is not activated (no click at a bubble-phase listener of the host or its ancestors, no ocelle-button-activate); after busy is removed the same activation delivers one click and one ocelle-button-activate (FR-003, FR-015, FR-023)`,
      run: async (driver) => {
        await driver.mount('<div id="wrap"><ocelle-button id="b" busy>Save</ocelle-button></div>');
        await driver.events("b", ["click", "auxclick", activate]);
        await act(driver, "b");
        const busy = counts(await driver.takeEvents(), "b");
        await driver.setAttribute("b", "busy", null);
        await act(driver, "b");
        const available = counts(await driver.takeEvents(), "b");
        return { busy, available, axe: await severe(driver) };
      },
      expected: { busy: { click: 0, auxclick: 0, activate: 0 }, available: { click: 1, auxclick: 0, activate: 1 }, axe: [] },
    }),
  ),
  {
    name: "US3-2: a focused button keeps focus when busy is set and when it is removed, in button and in link mode, reporting busy only while busy, and stays in the Tab and Shift+Tab order while busy (FR-003, FR-015)",
    run: async (driver) => {
      await driver.mount(`<button id="before" type="button">Before</button> <ocelle-button id="b">Save</ocelle-button> <ocelle-button id="l" href="${target}">Projects</ocelle-button> <button id="after" type="button">After</button>`);
      const found: Record<string, unknown> = {};
      for (const id of ["b", "l"]) {
        await driver.focus(id);
        const before = await driver.activeInner(id);
        await driver.setAttribute(id, "busy", "");
        const busy = await driver.activeInner(id);
        const reported = (await driver.axState(id, control)).busy;
        await driver.setAttribute(id, "busy", null);
        const after = await driver.activeInner(id);
        found[id] = { before, busy, reported, after, cleared: (await driver.axState(id, control)).busy };
      }
      await driver.setAttribute("b", "busy", "");
      await driver.setAttribute("l", "busy", "");
      return { found, forward: await driver.tabOrder(), reverse: await driver.tabOrder({ reverse: true }), axe: await severe(driver) };
    },
    expected: {
      found: { b: { before: "button", busy: "button", reported: true, after: "button", cleared: false }, l: { before: "a", busy: "a", reported: true, after: "a", cleared: false } },
      forward: [["button#before"], ["ocelle-button#b", "button"], ["ocelle-button#l", "a"], ["button#after"]],
      reverse: [["button#after"], ["ocelle-button#l", "a"], ["ocelle-button#b", "button"], ["button#before"]],
      axe: [],
    },
  },
  {
    name: 'US3-3: a busy button\'s inner control reports busy (aria-busy="true") and unavailable (aria-disabled="true", not the disabled attribute), keeps its name and description and stays focusable; the spinner is aria-hidden and adds no node to the tree; its available twin reports neither (FR-003, FR-015, FR-017)',
    run: async (driver) => {
      await driver.mount('<p id="why">Saving the project</p><p><ocelle-button id="b" busy aria-describedby="why">Save</ocelle-button> <ocelle-button id="n" aria-describedby="why">Save</ocelle-button></p>');
      await driver.reducedMotion("reduce");
      return {
        busy: { inner: await inner(driver, "b"), state: await state(driver, "b"), nodes: await meaningful(driver, "b"), drawn: (await drawing(driver, "b"))?.["aria-hidden"] ?? null, spinner: dimensions(await driver.box("b", spinner)) },
        available: { inner: await inner(driver, "n"), state: await state(driver, "n"), nodes: await meaningful(driver, "n") },
        subtree: (await driver.axSubtree("b")).filter((node) => !["generic", "StaticText", "paragraph"].includes(node.role)),
        axe: await severe(driver),
      };
    },
    expected: {
      busy: {
        inner: { tag: "button", "aria-disabled": "true", "aria-busy": "true" },
        state: { role: "button", name: "Save", description: "Saving the project", disabled: true, busy: true, focusable: true },
        nodes: [{ role: "button", name: "Save", description: "Saving the project" }],
        drawn: "true",
        spinner: [icon, icon],
      },
      available: {
        inner: { tag: "button" },
        state: { role: "button", name: "Save", description: "Saving the project", disabled: false, busy: false, focusable: true },
        nodes: [{ role: "button", name: "Save", description: "Saving the project" }],
      },
      subtree: [{ role: "button", name: "Save", description: "Saving the project" }],
      axe: [],
    },
  },
  ...(["ltr", "rtl"] as const).map(
    (direction): Scenario => ({
      name: `US3-4 (${direction}): on a button with a slotted icon, busy hides the icon and puts the spinner exactly in its box, and the button's box keeps its size, with a label and icon-only; removing busy brings the icon back and hides the spinner (FR-016)`,
      run: async (driver) => {
        await driver.mount(
          `<div dir="${direction}"><p><ocelle-button id="b"><ocelle-icon id="b-icon" slot="icon" name="folder"></ocelle-icon>Open project</ocelle-button></p>` +
            `<p><ocelle-button id="o" label="Close"><ocelle-icon id="o-icon" slot="icon" name="close"></ocelle-icon></ocelle-button></p></div>`,
        );
        await driver.reducedMotion("reduce");
        const found: Record<string, unknown> = {};
        for (const id of ["b", "o"]) {
          const [host, glyph, idle] = [await driver.box(id), await driver.box(`${id}-icon`), await driver.box(id, spinner)];
          await driver.setAttribute(id, "busy", "");
          const [busyHost, hiddenGlyph, shown] = [await driver.box(id), await driver.box(`${id}-icon`), await driver.box(id, spinner)];
          await driver.setAttribute(id, "busy", null);
          const [againHost, againGlyph, again] = [await driver.box(id), await driver.box(`${id}-icon`), await driver.box(id, spinner)];
          found[id] = {
            idle: { icon: dimensions(glyph), spinner: dimensions(idle) },
            busy: { host: sameSize(host, busyHost), icon: dimensions(hiddenGlyph), spinner: dimensions(shown), inIconPlace: same(shown, glyph) },
            again: { host: sameSize(host, againHost), icon: same(againGlyph, glyph), spinner: dimensions(again) },
          };
        }
        return { found, axe: await severe(driver) };
      },
      expected: {
        found: Object.fromEntries(
          ["b", "o"].map((id) => [
            id,
            {
              idle: { icon: [icon, icon], spinner: [0, 0] },
              busy: { host: true, icon: [0, 0], spinner: [icon, icon], inIconPlace: true },
              again: { host: true, icon: true, spinner: [0, 0] },
            },
          ]),
        ),
        axe: [],
      },
    }),
  ),
  ...(["ltr", "rtl"] as const).map(
    (direction): Scenario => ({
      name: `US3-5 (${direction}): on a busy button without an icon the spinner is ${direction === "ltr" ? "before (left of)" : "after (right of)"} the label, ${String(gap)} px from it, at the icon size, and the boxes of the spinner and the label do not intersect, still or turning, in the default and the compact size (FR-016)`,
      run: async (driver) => {
        await driver.mount(`<div dir="${direction}"><p><ocelle-button id="d" busy><span id="d-label">Saving</span></ocelle-button></p><p><ocelle-button id="c" size="compact" busy><span id="c-label">Saving</span></ocelle-button></p></div>`);
        const found: Record<string, unknown> = {};
        for (const id of ["d", "c"]) {
          const [text] = await driver.lines(`${id}-label`);
          const label = text === undefined ? { x: 0, y: 0, width: 0, height: 0, display: "" } : { ...text, display: "" };
          const turning: boolean[] = [];
          for (let read = 0; read < 5; read += 1) {
            turning.push(intersect(await driver.box(id, spinner), label));
            await wait(150);
          }
          await driver.reducedMotion("reduce");
          const box = await driver.box(id, spinner);
          await driver.reducedMotion("no-preference");
          const left = box.x < label.x;
          found[id] = { size: dimensions(box), side: left ? "left" : "right", gap: tenth(left ? label.x - (box.x + box.width) : box.x - (label.x + label.width)), intersect: intersect(box, label), turning };
        }
        return { found, axe: await severe(driver) };
      },
      expected: {
        found: Object.fromEntries(["d", "c"].map((id) => [id, { size: [icon, icon], side: direction === "ltr" ? "left" : "right", gap, intersect: false, turning: [false, false, false, false, false] }])),
        axe: [],
      },
    }),
  ),
  {
    name: "US3-6: under prefers-reduced-motion: reduce the spinner's animation-name is none and it stays still (the same pixels 400 ms apart) and visible: its arc is painted in the ink colour, where an available twin paints none (FR-017; research.md R-07)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-button id="s" busy label="Saving"></ocelle-button> <ocelle-button id="n" label="Saving"></ocelle-button></p>');
      await driver.reducedMotion("reduce");
      const ink = tokenColour("color-ink", "light");
      const first = await driver.pixels("s");
      await wait(400);
      const second = await driver.pixels("s");
      return {
        name: await driver.computed("s", "animation-name", spinner),
        size: dimensions(await driver.box("s", spinner)),
        still: samePixels(first, second),
        arc: painted(first, ink) >= 30,
        twin: painted(await driver.pixels("n"), ink),
        axe: await severe(driver),
      };
    },
    expected: { name: "none", size: [icon, icon], still: true, arc: true, twin: 0, axe: [] },
  },
  {
    name: "US3-9: with motion allowed the spinner's animation runs once, linear, for 4.8 s (six turns of --ocelle-motion-spin at 800 ms, within the 5 s limit), with no fill mode; after it ends the spinner shows the same still arc as under reduced motion (the same pixels) (FR-017; research.md R-07; plan decision 11)",
    run: async (driver) => {
      await driver.mount('<p><ocelle-button id="s" busy label="Saving"></ocelle-button></p>');
      await driver.reducedMotion("no-preference");
      const running = await animation(driver, "s");
      await wait(5200);
      const ended = await driver.pixels("s");
      await wait(300);
      const later = await driver.pixels("s");
      await driver.reducedMotion("reduce");
      const reduced = await driver.pixels("s");
      return { running, still: samePixels(ended, later), asReduced: samePixels(ended, reduced), axe: await severe(driver) };
    },
    expected: {
      running: { "animation-name": "ocelle-spin", "animation-duration": "4.8s", "animation-iteration-count": "1", "animation-timing-function": "linear", "animation-fill-mode": "none" },
      still: true,
      asReduced: true,
      axe: [],
    },
  },
  ...(["light", "dark"] as const).map(forced),
  {
    name: 'US3-8, decision 9: a busy link-mode button renders <a role="link" tabindex="0" aria-disabled="true" aria-busy="true"> with no href, target, rel or download, is one node of role link reported busy and unavailable, focusable and in the Tab order; a plain, Ctrl, Meta, Shift, Alt or middle click and Enter deliver no click, auxclick or ocelle-button-activate; removing busy brings the href and the link\'s attributes back and drops the tabindex (FR-003, FR-015, FR-021)',
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><button id="before" type="button">Before</button> <ocelle-button id="l" href="${target}" target="_blank" download="x" busy>Projects</ocelle-button></div>`);
      await driver.events("l", ["click", "auxclick", activate]);
      const found: Record<string, unknown> = {};
      for (const { name, act } of linkActions) {
        await act(driver, "l");
        found[name] = counts(await driver.takeEvents(), "l");
      }
      await driver.focus("l");
      const result = {
        inner: await inner(driver, "l"),
        state: await state(driver, "l"),
        nodes: await meaningful(driver, "l"),
        focused: await driver.activeInner("l"),
        found,
        forward: await driver.tabOrder(),
        axe: await severe(driver),
      };
      await driver.setAttribute("l", "busy", null);
      return { ...result, available: await inner(driver, "l") };
    },
    expected: {
      inner: { tag: "a", role: "link", tabindex: "0", "aria-disabled": "true", "aria-busy": "true" },
      state: { role: "link", name: "Projects", description: "", disabled: true, busy: true, focusable: true },
      nodes: [{ role: "link", name: "Projects" }],
      focused: "a",
      found: Object.fromEntries(linkActions.map(({ name }) => [name, { click: 0, auxclick: 0, activate: 0 }])),
      forward: [["button#before"], ["ocelle-button#l", "a"]],
      axe: [],
      available: { tag: "a", href: target, target: "_blank", rel: "noopener", download: "x" },
    },
  },
  {
    name: "Edge case, both disabled and busy: disabled wins: the button is out of the Tab order, reported disabled and not busy, shows no spinner and keeps its icon, and a pointer click or its click() delivers nothing; a busy twin is in the order with its spinner (FR-015)",
    run: async (driver) => {
      await driver.mount(
        '<div id="wrap"><button id="before" type="button">Before</button> <ocelle-button id="d" disabled busy><ocelle-icon id="d-icon" slot="icon" name="folder"></ocelle-icon>Save</ocelle-button> <ocelle-button id="u" busy><ocelle-icon id="u-icon" slot="icon" name="folder"></ocelle-icon>Save</ocelle-button></div>',
      );
      await driver.reducedMotion("reduce");
      await driver.events("d", ["click", "auxclick", activate]);
      await driver.click("d");
      await driver.callClick("d");
      const records = (await driver.takeEvents()).length;
      return {
        disabled: { inner: await inner(driver, "d"), state: await state(driver, "d"), spinner: dimensions(await driver.box("d", spinner)), icon: dimensions(await driver.box("d-icon")) },
        busy: { inner: await inner(driver, "u"), spinner: dimensions(await driver.box("u", spinner)), icon: dimensions(await driver.box("u-icon")) },
        records,
        forward: await driver.tabOrder(),
        axe: await severe(driver),
      };
    },
    expected: {
      disabled: { inner: { tag: "button", disabled: "" }, state: { role: "button", name: "Save", description: "", disabled: true, busy: false, focusable: false }, spinner: [0, 0], icon: [icon, icon] },
      busy: { inner: { tag: "button", "aria-disabled": "true", "aria-busy": "true" }, spinner: [icon, icon], icon: [0, 0] },
      records: 0,
      forward: [["button#before"], ["ocelle-button#u", "button"]],
      axe: [],
    },
  },
  {
    name: "Edge case, busy removed while the pointer is down: the click completing after busy is removed is delivered once with one ocelle-button-activate; one completing after busy is set is not delivered (FR-015)",
    run: async (driver) => {
      await driver.mount('<div id="wrap"><ocelle-button id="b" busy>Save</ocelle-button></div>');
      await driver.events("b", ["click", activate]);
      await driver.pointerDown("b");
      await driver.setAttribute("b", "busy", null);
      await driver.pointerUp("b");
      const removed = counts(await driver.takeEvents(), "b");
      await driver.pointerDown("b");
      await driver.setAttribute("b", "busy", "");
      await driver.pointerUp("b");
      const set = counts(await driver.takeEvents(), "b");
      return { removed, set, axe: await severe(driver) };
    },
    expected: { removed: { click: 1, auxclick: 0, activate: 1 }, set: { click: 0, auxclick: 0, activate: 0 }, axe: [] },
  },
  {
    name: "US3-10: in a flex row beside a taller sibling and in a two-column grid with a taller cell, a busy button's inner control fills its host and a click 4 px inside the host's bottom edge activates nothing, while its available twin is activated once (FR-001, FR-003)",
    run: async (driver) => {
      await driver.mount(
        '<div id="row"><div class="tall"></div><ocelle-button id="row-on">Save</ocelle-button><ocelle-button id="row-busy" busy>Save</ocelle-button></div>' +
          '<div id="grid"><div class="tall"></div><ocelle-button id="grid-on">Save</ocelle-button><div class="tall"></div><ocelle-button id="grid-busy" busy>Save</ocelle-button></div>',
      );
      await driver.rules("#row { display: flex; gap: 8px; } #grid { display: grid; grid-template-columns: 1fr 1fr; inline-size: 400px; gap: 8px; } .tall { block-size: 120px; inline-size: 20px; }");
      const found: Record<string, unknown> = {};
      for (const id of ["row-on", "row-busy", "grid-on", "grid-busy"]) {
        const host = await driver.box(id);
        const innerBox = await driver.box(id, control);
        await driver.events(id, ["click", activate]);
        await driver.click(id, { position: { x: host.width / 2, y: host.height - 4 } });
        const { click, activate: activated } = counts(await driver.takeEvents(), id);
        found[id] = { filled: same(host, innerBox), tall: host.height >= 120, click, activate: activated };
      }
      return { found, axe: await severe(driver) };
    },
    expected: {
      found: {
        "row-on": { filled: true, tall: true, click: 1, activate: 1 },
        "row-busy": { filled: true, tall: true, click: 0, activate: 0 },
        "grid-on": { filled: true, tall: true, click: 1, activate: 1 },
        "grid-busy": { filled: true, tall: true, click: 0, activate: 0 },
      },
      axe: [],
    },
  },
  ...restyles.map(
    (rule): Scenario => ({
      name: `US3-11, page rule "${rule}" on the element in a 400 px container: both outside points lie outside the inner control and a click there activates neither the available nor the busy button; a click on the inner control's centre activates the available one once and not the busy one (FR-001, FR-003)`,
      run: async (driver) => {
        await driver.mount('<div class="box"><ocelle-button id="on">Save</ocelle-button></div><div class="box"><ocelle-button id="busy" busy>Save</ocelle-button></div>');
        await driver.rules(`.box { inline-size: 400px; } #on, #busy { ${rule} }`);
        const found: Record<string, unknown> = {};
        for (const id of ["on", "busy"]) {
          const host = await driver.box(id);
          const innerBox = await driver.box(id, control);
          const points = [
            { x: host.width - 4, y: host.height / 2 },
            { x: host.width / 2, y: host.height - 4 },
          ];
          const outside = points.map((point) => !inside({ x: host.x + point.x, y: host.y + point.y }, innerBox));
          await driver.events(id, ["click", activate]);
          for (const position of points) await driver.click(id, { position });
          const atPoints = counts(await driver.takeEvents(), id);
          await driver.click(id, { inner: control });
          found[id] = { outside, atPoints, centre: counts(await driver.takeEvents(), id) };
        }
        return { found, axe: await severe(driver) };
      },
      expected: {
        found: {
          on: { outside: [true, true], atPoints: { click: 0, auxclick: 0, activate: 0 }, centre: { click: 1, auxclick: 0, activate: 1 } },
          busy: { outside: [true, true], atPoints: { click: 0, auxclick: 0, activate: 0 }, centre: { click: 0, auxclick: 0, activate: 0 } },
        },
        axe: [],
      },
    }),
  ),
  ...(["light", "dark"] as const).map(
    (theme): Scenario => ({
      name: `Busy look (${theme}): a busy primary, secondary, quiet and flush button keeps its variant's idle fill, border and label colour (data-model.md § ocelle-button), and the spinner takes the label colour (currentColor) (FR-017)`,
      run: async (driver) => {
        const kinds = [
          ["primary", ' variant="primary"'],
          ["secondary", ""],
          ["quiet", ' variant="quiet"'],
          ["flush", " flush"],
        ] as const;
        await driver.mount(`<div class="ground">${kinds.map(([kind, attributes]) => `<p><ocelle-button id="${kind}-busy"${attributes} busy>Save</ocelle-button> <ocelle-button id="${kind}"${attributes}>Save</ocelle-button></p>`).join("")}<p id="away">Away</p></div>`);
        await driver.rules(".ground { background-color: var(--ocelle-color-canvas); color: var(--ocelle-color-ink); padding: 8px; }");
        await driver.theme(theme);
        await driver.hover("away");
        const look = async (id: string): Promise<unknown> => ({ fill: await driver.computed(id, "background-color", control), border: await driver.computed(id, "border-top-color", control), ink: await driver.computed(id, "color", control) });
        const found: Record<string, unknown> = {};
        for (const [kind] of kinds) found[kind] = { same: JSON.stringify(await look(`${kind}-busy`)) === JSON.stringify(await look(kind)), stroke: await driver.computed(`${kind}-busy`, "stroke", `${spinner} circle`) };
        return { found, axe: await severe(driver) };
      },
      expected: {
        found: {
          primary: { same: true, stroke: tokenColour("color-on-accent", theme) },
          secondary: { same: true, stroke: tokenColour("color-ink", theme) },
          quiet: { same: true, stroke: tokenColour("color-ink", theme) },
          flush: { same: true, stroke: tokenColour("color-ink", theme) },
        },
        axe: [],
      },
    }),
  ),
];

/** The sink's record of a plain activation of a link to `link-target.html`. */
const plainNavigation: NavigationRecord = { type: "click", defaultPrevented: false, button: 0, altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, href: target };

/** The busy link bodies on the navigation sink's records, in process only. */
export const busySinkScenarios: readonly Scenario[] = [
  {
    name: "US3-8 (sink): a plain, Ctrl, Meta, Shift, Alt or middle click and Enter on a busy link deliver no click, auxclick or activate event and leave the sink nothing; after busy is removed a click gives one click, one activate event and one record of the link's href (FR-003, FR-015)",
    run: async (driver) => {
      await driver.mount(`<div id="wrap"><ocelle-button id="l" href="${target}" busy>Projects</ocelle-button></div>`);
      await driver.events("l", ["click", "auxclick", activate]);
      for (const { act } of linkActions) await act(driver, "l");
      const busy = { records: (await driver.takeEvents()).length, navigations: await driver.navigations() };
      await driver.setAttribute("l", "busy", null);
      await driver.click("l");
      return { busy, available: counts(await driver.takeEvents(), "l"), navigations: await driver.navigations() };
    },
    expected: { busy: { records: 0, navigations: [] }, available: { click: 1, auxclick: 0, activate: 1 }, navigations: [plainNavigation] },
  },
];

/** The busy link bodies on real navigation, on the fixture only. */
export const busyNavigationScenarios: readonly NavigationScenario[] = [
  {
    name: "US3-8 (fixture): a plain, Ctrl, Meta, Shift, Alt or middle click and Enter on a busy link navigate nowhere, open no tab or window and download nothing; after busy is removed a click navigates the page",
    run: async (driver, nav) => {
      const found: Record<string, unknown> = {};
      for (const { name, act } of linkActions) {
        await driver.mount(`<ocelle-button id="l" href="${target}" busy>Projects</ocelle-button>`);
        await act(driver, "l");
        found[name] = await nav.outcome();
      }
      await driver.mount(`<ocelle-button id="l" href="${target}" busy>Projects</ocelle-button>`);
      await driver.setAttribute("l", "busy", null);
      await driver.click("l");
      found.available = await nav.outcome();
      return found;
    },
    expected: {
      ...Object.fromEntries(linkActions.map(({ name }) => [name, { page: "button.html", tabs: [], visits: 0 }])),
      available: { page: target, tabs: [], visits: 1 },
    },
  },
];
