import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assessEvidenceReuse, ciWorkflow, digest, positiveInteger, reviewPath, revision, toolVersion, visualJob } from "../../../gates/bin/evidence-reuse-shadow.ts";
import type { Attempt, Candidate, Eligibility, HostedRun, Job, Observation, RunEvidence, RunMatch, TreeChange, VisualRuntime } from "../../../gates/bin/evidence-reuse-shadow.ts";

// The collector reads only GitHub REST resources, Git objects and the exact Visual job's log and artifact.
// Records supplied by the PR, other than the requested prior attempt, carry no evidentiary weight.
type Json = Record<string, unknown>;

function requireEvidence(condition: unknown, cause: string): asserts condition {
  if (!condition) throw new Error(cause);
}

function object(value: unknown): Json {
  requireEvidence(typeof value === "object" && value !== null && !Array.isArray(value), "expected a GitHub JSON object");
  return value as Json;
}

function objects(value: unknown): Json[] {
  requireEvidence(Array.isArray(value), "expected a GitHub JSON array");
  return value.map(object);
}

function string(value: unknown): string {
  requireEvidence(typeof value === "string", "expected a string in GitHub evidence");
  return value;
}

function number(value: unknown): number {
  requireEvidence(typeof value === "number" && positiveInteger(value), "expected a positive GitHub identity");
  return value;
}

function sha(value: unknown): string {
  const text = string(value);
  requireEvidence(revision.test(text), "expected an exact Git SHA");
  return text;
}

function parse(text: string): Json {
  return object(JSON.parse(text) as unknown);
}

function one(matches: readonly string[], missing: string): string {
  const distinct = new Set(matches);
  const value = matches[0];
  requireEvidence(distinct.size === 1 && value !== undefined && value.length > 0, missing);
  return value;
}

function output(command: string, args: readonly string[], cause: string, maxBuffer = 8 * 1024 * 1024): Buffer {
  try {
    return execFileSync(command, args, { maxBuffer, timeout: 25_000, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    // gh can include expiring signed download URLs in stderr.
    throw new Error(cause);
  }
}

function gh(endpoint: string, cause: string, flags: readonly string[] = [], maxBuffer?: number): Buffer {
  return output("gh", ["api", "--hostname", "github.com", "-H", "X-GitHub-Api-Version: 2022-11-28", ...flags, endpoint], cause, maxBuffer);
}

function api(endpoint: string): Json {
  return parse(gh(endpoint, `could not read ${endpoint}`).toString());
}

function pages(endpoint: string, collection: string): Json[] {
  // @json writes a single compact object per page, including on gh versions without --slurp.
  const response = gh(endpoint, `could not read every page of ${collection}`, ["--paginate", "--jq", `{total_count, ${collection}} | @json`]);
  const results = response.toString().trim().split("\n").map(parse);
  const count = results[0]?.total_count;
  const entries = results.flatMap((page) => objects(page[collection]));
  requireEvidence(typeof count === "number" && count === entries.length && results.every((page) => page.total_count === count),
    `inconsistent or incomplete GitHub pagination for ${collection}`);
  return entries;
}

function git(args: readonly string[]): Buffer {
  return output("git", ["--no-replace-objects", ...args], `could not verify Git ${args[0] ?? "data"}`);
}

function hash(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

interface PullCandidate {
  readonly number: number;
  readonly head: string;
  readonly base: string;
  readonly merge: string;
}

function pullCandidate(pr: Json, repositoryId: number, merge: string): PullCandidate {
  const head = object(pr.head);
  const base = object(pr.base);
  requireEvidence(object(head.repo).id === repositoryId && object(base.repo).id === repositoryId,
    "the pull request must have both branches in the trusted repository");
  return { number: number(pr.number), head: sha(head.sha), base: sha(base.sha), merge };
}

function requestedPrior(body: unknown): Attempt {
  const text = string(body);
  const markers = [...text.matchAll(/<!--\s*verify-evidence-reuse\b[^]*?-->/g)];
  const match = /^<!-- verify-evidence-reuse: ([1-9]\d*)\/([1-9]\d*) -->$/.exec(markers[0]?.[0] ?? "");
  requireEvidence(markers.length === 1 && match !== null,
    "expected one pull request body marker: <!-- verify-evidence-reuse: RUN_ID/ATTEMPT -->");
  return { runId: number(Number(match[1])), attempt: number(Number(match[2])) };
}

function jobsFor(repo: string, { runId, attempt }: Attempt): { rows: Job[]; raw: Json[]; totalCount: number } {
  const raw = pages(`repos/${repo}/actions/runs/${String(runId)}/attempts/${String(attempt)}/jobs?per_page=100`, "jobs");
  const rows = raw.map((job): Job => ({
    id: number(job.id), name: string(job.name), runId: number(job.run_id), attempt: number(job.run_attempt),
    head: sha(job.head_sha), status: string(job.status), conclusion: job.conclusion === null ? null : string(job.conclusion),
    startedAt: job.started_at === null ? "" : string(job.started_at),
    completedAt: job.completed_at === null ? "" : string(job.completed_at),
  }));
  return { raw, rows, totalCount: raw.length };
}

function logLines(log: string): string[] {
  return log.split(/\r?\n/).map((line) => line.replace(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z /, ""));
}

function visualAttemptArchive(repo: string, runId: number, attempt: number): string[] | undefined {
  let archive: Buffer;
  try {
    archive = gh(`repos/${repo}/actions/runs/${String(runId)}/attempts/${String(attempt)}/logs`,
      "could not download the exact Visual attempt archive", [], 32 * 1024 * 1024);
  } catch {
    return undefined;
  }
  if (archive.length === 0) return undefined;
  const directory = mkdtempSync(join(tmpdir(), "ocelle-visual-logs-"));
  try {
    const path = join(directory, "logs.zip");
    writeFileSync(path, archive, { flag: "wx" });
    const names = output("unzip", ["-Z1", path], "could not list the exact Visual attempt archive").toString().split(/\r?\n/);
    const suffix = `_${visualJob}.txt`;
    const entries = names.filter((name) => name.endsWith(suffix) && /^\d+$/.test(name.slice(0, -suffix.length)));
    const entry = entries[0];
    requireEvidence(entries.length === 1 && entry !== undefined, "the exact attempt archive does not contain a unique full Visual regression log");
    return logLines(output("unzip", ["-p", path, entry], "could not read the exact Visual attempt log").toString());
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function visualLog(repo: string, runId: number, attempt: number, jobId: number): string[] {
  try {
    const direct = gh(`repos/${repo}/actions/jobs/${String(jobId)}/logs`, "could not read the exact Visual job log").toString();
    if (direct.trim() !== "") return logLines(direct);
  } catch {
    // The job endpoint and its temporary redirect may fail independently of the attempt archive.
  }
  const exact = visualAttemptArchive(repo, runId, attempt);
  if (exact !== undefined) return exact;
  const archive = output("gh", ["run", "view", String(runId), "--repo", `github.com/${repo}`,
    "--attempt", String(attempt), "--job", String(jobId), "--log"], "could not read the exact Visual job log or its attempt archive");
  const lines = archive.toString().split(/\r?\n/).filter((line) => line !== "");
  const prefix = `${visualJob}\t`;
  const stripPrefix = (line: string): string => {
    const stepEnd = line.indexOf("\t", prefix.length);
    requireEvidence(line.startsWith(prefix) && stepEnd > prefix.length, "the attempt archive does not identify the exact Visual regression job");
    return line.slice(stepEnd + 1);
  };
  requireEvidence(lines.length > 0, "the exact Visual regression job has no log in its attempt archive");
  return logLines(lines.map(stripPrefix).join("\n"));
}

function testedMerge(lines: readonly string[], pr: number): string {
  const group = "##[group]Checking out the ref";
  const checkout = lines.indexOf(group);
  const end = lines.indexOf("##[endgroup]", checkout + 1);
  const ref = `refs/remotes/pull/${String(pr)}/merge`;
  const commands = lines.slice(checkout + 1, end).filter((line) => /^\[command\](?:\/[^ ]+\/)?git checkout /.test(line));
  requireEvidence(checkout !== -1 && end > checkout && lines.lastIndexOf(group) === checkout &&
    commands.length === 1 && commands[0]?.endsWith(` ${ref}`), "the Visual job log does not verify unique checkout of this PR's merge ref");
  const logs = lines.flatMap((line, index) => /^\[command\](?:\/[^ ]+\/)?git log -1 --format=%H$/.test(line) ? [index] : []);
  const index = logs[0];
  requireEvidence(logs.length === 1 && index !== undefined && index > end && revision.test(lines[index + 1] ?? ""),
    "the Visual checkout log has a missing or ambiguous tested merge SHA");
  return sha(lines[index + 1]);
}

function verifiedCommit(repo: string, commit: string): RunEvidence["mergeCommit"] {
  const hosted = api(`repos/${repo}/git/commits/${commit}`);
  const result = { sha: sha(hosted.sha), tree: sha(object(hosted.tree).sha), parents: objects(hosted.parents).map((parent) => sha(parent.sha)) };
  requireEvidence(result.sha === commit, "GitHub returned a different commit object than requested");
  try {
    git(["cat-file", "-e", `${commit}^{commit}`]);
  } catch {
    git(["fetch", "--quiet", "--no-tags", "--no-recurse-submodules", "--depth=1", `https://github.com/${repo}.git`, commit]);
  }
  requireEvidence(git(["rev-parse", `${commit}^{tree}`]).toString().trim() === result.tree,
    "the local tree differs from the trusted GitHub commit object");
  // The raw object retains its ordered parents even in a shallow checkout.
  const header = git(["cat-file", "commit", commit]).toString().split("\n\n", 1)[0] ?? "";
  const parents = header.split("\n").flatMap((line) => line.startsWith("parent ") ? [line.slice(7)] : []);
  requireEvidence(parents.length === result.parents.length && parents.every((parent, index) => parent === result.parents[index]),
    "the local parents differ from the trusted GitHub commit object");
  return result;
}

function treeDiff(priorTree: string, currentTree: string): NonNullable<Observation["treeDiff"]> {
  // Disable rename pairing so both sides of a rename independently pass the allowlist.
  const fields = git(["diff-tree", "--raw", "-r", "-z", "--no-renames", priorTree, currentTree, "--"]).toString().split("\0");
  requireEvidence(fields.pop() === "" && fields.length % 2 === 0, "incomplete Git tree comparison");
  const changes: TreeChange[] = [];
  for (let index = 0; index < fields.length; index += 2) {
    const modes = /^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ [ADMT]$/.exec(fields[index] ?? "");
    const path = fields[index + 1];
    requireEvidence(modes !== null && path !== undefined && path !== "", "unexpected Git tree change");
    changes.push({ path, beforeMode: modes[1] === "000000" ? null : string(modes[1]), afterMode: modes[2] === "000000" ? null : string(modes[2]) });
  }
  return { priorTree, currentTree, changes };
}

function visualInputs(tree: string): string {
  // Hash every tracked input except regular, audited review records. Git entries include mode, type, object ID and path.
  const records = git(["ls-tree", "-r", "-z", "--full-tree", tree]).toString("latin1").split("\0");
  requireEvidence(records.pop() === "" && records.length > 0, "the tracked visual input inventory is unreadable");
  return hash(Buffer.from(records.filter((entry) =>
    !entry.startsWith("100644 blob ") || !reviewPath.test(entry.slice(entry.indexOf("\t") + 1))).join("\0"), "latin1"));
}

function gitFile(tree: string, path: string): string {
  return git(["show", `${tree}:${path}`]).toString();
}

interface RunnerImage {
  readonly image: string;
  readonly version: string;
  readonly architecture: string;
  readonly imageCommit: string;
  readonly imageManifest: string;
  readonly docker: string;
  readonly dockerBuildx: string;
  readonly podman: string;
}

function runnerImage(repoJob: Json, lines: readonly string[]): RunnerImage {
  const start = lines.indexOf("##[group]Runner Image");
  const end = lines.indexOf("##[endgroup]", start + 1);
  requireEvidence(start !== -1 && end > start && lines.lastIndexOf("##[group]Runner Image") === start &&
    start < lines.indexOf("##[group]Checking out the ref"), "missing or ambiguous GitHub runner image setup group");
  const group = lines.slice(start + 1, end);
  const field = (label: string): string =>
    one(group.filter((line) => line.startsWith(`${label}: `)).map((line) => line.slice(label.length + 2)), `missing or ambiguous runner ${label}`);
  const image = field("Image");
  const version = field("Version");
  const release = /^(\d{8}\.\d+)\.\d+$/.exec(version)?.[1];
  // This audited standard GitHub label denotes the x64 Ubuntu image; ARM uses ubuntu-24.04-arm.
  requireEvidence(image === "ubuntu-24.04" && release !== undefined && Array.isArray(repoJob.labels) &&
    repoJob.labels.length === 1 && repoJob.labels[0] === image && repoJob.runner_group_name === "GitHub Actions",
  "missing or unexpected hosted x64 runner identity");
  const tag = `ubuntu24/${release}`;
  const tagPath = encodeURIComponent(tag);
  const manifestPath = "images/ubuntu/Ubuntu2404-Readme.md";
  const publicRepo = "actions/runner-images";
  requireEvidence(field("Included Software") === `https://github.com/${publicRepo}/blob/${tag}/${manifestPath}` &&
    field("Image Release") === `https://github.com/${publicRepo}/releases/tag/${tagPath}`,
  "the hosted runner did not link the expected official image inventory");
  const published = api(`repos/${publicRepo}/releases/tags/${tagPath}`);
  const ref = api(`repos/${publicRepo}/git/ref/tags/${tag}`);
  const refObject = object(ref.object);
  const imageCommit = sha(refObject.sha);
  requireEvidence(ref.ref === `refs/tags/${tag}` && refObject.type === "commit" && published.tag_name === tag &&
    published.target_commitish === imageCommit && published.draft === false,
  "the published image inventory did not resolve unambiguously to a commit");
  const file = api(`repos/${publicRepo}/contents/${manifestPath}?ref=${imageCommit}`);
  sha(file.sha);
  requireEvidence(file.path === manifestPath && file.encoding === "base64", "unreadable official runner image inventory");
  const manifest = Buffer.from(string(file.content), "base64");
  const required = (pattern: RegExp, name: string): string =>
    one([...manifest.toString().matchAll(pattern)].map((match) => match[1] ?? ""), `missing or ambiguous ${name} in the exact runner inventory`);
  requireEvidence(required(/^- Image Version: (\S+)\s*$/gm, "image version") === version,
    "the official inventory describes a different runner build");
  const dockerClient = required(/^- Docker Client (\S+)\s*$/gm, "Docker client");
  const docker = required(/^- Docker Server (\S+)\s*$/gm, "Docker server");
  const dockerBuildx = required(/^- Docker-Buildx (\S+)\s*$/gm, "Docker Buildx");
  const podman = required(/^- Podman (\S+)\s*$/gm, "Podman");
  requireEvidence(dockerClient === docker, "the official runner inventory reports different Docker client and server versions");
  return { image, version, architecture: "X64", imageCommit, imageManifest: hash(manifest), docker, dockerBuildx, podman };
}

interface PinRecord {
  readonly artifactId: number;
  readonly artifactDigest: string;
  readonly manifestDigest: string;
  readonly platform: string;
  readonly skopeoVersion: string;
  readonly containerImage: string;
  readonly browser: string;
  readonly containerNode: string;
  readonly executedTools: Buffer | null;
}

const runtimeRecordName = "executed-tools.json";

function pinRecord(repo: string, repositoryId: number, run: HostedRun, lines: readonly string[], tree: string): PinRecord {
  const identity = one(lines.flatMap((line) => {
    const match = /^Artifact pin-record has been successfully uploaded! Final size is \d+ bytes\. Artifact ID is (\d+)$/.exec(line);
    return match?.[1] === undefined ? [] : [match[1]];
  }), "the Visual attempt did not identify its pin-record upload");
  const artifactId = number(Number(identity));
  const artifact = api(`repos/${repo}/actions/artifacts/${String(artifactId)}`);
  const artifactRun = object(artifact.workflow_run);
  const size = number(artifact.size_in_bytes);
  const artifactDigest = string(artifact.digest);
  requireEvidence(artifact.id === artifactId && artifact.name === "pin-record" && artifact.expired === false &&
    artifactRun.id === run.id && artifactRun.repository_id === repositoryId &&
    artifactRun.head_repository_id === repositoryId && artifactRun.head_sha === run.head &&
    size < 2 * 1024 * 1024 && digest.test(artifactDigest),
  "pin-record metadata does not identify an intact artifact of the matched Visual run");
  const zip = gh(`repos/${repo}/actions/artifacts/${String(artifactId)}/zip`, "could not download the audited pin-record");
  requireEvidence(zip.length === size && hash(zip) === artifactDigest, "pin-record bytes do not match the GitHub artifact digest and size");
  const directory = mkdtempSync(join(tmpdir(), "ocelle-evidence-pin-"));
  try {
    const archive = join(directory, "pin-record.zip");
    writeFileSync(archive, zip);
    const contents = output("unzip", ["-Z", "-1", archive], "unreadable pin-record archive").toString().trim().split("\n").sort();
    const names = ["podman-inspect.json", "skopeo-inspect-raw-index.json", "skopeo-inspect-raw-manifest.json", "skopeo-version.txt"];
    if (contents.includes(runtimeRecordName)) names.unshift(runtimeRecordName);
    requireEvidence(contents.length === names.length && contents.every((name, index) => name === names[index]),
      "the pin-record archive has missing or unexpected files");
    const read = (name: string): Buffer => output("unzip", ["-p", archive, name], `unreadable pin-record file ${name}`, 2 * 1024 * 1024);
    const pin = parse(gitFile(tree, "storybook/visual/container.json"));
    const containerImage = string(pin.image);
    const manifestDigest = hash(read("skopeo-inspect-raw-manifest.json"));
    const pods = objects(JSON.parse(read("podman-inspect.json").toString()) as unknown);
    const pod = pods[0];
    requireEvidence(pods.length === 1 && pod?.Digest === manifestDigest && pin.digest === manifestDigest &&
      Array.isArray(pod.RepoDigests) && pod.RepoDigests.includes(`${containerImage}@${manifestDigest}`),
      "the inspected image manifest differs from the exact tree pin");
    const platform = `${string(pod.Os)}/${string(pod.Architecture)}`;
    const index = parse(read("skopeo-inspect-raw-index.json").toString());
    const linuxAmd64 = objects(index.manifests).filter((entry) => {
      const descriptor = object(entry.platform);
      return descriptor.os === "linux" && descriptor.architecture === "amd64";
    });
    requireEvidence(platform === "linux/amd64" && pin.platform === platform && linuxAmd64.length === 1 &&
      linuxAmd64[0]?.digest === manifestDigest, "the inspected index does not corroborate the exact linux/amd64 container pin");
    const skopeoVersion = /^skopeo version (\S+)$/.exec(read("skopeo-version.txt").toString().trim())?.[1];
    requireEvidence(skopeoVersion !== undefined && toolVersion.test(skopeoVersion), "pin-record lacks an exact skopeo tool version");
    return { artifactId, artifactDigest, manifestDigest, platform, skopeoVersion, containerImage,
      browser: string(pin.browser), containerNode: string(pin.node),
      executedTools: names[0] === runtimeRecordName ? read(runtimeRecordName) : null };
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

function executedToolsDigest(lines: readonly string[]): string {
  const command = '##[group]Run VISUAL_RUNTIME_PNPM="$(command -v pnpm)" pnpm exec node tooling/speckit/bin/record-visual-runtime.ts ';
  const verificationSteps = lines.flatMap((line, index) => line.startsWith(command) &&
    line.includes(`/pin-record/${runtimeRecordName}`) ? [index] : []);
  const start = verificationSteps[0];
  requireEvidence(verificationSteps.length === 1 && start !== undefined,
    "missing or ambiguous Visual executed-tool verification step log");
  const end = lines.findIndex((line, index) => index > start && line.startsWith("##[group]Run "));
  const proofs = lines.slice(start + 1, end === -1 ? lines.length : end).flatMap((line) => {
    const proof = /^Visual executed tools digest: (sha256:[a-f0-9]{64})$/.exec(line)?.[1];
    return proof === undefined ? [] : [proof];
  });
  requireEvidence(proofs.length === 1, "missing or ambiguous executed tools digest in the Visual verification step");
  return one(proofs, "missing executed tools digest");
}

function observedTools(pin: PinRecord, lines: readonly string[], run: HostedRun, runner: RunnerImage, node: string, pnpm: string): {
  readonly tools: Omit<VisualRuntime["tools"], "jobId">;
  readonly recordDigest: string;
  readonly executables: Record<string, string>;
  readonly pnpmLauncher: { readonly kind: string; readonly digest: string };
} {
  requireEvidence(pin.executedTools !== null, "the Visual pin-record has no executed tool observation");
  const recordDigest = hash(pin.executedTools);
  requireEvidence(recordDigest === executedToolsDigest(lines), "the executed tool record does not match the exact Visual job log");
  const record = parse(pin.executedTools.toString());
  requireEvidence(record.schema === 2, "the Visual runtime record does not attest a native pnpm executable");
  requireEvidence(record.repository === run.repository && record.event === run.event && record.job === "visual" &&
    record.runId === run.id && record.attempt === run.attempt && record.testedMerge === run.testedMerge,
  "the executed tool record is from a different Visual run, attempt or tested merge");
  requireEvidence(record.platform === pin.platform && record.dockerContext === "default" &&
    record.dockerEndpoint === "unix:///var/run/docker.sock" && record.podmanLocal === true,
  "the Visual tool observation did not verify the audited local engines and OCI architecture");
  const versions = object(record.versions);
  const expectedVersions = {
    node, pnpm, dockerClient: runner.docker, dockerServer: runner.docker, dockerBuildx: runner.dockerBuildx,
    podman: runner.podman, skopeo: pin.skopeoVersion,
  };
  requireEvidence(Object.entries(expectedVersions).every(([name, version]) => versions[name] === version && toolVersion.test(version)),
    "an executed tool version differs from the official runner inventory, project pin or OCI artifact");
  const dockerCommits = [string(versions.dockerClientCommit), string(versions.dockerServerCommit)];
  requireEvidence(dockerCommits.every((commit) => /^[a-f0-9]{7,40}$/.test(commit)), "the executed Docker build identities are unreadable");
  const binaryDigests = object(record.executables);
  const executableNames = ["node", "pnpm", "docker", "dockerBuildx", "podman", "skopeo"];
  const executables = Object.fromEntries(executableNames.map((name) => [name, string(binaryDigests[name])]));
  requireEvidence(Object.keys(binaryDigests).length === executableNames.length && Object.values(executables).every((value) => digest.test(value)),
    "the executed tool record has unknown or unreadable executable identities");
  const launcher = object(record.pnpmLauncher);
  const pnpmLauncher = { kind: string(launcher.kind), digest: string(launcher.digest) };
  requireEvidence(Object.keys(launcher).length === 2 && digest.test(pnpmLauncher.digest) &&
    (pnpmLauncher.kind === "pinned-cmd-shim" || (pnpmLauncher.kind === "native" && pnpmLauncher.digest === executables.pnpm)),
  "the Visual runtime record does not attest the audited pnpm launcher");
  // The before/after recorder compares raw launcher bytes within each run; installation paths can differ across runs.
  const fingerprint = hash(Buffer.from(JSON.stringify([expectedVersions, dockerCommits, executables, pnpmLauncher.kind])));
  return {
    tools: {
      node: string(versions.node), pnpm: string(versions.pnpm), docker: string(versions.dockerServer), podman: string(versions.podman),
      observed: { runId: run.id, attempt: run.attempt, testedMerge: run.testedMerge, fingerprint },
    },
    recordDigest, executables, pnpmLauncher,
  };
}

interface AttemptReceipt {
  attempt: Attempt;
  head?: string;
  base?: string;
  merge?: string;
  tree?: string;
  conclusion?: string | null;
  jobs?: readonly Job[];
  visualInputs?: string;
  audit?: {
    workflowBlob: string;
    setupBlob: string;
    runtimeRecorderBlob: string;
    lockfileBlob: string;
    playwright: string;
  };
  runtime?: VisualRuntime;
  runtimeSources?: {
    visualJobId: number;
    log: string;
    imageCommit?: string;
    imageManifest?: string;
    artifact?: string;
    artifactDigest?: string;
    executedToolsDigest?: string;
    executables?: Record<string, string>;
    pnpmLauncher?: { readonly kind: string; readonly digest: string };
    containerImage?: string;
    browser?: string;
    containerNode?: string;
  };
  problem?: string;
}

function visualRuntime(context: Context, job: Job, rawJob: Json, run: HostedRun,
  tree: string, lines: readonly string[], receipt: AttemptReceipt): VisualRuntime {
  const { repo, repositoryId, baseTree } = context;
  // These blob IDs cover the audited CI job and shared setup. Re-audit before accepting a new version of either.
  const workflowBlob = git(["rev-parse", `${tree}:${ciWorkflow}`]).toString().trim();
  const setupBlob = git(["rev-parse", `${tree}:.github/actions/setup/action.yml`]).toString().trim();
  const recorderPath = "tooling/speckit/bin/record-visual-runtime.ts";
  const runtimeRecorderBlob = git(["rev-parse", `${tree}:${recorderPath}`]).toString().trim();
  requireEvidence(workflowBlob === "6eb0ec30c806e0c7d578c70cbc8beff48e8af534" &&
    setupBlob === "3c8211a282364e46895d9bdc0d173f85402fddbf" &&
    runtimeRecorderBlob === "647183c3be8748956dae31357b7268be5503bf8c" &&
    git(["rev-parse", `${baseTree}:${ciWorkflow}`]).toString().trim() === workflowBlob &&
    git(["rev-parse", `${baseTree}:.github/actions/setup/action.yml`]).toString().trim() === setupBlob &&
    git(["rev-parse", `${baseTree}:${recorderPath}`]).toString().trim() === runtimeRecorderBlob,
  "the Visual CI job, shared setup or runtime recorder differs from the audited common base");
  const manifest = parse(gitFile(tree, "package.json"));
  const scripts = object(manifest.scripts);
  const node = gitFile(tree, ".node-version").trim();
  const pnpm = /^pnpm@(\S+)$/.exec(string(manifest.packageManager))?.[1];
  const playwright = string(object(manifest.devDependencies).playwright);
  requireEvidence(scripts["gate:visual"] === "node gates/bin/visual.ts" &&
    scripts["setup:online"] === "pnpm install --frozen-lockfile && pnpm exec playwright install chromium" &&
    pnpm !== undefined && [node, pnpm, playwright].every((version) => toolVersion.test(version)),
  "the Visual build or Node, pnpm and Playwright setup differs from the audited entry points");
  receipt.audit = { workflowBlob, setupBlob, runtimeRecorderBlob, playwright,
    lockfileBlob: sha(git(["rev-parse", `${tree}:pnpm-lock.yaml`]).toString().trim()) };
  requireEvidence(job.conclusion === "success" && lines.some((line) => /^visual: [1-9]\d* captures match their baselines \(docker\+podman\)$/.test(line)),
    "the matched Visual job did not report successful captures under both engines");
  const pin = pinRecord(repo, repositoryId, run, lines, tree);
  receipt.runtimeSources = {
    visualJobId: job.id, log: `https://github.com/${repo}/actions/runs/${String(run.id)}/job/${String(job.id)}`,
    artifact: `https://github.com/${repo}/actions/runs/${String(run.id)}/artifacts/${String(pin.artifactId)}`, artifactDigest: pin.artifactDigest,
    containerImage: pin.containerImage, browser: pin.browser, containerNode: pin.containerNode,
  };
  const runner = runnerImage(rawJob, lines);
  receipt.runtimeSources.imageCommit = runner.imageCommit;
  receipt.runtimeSources.imageManifest = runner.imageManifest;
  const observed = observedTools(pin, lines, run, runner, node, pnpm);
  receipt.runtimeSources.executedToolsDigest = observed.recordDigest;
  receipt.runtimeSources.executables = observed.executables;
  receipt.runtimeSources.pnpmLauncher = observed.pnpmLauncher;
  return {
    pinRecord: { jobId: job.id, artifactId: pin.artifactId, manifestDigest: pin.manifestDigest, platform: pin.platform, skopeoVersion: pin.skopeoVersion },
    runnerSetup: { jobId: job.id, image: runner.image, version: runner.version, architecture: runner.architecture },
    tools: { jobId: job.id, ...observed.tools },
  };
}

interface Context {
  readonly repo: string;
  readonly repositoryId: number;
  readonly workflowId: number;
  readonly baseTree: string;
  readonly pull: PullCandidate;
}

function collect(context: Context, receipt: AttemptReceipt, known?: Candidate): RunMatch {
  const { repo, repositoryId, pull } = context;
  const { runId, attempt } = receipt.attempt;
  const actual = api(`repos/${repo}/actions/runs/${String(runId)}/attempts/${String(attempt)}`);
  const links = objects(actual.pull_requests);
  const link = links[0];
  // The embedded association is live. Its repository and PR identities link the attempt, while the attempt pins its own head.
  requireEvidence(links.length === 1 && link?.number === pull.number &&
    object(object(link.head).repo).id === repositoryId && object(object(link.base).repo).id === repositoryId &&
    object(actual.repository).id === repositoryId && object(actual.head_repository).id === repositoryId &&
    actual.id === runId && actual.run_attempt === attempt && actual.event === "pull_request" &&
    actual.workflow_id === context.workflowId && actual.path === ciWorkflow && actual.status === "completed",
  "the requested completed CI attempt lacks exact same-repository, workflow and PR provenance");
  const head = sha(actual.head_sha);
  requireEvidence(object(actual.head_commit).id === head, "the CI attempt lacks matching immutable head SHAs");
  receipt.head = head;
  receipt.conclusion = actual.conclusion === null ? null : string(actual.conclusion);
  const jobs = jobsFor(repo, receipt.attempt);
  receipt.jobs = jobs.rows;
  const visual = jobs.rows.filter(({ name }) => name === visualJob);
  const job = visual[0];
  const rawJob = jobs.raw.find(({ id }) => id === job?.id);
  requireEvidence(visual.length === 1 && job !== undefined && rawJob !== undefined &&
    job.runId === runId && job.attempt === attempt && job.head === head && job.status === "completed" && rawJob.workflow_name === "CI",
  "the exact attempt has a missing or ambiguous Visual regression job");
  const lines = visualLog(repo, runId, attempt, job.id);
  const merge = testedMerge(lines, pull.number);
  receipt.merge = merge;
  const mergeCommit = verifiedCommit(repo, merge);
  receipt.tree = mergeCommit.tree;
  const [base, mergedHead] = mergeCommit.parents;
  requireEvidence(mergeCommit.parents.length === 2 && mergedHead === head, "the Visual checkout is not the exact expected PR head/base merge");
  requireEvidence(base === pull.base, "the CI attempt did not use the exact current base");
  requireEvidence(known === undefined || (head === known.head && base === known.base && merge === known.merge),
    "the Visual checkout is not the exact current tested merge");
  receipt.base = base;
  const expected = known ?? { runId, attempt, head, base, merge };
  const run: HostedRun = {
    repository: string(object(actual.repository).full_name), headRepository: string(object(actual.head_repository).full_name),
    pullRequests: [pull.number], workflowId: number(actual.workflow_id), workflowPath: string(actual.path), event: string(actual.event),
    id: number(actual.id), attempt: number(actual.run_attempt), head, testedMerge: merge,
    status: string(actual.status), conclusion: receipt.conclusion, startedAt: string(actual.run_started_at),
  };
  receipt.visualInputs = visualInputs(mergeCommit.tree);
  try {
    receipt.runtime = visualRuntime(context, job, rawJob, run, mergeCommit.tree, lines, receipt);
  } catch (error: unknown) {
    receipt.problem = problem(error);
  }
  return { expected, evidence: { run, mergeCommit, jobs, visualInputs: receipt.visualInputs, runtime: receipt.runtime ?? null } };
}

function problem(error: unknown): string {
  return error instanceof SyntaxError ? "GitHub or Git evidence contained invalid JSON" :
    error instanceof Error ? error.message : "an evidence source could not be read";
}

interface Receipt {
  readonly schema: 1;
  readonly gate: typeof visualJob;
  readonly repository: string;
  candidate?: PullCandidate;
  workflowId?: number;
  prior?: AttemptReceipt;
  current?: AttemptReceipt;
  treeDiff?: Observation["treeDiff"];
  verdict: Eligibility;
  detail?: string;
}

function currentAttempt(context: Context): Attempt {
  const { repo, pull, workflowId } = context;
  const runs = pages(`repos/${repo}/actions/workflows/${String(workflowId)}/runs?event=pull_request&head_sha=${pull.head}&per_page=100`, "workflow_runs");
  const matches = runs.filter((run) => objects(run.pull_requests).some((pr) => pr.number === pull.number));
  const current = matches[0];
  requireEvidence(matches.length === 1 && current?.status === "completed",
    "the exact current head has no unique completed CI run for this PR");
  return { runId: number(current.id), attempt: number(current.run_attempt) };
}

function observeInCi(env: NodeJS.ProcessEnv, receipt: Receipt): void {
  const repo = receipt.repository;
  requireEvidence(/^Ocelle-HQ\/ocelle-components$/.test(repo) && env.GITHUB_EVENT_NAME === "pull_request" &&
    env.GITHUB_EVENT_PATH !== undefined, "expected the trusted repository's pull request event");
  const event = parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
  const repository = api(`repos/${repo}`);
  const repositoryId = number(repository.id);
  requireEvidence(repository.full_name === repo && object(event.repository).id === repositoryId && event.action === "edited",
    "expected a trusted pull request body-edit event");
  const eventPR = object(event.pull_request);
  const pull = pullCandidate(eventPR, repositoryId, sha(env.GITHUB_SHA));
  receipt.candidate = pull;
  requireEvidence(git(["rev-parse", "HEAD"]).toString().trim() === pull.merge, "the observer checkout does not match the candidate merge");
  const prior = requestedPrior(eventPR.body);
  receipt.prior = { attempt: prior };
  const verifyLiveCandidate = (): void => {
    const live = api(`repos/${repo}/pulls/${String(pull.number)}`);
    const livePull = pullCandidate(live, repositoryId, sha(live.merge_commit_sha));
    requireEvidence(live.state === "open" && livePull.number === pull.number && livePull.head === pull.head &&
      livePull.base === pull.base && livePull.merge === pull.merge && live.body === eventPR.body,
    "the exact pull request candidate or opt-in changed during observation");
  };
  verifyLiveCandidate();
  const workflow = api(`repos/${repo}/actions/workflows/ci.yml`);
  requireEvidence(workflow.path === ciWorkflow && workflow.state === "active", "could not verify the trusted CI workflow identity");
  const workflowId = number(workflow.id);
  receipt.workflowId = workflowId;
  const baseTree = verifiedCommit(repo, pull.base).tree;
  const context = { repo, repositoryId, workflowId, pull, baseTree };
  const attempt = currentAttempt(context);
  receipt.current = { attempt };
  const after = collect(context, receipt.current, { ...attempt, ...pull });
  const before = collect(context, receipt.prior);
  receipt.treeDiff = treeDiff(before.evidence.mergeCommit.tree, after.evidence.mergeCommit.tree);
  verifyLiveCandidate();
  const verdict = assessEvidenceReuse({ repository: repo, pullRequest: pull.number, workflowId, prior: before, current: after, treeDiff: receipt.treeDiff });
  if (verdict.eligible && (receipt.prior.runtimeSources?.imageCommit !== receipt.current.runtimeSources?.imageCommit ||
    receipt.prior.runtimeSources?.imageManifest !== receipt.current.runtimeSources?.imageManifest)) {
    receipt.verdict = { eligible: false, reason: "runtime" };
    receipt.detail = "the official runner image inventory source changed between candidates";
    return;
  }
  receipt.verdict = verdict;
}

function main(env: NodeJS.ProcessEnv, receiptPath: string): void {
  const receipt: Receipt = {
    schema: 1, gate: visualJob, repository: env.GITHUB_REPOSITORY ?? "", verdict: { eligible: false, reason: "provenance" },
  };
  try {
    observeInCi(env, receipt);
  } catch (error: unknown) {
    receipt.detail = problem(error);
  }
  writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  const currentVisual = receipt.current?.jobs?.find(({ name }) => name === visualJob)?.conclusion ?? "unverified";
  const outcome = `Visual evidence reuse observation: ${receipt.verdict.eligible ? "eligible" : "ineligible"} (${receipt.verdict.reason})`;
  console.log(outcome);
  if (receipt.detail !== undefined) console.log(receipt.detail);
  if (env.GITHUB_STEP_SUMMARY !== undefined) {
    const { head, base, merge } = receipt.candidate ?? {};
    writeFileSync(env.GITHUB_STEP_SUMMARY, `### ${outcome}\n\nCandidate head: \`${head ?? "unverified"}\`\n\nCandidate base: \`${base ?? "unverified"}\`\n\nTested merge: \`${merge ?? "unverified"}\`\n\nActual exact CI Visual result: \`${currentVisual}\`\n`, { flag: "a" });
  }
}

if (import.meta.main) {
  const receiptPath = process.argv[2];
  if (receiptPath === undefined) throw new Error("usage: node tooling/speckit/bin/evidence-reuse-observe.ts <receipt.json>");
  main(process.env, receiptPath);
}
