// The typecheck gate (FR-020, FR-002, contracts/gate-cli.md): tsc in strict mode over all repository TypeScript of
// the `--root` repository (the root tsconfig.json's include and exclude), its diagnostics classified by
// gates/lib/tsc-report.ts. This entry only runs tsc (the process boundary, tested by
// gates/test/integration/gates-root.test.ts).
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import { classifyTsc } from "../lib/tsc-report.ts";

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "typecheck --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "typecheck --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const tsc = [join(context.root, "node_modules", "typescript", "bin", "tsc"), "-p", "tsconfig.json", "--noEmit", "--pretty", "false"];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "typecheck --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const ran = await runTool(process.execPath, tsc, context.toolCwd, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "typecheck --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const result = classifyTsc({ output: `${ran.stdout}${ran.stderr}`, exitCode: ran.exitCode, root: context.root });
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "typecheck --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
