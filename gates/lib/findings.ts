// Gate findings and gate output (data-model.md § Finding, contracts/gate-cli.md).

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

/** Joins the lines of a text into one line, so every finding and every cause stays one output line. */
export function oneLine(text: string): string {
  return text.replace(/\s*\r?\n\s*/g, " ").trim();
}

export function formatLocation(location: Location): string {
  if ("commit" in location) return location.commit;
  return location.line === undefined ? location.path : `${location.path}:${String(location.line)}`;
}

export function formatFinding(finding: Finding): string {
  return `${formatLocation(finding.location)}: ${finding.gate}: ${oneLine(finding.rule)}: ${oneLine(finding.message)}`;
}

/** Prints a gate result (findings and summary on `out`, the cause of exit 2 on `err`) and returns its exit code. */
export function emit(result: GateResult, out: Write, err: Write): number {
  switch (result.exit) {
    case 0:
      out(oneLine(result.summary));
      return 0;
    case 1:
      for (const finding of result.findings) out(formatFinding(finding));
      out(oneLine(result.summary));
      return 1;
    case 2:
      err(oneLine(result.cause));
      return 2;
  }
}
