// `ocelle-personal-rail` (011 FR-001 to FR-006, FR-024 to FR-028; research.md R-01, R-03, R-10, R-11; data-model.md
// § Elements): the narrow dark column of personal navigation, primary items and a bottom group (an account link, say),
// on the chrome in both themes. The host itself is the navigation landmark: its internals carry the `navigation` role
// and, while the host has no `aria-label`, the name from `label`; a host `aria-label` wins natively and the element
// never writes it (R-11, FR-028). The internals are held under `internalsKey`, an own property keyed by a symbol
// described `internals`, where axe's role computation reads them; there is no inner `<nav>`.
//
// The page decides the orientation, and the element never changes it: `orientation` is reflected, and the rail has
// no viewport or container query of its own (FR-026). Not set, empty or any other value than `horizontal`, it is
// vertical. The template is the same in both orientations, so an orientation change keeps focus, document order and
// the landmark; only the `:host([orientation="horizontal"])` rules change the layout, and they sit outside the
// forced-colours query, so the row holds in forced colours (FR-001, US4-9).
//
// Vertical (R-10): the host is `--ocelle-shell-rail-width` wide, border-box, padded `--ocelle-space-2` in the block
// direction and `--ocelle-space-1` inline (a `--ocelle-target-min` content box), with `min-block-size: 100%` and
// `align-self: start`, so it fills a container of definite block size and grows with its content in a block, flex-row
// or grid container alike (operator decision at the phase-1 spike); a page rule on the host's `align-self` wins. One
// layout column (`flex: 1 0 auto`, `--ocelle-space-1` gaps) holds the primary group, the divider and the bottom group,
// which `margin-block-start: auto` keeps at the block end: the divider follows the primary group and the free space
// lies between it and the bottom group. Each group is a column of items centred across the rail, `--ocelle-space-1`
// apart. Horizontal: the host fills its container's inline size, padded `--ocelle-space-2`; the layout is a row, the
// primary group takes the rest of the inline size and wraps, the bottom group sits at the inline end of the first row,
// at most half the content box wide, and the divider runs over the layout's whole block size. The rail styles no
// item: the items take the chrome ink only when they inherit colour (FR-027). Each slot's wrapper is `display: none`
// while empty (src/slot-state.ts, R-03), and the divider is shown only when both groups are filled.
//
// The ground and the ink sit inside `@media not (forced-colors: active)`; the divider is a border, drawn in a system
// colour in forced colours (FR-001, FR-003). Importing this module defines `ocelle-personal-rail` and no other element.
import { LitElement, css, html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { define } from "./define.ts";
import { accessibleName, internalsKey } from "./naming.ts";
import { SlotState } from "./slot-state.ts";

/**
 * A personal rail: a navigation landmark holding the page's primary items and a bottom group, on the chrome.
 *
 * @tagname ocelle-personal-rail
 * @slot - The primary items, icon links for example, from the rail's start.
 * @slot bottom - The bottom group, an account link for example, kept at the rail's end.
 */
export class OcellePersonalRail extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
    orientation: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      inline-size: var(--ocelle-shell-rail-width);
      min-block-size: 100%;
      align-self: start;
      padding-block: var(--ocelle-space-2);
      padding-inline: var(--ocelle-space-1);
    }

    :host([hidden]) {
      display: none;
    }

    .layout {
      display: flex;
      flex: 1 0 auto;
      flex-direction: column;
      gap: var(--ocelle-space-1);
    }

    .group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--ocelle-space-1);
    }

    .bottom {
      margin-block-start: auto;
    }

    .divider {
      border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-chrome-muted);
    }

    /* Opt-in placement for shells that separate Settings from primary navigation. */
    :host([divider-at-end]:not([orientation="horizontal"])) .divider:not(.empty) {
      margin-block-start: auto;
    }

    :host([divider-at-end]:not([orientation="horizontal"])) .divider:not(.empty) + .bottom {
      margin-block-start: 0;
    }

    .empty {
      display: none;
    }

    :host([orientation="horizontal"]) {
      inline-size: 100%;
      min-block-size: auto;
      padding: var(--ocelle-space-2);
    }

    :host([orientation="horizontal"]) .layout {
      flex-direction: row;
    }

    :host([orientation="horizontal"]) .group {
      flex-direction: row;
      flex-wrap: wrap;
      align-self: flex-start;
    }

    :host([orientation="horizontal"]) .primary {
      flex: 1 1 0;
    }

    :host([orientation="horizontal"]) .bottom {
      justify-content: flex-end;
      max-inline-size: 50%;
      margin-block-start: 0;
      margin-inline-start: auto;
    }

    :host([orientation="horizontal"]) .divider {
      border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-chrome-muted);
    }

    @media not (forced-colors: active) {
      :host {
        background-color: var(--ocelle-color-chrome);
        color: var(--ocelle-color-chrome-ink);
      }
    }
  `;

  /**
   * The name of the navigation landmark, trimmed, used while the host has no `aria-label`; empty or whitespace-only
   * counts as none, and the landmark is then unnamed. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * The layout direction, set by the page or a shell: `vertical` (a column) or `horizontal` (a row that wraps). Not
   * set, or any other value, is vertical; the element never changes it itself. Reflected.
   *
   * @default undefined
   */
  declare orientation: "vertical" | "horizontal" | undefined;

  /**
   * The element's internals, which carry its `navigation` role and its name, under a symbol axe's role computation
   * reads.
   *
   * @internal
   */
  readonly [internalsKey] = this.attachInternals();

  readonly #slots = new SlotState(this);

  /**
   * The landmark in the internals: the `navigation` role, and as its name the trimmed `label`, or none; a host
   * `aria-label` wins over that name natively. Set on update rather than in the constructor, where the manifest
   * analyzer would list the role as a field.
   */
  protected override updated(): void {
    const internals = this[internalsKey];
    internals.role = "navigation";
    internals.ariaLabel = accessibleName(this.label, null) ?? null;
  }

  protected override render(): unknown {
    const primary = !this.#slots.empty("");
    const bottom = !this.#slots.empty("bottom");
    return html`<div class="layout">
      <div class=${classMap({ group: true, primary: true, empty: !primary })}><slot></slot></div>
      <div class=${classMap({ divider: true, empty: !(primary && bottom) })} aria-hidden="true"></div>
      <div class=${classMap({ group: true, bottom: true, empty: !bottom })}><slot name="bottom"></slot></div>
    </div>`;
  }
}

define("ocelle-personal-rail", OcellePersonalRail);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-personal-rail": OcellePersonalRail;
  }
}
