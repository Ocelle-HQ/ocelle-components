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

export function projectWorkflowCanvasGraph(
  graph: WorkflowCanvasGraph,
  layout: readonly WorkflowCanvasLayoutEntry[],
): WorkflowCanvasProjection {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const positions = new Map<string, WorkflowCanvasPoint>();
  for (const { nodeId, x, y } of layout) {
    if (nodesById.has(nodeId) && Number.isFinite(x) && Number.isFinite(y)) {
      positions.set(nodeId, { x, y });
    }
  }

  const relationships: WorkflowCanvasRelationship[] = [];
  for (const { sourceId, outcomeId, destinationId } of graph.connections) {
    const source = nodesById.get(sourceId);
    const destination = nodesById.get(destinationId);
    if (source === undefined || destination === undefined) continue;
    const outcome = source.outcomes.find(({ id }) => id === outcomeId);
    if (outcome !== undefined) relationships.push({ source, outcome, destination });
  }

  const drawableConnections = relationships.filter(
    ({ source, destination }) => positions.has(source.id) && positions.has(destination.id),
  );
  return { nodes: graph.nodes, positions, relationships, drawableConnections };
}
