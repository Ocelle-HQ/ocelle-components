// Guarded registration (005 research.md R-02, FR-006): every element module ends with one `define` call, which
// defines its tag only while the tag is free. A second copy of the package on the page (another version, or the
// browser build beside a bundle of the module build) then finds the tag defined and leaves the first definition in
// place without throwing. Internal, not an entry point.

/** Defines `tag` as `constructor` unless the tag is already defined; never throws for a defined tag. */
export function define(tag: string, constructor: CustomElementConstructor): void {
  if (customElements.get(tag) === undefined) customElements.define(tag, constructor);
}
