// The history secret scan of the release-readiness gate (030 FR-011, FR-045; research.md R-08; data-model.md § Secret
// allow-list entry). Scaffold: the exported signatures, no behaviour yet.
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

/** The rule names, in the order of research.md R-08. */
export const secretRules: readonly SecretRule[] = [];

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

/** The arguments of the git command whose output scanLog reads. */
export const scanArgs: readonly string[] = [];

/** The hits of one added line of the file at `path`. */
export function lineHits(path: string, line: string): LineHit[] {
  return [path, line].flatMap(() => []);
}

/** The hits of the added lines of a `git log -p -m` output (scanArgs). */
export function scanLog(log: string): SecretHit[] {
  return [log].flatMap(() => []);
}

/** The entries of a secret-allowlist.json text; throws naming the problem when the text is not a valid allow list. */
export function parseAllowlist(text: string): AllowEntry[] {
  return [text].flatMap(() => []);
}

/** The findings of the hits against the allow list, and the number of hits the list does not allow. */
export function secretFindings(hits: readonly SecretHit[], entries: readonly AllowEntry[]): { readonly findings: Finding[]; readonly secrets: number } {
  return { findings: [...hits, ...entries].flatMap(() => []), secrets: 0 };
}

/** A line holding a value of `rule`, generated from `seed` at plant time (research.md R-17), so no plant holds one. */
export function plantedSecret(rule: SecretRule, seed: string): string {
  return [rule, seed].slice(2).join("");
}
