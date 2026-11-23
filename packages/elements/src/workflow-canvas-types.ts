export type WorkflowCanvasMode = "author" | "read-only";

export interface WorkflowCanvasOutcome {
  readonly id: string;
  readonly label: string;
}

export interface WorkflowCanvasNode {
  readonly id: string;
  readonly label: string;
  readonly kind: string;
  readonly accountableRole: string;
  readonly outcomes: readonly WorkflowCanvasOutcome[];
  readonly waiting?: boolean;
  readonly invalid?: boolean;
  readonly status?: string;
}

export interface WorkflowCanvasConnection {
  readonly sourceId: string;
  readonly outcomeId: string;
  readonly destinationId: string;
}

export interface WorkflowCanvasGraph {
  readonly nodes: readonly WorkflowCanvasNode[];
  readonly connections: readonly WorkflowCanvasConnection[];
}

export interface WorkflowCanvasPoint {
  readonly x: number;
  readonly y: number;
}

export interface WorkflowCanvasLayoutEntry extends WorkflowCanvasPoint {
  readonly nodeId: string;
}

export interface WorkflowCanvasViewport extends WorkflowCanvasPoint {
  readonly scale: number;
}

export interface WorkflowCanvasViewportRequestDetail {
  readonly viewport: WorkflowCanvasViewport;
}

export interface WorkflowCanvasPositionRequestDetail {
  readonly nodeId: string;
  readonly position: WorkflowCanvasPoint;
}

export interface WorkflowCanvasConnectionRequestDetail extends WorkflowCanvasConnection {
  readonly operation: "connect" | "reassign" | "disconnect";
}
