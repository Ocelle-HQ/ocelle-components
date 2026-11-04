// WCAG 2.x contrast (002 FR-017, research.md R-07): the relative luminance of an sRGB colour written as a 6-digit
// hex, with the 0.04045 threshold of the sRGB transfer function, and the contrast ratio of two such colours.

/** The relative luminance of a 6-digit hex colour (`#RRGGBB`); throws when the text is not one. */
export function relativeLuminance(hex: string): number {
  throw new Error(`not implemented: relativeLuminance(${hex})`);
}

/** The contrast ratio of two 6-digit hex colours, from 1 to 21, unrounded. */
export function contrastRatio(foreground: string, background: string): number {
  throw new Error(`not implemented: contrastRatio(${foreground}, ${background})`);
}
