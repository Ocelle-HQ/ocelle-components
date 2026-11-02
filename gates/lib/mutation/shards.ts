// Mutation shards for CI (FR-013, research.md R-08). Scaffold: signatures only.
import type { ChangedFile } from "./ranges.ts";

/** One CI shard: changed files and their number of changed lines. */
export interface Shard {
  readonly files: readonly string[];
  readonly lines: number;
}

/** The changed files a `--files` list selects, or the listed paths that are not changed files. */
export type Selection = { readonly files: readonly ChangedFile[] } | { readonly missing: readonly string[] };

export function planShards(_files: readonly ChangedFile[]): Shard[] {
  return [];
}

/** The `--plan` output: the shards as one line of JSON. */
export function formatPlan(_shards: readonly Shard[]): string {
  return "";
}

export function selectFiles(_changed: readonly ChangedFile[], _list: string): Selection {
  return { files: [] };
}
