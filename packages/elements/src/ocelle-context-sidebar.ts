// `ocelle-context-sidebar` (011 FR-001 to FR-008, FR-020 to FR-023, FR-028; research.md R-01 to R-03, R-09, R-11;
// data-model.md § Elements): the column beside a screen's content, a head, sections of navigation and a footer on the
// `--ocelle-color-rail` ground, ruled off from each other. The host itself is the navigation landmark: its internals
// carry the `navigation` role and, while the host has no `aria-label`, the name from `label`; a host `aria-label` wins
// natively and the element never writes it (R-11, FR-028). The internals are held under `internalsKey`, an own
// property keyed by a symbol described `internals`, where axe's role computation reads them; there is no inner `<nav>`.
//
// The host is a flex column with `min-block-size: 100%` and `align-self: start` (R-09, operator decision at the
// phase-1 spike): it fills a container of definite block size when its content is shorter, and grows with its content
// when taller, in a block, flex-row or grid container alike; a page rule on the host's `align-self` wins. Inside it,
// one layout column (`flex: 1 0 auto`) holds three wrappers: the head, the sections (the default slot) and the footer,
// which `margin-block-start: auto` keeps at the block end. The head and footer are padded `--ocelle-space-4`; the
// sections wrapper has inline padding only, so text in the default slot gets the inline inset and no block padding.
// Each section (an element in the default slot that is not `hidden`) is a block padded `--ocelle-space-4`, with
// negative inline margins that make its `border-block-start` span the sidebar, and every section but the first visible
// one carries that divider. Those four declarations are `!important`, so a page reset does not remove them; the
// section's block margins are a normal `margin-block: 0`, which a page rule beats (FR-008, FR-022). The dividers
// between parts follow the content (FR-022, FR-023): the sections wrapper's block-start border when the head is
// filled, its block-end border when the footer is filled, and the head's block-end border when the default slot is
// empty and both head and footer are filled, so the free space lies between the last divider and the footer. Each
// slot's wrapper is `display: none` while empty (src/slot-state.ts, R-03). The first and last visible elements of the
// head and of the footer have their outer block margins trimmed by normal `::slotted()` rules (FR-008).
//
// The ground sits inside `@media not (forced-colors: active)`; the dividers are borders, drawn in a system colour in
// forced colours (FR-001, FR-003). Importing this module defines `ocelle-context-sidebar` and no other element.
import { LitElement, css, html } from "lit";
import { classMap } from "lit/directives/class-map.js";
import { define } from "./define.ts";
import { accessibleName, internalsKey } from "./naming.ts";
import { SlotState } from "./slot-state.ts";

/**
 * A context sidebar: a navigation landmark holding a head, sections and a footer, ruled off from each other.
 *
 * @tagname ocelle-context-sidebar
 * @slot head - The sidebar's head, the team or project it belongs to.
 * @slot - The sections, one element each (a `ul` of links, a `div`, an `ocelle-section-header`), drawn as padded blocks with a divider between each two.
 * @slot footer - The sidebar's footer, kept at its block end.
 */
export class OcelleContextSidebar extends LitElement {
  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      min-block-size: 100%;
      align-self: start;
    }

    :host([hidden]) {
      display: none;
    }

    .layout {
      display: flex;
      flex: 1 0 auto;
      flex-direction: column;
    }

    .head,
    .footer {
      padding: var(--ocelle-space-4);
    }

    .footer {
      margin-block-start: auto;
    }

    .sections {
      padding-inline: var(--ocelle-space-4);
    }

    .head.divided {
      border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule);
    }

    .sections.after-head {
      border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule);
    }

    .sections.before-footer {
      border-block-end: var(--ocelle-border-width) solid var(--ocelle-color-rule);
    }

    .empty {
      display: none;
    }

    ::slotted(:not([slot]):not([hidden])) {
      display: block !important;
      padding: var(--ocelle-space-4) !important;
      margin-block: 0;
      margin-inline: calc(-1 * var(--ocelle-space-4)) !important;
      border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule) !important;
    }

    ::slotted(:nth-child(1 of :not([slot]):not([hidden]))) {
      border-block-start: none !important;
    }

    ::slotted(:nth-child(1 of [slot="head"]:not([hidden]))),
    ::slotted(:nth-child(1 of [slot="footer"]:not([hidden]))) {
      margin-block-start: 0;
    }

    ::slotted(:nth-last-child(1 of [slot="head"]:not([hidden]))),
    ::slotted(:nth-last-child(1 of [slot="footer"]:not([hidden]))) {
      margin-block-end: 0;
    }

    @media not (forced-colors: active) {
      :host {
        background-color: var(--ocelle-color-rail);
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
    const head = !this.#slots.empty("head");
    const sections = !this.#slots.empty("");
    const footer = !this.#slots.empty("footer");
    // A divider lies between two adjacent filled parts: the sections wrapper carries the one after the head and the one
    // before the footer; with no sections, the head carries the one before the footer.
    return html`<div class="layout">
      <div class=${classMap({ head: true, empty: !head, divided: !sections && footer })}><slot name="head"></slot></div>
      <div class=${classMap({ sections: true, empty: !sections, "after-head": head, "before-footer": footer })}><slot></slot></div>
      <div class=${classMap({ footer: true, empty: !footer })}><slot name="footer"></slot></div>
    </div>`;
  }
}

define("ocelle-context-sidebar", OcelleContextSidebar);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-context-sidebar": OcelleContextSidebar;
  }
}
