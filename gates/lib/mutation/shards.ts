// Mutation shards for CI (FR-013, research.md R-08): the changed files, sorted by path, filled greedily into shards
// of at most 10 files and 500 changed lines; a file of more than 500 changed lines is a shard on its own.
import type { ChangedFile } from "./ranges.ts";

/** One CI shard: changed files and their number of changed lines. */
export interface Shard {
  readonly files: readonly string[];
  readonly lines: number;
}

/** The changed files a `--files` list selects, or the listed paths that are not changed files. */
export type Selection = { readonly files: readonly ChangedFile[] } | { readonly missing: readonly string[] };

const maxFiles = 10;
const maxLines = 500;

export function planShards(files: readonly ChangedFile[]): Shard[] {
  const shards: { files: string[]; lines: number }[] = [];
  for (const file of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const last = shards.at(-1);
    if (last !== undefined && last.files.length < maxFiles && last.lines + file.lines <= maxLines) {
      last.files.push(file.path);
      last.lines += file.lines;
    } else {
      shards.push({ files: [file.path], lines: file.lines });
    }
  }
  return shards;
}

/** The `--plan` output: the shards as one line of JSON, each shard's files comma-separated for `--files`. */
export function formatPlan(shards: readonly Shard[]): string {
  return JSON.stringify(shards.map((shard) => ({ files: shard.files.join(","), lines: shard.lines })));
}

export function selectFiles(changed: readonly ChangedFile[], list: string): Selection {
  const wanted = list
    .split(",")
    .map((path) => path.trim())
    .filter((path) => path !== "");
  const missing = wanted.filter((path) => !changed.some((file) => file.path === path));
  if (missing.length > 0) return { missing };
  return { files: changed.filter((file) => wanted.includes(file.path)) };
}
