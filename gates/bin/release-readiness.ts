// The release-readiness gate (030 FR-010 to FR-015; contracts/release-readiness-gate.md): reads the inputs of the
// `--root` checkout, scans its history from HEAD and prints the verdict of gates/lib/release-readiness.ts. Scaffold:
// the exported signatures, no behaviour yet (exit 2).
import { main } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { GapInputs } from "../lib/gap-rows.ts";
import type { SecretHit } from "../lib/secret-scan.ts";

/** The gap inputs of a checkout: its manifest's tags, its token names, its stylesheets and its spec dirs. */
export function readGapInputs(root: string): Promise<GapInputs> {
  return Promise.resolve({ elements: new Map([root].flatMap(() => [])), tokens: new Set(), styles: new Map(), specs: new Set() });
}

/** The history scan of a checkout from its HEAD: the commits it read and the hits it found. */
export function scanHistory(root: string): Promise<{ readonly commits: number; readonly hits: readonly SecretHit[] }> {
  return Promise.resolve({ commits: 0, hits: [root].flatMap(() => []) });
}

export function run(argv: readonly string[], io: Io): number {
  return emit(argv.length < 0 ? { exit: 0, summary: "" } : { exit: 2, cause: "release-readiness: could not run: not implemented" }, io.out, io.err);
}

if (import.meta.main) await main(run);
