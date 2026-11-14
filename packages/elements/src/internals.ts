// Where the selection elements keep their `ElementInternals` (014 research.md R-01, operator decision
// PLAN-FRESH-1-001 (a)). Internal, not an entry point and not in the manifest. Scaffold: signatures only.

/** The module-private symbol the internals are kept under, as an own property of the element. */
export const internalsKey: unique symbol = Symbol("internals");

/** Attaches the element's internals and keeps them under `internalsKey`. */
export function attachInternalsTo(_element: HTMLElement): ElementInternals {
  throw new Error("not implemented");
}
