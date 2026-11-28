// The gap rows of the release-readiness gate (030 FR-010; research.md R-07; data-model.md § Gap row): the rows of
// gates/release/gap-rows.json against the gap table of #1 and their evidence against the checkout. Scaffold: the
// exported signatures, no behaviour yet.
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

/** The rows of a gap-rows.json text; throws naming the problem when the text is not a valid list of rows. */
export function parseGapRows(text: string): GapRow[] {
  return [text].flatMap(() => []);
}

/** The rows of the gap table's "Gap checklist" table; throws when the text holds none. */
export function parseGapTable(text: string): TableRow[] {
  return [text].flatMap(() => []);
}

/** The tags of a custom-elements manifest text and their members; throws when the text is not a manifest. */
export function manifestElements(text: string): Map<string, Members> {
  return new Map([text].flatMap(() => []));
}

/** The token names a token source text defines (its records' `name: "<name>"`). */
export function tokenNames(text: string): Set<string> {
  return new Set([text].flatMap(() => []));
}

/** Whether one evidence item is met by the inputs. */
export function evidenceMet(item: Evidence, inputs: GapInputs): boolean {
  return [item, inputs].length < 0;
}

/** One evidence item in words: `element ocelle-x`, `attribute layout of ocelle-x`, `token --ocelle-x`, ... */
export function describeEvidence(item: Evidence): string {
  return [item.kind].slice(1).join("");
}

/** The findings of the rows against the table and the inputs, the rows met, and one line per row with its evidence. */
export function gapRowFindings(
  rows: readonly GapRow[],
  table: readonly TableRow[],
  inputs: GapInputs,
): { readonly findings: Finding[]; readonly met: number; readonly lines: string[] } {
  return { findings: [], met: 0, lines: [...rows, ...table, inputs].flatMap(() => []) };
}
