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
  return element instanceof HTMLMediaElement && element.hasAttribute("controls");
}

/** Whether `element` has a layout box and is visible. */
function rendered(element: Element): boolean {
  return element.getClientRects().length > 0 && getComputedStyle(element).visibility === "visible";
}

/**
 * Whether `element` is focusable by sequential navigation, apart from being rendered. An `<a>` without `href` and a
 * media element without `controls` read a `tabIndex` of 0 yet are stops only with a `tabindex` attribute (an
 * `<input type="hidden">` and an `<area>` have no layout box, so they are never rendered stops); an `<iframe>` reads
 * 0 as any other focusable element.
 */
function sequential(element: HTMLElement): boolean {
  if (element.matches(":disabled")) return false;
  if (isMedia(element)) return true;
  if ((element.localName === "a" && !element.hasAttribute("href")) || element instanceof HTMLMediaElement) return element.hasAttribute("tabindex") && element.tabIndex >= 0;
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
export function flatChildren(node: Element): Element[] {
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements();
    return assigned.length > 0 ? assigned : [...node.children];
  }
  if (node.shadowRoot !== null) return [...node.shadowRoot.children];
  return [...node.children];
}

/** The radio buttons that form one group with `radio`, in its tree. */
function sameGroup(radio: HTMLInputElement, other: HTMLInputElement): boolean {
  return other.name === radio.name && other.form === radio.form && other.getRootNode() === radio.getRootNode();
}

/**
 * Walks `root` (an element, itself not a candidate): its candidates in flat-tree order and in the engine's sequential
 * navigation order.
 */
export function walk(root: Element): Walk {
  const flat: Candidate[] = [];
  const radios: HTMLInputElement[] = [];
  /** Visits `element` and its flat subtree into `scope`; returns whether it holds a stop. */
  const visit = (element: Element, scope: Entry[]): boolean => {
    // An element that is not HTML (SVG, MathML) is walked for the HTML inside it (a foreignObject's) and is no
    // candidate; a `hidden` element has no box, nor has its subtree, so only `inert` needs a check.
    if (element.hasAttribute("inert")) return false;
    const html = element instanceof HTMLElement ? element : undefined;
    let holds = false;
    const at = flat.length;
    const mark = scope.length;
    if (html !== undefined && isOpaque(html)) {
      // A host without a `tabindex` reads -1, which orders as 0 does: with the rest, in tree order.
      const candidate: Candidate = { element: html, kind: "opaque" };
      flat.push(candidate);
      scope.push({ tabIndex: html.tabIndex, candidate });
    } else if (html !== undefined && sequential(html) && rendered(html)) {
      if (html instanceof HTMLInputElement && html.type === "radio" && html.name !== "") {
        const group = radios.filter((each) => sameGroup(html, each));
        radios.push(html);
        const [first] = group;
        if (first === undefined) {
          const candidate: Candidate = { element: html, kind: "stop" };
          flat.push(candidate);
          scope.push({ tabIndex: html.tabIndex, candidate });
        } else if (html.checked) {
          // This radio is the group's checked one (a group has one at most): it takes the place of the group's first.
          const candidate: Candidate = { element: html, kind: "stop" };
          flat[flat.findIndex((each) => each.element === first)] = candidate;
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
    // A slot and an open shadow root are focus navigation scopes of their own, at their owner's place.
    const nested = element instanceof HTMLSlotElement || element.shadowRoot !== null;
    const inner: Entry[] = nested ? [] : scope;
    if (nested) {
      scopes.push(inner);
      scope.push({ tabIndex: 0, scope: inner });
    }
    let inside = false;
    for (const child of flatChildren(element)) inside = visit(child, inner) || inside;
    // Stryker disable next-line ConditionalExpression: equivalent, a stop that also scrolls without a tabindex (a textarea) would be listed twice, side by side, which changes neither end of the cycle nor any explicit move (T025, reviews/phase-2/notes.md)
    if (!holds && !inside && html !== undefined && !isOpaque(html) && rendered(html) && scroller(html)) {
      // Before its subtree, in both orders: its nested scope, if it opened one, and any opaque container inside it.
      const candidate: Candidate = { element: html, kind: "stop" };
      flat.splice(at, 0, candidate);
      scope.splice(mark, 0, { tabIndex: 0, candidate });
      holds = true;
    }
    return holds || inside;
  };
  const top: Entry[] = [];
  // The nested scopes, where a radio group can be: the walks start at the panel and at the body part, whose own
  // children (the header, body and footer parts, the end sentinel; the default slot) are no radio buttons.
  const scopes: Entry[][] = [];
  for (const child of flatChildren(root)) visit(child, top);
  return { flat, order: ordered(top) };
}

/** Replaces the entry of `element` in any scope with `candidate`. */
function replace(scopes: readonly Entry[][], element: Element, candidate: Candidate): void {
  for (const scope of scopes) {
    const index = scope.findIndex((each) => each.candidate?.element === element);
    // Stryker disable next-line ConditionalExpression: equivalent, the scopes without the radio give -1, and an assignment at -1 adds a property, no entry, which no array method reads (T025, reviews/phase-2/notes.md)
    if (index >= 0) scope[index] = { tabIndex: candidate.element.tabIndex, candidate };
  }
}

/**
 * A scope's candidates in sequential navigation order: positive `tabindex` first, ascending, then the rest, each in
 * tree order (the sort is stable, and the rest rank alike).
 */
function ordered(scope: readonly Entry[]): Candidate[] {
  const rank = (entry: Entry): number => (entry.tabIndex > 0 ? entry.tabIndex : Number.MAX_SAFE_INTEGER);
  return [...scope].sort((a, b) => rank(a) - rank(b)).flatMap((each) => (each.scope !== undefined ? ordered(each.scope) : each.candidate !== undefined ? [each.candidate] : []));
}

/** The deepest active element of the document, through open shadow roots; null when it is the body or nothing. */
export function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement != null) active = active.shadowRoot.activeElement;
  return active === document.body ? null : active;
}
