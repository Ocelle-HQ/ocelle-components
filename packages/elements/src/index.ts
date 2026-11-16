// The package root (005 FR-002, research.md R-02; 013 contracts/elements.md § Modules and exports): importing it
// defines every element of the package, `ocelle-icon`, `ocelle-brand-mark`, `ocelle-dialog`, `ocelle-drawer` and
// `ocelle-tooltip` (008), `ocelle-facts`, `ocelle-fact`, `ocelle-empty-state` and `ocelle-progress` (013), and exports
// their classes; the overlays' internal base is not exported.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleDialog } from "./ocelle-dialog.ts";
export { OcelleDrawer } from "./ocelle-drawer.ts";
export { OcelleEmptyState } from "./ocelle-empty-state.ts";
export { OcelleFact } from "./ocelle-fact.ts";
export { OcelleFacts } from "./ocelle-facts.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export { OcelleProgress } from "./ocelle-progress.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcelleTooltip } from "./ocelle-tooltip.ts";
