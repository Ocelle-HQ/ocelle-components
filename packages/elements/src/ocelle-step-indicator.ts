import { LitElement, css, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";

/** A host-supplied step in display order. */
export interface StepIndicatorStep {
  readonly label: string;
  readonly state: "upcoming" | "current" | "completed";
}

/**
 * An ordered, non-interactive list of workflow steps with current and completed states.
 *
 * @tagname ocelle-step-indicator
 */
export class OcelleStepIndicator extends LitElement {
  static override properties = {
    steps: { attribute: false },
  };

  static override styles = css`
    :host {
      display: block;
      container-type: inline-size;
      min-inline-size: 0;
      color: var(--ocelle-color-ink);
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-sm);
      line-height: var(--ocelle-line-height-normal);
    }

    :host([hidden]) {
      display: none;
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: var(--ocelle-space-3);
      margin: 0;
      padding: var(--ocelle-space-1);
      list-style: none;
    }

    li {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: var(--ocelle-space-2);
      min-inline-size: 0;
      max-inline-size: 100%;
    }

    .label {
      margin-block-start: calc((var(--ocelle-size-step) - 1lh) / 2);
      min-inline-size: 0;
      overflow-wrap: anywhere;
    }

    .marker {
      box-sizing: border-box;
      display: grid;
      flex: none;
      place-items: center;
      min-inline-size: var(--ocelle-size-step);
      block-size: var(--ocelle-size-step);
      padding-inline: var(--ocelle-space-1);
      border: var(--ocelle-ring-step) solid var(--ocelle-color-ink-muted);
      border-radius: 50%;
      color: var(--ocelle-color-ink-muted);
      font-size: var(--ocelle-font-size-xs);
      font-weight: var(--ocelle-font-weight-medium);
      font-variant-numeric: var(--ocelle-figures);
      line-height: var(--ocelle-line-height-tight);
    }

    li[aria-current="step"] .marker {
      background: var(--ocelle-color-accent);
      color: var(--ocelle-color-on-accent);
      border-color: var(--ocelle-color-accent-strong);
      outline: var(--ocelle-border-width) solid var(--ocelle-color-accent-strong);
      outline-offset: var(--ocelle-border-width);
    }

    .check {
      inline-size: var(--ocelle-space-3);
      block-size: var(--ocelle-space-3);
      stroke: currentColor;
      stroke-width: var(--ocelle-ring-step);
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .completion {
      position: absolute;
      inline-size: var(--ocelle-size-visually-hidden);
      block-size: var(--ocelle-size-visually-hidden);
      overflow: hidden;
      opacity: 0;
      white-space: nowrap;
    }

    @container (inline-size <= 30rem) {
      li:not([aria-current]) .label {
        position: absolute;
        inline-size: var(--ocelle-size-visually-hidden);
        block-size: var(--ocelle-size-visually-hidden);
        overflow: hidden;
        opacity: 0;
        white-space: nowrap;
      }
    }

    @media (forced-colors: active) {
      .marker {
        color: CanvasText;
        border-color: CanvasText;
      }

      li[aria-current="step"] .marker {
        background: Canvas;
        color: CanvasText;
        border-color: CanvasText;
        outline-color: CanvasText;
      }
    }
  `;

  /** Ordered progress records. Replace the array to update the displayed steps. */
  declare steps: readonly StepIndicatorStep[];

  constructor() {
    super();
    this.steps = [];
  }

  protected override render() {
    if (this.steps.length === 0) return nothing;

    const current = this.steps.findIndex(({ state }) => state === "current");
    return html`
      <ol role="list">
        ${this.steps.map(({ label, state }, index) => {
          const completed = state === "completed";
          return html`
            <li role="listitem" aria-current=${ifDefined(index === current ? "step" : undefined)}>
              <span class="marker" aria-hidden="true">${completed
                ? html`<svg class="check" viewBox="0 0 12 12" fill="none" focusable="false"><path d="M2 6l3 3 5-6"></path></svg>`
                : index + 1}</span>
              <span class="label">${label}</span>
              ${completed ? html`<span class="completion">Completed</span>` : nothing}
            </li>
          `;
        })}
      </ol>
    `;
  }
}

define("ocelle-step-indicator", OcelleStepIndicator);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-step-indicator": OcelleStepIndicator;
  }
}
