import { basename, dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import type { TestModule, TestResult, TestSpecification } from "vitest/node";
import { emitStoryReport, replayStoryWorker, runStoryCommand, storyEnvironment, storyFiles } from "../bin/story-evidence.ts";
import type { StoryCommandTools } from "../bin/story-evidence.ts";
import type { Assertion } from "../lib/test-evidence.ts";

const repository = "/workspace/story-command";
const feature = "specs/001-story";
const phase = "7";
const setup = "pnpm run setup:offline";
const patterns = " :(glob)**/*.test.ts \t :(glob)**/*.stories.ts  ";
const current = "a".repeat(40);
const checkFailure = { phase, status: "fail", head: current, problems: ["unavailable revision"] };

function commandTools() {
  return {
    root: repository,
    git: vi.fn<StoryCommandTools["git"]>(() => current + "\n"),
    emit: vi.fn<StoryCommandTools["emit"]>(),
    phase: vi.fn<StoryCommandTools["phase"]>(() => Promise.resolve()),
    worker: vi.fn<StoryCommandTools["worker"]>(() => Promise.resolve()),
    failure: vi.fn<StoryCommandTools["failure"]>(),
  } satisfies StoryCommandTools;
}

describe("Story command entry", () => {
  it.each(["red", "check"])("parses a %s request and normalizes whitespace between pathspecs", async (mode) => {
    const tools = commandTools();
    await runStoryCommand([mode, feature, phase, setup, patterns, "fix-2"], tools);
    expect(tools.phase).toHaveBeenCalledExactlyOnceWith({
      mode, feature, phase, setup, patterns: [":(glob)**/*.test.ts", ":(glob)**/*.stories.ts"], label: "fix-2",
    });
    expect(tools.worker).not.toHaveBeenCalled();
    expect(tools.emit).not.toHaveBeenCalled();
    expect(tools.failure).not.toHaveBeenCalled();
  });

  it("dispatches a worker with both file arguments", async () => {
    const tools = commandTools();
    await runStoryCommand(["worker", "selection.json", "result.json"], tools);
    expect(tools.worker).toHaveBeenCalledExactlyOnceWith("selection.json", "result.json");
    expect(tools.phase).not.toHaveBeenCalled();
    expect(tools.failure).not.toHaveBeenCalled();
  });

  it("publishes a check exception at the normal phase verdict path", async () => {
    const tools = commandTools();
    tools.phase.mockRejectedValueOnce(new Error("unavailable revision"));
    await runStoryCommand(["check", feature, phase, setup, patterns], tools);
    expect(tools.git).toHaveBeenCalledExactlyOnceWith(["rev-parse", "HEAD"]);
    expect(tools.emit).toHaveBeenCalledExactlyOnceWith(checkFailure, join(repository, feature, "reviews", "phase-7", "tdd-check.json"));
    expect(tools.failure).not.toHaveBeenCalled();
  });

  it("emits a red-capture failure without a success record, including a thrown string", async () => {
    const tools = commandTools();
    tools.phase.mockRejectedValueOnce("setup was interrupted");
    await runStoryCommand(["red", feature, phase, setup, patterns, "phase"], tools);
    expect(tools.emit).toHaveBeenCalledExactlyOnceWith({
      phase, status: "fail", red: false, recorded: false, problem: "setup was interrupted",
    });
    expect(tools.git).not.toHaveBeenCalled();
    expect(tools.failure).not.toHaveBeenCalled();
  });

  it("reports an incomplete check request when the report path cannot be determined", async () => {
    const tools = commandTools();
    await runStoryCommand(["check", feature], tools);
    expect(tools.failure).toHaveBeenCalledExactlyOnceWith("invalid focused story evidence arguments");
    expect(tools.git).not.toHaveBeenCalled();
    expect(tools.emit).not.toHaveBeenCalled();
    expect(tools.phase).not.toHaveBeenCalled();
  });

  it("publishes the normal check failure report when the setup command is missing", async () => {
    const tools = commandTools();
    await runStoryCommand(["check", feature, phase], tools);
    expect(tools.emit).toHaveBeenCalledExactlyOnceWith({
      ...checkFailure, problems: ["invalid focused story evidence arguments"],
    }, join(repository, feature, "reviews", "phase-7", "tdd-check.json"));
    expect(tools.phase).not.toHaveBeenCalled();
  });

  it("publishes the normal check failure report when the pathspec is missing", async () => {
    const tools = commandTools();
    await runStoryCommand(["check", feature, phase, setup], tools);
    expect(tools.emit).toHaveBeenCalledExactlyOnceWith({
      ...checkFailure, problems: ["invalid focused story evidence arguments"],
    }, join(repository, feature, "reviews", "phase-7", "tdd-check.json"));
    expect(tools.phase).not.toHaveBeenCalled();
  });

  it.each([
    { args: [], reason: "invalid focused story evidence arguments" },
    { args: ["other", feature, phase, setup, patterns], reason: "invalid focused story evidence arguments" },
    { args: ["worker", "selection.json"], reason: "invalid focused story evidence arguments" },
    { args: ["worker", "selection.json", "result.json"], reason: "worker unavailable" },
  ])("routes only failed workers and invalid commands to the error output ($args)", async ({ args, reason }) => {
    const tools = commandTools();
    tools.worker.mockRejectedValueOnce(new Error("worker unavailable"));
    await runStoryCommand(args, tools);
    expect(tools.failure).toHaveBeenCalledExactlyOnceWith(reason);
    expect(tools.emit).not.toHaveBeenCalled();
  });

  it("preserves the caller environment and enables Vitest CI behavior", () => {
    const inherited = { CI: "false", OCELLE_CHROMIUM_PATH: "/opt/chromium", PATH: "/usr/bin" };
    expect(storyEnvironment(inherited)).toEqual({ ...inherited, CI: "true" });
    expect(inherited.CI).toBe("false");
  });

  it("writes the optional phase report before printing the same JSON", () => {
    const root = storyFiles.tempDir();
    try {
      expect(dirname(root)).toBe(tmpdir());
      expect(basename(root)).toMatch(/^ocelle-story-/);
      const reviews = join(root, feature, "reviews");
      storyFiles.mkdir(reviews);
      const report = join(reviews, "tdd-check.json");
      const json = JSON.stringify(checkFailure);
      const printed: string[] = [];
      emitStoryReport(checkFailure, report, (value) => {
        expect(storyFiles.read(report)).toBe(json + "\n");
        printed.push(value);
      });
      emitStoryReport(checkFailure, undefined, (value) => { printed.push(value); });
      expect(printed).toEqual([json, json]);
      expect(() => { storyFiles.remove(reviews); }).toThrow();
      storyFiles.remove(report);
      storyFiles.remove(report);
      expect(storyFiles.exists(report)).toBe(false);
    } finally {
      storyFiles.remove(root, true);
    }
    expect(storyFiles.exists(root)).toBe(false);
  });
});

type WorkerRunner = Parameters<typeof replayStoryWorker>[3];
type WorkerContext = Parameters<Parameters<WorkerRunner>[1]>[0];
interface WorkerSelection {
  readonly mode: "red" | "base" | "scaffold" | "fix" | "head";
  readonly expected?: readonly Assertion[];
  readonly missingModules?: readonly string[];
  readonly changed?: readonly string[];
}

const project = { name: "gates" };
const file = "test/answer.test.ts";
const helper = "test/helper.ts";
const test = "receives [the answer]+";
const source = { text: "assertAnswer(value);", line: 2, occurrence: 1 };
const helperSource = { file: helper, text: "expect(value).toBe(answer);", line: 2, occurrence: 1 };
const failureMessage = "expected initial value to be the answer";
const selected = [{ file, project: project.name }];
const assertion = { project: project.name, file, test, source, helper: helperSource, diagnostic: failureMessage };

async function workingTree(operation: (root: string) => Promise<void>): Promise<void> {
  const temporary = storyFiles.tempDir();
  try {
    const root = join(temporary, "checkout");
    storyFiles.mkdir(join(root, "test"));
    storyFiles.write(join(root, file), 'it("receives [the answer]+", () => {\r\n  assertAnswer(value);\r\n});\r\n');
    storyFiles.write(join(root, helper), "function assertAnswer(value) {\r\n  expect(value).toBe(answer);\r\n}\r\n");
    await operation(root);
  } finally {
    storyFiles.remove(temporary, true);
  }
}

function workerFixture(root: string, selection: WorkerSelection, modules: readonly TestModule[]) {
  const projectVariant = { name: "other-project" };
  const spec = { moduleId: join(root, file), project } as TestSpecification;
  const other = { moduleId: join(root, "test/other.test.ts"), project: projectVariant } as TestSpecification;
  const duplicate = { moduleId: spec.moduleId, project: projectVariant } as TestSpecification;
  const discover = vi.fn<WorkerContext["globTestSpecifications"]>().mockResolvedValue([spec, other, duplicate]);
  const run = vi.fn<WorkerContext["runTestSpecifications"]>().mockResolvedValue({ testModules: [...modules], unhandledErrors: [] });
  const runner = vi.fn<WorkerRunner>((_root, operation) => operation({ globTestSpecifications: discover, runTestSpecifications: run }));
  const input = join(root, "selection.json");
  const output = join(root, "result.json");
  storyFiles.write(input, JSON.stringify({
    changed: [file], deleted: [], extra: [], expected: [], missingModules: [], changedLines: { [file]: [{ start: 2, end: 2 }] }, ...selection,
  }));
  return { input, output, discover, run, runner, spec, duplicate, other };
}

function report(root: string, verdict: TestResult | undefined, message?: string, otherVerdict: TestResult = { state: "passed", errors: undefined }): TestModule {
  const tests = verdict === undefined ? [] : [{
    fullName: test,
    location: { line: 1, column: 1 },
    diagnostic: () => undefined,
    result: () => verdict,
  }, {
    fullName: "unrelated case",
    location: { line: 4, column: 1 },
    diagnostic: () => undefined,
    result: () => otherVerdict,
  }];
  return {
    moduleId: join(root, file),
    project,
    state: () => verdict?.state ?? "failed",
    children: { allTests: () => tests },
    errors: () => message === undefined ? [] : [{ name: "Error", message }],
  } as unknown as TestModule;
}

describe("Isolated story worker", () => {
  it("writes invalid evidence without running when discovery misses a changed test", async () => {
    await workingTree(async (root) => {
      const changed = ["test/missing.test.ts"];
      const { input, output, run, runner, discover } = workerFixture(root, { mode: "red", changed }, []);
      await replayStoryWorker(root, input, output, runner);
      expect(discover).toHaveBeenCalledOnce();
      expect(run).not.toHaveBeenCalled();
      expect(runner).toHaveBeenCalledExactlyOnceWith(root, expect.any(Function), true);
      expect(storyFiles.read(output)).toBe(JSON.stringify({
        evidence: { status: "invalid", assertions: [], problem: "changed test was not discovered: test/missing.test.ts" },
        selected: [],
      }) + "\n");
    });
  });

  it("restricts focused replay to the expected project and escapes literal test names", async () => {
    await workingTree(async (root) => {
      const verdict = report(root, { state: "passed", errors: undefined }, undefined, { state: "skipped", errors: undefined, note: undefined });
      const { input, output, run, runner, spec, duplicate, other } = workerFixture(root, { mode: "fix", expected: [assertion] }, [verdict]);
      await replayStoryWorker(root, input, output, runner);
      expect(run).toHaveBeenCalledExactlyOnceWith([spec]);
      expect(spec.testNamePattern?.test(test)).toBe(true);
      expect(spec.testNamePattern?.test("receives ttt")).toBe(false);
      expect(spec.testNamePattern?.test("before receives [the answer]+")).toBe(false);
      expect(duplicate.testNamePattern).toBeUndefined();
      expect(other.testNamePattern).toBeUndefined();
      expect(JSON.parse(storyFiles.read(output)) as unknown).toEqual({ evidence: { status: "green", assertions: [] }, selected });
    });
  });

  it("retains a reported helper assertion and its source-mapped caller and diagnostic", async () => {
    await workingTree(async (root) => {
      const failure = {
        name: "AssertionError", message: failureMessage,
        stack: [
          "AssertionError: " + failureMessage,
          "    at assertAnswer (" + join(root, helper) + ":2:1)",
          "    at test (" + join(root, file) + ":2:1)",
        ].join("\n"),
      };
      const modules = [report(root, { state: "failed", errors: [failure] })];
      const { input, output, run, runner, spec, discover } = workerFixture(root, { mode: "red" }, modules);
      discover.mockResolvedValueOnce([spec]);
      await replayStoryWorker(root, input, output, runner);
      expect(run).toHaveBeenCalledExactlyOnceWith([spec]);
      expect(spec.testNamePattern).toBeUndefined();
      expect(JSON.parse(storyFiles.read(output)) as unknown).toEqual({ evidence: { status: "red", assertions: [assertion] }, selected });
    });
  });

  it.each([
    { description: "an absent path", path: "test/missing-helper.ts" },
    { description: "a path outside the checkout", path: "../helper.ts" },
  ])("rejects expected helper source from $description", async ({ path }) => {
    await workingTree(async (root) => {
      storyFiles.write(join(root, "../helper.ts"), "expect(value).toBe(answer);\n");
      const expected = [{ ...assertion, helper: { ...helperSource, file: path } }];
      const modules = [report(root, { state: "passed", errors: undefined })];
      const { input, output, runner } = workerFixture(root, { mode: "fix", expected }, modules);
      await replayStoryWorker(root, input, output, runner);
      expect(JSON.parse(storyFiles.read(output)) as unknown).toEqual({
        evidence: { status: "invalid", assertions: [], problem: "expected assertion test or source missing or ambiguous in the replay" },
        selected,
      });
    });
  });

  it.each([
    { mode: "base", missingModules: ["src/answer.ts"], status: "missing-module" },
    { mode: "base", missingModules: [], status: "invalid" },
    { mode: "scaffold", missingModules: ["src/answer.ts"], status: "invalid" },
  ] as const)("limits missing-module evidence to the prior base and listed additions ($mode, $status)", async ({ mode, missingModules, status }) => {
    await workingTree(async (root) => {
      const diagnostic = "Cannot find module '../src/answer.ts'";
      const modules = [report(root, undefined, diagnostic)];
      const { input, output, runner } = workerFixture(root, { mode, expected: [assertion], missingModules }, modules);
      await replayStoryWorker(root, input, output, runner);
      expect(JSON.parse(storyFiles.read(output)) as unknown).toEqual({
        evidence: { status, assertions: [], ...(status === "invalid" ? { problem: "file error in " + file + ": " + diagnostic } : {}) },
        selected,
      });
    });
  });
});

it("accepts whitespace-only pathspec input without inserting a placeholder", async () => {
  const tools = commandTools();
  await runStoryCommand(["check", feature, phase, setup, " \t  \r\n "], tools);
  expect(tools.phase).toHaveBeenCalledExactlyOnceWith({ mode: "check", feature, phase, setup, patterns: [], label: undefined });
});

it("replays a direct assertion when neither the expected nor reported evidence names a helper", async () => {
  await workingTree(async (root) => {
    const directSource = { ...source, text: "expect(value).toBe(answer);" };
    storyFiles.write(join(root, file), 'it("receives [the answer]+", () => {\n  expect(value).toBe(answer);\n});\n');
    const directAssertion = { file, project: project.name, test, source: directSource, diagnostic: failureMessage };
    const failure = {
      name: "AssertionError", message: failureMessage,
      stack: "AssertionError: " + failureMessage + "\n    at test (" + join(root, file) + ":2:1)",
    };
    const modules = [report(root, { state: "failed", errors: [failure] })];
    const { input, output, runner } = workerFixture(root, { mode: "fix", expected: [directAssertion] }, modules);
    await replayStoryWorker(root, input, output, runner);
    expect(JSON.parse(storyFiles.read(output)) as unknown).toEqual({
      evidence: { status: "red", assertions: [directAssertion] }, selected,
    });
  });
});
