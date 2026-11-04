// The pre-build step of the Storybook (FR-023, research.md R-10): writes the token stylesheet, the swatch stylesheet
// and the fonts into storybook/.generated/, the Storybook static directory. Scaffold: no behaviour yet.
/* eslint-disable @typescript-eslint/no-unused-vars -- scaffold: signatures only, the green commit implements them */
import type { TokenRecord } from "../../packages/tokens/src/generate.ts";

/** The swatch stylesheet: one rule per opaque colour token. */
export function swatchRules(source: readonly TokenRecord[]): string {
  return "";
}

/** Writes tokens.css, swatches.css and a copy of the fonts directory (when it exists) into `out`. */
export function writeGenerated(out: string, fonts: string, source: readonly TokenRecord[]): void {
  throw new Error("not implemented");
}
