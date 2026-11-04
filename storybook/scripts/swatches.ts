// The pre-build step of the Storybook (FR-023, research.md R-10): writes the token stylesheet (css() of the token
// source), the swatch stylesheet and a copy of the fonts directory into storybook/.generated/, the Storybook static
// directory, so the preview links the current source as same-origin stylesheets and needs no build of
// @ocelle/tokens. The swatch stylesheet colours each opaque colour token's swatch by class and data attribute;
// `color-scheme` (a keyword) and `color-overlay` (translucent) get no rule. The fonts are skipped without error while
// packages/tokens/fonts/ does not exist (before phase 4; analysis U1).
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { css } from "../../packages/tokens/src/generate.ts";
import type { TokenRecord } from "../../packages/tokens/src/generate.ts";
import { source } from "../../packages/tokens/src/source.ts";
import { hasSwatch } from "../stories/render.ts";

/** The swatch stylesheet: one rule per opaque colour token, in source order. */
export function swatchRules(tokens: readonly TokenRecord[]): string {
  return tokens
    .filter((record) => hasSwatch(tokens, record))
    .map((record) => `.ocelle-swatch[data-token="${record.name}"] { background: var(--ocelle-${record.name}) }\n`)
    .join("");
}

/** Writes tokens.css, swatches.css and a copy of the fonts directory (when it exists) into a fresh `out`. */
export function writeGenerated(out: string, fonts: string, tokens: readonly TokenRecord[]): void {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "tokens.css"), css(tokens));
  writeFileSync(join(out, "swatches.css"), swatchRules(tokens));
  if (existsSync(fonts)) cpSync(fonts, join(out, "fonts"), { recursive: true });
}

// Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts runs it before the build that csp.test.ts serves
if (import.meta.main) {
  // Stryker disable next-line all: process boundary, covered by storybook-integration: storybook/test/integration/setup.ts runs it before the build that csp.test.ts serves
  writeGenerated(fileURLToPath(new URL("../.generated", import.meta.url)), fileURLToPath(new URL("../../packages/tokens/fonts", import.meta.url)), source);
}
