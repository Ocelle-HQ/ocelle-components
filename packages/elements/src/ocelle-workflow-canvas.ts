import { LitElement, css, html, nothing, svg, type PropertyValues } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { controlStyles } from "./control.ts";
import { define } from "./define.ts";
import { OcelleWorkflowNode } from "./ocelle-workflow-node.ts";
import { projectWorkflowCanvasGraph } from "./workflow-canvas-graph.ts";
import {
  navigateWorkflowCanvas,
  recoverWorkflowCanvasFocus,
  workflowCanvasEntryId,
  workflowCanvasRevealTarget,
  type WorkflowCanvasNavigationKey,
  type WorkflowCanvasPendingReveal,
} from "./workflow-canvas-navigation.ts";
import {
  canvasActionBounds,
  canvasBoundsOverlap,
  canvasRevealViewport,
  canvasScreenInverse,
  canvasViewport,
  canvasViewportPoint,
  composedAncestors,
  effectiveCanvasClip,
  isInsideCanvasClip,
  type CanvasBounds,
} from "./workflow-canvas-viewport.ts";
import type {
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasMode,
  WorkflowCanvasNode,
  WorkflowCanvasViewport,
  WorkflowCanvasViewportRequestDetail,
} from "./workflow-canvas-types.ts";

export type {
  WorkflowCanvasConnection,
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasMode,
  WorkflowCanvasNode,
  WorkflowCanvasOutcome,
  WorkflowCanvasPoint,
  WorkflowCanvasViewport,
  WorkflowCanvasViewportRequestDetail,
} from "./workflow-canvas-types.ts";

const navigationKeys: ReadonlySet<string> = new Set<WorkflowCanvasNavigationKey>([
  "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End",
]);
const withoutScroll = { preventScroll: true };

interface NodeSize {
  readonly width: number;
  readonly height: number;
}

interface NodeAction {
  readonly node: OcelleWorkflowNode;
  readonly button: HTMLButtonElement;
  readonly face: HTMLElement;
  readonly focusBounds: SVGRectElement;
}

/**
 * A host-controlled workflow map with native step selection and named navigation.
 *
 * @tagname ocelle-workflow-canvas
 * @fires {CustomEvent<{nodeId: string}>} ocelle-workflow-node-select - The original bubbling request from the native node action.
 * @fires {CustomEvent<WorkflowCanvasViewportRequestDetail>} ocelle-workflow-canvas-viewport-request - A proposal to reveal a named step in the viewport.
 */
export class OcelleWorkflowCanvas extends LitElement {
  static override properties = {
    graph: { attribute: false },
    layout: { attribute: false },
    viewport: { attribute: false },
    selectedNodeId: { attribute: false },
    mode: { attribute: false },
  };

  static override styles = [
    css`
      :host {
        display: block;
        min-inline-size: 0;
        block-size: calc(8 * var(--ocelle-target-min));
        font-family: var(--ocelle-font-sans);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-normal);
      }

      :host([hidden]) {
        display: none;
      }

      .canvas {
        display: flex;
        flex-direction: column;
        inline-size: 100%;
        block-size: 100%;
      }

      .navigator {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ocelle-space-2);
        padding: var(--ocelle-space-2);
        color: var(--ocelle-color-ink);
        background-color: var(--ocelle-color-sheet);
      }

      label {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ocelle-space-2);
        min-inline-size: 0;
      }

      .control {
        box-sizing: border-box;
        min-inline-size: var(--ocelle-target-min);
        min-block-size: var(--ocelle-target-min);
        max-inline-size: 100%;
        padding: var(--ocelle-space-2);
        border: var(--ocelle-border-width) solid var(--ocelle-color-control-border);
        border-radius: var(--ocelle-radius-2);
        color: inherit;
        background-color: inherit;
        font: inherit;
      }

      .map {
        display: block;
        inline-size: 100%;
        flex: 1;
        min-block-size: 0;
        overflow: hidden;
        background-color: var(--ocelle-color-sheet);
      }

      .edge {
        fill: none;
        stroke: var(--ocelle-color-control-border);
        stroke-width: var(--ocelle-border-width);
      }

      foreignObject {
        overflow: visible;
      }

      .focus-bounds {
        /* Hidden markers still report geometric intersections. */
        visibility: hidden;
        fill: none;
        pointer-events: none;
      }

      foreignObject[hidden] {
        display: none;
      }

      .face {
        inline-size: calc(4 * var(--ocelle-target-min));
      }

      @media (forced-colors: active) {
        .navigator, .map {
          color: CanvasText;
          background-color: Canvas;
        }

        .control {
          border-color: ButtonText;
        }

        .edge {
          stroke: CanvasText;
        }
      }
    `,
    controlStyles,
  ];

  /** Ordered workflow steps and their supplied outcome connections. @default { nodes: [], connections: [] } */
  declare graph: WorkflowCanvasGraph;

  /** Step locations in graph coordinates. @default [] */
  declare layout: readonly WorkflowCanvasLayoutEntry[];

  /** The host's current pan and scale. @default { x: 0, y: 0, scale: 1 } */
  declare viewport: WorkflowCanvasViewport;

  /** The host's selected step ID. @default null */
  declare selectedNodeId: string | null;

  /** Whether this view is authoring or read-only. @default "read-only" */
  declare mode: WorkflowCanvasMode;

  #projection = projectWorkflowCanvasGraph({ nodes: [], connections: [] }, []);
  #sizes = new Map<string, NodeSize>();
  #raisedId: string | null = null;
  #namedId: string | null = null;
  #generation = 0;
  #focusEpoch = 0;
  #pendingReveal: (WorkflowCanvasPendingReveal & { readonly initiator: HTMLButtonElement }) | null = null;
  #retainedFocus: { readonly id: string; readonly order: readonly string[] } | null = null;
  #watched = new Set<Element>();
  #scrollAncestors = new Set<Element>();
  #resize = new ResizeObserver(() => { this.#refresh(); });
  #intersection = new IntersectionObserver(() => { this.#refresh(); }, { threshold: [0, 1] });
  #listeners: AbortController | undefined;

  constructor() {
    super();
    this.graph = { nodes: [], connections: [] };
    this.layout = [];
    this.viewport = { x: 0, y: 0, scale: 1 };
    this.selectedNodeId = null;
    this.mode = "read-only";
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.#listeners = new AbortController();
    const { signal } = this.#listeners;
    this.addEventListener("click", this.#onActionClick, { capture: true, signal });
    this.addEventListener("focusin", this.#onActionFocus, { capture: true, signal });
    this.addEventListener("focusout", this.#onActionBlur, { signal });
    this.addEventListener("keydown", this.#onActionKey, { signal });
    this.ownerDocument.defaultView?.addEventListener("resize", this.#onGeometryChange, { signal });
    this.ownerDocument.defaultView?.addEventListener("scroll", this.#onGeometryChange, { signal });
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#listeners?.abort();
    this.#resize.disconnect();
    this.#intersection.disconnect();
    this.#watched.clear();
    this.#scrollAncestors.clear();
    this.#pendingReveal = null;
    this.#retainedFocus = null;
  }

  protected override willUpdate(changes: PropertyValues<this>): void {
    const focusedId = this.#focusedAction()?.node.nodeId;
    if (focusedId !== undefined) {
      this.#retainedFocus ??= { id: focusedId, order: this.#order };
    }
    if (changes.has("graph") || changes.has("layout")) {
      this.#projection = projectWorkflowCanvasGraph(this.graph, this.layout);
      const ids = new Set(this.#order);
      if (this.#raisedId !== null && !ids.has(this.#raisedId)) this.#raisedId = null;
      if (this.#namedId === null || !ids.has(this.#namedId)) {
        this.#namedId = this.#projection.nodes[0]?.id ?? null;
      }
      if (this.#pendingReveal !== null && !this.#projection.positions.has(this.#pendingReveal.nodeId)) {
        this.#pendingReveal = null;
      }
      for (const id of this.#sizes.keys()) {
        if (!ids.has(id)) this.#sizes.delete(id);
      }
    }
  }

  protected override updated(): void {
    const picker = this.renderRoot.querySelector("select");
    // Apply the value after Lit has updated the native option list.
    if (picker !== null) picker.value = this.#namedId ?? "";
    const nodes = this.renderRoot.querySelectorAll("ocelle-workflow-node");
    void Promise.all([...nodes].map((node) => node.updateComplete)).then(() => {
      if (this.isConnected) this.#refresh();
    });
  }

  #renderNode(node: WorkflowCanvasNode, context: string): unknown {
    const position = this.#projection.positions.get(node.id);
    const point = position === undefined ? { x: 0, y: 0 } : canvasViewportPoint(position, canvasViewport(this.viewport));
    const size = this.#sizes.get(node.id);
    return svg`
      <foreignObject x=${point.x} y=${point.y} width=${size?.width ?? 1} height=${size?.height ?? 1}
        ?hidden=${position === undefined}>
        ${html`<div class="face" inert aria-hidden="true">
          <ocelle-workflow-node .nodeId=${node.id} .label=${node.label} .kind=${node.kind}
            .accountableRole=${node.accountableRole} .outcomes=${node.outcomes.map(({ label }) => label)}
            .selected=${node.id === this.selectedNodeId} .waiting=${node.waiting === true} .invalid=${node.invalid === true}
            aria-label=${context || nothing}>
            ${node.status ? html`<span slot="status">${node.status}</span>` : nothing}
          </ocelle-workflow-node>
        </div>`}
      </foreignObject>
      <rect class="focus-bounds" aria-hidden="true"></rect>`;
  }

  #edgePath(sourceId: string, destinationId: string): string {
    const source = this.#projection.positions.get(sourceId);
    const destination = this.#projection.positions.get(destinationId);
    if (source === undefined || destination === undefined) return "";
    const view = canvasViewport(this.viewport);
    const start = canvasViewportPoint(source, view);
    const end = canvasViewportPoint(destination, view);
    const startSize = this.#sizes.get(sourceId);
    const endSize = this.#sizes.get(destinationId);
    const x = start.x + (startSize?.width ?? 1);
    const height = startSize?.height ?? 1;
    const y = start.y + height / 2;
    if (sourceId === destinationId) {
      const bend = x + height / 2;
      const upper = y - height / 4;
      const lower = y + height / 4;
      return `M ${String(x)} ${String(upper)} C ${String(bend)} ${String(upper)}, ${String(bend)} ${String(lower)}, ${String(x)} ${String(lower)}`;
    }
    const endY = end.y + (endSize?.height ?? 1) / 2;
    const middle = (x + end.x) / 2;
    return `M ${String(x)} ${String(y)} C ${String(middle)} ${String(y)}, ${String(middle)} ${String(endY)}, ${String(end.x)} ${String(endY)}`;
  }

  protected override render(): unknown {
    const { nodes, drawableConnections, positions } = this.#projection;
    const labelCounts = new Map<string, number>();
    for (const { label } of nodes) labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    const nameContext = (node: WorkflowCanvasNode) => (labelCounts.get(node.label) ?? 0) > 1
      ? `(${node.accountableRole}, ${node.kind}, ${node.id})` : "";
    const raised = nodes.find(({ id }) => id === this.#raisedId);
    const painted = raised === undefined ? nodes : [...nodes.filter((node) => node !== raised), raised];
    return html`
      <div class="canvas">
        <div class="navigator">
          <label>Step
            <select class="control" @change=${this.#chooseNamed}>
              ${nodes.map((node) => html`<option value=${node.id}>
                ${node.label} ${nameContext(node)}
              </option>`)}
            </select>
          </label>
          <button class="control" type="button" ?disabled=${this.#namedId === null || !positions.has(this.#namedId)}
            @click=${this.#revealNamed} @blur=${this.#loseRevealFocus}>Reveal step</button>
        </div>
        <svg class="map">
          <g aria-hidden="true">
            ${drawableConnections.map(({ source, destination }) => svg`<path class="edge" d=${this.#edgePath(source.id, destination.id)}></path>`)}
          </g>
          ${repeat(painted, ({ id }) => id, (node) => this.#renderNode(node, nameContext(node)))}
        </svg>
      </div>`;
  }

  get #order(): readonly string[] {
    return this.#projection.nodes.map(({ id }) => id);
  }

  #action(node: OcelleWorkflowNode): NodeAction | undefined {
    const face = node.parentElement;
    const button = node.shadowRoot?.querySelector("button");
    const focusBounds = face?.parentElement?.nextElementSibling;
    if (face === null || button === null || button === undefined || !(focusBounds instanceof SVGRectElement)) return;
    return { node, face, button, focusBounds };
  }

  #actions(): NodeAction[] {
    return [...this.renderRoot.querySelectorAll("ocelle-workflow-node")].flatMap((node) => this.#action(node) ?? []);
  }

  #focusedAction(): NodeAction | undefined {
    const node = this.shadowRoot?.activeElement;
    if (!(node instanceof OcelleWorkflowNode)) return;
    const action = this.#action(node);
    return action?.button === node.shadowRoot?.activeElement ? action : undefined;
  }

  #eventAction(event: Event): NodeAction | undefined {
    const path = event.composedPath();
    const node = path.find((part): part is OcelleWorkflowNode =>
      part instanceof OcelleWorkflowNode && part.getRootNode() === this.shadowRoot);
    if (node === undefined) return;
    const action = this.#action(node);
    return action !== undefined && path.includes(action.button) ? action : undefined;
  }

  #measureEligibility(
    actions: readonly NodeAction[],
    map: SVGSVGElement,
  ): { contained: Set<string>; eligible: Set<string>; bounds: ReadonlyMap<string, CanvasBounds> } {
    const clip = effectiveCanvasClip(map);
    const contained = new Set<string>();
    const eligible = new Set<string>();
    const painted = actions.filter(({ node }) => this.#projection.positions.has(node.nodeId));
    const footprints = painted.map(({ face }) => face.getBoundingClientRect());
    const bounds = new Map<string, CanvasBounds>();
    const transform = map.getScreenCTM();
    painted.forEach(({ node, button }, index) => {
      const outline = canvasActionBounds(button, transform);
      bounds.set(node.nodeId, outline);
      if (!isInsideCanvasClip(clip, outline)) return;
      contained.add(node.nodeId);
      if (!footprints.some((footprint, paintIndex) => paintIndex > index && canvasBoundsOverlap(outline, footprint))) {
        eligible.add(node.nodeId);
      }
    });
    return { contained, eligible, bounds };
  }

  #refresh(): void {
    if (!this.isConnected) return;
    const map = this.renderRoot.querySelector("svg");
    if (map === null) return;
    const actions = this.#actions();
    this.#watchGeometry(map, actions);
    const focused = this.#focusedAction();
    const previous = this.#retainedFocus;
    this.#retainedFocus = null;
    const { contained, eligible, bounds } = this.#measureEligibility(actions, map);
    const inverse = canvasScreenInverse(map);
    const ownsFocusLoss = previous !== null && this.#documentFocusIsUnclaimed();
    const currentId = focused?.node.nodeId ?? (ownsFocusLoss ? previous.id : null);
    const entry = currentId !== null && eligible.has(currentId)
      ? currentId : workflowCanvasEntryId(this.#order, eligible, this.selectedNodeId);
    for (const { face, node, button, focusBounds } of actions) {
      const tabIndex = node.nodeId === entry ? 0 : -1;
      node.selectionTabIndex = tabIndex;
      button.tabIndex = tabIndex;
      face.inert = !eligible.has(node.nodeId);
      const outline = bounds.get(node.nodeId);
      if (outline !== undefined && inverse !== null) this.#placeFocusBounds(focusBounds, outline, inverse);
      if (!this.#projection.positions.has(node.nodeId)) continue;
      const size = this.#sizes.get(node.nodeId);
      if (size?.width !== face.offsetWidth || size.height !== face.offsetHeight) {
        this.#sizes.set(node.nodeId, { width: face.offsetWidth, height: face.offsetHeight });
        this.requestUpdate();
      }
    }

    if (currentId !== null && (focused === undefined || !eligible.has(currentId))) {
      const recoveryId = recoverWorkflowCanvasFocus(previous?.order ?? this.#order, eligible, currentId);
      const recovery = actions.find(({ node }) => node.nodeId === recoveryId);
      if (recovery === undefined) this.#focusNamed(map);
      else recovery.node.focus(withoutScroll);
    }
    for (const { face } of actions) {
      if (face.inert && !face.hasAttribute("aria-hidden")) face.setAttribute("aria-hidden", "true");
      if (!face.inert) face.removeAttribute("aria-hidden");
    }
    this.#completeReveal(actions, map, contained, eligible);
  }

  #placeFocusBounds(marker: SVGRectElement, bounds: CanvasBounds, inverse: DOMMatrix): void {
    const first = new DOMPoint(bounds.left, bounds.top).matrixTransform(inverse);
    const last = new DOMPoint(bounds.right, bounds.bottom).matrixTransform(inverse);
    const attributes = { x: first.x, y: first.y, width: last.x - first.x, height: last.y - first.y };
    for (const [name, value] of Object.entries(attributes)) {
      const next = String(value);
      if (Number.isFinite(value) && marker.getAttribute(name) !== next) marker.setAttribute(name, next);
    }
  }

  #documentFocusIsUnclaimed(): boolean {
    const active = this.ownerDocument.activeElement;
    return active === this.ownerDocument.body || active === this.ownerDocument.documentElement;
  }

  #watchGeometry(map: SVGSVGElement, actions: readonly NodeAction[]): void {
    const signal = this.#listeners?.signal;
    if (signal === undefined) return;
    const ancestors = new Set(composedAncestors(map));
    for (const element of this.#scrollAncestors) {
      if (!ancestors.has(element)) element.removeEventListener("scroll", this.#onGeometryChange);
    }
    for (const element of ancestors) {
      if (!this.#scrollAncestors.has(element)) element.addEventListener("scroll", this.#onGeometryChange, { signal });
    }
    this.#scrollAncestors = ancestors;
    const elements = new Set<Element>([map, ...ancestors]);
    for (const control of map.previousElementSibling?.querySelectorAll("select, button") ?? []) elements.add(control);
    for (const { face, button, focusBounds } of actions) {
      elements.add(face);
      elements.add(button);
      elements.add(focusBounds);
    }
    for (const element of this.#watched) {
      if (elements.has(element)) continue;
      this.#resize.unobserve(element);
      this.#intersection.unobserve(element);
    }
    for (const element of elements) {
      if (this.#watched.has(element)) continue;
      this.#resize.observe(element);
      this.#intersection.observe(element);
    }
    this.#watched = elements;
  }

  #focusNamed(map: SVGSVGElement): void {
    const navigator = map.previousElementSibling;
    if (navigator === null) return;
    const clip = effectiveCanvasClip(navigator);
    const visible = [...navigator.querySelectorAll("select, button")].find(
      (control) => !control.matches(":disabled") && isInsideCanvasClip(clip, control.getBoundingClientRect()),
    );
    if (visible instanceof HTMLElement) visible.focus(withoutScroll);
    else this.#focusedAction()?.button.blur();
  }

  #onGeometryChange = (): void => { this.#refresh(); };

  #onActionClick = (event: MouseEvent): void => {
    const action = this.#eventAction(event);
    if (action === undefined) return;
    this.#refresh();
    if (action.face.inert) {
      event.preventDefault();
      event.stopImmediatePropagation();
      // A same-task host restore can leave no intersection transition for the observer.
      this.ownerDocument.defaultView?.requestAnimationFrame(this.#onGeometryChange);
    }
  };

  #onActionFocus = (event: FocusEvent): void => {
    if (this.#eventAction(event) !== undefined) this.#refresh();
  };

  #onActionBlur = (event: FocusEvent): void => {
    if (this.#eventAction(event) !== undefined) queueMicrotask(() => {
      if (this.isConnected) this.#refresh();
    });
  };

  #onActionKey = (event: KeyboardEvent): void => {
    const action = this.#eventAction(event);
    if (action === undefined || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !navigationKeys.has(event.key)) return;
    const map = this.renderRoot.querySelector("svg");
    if (map === null) return;
    const actions = this.#actions();
    const { eligible } = this.#measureEligibility(actions, map);
    const next = navigateWorkflowCanvas(this.#order, eligible, action.node.nodeId, event.key as WorkflowCanvasNavigationKey);
    event.preventDefault();
    actions.find(({ node }) => node.nodeId === next)?.node.focus(withoutScroll);
  };

  #chooseNamed(event: Event): void {
    if (!(event.currentTarget instanceof HTMLSelectElement)) return;
    this.#namedId = event.currentTarget.value;
    this.requestUpdate();
  }

  #loseRevealFocus(event: FocusEvent): void {
    if (this.#pendingReveal?.initiator !== event.currentTarget) return;
    // Stryker disable next-line AssignmentOperator: either direction is equivalent because the pending reveal is discarded immediately.
    this.#focusEpoch += 1;
    this.#pendingReveal = null;
  }

  #revealNamed(event: MouseEvent): void {
    const initiator = event.currentTarget;
    if (!(initiator instanceof HTMLButtonElement)) return;
    const id = this.#namedId;
    const position = id === null ? undefined : this.#projection.positions.get(id);
    const map = this.renderRoot.querySelector("svg");
    if (id === null || position === undefined || map === null) return;
    initiator.focus(withoutScroll);
    // Stryker disable next-line UpdateOperator: either direction stores the same current value in the sole pending reveal.
    this.#pendingReveal = { nodeId: id, generation: ++this.#generation, focusEpoch: this.#focusEpoch, initiator };
    const actions = this.#actions();
    const { contained, eligible } = this.#measureEligibility(actions, map);
    if (contained.has(id)) {
      this.#completeReveal(actions, map, contained, eligible);
      return;
    }
    const action = actions.find(({ node }) => node.nodeId === id)?.button;
    const viewport = action === undefined ? null : canvasRevealViewport(canvasViewport(this.viewport), map, action);
    if (viewport === null) {
      this.#pendingReveal = null;
      return;
    }
    this.dispatchEvent(new CustomEvent<WorkflowCanvasViewportRequestDetail>("ocelle-workflow-canvas-viewport-request", {
      detail: { viewport },
      bubbles: true,
      composed: true,
    }));
  }

  #completeReveal(
    actions: readonly NodeAction[],
    map: SVGSVGElement,
    contained: ReadonlySet<string>,
    eligible: ReadonlySet<string>,
  ): void {
    const pending = this.#pendingReveal;
    if (pending === null || this.shadowRoot?.activeElement !== pending.initiator) return;
    const navigator = pending.initiator.parentElement;
    if (navigator !== null && !isInsideCanvasClip(effectiveCanvasClip(navigator), pending.initiator.getBoundingClientRect())) {
      this.#pendingReveal = null;
      this.#focusNamed(map);
      if (this.shadowRoot.activeElement === pending.initiator) pending.initiator.blur();
      return;
    }
    const ready = workflowCanvasRevealTarget(pending, eligible, this.#generation, this.#focusEpoch);
    if (ready !== null) {
      this.#pendingReveal = null;
      actions.find(({ node }) => node.nodeId === ready)?.node.focus(withoutScroll);
    } else if (contained.has(pending.nodeId) && this.#raisedId !== pending.nodeId) {
      this.#raisedId = pending.nodeId;
      this.requestUpdate();
    }
  }
}

define("ocelle-workflow-canvas", OcelleWorkflowCanvas);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-workflow-canvas": OcelleWorkflowCanvas;
  }
}
