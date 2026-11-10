// The custom-elements manifest generator (005 research.md R-06, FR-007). Scaffold: signatures only.

/** A custom-elements manifest (schema 1.0.0), as JSON. */
export type Manifest = Record<string, unknown>;

/** The analyzer's raw output normalised: empty lists stated, `IconName` expanded to `names`, `aria-label` and non-public members dropped, keys sorted. */
export function normalise(raw: Manifest, names: readonly string[]): Manifest {
  throw new Error(`not implemented: normalise(${String(Object.keys(raw).length)}, ${String(names.length)})`);
}

/** The manifest generated from the element source under `root` (the repository root). */
export function generate(root: string): Promise<Manifest> {
  return Promise.reject(new Error(`not implemented: generate(${root})`));
}

/** The manifest's file text: JSON with two-space indentation and a trailing newline. */
export function serialise(manifest: Manifest): string {
  throw new Error(`not implemented: serialise(${String(Object.keys(manifest).length)})`);
}
