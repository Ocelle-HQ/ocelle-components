// The pack-contents gate's decisions (030 FR-004, FR-006; contracts/pack-contents-gate.md; data-model.md § Pack
// manifest; research.md R-02 to R-05): the pack manifest's entries, the deny list (code, not data, so a plant cannot
// widen it), glob matching, the declared entry points of a packed manifest, the regular files of a gzipped tarball, and
// the verdict on the tarballs of one run: per package the packed manifest's fields, its entry points, its required and
// identical files, every file against the deny list and then the allow list, and op 023's sandbox-path rule on every
// text entry. Pure and tested in process (gates/test/pack-contents.test.ts); gates/bin/pack-contents.ts reads the
// files, builds and packs.
import { gunzipSync } from "node:zlib";
import { plural } from "./findings.ts";
import type { Finding, GateResult } from "./findings.ts";
import { sandboxPathRule } from "./sandbox-paths.ts";

const gate = "pack-contents";

/** The deny list (contracts/pack-contents-gate.md): code, not data, so a plant cannot widen it. */
export const denyPatterns: readonly string[] = [
  "**/*.test.*",
  "**/*.spec.*",
  "**/*.stories.*",
  "**/.npmrc",
  "**/.env*",
  "**/*.pem",
  "**/*.key",
  "**/id_rsa*",
  "**/id_ed25519*",
  "**/test/**",
];

/** The packages of the release, each once in the pack manifest (data-model.md § Pack manifest). */
const packageNames = ["@ocelle/tokens", "@ocelle/styles", "@ocelle/elements"];

/** The repository every packed manifest names (data-model.md § Package manifest fields). */
const repositoryUrl = "git+https://github.com/Ocelle-HQ/ocelle-components.git";

/** The dependency fields a packed manifest may hold a `workspace:` specifier in. */
const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];

/** The entry-point fields beside `exports` (research.md R-05). */
const entryFields = ["main", "module", "types", "customElements"];

const sandboxMessage = "holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place";

/** An `identical` entry: the tarball path and the repository path it must equal byte for byte. */
export interface IdenticalEntry {
  readonly path: string;
  readonly source: string;
}

/** One entry of gates/release/pack-manifest.json (data-model.md § Pack manifest). */
export interface PackEntry {
  readonly name: string;
  readonly dir: string;
  readonly allow: readonly string[];
  readonly require: readonly string[];
  readonly identical: readonly IdenticalEntry[];
  readonly peer: Readonly<Record<string, string>>;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPaths(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string" && item !== "");
}

/** An `identical` entry as written: a bare path (the root file of that name) or `{ path, source }`; undefined if neither. */
function identicalEntry(value: unknown): IdenticalEntry | undefined {
  if (typeof value === "string") return value === "" ? undefined : { path: value, source: value };
  if (!isObject(value)) return undefined;
  const { path, source } = value;
  return typeof path === "string" && path !== "" && typeof source === "string" && source !== "" ? { path, source } : undefined;
}

/** One entry of the pack manifest, or throws naming its problem. */
function packEntry(value: unknown, at: string): PackEntry {
  if (!isObject(value)) throw new Error(`${at} is not an object`);
  const { name, dir, allow, require, identical, peer } = value;
  if (typeof name !== "string" || !packageNames.includes(name)) throw new Error(`${at}: name must be ${packageNames.slice(0, -1).join(", ")} or ${String(packageNames.at(-1))}`);
  if (typeof dir !== "string" || dir === "") throw new Error(`${at}: dir must be a non-empty string`);
  if (!isPaths(allow) || allow.length === 0) throw new Error(`${at}: allow must be a non-empty list of patterns`);
  if (!isPaths(require)) throw new Error(`${at}: require must be a list of paths`);
  const entries = Array.isArray(identical) ? identical.map(identicalEntry) : [undefined];
  if (entries.includes(undefined)) throw new Error(`${at}: identical must be a list of paths or { path, source } entries`);
  if (!isObject(peer) || !Object.values(peer).every((range) => typeof range === "string")) throw new Error(`${at}: peer must be an object of package names and ranges`);
  return { name, dir, allow, require, identical: entries as IdenticalEntry[], peer: peer as Record<string, string> };
}

/** The entries of a pack-manifest.json text: the three packages, each once; throws naming the problem. */
export function parsePackManifest(text: string): PackEntry[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new Error(`not valid JSON (${error instanceof Error ? error.message : String(error)})`, { cause: error });
  }
  if (!Array.isArray(value)) throw new Error("not a list of packages");
  const entries: PackEntry[] = [];
  for (const [index, item] of (value as unknown[]).entries()) {
    const at = `package ${String(index + 1)}`;
    const entry = packEntry(item, at);
    if (entries.some((other) => other.name === entry.name)) throw new Error(`${at}: ${entry.name} is listed twice`);
    entries.push(entry);
  }
  const missing = packageNames.find((name) => !entries.some((entry) => entry.name === name));
  if (missing !== undefined) throw new Error(`no entry for ${missing}`);
  return entries;
}

/** Regular-expression source of one glob segment: `*` any run and `?` one character, neither crossing `/`. */
function segmentSource(segment: string): string {
  return segment.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]");
}

/**
 * Whether a tarball path matches a glob pattern: `**` as a whole segment matches any number of directories (none
 * included) or, last, anything below; `*` and `?` stay within a segment; every other character is itself.
 */
export function globMatch(pattern: string, path: string): boolean {
  const segments = pattern.split("/");
  const source = segments
    .map((segment, index) => {
      const last = index === segments.length - 1;
      if (segment === "**") return last ? ".*" : "(?:[^/]*/)*";
      return `${segmentSource(segment)}${last ? "" : "/"}`;
    })
    .join("");
  return new RegExp(`^${source}$`).test(path);
}

/** One declared entry point of a packed manifest: where it is declared and the path it names. */
export interface EntryPoint {
  readonly label: string;
  readonly target: string;
}

/** A target as a tarball path: without its leading `./`. */
function tarballPath(target: string): string {
  return target.replace(/^\.\//, "");
}

/**
 * The declared entry points of a packed manifest (research.md R-05): every `exports` target (a string as the `.`
 * export; a key starting with `.` a subpath, any other key a condition; arrays read in order; null skipped), then
 * `main`, `module`, `types` and `customElements` where they are text.
 */
export function entryPoints(manifest: Readonly<Record<string, unknown>>): EntryPoint[] {
  const found: EntryPoint[] = [];
  const visit = (value: unknown, label: string): void => {
    if (typeof value === "string") found.push({ label, target: tarballPath(value) });
    else if (Array.isArray(value)) for (const item of value) visit(item, label);
    else if (isObject(value)) for (const [key, inner] of Object.entries(value)) visit(inner, key.startsWith(".") ? `exports "${key}"` : `${label} ${key}`);
  };
  visit(manifest.exports, 'exports "."');
  for (const field of entryFields) {
    const target = manifest[field];
    if (typeof target === "string") found.push({ label: field, target: tarballPath(target) });
  }
  return found;
}

/** A text field of a tar header: its bytes up to the first NUL. */
function field(block: Uint8Array, offset: number, length: number): string {
  const raw = Buffer.from(block.subarray(offset, offset + length));
  const end = raw.indexOf(0);
  return raw.subarray(0, end === -1 ? length : end).toString("utf8");
}

/** The `path` of a pax extended header's records, if it has one. */
function paxPath(data: Uint8Array): string | undefined {
  for (const record of Buffer.from(data).toString("utf8").split("\n")) {
    const path = /^\d+ path=(.*)$/.exec(record)?.[1];
    if (path !== undefined) return path;
  }
  return undefined;
}

/**
 * The regular files of a gzipped tarball by their path below `package/`, byte for byte: ustar headers (the prefix
 * joined to the name), a pax header's path for the next entry, directories and pax global headers skipped. Throws on
 * bytes that are not gzip, a block that is not a ustar header, a size that is not octal, data cut off, an entry outside
 * `package/`, and any entry that is neither a file nor a directory (a link among them).
 */
export function readTarball(bytes: Uint8Array): Map<string, Uint8Array> {
  const tar = gunzipSync(bytes);
  const files = new Map<string, Uint8Array>();
  let next: string | undefined;
  for (let at = 0; at + 512 <= tar.length; ) {
    const block = tar.subarray(at, at + 512);
    if (block.every((byte) => byte === 0)) break;
    if (!field(block, 257, 6).startsWith("ustar")) throw new Error(`entry at byte ${String(at)} has no ustar header`);
    const prefix = field(block, 345, 155);
    const path = next ?? (prefix === "" ? field(block, 0, 100) : `${prefix}/${field(block, 0, 100)}`);
    next = undefined;
    const size = field(block, 124, 12).trim();
    if (!/^[0-7]+$/.test(size)) throw new Error(`${path} has no octal size`);
    const length = parseInt(size, 8);
    const data = tar.subarray(at + 512, at + 512 + length);
    if (data.length < length) throw new Error(`${path} is cut off`);
    const type = String.fromCharCode(block[156] ?? 0);
    if (type === "x") next = paxPath(data);
    else if (type === "0" || type === "\u0000" || type === "7") {
      if (!path.startsWith("package/")) throw new Error(`${path} is outside package/`);
      files.set(path.slice("package/".length), Buffer.from(data));
    } else if (type !== "5" && type !== "g") throw new Error(`${path} is neither a file nor a directory`);
    at += 512 + Math.ceil(length / 512) * 512;
  }
  return files;
}

/** One tarball the gate reads: its file name and its bytes. */
export interface TarballFile {
  readonly file: string;
  readonly bytes: Uint8Array;
}

/** One run of the gate: the pack manifest, the tarballs, the repository files `identical` names, and the version. */
export interface PackRun {
  readonly manifest: readonly PackEntry[];
  readonly tarballs: readonly TarballFile[];
  readonly sources: ReadonlyMap<string, Uint8Array>;
  readonly version: string;
}

/** The gate's verdict: the lines printed before the result (one per package at exit 0), and the result. */
export interface PackVerdict {
  readonly lines: readonly string[];
  readonly result: GateResult;
}

/**
 * One packed package: its pack-manifest entry, its tarball's file name, its files below package/, its package.json, and
 * the repository bytes of each identical entry.
 */
interface Packed {
  readonly entry: PackEntry;
  readonly file: string;
  readonly files: ReadonlyMap<string, Uint8Array>;
  readonly manifest: Readonly<Record<string, unknown>>;
  readonly identical: readonly (IdenticalEntry & { readonly bytes: Uint8Array })[];
}

/** A value of a packed manifest as a finding shows it: JSON, or `missing`. */
function shown(value: unknown): string {
  return value === undefined ? "missing" : JSON.stringify(value);
}

/** Whether a packed peerDependencies value is exactly the expected peers: an object of the same names and ranges. */
function samePeers(actual: unknown, expected: Readonly<Record<string, string>>): boolean {
  if (!isObject(actual)) return false;
  const names = Object.keys(actual);
  return names.length === Object.keys(expected).length && names.every((name) => actual[name] === expected[name]);
}

/** The package.json of a tarball's files, if it parses to an object. */
function manifestOf(files: ReadonlyMap<string, Uint8Array>): Record<string, unknown> | undefined {
  const bytes = files.get("package.json");
  if (bytes === undefined) return undefined;
  try {
    const value: unknown = JSON.parse(Buffer.from(bytes).toString("utf8"));
    return isObject(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The findings of a package's packed manifest fields: private flag, version (against the release and against the first
 * package, which never differs from itself), licence, repository, workspace: specifiers and peer.
 */
function manifestFindings(packed: Packed, run: PackRun, first: Packed): Finding[] {
  const { entry, manifest } = packed;
  const at = (rule: string, message: string): Finding => ({ location: { path: `${entry.name}:package.json` }, gate, rule, message });
  const found: Finding[] = [];
  if ("private" in manifest) found.push(at("private-flag", `the packed manifest sets "private": ${JSON.stringify(manifest.private)}; a published package has no private flag`));
  if (manifest.version !== run.version) found.push(at("version-mismatch", `version is ${shown(manifest.version)}, not the release version ${run.version}`));
  if (manifest.version !== first.manifest.version) found.push(at("version-mismatch", `version is ${shown(manifest.version)}, but ${first.entry.name} is at ${shown(first.manifest.version)}`));
  if (manifest.license !== "Apache-2.0") found.push(at("license-field", `license is ${shown(manifest.license)}, not "Apache-2.0"`));
  const expected = { type: "git", url: repositoryUrl, directory: entry.dir };
  const { repository } = manifest;
  if (!isObject(repository)) found.push(at("repository-mismatch", `repository is ${shown(repository)}, not ${JSON.stringify(expected)}`));
  else {
    for (const [key, value] of Object.entries(expected)) {
      if (repository[key] !== value) found.push(at("repository-mismatch", `repository.${key} is ${shown(repository[key])}, not ${JSON.stringify(value)}`));
    }
  }
  for (const name of dependencyFields) {
    const dependencies = manifest[name];
    if (!isObject(dependencies)) continue;
    for (const [dependency, spec] of Object.entries(dependencies)) {
      if (typeof spec === "string" && spec.startsWith("workspace:")) found.push(at("workspace-specifier", `${name}.${dependency} is "${spec}"; a published manifest holds no workspace: specifier`));
    }
  }
  const peer = Object.fromEntries(Object.entries(entry.peer).map(([name, range]) => [name, range.replaceAll("<version>", run.version)]));
  if (!samePeers(manifest.peerDependencies ?? {}, peer)) found.push(at("peer-mismatch", `peerDependencies is ${shown(manifest.peerDependencies)}, not ${JSON.stringify(peer)}`));
  return found;
}

/** Whether an entry-point pattern (a `*` matching any run, `/` included, as Node's subpath patterns do) matches a path. */
function patternMatch(pattern: string, path: string): boolean {
  return new RegExp(`^${pattern.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`).test(path);
}

/** The line numbers (from 1) of a text entry's lines that hold a sandbox path; none for a binary entry (a NUL byte). */
function sandboxLines(bytes: Uint8Array): number[] {
  if (bytes.includes(0)) return [];
  const rule = new RegExp(sandboxPathRule);
  return Buffer.from(bytes)
    .toString("utf8")
    .split("\n")
    .flatMap((line, index) => (rule.test(line) ? [index + 1] : []));
}

/** Every finding of one package, in check order: manifest fields, entry points, required, identical, then per file. */
function packageFindings(packed: Packed, run: PackRun, first: Packed): Finding[] {
  const { entry } = packed;
  const at = (path: string, rule: string, message: string): Finding => ({ location: { path: `${entry.name}:${path}` }, gate, rule, message });
  const paths = [...packed.files.keys()];
  const found = manifestFindings(packed, run, first);
  for (const { label, target } of entryPoints(packed.manifest)) {
    if (target.includes("*")) {
      if (!paths.some((path) => patternMatch(target, path))) found.push(at(target, "entry-pattern-empty", `${label} names a pattern that matches no file of the tarball`));
    } else if (!packed.files.has(target)) found.push(at(target, "entry-point-missing", `${label} names it, but the tarball does not hold it`));
  }
  for (const path of entry.require) {
    if (!packed.files.has(path)) found.push(at(path, "required-missing", "the pack manifest requires it, but the tarball does not hold it"));
  }
  for (const { path, source, bytes } of packed.identical) {
    const shipped = packed.files.get(path);
    if (shipped !== undefined && !Buffer.from(shipped).equals(Buffer.from(bytes))) found.push(at(path, "not-identical", `differs from the repository's ${source}`));
  }
  for (const [path, bytes] of [...packed.files].sort(([a], [b]) => a.localeCompare(b))) {
    const denied = denyPatterns.find((pattern) => globMatch(pattern, path));
    if (denied !== undefined) found.push(at(path, "denied", `matches the deny pattern ${denied}`));
    else if (!entry.allow.some((pattern) => globMatch(pattern, path))) found.push(at(path, "not-allowed", "matches no allow pattern of the pack manifest"));
    for (const line of sandboxLines(bytes)) found.push(at(path, "sandbox-path", `line ${String(line)} ${sandboxMessage}`));
  }
  return found;
}

/** The packed packages of the run's tarballs in the order of the pack manifest, or the cause the gate could not run. */
function packedPackages(run: PackRun): Packed[] | string {
  const byName = new Map<string, Omit<Packed, "entry" | "identical">>();
  for (const { file, bytes } of run.tarballs) {
    let files: Map<string, Uint8Array>;
    try {
      files = readTarball(bytes);
    } catch (error) {
      return `${file} is not a readable tarball (${error instanceof Error ? error.message : String(error)})`;
    }
    const manifest = manifestOf(files);
    const name = manifest?.name;
    if (manifest === undefined || typeof name !== "string") return `${file} holds no package/package.json that names its package`;
    if (!run.manifest.some((entry) => entry.name === name)) return `${file} is ${name}, which the pack manifest does not list`;
    const other = byName.get(name);
    if (other !== undefined) return `${other.file} and ${file} are both ${name}`;
    byName.set(name, { file, files, manifest });
  }
  const packed: Packed[] = [];
  for (const entry of run.manifest) {
    const found = byName.get(entry.name);
    if (found === undefined) return `no tarball of ${entry.name}`;
    const identical: (IdenticalEntry & { readonly bytes: Uint8Array })[] = [];
    for (const { path, source } of entry.identical) {
      const bytes = run.sources.get(source);
      if (bytes === undefined) return `the repository holds no ${source}, which ${entry.name}'s identical list names`;
      identical.push({ path, source, bytes });
    }
    packed.push({ entry, ...found, identical });
  }
  return packed;
}

/**
 * The verdict of a run: exit 2 when a tarball cannot be read or attributed to one package of the pack manifest, a
 * package has no tarball, or a repository file an identical entry names is missing; else every finding, package by
 * package in manifest order (exit 1), or one line per package with its version, file count and entry-point count and
 * the summary (exit 0). Each package's version is compared with the release version and with the first package's.
 */
export function verdict(run: PackRun): PackVerdict {
  const packed = packedPackages(run);
  if (typeof packed === "string") return { lines: [], result: { exit: 2, cause: `${gate}: could not run: ${packed}` } };
  const each = packed.map((item, _, all) => packageFindings(item, run, all[0] ?? item));
  const findings = each.flat();
  if (findings.length > 0) {
    const packages = each.filter((found) => found.length > 0).length;
    return { lines: [], result: { exit: 1, findings, summary: `${gate}: ${plural(findings.length, "finding")} in ${plural(packages, "package")}` } };
  }
  const lines = packed.map(({ entry, files, manifest }) => `${gate}: ${entry.name}@${String(manifest.version)}: ${plural(files.size, "file")}, ${plural(entryPoints(manifest).length, "entry point")}`);
  return { lines, result: { exit: 0, summary: `${gate}: ${plural(packed.length, "package")} at ${run.version}, each tarball exactly as declared` } };
}
