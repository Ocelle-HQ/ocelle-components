import type { Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest";
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
    await driver.pointer("click", "review", inner);
    expect(await page.evaluate(readWorkflowActivity)).toEqual(request);
    await page.keyboard.press("Enter");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request]);
    await page.keyboard.press("Space");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request]);
    expect(await page.evaluate(workflowSelectionState)).toEqual(unselected);

    await page.evaluate(updateWorkflowNode, "rename");
    await page.evaluate(updateWorkflowNode, "select");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request]);
    expect(await driver.axState("review", "button")).toMatchObject({ role: "button", name: "Final security review", pressed: "true", description: expect.stringContaining("Selected") });
    await page.keyboard.press("Enter");
    expect(await page.evaluate(readWorkflowActivity)).toEqual([...request, ...request, ...request, ...request]);
    expect(await page.evaluate(workflowSelectionState)).toEqual({ ...unselected, pressed: "true", selected: true, reflected: true });

    await page.evaluate(updateWorkflowNode, "blank");
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
    const { page, driver, finish } = await workflow();
    expect(await page.evaluate(readWorkflowNodes)).toEqual(workflowNodePresentation);
    await driver.pointer("down", "review", inner);
    await page.evaluate(replacePressedWorkflowNode);
    await driver.pointer("up", "replacement", inner);
    expect(await page.evaluate(readWorkflowRequests)).toEqual([]);
    const interrupted = await page.evaluate(readWorkflowActivity);
    await driver.pointer("click", "replacement", inner);
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
    expect({ text: text! >= 4.5, borderOutside: borderOutside! >= 3, borderInside: borderInside! >= 3, focus: focus! >= 3, metadata: metadata! >= 4.5 }).toEqual({ text: true, borderOutside: true, borderInside: true, focus: true, metadata: true });
    expect(await finish()).toEqual(clean);
  });
});
