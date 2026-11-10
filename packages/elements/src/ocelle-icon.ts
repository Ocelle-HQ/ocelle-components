// `ocelle-icon` (005 FR-011 to FR-016, FR-034; research.md R-04, R-13). Scaffold: the class and its public fields,
// no rendering, no styles and no registration yet.
import { LitElement } from "lit";
import type { IconName } from "./icons.ts";

export type { IconName } from "./icons.ts";

/**
 * An icon of the set.
 *
 * @tagname ocelle-icon
 */
export class OcelleIcon extends LitElement {
  /** The icon's name. */
  declare name: IconName | undefined;

  /** The icon's accessible name. */
  declare label: string | undefined;
}
