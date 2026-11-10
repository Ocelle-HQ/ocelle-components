// The custom-elements manifest generator (005 FR-007, research.md R-06; reviews/phase-2/spike.md § 2): the analyzer
// (@custom-elements-manifest/analyzer 0.11.0, a root devDependency) runs in process through its `create` API with its
// Lit plugin over packages/elements/src/ocelle-*.ts, as its CLI does with custom-elements-manifest.config.mjs, and the
// output is normalised: every element declaration states its slots, events, CSS parts and CSS custom properties, empty
// when it has none (FR-007); `IconName` in a type is expanded to the union of the icon names, read from the
// `IconName` type of src/icons.ts (US1-11); members and attributes that are not public are dropped, and so is the
// observed `aria-label` attribute, a standard attribute and not a member (FR-034); every object's keys are sorted, so
// the file is stable. `node scripts/manifest.ts` (the package's `manifest` script) writes custom-elements.json; the
// manifest gate (gates/bin/manifest.ts) generates the same into memory and compares.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { create, ts } from "@custom-elements-manifest/analyzer";
import { litPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";

/** A custom-elements manifest (schema 1.0.0), as JSON. */
export type Manifest = Record<string, unknown>;

type Json = Record<string, unknown>;

const sourceDir = "packages/elements/src";
const element = /^ocelle-[\w-]+\.ts$/;
/** Attributes every element may observe that are standard attributes, not its members (FR-034). */
const standardAttributes = new Set(["aria-label"]);
const memberLists = ["slots", "events", "cssParts", "cssProperties"] as const;

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

function isPublic(member: Json): boolean {
  return member.privacy !== "private" && member.privacy !== "protected" && !String(member.name).startsWith("#");
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

export function normalise(raw: Manifest, names: readonly string[]): Manifest {
  const union = names.length === 0 ? undefined : names.map((name) => JSON.stringify(name)).join(" | ");
  const modules = list(raw.modules).map((module) => ({ ...module, declarations: list(module.declarations).map((declaration) => normaliseDeclaration(declaration, union)) }));
  return sorted({ ...raw, modules }) as Manifest;
}

/** The string literals of the `IconName` type alias of `text` (src/icons.ts), in order; none without the alias. */
function iconNames(text: string): string[] {
  const file = ts.createSourceFile("icons.ts", text, ts.ScriptTarget.ES2015, true);
  for (const statement of file.statements) {
    if (!ts.isTypeAliasDeclaration(statement) || statement.name.text !== "IconName" || !ts.isUnionTypeNode(statement.type)) continue;
    return statement.type.types.flatMap((member) => (ts.isLiteralTypeNode(member) && ts.isStringLiteral(member.literal) ? [member.literal.text] : []));
  }
  return [];
}

export function generate(root: string): Promise<Manifest> {
  const dir = join(root, sourceDir);
  const files = existsSync(dir) ? readdirSync(dir).filter((name) => element.test(name)).sort() : [];
  if (files.length === 0) return Promise.reject(new Error(`no element module ${sourceDir}/ocelle-*.ts under ${root}`));
  const modules = files.map((name) => ts.createSourceFile(`src/${name}`, readFileSync(join(dir, name), "utf8"), ts.ScriptTarget.ES2015, true));
  const raw = create({ modules, plugins: litPlugin(), context: { dev: false } });
  const icons = join(dir, "icons.ts");
  return Promise.resolve(normalise(raw, existsSync(icons) ? iconNames(readFileSync(icons, "utf8")) : []));
}

export function serialise(manifest: Manifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

// Stryker disable next-line all: process boundary, covered by the manifest gate (gates/test/manifest.test.ts "exits 0 on the repository"), which compares the file this writes with a regeneration
if (import.meta.main) {
  const root = fileURLToPath(new URL("../../..", import.meta.url));
  writeFileSync(join(root, "packages/elements/custom-elements.json"), serialise(await generate(root)));
}
