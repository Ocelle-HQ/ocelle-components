// The lists the unknown-token check of ocelle/token-only reads under the repository root (FR-010, research.md R-09,
// data-model.md § Element property list): the full names of the tokens of packages/tokens/src/source.ts (validated by
// the root's own generator), and the custom property names that packages/elements/custom-elements.json declares
// (empty while the file is absent). Any problem throws a cause naming the file, which stops Stylelint: the gate's
// exit 2 (contracts/gates.md § `style-lint`).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** The token names and element custom property names, full (`--ocelle-…`). */
export interface TokenLists {
  readonly tokens: readonly string[];
  readonly elementProperties: readonly string[];
}

const sourcePath = "packages/tokens/src/source.ts";
const generatorPath = "packages/tokens/src/generate.ts";
const manifestPath = "packages/elements/custom-elements.json";

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Throws when an element property has the full name of a token (the exact-name clash of FR-010). */
export function checkLists(lists: TokenLists): void {
  const clash = lists.elementProperties.find((name) => lists.tokens.includes(name));
  if (clash !== undefined) throw new Error(`token-only: element property ${clash} has the name of a token`);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The cssProperties names of a parsed manifest, or the reason it is not a custom-elements manifest. */
export function manifestProperties(manifest: unknown): string[] | string {
  if (!isObject(manifest)) return "not an object";
  if (typeof manifest.schemaVersion !== "string") return "no schemaVersion";
  if (!Array.isArray(manifest.modules)) return "modules is not a list";
  const names: string[] = [];
  for (const module of manifest.modules as unknown[]) {
    if (!isObject(module)) return "a module is not an object";
    const { declarations } = module;
    if (declarations === undefined) continue;
    if (!Array.isArray(declarations)) return "declarations is not a list";
    for (const declaration of declarations as unknown[]) {
      if (!isObject(declaration)) return "a declaration is not an object";
      const { cssProperties } = declaration;
      if (cssProperties === undefined) continue;
      if (!Array.isArray(cssProperties)) return "cssProperties is not a list";
      for (const property of cssProperties as unknown[]) {
        if (!isObject(property) || typeof property.name !== "string") return "a cssProperties entry has no name";
        names.push(property.name);
      }
    }
  }
  return names;
}

/** The element custom property names the manifest under `root` declares; none while it does not exist. */
async function elementProperties(root: string): Promise<string[]> {
  let text: string;
  try {
    text = await readFile(join(root, manifestPath), "utf8");
  } catch (error) {
    if ((error as { code?: unknown }).code === "ENOENT") return [];
    throw new Error(`token-only: cannot read ${manifestPath}: ${describe(error)}`, { cause: error });
  }
  let manifest: unknown;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new Error(`token-only: ${manifestPath} is not JSON (${describe(error)})`, { cause: error });
  }
  const names = manifestProperties(manifest);
  if (typeof names === "string") throw new Error(`token-only: ${manifestPath} is not a custom-elements manifest (${names})`);
  return names;
}

/** The token names of the source under `root`, after the root's validateSource(). */
async function tokenNames(root: string): Promise<string[]> {
  let records: readonly { readonly name: string }[];
  let validate: (source: unknown) => void;
  try {
    const sourceModule = (await import(pathToFileURL(join(root, sourcePath)).href)) as { source?: unknown };
    const generator = (await import(pathToFileURL(join(root, generatorPath)).href)) as { validateSource?: unknown };
    if (!Array.isArray(sourceModule.source)) throw new Error("it exports no source list");
    if (typeof generator.validateSource !== "function") throw new Error(`${generatorPath} exports no validateSource`);
    records = sourceModule.source as { name: string }[];
    validate = generator.validateSource as (source: unknown) => void;
  } catch (error) {
    throw new Error(`token-only: cannot load the token source ${sourcePath}: ${describe(error)}`, { cause: error });
  }
  try {
    validate(records);
  } catch (error) {
    throw new Error(`token-only: the token source ${sourcePath} is invalid: ${describe(error)}`, { cause: error });
  }
  return records.map((record) => `--ocelle-${record.name}`);
}

/** The lists of the repository at `root`; throws naming the file and the cause when they cannot be read. */
export async function loadLists(root: string): Promise<TokenLists> {
  const lists = { tokens: await tokenNames(root), elementProperties: await elementProperties(root) };
  checkLists(lists);
  return lists;
}
