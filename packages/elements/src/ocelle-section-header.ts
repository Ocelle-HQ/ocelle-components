// `ocelle-section-header` (011 FR-001 to FR-008, FR-010 to FR-013, FR-017; research.md R-02 to R-06; data-model.md
// § Elements): a heading the page slots, never one of its own, with an optional eyebrow above it, an optional
// description under it and optional actions at its inline end. The shadow root holds an outer column with two
// children: the eyebrow wrapper, on a line of its own, and a wrapping row of the heading column (heading and
// description) and the actions wrapper, so the actions' block start is the heading's and the eyebrow's words take
// no part in the side-by-side test (R-04). The heading column's basis is its min-content (its longest word), so the
// actions wrap under it, `--ocelle-space-2` below, only when that word and the actions do not fit side by side, and a
// word longer than the line then breaks inside itself. The heading column is hidden while it shows nothing (no
// heading, and no description or the eyebrow variant), so it takes no line and no gap when the actions wrap; the
// actions then keep the inline end by `margin-inline-start: auto` (FR-005, FR-010). The actions wrapper keeps the
// initial `flex: 0 1 auto` (not R-04's `0 0 auto`): on a line of its own and wider than it, it shrinks to the line
// and its actions wrap onto further lines rather than overflow (FR-004). Each slot's wrapper, and the row when it
// holds nothing, is `display: none` while empty (src/slot-state.ts, R-03), so an empty part takes no gap. The UA
// block margins at the edges of the slotted eyebrow and description are trimmed by normal `::slotted()` rules, which
// a page rule beats (FR-008).
//
// `size` and `variant` are reflected with no initial value (R-06). The size is resolved before each update: the
// header's own valid `size`, else compact when it is assigned to a compact card's own `header` slot
// (src/card-context.ts, R-05), else regular; it is resolved again on every connection, so a header moved in the DOM
// re-reads its slot. The resolved size sets the internal class `compact` on the row. `variant="eyebrow"` draws the
// heading in the eyebrow style and renders neither the eyebrow nor the description slot; its rule is more specific
// than the compact size's, so size changes nothing there (FR-013). Rules that set a colour sit inside
// `@media not (forced-colors: active)`; size and layout rules stay outside, so they hold in forced colours (FR-001).
// Importing this module defines `ocelle-section-header` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { inCompactCardHeader } from "./card-context.ts";
import { define } from "./define.ts";
import { SlotState } from "./slot-state.ts";

/** The class of a slot's wrapper: `empty` while the slot is to take no space, else none. */
function hidden(empty: boolean): string | typeof nothing {
  return empty ? "empty" : nothing;
}

/**
 * A section header around a heading the page slots: an optional eyebrow above, a description under the heading and
 * actions at its inline end.
 *
 * @tagname ocelle-section-header
 * @slot heading - The page's own heading element (`h1` to `h6`), drawn with the header's heading style; its level is the page's.
 * @slot eyebrow - A short label above the heading, drawn with the eyebrow style; not rendered in the eyebrow variant.
 * @slot description - Supporting text under the heading; not rendered in the eyebrow variant.
 * @slot actions - Controls at the inline end of the heading's first line, wrapping under the heading when they do not fit beside it.
 */
export class OcelleSectionHeader extends LitElement {
  static override properties = {
    size: { type: String, reflect: true },
    variant: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: var(--ocelle-space-1);
      overflow-wrap: break-word;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      column-gap: var(--ocelle-space-4);
      row-gap: var(--ocelle-space-2);
    }

    .heading-column {
      display: flex;
      flex: 1 1 min-content;
      flex-direction: column;
      gap: var(--ocelle-space-1);
      min-inline-size: 0;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ocelle-space-2);
    }

    .heading-column.empty + .actions {
      margin-inline-start: auto;
    }

    .empty {
      display: none;
    }

    ::slotted([slot="heading"]),
    ::slotted([slot="eyebrow"]),
    ::slotted([slot="description"]) {
      display: block;
    }

    ::slotted([slot="heading"]) {
      margin: 0;
      font-family: var(--ocelle-font-display);
      font-size: var(--ocelle-font-size-lg);
      font-weight: var(--ocelle-font-weight-strong);
      line-height: var(--ocelle-line-height-tight);
    }

    .compact ::slotted([slot="heading"]) {
      font-size: var(--ocelle-font-size-subhead);
    }

    ::slotted([slot="eyebrow"]),
    :host([variant="eyebrow"]) ::slotted([slot="heading"]) {
      margin: 0;
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-eyebrow);
      font-weight: var(--ocelle-font-weight-eyebrow);
      font-variant-numeric: var(--ocelle-figures);
      letter-spacing: var(--ocelle-tracking-eyebrow);
      line-height: var(--ocelle-line-height-normal);
      text-transform: uppercase;
    }

    ::slotted([slot="description"]) {
      margin-block: 0;
      font-size: var(--ocelle-font-size-sm);
    }

    @media not (forced-colors: active) {
      ::slotted([slot="heading"]) {
        color: var(--ocelle-color-ink);
      }

      ::slotted([slot="eyebrow"]),
      :host([variant="eyebrow"]) ::slotted([slot="heading"]) {
        color: var(--ocelle-color-eyebrow);
      }

      ::slotted([slot="description"]) {
        color: var(--ocelle-color-ink-muted);
      }
    }
  `;

  /**
   * The heading's size: `regular` or `compact`. Not set, or any other value, draws regular, or compact when the
   * header is in a compact card's `header` slot; a valid value wins over the card. No effect in the eyebrow variant.
   * Reflected.
   *
   * @default undefined
   */
  declare size: "regular" | "compact" | undefined;

  /**
   * `eyebrow` draws the heading with the eyebrow style and renders neither the eyebrow nor the description slot;
   * `default`, not set or any other value draws the default heading style. Reflected.
   *
   * @default undefined
   */
  declare variant: "default" | "eyebrow" | undefined;

  readonly #slots = new SlotState(this);
  // Stryker disable next-line BooleanLiteral: equivalent, willUpdate sets it before every render, so the initial value is never read
  #compact = false;

  override connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  protected override willUpdate(): void {
    this.#compact = this.size === "compact" || (this.size !== "regular" && inCompactCardHeader(this));
  }

  protected override render(): unknown {
    const eyebrow = this.variant === "eyebrow";
    const empty = (name: string): boolean => this.#slots.empty(name);
    // The heading column is hidden while it shows nothing, so actions that do not fit beside an empty column take no
    // second line. The row is hidden when it holds nothing, so an eyebrow alone takes no gap under it.
    const column = empty("heading") && (eyebrow || empty("description"));
    const row = empty("heading") && empty("description") && empty("actions");
    return html`<div class="column">
      ${eyebrow ? nothing : html`<div class=${hidden(empty("eyebrow"))}><slot name="eyebrow"></slot></div>`}
      <div class=${row ? "row empty" : this.#compact ? "row compact" : "row"}>
        <div class=${column ? "heading-column empty" : "heading-column"}>
          <div class=${hidden(empty("heading"))}><slot name="heading"></slot></div>
          ${eyebrow ? nothing : html`<div class=${hidden(empty("description"))}><slot name="description"></slot></div>`}
        </div>
        <div class=${empty("actions") ? "actions empty" : "actions"}><slot name="actions"></slot></div>
      </div>
    </div>`;
  }
}

define("ocelle-section-header", OcelleSectionHeader);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-section-header": OcelleSectionHeader;
  }
}
