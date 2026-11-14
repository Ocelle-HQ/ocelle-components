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
/// <reference types="vite/client" />
import type { LitElement } from "lit";
import { vi } from "vitest";
import { commands, page, userEvent } from "vitest/browser";
import baseText from "../../styles/src/base.css?raw";
import framesText from "./fixtures/frames.css?raw";
import { css } from "../../tokens/src/generate.ts";
import { source } from "../../tokens/src/source.ts";
import { decodePng } from "./pixels.ts";
import type { Box, Driver, Drawing, Paint, Part, Placement, Reading, Sheets, Target } from "./scenarios/driver.ts";

function sheet(text: string): CSSStyleSheet {
  const made = new CSSStyleSheet();
  made.replaceSync(text);
  return made;
}

const tokens = sheet(css(source).replace(/@font-face\s*\{[^}]*\}/g, ""));
const base = sheet(baseText);
const frames = sheet(framesText);

function element(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id} on the page`);
  return found;
}

const nextFrame = (): Promise<unknown> => new Promise((resolve) => requestAnimationFrame(resolve));

/**
 * Waits two animation frames, then until every `ocelle-*` element of the page has rendered (009 research.md R-17, the
 * overflow-region contract's rule: a `ResizeObserver` delivery of the first frame and the update it requests are seen).
 */
async function settle(): Promise<void> {
  await nextFrame();
  await nextFrame();
  const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
  await Promise.all(elements.map((each) => (each as Partial<LitElement>).updateComplete ?? Promise.resolve(true)));
}

/** The element of a target: the element with the id, or the first match of `inner` in its shadow root. */
function resolve(target: Target): HTMLElement {
  if (typeof target === "string") return element(target);
  const found = element(target.id).shadowRoot?.querySelector<HTMLElement>(target.inner);
  if (found === null || found === undefined) throw new Error(`no ${target.inner} in the shadow root of #${target.id}`);
  return found;
}

/** A key or chord (`Shift+Tab`, `Ctrl+ArrowRight`) in user-event's keyboard syntax, modifiers held around the key. */
function chord(key: string): string {
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

export function inProcessDriver(): Driver {
  return {
    mount: async (markup, options = {}) => {
      document.adoptedStyleSheets = options.base === true ? [tokens, base, frames] : [tokens, frames];
      messages.length = 0;
      lastKey = undefined;
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
    computed: (target, property) => Promise.resolve(getComputedStyle(resolve(target)).getPropertyValue(property)),
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
    viewport: async (width, height) => {
      await page.viewport(width, height);
      await settle();
    },
    press: async (key) => {
      await userEvent.keyboard(chord(key));
      await settle();
    },
    click: async (target, point) => {
      const rect = resolve(target).getBoundingClientRect();
      const root = document.documentElement.getBoundingClientRect();
      await userEvent.click(document.documentElement, { position: { x: rect.left - root.left + point.x, y: rect.top - root.top + point.y }, force: true });
      await settle();
    },
    wheel: async (target, deltaX) => {
      await userEvent.wheel(resolve(target), { delta: { x: deltaX } });
      await settle();
    },
    activeElement: () => Promise.resolve(deepActive()),
    tabWalk: async (from, to, backward = false) => {
      element(from).focus();
      const walked: string[] = [];
      for (let step = 0; step < 40 && walked.at(-1) !== to; step++) {
        await userEvent.keyboard(chord(backward ? "Shift+Tab" : "Tab"));
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
    reducedMotion: async (on) => {
      await commands.emulateReducedMotion(on);
      await settle();
    },
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
  };
}
