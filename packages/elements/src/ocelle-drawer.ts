// `ocelle-drawer` (008 FR-025 to FR-028, FR-048). Phase 3 scaffold: the class and its declared properties with no
// behaviour, not defined and not exported from the package root.
import { OcelleOverlay } from "./overlay.ts";

/** A modal side drawer. Scaffold: no behaviour. */
export class OcelleDrawer extends OcelleOverlay {
  protected override readonly eventPrefix: string = "ocelle-drawer";

  /** The inline edge of the viewport the drawer is placed on. Scaffold. */
  declare side: "start" | "end";

  /** The drawer's ground. Scaffold. */
  declare ground: "sheet" | "chrome";

  /** Whether the heading is visually hidden. Scaffold. */
  declare headingHidden: boolean;
}
