export type WorkflowCanvasNavigationKey = "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown" | "Home" | "End";

export interface WorkflowCanvasPendingReveal {
  readonly nodeId: string;
  readonly generation: number;
  readonly focusEpoch: number;
}

export const workflowCanvasEntryId: (
  order: readonly string[],
  eligibleIds: ReadonlySet<string>,
  selectedId: string | null,
) => string | null = () => null;

export const navigateWorkflowCanvas: (
  order: readonly string[],
  eligibleIds: ReadonlySet<string>,
  currentId: string,
  key: WorkflowCanvasNavigationKey,
) => string | null = () => null;

export const recoverWorkflowCanvasFocus: (
  previousOrder: readonly string[],
  eligibleIds: ReadonlySet<string>,
  previousId: string,
) => string | null = () => null;

export const workflowCanvasRevealTarget: (
  pending: WorkflowCanvasPendingReveal | null,
  eligibleIds: ReadonlySet<string>,
  currentGeneration: number,
  currentFocusEpoch: number,
) => string | null = () => null;
