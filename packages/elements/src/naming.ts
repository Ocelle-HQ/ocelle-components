// The accessible name of an icon or mark (005 research.md R-13, FR-013, FR-014, FR-028, FR-034; data-model.md
// § State). Internal, not an entry point. Scaffold: no behaviour yet.

/**
 * The element's accessible name: when the host has an `aria-label` attribute it alone decides (its value when it
 * holds a non-whitespace character, else none); otherwise the trimmed `label` when non-empty, else none.
 */
export function accessibleName(label: string | undefined, hostAriaLabel: string | null): string | undefined {
  throw new Error(`not implemented: accessibleName(${String(label)}, ${String(hostAriaLabel)})`);
}

/** Sets the element's internals: one `img` named `name` when drawable and named, else hidden with no role or name. */
export function expose(internals: ElementInternals, name: string | undefined, drawable: boolean): void {
  throw new Error(`not implemented: expose(${String(internals.role)}, ${String(name)}, ${String(drawable)})`);
}
