// `ocelle-metric` (018 spec US2), phase 3 scaffold: the class only, with no behaviour, no shadow content and no
// registration, so the red tests of phase 3 fail on their assertions, not on a missing module.
import { LitElement } from "lit";

/** A label and its value, as one term and its definition (not implemented yet). */
export class OcelleMetric extends LitElement {}
