// The test-lint gate (FR-010, research.md R-06). Scaffold: signatures only.
import type { Io } from "../lib/cli.ts";

export function run(_argv: readonly string[], _io: Io): Promise<number> {
  return Promise.resolve(0);
}
