import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
import "../src/ocelle-workflow-canvas.ts";
import type { OcelleWorkflowCanvas } from "../src/ocelle-workflow-canvas.ts";
import type { WorkflowCanvasPositionRequestDetail, WorkflowCanvasViewportRequestDetail } from "../src/workflow-canvas-types.ts";
import { inProcessDriver } from "./in-process.ts";

const viewport = "ocelle-workflow-canvas-viewport-request";
const position = "ocelle-workflow-canvas-position-request";

interface ObservedRequest {
  readonly type: string;
  readonly detail: unknown;
  readonly bubbles: boolean;
  readonly composed: boolean;
  readonly cancelable: boolean;
}

function request(type: string, detail: unknown): ObservedRequest {
  return { type, detail, bubbles: true, composed: true, cancelable: false };
}

async function mount() {
  await inProcessDriver().mount("");
  const host = document.createElement("section");
  const canvas = document.createElement("ocelle-workflow-canvas");
  canvas.graph = {
    nodes: [
      { id: "review", label: "Review", accountableRole: "Reviewer", kind: "Approval", outcomes: [{ id: "approved", label: "Approved" }] },
      { id: "publish", label: "Publish", accountableRole: "Author", kind: "Publication", outcomes: [] },
    ],
    connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "publish" }],
  };
  canvas.layout = [{ nodeId: "review", x: 25, y: 20 }, { nodeId: "publish", x: 470, y: 65 }];
  canvas.viewport = { x: 18, y: 24, scale: 1 };
  canvas.mode = "author";
  Object.assign(canvas.style, { inlineSize: "430px", blockSize: "430px" });
  const requests: ObservedRequest[] = [];
  for (const type of [viewport, position, "ocelle-workflow-node-select", "ocelle-workflow-canvas-connection-request"]) {
    host.addEventListener(type, (event) => {
      const { detail } = event as CustomEvent<unknown>;
      requests.push({ type, detail, bubbles: event.bubbles, composed: event.composed, cancelable: event.cancelable });
    });
  }
  host.append(canvas);
  document.body.append(host);
  await settle(canvas);
  return { canvas, host, requests };
}

async function settle(canvas: OcelleWorkflowCanvas): Promise<void> {
  await canvas.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await canvas.updateComplete;
}

async function tap(element: Element): Promise<void> {
  const { left, top, width, height } = element.getBoundingClientRect();
  await commands.touchTap(left + width / 2, top + height / 2);
}

function command(canvas: OcelleWorkflowCanvas, name: string): HTMLButtonElement {
  const target = [...canvas.shadowRoot?.querySelectorAll("button") ?? []].find((button) => button.textContent.trim() === name);
  expect(target, `there is a native ${name} touch target`).toBeInstanceOf(HTMLButtonElement);
  if (target === undefined) throw new Error("Canvas command missing");
  return target;
}

async function disclose(canvas: OcelleWorkflowCanvas): Promise<void> {
  const summary = canvas.shadowRoot?.querySelector("summary");
  expect(summary?.textContent.trim(), "a real tap can open the canvas controls").toBe("Canvas controls");
  if (summary === null || summary === undefined) throw new Error("Canvas controls missing");
  const input: string[] = [];
  summary.addEventListener("pointerdown", (event) => { input.push(event.pointerType); }, { once: true });
  await tap(summary);
  expect(input).toEqual(["touch"]);
  await expect.poll(() => canvas.shadowRoot?.querySelector("details[open] button")).toBeInstanceOf(HTMLButtonElement);
}

afterEach(() => { document.body.replaceChildren(); });

describe("workflow canvas real touch arranging", () => {
  it("pans in every direction, zooms both ways and fits from single native taps", async () => {
    const { canvas, host, requests } = await mount();
    canvas.mode = "read-only";
    await settle(canvas);
    host.addEventListener(viewport, (event) => {
      canvas.viewport = (event as CustomEvent<WorkflowCanvasViewportRequestDetail>).detail.viewport;
    });
    const graph = canvas.graph;
    const layout = canvas.layout;
    await disclose(canvas);
    const map = canvas.shadowRoot?.querySelector("svg.map");
    if (map === null || map === undefined) throw new Error("Map missing");
    const x = map.clientWidth / 2;
    const y = map.clientHeight / 2;
    const poses = [
      { name: "Pan left", view: { x: -46, y: 24, scale: 1 } },
      { name: "Pan right", view: { x: 18, y: 24, scale: 1 } },
      { name: "Pan up", view: { x: 18, y: -40, scale: 1 } },
      { name: "Pan down", view: { x: 18, y: 24, scale: 1 } },
      { name: "Zoom in", view: { x: x - (x - 18) * 1.25, y: y - (y - 24) * 1.25, scale: 1.25 } },
      { name: "Zoom out", view: { x: 18, y: 24, scale: 1 } },
    ];
    for (const [index, { name, view }] of poses.entries()) {
      const button = command(canvas, name);
      await tap(button);
      await settle(canvas);
      expect(requests).toEqual(poses.slice(0, index + 1).map(({ view }) => request(viewport, { viewport: view })));
      expect(canvas.viewport).toEqual(view);
      const { width, height } = button.getBoundingClientRect();
      expect(Math.min(width, height)).toBeGreaterThanOrEqual(Number.parseFloat(getComputedStyle(button).minBlockSize));
    }
    await tap(command(canvas, "Fit graph"));
    await settle(canvas);
    expect(requests).toEqual([...poses.map(({ view }) => request(viewport, { viewport: view })),
      request(viewport, { viewport: canvas.viewport })]);
    const clip = map.getBoundingClientRect();
    for (const face of map.querySelectorAll("foreignObject")) {
      const rect = face.getBoundingClientRect();
      expect(rect.left).toBeGreaterThanOrEqual(clip.left);
      expect(rect.right).toBeLessThanOrEqual(clip.right);
      expect(rect.top).toBeGreaterThanOrEqual(clip.top);
      expect(rect.bottom).toBeLessThanOrEqual(clip.bottom);
    }
    expect(canvas.shadowRoot?.activeElement?.getBoundingClientRect().height).toBeGreaterThan(0);
    expect(canvas.graph).toBe(graph);
    expect(canvas.layout).toBe(layout);
  });

  it("taps the absolute Move step request in author mode and retains map commands in read-only", async () => {
    const { canvas, host, requests } = await mount();
    const graph = canvas.graph;
    host.addEventListener(position, (event) => {
      const { detail } = event as CustomEvent<WorkflowCanvasPositionRequestDetail>;
      canvas.layout = canvas.layout.map((entry) => entry.nodeId === detail.nodeId ? { ...entry, ...detail.position } : entry);
    });
    await disclose(canvas);
    const move = command(canvas, "Move step");
    const x = canvas.shadowRoot?.querySelector('input[name="x"]');
    const y = canvas.shadowRoot?.querySelector('input[name="y"]');
    expect(x).toBeInstanceOf(HTMLInputElement);
    expect(y).toBeInstanceOf(HTMLInputElement);
    if (!(x instanceof HTMLInputElement) || !(y instanceof HTMLInputElement)) throw new Error("Position fields missing");
    x.value = "64";
    y.value = "72";
    await tap(move);
    await settle(canvas);
    const moved = request(position, { nodeId: "review", position: { x: 64, y: 72 } });
    expect(requests).toEqual([moved]);
    expect(canvas.layout[0]).toEqual({ nodeId: "review", x: 64, y: 72 });
    canvas.mode = "read-only";
    await settle(canvas);
    expect(move.isConnected).toBe(false);
    await disclose(canvas);
    await tap(command(canvas, "Pan right"));
    expect(requests).toEqual([moved, request(viewport, { viewport: { x: 82, y: 24, scale: 1 } })]);
    expect(canvas.graph).toBe(graph);
  });
});
