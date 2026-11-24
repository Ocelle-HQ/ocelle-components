import { afterEach, describe, expect, it } from "vitest";
import { commands } from "vitest/browser";
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
const requestTypes = [selection, viewport, "ocelle-workflow-canvas-position-request", "ocelle-workflow-canvas-connection-request"];

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
    expect(getNode(canvas, "review")?.closest("foreignObject")?.hasAttribute("hidden")).toBe(true);

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
    expect(card.parentElement?.inert).toBe(false);
    expect(canvas.layout).toEqual(initialLayout);
    expect(canvas.viewport).toEqual(initialViewport);
    expect(requests).toEqual([]);
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
