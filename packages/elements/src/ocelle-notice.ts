// `ocelle-notice` (specs/010-feedback-forms FR-004 to FR-011; research.md R-02, R-03; data-model.md § Notice): a
// message about a state or result in a box whose look follows its tone, with an optional heading, in the regular or
// the compact size. The box is a wrapper in the shadow root whose classes follow the normalised `tone` and `size`
// (R-03), so an unknown attribute value is kept as written and only the property reads the default. With `announce`,
// or a host `role` of `alert` or `status`, the notice announces its text through the announcer of src/live.ts, a
// separate atomic live region after the box, at the moments of data-model.md § Announcement transitions; the host's
// own node is kept from being a second live region by `internals.ariaLive = "off"`. For a host `role="alert"` the
// insertion, the reveal and a change of the role to `alert` write no copy (Chromium's alert event reads the notice)
// and the baseline is taken at the end of the task. Each rule a test plant changes is a protected method
// (data-model.md § Plant seams). Importing this module defines `ocelle-notice` and no other element.
import { LitElement, css, html } from "lit";
import type { PropertyValues } from "lit";
import { define, registering } from "./define.ts";
import { Announcer, afterTask, collapse, readyState } from "./live.ts";
import type { Politeness, Reading } from "./live.ts";

/** The notice's tones. */
export type NoticeTone = "info" | "success" | "warning" | "danger" | "neutral";
/** The notice's sizes. */
export type NoticeSize = "regular" | "compact";

const tones: readonly string[] = ["info", "success", "warning", "danger", "neutral"];

/** The trigger that set the alert baseline pending, or none (data-model.md § Notice). */
type Pending = "none" | "insertion" | "role" | "live";

/** A host role that makes the notice announce, or null: the first token of the role attribute (FR-009). */
function liveRoleOf(role: string | null): "alert" | "status" | null {
  const first = role?.trim().split(/\s/)[0]?.toLowerCase();
  return first === "alert" || first === "status" ? first : null;
}

/** The text of a slotted node as FR-008 defines it, each label or alt counted as if surrounded by spaces. */
function textOf(node: Node): string {
  if (node instanceof Text) return node.data;
  if (!(node instanceof Element)) return "";
  if (node.hasAttribute("hidden") || node.getAttribute("aria-hidden") === "true") return "";
  const name = node.localName;
  if (name === "script" || name === "style" || name === "template") return "";
  if (name === "ocelle-icon") {
    const label = (node as Element & { label?: unknown }).label;
    return ` ${typeof label === "string" ? label : (node.getAttribute("label") ?? "")} `;
  }
  if (name === "img") return ` ${node.getAttribute("alt") ?? ""} `;
  return [...node.childNodes].map(textOf).join("");
}

/**
 * A message about a state or result in a box whose look follows its tone, with an optional heading, in the regular or
 * the compact size, announced once by assistive technology when `announce` is set.
 *
 * @tagname ocelle-notice
 * @slot heading - The heading, optional; only elements are assigned to it, and it is absent when their text content is empty or whitespace only.
 * @slot - The body.
 * @csspart heading - The heading's box, not drawn when the heading is absent.
 * @csspart body - The body's box.
 */
export class OcelleNotice extends LitElement {
  static override properties = {
    // The accessors below are the properties' own and set the attribute themselves; `useDefault` keeps Lit from
    // writing the read default into the attribute at the first update, so an unknown value stays as written.
    // Stryker disable next-line ObjectLiteral: equivalent, {} has Lit wrap the element's own accessors, which write the attribute themselves, and reflect nothing; the wrapper's extra update request repeats the one the attribute change makes
    tone: {
      // Stryker disable next-line BooleanLiteral: equivalent, Lit reflects a property only when it is set through Lit's accessor, which noAccessor leaves out; the setter writes the attribute itself
      reflect: true,
      noAccessor: true,
      useDefault: true,
    },
    // Stryker disable next-line ObjectLiteral: equivalent, as for tone
    size: {
      // Stryker disable next-line BooleanLiteral: equivalent, as for tone
      reflect: true,
      noAccessor: true,
      useDefault: true,
    },
    announce: {
      type: Boolean,
      // Stryker disable next-line BooleanLiteral: equivalent, as for tone
      reflect: true,
      // Stryker disable next-line BooleanLiteral: equivalent, Lit's wrapper of the setter reflects the Boolean the getter reads, which is the attribute's presence the setter has just written
      noAccessor: true,
      // Stryker disable next-line BooleanLiteral: equivalent, Lit falls back to the default only when the converter gives null or undefined for an attribute, and the Boolean converter gives false for a removed one
      useDefault: true,
    },
  };

  /** `role` and `hidden` are observed, not properties (FR-034): they change what the notice announces. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "role", "hidden"];
  }

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .box {
      color: var(--ocelle-color-ink);
      border-radius: var(--ocelle-radius-row);
      padding-block: var(--ocelle-space-3);
      padding-inline: var(--ocelle-space-4);
      overflow-wrap: anywhere;
    }

    [part="heading"] {
      font-weight: var(--ocelle-font-weight-strong);
      font-size: var(--ocelle-font-size-subhead);
      line-height: var(--ocelle-line-height-tight);
      margin-block-end: var(--ocelle-space-2);
    }

    [part="heading"][hidden] {
      display: none;
    }

    .announcer {
      position: absolute;
      inline-size: var(--ocelle-border-width);
      block-size: var(--ocelle-border-width);
      margin: calc(-1 * var(--ocelle-border-width));
      padding: 0;
      border: 0;
      overflow: hidden;
      color: transparent;
      forced-color-adjust: none;
      white-space: nowrap;
    }

    @media not (forced-colors: active) {
      .size-compact {
        padding-block: var(--ocelle-space-2);
        padding-inline: var(--ocelle-space-3);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-compact);
      }

      .size-compact [part="heading"] {
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-compact);
        margin-block-end: var(--ocelle-space-1);
      }

      .tone-info {
        background-color: var(--ocelle-color-info-bg);
        border-inline-start: var(--ocelle-bar-width) solid var(--ocelle-color-info);
      }

      .tone-success {
        background-color: var(--ocelle-color-success-bg);
        border-inline-start: var(--ocelle-bar-width) solid var(--ocelle-color-success);
      }

      .tone-warning {
        background-color: var(--ocelle-color-warning-bg);
        border-inline-start: var(--ocelle-bar-width) solid var(--ocelle-color-warning);
      }

      .tone-danger {
        background-color: var(--ocelle-color-danger-bg);
        border-inline-start: var(--ocelle-bar-width) solid var(--ocelle-color-danger);
      }

      .tone-neutral {
        background-color: var(--ocelle-color-neutral-bg);
        border-inline-start: var(--ocelle-bar-width) solid var(--ocelle-color-neutral);
      }
    }

    @media (forced-colors: active) {
      .box {
        border: var(--ocelle-border-width) solid CanvasText;
        border-inline-start-width: var(--ocelle-bar-width);
        background-color: Canvas;
        color: CanvasText;
      }
    }
  `;

  /** The element's internals: the host's node keeps its role and is never a live region of its own. */
  protected readonly internals: ElementInternals;
  /** The announcer: the live region after the box and its steps. */
  protected readonly announcer: Announcer;
  /** The trigger that set the alert baseline pending, reset by the end-of-task step. */
  protected pending: Pending = "none";
  /** Set on disconnect, cleared in a later task: a connection while it is set is a move. */
  protected moving = false;
  /** Whether the element was constructed by the registration of its definition (first load). */
  protected readonly upgraded: boolean;
  #connected = false;

  constructor() {
    super();
    this.upgraded = registering();
    this.internals = this.attachInternals();
    this.setupInternals();
    this.announcer = this.createAnnouncer(() => this.reading());
    new MutationObserver((records) => {
      this.mutated(records);
    }).observe(this, { childList: true, characterData: true, attributes: true, subtree: true });
  }

  /**
   * The tone: `info`, `success`, `warning`, `danger` or `neutral`; any other value behaves as `info` and the property
   * reads `"info"`, while the attribute keeps the value as written. Reflected.
   *
   * @default "info"
   */
  get tone(): "info" | "success" | "warning" | "danger" | "neutral" {
    const value = this.getAttribute("tone") ?? "";
    return tones.includes(value) ? (value as NoticeTone) : "info";
  }

  set tone(value: "info" | "success" | "warning" | "danger" | "neutral") {
    this.reflect("tone", value, this.tone);
  }

  /**
   * The size: `regular` or `compact`; any other value behaves as `regular` and the property reads `"regular"`, while
   * the attribute keeps the value as written. Reflected.
   *
   * @default "regular"
   */
  get size(): "regular" | "compact" {
    return this.getAttribute("size") === "compact" ? "compact" : "regular";
  }

  set size(value: "regular" | "compact") {
    this.reflect("size", value, this.size);
  }

  /**
   * Whether the notice announces its text once on insertion after parsing, on reveal and on each change, politely
   * for `info`, `success` and `neutral` and assertively for `warning` and `danger`. Reflected.
   *
   * @default false
   */
  get announce(): boolean {
    return this.hasAttribute("announce");
  }

  set announce(value: boolean) {
    this.toggleAttribute("announce", value);
  }

  /**
   * Sets attribute `name` to `value`; null or undefined removes it. Nothing is written when the attribute already holds
   * the value (Lit sets the property from each attribute change, so a write there would recurse), nor when the
   * attribute is absent and the value is the one the property reads.
   */
  private reflect(name: string, value: string | null | undefined, current: string): void {
    const attribute = this.getAttribute(name);
    if (value === null || value === undefined) this.removeAttribute(name);
    else if (value !== attribute && (attribute !== null || value !== current)) this.setAttribute(name, value);
  }

  /** Sets up the internals: `ariaLive` off, so a host `role` of `alert` or `status` adds no live region (R-02). */
  protected setupInternals(): void {
    this.internals.ariaLive = "off";
  }

  /** The announcer of this notice. */
  protected createAnnouncer(read: () => Reading): Announcer {
    return new Announcer(read);
  }

  /** The host role that makes the notice announce, or null. */
  protected liveRole(): "alert" | "status" | null {
    return liveRoleOf(this.getAttribute("role"));
  }

  /** Whether the notice announces: `announce`, or a host role `alert` or `status`. */
  protected isLive(): boolean {
    return this.announce || this.liveRole() !== null;
  }

  /** The politeness: assertive for a host `alert`, polite for `status`, else by the tone (FR-009). */
  protected politeness(): Politeness {
    const role = this.liveRole();
    if (role !== null) return role === "alert" ? "assertive" : "polite";
    return this.tone === "warning" || this.tone === "danger" ? "assertive" : "polite";
  }

  /** The elements assigned to the heading slot. */
  private headings(): Element[] {
    return [...this.children].filter((child) => child.getAttribute("slot") === "heading");
  }

  /** Whether the heading is present: its elements' text content is not empty or whitespace only (FR-006). */
  protected headingPresent(): boolean {
    return collapse(this.headings().map((heading) => heading.textContent).join("")) !== "";
  }

  /** The notice's text as FR-008 defines it, heading then body, before whitespace is collapsed. */
  protected text(): string {
    const heading = this.headingPresent() ? this.headings().map(textOf).join(" ") : "";
    const body = [...this.childNodes].filter((node) => !(node instanceof Element) || !node.hasAttribute("slot") || node.getAttribute("slot") === "");
    return `${heading} ${body.map(textOf).join("")}`;
  }

  /** What the notice announces now. */
  protected reading(): Reading {
    return { text: this.text(), politeness: this.politeness() };
  }

  /** The region's live politeness: the notice's while it announces, else off. */
  protected syncLive(): void {
    this.announcer.live(this.isLive() ? this.politeness() : "off");
  }

  /** The first-load query: constructed by the registration, or connected while the document is loading (R-02). */
  protected isFirstLoad(): boolean {
    return this.upgraded || readyState() === "loading";
  }

  /** The move query: connected while the move flag is set. */
  protected isMove(): boolean {
    return this.moving;
  }

  /** On disconnect: the move flag set. */
  protected startMove(): void {
    this.moving = true;
  }

  /** In the task after a disconnect: the move flag cleared, and a notice still removed cancels. */
  protected endMove(): void {
    this.moving = false;
    if (this.isConnected) return;
    this.pending = "none";
    this.announcer.cancel();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.onConnect();
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, LitElement's disconnectedCallback() only tells reactive controllers, and the notice has none
    super.disconnectedCallback();
    this.startMove();
    afterTask(() => {
      this.endMove();
    });
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's attributeChangedCallback() only sets the property from the attribute, and the notice's own setters write nothing when the attribute already holds the value
    super.attributeChangedCallback(name, old, value);
    this.requestUpdate();
    if (old === value || !this.#connected || !this.isConnected) return;
    if (name === "hidden") this.onHidden(value !== null);
    else if (name === "role") this.onRole(old);
    else if (name === "tone") this.onTone();
    else if (name === "announce") this.onAnnounce();
  }

  /** Light-DOM mutations (the host's own attributes left out): the heading's layout and the text change. */
  protected mutated(records: readonly MutationRecord[]): void {
    if (records.every((record) => record.type === "attributes" && record.target === this)) return;
    this.requestUpdate();
    this.onContent();
  }

  /** A connection: a move, the first load, or an insertion after parsing. */
  protected onConnect(): void {
    if (this.isMove()) {
      // the move flag stays set until endMove() clears it in the next task; a later connection follows a disconnect
      return;
    }
    const first = !this.#connected;
    this.#connected = true;
    if (first && this.isFirstLoad()) {
      this.announcer.takeBaseline();
      return;
    }
    if (!this.isLive() || this.hidden) return;
    if (this.liveRole() === "alert") this.alertPath("insertion");
    else this.announcer.trigger(true);
  }

  /** `hidden` set or removed: a cancel, or a reveal announced as an insertion. */
  protected onHidden(hidden: boolean): void {
    if (hidden) {
      this.pending = "none";
      this.announcer.cancel();
      return;
    }
    if (!this.isLive()) return;
    if (this.liveRole() === "alert") this.alertPath("insertion");
    else this.announcer.trigger(true);
  }

  /** A change of the host role from `previous`. */
  protected onRole(previous: string | null): void {
    const before = liveRoleOf(previous);
    const after = this.liveRole();
    const wasLive = this.announce || before !== null;
    if (!wasLive) {
      this.becameLive();
      return;
    }
    if (!this.isLive()) {
      this.stopLive();
      return;
    }
    if (before === after || this.hidden) return;
    if (after === "alert") this.alertPath("role");
    else if (this.pending !== "none") this.leaveAlert();
    else if (!this.announcer.samePoliteness(this.politeness())) this.announcer.trigger(false);
  }

  /** A `tone` change: announced when it changes the politeness (while the alert baseline is pending, the wait's re-check drops it). */
  protected onTone(): void {
    if (!this.isLive() || this.hidden) return;
    if (!this.announcer.samePoliteness(this.politeness())) this.announcer.trigger(false);
  }

  /** `announce` set or removed: becoming live takes the baseline, stopping cancels; a live role decides alone. */
  protected onAnnounce(): void {
    if (this.liveRole() !== null) return;
    if (this.announce) this.becameLive();
    else this.stopLive();
  }

  /** A light-DOM change: announced when it changes the text (while the alert baseline is pending, the wait's re-check drops it). */
  protected onContent(): void {
    if (!this.#connected || !this.isLive() || this.hidden) return;
    if (!this.announcer.sameText(this.text())) this.announcer.trigger(false);
  }

  /** The notice began announcing (or stays silent after a role change, its baseline then unread): the current text, at the end of the task for `alert`. */
  protected becameLive(): void {
    this.announcer.takeBaseline();
    if (this.liveRole() !== "alert") return;
    this.pending = "live";
    this.postAlertStep();
  }

  /** The notice stopped announcing: cancel. */
  protected stopLive(): void {
    this.pending = "none";
    this.announcer.cancel();
  }

  /**
   * The alert path: no copy, the baseline taken at the end of the task (R-02). An insertion or a reveal leaves the
   * baseline as it is: the end-of-task step replaces it before any wait started in the task can end, and a change away
   * from `alert` in the same task triggers as an insertion, which sets it to none.
   */
  protected alertPath(trigger: "insertion" | "role"): void {
    this.announcer.alert();
    this.pending = trigger;
    this.postAlertStep();
  }

  /** Posts the end-of-task step. */
  protected postAlertStep(): void {
    afterTask(() => {
      this.alertStep();
    });
  }

  /** The end-of-task step: the baseline taken if it is still pending; nothing once the marker was reset. */
  protected alertStep(): void {
    if (this.pending === "none") return;
    this.pending = "none";
    this.announcer.takeBaseline();
  }

  /**
   * A change away from `alert` that keeps the notice live while the alert baseline is pending: an insertion's trigger,
   * the baseline taken for a notice that became live as `alert`, or after a role change a trigger whose re-check drops
   * it when neither the text nor the politeness changed.
   */
  protected leaveAlert(): void {
    const pending = this.pending;
    this.pending = "none";
    if (pending === "insertion") this.announcer.trigger(true);
    else if (pending === "live") this.announcer.takeBaseline();
    else this.announcer.trigger(false);
  }

  protected override updated(changed: PropertyValues): void {
    // Stryker disable next-line CallExpression: equivalent, LitElement's updated() does nothing
    super.updated(changed);
    this.syncLive();
  }

  protected override render(): unknown {
    return html`<div class="box tone-${this.tone} size-${this.size}"
      ><div part="heading" ?hidden=${!this.headingPresent()}><slot name="heading"></slot></div
      ><div part="body"><slot></slot></div
    ></div>${this.announcer.region}`;
  }
}

define("ocelle-notice", OcelleNotice);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-notice": OcelleNotice;
  }
}
