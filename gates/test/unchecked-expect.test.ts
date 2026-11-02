import { Linter, RuleTester } from "eslint";
import { describe, expect, it } from "vitest";
import { noFloatingPromiseExpect, noSwallowedExpect, noTimerExpect, plugin } from "../eslint/unchecked-expect.ts";

// ESLint's RuleTester turns each case into a Vitest test and fails it with an assertion error when the rule's
// reports differ from `errors` (count, message id and line). Every case mixes code the rule must report with
// look-alikes it must not report, so each case fails while the rule reports nothing (FR-010, research.md R-06
// "Unchecked assertions", tasks.md T091).
RuleTester.describe = describe;
RuleTester.it = it;

const at = (messageId: string) => (line: number) => ({ messageId, line });
const floating = at("floating");
const timer = at("timer");
const swallowed = at("swallowed");

new RuleTester().run("ocelle/no-floating-promise-expect", noFloatingPromiseExpect, {
  valid: [],
  invalid: [
    {
      name: "void on a chain with an assertion in a callback; awaited, returned, arrow-bodied and bare chains are not",
      code: [
        'it("floating", async () => {',
        "  void p.then((v) => expect(v).toBe(2));",
        "  await p.then((v) => expect(v).toBe(2));",
        "  p.then((v) => expect(v).toBe(2));",
        "  void p.then(f);",
        "});",
        'it("returned", () => {',
        "  return p.then((v) => expect(v).toBe(2));",
        "});",
        'it("arrow body", () => p.then((v) => expect(v).toBe(2)));',
      ].join("\n"),
      errors: [floating(2)],
    },
    {
      name: "the whole chain is searched: then, catch and finally, inner calls, function expressions, nested callbacks",
      code: [
        "void p.then(f).finally(() => expect(1).toBe(1));",
        "void p.then((v) => expect(v).toBe(1)).catch(g);",
        "void p.catch(function (e) { expect(e).toBe(1); });",
        "void p.then(() => { [1].forEach((n) => expect.soft(n).toBe(1)); });",
        "void p.then(() => expect.unreachable());",
        "void p.then(f).catch(g).finally(h);",
      ].join("\n"),
      errors: [floating(1), floating(2), floating(3), floating(4), floating(5)],
    },
    {
      name: "not a promise chain, not a callback, or not an assertion",
      code: [
        "void list.map((v) => expect(v).toBe(1));",
        "void p.then(expect(1).toBe(1));",
        "void q(() => expect(1).toBe(1)).then(f);",
        "void p.then((v) => check(v).toBe(2));",
        "void expect(1).toBe(1);",
        "void p.then(() => expect(1).not.toBe(2));",
      ].join("\n"),
      errors: [floating(6)],
    },
  ],
});

new RuleTester().run("ocelle/no-timer-expect", noTimerExpect, {
  valid: [],
  invalid: [
    {
      name: "setTimeout, setInterval and a member timer with an asserting callback; a callback without one is not",
      code: [
        "setTimeout(() => { expect(1).toBe(2); }, 0);",
        "setInterval(() => expect(1).toBe(2), 0);",
        "globalThis.setTimeout(function () { expect(1).toBe(2); }, 0);",
        'it("waits", async () => {',
        "  await new Promise((r) => setTimeout(r, 10));",
        "  expect(1).toBe(1);",
        "});",
        "setTimeout(() => done(), 0);",
        "window.setInterval(() => { [1].forEach((n) => expect(n).toBe(1)); }, 5);",
      ].join("\n"),
      errors: [timer(1), timer(2), timer(3), timer(9)],
    },
    {
      name: "other schedulers, other functions, a non-function or later argument, and no argument are not reported",
      code: [
        "setImmediate(() => expect(1).toBe(2));",
        "queueMicrotask(() => expect(1).toBe(2));",
        "later(() => expect(1).toBe(2), 0);",
        "timers.later(() => expect(1).toBe(2), 0);",
        "setTimeout(expect, 0);",
        "setTimeout(f, 0, () => expect(1).toBe(2));",
        "setTimeout();",
        "setTimeout(() => check(1).toBe(2), 0);",
        "setInterval(() => expect.soft(1).toBe(2), 0);",
      ].join("\n"),
      errors: [timer(9)],
    },
  ],
});

new RuleTester().run("ocelle/no-swallowed-expect", noSwallowedExpect, {
  valid: [],
  invalid: [
    {
      name: "catch clauses that swallow; a rethrowing or asserting catch and try ... finally do not",
      code: [
        "try { expect(1).toBe(2); } catch {}",
        "try { expect(1).toBe(2); } catch (e) { console.log(e) }",
        "try { expect(1).toBe(2); } catch (e) { if (x) throw e }",
        "try { expect(1).toBe(2); } catch (e) { fail(e) }",
        "try { expect(1).toBe(2); } catch (e) { cleanup(); throw e }",
        "try { expect(1).toBe(2); } catch (e) { expect(e).toBeInstanceOf(SyntaxError) }",
        "try { expect(1).toBe(2); } finally { cleanup() }",
        "try { run(); } catch {}",
      ].join("\n"),
      errors: [swallowed(1), swallowed(2), swallowed(3), swallowed(4)],
    },
    {
      name: "a throw only counts at the catch's top level; an assertion counts anywhere but in a nested function",
      code: [
        "try { expect(1).toBe(2); } catch (e) { { throw e } }",
        "try { expect(1).toBe(2); } catch (e) { const f = () => { throw e }; }",
        "try { expect(1).toBe(2); } catch (e) { for (;;) throw e }",
        "try { expect(1).toBe(2); } catch (e) { const g = () => expect(e).toBe(1); }",
        "try { expect(1).toBe(2); } catch (e) { if (x) expect(e).toBe(1) }",
        "try { [1].forEach((n) => expect(n).toBe(1)); } catch {}",
        "try { check(1).toBe(2); } catch {}",
        "try { expect.soft(1).toBe(2); } catch (e) { log(e); throw e; }",
      ].join("\n"),
      errors: [swallowed(1), swallowed(2), swallowed(3), swallowed(4), swallowed(6)],
    },
  ],
});

describe("ocelle plugin, unchecked assertions", () => {
  it("reports each pattern under its rule id with the message of research.md R-06", () => {
    const messages = new Linter().verify(
      [
        "void p.then((v) => expect(v).toBe(2));",
        "setTimeout(() => expect(1).toBe(2), 0);",
        "try { expect(1).toBe(2); } catch {}",
      ].join("\n"),
      {
        plugins: { ocelle: plugin },
        rules: {
          "ocelle/no-floating-promise-expect": "error",
          "ocelle/no-timer-expect": "error",
          "ocelle/no-swallowed-expect": "error",
        },
      },
    );
    expect(messages.map(({ ruleId, line, message }) => ({ ruleId, line, message }))).toEqual([
      {
        ruleId: "ocelle/no-floating-promise-expect",
        line: 1,
        message: "Assertion in a promise callback that is neither awaited nor returned; await or return the promise (FR-010)",
      },
      {
        ruleId: "ocelle/no-timer-expect",
        line: 2,
        message: "Assertion in a timer callback runs outside the test's control; await the condition, then assert (FR-010)",
      },
      {
        ruleId: "ocelle/no-swallowed-expect",
        line: 3,
        message:
          "Assertion inside a try whose catch neither rethrows nor asserts; the failure is swallowed (FR-010)",
      },
    ]);
  });
});
