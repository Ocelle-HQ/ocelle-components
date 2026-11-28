import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Finding } from "../lib/findings.ts";
import { describeEvidence, evidenceMet, gapRowFindings, manifestElements, parseGapRows, parseGapTable, tokenNames } from "../lib/gap-rows.ts";
import type { Evidence, GapInputs, GapRow, Members, TableRow } from "../lib/gap-rows.ts";
import { changelogFindings, readiness, uncoveredTokens, versionFindings } from "../lib/release-readiness.ts";
import type { ReadinessInput, ReleasePackage } from "../lib/release-readiness.ts";
import { lineHits, parseAllowlist, plantedSecret, scanArgs, scanLog, secretFindings, secretRules } from "../lib/secret-scan.ts";
import type { AllowEntry, SecretHit, SecretRule } from "../lib/secret-scan.ts";

// 030 US2 (T022; FR-010 to FR-015, FR-045; research.md R-07, R-08, R-09; data-model.md § Gap row, § Secret allow-list
// entry, § Readiness report; contracts/release-readiness-gate.md): the gap rows and their evidence, the history secret
// scan and its allow list, the shared version and the tag, the changelog rules and the verdict, in process.
// No line of this file matches a secret-scan rule (FR-045): every credential-shaped value is assembled at run time from
// fragments that match no rule on their own, and no test prints one.
const gate = "release-readiness";
const table = "specs/030-release-v1/sources/issue-1-gap-table.md";
const rowsFile = "gates/release/gap-rows.json";
const allowFile = "gates/release/secret-allowlist.json";

const sha256 = (text: string): string => createHash("sha256").update(text).digest("hex");
/** `n` letters and digits, a fixed pattern of three that is no word of any rule. */
const alnum = (n: number): string => "aB3".repeat(Math.ceil(n / 3)).slice(0, n);
const part = (...parts: readonly string[]): string => parts.join("");

/** One credential-shaped value per rule that matches on its value alone, assembled here (research.md R-08). */
const values: Readonly<Record<string, { readonly rule: SecretRule; readonly value: string }>> = {
  npm: { rule: "npm-token", value: part("np", "m_", alnum(36)) },
  github: { rule: "github-token", value: part("gh", "p_", alnum(36)) },
  "github fine-grained": { rule: "github-token", value: part("github", "_pat_", alnum(82)) },
  "github server-to-server": { rule: "github-token", value: part("gh", "s_", alnum(40)) },
  "private key": { rule: "private-key", value: part("-----BEGIN ", "RSA PRIV", "ATE KEY-----") },
  "private key, any type": { rule: "private-key", value: part("-----BEGIN ", "PRIV", "ATE KEY-----") },
  aws: { rule: "aws-key-id", value: part("AK", "IA", "QWERTYUIOP234567") },
  slack: { rule: "slack-token", value: part("xo", "xb-", "1234567890-", alnum(24)) },
  anthropic: { rule: "anthropic-key", value: part("sk-", "ant-", alnum(40)) },
  openai: { rule: "openai-key", value: part("sk-", "proj-", alnum(40)) },
  google: { rule: "google-api-key", value: part("AI", "za", alnum(35)) },
};

describe("secretRules (research.md R-08)", () => {
  it("are the ten rules of R-08, in its order", () => {
    expect(secretRules).toEqual([
      "npm-token", "github-token", "private-key", "aws-key-id", "slack-token",
      "anthropic-key", "openai-key", "google-api-key", "npmrc-auth", "env-assignment",
    ]);
  });

  it("scan every commit reachable from HEAD, merges against each parent, with no colour, no external diff or text conversion and unquoted paths", () => {
    expect(scanArgs).toEqual(["-c", "core.quotePath=false", "log", "-p", "-m", "--no-color", "--no-ext-diff", "--no-textconv", "--format=commit %H", "HEAD"]);
  });
});

describe("lineHits: the rules that match a value anywhere", () => {
  it.each(Object.entries(values))("finds %s in any file, with the SHA-256 of the matched text", (_, { rule, value }) => {
    expect(lineHits("src/config.ts", `const value = "${value}";`)).toEqual([{ rule, valueSha256: sha256(value) }]);
  });

  // Each near miss beside the value it misses by one step, which hits.
  it.each([
    { what: "an npm token one character short", line: part("np", "m_", alnum(35)), near: part("np", "m_", alnum(36)), rule: "npm-token" },
    { what: "an npm token one character long", line: part("np", "m_", alnum(37)), near: part("np", "m_", alnum(36)), rule: "npm-token" },
    { what: "a GitHub token with 35 characters", line: part("gh", "p_", alnum(35)), near: part("gh", "p_", alnum(36)), rule: "github-token" },
    { what: "a GitHub token of an unknown type", line: part("gh", "x_", alnum(36)), near: part("gh", "u_", alnum(36)), rule: "github-token" },
    { what: "an AWS key id in lower case", line: part("ak", "ia", "qwertyuiop234567"), near: part("AK", "IA", "QWERTYUIOP234567"), rule: "aws-key-id" },
    { what: "a Google key one character short", line: part("AI", "za", alnum(34)), near: part("AI", "za", alnum(35)), rule: "google-api-key" },
    { what: "an Anthropic key of 31 characters", line: part("sk-", "ant-", alnum(31)), near: part("sk-", "ant-", alnum(32)), rule: "anthropic-key" },
    { what: "an OpenAI key without its project prefix", line: part("sk-", "pro-", alnum(40)), near: part("sk-", "proj-", alnum(40)), rule: "openai-key" },
    { what: "a Slack token of another type", line: part("xo", "xz-", "1234567890-", alnum(24)), near: part("xo", "xp-", "1234567890-", alnum(24)), rule: "slack-token" },
    { what: "a public key block", line: part("-----BEGIN ", "PUB", "LIC KEY-----"), near: part("-----BEGIN ", "OPENSSH PRIV", "ATE KEY-----"), rule: "private-key" },
    { what: "a lockfile integrity hash", line: `      resolution: {integrity: sha512-${"Zm9vYmFy+/0=".repeat(7)}}`, near: part("np", "m_", alnum(36)), rule: "npm-token" },
  ])("finds nothing in $what, and $rule in the value it misses", ({ line, near, rule }) => {
    expect({ miss: lineHits("pnpm-lock.yaml", line), near: lineHits("pnpm-lock.yaml", near).map((hit) => hit.rule) }).toEqual({ miss: [], near: [rule] });
  });
});

describe("lineHits: the path-bound rules", () => {
  const auth = part("//registry.npmjs.org/:_auth", "Token=", alnum(24));

  it("finds an .npmrc auth line with a literal value in a file named .npmrc or *.npmrc, keyed by the matched assignment", () => {
    const matched = part("_auth", "Token=", alnum(24));
    expect({
      root: lineHits(".npmrc", auth),
      nested: lineHits("packages/styles/.npmrc", auth),
      suffixed: lineHits("ci/publish.npmrc", auth),
      basic: lineHits(".npmrc", part("_au", "th=", alnum(16))).map(({ rule }) => rule),
    }).toEqual({
      root: [{ rule: "npmrc-auth", valueSha256: sha256(matched) }],
      nested: [{ rule: "npmrc-auth", valueSha256: sha256(matched) }],
      suffixed: [{ rule: "npmrc-auth", valueSha256: sha256(matched) }],
      basic: ["npmrc-auth"],
    });
  });

  it("finds nothing in an .npmrc that reads the token from a variable, nor in a file of another name", () => {
    expect({
      literal: lineHits(".npmrc", auth).map(({ rule }) => rule),
      variable: lineHits(".npmrc", "//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}"),
      script: lineHits("gates/bin/publish.ts", auth),
      prose: lineHits("RELEASING.md", "an `_authToken=` assignment in an .npmrc followed by a literal is a hit"),
    }).toEqual({ literal: ["npmrc-auth"], variable: [], script: [], prose: [] });
  });

  it("finds a literal assignment to a name ending in KEY, TOKEN, SECRET or PASSWORD in .env, .env.* and *.env files", () => {
    const line = (name: string): string => part(name, "=", alnum(12));
    expect({
      key: lineHits(".env", line("STRIPE_KEY")),
      token: lineHits(".env.local", line("DEPLOY_TOKEN")),
      secret: lineHits("deploy/prod.env", line("SESSION_SECRET")),
      password: lineHits(".env", line("DB_PASSWORD")).map(({ rule }) => rule),
      exported: lineHits(".env", `export ${line("DEPLOY_TOKEN")}`).map(({ rule }) => rule),
    }).toEqual({
      key: [{ rule: "env-assignment", valueSha256: sha256(line("STRIPE_KEY")) }],
      token: [{ rule: "env-assignment", valueSha256: sha256(line("DEPLOY_TOKEN")) }],
      secret: [{ rule: "env-assignment", valueSha256: sha256(line("SESSION_SECRET")) }],
      password: ["env-assignment"],
      exported: ["env-assignment"],
    });
  });

  it("finds nothing for a variable, an empty value, another name, or the same line in a file that is not an env file", () => {
    expect({
      literal: lineHits(".env", part("NPM_TOKEN", "=", alnum(12))).map(({ rule }) => rule),
      variable: lineHits(".env", "NPM_TOKEN=${NPM_TOKEN}"),
      empty: lineHits(".env", "DEPLOY_TOKEN="),
      quotedEmpty: lineHits(".env", 'DEPLOY_TOKEN=""'),
      other: lineHits(".env", part("HOST", "=", alnum(12))),
      script: lineHits("src/env.ts", part("DEPLOY_TOKEN", "=", alnum(12))),
      prose: lineHits("specs/030-release-v1/research.md", part("a line `NAME", "=value` whose name ends in TOKEN")),
    }).toEqual({ literal: ["env-assignment"], variable: [], empty: [], quotedEmpty: [], other: [], script: [], prose: [] });
  });
});

/** A `git log -p -m` text (scanArgs) of the given commits, each adding or removing the given lines in its files. */
function log(commits: readonly { readonly sha: string; readonly files: readonly { readonly path: string; readonly lines: readonly string[]; readonly deleted?: boolean; readonly binary?: boolean }[] }[]): string {
  const out: string[] = [];
  for (const { sha, files } of commits) {
    out.push(`commit ${sha}`, "");
    for (const { path, lines, deleted, binary } of files) {
      out.push(`diff --git a/${path} b/${path}`);
      if (binary === true) {
        out.push("new file mode 100644", "index 0000000..1111111", `Binary files /dev/null and b/${path} differ`);
        continue;
      }
      if (deleted === true) {
        out.push("deleted file mode 100644", "index 1111111..0000000", `--- a/${path}`, "+++ /dev/null", `@@ -1,${String(lines.length)} +0,0 @@`, ...lines.map((line) => `-${line}`));
      } else {
        out.push("new file mode 100644", "index 0000000..1111111", "--- /dev/null", `+++ b/${path}`, `@@ -0,0 +1,${String(lines.length)} @@`, ...lines.map((line) => `+${line}`));
      }
    }
  }
  return `${out.join("\n")}\n`;
}

const c1 = "1".repeat(40);
const c2 = "2".repeat(40);
const c3 = "3".repeat(40);

describe("scanLog: added lines only, by commit and path", () => {
  it("names the commit and the file of each added line that hits, and skips removed lines, binary files and headers", () => {
    const npm = values.npm?.value ?? "";
    const github = values.github?.value ?? "";
    const text = log([
      { sha: c1, files: [{ path: "src/a.ts", lines: [`const a = "${npm}";`, "ok"] }, { path: "img.png", lines: [], binary: true }] },
      { sha: c2, files: [{ path: "src/a.ts", lines: [`const a = "${npm}";`, "ok"], deleted: true }] },
    ]);
    const context = [
      `commit ${c3}`,
      "",
      "diff --git a/notes.md b/notes.md",
      "index 1111111..2222222 100644",
      "--- a/notes.md",
      "+++ b/notes.md",
      "@@ -1,1 +1,2 @@",
      ` context ${npm}`,
      `+++ ${github}`,
      "",
    ].join("\n");
    expect(scanLog(text + context)).toEqual([
      { commit: c1, path: "src/a.ts", rule: "npm-token", valueSha256: sha256(npm) },
      { commit: c3, path: "notes.md", rule: "github-token", valueSha256: sha256(github) },
    ]);
  });

  it("reads a merge diffed against each parent as two diffs of one commit, and a path with spaces", () => {
    const aws = values.aws?.value ?? "";
    const text = [
      `commit ${c3} (from ${c1})`,
      "",
      "diff --git a/dir/a file.txt b/dir/a file.txt",
      "--- a/dir/a file.txt",
      "+++ b/dir/a file.txt",
      "@@ -0,0 +1 @@",
      `+${aws}`,
      `commit ${c3} (from ${c2})`,
      "",
      "diff --git a/dir/a file.txt b/dir/a file.txt",
      "--- a/dir/a file.txt",
      "+++ b/dir/a file.txt",
      "@@ -0,0 +1 @@",
      `+${aws}`,
      "",
    ].join("\n");
    expect(scanLog(text)).toEqual([
      { commit: c3, path: "dir/a file.txt", rule: "aws-key-id", valueSha256: sha256(aws) },
      { commit: c3, path: "dir/a file.txt", rule: "aws-key-id", valueSha256: sha256(aws) },
    ]);
  });
});

describe("secretFindings: a hit names <commit>:<path> and the rule, never the matched text (FR-011)", () => {
  const scenarios = [
    ...Object.entries(values).map(([name, { rule, value }]) => ({ name, rule, path: "src/config.ts", line: `key: ${value}`, value })),
    { name: ".npmrc", rule: "npmrc-auth", path: ".npmrc", line: part("//registry.npmjs.org/:_auth", "Token=", alnum(24)), value: alnum(24) },
    { name: "env", rule: "env-assignment", path: ".env", line: part("DEPLOY_TOKEN", "=", alnum(12)), value: alnum(12) },
  ];

  it.each(scenarios)("reports $name as rule $rule at <commit>:$path, and no finding holds the value", ({ rule, path, line, value }) => {
    const { findings, secrets } = secretFindings(scanLog(log([{ sha: c1, files: [{ path, lines: [line] }] }])), []);
    expect({ findings, secrets, leaks: JSON.stringify(findings).includes(value) }).toEqual({
      findings: [{ location: { path: `${c1}:${path}` }, gate, rule: "secret", message: `${rule}: an added line matches this rule; the matched text is not printed` }],
      secrets: 1,
      leaks: false,
    });
  });
});

describe("secretFindings: the allow list, keyed by path, rule and the matched text's SHA-256", () => {
  const value = values.npm?.value ?? "";
  const hit: SecretHit = { commit: c1, path: "docs/example.md", rule: "npm-token", valueSha256: sha256(value) };
  const entry: AllowEntry = { path: "docs/example.md", rule: "npm-token", valueSha256: sha256(value), reason: "a revoked token kept as a documented example" };
  const secret = (commit: string, path: string): Finding => ({ location: { path: `${commit}:${path}` }, gate, rule: "secret", message: "npm-token: an added line matches this rule; the matched text is not printed" });

  it("allows a hit that an entry with a reason keys, in every commit that adds it, and reports it without the entry", () => {
    expect({ allowed: secretFindings([hit, { ...hit, commit: c2 }], [entry]), listed: secretFindings([hit, { ...hit, commit: c2 }], []) }).toEqual({
      allowed: { findings: [], secrets: 0 },
      listed: { findings: [secret(c1, "docs/example.md"), secret(c2, "docs/example.md")], secrets: 2 },
    });
  });

  it.each([
    { what: "another path", change: { path: "docs/other.md" } },
    { what: "another rule", change: { rule: "github-token" } },
    { what: "another value", change: { valueSha256: sha256(`${value}x`) } },
  ] as { what: string; change: Partial<AllowEntry> }[])("does not allow a hit for an entry of $what, which is stale", ({ change }) => {
    expect(secretFindings([hit], [{ ...entry, ...change }])).toEqual({
      findings: [secret(c1, "docs/example.md"), { location: { path: allowFile }, gate, rule: "allowlist-stale", message: `entry 1 (${change.path ?? entry.path}, ${change.rule ?? entry.rule}) matches no hit` }],
      secrets: 1,
    });
  });

  it("does not allow a hit for an entry without a reason, and names the entry", () => {
    expect(secretFindings([hit], [{ ...entry, reason: " " }])).toEqual({
      findings: [secret(c1, "docs/example.md"), { location: { path: allowFile }, gate, rule: "allowlist-no-reason", message: "entry 1 (docs/example.md, npm-token) has no reason" }],
      secrets: 1,
    });
  });

  it("names a stale entry by its number when there is no hit at all", () => {
    expect(secretFindings([], [entry, { ...entry, path: "b.md" }])).toEqual({
      findings: [
        { location: { path: allowFile }, gate, rule: "allowlist-stale", message: "entry 1 (docs/example.md, npm-token) matches no hit" },
        { location: { path: allowFile }, gate, rule: "allowlist-stale", message: "entry 2 (b.md, npm-token) matches no hit" },
      ],
      secrets: 0,
    });
  });
});

describe("parseAllowlist (data-model.md § Secret allow-list entry)", () => {
  const entry = { path: "a.md", rule: "npm-token", valueSha256: "a".repeat(64), reason: "r" };

  it("reads the empty list and a list of entries, an empty reason kept for its finding", () => {
    expect({ empty: parseAllowlist("[]\n"), one: parseAllowlist(JSON.stringify([entry, { ...entry, reason: "" }])) }).toEqual({
      empty: [],
      one: [entry, { ...entry, reason: "" }],
    });
  });

  it.each([
    { text: "[", problem: "secret-allowlist.json is not valid JSON" },
    { text: "{}", problem: "secret-allowlist.json is not a list of entries" },
    { text: JSON.stringify([1]), problem: "entry 1 is not an object" },
    { text: JSON.stringify([{ ...entry, path: "" }]), problem: "entry 1: path must be a non-empty string" },
    { text: JSON.stringify([{ ...entry, rule: "password" }]), problem: "entry 1: rule password is not a secret-scan rule" },
    { text: JSON.stringify([entry, { ...entry, valueSha256: "A".repeat(64) }]), problem: "entry 2: valueSha256 must be 64 lower-case hex digits" },
    { text: JSON.stringify([{ ...entry, reason: undefined }]), problem: "entry 1: reason must be a string" },
    { text: JSON.stringify([{ ...entry, extra: 1 }]), problem: "entry 1: unknown key extra" },
  ])("rejects $text, naming the problem", ({ text, problem }) => {
    expect(() => parseAllowlist(text)).toThrow(problem);
  });
});

describe("plantedSecret (research.md R-17): a line of the rule, generated at plant time", () => {
  const where: Readonly<Record<SecretRule, string>> = {
    "npm-token": "src/a.ts", "github-token": "src/a.ts", "private-key": "keys/id.pem", "aws-key-id": "src/a.ts", "slack-token": "src/a.ts",
    "anthropic-key": "src/a.ts", "openai-key": "src/a.ts", "google-api-key": "src/a.ts", "npmrc-auth": ".npmrc", "env-assignment": ".env",
  };

  it.each(Object.entries(where))("gives %s a line that hits only that rule in %s, the same for one seed and another for another", (rule, path) => {
    const line = plantedSecret(rule as SecretRule, "1:a");
    expect({
      rules: lineHits(path, line).map((hit) => hit.rule),
      again: plantedSecret(rule as SecretRule, "1:a") === line,
      other: plantedSecret(rule as SecretRule, "2:a") === line && rule !== "private-key",
      oneLine: line.includes("\n"),
    }).toEqual({ rules: [rule], again: true, other: false, oneLine: false });
  });
});

// The gap rows (research.md R-07, data-model.md § Gap row).
const none: Members = { attribute: [], field: [], slot: [], cssPart: [], event: [], cssProperty: [] };
const inputs: GapInputs = {
  elements: new Map<string, Members>([
    ["ocelle-metric", { ...none, attribute: ["layout", "label"], field: ["layout"], cssPart: ["value"] }],
    ["ocelle-pill-tag", { ...none, slot: ["icon"], event: ["ocelle-pill-tag-activate"], cssProperty: ["--pill-gap"] }],
  ]),
  tokens: new Set(["color-canvas", "panel-padding"]),
  styles: new Map([["base.css", ":where([data-ocelle-prose]) :where(p) { margin: 0; }"]]),
  specs: new Set(["018-status-elements"]),
};

const evidenceCases: readonly { readonly item: Evidence; readonly met: boolean; readonly words: string }[] = [
  { item: { kind: "element", tag: "ocelle-metric" }, met: true, words: "element ocelle-metric" },
  { item: { kind: "element", tag: "ocelle-status-indicator" }, met: false, words: "element ocelle-status-indicator" },
  { item: { kind: "member", tag: "ocelle-metric", memberKind: "attribute", name: "layout" }, met: true, words: "attribute layout of ocelle-metric" },
  { item: { kind: "member", tag: "ocelle-metric", memberKind: "field", name: "label" }, met: false, words: "field label of ocelle-metric" },
  { item: { kind: "member", tag: "ocelle-metric", memberKind: "cssPart", name: "value" }, met: true, words: "cssPart value of ocelle-metric" },
  { item: { kind: "member", tag: "ocelle-pill-tag", memberKind: "slot", name: "icon" }, met: true, words: "slot icon of ocelle-pill-tag" },
  { item: { kind: "member", tag: "ocelle-pill-tag", memberKind: "event", name: "ocelle-pill-tag-activate" }, met: true, words: "event ocelle-pill-tag-activate of ocelle-pill-tag" },
  { item: { kind: "member", tag: "ocelle-pill-tag", memberKind: "cssProperty", name: "--pill-gap" }, met: true, words: "cssProperty --pill-gap of ocelle-pill-tag" },
  { item: { kind: "member", tag: "ocelle-absent", memberKind: "attribute", name: "layout" }, met: false, words: "attribute layout of ocelle-absent" },
  { item: { kind: "token", name: "panel-padding" }, met: true, words: "token --ocelle-panel-padding" },
  { item: { kind: "token", name: "panel-gap" }, met: false, words: "token --ocelle-panel-gap" },
  { item: { kind: "style-hook", file: "base.css", selector: "[data-ocelle-prose]" }, met: true, words: "style hook [data-ocelle-prose] in packages/styles/src/base.css" },
  { item: { kind: "style-hook", file: "base.css", selector: "[data-ocelle-wrap]" }, met: false, words: "style hook [data-ocelle-wrap] in packages/styles/src/base.css" },
  { item: { kind: "style-hook", file: "prose.css", selector: "[data-ocelle-prose]" }, met: false, words: "style hook [data-ocelle-prose] in packages/styles/src/prose.css" },
  { item: { kind: "spec", dir: "018-status-elements" }, met: true, words: "spec 018-status-elements" },
  { item: { kind: "spec", dir: "003-base-styles" }, met: false, words: "spec 003-base-styles" },
];

describe("evidenceMet and describeEvidence: each kind of evidence, met and unmet", () => {
  it.each(evidenceCases)("$words is met: $met", ({ item, met, words }) => {
    expect({ met: evidenceMet(item, inputs), words: describeEvidence(item) }).toEqual({ met, words });
  });
});

describe("manifestElements and tokenNames: the evidence inputs", () => {
  it("reads each tag of a custom-elements manifest with its attributes, fields (not methods), slots, parts, events and CSS properties", () => {
    const manifest = {
      schemaVersion: "1.0.0",
      modules: [
        { kind: "javascript-module", path: "src/a.ts", declarations: [{ kind: "class", name: "Helper" }] },
        {
          kind: "javascript-module",
          path: "src/ocelle-metric.ts",
          declarations: [{
            kind: "class",
            name: "OcelleMetric",
            tagName: "ocelle-metric",
            customElement: true,
            attributes: [{ name: "layout" }],
            members: [{ kind: "field", name: "layout" }, { kind: "method", name: "focus" }],
            slots: [{ name: "" }, { name: "icon" }],
            cssParts: [{ name: "value" }],
            events: [{ name: "ocelle-metric-change" }],
            cssProperties: [{ name: "--metric-gap" }],
          }],
        },
      ],
    };
    expect([...manifestElements(JSON.stringify(manifest))]).toEqual([
      ["ocelle-metric", { attribute: ["layout"], field: ["layout"], slot: ["", "icon"], cssPart: ["value"], event: ["ocelle-metric-change"], cssProperty: ["--metric-gap"] }],
    ]);
  });

  it.each([
    { text: "{", problem: "custom-elements.json is not valid JSON" },
    { text: "{}", problem: "custom-elements.json has no modules list" },
  ])("rejects a manifest $text", ({ text, problem }) => {
    expect(() => manifestElements(text)).toThrow(problem);
  });

  it("reads the token names of the records of a token source, and no other string", () => {
    const source = [
      'const main = ["color-canvas", "color-sheet"];',
      "export const records = tokenRecords([",
      '  { name: "color-canvas", group: "colour", value: { light: "#F1EEE8", dark: "#15130F" } }, // the page ground',
      '  { name: "space-1", group: "space", value: "4px" },',
      "]);",
    ].join("\n");
    expect([...tokenNames(source)]).toEqual(["color-canvas", "space-1"]);
  });
});

describe("parseGapTable: the rows of #1's gap checklist", () => {
  it("reads the seventeen rows of the committed gap table, in order, verbatim", () => {
    const rows = parseGapTable(readFileSync(new URL(`../../${table}`, import.meta.url), "utf8"));
    expect({ count: rows.length, first: rows[0], tenth: rows[9], last: rows.at(-1) }).toEqual({
      count: 17,
      first: { upstream: ["#492"], need: "personal-rail flip bound and orientation opt-out", metIn: "#8 layout and headers" },
      tenth: { upstream: ["#509"], need: "metric row layout, eyebrow style, compact notice", metIn: "#7, #9, #5" },
      last: { upstream: ["#531", "#535"], need: "compact screen type scale, mono value style, identifier wrap policy", metIn: "#5 tokens, #6 base styles" },
    });
  });

  it("reads only the table's rows, not its header, its rule or another table", () => {
    const text = "# T\n\n| Upstream | Need | Met in |\n|---|---|---|\n| #1 #2 | a need | #3 x |\n\n## Other\n\n| A | B |\n|---|---|\n| x | y |\n";
    expect(parseGapTable(text)).toEqual([{ upstream: ["#1", "#2"], need: "a need", metIn: "#3 x" }]);
  });

  it("rejects a text that holds no gap-table row", () => {
    expect(() => parseGapTable("# Nothing here\n")).toThrow("holds no gap-table row");
  });
});

const railRow: TableRow = { upstream: ["#492"], need: "personal-rail flip bound and orientation opt-out", metIn: "#8 layout and headers" };
const metricRow: TableRow = { upstream: ["#509"], need: "metric row layout, eyebrow style, compact notice", metIn: "#7, #9, #5" };
const tableRows: TableRow[] = [railRow, metricRow];
const metric: GapRow = {
  ...metricRow,
  evidence: [{ kind: "element", tag: "ocelle-metric" }, { kind: "member", tag: "ocelle-metric", memberKind: "attribute", name: "layout" }],
};
const rail: GapRow = { ...railRow, evidence: [{ kind: "token", name: "color-canvas" }, { kind: "spec", dir: "018-status-elements" }] };

describe("parseGapRows (data-model.md § Gap row)", () => {
  it("reads rows with each kind of evidence", () => {
    const rows = [rail, metric, { ...rail, evidence: [{ kind: "style-hook", file: "base.css", selector: "[data-ocelle-prose]" }] }];
    expect(parseGapRows(JSON.stringify(rows))).toEqual(rows);
  });

  it.each([
    { text: "[", problem: "gap-rows.json is not valid JSON" },
    { text: "{}", problem: "gap-rows.json is not a list of rows" },
    { text: JSON.stringify([7]), problem: "row 1 is not an object" },
    { text: JSON.stringify([{ ...rail, upstream: [] }]), problem: "row 1: upstream must be a non-empty list of issue numbers (#<n>)" },
    { text: JSON.stringify([{ ...rail, upstream: ["492"] }]), problem: "row 1: upstream must be a non-empty list of issue numbers (#<n>)" },
    { text: JSON.stringify([rail, { ...rail, need: "" }]), problem: "row 2: need must be a non-empty string" },
    { text: JSON.stringify([{ ...rail, metIn: 8 }]), problem: "row 1: metIn must be a non-empty string" },
    { text: JSON.stringify([{ ...rail, evidence: [] }]), problem: "row 1: evidence must be a non-empty list" },
    { text: JSON.stringify([{ ...rail, evidence: [{ kind: "story", id: "x" }] }]), problem: "row 1: evidence 1 is not an element, member, token, style-hook or spec item" },
    { text: JSON.stringify([{ ...rail, evidence: [{ kind: "member", tag: "ocelle-metric", memberKind: "method", name: "focus" }] }]), problem: "row 1: evidence 1 is not an element, member, token, style-hook or spec item" },
    { text: JSON.stringify([{ ...rail, evidence: [{ kind: "element", tag: "" }] }]), problem: "row 1: evidence 1 is not an element, member, token, style-hook or spec item" },
    { text: JSON.stringify([{ ...rail, extra: true }]), problem: "row 1: unknown key extra" },
  ])("rejects $text, naming the problem", ({ text, problem }) => {
    expect(() => parseGapRows(text)).toThrow(problem);
  });
});

describe("gapRowFindings: rows met and unmet", () => {
  it("meets a row whose every item is met and which holds an item that is not of kind spec, and lists each row with its evidence", () => {
    expect(gapRowFindings([rail, metric], tableRows, inputs)).toEqual({
      findings: [],
      met: 2,
      lines: [
        `${gate}: row 1 (#492) met: token --ocelle-color-canvas, spec 018-status-elements`,
        `${gate}: row 2 (#509) met: element ocelle-metric, attribute layout of ocelle-metric`,
      ],
    });
  });

  it("reports a row with a missing item as gap-row-unmet, naming the row and every missing item", () => {
    const unmet: GapRow = { ...metric, evidence: [...metric.evidence, { kind: "element", tag: "ocelle-status-indicator" }, { kind: "member", tag: "ocelle-metric", memberKind: "field", name: "displayValue" }] };
    expect(gapRowFindings([rail, unmet], tableRows, inputs)).toEqual({
      findings: [{ location: { path: rowsFile }, gate, rule: "gap-row-unmet", message: "row 2 (#509): missing element ocelle-status-indicator, field displayValue of ocelle-metric" }],
      met: 1,
      lines: [`${gate}: row 1 (#492) met: token --ocelle-color-canvas, spec 018-status-elements`, `${gate}: row 2 (#509) not met`],
    });
  });

  it("reports a row met only by spec items as gap-row-unmet: a spec item alone does not meet a row", () => {
    const specOnly: GapRow = { ...rail, evidence: [{ kind: "spec", dir: "018-status-elements" }] };
    expect(gapRowFindings([specOnly, metric], tableRows, inputs).findings).toEqual([
      { location: { path: rowsFile }, gate, rule: "gap-row-unmet", message: "row 1 (#492): only spec evidence (spec 018-status-elements); a row needs an element, member, token or style-hook item" },
    ]);
  });
});

describe("gapRowFindings: gap-rows-mismatch against the gap table", () => {
  const mismatch = (message: string): Finding => ({ location: { path: rowsFile }, gate, rule: "gap-rows-mismatch", message });

  it("reports a reworded need, a changed upstream list and a changed Met in, row by row", () => {
    const reworded = [{ ...rail, need: "personal-rail flip bound" }, { ...metric, upstream: ["#509", "#510"], metIn: "#7" }];
    expect(gapRowFindings(reworded, tableRows, inputs).findings).toEqual([
      mismatch(`row 1: need differs from ${table}`),
      mismatch(`row 2: upstream and metIn differ from ${table}`),
    ]);
  });

  it("reports a missing row by the count, and a reordered pair at both rows", () => {
    expect({
      missing: gapRowFindings([rail], tableRows, inputs).findings,
      reordered: gapRowFindings([metric, rail], tableRows, inputs).findings,
    }).toEqual({
      missing: [mismatch(`lists 1 row, ${table} 2`)],
      reordered: [mismatch(`row 1: upstream, need and metIn differ from ${table}`), mismatch(`row 2: upstream, need and metIn differ from ${table}`)],
    });
  });
});

// The version, the tag and the changelogs (research.md R-09; FR-012, FR-013).
const dated = (body: string): string => `# Changelog\n\n## Unreleased\n\n## 1.0.0 - 2026-11-28\n\n${body}\n`;
function pkg(dir: string, changelog: string, version = "1.0.0"): ReleasePackage {
  return { dir, name: `@ocelle/${dir}`, version, changelog };
}
const released = (): ReleasePackage[] => [
  pkg("tokens", dated("### Added\n\n- `--ocelle-color-*`: the colours\n- `--ocelle-space-1`\n")),
  pkg("styles", dated("### Added\n\n- `base.css`\n")),
  pkg("elements", dated("### Added\n\n- `ocelle-a` and `ocelle-b`\n")),
];

describe("versionFindings: one version, and the tag", () => {
  it("finds nothing for one shared version and its tag, and names each package's version against the tokens'", () => {
    const later = released().map((p) => ({ ...p, version: "1.2.3" }));
    expect({ untagged: versionFindings(released()), tagged: versionFindings(released(), "v1.0.0"), later: versionFindings(later, "v1.2.3"), earlier: versionFindings(later, "v1.0.0").map(({ rule }) => rule) }).toEqual({
      untagged: [],
      tagged: [],
      later: [],
      earlier: ["tag-mismatch"],
    });
  });

  it("reports each package whose version differs from the tokens' as version-mismatch", () => {
    const packages = released().map((p) => (p.dir === "styles" ? { ...p, version: "1.0.1" } : p));
    expect(versionFindings(packages)).toEqual([
      { location: { path: "packages/styles/package.json" }, gate, rule: "version-mismatch", message: "version 1.0.1 differs from @ocelle/tokens 1.0.0" },
    ]);
  });

  it.each(["v1.0.1", "1.0.0", "v1.0.0-rc.1"])("reports the tag %s, which is not v and the version, as tag-mismatch", (tag) => {
    expect(versionFindings(released(), tag)).toEqual([
      { location: { path: "packages/tokens/package.json" }, gate, rule: "tag-mismatch", message: `the tag ${tag} is not v1.0.0` },
    ]);
  });
});

describe("changelogFindings: the dated entry of the version", () => {
  const at = (dir: string, rule: string, message: string): Finding => ({ location: { path: `packages/${dir}/CHANGELOG.md` }, gate, rule, message });
  const tokens = ["color-canvas", "space-1"];
  const tags = ["ocelle-a", "ocelle-b"];
  const withStyles = (changelog: string): ReleasePackage[] => released().map((p) => (p.dir === "styles" ? { ...p, changelog } : p));

  it("finds nothing when each package has a dated, non-empty entry and names the elements and tokens, and checks the version given", () => {
    expect({ released: changelogFindings(released(), "1.0.0", tags, tokens), next: changelogFindings(released(), "1.0.1", tags, tokens).map(({ location, rule }) => [location, rule]) }).toEqual({
      released: [],
      next: ["tokens", "styles", "elements"].map((dir) => [{ path: `packages/${dir}/CHANGELOG.md` }, "changelog-missing-entry"]),
    });
  });

  it.each([
    { what: "no entry", text: "# Changelog\n\n## Unreleased\n\n- x\n", rule: "changelog-missing-entry", message: "has no ## 1.0.0 entry" },
    { what: "an entry of another version", text: "## 1.0.1 - 2026-11-28\n\n- x\n", rule: "changelog-missing-entry", message: "has no ## 1.0.0 entry" },
    { what: "an undated heading", text: "## 1.0.0\n\n- x\n", rule: "changelog-undated", message: "the 1.0.0 entry's heading is not ## 1.0.0 - <YYYY-MM-DD>" },
    { what: "a heading dated in words", text: "## 1.0.0 - soon\n\n- x\n", rule: "changelog-undated", message: "the 1.0.0 entry's heading is not ## 1.0.0 - <YYYY-MM-DD>" },
    { what: "a heading with no day 13-01", text: "## 1.0.0 - 2026-13-01\n\n- x\n", rule: "changelog-undated", message: "the 1.0.0 entry's heading is not ## 1.0.0 - <YYYY-MM-DD>" },
    { what: "an empty entry", text: "## 1.0.0 - 2026-11-28\n\n\n## 0.9.0 - 2026-01-01\n\n- x\n", rule: "changelog-missing-entry", message: "the 1.0.0 entry is empty" },
  ])("reports $what as $rule", ({ text, rule, message }) => {
    expect(changelogFindings(withStyles(text), "1.0.0", tags, tokens)).toEqual([at("styles", rule, message)]);
  });

  it("reports, with a tag, an Unreleased section that is not empty; a heading alone is empty, and without a tag nothing is checked", () => {
    const pending = "## Unreleased\n\n- a later fix\n\n## 1.0.0 - 2026-11-28\n\n- x\n";
    const headingOnly = "## Unreleased\n\n### Added\n\n## 1.0.0 - 2026-11-28\n\n- x\n";
    expect({
      tagged: changelogFindings(withStyles(pending), "1.0.0", tags, tokens, "v1.0.0"),
      untagged: changelogFindings(withStyles(pending), "1.0.0", tags, tokens),
      headingOnly: changelogFindings(withStyles(headingOnly), "1.0.0", tags, tokens, "v1.0.0"),
    }).toEqual({
      tagged: [at("styles", "changelog-unreleased-not-empty", "the Unreleased section is not empty; with the tag v1.0.0 everything released is named under 1.0.0")],
      untagged: [],
      headingOnly: [],
    });
  });

  it("reports the element tags the elements changelog does not name as `ocelle-x`, in any section", () => {
    const elements = (text: string): ReleasePackage[] => released().map((p) => (p.dir === "elements" ? { ...p, changelog: text } : p));
    const later = "## Unreleased\n\n- `ocelle-c`\n\n## 1.0.0 - 2026-11-28\n\n- `ocelle-a`, ocelle-b\n";
    expect(changelogFindings(elements(later), "1.0.0", ["ocelle-a", "ocelle-b", "ocelle-c", "ocelle-d"], tokens)).toEqual([
      at("elements", "changelog-missing-element", "does not name ocelle-b, ocelle-d"),
    ]);
  });

  it("reports the tokens the tokens changelog does not cover, grouped by their first name segment", () => {
    const names = ["color-canvas", "space-1", "shadow-raised", "shadow-overlay", "zeta"];
    expect(changelogFindings(released(), "1.0.0", tags, names)).toEqual([
      at("tokens", "changelog-missing-token", "does not name, in full or by a `--ocelle-<prefix>-*` mention: shadow (--ocelle-shadow-raised, --ocelle-shadow-overlay), zeta (--ocelle-zeta)"),
    ]);
  });
});

describe("uncoveredTokens: full names and prefix mentions (operator decision PLAN-CORRECTNESS-1-005 (a))", () => {
  const tokens = ["color-canvas", "color-accent-strong", "color-accent-low", "space-1", "space-10", "spacer"];

  it("covers a token named in full or by a `--ocelle-<prefix>-*` mention of a prefix of its name, in any section", () => {
    const text = "## Unreleased\n\n- `--ocelle-space-*`\n\n## 1.0.0 - 2026-11-28\n\n- `--ocelle-color-accent-*` and `--ocelle-color-canvas`\n- `--ocelle-spacer`\n";
    expect({ covered: uncoveredTokens(text, tokens), none: uncoveredTokens("", tokens) }).toEqual({ covered: [], none: tokens });
  });

  it("does not cover a token by a prefix that is not followed by a dash in its name, by a bare name, or by a name outside a code span", () => {
    const text = "- `--ocelle-color-accent-*`\n- `--ocelle-space*`\n- --ocelle-space-1 and `ocelle-color-canvas`\n- `--ocelle-spa-*`\n";
    expect(uncoveredTokens(text, tokens)).toEqual(["color-canvas", "space-1", "space-10", "spacer"]);
  });
});

describe("readiness: one verdict (FR-014)", () => {
  const gapLines = [`${gate}: row 1 (#492) met: token --ocelle-color-canvas`];
  const input = (change: Partial<ReadinessInput> = {}): ReadinessInput => ({
    packages: released(),
    elementTags: ["ocelle-a", "ocelle-b"],
    tokens: ["color-canvas", "space-1"],
    gap: { findings: [], met: 17, total: 17, lines: gapLines },
    secrets: { findings: [], count: 0 },
    ...change,
  });
  const unmet: Finding = { location: { path: rowsFile }, gate, rule: "gap-row-unmet", message: "row 6 (#498): missing element ocelle-status-indicator" };
  const secret: Finding = { location: { path: `${c1}:.env` }, gate, rule: "secret", message: "env-assignment: an added line matches this rule; the matched text is not printed" };

  it("is ready, exit 0, with the rows listed before the summary", () => {
    expect(readiness(input())).toEqual({ lines: gapLines, result: { exit: 0, summary: `${gate}: ready (17/17 rows, 0 secrets, version 1.0.0)` } });
  });

  it("is not ready, exit 1, with the gap, secret, version and changelog findings in that order and their count", () => {
    const packages = released().map((p) => (p.dir === "elements" ? { ...p, version: "1.0.1" } : p));
    expect(readiness(input({ packages, tag: "v1.0.0", gap: { findings: [unmet], met: 16, total: 17, lines: gapLines }, secrets: { findings: [secret], count: 1 } }))).toEqual({
      lines: gapLines,
      result: {
        exit: 1,
        findings: [
          unmet,
          secret,
          { location: { path: "packages/elements/package.json" }, gate, rule: "version-mismatch", message: "version 1.0.1 differs from @ocelle/tokens 1.0.0" },
        ],
        summary: `${gate}: not ready (16/17 rows, 1 secret, version 1.0.0; 3 findings)`,
      },
    });
  });

  it("is not ready on a changelog finding alone, and counts secrets in the plural", () => {
    const elementTags = ["ocelle-a", "ocelle-b", "ocelle-c"];
    expect(readiness(input({ elementTags, secrets: { findings: [secret, secret], count: 2 } })).result).toEqual({
      exit: 1,
      findings: [secret, secret, { location: { path: "packages/elements/CHANGELOG.md" }, gate, rule: "changelog-missing-element", message: "does not name ocelle-c" }],
      summary: `${gate}: not ready (17/17 rows, 2 secrets, version 1.0.0; 3 findings)`,
    });
  });
});
