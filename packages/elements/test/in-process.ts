// The in-process driver of the shared scenario bodies (005 research.md R-11, T014): the `elements` project runs the
// bodies in Vitest's browser mode on the element source the test file imports, so Stryker's mutants of
// packages/elements/src/** are killed here. The page has the token stylesheet the generator makes from the current
// source (`css(source)`, its `@font-face` rules removed, so no font is requested) adopted on the document, and, where a
// scenario mounts with `base: true`, `@ocelle/styles`' base.css after it. The accessibility tree and forced colours
// go through the `axTree` and `emulateForcedColors` browser commands (vitest.config.ts, test/commands.ts). Console
// messages are recorded from each mount on; Lit's development build, which Vite resolves here, warns once at import,
// before any mount, so the console outcome of FR-016 on the built output is the fixture's (test/browser/).
//
// 012 (research.md R-11): keys, the mouse, one accessibility node, reduced motion and axe go through the `press`,
// `hover`, `pointer`, `axState`, `emulateReducedMotion` and `axe` commands; the event recorder and the other page reads
// are page-side.ts's functions, called here in the test's frame. The **navigation sink** is the last bubble-phase
// listener on `window` for `click` and `auxclick` (put back at the end after each recorder listener on `window`): for
// an activation of a link (an `a` or `area` with `href` on the event's composed path) it records whether it was already
// prevented, the button, the modifier flags and the `href` attribute, then prevents it, so the runner never navigates.
/// <reference types="vite/client" />
import type { LitElement } from "lit";
import { vi } from "vitest";
import { commands, page } from "vitest/browser";
import baseText from "../../styles/src/base.css?raw";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import { activeInnerOf, activePath, computedOf, currentOf, endOrder, focusElement, preventNextEvent, recordEvents, resetPage, sentinelId, startOrder, takeRecords } from "./page-side.ts";
import { decodePng } from "./pixels.ts";
import type { Box, Driver, Drawing, NavigationRecord, Paint, Part, Placement, Sheets } from "./scenarios/driver.ts";

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

export function inProcessDriver(): Driver {
  return {
    mount: async (markup, options = {}) => {
      document.adoptedStyleSheets = options.base === true ? [tokens, base] : [tokens];
      messages.length = 0;
      navigations.length = 0;
      resetPage();
      lastSink();
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
    computed: (id, property, inner) => Promise.resolve(computedOf({ id, property, inner })),
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
    focus: (id) => {
      focusElement(id);
      return Promise.resolve();
    },
    press: (key, modifiers) => commands.press(key, modifiers),
    click: async (id, options) => {
      await commands.pointer("click", id, options);
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
  };
}
