import { globSync } from "node:fs";
import { matchesGlob } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import base from "../../vitest.config.ts";
import mutation from "../../vitest.mutation.config.ts";

// The Vitest projects and the mutation runs (002 contracts/gates.md § Mutation, research.md R-03 *Mutation path*;
// PLAN-FRESH-2-002): vitest.mutation.config.ts drops exactly the projects whose tests start tools or a browser, and,
// resolving every project's include and exclude against the repository's test files, each test file belongs to
// exactly one project, so none sits both in a project Stryker runs and in one it excludes. The check fails if the
// tokens project's browser exclude or the gates project's integration exclude is removed.
interface Project {
  readonly name: string;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
}

function projectsOf(config: typeof base): Project[] {
  return (config.test?.projects ?? []).map((project) => {
    const test = (project as { test?: { name?: unknown; include?: string[]; exclude?: string[] } }).test ?? {};
    return { name: String(test.name), include: test.include ?? [], exclude: test.exclude ?? [] };
  });
}

const repo = fileURLToPath(new URL("../..", import.meta.url));
const all = projectsOf(base);
const kept = projectsOf(mutation);

/** The repository's test files: every *.test.ts outside installed packages, dot directories, plants and fixtures. */
const testFiles = globSync("**/*.test.ts", { cwd: repo })
  .map((path) => path.split("\\").join("/"))
  .filter((path) => !path.split("/").some((part) => part === "node_modules" || part === "dist" || part.startsWith(".")))
  .filter((path) => !path.startsWith("gates/plants/") && !path.startsWith("gates/test/fixtures/"))
  .sort();

function inProject(project: Project, path: string): boolean {
  return project.include.some((glob) => matchesGlob(path, glob)) && !project.exclude.some((glob) => matchesGlob(path, glob));
}

describe("vitest.mutation.config.ts", () => {
  it("excludes exactly gates-integration and tokens-browser from the projects of vitest.config.ts", () => {
    expect(all.map((project) => project.name).filter((name) => !kept.some((project) => project.name === name))).toEqual(["tokens-browser", "gates-integration"]);
    expect(kept).toEqual(all.filter((project) => project.name !== "gates-integration" && project.name !== "tokens-browser"));
  });
});

describe("the Vitest projects", () => {
  it("put each test file of the repository in exactly one project", () => {
    const owners = Object.fromEntries(testFiles.map((path) => [path, all.filter((project) => inProject(project, path)).map((project) => project.name)]));
    const notOne = Object.fromEntries(Object.entries(owners).filter(([, names]) => names.length !== 1));
    expect(notOne).toEqual({});
    expect(testFiles).toContain("packages/tokens/test/browser/themes.test.ts");
    expect(owners["packages/tokens/test/browser/themes.test.ts"]).toEqual(["tokens-browser"]);
  });

  it("keep no test file both in a project Stryker runs and in one it excludes", () => {
    const excluded = all.filter((project) => !kept.some((each) => each.name === project.name));
    const both = testFiles.filter((path) => kept.some((project) => inProject(project, path)) && excluded.some((project) => inProject(project, path)));
    expect(both).toEqual([]);
    expect(testFiles.filter((path) => excluded.some((project) => inProject(project, path))).length).toBeGreaterThan(3);
  });
});
