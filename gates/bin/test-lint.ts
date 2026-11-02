// The test-lint gate (FR-010, research.md R-06): ESLint with eslint.test.config.ts over all test code of the `--root`
// repository, its JSON report classified per contracts/gate-cli.md. The decision is gates/lib/eslint-report.ts; this
// entry only runs ESLint (the process boundary, tested by gates/test/integration/test-lint.test.ts).
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { classifyEslint } from "../lib/eslint-report.ts";
import { emit } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";

// Stryker disable next-line all: process boundary, covered by gates-integration
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration
  const eslint = [join(context.root, "node_modules", "eslint", "bin", "eslint.js"), "--config", "eslint.test.config.ts"];
  // Stryker disable next-line all: process boundary, covered by gates-integration
  const ran = await runTool(process.execPath, [...eslint, "--format", "json", "."], context.toolCwd, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration
  const result = classifyEslint("test-lint", { report: ran.stdout, exitCode: ran.exitCode, output: ran.stderr, root: context.root });
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration
if (import.meta.main) await main(run);
