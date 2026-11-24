export type WorkflowCanvasNavigationKey = "ArrowLeft" | "ArrowUp" | "ArrowRight" | "ArrowDown" | "Home" | "End";

export interface WorkflowCanvasPendingReveal {
  readonly nodeId: string;
  readonly generation: number;
  readonly focusEpoch: number;
}

export function workflowCanvasEntryId(
  order: readonly string[],
  eligibleIds: ReadonlySet<string>,
  selectedId: string | null,
): string | null {
  if (selectedId !== null && eligibleIds.has(selectedId)) return selectedId;
  return order.find((id) => eligibleIds.has(id)) ?? null;
}

export function navigateWorkflowCanvas(
  order: readonly string[],
  eligibleIds: ReadonlySet<string>,
  currentId: string,
  key: WorkflowCanvasNavigationKey,
): string | null {
  const eligibleOrder = order.filter((id) => eligibleIds.has(id));
  const currentIndex = eligibleOrder.indexOf(currentId);
  if (currentIndex === -1) return null;

  switch (key) {
    case "Home":
      return eligibleOrder[0] ?? null;
    case "End":
      return eligibleOrder.at(-1) ?? null;
    case "ArrowLeft":
    case "ArrowUp":
      return eligibleOrder[currentIndex - 1] ?? null;
    case "ArrowRight":
    case "ArrowDown":
      return eligibleOrder[currentIndex + 1] ?? null;
  }
}

export function recoverWorkflowCanvasFocus(
  previousOrder: readonly string[],
  eligibleIds: ReadonlySet<string>,
  previousId: string,
): string | null {
  if (eligibleIds.has(previousId)) return previousId;

  const previousIndex = previousOrder.indexOf(previousId);
  if (previousIndex === -1) return null;

  const isEligible = (id: string) => eligibleIds.has(id);
  return previousOrder.slice(previousIndex + 1).find(isEligible)
    ?? previousOrder.slice(0, previousIndex).findLast(isEligible)
    ?? null;
}

export function workflowCanvasRevealTarget(
  pending: WorkflowCanvasPendingReveal | null,
  eligibleIds: ReadonlySet<string>,
  currentGeneration: number,
  currentFocusEpoch: number,
): string | null {
  if (pending?.generation !== currentGeneration
    || pending.focusEpoch !== currentFocusEpoch
    || !eligibleIds.has(pending.nodeId)) return null;

  return pending.nodeId;
}
