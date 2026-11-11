// The pinned container on the host (FR-007, FR-009, FR-026; contracts/container.md; research.md R-01, R-03, R-06):
// the pin of storybook/visual/container.json, engine resolution with the CI rule, the pin check (reference form,
// the reference's media type, the pull, the pulled image's identity by RepoDigests, Os and Architecture, never .Id),
// and the run arguments of a capture run. Pure, tested in process on recorded and written inspect outputs
// (gates/test/container.test.ts); gates/lib/visual-host.ts only runs the commands these build.

/** storybook/visual/container.json (contracts/container.md). */
export interface Pin {
  readonly image: string;
  readonly digest: string;
  readonly platform: string;
  readonly tag: string;
  readonly node: string;
  readonly browser: string;
}

/** The pin of a container.json text; throws naming the problem when a field is missing or not text. */
export function parsePin(text: string): Pin {
  throw new Error(`not implemented (container, phase 3): ${text}`);
}

/** The engines of the two runs, the host (the capture's refusal only), or the cause that stops the gate. */
export type Resolved =
  | { readonly kind: "engines"; readonly engines: readonly [string, string] }
  | { readonly kind: "host" }
  | { readonly kind: "error"; readonly cause: string };

/** The engines a `--engine` choice runs under in an environment, given which engine names are available. */
export function resolveEngine(choice: string, env: Readonly<Record<string, string | undefined>>, available: (name: string) => boolean): Resolved {
  throw new Error(`not implemented (container, phase 3): ${choice} ${String(Object.keys(env).length)} ${String(available(choice))}`);
}

/** The engines part of the gate's summary: `docker+podman`, or `<engine> only: no cross-engine comparison`. */
export function enginesText(engines: readonly [string, string]): string {
  throw new Error(`not implemented (container, phase 3): ${engines.join(" ")}`);
}

/** The image reference the pin is pulled and run by: `<image>@<digest>`. */
export function pinReference(pin: Pin): string {
  throw new Error(`not implemented (container, phase 3): ${pin.image}`);
}

/** The problem of the pin's form (a digest `sha256:<64 hex>`, platform linux/amd64), or undefined. */
export function referenceProblem(pin: Pin): string | undefined {
  throw new Error(`not implemented (container, phase 3): ${pin.digest}`);
}

/** The engine family of an engine name: podman for a name whose base name holds podman, else docker. */
export function engineFamily(engine: string): "docker" | "podman" {
  throw new Error(`not implemented (container, phase 3): ${engine}`);
}

/** The commands of the pin check under an engine, each with the engine as its first word. */
export function pinCommands(engine: string, pin: Pin): { readonly mediaType: readonly string[]; readonly pull: readonly string[]; readonly inspect: readonly string[] } {
  throw new Error(`not implemented (container, phase 3): ${engine} ${pin.image}`);
}

/** The problem of the reference's raw manifest (an index or manifest list, or no media type), or undefined. */
export function mediaTypeProblem(raw: string): string | undefined {
  throw new Error(`not implemented (container, phase 3): ${raw}`);
}

/** The problem of the pulled image's `image inspect` output under an engine against the pin, or undefined. */
export function inspectProblem(engine: string, inspect: string, pin: Pin): string | undefined {
  throw new Error(`not implemented (container, phase 3): ${engine} ${inspect} ${pin.image}`);
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
  throw new Error(`not implemented (container, phase 3): ${root} ${String(run)}`);
}

/** The arguments of a capture run after the engine (contracts/container.md § Run arguments). */
export function runArgs(input: RunInput): string[] {
  throw new Error(`not implemented (container, phase 3): ${input.engine}`);
}
