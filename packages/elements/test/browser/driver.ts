// The fixture driver of the shared scenario bodies (005 research.md R-11, T015): the same methods as the in-process
// driver (test/in-process.ts), each a `page.evaluate` of a self-contained function on a strict-CSP fixture page that
// loads the built browser build (serve.ts). `page.evaluate` runs through the DevTools protocol, which the page's CSP
// does not govern, so mounting markup and setting styles through the CSSOM add no inline script or style to the page.
// The accessibility tree is read through a CDP session with the same reader as the `axTree` command
// (test/commands.ts); forced colours through `page.emulateMedia`. A page that links `base.css` is a page of its own
// (`<page>-base.html`), so `mount` with `base` must be called on such a page.
//
// 008 (research.md R-14): input is real input through Playwright, `page.keyboard`, `page.mouse` and, in a touch
// context (`visit(…, { touch: true })`), `page.touchscreen`; reduced motion through `page.emulateMedia`; what the page
// holds is read by the probe of scenarios/probe.ts, installed in the page through the DevTools protocol before the
// first mount (and before any read that needs it).
import { inflateSync } from "node:zlib";
import type { Page } from "playwright";
import { axNodes, axSubtree, emulate, emulateMotion, movePointer } from "../commands.ts";
import { decodePng } from "../pixels.ts";
import type { Bounds, Box, Driver, Drawing, Paint, Part, Placement, Sheets } from "../scenarios/driver.ts";
import { installProbe } from "../scenarios/probe.ts";
import type { Probe } from "../scenarios/probe.ts";

/**
 * Waits in the page until every `ocelle-*` element has rendered and the fonts the page uses have loaded (a font that
 * arrives later would move the text a scenario measures), then for a frame.
 */
function settle(page: Page): Promise<void> {
  return page.evaluate(async () => {
    const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
    await Promise.all(elements.map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
    // Every <iframe srcdoc> has loaded its document: a bounded poll of 1 000 ms (008 research.md R-15).
    const loaded = (): boolean =>
      [...document.querySelectorAll("iframe")].every((frame) => !frame.hasAttribute("srcdoc") || (frame.contentDocument?.URL === "about:srcdoc" && frame.contentDocument.readyState === "complete"));
    for (const start = performance.now(); !loaded(); ) {
      if (performance.now() - start > 1000) throw new Error("an <iframe srcdoc> did not load within 1 000 ms");
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

type ProbeMethod = { [K in keyof Probe]: Probe[K] extends (...args: never[]) => unknown ? K : never }[keyof Probe];

/** Calls a method of the page's probe (scenarios/probe.ts), installing it first when the page has none. */
async function probed<K extends ProbeMethod>(page: Page, method: K, ...args: Parameters<Probe[K]>): Promise<ReturnType<Probe[K]>> {
  await page.evaluate(installProbe);
  return (await page.evaluate(
    ({ method, args }) => {
      const probe = (globalThis as unknown as { ocelleProbe: Record<string, (...each: unknown[]) => unknown> }).ocelleProbe;
      return probe[method]?.(...args);
    },
    { method, args },
  )) as ReturnType<Probe[K]>;
}

/** The `page.keyboard` name of one press of `key`, with Shift held when `shift`. */
function keyName(key: string, shift: boolean): string {
  const name = key === " " ? "Space" : key;
  return shift ? `Shift+${name}` : name;
}

/** The driver of `page`; `log` is the page's console and error record, `withBase` whether the page links base.css. */
export function fixtureDriver(page: Page, log: readonly string[], withBase = false): Driver {
  let since = log.length;
  return {
    mount: async (markup, options = {}) => {
      if ((options.base === true) !== withBase) throw new Error(`mount ${options.base === true ? "with" : "without"} base.css on a page ${withBase ? "with" : "without"} it`);
      since = log.length;
      await page.evaluate(installProbe);
      await page.evaluate((html) => {
        document.adoptedStyleSheets = [];
        document.documentElement.removeAttribute("data-theme");
        (globalThis as unknown as { ocelleProbe: Probe }).ocelleProbe.reset();
        document.body.innerHTML = html;
      }, markup);
      await settle(page);
    },
    setProperty: async (id, name, value) => {
      await page.evaluate(({ id, name, value }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        (element as unknown as Record<string, unknown>)[name] = value;
      }, { id, name, value });
      await settle(page);
    },
    setAttribute: async (id, name, value) => {
      await page.evaluate(({ id, name, value }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        if (value === null) element.removeAttribute(name);
        else element.setAttribute(name, value);
      }, { id, name, value });
      await settle(page);
    },
    attribute: (id, name) => page.evaluate(({ id, name }) => document.getElementById(id)?.getAttribute(name) ?? null, { id, name }),
    style: async (id, property, value) => {
      await page.evaluate(({ id, property, value }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        element.style.setProperty(property, value);
      }, { id, property, value });
      await settle(page);
    },
    rules: async (rules) => {
      await page.evaluate((rules) => {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(rules);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
      }, rules);
      await settle(page);
    },
    lines: (id) =>
      page.evaluate((id): Bounds[] => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        return [...element.getClientRects()].map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height }));
      }, id),
    box: (id, inner) =>
      page.evaluate(({ id, inner }): Box => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const target = inner === undefined ? host : host.shadowRoot?.querySelector(inner);
        if (target === null || target === undefined) return { x: 0, y: 0, width: 0, height: 0, display: "absent" };
        const rect = target.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: getComputedStyle(target).display };
      }, { id, inner }),
    drawing: (id) =>
      page.evaluate((id): Drawing => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const root = host.shadowRoot;
        if (root === null) return { children: ["#no-shadow-root"], svg: null };
        const attributes = (of: Element): Record<string, string> => Object.fromEntries([...of.attributes].map((attribute) => [attribute.name, attribute.value]));
        const svg = [...root.children].find((child) => child.localName === "svg") ?? null;
        return {
          children: [...root.children].map((child) => child.localName),
          svg: svg === null ? null : { attributes: attributes(svg), parts: [...svg.children].map((part) => ({ name: part.localName, attributes: attributes(part) })) },
        };
      }, id),
    elements: (id) =>
      page.evaluate((id): Part[] => {
        const root = document.getElementById(id)?.shadowRoot;
        if (root === null || root === undefined) return [];
        return [...root.querySelectorAll("*")].map((part) => ({ name: part.localName, attributes: Object.fromEntries([...part.attributes].map((attribute) => [attribute.name, attribute.value])) }));
      }, id),
    geometry: (id) =>
      page.evaluate((id): Bounds[] => {
        const svg = document.getElementById(id)?.shadowRoot?.querySelector("svg");
        const round = (value: number): number => Math.round(value * 1000) / 1000;
        return (svg === null || svg === undefined ? [] : [...svg.children]).map((shape) => {
          const box = (shape as SVGGraphicsElement).getBBox();
          return { x: round(box.x), y: round(box.y), width: round(box.width), height: round(box.height) };
        });
      }, id),
    dir: async (id, direction) => {
      await page.evaluate(({ id, direction }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        element.setAttribute("dir", direction);
      }, { id, direction });
      await settle(page);
    },
    // The screenshot leaves the caret and animations alone, so Playwright adds no style to the strict-CSP page.
    pixels: async (id) => decodePng(await page.locator(`#${id}`).screenshot({ caret: "initial", animations: "allow" }), (data) => Promise.resolve(inflateSync(data))),
    paints: (id) =>
      page.evaluate((id): Paint[] => {
        const svg = document.getElementById(id)?.shadowRoot?.querySelector("svg");
        if (svg === null || svg === undefined) return [];
        return [svg, ...svg.querySelectorAll("*")].map((part) => ({ name: part.localName, stroke: getComputedStyle(part).stroke, fill: getComputedStyle(part).fill }));
      }, id),
    placement: (id) =>
      page.evaluate((id): Placement => {
        const host = document.getElementById(id);
        const matrix = host?.shadowRoot?.querySelector("svg")?.getScreenCTM();
        if (host === null || matrix === null || matrix === undefined) return { scaleX: 0, scaleY: 0, offsetX: 0, offsetY: 0 };
        const rect = host.getBoundingClientRect();
        const round = (value: number): number => Math.round(value * 1000) / 1000;
        return { scaleX: round(matrix.a), scaleY: round(matrix.d), offsetX: round(matrix.e - rect.x), offsetY: round(matrix.f - rect.y) };
      }, id),
    ownPlacement: (id) =>
      page.evaluate((id): Placement => {
        const svg = document.getElementById(id) as unknown as SVGSVGElement | null;
        const matrix = svg?.getScreenCTM();
        if (svg === null || matrix === null || matrix === undefined) return { scaleX: 0, scaleY: 0, offsetX: 0, offsetY: 0 };
        const rect = svg.getBoundingClientRect();
        const round = (value: number): number => Math.round(value * 1000) / 1000;
        return { scaleX: round(matrix.a), scaleY: round(matrix.d), offsetX: round(matrix.e - rect.x), offsetY: round(matrix.f - rect.y) };
      }, id),
    computed: (id, property) =>
      page.evaluate(({ id, property }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        return getComputedStyle(element).getPropertyValue(property);
      }, { id, property }),
    resolveColour: (value) =>
      page.evaluate((value) => {
        const probe = document.createElement("span");
        (globalThis as unknown as { ocelleProbe?: Probe }).ocelleProbe?.ignore(probe);
        probe.style.color = value;
        document.body.append(probe);
        const colour = getComputedStyle(probe).color;
        probe.remove();
        return colour;
      }, value),
    ax: async (id) => {
      const session = await page.context().newCDPSession(page);
      try {
        return await axNodes(session, id);
      } finally {
        await session.detach();
      }
    },
    axSubtree: async (id) => {
      const session = await page.context().newCDPSession(page);
      try {
        return await axSubtree(session, id);
      } finally {
        await session.detach();
      }
    },
    theme: async (theme) => {
      await page.evaluate((theme) => {
        if (theme === null) document.documentElement.removeAttribute("data-theme");
        else document.documentElement.dataset.theme = theme;
      }, theme);
      await settle(page);
    },
    forcedColors: async (mode, palette) => {
      await emulate(page, mode, palette);
      await settle(page);
    },
    sheets: (selector) =>
      page.evaluate((selector): Sheets => {
        const roots = [...document.querySelectorAll(selector)].map((each) => each.shadowRoot);
        const adopted = roots.map((root) => root?.adoptedStyleSheets ?? []);
        return {
          elements: roots.length,
          perRoot: [...new Set(adopted.map((list) => list.length))],
          distinct: new Set(adopted.flat()).size,
          styleElements: roots.reduce((sum, root) => sum + (root?.querySelectorAll("style").length ?? 0), 0),
        };
      }, selector),
    messages: () => Promise.resolve(log.slice(since)),
    press: async (key, options = {}) => {
      await page.keyboard.press(keyName(key, options.shift === true));
      await settle(page);
    },
    hover: async (id, inner) => {
      await movePointer(page, [id === null ? { x: 0, y: 0 } : await probed(page, "centre", id, inner)]);
      await settle(page);
    },
    click: async (id, inner, options = {}) => {
      await movePointer(page, [{ ...(await probed(page, "centre", id, inner)), down: true, up: true, button: options.button ?? "left" }]);
      await settle(page);
    },
    pointer: async (path) => {
      await movePointer(page, path);
      await settle(page);
    },
    touchTap: async (id, inner) => {
      const { x, y } = await probed(page, "centre", id, inner);
      await page.touchscreen.tap(x, y);
      await settle(page);
    },
    focusPath: () => probed(page, "focusPath"),
    focusVisible: (id, inner) => probed(page, "focusVisible", id, inner),
    reducedMotion: async (on) => {
      await emulateMotion(page, on);
      await settle(page);
    },
    viewport: () => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })),
    setViewport: async (width, height) => {
      await page.setViewportSize({ width, height });
      await settle(page);
    },
    device: () => probed(page, "device"),
    record: async (id, names) => {
      await probed(page, "record", id, names);
    },
    recorded: () => probed(page, "recorded"),
    animations: (id, inner) => probed(page, "animations", id, inner),
    topLayer: () => probed(page, "topLayer"),
    styleAttributes: () => probed(page, "styleAttributes"),
    styleElements: () => probed(page, "styleElements"),
  };
}
