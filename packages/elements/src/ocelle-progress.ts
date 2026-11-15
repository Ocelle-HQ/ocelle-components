// `ocelle-progress` (013 FR-030 to FR-039; research.md R-05, R-06; data-model.md § `ocelle-progress`): a progress
// bar, determinate or indeterminate. The host is the progressbar through ElementInternals (R-05's B3): its role, its
// minimum 0, its effective maximum, its clamped current value (none while indeterminate), its value text while
// determinate and its name from `label`; a host `aria-label` overrides the name (the library's Host ARIA rule). The
// shadow root draws the track and the fill, and with `show-label` the label and the value text, both hidden from
// assistive technology since the host carries them. It has no slot, so content inside the element is neither shown
// nor exposed after upgrade.
//
// The determinate fill's inline size is written through the CSSOM in `updated()`, which the strict CSP does not
// govern, with no transition. The indeterminate mark rests as the still mark (30% to 70% of the track) and sweeps on
// top of it three times (R-06); the sweep belongs to a loading episode kept on the document under
// `Symbol.for("ocelle.progress.sweepStart")`, shared by every copy of the package: its start and the set of connected
// indeterminate bars. Each mark animation's `startTime` is set to the episode's start, so a bar inserted, replaced,
// re-shown or made indeterminate again during the episode continues its sweep, and after the window shows the still
// mark at once. When the last indeterminate bar leaves, the episode ends at the next animation frame if none has
// joined by then. Importing this module defines `ocelle-progress` and no other element.
import { LitElement, css, html, nothing } from "lit";
import { define } from "./define.ts";

/** The loading episode (R-06): its sweep start, and the connected indeterminate bars. Not public surface. */
interface Episode {
  start: CSSNumberish | null;
  readonly bars: Set<Element>;
}

const episodeKey = Symbol.for("ocelle.progress.sweepStart");

/** The document's loading episode, opened when there is none. */
function episode(): Episode {
  const holder = document as unknown as Record<symbol, Episode | undefined>;
  const open = holder[episodeKey] ?? { start: null, bars: new Set<Element>() };
  holder[episodeKey] = open;
  return open;
}

/**
 * A number from an attribute or a property (FR-032): a finite number, or a string holding one; anything else, an
 * empty or whitespace-only string included, is no number.
 */
function finite(raw: unknown): number | undefined {
  if (typeof raw === "string") return raw.trim() === "" ? undefined : finite(Number(raw));
  return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
}

/** The attribute converter of `value` and `max`: the attribute's finite number, or undefined. */
const numberAttribute = { fromAttribute: (value: string | null): number | undefined => finite(value) };

/** Gives an element's internals the progressbar role and its minimum, 0 (R-05). */
function progressbar(internals: ElementInternals): ElementInternals {
  internals.role = "progressbar";
  // Stryker disable next-line StringLiteral: equivalent, a progressbar's minimum is 0 when none is given, as Chromium's tree reports it; R-05 sets it all the same
  internals.ariaValueMin = "0";
  return internals;
}

/** Text that is not empty, or undefined (an unset, `null` or empty property). */
function text(raw: string | null | undefined): string | undefined {
  return raw === null || raw === "" ? undefined : raw;
}

/**
 * A progress bar: determinate with a `value`, indeterminate without one. Name it with `label`.
 *
 * @tagname ocelle-progress
 * @csspart track - The track, the full inline size of the bar.
 * @csspart fill - The filled part: the determinate extent from the inline start, or the indeterminate mark.
 * @csspart label - The visible label, with `show-label`.
 * @csspart value-text - The visible value text, with `show-label` while determinate, at the inline end of the label row.
 */
export class OcelleProgress extends LitElement {
  static override properties = {
    value: { attribute: "value", converter: numberAttribute },
    max: { attribute: "max", converter: numberAttribute },
    valueText: { attribute: "value-text" },
    label: {},
    showLabel: { type: Boolean, attribute: "show-label" },
    size: { reflect: true },
    ground: { reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--ocelle-space-2);
    }

    .track {
      position: relative;
      overflow: clip;
      order: 1;
      flex: 1 1 100%;
      min-inline-size: var(--ocelle-measure-cell);
      block-size: var(--ocelle-space-2);
      border-radius: var(--ocelle-radius-1);
      background-color: var(--ocelle-color-inset);
      box-shadow: 0 0 0 var(--ocelle-border-width) var(--ocelle-color-control-border);
    }

    .fill {
      position: absolute;
      inset-block: 0;
      inset-inline-start: 0;
      background-color: var(--ocelle-color-accent);
      box-shadow: inset 0 0 0 var(--ocelle-border-width) var(--ocelle-color-accent-strong);
    }

    .fill.indeterminate {
      inset-inline-start: 30%;
      inline-size: 40%;
      animation-name: ocelle-progress-sweep;
      animation-duration: calc(var(--ocelle-motion-base) * 7);
      animation-timing-function: var(--ocelle-easing-standard);
      animation-iteration-count: 3;
      animation-fill-mode: none;
    }

    :host(:dir(rtl)) .fill.indeterminate {
      animation-name: ocelle-progress-sweep-rtl;
    }

    @keyframes ocelle-progress-sweep {
      from {
        transform: translateX(-175%);
      }

      to {
        transform: translateX(175%);
      }
    }

    @keyframes ocelle-progress-sweep-rtl {
      from {
        transform: translateX(175%);
      }

      to {
        transform: translateX(-175%);
      }
    }

    :host([size="compact"]) .row {
      flex-wrap: nowrap;
      align-items: center;
    }

    :host([size="compact"]) .track {
      order: 0;
      flex: 1 1 0;
      block-size: var(--ocelle-space-1);
    }

    [part="label"],
    [part="value-text"] {
      font-size: var(--ocelle-font-size-sm);
      font-variant-numeric: var(--ocelle-figures);
    }

    [part="value-text"] {
      flex: none;
      margin-inline-start: auto;
    }

    @media (prefers-reduced-motion: reduce) {
      .fill.indeterminate {
        animation: none;
      }
    }

    @media not (forced-colors: active) {
      :host([ground="tinted"]) .track {
        box-shadow: 0 0 0 var(--ocelle-border-width) var(--ocelle-color-accent-strong);
      }

      [part="label"] {
        color: var(--ocelle-color-ink);
      }

      [part="value-text"] {
        color: var(--ocelle-color-ink-muted);
      }
    }

    @media (forced-colors: active) {
      .track {
        outline: var(--ocelle-border-width) solid CanvasText;
        background-color: Canvas;
      }

      .fill {
        forced-color-adjust: none;
        background-color: Highlight;
        box-shadow: none;
      }
    }
  `;

  /**
   * The current amount, from 0 to `max`: below 0 counts as 0, above `max` as `max`. Unset, `null`, an empty or
   * whitespace-only attribute, or a value that is not a finite number makes the bar indeterminate. Not reflected.
   *
   * @default undefined
   */
  declare value: number | undefined;

  /**
   * The maximum. Unset, not a finite number, or 0 or less counts as 100. Not reflected.
   *
   * @default undefined
   */
  declare max: number | undefined;

  /**
   * Words for the current value, for example "7 of 12", exposed (and shown with `show-label`) while the bar is
   * determinate, as given. Unset lets the platform announce the value. Not reflected.
   *
   * @default undefined
   */
  declare valueText: string | undefined;

  /**
   * The accessible name, as text (no rich label). A bar needs a name: set `label`, or a host `aria-label`, which
   * overrides it. To name a bar after a nearby heading, pass the heading's text. Not reflected.
   *
   * @default undefined
   */
  declare label: string | undefined;

  /**
   * Shows the label as text above the bar (beside it in compact), and the value text while determinate. Unset hides
   * both; the name and value are exposed either way.
   *
   * @default undefined
   */
  declare showLabel: boolean | undefined;

  /**
   * `compact` is a thin bar with the label beside it. Unset, or any other value, gives the default size. Reflected.
   *
   * @default undefined
   */
  declare size: "compact" | undefined;

  /**
   * `tinted` draws the track's boundary in the accent-strong colour, for a bar on an inset, accent-low, hover or state
   * ground. Unset is for the canvas, sheet, pane, panel, inspector and rail grounds. Reflected.
   *
   * @default undefined
   */
  declare ground: "tinted" | undefined;

  readonly #internals = progressbar(this.attachInternals());

  /** The effective maximum: `max` when it is a finite number above 0, else 100. */
  get #max(): number {
    const max = finite(this.max);
    return max !== undefined && max > 0 ? max : 100;
  }

  /** The effective value, clamped to [0, max], or undefined while indeterminate. */
  get #value(): number | undefined {
    const value = finite(this.value);
    return value === undefined ? undefined : Math.min(Math.max(value, 0), this.#max);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // A bar moved or re-inserted keeps its render and gets no update, so it joins the episode here.
    if (this.#value === undefined) this.#join();
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
    super.disconnectedCallback();
    this.#leave();
  }

  /** Joins the loading episode and puts every mark animation on its start. */
  #join(): void {
    const open = episode();
    open.bars.add(this);
    for (const animation of this.renderRoot.querySelector(".fill")?.getAnimations() ?? []) {
      open.start ??= document.timeline.currentTime;
      animation.startTime = open.start;
    }
  }

  /** Leaves the loading episode; the episode ends at the next frame if no indeterminate bar is connected by then. */
  #leave(): void {
    const open = episode();
    open.bars.delete(this);
    requestAnimationFrame(() => {
      if (open.bars.size > 0) return;
      const holder = document as unknown as Record<symbol, Episode | undefined>;
      // Stryker disable next-line ConditionalExpression: equivalent, the record captured at leaving is the document's until a frame callback deletes it, and no bar opens another between two callbacks of one frame
      if (holder[episodeKey] === open) Reflect.deleteProperty(holder, episodeKey);
    });
  }

  /**
   * A mark animation that starts (a re-show, a direction change, reduced motion ended) joins the episode; only the
   * indeterminate mark has an animation.
   */
  readonly #started = (): void => {
    this.#join();
  };

  protected override updated(): void {
    const value = this.#value;
    const max = this.#max;
    this.#internals.ariaValueMax = String(max);
    this.#internals.ariaValueNow = value === undefined ? null : String(value);
    // Stryker disable next-line ConditionalExpression,EqualityOperator: not observable, no read a test can make in Chromium exposes the value text (reviews/phase-3/spike.md; operator decision (a)); the visible value text's rule is proven in render()
    this.#internals.ariaValueText = value === undefined ? null : (text(this.valueText) ?? null);
    this.#internals.ariaLabel = text(this.label) ?? null;
    const fill = this.renderRoot.querySelector<HTMLElement>(".fill");
    if (value === undefined) {
      fill?.style.removeProperty("inline-size");
      if (this.isConnected) this.#join();
    } else {
      fill?.style.setProperty("inline-size", `${String((value / max) * 100)}%`);
      this.#leave();
    }
  }

  protected override render(): unknown {
    const determinate = this.#value !== undefined;
    const label = text(this.label);
    const valueText = text(this.valueText);
    const shown = this.showLabel === true;
    return html`<div class="row">
      ${shown && label !== undefined ? html`<span part="label" aria-hidden="true">${label}</span>` : nothing}
      <div part="track" class="track"><div part="fill" class=${determinate ? "fill" : "fill indeterminate"} @animationstart=${this.#started}></div></div>
      ${shown && determinate && valueText !== undefined ? html`<span part="value-text" aria-hidden="true">${valueText}</span>` : nothing}
    </div>`;
  }
}

define("ocelle-progress", OcelleProgress);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-progress": OcelleProgress;
  }
}
