// The measurement pass of `ocelle-list-detail` (009 FR-025, FR-030; research.md R-13): phase 4 scaffold. The exported
// signatures only, with no behaviour; the green step of phase 4 implements them. Internal: not exported from the
// package root, not an entry point and not in the manifest.
/* eslint-disable @typescript-eslint/no-unused-vars -- the scaffold has signatures and no behaviour */

/** The number of measurement passes run on the page since this module loaded (test-only). */
export function passCount(): number {
  return 0;
}

/** The measurement of one list-detail: its stylesheet of figures, its observer and its frame request. */
export class ListDetailMeasure {
  /** The instance's constructed stylesheet of measured figures, adopted after the element's shared sheets. */
  readonly sheet = new CSSStyleSheet();

  /** `grid` returns the element's shadow grid, or null before the first render. */
  constructor(grid: () => HTMLElement | null) {
    throw new Error("not implemented");
  }

  /** Observes the light DOM of `elements` (the assigned elements of every pane), in place of what it observed before. */
  observe(elements: readonly Element[]): void {
    throw new Error("not implemented");
  }

  /** Requests one pass for the next animation frame, unless one is already requested. */
  schedule(): void {
    throw new Error("not implemented");
  }

  /** Runs the pass now. */
  measure(): void {
    throw new Error("not implemented");
  }

  /** Stops observing and cancels a requested pass. */
  disconnect(): void {
    throw new Error("not implemented");
  }
}
