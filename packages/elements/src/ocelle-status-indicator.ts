// `ocelle-status-indicator` (018 spec US1), phase 2 scaffold: the class only, with no behaviour, no shadow content and
// no registration, so the red tests of phase 2 fail on their assertions, not on a missing module.
import { LitElement } from "lit";

/** A status dot with an optional pulse (not implemented yet). */
export class OcelleStatusIndicator extends LitElement {}
