// The shared bodies of User Story 1's browser scenarios for `ocelle-listbox` and `ocelle-option` (014 spec US1
// scenarios 1 to 23 and the listbox's Edge Cases; research.md R-01, R-03 to R-05, R-10, R-15, R-18; contracts/elements.md
// § Pairings; T014, T016). Each body mounts its page, acts with real keyboard and pointer input through the driver,
// sets up and reads what the driver has no command for with a self-contained function run in the page (`InPage`: the
// event recorder, a host's re-render on blur, the list part's client box) and returns one observation; each harness
// asserts it equals `expected`, written by hand from the spec, the data model and research (colours from the token
// table of packages/tokens/test/expected.ts; sizes from the tokens: `--ocelle-target-min` 44 px, `--ocelle-bar-width`
// 3 px, `--ocelle-focus-width` 3 px at `--ocelle-focus-offset` 2 px). Every "does not" outcome is observed in the same
// body as the positive outcome it guards, with the setup that makes it falsifiable; the plant that makes each fail is
// named beside the body and run once in reviews/phase-2/plants.md. The in-process harness (test/listbox.test.ts) runs
// every body; the fixture harness (test/browser/listbox.test.ts) runs the bodies marked `fixture`.
import { tokenColour } from "./icon.ts";
import type { AxNodeState, Driver, Focused, InPage, DriverTarget } from "./driver.ts";

/** One body: what it checks, what it must observe, and whether the fixture harness runs it too. */
export interface ListboxScenario {
  readonly name: string;
  readonly run: (driver: Driver, inPage: InPage) => Promise<unknown>;
  readonly expected: unknown;
  readonly fixture: boolean;
}

const folderNames = ["alpha", "beta", "gamma", "delta", "epsilon"];

/** `ocelle-option` markup for each name, `disabled` on the indexes given. */
function options(names: readonly string[], disabled: readonly number[] = []): string {
  return names.map((name, index) => `<ocelle-option value="${name}"${disabled.includes(index) ? " disabled" : ""}>${name}</ocelle-option>`).join("");
}

/** The page of most bodies: a button before the listbox `#lb`, the listbox, a button after it and plain text away from it. */
function page(inner: string, attributes = 'label="Folders"'): string {
  return `<button id="before" type="button">Before</button><ocelle-listbox id="lb" ${attributes}>${inner}</ocelle-listbox><button id="after" type="button">After</button><p id="away">Away from the list</p>`;
}

/** The `index`-th option of `#lb` (or of `parent`), as a target and as the focused element `focusedElement` names. */
function opt(index: number, parent = "lb"): DriverTarget & Focused {
  return { parent, kind: "ocelle-option", index };
}

const after: Focused = { id: "after" };
const before: Focused = { id: "before" };

/** Mounts `markup`, scrolls the page to its start and moves the pointer onto the plain text away from the list. */
async function mount(driver: Driver, inPage: InPage, markup: string): Promise<void> {
  await driver.mount(markup);
  await inPage(() => {
    window.scrollTo(0, 0);
  }, null);
  if (markup.includes('id="away"')) await driver.hoverTarget("away");
}

/**
 * Records every `ocelle-listbox-change` and `ocelle-listbox-activate` at the document on `window.__events`: its type,
 * `detail` (a copy), `bubbles`, `composed`, `cancelable`, the target's id and the target's `value` at dispatch (FR-002).
 * A second call replaces the first's listeners.
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
  const types = ["ocelle-listbox-change", "ocelle-listbox-activate"];
  for (const type of types) document.addEventListener(type, listener);
  scope.__eventsOff = () => {
    for (const type of types) document.removeEventListener(type, listener);
  };
}

/** A copy of the events `recordEvents` recorded. */
function recordedEvents(): unknown {
  return JSON.parse(JSON.stringify((window as unknown as { __events?: unknown[] }).__events ?? [])) as unknown;
}

/** An event as `recordEvents` records it, on `#lb`. */
function event(type: "change" | "activate", value: string): unknown {
  return { type: `ocelle-listbox-${type}`, detail: { value }, bubbles: true, composed: true, cancelable: false, target: "lb", value };
}
const change = (value: string): unknown => event("change", value);
const activate = (value: string): unknown => event("activate", value);

/** The `value` property of the element with `id`, as a string, or null when it has none. */
function valueOf(id: string): string | null {
  const value = (document.getElementById(id) as unknown as { value?: unknown } | null)?.value;
  return typeof value === "string" ? value : null;
}

/** The `tabindex` attribute of each `ocelle-option` child of the element with `id`. */
function tabindexes(id: string): (string | null)[] {
  return [...(document.getElementById(id)?.children ?? [])].filter((child) => child.localName === "ocelle-option").map((child) => child.getAttribute("tabindex"));
}

/** The roles a host or a user can interact with; any other node of the listbox's subtree is text or structure. */
const interactiveRoles = new Set(["listbox", "option", "button", "link", "textbox", "searchbox", "checkbox", "radio", "switch", "combobox", "slider", "spinbutton", "tab", "tablist", "menu", "menuitem", "tree", "treeitem", "grid", "gridcell"]);

/** An exposed node as the scenarios state it: role and name, and for options whether selected and disabled. */
interface Exposed {
  readonly role: string;
  readonly name: string;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}

/** The interactive nodes of the accessibility subtree of `id`, in tree order. */
async function tree(driver: Driver, id = "lb"): Promise<Exposed[]> {
  const nodes = await driver.axStates(id, "subtree");
  return nodes
    .filter((node: AxNodeState) => interactiveRoles.has(node.role))
    .map((node) => (node.role === "option" ? { role: node.role, name: node.name, selected: node.selected === true, disabled: node.disabled === true } : { role: node.role, name: node.name }));
}

/** A listbox named `name` with options `names`, the `selected` one selected and the `disabled` ones disabled. */
function exposed(name: string, names: readonly string[], selected: number | null = null, disabled: readonly number[] = []): Exposed[] {
  return [{ role: "listbox", name }, ...names.map((each, index) => ({ role: "option", name: each, selected: index === selected, disabled: disabled.includes(index) }))];
}

/** The selected bar of an option: the `::before` content, and with content its inline size, inline-start offset and colour. */
async function bar(driver: Driver, target: DriverTarget): Promise<unknown> {
  const content = await driver.computedPart(target, "::before", "content");
  if (content === "none" || content === "normal") return { content: "none" };
  return {
    content,
    inline: await driver.computedPart(target, "::before", "inline-size"),
    start: await driver.computedPart(target, "::before", "inset-inline-start"),
    block: await driver.computedPart(target, "::before", "inset-block-start"),
    background: await driver.computedPart(target, "::before", "background-color"),
  };
}

/** The bar FR-018 and R-15 give a selected option: 3 px on its inline-start edge, the full block size, in `colour`. */
function selectedBar(colour: string): unknown {
  return { content: '""', inline: "3px", start: "0px", block: "0px", background: colour };
}
const noBar = { content: "none" };

/** The ring of a focused option: its `::after` border on each side, width and colour. */
async function ring(driver: Driver, target: DriverTarget): Promise<unknown> {
  const sides = ["top", "right", "bottom", "left"];
  const out: string[] = [];
  for (const side of sides) out.push(`${await driver.computedPart(target, "::after", `border-${side}-width`)} ${await driver.computedPart(target, "::after", `border-${side}-color`)}`);
  return out;
}

/**
 * Whether the ring of the `index`-th option of `#lb` (its border box grown by focus width + offset, 5 px) lies within
 * the client box of the listbox's `part="list"` on each side (top, right, bottom, left); null when there is no list part.
 */
function ringInside(index: number): boolean[] | null {
  const host = document.getElementById("lb");
  const list = host?.shadowRoot?.querySelector('[part="list"]');
  const option = [...(host?.children ?? [])].filter((child) => child.localName === "ocelle-option")[index];
  if (list === null || list === undefined || option === undefined) return null;
  const grown = 5;
  const box = option.getBoundingClientRect();
  const outer = list.getBoundingClientRect();
  const client = { top: outer.top + list.clientTop, left: outer.left + list.clientLeft, bottom: outer.top + list.clientTop + list.clientHeight, right: outer.left + list.clientLeft + list.clientWidth };
  const slack = 0.01;
  return [box.top - grown >= client.top - slack, box.right + grown <= client.right + slack, box.bottom + grown <= client.bottom + slack, box.left - grown >= client.left - slack];
}

/**
 * The colour of the pixel 3.5 CSS px outside the middle of each edge of the `index`-th option of `#lb` (inside the
 * ring band, 2 to 5 px out), top, right, bottom and left, read from a screenshot of `#lb`.
 */
async function ringPixels(driver: Driver, index: number): Promise<string[]> {
  const host = await driver.box("lb");
  const option = await driver.box(opt(index));
  const image = await driver.pixels("lb");
  const scale = image.width / host.width;
  const x = option.x - host.x;
  const y = option.y - host.y;
  const at = (cssX: number, cssY: number): string => {
    const px = Math.floor(cssX * scale);
    const py = Math.floor(cssY * scale);
    const offset = (py * image.width + px) * 4;
    return `rgb(${String(image.data[offset])}, ${String(image.data[offset + 1])}, ${String(image.data[offset + 2])})`;
  };
  const out = 3.5;
  return [at(x + option.width / 2, y - out), at(x + option.width + out, y + option.height / 2), at(x + option.width / 2, y + option.height + out), at(x - out, y + option.height / 2)];
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

/** How a host re-renders the focused option on its blur (contracts § Pairings, "Tab out while the host re-renders on blur"). */
interface Rerender {
  readonly what: "move" | "remove";
  readonly when: "microtask" | "frame";
}

/** Installs, once, a host `focusout` listener on `#lb` that moves (`appendChild`) or removes the blurred option later. */
function rerenderOnBlur(mode: Rerender): void {
  const host = document.getElementById("lb");
  host?.addEventListener(
    "focusout",
    (event) => {
      const child = event.target as Element;
      if (child.localName !== "ocelle-option") return;
      const act = (): void => {
        if (mode.what === "move") host.appendChild(child);
        else child.remove();
      };
      if (mode.when === "microtask") queueMicrotask(act);
      else requestAnimationFrame(act);
    },
    { once: true },
  );
}

const accentLight = tokenColour("color-accent-strong", "light");
const accentDark = tokenColour("color-accent-strong", "dark");
const hoverLight = tokenColour("color-hover-bg", "light");
const transparent = "rgba(0, 0, 0, 0)";
const longLabel = "A folder whose name is much longer than the listbox is wide, so that it wraps inside the option onto further lines";

const rerenders: readonly (Rerender & { readonly input: "Tab" | "click" })[] = (["Tab", "click"] as const).flatMap((input) =>
  (["move", "remove"] as const).flatMap((what) => (["microtask", "frame"] as const).map((when) => ({ input, what, when }))),
);

/** How a host changes the focused option and sets `value` in one task (review round 1, R1-01). */
interface ChangeAndSet {
  readonly change: "remove" | "move" | "reinsert";
  readonly by: "property" | "attribute";
  readonly value: "gamma" | "alpha";
}

/**
 * In one task: removes the option `beta` of `#lb`, moves it to the end or re-inserts it in its place, then sets the
 * listbox's `value` by property or by attribute.
 */
function changeAndSet(how: ChangeAndSet): void {
  const listbox = document.getElementById("lb") as (HTMLElement & { value: string }) | null;
  const beta = listbox?.querySelector('ocelle-option[value="beta"]');
  if (listbox === null || beta === null || beta === undefined) return;
  if (how.change === "remove") beta.remove();
  else if (how.change === "move") listbox.append(beta);
  else {
    const next = beta.nextSibling;
    beta.remove();
    listbox.insertBefore(beta, next);
  }
  if (how.by === "property") listbox.value = how.value;
  else listbox.setAttribute("value", how.value);
}

const changesAndSets: readonly ChangeAndSet[] = (["remove", "move", "reinsert"] as const).flatMap((change) =>
  (["property", "attribute"] as const).flatMap((by) => (["gamma", "alpha"] as const).map((value) => ({ change, by, value }))),
);

/** What R1-01's bodies must observe: focus, selection and tab stop as without the set, and no event. */
function afterChangeAndSet({ change, value }: ChangeAndSet): unknown {
  const names = change === "remove" ? ["alpha", "gamma", "delta"] : change === "move" ? ["alpha", "gamma", "delta", "beta"] : ["alpha", "beta", "gamma", "delta"];
  const selected = names.indexOf(value);
  return {
    focus: opt(change === "remove" ? 1 : names.indexOf("beta")),
    tree: exposed("Folders", names, selected),
    tabindexes: names.map((_, index) => (index === selected ? "0" : "-1")),
    value,
    events: [],
  };
}

export const listboxScenarios: readonly ListboxScenario[] = [
  ...(["remove", "move"] as const).map(
    (change): ListboxScenario => ({
      // Found in phase 3 (reviews/phase-3/notes.md): the observer's callback, queued by an earlier mutation in the task,
      // runs before the focus record's `focusout` microtask. Plant: the observer's batch ignoring the focus record.
      name: `R-03: a host that ${change === "remove" ? "removes delta and then the focused beta" : "moves alpha and then the focused beta to the end"} in one task ${change === "remove" ? "moves focus to gamma, the next enabled option (FR-011)" : "keeps focus on beta"}, as when the focused option's change comes first`,
      fixture: true,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page(options(["alpha", "beta", "gamma", "delta"])));
        await inPage(recordEvents, null);
        await driver.focusNode(opt(1));
        await driver.mutate("lb", change === "remove" ? [{ remove: 3 }, { remove: 1 }] : [{ move: 0, before: "end" }, { move: 0, before: "end" }]);
        await inPage(frames, undefined);
        return { focus: await driver.focusedElement(), tree: await tree(driver), events: await inPage(recordedEvents, null) };
      },
      expected: change === "remove" ? { focus: opt(1), tree: exposed("Folders", ["alpha", "gamma"]), events: [] } : { focus: opt(3), tree: exposed("Folders", ["gamma", "delta", "alpha", "beta"]), events: [] },
    }),
  ),
  ...changesAndSets.map(
    (how): ListboxScenario => ({
      // Review round 1, R1-01. Mutant: the value setter taking the pending records without the focus record (the
      // focused option's removal or move then leaves focus on the body).
      name: `R1-01: a host that ${how.change === "remove" ? "removes" : how.change === "move" ? "moves to the end" : "re-inserts in place"} the focused beta and sets value to ${how.value === "alpha" ? "the current alpha" : "gamma"} by ${how.by} in the same task leaves focus ${how.change === "remove" ? "on the next enabled option (FR-011)" : "on beta (R-03)"}, the selection and tab stop on the set value, and emits nothing, as without the set`,
      fixture: true,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page(options(["alpha", "beta", "gamma", "delta"]), 'label="Folders" value="alpha"'));
        await inPage(recordEvents, null);
        await driver.focusNode(opt(1));
        await inPage(changeAndSet, how);
        await inPage(frames, undefined);
        return { focus: await driver.focusedElement(), tree: await tree(driver), tabindexes: await inPage(tabindexes, "lb"), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) };
      },
      expected: afterChangeAndSet(how),
    }),
  ),
  {
    // Plants: no role or name through internals; every option at tabindex 0; no tab stop.
    name: "US1-1: a listbox named Folders with five options, none selected, one tab stop on the first: Tab focuses alpha, Tab again leaves to the button after it (FR-012, FR-016)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const first = await driver.focusedElement();
      await driver.pressKeys("Tab");
      return { tree: await tree(driver), first, second: await driver.focusedElement(), tabindexes: await inPage(tabindexes, "lb"), events: await inPage(recordedEvents, null) };
    },
    expected: { tree: exposed("Folders", folderNames), first: opt(0), second: after, tabindexes: ["0", "-1", "-1", "-1", "-1"], events: [] },
  },
  {
    // Plants: selection following focus in the listbox (an event and a selection on the arrows); `preventDefault()` missing.
    name: "US1-2: ArrowDown three times moves focus to delta and ArrowUp back to gamma; nothing is selected and nothing emitted, while focus moved on each key (FR-013)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const focus: unknown[] = [];
      for (const key of ["ArrowDown", "ArrowDown", "ArrowDown", "ArrowUp"]) {
        await driver.pressKeys(key);
        focus.push(await driver.focusedElement());
      }
      return { focus, tree: await tree(driver), value: await inPage(valueOf, "lb"), keys: await driver.keydownRecord(), events: await inPage(recordedEvents, null) };
    },
    expected: {
      focus: [opt(1), opt(2), opt(3), opt(2)],
      tree: exposed("Folders", folderNames),
      value: "",
      keys: [
        { key: "Tab", defaultPrevented: false },
        { key: "ArrowDown", defaultPrevented: true },
        { key: "ArrowDown", defaultPrevented: true },
        { key: "ArrowDown", defaultPrevented: true },
        { key: "ArrowUp", defaultPrevented: true },
      ],
      events: [],
    },
  },
  {
    // Plant: `wrap: true` for the listbox (ArrowDown on epsilon then goes to alpha, ArrowUp on alpha to epsilon).
    name: "US1-3: the listbox does not wrap: ArrowUp on alpha stays on alpha, End moves to epsilon, ArrowDown on epsilon stays there; each key handled (FR-013)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const focus: unknown[] = [];
      for (const key of ["ArrowUp", "End", "ArrowDown"]) {
        await driver.pressKeys(key);
        focus.push(await driver.focusedElement());
      }
      return { focus, keys: (await driver.keydownRecord()).slice(1) };
    },
    expected: {
      focus: [opt(0), opt(4), opt(4)],
      keys: [
        { key: "ArrowUp", defaultPrevented: true },
        { key: "End", defaultPrevented: true },
        { key: "ArrowDown", defaultPrevented: true },
      ],
    },
  },
  {
    name: "US1-4: End on gamma moves focus to epsilon, Home then to alpha (FR-013)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await driver.focusNode(opt(2));
      await driver.pressKeys("End");
      const end = await driver.focusedElement();
      await driver.pressKeys("Home");
      return { end, home: await driver.focusedElement() };
    },
    expected: { end: opt(4), home: opt(0) },
  },
  {
    // Plants: the bar drawn by colour only (no size); the paint keyed on something other than aria-selected.
    name: "US1-5: Enter on gamma selects it: exposed as the only selected option, value gamma (already when the event is dispatched), the bar on its inline-start edge in accent-strong, one change event (FR-002, FR-014, FR-018)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.focusNode(opt(2));
      await driver.pressKeys("Enter");
      return {
        tree: await tree(driver),
        value: await inPage(valueOf, "lb"),
        selected: await bar(driver, opt(2)),
        others: [await bar(driver, opt(1)), await bar(driver, opt(3))],
        events: await inPage(recordedEvents, null),
        keys: await driver.keydownRecord(),
      };
    },
    expected: {
      tree: exposed("Folders", folderNames, 2),
      value: "gamma",
      selected: selectedBar(accentLight),
      others: [noBar, noBar],
      events: [change("gamma")],
      keys: [{ key: "Enter", defaultPrevented: true }],
    },
  },
  {
    // Plant: no `preventDefault()` on Space (the page then scrolls by a viewport).
    name: "US1-6, US1-7: Space on delta selects it with one change event and the page does not scroll; Space again emits nothing; Enter on the selected delta emits one activate and no change (FR-014, FR-014a)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `${page(options(folderNames), 'label="Folders" value="gamma"')}<div id="tall"></div>`);
      await driver.rules("#tall { block-size: 3000px; }");
      await inPage(recordEvents, null);
      await driver.focusNode(opt(3));
      const start = await driver.scrollOffset();
      await driver.pressKeys(" ");
      const space = { tree: await tree(driver), value: await inPage(valueOf, "lb"), scroll: await driver.scrollOffset() };
      await driver.pressKeys(" ");
      await driver.pressKeys("Enter");
      return { start, space, again: { tree: await tree(driver), scroll: await driver.scrollOffset(), focus: await driver.focusedElement() }, events: await inPage(recordedEvents, null), keys: await driver.keydownRecord() };
    },
    expected: {
      start: { x: 0, y: 0 },
      space: { tree: exposed("Folders", folderNames, 3), value: "delta", scroll: { x: 0, y: 0 } },
      again: { tree: exposed("Folders", folderNames, 3), scroll: { x: 0, y: 0 }, focus: opt(3) },
      events: [change("delta"), activate("delta")],
      keys: [
        { key: " ", defaultPrevented: true },
        { key: " ", defaultPrevented: true },
        { key: "Enter", defaultPrevented: true },
      ],
    },
  },
  {
    // Plant: the tab stop on the first option always (the selected beta, then the last focused gamma, not taken).
    name: "US1-8: the selected beta is the tab stop when tabbing back in; with no selection, the option that last had focus is (FR-016)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames), 'label="Folders" value="beta"'));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const selectedIn = await driver.focusedElement();
      await driver.pressKeys("Tab");
      const out = await driver.focusedElement();
      await driver.pressKeys("Tab", ["Shift"]);
      const selectedBack = await driver.focusedElement();
      await mount(driver, inPage, page(options(folderNames)));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const firstIn = await driver.focusedElement();
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("Tab");
      await driver.pressKeys("Tab", ["Shift"]);
      return { selectedIn, out, selectedBack, firstIn, lastFocusedBack: await driver.focusedElement() };
    },
    expected: { selectedIn: opt(1), out: after, selectedBack: opt(1), firstIn: opt(0), lastFocusedBack: opt(2) },
  },
  {
    name: "US1-9: a click on epsilon selects and focuses it and emits one change event (FR-014)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.clickTarget(opt(4));
      return { tree: await tree(driver), focus: await driver.focusedElement(), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) };
    },
    expected: { tree: exposed("Folders", folderNames, 4), focus: opt(4), value: "epsilon", events: [change("epsilon")] },
  },
  {
    // Plant: `disabled` ignored in the click handler (beta then selected, focused and reported).
    name: "US1-10: ArrowDown from alpha skips the disabled beta to gamma; a click on beta selects, focuses and emits nothing, beside a click on delta that does; beta is exposed disabled; Home and End skip disabled ends (FR-013)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames, [1])));
      await inPage(recordEvents, null);
      await driver.focusNode(opt(0));
      await driver.pressKeys("ArrowDown");
      const skipped = await driver.focusedElement();
      await driver.clickTarget(opt(1), { force: true });
      const disabledClick = { tree: await tree(driver), focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
      await driver.clickTarget(opt(3));
      const enabledClick = { tree: await tree(driver), focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(options(folderNames, [0, 4])));
      await driver.focusNode(opt(2));
      await driver.pressKeys("End");
      const end = await driver.focusedElement();
      await driver.pressKeys("Home");
      return { skipped, disabledClick, enabledClick, end, home: await driver.focusedElement() };
    },
    expected: {
      skipped: opt(2),
      disabledClick: { tree: exposed("Folders", folderNames, null, [1]), focus: opt(2), events: [] },
      enabledClick: { tree: exposed("Folders", folderNames, 3, [1]), focus: opt(3), events: [change("delta")] },
      end: opt(3),
      home: opt(1),
    },
  },
  {
    // Plants: dispatching change from the `value` setter; the setter deciding on the cached child list.
    name: "US1-11: a host set of value delta, by property or attribute, exposes delta selected as the tab stop and emits nothing; a value no option has and the empty value clear the selection, value reads empty (FR-010)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.setProperty("lb", "value", "delta");
      const property = { tree: await tree(driver), value: await inPage(valueOf, "lb"), tabindexes: await inPage(tabindexes, "lb") };
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const stop = await driver.focusedElement();
      await driver.setProperty("lb", "value", "zeta");
      const missing = { tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.setProperty("lb", "value", "delta");
      await driver.setProperty("lb", "value", "");
      const empty = { tree: await tree(driver), value: await inPage(valueOf, "lb") };
      const events = await inPage(recordedEvents, null);
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.setAttribute("lb", "value", "delta");
      const attribute = { tree: await tree(driver), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) };
      return { property, stop, missing, empty, events, attribute };
    },
    expected: {
      property: { tree: exposed("Folders", folderNames, 3), value: "delta", tabindexes: ["-1", "-1", "-1", "0", "-1"] },
      stop: opt(3),
      missing: { tree: exposed("Folders", folderNames), value: "" },
      empty: { tree: exposed("Folders", folderNames), value: "" },
      events: [],
      attribute: { tree: exposed("Folders", folderNames, 3), value: "delta", events: [] },
    },
  },
  {
    // Plants: `preventDefault()` on every keydown; typeahead on letters (g then focuses gamma).
    name: "US1-12: Escape, ArrowLeft, ArrowRight and the letter g are not handled and move nothing, Tab leaves the listbox, beside ArrowDown, handled, which moves focus (FR-015)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const focus: unknown[] = [];
      for (const key of ["ArrowDown", "Escape", "ArrowLeft", "ArrowRight", "g", "Tab"]) {
        await driver.pressKeys(key);
        focus.push(await driver.focusedElement());
      }
      return { focus, keys: await driver.keydownRecord(), tree: await tree(driver), events: await inPage(recordedEvents, null) };
    },
    expected: {
      focus: [opt(1), opt(1), opt(1), opt(1), opt(1), after],
      keys: [
        { key: "Tab", defaultPrevented: false },
        { key: "ArrowDown", defaultPrevented: true },
        { key: "Escape", defaultPrevented: false },
        { key: "ArrowLeft", defaultPrevented: false },
        { key: "ArrowRight", defaultPrevented: false },
        { key: "g", defaultPrevented: false },
        { key: "Tab", defaultPrevented: false },
      ],
      tree: exposed("Folders", folderNames),
      events: [],
    },
  },
  {
    // Plant: `label` deciding over a present host aria-label.
    name: "US1-13: a host aria-label names the listbox over label; removing it falls back to label; label is trimmed; with neither the listbox is unnamed (FR-006)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(
        driver,
        inPage,
        `<ocelle-listbox id="both" aria-label="Recent folders" label="Folders">${options(["alpha"])}</ocelle-listbox>` +
          `<ocelle-listbox id="trim" label="  Folders  ">${options(["beta"])}</ocelle-listbox>` +
          `<ocelle-listbox id="none">${options(["gamma"])}</ocelle-listbox>`,
      );
      const names = [(await tree(driver, "both"))[0], (await tree(driver, "trim"))[0], (await tree(driver, "none"))[0]];
      await driver.setAttribute("both", "aria-label", null);
      return { names, fallback: (await tree(driver, "both"))[0] };
    },
    expected: {
      names: [
        { role: "listbox", name: "Recent folders" },
        { role: "listbox", name: "Folders" },
        { role: "listbox", name: "" },
      ],
      fallback: { role: "listbox", name: "Folders" },
    },
  },
  {
    // Plants: no refocus after the batch (focus then stays on the body); change dispatched from the model's fallback.
    name: "US1-14: removing the focused beta moves focus to delta past the disabled gamma, removing the selected option clears value with no event, added and reordered options are followed by the tree and the keys (FR-011)",
    fixture: true,
    run: async (driver, inPage) => {
      const four = ["alpha", "beta", "gamma", "delta"];
      await mount(driver, inPage, page(options(four, [2]), 'label="Folders" value="beta"'));
      await inPage(recordEvents, null);
      await driver.focusNode(opt(1));
      await driver.mutate("lb", [{ remove: 1 }]);
      const removed = { focus: await driver.focusedElement(), tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.mutate("lb", [{ remove: 2 }]);
      const last = await driver.focusedElement();
      await driver.mutate("lb", [{ append: '<ocelle-option value="zeta">zeta</ocelle-option>' }, { move: 0, before: "end" }]);
      const reordered = await tree(driver);
      await driver.focusNode(opt(1));
      await driver.pressKeys("End");
      const end = await driver.focusedElement();
      await driver.pressKeys("Home");
      return { removed, last, reordered, end, home: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
    },
    expected: {
      removed: { focus: opt(2), tree: exposed("Folders", ["alpha", "gamma", "delta"], null, [1]), value: "" },
      last: opt(0),
      reordered: exposed("Folders", ["gamma", "zeta", "alpha"], null, [0]),
      end: opt(2),
      home: opt(1),
      events: [],
    },
  },
  {
    // Plant: the bar as an inset `box-shadow` only (forced colours compute it to none: no Highlight edge).
    name: "US1-15: in forced colours the selected gamma shows a Highlight edge on its inline-start edge, unselected options none, and the keyboard-focused option a Highlight ring (FR-007, FR-008)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames), 'label="Folders" value="gamma"'));
      await driver.forcedColors("active", "light");
      const highlight = await driver.resolveColour("Highlight");
      const canvas = await driver.resolveColour("Canvas");
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      // The resolved Highlight colour is named, so the expectation can state it (it is the platform's, not a token).
      const named = (value: unknown): unknown => JSON.parse(JSON.stringify(value).split(highlight).join("Highlight")) as unknown;
      const observed = {
        distinct: highlight !== canvas,
        focus: await driver.focusedElement(),
        selected: named(await bar(driver, opt(2))),
        others: [await bar(driver, opt(0)), await bar(driver, opt(4))],
        ring: named(await ring(driver, opt(2))),
      };
      await driver.forcedColors("none");
      return observed;
    },
    expected: { distinct: true, focus: opt(2), selected: selectedBar("Highlight"), others: [noBar, noBar], ring: ["3px Highlight", "3px Highlight", "3px Highlight", "3px Highlight"] },
  },
  {
    // Plant: no padding on `part="list"` (the ring of the first and the last option is then cut by the scrollport).
    name: "US1-16: in a listbox taller than its max-block-size the focused option scrolls into view and its ring lies wholly inside the list part's client box, for the first, the last and one scrolled to (FR-017)",
    fixture: true,
    run: async (driver, inPage) => {
      const ten = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
      await mount(driver, inPage, page(options(ten)));
      await driver.rules("#lb { max-block-size: 150px; }");
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const first = await inPage(ringInside, 0);
      await driver.pressKeys("End");
      const last = { focus: await driver.focusedElement(), inside: await inPage(ringInside, 9) };
      await driver.pressKeys("Home");
      for (let step = 0; step < 6; step += 1) await driver.pressKeys("ArrowDown");
      const scrolled = { focus: await driver.focusedElement(), inside: await inPage(ringInside, 6) };
      const listHeight = (await driver.box("lb", '[part="list"]')).height;
      return { first, last, scrolled, bounded: listHeight > 0 && listHeight <= 150 };
    },
    expected: { first: [true, true, true, true], last: { focus: opt(9), inside: [true, true, true, true] }, scrolled: { focus: opt(6), inside: [true, true, true, true] }, bounded: true },
  },
  {
    // Plant: the default value written to the attribute, or the default from the index among all children.
    name: "US1-17: options with no value or value=\"\" take their index as value: a click on beta reports 1; value = 2 selects gamma, value = \"\" clears (FR-009)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-option>alpha</ocelle-option><ocelle-option value="">beta</ocelle-option><ocelle-option>gamma</ocelle-option>'));
      await inPage(recordEvents, null);
      await driver.clickTarget(opt(1));
      const clicked = { value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) };
      const values = await inPage(() => [...(document.getElementById("lb")?.children ?? [])].map((child) => [(child as unknown as { value: unknown }).value, child.getAttribute("value")]), null);
      await driver.setProperty("lb", "value", "2");
      const set = { tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.setProperty("lb", "value", "");
      return { clicked, values, set, cleared: { tree: await tree(driver), value: await inPage(valueOf, "lb") } };
    },
    expected: {
      clicked: { value: "1", events: [change("1")] },
      values: [
        ["0", null],
        ["1", ""],
        ["2", null],
      ],
      set: { tree: exposed("Folders", ["alpha", "beta", "gamma"], 2), value: "2" },
      cleared: { tree: exposed("Folders", ["alpha", "beta", "gamma"]), value: "" },
    },
  },
  {
    // Plants: the "current value" no-op dropped (a set of gamma then rewrites the states); rewriting aria-selected on
    // every set (the second count is not 0); activating on every Enter (a disabled selected option then activates).
    name: "US1-18: a selected, focused gamma that becomes disabled stays selected and focused, loses the tab stop, and Enter, Space and clicks do nothing; a host set of gamma then mutates nothing, beside the first set that did (FR-010, FR-016)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await inPage(countMutations, "lb");
      await driver.setProperty("lb", "value", "gamma");
      const firstSet = (await inPage(mutations, null)) > 0;
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.mutate("lb", [{ child: 2, attribute: "disabled", value: "" }]);
      const disabled = { tree: await tree(driver), value: await inPage(valueOf, "lb"), focus: await driver.focusedElement(), tabindexes: await inPage(tabindexes, "lb") };
      await inPage(mutations, null);
      await driver.setProperty("lb", "value", "gamma");
      const currentSet = { mutations: await inPage(mutations, null), tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.pressKeys("Enter");
      await driver.pressKeys(" ");
      const keys = { focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("Enter");
      await driver.clickTarget(opt(2), { force: true });
      await driver.pressKeys("ArrowUp");
      return { firstSet, disabled, currentSet, keys, final: { tree: await tree(driver), focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) } };
    },
    expected: {
      firstSet: true,
      disabled: { tree: exposed("Folders", folderNames, 2, [2]), value: "gamma", focus: opt(2), tabindexes: ["0", "-1", "-1", "-1", "-1"] },
      currentSet: { mutations: 0, tree: exposed("Folders", folderNames, 2, [2]), value: "gamma" },
      keys: { focus: opt(2), events: [] },
      final: { tree: exposed("Folders", folderNames, 3, [2]), focus: opt(1), events: [change("delta")] },
    },
  },
  {
    // Plant: the remembered value never forgotten (delta then selected in each second half).
    name: "US1-19: a value no option has is remembered: appending delta selects it with no event; after a user selection, a set of \"\" or of beta, an appended delta is not selected; a disabled delta that loses disabled is selected (FR-010a)",
    fixture: true,
    run: async (driver, inPage) => {
      const appendDelta = { append: '<ocelle-option value="delta">delta</ocelle-option>' };
      await mount(driver, inPage, page(options(["alpha", "beta"])));
      await inPage(recordEvents, null);
      await driver.setProperty("lb", "value", "delta");
      const remembered = { tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.mutate("lb", [appendDelta]);
      const appended = { tree: await tree(driver), value: await inPage(valueOf, "lb"), tabindexes: await inPage(tabindexes, "lb"), events: await inPage(recordedEvents, null) };
      const forgotten: unknown[] = [];
      for (const forget of ["click", "", "beta"]) {
        await mount(driver, inPage, page(options(["alpha", "beta"])));
        await inPage(recordEvents, null);
        await driver.setProperty("lb", "value", "delta");
        if (forget === "click") await driver.clickTarget(opt(0));
        else await driver.setProperty("lb", "value", forget);
        await driver.mutate("lb", [appendDelta]);
        forgotten.push({ tree: await tree(driver), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) });
      }
      await mount(driver, inPage, page(options(["alpha", "beta", "delta"], [2])));
      await inPage(recordEvents, null);
      await driver.setProperty("lb", "value", "delta");
      const waiting = await inPage(valueOf, "lb");
      await driver.mutate("lb", [{ child: 2, attribute: "disabled", value: null }]);
      return { remembered, appended, forgotten, enabled: { waiting, tree: await tree(driver), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) } };
    },
    expected: {
      remembered: { tree: exposed("Folders", ["alpha", "beta"]), value: "" },
      appended: { tree: exposed("Folders", ["alpha", "beta", "delta"], 2), value: "delta", tabindexes: ["-1", "-1", "0"], events: [] },
      forgotten: [
        { tree: exposed("Folders", ["alpha", "beta", "delta"], 0), value: "alpha", events: [change("alpha")] },
        { tree: exposed("Folders", ["alpha", "beta", "delta"]), value: "", events: [] },
        { tree: exposed("Folders", ["alpha", "beta", "delta"], 1), value: "beta", events: [] },
      ],
      enabled: { waiting: "", tree: exposed("Folders", ["alpha", "beta", "delta"], 2), value: "delta", events: [] },
    },
  },
  {
    // Plants: activating on every Enter (also on the unselected epsilon); activating a disabled option on double-click.
    name: "US1-20: Enter on the selected beta emits one activate and no change; a double-click on delta emits its change, then its activate; Enter on the unselected epsilon selects it with no activate; a double-click on the disabled zeta emits nothing (FR-014a)",
    fixture: true,
    run: async (driver, inPage) => {
      const six = [...folderNames, "zeta"];
      await mount(driver, inPage, page(options(six, [5]), 'label="Folders" value="beta"'));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("Enter");
      await driver.clickTarget(opt(3), { count: 2 });
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("Enter");
      await driver.clickTarget(opt(5), { count: 2, force: true });
      return { tree: await tree(driver), focus: await driver.focusedElement(), events: await inPage(recordedEvents, null) };
    },
    expected: {
      tree: exposed("Folders", [...folderNames, "zeta"], 4, [5]),
      focus: opt(4),
      events: [activate("beta"), change("delta"), activate("delta"), change("epsilon")],
    },
  },
  {
    // Plants: no refocus after the batch; the focus record not scoped to the removal that caused the blur.
    name: "US1-21: a host moving the selected, focused beta after gamma, or re-inserting it in place, keeps its focus, its selection and the tab stop, the keys follow the new order, and nothing is emitted",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta", "gamma"]), 'label="Folders" value="beta"'));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.mutate("lb", [{ move: 1, before: "end" }]);
      const moved = { focus: await driver.focusedElement(), tree: await tree(driver), tabindexes: await inPage(tabindexes, "lb") };
      await driver.pressKeys("ArrowUp");
      const up = await driver.focusedElement();
      await driver.pressKeys("ArrowDown");
      await driver.mutate("lb", [{ reinsert: 2 }]);
      return { moved, up, reinserted: { focus: await driver.focusedElement(), tree: await tree(driver) }, events: await inPage(recordedEvents, null) };
    },
    expected: {
      moved: { focus: opt(2), tree: exposed("Folders", ["alpha", "gamma", "beta"], 2), tabindexes: ["-1", "-1", "0"] },
      up: opt(1),
      reinserted: { focus: opt(2), tree: exposed("Folders", ["alpha", "gamma", "beta"], 2) },
      events: [],
    },
  },
  {
    // Plants: refocusing after any blur; the record scoped only by its task (a later move then steals focus back).
    name: "US1-21, a move does not steal focus back: after an in-task move keeps focus on beta, the user clicks plain text to leave it, and a host move in a later task leaves focus on the body (research R-03)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta", "gamma"]), 'label="Folders" value="beta"'));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.mutate("lb", [{ move: 1, before: "end" }]);
      const kept = await driver.focusedElement();
      await driver.clickTarget("away");
      const left = await driver.focusedElement();
      await driver.mutate("lb", [{ move: 2, before: 0 }]);
      await inPage(frames, undefined);
      return { kept, left, later: await driver.focusedElement(), tree: await tree(driver) };
    },
    expected: { kept: opt(2), left: null, later: null, tree: exposed("Folders", ["beta", "alpha", "gamma"], 0) },
  },
  ...rerenders.map(
    ({ input, what, when }): ListboxScenario => ({
      // Plants: the record scoped only by its task (a `setTimeout(0)` clear, no `relatedTarget` or `takeRecords()`
      // check); the "nothing inside the parent" clause; refocusing after any blur.
      name: `US1-21, Tab out while the host re-renders on blur: a ${input === "Tab" ? "real Tab" : "real click on the button after the list"} leaves beta for that button while a host focusout listener ${what === "move" ? "moves" : "removes"} beta in a ${when === "microtask" ? "microtask" : "requestAnimationFrame"}, beside an in-task move that keeps focus (research R-03)`,
      fixture: true,
      run: async (driver, inPage) => {
        await mount(driver, inPage, page(options(["alpha", "beta", "gamma"]), 'label="Folders" value="beta"'));
        await driver.focusNode("before");
        await driver.pressKeys("Tab");
        await driver.mutate("lb", [{ move: 1, before: "end" }]);
        const kept = await driver.focusedElement();
        await inPage(rerenderOnBlur, { what, when });
        if (input === "Tab") await driver.pressKeys("Tab");
        else await driver.clickTarget("after");
        await inPage(frames, undefined);
        return { kept, left: await driver.focusedElement() };
      },
      expected: { kept: opt(2), left: after },
    }),
  ),
  {
    // Plant: no tabindex on `part="list"` (Chromium then makes the overflowing scroller a tab stop).
    name: "US1-22: an overflowing listbox whose every option is disabled has no tab stop, Tab goes from the button before to the button after; with one enabled option that option takes focus",
    fixture: true,
    run: async (driver, inPage) => {
      const ten = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
      const all = ten.map((_, index) => index);
      await mount(driver, inPage, page(options(ten, all)));
      await driver.rules("#lb { max-block-size: 100px; }");
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const disabled = await driver.focusedElement();
      await mount(driver, inPage, page(options(ten, all.filter((index) => index !== 3))));
      await driver.rules("#lb { max-block-size: 100px; }");
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      return { disabled, oneEnabled: await driver.focusedElement() };
    },
    expected: { disabled: after, oneEnabled: opt(3) },
  },
  {
    // Plant: a name or generated content from the icon slot; the bar moved by the icon.
    name: "US1-23: an icon in the option's icon slot sits before the text at the icon size with the slot gap, adds nothing to its name, and leaves the selected bar as on a plain option",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(
        driver,
        inPage,
        page('<ocelle-option value="projects"><ocelle-icon id="icon" slot="icon" name="folder"></ocelle-icon>Projects</ocelle-option><ocelle-option value="plain">Plain</ocelle-option>', 'label="Folders" value="projects"'),
      );
      const icon = await driver.box("icon");
      const text = await inPage(() => {
        const option = document.getElementById("lb")?.querySelector("ocelle-option");
        const node = [...(option?.childNodes ?? [])].find((child) => child.nodeType === Node.TEXT_NODE && (child.textContent ?? "").trim() !== "");
        if (node === undefined) return null;
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
      }, null);
      const projects = await bar(driver, opt(0));
      await driver.setProperty("lb", "value", "plain");
      return {
        size: [icon.width, icon.height],
        gap: text === null ? null : Math.round(text.x - (icon.x + icon.width)),
        tree: exposed("Folders", ["Projects", "Plain"], 1),
        observedTree: await tree(driver),
        bars: [projects, await bar(driver, opt(1))],
      };
    },
    expected: { size: [20, 20], gap: 8, tree: exposed("Folders", ["Projects", "Plain"], 1), observedTree: exposed("Folders", ["Projects", "Plain"], 1), bars: [selectedBar(accentLight), selectedBar(accentLight)] },
  },
  {
    // Plant: the option's ring not raised (an outline on the host, or the `::after` without `z-index`): the hovered
    // neighbour's fill then covers the ring on its side.
    name: "the focus ring of a keyboard-focused option is drawn in color-focus just outside all four edges, with the pointer on the next option and on the previous one (FR-007, R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("ArrowDown");
      const focus = await driver.focusedElement();
      await driver.hoverTarget(opt(3));
      const next = { fill: await driver.computedNode(opt(3), "background-color"), ring: await ringPixels(driver, 2) };
      await driver.hoverTarget(opt(1));
      const previous = { fill: await driver.computedNode(opt(1), "background-color"), ring: await ringPixels(driver, 2) };
      return { focus, next, previous };
    },
    expected: {
      focus: opt(2),
      next: { fill: hoverLight, ring: [accentLight, accentLight, accentLight, accentLight] },
      previous: { fill: hoverLight, ring: [accentLight, accentLight, accentLight, accentLight] },
    },
  },
  {
    // Plants: the bar in another token; the hover fill kept off a selected option.
    name: "the selected bar is accent-strong on the main grounds in light and dark, the option's minimum block size is the target size, and a hovered selected option keeps its bar over the hover fill (R-10, R-15)",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames), 'label="Folders" value="beta"'));
      const light = await bar(driver, opt(1));
      const height = (await driver.box(opt(0))).height;
      await driver.theme("dark");
      const dark = await bar(driver, opt(1));
      await driver.theme(null);
      await driver.hoverTarget(opt(1));
      return { light, dark, height, hovered: { fill: await driver.computedNode(opt(1), "background-color"), bar: await bar(driver, opt(1)) } };
    },
    expected: { light: selectedBar(accentLight), dark: selectedBar(accentDark), height: 44, hovered: { fill: hoverLight, bar: selectedBar(accentLight) } },
  },
  {
    // Plant: a `:host(:hover)` rule with no disabled exclusion.
    name: "Edge Cases, hover: a disabled option under the pointer has no hover fill, beside an enabled sibling under the pointer filled hover-bg",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames, [2])));
      await driver.hoverTarget(opt(2));
      const disabled = await driver.computedNode(opt(2), "background-color");
      await driver.hoverTarget(opt(3));
      return { disabled, enabled: await driver.computedNode(opt(3), "background-color") };
    },
    expected: { disabled: transparent, enabled: hoverLight },
  },
  {
    // Plant: a `transition` on the selected paint.
    name: "Edge Cases, motion: an option declares no transition or animation, so a selection paints at once (transition-duration 0s, animation-name none), beside the bar the selection draws",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await driver.clickTarget(opt(1));
      return {
        bar: await bar(driver, opt(1)),
        motion: [await driver.computedNode(opt(1), "transition-duration"), await driver.computedNode(opt(1), "animation-name"), await driver.computedPart(opt(1), "::before", "transition-duration")],
      };
    },
    expected: { bar: selectedBar(accentLight), motion: ["0s", "none", "0s"] },
  },
  {
    // Plant: the child setting its role and tabindex in its own connectedCallback regardless of the parent.
    name: "Edge Cases: an ocelle-option directly in the page has no role and no tab stop, beside the same option in a listbox exposed as an option that takes the tab stop",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `<button id="before" type="button">Before</button><ocelle-option id="lone" value="alpha">alpha</ocelle-option><ocelle-listbox id="lb" label="Folders">${options(["alpha"])}</ocelle-listbox><button id="after" type="button">After</button>`);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const first = await driver.focusedElement();
      await driver.pressKeys("Tab");
      return { lone: await tree(driver, "lone"), tabindex: await driver.attribute("lone", "tabindex"), listbox: await tree(driver), first, second: await driver.focusedElement() };
    },
    expected: { lone: [], tabindex: null, listbox: exposed("Folders", ["alpha"]), first: opt(0), second: after },
  },
  {
    // Plants: selecting the last match; exposing the first after a user selection of the second.
    name: "Edge Cases: with two options of the same value a host set selects the first; a click on the second exposes the second as selected and reports the same value",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-option value="alpha">alpha</ocelle-option><ocelle-option value="same">One</ocelle-option><ocelle-option value="same">Two</ocelle-option>'));
      await inPage(recordEvents, null);
      await driver.setProperty("lb", "value", "same");
      const set = await tree(driver);
      await driver.clickTarget(opt(2));
      return { set, clicked: await tree(driver), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) };
    },
    expected: {
      set: exposed("Folders", ["alpha", "One", "Two"], 1),
      clicked: exposed("Folders", ["alpha", "One", "Two"], 2),
      value: "same",
      events: [change("same")],
    },
  },
  {
    // Plant: `tabindex="0"` on the host or on `part="list"` with no options.
    name: "Edge Cases: an empty listbox is exposed as a named listbox with no tab stop, Tab passes over it; an appended option then takes the tab stop",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const empty = { tree: await tree(driver), focus: await driver.focusedElement() };
      await driver.mutate("lb", [{ append: '<ocelle-option value="alpha">alpha</ocelle-option>' }]);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      return { empty, appended: { tree: await tree(driver), focus: await driver.focusedElement() } };
    },
    expected: { empty: { tree: [{ role: "listbox", name: "Folders" }], focus: after }, appended: { tree: exposed("Folders", ["alpha"]), focus: opt(0) } },
  },
  {
    // Plant: `white-space: nowrap` or `text-overflow: ellipsis` on the option.
    name: "Edge Cases: at a 320 px viewport an option label longer than the listbox wraps, the option grows in block size, its whole text is its name and the page does not scroll sideways",
    fixture: true,
    run: async (driver, inPage) => {
      const start = await inPage(() => [window.innerWidth, window.innerHeight], null);
      await mount(driver, inPage, page(`<ocelle-option value="long">${longLabel}</ocelle-option>${options(["short"])}`));
      await driver.setViewportSize(320, 640);
      const long = (await driver.box(opt(0))).height;
      const short = (await driver.box(opt(1))).height;
      const sideways = await inPage(() => document.documentElement.scrollWidth > document.documentElement.clientWidth, null);
      const observed = { grew: long > short && short === 44, sideways, tree: await tree(driver) };
      await driver.setViewportSize(start[0] ?? 0, start[1] ?? 0);
      return observed;
    },
    expected: { grew: true, sideways: false, tree: exposed("Folders", [longLabel, "short"]) },
  },
  {
    // Plant: a `display` rule on `:host` that overrides `:host([hidden])`.
    name: "Edge Cases: host hidden removes the listbox, no box and no node; without it the listbox has a box and its node",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha"])));
      await driver.setAttribute("lb", "hidden", "");
      const hidden = { display: (await driver.box("lb")).display, height: (await driver.box("lb")).height, tree: await tree(driver) };
      await driver.setAttribute("lb", "hidden", null);
      const shown = await driver.box("lb");
      return { hidden, shown: { display: shown.display, boxed: shown.height > 0, tree: await tree(driver) } };
    },
    expected: { hidden: { display: "none", height: 0, tree: [] }, shown: { display: "flex", boxed: true, tree: exposed("Folders", ["alpha"]) } },
  },
  {
    // Plant: the option's name read once at first render.
    name: "Edge Cases: an option's accessible name follows a change of its text",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta"])));
      const first = await tree(driver);
      await driver.mutate("lb", [{ property: "textContent", value: "omega", child: 0 }]);
      return { first, renamed: await tree(driver) };
    },
    expected: { first: exposed("Folders", ["alpha", "beta"]), renamed: exposed("Folders", ["omega", "beta"]) },
  },
  {
    // Plant: the value setter deciding on the cached child list (delta, appended in the same task, is then selected only
    // later, through the remembered value, so `value` read in that task is still empty). Made stricter after the plant
    // run (reviews/phase-2/plants.md): the value is also read in the task of the append and the set.
    name: "R-05: an option appended and value set to it in the same task are one operation: the option is selected through the direct path, value reads it in that task, with no event",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta"])));
      await inPage(recordEvents, null);
      await driver.mutate("lb", [{ append: '<ocelle-option value="delta">delta</ocelle-option>' }, { property: "value", value: "delta" }]);
      const later = { tree: await tree(driver), value: await inPage(valueOf, "lb"), events: await inPage(recordedEvents, null) };
      await mount(driver, inPage, page(options(["alpha", "beta"])));
      const inTask = await inPage(() => {
        const listbox = document.getElementById("lb") as (HTMLElement & { value: string }) | null;
        listbox?.insertAdjacentHTML("beforeend", '<ocelle-option value="delta">delta</ocelle-option>');
        if (listbox !== null) listbox.value = "delta";
        return [listbox?.value ?? null, listbox?.lastElementChild?.getAttribute("aria-selected") ?? null];
      }, null);
      return { later, inTask };
    },
    expected: { later: { tree: exposed("Folders", ["alpha", "beta", "delta"], 2), value: "delta", events: [] }, inTask: ["delta", "true"] },
  },
  // Bodies added after the mutation run of phase 2 (reviews/phase-2/notes.md), each with the mutant it kills.
  {
    // Mutants: aria-selected written as "" for false; `disabled` not reflected from its property; an option that leaves
    // keeping the listbox's attributes (no clean-up, a clean-up of every option, or one attribute left).
    name: "the listbox writes aria-selected, aria-disabled and tabindex on each option, follows a disabled property set, and removes them from a disabled option that leaves it, which has no role outside and keeps its own disabled",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames, [2]), 'label="Folders" value="beta"'));
      const states = (): unknown =>
        [...(document.getElementById("lb")?.children ?? [])].map((child) => [child.getAttribute("aria-selected"), child.getAttribute("aria-disabled"), child.getAttribute("tabindex")]);
      const written = await inPage(states, null);
      await driver.mutate("lb", [{ property: "disabled", value: true, child: 3 }]);
      const disabled = { states: await inPage(states, null), tree: await tree(driver) };
      await inPage(() => {
        const option = document.getElementById("lb")?.children[2];
        if (option !== undefined) {
          option.id = "left";
          document.body.append(option);
        }
      }, null);
      await inPage(frames, undefined);
      const left = await inPage(() => {
        const option = document.getElementById("left");
        return [option?.getAttribute("aria-selected") ?? null, option?.getAttribute("aria-disabled") ?? null, option?.getAttribute("tabindex") ?? null, option?.hasAttribute("disabled") ?? null];
      }, null);
      return { written, disabled, left, leftTree: await tree(driver, "left"), remaining: await inPage(states, null) };
    },
    expected: {
      written: [
        ["false", null, "-1"],
        ["true", null, "0"],
        ["false", "true", "-1"],
        ["false", null, "-1"],
        ["false", null, "-1"],
      ],
      disabled: {
        states: [
          ["false", null, "-1"],
          ["true", null, "0"],
          ["false", "true", "-1"],
          ["false", "true", "-1"],
          ["false", null, "-1"],
        ],
        tree: exposed("Folders", folderNames, 1, [2, 3]),
      },
      left: [null, null, null, true],
      leftTree: [],
      remaining: [
        ["false", null, "-1"],
        ["true", null, "0"],
        ["false", "true", "-1"],
        ["false", null, "-1"],
      ],
    },
  },
  {
    // Mutants: the observer not watching the options' `value`; the option's `value` setter not writing the attribute;
    // the option passing its `value` attribute to Lit (whose default would then be written when the attribute is removed).
    name: "FR-010a: an option whose value changes to the remembered value, by attribute or by property, is selected with no event; an option whose value attribute is removed takes its index and the attribute stays absent",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta"])));
      await inPage(recordEvents, null);
      await driver.setProperty("lb", "value", "delta");
      await driver.mutate("lb", [{ child: 1, attribute: "value", value: "delta" }]);
      const byAttribute = { tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.setProperty("lb", "value", "zeta");
      await driver.mutate("lb", [{ property: "value", value: "zeta", child: 0 }]);
      const byProperty = { tree: await tree(driver), value: await inPage(valueOf, "lb"), attribute: await inPage(() => document.getElementById("lb")?.children[0]?.getAttribute("value") ?? null, null) };
      await driver.mutate("lb", [{ child: 0, attribute: "value", value: null }]);
      await inPage(frames, undefined);
      const removed = {
        value: await inPage(valueOf, "lb"),
        option: await inPage(() => {
          const option = document.getElementById("lb")?.children[0] as (Element & { value?: unknown }) | undefined;
          return [option?.value ?? null, option?.getAttribute("value") ?? null];
        }, null),
      };
      return { byAttribute, byProperty, removed, events: await inPage(recordedEvents, null) };
    },
    expected: {
      byAttribute: { tree: exposed("Folders", ["alpha", "beta"], 1), value: "delta" },
      byProperty: { tree: exposed("Folders", ["alpha", "beta"], 0), value: "zeta", attribute: "zeta" },
      removed: { value: "0", option: ["0", null] },
      events: [],
    },
  },
  {
    // Mutants: every element child taken as an option; the default value counted among every child.
    name: "an element child of the listbox that is not an ocelle-option is not an option: not exposed, not in the keys, not counted in the default values, given no tabindex",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<span id="note">A note</span><ocelle-option>alpha</ocelle-option><ocelle-option>beta</ocelle-option>'));
      await inPage(recordEvents, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      const first = await driver.focusedElement();
      await driver.pressKeys("ArrowUp");
      const up = await driver.focusedElement();
      await driver.clickTarget(opt(1));
      const values = await inPage(() => [...(document.getElementById("lb")?.querySelectorAll("ocelle-option") ?? [])].map((option) => (option as unknown as { value: unknown }).value), null);
      return { first, up, tree: await tree(driver), note: await driver.attribute("note", "tabindex"), values, events: await inPage(recordedEvents, null) };
    },
    expected: { first: opt(0), up: opt(0), tree: exposed("Folders", ["alpha", "beta"], 1), note: null, values: ["0", "1"], events: [change("1")] },
  },
  {
    // Mutants: the origin filter dropped or its `defaultPrevented` check dropped; a focusin from a descendant of an
    // option recorded as the last focused option.
    name: "R-04's origin filter: ArrowDown from a focusable inside an option, or already handled by a listener on an option, is not the listbox's; neither moves focus nor the tab stop, beside ArrowDown on an option, which moves",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page('<ocelle-option value="alpha">alpha <span id="inner" tabindex="-1">inner</span></ocelle-option><ocelle-option value="beta">beta</ocelle-option><ocelle-option value="gamma">gamma</ocelle-option>'));
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("ArrowDown");
      const moved = await driver.focusedElement();
      await driver.focusNode("inner");
      await driver.pressKeys("ArrowDown");
      const inner = { focus: await driver.focusedElement(), tabindexes: await inPage(tabindexes, "lb") };
      await inPage(() => {
        document.getElementById("lb")?.children[1]?.addEventListener("keydown", (event) => {
          event.preventDefault();
        });
      }, null);
      await driver.focusNode(opt(1));
      await driver.pressKeys("ArrowDown");
      return { moved, inner, handled: await driver.focusedElement(), keys: (await driver.keydownRecord()).map((each) => each.defaultPrevented) };
    },
    expected: { moved: opt(2), inner: { focus: { id: "inner" }, tabindexes: ["-1", "-1", "0"] }, handled: opt(1), keys: [false, true, true, false, true] },
  },
  {
    // Mutants: the focus record's listeners in the bubble phase (a listener on an option that stops propagation then
    // hides the focus from the listbox).
    name: "R-03: the listbox's focus record runs before listeners on the options, so with options whose focusin and focusout stop propagating a later host move does not steal focus back after Tab out, the last focused option stays the tab stop, and focus is kept through an in-task move",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta", "gamma"])));
      await inPage(() => {
        for (const option of document.getElementById("lb")?.children ?? []) {
          for (const type of ["focusin", "focusout"]) {
            option.addEventListener(type, (event) => {
              event.stopPropagation();
            });
          }
        }
      }, null);
      await driver.focusNode("before");
      await driver.pressKeys("Tab");
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("ArrowDown");
      await driver.pressKeys("Tab");
      await driver.mutate("lb", [{ move: 2, before: 0 }]);
      const left = await driver.focusedElement();
      await driver.pressKeys("Tab", ["Shift"]);
      const back = await driver.focusedElement();
      await driver.mutate("lb", [{ move: 0, before: "end" }]);
      return { left, back, moved: await driver.focusedElement() };
    },
    expected: { left: after, back: opt(0), moved: opt(2) },
  },
  {
    // Mutants: `focusLeft` always true (a host that focuses another element while it removes the focused option then
    // has focus taken back); `focusLeft` read with the wrong comparison.
    name: "R-03: a host that focuses the button after the list while it removes the focused option keeps that focus, beside a removal with no such host, which moves focus to the next option",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(["alpha", "beta", "gamma", "delta"])));
      await driver.focusNode(opt(1));
      await driver.mutate("lb", [{ remove: 1 }]);
      const moved = await driver.focusedElement();
      await inPage(() => {
        const listbox = document.getElementById("lb");
        listbox?.addEventListener(
          "focusout",
          () => {
            document.getElementById("after")?.focus();
          },
          { once: true },
        );
      }, null);
      await driver.mutate("lb", [{ remove: 1 }]);
      await inPage(frames, undefined);
      return { moved, kept: await driver.focusedElement(), tree: await tree(driver) };
    },
    expected: { moved: opt(1), kept: after, tree: exposed("Folders", ["alpha", "delta"]) },
  },
  {
    // Mutant: the mousedown on the list part's own padding not prevented (the list part, at tabindex -1, then takes focus).
    name: "R-03: a press on the list part's padding takes no focus: focus stays on the button before an empty listbox when it is clicked, beside a click on an option, which focuses it",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(""));
      await driver.focusNode("before");
      await driver.clickTarget("lb");
      const padding = await driver.focusedElement();
      await mount(driver, inPage, page(options(["alpha"])));
      await driver.focusNode("before");
      await driver.clickTarget(opt(0));
      return { padding, option: await driver.focusedElement() };
    },
    expected: { padding: before, option: opt(0) },
  },
  {
    // Mutant: a removed value attribute not clearing the selection.
    name: "FR-010: removing the value attribute the host wrote clears the selection with no event, beside the set it undoes",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, page(options(folderNames)));
      await inPage(recordEvents, null);
      await driver.setAttribute("lb", "value", "delta");
      const set = { tree: await tree(driver), value: await inPage(valueOf, "lb") };
      await driver.setAttribute("lb", "value", null);
      return { set, removed: { tree: await tree(driver), value: await inPage(valueOf, "lb") }, events: await inPage(recordedEvents, null) };
    },
    expected: { set: { tree: exposed("Folders", folderNames, 3), value: "delta" }, removed: { tree: exposed("Folders", folderNames), value: "" }, events: [] },
  },
  {
    // Mutant: the name taken from `label` whatever the host's aria-label (the blank host aria-label then names it).
    name: "FR-006: a blank host aria-label decides alone and leaves the listbox unnamed even with a label, beside a host aria-label that names it",
    fixture: true,
    run: async (driver, inPage) => {
      await mount(driver, inPage, `<ocelle-listbox id="blank" aria-label=" " label="Folders">${options(["alpha"])}</ocelle-listbox><ocelle-listbox id="named" aria-label="Recent folders" label="Folders">${options(["beta"])}</ocelle-listbox>`);
      return [(await tree(driver, "blank"))[0], (await tree(driver, "named"))[0]];
    },
    expected: [
      { role: "listbox", name: "" },
      { role: "listbox", name: "Recent folders" },
    ],
  },
];
