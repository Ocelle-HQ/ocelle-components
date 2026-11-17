// The shared bodies of User Story 3's browser scenarios for `ocelle-segmented-choice` and `ocelle-segment` (014 spec
// US3 scenarios 1 to 19 and the segmented choice's Edge Cases; research.md R-01, R-03 to R-06, R-10, R-15;
// contracts/elements.md § Pairings; T062). Each body mounts its page, acts with real keyboard and pointer input through
// the driver, sets up and reads what the driver has no command for with a self-contained function run in the page
// (`InPage`: the event recorder, the segments' radii and rows, the children's attributes) and returns one observation;
// each harness asserts it equals `expected`, written by hand from the spec, the data model and research (colours from
// the token table of packages/tokens/test/expected.ts; sizes from the tokens: `--ocelle-target-min` 44 px,
// `--ocelle-border-width` 1 px, `--ocelle-bar-width` 3 px, `--ocelle-radius-2` 4 px, `--ocelle-space-2` 8 px,
// `--ocelle-focus-width` 3 px at `--ocelle-focus-offset` 2 px). Every "does not" outcome is observed in the same body
// as the positive outcome it guards, with the setup that makes it falsifiable; the plant that makes each fail is named
// beside the body and run once in reviews/phase-4/plants.md. The in-process harness (test/segmented-choice.test.ts)
// runs every body; the fixture harness (test/browser/segmented-choice.test.ts) runs the bodies marked `fixture`.
//
// The group `#sc` sits in `#box`, a plain block the bodies resize (the driver's `resize` sets its inline size through
// the CSSOM, without waiting for a frame) and screenshot; a host rule pads `#box` by 12 px, so a focus ring (2 to 5 px
// outside a segment) and the group's outer lines lie inside its screenshot. The joined measurements read the segments'
// computed corner radii after the delivery of the resize observations (`afterResizeDelivery` on `#box`, a
// `ResizeObserver` registered after the element rendered, whose callback runs after the element's own in the same
// delivery; reviews/phase-4/measure.md). The widths at which the joined group fits on one row or wraps are measured on
// the rendered segments, so they hold in both harnesses whatever font is loaded.
//
// Lines are read from pixels (research.md R-15, "What the tests read"): across a boundary, in a window around it (1 CSS
// px either side of a line between neighbours, so a focused neighbour's ring, 2 px out, is never in it; 2 px at an
// outer edge), the first pixel in one of the line colours and the length of its run in CSS px. One shared line of
// `--ocelle-border-width` is a run of 1; the pressed segment's block-end edge, its 3 px bar inside its box above its
// 1 px line, is a run of 4 in `accent-strong`.
import { tokenColour } from "./icon.ts";
import type { AxState, Driver, Focused, InPage, Pixels, Target } from "./driver.ts";

/** One body: what it checks, what it must observe, and whether the fixture harness runs it too. */
export interface SegmentedChoiceScenario {
  readonly name: string;
  readonly run: (driver: Driver, inPage: InPage) => Promise<unknown>;
  readonly expected: unknown;
  readonly fixture: boolean;
}

const lanes = ["All", "Mine", "Blocked", "Done"];

/** One segment's markup: `value` is the lower-case name unless `values` is false. */
function segmentOf(name: string, options: { readonly disabled?: boolean; readonly values?: boolean } = {}): string {
  const value = options.values === false ? "" : ` value="${name.toLowerCase()}"`;
  return `<ocelle-segment${value}${options.disabled === true ? " disabled" : ""}>${name}</ocelle-segment>`;
}

/** The segments of `names`, `disabled` the indexes of disabled segments. */
function segmentsOf(names: readonly string[], disabled: readonly number[] = [], values = true): string {
  return names.map((name, index) => segmentOf(name, { disabled: disabled.includes(index), values })).join("");
}

/** The page of most bodies: a button before `#box`, the group `#sc` in `#box`, a button after it and plain text away from it. */
function page(inner: string, attributes = 'label="Lane filter"'): string {
  return `<button id="before" type="button">Before</button><div id="box"><ocelle-segmented-choice id="sc" ${attributes}>${inner}</ocelle-segmented-choice></div><button id="after" type="button">After</button><p id="away">Away from the group</p>`;
}

/** The `index`-th segment of `#sc` (or of `parent`), as a driver target and as the driver names it when focused. */
function seg(index: number, parent = "sc"): Target & Focused {
  return { parent, kind: "ocelle-segment", index };
}

const after: Focused = { id: "after" };
const before: Focused = { id: "before" };

/** Mounts `markup`, pads `#box`, scrolls the page to its start and moves the pointer onto the plain text away from the group. */
async function mount(driver: Driver, inPage: InPage, markup: string): Promise<void> {
  await driver.mount(markup);
  await driver.rules("#box { padding: 12px; }");
  await inPage(() => {
    window.scrollTo(0, 0);
  }, null);
  if (markup.includes('id="away"')) await driver.hoverTarget("away");
}

/**
 * Records every `ocelle-segmented-choice-change` at the document on `window.__events`: its type, `detail` (a copy),
 * `bubbles`, `composed`, `cancelable`, the target's id and the target's `value` at dispatch (FR-002). A second call
 * replaces the first's listener.
 */
function recordEvents(): void {
  const scope = window as unknown as { __events: unknown[]; __eventsOff?: () => void };
  scope.__eventsOff?.();
  const events: unknown[] = [];
  scope.__events = events;
  const listener = (event: Event): void => {
    const custom = event as CustomEvent<unknown>;
    const target = custom.target as (Element & { value?: unknown }) | null;
    events.push({
      type: custom.type,
      detail: JSON.parse(JSON.stringify(custom.detail ?? null)) as unknown,
      bubbles: custom.bubbles,
      composed: custom.composed,
      cancelable: custom.cancelable,
      target: target?.id ?? null,
      value: target?.value ?? null,
    });
  };
  document.addEventListener("ocelle-segmented-choice-change", listener);
  scope.__eventsOff = () => {
    document.removeEventListener("ocelle-segmented-choice-change", listener);
  };
}

/** A copy of the events `recordEvents` recorded. */
function recordedEvents(): unknown {
  return JSON.parse(JSON.stringify((window as unknown as { __events?: unknown[] }).__events ?? [])) as unknown;
}

/** A change event as `recordEvents` records it, on `#sc`. */
function change(value: string, target = "sc"): unknown {
  return { type: "ocelle-segmented-choice-change", detail: { value }, bubbles: true, composed: true, cancelable: false, target, value };
}

/** The `value` property of the element with `id`, as a string, or null when it has none. */
function valueOf(id: string): string | null {
  const value = (document.getElementById(id) as unknown as { value?: unknown } | null)?.value;
  return typeof value === "string" ? value : null;
}

/** The `tabindex` attribute of each `ocelle-segment` child of the element with `id`. */
function tabindexes(id: string): (string | null)[] {
  return [...(document.getElementById(id)?.children ?? [])].filter((child) => child.localName === "ocelle-segment").map((child) => child.getAttribute("tabindex"));
}

/** The interactive roles; any other node of the group's subtree is text or structure. */
const interactiveRoles = new Set(["listbox", "option", "button", "link", "textbox", "searchbox", "checkbox", "radio", "switch", "combobox", "slider", "spinbutton", "tab", "tablist", "tabpanel", "menu", "menuitem", "toolbar", "tree", "treeitem", "grid", "gridcell"]);

/** An exposed node as the scenarios state it: role and name, the toolbar's orientation, a button's pressed and disabled. */
interface Exposed {
  readonly role: string;
  readonly name: string;
  readonly orientation?: string;
  readonly pressed?: boolean;
  readonly disabled?: boolean;
}

/** The interactive nodes of the accessibility subtree of `id`, in tree order. */
async function tree(driver: Driver, id = "sc"): Promise<Exposed[]> {
  const nodes = await driver.axStates(id, "subtree");
  return nodes
    .filter((node: AxState) => interactiveRoles.has(node.role))
    .map((node) => {
      if (node.role === "toolbar") return { role: node.role, name: node.name, orientation: node.orientation ?? "" };
      if (node.role === "button") return { role: node.role, name: node.name, pressed: node.pressed === true, disabled: node.disabled === true };
      return { role: node.role, name: node.name };
    });
}

/** A toolbar named `name` (horizontal) with toggle buttons `names`, the `pressed` one pressed, the `disabled` ones disabled. */
function exposed(name: string, names: readonly string[], pressed: number | null = 0, disabled: readonly number[] = []): Exposed[] {
  return [{ role: "toolbar", name, orientation: "horizontal" }, ...names.map((each, index) => ({ role: "button", name: each, pressed: index === pressed, disabled: disabled.includes(index) }))];
}

/** How many nodes of the subtree of `id` carry a `selected` state, and how many of its elements an `aria-selected` attribute. */
async function selection(driver: Driver, inPage: InPage, id = "sc"): Promise<unknown> {
  const states = (await driver.axStates(id, "subtree")).filter((node) => node.selected !== undefined).length;
  const attributes = await inPage((host) => document.getElementById(host)?.querySelectorAll("[aria-selected]").length ?? -1, id);
  return { states, attributes };
}

/** Waits for two animation frames and a task in the page. */
function frames(): Promise<void> {
  return new Promise((done) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(done, 0);
      });
    });
  });
}

/** Starts counting the mutations of the subtree of the element with `id` (attributes, child lists, text). */
function countMutations(id: string): void {
  const scope = window as unknown as { __counter?: { observer: MutationObserver; count: number } };
  scope.__counter?.observer.disconnect();
  const counter = { observer: new MutationObserver((records) => (counter.count += records.length)), count: 0 };
  const element = document.getElementById(id);
  if (element !== null) counter.observer.observe(element, { subtree: true, attributes: true, childList: true, characterData: true });
  scope.__counter = counter;
}

/** The mutations counted since the last call (or since `countMutations`), pending records included. */
function mutations(): number {
  const counter = (window as unknown as { __counter?: { observer: MutationObserver; count: number } }).__counter;
  if (counter === undefined) return -1;
  const count = counter.count + counter.observer.takeRecords().length;
  counter.count = 0;
  return count;
}

/** The computed corner radii of each `ocelle-segment` child of `#sc`: start-start, start-end, end-end, end-start. */
function radii(): string[][] {
  return [...(document.getElementById("sc")?.children ?? [])]
    .filter((child) => child.localName === "ocelle-segment")
    .map((child) => {
      const style = getComputedStyle(child);
      return [style.borderStartStartRadius, style.borderStartEndRadius, style.borderEndEndRadius, style.borderEndStartRadius];
    });
}

const r = "4px";
const z = "0px";
/** Rounded start corners, rounded end corners, both, none (in the order `radii` reads them). */
const startRound = [r, z, z, r];
const endRound = [z, r, r, z];
const bothRound = [r, r, r, r];
const square = [z, z, z, z];

/** The row of each `ocelle-segment` child of `#sc`, numbered from 0 by its distinct `offsetTop`. */
function rows(): number[] {
  const tops = [...(document.getElementById("sc")?.children ?? [])].filter((child) => child.localName === "ocelle-segment").map((child) => (child as HTMLElement).offsetTop);
  const distinct = [...new Set(tops)].sort((a, b) => a - b);
  return tops.map((top) => distinct.indexOf(top));
}

/** Whether `#sc` or any of its children carries a `style` attribute. */
function styleAttributes(): boolean[] {
  const host = document.getElementById("sc");
  return [host?.hasAttribute("style") ?? true, ...[...(host?.children ?? [])].map((child) => child.hasAttribute("style"))];
}

/**
 * The widths of `#box`'s content at which the joined group fits on one row, and at which All, Mine and Blocked fit on
 * row 1 and Done wraps alone to row 2, measured on the segments as they lie on one row: the inline end of each segment
 * from the start of `#box`'s content box.
 */
function widths(): { oneRow: number; twoRows: number } {
  const box = document.getElementById("box");
  const segments = [...(document.getElementById("sc")?.children ?? [])].filter((child) => child.localName === "ocelle-segment");
  if (box === null) return { oneRow: 0, twoRows: 0 };
  const start = box.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(box).paddingLeft);
  const ends = segments.map((each) => each.getBoundingClientRect().right - start);
  const third = ends[2] ?? 0;
  const fourth = ends[3] ?? 0;
  return { oneRow: Math.ceil(fourth) + 16, twoRows: Math.ceil(third) + Math.floor((fourth - third) / 2) };
}

/** Waits for a task in the page. */
function task(): Promise<void> {
  return new Promise((done) => {
    setTimeout(done, 0);
  });
}

/**
 * Resizes `#box` in an ordinary task without waiting for a frame, then waits for the delivery of the resize
 * observations (US3-10). The wait for a task comes first: the previous `afterResizeDelivery` resolves inside a
 * `ResizeObserver` callback, and a resize made in that callback's microtask would itself be a resize during the
 * delivery (changed after the red run, reviews/phase-4/notes.md).
 */
async function resized(driver: Driver, inPage: InPage, width: number): Promise<void> {
  await inPage(task, undefined);
  await driver.resize("box", width);
  await driver.afterResizeDelivery("box");
}

/** Sets the inline size of `#box` wide enough for one row and waits for the group to lay out, then measures `widths`. */
async function measured(driver: Driver, inPage: InPage): Promise<{ oneRow: number; twoRows: number }> {
  await resized(driver, inPage, 640);
  return inPage(widths, null);
}

/** A screenshot of `#box`, with its place in the viewport and its device-pixel scale. */
interface Shot {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly image: Pixels;
}

async function shot(driver: Driver): Promise<Shot> {
  const box = await driver.box("box");
  const image = await driver.pixels("box");
  return { x: box.x, y: box.y, scale: image.width / box.width, image };
}

function colourAt(s: Shot, deviceX: number, deviceY: number): string {
  const offset = (deviceY * s.image.width + deviceX) * 4;
  return `rgb(${String(s.image.data[offset])}, ${String(s.image.data[offset + 1])}, ${String(s.image.data[offset + 2])})`;
}

/** A run of one line colour across a boundary: its colour and its length in CSS px. */
interface Run {
  readonly colour: string;
  readonly width: number;
}

/**
 * The run of line colour crossing a boundary: scanning along `axis` from `from` to `to` (viewport CSS px) at the fixed
 * other coordinate `at`, the first pixel in one of `colours` and the number of pixels after it of the same colour, in
 * CSS px; `{ colour: "none", width: 0 }` when no pixel of the window is in a line colour.
 */
function lineRun(s: Shot, axis: "x" | "y", at: number, from: number, to: number, colours: readonly string[]): Run {
  const fixed = Math.floor((at - (axis === "x" ? s.y : s.x)) * s.scale);
  const origin = axis === "x" ? s.x : s.y;
  const first = Math.floor((from - origin) * s.scale);
  const last = Math.floor((to - origin) * s.scale);
  const read = (along: number): string => (axis === "x" ? colourAt(s, along, fixed) : colourAt(s, fixed, along));
  for (let along = first; along <= last; along++) {
    const colour = read(along);
    if (!colours.includes(colour)) continue;
    let length = 0;
    while (along + length <= last + 8 && read(along + length) === colour) length++;
    return { colour, width: length / s.scale };
  }
  return { colour: "none", width: 0 };
}

/**
 * The opaque colour `top` (a computed `rgb()` or `rgba()`) paints over the opaque `ground`: each channel
 * `alpha × top + (1 − alpha) × ground`, rounded, as `rgb(r, g, b)`.
 */
function over(top: string, ground: string): string {
  const channels = (colour: string): number[] => (colour.match(/[\d.]+/g) ?? []).map(Number);
  const [r = 0, g = 0, b = 0, alpha = 1] = channels(top);
  const [gr = 0, gg = 0, gb = 0] = channels(ground);
  const mix = (front: number, back: number): string => String(Math.round(alpha * front + (1 - alpha) * back));
  return `rgb(${mix(r, gr)}, ${mix(g, gg)}, ${mix(b, gb)})`;
}

const accentLight = tokenColour("color-accent-strong", "light");
const accentDark = tokenColour("color-accent-strong", "dark");
const borderLight = tokenColour("color-control-border", "light");
const lowLight = tokenColour("color-accent-low", "light");
const lowDark = tokenColour("color-accent-low", "dark");
const hoverLight = tokenColour("color-hover-bg", "light");
const transparent = "rgba(0, 0, 0, 0)";
const lineColours = [accentLight, borderLight];
const longLabel = "A lane filter whose name is much longer than the group is wide, so that it wraps inside the segment onto further lines";

/** The boxes of the segments of `#sc`. */
async function boxes(driver: Driver, count: number): Promise<{ x: number; y: number; width: number; height: number }[]> {
  const out: { x: number; y: number; width: number; height: number }[] = [];
  for (let index = 0; index < count; index++) {
    const { x, y, width, height } = await driver.box(seg(index));
    out.push({ x, y, width, height });
  }
  return out;
}

/**
 * The lines of a one-row joined group of four, read from one screenshot: the line between each pair of neighbours, and
 * the block-start, block-end and inline-start edges of the `edge`-th segment.
 */
async function joinedLines(driver: Driver, edge: number): Promise<unknown> {
  const s = await shot(driver);
  const b = await boxes(driver, 4);
  const between = [1, 2, 3].map((index) => {
    const left = b[index - 1];
    const right = b[index];
    if (left === undefined || right === undefined) return null;
    return lineRun(s, "x", left.y + left.height / 2, right.x - 1, right.x + 1, lineColours);
  });
  const e = b[edge];
  if (e === undefined) return null;
  const centre = e.x + e.width / 2;
  return {
    between,
    top: lineRun(s, "y", centre, e.y - 2, e.y + 2, lineColours),
    bottom: lineRun(s, "y", centre, e.y + e.height - 6, e.y + e.height + 2, lineColours),
    start: lineRun(s, "x", e.y + e.height / 2, e.x - 2, e.x + 2, lineColours),
  };
}

const line = (colour: string, width = 1): Run => ({ colour, width });

/**
 * The colour of the pixel 3.5 CSS px outside the middle of each edge of the `index`-th segment of `#sc` (inside the
 * ring band, 2 to 5 px out), top, right, bottom and left, read from a screenshot of `#box`.
 */
async function ringPixels(driver: Driver, index: number): Promise<string[]> {
  const s = await shot(driver);
  const box = await driver.box(seg(index));
  const at = (cssX: number, cssY: number): string => colourAt(s, Math.floor((cssX - s.x) * s.scale), Math.floor((cssY - s.y) * s.scale));
  const out = 3.5;
  return [at(box.x + box.width / 2, box.y - out), at(box.x + box.width + out, box.y + box.height / 2), at(box.x + box.width / 2, box.y + box.height + out), at(box.x - out, box.y + box.height / 2)];
}

/** The ring of a focused segment: its `::after` border on each side, width and colour. */
async function ring(driver: Driver, target: Target): Promise<unknown> {
  const out: string[] = [];
  for (const side of ["top", "right", "bottom", "left"]) out.push(`${await driver.computedPart(target, "::after", `border-${side}-width`)} ${await driver.computedPart(target, "::after", `border-${side}-color`)}`);
  return out;
}

/** The default variant's paint of the `index`-th segment of `#sc`: fill, border widths and colours (top, right, bottom, left) and radii. */
function paintOf(index: number): unknown {
  const child = [...(document.getElementById("sc")?.children ?? [])].filter((each) => each.localName === "ocelle-segment")[index];
  if (child === undefined) return null;
  const style = getComputedStyle(child);
  const sides = ["top", "right", "bottom", "left"];
  return {
    fill: style.backgroundColor,
    widths: sides.map((side) => style.getPropertyValue(`border-${side}-width`)),
    colours: sides.map((side) => style.getPropertyValue(`border-${side}-color`)),
    radii: [style.borderStartStartRadius, style.borderStartEndRadius, style.borderEndEndRadius, style.borderEndStartRadius],
  };
}

/** The default variant's paint: `width` px borders in `colour` on every side, `fill`, and every corner at `--ocelle-radius-2`. */
function paint(fill: string, width: string, colour: string): unknown {
  return { fill, widths: [width, width, width, width], colours: [colour, colour, colour, colour], radii: [r, r, r, r] };
}

/** How a host changes the focused, pressed Mine and sets `value` in one task (the R1-01 case of phase 2, for segments). */
interface ChangeAndSet {
  readonly change: "remove" | "move";
  readonly by: "property" | "attribute";
}

/** In one task: removes Mine from `#sc`, or moves it to the end, then sets the group's `value` to `all`. */
function changeAndSet(how: ChangeAndSet): void {
  const group = document.getElementById("sc") as (HTMLElement & { value: string }) | null;
  const mine = group?.querySelector('ocelle-segment[value="mine"]');
  if (group === null || mine === null || mine === undefined) return;
  if (how.change === "remove") mine.remove();
  else group.append(mine);
  if (how.by === "property") group.value = "all";
  else group.setAttribute("value", "all");
}

const changesAndSets: readonly ChangeAndSet[] = (["remove", "move"] as const).flatMap((change) => (["property", "attribute"] as const).map((by) => ({ change, by })));

/**
 * How a host re-renders the focused segment on its blur (contracts § Pairings, "Tab out while the host re-renders on
 * blur"): installs, once, a host `focusout` listener on `#sc` that moves the blurred segment to the end, or removes it,
 * in a microtask.
 */
function rerenderOnBlur(what: "move" | "remove"): void {
  const host = document.getElementById("sc");
  host?.addEventListener(
    "focusout",
    (event) => {
      const child = event.target as Element;
      if (child.localName !== "ocelle-segment") return;
      queueMicrotask(() => {
        if (what === "move") host.append(child);
        else child.remove();
      });
    },
    { once: true },
  );
}

/** Adds a host stylesheet to the document in the current task, without waiting for a frame. */
function hostRule(rule: string): void {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(rule);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
}

export const segmentedChoiceScenarios: readonly SegmentedChoiceScenario[] = [
  {
    // Plants: the toolbar role on a shadow part or none (no toolbar node); `aria-selected` written instead of
    // `aria-pressed` (no pressed state, a selected one instead); every segment at `tabindex="0"`.
    name: "US3-1: a toolbar named Lane filter, horizontal, holding four toggle buttons, All pressed and the others not; only All is in the tab order; no tab, tablist, option or selected state is exposed (FR-026)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.focus("before");
      await driver.pressKeys("Tab");
      const first = await driver.focusedElement();
      await driver.pressKeys("Tab");
      return {
        tree: await tree(driver),
        selection: await selection(driver, inPage),
        tabindexes: await inPage(tabindexes, "sc"),
        value: await inPage(valueOf, "sc"),
        first,
        next: await driver.focusedElement(),
        events: await inPage(recordedEvents, null),
      };
    },
    expected: { tree: exposed("Lane filter", lanes), selection: { states: 0, attributes: 0 }, tabindexes: ["0", "-1", "-1", "-1"], value: "all", first: seg(0), next: after, events: [] },
  },
  {
    // Plant: pressing following focus on the arrows (Mine then pressed, with an event).
    name: "US3-2: ArrowRight on All moves focus to Mine and nothing else changes: All stays pressed, the tab stop stays on All and no event is emitted, beside the focus move (FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.focus("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowRight");
      return { focus: await driver.focusedElement(), tree: await tree(driver), tabindexes: await inPage(tabindexes, "sc"), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null), keys: await driver.keydownRecord() };
    },
    expected: {
      focus: seg(1),
      tree: exposed("Lane filter", lanes),
      tabindexes: ["0", "-1", "-1", "-1"],
      value: "all",
      events: [],
      keys: [
        { key: "Tab", defaultPrevented: false },
        { key: "ArrowRight", defaultPrevented: true },
      ],
    },
  },
  {
    // Plants: the change dispatched before `value` is updated; the tab stop left on the old segment.
    name: "US3-3: Enter on the focused Mine presses it, All is no longer pressed, value reads mine, Mine is the tab stop and one change event with value mine is emitted; Space on Blocked likewise (FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.focus(seg(0));
      await driver.pressKeys("ArrowRight");
      await driver.pressKeys("Enter");
      const enter = { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), focus: await driver.focusedElement() };
      await driver.pressKeys("ArrowRight");
      await driver.pressKeys(" ");
      return { enter, space: { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc") }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      enter: { tree: exposed("Lane filter", lanes, 1), value: "mine", tabindexes: ["-1", "0", "-1", "-1"], focus: seg(1) },
      space: { tree: exposed("Lane filter", lanes, 2), value: "blocked", tabindexes: ["-1", "-1", "0", "-1"] },
      events: [change("mine"), change("blocked")],
    },
  },
  {
    // Plant: change emitted without the "already pressed" check; a toggle that un-presses the pressed segment.
    name: "US3-4: with Mine pressed and focused, Enter and Space keep it pressed and emit nothing, beside the earlier change event that pressed it (FR-027, FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.focus(seg(0));
      await driver.pressKeys("ArrowRight");
      await driver.pressKeys("Enter");
      await driver.pressKeys("Enter");
      await driver.pressKeys(" ");
      return { tree: await tree(driver), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null), keys: (await driver.keydownRecord()).map((key) => key.defaultPrevented) };
    },
    expected: { tree: exposed("Lane filter", lanes, 1), value: "mine", events: [change("mine")], keys: [true, true, true, true] },
  },
  {
    // Plants: `wrap: false` for the segmented choice; the `inline` axis (ArrowDown and ArrowUp then not handled); the
    // arrows not swapped under right-to-left.
    name: "US3-5: ArrowRight on the last Done wraps to All, ArrowLeft on All wraps to Done; ArrowDown and ArrowUp act as ArrowRight and ArrowLeft; Home and End move to the first and last; under dir=rtl ArrowLeft moves to the next segment; focus only, All stays pressed and nothing is emitted (FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.focus(seg(3));
      const walk: unknown[] = [];
      for (const key of ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End", "ArrowUp", "ArrowDown"]) {
        await driver.pressKeys(key);
        walk.push(await driver.focusedElement());
      }
      await driver.dir("box", "rtl");
      await driver.focus(seg(0));
      await driver.pressKeys("ArrowLeft");
      const rtlLeft = await driver.focusedElement();
      await driver.pressKeys("ArrowRight");
      await driver.pressKeys("ArrowRight");
      const rtlRight = await driver.focusedElement();
      return { walk, rtl: [rtlLeft, rtlRight], tree: await tree(driver), events: await inPage(recordedEvents, null) };
    },
    expected: {
      walk: [seg(0), seg(3), seg(0), seg(3), seg(0), seg(3), seg(2), seg(3)],
      rtl: [seg(1), seg(3)],
      tree: exposed("Lane filter", lanes),
      events: [],
    },
  },
  {
    // Plant: the click handler pressing without focusing (the native focus prevented).
    name: "US3-6: a click on Blocked presses and focuses it and emits one change event with value blocked (FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.clickTarget(seg(2));
      return { focus: await driver.focusedElement(), tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), events: await inPage(recordedEvents, null) };
    },
    expected: { focus: seg(2), tree: exposed("Lane filter", lanes, 2), value: "blocked", tabindexes: ["-1", "-1", "0", "-1"], events: [change("blocked")] },
  },
  {
    // Plants: `disabled` ignored in the click handler; the disabled segment's mousedown not prevented (it then takes
    // focus); moves not skipping disabled segments.
    name: "US3-7: arrows, Home and End skip a disabled segment, a click on it presses, focuses and emits nothing beside a click on Done that does, and it is exposed as a disabled toggle button; with both ends disabled Home and End move to the first and last enabled segment (FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes, [1]), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.focus(seg(0));
      await driver.pressKeys("ArrowRight");
      const right = await driver.focusedElement();
      await driver.pressKeys("ArrowLeft");
      const left = await driver.focusedElement();
      await driver.clickTarget(seg(1), { force: true });
      const clicked = { focus: await driver.focusedElement(), tree: await tree(driver), events: await inPage(recordedEvents, null) };
      await driver.clickTarget(seg(3));
      const done = { focus: await driver.focusedElement(), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(segmentsOf(lanes, [0, 3])));
      const firstEnabled = { tree: await tree(driver), value: await inPage(valueOf, "sc") };
      await driver.focus(seg(2));
      await driver.pressKeys("Home");
      const home = await driver.focusedElement();
      await driver.pressKeys("End");
      return { right, left, clicked, done, firstEnabled, ends: [home, await driver.focusedElement()] };
    },
    expected: {
      right: seg(2),
      left: seg(0),
      clicked: { focus: seg(0), tree: exposed("Lane filter", lanes, 0, [1]), events: [] },
      done: { focus: seg(3), value: "done", events: [change("done")] },
      firstEnabled: { tree: exposed("Lane filter", lanes, 1, [0, 3]), value: "mine" },
      ends: [seg(1), seg(2)],
    },
  },
  {
    // Plants: the pressed paint as a fill only (no bar-width border); the pressed border in `control-border`; the
    // pressed border widening the segment (padding not reduced); no gap between default segments.
    name: "US3-8: in the default variant the segments are separate controls 8 px apart, each with a 1 px control-border border and radius-2 corners; the pressed All is filled accent-low with a 3 px accent-strong border, and pressing another segment leaves All's outer size unchanged (FR-029)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      const b = await boxes(driver, 4);
      const gaps = [1, 2, 3].map((index) => Math.round(((b[index]?.x ?? 0) - ((b[index - 1]?.x ?? 0) + (b[index - 1]?.width ?? 0))) * 100) / 100);
      const pressed = { all: await inPage(paintOf, 0), mine: await inPage(paintOf, 1) };
      const allPressed = await driver.box(seg(0));
      await driver.setProperty("sc", "value", "mine");
      const allNot = await driver.box(seg(0));
      return { gaps, pressed, after: { all: await inPage(paintOf, 0), mine: await inPage(paintOf, 1) }, size: { same: allPressed.width === allNot.width && allPressed.height === allNot.height, height: allPressed.height } };
    },
    expected: {
      gaps: [8, 8, 8],
      pressed: { all: paint(lowLight, "3px", accentLight), mine: paint(transparent, "1px", borderLight) },
      after: { all: paint(transparent, "1px", borderLight), mine: paint(lowLight, "3px", accentLight) },
      size: { same: true, height: 44 },
    },
  },
  {
    // Plants: the pressed paint as a 3 px border (the shared line widened); two borders without overlap (a doubled
    // line); the pressed segment's lines in `control-border`; a gap between joined segments; every corner rounded.
    name: "US3-9: joined with All pressed on one row the segments touch, every boundary is one 1 px line, control-border except the lines bounding All, which are accent-strong at the same width; All's block-end edge is its 3 px bar above its line; only All has rounded start corners and only Done rounded end corners; the same after Blocked is pressed (FR-029)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all" joined'));
      await measured(driver, inPage);
      const b = await boxes(driver, 4);
      const touch = [1, 2, 3].map((index) => Math.round(((b[index]?.x ?? 0) - ((b[index - 1]?.x ?? 0) + (b[index - 1]?.width ?? 0))) * 100) / 100);
      const all = { lines: await joinedLines(driver, 0), radii: await inPage(radii, null), heights: b.map((each) => each.height) };
      await driver.setProperty("sc", "value", "blocked");
      return { touch, all, blocked: { lines: await joinedLines(driver, 2), radii: await inPage(radii, null), styles: await inPage(styleAttributes, null) } };
    },
    expected: {
      touch: [-1, -1, -1],
      all: {
        lines: { between: [line(accentLight), line(borderLight), line(borderLight)], top: line(accentLight), bottom: line(accentLight, 4), start: line(accentLight) },
        radii: [startRound, square, square, endRound],
        heights: [44, 44, 44, 44],
      },
      blocked: {
        lines: { between: [line(borderLight), line(accentLight), line(accentLight)], top: line(accentLight), bottom: line(accentLight, 4), start: line(accentLight) },
        radii: [startRound, square, square, endRound],
        styles: [false, false, false, false, false],
      },
    },
  },
  {
    // Plants: rounding by writing `style` on segments; the state update deferred one extra frame (the radii then read
    // the previous rounding at the delivery); rounding only the group's first and last segments (Done and Blocked then
    // wrong on two rows).
    name: "US3-10: joined at a width where Done wraps alone to row 2, each row is rounded on its own (All start, Blocked end, Done both), rows touch with one shared line; widened to one row the rounding returns to scenario 9's; read at the delivery of the resize observations after a resize that does not wait for a frame; no style attribute on the group or a segment (FR-029, SC-005)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine" joined'));
      const { oneRow, twoRows } = await measured(driver, inPage);
      await resized(driver, inPage, twoRows);
      const wrapped = { rows: await inPage(rows, null), radii: await inPage(radii, null) };
      const s = await shot(driver);
      const [all, , , done] = await boxes(driver, 4);
      const between = all === undefined || done === undefined ? null : lineRun(s, "y", all.x + Math.min(all.width, done.width) / 2, done.y - 2, done.y + 2, lineColours);
      const rowsTouch = all === undefined || done === undefined ? null : Math.round((done.y - (all.y + all.height)) * 100) / 100;
      await resized(driver, inPage, oneRow);
      return { wrapped: { ...wrapped, between, rowsTouch }, one: { rows: await inPage(rows, null), radii: await inPage(radii, null) }, styles: await inPage(styleAttributes, null) };
    },
    expected: {
      wrapped: { rows: [0, 0, 0, 1], radii: [startRound, square, endRound, bothRound], between: line(borderLight), rowsTouch: -1 },
      one: { rows: [0, 0, 0, 0], radii: [startRound, square, square, endRound] },
      styles: [false, false, false, false, false],
    },
  },
  {
    // Plants: the pressed paint as an inset box-shadow only (forced colours compute it to none: no Highlight edge); the
    // boundaries kept out of forced colours (`forced-color-adjust: none` with their `control-border` lines); the joined
    // bar's forced-colours rule hiding it (`display: none`, `visibility: hidden`) or taking it out of its place
    // (`position: static`).
    name: "US3-11: in forced colours every boundary is ButtonBorder, the default pressed segment shows a 3 px Highlight border, the joined pressed segment a 3 px Highlight bar on its block-end edge inside its box, and a focused segment a Highlight ring (FR-008)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await driver.forcedColors("active", "light");
      const highlight = await driver.resolveColour("Highlight");
      const buttonBorder = await driver.resolveColour("ButtonBorder");
      const canvas = await driver.resolveColour("Canvas");
      const named = (value: unknown): unknown => JSON.parse(JSON.stringify(value).split(over(highlight, canvas)).join("Highlight over Canvas").split(highlight).join("Highlight").split(buttonBorder).join("ButtonBorder")) as unknown;
      const fill = (value: unknown): unknown => ({ ...(value as Record<string, unknown>), fill: "any" });
      const plain = { pressed: named(fill(await inPage(paintOf, 0))), other: named(fill(await inPage(paintOf, 1))) };
      await driver.focus(seg(0));
      await driver.pressKeys("ArrowRight");
      const focused = named(await ring(driver, seg(1)));
      await driver.forcedColors("none");
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all" joined'));
      await measured(driver, inPage);
      await driver.forcedColors("active", "light");
      const s = await shot(driver);
      const b = await boxes(driver, 4);
      const forcedColours = [highlight, buttonBorder];
      const pressedBox = b[0];
      const mine = b[1];
      // The bar is read from its computed style and from its pixels. The emulated palette's Highlight is translucent
      // (rgba(5, 0, 73, 0.8) in process), so the bar's pixels are Highlight composited over the ground behind it, the
      // forced Canvas: the pixel read looks for that colour, which is neither the ground's nor a line's (changed after
      // the red run, and the pixel read restored in review round 1, R1-01; reviews/phase-4/notes.md).
      const painted = over(highlight, canvas);
      const bar = {
        content: await driver.computedPart(seg(0), "::before", "content"),
        width: await driver.computedPart(seg(0), "::before", "border-block-end-width"),
        colour: await driver.computedPart(seg(0), "::before", "border-block-end-color"),
        end: await driver.computedPart(seg(0), "::before", "inset-block-end"),
        line: await driver.computed(seg(0), "border-bottom-width"),
      };
      const joined =
        pressedBox === undefined || mine === undefined
          ? null
          : named({
              bar,
              bottom: lineRun(s, "y", pressedBox.x + pressedBox.width / 2, pressedBox.y + pressedBox.height - 2, pressedBox.y + pressedBox.height + 2, forcedColours),
              paint: lineRun(s, "y", pressedBox.x + pressedBox.width / 2, pressedBox.y + pressedBox.height - 8, pressedBox.y + pressedBox.height + 2, [painted]),
              shared: lineRun(s, "x", mine.y + mine.height / 2, mine.x - 2, mine.x + 2, forcedColours),
              top: lineRun(s, "y", mine.x + mine.width / 2, mine.y - 2, mine.y + 2, forcedColours),
            });
      await driver.forcedColors("none");
      return { distinct: highlight !== canvas && buttonBorder !== highlight && painted !== canvas && painted !== buttonBorder, plain, focused, joined };
    },
    expected: {
      distinct: true,
      plain: { pressed: { ...(paint("any", "3px", "Highlight") as object), fill: "any" }, other: { ...(paint("any", "1px", "ButtonBorder") as object), fill: "any" } },
      focused: ["3px Highlight", "3px Highlight", "3px Highlight", "3px Highlight"],
      joined: { bar: { content: '""', width: "3px", colour: "Highlight", end: "0px", line: "1px" }, bottom: { colour: "ButtonBorder", width: 1 }, paint: { colour: "Highlight over Canvas", width: 3 }, shared: { colour: "ButtonBorder", width: 1 }, top: { colour: "ButtonBorder", width: 1 } },
    },
  },
  {
    // Plant: no minimum block size on the segment.
    name: "US3-12: each segment's box is at least --ocelle-target-min (44 px) high, in the default and the joined variant (FR-030)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      const plain = (await boxes(driver, 4)).map((each) => each.height);
      await driver.setAttribute("sc", "joined", "");
      return { plain, joined: (await boxes(driver, 4)).map((each) => each.height) };
    },
    expected: { plain: [44, 44, 44, 44], joined: [44, 44, 44, 44] },
  },
  {
    // Plants: `preventDefault()` on every keydown; no `preventDefault()` on Space (the page then scrolls); Tab handled.
    name: "US3-13: Escape and a letter on a segment are not handled and change nothing, beside ArrowRight, handled, which moves focus; Space on the already pressed segment is handled and the page does not scroll; Tab leaves the group (FR-028)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `${page(segmentsOf(lanes), 'label="Lane filter" value="all"')}<div id="tall"></div>`);
      await driver.rules("#tall { block-size: 3000px; }");
      await inPage(recordEvents, null);
      await driver.focus(seg(0));
      await driver.pressKeys("Escape");
      await driver.pressKeys("m");
      const unhandled = { focus: await driver.focusedElement(), value: await inPage(valueOf, "sc") };
      await driver.pressKeys("ArrowRight");
      const moved = await driver.focusedElement();
      await driver.pressKeys("ArrowLeft");
      await driver.pressKeys(" ");
      const space = { value: await inPage(valueOf, "sc"), scroll: await driver.scrollOffset() };
      await driver.pressKeys("Tab");
      return { unhandled, moved, space, tabbed: await driver.focusedElement(), events: await inPage(recordedEvents, null), keys: await driver.keydownRecord() };
    },
    expected: {
      unhandled: { focus: seg(0), value: "all" },
      moved: seg(1),
      space: { value: "all", scroll: { x: 0, y: 0 } },
      tabbed: after,
      events: [],
      keys: [
        { key: "Escape", defaultPrevented: false },
        { key: "m", defaultPrevented: false },
        { key: "ArrowRight", defaultPrevented: true },
        { key: "ArrowLeft", defaultPrevented: true },
        { key: " ", defaultPrevented: true },
        { key: "Tab", defaultPrevented: false },
      ],
    },
  },
  {
    // Plants: the default from the index among all children; the default written to the attribute.
    name: "US3-14: segments written with no value report their index: a click on the third emits one change event with value 2 and value reads 2; the default is not written to the attribute (FR-009)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes, [], false)));
      await inPage(recordEvents, null);
      const first = await inPage(valueOf, "sc");
      await driver.clickTarget(seg(2));
      return { first, value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null), attributes: await inPage(() => [...document.querySelectorAll("#sc > ocelle-segment")].map((each) => each.getAttribute("value")), null) };
    },
    expected: { first: "0", value: "2", events: [change("2")], attributes: [null, null, null, null] },
  },
  {
    // Plants: clearing the press on a value no segment has (the listbox's rule); change dispatched from the model's
    // fallback; focus left on the body after the removal; a pressed segment kept while every segment is disabled.
    name: "US3-15: with Mine pressed and focused, a host set of nope or of the empty value keeps Mine pressed, the tab stop and value mine, with no event; removing Mine, or disabling it, presses Blocked, makes it the tab stop and moves focus to it, with no event; with every segment disabled none is pressed, value reads the empty value and there is no tab stop (FR-010, FR-011, FR-011a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
      await inPage(recordEvents, null);
      await driver.focus(seg(1));
      await driver.setProperty("sc", "value", "nope");
      await driver.setProperty("sc", "value", "");
      const kept = { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), focus: await driver.focusedElement() };
      await driver.mutate("sc", [{ remove: 1 }]);
      await inPage(frames, undefined);
      const removed = { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
      await inPage(recordEvents, null);
      await driver.focus(seg(1));
      await driver.mutate("sc", [{ child: 1, attribute: "disabled", value: "" }]);
      await inPage(frames, undefined);
      const disabled = { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(segmentsOf(lanes, [0, 1, 2, 3]), 'label="Lane filter" value="mine"'));
      await driver.focus("before");
      await driver.pressKeys("Tab");
      return { kept, removed, disabled, none: { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), focus: await driver.focusedElement() } };
    },
    expected: {
      kept: { tree: exposed("Lane filter", lanes, 1), value: "mine", tabindexes: ["-1", "0", "-1", "-1"], focus: seg(1) },
      removed: { tree: exposed("Lane filter", ["All", "Blocked", "Done"], 1), value: "blocked", tabindexes: ["-1", "0", "-1"], focus: seg(1), events: [] },
      disabled: { tree: exposed("Lane filter", lanes, 2, [1]), value: "blocked", tabindexes: ["-1", "-1", "0", "-1"], focus: seg(2), events: [] },
      none: { tree: exposed("Lane filter", lanes, null, [0, 1, 2, 3]), value: "", tabindexes: ["-1", "-1", "-1", "-1"], focus: after },
    },
  },
  {
    // Plants: the remembered value not kept (Blocked then not pressed on append); the remembered value never forgotten
    // (Blocked then pressed after the user press or the other host set).
    name: "US3-16: with All pressed a host set of blocked keeps All pressed and value all with no event, and appending Blocked then presses it, makes it the tab stop, with no event; after a user press of Mine, or another host set, an appended Blocked is not pressed (FR-010a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All", "Mine"]), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.setProperty("sc", "value", "blocked");
      const set = { tree: await tree(driver), value: await inPage(valueOf, "sc") };
      await driver.mutate("sc", [{ append: segmentOf("Blocked") }]);
      const appended = { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(segmentsOf(["All", "Mine"]), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await driver.setProperty("sc", "value", "blocked");
      await driver.clickTarget(seg(1));
      await driver.mutate("sc", [{ append: segmentOf("Blocked") }]);
      const user = { tree: await tree(driver), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(segmentsOf(["All", "Mine"]), 'label="Lane filter" value="all"'));
      await driver.setProperty("sc", "value", "blocked");
      await driver.setProperty("sc", "value", "mine");
      await driver.mutate("sc", [{ append: segmentOf("Blocked") }]);
      return { set, appended, user, host: { tree: await tree(driver), value: await inPage(valueOf, "sc") } };
    },
    expected: {
      set: { tree: exposed("Lane filter", ["All", "Mine"], 0), value: "all" },
      appended: { tree: exposed("Lane filter", ["All", "Mine", "Blocked"], 2), value: "blocked", tabindexes: ["-1", "-1", "0"], events: [] },
      user: { tree: exposed("Lane filter", ["All", "Mine", "Blocked"], 1), value: "mine", events: [change("mine")] },
      host: { tree: exposed("Lane filter", ["All", "Mine", "Blocked"], 1), value: "mine" },
    },
  },
  {
    // Plant: the first enabled segment pressed before the remembered value is read (All then pressed).
    name: "US3-17: on an empty segmented choice a host set of blocked, then All, Mine and Blocked appended in one operation, presses Blocked, makes it the tab stop, with no event (FR-010a Precedence)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await inPage(recordEvents, null);
      const empty = { tree: await tree(driver), value: await inPage(valueOf, "sc") };
      await driver.setProperty("sc", "value", "blocked");
      await driver.mutate("sc", [{ append: segmentOf("All") }, { append: segmentOf("Mine") }, { append: segmentOf("Blocked") }]);
      return { empty, filled: { tree: await tree(driver), value: await inPage(valueOf, "sc"), tabindexes: await inPage(tabindexes, "sc"), events: await inPage(recordedEvents, null) } };
    },
    expected: {
      empty: { tree: [{ role: "toolbar", name: "Lane filter", orientation: "horizontal" }], value: "" },
      filled: { tree: exposed("Lane filter", ["All", "Mine", "Blocked"], 2), value: "blocked", tabindexes: ["-1", "-1", "0"], events: [] },
    },
  },
  {
    // Plants: observing the group only, or the segments' content boxes (the host rule, which changes only Mine's
    // padding, is then missed); no regroup on the observations.
    name: "US3-18: joined on two rows, a text change of Mine at the same container width and group block size moves Blocked to row 2, and Mine, Blocked and Done are rounded for the new rows; a host rule that widens Mine with no DOM change does the same; read at the next delivery of the resize observations (FR-029)",
    fixture: true,
    run: async (driver, inPage) => {
      const run = async (change: () => Promise<void>): Promise<unknown> => {
        await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="done" joined'));
        const { twoRows } = await measured(driver, inPage);
        await resized(driver, inPage, twoRows);
        const before = { rows: await inPage(rows, null), height: (await driver.box("sc")).height };
        await change();
        await driver.afterResizeDelivery("box");
        const height = (await driver.box("sc")).height;
        return { before: before.rows, sameHeight: height === before.height, rows: await inPage(rows, null), radii: await inPage(radii, null) };
      };
      const text = await run(async () => {
        await inPage(() => {
          const mine = document.querySelectorAll("#sc > ocelle-segment")[1];
          if (mine !== undefined) mine.textContent = "Mine and more";
        }, null);
      });
      const rule = await run(async () => {
        await inPage(hostRule, "#sc > ocelle-segment:nth-child(2) { padding-inline-end: 80px; }");
      });
      return { text, rule };
    },
    expected: {
      text: { before: [0, 0, 0, 1], sameHeight: true, rows: [0, 0, 1, 1], radii: [startRound, endRound, startRound, endRound] },
      rule: { before: [0, 0, 0, 1], sameHeight: true, rows: [0, 0, 1, 1], radii: [startRound, endRound, startRound, endRound] },
    },
  },
  {
    // Plant: the icon slot missing on the segment (the icon then not placed by the slot convention).
    name: "US3-19: an icon in the segment's icon slot sits before the text at the icon size with the slot gap, adds nothing to the segment's name, and leaves the pressed paint as on a plain segment",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-segment value="all"><ocelle-icon id="icon" slot="icon" name="folder"></ocelle-icon>All</ocelle-segment><ocelle-segment value="mine">Mine</ocelle-segment>', 'label="Lane filter" value="all"'));
      const icon = await driver.box("icon");
      const text = await inPage(() => {
        const first = document.querySelector("#sc > ocelle-segment");
        const node = [...(first?.childNodes ?? [])].find((child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? "").trim() !== "");
        if (node === undefined) return null;
        const range = document.createRange();
        range.selectNodeContents(node);
        return { x: range.getBoundingClientRect().x };
      }, null);
      const withIcon = await inPage(paintOf, 0);
      const firstTree = await tree(driver);
      await driver.setProperty("sc", "value", "mine");
      return { size: [icon.width, icon.height], gap: text === null ? null : Math.round(text.x - (icon.x + icon.width)), firstTree, paints: [withIcon, await inPage(paintOf, 1)] };
    },
    expected: { size: [20, 20], gap: 8, firstTree: exposed("Lane filter", ["All", "Mine"], 0), paints: [paint(lowLight, "3px", accentLight), paint(lowLight, "3px", accentLight)] },
  },
  {
    // Plants: `z-index` on the focused host (its own control-border line then covers the pressed or hovered
    // neighbour's accent-strong line); the pressed or hovered segment not raised.
    name: "joined: the lines of the pressed segment stay accent-strong with a focused neighbour before it and after it, and a hovered segment's lines stay accent-strong beside a focused neighbour (FR-029, R-06, R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine" joined'));
      await measured(driver, inPage);
      await driver.focus("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowLeft");
      const focusBefore = { focus: await driver.focusedElement(), lines: ((await joinedLines(driver, 1)) as { between: unknown }).between };
      await driver.pressKeys("ArrowRight");
      await driver.pressKeys("ArrowRight");
      const focusAfter = { focus: await driver.focusedElement(), lines: ((await joinedLines(driver, 1)) as { between: unknown }).between };
      await driver.setProperty("sc", "value", "all");
      await driver.pressKeys("ArrowLeft");
      await driver.hoverTarget(seg(2));
      const hovered = { focus: await driver.focusedElement(), fill: await driver.computed(seg(2), "background-color"), lines: ((await joinedLines(driver, 1)) as { between: unknown }).between };
      return { focusBefore, focusAfter, hovered };
    },
    expected: {
      focusBefore: { focus: seg(0), lines: [line(accentLight), line(accentLight), line(borderLight)] },
      focusAfter: { focus: seg(2), lines: [line(accentLight), line(accentLight), line(borderLight)] },
      hovered: { focus: seg(1), fill: hoverLight, lines: [line(accentLight), line(accentLight), line(accentLight)] },
    },
  },
  {
    // Plants: the ring as the host's outline with no raise; the ring pseudo-element without `z-index` (the pressed or
    // hovered neighbour then covers it on its side); a focused pressed segment not raised above its raise (a later
    // hovered neighbour then covers its ring).
    name: "joined: the focus ring of a keyboard-focused segment is drawn in color-focus just outside all four edges beside the pressed segment and beside a hovered one, and the focused pressed segment's ring beside a later hovered one (FR-007, R-06, R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all" joined'));
      await measured(driver, inPage);
      await driver.focus("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowRight");
      const besidePressed = { focus: await driver.focusedElement(), ring: await ringPixels(driver, 1) };
      await driver.hoverTarget(seg(2));
      const besideHovered = { fill: await driver.computed(seg(2), "background-color"), ring: await ringPixels(driver, 1) };
      await driver.pressKeys("ArrowLeft");
      await driver.hoverTarget(seg(1));
      const pressedFocused = { focus: await driver.focusedElement(), fill: await driver.computed(seg(1), "background-color"), ring: await ringPixels(driver, 0) };
      return { besidePressed, besideHovered, pressedFocused };
    },
    expected: {
      besidePressed: { focus: seg(1), ring: [accentLight, accentLight, accentLight, accentLight] },
      besideHovered: { fill: hoverLight, ring: [accentLight, accentLight, accentLight, accentLight] },
      pressedFocused: { focus: seg(0), fill: hoverLight, ring: [accentLight, accentLight, accentLight, accentLight] },
    },
  },
  {
    // Plant: the focus ring as the host's outline (it then is not a 3 px `::after` border at all).
    name: "the focus ring of a keyboard-focused segment is a 3 px color-focus border just outside it in the default variant, in light and dark",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await driver.focus("before");
      await driver.pressKeys("Tab");
      const light = { ring: await ring(driver, seg(0)), pixels: await ringPixels(driver, 0) };
      await driver.theme("dark");
      return { light, dark: await ring(driver, seg(0)) };
    },
    expected: {
      light: { ring: ["3px", "3px", "3px", "3px"].map((width) => `${width} ${accentLight}`), pixels: [accentLight, accentLight, accentLight, accentLight] },
      dark: ["3px", "3px", "3px", "3px"].map((width) => `${width} ${accentDark}`),
    },
  },
  {
    // Plants: the pressed paint in another token in dark; the hover fill kept off a pressed segment; the pressed border
    // lost under the pointer.
    name: "the pressed paint is accent-low with a 3 px accent-strong border in light and dark, and a hovered pressed segment is filled hover-bg and keeps its border (Edge Cases, hover; R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
      const light = await inPage(paintOf, 1);
      await driver.theme("dark");
      const dark = await inPage(paintOf, 1);
      await driver.theme(null);
      await driver.hoverTarget(seg(1));
      return { light, dark, hovered: await inPage(paintOf, 1) };
    },
    expected: { light: paint(lowLight, "3px", accentLight), dark: paint(lowDark, "3px", accentDark), hovered: paint(hoverLight, "3px", accentLight) },
  },
  {
    // Plant: a `:host(:hover)` rule with no disabled exclusion (the disabled segment then filled `hover-bg` with
    // accent-strong lines).
    name: "Edge Cases, hover: a disabled segment under the pointer has no hover fill and keeps its control-border lines, beside an enabled sibling under the pointer filled hover-bg with accent-strong lines, in the default and the joined variant",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes, [2]), 'label="Lane filter" value="all"'));
      await driver.hoverTarget(seg(2));
      const plainDisabled = await inPage(paintOf, 2);
      await driver.hoverTarget(seg(1));
      const plainEnabled = await inPage(paintOf, 1);
      await mount(driver, inPage, page(segmentsOf(lanes, [2]), 'label="Lane filter" value="all" joined'));
      await measured(driver, inPage);
      await driver.hoverTarget(seg(2));
      const joinedDisabled = { fill: await driver.computed(seg(2), "background-color"), lines: ((await joinedLines(driver, 2)) as { between: unknown }).between };
      await driver.hoverTarget(seg(1));
      const joinedEnabled = { fill: await driver.computed(seg(1), "background-color"), lines: ((await joinedLines(driver, 1)) as { between: unknown }).between };
      return { plainDisabled, plainEnabled, joinedDisabled, joinedEnabled };
    },
    expected: {
      plainDisabled: paint(transparent, "1px", borderLight),
      plainEnabled: paint(hoverLight, "1px", accentLight),
      joinedDisabled: { fill: transparent, lines: [line(accentLight), line(borderLight), line(borderLight)] },
      joinedEnabled: { fill: hoverLight, lines: [line(accentLight), line(accentLight), line(borderLight)] },
    },
  },
  {
    // Plant: a `transition` on the pressed paint.
    name: "Edge Cases, motion: a segment declares no transition or animation, so a press paints at once (transition-duration 0s, animation-name none), beside the paint the press draws",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await driver.clickTarget(seg(1));
      await driver.hoverTarget("away");
      return { paint: await inPage(paintOf, 1), motion: [await driver.computed(seg(1), "transition-duration"), await driver.computed(seg(1), "animation-name"), await driver.computedPart(seg(1), "::before", "transition-duration")] };
    },
    expected: { paint: paint(lowLight, "3px", accentLight), motion: ["0s", "none", "0s"] },
  },
  {
    // Plant: the segment setting its role and tabindex in its own connectedCallback regardless of the parent.
    name: "Edge Cases: an ocelle-segment directly in the page has no role and no tab stop, beside the same segment in a segmented choice exposed as a toggle button taking the tab stop",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `<button id="before" type="button">Before</button><ocelle-segment id="lone" value="all">All</ocelle-segment><div id="box"><ocelle-segmented-choice id="sc" label="Lane filter">${segmentsOf(["All"])}</ocelle-segmented-choice></div><button id="after" type="button">After</button>`);
      await driver.focus("before");
      await driver.pressKeys("Tab");
      const first = await driver.focusedElement();
      const lone = (await driver.axStates("lone", "subtree")).filter((node) => interactiveRoles.has(node.role)).map((node) => node.role);
      return { lone, tabindex: await driver.attribute("lone", "tabindex"), group: await tree(driver), first };
    },
    expected: { lone: [], tabindex: null, group: exposed("Lane filter", ["All"]), first: seg(0) },
  },
  {
    // Plants: pressing the last match; exposing the first after a user press of the second.
    name: "Edge Cases: with two segments of the same value a host set presses the first; a click on the second exposes the second as pressed and reports the same value",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-segment value="all">All</ocelle-segment><ocelle-segment value="same">One</ocelle-segment><ocelle-segment value="same">Two</ocelle-segment>'));
      await inPage(recordEvents, null);
      await driver.setProperty("sc", "value", "same");
      const set = await tree(driver);
      await driver.clickTarget(seg(2));
      return { set, clicked: await tree(driver), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null) };
    },
    expected: { set: exposed("Lane filter", ["All", "One", "Two"], 1), clicked: exposed("Lane filter", ["All", "One", "Two"], 2), value: "same", events: [change("same")] },
  },
  ...(["default", "joined"] as const).map(
    (variant): SegmentedChoiceScenario => ({
      // Plant: `white-space: nowrap` or `text-overflow: ellipsis` on the segment.
      name: `Edge Cases: at a 320 px viewport a segment label longer than the group wraps in the ${variant} variant, the segment grows in block size, its whole text is its name and the page does not scroll sideways`,
      fixture: true,
      run: async (driver, inPage) => {
        const start = await inPage(() => [window.innerWidth, window.innerHeight], null);
        await mount(driver, inPage, page(segmentOf(longLabel, { values: false }) + segmentOf("Short"), `label="Lane filter"${variant === "joined" ? " joined" : ""}`));
        await driver.setViewportSize(320, 640);
        const long = (await driver.box(seg(0))).height;
        const short = (await driver.box(seg(1))).height;
        const sideways = await inPage(() => document.documentElement.scrollWidth > document.documentElement.clientWidth, null);
        const observed = { grew: long > 44 && short === 44, sideways, tree: await tree(driver) };
        await driver.setViewportSize(start[0] ?? 0, start[1] ?? 0);
        return observed;
      },
      expected: { grew: true, sideways: false, tree: exposed("Lane filter", [longLabel, "Short"]) },
    }),
  ),
  {
    // Plant: a `display` rule on `:host` that overrides `:host([hidden])`.
    name: "Edge Cases: host hidden removes the segmented choice, no box and no node; without it the group has a box and its nodes",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await driver.setAttribute("sc", "hidden", "");
      const box = await driver.box("sc");
      const hidden = { display: box.display, height: box.height, tree: await tree(driver) };
      await driver.setAttribute("sc", "hidden", null);
      const again = await driver.box("sc");
      return { hidden, shown: { display: again.display, boxed: again.height > 0, tree: await tree(driver) } };
    },
    expected: { hidden: { display: "none", height: 0, tree: [] }, shown: { display: "flex", boxed: true, tree: exposed("Lane filter", lanes) } },
  },
  {
    // Plant: the segment's name read once at first render (the label slot removed after first render).
    name: "Edge Cases: a segment's accessible name follows a change of its text",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      const first = await tree(driver);
      await driver.mutate("sc", [{ property: "textContent", value: "Everything", child: 0 }]);
      return { first, renamed: await tree(driver) };
    },
    expected: { first: exposed("Lane filter", lanes), renamed: exposed("Lane filter", ["Everything", "Mine", "Blocked", "Done"]) },
  },
  {
    // Plant: rewriting `aria-pressed` on every set.
    name: "Edge Cases: a host set of the current value mutates nothing in the group's subtree and emits nothing, beside an earlier set of another value that mutates the states",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      await inPage(countMutations, "sc");
      await driver.setProperty("sc", "value", "mine");
      const changed = (await inPage(mutations, null)) > 0;
      await driver.setProperty("sc", "value", "mine");
      return { changed, same: await inPage(mutations, null), tree: await tree(driver), events: await inPage(recordedEvents, null) };
    },
    expected: { changed: true, same: 0, tree: exposed("Lane filter", lanes, 1), events: [] },
  },
  {
    // Plant: row states changing margins (a regroup then moves the row break, a resize loop).
    name: "Edge Cases: while the container resizes continuously (ten steps between one row and two rows) the rounding follows each step at its delivery, with no console message, no ResizeObserver loop error and no error event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine" joined'));
      const { oneRow, twoRows } = await measured(driver, inPage);
      const seen: unknown[] = [];
      for (let step = 0; step < 10; step++) {
        await resized(driver, inPage, step % 2 === 0 ? twoRows : oneRow);
        seen.push((await inPage(radii, null))[3]);
      }
      await inPage(frames, undefined);
      return { seen, messages: await driver.messages() };
    },
    expected: { seen: [bothRound, endRound, bothRound, endRound, bothRound, endRound, bothRound, endRound, bothRound, endRound], messages: [] },
  },
  {
    // Plants: physical corner radii (left and right) instead of logical ones; rows grouped by `offsetLeft`.
    name: "joined under dir=rtl the rounding follows the inline direction: All, the first, is rounded on its right and Done, the last, on its left",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine" joined'));
      await driver.dir("box", "rtl");
      await measured(driver, inPage);
      return inPage(
        () =>
          [...document.querySelectorAll("#sc > ocelle-segment")].map((child) => {
            const style = getComputedStyle(child);
            return [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
          }),
        null,
      );
    },
    expected: [[z, r, r, z], square, square, [r, z, z, r]],
  },
  {
    // Plants: `joined` not reflected; the variant read once at first render.
    name: "joined set and removed after render: the property is reflected, the segments touch while joined and stand 8 px apart again without it, with rounding only at the ends while joined",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="all"'));
      const gap = async (): Promise<number> => {
        const [first, second] = await boxes(driver, 2);
        return Math.round(((second?.x ?? 0) - ((first?.x ?? 0) + (first?.width ?? 0))) * 100) / 100;
      };
      const plain = { gap: await gap(), radii: await inPage(radii, null) };
      await driver.setProperty("sc", "joined", true);
      await driver.afterResizeDelivery("box");
      const joined = { attribute: await driver.attribute("sc", "joined"), gap: await gap(), radii: await inPage(radii, null) };
      await driver.setProperty("sc", "joined", false);
      return { plain, joined, again: { attribute: await driver.attribute("sc", "joined"), gap: await gap(), radii: await inPage(radii, null) } };
    },
    expected: {
      plain: { gap: 8, radii: [bothRound, bothRound, bothRound, bothRound] },
      joined: { attribute: "", gap: -1, radii: [startRound, square, square, endRound] },
      again: { attribute: null, gap: 8, radii: [bothRound, bothRound, bothRound, bothRound] },
    },
  },
  {
    // Plant: regrouping and observing only at render, not on a child batch (an appended segment is then not rounded as
    // the new last).
    name: "joined: a segment appended at the end becomes the row's last and takes the end rounding, the former last is squared, at the same group size or not",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All", "Mine", "Blocked"]), 'label="Lane filter" value="all" joined'));
      await measured(driver, inPage);
      const three = await inPage(radii, null);
      await driver.mutate("sc", [{ append: segmentOf("Done") }]);
      await driver.afterResizeDelivery("box");
      return { three, four: await inPage(radii, null) };
    },
    expected: { three: [startRound, square, endRound], four: [startRound, square, square, endRound] },
  },
  {
    // Plant: the value setter deciding on the cached child list.
    name: "R-05: a segment appended and value set to it in the same task are one operation: the segment is pressed through the direct path, value reads it in that task, with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All", "Mine"]), 'label="Lane filter" value="all"'));
      await inPage(recordEvents, null);
      const inTask = await inPage(() => {
        const group = document.getElementById("sc") as (HTMLElement & { value: string }) | null;
        if (group === null) return null;
        group.insertAdjacentHTML("beforeend", '<ocelle-segment value="blocked">Blocked</ocelle-segment>');
        group.value = "blocked";
        return { value: group.value, pressed: group.querySelector('ocelle-segment[value="blocked"]')?.getAttribute("aria-pressed") ?? null };
      }, null);
      await inPage(frames, undefined);
      return { inTask, tree: await tree(driver), events: await inPage(recordedEvents, null) };
    },
    expected: { inTask: { value: "blocked", pressed: "true" }, tree: exposed("Lane filter", ["All", "Mine", "Blocked"], 2), events: [] },
  },
  {
    // Plants: `label` not trimmed or a blank label naming the group; the element removing a blank host `aria-label`.
    // (A defect only in the internals' name does not make the "decides alone" read fail: Chromium names the host from
    // a present `aria-label` itself; plants.md.)
    name: "FR-006: the toolbar's name is the trimmed label, a blank label leaves it unnamed, a later label change follows; a host aria-label names it and decides alone, a blank one leaves it unnamed beside a label, and removing it falls back to the label",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All"]), 'label="  Lane filter  "'));
      const trimmed = (await tree(driver))[0];
      await driver.setAttribute("sc", "label", "   ");
      const blank = (await tree(driver))[0];
      await driver.setProperty("sc", "label", "Lanes");
      const changed = (await tree(driver))[0];
      await driver.setAttribute("sc", "aria-label", "Filter by lane");
      const host = (await tree(driver))[0];
      await driver.setAttribute("sc", "aria-label", "  ");
      const hostBlank = (await tree(driver))[0];
      await driver.setAttribute("sc", "aria-label", null);
      return { trimmed, blank, changed, host, hostBlank, removed: (await tree(driver))[0] };
    },
    expected: {
      trimmed: { role: "toolbar", name: "Lane filter", orientation: "horizontal" },
      blank: { role: "toolbar", name: "", orientation: "horizontal" },
      changed: { role: "toolbar", name: "Lanes", orientation: "horizontal" },
      host: { role: "toolbar", name: "Filter by lane", orientation: "horizontal" },
      hostBlank: { role: "toolbar", name: "", orientation: "horizontal" },
      removed: { role: "toolbar", name: "Lanes", orientation: "horizontal" },
    },
  },
  {
    // Mutants: `disabled` not reflected from its property; the `value` setter writing nothing; the default from the
    // index among all children.
    name: "the segment's disabled and value properties: a disabled property set is reflected and disables the segment, a value property set writes the attribute, a written value reads as written, and the default counts segments only (FR-009)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes)));
      await driver.mutate("sc", [
        { property: "disabled", value: true, child: 1 },
        { property: "value", value: "todo", child: 2 },
      ]);
      const set = { tree: await tree(driver), attributes: await inPage(() => [...document.querySelectorAll("#sc > ocelle-segment")].map((each) => [each.hasAttribute("disabled"), each.getAttribute("value"), (each as unknown as { value: unknown }).value]), null) };
      await mount(driver, inPage, page(`<span>Lanes:</span>${segmentsOf(["All", "Mine"], [], false)}`));
      return { set, defaults: await inPage(() => [...document.querySelectorAll("#sc > ocelle-segment")].map((each) => (each as unknown as { value: unknown }).value), null), value: await inPage(valueOf, "sc") };
    },
    expected: {
      set: {
        tree: exposed("Lane filter", lanes, 0, [1]),
        attributes: [
          [false, "all", "all"],
          [true, "mine", "mine"],
          [false, "todo", "todo"],
          [false, "done", "done"],
        ],
      },
      defaults: ["0", "1"],
      value: "0",
    },
  },
  {
    // Mutant: the segment passing its `value` attribute changes to Lit (whose path sets the accessor, and the setter
    // writes the removed attribute back, so the segment keeps its old value).
    name: "FR-009: a host that removes a segment's value attribute after render leaves the attribute absent, the segment reads its index, and the group's value and the next change event report that index",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes)));
      await inPage(recordEvents, null);
      await driver.mutate("sc", [{ child: 2, attribute: "value", value: null }]);
      const removed = await inPage(() => {
        const third = document.querySelectorAll("#sc > ocelle-segment")[2];
        return [third?.getAttribute("value") ?? null, (third as unknown as { value?: unknown } | undefined)?.value ?? null];
      }, null);
      await driver.clickTarget(seg(2));
      return { removed, value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null) };
    },
    expected: { removed: [null, "2"], value: "2", events: [change("2")] },
  },
  {
    // Mutant: the group's observer not following a segment's `value` attribute.
    name: "FR-010a: a segment whose value attribute changes to the remembered value is pressed with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes)));
      await inPage(recordEvents, null);
      await driver.setProperty("sc", "value", "todo");
      const kept = await inPage(valueOf, "sc");
      await driver.mutate("sc", [{ child: 3, attribute: "value", value: "todo" }]);
      return { kept, tree: await tree(driver), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null) };
    },
    expected: { kept: "all", tree: exposed("Lane filter", lanes, 3), value: "todo", events: [] },
  },
  {
    // Plant: no first enabled segment pressed on first render when the value names a disabled segment (both the host
    // set's and the batch's pick of the first enabled segment dropped).
    name: "FR-027: on first render with a value no enabled segment has the first enabled segment is pressed, and with a value naming an enabled segment that segment is, with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes, [0]), 'label="Lane filter" value="all"'));
      const nope = { tree: await tree(driver), value: await inPage(valueOf, "sc") };
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="done"'));
      return { nope, named: { tree: await tree(driver), value: await inPage(valueOf, "sc") } };
    },
    expected: { nope: { tree: exposed("Lane filter", lanes, 1, [0]), value: "mine" }, named: { tree: exposed("Lane filter", lanes, 3), value: "done" } },
  },
  {
    // Mutant: `aria-disabled` or `aria-pressed` left on a segment that leaves the group.
    name: "segments that leave the group lose aria-pressed, aria-disabled and tabindex, beside the same segments exposed pressed and disabled inside",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes, [2]), 'label="Lane filter" value="all"'));
      const inside = await tree(driver);
      await inPage(() => {
        const host = document.getElementById("sc");
        const leaving = [host?.querySelectorAll("ocelle-segment")[0], host?.querySelectorAll("ocelle-segment")[2]];
        for (const each of leaving) if (each !== undefined) document.body.append(each);
      }, null);
      await inPage(frames, undefined);
      return { inside, left: await inPage(() => [...document.body.children].filter((child) => child.localName === "ocelle-segment").map((child) => [...child.attributes].map((attribute) => attribute.name).sort()), null) };
    },
    expected: { inside: exposed("Lane filter", lanes, 0, [2]), left: [["value"], ["disabled", "value"]] },
  },
  ...(["remove", "move"] as const).map(
    (change): SegmentedChoiceScenario => ({
      // Found in phase 3 (reviews/phase-3/notes.md): the observer's callback, queued by an earlier mutation in the task,
      // runs before the focus record's `focusout` microtask. Plant: the observer's batch ignoring the focus record.
      name: `R-03: a host that ${change === "remove" ? "removes Done and then the focused, pressed Mine" : "moves All and then the focused, pressed Mine to the end"} in one task ${change === "remove" ? "presses Blocked and moves focus to it (FR-011a)" : "keeps focus and the press on Mine"}, with no event, as when the focused segment's change comes first`,
      fixture: true,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
        await inPage(recordEvents, null);
        await driver.focus(seg(1));
        await driver.mutate("sc", change === "remove" ? [{ remove: 3 }, { remove: 1 }] : [{ move: 0, before: "end" }, { move: 0, before: "end" }]);
        await inPage(frames, undefined);
        return { focus: await driver.focusedElement(), tree: await tree(driver), events: await inPage(recordedEvents, null) };
      },
      expected: change === "remove" ? { focus: seg(1), tree: exposed("Lane filter", ["All", "Blocked"], 1), events: [] } : { focus: seg(3), tree: exposed("Lane filter", ["Blocked", "Done", "All", "Mine"], 3), events: [] },
    }),
  ),
  ...changesAndSets.map(
    (how): SegmentedChoiceScenario => ({
      // Phase 2 review R1-01, for segments. Plant: the value setter taking the pending records without the focus
      // record (the focused segment's removal or move then leaves focus on the body).
      name: `R1-01 for segments: a host that ${how.change === "remove" ? "removes" : "moves to the end"} the focused, pressed Mine and sets value to all by ${how.by} in the same task leaves focus ${how.change === "remove" ? "on Blocked, the fallback (FR-011a)" : "on Mine (R-03)"}, presses All and emits nothing, as without the set`,
      fixture: true,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
        await inPage(recordEvents, null);
        await driver.focus(seg(1));
        await inPage(changeAndSet, how);
        await inPage(frames, undefined);
        return { focus: await driver.focusedElement(), tree: await tree(driver), tabindexes: await inPage(tabindexes, "sc"), value: await inPage(valueOf, "sc"), events: await inPage(recordedEvents, null) };
      },
      expected:
        how.change === "remove"
          ? { focus: seg(1), tree: exposed("Lane filter", ["All", "Blocked", "Done"], 0), tabindexes: ["0", "-1", "-1"], value: "all", events: [] }
          : { focus: seg(3), tree: exposed("Lane filter", ["All", "Blocked", "Done", "Mine"], 0), tabindexes: ["0", "-1", "-1", "-1"], value: "all", events: [] },
    }),
  ),
  ...(["move", "remove"] as const).flatMap((what) =>
    (["Tab", "click"] as const).map(
      (input): SegmentedChoiceScenario => ({
        // Plant: refocusing after any blur (the record not scoped to the removal that caused it).
        name: `R-03, Tab out while the host re-renders on blur: a ${input === "Tab" ? "real Shift+Tab to the button before the group" : "real click on the button after the group"} leaves the focused All while a host focusout listener ${what === "move" ? "moves" : "removes"} it in a microtask; focus ends on that target, beside an in-task move that keeps focus`,
        fixture: true,
        run: async (driver, inPage) => {
          await mount(driver, inPage, page(segmentsOf(["All", "Mine"])));
          await driver.focus(seg(0));
          await driver.mutate("sc", [{ move: 0, before: "end" }]);
          const kept = await driver.focusedElement();
          await inPage(rerenderOnBlur, what);
          if (input === "Tab") await driver.pressKeys("Tab", ["Shift"]);
          else await driver.clickTarget("after");
          await inPage(frames, undefined);
          return { kept, left: await driver.focusedElement() };
        },
        expected: { kept: seg(1), left: input === "Tab" ? before : after },
      }),
    ),
  ),
  {
    // Mutant: the record not scoped to the removal that caused the blur (the `focusout` microtask dropped, so a blur to
    // nothing stays recorded until a later batch).
    name: "R-03, a move does not steal focus back: after an in-task move keeps focus on All, the user clicks plain text to leave it, and a host move in a later task leaves focus on the body",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All", "Mine"])));
      await driver.focus(seg(0));
      await driver.mutate("sc", [{ move: 0, before: "end" }]);
      const kept = await driver.focusedElement();
      await driver.clickTarget("away");
      await driver.mutate("sc", [{ move: 1, before: 0 }]);
      await inPage(frames, undefined);
      return { kept, left: await driver.focusedElement() };
    },
    expected: { kept: seg(1), left: null },
  },
  {
    // Mutants: `focusLeft` always true; the focus listeners not in the capture phase.
    name: "R-03: a host that focuses the button after the group while it removes the focused, pressed Mine keeps that focus, beside a removal with no such host; with segments whose focusin and focusout stop propagating, a pressed, focused segment that becomes disabled moves focus with the press, and a later host move does not steal focus back after Tab out",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All", "Mine", "Blocked", "Done", "Later"]), 'label="Lane filter" value="mine"'));
      await driver.focus(seg(1));
      await driver.mutate("sc", [{ remove: 1 }]);
      const moved = await driver.focusedElement();
      await inPage(() => {
        document.getElementById("sc")?.addEventListener(
          "focusout",
          () => {
            document.getElementById("after")?.focus();
          },
          { once: true },
        );
      }, null);
      await driver.mutate("sc", [{ remove: 1 }]);
      await inPage(frames, undefined);
      const kept = await driver.focusedElement();
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
      await inPage(() => {
        for (const child of document.querySelectorAll("#sc > ocelle-segment")) {
          for (const type of ["focusin", "focusout"]) {
            child.addEventListener(type, (event) => {
              event.stopPropagation();
            });
          }
        }
      }, null);
      await driver.focus(seg(1));
      await driver.mutate("sc", [{ child: 1, attribute: "disabled", value: "" }]);
      await inPage(frames, undefined);
      const disabled = { focus: await driver.focusedElement(), value: await inPage(valueOf, "sc") };
      await driver.pressKeys("Tab", ["Shift"]);
      await driver.mutate("sc", [{ move: 0, before: "end" }]);
      return { moved, kept, disabled, left: await driver.focusedElement() };
    },
    expected: { moved: seg(1), kept: after, disabled: { focus: seg(2), value: "blocked" }, left: before },
  },
  {
    // Added after the mutation run (reviews/phase-4/notes.md). Mutant: `aria-label` not observed (a host
    // `aria-label` removed after a render that read it then leaves its text as the name).
    name: "FR-006: a host aria-label present while the label changes, then removed, leaves the toolbar named by the new label",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All"]), 'label="Lane filter" aria-label="Filter by lane"'));
      const host = (await tree(driver))[0];
      await driver.setProperty("sc", "label", "Lanes");
      const relabelled = (await tree(driver))[0];
      await driver.setAttribute("sc", "aria-label", null);
      return { host, relabelled, removed: (await tree(driver))[0] };
    },
    expected: {
      host: { role: "toolbar", name: "Filter by lane", orientation: "horizontal" },
      relabelled: { role: "toolbar", name: "Filter by lane", orientation: "horizontal" },
      removed: { role: "toolbar", name: "Lanes", orientation: "horizontal" },
    },
  },
  {
    // Added after the mutation run. Mutant: the group not observed when `joined` is set after render (a later resize
    // then leaves the rounding of one row).
    name: "joined set after render: a later resize to two rows rounds each row on its own at the delivery, beside the one-row rounding at the set",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine"'));
      const { twoRows } = await measured(driver, inPage);
      await driver.setAttribute("sc", "joined", "");
      await driver.afterResizeDelivery("box");
      const set = await inPage(radii, null);
      await resized(driver, inPage, twoRows - 8);
      return { set, wrapped: { rows: await inPage(rows, null), radii: await inPage(radii, null) } };
    },
    expected: { set: [startRound, square, square, endRound], wrapped: { rows: [0, 0, 0, 1], radii: [startRound, square, endRound, bothRound] } },
  },
  {
    // Added after the mutation run. Mutant: every element child taken as a segment (the text before the segments then
    // pressed and the tab stop).
    name: "a child of the group that is not a segment gets no state and is not pressed or a tab stop, beside the first segment pressed and taking the tab stop",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(`<span id="note">Lanes:</span>${segmentsOf(["All", "Mine"])}`));
      await driver.focus("before");
      await driver.pressKeys("Tab");
      return {
        note: await inPage(() => ["aria-pressed", "aria-disabled", "tabindex"].map((name) => document.getElementById("note")?.getAttribute(name) ?? null), null),
        tree: await tree(driver),
        value: await inPage(valueOf, "sc"),
        tabindexes: await inPage(tabindexes, "sc"),
        focus: await driver.focusedElement(),
      };
    },
    expected: { note: [null, null, null], tree: exposed("Lane filter", ["All", "Mine"]), value: "all", tabindexes: ["0", "-1"], focus: seg(0) },
  },
  {
    // Added after the mutation run. Mutant: a segment that leaves a joined group keeping its joined state (square
    // corners and the negative margins outside the group).
    name: "a segment that leaves a joined group loses the joined look: its corners are radius-2 and it has no negative margin, beside the same segment squared with a -1 px margin inside",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(["All", "Mine", "Blocked"]), 'label="Lane filter" value="all" joined'));
      await measured(driver, inPage);
      const look = (selector: string): unknown => {
        const mine = document.querySelector(selector);
        if (mine === null) return null;
        const style = getComputedStyle(mine);
        return { margin: style.marginInlineStart, radii: [style.borderStartStartRadius, style.borderStartEndRadius, style.borderEndEndRadius, style.borderEndStartRadius] };
      };
      const inside = await inPage(look, "#sc > ocelle-segment:nth-child(2)");
      await inPage(() => {
        const mine = document.querySelectorAll("#sc > ocelle-segment")[1];
        if (mine !== undefined) document.body.append(mine);
      }, null);
      await inPage(frames, undefined);
      return { inside, left: await inPage(look, "body > ocelle-segment") };
    },
    expected: { inside: { margin: "-1px", radii: square }, left: { margin: "0px", radii: bothRound } },
  },
  {
    // Added after the second mutation run (reviews/phase-4/notes.md). Mutant: the segments not observed again after a
    // child batch (a reorder at the same group size, which resizes nothing, then leaves the old rounding).
    name: "joined: a reorder at the same group size, Done moved before All, regroups at the next delivery: Done takes the start rounding and Blocked the end rounding",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(segmentsOf(lanes), 'label="Lane filter" value="mine" joined'));
      await measured(driver, inPage);
      const before = { height: (await driver.box("sc")).height, radii: await inPage(radii, null) };
      await inPage(task, undefined);
      await driver.mutate("sc", [{ move: 3, before: 0 }]);
      await driver.afterResizeDelivery("box");
      return { before, after: { sameHeight: (await driver.box("sc")).height === before.height, names: (await tree(driver)).slice(1).map((node) => node.name), radii: await inPage(radii, null) } };
    },
    expected: {
      before: { height: 44, radii: [startRound, square, square, endRound] },
      after: { sameHeight: true, names: ["Done", "All", "Mine", "Blocked"], radii: [startRound, square, square, endRound] },
    },
  },
];
