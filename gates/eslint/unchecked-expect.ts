// ESLint rules for unchecked assertions (FR-010, research.md R-06 "Unchecked assertions"): an assertion in a promise
// callback that is neither awaited nor returned (ocelle/no-floating-promise-expect), in a timer callback
// (ocelle/no-timer-expect), or inside a try whose catch swallows it (ocelle/no-swallowed-expect). An assertion is a
// call whose callee chain starts at the identifier `expect` (`expect(...)`, `expect(...).not.toBe(...)`,
// `expect.soft(...)`, `expect.unreachable()`). Each rule marks, on entering an assertion, every node around it, and
// decides on leaving the node it reports, when all nodes inside it have been entered.
import type { Rule, SourceCode } from "eslint";

type Call = Parameters<NonNullable<Rule.RuleListener["CallExpression"]>>[0];
type Expression = Call["callee"];
type AnyNode = ReturnType<SourceCode["getAncestors"]>[number];

const chainMethods = new Set<string | undefined>(["then", "catch", "finally"]);
const timers = new Set<string | undefined>(["setTimeout", "setInterval"]);
const functions = new Set<string | undefined>(["ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration"]);

/** The name a call chain starts from: `expect` for `expect(a).not.toBe(b)` and `expect.soft(a).toBe(b)`. */
function rootName(expression: Expression): string | undefined {
  if (expression.type === "Identifier") return expression.name;
  if (expression.type === "MemberExpression") return rootName(expression.object);
  if (expression.type === "CallExpression") return rootName(expression.callee);
  return undefined;
}

/** The name of an identifier, or of the property of `a.name`; undefined otherwise (a call, `a["name"]`). */
function nameOf(callee: Expression): string | undefined {
  const target = callee.type === "MemberExpression" ? callee.property : callee;
  return (target as { readonly name?: string }).name;
}

function isFunction(node: AnyNode | undefined): boolean {
  return functions.has(node?.type);
}

interface Assertions {
  /** Nodes with an assertion anywhere inside them, nested functions included. */
  readonly around: Set<AnyNode>;
  /** Nodes with an assertion inside them that is not inside a function nested in the node. */
  readonly direct: Set<AnyNode>;
  readonly listener: (node: Call) => void;
}

function assertions(context: Rule.RuleContext): Assertions {
  const around = new Set<AnyNode>();
  const direct = new Set<AnyNode>();
  const listener = (node: Call): void => {
    if (rootName(node.callee) !== "expect") return;
    let outsideFunctions = true;
    for (const ancestor of context.sourceCode.getAncestors(node).toReversed()) {
      around.add(ancestor);
      if (outsideFunctions) direct.add(ancestor);
      if (isFunction(ancestor)) outsideFunctions = false;
    }
  };
  return { around, direct, listener };
}

export const noFloatingPromiseExpect: Rule.RuleModule = {
  meta: {
    type: "problem",
    messages: {
      floating:
        "Assertion in a promise callback that is neither awaited nor returned; await or return the promise (FR-010)",
    },
    schema: [],
  },
  create(context) {
    const { around, listener } = assertions(context);
    return {
      CallExpression: listener,
      "UnaryExpression:exit"(node) {
        if (node.operator !== "void") return;
        // The promise chain: calls `x.then(...)`, `x.catch(...)` or `x.finally(...)`, followed down through `x`.
        let link: Expression = node.argument;
        while (link.type === "CallExpression" && link.callee.type === "MemberExpression") {
          if (!chainMethods.has(nameOf(link.callee))) return;
          if (link.arguments.some((argument) => isFunction(argument) && around.has(argument))) {
            context.report({ node, messageId: "floating" });
            return;
          }
          link = link.callee.object;
        }
      },
    };
  },
};

export const noTimerExpect: Rule.RuleModule = {
  meta: {
    type: "problem",
    messages: {
      timer: "Assertion in a timer callback runs outside the test's control; await the condition, then assert (FR-010)",
    },
    schema: [],
  },
  create(context) {
    const { around, listener } = assertions(context);
    return {
      CallExpression: listener,
      "CallExpression:exit"(node) {
        const [callback] = node.arguments;
        if (timers.has(nameOf(node.callee)) && isFunction(callback) && around.has(callback as AnyNode)) {
          context.report({ node, messageId: "timer" });
        }
      },
    };
  },
};

export const noSwallowedExpect: Rule.RuleModule = {
  meta: {
    type: "problem",
    messages: {
      swallowed: "Assertion inside a try whose catch neither rethrows nor asserts; the failure is swallowed (FR-010)",
    },
    schema: [],
  },
  create(context) {
    const { around, direct, listener } = assertions(context);
    return {
      CallExpression: listener,
      "TryStatement:exit"(node) {
        const catchBody = node.handler?.body;
        if (catchBody === undefined || !around.has(node.block)) return;
        const rethrows = catchBody.body.some((statement) => statement.type === "ThrowStatement");
        if (rethrows || direct.has(catchBody)) return;
        context.report({ node, messageId: "swallowed" });
      },
    };
  },
};

/** The rules of this module, for the local ESLint plugin `ocelle`. */
export const plugin = {
  rules: {
    "no-floating-promise-expect": noFloatingPromiseExpect,
    "no-timer-expect": noTimerExpect,
    "no-swallowed-expect": noSwallowedExpect,
  },
};
