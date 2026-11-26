import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const repository = "Ocelle-HQ/ocelle-components";
const pullRequest = 102;
const workflowId = 271438061;
const ciWorkflow = ".github/workflows/ci.yml";
const requiredJobs = [
  "Typecheck", "Code lint", "Style lint", "Unit tests", "Test lint", "Mutation testing",
  "Content security", "Prefix", "Story config copies", "Install and pins", "Sign-off",
  "Contrast", "Brand rules", "Custom-elements manifest", "Storybook build", "Visual regression",
  "Accessibility", "Sandbox paths", "Plants",
];
const helperJobs = [
  "Unit test inventory", "Unit test shard (1)", "Unit tests full suite comparison", "Mutation plan",
  "Mutation shard (packages/elements/src/ocelle-pane.ts:12-18, 1)", "Plants plan", "Plants shard (1)",
];

interface Candidate {
  runId: number;
  attempt: number;
  head: string;
  base: string;
  merge: string;
}

interface HostedRun {
  repository: string;
  headRepository: string;
  pullRequests: number[];
  workflowId: number;
  workflowPath: string;
  event: string;
  id: number;
  attempt: number;
  head: string;
  testedMerge: string;
  status: string;
  conclusion: string | null;
  startedAt: string;
}

interface Job {
  id: number;
  name: string;
  runId: number;
  attempt: number;
  head: string;
  status: string;
  conclusion: string | null;
  startedAt: string;
  completedAt: string;
}

interface VisualRuntime {
  pinRecord: { jobId: number; artifactId: number; manifestDigest: string; platform: string; skopeoVersion: string };
  runnerSetup: { jobId: number; image: string; version: string; architecture: string };
  tools: { jobId: number; docker: string; podman: string; node: string; pnpm: string };
}

interface RunEvidence {
  run: HostedRun;
  mergeCommit: { sha: string; tree: string; parents: string[] };
  jobs: { totalCount: number; rows: Job[] } | null;
  visualInputs: string | null;
  runtime: VisualRuntime | null;
}

interface Observation {
  repository: string;
  pullRequest: number;
  workflowId: number;
  prior: { expected: Candidate; evidence: RunEvidence };
  current: { expected: Candidate; evidence: RunEvidence };
  treeDiff: {
    priorTree: string;
    currentTree: string;
    changes: { path: string; beforeMode: string | null; afterMode: string | null }[];
  } | null;
}

type Eligibility = { eligible: boolean; reason: string };
type Assess = (input: Observation) => Eligibility;

const shadowModule = new URL("../bin/evidence-reuse-shadow.ts", import.meta.url);
async function assess(input: Observation): Promise<Eligibility | undefined> {
  // On the red base the checker has no result. When present, import and execution errors still propagate.
  if (!existsSync(shadowModule)) return undefined;
  const { assessEvidenceReuse } = await import(shadowModule.href) as { assessEvidenceReuse: Assess };
  return assessEvidenceReuse(input);
}

const sha = (digit: string): string => digit.repeat(40);
const digest = (digit: string): string => `sha256:${digit.repeat(64)}`;

function namedJobs(run: HostedRun): Job[] {
  return [...requiredJobs, ...helperJobs].map((name, index) => ({
    id: run.id * 100 + index + 1,
    name,
    runId: run.id,
    attempt: run.attempt,
    head: run.head,
    status: "completed",
    conclusion: name === "Unit tests full suite comparison" ? "skipped" : "success",
    startedAt: run.startedAt,
    completedAt: run.startedAt.replace("10:00:00", "10:10:00"),
  }));
}

function runtime(run: HostedRun): VisualRuntime {
  const jobId = run.id * 100 + requiredJobs.indexOf("Visual regression") + 1;
  return {
    pinRecord: { jobId, artifactId: run.id * 10, manifestDigest: digest("b"), platform: "linux/amd64", skopeoVersion: "1.18.0" },
    runnerSetup: { jobId, image: "ubuntu-24.04", version: "20261122.23.1", architecture: "X64" },
    tools: { jobId, docker: "28.0.4", podman: "4.9.3+ds1-1ubuntu0.2", node: "26.13.0", pnpm: "12.16.1" },
  };
}

function completed(expected: Candidate, tree: string, startedAt: string): RunEvidence {
  const run: HostedRun = {
    repository, headRepository: repository, pullRequests: [pullRequest], workflowId, workflowPath: ciWorkflow,
    event: "pull_request", id: expected.runId, attempt: expected.attempt, head: expected.head, testedMerge: expected.merge,
    status: "completed", conclusion: "success", startedAt,
  };
  const rows = namedJobs(run);
  return {
    run,
    mergeCommit: { sha: expected.merge, tree, parents: [expected.base, expected.head] },
    jobs: { totalCount: rows.length, rows },
    visualInputs: digest("a"),
    runtime: runtime(run),
  };
}

function observation(): Observation {
  const base = sha("1");
  const prior = { runId: 45320000001, attempt: 2, head: sha("2"), base, merge: sha("3") };
  const current = { runId: 45320000401, attempt: 1, head: sha("4"), base, merge: sha("5") };
  const priorTree = sha("6");
  const currentTree = sha("7");
  return {
    repository, pullRequest, workflowId,
    prior: { expected: prior, evidence: completed(prior, priorTree, "2026-11-24T10:00:00Z") },
    current: { expected: current, evidence: completed(current, currentTree, "2026-11-25T10:00:00Z") },
    treeDiff: { priorTree, currentTree, changes: [
      { path: "ops/034-workflow-pilots/reviews/phase-1/round-1-fixes.md", beforeMode: "100644", afterMode: "100644" },
      { path: "specs/033-pane-step-indicator/reviews/landing/round-2.md", beforeMode: null, afterMode: "100644" },
    ] },
  };
}

function changeJobs(evidence: RunEvidence, change: (rows: Job[]) => Job[]): void {
  const rows = change(namedJobs(evidence.run));
  evidence.jobs = { totalCount: rows.length, rows };
}

function patchJob(evidence: RunEvidence, name: string, patch: Partial<Job>): void {
  changeJobs(evidence, (rows) => rows.map((job) => job.name === name ? { ...job, ...patch } : job));
}

describe("evidence reuse shadow eligibility", () => {
  it("observes a match for the exact successful Visual attempts across review-evidence-only changes", async () => {
    const input = observation();
    changeJobs(input.current.evidence, (rows) => rows.reverse());
    expect(await assess(input)).toMatchObject({ eligible: true, reason: "matched" });
  });

  it.each<{ label: string; patch: Partial<HostedRun> }>([
    { label: "repository", patch: { repository: "Other/ocelle-components" } },
    { label: "head repository", patch: { headRepository: "Fork/ocelle-components" } },
    { label: "PR number", patch: { pullRequests: [103] } },
    { label: "ambiguous PR linkage", patch: { pullRequests: [102, 103] } },
    { label: "workflow path", patch: { workflowPath: ".github/workflows/cache.yml" } },
    { label: "workflow identity", patch: { workflowId: 271438062 } },
    { label: "event", patch: { event: "push" } },
    { label: "run identity", patch: { id: 45320000002 } },
    { label: "run attempt", patch: { attempt: 1 } },
    { label: "run completion", patch: { status: "in_progress", conclusion: null } },
    { label: "run success", patch: { conclusion: "failure" } },
  ])("rejects wrong or unverifiable prior $label", async ({ patch }) => {
    const input = observation();
    Object.assign(input.prior.evidence.run, patch);
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "provenance" });
  });

  it("rejects a current run at a different attempt than the one requested", async () => {
    const input = observation();
    input.current.evidence.run.attempt = 2;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "provenance" });
  });

  it("rejects a run at a different prior PR head", async () => {
    const input = observation();
    input.prior.evidence.run.head = sha("8");
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "lineage" });
  });

  it("rejects a different tested merge even when the resolved candidate has the expected parents", async () => {
    const input = observation();
    input.current.evidence.run.testedMerge = sha("8");
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "lineage" });
  });

  it.each([
    { label: "a different head parent", parents: [sha("1"), sha("8")] },
    { label: "swapped parents", parents: [sha("2"), sha("1")] },
    { label: "an extra parent", parents: [sha("1"), sha("2"), sha("8")] },
  ])("rejects a prior merge with $label", async ({ parents }) => {
    const input = observation();
    input.prior.evidence.mergeCommit.parents = parents;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "lineage" });
  });

  it("rejects a changed base even when both merges match their own expected parents", async () => {
    const input = observation();
    input.current.expected.base = sha("8");
    input.current.evidence.mergeCommit.parents = [input.current.expected.base, input.current.expected.head];
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "lineage" });
  });

  it("rejects a tree comparison supplied for a different merge tree", async () => {
    const input = observation();
    input.current.evidence.mergeCommit.tree = sha("8");
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "lineage" });
  });

  it.each<{ label: string; change: (evidence: RunEvidence) => void }>([
    { label: "unreadable jobs", change: (evidence) => { evidence.jobs = null; } },
    { label: "an incomplete page set", change: (evidence) => {
      const rows = namedJobs(evidence.run);
      evidence.jobs = { totalCount: rows.length + 1, rows };
    } },
    { label: "one missing required job", change: (evidence) => changeJobs(evidence, (rows) => rows.filter(({ name }) => name !== "Plants")) },
    { label: "two jobs claiming the same required name", change: (evidence) => patchJob(evidence, "Contrast", { name: "Prefix" }) },
    { label: "two jobs claiming the same job ID", change: (evidence) => patchJob(evidence, "Contrast", { id: evidence.run.id * 100 + 1 }) },
    { label: "a job belonging to a different run", change: (evidence) => patchJob(evidence, "Visual regression", { runId: evidence.run.id + 1 }) },
    { label: "a job belonging to a different attempt", change: (evidence) => patchJob(evidence, "Visual regression", { attempt: evidence.run.attempt + 1 }) },
    { label: "a job on a different head", change: (evidence) => patchJob(evidence, "Visual regression", { head: sha("8") }) },
    { label: "a failed required job", change: (evidence) => patchJob(evidence, "Visual regression", { conclusion: "failure" }) },
    { label: "a pending required job", change: (evidence) => patchJob(evidence, "Unit tests", { status: "in_progress", conclusion: null }) },
    { label: "a skipped required job", change: (evidence) => patchJob(evidence, "Typecheck", { conclusion: "skipped" }) },
    { label: "an unknown job conclusion", change: (evidence) => patchJob(evidence, "Mutation testing", { conclusion: "unrecognized" }) },
    { label: "an unrecognized job alongside the required jobs", change: (evidence) => patchJob(evidence, "Plants shard (1)", { name: "Unexpected job" }) },
  ])("rejects the prior attempt with $label", async ({ change }) => {
    const input = observation();
    change(input.prior.evidence);
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "jobs" });
  });

  it.each(["Sign-off", "Sandbox paths"])("requires current %s from the matched attempt", async (name) => {
    const input = observation();
    patchJob(input.current.evidence, name, { attempt: input.current.evidence.run.attempt + 1 });
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "safeguards" });
  });

  it("rejects a current Sign-off row whose timestamps precede the matched attempt", async () => {
    const input = observation();
    patchJob(input.current.evidence, "Sign-off", { startedAt: "2026-11-24T10:00:00Z", completedAt: "2026-11-24T10:10:00Z" });
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "safeguards" });
  });

  it("rejects a current Sandbox paths failure", async () => {
    const input = observation();
    patchJob(input.current.evidence, "Sandbox paths", { conclusion: "failure" });
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "safeguards" });
  });

  it("rejects a missing current safeguard even with successful prior safeguards", async () => {
    const input = observation();
    changeJobs(input.current.evidence, (rows) => rows.filter(({ name }) => name !== "Sandbox paths"));
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "safeguards" });
  });

  it("rejects a failed current Visual regression despite a successful prior result", async () => {
    const input = observation();
    patchJob(input.current.evidence, "Visual regression", { conclusion: "failure" });
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "jobs" });
  });

  it.each<{ label: string; value: string | null }>([
    { label: "different", value: digest("c") },
    { label: "unreadable", value: null },
  ])("rejects $label audited Visual inputs", async ({ value }) => {
    const input = observation();
    input.current.evidence.visualInputs = value;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "inputs" });
  });

  it.each<{ label: string; change: (evidence: VisualRuntime) => void }>([
    { label: "container manifest drift", change: (evidence) => { evidence.pinRecord.manifestDigest = digest("c"); } },
    { label: "container architecture drift", change: (evidence) => { evidence.pinRecord.platform = "linux/arm64"; } },
    { label: "runner image version drift", change: (evidence) => { evidence.runnerSetup.version = "20261123.01.1"; } },
    { label: "runner image family drift", change: (evidence) => { evidence.runnerSetup.image = "ubuntu-22.04"; } },
    { label: "runner architecture drift", change: (evidence) => { evidence.runnerSetup.architecture = "ARM64"; } },
    { label: "Docker drift", change: (evidence) => { evidence.tools.docker = "28.0.5"; } },
    { label: "Podman drift", change: (evidence) => { evidence.tools.podman = "4.9.3+ds1-1ubuntu0.3"; } },
    { label: "skopeo drift", change: (evidence) => { evidence.pinRecord.skopeoVersion = "1.18.1"; } },
    { label: "Node drift", change: (evidence) => { evidence.tools.node = "26.13.1"; } },
    { label: "pnpm drift", change: (evidence) => { evidence.tools.pnpm = "12.16.2"; } },
    { label: "the absence of an immutable engine identity", change: (evidence) => { evidence.tools.docker = ""; } },
    { label: "a pin-record from a different job", change: (evidence) => { evidence.pinRecord.jobId += 1; } },
    { label: "setup metadata from a different job", change: (evidence) => { evidence.runnerSetup.jobId += 1; } },
    { label: "tool evidence from a different job", change: (evidence) => { evidence.tools.jobId += 1; } },
  ])("rejects $label", async ({ change }) => {
    const input = observation();
    const currentRuntime = runtime(input.current.evidence.run);
    change(currentRuntime);
    input.current.evidence.runtime = currentRuntime;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "runtime" });
  });

  it("rejects equally unknown engine identities", async () => {
    const input = observation();
    const priorRuntime = runtime(input.prior.evidence.run);
    const currentRuntime = runtime(input.current.evidence.run);
    priorRuntime.tools.docker = "unknown";
    currentRuntime.tools.docker = "unknown";
    input.prior.evidence.runtime = priorRuntime;
    input.current.evidence.runtime = currentRuntime;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "runtime" });
  });

  it("rejects ambiguous or unreadable Visual runtime evidence", async () => {
    const input = observation();
    input.prior.evidence.runtime = null;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "runtime" });
  });

  it.each([
    "README.md",
    "ops/034-workflow-pilots/plan.md",
    "ops/034-workflow-pilots/reviews/phase-1/notes.md",
    "ops/034-workflow-pilots/reviews/phase-1/base.sha",
    "ops/034-workflow-pilots/reviews/phase-1/fixtures/round-1.md",
    "packages/elements/src/ocelle-pane.ts",
    "storybook/test/unit/render.test.ts",
    "storybook/visual/container.json",
    "gates/plants/manifest/pass-reordered/tree/packages/elements/custom-elements.json",
    "gates/gates.json",
    "pnpm-lock.yaml",
    ".github/workflows/ci.yml",
  ])("rejects a mixed tree comparison that also changes %s", async (path) => {
    const input = observation();
    input.treeDiff?.changes.push({ path, beforeMode: "100644", afterMode: "100644" });
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "paths" });
  });

  it("rejects turning an allowlisted review into a symbolic link", async () => {
    const input = observation();
    input.treeDiff?.changes.push({ path: "ops/034-workflow-pilots/reviews/phase-1/round-2.md", beforeMode: "100644", afterMode: "120000" });
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "paths" });
  });

  it("rejects an unreadable tree comparison", async () => {
    const input = observation();
    input.treeDiff = null;
    expect(await assess(input)).toMatchObject({ eligible: false, reason: "paths" });
  });
});
