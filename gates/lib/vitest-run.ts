// Shared discovery and execution for the sharded gate and the isolated Spec Kit checks.
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import type { TestCase, TestModule, TestSpecification, Vitest } from "vitest/node";
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

type TestError = NonNullable<ReturnType<TestCase["result"]>["errors"]>[number];

function assertionLine(module: TestModule, error: TestError): number | undefined {
  const browser = module.project.browser;
  if (browser !== undefined) {
    return browser.parseErrorStacktrace(error).find((frame) => frame.file === module.moduleId)?.line;
  }
  // Node stacks may give the same source path as either a path or file URL.
  const stack = typeof error.stack === "string" ? error.stack : "";
  for (const frame of stack.split("\n").slice(1)) {
    const suffix = frame.trim().match(/:(\d+):\d+\)?$/u);
    if (suffix?.index === undefined) continue;
    if (frame.trim().slice(0, suffix.index).endsWith(module.moduleId)) return Number(suffix[1]);
  }
  return undefined;
}

export function testRun(root: string, modules: readonly TestModule[], errors: readonly unknown[], includeSites = false): TestRun {
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
            ...(includeSites && test.location !== undefined ? { startLine: test.location.line } : {}),
            errors: (result.errors ?? []).map((error) => {
              const line = includeSites ? assertionLine(module, error) : undefined;
              return { ...failure(root, error), ...(line === undefined ? {} : { line }) };
            }),
          };
        }),
      };
    }),
  };
}

export async function withVitest<T>(root: string, operation: (context: Vitest) => Promise<T>, includeTaskLocation = false): Promise<T> {
  // Resolve the runner from the tested checkout, even when this script was launched from another revision.
  const require = createRequire(join(root, "package.json"));
  const runner = await import(require.resolve("vitest/node")) as typeof import("vitest/node");
  const context = await runner.createVitest({ root, run: true, watch: false, reporters: [], includeTaskLocation });
  try {
    return await operation(context);
  } finally {
    await context.close();
  }
}
