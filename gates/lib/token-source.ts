// The token inputs of the contrast and brand-rules gates under `--root` (002 research.md R-07, R-08, data-model.md
// § Token, § Contrast pair, § Gate findings): the token source and the root's own generator by dynamic import, the
// source validated by the generator's validateSource(); the pair list packages/tokens/contrast/pairs.json with its
// schema and the line of each entry; the required pair set derived from the intended grounds; and the line of a
// token's record (the location of a finding about a token, data-model.md § Token overrides).
import type { TokenRecord } from "../../packages/tokens/src/generate.ts";
import type { Location } from "./findings.ts";

export type Theme = "light" | "dark";

/** The two themes, in order. */
export const themes: readonly Theme[] = ["light", "dark"];

/** The repository paths of the token inputs. */
export const tokenPaths = {
  source: "packages/tokens/src/source.ts",
  overrides: "packages/tokens/src/overrides.ts",
  generator: "packages/tokens/src/generate.ts",
  pairs: "packages/tokens/contrast/pairs.json",
  stylesheet: "packages/tokens/dist/tokens.css",
} as const;

/** An input the gate cannot run on: the file (repository path) and the cause. */
export class CannotRun extends Error {
  readonly file: string;

  constructor(file: string, cause: string) {
    super(cause);
    this.file = file;
  }
}

/** The loaded, validated token source and the generator functions the gates use. */
export interface Tokens {
  readonly source: readonly TokenRecord[];
  /** A token's resolved value in a theme (the generator's resolve()). */
  readonly resolve: (name: string, theme: Theme) => string;
  /** The stylesheet text the generator produces from the source; throws CannotRun naming the generator. */
  readonly css: () => string;
}

/** Loads the generator and the token source under `root` and validates the source; throws CannotRun. */
export function loadTokens(root: string): Promise<Tokens> {
  return Promise.reject(new Error(`not implemented: loadTokens(${root})`));
}

/** One entry of the pair list (data-model.md § Contrast pair). */
export interface PairEntry {
  readonly theme: Theme;
  readonly fg: string;
  readonly bg: string;
  readonly kind: "text" | "non-text";
  readonly figure: string;
  readonly status: "checked" | "excluded";
  readonly reason?: string;
  readonly source: "#5" | "computed";
}

/** The pair list's entries and the line (1-based) of each. */
export interface PairList {
  readonly entries: readonly PairEntry[];
  readonly lines: readonly number[];
}

/** The pair list of a pairs.json text; throws an Error naming the cause when it is not JSON, not the schema or empty. */
export function parsePairs(text: string): PairList {
  throw new Error(`not implemented: parsePairs(${String(text.length)})`);
}

/** The pair list under `root`; throws CannotRun naming the pair list. */
export function readPairs(root: string): Promise<PairList> {
  return Promise.reject(new Error(`not implemented: readPairs(${root})`));
}

/** One required pair (A.8): a foreground on one of its intended grounds in a theme. */
export interface RequiredPair {
  readonly theme: Theme;
  readonly fg: string;
  readonly bg: string;
  readonly kind: "text" | "non-text";
}

/** The required pairs of a source, in source order: each token with `contrast`, each ground, each theme. */
export function requiredPairs(source: readonly TokenRecord[]): RequiredPair[] {
  throw new Error(`not implemented: requiredPairs(${String(source.length)})`);
}

/** The lines (1-based) of a text that hold the record of the token `name` (its `name` field). */
export function tokenLines(text: string, name: string): number[] {
  throw new Error(`not implemented: tokenLines(${String(text.length)}, ${name})`);
}

/** The lines (1-based) of a pairs.json text that hold the entry of `(theme, fg, bg)`. */
export function pairLines(text: string, theme: string, fg: string, bg: string): number[] {
  throw new Error(`not implemented: pairLines(${String(text.length)}, ${theme}, ${fg}, ${bg})`);
}

/** The location of a finding about a token under `root`: its record in source.ts, or in overrides.ts if only added there. */
export function tokenLocator(root: string): Promise<(name: string) => Location> {
  return Promise.reject(new Error(`not implemented: tokenLocator(${root})`));
}
