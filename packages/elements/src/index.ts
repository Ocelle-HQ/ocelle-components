// The package root (005 FR-002, research.md R-02; 011 FR-001; 013 contracts/elements.md § Modules and exports):
// importing it defines every element of the package, `ocelle-icon`, `ocelle-brand-mark`, `ocelle-card`,
// `ocelle-section-header`, `ocelle-page-header`, `ocelle-context-sidebar`, `ocelle-personal-rail`, `ocelle-facts`,
// `ocelle-fact`, `ocelle-empty-state` and `ocelle-progress`, and exports their classes.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleCard } from "./ocelle-card.ts";
export { OcelleContextSidebar } from "./ocelle-context-sidebar.ts";
export { OcelleEmptyState } from "./ocelle-empty-state.ts";
export { OcelleFact } from "./ocelle-fact.ts";
export { OcelleFacts } from "./ocelle-facts.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcellePageHeader } from "./ocelle-page-header.ts";
export { OcellePersonalRail } from "./ocelle-personal-rail.ts";
export { OcelleProgress } from "./ocelle-progress.ts";
export { OcelleSectionHeader } from "./ocelle-section-header.ts";
