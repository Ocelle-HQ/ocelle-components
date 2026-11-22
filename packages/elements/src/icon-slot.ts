// The slot convention for icons in controls (005 FR-020 to FR-023; research.md R-10; data-model.md § Slot convention):
// `iconSlotStyles`, the internal stylesheet a control that shows icons adds to its `static styles`. The control renders,
// in a row with the class `icon-row` that sets the type, `<span class="icon-slot"><slot name="icon"></slot></span>`,
// then its label wrapper `<span class="label"><slot></slot></span>` around the default slot and, for an end icon,
// `<span class="icon-slot trailing"><slot name="trailing"></slot></span>` after it. A control with no label (an
// icon-only control) puts the modifier class `bare` on its row.
// - The row is an `inline-flex` row aligned to the start, so the wrappers and the label start on the same line box.
//   Its block padding is half the amount by which the icon is taller than one line box (a negative `calc()` padding is
//   clamped to 0), so an icon that overflows its wrapper stays inside the control's box (PLAN-FRESH-2-002 (a)).
// - In a labelled row the label wrapper takes part in baseline alignment (`align-self: baseline`). The row is aligned
//   to the start, so without it no item takes part in baseline alignment and the row's baseline would be its first
//   item's, the icon wrapper's, which put a one-line control 4.6 to 6.2 px above the baseline of the text around it.
//   With it the row's baseline, and the host's, is the label's first line, and no position inside the row moves: the
//   label is the only baseline-aligned item, so it stays at the row's start. A `bare` row is skipped: its label is
//   empty and zero-height, so the rule would give the row a baseline at the label's top and hang the control below the
//   line; a `bare` row keeps the icon wrapper's baseline, and its icon sits where a native `<button>` with an svg puts
//   it (012 plan decision 33, reviews/phase-2/round-5.md O3-01, reviews/phase-2/round-6.md O6-01).
// - Each wrapper is exactly one line box tall (`1lh`) with the icon centred in it, so the icon is centred on the
//   label's first line at any type size and leading, wrapped or not (PLAN-CORRECTNESS-1-004 (a)). The convention
//   adds no generated content, but a slotted icon can still add to a name computed from the control's content (a bare
//   `<svg>`'s `<title>`), so a control keeps its icon out of its name itself, as `ocelle-button` does: its icon wrapper
//   is `aria-hidden="true"` and, with an icon slotted, its inner control is named from its label wrapper (op 022, #57).
// - An element slotted into the `icon` or `trailing` slot is `--ocelle-icon-size` square, never shrinks and takes the
//   control's colour; the size rules are scoped to those two slots, so an element in a control's other slots (its
//   label, a row's description or tags) keeps its own box (012 research.md R-10, PLAN-A11Y-SECURITY-1-002).
// - A wrapper with the `hidden` attribute takes no space: `.icon-slot` is an author `display` rule that beats the
//   user-agent `[hidden]` rule, so the convention restores it (012 research.md R-07, PLAN-CORRECTNESS-1-013).
// - The size rules are `!important`: an inner context's important declarations beat the page's, so neither
//   `base.css`, a normal page rule nor `width`/`height` attributes change the box (FR-022). `--ocelle-icon-size:
//   inherit !important` pins the token on the slotted element to the control's value, the one the row's padding reads
//   (PLAN-FRESH-3-001).
// - The gap to the label is a margin on the slotted element, so an empty slot has no margin and a zero-width wrapper.
//   Logical properties put the icon slot on the label's right and the trailing slot on its left under `dir="rtl"`.
import { css } from "lit";

/** The slot convention's styles, for a control's `static styles` (research.md R-10). */
export const iconSlotStyles = css`
  .icon-row {
    display: inline-flex;
    align-items: flex-start;
    padding-block: calc((var(--ocelle-icon-size) - 1lh) / 2);
  }

  .icon-row:not(.bare) > .label {
    align-self: baseline;
  }

  .icon-slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    block-size: 1lh;
  }

  .icon-slot[hidden] {
    display: none;
  }

  slot[name="icon"]::slotted(*),
  slot[name="trailing"]::slotted(*) {
    --ocelle-icon-size: inherit !important;
    inline-size: var(--ocelle-icon-size) !important;
    block-size: var(--ocelle-icon-size) !important;
    max-inline-size: none !important;
    flex: none !important;
    color: inherit;
  }

  slot[name="icon"]::slotted(*) {
    margin-inline-end: var(--ocelle-space-2) !important;
  }

  slot[name="trailing"]::slotted(*) {
    margin-inline-start: var(--ocelle-space-2) !important;
  }
`;
