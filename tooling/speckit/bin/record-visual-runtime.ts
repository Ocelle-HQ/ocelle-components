// Record selected local tool identities without recording CLI configuration, raw output or environment values.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { delimiter, isAbsolute, join } from "node:path";

class ObservationError extends Error {}

function requireObservation(condition: unknown, problem: string): asserts condition {
  if (!condition) throw new ObservationError(problem);
}

function command(name: string, args: readonly string[]): string {
  try {
    return execFileSync(name, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 8_000, maxBuffer: 128 * 1024 }).trim();
  } catch {
    throw new ObservationError(`could not observe ${name} in the Visual job`);
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

function executableHash(path: string): string {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
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

  const podmanLocal = command("podman", ["info", "--format", "{{.Host.ServiceIsRemote}}"]) === "false";
  requireObservation(podmanLocal, "the Visual job did not report a local Podman engine");
  const podman = command("podman", ["version", "--format", "{{.Client.Version}}"]);
  const skopeo = /^skopeo version (\S+)$/.exec(command("skopeo", ["--version"]))?.[1];
  const node = /^v(\S+)$/.exec(command("node", ["--version"]))?.[1];
  const pnpm = command("pnpm", ["--version"]);
  requireObservation(node !== undefined && node === process.versions.node && skopeo !== undefined &&
    [node, pnpm, dockerClient, dockerServer, dockerBuildx, podman, skopeo].every((version) => /^\d+\.\d+\.\d+(?:[.+~:-][\w.+~:-]+)?$/.test(version)),
  "missing an exact executed tool version in the Visual job");

  return {
    schema: 1, repository, event, job, runId, attempt, testedMerge, platform: "linux/amd64",
    dockerContext, dockerEndpoint, podmanLocal,
    versions: { node, pnpm, dockerClient, dockerServer, dockerClientCommit, dockerServerCommit, dockerBuildx, podman, skopeo },
    executables: {
      node: executableHash(nodePath), pnpm: executableHash(pnpmPath), docker: executableHash(executable("docker", path)),
      dockerBuildx: executableHash(realpathSync(buildx.Path)), podman: executableHash(executable("podman", path)), skopeo: executableHash(executable("skopeo", path)),
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
