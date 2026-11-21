// The sandbox-paths gate's decisions (op 023, #60; ops/023-public-repo-hygiene/op.md *The rule*): the rule of FR-001,
// the four allowed files of FR-003, the `git grep` arguments of a scan of the tracked files without them, the parse of
// its `-z -n` records into findings that never echo the matched line, and the verdict for git's exit code and the
// tracked-file count. The CLI (gates/bin/sandbox-paths.ts) runs git with these; this module is pure and tested in
// process (gates/test/sandbox-paths.test.ts).
import { plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";

const gate = "sandbox-paths";

/**
 * The rule (FR-001): a line holds a sandbox path when it matches this POSIX extended regular expression. `git grep -E`
 * uses it as is, and so does `new RegExp` (gates/test/integration/sandbox-paths.test.ts shows that both agree).
 */
export const sandboxPathRule = "(^|[^A-Za-z0-9._~-])/(root|home/user)/[A-Za-z0-9._-]";

/** The tracked files the gate does not scan (FR-003): exactly these four, sorted. Adding one is a reviewed change. */
export const allowedFiles: readonly string[] = [
  "gates/test/capture-plan.test.ts",
  "gates/test/fixtures/pins/pnpm/outdated-lockfile.ndjson",
  "gates/test/fixtures/pins/pnpm/success.ndjson",
  "specs/001-repository-foundation/reviews/phase-4/round-1.md",
];

/** The message of every finding: it names the fix and does not echo the line. */
const message = "holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place";

/**
 * The `git grep` arguments of a scan of the tracked files with the rule: `-z` records, line numbers, binary files
 * skipped, and each allowed file excluded as a literal path (never a glob or a directory).
 */
export function grepArgs(allowed: readonly string[]): string[] {
  return ["--no-color", "-z", "-n", "-I", "-E", "-e", sandboxPathRule, "--", ".", ...allowed.map((path) => `:(exclude,literal)${path}`)];
}

/** The `path\0line\0text\n` records of `git grep -z -n` output; throws on a record without a path and a line number. */
function records(stdout: string): { readonly path: string; readonly line: number }[] {
  const found: { path: string; line: number }[] = [];
  let at = 0;
  while (at < stdout.length) {
    const pathEnd = stdout.indexOf("\0", at);
    const lineEnd = pathEnd === -1 ? -1 : stdout.indexOf("\0", pathEnd + 1);
    const number = stdout.slice(pathEnd + 1, lineEnd);
    if (lineEnd === -1 || !/^[1-9]\d*$/.test(number)) throw new Error("unexpected git grep output: a record without a path and a line number");
    found.push({ path: stdout.slice(at, pathEnd), line: Number(number) });
    const end = stdout.indexOf("\n", lineEnd + 1);
    at = end === -1 ? stdout.length : end + 1;
  }
  return found;
}

/** The findings of `git grep -z -n` output: one at `path:line` for each matching line, never echoing its text. */
export function parseGrep(stdout: string): Finding[] {
  return records(stdout).map((location) => ({ location, gate, rule: "sandbox-path", message }));
}

/** One scan of a root: its tracked-file count and git grep's exit code (null: ended by a signal) and output. */
export interface GrepRun {
  readonly tracked: number;
  readonly code: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * The gate result of a scan: no tracked file is exit 2 (a scan of nothing would pass vacuously); git grep's exit 1
 * (no match) is a pass, its exit 0 (matches) one finding per line, and any other exit exit 2 with git's first error line.
 */
export function verdict(run: GrepRun): GateResult {
  const cannot = (why: string): GateResult => ({ exit: 2, cause: `${gate}: could not run: ${why}` });
  if (run.tracked === 0) return cannot("no tracked file; the root holds no file that git tracks");
  if (run.code === 1) {
    return { exit: 0, summary: `${gate}: ${plural(run.tracked, "tracked file")} checked, none holds a sandbox path (${plural(allowedFiles.length, "allowed file")})` };
  }
  if (run.code !== 0) {
    const ended = run.code === null ? "ended by a signal" : `exit ${String(run.code)}`;
    const first = run.stderr.split("\n").find((line) => line.trim() !== "");
    return cannot(`git grep failed (${ended})${first === undefined ? "" : `: ${first}`}`);
  }
  const findings = parseGrep(run.stdout);
  if (findings.length === 0) return cannot("git grep reported a match but printed no record");
  const files = new Set(records(run.stdout).map((record) => record.path)).size;
  return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "sandbox path")} in ${plural(files, "tracked file")}` };
}
