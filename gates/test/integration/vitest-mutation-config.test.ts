import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { baseEnv, cleanUp, repo, runGate } from "./workspace.ts";

// Stryker's vitest-runner uses vitest.mutation.config.ts: every project of vitest.config.ts except gates-integration,
// tokens-browser, styles-browser and storybook-integration (002 contracts/gates.md § Mutation, 003 research.md R-09),
// so a mutant that only a tool-, browser- or build-starting test covers is reported as NoCoverage (research.md R-08). The test first asserts that the file exists and only then loads it,
// so at the red commit it fails on that assertion.
//
// 007 (research.md R-05, lever 1): the mutation configuration splits the tokens project in two and orders the
// projects with sequence.groupOrder, so under Stryker's options source-table.test.ts starts first, then the other
// token tests, then every other project. The deep-equal of the earlier version (every mutation project equal to its
// vitest.config.ts counterpart) is replaced by the stricter comparison below: exact names, each project equal to its
// counterpart once its whole test.sequence is removed (with the two stated split exceptions), each test.sequence
// exactly as R-05 assigns it, and the collected test modules exactly those of vitest.config.ts outside the four
// excluded projects, each once.
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
const excluded = ["gates-integration", "tokens-browser", "styles-browser", "storybook-integration"];
const tokenProjects = ["tokens-source-table", "tokens"];
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
  it("holds every project of vitest.config.ts except gates-integration, tokens-browser, styles-browser and storybook-integration, with tokens split for the start order", async () => {
    expect(existsSync(join(repo, "vitest.mutation.config.ts"))).toBe(true);
    const all = await projectsOf("vitest.config.ts");
    const mutation = await projectsOf("vitest.mutation.config.ts");
    expect(all.map((project) => project.test?.name)).toEqual([
      "tokens",
      "tokens-browser",
      "styles",
      "styles-browser",
      "elements",
      "storybook",
      "storybook-integration",
      "gates",
      "gates-integration",
    ]);
    expect(mutation.map((project) => project.test?.name)).toEqual([
      "tokens-source-table",
      "tokens",
      "styles",
      "elements",
      "storybook",
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
      { groupOrder: 3 },
      { groupOrder: 3 },
      { groupOrder: 3 },
      { groupOrder: 3 },
    ]);
  });

  it(
    "collects exactly the test modules of vitest.config.ts outside the four excluded projects, each once",
    async () => {
      const all = await collected("vitest.config.ts");
      const mutation = await collected("vitest.mutation.config.ts");
      const expected = all
        .filter((entry) => !excluded.includes(entry.project))
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
    "under Stryker's runner options starts source-table.test.ts first, then every other token test, then the other projects",
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
      const ran = await helperRun(["order", "vitest.mutation.config.ts", tokenProjects.join(",")]);
      expect(ran.code).toBe(0);
      const started = (ran.json as { readonly started: readonly ModuleOf[] }).started;
      expect(started[0]).toEqual({ project: "tokens-source-table", module: sourceTable });
      const firstOther = started.findIndex((entry) => !tokenProjects.includes(entry.project));
      expect(firstOther).toBe(tokenModules.length);
      expect(sorted(started.slice(0, firstOther).map((entry) => entry.module))).toEqual(sorted(tokenModules));
    },
    timeout,
  );
});
