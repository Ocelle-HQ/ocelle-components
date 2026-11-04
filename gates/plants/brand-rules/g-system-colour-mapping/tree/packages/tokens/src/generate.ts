// A wrapper of the real generator (002 contracts/gates.md § Plant deltas, generator "wrapped"): the real css() with one change.
import { css as realCss } from "./generate.real.ts";
import type { TokenRecord } from "./generate.real.ts";
export * from "./generate.real.ts";

export function css(source: readonly TokenRecord[]): string {
  return `${realCss(source)}\n@media (forced-colors: active) {\n  :root {\n    --ocelle-color-ink: CanvasText;\n    --ocelle-color-canvas: Canvas;\n    --ocelle-color-link: LinkText;\n    --ocelle-color-control-border: ButtonBorder;\n  }\n}\n`;
}
