// The looping element of the capture-bounds tests, in process (specs/010-feedback-forms T001a, T001c;
// contracts/testing.md § Plants, "capture bounds"): `ocelle-test-loop` toggles its own `data-tick` attribute once in
// every animation frame, for as long as it is connected, so a capture over it never sees a quiet window and must end
// on its bounds ("capture exceeded …"), not on a timeout. The toggles run in animation frame callbacks, which a busy
// page does not starve as it can starve timers, and the page keeps running between them, so the test can remove the
// element afterwards. Not a library element. The fixture pages define the same tag in
// test/browser/fixtures/capture-loop.js.

export class OcelleTestLoop extends HTMLElement {
  #frame = 0;

  connectedCallback(): void {
    const tick = (): void => {
      this.toggleAttribute("data-tick");
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  disconnectedCallback(): void {
    cancelAnimationFrame(this.#frame);
  }
}

if (customElements.get("ocelle-test-loop") === undefined) customElements.define("ocelle-test-loop", OcelleTestLoop);

/** The looping element's markup. */
export const loopMarkup = '<ocelle-test-loop id="loop"></ocelle-test-loop>';
