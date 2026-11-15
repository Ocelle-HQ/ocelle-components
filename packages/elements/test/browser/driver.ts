// The fixture driver of the shared scenario bodies (005 research.md R-11, T015): the same methods as the in-process
// driver (test/in-process.ts), each a `page.evaluate` of a self-contained function on a strict-CSP fixture page that
// loads the built browser build (serve.ts). `page.evaluate` runs through the DevTools protocol, which the page's CSP
// does not govern, so mounting markup and setting styles through the CSSOM add no inline script or style to the page.
// The accessibility tree is read through a CDP session with the same reader as the `axTree` command
// (test/commands.ts); forced colours through `page.emulateMedia`. A page that links `base.css` is a page of its own
// (`<page>-base.html`), so `mount` with `base` must be called on such a page.
//
// 012 (research.md R-11): keys and the mouse through Playwright's keyboard and mouse (commands.ts `press` and
// `pointer`, the functions the in-process commands use), one accessibility node through the same CDP reader as the
// `axState` command, reduced motion through `page.emulateMedia`, axe through commands.ts `audit` with axe-core's
// `axe.min.js` served same-origin as `axe.js` and added as a `<script src>` (allowed by `script-src 'self'`), and the
// event recorder and the other page reads as page-side.ts's functions in `page.evaluate`. There is no navigation sink
// here: a link navigates for real, and the fixture body of a link scenario asserts the page's URL, the new tabs
// (serve.ts `Visit.tabs`) and the server's visits (`Served.visits`); `navigations()` throws.
import { inflateSync } from "node:zlib";
import type { Page } from "playwright";
import { audit, axNodes, axeSetup, axStateOf, axSubtree, emulate, emulateMotion, pointer, press } from "../commands.ts";
import { activeInnerOf, activePath, clickElement, computedOf, copyElement, currentOf, endOrder, focusElement, morphElement, preventNextEvent, recordEvents, resetPage, sentinelId, startOrder, takeRecords } from "../page-side.ts";
import { decodePng } from "../pixels.ts";
import type { Bounds, Box, Driver, Drawing, Paint, Part, Placement, Sheets } from "../scenarios/driver.ts";

/** The most Tab presses `tabOrder` makes before it stops. */
const maxSteps = 64;

/**
 * Waits in the page until every `ocelle-*` element has rendered and the fonts the page uses have loaded (a font that
 * arrives later would move the text a scenario measures), then for a frame.
 */
function settle(page: Page): Promise<void> {
  return page.evaluate(async () => {
    const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
    await Promise.all(elements.map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

/** The driver of `page`; `log` is the page's console and error record, `withBase` whether the page links base.css. */
export function fixtureDriver(page: Page, log: readonly string[], withBase = false): Driver {
  let since = log.length;
  return {
    mount: async (markup, options = {}) => {
      if ((options.base === true) !== withBase) throw new Error(`mount ${options.base === true ? "with" : "without"} base.css on a page ${withBase ? "with" : "without"} it`);
      since = log.length;
      await page.evaluate(resetPage);
      await page.evaluate((html) => {
        document.adoptedStyleSheets = [];
        document.documentElement.removeAttribute("data-theme");
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
    computed: (id, property, inner) => page.evaluate(computedOf, { id, property, inner }),
    resolveColour: (value) =>
      page.evaluate((value) => {
        const probe = document.createElement("span");
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
    focus: (id) => page.evaluate(focusElement, id),
    press: (key, modifiers) => press(page, key, modifiers),
    click: async (id, options) => {
      await pointer(page, page.mainFrame(), "click", id, options);
      await settle(page);
    },
    callClick: async (id) => {
      await page.evaluate(clickElement, id);
      // A link's click() starts its navigation at once (012 phase 3, US2-1's fixture body): the page that would settle
      // is gone, which is the outcome the body then reads; any other failure is reported.
      await settle(page).catch((error: unknown) => {
        if (!String(error).includes("Execution context was destroyed")) throw error;
      });
    },
    hover: async (id, options) => {
      await pointer(page, page.mainFrame(), "hover", id, options);
      await settle(page);
    },
    pointerDown: async (id, options) => {
      await pointer(page, page.mainFrame(), "down", id, options);
      await settle(page);
    },
    pointerUp: async (id) => {
      await pointer(page, page.mainFrame(), "up", id);
      await settle(page);
    },
    tabOrder: async (options = {}) => {
      const reverse = options.reverse === true;
      const order: string[][] = [];
      await page.evaluate(startOrder, reverse);
      for (let step = 0; step < maxSteps; step += 1) {
        await press(page, "Tab", reverse ? ["Shift"] : []);
        const path = await page.evaluate(activePath);
        if (path.length === 0 || path[0] === `span#${sentinelId}` || JSON.stringify(path) === JSON.stringify(order[0])) break;
        order.push(path);
      }
      await page.evaluate(endOrder);
      return order;
    },
    activeInner: (id) => page.evaluate(activeInnerOf, id),
    events: (id, types) => page.evaluate(recordEvents, { id, types }),
    takeEvents: () => page.evaluate(takeRecords),
    preventNext: (type) => page.evaluate(preventNextEvent, type),
    navigations: () => Promise.reject(new Error("navigations(): the fixture has no navigation sink; a link navigates for real (Visit.tabs, Served.visits)")),
    reducedMotion: async (mode) => {
      await emulateMotion(page, mode);
      await settle(page);
    },
    axState: async (id, inner) => {
      const session = await page.context().newCDPSession(page);
      try {
        return await axStateOf(session, id, inner);
      } finally {
        await session.detach();
      }
    },
    current: (id, inner) => page.evaluate(currentOf, { id, inner }),
    axe: (scope) => audit(page.mainFrame(), () => page.addScriptTag({ url: "axe.js" }), axeSetup().rules, scope),
    copy: async (id, via, into) => {
      await page.evaluate(copyElement, { id, via, into });
      await settle(page);
    },
    morph: async (id, markup) => {
      await page.evaluate(morphElement, { id, markup });
      await settle(page);
    },
  };
}
