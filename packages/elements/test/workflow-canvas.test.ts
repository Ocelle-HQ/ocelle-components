import { afterEach, describe, expect, it, vi } from "vitest";
import { commands, page } from "vitest/browser";
import type { OcelleWorkflowCanvas } from "../src/ocelle-workflow-canvas.ts";
import { OcelleWorkflowNode } from "../src/ocelle-workflow-node.ts";
import type { WorkflowCanvasGraph, WorkflowCanvasLayoutEntry, WorkflowCanvasNode, WorkflowCanvasViewport, WorkflowCanvasViewportRequestDetail } from "../src/workflow-canvas-types.ts";
import { inProcessDriver } from "./in-process.ts";

const tag = "test-workflow-canvas";
// With no source module on the phase base, mount the same unregistered tag.
const canvasModule = import.meta.glob<typeof import("../src/ocelle-workflow-canvas.ts")>(
  "../src/ocelle-workflow-canvas.ts", { eager: true },
)["../src/ocelle-workflow-canvas.ts"];
if (canvasModule !== undefined) customElements.define(tag, class extends canvasModule.OcelleWorkflowCanvas {});

const driver = inProcessDriver();
const initialViewport = { x: 0, y: 0, scale: 1 };
const namedSteps: readonly WorkflowCanvasNode[] = [
  { id: "review", label: "Initial review", kind: "Approval", accountableRole: "Reviewer", outcomes: [{ id: "approved", label: "Approved" }, { id: "rejected", label: "Rejected" }] },
  { id: "publish", label: "Publish", kind: "Publication", accountableRole: "Author", outcomes: [{ id: "approved", label: "Published" }], invalid: true },
  { id: "revise", label: "Revise", kind: "Planning", accountableRole: "Author", outcomes: [] },
];
const initialGraph: WorkflowCanvasGraph = {
  nodes: namedSteps,
  connections: [
    { sourceId: "review", outcomeId: "approved", destinationId: "publish" },
    { sourceId: "review", outcomeId: "rejected", destinationId: "revise" },
  ],
};
const initialLayout: readonly WorkflowCanvasLayoutEntry[] = [
  { nodeId: "review", x: 30, y: 20 },
  { nodeId: "publish", x: 321, y: 20 },
  { nodeId: "revise", x: 1080, y: 20 },
];

const selection = "ocelle-workflow-node-select";
const viewport = "ocelle-workflow-canvas-viewport-request";
const position = "ocelle-workflow-canvas-position-request";
const requestTypes = [selection, viewport, position, "ocelle-workflow-canvas-connection-request"];

interface Request {
  readonly type: string;
  readonly detail: unknown;
  readonly bubbles: boolean;
  readonly composed: boolean;
  readonly cancelable: boolean;
}

interface Fixture {
  readonly canvas: OcelleWorkflowCanvas;
  readonly before: HTMLButtonElement;
  readonly after: HTMLButtonElement;
  readonly pane: HTMLElement;
  readonly frame: HTMLElement;
  readonly sheet: CSSStyleSheet;
  readonly requests: Request[];
  readonly activity: string[];
}

function control(text: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  return button;
}

function fixtureStyles(paneWidth: number): string {
  return `
    #canvas-pane { overflow: auto; inline-size: ${String(paneWidth)}px; block-size: 490px; }
    #canvas-frame { inline-size: 720px; block-size: 430px; }
    #canvas-frame.move-away { transform: translateX(-1200px); }
    ${tag} { display: block; inline-size: 720px; block-size: 430px; }
  `;
}

async function settle(canvas: OcelleWorkflowCanvas): Promise<void> {
  await canvas.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  await canvas.updateComplete;
  await Promise.all([...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].map((step) => step.updateComplete));
}

async function mount(nested = false): Promise<Fixture> {
  await driver.mount("");
  const canvas = document.createElement(tag) as OcelleWorkflowCanvas;
  canvas.graph = structuredClone(initialGraph);
  canvas.layout = structuredClone(initialLayout);
  canvas.viewport = { ...initialViewport };
  canvas.selectedNodeId = "publish";
  canvas.mode = "author";

  const host = document.createElement("section");
  host.id = "workflow-canvas-host";
  host.setAttribute("aria-label", "Workflow fixture");
  const before = control("Before canvas");
  const after = control("After canvas");
  const pane = document.createElement("div");
  pane.id = "canvas-pane";
  const frame = document.createElement("div");
  frame.id = "canvas-frame";
  frame.append(canvas);
  pane.append(frame);
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(fixtureStyles(760));
  if (nested) {
    const root = host.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [sheet];
    root.append(before, pane, after);
  } else {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    host.append(before, pane, after);
  }

  const requests: Request[] = [];
  const activity: string[] = [];
  for (const type of requestTypes) {
    host.addEventListener(type, (event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      requests.push({ type, detail: structuredClone(detail), bubbles: event.bubbles, composed: event.composed, cancelable: event.cancelable });
      activity.push(type);
    });
  }
  host.addEventListener("click", (event) => {
    if (event.composedPath().some((target) => target instanceof OcelleWorkflowNode)) {
      activity.push(event.defaultPrevented ? "prevented click" : "native click");
    }
  });
  document.body.append(host);
  await settle(canvas);
  return { canvas, before, after, pane, frame, sheet, requests, activity };
}

function getNode(canvas: OcelleWorkflowCanvas, id: string): OcelleWorkflowNode | undefined {
  return [...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].find((node) => node.nodeId === id);
}

function action(canvas: OcelleWorkflowCanvas, id: string): HTMLButtonElement {
  const found = getNode(canvas, id)?.shadowRoot?.querySelector("button");
  expect(found, `the canvas presents the existing native node action for ${id}`).toBeInstanceOf(HTMLButtonElement);
  if (found === undefined || found === null) throw new Error(`Canvas action missing for ${id}`);
  return found;
}

function active(): Element | null {
  let current: Element | null = document.activeElement;
  while (current?.shadowRoot?.activeElement !== null && current?.shadowRoot?.activeElement !== undefined) {
    current = current.shadowRoot.activeElement;
  }
  return current;
}

function focusId(canvas: OcelleWorkflowCanvas): string | null {
  const focused = active();
  return [...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []]
    .find((node) => node.shadowRoot?.querySelector("button") === focused)?.nodeId ?? null;
}

function point(button: HTMLButtonElement) {
  const rect = button.getBoundingClientRect();
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

async function click(button: HTMLButtonElement): Promise<void> {
  await commands.pointerPath([{ ...point(button), down: true, up: true }]);
}

function revealControls(canvas: OcelleWorkflowCanvas) {
  const picker = canvas.shadowRoot?.querySelector("select");
  const button = [...canvas.shadowRoot?.querySelectorAll("button") ?? []].find((candidate) =>
    /^reveal\b/i.test(candidate.getAttribute("aria-label") ?? candidate.textContent.trim()),
  );
  expect(picker, "named navigation supplies a native destination picker").toBeInstanceOf(HTMLSelectElement);
  expect(button, "named navigation supplies a native reveal action").toBeInstanceOf(HTMLButtonElement);
  if (picker === null || picker === undefined || button === undefined) throw new Error("Named navigation controls missing");
  return { picker, button };
}

async function askReveal(canvas: OcelleWorkflowCanvas, id: string): Promise<HTMLButtonElement> {
  const { picker, button } = revealControls(canvas);
  expect([...picker.options].map((option) => option.value)).toContain(id);
  picker.value = id;
  picker.dispatchEvent(new Event("change", { bubbles: true }));
  await settle(canvas);
  button.focus({ preventScroll: true });
  await commands.press("Enter");
  return button;
}

function selectRequest(nodeId: string): Request {
  return { type: selection, detail: { nodeId }, bubbles: true, composed: true, cancelable: false };
}

function lastViewport(requests: readonly Request[]): WorkflowCanvasViewport {
  const entry = requests.at(-1);
  expect(entry).toMatchObject({ type: viewport, bubbles: true, composed: true, cancelable: false, detail: { viewport: {} } });
  const requested = (entry?.detail as WorkflowCanvasViewportRequestDetail | undefined)?.viewport;
  if (requested === undefined) throw new Error("Viewport request missing");
  expect([requested.x, requested.y, requested.scale].every(Number.isFinite)).toBe(true);
  expect(requested.scale).toBeGreaterThan(0);
  return requested;
}

async function tabGroup(fixture: Fixture, reverse = false): Promise<(string | null)[]> {
  const start = reverse ? fixture.after : fixture.before;
  const exit = reverse ? fixture.before : fixture.after;
  start.focus();
  const seen: (string | null)[] = [];
  for (let step = 0; step < 12; step += 1) {
    await commands.press("Tab", reverse ? ["Shift"] : []);
    if (active() === exit) break;
    seen.push(focusId(fixture.canvas));
  }
  expect(active(), "native Tab reaches the neighboring control").toBe(exit);
  return seen.filter((id) => id !== null);
}

async function axButtons(): Promise<string[]> {
  return (await commands.axTree("workflow-canvas-host", "subtree"))
    .filter(({ role }) => role === "button").map(({ name }) => name);
}

afterEach(() => { document.body.replaceChildren(); });

function commandButton(canvas: OcelleWorkflowCanvas, name: string): HTMLButtonElement {
  const button = [...canvas.shadowRoot?.querySelectorAll("button") ?? []].find((candidate) => candidate.textContent.trim() === name);
  expect(button, `the canvas exposes the native ${name} command`).toBeInstanceOf(HTMLButtonElement);
  if (button === undefined) throw new Error("Canvas command missing");
  return button;
}

async function openCommands(canvas: OcelleWorkflowCanvas): Promise<void> {
  const summary = canvas.shadowRoot?.querySelector("summary");
  expect(summary?.textContent.trim(), "the native disclosure provides Canvas controls").toBe("Canvas controls");
  if (summary === undefined || summary === null) throw new Error("Canvas controls missing");
  summary.focus({ preventScroll: true });
  await commands.press("Enter");
  await expect.poll(() => canvas.shadowRoot?.querySelector("details[open] button")).toBeInstanceOf(HTMLButtonElement);
}

function mapOf(canvas: OcelleWorkflowCanvas): SVGSVGElement {
  const map = canvas.shadowRoot?.querySelector<SVGSVGElement>("svg.map");
  if (map === null || map === undefined) throw new Error("Workflow map missing");
  return map;
}

function reserveFixtureMapHeight(canvas: OcelleWorkflowCanvas, sheet: CSSStyleSheet): void {
  const relationships = canvas.shadowRoot?.querySelector(".relationships")?.getBoundingClientRect().height ?? 0;
  sheet.insertRule(`#canvas-frame, ${tag} { block-size: ${String(430 + relationships)}px; }`, sheet.cssRules.length);
}

function moveHandle(canvas: OcelleWorkflowCanvas, nodeId: string): SVGRectElement {
  const handle = mapOf(canvas).querySelector(`rect.move-handle[data-node-id="${nodeId}"]`);
  expect(handle, "the visible node has its own pointer-only layout affordance").toBeInstanceOf(SVGRectElement);
  if (!(handle instanceof SVGRectElement)) throw new Error("Workflow move handle missing");
  return handle;
}

function displayedOrigin(canvas: OcelleWorkflowCanvas, id: string): readonly [number, number] {
  const object = getNode(canvas, id)?.parentElement?.parentElement;
  if (!(object instanceof SVGForeignObjectElement)) throw new Error("Workflow face missing");
  return [object.x.baseVal.value, object.y.baseVal.value];
}

function alignedIncidents(canvas: OcelleWorkflowCanvas): void {
  const edges = [...mapOf(canvas).querySelectorAll<SVGPathElement>("path.edge")];
  const face = getNode(canvas, "publish")?.parentElement;
  const object = face?.parentElement;
  if (!(object instanceof SVGForeignObjectElement)) throw new Error("Workflow face missing");
  const [x, y] = displayedOrigin(canvas, "publish");
  const incoming = edges[0]?.getPointAtLength(edges[0].getTotalLength());
  const outgoing = edges[2]?.getPointAtLength(0);
  expect(incoming?.x).toBeCloseTo(x);
  expect(incoming?.y).toBeCloseTo(y + object.height.baseVal.value / 2);
  expect(outgoing?.x).toBeCloseTo(x + object.width.baseVal.value);
  expect(outgoing?.y).toBeCloseTo(y + object.height.baseVal.value / 2);
}

function presentationRequest(type: string, detail: unknown): Request {
  return { type, detail, bubbles: true, composed: true, cancelable: false };
}

async function arranging(): Promise<Fixture> {
  const fixture = await mount(true);
  const { canvas } = fixture;
  canvas.graph = {
    ...initialGraph, connections: [...initialGraph.connections, { sourceId: "publish", outcomeId: "approved", destinationId: "revise" }],
  };
  canvas.layout = [
    { nodeId: "review", x: 25, y: 35 },
    { nodeId: "publish", x: 135, y: 35 },
    { nodeId: "revise", x: 245, y: 35 },
  ];
  canvas.viewport = { x: 18, y: 24, scale: 2 };
  await settle(canvas);
  return fixture;
}

function elementCenter(element: Element) {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
}

async function previewMove(fixture: Fixture) {
  const { canvas } = fixture;
  const map = mapOf(canvas);
  const handle = moveHandle(canvas, "publish");
  let pointerId = -1;
  handle.addEventListener("pointerdown", (event) => { pointerId = event.pointerId; }, { once: true });
  const down = elementCenter(handle);
  const end = { x: down.x + 40, y: down.y - 20 };
  await commands.pointerPath([{ ...down, down: true }, end]);
  await settle(canvas);
  expect(map.hasPointerCapture(pointerId), "real pointer capture is active during the visible preview").toBe(true);
  expect(displayedOrigin(canvas, "publish")).toEqual([328, 74]);
  alignedIncidents(canvas);
  return { end, map, pointerId };
}

async function assertFitCentersEitherLimitingAxis(): Promise<void> {
  const { canvasFitViewport } = await import("../src/workflow-canvas-viewport.ts");
  expect(canvasFitViewport([
    { x: 60, y: 80, width: 30, height: 20 },
    { x: 10, y: -20, width: 20, height: 25 },
  ], 100, 80, 5)).toEqual({ x: 17.5, y: 15, scale: 0.5 });
  expect(canvasFitViewport([
    { x: -15, y: 20, width: 25, height: 25 },
    { x: 85, y: 40, width: 35, height: 30 },
  ], 100, 140, 10)).toEqual({ x: 16.75, y: 41.5, scale: 0.45 });
}

async function assertExactAndImpossibleFit(): Promise<void> {
  const { canvasFitViewport } = await import("../src/workflow-canvas-viewport.ts");
  const exact = { x: -5, y: 7, width: 64, height: 40 };
  expect(canvasFitViewport([exact], 80, 56, 8)).toEqual({ x: 13, y: 1, scale: 1 });
  expect(canvasFitViewport([{ ...exact, width: 65 }], 80, 56, 8)).toBeNull();
  expect(canvasFitViewport([{ x: 0, y: 0, width: 20, height: 20 }, { ...exact, x: 12 }], 80, 56, 8)).toBeNull();
  expect(canvasFitViewport([{ ...exact, width: Number.NaN }], 80, 56, 8)).toBeNull();
  expect(canvasFitViewport([], 80, 56, 8)).toBeNull();
}

async function assertMeasuredCaptureFrame(): Promise<void> {
  const { canvasGestureFrame, sameCanvasGestureFrame } = await import("../src/workflow-canvas-viewport.ts");
  const map = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  Object.assign(map.style, { display: "block", width: "80px", height: "60px" });
  document.body.append(map);
  const initial = canvasGestureFrame(map);
  expect(initial).toMatchObject({ width: 80, height: 60 });
  if (initial === null) throw new Error("The visible SVG needs a capture frame");
  expect(sameCanvasGestureFrame(initial, map)).toBe(true);

  map.style.width = "0px";
  expect(canvasGestureFrame(map)).toBeNull();
  expect(sameCanvasGestureFrame(initial, map)).toBe(false);
  map.style.width = "80px";
  map.style.height = "0px";
  expect(canvasGestureFrame(map)).toBeNull();
  expect(sameCanvasGestureFrame(initial, map)).toBe(false);
  map.style.height = "60px";
  map.style.transform = "scaleX(0)";
  expect(canvasGestureFrame(map)).toBeNull();
  expect(sameCanvasGestureFrame(initial, map)).toBe(false);
}

async function assertNativeCaptureLoss(): Promise<void> {
  const fixture = await arranging();
  const { canvas, requests } = fixture;
  const { end, map, pointerId } = await previewMove(fixture);
  map.dispatchEvent(new PointerEvent("lostpointercapture", { pointerId: pointerId + 1 }));
  await settle(canvas);
  expect(displayedOrigin(canvas, "publish")).toEqual([328, 74]);
  expect(map.hasPointerCapture(pointerId)).toBe(true);
  const lost: number[] = [];
  const ownRelease = vi.spyOn(map, "releasePointerCapture");
  map.addEventListener("lostpointercapture", (event) => { lost.push(event.pointerId); });
  map.releasePointerCapture(pointerId);
  await commands.pointerPath([end]);
  await expect.poll(() => displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  expect(lost).toEqual([pointerId]);
  expect(ownRelease.mock.calls).toEqual([[pointerId]]);
  ownRelease.mockRestore();
  await commands.pointerPath([{ ...end, up: true }]);
  expect(requests).toEqual([]);
}

async function assertDisconnectEndsCapture(): Promise<void> {
  const listeners = vi.spyOn(document, "addEventListener");
  const fixture = await arranging();
  const { canvas, frame, requests } = fixture;
  const options = listeners.mock.calls.find(([type]) => type === "keydown")?.[2];
  listeners.mockRestore();
  const signal = typeof options === "object" ? options.signal : undefined;
  expect(signal?.aborted).toBe(false);
  const { end, map, pointerId } = await previewMove(fixture);
  const cancelFrame = vi.spyOn(window, "cancelAnimationFrame");
  canvas.remove();
  const canceledFrames = cancelFrame.mock.calls;
  cancelFrame.mockRestore();
  expect(signal?.aborted).toBe(true);
  expect(canceledFrames).toHaveLength(1);
  expect(map.hasPointerCapture(pointerId)).toBe(false);
  frame.append(canvas);
  await commands.pointerPath([{ ...end, up: true }]);
  await settle(canvas);
  expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  expect(requests).toEqual([]);
}

async function assertRepeatedPointerDown(): Promise<void> {
  const fixture = await arranging();
  const { canvas, requests } = fixture;
  const { end, map, pointerId } = await previewMove(fixture);
  map.dispatchEvent(new PointerEvent("pointerdown", { pointerId, isPrimary: true, button: 0, clientX: end.x, clientY: end.y }));
  await settle(canvas);
  expect(displayedOrigin(canvas, "publish")).toEqual([328, 74]);
  await commands.pointerPath([{ ...end, up: true }]);
  await settle(canvas);
  expect(requests).toEqual([presentationRequest(position, { nodeId: "publish", position: { x: 155, y: 25 } })]);
}

async function assertBubblingAfterFrameChange(): Promise<void> {
  const fixture = await arranging();
  const { canvas, pane, sheet, requests } = fixture;
  sheet.insertRule("#canvas-pane { block-size: 330px; }", sheet.cssRules.length);
  await settle(canvas);
  const { end, map, pointerId } = await previewMove(fixture);
  pane.addEventListener("pointermove", () => { pane.scrollTop = 28; }, { capture: true, once: true });
  const stillCaptured: boolean[] = [];
  pane.addEventListener("pointermove", () => { stillCaptured.push(map.hasPointerCapture(pointerId)); }, { once: true });
  await commands.pointerPath([{ x: end.x + 5, y: end.y }]);
  expect(stillCaptured).toEqual([false]);
  await expect.poll(() => displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  await commands.pointerPath([{ x: end.x + 5, y: end.y, up: true }]);
  expect(requests).toEqual([]);
}

async function assertEscapeHandling(): Promise<void> {
  const fixture = await arranging();
  const { canvas, requests } = fixture;
  const escaped: boolean[] = [];
  document.addEventListener("keydown", (event) => { escaped.push(event.defaultPrevented); }, { once: true });
  await commands.press("Escape");
  const { end, map, pointerId } = await previewMove(fixture);
  document.addEventListener("keydown", (event) => { escaped.push(event.defaultPrevented); }, { once: true });
  await commands.press("Shift");
  expect(map.hasPointerCapture(pointerId)).toBe(true);
  expect(displayedOrigin(canvas, "publish")).toEqual([328, 74]);
  document.addEventListener("keydown", (event) => { escaped.push(event.defaultPrevented); }, { once: true });
  await commands.press("Escape");
  await expect.poll(() => displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  expect(escaped).toEqual([false, false, true]);
  await commands.pointerPath([{ ...end, up: true }]);
  expect(requests).toEqual([]);
}

async function assertStaleModeAtPointerStart(): Promise<void> {
  const { canvas, pane, requests } = await arranging();
  const handle = moveHandle(canvas, "publish");
  const origin = elementCenter(handle);
  const map = mapOf(canvas);
  const nativeHits: boolean[] = [];
  const setCapture = vi.spyOn(map, "setPointerCapture");
  pane.addEventListener("pointerdown", (event) => {
    nativeHits.push(event.isTrusted && event.composedPath().includes(handle));
    canvas.mode = "read-only";
  }, { capture: true, once: true });
  await commands.pointerPath([{ ...origin, down: true }, { x: origin.x + 40, y: origin.y - 20 }]);
  const captures = setCapture.mock.calls;
  setCapture.mockRestore();
  await settle(canvas);
  expect(nativeHits).toEqual([true]);
  expect(captures).toEqual([]);
  expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  expect(map.querySelectorAll(".move-handle")).toHaveLength(0);
  await commands.pointerPath([{ x: origin.x + 40, y: origin.y - 20, up: true }]);
  expect(requests).toEqual([]);
}

async function assertLivePointerAdmission(invalidated: "clip" | "graph"): Promise<void> {
  const { canvas, pane, sheet, requests } = await arranging();
  const handle = moveHandle(canvas, "publish");
  const down = elementCenter(handle);
  const end = { x: down.x + 40, y: down.y - 20 };
  const map = mapOf(canvas);
  const nativeHits: boolean[] = [];
  const setCapture = vi.spyOn(map, "setPointerCapture");
  pane.addEventListener("pointerdown", (event) => {
    nativeHits.push(event.isTrusted && event.composedPath().includes(handle));
    if (invalidated === "clip") {
      // CSSOM changes the hit geometry without a host attribute mutation.
      sheet.insertRule("#canvas-pane { clip-path: inset(0 45% 0 0); }", sheet.cssRules.length);
    } else {
      canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "publish") };
    }
  }, { capture: true, once: true });
  await commands.pointerPath([{ ...down, down: true }, end, { ...end, up: true }]);
  const captures = setCapture.mock.calls;
  setCapture.mockRestore();
  await settle(canvas);
  expect(nativeHits).toEqual([true]);
  expect(captures).toEqual([]);
  expect(requests).toEqual([]);
  expect(canvas.layout.find(({ nodeId }) => nodeId === "publish")).toEqual({ nodeId: "publish", x: 135, y: 35 });
}

async function assertSingleAxisDrag(dx: number, dy: number, next: { x: number; y: number }): Promise<void> {
  const { canvas, requests } = await arranging();
  const down = elementCenter(moveHandle(canvas, "publish"));
  const end = { x: down.x + dx, y: down.y + dy };
  await commands.pointerPath([{ ...down, down: true }, end, { ...end, up: true }]);
  await settle(canvas);
  expect(requests).toEqual([presentationRequest(position, { nodeId: "publish", position: next })]);
  expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
}

async function assertNonPanningPointerInputs(): Promise<void> {
  const { canvas, requests } = await arranging();
  const map = mapOf(canvas);
  const bounds = map.getBoundingClientRect();
  const origin = { x: bounds.right - 50, y: bounds.bottom - 75 };
  await commands.pointerPath([{ ...origin, down: true, up: true }]);
  await commands.pointerPath([{ ...origin, down: true, button: "right" }, { x: origin.x - 32, y: origin.y + 24, up: true, button: "right" }]);
  await settle(canvas);
  expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  expect(requests).toEqual([]);
}

async function assertSeparateHandleCoverage(cover: "pane clip" | "later card"): Promise<void> {
  const { canvas, sheet, requests } = await arranging();
  if (cover === "pane clip") {
    sheet.insertRule("#canvas-pane { inline-size: 480px; }", sheet.cssRules.length);
  } else {
    canvas.layout = canvas.layout.map((entry) => entry.nodeId === "revise" ? { ...entry, x: 231 } : entry);
  }
  await settle(canvas);
  const handle = moveHandle(canvas, "publish");
  const publish = action(canvas, "publish");
  publish.focus({ preventScroll: true });
  expect(active()).toBe(publish);
  expect(getComputedStyle(handle).visibility).toBe("hidden");
  const bounds = handle.getBoundingClientRect();
  expect(canvas.shadowRoot?.elementFromPoint(bounds.left + 2, bounds.top + 2)).not.toBe(handle);
  expect(requests).toEqual([]);
}

async function assertMoveHandleFocusInsetCoverage(): Promise<void> {
  const fixture = await arranging();
  const { canvas, pane, sheet, requests } = fixture;
  canvas.viewport = initialViewport;
  canvas.selectedNodeId = "review";
  canvas.layout = [{ nodeId: "review", x: 330, y: 100 }, { nodeId: "publish", x: 80, y: 100 }];
  await settle(canvas);
  const review = action(canvas, "review");
  const publish = action(canvas, "publish");
  const publishHandle = moveHandle(canvas, "publish");
  const reviewObject = getNode(canvas, "review")?.closest("foreignObject");
  const publishObject = getNode(canvas, "publish")?.closest("foreignObject");
  const marker = reviewObject?.nextElementSibling;
  if (!(marker instanceof SVGRectElement) || publishObject == null) throw new Error("The fixture needs both painted cards and the focus bounds");
  const button = review.getBoundingClientRect();
  const outline = marker.getBoundingClientRect();
  const gap = (button.left - outline.left) / 2;
  expect(gap).toBeGreaterThan(0);
  review.focus({ preventScroll: true });
  expect(active()).toBe(review);
  const graph = canvas.graph;
  const layout = [
    { nodeId: "review", x: 330, y: 100 },
    { nodeId: "publish", x: 80 + outline.left + gap - publishHandle.getBoundingClientRect().right, y: 100 },
  ];
  const clipLeft = outline.left - pane.getBoundingClientRect().left - 1;
  const clipRule = sheet.insertRule(`#canvas-pane { clip-path: inset(0 0 0 ${String(clipLeft)}px); }`, sheet.cssRules.length);
  canvas.layout = layout;
  await settle(canvas);
  expect(getComputedStyle(publishHandle).visibility).toBe("hidden");
  expect(active()).toBe(review);
  expect(await axButtons()).toContain("Initial review");
  expect(requests).toEqual([]);

  sheet.deleteRule(clipRule);
  await expect.poll(() => publishHandle.hasAttribute("data-ready")).toBe(true);
  const handle = publishHandle.getBoundingClientRect();
  expect(publishObject.getBoundingClientRect().right).toBeLessThan(outline.left);
  expect(handle.right).toBeGreaterThan(outline.left);
  expect(handle.right).toBeLessThan(button.left);
  expect(publishHandle.hasAttribute("data-ready")).toBe(true);
  expect(canvas.shadowRoot?.elementFromPoint(outline.left + gap / 2, handle.top + handle.height / 2)).toBe(publishHandle);
  expect(active(), "a ready later Move handle covering only the focus inset recovers to Publish").toBe(publish);
  expect(await axButtons()).not.toContain("Initial review");
  expect(requests).toEqual([]);
  expect([pane.scrollLeft, pane.scrollTop]).toEqual([0, 0]);

  await askReveal(canvas, "review");
  await settle(canvas);
  expect(active()).toBe(review);
  expect(await axButtons()).toContain("Initial review");
  expect(publishHandle.hasAttribute("data-ready")).toBe(false);
  expect(canvas.graph).toBe(graph);
  expect(canvas.layout).toBe(layout);
  expect(canvas.selectedNodeId).toBe("review");
  expect([pane.scrollLeft, pane.scrollTop]).toEqual([0, 0]);
  expect(requests).toEqual([]);
  await commands.press("Enter");
  expect(requests).toEqual([selectRequest("review")]);
}

async function assertMoveStrokeCoverage(edge: "horizontal" | "vertical" | "above" | "corner"): Promise<void> {
  const { canvas, pane, sheet, requests } = await arranging();
  sheet.insertRule("#canvas-frame { transform: scale(1.5, 1.75); transform-origin: left top; }", sheet.cssRules.length);
  sheet.insertRule("#canvas-pane { block-size: 620px; }", sheet.cssRules.length);
  canvas.viewport = initialViewport;
  canvas.selectedNodeId = "review";
  canvas.layout = [{ nodeId: "review", x: 260, y: 100 }, { nodeId: "publish", x: 45, y: 100 }];
  await settle(canvas);
  const review = action(canvas, "review");
  const publish = action(canvas, "publish");
  const handle = moveHandle(canvas, "publish");
  const marker = getNode(canvas, "review")?.closest("foreignObject")?.nextElementSibling;
  const card = getNode(canvas, "publish")?.closest("foreignObject");
  const matrix = mapOf(canvas).getScreenCTM();
  if (!(marker instanceof SVGRectElement) || card == null || matrix === null) throw new Error("The transformed fixture needs both card layers");
  const outline = marker.getBoundingClientRect();
  const before = handle.getBoundingClientRect();
  const stroke = Number.parseFloat(getComputedStyle(handle).strokeWidth) / 2;
  const strokeX = stroke * matrix.a;
  const strokeY = stroke * matrix.d;
  const hit = {
    horizontal: { x: outline.left + strokeX / 10, y: before.top + before.height / 2 },
    vertical: { x: outline.left + 10, y: outline.bottom - strokeY / 10 },
    above: { x: outline.left + 10, y: outline.top + strokeY / 10 },
    corner: { x: outline.right - strokeX / 10, y: outline.bottom - strokeY / 10 },
  }[edge];
  const place = (factor: number) => {
    const target = {
      horizontal: { left: outline.left - before.width - strokeX * factor, top: before.top },
      vertical: { left: outline.left - 8, top: outline.bottom + strokeY * factor },
      above: { left: outline.left - 8, top: outline.top - before.height - strokeY * factor },
      corner: { left: outline.right + strokeX * factor, top: outline.bottom + strokeY * factor },
    }[edge];
    canvas.layout = [
      { nodeId: "review", x: 260, y: 100 },
      { nodeId: "publish", x: 45 + (target.left - before.left) / matrix.a, y: 100 + (target.top - before.top) / matrix.d },
    ];
  };
  review.focus({ preventScroll: true });
  expect(active()).toBe(review);

  place(1.5);
  await settle(canvas);
  expect(handle.hasAttribute("data-ready")).toBe(true);
  expect(canvas.shadowRoot?.elementFromPoint(hit.x, hit.y)).not.toBe(handle);
  expect(active()).toBe(review);

  place(0.8);
  await settle(canvas);
  const fill = handle.getBoundingClientRect();
  const cardBounds = card.getBoundingClientRect();
  const gaps = {
    horizontal: [outline.left - fill.right, outline.left - cardBounds.right],
    vertical: [fill.top - outline.bottom, cardBounds.top - outline.bottom],
    above: [outline.top - fill.bottom, outline.left - cardBounds.right],
    corner: [fill.left - outline.right, fill.top - outline.bottom, cardBounds.top - outline.bottom],
  }[edge];
  expect(gaps.every((gap) => gap > 0)).toBe(true);
  expect(handle.hasAttribute("data-ready")).toBe(true);
  expect(canvas.shadowRoot?.elementFromPoint(hit.x, hit.y)).toBe(handle);
  expect(active(), "the browser-painted SVG stroke alone covers the focus inset").toBe(publish);
  expect(await axButtons()).not.toContain("Initial review");
  expect([pane.scrollLeft, pane.scrollTop]).toEqual([0, 0]);
  expect(requests).toEqual([]);
}

async function assertPanelCoverageRecovery(): Promise<void> {
  const { canvas, requests } = await arranging();
  const publish = action(canvas, "publish");
  const face = getNode(canvas, "publish")?.parentElement;
  expect(face?.inert).toBe(false);
  await openCommands(canvas);
  await expect.poll(() => face?.inert).toBe(true);
  const summary = canvas.shadowRoot?.querySelector("summary");
  summary?.focus({ preventScroll: true });
  await commands.press("Enter");
  await expect.poll(() => face?.inert).toBe(false);
  publish.focus({ preventScroll: true });
  expect(active()).toBe(publish);
  expect(action(canvas, "publish")).toBe(publish);
  expect(requests).toEqual([]);
}

async function assertStaleFrameAtPointerRelease(change: "view" | "scroll"): Promise<void> {
  const fixture = await arranging();
  const { canvas, requests, pane, sheet } = fixture;
  sheet.insertRule("#canvas-pane { block-size: 330px; }", sheet.cssRules.length);
  await settle(canvas);
  const { end } = await previewMove(fixture);
  pane.addEventListener("pointerup", () => {
    if (change === "view") canvas.viewport = { ...canvas.viewport };
    else pane.scrollTop = 28;
  }, { capture: true, once: true });
  await commands.pointerPath([{ ...end, up: true }]);
  await settle(canvas);
  expect(requests).toEqual([]);
  expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
}

async function assertConstrainedFit(axis: "width" | "height"): Promise<void> {
  const { canvas, requests, sheet } = await arranging();
  sheet.insertRule(`${tag} { ${axis === "width" ? "inline-size: 155px" : "block-size: 155px"}; }`, sheet.cssRules.length);
  const view = canvas.viewport;
  await settle(canvas);
  await openCommands(canvas);
  commandButton(canvas, "Fit graph").focus({ preventScroll: true });
  await commands.press("Enter");
  await settle(canvas);
  expect(requests).toEqual([]);
  expect(canvas.viewport).toBe(view);
  expect(active()).toBe(canvas.shadowRoot?.querySelector("summary"));
}

async function assertVerticallyLimitedFit(): Promise<void> {
  const { canvas, pane, requests } = await arranging();
  canvas.mode = "read-only";
  canvas.layout = [
    { nodeId: "review", x: 25, y: -300 },
    { nodeId: "publish", x: 30, y: 0 },
    { nodeId: "revise", x: 40, y: 325 },
  ];
  const graph = canvas.graph;
  const layout = canvas.layout;
  pane.addEventListener(viewport, (event) => {
    canvas.viewport = (event as CustomEvent<WorkflowCanvasViewportRequestDetail>).detail.viewport;
  });
  await settle(canvas);
  await openCommands(canvas);
  commandButton(canvas, "Fit graph").focus({ preventScroll: true });
  await commands.press("Enter");
  await settle(canvas);
  const fitted = lastViewport(requests);
  expect(fitted.scale).toBeLessThan(1);
  const bounds = mapOf(canvas).getBoundingClientRect();
  const cards = [...mapOf(canvas).querySelectorAll("foreignObject")].map((face) => face.getBoundingClientRect());
  for (const card of cards) {
    expect(card.left).toBeGreaterThan(bounds.left);
    expect(card.top).toBeGreaterThan(bounds.top);
    expect(card.right).toBeLessThan(bounds.right);
    expect(card.bottom).toBeLessThan(bounds.bottom);
  }
  const left = Math.min(...cards.map((card) => card.left));
  const right = Math.max(...cards.map((card) => card.right));
  expect((left + right) / 2).toBeCloseTo((bounds.left + bounds.right) / 2, 1);
  expect(requests).toEqual([presentationRequest(viewport, { viewport: fitted })]);
  expect(canvas.graph).toBe(graph);
  expect(canvas.layout).toBe(layout);
}

async function assertUnpositionedNumericMove(): Promise<void> {
  const { canvas, requests } = await arranging();
  canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId !== "publish");
  await settle(canvas);
  const { picker } = revealControls(canvas);
  picker.value = "publish";
  picker.dispatchEvent(new Event("change", { bubbles: true }));
  await settle(canvas);
  await openCommands(canvas);
  expect(commandButton(canvas, "Move step").disabled).toBe(true);
  expect(mapOf(canvas).querySelector('.move-handle[data-node-id="publish"]')).toBeNull();
  const fields = [...canvas.shadowRoot?.querySelectorAll<HTMLInputElement>("form input") ?? []];
  expect(fields.map(({ disabled, value }) => ({ disabled, value }))).toEqual([
    { disabled: true, value: "" }, { disabled: true, value: "" },
  ]);
  expect(requests).toEqual([]);
}

async function assertStaleModeAtFormSubmit(): Promise<void> {
  const { canvas, pane, requests } = await arranging();
  const supplied = canvas.layout;
  await openCommands(canvas);
  const form = canvas.shadowRoot?.querySelector("form");
  const x = form?.querySelector<HTMLInputElement>('input[name="x"]');
  if (form === null || form === undefined || x === null || x === undefined) throw new Error("The move form is missing");
  x.value = "140";
  form.addEventListener("submit", () => { canvas.mode = "read-only"; }, { capture: true, once: true });
  commandButton(canvas, "Move step").focus({ preventScroll: true });
  await commands.press("Enter");
  await settle(canvas);
  expect(canvas.mode).toBe("read-only");
  expect(canvas.layout).toBe(supplied);
  expect(action(canvas, "review")).toBe(active());
  expect([pane.scrollLeft, pane.scrollTop]).toEqual([0, 0]);
  expect(requests).toEqual([]);
}

async function assertStaleNamedPositionInput(): Promise<void> {
  const { canvas, requests } = await arranging();
  const supplied = canvas.layout;
  const { picker } = revealControls(canvas);
  picker.value = "publish";
  picker.dispatchEvent(new Event("change", { bubbles: true }));
  await settle(canvas);
  await openCommands(canvas);
  const move = commandButton(canvas, "Move step");
  const form = move.form;
  const x = form?.querySelector<HTMLInputElement>('input[name="x"]');
  const y = form?.querySelector<HTMLInputElement>('input[name="y"]');
  if (form === null || x === null || x === undefined || y === null || y === undefined) throw new Error("The move form is missing");
  x.value = "";
  y.value = "35";
  form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  x.value = "136";
  y.value = "";
  form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  expect(requests).toEqual([]);
  expect([x.value, y.value]).toEqual(["135", "35"]);

  x.value = "136";
  form.addEventListener("submit", () => {
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "publish") };
  }, { capture: true, once: true });
  move.focus({ preventScroll: true });
  await commands.press("Enter");
  await settle(canvas);
  expect(canvas.layout).toBe(supplied);
  expect(form.isConnected).toBe(false);
  expect(picker.value).toBe("review");
  expect(requests, "the removed Move step subject cannot submit coordinates for another step").toEqual([]);
}

async function assertOverflowingZoom(): Promise<void> {
  const { canvas, requests } = await arranging();
  const supplied = { x: Number.MAX_VALUE, y: 0, scale: 1 };
  canvas.viewport = supplied;
  await settle(canvas);
  await openCommands(canvas);
  const button = commandButton(canvas, "Zoom in");
  button.focus({ preventScroll: true });
  await commands.press("Enter");
  await settle(canvas);
  expect(requests).toEqual([]);
  expect(canvas.viewport).toBe(supplied);
  expect(active()).toBe(button);
}

async function assertNarrowFitWithSelfLoop(): Promise<void> {
  const { canvas, pane, sheet, requests } = await arranging();
  const review = initialGraph.nodes[0];
  if (review === undefined) throw new Error("The fixture needs its initial review step");
  canvas.mode = "read-only";
  canvas.graph = {
    nodes: [review],
    connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "review" }],
  };
  canvas.layout = [{ nodeId: "review", x: 25, y: 35 }];
  const graph = canvas.graph;
  const layout = canvas.layout;
  pane.addEventListener(viewport, (event) => {
    canvas.viewport = (event as CustomEvent<WorkflowCanvasViewportRequestDetail>).detail.viewport;
  });
  await settle(canvas);
  const map = mapOf(canvas);
  const object = map.querySelector("foreignObject");
  if (object === null) throw new Error("The mounted card is missing");
  const measured = object.getBBox();
  const width = Math.ceil(measured.width + measured.height / 2 + 20);
  sheet.insertRule(`#canvas-pane, #canvas-frame, ${tag} { inline-size: ${String(width)}px; }`, sheet.cssRules.length);
  await settle(canvas);
  await openCommands(canvas);
  commandButton(canvas, "Fit graph").focus({ preventScroll: true });
  await commands.press("Enter");
  await settle(canvas);
  const fitted = lastViewport(requests);
  const routed = map.querySelector<SVGPathElement>("path.edge")?.getBBox();
  expect(fitted.x).toBeCloseTo((width - measured.width - measured.height / 2) / 2 - 25);
  expect(routed?.x).toBeGreaterThan(0);
  expect((routed?.x ?? 0) + (routed?.width ?? 0)).toBeLessThan(map.clientWidth);
  expect(requests).toEqual([presentationRequest(viewport, { viewport: fitted })]);
  expect(canvas.graph).toBe(graph);
  expect(canvas.layout).toBe(layout);
}

async function assertReleasedBeforeFrame(canvas: OcelleWorkflowCanvas, map: SVGSVGElement, pointerId: number): Promise<void> {
  await canvas.updateComplete;
  expect(map.hasPointerCapture(pointerId)).toBe(false);
}

async function assertSharedCommandSurvivesModeSwitch(fixture: Fixture, scroll: readonly number[]): Promise<void> {
  const { canvas, pane, requests } = fixture;
  await openCommands(canvas);
  const shared = commandButton(canvas, "Pan left");
  shared.focus({ preventScroll: true });
  expect(canvas.shadowRoot?.querySelector("form")).toBeNull();
  canvas.mode = "author";
  await settle(canvas);
  canvas.mode = "read-only";
  await settle(canvas);
  expect(active()).toBe(shared);
  expect(canvas.shadowRoot?.querySelector("form")).toBeNull();
  expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  expect(requests).toEqual([]);
}

async function assertStationaryCancellation(cause: "viewport" | "graph" | "width" | "height" | "transform"): Promise<void> {
  const fixture = await arranging();
  const { canvas, pane, sheet, requests } = fixture;
  sheet.insertRule("#canvas-pane { block-size: 330px; }", sheet.cssRules.length);
  await settle(canvas);
  const { end, map, pointerId } = await previewMove(fixture);
  if (cause === "viewport") canvas.viewport = { ...canvas.viewport };
  if (cause === "graph") canvas.graph = { ...canvas.graph };
  if (cause === "width") sheet.insertRule(`${tag} { inline-size: 690px; }`, sheet.cssRules.length);
  if (cause === "height") sheet.insertRule(`${tag} { block-size: 408px; }`, sheet.cssRules.length);
  if (cause === "transform") sheet.insertRule("#canvas-frame { transform: translateX(3px); }", sheet.cssRules.length);
  const supplied = { graph: canvas.graph, layout: canvas.layout, viewport: canvas.viewport };
  await expect.poll(() => displayedOrigin(canvas, "publish")).toEqual([288, 94]);
  expect(map.hasPointerCapture(pointerId)).toBe(false);
  alignedIncidents(canvas);
  expect(pane.scrollTop).toBe(0);
  expect(requests).toEqual([]);
  await commands.pointerPath([{ ...end, up: true }]);
  await settle(canvas);
  expect(requests).toEqual([]);
  expect(canvas.graph).toBe(supplied.graph);
  expect(canvas.layout).toBe(supplied.layout);
  expect(canvas.viewport).toBe(supplied.viewport);
}

describe("workflow canvas arranging in process", () => {
  it.each([
    { name: "selected and synchronously accepted", selected: "publish", accept: true, displayed: [328, 74] },
    { name: "unselected and withheld", selected: "review", accept: false, displayed: [288, 94] },
  ])("drags a $name step at a translated scale of two", async ({ selected, accept, displayed }) => {
    const fixture = await arranging();
    const { canvas, requests, pane } = fixture;
    canvas.selectedNodeId = selected;
    await settle(canvas);
    const originalGraph = canvas.graph;
    const originalLayout = canvas.layout;
    const originalNode = action(canvas, "publish");
    const expected = { nodeId: "publish", position: { x: 155, y: 25 } };
    pane.addEventListener(position, () => {
      if (accept) canvas.layout = originalLayout.map((node) => node.nodeId === expected.nodeId ? { ...node, ...expected.position } : node);
    });

    const map = mapOf(canvas);
    let pointerId = -1;
    map.addEventListener("pointerdown", (event) => { pointerId = event.pointerId; }, { once: true });
    const { end } = await previewMove(fixture);
    expect(pointerId).toBeGreaterThanOrEqual(0);
    const capturedAtDispatch: boolean[] = [];
    pane.addEventListener(position, () => { capturedAtDispatch.push(map.hasPointerCapture(pointerId)); });
    expect(canvas.layout).toBe(originalLayout);
    expect(requests).toEqual([]);
    const cancelFrame = vi.spyOn(window, "cancelAnimationFrame");
    await commands.pointerPath([{ ...end, up: true }]);
    const canceledFrames = cancelFrame.mock.calls;
    cancelFrame.mockRestore();
    expect(canceledFrames).toHaveLength(1);
    await settle(canvas);
    expect(requests).toEqual([presentationRequest(position, expected)]);
    expect(capturedAtDispatch).toEqual([false]);
    expect(displayedOrigin(canvas, "publish")).toEqual(displayed);
    alignedIncidents(canvas);
    expect(action(canvas, "publish")).toBe(originalNode);
    expect(canvas.graph).toBe(originalGraph);
    expect(canvas.selectedNodeId).toBe(selected);
    expect(canvas.viewport).toEqual({ x: 18, y: 24, scale: 2 });

    if (accept) {
      await assertNativeCaptureLoss();
      await assertLivePointerAdmission("clip");
      await assertSingleAxisDrag(40, 0, { x: 155, y: 35 });
      await assertSeparateHandleCoverage("pane clip");
      await assertMoveHandleFocusInsetCoverage();
    } else {
      await assertRepeatedPointerDown();
      await assertDisconnectEndsCapture();
      await assertLivePointerAdmission("graph");
      await assertSingleAxisDrag(0, -20, { x: 135, y: 25 });
      await assertSeparateHandleCoverage("later card");
      await assertMoveStrokeCoverage("horizontal");
      await assertMoveStrokeCoverage("vertical");
      await assertMoveStrokeCoverage("above");
      await assertMoveStrokeCoverage("corner");
    }
  });

  it.each(["scroll", "mode", "Escape", "layout"] as const)("clears a captured move before further pointer input after %s", async (cause) => {
    const fixture = await arranging();
    const { canvas, pane, sheet, requests } = fixture;
    sheet.insertRule("#canvas-pane { block-size: 330px; }", sheet.cssRules.length);
    await settle(canvas);
    const { end, map, pointerId } = await previewMove(fixture);
    if (cause === "scroll") pane.scrollTop = 28;
    if (cause === "mode") canvas.mode = "read-only";
    if (cause === "Escape") await commands.press("Escape");
    if (cause === "layout") canvas.layout = [...canvas.layout];
    const supplied = { graph: canvas.graph, layout: canvas.layout, viewport: canvas.viewport };
    if (cause === "mode" || cause === "layout") await assertReleasedBeforeFrame(canvas, map, pointerId);
    await expect.poll(() => displayedOrigin(canvas, "publish")).toEqual([288, 94]);
    expect(map.hasPointerCapture(pointerId)).toBe(false);
    alignedIncidents(canvas);
    expect(pane.scrollTop).toBe(cause === "scroll" ? 28 : 0);
    expect(requests).toEqual([]);
    await commands.pointerPath([{ ...end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([]);
    expect(canvas.graph).toBe(supplied.graph);
    expect(canvas.layout).toBe(supplied.layout);
    expect(canvas.viewport).toBe(supplied.viewport);

    if (cause === "scroll") {
      await assertStationaryCancellation("width");
      await assertStationaryCancellation("height");
      await assertStationaryCancellation("transform");
      await assertMeasuredCaptureFrame();
      await assertBubblingAfterFrameChange();
    }
    if (cause === "mode") await assertStaleModeAtPointerStart();
    if (cause === "Escape") await assertEscapeHandling();
    if (cause === "layout") {
      await assertStationaryCancellation("viewport");
      await assertStationaryCancellation("graph");
    }
  });

  it("checks read-only at the native release while the old handle is still painted", async () => {
    const fixture = await arranging();
    const { canvas, requests, pane } = fixture;
    const { end } = await previewMove(fixture);
    pane.addEventListener("pointerup", () => { canvas.mode = "read-only"; }, { capture: true, once: true });
    await commands.pointerPath([{ ...end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([]);
    expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
    expect(mapOf(canvas).querySelectorAll(".move-handle")).toHaveLength(0);

    await assertStaleFrameAtPointerRelease("view");
    await assertStaleFrameAtPointerRelease("scroll");
  });

  it("pans the read-only map background and previews only presentation", async () => {
    const { canvas, requests } = await arranging();
    const graph = canvas.graph;
    const layout = canvas.layout;
    canvas.mode = "read-only";
    await settle(canvas);
    const map = mapOf(canvas);
    const { right, bottom } = map.getBoundingClientRect();
    const down = { x: right - 8, y: bottom - 55 };
    expect(canvas.shadowRoot?.elementFromPoint(down.x, down.y)).toBe(map);
    const end = { x: down.x - 32, y: down.y + 24 };
    await commands.pointerPath([{ ...down, down: true }, end]);
    await settle(canvas);
    expect(displayedOrigin(canvas, "publish"), "the pannable background paints its temporary viewport").toEqual([256, 118]);
    expect(requests).toEqual([]);
    await commands.pointerPath([{ ...end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([presentationRequest(viewport, { viewport: { x: -14, y: 48, scale: 2 } })]);
    expect(displayedOrigin(canvas, "publish")).toEqual([288, 94]);
    expect(canvas.graph).toBe(graph);
    expect(canvas.layout).toBe(layout);

    await assertNonPanningPointerInputs();
  });

  it("uses native keyboard pan, zoom and Fit commands with exact host-owned requests", async () => {
    const { canvas, requests, pane, sheet } = await arranging();
    sheet.insertRule(`#canvas-pane, #canvas-frame, ${tag} { inline-size: 430px; block-size: 560px; }`, sheet.cssRules.length);
    canvas.layout = [
      { nodeId: "review", x: 25, y: 20 }, { nodeId: "publish", x: 435, y: 30 }, { nodeId: "revise", x: 260, y: 180 },
    ];
    canvas.viewport = { x: 18, y: 24, scale: 1 };
    const graph = canvas.graph;
    const layout = canvas.layout;
    pane.addEventListener(viewport, (event) => {
      canvas.viewport = (event as CustomEvent<WorkflowCanvasViewportRequestDetail>).detail.viewport;
    });
    await settle(canvas);
    await openCommands(canvas);
    const map = mapOf(canvas);
    const anchor = { x: map.clientWidth / 2, y: map.clientHeight / 2 };
    const poses = [
      { name: "Pan left", view: { x: -46, y: 24, scale: 1 } },
      { name: "Pan right", view: { x: 18, y: 24, scale: 1 } },
      { name: "Pan up", view: { x: 18, y: -40, scale: 1 } },
      { name: "Pan down", view: { x: 18, y: 24, scale: 1 } },
      { name: "Zoom in", view: { x: anchor.x - (anchor.x - 18) * 1.25, y: anchor.y - (anchor.y - 24) * 1.25, scale: 1.25 } },
      { name: "Zoom out", view: { x: 18, y: 24, scale: 1 } },
    ];
    const baseline = action(canvas, "review").getBoundingClientRect();
    for (const [index, { name, view }] of poses.entries()) {
      const button = commandButton(canvas, name);
      button.focus({ preventScroll: true });
      await commands.press("Enter");
      await settle(canvas);
      const { width, height } = button.getBoundingClientRect();
      const minimum = Number.parseFloat(getComputedStyle(button).minBlockSize);
      expect(Math.min(width, height)).toBeGreaterThanOrEqual(minimum);
      expect(active()).toBe(button);
      expect(requests).toEqual(poses.slice(0, index + 1).map(({ view }) => presentationRequest(viewport, { viewport: view })));
      expect(canvas.viewport).toEqual(view);
      expect(action(canvas, "review").getBoundingClientRect().height).toBe(baseline.height);
    }
    const fit = commandButton(canvas, "Fit graph");
    fit.focus({ preventScroll: true });
    await commands.press("Enter");
    await settle(canvas);
    const fitted = lastViewport(requests);
    expect(canvas.shadowRoot?.querySelector<HTMLDetailsElement>("details")?.open).toBe(false);
    expect(requests).toEqual([...poses.map(({ view }) => presentationRequest(viewport, { viewport: view })),
      presentationRequest(viewport, { viewport: fitted })]);
    const clip = map.getBoundingClientRect();
    for (const id of ["review", "publish", "revise"]) {
      const painted = action(canvas, id).getBoundingClientRect();
      expect(painted.left).toBeGreaterThan(clip.left);
      expect(painted.top).toBeGreaterThan(clip.top);
      expect(painted.right).toBeLessThan(clip.right);
      expect(painted.bottom).toBeLessThan(clip.bottom);
      expect(painted.height).toBe(baseline.height);
    }
    const footprints = [...map.querySelectorAll("foreignObject, .move-handle")].map((part) => part.getBoundingClientRect());
    const left = Math.min(...footprints.map((part) => part.left));
    const right = Math.max(...footprints.map((part) => part.right));
    expect((left + right) / 2).toBeCloseTo((clip.left + clip.right) / 2, 1);
    const visibleFocus = active()?.getBoundingClientRect();
    expect(visibleFocus?.width).toBeGreaterThan(0);
    expect(visibleFocus?.height).toBeGreaterThan(0);
    expect(canvas.graph).toBe(graph);
    expect(canvas.layout).toBe(layout);

    await assertFitCentersEitherLimitingAxis();
    await assertExactAndImpossibleFit();
    await assertConstrainedFit("width");
    await assertConstrainedFit("height");
    await assertVerticallyLimitedFit();
    await assertNarrowFitWithSelfLoop();
    await assertOverflowingZoom();
  });

  it("moves the named step without dragging and preserves the supplied layout after rejection", async () => {
    const { canvas, requests, pane } = await arranging();
    const graph = canvas.graph;
    const { picker } = revealControls(canvas);
    picker.value = "publish";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    await openCommands(canvas);
    const submit = commandButton(canvas, "Move step");
    const x = canvas.shadowRoot?.querySelector('input[name="x"]');
    const y = canvas.shadowRoot?.querySelector('input[name="y"]');
    expect(x, "the named step exposes a native absolute X input").toBeInstanceOf(HTMLInputElement);
    expect(y, "the named step exposes a native absolute Y input").toBeInstanceOf(HTMLInputElement);
    if (!(x instanceof HTMLInputElement) || !(y instanceof HTMLInputElement)) throw new Error("Position fields missing");
    expect([x.value, y.value, x.disabled, y.disabled]).toEqual(["135", "35", false, false]);
    submit.focus({ preventScroll: true });
    await commands.press("Enter");
    expect(requests).toEqual([]);
    const first = { nodeId: "publish", position: { x: 150, y: 45 } };
    pane.addEventListener(position, () => {
      canvas.layout = canvas.layout.map((node) => node.nodeId === first.nodeId ? { ...node, ...first.position } : node);
    }, { once: true });
    x.value = "150";
    y.value = "45";
    submit.focus({ preventScroll: true });
    await commands.press("Enter");
    await settle(canvas);
    expect(displayedOrigin(canvas, "publish")).toEqual([318, 114]);
    const accepted = canvas.layout;
    x.value = "161";
    y.value = "50";
    await commands.press("Enter");
    await settle(canvas);
    expect(requests).toEqual([presentationRequest(position, first),
      presentationRequest(position, { nodeId: "publish", position: { x: 161, y: 50 } })]);
    expect(displayedOrigin(canvas, "publish")).toEqual([318, 114]);
    expect(canvas.layout).toBe(accepted);
    expect(canvas.graph).toBe(graph);
    expect([x.value, y.value]).toEqual(["150", "45"]);
    y.value = "55";
    await commands.press("Enter");
    await settle(canvas);
    x.value = "160";
    await commands.press("Enter");
    await settle(canvas);
    expect(requests).toEqual([presentationRequest(position, first),
      presentationRequest(position, { nodeId: "publish", position: { x: 161, y: 50 } }),
      presentationRequest(position, { nodeId: "publish", position: { x: 150, y: 55 } }),
      presentationRequest(position, { nodeId: "publish", position: { x: 160, y: 45 } })]);
    expect(canvas.layout).toBe(accepted);
    alignedIncidents(canvas);

    picker.value = "revise";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    expect(x.isConnected).toBe(false);
    expect(y.isConnected).toBe(false);
    expect([...canvas.shadowRoot?.querySelectorAll<HTMLInputElement>("form input") ?? []].map(({ value }) => value)).toEqual(["245", "35"]);
    await assertUnpositionedNumericMove();
    await assertStaleNamedPositionInput();
  });

  it.each([
    { name: "the surviving subject", nodeId: "publish", hidden: [], expected: "publish" },
    { name: "the preceding visible step", nodeId: "revise", hidden: ["revise"], expected: "publish" },
    { name: "the named fallback", nodeId: "publish", hidden: ["review", "publish", "revise"], expected: null },
  ])("recovers to $name when leaving authoring with a focused Move step control", async ({ nodeId, hidden, expected }) => {
    const fixture = await arranging();
    const { canvas, requests, pane } = fixture;
    canvas.layout = canvas.layout.map((node) => hidden.includes(node.nodeId) ? { ...node, x: 1100 } : node);
    await settle(canvas);
    const { picker } = revealControls(canvas);
    picker.value = nodeId;
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    await openCommands(canvas);
    const move = commandButton(canvas, "Move step");
    move.focus({ preventScroll: true });
    expect(active()).toBe(move);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    canvas.mode = "read-only";
    canvas.mode = "author";
    await settle(canvas);
    expect(active()).toBe(move);
    canvas.mode = "read-only";
    await settle(canvas);
    expect(active()).toBe(expected === null ? picker : action(canvas, expected));
    expect(mapOf(canvas).querySelectorAll(".move-handle")).toHaveLength(0);
    expect([...canvas.shadowRoot?.querySelectorAll("button") ?? []].some((button) => button.textContent.trim() === "Move step")).toBe(false);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([]);

    if (expected === "publish" && nodeId === expected) await assertStaleModeAtFormSubmit();
    if (expected === null) await assertPanelCoverageRecovery();
    if (nodeId === "revise") await assertSharedCommandSurvivesModeSwitch(fixture, scroll);
  });
});

describe("workflow canvas in-process selection and navigation", () => {
  it("starts with the documented host-owned inputs and an available named navigator", async () => {
    await driver.mount("");
    const canvas = document.createElement(tag) as OcelleWorkflowCanvas;
    expect(canvas.graph).toEqual({ nodes: [], connections: [] });
    expect(canvas.layout).toEqual([]);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(canvas.selectedNodeId).toBeNull();
    expect(canvas.mode).toBe("read-only");
    document.body.append(canvas);
    await settle(canvas);

    const { picker, button } = revealControls(canvas);
    expect(picker.disabled).toBe(false);
    expect(picker.value).toBe("");
    expect([...picker.options]).toEqual([]);
    expect(button.disabled).toBe(true);
  });

  it("keeps host-owned canvas inputs as JavaScript properties when markup attributes change", async () => {
    await driver.mount("");
    const canvas = document.createElement(tag) as OcelleWorkflowCanvas;
    const graph = structuredClone(initialGraph);
    const layout = structuredClone(initialLayout);
    const viewport = { ...initialViewport };
    canvas.graph = graph;
    canvas.layout = layout;
    canvas.viewport = viewport;
    canvas.selectedNodeId = "publish";
    canvas.mode = "author";
    canvas.setAttribute("graph", '{"nodes":[],"connections":[]}');
    canvas.setAttribute("layout", "[]");
    canvas.setAttribute("viewport", '{"x":200,"y":20,"scale":2}');
    canvas.setAttribute("selectednodeid", "review");
    canvas.setAttribute("mode", "read-only");

    expect(canvas.graph).toBe(graph);
    expect(canvas.layout).toBe(layout);
    expect(canvas.viewport).toBe(viewport);
    expect(canvas.selectedNodeId).toBe("publish");
    expect(canvas.mode).toBe("author");
    const requests: string[] = [];
    for (const type of requestTypes) canvas.addEventListener(type, (event) => { requests.push(event.type); });
    document.body.append(canvas);
    await settle(canvas);
    expect(action(canvas, "publish").getAttribute("aria-pressed")).toBe("true");
    expect(requests).toEqual([]);
  });

  it("keeps the name of an unpositioned node and reflects every supplied node state once positioned", async () => {
    const { canvas, requests } = await mount();
    const [review, publish] = namedSteps;
    if (review === undefined || publish === undefined) throw new Error("The fixture needs two steps");
    canvas.graph = {
      nodes: [{ ...review, waiting: true, invalid: true, status: "Waiting for an approval" }, { ...publish, invalid: false }],
      connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "publish" }],
    };
    canvas.layout = [{ nodeId: "publish", x: 321, y: 20 }];
    canvas.selectedNodeId = "review";
    await settle(canvas);

    const named = revealControls(canvas);
    expect(named.picker.selectedOptions[0]?.textContent.trim()).toBe("Initial review");
    expect(named.picker.value).toBe("review");
    expect(named.button.disabled).toBe(true);
    expect(await axButtons()).not.toContain("Initial review");
    expect(canvas.shadowRoot?.querySelectorAll("svg path")).toHaveLength(0);
    const face = getNode(canvas, "review")?.parentElement;
    expect(face?.parentElement?.hasAttribute("hidden")).toBe(true);
    if (face === undefined || face === null) throw new Error("The unpositioned node must keep its DOM identity");
    const readHiddenBounds = vi.spyOn(face, "getBoundingClientRect");
    const readHiddenWidth = vi.spyOn(face, "offsetWidth", "get");
    try {
      window.dispatchEvent(new Event("resize"));
      expect(readHiddenBounds).not.toHaveBeenCalled();
      expect(readHiddenWidth).not.toHaveBeenCalled();
    } finally {
      readHiddenBounds.mockRestore();
      readHiddenWidth.mockRestore();
    }

    named.picker.value = "publish";
    named.picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    expect(named.button.disabled).toBe(false);
    named.picker.value = "review";
    named.picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    expect(named.button.disabled).toBe(true);
    named.button.dispatchEvent(new MouseEvent("click", { bubbles: true, composed: true }));
    expect(requests).toEqual([]);

    canvas.layout = [{ nodeId: "review", x: 30, y: 20 }, ...canvas.layout];
    await settle(canvas);

    const card = getNode(canvas, "review");
    expect(card).toMatchObject({ waiting: true, invalid: true, selected: true });
    expect(getNode(canvas, "publish")).toMatchObject({ waiting: false, invalid: false, selected: false });
    expect(card?.querySelector('[slot="status"]')?.textContent).toBe("Waiting for an approval");
    expect(await axButtons()).toContain("Initial review");
    expect(named.button.disabled).toBe(false);
    expect(canvas.shadowRoot?.querySelectorAll("svg path")).toHaveLength(1);
    expect(action(canvas, "review").getAttribute("aria-pressed")).toBe("true");
    expect(requests).toEqual([]);
  });

  it("anchors the rendered connection at both measured cards after a translated viewport update", async () => {
    const { canvas, requests } = await mount();
    canvas.graph = { ...initialGraph, connections: [
      { sourceId: "review", outcomeId: "approved", destinationId: "publish" },
    ] };
    const layout = [{ nodeId: "review", x: 30, y: 40 }, { nodeId: "publish", x: 275, y: 90 }];
    canvas.layout = layout;
    canvas.viewport = { x: 83, y: -22, scale: 1.25 };
    await settle(canvas);

    const map = canvas.shadowRoot?.querySelector("svg");
    const edge = map?.querySelector("path");
    const review = getNode(canvas, "review")?.getBoundingClientRect();
    const publish = getNode(canvas, "publish")?.getBoundingClientRect();
    const transform = map?.getScreenCTM();
    if (edge === undefined || edge === null || review === undefined || publish === undefined || transform === undefined || transform === null) {
      throw new Error("The real SVG connection and its two measured cards must be present");
    }
    const sourcePoint = edge.getPointAtLength(0);
    const destinationPoint = edge.getPointAtLength(edge.getTotalLength());
    const start = sourcePoint.matrixTransform(transform);
    const end = destinationPoint.matrixTransform(transform);
    expect(start.x).toBeCloseTo(review.right, 0);
    expect(start.y).toBeCloseTo((review.top + review.bottom) / 2, 0);
    expect(end.x).toBeCloseTo(publish.left, 0);
    expect(end.y).toBeCloseTo((publish.top + publish.bottom) / 2, 0);
    const route = edge.getBBox();
    expect(route.x).toBeCloseTo(Math.min(sourcePoint.x, destinationPoint.x), 0);
    expect(route.x + route.width).toBeCloseTo(Math.max(sourcePoint.x, destinationPoint.x), 0);
    expect(canvas.layout).toEqual(layout);
    expect(canvas.viewport).toEqual({ x: 83, y: -22, scale: 1.25 });
    expect(requests).toEqual([]);
  });

  it("reuses the projected graph on viewport-only updates and reads it for a new layout", async () => {
    const { canvas, requests } = await mount();
    let connectionReads = 0;
    canvas.graph = {
      nodes: initialGraph.nodes,
      get connections() {
        connectionReads += 1;
        return initialGraph.connections;
      },
    };
    await settle(canvas);
    const fromGraph = connectionReads;
    expect(fromGraph).toBeGreaterThan(0);

    canvas.viewport = { x: -40, y: 37, scale: 1.2 };
    await settle(canvas);
    expect(connectionReads).toBe(fromGraph);
    expect(canvas.shadowRoot?.querySelectorAll("svg path")).toHaveLength(2);

    canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId !== "revise");
    await settle(canvas);
    expect(connectionReads).toBeGreaterThan(fromGraph);
    expect(canvas.shadowRoot?.querySelectorAll("svg path")).toHaveLength(1);
    expect(requests).toEqual([]);
  });

  it("does not reuse an old measured SVG size when a removed step returns", async () => {
    const { canvas, requests } = await mount();
    const measuredSize = (nodeId: string) => {
      const box = getNode(canvas, nodeId)?.closest("foreignObject");
      return [box?.getAttribute("width"), box?.getAttribute("height")];
    };
    const old = measuredSize("review");
    const retainedSize = measuredSize("publish");
    expect(Number(old[0])).toBeGreaterThan(1);
    expect(Number(old[1])).toBeGreaterThan(1);
    canvas.graph = { nodes: initialGraph.nodes.filter(({ id }) => id !== "review"), connections: [] };
    await settle(canvas);
    expect(getNode(canvas, "review")).toBeUndefined();

    const firstRender: ReturnType<typeof measuredSize>[][] = [];
    const host = {
      hostUpdated: () => {
        firstRender.push([measuredSize("review"), measuredSize("publish")]);
        canvas.removeController(host);
      },
    };
    canvas.addController(host);
    canvas.graph = initialGraph;
    await settle(canvas);
    expect(firstRender).toHaveLength(1);
    expect(firstRender[0]?.[0]).not.toEqual(old);
    expect(firstRender[0]?.[1]).toEqual(retainedSize);
    expect(measuredSize("review")).toEqual(old);
    expect(requests).toEqual([]);
  });

  it("handles only unmodified navigation keys from a native node action", async () => {
    const { canvas, requests } = await mount();
    const review = action(canvas, "review");
    const publish = action(canvas, "publish");
    const keydown = (target: HTMLElement, key: string, modifiers: KeyboardEventInit = {}) => target.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, composed: true, cancelable: true, ...modifiers }),
    );
    review.focus();
    for (const modifiers of [{ altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }]) {
      expect(keydown(review, "ArrowRight", modifiers)).toBe(true);
      expect(active()).toBe(review);
    }
    expect(keydown(review, "PageDown")).toBe(true);
    expect(active()).toBe(review);
    expect(keydown(review, "ArrowRight")).toBe(false);
    expect(active()).toBe(publish);

    const { picker } = revealControls(canvas);
    picker.focus();
    expect(keydown(picker, "Home")).toBe(true);
    expect(active()).toBe(picker);
    const metadata = getNode(canvas, "review")?.shadowRoot?.querySelector<HTMLElement>("dd");
    if (metadata === undefined || metadata === null) throw new Error("The node needs its noninteractive metadata");
    expect(keydown(metadata, "ArrowRight")).toBe(true);
    expect(active()).toBe(picker);
    expect(requests).toEqual([]);
  });

  it("forgets a pending reveal when the host removes only the destination position", async () => {
    const { canvas, requests } = await mount();
    const initiator = await askReveal(canvas, "revise");
    const proposed = lastViewport(requests);
    expect(active()).toBe(initiator);

    const { picker } = revealControls(canvas);
    picker.value = "publish";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    canvas.layout = initialLayout.filter(({ nodeId }) => nodeId !== "revise");
    await settle(canvas);
    expect(picker.value).toBe("publish");
    expect(active()).toBe(initiator);
    expect(initiator.disabled).toBe(false);

    canvas.layout = [...canvas.layout, { nodeId: "revise", x: 530, y: 20 }];
    await settle(canvas);
    expect(getNode(canvas, "revise")?.parentElement?.inert).toBe(false);
    expect(active()).toBe(initiator);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
  });

  it("keeps the pending reveal through a layout update that preserves its destination", async () => {
    const { canvas, requests } = await mount();
    const initiator = await askReveal(canvas, "revise");
    const proposed = lastViewport(requests);
    canvas.layout = canvas.layout.map((entry) => entry.nodeId === "review" ? { ...entry, x: entry.x + 1 } : entry);
    await settle(canvas);
    expect(active()).toBe(initiator);

    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(action(canvas, "revise"));
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
  });

  it("focuses a programmatic reveal and keeps the supplied paint order until acceptance", async () => {
    const { canvas, frame, before, requests } = await mount(true);
    canvas.viewport = { x: -250, y: 0, scale: 1 };
    const { picker, button } = revealControls(canvas);
    picker.value = "review";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    before.focus();
    button.click();
    window.dispatchEvent(new Event("resize"));
    await settle(canvas);
    const proposed = lastViewport(requests);
    expect(active()).toBe(button);
    expect([...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].map(({ nodeId }) => nodeId))
      .toEqual(["review", "publish", "revise"]);

    frame.classList.add("move-away");
    await expect.poll(active).not.toBe(button);
    frame.classList.remove("move-away");
    canvas.viewport = proposed;
    await settle(canvas);
    expect(focusId(canvas)).toBeNull();
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
  });

  it("does not scroll the host pane when a programmatic reveal focuses a clipped control", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.replaceSync(fixtureStyles(260));
    await settle(canvas);
    pane.scrollLeft = pane.scrollWidth - pane.clientWidth;
    pane.dispatchEvent(new Event("scroll"));
    const position = pane.scrollLeft;
    const { button } = revealControls(canvas);
    expect(position).toBeGreaterThan(0);
    expect(button.getBoundingClientRect().right).toBeLessThan(pane.getBoundingClientRect().left);

    button.click();

    expect(pane.scrollLeft).toBe(position);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.type).toBe(viewport);
    expect(canvas.viewport).toEqual(initialViewport);
  });

  it("keeps external focus when the named reveal could never acquire initiating focus", async () => {
    const { canvas, before, requests } = await mount();
    const { picker, button } = revealControls(canvas);
    picker.value = "revise";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    before.focus();

    canvas.inert = true;
    button.click();
    const proposed = lastViewport(requests);
    expect(active()).toBe(before);

    canvas.inert = false;
    canvas.viewport = proposed;
    await settle(canvas);
    expect(getNode(canvas, "revise")?.parentElement?.inert).toBe(false);
    expect(active()).toBe(before);
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
  });

  it("schedules one paint update when a covered named action is revealed", async () => {
    const { canvas, requests } = await mount();
    canvas.layout = [{ nodeId: "review", x: 40, y: 20 }, { nodeId: "publish", x: 40, y: 20 }];
    await settle(canvas);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    const { picker, button } = revealControls(canvas);
    expect(picker.value).toBe("review");

    const update = vi.spyOn(canvas, "requestUpdate");
    try {
      button.click();
      expect(active()).toBe(button);
      expect(update).toHaveBeenCalledTimes(1);
      window.dispatchEvent(new Event("resize"));
      window.dispatchEvent(new Event("resize"));
      expect(update).toHaveBeenCalledTimes(1);

      await settle(canvas);
      expect(active()).toBe(action(canvas, "review"));
      expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
      expect(requests).toEqual([]);
    } finally {
      update.mockRestore();
    }
  });

  it.each([
    ["a hidden map", "display: none"],
    ["a singular host transform", "transform: scaleX(0)"],
  ])("does not transfer focus after an unavailable reveal through %s", async (_description, style) => {
    const { canvas, frame, sheet, requests } = await mount();
    const { picker, button } = revealControls(canvas);
    picker.value = "revise";
    picker.dispatchEvent(new Event("change", { bubbles: true }));
    await settle(canvas);
    sheet.replaceSync(`${fixtureStyles(760)}\n#canvas-frame.temporarily-unavailable { ${style}; }`);
    frame.addEventListener("click", () => { frame.classList.add("temporarily-unavailable"); }, { capture: true, once: true });
    frame.addEventListener("click", () => { frame.classList.remove("temporarily-unavailable"); }, { once: true });
    button.focus({ preventScroll: true });
    await commands.press("Enter");
    expect(active()).toBe(button);
    expect(requests).toEqual([]);

    canvas.viewport = { x: -540, y: 0, scale: 1 };
    await settle(canvas);
    expect(getNode(canvas, "revise")?.parentElement?.inert).toBe(false);
    expect(active(), "an unrelated host viewport change cannot complete an unavailable reveal").toBe(button);
    expect(requests).toEqual([]);
  });

  it("restores supplied paint order and resets the picker when a raised node is removed", async () => {
    const { canvas, requests } = await mount();
    canvas.layout = [{ nodeId: "review", x: 40, y: 20 }, { nodeId: "publish", x: 40, y: 20 }];
    await settle(canvas);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    await askReveal(canvas, "review");
    await settle(canvas);
    expect(active()).toBe(action(canvas, "review"));
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect([...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].map(({ nodeId }) => nodeId))
      .toEqual(["publish", "revise", "review"]);

    const raisedAction = action(canvas, "review");
    canvas.graph = {
      ...canvas.graph,
      nodes: canvas.graph.nodes.map((node) => node.id === "review" ? { ...node, label: "Updated review" } : node),
    };
    await settle(canvas);
    expect(active()).toBe(raisedAction);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);

    canvas.graph = { nodes: namedSteps.filter(({ id }) => id !== "review"), connections: [] };
    await settle(canvas);
    expect(revealControls(canvas).picker.value).toBe("publish");
    expect(active()).toBe(action(canvas, "publish"));

    canvas.graph = initialGraph;
    await settle(canvas);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    expect(active()).toBe(action(canvas, "publish"));
    expect(revealControls(canvas).picker.value).toBe("publish");
    expect(requests).toEqual([]);
  });

  it("keeps host focus that is claimed during the render that removes the focused node", async () => {
    const { canvas, after, requests } = await mount();
    const review = action(canvas, "review");
    review.focus();
    expect(active()).toBe(review);
    const host = {
      hostUpdated: () => {
        after.focus();
        canvas.removeController(host);
      },
    };
    canvas.addController(host);
    canvas.graph = { nodes: namedSteps.filter(({ id }) => id !== "review"), connections: [] };
    await settle(canvas);

    expect(getNode(canvas, "review")).toBeUndefined();
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(false);
    expect(active()).toBe(after);
    expect(requests).toEqual([]);
  });

  it.each(["body", "documentElement"] as const)(
    "respects focus explicitly claimed by the document %s during a graph update",
    async (target) => {
      const { canvas, requests } = await mount();
      const review = action(canvas, "review");
      const hostTarget = document[target];
      const originalTabIndex = hostTarget.getAttribute("tabindex");
      try {
        hostTarget.tabIndex = -1;
        review.focus();
        expect(active()).toBe(review);
        const host = {
          hostUpdated: () => {
            hostTarget.focus({ preventScroll: true });
            expect(hostTarget.matches(":focus")).toBe(true);
            canvas.removeController(host);
          },
        };
        canvas.addController(host);
        canvas.graph = { nodes: namedSteps.filter(({ id }) => id !== "review"), connections: [] };
        await settle(canvas);

        expect(getNode(canvas, "review")).toBeUndefined();
        expect(active() === hostTarget, "explicit host focus remains outside the canvas").toBe(true);
        expect(hostTarget.matches(":focus")).toBe(true);
        expect(requests).toEqual([]);
      } finally {
        if (originalTabIndex === null) hostTarget.removeAttribute("tabindex");
        else hostTarget.setAttribute("tabindex", originalTabIndex);
      }
    },
  );

  it("rechecks map eligibility when the same canvas reconnects into a moved host", async () => {
    const { canvas, frame, after, requests } = await mount(true);
    const lifecycle: string[] = [];
    canvas.addController({
      hostConnected: () => { lifecycle.push("connected"); },
      hostDisconnected: () => { lifecycle.push("disconnected"); },
    });
    const review = action(canvas, "review");
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(false);

    canvas.remove();
    frame.classList.add("move-away");
    after.focus();
    frame.append(canvas);
    await settle(canvas);
    expect(lifecycle).toEqual(["connected", "disconnected", "connected"]);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    expect(getNode(canvas, "review")?.parentElement?.getAttribute("aria-hidden")).toBe("true");
    expect(active()).toBe(after);

    frame.classList.remove("move-away");
    await expect.poll(() => getNode(canvas, "review")?.parentElement?.inert).toBe(false);
    expect(getNode(canvas, "review")?.parentElement?.getAttribute("aria-hidden")).toBeNull();
    expect(action(canvas, "review")).toBe(review);
    expect(active()).toBe(after);
    expect(requests).toEqual([]);
    await click(review);
    expect(requests).toEqual([selectRequest("review")]);
  });

  it("repairs idle eligibility when the host stylesheet partially clips only the focus outline", async () => {
    const { canvas, frame, pane, sheet, requests } = await mount(true);
    const review = action(canvas, "review");
    const publish = action(canvas, "publish");
    const face = getNode(canvas, "review")?.parentElement;
    const outline = face?.parentElement?.nextElementSibling;
    if (face == null || !(outline instanceof SVGRectElement)) throw new Error("The review action is missing its focus outline");

    const ratio = (target: Element) => new Promise<number | undefined>((resolve) => {
      const observer = new IntersectionObserver(([entry]) => {
        observer.disconnect();
        resolve(entry?.intersectionRatio);
      });
      observer.observe(target);
    });
    const hostState = () => ({
      width: frame.offsetWidth, height: frame.offsetHeight, paneWidth: pane.clientWidth,
      scroll: [pane.scrollLeft, pane.scrollTop], viewport: canvas.viewport,
    });
    const actionState = () => ({ focused: focusId(canvas), inert: face.inert, hidden: face.getAttribute("aria-hidden") });
    review.focus({ preventScroll: true });
    await settle(canvas);
    expect(actionState()).toEqual({ focused: "review", inert: false, hidden: null });
    expect(await ratio(outline)).toBe(1);

    const before = hostState();
    const left = review.getBoundingClientRect().left;
    const focusOutset = left - outline.getBoundingClientRect().left;
    const shift = pane.getBoundingClientRect().left - left + focusOutset / 2;
    expect(focusOutset).toBeGreaterThan(0);
    // Editing the adopted sheet changes position without changing a host DOM attribute.
    sheet.replaceSync(`${fixtureStyles(760)} #canvas-frame { transform: translateX(${String(shift)}px); }`);
    const partial = await ratio(outline) ?? 0;
    expect(partial).toBeGreaterThan(0);
    expect(partial).toBeLessThan(1);
    expect(await ratio(review), "the native button remains fully in view while its focus outline clips").toBe(1);
    await expect.poll(actionState, { message: "idle clipping moves native focus to the visible survivor" })
      .toEqual({ focused: "publish", inert: true, hidden: "true" });
    expect(active()).toBe(publish);
    expect(hostState()).toEqual(before);
    expect(requests).toEqual([]);

    await settle(canvas);
    sheet.replaceSync(fixtureStyles(760));
    expect(await ratio(outline)).toBe(1);
    await expect.poll(actionState, { message: "the idle outline becomes eligible again without stealing focus" })
      .toEqual({ focused: "publish", inert: false, hidden: null });
    expect(action(canvas, "review")).toBe(review);
    expect(hostState()).toEqual(before);
    expect(requests).toEqual([]);
  });

  it("releases real canvas observers and listener signals after node and canvas removal", async () => {
    const listenOnWindow = vi.spyOn(window, "addEventListener");
    const listen = vi.spyOn(EventTarget.prototype, "addEventListener");
    const observeSize = vi.spyOn(ResizeObserver.prototype, "observe");
    const releaseSize = vi.spyOn(ResizeObserver.prototype, "unobserve");
    const disconnectSize = vi.spyOn(ResizeObserver.prototype, "disconnect");
    const observeClip = vi.spyOn(IntersectionObserver.prototype, "observe");
    const releaseClip = vi.spyOn(IntersectionObserver.prototype, "unobserve");
    const disconnectClip = vi.spyOn(IntersectionObserver.prototype, "disconnect");
    const watchAttributes = vi.spyOn(MutationObserver.prototype, "observe");
    const disconnectAttributes = vi.spyOn(MutationObserver.prototype, "disconnect");
    try {
      const { canvas, frame, pane, requests } = await mount(true);
      const map = canvas.shadowRoot?.querySelector("svg");
      const removedAction = action(canvas, "revise");
      const face = getNode(canvas, "revise")?.parentElement;
      const marker = face?.parentElement?.nextElementSibling;
      const { picker, button } = revealControls(canvas);
      const resizeObserver = observeSize.mock.contexts[observeSize.mock.calls.findIndex(([target]) => target === map)];
      const intersectionObserver = observeClip.mock.contexts[observeClip.mock.calls.findIndex(([target]) => target === map)];
      expect(resizeObserver).toBeInstanceOf(ResizeObserver);
      expect(intersectionObserver).toBeInstanceOf(IntersectionObserver);
      const resizeTargets = observeSize.mock.calls.filter((_, index) => observeSize.mock.contexts[index] === resizeObserver).map(([target]) => target);
      const intersectionTargets = observeClip.mock.calls.filter((_, index) => observeClip.mock.contexts[index] === intersectionObserver).map(([target]) => target);
      expect(resizeTargets).toEqual(expect.arrayContaining([map, frame, pane, picker, button, face, removedAction, marker]));
      expect(intersectionTargets).toEqual(expect.arrayContaining([map, frame, pane, picker, button, face, removedAction, marker]));

      const registered = (target: EventTarget, name: string) => listen.mock.calls.find(
        ([type], index) => type === name && listen.mock.contexts[index] === target,
      )?.[2];
      const clickOptions = registered(canvas, "click");
      const signal = typeof clickOptions === "object" ? clickOptions.signal : undefined;
      expect(signal).toBeInstanceOf(AbortSignal);
      if (signal === undefined) throw new Error("The canvas must own an abortable native click listener");
      expect(clickOptions).toMatchObject({ capture: true, signal });
      expect(registered(canvas, "focusin")).toMatchObject({ capture: true, signal });
      expect(registered(canvas, "focusout")).toMatchObject({ signal });
      expect(registered(canvas, "keydown")).toMatchObject({ signal });
      const windowSignals = listenOnWindow.mock.calls.map(([type, , options]) => [type, typeof options === "object" ? options.signal : undefined]);
      expect(windowSignals).toEqual(expect.arrayContaining([["resize", signal], ["scroll", signal]]));
      expect(registered(pane, "scroll")).toMatchObject({ signal });
      expect(signal.aborted).toBe(false);

      const unchangedSizeCalls = observeSize.mock.calls.length;
      const unchangedClipCalls = observeClip.mock.calls.length;
      window.dispatchEvent(new Event("resize"));
      expect(observeSize.mock.calls).toHaveLength(unchangedSizeCalls);
      expect(observeClip.mock.calls).toHaveLength(unchangedClipCalls);

      canvas.graph = { nodes: namedSteps.filter(({ id }) => id !== "revise"), connections: [] };
      await settle(canvas);
      expect(getNode(canvas, "revise")).toBeUndefined();
      expect(releaseSize.mock.calls.map(([target]) => target)).toEqual(expect.arrayContaining([face, removedAction, marker]));
      expect(releaseClip.mock.calls.map(([target]) => target)).toEqual(expect.arrayContaining([face, removedAction, marker]));
      expect(requests).toEqual([]);

      const attributesObserver = watchAttributes.mock.contexts[watchAttributes.mock.calls.findIndex(([target]) => target === pane)];
      expect(attributesObserver).toBeInstanceOf(MutationObserver);
      canvas.remove();
      expect(disconnectAttributes.mock.contexts).toContain(attributesObserver);
      expect(signal.aborted).toBe(true);
      expect(disconnectSize.mock.contexts).toContain(resizeObserver);
      expect(disconnectClip.mock.contexts).toContain(intersectionObserver);

      const previousSizeCalls = observeSize.mock.calls.length;
      const previousClipCalls = observeClip.mock.calls.length;
      const previousListenerCalls = listen.mock.calls.length;
      frame.append(canvas);
      await settle(canvas);
      expect(observeSize.mock.calls.slice(previousSizeCalls).map(([target]) => target)).toContain(map);
      expect(observeClip.mock.calls.slice(previousClipCalls).map(([target]) => target)).toContain(map);
      const newPaneOptions = listen.mock.calls.find(([type], index) =>
        index >= previousListenerCalls && type === "scroll" && listen.mock.contexts[index] === pane)?.[2];
      const newSignal = typeof newPaneOptions === "object" ? newPaneOptions.signal : undefined;
      expect(newSignal).toBeInstanceOf(AbortSignal);
      expect(newSignal).not.toBe(signal);
      expect(newSignal?.aborted).toBe(false);
      expect(requests).toEqual([]);
    } finally {
      for (const spy of [listen, observeSize, releaseSize, disconnectSize, observeClip, releaseClip, disconnectClip, watchAttributes, disconnectAttributes, listenOnWindow]) spy.mockRestore();
    }
  });

  it("recovers clipped focus synchronously on an enclosing pane's own scroll event", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.replaceSync(fixtureStyles(400));
    await settle(canvas);
    const review = action(canvas, "review");
    review.focus();
    expect(active()).toBe(review);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(false);

    pane.scrollLeft = 260;
    pane.dispatchEvent(new Event("scroll"));
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    expect(active()).toBe(action(canvas, "publish"));
    expect(pane.scrollLeft).toBe(260);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(requests).toEqual([]);
  });

  it("switches scroll subscriptions when the host assigns the canvas to a different slotted pane", async () => {
    const { canvas } = await mount();
    const host = document.createElement("section");
    const requests: string[] = [];
    for (const type of requestTypes) host.addEventListener(type, (event) => { requests.push(event.type); });
    const shadow = host.attachShadow({ mode: "open" });
    const first = document.createElement("div");
    const second = document.createElement("div");
    const firstSlot = document.createElement("slot");
    const secondSlot = document.createElement("slot");
    firstSlot.name = "first";
    secondSlot.name = "second";
    second.id = "narrow";
    first.append(firstSlot);
    second.append(secondSlot);
    const layout = new CSSStyleSheet();
    layout.replaceSync("div { overflow: auto; inline-size: 760px; block-size: 440px; } #narrow { inline-size: 400px; }");
    shadow.adoptedStyleSheets = [layout];
    shadow.append(first, second);
    document.body.replaceChildren(host);

    const listenFirst = vi.spyOn(first, "addEventListener");
    const stopFirst = vi.spyOn(first, "removeEventListener");
    const listenSecond = vi.spyOn(second, "addEventListener");
    try {
      canvas.slot = "first";
      host.append(canvas);
      await settle(canvas);
      expect(canvas.assignedSlot).toBe(firstSlot);
      expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(false);
      const scrollHandler = listenFirst.mock.calls.find(([type]) => type === "scroll")?.[1];
      expect(scrollHandler).toBeInstanceOf(Function);
      window.dispatchEvent(new Event("resize"));
      expect(listenFirst.mock.calls.filter(([type]) => type === "scroll")).toHaveLength(1);

      canvas.slot = "second";
      await expect.poll(() => getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
      expect(canvas.assignedSlot).toBe(secondSlot);
      expect(stopFirst.mock.calls.find(([type]) => type === "scroll")?.[1]).toBe(scrollHandler);
      expect(listenSecond.mock.calls.find(([type]) => type === "scroll")?.[1]).toBe(scrollHandler);
      await settle(canvas);
      const map = canvas.shadowRoot?.querySelector("svg");
      if (map === null || map === undefined) throw new Error("The slotted canvas is missing its map");
      const measure = vi.spyOn(map, "getBoundingClientRect");
      try {
        first.setAttribute("data-previous-pane", "");
        await Promise.resolve();
        expect(measure, "attributes on the abandoned pane cannot refresh the canvas").not.toHaveBeenCalled();
      } finally {
        measure.mockRestore();
      }
      expect(requests).toEqual([]);
    } finally {
      listenFirst.mockRestore();
      stopFirst.mockRestore();
      listenSecond.mockRestore();
    }
  });

  it("remeasures edge anchors when the host enlarges fully visible node controls", async () => {
    const { canvas, sheet, requests } = await mount(true);
    const card = getNode(canvas, "review");
    const map = canvas.shadowRoot?.querySelector("svg");
    const edge = map?.querySelector("path");
    if (card === undefined || map === undefined || map === null || edge === undefined || edge === null) {
      throw new Error("The size change fixture needs its displayed node and edge");
    }
    const start = () => edge.getPointAtLength(0).x;
    const initialStart = start();
    const initialWidth = card.getBoundingClientRect().width;
    expect(card.parentElement?.inert).toBe(false);

    sheet.replaceSync(`${fixtureStyles(760)}\n${tag} { --ocelle-target-min: 56px; }`);
    await expect.poll(start).toBeGreaterThan(initialStart + 20);
    const rect = card.getBoundingClientRect();
    expect(rect.width).toBeGreaterThan(initialWidth + 20);
    expect(start()).toBeCloseTo(rect.right - map.getBoundingClientRect().left, 0);
    const foreign = card.closest("foreignObject");
    expect(foreign?.getAttribute("width")).toBe(String(card.parentElement?.offsetWidth));
    expect(foreign?.getAttribute("height")).toBe(String(card.parentElement?.offsetHeight));
    expect(card.parentElement?.inert).toBe(false);
    expect(canvas.layout).toEqual(initialLayout);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(requests).toEqual([]);
  });

  it("updates SVG and edge geometry for a height change at a fixed step width", async () => {
    const { canvas, requests } = await mount();
    const card = getNode(canvas, "review");
    const foreign = card?.closest("foreignObject");
    const edge = canvas.shadowRoot?.querySelector<SVGPathElement>("svg path");
    expect(foreign).toBeInstanceOf(SVGForeignObjectElement);
    expect(edge).toBeInstanceOf(SVGPathElement);
    if (foreign === null || foreign === undefined || edge === null || edge === undefined) {
      throw new Error("The height-change fixture needs a positioned step and edge");
    }
    const previousWidth = Number(foreign.getAttribute("width"));
    const previousHeight = Number(foreign.getAttribute("height"));
    const previousAnchor = edge.getPointAtLength(0);

    canvas.graph = {
      ...canvas.graph,
      nodes: canvas.graph.nodes.map((node) => node.id === "review"
        ? { ...node, label: "Initial review of the complete authoring proposal with feedback from its accountable reviewer" }
        : node),
    };
    await settle(canvas);
    const measuredHeight = card?.parentElement?.offsetHeight;
    expect(measuredHeight).toBeGreaterThan(previousHeight);
    expect(foreign.getAttribute("height")).toBe(String(measuredHeight));
    expect(Number(foreign.getAttribute("width"))).toBe(previousWidth);
    const movedAnchor = edge.getPointAtLength(0);
    expect(movedAnchor.x).toBe(previousAnchor.x);
    expect(movedAnchor.y).toBeGreaterThan(previousAnchor.y);
    expect(requests).toEqual([]);
  });

  it("observes the full native focus outline without writing unchanged geometry", async () => {
    const { canvas, requests } = await mount();
    const button = action(canvas, "review");
    const marker = getNode(canvas, "review")?.parentElement?.parentElement?.nextElementSibling;
    if (!(marker instanceof SVGRectElement)) throw new Error("The focus outline needs its SVG observation box");
    const style = getComputedStyle(button);
    const inset = Number.parseFloat(style.getPropertyValue("--ocelle-focus-width"))
      + Number.parseFloat(style.getPropertyValue("--ocelle-focus-offset"));
    expect(inset).toBeGreaterThan(0);

    canvas.viewport = { x: 47, y: 38, scale: 1 };
    await settle(canvas);
    const buttonRect = button.getBoundingClientRect();
    const markerRect = marker.getBoundingClientRect();
    expect(markerRect.left).toBeCloseTo(buttonRect.left - inset, 0);
    expect(markerRect.right).toBeCloseTo(buttonRect.right + inset, 0);
    expect(markerRect.top).toBeCloseTo(buttonRect.top - inset, 0);
    expect(markerRect.bottom).toBeCloseTo(buttonRect.bottom + inset, 0);
    expect(getComputedStyle(marker).visibility).toBe("hidden");
    expect(marker.getAttribute("aria-hidden")).toBe("true");

    const mutations = new MutationObserver(() => undefined);
    mutations.observe(marker, { attributes: true });
    try {
      window.dispatchEvent(new Event("resize"));
      expect(mutations.takeRecords()).toEqual([]);
    } finally {
      mutations.disconnect();
    }
    expect(requests).toEqual([]);
  });

  it("keeps finite native focus bounds when a host token overflows", async () => {
    const { canvas, sheet, requests } = await mount();
    const button = action(canvas, "review");
    const face = getNode(canvas, "review")?.parentElement;
    const marker = face?.parentElement?.nextElementSibling;
    expect(marker).toBeInstanceOf(SVGRectElement);
    if (!(marker instanceof SVGRectElement)) throw new Error("The focus outline needs its SVG observation box");
    const size = () => ["x", "y", "width", "height"].map((name) => marker.getAttribute(name));
    const laidOut = size();
    expect(laidOut.every((value) => value !== null && Number.isFinite(Number(value)))).toBe(true);

    sheet.replaceSync(`${fixtureStyles(760)}\n${tag} { --ocelle-focus-width: 1e309px; }`);
    expect(Number.parseFloat(getComputedStyle(button).getPropertyValue("--ocelle-focus-width"))).toBe(Infinity);
    window.dispatchEvent(new Event("resize"));
    expect(size()).toEqual(laidOut);
    expect(face?.inert).toBe(true);

    sheet.replaceSync(fixtureStyles(760));
    window.dispatchEvent(new Event("resize"));
    expect(face?.inert).toBe(false);
    expect(size()).toEqual(laidOut);
    expect(requests).toEqual([]);
  });

  it("leaves stable visible and clipped accessibility states untouched on resize", async () => {
    const { canvas, requests } = await mount();
    const visible = getNode(canvas, "review")?.parentElement;
    const clipped = getNode(canvas, "revise")?.parentElement;
    expect(visible).toBeInstanceOf(HTMLElement);
    expect(clipped).toBeInstanceOf(HTMLElement);
    if (visible === null || visible === undefined || clipped === null || clipped === undefined) {
      throw new Error("The fixture needs visible and clipped steps");
    }
    expect(visible.getAttribute("aria-hidden")).toBeNull();
    expect(clipped.getAttribute("aria-hidden")).toBe("true");
    const mutations = new MutationObserver(() => undefined);
    for (const face of [visible, clipped]) mutations.observe(face, { attributeFilter: ["aria-hidden"] });
    try {
      window.dispatchEvent(new Event("resize"));
      expect(mutations.takeRecords()).toEqual([]);
    } finally {
      mutations.disconnect();
    }
    expect(requests).toEqual([]);
  });

  it("moves the native tab stop with node focus and restores host entry after blur", async () => {
    const { canvas, before, requests } = await mount();
    const review = action(canvas, "review");
    const publish = action(canvas, "publish");
    expect([review.tabIndex, publish.tabIndex]).toEqual([-1, 0]);

    review.focus({ preventScroll: true });
    expect(active()).toBe(review);
    expect([review.tabIndex, publish.tabIndex]).toEqual([0, -1]);
    const step = getNode(canvas, "review");
    if (step === undefined) throw new Error("The focused step must still exist");
    const refocus = vi.spyOn(step, "focus");
    try {
      window.dispatchEvent(new Event("resize"));
      expect(refocus).not.toHaveBeenCalled();
    } finally {
      refocus.mockRestore();
    }

    before.focus();
    await Promise.resolve();
    expect(active()).toBe(before);
    expect([review.tabIndex, publish.tabIndex]).toEqual([-1, 0]);
    expect(requests).toEqual([]);
  });

  it("refreshes the visible native actions after Lit renders and before observers deliver", async () => {
    const { canvas, requests } = await mount();
    const review = getNode(canvas, "review");
    const publish = getNode(canvas, "publish");
    expect(review?.parentElement?.inert).toBe(false);
    expect(publish?.parentElement?.inert).toBe(false);
    if (review === undefined) throw new Error("The geometry update needs a rendered workflow node");

    const pending = Promise.withResolvers<boolean>();
    const nodeUpdate = vi.spyOn(review, "updateComplete", "get").mockReturnValue(pending.promise);
    try {
      canvas.viewport = { ...initialViewport, x: -240 };
      await canvas.updateComplete;
      await Promise.all([publish?.updateComplete]);
      await Promise.resolve();
      expect(review.parentElement?.inert, "geometry waits for the child render").toBe(false);

      pending.resolve(true);
      await Promise.all([review.updateComplete, publish?.updateComplete]);
      await Promise.resolve();
      expect(review.parentElement?.inert).toBe(true);
      expect(review.parentElement?.getAttribute("aria-hidden")).toBe("true");
      expect(publish?.parentElement?.inert).toBe(false);
      expect(action(canvas, "publish").tabIndex).toBe(0);
      expect(requests).toEqual([]);
    } finally {
      pending.resolve(true);
      nodeUpdate.mockRestore();
    }
  });

  it("skips map measurement for named focus and a node blur queued before disconnect", async () => {
    const { canvas, before, requests } = await mount();
    const map = canvas.shadowRoot?.querySelector("svg");
    expect(map).toBeInstanceOf(SVGSVGElement);
    if (map === null || map === undefined) throw new Error("The canvas needs a native SVG map");
    const measure = vi.spyOn(map, "getScreenCTM");
    try {
      const { picker } = revealControls(canvas);
      picker.focus();
      expect(active()).toBe(picker);
      expect(measure).not.toHaveBeenCalled();

      before.focus();
      await Promise.resolve();
      expect(active()).toBe(before);
      expect(measure).not.toHaveBeenCalled();

      action(canvas, "review").focus({ preventScroll: true });
      expect(measure).toHaveBeenCalled();
      before.focus();
      canvas.remove();
      measure.mockClear();
      await Promise.resolve();
      expect(measure).not.toHaveBeenCalled();
      expect(active()).toBe(before);
      expect(requests).toEqual([]);
    } finally {
      measure.mockRestore();
    }
  });

  it("cancels a stale native activation before the geometry observers deliver", async () => {
    const { canvas, frame, before, requests } = await mount(true);
    const publish = action(canvas, "publish");
    before.focus();
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(false);

    frame.classList.add("move-away");
    const activation = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(activation)).toBe(false);
    expect(activation.defaultPrevented).toBe(true);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(active()).toBe(before);
    expect(requests).toEqual([]);

    frame.classList.remove("move-away");
    await settle(canvas);
    expect(getNode(canvas, "publish")?.parentElement?.inert, "the same-task host restore makes the stale action available again").toBe(false);
    await click(publish);
    expect(requests).toEqual([selectRequest("publish")]);
  });

  it("checks rounded clip corners before a click and reveals the same node after the host reopens the contour", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule("#canvas-pane { block-size: 445px; overflow: visible; }", sheet.cssRules.length);
    sheet.insertRule("#canvas-pane.corner { clip-path: inset(0 255px 72px 0 round 100px); }", sheet.cssRules.length);
    sheet.insertRule("#canvas-pane.open { clip-path: inset(0 round 4px); }", sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 24, y: 14 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const { left, right, top, bottom } = publish.getBoundingClientRect();
    const root = publish.getRootNode() as ShadowRoot;
    const hit = (x: number, y: number) => root.elementFromPoint(x, y) === publish;
    publish.focus({ preventScroll: true });
    expect(active()).toBe(publish);
    expect(hit(right - 4, bottom - 4)).toBe(true);
    pane.classList.add("corner");
    expect(hit((left + right) / 2, (top + bottom) / 2), "the visible center alone cannot prove eligibility").toBe(true);
    expect(hit(right - 4, bottom - 4), "Chromium clips the action corner inside the inset bounding box").toBe(false);
    const clickWhileClipped = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(clickWhileClipped), "the stale action cannot request selection").toBe(false);
    expect(requests).toEqual([]);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);

    const { picker, button } = revealControls(canvas);
    picker.value = "publish";
    picker.dispatchEvent(new Event("change"));
    await canvas.updateComplete;
    button.focus();
    pane.classList.add("open");
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(hit((left + right) / 2, (top + bottom) / 2), "the original action itself is still inert").toBe(false);
    button.click();
    expect(active()).toBe(publish);
    expect(requests).toEqual([]);
    expect(hit((left + right) / 2, (top + bottom) / 2), "the browser probe leaves the actual native action hittable").toBe(true);
    await click(publish);
    expect(requests).toEqual([selectRequest("publish")]);

    await settle(canvas);
    pane.classList.remove("open");
    await expect.poll(() => focusId(canvas), { message: "an idle host class change recomputes a corner-only clip" }).toBe("review");
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(requests).toEqual([selectRequest("publish")]);
  });

  it("probes only host insets and remains keyboard-accessible when a host disables pointer input", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    const root = canvas.shadowRoot;
    if (root === null) throw new Error("The canvas is missing its shadow root");
    const pointQuery = vi.spyOn(root, "elementFromPoint");
    try {
      const review = action(canvas, "review");
      review.focus({ preventScroll: true });
      expect(active()).toBe(review);
      expect(pointQuery, "a plain host does not need contour hit tests").not.toHaveBeenCalled();
      sheet.insertRule("#canvas-pane.pointer-off { clip-path: inset(0 round 4px); pointer-events: none; }");
      pane.classList.add("pointer-off");
      await settle(canvas);
      expect(active()).toBe(review);
      expect(getNode(canvas, "review")?.parentElement?.inert).toBe(false);
      expect(pointQuery).toHaveBeenCalled();
      expect(requests).toEqual([]);
    } finally {
      pointQuery.mockRestore();
    }
  });

  it("keeps the fully visible node eligible where only its neighbor intersects a polygon boundary", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule("#canvas-pane { block-size: 445px; overflow: visible; }", sheet.cssRules.length);
    sheet.insertRule("#canvas-pane.notched { clip-path: polygon(0 0, 100% 0, 100% 318px, 394px 318px, 394px 328px, 100% 328px, 100% 100%, 0 100%); }", sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 24, y: 14 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const review = action(canvas, "review");
    publish.focus({ preventScroll: true });
    pane.classList.add("notched");
    const { left, right, top, bottom } = publish.getBoundingClientRect();
    const root = publish.getRootNode() as ShadowRoot;
    const center = (left + right) / 2;
    expect(publish.contains(root.elementFromPoint(center, (top + bottom) / 2))).toBe(true);
    expect(publish.contains(root.elementFromPoint(center, top + 10))).toBe(false);

    const nativeClick = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(nativeClick), "the contour crossing makes Publish unavailable in the same input turn").toBe(false);
    expect(active()).toBe(review);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(requests).toEqual([]);
    await click(review);
    expect(requests).toEqual([selectRequest("review")]);
  });

  it("requires browser visibility when an action lies wholly in a polygon cutout", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule("#canvas-pane { block-size: 445px; overflow: visible; }", sheet.cssRules.length);
    sheet.insertRule("#canvas-pane.cutout { clip-path: polygon(0 0, 100% 0, 100% 282px, 240px 282px, 240px 386px, 100% 386px, 100% 100%, 0 100%); }", sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 24, y: 14 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    publish.focus({ preventScroll: true });
    expect(active()).toBe(publish);

    const { left, right, top, bottom } = publish.getBoundingClientRect();
    const root = publish.getRootNode() as ShadowRoot;
    const hit = () => publish.contains(root.elementFromPoint((left + right) / 2, (top + bottom) / 2));
    expect(hit()).toBe(true);
    pane.classList.add("cutout");
    expect(hit()).toBe(false);
    const nativeClick = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(nativeClick)).toBe(false);
    expect(active()).toBe(action(canvas, "review"));
    expect(requests).toEqual([]);
  });

  it.each([
    { name: "a translated polygon", style: "transform: translateX(1px);", path: "polygon(0 0, 100% 0, 100% 318px, 394px 318px, 394px 328px, 100% 328px, 100% 100%, 0 100%)", viewX: -58, viewY: -90 },
    { name: "an ellipse", style: "", path: "ellipse(440px 150px at 300px 115px)", viewX: -58, viewY: -172.5 },
    { name: "a circle", style: "", path: "circle(268px at 228px 5px)", viewX: -170, viewY: -168.5 },
  ])("guards live native focus and accepts an exact named reveal through $name", async ({ style, path, viewX, viewY }) => {
    const { canvas, pane, sheet, requests } = await mount(true);
    reserveFixtureMapHeight(canvas, sheet);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible; ${style} }`, sheet.cssRules.length);
    sheet.insertRule(`#canvas-pane.round-five-clip { clip-path: ${path}; }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 24, y: 14 }, { nodeId: "publish", x: 330, y: 236 }];
    await document.fonts.ready;
    await settle(canvas);
    const publish = action(canvas, "publish");
    publish.focus({ preventScroll: true });
    expect(active()).toBe(publish);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    pane.classList.add("round-five-clip");
    const nativeClick = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(nativeClick), "live clipping blocks this action before a geometry callback").toBe(false);
    expect(active()).toBe(action(canvas, "review"));
    expect(requests).toEqual([]);

    const reveal = await askReveal(canvas, "publish");
    const proposed = { x: viewX, y: viewY, scale: 1 };
    const proposal = { type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false };
    expect(requests).toEqual([proposal]);
    expect(active()).toBe(reveal);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(publish);
    expect(action(canvas, "publish")).toBe(publish);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([proposal]);
  });

  it("skips the polygon-clipped Step control and focuses the painted Reveal fallback", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    const { picker, button } = revealControls(canvas);
    const publish = action(canvas, "publish");
    const root = canvas.shadowRoot;
    if (root === null) throw new Error("The canvas is missing its shadow root");
    const paneBounds = pane.getBoundingClientRect();
    const step = picker.getBoundingClientRect();
    const reveal = button.getBoundingClientRect();
    const left = step.left - paneBounds.left - 2;
    const right = step.right - paneBounds.left + 2;
    const cut = step.bottom - paneBounds.top + 2;
    const bottom = Math.max(step.bottom, reveal.bottom) - paneBounds.top + 8;
    sheet.insertRule(`#canvas-pane.fallback-notch { clip-path: polygon(0 0, ${String(left)}px 0, ${String(left)}px ${String(cut)}px, ${String(right)}px ${String(cut)}px, ${String(right)}px 0, 100% 0, 100% ${String(bottom)}px, 0 ${String(bottom)}px); }`);
    await settle(canvas);
    publish.focus({ preventScroll: true });
    expect(active()).toBe(publish);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    pane.classList.add("fallback-notch");
    const hit = (element: HTMLElement) => {
      const { left, right, top, bottom } = element.getBoundingClientRect();
      return element.contains(root.elementFromPoint((left + right) / 2, (top + bottom) / 2));
    };
    expect([hit(picker), hit(button)]).toEqual([false, true]);
    expect(picker.disabled).toBe(false);
    expect(button.disabled).toBe(false);
    const nativeClick = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(nativeClick)).toBe(false);
    expect(active(), "only the painted named control can receive fallback focus").toBe(button);
    expect(requests).toEqual([]);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it.each([
    { name: "an ellipse", path: "ellipse(320px 195px at 280px 195px)" },
    { name: "a circle", path: "circle(260px at 268px 185px)" },
  ])("uses the browser clip for $name whose corner lies inside the measured bounding box", async ({ path }) => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule("#canvas-pane { block-size: 445px; overflow: visible; }", sheet.cssRules.length);
    sheet.insertRule(`#canvas-pane.ellipse-corner { clip-path: ${path}; }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 24, y: 14 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    publish.focus({ preventScroll: true });
    expect(active()).toBe(publish);
    const { left, right, top, bottom } = publish.getBoundingClientRect();
    const root = publish.getRootNode() as ShadowRoot;
    const hit = (x: number, y: number) => publish.contains(root.elementFromPoint(x, y));
    expect(hit(right - 4, bottom - 4)).toBe(true);
    pane.classList.add("ellipse-corner");
    expect(hit((left + right) / 2, (top + bottom) / 2)).toBe(true);
    expect(hit(right - 4, bottom - 4)).toBe(false);
    const nativeClick = new MouseEvent("click", { bubbles: true, composed: true, cancelable: true });
    expect(publish.dispatchEvent(nativeClick)).toBe(false);
    expect(active()).toBe(action(canvas, "review"));
    expect(requests).toEqual([]);
  });

  it("uses a visible action placement when the center of the proposal bounds crosses a polygon notch", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule("#canvas-pane { block-size: 445px; overflow: visible; clip-path: polygon(0 0, 100% 0, 100% 200px, 240px 200px, 240px 385px, 100% 385px, 100% 100%, 0 100%); }", sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 24, y: 14 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const reveal = await askReveal(canvas, "publish");
    const proposed = { x: -306, y: -222, scale: 1 };
    const proposal = { type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false };
    expect(requests).toEqual([proposal]);
    expect(active()).toBe(reveal);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(publish);
    expect(requests).toEqual([proposal]);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it("proposes the empty C-shaped pane's lower arm and focuses the original action on acceptance", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    reserveFixtureMapHeight(canvas, sheet);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible; transform: translateX(1px);
      clip-path: polygon(0 0, 100% 0, 100% 65px, 180px 65px, 180px 360px, 100% 360px, 100% 100%, 0 100%); }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const initial = canvas.viewport;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    const reveal = await askReveal(canvas, "publish");
    const expected = { x: -58, y: 60, scale: 1 };
    const proposal = { type: viewport, detail: { viewport: expected }, bubbles: true, composed: true, cancelable: false };
    expect(requests, "one request places the whole focus outline in the exposed arm").toEqual([proposal]);
    expect(active()).toBe(reveal);
    expect(canvas.viewport).toEqual(initial);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    canvas.viewport = lastViewport(requests);
    await settle(canvas);
    expect(active()).toBe(publish);
    expect(action(canvas, "publish")).toBe(publish);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([proposal]);
    await commands.press("Enter");
    expect(requests).toEqual([proposal, selectRequest("publish")]);
  });

  it.each([
    { name: "ellipse", path: "ellipse(450px 117px at 200px 0px)" },
    { name: "circle", path: "circle(450px at 200px -329px)" },
  ])("proposes a usable $name cap when every map action starts clipped", async ({ path }) => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible; transform: translateX(1px);
      clip-path: ${path}; }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const initial = canvas.viewport;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    const reveal = await askReveal(canvas, "publish");
    const expected = { x: -218, y: -248, scale: 1 };
    const proposal = { type: viewport, detail: { viewport: expected }, bubbles: true, composed: true, cancelable: false };
    expect(requests, "the rounded clip cap contains the complete proposed focus outline").toEqual([proposal]);
    expect(active()).toBe(reveal);
    expect(canvas.viewport).toEqual(initial);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    canvas.viewport = lastViewport(requests);
    await settle(canvas);
    expect(active()).toBe(publish);
    expect(action(canvas, "publish")).toBe(publish);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([proposal]);
    await commands.press("Enter");
    expect(requests).toEqual([proposal, selectRequest("publish")]);
  });

  it("places the original action in the narrow overlap of two curved host clips", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible; transform: translateX(1px);
      clip-path: ellipse(450px 117px at 200px 0px); }`, sheet.cssRules.length);
    sheet.insertRule("#canvas-frame { clip-path: ellipse(450px 117px at 250px 0px); }", sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const scroll = [pane.scrollLeft, pane.scrollTop];
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    const reveal = await askReveal(canvas, "publish");
    const proposed = lastViewport(requests);
    expect(proposed.x, "the outline center is in both curved clips").toBeGreaterThan(-194);
    expect(proposed.x).toBeLessThan(-192);
    expect(requests).toHaveLength(1);
    expect(active()).toBe(reveal);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(publish);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toHaveLength(1);
    await commands.press("Enter");
    expect(requests.slice(1)).toEqual([selectRequest("publish")]);
  });

  it("rejects the curve center when a straight host clip cuts through the proposed outline", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible; transform: translateX(1px);
      clip-path: ellipse(450px 117px at 200px 0px); }`, sheet.cssRules.length);
    sheet.insertRule("#canvas-frame { clip-path: polygon(0 0, 100% 0, 100% 100%, 132px 100%, 132px 60px, 0 60px); }", sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const scroll = [pane.scrollLeft, pane.scrollTop];
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    const reveal = await askReveal(canvas, "publish");
    const proposed = lastViewport(requests);
    expect(proposed.x, "the complete outline is to the right of the polygon edge").toBeGreaterThanOrEqual(-210);
    expect(requests).toHaveLength(1);
    expect(active()).toBe(reveal);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(publish);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toHaveLength(1);
    await commands.press("Enter");
    expect(requests.slice(1)).toEqual([selectRequest("publish")]);
  });

  it.each([
    { name: "an off-center vertical strip", path: "polygon(0 0, 100% 0, 100% 100%, 500px 100%, 500px 65px, 0 65px)" },
    { name: "a diagonal pane edge", path: "polygon(0 0, 100% 0, 100% 100%, 300px 100%, 600px 65px, 0 65px)" },
  ])("finds a usable proposal beyond the initial map center with $name", async ({ path }) => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible; clip-path: ${path}; }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const scroll = [pane.scrollLeft, pane.scrollTop];
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(getNode(canvas, "review")?.parentElement?.inert).toBe(true);
    const reveal = await askReveal(canvas, "publish");
    const proposed = lastViewport(requests);
    expect(proposed.x).toBeGreaterThan(-58);
    expect(proposed.scale).toBe(1);
    expect(requests).toHaveLength(1);
    expect(active()).toBe(reveal);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(publish);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toHaveLength(1);
  });

  it("places the focus outline in a polygon arm that fits its height exactly", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible;
      clip-path: polygon(0 0, 100% 0, 100% 65px, 110px 65px, 110px 310px, 640px 310px,
        640px 364px, 110px 364px, 110px 100%, 0 100%); }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const publish = action(canvas, "publish");
    const initialBounds = publish.getBoundingClientRect();
    const reveal = await askReveal(canvas, "publish");
    const proposed = lastViewport(requests);
    expect(proposed).toEqual({ x: -58, y: 2, scale: 1 });
    expect(active()).toBe(reveal);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(publish);
    expect(publish.getBoundingClientRect().top - initialBounds.top).toBe(2);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual([0, 0]);
    expect(requests).toHaveLength(1);
  });

  it("keeps the reveal pending when every exposed arm is too narrow for the focus outline", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    reserveFixtureMapHeight(canvas, sheet);
    sheet.insertRule(`#canvas-pane { block-size: 445px; overflow: visible;
      clip-path: polygon(0 0, 100% 0, 100% 65px, 100px 65px, 100px 412px, 100% 412px, 100% 100%, 0 100%); }`, sheet.cssRules.length);
    canvas.layout = [{ nodeId: "review", x: 330, y: 160 }, { nodeId: "publish", x: 330, y: 236 }];
    await settle(canvas);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    const reveal = await askReveal(canvas, "publish");
    const proposed = lastViewport(requests);
    expect(proposed).toEqual({ x: -58, y: -90, scale: 1 });
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(reveal);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toHaveLength(1);
  });

  it("keeps focus on the painted Step control after a polygon clips the pending Reveal", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    const { picker, button } = revealControls(canvas);
    const reveal = await askReveal(canvas, "revise");
    expect(reveal).toBe(button);
    expect(active()).toBe(reveal);
    const proposed = lastViewport(requests);
    const before = structuredClone(requests);
    const paneBounds = pane.getBoundingClientRect();
    const revealBounds = button.getBoundingClientRect();
    const left = revealBounds.left - paneBounds.left - 2;
    const right = revealBounds.right - paneBounds.left + 2;
    const bottom = revealBounds.bottom - paneBounds.top + 8;
    sheet.insertRule(`#canvas-pane.reveal-notch { clip-path: polygon(0 0, ${String(left)}px 0, ${String(left)}px ${String(bottom - 4)}px, ${String(right)}px ${String(bottom - 4)}px, ${String(right)}px 0, 100% 0, 100% ${String(bottom)}px, 0 ${String(bottom)}px); }`);
    pane.classList.add("reveal-notch");
    await settle(canvas);
    expect(active()).toBe(picker);
    expect(requests).toEqual(before);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(picker);
    expect(requests).toEqual(before);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual([0, 0]);
  });

  it.each([
    { key: "ArrowLeft", capture: "keydown" },
    { key: "Enter", capture: "click" },
  ] as const)("uses the first native $key after the host reveals an inert action", async ({ key, capture }) => {
    const { canvas, frame, pane, sheet, requests } = await mount(true);
    const review = action(canvas, "review");
    const face = getNode(canvas, "review")?.parentElement;
    const initiator = key === "ArrowLeft" ? action(canvas, "publish") : revealControls(canvas).button;
    sheet.insertRule("#canvas-frame.shifted { transform: translateX(-80px); }");
    frame.classList.add("shifted");
    await expect.poll(() => face?.inert).toBe(true);
    initiator.focus({ preventScroll: true });
    expect(active()).toBe(initiator);
    const inputs: { trusted: boolean; exposed: boolean; inert: boolean | undefined }[] = [];
    canvas.addEventListener(capture, (event) => {
      frame.classList.remove("shifted");
      inputs.push({ trusted: event.isTrusted, exposed: review.getBoundingClientRect().left > pane.getBoundingClientRect().left, inert: face?.inert });
    }, { capture: true, once: true });

    await commands.press(key);
    expect(inputs).toEqual([{ trusted: true, exposed: true, inert: true }]);
    expect(requests).toEqual([]);
    expect(active(), `the native ${key} reaches the newly exposed Review action without a second input`).toBe(review);
  });

  it("leaves native key handling on an unmanaged light-DOM workflow node alone", async () => {
    const { canvas, requests } = await mount();
    const review = action(canvas, "review");
    const foreign = document.createElement("ocelle-workflow-node");
    foreign.nodeId = "review";
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    const face = document.createElement("div");
    face.append(foreign);
    wrapper.append(face);
    svg.append(wrapper, document.createElementNS("http://www.w3.org/2000/svg", "rect"));
    canvas.append(svg);
    await foreign.updateComplete;
    const foreignButton = foreign.shadowRoot?.querySelector("button");
    if (foreignButton == null) throw new Error("The external workflow node action is missing");
    review.focus();

    const key = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, composed: true, cancelable: true });
    expect(foreignButton.dispatchEvent(key), "the canvas does not consume input from a foreign action using the same stable ID").toBe(true);
    expect(active()).toBe(review);
    expect(requests).toEqual([]);
  });

  it("leaves a non-node control in the map to handle its own key input", async () => {
    const { canvas, requests } = await mount();
    const map = canvas.shadowRoot?.querySelector("svg");
    expect(map).toBeInstanceOf(SVGSVGElement);
    if (map == null) throw new Error("The map is missing");

    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "foreignObject");
    const face = document.createElement("div");
    const controlHost = document.createElement("div");
    const independent = control("Independent control");
    controlHost.attachShadow({ mode: "open" }).append(independent);
    face.append(controlHost);
    wrapper.append(face);
    map.append(wrapper, document.createElementNS("http://www.w3.org/2000/svg", "rect"));

    const review = action(canvas, "review");
    review.focus();
    const key = new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, composed: true, cancelable: true });
    expect(independent.dispatchEvent(key), "the canvas leaves key input to a native control outside its workflow nodes").toBe(true);
    expect(active()).toBe(review);
    expect(requests).toEqual([]);
  });

  it("restores eligibility after a same-task attempt to focus a clipped node", async () => {
    const { canvas, frame, before, requests } = await mount(true);
    const publish = action(canvas, "publish");
    before.focus();
    frame.classList.add("move-away");
    publish.focus({ preventScroll: true });
    expect(active()).not.toBe(publish);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);

    frame.classList.remove("move-away");
    await settle(canvas);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(false);
    expect(active()).not.toBe(publish);
    expect(requests).toEqual([]);
  });


  it("draws the supplied branching graph, carrying the labels and source outcomes into the existing node controls", async () => {
    const { canvas, requests } = await mount();
    const rendered = [...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []];
    expect(rendered.map((step) => ({ id: step.nodeId, label: step.label, kind: step.kind, outcomes: step.outcomes }))).toEqual([
      { id: "review", label: "Initial review", kind: "Approval", outcomes: ["Approved", "Rejected"] },
      { id: "publish", label: "Publish", kind: "Publication", outcomes: ["Published"] },
      { id: "revise", label: "Revise", kind: "Planning", outcomes: [] },
    ]);
    const edges = [...canvas.shadowRoot?.querySelectorAll<SVGPathElement>("svg g[aria-hidden='true'] path") ?? []];
    expect(edges).toHaveLength(2);
    expect(edges.map((edge) => edge.getTotalLength()).every((length) => length > 0)).toBe(true);
    expect(requests).toEqual([]);
  });

  it("draws the supplied self connection outside the step card and inside the visible map", async () => {
    const { canvas, requests } = await mount();
    const connection = { sourceId: "review", outcomeId: "approved", destinationId: "review" };
    canvas.graph = { nodes: namedSteps.filter(({ id }) => id === "review"), connections: [connection] };
    canvas.layout = [{ nodeId: "review", x: 230, y: 40 }];
    await settle(canvas);
    const card = getNode(canvas, "review");
    const map = canvas.shadowRoot?.querySelector("svg");
    const edges = [...map?.querySelectorAll<SVGPathElement>("g[aria-hidden='true'] path") ?? []];
    expect(edges).toHaveLength(1);
    const [edge] = edges;
    if (edge === undefined || card === undefined || map === undefined || map === null) throw new Error("Self edge fixture missing");
    const edgeBounds = edge.getBoundingClientRect();
    const cardBounds = card.getBoundingClientRect();
    const mapBounds = map.getBoundingClientRect();
    expect(edgeBounds.right, "the loop exposes a visible arc outside the opaque step card").toBeGreaterThan(cardBounds.right + 5);
    expect(edgeBounds.height).toBeGreaterThan(5);
    expect(edgeBounds.right).toBeLessThan(cardBounds.right + cardBounds.height);
    expect(edgeBounds.right).toBeLessThan(mapBounds.right);
    expect(edgeBounds.top).toBeGreaterThan(mapBounds.top);
    expect(edgeBounds.bottom).toBeLessThan(mapBounds.bottom);
    expect(canvas.graph.connections).toEqual([connection]);
    expect(requests).toEqual([]);
  });

  it("emits exactly one composed native selection on pointer, Enter and Space without changing supplied snapshots", async () => {
    const { canvas, requests, activity } = await mount();
    const review = action(canvas, "review");
    const originalGraph = structuredClone(canvas.graph);
    const originalLayout = structuredClone(canvas.layout);
    await click(review);
    await commands.press("Enter");
    await commands.press("Space");
    const one = selectRequest("review");
    expect(requests).toEqual([one, one, one]);
    expect(activity).toEqual([selection, "native click", selection, "native click", selection, "native click"]);
    expect(canvas.graph).toEqual(originalGraph);
    expect(canvas.layout).toEqual(originalLayout);
    expect(canvas.selectedNodeId).toBe("publish");
    expect(action(canvas, "publish").getAttribute("aria-pressed")).toBe("true");
    expect(review.getAttribute("aria-pressed")).toBe("false");

    canvas.graph = {
      ...canvas.graph,
      nodes: canvas.graph.nodes.map((step) => step.id === "review" ? { ...step, label: "Final review" } : step),
    };
    await settle(canvas);
    expect(action(canvas, "review")).toBe(review);
    expect(active()).toBe(review);
    expect(review.textContent.trim()).toBe("Final review");
    expect(requests).toEqual([one, one, one]);
    await commands.press("Enter");
    expect(requests).toEqual([one, one, one, one]);
  });

  it("distinguishes repeated step titles through the native accessible names and named destinations", async () => {
    const { canvas, requests } = await mount();
    const publish = action(canvas, "publish");
    canvas.graph = {
      ...canvas.graph,
      nodes: canvas.graph.nodes.map((step) => step.id === "publish" ? { ...step, label: "Initial review" } : step),
    };
    await settle(canvas);
    expect(action(canvas, "publish")).toBe(publish);
    const names = (await axButtons()).filter((name) => name.startsWith("Initial review"));
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
    const { picker } = revealControls(canvas);
    const named = [...picker.options].filter((option) => option.value === "review" || option.value === "publish");
    expect(named.map((option) => option.value)).toEqual(["review", "publish"]);
    expect(new Set(named.map((option) => option.textContent)).size).toBe(2);
    expect(requests).toEqual([]);
  });

  it("drops an interrupted press across a keyed replacement and selects only on a fresh activation", async () => {
    const { canvas, requests } = await mount();
    const review = action(canvas, "review");
    const pressed = point(review);
    await commands.pointerPath([{ ...pressed, down: true }]);
    canvas.graph = {
      nodes: canvas.graph.nodes.map((step) => step.id === "review" ? { ...step, id: "new-review" } : step),
      connections: canvas.graph.connections.filter((connection) => connection.sourceId !== "review"),
    };
    canvas.layout = canvas.layout.map((entry) => entry.nodeId === "review" ? { ...entry, nodeId: "new-review" } : entry);
    await settle(canvas);
    const replacement = action(canvas, "new-review");
    expect(replacement).not.toBe(review);
    await commands.pointerPath([{ ...pressed, up: true }]);
    expect(requests).toEqual([]);
    await click(replacement);
    expect(requests).toEqual([selectRequest("new-review")]);
  });

  it("has one entry in each Tab direction and keeps arrows and endpoints bounded to visible actions", async () => {
    const fixture = await mount();
    const { canvas, requests } = fixture;
    const publish = action(canvas, "publish");
    expect(await tabGroup(fixture)).toEqual(["publish"]);
    expect(await tabGroup(fixture, true)).toEqual(["publish"]);

    publish.focus({ preventScroll: true });
    await commands.press("ArrowRight");
    expect(focusId(canvas)).toBe("publish");
    await commands.press("ArrowUp");
    expect(focusId(canvas)).toBe("review");
    await commands.press("ArrowLeft");
    expect(focusId(canvas)).toBe("review");
    await commands.press("End");
    expect(focusId(canvas)).toBe("publish");
    await commands.press("Home");
    expect(focusId(canvas)).toBe("review");
    await commands.press("ArrowDown");
    expect(focusId(canvas)).toBe("publish");
    expect(requests).toEqual([]);
  });

  it("uses the eligible survivor and then a named fallback without pulling external focus into the canvas", async () => {
    const { canvas, before, requests } = await mount();
    const review = action(canvas, "review");
    review.focus({ preventScroll: true });
    expect(focusId(canvas)).toBe("review");
    canvas.viewport = { ...initialViewport, x: -240 };
    await settle(canvas);
    expect(focusId(canvas)).toBe("publish");
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter((step) => step.id !== "publish") };
    await settle(canvas);
    const { picker, button } = revealControls(canvas);
    expect([picker, button]).toContain(active());
    before.focus();
    canvas.graph = { nodes: [], connections: [] };
    await settle(canvas);
    expect(active()).toBe(before);
    expect(requests).toEqual([]);
  });

  it("retains a native named tab stop when the last focused step is removed", async () => {
    const { canvas, before, after, requests } = await mount();
    canvas.graph = { nodes: namedSteps.filter(({ id }) => id === "review"), connections: [] };
    await settle(canvas);
    action(canvas, "review").focus({ preventScroll: true });
    expect(focusId(canvas)).toBe("review");

    canvas.graph = { nodes: [], connections: [] };
    await settle(canvas);
    const { picker, button } = revealControls(canvas);
    expect(active(), "the empty canvas keeps focus on its visible named picker").toBe(picker);
    expect(picker.disabled).toBe(false);
    expect(picker.options).toHaveLength(0);
    expect(button.disabled).toBe(true);
    before.focus();
    await commands.press("Tab");
    expect(active()).toBe(picker);
    await commands.press("Tab");
    expect(active()).toBe(after);
    await commands.press("Tab", ["Shift"]);
    expect(active()).toBe(picker);
    expect(requests).toEqual([]);
  });

  it("keeps an eligible focused action through a host reorder of keyed nodes without emitting requests", async () => {
    const { canvas, requests } = await mount();
    const publish = action(canvas, "publish");
    publish.focus({ preventScroll: true });
    canvas.graph = {
      ...canvas.graph,
      nodes: [...canvas.graph.nodes].reverse(),
    };
    await settle(canvas);
    expect(action(canvas, "publish")).toBe(publish);
    expect(active()).toBe(publish);
    expect(requests).toEqual([]);
  });

  it("keeps focus on the named reveal control while the host withholds the view and hands off when accepted", async () => {
    const { canvas, requests } = await mount();
    const revise = action(canvas, "revise");
    const reveal = await askReveal(canvas, "revise");
    const view = lastViewport(requests);
    expect(requests).toHaveLength(1);
    await settle(canvas);
    expect(active()).toBe(reveal);
    expect(canvas.viewport).toEqual(initialViewport);
    revise.focus({ preventScroll: true });
    expect(active()).toBe(reveal);
    const hiddenNames = await axButtons();
    expect(hiddenNames.some((name) => name.startsWith("Revise"))).toBe(false);

    canvas.viewport = view;
    await expect.poll(() => active()).toBe(revise);
    expect(action(canvas, "revise")).toBe(revise);
    expect(requests).toHaveLength(1);
    const restoredNames = await axButtons();
    expect(restoredNames.some((name) => name.startsWith("Revise"))).toBe(true);
  });

  it.each([
    { name: "clipped enabled", offset: -1000, disabled: false, inView: false },
    { name: "visible disabled", offset: 0, disabled: true, inView: true },
  ])("skips a $name first control during native focus recovery", async ({ offset, disabled, inView }) => {
    const { canvas, pane, requests } = await mount(true);
    const { picker, button: reveal } = revealControls(canvas);
    const root = canvas.shadowRoot;
    if (root === null) throw new Error("The canvas is missing its shadow root");
    const appearance = new CSSStyleSheet();
    appearance.replaceSync(`.navigator select { transform: translateX(${String(offset)}px); }`);
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, appearance];
    picker.disabled = disabled;
    await settle(canvas);

    const clip = pane.getBoundingClientRect();
    const visibleInPane = (control: HTMLElement) => {
      const box = control.getBoundingClientRect();
      return clip.left <= box.left && box.right <= clip.right && clip.top <= box.top && box.bottom <= clip.bottom;
    };
    expect({ disabled: picker.matches(":disabled"), visible: visibleInPane(picker) }).toEqual({ disabled, visible: inView });
    expect({ disabled: reveal.matches(":disabled"), visible: visibleInPane(reveal) }).toEqual({ disabled: false, visible: true });
    const publish = action(canvas, "publish");
    publish.focus({ preventScroll: true });
    expect(active()).toBe(publish);

    const scroll = [pane.scrollLeft, pane.scrollTop];
    canvas.viewport = { x: -2000, y: 0, scale: 1 };
    await settle(canvas);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    expect(active(), "the eligible native Reveal control receives focus").toBe(reveal);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([]);
  });

  it("recovers an idle clipped reveal initiator to the visible named picker without scrolling", async () => {
    const { canvas, pane, frame, sheet, requests } = await mount(true);
    canvas.graph = { nodes: namedSteps.filter(({ id }) => id === "revise"), connections: [] };
    canvas.layout = [{ nodeId: "revise", x: 2000, y: 20 }];
    sheet.replaceSync(`${fixtureStyles(440)} #canvas-pane { overflow: hidden; }`);
    await document.fonts.ready;
    await settle(canvas);
    const hidden = action(canvas, "revise");
    const { picker, button } = revealControls(canvas);
    const clip = pane.getBoundingClientRect();
    expect(hidden.getBoundingClientRect().left).toBeGreaterThan(clip.right);
    expect(button.getBoundingClientRect().right).toBeLessThan(clip.right);
    const shift = clip.right - button.getBoundingClientRect().right + 15;
    sheet.insertRule(`#canvas-frame.reveal-clipped { transform: translateX(${String(shift)}px); }`);
    const reveal = await askReveal(canvas, "revise");
    const proposed = lastViewport(requests);
    expect(active()).toBe(reveal);
    const before = { width: frame.offsetWidth, height: frame.offsetHeight, scroll: pane.scrollLeft, viewport: structuredClone(canvas.viewport) };
    frame.classList.add("reveal-clipped");
    expect(button.getBoundingClientRect().right).toBeGreaterThan(clip.right);
    expect(picker.getBoundingClientRect().left).toBeGreaterThanOrEqual(clip.left);
    expect(picker.getBoundingClientRect().right).toBeLessThan(clip.right);
    expect(hidden.getBoundingClientRect().left).toBeGreaterThan(clip.right);

    await expect.poll(() => active(), { message: "the visible picker receives focus when idle host translation clips the pending reveal button" }).toBe(picker);
    expect({ width: frame.offsetWidth, height: frame.offsetHeight, scroll: pane.scrollLeft, viewport: canvas.viewport }).toEqual(before);
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
  });

  it("focuses the native picker when removing the only pending reveal destination disables its button", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    canvas.graph = { nodes: namedSteps.filter(({ id }) => id === "revise"), connections: [] };
    sheet.insertRule("#canvas-pane { block-size: 390px; }", sheet.cssRules.length);
    pane.scrollTop = 4;
    await document.fonts.ready;
    await settle(canvas);
    const reveal = await askReveal(canvas, "revise");
    const { picker } = revealControls(canvas);
    const proposed = lastViewport(requests);
    expect(active()).toBe(reveal);
    expect(pane.scrollTop).toBe(4);

    canvas.graph = { nodes: [], connections: [] };
    await settle(canvas);
    expect(reveal.disabled).toBe(true);
    expect(pane.scrollTop).toBe(4);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
    expect(active(), "the named picker receives focus after the last pending destination is removed").toBe(picker);
  });

  it("preserves external focus when removing a destination whose reveal never acquired focus", async () => {
    const { canvas, before, requests } = await mount();
    canvas.graph = { nodes: namedSteps.filter(({ id }) => id === "revise"), connections: [] };
    await settle(canvas);
    const { picker, button } = revealControls(canvas);
    before.focus();

    canvas.inert = true;
    button.click();
    const proposed = lastViewport(requests);
    expect(active()).toBe(before);

    canvas.inert = false;
    canvas.graph = { nodes: [], connections: [] };
    await settle(canvas);
    expect(button.disabled).toBe(true);
    expect(picker.disabled).toBe(false);
    expect(active(), "focus stays with the host when the reveal initiator never owned it").toBe(before);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(requests).toEqual([{ type: viewport, detail: { viewport: proposed }, bubbles: true, composed: true, cancelable: false }]);
  });

  it("ignores an older reveal when only its target appears and fulfills the latest reveal from the same control", async () => {
    const { canvas, requests } = await mount();
    action(canvas, "revise");
    canvas.graph = {
      ...canvas.graph,
      nodes: [...canvas.graph.nodes, { id: "archive", label: "Archive", kind: "Retention", accountableRole: "Author", outcomes: [] }],
    };
    canvas.layout = [...canvas.layout, { nodeId: "archive", x: 2140, y: 20 }];
    await settle(canvas);
    const archive = action(canvas, "archive");
    await askReveal(canvas, "revise");
    const older = lastViewport(requests);
    const reveal = await askReveal(canvas, "archive");
    const newer = lastViewport(requests);
    expect(newer).not.toEqual(older);
    canvas.viewport = older;
    await settle(canvas);
    expect(active()).toBe(reveal);
    canvas.viewport = newer;
    await expect.poll(() => active()).toBe(archive);
    expect(requests.map((request) => request.type)).toEqual([viewport, viewport]);
  });

  it("cancels a pending focus handoff when focus leaves the initiating control, even after it returns there", async () => {
    const { canvas, before, requests } = await mount();
    const revise = action(canvas, "revise");
    const reveal = await askReveal(canvas, "revise");
    const view = lastViewport(requests);
    before.focus();
    reveal.focus({ preventScroll: true });
    canvas.viewport = view;
    await settle(canvas);
    expect(active()).toBe(reveal);
    expect(active()).not.toBe(revise);
    expect(requests).toHaveLength(1);
  });

  it.each(["coincident", "zoom-converged"] as const)("raises a covered %s named action locally without changing the supplied view", async (overlap) => {
    const fixture = await mount();
    const { canvas, requests } = fixture;
    action(canvas, "review");
    canvas.layout = canvas.layout.map((entry) => {
      if (entry.nodeId === "revise") return { ...entry, x: 10_000 };
      if (entry.nodeId === "publish" && overlap === "coincident") return { ...entry, x: 30 };
      return entry;
    });
    canvas.viewport = { ...initialViewport, scale: overlap === "coincident" ? 1 : 0.1 };
    await settle(canvas);
    const review = action(canvas, "review");
    expect(await tabGroup(fixture)).toEqual(["publish"]);
    const beforeLayout = structuredClone(canvas.layout);
    const beforeViewport = structuredClone(canvas.viewport);
    await askReveal(canvas, "review");
    await expect.poll(() => active()).toBe(review);
    expect(action(canvas, "review")).toBe(review);
    expect(canvas.layout).toEqual(beforeLayout);
    expect(canvas.viewport).toEqual(beforeViewport);
    expect(requests).toEqual([]);
    await click(review);
    expect(requests).toEqual([selectRequest("review")]);
  });

  it("waits for host-pane scrolling before handing focus to a node clipped beyond the map's own bounds", async () => {
    const { canvas, pane, sheet, requests } = await mount(true);
    const publish = action(canvas, "publish");
    const width = publish.getBoundingClientRect().right - pane.getBoundingClientRect().left - 4;
    sheet.replaceSync(fixtureStyles(width));
    await settle(canvas);
    expect(publish.getBoundingClientRect().right).toBeGreaterThan(pane.getBoundingClientRect().right);
    const reveal = await askReveal(canvas, "publish");
    lastViewport(requests);
    canvas.viewport = { x: -1, y: 0, scale: 1 };
    await settle(canvas);
    expect(active()).toBe(reveal);
    expect(pane.scrollLeft).toBe(0);
    expect(canvas.viewport).toEqual({ x: -1, y: 0, scale: 1 });
    expect(requests).toHaveLength(1);

    pane.scrollLeft = 25;
    await expect.poll(() => active()).toBe(publish);
    expect(pane.scrollLeft).toBe(25);
    expect(requests).toHaveLength(1);

    pane.scrollLeft = 0;
    await expect.poll(() => focusId(canvas)).toBe("review");
    expect(pane.scrollLeft).toBe(0);
    expect(requests).toHaveLength(1);
  });

  it("blocks pre-observer focus and activation when an enclosing host repositions, then restores the same action", async () => {
    const fixture = await mount(true);
    const { canvas, frame, pane, before, requests } = fixture;
    const publish = action(canvas, "publish");
    const initial = { width: frame.offsetWidth, height: frame.offsetHeight, scroll: pane.scrollLeft, viewport: structuredClone(canvas.viewport) };
    expect((await axButtons()).some((name) => name.startsWith("Publish"))).toBe(true);
    before.focus();
    frame.classList.add("move-away");
    publish.focus({ preventScroll: true });
    publish.click();
    expect(active()).not.toBe(publish);
    expect(requests).toEqual([]);
    await expect.poll(async () => (await axButtons()).some((name) => name.startsWith("Publish"))).toBe(false);
    expect(await tabGroup(fixture)).toEqual([]);

    frame.classList.remove("move-away");
    await expect.poll(async () => (await axButtons()).some((name) => name.startsWith("Publish"))).toBe(true);
    expect(action(canvas, "publish")).toBe(publish);
    expect(await tabGroup(fixture)).toEqual(["publish"]);
    expect({ width: frame.offsetWidth, height: frame.offsetHeight, scroll: pane.scrollLeft, viewport: canvas.viewport }).toEqual(initial);
    expect(requests).toEqual([]);
    await click(publish);
    expect(requests).toEqual([selectRequest("publish")]);
  });

  it.each(["light", "dark", "forced"] as const)("keeps the actual native target and focus indicator at a reduced scale in %s", async (mode) => {
    const { canvas, requests } = await mount();
    action(canvas, "review");
    document.documentElement.dataset.theme = mode === "dark" ? "dark" : "light";
    await commands.emulateForcedColors(mode === "forced" ? "active" : "none");
    canvas.viewport = { ...initialViewport, scale: 0.6 };
    await settle(canvas);
    const publish = action(canvas, "publish");
    await commands.press("Tab");
    publish.focus({ preventScroll: true });
    const { width, height } = publish.getBoundingClientRect();
    const style = getComputedStyle(publish);
    const min = Math.max(Number.parseFloat(style.minInlineSize), Number.parseFloat(style.minBlockSize));
    expect(active()).toBe(publish);
    expect(min).toBeGreaterThan(0);
    expect(Math.min(width, height)).toBeGreaterThanOrEqual(min);
    expect(style.outlineStyle).toBe("solid");
    expect(Number.parseFloat(style.outlineWidth)).toBeGreaterThan(0);
    expect(requests).toEqual([]);
  });
});

afterEach(async () => {
  delete document.documentElement.dataset.theme;
  await commands.emulateForcedColors("none");
});

const connection = "ocelle-workflow-canvas-connection-request";

function followAction(name: RegExp | string): HTMLButtonElement {
  const actions = page.getByRole("button", { name, exact: typeof name === "string" }).elements();
  expect(actions, `the named relationship exposes one native action matching ${String(name)}`).toHaveLength(1);
  const action = actions[0];
  expect(action).toBeInstanceOf(HTMLButtonElement);
  if (!(action instanceof HTMLButtonElement)) throw new Error("Native relationship action missing");
  return action;
}

function visibleRelationship(canvas: OcelleWorkflowCanvas, labels: readonly string[], follow?: HTMLButtonElement): HTMLElement | undefined {
  return [...canvas.shadowRoot?.querySelectorAll("*") ?? []].reverse().find((element): element is HTMLElement => (
    element instanceof HTMLElement && element.closest("svg, select, [hidden], [aria-hidden=true]") === null
    && element.querySelector("svg, select") === null && element.getClientRects().length > 0
    && getComputedStyle(element).visibility === "visible" && (follow === undefined || element.contains(follow))
    && labels.every((label) => element.innerText.includes(label))
  ));
}

describe("workflow canvas named run inspection in process", () => {
  it("recovers visible focus when an independently scrolled relationship list hides the withheld Follow", async () => {
    const { canvas, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    const source = canvas.graph.nodes[0];
    if (source === undefined) throw new Error("The scroll fixture requires its Review source");
    const more = Array.from({ length: 18 }, (_, index) => ({ ...source, id: `review-${String(index)}`, label: `Review step ${String(index)}` }));
    canvas.graph = {
      nodes: [...canvas.graph.nodes, ...more],
      connections: [source, ...more].map(({ id }) => ({ sourceId: id, outcomeId: "approved", destinationId: "publish" })),
    };
    canvas.layout = canvas.layout.map((entry) => entry.nodeId === "publish" ? { ...entry, x: 1080 } : entry);
    await settle(canvas);
    const follow = followAction(/^Follow Publish from Initial review via Approved$/i);
    const list = follow.closest("ul");
    expect(list).toBeInstanceOf(HTMLElement);
    if (list === null) throw new Error("Scrollable relationship list missing");
    const { picker } = revealControls(canvas);
    const before = canvas.viewport;
    const outerScroll = [pane.scrollLeft, pane.scrollTop];
    await keyboardActivate(follow);
    const proposed = lastViewport(requests);
    const expected = [presentationRequest(viewport, { viewport: proposed })];
    expect(active()).toBe(follow);
    expect(follow.getBoundingClientRect().top).toBeGreaterThanOrEqual(list.getBoundingClientRect().top);
    list.scrollTop = list.scrollHeight;
    await settle(canvas);
    expect(list.scrollTop).toBeGreaterThan(0);
    expect(follow.getBoundingClientRect().bottom).toBeLessThan(list.getBoundingClientRect().top);
    expect(canvas.viewport).toBe(before);
    expect(active() === picker, "a withheld Follow moves focus to the visible Step before any viewport acceptance").toBe(true);
    const internalScroll = list.scrollTop;
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(picker);
    expect(list.scrollTop).toBe(internalScroll);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(outerScroll);
    expect(requests).toEqual(expected);
  });

  it.each(["graph swap", "layout removal", "focus taken"] as const)("checks live %s after a Follow control receives focus and before publishing", async (change) => {
    const { canvas, before, after, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    const viewportBefore = canvas.viewport;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    let didFocus = false;
    before.focus({ preventScroll: true });
    follow.addEventListener("focus", () => {
      didFocus = true;
      if (change === "graph swap") {
        canvas.graph = { ...canvas.graph, connections: canvas.graph.connections.map((edge) => edge.destinationId === "revise" ? { ...edge, destinationId: "publish" } : edge) };
      } else if (change === "layout removal") {
        canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId !== "revise");
      } else {
        after.focus({ preventScroll: true });
      }
    }, { once: true });
    follow.click();
    expect(didFocus).toBe(true);
    expect(requests, "the focus listener invalidates Follow before it emits a viewport request").toEqual([]);
    await settle(canvas);
    const expectedFocus = change === "focus taken" ? after : change === "layout removal" ? revealControls(canvas).picker : follow;
    expect(active()).toBe(expectedFocus);
    expect(canvas.viewport).toBe(viewportBefore);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([]);
  });

  it.each([true, false])("uses the rendered host viewport supplied during Follow focus when it already reveals the target (%s)", async (alreadyReveals) => {
    const { canvas, after, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    const initial = canvas.viewport;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    await keyboardActivate(follow);
    const suitable = lastViewport(requests);
    const proposal = presentationRequest(viewport, { viewport: suitable });
    expect(canvas.viewport).toBe(initial);
    expect(requests).toEqual([proposal]);

    after.focus({ preventScroll: true });
    const accepted = alreadyReveals ? suitable : { ...suitable, x: Math.trunc(suitable.x / 10), y: Math.trunc(suitable.y / 10) };
    follow.addEventListener("focus", () => { canvas.viewport = accepted; }, { once: true });
    follow.click();
    expect(canvas.viewport).toBe(accepted);
    expect(requests, "Follow sends no proposal from geometry rendered before the host viewport update").toEqual([proposal]);
    await settle(canvas);

    const destination = action(canvas, "revise");
    expect(active()).toBe(alreadyReveals ? destination : follow);
    expect(requests).toEqual(alreadyReveals ? [proposal] : [proposal, proposal]);
    expect(canvas.viewport).toBe(accepted);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    canvas.viewport = suitable;
    await settle(canvas);
    expect(active()).toBe(destination);
    expect(requests).toEqual(alreadyReveals ? [proposal] : [proposal, proposal]);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it("discards a canceled Follow when its relation is restored before render and an unrelated viewport arrives", async () => {
    const { canvas, after, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    await keyboardActivate(follow);
    const view = lastViewport(requests);
    const expected = [presentationRequest(viewport, { viewport: view })];
    expect(requests).toEqual(expected);
    const suppliedGraph = canvas.graph;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    after.focus({ preventScroll: true });
    follow.addEventListener("focus", () => {
      canvas.graph = { ...canvas.graph, connections: canvas.graph.connections.map((edge) => edge.destinationId === "revise" ? { ...edge, destinationId: "publish" } : edge) };
    }, { once: true });
    follow.click();
    canvas.graph = suppliedGraph;
    await settle(canvas);
    expect(requests).toEqual(expected);
    expect(active()).toBe(follow);

    canvas.viewport = view;
    await settle(canvas);
    expect(await axButtons()).toContain("Revise");
    expect(active() === follow, "an unrelated host view cannot transfer focus for an already canceled Follow").toBe(true);
    expect(requests).toEqual(expected);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);

    await keyboardActivate(follow);
    expect(focusId(canvas)).toBe("revise");
    expect(requests).toEqual(expected);
  });

  it("keeps a newer Follow when both activations wait on the same host render", async () => {
    const { canvas, before, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    canvas.layout = [
      { nodeId: "review", x: 24, y: 20 }, { nodeId: "publish", x: 960, y: 20 }, { nodeId: "revise", x: 1740, y: 20 },
    ];
    await settle(canvas);
    const publish = followAction(/\b(?:follow|reveal)\b.*\bPublish\b/i);
    const revise = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    const accepted = { x: -42, y: 18, scale: 1 };
    const scroll = [pane.scrollLeft, pane.scrollTop];
    before.focus({ preventScroll: true });
    publish.addEventListener("focus", () => { canvas.viewport = accepted; }, { once: true });
    publish.click();
    revise.click();
    expect(requests).toEqual([]);
    await settle(canvas);
    const proposal = lastViewport(requests);
    expect(requests).toEqual([presentationRequest(viewport, { viewport: proposal })]);
    expect(active()).toBe(revise);
    expect(canvas.viewport).toBe(accepted);
    canvas.viewport = proposal;
    await settle(canvas);
    expect(focusId(canvas)).toBe("revise");
    expect(requests).toEqual([presentationRequest(viewport, { viewport: proposal })]);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it.each(["horizontal position", "vertical position", "another step at the old position"] as const)("refuses a stale Follow before taking focus after a same-task change to %s", async (change) => {
    const { canvas, before, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    const original = canvas.layout.find(({ nodeId }) => nodeId === "revise");
    if (original === undefined) throw new Error("The positioning fixture needs Revise in the rendered layout");
    const updated = change === "horizontal position" ? { ...original, x: original.x + 40 }
      : change === "vertical position" ? { ...original, y: original.y + 40 } : { ...original, nodeId: "review" };
    before.focus({ preventScroll: true });
    canvas.layout = canvas.layout.map((entry) => entry === original ? updated : entry);
    follow.click();
    expect(active(), "an outdated rendered destination must not take focus").toBe(before);
    expect(requests).toEqual([]);
    await settle(canvas);
    expect(active()).toBe(before);
    expect(requests).toEqual([]);
  });

  it.each(["relationship", "layout", "viewport"] as const)("checks the live %s before a scroll-driven Follow handoff in the same task", async (change) => {
    const { canvas, pane, sheet, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const target = action(canvas, "publish");
    const targetBounds = target.getBoundingClientRect();
    const paneBounds = pane.getBoundingClientRect();
    const left = targetBounds.left - paneBounds.left - 10;
    const top = targetBounds.top - paneBounds.top - 8;
    const bottom = targetBounds.bottom - paneBounds.top + 8;
    sheet.insertRule(`#canvas-pane.hide-follow-destination { clip-path: polygon(0 0, 100% 0, 100% ${String(top)}px,
      ${String(left)}px ${String(top)}px, ${String(left)}px ${String(bottom)}px, 100% ${String(bottom)}px, 100% 100%, 0 100%); }`, sheet.cssRules.length);
    pane.classList.add("hide-follow-destination");
    await settle(canvas);
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(true);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bPublish\b/i);
    await keyboardActivate(follow);
    const expected = [presentationRequest(viewport, { viewport: lastViewport(requests) })];
    expect(active()).toBe(follow);
    const scroll = [pane.scrollLeft, pane.scrollTop];

    if (change === "relationship") {
      canvas.graph = { ...canvas.graph, connections: canvas.graph.connections.map((edge) => edge.destinationId === "publish" ? { ...edge, destinationId: "revise" } : edge) };
    } else if (change === "layout") {
      canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId !== "publish");
    } else {
      canvas.viewport = { ...canvas.viewport, x: 720 };
    }
    pane.classList.remove("hide-follow-destination");
    pane.dispatchEvent(new Event("scroll"));
    expect(getNode(canvas, "publish")?.parentElement?.inert).toBe(false);
    expect(active(), "the old painted target does not receive focus during the host update").toBe(follow);
    expect(requests).toEqual(expected);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it.each(["relationship", "layout"] as const)("recovers Step when an unactivated Follow loses its %s", async (removed) => {
    const { canvas, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
    await settle(canvas);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    const { picker } = revealControls(canvas);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    action(canvas, "publish").focus({ preventScroll: true });
    await commands.press("Tab");
    expect(active()).toBe(follow);
    expect(requests).toEqual([]);
    if (removed === "relationship") canvas.graph = { ...canvas.graph, connections: [] };
    else canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId !== "revise");
    await settle(canvas);
    expect(active() === picker, "a focused unavailable Follow recovers to the visible Step without activation").toBe(true);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([]);
  });

  it("follows the swapped clipped destination by keyboard while the host owns viewport and selection", async () => {
    const { canvas, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const visible = visibleRelationship(canvas, ["Initial review", "Approved", "Publish"]);
    expect(visible, "the read-only navigator presents the supplied source, outcome and destination together").toBeInstanceOf(HTMLElement);
    await keyboardActivate(followAction(/\b(?:follow|reveal)\b.*\bPublish\b/i));
    await settle(canvas);
    expect(focusId(canvas), "following a visible destination focuses its existing node action").toBe("publish");
    expect(requests).toEqual([]);

    canvas.graph = { ...canvas.graph, connections: [
      { sourceId: "review", outcomeId: "approved", destinationId: "revise" },
      { sourceId: "review", outcomeId: "rejected", destinationId: "publish" },
    ] };
    await settle(canvas);
    const graph = canvas.graph;
    const layout = canvas.layout;
    const supplied = canvas.viewport;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    const otherFollow = followAction(/\b(?:follow|reveal)\b.*\bPublish\b/i);
    const swapped = visibleRelationship(canvas, ["Initial review", "Approved", "Revise"], follow);
    const other = visibleRelationship(canvas, ["Initial review", "Rejected", "Publish"], otherFollow);
    expect(swapped, "the same outcome now names and follows Revise").toBeInstanceOf(HTMLElement);
    expect(other, "the alternate outcome now names and follows Publish").toBeInstanceOf(HTMLElement);
    expect(swapped?.contains(otherFollow)).toBe(false);
    expect(other?.contains(follow)).toBe(false);
    expect(await axButtons()).not.toContain("Revise");
    await keyboardActivate(follow);
    await settle(canvas);
    const proposed = lastViewport(requests);
    const reveal = presentationRequest(viewport, { viewport: proposed });
    expect(requests).toEqual([reveal]);
    expect(canvas.viewport).toBe(supplied);
    expect(active()).toBe(follow);

    canvas.viewport = proposed;
    await settle(canvas);
    expect(focusId(canvas)).toBe("revise");
    expect(getComputedStyle(action(canvas, "revise")).outlineStyle).toBe("solid");
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(canvas.selectedNodeId).toBe("publish");
    expect(requests).toEqual([reveal]);
    await commands.press("Enter");
    expect(requests).toEqual([reveal, selectRequest("revise")]);
    expect(canvas.selectedNodeId).toBe("publish");
    canvas.selectedNodeId = "revise";
    await settle(canvas);
    expect(action(canvas, "revise").getAttribute("aria-pressed")).toBe("true");
    expect(canvas.graph).toBe(graph);
    expect(canvas.layout).toBe(layout);
    expect(requests).toEqual([reveal, selectRequest("revise")]);
  });

  it("keeps the latest follow focused while an accepted earlier viewport exposes the former target", async () => {
    const { canvas, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "publish" }] };
    canvas.layout = [
      { nodeId: "review", x: 30, y: 20 }, { nodeId: "publish", x: 960, y: 20 }, { nodeId: "revise", x: 1740, y: 20 },
    ];
    await settle(canvas);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    const initial = canvas.viewport;
    const former = followAction(/\b(?:follow|reveal)\b.*\bPublish\b/i);
    await keyboardActivate(former);
    const first = lastViewport(requests);
    expect(active()).toBe(former);
    expect(canvas.viewport).toBe(initial);

    canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
    await settle(canvas);
    const latest = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    await keyboardActivate(latest);
    const second = lastViewport(requests);
    expect(second.x).toBeLessThan(first.x);
    const expected = [first, second].map((view) => presentationRequest(viewport, { viewport: view }));
    expect(requests).toEqual(expected);
    canvas.viewport = first;
    await settle(canvas);
    expect(await axButtons()).toContain("Publish");
    expect(await axButtons()).not.toContain("Revise");
    expect(active()).toBe(latest);
    canvas.viewport = second;
    await settle(canvas);
    expect(focusId(canvas)).toBe("revise");
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual(expected);
  });

  it.each(["relationship", "layout"] as const)("ignores a stale follow and recovers focus when the host removes its %s", async (removed) => {
    const { canvas, pane, requests } = await mount(true);
    canvas.mode = "read-only";
    await settle(canvas);
    const follow = followAction(/\b(?:follow|reveal)\b.*\bRevise\b/i);
    await keyboardActivate(follow);
    const proposed = lastViewport(requests);
    const expected = [presentationRequest(viewport, { viewport: proposed })];
    expect(active()).toBe(follow);
    expect(requests).toEqual(expected);
    const scroll = [pane.scrollLeft, pane.scrollTop];
    const { picker } = revealControls(canvas);

    if (removed === "relationship") {
      canvas.graph = { ...canvas.graph, connections: canvas.graph.connections.filter(({ destinationId }) => destinationId !== "revise") };
    } else {
      canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId !== "revise");
    }
    expect(follow.isConnected).toBe(true);
    follow.click();
    expect(requests, "an outdated rendered Follow control cannot publish before Lit updates").toEqual(expected);
    canvas.viewport = proposed;
    await settle(canvas);
    expect(active()).toBe(picker);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual(expected);
  });

  it("names a valid relation whose unpositioned destination cannot be revealed until layout arrives", async () => {
    const { canvas, requests } = await mount(true);
    canvas.mode = "read-only";
    canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "publish" }] };
    canvas.layout = [{ nodeId: "review", x: 30, y: 20 }];
    await settle(canvas);
    expect(visibleRelationship(canvas, ["Initial review", "Approved", "Publish"]), "a valid destination stays named without a layout entry").toBeInstanceOf(HTMLElement);
    expect(mapOf(canvas).querySelectorAll("path.edge")).toHaveLength(0);
    const followName = /\b(?:follow|reveal)\b.*\bPublish\b/i;
    const actions = page.getByRole("button", { name: followName }).elements();
    expect(actions.filter((entry) => entry instanceof HTMLButtonElement && !entry.disabled)).toEqual([]);
    const unavailable = actions[0];
    if (unavailable instanceof HTMLButtonElement) unavailable.click();
    expect(requests).toEqual([]);

    canvas.mode = "author";
    await settle(canvas);
    expect(visibleRelationship(canvas, ["Initial review", "Approved", "Publish"]), "the persistent relation is also visible in author mode").toBeInstanceOf(HTMLElement);
    canvas.mode = "read-only";

    const suppliedGraph = canvas.graph;
    canvas.layout = [...canvas.layout, { nodeId: "publish", x: 1020, y: 20 }];
    await settle(canvas);
    expect(mapOf(canvas).querySelectorAll("path.edge")).toHaveLength(1);
    expect(requests).toEqual([]);
    const available = followAction(followName);
    await keyboardActivate(available);
    expect(requests).toEqual([presentationRequest(viewport, { viewport: lastViewport(requests) })]);
    expect(active()).toBe(available);
    expect(canvas.graph).toBe(suppliedGraph);
  });

  it("preserves each outcome row across reorder and names repeated and unique endpoints precisely", async () => {
    const { canvas, requests } = await mount(true);
    canvas.mode = "read-only";
    canvas.graph = {
      nodes: [
        { id: "review", label: "Decision", accountableRole: "Reviewer", kind: "Approval", outcomes: [
          { id: "approved", label: "Ready" }, { id: "rejected", label: "Ready" }, { id: "archived", label: "Store" },
        ] },
        { id: "backup", label: "Decision", accountableRole: "Supervisor", kind: "Escalation", outcomes: [{ id: "approved", label: "Ready" }] },
        { id: "publish", label: "Delivery", accountableRole: "Author", kind: "Publication", outcomes: [] },
        { id: "revise", label: "Delivery", accountableRole: "Editor", kind: "Planning", outcomes: [] },
        { id: "archive", label: "Archive", accountableRole: "Records", kind: "Storage", outcomes: [] },
      ],
      connections: [
        { sourceId: "review", outcomeId: "approved", destinationId: "publish" },
        { sourceId: "review", outcomeId: "rejected", destinationId: "revise" },
        { sourceId: "review", outcomeId: "archived", destinationId: "archive" },
        { sourceId: "backup", outcomeId: "approved", destinationId: "publish" },
      ],
    };
    canvas.layout = [...canvas.layout, { nodeId: "archive", x: 400, y: 140 }];
    await settle(canvas);
    const rows = [
      { source: "Decision (Reviewer, Approval, review)", outcome: "Ready (approved)", destination: "Delivery (Author, Publication, publish)" },
      { source: "Decision (Reviewer, Approval, review)", outcome: "Ready (rejected)", destination: "Delivery (Editor, Planning, revise)" },
      { source: "Decision (Reviewer, Approval, review)", outcome: "Store", destination: "Archive" },
      { source: "Decision (Supervisor, Escalation, backup)", outcome: "Ready", destination: "Delivery (Author, Publication, publish)" },
    ];
    const names = rows.map(({ source, outcome, destination }) => `Follow ${destination} from ${source} via ${outcome}`);
    const nativeNames = async () => (await axButtons()).filter((name) => name.startsWith("Follow "));
    expect(await nativeNames()).toEqual(names);
    const controls = names.map(followAction);
    expect(controls.map((button) => button.closest("li")?.textContent.replace(/\s+/g, " ").trim())).toEqual(
      rows.map(({ source, outcome, destination }) => `${source} · ${outcome} → ${destination} Follow`),
    );

    canvas.graph = { ...canvas.graph, connections: [...canvas.graph.connections].reverse() };
    await settle(canvas);
    expect(await nativeNames()).toEqual([...names].reverse());
    for (const [index, name] of names.entries()) expect(followAction(name)).toBe(controls[index]);

    canvas.graph = { ...canvas.graph, connections: [] };
    await settle(canvas);
    expect(page.getByRole("list", { name: "Outcome connections" }).elements()).toEqual([]);
    expect(requests).toEqual([]);
  });

  it("names an empty run and gives entry and removal a predictable visible focus destination", async () => {
    const { canvas, before, requests } = await mount(true);
    canvas.id = "workflow-canvas-empty-inspection";
    canvas.mode = "read-only";
    await settle(canvas);
    const stepDescription = async () => (await commands.axTree(canvas.id, "details"))
      .find(({ role, name }) => role === "combobox" && name === "Step")?.description;
    expect(await stepDescription()).toBe("");
    action(canvas, "review").focus({ preventScroll: true });
    canvas.graph = { nodes: [], connections: [] };
    canvas.layout = [];
    await settle(canvas);
    const names = (await commands.axTree("workflow-canvas-host", "subtree")).map(({ name }) => name);
    expect(names.some((name) => /\b(?:empty (?:workflow|run|canvas)|no (?:workflow )?(?:steps|nodes))\b/i.test(name)),
      "the empty graph presents a named state in Chromium's accessibility tree").toBe(true);
    expect(await stepDescription()).toBe("No workflow steps");
    const recovered = active();
    expect(recovered?.getRootNode()).toBe(canvas.shadowRoot);
    expect(recovered?.getBoundingClientRect().height).toBeGreaterThan(0);
    before.focus({ preventScroll: true });
    await commands.press("Tab");
    const entry = active();
    expect(entry?.getRootNode()).toBe(canvas.shadowRoot);
    expect(entry?.matches(":focus-visible")).toBe(true);
    before.focus({ preventScroll: true });
    await commands.press("Tab");
    expect(active()).toBe(entry);
    expect(mapOf(canvas).querySelectorAll("path.edge, rect.move-handle, rect.outcome-handle")).toHaveLength(0);
    expect(revealControls(canvas).button.disabled).toBe(true);
    await commands.press("Enter");
    expect(requests).toEqual([]);
  });
});

function connectionRequest(operation: "connect" | "reassign" | "disconnect", destinationId: string): Request {
  return presentationRequest(connection, { operation, sourceId: "review", outcomeId: "approved", destinationId });
}

async function editingFixture(destinationId?: string, onMap = true): Promise<Fixture> {
  const fixture = await mount(true);
  const { canvas } = fixture;
  const [review, publish, revise] = namedSteps;
  if (review === undefined || publish === undefined || revise === undefined) throw new Error("The editing fixture requires three named steps");
  canvas.graph = {
    nodes: [
      { ...review, label: "Decision", outcomes: [{ id: "approved", label: "Approved" }, { id: "alternate", label: "Approved" }] },
      { ...publish, label: "Destination", outcomes: [] },
      { ...revise, label: "Destination" },
      { ...review, id: "backup", label: "Decision" },
    ],
    connections: destinationId === undefined ? [] : [{ sourceId: "review", outcomeId: "approved", destinationId }],
  };
  canvas.layout = [
    { nodeId: "review", x: 25, y: 20 }, { nodeId: "publish", x: 310, y: 20 },
    { nodeId: "revise", x: onMap ? 520 : 1080, y: onMap ? 132 : 20 },
  ];
  await settle(canvas);
  return fixture;
}

function choice(canvas: OcelleWorkflowCanvas, field: "source" | "outcome" | "destination", id: string): HTMLButtonElement {
  const button = canvas.shadowRoot?.querySelector(`button[data-${field}-id="${id}"]`);
  expect(button, `the named ${field} ${id} is a native edit choice`).toBeInstanceOf(HTMLButtonElement);
  if (!(button instanceof HTMLButtonElement)) throw new Error("Named edit choice missing");
  return button;
}

function choiceIds(canvas: OcelleWorkflowCanvas, field: "source" | "outcome" | "destination"): (string | null)[] {
  const attribute = `data-${field}-id`;
  return [...canvas.shadowRoot?.querySelectorAll(`button[${attribute}]`) ?? []].map((button) => button.getAttribute(attribute));
}

async function keyboardActivate(button: HTMLButtonElement): Promise<void> {
  button.focus({ preventScroll: true });
  await commands.press("Enter");
}

async function startNamedEdit(fixture: Fixture, activate = keyboardActivate): Promise<HTMLButtonElement> {
  const { canvas } = fixture;
  await openCommands(canvas);
  await activate(commandButton(canvas, "Edit connection"));
  await settle(canvas);
  const source = choice(canvas, "source", "review");
  await activate(source);
  await settle(canvas);
  await activate(choice(canvas, "outcome", "approved"));
  await settle(canvas);
  return source;
}

async function chooseDestination(fixture: Fixture, id: string, activate = keyboardActivate): Promise<void> {
  await activate(choice(fixture.canvas, "destination", id));
  await settle(fixture.canvas);
}

function acceptConnection(request: Request, canvas: OcelleWorkflowCanvas): void {
  const { operation, sourceId, outcomeId, destinationId } = request.detail as { operation: string; sourceId: string; outcomeId: string; destinationId: string };
  const other = canvas.graph.connections.filter((edge) => edge.sourceId !== sourceId || edge.outcomeId !== outcomeId);
  canvas.graph = { ...canvas.graph, connections: operation === "disconnect" ? other : [...other, { sourceId, outcomeId, destinationId }] };
}

function displayedConnection(canvas: OcelleWorkflowCanvas, id?: string): void {
  const edges = [...mapOf(canvas).querySelectorAll<SVGPathElement>("path.edge")];
  expect(edges).toHaveLength(id === undefined ? 0 : 1);
  const edge = edges[0];
  if (id !== undefined && edge !== undefined) checkConnectionEndpoint(edge, displayedOrigin(canvas, id)[0]);
}

function checkConnectionEndpoint(edge: SVGPathElement, x: number): void {
  expect(edge.getPointAtLength(edge.getTotalLength()).x).toBeCloseTo(x);
}

function connectionHandles(canvas: OcelleWorkflowCanvas, outcomeId = "approved"): SVGRectElement {
  const handle = mapOf(canvas).querySelector(`rect.outcome-handle[data-node-id="review"][data-outcome-id="${outcomeId}"]`);
  expect(handle, "the named outcome has a pointer-only handle").toBeInstanceOf(SVGRectElement);
  if (!(handle instanceof SVGRectElement)) throw new Error("Outcome handle missing");
  return handle;
}

async function beginConnectionDrag(fixture: Fixture, id: string, outcomeId = "approved") {
  const { canvas } = fixture;
  const handle = connectionHandles(canvas, outcomeId);
  const down = elementCenter(handle);
  const end = elementCenter(action(canvas, id));
  const map = mapOf(canvas);
  let pointerId = -1;
  handle.addEventListener("pointerdown", (event) => { pointerId = event.pointerId; }, { once: true });
  action(canvas, "review").focus({ preventScroll: true });
  await commands.pointerPath([{ ...down, down: true }, end]);
  await settle(canvas);
  expect(map.hasPointerCapture(pointerId)).toBe(true);
  const preview = map.querySelector("path.connection-preview");
  const screenTransform = map.getScreenCTM();
  expect(preview).toBeInstanceOf(SVGPathElement);
  if (!(preview instanceof SVGPathElement) || screenTransform === null) throw new Error("Connection preview is not displayed");
  const start = preview.getPointAtLength(0).matrixTransform(screenTransform);
  const destination = preview.getPointAtLength(preview.getTotalLength()).matrixTransform(screenTransform);
  expect(Math.hypot(start.x - down.x, start.y - down.y)).toBeLessThan(1);
  expect(Math.hypot(destination.x - end.x, destination.y - end.y)).toBeLessThan(2);
  expect(fixture.requests).toEqual([]);
  return { end, map, pointerId };
}

function assertNames(fixture: Fixture): void {
  const { canvas } = fixture;
  const names = [...canvas.shadowRoot?.querySelectorAll<HTMLButtonElement>("button[data-destination-id]") ?? []]
    .filter(({ dataset }) => dataset.destinationId === "publish" || dataset.destinationId === "revise")
    .map((button) => button.textContent.trim().replace(/\s+/g, " "));
  expect(names).toEqual(["Destination (Author, Publication, publish)", "Destination (Author, Planning, revise)"]);
}

describe("workflow canvas named outcome editing in process", () => {
  it("uses native keyboard controls for connect, rejected reassign, accepted reassign and disconnect for stable off-map names", async () => {
    const fixture = await editingFixture(undefined, false);
    const { canvas, pane, requests } = fixture;
    const original = { graph: canvas.graph, layout: canvas.layout, viewport: canvas.viewport, selection: canvas.selectedNodeId };
    const scroll = [pane.scrollLeft, pane.scrollTop];
    const originalAction = action(canvas, "review");

    await openCommands(canvas);
    const collapsed = canvas.shadowRoot?.querySelector("button.connection-trigger")?.getAttribute("aria-expanded");
    await keyboardActivate(commandButton(canvas, "Edit connection"));
    const trigger = commandButton(canvas, "Edit connection");
    expect(collapsed).toBe("false");
    await settle(canvas);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    const source = choice(canvas, "source", "review");
    expect(source.getAttribute("aria-pressed")).toBe("false");
    expect(choice(canvas, "source", "backup").textContent).toContain("backup");
    const sourceNames = await axButtons();
    const availableSources = choiceIds(canvas, "source");
    const pendingOutcomes = canvas.shadowRoot?.querySelector('[aria-label="Named outcome"]');
    await commands.press("Tab");
    expect(active()).toBe(source);
    await commands.press("Enter");
    await settle(canvas);
    expect(source.getAttribute("aria-pressed")).toBe("true");
    const approved = choice(canvas, "outcome", "approved");
    expect(approved.textContent).toContain("approved");
    expect(approved.getAttribute("aria-pressed")).toBe("false");
    expect(choice(canvas, "outcome", "alternate").textContent).toContain("alternate");
    const availableOutcomes = choiceIds(canvas, "outcome");
    await keyboardActivate(approved);
    await settle(canvas);
    expect(approved.getAttribute("aria-pressed")).toBe("true");
    assertNames(fixture);
    expect(await axButtons()).toEqual(expect.arrayContaining([
      "Decision (Reviewer, Approval, review)", "Approved (approved)",
      "Destination (Author, Publication, publish)", "Destination (Author, Planning, revise)",
    ]));
    expect(sourceNames).toContain("Decision (Reviewer, Approval, backup)");
    expect(pendingOutcomes).toBeNull();
    expect(availableSources).toEqual(["review", "backup"]);
    expect(availableOutcomes).toEqual(["approved", "alternate"]);
    expect(choiceIds(canvas, "source")).toEqual(["review"]);
    expect(choiceIds(canvas, "outcome")).toEqual(["approved"]);
    expect(choiceIds(canvas, "destination")).toEqual(["review", "publish", "revise", "backup"]);
    expect(getNode(canvas, "revise")?.parentElement?.inert).toBe(true);
    expect(canvas.shadowRoot?.querySelector(".connection-current")?.textContent).toBe("No connection");
    expect(await axButtons()).not.toContain("Disconnect connection");
    expect(commandButton(canvas, "Apply connection").disabled).toBe(true);
    const destination = choice(canvas, "destination", "publish");
    expect(destination.getAttribute("aria-pressed")).toBe("false");
    await chooseDestination(fixture, "publish");
    expect(destination.getAttribute("aria-pressed")).toBe("true");
    expect(choiceIds(canvas, "destination")).toEqual(["publish"]);
    await chooseDestination(fixture, "publish");
    expect(destination.getAttribute("aria-pressed")).toBe("false");
    expect(choiceIds(canvas, "destination")).toEqual(["review", "publish", "revise", "backup"]);
    expect(commandButton(canvas, "Apply connection").disabled).toBe(true);
    await chooseDestination(fixture, "publish");
    expect(requests).toEqual([]);
    const connected = connectionRequest("connect", "publish");
    canvas.addEventListener(connection, () => { acceptConnection(connected, canvas); }, { once: true });
    await keyboardActivate(commandButton(canvas, "Apply connection"));
    await settle(canvas);
    expect(requests).toEqual([connected]);
    expect(active()).toBe(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    displayedConnection(canvas, "publish");

    const assigned = connectionRequest("reassign", "revise");
    for (const accept of [false, true]) {
      await keyboardActivate(commandButton(canvas, "Edit connection"));
      await settle(canvas);
      await keyboardActivate(choice(canvas, "source", "review"));
      await settle(canvas);
      await keyboardActivate(choice(canvas, "outcome", "approved"));
      await settle(canvas);
      expect(canvas.shadowRoot?.querySelector(".connection-current")?.textContent).toBe("Connected to Destination (Author, Publication, publish)");
      await chooseDestination(fixture, "revise");
      if (accept) canvas.addEventListener(connection, () => { acceptConnection(assigned, canvas); }, { once: true });
      await keyboardActivate(commandButton(canvas, "Apply connection"));
      await settle(canvas);
      expect(requests).toEqual(accept ? [connected, assigned, assigned] : [connected, assigned]);
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(choiceIds(canvas, "destination")).toEqual([]);
      displayedConnection(canvas, accept ? "revise" : "publish");
    }
    await keyboardActivate(commandButton(canvas, "Edit connection"));
    await settle(canvas);
    await keyboardActivate(choice(canvas, "source", "review"));
    await settle(canvas);
    await keyboardActivate(choice(canvas, "outcome", "approved"));
    await settle(canvas);
    await chooseDestination(fixture, "revise");
    expect(commandButton(canvas, "Apply connection").disabled).toBe(true);
    await keyboardActivate(commandButton(canvas, "Apply connection"));
    expect(requests).toEqual([connected, assigned, assigned]);
    const disconnected = connectionRequest("disconnect", "revise");
    canvas.addEventListener(connection, () => { acceptConnection(disconnected, canvas); }, { once: true });
    await keyboardActivate(commandButton(canvas, "Disconnect connection"));
    await settle(canvas);
    expect(requests).toEqual([connected, assigned, assigned, disconnected]);
    displayedConnection(canvas);
    expect(original.graph.connections).toEqual([]);
    expect(canvas.layout).toBe(original.layout);
    expect(canvas.viewport).toBe(original.viewport);
    expect(canvas.selectedNodeId).toBe(original.selection);
    expect(action(canvas, "review")).toBe(originalAction);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it("keeps named source, outcome and destination choices usable without positioned steps", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    canvas.layout = [];
    await settle(canvas);
    const source = await startNamedEdit(fixture);
    const approved = choice(canvas, "outcome", "approved");
    await keyboardActivate(approved);
    await settle(canvas);
    expect(approved.getAttribute("aria-pressed")).toBe("false");
    expect(canvas.shadowRoot?.querySelector("button[data-destination-id]")).toBeNull();
    await keyboardActivate(source);
    await settle(canvas);
    expect(source.getAttribute("aria-pressed")).toBe("false");
    expect(canvas.shadowRoot?.querySelector("button[data-outcome-id]")).toBeNull();
    const backup = choice(canvas, "source", "backup");
    await keyboardActivate(backup);
    await settle(canvas);
    expect(await axButtons()).toEqual(expect.arrayContaining(["Approved", "Rejected"]));
    await keyboardActivate(backup);
    await settle(canvas);
    await keyboardActivate(choice(canvas, "source", "review"));
    await settle(canvas);
    await keyboardActivate(choice(canvas, "outcome", "approved"));
    await settle(canvas);
    await chooseDestination(fixture, "revise");
    await keyboardActivate(commandButton(canvas, "Apply connection"));
    await settle(canvas);
    expect(requests).toEqual([connectionRequest("connect", "revise")]);
    displayedConnection(canvas);
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => ({ ...node, outcomes: [] })) };
    await settle(canvas);
    expect(canvas.shadowRoot?.querySelector("summary")).toBeNull();
  });

  it("keeps viewport controls available when the host cannot edit outcomes", async () => {
    const { canvas, requests } = await editingFixture("publish");
    await openCommands(canvas);
    expect(commandButton(canvas, "Edit connection")).toBeInstanceOf(HTMLButtonElement);
    canvas.mode = "read-only";
    await settle(canvas);
    expect(canvas.shadowRoot?.querySelector("button.connection-trigger")).toBeNull();
    expect(mapOf(canvas).querySelectorAll("rect.outcome-handle")).toHaveLength(0);
    expect(commandButton(canvas, "Pan left")).toBeInstanceOf(HTMLButtonElement);

    canvas.mode = "author";
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => ({ ...node, outcomes: [] })) };
    await settle(canvas);
    expect(canvas.shadowRoot?.querySelector("button.connection-trigger")).toBeNull();
    expect(commandButton(canvas, "Pan left")).toBeInstanceOf(HTMLButtonElement);
    expect(requests).toEqual([]);
  });

  it.each(["current destination", "new relation", "removed outcome", "removed target", "removed current destination", "removed source", "no visible survivor", "Escape", "clipped initiator", "read-only at dispatch"] as const)(
    "cancels a pending named edit with zero requests after %s",
    async (reason) => {
      const fixture = await editingFixture(reason === "new relation" ? undefined : "publish", reason !== "no visible survivor");
      const { canvas, pane, requests } = fixture;
      if (reason === "no visible survivor") {
        canvas.layout = canvas.layout.filter(({ nodeId }) => nodeId === "review");
        await settle(canvas);
      }
      const scroll = [pane.scrollLeft, pane.scrollTop];
      const source = await startNamedEdit(fixture);
      await chooseDestination(fixture, "revise");
      const apply = commandButton(canvas, "Apply connection");
      apply.focus({ preventScroll: true });
      let expectedFocus: Element | null = source;
      switch (reason) {
        case "current destination":
        case "new relation":
          canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
          break;
        case "removed outcome":
          canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => node.id === "review"
            ? { ...node, outcomes: node.outcomes.filter(({ id }) => id !== "approved") } : node) };
          break;
        case "removed target":
          canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "revise") };
          break;
        case "removed current destination":
          canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "publish") };
          break;
        case "removed source":
        case "no visible survivor":
          expectedFocus = reason === "removed source" ? action(canvas, "publish") : revealControls(canvas).picker;
          canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "review") };
          break;
        case "Escape":
          await commands.press("Escape");
          break;
        case "clipped initiator": {
          const root = canvas.shadowRoot;
          if (root === null) throw new Error("Workflow canvas shadow root missing");
          const sheet = new CSSStyleSheet();
          sheet.replaceSync('button[data-source-id="review"] { transform: translateX(900px); }');
          root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
          expectedFocus = action(canvas, "review");
          await commands.press("Escape");
          break;
        }
        case "read-only at dispatch":
          expectedFocus = action(canvas, "review");
          pane.addEventListener("click", () => { canvas.mode = "read-only"; }, { capture: true, once: true });
          await commands.press("Enter");
          break;
      }
      await settle(canvas);
      expect(requests).toEqual([]);
      expect(active()).toBe(expectedFocus);
      expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    },
  );

  it("retains the named edit across display-only renames and honors same-task relation changes at disconnect", async () => {
    const fixture = await editingFixture("publish");
    const { canvas, pane, requests } = fixture;
    const source = await startNamedEdit(fixture);
    await chooseDestination(fixture, "revise");
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => ({
      ...node, label: `New ${node.label}`, outcomes: node.outcomes.map((outcome) => ({ ...outcome, label: `New ${outcome.label}` })),
    })) };
    await settle(canvas);
    expect(choice(canvas, "source", "review")).toBe(source);
    expect(choice(canvas, "destination", "revise").textContent).toContain("New Destination");
    pane.addEventListener("click", () => {
      canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
    }, { capture: true, once: true });
    await keyboardActivate(commandButton(canvas, "Disconnect connection"));
    await settle(canvas);
    expect(requests).toEqual([]);
    displayedConnection(canvas, "revise");
    expect(active()).toBe(source);
  });

  it("consumes an attempted named edit whose supplied relation was stale during activation", async () => {
    const fixture = await editingFixture("publish");
    const { canvas, pane, requests } = fixture;
    const scroll = [pane.scrollLeft, pane.scrollTop];
    const source = await startNamedEdit(fixture);
    await chooseDestination(fixture, "revise");
    const apply = commandButton(canvas, "Apply connection");
    apply.focus({ preventScroll: true });
    const supplied = canvas.graph;
    canvas.graph = { ...supplied, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
    apply.click();
    canvas.graph = supplied;
    await settle(canvas);
    expect(requests).toEqual([]);
    expect(canvas.shadowRoot?.querySelector("button[data-destination-id]")).toBeNull();
    expect(active()).toBe(source);
    expect(canvas.graph).toBe(supplied);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
  });

  it("retains a draft while Canvas controls stay open and discards it on a completed native close", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    await startNamedEdit(fixture);
    await chooseDestination(fixture, "revise");
    const details = canvas.shadowRoot?.querySelector("details.commands");
    const summary = details?.querySelector("summary");
    if (!(details instanceof HTMLDetailsElement) || !(summary instanceof HTMLElement)) throw new Error("Canvas controls disclosure missing");
    const toggles: boolean[] = [];
    details.addEventListener("toggle", () => { toggles.push(details.open); });
    summary.click();
    summary.click();
    await settle(canvas);
    expect(toggles).toEqual([true]);
    expect(choice(canvas, "destination", "revise").getAttribute("aria-pressed")).toBe("true");
    expect(commandButton(canvas, "Apply connection").disabled).toBe(false);

    summary.click();
    await settle(canvas);
    expect(toggles).toEqual([true, false]);
    await openCommands(canvas);
    const trigger = commandButton(canvas, "Edit connection");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await keyboardActivate(trigger);
    await settle(canvas);
    expect(choice(canvas, "source", "review").getAttribute("aria-pressed")).toBe("false");
    expect(canvas.shadowRoot?.querySelector("button[data-destination-id]")).toBeNull();
    expect(requests).toEqual([]);
  });

  it("ignores an edit trigger that still has its authoring label during a same-task mode change", async () => {
    const { canvas, requests } = await editingFixture();
    await openCommands(canvas);
    const trigger = commandButton(canvas, "Edit connection");
    canvas.mode = "read-only";
    trigger.click();
    canvas.mode = "author";
    await settle(canvas);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(choiceIds(canvas, "source")).toEqual([]);
    expect(requests).toEqual([]);
  });

  it.each(["synchronous acceptance", "external activation focus", "focus taken before stale recovery", "step picker focus before invalidation"] as const)(
    "preserves the host's visible focus during %s",
    async (reason) => {
      const fixture = await editingFixture("publish");
      const { canvas, after, pane, requests } = fixture;
      const scroll = [pane.scrollLeft, pane.scrollTop];
      await startNamedEdit(fixture);
      await chooseDestination(fixture, "revise");
      const apply = commandButton(canvas, "Apply connection");
      const accepted = connectionRequest("reassign", "revise");
      const accepting = reason === "synchronous acceptance" || reason === "external activation focus";
      const hostFocus = reason === "step picker focus before invalidation" ? revealControls(canvas).picker : after;

      if (reason === "focus taken before stale recovery") {
        apply.focus({ preventScroll: true });
        const supplied = canvas.graph;
        canvas.graph = { ...supplied, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
        apply.click();
        canvas.graph = supplied;
        after.focus({ preventScroll: true });
      } else if (reason === "step picker focus before invalidation") {
        hostFocus.focus({ preventScroll: true });
        canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
      } else {
        canvas.addEventListener(connection, () => {
          acceptConnection(accepted, canvas);
          if (reason === "synchronous acceptance") after.focus({ preventScroll: true });
        }, { once: true });
        if (reason === "synchronous acceptance") await keyboardActivate(apply);
        else {
          after.focus({ preventScroll: true });
          apply.click();
        }
      }

      await settle(canvas);
      expect(active()).toBe(hostFocus);
      expect(requests).toEqual(accepting ? [accepted] : []);
      expect(choiceIds(canvas, "destination")).toEqual([]);
      expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    },
  );

  it("rejects a stale destination that was removed before its displayed choice is activated", async () => {
    const fixture = await editingFixture("publish");
    const { canvas, requests } = fixture;
    await startNamedEdit(fixture);
    const destination = choice(canvas, "destination", "revise");
    const supplied = canvas.graph;
    canvas.graph = { ...supplied, nodes: supplied.nodes.filter(({ id }) => id !== "revise") };
    destination.click();
    canvas.graph = supplied;
    await settle(canvas);
    expect(destination.getAttribute("aria-pressed")).toBe("false");
    expect(choiceIds(canvas, "destination")).toEqual(["review", "publish", "revise", "backup"]);
    expect(commandButton(canvas, "Apply connection").disabled).toBe(true);
    expect(requests).toEqual([]);
  });

  it("recovers the initiating source when a focused persistent editor control survives cancellation", async () => {
    const fixture = await editingFixture("publish");
    const { canvas, pane, requests } = fixture;
    const source = await startNamedEdit(fixture);
    await chooseDestination(fixture, "revise");
    const trigger = commandButton(canvas, "Edit connection");
    const scroll = [pane.scrollLeft, pane.scrollTop];
    trigger.focus({ preventScroll: true });
    canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
    await settle(canvas);
    expect(trigger.isConnected).toBe(true);
    expect(active()).toBe(source);
    expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    expect(requests).toEqual([]);
  });

  it("rejects stale source and outcome choices and resets the draft when its source is cleared", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    await openCommands(canvas);
    const trigger = commandButton(canvas, "Edit connection");
    await keyboardActivate(trigger);
    await settle(canvas);
    const supplied = canvas.graph;
    const backup = choice(canvas, "source", "backup");
    canvas.graph = { ...supplied, nodes: supplied.nodes.map((node) => node.id === "backup" ? { ...node, outcomes: [] } : node) };
    backup.click();
    canvas.graph = supplied;
    await settle(canvas);
    expect(backup.getAttribute("aria-pressed")).toBe("false");
    expect(choiceIds(canvas, "outcome")).toEqual([]);

    const review = choice(canvas, "source", "review");
    await keyboardActivate(review);
    await settle(canvas);
    const approved = choice(canvas, "outcome", "approved");
    canvas.graph = { ...supplied, nodes: supplied.nodes.map((node) => node.id === "review"
      ? { ...node, outcomes: node.outcomes.filter(({ id }) => id !== "approved") } : node) };
    approved.click();
    canvas.graph = supplied;
    await settle(canvas);
    expect(approved.getAttribute("aria-pressed")).toBe("false");
    expect(choiceIds(canvas, "destination")).toEqual([]);

    await keyboardActivate(approved);
    await settle(canvas);
    await chooseDestination(fixture, "publish");
    await keyboardActivate(review);
    await settle(canvas);
    expect(choiceIds(canvas, "source")).toEqual(["review", "backup"]);
    expect(choiceIds(canvas, "destination")).toEqual([]);
    await commands.press("Escape");
    await settle(canvas);
    expect(active()).toBe(trigger);
    expect(requests).toEqual([]);
  });

  it("keeps named outcome choices keyed across reorder and cancels when the selected source loses its outcomes", async () => {
    const { canvas, requests } = await editingFixture();
    await openCommands(canvas);
    await keyboardActivate(commandButton(canvas, "Edit connection"));
    await settle(canvas);
    await keyboardActivate(choice(canvas, "source", "review"));
    await settle(canvas);
    const approved = choice(canvas, "outcome", "approved");
    const alternate = choice(canvas, "outcome", "alternate");
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => node.id === "review"
      ? { ...node, outcomes: [...node.outcomes].reverse() } : node) };
    await settle(canvas);
    expect(choiceIds(canvas, "outcome")).toEqual(["alternate", "approved"]);
    expect(choice(canvas, "outcome", "approved")).toBe(approved);
    expect(choice(canvas, "outcome", "alternate")).toBe(alternate);

    approved.focus({ preventScroll: true });
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => node.id === "review" ? { ...node, outcomes: [] } : node) };
    await settle(canvas);
    expect(choiceIds(canvas, "source")).toEqual(["backup"]);
    expect(canvas.shadowRoot?.querySelector('[aria-label="Named outcome"]')).toBeNull();
    expect(active()).toBe(action(canvas, "review"));
    expect(requests).toEqual([]);
  });

  it("resolves the supplied relation using both source and outcome identity", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const other = [
      { sourceId: "backup", outcomeId: "approved", destinationId: "revise" },
      { sourceId: "review", outcomeId: "alternate", destinationId: "backup" },
    ];
    canvas.graph = {
      nodes: canvas.graph.nodes.map((node) => node.id === "publish" ? { ...node, label: "Publish" } : node),
      connections: [...other, { sourceId: "review", outcomeId: "approved", destinationId: "publish" }],
    };
    await settle(canvas);
    await startNamedEdit(fixture);
    expect(canvas.shadowRoot?.querySelector(".connection-current")?.textContent).toBe("Connected to Publish");
    const removed = connectionRequest("disconnect", "publish");
    canvas.addEventListener(connection, () => { acceptConnection(removed, canvas); }, { once: true });
    await keyboardActivate(commandButton(canvas, "Disconnect connection"));
    await settle(canvas);
    expect(requests).toEqual([removed]);
    expect(canvas.graph.connections).toEqual(other);

    await keyboardActivate(commandButton(canvas, "Edit connection"));
    await settle(canvas);
    await keyboardActivate(choice(canvas, "source", "backup"));
    await settle(canvas);
    await keyboardActivate(choice(canvas, "outcome", "rejected"));
    await settle(canvas);
    await chooseDestination(fixture, "review");
    await keyboardActivate(commandButton(canvas, "Apply connection"));
    await settle(canvas);
    expect(requests).toEqual([removed, presentationRequest(connection, { operation: "connect", sourceId: "backup", outcomeId: "rejected", destinationId: "review" })]);
    expect(canvas.graph.connections).toEqual(other);
  });

  it("leaves Escape outside the editor alone and cancels only a capture when focus is back on the map", async () => {
    const fixture = await editingFixture();
    const { canvas, after, requests } = fixture;
    await startNamedEdit(fixture);
    await chooseDestination(fixture, "revise");
    after.focus({ preventScroll: true });
    const escapes: boolean[] = [];
    document.addEventListener("keydown", (event) => { escapes.push(event.defaultPrevented); }, { once: true });
    await commands.press("Escape");
    await settle(canvas);
    expect(active()).toBe(after);
    expect(escapes).toEqual([false]);
    expect(choiceIds(canvas, "destination")).toEqual(["revise"]);

    const captured = await beginConnectionDrag(fixture, "publish");
    await commands.press("Escape");
    await settle(canvas);
    expect(captured.map.hasPointerCapture(captured.pointerId)).toBe(false);
    expect(captured.map.querySelector("path.connection-preview")).toBeNull();
    expect(choiceIds(canvas, "destination")).toEqual(["revise"]);
    await commands.pointerPath([{ ...captured.end, up: true }]);
    expect(requests).toEqual([]);
  });

  it("discards a native draft and captured outcome when the host detaches and reuses the canvas", async () => {
    const fixture = await editingFixture();
    const { canvas, frame, requests } = fixture;
    await startNamedEdit(fixture);
    await chooseDestination(fixture, "revise");
    const { map, pointerId, end } = await beginConnectionDrag(fixture, "review");
    canvas.remove();
    const detachedCapture = map.hasPointerCapture(pointerId);
    frame.append(canvas);
    map.dispatchEvent(new PointerEvent("pointerup", { pointerId, clientX: end.x, clientY: end.y }));
    await settle(canvas);
    expect(detachedCapture).toBe(false);
    expect(map.querySelector("path.connection-preview")).toBeNull();
    expect(commandButton(canvas, "Edit connection").getAttribute("aria-expanded")).toBe("false");
    expect(choiceIds(canvas, "destination")).toEqual([]);
    await commands.pointerPath([{ ...end, up: true }]);
    expect(requests).toEqual([]);
  });

  it.each(["current relation", "new relation", "source removed", "target removed", "outcome removed", "Escape", "read-only at release", "empty drop", "layout change", "viewport change", "map frame change", "lost capture"] as const)(
    "clears a captured outcome preview with no request after %s",
    async (reason) => {
      const fixture = await editingFixture(reason === "new relation" ? undefined : "publish");
      const { canvas, pane, requests, sheet } = fixture;
      const scroll = [pane.scrollLeft, pane.scrollTop];
      const captured = await beginConnectionDrag(fixture, "revise");
      const source = action(canvas, "review");
      const expectedFocus = reason === "source removed" ? action(canvas, "publish") : source;
      const unrelatedLoss: boolean[] = [];
      const captureAfterRender: boolean[] = [];
      let released = false;
      switch (reason) {
        case "current relation":
        case "new relation":
          canvas.graph = { ...canvas.graph, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
          break;
        case "source removed":
        case "target removed":
          canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== (reason === "source removed" ? "review" : "revise")) };
          break;
        case "outcome removed":
          canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => node.id === "review" ? { ...node, outcomes: [] } : node) };
          break;
        case "Escape":
          await commands.press("Escape");
          break;
        case "read-only at release":
          pane.addEventListener("pointerup", () => { canvas.mode = "read-only"; }, { capture: true, once: true });
          await commands.pointerPath([{ ...captured.end, up: true }]);
          released = true;
          break;
        case "empty drop": {
          const rect = captured.map.getBoundingClientRect();
          await commands.pointerPath([{ x: rect.left + 8, y: rect.bottom - 8, up: true }]);
          released = true;
          break;
        }
        case "layout change":
          canvas.layout = canvas.layout.map((entry) => entry.nodeId === "publish" ? { ...entry, y: entry.y + 3 } : entry);
          await canvas.updateComplete;
          captureAfterRender.push(captured.map.hasPointerCapture(captured.pointerId));
          break;
        case "viewport change":
          canvas.viewport = { ...canvas.viewport, x: canvas.viewport.x + 5 };
          await canvas.updateComplete;
          captureAfterRender.push(captured.map.hasPointerCapture(captured.pointerId));
          break;
        case "map frame change":
          sheet.insertRule("#canvas-frame { transform: translateX(8px); }", sheet.cssRules.length);
          break;
        case "lost capture":
          captured.map.dispatchEvent(new PointerEvent("lostpointercapture", { pointerId: captured.pointerId + 1 }));
          unrelatedLoss.push(captured.map.hasPointerCapture(captured.pointerId));
          captured.map.releasePointerCapture(captured.pointerId);
          await commands.pointerPath([{ ...captured.end, x: captured.end.x + 1 }]);
          break;
      }
      await settle(canvas);
      expect(unrelatedLoss).toEqual(reason === "lost capture" ? [true] : []);
      expect(captureAfterRender).toEqual(reason === "layout change" || reason === "viewport change" ? [false] : []);
      expect(captured.map.hasPointerCapture(captured.pointerId)).toBe(false);
      expect(captured.map.querySelector("path.connection-preview")).toBeNull();
      if (!released) await commands.pointerPath([{ ...captured.end, up: true }]);
      expect(requests).toEqual([]);
      expect(active()).toBe(expectedFocus);
      expect([pane.scrollLeft, pane.scrollTop]).toEqual(scroll);
    },
  );

  it("retains a real drag on renamed IDs and suppresses a repeated drop on that supplied destination", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const captured = await beginConnectionDrag(fixture, "publish");
    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.map((node) => ({ ...node, label: `Renamed ${node.label}` })) };
    await settle(canvas);
    expect(captured.map.hasPointerCapture(captured.pointerId)).toBe(true);
    const connected = connectionRequest("connect", "publish");
    const capturedAtDispatch: boolean[] = [];
    const nativeOrder: string[] = [];
    captured.map.addEventListener("lostpointercapture", () => { nativeOrder.push("lost capture"); }, { once: true });
    canvas.addEventListener(connection, () => {
      nativeOrder.push("connection request");
      capturedAtDispatch.push(captured.map.hasPointerCapture(captured.pointerId));
      acceptConnection(connected, canvas);
    }, { once: true });
    await commands.pointerPath([{ ...captured.end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([connected]);
    expect(capturedAtDispatch).toEqual([false]);
    expect(nativeOrder).toEqual(["connection request", "lost capture"]);
    displayedConnection(canvas, "publish");
    expect(captured.map.querySelector("path.connection-preview")).toBeNull();
    const handle = connectionHandles(canvas);
    const target = elementCenter(action(canvas, "publish"));
    await commands.pointerPath([{ ...elementCenter(handle), down: true }, { ...target, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([connected]);
    expect(captured.map.querySelector("path.connection-preview")).toBeNull();
  });

  it("drags the second of two identically labelled outcomes through its own visible pointer target", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const approved = connectionHandles(canvas);
    const alternate = connectionHandles(canvas, "alternate");
    const first = approved.getBoundingClientRect();
    const second = alternate.getBoundingClientRect();
    expect(first.right).toBeLessThan(second.left);
    expect(alternate.querySelector("title")?.textContent).toBe("Connect Approved (alternate)");
    const { end } = await beginConnectionDrag(fixture, "publish", "alternate");
    await commands.pointerPath([{ ...end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([presentationRequest(connection, { operation: "connect", sourceId: "review", outcomeId: "alternate", destinationId: "publish" })]);
    displayedConnection(canvas);
  });

  it("retains the stable captured outcome handle when the host reorders repeated outcome labels", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const original = connectionHandles(canvas);
    const captured = await beginConnectionDrag(fixture, "publish");
    canvas.graph = {
      ...canvas.graph,
      nodes: canvas.graph.nodes.map((node) => node.id === "review" ? { ...node, outcomes: [...node.outcomes].reverse() } : node),
    };
    await settle(canvas);
    expect(connectionHandles(canvas)).toBe(original);
    expect(captured.map.hasPointerCapture(captured.pointerId)).toBe(true);
    await commands.pointerPath([{ ...captured.end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([connectionRequest("connect", "publish")]);
  });

  it("shows the captured outcome preview before the pointer moves and publishes nothing on the handle", async () => {
    const { canvas, requests } = await editingFixture();
    const handle = connectionHandles(canvas);
    const map = mapOf(canvas);
    const start = elementCenter(handle);
    await commands.pointerPath([{ ...start, down: true }]);
    await settle(canvas);
    const preview = map.querySelector("path.connection-preview");
    expect(preview).toBeInstanceOf(SVGPathElement);
    if (!(preview instanceof SVGPathElement)) throw new Error("Stationary outcome preview missing");
    expect(preview.getTotalLength()).toBeLessThan(2);
    await commands.pointerPath([{ ...start, up: true }]);
    await settle(canvas);
    expect(map.querySelector("path.connection-preview")).toBeNull();
    expect(requests).toEqual([]);
  });

  it("keeps an existing outcome capture as the sole gesture when another press is delivered to the map", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const suppliedView = canvas.viewport;
    const { map, pointerId, end } = await beginConnectionDrag(fixture, "publish");
    const mapBounds = map.getBoundingClientRect();
    map.dispatchEvent(new PointerEvent("pointerdown", {
      pointerId, isPrimary: true, button: 0, clientX: mapBounds.left + 10, clientY: mapBounds.bottom - 10,
    }));
    const release = { pointerId, clientX: end.x, clientY: end.y };
    map.dispatchEvent(new PointerEvent("pointerup", release));
    map.dispatchEvent(new PointerEvent("pointerup", release));
    await commands.pointerPath([{ ...end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([connectionRequest("connect", "publish")]);
    expect(canvas.viewport).toBe(suppliedView);
    expect(map.querySelector("path.connection-preview")).toBeNull();
  });

  it("rows fixed-size outcome hit targets and centers the arrow within each target", async () => {
    const { canvas, requests } = await editingFixture();
    canvas.graph = {
      ...canvas.graph,
      nodes: canvas.graph.nodes.map((node) => node.id === "review" ? {
        ...node, outcomes: [...node.outcomes, { id: "third", label: "Third" }, { id: "fourth", label: "Fourth" }],
      } : node),
    };
    await settle(canvas);
    const card = getNode(canvas, "review")?.closest("foreignObject");
    if (!(card instanceof SVGForeignObjectElement)) throw new Error("Review step is missing its visible card");
    const first = connectionHandles(canvas).getBBox();
    const gap = first.width / 8;
    const row = card.y.baseVal.value + card.height.baseVal.value + gap;
    const column = card.x.baseVal.value;
    const pitch = first.width + gap;
    const targetIds = ["approved", "alternate", "third", "fourth"] as const;
    const expectedPositions = [[column, row], [column + pitch, row], [column + 2 * pitch, row], [column, row + pitch]];
    const expectedArrow: readonly (readonly [number, number])[] = [[1 / 4, 1 / 2], [3 / 4, 1 / 2], [7 / 12, 1 / 3], [3 / 4, 1 / 2], [7 / 12, 2 / 3]];
    for (const [index, id] of targetIds.entries()) {
      const handle = connectionHandles(canvas, id);
      const bounds = handle.getBBox();
      const marker = handle.nextElementSibling;
      expect([bounds.x, bounds.y]).toEqual(expectedPositions[index]);
      expect([bounds.width, bounds.height]).toEqual([first.width, first.height]);
      expect(marker).toBeInstanceOf(SVGPolylineElement);
      if (!(marker instanceof SVGPolylineElement)) throw new Error("Outcome handle is missing its arrow marker");
      expect(marker.points.length).toBe(expectedArrow.length);
      for (const [pointIndex, [x, y]] of expectedArrow.entries()) {
        const point = marker.points.getItem(pointIndex);
        expect((point.x - bounds.x) / bounds.width).toBeCloseTo(x, 4);
        expect((point.y - bounds.y) / bounds.height).toBeCloseTo(y, 4);
      }
    }
    expect(requests).toEqual([]);
  });

  it("allows the last painted outcome handle when the earlier handle's fill overlaps its stroke", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const root = canvas.shadowRoot;
    if (root === null) throw new Error("Workflow canvas shadow root missing");
    const sheet = new CSSStyleSheet();
    sheet.replaceSync("rect.outcome-handle { stroke-width: 18px; }");
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    canvas.requestUpdate();
    await settle(canvas);
    const approved = connectionHandles(canvas);
    const alternate = connectionHandles(canvas, "alternate");
    const gap = alternate.getBoundingClientRect().left - approved.getBoundingClientRect().right;
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThan(Number.parseFloat(getComputedStyle(alternate).strokeWidth) / 2);
    expect(approved.hasAttribute("data-ready")).toBe(false);
    expect(alternate.hasAttribute("data-ready")).toBe(true);
    const { end } = await beginConnectionDrag(fixture, "publish", "alternate");
    await commands.pointerPath([{ ...end, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([presentationRequest(connection, { operation: "connect", sourceId: "review", outcomeId: "alternate", destinationId: "publish" })]);
  });

  it.each(["supplied relation", "live map frame"] as const)("drops an invalidated outcome capture on the next pointer sample after a same-task %s change", async (reason) => {
    const fixture = await editingFixture("publish");
    const { canvas, requests, sheet } = fixture;
    const captured = await beginConnectionDrag(fixture, "revise");
    const supplied = canvas.graph;
    const ruleIndex = sheet.cssRules.length;
    if (reason === "supplied relation") {
      canvas.graph = { ...supplied, connections: [{ sourceId: "review", outcomeId: "approved", destinationId: "revise" }] };
    } else {
      sheet.insertRule("#canvas-frame { transform: translateX(8px); }", ruleIndex);
    }
    captured.map.dispatchEvent(new PointerEvent("pointermove", {
      pointerId: captured.pointerId, clientX: captured.end.x, clientY: captured.end.y,
    }));
    const stillCaptured = captured.map.hasPointerCapture(captured.pointerId);
    if (reason === "supplied relation") canvas.graph = supplied;
    else sheet.deleteRule(ruleIndex);
    await settle(canvas);
    expect(stillCaptured).toBe(false);
    expect(captured.map.querySelector("path.connection-preview")).toBeNull();
    await commands.pointerPath([{ ...captured.end, up: true }]);
    expect(requests).toEqual([]);
  });

  it.each(["mode", "map frame", "target clipping"] as const)("checks live %s immediately before a captured drop can publish", async (reason) => {
    const fixture = await editingFixture();
    const { canvas, requests, sheet } = fixture;
    const { map, pointerId, end } = await beginConnectionDrag(fixture, "publish");
    const ruleIndex = sheet.cssRules.length;
    switch (reason) {
      case "mode":
        canvas.mode = "read-only";
        break;
      case "map frame":
        sheet.insertRule("#canvas-frame { transform: translateX(8px); }", ruleIndex);
        break;
      case "target clipping":
        sheet.insertRule("#canvas-pane { clip-path: inset(0 45% 0 0); }", ruleIndex);
        break;
    }
    map.dispatchEvent(new PointerEvent("pointerup", { pointerId, clientX: end.x, clientY: end.y }));
    if (reason === "mode") canvas.mode = "author";
    else sheet.deleteRule(ruleIndex);
    await settle(canvas);
    expect(map.hasPointerCapture(pointerId)).toBe(false);
    expect(map.querySelector("path.connection-preview")).toBeNull();
    await commands.pointerPath([{ ...end, up: true }]);
    expect(requests).toEqual([]);
  });

  it("rejects a destination removed before its first hit at a captured release", async () => {
    const { canvas, requests } = await editingFixture();
    const map = mapOf(canvas);
    const handle = connectionHandles(canvas);
    const start = elementCenter(handle);
    const end = elementCenter(action(canvas, "publish"));
    const destination = getNode(canvas, "publish");
    const presses: PointerEvent[] = [];
    handle.addEventListener("pointerdown", (event) => { presses.push(event); }, { once: true });
    await commands.pointerPath([{ ...start, down: true }]);
    const press = presses[0];
    expect(press?.isTrusted).toBe(true);
    const pointerId = press?.pointerId ?? -1;
    expect(map.hasPointerCapture(pointerId)).toBe(true);

    canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "publish") };
    const hit = canvas.shadowRoot?.elementFromPoint(end.x, end.y);
    expect(hit?.closest("ocelle-workflow-node")).toBe(destination);
    map.dispatchEvent(new PointerEvent("pointerup", { pointerId, clientX: end.x, clientY: end.y }));
    const stillCaptured = map.hasPointerCapture(pointerId);
    await commands.pointerPath([{ ...start, up: true }]);
    await settle(canvas);

    expect(stillCaptured).toBe(false);
    expect(map.querySelector("path.connection-preview")).toBeNull();
    expect(requests, "a captured release may only publish a live destination").toEqual([]);
  });

  it("identifies a visible destination when the native drop lands on the card's padding", async () => {
    const fixture = await editingFixture();
    const { canvas, requests } = fixture;
    const root = canvas.shadowRoot;
    if (root === null) throw new Error("Workflow canvas shadow root missing");
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(".face { padding: 8px; box-sizing: border-box; }");
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
    canvas.requestUpdate();
    await settle(canvas);
    const card = getNode(canvas, "publish")?.closest("foreignObject");
    if (!(card instanceof SVGForeignObjectElement)) throw new Error("Publish step is missing its visible card");
    const box = card.getBoundingClientRect();
    const padding = { x: box.left + 4, y: box.top + 4 };
    const hit = root.elementFromPoint(padding.x, padding.y);
    expect(hit?.closest("foreignObject")).toBe(card);
    expect(hit?.closest("ocelle-workflow-node")).toBeNull();
    const handle = connectionHandles(canvas);
    await commands.pointerPath([{ ...elementCenter(handle), down: true }, padding, { ...padding, up: true }]);
    await settle(canvas);
    expect(requests).toEqual([connectionRequest("connect", "publish")]);
  });

  it.each(["read-only", "clip", "dangling connection"] as const)("refuses the original outcome target when host capture changes its %s admission", async (reason) => {
    const { canvas, pane, requests, sheet } = await editingFixture("publish");
    const map = mapOf(canvas);
    const handle = connectionHandles(canvas);
    const start = elementCenter(handle);
    const end = elementCenter(action(canvas, "revise"));
    const nativeHits: boolean[] = [];
    const setCapture = vi.spyOn(map, "setPointerCapture");
    pane.addEventListener("pointerdown", (event) => {
      nativeHits.push(event.isTrusted && event.composedPath().includes(handle));
      if (reason === "read-only") canvas.mode = "read-only";
      else if (reason === "clip") sheet.insertRule("#canvas-pane { clip-path: inset(0 0 65% 0); }", sheet.cssRules.length);
      else canvas.graph = { ...canvas.graph, nodes: canvas.graph.nodes.filter(({ id }) => id !== "publish") };
    }, { capture: true, once: true });
    await commands.pointerPath([{ ...start, down: true }, end, { ...end, up: true }]);
    const captures = setCapture.mock.calls;
    setCapture.mockRestore();
    await settle(canvas);
    expect(nativeHits).toEqual([true]);
    expect(captures).toEqual([]);
    expect(requests).toEqual([]);
    expect(map.querySelector("path.connection-preview")).toBeNull();
  });
});
