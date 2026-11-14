// The package root (005 FR-002, research.md R-02): importing it defines every element of the package, `ocelle-icon`,
// `ocelle-brand-mark` and `ocelle-dialog` (008), and exports their classes; the overlays' internal base is not exported.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleDialog } from "./ocelle-dialog.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
