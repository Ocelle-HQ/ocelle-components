// Record selected local tool identities without recording CLI configuration, raw output or environment values.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";

class ObservationError extends Error {}

function requireObservation(condition: unknown, problem: string): asserts condition {
  if (!condition) throw new ObservationError(problem);
}

const exactVersion = /^\d+\.\d+\.\d+(?:[.+~:-][\w.+~:-]+)?$/;

function command(name: string, args: readonly [string, ...string[]], { file = name, timeout = 8_000, cwd = process.cwd() } = {}): string {
  try {
    return execFileSync(file, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout, killSignal: "SIGKILL", maxBuffer: 128 * 1024 }).trim();
  } catch (error: unknown) {
    const stage = `${name} ${args[0]}`;
    if (error instanceof Error && "code" in error && error.code === "ETIMEDOUT") {
      throw new ObservationError(`timed out observing ${stage} in the Visual job after ${String(timeout)} ms`);
    }
    throw new ObservationError(`could not observe ${stage} in the Visual job`);
  }
}

function executable(name: string, path: string): string {
  for (const dir of path.split(delimiter)) {
    requireObservation(isAbsolute(dir), "the Visual job PATH contains a non-absolute directory");
    const candidate = join(dir, name);
    try {
      accessSync(candidate, constants.X_OK);
      if (statSync(candidate).isFile()) return realpathSync(candidate);
    } catch {
      // Continue searching with the same PATH ordering used by the Visual process.
    }
  }
  throw new ObservationError(`could not resolve the selected ${name} executable`);
}

function digest(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function executableHash(path: string): string {
  return digest(readFileSync(path));
}

// Git object 666c35e95c17f1a36414adc28bc25a73a8f1f67f, pnpm/crates/cmd-shim/src/shim.rs,
// SH_SHIM_HEADER in the pinned pnpm release. Only the native exec target can vary.
const pnpmShimHeader = "sha256:97b4d68b1d6d04f0dd481c1219136a8a3c55e43614a13bcb7c0a477b1ecd3127";
const nativePnpmShim = /exec "(\$basedir\/\.\.\/global\/v11\/[\w-]+\/node_modules\/pnpm\/pnpm)"  "\$@"\nexit \$\?\n# cmd-shim-target=(\/[\w./@+-]+)\n$/;

function nativeLinuxAmd64(bytes: Buffer): boolean {
  return bytes.length >= 64 && bytes.subarray(0, 7).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1])) &&
    [2, 3].includes(bytes.readUInt16LE(16)) && bytes.readUInt16LE(18) === 62 && bytes.readUInt32LE(20) === 1;
}

export function pnpmIdentity(path: string): {
  readonly executablePath: string;
  readonly executableDigest: string;
  readonly launcherDigest: string;
  readonly launcherKind: "native" | "pinned-cmd-shim";
} {
  const launcher = realpathSync(path);
  accessSync(launcher, constants.X_OK);
  requireObservation(statSync(launcher).isFile(), "the selected pnpm launcher is not a regular executable file");
  const bytes = readFileSync(launcher);
  const launcherDigest = digest(bytes);
  if (nativeLinuxAmd64(bytes)) {
    return { executablePath: launcher, executableDigest: launcherDigest, launcherDigest, launcherKind: "native" };
  }
  const match = nativePnpmShim.exec(bytes.toString("utf8"));
  requireObservation(match !== null && digest(bytes.subarray(0, match.index)) === pnpmShimHeader,
    "the selected pnpm launcher is not the pinned native cmd-shim");
  const target = match[1];
  const marker = match[2];
  requireObservation(target !== undefined && marker !== undefined, "the selected pnpm launcher has no verified executable target");
  const relativePrefix = "$basedir/";
  const resolved = resolve(dirname(launcher), target.slice(relativePrefix.length));
  requireObservation(resolved === marker && resolved.endsWith("/pnpm"), "the selected pnpm launcher's executable target differs from its marker");
  let executablePath: string;
  try {
    executablePath = realpathSync(resolved);
    accessSync(executablePath, constants.X_OK);
    requireObservation(statSync(executablePath).isFile(), "the selected pnpm target is not a regular executable file");
  } catch {
    throw new ObservationError("could not resolve an executable file for the selected pnpm launcher");
  }
  const nativeBytes = readFileSync(executablePath);
  requireObservation(nativeLinuxAmd64(nativeBytes), "the selected pnpm target is not a native linux/amd64 executable");
  return { executablePath, executableDigest: digest(nativeBytes), launcherDigest, launcherKind: "pinned-cmd-shim" };
}

// Probe without the checkout's package-manager pin, which can cause an older binary to delegate.
function nativePnpmVersion(path: string): string {
  const directory = mkdtempSync(join(tmpdir(), "ocelle-visual-pnpm-"));
  try {
    return command("native pnpm", ["--version"], { file: path, cwd: directory });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function positive(value: string | undefined): number {
  const number = Number(value);
  requireObservation(/^[1-9]\d*$/.test(value ?? "") && Number.isSafeInteger(number), "missing exact GitHub run or attempt identity");
  return number;
}

function record(env: NodeJS.ProcessEnv): object {
  const { GITHUB_REPOSITORY: repository, GITHUB_EVENT_NAME: event, GITHUB_JOB: job, PATH: path } = env;
  requireObservation(repository === "Ocelle-HQ/ocelle-components" && event === "pull_request" &&
    job === "visual" && path !== undefined && process.platform === "linux" && process.arch === "x64",
  "expected the standard GitHub Visual pull request job");
  const testedMerge = command("git", ["rev-parse", "HEAD"]);
  requireObservation(/^[a-f0-9]{40}$/.test(testedMerge) && env.GITHUB_SHA === testedMerge, "the Visual checkout differs from the tested GitHub merge");
  const runId = positive(env.GITHUB_RUN_ID);
  const attempt = positive(env.GITHUB_RUN_ATTEMPT);
  const unsupported = ["DOCKER_HOST", "DOCKER_CONTEXT", "DOCKER_TLS", "DOCKER_TLS_VERIFY", "DOCKER_CERT_PATH",
    "CONTAINER_HOST", "CONTAINER_CONNECTION", "CONTAINERS_CONF", "CONTAINERS_CONF_OVERRIDE", "PODMAN_CONNECTIONS_CONF"];
  requireObservation(unsupported.every((name) => !env[name]), "the Visual job has a non-default container engine setting");

  const nodePath = executable("node", path);
  requireObservation(realpathSync(process.execPath) === nodePath, "the running Node differs from the selected PATH executable");
  const pnpmPath = executable("pnpm", path);
  const invokingPnpm = env.VISUAL_RUNTIME_PNPM;
  requireObservation(invokingPnpm !== undefined && isAbsolute(invokingPnpm) && realpathSync(invokingPnpm) === pnpmPath,
    "the workspace PATH selected a different pnpm executable than the Visual job");
  const pnpmProof = pnpmIdentity(pnpmPath);
  const dockerContext = command("docker", ["context", "show"]);
  const dockerEndpoint = command("docker", ["context", "inspect", "default", "--format", '{{(index .Endpoints "docker").Host}}']);
  requireObservation(dockerContext === "default" && dockerEndpoint === "unix:///var/run/docker.sock",
    "the Visual job did not use the local default Docker context");
  const dockerClient = command("docker", ["version", "--format", "{{.Client.Version}}"]);
  const dockerServer = command("docker", ["version", "--format", "{{.Server.Version}}"]);
  const dockerClientCommit = command("docker", ["version", "--format", "{{.Client.GitCommit}}"]);
  const dockerServerCommit = command("docker", ["version", "--format", "{{.Server.GitCommit}}"]);
  requireObservation([dockerClientCommit, dockerServerCommit].every((commit) => /^[0-9a-f]{7,40}$/.test(commit)),
    "the local Docker client or server did not report a build commit");

  const plugins = JSON.parse(command("docker", ["info", "--format", "{{json .ClientInfo.Plugins}}"])) as unknown;
  requireObservation(Array.isArray(plugins), "the local Docker client did not report its plugins");
  const buildxPlugins = plugins.filter((entry: unknown): entry is { Name: "buildx"; Path: string; Version: string } =>
    entry !== null && typeof entry === "object" && "Name" in entry && entry.Name === "buildx" &&
    "Path" in entry && typeof entry.Path === "string" && "Version" in entry && typeof entry.Version === "string");
  const buildx = buildxPlugins[0];
  const dockerBuildx = /^github\.com\/docker\/buildx v(\S+) \S+$/.exec(command("docker", ["buildx", "version"]))?.[1];
  requireObservation(buildxPlugins.length === 1 && buildx !== undefined && isAbsolute(buildx.Path) &&
    dockerBuildx !== undefined && buildx.Version === `v${dockerBuildx}`,
  "could not identify the selected local Docker Buildx executable");

  const podmanPath = executable("podman", path);
  // The local info report gets its version from the same build as `podman version`.
  // The first info call can initialize the rootless namespace and storage on a fresh runner.
  const podmanInfo = command("podman", ["info", "--format", "{{.Host.ServiceIsRemote}} {{.Version.Version}}"], { file: podmanPath, timeout: 30_000 });
  const [, remote, podman] = /^(true|false) (\S+)$/.exec(podmanInfo) ?? [];
  requireObservation(podman !== undefined && exactVersion.test(podman), "podman info did not report locality and an exact version");
  const podmanLocal = remote === "false";
  requireObservation(podmanLocal, "the Visual job did not report a local Podman engine");
  const skopeo = /^skopeo version (\S+)$/.exec(command("skopeo", ["--version"]))?.[1];
  const node = /^v(\S+)$/.exec(command("node", ["--version"]))?.[1];
  const pnpm = command("pnpm", ["--version"]);
  requireObservation(pnpm === nativePnpmVersion(pnpmProof.executablePath),
    "the executed pnpm version differs from the verified native executable");
  requireObservation(node !== undefined && node === process.versions.node && skopeo !== undefined &&
    [node, pnpm, dockerClient, dockerServer, dockerBuildx, skopeo].every((version) => exactVersion.test(version)),
  "missing an exact executed tool version in the Visual job");

  return {
    schema: 2, repository, event, job, runId, attempt, testedMerge, platform: "linux/amd64",
    dockerContext, dockerEndpoint, podmanLocal,
    versions: { node, pnpm, dockerClient, dockerServer, dockerClientCommit, dockerServerCommit, dockerBuildx, podman, skopeo },
    pnpmLauncher: { kind: pnpmProof.launcherKind, digest: pnpmProof.launcherDigest },
    executables: {
      node: executableHash(nodePath), pnpm: pnpmProof.executableDigest, docker: executableHash(executable("docker", path)),
      dockerBuildx: executableHash(realpathSync(buildx.Path)), podman: executableHash(podmanPath), skopeo: executableHash(executable("skopeo", path)),
    },
  };
}

if (import.meta.main) {
  try {
    const [destination, previous] = process.argv.slice(2);
    requireObservation(destination !== undefined, "expected a destination for the Visual runtime observation");
    const observation = `${JSON.stringify(record(process.env), null, 2)}\n`;
    requireObservation(previous === undefined || readFileSync(previous, "utf8") === observation,
      "the Visual tool identity changed across the required capture");
    writeFileSync(destination, observation, { flag: "wx" });
    if (previous !== undefined) {
      console.log(`Visual executed tools digest: sha256:${createHash("sha256").update(observation).digest("hex")}`);
    }
  } catch (error: unknown) {
    const detail = error instanceof ObservationError ? error.message : "could not read or write the Visual runtime identity";
    console.error(detail);
    process.exitCode = 1;
  }
}
