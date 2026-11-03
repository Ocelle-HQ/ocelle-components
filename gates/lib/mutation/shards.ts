// Mutation shards for CI (FR-013, research.md R-08 "CI, sharded"): the changed files, sorted by path, become entries.
// A file of at most 120 changed lines is one entry, its path; a file of more is split by line range into entries
// `path:start-end` (Stryker's own `mutate` range syntax) of 120 changed lines each, the last holding the rest, a cut
// falling inside a changed range where the count reaches 120, each entry running from its first to its last changed
// line (operator decision, phase 3 round 9, O9-01: plant-judge.ts alone took 9:49 of the 10-minute CI job limit). The
// entries, in that order, are filled greedily into shards of at most 10 entries and 250 changed lines (operator
// decision, phase 4 round 3: 500 lines let a shard run past the limit); an entry never crosses a shard. `--files`
// takes a shard's entries back: `selectFiles` cuts each file's changed ranges to the entries naming it.
import type { ChangedFile, LineRange } from "./ranges.ts";

/** One CI shard: its entries (`path` or `path:start-end`) and their number of changed lines. */
export interface Shard {
  readonly files: readonly string[];
  readonly lines: number;
}

/**
 * The changed files a `--files` list selects, their ranges cut to the listed entries; or the entries that select
 * nothing: malformed ranges, paths that are not changed files, or ranges holding no changed line, in that order.
 */
export type Selection =
  | { readonly files: readonly ChangedFile[] }
  | { readonly malformed: readonly string[] }
  | { readonly missing: readonly string[] }
  | { readonly empty: readonly string[] };

const maxEntryLines = 120;
const maxEntries = 10;
const maxLines = 250;

interface Entry {
  readonly entry: string;
  readonly lines: number;
}

function lineCount(ranges: readonly LineRange[]): number {
  return ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0);
}

/** A file's entries: its path, or line ranges of at most 120 changed lines each when it has more. */
function splitFile(file: ChangedFile): Entry[] {
  if (file.lines <= maxEntryLines) return [{ entry: file.path, lines: file.lines }];
  const entries: Entry[] = [];
  let first = 0;
  let last = 0;
  let count = 0;
  const close = (): void => {
    entries.push({ entry: `${file.path}:${String(first)}-${String(last)}`, lines: count });
    count = 0;
  };
  for (const range of file.ranges) {
    for (let line = range.start; line <= range.end; line = last + 1) {
      if (count === 0) first = line;
      const take = Math.min(range.end - line + 1, maxEntryLines - count);
      count += take;
      last = line + take - 1;
      if (count === maxEntryLines) close();
    }
  }
  if (count > 0) close();
  return entries;
}

export function planShards(files: readonly ChangedFile[]): Shard[] {
  const shards: { files: string[]; lines: number }[] = [];
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  for (const { entry, lines } of sorted.flatMap(splitFile)) {
    const last = shards.at(-1);
    if (last !== undefined && last.files.length < maxEntries && last.lines + lines <= maxLines) {
      last.files.push(entry);
      last.lines += lines;
    } else {
      shards.push({ files: [entry], lines });
    }
  }
  return shards;
}

/** The `--plan` output: the shards as one line of JSON, each shard's entries comma-separated for `--files`. */
export function formatPlan(shards: readonly Shard[]): string {
  return JSON.stringify(shards.map((shard) => ({ files: shard.files.join(","), lines: shard.lines })));
}

/** A `--files` entry read: its path and the lines it selects (every line when it names no range). */
interface Wanted {
  readonly entry: string;
  readonly path: string;
  readonly window: LineRange;
}

/** An entry `<path>.ts:<range>`: the range is the text after the last `.ts:`. */
const rangeSuffix = /^(.*\.ts):(.*)$/s;
const lineRange = /^(\d+)-(\d+)$/;

/**
 * An entry read: a changed path, or a path without a range suffix, selects every line; `path.ts:start-end` with
 * 1 <= start <= end selects those lines; any other range suffix is malformed (undefined).
 */
function readEntry(entry: string, changed: ReadonlySet<string>): Wanted | undefined {
  const whole: Wanted = { entry, path: entry, window: { start: 1, end: Infinity } };
  if (changed.has(entry)) return whole;
  const suffix = rangeSuffix.exec(entry);
  if (suffix === null) return whole;
  const range = lineRange.exec(String(suffix[2]));
  const start = Number(range?.[1]);
  const end = Number(range?.[2]);
  if (!(start >= 1 && start <= end)) return undefined;
  return { entry, path: String(suffix[1]), window: { start, end } };
}

/** The changed ranges cut to the windows, sorted, overlapping or adjacent ranges joined. */
function cut(ranges: readonly LineRange[], windows: readonly LineRange[]): LineRange[] {
  const pieces = ranges
    .flatMap((range) => windows.map((window) => ({ start: Math.max(range.start, window.start), end: Math.min(range.end, window.end) })))
    .filter((piece) => piece.start <= piece.end)
    .sort((a, b) => a.start - b.start);
  const joined: { start: number; end: number }[] = [];
  for (const piece of pieces) {
    const last = joined.at(-1);
    if (last !== undefined && piece.start <= last.end + 1) last.end = Math.max(last.end, piece.end);
    else joined.push({ ...piece });
  }
  return joined;
}

export function selectFiles(changed: readonly ChangedFile[], list: string): Selection {
  const entries = list
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry !== "");
  const paths = new Set(changed.map((file) => file.path));
  const read = entries.map((entry) => ({ entry, wanted: readEntry(entry, paths) }));
  const malformed = read.filter((item) => item.wanted === undefined).map((item) => item.entry);
  if (malformed.length > 0) return { malformed };
  const wanted = read.map((item) => item.wanted).filter((item) => item !== undefined);
  const missing = wanted.filter((item) => !paths.has(item.path)).map((item) => item.entry);
  if (missing.length > 0) return { missing };
  const byPath = new Map(changed.map((file) => [file.path, file.ranges]));
  const empty = wanted.filter((item) => cut(byPath.get(item.path) ?? [], [item.window]).length === 0).map((item) => item.entry);
  if (empty.length > 0) return { empty };
  const files = changed.flatMap((file) => {
    const windows = wanted.filter((item) => item.path === file.path).map((item) => item.window);
    if (windows.length === 0) return [];
    const ranges = cut(file.ranges, windows);
    return [{ path: file.path, ranges, lines: lineCount(ranges) }];
  });
  return { files };
}
