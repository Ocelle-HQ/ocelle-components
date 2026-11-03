// The code-lint gate (FR-020, research.md R-05): ESLint with eslint.config.ts over all repository TypeScript of the
// `--root` repository, its JSON report classified per contracts/gate-cli.md. The decision is gates/lib/eslint-report.ts;
// this entry only runs ESLint (the process boundary, tested by gates/test/integration/gates-root.test.ts).
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { classifyEslint } from "../lib/eslint-report.ts";
import { emit } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const eslint = [join(context.root, "node_modules", "eslint", "bin", "eslint.js"), "--config", "eslint.config.ts"];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const ran = await runTool(process.execPath, [...eslint, "--format", "json", "."], context.toolCwd, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const result = classifyEslint("lint", { report: ran.stdout, exitCode: ran.exitCode, output: ran.stderr, root: context.root });
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
