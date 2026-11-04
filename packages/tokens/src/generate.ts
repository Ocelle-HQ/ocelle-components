// The token generator (research.md R-01, R-02, R-12; data-model.md § Token, § Token overrides, § JSON export): pure
// functions of the token source, no I/O. css() is the stylesheet text, json() the JSON export, names() the name list,
// resolve() the one resolver of derived values, validateSource() the source rules, applyOverrides() the plant deltas.
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function -- scaffold: signatures only, the green commit implements them */

/** The eight token groups of FR-001; colour and elevation are theme-dependent. */
export type Group = "colour" | "type" | "space" | "shape" | "size" | "shell" | "elevation" | "motion";

export type Theme = "light" | "dark";

/** A value per theme. */
export interface Themed<T> {
  readonly light: T;
  readonly dark: T;
}

/** A foreground colour's contrast kind and intended grounds (A.8). */
export interface Contrast {
  readonly kind: "text" | "non-text";
  readonly grounds: readonly string[];
  readonly exempt?: true;
}

/** One token of the source (data-model.md § Token). */
export interface TokenRecord {
  readonly name: string;
  readonly group: Group;
  readonly value: string | Themed<string>;
  readonly ref?: readonly string[] | Themed<readonly string[]>;
  readonly contrast?: Contrast;
}

/** One change of the token source by key (data-model.md § Token overrides). */
export type TokenOverride =
  | {
      readonly token: string;
      readonly light?: string;
      readonly dark?: string;
      readonly value?: string | Themed<string>;
      readonly ref?: readonly string[] | Themed<readonly string[]>;
      readonly contrast?: Contrast;
    }
  | { readonly add: TokenRecord }
  | { readonly remove: string };

/** One token of the JSON export: full names, resolved values (contracts/token-package.md). */
export type JsonToken = {
  readonly name: string;
  readonly group: Group;
  readonly ref?: readonly string[] | Themed<readonly string[]>;
} & ({ readonly light: string; readonly dark: string } | { readonly value: string });

/** The JSON export (`dist/tokens.json`). */
export interface TokenJson {
  readonly version: 1;
  readonly tokens: readonly JsonToken[];
}

/** The token names, in source order. */
export function names(source: readonly TokenRecord[]): string[] {
  return [];
}

/** A token's value in a theme with every `var(--ocelle-…)` reference replaced by its resolved value. */
export function resolve(source: readonly TokenRecord[], name: string, theme: Theme): string {
  return "";
}

/** Throws, naming each token and rule, when the source breaks a rule of data-model.md § Token. */
export function validateSource(source: readonly TokenRecord[]): void {
}

/** The records with the overrides applied in order (data-model.md § Token overrides). */
export function applyOverrides(records: readonly TokenRecord[], overrides: readonly TokenOverride[]): TokenRecord[] {
  return [];
}

/** The stylesheet text (research.md R-02). */
export function css(source: readonly TokenRecord[]): string {
  return "";
}

/** The JSON export (FR-008). */
export function json(source: readonly TokenRecord[]): TokenJson {
  return { version: 1, tokens: [] };
}
