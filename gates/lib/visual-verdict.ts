// The verdicts of the visual gate and the baseline command (FR-003 to FR-005, FR-008, FR-026 to FR-028, FR-030,
// FR-031; contracts/gates.md § `visual`, § `visual:update`; data-model.md § Baseline, § Verdict per story-theme;
// research.md R-11): baseline names, the capture results of the two runs, the verdict per story-theme (first match
// wins, one finding at most), stray baselines, the files kept for the contributor, the update plan and its summary
// line, and the plant mode's arguments, own stories and requests. Pure, tested in process
// (gates/test/visual-verdict.test.ts); gates/bin/visual.ts and gates/bin/baselines.ts only hand it files and runs.
import type { Finding, GateResult } from "./findings.ts";
import type { Plant } from "./plant-judge.ts";
import type { IndexStory } from "./storybook-index.ts";

export type Theme = "light" | "dark";

/** The two themes of every story, in capture order. */
export const themes: readonly Theme[] = ["light", "dark"];

/** One story in one theme. */
export interface StoryTheme {
  readonly story: string;
  readonly theme: Theme;
}

/** The status of one capture (contracts/container.md § Capture request and result). */
export type CaptureStatus = "captured" | "render-failed" | "render-timeout" | "closed-shadow-root" | "pointer-target" | "font" | "network" | "io";

/** One entry of a capture's result.json. */
export interface CaptureEntry {
  readonly story: string;
  readonly theme: Theme;
  readonly status: CaptureStatus;
  readonly file?: string;
  readonly message?: string;
  readonly hosts?: readonly string[];
  readonly families?: readonly string[];
  readonly urls?: readonly string[];
  readonly calls?: readonly string[];
}

/** One capture of a run: its result entry and, when captured, the PNG bytes it wrote. */
export interface Capture {
  readonly entry: CaptureEntry;
  readonly bytes?: Uint8Array;
}

/** A capture request (request.json without its directories): the stories and themes to capture. */
export interface CaptureRequest {
  readonly stories: readonly string[];
  readonly themes: readonly Theme[];
}

/** The rule a story-theme ends at (data-model.md § Verdict per story-theme), or `match`. */
export type VerdictRule = Exclude<CaptureStatus, "captured"> | "nondeterministic" | "missing-baseline" | "differs" | "match";

/** The verdict on one story-theme. */
export interface Verdict extends StoryTheme {
  readonly rule: VerdictRule;
  readonly message: string;
}

/** The file name of a story-theme's baseline: `<story-id>.<theme>.png`. */
export function baselineName(story: string, theme: Theme): string {
  throw new Error(`not implemented (visual-verdict, phase 3): ${story} ${theme}`);
}

/** The story-theme a baseline file name names, or undefined when it does not parse. */
export function parseBaselineName(name: string): StoryTheme | undefined {
  throw new Error(`not implemented (visual-verdict, phase 3): ${name}`);
}

/** Every story in each theme, story by story, in request order. */
export function storyThemes(request: CaptureRequest): StoryTheme[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(request.stories.length)}`);
}

/** The entries of a capture's result.json text; throws naming the problem when it is not a list of valid entries. */
export function parseResult(text: string): CaptureEntry[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${text}`);
}

/** The verdict on one story-theme from its two captures and its baseline (undefined: none). */
export function verdictOf(run1: Capture, run2: Capture, baseline: Uint8Array | undefined): { readonly rule: VerdictRule; readonly message: string } {
  throw new Error(`not implemented (visual-verdict, phase 3): ${run1.entry.story} ${run2.entry.story} ${String(baseline?.length)}`);
}

/**
 * The verdict on each wanted story-theme, in order, from the two runs' captures and the baselines by file name;
 * throws naming a story-theme a run has no capture of.
 */
export function judge(wanted: readonly StoryTheme[], run1: readonly Capture[], run2: readonly Capture[], baselines: ReadonlyMap<string, Uint8Array>): Verdict[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(wanted.length)} ${String(run1.length)} ${String(run2.length)} ${String(baselines.size)}`);
}

/** The baseline files that name no known story-theme or do not parse, in name order. */
export function strayBaselines(names: readonly string[], known: readonly StoryTheme[]): string[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(names.length)} ${String(known.length)}`);
}

/** The findings of the verdicts (matches give none) and of the stray baselines, which lie in `baselinesDir`. */
export function visualFindings(verdicts: readonly Verdict[], stray: readonly string[], baselinesDir: string): Finding[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(verdicts.length)} ${String(stray.length)} ${baselinesDir}`);
}

/** The gate's result: exit 0 naming the captures and the engines, else exit 1 with the findings. */
export function visualResult(verdicts: readonly Verdict[], stray: readonly string[], engines: string): GateResult {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(verdicts.length)} ${String(stray.length)} ${engines}`);
}

/** One file the gate keeps for the contributor, relative to storybook/.visual/. */
export interface KeptFile {
  readonly path: string;
  readonly bytes: Uint8Array;
}

/**
 * The files FR-005 keeps, relative to storybook/.visual/: for `differs` the capture and the diff image, for
 * `nondeterministic` both runs' captures, and for `differs` and `missing-baseline` run 1's capture in baseline layout.
 */
export function keptFiles(verdicts: readonly Verdict[], run1: readonly Capture[], run2: readonly Capture[], baselines: ReadonlyMap<string, Uint8Array>): KeptFile[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(verdicts.length)} ${String(run1.length)} ${String(run2.length)} ${String(baselines.size)}`);
}

/** One baseline the update writes: its file name, bytes, and whether it is new (added) or replaces one (changed). */
export interface BaselineWrite {
  readonly file: string;
  readonly bytes: Uint8Array;
  readonly kind: "added" | "changed";
}

/** What the baseline command writes and removes, or the findings that make it write nothing. */
export type UpdatePlan = { readonly write: readonly BaselineWrite[]; readonly remove: readonly string[] } | { readonly refuse: readonly Finding[] };

/** The update plan of the verdicts (research.md R-11): refuse on steps 1 to 8, else write added and changed, remove stray. */
export function updatePlan(verdicts: readonly Verdict[], run1: readonly Capture[], stray: readonly string[], baselinesDir: string): UpdatePlan {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(verdicts.length)} ${String(run1.length)} ${String(stray.length)} ${baselinesDir}`);
}

/** The summary line of an update that writes (contracts/gates.md § `visual:update`). */
export function updateSummary(plan: { readonly write: readonly BaselineWrite[]; readonly remove: readonly string[] }): string {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(plan.write.length)}`);
}

/** The arguments of the baseline command. */
export interface UpdateArgs {
  readonly engine: string;
  readonly plant?: string;
  readonly story?: string;
}

/** The baseline command's arguments (`--engine`, `--plant`, `--story`), or the cause that stops it. */
export function parseUpdateArgs(args: readonly string[]): UpdateArgs | { readonly cause: string } {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(args.length)}`);
}

/** The cause that stops the plant mode before any build, or undefined (`spec` undefined: no such plant). */
export function plantModeProblem(plant: string, spec: Plant | undefined, story: string | undefined): string | undefined {
  throw new Error(`not implemented (visual-verdict, phase 3): ${plant} ${String(spec?.expect)} ${String(story)}`);
}

/** The ids of the index's stories whose story file is a file of the plant's tree/ (paths relative to tree/). */
export function ownStories(index: readonly IndexStory[], treeFiles: readonly string[]): string[] {
  throw new Error(`not implemented (visual-verdict, phase 3): ${String(index.length)} ${String(treeFiles.length)}`);
}

/**
 * The plant mode's capture requests from the plant's own stories: one request of them in both themes, or with
 * `--story` one single-story-theme request per theme; or the cause that stops it.
 */
export function plantRequests(plant: string, own: readonly string[], story: string | undefined): readonly CaptureRequest[] | { readonly cause: string } {
  throw new Error(`not implemented (visual-verdict, phase 3): ${plant} ${String(own.length)} ${String(story)}`);
}

/** The directory the plant mode writes a plant's baselines to. */
export function plantBaselinesDir(plant: string): string {
  throw new Error(`not implemented (visual-verdict, phase 3): ${plant}`);
}
