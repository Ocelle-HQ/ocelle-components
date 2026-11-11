// The pinned container on the host (FR-007, FR-009, FR-026; contracts/container.md; research.md R-01, R-03, R-06):
// the pin of storybook/visual/container.json, engine resolution with the CI rule, the pin check (reference form,
// the reference's media type, the pull, the pulled image's identity by RepoDigests, Os and Architecture, never .Id),
// and the run arguments of a capture run. Pure, tested in process on recorded and written inspect outputs
// (gates/test/container.test.ts); gates/lib/visual-host.ts only runs the commands these build.
import { basename, join } from "node:path";

/** storybook/visual/container.json (contracts/container.md). */
export interface Pin {
  readonly image: string;
  readonly digest: string;
  readonly platform: string;
  readonly tag: string;
  readonly node: string;
  readonly browser: string;
}

const pinPath = "storybook/visual/container.json";
const pinFields = ["image", "digest", "platform", "tag", "node", "browser"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The pin of a container.json text; throws naming the problem when a field is missing or not text. */
export function parsePin(text: string): Pin {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`${pinPath} is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!isObject(value)) throw new Error(`${pinPath} is not a JSON object`);
  for (const field of pinFields) {
    const text = value[field];
    if (typeof text !== "string" || text === "") throw new Error(`${pinPath}: ${field} must be a non-empty string`);
  }
  return Object.fromEntries(pinFields.map((field) => [field, value[field]])) as unknown as Pin;
}

/** The engines of the two runs, the host (the capture's refusal only), or the cause that stops the gate. */
export type Resolved =
  | { readonly kind: "engines"; readonly engines: readonly [string, string] }
  | { readonly kind: "host" }
  | { readonly kind: "error"; readonly cause: string };

const missing = (name: string): Resolved => ({ kind: "error", cause: `no container engine: ${name} not found` });

/** The engines a `--engine` choice runs under in an environment, given which engine names are available. */
export function resolveEngine(choice: string, env: Readonly<Record<string, string | undefined>>, available: (name: string) => boolean): Resolved {
  if (choice === "host") return { kind: "host" };
  const ci = env.CI === "true" || env.GITHUB_ACTIONS === "true";
  if (choice === "both" || (ci && choice === "auto")) {
    const absent = ["docker", "podman"].find((name) => !available(name));
    return absent === undefined ? { kind: "engines", engines: ["docker", "podman"] } : missing(absent);
  }
  if (choice === "auto") {
    const found = ["docker", "podman"].find((name) => available(name));
    return found === undefined ? { kind: "error", cause: "no container engine (docker or podman) is available" } : { kind: "engines", engines: [found, found] };
  }
  if (!available(choice)) return missing(choice);
  if (ci) return { kind: "error", cause: "in CI the visual gate runs under both docker and podman" };
  return { kind: "engines", engines: [choice, choice] };
}

/** The engines part of the gate's summary: `docker+podman`, or `<engine> only: no cross-engine comparison`. */
export function enginesText(engines: readonly [string, string]): string {
  const [first, second] = engines;
  return first === second ? `${first} only: no cross-engine comparison` : `${first}+${second}`;
}

/** The image reference the pin is pulled and run by: `<image>@<digest>`. */
export function pinReference(pin: Pin): string {
  return `${pin.image}@${pin.digest}`;
}

/** The problem of the pin's form (a digest `sha256:<64 hex>`, platform linux/amd64), or undefined. */
export function referenceProblem(pin: Pin): string | undefined {
  if (!/^sha256:[0-9a-f]{64}$/.test(pin.digest)) return `not pinned by digest: ${pin.digest}`;
  if (pin.platform !== "linux/amd64") return `the pin names platform ${pin.platform}, not linux/amd64`;
  return undefined;
}

/** The engine family of an engine name: podman for a name whose base name holds podman, else docker. */
export function engineFamily(engine: string): "docker" | "podman" {
  return basename(engine).includes("podman") ? "podman" : "docker";
}

/** The commands of the pin check under an engine, each with the engine as its first word. */
export function pinCommands(engine: string, pin: Pin): { readonly mediaType: readonly string[]; readonly pull: readonly string[]; readonly inspect: readonly string[] } {
  const reference = pinReference(pin);
  const mediaType = engineFamily(engine) === "podman" ? ["manifest", "inspect", reference] : ["buildx", "imagetools", "inspect", "--raw", reference];
  return {
    mediaType: [engine, ...mediaType],
    pull: [engine, "pull", "--platform", "linux/amd64", reference],
    inspect: [engine, "image", "inspect", reference],
  };
}

/** The media types of an image index or a manifest list: a pin must never name one (FR-007). */
const indexTypes = ["application/vnd.oci.image.index.v1+json", "application/vnd.docker.distribution.manifest.list.v2+json"];

/** The problem of the reference's raw manifest (an index or manifest list, or no media type), or undefined. */
export function mediaTypeProblem(raw: string): string | undefined {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return "the registry's manifest of the pin is not JSON";
  }
  const mediaType = isObject(value) ? value.mediaType : undefined;
  if (typeof mediaType !== "string" || mediaType === "") return "the registry's manifest of the pin has no media type";
  return indexTypes.includes(mediaType) ? "the pin names an index, not the linux/amd64 manifest" : undefined;
}

/** The problem of the pulled image's `image inspect` output under an engine against the pin, or undefined. */
export function inspectProblem(engine: string, inspect: string, pin: Pin): string | undefined {
  const unreadable = `the image inspect output of ${engine} is not readable`;
  let value: unknown;
  try {
    value = JSON.parse(inspect);
  } catch {
    return unreadable;
  }
  const image = Array.isArray(value) && value.length === 1 && isObject(value[0]) ? value[0] : undefined;
  if (image === undefined) return unreadable;
  const mismatch = (field: string): string => `the pulled image does not match the pin: ${field}`;
  const digests = Array.isArray(image.RepoDigests) ? (image.RepoDigests as unknown[]) : [];
  if (!digests.includes(pinReference(pin))) return mismatch("RepoDigests");
  if (engineFamily(engine) === "podman" && image.Digest !== pin.digest) return mismatch("Digest");
  if (image.Os !== "linux") return mismatch("Os");
  if (image.Architecture !== "amd64") return mismatch("Architecture");
  return undefined;
}

/** What a capture run needs: the engine, the gate's repository, the root under test, the run number and the user. */
export interface RunInput {
  readonly engine: string;
  readonly repo: string;
  readonly root: string;
  readonly run: number;
  readonly uid: number;
  readonly gid: number;
  readonly pin: Pin;
}

/** The output directory of a run in a root: `<root>/storybook/.visual/run-<n>`. */
export function runDir(root: string, run: number): string {
  return join(root, "storybook", ".visual", `run-${String(run)}`);
}

/** The arguments of a capture run after the engine (contracts/container.md § Run arguments). */
export function runArgs(input: RunInput): string[] {
  const out = runDir(input.root, input.run);
  const user = engineFamily(input.engine) === "podman" ? ["--userns=keep-id"] : ["--user", `${String(input.uid)}:${String(input.gid)}`];
  const root = input.root === input.repo ? [] : ["-v", `${input.root}:${input.root}:ro`];
  return [
    "run",
    "--rm",
    "--platform",
    "linux/amd64",
    "--network",
    "none",
    ...user,
    "-v",
    `${input.repo}:${input.repo}:ro`,
    ...root,
    "-v",
    `${out}:${out}`,
    "-e",
    `HOME=${join(out, "home")}`,
    "-e",
    `OCELLE_VISUAL_PIN=${input.pin.digest}`,
    "-w",
    input.repo,
    pinReference(input.pin),
    "node",
    join(input.repo, "gates", "visual", "capture.ts"),
    join(out, "request.json"),
  ];
}
