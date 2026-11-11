// Stryker's Vitest configuration (stryker.config.json, research.md R-08): every project of vitest.config.ts except
// gates-integration, whose tests start real tools, tokens-browser and styles-browser, whose tests start Chromium
// (003 research.md R-09), and storybook-integration, whose global setup builds the Storybook (002 research.md R-03, R-10, contracts/gates.md
// § Mutation). Stryker runs only in-process tests for each mutant, so a mutant that only an
// excluded project's test covers is reported as NoCoverage, and a shard's time follows its line bound.
//
// The start order (007 research.md R-05, lever 1, operator decision PLAN-FRESH-3-001 (a), narrowed on 2026-11-11).
// Stryker's runner runs the test files one after the other with bail, and a static mutant (every token record of
// packages/tokens/src/source.ts) runs every test file. Vitest orders files by sequence.groupOrder, then by project
// name, so with no order the token tests ran last and such a mutant timed out behind every other project's files.
// Here only, tokens is split in two: tokens-source-table holds source-table.test.ts alone at groupOrder 1, so it
// starts first in every Stryker run. source-table.test.ts compares every record's value and group with expected.ts,
// so a kill there is a kill on the record. It must come before build.test.ts, which runs scripts/build.ts in a child
// Node process: the child imports the instrumented source with no active mutant (Stryker activates a mutant only
// inside the Vitest worker), so that test fails on any mutant that changes the stylesheet, equivalent or not.
// Every other project, the rest of tokens included, is one group at groupOrder 2, in Vitest's default order by
// project name (none at 0: under Stryker's maxWorkers 1 a project at 0 joins a sequential group that runs last). The
// first version also ran the rest of tokens before every other project; landing review L1-01 showed that this put
// build.test.ts's child processes ahead of every static mutant of gate source, so kills there became Timeouts
// (spec FR-013), and the operator narrowed lever 1 to source-table.test.ts alone on 2026-11-11. vitest.config.ts and
// pnpm test keep their projects and order.
import { defineConfig } from "vitest/config";
import base from "./vitest.config.ts";

/** The projects Stryker does not run. */
const excluded = new Set(["gates-integration", "tokens-browser", "styles-browser", "storybook-integration"]);

/** The token test that starts every Stryker run. */
const sourceTable = "packages/tokens/test/source-table.test.ts";

type Project = NonNullable<NonNullable<typeof base.test>["projects"]>[number];

function nameOf(project: Project): string {
  return typeof project === "object" && "test" in project && typeof project.test.name === "string" ? project.test.name : "";
}

const kept = (base.test?.projects ?? []).filter((project) => !excluded.has(nameOf(project)));

const projects = kept.flatMap((project): Project[] => {
  if (typeof project !== "object" || !("test" in project)) return [project];
  if (nameOf(project) !== "tokens") return [{ ...project, test: { ...project.test, sequence: { groupOrder: 2 } } }];
  const exclude = project.test.exclude ?? [];
  return [
    { ...project, test: { ...project.test, name: "tokens-source-table", include: [sourceTable], sequence: { groupOrder: 1 } } },
    { ...project, test: { ...project.test, exclude: [...exclude, sourceTable], sequence: { groupOrder: 2 } } },
  ];
});

export default defineConfig({ test: { projects } });
