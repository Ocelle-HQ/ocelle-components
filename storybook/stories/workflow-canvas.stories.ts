import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-workflow-canvas.ts";
import type {
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasViewportRequestDetail,
} from "../../packages/elements/src/ocelle-workflow-canvas.ts";

const meta: Meta = { title: "Elements/ocelle-workflow-canvas" };
export default meta;

const review = {
  id: "review",
  label: "Initial review",
  kind: "Approval",
  accountableRole: "Reviewer",
  outcomes: [
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Changes requested" },
  ],
};

const publish = {
  id: "publish",
  label: "Publish",
  kind: "Publication",
  accountableRole: "Release lead",
  outcomes: [],
};

const revise = {
  id: "revise",
  label: "Revise",
  kind: "Planning",
  accountableRole: "Author",
  outcomes: [],
};

const graph: WorkflowCanvasGraph = {
  nodes: [review, publish, revise],
  connections: [
    { sourceId: review.id, outcomeId: "approved", destinationId: publish.id },
    { sourceId: review.id, outcomeId: "rejected", destinationId: revise.id },
  ],
};

const branchingLayout: readonly WorkflowCanvasLayoutEntry[] = [
  { nodeId: review.id, x: 36, y: 72 },
  { nodeId: publish.id, x: 556, y: 22 },
  { nodeId: revise.id, x: 556, y: 152 },
];

const narrowLayout: readonly WorkflowCanvasLayoutEntry[] = [
  { nodeId: review.id, x: 36, y: 20 },
  { nodeId: publish.id, x: 360, y: 20 },
  { nodeId: revise.id, x: 672, y: 20 },
];

function workflow(narrow: boolean): HTMLElement {
  const frame = document.createElement("div");
  frame.dataset.frame = narrow ? "S" : "W";
  const canvas = document.createElement("ocelle-workflow-canvas");
  canvas.graph = narrow ? {
    ...graph,
    nodes: [
      { ...review, label: "Review the rollout evidence", waiting: true, invalid: true },
      publish,
      revise,
    ],
  } : graph;
  canvas.layout = narrow ? narrowLayout : branchingLayout;
  canvas.selectedNodeId = review.id;
  canvas.addEventListener("ocelle-workflow-node-select", (event) => {
    canvas.selectedNodeId = (event as CustomEvent<{ nodeId: string }>).detail.nodeId;
  });
  canvas.addEventListener("ocelle-workflow-canvas-viewport-request", (event) => {
    canvas.viewport = (event as CustomEvent<WorkflowCanvasViewportRequestDetail>).detail.viewport;
  });
  frame.append(canvas);
  return frame;
}

export const Branching: StoryObj = { render: () => workflow(false) };

export const NarrowFocus: StoryObj = {
  name: "Narrow focus",
  render: () => workflow(true),
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector("ocelle-workflow-canvas");
    if (canvas === null) return;
    await canvas.updateComplete;
    await new Promise((resolve) => {
      requestAnimationFrame(() => { requestAnimationFrame(resolve); });
    });
    const reviewAction = canvas.shadowRoot?.querySelector("ocelle-workflow-node");
    reviewAction?.focus({ preventScroll: true });
  },
};
