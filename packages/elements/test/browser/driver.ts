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
import { runningOf } from "../animations.ts";
import { axNodes, axStatesOf, axSubtree, emulate, emulateMotion, movePointer, readActiveElement, readScrollWidth, readTextBoxes, recordAxUpdates } from "../commands.ts";
import { layoutWait } from "../layout-wait.ts";
import { decodePng } from "../pixels.ts";
import { heardTypes } from "../scenarios/driver.ts";
import type { Bounds, Box, Driver, Drawing, Paint, Part, Placement, Sheets, DriverTarget, TreeNode } from "../scenarios/driver.ts";
import { installProbe } from "../scenarios/probe.ts";
import type { Probe } from "../scenarios/probe.ts";
import { policy } from "./serve.ts";

/** The page's helpers (test/page-helpers.ts), which the fixture's init script installed; inside `page.evaluate` only. */
type Helpers = import("../page-helpers.ts").PageHelpers;

/**
 * Waits in the page for two animation frames, then until every `ocelle-*` element has rendered and the fonts the page
 * uses have loaded (a font that arrives later would move the text a scenario measures). Two frames since 009
 * (research.md R-17, the overflow-region contract's rule): a `ResizeObserver` delivery of the first frame and the
 * update it requests are seen. Since 008 it then also waits until every `<iframe srcdoc>` has loaded, and for a frame.
 */
function settle(page: Page): Promise<void> {
  return page.evaluate(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
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

/** A key or chord (`Shift+Tab`, `Ctrl+ArrowRight`) in Playwright's key syntax. */
function chordText(key: string): string {
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
function rectOf(page: Page, target: DriverTarget): Promise<{ readonly x: number; readonly y: number; readonly width: number; readonly height: number }> {
  return page.evaluate(({ target }) => {
    const element = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
    const rect = element.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }, { target });
}

/**
 * Runs `act` in the page on the element matching `inner` in the shadow root of the element with `id`, then waits as
 * `settle` does, and also for every `ocelle-*` element in that shadow root.
 */
async function inShadow(page: Page, id: string, inner: string, act: "append" | "attribute", args: readonly (string | null)[]): Promise<void> {
  await page.evaluate(
    async ({ id, inner, act, args }) => {
      const root = document.getElementById(id)?.shadowRoot;
      const target = root?.querySelector(inner);
      if (root === null || root === undefined || target === null || target === undefined) throw new Error(`no ${inner} in the shadow root of #${id}`);
      if (act === "append") target.insertAdjacentHTML("beforeend", args[0] ?? "");
      else if (args[1] === null) target.removeAttribute(args[0] ?? "");
      else target.setAttribute(args[0] ?? "", args[1] ?? "");
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const elements = [...root.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
      await Promise.all(elements.map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
    },
    { id, inner, act, args },
  );
  await settle(page);
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
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.reset();
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
        (globalThis as unknown as { ocelleProbe: Probe }).ocelleProbe.reset();
        Reflect.deleteProperty(document, Symbol.for("ocelle.progress.sweepStart"));
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
    call: async (id, name) => {
      await page.evaluate(({ id, name }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const method = (element as unknown as Record<string, unknown>)[name];
        if (typeof method !== "function") throw new Error(`#${id} has no method ${name}`);
        (method as () => unknown).call(element);
      }, { id, name });
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
    computedNode: (target, property) =>
      page.evaluate(({ target, property }) => getComputedStyle((window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target)).getPropertyValue(property), { target, property }),
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
    focus: async (target) => {
      await page.evaluate((target) => {
        (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target).focus();
      }, target);
      await settle(page);
    },
    focusNode: async (target) => {
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
    viewportSize: () => page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })),
    device: () => probed(page, "device"),
    record: async (id, names) => {
      await probed(page, "record", id, names);
    },
    recorded: () => probed(page, "recorded"),
    ownAnimations: (id, inner) => probed(page, "animations", id, inner),
    topLayer: () => probed(page, "topLayer"),
    styleAttributes: () => probed(page, "styleAttributes"),
    styleElements: () => probed(page, "styleElements"),
    append: async (id, markup) => {
      await page.evaluate(({ id, markup }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        element.insertAdjacentHTML("beforeend", markup);
      }, { id, markup });
      await settle(page);
    },
    chord: async (key) => {
      await page.keyboard.press(chordText(key));
      await settle(page);
    },
    clickAt: async (target, point) => {
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
    deepActive: () => page.evaluate(deepActive),
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
    scrollLeft: (target) => page.evaluate(({ target }) => {
      const element = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
      return element.scrollLeft;
    }, { target }),
    setScrollLeft: async (target, value) => {
      await page.evaluate(({ target, value }) => {
        const element = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
        element.scrollTo({ left: value, behavior: "instant" });
      }, { target, value });
      await settle(page);
    },
    lastKeyPrevented: () => page.evaluate(() => (window as unknown as { ocelleLastKey?: KeyboardEvent }).ocelleLastKey?.defaultPrevented ?? false),
    frameRecord: async (target, read) => {
      const handle = await page.evaluate(({ target, read }) => {
        const subject = (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(target);
        const source = read.of === undefined ? subject : (window as unknown as { __ocelleDriver: Helpers }).__ocelleDriver.resolve(read.of);
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
    layout: (id) => page.evaluate(layoutWait, id),
    copy: async (id) => {
      await page.evaluate((id) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const range = document.createRange();
        range.selectNodeContents(element);
        const selection = getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }, id);
      await page.keyboard.press("ControlOrMeta+C");
      await page.evaluate(() => {
        const field = document.createElement("textarea");
        field.id = "ocelle-driver-paste";
        document.body.append(field);
        field.addEventListener("paste", (event) => {
          field.dataset.pasted = event.clipboardData?.getData("text/plain") ?? "";
        });
        field.focus();
      });
      await page.keyboard.press("ControlOrMeta+V");
      return page.evaluate(() => {
        const field = document.getElementById("ocelle-driver-paste");
        const pasted = field?.dataset.pasted ?? "";
        field?.remove();
        getSelection()?.removeAllRanges();
        return pasted;
      });
    },
    move: async (id, parentId) => {
      await page.evaluate(({ id, parentId }) => {
        const element = document.getElementById(id);
        const parent = parentId === null ? document.body : document.getElementById(parentId);
        if (element === null || parent === null) throw new Error(`no #${id} or #${String(parentId)} on the page`);
        parent.append(element);
      }, { id, parentId });
      await settle(page);
    },
    text: async (id, value) => {
      await page.evaluate(({ id, value }) => {
        const node = [...(document.getElementById(id)?.childNodes ?? [])].find((child) => child.nodeType === Node.TEXT_NODE);
        if (node === undefined) throw new Error(`no text node in #${id}`);
        (node as Text).data = value;
      }, { id, value });
      await settle(page);
    },
    open: async (id) => {
      await page.evaluate((id) => {
        const target = document.getElementById(id);
        if (target === null) throw new Error(`no #${id} on the page`);
        if (target instanceof HTMLDialogElement) target.showModal();
        else target.showPopover();
      }, id);
      await settle(page);
    },
    boxes: (id, inner) =>
      page.evaluate(({ id, inner }): Box[] =>
        [...(document.getElementById(id)?.shadowRoot?.querySelectorAll(inner) ?? [])].map((each) => {
          const rect = each.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, display: getComputedStyle(each).display };
        }), { id, inner }),
    styles: (id, inner, properties) =>
      page.evaluate(({ id, inner, properties }) => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const targets = inner === null ? [host] : [...(host.shadowRoot?.querySelectorAll(inner) ?? [])];
        return targets.map((each) => Object.fromEntries(properties.map((property) => [property, getComputedStyle(each).getPropertyValue(property)])));
      }, { id, inner, properties }),
    structure: (id, inner) =>
      page.evaluate(({ id, inner }): TreeNode[] => {
        const root = document.getElementById(id)?.shadowRoot ?? null;
        const start = inner === null ? root : (root?.querySelector(inner) ?? null);
        const tree = (of: Element | ShadowRoot): TreeNode[] => [...of.children].map((child) => ({ name: child.localName, children: tree(child) }));
        return start === null ? [] : tree(start);
      }, { id, inner }),
    pressTab: async () => {
      await page.keyboard.press("Tab");
      await settle(page);
    },
    focused: () =>
      page.evaluate(() => {
        let current = document.activeElement;
        while (current?.shadowRoot?.activeElement !== null && current?.shadowRoot?.activeElement !== undefined) current = current.shadowRoot.activeElement;
        if (current === null || current === document.body) return null;
        return current.id === "" ? `<${current.localName}>` : current.id;
      }),
      reducedMotion: async (mode) => {
      await emulateMotion(page, mode);
      await settle(page);
    },
    animations: (id) => page.evaluate(runningOf, id),
    remove: async (id) => {
      await page.evaluate((id) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        element.remove();
      }, id);
      await settle(page);
    },
    textData: async (id, index, data) => {
      await page.evaluate(({ id, index, data }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)[index];
        if (text === undefined) throw new Error(`#${id} has no text node ${String(index)}`);
        (text as Text).data = data;
      }, { id, index, data });
      await settle(page);
    },
    tab: async (shift = false) => {
      await page.keyboard.press(shift ? "Shift+Tab" : "Tab");
      await settle(page);
    },
    activeElement: () => readActiveElement(page.mainFrame()),
    viewport: async (width, height) => {
      await page.setViewportSize({ width, height });
      await settle(page);
    },
    size: async (id, inline, block) => {
      await page.evaluate(({ id, inline, block }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        for (const [property, value] of [["inline-size", inline], ["block-size", block]] as const) {
          if (value === null) element.style.removeProperty(property);
          else element.style.setProperty(property, `${String(value)}px`);
        }
      }, { id, inline, block });
      await settle(page);
    },
    scrollWidth: () => readScrollWidth(page.mainFrame()),
    textBoxes: (id) => readTextBoxes(page.mainFrame(), id),
    // The recorder lives on the page (a property of `window` that no page script reads), as in-process.ts's does.
    listen: async (ids) => {
      await page.evaluate(({ ids, types }) => {
        interface Listening {
          readonly records: string[];
          readonly stop: () => void;
        }
        const holder = window as unknown as { ocelleListening?: Listening };
        holder.ocelleListening?.stop();
        const watched = new Set(ids);
        const host = (node: unknown): string | undefined => {
          for (let at = node instanceof Node ? node : null; at !== null; ) {
            if (at instanceof Element && watched.has(at.id)) return at.id;
            const root = at.getRootNode();
            at = root instanceof ShadowRoot ? root.host : null;
          }
          return undefined;
        };
        const records: string[] = [];
        const original = Object.getOwnPropertyDescriptor(EventTarget.prototype, "dispatchEvent")?.value as (this: EventTarget, event: Event) => boolean;
        EventTarget.prototype.dispatchEvent = function (this: EventTarget, event: Event): boolean {
          const id = host(this);
          if (id !== undefined) records.push(`${id}: ${event.type}`);
          return original.call(this, event);
        };
        const capture = (event: Event): void => {
          const id = event.composedPath().map(host).find((each) => each !== undefined);
          if (id !== undefined) records.push(`${id}: ${event.type}`);
        };
        for (const type of types) window.addEventListener(type, capture, true);
        holder.ocelleListening = {
          records,
          stop: () => {
            EventTarget.prototype.dispatchEvent = original;
            for (const type of types) window.removeEventListener(type, capture, true);
          },
        };
      }, { ids, types: heardTypes });
    },
    heard: () =>
      page.evaluate(() => {
        const holder = window as unknown as { ocelleListening?: { readonly records: string[]; readonly stop: () => void } };
        const records = [...(holder.ocelleListening?.records ?? [])];
        holder.ocelleListening?.stop();
        delete holder.ocelleListening;
        return records;
      }),
    identities: (id) =>
      page.evaluate((id) => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const scope = window as unknown as { ocelleIdentities?: Map<Element, number> };
        const seen = (scope.ocelleIdentities ??= new Map<Element, number>());
        return [...(host.shadowRoot?.querySelectorAll("*") ?? [])].map((node) => {
          const known = seen.get(node);
          if (known !== undefined) return known;
          seen.set(node, seen.size + 1);
          return seen.size;
        });
      }, id),
    shadow: async (id, markup) => {
      await page.evaluate(async ({ id, markup }) => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const root = host.attachShadow({ mode: "open" });
        root.innerHTML = markup;
        const elements = [...root.querySelectorAll("*")].filter((each) => each.localName.startsWith("ocelle-"));
        await Promise.all(elements.map((each) => (each as unknown as { updateComplete?: Promise<unknown> }).updateComplete ?? Promise.resolve()));
      }, { id, markup });
      await settle(page);
    },
    shadowAppend: (id, inner, markup) => inShadow(page, id, inner, "append", [markup]),
    shadowAttribute: (id, inner, name, value) => inShadow(page, id, inner, "attribute", [name, value]),
    shadowComputed: (id, inner, property) =>
      page.evaluate(({ id, inner, property }) => {
        const target = document.getElementById(id)?.shadowRoot?.querySelector(inner);
        if (target === null || target === undefined) throw new Error(`no ${inner} in the shadow root of #${id}`);
        return getComputedStyle(target).getPropertyValue(property);
      }, { id, inner, property }),
    module: async (code) => {
      // Served as `/module.js` of the page's origin under the fixture's policy; a page that runs it allows that path.
      const url = new URL("/module.js", page.url()).href;
      await page.route(url, (route) => route.fulfill({ status: 200, contentType: "text/javascript; charset=utf-8", headers: { "Content-Security-Policy": policy }, body: code }));
      // A string expression, so the test runner's transform does not rewrite the page's own `import()`.
      await page.evaluate(`import(${JSON.stringify(url)}).then(() => true)`);
      await settle(page);
    },
    frames: async (count) => {
      await page.evaluate(async (count) => {
        for (let frame = 0; frame < count; frame++) await new Promise((resolve) => requestAnimationFrame(resolve));
      }, count);
    },
    replace: async (id, markup) => {
      await page.evaluate(({ id, markup }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const template = document.createElement("template");
        template.innerHTML = markup;
        element.replaceWith(template.content);
      }, { id, markup });
      await settle(page);
    },
      changeAttributes: async (id, changes) => {
      await page.evaluate(({ id, changes }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        for (const [name, value] of changes) {
          if (value === null) element.removeAttribute(name);
          else element.setAttribute(name, value);
        }
      }, { id, changes });
      await settle(page);
    },
    property: (id, name) =>
      page.evaluate(({ id, name }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        return (element as unknown as Record<string, unknown>)[name];
      }, { id, name }),
    textOf: (id, inner) => page.evaluate(({ id, inner }) => document.getElementById(id)?.shadowRoot?.querySelector(inner)?.textContent ?? null, { id, inner }),
    rendered: (id) =>
      page.evaluate((id) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const range = document.createRange();
        range.selectNodeContents(element);
        return { innerText: element.innerText, rects: range.getClientRects().length };
      }, id),
    events: async (id, during) => {
      await page.evaluate((id) => {
        const target = document.getElementById(id);
        if (target === null) throw new Error(`no #${id} on the page`);
        const native = Object.getOwnPropertyDescriptor(EventTarget.prototype, "dispatchEvent");
        if (native === undefined) throw new Error("no EventTarget.prototype.dispatchEvent");
        const dispatch = native.value as (this: EventTarget, event: Event) => boolean;
        const seen: string[] = [];
        Reflect.set(window, Symbol.for("ocelle.test.events"), { native, seen });
        Object.defineProperty(EventTarget.prototype, "dispatchEvent", {
          ...native,
          value: function (this: EventTarget, event: Event): boolean {
            if (this === target || (this instanceof Node && this.getRootNode() === target.shadowRoot)) seen.push(event.type);
            return dispatch.call(this, event);
          },
        });
      }, id);
      const stop = (): Promise<string[]> =>
        page.evaluate(() => {
          const key = Symbol.for("ocelle.test.events");
          const recording = Reflect.get(window, key) as { readonly native: PropertyDescriptor; readonly seen: string[] };
          Object.defineProperty(EventTarget.prototype, "dispatchEvent", recording.native);
          Reflect.deleteProperty(window, key);
          return recording.seen;
        });
      try {
        await during();
      } catch (error) {
        await stop();
        throw error;
      }
      return await stop();
    },
  };
}
