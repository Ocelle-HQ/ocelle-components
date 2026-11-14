// Guarded registration (005 research.md R-02, FR-006): every element module ends with one `define` call, which
// defines its tag only while the tag is free. A second copy of the package on the page (another version, or the
// browser build beside a bundle of the module build) then finds the tag defined and leaves the first definition in
// place without throwing. The registration flag (specs/010-feedback-forms research.md R-02, FR-008): while the
// `customElements.define` call of `define` runs, `registering()` reads true, so an element constructed then is one the
// registration upgrades (part of the page as first loaded, in the document or in a shadow root). Internal, not an
// entry point.

let running = false;

/** Defines `tag` as `constructor` unless the tag is already defined; never throws for a defined tag. */
export function define(tag: string, constructor: CustomElementConstructor): void {
  if (customElements.get(tag) !== undefined) return;
  running = true;
  try {
    customElements.define(tag, constructor);
  } finally {
    running = false;
  }
}

/** Whether a `define` call's registration is running: an element constructed now is upgraded by it. */
export function registering(): boolean {
  return running;
}
