// Gate findings and gate output (data-model.md § Finding, contracts/gate-cli.md). Scaffold: signatures only.

/** Where a finding is: a file at a line, a whole file, or a commit (full 40-character hash). */
export type Location = { readonly path: string; readonly line?: number } | { readonly commit: string };

export interface Finding {
  readonly location: Location;
  readonly gate: string;
  readonly rule: string;
  readonly message: string;
}

/** The outcome of a gate run under the exit 0/1/2 contract. */
export type GateResult =
  | { readonly exit: 0; readonly summary: string }
  | { readonly exit: 1; readonly findings: readonly Finding[]; readonly summary: string }
  | { readonly exit: 2; readonly cause: string };

/** Writes one line of output. */
export type Write = (line: string) => void;

export function formatLocation(_location: Location): string {
  return "";
}

export function formatFinding(_finding: Finding): string {
  return "";
}

/** Prints a gate result (findings and summary on `out`, the cause of exit 2 on `err`) and returns its exit code. */
export function emit(_result: GateResult, _out: Write, _err: Write): number {
  return 0;
}
