// The visual regression gate (FR-003 to FR-012, FR-026 to FR-028, FR-030, FR-031; contracts/gates.md § `visual`):
// `--root <dir>` is the root whose Storybook it builds and captures, `--engine <docker|podman|both|auto|host|<name>>`
// (default auto; in CI both engines whatever is asked, research.md R-06), `--remove-docker-image` (CI's Visual
// regression job: docker's copy of the pin removed after run 1, plan decision 25). Order of a run: engine resolution,
// the option's check, then gates/lib/container.ts `runSteps` (each engine's pin check before its first run, build,
// run 1, the removal, run 2), the verdict per story-theme, stray baselines; the kept files in storybook/.visual/. The
// decisions are gates/lib/container.ts and gates/lib/visual-verdict.ts; this entry and gates/lib/visual-host.ts only
// run the engines and move files (the process boundary, tested by gates/test/integration/visual.test.ts and the
// visual plants).
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";
import { enginesText, removeDockerImageProblem, runSteps } from "../lib/container.ts";
import type { RunStep } from "../lib/container.ts";
import { buildStories, captureRun, clearRuns, clearVisual, engines, pinCheck, readBaselines, readPin, removeDockerCopy, writeFiles } from "../lib/visual-host.ts";
import { judge, keptFiles, parseUpdateArgs, storyThemes, strayBaselines, themes, visualResult } from "../lib/visual-verdict.ts";
import type { Capture, CaptureRequest } from "../lib/visual-verdict.ts";

/** What the gate's run is given: the root, the `--engine` choice, `--remove-docker-image`, the environment and stderr. */
interface VisualInput {
  readonly root: string;
  readonly engine: string;
  readonly removeDockerImage: boolean;
  readonly env: Io["env"];
  readonly note: (line: string) => void;
}

/**
 * The gate on a root (contracts/gates.md § `visual`): engine resolution, the `--remove-docker-image` check, the pin,
 * then the steps of `runSteps` in their order, the verdicts and the stray baselines.
 */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function visual(input: VisualInput): Promise<GateResult> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const { root, env } = input;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  const fail = (cause: string): GateResult => ({ exit: 2, cause: `visual: could not run: ${cause}` });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  const resolved = await engines(input.engine, env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  if (resolved.kind === "error") return fail(resolved.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming both engines when --remove-docker-image comes with docker alone, and runs no docker command"
  const option = input.removeDockerImage ? removeDockerImageProblem(resolved) : undefined;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming both engines when --remove-docker-image comes with docker alone, and runs no docker command"
  if (option !== undefined) return fail(option);
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  const pin = await readPin(root);
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  if ("cause" in pin) return fail(pin.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  let request: CaptureRequest = { stories: [], themes };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const runs: Capture[][] = [];
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const steps: { readonly [K in RunStep["step"]]: (step: Extract<RunStep, { readonly step: K }>) => Promise<string | undefined> } = {
    // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
    pin: (step) => pinCheck([step.engine], pin.value, env),
    // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
    build: async () => {
      // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
      const stories = await buildStories(root, env);
      // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
      if ("cause" in stories) return stories.cause;
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      request = { stories: stories.value.map((story) => story.id), themes };
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
      await clearVisual(root);
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      return undefined;
    },
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    run: async (step) => {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      const done = await captureRun(root, step.run, step.engine, pin.value, [request], env);
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
      if ("cause" in done) return done.cause;
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      runs.push(done.value);
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      return undefined;
    },
    // Stryker disable next-line all: process boundary, covered by CI only: the Visual regression job of tasks.md T045's run, the one place both docker and podman run the gate with --remove-docker-image (plan decision 25)
    remove: async () => {
      // Stryker disable next-line all: process boundary, covered by CI only: the Visual regression job of tasks.md T045's run, the one place both docker and podman run the gate with --remove-docker-image (plan decision 25)
      const note = await removeDockerCopy(pin.value, env);
      // Stryker disable next-line all: process boundary, covered by CI only: the Visual regression job of tasks.md T045's run, the one place both docker and podman run the gate with --remove-docker-image (plan decision 25)
      if (note !== undefined) input.note(note);
      // Stryker disable next-line all: process boundary, covered by CI only: the Visual regression job of tasks.md T045's run, the one place both docker and podman run the gate with --remove-docker-image (plan decision 25)
      return undefined;
    },
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const work = async (): Promise<string | undefined> => {
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    for (const step of runSteps(resolved, input.removeDockerImage)) {
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
      const cause = await (steps[step.step] as (step: RunStep) => Promise<string | undefined>)(step);
      // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
      if (cause !== undefined) return cause;
    }
    // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
    return undefined;
  };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const failed = await work().finally(() => clearRuns(root));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  if (failed !== undefined) return fail(failed);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const [run1 = [], run2 = []] = runs;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const wanted = storyThemes(request);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const baselines = await readBaselines(join(root, "storybook/baselines"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const verdicts = judge(wanted, run1, run2, baselines);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  await writeFiles(join(root, "storybook/.visual"), keptFiles(verdicts, run1, run2, baselines));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return visualResult(verdicts, strayBaselines([...baselines.keys()], wanted), resolved.kind === "engines" ? enginesText(resolved.engines) : "host");
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming both engines when --remove-docker-image comes with docker alone, and runs no docker command"
  const argument = parseUpdateArgs(context.args.filter((arg) => arg !== "--remove-docker-image"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const cause = "cause" in argument ? argument.cause : argument.plant === undefined ? undefined : "--plant is an option of visual:update, not of the gate";
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const result = cause !== undefined || "cause" in argument ? { exit: 2 as const, cause: `visual: could not run: ${String(cause)}` } : await visual({ root: context.root, engine: argument.engine, removeDockerImage: context.args.includes("--remove-docker-image"), env: io.env, note: io.err });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 58 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
if (import.meta.main) await main(run);
