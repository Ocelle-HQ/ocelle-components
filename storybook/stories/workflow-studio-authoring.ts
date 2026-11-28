import type {
  WorkflowCanvasConnection,
  WorkflowCanvasMode,
  WorkflowCanvasNode,
  WorkflowCanvasPoint,
} from "../../packages/elements/src/ocelle-workflow-canvas.ts";

type Scenario = "palette" | "unassigned" | "wired" | "previous" | "clipped" | "sole-step";

interface AuthoringStep extends WorkflowCanvasNode {
  readonly reviewer: string;
}

interface AuthoringOptions {
  readonly scenario?: Scenario;
  readonly compact?: boolean;
  readonly inspectorOpen?: boolean;
  readonly mode?: WorkflowCanvasMode;
}

interface AuthoringFixture {
  readonly root: HTMLElement;
  readSemanticSnapshot(): string;
}

const reviewerName = "Avery Example";
const reviewId = "security-review-1";
const collectEvidence: AuthoringStep = {
  id: "collect-evidence",
  label: "Collect evidence",
  kind: "Intake",
  accountableRole: "Coordinator",
  reviewer: "",
  outcomes: [{ id: "collected", label: "Collected" }],
};
const securityReview: AuthoringStep = {
  id: reviewId,
  label: "Security review",
  kind: "Approval",
  accountableRole: "Security reviewer",
  reviewer: "",
  outcomes: [
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
  ],
};
const publishDecision: AuthoringStep = {
  id: "publish-decision",
  label: "Publish decision",
  kind: "Publication",
  accountableRole: "Release lead",
  reviewer: "",
  outcomes: [{ id: "published", label: "Published" }],
};
const requestChanges: AuthoringStep = {
  id: "request-changes",
  label: "Request changes",
  kind: "Revision",
  accountableRole: "Author",
  reviewer: "",
  outcomes: [],
};
const recordDecision: AuthoringStep = {
  id: "record-decision",
  label: "Record decision",
  kind: "Record",
  accountableRole: "Coordinator",
  reviewer: "",
  outcomes: [],
};

const positions: Readonly<Record<string, WorkflowCanvasPoint>> = {
  "collect-evidence": { x: 16, y: 224 },
  [reviewId]: { x: 16, y: 16 },
  "publish-decision": { x: 280, y: 16 },
  "request-changes": { x: 280, y: 136 },
  "record-decision": { x: 280, y: 248 },
};

const publishedEdge: WorkflowCanvasConnection = {
  sourceId: publishDecision.id,
  outcomeId: "published",
  destinationId: recordDecision.id,
};

function startingSteps(scenario: Scenario): readonly AuthoringStep[] {
  if (scenario === "palette") return [collectEvidence, publishDecision, requestChanges, recordDecision];
  const review = { ...securityReview, reviewer: scenario === "unassigned" ? "" : reviewerName };
  if (scenario === "sole-step") return [review];
  if (scenario === "previous") return [collectEvidence, requestChanges, recordDecision, publishDecision, review];
  return [collectEvidence, review, publishDecision, requestChanges, recordDecision];
}

function startingConnections(scenario: Scenario): readonly WorkflowCanvasConnection[] {
  if (scenario === "sole-step") return [];
  if (scenario === "palette" || scenario === "unassigned") return [publishedEdge];
  return [
    { sourceId: collectEvidence.id, outcomeId: "collected", destinationId: reviewId },
    { sourceId: reviewId, outcomeId: "approved", destinationId: publishDecision.id },
    { sourceId: reviewId, outcomeId: "rejected", destinationId: requestChanges.id },
    publishedEdge,
  ];
}

function action(label: string): HTMLElementTagNameMap["ocelle-button"] {
  const button = document.createElement("ocelle-button");
  button.textContent = label;
  return button;
}

function inspector(reviewer: string): HTMLElement {
  const fields = document.createElement("section");
  fields.dataset.inspectorFields = "";
  fields.setAttribute("aria-label", "Reviewer details");
  const field = document.createElement("ocelle-form-select");
  field.label = "Accountable reviewer";
  field.name = "reviewer";
  const unassigned = document.createElement("option");
  unassigned.value = "";
  unassigned.textContent = "Unassigned";
  const named = document.createElement("option");
  named.value = reviewerName;
  named.textContent = reviewerName;
  field.append(unassigned, named);
  field.value = reviewer;
  fields.append(field);
  return fields;
}

/** Renders an independent, fictional workflow fixture. */
export function renderWorkflowStudioAuthoring({
  scenario = "palette",
  compact = false,
  inspectorOpen = false,
  mode = "author",
}: AuthoringOptions = {}): AuthoringFixture {
  const steps = startingSteps(scenario);
  const connections = startingConnections(scenario);
  const selected = steps.find(({ id }) => id === reviewId);
  const root = document.createElement("article");
  root.dataset.story = "workflow-studio-authoring";
  root.toggleAttribute("data-compact", compact);
  root.setAttribute("aria-label", "Workflow authoring");

  const commands = document.createElement("div");
  commands.dataset.workflowActions = "";
  if (mode === "author") {
    const add = action("Add step");
    add.dataset.addStep = "";
    commands.append(add);
  }
  const inspect = action(mode === "author" ? "Inspect workflow" : "Edit workflow");
  inspect.dataset.inspectWorkflow = "";
  commands.append(inspect);

  const selector = document.createElement("ocelle-form-select");
  selector.dataset.stepSelector = "";
  selector.label = "Select workflow step";
  for (const step of steps) {
    const option = document.createElement("option");
    option.value = step.id;
    option.textContent = step.label;
    selector.append(option);
  }
  selector.value = selected?.id ?? steps[0]?.id ?? "";
  commands.append(selector);

  const layout = document.createElement("ocelle-list-detail");
  layout.narrow = compact;
  layout.detailOpen = true;
  const palette = document.createElement("section");
  palette.slot = "list";
  palette.dataset.workflowPalette = "";
  palette.setAttribute("aria-label", "Step palette");
  if (mode === "author") {
    const entry = document.createElement("ocelle-action-row");
    entry.rowId = "security-review";
    entry.textContent = "Add Security review";
    palette.append(entry);
  }

  const detail = document.createElement("section");
  detail.dataset.workflowDetail = "";
  detail.setAttribute("aria-label", "Workflow graph");
  const stepActions = document.createElement("div");
  stepActions.dataset.workflowActions = "";
  stepActions.setAttribute("role", "group");
  stepActions.setAttribute("aria-label", "Workflow step actions");
  for (const step of steps) {
    if (scenario === "clipped" && step.id !== reviewId) continue;
    const select = action(`Select ${step.label}`);
    select.dataset.selectStep = step.id;
    stepActions.append(select);
  }
  detail.append(stepActions);

  if (selected !== undefined) {
    const status = document.createElement("p");
    status.dataset.reviewerStatus = "";
    const indicator = document.createElement("ocelle-status-indicator");
    indicator.tone = selected.reviewer === "" ? "warning" : "success";
    status.append(indicator,
      selected.reviewer === "" ? "Reviewer unassigned" : "Reviewer assigned");
    detail.append(status);

    if (selected.reviewer === "") {
      const finding = action("Missing reviewer for Security review");
      finding.dataset.finding = "";
      stepActions.append(finding);
    }
    const openInspector = action("Open reviewer inspector");
    openInspector.dataset.openInspector = "";
    stepActions.append(openInspector);
    if (mode === "author") {
      const remove = action("Remove Security review");
      remove.dataset.removeStep = selected.id;
      stepActions.append(remove);
    }
  }

  const canvas = document.createElement("ocelle-workflow-canvas");
  canvas.dataset.workflowCanvas = "";
  canvas.mode = mode;
  canvas.graph = {
    nodes: steps.map(({ id, label, kind, accountableRole, reviewer, outcomes }) => ({
      id,
      label,
      kind,
      accountableRole,
      outcomes,
      invalid: id === reviewId && reviewer === "",
    })),
    connections,
  };
  canvas.layout = steps.flatMap(({ id }) => {
    const position = positions[id];
    if (position === undefined) return [];
    const x = scenario === "clipped" && id !== reviewId ? position.x + 1_000 : position.x;
    return [{ nodeId: id, x, y: position.y }];
  });
  canvas.selectedNodeId = selected?.id ?? null;
  const notice = document.createElement("ocelle-notice");
  notice.dataset.editNotice = "";
  notice.tone = "warning";
  notice.hidden = true;
  detail.append(canvas, notice);
  layout.append(palette, detail);
  root.append(commands, layout);

  if (selected !== undefined) {
    const fields = inspector(selected.reviewer);
    if (compact) {
      const drawer = document.createElement("ocelle-drawer");
      drawer.dataset.workflowDrawer = "";
      drawer.label = "Reviewer inspector";
      drawer.append(fields);
      drawer.open = inspectorOpen;
      root.append(drawer);
    } else {
      fields.slot = "inspector";
      layout.append(fields);
    }
  }

  return {
    root,
    readSemanticSnapshot: () => JSON.stringify({ steps, connections }),
  };
}
