// The lane's count and name (009 FR-018, FR-019; research.md R-09; data-model.md § Lane). The count attribute counts
// exactly when, after trimming, it is decimal digits alone and at most `Number.MAX_SAFE_INTEGER`; the property, when it
// is a safe integer of 0 or more; anything else is no count. The name is the title, then ", " and the trimmed non-blank
// `count-label` or the count, when a count is shown; without a title, the count's text alone; without a shown count,
// the title alone; with neither, none. A non-blank host `aria-label` decides alone, trimmed, and a blank one counts as
// absent (FR-010, through the overflow-region module's `resolveName`). No word is added in any language. Internal, not
// an entry point.
import { resolveName } from "./overflow-region.ts";

/** The count an attribute value gives: decimal digits only after trimming, at most `Number.MAX_SAFE_INTEGER`. */
export function parseCount(value: string | null): number | undefined {
  const digits = value?.trim() ?? "";
  if (!/^[0-9]+$/.test(digits)) return undefined;
  return validCount(Number(digits));
}

/** The count a property value gives: a safe integer of 0 or more, else none. */
export function validCount(value: unknown): number | undefined {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

/** The lane's group name: the host's non-blank `aria-label`, else the title and the count text, else none. */
export function laneName(hostAriaLabel: string | null, label: string | undefined, count: number | undefined, countLabel: string | undefined): string | undefined {
  const host = resolveName(hostAriaLabel, undefined);
  if (host !== undefined) return host;
  const title = resolveName(null, label);
  const counted = count === undefined ? undefined : (resolveName(null, countLabel) ?? String(count));
  if (title === undefined) return counted;
  return counted === undefined ? title : `${title}, ${counted}`;
}
