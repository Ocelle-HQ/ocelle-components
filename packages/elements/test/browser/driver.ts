// The fixture driver of the shared scenario bodies (005 research.md R-11, T015): the same methods as the in-process
// driver (test/in-process.ts), each a `page.evaluate` of a self-contained function on a strict-CSP fixture page that
// loads the built browser build (serve.ts). `page.evaluate` runs through the DevTools protocol, which the page's CSP
// does not govern, so mounting markup and setting styles through the CSSOM add no inline script or style to the page.
// The accessibility tree is read through a CDP session with the same reader as the `axTree` command
// (test/commands.ts); forced colours through `page.emulateMedia`. A page that links `base.css` is a page of its own
// (`<page>-base.html`), so `mount` with `base` must be called on such a page.
import { inflateSync } from "node:zlib";
import type { Page } from "playwright";
import { axNodes, axSubtree, emulate, emulateMotion } from "../commands.ts";
import { decodePng } from "../pixels.ts";
import type { Bounds, Box, Driver, Drawing, Paint, Part, Placement, Sheets, Target } from "../scenarios/driver.ts";

/**
 * Waits in the page for two animation frames, then until every `ocelle-*` element has rendered and the fonts the page
 * uses have loaded (a font that arrives later would move the text a scenario measures). Two frames since 009
 * (research.md R-17, the overflow-region contract's rule): a `ResizeObserver` delivery of the first frame and the
 * update it requests are seen.
 */
function settle(page: Page): Promise<void> {
  return page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const elements = [...document.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
    await Promise.all(elements.map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    await document.fonts.ready;
  });
}

/** A key or chord (`Shift+Tab`, `Ctrl+ArrowRight`) in Playwright's key syntax. */
function chord(key: string): string {
  return key
    .split("+")
    .map((part) => (part === "Ctrl" ? "Control" : part))
    .join("+");
}

/** The deep active element in the page, each level as its id or its local name and classes, joined by " >> ". */
function deepActive(): string {
  const levels: string[] = [];
  let active: Element | null = document.activeElement;
  while (active !== null) {
    levels.push(active.id !== "" ? active.id : [active.localName, ...active.classList].join("."));
    active = active.shadowRoot?.activeElement ?? null;
  }
  return levels.join(" >> ");
}

/** The viewport rectangle of a target's border box. */
function rectOf(page: Page, target: Target): Promise<{ readonly x: number; readonly y: number; readonly width: number; readonly height: number }> {
  return page.evaluate(({ target }) => {
    const host = document.getElementById(typeof target === "string" ? target : target.id);
    const element = typeof target === "string" ? host : host?.shadowRoot?.querySelector(target.inner);
    if (element === null || element === undefined) throw new Error(`no target ${JSON.stringify(target)} on the page`);
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }, { target });
}

/** The driver of `page`; `log` is the page's console and error record, `withBase` whether the page links base.css. */
export function fixtureDriver(page: Page, log: readonly string[], withBase = false): Driver {
  let since = log.length;
  return {
    mount: async (markup, options = {}) => {
      if ((options.base === true) !== withBase) throw new Error(`mount ${options.base === true ? "with" : "without"} base.css on a page ${withBase ? "with" : "without"} it`);
      since = log.length;
      await page.evaluate((html) => {
        const recorded = window as unknown as { ocelleLastKey?: KeyboardEvent | undefined; ocelleKeys?: boolean };
        if (recorded.ocelleKeys !== true) {
          recorded.ocelleKeys = true;
          window.addEventListener(
            "keydown",
            (event) => {
              recorded.ocelleLastKey = event;
            },
            true,
          );
        }
        recorded.ocelleLastKey = undefined;
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
    computed: (target, property) =>
      page.evaluate(({ target, property }) => {
        const host = document.getElementById(typeof target === "string" ? target : target.id);
        const element = typeof target === "string" ? host : host?.shadowRoot?.querySelector(target.inner);
        if (element === null || element === undefined) throw new Error(`no target ${JSON.stringify(target)} on the page`);
        return getComputedStyle(element).getPropertyValue(property);
      }, { target, property }),
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
    viewport: async (width, height) => {
      await page.setViewportSize({ width, height });
      await settle(page);
    },
    press: async (key) => {
      await page.keyboard.press(chord(key));
      await settle(page);
    },
    click: async (target, point) => {
      const rect = await rectOf(page, target);
      await page.mouse.click(rect.x + point.x, rect.y + point.y);
      await settle(page);
    },
    wheel: async (target, deltaX) => {
      const rect = await rectOf(page, target);
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2);
      await page.mouse.wheel(deltaX, 0);
      await settle(page);
    },
    activeElement: () => page.evaluate(deepActive),
    tabWalk: async (from, to, backward = false) => {
      await page.evaluate((from) => {
        const element = document.getElementById(from);
        if (element === null) throw new Error(`no #${from} on the page`);
        element.focus();
      }, from);
      const walked: string[] = [];
      for (let step = 0; step < 40 && walked.at(-1) !== to; step++) {
        await page.keyboard.press(backward ? "Shift+Tab" : "Tab");
        walked.push(await page.evaluate(deepActive));
      }
      await settle(page);
      return walked;
    },
    focus: async (target) => {
      await page.evaluate(({ target }) => {
        const host = document.getElementById(typeof target === "string" ? target : target.id);
        const element = typeof target === "string" ? host : host?.shadowRoot?.querySelector<HTMLElement>(target.inner);
        if (element === null || element === undefined) throw new Error(`no target ${JSON.stringify(target)} on the page`);
        element.focus();
      }, { target });
      await settle(page);
    },
    scrollLeft: (target) => page.evaluate(({ target }) => {
      const host = document.getElementById(typeof target === "string" ? target : target.id);
      const element = typeof target === "string" ? host : host?.shadowRoot?.querySelector(target.inner);
      if (element === null || element === undefined) throw new Error(`no target ${JSON.stringify(target)} on the page`);
      return element.scrollLeft;
    }, { target }),
    setScrollLeft: async (target, value) => {
      await page.evaluate(({ target, value }) => {
        const host = document.getElementById(typeof target === "string" ? target : target.id);
        const element = typeof target === "string" ? host : host?.shadowRoot?.querySelector(target.inner);
        if (element === null || element === undefined) throw new Error(`no target ${JSON.stringify(target)} on the page`);
        element.scrollTo({ left: value, behavior: "instant" });
      }, { target, value });
      await settle(page);
    },
    lastKeyPrevented: () => page.evaluate(() => (window as unknown as { ocelleLastKey?: KeyboardEvent }).ocelleLastKey?.defaultPrevented ?? false),
    reducedMotion: async (on) => {
      await emulateMotion(page, on);
      await settle(page);
    },
    frameRecord: async (target, read) => {
      const handle = await page.evaluate(({ target, read }) => {
        const host = document.getElementById(typeof target === "string" ? target : target.id);
        const subject = typeof target === "string" ? host : host?.shadowRoot?.querySelector(target.inner);
        if (subject === null || subject === undefined) throw new Error(`no target ${JSON.stringify(target)} on the page`);
        const of = read.of;
        const ofHost = of === undefined ? null : document.getElementById(typeof of === "string" ? of : of.id);
        const source = of === undefined ? subject : typeof of === "string" ? ofHost : ofHost?.shadowRoot?.querySelector(of.inner);
        if (source === null || source === undefined) throw new Error(`no reading target ${JSON.stringify(of)} on the page`);
        const take = (): string => {
          if ("property" in read) return String((source as unknown as Record<string, unknown>)[read.property]);
          if ("computed" in read) return getComputedStyle(source).getPropertyValue(read.computed);
          return String(source.getAttribute(read.attribute));
        };
        const record = [take()];
        const onKey = (): void => {
          record.push("keydown");
        };
        window.addEventListener("keydown", onKey, true);
        const observer = new ResizeObserver(() => record.push(`resize: ${take()}`));
        observer.observe(subject, { box: "border-box" });
        const state = { frame: 0 };
        const loop = (): void => {
          record.push(take());
          state.frame = requestAnimationFrame(loop);
        };
        state.frame = requestAnimationFrame(loop);
        const recorders = ((window as unknown as { ocelleRecorders?: (() => string[])[] }).ocelleRecorders ??= []);
        recorders.push(() => {
          cancelAnimationFrame(state.frame);
          observer.disconnect();
          window.removeEventListener("keydown", onKey, true);
          return record;
        });
        return recorders.length - 1;
      }, { target, read });
      await page.evaluate(async () => {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
      return {
        stop: async () => {
          await settle(page);
          return page.evaluate((handle) => {
            const stop = (window as unknown as { ocelleRecorders: (() => string[])[] }).ocelleRecorders[handle];
            if (stop === undefined) throw new Error(`no frame record ${String(handle)}`);
            return stop();
          }, handle);
        },
      };
    },
    settle: () => settle(page),
  };
}
