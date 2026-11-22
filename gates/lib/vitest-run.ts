// Shared discovery and execution for the sharded gate and the isolated Spec Kit checks.
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import type { TestModule, TestSpecification, Vitest } from "vitest/node";
import type { Failure, TestFile, TestRun } from "./test-evidence.ts";

export function testFile(root: string, spec: TestSpecification): TestFile {
  return { project: spec.project.name, file: relative(root, spec.moduleId) };
}

function failure(root: string, error: unknown): Failure {
  if (typeof error !== "object" || error === null) return { name: "", message: typeof error === "string" ? error : "unknown error" };
  const { name, message } = error as { name?: unknown; message?: unknown };
  return {
    name: typeof name === "string" ? name : "",
    message: typeof message === "string" ? message.replaceAll(`${root}/`, "") : "unknown error",
  };
}

export function testRun(root: string, modules: readonly TestModule[], errors: readonly unknown[]): TestRun {
  return {
    errors: errors.map((error) => failure(root, error)),
    files: modules.map((module) => {
      const tests = [...module.children.allTests()];
      return {
        project: module.project.name,
        file: relative(root, module.moduleId),
        state: module.state(),
        errors: module.errors().map((error) => failure(root, error)),
        durationMs: tests.reduce((sum, test) => sum + (test.diagnostic()?.duration ?? 0), 0),
        tests: tests.map((test) => {
          const result = test.result();
          return {
            name: test.fullName,
            state: result.state,
            errors: (result.errors ?? []).map((error) => failure(root, error)),
          };
        }),
      };
    }),
  };
}

export async function withVitest<T>(root: string, operation: (context: Vitest) => Promise<T>): Promise<T> {
  // Resolve the runner from the tested checkout, even when this script was launched from another revision.
  const require = createRequire(join(root, "package.json"));
  const runner = await import(require.resolve("vitest/node")) as typeof import("vitest/node");
  const context = await runner.createVitest({ root, run: true, watch: false, reporters: [] });
  try {
    return await operation(context);
  } finally {
    await context.close();
  }
}
