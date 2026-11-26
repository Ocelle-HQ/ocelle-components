import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate } from "./workspace.ts";

// Stryker's vitest-runner uses vitest.mutation.config.ts: every project of vitest.config.ts except gates-integration,
// tokens-browser, styles-browser, storybook-integration (002 contracts/gates.md § Mutation, 003 research.md R-09) and,
// since 005 (research.md R-11, R-12), elements (mutated by stryker.elements.config.json, with elements-touch since 008
// research.md R-14), elements-build and elements-browser, and since 014 (research.md R-09) elements-browser-file, so a
// mutant that only a tool-, browser- or build-starting test covers is reported as NoCoverage
// (research.md R-08). The test first asserts that the file exists and only then loads it, so at the red commit it
// fails on that assertion.
//
// 007 (research.md R-05, lever 1, narrowed 2026-11-11 after landing L1-01, FR-013): the mutation configuration splits
// the tokens project in two and orders the projects with sequence.groupOrder, so under Stryker's options
// source-table.test.ts starts first, then every other project, the rest of tokens included, in one group in Vitest's
// default order (project name). The deep-equal of the earlier version (every mutation project equal to its
// vitest.config.ts counterpart) is replaced by the stricter comparison below: exact names, each project equal to its
// counterpart once its whole test.sequence is removed (with the two stated split exceptions), each test.sequence
// exactly as R-05 assigns it, and the collected test modules exactly those of vitest.config.ts outside the excluded
// projects (nine since 014), each once.
interface Project {
  readonly test?: { readonly name?: unknown; readonly sequence?: unknown; readonly [key: string]: unknown };
}

interface ConfigModule {
  readonly default: { readonly test?: { readonly projects?: readonly Project[] } };
}

interface ModuleOf {
  readonly project: string;
  readonly module: string;
}

const sourceTable = "packages/tokens/test/source-table.test.ts";
const excluded = [
  "gates-integration",
  "tokens-browser",
  "styles-browser",
  "storybook-integration",
  "elements",
  "elements-touch",
  "elements-build",
  "elements-browser",
  "elements-browser-file",
];
/**
 * The excluded projects as Vitest names a collected module's project: a browser-mode project carries its browser
 * instance, so the in-process elements project (005 research.md R-11) is collected as "elements (chromium)" and its
 * touch twin (008 research.md R-14) as "elements-touch (chromium)".
 */
const excludedCollected = [...excluded, "elements (chromium)", "elements-touch (chromium)"];
const helper = "gates/test/integration/vitest-order.ts";
const timeout = 180_000;

afterEach(cleanUp);

async function projectsOf(file: string): Promise<readonly Project[]> {
  const module = (await import(pathToFileURL(join(repo, file)).href)) as ConfigModule;
  return module.default.test?.projects ?? [];
}

/** The project with its whole test.sequence key removed. */
function withoutSequence(project: Project): Project {
  const test = Object.fromEntries(Object.entries(project.test ?? {}).filter(([key]) => key !== "sequence"));
  return { ...project, test };
}

/** The helper's JSON output (vitest-order.ts), run as a child process from the repository root. */
async function helperRun(args: readonly string[]): Promise<{ readonly code: number | null; readonly json: unknown }> {
  const ran = await runGate(helper, args, { cwd: repo, env: baseEnv() });
  const last = ran.stdout.at(-1) ?? "null";
  return { code: ran.code, json: JSON.parse(last) as unknown };
}

async function collected(config: string): Promise<readonly ModuleOf[]> {
  const ran = await helperRun(["collect", config]);
  expect(ran.code).toBe(0);
  return (ran.json as { readonly modules: readonly ModuleOf[] }).modules;
}

function sorted(values: readonly string[]): string[] {
  return [...values].sort();
}

describe("vitest.mutation.config.ts", () => {
  it("holds every project of vitest.config.ts except gates-integration, tokens-browser, styles-browser, storybook-integration, elements, elements-touch, elements-build, elements-browser and elements-browser-file, with tokens split for the start order", async () => {
    expect(existsSync(join(repo, "vitest.mutation.config.ts"))).toBe(true);
    const all = await projectsOf("vitest.config.ts");
    const mutation = await projectsOf("vitest.mutation.config.ts");
    expect(all.map((project) => project.test?.name)).toEqual([
      "tokens",
      "tokens-browser",
      "styles",
      "styles-browser",
      "elements",
      "elements-touch",
      "elements-node",
      "elements-build",
      "elements-browser",
      "elements-browser-file",
      "storybook",
      "storybook-browser",
      "storybook-integration",
      "gates",
      "gates-integration",
    ]);
    expect(mutation.map((project) => project.test?.name)).toEqual([
      "tokens-source-table",
      "tokens",
      "styles",
      "elements-node",
      "storybook",
      "storybook-browser",
      "gates",
    ]);
    const kept = all.filter((project) => !excluded.includes(String(project.test?.name)));
    const tokens = kept[0] ?? {};
    const tokensExclude = (tokens.test?.exclude ?? []) as readonly string[];
    const counterparts: readonly Project[] = [
      { ...tokens, test: { ...tokens.test, name: "tokens-source-table", include: [sourceTable] } },
      { ...tokens, test: { ...tokens.test, exclude: [...tokensExclude, sourceTable] } },
      ...kept.slice(1),
    ];
    expect(mutation.map(withoutSequence)).toEqual(counterparts);
    expect(mutation.map((project) => project.test?.sequence)).toEqual([
      { groupOrder: 1 },
      { groupOrder: 2 },
      { groupOrder: 2 },
      { groupOrder: 2 },
      { groupOrder: 2 },
      { groupOrder: 2 },
      { groupOrder: 2 },
    ]);
  });

  it(
    "collects exactly the test modules of vitest.config.ts outside the nine excluded projects, each once",
    async () => {
      const all = await collected("vitest.config.ts");
      const mutation = await collected("vitest.mutation.config.ts");
      const expected = all
        .filter((entry) => !excludedCollected.includes(entry.project))
        .map((entry) => entry.module);
      expect(expected.length).toBeGreaterThan(0);
      expect(sorted(mutation.map((entry) => entry.module))).toEqual(sorted(expected));
      expect(new Set(mutation.map((entry) => entry.module)).size).toBe(mutation.length);
      expect(mutation.filter((entry) => entry.project === "tokens-source-table").map((entry) => entry.module)).toEqual([
        sourceTable,
      ]);
    },
    timeout,
  );

  it(
    "under Stryker's runner options starts source-table.test.ts first, then every other project in one group in Vitest's default order",
    async () => {
      const tokenModules = (await collected("vitest.config.ts"))
        .filter((entry) => entry.project === "tokens")
        .map((entry) => entry.module);
      expect(tokenModules).toContain(sourceTable);
      expect(tokenModules).toEqual(
        expect.arrayContaining([
          "packages/tokens/test/build.test.ts",
          "packages/tokens/test/validate.test.ts",
          "packages/tokens/test/generate.test.ts",
        ]),
      );
      // The run stops as soon as a module outside tokens-source-table starts. Every other project is at one
      // groupOrder, so the next module belongs to one of them, and with Vitest's default order (project name)
      // tokens is the last of them, so it is not a tokens module. Which of the others starts first is not fixed by
      // this check; since 005 (research.md R-12) the browser-mode elements project is not in this configuration, so
      // elements-node, gates, storybook, storybook-browser or styles. Check modules that start during cancellation too.
      const ran = await helperRun(["order", "vitest.mutation.config.ts", "tokens-source-table"]);
      expect(ran.code).toBe(0);
      const started = (ran.json as { readonly started: readonly ModuleOf[] }).started;
      expect(started[0]).toEqual({ project: "tokens-source-table", module: sourceTable });
      expect(started.length).toBeGreaterThan(1);
      for (const entry of started.slice(1)) {
        expect(["elements-node", "gates", "storybook", "storybook-browser (chromium)", "styles"]).toContain(entry.project);
      }
    },
    timeout,
  );
});
