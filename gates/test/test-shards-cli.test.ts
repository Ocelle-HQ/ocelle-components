import { describe, expect, it } from "vitest";
import { runTestShards } from "../bin/test-shards.ts";
import type { ShardTools } from "../bin/test-shards.ts";
import type { ShardResult, TestFile, TestFileResult, TestRun } from "../lib/test-evidence.ts";

const revision = "a".repeat(40);
const alpha = { project: "alpha", file: "test/control.test.ts" };
const beta = { project: "beta", file: alpha.file };
const other = { project: "alpha", file: "test/unrelated.test.ts" };
const plan = { revision, inventory: [alpha, beta], shards: [[alpha], [beta]] };
const planPath = "plan.json";
const reports = "reports";
const first = "reports/shard-0/result.json";
const second = "reports/shard-1/result.json";
const full = "full.json";

function report(file: TestFile, name: string): TestFileResult {
  return { ...file, state: "passed", errors: [], durationMs: 10, tests: [{ name, state: "passed", errors: [] }] };
}

const firstResult: ShardResult = { revision, index: 0, errors: [], files: [report(alpha, "first")] };
const secondResult: ShardResult = { revision, index: 1, errors: [], files: [report(beta, "second")] };
const fullResult: ShardResult = { revision, index: 0, errors: [], files: [...firstResult.files, ...secondResult.files] };

function fixture() {
  const data = new Map([
    [planPath, JSON.stringify(plan)],
    [first, JSON.stringify(firstResult)],
    [second, JSON.stringify(secondResult)],
    [full, JSON.stringify(fullResult)],
  ]);
  const discovered = [other, beta, alpha];
  const messages: string[] = [];
  const errors: string[] = [];
  const writes: string[] = [];
  const executions: number[][] = [];
  let clock = 1_000;
  let result: TestRun = firstResult;
  const tools: ShardTools = {
    revision: () => `${revision}\n`,
    read: (path) => {
      const text = data.get(path);
      if (text === undefined) throw new Error(`no data at ${path}`);
      return text;
    },
    write: (path, text) => {
      data.set(path, text);
      writes.push(path);
    },
    list: (path) => {
      expect(path).toBe(reports);
      return ["shard-1", "shard-0"];
    },
    now: () => {
      const current = clock;
      clock += 2_500;
      return current;
    },
    withTests: (operation) => operation({
      files: discovered,
      execute: (indices) => {
        executions.push([...indices]);
        return Promise.resolve(result);
      },
    }),
  };
  return {
    data, discovered, errors, executions, messages, tools, writes,
    run: (...args: string[]) => runTestShards(args, tools, { out: (line) => messages.push(line), err: (line) => errors.push(line) }),
    report: (next: TestRun) => { result = next; },
  };
}

describe("shard CLI decisions", () => {
  it.each([[], ["plan"], ["plan", planPath]])("returns usage for incomplete arguments %j", async (...args) => {
    const { run, errors, writes } = fixture();
    expect(await run(...args)).toBe(1);
    expect(errors).toEqual(["Unit tests: usage: test-shards plan <plan> <count> | run <plan> <index> <report> | verify <plan> <reports> [full-report]"]);
    expect(writes).toEqual([]);
  });

  it("plans the complete inventory and prints all matrix indices", async () => {
    const { run, data, messages, writes, executions } = fixture();
    expect(await run("plan", "planned.json", "2")).toBe(0);
    expect(data.get("planned.json")).toBe(`${JSON.stringify({
      revision, inventory: [alpha, other, beta], shards: [[alpha, beta], [other]],
    })}\n`);
    expect(messages).toEqual(["[0,1]"]);
    expect(writes).toEqual(["planned.json"]);
    expect(executions).toEqual([]);
  });

  it("does not write a plan when the matrix count is invalid", async () => {
    const { run, errors, writes } = fixture();
    expect(await run("plan", "planned.json", "0")).toBe(1);
    expect(errors).toEqual(["Unit tests: invalid revision, shard count, or test inventory"]);
    expect(writes).toEqual([]);
  });

  it.each(["run", "verify"])("rejects a stale plan before the %s operation", async (operation) => {
    const { run, errors, data, executions, writes } = fixture();
    data.set(planPath, JSON.stringify({ ...plan, revision: "b".repeat(40) }));
    expect(await run(operation, planPath, "0", "shard.json")).toBe(1);
    expect(errors).toEqual(["Unit tests: invalid plan inventory or revision"]);
    expect(executions).toEqual([]);
    expect(writes).toEqual([]);
  });

  it.each([
    { index: "-1", destination: ["shard.json"] },
    { index: "2", destination: ["shard.json"] },
    { index: "0", destination: [] },
  ])("rejects invalid shard index $index or missing output $destination", async ({ index, destination }) => {
    const { run, errors, executions, writes } = fixture();
    expect(await run("run", planPath, index, ...destination)).toBe(1);
    expect(errors).toEqual(["Unit tests: invalid shard index or report path"]);
    expect(executions).toEqual([]);
    expect(writes).toEqual([]);
  });

  it("runs only the assigned project and file, writes the actual shard index and prints timing", async () => {
    const { run, executions, data, messages, report: setResult } = fixture();
    setResult({ files: secondResult.files, errors: [] });
    expect(await run("run", planPath, "1", "shard.json")).toBe(0);
    expect(executions).toEqual([[1]]);
    expect(data.get("shard.json")).toMatch(/\n$/);
    expect(JSON.parse(data.get("shard.json") ?? "null")).toEqual(secondResult);
    expect(messages).toEqual(["Unit tests shard 1: 1 tests in 1 files passed in 2.5s"]);
  });

  it("refuses incomplete discovery before Vitest runs or writes a report", async () => {
    const { run, errors, discovered, executions, writes } = fixture();
    discovered.pop();
    expect(await run("run", planPath, "0", "shard.json")).toBe(1);
    expect(errors).toEqual(["Unit tests: shard discovery did not find every assigned test file"]);
    expect(executions).toEqual([]);
    expect(writes).toEqual([]);
  });

  it("preserves a failing shard report and rejects the shard without a success summary", async () => {
    const { run, data, errors, messages, report: setResult } = fixture();
    const errorsFromRunner = [{ name: "Error", message: "worker failed" }];
    setResult({ files: firstResult.files, errors: errorsFromRunner });
    expect(await run("run", planPath, "0", "shard.json")).toBe(1);
    expect(JSON.parse(data.get("shard.json") ?? "null")).toEqual({ ...firstResult, errors: errorsFromRunner });
    expect(errors).toEqual(["Unit tests: shard 0 reported errors"]);
    expect(messages).toEqual([]);
  });

  it("verifies all artifact reports without requiring a comparison file", async () => {
    const { run, messages, errors } = fixture();
    expect(await run("verify", planPath, reports)).toBe(0);
    expect(messages).toEqual(["Unit tests: 2 tests passed in 2 files across 2 shards"]);
    expect(errors).toEqual([]);
  });

  it("verifies same-revision full-run parity and reports the exact totals", async () => {
    const { run, messages } = fixture();
    expect(await run("verify", planPath, reports, full)).toBe(0);
    expect(messages).toEqual([
      "Full and sharded project/file/test results match.",
      "Unit tests: 2 tests passed in 2 files across 2 shards",
    ]);
  });

  it("detects mismatched test identities even when project files and totals agree", async () => {
    const { run, data, errors, messages } = fixture();
    data.set(full, JSON.stringify({ ...fullResult, files: [report(alpha, "changed"), report(beta, "second")] }));
    expect(await run("verify", planPath, reports, full)).toBe(1);
    expect(errors).toEqual(["Unit tests: full and sharded per-test results differ"]);
    expect(messages).toEqual([]);
  });

  it("detects test names moved between projects on the same file", async () => {
    const { run, data, errors } = fixture();
    data.set(full, JSON.stringify({ ...fullResult, files: [report(alpha, "second"), report(beta, "first")] }));
    expect(await run("verify", planPath, reports, full)).toBe(1);
    expect(errors).toEqual(["Unit tests: full and sharded per-test results differ"]);
  });

  it("rejects full-run errors before checking parity", async () => {
    const { run, data, errors, messages } = fixture();
    data.set(full, JSON.stringify({ ...fullResult, errors: [{ name: "Error", message: "runner crashed" }] }));
    expect(await run("verify", planPath, reports, full)).toBe(1);
    expect(errors).toEqual(["Unit tests: shard 0 reported errors"]);
    expect(messages).toEqual([]);
  });

  it("fails on a missing artifact rather than printing a passing aggregate", async () => {
    const { run, data, errors, messages } = fixture();
    data.delete(second);
    expect(await run("verify", planPath, reports)).toBe(1);
    expect(errors).toEqual([`Unit tests: no data at ${second}`]);
    expect(messages).toEqual([]);
  });

  it("rejects an unknown operation", async () => {
    const { run, errors } = fixture();
    expect(await run("check", planPath, "0")).toBe(1);
    expect(errors).toEqual(["Unit tests: unknown operation: check"]);
  });

  it("fails closed when a tool rejects without supplying an Error", async () => {
    const { tools, errors, messages } = fixture();
    const io = { out: (line: string) => messages.push(line), err: (line: string) => errors.push(line) };
    const withTests = () => {
      const worker = Promise.withResolvers<never>();
      worker.reject();
      return worker.promise;
    };
    expect(await runTestShards(["plan", planPath, "2"], { ...tools, withTests }, io)).toBe(1);
    expect(errors).toEqual(["Unit tests: undefined"]);
    expect(messages).toEqual([]);
  });
});
