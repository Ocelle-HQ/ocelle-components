// `ocelle-empty-state` (013 FR-020 to FR-026; research.md R-04; data-model.md § `ocelle-empty-state`): an empty or
// loading panel, the consumer's heading, body and actions in one centred column. The shadow root is one column,
// `part="body"`, of five wrappers in a fixed order (visual, eyebrow, heading, text, actions), each holding its slot;
// none has a role, so the element adds no heading, landmark, live region or tab stop, and the slotted content keeps
// its own. A part is present while something assigned to its slot renders (an element whose computed `display` is not
// `none`, or text that is not whitespace), recomputed on `slotchange` and from a `MutationObserver` on the assigned
// nodes (`hidden` on elements, character data on text), since toggling `hidden` on slotted content fires no
// `slotchange`. An absent part is `display: none`. The column has no gap: each present part but the last carries the
// margin below it that R-04's table names, chosen by the part itself (the eyebrow's by whether a heading follows), so
// an absent part adds no space anywhere. Importing this module defines `ocelle-empty-state` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";

/** The parts of the column, in their order. */
const parts = ["visual", "eyebrow", "heading", "text", "actions"] as const;
type PartName = (typeof parts)[number];

/** HTML whitespace (space, tab, line feed, form feed, carriage return) only. */
const whitespace = /^[\t\n\f\r ]*$/;

/** Whether a node assigned to a slot renders: an element with a box (or `display: contents`), or text that is not whitespace. */
function renders(node: Node): boolean {
  if (node instanceof Element) return getComputedStyle(node).display !== "none";
  return node.nodeType === Node.TEXT_NODE && !whitespace.test(node.textContent ?? "");
}

/**
 * An empty or loading panel: the consumer's own heading, body and actions in one centred column, with an optional
 * visual and eyebrow above the heading.
 *
 * @tagname ocelle-empty-state
 * @slot visual - An icon or an `ocelle-progress` above the heading. A progress bar spans the column up to the reading measure; an icon stays centred.
 * @slot eyebrow - A short line above the heading (for example "Refused"), shown small, medium weight, muted and in upper case. Not a heading: the element adds no role.
 * @slot heading - The consumer's own heading element. Its level is the consumer's; the element never adds a heading.
 * @slot - The body. Each element is a block with no block margins, separated from the next by a small gap; put inline content in one `<p>`.
 * @slot actions - Buttons or links. They wrap when narrow.
 * @csspart body - The centred column, with its block padding and every slot in it. The body's content sits in an internal wrapper inside it, which is not a part.
 */
export class OcelleEmptyState extends LitElement {
  static override properties = {
    variant: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding-block: var(--ocelle-space-6);
    }

    :host([variant="panel"]) .stack {
      padding-block: var(--ocelle-space-10);
    }

    .stack > .absent {
      display: none;
    }

    .visual {
      display: flex;
      flex-direction: column;
      align-items: center;
      align-self: stretch;
      margin-block-end: var(--ocelle-space-3);
    }

    .eyebrow {
      margin-block-end: var(--ocelle-space-2);
    }

    .eyebrow.before-heading {
      margin-block-end: var(--ocelle-space-1);
    }

    .heading {
      margin-block-end: var(--ocelle-space-2);
    }

    .text {
      display: flex;
      flex-direction: column;
      gap: var(--ocelle-space-2);
      max-inline-size: var(--ocelle-measure-reading);
      font-size: var(--ocelle-font-size-md);
      margin-block-end: var(--ocelle-space-4);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--ocelle-space-2);
    }

    :host([variant="panel"]) .visual {
      margin-block-end: var(--ocelle-space-5);
    }

    :host([variant="panel"]) .eyebrow {
      margin-block-end: var(--ocelle-space-3);
    }

    :host([variant="panel"]) .eyebrow.before-heading {
      margin-block-end: var(--ocelle-space-2);
    }

    :host([variant="panel"]) .heading {
      margin-block-end: var(--ocelle-space-3);
    }

    :host([variant="panel"]) .text {
      margin-block-end: var(--ocelle-space-6);
    }

    .stack > .last,
    :host([variant="panel"]) .stack > .last {
      margin-block-end: 0;
    }

    ::slotted([slot="heading"]) {
      margin: 0;
      font-size: var(--ocelle-font-size-lg);
      font-weight: var(--ocelle-font-weight-strong);
    }

    :host([variant="panel"]) ::slotted([slot="heading"]) {
      font-weight: var(--ocelle-font-weight-medium);
    }

    ::slotted([slot="eyebrow"]) {
      margin: 0;
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-xs);
      font-weight: var(--ocelle-font-weight-medium);
      text-transform: uppercase;
    }

    ::slotted(:not([slot])) {
      margin-block: 0;
    }

    ::slotted(ocelle-progress) {
      inline-size: 100%;
      max-inline-size: var(--ocelle-measure-reading);
    }

    @media not (forced-colors: active) {
      ::slotted([slot="heading"]) {
        color: var(--ocelle-color-ink);
      }

      ::slotted([slot="eyebrow"]) {
        color: var(--ocelle-color-ink-muted);
      }

      .text {
        color: var(--ocelle-color-ink-muted);
      }
    }
  `;

  /**
   * `panel` fills a list or inspector panel with a larger block padding and larger gaps and a lighter heading. Unset,
   * or any other value, gives the default variant. Reflected.
   *
   * @default undefined
   */
  declare variant: "panel" | undefined;

  /** Which parts are present: something assigned to their slot renders. */
  #has: Record<PartName, boolean> = { visual: false, eyebrow: false, heading: false, text: false, actions: false };

  /** Watches the assigned nodes for what `slotchange` does not report: `hidden` toggled, text changed. */
  readonly #observer = new MutationObserver(() => {
    this.#refresh(false);
  });

  override connectedCallback(): void {
    super.connectedCallback();
    if (this.hasUpdated) this.#refresh(true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#observer.disconnect();
  }

  /** The slot of each part, once rendered. */
  #slots(): [PartName, HTMLSlotElement][] {
    return parts.flatMap((part) => {
      const slot = this.renderRoot.querySelector<HTMLSlotElement>(`.${part} > slot`);
      return slot === null ? [] : [[part, slot] as [PartName, HTMLSlotElement]];
    });
  }

  /** Recomputes the present parts, re-targeting the observer at the assigned nodes when `observe` is set. */
  #refresh(observe: boolean): void {
    const slots = this.#slots();
    if (observe) {
      this.#observer.disconnect();
      for (const [, slot] of slots) {
        for (const node of slot.assignedNodes()) {
          if (node instanceof Element) this.#observer.observe(node, { attributes: true, attributeFilter: ["hidden"] });
          else this.#observer.observe(node, { characterData: true });
        }
      }
    }
    const has = { ...this.#has };
    for (const [part, slot] of slots) has[part] = slot.assignedNodes().some(renders);
    if (parts.some((part) => has[part] !== this.#has[part])) {
      this.#has = has;
      this.requestUpdate();
    }
  }

  readonly #changed = (): void => {
    this.#refresh(true);
  };

  /** The class list of a part's wrapper. */
  #classes(part: PartName, last: PartName | undefined): string {
    const classes: string[] = [part];
    if (!this.#has[part]) classes.push("absent");
    if (part === last) classes.push("last");
    if (part === "eyebrow" && this.#has.heading) classes.push("before-heading");
    return classes.join(" ");
  }

  protected override render(): unknown {
    const last = parts.filter((part) => this.#has[part]).at(-1);
    return html`<div part="body" class="stack">
      <div class=${this.#classes("visual", last)}><slot name="visual" @slotchange=${this.#changed}></slot></div>
      <div class=${this.#classes("eyebrow", last)}><slot name="eyebrow" @slotchange=${this.#changed}></slot></div>
      <div class=${this.#classes("heading", last)}><slot name="heading" @slotchange=${this.#changed}></slot></div>
      <div class=${this.#classes("text", last)}><slot @slotchange=${this.#changed}></slot></div>
      <div class=${this.#classes("actions", last)}><slot name="actions" @slotchange=${this.#changed}></slot></div>
    </div>`;
  }
}

define("ocelle-empty-state", OcelleEmptyState);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-empty-state": OcelleEmptyState;
  }
}
