// Directory listings as the gates read them (research.md R-09): the adapters only call `readdir` with file types and
// pass the entries here, so which entries count (directories, files) and how a file's path is written are decided in
// these pure functions, tested in process (gates/test/entries.test.ts).
import { join, relative } from "node:path";

/** One entry of `readdir(dir, { withFileTypes: true })`, recursive or not. */
export interface Entry {
  readonly name: string;
  readonly parentPath: string;
  readonly isFile: () => boolean;
  readonly isDirectory: () => boolean;
}

/** The names of the directories among the entries, sorted. */
export function directoryNames(entries: readonly Entry[]): string[] {
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** The files among the entries, as paths relative to `from`, sorted. */
export function filePaths(entries: readonly Entry[], from: string): string[] {
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(from, join(entry.parentPath, entry.name)))
    .sort();
}
