// A plant's plant.json and the verdict on one gate run on it (FR-025, research.md R-10, contracts/plants.md,
// data-model.md § Plant): parsePlant reads plant.json, plantArgs builds the plant command, judgePlant compares a
// gate's exit code and output lines with what the plant expects. Pure, tested in process (gates/test/plants.test.ts).
// An error plant names the cause it expects: a gate's exit 2 proves the plant only when a line of its error output
// contains that cause, and a pass plant may not set `base` (phase 4 round 5, O5-01 and O5-02, operator decision,
// PR #18 landing review: "Breaking plants check the cause of exit 2, not just the code; pass plants may not set
// 'base'").
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

/** A plant's plant.json. */
export interface Plant {
  readonly expect: "fail" | "pass" | "error";
  readonly why: string;
  readonly findings?: readonly ExpectedFinding[];
  readonly records?: readonly ExpectedRecord[];
  /** An error plant's expected cause: a substring of a line of the gate's error output at exit 2. */
  readonly cause?: string;
  /** The base the plant presents to its gate (`{base}`) instead of its temporary repository's base commit. */
  readonly base?: string;
}

const keys = new Set(["expect", "why", "findings", "records", "cause", "base"]);

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
  return plant;
}

/** The problem with a plant's keys for the gate whose plant it is, or undefined when its keys are valid for that gate. */
export function gateKeysProblem(gate: string, plant: Plant): string | undefined {
  throw new Error(`not implemented (plant-judge gateKeysProblem, phase 2): ${gate} ${plant.expect}`);
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
    const record = run.commits?.indexOf(hash) ?? -1;
    const location = record === -1 ? hash : `commit:${String(record + 1)}`;
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

/** The detail of an unexpected result: the findings it reported, else the first line of its error output. */
function detail(findings: readonly Reported[], run: PlantRun): string {
  if (findings.length > 0) return ` (${findings.map((found) => `${found.location} ${found.rule}`).join(", ")})`;
  const [cause] = run.stderr;
  return cause === undefined ? "" : ` (${cause})`;
}

/** The problem with a gate's run on a plant, or undefined when the gate did what the plant expects. */
export function judgePlant(gate: string, plant: Plant, run: PlantRun): string | undefined {
  const exit = String(run.exit);
  if (plant.expect === "error") {
    if (run.exit !== 2) return `expected exit 2 (could not run), got exit ${exit}`;
    const cause = plant.cause ?? "";
    if (run.stderr.some((line) => line.includes(cause))) return undefined;
    return `expected exit 2 (could not run) with the cause "${cause}", got exit 2${detail([], run)}`;
  }
  const lines = reported(gate, run);
  const isRecord = (found: Reported): boolean => gate === "mutation" && found.rule === "record";
  const findings = lines.filter((found) => !isRecord(found));
  if (plant.expect === "pass") {
    if (run.exit !== 0 || findings.length > 0) return `expected exit 0 with no finding, got exit ${exit}${detail(findings, run)}`;
    if (plant.records === undefined) return undefined;
    // Here every line is a record: a pass plant with any other finding line was rejected above.
    const records = lines.map((found) => {
      const end = found.rest.indexOf(": ");
      return `${found.location} ${found.rest.slice(0, end)} "${found.rest.slice(end + 2)}"`;
    });
    const expected = plant.records.map((record) => `${record.location} ${record.mutator} "${record.reason}"`);
    return differ("records", expected, records);
  }
  const expected = run.expected ?? plant.findings ?? [];
  if (run.exit !== 1) return `expected exit 1 with the plant's ${plural(expected.length, "finding")}, got exit ${exit}${detail(findings, run)}`;
  const key = (found: { readonly location: string; readonly rule: string }): string => `${found.location} ${found.rule}`;
  const differs = differ("findings", expected.map(key), findings.map(key));
  if (differs !== undefined) return differs;
  for (const wanted of expected) {
    if (wanted.message === undefined) continue;
    const { message } = wanted;
    const matches = findings.filter((found) => key(found) === key(wanted));
    if (!matches.some((found) => found.rest.includes(message))) return `finding ${key(wanted)} lacks "${message}"`;
  }
  return undefined;
}
