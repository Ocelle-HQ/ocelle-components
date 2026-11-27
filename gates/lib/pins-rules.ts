// The pins rules (FR-027, research.md R-14) on a workspace's parsed files, and the lockfile verdict on pnpm's output:
// every dependency of every manifest is an exact version (a workspace package as `workspace:<its version>`, and since
// 030 a peer as `workspace:^<its version>` too),
// `.node-version` and `packageManager` are exact, `pnpm-workspace.yaml` keeps the release-age and install-script
// policy of research.md R-04, hoisting stays off, and a frozen, lockfile-only, offline install either succeeds, finds
// the lockfile out of date (a finding) or fails for another reason (the gate could not run). Pure, tested in process
// (gates/test/pins.test.ts, gates/test/pins-rules.test.ts); gates/bin/pins.ts reads the files and runs pnpm.
import { oneLine } from "./findings.ts";
import type { Finding } from "./findings.ts";

/** Findings, or the cause when an input cannot be read or parsed. */
export type PinsCheck = { readonly findings: readonly Finding[] } | { readonly cause: string };

/** The settings of pnpm-workspace.yaml, by key (as gates/lib/workspace-yaml.ts reads them). */
export type Settings = Readonly<Record<string, unknown>>;

const gate = "pins";
const exact = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

/** A value read from JSON or YAML as one line of text: a string as written, anything else as JSON. */
export function show(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate, rule, message };
}

/** The dependency findings of one manifest, given the workspace packages' versions by name. */
export function dependencyFindings(path: string, manifest: Record<string, unknown>, siblings: ReadonlyMap<string, string>): Finding[] {
  const found: Finding[] = [];
  for (const field of dependencyFields) {
    const dependencies = manifest[field];
    if (typeof dependencies !== "object" || dependencies === null) continue;
    for (const [name, value] of Object.entries(dependencies as Record<string, unknown>)) {
      const spec = String(value);
      const sibling = siblings.get(name);
      const workspace = /^workspace:(.*)/.exec(spec)?.[1];
      const named = `${field}.${name} is "${spec}"`;
      // 030 plan decision D2 (research.md R-03; the constitution amendment of 030 US5): a peer range is a statement to
      // consumers, not an install pin, so peerDependencies alone may name a workspace package as
      // workspace:^<its own version>, which pnpm pack writes as ^<version>; the lockfile still pins the linked package.
      const caret = field === "peerDependencies" && sibling !== undefined ? /^\^(.*)/.exec(workspace ?? "")?.[1] : undefined;
      if (caret !== undefined && exact.test(caret)) {
        if (caret !== sibling) found.push(finding(path, "workspace", `${named}, but ${name} is at ${String(sibling)}; write "workspace:^${String(sibling)}"`));
      } else if (workspace !== undefined && !exact.test(workspace)) {
        found.push(finding(path, "range", `${named}, not an exact version`));
      } else if (workspace !== undefined && sibling === undefined) {
        found.push(finding(path, "workspace", `${named}, but ${name} is not a workspace package`));
      } else if (workspace !== sibling) {
        // Here sibling is set: without it, a workspace: spec is reported above and any other spec is not workspace's.
        const version = String(sibling);
        found.push(finding(path, "workspace", `${named}, but ${name} is at ${version}; write "workspace:${version}"`));
      } else if (sibling === undefined && !exact.test(spec)) {
        found.push(finding(path, "range", `${named}, not an exact version`));
      }
    }
  }
  return found;
}

export function pinFindings(root: Record<string, unknown>, nodeVersion: string | undefined): Finding[] {
  const found: Finding[] = [];
  const manager = root.packageManager;
  if (manager === undefined) {
    found.push(finding("package.json", "package-manager", "packageManager is missing; pin pnpm exactly (pnpm@<major>.<minor>.<patch>)"));
  } else if (!/^pnpm@\d+\.\d+\.\d+(?:\+[\w.-]+)?$/.test(show(manager))) {
    found.push(finding("package.json", "package-manager", `packageManager is "${show(manager)}", not an exact pnpm version`));
  }
  if (nodeVersion === undefined) {
    found.push(finding(".node-version", "node-version", ".node-version is missing; pin the exact Node version (for example 26.13.0)"));
  } else if (!/^v?\d+\.\d+\.\d+$/.test(nodeVersion.trim())) {
    found.push(finding(".node-version", "node-version", `.node-version is "${nodeVersion.trim()}", not an exact version`));
  }
  return found;
}

/**
 * The install scripts the operator approved (005 research.md R-16, 2026-11-10), each at one exact version, so pnpm runs
 * a script only for that version. Widening this list is a reviewed gate change (001 research.md R-04).
 */
const approvedBuilds: ReadonlySet<string> = new Set(["rs-module-lexer@2.9.0", "fsevents@2.3.3"]);

/** The names of the entries of a map setting that are `true`, except the approved builds; a list's entries all count. */
function allowed(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value)
    .filter(([name, allow]) => allow === true && !approvedBuilds.has(name))
    .map(([name]) => name);
}

export function workspaceFindings(settings: Settings): Finding[] {
  const path = "pnpm-workspace.yaml";
  const found: Finding[] = [];
  const add = (rule: string, message: string): void => {
    found.push(finding(path, rule, message));
  };
  const age = settings.minimumReleaseAge;
  if (age === undefined) add("release-age", "minimumReleaseAge is missing; set it to at least 10080 (7 days)");
  else if (typeof age !== "number") add("release-age", `minimumReleaseAge is "${show(age)}", not a number; set it to at least 10080 (7 days)`);
  else if (age < 10080) add("release-age", `minimumReleaseAge is ${show(age)}, below 10080 (7 days)`);
  const strict = settings.minimumReleaseAgeStrict;
  if (strict === undefined) add("release-age", "minimumReleaseAgeStrict is missing; set it to true");
  else if (strict !== true) add("release-age", `minimumReleaseAgeStrict is ${show(strict)}; set it to true`);
  const excluded = settings.minimumReleaseAgeExclude;
  if (Array.isArray(excluded) && excluded.length > 0) {
    add("release-age", `minimumReleaseAgeExclude lists ${excluded.map(String).join(", ")}; remove the exclusion`);
  }
  if (!("allowBuilds" in settings)) add("allow-builds", "allowBuilds is missing; set it to {} (no dependency may run an install script)");
  for (const name of allowed(settings.allowBuilds)) add("allow-builds", `allowBuilds lets ${name} run install scripts; remove the entry`);
  if ("dangerouslyAllowAllBuilds" in settings) add("allow-builds", "dangerouslyAllowAllBuilds is set; remove it");
  if (settings.shamefullyHoist === true) add("hoisting", "shamefullyHoist is true; remove it");
  const hoisted = settings.publicHoistPattern;
  if (Array.isArray(hoisted) && hoisted.length > 0) add("hoisting", `publicHoistPattern is not empty (${hoisted.map(String).join(", ")}); remove it`);
  const linker = settings.nodeLinker;
  if (linker !== undefined && linker !== "isolated") add("hoisting", `nodeLinker is ${show(linker)}; use isolated`);
  return found;
}

/** The first error record of pnpm's ndjson log. */
function firstError(output: string): { readonly code: string; readonly message: string } | undefined {
  for (const line of output.split("\n")) {
    let record: unknown;
    try {
      record = JSON.parse(line);
    }
    // Stryker disable next-line BlockStatement: equivalent, an empty catch leaves record undefined, which the level check below also skips
    catch {
      continue;
    }
    const fields = record as { level?: unknown; code?: unknown; message?: unknown } | null;
    if (fields?.level !== "error") continue;
    return { code: String(fields.code), message: String(fields.message) };
  }
  return undefined;
}

/** The lockfile verdict on one `pnpm install --frozen-lockfile --lockfile-only --offline --reporter=ndjson` run. */
export function lockfileVerdict(run: { readonly exitCode: number | null; readonly output: string }): PinsCheck {
  if (run.exitCode === 0) return { findings: [] };
  const command = "pnpm install --frozen-lockfile --lockfile-only --offline";
  const error = firstError(run.output);
  if (error === undefined) return { cause: `${command} failed (exit ${String(run.exitCode)}); run pnpm run setup:online` };
  if (error.code === "ERR_PNPM_OUTDATED_LOCKFILE") {
    const message = "pnpm-lock.yaml is not up to date with the manifests; run pnpm install and commit pnpm-lock.yaml";
    return { findings: [finding("pnpm-lock.yaml", "lockfile", message)] };
  }
  return { cause: `${command} failed: ${error.code}: ${oneLine(String(error.message.split("\n")[0]))}; run pnpm run setup:online` };
}

