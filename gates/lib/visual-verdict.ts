// The verdicts of the visual gate and the baseline command (FR-003 to FR-005, FR-008, FR-026 to FR-028, FR-030,
// FR-031; contracts/gates.md § `visual`, § `visual:update`; data-model.md § Baseline, § Verdict per story-theme;
// research.md R-11): baseline names, the capture results of the two runs, the verdict per story-theme (first match
// wins, one finding at most), stray baselines, the files kept for the contributor, the update plan and its summary
// line, and the plant mode's arguments, own stories and requests. Pure, tested in process
// (gates/test/visual-verdict.test.ts); gates/bin/visual.ts and gates/bin/baselines.ts only hand it files and runs.
import { plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";
import type { Plant } from "./plant-judge.ts";
import { diffImage } from "./png.ts";
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

const gate = "visual";
const statuses: readonly CaptureStatus[] = ["captured", "render-failed", "render-timeout", "closed-shadow-root", "pointer-target", "font", "network", "io"];
/** The statuses that end a story-theme's verdict at steps 1 to 7, in that order (data-model.md § Verdict per story-theme). */
const refusing: readonly Exclude<CaptureStatus, "captured">[] = ["render-failed", "render-timeout", "closed-shadow-root", "pointer-target", "font", "network", "io"];
/** A baseline file name: `<story-id>.<theme>.png` with Storybook's story id form (data-model.md § Story). */
const baselineFile = /^([a-z0-9-]+--[a-z0-9-]+)\.(light|dark)\.png$/;

/** The file name of a story-theme's baseline: `<story-id>.<theme>.png`. */
export function baselineName(story: string, theme: Theme): string {
  return `${story}.${theme}.png`;
}

/** The story-theme a baseline file name names, or undefined when it does not parse. */
export function parseBaselineName(name: string): StoryTheme | undefined {
  const match = baselineFile.exec(name);
  if (match === null) return undefined;
  return { story: String(match[1]), theme: match[2] === "dark" ? "dark" : "light" };
}

/** Every story in each theme, story by story, in request order. */
export function storyThemes(request: CaptureRequest): StoryTheme[] {
  return request.stories.flatMap((story) => request.themes.map((theme) => ({ story, theme })));
}

/** The entries of a capture's result.json text; throws naming the problem when it is not a list of valid entries. */
export function parseResult(text: string): CaptureEntry[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`result.json is not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("result.json is not a list");
  return (value as unknown[]).map((item, index) => {
    const at = `result.json#${String(index)}`;
    const entry = Object(item) as Record<string, unknown>;
    if (typeof entry.story !== "string" || entry.story === "") throw new Error(`${at} has no story`);
    if (entry.theme !== "light" && entry.theme !== "dark") throw new Error(`${at} has no theme light or dark`);
    const status = statuses.find((known) => known === entry.status);
    if (status === undefined) throw new Error(`${at} has an unknown status ${String(entry.status)}`);
    if (status === "captured" && (typeof entry.file !== "string" || entry.file === "")) throw new Error(`${at} is captured and names no file`);
    const details: CaptureEntry = { ...entry, story: entry.story, theme: entry.theme, status };
    return details;
  });
}

/** The message of a refusing capture's status, from its details. */
function statusMessage(entry: CaptureEntry): string {
  const list = (items: readonly string[] | undefined): string => (items ?? []).join(", ");
  switch (entry.status) {
    case "closed-shadow-root":
      return `closed shadow root attached by ${list(entry.hosts)}`;
    case "font":
      return `text drawn in faces other than Schibsted Grotesk: ${list(entry.families)}`;
    case "network":
      return `requests outside the origin: ${list(entry.urls)}`;
    case "io":
      return `run-time I/O: ${list(entry.calls)}`;
    default:
      return entry.message ?? "";
  }
}

/** Whether two byte arrays hold the same bytes. */
function same(a: Uint8Array | undefined, b: Uint8Array | undefined): boolean {
  return a !== undefined && b !== undefined && Buffer.from(a).equals(Buffer.from(b));
}

/** The verdict on one story-theme from its two captures and its baseline (undefined: none). */
export function verdictOf(run1: Capture, run2: Capture, baseline: Uint8Array | undefined): { readonly rule: VerdictRule; readonly message: string } {
  for (const status of refusing) {
    const failed = [run1, run2].find((capture) => capture.entry.status === status);
    if (failed !== undefined) return { rule: status, message: statusMessage(failed.entry) };
  }
  if (!same(run1.bytes, run2.bytes)) return { rule: "nondeterministic", message: "run 1 and run 2 differ" };
  const file = baselineName(run1.entry.story, run1.entry.theme);
  if (baseline === undefined) return { rule: "missing-baseline", message: `no baseline ${file}` };
  if (!same(run1.bytes, baseline)) return { rule: "differs", message: `the capture differs from its baseline ${file}` };
  return { rule: "match", message: "" };
}

/** The capture of a story-theme in a run, or throws naming the run and the story-theme. */
function captureOf(captures: readonly Capture[], at: StoryTheme, run: number): Capture {
  const found = captures.find((capture) => capture.entry.story === at.story && capture.entry.theme === at.theme);
  if (found === undefined) throw new Error(`run ${String(run)} has no capture of ${at.story}/${at.theme}`);
  return found;
}

/**
 * The verdict on each wanted story-theme, in order, from the two runs' captures and the baselines by file name;
 * throws naming a story-theme a run has no capture of.
 */
export function judge(wanted: readonly StoryTheme[], run1: readonly Capture[], run2: readonly Capture[], baselines: ReadonlyMap<string, Uint8Array>): Verdict[] {
  return wanted.map((at) => ({ ...at, ...verdictOf(captureOf(run1, at, 1), captureOf(run2, at, 2), baselines.get(baselineName(at.story, at.theme))) }));
}

/** The baseline files that name no known story-theme or do not parse, in name order. */
export function strayBaselines(names: readonly string[], known: readonly StoryTheme[]): string[] {
  const knows = (name: string): boolean => {
    const at = parseBaselineName(name);
    return at !== undefined && known.some((each) => each.story === at.story && each.theme === at.theme);
  };
  return names.filter((name) => !knows(name)).sort();
}

/** The finding of a verdict that is not a match. */
function verdictFinding(verdict: Verdict): Finding {
  return { location: { path: `${verdict.story}/${verdict.theme}` }, gate, rule: verdict.rule, message: verdict.message };
}

/** The findings of the verdicts (matches give none) and of the stray baselines, which lie in `baselinesDir`. */
export function visualFindings(verdicts: readonly Verdict[], stray: readonly string[], baselinesDir: string): Finding[] {
  return [
    ...verdicts.filter((verdict) => verdict.rule !== "match").map(verdictFinding),
    ...stray.map((file): Finding => ({ location: { path: `${baselinesDir}/${file}` }, gate, rule: "stray-baseline", message: "the baseline names no story-theme of the index" })),
  ];
}

/** The gate's result: exit 0 naming the captures and the engines, else exit 1 with the findings. */
export function visualResult(verdicts: readonly Verdict[], stray: readonly string[], engines: string): GateResult {
  const findings = visualFindings(verdicts, stray, "storybook/baselines");
  if (findings.length === 0) {
    const count = verdicts.length;
    return { exit: 0, summary: `${gate}: ${plural(count, "capture")} ${count === 1 ? "matches its baseline" : "match their baselines"} (${engines})` };
  }
  return { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(verdicts.length, "story-theme")} (${engines})` };
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
  const kept: KeptFile[] = [];
  for (const verdict of verdicts) {
    const stem = `${verdict.story}.${verdict.theme}`;
    const first = captureOf(run1, verdict, 1).bytes ?? new Uint8Array();
    if (verdict.rule === "differs") {
      const baseline = baselines.get(baselineName(verdict.story, verdict.theme)) ?? new Uint8Array();
      kept.push({ path: `${stem}.actual.png`, bytes: first }, { path: `${stem}.diff.png`, bytes: diffImage(baseline, first).image });
    }
    if (verdict.rule === "differs" || verdict.rule === "missing-baseline") kept.push({ path: `baselines/${stem}.png`, bytes: first });
    if (verdict.rule === "nondeterministic") {
      kept.push({ path: `${stem}.run-1.png`, bytes: first }, { path: `${stem}.run-2.png`, bytes: captureOf(run2, verdict, 2).bytes ?? new Uint8Array() });
    }
  }
  return kept;
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
  const refused = verdicts.filter((verdict) => verdict.rule !== "match" && verdict.rule !== "missing-baseline" && verdict.rule !== "differs");
  if (refused.length > 0) return { refuse: visualFindings(refused, [], baselinesDir) };
  const write = verdicts.flatMap((verdict): BaselineWrite[] => {
    if (verdict.rule === "match") return [];
    const bytes = captureOf(run1, verdict, 1).bytes ?? new Uint8Array();
    return [{ file: baselineName(verdict.story, verdict.theme), bytes, kind: verdict.rule === "missing-baseline" ? "added" : "changed" }];
  });
  return { write, remove: [...stray] };
}

/** The summary line of an update that writes (contracts/gates.md § `visual:update`). */
export function updateSummary(plan: { readonly write: readonly BaselineWrite[]; readonly remove: readonly string[] }): string {
  const added = plan.write.filter((file) => file.kind === "added").length;
  const bytes = plan.write.reduce((sum, file) => sum + file.bytes.length, 0);
  const counts = `${String(added)} added, ${String(plan.write.length - added)} changed, ${String(plan.remove.length)} removed`;
  return `baselines: wrote ${String(plan.write.length)} files (${counts}), ${String(bytes)} bytes in total`;
}

/** The arguments of the baseline command. */
export interface UpdateArgs {
  readonly engine: string;
  readonly plant?: string;
  readonly story?: string;
}

const updateOptions = new Set(["--engine", "--plant", "--story"]);

/** The baseline command's arguments (`--engine`, `--plant`, `--story`), or the cause that stops it. */
export function parseUpdateArgs(args: readonly string[]): UpdateArgs | { readonly cause: string } {
  const values = new Map<string, string>();
  for (let i = 0; i < args.length; i += 2) {
    const option = String(args[i]);
    if (!updateOptions.has(option)) return { cause: `unknown argument ${option}` };
    const value = args[i + 1];
    if (value === undefined || value.startsWith("--")) return { cause: `${option} needs a value` };
    values.set(option, value);
  }
  const plant = values.get("--plant");
  const story = values.get("--story");
  if (story !== undefined && plant === undefined) return { cause: "--story needs --plant" };
  return { engine: values.get("--engine") ?? "auto", ...(plant === undefined ? {} : { plant }), ...(story === undefined ? {} : { story }) };
}

/** The cause that stops the plant mode before any build, or undefined (`spec` undefined: no such plant). */
export function plantModeProblem(plant: string, spec: Plant | undefined, story: string | undefined): string | undefined {
  if (!plant.startsWith("visual/")) return `${plant} is not a visual plant`;
  if (spec === undefined) return `no such plant: gates/plants/${plant}`;
  if (spec.baselinesOf !== undefined) return `${plant}: its baselines are those of visual/${spec.baselinesOf}`;
  if (spec.captureAlone === true && story === undefined) return `${plant} is captured alone: give --story <id>`;
  return undefined;
}

/** The ids of the index's stories whose story file is a file of the plant's tree/ (paths relative to tree/). */
export function ownStories(index: readonly IndexStory[], treeFiles: readonly string[]): string[] {
  const files = new Set(treeFiles);
  const file = (importPath: string): string => `storybook/${importPath.startsWith("./") ? importPath.slice(2) : importPath}`;
  return index.filter((story) => files.has(file(story.importPath))).map((story) => story.id);
}

/**
 * The plant mode's capture requests from the plant's own stories: one request of them in both themes, or with
 * `--story` one single-story-theme request per theme; or the cause that stops it.
 */
export function plantRequests(plant: string, own: readonly string[], story: string | undefined): readonly CaptureRequest[] | { readonly cause: string } {
  if (own.length === 0) return { cause: `${plant} has no story of its own` };
  if (story === undefined) return [{ stories: [...own], themes: [...themes] }];
  if (!own.includes(story)) return { cause: `--story ${story} is not one of the own stories of ${plant} (${own.join(", ")})` };
  return themes.map((theme) => ({ stories: [story], themes: [theme] }));
}

/** The directory the plant mode writes a plant's baselines to. */
export function plantBaselinesDir(plant: string): string {
  return `gates/plants/${plant}/tree/storybook/baselines`;
}
