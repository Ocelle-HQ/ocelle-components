import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyTsc } from "../lib/tsc-report.ts";

// gates/lib/tsc-report.ts on recorded `tsc --noEmit --pretty false` output in gates/test/fixtures/tsc/
// (contracts/gate-cli.md, typecheck row): diagnostics with codes outside TS5xxx and TS6xxx are findings (exit 1);
// any TS5xxx or TS6xxx diagnostic (configuration and options, including TS6053 and TS5083) is exit 2.
const root = "/work/repo";

function output(name: string): string {
  return readFileSync(new URL(`fixtures/tsc/${name}`, import.meta.url), "utf8");
}

const fix = "fix the TypeScript configuration or the file it names";

describe("classifyTsc", () => {
  it("reports each diagnostic outside TS5xxx and TS6xxx as a finding at its repository path and line (exit 1)", () => {
    expect(classifyTsc({ output: output("findings.txt"), exitCode: 2, root })).toEqual({
      exit: 1,
      findings: [
        {
          location: { path: "packages/tokens/src/x.ts", line: 1 },
          gate: "typecheck",
          rule: "TS7006",
          message: "Parameter 'a' implicitly has an 'any' type.",
        },
        {
          location: { path: "gates/lib/y.ts", line: 4 },
          gate: "typecheck",
          rule: "TS2322",
          message:
            "Type '{ a: number; }' is not assignable to type 'B'. Types of property 'a' are incompatible. " +
            "Type 'number' is not assignable to type 'string'.",
        },
        {
          location: { path: "gates/lib/y.ts", line: 9 },
          gate: "typecheck",
          rule: "TS2304",
          message: "Cannot find name 'missing'.",
        },
        {
          location: { path: "gates/lib/z.ts", line: 2 },
          gate: "typecheck",
          rule: "TS1005",
          message: "';' expected.",
        },
      ],
      summary: "typecheck: 4 findings in 3 files",
    });
  });

  it("reports a diagnostic without a file as a finding about tsconfig.json", () => {
    expect(classifyTsc({ output: output("global.txt"), exitCode: 2, root })).toEqual({
      exit: 1,
      findings: [
        {
          location: { path: "tsconfig.json" },
          gate: "typecheck",
          rule: "TS2318",
          message: "Cannot find global type 'Array'.",
        },
      ],
      summary: "typecheck: 1 finding in 1 file",
    });
  });

  it("exits 0 when tsc exits 0 with no diagnostic", () => {
    expect(classifyTsc({ output: "", exitCode: 0, root })).toEqual({
      exit: 0,
      summary: "typecheck: no type error in the files of tsconfig.json",
    });
  });

  it("exits 2 on TS6053, a reference to a file that does not exist", () => {
    expect(classifyTsc({ output: output("ts6053.txt"), exitCode: 2, root })).toEqual({
      exit: 2,
      cause:
        "typecheck: could not run: TS6053 at packages/tokens/src/x.ts:1: " +
        `File '/work/repo/packages/tokens/src/missing.d.ts' not found.; ${fix}`,
    });
  });

  it("exits 2 on TS5083, a configuration file tsc cannot read", () => {
    expect(classifyTsc({ output: output("ts5083.txt"), exitCode: 1, root })).toEqual({
      exit: 2,
      cause: `typecheck: could not run: TS5083 at tsconfig.json: Cannot read file '/work/repo/tsconfig.base.json'.; ${fix}`,
    });
  });

  it("exits 2 on a TS5xxx diagnostic even beside ordinary findings", () => {
    expect(classifyTsc({ output: output("ts5023-with-finding.txt"), exitCode: 2, root })).toEqual({
      exit: 2,
      cause: `typecheck: could not run: TS5023 at tsconfig.json:3: Unknown compiler option 'bogus'.; ${fix}`,
    });
  });

  it.each([
    { code: "TS4999", exit: 1 },
    { code: "TS5000", exit: 2 },
    { code: "TS6999", exit: 2 },
    { code: "TS7000", exit: 1 },
    { code: "TS50000", exit: 1 },
  ])("treats $code as exit $exit", ({ code, exit }) => {
    const result = classifyTsc({ output: `a.ts(1,1): error ${code}: m.\n`, exitCode: 2, root });
    expect(result.exit).toBe(exit);
  });

  it("exits 2 when tsc fails without a diagnostic", () => {
    expect(classifyTsc({ output: output("not-installed.txt"), exitCode: 1, root })).toEqual({
      exit: 2,
      cause:
        "typecheck: could not run: tsc exited 1 without a diagnostic " +
        "(Error: Cannot find module '/work/repo/node_modules/typescript/bin/tsc'); run pnpm run setup:offline",
    });
  });

  it("exits 2 when tsc was ended by a signal", () => {
    expect(classifyTsc({ output: "", exitCode: null, root })).toEqual({
      exit: 2,
      cause: "typecheck: could not run: tsc exited null without a diagnostic (no output); run pnpm run setup:offline",
    });
  });

  it("reports a diagnostic as a finding even when tsc exits 0", () => {
    expect(classifyTsc({ output: "a.ts(1,1): error TS2304: Cannot find name 'x'.\n", exitCode: 0, root }).exit).toBe(1);
  });
});
