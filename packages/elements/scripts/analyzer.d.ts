// Types for the parts of @custom-elements-manifest/analyzer 0.11.0 that scripts/manifest.ts uses (005 research.md
// R-06; reviews/phase-2/spike.md § 2): the package's index.d.ts declares the plugin types but not its `create` and
// `ts` exports, and its Lit plugin module has no types. `ts` is the analyzer's own TypeScript (5.4.5), typed here by
// the repository's TypeScript, whose `createSourceFile` and `ScriptTarget` it shares.
declare module "@custom-elements-manifest/analyzer" {
  /** Creates a manifest from TypeScript source files and plugins. */
  export function create(options: { readonly modules: readonly import("typescript").SourceFile[]; readonly plugins?: readonly Plugin[]; readonly context?: Context }): Record<string, unknown>;
  /** The analyzer's own TypeScript. */
  export const ts: typeof import("typescript");
}

declare module "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js" {
  /** The plugins of the analyzer's `--litelement` option. */
  export function litPlugin(): import("@custom-elements-manifest/analyzer").Plugin[];
}
