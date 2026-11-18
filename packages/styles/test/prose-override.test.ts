import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse, rules } from "./source-checks.ts";
import type { RuleEntry } from "./source-checks.ts";

// The data table's prose override (019 FR-012; contracts/styles-data-table.md § Block 2; research.md R-06,
// PLAN-TESTABILITY-1-008; tasks.md T011). It does not list 003's selector forms: it parses src/base.css, takes every
// `[data-ocelle-prose=""]` rule that is not the override and whose descendant selector can match a table part (a
// table, caption, row group, row, column or cell; pseudo-classes included, so `:where(table:focus-visible)` is read),
// and fails on any of its properties the override (the `[data-ocelle-prose=""] :where(ocelle-data-table …)` rules)
// does not restate on the matching target: the table, the sticky table, the caption, the cells, the column headers
// and the row headers. A property that cannot apply inside the element is in the not-applicable list with its reason,
// asserted exactly. A later 003 rule on `tr`, a row group or `col` is read too, and fails until the override takes it.
const text = readFileSync(new URL("../src/base.css", import.meta.url), "utf8");

const hook = '[data-ocelle-prose=""]';

/** Properties of a prose rule that cannot apply inside the element, with the reason (asserted exactly). */
export const notApplicable: readonly { readonly selector: string; readonly property: string; readonly reason: string }[] = [
  { selector: ':where(table:focus-visible)', property: "outline", reason: "the region's box is the tab stop, not the table" },
  { selector: ':where(table:focus-visible)', property: "outline-offset", reason: "the region's box is the tab stop, not the table" },
];

/** The table parts a selector's descendant part can match, by element name; pseudo-classes are kept with their name. */
const parts: Readonly<Record<string, readonly string[]>> = {
  table: ["table"],
  caption: ["caption"],
  thead: ["rowgroup"],
  tbody: ["rowgroup"],
  tfoot: ["rowgroup"],
  tr: ["row"],
  col: ["column"],
  colgroup: ["column"],
  th: ["column header", "row header"],
  td: ["cell"],
};

/** The targets of the override, each with the override selector suffix that restates it. */
function targetOf(selector: string): string[] {
  const inner = selector.slice(hook.length).trim();
  if (!inner.includes("ocelle-data-table")) return [];
  if (inner.includes("[sticky-header] > table)")) return ["sticky table"];
  if (inner.endsWith("> table)")) return ["table"];
  if (inner.endsWith("> caption)")) return ["caption"];
  if (inner.includes(":last-child")) return [];
  if (inner.includes('th[scope="col"]')) return ["column header"];
  if (inner.includes('th[scope="row"]')) return ["row header"];
  if (inner.includes(":is(td, th))")) return ["cell", "column header", "row header"];
  return [];
}

/** The table parts a non-override prose rule's selector can match ([] for the container itself and other elements). */
function partsOf(selector: string): string[] {
  if (!selector.startsWith(`${hook} `)) return [];
  const inner = selector.slice(hook.length + 1);
  const names = [...inner.matchAll(/(?<![-\w])(table|caption|thead|tbody|tfoot|tr|colgroup|col|th|td)(?![-\w])/g)].map((match) => match[1] ?? "");
  return [...new Set(names.flatMap((name) => parts[name] ?? []))];
}

/** Which properties the override restates on each target. */
function restated(all: readonly RuleEntry[]): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  for (const rule of all) {
    if (rule.media.length > 0) continue;
    for (const selector of rule.selectors) {
      for (const target of targetOf(selector)) {
        const set = found.get(target) ?? new Set<string>();
        for (const [property] of rule.declarations) set.add(property);
        found.set(target, set);
      }
    }
  }
  return found;
}

/**
 * Every prose property on a table part that the override does not restate there, as `<target> <property> (<prose
 * selector>)`; the not-applicable list's entries are skipped. The sticky table must restate what the prose rules set
 * on a table and block 1's sticky-table rule changes (its border model).
 */
export function missing(css: string): string[] {
  const all = rules(parse(css));
  const restates = restated(all);
  const stickyBlock1 = new Set(all.filter((rule) => rule.media.length === 0 && rule.selectors.includes(":where(ocelle-data-table[sticky-header] > table)")).flatMap((rule) => rule.declarations.map(([property]) => property)));
  const found: string[] = [];
  for (const rule of all) {
    for (const selector of rule.selectors) {
      if (selector.includes("ocelle-data-table")) continue;
      const inner = selector.slice(hook.length).trim();
      for (const part of partsOf(selector)) {
        const targets = part === "table" ? ["table", "sticky table"] : part === "cell" ? ["cell"] : [part];
        for (const target of targets) {
          for (const [property] of rule.declarations) {
            if (notApplicable.some((entry) => entry.selector === inner && entry.property === property)) continue;
            if (target === "sticky table" && !stickyBlock1.has(property)) continue;
            if (part === "rowgroup" || part === "row" || part === "column") {
              found.push(`${part} ${property} (${selector})`);
              continue;
            }
            if (!(restates.get(target)?.has(property) ?? false)) found.push(`${target} ${property} (${selector})`);
          }
        }
      }
    }
  }
  return found;
}

describe("the data table's prose override in src/base.css (FR-012, R-06)", () => {
  it("restates on each target every property a prose rule sets on a table part, the sticky table's border model included, with exactly the not-applicable list", () => {
    const override = rules(parse(text)).filter((rule) => rule.selectors.some((selector) => selector.startsWith(hook) && selector.includes("ocelle-data-table")));
    expect({
      targets: [...restated(rules(parse(text))).keys()].sort(),
      overrideRules: override.length > 0,
      missing: missing(text),
      notApplicable: notApplicable.map(({ selector, property }) => `${selector} ${property}`),
    }).toEqual({
      targets: ["caption", "cell", "column header", "row header", "sticky table", "table"],
      overrideRules: true,
      missing: [],
      notApplicable: [":where(table:focus-visible) outline", ":where(table:focus-visible) outline-offset"],
    });
  });

  it("reports a property of the override removed, a later prose rule on a row, and a new prose property on the caption (the check is not vacuous)", () => {
    const withoutPadding = text.replace(/(\[data-ocelle-prose=""\] :where\(ocelle-data-table > table > :is\(thead, tbody, tfoot\) > tr > :is\(td, th\)\) \{[^}]*?)\n\s*padding: [^;]*;/, "$1");
    const withRow = `${text}\n[data-ocelle-prose=""] :where(tr:hover) { background-color: red; }\n`;
    const withCaption = `${text}\n[data-ocelle-prose=""] :where(caption) { letter-spacing: 1px; }\n`;
    expect({
      removed: withoutPadding !== text && missing(withoutPadding).some((each) => each.startsWith("cell padding ")),
      row: missing(withRow).filter((each) => each.startsWith("row ")),
      caption: missing(withCaption).filter((each) => each.startsWith("caption letter-spacing")),
    }).toEqual({
      removed: true,
      row: ['row background-color ([data-ocelle-prose=""] :where(tr:hover))'],
      caption: ['caption letter-spacing ([data-ocelle-prose=""] :where(caption))'],
    });
  });
});
