// Test-only slotted elements of 009 User Story 3 (spec US3 scenario 12; research.md R-13): `test-shadow-block`, which
// renders a block that does not wrap in its open shadow root, 30rem wide, or 40rem when its `wide` property is set to
// "40", a change a `MutationObserver` on the light DOM cannot see; and `test-appender`, which appends a 35rem block to
// its own light DOM from its own `ResizeObserver` once it is observed with a non-zero inline size, and then stops
// observing (its own second notification would bring the browser's loop message whatever the list-detail does). The
// light-DOM blocks are sized by the test page's `.w30` and `.w35` rules. Since phase 4's review round 1 (R1-02), also
// `test-shadow-frame`, which moves its children into its own open shadow root when it is first connected, so a
// list-detail among them sits inside another component's shadow root, as in a shell that renders its screen there. They ship in no package. The in-process tests
// import this module; global-setup.ts bundles it for the fixture pages as `ocelle-test-list-detail.js`, which imports
// nothing. The shadow block's sheet is a constructed stylesheet, which the fixture's CSP does not govern.

/** A block in an open shadow root, 30rem wide, or 40rem with `wide` set to "40". */
export class TestShadowBlock extends HTMLElement {
  static readonly #sheet = (() => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(':host { display: block; } .block { display: block; block-size: 2rem; inline-size: 30rem; } .block[data-wide="40"] { inline-size: 40rem; }');
    return sheet;
  })();

  readonly #block: HTMLElement;

  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    root.adoptedStyleSheets = [TestShadowBlock.#sheet];
    this.#block = document.createElement("div");
    this.#block.className = "block";
    root.append(this.#block);
  }

  /** "40" renders the 40rem block; anything else the 30rem one. */
  get wide(): string {
    return this.#block.dataset.wide ?? "30";
  }

  set wide(value: string) {
    this.#block.dataset.wide = value;
  }
}

/** A block that appends a 35rem block (`.w35`) to itself from its own `ResizeObserver`, once, when it first has an inline size. */
export class TestAppender extends HTMLElement {
  readonly #observer = new ResizeObserver((entries) => {
    const size = entries.at(-1)?.contentRect.width ?? 0;
    if (size <= 0) return;
    this.#observer.disconnect();
    const block = document.createElement("div");
    block.className = "w35";
    this.append(block);
  });

  connectedCallback(): void {
    this.#observer.observe(this);
  }

  disconnectedCallback(): void {
    this.#observer.disconnect();
  }
}

/**
 * A block that moves its children into its own open shadow root when first connected. Its `open` property set to
 * "open" sets `detail-open` on the `ocelle-list-detail` in that shadow root; any other value removes it.
 */
export class TestShadowFrame extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot === null) this.attachShadow({ mode: "open" }).append(...this.childNodes);
  }

  get open(): string {
    return this.shadowRoot?.querySelector("ocelle-list-detail")?.hasAttribute("detail-open") === true ? "open" : "";
  }

  set open(value: string) {
    this.shadowRoot?.querySelector("ocelle-list-detail")?.toggleAttribute("detail-open", value === "open");
  }
}

if (customElements.get("test-shadow-block") === undefined) customElements.define("test-shadow-block", TestShadowBlock);
if (customElements.get("test-appender") === undefined) customElements.define("test-appender", TestAppender);
if (customElements.get("test-shadow-frame") === undefined) customElements.define("test-shadow-frame", TestShadowFrame);
