// `ocelle-card` (011 FR-001 to FR-008, FR-014 to FR-018; research.md R-01 to R-03, R-05, R-06, R-08; data-model.md
// § Elements): a `header` slot above the body (the default slot), with a `--ocelle-border-width` border in
// `--ocelle-color-rule`, `--ocelle-radius-row` corners and the `--ocelle-color-sheet` ground, or `--ocelle-color-inset`
// with `inset`. The host is the box: border-box, with the padding of its density, regular `--ocelle-space-7` or compact
// `--ocelle-space-5`; inside, a flex column with the density's header-to-body gap, `--ocelle-space-2` or
// `--ocelle-space-4`. A slot's wrapper is `display: none` while the slot is empty (src/slot-state.ts, R-03), so a card
// with no header has no gap. The first visible body element's block-start margin and the last one's block-end margin
// are trimmed, a `hidden` element at an edge skipped, by normal `::slotted()` rules that a page rule beats (FR-008).
//
// `density` and `inset` are reflected with no initial value (R-06); the styles key on the valid values only, so an
// empty or invalid `density` draws regular and is left as the page wrote it. The density's padding and gap are layout
// rules outside `@media not (forced-colors: active)`, so a compact card keeps them in forced colours; the grounds
// sit inside it (FR-001, FR-016). A section header assigned to the `header` slot reads the card's density itself
// (src/card-context.ts, R-05); the card asks the headers assigned to that slot, and those that just left it, to update
// on the slot's `slotchange` and when `density` changes. The card exposes no role (FR-018). Importing this module
// defines `ocelle-card` and no other element: it matches section headers by local name and never imports their class.
import { LitElement, css, html, nothing } from "lit";
import type { PropertyValues } from "lit";
import { notifyHeaders } from "./card-context.ts";
import { define } from "./define.ts";
import { SlotState } from "./slot-state.ts";

/**
 * A card: a header slot above its body, in a regular or compact density, on the sheet or the inset ground.
 *
 * @tagname ocelle-card
 * @slot header - The card's header, usually an `ocelle-section-header`, which a compact card draws at its compact size.
 * @slot - The card's body.
 */
export class OcelleCard extends LitElement {
  static override properties = {
    density: { type: String, reflect: true },
    inset: { type: Boolean, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      padding: var(--ocelle-space-7);
      border: var(--ocelle-border-width) solid var(--ocelle-color-rule);
      border-radius: var(--ocelle-radius-row);
    }

    :host([hidden]) {
      display: none;
    }

    :host([density="compact"]) {
      padding: var(--ocelle-space-5);
    }

    .layout {
      display: flex;
      flex-direction: column;
      gap: var(--ocelle-space-2);
    }

    :host([density="compact"]) .layout {
      gap: var(--ocelle-space-4);
    }

    .empty {
      display: none;
    }

    ::slotted(:nth-child(1 of :not([slot]):not([hidden]))) {
      margin-block-start: 0;
    }

    ::slotted(:nth-last-child(1 of :not([slot]):not([hidden]))) {
      margin-block-end: 0;
    }

    @media not (forced-colors: active) {
      :host {
        background-color: var(--ocelle-color-sheet);
      }

      :host([inset]) {
        background-color: var(--ocelle-color-inset);
      }
    }
  `;

  /**
   * The card's density: `regular` or `compact`, whose padding and header-to-body gap are smaller and which draws a
   * section header in its `header` slot at the compact size. Not set, or any other value, draws regular. Reflected.
   *
   * @default undefined
   */
  declare density: "regular" | "compact" | undefined;

  /**
   * Draws the card on the inset ground, for a card nested inside another surface; present with any value is inset.
   * Changes nothing else. Reflected.
   *
   * @default undefined
   */
  declare inset: boolean | undefined;

  readonly #slots = new SlotState(this);
  #headers: Element[] = [];

  readonly #headerChanged = (event: Event): void => {
    this.#headers = notifyHeaders(event.target as HTMLSlotElement, this.#headers);
  };

  protected override updated(changed: PropertyValues<this>): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="header"]');
    if (changed.has("density") && slot !== null) this.#headers = notifyHeaders(slot, this.#headers);
  }

  protected override render(): unknown {
    return html`<div class="layout">
      <div class=${this.#slots.empty("header") ? "empty" : nothing}><slot name="header" @slotchange=${this.#headerChanged}></slot></div>
      <div class=${this.#slots.empty("") ? "empty" : nothing}><slot></slot></div>
    </div>`;
  }
}

define("ocelle-card", OcelleCard);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-card": OcelleCard;
  }
}
