// The expected icon drawings, written by hand (005 research.md R-07, data-model.md § Icon; PLAN-TESTABILITY-1-005):
// never read from src/icons.ts. Each rendered `ocelle-icon` holds one `svg` with the shared attributes below and,
// as its children in order, the shapes of its entry. Phase 2 needs `close` (US1 scenarios 1 to 8, 10, 14, 15, 18,
// 19) and `menu` (US1 scenarios 9 and 16, which change `close` to `menu`); phase 3 (T032) adds the other eleven.
import type { Part } from "./scenarios/driver.ts";

/** One expected icon: whether it mirrors in right-to-left text, and its shapes. */
export interface ExpectedIcon {
  readonly mirror: boolean;
  readonly shapes: readonly Part[];
}

/**
 * The attributes of every icon's `svg` (R-04, data-model.md § Icon): the 24-unit grid, hidden from the accessibility
 * tree, not focusable, and the stroke style set once and inherited by every shape.
 */
export const svgAttributes: Readonly<Record<string, string>> = {
  viewBox: "0 0 24 24",
  "aria-hidden": "true",
  focusable: "false",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

function line(x1: number, y1: number, x2: number, y2: number): Part {
  return { name: "line", attributes: { x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2) } };
}

export const expectedIcons: Readonly<Record<string, ExpectedIcon>> = {
  // Two diagonals of the 12-unit square centred on the grid.
  close: { mirror: false, shapes: [line(6, 6, 18, 18), line(18, 6, 6, 18)] },
  // Three bars across the grid's 16-unit middle, 6 units apart.
  menu: { mirror: false, shapes: [line(4, 6, 20, 6), line(4, 12, 20, 12), line(4, 18, 20, 18)] },
};

/** The drawing an `ocelle-icon` of `name` holds in its shadow root: one `svg` with the icon's shapes. */
export function expectedDrawing(name: string): { readonly children: readonly string[]; readonly svg: { readonly attributes: Readonly<Record<string, string>>; readonly parts: readonly Part[] } } {
  const icon = expectedIcons[name];
  if (icon === undefined) throw new Error(`no expected drawing for ${name}`);
  return { children: ["svg"], svg: { attributes: svgAttributes, parts: icon.shapes } };
}

/** The shadow root of an `ocelle-icon` that draws nothing (an unknown, empty or missing name). */
export const emptyDrawing = { children: [], svg: null } as const;
