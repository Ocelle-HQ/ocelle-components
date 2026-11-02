// Equivalent-mutant records and disable forms (FR-012, data-model.md § Equivalent-mutant record). The one accepted
// form is a whole-line next-line record with a reason, written exactly as Stryker reads it, directly above the
// mutated line. Records whose own line or mutated line changed are listed for the review; a record without a reason
// and every other disable or restore comment anywhere in a changed file is a finding (rule disable-form).
import type { Finding } from "../findings.ts";
import type { ChangedFile, LineRange } from "./ranges.ts";

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

const directive = /\/[/*]\s*Stryker\s+(?:disable|restore)\b/;
const nextLine = /^\s*\/\/\s?Stryker disable next-line ([a-zA-Z, ]+)(?::(.*))?/;
const noReason = "equivalent-mutant record without a reason; write the reason after the colon (FR-012)";
const otherForm = "only a reasoned next-line record directly above the mutated line may disable mutants (FR-012)";

/** Whether the record on `line`, or the line it applies to, is a changed line. */
function changedAt(ranges: readonly LineRange[], line: number): boolean {
  return ranges.some((range) => range.start <= line + 1 && range.end >= line);
}

export function scanRecords(file: ChangedFile, source: string): RecordScan {
  const records: EquivalentRecord[] = [];
  const findings: Finding[] = [];
  const disableForm = (line: number, message: string): void => {
    findings.push({ location: { path: file.path, line }, gate: "mutation", rule: "disable-form", message });
  };
  source.split("\n").forEach((text, index) => {
    const line = index + 1;
    if (!directive.test(text)) return;
    const match = nextLine.exec(text);
    if (match === null) {
      disableForm(line, otherForm);
      return;
    }
    const mutator = String(match[1]);
    const reason = match[2] ?? "";
    if (reason.trim() === "") {
      disableForm(line, noReason);
      return;
    }
    if (changedAt(file.ranges, line)) records.push({ path: file.path, line, mutator: mutator.trim(), reason: reason.trim() });
  });
  return { records, findings };
}

/** The record line `<path>:<line>: mutation: record: <mutator>: <reason>` (data-model.md § Finding). */
export function formatRecord(record: EquivalentRecord): string {
  return `${record.path}:${String(record.line)}: mutation: record: ${record.mutator}: ${record.reason}`;
}
