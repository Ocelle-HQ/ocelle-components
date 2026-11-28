/// <reference types="vite/client" />
import { afterEach, describe, expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import "../../../../packages/elements/src/index.ts";
import type { OcelleWorkflowCanvas, WorkflowCanvasConnection, WorkflowCanvasNode, WorkflowCanvasPositionRequestDetail, WorkflowCanvasViewportRequestDetail } from "../../../../packages/elements/src/ocelle-workflow-canvas.ts";
import { inProcessDriver } from "../../../../packages/elements/test/in-process.ts";

type Recipe = typeof import("../../../stories/workflow-studio-authoring.ts");
type Options = Parameters<Recipe["renderWorkflowStudioAuthoring"]>[0];
type Fixture = ReturnType<Recipe["renderWorkflowStudioAuthoring"]>;
interface Snapshot {
  readonly steps: readonly (WorkflowCanvasNode & { readonly reviewer: string })[];
  readonly connections: readonly WorkflowCanvasConnection[];
}

const recipe = import.meta.glob<Recipe>("../../../stories/workflow-studio-authoring.ts", { eager: true })["../../../stories/workflow-studio-authoring.ts"];
if (recipe === undefined) throw new Error("Cannot find module '../../../stories/workflow-studio-authoring.ts'");
const render = recipe.renderWorkflowStudioAuthoring;
const styles = import.meta.glob<string>("../../../stories/workflow-studio.css", { eager: true, query: "?inline", import: "default" });
const driver = inProcessDriver();
const reviewId = "security-review-1";
const publishId = "publish-decision";
const reviewerName = "Avery Example";
const activateEvent = "ocelle-button-activate";
const selectionEvent = "ocelle-workflow-node-select";
const connectionEvent = "ocelle-workflow-canvas-connection-request";
const positionEvent = "ocelle-workflow-canvas-position-request";
const viewportEvent = "ocelle-workflow-canvas-viewport-request";

let mounted: HTMLElement | undefined;
let recipeSheet: CSSStyleSheet | undefined;
afterEach(() => {
  mounted?.remove();
  if (recipeSheet !== undefined) document.adoptedStyleSheets = document.adoptedStyleSheets.filter((sheet) => sheet !== recipeSheet);
  mounted = undefined;
  recipeSheet = undefined;
});

function required<T>(value: T | null | undefined, description: string): T {
  if (value == null) throw new Error(`Missing workflow fixture control: ${description}`);
  return value;
}

async function settle(canvas: OcelleWorkflowCanvas): Promise<void> {
  await canvas.updateComplete;
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  await canvas.updateComplete;
  await Promise.all([...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].map((node) => node.updateComplete));
}

async function mount(options: Options = {}) {
  await driver.mount("");
  recipeSheet = new CSSStyleSheet();
  recipeSheet.replaceSync(required(styles["../../../stories/workflow-studio.css"], "authoring stylesheet"));
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, recipeSheet];
  const fixture = render(options);
  mounted = fixture.root;
  document.body.append(fixture.root);
  const canvas = required(fixture.root.querySelector("ocelle-workflow-canvas"), "workflow canvas");
  await settle(canvas);
  return { ...fixture, canvas };
}

function snapshot(fixture: Fixture): Snapshot {
  return JSON.parse(fixture.readSemanticSnapshot()) as Snapshot;
}

function button(host: Element | null | undefined, name: string): HTMLButtonElement {
  return required(host?.shadowRoot?.querySelector("button"), name);
}

function hostButton(root: ParentNode, selector: string): HTMLButtonElement {
  return button(root.querySelector(selector), selector);
}

function field(root: ParentNode, selector: string): HTMLSelectElement {
  return required(root.querySelector(selector)?.shadowRoot?.querySelector("select"), selector);
}

function active(): Element | null {
  let current = document.activeElement;
  while (current?.shadowRoot?.activeElement) current = current.shadowRoot.activeElement;
  return current;
}

async function activate(control: HTMLElement): Promise<void> {
  control.focus({ preventScroll: true });
  expect(active(), "the browser can focus the named native action before pressing Enter").toBe(control);
  await userEvent.keyboard("{Enter}");
}

function listen<T>(target: EventTarget, name: string): T[] {
  const delivered: T[] = [];
  target.addEventListener(name, (event) => delivered.push(structuredClone((event as CustomEvent<T>).detail)), { capture: true });
  return delivered;
}

function command(canvas: OcelleWorkflowCanvas, name: string): HTMLButtonElement {
  return required([...canvas.shadowRoot?.querySelectorAll("button") ?? []].find((control) => control.textContent.trim() === name), name);
}

async function openCommands(canvas: OcelleWorkflowCanvas): Promise<void> {
  await activate(required(canvas.shadowRoot?.querySelector("summary"), "Canvas controls"));
  await expect.poll(() => canvas.shadowRoot?.querySelector("details[open] button")).toBeInstanceOf(HTMLButtonElement);
}

function node(canvas: OcelleWorkflowCanvas, id: string) {
  return required([...canvas.shadowRoot?.querySelectorAll("ocelle-workflow-node") ?? []].find((step) => step.nodeId === id), id);
}

function origin(canvas: OcelleWorkflowCanvas, id: string): readonly [number, number] {
  const face = node(canvas, id).parentElement?.parentElement;
  if (!(face instanceof SVGForeignObjectElement)) throw new Error(`Missing workflow node face for ${id}`);
  return [face.x.baseVal.value, face.y.baseVal.value];
}

async function reassign(canvas: OcelleWorkflowCanvas, destination: string): Promise<HTMLButtonElement> {
  await openCommands(canvas);
  const edit = command(canvas, "Edit connection");
  await activate(edit);
  for (const [name, value] of [["source", reviewId], ["outcome", "approved"], ["destination", destination]]) {
    await settle(canvas);
    await activate(required(canvas.shadowRoot?.querySelector<HTMLButtonElement>(`button[data-${name}-id="${value}"]`), value));
  }
  await settle(canvas);
  await activate(command(canvas, "Apply connection"));
  await settle(canvas);
  return edit;
}

describe("Workflow Studio authoring host", () => {
  it("places the named palette step and exposes its missing reviewer", async () => {
    const fixture = await mount({ scenario: "palette" });
    const { root, canvas } = fixture;
    const before = snapshot(fixture);
    const delivered = listen<{ rowId: string }>(root, "ocelle-action-row-activate");
    expect(before.steps.find(({ id }) => id === reviewId)).toBeUndefined();

    await activate(hostButton(root, '[data-workflow-palette] ocelle-action-row[row-id="security-review"]'));
    expect(delivered).toEqual([{ rowId: "security-review" }]);
    const after = snapshot(fixture);
    expect(after.steps.filter(({ id }) => id === reviewId), "palette activation places one unassigned Security review").toEqual([
      expect.objectContaining({ id: reviewId, label: "Security review", reviewer: "" }),
    ]);
    expect(after.steps.filter(({ id }) => id !== reviewId)).toEqual(before.steps);
    expect(after.connections).toEqual(before.connections);
    await settle(canvas);
    expect(canvas.graph.nodes.find(({ id }) => id === reviewId)?.invalid).toBe(true);
    expect(root.querySelector("[data-finding]")?.textContent).toContain("Missing reviewer for Security review");
  });

  it("saves a named reviewer through the native select and clears the finding", async () => {
    const fixture = await mount({ scenario: "unassigned" });
    const { root, canvas } = fixture;
    const before = snapshot(fixture);
    const reviewer = field(root, "[data-inspector-fields] ocelle-form-select");
    const delivered = listen<{ value: string }>(root, "ocelle-form-select-change");
    expect(reviewer.value).toBe("");
    expect(root.querySelector("[data-finding]")?.textContent).toContain("Missing reviewer");

    await page.elementLocator(reviewer).selectOptions(reviewerName);
    expect(delivered).toEqual([{ value: reviewerName }]);
    expect(snapshot(fixture), "a named choice is committed to the authoritative step").toEqual({
      ...before,
      steps: before.steps.map((step) => step.id === reviewId ? { ...step, reviewer: reviewerName } : step),
    });
    await settle(canvas);
    expect(canvas.selectedNodeId).toBe(reviewId);
    expect(canvas.graph.nodes.find(({ id }) => id === reviewId)?.invalid).toBe(false);
    expect(root.querySelector("[data-finding]")).toBeNull();
    expect(root.querySelector("[data-reviewer-status]")?.textContent).toContain("Reviewer assigned");
  });

  it("focuses the inline reviewer after activating the missing reviewer finding", async () => {
    const fixture = await mount({ scenario: "unassigned" });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const finding = required(root.querySelector("[data-finding]"), "missing reviewer finding");
    const delivered = listen(root, activateEvent);

    await activate(button(finding, "Missing reviewer for Security review"));
    expect(delivered).toHaveLength(1);
    await expect.poll(() => active(), { message: "the finding focuses the enabled inline reviewer" }).toBe(field(root, "[data-inspector-fields] ocelle-form-select"));
    expect(canvas.selectedNodeId).toBe(reviewId);
    expect(fixture.readSemanticSnapshot()).toBe(before);
  });

  it("opens the compact reviewer drawer from the finding and focuses its field", async () => {
    const fixture = await mount({ scenario: "unassigned", compact: true });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const drawer = required(root.querySelector("ocelle-drawer"), "reviewer drawer");
    const delivered = listen(root, activateEvent);
    expect(drawer.open).toBe(false);

    await activate(hostButton(root, "[data-finding]"));
    expect(delivered).toHaveLength(1);
    await expect.poll(() => drawer.open, { message: "the compact finding opens the reviewer drawer" }).toBe(true);
    await expect.poll(() => active()).toBe(field(drawer, "[data-inspector-fields] ocelle-form-select"));
    expect(canvas.selectedNodeId).toBe(reviewId);
    expect(fixture.readSemanticSnapshot()).toBe(before);
  });

  it("moves the visible selected step without changing any serialized semantics", async () => {
    const fixture = await mount({ scenario: "wired" });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const untouched = origin(canvas, publishId);
    const delivered = listen<WorkflowCanvasPositionRequestDetail>(root, positionEvent);
    expect(origin(canvas, reviewId)).toEqual([16, 16]);

    await openCommands(canvas);
    await page.elementLocator(required(canvas.shadowRoot?.querySelector('input[name="x"]'), "X coordinate")).fill("48");
    await page.elementLocator(required(canvas.shadowRoot?.querySelector('input[name="y"]'), "Y coordinate")).fill("52");
    await activate(command(canvas, "Move step"));
    expect(delivered).toEqual([{ nodeId: reviewId, position: { x: 48, y: 52 } }]);
    expect(fixture.readSemanticSnapshot()).toBe(before);
    await settle(canvas);
    expect(origin(canvas, reviewId), "the delivered move changes the displayed step position").toEqual([48, 52]);
    expect(origin(canvas, publishId)).toEqual(untouched);
  });

  it("commits only the requested connection after the operator chooses the new destination", async () => {
    const fixture = await mount({ scenario: "wired" });
    const { root, canvas } = fixture;
    const before = snapshot(fixture);
    const delivered = listen(root, connectionEvent);
    const destinationId = "record-decision";

    await reassign(canvas, destinationId);
    expect(delivered).toEqual([{ operation: "reassign", sourceId: reviewId, outcomeId: "approved", destinationId }]);
    expect(snapshot(fixture), "the accepted request rewires only the Approved edge").toEqual({
      ...before,
      connections: before.connections.map((edge) => edge.sourceId === reviewId && edge.outcomeId === "approved" ? { ...edge, destinationId } : edge),
    });
  });

  it("announces a delivered rejected rewire while preserving the graph and edit focus", async () => {
    const fixture = await mount({ scenario: "wired" });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const delivered = listen(root, connectionEvent);

    const edit = await reassign(canvas, "request-changes");
    expect(delivered).toEqual([{ operation: "reassign", sourceId: reviewId, outcomeId: "approved", destinationId: "request-changes" }]);
    expect(fixture.readSemanticSnapshot()).toBe(before);
    const notice = required(root.querySelector("ocelle-notice[data-edit-notice]"), "connection rejection notice");
    expect(notice.hidden, "the rejected destination shows a notice").toBe(false);
    expect(notice.textContent).toContain("Request changes");
    expect(notice.announce).toBe(true);
    expect(active()).toBe(edit);
  });

  it("switches the existing graph to read-only without editing it", async () => {
    const fixture = await mount({ scenario: "wired" });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const delivered = listen(root, activateEvent);
    const layout = structuredClone(canvas.layout);

    await activate(hostButton(root, "[data-inspect-workflow]"));
    expect(delivered).toHaveLength(1);
    await settle(canvas);
    expect(canvas.mode, "Inspect workflow changes the existing canvas to read-only").toBe("read-only");
    expect(canvas.layout).toEqual(layout);
    expect(canvas.selectedNodeId).toBe(reviewId);
    expect(fixture.readSemanticSnapshot()).toBe(before);
    expect(root.querySelector("[data-remove-step]")).toBeNull();
  });

  it("delivers a native node request and selects the step in read-only mode", async () => {
    const fixture = await mount({ scenario: "wired", mode: "read-only" });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const selectable = listen<{ nodeId: string }>(root, selectionEvent);
    const edits = listen(root, connectionEvent);
    const moves = listen(root, positionEvent);
    const target = button(node(canvas, publishId), "Publish decision");
    const keys: boolean[] = [];
    target.addEventListener("keydown", (event) => keys.push(event.isTrusted));
    expect(canvas.selectedNodeId).toBe(reviewId);

    await activate(target);
    expect(keys).toEqual([true]);
    expect(selectable).toEqual([{ nodeId: publishId }]);
    expect(edits).toEqual([]);
    expect(moves).toEqual([]);
    expect(fixture.readSemanticSnapshot()).toBe(before);
    expect(canvas.selectedNodeId, "read-only selection is applied to the canvas").toBe(publishId);
  });

  it("applies a delivered viewport request in read-only mode without exposing editing commands", async () => {
    const fixture = await mount({ scenario: "wired", mode: "read-only" });
    const { root, canvas } = fixture;
    const before = fixture.readSemanticSnapshot();
    const expected = { ...canvas.viewport, x: canvas.viewport.x + 64 };
    const delivered = listen<WorkflowCanvasViewportRequestDetail>(root, viewportEvent);
    const edits = listen(root, connectionEvent);
    const moves = listen(root, positionEvent);

    await openCommands(canvas);
    const controls = [...canvas.shadowRoot?.querySelectorAll("details button") ?? []].map((control) => control.textContent.trim());
    expect(controls).not.toContain("Edit connection");
    expect(controls).not.toContain("Move step");
    await activate(command(canvas, "Pan right"));
    expect(delivered).toEqual([{ viewport: expected }]);
    expect(edits).toEqual([]);
    expect(moves).toEqual([]);
    expect(fixture.readSemanticSnapshot()).toBe(before);
    expect(canvas.viewport, "read-only navigation applies the requested viewport").toEqual(expected);
  });

  it("atomically removes the selected step, its binding and incident edges from the authoritative graph", async () => {
    const fixture = await mount({ scenario: "wired" });
    const { root, canvas } = fixture;
    const before = snapshot(fixture);
    const layout = structuredClone(canvas.layout);
    const delivered = listen(root, activateEvent);
    expect(before.steps.find(({ id }) => id === reviewId)?.reviewer).toBe(reviewerName);
    expect(before.connections.filter((edge) => edge.sourceId === reviewId || edge.destinationId === reviewId)).toHaveLength(3);
    expect(before.connections).toContainEqual({ sourceId: publishId, outcomeId: "published", destinationId: "record-decision" });

    await activate(hostButton(root, "[data-remove-step]"));
    expect(delivered).toHaveLength(1);
    expect(snapshot(fixture), "the graph drops only the removed step and its incident edges").toEqual({
      steps: before.steps.filter(({ id }) => id !== reviewId),
      connections: before.connections.filter((edge) => edge.sourceId !== reviewId && edge.destinationId !== reviewId),
    });
    await settle(canvas);
    expect(canvas.layout).toEqual(layout.filter(({ nodeId }) => nodeId !== reviewId));
    expect(canvas.selectedNodeId).toBe(publishId);
    expect(root.querySelector("[data-remove-step]")).toBeNull();
  });

  it.each([
    ["wired", "the visible successor", '[data-select-step="publish-decision"]', "button"],
    ["previous", "the visible predecessor", '[data-select-step="publish-decision"]', "button"],
    ["clipped", "the operable Step selector", "[data-step-selector]", "select"],
    ["sole-step", "the persistent Add step action", "[data-add-step]", "button"],
  ] as const)("recovers focus for %s on %s after removing Security review", async (scenario, label, selector, kind) => {
    const { root, canvas } = await mount({ scenario });
    const remove = hostButton(root, "[data-remove-step]");
    const delivered = listen(root, activateEvent);

    await activate(remove);
    expect(delivered).toHaveLength(1);
    await settle(canvas);
    await expect.poll(() => active(), { message: `the deep active control is ${label}` }).toBe(
      required(root.querySelector(selector)?.shadowRoot?.querySelector(kind), label),
    );
    expect(remove.isConnected).toBe(false);
  });
});
