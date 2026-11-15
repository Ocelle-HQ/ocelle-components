// The in-process driver of the shared scenario bodies (005 research.md R-11, T014): the `elements` project runs the
// bodies in Vitest's browser mode on the element source the test file imports, so Stryker's mutants of
// packages/elements/src/** are killed here. The page has the token stylesheet the generator makes from the current
// source (`css(source)`, its `@font-face` rules removed, so no font is requested) adopted on the document, and, where a
// scenario mounts with `base: true`, `@ocelle/styles`' base.css after it. The accessibility tree and forced colours
// go through the `axTree` and `emulateForcedColors` browser commands (vitest.config.ts, test/commands.ts). Console
// messages are recorded from each mount on; Lit's development build, which Vite resolves here, warns once at import,
// before any mount, so the console outcome of FR-016 on the built output is the fixture's (test/browser/).
/// <reference types="vite/client" />
import type { LitElement } from "lit";
import { vi } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import baseText from "../../styles/src/base.css?raw";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import { define } from "../src/define.ts";
import { setAnnouncerTimingForTests } from "../src/live.ts";
import type { AnnouncerTiming } from "../src/live.ts";
import type { Delays, Snapshot } from "./live-reading.ts";
import { decodePng } from "./pixels.ts";
import type { Box, Drawing, Entries, Heard, InProcessDriver, InsertHow, Operation, Paint, Part, Placement, Sheets, Validity } from "./scenarios/driver.ts";

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

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id} on the page`);
  return found;
}

/** Waits until every `ocelle-*` element of the page has rendered, then for a frame. */
async function settle(): Promise<void> {
  const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
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

/** The events `listen` heard, and the listeners to remove at the next `mount`. */
const heardEvents: Heard[] = [];
const listening: (() => void)[] = [];

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
  } else (found(operation.id) as HTMLElement).focus();
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
      for (const stop of listening.splice(0)) stop();
      heardEvents.length = 0;
      removed.clear();
      submissions.clear();
      keyed = false;
      document.adoptedStyleSheets = options.base === true ? [tokens, base] : [tokens];
      messages.length = 0;
      document.documentElement.removeAttribute("data-theme");
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
    computed: (id, property) => Promise.resolve(getComputedStyle(element(id)).getPropertyValue(property)),
    resolveColour: (value) => {
      const probe = document.createElement("span");
      probe.style.color = value;
      document.body.append(probe);
      const colour = getComputedStyle(probe).color;
      probe.remove();
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
      await settle();
    },
    laterTask,
    insertInteractive: async (containerId, markup) => {
      await driver.liveCapture.start(containerId);
      await driver.readyState("interactive");
      const at = performance.now();
      element(containerId).innerHTML = markup;
      await settle();
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
      await settle();
    },
    property: (id, name) => Promise.resolve(plain((element(id) as unknown as Record<string, unknown>)[name])),
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
      await settle();
    },
    type: async (id, text) => {
      element(id).focus();
      await userEvent.keyboard(typed(text));
      await settle();
    },
    press: async (id, key) => {
      element(id).focus();
      keyed = true;
      await userEvent.keyboard(keys(key));
      await settle();
    },
    blur: async () => {
      let active = document.activeElement;
      while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
      (active as HTMLElement | null)?.blur();
      await settle();
    },
    click: async (id, at) => {
      // Playwright's position is from the padding box; `at` is from the border box.
      const target = element(id);
      await userEvent.click(target, { position: { x: at.x - target.clientLeft, y: at.y - target.clientTop } });
      await settle();
    },
    focusPath: () => {
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
      await settle();
      return tag;
    },
    readyState: (value) => {
      restoreReadyState();
      if (value !== null) readyState = vi.spyOn(document, "readyState", "get").mockReturnValue(value);
      return Promise.resolve();
    },
    // The phase 3 steps (specs/010-feedback-forms T031 to T033).
    axDetails: (id) => commands.axTree(id, "details"),
    listen: (ids, types) => {
      for (const id of ids) {
        const target = element(id);
        for (const type of types) {
          const listener = (event: Event): void => {
            const detail = (event as CustomEvent<unknown>).detail;
            heardEvents.push({
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
          listening.push(() => {
            target.removeEventListener(type, listener);
          });
        }
      }
      return Promise.resolve();
    },
    heard: () => Promise.resolve(heardEvents.splice(0)),
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
