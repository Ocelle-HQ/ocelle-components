import { LitElement, css, html, nothing, svg, type PropertyValues } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { controlStyles } from "./control.ts";
import { define } from "./define.ts";
import "./ocelle-workflow-node.ts";
import type { OcelleWorkflowNode } from "./ocelle-workflow-node.ts";
import {
  isWorkflowCanvasEditCurrent,
  startWorkflowCanvasEdit,
  workflowCanvasEditRequest,
  type WorkflowCanvasEdit,
} from "./workflow-canvas-edit.ts";
import { projectWorkflowCanvasGraph, type WorkflowCanvasRelationship } from "./workflow-canvas-graph.ts";
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
  canvasClipping,
  canvasContourCrossesOutline,
  canvasFitViewport,
  canvasGestureFrame,
  canvasGesturePoint,
  canvasRevealViewport,
  canvasScreenInverse,
  canvasViewport,
  canvasViewportPoint,
  canvasZoomViewport,
  composedAncestors,
  isInsideCanvasClip,
  sameCanvasGestureFrame,
  type CanvasBounds,
  type CanvasClipMeasurement,
  type CanvasGestureFrame,
} from "./workflow-canvas-viewport.ts";
import type {
  WorkflowCanvasConnectionRequestDetail,
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasMode,
  WorkflowCanvasNode,
  WorkflowCanvasPoint,
  WorkflowCanvasPositionRequestDetail,
  WorkflowCanvasViewport,
  WorkflowCanvasViewportRequestDetail,
} from "./workflow-canvas-types.ts";

export type {
  WorkflowCanvasConnection,
  WorkflowCanvasConnectionRequestDetail,
  WorkflowCanvasGraph,
  WorkflowCanvasLayoutEntry,
  WorkflowCanvasMode,
  WorkflowCanvasNode,
  WorkflowCanvasOutcome,
  WorkflowCanvasPoint,
  WorkflowCanvasPositionRequestDetail,
  WorkflowCanvasViewport,
  WorkflowCanvasViewportRequestDetail,
} from "./workflow-canvas-types.ts";

const navigationKeys: ReadonlySet<string> = new Set<WorkflowCanvasNavigationKey>([
  "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End",
]);
const withoutScroll = { preventScroll: true };

interface CanvasReveal extends WorkflowCanvasPendingReveal {
  readonly initiator: HTMLButtonElement;
  readonly relationship: WorkflowCanvasRelationship | null;
}

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

interface ConnectionGesture {
  readonly pointerId: number;
  readonly map: SVGSVGElement;
  readonly handle: SVGRectElement;
  readonly frame: CanvasGestureFrame;
  readonly layout: readonly WorkflowCanvasLayoutEntry[];
  readonly view: WorkflowCanvasViewport;
  edit: WorkflowCanvasEdit;
  point: WorkflowCanvasPoint;
}

interface EditFocus {
  readonly sourceId: string | null;
  readonly order: readonly string[];
  readonly initiator: HTMLButtonElement | null;
  readonly previous: HTMLElement;
}

interface PresentationGesture {
  readonly pointerId: number;
  readonly map: SVGSVGElement;
  readonly frame: CanvasGestureFrame;
  readonly start: WorkflowCanvasPoint;
  readonly nodeId: string | null;
  readonly origin: WorkflowCanvasPoint;
  readonly view: WorkflowCanvasViewport;
  readonly suppliedView: WorkflowCanvasViewport;
  readonly layout: readonly WorkflowCanvasLayoutEntry[];
  readonly graph: WorkflowCanvasGraph;
}

/**
 * A host-controlled workflow map with native selection, navigation and named outcome inspection.
 *
 * @tagname ocelle-workflow-canvas
 * @fires {CustomEvent<{nodeId: string}>} ocelle-workflow-node-select - The original bubbling request from the native node action.
 * @fires {CustomEvent<WorkflowCanvasViewportRequestDetail>} ocelle-workflow-canvas-viewport-request - A proposed pan, zoom, fit or named reveal viewport.
 * @fires {CustomEvent<WorkflowCanvasPositionRequestDetail>} ocelle-workflow-canvas-position-request - The requested absolute graph position of a step in author mode.
 * @fires {CustomEvent<WorkflowCanvasConnectionRequestDetail>} ocelle-workflow-canvas-connection-request - A proposed connection edit using stable step and outcome identifiers.
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
        position: relative;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ocelle-space-2);
        padding: var(--ocelle-space-2);
        color: var(--ocelle-color-ink);
        background-color: var(--ocelle-color-sheet);
      }

      .navigator > .clip-probe, .connection-editor .clip-probe, .relationship > .clip-probe {
        position: absolute;
        inset: 0;
        inline-size: 100%;
        block-size: 100%;
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

      .commands {
        order: 1;
        margin-inline-start: auto;
      }

      summary,
      .command-panel button {
        cursor: pointer;
      }

      .command-panel {
        position: absolute;
        z-index: 1;
        inset-block-start: 100%;
        inset-inline-end: 0;
        box-sizing: border-box;
        display: flex;
        flex-wrap: wrap;
        gap: var(--ocelle-space-2);
        inline-size: calc(8 * var(--ocelle-target-min));
        max-inline-size: 100%;
        padding: var(--ocelle-space-2);
        border: var(--ocelle-border-width) solid var(--ocelle-color-control-border);
        background-color: var(--ocelle-color-sheet);
      }

      .commands:not([open]) > .command-panel {
        display: none;
      }

      .move-position {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ocelle-space-2);
      }

      .move-position input {
        inline-size: calc(2 * var(--ocelle-target-min));
      }

      .map {
        display: block;
        inline-size: 100%;
        flex: 1;
        min-block-size: 0;
        overflow: hidden;
        background-color: var(--ocelle-color-sheet);
        touch-action: none;
      }

      .relationships, .empty {
        box-sizing: border-box;
        margin: 0;
        padding: var(--ocelle-space-2);
        color: var(--ocelle-color-ink);
        background-color: var(--ocelle-color-sheet);
      }

      .relationships {
        display: flex;
        flex-wrap: wrap;
        flex: none;
        gap: var(--ocelle-space-2);
        max-block-size: calc(4 * var(--ocelle-target-min));
        overflow: auto;
        list-style: none;
      }

      .relationship {
        position: relative;
        display: flex;
        flex: 1 1 calc(6 * var(--ocelle-target-min));
        align-items: center;
        justify-content: space-between;
        gap: var(--ocelle-space-2);
        min-inline-size: 0;
        overflow-wrap: anywhere;
      }

      .edge {
        fill: none;
        stroke: var(--ocelle-color-control-border);
        stroke-width: var(--ocelle-border-width);
        pointer-events: none;
      }

      .move-handle, .outcome-handle {
        width: var(--ocelle-target-min);
        height: var(--ocelle-target-min);
        visibility: hidden;
        pointer-events: none;
        fill: var(--ocelle-color-hover-bg);
        stroke: var(--ocelle-color-control-border);
        stroke-width: var(--ocelle-border-width);
        cursor: grab;
      }

      .move-handle[data-ready], .outcome-handle[data-ready] {
        visibility: visible;
        pointer-events: all;
      }

      .move-handle:active, .outcome-handle:active {
        cursor: grabbing;
      }

      .outcome-handle {
        fill: var(--ocelle-color-sheet);
      }

      .outcome-mark, .connection-preview {
        fill: none;
        stroke: var(--ocelle-color-control-border);
        stroke-width: var(--ocelle-border-width);
        pointer-events: none;
      }

      .outcome-handle:not([data-ready]) + .outcome-mark {
        visibility: hidden;
      }

      .connection-editor, .connection-basis, .connection-choices {
        display: flex;
        flex-wrap: wrap;
        gap: var(--ocelle-space-2);
        box-sizing: border-box;
        min-inline-size: 0;
        inline-size: 100%;
      }

      .connection-basis > .connection-choices {
        inline-size: auto;
      }

      .command-panel:has(.connection-editor) {
        max-block-size: calc(8 * var(--ocelle-target-min));
        overflow: auto;
      }

      .connection-current {
        margin: 0;
        inline-size: 100%;
      }

      .connection-editor .control {
        position: relative;
        overflow-wrap: anywhere;
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
        .navigator, .map, .relationships, .empty {
          color: CanvasText;
          background-color: Canvas;
        }

        .control {
          border-color: ButtonText;
        }

        .edge, .outcome-mark, .connection-preview {
          stroke: CanvasText;
        }

        .command-panel, .move-handle, .outcome-handle {
          background-color: Canvas;
          border-color: ButtonText;
          fill: ButtonFace;
          stroke: ButtonText;
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
  #pendingReveal: CanvasReveal | null = null;
  #renderedViewport: WorkflowCanvasViewport | null = null;
  #retainedFocus: { readonly id: string; readonly order: readonly string[] } | null = null;
  #watched = new Set<Element>();
  #onGeometryChange = (): void => { this.#refresh(); };
  #scrollAncestors = new Set<Element>();
  #resize = new ResizeObserver(() => { this.#refresh(); });
  #intersection = new IntersectionObserver(() => { this.#refresh(); }, { threshold: [0, 1] });
  #clipAttributes = new MutationObserver(this.#onGeometryChange);
  #listeners: AbortController | undefined;
  #gesture: PresentationGesture | null = null;
  #preview: WorkflowCanvasPoint | null = null;
  #frameRequest: number | undefined;
  #connectionGesture: ConnectionGesture | null = null;
  #editorOpen = false;
  #editSourceId: string | null = null;
  #namedEdit: WorkflowCanvasEdit | null = null;
  #editInitiator: HTMLButtonElement | null = null;
  #retainedEditFocus: EditFocus | null = null;

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
    this.ownerDocument.addEventListener("keydown", this.#cancelOnEscape, { signal });
    this.ownerDocument.defaultView?.addEventListener("resize", this.#onGeometryChange, { signal });
    this.ownerDocument.defaultView?.addEventListener("scroll", this.#onGeometryChange, { signal });
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.#clearGesture();
    this.#listeners?.abort();
    this.#resize.disconnect();
    this.#intersection.disconnect();
    this.#clipAttributes.disconnect();
    this.#watched.clear();
    this.#scrollAncestors.clear();
    this.#clearConnectionGesture();
    this.#resetEditor(false);
    this.#retainedEditFocus = null;
    this.#pendingReveal = null;
    this.#retainedFocus = null;
  }

  protected override willUpdate(changes: PropertyValues<this>): void {
    const focusedId = this.#focusedAction()?.node.nodeId;
    if (focusedId !== undefined) {
      this.#retainedFocus ??= { id: focusedId, order: this.#order };
    }
    if (this.#gesture !== null && !this.#hasGestureBasis(this.#gesture)) this.#clearGesture();
    if (this.#connectionGesture !== null && !this.#hasConnectionBasis(this.#connectionGesture)) this.#clearConnectionGesture();
    if (this.#editorOpen && !this.#namedEditorCurrent()) this.#cancelNamedEdit();
    const previousControl = this.shadowRoot?.activeElement;
    if (changes.has("mode") && this.mode !== "author" && this.#namedId !== null
      && previousControl instanceof HTMLElement && previousControl.closest(".move-position") !== null) {
      this.#retainedFocus = { id: this.#namedId, order: this.#order };
      const commands = this.renderRoot.querySelector("details.commands");
      if (commands instanceof HTMLDetailsElement) commands.open = false;
    }
    if (changes.has("graph") || changes.has("layout")) {
      this.#projection = projectWorkflowCanvasGraph(this.graph, this.layout);
      const ids = new Set(this.#order);
      if (this.#raisedId !== null && !ids.has(this.#raisedId)) this.#raisedId = null;
      if (this.#namedId === null || !ids.has(this.#namedId)) {
        this.#namedId = this.#projection.nodes[0]?.id ?? null;
      }
      this.#recoverUnavailableFollow(previousControl);
      const pending = this.#pendingReveal;
      if (pending !== null) {
        const available = pending.relationship === null
          ? this.#projection.positions.has(pending.nodeId) : this.#canFollow(pending.relationship);
        if (!available) {
          this.#pendingReveal = null;
          if (pending.relationship === null && !this.#canRevealNamed && this.shadowRoot?.activeElement === pending.initiator) {
            this.#focusNamed(pending.initiator.parentElement, "select");
          }
        }
      }
      for (const id of this.#sizes.keys()) {
        if (!ids.has(id)) this.#sizes.delete(id);
      }
    }
  }

  protected override updated(): void {
    const picker = this.renderRoot.querySelector("select");
    // Apply the value after Lit has updated the native option list.
    if (picker !== null && this.#namedId !== null) picker.value = this.#namedId;
    const nodes = this.renderRoot.querySelectorAll("ocelle-workflow-node");
    void Promise.all([...nodes].map((node) => node.updateComplete)).then(this.#onGeometryChange);
  }

  #renderNode(node: WorkflowCanvasNode, context: string): unknown {
    const position = this.#displayPosition(node.id);
    const point = position === undefined ? { x: 0, y: 0 } : canvasViewportPoint(position, this.#displayViewport);
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
      <rect class="focus-bounds" aria-hidden="true"></rect>
      ${this.mode === "author" && position !== undefined ? svg`
        <rect class="move-handle" aria-hidden="true" data-node-id=${node.id}
          x=${point.x + (size?.width ?? 1)} y=${point.y}><title>Drag to move ${node.label}</title></rect>
        ${this.#renderOutcomeHandles(node, point, size)}` : nothing}`;
  }

  #renderOutcomeHandles(node: WorkflowCanvasNode, point: WorkflowCanvasPoint, size: NodeSize | undefined): unknown {
    // The measured face is four target widths, keeping the rendered handle geometry in local SVG units.
    const target = (size?.width ?? 1) / 4;
    const pitch = target + target / 8;
    return svg`<g class="outcome-handles" aria-hidden="true">
      ${repeat(node.outcomes, ({ id }) => id, ({ id, label }, index) => {
        const x = point.x + (index % 3) * pitch;
        const y = point.y + (size?.height ?? 1) + target / 8 + Math.floor(index / 3) * pitch;
        const middle = y + target / 2;
        const tip = x + 3 * target / 4;
        const side = tip - target / 6;
        return svg`<rect class="outcome-handle" aria-hidden="true" data-node-id=${node.id} data-outcome-id=${id} x=${x} y=${y}>
          <title>Connect ${label} (${id})</title>
        </rect><polyline class="outcome-mark" points=${`${String(x + target / 4)},${String(middle)} ${String(tip)},${String(middle)} ${String(side)},${String(middle - target / 6)} ${String(tip)},${String(middle)} ${String(side)},${String(middle + target / 6)}`}></polyline>`;
      })}
    </g>`;
  }

  #renderConnectionPreview(): unknown {
    const gesture = this.#connectionGesture;
    if (gesture === null) return nothing;
    const { x, y, width, height } = gesture.handle.getBBox();
    return svg`<path class="connection-preview" d=${`M ${String(x + width / 2)} ${String(y + height / 2)} L ${String(gesture.point.x)} ${String(gesture.point.y)}`}></path>`;
  }

  get #displayViewport(): WorkflowCanvasViewport {
    const view = canvasViewport(this.viewport);
    return this.#gesture?.nodeId === null && this.#preview !== null
      ? { ...this.#preview, scale: view.scale } : view;
  }

  #displayPosition(id: string): WorkflowCanvasPoint | undefined {
    return this.#gesture?.nodeId === id && this.#preview !== null ? this.#preview : this.#projection.positions.get(id);
  }

  #edgePath(sourceId: string, destinationId: string): string {
    const source = this.#displayPosition(sourceId);
    const destination = this.#displayPosition(destinationId);
    // Stryker disable next-line StringLiteral: drawable connections come from the same private map with both endpoints present.
    if (source === undefined || destination === undefined) return "";
    const view = this.#displayViewport;
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

  #renderCommands(nameContext: (node: WorkflowCanvasNode) => string): unknown {
    const canEdit = this.mode === "author" && this.#projection.nodes.some(({ outcomes }) => outcomes.length > 0);
    if (this.#projection.positions.size === 0 && !canEdit) return nothing;
    const id = this.#namedId;
    const named = id === null ? undefined : this.#projection.positions.get(id);
    const disclosure = this.renderRoot.querySelector<HTMLDetailsElement>("details.commands");
    return html`
      <details class="commands" @toggle=${this.#toggleCommands}>
        <summary class="control">Canvas controls</summary>
        ${disclosure?.open ? html`<div class="command-panel" role="group" aria-label="Canvas controls">
          ${this.#editorOpen ? nothing : html`
          <button type="button" class="control" value="left" @click=${this.#requestViewportCommand}>Pan left</button>
          <button type="button" class="control" value="right" @click=${this.#requestViewportCommand}>Pan right</button>
          <button type="button" class="control" value="up" @click=${this.#requestViewportCommand}>Pan up</button>
          <button type="button" class="control" value="down" @click=${this.#requestViewportCommand}>Pan down</button>
          <button type="button" class="control" value="in" @click=${this.#requestViewportCommand}>Zoom in</button>
          <button type="button" class="control" value="out" @click=${this.#requestViewportCommand}>Zoom out</button>
          <button type="button" class="control" value="fit" @click=${this.#requestViewportCommand}>Fit graph</button>
          ${this.mode === "author" ? repeat([named], () => id, () => html`
            <form class="move-position" data-node-id=${id ?? nothing} @submit=${this.#requestNamedPosition}>
              <label>X position <input class="control" name="x" type="number" step="any" required
                .value=${named === undefined ? nothing : String(named.x)} ?disabled=${named === undefined}></label>
              <label>Y position <input class="control" name="y" type="number" step="any" required
                .value=${named === undefined ? nothing : String(named.y)} ?disabled=${named === undefined}></label>
              <button class="control" type="submit" ?disabled=${named === undefined}>Move step</button>
            </form>`) : nothing}
          `}
          ${canEdit ? html`<button class="control connection-trigger" type="button"
            aria-expanded=${this.#editorOpen} @click=${this.#toggleEditor}>Edit connection</button>` : nothing}
          ${this.#editorOpen ? this.#renderConnectionEditor(nameContext) : nothing}
        </div>` : nothing}
      </details>`;
  }

  #renderConnectionEditor(nameContext: (node: WorkflowCanvasNode) => string): unknown {
    const nodes = this.#projection.nodes;
    const source = nodes.find(({ id }) => id === this.#editSourceId);
    const edit = this.#namedEdit;
    const sources = nodes.filter(({ outcomes }) => outcomes.length > 0);
    const outcomes = source?.outcomes ?? [];
    const destinations = edit?.destinationId == null ? nodes : nodes.filter(({ id }) => id === edit.destinationId);
    const current = nodes.find(({ id }) => id === edit?.currentDestinationId);
    const stepName = (node: WorkflowCanvasNode) => `${node.label} ${nameContext(node)}`.trim();
    return html`<div class="connection-editor" role="group" aria-label="Edit outcome connections">
      <div class="connection-basis">
        <div class="connection-choices" role="group" aria-label="Source step">
        ${repeat(source === undefined ? sources : [source], ({ id }) => id, (node) => html`
          <button class="control" type="button" data-source-id=${node.id} aria-pressed=${node === source}
            @click=${(event: MouseEvent) => { this.#chooseEditSource(node.id, event.currentTarget as HTMLButtonElement); }}>
            ${stepName(node)}
          </button>`)}
      </div>
      ${source === undefined ? nothing : html`
        <div class="connection-choices" role="group" aria-label="Named outcome">
          ${repeat(outcomes.filter(({ id }) => edit === null || edit.outcomeId === id), ({ id }) => id, ({ id, label }) => html`
            <button class="control" type="button" data-outcome-id=${id} aria-pressed=${edit?.outcomeId === id}
              @click=${() => { this.#chooseEditOutcome(id); }}>
              ${outcomes.filter((other) => other.label === label).length > 1 ? `${label} (${id})` : label}
            </button>`)}
        </div>`}
      </div>
      ${edit === null ? nothing : html`
        <p class="connection-current">${current === undefined ? "No connection" : `Connected to ${stepName(current)}`}</p>
        <div class="connection-choices" role="group" aria-label="Destination step">
          ${repeat(destinations, ({ id }) => id, (node) => html`
            <button class="control" type="button" data-destination-id=${node.id} aria-pressed=${node.id === edit.destinationId}
              @click=${() => { this.#chooseEditDestination(node.id); }}>${stepName(node)}</button>`)}
        </div>
        <button class="control" type="button" ?disabled=${edit.destinationId === null || edit.destinationId === edit.currentDestinationId}
          @click=${() => { this.#finishNamedEdit(false); }}>Apply connection</button>
        ${edit.currentDestinationId === null ? nothing : html`
          <button class="control" type="button" @click=${() => { this.#finishNamedEdit(true); }}>Disconnect connection</button>
        `}
      `}
    </div>`;
  }

  #renderRelationships(nameContext: (node: WorkflowCanvasNode) => string): unknown {
    const { nodes, positions, relationships } = this.#projection;
    if (nodes.length === 0) return html`<p class="empty" id="empty-label" role="status">No workflow steps</p>`;
    if (relationships.length === 0) return nothing;
    const name = (node: WorkflowCanvasNode) => {
      const context = nameContext(node);
      return context === "" ? node.label : `${node.label} ${context}`;
    };
    return html`<ul class="relationships" role="list" aria-label="Outcome connections" @scroll=${this.#onGeometryChange}>
      ${repeat(relationships, ({ source, outcome }) => JSON.stringify([source.id, outcome.id]), (relationship) => {
        const { source, outcome, destination } = relationship;
        const sourceName = name(source);
        const destinationName = name(destination);
        const repeated = source.outcomes.some(({ id, label }) => id !== outcome.id && label === outcome.label);
        const outcomeName = repeated ? `${outcome.label} (${outcome.id})` : outcome.label;
        const phrase = `${sourceName} · ${outcomeName} → ${destinationName}`;
        return html`<li class="relationship">
          <span>${phrase}</span>
          <button class="control" type="button" aria-label=${`Follow ${destinationName} from ${sourceName} via ${outcomeName}`}
            data-follow-source=${source.id} data-follow-outcome=${outcome.id}
            ?disabled=${!positions.has(destination.id)} @blur=${this.#loseRevealFocus}
            @click=${(event: MouseEvent) => { this.#revealNamed(event, destination.id, relationship); }}>Follow</button>
        </li>`;
      })}
    </ul>`;
  }

  protected override render(): unknown {
    this.#renderedViewport = this.viewport;
    const { nodes, drawableConnections } = this.#projection;
    const labelCounts = new Map<string, number>();
    for (const { label } of nodes) labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    const nameContext = (node: WorkflowCanvasNode) => (labelCounts.get(node.label) ?? 0) > 1
      ? `(${node.accountableRole}, ${node.kind}, ${node.id})` : "";
    const raised = nodes.find(({ id }) => id === this.#raisedId);
    const painted = raised === undefined ? nodes : [...nodes.filter((node) => node !== raised), raised];
    return html`
      <div class="canvas">
        <div class="navigator">
          ${this.#renderCommands(nameContext)}
          <label>Step
            <select class="control" aria-describedby=${nodes.length === 0 ? "empty-label" : nothing} @change=${this.#chooseNamed}>
              ${nodes.map((node) => html`<option value=${node.id}>
                ${node.label} ${nameContext(node)}
              </option>`)}
            </select>
          </label>
          <button class="control" type="button" ?disabled=${!this.#canRevealNamed}
            @click=${this.#revealNamed} @blur=${this.#loseRevealFocus}>Reveal step</button>
        </div>
        <svg class="map"
          @pointerdown=${this.#startGesture} @pointermove=${this.#moveGesture} @pointerup=${this.#finishGesture}
          @pointercancel=${this.#loseGesture} @lostpointercapture=${this.#loseGesture}>
          <g aria-hidden="true">
            ${drawableConnections.map(({ source, destination }) => svg`<path class="edge" d=${this.#edgePath(source.id, destination.id)}></path>`)}
            ${this.#renderConnectionPreview()}
          </g>
          ${repeat(painted, ({ id }) => id, (node) => this.#renderNode(node, nameContext(node)))}
        </svg>
        ${this.#renderRelationships(nameContext)}
      </div>`;
  }

  get #order(): readonly string[] {
    return this.#projection.nodes.map(({ id }) => id);
  }

  get #canRevealNamed(): boolean {
    return this.#namedId !== null && this.#projection.positions.has(this.#namedId);
  }

  #toggleCommands(): void {
    const commands = this.renderRoot.querySelector<HTMLDetailsElement>("details.commands");
    if (commands?.open === false) this.#resetEditor(false);
    this.requestUpdate();
  }

  #toggleEditor(event: MouseEvent): void {
    if (this.mode !== "author") return;
    this.#resetEditor(!this.#editorOpen);
    this.#editInitiator = event.currentTarget as HTMLButtonElement;
    this.requestUpdate();
  }

  #resetEditor(open: boolean): void {
    this.#editorOpen = open;
    this.#editSourceId = null;
    this.#namedEdit = null;
    this.#editInitiator = null;
  }

  #namedEditorCurrent(): boolean {
    if (this.mode !== "author") return false;
    if (this.#namedEdit !== null) return isWorkflowCanvasEditCurrent(this.graph, this.#namedEdit);
    return this.#editSourceId === null
      || this.graph.nodes.some(({ id, outcomes }) => id === this.#editSourceId && outcomes.length > 0);
  }

  #chooseEditSource(id: string, button: HTMLButtonElement): void {
    if (!this.#namedEditorCurrent() || !this.graph.nodes.some((node) => node.id === id && node.outcomes.length > 0)) return;
    this.#editSourceId = this.#editSourceId === id ? null : id;
    this.#editInitiator = this.#editSourceId === null ? this.renderRoot.querySelector("button.connection-trigger") : button;
    this.#namedEdit = null;
    this.requestUpdate();
  }

  #chooseEditOutcome(id: string): void {
    if (!this.#namedEditorCurrent() || this.#editSourceId === null) return;
    this.#namedEdit = this.#namedEdit?.outcomeId === id ? null : startWorkflowCanvasEdit(this.graph, this.#editSourceId, id);
    this.requestUpdate();
  }

  #chooseEditDestination(id: string): void {
    const edit = this.#namedEdit;
    if (edit === null || !this.#namedEditorCurrent() || !this.graph.nodes.some((node) => node.id === id)) return;
    this.#namedEdit = { ...edit, destinationId: edit.destinationId === id ? null : id };
    this.requestUpdate();
  }

  #cancelNamedEdit(): void {
    const previous = this.shadowRoot?.activeElement;
    if (previous instanceof HTMLElement && previous.closest(".connection-editor, .connection-trigger") !== null) {
      this.#retainedEditFocus = { sourceId: this.#editSourceId, order: this.#order, initiator: this.#editInitiator, previous };
    }
    const sourceExists = this.#editSourceId === null || this.graph.nodes.some(({ id }) => id === this.#editSourceId);
    const keepOpen = this.mode === "author" && sourceExists;
    if (!keepOpen) {
      const commands = this.renderRoot.querySelector<HTMLDetailsElement>("details.commands");
      if (commands !== null) commands.open = false;
    }
    this.#resetEditor(keepOpen);
    this.requestUpdate();
  }

  #finishNamedEdit(disconnect: boolean): void {
    const edit = this.#namedEdit;
    if (edit === null) return;
    if (!this.#namedEditorCurrent()) {
      this.#cancelNamedEdit();
      return;
    }
    const request = workflowCanvasEditRequest(edit, disconnect);
    if (request === null) return;
    const focus = this.shadowRoot?.activeElement;
    this.#resetEditor(false);
    this.#publishConnection(request);
    if (focus?.closest(".connection-editor") && this.shadowRoot?.activeElement === focus) {
      this.renderRoot.querySelector<HTMLButtonElement>("button.connection-trigger")?.focus(withoutScroll);
    }
    this.requestUpdate();
  }

  #publishConnection(request: WorkflowCanvasConnectionRequestDetail): void {
    this.dispatchEvent(new CustomEvent<WorkflowCanvasConnectionRequestDetail>("ocelle-workflow-canvas-connection-request", {
      detail: request,
      bubbles: true,
      composed: true,
    }));
  }

  #requestViewportCommand(event: MouseEvent): void {
    const button = event.currentTarget;
    const map = this.renderRoot.querySelector("svg.map");
    if (!(button instanceof HTMLButtonElement) || !(map instanceof SVGSVGElement)) return;
    const view = canvasViewport(this.viewport);
    let proposed: WorkflowCanvasViewport | null;
    switch (button.value) {
      case "left": proposed = { ...view, x: view.x - 64 }; break;
      case "right": proposed = { ...view, x: view.x + 64 }; break;
      case "up": proposed = { ...view, y: view.y - 64 }; break;
      case "down": proposed = { ...view, y: view.y + 64 }; break;
      case "in": proposed = canvasZoomViewport(view, map.clientWidth, map.clientHeight, 1.25); break;
      case "out": proposed = canvasZoomViewport(view, map.clientWidth, map.clientHeight, 0.8); break;
      case "fit": {
        proposed = this.#fitViewport(map);
        const disclosure = button.closest("details");
        if (disclosure !== null) {
          disclosure.querySelector("summary")?.focus(withoutScroll);
          disclosure.open = false;
        }
        break;
      }
      default: return;
    }
    if (proposed !== null) this.#emitViewport(proposed);
  }

  #fitViewport(map: SVGSVGElement): WorkflowCanvasViewport | null {
    const navigator = map.previousElementSibling;
    const padding = navigator === null ? 0 : Number.parseFloat(getComputedStyle(navigator).paddingLeft);
    const handleWidth = map.querySelector<SVGRectElement>(".move-handle")?.getBBox().width ?? 0;
    const loops = new Set<string>();
    for (const { source, destination } of this.#projection.drawableConnections) {
      if (source.id === destination.id) loops.add(source.id);
    }
    const footprints = [];
    for (const [id, point] of this.#projection.positions) {
      const size = this.#sizes.get(id);
      if (size === undefined) return null;
      const reach = Math.max(handleWidth, loops.has(id) ? size.height / 2 : 0);
      footprints.push({ ...point, width: size.width + reach, height: size.height });
    }
    return canvasFitViewport(footprints, map.clientWidth, map.clientHeight, padding);
  }

  #emitViewport(viewport: WorkflowCanvasViewport): void {
    if (canvasViewport(viewport) !== viewport) return;
    this.dispatchEvent(new CustomEvent<WorkflowCanvasViewportRequestDetail>("ocelle-workflow-canvas-viewport-request", {
      detail: { viewport },
      bubbles: true,
      composed: true,
    }));
  }

  #emitPosition(nodeId: string, position: WorkflowCanvasPoint): void {
    if (this.mode !== "author" || ![position.x, position.y].every(Number.isFinite)) return;
    this.dispatchEvent(new CustomEvent<WorkflowCanvasPositionRequestDetail>("ocelle-workflow-canvas-position-request", {
      detail: { nodeId, position },
      bubbles: true,
      composed: true,
    }));
  }

  #requestNamedPosition(event: SubmitEvent): void {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) return;
    // An enclosing native submit listener can change the graph and rerender the picker.
    const subject = this.graph.nodes.find(({ id }) => id === form.dataset.nodeId);
    if (subject === undefined) return;
    const supplied = this.layout.find(({ nodeId }) => nodeId === subject.id);
    if (supplied === undefined) return;
    const x = form.querySelector<HTMLInputElement>('input[name="x"]');
    const y = form.querySelector<HTMLInputElement>('input[name="y"]');
    if (x === null || y === null) return;
    const position = { x: x.valueAsNumber, y: y.valueAsNumber };
    // Restore the supplied values on rejection. A synchronous host acceptance replaces them at the next render.
    x.value = String(supplied.x);
    y.value = String(supplied.y);
    if (position.x !== supplied.x || position.y !== supplied.y) this.#emitPosition(subject.id, position);
  }

  #hasGestureBasis(gesture: PresentationGesture): boolean {
    return this.viewport === gesture.suppliedView && this.layout === gesture.layout && this.graph === gesture.graph
      && (gesture.nodeId === null || this.mode === "author");
  }

  #startGesture(event: PointerEvent): void {
    const map = event.currentTarget;
    const target = event.target;
    if (!(map instanceof SVGSVGElement) || this.#gesture !== null || this.#connectionGesture !== null || !event.isPrimary || event.button !== 0) return;
    if (target instanceof SVGRectElement && target.matches(".outcome-handle")) {
      this.#startConnectionGesture(map, target, event);
      return;
    }
    const view = canvasViewport(this.viewport);
    let nodeId: string | null = null;
    let origin: WorkflowCanvasPoint = view;
    if (target !== map) {
      if (this.mode !== "author" || !(target instanceof SVGRectElement) || !target.matches(".move-handle")) return;
      this.#refresh();
      if (!target.hasAttribute("data-ready")) return;
      const id = target.dataset.nodeId;
      const position = this.layout.find(({ nodeId }) => nodeId === id);
      if (id === undefined || position === undefined || !this.graph.nodes.some((node) => node.id === id)) return;
      nodeId = id;
      origin = position;
    }
    const frame = canvasGestureFrame(map);
    if (frame === null) return;
    map.setPointerCapture(event.pointerId);
    this.#gesture = {
      pointerId: event.pointerId, map, frame, start: canvasGesturePoint(frame, event), nodeId, origin, view,
      suppliedView: this.viewport, layout: this.layout, graph: this.graph,
    };
    this.#monitorGestureFrame();
  }

  #monitorGestureFrame = (): void => {
    this.#frameRequest = undefined;
    const connection = this.#connectionGesture;
    if (connection !== null) {
      if (!this.#hasConnectionBasis(connection) || !sameCanvasGestureFrame(connection.frame, connection.map)) {
        this.#clearConnectionGesture();
        return;
      }
    } else {
      const gesture = this.#gesture;
      if (gesture === null) return;
      if (!this.#hasGestureBasis(gesture) || !sameCanvasGestureFrame(gesture.frame, gesture.map)) {
        this.#clearGesture();
        return;
      }
    }
    this.#frameRequest = this.ownerDocument.defaultView?.requestAnimationFrame(this.#monitorGestureFrame);
  };

  #gestureProposal(event: PointerEvent, gesture: PresentationGesture): WorkflowCanvasPoint | null {
    if (!this.#hasGestureBasis(gesture) || !sameCanvasGestureFrame(gesture.frame, gesture.map)) return null;
    const current = canvasGesturePoint(gesture.frame, event);
    const scale = gesture.nodeId === null ? 1 : gesture.view.scale;
    return {
      x: gesture.origin.x + (current.x - gesture.start.x) / scale,
      y: gesture.origin.y + (current.y - gesture.start.y) / scale,
    };
  }

  #moveGesture(event: PointerEvent): void {
    const connection = this.#connectionGesture;
    if (connection?.pointerId === event.pointerId) {
      if (!this.#hasConnectionBasis(connection) || !sameCanvasGestureFrame(connection.frame, connection.map)) {
        this.#clearConnectionGesture();
        return;
      }
      connection.point = canvasGesturePoint(connection.frame, event);
      connection.edit = { ...connection.edit, destinationId: this.#connectionTarget(event) };
      this.requestUpdate();
      return;
    }
    const gesture = this.#gesture;
    if (gesture?.pointerId !== event.pointerId) return;
    const proposal = this.#gestureProposal(event, gesture);
    if (proposal === null) {
      this.#clearGesture();
      return;
    }
    this.#preview = proposal;
    this.requestUpdate();
  }

  #finishGesture(event: PointerEvent): void {
    const connection = this.#connectionGesture;
    if (connection?.pointerId === event.pointerId) {
      this.#finishConnectionGesture(connection, event);
      return;
    }
    const gesture = this.#gesture;
    if (gesture?.pointerId !== event.pointerId) return;
    const proposal = this.#gestureProposal(event, gesture);
    this.#clearGesture();
    if (proposal === null || (proposal.x === gesture.origin.x && proposal.y === gesture.origin.y)) return;
    if (gesture.nodeId === null) this.#emitViewport({ ...proposal, scale: gesture.view.scale });
    else this.#emitPosition(gesture.nodeId, proposal);
  }

  #loseGesture(event: PointerEvent): void {
    if (this.#gesture?.pointerId === event.pointerId) this.#clearGesture();
    if (this.#connectionGesture?.pointerId === event.pointerId) this.#clearConnectionGesture();
  }

  #cancelOnEscape = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    const active = this.shadowRoot?.activeElement;
    const named = this.#editorOpen && Boolean(active?.closest(".connection-editor, .connection-trigger"));
    if (this.#gesture === null && this.#connectionGesture === null && !named) return;
    event.preventDefault();
    this.#clearGesture();
    this.#clearConnectionGesture();
    if (named) this.#cancelNamedEdit();
  };

  #clearGesture(): void {
    const gesture = this.#gesture;
    if (gesture === null) return;
    this.#gesture = null;
    this.#preview = null;
    this.#releaseCapturedPointer(gesture.map, gesture.pointerId);
  }

  #releaseCapturedPointer(map: SVGSVGElement, pointerId: number): void {
    if (this.#frameRequest !== undefined) {
      this.ownerDocument.defaultView?.cancelAnimationFrame(this.#frameRequest);
      this.#frameRequest = undefined;
    }
    this.requestUpdate();
    if (map.hasPointerCapture(pointerId)) map.releasePointerCapture(pointerId);
  }

  #startConnectionGesture(map: SVGSVGElement, handle: SVGRectElement, event: PointerEvent): void {
    if (this.mode !== "author") return;
    this.#refresh();
    const { nodeId, outcomeId } = handle.dataset;
    if (!handle.hasAttribute("data-ready") || nodeId === undefined || outcomeId === undefined) return;
    const edit = startWorkflowCanvasEdit(this.graph, nodeId, outcomeId);
    const frame = canvasGestureFrame(map);
    if (edit === null || frame === null) return;
    event.preventDefault();
    map.setPointerCapture(event.pointerId);
    this.#connectionGesture = {
      pointerId: event.pointerId, map, handle, frame, edit,
      layout: this.layout, view: this.viewport, point: canvasGesturePoint(frame, event),
    };
    this.requestUpdate();
    this.#monitorGestureFrame();
  }

  #hasConnectionBasis(gesture: ConnectionGesture): boolean {
    return this.mode === "author" && this.viewport === gesture.view && this.layout === gesture.layout
      && gesture.handle.isConnected && gesture.handle.hasAttribute("data-ready") && isWorkflowCanvasEditCurrent(this.graph, gesture.edit);
  }

  #connectionTarget(event: PointerEvent): string | null {
    const hit = this.shadowRoot?.elementFromPoint(event.clientX, event.clientY);
    const node = hit?.closest("ocelle-workflow-node") ?? hit?.closest("foreignObject")?.querySelector("ocelle-workflow-node");
    const action = this.#action(node);
    // A host update can remove a destination before the rendered card disappears.
    return action?.face.inert === false && this.graph.nodes.some(({ id }) => id === action.node.nodeId)
      ? action.node.nodeId : null;
  }

  #finishConnectionGesture(gesture: ConnectionGesture, event: PointerEvent): void {
    this.#refresh();
    this.#clearConnectionGesture();
    const valid = this.#hasConnectionBasis(gesture) && sameCanvasGestureFrame(gesture.frame, gesture.map);
    const edit = { ...gesture.edit, destinationId: valid ? this.#connectionTarget(event) : null };
    const request = workflowCanvasEditRequest(edit, false);
    if (request !== null) this.#publishConnection(request);
  }

  #clearConnectionGesture(): void {
    const gesture = this.#connectionGesture;
    if (gesture === null) return;
    this.#connectionGesture = null;
    this.#releaseCapturedPointer(gesture.map, gesture.pointerId);
  }

  #action(target: EventTarget | null | undefined): NodeAction | undefined {
    // A standalone node may already own the tag when the browser aggregate loads.
    if (!(target instanceof HTMLElement) || target.localName !== "ocelle-workflow-node" || target.getRootNode() !== this.renderRoot) return;
    const node = target as OcelleWorkflowNode;
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
    // The managed workflow node's native button is its only focusable control.
    return this.#action(this.shadowRoot?.activeElement);
  }

  #eventAction(event: Event): NodeAction | undefined {
    const path = event.composedPath();
    for (const target of path) {
      const action = this.#action(target);
      if (action !== undefined && path.includes(action.button)) return action;
    }
  }

  #focusAction(action: NodeAction | undefined): void {
    if (action === undefined) return;
    // A live measurement can expose this action before the observers clear its wrapper.
    this.#enableAction(action.face);
    action.button.focus(withoutScroll);
  }

  #enableAction(face: HTMLElement): void {
    face.inert = false;
    face.removeAttribute("aria-hidden");
  }

  #measureEligibility(
    actions: readonly NodeAction[],
    map: SVGSVGElement,
  ): { contained: Set<string>; eligible: Set<string>; bounds: ReadonlyMap<string, CanvasBounds> } {
    return this.#withLiveClip(map, (clip) => {
      const contained = new Set<string>();
      const eligible = new Set<string>();
      const transform = map.getScreenCTM();
      const painted = actions.filter(({ node }) => this.#projection.positions.has(node.nodeId))
        .map(({ node, face, button, focusBounds }) => ({
          id: node.nodeId,
          outline: canvasActionBounds(button, transform),
          card: face.getBoundingClientRect(),
          handles: this.#outcomePaintOrder(focusBounds),
        }));
      const bounds = new Map(painted.map(({ id, outline }) => [id, outline]));
      const panel = map.previousElementSibling?.querySelector("details[open] .command-panel")?.getBoundingClientRect();
      const covering: CanvasBounds[] = panel === undefined ? [] : [panel];
      const covered = (outline: CanvasBounds) => covering.some((box) => canvasBoundsOverlap(outline, box));
      // Walk from front to back so only actually ready later handles cover earlier targets.
      for (const { id, outline, card, handles } of painted.reverse()) {
        if (clip.contains(outline)) {
          contained.add(id);
          if (!covered(outline)) eligible.add(id);
        }
        for (const handle of handles) {
          const handleBounds = handle.getBoundingClientRect();
          const ready = eligible.has(id) && clip.contains(handleBounds) && !covered(handleBounds);
          handle.toggleAttribute("data-ready", ready);
          if (ready) {
            // SVG hit testing includes the stroke outside the square handle's fill bounds.
            const { left, right, top, bottom, width, height } = handleBounds;
            const stroke = Number.parseFloat(getComputedStyle(handle).strokeWidth) / (2 * handle.getBBox().width);
            const x = width * stroke;
            const y = height * stroke;
            covering.push({ left: left - x, right: right + x, top: top - y, bottom: bottom + y });
          }
        }
        covering.push(card);
      }
      return { contained, eligible, bounds };
    });
  }

  #outcomePaintOrder(focusBounds: SVGRectElement): readonly SVGRectElement[] {
    const move = focusBounds.nextElementSibling;
    if (!(move instanceof SVGRectElement) || !move.matches(".move-handle")) return [];
    const outcomes = move.nextElementSibling?.querySelectorAll<SVGRectElement>(".outcome-handle") ?? [];
    return [...outcomes].reverse().concat(move);
  }

  #withLiveClip<T>(surface: Element, read: (clip: CanvasClipMeasurement) => T): T {
    const { bounds, contours, ellipses, hasConvexClip } = canvasClipping(surface);
    const probe = hasConvexClip || contours.length > 0 ? this.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "rect") : null;
    let temporary: Element | null = probe;
    if (probe !== null) {
      probe.setAttribute("width", "100%");
      probe.setAttribute("height", "100%");
      probe.setAttribute("pointer-events", "all");
      if (surface instanceof SVGSVGElement) {
        surface.append(probe);
      } else {
        const overlay = this.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
        overlay.classList.add("clip-probe");
        overlay.append(probe);
        surface.append(overlay);
        temporary = overlay;
      }
    }
    try {
      // A supported outline crosses no resolved straight edge and every corner hits the browser's painted clip.
      return read({
        bounds,
        contours,
        ellipses,
        contains: (outline) => isInsideCanvasClip(bounds, outline)
          && !contours.some((contour) => canvasContourCrossesOutline(contour, outline))
          && (probe === null || this.#clipCornersHit(probe, outline)),
      });
    } finally {
      // The target exists only during the synchronous measurement and is removed before paint.
      temporary?.remove();
    }
  }

  #clipCornersHit(probe: Element, { left, top, right, bottom }: CanvasBounds): boolean {
    // Insets, ellipses and circles are convex. A separate check handles the interior of straight polygons.
    // The probe sits outside the inert node wrappers and above the map's independently checked paint order.
    const root = this.shadowRoot;
    const corners = [[left, top], [right, top], [left, bottom], [right, bottom]] as const;
    return corners.every(([x, y]) => root?.elementFromPoint(x, y) === probe);
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
      if (eligible.has(node.nodeId)) this.#enableAction(face);
      else face.inert = true;
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
      if (recovery === undefined) this.#focusNamed(map.previousElementSibling);
      else recovery.node.focus(withoutScroll);
    }
    for (const { face } of actions) {
      if (face.inert && !face.hasAttribute("aria-hidden")) face.setAttribute("aria-hidden", "true");
    }
    this.#recoverNamedEditFocus(map, actions, eligible);
    this.#completeReveal(actions, contained, eligible);
  }

  #recoverNamedEditFocus(map: SVGSVGElement, actions: readonly NodeAction[], eligible: ReadonlySet<string>): void {
    const recovery = this.#retainedEditFocus;
    this.#retainedEditFocus = null;
    if (recovery === null || (!this.#documentFocusIsUnclaimed() && this.shadowRoot?.activeElement !== recovery.previous)) return;
    const { sourceId, initiator } = recovery;
    if (initiator?.isConnected && !initiator.disabled
      && this.#withLiveClip(initiator, (clip) => clip.contains(initiator.getBoundingClientRect()))) {
      initiator.focus(withoutScroll);
      return;
    }
    const id = sourceId === null || eligible.has(sourceId) ? sourceId : recoverWorkflowCanvasFocus(recovery.order, eligible, sourceId);
    const action = actions.find(({ node }) => node.nodeId === id);
    if (action === undefined) this.#focusNamed(map.previousElementSibling);
    else action.node.focus(withoutScroll);
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
    // activeElement can fall back to the body or document element when neither has focus.
    return !this.ownerDocument.activeElement?.matches(":focus");
  }

  #watchGeometry(map: SVGSVGElement, actions: readonly NodeAction[]): void {
    const signal = this.#listeners?.signal;
    if (signal === undefined) return;
    const ancestors = new Set(composedAncestors(map));
    for (const element of this.#scrollAncestors) {
      if (!ancestors.has(element)) {
        this.#clipAttributes.disconnect();
        element.removeEventListener("scroll", this.#onGeometryChange);
      }
    }
    for (const element of ancestors) {
      // A corner can change without changing the IntersectionObserver's rectangular intersection.
      this.#clipAttributes.observe(element, { attributes: true });
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

  #focusNamed(navigator: Element | null, controls = ":scope > label select, :scope > button"): void {
    if (navigator === null) return;
    const visible = this.#withLiveClip(navigator, (clip) => [...navigator.querySelectorAll(controls)].find(
      (control) => !control.matches(":disabled") && clip.contains(control.getBoundingClientRect()),
    ));
    if (visible instanceof HTMLElement) visible.focus(withoutScroll);
    else this.#focusedAction()?.button.blur();
  }

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
    if (this.#eventAction(event) !== undefined) queueMicrotask(this.#onGeometryChange);
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
    this.#focusAction(actions.find(({ node }) => node.nodeId === next));
  };

  #chooseNamed(event: Event): void {
    if (!(event.currentTarget instanceof HTMLSelectElement)) return;
    this.#namedId = event.currentTarget.value;
    this.requestUpdate();
  }

  #loseRevealFocus(): void {
    // Stryker disable next-line AssignmentOperator: either direction is equivalent because the pending reveal is discarded immediately.
    this.#focusEpoch += 1;
    this.#pendingReveal = null;
  }

  #relationshipDestination(sourceId: string, outcomeId: string): string | null {
    return startWorkflowCanvasEdit(this.graph, sourceId, outcomeId)?.currentDestinationId ?? null;
  }

  #recoverUnavailableFollow(control: Element | null | undefined): void {
    if (!(control instanceof HTMLButtonElement)) return;
    const { followSource, followOutcome } = control.dataset;
    if (followSource === undefined || followOutcome === undefined) return;
    const id = this.#relationshipDestination(followSource, followOutcome);
    if (id !== null && this.#projection.positions.has(id)) return;
    this.#focusNamed(this.renderRoot.querySelector(".navigator"));
    control.blur();
  }

  #canFollow({ source, outcome, destination }: WorkflowCanvasRelationship): boolean {
    const position = this.#projection.positions.get(destination.id);
    return position !== undefined && this.#relationshipDestination(source.id, outcome.id) === destination.id
      && this.layout.some(({ nodeId, x, y }) => nodeId === destination.id && x === position.x && y === position.y);
  }

  #revealNamed(event: MouseEvent, id = this.#namedId, relationship: WorkflowCanvasRelationship | null = null): void {
    const initiator = event.currentTarget;
    if (!(initiator instanceof HTMLButtonElement)) return;
    const position = id === null ? undefined : this.#projection.positions.get(id);
    const map = this.renderRoot.querySelector("svg");
    if (id === null || position === undefined || map === null) return;
    if (relationship !== null && !this.#canFollow(relationship)) return;
    initiator.focus(withoutScroll);
    // Focus listeners can synchronously replace the graph, layout or focused control.
    if (relationship !== null && this.shadowRoot?.activeElement !== initiator) return;
    // Stryker disable next-line UpdateOperator: either direction stores the same current value in the sole pending reveal.
    const pending: CanvasReveal = { nodeId: id, generation: ++this.#generation, focusEpoch: this.#focusEpoch, initiator, relationship };
    this.#pendingReveal = pending;
    this.#continueReveal(pending, map);
  }

  #continueReveal(pending: CanvasReveal, map: SVGSVGElement): void {
    const { nodeId: id, relationship, initiator } = pending;
    if (relationship !== null) {
      if (this.#pendingReveal !== pending || this.shadowRoot?.activeElement !== initiator || !this.#canFollow(relationship)) return;
      if (this.#renderedViewport !== this.viewport) {
        void this.updateComplete.then(() => { this.#continueReveal(pending, map); });
        return;
      }
    }
    const actions = this.#actions();
    const { contained, eligible, bounds } = this.#measureEligibility(actions, map);
    if (contained.has(id)) {
      this.#completeReveal(actions, contained, eligible);
      return;
    }
    const action = actions.find(({ node }) => node.nodeId === id)?.button;
    const visible = [...bounds].flatMap(([nodeId, outline]) => eligible.has(nodeId) ? [outline] : []);
    const viewport = action === undefined ? null : this.#withLiveClip(map,
      (clip) => canvasRevealViewport(canvasViewport(this.viewport), map, action, clip, visible),
    );
    if (viewport === null) {
      this.#pendingReveal = null;
      return;
    }
    this.#emitViewport(viewport);
  }

  #completeReveal(
    actions: readonly NodeAction[],
    contained: ReadonlySet<string>,
    eligible: ReadonlySet<string>,
  ): void {
    const pending = this.#pendingReveal;
    if (pending === null || this.shadowRoot?.activeElement !== pending.initiator) return;
    if (pending.relationship !== null && (this.#renderedViewport !== this.viewport || !this.#canFollow(pending.relationship))) return;
    const navigator = pending.initiator.parentElement;
    if (navigator !== null && !this.#withLiveClip(navigator, (clip) => clip.contains(pending.initiator.getBoundingClientRect()))) {
      this.#pendingReveal = null;
      this.#focusNamed(pending.relationship === null ? navigator : this.renderRoot.querySelector(".navigator"));
      pending.initiator.blur();
      return;
    }
    const ready = workflowCanvasRevealTarget(pending, eligible, this.#generation, this.#focusEpoch);
    if (ready !== null) {
      this.#pendingReveal = null;
      this.#focusAction(actions.find(({ node }) => node.nodeId === ready));
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
