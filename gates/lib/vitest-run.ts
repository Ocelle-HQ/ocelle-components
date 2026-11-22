// Shared discovery and execution for the sharded gate and the isolated Spec Kit checks.
import { createRequire } from "node:module";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
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

interface Frame {
  readonly file: string;
  readonly line: number;
}

function sourceFrames(module: TestModule, error: TestError): Frame[] {
  const browser = module.project.browser;
  if (browser !== undefined) return browser.parseErrorStacktrace(error);

  // Node stacks use an absolute source path or a file URL, depending on the worker's evaluator.
  if (typeof error.stack !== "string") return [];
  return error.stack.split("\n").slice(1).flatMap((frame) => {
    const parts = /(?:\(|at (?:async )?)((?:file:\/\/)?\/[^\n]+):(\d+):\d+\)?$/.exec(frame.trim());
    if (parts?.[1] === undefined) return [];
    const file = parts[1].startsWith("file:") ? fileURLToPath(parts[1]) : parts[1];
    return [{ file, line: Number(parts[2]) }];
  });
}

function assertionSite(root: string, module: TestModule, error: TestError, start?: number, end?: number): Pick<Failure, "line" | "helperFile" | "helperLine"> {
  if (start === undefined) return {};
  const frames = sourceFrames(module, error);
  const caller = frames.find((frame) =>
    frame.file === module.moduleId && frame.line >= start && (end === undefined || frame.line < end));
  if (caller === undefined) return {};
  const assertion = frames.find((frame) => frame.file.startsWith(`${root}/`) && !frame.file.includes("/node_modules/"));
  if (assertion === undefined || assertion === caller) return { line: caller.line };
  return { line: caller.line, helperFile: relative(root, assertion.file), helperLine: assertion.line };
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
          const start = test.location?.line;
          const end = tests.find((each) => start !== undefined && each.location !== undefined && each.location.line > start)?.location?.line;
          return {
            name: test.fullName,
            state: result.state,
            ...(includeSites && test.location !== undefined ? { startLine: test.location.line } : {}),
            errors: (result.errors ?? []).map((error) => ({
              ...failure(root, error), ...(includeSites ? assertionSite(root, module, error, start, end) : {}),
            })),
          };
        }),
      };
    }),
  };
}

// Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
export async function withVitest<T>(root: string, operation: (context: Vitest) => Promise<T>, includeTaskLocation = false): Promise<T> {
  // Resolve the runner from the tested checkout, even when this script was launched from another revision.
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
  const require = createRequire(join(root, "package.json"));
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
  const runner = await import(require.resolve("vitest/node")) as typeof import("vitest/node");
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "runs real clean-worktree red, base and green checks and refuses malformed cache reuse"
  const context = await runner.createVitest({ root, run: true, watch: false, reporters: [], includeTaskLocation });
  // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
  try {
    return await operation(context);
    // Stryker disable next-line BlockStatement: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
  } finally {
    // Stryker disable next-line all: process boundary, covered by gates/test/integration/test-workflow-evidence.test.ts "executes a complete configured inventory and compares it with the full Vitest run"
    await context.close();
  }
}
