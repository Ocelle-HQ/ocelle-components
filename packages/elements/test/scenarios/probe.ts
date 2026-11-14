// The page-side probe of the driver additions of 008 (research.md R-14; tasks.md T005): what both harnesses read in the
// page, written once. `installProbe` is self-contained, so the in-process driver (test/in-process.ts) calls it in the
// test's frame and the fixture driver (test/browser/driver.ts) passes it to `page.evaluate`; it installs
// `globalThis.ocelleProbe` once per page.
//
// - FR-047's counts are a delta from the last `reset()` (each `mount`), taken by one MutationObserver over the document
//   and every shadow root, open or closed, including roots attached later (`Element.prototype.attachShadow` is wrapped
//   at install): every element whose `style` attribute is written, every element (or descendant of one) that carries a
//   `style` attribute when it is added, and every `<style>` element added is remembered, so a write removed again is
//   still counted. Elements the driver writes itself (`ignore`, the colour probe of
//   `resolveColour`) are left out.
// - The top layer's order is kept from the synchronous `beforetoggle` events of dialogs and popovers, listened to in
//   the capture phase on the document and every shadow root; an open element the probe did not see open is placed
//   after the ones it saw, in tree order.
// - An element is named by its `id`, or by its local name when it has none; an element inside a shadow root (open or
//   closed) or a frame is written after its host's name in brackets: `ov[in]`, `fr[f1]`, `a[b[c]]`.
// Nothing the probe reads writes to the page (`getAnimations()`, `matches()`, `getBoundingClientRect()`).
import type { AnimationRecord, Device, RecordedEvent, TopLayerEntry } from "./driver.ts";

/** What `installProbe` puts on `globalThis.ocelleProbe`. */
export interface Probe {
  /** Starts a new count, top-layer order and event record, and removes the record's listeners. */
  readonly reset: () => void;
  /** Leaves `element`'s `style` writes out of the count (the driver's own probes). */
  readonly ignore: (element: Element) => void;
  readonly styleAttributes: () => number;
  readonly styleElements: () => number;
  readonly topLayer: () => TopLayerEntry[];
  readonly focusPath: () => string;
  readonly focusVisible: (id: string, inner?: string) => boolean;
  readonly record: (id: string, names: readonly string[]) => void;
  readonly recorded: () => RecordedEvent[];
  readonly animations: (id: string, inner?: string) => AnimationRecord[];
  readonly device: () => Device;
  /** The centre of the border box of the element with `id`, or of `inner` in its shadow root, in the frame's coordinates. */
  readonly centre: (id: string, inner?: string) => { x: number; y: number };
}

/** Installs `globalThis.ocelleProbe` in this page, once. Self-contained: it may use nothing from outside its body. */
export function installProbe(): void {
  const scope = globalThis as unknown as { ocelleProbe?: Probe };
  if (scope.ocelleProbe !== undefined) return;
  const roots: (Document | ShadowRoot)[] = [document];
  const closed = new WeakMap<Element, ShadowRoot>();
  const ignored = new WeakSet<Element>();
  const styled = new Set<Element>();
  const added = new Set<Element>();
  let order: Element[] = [];
  let events: RecordedEvent[] = [];
  let unlisten: (() => void)[] = [];

  const take = (records: readonly MutationRecord[]): void => {
    for (const record of records) {
      if (record.type === "attributes") {
        const target = record.target as Element;
        if (!ignored.has(target)) styled.add(target);
      }
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        const element = node as Element;
        if (element.localName === "style") added.add(element);
        for (const inside of element.querySelectorAll("style")) added.add(inside);
        // A write made while the element was detached (Lit's first render commits into a detached fragment) gives no
        // attribute record, so an element that carries `style` when it is added counts, and so does each descendant.
        if (element.hasAttribute("style") && !ignored.has(element)) styled.add(element);
        for (const inside of element.querySelectorAll("[style]")) if (!ignored.has(inside)) styled.add(inside);
      }
    }
  };
  const observer = new MutationObserver(take);
  const toggled = (event: Event): void => {
    const target = event.target as Element;
    order = order.filter((each) => each !== target);
    if ((event as ToggleEvent).newState === "open") order.push(target);
  };
  const watch = (root: Document | ShadowRoot): void => {
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
    root.addEventListener("beforetoggle", toggled, true);
  };
  watch(document);
  const attach = Object.getOwnPropertyDescriptor(Element.prototype, "attachShadow")?.value as (this: Element, init: ShadowRootInit) => ShadowRoot;
  Element.prototype.attachShadow = function attachShadow(this: Element, init: ShadowRootInit): ShadowRoot {
    const root = attach.call(this, init);
    roots.push(root);
    if (init.mode === "closed") closed.set(this, root);
    watch(root);
    return root;
  };

  const shadowOf = (host: Element): ShadowRoot | null => host.shadowRoot ?? closed.get(host) ?? null;
  const byId = (id: string): HTMLElement => {
    const found = document.getElementById(id);
    if (found === null) throw new Error(`no #${id} on the page`);
    return found;
  };
  const target = (id: string, inner?: string): Element | null => {
    const host = byId(id);
    return inner === undefined ? host : (shadowOf(host)?.querySelector(inner) ?? null);
  };
  const nameOf = (element: Element): string => (element.id === "" ? element.localName : element.id);
  const format = (names: readonly string[]): string => names.reduceRight((inner, name) => (inner === "" ? name : `${name}[${inner}]`), "");
  const pathOf = (element: Element): string => {
    const names = [nameOf(element)];
    let node: Element = element;
    for (;;) {
      const root = node.getRootNode();
      const frame = root === document ? null : ((root as Document).defaultView?.frameElement ?? null);
      if (root.nodeType === 11) node = (root as ShadowRoot).host;
      else if (frame !== null) node = frame;
      else break;
      names.unshift(nameOf(node));
    }
    return format(names);
  };
  /** The active element inside `element`'s shadow root or frame document, or null. */
  const innerActive = (element: Element): Element | null => {
    const inShadow = shadowOf(element)?.activeElement ?? null;
    if (inShadow !== null) return inShadow;
    const frameDocument = element.localName === "iframe" ? (element as HTMLIFrameElement).contentDocument : null;
    const inFrame = frameDocument?.activeElement ?? null;
    return inFrame === frameDocument?.body || inFrame === frameDocument?.documentElement ? null : inFrame;
  };
  const focusPath = (): string => {
    const first = document.activeElement;
    if (first === null || first === document.body || first === document.documentElement) return "body";
    const names = [nameOf(first)];
    for (let active = innerActive(first); active !== null; active = innerActive(active)) names.push(nameOf(active));
    return format(names);
  };
  const isOpen = (element: Element): boolean => element.isConnected && (element.matches(":modal") || element.matches(":popover-open"));

  scope.ocelleProbe = {
    reset: () => {
      observer.takeRecords();
      styled.clear();
      added.clear();
      order = [];
      events = [];
      for (const remove of unlisten) remove();
      unlisten = [];
    },
    ignore: (element) => {
      ignored.add(element);
    },
    styleAttributes: () => {
      take(observer.takeRecords());
      return styled.size;
    },
    styleElements: () => {
      take(observer.takeRecords());
      return added.size;
    },
    topLayer: () => {
      const seen = order.filter(isOpen);
      const live = roots.filter((root) => root === document || (root as ShadowRoot).host.isConnected);
      const rest = live.flatMap((root) => [...root.querySelectorAll("*")]).filter((each) => isOpen(each) && !seen.includes(each));
      return [...seen, ...rest].map((each) => ({ element: pathOf(each), modal: each.matches(":modal"), popoverOpen: each.matches(":popover-open") }));
    },
    focusPath,
    focusVisible: (id, inner) => target(id, inner)?.matches(":focus-visible") ?? false,
    record: (id, names) => {
      const host = byId(id);
      const listener = (event: Event): void => {
        const dialog = shadowOf(host)?.querySelector("dialog") ?? null;
        const open = (host as unknown as { open?: unknown }).open;
        const detail = event instanceof CustomEvent ? (event.detail as unknown) : undefined;
        events.push({
          type: event.type,
          detail: detail === undefined ? null : (JSON.parse(JSON.stringify(detail)) as unknown),
          cancelable: event.cancelable,
          bubbles: event.bubbles,
          composed: event.composed,
          open: typeof open === "boolean" ? open : null,
          dialogOpen: dialog?.open ?? false,
          modal: dialog?.matches(":modal") ?? false,
          focusPath: focusPath(),
        });
      };
      for (const name of names) {
        host.addEventListener(name, listener);
        unlisten.push(() => {
          host.removeEventListener(name, listener);
        });
      }
    },
    recorded: () => events.map((each) => ({ ...each })),
    animations: (id, inner) => {
      const element = target(id, inner);
      if (element === null) return [];
      return element.getAnimations().map((animation) => {
        const effect = animation.effect as KeyframeEffect | null;
        const timing = effect?.getTiming();
        const keyframes = (effect?.getKeyframes() ?? []).map((frame) => {
          const properties = Object.fromEntries(Object.entries(frame).filter(([key]) => !["offset", "computedOffset", "easing", "composite"].includes(key))) as Record<string, string>;
          return { offset: frame.computedOffset, easing: frame.easing, ...properties };
        });
        const duration = timing?.duration;
        return { duration: typeof duration === "number" ? duration : String(duration ?? "auto"), easing: timing?.easing ?? "linear", playState: animation.playState, keyframes };
      });
    },
    device: () => ({
      hover: matchMedia("(hover: hover)").matches,
      pointerFine: matchMedia("(pointer: fine)").matches,
      maxTouchPoints: navigator.maxTouchPoints,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    }),
    centre: (id, inner) => {
      const element = target(id, inner);
      if (element === null) throw new Error(`no ${inner ?? ""} in #${id}`);
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    },
  };
}

/** The probe of this page (in process), installed on first use. */
export function probe(): Probe {
  installProbe();
  const installed = (globalThis as unknown as { ocelleProbe?: Probe }).ocelleProbe;
  if (installed === undefined) throw new Error("the probe did not install");
  return installed;
}
