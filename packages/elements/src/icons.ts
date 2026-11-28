// The icon drawings (005 research.md R-07, data-model.md § Icon): each icon is data, its mirroring flag and its
// shapes on the 24-unit grid, drawn for this library (operator decision, own drawings), geometry within 2 to 22. Every
// shape is stroked with the stroke style that `ocelle-icon` sets once on its `svg` (currentColor, width 2, round caps
// and joins, no fill), so a shape holds geometry only. `mirror` marks the four inline-direction icons, which
// `ocelle-icon` flips under right-to-left text (R-08). The table is typed by `IconName`, so the type checker rejects a
// missing or an extra name, and is not written `as const`, so Stryker mutates the drawings (PLAN-TESTABILITY-1-005
// (a)); the tests compare every drawing with their own expected table (test/icons-expected.ts). Internal, not an entry
// point; `IconName` is exported through ocelle-icon.ts.

/** The names of the set (FR-017). */
export type IconName =
  | "chevron-start"
  | "chevron-end"
  | "chevron-up"
  | "chevron-down"
  | "arrow-start"
  | "arrow-end"
  | "menu"
  | "close"
  | "folder"
  | "file"
  | "search"
  | "table"
  | "copy"
  | "inbox"
  | "history"
  | "settings"
  | "notifications"
  | "appearance";

/** One shape of a drawing, on the 24-unit grid (data-model.md § Icon). */
export type Shape =
  | { readonly kind: "line"; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
  | { readonly kind: "polyline"; readonly points: string }
  | { readonly kind: "path"; readonly d: string }
  | { readonly kind: "rect"; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly rx: number }
  | { readonly kind: "circle"; readonly cx: number; readonly cy: number; readonly r: number };

/** One icon: whether it mirrors in right-to-left text, and its shapes. */
export interface Icon {
  readonly mirror: boolean;
  readonly shapes: readonly Shape[];
}

/** The drawings by name. */
export const icons: Readonly<Record<IconName, Icon>> = {
  "chevron-start": { mirror: true, shapes: [{ kind: "polyline", points: "15 5 8 12 15 19" }] },
  "chevron-end": { mirror: true, shapes: [{ kind: "polyline", points: "9 5 16 12 9 19" }] },
  "chevron-up": { mirror: false, shapes: [{ kind: "polyline", points: "5 15 12 8 19 15" }] },
  "chevron-down": { mirror: false, shapes: [{ kind: "polyline", points: "5 9 12 16 19 9" }] },
  "arrow-start": {
    mirror: true,
    shapes: [
      { kind: "line", x1: 19, y1: 12, x2: 5, y2: 12 },
      { kind: "polyline", points: "11 6 5 12 11 18" },
    ],
  },
  "arrow-end": {
    mirror: true,
    shapes: [
      { kind: "line", x1: 5, y1: 12, x2: 19, y2: 12 },
      { kind: "polyline", points: "13 6 19 12 13 18" },
    ],
  },
  menu: {
    mirror: false,
    shapes: [
      { kind: "line", x1: 4, y1: 6, x2: 20, y2: 6 },
      { kind: "line", x1: 4, y1: 12, x2: 20, y2: 12 },
      { kind: "line", x1: 4, y1: 18, x2: 20, y2: 18 },
    ],
  },
  close: {
    mirror: false,
    shapes: [
      { kind: "line", x1: 6, y1: 6, x2: 18, y2: 18 },
      { kind: "line", x1: 18, y1: 6, x2: 6, y2: 18 },
    ],
  },
  folder: { mirror: false, shapes: [{ kind: "path", d: "M3 5h6l2 3h10v11H3z" }] },
  file: {
    mirror: false,
    shapes: [
      { kind: "path", d: "M6 3h8l5 5v13H6z" },
      { kind: "polyline", points: "14 3 14 8 19 8" },
    ],
  },
  search: {
    mirror: false,
    shapes: [
      { kind: "circle", cx: 10, cy: 10, r: 6 },
      { kind: "line", x1: 14.5, y1: 14.5, x2: 20, y2: 20 },
    ],
  },
  table: {
    mirror: false,
    shapes: [
      { kind: "rect", x: 3, y: 4, width: 18, height: 16, rx: 1 },
      { kind: "line", x1: 3, y1: 10, x2: 21, y2: 10 },
      { kind: "line", x1: 3, y1: 15, x2: 21, y2: 15 },
      { kind: "line", x1: 12, y1: 10, x2: 12, y2: 20 },
    ],
  },
  copy: {
    mirror: false,
    shapes: [
      { kind: "rect", x: 8, y: 8, width: 12, height: 12, rx: 1 },
      { kind: "path", d: "M16 8V4H4v12h4" },
    ],
  },
  inbox: {
    mirror: false,
    shapes: [
      { kind: "path", d: "M3 14l3-9h12l3 9v5H3z" },
      { kind: "polyline", points: "3 14 8 14 10 16 14 16 16 14 21 14" },
    ],
  },
  history: {
    mirror: false,
    shapes: [
      { kind: "path", d: "M4 10a8 8 0 1 1 1 7" },
      { kind: "polyline", points: "3 5 4 10 9 9" },
      { kind: "polyline", points: "12 7 12 12 16 14" },
    ],
  },
  settings: {
    mirror: false,
    shapes: [
      { kind: "path", d: "M10 3h4l1 3 3-1 2 3-2 3 2 2-1 4-4 1-1 3h-4l-1-3-3-1-2-3 2-3-2-2 2-4 3 1z" },
      { kind: "circle", cx: 12, cy: 12, r: 3 },
    ],
  },
  notifications: {
    mirror: false,
    shapes: [
      { kind: "path", d: "M4 17l2-3V10a6 6 0 0 1 12 0v4l2 3z" },
      { kind: "path", d: "M10 20q2 2 4 0" },
    ],
  },
  appearance: {
    mirror: false,
    shapes: [
      { kind: "circle", cx: 12, cy: 12, r: 8 },
      { kind: "line", x1: 12, y1: 4, x2: 12, y2: 20 },
      { kind: "line", x1: 15, y1: 7, x2: 15, y2: 17 },
      { kind: "line", x1: 18, y1: 10, x2: 18, y2: 14 },
    ],
  },
};
const byName: ReadonlyMap<string, Icon> = new Map(Object.entries(icons));

/** The icon of exactly this name, or undefined for any other value (an unknown, empty, missing or differently written name). */
export function iconOf(name: string | null | undefined): Icon | undefined {
  return name === null || name === undefined ? undefined : byName.get(name);
}
