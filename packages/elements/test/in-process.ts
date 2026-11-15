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
import { runningOf } from "./animations.ts";
import { layoutWait } from "./layout-wait.ts";
import { decodePng } from "./pixels.ts";
import type { Box, Driver, Drawing, Paint, Part, Placement, Sheets, TreeNode } from "./scenarios/driver.ts";

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

export function inProcessDriver(): Driver {
  return {
    mount: async (markup, options = {}) => {
      document.adoptedStyleSheets = options.base === true ? [tokens, base] : [tokens];
      messages.length = 0;
      document.documentElement.removeAttribute("data-theme");
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
    viewport: async (width, height) => {
      await page.viewport(width, height);
      await settle();
    },
    scrollWidth: () => Promise.resolve(document.documentElement.scrollWidth),
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
    remove: (id) => {
      element(id).remove();
      return Promise.resolve();
    },
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
}
