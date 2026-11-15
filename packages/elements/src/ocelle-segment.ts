// `ocelle-segment` (014 FR-009, FR-026, FR-029, FR-030; research.md R-01, R-06). Scaffold: signatures only.
import { LitElement } from "lit";

/**
 * A segment of an `ocelle-segmented-choice`.
 *
 * @tagname ocelle-segment
 */
export class OcelleSegment extends LitElement {
  static override properties = {
    disabled: { type: Boolean, reflect: true },
  };

  /**
   * Whether the segment is disabled.
   *
   * @default false
   */
  declare disabled: boolean;

  /** The segment's value. */
  get value(): string {
    return "";
  }

  set value(_value: string) {}
}

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-segment": OcelleSegment;
  }
}
