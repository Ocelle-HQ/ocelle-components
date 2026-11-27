// The pack-contents gate's decisions (030 FR-004; scaffold: no behaviour yet).
import type { GateResult } from "./findings.ts";

/** The deny list (contracts/pack-contents-gate.md): code, not data, so a plant cannot widen it. */
export const denyPatterns: readonly string[] = [];

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

/** The entries of a pack-manifest.json text; throws naming the problem. */
export function parsePackManifest(text: string): PackEntry[] {
  throw new Error(`not implemented: ${String(text.length)}`);
}

/** Whether a tarball path matches a glob pattern. */
export function globMatch(pattern: string, path: string): boolean {
  return pattern === path && false;
}

/** One declared entry point of a packed manifest: where it is declared and the path it names. */
export interface EntryPoint {
  readonly label: string;
  readonly target: string;
}

/** The declared entry points of a packed manifest. */
export function entryPoints(manifest: Readonly<Record<string, unknown>>): EntryPoint[] {
  return Object.keys(manifest).flatMap(() => []);
}

/** The regular files of a gzipped tarball, by path below `package/`; throws when it is not readable. */
export function readTarball(bytes: Uint8Array): Map<string, Uint8Array> {
  throw new Error(`not implemented: ${String(bytes.length)}`);
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

/** The verdict of a run. */
export function verdict(run: PackRun): PackVerdict {
  return { lines: [], result: { exit: 2, cause: `pack-contents: could not run: not implemented (${String(run.tarballs.length)} tarballs)` } };
}
