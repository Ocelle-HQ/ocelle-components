// The measurement pass of `ocelle-list-detail` (009 FR-025, FR-030; research.md R-13; data-model.md § list-detail):
// the element's intrinsic inline sizes do not depend on the layout it shows. In one task with no paint between, the
// pass lays every present pane out in the widest grid at its max-content size and reads its inline size, then in the
// one-column stack at its min-content size and reads that, then restores the tier. The two figures are measured px
// figures, written only when they changed into the instance's one constructed stylesheet (`.sizer`'s `inline-size`
// and `.grid`'s `min-inline-size`), never to a `style` attribute. A `MutationObserver` on the assigned elements of
// every pane (`childList`, `characterData`, `subtree`; no `attributes`), `slotchange` and `remeasure()` schedule the
// pass for the next animation frame, at most once per frame and never inside a `ResizeObserver` delivery; the element
// runs it synchronously before a tier or `detail-open` change set through a property or attribute. The pass counter is
// for the tests that count passes (test/list-detail-pass.test.ts). Internal: not exported from the package root, not
// an entry point and not in the manifest.

let passes = 0;

/** The number of measurement passes run on the page since this module loaded (test-only). */
export function passCount(): number {
  return passes;
}

/** The measurement of one list-detail: its stylesheet of figures, its observer and its frame request. */
export class ListDetailMeasure {
  /** The instance's constructed stylesheet of measured figures, adopted after the element's shared sheets. */
  readonly sheet = new CSSStyleSheet();
  readonly #grid: () => HTMLElement | null;
  readonly #sizerRule: CSSStyleRule;
  readonly #gridRule: CSSStyleRule;
  readonly #observer = new MutationObserver(() => {
    this.schedule();
  });
  #frame: number | undefined;
  #max: number | undefined;
  #min: number | undefined;

  /** `grid` returns the element's shadow grid (`.grid`, with the `.sizer` in it), or null before the first render. */
  constructor(grid: () => HTMLElement | null) {
    this.#grid = grid;
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
    });
  }

  /** Runs the pass now: lays the panes out in the measurement tiers, reads the figures, restores the tier and writes the figures that changed. */
  measure(): void {
    const grid = this.#grid();
    if (grid === null) return;
    passes += 1;
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
