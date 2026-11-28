// The release-readiness verdict (030 FR-010 to FR-014; research.md R-06, R-09; data-model.md § Readiness report;
// contracts/release-readiness-gate.md): one shared version, the tag, the changelogs, and the gap rows and secret scan
// results, as one ready / not ready verdict. Scaffold: the exported signatures, no behaviour yet.
import type { Finding, GateResult } from "./findings.ts";

/** One package of the release: its directory name under packages/, its package.json and its changelog text. */
export interface ReleasePackage {
  readonly dir: string;
  readonly name: string;
  readonly version: string;
  readonly changelog: string;
}

/** Everything the verdict reads. */
export interface ReadinessInput {
  readonly packages: readonly ReleasePackage[];
  readonly tag?: string;
  readonly elementTags: readonly string[];
  readonly tokens: readonly string[];
  readonly gap: { readonly findings: readonly Finding[]; readonly met: number; readonly total: number; readonly lines: readonly string[] };
  readonly secrets: { readonly findings: readonly Finding[]; readonly count: number };
}

/** The verdict: the lines printed before it and the gate result. */
export interface ReadinessVerdict {
  readonly lines: readonly string[];
  readonly result: GateResult;
}

/** The findings of the packages' versions against each other and, when given, the tag. */
export function versionFindings(packages: readonly ReleasePackage[], tag?: string): Finding[] {
  return [...packages, tag].flatMap(() => []);
}

/** The tokens a tokens changelog does not name in full or by a `--ocelle-<prefix>-*` mention. */
export function uncoveredTokens(changelog: string, tokens: readonly string[]): string[] {
  return [changelog, ...tokens].flatMap(() => []);
}

/** The findings of the changelogs (research.md R-09). */
export function changelogFindings(
  packages: readonly ReleasePackage[],
  version: string,
  elementTags: readonly string[],
  tokens: readonly string[],
  tag?: string,
): Finding[] {
  return [...packages, version, ...elementTags, ...tokens, tag].flatMap(() => []);
}

/** The verdict of a run. */
export function readiness(input: ReadinessInput): ReadinessVerdict {
  return { lines: input.gap.lines.slice(input.gap.lines.length), result: { exit: 2, cause: "release-readiness: could not run: not implemented" } };
}
