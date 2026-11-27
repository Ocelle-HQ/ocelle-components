import { LitElement, css, html } from "lit";
import type { CSSResultGroup, PropertyDeclarations } from "lit";
import { define } from "./define.ts";

interface OpenSurface {
  readonly view: Window;
  readonly listeners: AbortController;
  frame: number;
  tab?: KeyboardEvent;
  outsidePointer: number | undefined;
}

function flatParent(element: Element): Element | null {
  if (element.assignedSlot !== null) return element.assignedSlot;
  const parent = element.parentNode;
  return parent instanceof ShadowRoot ? parent.host : element.parentElement;
}

function includes(ancestor: Element, child: Element | null): boolean {
  for (let element = child; element !== null; element = flatParent(element)) {
    if (element === ancestor) return true;
  }
  return false;
}

function ownsCloseRequest(element: EventTarget): boolean {
  if (!(element instanceof HTMLElement)) return false;
  if (element instanceof HTMLDialogElement && element.open) {
    const behavior = element.getAttribute("closedby");
    return element.matches(":modal") || behavior === "closerequest" || behavior === "any";
  }
  return element.matches(":popover-open") && element.popover !== "manual";
}

/**
 * A compact, nonmodal surface opened by a named native button.
 *
 * @tagname ocelle-anchored-popover
 * @slot - The native controls presented in the popover.
 * @slot trigger - Decorative icon or initials for the named trigger.
 * @csspart trigger - The native trigger button.
 * @csspart surface - The nonmodal popover surface.
 */
export class OcelleAnchoredPopover extends LitElement {
  static override properties: PropertyDeclarations = {
    label: { converter: (value: string | null) => value ?? "" },
    placement: { type: String },
  };

  static override styles: CSSResultGroup = css`
    :host {
      display: inline-block;
    }

    :host([hidden]) {
      display: none;
    }

    [part="trigger"] {
      display: inline-grid;
      place-items: center;
      box-sizing: border-box;
      min-inline-size: var(--ocelle-target-min);
      min-block-size: var(--ocelle-target-min);
      padding: var(--ocelle-space-1);
      border: var(--ocelle-border-width) solid var(--ocelle-color-chrome-muted);
      border-radius: var(--ocelle-radius-2);
      background-color: var(--ocelle-color-chrome);
      color: var(--ocelle-color-chrome-ink);
      font: inherit;
    }

    [part="trigger"]:enabled:hover {
      background-color: var(--ocelle-color-chrome-hover);
    }

    [part="trigger"]:enabled:active {
      border-color: var(--ocelle-color-chrome-ink);
      background-color: var(--ocelle-color-chrome-active);
    }

    [part="trigger"]:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset);
    }

    [part="surface"] {
      display: none;
      box-sizing: border-box;
      max-inline-size: calc(100% - 2 * var(--ocelle-gutter));
      max-block-size: calc(100% - 2 * var(--ocelle-gutter));
      padding: var(--ocelle-space-2);
      border: var(--ocelle-border-width) solid var(--ocelle-color-control-border);
      border-radius: var(--ocelle-radius-2);
      overflow: auto;
      background-color: var(--ocelle-color-sheet);
      color: var(--ocelle-color-ink);
    }

    [part="surface"]:popover-open {
      display: block;
    }

    ::slotted(:focus-visible) {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset);
    }

    @media (forced-colors: active) {
      [part="trigger"],
      [part="trigger"]:enabled:hover,
      [part="trigger"]:enabled:active {
        border-color: ButtonText;
        background-color: ButtonFace;
        color: ButtonText;
      }

      [part="surface"] {
        border-color: CanvasText;
        background-color: Canvas;
        color: CanvasText;
      }

      [part="trigger"]:focus-visible,
      ::slotted(:focus-visible) {
        outline-color: CanvasText;
      }
    }
  `;

  /** The accessible name of the native trigger. A blank name disables it. */
  declare label: string;

  /**
   * The preferred vertical placement relative to the trigger.
   *
   * @default "below"
   */
  declare placement: "below" | "above";

  #open: OpenSurface | undefined;

  constructor() {
    super();
    this.label = "";
    this.placement = "below";
  }

  /** Close the surface and return focus to the enabled trigger when focus is still inside. */
  close(): void {
    const surface = this.#surface;
    if (surface !== null) this.#hide(includes(surface, this.#active()));
  }

  protected override render() {
    const label = this.label.trim();
    return html`
      <button
        type="button"
        part="trigger"
        popovertarget="surface"
        aria-controls="surface"
        aria-expanded="false"
        aria-label=${label}
        ?disabled=${label === ""}
        @keydown=${this.#onKey}
      ><slot name="trigger" aria-hidden="true"></slot></button>
      <div id="surface" part="surface" popover="manual" @beforetoggle=${this.#onToggle} @keydown=${this.#onKey}><slot></slot></div>
    `;
  }

  /** @internal Release listeners and frame ownership when the host is detached. */
  override disconnectedCallback(): void {
    this.#stop();
    super.disconnectedCallback();
  }

  get #trigger(): HTMLButtonElement | null {
    return this.shadowRoot?.querySelector("button") ?? null;
  }

  get #surface(): HTMLElement | null {
    return this.shadowRoot?.querySelector("#surface") ?? null;
  }

  #active(): Element | null {
    const root = this.getRootNode();
    let active = (root instanceof ShadowRoot ? root.activeElement : null) ?? this.ownerDocument.activeElement;
    while (active?.shadowRoot?.activeElement != null) active = active.shadowRoot.activeElement;
    return active;
  }

  #hide(restore: boolean): void {
    const surface = this.#surface;
    if (surface === null || !surface.matches(":popover-open") || !surface.isConnected) return;
    surface.hidePopover();
    const trigger = this.#trigger;
    if (restore && trigger !== null && !trigger.disabled) trigger.focus({ preventScroll: true });
  }

  #onToggle(event: ToggleEvent): void {
    if (event.newState !== "open") {
      this.#stop();
      return;
    }
    if (event.defaultPrevented) return;
    const view = this.ownerDocument.defaultView;
    if (view === null) return;
    this.#trigger?.setAttribute("aria-expanded", "true");
    const listeners = new AbortController();
    const open: OpenSurface = { view, listeners, frame: 0, outsidePointer: undefined };
    this.#open = open;
    const options = { capture: true, signal: listeners.signal };
    this.ownerDocument.addEventListener("pointerdown", this.#onPointerDown, options);
    this.ownerDocument.addEventListener("pointerup", this.#onPointerUp, options);
    this.ownerDocument.addEventListener("pointercancel", this.#onPointerCancel, options);
    this.ownerDocument.addEventListener("focusin", this.#onFocus, options);
    open.frame = view.requestAnimationFrame(this.#follow);
  }

  #stop(): void {
    const open = this.#open;
    this.#open = undefined;
    if (open !== undefined) {
      open.listeners.abort();
      open.view.cancelAnimationFrame(open.frame);
    }
    this.#trigger?.setAttribute("aria-expanded", "false");
  }

  #follow = (): void => {
    const open = this.#open;
    if (open === undefined) return;
    if (!this.#surface?.matches(":popover-open")) {
      this.#stop();
      return;
    }
    const trigger = this.#trigger;
    if (trigger === null || trigger.disabled || trigger.getClientRects().length === 0) {
      this.#hide(false);
      return;
    }
    this.#onFocus();
    delete open.tab;
    if (this.#open === open) open.frame = open.view.requestAnimationFrame(this.#follow);
  };

  #onKey(event: KeyboardEvent): void {
    const open = this.#open;
    if (open === undefined || event.defaultPrevented || event.isComposing) return;
    const path = event.composedPath();
    const boundary = path.findIndex((target) => target === event.currentTarget);
    if (path.slice(0, boundary).some(ownsCloseRequest)) return;

    if (event.key === "Tab") {
      open.tab = event;
      return;
    }
    if (event.key !== "Escape") return;
    const active = this.#active();
    if (active instanceof HTMLInputElement && active.type === "search" && !active.readOnly && !active.disabled && active.value !== "") return;
    event.preventDefault();
    event.stopPropagation();
    this.#hide(true);
  }

  #onFocus = (): void => {
    const tab = this.#open?.tab;
    if (tab === undefined || tab.defaultPrevented || tab.eventPhase !== Event.NONE) return;
    const active = this.#active();
    if (includes(this, active)) return;
    for (let node = active; node !== null && !includes(node, this); node = flatParent(node)) {
      if (ownsCloseRequest(node)) return;
    }
    this.#hide(false);
  };

  /** The root a hit retargeted to a host can actually be inside, including our containing closed roots. */
  #rootFor(host: Element): ShadowRoot | null {
    if (host.shadowRoot !== null) return host.shadowRoot;
    for (let root = this.getRootNode(); root instanceof ShadowRoot; root = root.host.getRootNode()) {
      if (root.host === host) return root;
    }
    return null;
  }

  #outside(event: PointerEvent): boolean {
    const { clientX, clientY } = event;
    let hit = this.ownerDocument.elementFromPoint(clientX, clientY);
    while (hit !== null) {
      const root = this.#rootFor(hit);
      if (root === null) break;
      const inner = root.elementFromPoint(clientX, clientY);
      if (inner === hit) return false;
      hit = inner;
    }
    const trigger = this.#trigger;
    const surface = this.#surface;
    return hit !== null && trigger !== null && surface !== null && !includes(trigger, hit) && !includes(surface, hit);
  }

  #onPointerDown = (event: PointerEvent): void => {
    const open = this.#open;
    if (open === undefined || !event.isPrimary || event.button !== 0) return;
    open.outsidePointer = this.#outside(event) ? event.pointerId : undefined;
  };

  #onPointerUp = (event: PointerEvent): void => {
    const open = this.#open;
    if (open?.outsidePointer !== event.pointerId) return;
    open.outsidePointer = undefined;
    if (event.isPrimary && event.button === 0 && this.#outside(event)) this.#hide(false);
  };

  #onPointerCancel = (event: PointerEvent): void => {
    const open = this.#open;
    if (open?.outsidePointer === event.pointerId) open.outsidePointer = undefined;
  };
}

define("ocelle-anchored-popover", OcelleAnchoredPopover);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-anchored-popover": OcelleAnchoredPopover;
  }
}
