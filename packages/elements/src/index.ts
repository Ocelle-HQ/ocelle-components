// The package root (005 FR-002, research.md R-02): importing it defines every element of the package, `ocelle-icon`,
// `ocelle-brand-mark` and, since 009, `ocelle-scroller`, `ocelle-workflow-board` and `ocelle-workflow-lane`, and
// exports their classes. The overflow-region and lane-count modules are internal and not exported.
export { OcelleBrandMark } from "./ocelle-brand-mark.ts";
export { OcelleIcon } from "./ocelle-icon.ts";
export type { IconName } from "./ocelle-icon.ts";
export { OcelleScroller } from "./ocelle-scroller.ts";
export { OcelleWorkflowBoard } from "./ocelle-workflow-board.ts";
export { OcelleWorkflowLane } from "./ocelle-workflow-lane.ts";
