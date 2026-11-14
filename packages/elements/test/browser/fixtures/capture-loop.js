// The looping element of the capture-bounds tests on the fixture pages (specs/010-feedback-forms T001a, T001c;
// contracts/testing.md § Plants, "capture bounds"): the same tag and behaviour as test/fixtures/live-loop.ts.
// `ocelle-test-loop` toggles its own `data-tick` attribute once in every animation frame while it is connected. Not a
// library element.
class OcelleTestLoop extends HTMLElement {
  connectedCallback() {
    const tick = () => {
      this.toggleAttribute("data-tick");
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.frame);
  }
}

if (customElements.get("ocelle-test-loop") === undefined) customElements.define("ocelle-test-loop", OcelleTestLoop);
