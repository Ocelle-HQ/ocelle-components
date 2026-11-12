import { describe, expect, it } from "vitest";
import type { Exception, ExceptionState } from "../lib/a11y-exceptions.ts";
import { axeVerdict, blocker, printSelector } from "../lib/axe-verdict.ts";
import type { Audit, AxeResults, Outcome, Rendered } from "../lib/axe-verdict.ts";
import type { Finding } from "../lib/findings.ts";

// The accessibility gate's verdict (FR-013 to FR-015, FR-029; US3 scenarios 2 to 6, 8 and 9; contracts/gates.md
// § `axe`; data-model.md § axe result per story-theme; research.md R-08): one finding per serious or critical node of
// a violation (`<rule>`) or an incomplete result (`<rule>-incomplete`), message `<impact>: <selector>`; moderate and
// minor results as stderr notes; render failures and the checks that stop axe; outside-root per element; exceptions
// per node, unrecorded and stale entries as findings; the summary line. Inputs are axe-shaped results written by hand.

/** A finding of the gate at a story-theme or an exceptions entry. */
function finding(path: string, rule: string, message: string): Finding {
  return { location: { path }, gate: "axe", rule, message };
}

const clean: AxeResults = { violations: [], incomplete: [] };

/** A rendered story-theme with axe's results, nothing outside the root, no blocking check. */
function rendered(results: AxeResults = clean, extra: Partial<Rendered> = {}): Outcome {
  return { kind: "rendered", closed: [], empty: false, outside: [], results, ...extra };
}

function audit(story: string, theme: "light" | "dark", outcome: Outcome): Audit {
  return { story, theme, outcome };
}

/** Both themes of a story with the same outcome. */
function both(story: string, outcome: Outcome): Audit[] {
  return [audit(story, "light", outcome), audit(story, "dark", outcome)];
}

describe("printSelector (research.md R-08, PLAN-FRESH-2-005)", () => {
  it("prints a light-DOM target as it is", () => {
    expect(printSelector(["#storybook-root > button"])).toBe("#storybook-root > button");
  });

  it("joins the shadow levels of a target by >>>, one and two levels deep", () => {
    expect([printSelector([["ocelle-button", "button"]]), printSelector([["ocelle-shell", "ocelle-button", "button"]])]).toEqual(["ocelle-button >>> button", "ocelle-shell >>> ocelle-button >>> button"]);
  });

  it("joins frame levels by >>frame>>, never merging them into one level, a shadow level inside a frame by >>>", () => {
    expect([printSelector(["iframe", "button"]), printSelector(["#frame", ["ocelle-x", "p"]])]).toEqual(["iframe >>frame>> button", "#frame >>frame>> ocelle-x >>> p"]);
  });

  it("keeps a selector holding | as it is", () => {
    expect(printSelector(['[lang|="en"]'])).toBe('[lang|="en"]');
  });
});

describe("blocker (FR-014; research.md R-05, R-08, R-15)", () => {
  const plain: Rendered = { closed: [], empty: false, outside: [] };

  it("stops axe on a closed shadow root before a pointer problem, a pointer problem before an empty root", () => {
    expect([
      blocker({ ...plain, closed: ["ocelle-a", "ocelle-b"], pointer: "hover: no element matches .x", empty: true }),
      blocker({ ...plain, pointer: "hover: no element matches .x", empty: true }),
      blocker({ ...plain, empty: true }),
    ]).toEqual([
      { rule: "closed-shadow-root", message: "ocelle-a, ocelle-b" },
      { rule: "pointer-target", message: "hover: no element matches .x" },
      { rule: "empty", message: "the story root renders no content" },
    ]);
  });

  it("lets axe run when none holds, elements outside the root included", () => {
    expect(blocker({ ...plain, outside: ["button"] })).toBeUndefined();
  });
});

describe("axeVerdict: a clean run (US3 scenarios 1 and 5)", () => {
  it("exits 0 naming the story-theme runs, no note", () => {
    expect(axeVerdict([...both("a--one", rendered()), ...both("b--two", rendered())], [])).toEqual({
      result: { exit: 0, summary: "axe: 4 story-theme runs, 0 serious or critical; 0 notes (0 incomplete, 0 excepted)" },
      notes: [],
    });
  });
});

describe("axeVerdict: violations and incomplete results (FR-013, US3 scenarios 2 and 3)", () => {
  const results: AxeResults = {
    violations: [
      { id: "color-contrast", impact: "serious", nodes: [{ target: ["p.a"], impact: "serious" }, { target: ["p.b"], impact: "serious" }, { target: ["p.c"], impact: "serious" }] },
      { id: "button-name", impact: "critical", nodes: [{ target: [["ocelle-x", "button"]], impact: "critical" }] },
      { id: "heading-order", impact: "moderate", nodes: [{ target: ["h3"], impact: "moderate" }] },
      { id: "landmark-unique", impact: "minor", nodes: [{ target: ["nav"] }] },
    ],
    incomplete: [
      { id: "color-contrast", impact: "serious", nodes: [{ target: ["div.over"], impact: "serious" }] },
      { id: "aria-valid-attr-value", impact: "critical", nodes: [{ target: ["#x"] }] },
      { id: "link-in-text-block", impact: "serious", nodes: [{ target: ["a.y"], impact: "moderate" }] },
      { id: "duplicate-id", impact: "minor", nodes: [{ target: ["#d"], impact: "minor" }] },
    ],
  };

  it("gives one finding per serious or critical node, named <rule> or <rule>-incomplete, and notes for the moderate and minor ones", () => {
    expect(axeVerdict([audit("s--a", "dark", rendered(results))], [])).toEqual({
      result: {
        exit: 1,
        findings: [
          finding("s--a/dark", "color-contrast", "serious: p.a"),
          finding("s--a/dark", "color-contrast", "serious: p.b"),
          finding("s--a/dark", "color-contrast", "serious: p.c"),
          finding("s--a/dark", "button-name", "critical: ocelle-x >>> button"),
          finding("s--a/dark", "color-contrast-incomplete", "serious: div.over"),
          finding("s--a/dark", "aria-valid-attr-value-incomplete", "critical: #x"),
        ],
        summary: "axe: 6 findings in 1 story-theme run",
      },
      notes: [
        "note: s--a/dark: heading-order: moderate: h3",
        "note: s--a/dark: landmark-unique: minor: nav",
        "note: s--a/dark: link-in-text-block-incomplete: moderate: a.y",
        "note: s--a/dark: duplicate-id-incomplete: minor: #d",
      ],
    });
  });

  it("exits 0 with only moderate and minor results, counting them as notes and the incomplete ones apart", () => {
    const minor: AxeResults = { violations: [results.violations[2], results.violations[3]].filter((each) => each !== undefined), incomplete: [results.incomplete[2], results.incomplete[3]].filter((each) => each !== undefined) };
    expect(axeVerdict([audit("s--a", "light", rendered(minor)), audit("s--a", "dark", rendered())], [])).toEqual({
      result: { exit: 0, summary: "axe: 2 story-theme runs, 0 serious or critical; 4 notes (2 incomplete, 0 excepted)" },
      notes: ["note: s--a/light: heading-order: moderate: h3", "note: s--a/light: landmark-unique: minor: nav", "note: s--a/light: link-in-text-block-incomplete: moderate: a.y", "note: s--a/light: duplicate-id-incomplete: minor: #d"],
    });
  });

  it("names one note in the singular", () => {
    const one: AxeResults = { violations: [{ id: "heading-order", impact: "moderate", nodes: [{ target: ["h3"] }] }], incomplete: [] };
    expect(axeVerdict(both("s--a", rendered(clean)).concat(audit("s--b", "light", rendered(one))), []).result).toEqual({ exit: 0, summary: "axe: 3 story-theme runs, 0 serious or critical; 1 note (0 incomplete, 0 excepted)" });
  });
});

describe("axeVerdict: render failures and the checks that stop axe (FR-014, US3 scenarios 4, 6 and 8)", () => {
  it("names render-failed, render-timeout, closed-shadow-root, pointer-target and empty, and never axe's results under them", () => {
    const ignored: AxeResults = { violations: [{ id: "button-name", impact: "critical", nodes: [{ target: ["button"] }] }], incomplete: [] };
    const audits = [
      audit("a--failed", "light", { kind: "render-failed", message: "STORY_THREW_EXCEPTION: boom" }),
      audit("a--late", "dark", { kind: "render-timeout", message: "no render signal within 15 s" }),
      audit("a--closed", "light", rendered(ignored, { closed: ["ocelle-plant-closed"] })),
      audit("a--pointer", "light", rendered(ignored, { pointer: "hover: target outside the viewport: .low" })),
      audit("a--empty", "dark", rendered(ignored, { empty: true })),
    ];
    expect(axeVerdict(audits, []).result).toEqual({
      exit: 1,
      findings: [
        finding("a--failed/light", "render-failed", "STORY_THREW_EXCEPTION: boom"),
        finding("a--late/dark", "render-timeout", "no render signal within 15 s"),
        finding("a--closed/light", "closed-shadow-root", "ocelle-plant-closed"),
        finding("a--pointer/light", "pointer-target", "hover: target outside the viewport: .low"),
        finding("a--empty/dark", "empty", "the story root renders no content"),
      ],
      summary: "axe: 5 findings in 5 story-theme runs",
    });
  });

  it("names each element outside the story root, before axe's findings on the same story-theme, and beside a check that stops axe", () => {
    const results: AxeResults = { violations: [{ id: "button-name", impact: "critical", nodes: [{ target: ["body > button"] }] }], incomplete: [] };
    expect(axeVerdict([audit("p--portal", "light", rendered(results, { outside: ["button", "div"] })), audit("p--empty", "light", rendered(clean, { outside: ["p"], empty: true }))], []).result).toEqual({
      exit: 1,
      findings: [
        finding("p--portal/light", "outside-root", "button"),
        finding("p--portal/light", "outside-root", "div"),
        finding("p--portal/light", "button-name", "critical: body > button"),
        finding("p--empty/light", "outside-root", "p"),
        finding("p--empty/light", "empty", "the story root renders no content"),
      ],
      summary: "axe: 5 findings in 2 story-theme runs",
    });
  });

  it("gives no finding for a rendered outcome without axe results and no check that stops axe", () => {
    const noResults: Outcome = { kind: "rendered", closed: [], empty: false, outside: [] };
    expect(axeVerdict([audit("s--a", "light", noResults)], []).result.exit).toBe(0);
  });
});

describe("axeVerdict: exceptions (FR-029, US3 scenario 9)", () => {
  const base: Exception = { story: "s--a", theme: "light", rule: "color-contrast", selector: "p.b", reason: "clipped", sunset: "op", plan: "specs/x/plan.md" };
  const honoured = (fields: Partial<Exception> = {}): ExceptionState => ({ entry: { ...base, ...fields }, recorded: true });
  const results: AxeResults = {
    violations: [{ id: "color-contrast", impact: "serious", nodes: [{ target: ["p.a"], impact: "serious" }, { target: ["p.b"], impact: "serious" }] }],
    incomplete: [{ id: "color-contrast", impact: "serious", nodes: [{ target: [["ocelle-x", "span"]], impact: "serious" }] }],
  };

  it("turns an honoured entry's node into a note; another node of the same rule stays a finding", () => {
    expect(axeVerdict([audit("s--a", "light", rendered(results))], [honoured(), honoured({ rule: "color-contrast-incomplete", selector: "ocelle-x >>> span", reason: "over an image" })])).toEqual({
      result: { exit: 1, findings: [finding("s--a/light", "color-contrast", "serious: p.a")], summary: "axe: 1 finding in 1 story-theme run" },
      notes: ["note: s--a/light: color-contrast: serious: p.b excepted (clipped)", "note: s--a/light: color-contrast-incomplete: serious: ocelle-x >>> span excepted (over an image)"],
    });
  });

  it("exits 0 when every serious node is excepted, counting the excepted notes", () => {
    const all = [honoured({ selector: "p.a" }), honoured(), honoured({ rule: "color-contrast-incomplete", selector: "ocelle-x >>> span" })];
    expect(axeVerdict([audit("s--a", "light", rendered(results)), audit("s--a", "dark", rendered())], all).result).toEqual({
      exit: 0,
      summary: "axe: 2 story-theme runs, 0 serious or critical; 3 notes (0 incomplete, 3 excepted)",
    });
  });

  it("finds an unrecorded entry at its index and keeps its node a finding; finds an honoured entry that matched no node stale, after the story-themes' findings", () => {
    const states: ExceptionState[] = [
      honoured({ selector: "p.a" }),
      { entry: base, recorded: false, reason: "specs/x/plan.md does not exist" },
      honoured({ theme: "dark" }),
      honoured({ rule: "color-contrast-incomplete", selector: "ocelle-x >>> span" }),
    ];
    expect(axeVerdict([audit("s--a", "light", rendered(results)), audit("s--a", "dark", rendered())], states)).toEqual({
      result: {
        exit: 1,
        findings: [
          finding("s--a/light", "color-contrast", "serious: p.b"),
          finding("storybook/a11y-exceptions.json#1", "unrecorded-exception", "specs/x/plan.md does not exist"),
          finding("storybook/a11y-exceptions.json#2", "stale-exception", "matches no node: s--a/dark color-contrast p.b"),
        ],
        summary: "axe: 3 findings in 2 story-theme runs",
      },
      notes: ["note: s--a/light: color-contrast: serious: p.a excepted (clipped)", "note: s--a/light: color-contrast-incomplete: serious: ocelle-x >>> span excepted (clipped)"],
    });
  });

  it("never excepts a moderate or minor node: an entry for one is stale, and the node stays a note", () => {
    const moderate: AxeResults = { violations: [{ id: "heading-order", impact: "moderate", nodes: [{ target: ["h3"] }] }], incomplete: [] };
    expect(axeVerdict([audit("s--a", "light", rendered(moderate))], [honoured({ rule: "heading-order", selector: "h3" })])).toEqual({
      result: { exit: 1, findings: [finding("storybook/a11y-exceptions.json#0", "stale-exception", "matches no node: s--a/light heading-order h3")], summary: "axe: 1 finding in 1 story-theme run" },
      notes: ["note: s--a/light: heading-order: moderate: h3"],
    });
  });

  it("finds an entry stale when its story-theme was not audited (axe not run)", () => {
    expect(axeVerdict([audit("s--a", "light", { kind: "render-failed", message: "STORY_MISSING" })], [honoured()]).result).toEqual({
      exit: 1,
      findings: [finding("s--a/light", "render-failed", "STORY_MISSING"), finding("storybook/a11y-exceptions.json#0", "stale-exception", "matches no node: s--a/light color-contrast p.b")],
      summary: "axe: 2 findings in 1 story-theme run",
    });
  });
});
