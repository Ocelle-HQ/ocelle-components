// `ocelle-facts` (013 FR-003 to FR-014; research.md R-01 to R-03; data-model.md § `ocelle-facts`): a label and value
// sheet, one description list of its `ocelle-fact` children.
// - Structure (R-01): an open shadow root with manual slot assignment renders one `<dl part="list">` with, per pair in
//   source order, `<dt part="label">` (the fact's `label`, `lang` and `dir`) and `<dd part="value"><slot></slot></dd>`,
//   and assigns the fact to that slot after each render, so the consumer's content is never copied. With
//   `layout="grid"` each pair is grouped in a `<div class="item">`, a cell. A pair is an `ocelle-fact` child without
//   `hidden` and without `aria-hidden="true"`; other children are never assigned, so neither shown nor exposed. With no
//   pair nothing is rendered. One `MutationObserver` re-renders on a change of the children or of a child's `label`,
//   `hidden`, `aria-hidden`, `lang` or `dir`, and re-runs the measure pass on a change inside a pair (value text).
// - Layout (R-02): the measure pass alone owns the `<dl>`'s layout class. With `layout` unset it removes `stacked`,
//   reads the host's content-box inline size (so as laid out in two columns) and sets `stacked` below the threshold,
//   unconditionally; with `layout="grid"` it removes the column classes, reads the size as laid out in four columns and
//   sets `cols-1` below the threshold or `cols-2` below twice it; `columns` and `stacked` set the class from `layout`.
//   The threshold is read from two probes in a zero-size holder: the hook probe at `--ocelle-facts-stack-below`, or the
//   default probe when it measures 0. The pass runs after every render, on a change inside a pair, on a window resize,
//   and one animation frame after a callback of the `ResizeObserver` that observes the host and both probes, never
//   inside the callback, so a flip raises no `ResizeObserver` loop error (operator decision "(a) Defer + 2-frame
//   wait").
// - Look (R-03): the two-column tracks `fit-content(50%) minmax(0, 1fr)`, four equal `minmax(0, 1fr)` tracks in the
//   grid; labels in the small medium muted type, values at the value hooks' size and line height with tabular
//   figures, from tokens only; no ground, divider or border.
// Importing this module defines `ocelle-facts` and, as a container module, its item element `ocelle-fact`.
import { LitElement, css, html, nothing } from "lit";
import type { TemplateResult } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import "./ocelle-fact.ts";

/** Whether a child of the sheet is one of its pairs: an `ocelle-fact` neither `hidden` nor `aria-hidden="true"`. */
function isPair(child: Element): boolean {
  return child.localName === "ocelle-fact" && !child.hasAttribute("hidden") && child.getAttribute("aria-hidden") !== "true";
}

/** A pair's term: the fact's label, with its `lang` and `dir`. */
function term(fact: Element): TemplateResult {
  return html`<dt part="label" lang=${ifDefined(fact.getAttribute("lang") ?? undefined)} dir=${ifDefined(fact.getAttribute("dir") ?? undefined)}>${fact.getAttribute("label") ?? ""}</dt>`;
}

/**
 * A label and value sheet: one description list of its `ocelle-fact` children, in two columns, stacked or as a grid of
 * cells.
 *
 * @tagname ocelle-facts
 * @slot - The pairs, `ocelle-fact` elements, in source order. Other children, and facts with `hidden` or `aria-hidden="true"`, are not shown.
 * @csspart list - The description list grid. Do not set its columns: a `grid-template-columns` rule here overrides every layout.
 * @csspart label - Each term (label). Carries the fact's `lang` and `dir`.
 * @csspart value - Each definition (value) box.
 * @cssprop --ocelle-facts-stack-below - With `layout` unset, below this inline size (the sheet's own, as laid out in two columns) each value stacks under its label; with `layout="grid"`, below it the cells take one column and from twice it four (the sheet's own size as laid out in four columns). An absolute length; a percentage, 0 or an invalid value falls back to the default, 24rem from tokens (`calc(var(--ocelle-space-10) * 6)`).
 * @cssprop --ocelle-facts-value-size - The values' font size, `--ocelle-font-size-fact` by default. Set by `@ocelle/styles`' density hook (`--ocelle-font-size-sm` in a compact region).
 * @cssprop --ocelle-facts-value-line-height - The values' line height, `--ocelle-line-height-normal` by default. Set by `@ocelle/styles`' density hook (`--ocelle-line-height-compact` in a compact region).
 */
export class OcelleFacts extends LitElement {
  /** Manual slot assignment: the sheet assigns each fact to its definition's slot (internal). @ignore */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: "manual" };

  static override properties = {
    density: { type: String, reflect: true },
    layout: { type: String, reflect: true },
  };

  static override styles = css`
    :host {
      display: block;
      position: relative;
    }

    :host([hidden]) {
      display: none;
    }

    dl {
      display: grid;
      grid-template-columns: fit-content(50%) minmax(0, 1fr);
      column-gap: var(--ocelle-space-4);
      row-gap: var(--ocelle-space-3);
      margin: 0;
      font-family: var(--ocelle-font-sans);
    }

    :host([density="compact"]) dl {
      row-gap: var(--ocelle-space-1);
    }

    dt {
      margin: 0;
      min-inline-size: 0;
      font-size: var(--ocelle-font-size-sm);
      font-weight: var(--ocelle-font-weight-medium);
    }

    dd {
      margin: 0;
      min-inline-size: 0;
      font-size: var(--ocelle-facts-value-size, var(--ocelle-font-size-fact));
      font-weight: var(--ocelle-font-weight-regular);
      font-variant-numeric: var(--ocelle-figures);
      line-height: var(--ocelle-facts-value-line-height, var(--ocelle-line-height-normal));
    }

    dl.stacked {
      grid-template-columns: minmax(0, 1fr);
      row-gap: var(--ocelle-space-1);
    }

    dl.stacked dd:not(:last-child) {
      margin-block-end: calc(var(--ocelle-space-3) - var(--ocelle-space-1));
    }

    :host([density="compact"]) dl.stacked dd:not(:last-child) {
      margin-block-end: 0;
    }

    :host([layout="grid"]) dl {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
    }

    :host([layout="grid"]) dl.cols-2 {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    :host([layout="grid"]) dl.cols-1 {
      grid-template-columns: minmax(0, 1fr);
    }

    .item {
      min-inline-size: 0;
    }

    .item dt {
      margin-block-end: var(--ocelle-space-1);
    }

    .probes {
      position: absolute;
      inset-block-start: 0;
      inset-inline-start: 0;
      inline-size: 0;
      block-size: 0;
      overflow: visible;
      visibility: hidden;
    }

    .probe {
      position: absolute;
      block-size: 0;
      inline-size: var(--ocelle-facts-stack-below, calc(var(--ocelle-space-10) * 6));
    }

    .probe.default {
      inline-size: calc(var(--ocelle-space-10) * 6);
    }

    @media not (forced-colors: active) {
      dt {
        color: var(--ocelle-color-ink-muted);
      }

      dd {
        color: var(--ocelle-color-ink);
      }
    }

    @media (forced-colors: active) {
      dt,
      dd {
        color: CanvasText;
      }
    }
  `;

  /**
   * Row spacing: `compact` tightens the gaps for dense screens. Unset gives the default spacing. It does not change
   * the type: in a `data-ocelle-density="compact"` region the values take the region's scale. Reflected.
   *
   * @default undefined
   */
  declare density: "compact" | undefined;

  /**
   * `columns` keeps two columns and `stacked` one column at any size. `grid` shows each pair as a cell, label above
   * value, in four, two or one columns from the sheet's own inline size (four from twice `--ocelle-facts-stack-below`,
   * two from it, one below it). Unset, or any other value, switches automatically on the sheet's own two-column inline
   * size; set it for a sheet in a dialog, popover or other shrink-to-fit host, where a short sheet would otherwise
   * stack. Reflected.
   *
   * @default undefined
   */
  declare layout: "columns" | "stacked" | "grid" | undefined;

  readonly #mutations = new MutationObserver((records) => {
    this.#mutated(records);
  });

  /** The frame the observer's measure pass is scheduled in, or 0. */
  #frame = 0;

  readonly #resizes = new ResizeObserver(() => {
    // Stryker disable next-line ConditionalExpression: equivalent, the guard only coalesces the frames of one burst of callbacks; every extra pass gives the same classes (the pass is idempotent)
    if (this.#frame !== 0) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.#measure();
    });
  });

  readonly #observed = new WeakSet<Element>();

  readonly #resized = (): void => {
    this.#measure();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.#mutations.observe(this, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["label", "hidden", "aria-hidden", "lang", "dir"] });
    this.#resizes.observe(this);
    window.addEventListener("resize", this.#resized);
    this.requestUpdate();
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection only notifies reactive controllers, which this element has none of
    super.disconnectedCallback();
    // Stryker disable next-line CallExpression: equivalent, a kept observer re-renders or re-measures a sheet out of the document, which shows nothing, and observe() on reconnection replaces its options
    this.#mutations.disconnect();
    // Stryker disable next-line CallExpression: equivalent, a kept observer keeps the host and probes observed, so the forgotten probes below are observed again with no change
    this.#resizes.disconnect();
    for (const probe of this.renderRoot.querySelectorAll(".probe")) this.#observed.delete(probe);
    // Stryker disable next-line CallExpression: equivalent, a pending pass runs on a sheet out of the document, which shows nothing; a reconnection measures again
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    window.removeEventListener("resize", this.#resized);
  }

  /** A change of the children or of a child's attributes re-renders; one inside a pair re-runs the measure pass. */
  #mutated(records: readonly MutationRecord[]): void {
    // Stryker disable next-line BooleanLiteral: equivalent, a render runs the measure pass in updated() and re-renders the same pairs, so rendering for any record gives the same result as measuring
    let render = false;
    // Stryker disable next-line BooleanLiteral: equivalent, the observer never delivers an empty list, so one of the two flags is set by the loop
    let measure = false;
    for (const record of records) {
      // Stryker disable next-line ConditionalExpression: equivalent, rendering for a record inside a pair renders the same pairs and then measures, as the measure branch does
      if (record.type === "attributes" ? record.target.parentElement === this : record.target === this) render = true;
      else measure = true;
    }
    // Stryker disable next-line ConditionalExpression: equivalent, rendering when only a measure is needed renders the same pairs and then measures
    if (render) {
      this.requestUpdate();
      return;
    }
    // Stryker disable next-line ConditionalExpression: equivalent, the pass is idempotent, so an extra pass gives the same classes
    if (measure) this.#measure();
  }

  #pairs(): Element[] {
    return [...this.children].filter(isPair);
  }

  protected override render(): unknown {
    const pairs = this.#pairs();
    if (pairs.length === 0) return nothing;
    const rows =
      this.layout === "grid"
        ? pairs.map((fact) => html`<div class="item">${term(fact)}<dd part="value"><slot></slot></dd></div>`)
        : pairs.map((fact) => html`${term(fact)}<dd part="value"><slot></slot></dd>`);
    return html`<dl part="list">${rows}</dl><div class="probes" aria-hidden="true"><div class="probe"></div><div class="probe default"></div></div>`;
  }

  protected override updated(): void {
    const slots = this.renderRoot.querySelectorAll<HTMLSlotElement>("dd > slot");
    this.#pairs().forEach((fact, at) => {
      slots[at]?.assign(fact);
    });
    for (const probe of this.renderRoot.querySelectorAll(".probe")) {
      // Stryker disable next-line ConditionalExpression: equivalent, observing an observed probe again only queues one more initial callback, whose idempotent pass gives the same classes
      if (this.#observed.has(probe)) continue;
      // Stryker disable next-line CallExpression: equivalent, as above: probes observed again after every render only queue more idempotent passes
      this.#observed.add(probe);
      this.#resizes.observe(probe);
    }
    this.#measure();
  }

  /** The threshold in px: the hook probe's inline size, or the default probe's when the hook probe measures 0. */
  #threshold(): number {
    const [hook, fallback] = [...this.renderRoot.querySelectorAll(".probe")].map((probe) => probe.getBoundingClientRect().width);
    return hook !== undefined && hook > 0 && Number.isFinite(hook) ? hook : (fallback ?? 0);
  }

  /** The host's content-box inline size. */
  #inlineSize(): number {
    const style = getComputedStyle(this);
    const edges = ["padding-left", "padding-right", "border-left-width", "border-right-width"].reduce((sum, property) => sum + Number.parseFloat(style.getPropertyValue(property)), 0);
    return this.getBoundingClientRect().width - edges;
  }

  /** The measure pass (R-02): sets the `<dl>`'s layout class from `layout`, or from the measure and the threshold. */
  #measure(): void {
    const list = this.renderRoot.querySelector("dl");
    if (list === null) return;
    const classes = list.classList;
    if (this.layout === "grid") {
      classes.remove("stacked", "cols-2", "cols-1");
      const size = this.#inlineSize();
      const threshold = this.#threshold();
      classes.toggle("cols-1", size < threshold);
      classes.toggle("cols-2", size < 2 * threshold);
      return;
    }
    classes.remove("cols-2", "cols-1");
    if (this.layout === "columns" || this.layout === "stacked") {
      classes.toggle("stacked", this.layout === "stacked");
      return;
    }
    classes.remove("stacked");
    classes.toggle("stacked", this.#inlineSize() < this.#threshold());
  }
}

define("ocelle-facts", OcelleFacts);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-facts": OcelleFacts;
  }
}
