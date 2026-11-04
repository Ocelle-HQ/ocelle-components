// Changed line ranges for mutation testing (FR-011, FR-028, research.md R-08): the lines of package source
// TypeScript and gate source added or modified relative to the base, read from `git diff --unified=0`. A `+++` file
// header is `b/<path>` (followed by a tab when the path holds a space), a C-quoted `"b/<escaped>"` (octal byte escapes
// for non-ASCII bytes), or `/dev/null`; any other header makes the parse fail naming it, so no changed file is ever
// dropped unread (phase 3 round 7, O7-01). A changed path that Stryker cannot take verbatim as a `mutate` input is
// named by `unusableMutatePaths`, which the gate turns into exit 2 before Stryker runs (O7-02, operator decision,
// PR #18 landing review: "Guard the input instead (Recommended)"; line terminators: phase 3 round 8, R8-01).

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

/** FR-028's package source TypeScript and gate source, and 002's Storybook scripts and configuration, as git pathspecs. */
export const scopePathspecs: readonly string[] = [
  ":(glob)packages/*/**/*.ts",
  ":(glob)gates/bin/**/*.ts",
  ":(glob)gates/lib/**/*.ts",
  ":(glob)gates/eslint/**/*.ts",
  ":(glob)gates/stylelint/**/*.ts",
  ":(glob)storybook/scripts/**/*.ts",
  ":(glob)storybook/.storybook/**/*.ts",
  ":(exclude,glob)**/*.test.ts",
  ":(exclude,glob)**/*.spec.ts",
  ":(exclude,glob)**/test/**",
  ":(exclude,glob)**/*.stories.ts",
  ":(exclude,glob)**/*.d.ts",
  ":(exclude,glob)packages/*/dist/**",
];

const source = /^(?:packages\/[^/]+|gates\/(?:bin|lib|eslint|stylelint)|storybook\/(?:scripts|\.storybook))\/.+(?<!\.test|\.spec|\.stories|\.d)\.ts$/s;
const excluded = /\/test\/|^packages\/[^/]+\/dist\//;
const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/;

/** Whether a repository path is package source TypeScript or gate source (FR-028), the same set as the pathspecs. */
export function inScope(path: string): boolean {
  return source.test(path) && !excluded.test(path);
}

/** A C-quoted header name `"b/<escaped>"`, optionally followed by a tab: its escaped body. */
const quotedName = /^"b\/((?:[^"\\]|\\(?:[0-3][0-7]{2}|[abtnvfr"\\]))*)"(?:\t|$)/u;
/** One part of a quoted body: an escape (octal byte or C escape) or one character. */
const quotedPart = /\\([0-3][0-7]{2}|.)|./gsu;

/** One part of a quoted body percent-encoded: a character as its UTF-8 bytes, an escape as its one byte. */
function encodePart(part: string, escape: string | undefined): string {
  if (escape === undefined) return encodeURIComponent(part);
  // `\a` to `\r` are the bytes 7 to 13, in this order; `\"` and `\\` stand for themselves.
  const control = "abtnvfr".indexOf(escape);
  const byte = escape.length === 3 ? parseInt(escape, 8) : control >= 0 ? control + 7 : escape.charCodeAt(0);
  return `%${byte.toString(16).padStart(2, "0")}`;
}

function unreadable(line: string): Error {
  return new Error(`git diff wrote a file header the gate cannot read: ${JSON.stringify(line)}`);
}

/** The repository path of a `+++` header, undefined for `/dev/null`; throws naming a header it cannot read. */
function headerPath(line: string): string | undefined {
  const name = line.slice("+++ ".length);
  if (name === "/dev/null") return undefined;
  if (name.startsWith("b/")) return name.slice("b/".length).split("\t")[0];
  const body = quotedName.exec(name)?.[1];
  if (body === undefined) throw unreadable(line);
  try {
    // The octal escapes are UTF-8 bytes; bytes that are not UTF-8 name no path the gate can pass on.
    return decodeURIComponent(body.replace(quotedPart, encodePart));
  } catch {
    throw unreadable(line);
  }
}

/**
 * The changed files in scope, from `git diff --unified=0` output, in diff order; throws naming a `+++` header that is
 * neither `b/<path>` (plain or tab-suffixed), a C-quoted `"b/<escaped>"` nor `/dev/null`.
 */
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
      // A deleted file's `+++ /dev/null` gives no path, and no range follows it, since a deletion adds no line.
      path = headerPath(line);
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

/**
 * A path minimatch reads as a pattern, not verbatim (a glob metacharacter `*?[]{}!`, a backslash, an extglob `+(` or
 * `@(`), one a comma would split in Stryker's `--mutate` list, or one holding a line terminator (`\n`, `\r`, U+2028,
 * U+2029), of which Stryker's `MUTATION_RANGE_REGEX` (no `s` flag, no `^` anchor) keeps only the text after the last
 * terminator (phase 3 round 8, R8-01).
 */
const unusable = /[*?[\]{}!,\\\n\r\u2028\u2029]|[+@]\(/;

/** The changed paths Stryker cannot take verbatim as a `mutate` input, in diff order. */
export function unusableMutatePaths(files: readonly ChangedFile[]): string[] {
  return files.map((file) => file.path).filter((path) => unusable.test(path));
}
