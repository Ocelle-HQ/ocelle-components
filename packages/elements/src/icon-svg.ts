// The icon drawing (005 research.md R-04, R-07, R-08; data-model.md § Icon; specs/010-feedback-forms research.md R-07,
// analysis I4): one icon of the set as an inline `svg` on the 24-unit grid, hidden from the accessibility tree, not
// focusable, its stroke style set once in `currentColor` and inherited by every shape; the four inline-direction icons
// carry the class `mirror`, which the element drawing them flips under right-to-left text. `ocelle-icon` draws its icon
// with it, and `ocelle-form-select` its open-list indicator, so the select imports no other element module. The icon
// data stays in src/icons.ts. Internal, not an entry point.
import { html, nothing, svg } from "lit";
import type { SVGTemplateResult, TemplateResult } from "lit";
import type { Icon, Shape } from "./icons.ts";

/** One shape as SVG; the stroke style is the `svg`'s, inherited. */
function shape(part: Shape): SVGTemplateResult {
  switch (part.kind) {
    case "line":
      return svg`<line x1=${part.x1} y1=${part.y1} x2=${part.x2} y2=${part.y2}></line>`;
    case "polyline":
      return svg`<polyline points=${part.points}></polyline>`;
    case "path":
      return svg`<path d=${part.d}></path>`;
    case "rect":
      return svg`<rect x=${part.x} y=${part.y} width=${part.width} height=${part.height} rx=${part.rx}></rect>`;
    case "circle":
      return svg`<circle cx=${part.cx} cy=${part.cy} r=${part.r}></circle>`;
  }
}

/** The `svg` of `icon`: decorative, in `currentColor`, its shapes in order, the class `mirror` when it mirrors. */
export function iconSvg(icon: Icon): TemplateResult {
  return html`<svg
    class=${icon.mirror ? "mirror" : nothing}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >${icon.shapes.map(shape)}</svg>`;
}
