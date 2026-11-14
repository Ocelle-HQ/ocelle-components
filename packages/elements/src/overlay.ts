// The overlays' internal base, `OcelleOverlay` (008 research.md R-01 to R-08, R-18; data-model.md § Overlay): a native
// `<dialog>` in the open shadow root, shown with `showModal()` while `open` is true, with the user-agent chrome reset
// to tokens. It owns `open`, `label` and `close-label`, the heading, the close control, the body and footer slots,
// initial focus and the Tab cycle (R-04), Escape and the veto (R-02), platform closes (R-03), focus return (R-05),
// disconnection (R-05a), the close order and motion (R-06). A subclass names its event prefix and adds its layout.
// Internal, not an entry point, and no tag: `ocelle-dialog` (and later `ocelle-drawer`) extend it.
import { LitElement, css, html, nothing } from "lit";
import type { CSSResultGroup, PropertyValues } from "lit";
import { deepActive, flatChildren, isOpaqueContent, walk } from "./focusable.ts";
import type { Candidate } from "./focusable.ts";
import { accessibleName } from "./naming.ts";
import "./ocelle-icon.ts";

/** Why an overlay closed: a request's reason, or `host` when the host or the platform closed it. */
export type CloseReason = "escape" | "close-button" | "backdrop" | "host";

type State = "closed" | "opening" | "shown" | "closing";

/** The open overlays in opening order, bottom first; only the top acts on Escape and Tab (R-02). */
const stack: OcelleOverlay[] = [];

/** Dispatches the `CustomEvent` `name` with `{ reason }`, bubbling and composed; returns whether it was not cancelled. */
function dispatch(target: HTMLElement, name: string, reason: CloseReason, cancelable: boolean): boolean {
  return target.dispatchEvent(new CustomEvent(name, { detail: { reason }, bubbles: true, composed: true, cancelable }));
}

/** The composed parent of `node`: its parent, or the host of the shadow root it is the root of. */
function composedParent(node: Node): Node | null {
  if (node.parentNode instanceof ShadowRoot) return node.parentNode.host;
  return node.parentNode;
}

/** Whether `node` is `ancestor` or inside it, through shadow roots. */
function within(node: Node, ancestor: Node): boolean {
  for (let each: Node | null = node; each !== null; each = composedParent(each)) if (each === ancestor) return true;
  return false;
}

/** Whether `element` is inert or inside an inert subtree, through shadow roots. */
function inert(element: Element): boolean {
  for (let each: Node | null = element; each !== null; each = composedParent(each)) if (each instanceof HTMLElement && each.inert) return true;
  return false;
}

/** Every element of `root`'s flat content that is open in the top layer or as a dialog, through open shadow roots. */
function descendants(root: Element | ShadowRoot): Element[] {
  const found: Element[] = [];
  const visit = (parent: Element | ShadowRoot): void => {
    for (const child of parent.children) {
      found.push(child);
      if (child.shadowRoot !== null) visit(child.shadowRoot);
      visit(child);
    }
  };
  visit(root);
  return found;
}

/**
 * Whether a non-modal `<dialog>` closes on a close request by its computed closed-by state (Close Request or Any), as
 * its `closedBy` property reads it, in lower case (Chromium 134 and later); an engine without `closedby` (WebKit 17)
 * reads undefined there, and its non-modal dialogs do not close on a close request.
 */
function closesOnRequest(dialog: HTMLDialogElement): boolean {
  return dialog.closedBy === "closerequest" || dialog.closedBy === "any";
}

/** Reads a duration such as `200ms` or `0.2s` in milliseconds; 0 when it is not one. */
function milliseconds(value: string): number {
  const text = value.trim();
  const number = Number.parseFloat(text);
  if (Number.isNaN(number)) return 0;
  return text.endsWith("ms") ? number : text.endsWith("s") ? number * 1000 : 0;
}

/**
 * The internal base of `ocelle-dialog` and `ocelle-drawer`: a modal native `<dialog>` in the open shadow root, shown
 * while `open` is true.
 */
export class OcelleOverlay extends LitElement {
  static override properties = {
    open: { type: Boolean, reflect: true },
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    closeLabel: { type: String, attribute: "close-label" },
  };

  /** `aria-label` is observed, not a property: a host `aria-label` names the overlay (R-08). */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles: CSSResultGroup = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    [part="panel"] {
      box-sizing: border-box;
      flex-direction: column;
      margin: auto;
      padding: 0;
      border: var(--ocelle-border-width) solid transparent;
      max-inline-size: var(--ocelle-dialog-max-inline);
      max-block-size: var(--ocelle-dialog-max-block);
      overflow-y: auto;
      background: var(--ocelle-color-sheet);
      color: var(--ocelle-color-ink);
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-md);
      line-height: var(--ocelle-line-height-normal);
      outline: none;
    }

    [part="panel"][open] {
      display: flex;
    }

    [part="panel"]::backdrop {
      background: var(--ocelle-color-overlay);
    }

    .header {
      display: flex;
      flex: none;
      align-items: flex-start;
      gap: var(--ocelle-space-3);
      padding-block: var(--ocelle-space-4) var(--ocelle-space-2);
      padding-inline: var(--ocelle-space-6) var(--ocelle-space-4);
    }

    [part="heading"] {
      flex: 1 1 auto;
      align-self: center;
      min-inline-size: 0;
      margin: 0;
      font-size: var(--ocelle-font-size-lg);
      font-weight: var(--ocelle-font-weight-strong);
      line-height: var(--ocelle-line-height-tight);
      overflow-wrap: anywhere;
    }

    [part="heading"][hidden] {
      display: none;
    }

    [part="close-button"] {
      display: inline-flex;
      flex: none;
      margin-inline-start: auto;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      inline-size: var(--ocelle-target-min);
      block-size: var(--ocelle-target-min);
      margin-block: 0;
      margin-inline-end: 0;
      padding: 0;
      border: 0;
      border-radius: var(--ocelle-radius-2);
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    [part="close-button"]:focus {
      outline: none;
    }

    [part="close-button"]:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: var(--ocelle-focus-offset);
    }

    [part="body"] {
      box-sizing: border-box;
      flex: 0 1 auto;
      min-block-size: calc(3 * var(--ocelle-target-min));
      overflow-y: auto;
      padding-block: var(--ocelle-space-2) var(--ocelle-space-4);
      padding-inline: var(--ocelle-space-6);
    }

    [part="footer"] {
      display: flex;
      flex: none;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--ocelle-space-3);
      padding-block: var(--ocelle-space-4);
      padding-inline: var(--ocelle-space-6);
    }

    [part="footer"][hidden] {
      display: none;
    }

    .sentinel {
      display: block;
      flex: none;
      block-size: 0;
      overflow: hidden;
      outline: none;
    }

    @media not (forced-colors: active) {
      [part="panel"] {
        box-shadow: var(--ocelle-elevation-raised);
      }
    }

    @media (forced-colors: active) {
      [part="panel"] {
        border-color: CanvasText;
        background: Canvas;
        color: CanvasText;
      }

      [part="panel"]::backdrop {
        background: Canvas;
      }

      [part="close-button"]:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /**
   * Whether the overlay is shown, modally in the top layer; setting it shows or closes the overlay, and the overlay
   * sets it to false whenever it closes. Reflected.
   *
   * @default false
   */
  declare open: boolean;

  /**
   * The overlay's heading and accessible name; a host `aria-label` names it instead when present. A label is required.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The accessible name of the close control, in the host's language.
   *
   * @default "Close"
   */
  declare closeLabel: string;

  /** The event prefix, `ocelle-<element>`, of the subclass. */
  protected readonly eventPrefix: string = "ocelle-overlay";

  #state: State = "closed";
  #reason: CloseReason = "host";
  #opener: Element | null = null;
  #animation: Animation | undefined;
  #below = new Set<HTMLDialogElement>();
  #asideFor: HTMLDialogElement | null = null;
  #listening = false;
  #overflowing = false;
  #footer = false;
  #observer: ResizeObserver | undefined;

  constructor() {
    super();
    this.open = false;
    this.closeLabel = "Close";
  }

  /** The inner `<dialog>`, once rendered. */
  get #dialog(): HTMLDialogElement | null {
    return this.renderRoot.querySelector("dialog");
  }

  get #close(): HTMLButtonElement | null {
    return this.renderRoot.querySelector('[part="close-button"]');
  }

  get #body(): HTMLElement | null {
    return this.renderRoot.querySelector('[part="body"]');
  }

  get #sentinel(): HTMLElement | null {
    return this.renderRoot.querySelector(".sentinel");
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#footer = this.querySelector(':scope > [slot="footer"]') !== null;
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    // R-05a: an open or closing overlay closes silently, with no event and no focus move.
    if (this.#state === "closed") return;
    this.#animation?.cancel();
    this.#animation = undefined;
    this.#dialog?.close();
    this.#leave();
    this.#opener = null;
    this.#state = "closed";
    this.open = false;
  }

  protected override render(): unknown {
    const named = this.hasAttribute("aria-label");
    const name = accessibleName(this.label, this.getAttribute("aria-label"));
    return html`<dialog
      part="panel"
      aria-labelledby=${named ? nothing : "heading"}
      aria-label=${named && name !== undefined ? name : nothing}
      @keydown=${this.#onKeydown}
      @cancel=${this.#onCancel}
      @close=${{
        handleEvent: (event: Event) => {
          this.#onClose(event);
        },
        capture: true,
      }}
      @toggle=${{
        handleEvent: (event: Event) => {
          this.#onToggle(event);
        },
        capture: true,
      }}
      @focusout=${{
        handleEvent: (event: FocusEvent) => {
          this.#onFocusout(event);
        },
        capture: true,
      }}
    ><div class="header"><h2 part="heading" id="heading" ?hidden=${(this.label ?? "") === ""}>${this.label ?? ""}</h2><button part="close-button" type="button" aria-label=${this.closeLabel} @click=${this.#onCloseClick}><ocelle-icon name="close"></ocelle-icon></button></div><div part="body" tabindex=${this.#overflowing ? "0" : nothing}><slot @slotchange=${this.#onBodySlot}></slot></div><div part="footer" ?hidden=${!this.#footer}><slot name="footer" @slotchange=${this.#onFooterSlot}></slot></div><span class="sentinel" tabindex="-1" aria-hidden="true"></span></dialog>`;
  }

  protected override firstUpdated(): void {
    const body = this.#body;
    if (body === null) return;
    this.#observer = new ResizeObserver(() => {
      this.#measure();
    });
    this.#observer.observe(body);
    this.#observeContent();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (!changed.has("open")) return;
    if (this.open && this.#state === "closed") this.#show();
    else if (this.open && this.#state === "closing") this.#reopen();
    else if (!this.open && (this.#state === "opening" || this.#state === "shown")) this.#begin("host");
  }

  /** Adds the `document` keydown listener of the top overlay and removes the others' (R-02). */
  static #syncTop(): void {
    const top = stack.at(-1);
    for (const overlay of stack) overlay.#listen(overlay === top);
  }

  /** Adds or removes this overlay's `document` keydown listener (R-02). */
  #listen(on: boolean): void {
    if (on === this.#listening) return;
    this.#listening = on;
    if (on) document.addEventListener("keydown", this.#onDocumentKeydown);
    else document.removeEventListener("keydown", this.#onDocumentKeydown);
  }

  // Opening ------------------------------------------------------------------------------------------------------

  #show(): void {
    const dialog = this.#dialog;
    if (dialog === null || !this.isConnected) return;
    let opener = deepActive();
    for (const overlay of stack) if (opener !== null && overlay.#state === "closing" && within(opener, overlay)) opener = overlay.#opener;
    this.#opener = opener;
    this.#below = new Set(this.#nonModal().filter((each) => each.open));
    this.#asideFor = null;
    // Shown non-modally through the shadow root, it could not be shown modally; its stale close event is ignored.
    dialog.close();
    dialog.showModal();
    stack.push(this);
    OcelleOverlay.#syncTop();
    this.#state = "opening";
    this.#focusInitial();
    queueMicrotask(() => {
      this.#measure();
    });
    this.#animate(true, () => {
      if (this.#state === "opening") this.#state = "shown";
    });
  }

  #reopen(): void {
    this.#animation?.cancel();
    this.#animation = undefined;
    this.#state = "shown";
  }

  /** The initial focus target (R-04): autofocus in the body, else its first focusable element, else the close control. */
  #initialTargets(): HTMLElement[] {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('[part="body"] > slot');
    const assigned = slot?.assignedElements() ?? [];
    const autofocus: HTMLElement[] = [];
    for (const element of assigned) {
      for (const each of [element, ...descendants(element)]) if (each instanceof HTMLElement && each.hasAttribute("autofocus")) autofocus.push(each);
      if (element.shadowRoot !== null) for (const each of descendants(element.shadowRoot)) if (each instanceof HTMLElement && each.hasAttribute("autofocus")) autofocus.push(each);
    }
    const body = this.#body;
    const content = body === null ? [] : walk(body).flat.map((each) => each.element);
    return [...autofocus, ...content];
  }

  /** The initial focus target (R-04), without focusing it: the target of focus return from an overlay above (R-05). */
  #initialTarget(): HTMLElement | null {
    for (const each of this.#initialTargets()) if (each.getClientRects().length > 0) return each;
    return this.#close;
  }

  #focusInitial(): void {
    const close = this.#close;
    this.#tryFocus([...this.#initialTargets(), ...(close === null ? [] : [close])]);
  }

  /** Focuses the first of `targets` that takes focus (Focus checked, R-04); true when one did. */
  #tryFocus(targets: readonly HTMLElement[]): boolean {
    for (const target of targets) {
      target.focus();
      if (this.#landed(target)) return true;
    }
    return false;
  }

  #landed(target: HTMLElement): boolean {
    const active = deepActive();
    if (active === target) return true;
    if (isOpaqueContent(target)) {
      for (let each: Element | null = document.activeElement; each !== null; each = each.shadowRoot?.activeElement ?? null) if (each === target) return true;
    }
    return false;
  }

  // Closing ------------------------------------------------------------------------------------------------------

  /** Asks the host whether to close (FR-013); closes when the request is not cancelled. */
  #request(reason: CloseReason): void {
    if (dispatch(this, `${this.eventPrefix}-close-request`, reason, true) && (this.#state === "opening" || this.#state === "shown")) this.#begin(reason);
  }

  /** Starts a close (R-06): `open` false, then the exit animation, then the end of the close. */
  #begin(reason: CloseReason): void {
    this.#state = "closing";
    this.#reason = reason;
    this.#animation?.cancel();
    this.#animation = undefined;
    this.open = false;
    this.#animate(false, () => {
      if (this.#state === "closing") this.#finish();
    });
  }

  /**
   * Ends a close: the inner `close()` (nothing when the platform closed it), focus returned while it is ours, then
   * `…-close` (R-05, R-06). The `close` event the inner `close()` queues finds the dialog closed, or open again.
   */
  #finish(): void {
    const before = deepActive();
    const ours = before === null || within(before, this);
    this.#dialog?.close();
    this.#leave();
    this.#state = "closed";
    this.#returnFocus(ours);
    dispatch(this, `${this.eventPrefix}-close`, this.#reason, false);
  }

  /** Leaves the overlay stack. */
  #leave(): void {
    const index = stack.indexOf(this);
    if (index >= 0) stack.splice(index, 1);
    this.#listen(false);
    OcelleOverlay.#syncTop();
  }

  #returnFocus(ours: boolean): void {
    const opener = this.#opener;
    this.#opener = null;
    // Focus another overlay took is kept: the inner close() moves focus only from inside the dialog.
    if (!ours) return;
    const valid = opener instanceof HTMLElement && opener.isConnected && !opener.matches(":disabled") && !inert(opener);
    if (valid) {
      opener.focus();
      return;
    }
    const beneath = stack.at(-1);
    const target = beneath === undefined ? null : beneath.#initialTarget();
    if (target !== null) {
      target.focus();
      return;
    }
    const active = deepActive();
    if (active instanceof HTMLElement) active.blur();
  }

  // Motion -------------------------------------------------------------------------------------------------------

  /** The keyframes of the entry (`entering`) or the exit, run on the panel. */
  protected keyframes(entering: boolean): Keyframe[] {
    return entering ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
  }

  /** Runs the entry or exit animation, then `done`; with no motion, `done` runs after the next update (R-06). */
  #animate(entering: boolean, done: () => void): void {
    const dialog = this.#dialog;
    const style = getComputedStyle(this);
    const duration = milliseconds(style.getPropertyValue("--ocelle-motion-base"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (dialog === null || reduced || duration <= 0) {
      void this.updateComplete.then(done);
      return;
    }
    const easing = style.getPropertyValue("--ocelle-easing-standard").trim() || "linear";
    const animation = dialog.animate(this.keyframes(entering), { duration, easing });
    this.#animation = animation;
    animation.onfinish = () => {
      if (this.#animation !== animation) return;
      this.#animation = undefined;
      done();
    };
  }

  // Input --------------------------------------------------------------------------------------------------------

  #onCloseClick = (): void => {
    if (this.#state === "opening" || this.#state === "shown") this.#request("close-button");
  };

  #onKeydown = (event: KeyboardEvent): void => {
    this.#key(event, false);
  };

  #onDocumentKeydown = (event: KeyboardEvent): void => {
    if (deepActive() === null) this.#key(event, true);
  };

  #key(event: KeyboardEvent, fromBody: boolean): void {
    if (stack.at(-1) !== this) return;
    if (event.key === "Escape") this.#escape(event);
    else if (event.key === "Tab") this.#tab(event, fromBody);
  }

  #escape(event: KeyboardEvent): void {
    this.#asideFor = null;
    if (this.#state === "closing") {
      event.preventDefault();
      return;
    }
    if (event.defaultPrevented || event.isComposing) return;
    const active = deepActive();
    if (active instanceof HTMLInputElement && active.type === "search" && active.value !== "") return;
    if (this.#watcherAbove(false)) return;
    event.preventDefault();
    this.#request("escape");
  }

  /** The `<dialog>` elements of the overlay's content, its own excluded. */
  #dialogs(): HTMLDialogElement[] {
    return descendants(this).filter((each): each is HTMLDialogElement => each instanceof HTMLDialogElement);
  }

  #nonModal(): HTMLDialogElement[] {
    return this.#dialogs().filter((each) => !each.matches(":modal"));
  }

  /**
   * Whether another close watcher is open above the overlay in its content (R-02): an open `auto` or `hint` popover,
   * another modal `<dialog>`, or, for Escape only (`tab` false), a non-modal `<dialog>` opened after the overlay that
   * closes on a close request.
   */
  #watcherAbove(tab: boolean): boolean {
    const content = descendants(this);
    for (const each of content) {
      if (!(each instanceof HTMLElement)) continue;
      if (each.matches(":popover-open") && each.popover !== "manual") return true;
      if (each instanceof HTMLDialogElement && each.matches(":modal")) return true;
      if (!tab && each instanceof HTMLDialogElement && each.open && !this.#below.has(each) && closesOnRequest(each)) {
        this.#asideFor = each;
        return true;
      }
    }
    return false;
  }

  #onCancel = (event: Event): void => {
    if (event.target !== this.#dialog) return;
    // A non-cancelable cancel is a platform close, handled by its close event (R-03).
    if (!event.cancelable) return;
    event.preventDefault();
    if (this.#state !== "opening" && this.#state !== "shown") return;
    if (this.#asideFor !== null) this.#below.add(this.#asideFor);
    this.#asideFor = null;
    this.#request("escape");
  };

  #onClose(event: Event): void {
    const dialog = this.#dialog;
    if (dialog === null || event.target !== dialog) {
      if (event.target instanceof HTMLDialogElement) this.#below.delete(event.target);
      return;
    }
    // A stale event: the dialog closed by the overlay or the platform is open again.
    if (dialog.open) return;
    if (this.#state === "opening" || this.#state === "shown") {
      // A platform close (R-03): reason host, nothing to close.
      this.#state = "closing";
      this.#reason = "host";
      this.#animation?.cancel();
      this.#animation = undefined;
      this.open = false;
      this.#finish();
    } else if (this.#state === "closing") {
      this.#animation?.cancel();
      this.#animation = undefined;
      this.#finish();
    }
  }

  #onToggle(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLDialogElement && target !== this.#dialog && (event as ToggleEvent).oldState === "open") this.#below.delete(target);
  }

  // Tab ----------------------------------------------------------------------------------------------------------

  /** The candidates of the cycle: the close control, then the body's and the footer's, in both orders (R-04). */
  #candidates(): { flat: Candidate[]; order: Candidate[] } {
    const dialog = this.#dialog;
    if (dialog === null) return { flat: [], order: [] };
    const { flat, order } = walk(dialog);
    const sentinel = this.#sentinel;
    return { flat: flat.filter((each) => each.element !== sentinel), order: order.filter((each) => each.element !== sentinel) };
  }

  #tab(event: KeyboardEvent, fromBody: boolean): void {
    if (event.defaultPrevented || this.#watcherAbove(true)) return;
    const { flat, order } = this.#candidates();
    const stops = order.filter((each) => each.kind === "stop");
    const first = stops[0];
    const last = stops.at(-1);
    if (first === undefined || last === undefined) return;
    const back = event.shiftKey;
    const active = deepActive();
    if (fromBody || active === null) {
      event.preventDefault();
      this.#tryFocus((back ? [...order].reverse() : order).map((each) => each.element));
      return;
    }
    // Focus in opaque content: the engine moves it (R-04).
    if (isOpaqueContent(active)) return;
    if (back && active === first.element) {
      const end = order.at(-1);
      if (end !== undefined && isOpaqueContent(end.element)) {
        // The sentinel wrap: the native move runs from the panel's end into the content, from its end.
        this.#sentinel?.focus();
        return;
      }
      event.preventDefault();
      this.#tryFocus([...order].reverse().map((each) => each.element));
      return;
    }
    if (!back && active === last.element) {
      const at = flat.findIndex((each) => each.element === last.element);
      if (flat.slice(at + 1).some((each) => isOpaqueContent(each.element))) return;
      event.preventDefault();
      this.#tryFocus(order.map((each) => each.element));
      return;
    }
    if (order.some((each) => each.element === active)) return;
    // From a non-stop of the overlay's own tree: the next (previous) candidate by flat-tree position, wrapping.
    event.preventDefault();
    const elements = flat.map((each) => each.element);
    const later = elements.filter((each) => before(active, each));
    const earlier = elements.filter((each) => !later.includes(each));
    this.#tryFocus(back ? [...earlier.reverse(), ...later.reverse()] : [...later, ...earlier]);
  }

  /**
   * R-04's repair: a native move out of opaque content that lands on the body goes to the first stop, the close
   * control (the header comes first in the panel, and a positive `tabindex` orders only within its own scope). A
   * closed overlay has left the stack.
   */
  #onFocusout(event: FocusEvent): void {
    if (event.relatedTarget !== null || !(event.target instanceof Element) || !isOpaqueContent(event.target)) return;
    setTimeout(() => {
      if (stack.at(-1) !== this || this.#state === "closing" || deepActive() !== null) return;
      this.#close?.focus();
    }, 0);
  }

  // Body and footer ----------------------------------------------------------------------------------------------

  #onBodySlot = (): void => {
    this.#observeContent();
    this.#measure();
  };

  #onFooterSlot = (event: Event): void => {
    const filled = (event.target as HTMLSlotElement).assignedNodes().length > 0;
    if (filled === this.#footer) return;
    this.#footer = filled;
    this.requestUpdate();
  };

  #observeContent(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('[part="body"] > slot');
    const observer = this.#observer;
    if (slot === null || observer === undefined) return;
    for (const element of slot.assignedElements()) observer.observe(element);
  }

  /** The body is a Tab stop exactly while it overflows (R-04, R-18). */
  #measure(): void {
    const body = this.#body;
    if (body === null) return;
    const overflowing = body.scrollHeight > body.clientHeight;
    if (overflowing === this.#overflowing) return;
    this.#overflowing = overflowing;
    this.requestUpdate();
  }
}

/**
 * Whether `a` comes before `b` (another element of the same document) in the flat tree, through shadow roots and
 * slots: an ancestor comes before its descendants. Below the elements' last common flat-tree ancestor, which is an
 * element (the root element is common to both), the one whose branch is the earlier flat child comes first; the
 * branch of an ancestor ends there, at no child (-1).
 */
function before(a: Element, b: Element): boolean {
  const pathOf = (element: Element): Node[] => {
    const path: Node[] = [];
    for (let each: Node | null = element; each !== null; each = flatParent(each)) path.unshift(each);
    return path;
  };
  const pa = pathOf(a);
  const pb = pathOf(b);
  let index = 0;
  while (pa[index] === pb[index]) index += 1;
  const siblings: readonly (Node | undefined)[] = flatChildren(pa[index - 1] as Element);
  return siblings.indexOf(pa[index]) < siblings.indexOf(pb[index]);
}

/** The parent of `node` in the flat tree: its assigned slot, or its parent, or its shadow root's host. */
function flatParent(node: Node): Node | null {
  if (node instanceof Element && node.assignedSlot !== null) return node.assignedSlot;
  if (node.parentNode instanceof ShadowRoot) return node.parentNode.host;
  return node.parentNode;
}
