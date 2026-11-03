// The style-lint gate (FR-024, research.md R-07): Stylelint with stylelint.config.ts over the styles FR-024 covers
// in the `--root` repository, its JSON report classified by gates/lib/stylelint-report.ts. This entry only runs
// Stylelint (the process boundary, tested by gates/test/integration/gates-root.test.ts).
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import { runTool } from "../lib/spawn.ts";
import { classifyStylelint } from "../lib/stylelint-report.ts";

/** The styles FR-024 covers: style templates in the TypeScript of @ocelle/elements, and the stylesheets of both packages. */
export const styleGlobs = ["packages/elements/**/*.ts", "packages/elements/**/*.css", "packages/styles/**/*.css"];

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const dir = mkdtempSync(join(tmpdir(), "ocelle-style-lint-"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const reportFile = join(dir, "report.json");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const stylelint = [join(context.root, "node_modules", "stylelint", "bin", "stylelint.mjs"), "--config", "stylelint.config.ts"];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const args = [...stylelint, "--formatter", "json", "--output-file", reportFile, ...styleGlobs];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const ran = await runTool(process.execPath, args, context.toolCwd, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const report = existsSync(reportFile) ? readFileSync(reportFile, "utf8") : undefined;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  rmSync(dir, { recursive: true, force: true });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
  const result = classifyStylelint({ report, exitCode: ran.exitCode, output: `${ran.stdout}${ran.stderr}`, root: context.root });
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/gates-root.test.ts "style-lint --root <tmp> exits 1 with exactly the defect's finding at its repository path"
if (import.meta.main) await main(run);
