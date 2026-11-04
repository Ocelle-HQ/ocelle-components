// WCAG 2.x contrast (002 FR-017, research.md R-07): the relative luminance of an sRGB colour written as a 6-digit
// hex, with the 0.04045 threshold of the sRGB transfer function, and the contrast ratio of two such colours.

const hex = /^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})$/;

/** One sRGB channel (0 to 255) as linear light. */
function linear(channel: string): number {
  const c = Number.parseInt(channel, 16) / 255;
  // Stryker disable next-line EqualityOperator: equivalent, no 8-bit channel is exactly 0.04045 (10/255 = 0.0392, 11/255 = 0.0431), so <= and < agree on every input
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** The relative luminance of a 6-digit hex colour (`#RRGGBB`); throws when the text is not one. */
export function relativeLuminance(colour: string): number {
  const match = hex.exec(colour);
  if (match === null) throw new Error(`not a 6-digit hex colour: ${colour}`);
  const [, red, green, blue] = match as unknown as [string, string, string, string];
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

/** The contrast ratio of two 6-digit hex colours, from 1 to 21, unrounded. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
