import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Finding } from "../lib/findings.ts";
import { checkRegistry, ciJobs, fr020, parseRegistry, plantJob } from "../lib/registry.ts";
import type { Gate } from "../lib/registry.ts";

// The registry check of the plant job (research.md R-10, data-model.md § Gate): the gate ids of gates.json, the gate
// jobs of ci.yml (every job but the plant job and the registry's helper jobs) and the FR-020 list must be the same
// set; each id missing from one of them is one finding. Inputs: gates/test/fixtures/registry/.
const registryText = readFileSync(new URL("fixtures/registry/gates.json", import.meta.url), "utf8");
const workflow = readFileSync(new URL("fixtures/registry/ci.yml", import.meta.url), "utf8");
const ids = ["typecheck", "lint", "style-lint", "unit-tests", "test-lint", "mutation", "csp", "prefix", "config-copies", "pins", "signoff"];

function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate: "plants", rule, message };
}

describe("fr020 and plantJob", () => {
  it("lists the eleven gates of FR-020, and names the plant job plants", () => {
    expect({ fr020, plantJob }).toEqual({ fr020: ids, plantJob: "plants" });
  });
});

describe("parseRegistry", () => {
  it("reads every entry of gates.json", () => {
    const registry = parseRegistry(registryText);
    expect(registry.map((gate) => gate.id)).toEqual(ids);
    expect(registry[5]).toEqual({
      id: "mutation",
      check: "Mutation testing",
      command: "pnpm run gate:mutation",
      plantCommand: "node gates/bin/mutation.ts --root {root}",
      plantForm: "mutation-repo",
      scope: "files",
      helperJobs: ["mutation-plan", "mutation-shard"],
    });
  });

  const entry = { id: "a", check: "A", command: "c", plantCommand: "p", plantForm: "repo-tree", scope: "s" };

  it.each([
    { text: "{", problem: /^gates\.json is not valid JSON/ },
    { text: "{}", problem: /^gates\.json is not a list of gates$/ },
    { text: "[1]", problem: /^gate 1 of gates\.json is not an object$/ },
    { text: JSON.stringify([{ ...entry, id: "" }]), problem: /^gate 1 of gates\.json: id must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, check: 3 }]), problem: /^gate 1 of gates\.json: check must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, command: undefined }]), problem: /^gate 1 of gates\.json: command must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, plantCommand: "" }]), problem: /^gate 1 of gates\.json: plantCommand must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, scope: null }]), problem: /^gate 1 of gates\.json: scope must be a non-empty string$/ },
    { text: JSON.stringify([entry, { ...entry, id: "b", plantForm: "tree" }]), problem: /^gate 2 of gates\.json: plantForm must be repo-tree, commit-repo, mutation-repo or workspace$/ },
    { text: JSON.stringify([{ ...entry, helperJobs: "x" }]), problem: /^gate 1 of gates\.json: helperJobs must be a list of job ids$/ },
    { text: JSON.stringify([{ ...entry, helperJobs: [""] }]), problem: /^gate 1 of gates\.json: helperJobs must be a list of job ids$/ },
    { text: JSON.stringify([entry, entry]), problem: /^gate 2 of gates\.json: id a is listed twice$/ },
  ])("rejects $text", ({ text, problem }) => {
    expect(() => parseRegistry(text)).toThrow(problem);
  });

  it("accepts each plant form", () => {
    const forms = ["repo-tree", "commit-repo", "mutation-repo", "workspace"];
    const text = JSON.stringify(forms.map((plantForm, i) => ({ ...entry, id: String(i), plantForm })));
    expect(parseRegistry(text).map((gate) => gate.plantForm)).toEqual(forms);
  });
});

describe("ciJobs", () => {
  it("lists the job ids of a workflow in order", () => {
    expect(ciJobs(workflow)).toEqual([...ids.slice(0, 5), "mutation-plan", "mutation-shard", ...ids.slice(5), "plants"]);
  });

  it("lists no job when the workflow has none", () => {
    const control = ciJobs("jobs:\n  only:\n    steps: []\n");
    expect([ciJobs("name: CI\non:\n  push:\n"), ciJobs("jobs: {}\n"), control]).toEqual([[], [], ["only"]]);
  });

  it("reads jobs indented by four spaces, and stops at the next top-level key", () => {
    expect(ciJobs("jobs:\n    a:\n        steps: []\n    'b':\n        steps: []\nenv:\n    c: 1\n")).toEqual(["a", "b"]);
  });
});

describe("checkRegistry", () => {
  const registry = parseRegistry(registryText);
  const jobs = ciJobs(workflow);
  const paths = { registryPath: "gates/gates.json", workflowPath: ".github/workflows/ci.yml" };

  it("finds nothing when the three sets match (and one finding when one job is gone)", () => {
    const control = checkRegistry({ registry, jobs: jobs.filter((job) => job !== "lint"), ...paths });
    expect([checkRegistry({ registry, jobs, ...paths }), control.length]).toEqual([[], 1]);
  });

  it("reports a gate without a registry entry", () => {
    const without = registry.filter((gate) => gate.id !== "csp");
    expect(checkRegistry({ registry: without, jobs, ...paths })).toEqual([
      finding("gates/gates.json", "no-registry-entry", "gate csp has no registry entry"),
    ]);
  });

  it("reports a gate without a CI job", () => {
    const without = jobs.filter((job) => job !== "signoff");
    expect(checkRegistry({ registry, jobs: without, ...paths })).toEqual([
      finding(".github/workflows/ci.yml", "no-ci-job", "gate signoff has no CI job"),
    ]);
  });

  it("reports a gate that is not in the FR-020 list, from the registry and from the workflow", () => {
    const extra: Gate = { ...registry[0], id: "extra" } as Gate;
    expect(checkRegistry({ registry: [...registry, extra], jobs: [...jobs, "extra", "other"], ...paths })).toEqual([
      finding("gates/lib/registry.ts", "not-fr-020", "gate extra is not an FR-020 gate"),
      finding("gates/gates.json", "no-registry-entry", "gate other has no registry entry"),
      finding("gates/lib/registry.ts", "not-fr-020", "gate other is not an FR-020 gate"),
    ]);
  });

  it("does not count the plant job or a helper job as a gate, but counts a helper job of no entry", () => {
    const withoutMutation = registry.filter((gate) => gate.id !== "mutation");
    expect(checkRegistry({ registry: withoutMutation, jobs, ...paths })).toEqual([
      finding("gates/gates.json", "no-registry-entry", "gate mutation has no registry entry"),
      finding("gates/gates.json", "no-registry-entry", "gate mutation-plan has no registry entry"),
      finding("gates/lib/registry.ts", "not-fr-020", "gate mutation-plan is not an FR-020 gate"),
      finding("gates/gates.json", "no-registry-entry", "gate mutation-shard has no registry entry"),
      finding("gates/lib/registry.ts", "not-fr-020", "gate mutation-shard is not an FR-020 gate"),
    ]);
  });

  it("reports every gate when the registry and the workflow are empty", () => {
    expect(checkRegistry({ registry: [], jobs: [], ...paths })).toHaveLength(22);
  });
});
