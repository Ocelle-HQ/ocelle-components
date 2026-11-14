// The overflow-region module (009 FR-001 to FR-011, FR-014; contracts/overflow-region.md; research.md R-01 to R-07,
// R-13; data-model.md § Overflow-region state): any element's scroll box becomes a tab stop, and with a name a node of
// the host's role (`group` by default, `region` for the board), only while it overflows. The module reads the box's
// edge state, scrolls it 40 px per unmodified arrow key with an instant write, keeps a keyboard-focused slotted
// control's ring box clear of the fades (or suppresses the fade it cannot clear), and hands focus over when overflow
// ends while the box has it. Its effects are on the scroll box and the host's own shadow nodes only, never on the host;
// it emits no event. The mask's block figures are measured layout figures, set in one per-instance constructed
// stylesheet adopted after the host's shared sheets (never a `style` attribute). Internal, not an entry point: the
// README's element conventions document this interface, and changing it changes every element that uses it.
import { css } from "lit";
import type { ReactiveController, ReactiveControllerHost } from "lit";

/** The edge state of a scroll box (spec § Overflow): more than 1 px of content off-screen counts. */
export interface EdgeState {
  readonly overflowing: boolean;
  readonly offStart: boolean;
  readonly offEnd: boolean;
}

/** An inline span of the viewport, in CSS px from its left edge. */
export interface Span {
  readonly left: number;
  readonly right: number;
}

/** The scroll box for the clearance: its client area's edges in the viewport, and its scroll metrics. */
export interface ClearanceBox extends Span {
  readonly scrollLeft: number;
  readonly scrollWidth: number;
  readonly clientWidth: number;
}

/** What `clearanceScroll` reads: the focused control's ring box, the box, the fade depth and the box's direction. */
export interface ClearanceInput {
  readonly ring: Span;
  readonly box: ClearanceBox;
  readonly fade: number;
  readonly direction: "ltr" | "rtl";
}

/** The `scrollLeft` that clears the ring box, and the fades it could not clear (the focus fallback, R-06). */
export interface Clearance {
  readonly scrollLeft: number;
  readonly suppressStart: boolean;
  readonly suppressEnd: boolean;
}

/**
 * The edge state at a scroll position: overflowing when the content is more than 1 px wider than the box, and content
 * off-screen at the start or the end when more than 1 px of it is. `scrollLeft` is negative under `rtl`, so its
 * distance from the start is its absolute value.
 */
export function edgeState(scrollLeft: number, scrollWidth: number, clientWidth: number): EdgeState {
  const range = scrollWidth - clientWidth;
  const scrolled = Math.abs(scrollLeft);
  return { overflowing: range > 1, offStart: scrolled > 1, offEnd: range - scrolled > 1 };
}

/**
 * The smallest scroll that leaves the ring box at least the fade depth from each inline edge that still fades at the
 * new position (an edge within 1 px of its end does not fade, so a ring box near an end goes to that end). When no
 * position does, the ring box's inline start is aligned with the box's, and each side whose fade would cover it is
 * reported as suppressed (R-06).
 */
export function clearanceScroll({ ring, box, fade, direction }: ClearanceInput): Clearance {
  const range = box.scrollWidth - box.clientWidth;
  const at = Math.abs(box.scrollLeft);
  // The ring box in content coordinates, measured from the inline start.
  const start = (direction === "ltr" ? ring.left - box.left : box.right - ring.right) + at;
  const end = (direction === "ltr" ? ring.right - box.left : box.right - ring.left) + at;
  const fadesStart = (position: number): boolean => position > 1;
  const fadesEnd = (position: number): boolean => range - position > 1;
  const startRoom = (position: number): number => position + (fadesStart(position) ? fade : 0);
  const endRoom = (position: number): number => position + box.clientWidth - (fadesEnd(position) ? fade : 0);
  const clear = (position: number): boolean => start >= startRoom(position) && end <= endRoom(position);
  let position = at;
  if (start < startRoom(at)) position = start - fade > 1 ? start - fade : 0;
  else if (end > endRoom(at)) position = end - box.clientWidth + fade < range - 1 ? end - box.clientWidth + fade : range;
  let suppressStart = false;
  let suppressEnd = false;
  if (!clear(position)) {
    position = Math.min(Math.max(start, 0), range);
    suppressStart = fadesStart(position) && start < position + fade;
    suppressEnd = fadesEnd(position) && end > position + box.clientWidth - fade;
  }
  return { scrollLeft: direction === "ltr" ? position : 0 - position, suppressStart, suppressEnd };
}

/** The name in force: the host's non-blank `aria-label`, trimmed, else the trimmed non-blank label, else none (R-01). */
export function resolveName(hostAriaLabel: string | null, label: string | undefined): string | undefined {
  const host = hostAriaLabel?.trim() ?? "";
  if (host !== "") return host;
  const own = label?.trim() ?? "";
  return own === "" ? undefined : own;
}

/** The options of an `OverflowRegion`. */
export interface OverflowRegionOptions {
  /** The scroll box, an element in the host's shadow root, read after each update. */
  readonly box: () => HTMLElement | null;
  /** The role the box takes while it overflows and has a name: `group` by default, `region` for the board. */
  readonly role?: "group" | "region";
  /** The px the box scrolls per arrow key: 40 by default. */
  readonly step?: number;
}

/**
 * The module's shared stylesheet, for the contract's structure: `.region-frame` holds `.region-box` (its
 * `.region-track` holds the content), then `.region-ring` and the two `.region-edge` elements. The box keeps the
 * platform's scrollbar and the ring room in its block padding; the track's inline padding is the ring room before the
 * first and after the last item. The fades are a two-layer mask selected on the three `data-fade` values only, and
 * mirrored under `rtl`; the module's per-instance sheet sizes the layers. The ring overlay draws the box's ring and the
 * frame's handover ring over the masked box; the edge elements measure the fade depth and draw the forced-colours
 * lines.
 */
export const overflowRegionStyles = css`
  .region-frame {
    position: relative;
    outline: none;
  }

  .region-box {
    overflow-x: auto;
    overflow-y: hidden;
    border: 0;
    padding-block: calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width));
    outline: none;
  }

  .region-track {
    inline-size: max-content;
    min-inline-size: 100%;
    box-sizing: border-box;
    padding-inline: calc(var(--ocelle-focus-offset) + var(--ocelle-focus-width));
  }

  .region-ring,
  .region-edge {
    position: absolute;
    inset-block-start: 0;
    pointer-events: none;
  }

  /* The ring overlay is laid out only while it shows a ring, so at rest it overlaps no content. */
  .region-ring {
    display: none;
    inset-block-end: 0;
    inset-inline: 0;
  }

  .region-box:focus-visible ~ .region-ring,
  .region-frame:focus-visible > .region-ring {
    display: block;
    outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
    outline-offset: calc(var(--ocelle-focus-width) * -1);
  }

  /* The edges measure the fade depth with their inline size; they take the box's block size only to draw a line. */
  .region-edge {
    inline-size: var(--ocelle-scroller-fade-size);
    block-size: 0;
    box-sizing: border-box;
  }

  .region-edge.start {
    inset-inline-start: 0;
  }

  .region-edge.end {
    inset-inline-end: 0;
  }

  @media not (forced-colors: active) {
    .region-box[data-fade="start"],
    .region-box[data-fade="end"],
    .region-box[data-fade="both"] {
      mask-position: left top, left bottom;
      mask-origin: border-box;
      mask-clip: border-box;
      mask-repeat: no-repeat;
      mask-composite: add;
    }

    .region-box[data-fade="start"],
    :host(:dir(rtl)) .region-box[data-fade="end"] {
      mask-image: linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size)), linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink));
    }

    .region-box[data-fade="end"],
    :host(:dir(rtl)) .region-box[data-fade="start"] {
      mask-image: linear-gradient(to left, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size)), linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink));
    }

    .region-box[data-fade="both"] {
      mask-image:
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size), var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink));
    }
  }

  @media (forced-colors: active) {
    .region-edge {
      block-size: 100%;
    }

    .region-box:focus-visible ~ .region-ring,
    .region-frame:focus-visible > .region-ring {
      outline-color: Highlight;
    }

    .region-box[data-fade="start"] ~ .region-edge.start,
    .region-box[data-fade="both"] ~ .region-edge.start {
      border-inline-start: var(--ocelle-border-width) solid CanvasText;
    }

    .region-box[data-fade="end"] ~ .region-edge.end,
    .region-box[data-fade="both"] ~ .region-edge.end {
      border-inline-end: var(--ocelle-border-width) solid CanvasText;
    }
  }
`;

/** Whether an element or one of its ancestors, across shadow boundaries, is `inert`. */
function inertAncestor(element: Element): boolean {
  for (let node: Element | null = element; node !== null; node = node.parentElement ?? ((node.getRootNode() as Partial<ShadowRoot>).host ?? null)) {
    if ((node as HTMLElement).inert) return true;
  }
  return false;
}

/** Whether an element takes focus by itself: in the tab order, not disabled, not inert, with a box, not invisible. */
function focusable(element: HTMLElement): boolean {
  return element.tabIndex >= 0 && !element.matches(":disabled") && !inertAncestor(element) && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}

/**
 * The element children of a node in the flat tree: a slot's assigned elements (a slot assigned to a slot is walked in
 * turn, so the chain is flattened), else its children.
 */
function flatChildren(node: Element | ShadowRoot): Element[] {
  return node instanceof HTMLSlotElement ? node.assignedElements() : [...node.children];
}

/**
 * The first focusable element of `elements` and their flat-tree descendants, in tree order (R-07): a shadow host's
 * open shadow root is searched instead of its light children, and a host that delegates focus counts when its shadow
 * root holds a focusable element.
 */
function firstFocusable(elements: readonly Element[]): HTMLElement | undefined {
  for (const element of elements) {
    if (element instanceof HTMLElement && focusable(element)) return element;
    const root = element.shadowRoot;
    const inner = firstFocusable(flatChildren(root ?? element));
    if (inner !== undefined) return root?.delegatesFocus === true && element instanceof HTMLElement ? element : inner;
  }
  return undefined;
}

/** The overflow-region controller (contracts/overflow-region.md). */
export class OverflowRegion implements ReactiveController {
  // The outputs start as a box that fits. No frame paints them: the host's first update observes the box, and the
  // observer's first delivery writes the state before the first paint (R-03).
  /** Whether the box's content is more than 1 px wider than the box. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint
  overflowing = false;
  /** Whether content is off-screen at the box's inline start. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint
  offStart = false;
  /** Whether content is off-screen at the box's inline end. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint
  offEnd = false;
  /** Whether the inline start fades: content off-screen there, and not suppressed by the focus fallback. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint
  fadeStart = false;
  /** Whether the inline end fades: content off-screen there, and not suppressed by the focus fallback. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint
  fadeEnd = false;
  /** The name in force: the host's non-blank `aria-label`, else the label, trimmed; undefined without one. */
  name: string | undefined;

  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #boxOf: () => HTMLElement | null;
  readonly #role: "group" | "region";
  readonly #step: number;
  readonly #sheet = new CSSStyleSheet();
  readonly #observer = new ResizeObserver(() => {
    this.#measure();
  });

  #box: HTMLElement | null = null;
  #label: string | undefined;
  /** The fades the focus fallback suppresses, the focused control they are for, and the `scrollLeft` written then. */
  #suppressed = { start: false, end: false };
  #focused: EventTarget | undefined;
  // Stryker disable next-line NumberLiteral: equivalent, it is read only while a suppression is set, and the fallback writes it then
  #written = 0;
  /** The mask figures last set: the box's client height and its scrollbar's thickness. */
  // Stryker disable next-line StringLiteral: equivalent, no measured figures are the empty text, so the first measure writes them either way
  #figures = "";

  constructor(host: ReactiveControllerHost & HTMLElement, options: OverflowRegionOptions) {
    this.#host = host;
    this.#boxOf = options.box;
    this.#role = options.role ?? "group";
    this.#step = options.step ?? 40;
    this.#sheet.replaceSync(".region-box {}");
    host.addController(this);
  }

  /** The `data-fade` value of the fade state: `start`, `end`, `both`, or undefined when neither side fades. */
  get fadeAttribute(): "start" | "end" | "both" | undefined {
    if (this.fadeStart) return this.fadeEnd ? "both" : "start";
    return this.fadeEnd ? "end" : undefined;
  }

  /**
   * Sets the host's label, raw; the module trims it, and blank counts as none. The host calls it after each update, so
   * the box's role and name also follow a change of the host's `aria-label`, which the host observes.
   */
  setLabel(label: string | undefined): void {
    this.#label = label;
    this.#apply();
  }

  hostConnected(): void {
    const root = this.#host.shadowRoot;
    if (root !== null && !root.adoptedStyleSheets.includes(this.#sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.#sheet];
    // Adding the same listener again is a no-op, so a host that connects again keeps one of each.
    this.#host.addEventListener("keydown", this.#onKey);
    this.#host.addEventListener("focusin", this.#onFocusIn);
    this.#host.addEventListener("focusout", this.#onFocusOut);
    if (this.#box !== null) this.#follow(this.#box);
  }

  hostUpdated(): void {
    const box = this.#boxOf();
    if (box === this.#box) return;
    this.#box = box;
    if (box !== null) this.#follow(box);
  }

  hostDisconnected(): void {
    // Stryker disable next-line all: equivalent, a disconnected host gets no event, and connecting again observes the box afresh
    this.#observer.disconnect();
  }

  /** Observes the box (its border box, so a scrollbar that comes or goes is seen) and its track, and listens to it. */
  #follow(box: HTMLElement): void {
    // Stryker disable next-line ObjectLiteral: in process the scrollbar is an overlay of 0 px, so the border box and the content box change together; the classic scrollbar case is test/browser/scrollbar.test.ts (elements-browser, not mutated)
    this.#observer.observe(box, { box: "border-box" });
    const track = box.querySelector(".region-track");
    if (track !== null) this.#observer.observe(track);
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent, a passive listener only promises not to call preventDefault, which this one never does
    box.addEventListener("scroll", this.#onScroll, { passive: true });
    // Stryker disable next-line StringLiteral: equivalent, a slot change that changes the content's width also resizes the track, which the observer sees, and one that does not leaves the state as it is
    box.addEventListener("slotchange", this.#onSlotChange);
    box.closest(".region-frame")?.addEventListener("focusout", this.#onFrameOut);
  }

  /**
   * Reads the box and writes the state, in the callback that observed the change (R-03): the outputs, the box's
   * attributes, the mask figures and, when overflow ends on the focused box, the focus handover. The host updates only
   * when an output changed.
   */
  #measure(): void {
    const box = this.#box;
    if (box === null) return;
    const outputs = (): string => [this.overflowing, this.offStart, this.offEnd, this.fadeStart, this.fadeEnd].join();
    const before = outputs();
    const state = edgeState(box.scrollLeft, box.scrollWidth, box.clientWidth);
    const focused = this.#host.shadowRoot?.activeElement === box;
    this.overflowing = state.overflowing;
    this.offStart = state.offStart;
    this.offEnd = state.offEnd;
    this.fadeStart = state.offStart && !this.#suppressed.start;
    this.fadeEnd = state.offEnd && !this.#suppressed.end;
    const figures = `100% ${String(box.clientHeight)}px, 100% ${String(box.offsetHeight - box.clientHeight)}px`;
    // Stryker disable next-line ConditionalExpression: equivalent, writing the same figures again sets the same declaration
    if (figures !== this.#figures) {
      this.#figures = figures;
      (this.#sheet.cssRules[0] as CSSStyleRule).style.setProperty("mask-size", figures);
    }
    this.#apply();
    if (focused && !this.overflowing) this.#handOver(box);
    // Stryker disable next-line ConditionalExpression: equivalent, an update with no changed output renders the same
    if (outputs() !== before) this.#host.requestUpdate();
  }

  /** The box's tab stop, role and name for the state (FR-002, FR-010). */
  #apply(): void {
    const box = this.#box;
    this.name = resolveName(this.#host.getAttribute("aria-label"), this.#label);
    if (box === null) return;
    const named = this.overflowing && this.name !== undefined;
    if (this.overflowing) box.setAttribute("tabindex", "0");
    else box.removeAttribute("tabindex");
    if (named) {
      box.setAttribute("role", this.#role);
      box.setAttribute("aria-label", this.name ?? "");
    } else {
      box.removeAttribute("role");
      box.removeAttribute("aria-label");
    }
  }

  /** Moves focus off the box that stopped overflowing: to the first focusable slotted element, else to the frame (R-07). */
  #handOver(box: HTMLElement): void {
    const target = firstFocusable([...box.querySelectorAll("slot")]);
    if (target !== undefined) {
      target.focus();
      return;
    }
    // The frame takes focus by script only while it holds it (it loses the attribute on its focusout, #onFrameOut).
    const frame = box.closest<HTMLElement>(".region-frame");
    frame?.setAttribute("tabindex", "-1");
    frame?.focus();
  }

  /**
   * A focusout in the frame, heard on the frame itself: when focus moves from the frame to the box inside it, both ends
   * are in the host's shadow root, so the event does not reach the host. The frame has a `tabindex` only while it holds
   * focus itself, so removing it on any focusout inside it is exact.
   */
  readonly #onFrameOut = (event: Event): void => {
    (event.currentTarget as HTMLElement).removeAttribute("tabindex");
  };

  /** The unmodified arrow keys on the box itself: an instant 40 px scroll, prevented also at the extent (R-02). */
  readonly #onKey = (event: KeyboardEvent): void => {
    const box = event.composedPath()[0] as HTMLElement;
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (box !== this.#box || direction === undefined || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    box.scrollTo({ left: box.scrollLeft + direction * this.#step, behavior: "instant" });
  };

  /**
   * Focus clearance (R-06): a descendant that takes focus with a ring is scrolled clear of the fades, or the fades it
   * cannot clear are suppressed. Focus on the box itself is not cleared; the frame takes focus only when the box does
   * not overflow.
   */
  readonly #onFocusIn = (event: FocusEvent): void => {
    const box = this.#box;
    const target = event.composedPath()[0];
    if (box === null || !(target instanceof Element) || target === box || !target.matches(":focus-visible") || !this.overflowing) return;
    const track = box.querySelector(".region-track");
    const edge = box.parentElement?.querySelector(".region-edge");
    const room = track === null ? 0 : Number.parseFloat(getComputedStyle(track).paddingInlineStart);
    const rect = target.getBoundingClientRect();
    // The box has no border (overflowRegionStyles), so its client area starts at its border box.
    const left = box.getBoundingClientRect().left;
    const clearance = clearanceScroll({
      ring: { left: rect.left - room, right: rect.right + room },
      box: { left, right: left + box.clientWidth, scrollLeft: box.scrollLeft, scrollWidth: box.scrollWidth, clientWidth: box.clientWidth },
      fade: edge?.getBoundingClientRect().width ?? 0,
      direction: getComputedStyle(box).direction === "rtl" ? "rtl" : "ltr",
    });
    box.scrollTo({ left: clearance.scrollLeft, behavior: "instant" });
    this.#suppressed = { start: clearance.suppressStart, end: clearance.suppressEnd };
    this.#focused = target;
    this.#written = box.scrollLeft;
    this.#measure();
  };

  /** Focus leaving the control the fallback is for ends the suppression (R-06). */
  readonly #onFocusOut = (event: FocusEvent): void => {
    if (event.composedPath()[0] !== this.#focused) return;
    this.#focused = undefined;
    this.#suppressed = { start: false, end: false };
    this.#measure();
  };

  /** A user's scroll ends the suppression: a position more than 1 px from the one the module wrote (R-06). */
  readonly #onScroll = (): void => {
    if (Math.abs((this.#box?.scrollLeft ?? 0) - this.#written) > 1) this.#suppressed = { start: false, end: false };
    this.#measure();
  };

  // Stryker disable next-line BlockStatement: equivalent, see the slotchange listener in #follow
  readonly #onSlotChange = (): void => {
    this.#measure();
  };
}
