// The package entry of @ocelle/tokens (FR-009, contracts/token-package.md): typed token names and the JSON data.
import type { TokenJson } from "./generate.ts";
import { records } from "./source.ts";
/* eslint-disable @typescript-eslint/no-unused-vars -- scaffold: signatures only, the green commit implements them */

export type TokenName = (typeof records)[number]["name"];

export const tokenNames: readonly TokenName[] = [];

export const tokens: TokenJson = { version: 1, tokens: [] };

/** The CSS custom property name of a token (`color-canvas` → `--ocelle-color-canvas`). */
export function cssName(name: TokenName): string {
  return "";
}
