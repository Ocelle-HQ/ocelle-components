// The expected icon drawings, written by hand (005 research.md R-07, data-model.md § Icon; PLAN-TESTABILITY-1-005):
// never read from src/icons.ts. Each rendered `ocelle-icon` holds one `svg` with the shared attributes below and,
// as its children in order, the shapes of its entry. The thirteen names of the set (spec US2 scenario 1, FR-017) in
// the spec's order; the drawings are the ones measured in reviews/phase-3/spike.md: geometry within 2 to 22 on the
// 24-unit grid (R-07), every shape kind of data-model.md § Icon used. `mirror` marks the four inline-direction icons.
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

function polyline(points: string): Part {
  return { name: "polyline", attributes: { points } };
}

function path(d: string): Part {
  return { name: "path", attributes: { d } };
}

function rect(x: number, y: number, width: number, height: number, rx: number): Part {
  return { name: "rect", attributes: { x: String(x), y: String(y), width: String(width), height: String(height), rx: String(rx) } };
}

function circle(cx: number, cy: number, r: number): Part {
  return { name: "circle", attributes: { cx: String(cx), cy: String(cy), r: String(r) } };
}

export const expectedIcons: Readonly<Record<string, ExpectedIcon>> = {
  // A chevron pointing to the inline start (left in left-to-right text), 7 units deep and 14 high.
  "chevron-start": { mirror: true, shapes: [polyline("15 5 8 12 15 19")] },
  // The same chevron pointing to the inline end.
  "chevron-end": { mirror: true, shapes: [polyline("9 5 16 12 9 19")] },
  "chevron-up": { mirror: false, shapes: [polyline("5 15 12 8 19 15")] },
  "chevron-down": { mirror: false, shapes: [polyline("5 9 12 16 19 9")] },
  // A 14-unit shaft with a 6-unit head at the inline start.
  "arrow-start": { mirror: true, shapes: [line(19, 12, 5, 12), polyline("11 6 5 12 11 18")] },
  "arrow-end": { mirror: true, shapes: [line(5, 12, 19, 12), polyline("13 6 19 12 13 18")] },
  // Three bars across the grid's 16-unit middle, 6 units apart.
  menu: { mirror: false, shapes: [line(4, 6, 20, 6), line(4, 12, 20, 12), line(4, 18, 20, 18)] },
  // Two diagonals of the 12-unit square centred on the grid.
  close: { mirror: false, shapes: [line(6, 6, 18, 18), line(18, 6, 6, 18)] },
  // A folder with its tab on the left.
  folder: { mirror: false, shapes: [path("M3 5h6l2 3h10v11H3z")] },
  // A sheet with its top right corner folded.
  file: { mirror: false, shapes: [path("M6 3h8l5 5v13H6z"), polyline("14 3 14 8 19 8")] },
  // A lens with its handle to the bottom right.
  search: { mirror: false, shapes: [circle(10, 10, 6), line(14.5, 14.5, 20, 20)] },
  // A frame with a header row, two rows and two columns.
  table: { mirror: false, shapes: [rect(3, 4, 18, 16, 1), line(3, 10, 21, 10), line(3, 15, 21, 15), line(12, 10, 12, 20)] },
  // A sheet in front of the outline of the sheet behind it, up and to the left.
  copy: { mirror: false, shapes: [rect(8, 8, 12, 12, 1), path("M16 8V4H4v12h4")] },
};

/** The thirteen names of the set, in the spec's order. */
export const iconNames: readonly string[] = Object.keys(expectedIcons);

/** The drawing an `ocelle-icon` of `name` holds in its shadow root: one `svg` with the icon's shapes. */
export function expectedDrawing(name: string): { readonly children: readonly string[]; readonly svg: { readonly attributes: Readonly<Record<string, string>>; readonly parts: readonly Part[] } } {
  const icon = expectedIcons[name];
  if (icon === undefined) throw new Error(`no expected drawing for ${name}`);
  return { children: ["svg"], svg: { attributes: svgAttributes, parts: icon.shapes } };
}

/** The shadow root of an `ocelle-icon` that draws nothing (an unknown, empty or missing name). */
export const emptyDrawing = { children: [], svg: null } as const;
