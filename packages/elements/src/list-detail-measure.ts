// The measurement pass of `ocelle-list-detail` (009 FR-025, FR-030; research.md R-13; data-model.md § list-detail):
// the element's intrinsic inline sizes do not depend on the layout it shows. In one task with no paint between, the
// pass lays every present pane out in the widest grid at its max-content size and reads its inline size, then in the
// one-column stack at its min-content size and reads that, then restores the tier. The two figures are measured px
// figures, written only when they changed into the instance's one constructed stylesheet (`.sizer`'s `inline-size`
// and `.grid`'s `min-inline-size`), never to a `style` attribute. A `MutationObserver` on the assigned elements of
// every pane (`childList`, `characterData`, `subtree`; no `attributes`), `slotchange` and `remeasure()` schedule the
// pass for the next animation frame, at most once per frame and never inside a `ResizeObserver` delivery; the element
// runs it synchronously before a tier or `detail-open` change set through a property or attribute. After a scheduled
// pass, in the same animation-frame callback, the element's own `after` step runs (it measures its border box afresh;
// reviews/phase-4/round-2-fixes.md R2-01). The module keeps no count of its runs: test/list-detail-pass.test.ts takes
// the count from the effect each run has on the grid, so nothing test-only ships in dist/ or the browser build
// (research.md R-13). A pass on an element that is not rendered writes nothing and stays pending until the element's
// `ResizeObserver` sees it rendered again and calls `resume()` (landing pass O5-01; data-model.md § list-detail "Not
// rendered"). Internal: not exported from the package root, not an entry point and
// not in the manifest.

/** The measurement of one list-detail: its stylesheet of figures, its observer and its frame request. */
export class ListDetailMeasure {
  /** The instance's constructed stylesheet of measured figures, adopted after the element's shared sheets. */
  readonly sheet = new CSSStyleSheet();
  readonly #grid: () => HTMLElement | null;
  readonly #after: () => void;
  readonly #sizerRule: CSSStyleRule;
  readonly #gridRule: CSSStyleRule;
  readonly #observer = new MutationObserver(() => {
    this.schedule();
  });
  #frame: number | undefined;
  // Stryker disable next-line BooleanLiteral: equivalent, the first pass runs in an animation frame before the probe's first observation, and a pass requested while one is requested is coalesced
  #pending = false;
  #max: number | undefined;
  #min: number | undefined;

  /**
   * `grid` returns the element's shadow grid (`.grid`, with the `.sizer` in it), or null before the first render;
   * `after` runs after each scheduled pass, in the same animation-frame callback (the element measures its border box
   * afresh there).
   */
  constructor(grid: () => HTMLElement | null, after: () => void) {
    this.#grid = grid;
    this.#after = after;
    this.sheet.replaceSync(".sizer {} .grid {}");
    this.#sizerRule = this.sheet.cssRules.item(0) as CSSStyleRule;
    this.#gridRule = this.sheet.cssRules.item(1) as CSSStyleRule;
  }

  /** Observes the light DOM of `elements` (the assigned elements of every pane), in place of what it observed before. */
  observe(elements: readonly Element[]): void {
    this.#observer.disconnect();
    for (const element of elements) this.#observer.observe(element, { childList: true, characterData: true, subtree: true });
  }

  /** Requests one pass for the next animation frame, unless one is already requested. */
  schedule(): void {
    if (this.#frame !== undefined) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = undefined;
      this.measure();
      this.#after();
    });
  }

  /**
   * Requests the pass a not-rendered element left pending, for the next animation frame, once the element is rendered
   * again; the element calls it from its `ResizeObserver`, so the pass never runs inside that delivery.
   */
  resume(): void {
    if (this.#pending) this.schedule();
  }

  /**
   * Runs the pass now: lays the panes out in the measurement tiers, reads the figures, restores the tier and writes the
   * figures that changed. On a grid with no box (the element in a closed `<dialog>`, under a `display: none` ancestor
   * or `hidden`) it writes nothing and stays pending, since it would read 0 px for both figures (O5-01).
   */
  measure(): void {
    const grid = this.#grid();
    if (grid === null) return;
    if (grid.getClientRects().length === 0) {
      this.#pending = true;
      return;
    }
    this.#pending = false;
    // The element renders the grid with its tier, so the attribute is always there to restore.
    const tier = String(grid.getAttribute("data-tier"));
    grid.setAttribute("data-tier", "max");
    const max = grid.getBoundingClientRect().width;
    grid.setAttribute("data-tier", "min");
    const min = grid.getBoundingClientRect().width;
    grid.setAttribute("data-tier", tier);
    // Stryker disable next-line ConditionalExpression: equivalent, writing the figure in force again changes no style
    if (max !== this.#max) {
      this.#max = max;
      this.#sizerRule.style.setProperty("inline-size", `${String(max)}px`);
    }
    // Stryker disable next-line ConditionalExpression: equivalent, writing the figure in force again changes no style
    if (min !== this.#min) {
      this.#min = min;
      this.#gridRule.style.setProperty("min-inline-size", `${String(min)}px`);
    }
  }

  /** Stops observing and cancels a requested pass. */
  disconnect(): void {
    this.#observer.disconnect();
    if (this.#frame !== undefined) cancelAnimationFrame(this.#frame);
    this.#frame = undefined;
  }
}
