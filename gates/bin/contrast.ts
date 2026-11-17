// The contrast gate (002 FR-016, FR-017, FR-021; research.md R-07; contracts/gates.md § `contrast`; data-model.md
// § Contrast pair, § Gate findings): every entry of packages/tokens/contrast/pairs.json is computed with the WCAG 2.x
// formula from the token values the root's own generator resolves, compared with its recorded figure at the figure's
// precision and, when checked and not exempt, with its threshold (unrounded); the required pairs derived from the
// intended grounds of the token source must all be listed, and none of them as excluded. `--print` lists the
// required pairs with their computed ratios, for authoring the list.
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit, plural } from "../lib/findings.ts";
import type { Finding, Location } from "../lib/findings.ts";
import { CannotRun, loadTokens, readPairs, requiredPairs, themes, tokenLocator, tokenPaths } from "../lib/token-source.ts";
import type { PairEntry, PairList, RequiredPair, Tokens } from "../lib/token-source.ts";
import { contrastRatio } from "../lib/wcag.ts";

const gate = "contrast";
const thresholds = { text: 4.5, "non-text": 3 } as const;
const hex = /^#[0-9A-Fa-f]{6}$/;

/** A pair as the findings name it: `<theme> <fg> on <bg>`. */
function label(pair: { readonly theme: string; readonly fg: string; readonly bg: string }): string {
  return `${pair.theme} ${pair.fg} on ${pair.bg}`;
}

/** The key of a required pair, kind included. */
function requiredKey(pair: RequiredPair | PairEntry): string {
  return `${label(pair)} ${pair.kind}`;
}

/**
 * Whether a computed ratio matches a recorded figure at the figure's precision: in [figure - ½ unit, figure + ½ unit),
 * which is the ratio rounded half up to the figure's decimals (`5.3` matches [5.25, 5.35)).
 */
function matchesFigure(ratio: number, figure: string): boolean {
  const decimals = figure.split(".")[1]?.length ?? 0;
  return Math.round(ratio * 10 ** decimals) === Number(figure.replace(".", ""));
}

/** The findings of one entry of the list, in the order of data-model.md § Gate findings. */
function entryFindings(tokens: Tokens, entry: PairEntry, required: ReadonlySet<string>, location: Location): Finding[] {
  const finding = (rule: string, message: string): Finding => ({ location, gate, rule, message: `${label(entry)}: ${message}` });
  const names = [entry.fg, entry.bg];
  const known = new Set(tokens.source.map((record) => record.name));
  const unknown = names.filter((name) => !known.has(name));
  if (unknown.length > 0) return [finding("unknown-token", `unknown token ${unknown.join(", ")}`)];
  const [fg, bg] = names.map((name) => tokens.resolve(name, entry.theme)) as [string, string];
  const translucent = names.flatMap((name, index) => (hex.test(index === 0 ? fg : bg) ? [] : [`${name} (${index === 0 ? fg : bg})`]));
  if (translucent.length > 0) return [finding("not-opaque", `not an opaque colour in ${entry.theme}: ${translucent.join(", ")}`)];

  const ratio = contrastRatio(fg, bg);
  const found: Finding[] = [];
  if (!matchesFigure(ratio, entry.figure)) found.push(finding("figure-mismatch", `recorded figure ${entry.figure}, computed ${ratio.toFixed(4)}`));
  const exempt = tokens.source.find((record) => record.name === entry.fg)?.contrast?.exempt === true;
  const threshold = thresholds[entry.kind];
  // Stryker disable next-line EqualityOperator: equivalent, no two 6-digit hex colours give a ratio of exactly 3 or 4.5 (an exhaustive search over all 2^24 relative luminances, by the formula of gates/lib/wcag.ts, found none), so < threshold and <= threshold agree on every input
  if (entry.status === "checked" && !exempt && ratio < threshold) {
    found.push(finding("below-threshold", `${ratio.toFixed(4)}:1 is below the ${entry.kind} threshold of ${String(threshold)}:1`));
  }
  if (entry.status === "excluded") {
    if ((entry.reason ?? "").trim() === "") found.push(finding("excluded-without-reason", "an excluded pair needs a reason"));
    if (required.has(requiredKey(entry))) {
      const message = `a required ${entry.kind} pair cannot be excluded (to stop requiring it, change the intended grounds in the token source)`;
      found.push(finding("required-pair-excluded", message));
    }
  }
  return found;
}

/** The findings of the pair list against the tokens: per entry in list order, then the missing required pairs. */
function check(tokens: Tokens, list: PairList, locate: (name: string) => Location): Finding[] {
  const required = requiredPairs(tokens.source);
  const requiredKeys = new Set(required.map(requiredKey));
  const findings = list.entries.flatMap((entry, index) => entryFindings(tokens, entry, requiredKeys, { path: tokenPaths.pairs, line: Number(list.lines[index]) }));
  const listed = new Set(list.entries.map(requiredKey));
  for (const pair of required) {
    if (listed.has(requiredKey(pair))) continue;
    const message = `${label(pair)}: the required ${pair.kind} pair is not in the pair list`;
    findings.push({ location: locate(pair.fg), gate, rule: "missing-required-pair", message });
  }
  return findings;
}

/** `--print`: each required pair with its computed ratio at four decimals. */
function print(tokens: Tokens, io: Io): number {
  for (const pair of requiredPairs(tokens.source)) {
    const ratio = contrastRatio(tokens.resolve(pair.fg, pair.theme), tokens.resolve(pair.bg, pair.theme));
    io.out(`${label(pair)} (${pair.kind}): ${ratio.toFixed(4)}`);
  }
  return 0;
}

async function contrast(root: string, printing: boolean, io: Io): Promise<number> {
  if (printing) return print(await loadTokens(root), io);
  const list = await readPairs(root);
  if (list.entries.length === 0) throw new CannotRun(tokenPaths.pairs, "the list is empty");
  const tokens = await loadTokens(root);
  const counts = themes.map((theme) => list.entries.filter((entry) => entry.theme === theme).length);
  const empty = themes.find((_, index) => counts[index] === 0);
  if (empty !== undefined) return emit({ exit: 2, cause: `${gate}: cannot run: no pairs for ${empty}` }, io.out, io.err);
  const findings = check(tokens, list, await tokenLocator(root));
  if (findings.length > 0) return emit({ exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")}` }, io.out, io.err);
  const perTheme = requiredPairs(tokens.source).length / themes.length;
  const [light, dark] = counts.map(String) as [string, string];
  return emit({ exit: 0, summary: `${gate}: ${light} pairs checked in light, ${dark} in dark (${String(perTheme)} required per theme)` }, io.out, io.err);
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  try {
    return await contrast(context.root, context.args.includes("--print"), io);
  } catch (error) {
    if (!(error instanceof CannotRun)) throw error;
    return emit({ exit: 2, cause: `${gate}: cannot run: ${error.file}: ${error.message}` }, io.out, io.err);
  }
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/token-gates.test.ts "contrast --root <repo> checks 169 pairs in light and 177 in dark, 158 required per theme"
if (import.meta.main) await main(run);
