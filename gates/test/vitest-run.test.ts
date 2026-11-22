import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import type { ProjectBrowser, TestCase, TestDiagnostic, TestModule, TestResult, TestSpecification } from "vitest/node";
import { testFile, testRun } from "../lib/vitest-run.ts";

const root = "/repo/ocelle";
const filename = join(root, "gates/test/decision.test.ts");
const helper = join(root, "gates/test/scenarios/decision.ts");
const nodeProject = { name: "gates" };
const browserProject = { name: "elements (chromium)" };

type ReportedCase = Pick<TestCase, "fullName" | "location" | "result" | "diagnostic">;
interface ReportedProject {
  name: string;
  browser?: Pick<ProjectBrowser, "parseErrorStacktrace">;
}
type DiagnosticError = NonNullable<TestResult["errors"]>[number];

function diagnostic(duration: number): TestDiagnostic {
  return { duration, slow: false, heap: undefined, startTime: 12, retryCount: 0, repeatCount: 0, flaky: false };
}

/** Only the fields read by the adapters are needed to model a Vitest reporter record. */
function reportedCase(fullName: string, result: TestResult, line?: number, duration?: number): ReportedCase {
  return {
    fullName,
    location: line === undefined ? undefined : { line, column: 1 },
    result: () => result,
    diagnostic: () => duration === undefined ? undefined : diagnostic(duration),
  };
}

function moduleReport(options: {
  filename?: string;
  project?: ReportedProject;
  tests?: readonly ReportedCase[];
  errors?: readonly DiagnosticError[];
  state?: ReturnType<TestModule["state"]>;
}): TestModule {
  const module = {
    moduleId: options.filename ?? filename,
    project: options.project ?? nodeProject,
    state: () => options.state ?? "failed",
    errors: () => options.errors ?? [],
    children: { allTests: () => (options.tests ?? []).values() },
  };
  return module as TestModule;
}

function failing(fullName: string, stack?: string, line?: number, duration?: number): ReportedCase {
  const error = { name: "AssertionError", message: "Expected submitted answer", ...(stack === undefined ? {} : { stack }) };
  return reportedCase(fullName, { state: "failed", errors: [error] }, line, duration);
}

describe("Vitest report conversion", () => {
  it("preserves project identity when one file belongs to multiple projects", () => {
    const spec = { moduleId: filename, project: nodeProject } as TestSpecification;
    const browserSpec = { moduleId: filename, project: browserProject } as TestSpecification;
    expect([testFile(root, spec), testFile(root, browserSpec)]).toEqual([
      { project: "gates", file: "gates/test/decision.test.ts" },
      { project: "elements (chromium)", file: "gates/test/decision.test.ts" },
    ]);
  });

  it("preserves failed, pending and skipped cases and keeps test, module and framework errors distinct", () => {
    const fail = failing("submission > records LF", undefined, 10, 7);
    const tests = [
      fail,
      reportedCase("submission > finishes", { state: "passed", errors: undefined }, 15, 3),
      reportedCase("submission > throws", { state: "failed", errors: [{ name: "TypeError", message: "invalid receiver" }] }),
      reportedCase("submission > has not run", { state: "pending", errors: undefined }),
      reportedCase("submission > was skipped", { state: "skipped", errors: undefined, note: undefined }),
    ];
    const fileError = { name: "TypeError", message: `Cannot load ${filename} (caused by ${helper})` };
    const modules = [
      moduleReport({ tests, errors: [fileError] }),
      moduleReport({ project: browserProject, filename: join(root, "gates/test/other.test.ts"), state: "queued" }),
    ];
    expect(testRun(root, modules, ["worker stopped", null, 12, { name: 4, message: 5 }, { name: "SyntaxError", message: "bad import" }])).toEqual({
      errors: [
        { name: "", message: "worker stopped" },
        { name: "", message: "unknown error" },
        { name: "", message: "unknown error" },
        { name: "", message: "unknown error" },
        { name: "SyntaxError", message: "bad import" },
      ],
      files: [
        {
          project: "gates", file: "gates/test/decision.test.ts", state: "failed", durationMs: 10,
          errors: [{ name: "TypeError", message: "Cannot load gates/test/decision.test.ts (caused by gates/test/scenarios/decision.ts)" }],
          tests: [
            { name: "submission > records LF", state: "failed", errors: [{ name: "AssertionError", message: "Expected submitted answer" }] },
            { name: "submission > finishes", state: "passed", errors: [] },
            { name: "submission > throws", state: "failed", errors: [{ name: "TypeError", message: "invalid receiver" }] },
            { name: "submission > has not run", state: "pending", errors: [] },
            { name: "submission > was skipped", state: "skipped", errors: [] },
          ],
        },
        { project: "elements (chromium)", file: "gates/test/other.test.ts", state: "queued", durationMs: 0, errors: [], tests: [] },
      ],
    });
  });

  it("finds the Node assertion line without attributing internal and out-of-range frames to the test", () => {
    const tests = [
      failing("submission > fails", [
        `AssertionError: message mentioning a stack frame (${filename}:11:1)`,
        `    at internal (${root}/node_modules/vitest/index.js:9:4)`,
        "    at external (/work/vitest/runner.ts:9:4)",
        `    at assertAnswer (${helper}:16:3)`,
        `    at later (${filename}:20:1)`,
        "    at ignored",
        `    at ${filename}:12:7 with trailing metadata`,
        `    at ${filename}:13:23   `,
      ].join("\n"), 10),
      failing("submission > starts next", [
        "AssertionError: message",
        `    at prior (${filename}:19:2)`,
      ].join("\n"), 20),
    ];
    const outcome = testRun(root, [moduleReport({ tests })], [], true).files[0]?.tests;
    expect(outcome).toEqual([
      { name: "submission > fails", state: "failed", startLine: 10,
        errors: [{ name: "AssertionError", message: "Expected submitted answer", line: 13,
          helperFile: "gates/test/scenarios/decision.ts", helperLine: 16 }] },
      { name: "submission > starts next", state: "failed", startLine: 20,
        errors: [{ name: "AssertionError", message: "Expected submitted answer" }] },
    ]);
  });

  it("leaves absent source locations unset even when a stack frame looks like a test", () => {
    const tests = [
      failing("submission > no metadata", `AssertionError: missing\n    at ${filename}:17:2`),
      failing("submission > no stack", undefined, 20),
    ];
    expect(testRun(root, [moduleReport({ tests })], [], true).files[0]?.tests).toEqual([
      { name: "submission > no metadata", state: "failed",
        errors: [{ name: "AssertionError", message: "Expected submitted answer" }] },
      { name: "submission > no stack", state: "failed", startLine: 20,
        errors: [{ name: "AssertionError", message: "Expected submitted answer" }] },
    ]);
  });

  it("uses the browser's source-mapped frames and omits a redundant helper site for a direct assertion", () => {
    const project: ReportedProject = {
      ...browserProject,
      browser: { parseErrorStacktrace: () => [{ file: filename, method: "example", line: 14, column: 3 }] },
    };
    const tests = [failing("submission > maps the browser stack", "AssertionError: bundle.js:235:2", 10)];
    expect(testRun(root, [moduleReport({ project, tests })], [], true).files[0]?.tests).toEqual([
      { name: "submission > maps the browser stack", state: "failed", startLine: 10,
        errors: [{ name: "AssertionError", message: "Expected submitted answer", line: 14 }] },
    ]);
  });

  it("retains assertion locations in raw Node paths containing a percent sign", () => {
    const moduleId = join(root, "gates/test/rate-100%.test.ts");
    const tests = [failing("submission > reports percentages", `AssertionError: rate\n    at ${moduleId}:13:2`, 10)];
    const read = () => testRun(root, [moduleReport({ filename: moduleId, tests })], [], true);
    expect(read).not.toThrow();
    expect(read().files[0]?.tests[0]?.errors).toEqual([
      { name: "AssertionError", message: "Expected submitted answer", line: 13 },
    ]);
  });

  it("decodes reserved characters in Node file URL stack frames", () => {
    const moduleId = join(root, "gates/test/decision #2.test.ts");
    const uri = pathToFileURL(moduleId).href;
    const tests = [failing("submission > reports shared decisions", `AssertionError: decision\n    at submit (${uri}:13:2)`, 13)];
    expect(testRun(root, [moduleReport({ filename: moduleId, tests })], [], true).files[0]?.tests[0]?.errors).toEqual([
      { name: "AssertionError", message: "Expected submitted answer", line: 13 },
    ]);
  });
});
