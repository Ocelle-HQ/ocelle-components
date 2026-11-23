import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect as vitestExpect, inject, it } from "vitest";
import type { Assertion } from "vitest";
import { pointer } from "../commands.ts";
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
} from "../scenarios/workflow-node.ts";
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
} from "../scenarios/workflow-node-navigation.ts";
import { changeRecordedStatus, editedStatus, recordedStatus, recordedStep, replacementStatus } from "../scenarios/workflow-node-inspection.ts";
import { fixtureDriver } from "./driver.ts";
import { clean, launch, serve, visit } from "./serve.ts";
import type { Served } from "./serve.ts";

const built = inject("elementsFixture");
let served: Served | undefined;
let browser: Browser | undefined;

beforeAll(async () => {
  served = await serve(built);
  browser = await launch();
}, 120_000);

afterAll(async () => {
  await browser?.close();
  await served?.close();
});

async function workflow(mode: "references" | "literal" | "plain" = "plain") {
  if (served === undefined || browser === undefined) throw new Error("the workflow fixture did not start");
  const mounted = await visit(browser, served.origin, "workflow-node.html");
  const { page } = mounted;
  await page.evaluate(mountWorkflowNodes, mode);
  return { ...mounted, driver: fixtureDriver(page, mounted.log) };
}

const inner = { inner: "button" };
// Vitest's asymmetric matcher is untyped. Narrow that method without changing the recorded assertion.
const expect: { (value: unknown): Assertion; any(type: NumberConstructor): unknown } = vitestExpect;

describe("ocelle-workflow-node selection on built output under strict CSP", () => {
  it("renders the two sets of exact step text and just one native action per step", async () => {
    const { page, finish } = await workflow();
    expect({ presentation: await page.evaluate(readWorkflowNodes), recorded: await finish() }).toEqual({ presentation: workflowNodePresentation, recorded: clean });
  });

  it.each([
    { mode: "literal", name: "Security review Release approvals", contexts: ["Release approvals"] },
    { mode: "references", name: "Security review Release workspace Stage two", contexts: ["Release workspace", "Stage two"] },
  ] as const)("exposes the full visible title plus $mode context in the native accessibility node", async ({ mode, name, contexts }) => {
    const { page, driver, finish } = await workflow(mode);
    const descriptionContext = ["Review the security findings", "Policy applies"];
    expect(await page.evaluate(workflowAria)).toEqual({ current: "step", pressed: "false", nameContext: contexts, descriptionContext });
    expect(await driver.axState("review", "button")).toMatchObject({
      role: "button",
      name,
      description: "Kind Approval Role Reviewer Outcomes Approved Rejected Review the security findings Policy applies",
    });
    expect(await finish()).toEqual(clean);
  });

  it("delivers one selection during each pointer, Enter and Space click and keeps the ID and host data through a rename", async () => {
    const { page, driver, finish } = await workflow();
    const unselected = { pressed: "false", selected: false, reflected: false, sameOutcomes: true, data: originalWorkflowStep };
    expect(await page.evaluate(workflowSelectionState)).toEqual(unselected);
    const request = selectionActivity("review", "review-12");
    await pointer(page, page.mainFrame(), "click", "review", inner);
    expect(await page.evaluate(readWorkflowActivity)).toEqual(request);
    await page.keyboard.press("Enter");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request]);
    await page.keyboard.press("Space");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request]);
    expect(await page.evaluate(workflowSelectionState)).toEqual(unselected);

    await page.evaluate(updateWorkflowNode, "rename" as const);
    await page.evaluate(updateWorkflowNode, "select" as const);
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request]);
    const renamed = await driver.axState("review", "button");
    expect(renamed).toMatchObject({ role: "button", name: "Final security review", pressed: "true" });
    expect(renamed.description).toContain("Selected");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request, ...request]);
    expect(await page.evaluate(workflowSelectionState)).toEqual({ ...unselected, pressed: "true", selected: true, reflected: true });

    await page.evaluate(updateWorkflowNode, "blank" as const);
    await page.keyboard.press("Space");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request, ...request, request[1]]);
    expect(await finish()).toEqual(clean);
  });

  it("keeps focus safe before render and reaches each native action once in both Tab directions", async () => {
    const { page, finish } = await workflow();
    expect(await page.evaluate(workflowFocusLifecycle)).toEqual(workflowFocusExpected);
    await page.locator("#before").focus();
    const order: string[] = [];
    for (const key of ["Tab", "Tab", "Tab", "Shift+Tab", "Shift+Tab", "Shift+Tab"]) {
      await page.keyboard.press(key);
      order.push(await page.evaluate(readWorkflowFocus));
    }
    expect(order).toEqual(workflowTabOrder);
    expect(await page.evaluate(readWorkflowActivity)).toEqual([]);
    expect(await finish()).toEqual(clean);
  });

  it("discards an interrupted pointer activation and requests selection on a fresh click of the replacement", async () => {
    const { page, finish } = await workflow();
    expect(await page.evaluate(readWorkflowNodes)).toEqual(workflowNodePresentation);
    await pointer(page, page.mainFrame(), "down", "review", inner);
    await page.evaluate(replacePressedWorkflowNode);
    await pointer(page, page.mainFrame(), "up", "replacement", inner);
    expect(await page.evaluate(readWorkflowRequests)).toEqual([]);
    const interrupted = await page.evaluate(readWorkflowActivity);
    await pointer(page, page.mainFrame(), "click", "replacement", inner);
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...interrupted, ...selectionActivity("replacement", "replacement-42")]);
    expect(await finish()).toEqual(clean);
  });

  it.each(["light", "dark", "forced"] as const)("preserves the narrow native target and visible cues in %s", async (mode) => {
    const { page, finish } = await workflow();
    await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, mode === "dark" ? "dark" : "light");
    await page.emulateMedia({ forcedColors: mode === "forced" ? "active" : "none" });
    await page.locator("#before").focus();
    await page.keyboard.press("Tab");
    const paint = await page.evaluate(workflowPaint);
    expect(paint).toMatchObject({ min: expect.any(Number), outline: "solid" });
    expect(paint.min).toBeGreaterThan(0);
    expect(Math.min(...paint.size)).toBeGreaterThanOrEqual(paint.min);
    expect(paint.outlineWidth).toBeGreaterThan(0);
    const [text, borderOutside, borderInside, focus, metadata] = workflowContrast(paint.colors);
    expect({ text: (text ?? 0) >= 4.5, borderOutside: (borderOutside ?? 0) >= 3, borderInside: (borderInside ?? 0) >= 3, focus: (focus ?? 0) >= 3, metadata: (metadata ?? 0) >= 4.5 }).toEqual({ text: true, borderOutside: true, borderInside: true, focus: true, metadata: true });
    expect(await finish()).toEqual(clean);
  });
});

describe("ocelle-workflow-node navigation and accessible context on built output under strict CSP", () => {
  it("skips an excluded action in both Tab directions, activates it directly and restores its one stop", async () => {
    const { page, finish } = await workflow();
    const order = (steps: number) => cycleWorkflowNodes(
      () => page.locator("#before").focus(),
      (reverse) => page.keyboard.press(reverse ? "Shift+Tab" : "Tab"),
      () => page.evaluate(readWorkflowFocus),
      steps,
    );
    expect(await order(3)).toEqual(workflowTabOrder);
    expect(await page.evaluate(workflowTabParticipation, "markup" as const)).toEqual({ field: 0, action: 0, host: -1, focused: null });
    expect(await page.evaluate(workflowTabParticipation, "exclude" as const)).toEqual({ field: -1, action: -1, host: -1, focused: null });
    expect(await order(2)).toEqual(["planning >> button", "after", "planning >> button", "before"]);
    expect(await page.evaluate(workflowTabParticipation, "focus" as const)).toEqual({ field: -1, action: -1, host: -1, focused: "button" });
    expect(await page.evaluate(readWorkflowActivity)).toEqual([]);

    const activity = selectionActivity("review", "review-12");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(readWorkflowActivity)).toEqual(activity);
    await page.keyboard.press("Space");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...activity, ...activity]);
    expect(await page.evaluate(workflowTabParticipation, "restore" as const)).toEqual({ field: 0, action: 0, host: -1, focused: "button" });
    expect(await order(3)).toEqual(workflowTabOrder);
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...activity, ...activity]);
    expect(await finish()).toEqual(clean);
  });

  it.each(["light", "dark", "forced"] as const)("shows all three states and the full wrapped accessible text in %s", async (mode) => {
    const { page, driver, finish } = await workflow();
    await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, mode === "dark" ? "dark" : "light");
    await page.emulateMedia({ forcedColors: mode === "forced" ? "active" : "none" });
    await page.evaluate(makeLongWorkflowStep, longWorkflowStep);
    await page.evaluate(updateWorkflowStates, "combine" as const);
    await page.locator("#before").focus();
    await page.keyboard.press("Tab");

    const cues = await page.evaluate(workflowStateCues);
    expect({ labels: cues.labels, fits: cues.fits }).toEqual({ labels: ["Selected", "Waiting", "Invalid"], fits: true });
    expect(cues.titleLines).toBeGreaterThan(1);
    expect(await page.evaluate(readWorkflowFocus)).toBe("review >> button");
    expect(await driver.axState("review", "button")).toMatchObject({ role: "button", name: longWorkflowStep.label, description: combinedWorkflowDescription, pressed: "true" });
    const paint = await page.evaluate(workflowPaint);
    expect(paint.outline).toBe("solid");
    expect(paint.outlineWidth).toBeGreaterThan(0);
    expect(paint.min).toBeGreaterThan(0);
    expect(Math.min(...paint.size)).toBeGreaterThanOrEqual(paint.min);
    const thresholds = [4.5, 3, 3, 3, 4.5, 4.5, 4.5, 4.5];
    const contrasts = workflowContrast([...paint.colors, ...cues.colors]);
    expect(thresholds.map((threshold, at) => (contrasts[at] ?? 0) >= threshold)).toEqual(thresholds.map(() => true));
    expect(await page.evaluate(readWorkflowActivity)).toEqual([]);
    expect(await finish()).toEqual(clean);
  });

  it("updates and clears literal host context while preserving selection, description and native focus", async () => {
    const { page, driver, finish } = await workflow("literal");
    await page.evaluate(updateWorkflowNode, "select" as const);
    await page.evaluate(workflowTabParticipation, "focus" as const);
    await page.evaluate(changeWorkflowContext, "replace-literal" as const);
    expect(await page.evaluate(workflowAria)).toMatchObject({ current: "location", nameContext: ["Retrospective context"], descriptionContext: ["Policy applies"] });
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review Retrospective context", description: `${workflowDescription} Selected Policy applies`, pressed: "true" });
    await page.evaluate(changeWorkflowContext, "clear-literal" as const);
    expect(await page.evaluate(workflowAria)).toMatchObject({ current: null, nameContext: [], descriptionContext: [] });
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} Selected`, pressed: "true" });
    expect(await page.evaluate(readWorkflowFocus)).toBe("review >> button");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([]);
    expect(await finish()).toEqual(clean);
  });

  it("exposes edited reference text and refreshes name and description when targets are replaced under the same IDs", async () => {
    const { page, driver, finish } = await workflow("references");
    await page.evaluate(updateWorkflowNode, "select" as const);
    const description = `${workflowDescription} Selected`;
    await page.evaluate(changeWorkflowContext, "edit-targets" as const);
    expect(await driver.axState("review", "button")).toMatchObject({
      name: "Security review Edited workspace Stage two",
      description: `${description} Edited description Policy applies`,
    });
    await page.evaluate(changeWorkflowContext, "replace-targets" as const);
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review Release approvals", description });
    await page.evaluate(changeWorkflowContext, "restore-targets" as const);
    expect(await driver.axState("review", "button")).toMatchObject({
      name: "Security review Replacement workspace Stage two",
      description: `${description} Replacement description Policy applies`,
    });
    expect(await page.evaluate(readWorkflowActivity)).toEqual([]);
    expect(await finish()).toEqual(clean);
  });

  it("resolves the context in the host shadow root after the same element reconnects", async () => {
    const { page, driver, finish } = await workflow("references");
    await page.evaluate(changeWorkflowContext, "move-root" as const);
    expect(await driver.axState("review", "button")).toMatchObject({
      name: "Security review Shadow workspace Shadow stage",
      description: `${workflowDescription} Shadow hint Shadow policy`,
    });
    expect(await finish()).toEqual(clean);
  });
});

describe("ocelle-workflow-node recorded run inspection on built output under strict CSP", () => {
  it("reads the supplied status outside the only selection action and preserves the read-only host's data", async () => {
    const { page, driver, finish } = await workflow("literal");
    await page.evaluate(changeRecordedStatus, ["add", recordedStatus] as const);
    const expected = {
      target: "status",
      outsideAction: true,
      associated: true,
      status: [{ text: recordedStatus, visible: true }],
      actionCount: 1,
      outcomes: ["Approved", "Rejected"],
    };
    expect(await page.evaluate(recordedStep)).toEqual(expected);
    expect(await driver.axState("review", "button")).toMatchObject({
      role: "button",
      name: "Security review Release approvals",
      description: `${workflowDescription} ${recordedStatus} Review the security findings Policy applies`,
      pressed: "false",
    });
    const unchanged = { pressed: "false", selected: false, reflected: false, sameOutcomes: true, data: originalWorkflowStep };
    expect(await page.evaluate(workflowSelectionState)).toEqual(unchanged);
    await pointer(page, page.mainFrame(), "click", "recorded-status");
    await pointer(page, page.mainFrame(), "click", "review", { inner: "li" });
    expect(await page.evaluate(readWorkflowRequests)).toEqual([]);
    const passiveClicks = await page.evaluate(readWorkflowActivity);

    await pointer(page, page.mainFrame(), "click", "review", { inner: "button", position: { x: 4, y: 4 } });
    const selection = selectionActivity("review", "review-12");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...passiveClicks, ...selection]);
    await page.keyboard.press("Enter");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...passiveClicks, ...selection, ...selection]);
    await page.keyboard.press("Space");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...passiveClicks, ...selection, ...selection, ...selection]);
    expect(await page.evaluate(workflowSelectionState)).toEqual(unchanged);
    expect(await page.evaluate(recordedStep)).toEqual(expected);
    expect(await finish()).toEqual(clean);
  });

  it("reads newly added, replaced and edited status and drops it when emptied or removed", async () => {
    const { page, driver, finish } = await workflow();
    expect(await page.evaluate(recordedStep)).toMatchObject({ target: "status", status: [], actionCount: 1, outsideAction: true });
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: workflowDescription });
    await page.evaluate(changeRecordedStatus, ["add", recordedStatus] as const);
    expect((await page.evaluate(recordedStep)).status).toEqual([{ text: recordedStatus, visible: true }]);
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} ${recordedStatus}` });
    await page.evaluate(changeRecordedStatus, ["replace", replacementStatus] as const);
    expect((await page.evaluate(recordedStep)).status).toEqual([{ text: replacementStatus, visible: true }]);
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} ${replacementStatus}` });
    await page.evaluate(changeRecordedStatus, ["edit", editedStatus] as const);
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: `${workflowDescription} ${editedStatus}` });
    await page.evaluate(changeRecordedStatus, ["empty"] as const);
    expect((await page.evaluate(recordedStep)).status).toEqual([{ text: "", visible: false }]);
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: workflowDescription });
    await page.evaluate(changeRecordedStatus, ["remove"] as const);
    expect(await page.evaluate(recordedStep)).toMatchObject({ target: "status", status: [], actionCount: 1, outsideAction: true });
    expect(await driver.axState("review", "button")).toMatchObject({ name: "Security review", description: workflowDescription });
    expect(await page.evaluate(readWorkflowActivity)).toEqual([]);
    expect(await finish()).toEqual(clean);
  });
});
