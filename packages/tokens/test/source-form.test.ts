import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// The form of the token source (op 004, OR-001; 002 operator decision R1-03): Stryker treats a type assertion as a
// type node and does not descend into it, so no literal inside `[…] as const` or `… satisfies T` is ever mutated.
// The token records and the ground lists must therefore hold no `as`, `satisfies` or `<T>` assertion anywhere in
// their initializers. The test reads source.ts from disk, so under Stryker it reads the instrumented copy of the
// sandbox, which adds conditionals and calls but no type assertion.
const file = new URL("../src/source.ts", import.meta.url);
const tree = ts.createSourceFile(file.pathname, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);

/** The declarations whose initializers Stryker must be able to mutate. */
const declarations = ["records", "main", "stateGrounds", "chrome"];

/** The top-level variable declarations of the file, by name. */
function topLevel(): ReadonlyMap<string, ts.VariableDeclaration> {
  const byName = new Map<string, ts.VariableDeclaration>();
  for (const statement of tree.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) byName.set(declaration.name.text, declaration);
    }
  }
  return byName;
}

/** Every type assertion in a subtree, as `<kind> at line <n>`. */
function assertions(node: ts.Node): string[] {
  const found: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isAsExpression(child) || ts.isSatisfiesExpression(child) || ts.isTypeAssertionExpression(child)) {
      found.push(`${ts.SyntaxKind[child.kind]} at line ${String(tree.getLineAndCharacterOfPosition(child.getStart(tree)).line + 1)}`);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

/** Every string literal in a subtree. */
function strings(node: ts.Node): string[] {
  const found: string[] = [];
  const visit = (child: ts.Node): void => {
    if (ts.isStringLiteral(child)) found.push(child.text);
    ts.forEachChild(child, visit);
  };
  visit(node);
  return found;
}

describe("the token source's form", () => {
  it("declares records, main, stateGrounds and chrome with initializers that hold no type assertion", () => {
    const byName = topLevel();
    const offenders = declarations.flatMap((name) => {
      const initializer = byName.get(name)?.initializer;
      if (initializer === undefined) return [`${name}: no initialized declaration`];
      return assertions(initializer).map((found) => `${name}: ${found}`);
    });
    // Not vacuous: the initializer checked for records is the one that holds the records' literals.
    expect(strings(byName.get("records")?.initializer ?? tree.endOfFileToken)).toEqual(expect.arrayContaining(["color-canvas", "#F1EEE8"]));
    expect(offenders).toEqual([]);
  });
});
