// Changed line ranges for mutation testing (FR-011, FR-028, research.md R-08): the lines of package source
// TypeScript and gate source added or modified relative to the base, read from `git diff --unified=0`.

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
export const scopePathspecs: readonly string[] = [
  ":(glob)packages/*/**/*.ts",
  ":(glob)gates/bin/**/*.ts",
  ":(glob)gates/lib/**/*.ts",
  ":(glob)gates/eslint/**/*.ts",
  ":(glob)gates/stylelint/**/*.ts",
  ":(exclude,glob)**/*.test.ts",
  ":(exclude,glob)**/*.spec.ts",
  ":(exclude,glob)**/test/**",
  ":(exclude,glob)**/*.stories.ts",
  ":(exclude,glob)**/*.d.ts",
  ":(exclude,glob)packages/*/dist/**",
];

const source = /^(?:packages\/[^/]+|gates\/(?:bin|lib|eslint|stylelint))\/.+(?<!\.test|\.spec|\.stories|\.d)\.ts$/;
const excluded = /\/test\/|^packages\/[^/]+\/dist\//;
const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;

/** Whether a repository path is package source TypeScript or gate source (FR-028), the same set as the pathspecs. */
export function inScope(path: string): boolean {
  return source.test(path) && !excluded.test(path);
}

/** The changed files in scope, from `git diff --unified=0` output, in diff order. */
export function changedFiles(diff: string): ChangedFile[] {
  const files: ChangedFile[] = [];
  let path: string | undefined;
  let ranges: LineRange[] = [];
  let header = false;
  const finish = (): void => {
    if (path !== undefined && ranges.length > 0 && inScope(path)) {
      files.push({ path, ranges, lines: ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0) });
    }
  };
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) {
      finish();
      path = undefined;
      ranges = [];
      header = true;
    } else if (header && line.startsWith("+++ ")) {
      // A deleted file's `+++ /dev/null` gives a path that no range ever follows, since a deletion adds no line.
      path = line.slice("+++ b/".length);
    } else {
      const match = hunk.exec(line);
      if (match === null) continue;
      header = false;
      const start = Number(match[1]);
      const count = match[2] === undefined ? 1 : Number(match[2]);
      if (count > 0) ranges.push({ start, end: start + count - 1 });
    }
  }
  finish();
  return files;
}

/** Stryker `mutate` entries, `path:start-end`, one per changed range. */
export function mutateSpecs(files: readonly ChangedFile[]): string[] {
  return files.flatMap((file) => file.ranges.map((range) => `${file.path}:${String(range.start)}-${String(range.end)}`));
}
