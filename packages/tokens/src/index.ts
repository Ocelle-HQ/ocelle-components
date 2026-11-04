// The package entry of @ocelle/tokens (FR-009, contracts/token-package.md): typed token names and the JSON data.
import { json, names } from "./generate.ts";
import type { TokenJson } from "./generate.ts";
import { records, source } from "./source.ts";

/** The name of a token of the source, without the `--ocelle-` prefix. */
export type TokenName = (typeof records)[number]["name"];

const known: ReadonlySet<string> = new Set(names(source));

/** Every token name, in source order. */
export const tokenNames: readonly TokenName[] = names(records) as TokenName[];

/** The JSON export (`@ocelle/tokens/tokens.json`) as data. */
export const tokens: TokenJson = json(source);

/** The CSS custom property name of a token (`color-canvas` → `--ocelle-color-canvas`); throws for a name that is not a token. */
export function cssName(name: TokenName): string {
  if (!known.has(name)) throw new Error(`unknown token ${name}`);
  return `--ocelle-${name}`;
}
