import type {
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasNode,
  WorkflowCanvasOutcome,
  WorkflowCanvasPoint,
} from "./workflow-canvas-types.ts";

export interface WorkflowCanvasRelationship {
  readonly source: WorkflowCanvasNode;
  readonly outcome: WorkflowCanvasOutcome;
  readonly destination: WorkflowCanvasNode;
}

export interface WorkflowCanvasProjection {
  readonly nodes: readonly WorkflowCanvasNode[];
  readonly positions: ReadonlyMap<string, WorkflowCanvasPoint>;
  readonly relationships: readonly WorkflowCanvasRelationship[];
  readonly drawableConnections: readonly WorkflowCanvasRelationship[];
}

export const projectWorkflowCanvasGraph: (
  graph: WorkflowCanvasGraph,
  layout: readonly WorkflowCanvasLayoutEntry[],
) => WorkflowCanvasProjection = () => ({
  nodes: [],
  positions: new Map(),
  relationships: [],
  drawableConnections: [],
});
