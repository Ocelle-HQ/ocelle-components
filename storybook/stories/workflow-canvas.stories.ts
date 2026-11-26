import type { Meta, StoryObj } from "@storybook/html-vite";
import "../../packages/elements/src/ocelle-workflow-canvas.ts";
import type {
  OcelleWorkflowCanvas,
  WorkflowCanvasConnectionRequestDetail,
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasPositionRequestDetail,
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

export const Arranging: StoryObj = {
  render: () => {
    const frame = workflow(false);
    const canvas = frame.querySelector("ocelle-workflow-canvas");
    if (canvas === null) throw new Error("The arranging fixture requires a workflow canvas");
    canvas.mode = "author";
    canvas.viewport = { x: 18, y: 20, scale: 0.8 };
    canvas.layout = [
      { nodeId: review.id, x: 36, y: 52 },
      { nodeId: publish.id, x: 490, y: 10 },
      { nodeId: revise.id, x: 490, y: 146 },
    ];
    canvas.addEventListener("ocelle-workflow-canvas-position-request", (event) => {
      const { nodeId, position } = (event as CustomEvent<WorkflowCanvasPositionRequestDetail>).detail;
      canvas.layout = canvas.layout.map((entry) => entry.nodeId === nodeId ? { nodeId, ...position } : entry);
    });
    return frame;
  },
};

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

function connectionFixture(accept: boolean): HTMLElement {
  const frame = workflow(false);
  const canvas = frame.querySelector("ocelle-workflow-canvas");
  if (canvas === null) throw new Error("The connection fixture requires a workflow canvas");
  canvas.mode = "author";
  canvas.layout = [
    { nodeId: review.id, x: 36, y: 46 },
    { nodeId: publish.id, x: 345, y: 12 },
    { nodeId: revise.id, x: 345, y: 148 },
  ];
  if (!accept) canvas.graph = { ...graph, connections: [] };
  canvas.addEventListener("ocelle-workflow-canvas-connection-request", (event) => {
    if (!accept) {
      frame.dataset.connectionDeclined = "true";
      return;
    }
    const { operation, sourceId, outcomeId, destinationId } = (event as CustomEvent<WorkflowCanvasConnectionRequestDetail>).detail;
    const rest = canvas.graph.connections.filter((edge) => edge.sourceId !== sourceId || edge.outcomeId !== outcomeId);
    canvas.graph = { ...canvas.graph, connections: operation === "disconnect" ? rest : [...rest, { sourceId, outcomeId, destinationId }] };
  });
  return frame;
}

async function openNamedOutcome(canvasElement: HTMLElement, reject: boolean): Promise<void> {
  const canvas = canvasElement.querySelector("ocelle-workflow-canvas");
  if (canvas === null) throw new Error("The connection fixture requires a workflow canvas");
  await canvas.updateComplete;
  const root = canvas.shadowRoot;
  if (root === null) throw new Error("The connection fixture requires rendered controls");
  const press = async (selector: string) => {
    const control = root.querySelector<HTMLElement>(selector);
    if (control === null) throw new Error(`The connection fixture requires ${selector}`);
    control.click();
    await canvas.updateComplete;
  };
  await press("summary");
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => { resolve(); })));
  const selectOutcome = async () => {
    await press("button.connection-trigger");
    await press('button[data-source-id="review"]');
    await press('button[data-outcome-id="approved"]');
  };
  await selectOutcome();
  if (reject) {
    await press('button[data-destination-id="publish"]');
    const apply = [...root.querySelectorAll("button")].find((button) => button.textContent.trim() === "Apply connection");
    if (apply === undefined) throw new Error("The connection fixture requires an Apply connection button");
    apply.click();
    await canvas.updateComplete;
    await selectOutcome();
  }
}

export const NamedConnections: StoryObj = {
  name: "Named connections",
  render: () => connectionFixture(true),
  play: async ({ canvasElement }) => { await openNamedOutcome(canvasElement, false); },
};

export const RejectedConnection: StoryObj = {
  name: "Rejected connection",
  render: () => connectionFixture(false),
  play: async ({ canvasElement }) => { await openNamedOutcome(canvasElement, true); },
};

function inspectionFixture(configure: (canvas: OcelleWorkflowCanvas) => void, narrow = false): HTMLElement {
  const frame = workflow(narrow);
  const canvas = frame.querySelector("ocelle-workflow-canvas");
  if (canvas === null) throw new Error("The inspection fixture requires a workflow canvas");
  canvas.mode = "read-only";
  configure(canvas);
  return frame;
}

async function inspectionReady(canvasElement: HTMLElement): Promise<OcelleWorkflowCanvas> {
  const canvas = canvasElement.querySelector("ocelle-workflow-canvas");
  if (canvas === null) throw new Error("The inspection fixture requires a workflow canvas");
  await canvas.updateComplete;
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => { resolve(); })));
  return canvas;
}

export const ReadOnly: StoryObj = {
  name: "Read only",
  render: () => inspectionFixture((canvas) => {
    canvas.graph = { nodes: graph.nodes, connections: [
      { sourceId: review.id, outcomeId: "approved", destinationId: revise.id },
      { sourceId: review.id, outcomeId: "rejected", destinationId: publish.id },
    ] };
    canvas.layout = [{ nodeId: review.id, x: 36, y: 20 }, { nodeId: revise.id, x: 1040, y: 50 }];
  }),
};

export const Empty: StoryObj = {
  render: () => inspectionFixture((canvas) => {
    canvas.graph = { nodes: [], connections: [] };
    canvas.layout = [];
    canvas.selectedNodeId = null;
  }),
  play: async ({ canvasElement }) => {
    const canvas = await inspectionReady(canvasElement);
    canvas.shadowRoot?.querySelector("select")?.focus({ preventScroll: true });
  },
};

export const CombinedState: StoryObj = {
  name: "Combined state",
  render: () => inspectionFixture((canvas) => {
    const label = "Review the completed rollout and its approval evidence";
    const outcome = "Ready for the next stage of the publication process";
    canvas.graph = {
      ...graph,
      nodes: [
        { ...review, label, invalid: true, outcomes: review.outcomes.map((entry) => ({ ...entry, label: outcome })) },
        { ...publish, label },
        revise,
      ],
    };
    canvas.layout = [{ nodeId: review.id, x: 20, y: 12 }, ...narrowLayout.slice(1)];
  }, true),
  play: async ({ canvasElement }) => {
    const canvas = await inspectionReady(canvasElement);
    const root = canvas.shadowRoot;
    if (root === null) throw new Error("The combined state fixture requires rendered controls");
    const tall = new CSSStyleSheet();
    tall.replaceSync(":host { block-size: calc(14 * var(--ocelle-target-min)); }");
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, tall];
    await inspectionReady(canvasElement);
    root.querySelector("ocelle-workflow-node")?.focus({ preventScroll: true });
  },
};

export const ReducedMotion: StoryObj = {
  name: "Reduced motion",
  render: () => inspectionFixture((canvas) => {
    canvas.layout = [
      { nodeId: review.id, x: 36, y: 30 }, { nodeId: publish.id, x: 340, y: 22 }, { nodeId: revise.id, x: 1060, y: 30 },
    ];
  }),
  play: async ({ canvasElement }) => {
    const canvas = await inspectionReady(canvasElement);
    const follow = [...canvas.shadowRoot?.querySelectorAll("button") ?? []].find((button) => button.ariaLabel?.startsWith("Follow Revise "));
    if (follow === undefined || follow.disabled) throw new Error("The reduced motion fixture requires an enabled Follow Revise action");
    follow.click();
    await inspectionReady(canvasElement);
  },
};
