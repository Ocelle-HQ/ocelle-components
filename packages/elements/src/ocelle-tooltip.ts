// `ocelle-tooltip` (008 FR-029 to FR-037, FR-047; research.md R-09 to R-13; data-model.md § `ocelle-tooltip`): a
// tooltip that meets WCAG 1.4.13. It wraps its trigger, the first element in its default slot, with a host that is
// layout-transparent (`display: contents`), and shows its text in a bubble in the top layer through the Popover API
// (`popover="manual"`): after `--ocelle-tooltip-delay` while the pointer rests on the trigger or the bubble, and at
// once when keyboard focus (`:focus-visible`) arrives on the trigger. The bubble stays while either holds, with no
// timeout, and Escape hides it without letting the key go further. It is placed on its `placement` side of the trigger
// through a constructable stylesheet of its own, flipped when it does not fit and clamped across, and follows the
// trigger at every frame. With `describes` its text becomes the trigger's accessible description through a hidden
// light-DOM `role="tooltip"` span. Importing this module defines `ocelle-tooltip` and no other element.
import { LitElement, css, html } from "lit";
import type { CSSResultGroup, PropertyDeclarations } from "lit";
import { bubbles } from "./bubble.ts";
import { define } from "./define.ts";
import { deepActive } from "./focusable.ts";

type Side = "top" | "bottom" | "left" | "right";

const opposite: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };

/** Whether the engine has the Popover API (R-10); without it the tooltip never shows and listens to no key. */
const popover = "showPopover" in HTMLElement.prototype;

/** The last number of the description ids, `ocelle-tooltip-desc-<n>` (R-13). */
let described = 0;

/** Whether `node` is `ancestor` or inside it, through shadow roots. */
function within(node: Node, ancestor: Node): boolean {
  for (let each: Node | null = node; each !== null; each = each.parentNode instanceof ShadowRoot ? each.parentNode.host : each.parentNode) if (each === ancestor) return true;
  return false;
}

/** The ids in `element`'s `aria-describedby`, in order. */
function describedBy(element: Element): string[] {
  return (element.getAttribute("aria-describedby") ?? "").split(/\s/).filter((each) => each !== "");
}

/** Reads a duration such as `300ms` or `0.5s` in milliseconds: 0 without a unit, NaN for no number. */
function milliseconds(text: string): number {
  const number = Number.parseFloat(text);
  return text.endsWith("ms") ? number : text.endsWith("s") ? number * 1000 : 0;
}

/**
 * A tooltip: a short text in a bubble beside its trigger, shown while the pointer rests on the trigger or the bubble
 * or the trigger has keyboard focus, hidden by Escape. The trigger carries its own accessible name; the bubble only
 * repeats or supplements it.
 *
 * @tagname ocelle-tooltip
 * @slot - The trigger: the first element assigned, a button or a link that carries its own accessible name.
 * @slot description - The tooltip's own: with `describes`, the hidden description span it adds to its children; never rendered.
 * @csspart bubble - The bubble in the top layer, hidden from assistive technology; its only child paints the text.
 */
export class OcelleTooltip extends LitElement {
  static override properties: PropertyDeclarations = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "text", the default converter, not reflected)
    text: { type: String },
    placement: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    describes: { type: Boolean, reflect: true },
  };

  static override styles: CSSResultGroup = css`
    :host {
      display: contents;
    }

    :host([hidden]) {
      display: none;
    }

    [part="bubble"] {
      display: none;
      position: fixed;
      inset: auto;
      box-sizing: border-box;
      inline-size: max-content;
      block-size: auto;
      max-inline-size: var(--ocelle-tooltip-max-inline);
      margin: 0;
      padding: 0;
      border: 0;
      overflow: visible;
      background: transparent;
      color: inherit;
      scroll-margin: var(--ocelle-gutter);
    }

    [part="bubble"]:popover-open {
      display: block;
    }

    [part="bubble"][data-side="top"] {
      padding-bottom: var(--ocelle-space-2);
    }

    [part="bubble"][data-side="bottom"] {
      padding-top: var(--ocelle-space-2);
    }

    [part="bubble"][data-side="left"] {
      padding-right: var(--ocelle-space-2);
    }

    [part="bubble"][data-side="right"] {
      padding-left: var(--ocelle-space-2);
    }

    .box {
      box-sizing: border-box;
      padding-block: var(--ocelle-space-1);
      padding-inline: var(--ocelle-space-2);
      border: var(--ocelle-border-width) solid transparent;
      border-radius: var(--ocelle-radius-2);
      background: var(--ocelle-color-chrome);
      color: var(--ocelle-color-chrome-ink);
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-sm);
      font-weight: normal;
      line-height: var(--ocelle-line-height-normal);
      text-align: start;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    @media (forced-colors: active) {
      .box {
        border-color: CanvasText;
        background: Canvas;
        color: CanvasText;
      }
    }
  `;

  /** The tooltip whose bubble is shown: at most one at a time (FR-034). */
  static #shown: OcelleTooltip | undefined;

  static {
    // An overlay is opening (R-10): the shown bubble hides first, and `#hide` ends that tooltip's own pending delay.
    // Another tooltip's pending hover delay ends by its trigger's `pointerout` when the backdrop covers the trigger, or
    // by the tooltip's removal; not by the focus that moves into the overlay, since `#onFocusout` hides only when not
    // hovered, and only `#onPointerout` ends the hover.
    bubbles.dismiss = () => {
      const shown = OcelleTooltip.#shown;
      if (shown !== undefined) shown.#hide();
    };
  }

  /**
   * The bubble's plain text, never parsed as markup. An empty text shows no bubble.
   *
   * @default ""
   */
  declare text: string;

  /**
   * The side of the trigger the bubble is shown on: `top`, `bottom`, `start` or `end`, the last two in the tooltip's
   * direction; it is shown on the opposite side when it does not fit. Reflected.
   *
   * @default "top"
   */
  declare placement: "top" | "bottom" | "start" | "end";

  /**
   * Whether the tooltip shows no bubble. Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  /**
   * Whether the text is the trigger's accessible description, for a text that adds to the trigger's name; supported
   * only when the trigger is itself the focusable element. Reflected.
   *
   * @default false
   */
  declare describes: boolean;

  /** The trigger: the first element assigned to the default slot (R-12). */
  #trigger: HTMLElement | undefined;
  /** Whether the pointer is on the trigger or the bubble; false (undefined) from the first `slotchange` on. */
  #hovered: boolean | undefined;
  /** Whether keyboard focus is on the trigger: focus that arrived while matching `:focus-visible` (FR-031). */
  #focused: boolean | undefined;
  #timer: number | undefined;
  #frame = 0;
  /** What the last placement was made for (see `#follow`), to place again only when it changed. */
  #placed: string | undefined;
  /** The bubble's position (R-11): one rule, adopted after the element's styles; never a `style` attribute (FR-047). */
  readonly #sheet = new CSSStyleSheet();
  /** With `describes`, the description span and the observer that keeps it and its id (R-13). */
  #span: HTMLSpanElement | undefined;
  readonly #observer = new MutationObserver(() => {
    this.#describe();
  });

  constructor() {
    super();
    this.text = "";
    this.placement = "top";
    this.disabled = false;
    this.describes = false;
    this.addEventListener("pointerover", (event) => {
      this.#onPointerover(event);
    });
    this.addEventListener("pointerout", (event) => {
      this.#onPointerout(event);
    });
    this.addEventListener("focusin", () => {
      this.#onFocusin();
    });
    this.addEventListener("focusout", () => {
      this.#onFocusout();
    });
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#describe();
  }

  /** Removed: the bubble hides and a pending delay ends (a disconnected popover cannot be shown); no description. */
  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection serves reactive controllers and async directives; the tooltip uses neither (as the overlays, reviews/phase-2/notes.md)
    super.disconnectedCallback();
    this.#hide();
    this.#undescribe(this.#trigger);
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot() as ShadowRoot;
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.#sheet];
    return root;
  }

  protected override render(): unknown {
    return html`<slot @slotchange=${this.#onSlotchange}></slot><slot name="description" hidden></slot><div part="bubble" popover="manual" aria-hidden="true"><div class="box">${this.text}</div></div>`;
  }

  /** A change of `text` or `disabled` that shows no bubble hides it (FR-030); `describes` and `text` set the description. */
  protected override updated(): void {
    if (this.disabled || this.text === "") this.#hide();
    this.#describe();
  }

  get #bubble(): HTMLElement | null {
    return this.renderRoot.querySelector<HTMLElement>('[part="bubble"]');
  }

  /** Whether `node` is the host or inside it: the trigger, or the bubble (retargeted to the host). */
  #inside(node: EventTarget | null): boolean {
    return node instanceof Node && this.contains(node);
  }

  // Show and hide (R-12) -----------------------------------------------------------------------------------------

  /**
   * The pointer enters the tooltip from outside, not by touch: the delay starts, read from the trigger's computed
   * `--ocelle-tooltip-delay`, or the bubble shows in this task when it is 0. Moves between the trigger and the bubble
   * stay inside the tooltip, so they neither restart the delay nor end it.
   */
  #onPointerover(event: PointerEvent): void {
    if (this.#inside(event.relatedTarget) || event.pointerType === "touch") return;
    this.#hovered = true;
    const delay = milliseconds(getComputedStyle(this.#trigger ?? this).getPropertyValue("--ocelle-tooltip-delay"));
    if (delay > 0) {
      this.#timer = window.setTimeout(() => {
        this.#show();
      }, delay);
    } else this.#show();
  }

  #onPointerout(event: PointerEvent): void {
    if (this.#inside(event.relatedTarget)) return;
    this.#hovered = false;
    window.clearTimeout(this.#timer);
    if (!this.#focused) this.#hide();
  }

  /** Keyboard focus is checked when focus arrives on the trigger or inside it, never later (SPEC-2-03). */
  #onFocusin(): void {
    const active = deepActive() ?? this;
    this.#focused = within(active, this.#trigger ?? this) && active.matches(":focus-visible");
    if (this.#focused) this.#show();
  }

  /** Focus leaves: hidden unless hovered; focus moving inside the trigger arrives again by `focusin`. */
  #onFocusout(): void {
    this.#focused = false;
    if (!this.#hovered) this.#hide();
  }

  /** Escape while shown (FR-033): hides the bubble and stops the key, unless the tooltip is behind the topmost overlay. */
  readonly #onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    const top = bubbles.top?.();
    if (top !== undefined && !within(this, top)) return;
    event.preventDefault();
    event.stopPropagation();
    this.#hide();
  };

  /** Shows the bubble, the only one shown on the page, and places it at once and at every frame. */
  #show(): void {
    const bubble = this.#bubble;
    const shown = OcelleTooltip.#shown;
    if (!popover || bubble === null || this.disabled || this.text === "") return;
    // Stryker disable next-line ConditionalExpression: equivalent, a bubble already shown would hide and show again in this task, unseen: no frame, event or focus change between (false); true, which every show row would kill, shares the mutator (reviews/phase-4/notes.md)
    if (shown === this) return;
    if (shown !== undefined) shown.#hide();
    OcelleTooltip.#shown = this;
    bubble.showPopover();
    this.#follow();
    window.addEventListener("keydown", this.#onKeydown, true);
  }

  /** Hides the bubble, and ends a pending delay. */
  #hide(): void {
    window.clearTimeout(this.#timer);
    if (OcelleTooltip.#shown !== this) return;
    OcelleTooltip.#shown = undefined;
    // Stryker disable next-line CallExpression: equivalent, a loop left running only places a hidden bubble again, and hides it again once its trigger is gone (reviews/phase-4/notes.md)
    cancelAnimationFrame(this.#frame);
    window.removeEventListener("keydown", this.#onKeydown, true);
    this.#bubble?.hidePopover();
  }

  // Placement (R-11) ---------------------------------------------------------------------------------------------

  /**
   * At every frame while shown: hidden when the trigger is gone or disabled; placed again when the trigger's box, the
   * bubble's size (a font that finished loading, a new text), the viewport, the placement or the direction changed.
   */
  readonly #follow = (): void => {
    const trigger = this.#trigger;
    const bubble = this.#bubble;
    if (trigger?.isConnected !== true || bubble === null || trigger.matches(":disabled")) {
      this.#hide();
      return;
    }
    this.#frame = requestAnimationFrame(this.#follow);
    const box = trigger.getBoundingClientRect();
    const size = bubble.getBoundingClientRect();
    const viewport = document.documentElement;
    const rtl = this.matches(":dir(rtl)");
    const placed = JSON.stringify([box.left, box.top, box.width, box.height, size.width, size.height, viewport.clientWidth, viewport.clientHeight, this.placement, rtl]);
    // Stryker disable next-line ConditionalExpression: equivalent, placing at every frame gives the same coordinates, the test only spares the work (true); false, which the following rows would kill, shares the mutator (reviews/phase-4/notes.md)
    if (placed !== this.#placed) {
      this.#placed = placed;
      this.#place(trigger, bubble, rtl);
    }
  };

  /**
   * Places the bubble on its side of the trigger, `space-2` away through the bubble part's padding on that side; on
   * the opposite side when it does not fit in the viewport less the gutter there and fits on the opposite side; centred
   * across and clamped inside the viewport less the gutter. The coordinates are physical (`getBoundingClientRect()`).
   */
  #place(trigger: HTMLElement, bubble: HTMLElement, rtl: boolean): void {
    const logical: Record<string, Side> = { bottom: "bottom", start: rtl ? "right" : "left", end: rtl ? "left" : "right" };
    let side: Side = logical[this.placement] ?? "top";
    // Measured with the gap's padding on that side: a flip moves it to the opposite side, which keeps the size.
    bubble.dataset.side = side;
    const { width, height } = bubble.getBoundingClientRect();
    const box = trigger.getBoundingClientRect();
    const viewport = document.documentElement;
    const [right, bottom] = [viewport.clientWidth, viewport.clientHeight];
    // `--ocelle-gutter` in pixels: the bubble part's `scroll-margin`, which nothing scrolls to.
    const gutter = Number.parseFloat(getComputedStyle(bubble).scrollMarginTop);
    const fits: Record<Side, boolean> = {
      top: box.top - height >= gutter,
      bottom: box.bottom + height <= bottom - gutter,
      left: box.left - width >= gutter,
      right: box.right + width <= right - gutter,
    };
    if (!fits[side] && fits[opposite[side]]) side = opposite[side];
    bubble.dataset.side = side;
    const clamp = (value: number, size: number, end: number): number => Math.max(gutter, Math.min(value, end - gutter - size));
    const across = side === "top" || side === "bottom";
    const x = across ? clamp(box.left + box.width / 2 - width / 2, width, right) : side === "left" ? box.left - width : box.right;
    const y = across ? (side === "top" ? box.top - height : box.bottom) : clamp(box.top + box.height / 2 - height / 2, height, bottom);
    this.#sheet.replaceSync(`[part="bubble"] { top: ${String(y)}px; left: ${String(x)}px; }`);
  }

  // The trigger and its description (R-12, R-13) -----------------------------------------------------------------

  /** A new trigger: the bubble hides, the description's id moves from the old trigger to the new one (R-13). */
  #onSlotchange(event: Event): void {
    const first = (event.target as HTMLSlotElement).assignedElements()[0] as HTMLElement | undefined;
    if (first === this.#trigger) return;
    this.#hide();
    this.#unlink(this.#trigger);
    this.#trigger = first;
    this.#hovered = false;
    this.#focused = false;
    this.#describe();
  }

  /**
   * While `describes` holds with a text, a trigger and a connection: the hidden `role="tooltip"` span among the host's
   * children, its text set as text, and its id in the trigger's `aria-describedby` after the host's ids; both put back
   * when a host write removes them (the observer calls this again; its own writes are taken from the observer's
   * records, so they are not acted on again). Otherwise none of it.
   */
  #describe(): void {
    const trigger = this.#trigger;
    if (!this.describes || this.text === "" || trigger === undefined || !this.isConnected) {
      this.#undescribe(trigger);
      return;
    }
    let span = this.#span;
    if (span === undefined) {
      const root = trigger.getRootNode() as Document | ShadowRoot;
      let id: string;
      do {
        described += 1;
        id = `ocelle-tooltip-desc-${String(described)}`;
      } while (root.getElementById(id) !== null);
      span = document.createElement("span");
      span.id = id;
      span.slot = "description";
      span.setAttribute("role", "tooltip");
      span.hidden = true;
      this.#span = span;
    }
    span.textContent = this.text;
    this.append(span);
    const ids = describedBy(trigger);
    if (!ids.includes(span.id)) trigger.setAttribute("aria-describedby", [...ids, span.id].join(" "));
    this.#observer.observe(trigger, { attributes: true, attributeFilter: ["aria-describedby"] });
    this.#observer.observe(this, { childList: true });
    this.#observer.takeRecords();
  }

  /** Removes the description span and its id from `trigger`'s `aria-describedby`. */
  #undescribe(trigger: HTMLElement | undefined): void {
    this.#unlink(trigger);
    this.#span?.remove();
    this.#span = undefined;
  }

  /** Stops keeping the description and removes its id from `trigger`'s `aria-describedby`, keeping the host's ids. */
  #unlink(trigger: HTMLElement | undefined): void {
    // Stryker disable next-line CallExpression: equivalent, a callback of a stale observation only runs #describe, which writes nothing while the description is not wanted or already in place (reviews/phase-4/notes.md)
    this.#observer.disconnect();
    const id = this.#span?.id;
    if (trigger === undefined || id === undefined) return;
    const ids = describedBy(trigger).filter((each) => each !== id);
    if (ids.length > 0) trigger.setAttribute("aria-describedby", ids.join(" "));
    else trigger.removeAttribute("aria-describedby");
  }
}

define("ocelle-tooltip", OcelleTooltip);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-tooltip": OcelleTooltip;
  }
}
