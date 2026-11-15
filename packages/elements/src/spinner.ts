// The busy spinner of the controls (012 spec FR-016, FR-017; research.md R-07, R-12; plan decision 11), internal: an
// inline SVG arc in a wrapper `span.icon-slot.spinner` that a control places where its `icon` slot's wrapper is, and
// shows (by removing its `hidden` attribute) while it hides that wrapper, so the spinner takes the icon's box.
// - The arc is a partial circle (`stroke-dasharray` in the drawing's own units, presentation attributes, no `style`
//   attribute), stroked in `currentColor`, so it is the control's text colour and, in forced colours, its system
//   colour; it is still a busy mark when it does not move. The drawing is `aria-hidden`, so it adds nothing to the
//   accessibility tree.
// - It is `--ocelle-icon-size` square with the slot convention's gap (`--ocelle-space-2`) after it, as a slotted icon
//   is, so with an icon the control keeps its size and without one the spinner sits before the label.
// - It turns six times, once, linear: `rotate` to `--ocelle-motion-turn` times six over `--ocelle-motion-spin` times six
//   (4.8 s by default), with no fill mode, so it ends on its start pose, the still arc (the 5 s limit of WCAG 2.2.2).
//   Under `prefers-reduced-motion: reduce` it has no animation (and `--ocelle-motion-spin` is `0ms` there).
import { css, html } from "lit";
import type { TemplateResult } from "lit";

/** The spinner's wrapper and drawing, hidden unless `shown`. */
export function spinner(shown: boolean): TemplateResult {
  return html`<span class="icon-slot spinner" ?hidden=${!shown}><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="36 14"></circle></svg></span>`;
}

/** The spinner's styles, for a control's `static styles` beside `iconSlotStyles`. */
export const spinnerStyles = css`
  .spinner svg {
    flex: none;
    inline-size: var(--ocelle-icon-size);
    block-size: var(--ocelle-icon-size);
    margin-inline-end: var(--ocelle-space-2);
    animation-name: ocelle-spin;
    animation-duration: calc(var(--ocelle-motion-spin) * 6);
    animation-timing-function: linear;
  }

  @keyframes ocelle-spin {
    to {
      rotate: calc(var(--ocelle-motion-turn) * 6);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .spinner svg {
      animation: none;
    }
  }
`;
