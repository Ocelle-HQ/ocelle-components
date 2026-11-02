// Equivalent-mutant records and disable forms (FR-012, data-model.md). Scaffold: signatures only.
import type { Finding } from "../findings.ts";
import type { ChangedFile } from "./ranges.ts";

/** A reasoned next-line record in changed code. */
export interface EquivalentRecord {
  readonly path: string;
  readonly line: number;
  readonly mutator: string;
  readonly reason: string;
}

/** The records listed for the review, and the disable forms that are findings. */
export interface RecordScan {
  readonly records: readonly EquivalentRecord[];
  readonly findings: readonly Finding[];
}

export function scanRecords(_file: ChangedFile, _source: string): RecordScan {
  return { records: [], findings: [] };
}

/** The record line `<path>:<line>: mutation: record: <mutator>: <reason>` (data-model.md § Finding). */
export function formatRecord(_record: EquivalentRecord): string {
  return "";
}
