// The page side of the 012 driver methods (research.md R-11; contracts/checks.md § Test harness), shared by both
// harnesses: the in-process driver (in-process.ts) calls these functions in the test's own frame, the fixture driver
// (browser/driver.ts) passes them to `page.evaluate`, which runs their source in the fixture page through the DevTools
// protocol (not governed by the page's CSP). So each function is self-contained: it reads nothing from this module or
// any import, only its one argument and the page's globals, and its result is plain data. The recorder's state lives on
// the page's `window`, under one key, so a mount (`resetPage`) ends it.
//
// Nodes are described as the driver's `EventRecord` says: `window`, `document`, `#shadow-root`, or an element's local
// name with `#<id>` when it has one.
import type { Bounds, CharacterBox, Current, EventRecord } from "./scenarios/driver.ts";

/** The recorder's state on the page's `window`. */
interface RecorderState {
  records: EventRecord[];
  serials: WeakMap<Event, number>;
  next: number;
  listening: WeakMap<EventTarget, Set<string>>;
  teardown: (() => void)[];
}

type WithRecorder = Window & { __ocelleRecorder?: RecorderState };

/** Ends every recorder listener and `preventNext`, and starts a new record with serial 1 (each mount calls it). */
export function resetPage(): void {
  const page = window as WithRecorder;
  for (const end of page.__ocelleRecorder?.teardown ?? []) end();
  page.__ocelleRecorder = { records: [], serials: new WeakMap(), next: 1, listening: new WeakMap(), teardown: [] };
}

/** Adds the bubble-phase recorder for `types` at the element `id`, its ancestors, `document` and `window` (each once). */
export function recordEvents({ id, types }: { readonly id: string; readonly types: readonly string[] }): void {
  const page = window as WithRecorder;
  const state = page.__ocelleRecorder ?? { records: [], serials: new WeakMap(), next: 1, listening: new WeakMap(), teardown: [] };
  page.__ocelleRecorder = state;
  const describe = (node: unknown): string | null => {
    if (node === window) return "window";
    if (node === document) return "document";
    if (node instanceof ShadowRoot) return "#shadow-root";
    if (node instanceof Element) return node.id === "" ? node.localName : `${node.localName}#${node.id}`;
    return null;
  };
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  const nodes: EventTarget[] = [];
  for (let node: Element | null = element; node !== null; node = node.parentElement) nodes.push(node);
  nodes.push(document, window);
  for (const node of nodes) {
    const seen = state.listening.get(node) ?? new Set<string>();
    state.listening.set(node, seen);
    for (const type of types) {
      if (seen.has(type)) continue;
      seen.add(type);
      const at = describe(node) ?? "";
      const listener = (event: Event): void => {
        let serial = state.serials.get(event);
        if (serial === undefined) {
          serial = state.next;
          state.next += 1;
          state.serials.set(event, serial);
        }
        const detail = (event as Event & { detail?: unknown }).detail;
        state.records.push({
          type: event.type,
          at,
          target: describe(event.target),
          isTrusted: event.isTrusted,
          bubbles: event.bubbles,
          composed: event.composed,
          cancelable: event.cancelable,
          defaultPrevented: event.defaultPrevented,
          detail: detail ?? null,
          serial,
        });
      };
      node.addEventListener(type, listener);
      state.teardown.push(() => {
        node.removeEventListener(type, listener);
      });
    }
  }
}

/** The records since the last call (or reset), emptied. */
export function takeRecords(): EventRecord[] {
  const state = (window as WithRecorder).__ocelleRecorder;
  if (state === undefined) return [];
  return state.records.splice(0, state.records.length);
}

/** A capture-phase listener on `window` that prevents the next event of `type` before any other listener sees it. */
export function preventNextEvent(type: string): void {
  const page = window as WithRecorder;
  const listener = (event: Event): void => {
    event.preventDefault();
  };
  window.addEventListener(type, listener, { capture: true, once: true });
  page.__ocelleRecorder?.teardown.push(() => {
    window.removeEventListener(type, listener, { capture: true });
  });
}

/** Calls the element `id`'s own `click()` method (012 phase 2). */
export function clickElement(id: string): void {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  element.click();
}

/** Focuses the element `id`. */
export function focusElement(id: string): void {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  element.focus();
}

/** The focused element in the shadow root of the element `id`, described, or null. */
export function activeInnerOf(id: string): string | null {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  const active = element.shadowRoot?.activeElement ?? null;
  if (active === null) return null;
  return active.id === "" ? active.localName : `${active.localName}#${active.id}`;
}

/** The path of focused elements, from the document's active element through each shadow root's; empty when none (body). */
export function activePath(): string[] {
  const path: string[] = [];
  let active: Element | null = document.activeElement;
  if (active === document.body) return path;
  while (active !== null) {
    path.push(active.id === "" ? active.localName : `${active.localName}#${active.id}`);
    active = active.shadowRoot?.activeElement ?? null;
  }
  return path;
}

/** The id of the focus order's starting point (`startOrder`). */
export const sentinelId = "ocelle-harness-sentinel";

/** Puts an unfocusable-by-Tab starting point at the start (or with `reverse` the end) of the body and focuses it. */
export function startOrder(reverse: boolean): void {
  const sentinel = document.createElement("span");
  sentinel.id = "ocelle-harness-sentinel";
  sentinel.tabIndex = -1;
  if (reverse) document.body.append(sentinel);
  else document.body.prepend(sentinel);
  sentinel.focus();
}

/** Focuses the starting point again, so focus is back in this page, and removes it. */
export function endOrder(): void {
  const sentinel = document.getElementById("ocelle-harness-sentinel");
  sentinel?.focus();
  sentinel?.remove();
}

/** The computed value of `property` of the element `id`, or of its shadow element `inner`. */
export function computedOf({ id, property, inner }: { readonly id: string; readonly property: string; readonly inner?: string | undefined }): string {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  const target = inner === undefined ? element : element.shadowRoot?.querySelector(inner);
  if (target === null || target === undefined) throw new Error(`no ${String(inner)} in the shadow root of #${id}`);
  return getComputedStyle(target).getPropertyValue(property);
}

/** The `aria-current` attribute and reflection of the element `id`, or of its shadow element `inner`. */
export function currentOf({ id, inner }: { readonly id: string; readonly inner?: string | undefined }): Current {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  const target = inner === undefined ? element : element.shadowRoot?.querySelector(inner);
  if (target === null || target === undefined) throw new Error(`no ${String(inner)} in the shadow root of #${id}`);
  return { attribute: target.getAttribute("aria-current"), property: target.ariaCurrent };
}

/**
 * Copies the live DOM (012 phase 3, US2-13): `outerHTML` parses the element `id`'s `outerHTML` into the container
 * `into`; `clone` appends the element's `cloneNode(true)` to it; `innerHTML` writes the container `id`'s `innerHTML`
 * into it. Every element of the copy that has an id gets `-<into>` appended to it, so the copy is reached by its own id.
 */
export function copyElement({ id, via, into }: { readonly id: string; readonly via: "outerHTML" | "clone" | "innerHTML"; readonly into: string }): void {
  const element = document.getElementById(id);
  const container = document.getElementById(into);
  if (element === null || container === null) throw new Error(`no #${id} or #${into} on the page`);
  const rename = (root: Element): void => {
    for (const each of [root, ...root.querySelectorAll("[id]")]) if (each.id !== "") each.id = `${each.id}-${into}`;
  };
  if (via === "clone") {
    const copy = element.cloneNode(true) as Element;
    rename(copy);
    container.append(copy);
    return;
  }
  const before = container.children.length;
  container.insertAdjacentHTML("beforeend", via === "outerHTML" ? element.outerHTML : element.innerHTML);
  for (const added of [...container.children].slice(before)) rename(added);
}

/**
 * Applies a morph's attribute sync to the element `id` (012 phase 3, US2-13; research.md R-03, idiomorph's
 * `syncNodeFrom`): the first element of `markup` is the new node; each of its attributes whose value differs on the live
 * element is set, then each live attribute the new node lacks is removed, counting down from the last attribute.
 */
export function morphElement({ id, markup }: { readonly id: string; readonly markup: string }): void {
  const element = document.getElementById(id);
  if (element === null) throw new Error(`no #${id} on the page`);
  const template = document.createElement("template");
  template.innerHTML = markup;
  const incoming = template.content.firstElementChild;
  if (incoming === null) throw new Error("no element in the markup");
  for (const attribute of [...incoming.attributes]) if (element.getAttribute(attribute.name) !== attribute.value) element.setAttribute(attribute.name, attribute.value);
  for (let at = element.attributes.length - 1; at >= 0; at -= 1) {
    const attribute = element.attributes[at];
    if (attribute !== undefined && !incoming.hasAttribute(attribute.name)) element.removeAttribute(attribute.name);
  }
}

// 020 phase 2 (contracts/checks.md § Driver additions; tasks.md T023): the shadow copy's selections and the readers of
// the break-position, visual-order and line-start oracles.

/** The value the copy methods put on the clipboard before each copy, so a copy that put nothing there is seen. */
export const copySentinel = "ocelle-copy-sentinel";

/** Adds a scratch field holding the sentinel, focused with its text selected, for a user copy that puts it on the clipboard. */
export function selectSentinel(sentinel: string): void {
  const field = document.createElement("textarea");
  field.id = "ocelle-driver-sentinel";
  field.value = sentinel;
  document.body.append(field);
  field.focus();
  field.select();
}

/** Removes the sentinel's scratch field and empties the selection. */
export function dropSentinel(): void {
  document.getElementById("ocelle-driver-sentinel")?.remove();
  getSelection()?.removeAllRanges();
}

/**
 * Selects from before the element child `from` to after the element child `to` of the first element matching `inner` in
 * the shadow root of the element `id` (`setBaseAndExtent` over its child nodes).
 */
export function selectShadowRun({ id, inner, from, to }: { readonly id: string; readonly inner: string; readonly from: number; readonly to: number }): void {
  const target = document.getElementById(id)?.shadowRoot?.querySelector(inner);
  if (target === null || target === undefined) throw new Error(`no ${inner} in the shadow root of #${id}`);
  const first = target.children[from];
  const last = target.children[to];
  if (first === undefined || last === undefined) throw new Error(`no element children ${String(from)} to ${String(to)} in ${inner} of #${id}`);
  const nodes = [...target.childNodes];
  getSelection()?.setBaseAndExtent(target, nodes.indexOf(first), target, nodes.indexOf(last) + 1);
}

/** The client rects of every element matching `inner` in the shadow root of the element `id`, in tree order. */
export function shadowClientRects({ id, inner }: { readonly id: string; readonly inner: string }): Bounds[][] {
  const root = document.getElementById(id)?.shadowRoot;
  if (root === null || root === undefined) throw new Error(`no shadow root on #${id}`);
  return [...root.querySelectorAll(inner)].map((each) => [...each.getClientRects()].map((rect) => ({ x: rect.x, y: rect.y, width: rect.width, height: rect.height })));
}

/** Each code point of the text under the first element matching `inner` in the shadow root of the element `id`, with the box of a range over it. */
export function characterBoxes({ id, inner }: { readonly id: string; readonly inner: string }): CharacterBox[] {
  const target = document.getElementById(id)?.shadowRoot?.querySelector(inner);
  if (target === null || target === undefined) throw new Error(`no ${inner} in the shadow root of #${id}`);
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const found: CharacterBox[] = [];
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const data = (node as Text).data;
    let offset = 0;
    for (const text of data) {
      const range = document.createRange();
      range.setStart(node, offset);
      range.setEnd(node, offset + text.length);
      const rect = range.getBoundingClientRect();
      found.push({ text, x: rect.x, y: rect.y, width: rect.width, height: rect.height });
      offset += text.length;
    }
  }
  return found;
}
