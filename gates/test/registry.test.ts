import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Finding } from "../lib/findings.ts";
import { checkRegistry, ciJobs, fr020, parseRegistry, plantJob, skipContainerFindings } from "../lib/registry.ts";
import type { Gate } from "../lib/registry.ts";

// The registry check of the plant job (research.md R-10, data-model.md § Gate): the gate ids of gates.json, the gate
// jobs of ci.yml (every job but the plant job and the registry's helper jobs) and the FR-020 list must be the same
// set; each id missing from one of them is one finding. Inputs: gates/test/fixtures/registry/.
const registryText = readFileSync(new URL("fixtures/registry/gates.json", import.meta.url), "utf8");
const workflow = readFileSync(new URL("fixtures/registry/ci.yml", import.meta.url), "utf8");
const ids = ["typecheck", "lint", "style-lint", "unit-tests", "test-lint", "mutation", "csp", "prefix", "config-copies", "pins", "signoff", "contrast", "brand-rules", "storybook-build", "visual"];

function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate: "plants", rule, message };
}

describe("fr020 and plantJob", () => {
  it("lists the fifteen gates of FR-020 (002 FR-020: contrast and brand-rules added; 006 FR-017: storybook-build and visual), and names the plant job plants", () => {
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
    expect(checkRegistry({ registry: [], jobs: [], ...paths })).toHaveLength(30);
  });
});

// The repository's own registry, workflow and FR-020 list (002 FR-020, FR-022; contracts/gates.md § Plants,
// "Registry"): the contrast and brand-rules gates are registered with their checks and repo-tree plant commands, have
// CI jobs of the same shape as the other gate jobs, and the plant job's registry check finds the three sets equal.
describe("the repository's registry (002 FR-020)", () => {
  const real = parseRegistry(readFileSync(new URL("../gates.json", import.meta.url), "utf8"));
  const realWorkflow = readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8");

  it("registers contrast and brand-rules as repo-tree gates with the checks Contrast and Brand rules", () => {
    const pick = (id: string): Partial<Gate> | undefined => {
      const gate = real.find((g) => g.id === id);
      return gate === undefined ? undefined : { id: gate.id, check: gate.check, command: gate.command, plantCommand: gate.plantCommand, plantForm: gate.plantForm };
    };
    expect([pick("contrast"), pick("brand-rules")]).toEqual([
      { id: "contrast", check: "Contrast", command: "pnpm run gate:contrast", plantCommand: "node gates/bin/contrast.ts --root {root}", plantForm: "repo-tree" },
      { id: "brand-rules", check: "Brand rules", command: "pnpm run gate:brand-rules", plantCommand: "node gates/bin/brand-rules.ts --root {root}", plantForm: "repo-tree" },
    ]);
  });

  it("matches the workflow's gate jobs and the FR-020 list, fifteen gates", () => {
    expect(checkRegistry({ registry: real, registryPath: "gates/gates.json", jobs: ciJobs(realWorkflow), workflowPath: ".github/workflows/ci.yml" })).toEqual([]);
    expect(real.map((gate) => gate.id)).toEqual(ids);
  });

  // 006 FR-017 (contracts/gates.md § `storybook-build`): the Storybook build gate is a repo-tree gate with the check
  // "Storybook build", its plant command running the gate on the plant root.
  it("registers storybook-build as a repo-tree gate with the check Storybook build", () => {
    const gate = real.find((g) => g.id === "storybook-build");
    expect(gate === undefined ? undefined : { id: gate.id, check: gate.check, command: gate.command, plantCommand: gate.plantCommand, plantForm: gate.plantForm }).toEqual({
      id: "storybook-build",
      check: "Storybook build",
      command: "pnpm run gate:storybook-build",
      plantCommand: "node gates/bin/storybook-build.ts --root {root}",
      plantForm: "repo-tree",
    });
  });

  // 006 FR-017 (contracts/gates.md § `visual`): the visual gate is a repo-tree gate with the check "Visual regression",
  // run in CI under both engines; its plant command passes the plant's engine (research.md R-06).
  it("registers visual as a repo-tree gate with the check Visual regression, its plant command taking {engine}", () => {
    const gate = real.find((g) => g.id === "visual");
    expect(gate === undefined ? undefined : { id: gate.id, check: gate.check, command: gate.command, plantCommand: gate.plantCommand, plantForm: gate.plantForm }).toEqual({
      id: "visual",
      check: "Visual regression",
      command: "pnpm run gate:visual -- --engine both",
      plantCommand: "node gates/bin/visual.ts --root {root} --engine {engine}",
      plantForm: "repo-tree",
    });
  });

  it("gives each new gate a CI job named after its check that runs its command, like the other gate jobs", () => {
    const job = (id: string): string[] => {
      const lines = realWorkflow.split("\n");
      const start = lines.indexOf(`  ${id}:`);
      const end = lines.findIndex((line, index) => index > start && /^ {2}[\w-]+:/.test(line));
      return lines.slice(start, end);
    };
    const shape = (id: string, name: string, command: string): string[] => [
      `  ${id}:`,
      `    name: ${name}`,
      "    runs-on: ubuntu-24.04",
      "    steps:",
      "      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1",
      "        with:",
      "          persist-credentials: false",
      "      - uses: ./.github/actions/setup",
      `      - run: ${command}`,
    ];
    expect(job("config-copies")).toEqual(shape("config-copies", "Story config copies", "pnpm run gate:config-copies"));
    expect(job("contrast")).toEqual(shape("contrast", "Contrast", "pnpm run gate:contrast"));
    expect(job("brand-rules")).toEqual(shape("brand-rules", "Brand rules", "pnpm run gate:brand-rules"));
    expect(job("storybook-build")).toEqual(shape("storybook-build", "Storybook build", "pnpm run gate:storybook-build"));
  });
});

// 006 FR-018 and research.md R-07: the plant job's `--skip-container` runs a partial job without the visual plants, so
// the registry check fails when the Plants job of ci.yml passes it; any other job may.
describe("skipContainerFindings (006 FR-018)", () => {
  const plantsJob = (run: string): string => `jobs:\n  lint:\n    steps:\n      - run: pnpm run gate:lint\n  plants:\n    name: Plants\n    steps:\n      - uses: ./.github/actions/setup\n${run}\n  after:\n    steps:\n      - run: echo done\n`;
  const found = (path: string): Finding => ({
    location: { path },
    gate: "plants",
    rule: "skip-container-in-ci",
    message: "the plants job passes --skip-container, so CI would not run the visual plants",
  });

  it("finds --skip-container in any step of the plants job, a block or a later line included", () => {
    expect(skipContainerFindings(plantsJob("      - run: pnpm run gate:plants -- --skip-container"), "ci.yml")).toEqual([found("ci.yml")]);
    expect(skipContainerFindings(plantsJob("      - env:\n          X: 1\n        run: |\n          echo start\n          pnpm run gate:plants -- --skip-container"), ".github/workflows/ci.yml")).toEqual([
      found(".github/workflows/ci.yml"),
    ]);
  });

  it("reads the plants job by its key at the job indent, quoted or not, wherever it stands", () => {
    const deeper = "jobs:\n  lint:\n    plants:\n      - run: pnpm run gate:plants -- --skip-container\n  plants:\n    steps:\n      - run: pnpm run gate:plants\n";
    expect(skipContainerFindings(deeper, "ci.yml")).toEqual([]);
    expect(skipContainerFindings("jobs:\n  'plants':\n    steps:\n      - run: pnpm run gate:plants -- --skip-container\n", "ci.yml")).toEqual([found("ci.yml")]);
    expect(skipContainerFindings("jobs:\n  plants:\n    steps:\n      - run: pnpm run gate:plants -- --skip-container\nenv:\n  X: --skip-container\n", "ci.yml")).toEqual([found("ci.yml")]);
    expect(skipContainerFindings("jobs:\n  plants:\n    steps:\n      - run: pnpm run gate:plants\nenv:\n  X: --skip-container\n", "ci.yml")).toEqual([]);
    expect(skipContainerFindings("xxplants:\n    run: pnpm run gate:plants -- --skip-container\njobs:\n  xplants:\n    steps:\n      - run: pnpm run gate:plants -- --skip-container\n", "ci.yml")).toEqual([]);
    expect(skipContainerFindings("    run: pnpm run gate:plants -- --skip-container\njobs:\n  plants:\n    steps: []\n", "ci.yml")).toEqual([]);
  });

  it("finds nothing in a plants job without it, or when only another job passes it", () => {
    expect(skipContainerFindings(plantsJob("      - run: pnpm run gate:plants"), "ci.yml")).toEqual([]);
    expect(skipContainerFindings(plantsJob("      - run: pnpm run gate:plants").replace("echo done", "pnpm run gate:plants -- --skip-container"), "ci.yml")).toEqual([]);
    expect(skipContainerFindings(readFileSync(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8"), ".github/workflows/ci.yml")).toEqual([]);
  });
});
