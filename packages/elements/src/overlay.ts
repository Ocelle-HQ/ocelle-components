// The overlays' internal base, `OcelleOverlay` (008 research.md R-01 to R-08, R-18; data-model.md § Overlay). Phase 2
// scaffold: the class and its types with no behaviour. Internal, not an entry point, and no tag.
import { LitElement } from "lit";

/** Why an overlay closed: a request's reason, or `host` when the host or the platform closed it. */
export type CloseReason = "escape" | "close-button" | "backdrop" | "host";

/** The internal base of `ocelle-dialog` and `ocelle-drawer`. Scaffold: renders nothing. */
export class OcelleOverlay extends LitElement {
  /** The event prefix, `ocelle-<element>`, of the subclass. */
  protected readonly eventPrefix: string = "ocelle-overlay";
}
