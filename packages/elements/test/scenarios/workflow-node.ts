import { contrastRatio } from "../../../../gates/lib/wcag.ts";

interface Step {
  readonly id: string;
  readonly title: string;
  readonly kind: string;
  readonly role: string;
  readonly outcomes: readonly string[];
}
type NodeFixture = HTMLElement & { step?: Step; activity?: unknown[] };
type WorkflowNode = HTMLElementTagNameMap["ocelle-workflow-node"];

export const workflowNodeText = [
  { label: "Security review", kind: "Approval", role: "Reviewer", outcomes: ["Approved", "Rejected"] },
  { label: "Plan rollout", kind: "Planning", role: "Coordinator", outcomes: ["Plan ready"] },
];

/** Mounts the same frozen host data in the in-process and strict-CSP fixtures. */
export async function mountWorkflowNodes(mode: "references" | "literal" | "plain" = "plain"): Promise<void> {
  const fixture: NodeFixture = document.createElement("main");
  fixture.innerHTML = `
    <button id="before" type="button">Before</button>
    <div data-frame="S">
      <ocelle-workflow-node id="review" node-id="review-12" label="Security review" kind="Approval" accountable-role="Reviewer"></ocelle-workflow-node>
      <ocelle-workflow-node id="planning" node-id="plan-8" label="Plan rollout" kind="Planning" accountable-role="Coordinator"></ocelle-workflow-node>
    </div>
    <button id="after" type="button">After</button>
    <span id="workspace">Release workspace</span>
    <span id="stage">Stage two</span>
    <span id="hint">Review the security findings</span>
    <span id="policy">Policy applies</span>
  `;
  const review = fixture.querySelector("#review") as WorkflowNode;
  const planning = fixture.querySelector("#planning") as WorkflowNode;
  const step = Object.freeze({ id: "review-12", title: "Security review", kind: "Approval", role: "Reviewer", outcomes: Object.freeze(["Approved", "Rejected"]) });
  fixture.step = step;
  review.outcomes = step.outcomes;
  planning.outcomes = ["Plan ready"];
  if (mode !== "plain") {
    review.setAttribute("aria-label", "  Release approvals  ");
    review.setAttribute("aria-current", "step");
    review.setAttribute("aria-describedby", "hint unknown policy");
    review.setAttribute("aria-labelledby", mode === "references" ? "workspace unknown stage" : "unknown");
  }
  const activity: unknown[] = [];
  fixture.activity = activity;
  let nativeClickEntered = false;
  fixture.addEventListener("click", () => { nativeClickEntered = true; }, { capture: true });
  fixture.addEventListener("ocelle-workflow-node-select", (event) => {
    const request = event as CustomEvent<unknown>;
    request.preventDefault();
    activity.push({
      kind: "request",
      target: (request.target as HTMLElement).id,
      detail: request.detail,
      nativeClickEntered,
      bubbles: request.bubbles,
      composed: request.composed,
      cancelable: request.cancelable,
      prevented: request.defaultPrevented,
    });
  });
  fixture.addEventListener("click", (event) => {
    activity.push({
      kind: "click",
      target: (event.target as HTMLElement).id,
      control: (event.composedPath()[0] as Element).localName,
      trusted: event.isTrusted,
      prevented: event.defaultPrevented,
    });
    nativeClickEntered = false;
  });
  document.body.replaceChildren(fixture);
  await Promise.all([review.updateComplete, planning.updateComplete]);
}

/** Null-safe assertions on the scaffold distinguish missing behavior from a locator or setup error. */
export function readWorkflowNodes(): unknown {
  return [...document.querySelectorAll("ocelle-workflow-node")].map((node) => {
    const root = node.shadowRoot;
    const action = root?.querySelector("button");
    return {
      actions: root?.querySelectorAll("button, a, [tabindex]").length ?? 0,
      type: action?.type ?? null,
      tabIndex: action?.tabIndex ?? null,
      text: {
        label: action?.textContent.trim() ?? null,
        kind: root?.querySelector("dd")?.textContent.trim() ?? null,
        role: root?.querySelectorAll("dd")[1]?.textContent.trim() ?? null,
        outcomes: [...(root?.querySelectorAll("li") ?? [])].map((outcome) => outcome.textContent.trim()),
      },
    };
  });
}

export const workflowNodePresentation = workflowNodeText.map((text) => ({ actions: 1, type: "button", tabIndex: 0, text }));

export function readWorkflowActivity(): unknown[] {
  return [...((document.querySelector("main") as NodeFixture).activity ?? [])];
}

export function selectionActivity(target: string, nodeId: string): unknown[] {
  return [
    { kind: "request", target, detail: { nodeId }, nativeClickEntered: true, bubbles: true, composed: true, cancelable: false, prevented: false },
    { kind: "click", target, control: "button", trusted: true, prevented: false },
  ];
}

export async function updateWorkflowNode(change: "rename" | "select" | "deselect" | "blank"): Promise<void> {
  const node = document.querySelector("#review") as WorkflowNode;
  if (change === "rename") node.label = "Final security review";
  if (change === "select") node.selected = true;
  if (change === "deselect") node.selected = false;
  if (change === "blank") node.removeAttribute("node-id");
  await node.updateComplete;
}

export function workflowSelectionState(): unknown {
  const node = document.querySelector("#review") as WorkflowNode;
  const fixture = document.querySelector("main") as NodeFixture;
  return {
    pressed: node.shadowRoot?.querySelector("button")?.getAttribute("aria-pressed") ?? null,
    selected: node.selected,
    reflected: node.hasAttribute("selected"),
    sameOutcomes: node.outcomes === fixture.step?.outcomes,
    data: fixture.step,
  };
}

export const originalWorkflowStep = { id: "review-12", title: "Security review", kind: "Approval", role: "Reviewer", outcomes: ["Approved", "Rejected"] };

export async function replacePressedWorkflowNode(): Promise<void> {
  const before = document.querySelector("#review") as WorkflowNode;
  const after = document.createElement("ocelle-workflow-node");
  after.id = "replacement";
  after.nodeId = "replacement-42";
  after.label = "Security review";
  after.kind = "Approval";
  after.accountableRole = "Reviewer";
  after.outcomes = ["Approved", "Rejected"];
  before.replaceWith(after);
  await after.updateComplete;
}

/** A detached node leaves the sentinel active. On connection, focus goes to its one native action. */
export async function workflowFocusLifecycle(): Promise<unknown> {
  const before = document.getElementById("before") as HTMLButtonElement;
  before.focus();
  const fresh = document.createElement("ocelle-workflow-node");
  fresh.label = "Fresh step";
  fresh.focus({ preventScroll: true });
  const detached = { focused: document.activeElement?.id, rendered: fresh.shadowRoot !== null };
  (document.querySelector("main") as HTMLElement).append(fresh);
  await fresh.updateComplete;
  fresh.focus({ preventScroll: true });
  const rendered = { host: document.activeElement === fresh, control: fresh.shadowRoot?.activeElement?.localName ?? null };
  fresh.remove();
  return { detached, rendered };
}

export const workflowFocusExpected = { detached: { focused: "before", rendered: false }, rendered: { host: true, control: "button" } };

export function readWorkflowFocus(): string {
  const active = document.activeElement;
  return [active?.id, active?.shadowRoot?.activeElement?.localName].filter(Boolean).join(" >> ");
}

export const workflowTabOrder = ["review >> button", "planning >> button", "after", "planning >> button", "review >> button", "before"];

export function readWorkflowRequests(): unknown[] {
  return ((document.querySelector("main") as NodeFixture).activity ?? []).filter((event) => (event as { kind: string }).kind === "request");
}

export function workflowAria(): unknown {
  const action = document.getElementById("review")?.shadowRoot?.querySelector("button");
  return {
    current: action?.getAttribute("aria-current") ?? null,
    pressed: action?.getAttribute("aria-pressed") ?? null,
    nameContext: action?.ariaLabelledByElements?.slice(1).map((target) => target.textContent.trim()) ?? null,
    descriptionContext: action?.ariaDescribedByElements?.slice(1).map((target) => target.textContent.trim()) ?? null,
  };
}

export function workflowPaint(): {
  readonly min: number;
  readonly size: readonly number[];
  readonly colors: readonly (readonly [string, string])[];
  readonly outline: string;
  readonly outlineWidth: number;
} {
  const host = document.querySelector("ocelle-workflow-node") as WorkflowNode;
  const action = host.shadowRoot?.querySelector("button");
  if (action === undefined || action === null) return { min: -1, size: [0, 0], colors: [], outline: "none", outlineWidth: 0 };
  const swatch = document.createElement("span");
  document.body.append(swatch);
  swatch.style.inlineSize = "var(--ocelle-target-min)";
  swatch.style.display = "block";
  const min = swatch.getBoundingClientRect().width;
  swatch.remove();
  const { width, height } = action.getBoundingClientRect();
  const style = getComputedStyle(action);
  const ground = getComputedStyle(host).backgroundColor;
  const metadata = getComputedStyle(host.shadowRoot?.querySelector("dd") as HTMLElement);
  return {
    min,
    size: [width, height],
    colors: [[style.color, style.backgroundColor], [style.borderTopColor, ground], [style.borderTopColor, style.backgroundColor], [style.outlineColor, ground], [metadata.color, ground]],
    outline: style.outlineStyle,
    outlineWidth: parseFloat(style.outlineWidth),
  };
}

export function workflowContrast(pairs: ReturnType<typeof workflowPaint>["colors"]): number[] {
  const hex = (rgb: string): string => "#" + (rgb.match(/\d+/g) ?? []).slice(0, 3).map((value) => Number(value).toString(16).padStart(2, "0")).join("");
  return pairs.map(([foreground, ground]) => contrastRatio(hex(foreground), hex(ground)));
}
