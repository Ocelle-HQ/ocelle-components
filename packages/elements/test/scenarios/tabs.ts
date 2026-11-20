// The shared bodies of User Story 2's browser scenarios for `ocelle-tabs`, `ocelle-tab` and `ocelle-tab-panel` (014
// spec US2 scenarios 1 to 24 and the tabs' Edge Cases; research.md R-01 to R-06, R-10, R-15; contracts/elements.md
// § Pairings; T042). Each body mounts its page, acts with real keyboard and pointer input through the driver, sets up and
// reads what the driver has no command for with a self-contained function run in the page (`InPage`: the event
// recorder, the focused element named by its place among the tabs, the panels' boxes, the children's attributes) and
// returns one observation; each harness asserts it equals `expected`, written by hand from the spec, the data model and
// research (colours from the token table of packages/tokens/test/expected.ts; sizes from the tokens:
// `--ocelle-target-min` 44 px, `--ocelle-bar-width` 3 px, `--ocelle-focus-width` 3 px at `--ocelle-focus-offset` 2 px).
// Every "does not" outcome is observed in the same body as the positive outcome it guards, with the setup that makes it
// falsifiable; the plant that makes each fail is named beside the body and run once in reviews/phase-3/plants.md. The
// in-process harness (test/tabs.test.ts) runs every body; the fixture harness (test/browser/tabs.test.ts) runs the
// bodies marked `fixture`.
//
// The tabs write generated ids on their children (research.md R-02), so the driver's `focusedElement` would name a
// focused tab or panel by an id that depends on a per-document counter. `where` names the focused element by its place
// instead: `{ tab: i }` or `{ panel: i }` among the children of `#tb`, else its own id.
//
// US2-21 and US2-22 name `ocelle-segmented-choice` (phase 4) and `ocelle-link` (phase 6), which did not exist in phase
// 3. Their phase 3 bodies use stand-ins with the property the scenario is about: a nested `ocelle-tabs` (a nested parent
// of the same keyboard mechanism, whose ArrowRight is a handled key) and `x-shadow-link`, a custom element defined by the
// body whose open shadow root delegates focus to an `<a href>` (a focusable reached only through a shadow root). The
// stand-in bodies stay; phase 4 adds US2-21's body with the real `ocelle-segmented-choice` (T062b), and phase 6 adds
// US2-22's with the real `ocelle-link` (T093a; reviews/phase-3/notes.md).
import { tokenColour } from "./icon.ts";
import type { AxState, AxTarget, Driver, InPage, DriverTarget } from "./driver.ts";

/** One body: what it checks, what it must observe, and whether the fixture harness runs it too. */
export interface TabsScenario {
  readonly name: string;
  readonly run: (driver: Driver, inPage: InPage) => Promise<unknown>;
  readonly expected: unknown;
  readonly fixture: boolean;
}

const views = ["Spec", "Plan", "Tasks"];

/** One tab's markup: `value` is the lower-case name unless `values` is false. */
function tabOf(name: string, options: { readonly disabled?: boolean; readonly values?: boolean } = {}): string {
  const value = options.values === false ? "" : ` value="${name.toLowerCase()}"`;
  return `<ocelle-tab${value}${options.disabled === true ? " disabled" : ""}>${name}</ocelle-tab>`;
}

/** One panel's markup, holding `content` (by default a paragraph naming the view, nothing focusable). */
function panelOf(name: string, content = `<p>${name} content</p>`): string {
  return `<ocelle-tab-panel>${content}</ocelle-tab-panel>`;
}

/** The tabs and panels of `names`, tabs first, `disabled` the indexes of disabled tabs. */
function tabsOf(names: readonly string[], disabled: readonly number[] = [], values = true): string {
  return names.map((name, index) => tabOf(name, { disabled: disabled.includes(index), values })).join("") + names.map((name) => panelOf(name)).join("");
}

/** The page of most bodies: a button before the tabs `#tb`, the tabs, a button after them and plain text away from them. */
function page(inner: string, attributes = 'label="Mission views"'): string {
  return `<button id="before" type="button">Before</button><ocelle-tabs id="tb" ${attributes}>${inner}</ocelle-tabs><button id="after" type="button">After</button><p id="away">Away from the tabs</p>`;
}

/** The `index`-th tab and panel of `#tb` (or of `parent`), as driver targets. */
function tab(index: number, parent = "tb"): AxTarget {
  return { parent, kind: "ocelle-tab", index };
}
function panel(index: number, parent = "tb"): AxTarget {
  return { parent, kind: "ocelle-tab-panel", index };
}

/** Mounts `markup`, scrolls the page to its start and moves the pointer onto the plain text away from the tabs. */
async function mount(driver: Driver, inPage: InPage, markup: string): Promise<void> {
  await driver.mount(markup);
  await inPage(() => {
    window.scrollTo(0, 0);
  }, null);
  if (markup.includes('id="away"')) await driver.hoverTarget("away");
}

/**
 * The focused element, through shadow roots: `{ tab: i }` or `{ panel: i }` when it is the i-th `ocelle-tab` or
 * `ocelle-tab-panel` child of `#tb` (with `parent` the id of another `ocelle-tabs` that holds it); `{ host, part }` for a part in a shadow root of a host with an id; else `{ id }`;
 * null when nothing but the body has focus.
 */
function where(): unknown {
  let active: Element | null = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  if (active === null || active === document.body || active === document.documentElement) return null;
  const parent = active.parentElement;
  if (parent !== null && parent.localName === "ocelle-tabs" && parent.id !== "" && (active.localName === "ocelle-tab" || active.localName === "ocelle-tab-panel")) {
    const kind = active.localName;
    const index = [...parent.children].filter((child) => child.localName === kind).indexOf(active);
    const place = kind === "ocelle-tab" ? { tab: index } : { panel: index };
    return parent.id === "tb" ? place : { ...place, parent: parent.id };
  }
  const root = active.getRootNode();
  const part = active.getAttribute("part");
  if (root instanceof ShadowRoot && part !== null && root.host.id !== "") return { host: root.host.id, part };
  return { id: active.id };
}

/**
 * Records every `ocelle-tabs-change` at the document on `window.__events`: its type, `detail` (a copy), `bubbles`,
 * `composed`, `cancelable`, the target's id and the target's `value` at dispatch (FR-002). A second call replaces the
 * first's listener.
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
  document.addEventListener("ocelle-tabs-change", listener);
  scope.__eventsOff = () => {
    document.removeEventListener("ocelle-tabs-change", listener);
  };
}

/** A copy of the events `recordEvents` recorded. */
function recordedEvents(): unknown {
  return JSON.parse(JSON.stringify((window as unknown as { __events?: unknown[] }).__events ?? [])) as unknown;
}

/** A change event as `recordEvents` records it, on `#tb`. */
function change(value: string, target = "tb"): unknown {
  return { type: "ocelle-tabs-change", detail: { value }, bubbles: true, composed: true, cancelable: false, target, value };
}

/** The `value` property of the element with `id`, as a string, or null when it has none. */
function valueOf(id: string): string | null {
  const value = (document.getElementById(id) as unknown as { value?: unknown } | null)?.value;
  return typeof value === "string" ? value : null;
}

/** The `tabindex` attribute of each `ocelle-tab` child of the element with `id`. */
function tabindexes(id: string): (string | null)[] {
  return [...(document.getElementById(id)?.children ?? [])].filter((child) => child.localName === "ocelle-tab").map((child) => child.getAttribute("tabindex"));
}

/** Per `ocelle-tab-panel` child of the element with `id`: whether it has a box (any client rect). */
function shown(id: string): boolean[] {
  return [...(document.getElementById(id)?.children ?? [])].filter((child) => child.localName === "ocelle-tab-panel").map((child) => child.getClientRects().length > 0);
}

/** Per `ocelle-tab` child of the element with `id`: whether it has a box (any client rect). */
function tabsShown(id: string): boolean[] {
  return [...(document.getElementById(id)?.children ?? [])].filter((child) => child.localName === "ocelle-tab").map((child) => child.getClientRects().length > 0);
}

/** The interactive roles, and the tabpanel; any other node of the tabs' subtree is text or structure. */
const interactiveRoles = new Set(["listbox", "option", "button", "link", "textbox", "searchbox", "checkbox", "radio", "switch", "combobox", "slider", "spinbutton", "tab", "tablist", "tabpanel", "menu", "menuitem", "toolbar", "tree", "treeitem", "grid", "gridcell"]);

/** An exposed node as the scenarios state it: role and name, and for tabs whether selected and disabled. */
interface Exposed {
  readonly role: string;
  readonly name: string;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}

/** The interactive nodes and tabpanels of the accessibility subtree of `id`, in tree order. */
async function tree(driver: Driver, id = "tb"): Promise<Exposed[]> {
  const nodes = await driver.axStates(id, "subtree");
  return nodes
    .filter((node: AxState) => interactiveRoles.has(node.role))
    .map((node) => (node.role === "tab" ? { role: node.role, name: node.name, selected: node.selected === true, disabled: node.disabled === true } : { role: node.role, name: node.name }));
}

/** A tablist named `name` with tabs `names`, the `selected` one selected, the `disabled` ones disabled, then the selected tab's panel. */
function exposed(name: string, names: readonly string[], selected: number | null = 0, disabled: readonly number[] = []): Exposed[] {
  const tabs = names.map((each, index) => ({ role: "tab", name: each, selected: index === selected, disabled: disabled.includes(index) }));
  const panelNode = selected === null ? [] : [{ role: "tabpanel", name: names[selected] ?? "" }];
  return [{ role: "tablist", name }, ...tabs, ...panelNode];
}

/** The roles of the unignored accessibility ancestors of `target`, nearest first. */
async function ancestors(driver: Driver, target: AxTarget): Promise<string[]> {
  return (await driver.axStates(target, "ancestors")).map((node) => node.role);
}

/** What `controls` the tab at `target` is exposed with, as role and name. */
async function controls(driver: Driver, target: AxTarget): Promise<unknown> {
  const [node] = await driver.axStates(target);
  return node?.controls ?? [];
}

/**
 * The selected bar of a tab: the `::before` content, and with content the thickness and colour of its block-end edge,
 * its block-end and inline offsets and its background. The bar is that pseudo-element's block-end border, not its
 * background (changed after the red run, reviews/phase-3/notes.md): the bar is still read as exactly `--ocelle-bar-width`
 * thick in its colour, on the block-end edge across the whole tab, and with no background.
 */
async function bar(driver: Driver, target: DriverTarget): Promise<unknown> {
  const content = await driver.computedPart(target, "::before", "content");
  if (content === "none" || content === "normal") return { content: "none" };
  return {
    content,
    block: await driver.computedPart(target, "::before", "border-block-end-width"),
    end: await driver.computedPart(target, "::before", "inset-block-end"),
    start: await driver.computedPart(target, "::before", "inset-inline-start"),
    inlineEnd: await driver.computedPart(target, "::before", "inset-inline-end"),
    colour: await driver.computedPart(target, "::before", "border-block-end-color"),
    style: await driver.computedPart(target, "::before", "border-block-end-style"),
    background: await driver.computedPart(target, "::before", "background-color"),
  };
}

/** The bar FR-025 and R-15 give a selected tab: 3 px on its block-end edge, the full inline size, in `colour`. */
function selectedBar(colour: string): unknown {
  return { content: '""', block: "3px", end: "0px", start: "0px", inlineEnd: "0px", colour, style: "solid", background: "rgba(0, 0, 0, 0)" };
}
const noBar = { content: "none" };

/** The ring of a focused tab: its `::after` border on each side, width and colour. */
async function ring(driver: Driver, target: DriverTarget): Promise<unknown> {
  const out: string[] = [];
  for (const side of ["top", "right", "bottom", "left"]) out.push(`${await driver.computedPart(target, "::after", `border-${side}-width`)} ${await driver.computedPart(target, "::after", `border-${side}-color`)}`);
  return out;
}

/** The outline of a focused panel: width, style, colour and offset. */
async function outline(driver: Driver, target: DriverTarget): Promise<unknown> {
  return [await driver.computedNode(target, "outline-width"), await driver.computedNode(target, "outline-style"), await driver.computedNode(target, "outline-color"), await driver.computedNode(target, "outline-offset")];
}

/**
 * The colour of the pixel 3.5 CSS px outside the middle of each edge of the `index`-th tab of `#tb` (inside the ring
 * band, 2 to 5 px out), top, right, bottom and left, read from a screenshot of `#tb`.
 */
async function ringPixels(driver: Driver, index: number): Promise<string[]> {
  const host = await driver.box("tb");
  const box = await driver.box(tab(index));
  const image = await driver.pixels("tb");
  const scale = image.width / host.width;
  const x = box.x - host.x;
  const y = box.y - host.y;
  const at = (cssX: number, cssY: number): string => {
    const offset = (Math.floor(cssY * scale) * image.width + Math.floor(cssX * scale)) * 4;
    return `rgb(${String(image.data[offset])}, ${String(image.data[offset + 1])}, ${String(image.data[offset + 2])})`;
  };
  const out = 3.5;
  return [at(x + box.width / 2, y - out), at(x + box.width + out, y + box.height / 2), at(x + box.width / 2, y + box.height + out), at(x - out, y + box.height / 2)];
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

/**
 * What the tabs wrote on their children for the association (R-02, SC-003): per tab its `id`, `aria-controls` and
 * whether that id names a panel of `#tb` in the document's own scope (its index among the panels); per panel its `id`,
 * whether it has `aria-labelledby` and which tab that names; and whether the tabs' shadow root holds any element with
 * an `id` or an id reference.
 */
function association(): unknown {
  const host = document.getElementById("tb");
  const children = [...(host?.children ?? [])];
  const tabs = children.filter((child) => child.localName === "ocelle-tab");
  const panels = children.filter((child) => child.localName === "ocelle-tab-panel");
  const indexIn = (list: Element[], id: string | null): number | null => {
    if (id === null) return null;
    const found = document.getElementById(id);
    return found === null ? -1 : list.indexOf(found);
  };
  return {
    tabs: tabs.map((each) => ({ hasId: each.id !== "", controls: indexIn(panels, each.getAttribute("aria-controls")) })),
    panels: panels.map((each) => ({ hasId: each.id !== "", labelledBy: indexIn(tabs, each.getAttribute("aria-labelledby")) })),
    unique: new Set([...tabs, ...panels].map((each) => each.id)).size === tabs.length + panels.length,
    shadowIds: [...(host?.shadowRoot?.querySelectorAll("[id], [aria-controls], [aria-labelledby]") ?? [])].length,
  };
}

const accentLight = tokenColour("color-accent-strong", "light");
const accentDark = tokenColour("color-accent-strong", "dark");
const hoverLight = tokenColour("color-hover-bg", "light");
const transparent = "rgba(0, 0, 0, 0)";
const longLabel = "A view whose name is much longer than the tab row is wide, so that it wraps inside the tab onto further lines";

/** The page of US2-21: the selected Plan panel holds a button counting its clicks, a text input and a nested tabs. */
const nestedPanel =
  '<button id="inner-button" type="button">Run</button><input id="field" type="text" value="abcdef"><ocelle-tabs id="inner" label="Inner"><ocelle-tab value="one">One</ocelle-tab><ocelle-tab value="two">Two</ocelle-tab><ocelle-tab-panel><p>One content</p></ocelle-tab-panel><ocelle-tab-panel><p>Two content</p></ocelle-tab-panel></ocelle-tabs>';

/**
 * The page of US2-21 with the real element (phase 4, T062b): the selected Plan panel holds a button, a text input and an
 * `ocelle-segmented-choice` with All pressed.
 */
const segmentedPanel =
  '<button id="inner-button" type="button">Run</button><input id="field" type="text" value="abcdef"><ocelle-segmented-choice id="lanes" label="Lanes" value="all"><ocelle-segment value="all">All</ocelle-segment><ocelle-segment value="mine">Mine</ocelle-segment></ocelle-segmented-choice>';

/** Defines, once, `x-shadow-link`: an element whose open shadow root delegates focus to `<a part="anchor" href="#x">`. */
function defineShadowLink(): void {
  if (customElements.get("x-shadow-link") !== undefined) return;
  customElements.define(
    "x-shadow-link",
    class extends HTMLElement {
      constructor() {
        super();
        const root = this.attachShadow({ mode: "open", delegatesFocus: true });
        const anchor = document.createElement("a");
        anchor.setAttribute("part", "anchor");
        anchor.setAttribute("href", "#x");
        anchor.append(document.createElement("slot"));
        root.append(anchor);
      }
    },
  );
}

/** How a host changes the focused, selected Plan and sets `value` in one task (the R1-01 case of phase 2, for tabs). */
interface ChangeAndSet {
  readonly change: "remove" | "move";
  readonly by: "property" | "attribute";
}

/** In one task: removes Plan and its panel from `#tb`, or moves both to the end, then sets the tabs' `value` to `spec`. */
function changeAndSet(how: ChangeAndSet): void {
  const tabs = document.getElementById("tb") as (HTMLElement & { value: string }) | null;
  const plan = tabs?.querySelector('ocelle-tab[value="plan"]');
  const planPanel = tabs?.querySelectorAll("ocelle-tab-panel")[1];
  const firstPanel = tabs?.querySelector("ocelle-tab-panel");
  if (tabs === null || plan === null || plan === undefined || planPanel === undefined || firstPanel === null || firstPanel === undefined) return;
  if (how.change === "remove") {
    plan.remove();
    planPanel.remove();
  } else {
    tabs.insertBefore(plan, firstPanel);
    tabs.append(planPanel);
  }
  if (how.by === "property") tabs.value = "spec";
  else tabs.setAttribute("value", "spec");
}

const changesAndSets: readonly ChangeAndSet[] = (["remove", "move"] as const).flatMap((change) => (["property", "attribute"] as const).map((by) => ({ change, by })));

/**
 * How a host re-renders the focused tab on its blur (contracts § Pairings, "Tab out while the host re-renders on blur"):
 * installs, once, a host `focusout` listener on `#tb` that moves the blurred tab before the first panel, or removes it, in a microtask.
 */
function rerenderOnBlur(what: "move" | "remove"): void {
  const host = document.getElementById("tb");
  host?.addEventListener(
    "focusout",
    (event) => {
      const child = event.target as Element;
      if (child.localName !== "ocelle-tab") return;
      queueMicrotask(() => {
        if (what === "move") host.insertBefore(child, host.querySelector("ocelle-tab-panel"));
        else child.remove();
      });
    },
    { once: true },
  );
}

export const tabsScenarios: readonly TabsScenario[] = [
  {
    // Plants: the tablist role on the host (the tabpanel then inside the tablist); hiding panels with `visibility` only
    // (the unselected panels then have a box); no `aria-controls`.
    name: "US2-1: a tablist named Mission views with three tabs, Spec selected, and one tabpanel named Spec beside the tablist, not inside it; the other panels have no box and no node; Spec controls its panel; one tab stop (FR-019, FR-024)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const first = await inPage(where, null);
      return {
        tree: await tree(driver),
        controls: await controls(driver, tab(0)),
        panelAncestors: (await ancestors(driver, panel(0))).includes("tablist"),
        tabAncestors: (await ancestors(driver, tab(0)))[0],
        shown: await inPage(shown, "tb"),
        tabindexes: await inPage(tabindexes, "tb"),
        value: await inPage(valueOf, "tb"),
        first,
        events: await inPage(recordedEvents, null),
      };
    },
    expected: {
      tree: exposed("Mission views", views),
      controls: [{ role: "tabpanel", name: "Spec" }],
      panelAncestors: false,
      tabAncestors: "tablist",
      shown: [true, false, false],
      tabindexes: ["0", "-1", "-1"],
      value: "spec",
      first: { tab: 0 },
      events: [],
    },
  },
  {
    // Plants: selection not following focus on the arrows (no event, Spec still selected); the change dispatched
    // before `value` is updated.
    name: "US2-2: ArrowRight on Spec moves focus and selection to Plan, shows Plan's panel named Plan, hides Spec's, and emits one change event with value plan (FR-021)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowRight");
      return {
        focus: await inPage(where, null),
        tree: await tree(driver),
        controls: await controls(driver, tab(1)),
        shown: await inPage(shown, "tb"),
        tabindexes: await inPage(tabindexes, "tb"),
        value: await inPage(valueOf, "tb"),
        events: await inPage(recordedEvents, null),
        keys: (await driver.keydownRecord()).slice(1),
      };
    },
    expected: {
      focus: { tab: 1 },
      tree: exposed("Mission views", views, 1),
      controls: [{ role: "tabpanel", name: "Plan" }],
      shown: [false, true, false],
      tabindexes: ["-1", "0", "-1"],
      value: "plan",
      events: [change("plan")],
      keys: [{ key: "ArrowRight", defaultPrevented: true }],
    },
  },
  {
    // Plant: `wrap: false` for the tabs.
    name: "US2-3: ArrowRight on the last tab Tasks wraps focus and selection to Spec, ArrowLeft on Spec wraps to Tasks, each with its change event (FR-021)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="tasks"'));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(2));
      await driver.pressKeys("ArrowRight");
      const right = { focus: await inPage(where, null), tree: await tree(driver) };
      await driver.pressKeys("ArrowLeft");
      return { right, left: { focus: await inPage(where, null), tree: await tree(driver) }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      right: { focus: { tab: 0 }, tree: exposed("Mission views", views, 0) },
      left: { focus: { tab: 2 }, tree: exposed("Mission views", views, 2) },
      events: [change("spec"), change("tasks")],
    },
  },
  {
    name: "US2-4: Home on Plan focuses and selects Spec, End then Tasks, each with its change event (FR-021)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(1));
      await driver.pressKeys("Home");
      const home = { focus: await inPage(where, null), value: await inPage(valueOf, "tb") };
      await driver.pressKeys("End");
      return { home, end: { focus: await inPage(where, null), value: await inPage(valueOf, "tb") }, events: await inPage(recordedEvents, null), keys: await driver.keydownRecord() };
    },
    expected: {
      home: { focus: { tab: 0 }, value: "spec" },
      end: { focus: { tab: 2 }, value: "tasks" },
      events: [change("spec"), change("tasks")],
      keys: [
        { key: "Home", defaultPrevented: true },
        { key: "End", defaultPrevented: true },
      ],
    },
  },
  {
    // Plant: `rtl` not read (ArrowLeft then goes back, wrapping to Tasks, under rtl as well).
    name: "US2-5: under dir=rtl on an ancestor ArrowLeft on Spec moves to Plan (the visual order), beside the left-to-right case where it wraps to Tasks (FR-021)",
    fixture: true,
    run: async (driver, inPage) => {
      const markup = `<div id="wrap">${page(tabsOf(views))}</div>`;
      await mount(driver, inPage, markup);
      await driver.focusNode(tab(0));
      await driver.pressKeys("ArrowLeft");
      const ltr = await inPage(where, null);
      await mount(driver, inPage, markup);
      await driver.dir("wrap", "rtl");
      await driver.focusNode(tab(0));
      await driver.pressKeys("ArrowLeft");
      return { ltr, rtl: await inPage(where, null), value: await inPage(valueOf, "tb") };
    },
    expected: { ltr: { tab: 2 }, rtl: { tab: 1 }, value: "plan" },
  },
  {
    // Plants: the panel never focusable (Tab then leaves to the button after the tabs); the panel focusable even when it
    // holds a focusable (Tab then stops on it before the button); no focus ring on the panel.
    name: "US2-6: Tab on the selected tab moves into its panel, onto the panel itself when it holds nothing focusable, which shows the focus ring, or onto its first focusable; Shift+Tab returns to the tab; only the selected tab is in the tab order (FR-023)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const tabStop = await inPage(where, null);
      await driver.pressKeys("Tab");
      const inPanel = await inPage(where, null);
      const ringOnPanel = await outline(driver, panel(0));
      await driver.pressKeys("Tab");
      const out = await inPage(where, null);
      await driver.pressKeys("Tab", ["Shift"]);
      await driver.pressKeys("Tab", ["Shift"]);
      const back = await inPage(where, null);
      await mount(driver, inPage, page(tabsOf(["Spec", "Plan"]).replace("<p>Spec content</p>", '<p>Spec content</p><button id="in-panel" type="button">Edit</button>')));
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      const toButton = await inPage(where, null);
      return { tabStop, inPanel, ringOnPanel, out, back, toButton, panelTabindex: await inPage(() => document.querySelector("#tb > ocelle-tab-panel")?.getAttribute("tabindex") ?? null, null) };
    },
    expected: {
      tabStop: { tab: 0 },
      inPanel: { panel: 0 },
      ringOnPanel: ["3px", "solid", accentLight, "2px"],
      out: { id: "after" },
      back: { tab: 0 },
      toButton: { id: "in-panel" },
      panelTabindex: null,
    },
  },
  {
    // Plant: `disabled` ignored in the click handler and in the model's user selection (Plan then selected).
    name: "US2-7: arrows skip the disabled Plan, a click on it selects, focuses and emits nothing beside a click on Tasks that does, it is exposed disabled; Home and End skip disabled ends (FR-021)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views, [1])));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(0));
      await driver.pressKeys("ArrowRight");
      const skipped = { focus: await inPage(where, null), value: await inPage(valueOf, "tb") };
      await driver.clickTarget(tab(1), { force: true });
      const disabledClick = { tree: await tree(driver), focus: await inPage(where, null), events: await inPage(recordedEvents, null) };
      await driver.clickTarget(tab(0));
      const enabledClick = { tree: await tree(driver), focus: await inPage(where, null) };
      await mount(driver, inPage, page(tabsOf(["Spec", "Plan", "Tasks", "Notes"], [0, 3]), 'label="Mission views" value="plan"'));
      await driver.focusNode(tab(1));
      await driver.pressKeys("End");
      const end = await inPage(where, null);
      await driver.pressKeys("Home");
      return { skipped, disabledClick, enabledClick, end, home: await inPage(where, null) };
    },
    expected: {
      skipped: { focus: { tab: 2 }, value: "tasks" },
      disabledClick: { tree: exposed("Mission views", views, 2, [1]), focus: { tab: 2 }, events: [change("tasks")] },
      enabledClick: { tree: exposed("Mission views", views, 0, [1]), focus: { tab: 0 } },
      end: { tab: 2 },
      home: { tab: 1 },
    },
  },
  {
    // Plant: dispatching change from the `value` setter.
    name: "US2-8: a host set of value tasks, by property or by attribute, selects Tasks and shows its panel with no event (FR-002, FR-010)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.setProperty("tb", "value", "tasks");
      const property = { tree: await tree(driver), shown: await inPage(shown, "tb"), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb") };
      await driver.setAttribute("tb", "value", "plan");
      const attribute = { tree: await tree(driver), shown: await inPage(shown, "tb"), value: await inPage(valueOf, "tb") };
      return { property, attribute, events: await inPage(recordedEvents, null) };
    },
    expected: {
      property: { tree: exposed("Mission views", views, 2), shown: [false, false, true], tabindexes: ["-1", "-1", "0"], value: "tasks" },
      attribute: { tree: exposed("Mission views", views, 1), shown: [false, true, false], value: "plan" },
      events: [],
    },
  },
  {
    // Plant: assigning every tab to the tablist slot (the fourth tab then exposed and reached by End).
    name: "US2-9: with four tabs and three panels the fourth tab has no box and no node and End skips it; with three tabs and four panels the fourth panel is never shown; nothing is thrown (FR-019)",
    fixture: true,
    run: async (driver, inPage) => {
      const four = ["Spec", "Plan", "Tasks", "Notes"];
      await mount(driver, inPage, page(four.map((name) => tabOf(name)).join("") + views.map((name) => panelOf(name)).join("")));
      await driver.focusNode(tab(0));
      await driver.pressKeys("End");
      const extraTab = { tree: await tree(driver), focus: await inPage(where, null), tabs: await inPage(tabsShown, "tb") };
      await mount(driver, inPage, page(views.map((name) => tabOf(name)).join("") + four.map((name) => panelOf(name)).join("")));
      await driver.setProperty("tb", "value", "tasks");
      return { extraTab, extraPanel: { tree: await tree(driver), shown: await inPage(shown, "tb") }, messages: await driver.messages() };
    },
    expected: {
      extraTab: { tree: exposed("Mission views", views, 2), focus: { tab: 2 }, tabs: [true, true, true, false] },
      extraPanel: { tree: exposed("Mission views", views, 2), shown: [false, false, true, false] },
      messages: [],
    },
  },
  {
    // Plant: `flex-wrap: nowrap` on the tablist (the row then overflows the page sideways).
    name: "US2-10: at a 320 px viewport tabs wider than the row wrap onto further rows inside the element, the page does not scroll sideways, and the arrows follow document order (FR-022)",
    fixture: true,
    run: async (driver, inPage) => {
      const start = await inPage(() => [window.innerWidth, window.innerHeight], null);
      const many = ["Specification", "Planning", "Tasks", "Research", "Contracts", "Quickstart"];
      await mount(driver, inPage, page(tabsOf(many)));
      await driver.setViewportSize(320, 640);
      const rows = new Set<number>();
      for (let index = 0; index < many.length; index += 1) rows.add(Math.round((await driver.box(tab(index))).y));
      const sideways = await inPage(() => document.documentElement.scrollWidth > document.documentElement.clientWidth, null);
      await driver.focusNode(tab(2));
      await driver.pressKeys("ArrowRight");
      const observed = { wrapped: rows.size > 1, sideways, next: await inPage(where, null), within: (await driver.box("tb")).width <= 320 };
      await driver.setViewportSize(start[0] ?? 0, start[1] ?? 0);
      return observed;
    },
    expected: { wrapped: true, sideways: false, next: { tab: 3 }, within: true },
  },
  {
    // Plants: the bar drawn by colour only (no size); the bar on the inline-start edge; the bar as an inset box-shadow
    // only (forced colours compute it to none: no Highlight edge).
    name: "US2-11: the selected tab shows a bar of bar-width on its block-end edge in accent-strong, unselected tabs none; in forced colours a Highlight bar and the focused tab a Highlight ring (FR-008, FR-025)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      const paint = { selected: await bar(driver, tab(1)), others: [await bar(driver, tab(0)), await bar(driver, tab(2))] };
      await driver.forcedColors("active", "light");
      const highlight = await driver.resolveColour("Highlight");
      const canvas = await driver.resolveColour("Canvas");
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const named = (value: unknown): unknown => JSON.parse(JSON.stringify(value).split(highlight).join("Highlight")) as unknown;
      const forced = {
        distinct: highlight !== canvas,
        focus: await inPage(where, null),
        selected: named(await bar(driver, tab(1))),
        others: [await bar(driver, tab(0)), await bar(driver, tab(2))],
        ring: named(await ring(driver, tab(1))),
      };
      await driver.forcedColors("none");
      return { paint, forced };
    },
    expected: {
      paint: { selected: selectedBar(accentLight), others: [noBar, noBar] },
      forced: { distinct: true, focus: { tab: 1 }, selected: selectedBar("Highlight"), others: [noBar, noBar], ring: ["3px Highlight", "3px Highlight", "3px Highlight", "3px Highlight"] },
    },
  },
  {
    // Plants: the panel id rendered inside the tabs' shadow root; `aria-labelledby` on every panel; no `aria-controls`.
    name: "US2-12, SC-003: with no id or aria-* written by the host on any child, the tabs write ids in the page's own scope: every paired tab controls its panel, only the selected panel is labelled by its tab, nothing in the shadow root is referenced; the association moves with the selection",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      const first = { association: await inPage(association, null), tree: await tree(driver), controls: await controls(driver, tab(0)) };
      await driver.focusNode(tab(0));
      await driver.pressKeys("ArrowRight");
      return { first, moved: { association: await inPage(association, null), tree: await tree(driver) } };
    },
    expected: {
      first: {
        association: {
          tabs: [{ hasId: true, controls: 0 }, { hasId: true, controls: 1 }, { hasId: true, controls: 2 }],
          panels: [{ hasId: true, labelledBy: 0 }, { hasId: true, labelledBy: null }, { hasId: true, labelledBy: null }],
          unique: true,
          shadowIds: 0,
        },
        tree: exposed("Mission views", views),
        controls: [{ role: "tabpanel", name: "Spec" }],
      },
      moved: {
        association: {
          tabs: [{ hasId: true, controls: 0 }, { hasId: true, controls: 1 }, { hasId: true, controls: 2 }],
          panels: [{ hasId: true, labelledBy: null }, { hasId: true, labelledBy: 1 }, { hasId: true, labelledBy: null }],
          unique: true,
          shadowIds: 0,
        },
        tree: exposed("Mission views", views, 1),
      },
    },
  },
  {
    // Plants: change emitted without the "already selected" check; no `preventDefault()` on Space (the page scrolls).
    name: "US2-13: Enter and Space on the selected Plan are handled and change nothing, the page does not scroll; with focus on Spec while Tasks is selected, Enter selects Spec with one change event, and Space on Plan likewise (FR-021, FR-021a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `${page(tabsOf(views), 'label="Mission views" value="plan"')}<div id="tall"></div>`);
      await driver.rules("#tall { block-size: 3000px; }");
      await inPage(recordEvents, null);
      await driver.focusNode(tab(1));
      await driver.pressKeys("Enter");
      await driver.pressKeys(" ");
      const selected = { value: await inPage(valueOf, "tb"), scroll: await driver.scrollOffset(), events: await inPage(recordedEvents, null) };
      await driver.focusNode(tab(0));
      await driver.setProperty("tb", "value", "tasks");
      await driver.pressKeys("Enter");
      const enter = { focus: await inPage(where, null), tree: await tree(driver), shown: await inPage(shown, "tb") };
      await driver.focusNode(tab(1));
      await driver.pressKeys(" ");
      return { selected, enter, space: { value: await inPage(valueOf, "tb"), scroll: await driver.scrollOffset() }, events: await inPage(recordedEvents, null), keys: await driver.keydownRecord() };
    },
    expected: {
      selected: { value: "plan", scroll: { x: 0, y: 0 }, events: [] },
      enter: { focus: { tab: 0 }, tree: exposed("Mission views", views, 0), shown: [true, false, false] },
      space: { value: "plan", scroll: { x: 0, y: 0 } },
      events: [change("spec"), change("plan")],
      keys: [
        { key: "Enter", defaultPrevented: true },
        { key: " ", defaultPrevented: true },
        { key: "Enter", defaultPrevented: true },
        { key: " ", defaultPrevented: true },
      ],
    },
  },
  {
    // Plants: `preventDefault()` on every keydown; ArrowUp and ArrowDown as moves of the tabs.
    name: "US2-14: ArrowUp, ArrowDown, Escape and a letter on a tab are not handled and move nothing, beside ArrowRight, handled, which moves focus and selection (FR-021a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(0));
      for (const key of ["ArrowUp", "ArrowDown", "Escape", "t"]) await driver.pressKeys(key);
      const unhandled = { focus: await inPage(where, null), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
      await driver.pressKeys("ArrowRight");
      return { unhandled, handled: { focus: await inPage(where, null), value: await inPage(valueOf, "tb") }, events: await inPage(recordedEvents, null), keys: await driver.keydownRecord() };
    },
    expected: {
      unhandled: { focus: { tab: 0 }, value: "spec", events: [] },
      handled: { focus: { tab: 1 }, value: "plan" },
      events: [change("plan")],
      keys: [
        { key: "ArrowUp", defaultPrevented: false },
        { key: "ArrowDown", defaultPrevented: false },
        { key: "Escape", defaultPrevented: false },
        { key: "t", defaultPrevented: false },
        { key: "ArrowRight", defaultPrevented: true },
      ],
    },
  },
  {
    // Plant: change emitted without the "already selected" check (on the click and on Home).
    name: "US2-15: a click on the selected Spec and Home on Spec change nothing and emit nothing, beside ArrowRight's change event (FR-021)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.clickTarget(tab(0));
      await driver.pressKeys("Home");
      const same = { focus: await inPage(where, null), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
      await driver.pressKeys("ArrowRight");
      return { same, events: await inPage(recordedEvents, null) };
    },
    expected: { same: { focus: { tab: 0 }, value: "spec", events: [] }, events: [change("plan")] },
  },
  {
    // Plant: the default value written to the attribute, or from the index among all children (tabs and panels).
    name: "US2-16: tabs with no value report their index: ArrowRight twice from the first emits 1 then 2 and value reads 2; the default is not written to the attribute (FR-009, FR-020)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views, [], false)));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(0));
      await driver.pressKeys("ArrowRight");
      await driver.pressKeys("ArrowRight");
      const values = await inPage(() => [...document.querySelectorAll("#tb > ocelle-tab")].map((each) => [(each as unknown as { value: unknown }).value, each.getAttribute("value")]), null);
      return { value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null), values };
    },
    expected: {
      value: "2",
      events: [change("1"), change("2")],
      values: [
        ["0", null],
        ["1", null],
        ["2", null],
      ],
    },
  },
  {
    // Plants: clearing the selection on a value no tab has (as the listbox does); rewriting the states on every set.
    name: "US2-17: with Plan selected and focused, a host set of nope or of the empty value keeps Plan selected, its panel shown, the tab stop and value plan, with no event; a set of the current value mutates nothing, beside an earlier set that does (FR-010)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await inPage(countMutations, "tb");
      await driver.setProperty("tb", "value", "plan");
      const earlier = await inPage(mutations, null);
      await driver.focusNode(tab(1));
      const kept: unknown[] = [];
      for (const value of ["nope", ""]) {
        await driver.setProperty("tb", "value", value);
        kept.push({ tree: await tree(driver), shown: await inPage(shown, "tb"), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb"), focus: await inPage(where, null) });
      }
      await inPage(mutations, null);
      await driver.setProperty("tb", "value", "plan");
      return { mutatedEarlier: earlier > 0, kept, current: await inPage(mutations, null), events: await inPage(recordedEvents, null) };
    },
    expected: {
      mutatedEarlier: true,
      kept: [0, 1].map(() => ({ tree: exposed("Mission views", views, 1), shown: [false, true, false], tabindexes: ["-1", "0", "-1"], value: "plan", focus: { tab: 1 } })),
      current: 0,
      events: [],
    },
  },
  {
    // Plants: change dispatched from the model's fallback; focus not moved with the selection (it stays on the body).
    name: "US2-18: removing the selected, focused Plan with its panel selects Tasks, shows its panel, makes it the tab stop and moves focus to it, with no event; Plan becoming disabled does the same (FR-011, FR-011a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(1));
      await driver.mutate("tb", [{ remove: 4 }, { remove: 1 }]);
      await inPage(frames, undefined);
      const removed = { focus: await inPage(where, null), tree: await tree(driver), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb") };
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(1));
      await driver.mutate("tb", [{ child: 1, attribute: "disabled", value: "" }]);
      await inPage(frames, undefined);
      return { removed, disabled: { focus: await inPage(where, null), tree: await tree(driver), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb") }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      removed: { focus: { tab: 1 }, tree: exposed("Mission views", ["Spec", "Tasks"], 1), tabindexes: ["-1", "0"], value: "tasks" },
      disabled: { focus: { tab: 2 }, tree: exposed("Mission views", views, 2, [1]), tabindexes: ["-1", "-1", "0"], value: "tasks" },
      events: [],
    },
  },
  {
    // Found in this phase (reviews/phase-3/notes.md): the observer's callback, queued by an earlier mutation in the task,
    // runs before the focus record's `focusout` microtask. Plant: the observer's batch ignoring the focus record.
    name: "R-03: a host that moves Spec and then the selected, focused Plan to the end of the tabs in one task keeps focus and selection on Plan, with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      await inPage(recordEvents, null);
      await driver.focusNode(tab(1));
      await driver.mutate("tb", [
        { move: 0, before: 3 },
        { move: 0, before: 3 },
      ]);
      await inPage(frames, undefined);
      return { focus: await inPage(where, null), tree: await tree(driver), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
    },
    expected: { focus: { tab: 2 }, tree: exposed("Mission views", ["Tasks", "Spec", "Plan"], 2), value: "plan", events: [] },
  },
  {
    // Plant: the first enabled tab kept selected while disabled (no tab may be selected when none is enabled).
    name: "US2-18: with every tab disabled no tab is selected, no panel is shown, value reads the empty value and the tablist has no tab stop; enabling a tab again selects the first enabled tab, with no event (FR-011a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.mutate("tb", [0, 1, 2].map((child) => ({ child, attribute: "disabled", value: "" })));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const none = { tree: await tree(driver), shown: await inPage(shown, "tb"), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb"), tabbed: await inPage(where, null) };
      await driver.mutate("tb", [{ child: 2, attribute: "disabled", value: null }]);
      return { none, enabled: { tree: await tree(driver), shown: await inPage(shown, "tb"), value: await inPage(valueOf, "tb") }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      none: { tree: exposed("Mission views", views, null, [0, 1, 2]), shown: [false, false, false], tabindexes: ["-1", "-1", "-1"], value: "", tabbed: { id: "after" } },
      enabled: { tree: exposed("Mission views", views, 2, [0, 1]), shown: [false, false, true], value: "tasks" },
      events: [],
    },
  },
  {
    // Plant: the remembered value never forgotten (Tasks then selected after the user's selection of Plan).
    name: "US2-19: a value no tab has keeps Spec selected and is remembered: appending Tasks with its panel then selects it with no event; after a user selection of Plan, or another host set, an appended Tasks is not selected (FR-010a)",
    fixture: true,
    run: async (driver, inPage) => {
      const two = ["Spec", "Plan"];
      const appendTasks = [{ append: tabOf("Tasks") }, { append: panelOf("Tasks") }];
      await mount(driver, inPage, page(tabsOf(two)));
      await inPage(recordEvents, null);
      await driver.setProperty("tb", "value", "tasks");
      const remembered = { tree: await tree(driver), value: await inPage(valueOf, "tb") };
      // The appended tab comes after the panels in the markup; the tabs pair by order among their kind.
      await driver.mutate("tb", appendTasks);
      const appended = { tree: await tree(driver), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(tabsOf(two)));
      await inPage(recordEvents, null);
      await driver.setProperty("tb", "value", "tasks");
      await driver.clickTarget(tab(1));
      await driver.mutate("tb", appendTasks);
      const afterUser = { tree: await tree(driver), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(tabsOf(two)));
      await driver.setProperty("tb", "value", "tasks");
      await driver.setProperty("tb", "value", "spec");
      await driver.mutate("tb", appendTasks);
      return { remembered, appended, afterUser, afterSet: { tree: await tree(driver), value: await inPage(valueOf, "tb") } };
    },
    expected: {
      remembered: { tree: exposed("Mission views", ["Spec", "Plan"], 0), value: "spec" },
      appended: { tree: exposed("Mission views", views, 2), tabindexes: ["-1", "-1", "0"], value: "tasks", events: [] },
      afterUser: { tree: exposed("Mission views", views, 1), value: "plan", events: [change("plan")] },
      afterSet: { tree: exposed("Mission views", views, 0), value: "spec" },
    },
  },
  {
    // Plant: the first enabled tab taking precedence over the remembered value in one batch (Spec then selected).
    name: "US2-20: on an empty tabs a set of tasks then the three tabs and panels appended at once selects Tasks with no event; with every tab disabled and tasks set, enabling Spec and Tasks at once selects Tasks (FR-010a Precedence, FR-011a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await inPage(recordEvents, null);
      const empty = { tree: await tree(driver), value: await inPage(valueOf, "tb") };
      await driver.setProperty("tb", "value", "tasks");
      await driver.mutate("tb", [{ append: tabsOf(views) }]);
      const appended = { tree: await tree(driver), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb"), shown: await inPage(shown, "tb") };
      await mount(driver, inPage, page(tabsOf(views, [0, 1, 2])));
      await inPage(recordEvents, null);
      await driver.setProperty("tb", "value", "tasks");
      await driver.mutate("tb", [
        { child: 0, attribute: "disabled", value: null },
        { child: 2, attribute: "disabled", value: null },
      ]);
      return { empty, appended, enabled: { tree: await tree(driver), value: await inPage(valueOf, "tb") }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      empty: { tree: [{ role: "tablist", name: "Mission views" }], value: "" },
      appended: { tree: exposed("Mission views", views, 2), tabindexes: ["-1", "-1", "0"], value: "tasks", shown: [false, false, true] },
      enabled: { tree: exposed("Mission views", views, 2, [1]), value: "tasks" },
      events: [],
    },
  },
  {
    // Plant: the controller without the target check (keys from the panel's content then move the tabs).
    name: "US2-21: in the selected Plan panel Enter and Space on a button activate it, ArrowLeft, Home and End in a text input move its caret unhandled, ArrowRight on a nested tabs moves only the nested tabs; Plan stays selected and nothing is emitted by the outer tabs, beside ArrowRight on a tab (FR-021a; nested ocelle-tabs as the stand-in for the phase 4 segmented choice)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(views.map((name) => tabOf(name)).join("") + panelOf("Spec") + panelOf("Plan", nestedPanel) + panelOf("Tasks"), 'label="Mission views" value="plan"'));
      await inPage(() => {
        const scope = window as unknown as { __clicks: number };
        scope.__clicks = 0;
        document.getElementById("inner-button")?.addEventListener("click", () => (scope.__clicks += 1));
      }, null);
      await inPage(recordEvents, null);
      await driver.focusNode("inner-button");
      await driver.pressKeys("Enter");
      await driver.pressKeys(" ");
      const clicks = await inPage(() => (window as unknown as { __clicks: number }).__clicks, null);
      await driver.focusNode("field");
      await inPage(() => {
        (document.getElementById("field") as HTMLInputElement | null)?.setSelectionRange(3, 3);
      }, null);
      const caret: unknown[] = [];
      for (const key of ["ArrowLeft", "Home", "End"]) {
        await driver.pressKeys(key);
        caret.push(await inPage(() => (document.getElementById("field") as HTMLInputElement | null)?.selectionStart ?? null, null));
      }
      await driver.focusNode(tab(0, "inner"));
      await driver.pressKeys("ArrowRight");
      const nested = { focus: await inPage(where, null), inner: await inPage(valueOf, "inner") };
      const outer = { value: await inPage(valueOf, "tb"), shown: await inPage(shown, "tb"), events: await inPage(recordedEvents, null) };
      await driver.focusNode(tab(1));
      await driver.pressKeys("ArrowRight");
      return { clicks, caret, nested, outer, paired: { focus: await inPage(where, null), value: await inPage(valueOf, "tb") }, keys: (await driver.keydownRecord()).map((key) => key.defaultPrevented) };
    },
    expected: {
      clicks: 2,
      caret: [2, 0, 6],
      nested: { focus: { tab: 1, parent: "inner" }, inner: "two" },
      outer: { value: "plan", shown: [false, true, false], events: [change("two", "inner")] },
      paired: { focus: { tab: 2 }, value: "tasks" },
      keys: [false, false, false, false, false, true, true],
    },
  },
  {
    // T062b (phase 4; phase 3 review R1-04): US2-21's body with the real element. Plant: the controller without the
    // target check (keys from the panel's content, the segmented choice's included, then move the tabs).
    name: "US2-21: in the selected Plan panel holding a button, a text input and an ocelle-segmented-choice, Enter and Space on the button activate it, ArrowLeft, Home and End in the input move its caret unhandled, and ArrowRight on a segment moves focus to the next segment only; Plan stays selected and its panel shown, no ocelle-tabs-change is emitted, beside ArrowRight on a tab, which moves focus and selection (FR-021a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(views.map((name) => tabOf(name)).join("") + panelOf("Spec") + panelOf("Plan", segmentedPanel) + panelOf("Tasks"), 'label="Mission views" value="plan"'));
      await inPage(() => {
        const scope = window as unknown as { __clicks: number };
        scope.__clicks = 0;
        document.getElementById("inner-button")?.addEventListener("click", () => (scope.__clicks += 1));
      }, null);
      await inPage(recordEvents, null);
      await driver.focusNode("inner-button");
      await driver.pressKeys("Enter");
      await driver.pressKeys(" ");
      const clicks = await inPage(() => (window as unknown as { __clicks: number }).__clicks, null);
      await driver.focusNode("field");
      await inPage(() => {
        (document.getElementById("field") as HTMLInputElement | null)?.setSelectionRange(3, 3);
      }, null);
      const caret: unknown[] = [];
      for (const key of ["ArrowLeft", "Home", "End"]) {
        await driver.pressKeys(key);
        caret.push(await inPage(() => (document.getElementById("field") as HTMLInputElement | null)?.selectionStart ?? null, null));
      }
      await driver.focusNode({ parent: "lanes", kind: "ocelle-segment", index: 0 });
      await driver.pressKeys("ArrowRight");
      const segments = { focus: await driver.focusedElement(), value: await inPage(valueOf, "lanes"), pressed: await inPage(() => [...document.querySelectorAll("#lanes > ocelle-segment")].map((each) => each.getAttribute("aria-pressed")), null) };
      const outer = { value: await inPage(valueOf, "tb"), shown: await inPage(shown, "tb"), events: await inPage(recordedEvents, null) };
      await driver.focusNode(tab(1));
      await driver.pressKeys("ArrowRight");
      return { clicks, caret, segments, outer, paired: { focus: await inPage(where, null), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) }, keys: (await driver.keydownRecord()).map((key) => key.defaultPrevented) };
    },
    expected: {
      clicks: 2,
      caret: [2, 0, 6],
      segments: { focus: { parent: "lanes", kind: "ocelle-segment", index: 1 }, value: "all", pressed: ["true", "false"] },
      outer: { value: "plan", shown: [false, true, false], events: [] },
      paired: { focus: { tab: 2 }, value: "tasks", events: [change("tasks")] },
      keys: [false, false, false, false, false, true, true],
    },
  },
  {
    // Plant: a light-DOM selector query measured at tabs updates only (the panel holding only the shadow-delegating
    // link is then a stop; the panel whose button is removed later stays no stop).
    name: "US2-22: a panel holding only an element whose focusable anchor is in its shadow root is no stop, Tab goes to the anchor; a panel whose only button is removed after render becomes a stop with the focus ring, and adding a button back makes it no stop again (FR-023; x-shadow-link as the stand-in for the phase 6 ocelle-link)",
    fixture: true,
    run: async (driver, inPage) => {
      await inPage(defineShadowLink, null);
      await mount(driver, inPage, page(tabOf("Spec") + tabOf("Plan") + panelOf("Spec", '<x-shadow-link id="lnk">the log</x-shadow-link>') + panelOf("Plan")));
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      const link = { focus: await inPage(where, null), panelTabindex: await inPage(() => document.querySelector("#tb > ocelle-tab-panel")?.getAttribute("tabindex") ?? null, null) };
      await mount(driver, inPage, page(tabOf("Spec") + tabOf("Plan") + panelOf("Spec", '<button id="only" type="button">Only</button>') + panelOf("Plan")));
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      const button = await inPage(where, null);
      await driver.mutate(panel(0), [{ remove: 0 }]);
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      const removed = { focus: await inPage(where, null), ring: await outline(driver, panel(0)) };
      await driver.mutate(panel(0), [{ append: '<button id="again" type="button">Again</button>' }]);
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      return { link, button, removed, added: await inPage(where, null) };
    },
    expected: {
      link: { focus: { host: "lnk", part: "anchor" }, panelTabindex: null },
      button: { id: "only" },
      removed: { focus: { panel: 0 }, ring: ["3px", "solid", accentLight, "2px"] },
      added: { id: "again" },
    },
  },
  {
    // T093a (phase 6; phase 3 review R1-04): US2-22's body with the real element. Plant: a light-DOM selector query
    // measured at tabs updates only (the panel holding only the link, whose anchor is focusable only through its shadow
    // root, is then a stop; the panel whose button is removed later stays no stop).
    name: "US2-22: the selected panel holding only an ocelle-link is no stop: Tab on the selected tab focuses the link's anchor inside its shadow root and the panel has no tabindex; a panel whose only button the host removes after render becomes a stop, Tab from the selected tab focusing the panel itself with the focus ring (FR-023; the real ocelle-link)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabOf("Spec") + tabOf("Plan") + panelOf("Spec", '<ocelle-link id="lnk">the mission log</ocelle-link>') + panelOf("Plan")));
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      const link = { focus: await inPage(where, null), panelTabindex: await inPage(() => document.querySelector("#tb > ocelle-tab-panel")?.getAttribute("tabindex") ?? null, null) };
      await mount(driver, inPage, page(tabOf("Spec") + tabOf("Plan") + panelOf("Spec", '<button id="only" type="button">Only</button>') + panelOf("Plan")));
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      const button = await inPage(where, null);
      await driver.mutate(panel(0), [{ remove: 0 }]);
      await driver.focusNode(tab(0));
      await driver.pressKeys("Tab");
      return { link, button, removed: { focus: await inPage(where, null), ring: await outline(driver, panel(0)) } };
    },
    expected: {
      link: { focus: { host: "lnk", part: "anchor" }, panelTabindex: null },
      button: { id: "only" },
      removed: { focus: { panel: 0 }, ring: ["3px", "solid", accentLight, "2px"] },
    },
  },
  {
    // Plants: the icon slot missing on the tab (the icon then not placed by the slot convention).
    name: "US2-23: an icon in the tab's icon slot sits before the text at the icon size with the slot gap, adds nothing to the tab's or its panel's name, and leaves the selected bar as on a plain tab",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-tab value="spec"><ocelle-icon id="icon" slot="icon" name="folder"></ocelle-icon>Spec</ocelle-tab><ocelle-tab value="plan">Plan</ocelle-tab>' + panelOf("Spec") + panelOf("Plan")));
      const icon = await driver.box("icon");
      const text = await inPage(() => {
        const first = document.getElementById("tb")?.querySelector("ocelle-tab");
        const node = [...(first?.childNodes ?? [])].find((child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? "").trim() !== "");
        if (node === undefined) return null;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return { x: rect.x };
      }, null);
      const withIcon = await bar(driver, tab(0));
      const firstTree = await tree(driver);
      await driver.setProperty("tb", "value", "plan");
      return { size: [icon.width, icon.height], gap: text === null ? null : Math.round(text.x - (icon.x + icon.width)), firstTree, bars: [withIcon, await bar(driver, tab(1))] };
    },
    expected: { size: [20, 20], gap: 8, firstTree: exposed("Mission views", ["Spec", "Plan"], 0), bars: [selectedBar(accentLight), selectedBar(accentLight)] },
  },
  {
    // Plant: forwarding the host `aria-label` to `part="tablist"` (at first render or on a later change).
    name: "US2-24: with label Mission views and a host aria-label Recent views the tablist is named Mission views and no tablist, tab or tabpanel is named Recent views, also after the host changes its aria-label; with a host aria-label and no label the tablist is unnamed; the host's aria-label reads as written (FR-006's tabs exception)",
    fixture: true,
    run: async (driver, inPage) => {
      const named = async (): Promise<Exposed[]> => (await tree(driver)).filter((node) => node.role === "tablist" || node.role === "tab" || node.role === "tabpanel");
      await mount(driver, inPage, page(tabsOf(views)));
      const labelOnly = await named();
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" aria-label="Recent views"'));
      const both = { tree: await named(), host: await driver.attribute("tb", "aria-label") };
      await driver.setAttribute("tb", "aria-label", "Other views");
      const changed = { tree: await named(), host: await driver.attribute("tb", "aria-label") };
      await mount(driver, inPage, page(tabsOf(views), 'aria-label="Recent views"'));
      return { labelOnly, both, changed, hostOnly: { tree: await named(), host: await driver.attribute("tb", "aria-label") } };
    },
    expected: {
      labelOnly: exposed("Mission views", views),
      both: { tree: exposed("Mission views", views), host: "Recent views" },
      changed: { tree: exposed("Mission views", views), host: "Other views" },
      hostOnly: { tree: exposed("", views), host: "Recent views" },
    },
  },
  ...changesAndSets.map(
    (how): TabsScenario => ({
      // Phase 2 review R1-01, for tabs. Plant: the value setter taking the pending records without the focus record
      // (the focused tab's removal or move then leaves focus on the body).
      name: `R1-01 for tabs: a host that ${how.change === "remove" ? "removes" : "moves to the end of the tabs"} the selected, focused Plan with its panel and sets value to spec by ${how.by} in the same task leaves focus ${how.change === "remove" ? "on Tasks, the fallback (FR-011a)" : "on Plan (R-03)"}, selects Spec and emits nothing, as without the set`,
      fixture: true,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
        await inPage(recordEvents, null);
        await driver.focusNode(tab(1));
        await inPage(changeAndSet, how);
        await inPage(frames, undefined);
        return { focus: await inPage(where, null), tree: await tree(driver), tabindexes: await inPage(tabindexes, "tb"), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
      },
      expected:
        how.change === "remove"
          ? { focus: { tab: 1 }, tree: exposed("Mission views", ["Spec", "Tasks"], 0), tabindexes: ["0", "-1"], value: "spec", events: [] }
          : { focus: { tab: 2 }, tree: exposed("Mission views", ["Spec", "Tasks", "Plan"], 0), tabindexes: ["0", "-1", "-1"], value: "spec", events: [] },
    }),
  ),
  ...(["move", "remove"] as const).flatMap((what) =>
    (["Tab", "click"] as const).map(
      (input): TabsScenario => ({
        // Plant: refocusing after any blur (the record not scoped to the removal that caused it).
        name: `R-03, Tab out while the host re-renders on blur: a ${input === "Tab" ? "real Shift+Tab to the button before the tabs" : "real click on the button after the tabs"} leaves the focused Spec while a host focusout listener ${what === "move" ? "moves" : "removes"} it in a microtask; focus ends on that target, beside an in-task move that keeps focus`,
        fixture: true,
        run: async (driver, inPage) => {
          await mount(driver, inPage, page(tabsOf(["Spec", "Plan"])));
          await driver.focusNode(tab(0));
          await driver.mutate("tb", [{ move: 0, before: 2 }]);
          const kept = await inPage(where, null);
          await inPage(rerenderOnBlur, what);
          if (input === "Tab") await driver.pressKeys("Tab", ["Shift"]);
          else await driver.clickTarget("after");
          await inPage(frames, undefined);
          return { kept, left: await inPage(where, null) };
        },
        expected: { kept: { tab: 1 }, left: input === "Tab" ? { id: "before" } : { id: "after" } },
      }),
    ),
  ),
  {
    // Plant: the tab's ring not raised (an outline on the host, or the `::after` without `z-index`): the hovered
    // neighbour's fill then covers the ring on its side.
    name: "the focus ring of a keyboard-focused tab is drawn in color-focus just outside all four edges, beside the selected tab and with the pointer on a hovered neighbour on either side (FR-007, R-06, R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowRight");
      await driver.setProperty("tb", "value", "spec");
      const focus = await inPage(where, null);
      const besideSelected = await ringPixels(driver, 1);
      await driver.hoverTarget(tab(2));
      const next = { fill: await driver.computedNode(tab(2), "background-color"), ring: await ringPixels(driver, 1) };
      await driver.hoverTarget(tab(0));
      const previous = { fill: await driver.computedNode(tab(0), "background-color"), ring: await ringPixels(driver, 1) };
      return { focus, besideSelected, next, previous };
    },
    expected: {
      focus: { tab: 1 },
      besideSelected: [accentLight, accentLight, accentLight, accentLight],
      next: { fill: hoverLight, ring: [accentLight, accentLight, accentLight, accentLight] },
      previous: { fill: hoverLight, ring: [accentLight, accentLight, accentLight, accentLight] },
    },
  },
  {
    // Plants: the bar in another token; the hover fill kept off a selected tab.
    name: "the selected bar is accent-strong in light and dark, the tab's minimum block size is the target size, and a hovered selected tab keeps its bar over the hover fill (R-10, R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      const light = await bar(driver, tab(1));
      const height = (await driver.box(tab(0))).height;
      await driver.theme("dark");
      const dark = await bar(driver, tab(1));
      await driver.theme(null);
      await driver.hoverTarget(tab(1));
      return { light, dark, height, hovered: { fill: await driver.computedNode(tab(1), "background-color"), bar: await bar(driver, tab(1)) } };
    },
    expected: { light: selectedBar(accentLight), dark: selectedBar(accentDark), height: 44, hovered: { fill: hoverLight, bar: selectedBar(accentLight) } },
  },
  {
    // Plant: a `:host(:hover)` rule with no disabled exclusion.
    name: "Edge Cases, hover: a disabled tab under the pointer has no hover fill, beside an enabled sibling under the pointer filled hover-bg",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views, [2])));
      await driver.hoverTarget(tab(2));
      const disabled = await driver.computedNode(tab(2), "background-color");
      await driver.hoverTarget(tab(1));
      return { disabled, enabled: await driver.computedNode(tab(1), "background-color") };
    },
    expected: { disabled: transparent, enabled: hoverLight },
  },
  {
    // Plant: a `transition` on the selected paint.
    name: "Edge Cases, motion: a tab declares no transition or animation, so a selection paints at once (transition-duration 0s, animation-name none), beside the bar the selection draws",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await driver.clickTarget(tab(1));
      return {
        bar: await bar(driver, tab(1)),
        motion: [await driver.computedNode(tab(1), "transition-duration"), await driver.computedNode(tab(1), "animation-name"), await driver.computedPart(tab(1), "::before", "transition-duration")],
      };
    },
    expected: { bar: selectedBar(accentLight), motion: ["0s", "none", "0s"] },
  },
  {
    // Plant: the child setting its role and tabindex in its own connectedCallback regardless of the parent.
    name: "Edge Cases: an ocelle-tab and an ocelle-tab-panel directly in the page have no role and no tab stop, beside the same children in a tabs exposed as a tab and a tabpanel, the tab taking the tab stop",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `<button id="before" type="button">Before</button><ocelle-tab id="lone-tab" value="spec">Spec</ocelle-tab><ocelle-tab-panel id="lone-panel"><p>Alone</p></ocelle-tab-panel><ocelle-tabs id="tb" label="Mission views">${tabsOf(["Spec"])}</ocelle-tabs><button id="after" type="button">After</button>`);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const first = await inPage(where, null);
      const lone = [...(await driver.axStates("lone-tab", "subtree")), ...(await driver.axStates("lone-panel", "subtree"))].filter((node) => interactiveRoles.has(node.role)).map((node) => node.role);
      return { lone, tabindex: [await driver.attribute("lone-tab", "tabindex"), await driver.attribute("lone-panel", "tabindex")], tabs: await tree(driver), first };
    },
    expected: { lone: [], tabindex: [null, null], tabs: exposed("Mission views", ["Spec"]), first: { tab: 0 } },
  },
  {
    // Plants: selecting the last match; exposing the first after a user selection of the second.
    name: "Edge Cases: with two tabs of the same value a host set selects the first; a click on the second exposes the second as selected, shows its panel and reports the same value",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-tab value="spec">Spec</ocelle-tab><ocelle-tab value="same">One</ocelle-tab><ocelle-tab value="same">Two</ocelle-tab>' + ["Spec", "One", "Two"].map((name) => panelOf(name)).join("")));
      await inPage(recordEvents, null);
      await driver.setProperty("tb", "value", "same");
      const set = await tree(driver);
      await driver.clickTarget(tab(2));
      return { set, clicked: await tree(driver), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
    },
    expected: { set: exposed("Mission views", ["Spec", "One", "Two"], 1), clicked: exposed("Mission views", ["Spec", "One", "Two"], 2), value: "same", events: [change("same")] },
  },
  {
    // Plant: `white-space: nowrap` or `text-overflow: ellipsis` on the tab.
    name: "Edge Cases: at a 320 px viewport a tab label longer than the row wraps, the tab grows in block size, its whole text is its name and the page does not scroll sideways",
    fixture: true,
    run: async (driver, inPage) => {
      const start = await inPage(() => [window.innerWidth, window.innerHeight], null);
      await mount(driver, inPage, page(tabOf(longLabel, { values: false }) + tabOf("Short") + panelOf("Long") + panelOf("Short")));
      await driver.setViewportSize(320, 640);
      const long = (await driver.box(tab(0))).height;
      const short = (await driver.box(tab(1))).height;
      const sideways = await inPage(() => document.documentElement.scrollWidth > document.documentElement.clientWidth, null);
      const observed = { grew: long > short && short === 44, sideways, tree: await tree(driver) };
      await driver.setViewportSize(start[0] ?? 0, start[1] ?? 0);
      return observed;
    },
    expected: { grew: true, sideways: false, tree: exposed("Mission views", [longLabel, "Short"]) },
  },
  {
    // Plant: a `display` rule on `:host` that overrides `:host([hidden])`.
    name: "Edge Cases: host hidden removes the tabs, no box and no node; without it the tabs have a box and their nodes",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await driver.setAttribute("tb", "hidden", "");
      const box = await driver.box("tb");
      const hidden = { display: box.display, height: box.height, tree: await tree(driver) };
      await driver.setAttribute("tb", "hidden", null);
      const again = await driver.box("tb");
      return { hidden, shown: { display: again.display, boxed: again.height > 0, tree: await tree(driver) } };
    },
    expected: { hidden: { display: "none", height: 0, tree: [] }, shown: { display: "block", boxed: true, tree: exposed("Mission views", views) } },
  },
  {
    // Plant: the tab's name read once at first render (the label slot removed after first render).
    name: "Edge Cases: a tab's accessible name and its panel's name follow a change of the tab's text",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      const first = await tree(driver);
      await driver.mutate("tb", [{ property: "textContent", value: "Specification", child: 0 }]);
      return { first, renamed: await tree(driver) };
    },
    expected: { first: exposed("Mission views", views), renamed: exposed("Mission views", ["Specification", "Plan", "Tasks"]) },
  },
  {
    // Plant: the value setter deciding on the cached child list.
    name: "R-05: a tab and its panel appended and value set to it in the same task are one operation: the tab is selected through the direct path, value reads it in that task, with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(["Spec", "Plan"])));
      await inPage(recordEvents, null);
      const inTask = await inPage(() => {
        const tabs = document.getElementById("tb") as (HTMLElement & { value: string }) | null;
        if (tabs === null) return null;
        tabs.querySelector("ocelle-tab-panel")?.insertAdjacentHTML("beforebegin", '<ocelle-tab value="tasks">Tasks</ocelle-tab>');
        tabs.insertAdjacentHTML("beforeend", "<ocelle-tab-panel><p>Tasks content</p></ocelle-tab-panel>");
        tabs.value = "tasks";
        return { value: tabs.value, selected: tabs.querySelector('ocelle-tab[value="tasks"]')?.getAttribute("aria-selected") ?? null };
      }, null);
      await inPage(frames, undefined);
      return { inTask, tree: await tree(driver), events: await inPage(recordedEvents, null) };
    },
    expected: { inTask: { value: "tasks", selected: "true" }, tree: exposed("Mission views", views, 2), events: [] },
  },
  {
    // Plants: a host id overwritten; the generated ids or the association attributes left on a child that leaves.
    name: "R-02: a tab's or panel's own id is kept and used for the association; a tab and panel that leave the tabs lose the attributes the tabs wrote on them, the host's own id kept",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-tab id="own-tab" value="spec">Spec</ocelle-tab><ocelle-tab value="plan">Plan</ocelle-tab><ocelle-tab-panel id="own-panel"><p>Spec content</p></ocelle-tab-panel>' + panelOf("Plan")));
      const owned = await inPage(() => [document.getElementById("own-tab")?.getAttribute("aria-controls"), document.getElementById("own-panel")?.getAttribute("aria-labelledby")], null);
      const controlled = await controls(driver, "own-tab");
      await driver.clickTarget(tab(1));
      await inPage(() => {
        const host = document.getElementById("tb");
        const leaving = [...(host?.querySelectorAll("ocelle-tab, ocelle-tab-panel") ?? [])];
        const holder = document.createElement("div");
        holder.id = "holder";
        document.body.append(holder);
        holder.append(...leaving);
      }, null);
      await inPage(frames, undefined);
      const left = await inPage(
        () =>
          [...(document.getElementById("holder")?.children ?? [])].map((child) => ({
            id: child.id === "own-tab" || child.id === "own-panel" ? child.id : child.id === "" ? "" : "generated",
            written: ["aria-selected", "aria-disabled", "aria-controls", "aria-labelledby", "tabindex"].filter((name) => child.hasAttribute(name)),
          })),
        null,
      );
      return { owned, controlled, left };
    },
    expected: {
      owned: ["own-panel", "own-tab"],
      controlled: [{ role: "tabpanel", name: "Spec" }],
      left: [
        { id: "own-tab", written: [] },
        { id: "", written: [] },
        { id: "own-panel", written: [] },
        { id: "", written: [] },
      ],
    },
  },
  {
    // Plant: the remembered value left out of the tabs' first render (FR-021: a value attribute naming a disabled tab).
    name: "FR-021: on first render with a value no enabled tab has the first enabled tab is selected, and with a value naming an enabled tab that tab is, with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views, [0]), 'label="Mission views" value="nope"'));
      const nope = { tree: await tree(driver), value: await inPage(valueOf, "tb") };
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="tasks"'));
      return { nope, named: { tree: await tree(driver), value: await inPage(valueOf, "tb") } };
    },
    expected: { nope: { tree: exposed("Mission views", views, 1, [0]), value: "plan" }, named: { tree: exposed("Mission views", views, 2), value: "tasks" } },
  },
  {
    // Added after the mutation run (reviews/phase-3/notes.md). Mutants: `disabled` not reflected from its property; the
    // `value` setter writing nothing; the default from the index among all children (tabs and panels).
    name: "the tab's disabled and value properties: a disabled property set is reflected and disables the tab, a value property set writes the attribute, a written value reads as written, and the default counts tabs only (FR-009)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await driver.mutate("tb", [
        { property: "disabled", value: true, child: 1 },
        { property: "value", value: "todo", child: 2 },
      ]);
      const set = { tree: await tree(driver), attributes: await inPage(() => [...document.querySelectorAll("#tb > ocelle-tab")].map((each) => [each.hasAttribute("disabled"), each.getAttribute("value"), (each as unknown as { value: unknown }).value]), null) };
      await mount(driver, inPage, page(panelOf("Spec") + panelOf("Plan") + tabOf("Spec", { values: false }) + tabOf("Plan", { values: false })));
      return { set, defaults: await inPage(() => [...document.querySelectorAll("#tb > ocelle-tab")].map((each) => (each as unknown as { value: unknown }).value), null), value: await inPage(valueOf, "tb") };
    },
    expected: {
      set: {
        tree: exposed("Mission views", views, 0, [1]),
        attributes: [
          [false, "spec", "spec"],
          [true, "plan", "plan"],
          [false, "todo", "todo"],
        ],
      },
      defaults: ["0", "1"],
      value: "0",
    },
  },
  {
    // Added after the mutation run. Mutant: the tabs' `focusin` listener not in the capture phase (a tab's own listener
    // that stops the event then hides the focus from the record).
    name: "R-03: with tabs whose focusin stops propagating, the selected, focused Plan becoming disabled still moves focus with the selection to Tasks, beside the selection read",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views), 'label="Mission views" value="plan"'));
      await inPage(() => {
        for (const child of document.querySelectorAll("#tb > ocelle-tab")) {
          child.addEventListener("focusin", (event) => {
            event.stopPropagation();
          });
        }
      }, null);
      await driver.focusNode(tab(1));
      await driver.mutate("tb", [{ child: 1, attribute: "disabled", value: "" }]);
      await inPage(frames, undefined);
      return { focus: await inPage(where, null), value: await inPage(valueOf, "tb") };
    },
    expected: { focus: { tab: 2 }, value: "tasks" },
  },
  {
    // Added after the mutation run. Mutant: `aria-disabled` left on a disabled tab that leaves the tabs.
    name: "a disabled tab and its panel that leave the tabs lose aria-disabled and every other attribute the tabs wrote, beside the same tab exposed disabled inside",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views, [2])));
      const inside = await tree(driver);
      await inPage(() => {
        const host = document.getElementById("tb");
        const leaving = [host?.querySelectorAll("ocelle-tab")[2], host?.querySelectorAll("ocelle-tab-panel")[2]];
        for (const each of leaving) if (each !== undefined) document.body.append(each);
      }, null);
      await inPage(frames, undefined);
      return { inside, left: await inPage(() => [...document.body.children].filter((child) => child.localName === "ocelle-tab" || child.localName === "ocelle-tab-panel").map((child) => [...child.attributes].map((attribute) => attribute.name).sort()), null) };
    },
    expected: { inside: exposed("Mission views", views, 0, [2]), left: [["disabled", "value"], []] },
  },
  {
    // Review round 1, R1-01. Mutant: the tab passing its `value` attribute changes to Lit (whose path sets the accessor,
    // and the setter writes the removed attribute back, so the tab keeps its old value).
    name: "FR-009: a host that removes a tab's value attribute after render leaves the attribute absent, the tab reads its index, and the tabs' value and the next change event report that index",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.mutate("tb", [{ child: 2, attribute: "value", value: null }]);
      const removed = await inPage(() => {
        const third = document.querySelectorAll("#tb > ocelle-tab")[2];
        return [third?.getAttribute("value") ?? null, (third as unknown as { value?: unknown } | undefined)?.value ?? null];
      }, null);
      await driver.focusNode(tab(1));
      await driver.pressKeys("ArrowRight");
      return { removed, value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
    },
    expected: { removed: [null, "2"], value: "2", events: [change("2")] },
  },
  {
    // Added after the mutation run. Mutant: the tabs' observer not following a tab's `value` attribute.
    name: "FR-010a: a tab whose value attribute changes to the remembered value is selected with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(recordEvents, null);
      await driver.setProperty("tb", "value", "todo");
      const kept = await inPage(valueOf, "tb");
      await driver.mutate("tb", [{ child: 2, attribute: "value", value: "todo" }]);
      return { kept, tree: await tree(driver), value: await inPage(valueOf, "tb"), events: await inPage(recordedEvents, null) };
    },
    expected: { kept: "spec", tree: exposed("Mission views", views, 2), value: "todo", events: [] },
  },
  {
    // Added after the mutation run. Mutants: a generated id kept when the pairing moves (two children then share one);
    // the tabindex of a panel that is no longer shown left in place.
    name: "R-02: a tab and panel added before the others get ids of their own, every id stays unique and every tab controls its own panel; a panel no longer shown loses its tabindex",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(views)));
      await inPage(() => {
        const host = document.getElementById("tb");
        host?.insertAdjacentHTML("afterbegin", '<ocelle-tab value="notes">Notes</ocelle-tab>');
        host?.querySelector("ocelle-tab-panel")?.insertAdjacentHTML("beforebegin", "<ocelle-tab-panel><p>Notes content</p></ocelle-tab-panel>");
      }, null);
      await inPage(frames, undefined);
      const added = await inPage(association, null);
      await driver.focusNode(tab(1));
      await driver.pressKeys("ArrowRight");
      return { added, tabindexes: await inPage(() => [...document.querySelectorAll("#tb > ocelle-tab-panel")].map((each) => each.getAttribute("tabindex")), null) };
    },
    expected: {
      added: {
        tabs: [0, 1, 2, 3].map((controls) => ({ hasId: true, controls })),
        panels: [0, 1, 2, 3].map((index) => ({ hasId: true, labelledBy: index === 1 ? 1 : null })),
        unique: true,
        shadowIds: 0,
      },
      tabindexes: [null, null, "0", null],
    },
  },
  {
    // Added after the mutation run. Mutants: the panel observer's attribute filter or subtree dropped; the `hidden`, the
    // unslotted-child and the anchor rules of the focusable measure dropped.
    name: "FR-023: the shown panel is a stop while its content has nothing focusable (an anchor without href, a hidden button, a div at tabindex -1, a disabled button, a button no slot shows) and stops being one as each becomes focusable: href, hidden removed, tabindex 0, an anchor's own tabindex, contenteditable, disabled removed; a button slotted into a shadow host counts",
    fixture: true,
    run: async (driver, inPage) => {
      await inPage(() => {
        if (customElements.get("x-noslot") !== undefined) return;
        customElements.define(
          "x-noslot",
          class extends HTMLElement {
            constructor() {
              super();
              this.attachShadow({ mode: "open" }).append(document.createElement("span"));
            }
          },
        );
      }, null);
      const content = '<div><a id="anchor">Anchor</a></div><div><button id="hb" type="button" hidden>Hidden</button></div><div><div id="later" tabindex="-1">Later</div></div><div><div id="edit">Edit</div></div><div><button id="db" type="button" disabled>Disabled</button></div><x-noslot><button type="button">Unslotted</button></x-noslot>';
      await mount(driver, inPage, page(tabOf("Spec") + tabOf("Plan") + panelOf("Spec", content) + panelOf("Plan")));
      const read = (): Promise<string | null> => inPage(() => document.querySelector("#tb > ocelle-tab-panel")?.getAttribute("tabindex") ?? null, null);
      const step = async (id: string, name: string, value: string | null): Promise<string | null> => {
        await inPage(
          ([target, attribute, to]) => {
            const element = document.getElementById(target);
            if (to === null) element?.removeAttribute(attribute);
            else element?.setAttribute(attribute, to);
          },
          [id, name, value] as const,
        );
        await inPage(frames, undefined);
        return read();
      };
      const observed: (string | null)[] = [await read()];
      for (const [id, name, on, off] of [
        ["anchor", "href", "#x", null],
        ["hb", "hidden", null, ""],
        ["later", "tabindex", "0", "-1"],
        ["anchor", "tabindex", "0", null],
        ["edit", "contenteditable", "true", null],
        ["db", "disabled", null, ""],
      ] as const) {
        observed.push(await step(id, name, on), await step(id, name, off));
      }
      await inPage(() => {
        if (customElements.get("x-slotted") === undefined) {
          customElements.define(
            "x-slotted",
            class extends HTMLElement {
              constructor() {
                super();
                this.attachShadow({ mode: "open" }).append(document.createElement("slot"));
              }
            },
          );
        }
        document.querySelector("#tb > ocelle-tab-panel")?.insertAdjacentHTML("beforeend", '<x-slotted><button type="button">Slotted</button></x-slotted>');
      }, null);
      await inPage(frames, undefined);
      observed.push(await read());
      return observed;
    },
    expected: ["0", null, "0", null, "0", null, "0", null, "0", null, "0", null, "0", null],
  },
  {
    // Added after the mutation run. Mutant: the record not scoped to the removal that caused the blur (the `focusout`
    // microtask dropped, so a blur to nothing stays recorded until a later batch).
    name: "R-03, a move does not steal focus back: after an in-task move keeps focus on Spec, the user clicks plain text to leave it, and a host move in a later task leaves focus on the body",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(["Spec", "Plan"])));
      await driver.focusNode(tab(0));
      await driver.mutate("tb", [{ move: 0, before: 2 }]);
      const kept = await inPage(where, null);
      await driver.clickTarget("away");
      await driver.mutate("tb", [{ move: 1, before: 0 }]);
      await inPage(frames, undefined);
      return { kept, left: await inPage(where, null) };
    },
    expected: { kept: { tab: 1 }, left: null },
  },
  {
    // Added after the mutation run. Mutants: `focusLeft` always true; the focus listeners not in the capture phase.
    name: "R-03: a host that focuses the button after the tabs while it removes the focused, selected Plan keeps that focus, beside a removal with no such host; with tabs whose focusin and focusout stop propagating, a later host move does not steal focus back after Tab out",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(["Spec", "Plan", "Tasks", "Notes"]), 'label="Mission views" value="plan"'));
      await driver.focusNode(tab(1));
      await driver.mutate("tb", [{ remove: 5 }, { remove: 1 }]);
      const moved = await inPage(where, null);
      await inPage(() => {
        document.getElementById("tb")?.addEventListener(
          "focusout",
          () => {
            document.getElementById("after")?.focus();
          },
          { once: true },
        );
      }, null);
      await driver.mutate("tb", [{ remove: 4 }, { remove: 1 }]);
      await inPage(frames, undefined);
      const kept = await inPage(where, null);
      await mount(driver, inPage, page(tabsOf(["Spec", "Plan"])));
      await inPage(() => {
        for (const child of document.querySelectorAll("#tb > ocelle-tab")) {
          for (const type of ["focusin", "focusout"]) {
            child.addEventListener(type, (event) => {
              event.stopPropagation();
            });
          }
        }
      }, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("Tab", ["Shift"]);
      await driver.mutate("tb", [{ move: 0, before: 2 }]);
      return { moved, kept, left: await inPage(where, null) };
    },
    expected: { moved: { tab: 1 }, kept: { id: "after" }, left: { id: "before" } },
  },
  {
    // Plant: `label` not trimmed, or a blank label naming the tablist.
    name: "FR-006: the tablist's name is the trimmed label, a blank label leaves it unnamed, and a later label change follows",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(tabsOf(["Spec"]), 'label="  Mission views  "'));
      const trimmed = (await tree(driver))[0];
      await driver.setAttribute("tb", "label", "   ");
      const blank = (await tree(driver))[0];
      await driver.setProperty("tb", "label", "Views");
      return { trimmed, blank, changed: (await tree(driver))[0] };
    },
    expected: { trimmed: { role: "tablist", name: "Mission views" }, blank: { role: "tablist", name: "" }, changed: { role: "tablist", name: "Views" } },
  },
];
