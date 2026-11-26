// The full-suite CI plan, exact project/file execution, and the verdict behind the required Unit tests check.
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { processIo } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { planTestShards, validTestPlan, verifyTestShard, verifyTestShards } from "../lib/test-evidence.ts";
import type { ShardResult, TestFile, TestRun } from "../lib/test-evidence.ts";
import { testFile, testRun, withVitest } from "../lib/vitest-run.ts";

interface TestCollection {
  readonly files: readonly TestFile[];
  readonly execute: (indices: ReadonlySet<number>) => Promise<TestRun>;
}

export interface ShardTools {
  readonly revision: () => string;
  readonly read: (path: string) => string;
  readonly write: (path: string, text: string) => void;
  readonly list: (path: string) => readonly string[];
  readonly now: () => number;
  readonly withTests: <T>(operation: (collection: TestCollection) => Promise<T>) => Promise<T>;
}

function projectTests(report: ShardResult["files"]): string[] {
  return report.flatMap(({ project, file, tests }) =>
    tests.map(({ name, state }) => JSON.stringify([project, file, name, state]))).sort();
}

function identity({ project, file }: TestFile): string {
  return JSON.stringify([project, file]);
}

async function command(argv: readonly string[], tools: ShardTools, out: Io["out"]): Promise<void> {
  const [operation, planPath, arg, output] = argv;
  if (operation === undefined || planPath === undefined || arg === undefined) {
    throw new Error("usage: test-shards plan <plan> <count> | run <plan> <index> <report> | verify <plan> <reports> [full-report]");
  }
  const revision = tools.revision().trim();
  const read = (path: string): unknown => JSON.parse(tools.read(path)) as unknown;
  const write = (path: string, value: object): void => {
    tools.write(path, `${JSON.stringify(value)}\n`);
  };
  if (operation === "plan") {
    const plan = await tools.withTests(({ files }) => Promise.resolve(planTestShards(revision, files, Number(arg))));
    write(planPath, plan);
    out(JSON.stringify(plan.shards.map((_, index) => index)));
    return;
  }

  const plan = read(planPath);
  if (!validTestPlan(plan, revision)) throw new Error("invalid plan inventory or revision");
  if (operation === "run") {
    const index = Number(arg);
    const assigned = plan.shards[index];
    if (assigned === undefined || output === undefined) throw new Error("invalid shard index or report path");
    const remaining = new Set(assigned.map(identity));
    const started = tools.now();
    const result = await tools.withTests(({ files, execute }) => {
      const indices = new Set<number>();
      for (const [position, file] of files.entries()) {
        if (remaining.delete(identity(file))) indices.add(position);
      }
      if (remaining.size !== 0) throw new Error("shard discovery did not find every assigned test file");
      return execute(indices);
    });
    const report = { ...result, revision, index };
    write(output, report);
    const counts = verifyTestShard(assigned, report);
    out(`Unit tests shard ${arg}: ${String(counts.tests)} tests in ${String(counts.files)} files passed in ${String((tools.now() - started) / 1000)}s`);
    return;
  }

  if (operation === "verify") {
    const results = tools.list(arg).map((directory) => read(join(arg, directory, "result.json")));
    const counts = verifyTestShards(plan, results, revision);
    if (output !== undefined) {
      const full = read(output) as ShardResult;
      verifyTestShards({ ...plan, shards: [plan.inventory] }, [full], revision);
      const expected = projectTests(full.files);
      const actual = projectTests((results as ShardResult[]).flatMap((result) => result.files));
      if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error("full and sharded per-test results differ");
      out("Full and sharded project/file/test results match.");
    }
    out(`Unit tests: ${String(counts.tests)} tests passed in ${String(counts.files)} files across ${String(plan.shards.length)} shards`);
    return;
  }
  throw new Error(`unknown operation: ${operation}`);
}

/** The plan, shard and aggregate decisions. Tools supply observations and perform the requested I/O. */
export async function runTestShards(argv: readonly string[], tools: ShardTools, io: Pick<Io, "out" | "err">): Promise<number> {
  try {
    await command(argv, tools, io.out);
    return 0;
  } catch (error) {
    io.err(`Unit tests: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
function processTests<T>(cwd: string, operation: (collection: TestCollection) => Promise<T>): Promise<T> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
  return withVitest(cwd, async (context) => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
    const specs = await context.globTestSpecifications();
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
    return operation({
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
      files: specs.map((spec) => testFile(cwd, spec)),
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
      execute: async (indices) => {
        // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
        const run = await context.runTestSpecifications(specs.filter((_, index) => indices.has(index)));
        // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
        return testRun(cwd, run.testModules, run.unhandledErrors);
      },
    });
  });
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
function processTools(cwd: string): ShardTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
    revision: () => execFileSync("git", ["rev-parse", "HEAD"], { cwd, encoding: "utf8" }),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
    read: (path) => readFileSync(path, "utf8"),
    write: writeFileSync,
    list: readdirSync,
    now: Date.now,
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
    withTests: (operation) => processTests(cwd, operation),
  };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
if (import.meta.main) process.exitCode = await runTestShards(process.argv.slice(2), processTools(process.cwd()), processIo());
