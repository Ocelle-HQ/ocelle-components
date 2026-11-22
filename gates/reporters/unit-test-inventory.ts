// Optional overlay on the normal unsharded gate for a same-revision rollout comparison.
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import type { Reporter, TestModule } from "vitest/node";
import { testRun } from "../lib/vitest-run.ts";

export default class UnitTestInventory implements Reporter {
  onTestRunEnd(modules: readonly TestModule[], errors: readonly unknown[]): void {
    const output = process.env.OCELLE_TEST_REPORT;
    if (output === undefined) throw new Error("OCELLE_TEST_REPORT is required");
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    writeFileSync(output, JSON.stringify({ revision, index: 0, ...testRun(process.cwd(), modules, errors) }));
  }
}
