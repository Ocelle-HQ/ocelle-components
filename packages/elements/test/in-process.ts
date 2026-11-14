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
import { installPageHelpers, pageHelpers } from "./page-helpers.ts";
import { decodePng } from "./pixels.ts";
import type { Box, Driver, Drawing, Paint, Part, Placement, Sheets, Target } from "./scenarios/driver.ts";

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

/** The element a target names (test/page-helpers.ts). */
function resolve(target: Target): HTMLElement {
  installPageHelpers();
  return pageHelpers().resolve(target);
}

/** The `userEvent.keyboard` text for `key` pressed with `modifiers` held, then released in reverse order. */
function keyboardText(key: string, modifiers: readonly string[]): string {
  const token = key.length === 1 ? key.replace(/^[{[]$/, (char) => char + char) : `{${key}}`;
  return `${modifiers.map((modifier) => `{${modifier}>}`).join("")}${token}${[...modifiers].reverse().map((modifier) => `{/${modifier}}`).join("")}`;
}

/** Two animation frames, then a task. */
async function framesAndTask(): Promise<void> {
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  await new Promise((done) => setTimeout(done, 0));
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

export function inProcessDriver(): Driver {
  return {
    mount: async (markup, options = {}) => {
      installPageHelpers();
      pageHelpers().reset();
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
    box: (target, inner) => {
      const host = resolve(target);
      const measured = inner === undefined ? host : host.shadowRoot?.querySelector(inner);
      if (measured === null || measured === undefined) return Promise.resolve(absent);
      const rect = measured.getBoundingClientRect();
      return Promise.resolve({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: getComputedStyle(measured).display });
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
    focus: async (target) => {
      resolve(target).focus();
      await settle();
    },
    press: async (key, modifiers = []) => {
      await userEvent.keyboard(keyboardText(key, modifiers));
      await settle();
    },
    click: async (target, options = {}) => {
      await userEvent.click(resolve(target), { button: options.button ?? "left", modifiers: [...(options.modifiers ?? [])], clickCount: options.count ?? 1, force: options.force ?? false });
      await settle();
    },
    hover: async (target) => {
      await userEvent.hover(resolve(target));
      await settle();
    },
    activeElement: () => {
      installPageHelpers();
      return Promise.resolve(pageHelpers().focused());
    },
    mutate: async (target, steps) => {
      resolve(target);
      pageHelpers().mutate(target, steps);
      await settle();
    },
    resize: (target, inlineSize) => {
      resolve(target).style.setProperty("inline-size", `${String(inlineSize)}px`);
      return Promise.resolve();
    },
    afterResizeDelivery: (target) => {
      const observed = resolve(target);
      return new Promise((done) => {
        const observer = new ResizeObserver(() => {
          observer.disconnect();
          done();
        });
        observer.observe(observed);
      });
    },
    computedPart: (target, which, property) => {
      const host = resolve(target);
      const at = which.indexOf("::");
      const name = at === -1 ? which : which.slice(0, at);
      const pseudo = at === -1 ? null : which.slice(at);
      const part = name === "" ? host : host.shadowRoot?.querySelector(`[part~="${name}"]`);
      if (part === null || part === undefined) throw new Error(`no part ${name} in the shadow root`);
      return Promise.resolve(getComputedStyle(part, pseudo).getPropertyValue(property));
    },
    scrollOffset: () => Promise.resolve({ x: window.scrollX, y: window.scrollY }),
    viewportSize: async (width, height) => {
      await page.viewport(width, height);
      await settle();
    },
    keydownRecord: () => {
      installPageHelpers();
      return Promise.resolve([...pageHelpers().keydowns]);
    },
    clipboardCalls: () => {
      installPageHelpers();
      return Promise.resolve([...pageHelpers().clipboard]);
    },
    activationRecord: (target, options) => {
      resolve(target);
      pageHelpers().activation(target, options);
      return Promise.resolve(async () => {
        await framesAndTask();
        return [...pageHelpers().activations];
      });
    },
    axStates: (target, scope) => commands.axStates(target, scope),
    axUpdates: async (target) => {
      await commands.axUpdatesStart(target);
      return () => commands.axUpdatesStop();
    },
  };
}
