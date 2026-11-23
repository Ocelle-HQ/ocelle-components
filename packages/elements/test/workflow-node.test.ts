import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-workflow-node.ts";
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

afterEach(async () => {
  document.body.replaceChildren();
  await commands.emulateForcedColors("none");
});

describe("ocelle-workflow-node selection in process", () => {
  it("renders one native action with the supplied title, kind, role and ordered outcomes for each step", async () => {
    await mountWorkflowNodes();
    expect(readWorkflowNodes()).toEqual(workflowNodePresentation);
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
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Final security review", pressed: "true", description: expect.stringContaining("Selected") });
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
    expect({ text: text! >= 4.5, borderOutside: borderOutside! >= 3, borderInside: borderInside! >= 3, focus: focus! >= 3, metadata: metadata! >= 4.5 }).toEqual({ text: true, borderOutside: true, borderInside: true, focus: true, metadata: true });
  });
});
