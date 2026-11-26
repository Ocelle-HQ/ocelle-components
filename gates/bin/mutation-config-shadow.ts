interface Pins {
  readonly head: string;
  readonly base: string;
  readonly tree: string;
  readonly runtime: string;
}

interface ConfigurationPlan {
  readonly configuration: string;
  readonly selectors: readonly string[];
  readonly ranges: readonly string[];
}

interface ComparisonPlan {
  readonly pins: Pins;
  readonly configurations: readonly ConfigurationPlan[];
}

interface Timing {
  readonly setupMs: number;
  readonly elapsedMs: number;
  readonly retries: number;
  readonly priorAttemptMs: number;
}

interface Baseline {
  readonly tests: number;
  readonly elapsedMs: number;
}

interface ConfigurationReceipt {
  readonly configuration: string;
  readonly baseline: Baseline;
  readonly totalMs: number;
  readonly inventory: readonly string[];
}

interface Job {
  readonly selectors: readonly string[];
  readonly verdict: 0 | 1;
  readonly timing: Timing;
  readonly configurations: readonly ConfigurationReceipt[];
}

type Reason = "receipts" | "provenance" | "selectors" | "configuration" | "ranges" | "mutants" | "timing" | "verdict";
interface Rejection {
  readonly matched: false;
  readonly reason: Reason;
  readonly detail: string;
}

function reject(reason: Reason, detail: string): Rejection {
  return { matched: false, reason, detail };
}

function record(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Readonly<Record<string, unknown>>
    : undefined;
}

function list(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function nonnegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function count(value: unknown): value is number {
  return nonnegative(value) && Number.isSafeInteger(value);
}

function sameMembers(a: readonly unknown[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const members = new Set(a);
  return members.size === b.length && b.every((member) => members.delete(member));
}

function position(value: unknown): { readonly line: number; readonly column: number } | undefined {
  const point = record(value);
  if (!count(point?.line) || point.line === 0 || !count(point.column)) return undefined;
  return { line: point.line, column: point.column };
}

// Match completed statuses from the standard mutation gate. Its exit code also covers equivalent-record findings.
const passingStatuses = new Set(["Killed", "Timeout", "RuntimeError", "CompileError", "Ignored"]);
const failingStatuses = new Set(["Survived", "NoCoverage"]);

function withinRanges(path: string, start: number, end: number, ranges: readonly string[]): boolean {
  return ranges.some((range) => {
    const bounds = /^(.*):(\d+)-(\d+)$/.exec(range);
    return bounds?.[1] === path && start <= Number(bounds[3]) && end >= Number(bounds[2]);
  });
}

function readInventory(value: unknown, ranges: readonly string[]) {
  if (!list(value) || value.length === 0) return undefined;
  const statuses = new Map<string, string>();
  let hasSurvivor = false;
  for (const entry of value) {
    const mutant = record(entry);
    const location = record(mutant?.location);
    const start = position(location?.start);
    const end = position(location?.end);
    if (typeof mutant?.path !== "string" || typeof mutant.mutatorName !== "string" || mutant.mutatorName === "" ||
      (mutant.replacement !== undefined && typeof mutant.replacement !== "string") || typeof mutant.status !== "string" ||
      start === undefined || end === undefined || start.line > end.line ||
      (start.line === end.line && start.column > end.column) ||
      !withinRanges(mutant.path, start.line, end.line, ranges)) return undefined;

    const failed = failingStatuses.has(mutant.status);
    if (!failed && !passingStatuses.has(mutant.status)) return undefined;
    hasSurvivor ||= failed;
    const identity = JSON.stringify([mutant.path, start, end, mutant.mutatorName, mutant.replacement]);
    if (statuses.has(identity)) return { duplicate: identity };
    statuses.set(identity, mutant.status);
  }
  return { identities: [...statuses].map((entry) => JSON.stringify(entry)).sort(), hasSurvivor };
}

function reviewJob(value: unknown, plans: readonly ConfigurationPlan[], pins: Pins, description: string): Job | Rejection {
  const job = record(value);
  const receipts = job?.receipts;
  const selectors = plans.flatMap((plan) => plan.selectors);
  if (!list(receipts) || receipts.length !== plans.length) return reject("receipts", `${description}: missing or duplicate receipts`);
  const observedPins = record(job?.pins);
  if (observedPins === undefined || Object.entries(pins).some(([key, expected]) => observedPins[key] !== expected)) {
    return reject("provenance", `${description}: source or runtime differs from the pinned comparison`);
  }
  if (!list(job?.selectors) || !sameMembers(job.selectors, selectors)) {
    return reject("selectors", `${description}: standard selectors differ from the pinned selection`);
  }
  if (job.verdict !== 0 && job.verdict !== 1) return reject("verdict", `${description}: standard gate did not complete`);
  const timing = record(job.timing);
  if (!nonnegative(timing?.setupMs) || !nonnegative(timing.elapsedMs) || !count(timing.retries) ||
    !nonnegative(timing.priorAttemptMs) || (timing.retries === 0 && timing.priorAttemptMs !== 0)) {
    return reject("timing", `${description}: job timing is incomplete`);
  }

  const configurations: ConfigurationReceipt[] = [];
  for (const plan of plans) {
    const label = `${description} (${plan.configuration})`;
    const matches = receipts.map(record).filter((receipt) => receipt?.configuration === plan.configuration);
    if (matches.length > 1) return reject("receipts", `${label}: duplicate configuration receipt`);
    const receipt = matches[0];
    if (receipt === undefined) return reject("configuration", `${label}: expected its own configuration receipt`);
    if (!list(receipt.ranges) || !sameMembers(receipt.ranges, plan.ranges)) {
      return reject("ranges", `${label}: changed ranges differ from the pinned selection`);
    }
    const baseline = record(receipt.baseline);
    if (!count(baseline?.tests) || baseline.tests === 0 || !nonnegative(baseline.elapsedMs) || baseline.elapsedMs === 0 ||
      !nonnegative(receipt.totalMs) || receipt.totalMs < baseline.elapsedMs) {
      return reject("timing", `${label}: baseline or mutation time is incomplete`);
    }
    const inventory = readInventory(receipt.mutants, plan.ranges);
    if (inventory === undefined) return reject("mutants", `${label}: empty, unfinished or out-of-range mutant inventory`);
    if (inventory.duplicate !== undefined) return reject("mutants", `${label}: duplicate mutant identity ${inventory.duplicate}`);
    if (inventory.hasSurvivor && job.verdict === 0) return reject("verdict", `${label}: passing gate verdict includes a survivor`);
    configurations.push({
      configuration: plan.configuration,
      baseline: { tests: baseline.tests, elapsedMs: baseline.elapsedMs },
      totalMs: receipt.totalMs,
      inventory: inventory.identities,
    });
  }
  if (timing.setupMs + configurations.reduce((sum, item) => sum + item.totalMs, 0) > timing.elapsedMs) {
    return reject("timing", `${description}: setup and execution exceed job time`);
  }
  return {
    selectors,
    verdict: job.verdict,
    timing: { setupMs: timing.setupMs, elapsedMs: timing.elapsedMs, retries: timing.retries, priorAttemptMs: timing.priorAttemptMs },
    configurations,
  };
}

function summarize(jobs: readonly Job[]) {
  const configurations = Object.fromEntries(jobs.flatMap((job) => job.configurations.map((receipt) => [receipt.configuration, {
    baseline: receipt.baseline,
    totalMs: receipt.totalMs,
    mutantCount: receipt.inventory.length,
  }])));
  const currentMs = jobs.reduce((sum, job) => sum + job.timing.elapsedMs, 0);
  const priorMs = jobs.reduce((sum, job) => sum + job.timing.priorAttemptMs, 0);
  return {
    configurations,
    jobs: jobs.map(({ selectors, verdict, timing }) => ({ selectors, verdict, timing })),
    setupMs: jobs.reduce((sum, job) => sum + job.timing.setupMs, 0),
    slowestJobMs: Math.max(...jobs.map((job) => job.timing.elapsedMs)),
    runnerMinutes: currentMs / 60_000,
    totalRunnerMinutes: (currentMs + priorMs) / 60_000,
    retries: jobs.reduce((sum, job) => sum + job.timing.retries, 0),
  };
}

/** Compare complete inventories from the same standard shard and its configuration-specific subsets. */
export function compareMutationConfigShadow(
  expected: ComparisonPlan,
  observed: { readonly mixed: unknown; readonly split: unknown },
) {
  const { configurations, pins } = expected;
  if (!sameMembers(configurations.map((plan) => plan.configuration), ["stryker.config.json", "stryker.elements.config.json"])) {
    return reject("configuration", "expected a standard mixed shard with both configurations");
  }
  const mixed = reviewJob(observed.mixed, configurations, pins, "mixed control");
  if ("matched" in mixed) return mixed;
  if (!list(observed.split) || observed.split.length !== configurations.length) {
    return reject("receipts", "expected one completed split invocation per configuration");
  }

  const split: Job[] = [];
  for (const plan of configurations) {
    const candidates = observed.split.filter((value) => {
      const selectors = record(value)?.selectors;
      return list(selectors) && sameMembers(selectors, plan.selectors);
    });
    if (candidates.length > 1) return reject("receipts", `${plan.configuration}: duplicate split invocation`);
    if (candidates.length === 0) return reject("selectors", `${plan.configuration}: missing unchanged split selectors`);
    const job = reviewJob(candidates[0], [plan], pins, "split invocation");
    if ("matched" in job) return job;
    split.push(job);

    const control = mixed.configurations.find((receipt) => receipt.configuration === plan.configuration);
    const isolated = job.configurations[0];
    if (control?.baseline.tests !== isolated?.baseline.tests) {
      return reject("timing", `${plan.configuration}: baseline test counts differ`);
    }
    if (JSON.stringify(control?.inventory) !== JSON.stringify(isolated?.inventory)) {
      return reject("mutants", `${plan.configuration}: mutant identities or outcomes differ`);
    }
  }
  const splitVerdict = split.some((job) => job.verdict === 1) ? 1 : 0;
  if (mixed.verdict !== splitVerdict) return reject("verdict", "mixed and split standard gate verdicts differ");
  return { matched: true as const, verdict: mixed.verdict, measurements: { mixed: summarize([mixed]), split: summarize(split) } };
}
