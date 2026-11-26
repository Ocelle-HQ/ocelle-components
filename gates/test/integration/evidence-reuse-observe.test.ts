import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { crc32 } from "node:zlib";
import { expect, it } from "vitest";

const workspace = resolve(import.meta.dirname, "../../..");
const observer = join(workspace, "tooling/speckit/bin/evidence-reuse-observe.ts");
const repository = { id: 1442951599, full_name: "Ocelle-HQ/ocelle-components" };
const api = `repos/${repository.full_name}`;
const workflow = { id: 405212632, path: ".github/workflows/ci.yml", state: "active" };
const pullNumber = 104;
const review = "ops/034-workflow-pilots/reviews/landing/round-1.md";
const visual = "Visual regression";
const jobNames = [
  "Typecheck", "Code lint", "Style lint", "Unit tests", "Test lint", "Mutation testing",
  "Content security", "Prefix", "Story config copies", "Install and pins", "Sign-off", "Sandbox paths",
  "Contrast", "Brand rules", "Custom-elements manifest", "Storybook build", visual, "Accessibility", "Plants",
  "Unit test inventory", "Unit test shard (0)", "Unit tests full suite comparison",
  "Mutation plan", "Mutation shard", "Plants plan", "Plants shard (1)",
];

const fixtures = [
  ".github/workflows/ci.yml", ".github/actions/setup/action.yml", "tooling/speckit/bin/record-visual-runtime.ts",
  "package.json", ".node-version", "pnpm-lock.yaml",
];

const fakeGh = `#!/usr/bin/env node
import { readFileSync } from "node:fs";
const args = process.argv.slice(2);
const key = args[0] === "run" ? args.join(" ") : args.at(-1);
const response = JSON.parse(readFileSync(process.env.OCELLE_OBSERVER_FIXTURE, "utf8"))[key];
if (response === undefined) process.exit(2);
if (typeof response === "string") process.stdout.write(response);
else if (response?.archive) process.stdout.write(Buffer.from(response.archive, "base64"));
else if (Array.isArray(response)) process.stdout.write(response.map(page => JSON.stringify(page)).join("\\n"));
else process.stdout.write(JSON.stringify(response));
`;

type Scenario = "advanced" | "conflicting-head" | "missing-head" | "duplicate-link" | "wrong-pr" | "wrong-repo" |
  "wrong-workflow" | "wrong-job" | "ambiguous-checkout" | "wrong-checkout" | "reversed-parents" |
  "moved-base" | "stale-current" | "incomplete-jobs" | "fallback" | "wrong-fallback-checkout" | "wrong-fallback-job" |
  "fallback-archive" | "ambiguous-fallback-archive";

/** Build a stored ZIP with a fixed timestamp so these fixtures need no archive writer on PATH. */
function logArchive(entries: Readonly<Record<string, string>>): Buffer {
  const files: Buffer[] = [];
  const directory: Buffer[] = [];
  let directoryOffset = 0;
  for (const [name, text] of Object.entries(entries)) {
    const filename = Buffer.from(name);
    const contents = Buffer.from(text);
    const checksum = crc32(contents);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // ZIP version needed to extract
    local.writeUInt16LE(0x21, 12); // DOS date 1980-01-01
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(contents.length, 18);
    local.writeUInt32LE(contents.length, 22);
    local.writeUInt16LE(filename.length, 26);
    files.push(local, filename, contents);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(contents.length, 20);
    central.writeUInt32LE(contents.length, 24);
    central.writeUInt16LE(filename.length, 28);
    central.writeUInt32LE(directoryOffset, 42);
    directory.push(central, filename);
    directoryOffset += local.length + filename.length + contents.length;
  }

  const centralDirectory = Buffer.concat(directory);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  const count = Object.keys(entries).length;
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(directoryOffset, 16);
  return Buffer.concat([...files, centralDirectory, end]);
}

function observe(root: string, scenario: Scenario) {
  const git = (...args: string[]): string => execFileSync("git", ["-c", "user.name=Observer Fixture",
    "-c", "user.email=observer@example.test", "-c", "commit.gpgsign=false", "-c", `core.hooksPath=${join(root, "unused-hooks")}`, ...args],
  { cwd: root, encoding: "utf8" }).trim();
  const write = (path: string, text: string): void => {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  };
  const commit = (message: string): string => {
    git("add", "--all");
    git("commit", "--quiet", "-m", message);
    return git("rev-parse", "HEAD");
  };
  const tree = (ref: string): string => git("rev-parse", `${ref}^{tree}`);
  const merge = (ref: string, first: string, second: string): string =>
    git("commit-tree", tree(ref), "-p", first, "-p", second, "-m", "Tested pull request merge");

  git("init", "--quiet");
  for (const path of fixtures) {
    const destination = join(root, path);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(join(workspace, path), destination);
  }
  const base = commit("Common base");
  const oldBase = git("commit-tree", tree(base), "-m", "Earlier base with the same tree");
  write(join(root, "product.txt"), "unchanged audited product input\n");
  const priorHead = commit("Product branch");
  write(join(root, review), "review evidence\n");
  const currentHead = commit("Evidence-only update");
  const priorBase = scenario === "moved-base" ? oldBase : base;
  const priorMerge = scenario === "reversed-parents" ? merge(priorHead, priorHead, base) : merge(priorHead, priorBase, priorHead);
  const currentMerge = merge(currentHead, base, currentHead);
  git("switch", "--quiet", "--detach", currentMerge);

  const prior = { id: 101, run_attempt: 2, head_sha: priorHead };
  const current = { id: 102, run_attempt: 1, head_sha: currentHead };
  const live = {
    number: pullNumber, head: { sha: currentHead, repo: repository }, base: { sha: base, repo: repository },
    state: "open", merge_commit_sha: currentMerge, body: "<!-- verify-evidence-reuse: 101/2 -->",
  };
  const responses: Record<string, unknown> = {
    [api]: repository,
    [`${api}/pulls/${String(pullNumber)}`]: scenario === "stale-current" ? { ...live, head: { ...live.head, sha: priorHead } } : live,
    [`${api}/actions/workflows/ci.yml`]: workflow,
    [`${api}/actions/workflows/${String(workflow.id)}/runs?event=pull_request&head_sha=${currentHead}&per_page=100`]: {
      total_count: 1, workflow_runs: [{ ...current, pull_requests: [live], status: "completed" }],
    },
    [`${api}/git/commits/${base}`]: { sha: base, tree: { sha: tree(base) }, parents: [] },
  };
  for (const [source, tested, firstParent, date] of [[prior, priorMerge, priorBase, "24"], [current, currentMerge, base, "25"]] as const) {
    const historical = source === prior;
    const attempt = `${api}/actions/runs/${String(source.id)}/attempts/${String(source.run_attempt)}`;
    const started = `2026-11-${date}T10:00:00Z`;
    const link = {
      number: historical && scenario === "wrong-pr" ? pullNumber + 1 : pullNumber,
      head: {
        // GitHub refreshes this PR association independently of the historical attempt.
        sha: historical && scenario !== "advanced" ? priorHead : currentHead,
        repo: historical && scenario === "wrong-repo" ? { ...repository, id: repository.id + 1 } : repository,
      },
      base: live.base,
    };
    responses[attempt] = {
      ...source,
      head_commit: historical && scenario === "missing-head" ? {} : {
        id: historical && scenario === "conflicting-head" ? currentHead : source.head_sha,
      },
      repository, head_repository: repository,
      pull_requests: historical && scenario === "duplicate-link" ? [link, link] : [link],
      workflow_id: historical && scenario === "wrong-workflow" ? workflow.id + 1 : workflow.id,
      path: workflow.path, event: "pull_request", status: "completed", conclusion: "success", run_started_at: started,
    };
    const jobs = jobNames.map((name, index) => ({
      id: source.id * 100 + index + 1, name, run_id: source.id, run_attempt: source.run_attempt,
      head_sha: historical && scenario === "wrong-job" && name === visual ? currentHead : source.head_sha,
      status: "completed", conclusion: name === "Unit tests full suite comparison" ? "skipped" : "success",
      started_at: started, completed_at: `2026-11-${date}T10:10:00Z`, workflow_name: "CI",
    }));
    responses[`${attempt}/jobs?per_page=100`] = [
      { total_count: jobs.length, jobs: jobs.slice(0, 12) },
      { total_count: jobs.length, jobs: historical && scenario === "incomplete-jobs" ? jobs.slice(13) : jobs.slice(12) },
    ];
    const jobId = jobs.find((job) => job.name === visual)?.id;
    const log = [
      "##[group]Checking out the ref",
      ...(historical && scenario === "ambiguous-checkout" ? ["[command]/usr/bin/git checkout --force refs/heads/other"] : []),
      `[command]/usr/bin/git checkout --force refs/remotes/pull/${String(historical && (scenario === "wrong-checkout" || scenario === "wrong-fallback-checkout") ? pullNumber + 1 : pullNumber)}/merge`,
      "##[endgroup]",
      "[command]/usr/bin/git log -1 --format=%H",
      tested,
      "visual: 1 captures match their baselines (docker+podman)",
      "",
    ].join("\n");
    if (historical && (scenario === "fallback-archive" || scenario === "ambiguous-fallback-archive")) {
      const entries: Record<string, string> = {
        "107_Visual regression.txt": log,
        "108_Accessibility.txt": "unrelated log",
      };
      if (scenario === "ambiguous-fallback-archive") {
        entries["109_Visual regression.txt"] = log;
      }
      responses[`${attempt}/logs`] = { archive: logArchive(entries).toString("base64") };
    } else if (historical && (scenario === "fallback" || scenario === "wrong-fallback-checkout" || scenario === "wrong-fallback-job")) {
      const selectedJob = scenario === "wrong-fallback-job" ? "Unrelated job" : visual;
      responses[`run view ${String(source.id)} --repo github.com/${repository.full_name} --attempt ${String(source.run_attempt)} --job ${String(jobId)} --log`] =
        log.trimEnd().split("\n").map((line) => `${selectedJob}\tUNKNOWN STEP\t2026-11-24T10:00:00.0000000Z ${line}\n`).join("");
    } else {
      responses[`${api}/actions/jobs/${String(jobId)}/logs`] = log;
    }
    // The reversed-parent case gives the collector coherent REST metadata for an inconsistent local commit object.
    responses[`${api}/git/commits/${tested}`] = {
      sha: tested, tree: { sha: tree(tested) }, parents: [firstParent, source.head_sha].map((sha) => ({ sha })),
    };
  }

  const bin = join(root, "stub-bin");
  const event = join(root, "event.json");
  const responsesPath = join(root, "responses.json");
  const receiptPath = join(root, "receipt.json");
  write(event, JSON.stringify({ action: "edited", repository, pull_request: live }));
  write(responsesPath, JSON.stringify(responses));
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), fakeGh, { mode: 0o700 });
  const run = spawnSync(process.execPath, [observer, receiptPath], {
    cwd: root, encoding: "utf8", timeout: 15_000,
    env: {
      ...process.env,
      PATH: [bin, dirname(process.execPath), process.env.PATH].join(delimiter),
      OCELLE_OBSERVER_FIXTURE: responsesPath, GIT_ALLOW_PROTOCOL: "file",
      GITHUB_REPOSITORY: repository.full_name, GITHUB_EVENT_NAME: "pull_request", GITHUB_EVENT_PATH: event,
      GITHUB_SHA: currentMerge, GITHUB_STEP_SUMMARY: join(root, "summary.md"),
    },
  });
  const receipt = existsSync(receiptPath)
    ? JSON.parse(readFileSync(receiptPath, "utf8")) as { readonly detail?: string } : undefined;
  return { receipt, run, base, priorHead, currentHead, priorMerge, currentMerge };
}

function replay(scenario: Scenario): ReturnType<typeof observe> | undefined {
  // The wider phase replay also runs these tests on a base that predates the observer.
  if (!existsSync(observer)) return undefined;
  const root = mkdtempSync(join(tmpdir(), "ocelle-observer-"));
  try {
    return observe(root, scenario);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

it("authenticates the historical checkout after the live PR link advances and reaches the runtime safeguard", () => {
  const result = replay("advanced");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({
    prior: {
      attempt: { runId: 101, attempt: 2 }, head: result?.priorHead, base: result?.base, merge: result?.priorMerge,
      problem: "the Visual attempt did not identify its pin-record upload",
    },
    current: { attempt: { runId: 102, attempt: 1 }, head: result?.currentHead, base: result?.base, merge: result?.currentMerge },
    treeDiff: { changes: [{ path: review, beforeMode: null, afterMode: "100644" }] },
    verdict: { eligible: false, reason: "runtime" },
  });
});

it("authenticates the same historical Visual job through its attempt-specific log fallback", () => {
  const result = replay("fallback");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({
    prior: { attempt: { runId: 101, attempt: 2 }, head: result?.priorHead, merge: result?.priorMerge },
    verdict: { eligible: false, reason: "runtime" },
  });
});

it("reads only the unique full Visual log from the exact attempt archive", () => {
  const result = replay("fallback-archive");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({
    prior: { attempt: { runId: 101, attempt: 2 }, head: result?.priorHead, merge: result?.priorMerge },
    verdict: { eligible: false, reason: "runtime" },
  });
});

it("rejects a fallback log that checks out a different pull request", () => {
  const result = replay("wrong-fallback-checkout");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({ verdict: { eligible: false, reason: "provenance" } });
  expect(result?.receipt?.detail).toMatch(/checkout of this PR's merge ref/);
  expect(result?.receipt).not.toHaveProperty("treeDiff");
});

it("rejects a fallback log tagged for another job", () => {
  const result = replay("wrong-fallback-job");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({ verdict: { eligible: false, reason: "provenance" } });
  expect(result?.receipt?.detail).toMatch(/does not identify the exact Visual regression job/);
  expect(result?.receipt).not.toHaveProperty("treeDiff");
});

it("rejects an attempt archive containing ambiguous full Visual logs", () => {
  const result = replay("ambiguous-fallback-archive");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({ verdict: { eligible: false, reason: "provenance" } });
  expect(result?.receipt?.detail).toMatch(/unique full Visual regression log/);
  expect(result?.receipt).not.toHaveProperty("treeDiff");
});

it("rejects a contradictory immutable prior head even with matching PR membership and Visual checkout", () => {
  const result = replay("conflicting-head");
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({
    prior: { attempt: { runId: 101, attempt: 2 } },
    verdict: { eligible: false, reason: "provenance" },
  });
  expect(result?.receipt?.detail).toMatch(/immutable head/);
  expect(result?.receipt).not.toHaveProperty("prior.jobs");
});

it.each([
  ["missing-head", /immutable head/],
  ["duplicate-link", /same-repository, workflow and PR provenance/],
  ["wrong-pr", /same-repository, workflow and PR provenance/],
  ["wrong-repo", /same-repository, workflow and PR provenance/],
  ["wrong-workflow", /same-repository, workflow and PR provenance/],
  ["wrong-job", /missing or ambiguous Visual regression job/],
  ["ambiguous-checkout", /checkout of this PR's merge ref/],
  ["wrong-checkout", /checkout of this PR's merge ref/],
  ["reversed-parents", /local parents differ/],
  ["moved-base", /exact current base|exact expected PR head\/base merge/],
  ["stale-current", /exact pull request candidate or opt-in changed/],
  ["incomplete-jobs", /incomplete GitHub pagination for jobs/],
] as const)("fails closed for %s in the exact workflow observation", (scenario, detail) => {
  const result = replay(scenario);
  expect(result?.run.status).toBe(0);
  expect(result?.receipt).toMatchObject({ verdict: { eligible: false, reason: "provenance" } });
  expect(result?.receipt?.detail).toMatch(detail);
  expect(result?.receipt).not.toHaveProperty("treeDiff");
});
