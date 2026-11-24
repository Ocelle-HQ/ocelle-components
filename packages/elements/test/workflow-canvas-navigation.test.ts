import { describe, expect, it } from "vitest";
type NavigationModule = typeof import("../src/workflow-canvas-navigation.ts");

// Report absent results through the same assertions when replaying before the module existed.
const navigation = import.meta.glob<NavigationModule>("../src/workflow-canvas-navigation.ts", { eager: true })["../src/workflow-canvas-navigation.ts"];
const noResult = (): undefined => undefined;
const {
  navigateWorkflowCanvas,
  recoverWorkflowCanvasFocus,
  workflowCanvasEntryId,
  workflowCanvasRevealTarget,
} = navigation ?? {
  navigateWorkflowCanvas: noResult,
  recoverWorkflowCanvasFocus: noResult,
  workflowCanvasEntryId: noResult,
  workflowCanvasRevealTarget: noResult,
};

const order = ["review", "publish", "revise", "archive", "close"];

describe("workflow canvas navigation", () => {
  it("uses the eligible selected node as the single sequential entry", () => {
    const eligible = new Set(["close", "review", "revise"]);

    expect(workflowCanvasEntryId(order, eligible, "revise")).toBe("revise");
  });

  it("uses the first eligible node in graph order when selection is unavailable", () => {
    const eligible = new Set(["close", "revise"]);

    expect(workflowCanvasEntryId(order, eligible, "publish")).toBe("revise");
    expect(workflowCanvasEntryId(order, eligible, null)).toBe("revise");
    expect(workflowCanvasEntryId(order, new Set<string>(), "publish")).toBeNull();
  });

  it("moves forward with Right and Down and stops at the last eligible action", () => {
    const eligible = new Set(["close", "review", "revise"]);

    expect(navigateWorkflowCanvas(order, eligible, "review", "ArrowRight")).toBe("revise");
    expect(navigateWorkflowCanvas(order, eligible, "revise", "ArrowDown")).toBe("close");
    expect(navigateWorkflowCanvas(order, eligible, "close", "ArrowRight") ?? "close").toBe("close");
    expect(navigateWorkflowCanvas(order, eligible, "close", "ArrowDown") ?? "close").toBe("close");
  });

  it("moves backward with Left and Up and stops at the first eligible action", () => {
    const eligible = new Set(["close", "review", "revise"]);

    expect(navigateWorkflowCanvas(order, eligible, "close", "ArrowLeft")).toBe("revise");
    expect(navigateWorkflowCanvas(order, eligible, "revise", "ArrowUp")).toBe("review");
    expect(navigateWorkflowCanvas(order, eligible, "review", "ArrowLeft") ?? "review").toBe("review");
    expect(navigateWorkflowCanvas(order, eligible, "review", "ArrowUp") ?? "review").toBe("review");
  });

  it("takes Home and End to eligible endpoints when the graph endpoints are clipped", () => {
    const eligible = new Set(["archive", "publish", "revise"]);

    expect(navigateWorkflowCanvas(order, eligible, "revise", "Home")).toBe("publish");
    expect(navigateWorkflowCanvas(order, eligible, "revise", "End")).toBe("archive");
  });

  it("retains the same eligible focused action on host reorder", () => {
    const reordered = new Set(["close", "archive", "publish", "revise", "review"]);

    expect(recoverWorkflowCanvasFocus(order, reordered, "publish")).toBe("publish");
  });

  it("recovers to the first eligible successor in the previous order after removal", () => {
    const remaining = new Set(["close", "archive", "review"]);

    expect(recoverWorkflowCanvasFocus(order, remaining, "publish")).toBe("archive");
  });

  it("recovers to the nearest eligible predecessor when clipping rules out successors", () => {
    const eligible = new Set(["review", "publish"]);

    expect(recoverWorkflowCanvasFocus(order, eligible, "archive")).toBe("publish");
    expect(recoverWorkflowCanvasFocus(order, new Set<string>(), "archive")).toBeNull();
  });

  it("keeps a reveal pending until the current target becomes eligible", () => {
    const pending = { nodeId: "publish", generation: 4, focusEpoch: 7 };

    expect(workflowCanvasRevealTarget(pending, new Set(["review", "publish"]), 4, 7)).toBe("publish");
    expect(workflowCanvasRevealTarget(pending, new Set(["review"]), 4, 7)).toBeNull();
  });

  it("gives overlapping reveals to the latest request even when both targets become eligible", () => {
    const previous = { nodeId: "publish", generation: 4, focusEpoch: 7 };
    const current = { nodeId: "revise", generation: 5, focusEpoch: 7 };
    const eligible = new Set(["publish", "revise"]);

    expect(workflowCanvasRevealTarget(current, eligible, 5, 7)).toBe("revise");
    expect(workflowCanvasRevealTarget(previous, eligible, 5, 7)).toBeNull();
    expect(workflowCanvasRevealTarget(current, new Set(["publish"]), 5, 7)).toBeNull();
  });

  it("allows the current focus epoch to hand off and abandons it after focus departs", () => {
    const pending = { nodeId: "revise", generation: 5, focusEpoch: 7 };
    const eligible = new Set(["revise"]);

    expect(workflowCanvasRevealTarget(pending, eligible, 5, 7)).toBe("revise");
    expect(workflowCanvasRevealTarget(pending, eligible, 5, 9)).toBeNull();
    expect(workflowCanvasRevealTarget(null, eligible, 5, 9)).toBeNull();
  });
});
