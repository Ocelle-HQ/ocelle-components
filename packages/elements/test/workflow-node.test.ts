import { afterEach, describe, expect as vitestExpect, it } from "vitest";
import type { Assertion } from "vitest";
import { commands } from "vitest/browser";
import "../src/index.ts";
import { inProcessDriver } from "./in-process.ts";
import {
  mountWorkflowNodes,
  originalWorkflowStep,
  readWorkflowActivity,
  readWorkflowFocus,
  readWorkflowNodes,
  readWorkflowRequests,
  replacePressedWorkflowNode,
  selectionActivity,
  updateWorkflowNode,
  workflowAria,
  workflowContrast,
  workflowFocusExpected,
  workflowFocusLifecycle,
  workflowNodePresentation,
  workflowPaint,
  workflowSelectionState,
  workflowTabOrder,
} from "./scenarios/workflow-node.ts";

const driver = inProcessDriver();
const inner = { inner: "button" };
// Vitest's asymmetric matcher is untyped. Narrow that method without changing the recorded assertion.
const expect: { (value: unknown): Assertion; any(type: NumberConstructor): unknown } = vitestExpect;

afterEach(async () => {
  document.body.replaceChildren();
  await commands.emulateForcedColors("none");
});

describe("ocelle-workflow-node selection in process", () => {
  it("renders one native action with the supplied title, kind, role and ordered outcomes for each step", async () => {
    await mountWorkflowNodes();
    expect(readWorkflowNodes()).toEqual(workflowNodePresentation);
  });

  it("reads and clears label and kind markup and keeps property updates local", async () => {
    const node = document.createElement("ocelle-workflow-node");
    expect([node.label, node.kind, node.hasAttribute("label"), node.hasAttribute("kind")]).toEqual(["", "", false, false]);

    node.setAttribute("label", "Security review");
    node.setAttribute("kind", "Approval");
    document.body.append(node);
    await node.updateComplete;
    const rendered = () => [node.shadowRoot?.querySelector("button")?.textContent.trim(), node.shadowRoot?.querySelector("dd")?.textContent.trim()];
    expect(rendered()).toEqual(["Security review", "Approval"]);

    node.label = "Plan rollout";
    node.kind = "Planning";
    await node.updateComplete;
    expect(rendered()).toEqual(["Plan rollout", "Planning"]);
    expect([node.getAttribute("label"), node.getAttribute("kind")]).toEqual(["Security review", "Approval"]);

    node.removeAttribute("label");
    node.removeAttribute("kind");
    await node.updateComplete;
    expect(rendered()).toEqual(["", ""]);
  });

  it("keeps outcome labels property-only before render and after markup edits", async () => {
    const node = document.createElement("ocelle-workflow-node");
    const outcomes = Object.freeze(["Approved", "Escalate"]);
    expect(node.outcomes).toEqual([]);

    node.setAttribute("outcomes", '["Ignored initial markup"]');
    expect(node.outcomes).toEqual([]);
    node.outcomes = outcomes;
    node.setAttribute("outcomes", '["Ignored replacement markup"]');
    expect(node.outcomes).toBe(outcomes);
    node.removeAttribute("outcomes");
    expect(node.outcomes).toBe(outcomes);

    node.setAttribute("outcomes", '["Ignored rendered markup"]');
    expect(node.outcomes).toBe(outcomes);
    document.body.append(node);
    await node.updateComplete;
    const rendered = [...(node.shadowRoot?.querySelectorAll("li") ?? [])].map((item) => item.textContent);
    expect(rendered).toEqual(outcomes);
    expect(node.getAttribute("outcomes")).toBe('["Ignored rendered markup"]');
  });

  it.each([
    { mode: "plain", name: "Security review", contexts: [], description: "Kind Approval Role Reviewer Outcomes Approved Rejected", descriptionContexts: [], current: null },
    { mode: "literal", name: "Security review Release approvals", contexts: ["Release approvals"], description: "Kind Approval Role Reviewer Outcomes Approved Rejected Review the security findings Policy applies", descriptionContexts: ["Review the security findings", "Policy applies"], current: "step" },
    { mode: "references", name: "Security review Release workspace Stage two", contexts: ["Release workspace", "Stage two"], description: "Kind Approval Role Reviewer Outcomes Approved Rejected Review the security findings Policy applies", descriptionContexts: ["Review the security findings", "Policy applies"], current: "step" },
  ] as const)("exposes the full visible title and initial $mode ARIA context on the native action", async ({ mode, name, contexts, description, descriptionContexts, current }) => {
    await mountWorkflowNodes(mode);
    expect(workflowAria()).toEqual({ current, pressed: "false", nameContext: contexts, descriptionContext: descriptionContexts });
    expect(await commands.axState("review", "button")).toMatchObject({ role: "button", name, description, pressed: "false" });
  });

  it("requests the host's stable ID once per native activation and preserves selection, event order and source data", async () => {
    await mountWorkflowNodes();
    const original = { pressed: "false", selected: false, reflected: false, sameOutcomes: true, data: originalWorkflowStep };
    expect(workflowSelectionState()).toEqual(original);
    await commands.pointer("click", "review", inner);
    const request = selectionActivity("review", "review-12");
    expect(readWorkflowActivity()).toEqual(request);
    await commands.press("Enter");
    expect(readWorkflowActivity()).toEqual([...request, ...request]);
    await commands.press("Space");
    expect(readWorkflowActivity()).toEqual([...request, ...request, ...request]);
    expect(workflowSelectionState()).toEqual(original);

    await updateWorkflowNode("rename");
    await updateWorkflowNode("select");
    expect(readWorkflowActivity()).toEqual([...request, ...request, ...request]);
    const renamed = await commands.axState("review", "button");
    expect(renamed).toMatchObject({ name: "Final security review", pressed: "true" });
    expect(renamed.description).toContain("Selected");
    expect(workflowSelectionState()).toEqual({ ...original, pressed: "true", selected: true, reflected: true });
    await commands.pointer("click", "review", inner);
    expect(readWorkflowActivity()).toEqual([...request, ...request, ...request, ...request]);
    expect(workflowSelectionState()).toEqual({ ...original, pressed: "true", selected: true, reflected: true });

    await updateWorkflowNode("deselect");
    await updateWorkflowNode("blank");
    await commands.pointer("click", "review", inner);
    expect(readWorkflowActivity()).toEqual([...request, ...request, ...request, ...request, request[1]]);
    expect(await commands.axState("review", "button")).toMatchObject({ pressed: "false", description: "Kind Approval Role Reviewer Outcomes Approved Rejected" });
    expect(workflowSelectionState()).toEqual(original);
  });

  it("leaves focus in place before render and makes each rendered action one forward and reverse Tab stop", async () => {
    await mountWorkflowNodes();
    expect(await workflowFocusLifecycle()).toEqual(workflowFocusExpected);
    document.getElementById("before")?.focus();
    const order: string[] = [];
    for (const key of ["Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
      await commands.press(key === "Shift+Tab" ? "Tab" : key, key === "Shift+Tab" ? ["Shift"] : []);
      order.push(readWorkflowFocus());
    }
    expect(order).toEqual(workflowTabOrder);
    expect(readWorkflowActivity()).toEqual([]);
  });

  it("discards a pointer gesture across keyed mounts and accepts a fresh activation by the replacement ID", async () => {
    await mountWorkflowNodes();
    expect(readWorkflowNodes()).toEqual(workflowNodePresentation);
    await commands.pointer("down", "review", inner);
    await replacePressedWorkflowNode();
    await commands.pointer("up", "replacement", inner);
    expect(readWorkflowRequests()).toEqual([]);
    const interrupted = readWorkflowActivity();
    await commands.pointer("click", "replacement", inner);
    expect(readWorkflowActivity()).toEqual([...interrupted, ...selectionActivity("replacement", "replacement-42")]);
  });

  it.each(["light", "dark", "forced"] as const)("keeps the actual native target large and the %s boundary, text and focus visible", async (mode) => {
    await driver.mount("");
    await mountWorkflowNodes();
    document.documentElement.dataset.theme = mode === "dark" ? "dark" : "light";
    await commands.emulateForcedColors(mode === "forced" ? "active" : "none");
    document.getElementById("before")?.focus();
    await commands.press("Tab");
    const paint = workflowPaint();
    expect(paint).toMatchObject({ min: expect.any(Number), outline: "solid" });
    expect(paint.min).toBeGreaterThan(0);
    expect(Math.min(...paint.size)).toBeGreaterThanOrEqual(paint.min);
    expect(paint.outlineWidth).toBeGreaterThan(0);
    const [text, borderOutside, borderInside, focus, metadata] = workflowContrast(paint.colors);
    expect({ text: (text ?? 0) >= 4.5, borderOutside: (borderOutside ?? 0) >= 3, borderInside: (borderInside ?? 0) >= 3, focus: (focus ?? 0) >= 3, metadata: (metadata ?? 0) >= 4.5 }).toEqual({ text: true, borderOutside: true, borderInside: true, focus: true, metadata: true });
  });
});
