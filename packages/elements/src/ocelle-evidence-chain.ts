// `ocelle-evidence-chain` (019 FR-001, FR-016, FR-030 to FR-036; contracts/ocelle-evidence-chain.md; research.md R-08,
// R-09, R-12; reviews/phase-3/spike.md): an evidence chain, one ordered list of its `ocelle-evidence-step` children.
// - Structure (R-08): an open shadow root with manual slot assignment renders, with one or more visible steps (direct
//   children with the item tag, neither `hidden` nor `aria-hidden="true"`, in source order), one `<ol part="list"
//   role="list">` with a `<li role="listitem">` per step holding, for a default step, the decorative marker (`.marker`,
//   aria-hidden, the step's ordinal inside), a decorative `.connector` span (aria-hidden) and a slot the step is
//   assigned to after each render. A chip step's `<li>` has class `chip` and no marker. With no visible step nothing is
//   rendered. The explicit roles keep the list semantics in WebKit, which drops an unstyled list's role.
// - Name (R-09): `resolveName(host aria-label, label)` of the overflow-region module, on the `<ol>`; a blank host
//   `aria-label` counts as absent.
// - Ordinals (SPEC-3-02): a default step's 1-based position among the visible steps, chip steps counted.
// - Line ends (R-12): from one `ResizeObserver` on the `<ol>` and every `<li>`, observed after each render (which
//   delivers once), each `<li>` whose next `<li>` starts lower, and the last, gets `data-line-end`, which hides its
//   connector. The connector lies in the `<li>`'s trailing padding, which exists either way, so the write changes no
//   size and the observer does not loop.
// - Look (R-12; spike § 2): a wrapping flex row, `--ocelle-space-3` between lines; each `<li>` reserves a
//   `--ocelle-size-step` line box, the marker a round `--ocelle-size-step` box ringed by `--ocelle-ring-step` in
//   `--ocelle-color-ink-muted`, the ordinal in `xs` medium tabular figures; a default step's first line centred on the
//   marker by a block-start margin; a chip drawn by the container (`::slotted([variant="chip"])`) as a
//   `--ocelle-radius-2` outline with no fill, its box rule outside the variant block so forced colours keep it; every
//   connector on the marker's centre line, a `--ocelle-border-width` border in `--ocelle-color-rule-strong`
//   (decorative). Every position is logical, so `dir="rtl"` mirrors it; in forced colours every mark is `CanvasText`.
// Importing this module defines `ocelle-evidence-chain` and, as a container module, its item element
// `ocelle-evidence-step`.
import { LitElement, css, html, nothing } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "./define.ts";
import "./ocelle-evidence-step.ts";
import { resolveName } from "./overflow-region.ts";

/** Whether a child of the chain is one of its visible steps: an `ocelle-evidence-step` neither `hidden` nor `aria-hidden="true"`. */
function isStep(child: Element): boolean {
  return child.localName === "ocelle-evidence-step" && !child.hasAttribute("hidden") && child.getAttribute("aria-hidden") !== "true";
}

/**
 * An evidence chain: one ordered list of its `ocelle-evidence-step` children, in source order, each default step with
 * a numbered marker, joined by connectors on each line and wrapping onto further lines in a narrow container.
 *
 * @tagname ocelle-evidence-chain
 * @slot - The steps, `ocelle-evidence-step` elements, in source order. Other children, and steps with `hidden` or `aria-hidden="true"`, are not shown.
 * @csspart list - The ordered list.
 */
export class OcelleEvidenceChain extends LitElement {
  /** Manual slot assignment: the chain assigns each step to its item's slot (internal). @ignore */
  static override shadowRootOptions: ShadowRootInit = { ...LitElement.shadowRootOptions, slotAssignment: "manual" };

  static override properties = {
    // Stryker disable next-line ObjectLiteral: equivalent, {} gives Lit's default options, which are type String's (attribute "label", the default converter, not reflected)
    label: { type: String },
  };

  /** `aria-label` is observed, not a property: a non-blank host `aria-label` names the list, so its change updates the element. */
  static override get observedAttributes(): string[] {
    return [...super.observedAttributes, "aria-label"];
  }

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    ol {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      row-gap: var(--ocelle-space-3);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      position: relative;
      display: flex;
      align-items: flex-start;
      column-gap: var(--ocelle-space-2);
      box-sizing: border-box;
      min-inline-size: 0;
      max-inline-size: 100%;
      min-block-size: var(--ocelle-size-step);
      padding-inline-end: var(--ocelle-space-5);
    }

    li.chip {
      align-items: center;
    }

    .marker {
      display: flex;
      flex: none;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      inline-size: var(--ocelle-size-step);
      block-size: var(--ocelle-size-step);
      border: var(--ocelle-ring-step) solid var(--ocelle-color-ink-muted);
      border-radius: 50%;
      color: var(--ocelle-color-ink-muted);
      font-family: var(--ocelle-font-sans);
      font-size: var(--ocelle-font-size-xs);
      font-weight: var(--ocelle-font-weight-medium);
      font-variant-numeric: var(--ocelle-figures);
      line-height: var(--ocelle-line-height-tight);
    }

    .connector {
      position: absolute;
      inset-block-start: calc(var(--ocelle-size-step) / 2 - var(--ocelle-border-width) / 2);
      inset-inline-end: var(--ocelle-space-1);
      inline-size: calc(var(--ocelle-space-5) - 2 * var(--ocelle-space-1));
      block-size: 0;
      border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule-strong);
    }

    li[data-line-end] > .connector {
      display: none;
    }

    ::slotted(*) {
      min-inline-size: 0;
      font-family: var(--ocelle-font-sans);
    }

    ::slotted(ocelle-evidence-step:not([variant="chip"])) {
      margin-block-start: calc((var(--ocelle-size-step) - 1lh) / 2);
      font-size: var(--ocelle-font-size-sm);
      line-height: var(--ocelle-line-height-normal);
    }

    ::slotted(ocelle-evidence-step[variant="chip"]) {
      box-sizing: border-box;
      padding-block: 0;
      padding-inline: var(--ocelle-space-2);
      border: var(--ocelle-ring-step) solid;
      border-radius: var(--ocelle-radius-2);
      font-size: var(--ocelle-font-size-xs);
      line-height: var(--ocelle-line-height-normal);
    }

    @media not (forced-colors: active) {
      ::slotted(ocelle-evidence-step) {
        color: var(--ocelle-color-ink);
      }

      ::slotted(ocelle-evidence-step[variant="chip"]) {
        border-color: var(--ocelle-color-ink-muted);
      }
    }

    @media (forced-colors: active) {
      .marker,
      .connector {
        border-color: CanvasText;
      }

      .marker,
      ::slotted(ocelle-evidence-step) {
        color: CanvasText;
      }

      ::slotted(ocelle-evidence-step[variant="chip"]) {
        border-color: CanvasText;
      }
    }
  `;

  /**
   * Names the list when the host has no non-blank `aria-label`; not shown. Trimmed; empty or white space counts as
   * absent.
   *
   * @default undefined
   */
  declare label: string | undefined;

  readonly #mutations = new MutationObserver(() => {
    this.requestUpdate();
  });

  readonly #sizes = new ResizeObserver(() => {
    this.#lineEnds();
  });

  override connectedCallback(): void {
    super.connectedCallback();
    this.#mutations.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "aria-hidden", "variant"] });
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection notifies reactive controllers, which this element has none of, and calls setConnected(false) on its child part, which reaches only async directives: its ifDefined is synchronous
    super.disconnectedCallback();
    // Stryker disable next-line CallExpression: equivalent, a kept observer re-renders a chain out of the document, which shows nothing, and observe() on reconnection replaces its options
    this.#mutations.disconnect();
    this.#sizes.disconnect();
  }

  override attributeChangedCallback(name: string, old: string | null, value: string | null): void {
    super.attributeChangedCallback(name, old, value);
    // Stryker disable next-line ConditionalExpression: equivalent for the `true` variant, an update for another attribute, with no property changed, renders the same list
    if (name === "aria-label") this.requestUpdate();
  }

  #steps(): Element[] {
    return [...this.children].filter(isStep);
  }

  /** Marks each `<li>` whose next `<li>` starts on a lower line, and the last, with `data-line-end`. */
  #lineEnds(): void {
    // Items on one flex line share their block start exactly (`align-items: flex-start`), so equality decides.
    const tops = [...this.renderRoot.querySelectorAll("ol > li")].map((item) => [item, item.getBoundingClientRect().top] as const);
    tops.forEach(([item, top], at) => {
      const next = tops[at + 1];
      item.toggleAttribute("data-line-end", next?.[1] !== top);
    });
  }

  protected override render(): unknown {
    const steps = this.#steps();
    if (steps.length === 0) return nothing;
    const name = resolveName(this.getAttribute("aria-label"), this.label);
    const items = steps.map((step, at) => {
      const chip = step.getAttribute("variant") === "chip";
      const marker = chip ? nothing : html`<span class="marker" aria-hidden="true">${at + 1}</span>`;
      return html`<li role="listitem" class=${ifDefined(chip ? "chip" : undefined)}>${marker}<span class="connector" aria-hidden="true"></span><slot></slot></li>`;
    });
    return html`<ol part="list" role="list" aria-label=${ifDefined(name)}>${items}</ol>`;
  }

  protected override updated(): void {
    const slots = this.renderRoot.querySelectorAll<HTMLSlotElement>("li > slot");
    this.#steps().forEach((step, at) => {
      slots[at]?.assign(step);
    });
    // Observing a target, anew or again, delivers its size once after the next layout, so the line ends are decided
    // after every render, in the observer's callback, and again whenever the list or an item changes size.
    const list = this.renderRoot.querySelector("ol");
    if (list !== null) {
      this.#sizes.observe(list);
      for (const item of list.children) this.#sizes.observe(item);
    }
  }
}

define("ocelle-evidence-chain", OcelleEvidenceChain);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-evidence-chain": OcelleEvidenceChain;
  }
}
