// `ocelle-notice` (specs/010-feedback-forms FR-004 to FR-011; research.md R-02, R-03; data-model.md § Notice).
// Scaffold (T009a): the class with no property, style or render, not defined.
import { LitElement } from "lit";

/**
 * A message about a state or result in a box whose look follows its tone, with an optional heading, in the regular or
 * the compact size, announced once by assistive technology when `announce` is set.
 *
 * @tagname ocelle-notice
 */
export class OcelleNotice extends LitElement {}
