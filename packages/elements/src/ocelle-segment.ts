// `ocelle-segment` (014 FR-009, FR-026, FR-029, FR-030, Edge Cases; research.md R-01, R-03, R-06, R-10, R-15;
// data-model.md § Child entry): one segment of an `ocelle-segmented-choice`, in the page's own tree beside its
// siblings. Inside a segmented choice its role is `button` (internals, kept under the internals symbol axe reads), a
// toggle button by the `aria-pressed` the parent writes; outside one it has none and renders its content as plain
// content. `aria-pressed`, `aria-disabled` and `tabindex` are written on the host by the parent; the paint keys on
// them, so the paint and the exposed state cannot disagree. `value` is reflected as written; with no value or a blank
// one the segment's value is its index among its parent's segments (FR-009), which is not written to the attribute.
//
// The joined variant's rows (R-06, plan decision 1 answered yes): the parent sets the segment's custom states through
// an internal method under a module-private symbol (`rowStates`, src/internals.ts), feature-checked by the parent:
// `joined` while the parent is joined, `row-start` on the first segment of a row and `row-end` on the last. The states
// change only corner radii, the pressed paint and nothing of the layout, so a regroup never moves a row break.
//
// Styles: the minimum block size is the target size; the label wraps inside the segment, which grows.
// - Default variant: a border of `--ocelle-border-width` in `--ocelle-color-control-border` with the radius
//   `--ocelle-radius-2`; pressed, the fill `--ocelle-color-accent-low` and a border of `--ocelle-bar-width` in
//   `--ocelle-color-accent-strong`, its padding reduced by the difference, so the outer box is unchanged.
// - Joined: the same 1 px border on every segment with negative block-start and inline-start margins of one border
//   width, so neighbours' lines overlap into one line, between rows too; the corners square except at the row ends;
//   pressed, the fill `accent-low`, `accent-strong` lines and a bar of `--ocelle-bar-width` along the block-end edge
//   inside the box (a `::before` whose block-end border is the bar: a pseudo-element with a background would count for
//   axe-core 4.14.0 as covering a short label, reviews/phase-3/notes.md).
// - Hover (enabled only): the fill `--ocelle-color-hover-bg` and `accent-strong` lines. A pressed or hovered segment is
//   raised (`z-index: 1`) so its `accent-strong` lines lie over its neighbours' `control-border` lines; the focus ring
//   is a raised `::after` (`z-index: 2`, the focused host not raised), so no neighbour covers it and the focused host's
//   own line never covers a neighbour's; a focused pressed or hovered segment is raised to `z-index: 2` (R-06).
// - Forced colours: every line `ButtonBorder`, the default pressed border and the joined bar `Highlight`, the ring
//   `Highlight`. The `icon` slot follows the slot convention. No transition or animation.
// Importing this module defines `ocelle-segment` and no other element.
import { LitElement, css, html } from "lit";
import { define } from "./define.ts";
import { iconSlotStyles } from "./icon-slot.ts";
import { attachInternalsTo, rowStates } from "./internals.ts";
import { childValue } from "./selection.ts";

/**
 * A segment of an `ocelle-segmented-choice`: its content is its label, with an optional leading icon.
 *
 * @tagname ocelle-segment
 * @slot - The segment's label.
 * @slot icon - A leading icon, by the slot convention; it adds nothing to the segment's name.
 */
export class OcelleSegment extends LitElement {
  static override properties = {
    disabled: { type: Boolean, reflect: true },
    // `value` is the accessor below, which writes the attribute itself (as on `ocelle-option`): `useDefault` keeps Lit
    // from reflecting the index default at the first update (FR-009). `reflect` and `noAccessor` describe the accessor
    // for the manifest.
    // Stryker disable next-line BooleanLiteral,ObjectLiteral: equivalent, the accessor's setter writes the attribute and the attribute's changes are not passed to Lit; without `reflect` Lit writes no initial value either
    value: { type: String, reflect: true, noAccessor: true, useDefault: true },
  };

  static override styles = [
    iconSlotStyles,
    css`
      :host {
        display: flex;
        position: relative;
        flex: 0 1 auto;
        align-items: center;
        box-sizing: border-box;
        min-inline-size: 0;
        min-block-size: var(--ocelle-target-min);
        padding-block: var(--ocelle-space-2);
        padding-inline: var(--ocelle-space-3);
        border: var(--ocelle-border-width) solid;
        border-radius: var(--ocelle-radius-2);
        color: var(--ocelle-color-ink);
        overflow-wrap: anywhere;
        cursor: default;
        outline: none;
      }

      :host([hidden]) {
        display: none;
      }

      .icon-row {
        min-inline-size: 0;
      }

      .label {
        min-inline-size: 0;
      }

      slot:not([name])::slotted(*) {
        inline-size: auto !important;
        block-size: auto !important;
        flex: initial !important;
      }

      :host([aria-pressed="true"]:not(:state(joined))) {
        border-width: var(--ocelle-bar-width);
        padding-block: calc(var(--ocelle-space-2) - var(--ocelle-bar-width) + var(--ocelle-border-width));
        padding-inline: calc(var(--ocelle-space-3) - var(--ocelle-bar-width) + var(--ocelle-border-width));
      }

      :host(:state(joined)) {
        margin-block-start: calc(-1 * var(--ocelle-border-width));
        margin-inline-start: calc(-1 * var(--ocelle-border-width));
        border-radius: 0;
      }

      :host(:state(joined):state(row-start)) {
        border-start-start-radius: var(--ocelle-radius-2);
        border-end-start-radius: var(--ocelle-radius-2);
      }

      :host(:state(joined):state(row-end)) {
        border-start-end-radius: var(--ocelle-radius-2);
        border-end-end-radius: var(--ocelle-radius-2);
      }

      :host(:state(joined)[aria-pressed="true"])::before {
        content: "";
        position: absolute;
        inset-inline: 0;
        inset-block-end: 0;
        border-block-end: var(--ocelle-bar-width) solid;
        pointer-events: none;
      }

      :host([aria-pressed="true"]),
      :host(:hover:not([aria-disabled="true"])) {
        z-index: 1;
      }

      :host(:focus-visible)::after {
        content: "";
        position: absolute;
        inset: calc(-1 * (var(--ocelle-focus-width) + var(--ocelle-focus-offset) + var(--ocelle-border-width)));
        border: var(--ocelle-focus-width) solid;
        pointer-events: none;
        z-index: 2;
      }

      :host([aria-pressed="true"]:not(:state(joined)):focus-visible)::after {
        inset: calc(-1 * (var(--ocelle-focus-width) + var(--ocelle-focus-offset) + var(--ocelle-bar-width)));
      }

      :host([aria-pressed="true"]:focus-visible),
      :host(:hover:not([aria-disabled="true"]):focus-visible) {
        z-index: 2;
      }

      @media not (forced-colors: active) {
        :host {
          border-color: var(--ocelle-color-control-border);
        }

        :host([aria-pressed="true"]) {
          background: var(--ocelle-color-accent-low);
          border-color: var(--ocelle-color-accent-strong);
        }

        :host(:hover:not([aria-disabled="true"])) {
          background: var(--ocelle-color-hover-bg);
          border-color: var(--ocelle-color-accent-strong);
        }

        :host([aria-disabled="true"]) {
          color: var(--ocelle-color-disabled-ink);
        }

        :host(:state(joined)[aria-pressed="true"])::before {
          border-block-end-color: var(--ocelle-color-accent-strong);
        }

        :host(:focus-visible)::after {
          border-color: var(--ocelle-color-focus);
        }
      }

      @media (forced-colors: active) {
        :host {
          border-color: ButtonBorder;
        }

        :host([aria-pressed="true"]:not(:state(joined))) {
          forced-color-adjust: none;
          border-color: Highlight;
          color: ButtonText;
          background: ButtonFace;
        }

        :host(:state(joined)[aria-pressed="true"])::before {
          forced-color-adjust: none;
          border-block-end-color: Highlight;
        }

        :host(:focus-visible)::after {
          forced-color-adjust: none;
          border-color: Highlight;
        }
      }
    `,
  ];

  /**
   * Whether the segment is disabled: it cannot be pressed, the keys and the tab stop skip it, and it stays focusable,
   * so a focused segment that becomes disabled keeps focus until the press moves. Reflected.
   *
   * @default false
   */
  declare disabled: boolean;

  readonly #internals = attachInternalsTo(this);

  constructor() {
    super();
    this.disabled = false;
  }

  /**
   * The segment's value, reported by the segmented choice's `value` and events: the `value` attribute as written (not
   * trimmed), or, when it is missing or blank, the segment's index among its parent's segments, as a string, which is
   * not written to the attribute. Reflected.
   *
   * @default the segment's index, as a string
   */
  get value(): string {
    const siblings = [...(this.parentElement?.children ?? [])].filter((child) => child.localName === this.localName);
    return childValue(this.getAttribute("value"), siblings.indexOf(this));
  }

  set value(value: string) {
    this.setAttribute("value", value);
  }

  /** The `value` attribute is the segment's input, read by `value` and by the parent's observer; it renders nothing. */
  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    if (name !== "value") super.attributeChangedCallback(name, old, value);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#internals.role = this.parentElement?.localName === "ocelle-segmented-choice" ? "button" : null;
  }

  /**
   * Sets the joined variant's custom states (called by the parent; R-06). Not surface.
   *
   * @internal
   */
  [rowStates](joined: boolean, start: boolean, end: boolean): void {
    const { states } = this.#internals;
    for (const [state, on] of [
      ["joined", joined],
      ["row-start", joined && start],
      ["row-end", joined && end],
    ] as const) {
      if (on) states.add(state);
      else states.delete(state);
    }
  }

  protected override render(): unknown {
    return html`<span class="icon-row"><span class="icon-slot"><slot name="icon"></slot></span><span class="label"><slot></slot></span></span>`;
  }
}

define("ocelle-segment", OcelleSegment);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-segment": OcelleSegment;
  }
}
