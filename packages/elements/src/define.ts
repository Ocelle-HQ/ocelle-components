// Guarded registration (005 research.md R-02, FR-006): defines a tag only while it is free. Internal, not an entry
// point. Scaffold: no behaviour yet.

/** Defines `tag` as `constructor` unless the tag is already defined; never throws for a defined tag. */
export function define(tag: string, constructor: CustomElementConstructor): void {
  throw new Error(`not implemented: define(${tag}, ${constructor.name})`);
}
