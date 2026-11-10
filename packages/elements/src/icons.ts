// The icon drawings (005 research.md R-07, data-model.md § Icon): each icon is data, its mirroring flag and its
// shapes on the 24-unit grid, drawn for this library (operator decision, own drawings). Every shape is stroked with
// the stroke style that `ocelle-icon` sets once on its `svg` (currentColor, width 2, round caps and joins, no fill), so
// a shape holds geometry only. The table is typed by `IconName`, so the type checker rejects a missing or an extra
// name, and is not written `as const`, so Stryker mutates the drawings (PLAN-TESTABILITY-1-005 (a)); the tests compare
// every drawing with their own expected table (test/icons-expected.ts). Phase 2 draws `close` and `menu`; phase 3 the
// other eleven. Internal, not an entry point; `IconName` is exported through ocelle-icon.ts.

/** The names of the set. */
export type IconName = "close" | "menu";

/**
 * One shape of a drawing, on the 24-unit grid. Phase 2's drawings are lines; phase 3 adds the path, polyline, rect and
 * circle shapes of data-model.md § Icon with the drawings that use them.
 */
export interface Shape {
  readonly kind: "line";
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** One icon: whether it mirrors in right-to-left text, and its shapes. */
export interface Icon {
  readonly mirror: boolean;
  readonly shapes: readonly Shape[];
}

/** The drawings by name. */
export const icons: Readonly<Record<IconName, Icon>> = {
  close: {
    // Stryker disable next-line BooleanLiteral: equivalent until phase 3, nothing reads mirror before R-08's mirroring rule (T037) does
    mirror: false,
    shapes: [
      { kind: "line", x1: 6, y1: 6, x2: 18, y2: 18 },
      { kind: "line", x1: 18, y1: 6, x2: 6, y2: 18 },
    ],
  },
  menu: {
    // Stryker disable next-line BooleanLiteral: equivalent until phase 3, nothing reads mirror before R-08's mirroring rule (T037) does
    mirror: false,
    shapes: [
      { kind: "line", x1: 4, y1: 6, x2: 20, y2: 6 },
      { kind: "line", x1: 4, y1: 12, x2: 20, y2: 12 },
      { kind: "line", x1: 4, y1: 18, x2: 20, y2: 18 },
    ],
  },
};

const byName: ReadonlyMap<string, Icon> = new Map(Object.entries(icons));

/** The icon of exactly this name, or undefined for any other value (an unknown, empty, missing or differently written name). */
export function iconOf(name: string | null | undefined): Icon | undefined {
  return name === null || name === undefined ? undefined : byName.get(name);
}
