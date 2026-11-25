type WorkflowNode = HTMLElementTagNameMap["ocelle-workflow-node"];

export const longWorkflowStep = {
  label: "Review the complete security evidence for the next privileged deployment",
  kind: "Approval",
  role: "Reviewer accountable for authentication and release readiness",
  outcomes: ["Approved for the staged production rollout", "EscalateToReleaseTeamForIndependentProductionVerification"],
};

export const combinedWorkflowDescription =
  "Kind Approval Role Reviewer accountable for authentication and release readiness Outcomes Approved for the staged production rollout EscalateToReleaseTeamForIndependentProductionVerification Selected Waiting Invalid";

export const workflowDescription = "Kind Approval Role Reviewer Outcomes Approved Rejected";

export async function workflowTabParticipation(mode: "markup" | "exclude" | "restore" | "focus"): Promise<unknown> {
  const node = document.querySelector<WorkflowNode>("#review");
  if (node === null) throw new Error("the review node must be mounted");
  if (mode === "markup") node.setAttribute("selectiontabindex", "-1");
  if (mode === "exclude") Reflect.set(node, "selectionTabIndex", -1);
  if (mode === "restore") Reflect.set(node, "selectionTabIndex", 0);
  await node.updateComplete;
  if (mode === "focus") node.focus({ preventScroll: true });
  return {
    field: Reflect.get(node, "selectionTabIndex") as unknown,
    action: node.shadowRoot?.querySelector("button")?.tabIndex ?? null,
    host: node.tabIndex,
    focused: node.shadowRoot?.activeElement?.localName ?? null,
  };
}

/** Move keyboard focus through the mounted fixture in both directions, reading the actual focused element after each key. */
export async function cycleWorkflowNodes(
  focusStart: () => void | Promise<void>,
  press: (reverse: boolean) => Promise<void>,
  readFocus: () => string | Promise<string>,
  forward: number,
): Promise<string[]> {
  await focusStart();
  const order: string[] = [];
  for (const reverse of [...Array<boolean>(forward).fill(false), ...Array<boolean>(forward).fill(true)]) {
    await press(reverse);
    order.push(await readFocus());
  }
  return order;
}

export async function updateWorkflowStates(mode: "combine" | "clear-waiting" | "clear-invalid" | "other-states" | "defaults"): Promise<unknown> {
  const node = document.querySelector<WorkflowNode>("#review");
  if (node === null) throw new Error("the review node must be mounted");
  if (mode === "combine") {
    node.selected = true;
    node.setAttribute("waiting", "false");
    node.setAttribute("invalid", "");
  }
  if (mode === "clear-waiting") node.removeAttribute("waiting");
  if (mode === "clear-invalid") Reflect.set(node, "invalid", false);
  if (mode === "other-states") {
    node.selected = false;
    Reflect.set(node, "waiting", true);
    Reflect.set(node, "invalid", true);
  }
  await node.updateComplete;
  return {
    waiting: Reflect.get(node, "waiting") as unknown,
    invalid: Reflect.get(node, "invalid") as unknown,
    attributes: [node.hasAttribute("waiting"), node.hasAttribute("invalid")],
  };
}

export async function makeLongWorkflowStep(input: typeof longWorkflowStep): Promise<void> {
  const node = document.querySelector<WorkflowNode>("#review");
  if (node === null) throw new Error("the review node must be mounted");
  node.label = input.label;
  node.kind = input.kind;
  node.accountableRole = input.role;
  node.outcomes = input.outcomes;
  await node.updateComplete;
}

export function workflowStateCues(): {
  readonly labels: readonly string[];
  readonly colors: readonly (readonly [string, string])[];
  readonly fits: boolean;
  readonly titleLines: number;
} {
  const node = document.querySelector("ocelle-workflow-node");
  const button = node?.shadowRoot?.querySelector("button");
  const title = button?.querySelector("#title");
  if (!node || !button || !title) return { labels: [], colors: [], fits: false, titleLines: 0 };
  const builtInDescription = button.ariaDescribedByElements?.[0];
  const stateNames = new Set(["Selected", "Waiting", "Invalid"]);
  const cues = [...(builtInDescription?.querySelectorAll("div, span") ?? [])].filter((entry) => {
    const text = entry.textContent.trim();
    const style = getComputedStyle(entry);
    return stateNames.has(text) && entry.getClientRects().length > 0 && style.visibility === "visible" && Number(style.opacity) > 0;
  });
  const range = document.createRange();
  range.selectNodeContents(title);
  return {
    labels: cues.map((cue) => cue.textContent.trim()),
    colors: cues.map((cue) => [getComputedStyle(cue).color, getComputedStyle(node).backgroundColor] as const),
    fits: node.scrollWidth <= node.clientWidth && button.scrollWidth <= button.clientWidth,
    titleLines: range.getClientRects().length,
  };
}

export async function changeWorkflowContext(mode: "replace-literal" | "clear-literal" | "edit-targets" | "replace-targets" | "restore-targets" | "move-root"): Promise<void> {
  const node = document.querySelector<WorkflowNode>("#review");
  if (node === null) throw new Error("the review node must be mounted");
  if (mode === "replace-literal") {
    node.setAttribute("aria-label", "  Retrospective context  ");
    node.setAttribute("aria-current", "location");
    node.setAttribute("aria-describedby", "policy");
  }
  if (mode === "clear-literal") {
    node.removeAttribute("aria-label");
    node.removeAttribute("aria-current");
    node.removeAttribute("aria-describedby");
  }
  if (mode === "edit-targets") {
    const name = document.getElementById("workspace");
    const description = document.getElementById("hint");
    if (name === null || description === null) throw new Error("host references must be mounted");
    name.textContent = "Edited workspace";
    description.textContent = "Edited description";
  }
  if (mode === "replace-targets") {
    const name = document.createElement("span");
    const description = document.createElement("span");
    name.id = "workspace";
    name.textContent = "Replacement workspace";
    description.id = "hint";
    description.textContent = "Replacement description";
    document.getElementById("workspace")?.replaceWith(name);
    document.getElementById("hint")?.replaceWith(description);
    node.removeAttribute("aria-labelledby");
    node.removeAttribute("aria-describedby");
  }
  if (mode === "restore-targets") {
    node.setAttribute("aria-labelledby", "workspace unknown stage");
    node.setAttribute("aria-describedby", "hint unknown policy");
  }
  if (mode === "move-root") {
    const container = document.createElement("div");
    const shadow = container.attachShadow({ mode: "open" });
    shadow.innerHTML = '<span id="workspace">Shadow workspace</span><span id="stage">Shadow stage</span><span id="hint">Shadow hint</span><span id="policy">Shadow policy</span>';
    document.body.append(container);
    shadow.append(node);
  }
  await node.updateComplete;
}
