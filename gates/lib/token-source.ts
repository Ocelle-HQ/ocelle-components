// The token inputs of the contrast and brand-rules gates under `--root` (002 research.md R-07, R-08, data-model.md
// § Token, § Contrast pair, § Gate findings): the token source and the root's own generator by dynamic import, the
// source validated by the generator's validateSource(); the pair list packages/tokens/contrast/pairs.json with its
// schema and the line of each entry; the required pair set derived from the intended grounds; and the line of a
// token's record (the location of a finding about a token, data-model.md § Token overrides).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
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

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** The generator functions the gates call, in the order they are checked. */
const generatorFunctions = ["resolve", "validateSource", "css"] as const;

interface Generator {
  readonly resolve: (source: readonly TokenRecord[], name: string, theme: Theme) => string;
  readonly validateSource: (source: readonly TokenRecord[]) => void;
  readonly css: (source: readonly TokenRecord[]) => unknown;
}

/** Imports a module of the repository at `root`; throws CannotRun naming it. */
async function load(root: string, path: string): Promise<Record<string, unknown>> {
  try {
    return (await import(pathToFileURL(join(root, path)).href)) as Record<string, unknown>;
  } catch (error) {
    throw new CannotRun(path, describe(error));
  }
}

/** Loads the generator and the token source under `root` and validates the source; throws CannotRun. */
export async function loadTokens(root: string): Promise<Tokens> {
  const generator = await load(root, tokenPaths.generator);
  for (const name of generatorFunctions) {
    if (typeof generator[name] !== "function") throw new CannotRun(tokenPaths.generator, `it exports no ${name} function`);
  }
  const { resolve, validateSource, css } = generator as unknown as Generator;
  const sourceModule = await load(root, tokenPaths.source);
  if (!Array.isArray(sourceModule.source)) throw new CannotRun(tokenPaths.source, "it exports no source list");
  const source = sourceModule.source as readonly TokenRecord[];
  try {
    validateSource(source);
  } catch (error) {
    throw new CannotRun(tokenPaths.source, describe(error));
  }
  return {
    source,
    resolve: (name, theme) => resolve(source, name, theme),
    css: () => {
      try {
        return String(css(source));
      } catch (error) {
        throw new CannotRun(tokenPaths.generator, describe(error));
      }
    },
  };
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

const fields = new Set(["theme", "fg", "bg", "kind", "figure", "status", "reason", "source"]);
const decimal = /^\d+(?:\.\d+)?$/;

/** The problem with one parsed entry, or undefined when it is an entry of the schema. */
function entryProblem(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "is not an object";
  const entry = value as Record<string, unknown>;
  const name = (field: string): boolean => typeof entry[field] === "string" && entry[field] !== "";
  if (entry.theme !== "light" && entry.theme !== "dark") return ": theme must be light or dark";
  if (!name("fg")) return ": fg must be a token name";
  if (!name("bg")) return ": bg must be a token name";
  if (entry.kind !== "text" && entry.kind !== "non-text") return ": kind must be text or non-text";
  if (typeof entry.figure !== "string" || !decimal.test(entry.figure)) return ": figure must be a decimal number written as a string";
  if (entry.status !== "checked" && entry.status !== "excluded") return ": status must be checked or excluded";
  if (entry.reason !== undefined && typeof entry.reason !== "string") return ": reason must be a string";
  if (entry.source !== "#5" && entry.source !== "computed") return ": source must be #5 or computed";
  const unknown = Object.keys(entry).find((field) => !fields.has(field));
  return unknown === undefined ? undefined : `: unknown field ${unknown}`;
}

/** The entries of a JSON list; throws when the text is not JSON or not a list. */
function jsonList(text: string): unknown[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`not JSON (${describe(error)})`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("not a list of pairs");
  return value as unknown[];
}

/** The line (1-based) each of `count` object entries starts on; throws unless the list holds one entry per line. */
function startLines(text: string, count: number): number[] {
  const lines = text.split("\n").flatMap((line, index) => (line.trimStart().startsWith("{") ? [index + 1] : []));
  if (lines.length !== count) throw new Error("not one entry per line");
  return lines;
}

/**
 * The pair list of a pairs.json text; throws an Error naming the cause when it is not JSON, not a list of entries of
 * the schema, or not one entry per line (data-model.md § Contrast pair). An entry's line is the line it starts on.
 */
export function parsePairs(text: string): PairList {
  const entries = jsonList(text);
  entries.forEach((entry, index) => {
    const problem = entryProblem(entry);
    if (problem !== undefined) throw new Error(`entry ${String(index + 1)}${problem.startsWith(":") ? "" : " "}${problem}`);
  });
  return { entries: entries as PairEntry[], lines: startLines(text, entries.length) };
}

/** The pair list under `root`; throws CannotRun naming the pair list. */
export async function readPairs(root: string): Promise<PairList> {
  let text: string;
  try {
    text = await readFile(join(root, tokenPaths.pairs), "utf8");
  } catch (error) {
    throw new CannotRun(tokenPaths.pairs, `cannot read it (${describe(error)})`);
  }
  try {
    return parsePairs(text);
  } catch (error) {
    throw new CannotRun(tokenPaths.pairs, describe(error));
  }
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
  return source.flatMap((record) => {
    const { contrast } = record;
    if (contrast === undefined) return [];
    return contrast.grounds.flatMap((bg) => themes.map((theme) => ({ theme, fg: record.name, bg, kind: contrast.kind })));
  });
}

/**
 * The lines (1-based) of a text that hold the record of the token `name`: its `name` field as source.ts writes it
 * (`name: "<name>"`) or as overrides.ts holds it in JSON (`"name":"<name>"`).
 */
export function tokenLines(text: string, name: string): number[] {
  const quoted = JSON.stringify(name);
  const forms = [`name: ${quoted}`, `"name":${quoted}`];
  return text.split("\n").flatMap((line, index) => (forms.some((form) => line.includes(form)) ? [index + 1] : []));
}

/** The lines (1-based) of a pairs.json text that hold the entry of `(theme, fg, bg)`; throws when it is not a JSON list of one object per line. */
export function pairLines(text: string, theme: string, fg: string, bg: string): number[] {
  const entries = jsonList(text) as Record<string, unknown>[];
  const lines = startLines(text, entries.length);
  return entries.flatMap((entry, index) => (entry.theme === theme && entry.fg === fg && entry.bg === bg ? [Number(lines[index])] : []));
}

/** The location of a finding about a token under `root`: its record in source.ts, or in overrides.ts if only added there. */
export async function tokenLocator(root: string): Promise<(name: string) => Location> {
  const sourceText = await readFile(join(root, tokenPaths.source), "utf8");
  const overridesText = await readFile(join(root, tokenPaths.overrides), "utf8");
  return (name) => {
    const [inSource] = tokenLines(sourceText, name);
    if (inSource !== undefined) return { path: tokenPaths.source, line: inSource };
    const [inOverrides] = tokenLines(overridesText, name);
    return inOverrides === undefined ? { path: tokenPaths.source } : { path: tokenPaths.overrides, line: inOverrides };
  };
}
