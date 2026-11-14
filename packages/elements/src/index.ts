// The package root (005 FR-002, research.md R-02): importing it defines every element of the package, `ocelle-icon`,
// `ocelle-brand-mark` and, since 009, `ocelle-scroller`, and exports their classes. The overflow-region module is
// internal and not exported.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcelleScroller } from "./ocelle-scroller.ts";
