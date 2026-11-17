// The brand-rules gate (002 FR-018, FR-019; research.md R-08; contracts/gates.md § `brand-rules`): the brand rules
// that hold on the token values alone, checked on the token source and the stylesheet the root's own generator makes
// from it (no build), and on the pair list for rule (b). It loads and validates the source first; a source or
// generator that does not load or throws, a source that fails validation, or a pair list that cannot be read is exit
// 2. Rules: (a) monospace-font, (b) link-accent, (c) radius-set, (d) rule-boundary, (e) dark-chrome, (f)
// reduced-motion, (g) forced-colours; one finding per token, entry or declaration that breaks a rule, in rule order.
import postcss from "postcss";
import type { AtRule, Root } from "postcss";
import { main, parseArgs } from "../lib/cli.ts";
import type { Io } from "../lib/cli.ts";
import { emit, plural } from "../lib/findings.ts";
import type { Finding, Location } from "../lib/findings.ts";
import { CannotRun, loadTokens, readPairs, themes, tokenLocator, tokenPaths } from "../lib/token-source.ts";
import type { PairList, Theme, Tokens } from "../lib/token-source.ts";
import { contrastRatio, relativeLuminance } from "../lib/wcag.ts";
import { monospaceFamilies } from "./prefix.ts";

const gate = "brand-rules";
const hex = /^#[0-9A-Fa-f]{6}$/;
/** FR-022's monospace families as whole names, any case, any run of spaces inside a name. */
const monospace = new RegExp(`(?<![\\w-])(?:${monospaceFamilies.map((family) => family.replace(/ /g, "\\s+")).join("|")})(?![\\w-])`, "gi");
/** FR-019 (c): the closed radius set and the value of each. */
const radii: ReadonlyMap<string, string> = new Map([
  ["radius-1", "2px"],
  ["radius-2", "4px"],
  ["radius-row", "6px"],
  ["radius-shell", "10px"],
  ["radius-pill", "999px"],
]);
/** A duration in milliseconds, as a motion token states one (`120ms`). */
const duration = /^\d+(?:\.\d+)?ms$/;
/** The system colour keywords of CSS Color 4 (FR-018). */
export const systemColours: readonly string[] = [
  "AccentColor",
  "AccentColorText",
  "ActiveText",
  "ButtonBorder",
  "ButtonFace",
  "ButtonText",
  "Canvas",
  "CanvasText",
  "Field",
  "FieldText",
  "GrayText",
  "Highlight",
  "HighlightText",
  "LinkText",
  "Mark",
  "MarkText",
  "SelectedItem",
  "SelectedItemText",
  "VisitedText",
];
const systemColourNames = new Set(systemColours.map((name) => name.toLowerCase()));

/** What the rules read: the tokens, the pair list, the stylesheet and where a token is. */
interface Inputs {
  readonly tokens: Tokens;
  readonly pairs: PairList;
  readonly stylesheet: Root;
  readonly locate: (name: string) => Location;
}

/** A rule's finding at a location. */
type Found = (location: Location, message: string) => void;

/** A resolved colour, or the problem that the token is missing or not opaque. */
type Colour = { readonly hex: string } | { readonly problem: string };

/** A token's resolved colour in a theme, or the problem that it is missing or not opaque. */
function colour(inputs: Inputs, name: string, theme: Theme): Colour {
  if (!inputs.tokens.source.some((record) => record.name === name)) return { problem: `${name} is missing` };
  const value = inputs.tokens.resolve(name, theme);
  return hex.test(value) ? { hex: value.toUpperCase() } : { problem: `${name} is not an opaque colour in ${theme}` };
}

/**
 * The problems of one token against grounds in both themes: the message `issue(ratio, ground, theme)` gives when the
 * ratio breaks the rule, else undefined; a missing or translucent token is a problem of its own.
 */
function ratioProblems(inputs: Inputs, name: string, grounds: readonly string[], issue: (ratio: number, ground: string, theme: Theme) => string | undefined): string[] {
  const problems: string[] = [];
  for (const theme of themes) {
    const fg = colour(inputs, name, theme);
    if ("problem" in fg) {
      problems.push(fg.problem);
      continue;
    }
    for (const ground of grounds) {
      const bg = colour(inputs, ground, theme);
      const problem = "problem" in bg ? bg.problem : issue(contrastRatio(fg.hex, bg.hex), ground, theme);
      if (problem !== undefined) problems.push(problem);
    }
  }
  return [...new Set(problems)];
}

/** Reports a token's problems as one finding at its location (or at the token source when it is missing). */
function reportToken(inputs: Inputs, found: Found, name: string, problems: readonly string[]): void {
  if (problems.length > 0) found(inputs.locate(name), problems.join("; "));
}

/** (a) No type token names a monospace family. */
function monospaceFont(inputs: Inputs, found: Found): void {
  for (const record of inputs.tokens.source) {
    if (record.group !== "type") continue;
    const families = [...new Set(JSON.stringify(record.value).match(monospace))];
    if (families.length > 0) found(inputs.locate(record.name), `${record.name} names the monospace family ${families.join(", ")}`);
  }
}

/** (b) color-link differs from color-accent and meets 4.5:1 on canvas and sheet; ochre on bone is an excluded text pair. */
function linkAccent(inputs: Inputs, found: Found): void {
  const equal = themes.flatMap((theme) => {
    const link = colour(inputs, "color-link", theme);
    const accent = colour(inputs, "color-accent", theme);
    return "hex" in link && "hex" in accent && link.hex === accent.hex ? [`color-link equals color-accent in ${theme}`] : [];
  });
  const below = ratioProblems(inputs, "color-link", ["color-canvas", "color-sheet"], (ratio, ground, theme) =>
    // Stryker disable next-line EqualityOperator: equivalent, no two 6-digit hex colours give a ratio of exactly 4.5 (an exhaustive search over all 2^24 relative luminances, by the formula of gates/lib/wcag.ts, found none), so < 4.5 and <= 4.5 agree on every input
    ratio < 4.5 ? `color-link is ${ratio.toFixed(4)}:1 on ${ground} in ${theme}, below 4.5:1` : undefined,
  );
  reportToken(inputs, found, "color-link", [...equal, ...below]);
  const { entries, lines } = inputs.pairs;
  const at = entries.findIndex((entry) => entry.theme === "light" && entry.fg === "color-accent" && entry.bg === "color-canvas");
  const entry = entries[at];
  if (entry?.status === "excluded" && entry.kind === "text") return;
  const location: Location = entry === undefined ? inputs.locate("color-accent") : { path: tokenPaths.pairs, line: Number(lines[at]) };
  found(location, "the pair color-accent on color-canvas in light is not listed as an excluded text pair");
}

/** (c) The radius tokens are exactly the closed set, each with its value. */
function radiusSet(inputs: Inputs, found: Found): void {
  const set = [...radii.keys()].join(", ");
  for (const record of inputs.tokens.source) {
    if (!record.name.startsWith("radius-")) continue;
    const expected = radii.get(record.name);
    const value = inputs.tokens.resolve(record.name, "light");
    if (expected === undefined) found(inputs.locate(record.name), `${record.name} is not in the closed radius set (${set})`);
    else if (value !== expected) found(inputs.locate(record.name), `${record.name} is ${value}, expected ${expected}`);
  }
  for (const name of radii.keys()) {
    if (!inputs.tokens.source.some((record) => record.name === name)) found(inputs.locate(name), `${name} is missing`);
  }
}

/** (d) The decorative rules stay below 3:1 on canvas and sheet, the control border at or above it. */
function ruleBoundary(inputs: Inputs, found: Found): void {
  const grounds = ["color-canvas", "color-sheet"];
  for (const name of ["color-rule", "color-rule-strong"]) {
    const problems = ratioProblems(inputs, name, grounds, (ratio, ground, theme) =>
      // Stryker disable next-line EqualityOperator: equivalent, no two 6-digit hex colours give a ratio of exactly 3 (an exhaustive search over all 2^24 relative luminances, by the formula of gates/lib/wcag.ts, found none), so >= 3 and > 3 agree on every input
      ratio >= 3 ? `${name} is ${ratio.toFixed(4)}:1 on ${ground} in ${theme}, at or above 3:1` : undefined,
    );
    reportToken(inputs, found, name, problems);
  }
  const border = ratioProblems(inputs, "color-control-border", grounds, (ratio, ground, theme) =>
    // Stryker disable next-line EqualityOperator: equivalent, no two 6-digit hex colours give a ratio of exactly 3 (an exhaustive search over all 2^24 relative luminances, by the formula of gates/lib/wcag.ts, found none), so < 3 and <= 3 agree on every input
    ratio < 3 ? `color-control-border is ${ratio.toFixed(4)}:1 on ${ground} in ${theme}, below 3:1` : undefined,
  );
  reportToken(inputs, found, "color-control-border", border);
}

/** (e) The chrome grounds are dark (luminance at most 0.05) and the chrome inks the same in both themes. */
function darkChrome(inputs: Inputs, found: Found): void {
  for (const name of ["color-chrome", "color-chrome-hover"]) {
    const problems = themes.flatMap((theme) => {
      const value = colour(inputs, name, theme);
      if ("problem" in value) return [value.problem];
      const luminance = relativeLuminance(value.hex);
      // Stryker disable next-line EqualityOperator: equivalent, no 6-digit hex colour has a relative luminance of exactly 0.05 (an exhaustive search over all 2^24 found none), so > and >= agree on every input
      return luminance > 0.05 ? [`${name} has relative luminance ${luminance.toFixed(4)} in ${theme}, above 0.05`] : [];
    });
    reportToken(inputs, found, name, [...new Set(problems)]);
  }
  for (const name of ["color-chrome-ink", "color-chrome-muted"]) {
    const [light, dark] = themes.map((theme) => colour(inputs, name, theme)) as [Colour, Colour];
    if ("hex" in light && "hex" in dark) {
      if (light.hex !== dark.hex) found(inputs.locate(name), `${name} differs between themes (${light.hex} in light, ${dark.hex} in dark)`);
      continue;
    }
    reportToken(inputs, found, name, [...new Set([light, dark].flatMap((value) => ("problem" in value ? [value.problem] : [])))]);
  }
}

/** The stylesheet location of a node. */
function cssAt(line: number | undefined): Location {
  return line === undefined ? { path: tokenPaths.stylesheet } : { path: tokenPaths.stylesheet, line };
}

/**
 * The reduced-motion declarations FR-007 requires, each 0ms: every token of group `motion` in the source whose value is
 * a duration, in source order (012 plan decision 29: rule (f) follows the generator; before, the two names
 * `motion-fast` and `motion-base`), except those marked as delays (operator decision C1: `delay: true`).
 */
function motionDurations(inputs: Inputs): string[] {
  return inputs.tokens.source
    .filter((record) => record.group === "motion" && record.delay !== true && typeof record.value === "string" && duration.test(record.value))
    .map((record) => `--ocelle-${record.name}`);
}

/** (f) A prefers-reduced-motion: reduce block sets exactly the motion durations of the source, each to 0ms. */
function reducedMotionBlock(inputs: Inputs, found: Found): void {
  const blocks: AtRule[] = [];
  inputs.stylesheet.walkAtRules("media", (block) => {
    if (/prefers-reduced-motion\s*:\s*reduce/.test(block.params)) blocks.push(block);
  });
  const [first] = blocks;
  if (first === undefined) {
    found(cssAt(undefined), "no @media (prefers-reduced-motion: reduce) block");
    return;
  }
  const reducedMotion = motionDurations(inputs);
  const set = new Set<string>();
  for (const block of blocks) {
    block.walkDecls((declaration) => {
      set.add(declaration.prop);
      if (reducedMotion.includes(declaration.prop) && declaration.value === "0ms") return;
      const message = `${declaration.prop}: ${declaration.value} in the reduced-motion block; only the motion durations, each 0ms, belong there`;
      found(cssAt(declaration.source?.start?.line), message);
    });
  }
  for (const prop of reducedMotion) {
    if (!set.has(prop)) found(cssAt(first.source?.start?.line), `the reduced-motion block does not set ${prop} to 0ms`);
  }
}

/** (g) Nothing defeats forced colours: no forced-color-adjust: none, colour tokens map only to system colours there. */
function forcedColours(inputs: Inputs, found: Found): void {
  inputs.stylesheet.walkDecls((declaration) => {
    if (declaration.prop.toLowerCase() === "forced-color-adjust" && declaration.value.toLowerCase() === "none") {
      found(cssAt(declaration.source?.start?.line), "forced-color-adjust: none defeats forced colours");
    }
  });
  inputs.stylesheet.walkAtRules("media", (block) => {
    if (!/forced-colors/i.test(block.params)) return;
    block.walkDecls((declaration) => {
      if (!declaration.prop.startsWith("--ocelle-color-") || systemColourNames.has(declaration.value.toLowerCase())) return;
      const message = `${declaration.prop}: ${declaration.value} in a forced-colours block; a colour token may only map to a system colour`;
      found(cssAt(declaration.source?.start?.line), message);
    });
  });
}

/** The rules of FR-019, in order, with their rule ids. */
const rules: readonly (readonly [string, (inputs: Inputs, found: Found) => void])[] = [
  ["monospace-font", monospaceFont],
  ["link-accent", linkAccent],
  ["radius-set", radiusSet],
  ["rule-boundary", ruleBoundary],
  ["dark-chrome", darkChrome],
  ["reduced-motion", reducedMotionBlock],
  ["forced-colours", forcedColours],
];

async function brandRules(root: string, io: Io): Promise<number> {
  const tokens = await loadTokens(root);
  const pairs = await readPairs(root);
  const stylesheet = postcss.parse(tokens.css());
  const inputs: Inputs = { tokens, pairs, stylesheet, locate: await tokenLocator(root) };
  const findings: Finding[] = [];
  for (const [rule, check] of rules) check(inputs, (location, message) => findings.push({ location, gate, rule, message }));
  if (findings.length > 0) return emit({ exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")}` }, io.out, io.err);
  return emit({ exit: 0, summary: `${gate}: ${String(rules.length)} rules checked` }, io.out, io.err);
}

export async function run(argv: readonly string[], io: Io): Promise<number> {
  const context = parseArgs(argv, io.cwd);
  try {
    return await brandRules(context.root, io);
  } catch (error) {
    if (!(error instanceof CannotRun)) throw error;
    return emit({ exit: 2, cause: `${gate}: cannot run: ${error.file}: ${error.message}` }, io.out, io.err);
  }
}

// Stryker disable next-line all: process boundary, covered by gates-integration: gates/test/integration/token-gates.test.ts "brand-rules --root <repo> checks the seven rules"
if (import.meta.main) await main(run);
