export const ciWorkflow = ".github/workflows/ci.yml";
export const visualJob = "Visual regression";
const safeguards = ["Sign-off", "Sandbox paths"];
const requiredJobs = [
  "Typecheck", "Code lint", "Style lint", "Unit tests", "Test lint", "Mutation testing",
  "Content security", "Prefix", "Story config copies", "Install and pins", ...safeguards,
  "Contrast", "Brand rules", "Custom-elements manifest", "Storybook build", visualJob,
  "Accessibility", "Plants",
];
const mandatoryHelpers = ["Unit test inventory", "Mutation plan", "Plants plan"];
const unitComparison = "Unit tests full suite comparison";
export const revision = /^[0-9a-f]{40}$/;
export const digest = /^sha256:[0-9a-f]{64}$/;
export const toolVersion = /^\d+\.\d+\.\d+(?:[.+~:-][\w.+~:-]+)?$/;
export const reviewPath = /^(?:ops|specs)\/\d{3}-[a-z0-9]+(?:-[a-z0-9]+)*\/reviews\/(?:phase-[1-9]\d*|landing)\/round-[1-9]\d*(?:-fixes)?\.md$/;

export interface Attempt {
  readonly runId: number;
  readonly attempt: number;
}

export interface Candidate extends Attempt {
  readonly head: string;
  readonly base: string;
  readonly merge: string;
}

export interface HostedRun {
  readonly repository: string;
  readonly headRepository: string;
  readonly pullRequests: readonly number[];
  readonly workflowId: number;
  readonly workflowPath: string;
  readonly event: string;
  readonly id: number;
  readonly attempt: number;
  readonly head: string;
  readonly testedMerge: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly startedAt: string;
}

export interface Job {
  readonly id: number;
  readonly name: string;
  readonly runId: number;
  readonly attempt: number;
  readonly head: string;
  readonly status: string;
  readonly conclusion: string | null;
  readonly startedAt: string;
  readonly completedAt: string;
}

export interface VisualRuntime {
  readonly pinRecord: { readonly jobId: number; readonly artifactId: number; readonly manifestDigest: string; readonly platform: string; readonly skopeoVersion: string };
  readonly runnerSetup: { readonly jobId: number; readonly image: string; readonly version: string; readonly architecture: string };
  readonly tools: { readonly jobId: number; readonly docker: string; readonly podman: string; readonly node: string; readonly pnpm: string };
}

export interface RunEvidence {
  readonly run: HostedRun;
  readonly mergeCommit: { readonly sha: string; readonly tree: string; readonly parents: readonly string[] };
  readonly jobs: { readonly totalCount: number; readonly rows: readonly Job[] } | null;
  readonly visualInputs: string | null;
  readonly runtime: VisualRuntime | null;
}

export interface RunMatch {
  readonly expected: Candidate;
  readonly evidence: RunEvidence;
}

export interface TreeChange {
  readonly path: string;
  readonly beforeMode: string | null;
  readonly afterMode: string | null;
}

export interface Observation {
  readonly repository: string;
  readonly pullRequest: number;
  readonly workflowId: number;
  readonly prior: RunMatch;
  readonly current: RunMatch;
  readonly treeDiff: {
    readonly priorTree: string;
    readonly currentTree: string;
    readonly changes: readonly TreeChange[];
  } | null;
}

type Reason = "matched" | "provenance" | "lineage" | "jobs" | "safeguards" | "runtime" | "inputs" | "paths";
export interface Eligibility {
  readonly eligible: boolean;
  readonly reason: Reason;
}

export function positiveInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

function trustedRun(input: Observation, match: RunMatch): boolean {
  const { expected, evidence: { run } } = match;
  return positiveInteger(expected.runId) && positiveInteger(expected.attempt) &&
    run.repository === input.repository && run.headRepository === input.repository &&
    run.pullRequests.length === 1 && run.pullRequests[0] === input.pullRequest &&
    run.workflowId === input.workflowId && run.workflowPath === ciWorkflow && run.event === "pull_request" &&
    run.id === expected.runId && run.attempt === expected.attempt && run.status === "completed" &&
    Number.isFinite(Date.parse(run.startedAt));
}

function exactMerge({ expected, evidence: { run, mergeCommit } }: RunMatch): boolean {
  return [expected.head, expected.base, expected.merge, mergeCommit.tree].every((sha) => revision.test(sha)) &&
    run.head === expected.head && run.testedMerge === expected.merge && mergeCommit.sha === expected.merge &&
    mergeCommit.parents.length === 2 && mergeCommit.parents[0] === expected.base && mergeCommit.parents[1] === expected.head;
}

function freshSuccess(job: Job, run: HostedRun): boolean {
  const started = Date.parse(job.startedAt);
  return job.conclusion === "success" && started >= Date.parse(run.startedAt) && Date.parse(job.completedAt) >= started;
}

function sameAttempt(job: Job, run: HostedRun): boolean {
  return job.runId === run.id && job.attempt === run.attempt && job.head === run.head && job.status === "completed";
}

function hasFreshSafeguards({ run, jobs }: RunEvidence): boolean {
  return jobs !== null && safeguards.every((name) => {
    const matches = jobs.rows.filter((job) => job.name === name);
    const job = matches[0];
    return matches.length === 1 && job !== undefined && sameAttempt(job, run) && freshSuccess(job, run);
  });
}

function expectedJob(name: string): boolean {
  return requiredJobs.includes(name) || mandatoryHelpers.includes(name) || name === unitComparison ||
    name === "Mutation shard" ||
    /^(?:Unit test|Plants) shard \((?:0|[1-9]\d*)\)$/.test(name) ||
    /^Mutation shard \([^\r\n]+, [1-9]\d*\)$/.test(name) ||
    // Actions truncates long matrix job names to 100 characters. Collisions still fail the uniqueness check.
    name.length === 100 && /^Mutation shard \([^\r\n]+\.\.\.$/.test(name);
}

function completeJobs({ jobs, run }: RunEvidence): boolean {
  if (jobs === null || jobs.totalCount !== jobs.rows.length) return false;
  const names = new Set(jobs.rows.map(({ name }) => name));
  const ids = new Set(jobs.rows.map(({ id }) => id));
  return names.size === jobs.rows.length && ids.size === jobs.rows.length &&
    [...requiredJobs, ...mandatoryHelpers, unitComparison].every((name) => names.has(name)) &&
    jobs.rows.some(({ name }) => name.startsWith("Unit test shard (")) &&
    jobs.rows.some(({ name }) => name.startsWith("Plants shard (")) &&
    jobs.rows.some(({ name }) => name === "Mutation shard" || name.startsWith("Mutation shard (")) &&
    jobs.rows.every((job) =>
      positiveInteger(job.id) && expectedJob(job.name) && sameAttempt(job, run) &&
      ((job.name === unitComparison || job.name === "Mutation shard") && job.conclusion === "skipped" || freshSuccess(job, run)));
}

function runtimeFingerprint({ jobs, runtime }: RunEvidence): readonly string[] | undefined {
  const job = jobs?.rows.find(({ name }) => name === visualJob);
  if (runtime === null || job === undefined) return undefined;
  const { pinRecord, runnerSetup, tools } = runtime;
  if ([pinRecord.jobId, runnerSetup.jobId, tools.jobId].some((id) => id !== job.id) ||
    !positiveInteger(pinRecord.artifactId) || !digest.test(pinRecord.manifestDigest) ||
    pinRecord.platform !== "linux/amd64" || runnerSetup.image !== "ubuntu-24.04" ||
    runnerSetup.architecture !== "X64" || !/^\d{8}\.\d+\.\d+$/.test(runnerSetup.version) ||
    ![tools.docker, tools.podman, tools.node, tools.pnpm, pinRecord.skopeoVersion].every((version) => toolVersion.test(version))) return undefined;
  return [pinRecord.manifestDigest, pinRecord.platform, pinRecord.skopeoVersion, runnerSetup.image,
    runnerSetup.version, runnerSetup.architecture, tools.docker, tools.podman, tools.node, tools.pnpm];
}

function allowedChanges(changes: readonly TreeChange[]): boolean {
  return changes.length > 0 && new Set(changes.map(({ path }) => path)).size === changes.length &&
    changes.every(({ path, beforeMode, afterMode }) =>
      reviewPath.test(path) && (beforeMode === "100644" || beforeMode === null) &&
      (afterMode === "100644" || afterMode === null) && (beforeMode !== null || afterMode !== null));
}

/** Assess already collected evidence for one candidate pair. The verdict has no effect on required checks. */
export function assessEvidenceReuse(input: Observation): Eligibility {
  const { prior, current, treeDiff } = input;
  if (!positiveInteger(input.pullRequest) || !positiveInteger(input.workflowId) ||
    !trustedRun(input, prior) || !trustedRun(input, current) ||
    prior.expected.runId === current.expected.runId || prior.evidence.run.conclusion !== "success") {
    return { eligible: false, reason: "provenance" };
  }
  if (!exactMerge(prior) || !exactMerge(current) || prior.expected.base !== current.expected.base ||
    prior.expected.head === current.expected.head || prior.expected.merge === current.expected.merge ||
    Date.parse(prior.evidence.run.startedAt) >= Date.parse(current.evidence.run.startedAt) ||
    treeDiff !== null && (treeDiff.priorTree !== prior.evidence.mergeCommit.tree || treeDiff.currentTree !== current.evidence.mergeCommit.tree)) {
    return { eligible: false, reason: "lineage" };
  }
  if (!hasFreshSafeguards(current.evidence)) return { eligible: false, reason: "safeguards" };
  if (!completeJobs(prior.evidence) || !completeJobs(current.evidence) || current.evidence.run.conclusion !== "success") {
    return { eligible: false, reason: "jobs" };
  }
  if (treeDiff === null || !allowedChanges(treeDiff.changes)) return { eligible: false, reason: "paths" };
  const priorInputs = prior.evidence.visualInputs;
  if (priorInputs === null || !digest.test(priorInputs) || priorInputs !== current.evidence.visualInputs) {
    return { eligible: false, reason: "inputs" };
  }
  const before = runtimeFingerprint(prior.evidence);
  const after = runtimeFingerprint(current.evidence);
  if (before === undefined || after === undefined || before.some((value, index) => value !== after[index])) {
    return { eligible: false, reason: "runtime" };
  }
  return { eligible: true, reason: "matched" };
}
