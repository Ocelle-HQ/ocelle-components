import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { axeContext, enabledRules, harnessDocumentRules, ruleMeta, ruleOptions, wcagTags } from "../lib/axe-rules.ts";
import type { RuleMeta } from "../lib/axe-rules.ts";

// The axe rule set (FR-016; research.md R-08, PLAN-TESTABILITY-1-012, PLAN-CORRECTNESS-1-010): every rule axe
// enables by default and every rule tagged wcag2a, wcag2aa, wcag21a, wcag21aa or wcag22aa, less the experimental
// rules and the harness-document rules. First on metadata written by hand, then on axe-core 4.14.0's own metadata,
// read from node_modules/axe-core and sorted here independently of the module, so an upgrade that adds a rule of
// either kind fails until it is sorted.

/** A rule's metadata: default-enabled, its tags and selector. */
function rule(id: string, enabled: boolean, tags: readonly string[], selector = "*"): RuleMeta {
  return { id, tags, enabled, selector };
}

describe("wcagTags and harnessDocumentRules (FR-016)", () => {
  it("are the five WCAG tags and the eight rules that judge the preview document", () => {
    expect({ wcagTags, harnessDocumentRules }).toEqual({
      wcagTags: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
      harnessDocumentRules: ["bypass", "document-title", "html-has-lang", "html-lang-valid", "html-xml-lang-mismatch", "landmark-one-main", "page-has-heading-one", "region"],
    });
  });
});

describe("enabledRules and ruleOptions on written metadata (research.md R-08)", () => {
  const rules = [
    rule("best-practice-on", true, ["cat.semantics", "best-practice"]),
    rule("wcag22-off", false, ["cat.keyboard", "wcag22aa"]),
    rule("other-off", false, ["cat.other", "wcag2aaa", "best-practice"]),
    rule("experimental-wcag", true, ["experimental", "wcag2a"]),
    rule("region", true, ["cat.keyboard", "best-practice"], "body *"),
    rule("wcag21a-off", false, ["wcag21a"]),
    rule("wcag2aa-on", true, ["wcag2aa"]),
    rule("bypass", true, ["wcag2a"], "html:not(html *)"),
    rule("wcag21aa-off", false, ["wcag21aa"]),
    rule("wcag2a-off", false, ["wcag2a"]),
    rule("wcag2aa-off", false, ["wcag2aa"]),
  ];

  it("keeps a default rule, enables a WCAG-tagged one, leaves an untagged one off, disables experimental and harness-document rules, in metadata order", () => {
    expect(enabledRules(rules)).toEqual(["best-practice-on", "wcag22-off", "wcag21a-off", "wcag2aa-on", "wcag21aa-off", "wcag2a-off", "wcag2aa-off"]);
  });

  it("gives axe.run every rule, enabled exactly when the selection runs it", () => {
    expect(ruleOptions(rules)).toEqual({
      "best-practice-on": { enabled: true },
      "wcag22-off": { enabled: true },
      "other-off": { enabled: false },
      "experimental-wcag": { enabled: false },
      region: { enabled: false },
      "wcag21a-off": { enabled: true },
      "wcag2aa-on": { enabled: true },
      bypass: { enabled: false },
      "wcag21aa-off": { enabled: true },
      "wcag2a-off": { enabled: true },
      "wcag2aa-off": { enabled: true },
    });
  });

  it("selects nothing from no metadata", () => {
    expect([enabledRules([]), ruleOptions([])]).toEqual([[], {}]);
  });
});

describe("ruleMeta", () => {
  it("reads the id, tags, default enabled flag and selector of axe's rule objects, a missing selector as *", () => {
    const objects = [
      { id: "a", tags: ["wcag2a", "x"], enabled: true, selector: "img", impact: "serious", any: [] },
      { id: "b", tags: [], enabled: false },
    ];
    expect(ruleMeta(objects)).toEqual([
      { id: "a", tags: ["wcag2a", "x"], enabled: true, selector: "img" },
      { id: "b", tags: [], enabled: false, selector: "*" },
    ]);
  });
});

describe("axeContext (research.md R-08, spike § 3)", () => {
  it("excludes Storybook's harness nodes, by id and by class, and includes everything else", () => {
    expect(axeContext()).toEqual({
      exclude: [["#storybook-docs"], ["#scripts-root"], [".sb-preparing-story"], [".sb-preparing-docs"], [".sb-nopreview"], [".sb-errordisplay"]],
    });
  });
});

// axe-core 4.14.0's own metadata (FR-016: "a test derives the list from axe-core's own rule metadata").
describe("axe-core 4.14.0's rules (FR-016)", () => {
  const require = createRequire(import.meta.url);
  const axe = require("axe-core") as { version: string; _audit: { rules: { id: string; tags: string[]; enabled: boolean; selector?: string }[] } };
  const meta: RuleMeta[] = axe._audit.rules.map((each) => ({ id: each.id, tags: [...each.tags], enabled: each.enabled, selector: each.selector ?? "*" }));
  const wcag = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
  const harnessRules = ["bypass", "document-title", "html-has-lang", "html-lang-valid", "html-xml-lang-mismatch", "landmark-one-main", "page-has-heading-one", "region"];
  /** Whether one part of a rule's selector list selects the document element only (`html…:not(html *)`). */
  const documentElement = (selector: string): boolean => selector.split(",").some((part) => /^html(\[[^\]]*\]|:not\(\[[^\]]*\]\))*:not\(html \*\)$/.test(part.trim()));

  it("is the pinned version", () => {
    expect(axe.version).toBe("4.14.0");
  });

  it("enables exactly the rules derived here from the metadata, the 85 rules the phase 1 spike ran", () => {
    const derived = meta.filter((each) => (each.enabled || each.tags.some((tag) => wcag.includes(tag))) && !each.tags.includes("experimental") && !harnessRules.includes(each.id)).map((each) => each.id);
    const spike = (JSON.parse(readFileSync(new URL("../../specs/006-storybook-workbench/reviews/phase-1/spike-axe.json", import.meta.url), "utf8")) as { enabledRules: string[] }).enabledRules;
    expect(enabledRules(meta)).toEqual(derived);
    expect(derived).toEqual(spike);
    expect(derived).toHaveLength(85);
  });

  it("sorts every document-element rule: a harness-document rule, experimental, or one of the two that judge a story's frames", () => {
    const rules = meta.filter((each) => documentElement(each.selector));
    const unsorted = rules.filter((each) => !harnessDocumentRules.includes(each.id) && !each.tags.includes("experimental") && !["frame-focusable-content", "frame-tested"].includes(each.id));
    expect(rules.map((each) => each.id)).toEqual(["bypass", "css-orientation-lock", "document-title", "frame-focusable-content", "frame-tested", "html-has-lang", "html-lang-valid", "html-xml-lang-mismatch", "landmark-one-main", "page-has-heading-one"]);
    expect(unsorted).toEqual([]);
    expect(enabledRules(meta).filter((id) => rules.some((each) => each.id === id))).toEqual(["frame-focusable-content", "frame-tested"]);
  });

  it("names harness-document rules that exist in the metadata, and runs none of them", () => {
    expect(harnessDocumentRules.filter((id) => !meta.some((each) => each.id === id))).toEqual([]);
    expect(Object.entries(ruleOptions(meta)).filter(([id, option]) => harnessDocumentRules.includes(id) && option.enabled)).toEqual([]);
  });
});
