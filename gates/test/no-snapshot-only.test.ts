import { Linter, RuleTester } from "eslint";
import { describe, expect, it } from "vitest";
import { noSnapshotOnly, plugin } from "../eslint/no-snapshot-only.ts";

// ESLint's RuleTester turns each case into a Vitest test and fails it with an assertion error when the rule's
// reports differ from `errors` (count, message id and line). Every case mixes tests the rule must report with
// near-misses it must not report, so each case fails while the rule reports nothing (FR-010, research.md R-06).
RuleTester.describe = describe;
RuleTester.it = it;

const reported = (line: number) => ({ messageId: "snapshotOnly", line });

new RuleTester().run("ocelle/no-snapshot-only", noSnapshotOnly, {
  valid: [],
  invalid: [
    {
      name: "toMatchSnapshot as the only assertion, next to a test that also asserts the behaviour",
      code: [
        'it("renders", () => {',
        "  expect(render()).toMatchSnapshot();",
        "});",
        'it("renders and checks", () => {',
        "  expect(render()).toMatchSnapshot();",
        "  expect(render()).toBe(1);",
        "});",
      ].join("\n"),
      errors: [reported(1)],
    },
    {
      name: "toMatchInlineSnapshot and toMatchFileSnapshot as the only assertions; a test without assertions is not this rule's",
      code: [
        'test("inline", () => {',
        '  expect(a).toMatchInlineSnapshot(`"a"`);',
        "});",
        'test("file", async () => {',
        '  await expect(a).toMatchFileSnapshot("./a.txt");',
        "});",
        'test("no assertion", () => {',
        "  render();",
        "});",
      ].join("\n"),
      errors: [reported(1), reported(4)],
    },
    {
      name: "snapshot matchers behind not, resolves and rejects; rejects and expect.soft are real assertions",
      code: [
        'it("not", () => {',
        "  expect(a).not.toMatchSnapshot();",
        "});",
        'it("resolves", async () => {',
        "  await expect(p).resolves.toMatchSnapshot();",
        "});",
        'it("rejects, then a snapshot", async () => {',
        '  await expect(p).rejects.toThrow("x");',
        "  expect(a).toMatchSnapshot();",
        "});",
        'it("soft, then a snapshot", () => {',
        "  expect.soft(a).toEqual(1);",
        "  expect(a).toMatchSnapshot();",
        "});",
      ].join("\n"),
      errors: [reported(1), reported(4)],
    },
    {
      name: "expect.assertions and a matcher-named call on something other than expect are not assertions",
      code: [
        'it("helpers only", () => {',
        "  expect.assertions(1);",
        "  snapshot.toBe(1);",
        "  expect(a).toMatchSnapshot();",
        "});",
        'it("a real assertion", () => {',
        "  expect.assertions(1);",
        "  expect(a).toBe(1);",
        "});",
      ].join("\n"),
      errors: [reported(1)],
    },
    {
      name: "tests inside describe, in callbacks, it.each and test.concurrent",
      code: [
        'describe("group", () => {',
        '  it("loops", () => {',
        "    [1, 2].forEach((n) => expect(n).toMatchSnapshot());",
        "  });",
        '  it.each([1, 2])("each %s", (n) => {',
        "    expect(n).toMatchSnapshot();",
        "  });",
        '  test.concurrent("concurrent", async () => {',
        "    expect(1).toMatchSnapshot();",
        "  });",
        '  it("loops and checks", () => {',
        "    [1, 2].forEach((n) => expect(n).toBeGreaterThan(0));",
        "    expect(1).toMatchSnapshot();",
        "  });",
        "});",
      ].join("\n"),
      errors: [reported(2), reported(5), reported(8)],
    },
    {
      name: "snapshots outside a test, in another function's callback and in a test without a callback are not tests",
      code: [
        "function helper() {",
        "  expect(a).toMatchSnapshot();",
        "}",
        'check("not a test", () => {',
        "  expect(a).toMatchSnapshot();",
        "});",
        'it("todo");',
        'it("after", function () {',
        "  expect(a).toMatchSnapshot();",
        "});",
      ].join("\n"),
      errors: [reported(8)],
    },
  ],
});

describe("ocelle plugin", () => {
  it("reports a snapshot-only test under the rule id ocelle/no-snapshot-only with its message", () => {
    const messages = new Linter().verify(
      ['it("renders", () => {', "  expect(render()).toMatchSnapshot();", "});"].join("\n"),
      { plugins: { ocelle: plugin }, rules: { "ocelle/no-snapshot-only": "error" } },
    );
    expect(messages.map(({ ruleId, line, message }) => ({ ruleId, line, message }))).toEqual([
      {
        ruleId: "ocelle/no-snapshot-only",
        line: 1,
        message: "Test asserts only through snapshots; add an assertion of the behaviour (FR-010)",
      },
    ]);
  });
});

// Added in the green step to kill surviving mutants (phase 3 mutation run): a call chain that does not start at
// `expect` is not an assertion, and a computed member is not a modifier.
new RuleTester().run("ocelle/no-snapshot-only (call chains)", noSnapshotOnly, {
  valid: [],
  invalid: [
    {
      name: "a matcher-named call on a call that is not expect is not an assertion",
      code: ['it("checks", () => {', "  check(a).toBe(1);", "  expect(a).toMatchSnapshot();", "});"].join("\n"),
      errors: [reported(1)],
    },
    {
      name: "a computed member is not a modifier, and a real assertion next to it keeps the test",
      code: [
        'it("computed", () => {',
        '  expect(a)["not"].toMatchSnapshot();',
        "  expect(a).toMatchSnapshot();",
        "});",
        'it("computed and real", () => {',
        '  expect(a)["not"].toMatchSnapshot();',
        "  expect(a).toBe(1);",
        "});",
      ].join("\n"),
      errors: [reported(1)],
    },
  ],
});
