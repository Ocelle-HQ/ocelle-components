// The lane's count and name (009 FR-018, FR-019; research.md R-09; data-model.md § Lane): phase 3 scaffold. The
// exported signatures only, with no behaviour; the green step of phase 3 implements them. Internal, not an entry point.
/* eslint-disable @typescript-eslint/no-unused-vars -- the scaffold has signatures and no behaviour */

/** The count an attribute value gives: decimal digits only after trimming, at most `Number.MAX_SAFE_INTEGER`. */
export function parseCount(value: string | null): number | undefined {
  throw new Error("not implemented");
}

/** The count a property value gives: a safe integer of 0 or more, else none. */
export function validCount(value: unknown): number | undefined {
  throw new Error("not implemented");
}

/** The lane's group name: the host's non-blank `aria-label`, else the title and the count text, else none. */
export function laneName(hostAriaLabel: string | null, label: string | undefined, count: number | undefined, countLabel: string | undefined): string | undefined {
  throw new Error("not implemented");
}
