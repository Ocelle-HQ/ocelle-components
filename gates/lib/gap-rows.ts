// The gap rows of the release-readiness gate (030 FR-010; research.md R-07; data-model.md § Gap row): the rows of
// gates/release/gap-rows.json against the gap table of #1 (sources/issue-1-gap-table.md: upstream, need and "Met in"
// verbatim, in order, so a row cannot be dropped or reworded to pass) and their evidence against the checkout: a tag
// or a member of the custom-elements manifest, a token of the token source, a selector in a stylesheet of
// packages/styles/src/, or a spec directory with a verification.md. A row is met when every item is met and one item
// is not of kind spec. Pure, tested in process (gates/test/release-readiness.test.ts).
import type { Finding } from "./findings.ts";

/** The member kinds of a `member` evidence item, as the custom-elements manifest declares them. */
export type MemberKind = "attribute" | "field" | "slot" | "cssPart" | "event" | "cssProperty";

/** One evidence item of a gap row. */
export type Evidence =
  | { readonly kind: "element"; readonly tag: string }
  | { readonly kind: "member"; readonly tag: string; readonly memberKind: MemberKind; readonly name: string }
  | { readonly kind: "token"; readonly name: string }
  | { readonly kind: "style-hook"; readonly file: string; readonly selector: string }
  | { readonly kind: "spec"; readonly dir: string };

/** One row of the gap table (sources/issue-1-gap-table.md). */
export interface TableRow {
  readonly upstream: readonly string[];
  readonly need: string;
  readonly metIn: string;
}

/** One row of gates/release/gap-rows.json. */
export interface GapRow extends TableRow {
  readonly evidence: readonly Evidence[];
}

/** The members a tag declares, by member kind. */
export type Members = Readonly<Record<MemberKind, readonly string[]>>;

/** What the evidence is checked against: the manifest's tags, the token names, the stylesheets and the spec dirs. */
export interface GapInputs {
  readonly elements: ReadonlyMap<string, Members>;
  readonly tokens: ReadonlySet<string>;
  readonly styles: ReadonlyMap<string, string>;
  readonly specs: ReadonlySet<string>;
}

/** The repository paths of the two files the rows are read from. */
export const gapRowsPath = "gates/release/gap-rows.json";
export const gapTablePath = "specs/030-release-v1/sources/issue-1-gap-table.md";

const gate = "release-readiness";
const memberKinds: readonly MemberKind[] = ["attribute", "field", "slot", "cssPart", "event", "cssProperty"];
const rowKeys = new Set(["upstream", "need", "metIn", "evidence"]);

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

/** Whether a value is exactly one evidence item of a known kind, every field a non-empty string. */
function isEvidence(value: unknown): value is Evidence {
  if (!object(value)) return false;
  const fields: Readonly<Record<string, readonly string[]>> = {
    element: ["tag"],
    member: ["tag", "memberKind", "name"],
    token: ["name"],
    "style-hook": ["file", "selector"],
    spec: ["dir"],
  };
  const wanted = fields[String(value.kind)];
  if (wanted === undefined) return false;
  const keys = Object.keys(value);
  if (keys.length !== wanted.length + 1 || !wanted.every((key) => text(value[key]))) return false;
  return value.kind !== "member" || memberKinds.includes(value.memberKind as MemberKind);
}

/** The rows of a gap-rows.json text; throws naming the problem when the text is not a valid list of rows. */
export function parseGapRows(source: string): GapRow[] {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error("gap-rows.json is not valid JSON", { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("gap-rows.json is not a list of rows");
  return value.map((row: unknown, index) => {
    const at = `row ${String(index + 1)}`;
    if (!object(row)) throw new Error(`${at} is not an object`);
    const unknown = Object.keys(row).find((key) => !rowKeys.has(key));
    if (unknown !== undefined) throw new Error(`${at}: unknown key ${unknown}`);
    const { upstream, need, metIn, evidence } = row;
    if (!Array.isArray(upstream) || upstream.length === 0 || !upstream.every((item) => typeof item === "string" && /^#\d+$/.test(item))) {
      throw new Error(`${at}: upstream must be a non-empty list of issue numbers (#<n>)`);
    }
    if (!text(need)) throw new Error(`${at}: need must be a non-empty string`);
    if (!text(metIn)) throw new Error(`${at}: metIn must be a non-empty string`);
    if (!Array.isArray(evidence) || evidence.length === 0) throw new Error(`${at}: evidence must be a non-empty list`);
    const bad = evidence.findIndex((item) => !isEvidence(item));
    if (bad !== -1) throw new Error(`${at}: evidence ${String(bad + 1)} is not an element, member, token, style-hook or spec item`);
    return { upstream: upstream as string[], need, metIn, evidence: evidence as Evidence[] };
  });
}

/** The cells of a Markdown table line, trimmed. */
function cells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

/** The rows of the gap table's "Gap checklist" table; throws when the text holds none. */
export function parseGapTable(source: string): TableRow[] {
  const lines = source.split(/\r?\n/);
  const header = lines.findIndex((line) => /^\|\s*Upstream\s*\|\s*Need\s*\|\s*Met in\s*\|\s*$/.test(line));
  const rows: TableRow[] = [];
  if (header !== -1) {
    for (const line of lines.slice(header + 2)) {
      if (!line.trim().startsWith("|")) break;
      const [upstream = "", need = "", metIn = ""] = cells(line);
      rows.push({ upstream: upstream.split(/\s+/).filter(Boolean), need, metIn });
    }
  }
  if (rows.length === 0) throw new Error("the text holds no gap-table row");
  return rows;
}

/** The names of a manifest declaration's list (attributes, slots, ...), in order. */
function names(list: unknown, keep: (item: Record<string, unknown>) => boolean = () => true): string[] {
  return Array.isArray(list) ? list.filter((item): item is Record<string, unknown> => object(item) && typeof item.name === "string" && keep(item)).map((item) => String(item.name)) : [];
}

/** The tags of a custom-elements manifest text and their members; throws when the text is not a manifest. */
export function manifestElements(source: string): Map<string, Members> {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    throw new Error("custom-elements.json is not valid JSON", { cause: error });
  }
  if (!object(value) || !Array.isArray(value.modules)) throw new Error("custom-elements.json has no modules list");
  const elements = new Map<string, Members>();
  for (const module of value.modules as unknown[]) {
    const declarations = object(module) && Array.isArray(module.declarations) ? (module.declarations as unknown[]) : [];
    for (const declaration of declarations) {
      if (!object(declaration) || typeof declaration.tagName !== "string") continue;
      elements.set(declaration.tagName, {
        attribute: names(declaration.attributes),
        field: names(declaration.members, (item) => item.kind === "field"),
        slot: names(declaration.slots),
        cssPart: names(declaration.cssParts),
        event: names(declaration.events),
        cssProperty: names(declaration.cssProperties),
      });
    }
  }
  return elements;
}

/** The token names a token source text defines (its records' `name: "<name>"`). */
export function tokenNames(source: string): Set<string> {
  return new Set([...source.matchAll(/\bname: "([a-z][a-z0-9-]*)"/g)].map((match) => String(match[1])));
}

/** Whether one evidence item is met by the inputs. */
export function evidenceMet(item: Evidence, inputs: GapInputs): boolean {
  switch (item.kind) {
    case "element":
      return inputs.elements.has(item.tag);
    case "member":
      return inputs.elements.get(item.tag)?.[item.memberKind].includes(item.name) ?? false;
    case "token":
      return inputs.tokens.has(item.name);
    case "style-hook":
      return inputs.styles.get(item.file)?.includes(item.selector) ?? false;
    case "spec":
      return inputs.specs.has(item.dir);
  }
}

/** One evidence item in words: `element ocelle-x`, `attribute layout of ocelle-x`, `token --ocelle-x`, ... */
export function describeEvidence(item: Evidence): string {
  switch (item.kind) {
    case "element":
      return `element ${item.tag}`;
    case "member":
      return `${item.memberKind} ${item.name} of ${item.tag}`;
    case "token":
      return `token --ocelle-${item.name}`;
    case "style-hook":
      return `style hook ${item.selector} in packages/styles/src/${item.file}`;
    case "spec":
      return `spec ${item.dir}`;
  }
}

/** `a`, `a and b`, `a, b and c`. */
function listed(words: readonly string[]): string {
  return words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${String(words.at(-1))}`;
}

/** The findings of the rows against the table and the inputs, the rows met, and one line per row with its evidence. */
export function gapRowFindings(
  rows: readonly GapRow[],
  table: readonly TableRow[],
  inputs: GapInputs,
): { readonly findings: Finding[]; readonly met: number; readonly lines: string[] } {
  const finding = (rule: string, message: string): Finding => ({ location: { path: gapRowsPath }, gate, rule, message });
  const findings: Finding[] = [];
  if (rows.length !== table.length) {
    findings.push(finding("gap-rows-mismatch", `lists ${String(rows.length)} ${rows.length === 1 ? "row" : "rows"}, ${gapTablePath} ${String(table.length)}`));
  }
  for (const [index, row] of rows.entries()) {
    const source = table[index];
    if (source === undefined) continue;
    const differ = [
      ...(row.upstream.join(" ") === source.upstream.join(" ") ? [] : ["upstream"]),
      ...(row.need === source.need ? [] : ["need"]),
      ...(row.metIn === source.metIn ? [] : ["metIn"]),
    ];
    if (differ.length > 0) findings.push(finding("gap-rows-mismatch", `row ${String(index + 1)}: ${listed(differ)} ${differ.length === 1 ? "differs" : "differ"} from ${gapTablePath}`));
  }
  let met = 0;
  const lines: string[] = [];
  for (const [index, row] of rows.entries()) {
    const name = `row ${String(index + 1)} (${row.upstream.join(" ")})`;
    const missing = row.evidence.filter((item) => !evidenceMet(item, inputs));
    const specOnly = row.evidence.every((item) => item.kind === "spec");
    if (specOnly) {
      findings.push(finding("gap-row-unmet", `${name}: only spec evidence (${row.evidence.map(describeEvidence).join(", ")}); a row needs an element, member, token or style-hook item`));
    } else if (missing.length > 0) {
      findings.push(finding("gap-row-unmet", `${name}: missing ${missing.map(describeEvidence).join(", ")}`));
    }
    if (specOnly || missing.length > 0) {
      lines.push(`${gate}: ${name} not met`);
    } else {
      met += 1;
      lines.push(`${gate}: ${name} met: ${row.evidence.map(describeEvidence).join(", ")}`);
    }
  }
  return { findings, met, lines };
}
