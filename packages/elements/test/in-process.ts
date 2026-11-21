// The in-process driver of the shared scenario bodies (005 research.md R-11, T014): the `elements` project runs the
// bodies in Vitest's browser mode on the element source the test file imports, so Stryker's mutants of
// packages/elements/src/** are killed here. The page has the token stylesheet the generator makes from the current
// source (`css(source)`, its `@font-face` rules removed, so no font is requested) adopted on the document, and, where a
// scenario mounts with `base: true`, `@ocelle/styles`' base.css after it. The accessibility tree and forced colours
// go through the `axTree` and `emulateForcedColors` browser commands (vitest.config.ts, test/commands.ts). Console
// messages are recorded from each mount on; Lit's development build, which Vite resolves here, warns once at import,
// before any mount, so the console outcome of FR-016 on the built output is the fixture's (test/browser/).
// Since 009 (research.md R-17) every mount also adopts test/fixtures/frames.css, the one source of the tested frames,
// after the token and base sheets, and `viewport()` resizes the test's iframe through `page.viewport`.
//
// 012 (research.md R-11): keys, the mouse, one accessibility node, reduced motion and axe go through the `press`,
// `hover`, `pointer`, `axState`, `emulateReducedMotion` and `axe` commands; the event recorder and the other page reads
// are page-side.ts's functions, called here in the test's frame. The **navigation sink** is the last bubble-phase
// listener on `window` for `click` and `auxclick` (put back at the end after each recorder listener on `window`): for
// an activation of a link (an `a` or `area` with `href` on the event's composed path) it records whether it was already
// prevented, the button, the modifier flags and the `href` attribute, then prevents it, so the runner never navigates.
// 008 (research.md R-14, R-15): every mount also adopts the test delay stylesheet (fixtures/tooltip-delay.css), as the
// fixture pages link it. Keys (`inputPress`, operator decision C2) are real key presses through `userEvent` from `vitest/browser`; pointer and touch input
// go through the `pointerPath` and `touchTap` commands at points of this frame (test/commands.ts), reduced motion
// through `emulateReducedMotion`; what the page holds is read by the probe of scenarios/probe.ts, installed when this
// module loads, before any element of the test file attaches a shadow root.
/// <reference types="vite/client" />
import type { LitElement } from "lit";
import { vi } from "vitest";
import { commands, page, userEvent, utils } from "vitest/browser";
import baseText from "../../styles/src/base.css?raw";
import framesText from "./fixtures/frames.css?raw";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import { runningOf } from "./animations.ts";
import delayText from "./fixtures/tooltip-delay.css?raw";
import { layoutWait } from "./layout-wait.ts";
import { activeInnerOf, activePath, characterBoxes, clickElement, computedOf, copyElement, copySentinel, currentOf, dropSentinel, endOrder, focusElement, morphElement, preventNextEvent, recordEvents, resetPage, selectSentinel, selectShadowRun, sentinelId, shadowClientRects, startOrder, takeRecords } from "./page-side.ts";
import { decodePng } from "./pixels.ts";
import { heardTypes } from "./scenarios/driver.ts";
import type { Box, Driver, Drawing, ElementTarget, NavigationRecord, Paint, Part, Placement, Reading, Sheets, TreeNode } from "./scenarios/driver.ts";
import { probe } from "./scenarios/probe.ts";

function sheet(text: string): CSSStyleSheet {
  const made = new CSSStyleSheet();
  made.replaceSync(text);
  return made;
}

const tokens = sheet(css(source).replace(/@font-face\s*\{[^}]*\}/g, ""));
const base = sheet(baseText);
const frames = sheet(framesText);
const delay = sheet(delayText);
probe();

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id} on the page`);
  return found;
}

const nextFrame = (): Promise<unknown> => new Promise((resolve) => requestAnimationFrame(resolve));

/** Whether every `<iframe srcdoc>` of the page has loaded its document. */
function framesLoaded(): boolean {
  return [...document.querySelectorAll("iframe")].every((frame) => !frame.hasAttribute("srcdoc") || (frame.contentDocument?.URL === "about:srcdoc" && frame.contentDocument.readyState === "complete"));
}

/**
 * Waits two animation frames, then until every `ocelle-*` element of the page has rendered (009 research.md R-17, the
 * overflow-region contract's rule: a `ResizeObserver` delivery of the first frame and the update it requests are seen)
 * and every `<iframe srcdoc>` has loaded (a bounded poll of 1 000 ms, 008 R-15), then for a frame.
 */
async function settle(): Promise<void> {
  await nextFrame();
  await nextFrame();
  const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
  await Promise.all(elements.map((each) => (each as Partial<LitElement>).updateComplete ?? Promise.resolve(true)));
  for (const start = performance.now(); !framesLoaded(); ) {
    if (performance.now() - start > 1000) throw new Error("an <iframe srcdoc> did not load within 1 000 ms");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

/** The `userEvent.keyboard` text of one press of `key`, with Shift held when `shift`. */
function keyText(key: string, shift: boolean): string {
  const text = key === " " ? "[Space]" : `{${key}}`;
  return shift ? `{Shift>}${text}{/Shift}` : text;
}

/** The element of a target: the element with the id, or the first match of `inner` in its shadow root. */
function resolve(target: ElementTarget): HTMLElement {
  if (typeof target === "string") return element(target);
  const found = element(target.id).shadowRoot?.querySelector<HTMLElement>(target.inner);
  if (found === null || found === undefined) throw new Error(`no ${target.inner} in the shadow root of #${target.id}`);
  return found;
}

/** A key or chord (`Shift+Tab`, `Ctrl+ArrowRight`) in user-event's keyboard syntax, modifiers held around the key. */
function chordText(key: string): string {
  const parts = key.split("+").map((part) => (part === "Ctrl" ? "Control" : part));
  const pressed = parts.pop() ?? "";
  return `${parts.map((part) => `{${part}>}`).join("")}{${pressed}}${parts.reverse().map((part) => `{/${part}}`).join("")}`;
}

/** One level of the deep active element: its id, or its local name and classes. */
function describe(node: Element): string {
  return node.id !== "" ? node.id : [node.localName, ...node.classList].join(".");
}

/** The deep active element, each level from the document down through shadow roots, joined by " >> ". */
function deepActive(): string {
  const levels: string[] = [];
  let active: Element | null = document.activeElement;
  while (active !== null) {
    levels.push(describe(active));
    active = active.shadowRoot?.activeElement ?? null;
  }
  return levels.join(" >> ");
}

/** A frame record's reading of an element, as text. */
function reading(subject: HTMLElement, read: Reading): string {
  if ("property" in read) return String((subject as unknown as Record<string, unknown>)[read.property]);
  if ("computed" in read) return getComputedStyle(subject).getPropertyValue(read.computed);
  return String(subject.getAttribute(read.attribute));
}

/** The last keydown the window saw since the last mount (`lastKeyPrevented`). */
let lastKey: KeyboardEvent | undefined;
window.addEventListener(
  "keydown",
  (event) => {
    lastKey = event;
  },
  true,
);

/** The element matching `inner` in the shadow root of the element with `id`. */
function inShadow(id: string, inner: string): Element {
  const found = element(id).shadowRoot?.querySelector(inner);
  if (found === null || found === undefined) throw new Error(`no ${inner} in the shadow root of #${id}`);
  return found;
}

/** Waits as `settle` does, and also for every `ocelle-*` element in the shadow root of the element with `id`. */
async function settleShadow(id: string): Promise<void> {
  await settle();
  const elements = [...(element(id).shadowRoot?.querySelectorAll("*") ?? [])].filter((each) => each.localName.startsWith("ocelle-"));
  await Promise.all(elements.map((each) => (each as Partial<LitElement>).updateComplete ?? Promise.resolve(true)));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

const round = (value: number): number => Math.round(value * 1000) / 1000;

const absent: Box = { x: 0, y: 0, width: 0, height: 0, display: "absent" };

function attributes(of: Element): Record<string, string> {
  return Object.fromEntries([...of.attributes].map((attribute) => [attribute.name, attribute.value]));
}

/** Inflates zlib data with the browser's DecompressionStream (a PNG's IDAT stream is zlib, "deflate" here). */
async function inflate(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as Uint8Array<ArrayBuffer>]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const messages: string[] = [];
for (const method of ["log", "info", "warn", "error", "debug"] as const) {
  vi.spyOn(console, method).mockImplementation((...args: unknown[]) => {
    messages.push(`console.${method}: ${args.map(String).join(" ")}`);
  });
}
window.addEventListener("error", (event) => {
  messages.push(`error: ${event.message}`);
});

const navigations: NavigationRecord[] = [];

function sink(event: Event): void {
  const mouse = event as MouseEvent;
  const link = event.composedPath().find((node): node is Element => node instanceof Element && (node.localName === "a" || node.localName === "area") && node.hasAttribute("href"));
  if (link === undefined) return;
  navigations.push({
    type: event.type === "auxclick" ? "auxclick" : "click",
    defaultPrevented: event.defaultPrevented,
    button: mouse.button,
    altKey: mouse.altKey,
    ctrlKey: mouse.ctrlKey,
    metaKey: mouse.metaKey,
    shiftKey: mouse.shiftKey,
    href: link.getAttribute("href") ?? "",
  });
  event.preventDefault();
}

/** Puts the sink after every other listener of `window` for `click` and `auxclick`. */
function lastSink(): void {
  for (const type of ["click", "auxclick"]) {
    window.removeEventListener(type, sink);
    window.addEventListener(type, sink);
  }
}
lastSink();

/** The most Tab presses `tabOrder` makes before it stops. */
const maxSteps = 64;

/** The `id` of the element with one of `ids` that `node` is, or whose shadow tree holds it, or undefined. */
function recordedHost(node: unknown, ids: ReadonlySet<string>): string | undefined {
  for (let at = node instanceof Node ? node : null; at !== null; ) {
    if (at instanceof Element && ids.has(at.id)) return at.id;
    const root = at.getRootNode();
    at = root instanceof ShadowRoot ? root.host : null;
  }
  return undefined;
}

/** What `listen` installed: the records, and how to remove it. */
let listening: { readonly records: string[]; readonly stop: () => void } | undefined;

function listen(ids: readonly string[]): void {
  listening?.stop();
  const watched = new Set(ids);
  const records: string[] = [];
  const original = Object.getOwnPropertyDescriptor(EventTarget.prototype, "dispatchEvent")?.value as (this: EventTarget, event: Event) => boolean;
  EventTarget.prototype.dispatchEvent = function (this: EventTarget, event: Event): boolean {
    const id = recordedHost(this, watched);
    if (id !== undefined) records.push(`${id}: ${event.type}`);
    return original.call(this, event);
  };
  const capture = (event: Event): void => {
    const id = event.composedPath().map((node) => recordedHost(node, watched)).find((each) => each !== undefined);
    if (id !== undefined) records.push(`${id}: ${event.type}`);
  };
  for (const type of heardTypes) window.addEventListener(type, capture, true);
  listening = {
    records,
    stop: () => {
      EventTarget.prototype.dispatchEvent = original;
      for (const type of heardTypes) window.removeEventListener(type, capture, true);
    },
  };
}

/** The numbers `identities` gave the shadow nodes it has seen. */
const identities = new Map<Element, number>();

/** The number of `findText` calls so far: each navigates to a fragment of its own. */
let finds = 0;

/** Puts the copy sentinel on the clipboard with a user copy of a scratch field (020 phase 2, `copyShadow`). */
async function sentinelOnClipboard(): Promise<void> {
  selectSentinel(copySentinel);
  await userEvent.copy();
  dropSentinel();
}

/** The clipboard's `text/plain`, read from the `clipboardData` of a user paste into a scratch field. */
async function pastedText(): Promise<string> {
  const field = document.createElement("textarea");
  document.body.append(field);
  let pasted = "";
  field.addEventListener("paste", (event) => {
    pasted = event.clipboardData?.getData("text/plain") ?? "";
  });
  field.focus();
  await userEvent.paste();
  field.remove();
  getSelection()?.removeAllRanges();
  return pasted;
}

export function inProcessDriver(): Driver {
  return {
    mount: async (markup, options = {}) => {
      document.adoptedStyleSheets = options.base === true ? [tokens, base, frames, delay] : [tokens, frames, delay];
      messages.length = 0;
      navigations.length = 0;
      resetPage();
      lastSink();
      lastKey = undefined;
      document.documentElement.removeAttribute("data-theme");
      probe().reset();
      Reflect.deleteProperty(document, Symbol.for("ocelle.progress.sweepStart"));
      document.body.innerHTML = markup;
      await settle();
    },
    setProperty: async (id, name, value) => {
      (element(id) as unknown as Record<string, unknown>)[name] = value;
      await settle();
    },
    setAttribute: async (id, name, value) => {
      if (value === null) element(id).removeAttribute(name);
      else element(id).setAttribute(name, value);
      await settle();
    },
    call: async (id, name) => {
      const target = element(id) as unknown as Record<string, unknown>;
      const method = target[name];
      if (typeof method !== "function") throw new Error(`#${id} has no method ${name}`);
      (method as () => unknown).call(target);
      await settle();
    },
    attribute: (id, name) => Promise.resolve(element(id).getAttribute(name)),
    style: async (id, property, value) => {
      element(id).style.setProperty(property, value);
      await settle();
    },
    rules: async (rules) => {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet(rules)];
      await settle();
    },
    box: (id, inner) => {
      const host = element(id);
      const target = inner === undefined ? host : host.shadowRoot?.querySelector(inner);
      if (target === null || target === undefined) return Promise.resolve(absent);
      const rect = target.getBoundingClientRect();
      return Promise.resolve({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: getComputedStyle(target).display });
    },
    lines: (id) => Promise.resolve([...element(id).getClientRects()].map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }))),
    drawing: (id) => {
      const root = element(id).shadowRoot;
      if (root === null) return Promise.resolve<Drawing>({ children: ["#no-shadow-root"], svg: null });
      const svg = [...root.children].find((child) => child.localName === "svg") ?? null;
      return Promise.resolve<Drawing>({
        children: [...root.children].map((child) => child.localName),
        svg: svg === null ? null : { attributes: attributes(svg), parts: [...svg.children].map((part) => ({ name: part.localName, attributes: attributes(part) })) },
      });
    },
    elements: (id) => {
      const root = element(id).shadowRoot;
      return Promise.resolve<Part[]>(root === null ? [] : [...root.querySelectorAll("*")].map((part) => ({ name: part.localName, attributes: attributes(part) })));
    },
    geometry: (id) => {
      const svg = element(id).shadowRoot?.querySelector("svg");
      const shapes = svg === null || svg === undefined ? [] : [...svg.children];
      return Promise.resolve(
        shapes.map((shape) => {
          const box = (shape as SVGGraphicsElement).getBBox();
          return { x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height) };
        }),
      );
    },
    dir: async (id, direction) => {
      element(id).setAttribute("dir", direction);
      await settle();
    },
    pixels: async (id) => {
      const base64 = await page.screenshot({ element: element(id), save: false });
      return decodePng(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)), inflate);
    },
    paints: (id) => {
      const svg = element(id).shadowRoot?.querySelector("svg");
      if (svg === null || svg === undefined) return Promise.resolve<Paint[]>([]);
      return Promise.resolve([svg, ...svg.querySelectorAll("*")].map((part) => ({ name: part.localName, stroke: getComputedStyle(part).stroke, fill: getComputedStyle(part).fill })));
    },
    placement: (id) => {
      const host = element(id);
      const svg = host.shadowRoot?.querySelector("svg");
      const matrix = svg?.getScreenCTM();
      if (matrix === null || matrix === undefined) return Promise.resolve<Placement>({ scaleX: 0, scaleY: 0, offsetX: 0, offsetY: 0 });
      const rect = host.getBoundingClientRect();
      return Promise.resolve({ scaleX: round(matrix.a), scaleY: round(matrix.d), offsetX: round(matrix.e - rect.x), offsetY: round(matrix.f - rect.y) });
    },
    ownPlacement: (id) => {
      const svg = element(id) as unknown as SVGSVGElement;
      const matrix = svg.getScreenCTM();
      if (matrix === null) return Promise.resolve<Placement>({ scaleX: 0, scaleY: 0, offsetX: 0, offsetY: 0 });
      const rect = svg.getBoundingClientRect();
      return Promise.resolve({ scaleX: round(matrix.a), scaleY: round(matrix.d), offsetX: round(matrix.e - rect.x), offsetY: round(matrix.f - rect.y) });
    },
    computed: (id, property, inner) => Promise.resolve(computedOf({ id, property, inner })),
    computedOf: (target, property) => Promise.resolve(getComputedStyle(resolve(target)).getPropertyValue(property)),
    resolveColour: (value) => {
      const colourProbe = document.createElement("span");
      probe().ignore(colourProbe);
      colourProbe.style.color = value;
      document.body.append(colourProbe);
      const colour = getComputedStyle(colourProbe).color;
      colourProbe.remove();
      return Promise.resolve(colour);
    },
    ax: (id) => commands.axTree(id),
    axSubtree: (id) => commands.axTree(id, "subtree"),
    theme: async (theme) => {
      if (theme === null) document.documentElement.removeAttribute("data-theme");
      else document.documentElement.dataset.theme = theme;
      await settle();
    },
    forcedColors: async (mode, palette) => {
      await commands.emulateForcedColors(mode, palette);
      await settle();
    },
    sheets: (selector) => {
      const roots = [...document.querySelectorAll(selector)].map((each) => each.shadowRoot);
      const adopted = roots.map((root) => root?.adoptedStyleSheets ?? []);
      return Promise.resolve<Sheets>({
        elements: roots.length,
        perRoot: [...new Set(adopted.map((list) => list.length))],
        distinct: new Set(adopted.flat()).size,
        styleElements: roots.reduce((sum, root) => sum + (root?.querySelectorAll("style").length ?? 0), 0),
      });
    },
    messages: () => Promise.resolve([...messages]),
    focus: (id) => {
      focusElement(id);
      return Promise.resolve();
    },
    press: (key, modifiers) => commands.press(key, modifiers),
    click: async (id, options) => {
      await commands.pointer("click", id, options);
      await settle();
    },
    callClick: async (id) => {
      clickElement(id);
      await settle();
    },
    hover: async (id, options) => {
      await commands.hover(id, options?.inner);
      await settle();
    },
    pointerDown: async (id, options) => {
      await commands.pointer("down", id, options);
      await settle();
    },
    pointerUp: async (id) => {
      await commands.pointer("up", id);
      await settle();
    },
    tabOrder: async (options = {}) => {
      const reverse = options.reverse === true;
      const order: string[][] = [];
      startOrder(reverse);
      for (let step = 0; step < maxSteps; step += 1) {
        await commands.press("Tab", reverse ? ["Shift"] : []);
        const path = activePath();
        if (path.length === 0 || path[0] === `span#${sentinelId}` || JSON.stringify(path) === JSON.stringify(order[0])) break;
        order.push(path);
      }
      endOrder();
      return order;
    },
    activeInner: (id) => Promise.resolve(activeInnerOf(id)),
    events: (id, types) => {
      recordEvents({ id, types });
      lastSink();
      return Promise.resolve();
    },
    takeEvents: () => Promise.resolve(takeRecords()),
    preventNext: (type) => {
      preventNextEvent(type);
      return Promise.resolve();
    },
    navigations: () => Promise.resolve([...navigations]),
    reducedMotion: async (mode) => {
      await commands.emulateReducedMotion(mode);
      await settle();
    },
    axState: (id, inner) => commands.axState(id, inner),
    current: (id, inner) => Promise.resolve(currentOf({ id, inner })),
    axe: (scope) => commands.axe(scope),
    copy: async (id, via, into) => {
      copyElement({ id, via, into });
      await settle();
    },
    morph: async (id, markup) => {
      morphElement({ id, markup });
      await settle();
    },
    inputPress: async (key, options = {}) => {
      await userEvent.keyboard(keyText(key, options.shift === true));
      await settle();
    },
    inputHover: async (id, inner) => {
      await commands.pointerPath([id === null ? { x: 0, y: 0 } : probe().centre(id, inner)]);
      await settle();
    },
    inputClick: async (id, inner, options = {}) => {
      await commands.pointerPath([{ ...probe().centre(id, inner), down: true, up: true, button: options.button ?? "left" }]);
      await settle();
    },
    pointer: async (path) => {
      await commands.pointerPath(path);
      await settle();
    },
    touchTap: async (id, inner) => {
      const { x, y } = probe().centre(id, inner);
      await commands.touchTap(x, y);
      await settle();
    },
    focusPath: () => Promise.resolve(probe().focusPath()),
    focusVisible: (id, inner) => Promise.resolve(probe().focusVisible(id, inner)),
    viewportSize: () => Promise.resolve({ width: window.innerWidth, height: window.innerHeight }),
    device: () => Promise.resolve(probe().device()),
    record: (id, names) => {
      probe().record(id, names);
      return Promise.resolve();
    },
    recorded: () => Promise.resolve(probe().recorded()),
    ownAnimations: (id, inner) => Promise.resolve(probe().animations(id, inner)),
    topLayer: () => Promise.resolve(probe().topLayer()),
    styleAttributes: () => Promise.resolve(probe().styleAttributes()),
    styleElements: () => Promise.resolve(probe().styleElements()),
    append: async (id, markup) => {
      element(id).insertAdjacentHTML("beforeend", markup);
      await settle();
    },
    remove: async (id) => {
      element(id).remove();
      await settle();
    },
    textData: async (id, index, data) => {
      const text = [...element(id).childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)[index];
      if (text === undefined) throw new Error(`#${id} has no text node ${String(index)}`);
      (text as Text).data = data;
      await settle();
    },
    tab: async (shift = false) => {
      await userEvent.tab({ shift });
      await settle();
    },
    activeElement: () => commands.activeElement(),
    viewport: async (width, height) => {
      await page.viewport(width, height);
      await settle();
    },
    chord: async (key) => {
      await userEvent.keyboard(chordText(key));
      await settle();
    },
    clickAt: async (target, point) => {
      const rect = resolve(target).getBoundingClientRect();
      const root = document.documentElement.getBoundingClientRect();
      await userEvent.click(document.documentElement, { position: { x: rect.left - root.left + point.x, y: rect.top - root.top + point.y }, force: true });
      await settle();
    },
    wheel: async (target, deltaX) => {
      await userEvent.wheel(resolve(target), { delta: { x: deltaX } });
      await settle();
    },
    deepActive: () => Promise.resolve(deepActive()),
    tabWalk: async (from, to, backward = false) => {
      element(from).focus();
      const walked: string[] = [];
      for (let step = 0; step < 40 && walked.at(-1) !== to; step++) {
        await userEvent.keyboard(chordText(backward ? "Shift+Tab" : "Tab"));
        walked.push(deepActive());
      }
      await settle();
      return walked;
    },
    focusTarget: async (target) => {
      resolve(target).focus();
      await settle();
    },
    scrollLeft: (target) => Promise.resolve(resolve(target).scrollLeft),
    setScrollLeft: async (target, value) => {
      resolve(target).scrollTo({ left: value, behavior: "instant" });
      await settle();
    },
    lastKeyPrevented: () => Promise.resolve(lastKey?.defaultPrevented ?? false),
    frameRecord: async (target, read) => {
      const subject = resolve(target);
      const source = read.of === undefined ? subject : resolve(read.of);
      const record = [reading(source, read)];
      const onKey = (): void => {
        record.push("keydown");
      };
      window.addEventListener("keydown", onKey, true);
      const observer = new ResizeObserver(() => record.push(`resize: ${reading(source, read)}`));
      observer.observe(subject, { box: "border-box" });
      let frame = 0;
      const loop = (): void => {
        record.push(reading(source, read));
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      await nextFrame();
      await nextFrame();
      return {
        stop: async () => {
          await settle();
          cancelAnimationFrame(frame);
          observer.disconnect();
          window.removeEventListener("keydown", onKey, true);
          return record;
        },
      };
    },
    settle,
    size: async (id, inline, block) => {
      const style = element(id).style;
      for (const [property, value] of [["inline-size", inline], ["block-size", block]] as const) {
        if (value === null) style.removeProperty(property);
        else style.setProperty(property, `${String(value)}px`);
      }
      await settle();
    },
    scrollWidth: () => commands.scrollWidth(),
    textBoxes: (id) => commands.textBoxes(id),
    listen: (ids) => {
      listen(ids);
      return Promise.resolve();
    },
    heard: () => {
      const records = listening?.records ?? [];
      listening?.stop();
      listening = undefined;
      return Promise.resolve([...records]);
    },
    identities: (id) => {
      const root = element(id).shadowRoot;
      if (root === null) return Promise.resolve([]);
      return Promise.resolve(
        [...root.querySelectorAll("*")].map((node) => {
          const known = identities.get(node);
          if (known !== undefined) return known;
          identities.set(node, identities.size + 1);
          return identities.size;
        }),
      );
    },
    shadow: async (id, markup) => {
      element(id).attachShadow({ mode: "open" }).innerHTML = markup;
      await settleShadow(id);
    },
    shadowAppend: async (id, inner, markup) => {
      inShadow(id, inner).insertAdjacentHTML("beforeend", markup);
      await settleShadow(id);
    },
    shadowAttribute: async (id, inner, name, value) => {
      if (value === null) inShadow(id, inner).removeAttribute(name);
      else inShadow(id, inner).setAttribute(name, value);
      await settleShadow(id);
    },
    shadowComputed: (id, inner, property) => Promise.resolve(getComputedStyle(inShadow(id, inner)).getPropertyValue(property)),
    module: async (code) => {
      // A blob URL is of the test page's origin; this page has no CSP.
      const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
      try {
        await import(/* @vite-ignore */ url);
      } finally {
        URL.revokeObjectURL(url);
      }
      await settle();
    },
    layout: (id) => layoutWait(id),
    clipboardCopy: async (id) => {
      const range = document.createRange();
      range.selectNodeContents(element(id));
      const selection = getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      await userEvent.copy();
      const field = document.createElement("textarea");
      document.body.append(field);
      let pasted = "";
      field.addEventListener("paste", (event) => {
        pasted = event.clipboardData?.getData("text/plain") ?? "";
      });
      field.focus();
      await userEvent.paste();
      field.remove();
      getSelection()?.removeAllRanges();
      return pasted;
    },
    move: async (id, parentId) => {
      (parentId === null ? document.body : element(parentId)).append(element(id));
      await settle();
    },
    text: async (id, value) => {
      const node = [...element(id).childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
      if (node === undefined) throw new Error(`no text node in #${id}`);
      (node as Text).data = value;
      await settle();
    },
    open: async (id) => {
      const target = element(id);
      if (target instanceof HTMLDialogElement) target.showModal();
      else target.showPopover();
      await settle();
    },
    boxes: (id, inner) =>
      Promise.resolve(
        [...(element(id).shadowRoot?.querySelectorAll(inner) ?? [])].map((each) => {
          const rect = each.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: getComputedStyle(each).display };
        }),
      ),
    styles: (id, inner, properties) => {
      const host = element(id);
      const targets = inner === null ? [host] : [...(host.shadowRoot?.querySelectorAll(inner) ?? [])];
      return Promise.resolve(targets.map((each) => Object.fromEntries(properties.map((property) => [property, getComputedStyle(each).getPropertyValue(property)]))));
    },
    structure: (id, inner) => {
      const root = element(id).shadowRoot;
      const start = inner === null ? root : (root?.querySelector(inner) ?? null);
      const tree = (of: Element | ShadowRoot): TreeNode[] => [...of.children].map((child) => ({ name: child.localName, children: tree(child) }));
      return Promise.resolve(start === null ? [] : tree(start));
    },
    pressTab: async () => {
      await userEvent.tab();
      await settle();
    },
    focused: () => {
      let current = document.activeElement;
      while (current?.shadowRoot?.activeElement !== null && current?.shadowRoot?.activeElement !== undefined) current = current.shadowRoot.activeElement;
      if (current === null || current === document.body) return Promise.resolve(null);
      return Promise.resolve(current.id === "" ? `<${current.localName}>` : current.id);
    },
    animations: (id) => Promise.resolve(runningOf(id)),
    frames: async (count) => {
      for (let frame = 0; frame < count; frame++) await new Promise((resolve) => requestAnimationFrame(resolve));
    },
    replace: async (id, markup) => {
      const template = document.createElement("template");
      template.innerHTML = markup;
      element(id).replaceWith(template.content);
      await settle();
    },
      changeAttributes: async (id, changes) => {
      const target = element(id);
      for (const [name, value] of changes) {
        if (value === null) target.removeAttribute(name);
        else target.setAttribute(name, value);
      }
      await settle();
    },
    property: (id, name) => Promise.resolve((element(id) as unknown as Record<string, unknown>)[name]),
    textOf: (id, inner) => Promise.resolve(element(id).shadowRoot?.querySelector(inner)?.textContent ?? null),
    rendered: (id) => {
      const target = element(id);
      const range = document.createRange();
      range.selectNodeContents(target);
      return Promise.resolve({ innerText: target.innerText, rects: range.getClientRects().length });
    },
    dispatched: async (id, during) => {
      const target = element(id);
      const seen: string[] = [];
      const native = Object.getOwnPropertyDescriptor(EventTarget.prototype, "dispatchEvent");
      if (native === undefined) throw new Error("no EventTarget.prototype.dispatchEvent");
      const dispatch = native.value as (this: EventTarget, event: Event) => boolean;
      Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
        ...native,
        value: function (this: EventTarget, event: Event): boolean {
          if (this === target || (this instanceof Node && this.getRootNode() === target.shadowRoot)) seen.push(event.type);
          return dispatch.call(this, event);
        },
      });
      try {
        await during();
      } finally {
        Object.defineProperty(EventTarget.prototype, "dispatchEvent", native);
      }
      return seen;
    },
    findText: async (word) => {
      finds += 1;
      const url = location.href.replace(/#.*$/, "");
      location.href = `#ocelle-find-${String(finds)}:~:text=${encodeURIComponent(word)}`;
      await settle();
      await settle();
      // The test's frame is found by its URL (the AX commands, test/commands.ts): the fragment is taken off again,
      // with no navigation.
      history.replaceState(history.state, "", url);
    },
    setProperties: (id, name, values) => {
      const target = element(id) as unknown as Record<string, unknown>;
      for (const value of values) target[name] = value;
      return Promise.resolve();
    },
    visible: (id) => Promise.resolve(element(id).checkVisibility()),
    reflected: (id, inner, property) => {
      const value = (inShadow(id, inner) as unknown as Record<string, unknown>)[property] as readonly Element[] | null | undefined;
      return Promise.resolve(value === null || value === undefined ? null : value.map(describe));
    },
    copyShadow: async (id, inner) => {
      await sentinelOnClipboard();
      await userEvent.tripleClick(inShadow(id, inner), { position: { x: 2, y: 2 } });
      await userEvent.copy();
      return await pastedText();
    },
    copyShadowRun: async (id, inner, from, to) => {
      await sentinelOnClipboard();
      selectShadowRun({ id, inner, from, to });
      await userEvent.copy();
      return await pastedText();
    },
    ariaSnapshot: (id, inner) => Promise.resolve(utils.aria.renderAriaTree(utils.aria.generateAriaTree(inShadow(id, inner)))),
    clientRects: (id, inner) => Promise.resolve(shadowClientRects({ id, inner })),
    characters: (id, inner) => Promise.resolve(characterBoxes({ id, inner })),
  };
}
