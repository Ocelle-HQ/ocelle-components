// The Ocelle rosette, the drawing of `ocelle-brand-mark` (005 FR-024, FR-010; research.md R-09; data-model.md
// § Drawing): the rosette group of the reference (specs/005-icons-brand-mark/sources/ocelle-docs-logo.reference.svg,
// the group inside the app icon's rounded square) redrawn in the group's own coordinates, with no transform. Four open
// arcs of unequal weight with round caps, the ring (class `ring`), around an elliptical spot rotated -18 degrees (class
// `spot`). The `viewBox` is the rosette's painted extent (7.5 to 93.9 about the ring's centre (50, 50), round caps
// included) with a margin, so the mark paints about 94 % of its box. No colour, `id`, `style` or reference to another
// resource: the element's stylesheet paints the two classes from tokens. Internal, not an entry point.
import { html } from "lit";
import type { TemplateResult } from "lit";

/** The rosette as one inline `svg`, hidden from the accessibility tree (the host carries the name, if any). */
export const rosette: TemplateResult = html`<svg viewBox="4 4 92 92" aria-hidden="true" focusable="false">
  <path class="ring" d="M84.77 40.68 A36 36 0 0 1 70.65 79.49" fill="none" stroke-width="15" stroke-linecap="round"></path>
  <path class="ring" d="M46.69 87.86 A38 38 0 0 1 17.09 69.0" fill="none" stroke-width="12" stroke-linecap="round"></path>
  <path class="ring" d="M15.53 43.92 A35 35 0 0 1 32.5 19.69" fill="none" stroke-width="16" stroke-linecap="round"></path>
  <path class="ring" d="M53.23 13.14 A37 37 0 0 1 77.49 25.24" fill="none" stroke-width="11" stroke-linecap="round"></path>
  <ellipse class="spot" cx="51.5" cy="50.5" rx="11.5" ry="10" transform="rotate(-18 51.5 50.5)"></ellipse>
</svg>`;
