import { LitElement } from "lit";
import type {
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasMode,
  WorkflowCanvasViewport,
} from "./workflow-canvas-types.ts";

export class OcelleWorkflowCanvas extends LitElement {
  declare graph: WorkflowCanvasGraph;
  declare layout: readonly WorkflowCanvasLayoutEntry[];
  declare viewport: WorkflowCanvasViewport;
  declare selectedNodeId: string | null;
  declare mode: WorkflowCanvasMode;
}
