// `ocelle-tooltip` (008 FR-029 to FR-037; research.md R-10 to R-13; data-model.md § `ocelle-tooltip`): scaffold of
// phase 4. The class and its declared properties, no behaviour; not defined and not exported from the package root.
import { LitElement } from "lit";

export class OcelleTooltip extends LitElement {
  declare text: string;
  declare placement: "top" | "bottom" | "start" | "end";
  declare disabled: boolean;
  declare describes: boolean;
}
