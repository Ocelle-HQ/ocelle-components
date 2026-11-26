// Planted regions and test-only elements of the capture and driver tests, in process (specs/010-feedback-forms T001a,
// T001b; contracts/testing.md § Live-region capture, § Driver steps). Nothing here is a library element; importing the
// module defines the tags below once. The fixture pages define the same tags with the same behaviour in the plain
// script test/browser/fixtures/live-regions.js (the strict CSP allows only same-origin scripts).
//
// - `ocelle-test-region`: on its first connection attaches an open shadow root holding one
//   `<div aria-live="polite">` (the region); `say(text)` sets the region's text.
// - `ocelle-test-nest`: on its first connection attaches an open shadow root holding an `ocelle-test-region` with
//   the id `inner`, so a shadow root is attached inside a shadow root attached later.
// - `ocelle-test-alert`: an `ElementInternals` host whose `ariaLive` is `"off"`; the host writes `role="alert"`.
// - `ocelle-test-probe`: records, in its constructor, whether it was connected (`constructedConnected`) and, on its
//   first connection, `document.readyState` (`connectedReadyState`) and whether its tag was defined then.
// - `ocelle-test-field`: an open shadow root holding one `<input>`, focusable through the host (`delegatesFocus`).

/** The region of an `ocelle-test-region`. */
export class OcelleTestRegion extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot !== null) return;
    const region = document.createElement("div");
    region.setAttribute("aria-live", "polite");
    this.attachShadow({ mode: "open" }).append(region);
  }

  /** Sets the region's text. */
  say(text: string): void {
    const region = this.shadowRoot?.querySelector("div");
    if (region === null || region === undefined) throw new Error("ocelle-test-region: not connected");
    region.textContent = text;
  }
}

export class OcelleTestNest extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot !== null) return;
    const inner = document.createElement("ocelle-test-region");
    inner.id = "inner";
    this.attachShadow({ mode: "open" }).append(inner);
  }
}

export class OcelleTestAlert extends HTMLElement {
  constructor() {
    super();
    this.attachInternals().ariaLive = "off";
  }
}

export class OcelleTestProbe extends HTMLElement {
  readonly constructedConnected: boolean;
  connectedReadyState: DocumentReadyState | null = null;
  definedWhenConnected: boolean | null = null;

  constructor() {
    super();
    this.constructedConnected = this.isConnected;
  }

  connectedCallback(): void {
    if (this.connectedReadyState !== null) return;
    this.connectedReadyState = document.readyState;
    this.definedWhenConnected = customElements.get(this.localName) !== undefined;
  }
}

export class OcelleTestField extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot !== null) return;
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Field");
    this.attachShadow({ mode: "open", delegatesFocus: true }).append(input);
  }
}

const definitions: readonly (readonly [string, CustomElementConstructor])[] = [
  ["ocelle-test-region", OcelleTestRegion],
  ["ocelle-test-nest", OcelleTestNest],
  ["ocelle-test-alert", OcelleTestAlert],
  ["ocelle-test-probe", OcelleTestProbe],
  ["ocelle-test-field", OcelleTestField],
];
for (const [tag, constructor] of definitions) if (customElements.get(tag) === undefined) customElements.define(tag, constructor);

/** The planted region markup of the capture tests: a plain region in the container, empty. */
export const plainRegion = '<div id="plain" aria-live="polite"></div>';

/** A base class for `registerFirstLoad`: on its first connection it attaches a shadow root holding a region "Ready". */
export class FirstLoadBase extends HTMLElement {
  readonly constructedConnected: boolean;

  constructor() {
    super();
    this.constructedConnected = this.isConnected;
  }

  connectedCallback(): void {
    if (this.shadowRoot !== null) return;
    const region = document.createElement("div");
    region.setAttribute("aria-live", "polite");
    region.textContent = "Ready";
    this.attachShadow({ mode: "open" }).append(region);
  }
}
