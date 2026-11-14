// The shared bodies of the driver commands' own tests (014 research.md R-11, T002): each body mounts plain markup, sets
// up what it observes with a self-contained function run in the page (`InPage`), acts through the driver and returns
// what it observed; each harness asserts it equals `expected`, written by hand from what the command promises. The
// in-process harness (test/driver-commands.test.ts) runs every body; the fixture harness (test/browser/driver.test.ts)
// runs the bodies marked `fixture`, the ones whose observation does not depend on whether a frame passes between two
// protocol calls. Each body names the planted defect it catches (reviews/phase-1/plants.md).
import type { Driver, InPage } from "./driver.ts";

/** One body of a driver test: what it does, what it must observe, and whether the fixture harness runs it too. */
export interface DriverScenario {
  readonly name: string;
  readonly run: (driver: Driver, inPage: InPage) => Promise<unknown>;
  readonly expected: unknown;
  readonly fixture: boolean;
}

/** The modifier state and trust of a keyboard or mouse event, as the listeners below record it. */
interface Flags {
  readonly shift: boolean;
  readonly control: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
  readonly trusted: boolean;
}

const none = { shift: false, control: false, alt: false, meta: false, trusted: true } as const;

/** Records every keydown of a key other than a modifier on the element with `id`, on `window.__keys`. */
function recordKeys(id: string): void {
  const keys: unknown[] = [];
  (window as unknown as { __keys: unknown[] }).__keys = keys;
  document.getElementById(id)?.addEventListener("keydown", (event) => {
    if (["Shift", "Control", "Alt", "Meta"].includes(event.key)) return;
    keys.push({ key: event.key, shift: event.shiftKey, control: event.ctrlKey, alt: event.altKey, meta: event.metaKey, trusted: event.isTrusted });
  });
}

/** Records the mouse button events of the element with `id` on `window.__mouse`. */
function recordMouse(id: string): void {
  const events: unknown[] = [];
  (window as unknown as { __mouse: unknown[] }).__mouse = events;
  const element = document.getElementById(id);
  for (const type of ["mousedown", "mouseup", "click", "auxclick", "dblclick", "contextmenu"]) {
    element?.addEventListener(type, (event) => {
      const mouse = event as MouseEvent;
      events.push({ type, button: mouse.button, detail: mouse.detail, shift: mouse.shiftKey, control: mouse.ctrlKey, alt: mouse.altKey, meta: mouse.metaKey, trusted: mouse.isTrusted });
      if (type === "contextmenu") event.preventDefault();
    });
  }
}

/** A copy of what a recorder put on `window` under `name` (a copy, so later events do not change what was read). */
function recorded(name: string): unknown {
  return JSON.parse(JSON.stringify((window as unknown as Record<string, unknown>)[name])) as unknown;
}

/** One mouse event as `recordMouse` records it. */
function mouse(type: string, button: number, detail: number, flags: Partial<Flags> = {}): Readonly<Record<string, unknown>> {
  return { type, button, detail, ...none, ...flags };
}

const button = '<button id="c" type="button">Go</button>';

/** Four children of `#p`, three of them `span`s, told apart by their widths (10, 20, 30, 40 px). */
const children = '<div id="p"><span tabindex="-1" class="w10">a</span><b class="w20">b</b><span tabindex="-1" class="w30">c</span><span tabindex="-1" class="w40">d</span></div>';
const widths = "#p > * { display: inline-block; block-size: 10px; } .w10 { inline-size: 10px; } .w20 { inline-size: 20px; } .w30 { inline-size: 30px; } .w40 { inline-size: 40px; }";

export const driverCommandScenarios: readonly DriverScenario[] = [
  {
    // Plant: `press` dropping its modifiers (ArrowDown then has shift and control false).
    name: "press sends the key with its modifiers held as trusted input to the focused element, and releases them",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<input id="k" aria-label="Keys">');
      await inPage(recordKeys, "k");
      await driver.focus("k");
      await driver.press("ArrowDown", ["Shift", "Control"]);
      await driver.press(" ");
      await driver.press("a", ["Alt"]);
      await driver.press("End", ["Meta"]);
      return inPage(recorded, "__keys");
    },
    expected: [
      { key: "ArrowDown", ...none, shift: true, control: true },
      { key: " ", ...none },
      { key: "a", ...none, alt: true },
      { key: "End", ...none, meta: true },
    ],
  },
  {
    // Plants: `click` ignoring `count` (one click only), `click` that is not real input (no mousedown, untrusted).
    name: "click gives one trusted left click by default, and count 2 gives a double click",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(button);
      await inPage(recordMouse, "c");
      await driver.click("c");
      const once = await inPage(recorded, "__mouse");
      await inPage(recordMouse, "c");
      await driver.click("c", { count: 2 });
      return { once, twice: await inPage(recorded, "__mouse") };
    },
    expected: {
      once: [mouse("mousedown", 0, 1), mouse("mouseup", 0, 1), mouse("click", 0, 1)],
      twice: [mouse("mousedown", 0, 1), mouse("mouseup", 0, 1), mouse("click", 0, 1), mouse("mousedown", 0, 2), mouse("mouseup", 0, 2), mouse("click", 0, 2), mouse("dblclick", 0, 2)],
    },
  },
  {
    // Plants: `click` ignoring `button` (a left click), `click` ignoring `modifiers` (shift and alt false).
    name: "click presses the button it is given with the modifiers held: middle with Shift, right with Alt",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(button);
      await inPage(recordMouse, "c");
      await driver.click("c", { button: "middle", modifiers: ["Shift"] });
      const middle = await inPage(recorded, "__mouse");
      await inPage(recordMouse, "c");
      await driver.click("c", { button: "right", modifiers: ["Alt"] });
      const right = await inPage(recorded, "__mouse");
      await inPage(recordMouse, "c");
      await driver.click("c", { modifiers: ["Control", "Meta"] });
      return { middle, right, left: await inPage(recorded, "__mouse") };
    },
    expected: {
      middle: [mouse("mousedown", 1, 1, { shift: true }), mouse("mouseup", 1, 1, { shift: true }), mouse("auxclick", 1, 1, { shift: true })],
      right: [mouse("mousedown", 2, 1, { alt: true }), mouse("contextmenu", 2, 0, { alt: true }), mouse("mouseup", 2, 1, { alt: true }), mouse("auxclick", 2, 1, { alt: true })],
      left: [mouse("mousedown", 0, 1, { control: true, meta: true }), mouse("mouseup", 0, 1, { control: true, meta: true }), mouse("click", 0, 1, { control: true, meta: true })],
    },
  },
  {
    // Plant: child addressing off by one (index 1 of the spans is then the 10 px or the 40 px span).
    name: "a child target is the index-th child of its tag of the parent: box, computed, focus, click and activeElement agree",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount(children);
      await driver.rules(widths);
      const second = { parent: "p", kind: "span", index: 1 };
      await inPage(() => {
        const clicked: string[] = [];
        (window as unknown as { __clicked: string[] }).__clicked = clicked;
        document.getElementById("p")?.addEventListener("click", (event) => clicked.push((event.target as Element).className));
      }, null);
      const box = await driver.box(second);
      await driver.click(second);
      await driver.focus({ parent: "p", kind: "span", index: 2 });
      return {
        width: box.width,
        computed: await driver.computed({ parent: "p", kind: "span", index: 0 }, "inline-size"),
        other: await driver.computed({ parent: "p", kind: "b", index: 0 }, "inline-size"),
        clicked: await inPage(recorded, "__clicked"),
        focused: await driver.activeElement(),
      };
    },
    expected: { width: 30, computed: "10px", other: "20px", clicked: ["w30"], focused: { parent: "p", kind: "span", index: 2 } },
  },
  {
    // Plant: `activeElement` stopping at the first shadow host (it then gives { id: "outer" } for the two inner foci).
    name: "activeElement follows focus through nested shadow roots and names what it finds; null when only the body is focused",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<div id="outer"></div><div id="p"><span tabindex="-1">a</span><span tabindex="-1">b</span></div>');
      await inPage(() => {
        const outer = document.getElementById("outer")?.attachShadow({ mode: "open" });
        const inner = document.createElement("div");
        inner.id = "inner";
        outer?.append(inner);
        const root = inner.attachShadow({ mode: "open" });
        root.innerHTML = '<button id="deep" type="button">Deep</button><button part="act" type="button">Act</button><button type="button">Plain</button>';
      }, null);
      const focusIn = (selector: string): void => {
        (document.getElementById("outer")?.shadowRoot?.getElementById("inner")?.shadowRoot?.querySelector(selector) as HTMLElement | null)?.focus();
      };
      const seen: unknown[] = [await driver.activeElement()];
      await inPage(focusIn, "#deep");
      seen.push(await driver.activeElement());
      await inPage(focusIn, '[part="act"]');
      seen.push(await driver.activeElement());
      await inPage(focusIn, "button:not([id]):not([part])");
      seen.push(await driver.activeElement());
      await driver.focus({ parent: "p", kind: "span", index: 1 });
      seen.push(await driver.activeElement());
      await inPage(() => {
        (document.activeElement as HTMLElement | null)?.blur();
      }, null);
      seen.push(await driver.activeElement());
      return seen;
    },
    expected: [null, { id: "deep" }, { host: "inner", part: "act" }, { unidentified: "button" }, { parent: "p", kind: "span", index: 1 }, null],
  },
  {
    // Plant: `mutate` running its steps in separate tasks (the observer then has one callback per step).
    name: "mutate applies every step in one task (one MutationObserver callback), in order, then waits for the elements to render",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<div id="m"><p>0</p><p>1</p><p>2</p><p>3</p></div>');
      await inPage(() => {
        const batches: number[] = [];
        (window as unknown as { __batches: number[] }).__batches = batches;
        const target = document.getElementById("m");
        if (target !== null) new MutationObserver((records) => batches.push(records.length)).observe(target, { childList: true, attributes: true, subtree: true });
      }, null);
      await driver.mutate("m", [
        { append: '<p>4</p><ocelle-icon id="i" name="close"></ocelle-icon>' },
        { remove: 0 },
        { move: 0, before: 2 },
        { move: 0, before: "end" },
        { reinsert: 1 },
        { child: 0, attribute: "data-x", value: "1" },
        { child: 1, attribute: "title", value: null },
        { property: "ocelleMarker", value: 7 },
        { property: "ocelleMarker", value: "child", child: 2 },
      ]);
      const after = await inPage(() => {
        const target: (HTMLElement & { ocelleMarker?: unknown }) | null = document.getElementById("m");
        const kids = [...(target?.children ?? [])] as (HTMLElement & { ocelleMarker?: unknown })[];
        return {
          batches: (window as unknown as { __batches: number[] }).__batches.length,
          children: kids.map((kid) => kid.localName === "p" ? kid.textContent : kid.localName),
          attribute: kids[0]?.getAttribute("data-x") ?? null,
          marker: target?.ocelleMarker ?? null,
          childMarker: kids[2]?.ocelleMarker ?? null,
        };
      }, null);
      return { ...after, icon: (await driver.drawing("i")).children };
    },
    expected: { batches: 1, children: ["1", "3", "4", "ocelle-icon", "2"], attribute: "1", marker: 7, childMarker: "child", icon: ["svg"] },
  },
  {
    // Plant: `resize` that settles (the earlier observer has then seen 300 px before `afterResizeDelivery`).
    name: "resize sets the inline size at once and does not wait for a frame, so no ResizeObserver has seen it yet",
    fixture: false,
    run: async (driver, inPage) => {
      await driver.mount('<div id="r" class="r">x</div>');
      await driver.rules(".r { inline-size: 200px; block-size: 20px; }");
      await inPage(observeSizes, "r");
      await driver.resize("r", 300);
      const before = await inPage(recorded, "__sizes");
      const box = await driver.box("r");
      await driver.afterResizeDelivery("r");
      return { before, width: box.width, after: await inPage(recorded, "__sizes") };
    },
    expected: { before: [200], width: 300, after: [200, 300] },
  },
  {
    // Plant: `afterResizeDelivery` resolving before the delivery (the earlier observer has then not seen 260 px).
    name: "afterResizeDelivery resolves after a ResizeObserver registered earlier has been given the new size",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<div id="r" class="r">x</div>');
      await driver.rules(".r { inline-size: 200px; block-size: 20px; }");
      await inPage(observeSizes, "r");
      await driver.resize("r", 260);
      await driver.afterResizeDelivery("r");
      const sizes = (await inPage(recorded, "__sizes")) as number[];
      return { last: sizes.at(-1), width: (await driver.box("r")).width };
    },
    expected: { last: 260, width: 260 },
  },
  {
    // Plant: `computedPart` reading the host (every value is then the host's 1px).
    name: "computedPart reads a shadow part, that part's pseudo-element and the host's pseudo-element, not the host",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<div id="cp"></div>');
      await inPage(() => {
        const host = document.getElementById("cp");
        const root = host?.attachShadow({ mode: "open" });
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(':host { padding-left: 1px; } :host::after { content: ""; padding-left: 3px; } [part="x"] { padding-left: 5px; } [part="x"]::before { content: ""; padding-left: 7px; }');
        if (root !== undefined) {
          root.adoptedStyleSheets = [sheet];
          root.innerHTML = '<span part="x">x</span>';
        }
      }, null);
      return {
        host: await driver.computed("cp", "padding-left"),
        after: await driver.computedPart("cp", "::after", "padding-left"),
        part: await driver.computedPart("cp", "x", "padding-left"),
        before: await driver.computedPart("cp", "x::before", "padding-left"),
      };
    },
    expected: { host: "1px", after: "3px", part: "5px", before: "7px" },
  },
  {
    // Plants: a constant page scroll offset ({ x: 0, y: 0 }), a `viewportSize` that does not resize.
    name: "scrollOffset is the page's scroll position and viewportSize resizes the viewport",
    fixture: true,
    run: async (driver, inPage) => {
      await driver.mount('<div id="tall"></div>');
      await driver.rules("#tall { inline-size: 3000px; block-size: 3000px; }");
      const start = await inPage(() => [window.innerWidth, window.innerHeight], null);
      await inPage(() => {
        window.scrollTo(40, 120);
      }, null);
      const scrolled = await driver.scrollOffset();
      await driver.viewportSize(500, 400);
      const size = await inPage(() => [window.innerWidth, window.innerHeight], null);
      await driver.viewportSize(start[0] ?? 0, start[1] ?? 0);
      await inPage(() => {
        window.scrollTo(0, 0);
      }, null);
      return { scrolled, size, back: await driver.scrollOffset() };
    },
    expected: { scrolled: { x: 40, y: 120 }, size: [500, 400], back: { x: 0, y: 0 } },
  },
];

/**
 * Records the inline sizes a ResizeObserver is given for the element with `id` on `window.__sizes`, and resolves in the
 * task after its first delivery (outside the rendering update, which would deliver a change made in its microtasks in
 * the same frame).
 */
function observeSizes(id: string): Promise<void> {
  const sizes: number[] = [];
  (window as unknown as { __sizes: number[] }).__sizes = sizes;
  const target = document.getElementById(id);
  return new Promise((resolve) => {
    if (target === null) return;
    new ResizeObserver((entries) => {
      for (const entry of entries) sizes.push(Math.round(entry.borderBoxSize[0]?.inlineSize ?? 0));
      setTimeout(resolve, 0);
    }).observe(target);
  });
}
