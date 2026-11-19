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
    // Stryker disable next-line ConditionalExpression,EqualityOperator: equivalent, here the position is the ring box's start, or the range when the start lies past it; a ring box that starts a fade's depth past the range ends within the content and clears the end at the range, so it never falls back
    suppressStart = fadesStart(position) && start < position + fade;
    suppressEnd = fadesEnd(position) && end > position + box.clientWidth - fade;
  }
  return { scrollLeft: direction === "ltr" ? position : 0 - position, suppressStart, suppressEnd };
}

/** A block span of the viewport, in CSS px from its top edge. */
export interface BlockSpan {
  readonly top: number;
  readonly bottom: number;
}

/** The scroll box for the block clearance: its client area's block edges in the viewport, and its block scroll metrics. */
export interface BlockClearanceBox extends BlockSpan {
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly clientHeight: number;
}

/**
 * What `blockClearanceScroll` reads (019 contracts/overflow-region-block-axis.md § Pure functions): the focused
 * element's ring box, the box, `pinnedEnd` (in the box's client coordinates), the block-end fade depth, and whether the
 * focused element precedes the pinned box in tree order.
 */
export interface BlockClearanceInput {
  readonly ring: BlockSpan;
  readonly box: BlockClearanceBox;
  readonly pinnedEnd: number;
  readonly fade: number;
  readonly before: boolean;
}

/** The `scrollTop` that clears the ring box, and whether the block-end fade it could not clear is suppressed. */
export interface BlockClearance {
  readonly scrollTop: number;
  readonly suppressEnd: boolean;
}

/** The block-axis edge state of a scroll box. */
export interface BlockEdgeState {
  readonly overflowingBlock: boolean;
  readonly offBlockEnd: boolean;
  readonly room: boolean;
}

/**
 * The block-axis edge state (019 contracts/overflow-region-block-axis.md § Pure functions): overflowing in the block
 * axis when the content is more than 1 px taller than the box, content below when more than 1 px of it is, and the
 * room rule met when at least twice the fade depth lies between `pinnedEnd` and the box's client block end.
 */
export function blockEdgeState(scrollTop: number, scrollHeight: number, clientHeight: number, pinnedEnd: number, fade: number): BlockEdgeState {
  const range = scrollHeight - clientHeight;
  return { overflowingBlock: range > 1, offBlockEnd: range - scrollTop > 1, room: clientHeight - pinnedEnd >= 2 * fade };
}

/**
 * The smallest block scroll that puts the ring box between its upper bound (`pinnedEnd`, or the client block start for
 * an element before the pinned box) and the block-end fade's edge where that fade still shows at the new position (an
 * end within 1 px of the range does not fade, and the room rule applies), else the client block end; clamped to the
 * scroll range. When no position does, the ring box's block start is aligned with its upper bound and the block-end fade
 * is reported as suppressed when it would cover it.
 */
export function blockClearanceScroll({ ring, box, pinnedEnd, fade, before }: BlockClearanceInput): BlockClearance {
  const range = box.scrollHeight - box.clientHeight;
  const at = box.scrollTop;
  // The ring box in content coordinates, and the upper bound's offset from the client block start.
  const top = ring.top - box.top + at;
  const bottom = ring.bottom - box.top + at;
  const upper = before ? 0 : pinnedEnd;
  const room = box.clientHeight - pinnedEnd >= 2 * fade;
  const fadesEnd = (position: number): boolean => room && range - position > 1;
  const endRoom = (position: number): number => position + box.clientHeight - (fadesEnd(position) ? fade : 0);
  // The position below keeps the ring box's end within the end room by construction (at the client end or the fade's
  // edge), or is the range's end, past which nothing can be shown; so only the upper bound is left to check, and a ring
  // box above that bound needs no branch of its own: the fallback scrolls it back to the bound.
  // Stryker disable next-line EqualityOperator: equivalent for the `>` variant, it sends a ring box whose top is exactly at the upper bound to the fallback, which computes the same position (top − upper, within the range) and no suppression, since its bottom is within the end room there; the `<` variant on this line is killed by the clearance cases
  const clear = (position: number): boolean => top >= position + upper;
  let position = at;
  if (bottom > endRoom(at)) {
    const depth = room ? fade : 0;
    position = bottom - box.clientHeight + depth < range - 1 ? bottom - box.clientHeight + depth : range;
  }
  let suppressEnd = false;
  if (!clear(position)) {
    position = Math.min(Math.max(top - upper, 0), range);
    suppressEnd = fadesEnd(position) && bottom > position + box.clientHeight - fade;
  }
  return { scrollTop: position, suppressEnd };
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
  /** The block-axis option (019 FR-018), read after each update: absent or false, 009's contract exactly. */
  readonly blockAxis?: () => boolean;
  /** The box the host pins at the scroll box's block start, or null (019 FR-018). */
  readonly blockStartBox?: () => Element | null;
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

  /*
   * The block-axis option (019 contracts/overflow-region-block-axis.md § Stylesheet): only while the module writes
   * data-axis="both" (the option on and the box overflowing in the block axis) the box scrolls in the block axis, with
   * no scrollbar-gutter, and the mask has four layers, top first: the opaque layer over the block-axis scrollbar on its
   * side (the right in LTR, the left under rtl), the opaque layer over the inline-axis scrollbar, the block-end fade
   * (opaque while it is off), and the inline fade (opaque while it is off); the block-end fade intersects the inline
   * fade and the two opaque layers are added over them. The per-instance sheet sizes the layers.
   */
  .region-box[data-axis="both"] {
    overflow-y: auto;
  }

  /* The block-end fade's depth measure: zero-wide outside forced colours, so it covers no content. */
  .region-edge.block-end {
    inset-block-start: auto;
    inset-block-end: 0;
    inset-inline-start: 0;
    inline-size: 0;
    block-size: var(--ocelle-scroller-fade-size);
  }

  @media not (forced-colors: active) {
    .region-box[data-axis="both"][data-fade="start"],
    .region-box[data-axis="both"][data-fade="end"],
    .region-box[data-axis="both"][data-fade="both"],
    .region-box[data-axis="both"][data-block-fade="end"] {
      mask-position: right top, left bottom, left top, left top;
      mask-origin: border-box;
      mask-clip: border-box;
      mask-repeat: no-repeat;
      mask-composite: add, add, intersect, add;
    }

    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="start"],
    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="end"],
    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="both"],
    :host(:dir(rtl)) .region-box[data-axis="both"][data-block-fade="end"] {
      mask-position: left top, left bottom, right top, right top;
    }

    .region-box[data-axis="both"][data-block-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to bottom, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink));
    }

    .region-box[data-axis="both"][data-fade="start"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    .region-box[data-axis="both"][data-fade="start"][data-block-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to bottom, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    .region-box[data-axis="both"][data-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to left, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    .region-box[data-axis="both"][data-fade="end"][data-block-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to bottom, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(to left, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    .region-box[data-axis="both"][data-fade="both"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size), var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent);
    }

    .region-box[data-axis="both"][data-fade="both"][data-block-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to bottom, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size), var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent);
    }

    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="start"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to left, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="start"][data-block-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to bottom, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(to left, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }

    :host(:dir(rtl)) .region-box[data-axis="both"][data-fade="end"][data-block-fade="end"] {
      mask-image:
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(var(--ocelle-color-ink), var(--ocelle-color-ink)),
        linear-gradient(to bottom, var(--ocelle-color-ink) calc(100% - var(--ocelle-scroller-fade-size)), transparent),
        linear-gradient(to right, transparent, var(--ocelle-color-ink) var(--ocelle-scroller-fade-size));
    }
  }

  @media (forced-colors: active) {
    .region-edge.block-end {
      inset-inline: 0;
      inline-size: auto;
      block-size: var(--ocelle-scroller-fade-size);
    }

    .region-box[data-block-fade="end"] ~ .region-edge.block-end {
      border-block-end: var(--ocelle-border-width) solid CanvasText;
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
  /** Whether content is below the box's client block end by more than 1 px, while the block-axis option is on. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint, and nothing reads it before
  offBlockEnd = false;
  /** Whether the block end fades: `offBlockEnd`, the room rule met, and not suppressed by the block focus fallback. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first observer delivery writes it before the first paint, and nothing reads it before
  fadeBlockEnd = false;

  readonly #host: ReactiveControllerHost & HTMLElement;
  readonly #boxOf: () => HTMLElement | null;
  readonly #role: "group" | "region";
  readonly #step: number;
  readonly #blockAxis: () => boolean;
  readonly #blockStartBox: () => Element | null;
  readonly #sheet = new CSSStyleSheet();
  readonly #observer = new ResizeObserver(() => {
    this.#measure();
  });

  #box: HTMLElement | null = null;
  /** The track of the box it follows, as observed. */
  #track: Element | null = null;
  #label: string | undefined;
  /** The fades the focus fallback suppresses, and the `scrollLeft` written then. */
  // Stryker disable next-line BooleanLiteral: equivalent for the start, which fades only more than 1 px from scroll position 0, reached by a scroll event that ends the suppression (the end is killed by the fade scenarios)
  #suppressed = { start: false, end: false };
  // Stryker disable next-line NumberLiteral: equivalent, it is read only while a suppression is set, and the fallback writes it then
  #written = 0;
  /** Whether the box carries `data-axis="both"`: the block-axis option on and the box overflowing in the block axis. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first measure writes it before it reads it; before that measure the box has no tabindex, so no key event targets it, and the focus clearance returns while `overflowing` is still false
  #axis = false;
  /** The block-axis option as last read in `hostUpdated`. */
  // Stryker disable next-line BooleanLiteral: equivalent, the first hostUpdated writes it; the value read there before is used only when the box is the one already followed, which on the first call is none, and the measure then returns at once
  #blockOn = false;
  /** Whether the block focus fallback suppresses the block-end fade, and the `scrollTop` written then. */
  #suppressedBlock = false;
  #writtenTop = 0;
  /** The mask figures last set: the box's client height and its scrollbar's thickness. */
  // Stryker disable next-line StringLiteral: equivalent, no measured figures are the empty text, so the first measure writes them either way
  #figures = "";

  constructor(host: ReactiveControllerHost & HTMLElement, options: OverflowRegionOptions) {
    this.#host = host;
    this.#boxOf = options.box;
    this.#role = options.role ?? "group";
    this.#step = options.step ?? 40;
    this.#blockAxis = options.blockAxis ?? ((): boolean => false);
    this.#blockStartBox = options.blockStartBox ?? ((): Element | null => null);
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

  /**
   * Adds the three listeners on the host (`keydown`, `focusin`, `focusout`), adopts the per-instance sheet once, and on
   * a reconnection follows again the box it followed (its observer and its listeners).
   */
  hostConnected(): void {
    const root = this.#host.shadowRoot;
    if (root !== null && !root.adoptedStyleSheets.includes(this.#sheet)) root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.#sheet];
    this.#host.addEventListener("keydown", this.#onKey);
    this.#host.addEventListener("focusin", this.#onFocusIn);
    this.#host.addEventListener("focusout", this.#onFocusOut);
    if (this.#box !== null) this.#follow(this.#box);
  }

  /**
   * Re-reads `box()`. On a new box, or none, it first lets go of the old one (`#release`), then follows the new one,
   * whose first observer delivery writes the state and the box's attributes there (contracts/overflow-region.md
   * § Lifecycle).
   */
  hostUpdated(): void {
    const box = this.#boxOf();
    // The block-axis option (019 FR-018) is re-read after each update; a change applies to the box it follows.
    const blockOn = this.#blockAxis();
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, an extra measure on an update of the same box reads the same layout and writes the same state (the `false` variant is killed by the run-time switch body of scenarios/overflow-block.ts)
    const switched = blockOn !== this.#blockOn;
    this.#blockOn = blockOn;
    // Stryker disable next-line ConditionalExpression: equivalent, releasing and following the same box again unobserves and observes it again and takes off and adds back the same listeners, and the host's setLabel after each update (in updated(), which Lit runs after hostUpdated) writes back the attributes the release removed
    if (box === this.#box) {
      // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, as above
      if (switched) this.#measure();
      return;
    }
    if (this.#box !== null) this.#release(this.#box);
    this.#box = box;
    if (box !== null) this.#follow(box);
  }

  /**
   * Disconnects the observer and takes the three listeners off the host. The box's `scroll` and `slotchange` listeners
   * and its frame's `focusout` listener stay on those nodes: a disconnected host's box gets no user scroll, and
   * `hostConnected` adds the same functions again, which leaves them single. The box keeps its attributes as last set.
   */
  // Stryker disable next-line all: equivalent, a disconnected host gets no event, and connecting again observes the box afresh and adds the same listeners, which adding again would leave single anyway
  hostDisconnected(): void {
    // Stryker disable next-line all: equivalent, as above
    this.#observer.disconnect();
    // Stryker disable next-line all: equivalent, as above
    this.#host.removeEventListener("keydown", this.#onKey);
    // Stryker disable next-line all: equivalent, as above
    this.#host.removeEventListener("focusin", this.#onFocusIn);
    // Stryker disable next-line all: equivalent, as above
    this.#host.removeEventListener("focusout", this.#onFocusOut);
  }

  /** Observes the box (its border box, so a scrollbar that comes or goes is seen) and its track, and listens to it. */
  #follow(box: HTMLElement): void {
    // Stryker disable next-line ObjectLiteral: not killed in process, where the scrollbar is an overlay of 0 px, so the border box and the content box change together; covered by elements-browser (not mutated): test/browser/scrollbar.test.ts "a card's inner block that grows past the board's end makes the board a tab stop and a region named \"Board\", scrollable by 443 px, though only the box's border box changed", which fails with this mutant (reviews/phase-2/plants.md)
    this.#observer.observe(box, { box: "border-box" });
    const track = box.querySelector(".region-track");
    this.#track = track;
    if (track !== null) this.#observer.observe(track);
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: equivalent, a passive listener only promises not to call preventDefault, which this one never does
    box.addEventListener("scroll", this.#onScroll, { passive: true });
    // A slot change is load-bearing for a host whose track does not follow its content, such as the board, whose
    // children are contained: a child assigned there whose fixed content reaches past the box changes neither the box's
    // nor the track's size (009 phase 2 review R1-03).
    box.addEventListener("slotchange", this.#onSlotChange);
    box.closest(".region-frame")?.addEventListener("focusout", this.#onFrameOut);
  }

  /**
   * Lets go of a box the host no longer renders as its scroll box: unobserves it and its track, takes its `scroll` and
   * `slotchange` listeners and its frame's `focusout` listener off, and removes its `tabindex`, `role` and `aria-label`.
   */
  #release(box: HTMLElement): void {
    this.#observer.unobserve(box);
    if (this.#track !== null) this.#observer.unobserve(this.#track);
    box.removeEventListener("scroll", this.#onScroll);
    box.removeEventListener("slotchange", this.#onSlotChange);
    box.closest(".region-frame")?.removeEventListener("focusout", this.#onFrameOut);
    box.removeAttribute("tabindex");
    box.removeAttribute("role");
    box.removeAttribute("aria-label");
    box.removeAttribute("data-axis");
    box.removeAttribute("data-block-fade");
    this.#axis = false;
    this.#suppressedBlock = false;
  }

  /**
   * Reads the box and writes the state, in the callback that observed the change (R-03): the outputs, the box's
   * attributes, the mask figures and, when overflow ends on the focused box, the focus handover. The host updates only
   * when an output changed.
   */
  #measure(): void {
    const box = this.#box;
    if (box === null) return;
    const outputs = (): string => [this.overflowing, this.offStart, this.offEnd, this.fadeStart, this.fadeEnd, this.#axis, this.offBlockEnd, this.fadeBlockEnd].join();
    const before = outputs();
    // The block axis first (019 FR-018): `data-axis` follows the block overflow, read with or without the attribute;
    // writing it can only narrow the client area (a classic scrollbar), so the inline figures are read after it.
    const blockOn = this.#blockAxis();
    const pinnedEnd = blockOn ? this.#pinnedEnd(box) : 0;
    const depth = blockOn ? (box.parentElement?.querySelector(".region-edge.block-end")?.getBoundingClientRect().height ?? 0) : 0;
    const block = blockEdgeState(box.scrollTop, box.scrollHeight, box.clientHeight, pinnedEnd, depth);
    this.#axis = blockOn && block.overflowingBlock;
    if (this.#axis) box.setAttribute("data-axis", "both");
    else {
      box.removeAttribute("data-axis");
      this.#suppressedBlock = false;
    }
    const state = edgeState(box.scrollLeft, box.scrollWidth, box.clientWidth);
    const focused = this.#host.shadowRoot?.activeElement === box;
    this.overflowing = state.overflowing || this.#axis;
    this.offStart = state.offStart;
    this.offEnd = state.offEnd;
    this.fadeStart = state.offStart && !this.#suppressed.start;
    this.fadeEnd = state.offEnd && !this.#suppressed.end;
    this.offBlockEnd = this.#axis && block.offBlockEnd;
    this.fadeBlockEnd = this.offBlockEnd && block.room && !this.#suppressedBlock;
    if (this.fadeBlockEnd) box.setAttribute("data-block-fade", "end");
    else box.removeAttribute("data-block-fade");
    const client = `${String(box.clientWidth)}px ${String(box.clientHeight)}px`;
    const inlineBar = `100% ${String(box.offsetHeight - box.clientHeight)}px`;
    const figures = this.#axis ? `${String(box.offsetWidth - box.clientWidth)}px 100%, ${inlineBar}, ${client}, ${client}` : `100% ${String(box.clientHeight)}px, ${inlineBar}`;
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

  /**
   * `pinnedEnd` (019 contracts/overflow-region-block-axis.md § The pinned-box measure): the pinned box's current laid-out
   * block-end edge in the box's client coordinates, or the client block start without one.
   */
  #pinnedEnd(box: HTMLElement): number {
    const pinned = this.#blockStartBox();
    return pinned === null ? 0 : pinned.getBoundingClientRect().bottom - box.getBoundingClientRect().top;
  }

  /** The box's tab stop, role and name for the state (FR-002, FR-010). */
  #apply(): void {
    const box = this.#box;
    this.name = resolveName(this.#host.getAttribute("aria-label"), this.#label);
    if (box === null) return;
    const name = this.overflowing ? this.name : undefined;
    if (this.overflowing) box.setAttribute("tabindex", "0");
    else box.removeAttribute("tabindex");
    if (name !== undefined) {
      box.setAttribute("role", this.#role);
      box.setAttribute("aria-label", name);
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
    if (box !== this.#box || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const direction = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    // The block-axis option (019 FR-018): ArrowUp and ArrowDown while the box scrolls in the block axis; every other
    // key, PageUp, PageDown, Home, End and Space among them, is left to the browser.
    const vertical = this.#axis ? { ArrowUp: -1, ArrowDown: 1 }[event.key] : undefined;
    if (direction !== undefined) {
      event.preventDefault();
      box.scrollTo({ left: box.scrollLeft + direction * this.#step, behavior: "instant" });
    } else if (vertical !== undefined) {
      event.preventDefault();
      box.scrollTo({ top: box.scrollTop + vertical * this.#step, behavior: "instant" });
    }
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
    this.#written = box.scrollLeft;
    // Q-M1 (b), T084: the option and the block overflow read at the time of focus, never `#axis`, which the last
    // measurement left; so focus entering a box just handed to the module, before its observer's first delivery, gets
    // the block clearance too. Reading it writes no `data-axis` and no output; the measure below does, as before.
    if (this.#blockAxis() && blockEdgeState(box.scrollTop, box.scrollHeight, box.clientHeight, 0, 0).overflowingBlock) this.#clearBlock(box, target, event.composedPath(), room);
    this.#measure();
  };

  /**
   * The block clearance of the block-axis option (019 contracts/overflow-region-block-axis.md § Effects, Focus
   * clearance), after the inline one: none for focus inside the pinned box; for an element before it in tree order the
   * upper bound is the client block start, else `pinnedEnd`; the fade depth is `.region-edge.block-end`'s block size.
   */
  #clearBlock(box: HTMLElement, target: Element, path: readonly EventTarget[], room: number): void {
    const pinned = this.#blockStartBox();
    if (pinned !== null && path.includes(pinned)) return;
    const position = pinned === null ? 0 : pinned.compareDocumentPosition(target);
    // Stryker disable next-line ConditionalExpression: equivalent for the CONTAINS test's `true` variant, a focused element that contains the pinned box (in the data table the <table>, given a tabindex) starts at the box's content start, so the clearance scrolls to 0 with either upper bound; the other variants on this line are killed (US1-19, US1-26's caption link, the element-before body)
    const before = (position & Node.DOCUMENT_POSITION_PRECEDING) !== 0 && (position & Node.DOCUMENT_POSITION_CONTAINS) === 0;
    const rect = target.getBoundingClientRect();
    const top = box.getBoundingClientRect().top;
    const clearance = blockClearanceScroll({
      ring: { top: rect.top - room, bottom: rect.bottom + room },
      // Stryker disable next-line ArithmeticOperator: equivalent, blockClearanceScroll reads the box's top, scrollTop, scrollHeight and clientHeight, not its bottom
      box: { top, bottom: top + box.clientHeight, scrollTop: box.scrollTop, scrollHeight: box.scrollHeight, clientHeight: box.clientHeight },
      pinnedEnd: this.#pinnedEnd(box),
      fade: box.parentElement?.querySelector(".region-edge.block-end")?.getBoundingClientRect().height ?? 0,
      before,
    });
    box.scrollTo({ top: clearance.scrollTop, behavior: "instant" });
    this.#suppressedBlock = clearance.suppressEnd;
    this.#writtenTop = box.scrollTop;
  }

  /**
   * Focus leaving the control the fallback is for ends the suppression (R-06): while a suppression holds, that control
   * has focus, so any focusout in the host is its.
   */
  readonly #onFocusOut = (): void => {
    this.#suppressed = { start: false, end: false };
    this.#suppressedBlock = false;
    this.#measure();
  };

  /** A user's scroll ends the suppression: a position more than 1 px from the one the module wrote (R-06). */
  readonly #onScroll = (): void => {
    if (Math.abs((this.#box?.scrollLeft ?? 0) - this.#written) > 1) this.#suppressed = { start: false, end: false };
    if (Math.abs((this.#box?.scrollTop ?? 0) - this.#writtenTop) > 1) this.#suppressedBlock = false;
    this.#measure();
  };

  /** A slot change in the track: the content may now reach past the box with neither the box nor the track resized. */
  readonly #onSlotChange = (): void => {
    this.#measure();
  };
}
