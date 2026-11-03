// ESLint rule ocelle/no-snapshot-only (FR-010, research.md R-06): reports a test whose only assertions are snapshot
// matchers. A test is a call of `it` or `test` (also `it.each(...)(...)`, `test.concurrent(...)`); an assertion is a
// matcher called on `expect(...)` or `expect.soft(...)`, also behind `.not`, `.resolves` and `.rejects`, and counts
// for the innermost test call around it. A test without any assertion is left to vitest/expect-expect.
import type { Rule } from "eslint";

type Call = Parameters<NonNullable<Rule.RuleListener["CallExpression"]>>[0];
type Expression = Call["callee"];
type Member = Extract<Expression, { type: "MemberExpression" }>;

const snapshotMatchers = new Set(["toMatchSnapshot", "toMatchInlineSnapshot", "toMatchFileSnapshot"]);
const modifiers = new Set<string | undefined>(["not", "resolves", "rejects"]);

/** The name a call chain starts from: `it` for `it(...)`, `it.each(...)(...)` and `it.concurrent(...)`. */
function rootName(expression: Expression): string | undefined {
  if (expression.type === "Identifier") return expression.name;
  if (expression.type === "MemberExpression") return rootName(expression.object);
  if (expression.type === "CallExpression") return rootName(expression.callee);
  return undefined;
}

function isTest(node: Call): boolean {
  const name = rootName(node.callee);
  return name === "it" || name === "test";
}

/** The name of `a.name`; undefined for a computed property such as `a["name"]` (a literal has no name). */
function propertyName(member: Member): string | undefined {
  return (member.property as { readonly name?: string }).name;
}

/** The matcher of an assertion `expect(...)[.not|.resolves|.rejects].<matcher>(...)`, or undefined. */
function matcherOf(node: Call): string | undefined {
  const { callee } = node;
  if (callee.type !== "MemberExpression") return undefined;
  let object = callee.object;
  while (object.type === "MemberExpression" && modifiers.has(propertyName(object))) object = object.object;
  return object.type === "CallExpression" && rootName(object.callee) === "expect" ? propertyName(callee) : undefined;
}

interface Frame {
  readonly node: Call;
  assertions: number;
  snapshots: number;
}

export const noSnapshotOnly: Rule.RuleModule = {
  meta: {
    type: "problem",
    messages: { snapshotOnly: "Test asserts only through snapshots; add an assertion of the behaviour (FR-010)" },
    schema: [],
  },
  create(context) {
    const frames: Frame[] = [];
    return {
      CallExpression(node) {
        if (isTest(node)) {
          frames.push({ node, assertions: 0, snapshots: 0 });
          return;
        }
        const matcher = matcherOf(node);
        const frame = frames.at(-1);
        if (matcher === undefined || frame === undefined) return;
        frame.assertions += 1;
        if (snapshotMatchers.has(matcher)) frame.snapshots += 1;
      },
      "CallExpression:exit"(node) {
        const frame = frames.at(-1);
        if (frame?.node !== node) return;
        frames.pop();
        if (frame.assertions > 0 && frame.snapshots === frame.assertions) {
          context.report({ node, messageId: "snapshotOnly" });
        }
      },
    };
  },
};

/** The local ESLint plugin `ocelle`. */
export const plugin = { rules: { "no-snapshot-only": noSnapshotOnly } };
