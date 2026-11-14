// The tabbable walk of the overlays (008 research.md R-04; data-model.md § Overlay, Stops): the candidates of an
// overlay's Tab cycle in two orders over its flat tree, open shadow roots and slots followed. Internal, not an entry
// point.
//
// - A **stop** is an element the engine reaches by sequential navigation: focusable with a `tabindex` of 0 or more,
//   rendered (a layout box and a computed `visibility` of `visible`), not `disabled` and not inside an `inert` or
//   `hidden` subtree. A radio group (same `name`, same form owner or tree) is one stop: its checked radio, else its
//   first. An `<iframe>` with a layout box and a media element with `controls` are stops. A rendered element without a
//   `tabindex` whose overflow on an axis is `auto` or `scroll`, that overflows on that axis and holds no stop, is a
//   stop, as the engine's keyboard-focusable scrollers are (Chromium 130 and later).
// - An **opaque** container is a custom element whose `shadowRoot` reads null (a closed root, or none): the walk cannot
//   see into it, records it in its tree position and walks its light children as usual.
// - `flat` is flat-tree order. `order` is the engine's sequential navigation order: the overlay's root, each slot and
//   each open shadow root is a focus navigation scope; within a scope the elements with a positive `tabindex` come
//   first in ascending order (ties in tree order), then the rest in tree order, and a nested scope's order is
//   inserted at its owner's place.

/** A candidate of the Tab cycle: a stop, or an opaque container tried by explicit moves. */
export interface Candidate {
  readonly element: HTMLElement;
  readonly kind: "stop" | "opaque";
}

/** The candidates of a subtree in flat-tree order and in sequential navigation order. */
export interface Walk {
  readonly flat: readonly Candidate[];
  readonly order: readonly Candidate[];
}

/** One entry of a focus navigation scope: a candidate, or a nested scope at its owner's place. */
interface Entry {
  readonly tabIndex: number;
  readonly candidate?: Candidate;
  readonly scope?: Entry[];
}

/** Whether `element` is a custom element whose shadow root the walk cannot read. */
export function isOpaque(element: Element): boolean {
  return element.localName.includes("-") && element.shadowRoot === null;
}

/** Whether `element` is opaque content: an opaque custom element, an `<iframe>`, or a media element with `controls`. */
export function isOpaqueContent(element: Element): boolean {
  return isOpaque(element) || element.localName === "iframe" || isMedia(element);
}

function isMedia(element: Element): boolean {
  return (element.localName === "video" || element.localName === "audio") && element.hasAttribute("controls");
}

/** Whether `element` has a layout box and is visible. */
function rendered(element: Element): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible";
}

/** Whether `element` is focusable by sequential navigation, apart from being rendered. */
function sequential(element: HTMLElement): boolean {
  if (element.matches(":disabled")) return false;
  if (element.localName === "iframe" || isMedia(element)) return true;
  if ((element.localName === "a" || element.localName === "area") && !element.hasAttribute("href")) return element.hasAttribute("tabindex") && element.tabIndex >= 0;
  if (element.localName === "input" && (element as HTMLInputElement).type === "hidden") return false;
  return element.tabIndex >= 0;
}

/** Whether `element` scrolls on an axis where it overflows. */
function scroller(element: HTMLElement): boolean {
  if (element.hasAttribute("tabindex")) return false;
  const style = getComputedStyle(element);
  const scrolls = (value: string): boolean => value === "auto" || value === "scroll";
  return (scrolls(style.overflowX) && element.scrollWidth > element.clientWidth) || (scrolls(style.overflowY) && element.scrollHeight > element.clientHeight);
}

/** The children of `node` in the flat tree: a slot's assigned elements (or its fallback), a host's shadow root's. */
function flatChildren(node: Element | ShadowRoot): Element[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements();
    return assigned.length > 0 ? assigned : [...node.children];
  }
  if (node instanceof Element && node.shadowRoot !== null) return [...node.shadowRoot.children];
  return [...node.children];
}

/** The radio buttons that form one group with `radio`, in its tree. */
function sameGroup(radio: HTMLInputElement, other: HTMLInputElement): boolean {
  return other.name === radio.name && other.form === radio.form && other.getRootNode() === radio.getRootNode();
}

/**
 * Walks `root` (an element or a shadow root, itself not a candidate): its candidates in flat-tree order and in the
 * engine's sequential navigation order.
 */
export function walk(root: Element | ShadowRoot): Walk {
  const flat: Candidate[] = [];
  const radios: HTMLInputElement[] = [];
  /** Visits `element` and its flat subtree into `scope`; returns whether it holds a stop. */
  const visit = (element: Element, scope: Entry[]): boolean => {
    if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) return false;
    if (element.hasAttribute("inert") || element.hasAttribute("hidden")) return false;
    const html = element instanceof HTMLElement ? element : undefined;
    let holds = false;
    const at = flat.length;
    if (html !== undefined && isOpaque(html)) {
      const candidate: Candidate = { element: html, kind: "opaque" };
      flat.push(candidate);
      scope.push({ tabIndex: html.hasAttribute("tabindex") ? html.tabIndex : 0, candidate });
    } else if (html !== undefined && sequential(html) && rendered(html)) {
      if (html instanceof HTMLInputElement && html.type === "radio" && html.name !== "") {
        const group = radios.filter((each) => sameGroup(html, each));
        radios.push(html);
        const chosen = group.find((each) => each.checked);
        const [first] = group;
        if (first === undefined) {
          const candidate: Candidate = { element: html, kind: "stop" };
          flat.push(candidate);
          scope.push({ tabIndex: html.tabIndex, candidate });
        } else if (chosen === undefined && html.checked) {
          // This radio is the group's checked one: it takes the place of the group's first.
          const index = flat.findIndex((each) => each.element === first);
          const candidate: Candidate = { element: html, kind: "stop" };
          if (index >= 0) flat[index] = candidate;
          replace(scopes, first, candidate);
        }
        holds = true;
      } else {
        const candidate: Candidate = { element: html, kind: "stop" };
        flat.push(candidate);
        scope.push({ tabIndex: html.tabIndex, candidate });
        holds = true;
      }
    }
    if (html !== undefined && (html.localName === "iframe" || isMedia(html))) return holds;
    // A slot and an open shadow root are focus navigation scopes of their own, at their owner's place.
    const nested = element instanceof HTMLSlotElement || element.shadowRoot !== null;
    const inner: Entry[] = nested ? [] : scope;
    if (nested) {
      scopes.push(inner);
      scope.push({ tabIndex: 0, scope: inner });
    }
    let inside = false;
    for (const child of flatChildren(element)) inside = visit(child, inner) || inside;
    if (!holds && !inside && html !== undefined && !isOpaque(html) && rendered(html) && scroller(html)) {
      const candidate: Candidate = { element: html, kind: "stop" };
      flat.splice(at, 0, candidate);
      // Before its own (empty) nested scope, if it opened one.
      const index = scope.indexOf(scope.find((each) => each.scope === inner) ?? ({} as Entry));
      const entry: Entry = { tabIndex: 0, candidate };
      if (index >= 0) scope.splice(index, 0, entry);
      else scope.push(entry);
      holds = true;
    }
    return holds || inside;
  };
  const top: Entry[] = [];
  const scopes: Entry[][] = [top];
  const start = root instanceof ShadowRoot ? [...root.children] : flatChildren(root);
  for (const child of start) visit(child, top);
  return { flat, order: ordered(top) };
}

/** Replaces the entry of `element` in any scope with `candidate`. */
function replace(scopes: readonly Entry[][], element: Element, candidate: Candidate): void {
  for (const scope of scopes) {
    const index = scope.findIndex((each) => each.candidate?.element === element);
    if (index >= 0) scope[index] = { tabIndex: candidate.element.tabIndex, candidate };
  }
}

/** A scope's candidates in sequential navigation order: positive `tabindex` first, ascending, then the rest. */
function ordered(scope: readonly Entry[]): Candidate[] {
  const positive = scope.filter((each) => each.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const rest = scope.filter((each) => each.tabIndex <= 0);
  return [...positive, ...rest].flatMap((each) => (each.scope !== undefined ? ordered(each.scope) : each.candidate !== undefined ? [each.candidate] : []));
}

/** The deepest active element of the document, through open shadow roots; null when it is the body or nothing. */
export function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement != null) active = active.shadowRoot.activeElement;
  return active === null || active === document.body || active === document.documentElement ? null : active;
}
