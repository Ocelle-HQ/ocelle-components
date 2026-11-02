// Changed line ranges for mutation testing (FR-011, FR-028, research.md R-08). Scaffold: signatures only.

/** Lines `start` to `end` (1-based, inclusive) added or modified relative to the base. */
export interface LineRange {
  readonly start: number;
  readonly end: number;
}

/** A changed file of package source or gate source, its changed ranges and their number of lines. */
export interface ChangedFile {
  readonly path: string;
  readonly ranges: readonly LineRange[];
  readonly lines: number;
}

/** FR-028's package source TypeScript and gate source, as git pathspecs. */
export const scopePathspecs: readonly string[] = [];

/** Whether a repository path is package source TypeScript or gate source (FR-028). */
export function inScope(_path: string): boolean {
  return false;
}

/** The changed files in scope, from `git diff --unified=0` output. */
export function changedFiles(_diff: string): ChangedFile[] {
  return [];
}

/** Stryker `mutate` entries, `path:start-end`, one per changed range. */
export function mutateSpecs(_files: readonly ChangedFile[]): string[] {
  return [];
}
