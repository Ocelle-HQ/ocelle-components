// A plant's plant.json and the verdict on one gate run on it (FR-025, research.md R-10, contracts/plants.md,
// data-model.md § Plant): parsePlant reads plant.json, plantArgs builds the plant command, judgePlant compares a
// gate's exit code and output lines with what the plant expects. Pure, tested in process (gates/test/plants.test.ts).
// An error plant names the cause it expects: a gate's exit 2 proves the plant only when a line of its error output
// contains that cause, and a pass plant may not set `base` (phase 4 round 5, O5-01 and O5-02, operator decision,
// PR #18 landing review: "Breaking plants check the cause of exit 2, not just the code; pass plants may not set
// 'base'"). The mutation gate's report lines (007 research R-02: rules `timeout`, `compile-error` and `zero-mutants`,
// beside the equivalent records' `record`) are never findings of a mutation run; a mutation pass or fail plant may list
// the report lines it expects in `reports`, compared with the run's report lines as a multiset, by location and rule
// (and a message substring where given), and `records` compares the run's `record` lines only.
import { oneLine, plural } from "./findings.ts";

/** One expected finding of a fail plant. */
export interface ExpectedFinding {
  readonly location: string;
  readonly rule: string;
  readonly message?: string;
}

/** One expected equivalent-mutant record of a mutation pass plant. */
export interface ExpectedRecord {
  readonly location: string;
  readonly mutator: string;
  readonly reason: string;
}

/** The rules of the mutation gate's report lines (007 contracts/mutation-output.md), which a plant may list. */
const reportRules = ["timeout", "compile-error", "zero-mutants"] as const;

/** One expected report line of a mutation plant: a Timeout, a CompileError or a zero-mutant entry. */
export interface ExpectedReport {
  readonly location: string;
  readonly rule: (typeof reportRules)[number];
  readonly message?: string;
}

/** A plant's plant.json. */
export interface Plant {
  readonly expect: "fail" | "pass" | "error";
  readonly why: string;
  readonly findings?: readonly ExpectedFinding[];
  readonly records?: readonly ExpectedRecord[];
  /** A mutation plant's expected report lines; when absent, report lines are not checked. */
  readonly reports?: readonly ExpectedReport[];
  /** An error plant's expected cause: a substring of a line of the gate's error output at exit 2. */
  readonly cause?: string;
  /** The base the plant presents to its gate (`{base}`) instead of its temporary repository's base commit. */
  readonly base?: string;
  /**
   * The links its plant root goes without: only `storybook/node_modules`, for a Storybook plant whose input is the
   * Storybook dependencies not installed (006 research.md R-16).
   */
  readonly unlinked?: readonly string[];
  /** The engine a visual plant presents as `{engine}`: both engines, the host, or a missing engine (006 research.md R-06). */
  readonly engine?: "both" | "host" | "missing";
  /** The visual pass plant whose baselines a visual fail plant's root receives (006 research.md R-16). */
  readonly baselinesOf?: string;
  /** A visual pass plant whose baselines come only from single-story-theme requests (006 research.md R-11). */
  readonly captureAlone?: true;
  /**
   * Arguments the plant runner appends to the gate's plant command, after its placeholders are filled (030 US2: the
   * release-readiness plants' `--tag`; operator decision reviews/phase-2/operator-plant-format-decision.md).
   */
  readonly args?: readonly string[];
}

/** The gates that build the Storybook in their plant roots (006 research.md R-07, R-16). */
export const storybookGates: readonly string[] = ["storybook-build", "visual", "axe"];

const keys = new Set(["expect", "why", "findings", "records", "reports", "cause", "base", "unlinked", "engine", "baselinesOf", "captureAlone", "args"]);
const engines = ["both", "host", "missing"] as const;
const unlinkable = "storybook/node_modules";

function isText(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function readFindings(value: unknown): ExpectedFinding[] | string {
  if (!Array.isArray(value) || value.length === 0) return "a fail plant lists its findings";
  const findings: ExpectedFinding[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const at = `findings[${String(index)}]`;
    const fields = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const { location, rule, message } = fields;
    if (!isText(location) || !isText(rule)) return `${at} needs a location and a rule`;
    if (message !== undefined && typeof message !== "string") return `${at}.message must be a string`;
    findings.push(message === undefined ? { location, rule } : { location, rule, message });
  }
  return findings;
}

function readRecords(value: unknown): ExpectedRecord[] | string {
  if (!Array.isArray(value)) return "records must be a list";
  const records: ExpectedRecord[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const fields = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const { location, mutator, reason } = fields;
    if (!isText(location) || !isText(mutator) || !isText(reason)) {
      return `records[${String(index)}] needs a location, a mutator and a reason`;
    }
    records.push({ location, mutator, reason });
  }
  return records;
}

function isReportRule(value: unknown): value is ExpectedReport["rule"] {
  return reportRules.some((rule) => rule === value);
}

function readReports(value: unknown): ExpectedReport[] | string {
  if (!Array.isArray(value)) return "reports must be a list";
  const reports: ExpectedReport[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const at = `reports[${String(index)}]`;
    const fields = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const { location, rule, message } = fields;
    if (!isText(location) || !isReportRule(rule)) return `${at} needs a location and a rule: timeout, compile-error or zero-mutants`;
    if (message !== undefined && typeof message !== "string") return `${at}.message must be a string`;
    reports.push(message === undefined ? { location, rule } : { location, rule, message });
  }
  return reports;
}

/** A plant.json text as a plant, or the problem with it. */
export function parsePlant(text: string): Plant | string {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return `plant.json is not valid JSON (${oneLine(error instanceof Error ? error.message : String(error))})`;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "plant.json is not an object";
  const fields = value as Record<string, unknown>;
  const unknown = Object.keys(fields).find((key) => !keys.has(key));
  if (unknown !== undefined) return `unknown key ${unknown}`;
  const { expect, why } = fields;
  if (expect !== "fail" && expect !== "pass" && expect !== "error") return "expect must be fail, pass or error";
  if (typeof why !== "string" || why.trim() === "") return "why must be a non-empty string";
  let plant: Plant = { expect, why };
  if (expect === "fail") {
    const findings = readFindings(fields.findings);
    if (typeof findings === "string") return findings;
    plant = { ...plant, findings };
  } else if (fields.findings !== undefined) {
    return "only a fail plant lists findings";
  }
  if (fields.records !== undefined) {
    if (expect !== "pass") return "only a pass plant lists records";
    const records = readRecords(fields.records);
    if (typeof records === "string") return records;
    plant = { ...plant, records };
  }
  if (fields.reports !== undefined) {
    if (expect === "error") return "only a pass or fail plant lists reports";
    const reports = readReports(fields.reports);
    if (typeof reports === "string") return reports;
    plant = { ...plant, reports };
  }
  if (expect === "error") {
    if (!isText(fields.cause)) return "an error plant names its cause, a non-empty string";
    plant = { ...plant, cause: fields.cause };
  } else if (fields.cause !== undefined) {
    return "only an error plant names a cause";
  }
  if (fields.base !== undefined) {
    if (expect === "pass") return "a pass plant may not set base";
    if (!isText(fields.base)) return "base must be a non-empty string";
    plant = { ...plant, base: fields.base };
  }
  if (fields.unlinked !== undefined) {
    const { unlinked } = fields;
    if (!Array.isArray(unlinked) || unlinked.length !== 1 || unlinked[0] !== unlinkable) return `unlinked must be ["${unlinkable}"]`;
    plant = { ...plant, unlinked: [unlinkable] };
  }
  if (fields.engine !== undefined) {
    const engine = engines.find((value) => value === fields.engine);
    if (engine === undefined) return "engine must be both, host or missing";
    plant = { ...plant, engine };
  }
  if (fields.baselinesOf !== undefined) {
    const { baselinesOf } = fields;
    if (typeof baselinesOf !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(baselinesOf)) return "baselinesOf must be the name of a visual pass plant";
    plant = { ...plant, baselinesOf };
  }
  if (fields.captureAlone !== undefined) {
    if (fields.captureAlone !== true) return "captureAlone must be true";
    plant = { ...plant, captureAlone: true };
  }
  if (fields.args !== undefined) {
    const { args } = fields;
    if (!Array.isArray(args) || args.length === 0 || !args.every(isText)) return "args must be a non-empty list of non-empty strings";
    plant = { ...plant, args };
  }
  return plant;
}

/** The problem with a plant's keys for the gate whose plant it is, or undefined when its keys are valid for that gate. */
export function gateKeysProblem(gate: string, plant: Plant): string | undefined {
  if (plant.unlinked !== undefined && !storybookGates.includes(gate)) return "unlinked is only for plants of storybook-build, visual and axe";
  if (plant.engine !== undefined && gate !== "visual") return "engine is only for plants of visual";
  if (plant.baselinesOf !== undefined && (gate !== "visual" || plant.expect !== "fail")) return "baselinesOf is only for visual fail plants";
  if (plant.captureAlone !== undefined && (gate !== "visual" || plant.expect !== "pass")) return "captureAlone is only for visual pass plants";
  return undefined;
}

/**
 * The problem of a plant's files for its keys (006 contracts/plants.md § Plant runner changes): `baselinesOf` needs no
 * baseline in the plant's own tree/ and a visual pass plant holding baselines without baselinesOf itself (`named`,
 * undefined when no such plant exists); `captureAlone` needs stories of the plant's own. Paths are relative to tree/.
 */
export function plantFilesProblem(plant: Plant, tree: readonly string[], named?: { readonly plant: Plant | undefined; readonly tree: readonly string[] }): string | undefined {
  const baselines = (tree: readonly string[]): boolean => tree.some((path) => path.startsWith("storybook/baselines/"));
  if (plant.baselinesOf !== undefined) {
    if (baselines(tree)) return "a plant with baselinesOf holds no file under storybook/baselines/ in its tree/";
    if (named?.plant?.expect !== "pass") return `baselinesOf names ${plant.baselinesOf}, which is not a visual pass plant`;
    if (!baselines(named.tree)) return `baselinesOf names ${plant.baselinesOf}, which holds no baselines`;
  }
  const ownStory = tree.some((path) => /^storybook\/stories\/[^/]+\.stories\.ts$/.test(path));
  if (plant.captureAlone === true && !ownStory) return "a captureAlone plant has stories of its own in tree/storybook/stories/";
  return undefined;
}

/** One gate run on a plant: its exit code and output lines, and for a commit plant the hashes of its records. */
export interface PlantRun {
  readonly exit: number | null;
  readonly stdout: readonly string[];
  readonly stderr: readonly string[];
  readonly commits?: readonly string[];
  /** The plant's expected findings with keyed locations resolved in its built tree (002 contracts/gates.md § Keyed locations). */
  readonly expected?: readonly ExpectedFinding[];
}

/**
 * The arguments of a registry `plantCommand` with `{root}`, `{plant}` and `{base}` replaced, split at spaces; the
 * leading `node` stays as written (the runner starts it as the current Node).
 */
export function plantArgs(command: string, values: Readonly<Record<string, string>>): string[] {
  return command
    .split(" ")
    .filter((arg) => arg !== "")
    .map((arg) =>
      arg.replace(/\{(\w+)\}/g, (_, name: string) => {
        const value = values[name];
        if (value === undefined) throw new Error(`plantCommand uses {${name}}, which this plant does not set`);
        return value;
      }),
    );
}

/** A finding or a record line of a gate's output, by location and rule (and the text after the rule). */
interface Reported {
  readonly location: string;
  readonly rule: string;
  readonly rest: string;
}

/** The lines of `gate` in its output (`<location>: <gate>: <rule>: <message>`); a commit hash becomes `commit:<n>`. */
function reported(gate: string, run: PlantRun): Reported[] {
  const marker = `: ${gate}: `;
  const found: Reported[] = [];
  for (const line of run.stdout) {
    const at = line.indexOf(marker);
    if (at <= 0) continue;
    const hash = line.slice(0, at);
    // 030 US2: a location `<commit>:<path>` (the release-readiness secret finding) names its commit by record too,
    // `commit:<n>:<path>` (operator decision reviews/phase-2/operator-plant-format-decision.md).
    const [commit = hash, path] = /^[0-9a-f]{40}:/.test(hash) ? [hash.slice(0, 40), hash.slice(41)] : [hash];
    const record = run.commits?.indexOf(commit) ?? -1;
    const location = record === -1 ? hash : `commit:${String(record + 1)}${path === undefined ? "" : `:${path}`}`;
    const body = line.slice(at + marker.length);
    const end = body.indexOf(": ");
    found.push(end === -1 ? { location, rule: body, rest: "" } : { location, rule: body.slice(0, end), rest: body.slice(end + 2) });
  }
  return found;
}

/** The difference of two lists of keys: what `expected` has and `actual` lacks, and the reverse (each once). */
function differ(what: string, expected: readonly string[], actual: readonly string[]): string | undefined {
  const missing = [...new Set(expected.filter((key) => !actual.includes(key)))];
  const unexpected = [...new Set(actual.filter((key) => !expected.includes(key)))];
  if (missing.length === 0 && unexpected.length === 0) return undefined;
  const parts = [
    ...(missing.length > 0 ? [`missing ${missing.join(", ")}`] : []),
    ...(unexpected.length > 0 ? [`unexpected ${unexpected.join(", ")}`] : []),
  ];
  return `${what} differ: ${parts.join("; ")}`;
}

/**
 * The multiset difference of two lists of keys: each key `expected` has more often than `actual` is missing as often
 * as it is short, and the reverse is unexpected, in the order of each list.
 */
function differCounted(what: string, expected: readonly string[], actual: readonly string[]): string | undefined {
  const rest = (from: readonly string[], take: readonly string[]): string[] => {
    const left = [...take];
    return from.filter((key) => {
      const at = left.indexOf(key);
      if (at === -1) return true;
      left.splice(at, 1);
      return false;
    });
  };
  const missing = rest(expected, actual);
  const unexpected = rest(actual, expected);
  if (missing.length === 0 && unexpected.length === 0) return undefined;
  const parts = [
    ...(missing.length > 0 ? [`missing ${missing.join(", ")}`] : []),
    ...(unexpected.length > 0 ? [`unexpected ${unexpected.join(", ")}`] : []),
  ];
  return `${what} differ: ${parts.join("; ")}`;
}

const key = (found: { readonly location: string; readonly rule: string }): string => `${found.location} ${found.rule}`;

/**
 * The problem with a run's report lines against a plant's `reports`: a multiset by location and rule, then each
 * expected message in a line of its own, the entries with a message taking their lines first.
 */
function judgeReports(expected: readonly ExpectedReport[], lines: readonly Reported[]): string | undefined {
  const differs = differCounted("reports", expected.map(key), lines.map(key));
  if (differs !== undefined) return differs;
  const left = [...lines];
  for (const wanted of expected) {
    const { message } = wanted;
    if (message === undefined) continue;
    const at = left.findIndex((found) => key(found) === key(wanted) && found.rest.includes(message));
    if (at === -1) return `report ${key(wanted)} lacks "${message}"`;
    left.splice(at, 1);
  }
  return undefined;
}

/** The detail of an unexpected result: the findings it reported, else the first line of its error output. */
function detail(findings: readonly Reported[], run: PlantRun): string {
  if (findings.length > 0) return ` (${findings.map((found) => `${found.location} ${found.rule}`).join(", ")})`;
  const [cause] = run.stderr;
  return cause === undefined ? "" : ` (${cause})`;
}

/** The problem with a gate's run on a plant, or undefined when the gate did what the plant expects. */
export function judgePlant(gate: string, plant: Plant, run: PlantRun): string | undefined {
  const exit = String(run.exit);
  if (plant.reports !== undefined && gate !== "mutation") return "reports are only for plants of the mutation gate";
  if (plant.expect === "error") {
    if (run.exit !== 2) return `expected exit 2 (could not run), got exit ${exit}`;
    const cause = plant.cause ?? "";
    if (run.stderr.some((line) => line.includes(cause))) return undefined;
    return `expected exit 2 (could not run) with the cause "${cause}", got exit 2${detail([], run)}`;
  }
  const lines = reported(gate, run);
  const ruled = (rules: readonly string[]) => (found: Reported): boolean => gate === "mutation" && rules.includes(found.rule);
  const isRecord = ruled(["record"]);
  const isReport = ruled(reportRules);
  const findings = lines.filter((found) => !isRecord(found) && !isReport(found));
  const reports = (): string | undefined => (plant.reports === undefined ? undefined : judgeReports(plant.reports, lines.filter(isReport)));
  if (plant.expect === "pass") {
    if (run.exit !== 0 || findings.length > 0) return `expected exit 0 with no finding, got exit ${exit}${detail(findings, run)}`;
    if (plant.records !== undefined) {
      const records = lines.filter(isRecord).map((found) => {
        const end = found.rest.indexOf(": ");
        return `${found.location} ${found.rest.slice(0, end)} "${found.rest.slice(end + 2)}"`;
      });
      const expected = plant.records.map((record) => `${record.location} ${record.mutator} "${record.reason}"`);
      const differs = differ("records", expected, records);
      if (differs !== undefined) return differs;
    }
    return reports();
  }
  const expected = run.expected ?? plant.findings ?? [];
  if (run.exit !== 1) return `expected exit 1 with the plant's ${plural(expected.length, "finding")}, got exit ${exit}${detail(findings, run)}`;
  const differs = differ("findings", expected.map(key), findings.map(key));
  if (differs !== undefined) return differs;
  for (const wanted of expected) {
    if (wanted.message === undefined) continue;
    const { message } = wanted;
    const matches = findings.filter((found) => key(found) === key(wanted));
    if (!matches.some((found) => found.rest.includes(message))) return `finding ${key(wanted)} lacks "${message}"`;
  }
  return reports();
}
