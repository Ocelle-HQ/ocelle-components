import { LitElement } from "lit";

/**
 * A plant element with one public member that has no description (005 FR-009).
 *
 * @tagname ocelle-plant
 */
export class OcellePlant extends LitElement {
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "tone"];
  }
}
