// `ocelle-page-header` (011 FR-001 to FR-008, FR-019, FR-031; research.md R-01 to R-04, R-06, R-07; data-model.md
// § Elements): a screen's title band around a heading the page slots, never one of its own, with an optional eyebrow
// above it, an optional description (a subtitle) under it and optional actions at its inline end. The host is the
// band: block padding `--ocelle-space-4`, inline padding `--ocelle-space-6`, a `--ocelle-border-width` rule in
// `--ocelle-color-rule` along its block end, `box-sizing: border-box`, and no ground of its own, so it shows the
// surface it sits on (R-07). The band is a plain `div` structure, never a `<header>`, which would map to a banner
// landmark (US2-1).
//
// Inside the band the layout is the section header's (R-04 as amended, operator decision 5): an outer column with
// the eyebrow wrapper on a line of its own and a wrapping row of the heading column (heading and description) and the
// actions wrapper, so the actions' block start is the heading's and the eyebrow's words take no part in the
// side-by-side test. The heading column's basis is its min-content (its longest word), so the actions wrap under it,
// `--ocelle-space-2` below, only when that word and the actions do not fit side by side, and a word longer than the
// line then breaks inside itself. The heading-to-description gap is the heading column's flex `gap`, which an empty
// heading drops with its hidden wrapper (US2-8). The actions wrapper keeps the initial `flex: 0 1 auto`: on a line of
// its own and wider than it, it shrinks to the line and its actions wrap rather than overflow (FR-004). The heading
// column is hidden while the `heading` and `description` slots are both empty, so it takes no line and no gap when
// the actions wrap; the actions then keep the inline end by `margin-inline-start: auto` (FR-005, FR-010). The row is
// hidden when heading, description and actions are all empty, so an eyebrow alone takes no gap under it. Each slot's
// wrapper is `display: none` while empty (src/slot-state.ts, R-03). The UA block margins at the edges of the slotted
// eyebrow and description are trimmed by normal `::slotted()` rules, which a page rule beats (FR-008).
//
// `size` is reflected with no initial value (R-06); only `size="compact"` matches a rule, so an absent, empty or
// invalid value draws regular and is left as the page wrote it. Rules that set a colour sit inside
// `@media not (forced-colors: active)`; the size and layout rules stay outside, so they hold in forced colours, and the
// rule is a border, so it stays visible there (FR-001, FR-003). Importing this module defines `ocelle-page-header` and
// no other element.
import { LitElement, css, html, nothing } from "lit";
import { define } from "./define.ts";
import { SlotState } from "./slot-state.ts";

/** The class of a slot's wrapper: `empty` while the slot is to take no space, else none. */
function hidden(empty: boolean): string | typeof nothing {
  return empty ? "empty" : nothing;
}

/**
 * A screen's page header: a band around a heading the page slots, with an optional eyebrow above, a description under
 * the heading and actions at its inline end, ruled off below.
 *
 * @tagname ocelle-page-header
 * @slot heading - The page's own heading element (`h1` to `h6`, usually the screen's `h1`), drawn with the display style; its level is the page's.
 * @slot eyebrow - A short label above the heading naming the area, drawn with the eyebrow style.
 * @slot description - A subtitle under the heading.
 * @slot actions - The screen's controls at the inline end of the heading's first line, wrapping under the description when they do not fit beside the heading.
 */
export class OcellePageHeader extends LitElement {
  static override properties = {
    size: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      padding-block: var(--ocelle-space-4);
      padding-inline: var(--ocelle-space-6);
      border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule);
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

    ::slotted([slot="eyebrow"]),
    ::slotted([slot="description"]) {
      display: block;
    }

    ::slotted([slot="heading"]) {
      margin: 0;
      font-family: var(--ocelle-font-display);
      font-size: var(--ocelle-font-size-2xl);
      font-weight: var(--ocelle-font-weight-display);
      letter-spacing: var(--ocelle-tracking-display);
      line-height: var(--ocelle-line-height-tight);
    }

    :host([size="compact"]) ::slotted([slot="heading"]) {
      font-size: var(--ocelle-font-size-xl);
    }

    ::slotted([slot="eyebrow"]) {
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
      font-size: var(--ocelle-font-size-md);
    }

    @media not (forced-colors: active) {
      ::slotted([slot="heading"]) {
        color: var(--ocelle-color-ink);
      }

      ::slotted([slot="eyebrow"]) {
        color: var(--ocelle-color-eyebrow);
      }

      ::slotted([slot="description"]) {
        color: var(--ocelle-color-ink-soft);
      }
    }
  `;

  /**
   * The heading's size: `regular` or `compact`. Not set, or any other value, draws regular, the heading at
   * `--ocelle-font-size-2xl`; `compact` draws it at `--ocelle-font-size-xl`. Reflected.
   *
   * @default undefined
   */
  declare size: "regular" | "compact" | undefined;

  readonly #slots = new SlotState(this);

  protected override render(): unknown {
    const empty = (name: string): boolean => this.#slots.empty(name);
    // The heading column is hidden while it shows nothing, so actions that do not fit beside an empty column take no
    // second line. The row is hidden when it holds nothing, so an eyebrow alone takes no gap under it.
    const column = empty("heading") && empty("description");
    const row = column && empty("actions");
    return html`<div class="column">
      <div class=${hidden(empty("eyebrow"))}><slot name="eyebrow"></slot></div>
      <div class=${row ? "row empty" : "row"}>
        <div class=${column ? "heading-column empty" : "heading-column"}>
          <div class=${hidden(empty("heading"))}><slot name="heading"></slot></div>
          <div class=${hidden(empty("description"))}><slot name="description"></slot></div>
        </div>
        <div class=${empty("actions") ? "actions empty" : "actions"}><slot name="actions"></slot></div>
      </div>
    </div>`;
  }
}

define("ocelle-page-header", OcellePageHeader);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-page-header": OcellePageHeader;
  }
}
