// The fixture driver of the shared scenario bodies (005 research.md R-11, T015): the same methods as the in-process
// driver (test/in-process.ts), each a `page.evaluate` of a self-contained function on a strict-CSP fixture page that
// loads the built browser build (serve.ts). `page.evaluate` runs through the DevTools protocol, which the page's CSP
// does not govern, so mounting markup and setting styles through the CSSOM add no inline script or style to the page.
// The accessibility tree is read through a CDP session with the same reader as the `axTree` command
// (test/commands.ts); forced colours through `page.emulateMedia`. A page that links `base.css` is a page of its own
// (`<page>-base.html`), so `mount` with `base` must be called on such a page.
import { inflateSync } from "node:zlib";
import type { Page } from "playwright";
import { axDetails, axNodes, axSubtree, emulate } from "../commands.ts";
import { fixtureCapture } from "../live.ts";
import type { Snapshot } from "../live-reading.ts";
import { decodePng } from "../pixels.ts";
import type { Bounds, Box, Drawing, Entries, FixtureDriver, Heard, InsertHow, Paint, Part, Placement, Sheets, Validity } from "../scenarios/driver.ts";
import type { Served } from "./serve.ts";

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

/** The page's time now. */
const now = (page: Page): Promise<number> => page.evaluate(() => performance.now());

/** Inserts `markup` into the element with `containerId` in the page, as `insert` says for `how`. */
function insertIn(page: Page, containerId: string, markup: string, how: InsertHow): Promise<void> {
  return page.evaluate(({ containerId, markup, how }) => {
    const container = document.getElementById(containerId);
    if (container === null) throw new Error(`no #${containerId} on the page`);
    if (how === "innerHTML") container.innerHTML = markup;
    else if (how === "template") {
      const template = document.createElement("template");
      template.innerHTML = markup;
      container.append(template.content.cloneNode(true));
    } else if (how === "domparser") {
      const parsed = new DOMParser().parseFromString(`<!doctype html><body>${markup}`, "text/html");
      container.append(...[...parsed.body.childNodes].map((node) => document.adoptNode(node)));
    } else {
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
      container.append(...[...parsed.content.childNodes].map(copy));
    }
  }, { containerId, markup, how });
}

/**
 * The driver of `page`; `log` is the page's console and error record, `withBase` whether the page links base.css,
 * `served` the fixture server (its submission recorder answers `submit`).
 */
export function fixtureDriver(page: Page, log: readonly string[], withBase = false, served?: Served): FixtureDriver {
  let since = log.length;
  let lastEnd = 0;
  let last: readonly Snapshot[] = [];
  let keyed = false;
  let seen = served?.submissions().length ?? 0;
  const capture = fixtureCapture(page);
  const driver: FixtureDriver = {
    mount: async (markup, options = {}) => {
      if ((options.base === true) !== withBase) throw new Error(`mount ${options.base === true ? "with" : "without"} base.css on a page ${withBase ? "with" : "without"} it`);
      since = log.length;
      keyed = false;
      seen = served?.submissions().length ?? 0;
      await page.evaluate((html) => {
        const holder = globalThis as unknown as { ocelleListening?: (() => void)[]; ocelleHeard?: unknown[] };
        for (const stop of (holder.ocelleListening ?? []).splice(0)) stop();
        holder.ocelleHeard = [];
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
    computed: (id, property) =>
      page.evaluate(({ id, property }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        return getComputedStyle(element).getPropertyValue(property);
      }, { id, property }),
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
    liveCapture: {
      start: (containerId) => capture.start(containerId),
      startDocument: (url) => capture.startDocument(new URL(url, page.url()).href),
      stop: async (options) => {
        last = await capture.stop(options);
        return [...last];
      },
    },
    insert: async (containerId, markup, how) => {
      await insertIn(page, containerId, markup, how);
      await settle(page);
    },
    laterTask: async () => {
      await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = () => {
            channel.port1.close();
            resolve();
          };
          channel.port2.postMessage(0);
        });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      });
    },
    insertInteractive: async (containerId, markup) => {
      // The page's module script inserts the markup from its DOMContentLoaded listener (fixtures/interactive.js).
      await page.addInitScript((insertion) => {
        (globalThis as unknown as { ocelleInteractive: unknown }).ocelleInteractive = insertion;
      }, { container: containerId, markup });
      await driver.liveCapture.startDocument("interactive.html");
      return page.evaluate(() => {
        const inserted = (globalThis as unknown as { ocelleInserted?: { at: number } }).ocelleInserted;
        if (inserted === undefined) throw new Error("interactive.html inserted nothing");
        return inserted.at;
      });
    },
    after: (ms) =>
      page.evaluate(async ({ from, ms }) => {
        while (performance.now() < from + ms) await new Promise((resolve) => setTimeout(resolve, from + ms - performance.now()));
        return performance.now() - from;
      }, { from: lastEnd, ms }),
    W: { loaded: 300, loading: 700 },
    H: 5000,
    hostRole: (id) => Promise.resolve(last.at(-1)?.hosts.find((host) => host.host === id)?.role ?? "none"),
    // The phase 2 steps (specs/010-feedback-forms T011).
    batch: async (operations) => {
      await page.evaluate((operations) => {
        const holder = globalThis as unknown as { ocelleRemoved?: Map<string, Element> };
        const removed = (holder.ocelleRemoved ??= new Map<string, Element>());
        const byId = (id: string): Element => {
          const found = document.getElementById(id) ?? removed.get(id);
          if (found === undefined) throw new Error(`no #${id} on the page`);
          return found;
        };
        for (const operation of operations) {
          if (operation.op === "insert") byId(operation.container).insertAdjacentHTML("beforeend", operation.markup);
          else if (operation.op === "text") byId(operation.id).textContent = operation.text;
          else if (operation.op === "attribute") {
            if (operation.value === null) byId(operation.id).removeAttribute(operation.name);
            else byId(operation.id).setAttribute(operation.name, operation.value);
          } else if (operation.op === "property") (byId(operation.id) as unknown as Record<string, unknown>)[operation.name] = operation.value;
          else if (operation.op === "move") byId(operation.to).append(byId(operation.id));
          else if (operation.op === "remove") {
            const target = byId(operation.id);
            removed.set(operation.id, target);
            target.remove();
          } else (byId(operation.id) as HTMLElement).focus();
        }
      }, operations);
      await settle(page);
    },
    property: (id, name) =>
      page.evaluate(({ id, name }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const value = (element as unknown as Record<string, unknown>)[name];
        return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null;
      }, { id, name }),
    computedIn: (id, inner, property) =>
      page.evaluate(({ id, inner, property }) => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const target = host.shadowRoot?.querySelector(inner);
        return target === null || target === undefined ? "" : getComputedStyle(target).getPropertyValue(property);
      }, { id, inner, property }),
    contentBox: (id, inner) =>
      page.evaluate(({ id, inner }): Bounds => {
        const host = document.getElementById(id);
        if (host === null) throw new Error(`no #${id} on the page`);
        const target = host.shadowRoot?.querySelector(inner);
        if (target === null || target === undefined) return { x: 0, y: 0, width: 0, height: 0 };
        const rect = target.getBoundingClientRect();
        const style = getComputedStyle(target);
        const px = (name: string): number => Number.parseFloat(style.getPropertyValue(name));
        const left = px("border-left-width") + px("padding-left");
        const top = px("border-top-width") + px("padding-top");
        return {
          x: rect.x + left,
          y: rect.y + top,
          width: rect.width - left - px("padding-right") - px("border-right-width"),
          height: rect.height - top - px("padding-bottom") - px("border-bottom-width"),
        };
      }, { id, inner }),
    firstLoad: async (containerId, markup, tag) => {
      // The page's parser-blocking script writes the markup into its container while the document is loading
      // (fixtures/first-load.js, first-load.html, whose container is #c).
      if (containerId !== "c") throw new Error(`firstLoad: the first-load pages' container is #c, not #${containerId}`);
      await page.addInitScript((given) => {
        (globalThis as unknown as { ocelleFirstLoad: unknown }).ocelleFirstLoad = given;
      }, { markup: markup.replaceAll("ocelle-first-load", tag) });
      await driver.liveCapture.startDocument(page.url());
      await settle(page);
    },
    defineSecond: async (tag) => {
      // A second copy's guarded registration, as src/define.ts makes it: a defined tag is left as it is.
      await page.evaluate((tag) => {
        if (customElements.get(tag) === undefined) customElements.define(tag, class extends HTMLElement {});
      }, tag);
    },
    formData: (formId) =>
      page.evaluate((formId) => {
        const form = document.getElementById(formId);
        if (!(form instanceof HTMLFormElement)) throw new Error(`#${formId} is not a form`);
        return [...new FormData(form)].map(([name, value]) => [name, typeof value === "string" ? value : value.name] as [string, string]);
      }, formId),
    submit: async (formId) => {
      if (served === undefined) throw new Error("submit: the driver has no fixture server");
      if (!keyed) {
        await page.evaluate((formId) => {
          const form = document.getElementById(formId);
          if (!(form instanceof HTMLFormElement)) throw new Error(`#${formId} is not a form`);
          const submitter = form.querySelector<HTMLElement>("button:not([type]), button[type=submit], input[type=submit]");
          if (submitter === null) form.requestSubmit();
          else submitter.click();
        }, formId);
      }
      keyed = false;
      const deadline = Date.now() + 1000;
      while (served.submissions().length <= seen && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 20));
      const body = served.submissions()[seen];
      seen = served.submissions().length;
      return body === undefined ? null : ([...new URLSearchParams(body)] as Entries);
    },
    reset: async (formId) => {
      await page.evaluate((formId) => {
        const form = document.getElementById(formId);
        if (!(form instanceof HTMLFormElement)) throw new Error(`#${formId} is not a form`);
        form.reset();
      }, formId);
      await settle(page);
    },
    type: async (id, text) => {
      await page.evaluate((id) => document.getElementById(id)?.focus(), id);
      await page.keyboard.type(text);
      await settle(page);
    },
    press: async (id, key) => {
      await page.evaluate((id) => document.getElementById(id)?.focus(), id);
      keyed = true;
      await page.keyboard.press(key);
      await settle(page);
    },
    blur: async () => {
      await page.evaluate(() => {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        (active as HTMLElement | null)?.blur();
      });
      await settle(page);
    },
    click: async (id, at) => {
      const box = await page.evaluate((id) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y };
      }, id);
      await page.mouse.click(box.x + at.x, box.y + at.y);
      await settle(page);
    },
    focusPath: () =>
      page.evaluate(() => {
        const path: string[] = [];
        let active: Element | null = document.activeElement;
        while (active !== null && active !== document.body) {
          path.push(active.id === "" ? active.localName : `${active.localName}#${active.id}`);
          active = active.shadowRoot?.activeElement ?? null;
        }
        return path;
      }),
    // The phase 3 steps (specs/010-feedback-forms T031 to T033).
    axDetails: async (id) => {
      const session = await page.context().newCDPSession(page);
      try {
        return await axDetails(session, id);
      } finally {
        await session.detach();
      }
    },
    listen: async (ids, types) => {
      await page.evaluate(({ ids, types }) => {
        const holder = globalThis as unknown as { ocelleListening?: (() => void)[]; ocelleHeard?: unknown[] };
        const listening = (holder.ocelleListening ??= []);
        const heard = (holder.ocelleHeard ??= []);
        const plain = (value: unknown): unknown => (typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null);
        const nameOf = (target: EventTarget | null): string => (target instanceof Element ? (target.id === "" ? target.localName : target.id) : "");
        for (const id of ids) {
          const target = document.getElementById(id);
          if (target === null) throw new Error(`no #${id} on the page`);
          for (const type of types) {
            const listener = (event: Event): void => {
              const detail = (event as CustomEvent<unknown>).detail;
              heard.push({
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
      }, { ids, types });
    },
    heard: () =>
      page.evaluate(() => {
        const holder = globalThis as unknown as { ocelleHeard?: unknown[] };
        return (holder.ocelleHeard ?? []).splice(0) as Heard[];
      }),
    validity: (id) =>
      page.evaluate((id): Validity => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const control = element as unknown as { validity?: ValidityState; validationMessage?: string; willValidate?: boolean };
        // An element without a validity (one not upgraded, say) reads as no flag set, no message and not validated.
        const validity = control.validity ?? ({ valid: false, valueMissing: false, typeMismatch: false, patternMismatch: false, tooLong: false, tooShort: false, rangeUnderflow: false, rangeOverflow: false, stepMismatch: false, badInput: false, customError: false });
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
      }, id),
    ids: (id, name) =>
      page.evaluate(({ id, name }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const value = (element as unknown as Record<string, unknown>)[name];
        if (value === null || value === undefined) return [];
        if (value instanceof Element) return [value.id];
        return [...(value as Iterable<Element>)].map((each) => each.id);
      }, { id, name }),
    typeOf: (id, name) =>
      page.evaluate(({ id, name }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        return typeof (element as unknown as Record<string, unknown>)[name];
      }, { id, name }),
    has: (id, name) =>
      page.evaluate(({ id, name }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        return name in element;
      }, { id, name }),
    call: async (id, method, ...args) => {
      const result = await page.evaluate(({ id, method, args }) => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`no #${id} on the page`);
        const value = (element as unknown as Record<string, (...given: unknown[]) => unknown>)[method]?.(...args);
        return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null;
      }, { id, method, args });
      await settle(page);
      return result;
    },
    propertyIn: (id, inner, name) =>
      page.evaluate(({ id, inner, name }) => {
        const target = document.getElementById(id)?.shadowRoot?.querySelector(inner);
        if (target === null || target === undefined) return null;
        const value = (target as unknown as Record<string, unknown>)[name];
        return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? value : null;
      }, { id, inner, name }),
    pseudoIn: (id, inner, pseudo, property) =>
      page.evaluate(({ id, inner, pseudo, property }) => {
        const target = document.getElementById(id)?.shadowRoot?.querySelector(inner);
        return target === null || target === undefined ? "" : getComputedStyle(target, pseudo).getPropertyValue(property);
      }, { id, inner, pseudo, property }),
    navigateAwayAndBack: async () => {
      const record = (): void => {
        addEventListener("pageshow", (event) => {
          (globalThis as unknown as { ocellePageshow: boolean }).ocellePageshow = event.persisted;
        });
      };
      await page.addInitScript(record);
      await page.evaluate(record);
      await page.goto("about:blank");
      await page.goBack({ waitUntil: "load" });
      return page.evaluate(() => (globalThis as unknown as { ocellePageshow?: boolean }).ocellePageshow === true);
    },
  };
  // Every step ends at its own page time, from which `after` measures.
  const step = <T extends (...args: never[]) => Promise<unknown>>(run: T): T =>
    (async (...args: Parameters<T>) => {
      try {
        return await run(...args);
      } finally {
        lastEnd = await now(page).catch(() => lastEnd);
      }
    }) as T;
  for (const [name, run] of Object.entries(driver)) {
    if (typeof run === "function") (driver as unknown as Record<string, unknown>)[name] = step(run as (...args: never[]) => Promise<unknown>);
  }
  const live = driver.liveCapture as unknown as Record<string, (...args: never[]) => Promise<unknown>>;
  for (const name of ["start", "startDocument", "stop"]) {
    const run = live[name];
    if (run !== undefined) live[name] = step(run);
  }
  return driver;
}
