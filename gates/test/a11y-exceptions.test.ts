import { describe, expect, it } from "vitest";
import { complexityRows, exceptionsPath, matchExceptions, parseExceptions, recordedIn } from "../lib/a11y-exceptions.ts";
import type { Candidate, Exception, ExceptionState } from "../lib/a11y-exceptions.ts";

// The axe gate's exceptions (FR-029, US3 scenario 9; data-model.md § Exception; research.md R-08): the file's entries,
// every field a non-empty string; an entry honoured only when its plan's Complexity Tracking section holds a row naming
// its story, theme, rule and selector in backticks (a `|` written `\|`) and its sunset; an honoured entry excepts the
// one node of its rule and selector in its story-theme, and one that matches none is stale. Plan texts are written by
// hand.

const entry: Exception = {
  story: "base-styles--prose-document",
  theme: "light",
  rule: "color-contrast-incomplete",
  selector: "table:nth-child(12) > thead > tr > th:nth-child(12)",
  reason: "clipped column",
  sunset: "the op that fixes it",
  plan: "specs/006-x/plan.md",
};

/** A Complexity Tracking row naming an entry's story, theme, rule, selector and sunset (the selector's `|` escaped). */
function row(of: Exception): string {
  return `| \`${of.story}\` | \`${of.theme}\` | \`${of.rule}\` | \`${of.selector.replaceAll("|", "\\|")}\` | any reason | operator, 2026-11-10 | ${of.sunset} |`;
}

/** A plan whose Complexity Tracking section holds the rows, between other sections. */
function plan(rows: readonly string[], after = ""): string {
  return [
    "# Plan",
    "",
    "## Summary",
    "",
    "| Story | Theme |",
    "|---|---|",
    "",
    "## Complexity Tracking",
    "",
    "Some text.",
    "",
    "| Story | Theme | Rule | Selector | Reason | Approval | Sunset |",
    "|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "### A subsection stays inside",
    "",
    "## Next section",
    "",
    after,
  ].join("\n");
}

describe("exceptionsPath", () => {
  it("is storybook/a11y-exceptions.json", () => {
    expect(exceptionsPath).toBe("storybook/a11y-exceptions.json");
  });
});

describe("parseExceptions (data-model.md § Exception)", () => {
  it("reads a list of complete entries, and an empty list", () => {
    const other = { ...entry, theme: "dark", selector: "ocelle-x >>> button" };
    expect([parseExceptions(JSON.stringify([entry, other])), parseExceptions("[]\n")]).toEqual([[entry, other], []]);
  });

  it.each([
    { text: "[", problem: /^storybook\/a11y-exceptions\.json is not valid JSON/ },
    { text: "{}", problem: /^storybook\/a11y-exceptions\.json is not a list of exception entries$/ },
    { text: "[1]", problem: /^storybook\/a11y-exceptions\.json#0 is not an object$/ },
    { text: JSON.stringify([entry, null]), problem: /^storybook\/a11y-exceptions\.json#1 is not an object$/ },
    { text: JSON.stringify([{ ...entry, reason: undefined }]), problem: /^storybook\/a11y-exceptions\.json#0: reason must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, story: "" }]), problem: /^storybook\/a11y-exceptions\.json#0: story must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, rule: 3 }]), problem: /^storybook\/a11y-exceptions\.json#0: rule must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, selector: " " }]), problem: /^storybook\/a11y-exceptions\.json#0: selector must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, sunset: "" }]), problem: /^storybook\/a11y-exceptions\.json#0: sunset must be a non-empty string$/ },
    { text: JSON.stringify([{ ...entry, plan: null }]), problem: /^storybook\/a11y-exceptions\.json#0: plan must be a non-empty string$/ },
    { text: JSON.stringify([entry, { ...entry, theme: "Light" }]), problem: /^storybook\/a11y-exceptions\.json#1: theme must be light or dark$/ },
    { text: JSON.stringify([{ ...entry, plan: "/abs/plan.md" }]), problem: /^storybook\/a11y-exceptions\.json#0: plan must be a path inside the repository$/ },
    { text: JSON.stringify([{ ...entry, plan: "specs/../../plan.md" }]), problem: /^storybook\/a11y-exceptions\.json#0: plan must be a path inside the repository$/ },
    { text: JSON.stringify([{ ...entry, plan: "specs/../.." }]), problem: /^storybook\/a11y-exceptions\.json#0: plan must be a path inside the repository$/ },
  ])("refuses $text", ({ text, problem }) => {
    const parsed = parseExceptions(text);
    expect("problem" in parsed ? parsed.problem : parsed).toMatch(problem);
  });

  // Phase 4 review round 3, O3-01 (landing L1-04): the plan text, as written, must name a feature plan,
  // specs/<feature>/plan.md, whose feature segment is not `.` or `..`; a path that leaves the repository keeps its own
  // problem, above.
  it.each(["storybook/notes.md", "plan.md", "specs/plan.md", "specs/a/b/plan.md", "specs/a/plan.md.bak", "specs/a/notes.md", "./specs/a/plan.md", "specs/./plan.md", "specs/../plan.md", "specs/a/../b/plan.md"])(
    "refuses the plan %s, which is not a feature plan",
    (plan) => {
      expect(parseExceptions(JSON.stringify([{ ...entry, plan }]))).toEqual({ problem: "storybook/a11y-exceptions.json#0: plan must be a feature plan, specs/<feature>/plan.md" });
    },
  );

  it.each(["specs/006-storybook-workbench/plan.md", "specs/a/plan.md"])("reads the feature plan %s", (plan) => {
    expect(parseExceptions(JSON.stringify([{ ...entry, plan }]))).toEqual([{ ...entry, plan }]);
  });

  it("names each field once, in the entry's own order, the first missing one", () => {
    const parsed = parseExceptions(JSON.stringify([{ plan: "p", sunset: "s" }]));
    expect(parsed).toEqual({ problem: "storybook/a11y-exceptions.json#0: story must be a non-empty string" });
  });
});

describe("complexityRows (research.md R-08)", () => {
  it("gives the table rows of the Complexity Tracking section only, subsections included, separators left out", () => {
    expect(complexityRows(plan(["| `a` | b |"], "| `outside` | row |"))).toEqual([
      ["Story", "Theme", "Rule", "Selector", "Reason", "Approval", "Sunset"],
      ["`a`", "b"],
    ]);
  });

  it("unescapes \\| in a cell and splits at bare |", () => {
    expect(complexityRows(plan(["| `[lang\\|=\"en\"]` | x\\|y | a |"]))).toEqual([
      ["Story", "Theme", "Rule", "Selector", "Reason", "Approval", "Sunset"],
      ['`[lang|="en"]`', "x|y", "a"],
    ]);
  });

  it("gives no row for a plan without the section, a table before any heading included", () => {
    expect([complexityRows("# Plan\n\n## Summary\n\n| a | b |\n"), complexityRows("| a | b |\n\n# Plan\n")]).toEqual([[], []]);
  });

  it("reads a row with trailing spaces as the same cells, and leaves out separators with spaces and colons and lines that only end with |", () => {
    const text = "## Complexity Tracking\n\n| --- | :---: |\nText that ends with a pipe |\n| `a` | b |   \n";
    expect(complexityRows(text)).toEqual([["`a`", "b"]]);
  });
});

describe("recordedIn (FR-029)", () => {
  const unrecorded = (of: Exception): ExceptionState => ({ entry: of, recorded: false, reason: `${of.plan}'s Complexity Tracking holds no row naming the entry's story, theme, rule, selector and sunset` });

  it("honours an entry whose row names its story, theme, rule, selector and sunset, whatever the reason cell says", () => {
    expect(recordedIn(entry, plan([row(entry)]))).toEqual({ entry, recorded: true });
  });

  it("does not honour an entry whose plan file is missing", () => {
    expect(recordedIn(entry, undefined)).toEqual({ entry, recorded: false, reason: "specs/006-x/plan.md does not exist" });
  });

  it.each(["story", "theme", "rule", "selector", "sunset"] as const)("does not honour an entry whose row differs in its %s", (field) => {
    const differing = { ...entry, [field]: `${entry[field]}x` };
    expect(recordedIn(entry, plan([row(differing)]))).toEqual(unrecorded(entry));
  });

  it("does not honour an entry whose row lies outside the Complexity Tracking section", () => {
    expect(recordedIn(entry, plan([], row(entry)))).toEqual(unrecorded(entry));
  });

  it("does not honour an entry whose story, theme, rule or selector is not in backticks in the row", () => {
    const bare = `| ${entry.story} | \`${entry.theme}\` | \`${entry.rule}\` | \`${entry.selector}\` | r | a | ${entry.sunset} |`;
    expect(recordedIn(entry, plan([bare]))).toEqual(unrecorded(entry));
  });

  it("honours a shadow selector joined by >>>, and a selector holding | written \\| in the row", () => {
    const shadow = { ...entry, selector: "ocelle-x >>> button" };
    const piped = { ...entry, selector: '[lang|="en"]' };
    expect([recordedIn(shadow, plan([row(shadow)])), recordedIn(piped, plan([row(piped)]))]).toEqual([
      { entry: shadow, recorded: true },
      { entry: piped, recorded: true },
    ]);
  });

  it("does not honour a selector holding | when the row writes it bare", () => {
    const piped = { ...entry, selector: '[lang|="en"]' };
    const bare = `| \`${piped.story}\` | \`${piped.theme}\` | \`${piped.rule}\` | \`${piped.selector}\` | r | a | ${piped.sunset} |`;
    expect(recordedIn(piped, plan([bare]))).toEqual(unrecorded(piped));
  });
});

describe("matchExceptions (FR-029: an exception covers only its node)", () => {
  const candidate = (theme: string, selector: string, rule = "color-contrast"): Candidate => ({ story: "s--a", theme, rule, selector });
  const honoured = (theme: string, selector: string, rule = "color-contrast"): ExceptionState => ({ entry: { ...entry, story: "s--a", theme, rule, selector }, recorded: true });

  it("excepts the node of an honoured entry's story-theme, rule and selector only; an unrecorded entry excepts nothing; an honoured entry that matches none is stale", () => {
    const candidates = [candidate("light", "p.a"), candidate("light", "p.b"), candidate("dark", "p.a"), candidate("light", "p.b", "color-contrast-incomplete")];
    const states: ExceptionState[] = [honoured("light", "p.b"), { ...honoured("light", "p.a"), recorded: false, reason: "r" }, honoured("light", "p.z"), honoured("dark", "p.a"), honoured("dark", "p.b", "color-contrast-incomplete")];
    const matched = matchExceptions(candidates, states);
    expect({ excepted: [...matched.excepted], stale: matched.stale }).toEqual({ excepted: [[1, 0], [2, 3]], stale: [2, 4] });
  });

  it("lets one entry except one node: a second node with the same selector stays, and a second equal entry is stale", () => {
    const twice = matchExceptions([candidate("light", "p"), candidate("light", "p")], [honoured("light", "p")]);
    const doubled = matchExceptions([candidate("light", "p")], [honoured("light", "p"), honoured("light", "p")]);
    expect([[...twice.excepted], twice.stale, [...doubled.excepted], doubled.stale]).toEqual([[[0, 0]], [], [[0, 0]], [1]]);
  });

  it("matches the entry's own story and rule, not a node of another story or of the rule's incomplete results with the same selector", () => {
    const other: Candidate = { story: "s--b", theme: "light", rule: "color-contrast", selector: "p" };
    const matched = matchExceptions([other, candidate("light", "p", "color-contrast-incomplete"), candidate("light", "p")], [honoured("light", "p")]);
    expect([[...matched.excepted], matched.stale]).toEqual([[[2, 0]], []]);
  });

  it("excepts nothing and finds no stale entry without entries", () => {
    const matched = matchExceptions([candidate("light", "p")], []);
    expect([[...matched.excepted], matched.stale]).toEqual([[], []]);
  });
});
