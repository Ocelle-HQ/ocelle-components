import { afterEach, beforeEach, describe, expect as vitestExpect, it } from "vitest";
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
import {
  changeWorkflowContext,
  combinedWorkflowDescription,
  cycleWorkflowNodes,
  longWorkflowStep,
  makeLongWorkflowStep,
  updateWorkflowStates,
  workflowDescription,
  workflowStateCues,
  workflowTabParticipation,
} from "./scenarios/workflow-node-navigation.ts";
import { changeRecordedStatus, editedStatus, recordedStatus, recordedStep, replacementStatus } from "./scenarios/workflow-node-inspection.ts";

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

describe("ocelle-workflow-node navigation and accessible context in process", () => {
  beforeEach(() => {
    const sheets = [...document.adoptedStyleSheets];
    const theme = document.documentElement.dataset.theme;
    return () => {
      document.adoptedStyleSheets = sheets;
      if (theme === undefined) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = theme;
    };
  });

  it("keeps one native action available while the host excludes and restores it in both Tab directions", async () => {
    await mountWorkflowNodes();
    const order = (steps: number) => cycleWorkflowNodes(
      () => { document.getElementById("before")?.focus(); },
      (reverse) => commands.press("Tab", reverse ? ["Shift"] : []),
      readWorkflowFocus,
      steps,
    );
    const original = document.getElementById("review")?.shadowRoot?.querySelector("button");
    expect(await order(3)).toEqual(workflowTabOrder);
    expect(await workflowTabParticipation("markup")).toEqual({ field: 0, action: 0, host: -1, focused: null });
    expect(await workflowTabParticipation("exclude")).toEqual({ field: -1, action: -1, host: -1, focused: null });
    expect(await order(2)).toEqual(["planning >> button", "after", "planning >> button", "before"]);
    expect(await workflowTabParticipation("focus")).toEqual({ field: -1, action: -1, host: -1, focused: "button" });
    expect(readWorkflowActivity()).toEqual([]);

    const activity = selectionActivity("review", "review-12");
    await commands.press("Enter");
    expect(readWorkflowActivity()).toEqual(activity);
    await commands.press("Space");
    expect(readWorkflowActivity()).toEqual([...activity, ...activity]);
    expect(await workflowTabParticipation("restore")).toEqual({ field: 0, action: 0, host: -1, focused: "button" });
    expect(document.getElementById("review")?.shadowRoot?.querySelector("button")).toBe(original);
    expect(await order(3)).toEqual(workflowTabOrder);
    expect(readWorkflowActivity()).toEqual([...activity, ...activity]);
  });

  it.each(["light", "dark", "forced"] as const)("exposes the combined states and full narrow labels with %s focus and contrast", async (mode) => {
    await driver.mount("");
    await mountWorkflowNodes();
    document.documentElement.dataset.theme = mode === "dark" ? "dark" : "light";
    await commands.emulateForcedColors(mode === "forced" ? "active" : "none");
    expect(await updateWorkflowStates("defaults")).toEqual({ waiting: false, invalid: false, attributes: [false, false] });
    await makeLongWorkflowStep(longWorkflowStep);
    expect(await updateWorkflowStates("combine")).toEqual({ waiting: true, invalid: true, attributes: [true, true] });
    document.getElementById("before")?.focus();
    await commands.press("Tab");

    const cues = workflowStateCues();
    expect({ labels: cues.labels, fits: cues.fits }).toEqual({ labels: ["Selected", "Waiting", "Invalid"], fits: true });
    expect(cues.titleLines).toBeGreaterThan(1);
    expect(readWorkflowFocus()).toBe("review >> button");
    expect(await commands.axState("review", "button")).toMatchObject({ role: "button", name: longWorkflowStep.label, description: combinedWorkflowDescription, pressed: "true" });
    const paint = workflowPaint();
    expect(paint.outline).toBe("solid");
    expect(paint.outlineWidth).toBeGreaterThan(0);
    expect(paint.min).toBeGreaterThan(0);
    expect(Math.min(...paint.size)).toBeGreaterThanOrEqual(paint.min);
    const thresholds = [4.5, 3, 3, 3, 4.5, 4.5, 4.5, 4.5];
    const contrasts = workflowContrast([...paint.colors, ...cues.colors]);
    expect(thresholds.map((threshold, at) => (contrasts[at] ?? 0) >= threshold)).toEqual(thresholds.map(() => true));

    expect(await updateWorkflowStates("clear-waiting")).toEqual({ waiting: false, invalid: true, attributes: [false, true] });
    expect(workflowStateCues().labels).toEqual(["Selected", "Invalid"]);
    expect(await updateWorkflowStates("clear-invalid")).toEqual({ waiting: false, invalid: false, attributes: [false, false] });
    expect(workflowStateCues().labels).toEqual(["Selected"]);
    expect(await updateWorkflowStates("other-states")).toEqual({ waiting: true, invalid: true, attributes: [true, true] });
    expect(workflowStateCues().labels).toEqual(["Waiting", "Invalid"]);
    expect(await commands.axState("review", "button")).toMatchObject({ pressed: "false", description: combinedWorkflowDescription.replace(" Selected", "") });
    expect(readWorkflowActivity()).toEqual([]);
  });

  it("updates and clears literal name, description and current-step context while retaining focused built-in information", async () => {
    await mountWorkflowNodes("literal");
    await updateWorkflowNode("select");
    await workflowTabParticipation("focus");
    await changeWorkflowContext("replace-literal");
    expect(workflowAria()).toMatchObject({ current: "location", nameContext: ["Retrospective context"], descriptionContext: ["Policy applies"] });
    expect(await commands.axState("review", "button")).toMatchObject({
      name: "Security review Retrospective context",
      description: `${workflowDescription} Selected Policy applies`,
      pressed: "true",
    });
    await changeWorkflowContext("clear-literal");
    expect(workflowAria()).toMatchObject({ current: null, nameContext: [], descriptionContext: [] });
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} Selected`, pressed: "true" });
    expect(readWorkflowFocus()).toBe("review >> button");
    expect(readWorkflowActivity()).toEqual([]);
  });

  it("reads live reference text and refreshes same-ID replacements through the host attributes", async () => {
    await mountWorkflowNodes("references");
    await updateWorkflowNode("select");
    const description = `${workflowDescription} Selected`;
    await changeWorkflowContext("edit-targets");
    expect(await commands.axState("review", "button")).toMatchObject({
      name: "Security review Edited workspace Stage two",
      description: `${description} Edited description Policy applies`,
    });
    await changeWorkflowContext("replace-targets");
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review Release approvals", description });
    await changeWorkflowContext("restore-targets");
    expect(await commands.axState("review", "button")).toMatchObject({
      name: "Security review Replacement workspace Stage two",
      description: `${description} Replacement description Policy applies`,
    });
    expect(readWorkflowActivity()).toEqual([]);
  });

  it("recomputes the accessible references in the host's shadow root on reconnection", async () => {
    await mountWorkflowNodes("references");
    await changeWorkflowContext("move-root");
    expect(await commands.axState("review", "button")).toMatchObject({
      name: "Security review Shadow workspace Shadow stage",
      description: `${workflowDescription} Shadow hint Shadow policy`,
    });
  });

  it.each([
    {
      attribute: "aria-label",
      initial: "Release approvals",
      replacement: "Retrospective context",
      added: { name: "Security review Release approvals" },
      changed: { name: "Security review Retrospective context" },
    },
    {
      attribute: "aria-labelledby",
      initial: "workspace stage",
      replacement: "stage unknown",
      added: { name: "Security review Release workspace Stage two" },
      changed: { name: "Security review Stage two" },
    },
    {
      attribute: "aria-describedby",
      initial: "hint policy",
      replacement: "policy",
      added: { description: `${workflowDescription} Review the security findings Policy applies` },
      changed: { description: `${workflowDescription} Policy applies` },
    },
    {
      attribute: "aria-current",
      initial: "step",
      replacement: "location",
      added: { current: "step" },
      changed: { current: "location" },
    },
  ] as const)("forwards an isolated $attribute addition, change and removal to the native action", async ({ attribute, initial, replacement, added, changed }) => {
    await mountWorkflowNodes();
    const node = document.querySelector<HTMLElementTagNameMap["ocelle-workflow-node"]>("#review");
    if (node === null) throw new Error("the review node must be mounted");

    const update = async (value: string | null) => {
      if (value === null) node.removeAttribute(attribute);
      else node.setAttribute(attribute, value);
      await node.updateComplete;
      const { name, description } = await commands.axState("review", "button");
      const current = node.shadowRoot?.querySelector("button")?.getAttribute("aria-current") ?? null;
      return { name, description, current };
    };

    const builtIn = { name: "Security review", description: workflowDescription, current: null };
    expect(await update(null)).toEqual(builtIn);
    expect(await update(initial)).toEqual({ ...builtIn, ...added });
    expect(await update(replacement)).toEqual({ ...builtIn, ...changed });
    expect(await update(null)).toEqual(builtIn);
  });
});

describe("ocelle-workflow-node recorded run inspection in process", () => {
  it("reads the recorded status outside the action and requests selection without changing the host's record", async () => {
    await mountWorkflowNodes("literal");
    await changeRecordedStatus(["add", recordedStatus]);
    const expected = {
      target: "status",
      outsideAction: true,
      associated: true,
      status: [{ text: recordedStatus, visible: true }],
      actionCount: 1,
      outcomes: ["Approved", "Rejected"],
    };
    expect(recordedStep()).toEqual(expected);
    expect(await commands.axState("review", "button")).toMatchObject({
      role: "button",
      name: "Security review Release approvals",
      description: `${workflowDescription} ${recordedStatus} Review the security findings Policy applies`,
      pressed: "false",
    });
    const status = document.getElementById("recorded-status");
    const unchanged = { pressed: "false", selected: false, reflected: false, sameOutcomes: true, data: originalWorkflowStep };
    expect(workflowSelectionState()).toEqual(unchanged);
    await commands.pointer("click", "recorded-status");
    await commands.pointer("click", "review", { inner: "li" });
    expect(readWorkflowRequests()).toEqual([]);
    const passiveClicks = readWorkflowActivity();

    await commands.pointer("click", "review", { inner: "button", position: { x: 4, y: 4 } });
    const selection = selectionActivity("review", "review-12");
    expect(readWorkflowActivity()).toEqual([...passiveClicks, ...selection]);
    await commands.press("Enter");
    expect(readWorkflowActivity()).toEqual([...passiveClicks, ...selection, ...selection]);
    await commands.press("Space");
    expect(readWorkflowActivity()).toEqual([...passiveClicks, ...selection, ...selection, ...selection]);

    expect(workflowSelectionState()).toEqual(unchanged);
    expect(document.getElementById("recorded-status")).toBe(status);
    expect(recordedStep()).toEqual(expected);
  });

  it("keeps the built-in description through status addition, replacement, editing, empty content and removal", async () => {
    await mountWorkflowNodes();
    expect(recordedStep()).toMatchObject({ target: "status", status: [], actionCount: 1, outsideAction: true });
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: workflowDescription });

    await changeRecordedStatus(["add", recordedStatus]);
    expect(recordedStep().status).toEqual([{ text: recordedStatus, visible: true }]);
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} ${recordedStatus}` });
    await changeRecordedStatus(["replace", replacementStatus]);
    expect(recordedStep().status).toEqual([{ text: replacementStatus, visible: true }]);
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} ${replacementStatus}` });
    await changeRecordedStatus(["edit", editedStatus]);
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} ${editedStatus}` });
    await changeRecordedStatus(["empty"]);
    expect(recordedStep().status).toEqual([{ text: "", visible: false }]);
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: workflowDescription });
    await changeRecordedStatus(["remove"]);
    expect(recordedStep()).toMatchObject({ target: "status", status: [], actionCount: 1, outsideAction: true });
    expect(await commands.axState("review", "button")).toMatchObject({ name: "Security review", description: workflowDescription });
    expect(readWorkflowActivity()).toEqual([]);
  });
});
