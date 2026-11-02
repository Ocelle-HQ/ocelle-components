// The gate registry (gates/gates.json, data-model.md § Gate) and its check against ci.yml and the FR-020 list
// (research.md R-10). Scaffold: signatures only.
import type { Finding } from "./findings.ts";

/** How a gate's plants are presented to it (contracts/plants.md). */
export type PlantForm = "repo-tree" | "commit-repo" | "mutation-repo" | "workspace";

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
export const fr020: readonly string[] = [];

/** The id of the plant job in ci.yml; it is not a gate. */
export const plantJob = "plants";

/** The registry entries of a gates.json text; throws naming the problem when the text is not a valid registry. */
export function parseRegistry(_text: string): readonly Gate[] {
  return [];
}

/** The job ids of a GitHub Actions workflow text, in order. */
export function ciJobs(_workflow: string): string[] {
  return [];
}

/** What the registry check compares, and where each part came from (finding locations). */
export interface RegistryInput {
  readonly registry: readonly Gate[];
  readonly registryPath: string;
  readonly jobs: readonly string[];
  readonly workflowPath: string;
}

/** One finding per gate id missing from the registry, the workflow's gate jobs or the FR-020 list. */
export function checkRegistry(_input: RegistryInput): Finding[] {
  return [];
}
