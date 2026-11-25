// Mutation shards for CI (FR-013, research.md R-08 "CI, sharded"): the changed files, sorted by path, become entries.
// A file of at most 30 changed lines is one entry, its path; a file of more is split by line range into entries
// `path:start-end` (Stryker's own `mutate` range syntax) of 30 changed lines each, the last holding the rest, a cut
// falling inside a changed range where the count reaches 30, each entry running from its first to its last changed
// line (operator decisions: phase 3 round 9, O9-01, plant-judge.ts alone took 9:49 of the 10-minute CI job limit, so
// 120; 002 phase 5 round 6, O6-01, a 120-line entry of packages/tokens/src/generate.ts ran past 600 s, so 60; 007
// spec FR-014, 2026-11-11, "30-line entries, all files": with the TypeScript checker on, three 60-line entries of
// packages/tokens/src/source.ts took 188 s to 283 s on the sandbox against a bound of 176 s, so 30). The
// entries, in that order, are filled greedily into shards of at most 10 entries and 250 changed lines (operator
// decision, phase 4 round 3: 500 lines let a shard run past the limit); an entry never crosses a shard, and the next
// entry starts a new shard when the current one already holds an entry of its file, so no shard holds more than 30
// changed lines of one file (operator decision, phase 3 round 10, O10-01). A cut, the boundary between two
// consecutive entries of one file, is counted by `countCuts`: a mutant spanning it is mutated in no shard, an
// accepted limit (O10-02, gates/README.md). `--files` takes a shard's entries back: `selectFiles` cuts each file's
// changed ranges to the entry naming it and keeps that entry, as given, as the name the run's report lines use (007
// data-model § Entry). A list that names one file more than once (two entries of one file, or one entry repeated) selects
// nothing, since two entries of one file never share a shard (operator decision, 2026-11-10, PLAN-CORRECTNESS-1-005 (a)).
import type { ChangedFile, LineRange } from "./ranges.ts";

/** One CI shard: its entries (`path` or `path:start-end`) and their number of changed lines. */
export interface Shard {
  readonly files: readonly string[];
  readonly lines: number;
}

/** A changed file a `--files` list selects, with the entry that selected it, as given (trimmed). */
export interface SelectedFile extends ChangedFile {
  readonly entry: string;
}

/**
 * The changed files a `--files` list selects, their ranges cut to the listed entry; or the entries that select
 * nothing: malformed ranges, every entry of a file named more than once, paths that are not changed files, or ranges
 * holding no changed line, in that order.
 */
export type Selection =
  | { readonly files: readonly SelectedFile[] }
  | { readonly malformed: readonly string[] }
  | { readonly repeated: readonly string[] }
  | { readonly missing: readonly string[] }
  | { readonly empty: readonly string[] };

const maxEntryLines = 30;
const maxEntries = 10;
const maxLines = 250;

interface Entry {
  readonly entry: string;
  readonly path: string;
  readonly lines: number;
}

interface RangeEntry extends LineRange {
  readonly lines: number;
}

function lineCount(ranges: readonly LineRange[]): number {
  return ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0);
}

/** A file's entries: its path, or line ranges of at most 30 changed lines each when it has more. */
function splitFile(file: ChangedFile, shadowGrouped: boolean): Entry[] {
  if (file.lines <= maxEntryLines) return [{ entry: file.path, path: file.path, lines: file.lines }];
  const entries: RangeEntry[] = [];
  let first = 0;
  let last = 0;
  let count = 0;
  const close = (): void => {
    entries.push({ start: first, end: last, lines: count });
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
  const ranges = shadowGrouped && file.path.startsWith("packages/elements/src/") ? groupAdjacentEntries(entries) : entries;
  return ranges.map(({ start, end, lines }) => ({ entry: `${file.path}:${String(start)}-${String(end)}`, path: file.path, lines }));
}

/** A candidate entry spans one contiguous pair without including any unchanged line. */
function groupAdjacentEntries(entries: readonly RangeEntry[]): RangeEntry[] {
  const grouped: RangeEntry[] = [];
  let index = 0;
  for (;;) {
    const first = entries[index];
    if (first === undefined) return grouped;
    const second = entries[index + 1];
    if (second !== undefined && first.end + 1 === second.start
      && first.end - first.start + 1 === first.lines && second.end - second.start + 1 === second.lines) {
      grouped.push({ start: first.start, end: second.end, lines: first.lines + second.lines });
      index += 2;
    } else {
      grouped.push(first);
      index += 1;
    }
  }
}

export function planShards(files: readonly ChangedFile[], shadowGrouped = false): Shard[] {
  const shards: { files: string[]; lines: number }[] = [];
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  let lastPath: string | undefined;
  for (const { entry, path, lines } of sorted.flatMap((file) => splitFile(file, shadowGrouped))) {
    const last = shards.at(-1);
    // Entries come in path order, so the current shard holds an entry of this file only if its last entry is one.
    if (last !== undefined && path !== lastPath && last.files.length < maxEntries && last.lines + lines <= maxLines) {
      last.files.push(entry);
      last.lines += lines;
    } else {
      shards.push({ files: [entry], lines });
    }
    lastPath = path;
  }
  return shards;
}

/**
 * The plan's cuts within files: a file of `n` entries has `n - 1`, summed over the files, so the entries less the
 * files. An entry's file is the entry less its last `:start-end`; a whole entry is a changed path, which ends in
 * `.ts`, so it is its own file.
 */
export function countCuts(shards: readonly Shard[]): number {
  const entries = shards.flatMap((shard) => shard.files);
  return entries.length - new Set(entries.map((entry) => /(.*):\d+-\d+$/.exec(entry)?.[1] ?? entry)).size;
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

/**
 * An entry `<path>.ts:<range>` is split at its last `.ts:`, the path ending in `.ts` and the range the rest. A split
 * without a regex leaves no anchor whose removal is equivalent (phase 3 round 12, O12-02).
 */
const pathEnd = ".ts:";
const lineRange = /^(\d+)-(\d+)$/;

/**
 * An entry read: a changed path, or a path without a range suffix, selects every line; `path.ts:start-end` with
 * 1 <= start <= end selects those lines; any other range suffix is malformed (undefined).
 */
function readEntry(entry: string, changed: ReadonlySet<string>): Wanted | undefined {
  const whole: Wanted = { entry, path: entry, window: { start: 1, end: Infinity } };
  if (changed.has(entry)) return whole;
  const split = entry.lastIndexOf(pathEnd);
  if (split === -1) return whole;
  const range = lineRange.exec(entry.slice(split + pathEnd.length));
  const start = Number(range?.[1]);
  const end = Number(range?.[2]);
  if (!(start >= 1 && start <= end)) return undefined;
  return { entry, path: entry.slice(0, split + ".ts".length), window: { start, end } };
}

/** The changed ranges (sorted and apart, as `changedFiles` reads them) cut to the window. */
function cut(ranges: readonly LineRange[], window: LineRange): LineRange[] {
  return ranges
    .map((range) => ({ start: Math.max(range.start, window.start), end: Math.min(range.end, window.end) }))
    .filter((piece) => piece.start <= piece.end);
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
  const named = (path: string): number => wanted.filter((item) => item.path === path).length;
  const repeated = wanted.filter((item) => named(item.path) > 1).map((item) => item.entry);
  if (repeated.length > 0) return { repeated };
  const missing = wanted.filter((item) => !paths.has(item.path)).map((item) => item.entry);
  if (missing.length > 0) return { missing };
  const byPath = new Map(changed.map((file) => [file.path, file.ranges]));
  const empty = wanted.filter((item) => cut(byPath.get(item.path) ?? [], item.window).length === 0).map((item) => item.entry);
  if (empty.length > 0) return { empty };
  const files = changed.flatMap((file) => {
    const item = wanted.find((one) => one.path === file.path);
    if (item === undefined) return [];
    const ranges = cut(file.ranges, item.window);
    return [{ path: file.path, ranges, lines: lineCount(ranges), entry: item.entry }];
  });
  return { files };
}
