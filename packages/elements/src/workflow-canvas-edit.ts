import type { WorkflowCanvasConnectionRequestDetail, WorkflowCanvasGraph } from "./workflow-canvas-types.ts";

export interface WorkflowCanvasEdit {
  readonly sourceId: string;
  readonly outcomeId: string;
  readonly currentDestinationId: string | null;
  readonly destinationId: string | null;
}

export function startWorkflowCanvasEdit(
  graph: WorkflowCanvasGraph, sourceId: string, outcomeId: string,
): WorkflowCanvasEdit | null {
  const source = graph.nodes.find(({ id }) => id === sourceId);
  if (!source?.outcomes.some(({ id }) => id === outcomeId)) return null;
  const currentDestinationId = graph.connections.find((edge) => edge.sourceId === sourceId && edge.outcomeId === outcomeId)?.destinationId ?? null;
  if (currentDestinationId !== null && !graph.nodes.some(({ id }) => id === currentDestinationId)) return null;
  return { sourceId, outcomeId, currentDestinationId, destinationId: null };
}

export function isWorkflowCanvasEditCurrent(graph: WorkflowCanvasGraph, edit: WorkflowCanvasEdit): boolean {
  const current = startWorkflowCanvasEdit(graph, edit.sourceId, edit.outcomeId);
  return current?.currentDestinationId === edit.currentDestinationId
    && (edit.destinationId === null || graph.nodes.some(({ id }) => id === edit.destinationId));
}

export function workflowCanvasEditRequest(edit: WorkflowCanvasEdit, disconnect: boolean): WorkflowCanvasConnectionRequestDetail | null {
  const { sourceId, outcomeId, currentDestinationId } = edit;
  const destinationId = disconnect ? currentDestinationId : edit.destinationId;
  if (destinationId === null || (!disconnect && destinationId === currentDestinationId)) return null;
  const operation = disconnect ? "disconnect" : currentDestinationId === null ? "connect" : "reassign";
  return { operation, sourceId, outcomeId, destinationId };
}
