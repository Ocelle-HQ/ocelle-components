// `ocelle-list-detail` (009 FR-022 to FR-030; contracts/elements.md § `ocelle-list-detail`; research.md R-11 to R-14;
// data-model.md § list-detail): a list beside its detail, with an optional inspector, that collapses to one column by
// its own measured inline size or when the host sets `narrow`. Its shadow root holds two zero-height `aria-hidden`
// blocks, observed by one `ResizeObserver`: the probe, whose content box is the host's content box and gives the
// element's inline size with the host's inline padding and borders added, and the edge box, out of flow and 0 px wide,
// which inherits those padding and borders, so its border box changes when they change alone and it adds nothing to the
// element's intrinsic sizes (reviews/phase-4/round-1-fixes.md R1-03, round-2-fixes.md R2-02). A block-size change of
// the element notifies neither, so content a slotted element appends from its own `ResizeObserver` brings no loop
// message (reviews/phase-4/spike.md). After each scheduled pass the element measures its border box afresh, so
// `remeasure()` also re-chooses the tier (round-2-fixes.md R2-01). After the two blocks, one grid with an `aria-hidden`
// sizer and three pane wrappers, one per slot. The `inspector` slot is always rendered, so its `slotchange` shows an
// inspector added after the first render (R-11); whether an inspector is present is read from the host's light-DOM
// children, so the first layout knows it. Focus is read from the element's own root, the document or a host component's shadow root. The tier
// is chosen from the measured size, the thresholds and `narrow` (src/tiers.ts) and rendered as the grid's `data-tier`;
// the panes a tier hides are `display: none`. The intrinsic sizes come from the measurement pass
// (src/list-detail-measure.ts), whose figures are the sizer's inline size and the grid's minimum; the panes are
// contained in inline size, so the shown layout never feeds them (R-13). When a tier or `detail-open` change hides the
// pane that holds focus, the shown pane's wrapper takes it by script, with a temporary `tabindex="-1"` removed on its
// `focusout`, and shows the inset ring (R-14); at the first render the same rule applies. The borders are outside any
// forced-colours query, so they stay in `CanvasText`. The element adds no role and no name and emits no event.
// Importing this module defines `ocelle-list-detail` and no other element.
import { LitElement, css, html } from "lit";
import type { PropertyValues } from "lit";
import { define } from "./define.ts";
import { ListDetailMeasure } from "./list-detail-measure.ts";
import { chooseTier, publishedCollapse, publishedInspectorCollapse, shownPanes, threshold } from "./tiers.ts";
import type { Pane, Tier } from "./tiers.ts";

/** The pane of each slot name; a child with another slot name is in no pane. */
const paneOfSlot: Readonly<Record<string, Pane | undefined>> = { "": "detail", list: "list", inspector: "inspector" };

/** The properties whose change runs the pass synchronously before the tier is applied (research.md R-13). */
const hostSet = ["narrow", "detailOpen", "collapseBelow", "inspectorBelow"] as const;

/**
 * A list beside its detail, with an optional inspector, that shows one pane at a time below its threshold.
 *
 * @tagname ocelle-list-detail
 * @slot list - The list pane.
 * @slot - The detail pane.
 * @slot inspector - The optional inspector pane.
 */
export class OcelleListDetail extends LitElement {
  static override properties = {
    collapseBelow: { type: String, attribute: "collapse-below" },
    inspectorBelow: { type: String, attribute: "inspector-below" },
    narrow: { type: Boolean, reflect: true },
    detailOpen: { type: Boolean, reflect: true, attribute: "detail-open" },
  };

  static override styles = css`
    :host {
      display: block;
    }

    :host([hidden]) {
      display: none;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-areas: "sizer" "list" "detail" "inspector";
    }

    .probe {
      block-size: 0;
    }

    .edges {
      position: absolute;
      box-sizing: content-box;
      inline-size: 0;
      block-size: 0;
      padding-inline: inherit;
      border-inline-width: inherit;
      border-inline-style: inherit;
    }

    .sizer {
      display: block;
      grid-area: sizer;
      block-size: 0;
      max-inline-size: 100%;
    }

    .pane {
      box-sizing: border-box;
      min-inline-size: 0;
      contain: inline-size;
    }

    .list {
      grid-area: list;
    }

    .detail {
      grid-area: detail;
    }

    .inspector {
      grid-area: inspector;
      display: none;
    }

    .grid[data-inspector] .inspector {
      display: block;
      border-block-start: var(--ocelle-border-width) solid var(--ocelle-color-rule);
    }

    .grid[data-tier="one"]:not([data-open]) .detail,
    .grid[data-tier="one"]:not([data-open]) .inspector,
    .grid[data-tier="one"][data-open] .list {
      display: none;
    }

    .grid[data-tier="two"],
    .grid[data-tier="max"] {
      grid-template-columns: var(--ocelle-list-track-width) 1fr;
      grid-template-areas: "sizer sizer" "list detail" "list inspector";
    }

    .grid[data-tier="three"],
    .grid[data-tier="max"][data-inspector] {
      grid-template-columns: var(--ocelle-list-track-width) 1fr var(--ocelle-shell-inspector-width);
      grid-template-areas: "sizer sizer sizer" "list detail inspector";
    }

    .grid[data-tier="two"] .detail,
    .grid[data-tier="two"] .inspector,
    .grid[data-tier="three"] .detail,
    .grid[data-tier="three"] .inspector,
    .grid[data-tier="max"] .detail,
    .grid[data-tier="max"] .inspector {
      border-inline-start: var(--ocelle-border-width) solid var(--ocelle-color-rule);
    }

    .grid[data-tier="three"] .inspector,
    .grid[data-tier="max"] .inspector {
      border-block-start: none;
    }

    .grid[data-tier="max"] {
      inline-size: max-content;
      min-inline-size: 0;
    }

    .grid[data-tier="min"] {
      display: block;
      inline-size: min-content;
      min-inline-size: 0;
    }

    .grid[data-tier="max"] .pane,
    .grid[data-tier="min"] .pane {
      contain: none;
    }

    .grid[data-tier="max"] .sizer,
    .grid[data-tier="min"] .sizer {
      display: none;
    }

    .pane:focus-visible {
      outline: var(--ocelle-focus-width) solid var(--ocelle-color-focus);
      outline-offset: calc(var(--ocelle-focus-width) * -1);
    }

    @media (forced-colors: active) {
      .pane:focus-visible {
        outline-color: Highlight;
      }
    }
  `;

  /**
   * One column below this length: digits with an optional fraction and `px`, `rem` or `em`, or a unitless `0`, after
   * trimming ASCII whitespace; any other value counts as absent, and the default is `--ocelle-list-detail-collapse` as
   * computed on the element. Not reflected.
   *
   * @default undefined
   */
  declare collapseBelow: string | undefined;

  /**
   * The inspector stacks under the detail below this length, with the grammar of `collapse-below`; the default is
   * `--ocelle-list-detail-inspector-collapse` as computed on the element. Not reflected.
   *
   * @default undefined
   */
  declare inspectorBelow: string | undefined;

  /**
   * Forces the one-column layout whatever the element's measured size. Reflected.
   *
   * @default false
   */
  declare narrow: boolean;

  /**
   * In one column, shows the detail pane, with the inspector stacked under it, instead of the list; in two or three
   * columns it has no effect. Reflected.
   *
   * @default false
   */
  declare detailOpen: boolean;

  readonly #measure = new ListDetailMeasure(
    () => this.renderRoot.querySelector<HTMLElement>(".grid"),
    () => {
      this.#remeasured();
    },
  );
  // The probe's content box is the host's content box; the edge box's border box is the host's inline padding and
  // borders, and only tells of a change of them, whose computed values are added (a percentage padding resolves against
  // another box in the edge box, its containing block).
  readonly #resize = new ResizeObserver((entries) => {
    const probe = entries.find((entry) => entry.target.classList.contains("probe"))?.contentBoxSize[0]?.inlineSize;
    if (probe !== undefined) this.#content = probe;
    this.#resized();
  });
  #measured = 0;
  #content = 0;
  // Stryker disable next-line BooleanLiteral: equivalent, connectedCallback sets it from the host's light-DOM children before the first update
  #hasInspector = false;
  #tier: Tier = "one";
  #shown: readonly Pane[] = ["list", "detail", "inspector"];
  #focusTo: Pane | undefined;

  constructor() {
    super();
    this.narrow = false;
    this.detailOpen = false;
  }

  /**
   * Requests a measurement of the intrinsic sizes for the next animation frame, coalesced with any other trigger, for
   * a change the element cannot see: content a slotted element renders in its own shadow root, an attribute-only
   * change, or an image or a font loading. In that frame it also re-chooses the tier from a fresh measurement of the
   * element's border box, as after a percentage inline padding that changes with the host's container. On an element
   * that is not in a document, never connected or removed, it does nothing.
   */
  public remeasure(): void {
    // Not in a document, the element runs no pass: never connected it has no shadow root yet, and removed it would
    // measure a detached grid (reviews/phase-4/round-3.md R3-02).
    if (!this.isConnected) return;
    this.#measure.schedule();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Before the first render the shadow root holds no probe and no slot yet; firstUpdated observes them then. Whether an
    // inspector is present is read from the light-DOM children, so the first layout knows it.
    this.#observeShadow();
  }

  override disconnectedCallback(): void {
    // Stryker disable next-line CallExpression: equivalent, Lit's own disconnection only tells controllers and async directives, and the element has neither
    super.disconnectedCallback();
    // Stryker disable next-line CallExpression: equivalent, a detached probe reports no size to choose a tier from, and connecting observes it again
    this.#resize.disconnect();
    this.#measure.disconnect();
  }

  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    if (root instanceof ShadowRoot) root.adoptedStyleSheets = [...root.adoptedStyleSheets, this.#measure.sheet];
    return root;
  }

  protected override willUpdate(changed: PropertyValues<this>): void {
    if (!this.hasUpdated) this.#measured = this.getBoundingClientRect().width;
    else if (hostSet.some((name) => changed.has(name))) this.#measure.measure();
    const style = getComputedStyle(this);
    const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
    const hostFontSize = Number.parseFloat(style.fontSize);
    const collapseAt = threshold({ attribute: this.collapseBelow, token: style.getPropertyValue("--ocelle-list-detail-collapse"), published: publishedCollapse, rootFontSize, hostFontSize });
    const inspectorAt = threshold({ attribute: this.inspectorBelow, token: style.getPropertyValue("--ocelle-list-detail-inspector-collapse"), published: publishedInspectorCollapse, rootFontSize, hostFontSize });
    this.#tier = chooseTier({ measured: this.#measured, collapseAt, inspectorAt, narrow: this.narrow, hasInspector: this.#hasInspector });
    const shown = shownPanes(this.#tier, this.detailOpen, this.#hasInspector);
    const focused = this.#focusedPane();
    this.#focusTo = focused !== undefined && this.#shown.includes(focused) && !shown.includes(focused) ? shown[0] : undefined;
    this.#shown = shown;
  }

  protected override render(): unknown {
    return html`<div class="probe" aria-hidden="true"></div><div class="edges" aria-hidden="true"></div><div class="grid" data-tier=${this.#tier} ?data-open=${this.detailOpen} ?data-inspector=${this.#hasInspector}>
      <svg class="sizer" aria-hidden="true"></svg>
      <div class="pane list" @focusout=${this.#rest}><slot name="list" @slotchange=${this.#slotChanged}></slot></div>
      <div class="pane detail" @focusout=${this.#rest}><slot @slotchange=${this.#slotChanged}></slot></div>
      <div class="pane inspector" @focusout=${this.#rest}><slot name="inspector" @slotchange=${this.#slotChanged}></slot></div>
    </div>`;
  }

  protected override firstUpdated(): void {
    this.#observeShadow();
    // The first pass, also for an element with nothing slotted, whose slots never report a change.
    this.#measure.schedule();
  }

  protected override updated(): void {
    const target = this.#focusTo;
    this.#focusTo = undefined;
    // Stryker disable next-line ConditionalExpression: equivalent, ".pane.undefined" matches no wrapper, so nothing is focused either way
    if (target === undefined) return;
    const pane = this.renderRoot.querySelector<HTMLElement>(`.pane.${target}`);
    if (pane === null) return;
    pane.setAttribute("tabindex", "-1");
    pane.focus();
  }

  /** Takes the host's border-box inline size as the probe's content box plus the host's inline padding and borders. */
  #resized(): void {
    const style = getComputedStyle(this);
    const edges = ["padding-inline-start", "padding-inline-end", "border-inline-start-width", "border-inline-end-width"].reduce((sum, name) => sum + Number.parseFloat(style.getPropertyValue(name)), 0);
    const size = this.#content + edges;
    // Stryker disable next-line ConditionalExpression: equivalent, an update with the size in force chooses the same tier
    if (size === this.#measured) return;
    this.#measured = size;
    this.requestUpdate();
  }

  /**
   * After a scheduled pass (a slot change, a light-DOM change or `remeasure()`), measures the host's border box afresh:
   * the probe's content box read now and the host's inline padding and borders, so a change that may go unseen, such
   * as a percentage padding that follows the host's container, re-chooses the tier in the same frame.
   */
  #remeasured(): void {
    for (const probe of this.renderRoot.querySelectorAll(".probe")) this.#content = Number.parseFloat(getComputedStyle(probe).inlineSize);
    this.#resized();
  }

  /**
   * The pane that holds focus, or none. The active element is read from the element's own root, the document or the
   * shadow root that holds it, since a host component's shadow root retargets `document.activeElement` to its host.
   */
  #focusedPane(): Pane | undefined {
    const active = (this.getRootNode() as Document | ShadowRoot).activeElement;
    if (active === null) return undefined;
    if (active === this) return this.#paneOf(this.shadowRoot?.activeElement?.closest(".pane") ?? null);
    if (!this.contains(active)) return undefined;
    let child: Element = active;
    while (child.parentElement !== this && child.parentElement !== null) child = child.parentElement;
    // The pane a child of the host is slotted into, by its slot attribute: known before the first render assigns it.
    return paneOfSlot[child.getAttribute("slot") ?? ""];
  }

  #paneOf(wrapper: Element | null): Pane | undefined {
    if (wrapper === null) return undefined;
    return (["list", "detail", "inspector"] as const).find((pane) => wrapper.classList.contains(pane));
  }

  /** A wrapper loses the `tabindex` it took for a focus move when focus leaves it (a focusout inside it finds none). */
  readonly #rest = (event: FocusEvent): void => {
    (event.currentTarget as HTMLElement).removeAttribute("tabindex");
  };

  readonly #slotChanged = (): void => {
    this.#observeSlots();
    this.#measure.schedule();
  };

  /** Observes the probe, the edge box and the slotted elements, once the shadow root holds them. */
  #observeShadow(): void {
    for (const probe of this.renderRoot.querySelectorAll(".probe")) this.#resize.observe(probe);
    for (const edges of this.renderRoot.querySelectorAll(".edges")) this.#resize.observe(edges, { box: "border-box" });
    this.#observeSlots();
  }

  #observeSlots(): void {
    const slots = [...this.renderRoot.querySelectorAll("slot")];
    this.#measure.observe(slots.flatMap((slot) => slot.assignedElements()));
    // The children the `inspector` slot is assigned, by their slot attribute: known before the first render too.
    // Only a change of it asks for an update, so the first render brings no second one (round-3.md R3-03).
    const hasInspector = [...this.children].some((child) => child.slot === "inspector");
    if (hasInspector === this.#hasInspector) return;
    this.#hasInspector = hasInspector;
    this.requestUpdate();
  }
}

define("ocelle-list-detail", OcelleListDetail);

declare global {
  interface HTMLElementTagNameMap {
    "ocelle-list-detail": OcelleListDetail;
  }
}
