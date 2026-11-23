import { LitElement, css, html, nothing } from "lit";
import { controlStyles, resolveIds } from "./control.ts";
import { define } from "./define.ts";

const hostContext = ["aria-label", "aria-labelledby", "aria-describedby", "aria-current"];

/**
 * A workflow step with one native selection action and descriptive kind, role and outcomes.
 *
 * @tagname ocelle-workflow-node
 * @attr {string} aria-label - Additional name context if no host naming references resolve.
 * @attr {string} aria-labelledby - Space-separated IDs in the host tree supplying additional name context.
 * @attr {string} aria-describedby - Space-separated IDs in the host tree supplying additional description.
 * @attr {string} aria-current - An optional current-step state on the action.
 * @slot status - Optional noninteractive status shown with the step details and included in the action's description.
 * @csspart control - The native selection button.
 * @fires {CustomEvent<{nodeId: string}>} ocelle-workflow-node-select - A noncancelable, bubbling and composed request from the node during native activation.
 */
export class OcelleWorkflowNode extends LitElement {
  static override properties = {
    nodeId: { type: String, attribute: "node-id" },
    // Stryker disable next-line ObjectLiteral: equivalent, {} observes "label" with the same string conversion, change detection and no reflection in Lit
    label: { type: String },
    // Stryker disable next-line ObjectLiteral: equivalent, {} observes "kind" with the same string conversion, change detection and no reflection in Lit
    kind: { type: String },
    accountableRole: { type: String, attribute: "accountable-role" },
    outcomes: { attribute: false },
    selected: { type: Boolean, reflect: true },
    waiting: { type: Boolean, reflect: true },
    invalid: { type: Boolean, reflect: true },
    selectionTabIndex: { attribute: false },
  };

  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, ...hostContext];
  }

  static override styles = [
    css`
      :host {
        display: block;
        box-sizing: border-box;
        min-inline-size: 0;
        padding: var(--ocelle-space-4);
        border: var(--ocelle-border-width) solid var(--ocelle-color-rule);
        border-radius: var(--ocelle-radius-row);
        font-family: var(--ocelle-font-sans);
        font-size: var(--ocelle-font-size-sm);
        line-height: var(--ocelle-line-height-normal);
      }

      :host([hidden]) {
        display: none;
      }

      .control {
        box-sizing: border-box;
        inline-size: 100%;
        min-inline-size: var(--ocelle-target-min);
        min-block-size: var(--ocelle-target-min);
        padding: var(--ocelle-space-2) var(--ocelle-space-3);
        border: var(--ocelle-border-width) solid;
        border-radius: var(--ocelle-radius-2);
        font: inherit;
        font-weight: var(--ocelle-font-weight-strong);
        text-align: start;
        overflow-wrap: anywhere;
        cursor: pointer;
      }

      .details {
        margin-block-start: var(--ocelle-space-3);
        overflow-wrap: anywhere;
      }

      dl {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: var(--ocelle-space-1) var(--ocelle-space-3);
        margin: 0;
      }

      dt, .outcome-label, .state {
        font-weight: var(--ocelle-font-weight-strong);
      }

      dd {
        margin: 0;
      }

      .outcome-label, .state {
        margin-block-start: var(--ocelle-space-2);
      }

      ul {
        margin-block: 0;
        padding-inline-start: var(--ocelle-space-5);
      }

      slot[name="status"]::slotted(:not([hidden]):not(:empty)) {
        display: block;
        margin-block-start: var(--ocelle-space-2);
        overflow-wrap: anywhere;
      }

      @media not (forced-colors: active) {
        :host, .control {
          background-color: var(--ocelle-color-sheet);
          color: var(--ocelle-color-ink);
        }

        .control {
          border-color: var(--ocelle-color-control-border);
        }

        .control:hover, .control[aria-pressed="true"] {
          border-color: var(--ocelle-color-accent-strong);
        }

        .control:hover {
          background-color: var(--ocelle-color-hover-bg);
        }

        .control[aria-pressed="true"] {
          background-color: var(--ocelle-color-accent-low);
        }
      }

      @media (forced-colors: active) {
        :host {
          background-color: Canvas;
          color: CanvasText;
        }

        .control {
          background-color: ButtonFace;
        }
      }
    `,
    controlStyles,
  ];

  /** The host's stable step identifier. An empty identifier does not request selection. @default "" */
  declare nodeId: string;

  /** The step's visible title and first part of its accessible name. @default "" */
  declare label: string;

  /** The displayed workflow step kind. @default "" */
  declare kind: string;

  /** The displayed accountable role. @default "" */
  declare accountableRole: string;

  /** Descriptive outcome labels, in the order supplied by the host. @default [] */
  declare outcomes: readonly string[];

  /** Whether the host has selected this step. @default false */
  declare selected: boolean;

  /** Whether the step is waiting for a run to continue. @default false */
  declare waiting: boolean;

  /** Whether the host identifies a validation problem with the step. @default false */
  declare invalid: boolean;

  /** Set to -1 to exclude the native action from Tab navigation while keeping direct focus. @default 0 */
  declare selectionTabIndex: 0 | -1;

  constructor() {
    super();
    this.nodeId = "";
    this.label = "";
    this.kind = "";
    this.accountableRole = "";
    this.outcomes = [];
    this.selected = false;
    this.waiting = false;
    this.invalid = false;
    this.selectionTabIndex = 0;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.requestUpdate();
  }

  override attributeChangedCallback(name: string, previous: string | null, value: string | null): void {
    if (hostContext.includes(name)) this.requestUpdate();
    else super.attributeChangedCallback(name, previous, value);
  }

  /** Forwards focus to the selection action after render. */
  override focus(options?: FocusOptions): void {
    this.shadowRoot?.querySelector("button")?.focus(options);
  }

  #requestSelection(): void {
    if (!this.nodeId) return;
    this.dispatchEvent(new CustomEvent("ocelle-workflow-node-select", {
      bubbles: true,
      composed: true,
      detail: { nodeId: this.nodeId },
    }));
  }

  protected override render(): unknown {
    return html`
      <button class="control" part="control" type="button" tabindex=${this.selectionTabIndex === -1 ? -1 : 0} aria-pressed=${String(this.selected)} aria-current=${this.getAttribute("aria-current") ?? nothing} @click=${this.#requestSelection}>
        <span id="title">${this.label}</span>
      </button>
      <span id="name-context" hidden>${this.getAttribute("aria-label")?.trim()}</span>
      <div id="details" class="details">
        <dl><dt>Kind</dt><dd>${this.kind}</dd><dt>Role</dt><dd>${this.accountableRole}</dd></dl>
        ${this.outcomes.length === 0 ? nothing : html`
          <div class="outcome-label">Outcomes</div>
          <ul>${this.outcomes.map((outcome) => html`<li>${outcome}</li>`)}</ul>
        `}
        ${this.selected ? html`<div class="state">Selected</div>` : nothing}
        ${this.waiting ? html`<div class="state">Waiting</div>` : nothing}
        ${this.invalid ? html`<div class="state">Invalid</div>` : nothing}
        <slot name="status"></slot>
      </div>
    `;
  }

  protected override updated(): void {
    const naming = resolveIds(this, this.getAttribute("aria-labelledby") ?? undefined);
    if (naming.length === 0) naming.push(...this.renderRoot.querySelectorAll("#name-context:not(:empty)"));
    for (const action of this.renderRoot.querySelectorAll("button")) {
      action.ariaLabelledByElements = [...this.renderRoot.querySelectorAll("#title"), ...naming];
      action.ariaDescribedByElements = [
        ...this.renderRoot.querySelectorAll("#details"),
        ...resolveIds(this, this.getAttribute("aria-describedby") ?? undefined),
      ];
    }
  }
}

define("ocelle-workflow-node", OcelleWorkflowNode);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-workflow-node": OcelleWorkflowNode;
  }
}
