// The tabbable walk of the overlays (008 research.md R-04; data-model.md § Overlay, Stops). Phase 2 scaffold: the
// exported signatures only, with no behaviour. Internal, not an entry point.

/** A candidate of the Tab cycle: a stop, or an opaque container tried by explicit moves. */
export interface Candidate {
  readonly element: HTMLElement;
  readonly kind: "stop" | "opaque";
}

/** The candidates of a subtree in flat-tree order and in sequential navigation order. */
export interface Walk {
  readonly flat: readonly Candidate[];
  readonly order: readonly Candidate[];
}

/** Whether `element` is a custom element whose shadow root the walk cannot read. Scaffold: always false. */
export function isOpaque(_element: Element): boolean {
  return false;
}

/** Whether `element` is opaque content. Scaffold: always false. */
export function isOpaqueContent(_element: Element): boolean {
  return false;
}

/** Walks `root`: its candidates in both orders. Scaffold: none. */
export function walk(_root: Element | ShadowRoot): Walk {
  return { flat: [], order: [] };
}

/** The deepest active element of the document. Scaffold: null. */
export function deepActive(): Element | null {
  return null;
}
