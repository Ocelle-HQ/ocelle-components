import { describe, expect, it } from "vitest";
import { runCheck } from "../bin/story-evidence.ts";
import type { CheckTools } from "../bin/story-evidence.ts";
import type { ToolRun } from "../lib/spawn.ts";
import type { StoryEvidence } from "../lib/test-evidence.ts";

const root = "/workspace/story-replay";
const temp = "/tmp/ocelle-story-sample";
const tested = `${temp}/checkout`;
const cacheDir = `${root}/reports/story-evidence`;
const key = "tested-input";
const cache = `${cacheDir}/${key}.json`;
const pendingCache = `${cache}.42.tmp`;
const log = `${root}/specs/001-answer/reviews/phase-1/check-head.log`;
const inputFile = `${temp}/selection.json`;
const outputFile = `${temp}/result.json`;
const revision = "a".repeat(40);
const changed = "test/answer.test.ts";
const deleted = "test/obsolete.test.ts";
const selection = {
  changed: [changed], deleted: [deleted], extra: ["test/form.test.ts"],
  changedLines: { [changed]: [{ start: 4, end: 4 }] },
};
const setup = "pnpm run setup:offline";
const answerFile = { project: "gates", file: changed };
const selected = [answerFile];
const green: StoryEvidence = { status: "green", assertions: [] };
const red: StoryEvidence = { status: "red", assertions: [{
  ...answerFile, test: "keeps the answer", source: { line: 4, occurrence: 1, text: "expect(answer).toBe(value);" },
  diagnostic: "expected old value to be the answer",
}] };
const missing: StoryEvidence = { status: "missing-module", assertions: [] };

type Check = Parameters<typeof runCheck>[0];
const check: Check = { mode: "head", revision, expected: [], missingModules: [], selection, log };

function outcome(exitCode: number | null = 0, stdout = "", stderr = ""): ToolRun {
  return { exitCode, stdout, stderr };
}

function cacheRecord(evidence: StoryEvidence = green, mode: Check["mode"] = "head", input = key) {
  const header = { mode, revision, input, selected, evidence, seconds: 3 };
  return { key: input, evidence, selected, log: `${JSON.stringify(header)}\ncached log\n` };
}

interface Options {
  readonly reusable?: boolean;
  readonly setupRun?: ToolRun;
  readonly workerRun?: ToolRun;
  readonly workerReport?: unknown;
  readonly absentReport?: boolean;
  readonly gitAddError?: boolean;
  readonly gitRemoveError?: boolean;
  readonly setupError?: boolean;
  readonly workerError?: boolean;
  readonly workerReadError?: boolean;
  readonly cacheLogError?: boolean;
  readonly renameError?: boolean;
}

function fixture(options: Options = {}) {
  const records = new Map<string, unknown>();
  const logText = new Map<string, string>();
  const events: { operation: string; args: unknown[] }[] = [];
  const record = (operation: string, ...args: unknown[]) => { events.push({ operation, args }); };
  let linked = false;
  let time = 1_000;
  const tools: CheckTools = {
    root, pid: 42,
    now: () => { const previous = time; time += 750; return previous; },
    key: (item, command) => { record("key", item, command); return { key, reusable: options.reusable ?? true }; },
    git: (args, cwd) => {
      record("git", args, cwd);
      if (args[0] === "worktree" && args[1] === "add") {
        if (options.gitAddError === true) throw new Error("could not attach tree");
        linked = true;
      } else if (args[0] === "worktree" && args[1] === "remove") {
        if (options.gitRemoveError === true) throw new Error("could not detach tree");
        linked = false;
      }
      return "";
    },
    tempDir: () => { record("tempDir"); return temp; },
    exists: (filename) => filename === tested ? linked : records.has(filename),
    readJson: (filename) => {
      record("readJson", filename);
      if (filename === outputFile && options.workerReadError === true) throw new SyntaxError("malformed worker JSON");
      if (!records.has(filename)) throw new Error("no saved evidence");
      return records.get(filename);
    },
    writeJson: (filename, value) => { record("writeJson", filename, value); records.set(filename, value); },
    writeLog: (filename, text) => {
      record("writeLog", filename, text);
      if (options.cacheLogError === true && text.startsWith("Reused")) throw new Error("cannot restore old log");
      logText.set(filename, text);
    },
    mkdir: (directory) => { record("mkdir", directory); },
    remove: (target, recursive) => { record("remove", target, recursive); records.delete(target); },
    rename: (temporary, final) => {
      record("rename", temporary, final);
      if (options.renameError === true) throw new Error("cannot publish evidence");
      records.set(final, records.get(temporary));
      records.delete(temporary);
    },
    setup: (command, cwd) => {
      record("setup", command, cwd);
      return options.setupError === true ? Promise.reject(new Error("setup interrupted")) : Promise.resolve(options.setupRun ?? outcome());
    },
    worker: (cwd, input, output) => {
      record("worker", cwd, input, output);
      if (options.workerError === true) return Promise.reject(new Error("worker interrupted"));
      if (options.absentReport !== true) records.set(output, options.workerReport ?? { evidence: green, selected });
      return Promise.resolve(options.workerRun ?? outcome());
    },
  };
  return { tools, records, logText, events };
}

describe("replay reuse", () => {
  it.each([
    { mode: "head", evidence: green },
    { mode: "base", evidence: missing },
    { mode: "scaffold", evidence: red },
    { mode: "fix", evidence: red },
    { mode: "red", evidence: red },
  ] satisfies readonly { mode: Check["mode"]; evidence: StoryEvidence }[])("reuses matching validated $mode evidence without a worktree", async ({ mode, evidence }) => {
    const { tools, records, logText, events } = fixture();
    const saved = cacheRecord(evidence, mode);
    const request = { ...check, mode };
    records.set(cache, saved);
    const result = await runCheck(request, setup, tools);
    expect(result).toEqual({ evidence, selected, input: key, seconds: 0.75, resumed: true });
    expect(logText.get(log)).toBe(`Reused completed evidence ${key}\n${saved.log}`);
    expect(events.map(({ operation }) => operation)).toEqual(["key", "readJson", "writeLog"]);
    expect(events[0]?.args).toEqual([request, setup]);
    expect(records.get(cache)).toBe(saved);
  });

  it.each([
    { label: "an absent record", cached: undefined },
    { label: "a stale key", cached: cacheRecord(green, "head", "old-input") },
    { label: "a corrupted cached selection", cached: { ...cacheRecord(), selected: [null] } },
    { label: "a malformed log envelope", cached: { ...cacheRecord(), log: "{truncated" } },
    { label: "a red record at head", cached: cacheRecord(red, "red") },
    { label: "a missing-module record at head", cached: cacheRecord(missing, "base") },
  ])("reruns and publishes fresh evidence for $label", async ({ cached }) => {
    const { tools, records, events } = fixture();
    if (cached !== undefined) records.set(cache, cached);
    expect(await runCheck(check, setup, tools)).toEqual({ evidence: green, selected, input: key, seconds: 0.75, resumed: false });
    expect(events).toContainEqual({ operation: "worker", args: [tested, inputFile, outputFile] });
    expect(events).toContainEqual({ operation: "rename", args: [pendingCache, cache] });
    expect(records.get(cache)).toMatchObject({ key, evidence: green, selected });
  });

  it("reruns when the saved log cannot be restored", async () => {
    const { tools, records, events, logText } = fixture({ cacheLogError: true });
    records.set(cache, cacheRecord());
    expect(await runCheck(check, setup, tools)).toMatchObject({ resumed: false, evidence: green });
    expect(events.map(({ operation }) => operation).filter((operation) => operation === "writeLog")).toHaveLength(2);
    expect(logText.get(log)).not.toContain("Reused completed evidence");
  });

  it("does not read or replace cache data when the runtime could not be pinned", async () => {
    const { tools, records, events } = fixture({ reusable: false });
    const saved = cacheRecord();
    records.set(cache, saved);
    expect(await runCheck(check, setup, tools)).toMatchObject({ resumed: false, evidence: green });
    expect(events).not.toContainEqual({ operation: "readJson", args: [cache] });
    expect(events).not.toContainEqual({ operation: "rename", args: [pendingCache, cache] });
    expect(records.get(cache)).toBe(saved);
  });
});

describe("cold replay boundaries", () => {
  it("restores an overlay, passes its selection to the actual worker path, sanitizes logs and publishes atomically", async () => {
    const overlay = "b".repeat(40);
    const mode = "scaffold";
    const request: Check = { ...check, mode, overlay, expected: red.assertions, missingModules: ["src/answer.ts"] };
    const { tools, records, logText, events } = fixture({
      workerReport: { evidence: red, selected },
      workerRun: outcome(0, `using ${tested}/test\n`, `from ${root}/gates\n`),
    });
    expect(await runCheck(request, setup, tools)).toEqual({ evidence: red, selected, input: key, seconds: 0.75, resumed: false });
    expect(events.slice(0, 8)).toEqual([
      { operation: "key", args: [request, setup] },
      { operation: "readJson", args: [cache] },
      { operation: "tempDir", args: [] },
      { operation: "git", args: [["worktree", "add", "--quiet", "--detach", tested, revision], undefined] },
      { operation: "git", args: [["restore", `--source=${overlay}`, "--worktree", "--", changed], tested] },
      { operation: "remove", args: [`${tested}/${deleted}`, undefined] },
      { operation: "setup", args: [setup, tested] },
      { operation: "writeJson", args: [inputFile, { ...selection, mode, expected: red.assertions, missingModules: ["src/answer.ts"] }] },
    ]);
    const header = { mode, revision, overlay, input: key, selected, evidence: red, seconds: 0.75 };
    const expectedLog = `${JSON.stringify(header)}\nusing <worktree>/test\nfrom <repository>/gates\n`;
    expect(logText.get(log)).toBe(expectedLog);
    expect(events.slice(-6)).toEqual([
      { operation: "git", args: [["worktree", "remove", "--force", tested], undefined] },
      { operation: "remove", args: [temp, true] },
      { operation: "writeLog", args: [log, expectedLog] },
      { operation: "mkdir", args: [cacheDir] },
      { operation: "writeJson", args: [pendingCache, { key, evidence: red, log: expectedLog, selected }] },
      { operation: "rename", args: [pendingCache, cache] },
    ]);
    expect(records.has(pendingCache)).toBe(false);
    expect(records.get(cache)).toEqual({ key, evidence: red, log: expectedLog, selected });
  });

  it("skips overlay restoration when there are no changed files, while still applying deletions", async () => {
    const { tools, events } = fixture();
    const request = { ...check, overlay: "b".repeat(40), selection: { ...selection, changed: [] } };
    await runCheck(request, setup, tools);
    expect(events.filter(({ operation }) => operation === "git").map(({ args }) => args)).toEqual([
      [["worktree", "add", "--quiet", "--detach", tested, revision], undefined],
      [["worktree", "remove", "--force", tested], undefined],
    ]);
    expect(events).toContainEqual({ operation: "remove", args: [`${tested}/${deleted}`, undefined] });
  });

  it("tests HEAD without restoring or deleting files from the phase selection", async () => {
    const { tools, events } = fixture();
    await runCheck(check, setup, tools);
    expect(events.filter(({ operation }) => operation === "git" || operation === "remove")).toEqual([
      { operation: "git", args: [["worktree", "add", "--quiet", "--detach", tested, revision], undefined] },
      { operation: "git", args: [["worktree", "remove", "--force", tested], undefined] },
      { operation: "remove", args: [temp, true] },
    ]);
  });

  it("still removes the scratch directory when git cleanup fails", async () => {
    const { tools, events, records } = fixture({ gitRemoveError: true });
    expect(await runCheck(check, setup, tools)).toMatchObject({ evidence: green });
    expect(events).toContainEqual({ operation: "git", args: [["worktree", "remove", "--force", tested], undefined] });
    expect(events).toContainEqual({ operation: "remove", args: [temp, true] });
    expect(records.has(cache)).toBe(true);
  });

  it("leaves the earlier committed cache unchanged if the atomic rename fails", async () => {
    const { tools, events, records, logText } = fixture({ renameError: true });
    const original = cacheRecord(green, "head", "older-cache");
    records.set(cache, original);
    await expect(runCheck(check, setup, tools)).rejects.toThrow("cannot publish evidence");
    expect(records.get(cache)).toBe(original);
    expect(records.get(pendingCache)).toMatchObject({ key, evidence: green });
    expect(events).toContainEqual({ operation: "remove", args: [temp, true] });
    expect(logText.has(log)).toBe(true);
  });
});

describe("failed subprocesses or worker evidence", () => {
  it("reports failed setup plus sanitized output and does not launch tests", async () => {
    const { tools, events, records, logText } = fixture({ setupRun: outcome(2, "installing\n", `cannot use ${tested}/node_modules`) });
    expect(await runCheck(check, setup, tools)).toMatchObject({
      evidence: { status: "invalid", assertions: [], problem: "worktree setup failed" }, selected: [],
    });
    expect(logText.get(log)).toContain("installing\ncannot use <worktree>/node_modules");
    expect(events.map(({ operation }) => operation)).not.toContain("worker");
    expect(records.has(cache)).toBe(false);
    expect(events).toContainEqual({ operation: "remove", args: [temp, true] });
  });

  it.each([
    { label: "a killed child", options: { workerRun: outcome(null, "", "terminated") }, problem: "focused Vitest worker failed (exit null)" },
    { label: "a failed child", options: { workerRun: outcome(1) }, problem: "focused Vitest worker failed (exit 1)" },
    { label: "an absent report", options: { absentReport: true }, problem: "focused Vitest worker failed (exit 0)" },
    { label: "a setup exception", options: { setupError: true }, problem: "replay worktree failed: setup interrupted" },
    { label: "a worker exception", options: { workerError: true }, problem: "replay worktree failed: worker interrupted" },
    { label: "malformed JSON", options: { workerReadError: true }, problem: "replay worktree failed: malformed worker JSON" },
  ] satisfies readonly { label: string; options: Options; problem: string }[])("cleans up and does not cache $label", async ({ options, problem }) => {
    const { tools, events, records } = fixture(options);
    expect(await runCheck(check, setup, tools)).toMatchObject({ evidence: { status: "invalid", assertions: [], problem } });
    expect(events).toContainEqual({ operation: "git", args: [["worktree", "remove", "--force", tested], undefined] });
    expect(events).toContainEqual({ operation: "remove", args: [temp, true] });
    expect(records.has(cache)).toBe(false);
  });

  it("removes the scratch directory even when the git checkout never attached", async () => {
    const { tools, events, records } = fixture({ gitAddError: true });
    expect(await runCheck(check, setup, tools)).toMatchObject({
      evidence: { status: "invalid", problem: "replay worktree failed: could not attach tree" },
    });
    expect(events).not.toContainEqual({ operation: "git", args: [["worktree", "remove", "--force", tested], undefined] });
    expect(events).toContainEqual({ operation: "remove", args: [temp, true] });
    expect(records.has(cache)).toBe(false);
  });

  it("writes structured evidence with empty subprocess output when checkout fails before setup", async () => {
    const { tools, logText } = fixture({ gitAddError: true });
    const { evidence } = await runCheck(check, setup, tools);
    const header = { mode: "head", revision, input: key, selected: [], evidence, seconds: 0.75 };
    expect(logText.get(log)).toBe(`${JSON.stringify(header)}\n`);
  });

  it.each([
    { label: "an empty successful selection", report: { evidence: green, selected: [] } },
    { label: "a missing selection", report: { evidence: green } },
    { label: "a duplicated selection", report: { evidence: green, selected: [...selected, ...selected] } },
    { label: "a red report with no assertion", report: { evidence: { status: "red", assertions: [] }, selected } },
    { label: "an assertion in an unreported file", report: { evidence: red, selected: [{ project: "gates", file: "other.test.ts" }] } },
    { label: "an unknown status", report: { evidence: { status: "queued", assertions: [] }, selected } },
    { label: "an invalid status without a diagnostic", report: { evidence: { status: "invalid", assertions: [] }, selected: [] } },
  ])("does not accept a worker that emits $label", async ({ report }) => {
    const { tools, records } = fixture({ workerReport: report });
    expect(await runCheck(check, setup, tools)).toMatchObject({
      evidence: { status: "invalid", assertions: [], problem: "focused Vitest worker returned incomplete evidence" }, selected: [],
    });
    expect(records.has(cache)).toBe(false);
  });

  it("retains a structured invalid diagnostic without publishing it", async () => {
    const evidence: StoryEvidence = { status: "invalid", assertions: [], problem: "the phase changed no runnable test file" };
    const { tools, records } = fixture({ workerReport: { evidence, selected: [] } });
    expect(await runCheck(check, setup, tools)).toMatchObject({ evidence, selected: [] });
    expect(records.has(cache)).toBe(false);
  });
});
