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
// Element source is cut by mutant count instead (010 phase 3 stop 1, operator decision (b), 2026-11-15,
// specs/010-feedback-forms/reviews/phase-3/decision-stop-1.md and design-change-1.md; 010 plan decision 11): for a
// changed file under packages/elements/src/ (which stryker.elements.config.json mutates, its shards costing about
// 217 s fixed and 14 s a mutant), the mutants Stryker's instrumenter places on its changed lines are counted, those a
// `// Stryker disable` comment ignores left out and compile errors kept (the planner cannot know them), a mutant
// counting in an entry only when it lies wholly inside the entry's lines, as Stryker mutates a `mutate` range. A file
// of at most 10 such mutants is one entry, its path, however many lines changed; a file of more is cut into entries
// `path:start-end` of at most 10: an entry grows over the changed lines until the next line would take it over 10,
// and closes at the line boundary inside it that the fewest mutants span (the latest on a tie), so as few mutants as
// may span a cut; a line of more than 10 is an entry alone. These entries fill shards of at most 10 mutants and 10
// entries, two of one file never in one shard, and never beside an entry of a file outside packages/elements/src/,
// since such a shard runs both Stryker configurations and both dry runs. Every other file keeps the rule above.
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

/**
 * A mutant Stryker's instrumenter places on a changed line: its first and last line (1-based), and whether a
 * `// Stryker disable` comment ignores it.
 */
export interface PlacedMutant {
  readonly start: number;
  readonly end: number;
  readonly ignored: boolean;
}

const maxEntryLines = 30;
const maxEntries = 10;
const maxLines = 250;
/** The most mutants an element-source entry or shard holds (010 plan decision 11: 217 s + 10 x 14 s = 357 s). */
const maxMutants = 10;

interface Entry {
  readonly entry: string;
  readonly path: string;
  readonly lines: number;
  /** The mutants counted in the entry, for element source; undefined for every other file. */
  readonly mutants?: number;
}

/** Whether a changed path is element source, which stryker.elements.config.json mutates (gates/bin/mutation.ts). */
export function elementSource(path: string): boolean {
  return path.startsWith("packages/elements/src/");
}

function lineCount(ranges: readonly LineRange[]): number {
  return ranges.reduce((sum, range) => sum + range.end - range.start + 1, 0);
}

/** A file's entries: its path, or line ranges of at most 30 changed lines each when it has more. */
function splitFile(file: ChangedFile): Entry[] {
  if (file.lines <= maxEntryLines) return [{ entry: file.path, path: file.path, lines: file.lines }];
  const entries: Entry[] = [];
  let first = 0;
  let last = 0;
  let count = 0;
  const close = (): void => {
    entries.push({ entry: `${file.path}:${String(first)}-${String(last)}`, path: file.path, lines: count });
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

/**
 * An element-source file's entries by mutant count: its path when its changed lines hold at most 10 counted mutants,
 * else `path:start-end` entries of at most 10 (a line of more alone), each closed at the latest of the boundaries
 * inside it that the fewest mutants span.
 */
function splitByMutants(file: ChangedFile, placed: readonly PlacedMutant[]): Entry[] {
  const counted = placed.filter((mutant) => !mutant.ignored);
  if (counted.length <= maxMutants) return [{ entry: file.path, path: file.path, lines: file.lines, mutants: counted.length }];
  const changed = file.ranges.flatMap((range) => Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i));
  /** The mutants wholly inside changed lines `first` to `last` (indexes into `changed`). */
  const inside = (first: number, last: number): number =>
    counted.filter((mutant) => mutant.start >= Number(changed[first]) && mutant.end <= Number(changed[last])).length;
  /** The mutants spanning the boundary after changed line `index`. */
  const spanning = (index: number): number =>
    counted.filter((mutant) => mutant.start <= Number(changed[index]) && mutant.end > Number(changed[index])).length;
  const entries: Entry[] = [];
  for (let first = 0; first < changed.length; ) {
    let last = first;
    while (last + 1 < changed.length && inside(first, last + 1) <= maxMutants) last += 1;
    // The latest boundary the fewest mutants span; after the file's last changed line, which none spans, the entry ends.
    let close = last;
    for (let index = last - 1; index >= first; index -= 1) if (spanning(index) < spanning(close)) close = index;
    entries.push({
      entry: `${file.path}:${String(changed[first])}-${String(changed[close])}`,
      path: file.path,
      lines: close - first + 1,
      mutants: inside(first, close),
    });
    first = close + 1;
  }
  return entries;
}

/**
 * The CI shards of the changed files. `placed` gives, by path, the mutants Stryker's instrumenter places on each
 * changed element-source file's changed lines (a file it does not name has none).
 */
export function planShards(files: readonly ChangedFile[], placed: ReadonlyMap<string, readonly PlacedMutant[]> = new Map()): Shard[] {
  const shards: { files: string[]; lines: number; mutants: number | undefined }[] = [];
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  const split = (file: ChangedFile): Entry[] =>
    elementSource(file.path) ? splitByMutants(file, placed.get(file.path) ?? []) : splitFile(file);
  let lastPath: string | undefined;
  for (const { entry, path, lines, mutants } of sorted.flatMap(split)) {
    const last = shards.at(-1);
    // Entries come in path order, so the current shard holds an entry of this file only if its last entry is one.
    const fits =
      last !== undefined &&
      path !== lastPath &&
      last.files.length < maxEntries &&
      (mutants === undefined
        ? last.mutants === undefined && last.lines + lines <= maxLines
        : last.mutants !== undefined && last.mutants + mutants <= maxMutants);
    if (fits) {
      last.files.push(entry);
      last.lines += lines;
      if (mutants !== undefined) last.mutants = Number(last.mutants) + mutants;
    } else {
      shards.push({ files: [entry], lines, mutants });
    }
    lastPath = path;
  }
  return shards.map((shard) => ({ files: shard.files, lines: shard.lines }));
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
