// The visual regression gate (FR-003 to FR-012, FR-026 to FR-028, FR-030, FR-031; contracts/gates.md § `visual`):
// `--root <dir>` is the root whose Storybook it builds and captures, `--engine <docker|podman|both|auto|host|<name>>`
// (default auto; in CI both engines whatever is asked, research.md R-06). Order of a run: engine resolution, pin
// check, build, run 1, run 2, the verdict per story-theme, stray baselines; the kept files in storybook/.visual/. The
// decisions are gates/lib/container.ts and gates/lib/visual-verdict.ts; this entry and gates/lib/visual-host.ts only
// run the engines and move files (the process boundary, tested by gates/test/integration/visual.test.ts and the
// visual plants).
import { join } from "node:path";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit } from "../lib/findings.ts";
import type { GateResult } from "../lib/findings.ts";
import { enginesText } from "../lib/container.ts";
import { buildStories, captureRuns, clearVisual, engines, pinCheck, readBaselines, readPin, writeFiles } from "../lib/visual-host.ts";
import { judge, keptFiles, parseUpdateArgs, storyThemes, strayBaselines, themes, visualResult } from "../lib/visual-verdict.ts";

/** The gate on a root (contracts/gates.md § `visual`). */
// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function visual(root: string, engine: string, env: Io["env"]): Promise<GateResult> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  const fail = (cause: string): GateResult => ({ exit: 2, cause: `visual: could not run: ${cause}` });
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  const resolved = await engines(engine, env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 naming a missing engine, and in CI refuses a single engine (research.md R-06)"
  if (resolved.kind === "error") return fail(resolved.cause);
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  const pin = await readPin(root);
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  if ("cause" in pin) return fail(pin.cause);
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  const pinned = resolved.kind === "engines" ? await pinCheck(resolved.engines, pin.value, env) : undefined;
  // Stryker disable next-line all: process boundary, covered by the visual plants error-tag-pin and error-index-pin
  if (pinned !== undefined) return fail(pinned);
  // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
  const stories = await buildStories(root, env);
  // Stryker disable next-line all: process boundary, covered by the visual plant error-build-fails
  if ("cause" in stories) return fail(stories.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const request = { stories: stories.value.map((story) => story.id), themes };
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  await clearVisual(root);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const runs = await captureRuns(root, resolved, pin.value, [request], env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  if ("cause" in runs) return fail(runs.cause);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const [run1, run2] = runs.value;
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const wanted = storyThemes(request);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const baselines = await readBaselines(join(root, "storybook/baselines"));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const verdicts = judge(wanted, run1, run2, baselines);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "keeps the capture, its diff image and run 1 in baseline layout for differs and missing-baseline, and nothing for any other story-theme (FR-005, analysis G2)"
  await writeFiles(join(root, "storybook/.visual"), keptFiles(verdicts, run1, run2, baselines));
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return visualResult(verdicts, strayBaselines([...baselines.keys()], wanted), resolved.kind === "engines" ? enginesText(resolved.engines) : "host");
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
export async function run(argv: readonly string[], io: Io): Promise<number> {
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const context = parseArgs(argv, io.cwd);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const argument = parseUpdateArgs(context.args);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "exits 2 for the host engine, naming the capture's refusal (FR-009, US2 scenario 7)"
  const cause = "cause" in argument ? argument.cause : argument.plant === undefined ? undefined : "--plant is an option of visual:update, not of the gate";
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  const result = cause !== undefined || "cause" in argument ? { exit: 2 as const, cause: `visual: could not run: ${String(cause)}` } : await visual(context.root, argument.engine, io.env);
  // Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
  return emit(result, io.out, io.err);
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/visual.test.ts "captures the repository's 24 story-themes twice under docker and exits 0 naming them and the engine (US2 scenario 1)"
if (import.meta.main) await main(run);
