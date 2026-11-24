import { describe, expect, it } from "vitest";
type NavigationModule = typeof import("../src/workflow-canvas-navigation.ts");

// Pre-scaffold replay reports the missing helper in each named case.
const navigation = import.meta.glob<NavigationModule>("../src/workflow-canvas-navigation.ts", { eager: true })["../src/workflow-canvas-navigation.ts"];

function navigationHelper<K extends keyof NavigationModule>(name: K): NavigationModule[K] {
  const helper = navigation?.[name];
  expect(typeof helper, `the navigation module exports ${name}`).toBe("function");
  if (helper === undefined) throw new Error(`Navigation helper unavailable: ${name}`);
  return helper;
}

const order = ["review", "publish", "revise", "archive", "close"];

describe("workflow canvas navigation", () => {
  it("uses the eligible selected node as the single sequential entry", () => {
    const workflowCanvasEntryId = navigationHelper("workflowCanvasEntryId");
    const eligible = new Set(["close", "review", "revise"]);

    expect(workflowCanvasEntryId(order, eligible, "revise")).toBe("revise");
  });

  it("uses the first eligible node in graph order when selection is unavailable", () => {
    const workflowCanvasEntryId = navigationHelper("workflowCanvasEntryId");
    const eligible = new Set(["close", "revise"]);

    expect(workflowCanvasEntryId(order, eligible, "publish")).toBe("revise");
    expect(workflowCanvasEntryId(order, eligible, null)).toBe("revise");
    expect(workflowCanvasEntryId(order, new Set<string>(), "publish")).toBeNull();
  });

  it("moves forward with Right and Down and stops at the last eligible action", () => {
    const navigateWorkflowCanvas = navigationHelper("navigateWorkflowCanvas");
    const eligible = new Set(["close", "review", "revise"]);

    expect(navigateWorkflowCanvas(order, eligible, "review", "ArrowRight")).toBe("revise");
    expect(navigateWorkflowCanvas(order, eligible, "revise", "ArrowDown")).toBe("close");
    expect(navigateWorkflowCanvas(order, eligible, "close", "ArrowRight") ?? "close").toBe("close");
    expect(navigateWorkflowCanvas(order, eligible, "close", "ArrowDown") ?? "close").toBe("close");
  });

  it("moves backward with Left and Up and stops at the first eligible action", () => {
    const navigateWorkflowCanvas = navigationHelper("navigateWorkflowCanvas");
    const eligible = new Set(["close", "review", "revise"]);

    expect(navigateWorkflowCanvas(order, eligible, "close", "ArrowLeft")).toBe("revise");
    expect(navigateWorkflowCanvas(order, eligible, "revise", "ArrowUp")).toBe("review");
    expect(navigateWorkflowCanvas(order, eligible, "review", "ArrowLeft") ?? "review").toBe("review");
    expect(navigateWorkflowCanvas(order, eligible, "review", "ArrowUp") ?? "review").toBe("review");
  });

  it("takes Home and End to eligible endpoints when the graph endpoints are clipped", () => {
    const navigateWorkflowCanvas = navigationHelper("navigateWorkflowCanvas");
    const eligible = new Set(["archive", "publish", "revise"]);

    expect(navigateWorkflowCanvas(order, eligible, "revise", "Home")).toBe("publish");
    expect(navigateWorkflowCanvas(order, eligible, "revise", "End")).toBe("archive");
  });

  it("retains the same eligible focused action on host reorder", () => {
    const recoverWorkflowCanvasFocus = navigationHelper("recoverWorkflowCanvasFocus");
    const reordered = new Set(["close", "archive", "publish", "revise", "review"]);

    expect(recoverWorkflowCanvasFocus(order, reordered, "publish")).toBe("publish");
  });

  it("recovers to the first eligible successor in the previous order after removal", () => {
    const recoverWorkflowCanvasFocus = navigationHelper("recoverWorkflowCanvasFocus");
    const remaining = new Set(["close", "archive", "review"]);

    expect(recoverWorkflowCanvasFocus(order, remaining, "publish")).toBe("archive");
  });

  it("recovers to the nearest eligible predecessor when clipping rules out successors", () => {
    const recoverWorkflowCanvasFocus = navigationHelper("recoverWorkflowCanvasFocus");
    const eligible = new Set(["review", "publish"]);

    expect(recoverWorkflowCanvasFocus(order, eligible, "archive")).toBe("publish");
    expect(recoverWorkflowCanvasFocus(order, new Set<string>(), "archive")).toBeNull();
  });

  it("keeps a reveal pending until the current target becomes eligible", () => {
    const workflowCanvasRevealTarget = navigationHelper("workflowCanvasRevealTarget");
    const pending = { nodeId: "publish", generation: 4, focusEpoch: 7 };

    expect(workflowCanvasRevealTarget(pending, new Set(["review", "publish"]), 4, 7)).toBe("publish");
    expect(workflowCanvasRevealTarget(pending, new Set(["review"]), 4, 7)).toBeNull();
  });

  it("gives overlapping reveals to the latest request even when both targets become eligible", () => {
    const workflowCanvasRevealTarget = navigationHelper("workflowCanvasRevealTarget");
    const previous = { nodeId: "publish", generation: 4, focusEpoch: 7 };
    const current = { nodeId: "revise", generation: 5, focusEpoch: 7 };
    const eligible = new Set(["publish", "revise"]);

    expect(workflowCanvasRevealTarget(current, eligible, 5, 7)).toBe("revise");
    expect(workflowCanvasRevealTarget(previous, eligible, 5, 7)).toBeNull();
    expect(workflowCanvasRevealTarget(current, new Set(["publish"]), 5, 7)).toBeNull();
  });

  it("allows the current focus epoch to hand off and abandons it after focus departs", () => {
    const workflowCanvasRevealTarget = navigationHelper("workflowCanvasRevealTarget");
    const pending = { nodeId: "revise", generation: 5, focusEpoch: 7 };
    const eligible = new Set(["revise"]);

    expect(workflowCanvasRevealTarget(pending, eligible, 5, 7)).toBe("revise");
    expect(workflowCanvasRevealTarget(pending, eligible, 5, 9)).toBeNull();
    expect(workflowCanvasRevealTarget(null, eligible, 5, 9)).toBeNull();
  });
});
