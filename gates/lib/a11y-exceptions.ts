// The axe gate's exceptions (FR-029; data-model.md § Exception; research.md R-08): storybook/a11y-exceptions.json, a
// list of { story, theme, rule, selector, reason, sunset, plan } entries, every field a non-empty string. An entry is
// honoured only when its plan's `## Complexity Tracking` section holds a table row naming the same story, theme, rule
// and selector (each in backticks, a `|` written `\|`) and the sunset; an honoured entry excepts the one node of its
// rule with its selector in its story-theme. Pure, tested in process (gates/test/a11y-exceptions.test.ts).
import { posix } from "node:path";

/** One exception entry. */
export interface Exception {
  readonly story: string;
  readonly theme: string;
  readonly rule: string;
  readonly selector: string;
  readonly reason: string;
  readonly sunset: string;
  readonly plan: string;
}

/** The exceptions file of a root. */
export const exceptionsPath = "storybook/a11y-exceptions.json";

/** An entry and whether its plan records it (honoured), or why not. */
export type ExceptionState = { readonly entry: Exception; readonly recorded: true } | { readonly entry: Exception; readonly recorded: false; readonly reason: string };

/** A serious or critical node an exception may match: its story-theme, rule (`<id>` or `<id>-incomplete`) and selector. */
export interface Candidate {
  readonly story: string;
  readonly theme: string;
  readonly rule: string;
  readonly selector: string;
}

/** The fields of an entry, in the order they are checked. */
const fields = ["story", "theme", "rule", "selector", "reason", "sunset", "plan"] as const;

/** The entries of an exceptions file, or the problem that makes the gate unable to run. */
export function parseExceptions(text: string): Exception[] | { readonly problem: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { problem: `${exceptionsPath} is not valid JSON (${(error as Error).message})` };
  }
  if (!Array.isArray(parsed)) return { problem: `${exceptionsPath} is not a list of exception entries` };
  const entries: Exception[] = [];
  for (const [index, item] of (parsed as unknown[]).entries()) {
    const at = `${exceptionsPath}#${String(index)}`;
    if (typeof item !== "object" || item === null) return { problem: `${at} is not an object` };
    const record = item as Record<string, unknown>;
    const missing = fields.find((field) => {
      const value = record[field];
      return typeof value !== "string" || value.trim() === "";
    });
    if (missing !== undefined) return { problem: `${at}: ${missing} must be a non-empty string` };
    const entry = Object.fromEntries(fields.map((field) => [field, String(record[field])])) as unknown as Exception;
    if (entry.theme !== "light" && entry.theme !== "dark") return { problem: `${at}: theme must be light or dark` };
    const plan = posix.normalize(entry.plan);
    if (posix.isAbsolute(plan) || plan === ".." || plan.startsWith("../")) return { problem: `${at}: plan must be a path inside the repository` };
    entries.push(entry);
  }
  return entries;
}

/** The cells of a Markdown table row: split at each bare `|`, `\|` unescaped, trimmed. */
function cells(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replaceAll("\\|", "|").trim());
}

/** The table rows of a plan's `## Complexity Tracking` section, as cells with `\|` unescaped. */
export function complexityRows(plan: string): string[][] {
  const lines = plan.split("\n");
  const start = lines.indexOf("## Complexity Tracking");
  if (start === -1) return [];
  const rows: string[][] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith("## ")) break;
    if (line.startsWith("|") && !/^\|[\s|:-]*$/.test(line)) rows.push(cells(line));
  }
  return rows;
}

/** Whether a plan's text (undefined: no such file) records an entry. */
export function recordedIn(entry: Exception, plan: string | undefined): ExceptionState {
  if (plan === undefined) return { entry, recorded: false, reason: `${entry.plan} does not exist` };
  const named = [entry.story, entry.theme, entry.rule, entry.selector].map((value) => `\`${value}\``);
  const recorded = complexityRows(plan).some((row) => named.every((cell) => row.includes(cell)) && row.includes(entry.sunset));
  if (recorded) return { entry, recorded: true };
  return { entry, recorded: false, reason: `${entry.plan}'s Complexity Tracking holds no row naming the entry's story, theme, rule, selector and sunset` };
}

/** Which candidates the honoured entries except (candidate index to entry index), and the entries that matched none. */
export function matchExceptions(candidates: readonly Candidate[], states: readonly ExceptionState[]): { readonly excepted: ReadonlyMap<number, number>; readonly stale: readonly number[] } {
  const excepted = new Map<number, number>();
  const stale: number[] = [];
  for (const [index, state] of states.entries()) {
    if (!state.recorded) continue;
    const { entry } = state;
    const at = candidates.findIndex((node, which) => !excepted.has(which) && node.story === entry.story && node.theme === entry.theme && node.rule === entry.rule && node.selector === entry.selector);
    if (at === -1) stale.push(index);
    else excepted.set(at, index);
  }
  return { excepted, stale };
}
