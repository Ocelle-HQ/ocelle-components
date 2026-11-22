// The full-suite CI plan, exact project/file execution, and the verdict behind the required Unit tests check.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { planTestShards, validTestPlan, verifyTestShards } from "../lib/test-evidence.ts";
import type { ShardResult } from "../lib/test-evidence.ts";
import { testFile, testRun, withVitest } from "../lib/vitest-run.ts";

const cwd = process.cwd();

function read(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8")) as unknown;
}

function write(path: string, value: object): void {
  writeFileSync(path, `${JSON.stringify(value)}\n`);
}

function projectFiles(report: ShardResult["files"]): string[] {
  return report.flatMap(({ project, file, tests }) =>
    tests.map(({ name, state }) => JSON.stringify([project, file, name, state]))).sort();
}

async function main(): Promise<void> {
  const revision = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const [operation, planPath, arg, output] = process.argv.slice(2);
  if (operation === undefined || planPath === undefined || arg === undefined) {
    throw new Error("usage: test-shards plan <plan> <count> | run <plan> <index> <report> | verify <plan> <reports> [full-report]");
  }
  if (operation === "plan") {
    const plan = await withVitest(cwd, async (context) =>
      planTestShards(revision, (await context.globTestSpecifications()).map((spec) => testFile(cwd, spec)), Number(arg)));
    write(planPath, plan);
    console.log(JSON.stringify(plan.shards.map((_, index) => index)));
    return;
  }

  const plan = read(planPath);
  if (!validTestPlan(plan, revision)) throw new Error("invalid plan inventory or revision");
  if (operation === "run") {
    const index = Number(arg);
    const assigned = plan.shards[index];
    if (assigned === undefined || output === undefined) throw new Error("invalid shard index or report path");
    const keys = new Set(assigned.map((entry) => JSON.stringify([entry.project, entry.file])));
    const started = Date.now();
    const result = await withVitest(cwd, async (context) => {
      const specs = (await context.globTestSpecifications()).filter((spec) => {
        const { project, file } = testFile(cwd, spec);
        return keys.has(JSON.stringify([project, file]));
      });
      if (specs.length !== assigned.length) throw new Error("shard discovery did not find every assigned test file");
      const run = await context.runTestSpecifications(specs);
      return testRun(cwd, run.testModules, run.unhandledErrors);
    });
    write(output, { revision, index, ...result });
    const counts = verifyTestShards({ ...plan, inventory: assigned, shards: [assigned] }, [{ revision, index: 0, ...result }], revision);
    console.log(`Unit tests shard ${arg}: ${String(counts.tests)} tests in ${String(counts.files)} files passed in ${String((Date.now() - started) / 1000)}s`);
    return;
  }

  if (operation === "verify") {
    const results = readdirSync(arg).map((directory) => read(join(arg, directory, "result.json")));
    const counts = verifyTestShards(plan, results, revision);
    if (output !== undefined) {
      const full = read(output) as ShardResult;
      verifyTestShards({ ...plan, shards: [plan.inventory] }, [full], revision);
      const expected = projectFiles(full.files);
      const actual = projectFiles((results as ShardResult[]).flatMap((result) => result.files));
      if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error("full and sharded per-test results differ");
      console.log("Full and sharded project/file/test results match.");
    }
    console.log(`Unit tests: ${String(counts.tests)} tests passed in ${String(counts.files)} files across ${String(plan.shards.length)} shards`);
    return;
  }
  throw new Error(`unknown operation: ${operation}`);
}

try {
  await main();
} catch (error) {
  console.error(`Unit tests: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
