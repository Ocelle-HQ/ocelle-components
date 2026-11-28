// The release-readiness verdict (030 FR-010 to FR-014; research.md R-06, R-09; data-model.md § Readiness report;
// contracts/release-readiness-gate.md): one shared version (the tokens' is the reference) and, with `--tag`, the tag
// `v<version>`; each changelog's dated `## <version> - <YYYY-MM-DD>` entry, not empty, and with `--tag` an empty
// Unreleased section; every element tag of the manifest named as `ocelle-x` in the elements changelog, and every token
// named in the tokens changelog in full or by a `--ocelle-<prefix>-*` mention (any section); then the gap rows and the
// secret scan, as one ready / not ready verdict. Pure, tested in process (gates/test/release-readiness.test.ts).
import { plural } from "./findings.ts";
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

const gate = "release-readiness";

/** The findings of the packages' versions against each other and, when given, the tag. */
export function versionFindings(packages: readonly ReleasePackage[], tag?: string): Finding[] {
  const [first] = packages;
  if (first === undefined) return [];
  const findings: Finding[] = packages
    .filter((pkg) => pkg.version !== first.version)
    .map((pkg) => ({ location: { path: `packages/${pkg.dir}/package.json` }, gate, rule: "version-mismatch", message: `version ${pkg.version} differs from ${first.name} ${first.version}` }));
  if (tag !== undefined && tag !== `v${first.version}`) {
    findings.push({ location: { path: `packages/${first.dir}/package.json` }, gate, rule: "tag-mismatch", message: `the tag ${tag} is not v${first.version}` });
  }
  return findings;
}

/** The sections of a changelog: each `## ` heading line and the lines below it up to the next. */
function sections(changelog: string): { readonly heading: string; readonly body: readonly string[] }[] {
  const out: { heading: string; body: string[] }[] = [];
  for (const line of changelog.split(/\r?\n/)) {
    if (line.startsWith("## ")) out.push({ heading: line, body: [] });
    else out.at(-1)?.body.push(line);
  }
  return out;
}

/** Whether a section body holds anything but blank lines and `###` headings. */
function hasContent(body: readonly string[]): boolean {
  return body.some((line) => line.trim() !== "" && !line.startsWith("### "));
}

/** Whether a `YYYY-MM-DD` text is a calendar date. */
function isDate(text: string): boolean {
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text;
}

/** The tokens a tokens changelog does not name in full or by a `--ocelle-<prefix>-*` mention. */
export function uncoveredTokens(changelog: string, tokens: readonly string[]): string[] {
  const full = new Set([...changelog.matchAll(/`--ocelle-([a-z0-9-]+)`/g)].map((match) => String(match[1])));
  const prefixes = [...changelog.matchAll(/`--ocelle-([a-z0-9-]+)-\*`/g)].map((match) => String(match[1]));
  return tokens.filter((token) => !full.has(token) && !prefixes.some((prefix) => token.startsWith(`${prefix}-`)));
}

/** The uncovered tokens grouped by their first name segment: `shadow (--ocelle-shadow-a, --ocelle-shadow-b), ...`. */
function grouped(tokens: readonly string[]): string {
  const groups = new Map<string, string[]>();
  for (const token of tokens) {
    const segment = token.split("-")[0] ?? token;
    groups.set(segment, [...(groups.get(segment) ?? []), `--ocelle-${token}`]);
  }
  return [...groups].map(([segment, names]) => `${segment} (${names.join(", ")})`).join(", ");
}

/** The findings of the changelogs (research.md R-09). */
export function changelogFindings(
  packages: readonly ReleasePackage[],
  version: string,
  elementTags: readonly string[],
  tokens: readonly string[],
  tag?: string,
): Finding[] {
  const findings: Finding[] = [];
  for (const pkg of packages) {
    const at = (rule: string, message: string): Finding => ({ location: { path: `packages/${pkg.dir}/CHANGELOG.md` }, gate, rule, message });
    const all = sections(pkg.changelog);
    const entry = all.find(({ heading }) => heading === `## ${version}` || heading.startsWith(`## ${version} `));
    if (entry === undefined) {
      findings.push(at("changelog-missing-entry", `has no ## ${version} entry`));
    } else {
      const date = /^## \S+ - (\d{4}-\d{2}-\d{2})$/.exec(entry.heading)?.[1];
      if (date === undefined || !isDate(date)) findings.push(at("changelog-undated", `the ${version} entry's heading is not ## ${version} - <YYYY-MM-DD>`));
      else if (!hasContent(entry.body)) findings.push(at("changelog-missing-entry", `the ${version} entry is empty`));
    }
    const unreleased = all.find(({ heading }) => heading === "## Unreleased");
    if (tag !== undefined && unreleased !== undefined && hasContent(unreleased.body)) {
      findings.push(at("changelog-unreleased-not-empty", `the Unreleased section is not empty; with the tag ${tag} everything released is named under ${version}`));
    }
    if (pkg.dir === "elements") {
      const missing = elementTags.filter((name) => !pkg.changelog.includes(`\`${name}\``));
      if (missing.length > 0) findings.push(at("changelog-missing-element", `does not name ${missing.join(", ")}`));
    }
    if (pkg.dir === "tokens") {
      const uncovered = uncoveredTokens(pkg.changelog, tokens);
      if (uncovered.length > 0) findings.push(at("changelog-missing-token", `does not name, in full or by a \`--ocelle-<prefix>-*\` mention: ${grouped(uncovered)}`));
    }
  }
  return findings;
}

/** The verdict of a run. */
export function readiness(input: ReadinessInput): ReadinessVerdict {
  const version = input.packages[0]?.version ?? "";
  const findings = [
    ...input.gap.findings,
    ...input.secrets.findings,
    ...versionFindings(input.packages, input.tag),
    ...changelogFindings(input.packages, version, input.elementTags, input.tokens, input.tag),
  ];
  const counts = `${String(input.gap.met)}/${String(input.gap.total)} rows, ${plural(input.secrets.count, "secret")}, version ${version}`;
  if (findings.length === 0) return { lines: input.gap.lines, result: { exit: 0, summary: `${gate}: ready (${counts})` } };
  return { lines: input.gap.lines, result: { exit: 1, findings, summary: `${gate}: not ready (${counts}; ${plural(findings.length, "finding")})` } };
}
