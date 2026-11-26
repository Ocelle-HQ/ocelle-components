import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkPhase } from "../bin/story-evidence.ts";
import type { PhaseRequest, PhaseTools } from "../bin/story-evidence.ts";
import type { Assertion, StoryEvidence } from "../lib/test-evidence.ts";

const root = "/workspace/story-fixture";
const feature = "specs/001-answer";
const dir = join(root, feature, "reviews", "phase-1");
const verdict = join(dir, "tdd-check.json");
const anchor = "a".repeat(40);
const scaffold = "b".repeat(40);
const initial = "c".repeat(40);
const fix = "d".repeat(40);
const fixParent = "e".repeat(40);
const head = "f".repeat(40);
const file = "test/answer.test.ts";
const added = "src/answer.ts";
const patterns = [":(glob)**/*.test.ts"];
const setup = "pnpm run setup:offline";
const changedLines = { [file]: [{ start: 3, end: 4 }, { start: 7, end: 7 }] };
const request: PhaseRequest = { mode: "check", feature, phase: "1", setup, patterns };

const first: Assertion = {
  project: "gates", file, test: "keeps the answer", source: { text: "expect(value).toBe(answer);", occurrence: 1, line: 4 },
  diagnostic: "expected missing value to be the answer",
};
const second: Assertion = {
  ...first, test: "retains the edited answer", source: { text: "expect(value).toBe(edited);", occurrence: 1, line: 7 },
};

type Check = Parameters<PhaseTools["runCheck"]>[0];
type CheckResult = Awaited<ReturnType<PhaseTools["runCheck"]>>;

function result(status: StoryEvidence["status"], assertions: readonly Assertion[] = [], problem?: string): CheckResult {
  return {
    evidence: { status, assertions, ...(problem === undefined ? {} : { problem }) },
    input: "worktree", seconds: 0, resumed: false, selected: [{ project: "gates", file }],
  };
}

function fixture() {
  const files = new Map<string, string>([[join(dir, "base.sha"), ` ${anchor}\n`], [join(dir, "red-commits"), `phase ${initial}\n`]]);
  const outputs: { output: object; filename?: string }[] = [];
  const checks: { check: Check; setup: string }[] = [];
  const calls: (readonly string[])[] = [];
  const directories: string[] = [];
  const stale = new Set<string>();
  const dirty = new Set<string>();
  const statuses = new Map<string, CheckResult>();
  const known = new Set([anchor, scaffold, initial, fix, fixParent, head]);
  const tools: PhaseTools = {
    root,
    exists: (filename) => files.has(filename),
    read: (filename) => {
      const text = files.get(filename);
      if (text === undefined) throw new Error(`unexpected read of ${filename}`);
      return text;
    },
    write: (filename, text) => { files.set(filename, text); },
    mkdir: (directory) => { directories.push(directory); },
    emit: (output, filename) => { outputs.push({ output, ...(filename === undefined ? {} : { filename }) }); },
    git: (args) => {
      calls.push(args);
      const [verb, argument, from, to] = args;
      if (verb === "rev-parse") {
        if (argument === "HEAD") return `${head}\n`;
        if (argument === `${fix}^`) return `${fixParent}\n`;
        const sha = from?.replace(/\^\{commit\}$/, "") ?? "";
        if (argument === "--verify" && known.has(sha)) return `${sha}\n`;
        throw new Error("Git could not resolve the revision");
      }
      if (verb === "merge-base" && from !== undefined && to !== undefined) {
        if (stale.has(`${from}:${to}`)) throw new Error("not an ancestor");
        return "";
      }
      if (verb === "diff") {
        if (args.includes("--unified=0")) return "@@ -2 +3,2 @@\n@@ -5 +7 @@\n@@ -9 +10,0 @@\n";
        if (args.includes("--diff-filter=AMT")) return `${file}\0`;
        if (args.includes("--diff-filter=A")) return `${added}\0`;
        if (args.includes("--diff-filter=D")) return "";
        if (args.includes("--diff-filter=ACDMRTUXB")) return dirty.has(String(args[6])) ? "src/other.ts\0" : "";
      }
      throw new Error(`unexpected Git call: ${args.join(" ")}`);
    },
    runCheck: (check, setupCommand) => {
      checks.push({ check, setup: setupCommand });
      const proof = statuses.get(`${check.mode}:${check.revision}`);
      if (proof !== undefined) return Promise.resolve(proof);
      if (check.mode === "head") return Promise.resolve(result("green"));
      return Promise.resolve(result("red", check.revision === fix || check.mode === "fix" ? [second] : [first]));
    },
  };
  return { tools, files, outputs, checks, calls, directories, stale, dirty, statuses, known };
}

describe("phase record validation", () => {
  it.each([
    { feature, phase: "bad" },
    { feature: "../outside", phase: "1" },
  ])("does not write phase evidence outside a valid phase ($feature, $phase)", async (path) => {
    const { tools, directories, checks, outputs } = fixture();
    await expect(checkPhase({ ...request, ...path }, tools)).rejects.toThrow("invalid phase path");
    expect(directories).toEqual([]);
    expect(checks).toEqual([]);
    expect(outputs).toEqual([]);
  });

  it.each(["prefix12", "12suffix"])("requires the whole phase identifier to be numeric (%s)", async (phase) => {
    const { tools, directories } = fixture();
    await expect(checkPhase({ ...request, phase }, tools)).rejects.toThrow("invalid phase path");
    expect(directories).toEqual([]);
  });

  it("accepts a multi-digit phase and fix number", async () => {
    const { tools, files, outputs } = fixture();
    const phase = "12";
    const phaseDir = join(root, feature, "reviews", "phase-12");
    await checkPhase({ ...request, phase, mode: "red", label: "fix-12" }, tools);
    expect(files.get(join(phaseDir, "red-commits"))).toBe(`fix-12 ${head}\n`);
    expect(outputs).toMatchObject([{ output: { phase, label: "fix-12", recorded: true } }]);
  });

  it("emits a failure for a missing base even when an exemption file exists", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.delete(join(dir, "base.sha"));
    files.set(join(dir, "tdd-exempt.md"), "documentation only");
    await checkPhase(request, tools);
    expect(outputs).toEqual([{ filename: verdict, output: {
      phase: "1", status: "fail", problems: ["no base.sha: the phase was not started by the story workflow"],
    } }]);
    expect(checks).toEqual([]);
  });

  it.each(["", "not-a-sha", "g".repeat(40), "a".repeat(39), "a".repeat(41)])("rejects a malformed phase base %s", async (sha) => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "base.sha"), sha);
    await expect(checkPhase(request, tools)).rejects.toThrow("expected a full commit SHA");
    expect(checks).toEqual([]);
  });

  it("recognizes full-length SHA-256 input and requires Git to resolve it", async () => {
    const { tools, files, known, outputs, calls } = fixture();
    const sha = "1".repeat(64);
    files.set(join(dir, "base.sha"), sha);
    await expect(checkPhase(request, tools)).rejects.toThrow("Git could not resolve the revision");
    known.add(sha);
    await checkPhase(request, tools);
    expect(calls).toContainEqual(["rev-parse", "--verify", `${sha}^{commit}`]);
    expect(outputs).toMatchObject([{ output: { status: "pass", base: sha }, filename: verdict }]);
  });

  it.each([
    `phase`, `special ${initial}`, `fix- ${initial}`, `phase ${initial} unexpected`, `phase ${initial}\nphase ${initial}\n`,
  ])("rejects malformed red history %s before checking worktrees", async (records) => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "red-commits"), records);
    await expect(checkPhase(request, tools)).rejects.toThrow("invalid red-commits entry");
    expect(checks).toEqual([]);
  });

  it.each(["prefixphase", "phase-extra"])("requires the whole recorded red label to match (%s)", async (label) => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "red-commits"), `${label} ${initial}\n`);
    await expect(checkPhase(request, tools)).rejects.toThrow("invalid red-commits entry");
    expect(checks).toEqual([]);
  });

  it("rejects an invalid revision under a valid red label", async () => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "red-commits"), "phase bad-sha\n");
    await expect(checkPhase(request, tools)).rejects.toThrow("expected a full commit SHA");
    expect(checks).toEqual([]);
  });

  it("emits an exemption only when there is no red history", async () => {
    const { tools, files, outputs, checks } = fixture();
    const exemption = join(dir, "tdd-exempt.md");
    files.set(exemption, "documentation only");
    files.delete(join(dir, "red-commits"));
    await checkPhase(request, tools);
    expect(outputs).toEqual([{ filename: verdict, output: { phase: "1", status: "exempt", reason_file: exemption, head } }]);
    expect(checks).toEqual([]);

    outputs.length = 0;
    files.set(join(dir, "red-commits"), `phase ${initial}\n`);
    await checkPhase(request, tools);
    expect(outputs).toMatchObject([{ output: { status: "pass" }, filename: verdict }]);
    expect(checks.map(({ check }) => check.mode)).toEqual(["red", "base", "head"]);
  });

  it("requires a red commit for a phase that is not exempt", async () => {
    const { tools, files, outputs } = fixture();
    files.delete(join(dir, "red-commits"));
    await checkPhase(request, tools);
    expect(outputs).toMatchObject([{ output: { status: "fail", problems: ["no red commit recorded (red.sh) and no tdd-exempt.md"] } }]);
  });
});

const upstream = "1".repeat(40);
const upstreamFile = join(dir, "replay-upstream.sha");
const virtualBase = "2".repeat(40);
const virtualScaffold = "3".repeat(40);
const virtualFix = "4".repeat(40);
const mergedTree = "5".repeat(40);

function pinnedFixture() {
  const test = fixture();
  test.known.add(upstream);
  test.files.set(upstreamFile, upstream + "\n");
  test.stale.add(`${initial}:${upstream}`);
  test.stale.add(`${fix}:${upstream}`);
  return test;
}

describe("phase replay pinned to integrated main", () => {
  it("retains historical red revisions and uses integrated snapshots for base, scaffold, fix and selection", async () => {
    const { tools, files, calls, checks, outputs, stale } = pinnedFixture();
    files.set(join(dir, "scaffold.sha"), scaffold);
    files.set(join(dir, "red-commits"), `phase ${initial}\nfix-1 ${fix}\n`);
    for (const original of [anchor, scaffold, fixParent]) stale.add(`${upstream}:${original}`);
    const snapshots = new Map([[anchor, virtualBase], [scaffold, virtualScaffold], [fixParent, virtualFix]]);
    const merged: string[] = [];
    const objects: string[] = [];
    const git: PhaseTools["git"] = (args, input) => {
      if (args[0] === "merge-tree") {
        merged.push(String(args[2]));
        calls.push(args);
        return mergedTree + "\n";
      }
      if (args[0] === "hash-object") {
        objects.push(String(input));
        calls.push(args);
        return (snapshots.get(merged.at(-1) ?? "") ?? "") + "\n";
      }
      return tools.git(args, input);
    };
    await checkPhase(request, { ...tools, git });

    const identities = checks.map(({ check }) => [check.mode, check.revision]);
    expect(identities).toEqual([["red", initial], ["red", fix], ["base", virtualBase],
      ["scaffold", virtualScaffold], ["fix", virtualFix], ["head", head]]);
    expect(calls.filter((args) => args[0] === "merge-tree")).toEqual([anchor, scaffold, fixParent]
      .map((commit) => ["merge-tree", "--write-tree", commit, upstream]));
    expect(calls.filter((args) => args[0] === "hash-object")).toEqual(Array.from({length: 3}, () =>
      ["hash-object", "-t", "commit", "-w", "--stdin"]));
    const identity = "Ocelle Spec Kit <spec-kit@ocelle.invalid> 0 +0000";
    expect(objects).toEqual([anchor, scaffold, fixParent].map((commit) =>
      `tree ${mergedTree}\nparent ${commit}\nparent ${upstream}\nauthor ${identity}\ncommitter ${identity}\n\nSpec Kit replay snapshot\n`));
    expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=AMT", virtualBase, head, "--", ...patterns]);
    expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=A", virtualBase, virtualScaffold, "--"]);
    expect(outputs).toMatchObject([{ output: { base: anchor, replay_base: virtualBase, replay_upstream: upstream, status: "pass" } }]);
    expect(files.get(join(dir, "base.sha"))?.trim()).toBe(anchor);
  });

  it("reuses a historical revision when it already includes the upstream", async () => {
    const { tools, calls, checks, outputs } = pinnedFixture();
    await checkPhase(request, tools);
    expect(calls.map(([command]) => command)).not.toContain("merge-tree");
    expect(checks.map(({ check }) => check.revision)).toEqual([initial, anchor, head]);
    expect(outputs).toMatchObject([{ output: { base: anchor, replay_base: anchor, replay_upstream: upstream, status: "pass" } }]);
  });

  it.each([[`${upstream}:refs/remotes/origin/main`, false], [`${upstream}:${head}`, false], [`${initial}:${upstream}`, true]])(
    "fails closed on bad replay ancestry %s", async (blocked, isRed) => {
      const { tools, stale, checks } = pinnedFixture();
      if (isRed) stale.delete(blocked);
      else stale.add(blocked);
      await expect(checkPhase(request, tools)).rejects.toThrow("replay-upstream.sha must pin main integrated into HEAD without the phase's red commits");
      expect(checks).toEqual([]);
    },
  );

  it("rejects a replay pin containing any recorded red even if another red is still separate", async () => {
    const { tools, stale, checks, files } = pinnedFixture();
    files.set(join(dir, "red-commits"), `phase ${initial}\nfix-1 ${fix}\n`);
    stale.delete(`${fix}:${upstream}`);
    await expect(checkPhase(request, tools)).rejects.toThrow("replay-upstream.sha must pin main integrated into HEAD without the phase's red commits");
    expect(checks).toEqual([]);
  });

  it("omits integrated metadata for a phase without a main pin", async () => {
    const { tools, outputs } = fixture();
    await checkPhase(request, tools);
    expect(outputs[0]?.output).not.toHaveProperty("replay_base");
  });

  it("requires the pinned SHA to identify a real commit", async () => {
    const { tools, known, checks } = pinnedFixture();
    known.delete(upstream);
    await expect(checkPhase(request, tools)).rejects.toThrow("Git could not resolve the revision");
    expect(checks).toEqual([]);
  });

  it("reports a replay merge conflict and never runs final tests on an incorrect base", async () => {
    const { tools, stale, checks } = pinnedFixture();
    stale.add(`${upstream}:${anchor}`);
    await expect(checkPhase(request, tools)).rejects.toThrow(
      `cannot integrate pinned main ${upstream} into replay revision ${anchor}; resolve the replay conflict before proceeding`,
    );
    expect(checks.map(({ check }) => check.mode)).toEqual(["red"]);
  });
});

describe("red capture", () => {
  it.each([undefined, "", "other", "fix-", "phase-extra"])("rejects invalid red capture labels (%s)", async (label) => {
    const { tools, checks } = fixture();
    await expect(checkPhase({ ...request, mode: "red", label }, tools)).rejects.toThrow("invalid red label");
    expect(checks).toEqual([]);
  });

  it("replaces one matching red label while preserving normalized prior records", async () => {
    const { tools, files, outputs, checks, calls, directories } = fixture();
    files.set(join(dir, "red-commits"), `phase ${initial}\n\nfix-1\t${fix}\n`);
    await checkPhase({ ...request, mode: "red", label: "fix-1" }, tools);
    expect(files.get(join(dir, "red-commits"))).toBe(`phase ${initial}\nfix-1 ${head}\n`);
    expect(checks).toEqual([{ setup, check: {
      mode: "red", revision: head, selection: { changed: [file], deleted: [], extra: [], changedLines }, expected: [],
      missingModules: [], log: join(dir, "red-fix-1.log"),
    } }]);
    expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=ACDMRTUXB",
      `${head}^`, head, "--", ":(exclude,glob)**/*.test.ts", `:(exclude)${feature}`]);
    expect(directories).toEqual([dir]);
    expect(outputs).toMatchObject([{ output: { phase: "1", label: "fix-1", sha: head, tests_only: true, red: true, recorded: true, exit_code: 1 } }]);
  });

  it("rejects a red label with a valid name as its suffix", async () => {
    const { tools, checks } = fixture();
    await expect(checkPhase({ ...request, mode: "red", label: "prefixfix-12" }, tools)).rejects.toThrow("invalid red label");
    expect(checks).toEqual([]);
  });

  it("normalizes indented records and interprets pathspec magic only at the start of an argument", async () => {
    const { tools, files, calls } = fixture();
    files.set(join(dir, "red-commits"), `\n\tphase  ${initial}\n \tfix-12\t  ${fix} \n\n`);
    const literal = "test/fixtures/:(glob)/answer.test.ts";
    await checkPhase({ ...request, patterns: [...patterns, literal], mode: "red", label: "fix-12" }, tools);
    expect(files.get(join(dir, "red-commits"))).toBe(`phase ${initial}\nfix-12 ${head}\n`);
    expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=ACDMRTUXB",
      `${head}^`, head, "--", ":(exclude,glob)**/*.test.ts", literal, `:(exclude)${feature}`]);
  });

  it.each([
    { label: "green", evidence: result("green"), dirtyTree: false, code: 0 },
    { label: "invalid", evidence: result("invalid"), dirtyTree: false, code: 2 },
    { label: "missing module", evidence: result("missing-module"), dirtyTree: false, code: 3 },
    { label: "product changes", evidence: result("red", [first]), dirtyTree: true, code: 1 },
  ])("does not write a red record for $label", async ({ evidence, dirtyTree, code }) => {
    const { tools, files, outputs, statuses, dirty } = fixture();
    statuses.set(`red:${head}`, evidence);
    if (dirtyTree) dirty.add(head);
    await checkPhase({ ...request, mode: "red", label: "phase" }, tools);
    expect(files.get(join(dir, "red-commits"))).toBe(`phase ${initial}\n`);
    expect(outputs).toMatchObject([{ output: {
      tests_only: !dirtyTree, red: code === 1, recorded: false, exit_code: code,
    } }]);
  });
});

describe("phase verdict", () => {
  it("uses the initial proof for base/scaffold, each fix's own parent, and all assertions at head", async () => {
    const { tools, files, checks, statuses, outputs } = fixture();
    files.set(join(dir, "scaffold.sha"), `${scaffold}\n`);
    files.set(join(dir, "red-commits"), `phase ${initial}\nfix-1 ${fix}\n`);
    files.set(join(dir, "test-scope.txt"), "# supporting consumer\r\ntest/extra.test.ts\r\n\r\n test/extra.test.ts\r\n");
    statuses.set(`base:${anchor}`, result("missing-module"));
    await checkPhase(request, tools);
    expect(checks.map(({ check }) => [check.mode, check.revision, check.overlay, check.expected, check.missingModules])).toEqual([
      ["red", initial, undefined, [], []],
      ["red", fix, undefined, [], []],
      ["base", anchor, head, [first], [added]],
      ["scaffold", scaffold, head, [first], [added]],
      ["fix", fixParent, head, [second], [added]],
      ["head", head, undefined, [first, second], [added]],
    ]);
    expect(checks.at(-1)?.check.selection).toEqual({ changed: [file], deleted: [], extra: ["test/extra.test.ts"], changedLines });
    expect(outputs).toMatchObject([{ filename: verdict, output: {
      status: "pass", phase: "1", base: anchor, head, problems: [], final_tests_on_base_exit: 3,
      final_tests_on_scaffold_exit: 1, head_exit: 0,
      red_commits: [{ label: "phase", sha: initial, exit_code: 1 }, { label: "fix-1", sha: fix, exit_code: 1 }],
      focused: { fixes: [{ label: "fix-1", base: fixParent, evidence: { status: "red" } }] },
    } }]);
  });

  it("handles an unscaffolded phase and a fix-only record", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.set(join(dir, "red-commits"), `fix-1 ${fix}\n`);
    await checkPhase(request, tools);
    expect(checks.map(({ check }) => [check.mode, check.expected])).toEqual([
      ["red", []], ["base", [second]], ["fix", [second]], ["head", [second]],
    ]);
    expect(outputs).toMatchObject([{ output: { status: "pass", final_tests_on_base_exit: 1, final_tests_on_scaffold_exit: null } }]);
  });

  it("names each stage log and checks ancestry and scaffold additions with Git", async () => {
    const { tools, files, checks, calls } = fixture();
    files.set(join(dir, "scaffold.sha"), scaffold);
    files.set(join(dir, "red-commits"), `phase ${initial}\nfix-12 ${fix}\n`);
    await checkPhase(request, tools);
    expect(checks.map(({ check }) => check.log)).toEqual([
      join(dir, "check-red-phase.log"),
      join(dir, "check-red-fix-12.log"),
      join(dir, "check-final-tests-on-base.log"),
      join(dir, "check-final-tests-on-scaffold.log"),
      join(dir, "check-final-tests-on-fix-12-base.log"),
      join(dir, "check-head.log"),
    ]);
    expect(calls.filter(([verb]) => verb === "merge-base")).toEqual([
      ["merge-base", "--is-ancestor", anchor, head],
      ["merge-base", "--is-ancestor", anchor, scaffold],
      ["merge-base", "--is-ancestor", scaffold, head],
      ["merge-base", "--is-ancestor", initial, head],
      ["merge-base", "--is-ancestor", fix, head],
    ]);
    expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=A", anchor, scaffold, "--"]);
    for (const red of [initial, fix]) {
      expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=ACDMRTUXB",
        `${red}^`, red, "--", ":(exclude,glob)**/*.test.ts", `:(exclude)${feature}`]);
      expect(calls).toContainEqual(["diff", "--no-renames", "--name-only", "-z", "--diff-filter=AMT",
        `${red}^`, red, "--", ...patterns]);
    }
  });

  it("selects the full changed-line ranges and parses a multiline scope without a scaffold", async () => {
    const { tools, files, checks, calls } = fixture();
    const patch = ["@@ -16,11 +120,12 @@", '+const example = "@@ -18,11 +240,12 @@";', "@@ -33 +141 @@", "@@ -35,4 +145,0 @@"].join("\n");
    files.set(join(dir, "test-scope.txt"), "# supporting consumers\ntest/extra.test.ts\n\n test/other.test.ts\ntest/extra.test.ts\n");
    await checkPhase(request, {
      ...tools,
      git: (args) => {
        const result = tools.git(args);
        return args.includes("--unified=0") ? patch : result;
      },
    });
    expect(calls).toContainEqual(["diff", "--no-renames", "--no-color", "--no-ext-diff", "--unified=0", anchor, head, "--", file]);
    expect(checks.at(-1)?.check.selection).toEqual({
      changed: [file], deleted: [], extra: ["test/extra.test.ts", "test/other.test.ts"],
      changedLines: { [file]: [{ start: 120, end: 131 }, { start: 141, end: 141 }] },
    });
    expect(checks.map(({ check }) => check.missingModules)).toEqual([[], [], []]);
  });

  it.each([
    { pair: `${anchor}:${head}`, problem: "base is not in the history of HEAD" },
    { pair: `${anchor}:${scaffold}`, problem: "scaffold is not between base and HEAD" },
    { pair: `${scaffold}:${head}`, problem: "scaffold is not between base and HEAD" },
    { pair: `${initial}:${head}`, problem: "red commit phase is outside HEAD or changes non-test files" },
  ])("blocks the phase for an invalid ancestry relationship ($pair)", async ({ pair, problem }) => {
    const { tools, files, stale, outputs } = fixture();
    files.set(join(dir, "scaffold.sha"), scaffold);
    stale.add(pair);
    await checkPhase(request, tools);
    expect(outputs).toMatchObject([{ output: { status: "fail", problems: [problem] } }]);
  });

  it("does not run a red proof for a commit with product changes", async () => {
    const { tools, dirty, checks, outputs } = fixture();
    dirty.add(initial);
    await checkPhase(request, tools);
    expect(checks.map(({ check }) => check.mode)).toEqual(["base", "head"]);
    expect(outputs).toMatchObject([{ output: { status: "fail", problems: ["red commit phase is outside HEAD or changes non-test files"], red_commits: [] } }]);
  });

  it.each(["/tmp/outside.test.ts", "-option", "test/../other.test.ts"])("rejects a traversal or option in declared scope (%s)", async (path) => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "test-scope.txt"), path);
    await expect(checkPhase(request, tools)).rejects.toThrow("test-scope.txt must contain repository-relative test paths");
    expect(checks).toEqual([]);
  });

  it("rejects an invalid scope entry alongside a valid test path", async () => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "test-scope.txt"), "test/answer.test.ts\ntest/../outside.test.ts\n");
    await expect(checkPhase(request, tools)).rejects.toThrow("test-scope.txt must contain repository-relative test paths");
    expect(checks).toEqual([]);
  });

  it.each([
    { modes: `red:${initial}`, proof: result("green"), problem: "red commit phase: no failing assertion" },
    { modes: `red:${initial}`, proof: result("invalid", [], "collection error"), problem: "red commit phase: collection error" },
    { modes: `base:${anchor}`, proof: result("green"), problem: "final tests on base: no failing assertion" },
    { modes: `base:${anchor}`, proof: result("invalid", [], "unrelated failure"), problem: "final tests on base: unrelated failure" },
    { modes: `fix:${fixParent}`, proof: result("green"), problem: "final tests on fix-1 base: no failing assertion" },
    { modes: `fix:${fixParent}`, proof: result("invalid", [], "wrong assertion"), problem: "final tests on fix-1 base: wrong assertion" },
    { modes: `scaffold:${scaffold}`, proof: result("green"), problem: "final tests on scaffold: no failing assertion" },
    { modes: `scaffold:${scaffold}`, proof: result("invalid", [], "no collection"), problem: "final tests on scaffold: no collection" },
    { modes: `head:${head}`, proof: result("red", [first]), problem: "final tests on HEAD: tests failed" },
    { modes: `head:${head}`, proof: result("invalid", [], "environment error"), problem: "final tests on HEAD: environment error" },
  ])("fails closed for an unproven stage ($problem)", async ({ modes, proof, problem }) => {
    const { tools, files, statuses, outputs } = fixture();
    files.set(join(dir, "scaffold.sha"), scaffold);
    files.set(join(dir, "red-commits"), `phase ${initial}\nfix-1 ${fix}\n`);
    statuses.set(modes, proof);
    await checkPhase(request, tools);
    expect(outputs).toMatchObject([{ output: { status: "fail", problems: [problem] } }]);
  });

  it.each([false, true])("requires a red scaffold when the base cannot load the module (scaffold=%s)", async (withScaffold) => {
    const { tools, files, statuses, outputs } = fixture();
    if (withScaffold) {
      files.set(join(dir, "scaffold.sha"), scaffold);
      statuses.set(`scaffold:${scaffold}`, result("green"));
    }
    statuses.set(`base:${anchor}`, result("missing-module"));
    await checkPhase(request, tools);
    const output = outputs[0]?.output as { status?: string; problems?: readonly string[] } | undefined;
    expect(output?.status).toBe("fail");
    expect(output?.problems).toContain("final tests on base: no failing assertion");
  });
});

describe("phase CI collateral declarations", () => {
  const visual = "gates/test/integration/visual.test.ts";

  it("cannot exempt a phase that declares a changed runnable CI-only test", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.delete(join(dir, "red-commits"));
    files.set(join(dir, "tdd-exempt.md"), "documentation only");
    files.set(join(dir, "test-scope.txt"), "ci-only " + visual + "\n");
    await expect(checkPhase(request, tools)).rejects.toThrow("ci-only scope requires recorded local proof");
    expect(checks).toEqual([]);
    expect(outputs).toEqual([]);
  });

  it("reports the deferred CI project and path alongside the focused head", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.set(join(dir, "test-scope.txt"), "ci-only " + visual + "\n");
    await checkPhase(request, {
      ...tools,
      git: (args) => {
        const output = tools.git(args);
        return args.includes("--diff-filter=AMT") && args.includes(anchor) ? output + visual + "\0" : output;
      },
    });
    expect(checks.at(-1)?.check).toMatchObject({ mode: "head", selection: { ciOnly: [visual], extra: [] } });
    expect(checks.filter(({ check }) => check.mode !== "head").map(({ check }) => check.selection)).not.toContainEqual(
      expect.objectContaining({ ciOnly: [visual] }),
    );
    expect(outputs).toMatchObject([{ filename: verdict, output: {
      status: "pass", head, deferred_ci: [{ project: "gates-integration", file: visual }],
    } }]);
  });

  it.each(["ci-only", "ci-only /tmp/outside.test.ts", "ci-only test/../other.test.ts"])("rejects a malformed CI-only declaration (%s)", async (line) => {
    const { tools, files, checks } = fixture();
    files.set(join(dir, "test-scope.txt"), line + "\n");
    await expect(checkPhase(request, tools)).rejects.toThrow("test-scope.txt must contain repository-relative test paths");
    expect(checks).toEqual([]);
  });
});

describe("phase implementation story declarations", () => {
  const implementation = "storybook/stories/Workflow_Studio-2.0/plan_v2.1.stories.ts";
  const removed = "storybook/stories/retired.stories.ts";
  const support = implementation + "-support.stories.ts";
  const removedSupport = "storybook/stories/removed-support.stories.ts";
  const scopeFile = join(dir, "test-scope.txt");
  const scopeError = "implementation-story requires an exact .stories.ts path under storybook/stories/";

  it("cannot exempt a phase that declares an implementation story", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.delete(join(dir, "red-commits"));
    files.set(join(dir, "tdd-exempt.md"), "documentation only");
    files.set(scopeFile, "implementation-story " + implementation);
    await expect(checkPhase(request, tools)).rejects.toThrow("implementation-story scope requires recorded local proof");
    expect(checks).toEqual([]);
    expect(outputs).toEqual([]);
  });

  it("keeps only ordinary changed and deleted stories in the overlay and runs the focused head", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.set(scopeFile, "  implementation-story \t" + implementation + "\nimplementation-story " + removed + "\n" + file);
    const git: PhaseTools["git"] = (args) => {
      const output = tools.git(args);
      if (args[5] !== anchor || args[6] !== head) return output;
      if (args.includes("--diff-filter=AMT")) return output + implementation + "\0" + support + "\0";
      if (args.includes("--diff-filter=D")) return removed + "\0" + removedSupport + "\0";
      return output;
    };
    await checkPhase(request, { ...tools, git });
    expect(checks.filter(({ check }) => check.mode !== "red").map(({ check }) => check.selection)).toEqual([
      { changed: [file, support], deleted: [removedSupport], extra: [file], changedLines: { ...changedLines, [support]: changedLines[file] } },
      { changed: [file, support], deleted: [removedSupport], extra: [file], changedLines: { ...changedLines, [support]: changedLines[file] } },
    ]);
    expect(outputs).toMatchObject([{ output: { status: "pass", problems: [] } }]);
  });

  it("checks exact declared paths before recording a red, preserving an unrelated story change", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.set(scopeFile, "implementation-story " + implementation);
    const git: PhaseTools["git"] = (args) =>
      args.includes("--diff-filter=ACDMRTUXB") && args.length === 8 ? file + "\0" + support + "\0" : tools.git(args);
    await checkPhase({ ...request, mode: "red", label: "phase" }, { ...tools, git });
    expect(checks.map(({ check }) => check.mode)).toEqual(["red"]);
    expect(checks[0]?.check.selection.extra).toEqual([]);
    expect(outputs).toMatchObject([{ output: { tests_only: true, red: true, recorded: true } }]);
    expect(files.get(join(dir, "red-commits"))).toBe("phase " + head + "\n");
  });

  it("rejects a red that edits a declared story before running the test worker", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.set(scopeFile, "implementation-story " + implementation);
    const git: PhaseTools["git"] = (args) =>
      args.includes("--diff-filter=ACDMRTUXB") && args.length === 8 ? file + "\0" + implementation + "\0" : tools.git(args);
    await checkPhase({ ...request, mode: "red", label: "phase" }, { ...tools, git });
    expect(checks).toEqual([]);
    expect(outputs).toMatchObject([{ output: {
      sha: head, tests_only: false, red: false, recorded: false,
      problem: "red commit changes a declared implementation story: " + implementation,
    } }]);
    expect(files.get(join(dir, "red-commits"))).toBe("phase " + initial + "\n");
  });

  it("rejects a declared story in recorded red history", async () => {
    const { tools, files, checks, outputs } = fixture();
    files.set(scopeFile, "implementation-story " + implementation);
    const git: PhaseTools["git"] = (args) =>
      args.includes("--diff-filter=ACDMRTUXB") && args.length === 8 ? implementation + "\0" : tools.git(args);
    await checkPhase(request, { ...tools, git });
    expect(checks.map(({ check }) => check.mode)).toEqual(["base", "head"]);
    expect(outputs).toMatchObject([{ output: {
      status: "fail", red_commits: [],
      problems: ["red commit phase changes a declared implementation story: " + implementation],
    } }]);
  });

  it.each([
    "", "/storybook/stories/plan.stories.ts", "packages/storybook/stories/plan.stories.ts",
    "storybook/stories/../plan.stories.ts", "storybook/stories/./plan.stories.ts", "storybook/stories//plan.stories.ts",
    "storybook/stories/*.stories.ts", ":(glob)storybook/stories/plan.stories.ts", "storybook/stories/plan.test.ts",
    "storybook/stories/sub\\plan.stories.ts", "storybook/stories/.stories.ts", "storybook/stories/a.stories.tsx",
    "storybook/stories/my plan.stories.ts",
  ])("rejects malformed implementation story scope (%s)", async (path) => {
    const { tools, files, checks } = fixture();
    files.set(scopeFile, "implementation-story " + path);
    await expect(checkPhase(request, tools)).rejects.toThrow(scopeError);
    expect(checks).toEqual([]);
  });

  it.each([implementation, "ci-only " + implementation])("rejects competing declarations for a story (%s)", async (other) => {
    const { tools, files, checks } = fixture();
    files.set(scopeFile, other + "\nimplementation-story " + implementation);
    await expect(checkPhase(request, tools)).rejects.toThrow("conflicting test scope for implementation story: " + implementation);
    expect(checks).toEqual([]);
  });

  it("does not interpret the directive inside an ordinary test path", async () => {
    const { tools, files, calls, checks } = fixture();
    const path = "test/implementation-story support.test.ts";
    files.set(scopeFile, path);
    await checkPhase(request, tools);
    expect(checks.at(-1)?.check.selection.extra).toEqual([path]);
    expect(calls.filter((args) => args.includes("--diff-filter=ACDMRTUXB") && args.length === 8)).toEqual([]);
  });
});

describe("Story file syntax boundaries", () => {
  it("does not interpret ci-only as a directive inside a local scope path", async () => {
    const { tools, files, checks, outputs } = fixture();
    const localPath = "test/ci-only support.test.ts";
    files.set(join(dir, "test-scope.txt"), localPath + "\n");
    await checkPhase(request, tools);
    expect(checks.at(-1)?.check.selection.extra).toEqual([localPath]);
    expect(outputs[0]?.output).not.toHaveProperty("deferred_ci");
  });

  it("rewrites prior red records with trailing whitespace-only lines", async () => {
    const { tools, files, outputs } = fixture();
    const history = join(dir, "red-commits");
    files.set(history, "phase " + initial + "\n \t\n\t");
    await checkPhase({ ...request, mode: "red", label: "fix-1" }, tools);
    expect(files.get(history)).toBe("phase " + initial + "\nfix-1 " + head + "\n");
    expect(outputs).toMatchObject([{ output: { recorded: true } }]);
  });
});
