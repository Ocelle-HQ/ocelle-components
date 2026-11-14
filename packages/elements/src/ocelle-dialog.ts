// `ocelle-dialog` (008 FR-001 to FR-024). Phase 2 scaffold: the class with no behaviour, not defined and not exported
// from the package root.
import { OcelleOverlay } from "./overlay.ts";

/** A modal dialog. Scaffold: no behaviour. */
export class OcelleDialog extends OcelleOverlay {
  protected override readonly eventPrefix: string = "ocelle-dialog";
}
