// `ocelle-status-indicator` (018 spec US1, FR-010 to FR-016, FR-041; research.md R-02 to R-04; data-model.md
// § `ocelle-status-indicator`; plan decisions 3 and 4): a solid dot in the colour of its `tone`, with, while `pulse` is
// set, a ring around it that grows and fades three times and then stays invisible. The dot is a state mark, so it
// takes the pill radius (constitution II, plan decision 3); it is never animated, made transparent or resized. The
// pulse is CSS only (R-04): the ring is rendered only while `pulse` is set, so a run starts when the ring is created,
// when the element is connected or shown again, and when reduced motion ends, and nothing else restarts it, since no
// `animation-*` longhand depends on the tone or the theme. Its iteration lasts `--ocelle-motion-pulse` and its count is
// the literal 3 (operator decision Q1 (a) at the phase-1 recheck): 4.8 s by default, within WCAG 2.2.2's 5 s. The
// element's own `animation: none` under `prefers-reduced-motion: reduce` does not rely on the token's 0ms there. The
// name comes from `label` alone, through 005's `expose`: a trimmed non-empty label gives one `img` node with that name,
// none hides the element; a host `aria-label` is not read (plan decision 4). `tone` is an attribute-backed accessor
// (R-02): an unknown value stays in the attribute as written and the property reads `"neutral"`. Importing this module
// defines `ocelle-status-indicator` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { define } from "./define.ts";
import { accessibleName, expose } from "./naming.ts";
import { statusOf } from "./status.ts";

/**
 * A status dot in the colour of its tone, with an optional pulse ring around it, named by `label` or decorative.
 *
 * @tagname ocelle-status-indicator
 * @attr {"info" | "success" | "warning" | "danger" | "neutral"} tone - The status the dot shows, in its colour: `info`, `success`, `warning`, `danger` or `neutral`. Absent, empty or any other value shows `neutral` and stays in the attribute as written.
 * @csspart dot - The solid dot, never animated.
 * @csspart ring - The pulse ring around the dot, rendered only while `pulse` is set.
 */
export class OcelleStatusIndicator extends LitElement {
  static override properties = {
    label: { type: String, reflect: true },
    pulse: { type: Boolean, reflect: true },
  };

  /** `tone` is observed, not a Lit property: its accessor parses the attribute, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "tone"];
  }

  static override styles = css`
    :host {
      display: inline-block;
      vertical-align: middle;
      flex: none;
    }

    :host([hidden]) {
      display: none;
    }

    .dot {
      display: block;
      position: relative;
      inline-size: var(--ocelle-size-indicator);
      block-size: var(--ocelle-size-indicator);
      border-radius: var(--ocelle-radius-pill);
      background-color: currentColor;
    }

    .ring {
      position: absolute;
      inset: 0;
      box-sizing: border-box;
      border: var(--ocelle-border-width) solid currentColor;
      border-radius: var(--ocelle-radius-pill);
      opacity: 0;
      animation-name: ocelle-pulse;
      animation-duration: var(--ocelle-motion-pulse);
      animation-timing-function: var(--ocelle-easing-standard);
      animation-iteration-count: 3;
    }

    @keyframes ocelle-pulse {
      from {
        inset: 0;
        opacity: 1;
      }

      to {
        inset: calc(var(--ocelle-size-indicator) * -0.5);
        opacity: 0;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .ring {
        animation: none;
      }
    }

    @media not (forced-colors: active) {
      .status-info {
        color: var(--ocelle-color-info);
      }

      .status-success {
        color: var(--ocelle-color-success);
      }

      .status-warning {
        color: var(--ocelle-color-warning);
      }

      .status-danger {
        color: var(--ocelle-color-danger);
      }

      .status-neutral {
        color: var(--ocelle-color-neutral);
      }
    }

    @media (forced-colors: active) {
      .dot {
        forced-color-adjust: none;
        color: CanvasText;
      }
    }
  `;

  /**
   * The accessible name, trimmed: a non-empty one exposes the indicator as one image with that name; empty,
   * whitespace-only or unset hides it from the accessibility tree, and the host then places text naming the state
   * beside it. The only way to name it: a host `aria-label` is not read. Reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Runs the pulse: three growing, fading rings of `--ocelle-motion-pulse` each (4.8 s by default) when set, when the
   * indicator is connected or shown again with it set, and when reduced motion ends; then the dot stays solid. No
   * animation under `prefers-reduced-motion: reduce`. Reflected.
   *
   * @default undefined
   */
  declare pulse: boolean | undefined;

  readonly #internals = this.attachInternals();

  /**
   * The status the dot shows: the `tone` attribute when it is one of `info`, `success`, `warning`, `danger` and
   * `neutral`, else `neutral`. Setting it writes the attribute as given.
   *
   * @default "neutral"
   */
  get tone(): "info" | "success" | "warning" | "danger" | "neutral" {
    return statusOf(this.getAttribute("tone"));
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    if (name === "tone") this.requestUpdate();
  }

  /** Names the element from `label` alone: the host `aria-label` is never passed to `accessibleName` (plan decision 4). */
  protected override updated(): void {
    expose(this.#internals, accessibleName(this.label, null), true);
  }

  protected override render(): unknown {
    return html`<span part="dot" class="dot status-${this.tone}">${this.pulse === true ? html`<span part="ring" class="ring"></span>` : nothing}</span>`;
  }
}

define("ocelle-status-indicator", OcelleStatusIndicator);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-status-indicator": OcelleStatusIndicator;
  }
}
