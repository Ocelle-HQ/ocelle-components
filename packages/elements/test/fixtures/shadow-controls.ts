// Test-only slotted controls for the focus handover of 009 (spec US1 scenario 4; research.md R-07,
// PLAN-A11Y-SECURITY-1-002): `test-shadow-button`, whose focusable part is a button in its open shadow root (the host
// itself is not focusable), and `test-delegating`, a host that delegates focus to the button in its shadow root; and,
// for op 022 (#57), `test-icon-forwarder`, a host that forwards its own `icon` slot into an `ocelle-button`. They
// ship in no package. The in-process tests import this module; global-setup.ts bundles it for the fixture pages as
// `ocelle-test-controls.js`, which imports nothing. No style: the tests size the hosts with their own rules.

/** A host whose focusable part is the `.inner` button of its open shadow root. */
export class TestShadowButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = '<button class="inner" type="button">Shadow</button>';
  }
}

/** A host that delegates focus to the `.inner` button of its open shadow root. */
export class TestDelegating extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open", delegatesFocus: true }).innerHTML = '<span>Delegating</span><button class="inner" type="button">Delegate</button>';
  }
}

/**
 * A host whose open shadow root holds an `ocelle-button` with the one-character text `S` and the host's own `icon` slot
 * forwarded into the button's `icon` slot (op 022, #57). With nothing slotted into the host, the button's `icon` slot
 * is assigned only that empty slot, so its flattened assignment is empty. The button's definition comes from the page.
 */
export class TestIconForwarder extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" }).innerHTML = '<ocelle-button><slot name="icon" slot="icon"></slot>S</ocelle-button>';
  }
}

if (customElements.get("test-shadow-button") === undefined) customElements.define("test-shadow-button", TestShadowButton);
if (customElements.get("test-delegating") === undefined) customElements.define("test-delegating", TestDelegating);
if (customElements.get("test-icon-forwarder") === undefined) customElements.define("test-icon-forwarder", TestIconForwarder);
