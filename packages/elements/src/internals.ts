// Where the selection elements keep their `ElementInternals` (014 research.md R-01, operator decision
// PLAN-FRESH-1-001 (a)). axe-core 4.14.0, the version the `axe` gate pins, finds an element's internals only through
// `globalThis._elementInternals`, the own properties `_internals`, `internals` or `internals_`, or an own symbol
// described `internals` or `privateInternals`; in an ES private field it cannot see them, and a focusable child host
// with no role it can see carrying `aria-selected` is a critical `aria-allowed-attr` violation to it. So the elements
// of this feature keep their internals as an own data property under one module-private symbol described `internals`:
// axe reads it, no string-keyed property is added to the element, and neither the manifest nor the README lists it.
// Mission 005's elements keep theirs in a private field. Internal, not an entry point.

/** The module-private symbol the internals are kept under, as an own, non-enumerable data property of the element. */
export const internalsKey: unique symbol = Symbol("internals");

/** Attaches the element's internals, keeps them under `internalsKey` and returns them. */
export function attachInternalsTo(element: HTMLElement): ElementInternals {
  const internals = element.attachInternals();
  Object.defineProperty(element, internalsKey, { value: internals });
  return internals;
}
