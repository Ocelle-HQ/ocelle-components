// The slot convention for icons in controls (005 FR-020 to FR-023; research.md R-10; data-model.md § Slot convention):
// `iconSlotStyles`, the internal stylesheet a control that shows icons adds to its `static styles`. The control renders,
// in a row with the class `icon-row` that sets the type, `<span class="icon-slot"><slot name="icon"></slot></span>`
// before its label and, for an end icon, `<span class="icon-slot trailing"><slot name="trailing"></slot></span>`
// after it.
// - The row is an `inline-flex` row aligned to the start, so the wrappers and the label start on the same line box.
//   Its block padding is half the amount by which the icon is taller than one line box (a negative `calc()` padding is
//   clamped to 0), so an icon that overflows its wrapper stays inside the control's box (PLAN-FRESH-2-002 (a)).
// - Each wrapper is exactly one line box tall (`1lh`) with the icon centred in it, so the icon is centred on the
//   label's first line at any type size and leading, wrapped or not (PLAN-CORRECTNESS-1-004 (a)). No generated
//   content, so the control's name is its label's.
// - A slotted element is `--ocelle-icon-size` square, never shrinks and takes the control's colour. The size rules are
//   `!important`: an inner context's important declarations beat the page's, so neither `base.css`, a normal page
//   rule nor `width`/`height` attributes change the box (FR-022). `--ocelle-icon-size: inherit !important` pins the
//   token on the slotted element to the control's value, the one the row's padding reads (PLAN-FRESH-3-001).
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

  .icon-slot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    block-size: 1lh;
  }

  ::slotted(*) {
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
