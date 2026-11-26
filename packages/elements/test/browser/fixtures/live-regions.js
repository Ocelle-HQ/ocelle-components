// The test-only elements of the capture and driver tests on the fixture pages (specs/010-feedback-forms T001a,
// T001b): the same tags and behaviour as test/fixtures/live-regions.ts, as a plain same-origin script (the strict CSP
// allows only those). Not a library element.
class OcelleTestRegion extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot !== null) return;
    const region = document.createElement("div");
    region.setAttribute("aria-live", "polite");
    this.attachShadow({ mode: "open" }).append(region);
  }

  say(text) {
    const region = this.shadowRoot?.querySelector("div");
    if (region === null || region === undefined) throw new Error("ocelle-test-region: not connected");
    region.textContent = text;
  }
}

class OcelleTestNest extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot !== null) return;
    const inner = document.createElement("ocelle-test-region");
    inner.id = "inner";
    this.attachShadow({ mode: "open" }).append(inner);
  }
}

class OcelleTestAlert extends HTMLElement {
  constructor() {
    super();
    this.attachInternals().ariaLive = "off";
  }
}

class OcelleTestProbe extends HTMLElement {
  constructor() {
    super();
    this.constructedConnected = this.isConnected;
    this.connectedReadyState = null;
    this.definedWhenConnected = null;
  }

  connectedCallback() {
    if (this.connectedReadyState !== null) return;
    this.connectedReadyState = document.readyState;
    this.definedWhenConnected = customElements.get(this.localName) !== undefined;
  }
}

class OcelleTestField extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot !== null) return;
    const input = document.createElement("input");
    input.setAttribute("aria-label", "Field");
    this.attachShadow({ mode: "open", delegatesFocus: true }).append(input);
  }
}

for (const [tag, constructor] of [
  ["ocelle-test-region", OcelleTestRegion],
  ["ocelle-test-nest", OcelleTestNest],
  ["ocelle-test-alert", OcelleTestAlert],
  ["ocelle-test-probe", OcelleTestProbe],
  ["ocelle-test-field", OcelleTestField],
]) {
  if (customElements.get(tag) === undefined) customElements.define(tag, constructor);
}
