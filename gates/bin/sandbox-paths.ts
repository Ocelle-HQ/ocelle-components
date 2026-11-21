// The sandbox-paths gate (op 023, #60; ops/023-public-repo-hygiene/plan.md *The gate*): no tracked file of the `--root`
// checkout but the four allowed files may hold a line that matches the sandbox-path rule. The root must be the top of
// a git work tree (so a parent repository is never scanned by mistake) and must track a file (a scan of nothing would
// pass vacuously); then `git grep` searches the tracked files with the rule, and gates/lib/sandbox-paths.ts decides.
// The gate reads gates/plants/ and gates/test/fixtures/ in normal mode: it scans the whole tracked tree (an exception
// to contracts/gate-cli.md). Every line here is the process boundary, run by gates/test/integration/sandbox-paths.test.ts.
import { realpath } from "node:fs/promises";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { allowedFiles, grepArgs, verdict } from "../lib/sandbox-paths.ts";
import { runTool } from "../lib/spawn.ts";

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git"
async function isTop(root: string, io: Io): Promise<boolean> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git"
  const top = await runTool("git", ["-C", root, "rev-parse", "--show-toplevel"], root, io.env).catch(() => undefined);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git"
  if (top?.exitCode !== 0) return false;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git"
  const [real, own] = await Promise.all([realpath(top.stdout.replace(/\n$/, "")), realpath(root)]);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git"
  return real === own;
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 1 with exactly the two findings of a tracked file with a store path on line 2 and a checkout path on line 5, echoing neither line"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 1 with exactly the two findings of a tracked file with a store path on line 2 and a checkout path on line 5, echoing neither line"
  const { root } = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 naming a root that is not the top of a git work tree: a subdirectory, and a directory outside git"
  if (!(await isTop(root, io))) return emit({ exit: 2, cause: `sandbox-paths: could not run: ${root} is not the top of a git work tree` }, io.out, io.err);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 with the cause no tracked file in a repository that tracks nothing"
  const listed = await runTool("git", ["-C", root, "ls-files", "-z"], root, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 2 with the cause no tracked file in a repository that tracks nothing"
  const tracked = listed.stdout.split("\0").filter((path) => path !== "").length;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 1 with exactly the two findings of a tracked file with a store path on line 2 and a checkout path on line 5, echoing neither line"
  const grep = await runTool("git", ["-C", root, "-c", "core.quotePath=false", "grep", ...grepArgs(allowedFiles)], root, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 1 with exactly the two findings of a tracked file with a store path on line 2 and a checkout path on line 5, echoing neither line"
  return emit(verdict({ tracked, code: grep.exitCode, stdout: grep.stdout, stderr: grep.stderr }), io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/sandbox-paths.test.ts "exits 0 when the matching lines are only in the four allowed files"
if (import.meta.main) await main(run);
