// The fixture driver of the shared scenario bodies (005 research.md R-11, T015): the same methods as the in-process
// driver (test/in-process.ts), each a `page.evaluate` of a self-contained function on a strict-CSP fixture page that
// loads the built browser build (serve.ts). `page.evaluate` runs through the DevTools protocol, which the page's CSP
// does not govern, so mounting markup and setting styles through the CSSOM add no inline script or style to the page.
// The accessibility tree is read through a CDP session with the same reader as the `axTree` command
// (test/commands.ts); forced colours through `page.emulateMedia`. A page that links `base.css` is a page of its own
// (`<page>-base.html`), so `mount` with `base` must be called on such a page.
import { inflateSync } from "node:zlib";
import type { Page } from "playwright";
import { axNodes, axStatesOf, axSubtree, emulate, recordAxUpdates } from "../commands.ts";
import { decodePng } from "../pixels.ts";
import type { Bounds, Box, Driver, Drawing, Paint, Part, Placement, Sheets } from "../scenarios/driver.ts";

/** The page's helpers (test/page-helpers.ts), which the fixture's init script installed; inside `page.evaluate` only. */
type Helpers = import("../page-helpers.ts").PageHelpers;

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
      await page.evaluate((html) => {
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.reset();
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
    box: (target, inner) =>
      page.evaluate(({ target, inner }): Box => {
        const host = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
        const measured = inner === undefined ? host : host.shadowRoot?.querySelector(inner);
        if (measured === null || measured === undefined) return { x: 0, y: 0, width: 0, height: 0, display: "absent" };
        const rect = measured.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: getComputedStyle(measured).display };
      }, { target, inner }),
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
    computed: (target, property) =>
      page.evaluate(({ target, property }) => getComputedStyle((window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target)).getPropertyValue(property), { target, property }),
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
    focus: async (target) => {
      await page.evaluate((target) => {
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target).focus();
      }, target);
      await settle(page);
    },
    pressKeys: async (key, modifiers = []) => {
      await page.keyboard.press([...modifiers, key].join("+"));
      await settle(page);
    },
    clickTarget: async (target, options = {}) => {
      const handle = await page.evaluateHandle((target) => (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target), target);
      try {
        await handle.click({ button: options.button ?? "left", modifiers: [...(options.modifiers ?? [])], clickCount: options.count ?? 1, force: options.force ?? false });
      } finally {
        await handle.dispose();
      }
      await settle(page);
    },
    hoverTarget: async (target) => {
      const handle = await page.evaluateHandle((target) => (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target), target);
      try {
        await handle.hover();
      } finally {
        await handle.dispose();
      }
      await settle(page);
    },
    focusedElement: () => page.evaluate(() => (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.focused()),
    mutate: async (target, steps) => {
      await page.evaluate(({ target, steps }) => {
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.mutate(target, steps);
      }, { target, steps });
      await settle(page);
    },
    resize: async (target, inlineSize) => {
      await page.evaluate(({ target, inlineSize }) => {
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target).style.setProperty("inline-size", `${String(inlineSize)}px`);
      }, { target, inlineSize });
    },
    afterResizeDelivery: (target) =>
      page.evaluate((target) => {
        const observed = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
        return new Promise<void>((done) => {
          const observer = new ResizeObserver(() => {
            observer.disconnect();
            done();
          });
          observer.observe(observed);
        });
      }, target),
    computedPart: (target, which, property) =>
      page.evaluate(({ target, which, property }) => {
        const host = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
        const at = which.indexOf("::");
        const name = at === -1 ? which : which.slice(0, at);
        const pseudo = at === -1 ? null : which.slice(at);
        const part = name === "" ? host : host.shadowRoot?.querySelector(`[part~="${name}"]`);
        if (part === null || part === undefined) throw new Error(`no part ${name} in the shadow root`);
        return getComputedStyle(part, pseudo).getPropertyValue(property);
      }, { target, which, property }),
    scrollOffset: () => page.evaluate(() => ({ x: window.scrollX, y: window.scrollY })),
    setViewportSize: async (width, height) => {
      await page.setViewportSize({ width, height });
      await settle(page);
    },
    keydownRecord: () => page.evaluate(() => [...(window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.keydowns]),
    clipboardCalls: () => page.evaluate(() => [...(window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.clipboard]),
    activationRecord: async (target, options) => {
      await page.evaluate(({ target, options }) => {
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.activation(target, options);
      }, { target, options });
      return () =>
        page.evaluate(async () => {
          await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
          await new Promise((done) => setTimeout(done, 0));
          return [...(window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.activations];
        });
    },
    axStates: async (target, scope) => {
      const session = await page.context().newCDPSession(page);
      try {
        return await axStatesOf(session, target, scope);
      } finally {
        await session.detach();
      }
    },
    axUpdates: async (target) => {
      const session = await page.context().newCDPSession(page);
      const stop = await recordAxUpdates(session, target);
      return async () => {
        try {
          return await stop();
        } finally {
          await session.detach();
        }
      };
    },
  };
}
