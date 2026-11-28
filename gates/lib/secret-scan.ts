// The history secret scan of the release-readiness gate (030 FR-011, FR-045; research.md R-08; data-model.md § Secret
// allow-list entry): the rules of R-08 on the lines a `git log -p -m` adds (every commit reachable from HEAD, a merge
// diffed against each parent, binary diffs skipped), each hit by commit, path, rule and the SHA-256 of the matched text,
// which is never kept, printed or written; the allow list keyed by path, rule and that SHA-256, so an entry survives a
// rebase, an amend and a squash merge; and the plant-time line of a rule (research.md R-17), so no plant holds a value.
// No line of this file matches a rule: each pattern is written so that its own text is no hit (FR-045).
// The key shapes were re-checked against each issuer's documentation at implementation time (research.md R-08):
// npm (npm_ and 36 letters and digits), GitHub (ghp_, gho_, ghu_, ghs_, ghr_ and at least 36; github_pat_ and 82),
// PEM private-key headers (RFC 7468 labels: PRIVATE KEY, RSA, EC, DSA, OPENSSH, ENCRYPTED), AWS access key ids (AKIA and
// 16 upper-case letters and digits), Slack (xoxa-, xoxb-, xoxp-, xoxr-), Anthropic (sk-ant-), OpenAI project keys
// (sk-proj-), Google API keys (AIza and 35).
import { createHash } from "node:crypto";
import { posix } from "node:path";
import type { Finding } from "./findings.ts";

/** The secret-scan rules of research.md R-08, by name. */
export type SecretRule =
  | "npm-token"
  | "github-token"
  | "private-key"
  | "aws-key-id"
  | "slack-token"
  | "anthropic-key"
  | "openai-key"
  | "google-api-key"
  | "npmrc-auth"
  | "env-assignment";

const gate = "release-readiness";
const allowlistPath = "gates/release/secret-allowlist.json";

/** One rule: its pattern (global), a cheap text every hit holds, and the files it applies to (all when absent). */
interface Rule {
  readonly name: SecretRule;
  readonly pattern: RegExp;
  readonly marker?: string;
  readonly applies?: (file: string) => boolean;
}

/** A file named .npmrc or *.npmrc. */
function isNpmrc(path: string): boolean {
  return posix.basename(path).endsWith(".npmrc");
}

/** A file named .env, .env.* or *.env. */
function isEnv(path: string): boolean {
  const name = posix.basename(path);
  return name === ".env" || name.startsWith(".env.") || name.endsWith(".env");
}

const rules: readonly Rule[] = [
  { name: "npm-token", pattern: /(?<![A-Za-z0-9_])npm_[A-Za-z0-9]{36}(?![A-Za-z0-9])/g, marker: "npm_" },
  { name: "github-token", pattern: /(?<![A-Za-z0-9_])(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{82})(?![A-Za-z0-9_])/g },
  { name: "private-key", pattern: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/g, marker: "PRIVATE KEY-----" },
  { name: "aws-key-id", pattern: /(?<![A-Za-z0-9])AKIA[A-Z0-9]{16}(?![A-Za-z0-9])/g, marker: "AKIA" },
  { name: "slack-token", pattern: /(?<![A-Za-z0-9])xox[abpr]-[A-Za-z0-9-]{10,}/g, marker: "xox" },
  { name: "anthropic-key", pattern: /(?<![A-Za-z0-9])sk-ant-[A-Za-z0-9_-]{32,}/g, marker: "sk-ant-" },
  { name: "openai-key", pattern: /(?<![A-Za-z0-9])sk-proj-[A-Za-z0-9_-]{32,}/g, marker: "sk-proj-" },
  { name: "google-api-key", pattern: /(?<![A-Za-z0-9_-])AIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])/g, marker: "AIza" },
  { name: "npmrc-auth", pattern: /_auth(?:Token)?\s*=\s*(?!["']?\$\{)["']?[^\s"'$][^\s"']*/g, marker: "_auth", applies: isNpmrc },
  {
    name: "env-assignment",
    pattern: /^\s*(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*(?:KEY|TOKEN|SECRET|PASSWORD)\s*=\s*(?!\$\{)(?!(["'])\1\s*$)\S.*$/g,
    applies: isEnv,
  },
];

/** The rule names, in the order of research.md R-08. */
export const secretRules: readonly SecretRule[] = rules.map((rule) => rule.name);

/** One hit of an added line: the rule and the SHA-256 (hex) of the matched text, never the text itself. */
export interface LineHit {
  readonly rule: SecretRule;
  readonly valueSha256: string;
}

/** One hit of the history: the commit that adds the line, the file it is in, the rule and the matched text's SHA-256. */
export interface SecretHit extends LineHit {
  readonly commit: string;
  readonly path: string;
}

/** One entry of gates/release/secret-allowlist.json. */
export interface AllowEntry {
  readonly path: string;
  readonly rule: string;
  readonly valueSha256: string;
  readonly reason: string;
}

/** The arguments of the git command whose output scanLog reads: every commit from HEAD, merges against each parent. */
export const scanArgs: readonly string[] = ["-c", "core.quotePath=false", "log", "-p", "-m", "--no-color", "--no-ext-diff", "--no-textconv", "--format=commit %H", "HEAD"];

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** The hits of one added line of the file at `path`. */
export function lineHits(path: string, line: string): LineHit[] {
  const hits: LineHit[] = [];
  for (const rule of rules) {
    if (rule.applies !== undefined && !rule.applies(path)) continue;
    if (rule.marker !== undefined && !line.includes(rule.marker)) continue;
    for (const match of line.matchAll(rule.pattern)) hits.push({ rule: rule.name, valueSha256: sha256(match[0]) });
  }
  return hits;
}

/** The path of a `+++ b/<path>` header line (unquoting git's C-style quoting), or undefined for `/dev/null`. */
function headerPath(line: string): string | undefined {
  const rest = line.slice(4);
  if (rest === "/dev/null") return undefined;
  const quoted = /^"(.*)"$/.exec(rest);
  const path = quoted === null ? rest : JSON.parse(`"${String(quoted[1])}"`) as string;
  return path.startsWith("b/") ? path.slice(2) : path;
}

/** A line-by-line reader of a `git log -p -m` output (scanArgs): feed it each line, then read its hits and commits. */
export interface LogScanner {
  readonly add: (line: string) => void;
  readonly hits: () => readonly SecretHit[];
  readonly commits: () => number;
}

/** A new scanner: added lines only (hunk lines counted, so a `+++` line inside a hunk is content), headers skipped. */
export function logScanner(): LogScanner {
  const hits: SecretHit[] = [];
  const commits = new Set<string>();
  let commit = "";
  let path: string | undefined;
  let oldLeft = 0;
  let newLeft = 0;
  const add = (line: string): void => {
    if (oldLeft > 0 || newLeft > 0) {
      const mark = line[0];
      if (mark === "+") {
        newLeft -= 1;
        if (path !== undefined) for (const hit of lineHits(path, line.slice(1))) hits.push({ commit, path, ...hit });
      } else if (mark === "-") {
        oldLeft -= 1;
      } else if (mark === " " || line === "") {
        oldLeft -= 1;
        newLeft -= 1;
      }
      return;
    }
    const header = /^commit ([0-9a-f]{40,64})(?: \(from [0-9a-f]+\))?$/.exec(line);
    if (header !== null) {
      commit = String(header[1]);
      commits.add(commit);
      path = undefined;
      return;
    }
    if (line.startsWith("diff --git ")) path = undefined;
    else if (line.startsWith("+++ ")) path = headerPath(line);
    else {
      const hunk = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/.exec(line);
      if (hunk !== null) {
        oldLeft = Number(hunk[1] ?? 1);
        newLeft = Number(hunk[2] ?? 1);
      }
    }
  };
  return { add, hits: () => hits, commits: () => commits.size };
}

/** The hits of the added lines of a `git log -p -m` output (scanArgs). */
export function scanLog(log: string): SecretHit[] {
  const scanner = logScanner();
  for (const line of log.split("\n")) scanner.add(line);
  return [...scanner.hits()];
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const entryKeys = new Set(["path", "rule", "valueSha256", "reason"]);

/** The entries of a secret-allowlist.json text; throws naming the problem when the text is not a valid allow list. */
export function parseAllowlist(text: string): AllowEntry[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error("secret-allowlist.json is not valid JSON", { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("secret-allowlist.json is not a list of entries");
  return value.map((item: unknown, index) => {
    const at = `entry ${String(index + 1)}`;
    if (!object(item)) throw new Error(`${at} is not an object`);
    const unknown = Object.keys(item).find((key) => !entryKeys.has(key));
    if (unknown !== undefined) throw new Error(`${at}: unknown key ${unknown}`);
    for (const field of ["path", "rule", "valueSha256"] as const) {
      if (typeof item[field] !== "string" || item[field] === "") throw new Error(`${at}: ${field} must be a non-empty string`);
    }
    const { path, rule, valueSha256, reason } = item as Record<string, string>;
    if (!(secretRules as readonly string[]).includes(String(rule))) throw new Error(`${at}: rule ${String(rule)} is not a secret-scan rule`);
    if (!/^[0-9a-f]{64}$/.test(String(valueSha256))) throw new Error(`${at}: valueSha256 must be 64 lower-case hex digits`);
    if (typeof reason !== "string") throw new Error(`${at}: reason must be a string`);
    return { path: String(path), rule: String(rule), valueSha256: String(valueSha256), reason };
  });
}

/** The findings of the hits against the allow list, and the number of hits the list does not allow. */
export function secretFindings(hits: readonly SecretHit[], entries: readonly AllowEntry[]): { readonly findings: Finding[]; readonly secrets: number } {
  const keys = (entry: { readonly path: string; readonly rule: string; readonly valueSha256: string }): string => `${entry.path}\0${entry.rule}\0${entry.valueSha256}`;
  const allowed = new Set(entries.filter((entry) => entry.reason.trim() !== "").map(keys));
  const hitKeys = new Set(hits.map(keys));
  const open = hits.filter((hit) => !allowed.has(keys(hit)));
  const findings: Finding[] = open.map((hit) => ({
    location: { path: `${hit.commit}:${hit.path}` },
    gate,
    rule: "secret",
    message: `${hit.rule}: an added line matches this rule; the matched text is not printed`,
  }));
  for (const [index, entry] of entries.entries()) {
    const named = `entry ${String(index + 1)} (${entry.path}, ${entry.rule})`;
    if (entry.reason.trim() === "") findings.push({ location: { path: allowlistPath }, gate, rule: "allowlist-no-reason", message: `${named} has no reason` });
    if (!hitKeys.has(keys(entry))) findings.push({ location: { path: allowlistPath }, gate, rule: "allowlist-stale", message: `${named} matches no hit` });
  }
  return { findings, secrets: open.length };
}

/** `length` letters and digits derived from a seed: the hex digits of its SHA-256 chain, alternately upper-cased. */
function body(seed: string, length: number, upper = false): string {
  let text = "";
  for (let round = 0; text.length < length; round += 1) text += sha256(`${seed}:${String(round)}`);
  const digits = text.slice(0, length);
  return upper ? digits.toUpperCase() : digits.replace(/[a-f]/g, (c, i: number) => (i % 2 === 0 ? c.toUpperCase() : c));
}

/** The prefix of each value-shaped rule, assembled from parts so this file holds no value of a rule. */
const part = (...parts: readonly string[]): string => parts.join("");

/**
 * A line holding a value of `rule`, generated from `seed` at plant time (research.md R-17), so no plant holds one: the
 * value alone for the value rules, the assignment for the two path-bound rules.
 */
export function plantedSecret(rule: SecretRule, seed: string): string {
  switch (rule) {
    case "npm-token":
      return `${part("np", "m_")}${body(seed, 36)}`;
    case "github-token":
      return `${part("gh", "p_")}${body(seed, 36)}`;
    case "private-key":
      return part("-----BEGIN ", "RSA PRIV", "ATE KEY-----");
    case "aws-key-id":
      return `${part("AK", "IA")}${body(seed, 16, true)}`;
    case "slack-token":
      return `${part("xo", "xb-")}${body(seed, 24)}`;
    case "anthropic-key":
      return `${part("sk-", "ant-")}${body(seed, 40)}`;
    case "openai-key":
      return `${part("sk-", "proj-")}${body(seed, 40)}`;
    case "google-api-key":
      return `${part("AI", "za")}${body(seed, 35)}`;
    case "npmrc-auth":
      return `//registry.npmjs.org/:${part("_auth", "Token=")}${body(seed, 36)}`;
    case "env-assignment":
      return `${part("DEPLOY", "_TOKEN=")}${body(seed, 24)}`;
  }
}
