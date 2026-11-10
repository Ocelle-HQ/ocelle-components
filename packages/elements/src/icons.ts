// The icon drawings (005 research.md R-07, data-model.md § Icon). Internal, not an entry point; `IconName` is exported
// through ocelle-icon.ts. Scaffold: no drawing yet.

/** The names of the set. */
export type IconName = "close" | "menu";

/** One shape of a drawing, on the 24-unit grid. */
export type Shape =
  | { readonly kind: "path"; readonly d: string }
  | { readonly kind: "line"; readonly x1: number; readonly y1: number; readonly x2: number; readonly y2: number }
  | { readonly kind: "polyline"; readonly points: string }
  | { readonly kind: "rect"; readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly rx?: number }
  | { readonly kind: "circle"; readonly cx: number; readonly cy: number; readonly r: number };

/** One icon: whether it mirrors in right-to-left text, and its shapes. */
export interface Icon {
  readonly mirror: boolean;
  readonly shapes: readonly Shape[];
}

/** The drawings by name. */
export const icons: Readonly<Record<IconName, Icon>> = {
  close: { mirror: false, shapes: [] },
  menu: { mirror: false, shapes: [] },
};
