import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// SC-006 (spec US4, FR-030 to FR-035, research.md R-17): the repository's own licence and governance files. The text
// is read with runs of whitespace collapsed, so a phrase wrapped across lines still counts as the phrase.
const root = new URL("../../", import.meta.url);

/** The file's text, or "" when it does not exist (its absence is asserted separately, by name). */
function raw(path: string): string {
  const url = new URL(path, root);
  return existsSync(url) ? readFileSync(url, "utf8") : "";
}

function text(path: string): string {
  return raw(path).replace(/\s+/g, " ");
}

/** The CODEOWNERS rules: each non-blank, non-comment line split into its pattern and owners. */
function codeowners(): string[][] {
  return raw(".github/CODEOWNERS")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => line.split(/\s+/));
}

// SHA-256 of https://www.apache.org/licenses/LICENSE-2.0.txt, byte for byte (11358 bytes).
const apache20 = "cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30";

describe("governance files (SC-006)", () => {
  it("has LICENSE, CONTRIBUTING.md, SECURITY.md and THIRD_PARTY_NOTICES at the root under exactly these names", () => {
    const names = readdirSync(root);
    expect(names).toEqual(expect.arrayContaining(["LICENSE", "CONTRIBUTING.md", "SECURITY.md", "THIRD_PARTY_NOTICES"]));
  });

  it("LICENSE is the unmodified Apache License 2.0 text (FR-030)", () => {
    expect(createHash("sha256").update(raw("LICENSE")).digest("hex")).toBe(apache20);
  });

  it("CONTRIBUTING.md states the sign-off rule (FR-031)", () => {
    const contributing = text("CONTRIBUTING.md");
    expect(contributing).toContain("Signed-off-by");
    expect(contributing).toContain("git commit -s");
  });

  it("CONTRIBUTING.md states there is no contributor licence agreement and points to Spec Kit and the constitution (FR-031)", () => {
    const contributing = text("CONTRIBUTING.md");
    expect(contributing).toContain("no contributor licence agreement");
    expect(contributing).toContain("Spec Kit");
    expect(contributing).toContain(".specify/memory/constitution.md");
  });

  it(".github/CODEOWNERS names @MOES-Media as the only owner of every path (FR-035)", () => {
    expect(codeowners()).toEqual([["*", "@MOES-Media"]]);
  });

  it("SECURITY.md names GitHub private vulnerability reporting and the CODEOWNERS owner @MOES-Media (FR-032)", () => {
    const security = text("SECURITY.md");
    expect(security).toContain("GitHub private vulnerability reporting");
    expect(security).toContain("@MOES-Media");
  });

  it("SECURITY.md promises an acknowledgement within 3 working days and a status update within 10 (FR-032)", () => {
    const security = text("SECURITY.md");
    expect(security).toContain("3 working days");
    expect(security).toContain("10 working days");
  });

  // Since #5 vendored the font (002 FR-014), the notice lists it with its licence beside the file instead of saying
  // that no third-party asset ships; packages/tokens/test/font.test.ts checks the entry against fonts/SOURCE.json.
  it("THIRD_PARTY_NOTICES lists the Schibsted Grotesk font with its SIL OFL 1.1 licence beside the file (FR-033, 002 FR-014)", () => {
    const notices = text("THIRD_PARTY_NOTICES");
    expect(notices).not.toContain("No third-party asset ships");
    expect(notices).toContain("Schibsted Grotesk");
    expect(notices).toContain("SIL Open Font License 1.1");
    expect(notices).toContain("packages/tokens/fonts/SchibstedGrotesk-wght.woff2");
    expect(notices).toContain("packages/tokens/fonts/OFL.txt");
  });
});
