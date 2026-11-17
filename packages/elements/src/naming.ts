// The accessible name of an icon or mark (005 research.md R-13, FR-013, FR-014, FR-028, FR-034; data-model.md
// § State). A host `aria-label`, when the attribute is present, decides alone (operator decision
// PLAN-A11Y-SECURITY-1-002 (a)): a value with a non-whitespace character names the element, a blank one leaves it
// unlabelled even with a `label`, because Chromium names the host from a present `aria-label` whatever the element
// sets. Without one, the trimmed `label` names it when non-empty. The element never writes the host's attribute;
// hosts pass it trimmed (PLAN-A11Y-SECURITY-1-003 (a)). Since 011, it also holds `internalsKey`, where the landmark
// elements keep their internals (research.md R-11). Internal, not an entry point.

/**
 * The element's accessible name: when the host has an `aria-label` attribute it alone decides (its value when it
 * holds a non-whitespace character, else none); otherwise the trimmed `label` when non-empty, else none.
 */
export function accessibleName(label: string | undefined, hostAriaLabel: string | null): string | undefined {
  if (hostAriaLabel !== null) return hostAriaLabel.trim() === "" ? undefined : hostAriaLabel;
  const trimmed = label?.trim() ?? "";
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Sets the element's internals: when it is drawable and named, one `img` with that name and not hidden; otherwise
 * hidden, with no role and no name, so the host (which commonly carries an `id`) is not exposed as an empty generic
 * node. A host `aria-hidden="true"` still hides it in every case (ARIA precedence over internals).
 */
export function expose(internals: ElementInternals, name: string | undefined, drawable: boolean): void {
  const shown = drawable && name !== undefined;
  internals.role = shown ? "img" : null;
  internals.ariaLabel = shown ? name : null;
  internals.ariaHidden = shown ? null : "true";
}

/**
 * The key of the own property that holds a landmark element's internals (011 research.md R-11): the context sidebar
 * and the personal rail declare `readonly [internalsKey] = this.attachInternals()`. An own property keyed by a symbol
 * described `internals` is where axe-core's role computation reads a custom element's internals, so axe judges the
 * host's ARIA attributes against its `navigation` role; a `#private` field would hide them from it. Not exported from
 * the package root or the browser build.
 *
 * @internal
 */
export const internalsKey = Symbol("internals");
