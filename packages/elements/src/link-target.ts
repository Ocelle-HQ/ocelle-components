// The navigation decision of `ocelle-link` (014 FR-047; research.md R-08; data-model.md § Link state). Internal, not
// an entry point and not in the manifest. The decision is on the URL `href` resolves to against the document's base URL
// at the moment of the activation, never on the string as written (the URL parser drops leading and trailing spaces and
// control characters and every tab and newline, so ` javascript:` and `java<TAB>script:` resolve to `javascript:`) and
// never on the document's own URL (a `<base>` decides). Allowed: `http:`, `https:` and the document's own protocol (a
// `file:` document, a webview's custom scheme). An empty `href` resolves to the base without its fragment; a fragment to
// the base with it.

/**
 * The URL the link navigates to: `href` resolved against `baseURI`, or null when `href` is null, does not parse, or
 * resolves to a protocol other than `http:`, `https:` or `documentProtocol`.
 */
export function navigationTarget(href: string | null, baseURI: string, documentProtocol: string): string | null {
  if (href === null || !URL.canParse(href, baseURI)) return null;
  const url = new URL(href, baseURI);
  return url.protocol === "http:" || url.protocol === "https:" || url.protocol === documentProtocol ? url.href : null;
}
