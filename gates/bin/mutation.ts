// The mutation gate (FR-011 to FR-013, research.md R-08): mutation-tests the package source and gate source lines
// changed since `--base <sha>` with Stryker (mutate ranges), and decides from Stryker's JSON report, never from its
// exit code. Before any mode runs, a `git diff` file header it cannot read, or a changed path Stryker cannot take
// verbatim as a `mutate` input, is exit 2 naming the header or every such path (phase 3 round 7, O7-01 and O7-02),
// so the gate never passes with changed code it did not check; nor does it after Stryker runs: a `mutate` entry
// Stryker's output reports it did not read (a file under a folder such as `.next`) is exit 2 naming each such entry,
// in the whole-diff and `--files` runs alike (phase 3 round 12, O12-01); a changed file Stryker read that is absent
// from its report has no mutant on its changed lines and passes (report.ts). `--plan` prints the CI shards, splitting a file of more than
// 30 changed lines into `path:start-end` entries (002 phase 5 round 6, O6-01: 60; 007 spec FR-014, 2026-11-11: 30),
// two entries of one file never in one shard, and writes the number of shards and of cuts within files to stderr, the JSON on stdout staying one array for
// ci.yml (phase 3 round 10, O10-01 and O10-02); `--files <entry>[,<entry>...]` limits a run to one shard's entries and mutates only the
// changed lines inside them (shards.ts; phase 3 round 9, O9-01). `mutation()` is
// the decision, tested in-process with doubles for git, the file system and Stryker: it deletes an earlier run's
// report, runs Stryker and reads the report that run wrote. `run()` gives it the real tools of the `--root`
// repository (the process boundary, tested by gates/test/integration/mutation.test.ts). Mission 007
// (contracts/mutation-output.md): after the equivalent records, a run that reached the classification prints a
// `timeout` line per Timeout mutant and a `compile-error` line per CompileError mutant on a changed line, then a
// `zero-mutants` line per entry with no mutant on its changed lines (named by its path, or its `--files` entry as
// given), all before the findings; a report line goes through `oneLine` as a finding does, so a mutant with no
// replacement ends its line at `replaced by` (phase 2 round 2, O2-01); both summaries count the three kinds, also when zero. These report lines are not
// findings and change no exit code. A `--files` list naming one file more than once is exit 2 before Stryker runs.
import { readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Context, Io } from "../lib/cli.ts";
import { emit, oneLine, plural } from "../lib/findings.ts";
import type { Finding } from "../lib/findings.ts";
import { strykerEnv } from "../lib/mutation/coverage.ts";
import { changedFiles, mutateSpecs, scopePathspecs, unusableMutatePaths } from "../lib/mutation/ranges.ts";
import type { ChangedFile } from "../lib/mutation/ranges.ts";
import { formatRecord, scanRecords } from "../lib/mutation/records.ts";
import type { EquivalentRecord } from "../lib/mutation/records.ts";
import { classifyMutants } from "../lib/mutation/report.ts";
import type { RunEntry, StrykerRun, UndecidedMutant } from "../lib/mutation/report.ts";
import { countCuts, formatPlan, planShards, selectFiles } from "../lib/mutation/shards.ts";
import { runTool } from "../lib/spawn.ts";
import type { ToolRun } from "../lib/spawn.ts";

export type { ToolRun } from "../lib/spawn.ts";

/** The tools the mutation gate uses, all in the repository root. */
export interface MutationTools {
  /** Runs git with these arguments. */
  readonly git: (args: readonly string[]) => Promise<ToolRun>;
  /** Reads a repository file (path relative to the root); undefined when it cannot be read. */
  readonly read: (path: string) => Promise<string | undefined>;
  /** Deletes a repository file (path relative to the root), if it exists. */
  readonly remove: (path: string) => Promise<void>;
  /** Runs Stryker with this configuration file on these `mutate` entries and returns its exit code and output. */
  readonly stryker: (mutate: readonly string[], config: string) => Promise<ToolRun>;
}

interface Options {
  readonly base: string | undefined;
  readonly plan: boolean;
  readonly files: string | undefined;
}

/**
 * The Stryker configurations and the JSON report each names (`jsonReporter.fileName`), with the changed files each
 * mutates (005 research.md R-12): element source runs under stryker.elements.config.json, whose Vitest config holds
 * only the in-process elements project, so per-test coverage reaches Stryker; every other file under
 * stryker.config.json, whose Vitest config leaves that project out. In this order, so the default run's findings come
 * first.
 */
const configurations = [
  { file: "stryker.config.json", report: "reports/mutation/mutation.json", elements: false },
  { file: "stryker.elements.config.json", report: "reports/mutation/mutation-elements.json", elements: true },
] as const;

/** Whether a changed path is element source, which stryker.elements.config.json mutates. */
function elementSource(path: string): boolean {
  return path.startsWith("packages/elements/src/");
}

/** What the gate reads as a `+++` header of `git diff` (ranges.ts), for the cause of a header it cannot read. */
const headerHint = 'the gate reads +++ b/<path>, a C-quoted "b/<path>" or /dev/null (check diff.noprefix and diff.mnemonicPrefix)';

/** What makes a path unusable as a Stryker `mutate` input (ranges.ts `unusableMutatePaths`). */
const unusableKinds =
  "a glob metacharacter *?[]{}!, a comma, a backslash, an extglob +( @( or a line terminator \\n \\r U+2028 U+2029";

const usage = "usage: gate:mutation -- --base <sha> [--plan | --files <path>[:<start>-<end>][,...]]";

/** A path as JSON, U+2028 and U+2029 escaped too, so the cause stays one line. */
function quote(path: string): string {
  return JSON.stringify(path).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/** The cause of a `--files` list that selects nothing, by what is wrong with its entries (shards.ts `selectFiles`). */
const selectionProblems = {
  malformed: "--files names a malformed range (path:start-end, 1 <= start <= end)",
  repeated: "--files names one file more than once (two entries of one file never share a shard)",
  missing: "--files names a file with no changed package or gate source line",
  empty: "--files names a range with no changed line",
} as const;

/** The gate's options, or the problem with its arguments. A lone `--` (from `pnpm run ... --`) is skipped. */
function parseOptions(args: readonly string[]): Options | string {
  let base: string | undefined;
  let files: string | undefined;
  let plan = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") continue;
    if (arg === "--plan") {
      plan = true;
      continue;
    }
    if (arg !== "--base" && arg !== "--files") return `unknown argument ${String(arg)}`;
    const value = args[i + 1];
    if (value === undefined || value === "") return `${arg} needs a value`;
    if (arg === "--base") base = value;
    else files = value;
    i += 1;
  }
  return { base, plan, files };
}

export async function mutation(context: Context, tools: MutationTools, io: Io): Promise<number> {
  const fail = (cause: string): number => emit({ exit: 2, cause: `mutation: could not run: ${cause}` }, io.out, io.err);
  const options = parseOptions(context.args);
  if (typeof options === "string") return fail(`${options}; ${usage}`);
  const { base } = options;
  if (base === undefined) {
    return fail(`--base <sha> is required (the pull request's base commit, or the phase's base.sha); ${usage}`);
  }
  const resolved = await tools.git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
  if (resolved.exitCode !== 0) {
    return fail(`--base ${base} does not resolve to a commit; pass an existing commit (in CI, check out with fetch-depth: 0)`);
  }
  const diff = await tools.git(["diff", "--unified=0", "--no-color", "--no-ext-diff", base, "--", ...scopePathspecs]);
  if (diff.exitCode !== 0) return fail(`git diff failed (${String(diff.stderr.trim().split("\n")[0])})`);
  let changed: ChangedFile[];
  try {
    changed = changedFiles(diff.stdout);
  } catch (error) {
    return fail(`${(error as Error).message}; ${headerHint}`);
  }
  const unusable = unusableMutatePaths(changed);
  if (unusable.length > 0) {
    const paths = unusable.map(quote).join(", ");
    return fail(`Stryker cannot take these changed paths as mutate input (${unusableKinds}): ${paths}; rename them`);
  }
  if (options.plan) {
    const shards = planShards(changed);
    io.out(formatPlan(shards));
    const counts = `${plural(shards.length, "shard")}, ${plural(countCuts(shards), "cut")}`;
    io.err(`mutation: plan: ${counts} within files (a mutant spanning a cut is mutated in no shard, see gates/README.md)`);
    return 0;
  }

  let selected: readonly RunEntry[] = changed;
  if (options.files !== undefined) {
    const selection = selectFiles(changed, options.files);
    if (!("files" in selection)) {
      const [problem, entries] = Object.entries(selection)[0] as [keyof typeof selectionProblems, readonly string[]];
      return fail(`${selectionProblems[problem]}: ${entries.join(", ")}; run --plan for the shards`);
    }
    selected = selection.files;
  }
  if (selected.length === 0) {
    io.out(`mutation: nothing to mutate: no package or gate source line changed since ${base}`);
    return 0;
  }

  const records: EquivalentRecord[] = [];
  const findings: Finding[] = [];
  for (const file of selected) {
    const source = await tools.read(file.path);
    if (source === undefined) return fail(`cannot read ${file.path}; check out the files of the change`);
    const scan = scanRecords(file, source);
    records.push(...scan.records);
    findings.push(...scan.findings);
  }
  // One Stryker run per configuration that has changed files, each after deleting its own earlier report, and their
  // classified mutants merged (005 research.md R-12): every field of the verdict, findings, mutants, timeouts, compile
  // errors and zero-mutant entries (007), summed or collected over the runs.
  let mutants = 0;
  const timeouts: UndecidedMutant[] = [];
  const compileErrors: UndecidedMutant[] = [];
  const zeroEntries: string[] = [];
  for (const configuration of configurations) {
    const group = selected.filter((file) => elementSource(file.path) === configuration.elements);
    if (group.length === 0) continue;
    await tools.remove(configuration.report);
    const ran = await tools.stryker(mutateSpecs(group), configuration.file);
    const report = await tools.read(configuration.report);
    const stryker: StrykerRun = { report, exitCode: ran.exitCode, output: `${ran.stdout}${ran.stderr}` };
    const verdict = classifyMutants(stryker, group);
    if (!verdict.ok) return emit({ exit: 2, cause: verdict.cause }, io.out, io.err);
    findings.push(...verdict.findings);
    mutants += verdict.mutants;
    timeouts.push(...verdict.timeouts);
    compileErrors.push(...verdict.compileErrors);
    zeroEntries.push(...verdict.zeroEntries);
  }

  for (const record of records) io.out(formatRecord(record));
  const undecided = (rule: string, mutant: UndecidedMutant): string =>
    oneLine(`${mutant.path}:${String(mutant.line)}: mutation: ${rule}: ${mutant.mutator}: replaced by ${mutant.replacement}`);
  for (const mutant of timeouts) io.out(undecided("timeout", mutant));
  for (const mutant of compileErrors) io.out(undecided("compile-error", mutant));
  for (const entry of zeroEntries) io.out(`${entry}: mutation: zero-mutants: no mutant on the changed lines`);
  const counts = [
    plural(timeouts.length, "timeout"),
    plural(compileErrors.length, "compile error"),
    plural(zeroEntries.length, "zero-mutant entry", "zero-mutant entries"),
  ].join(", ");
  const files = selected.length;
  if (findings.length > 0) {
    const summary = `mutation: ${plural(findings.length, "finding")} in ${plural(files, "changed file")} (${plural(mutants, "mutant")} on changed lines; ${counts})`;
    return emit({ exit: 1, findings, summary }, io.out, io.err);
  }
  const summary = `mutation: ${plural(mutants, "mutant")} on the changed lines of ${plural(files, "file")}, none survived; ${counts}; ${plural(records.length, "equivalent record")}`;
  return emit({ exit: 0, summary }, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "--files mutates only the listed file"
function realTools(root: string, env: Io["env"]): MutationTools {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "--files mutates only the listed file"
  const stryker = join(root, "node_modules", "@stryker-mutator", "core", "bin", "stryker.js");
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "--files mutates only the listed file"
  return {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "--files mutates only the listed file"
    git: (args) => runTool("git", args, root, env),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "deletes an earlier run's report: a Stryker run that writes none exits 2 (review round 1, R1-01)"
    read: (path) => readFile(join(root, path), "utf8").catch(() => undefined),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "deletes an earlier run's report: a Stryker run that writes none exits 2 (review round 1, R1-01)"
    remove: (path) => rm(join(root, path), { force: true }),
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "reports a change only to source no test imports as a located NoCoverage finding (exit 1), not as could not run (review round 1, R1-10)"
    stryker: (mutate, config) => runTool(process.execPath, [stryker, "run", config, "--mutate", mutate.join(",")], root, strykerEnv(env)),
  };
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "--files mutates only the listed file"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  return mutation(context, realTools(context.root, io.env), io);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/mutation.test.ts "--files mutates only the listed file"
if (import.meta.main) await main(run);
