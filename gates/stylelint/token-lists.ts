// The lists the unknown-token check of ocelle/token-only reads under the repository root (FR-010, research.md R-09,
// data-model.md § Element property list): the full names of the tokens of packages/tokens/src/source.ts, and the
// custom property names that packages/elements/custom-elements.json declares (empty while the file is absent).
/* eslint-disable @typescript-eslint/no-unused-vars -- scaffold: signatures only, the green commit implements them */

/** The token names and element custom property names, full (`--ocelle-…`). */
export interface TokenLists {
  readonly tokens: readonly string[];
  readonly elementProperties: readonly string[];
}

/** The lists of the repository at `root`; throws naming the file and the cause when they cannot be read. */
export async function loadLists(root: string): Promise<TokenLists> {
  await Promise.resolve();
  return { tokens: [], elementProperties: [] };
}
