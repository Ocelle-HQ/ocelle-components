import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The vendored font and its provenance (US2 scenarios 1 and 2; FR-011, FR-014; research.md R-06; data-model.md § Font
// asset; analysis E1): fonts/SOURCE.json records the upstream repository, the full commit d485f61f resolves to, and per
// file the package path, the upstream path and the SHA-256; the files hash to the recorded values, which are the
// upstream files' (computed from the files at that commit, so a modified file fails here); OFL.txt is the SIL OFL 1.1;
// THIRD_PARTY_NOTICES lists the font with the same licence, repository, commit and package paths, and no longer says
// that no third-party asset ships. A file that does not exist reads as empty, so each assertion reports what is
// missing (spec edge case "Font file unavailable at build time").
function bytes(path: string): Buffer {
  const url = new URL(`../${path}`, import.meta.url);
  return existsSync(url) ? readFileSync(url) : Buffer.alloc(0);
}
const text = (path: string): string => bytes(path).toString("utf8");
const sha256 = (data: Buffer): string => createHash("sha256").update(data).digest("hex");

interface SourceFile {
  readonly path: string;
  readonly upstreamPath: string;
  readonly sha256: string;
}
interface Source {
  readonly repository?: string;
  readonly commit?: string;
  readonly files?: readonly SourceFile[];
}

function readSource(): Source {
  const raw = text("fonts/SOURCE.json");
  return raw === "" ? {} : (JSON.parse(raw) as Source);
}

/** The upstream commit `d485f61f` resolves to in schibsted/schibsted-grotesk (one commit; FR-011). */
const commit = "d485f61f105e1b3935f4d21dfb4d371359798603";

/** The two vendored files: package path, upstream path at `commit`, and the SHA-256 of the upstream file. */
const expectedFiles: readonly SourceFile[] = [
  {
    path: "fonts/SchibstedGrotesk-wght.woff2",
    upstreamPath: "fonts/variable/SchibstedGrotesk[wght].woff2",
    sha256: "8b77a34cdd59455aa3434e949597e99346204d40357905fd918df20ed1139ac1",
  },
  {
    path: "fonts/OFL.txt",
    upstreamPath: "OFL.txt",
    sha256: "3b4f3063b6ac7c1e403e2c4a5e8ef3a58190ff83ed7b15af66511858699139ce",
  },
];

describe("fonts/SOURCE.json", () => {
  const source = readSource();

  it("names the upstream repository and the full 40-hex commit starting d485f61f", () => {
    expect(source.repository).toBe("schibsted/schibsted-grotesk");
    expect(source.commit).toMatch(/^d485f61f[0-9a-f]{32}$/);
    expect(source.commit).toBe(commit);
  });

  it("records the font file and the licence with their package path, upstream path and SHA-256", () => {
    expect(source.files).toEqual(expectedFiles);
  });

  it.each(expectedFiles.map((file) => file.path))("%s exists and hashes to its recorded SHA-256", (path) => {
    const recorded = source.files?.find((file) => file.path === path)?.sha256;
    expect(bytes(path).length).toBeGreaterThan(0);
    expect(sha256(bytes(path))).toBe(recorded);
  });
});

describe("the vendored files", () => {
  it("fonts/OFL.txt is the SIL Open Font License 1.1 of Schibsted Grotesk", () => {
    const licence = text("fonts/OFL.txt");
    expect(licence).toContain("SIL OPEN FONT LICENSE Version 1.1");
    expect(licence).toContain("The Schibsted-Grotesk Project Authors");
  });

  it("fonts/SchibstedGrotesk-wght.woff2 is a WOFF2 file", () => {
    expect(bytes("fonts/SchibstedGrotesk-wght.woff2").subarray(0, 4).toString("latin1")).toBe("wOF2");
  });
});

describe("THIRD_PARTY_NOTICES", () => {
  const notices = text("../../THIRD_PARTY_NOTICES").replace(/\s+/g, " ");
  const source = readSource();

  it("no longer says that no third-party asset ships (FR-014)", () => {
    expect(notices).not.toContain("No third-party asset ships yet.");
    expect(notices).toContain("Schibsted Grotesk");
  });

  it("lists the font with its licence, the repository, the full commit and the package paths of SOURCE.json", () => {
    const entry = notices.slice(notices.indexOf("Schibsted Grotesk"));
    expect({
      licence: entry.includes("SIL Open Font License 1.1"),
      repository: entry.includes(`https://github.com/${source.repository ?? "(no SOURCE.json)"}`),
      commit: entry.includes(source.commit ?? "(no SOURCE.json)"),
      paths: (source.files ?? []).map((file) => entry.includes(`packages/tokens/${file.path}`)),
    }).toEqual({ licence: true, repository: true, commit: true, paths: [true, true] });
  });
});
