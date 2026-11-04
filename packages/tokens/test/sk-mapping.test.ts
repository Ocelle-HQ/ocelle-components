import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { cssName, tokenNames, tokens } from "../src/index.ts";
import type { TokenName } from "../src/index.ts";

// The role mapping of User Story 4 (FR-024, research.md R-13, data-model.md § Role mapping): a Markdown table in the
// feature directory, outside the packages, from each role kitty-mission-ui uses to its replacement token. The header
// records the kitty-mission-ui commit read; the table has one row per role (column 1), the replacement token or
// `dropped` (column 2), the replacement to use for a dropped or merged role (column 3) and a note (column 4).
// The consumer's role names live only in the table: this file refers to columns by position and finds the table by
// its file-name suffix, so no role prefix is written here (constitution I; the prefix gate scans test code).

const featureDir = new URL("../../../specs/002-design-tokens/", import.meta.url);
/** The mapping tables of the feature directory; exactly one is expected. */
const tables = readdirSync(featureDir).filter((file) => file.endsWith("-mapping.md"));
const text = tables.length === 1 ? readFileSync(new URL(tables[0] ?? "", featureDir), "utf8") : "";

/** The cells of a table line, trimmed, without the outer pipes. */
const cells = (line: string): string[] => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
/** The body rows of the first table: its lines after the header and the separator line. */
const tableLines = /^\|.*\|\n\|[\s:|-]+\|\n((?:\|.*\|\n?)*)/m.exec(text)?.[1] ?? "";
const rows: string[][] = tableLines.split("\n").filter((line) => line.trim() !== "").map(cells);

const expectedRows = 55;
const tokenCell = /^`(--ocelle-[a-z0-9-]+)`$/;
const tokenMention = /--ocelle-[a-z0-9-]*[a-z0-9]/g;
const jsonNames: ReadonlySet<string> = new Set(tokens.tokens.map((token) => token.name));

/** Whether a full custom property name is a token: in `tokenNames`, rendered back by `cssName`, in the JSON export. */
function isToken(full: string): boolean {
  const name = full.slice("--ocelle-".length);
  return (tokenNames as readonly string[]).includes(name) && cssName(name as TokenName) === full && jsonNames.has(full);
}

/** Column 2 read as `token`, `dropped`, or the cell itself when it is neither. */
function kind(cell: string): string {
  const full = tokenCell.exec(cell)?.[1];
  return cell === "dropped" ? "dropped" : full !== undefined && isToken(full) ? "token" : cell;
}

describe("the role mapping table (FR-024)", () => {
  it("is one file in the feature directory", () => {
    expect(tables).toHaveLength(1);
  });

  it("records the kitty-mission-ui commit it was read from (40 hex)", () => {
    expect(/^kitty-mission-ui commit: `([0-9a-f]{40})`$/m.exec(text)?.[1]).toMatch(/^[0-9a-f]{40}$/);
  });

  it("has exactly 55 rows of four cells", () => {
    expect(rows.map((row) => row.length)).toEqual(Array.from({ length: expectedRows }, () => 4));
  });

  it("names 55 distinct roles in column 1, custom properties of one prefix other than ocelle", () => {
    const roles = rows.map((row) => row[0] ?? "");
    const prefixes = roles.map((role) => /^`--([a-z]+)-[a-z0-9]+(?:-[a-z0-9]+)*`$/.exec(role)?.[1] ?? `not a role: ${role}`);
    expect(new Set(roles).size).toBe(expectedRows);
    expect(prefixes.filter((prefix) => prefix.startsWith("not a role") || prefix === "ocelle")).toEqual([]);
    expect(new Set(prefixes).size).toBe(1);
  });

  it("gives in column 2 a token of the stylesheet and the JSON export, or dropped", () => {
    const kinds = rows.map((row) => kind(row[1] ?? ""));
    expect(kinds).toHaveLength(expectedRows);
    expect(kinds.filter((value) => value !== "token" && value !== "dropped")).toEqual([]);
  });

  it("names the replacement token of every dropped role in column 3", () => {
    const dropped = rows.filter((row) => row[1] === "dropped");
    const replacements = dropped.map((row) => (row[2] ?? "").match(tokenMention) ?? []);
    expect(dropped).not.toHaveLength(0);
    expect(replacements.filter((names) => names.length === 0)).toEqual([]);
  });

  it("mentions only tokens wherever it names an --ocelle-* custom property", () => {
    const mentioned = rows.flatMap((row) => row.slice(1).join(" ").match(tokenMention) ?? []);
    expect(mentioned.length).toBeGreaterThanOrEqual(expectedRows);
    expect(mentioned.filter((full) => !isToken(full))).toEqual([]);
  });
});
