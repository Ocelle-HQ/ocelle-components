import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// The test-only timing setter's one caller (specs/010-feedback-forms T014; research.md R-09, operator decision
// PLAN-FRESH-2-003 (a)): `setAnnouncerTimingForTests` of src/live.ts shortens `D` and `H` for element and oracle alike
// in process, so it must be called from packages/elements/test/in-process.ts and from nowhere else: no src/ module,
// no fixture page or its script, no other test, story or gate. Every script file of packages/, storybook/ and gates/
// (built output and dependencies left out) is parsed and its call expressions read; HTML files are read as text.
const repo = fileURLToPath(new URL("../../../..", import.meta.url));
const setter = ["setAnnouncer", "Timing", "ForTests"].join("");
const scripts = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs"]);
const skipped = new Set(["node_modules", "dist", ".stryker-tmp", "storybook-static"]);

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (skipped.has(entry.name)) return [];
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

/** Whether the script text calls the setter: a call expression whose callee is the name or a property of that name. */
function calls(path: string, text: string): boolean {
  const source = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  let found = false;
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : "";
      if (name === setter) found = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function callers(): string[] {
  return ["packages", "storybook", "gates"]
    .flatMap((top) => files(join(repo, top)))
    .filter((path) => {
      const text = readFileSync(path, "utf8");
      if (!text.includes(setter)) return false;
      if (scripts.has(extname(path))) return calls(path, text);
      return extname(path) === ".html" && new RegExp(`${setter}\\s*\\(`).test(text);
    })
    .map((path) => relative(repo, path))
    .sort();
}

describe("setAnnouncerTimingForTests", () => {
  it("is called from packages/elements/test/in-process.ts and from no other file", () => {
    expect(callers()).toEqual(["packages/elements/test/in-process.ts"]);
  });
});
