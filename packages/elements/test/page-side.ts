// The page side of the 012 driver methods (research.md R-11; contracts/checks.md § Test harness), shared by both
// harnesses: the in-process driver (in-process.ts) calls these functions in the test's own frame, the fixture driver
// (browser/driver.ts) passes them to `page.evaluate`, which runs their source in the fixture page through the DevTools
// protocol (not governed by the page's CSP). So each function is self-contained: it reads nothing from this module or
// any import, only its one argument and the page's globals, and its result is plain data. The recorder's state lives on
// the page's `window`, under one key, so a mount (`resetPage`) ends it.
//
// Nodes are described as the driver's `EventRecord` says: `window`, `document`, `#shadow-root`, or an element's local
// name with `#<id>` when it has one.
import type { Current, EventRecord } from "./scenarios/driver.ts";

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
