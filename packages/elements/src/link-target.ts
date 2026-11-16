// The navigation decision of `ocelle-link` (014 FR-047; research.md R-08; data-model.md § Link state). Internal, not
// an entry point and not in the manifest. Scaffold: signature only.

/**
 * The URL the link navigates to: `href` resolved against `baseURI`, or null when `href` is null, does not parse, or
 * resolves to a protocol other than `http:`, `https:` or `documentProtocol`.
 */
export function navigationTarget(_href: string | null, _baseURI: string, _documentProtocol: string): string | null {
  return null;
}
