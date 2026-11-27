import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { emit } from "../lib/findings.ts";
import { denyPatterns, entryPoints, globMatch, parsePackManifest, readTarball, verdict } from "../lib/pack-contents.ts";
import type { PackEntry, PackRun, PackVerdict } from "../lib/pack-contents.ts";

// 030 T005 (spec.md Story 1, FR-004; contracts/pack-contents-gate.md; data-model.md § Pack manifest; research.md R-04,
// R-05): the pack-contents gate's rules on in-memory tarballs and manifests, no build. Each finding rule of the
// contract with its exact line `<package>:<path>: pack-contents: <rule>: <message>`, the exit-0 line per package and
// the summary, and exit 2 for a tarball that cannot be read or attributed. The tarballs are made here as gzipped ustar
// archives with every entry under package/, as pnpm pack writes them.

/** One tar header block: ustar, the name (and prefix) split as given, the size in octal, the checksum filled in. */
function header(name: string, size: number, type: string, prefix = "", magic = "ustar\u000000", sizeField?: string): Buffer {
  const block = Buffer.alloc(512);
  block.write(name, 0, 100, "utf8");
  block.write("0000644\u0000", 100);
  block.write("0000000\u0000", 108);
  block.write("0000000\u0000", 116);
  block.write(sizeField ?? `${size.toString(8).padStart(11, "0")}\u0000`, 124);
  block.write("00000000000\u0000", 136);
  block.write("        ", 148);
  block.write(type, 156);
  block.write(magic, 257);
  block.write(prefix, 345, 155, "utf8");
  let sum = 0;
  for (const byte of block) sum += byte;
  block.write(`${sum.toString(8).padStart(6, "0")}\u0000 `, 148);
  return block;
}

/** Data padded to whole 512-byte blocks. */
function padded(data: Buffer): Buffer {
  return Buffer.concat([data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
}

interface TarEntry {
  readonly name: string;
  readonly data?: string | Buffer;
  readonly type?: string;
  readonly prefix?: string;
  readonly magic?: string;
  /** The size field as written, instead of eleven octal digits and a NUL. */
  readonly sizeField?: string;
}

/** readTarball's files of an archive, asserting first that it reads the archive at all (an assertion, never a throw). */
function readable(bytes: Buffer): Map<string, Uint8Array> {
  expect(() => readTarball(bytes)).not.toThrow();
  return readTarball(bytes);
}

/** A gzipped tar archive of the entries, closed by two zero blocks. */
function tar(entries: readonly TarEntry[], close = true): Buffer {
  const blocks = entries.flatMap((entry) => {
    const data = Buffer.from(entry.data ?? "");
    return [header(entry.name, data.length, entry.type ?? "0", entry.prefix, entry.magic, entry.sizeField), padded(data)];
  });
  return gzipSync(Buffer.concat([...blocks, ...(close ? [Buffer.alloc(1024)] : [])]));
}

/** One pax extended-header record, `<length> <key>=<value>\n`, its length counting itself. */
function paxRecord(key: string, value: string): string {
  const body = ` ${key}=${value}\n`;
  let digits = 1;
  while (String(body.length + digits).length !== digits) digits += 1;
  return `${String(body.length + digits)}${body}`;
}

/** A tarball of the files (path below package/ to content), each a regular file. */
function tarball(files: Readonly<Record<string, string | Buffer>>): Buffer {
  return tar(Object.entries(files).map(([path, data]) => ({ name: `package/${path}`, data })));
}

const sandboxHome = "/" + "home/user";
const repositoryUrl = "git+https://github.com/Ocelle-HQ/ocelle-components.git";
const repository = (dir: string): Record<string, string> => ({ type: "git", url: repositoryUrl, directory: dir });

const licence = "Apache License\nVersion 2.0\n";
const notice = "ocelle-components\nEach published @ocelle package holds a copy.\n";
const thirdParty = "Schibsted Grotesk, SIL OFL 1.1\n";
const ofl = "SIL OPEN FONT LICENSE Version 1.1\n";
const sources = new Map<string, Uint8Array>([
  ["LICENSE", Buffer.from(licence)],
  ["NOTICE", Buffer.from(notice)],
  ["THIRD_PARTY_NOTICES", Buffer.from(thirdParty)],
  ["packages/tokens/fonts/OFL.txt", Buffer.from(ofl)],
]);

const same = (path: string): { path: string; source: string } => ({ path, source: path });
const docs = ["package.json", "README.md", "CHANGELOG.md", "LICENSE", "NOTICE"];

/** The pack manifest of these tests: the three packages, as gates/release/pack-manifest.json describes them. */
const manifest: PackEntry[] = [
  {
    name: "@ocelle/tokens",
    dir: "packages/tokens",
    allow: [...docs, "THIRD_PARTY_NOTICES", "dist/**/*.js", "dist/tokens.css", "dist/fonts/*.woff2", "dist/fonts/OFL.txt"],
    require: [...docs, "THIRD_PARTY_NOTICES", "dist/fonts/OFL.txt"],
    identical: [same("LICENSE"), same("NOTICE"), same("THIRD_PARTY_NOTICES"), { path: "dist/fonts/OFL.txt", source: "packages/tokens/fonts/OFL.txt" }],
    peer: {},
  },
  {
    name: "@ocelle/styles",
    dir: "packages/styles",
    allow: [...docs, "dist/**/*.js", "dist/**/*.d.ts", "dist/base.css"],
    require: docs,
    identical: [same("LICENSE"), same("NOTICE")],
    peer: { "@ocelle/tokens": "^<version>" },
  },
  {
    name: "@ocelle/elements",
    dir: "packages/elements",
    allow: [...docs, "THIRD_PARTY_NOTICES", "custom-elements.json", "licenses/**", "dist/**/*.js", "dist/**/*.d.ts"],
    require: [...docs, "THIRD_PARTY_NOTICES"],
    identical: [same("LICENSE"), same("NOTICE"), same("THIRD_PARTY_NOTICES")],
    peer: { "@ocelle/tokens": "^<version>" },
  },
];

const version = "2.0.0";

type Files = Record<string, string | Buffer>;
type Manifests = Record<string, Record<string, unknown>>;

/** The packed manifests of three packages that meet every rule at 2.0.0. */
function manifests(): Manifests {
  const base = (name: string, dir: string): Record<string, unknown> => ({ name, version, license: "Apache-2.0", repository: repository(dir), type: "module" });
  return {
    tokens: { ...base("@ocelle/tokens", "packages/tokens"), exports: { ".": "./dist/index.js", "./tokens.css": "./dist/tokens.css", "./fonts/*": "./dist/fonts/*" } },
    styles: {
      ...base("@ocelle/styles", "packages/styles"),
      exports: { ".": "./dist/index.js", "./base.css": "./dist/base.css" },
      types: "./dist/index.d.ts",
      peerDependencies: { "@ocelle/tokens": "^2.0.0" },
    },
    elements: {
      ...base("@ocelle/elements", "packages/elements"),
      exports: { ".": "./dist/index.js", "./browser.js": "./dist/browser/ocelle-elements.js", "./custom-elements.json": "./custom-elements.json" },
      main: "./dist/index.js",
      module: "./dist/index.js",
      customElements: "custom-elements.json",
      dependencies: { lit: "3.3.3" },
      peerDependencies: { "@ocelle/tokens": "^2.0.0" },
    },
  };
}

/** The other files of the three packages (package.json comes from the manifests). */
function files(): Record<string, Files> {
  const common = { "README.md": "# Package\n", "CHANGELOG.md": "# Changelog\n", LICENSE: licence, NOTICE: notice };
  return {
    tokens: { ...common, THIRD_PARTY_NOTICES: thirdParty, "dist/index.js": "export {};\n", "dist/tokens.css": ":root {}\n", "dist/fonts/OFL.txt": ofl, "dist/fonts/Sans.woff2": Buffer.from([0, 1, 2, 0]) },
    styles: { ...common, "dist/index.js": "export {};\n", "dist/index.d.ts": "export {};\n", "dist/base.css": "body {}\n" },
    elements: {
      ...common,
      THIRD_PARTY_NOTICES: thirdParty,
      "custom-elements.json": "{}\n",
      "licenses/lit-BSD-3-Clause.txt": "BSD-3-Clause\n",
      "dist/index.js": "export {};\n",
      "dist/browser/ocelle-elements.js": "export {};\n",
    },
  };
}

/** A change that removes the given paths from one package's files. */
function drop(name: string, ...paths: string[]): (packed: Record<string, Files>) => void {
  return (packed) => {
    packed[name] = Object.fromEntries(Object.entries(packed[name] ?? {}).filter(([path]) => !paths.includes(path)));
  };
}

interface Change {
  readonly manifests?: (packed: Manifests) => void;
  readonly files?: (packed: Record<string, Files>) => void;
  readonly version?: string;
}

/** A run of the gate on the three packages, changed as given, with their tarballs in the order tokens, styles, elements. */
function packRun(change: Change = {}): PackRun {
  const packed = manifests();
  const other = files();
  change.manifests?.(packed);
  change.files?.(other);
  const tarballs = ["tokens", "styles", "elements"].map((name) => ({
    file: `ocelle-${name}-2.0.0.tgz`,
    bytes: tarball({ "package.json": JSON.stringify(packed[name], null, 2), ...other[name] }),
  }));
  return { manifest, tarballs, sources, version: change.version ?? version };
}

/** The lines the gate prints for a verdict: the package lines, then the result as emit() prints it, errors marked. */
function printed(result: PackVerdict): string[] {
  const out: string[] = [...result.lines];
  emit(result.result, (line) => out.push(line), (line) => out.push(`err: ${line}`));
  return out;
}

/** The finding lines of a run, without its summary. */
function findingLines(change: Change): string[] {
  const result = verdict(packRun(change));
  expect(result.result.exit).toBe(1);
  return printed(result).slice(0, -1);
}

describe("verdict: a run that meets every rule (exit 0)", () => {
  it("prints one line per package with its version, its file count and its entry-point count, then the summary", () => {
    expect(printed(verdict(packRun()))).toEqual([
      "pack-contents: @ocelle/tokens@2.0.0: 10 files, 3 entry points",
      "pack-contents: @ocelle/styles@2.0.0: 8 files, 3 entry points",
      "pack-contents: @ocelle/elements@2.0.0: 10 files, 6 entry points",
      "pack-contents: 3 packages at 2.0.0, each tarball exactly as declared",
    ]);
  });

  it("reads the tarballs in any order and names the packages in the order of the pack manifest", () => {
    const run = packRun();
    expect(printed(verdict({ ...run, tarballs: [...run.tarballs].reverse() })).map((line) => line.split(":")[1])).toEqual([
      " @ocelle/tokens@2.0.0",
      " @ocelle/styles@2.0.0",
      " @ocelle/elements@2.0.0",
      " 3 packages at 2.0.0, each tarball exactly as declared",
    ]);
  });

  it("counts one file and one entry point in the singular", () => {
    const one: PackEntry = { name: "@ocelle/tokens", dir: "packages/tokens", allow: ["package.json"], require: [], identical: [], peer: {} };
    const packed = { name: "@ocelle/tokens", version, license: "Apache-2.0", repository: repository("packages/tokens"), main: "package.json" };
    const run: PackRun = { manifest: [one], tarballs: [{ file: "t.tgz", bytes: tarball({ "package.json": JSON.stringify(packed) }) }], sources, version };
    expect(printed(verdict(run))).toEqual(["pack-contents: @ocelle/tokens@2.0.0: 1 file, 1 entry point", "pack-contents: 1 package at 2.0.0, each tarball exactly as declared"]);
  });
});

describe("verdict: entry points (FR-004, research.md R-05)", () => {
  it.each([
    { field: "an exports target", change: (m: Manifests) => void (m.styles = { ...m.styles, exports: { ".": "./dist/index.js", "./base.css": "./dist/base.css", "./x.js": "./dist/x.js" } }), line: '@ocelle/styles:dist/x.js: pack-contents: entry-point-missing: exports "./x.js" names it, but the tarball does not hold it' },
    { field: "main", change: (m: Manifests) => void (m.elements = { ...m.elements, main: "./dist/main.js" }), line: "@ocelle/elements:dist/main.js: pack-contents: entry-point-missing: main names it, but the tarball does not hold it" },
    { field: "module", change: (m: Manifests) => void (m.elements = { ...m.elements, module: "dist/module.js" }), line: "@ocelle/elements:dist/module.js: pack-contents: entry-point-missing: module names it, but the tarball does not hold it" },
    { field: "types", change: (m: Manifests) => void (m.styles = { ...m.styles, types: "./dist/types.d.ts" }), line: "@ocelle/styles:dist/types.d.ts: pack-contents: entry-point-missing: types names it, but the tarball does not hold it" },
    { field: "customElements", change: (m: Manifests) => void (m.elements = { ...m.elements, customElements: "./manifest.json" }), line: "@ocelle/elements:manifest.json: pack-contents: entry-point-missing: customElements names it, but the tarball does not hold it" },
  ])("names the package and the missing path of $field", ({ change, line }) => {
    expect(findingLines({ manifests: change })).toEqual([line]);
  });

  it("names the missing browser build, an exports target", () => {
    expect(findingLines({ files: drop("elements", "dist/browser/ocelle-elements.js") })).toEqual([
      '@ocelle/elements:dist/browser/ocelle-elements.js: pack-contents: entry-point-missing: exports "./browser.js" names it, but the tarball does not hold it',
    ]);
  });

  it("names a ./fonts/* pattern that matches no file of the tarball (entry-pattern-empty), and accepts it with one match", () => {
    expect(findingLines({ files: drop("tokens", "dist/fonts/OFL.txt", "dist/fonts/Sans.woff2") })).toEqual([
      '@ocelle/tokens:dist/fonts/*: pack-contents: entry-pattern-empty: exports "./fonts/*" names a pattern that matches no file of the tarball',
      "@ocelle/tokens:dist/fonts/OFL.txt: pack-contents: required-missing: the pack manifest requires it, but the tarball does not hold it",
    ]);
    expect(verdict(packRun({ files: drop("tokens", "dist/fonts/Sans.woff2") })).result.exit).toBe(0);
  });
});

describe("verdict: entry-point patterns (research.md R-05)", () => {
  it("matches a pattern's * across directories, as Node's subpath patterns do, and its other characters as themselves", () => {
    const exports = (m: Manifests): void => {
      m.elements = { ...m.elements, exports: { ".": "./dist/index.js", "./browser.js": "./dist/browser/ocelle-elements.js", "./x/*": "./dist/x/*.js" } };
    };
    expect(verdict(packRun({ manifests: exports, files: (f) => void (f.elements = { ...f.elements, "dist/x/a/b.js": "x\n" }) })).result.exit).toBe(0);
    expect(findingLines({ manifests: exports, files: (f) => void (f.elements = { ...f.elements, "dist/x/ajs": "x\n" }) })).toEqual([
      '@ocelle/elements:dist/x/*.js: pack-contents: entry-pattern-empty: exports "./x/*" names a pattern that matches no file of the tarball',
      "@ocelle/elements:dist/x/ajs: pack-contents: not-allowed: matches no allow pattern of the pack manifest",
    ]);
  });
});

describe("entryPoints", () => {
  it("lists every exports target, a pattern as written, then main, module, types and customElements, without ./", () => {
    expect(entryPoints({ exports: { ".": "./a.js", "./b": "./b.js", "./f/*": "./dist/f/*" }, main: "./m.js", module: "mod.js", types: "./t.d.ts", customElements: "ce.json" })).toEqual([
      { label: 'exports "."', target: "a.js" },
      { label: 'exports "./b"', target: "b.js" },
      { label: 'exports "./f/*"', target: "dist/f/*" },
      { label: "main", target: "m.js" },
      { label: "module", target: "mod.js" },
      { label: "types", target: "t.d.ts" },
      { label: "customElements", target: "ce.json" },
    ]);
  });

  it("reads a string exports as the . export, conditions by their path, arrays, and skips null targets and fields that are not text", () => {
    expect(entryPoints({ exports: "./i.js", main: 3, types: null })).toEqual([{ label: 'exports "."', target: "i.js" }]);
    expect(entryPoints({ exports: { import: "./i.mjs", require: "./i.cjs" } })).toEqual([
      { label: 'exports "." import', target: "i.mjs" },
      { label: 'exports "." require', target: "i.cjs" },
    ]);
    expect(entryPoints({ exports: { "./x": { types: "./x.d.ts", default: ["./x.js", "./y.js"] }, "./internal/*": null } })).toEqual([
      { label: 'exports "./x" types', target: "x.d.ts" },
      { label: 'exports "./x" default', target: "x.js" },
      { label: 'exports "./x" default', target: "y.js" },
    ]);
    expect(entryPoints({})).toEqual([]);
  });
});

describe("verdict: required and identical files (FR-002)", () => {
  it.each(["LICENSE", "NOTICE", "README.md", "CHANGELOG.md"])("names a styles tarball without %s (required-missing)", (path) => {
    expect(findingLines({ files: drop("styles", path) })).toEqual([`@ocelle/styles:${path}: pack-contents: required-missing: the pack manifest requires it, but the tarball does not hold it`]);
  });

  it("names a tokens tarball without the font's OFL.txt or THIRD_PARTY_NOTICES", () => {
    expect(findingLines({ files: drop("tokens", "dist/fonts/OFL.txt", "THIRD_PARTY_NOTICES") })).toEqual([
      "@ocelle/tokens:THIRD_PARTY_NOTICES: pack-contents: required-missing: the pack manifest requires it, but the tarball does not hold it",
      "@ocelle/tokens:dist/fonts/OFL.txt: pack-contents: required-missing: the pack manifest requires it, but the tarball does not hold it",
    ]);
  });

  it("names a NOTICE that differs from the root's by one byte (not-identical)", () => {
    expect(findingLines({ files: (f) => void (f.elements = { ...f.elements, NOTICE: notice.replace("Each", "each") }) })).toEqual([
      "@ocelle/elements:NOTICE: pack-contents: not-identical: differs from the repository's NOTICE",
    ]);
  });

  it("names a dist/fonts/OFL.txt that differs by one byte from packages/tokens/fonts/OFL.txt, through its { path, source } entry", () => {
    expect(findingLines({ files: (f) => void (f.tokens = { ...f.tokens, "dist/fonts/OFL.txt": ofl.replace("1.1", "1.2") }) })).toEqual([
      "@ocelle/tokens:dist/fonts/OFL.txt: pack-contents: not-identical: differs from the repository's packages/tokens/fonts/OFL.txt",
    ]);
  });

  it("compares bytes, not text: a file one byte longer differs", () => {
    expect(findingLines({ files: (f) => void (f.styles = { ...f.styles, LICENSE: `${licence}\n` }) })).toEqual(["@ocelle/styles:LICENSE: pack-contents: not-identical: differs from the repository's LICENSE"]);
  });
});

describe("verdict: the packed manifest (FR-001, FR-003)", () => {
  it.each([true, false, "yes"])("names a private flag set to %j (private-flag)", (value) => {
    expect(findingLines({ manifests: (m) => void (m.tokens = { ...m.tokens, private: value }) })).toEqual([
      `@ocelle/tokens:package.json: pack-contents: private-flag: the packed manifest sets "private": ${JSON.stringify(value)}; a published package has no private flag`,
    ]);
  });

  it("names every workspace: specifier, in dependencies, devDependencies, optionalDependencies and peerDependencies (workspace-specifier)", () => {
    const change = (m: Manifests): void => {
      m.elements = { ...m.elements, dependencies: { lit: "workspace:3.3.3", n: 3 }, devDependencies: { a: "workspace:*" }, optionalDependencies: { b: "workspace:~1.0.0" } };
      m.tokens = { ...m.tokens, dependencies: null, devDependencies: "workspace:1.0.0" };
    };
    expect(findingLines({ manifests: change })).toEqual([
      '@ocelle/elements:package.json: pack-contents: workspace-specifier: dependencies.lit is "workspace:3.3.3"; a published manifest holds no workspace: specifier',
      '@ocelle/elements:package.json: pack-contents: workspace-specifier: devDependencies.a is "workspace:*"; a published manifest holds no workspace: specifier',
      '@ocelle/elements:package.json: pack-contents: workspace-specifier: optionalDependencies.b is "workspace:~1.0.0"; a published manifest holds no workspace: specifier',
    ]);
  });

  it("names a peer that keeps workspace: as a workspace specifier and as a peer that is not the release range", () => {
    expect(findingLines({ manifests: (m) => void (m.styles = { ...m.styles, peerDependencies: { "@ocelle/tokens": "workspace:^2.0.0" } }) })).toEqual([
      '@ocelle/styles:package.json: pack-contents: workspace-specifier: peerDependencies.@ocelle/tokens is "workspace:^2.0.0"; a published manifest holds no workspace: specifier',
      '@ocelle/styles:package.json: pack-contents: peer-mismatch: peerDependencies is {"@ocelle/tokens":"workspace:^2.0.0"}, not {"@ocelle/tokens":"^2.0.0"}',
    ]);
  });

  it.each([
    { name: "an exact peer", peer: { "@ocelle/tokens": "2.0.0" }, shown: '{"@ocelle/tokens":"2.0.0"}' },
    { name: "a caret on another version", peer: { "@ocelle/tokens": "^1.9.0" }, shown: '{"@ocelle/tokens":"^1.9.0"}' },
    { name: "an extra peer", peer: { "@ocelle/tokens": "^2.0.0", lit: "^3.0.0" }, shown: '{"@ocelle/tokens":"^2.0.0","lit":"^3.0.0"}' },
    { name: "no peer", peer: undefined, shown: "missing" },
    { name: "a peer that is a range, not an object", peer: "^2.0.0", shown: '"^2.0.0"' },
    { name: "a peer that is a list", peer: ["@ocelle/tokens"], shown: '["@ocelle/tokens"]' },
  ] as { name: string; peer: unknown; shown: string }[])("names $name on elements (peer-mismatch: the packed peerDependencies exactly)", ({ peer, shown }) => {
    expect(findingLines({ manifests: (m) => void (m.elements = { ...m.elements, peerDependencies: peer }) })).toEqual([
      `@ocelle/elements:package.json: pack-contents: peer-mismatch: peerDependencies is ${shown}, not {"@ocelle/tokens":"^2.0.0"}`,
    ]);
  });

  it("accepts tokens with no peerDependencies or an empty one, and names a peer on tokens, whose peer is {}", () => {
    expect(verdict(packRun({ manifests: (m) => void (m.tokens = { ...m.tokens, peerDependencies: {} }) })).result.exit).toBe(0);
    expect(findingLines({ manifests: (m) => void (m.tokens = { ...m.tokens, peerDependencies: { x: "^1.0.0" } }) })).toEqual([
      '@ocelle/tokens:package.json: pack-contents: peer-mismatch: peerDependencies is {"x":"^1.0.0"}, not {}',
    ]);
  });

  it("names a version other than --version on every package (version-mismatch), and the peer range it implies", () => {
    expect(findingLines({ version: "2.0.1" })).toEqual([
      '@ocelle/tokens:package.json: pack-contents: version-mismatch: version is "2.0.0", not the release version 2.0.1',
      '@ocelle/styles:package.json: pack-contents: version-mismatch: version is "2.0.0", not the release version 2.0.1',
      '@ocelle/styles:package.json: pack-contents: peer-mismatch: peerDependencies is {"@ocelle/tokens":"^2.0.0"}, not {"@ocelle/tokens":"^2.0.1"}',
      '@ocelle/elements:package.json: pack-contents: version-mismatch: version is "2.0.0", not the release version 2.0.1',
      '@ocelle/elements:package.json: pack-contents: peer-mismatch: peerDependencies is {"@ocelle/tokens":"^2.0.0"}, not {"@ocelle/tokens":"^2.0.1"}',
    ]);
  });

  it("names a package whose version differs from the other packages, against the release version and against the first package", () => {
    expect(findingLines({ manifests: (m) => void (m.styles = { ...m.styles, version: "2.0.1" }) })).toEqual([
      '@ocelle/styles:package.json: pack-contents: version-mismatch: version is "2.0.1", not the release version 2.0.0',
      '@ocelle/styles:package.json: pack-contents: version-mismatch: version is "2.0.1", but @ocelle/tokens is at "2.0.0"',
    ]);
    expect(findingLines({ manifests: (m) => void (m.tokens = { ...m.tokens, version: undefined }) })).toEqual([
      "@ocelle/tokens:package.json: pack-contents: version-mismatch: version is missing, not the release version 2.0.0",
      '@ocelle/styles:package.json: pack-contents: version-mismatch: version is "2.0.0", but @ocelle/tokens is at missing',
      '@ocelle/elements:package.json: pack-contents: version-mismatch: version is "2.0.0", but @ocelle/tokens is at missing',
    ]);
  });

  it("names a repository whose url or directory is not this repository's and the package's (repository-mismatch)", () => {
    expect(findingLines({ manifests: (m) => void (m.styles = { ...m.styles, repository: { ...repository("packages/style") } }) })).toEqual([
      '@ocelle/styles:package.json: pack-contents: repository-mismatch: repository.directory is "packages/style", not "packages/styles"',
    ]);
    const other = { type: "svn", url: "git+https://github.com/Other/ocelle-components.git" };
    expect(findingLines({ manifests: (m) => void (m.elements = { ...m.elements, repository: other }) })).toEqual([
      '@ocelle/elements:package.json: pack-contents: repository-mismatch: repository.type is "svn", not "git"',
      `@ocelle/elements:package.json: pack-contents: repository-mismatch: repository.url is "git+https://github.com/Other/ocelle-components.git", not "${repositoryUrl}"`,
      '@ocelle/elements:package.json: pack-contents: repository-mismatch: repository.directory is missing, not "packages/elements"',
    ]);
  });

  it("names a repository that is missing or not an object", () => {
    const expected = `{"type":"git","url":"${repositoryUrl}","directory":"packages/tokens"}`;
    expect(findingLines({ manifests: (m) => void (m.tokens = { ...m.tokens, repository: "github:Ocelle-HQ/ocelle-components" }) })).toEqual([
      `@ocelle/tokens:package.json: pack-contents: repository-mismatch: repository is "github:Ocelle-HQ/ocelle-components", not ${expected}`,
    ]);
    expect(findingLines({ manifests: (m) => void (m.tokens = { ...m.tokens, repository: undefined }) })).toEqual([`@ocelle/tokens:package.json: pack-contents: repository-mismatch: repository is missing, not ${expected}`]);
    expect(findingLines({ manifests: (m) => void (m.tokens = { ...m.tokens, repository: null }) })).toEqual([`@ocelle/tokens:package.json: pack-contents: repository-mismatch: repository is null, not ${expected}`]);
  });

  it.each([
    { license: "MIT", shown: '"MIT"' },
    { license: "apache-2.0", shown: '"apache-2.0"' },
    { license: undefined, shown: "missing" },
  ])("names a license field $shown (license-field: not Apache-2.0)", ({ license, shown }) => {
    expect(findingLines({ manifests: (m) => void (m.styles = { ...m.styles, license }) })).toEqual([`@ocelle/styles:package.json: pack-contents: license-field: license is ${shown}, not "Apache-2.0"`]);
  });
});

describe("verdict: declared contents and the deny list (FR-004)", () => {
  it("names a file that matches no allow pattern (not-allowed)", () => {
    expect(findingLines({ files: (f) => void (f.styles = { ...f.styles, "notes.txt": "x\n", "dist/a/b.css": "a {}\n" }) })).toEqual([
      "@ocelle/styles:dist/a/b.css: pack-contents: not-allowed: matches no allow pattern of the pack manifest",
      "@ocelle/styles:notes.txt: pack-contents: not-allowed: matches no allow pattern of the pack manifest",
    ]);
  });

  it("is exactly the deny list of the contract", () => {
    expect(denyPatterns).toEqual(["**/*.test.*", "**/*.spec.*", "**/*.stories.*", "**/.npmrc", "**/.env*", "**/*.pem", "**/*.key", "**/id_rsa*", "**/id_ed25519*", "**/test/**"]);
  });

  it.each([
    ["dist/index.test.js", "**/*.test.*"],
    ["dist/index.test.js.map", "**/*.test.*"],
    ["index.spec.js", "**/*.spec.*"],
    ["dist/card.stories.js", "**/*.stories.*"],
    [".npmrc", "**/.npmrc"],
    ["dist/.npmrc", "**/.npmrc"],
    [".env", "**/.env*"],
    ["dist/.env.local", "**/.env*"],
    ["dist/server.pem", "**/*.pem"],
    ["signing.key", "**/*.key"],
    ["id_rsa", "**/id_rsa*"],
    ["dist/id_rsa.pub", "**/id_rsa*"],
    ["id_ed25519", "**/id_ed25519*"],
    ["test/a.js", "**/test/**"],
    ["dist/test/fixtures/a.json", "**/test/**"],
  ])("names %s by the first deny pattern it matches, %s, before the allow list", (path, pattern) => {
    expect(findingLines({ files: (f) => void (f.elements = { ...f.elements, [path]: "x\n" }) })).toEqual([`@ocelle/elements:${path}: pack-contents: denied: matches the deny pattern ${pattern}`]);
  });

  it("does not deny names that only come near a deny pattern", () => {
    const near = { "dist/testing.js": "x\n", "dist/latest.js": "x\n", "dist/env.js": "x\n", "dist/keys.js": "x\n", "dist/id_rsa_like/x.js": "x\n", "dist/contest/a.js": "x\n" };
    expect(printed(verdict(packRun({ files: (f) => void (f.elements = { ...f.elements, ...near }) }))).at(-1)).toBe("pack-contents: 3 packages at 2.0.0, each tarball exactly as declared");
  });
});

describe("verdict: sandbox paths (op 023's rule)", () => {
  it("names each line of a text entry that holds a sandbox path, never echoing it, and skips a binary entry", () => {
    const readme = `# Package\n\nbuilt in ${sandboxHome}/ocelle-components\nok\nand ${sandboxHome}/x again\n`;
    const binary = Buffer.concat([Buffer.from([0]), Buffer.from(`${sandboxHome}/ocelle\n`)]);
    const result = findingLines({ files: (f) => void (f.elements = { ...f.elements, "README.md": readme, "dist/blob.js": binary }) });
    expect(result).toEqual([
      "@ocelle/elements:README.md: pack-contents: sandbox-path: line 3 holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place",
      "@ocelle/elements:README.md: pack-contents: sandbox-path: line 5 holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place",
    ]);
    expect(result.join("\n")).not.toContain(sandboxHome);
  });

  it("checks a file outside the allow list too", () => {
    expect(findingLines({ files: (f) => void (f.styles = { ...f.styles, "notes.txt": `${"/" + "root"}/x\n` }) })).toEqual([
      "@ocelle/styles:notes.txt: pack-contents: not-allowed: matches no allow pattern of the pack manifest",
      "@ocelle/styles:notes.txt: pack-contents: sandbox-path: line 1 holds a sandbox path; redact it with tooling/speckit/bin/redact-sandbox-paths.sh --in-place",
    ]);
  });
});

describe("verdict: exit 1", () => {
  it("prints the findings package by package, in rule order, then the count of findings and packages", () => {
    const run = packRun({
      manifests: (m) => void (m.styles = { ...m.styles, private: true, license: "MIT" }),
      files: (f) => {
        drop("styles", "NOTICE")(f);
        drop("elements", "LICENSE")(f);
      },
    });
    expect(printed(verdict(run))).toEqual([
      '@ocelle/styles:package.json: pack-contents: private-flag: the packed manifest sets "private": true; a published package has no private flag',
      '@ocelle/styles:package.json: pack-contents: license-field: license is "MIT", not "Apache-2.0"',
      "@ocelle/styles:NOTICE: pack-contents: required-missing: the pack manifest requires it, but the tarball does not hold it",
      "@ocelle/elements:LICENSE: pack-contents: required-missing: the pack manifest requires it, but the tarball does not hold it",
      "pack-contents: 4 findings in 2 packages",
    ]);
    expect(printed(verdict(packRun({ files: drop("styles", "NOTICE") }))).at(-1)).toBe("pack-contents: 1 finding in 1 package");
  });
});

describe("verdict: could not run (exit 2)", () => {
  const cause = (run: PackRun): string[] => printed(verdict(run));

  it("names a tarball that is not a readable gzipped tar archive", () => {
    const run = packRun();
    const broken = { file: "broken.tgz", bytes: Buffer.from("not a tarball\n") };
    expect(cause({ ...run, tarballs: [...run.tarballs, broken] })).toEqual([expect.stringMatching(/^err: pack-contents: could not run: broken\.tgz is not a readable tarball \(.+\)$/)]);
  });

  it("names a tarball without a package/package.json that names its package", () => {
    const run = packRun();
    for (const files of [{ "README.md": "x" }, { "package.json": "{" }, { "package.json": '{"version":"2.0.0"}' }, { "package.json": '["@ocelle/tokens"]' }, { "package.json": "null" }]) {
      expect(cause({ ...run, tarballs: [...run.tarballs.slice(1), { file: "t.tgz", bytes: tarball(files) }] })).toEqual(["err: pack-contents: could not run: t.tgz holds no package/package.json that names its package"]);
    }
  });

  it("names a tarball of a package the pack manifest does not list, and two tarballs of one package", () => {
    const run = packRun();
    const other = { file: "other.tgz", bytes: tarball({ "package.json": '{"name":"@ocelle/other"}' }) };
    expect(cause({ ...run, tarballs: [...run.tarballs, other] })).toEqual(["err: pack-contents: could not run: other.tgz is @ocelle/other, which the pack manifest does not list"]);
    const twice = { file: "again.tgz", bytes: run.tarballs[1]?.bytes ?? Buffer.alloc(0) };
    expect(cause({ ...run, tarballs: [...run.tarballs, twice] })).toEqual(["err: pack-contents: could not run: ocelle-styles-2.0.0.tgz and again.tgz are both @ocelle/styles"]);
  });

  it("names a package of the pack manifest without a tarball", () => {
    const run = packRun();
    expect(cause({ ...run, tarballs: run.tarballs.slice(0, 2) })).toEqual(["err: pack-contents: could not run: no tarball of @ocelle/elements"]);
  });

  it("names a repository file an identical entry compares with that the repository does not hold", () => {
    const run = packRun();
    const without = new Map(sources);
    without.delete("packages/tokens/fonts/OFL.txt");
    expect(cause({ ...run, sources: without })).toEqual(["err: pack-contents: could not run: the repository holds no packages/tokens/fonts/OFL.txt, which @ocelle/tokens's identical list names"]);
  });
});

describe("readTarball", () => {
  it("reads every regular file below package/ by its path, byte for byte, and skips directories and pax global headers", () => {
    const bytes = tar([
      { name: "package/", type: "5" },
      { name: "pax_global_header", type: "g", data: "52 comment=x\n" },
      { name: "package/a.txt", data: "a\n" },
      { name: "package/dist/b.bin", data: Buffer.from([0, 255, 7]) },
      { name: "package/c", type: "\u0000", data: "c" },
      { name: "package/d", type: "7", data: "d" },
    ]);
    expect(Object.fromEntries([...readable(bytes)].map(([path, data]) => [path, Buffer.from(data).toString("hex")]))).toEqual({
      "a.txt": Buffer.from("a\n").toString("hex"),
      "dist/b.bin": "00ff07",
      c: Buffer.from("c").toString("hex"),
      d: Buffer.from("d").toString("hex"),
    });
  });

  it("joins the ustar prefix and the name, and takes a pax header's path for the next entry only", () => {
    const long = `package/${"d/".repeat(60)}long.js`;
    const bytes = tar([
      { name: "long.js", prefix: "package/deep", data: "p" },
      { name: "PaxHeader", type: "x", data: paxRecord("path", long) },
      { name: "package/short", data: "q" },
      { name: "package/next", data: "r" },
      { name: "PaxHeader", type: "x", data: paxRecord("mtime", "1234567890") },
      { name: "package/kept", data: "s" },
    ]);
    expect([...readable(bytes).keys()]).toEqual(["deep/long.js", long.slice("package/".length), "next", "kept"]);
  });

  it("reads a file whose data fills whole blocks, and an archive without its closing blocks", () => {
    const data = "x".repeat(1024);
    expect(readable(tar([{ name: "package/a", data }, { name: "package/b", data: "b" }], false)).get("b")).toEqual(Buffer.from("b"));
    expect(readable(tar([{ name: "package/a", data }])).get("a")).toEqual(Buffer.from(data));
  });

  it.each([
    { name: "bytes that are not gzip", bytes: Buffer.from("plain text"), problem: /^incorrect header check$/ },
    { name: "a gzipped stream that is not tar", bytes: gzipSync(Buffer.concat([Buffer.from("hello"), Buffer.alloc(1019)])), problem: /^entry at byte 0 has no ustar header$/ },
    { name: "an entry outside package/", bytes: tar([{ name: "other/a.js", data: "a" }]), problem: /^other\/a\.js is outside package\/$/ },
    { name: "a symbolic link", bytes: tar([{ name: "package/link", type: "2" }]), problem: /^package\/link is neither a file nor a directory$/ },
    { name: "a hard link", bytes: tar([{ name: "package/hard", type: "1" }]), problem: /^package\/hard is neither a file nor a directory$/ },
    { name: "data cut off", bytes: gzipSync(Buffer.concat([header("package/a", 600, "0"), Buffer.alloc(512)])), problem: /^package\/a is cut off$/ },
    { name: "a size that is not octal", bytes: gzipSync(Buffer.concat([Buffer.from(header("package/a", 1, "0")).fill(56, 124, 135), Buffer.alloc(1024)])), problem: /^package\/a has no octal size$/ },
  ])("rejects $name", ({ bytes, problem }) => {
    expect(() => readTarball(bytes)).toThrow(problem);
  });

  it("reads a name that fills its 100 bytes with no NUL, a space-padded size, and a last empty file of an archive without its closing blocks", () => {
    const name = `package/${"n".repeat(92)}`;
    const files = readable(tar([{ name, data: "full" }, { name: "package/spaced", data: "ab", sizeField: "         2 " }, { name: "package/empty" }], false));
    expect(Object.fromEntries([...files].map(([path, data]) => [path, Buffer.from(data).toString()]))).toEqual({ ["n".repeat(92)]: "full", spaced: "ab", empty: "" });
  });

  it("accepts the GNU magic and reads the archive pnpm pack and tar both write", () => {
    expect([...readable(tar([{ name: "package/a", data: "a", magic: "ustar  \u0000" }])).keys()]).toEqual(["a"]);
  });
});

describe("globMatch", () => {
  it.each<{ pattern: string; paths: Record<string, boolean> }>([
    { pattern: "dist/**/*.js", paths: { "dist/index.js": true, "dist/browser/ocelle-elements.js": true, "dist/index.js.map": false, "src/index.js": false, "xdist/index.js": false } },
    { pattern: "licenses/**", paths: { "licenses/lit-BSD-3-Clause.txt": true, "licenses/a/b.txt": true, "licensesX/a.txt": false } },
    { pattern: "LICENSE", paths: { LICENSE: true, "LICENSE.md": false, "dist/LICENSE": false } },
    { pattern: "dist/fonts/*.woff2", paths: { "dist/fonts/a.woff2": true, "dist/fonts/sub/a.woff2": false, "dist/fonts/awoff2": false } },
    { pattern: "dist/?.js", paths: { "dist/a.js": true, "dist/ab.js": false, "dist//.js": false } },
    { pattern: "**/.env*", paths: { ".env": true, "a/b/.env.production": true, "a/x.env": false } },
    { pattern: "**/test/**", paths: { "test/a": true, "a/test/b/c": true, "a/latest/b": false, test: false } },
    { pattern: "a+b(c)/[x]{y}$^|.js", paths: { "a+b(c)/[x]{y}$^|.js": true, "aab(c)/[x]{y}$^|xjs": false } },
  ])("$pattern matches exactly the paths marked true", ({ pattern, paths }) => {
    expect(Object.fromEntries(Object.keys(paths).map((path) => [path, globMatch(pattern, path)]))).toEqual(paths);
  });
});

describe("parsePackManifest", () => {
  const valid = [
    { name: "@ocelle/tokens", dir: "packages/tokens", allow: ["package.json"], require: ["package.json"], identical: ["LICENSE", { path: "dist/fonts/OFL.txt", source: "packages/tokens/fonts/OFL.txt" }], peer: {} },
    { name: "@ocelle/styles", dir: "packages/styles", allow: ["package.json"], require: [], identical: [], peer: { "@ocelle/tokens": "^<version>" } },
    { name: "@ocelle/elements", dir: "packages/elements", allow: ["package.json"], require: [], identical: [], peer: { "@ocelle/tokens": "^<version>" } },
  ];

  it("reads the three entries, a bare identical path as the root file of the same name", () => {
    expect(() => parsePackManifest(JSON.stringify(valid))).not.toThrow();
    expect(parsePackManifest(JSON.stringify(valid))).toEqual([
      { ...valid[0], identical: [{ path: "LICENSE", source: "LICENSE" }, { path: "dist/fonts/OFL.txt", source: "packages/tokens/fonts/OFL.txt" }] },
      valid[1],
      valid[2],
    ]);
  });

  const at = (index: number, change: Record<string, unknown>): string => JSON.stringify(valid.map((entry, i) => (i === index ? { ...entry, ...change } : entry)));

  it.each([
    { name: "text that is not JSON", text: "{", problem: /^not valid JSON \(.+\)$/ },
    { name: "an object", text: "{}", problem: /^not a list of packages$/ },
    { name: "an entry that is not an object", text: JSON.stringify([1, ...valid]), problem: /^package 1 is not an object$/ },
    { name: "a null entry", text: JSON.stringify([...valid, null]), problem: /^package 4 is not an object$/ },
    { name: "an entry that is a list", text: JSON.stringify([[]]), problem: /^package 1 is not an object$/ },
    { name: "another name", text: at(1, { name: "@ocelle/other" }), problem: /^package 2: name must be @ocelle\/tokens, @ocelle\/styles or @ocelle\/elements$/ },
    { name: "an empty dir", text: at(0, { dir: "" }), problem: /^package 1: dir must be a non-empty string$/ },
    { name: "a dir that is not text", text: at(0, { dir: 3 }), problem: /^package 1: dir must be a non-empty string$/ },
    { name: "an empty allow list", text: at(2, { allow: [] }), problem: /^package 3: allow must be a non-empty list of patterns$/ },
    { name: "an allow list with an empty pattern", text: at(2, { allow: ["a", ""] }), problem: /^package 3: allow must be a non-empty list of patterns$/ },
    { name: "an allow that is not a list", text: at(2, { allow: "a" }), problem: /^package 3: allow must be a non-empty list of patterns$/ },
    { name: "a require that is not a list", text: at(0, { require: "LICENSE" }), problem: /^package 1: require must be a list of paths$/ },
    { name: "a require with an empty path", text: at(0, { require: [""] }), problem: /^package 1: require must be a list of paths$/ },
    { name: "an identical that is not a list", text: at(0, { identical: {} }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "an identical entry without a source", text: at(0, { identical: [{ path: "a" }] }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "an identical entry with an empty path", text: at(0, { identical: [{ path: "", source: "a" }] }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "an identical entry with an empty source", text: at(0, { identical: [{ path: "a", source: "" }] }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "an identical entry without a path", text: at(0, { identical: [{ source: "a" }] }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "an identical entry that is an empty path", text: at(0, { identical: [""] }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "an identical entry that is null", text: at(0, { identical: [null] }), problem: /^package 1: identical must be a list of paths or \{ path, source \} entries$/ },
    { name: "a peer that is a list", text: at(1, { peer: [] }), problem: /^package 2: peer must be an object of package names and ranges$/ },
    { name: "a peer that is null", text: at(1, { peer: null }), problem: /^package 2: peer must be an object of package names and ranges$/ },
    { name: "a peer range that is not text", text: at(1, { peer: { "@ocelle/tokens": 1 } }), problem: /^package 2: peer must be an object of package names and ranges$/ },
    { name: "a package listed twice", text: JSON.stringify([...valid, valid[1]]), problem: /^package 4: @ocelle\/styles is listed twice$/ },
    { name: "a package left out", text: JSON.stringify([valid[0], valid[2]]), problem: /^no entry for @ocelle\/styles$/ },
  ])("rejects $name", ({ text, problem }) => {
    expect(() => parsePackManifest(text)).toThrow(problem);
  });
});
