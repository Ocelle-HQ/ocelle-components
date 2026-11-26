// The gate registry (gates/gates.json, data-model.md § Gate) and its check against ci.yml and the FR-020 list
// (research.md R-10): the gate ids of the registry, the gate jobs of the workflow (every job but the plant job and
// the registry's helper jobs) and the FR-020 list below must be one set. The check compares files one pull request
// can change together; the ruleset on main that requires the nineteen checks guards a coordinated removal.
import type { Finding } from "./findings.ts";

/** How a gate's plants are presented to it (contracts/plants.md). */
export type PlantForm = "repo-tree" | "commit-repo" | "mutation-repo" | "tracked-tree" | "workspace";

/** One registry entry. */
export interface Gate {
  readonly id: string;
  readonly check: string;
  readonly command: string;
  readonly plantCommand: string;
  readonly plantForm: PlantForm;
  readonly scope: string;
  readonly helperJobs?: readonly string[];
}

/** The gates of FR-020, by id. */
export const fr020: readonly string[] = [
  "typecheck",
  "lint",
  "style-lint",
  "unit-tests",
  "test-lint",
  "mutation",
  "csp",
  "prefix",
  "config-copies",
  "pins",
  "signoff",
  // 002 FR-020: the contrast and brand-rules gates of the design tokens.
  "contrast",
  "brand-rules",
  // 005 FR-009: the custom-elements manifest gate.
  "manifest",
  // 006 FR-017: the Storybook build gate, the visual regression gate and the accessibility gate.
  "storybook-build",
  "visual",
  "axe",
  // op 023 (#60): the sandbox-paths gate.
  "sandbox-paths",
];

/** The id of the plant job in ci.yml; it is not a gate. */
export const plantJob = "plants";

/** The plant job's helper jobs in ci.yml (plan decision 23): its plan and its shards; not gates either. */
export const plantHelperJobs: readonly string[] = ["plants-plan", "plants-shard"];

const forms: readonly string[] = ["repo-tree", "commit-repo", "mutation-repo", "tracked-tree", "workspace"];
const textFields = ["id", "check", "command", "plantCommand", "scope"] as const;

/** One registry entry, or throws naming its problem. */
function entry(value: unknown, at: string): Gate {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${at} is not an object`);
  const fields = value as Record<string, unknown>;
  for (const field of textFields) {
    const text = fields[field];
    if (typeof text !== "string" || text === "") throw new Error(`${at}: ${field} must be a non-empty string`);
  }
  if (!forms.includes(String(fields.plantForm))) {
    throw new Error(`${at}: plantForm must be repo-tree, commit-repo, mutation-repo, tracked-tree or workspace`);
  }
  const helperJobs = fields.helperJobs;
  if (helperJobs !== undefined && (!Array.isArray(helperJobs) || !helperJobs.every((job) => typeof job === "string" && job !== ""))) {
    throw new Error(`${at}: helperJobs must be a list of job ids`);
  }
  return value as Gate;
}

/** The registry entries of a gates.json text; throws naming the problem when the text is not a valid registry. */
export function parseRegistry(text: string): readonly Gate[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`gates.json is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("gates.json is not a list of gates");
  const gates: Gate[] = [];
  value.forEach((item: unknown, index) => {
    const at = `gate ${String(index + 1)} of gates.json`;
    const gate = entry(item, at);
    if (gates.some((known) => known.id === gate.id)) throw new Error(`${at}: id ${gate.id} is listed twice`);
    gates.push(gate);
  });
  return gates;
}

/** The job ids of a GitHub Actions workflow text, in order: the keys one level below the top-level `jobs:`. */
export function ciJobs(workflow: string): string[] {
  const jobs: string[] = [];
  let indent: number | undefined;
  let inJobs = false;
  for (const line of workflow.split(/\r?\n/)) {
    if (/^\s*(?:#.*)?$/.test(line)) continue;
    const depth = line.search(/\S/);
    if (depth === 0) {
      inJobs = /^jobs:\s*$/.test(line);
      continue;
    }
    if (!inJobs) continue;
    indent ??= depth;
    const key = /^ *(['"]?)([\w-]+)\1:/.exec(line);
    if (depth === indent && key !== null) jobs.push(String(key[2]));
  }
  return jobs;
}

/** What the registry check compares, and where each part came from (finding locations). */
export interface RegistryInput {
  readonly registry: readonly Gate[];
  readonly registryPath: string;
  readonly jobs: readonly string[];
  readonly workflowPath: string;
}

/** One finding per gate id missing from the registry, the workflow's gate jobs or the FR-020 list. */
export function checkRegistry(input: RegistryInput): Finding[] {
  const registered = new Set(input.registry.map((gate) => gate.id));
  const helpers = new Set([...input.registry.flatMap((gate) => gate.helperJobs), ...plantHelperJobs]);
  const gateJobs = new Set(input.jobs.filter((job) => job !== plantJob && !helpers.has(job)));
  const listed = new Set(fr020);
  const finding = (path: string, rule: string, message: string): Finding => ({ location: { path }, gate: "plants", rule, message });
  const findings: Finding[] = [];
  for (const id of [...new Set([...registered, ...gateJobs, ...listed])].sort()) {
    if (!registered.has(id)) findings.push(finding(input.registryPath, "no-registry-entry", `gate ${id} has no registry entry`));
    if (!gateJobs.has(id)) findings.push(finding(input.workflowPath, "no-ci-job", `gate ${id} has no CI job`));
    if (!listed.has(id)) findings.push(finding("gates/lib/registry.ts", "not-fr-020", `gate ${id} is not an FR-020 gate`));
  }
  return findings;
}

/** The lines below each job key of a workflow (a key at indent 2 after an unindented key), by job id. */
function jobLines(workflow: string): Map<string, string[]> {
  const jobs = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of workflow.split(/\r?\n/)) {
    // A line at indent 0 to 2 starts a top-level key or a job; the lines below a job's key are its own.
    if (!/^ {0,2}\S/.test(line)) {
      current?.push(line);
      continue;
    }
    const key = line.startsWith("  ") ? /^(['"]?)([\w-]+)\1:/.exec(line.slice(2)) : null;
    if (key === null) {
      current = undefined;
      continue;
    }
    const id = String(key[2]);
    // Stryker disable next-line ArrayDeclaration: equivalent, a job's lines start empty, and a placeholder line holds neither --skip-container nor --shard or --plan
    current = jobs.get(id) ?? [];
    jobs.set(id, current);
  }
  return jobs;
}

/**
 * A finding for each of the three plant jobs (plants-plan, plants-shard, plants) a step of which passes
 * `--skip-container` (006 research.md R-07, plan decision 23).
 */
export function skipContainerFindings(workflow: string, workflowPath: string): Finding[] {
  const jobs = jobLines(workflow);
  const passes = (job: string): boolean => {
    // Stryker disable next-line ArrayDeclaration: equivalent, a job's lines start empty, and a placeholder line holds neither --skip-container nor --shard or --plan
    const lines = jobs.get(job) ?? [];
    return lines.some((line) => line.includes("--skip-container"));
  };
  return [...plantHelperJobs, plantJob]
    .filter(passes)
    .map((job) => ({ location: { path: workflowPath }, gate: "plants", rule: "skip-container-in-ci", message: `the ${job} job passes --skip-container, so CI would not run the visual plants` }));
}

/** A finding when a step of the plants job (the Plants check) passes `--shard` or `--plan` (plan decision 23). */
export function shardInPlantCheckFindings(workflow: string, workflowPath: string): Finding[] {
  // Stryker disable next-line ArrayDeclaration: equivalent, a job's lines start empty, and a placeholder line holds neither --skip-container nor --shard or --plan
  const partial = (jobLines(workflow).get(plantJob) ?? []).some((line) => /--(?:shard|plan)\b/.test(line));
  return partial ? [{ location: { path: workflowPath }, gate: "plants", rule: "shard-in-plant-check", message: "the plants job passes --shard or --plan, so the Plants check would judge one shard or none" }] : [];
}

/**
 * A finding for each of the three plant jobs (plants-plan, plants-shard, plants) a step of which passes `--affected`
 * (op 016, spec.md OR-004): the required Plants check judges every plant, never a diff's selection.
 */
export function affectedInCiFindings(workflow: string, workflowPath: string): Finding[] {
  const jobs = jobLines(workflow);
  // Stryker disable next-line ArrayDeclaration: equivalent, a job's lines start empty, and a placeholder line holds no --affected
  const passes = (job: string): boolean => (jobs.get(job) ?? []).some((line) => line.includes("--affected"));
  return [...plantHelperJobs, plantJob]
    .filter(passes)
    .map((job) => ({ location: { path: workflowPath }, gate: "plants", rule: "affected-in-ci", message: `the ${job} job passes --affected, so CI would judge only the plants a diff selects` }));
}
