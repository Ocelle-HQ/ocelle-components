// The manifest gate (005 FR-009, US1 scenario 12; research.md R-06; contracts/checks.md § New gate `manifest`): it
// generates the custom-elements manifest from packages/elements/src/ocelle-*.ts under `--root` with the package's own
// generator (packages/elements/scripts/manifest.ts, the analyzer in process) and compares it with the committed
// packages/elements/custom-elements.json, key order aside. Exit 1:
// - `stale`, at the committed manifest: one finding per differing member `<element>.<kind>.<name>` (kinds property,
//   attribute, event, slot, css-part, css-property), per element that only one of the two manifests declares, or one
//   whole-file finding when the manifests differ only outside the elements' members;
// - `no-description`, at the element's module: one finding per public member of the six kinds that the generated
//   manifest gives no non-empty description.
// Exit 2: the committed manifest missing or not JSON, or no element module to analyse.
import { readFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { generate } from "../../packages/elements/scripts/manifest.ts";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit, plural } from "../lib/findings.ts";
import type { Finding } from "../lib/findings.ts";

const gate = "manifest";
const manifestPath = "packages/elements/custom-elements.json";
const remedy = "regenerate it with pnpm --filter @ocelle/elements run manifest";

type Json = Record<string, unknown>;

/** The member kinds of FR-009, each with the declaration's list that holds it. */
const kinds = [
  ["property", "members"],
  ["attribute", "attributes"],
  ["event", "events"],
  ["slot", "slots"],
  ["css-part", "cssParts"],
  ["css-property", "cssProperties"],
] as const;

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function list(value: unknown): Json[] {
  return Array.isArray(value) ? value.filter(isObject) : [];
}

/** One element of a manifest: its name (tag name, else class name), its module's path and its declaration. */
interface Element {
  readonly name: string;
  readonly path: string;
  readonly declaration: Json;
}

function elementsOf(manifest: unknown): Map<string, Element> {
  const found = new Map<string, Element>();
  for (const module of list(isObject(manifest) ? manifest.modules : undefined)) {
    for (const declaration of list(module.declarations)) {
      if (declaration.customElement !== true) continue;
      const name = String(declaration.tagName ?? declaration.name);
      found.set(name, { name, path: String(module.path), declaration });
    }
  }
  return found;
}

/** The public members of one kind of a declaration, by name. */
function membersOf(declaration: Json | undefined, field: string): Map<string, Json> {
  const members = list(declaration?.[field]).filter((member) => member.privacy !== "private" && member.privacy !== "protected");
  return new Map(members.map((member) => [String(member.name), member]));
}

function staleFinding(message: string): Finding {
  return { location: { path: manifestPath }, gate, rule: "stale", message };
}

/** The stale findings of two manifests: per differing member, per element in one only, or one for the whole file. */
function staleFindings(committed: unknown, generated: unknown): Finding[] {
  const old = elementsOf(committed);
  const now = elementsOf(generated);
  const messages: string[] = [];
  for (const name of [...new Set([...old.keys(), ...now.keys()])].sort()) {
    const before = old.get(name);
    const after = now.get(name);
    if (before === undefined || after === undefined) {
      messages.push(`${name} is not in the ${before === undefined ? "committed" : "generated"} manifest`);
      continue;
    }
    for (const [kind, field] of kinds) {
      const was = membersOf(before.declaration, field);
      const is = membersOf(after.declaration, field);
      for (const member of [...new Set([...was.keys(), ...is.keys()])]) {
        if (!isDeepStrictEqual(was.get(member), is.get(member))) messages.push(`${name}.${kind}.${member} differs from the generated manifest`);
      }
    }
  }
  if (messages.length === 0 && !isDeepStrictEqual(committed, generated)) return [staleFinding("the committed manifest differs from the generated manifest")];
  return messages.sort().map(staleFinding);
}

/** The no-description findings of the generated manifest: one per public member of the six kinds without a description. */
function descriptionFindings(generated: unknown): Finding[] {
  const findings: Finding[] = [];
  for (const element of elementsOf(generated).values()) {
    const messages: string[] = [];
    for (const [kind, field] of kinds) {
      for (const [member, entry] of membersOf(element.declaration, field)) {
        if (typeof entry.description !== "string" || entry.description.trim() === "") messages.push(`${element.name}.${kind}.${member} has no description`);
      }
    }
    for (const message of messages.sort()) findings.push({ location: { path: `packages/elements/${element.path}` }, gate, rule: "no-description", message });
  }
  return findings;
}

/** The findings of a committed manifest against the generated one: stale members and undescribed public members. */
export function manifestFindings(committed: unknown, generated: unknown): Finding[] {
  return [...staleFindings(committed, generated), ...descriptionFindings(generated)];
}

/** The committed manifest's JSON, or the reason it cannot be read. */
async function committedManifest(root: string): Promise<{ readonly json: unknown } | { readonly problem: string }> {
  let text: string;
  try {
    text = await readFile(`${root}/${manifestPath}`, "utf8");
  } catch {
    return { problem: `${manifestPath} is missing` };
  }
  try {
    return { json: JSON.parse(text) as unknown };
  } catch (error) {
    return { problem: `${manifestPath} is not JSON (${error instanceof Error ? error.message : String(error)})` };
  }
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  const { root } = parseArgs(argv, io.cwd);
  const fail = (cause: string): number => emit({ exit: 2, cause: `${gate}: could not run: ${cause}` }, io.out, io.err);
  const committed = await committedManifest(root);
  if ("problem" in committed) return fail(committed.problem);
  let generated: unknown;
  try {
    generated = await generate(root);
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
  const findings = manifestFindings(committed.json, generated);
  if (findings.length > 0) return emit({ exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")}; ${remedy}` }, io.out, io.err);
  return emit({ exit: 0, summary: `${gate}: ${plural(elementsOf(generated).size, "element")} checked, no finding` }, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/manifest.test.ts "exits 0 on pass-repository's temporary repository"
if (import.meta.main) await main(run);
