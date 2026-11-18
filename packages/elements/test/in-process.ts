// The in-process driver of the shared scenario bodies (005 research.md R-11, T014): the in-process element projects
// (`elements`, `elements-timing` for the timing files since specs/010-feedback-forms operator round 7, and
// `elements-touch`) run the bodies in Vitest's browser mode on the element source the test file imports, so Stryker's
// mutants of packages/elements/src/** are killed here. The page has the token stylesheet the generator makes from the
// current source (`css(source)`, its `@font-face` rules removed, so no font is requested) adopted on the document, and,
// where a scenario mounts with `base: true`, `@ocelle/styles`' base.css after it. The accessibility tree and forced
// colours go through the `axTree` and `emulateForcedColors` browser commands (vitest.config.ts, test/commands.ts).
// Console messages are recorded from each mount on; Lit's development build, which Vite resolves here, warns once at
// import, before any mount, so the console outcome of FR-016 on the built output is the fixture's (test/browser/).
// Since 009 (research.md R-17) every mount also adopts test/fixtures/frames.css, the one source of the tested frames,
// after the token and base sheets, and `viewport()` resizes the test's iframe through `page.viewport`.
//
// 008 (research.md R-14, R-15): every mount also adopts the test delay stylesheet (fixtures/tooltip-delay.css), as the
// fixture pages link it. Keys are real key presses through `userEvent` from `vitest/browser`; pointer and touch input
// go through the `pointerPath` and `touchTap` commands at points of this frame (test/commands.ts), reduced motion
// through `emulateReducedMotion`; what the page holds is read by the probe of scenarios/probe.ts, installed when this
// module loads, before any element of the test file attaches a shadow root.
/// <reference types="vite/client" />
import type { LitElement } from "lit";
import { vi } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import baseText from "../../styles/src/base.css?raw";
import framesText from "./fixtures/frames.css?raw";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import { define } from "../src/define.ts";
import { setAnnouncerTimingForTests } from "../src/live.ts";
import type { AnnouncerTiming } from "../src/live.ts";
import type { Delays, Snapshot } from "./live-reading.ts";
import { runningOf } from "./animations.ts";
import delayText from "./fixtures/tooltip-delay.css?raw";
import { layoutWait } from "./layout-wait.ts";
import { decodePng } from "./pixels.ts";
import { heardTypes } from "./scenarios/driver.ts";
import type { Box, Drawing, Entries, Heard, InProcessDriver, InsertHow, Operation, Paint, Part, Placement, Reading, Sheets, Target, TreeNode, Validity } from "./scenarios/driver.ts";
import { probe } from "./scenarios/probe.ts";

/**
 * The one timing constant of the in-process run (specs/010-feedback-forms research R-09, contracts/testing.md
 * § Timing; chosen in T002, reviews/phase-1/spike.md § Timing): the serialisation delay `D` for both load states and the hold `H`, in milliseconds. The
 * capture takes its `D` from it (`delays`); from phase 2 on (T020a) the element takes it through
 * `setAnnouncerTimingForTests` of src/live.ts. `D` is at least two rendering updates long and below Chromium's 150 ms.
 */
export const timing = { delayLoaded: 50, delayLoading: 50, hold: 500 } as const;

/** The capture's delays in process: `D` of `timing`. */
export const delays: Delays = { loaded: timing.delayLoaded, loading: timing.delayLoading };

let first: AnnouncerTiming | undefined;

/**
 * Gives the element the in-process timing (contracts/testing.md § Timing; T020a): `setAnnouncerTimingForTests` of
 * src/live.ts with `timing`, the constant the capture's `D` comes from, when this module is imported and before each
 * scenario (`mount`). The timing its first call in the test file replaced is kept.
 */
function useTestTiming(): void {
  const replaced = setAnnouncerTimingForTests(timing);
  first ??= replaced;
}
useTestTiming();

/**
 * The timing the first `setAnnouncerTimingForTests` call of this test file replaced (the shipped `announcerDefaults`),
 * read-only, for test/live-timing.test.ts (contracts/testing.md § Timing; T014).
 */
export function firstTimingReturn(): AnnouncerTiming | undefined {
  return first;
}

/**
 * Runs `run` with the timing `next` in force and gives the element back the timing it replaced afterwards, for the
 * fake-clock rule case of the "empty-state start" plant row (test/plants.test.ts, test/announcer-rules.ts; phase 2
 * stop 2, T025a), which needs the two `D` values of the shipped timing where the test constant has one.
 */
export function withTiming<T>(next: AnnouncerTiming, run: () => T): T {
  const replaced = setAnnouncerTimingForTests(next);
  try {
    return run();
  } finally {
    setAnnouncerTimingForTests(replaced);
  }
}

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

/**
 * Waits until every `ocelle-*` element of the page has rendered, then for a frame: the wait of the form and announcement
 * steps of specs/010-feedback-forms (`insert`, `batch`, `type`, `pressOn`, ...), as it was before 009's two-frame
 * `settle`. Their scenarios time a change in fractions of the test W = 100 ms from the step's end (`after`), so the
 * step returns one rendering update after the change, not three (the landing's second merge of main).
 */
async function updated(): Promise<void> {
  const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
  await Promise.all(elements.map((each) => (each as Partial<LitElement>).updateComplete ?? Promise.resolve(true)));
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

/** The `userEvent.keyboard` text of one press of `key`, with Shift held when `shift`. */
function keyText(key: string, shift: boolean): string {
  const text = key === " " ? "[Space]" : `{${key}}`;
  return shift ? `{Shift>}${text}{/Shift}` : text;
}

/** The element of a target: the element with the id, or the first match of `inner` in its shadow root. */
function resolve(target: Target): HTMLElement {
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

/** The submissions recorded since the last `mount`, by form id (a capture-phase listener that prevents the unload). */
const submissions = new Map<string, Entries>();
document.addEventListener(
  "submit",
  (event) => {
    const form = event.target as HTMLFormElement;
    const { submitter } = event;
    const data = submitter === null ? new FormData(form) : new FormData(form, submitter);
    submissions.set(form.id, [...data].map(([name, value]) => [name, typeof value === "string" ? value : value.name] as const));
    event.preventDefault();
  },
  true,
);

function form(id: string): HTMLFormElement {
  const found = element(id);
  if (!(found instanceof HTMLFormElement)) throw new Error(`#${id} is not a form`);
  return found;
}

function entries(data: FormData): Entries {
  return [...data].map(([name, value]) => [name, typeof value === "string" ? value : value.name] as const);
}

/** A task of its own after a `MessageChannel` round trip, then one rendering update. */
async function laterTask(): Promise<void> {
  await new Promise<void>((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(0);
  });
  await new Promise((resolve) => requestAnimationFrame(resolve));
}

/** The elements of `markup`, built with `document.createElement` and their attributes and children set. */
function built(markup: string): Node[] {
  const parsed = document.createElement("template");
  parsed.innerHTML = markup;
  const copy = (node: Node): Node => {
    if (node instanceof Element) {
      const made = document.createElement(node.localName);
      for (const attribute of node.attributes) made.setAttribute(attribute.name, attribute.value);
      for (const child of node.childNodes) made.append(copy(child));
      return made;
    }
    return document.createTextNode(node.textContent ?? "");
  };
  return [...parsed.content.childNodes].map(copy);
}

/** The keyboard syntax of `text` typed as it is (`{` and `[` doubled). */
const typed = (text: string): string => text.replace(/[{[]/g, (char) => char + char);

/**
 * The keyboard syntax of a key name, a chord such as `Shift+Tab` held down around its last key (specs/010-feedback-forms
 * phase 3).
 */
function keys(key: string): string {
  const parts = key.split("+");
  const last = parts.pop() ?? key;
  return `${parts.map((held) => `{${held}>}`).join("")}{${last}}${parts.reverse().map((held) => `{/${held}}`).join("")}`;
}

/** The events `listenFor` heard, and the listeners to remove at the next `mount`. */
const heardList: Heard[] = [];
const listeners: (() => void)[] = [];

/** The id of `target`, or its local name without one. */
function nameOf(target: EventTarget | null): string {
  if (!(target instanceof Element)) return "";
  return target.id === "" ? target.localName : target.id;
}

const noValidity = { valid: false, valueMissing: false, typeMismatch: false, patternMismatch: false, tooLong: false, tooShort: false, rangeUnderflow: false, rangeOverflow: false, stepMismatch: false, badInput: false, customError: false } as ValidityState;

/** The validity of `target` as the driver reports it. */
function validityOf(target: Element): Validity {
  const control = target as unknown as { validity?: ValidityState; validationMessage?: string; willValidate?: boolean };
  // An element without a validity (one not upgraded, say) reads as no flag set, no message and not validated.
  const validity = control.validity ?? noValidity;
  return {
    valid: validity.valid,
    valueMissing: validity.valueMissing,
    typeMismatch: validity.typeMismatch,
    patternMismatch: validity.patternMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    rangeUnderflow: validity.rangeUnderflow,
    rangeOverflow: validity.rangeOverflow,
    stepMismatch: validity.stepMismatch,
    badInput: validity.badInput,
    customError: validity.customError,
    message: control.validationMessage ?? "",
    willValidate: control.willValidate ?? false,
  };
}

/** The ids a property value holds: an element's, each item's of a list, none for null or undefined. */
function idsOf(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (value instanceof Element) return [value.id];
  return [...(value as Iterable<Element>)].map((each) => each.id);
}

/** Elements a `batch` `remove` took out of the page, by id, for a later `move`. */
const removed = new Map<string, Element>();

/** The element with `id` in the page, or one a `remove` took out. */
function found(id: string): Element {
  return document.getElementById(id) ?? removed.get(id) ?? element(id);
}

/** The first child of `of`, which a `data` operation requires to be a text node. */
function firstText(of: Element): Text {
  const first = of.firstChild;
  if (!(first instanceof Text)) throw new Error(`data: #${of.id} has no text node first`);
  return first;
}

/** One `batch` operation, in the page's current task. */
function operate(operation: Operation): void {
  if (operation.op === "insert") element(operation.container).insertAdjacentHTML("beforeend", operation.markup);
  else if (operation.op === "text") found(operation.id).textContent = operation.text;
  else if (operation.op === "data") firstText(found(operation.id)).data = operation.data;
  else if (operation.op === "attribute") {
    if (operation.value === null) found(operation.id).removeAttribute(operation.name);
    else found(operation.id).setAttribute(operation.name, operation.value);
  } else if (operation.op === "property") (found(operation.id) as unknown as Record<string, unknown>)[operation.name] = operation.value;
  else if (operation.op === "move") element(operation.to).append(found(operation.id));
  else if (operation.op === "remove") {
    const target = found(operation.id);
    removed.set(operation.id, target);
    target.remove();
  } else if (operation.op === "reset") (found(operation.id) as HTMLFormElement).reset();
  else (found(operation.id) as HTMLElement).focus();
}

/** A property value as the driver reports it: a string, number, boolean or null; anything else as null. */
function plain(value: unknown): string | number | boolean | null {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null;
}

/** The content box of `target`: its border box less its borders and padding. */
function contentOf(target: Element): { x: number; y: number; width: number; height: number } {
  const rect = target.getBoundingClientRect();
  const style = getComputedStyle(target);
  const px = (property: string): number => Number.parseFloat(style.getPropertyValue(property));
  const left = px("border-left-width") + px("padding-left");
  const top = px("border-top-width") + px("padding-top");
  return {
    x: rect.x + left,
    y: rect.y + top,
    width: rect.width - left - px("padding-right") - px("border-right-width"),
    height: rect.height - top - px("padding-bottom") - px("border-bottom-width"),
  };
}

let fresh = 0;
let readyState: { mockRestore: () => void } | undefined;

function restoreReadyState(): void {
  readyState?.mockRestore();
  readyState = undefined;
}
export function inProcessDriver(): InProcessDriver {
  let lastEnd = performance.now();
  let last: readonly Snapshot[] = [];
  let keyed = false;
  const driver: InProcessDriver = {
    mount: async (markup, options = {}) => {
      useTestTiming();
      restoreReadyState();
      for (const stop of listeners.splice(0)) stop();
      heardList.length = 0;
      removed.clear();
      submissions.clear();
      keyed = false;
      document.adoptedStyleSheets = options.base === true ? [tokens, base, frames, delay] : [tokens, frames, delay];
      messages.length = 0;
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
    computed: (target, property) => Promise.resolve(getComputedStyle(resolve(target)).getPropertyValue(property)),
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
    liveCapture: {
      start: (containerId) => commands.liveStart(containerId, delays),
      stop: async (options) => {
        last = await commands.liveStop(options);
        return [...last];
      },
    },
    insert: async (containerId, markup, how: InsertHow) => {
      const container = element(containerId);
      if (how === "innerHTML") container.innerHTML = markup;
      else if (how === "template") {
        const template = document.createElement("template");
        template.innerHTML = markup;
        container.append(template.content.cloneNode(true));
      } else if (how === "domparser") {
        const parsed = new DOMParser().parseFromString(`<!doctype html><body>${markup}`, "text/html");
        container.append(...[...parsed.body.childNodes].map((node) => document.adoptNode(node)));
      } else container.append(...built(markup));
      await updated();
    },
    laterTask,
    insertInteractive: async (containerId, markup) => {
      await driver.liveCapture.start(containerId);
      await driver.readyState("interactive");
      const at = performance.now();
      element(containerId).innerHTML = markup;
      await updated();
      return at;
    },
    after: async (ms) => {
      const from = lastEnd;
      while (performance.now() < from + ms) await new Promise((resolve) => setTimeout(resolve, from + ms - performance.now()));
      return performance.now() - from;
    },
    W: { loaded: 2 * timing.delayLoaded, loading: 2 * timing.delayLoading },
    H: timing.hold,
    hostRole: (id) => Promise.resolve(last.at(-1)?.hosts.find((host) => host.host === id)?.role ?? "none"),
    // The phase 2 steps (specs/010-feedback-forms T011).
    batch: async (operations) => {
      for (const operation of operations) operate(operation);
      await updated();
    },
    property: (id, name) => {
      const value = (element(id) as unknown as Record<string, unknown>)[name];
      return Promise.resolve(value === undefined ? undefined : plain(value));
    },
    computedIn: (id, inner, property) => {
      const target = element(id).shadowRoot?.querySelector(inner);
      return Promise.resolve(target === null || target === undefined ? "" : getComputedStyle(target).getPropertyValue(property));
    },
    contentBox: (id, inner) => {
      const target = element(id).shadowRoot?.querySelector(inner);
      return Promise.resolve(target === null || target === undefined ? { x: 0, y: 0, width: 0, height: 0 } : contentOf(target));
    },
    firstLoad: async (containerId, markup, tag) => {
      await driver.registerFirstLoad(containerId, markup, customElements.get(tag) ?? HTMLElement);
    },
    defineSecond: (tag) => {
      define(tag, class extends HTMLElement {});
      return Promise.resolve();
    },
    formData: (formId) => Promise.resolve(entries(new FormData(form(formId)))),
    submit: async (formId) => {
      const target = form(formId);
      if (!keyed) {
        const submitter = target.querySelector<HTMLElement>("button:not([type]), button[type=submit], input[type=submit]");
        if (submitter === null) target.requestSubmit();
        else submitter.click();
      }
      keyed = false;
      await laterTask();
      const submitted = submissions.get(formId) ?? null;
      submissions.delete(formId);
      return submitted;
    },
    reset: async (formId) => {
      form(formId).reset();
      await updated();
    },
    type: async (id, text) => {
      element(id).focus();
      await userEvent.keyboard(typed(text));
      await updated();
    },
    pressOn: async (id, key) => {
      element(id).focus();
      keyed = true;
      await userEvent.keyboard(keys(key));
      await updated();
    },
    blur: async () => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      (active as HTMLElement | null)?.blur();
      await updated();
    },
    clickPoint: async (id, at) => {
      // Playwright's position is from the padding box; `at` is from the border box.
      const target = element(id);
      await userEvent.click(target, { position: { x: at.x - target.clientLeft, y: at.y - target.clientTop } });
      await updated();
    },
    focusChain: () => {
      const path: string[] = [];
      let active: Element | null = document.activeElement;
      while (active !== null && active !== document.body) {
        path.push(active.id === "" ? active.localName : `${active.localName}#${active.id}`);
        active = active.shadowRoot?.activeElement ?? null;
      }
      return Promise.resolve(path);
    },
    registerFirstLoad: async (containerId, markup, base) => {
      fresh += 1;
      const tag = `ocelle-first-load-${String(fresh)}-${String(Math.round(performance.now()))}`;
      element(containerId).innerHTML = markup.replaceAll("ocelle-first-load", tag);
      await driver.liveCapture.start(containerId);
      define(tag, class extends (base as typeof HTMLElement) {});
      await updated();
      return tag;
    },
    readyState: (value) => {
      restoreReadyState();
      if (value !== null) readyState = vi.spyOn(document, "readyState", "get").mockReturnValue(value);
      return Promise.resolve();
    },
    // The phase 3 steps (specs/010-feedback-forms T031 to T033).
    axDetails: (id) => commands.axTree(id, "details"),
    listenFor: (ids, types) => {
      for (const id of ids) {
        const target = element(id);
        for (const type of types) {
          const listener = (event: Event): void => {
            const detail = (event as CustomEvent<unknown>).detail;
            heardList.push({
              type: event.type,
              at: id,
              target: nameOf(event.target),
              value: plain((target as unknown as Record<string, unknown>).value),
              detail: detail === undefined || detail === null ? null : structuredClone(detail),
              bubbles: event.bubbles,
              composed: event.composed,
            });
          };
          target.addEventListener(type, listener);
          listeners.push(() => {
            target.removeEventListener(type, listener);
          });
        }
      }
      return Promise.resolve();
    },
    heardEvents: () => Promise.resolve(heardList.splice(0)),
    validity: (id) => Promise.resolve(validityOf(element(id))),
    ids: (id, name) => Promise.resolve(idsOf((element(id) as unknown as Record<string, unknown>)[name])),
    typeOf: (id, name) => Promise.resolve(typeof (element(id) as unknown as Record<string, unknown>)[name]),
    has: (id, name) => Promise.resolve(name in element(id)),
    call: async (id, method, ...args) => {
      const target = element(id) as unknown as Record<string, unknown>;
      const callee = target[method];
      if (typeof callee !== "function") throw new Error(`call: #${id} has no method ${method}`);
      const result: unknown = Reflect.apply(callee, target, args);
      await settle();
      return plain(result);
    },
    propertyIn: (id, inner, name) => {
      const target = element(id).shadowRoot?.querySelector(inner);
      return Promise.resolve(target === null || target === undefined ? null : plain((target as unknown as Record<string, unknown>)[name]));
    },
    pseudoIn: (id, inner, pseudo, property) => {
      const target = element(id).shadowRoot?.querySelector(inner);
      return Promise.resolve(target === null || target === undefined ? "" : getComputedStyle(target, pseudo).getPropertyValue(property));
    },
    instanceOf: (id, constructor) => Promise.resolve(element(id) instanceof (constructor as unknown as typeof HTMLElement)),
    press: async (key, options = {}) => {
      await userEvent.keyboard(keyText(key, options.shift === true));
      await settle();
    },
    hover: async (id, inner) => {
      await commands.pointerPath([id === null ? { x: 0, y: 0 } : probe().centre(id, inner)]);
      await settle();
    },
    click: async (id, inner, options = {}) => {
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
    focus: async (target) => {
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
    copy: async (id) => {
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
      reducedMotion: async (mode) => {
      await commands.emulateReducedMotion(mode);
      await settle();
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
    textOf: (id, inner) => Promise.resolve(element(id).shadowRoot?.querySelector(inner)?.textContent ?? null),
    rendered: (id) => {
      const target = element(id);
      const range = document.createRange();
      range.selectNodeContents(target);
      return Promise.resolve({ innerText: target.innerText, rects: range.getClientRects().length });
    },
    events: async (id, during) => {
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
  };
  // Every step ends at its own page time, from which `after` measures.
  for (const [name, step] of Object.entries(driver)) {
    if (typeof step !== "function") continue;
    (driver as unknown as Record<string, unknown>)[name] = async (...args: unknown[]) => {
      try {
        return await (step as (...args: unknown[]) => Promise<unknown>)(...args);
      } finally {
        lastEnd = performance.now();
      }
    };
  }
  const live = driver.liveCapture as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>;
  for (const name of ["start", "stop"]) {
    const step = live[name];
    if (step === undefined) continue;
    live[name] = async (...args: unknown[]) => {
      try {
        return await step(...args);
      } finally {
        lastEnd = performance.now();
      }
    };
  }
  return driver;
}
