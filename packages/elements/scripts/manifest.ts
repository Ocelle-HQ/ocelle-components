// The custom-elements manifest generator (005 FR-007, research.md R-06; reviews/phase-2/spike.md § 2): the analyzer
// (@custom-elements-manifest/analyzer 0.11.0, a root devDependency) runs in process through its `create` API with its
// Lit plugin over packages/elements/src/ocelle-*.ts and the overlays' internal base src/overlay.ts (008 research.md
// R-01), as its CLI does with custom-elements-manifest.config.mjs, and the output is normalised: the internal base's
// module is removed, so the manifest publishes the element modules only, while the members an element inherits from the
// base stay listed on it with `inheritedFrom`; every element declaration states its slots, events, CSS parts and CSS
// custom properties, empty when it has none (FR-007); `IconName` in a type is expanded to the union of the icon names,
// read from the `IconName` type of src/icons.ts (US1-11); modules are ordered by path, by code point; members and
// attributes that are not public are dropped, and so is the observed `aria-label` attribute, a standard attribute and
// not a member (FR-034); every object's keys are sorted, so the file is stable. `node scripts/manifest.ts` (the
// package's `manifest` script) writes custom-elements.json; the manifest gate (gates/bin/manifest.ts) generates the
// same into memory and compares.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import * as analyzer from "@custom-elements-manifest/analyzer";
import type { Plugin } from "@custom-elements-manifest/analyzer";
import type TypeScript from "typescript";

/**
 * The parts of the analyzer this script uses. Its index.d.ts declares the plugin types but not its `create` and `ts`
 * exports, and its Lit plugin module has no types; `ts` is the analyzer's own TypeScript (5.4.5), typed by the
 * repository's, whose `createSourceFile`, `ScriptTarget` and node guards it shares.
 */
interface Analyzer {
  readonly create: (options: { readonly modules: readonly TypeScript.SourceFile[]; readonly plugins: readonly Plugin[] }) => Manifest;
  readonly ts: typeof TypeScript;
}
const { create, ts } = analyzer as unknown as Analyzer;
const litPluginModule = "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";
const { litPlugin } = (await import(litPluginModule)) as { readonly litPlugin: () => Plugin[] };

/** A custom-elements manifest (schema 1.0.0), as JSON. */
export type Manifest = Record<string, unknown>;

type Json = Record<string, unknown>;

const sourceDir = "packages/elements/src";
const element = /^ocelle-[\w-]+\.ts$/;
/**
 * The overlays' internal base (008 research.md R-01, operator decision "analyse, then drop it", 2026-11-14): read with
 * the element modules, so the members an element inherits from it are listed on the element with `inheritedFrom`,
 * then removed from the published manifest, which holds no internal module.
 */
const internalBase = "overlay.ts";
/** Attributes every element may observe that are standard attributes, not its members (FR-034). */
const standardAttributes = new Set(["aria-label"]);
const memberLists = ["slots", "events", "cssParts", "cssProperties"] as const;
const iconsFile = "icons.ts";
const manifestFile = "packages/elements/custom-elements.json";

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function list(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

/** The same JSON with every object's keys sorted. */
function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (!isObject(value)) return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
}

/** A member or attribute with `IconName` in its type text expanded to the union of `names`. */
function expanded(entry: Json, union: string | undefined): Json {
  const type = entry.type;
  if (union === undefined || !isObject(type) || typeof type.text !== "string") return entry;
  return { ...entry, type: { ...type, text: type.text.replace(/\bIconName\b/g, union) } };
}

/** A member the analyzer does not mark private or protected (it marks `#` fields private). */
function isPublic(member: Json): boolean {
  return member.privacy !== "private" && member.privacy !== "protected";
}

function normaliseDeclaration(declaration: Json, union: string | undefined): Json {
  if (declaration.customElement !== true) return declaration;
  const members = list(declaration.members).filter(isPublic);
  const fields = new Set(members.map((member) => member.name));
  const attributes = list(declaration.attributes).filter(
    (attribute) => !standardAttributes.has(String(attribute.name)) && (attribute.fieldName === undefined || fields.has(attribute.fieldName)),
  );
  const out: Json = { ...declaration, members: members.map((member) => expanded(member, union)), attributes: attributes.map((attribute) => expanded(attribute, union)) };
  for (const key of memberLists) out[key] = list(declaration[key]);
  return out;
}

/** Orders two strings by UTF-16 code unit, whatever the process's locale (phase 2 review R1-06). */
function byCodePoint(a: string, b: string): number {
  // Module paths are distinct (one module per file); two equal ones keep their order (test/node/manifest.test.ts).
  return a < b ? -1 : 1;
}

export function normalise(raw: Manifest, names: readonly string[]): Manifest {
  const union = names.length === 0 ? undefined : names.map((name) => JSON.stringify(name)).join(" | ");
  const modules = list(raw.modules)
    .map((module): Json => ({ ...module, declarations: list(module.declarations).map((declaration) => normaliseDeclaration(declaration, union)) }))
    .sort((a, b) => byCodePoint(String(a.path), String(b.path)));
  return sorted({ ...raw, modules }) as Manifest;
}

/**
 * The string literals of the `IconName` type alias in the text of src/icons.ts, in order (a union of them, or one);
 * none without the alias.
 */
export function iconNames(text: string): string[] {
  const file = ts.createSourceFile(iconsFile, text, ts.ScriptTarget.ES2015);
  for (const statement of file.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || statement.name.text !== "IconName") continue;
    const members = ts.isUnionTypeNode(statement.type) ? statement.type.types : [statement.type];
    return members.flatMap((member) => (ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal) ? [member.literal.text] : []));
  }
  return [];
}

export function generate(root: string): Promise<Manifest> {
  const dir = join(root, sourceDir);
  const names = existsSync(dir) ? readdirSync(dir) : [];
  const files = names.filter((name) => element.test(name));
  if (files.length === 0) return Promise.reject(new Error(`no element module ${sourceDir}/ocelle-*.ts under ${root}`));
  const read = [...files, ...names.filter((name) => name === internalBase)];
  const modules = read.map((name) => ts.createSourceFile(`src/${name}`, readFileSync(join(dir, name), "utf8"), ts.ScriptTarget.ES2015, true));
  const analysed = create({ modules, plugins: litPlugin() });
  const raw = { ...analysed, modules: list(analysed.modules).filter((module) => module.path !== `src/${internalBase}`) };
  const icons = join(dir, iconsFile);
  return Promise.resolve(normalise(raw, existsSync(icons) ? iconNames(readFileSync(icons, "utf8")) : []));
}

export function serialise(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/** Writes packages/elements/custom-elements.json under `root` (the repository root) from its element source. */
export async function writeManifest(root: string): Promise<void> {
  writeFileSync(join(root, manifestFile), serialise(await generate(root)));
}

// Stryker disable next-line all: process boundary, the package's manifest script; writeManifest is tested in test/node/manifest.test.ts and the manifest gate compares the file it writes with a regeneration
if (import.meta.main) await writeManifest(fileURLToPath(new URL("../../..", import.meta.url)));
