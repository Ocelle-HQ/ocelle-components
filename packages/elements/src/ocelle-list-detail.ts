// `ocelle-list-detail` (009 FR-022 to FR-030): phase 4 scaffold. The class only, with no behaviour and no
// registration; the green step of phase 4 implements it.
import { LitElement } from "lit";

export class OcelleListDetail extends LitElement {
  /** Requests a measurement pass for the next animation frame (not implemented in the scaffold). */
  remeasure(): void {
    throw new Error("not implemented");
  }
}
